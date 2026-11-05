const { db } = require("../../connect");
const moment = require("moment-timezone");
const dotenv = require("dotenv");
dotenv.config();

const TZ = process.env.TZ || "Asia/Kolkata";

/**
 * 3a. Assign Proforma to SF Outbox Queue
 * POST /re-sf/assign
 * Protected by: authenticateToken + requireRole(['Owner'])
 */
exports.assignToSF = (req, res) => {
  (async () => {
    try {
      const { proforma_id } = req.body;

      if (!proforma_id) {
        return res.status(400).json({
          status: "Failure",
          message: "proforma_id is required",
        });
      }

      // 1. Fetch Proforma along with client details
      const findProformaSQL = `
        SELECT 
          p.id AS proforma_id,
          p.txn_id,
          p.proforma_number,
          p.client_id,
          p.duration_start_date,
          p.duration_end_date,
          p.pricing_snapshot,
          p.ads_snapshot,
          c.client_name,
          c.client_organization
        FROM re_proposal_proforma p
        LEFT JOIN re_revenue_engine_client_details c ON p.client_id = c.id
        WHERE p.id = ?
        LIMIT 1
      `;

      db.query(findProformaSQL, [proforma_id], (err, proformaRows) => {
        if (err) {
          console.error("[re_syncController.assignToSF] Proforma query error:", err);
          return res.status(500).json({ status: "Failure", message: "Database Error" });
        }

        if (!proformaRows || proformaRows.length === 0) {
          return res.status(404).json({
            status: "Failure",
            message: "Proforma not found",
          });
        }

        const proforma = proformaRows[0];

        // 2. Check if this proforma is already registered in re_project_sync
        const checkSyncSQL = "SELECT id FROM re_project_sync WHERE proforma_id = ? LIMIT 1";
        db.query(checkSyncSQL, [proforma_id], (syncErr, syncRows) => {
          if (syncErr) {
            console.error("[re_syncController.assignToSF] Sync check error:", syncErr);
            return res.status(500).json({ status: "Failure", message: "Database Error" });
          }

          if (syncRows && syncRows.length > 0) {
            return res.status(409).json({
              status: "Failure",
              message: "Proforma already assigned/synced to SF",
            });
          }

          // 3. Parse service items from pricing_snapshot & ads_snapshot
          let pricingItems = [];
          try {
            pricingItems = typeof proforma.pricing_snapshot === "string"
              ? JSON.parse(proforma.pricing_snapshot)
              : (proforma.pricing_snapshot || []);
          } catch (_) {
            pricingItems = [];
          }

          let adsItems = [];
          try {
            adsItems = typeof proforma.ads_snapshot === "string"
              ? JSON.parse(proforma.ads_snapshot)
              : (proforma.ads_snapshot || []);
          } catch (_) {
            adsItems = [];
          }

          const service_items = [];
          if (Array.isArray(pricingItems)) {
            pricingItems.forEach((item) => {
              if (!item) return;
              service_items.push({
                name: item.service_name || item.name || "Service",
                category: item.category_name || item.category || "",
                description: item.editing_type_name || item.description || "",
                quantity: item.quantity != null ? Number(item.quantity) : null,
              });
            });
          }

          if (Array.isArray(adsItems)) {
            adsItems.forEach((ad) => {
              if (!ad) return;
              service_items.push({
                name: ad.service_name || "Ads Campaign",
                category: ad.category_name || "Ads",
                description: ad.editing_type_name || `Budget: ₹${ad.budget || ad.amount || 0}`,
                quantity: null,
              });
            });
          }

          const now = moment().tz(TZ).format("YYYY-MM-DD HH:mm:ss");
          const idempotency_key = `${proforma.proforma_id}-assigned-${Date.now()}`;
          const startDate = proforma.duration_start_date
            ? moment(proforma.duration_start_date).tz(TZ).format("YYYY-MM-DD")
            : null;
          const endDate = proforma.duration_end_date
            ? moment(proforma.duration_end_date).tz(TZ).format("YYYY-MM-DD")
            : null;

          const assignedByEmployeeId = req.user?.id || 1;
          const assignedByName = req.user?.employee_name || "Owner";
          const assignedByRole = req.user?.employee_role || "Owner";

          // 4. Construct event payload
          const eventPayload = {
            event_type: "project.assigned",
            idempotency_key,
            proforma_id: Number(proforma.proforma_id),
            proforma_number: proforma.proforma_number || `PROF-${proforma.proforma_id}`,
            txn_id: proforma.txn_id || null,
            client_name: proforma.client_name || "Valued Client",
            start_date: startDate,
            end_date: endDate,
            assigned_by: {
              employee_id: assignedByEmployeeId,
              name: assignedByName,
              role: assignedByRole,
            },
            service_items,
          };

          // 5. Transaction: insert re_project_sync and re_webhook_outbox atomically
          db.beginTransaction((txErr) => {
            if (txErr) {
              console.error("[re_syncController.assignToSF] Transaction error:", txErr);
              return res.status(500).json({ status: "Failure", message: "Transaction Error" });
            }

            const insertSyncSQL = `
              INSERT INTO re_project_sync
                (proforma_id, txn_id, assigned_by_employee_id, current_status, assigned_at)
              VALUES (?, ?, ?, 'assigned', ?)
            `;

            db.query(
              insertSyncSQL,
              [proforma.proforma_id, proforma.txn_id || null, assignedByEmployeeId, now],
              (insertSyncErr, syncResult) => {
                if (insertSyncErr) {
                  return db.rollback(() => {
                    console.error("[re_syncController.assignToSF] Insert sync error:", insertSyncErr);
                    return res.status(500).json({ status: "Failure", message: "Database Error on Sync Record" });
                  });
                }

                const insertOutboxSQL = `
                  INSERT INTO re_webhook_outbox
                    (event_type, payload, status, attempts, idempotency_key, created_at)
                  VALUES ('project.assigned', ?, 'pending', 0, ?, ?)
                `;

                db.query(
                  insertOutboxSQL,
                  [JSON.stringify(eventPayload), idempotency_key, now],
                  (outboxErr) => {
                    if (outboxErr) {
                      return db.rollback(() => {
                        console.error("[re_syncController.assignToSF] Insert outbox error:", outboxErr);
                        return res.status(500).json({ status: "Failure", message: "Database Error on Outbox Queue" });
                      });
                    }

                    db.commit((commitErr) => {
                      if (commitErr) {
                        return db.rollback(() => {
                          console.error("[re_syncController.assignToSF] Commit error:", commitErr);
                          return res.status(500).json({ status: "Failure", message: "Commit Error" });
                        });
                      }

                      return res.status(200).json({
                        status: "Success",
                        message: "Project queued for SF handoff",
                        data: {
                          proforma_id: Number(proforma.proforma_id),
                          sync_id: syncResult.insertId,
                        },
                      });
                    });
                  }
                );
              }
            );
          });
        });
      });
    } catch (error) {
      console.error("[re_syncController.assignToSF] Unhandled exception:", error);
      return res.status(500).json({ status: "Failure", message: "Internal Server Error" });
    }
  })();
};

/**
 * 3b. Receive Status Update from SF Webhook
 * POST /re-sf/webhook/status-updated
 * No authenticateToken; verifies x-webhook-secret
 */
exports.receiveStatusUpdate = (req, res) => {
  (async () => {
    try {
      const webhookSecret = req.headers["x-webhook-secret"];
      const expectedSecret = process.env.SF_WEBHOOK_SECRET || "sf_webhook_secret_2026";

      if (!expectedSecret || !webhookSecret || webhookSecret !== expectedSecret) {
        return res.status(401).json({
          status: "Failure",
          message: "Unauthorized: invalid or missing webhook secret",
        });
      }

      const {
        idempotency_key,
        proforma_id,
        current_status,
        is_active,
        sf_project_id,
        tasks,
        updated_at,
      } = req.body;

      if (!idempotency_key || !proforma_id) {
        return res.status(400).json({
          status: "Failure",
          message: "idempotency_key and proforma_id are required",
        });
      }

      // Check idempotency in re_webhook_inbox_log
      const checkInboxSQL = "SELECT id FROM re_webhook_inbox_log WHERE idempotency_key = ? LIMIT 1";
      db.query(checkInboxSQL, [idempotency_key], (inboxErr, inboxRows) => {
        if (inboxErr) {
          console.error("[re_syncController.receiveStatusUpdate] Inbox check error:", inboxErr);
          return res.status(500).json({ status: "Failure", message: "Database Error" });
        }

        if (inboxRows && inboxRows.length > 0) {
          return res.status(200).json({
            status: "Success",
            message: "Status synced (idempotent duplicate skipped)",
          });
        }

        const now = moment().tz(TZ).format("YYYY-MM-DD HH:mm:ss");
        const statusTime = updated_at ? moment(updated_at).tz(TZ).format("YYYY-MM-DD HH:mm:ss") : now;

        const insertInboxSQL = `
          INSERT INTO re_webhook_inbox_log
            (event_type, idempotency_key, payload, received_at, processed)
          VALUES ('project.status_updated', ?, ?, ?, 1)
        `;

        db.query(insertInboxSQL, [idempotency_key, JSON.stringify(req.body), now], (logErr) => {
          if (logErr) {
            console.error("[re_syncController.receiveStatusUpdate] Log insert error:", logErr);
            return res.status(500).json({ status: "Failure", message: "Database Error" });
          }

          let isActiveVal = null;
          if (typeof is_active !== "undefined") {
            isActiveVal = is_active === true || is_active === 1 || is_active === "1" || is_active === "true" ? 1 : 0;
          }

          // Check previous current_status to detect transitions to 'blocked'
          db.query(
            "SELECT current_status FROM re_project_sync WHERE proforma_id = ? LIMIT 1",
            [proforma_id],
            (prevErr, prevRows) => {
              const previousStatus = prevRows && prevRows.length > 0 ? prevRows[0].current_status : null;
              const isTransitionToBlocked = current_status === "blocked" && previousStatus !== "blocked";

          const updateSyncSQL = `
            UPDATE re_project_sync
            SET 
              current_status = COALESCE(?, current_status),
              is_active = COALESCE(?, is_active),
              sf_project_id = COALESCE(?, sf_project_id),
              last_status_update_at = ?,
              last_status_payload = ?
            WHERE proforma_id = ?
          `;

          db.query(
            updateSyncSQL,
            [
              current_status || null,
              isActiveVal,
              sf_project_id || null,
              statusTime,
              JSON.stringify(req.body),
              proforma_id,
            ],
            async (updateErr) => {
              if (updateErr) {
                console.error("[re_syncController.receiveStatusUpdate] Sync update error:", updateErr);
                return res.status(500).json({ status: "Failure", message: "Database Error" });
              }

              // Trigger Blocker notification if newly transitioned to 'blocked'
              if (isTransitionToBlocked) {
                try {
                  const { notifyProjectBlocked } = require("../re_services/notificationService");
                  notifyProjectBlocked({
                    proformaId: proforma_id,
                    clientName: req.body.client_name,
                    proformaNumber: req.body.proforma_number,
                  }).catch((e) => console.error("[re_syncController] notifyProjectBlocked async error:", e.message));
                } catch (notifErr) {
                  console.error("[re_syncController] notifyProjectBlocked load error:", notifErr.message);
                }
              }

              // Fetch project_sync row to obtain project_sync_id for tasks upsert
              db.query(
                "SELECT id FROM re_project_sync WHERE proforma_id = ? LIMIT 1",
                [proforma_id],
                async (getErr, syncRows) => {
                  if (getErr) {
                    console.error("[re_syncController.receiveStatusUpdate] Find sync error:", getErr);
                    return res.status(500).json({ status: "Failure", message: "Database Error" });
                  }

                  const projectSyncId = syncRows && syncRows.length > 0 ? syncRows[0].id : null;

                  if (projectSyncId && Array.isArray(tasks) && tasks.length > 0) {
                    try {
                      for (const t of tasks) {
                        if (!t) continue;
                        const sfTaskId = t.sf_task_id ? String(t.sf_task_id) : null;
                        const taskName = t.task_name || "Task";
                        const taskDesc = t.task_description || null;
                        const assigneeName = t.assigned_to_name || null;
                        const assigneeRole = t.assigned_to_role || null;
                        const deadline = t.deadline ? moment(t.deadline).format("YYYY-MM-DD") : null;
                        const status = t.status || "pending";

                        if (sfTaskId) {
                          const existingTaskId = await new Promise((resolve) => {
                            db.query(
                              "SELECT id FROM re_project_sync_tasks WHERE project_sync_id = ? AND sf_task_id = ? LIMIT 1",
                              [projectSyncId, sfTaskId],
                              (qErr, qRows) => resolve(qRows && qRows.length > 0 ? qRows[0].id : null)
                            );
                          });

                          if (existingTaskId) {
                            await new Promise((resolve, reject) => {
                              db.query(
                                `UPDATE re_project_sync_tasks
                                 SET task_name = ?, task_description = ?, assigned_to_name = ?, assigned_to_role = ?, deadline = ?, status = ?, last_updated_at = ?
                                 WHERE id = ?`,
                                [taskName, taskDesc, assigneeName, assigneeRole, deadline, status, statusTime, existingTaskId],
                                (uErr) => (uErr ? reject(uErr) : resolve())
                              );
                            });
                            continue;
                          }
                        }

                        // Insert new task
                        await new Promise((resolve, reject) => {
                          db.query(
                            `INSERT INTO re_project_sync_tasks
                             (project_sync_id, sf_task_id, task_name, task_description, assigned_to_name, assigned_to_role, deadline, status, last_updated_at)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [projectSyncId, sfTaskId, taskName, taskDesc, assigneeName, assigneeRole, deadline, status, statusTime],
                            (iErr) => (iErr ? reject(iErr) : resolve())
                          );
                        });
                      }
                    } catch (taskUpsertErr) {
                      console.error("[re_syncController.receiveStatusUpdate] Task upsert error:", taskUpsertErr);
                    }
                  }

                  return res.status(200).json({
                    status: "Success",
                    message: "Status synced",
                    data: {
                      proforma_id,
                      current_status: current_status || "updated",
                      is_active: isActiveVal != null ? isActiveVal : 1,
                      tasks_synced: Array.isArray(tasks) ? tasks.length : 0,
                    },
                  });
                }
              );
            }
          );
            }
          ); // closes prevSync check query
        });
      });
    } catch (error) {
      console.error("[re_syncController.receiveStatusUpdate] Unhandled error:", error);
      return res.status(500).json({ status: "Failure", message: "Internal Server Error" });
    }
  })();
};

/**
 * 3c. Get Calendar Data
 * GET /re-sf/calendar
 * Protected by: authenticateToken
 */
exports.getCalendarData = (req, res) => {
  (async () => {
    try {
      const getCalendarSQL = `
        SELECT 
          s.id AS sync_id,
          s.id,
          s.proforma_id,
          s.txn_id,
          s.sf_project_id,
          s.assigned_by_employee_id,
          s.assigned_at,
          s.current_status,
          s.current_status AS sf_status,
          s.is_active,
          s.last_status_update_at,
          s.last_status_payload,
          p.proforma_number,
          p.client_id,
          p.duration_start_date,
          p.duration_end_date,
          p.duration_start_date AS start_date,
          p.duration_end_date AS end_date,
          CONCAT('Project #', s.proforma_id) AS project_name,
          p.pricing_snapshot,
          p.ads_snapshot,
          p.assigned_team,
          p.total_amount,
          c.client_name,
          c.client_organization,
          e.employee_name AS assigned_by_name
        FROM re_project_sync s
        JOIN re_proposal_proforma p ON s.proforma_id = p.id
        LEFT JOIN re_revenue_engine_client_details c ON p.client_id = c.id
        LEFT JOIN re_revenue_engine_employees e ON s.assigned_by_employee_id = e.id
        WHERE COALESCE(s.is_active, 1) = 1
        ORDER BY p.duration_start_date ASC, s.id DESC
      `;

      db.query(getCalendarSQL, [], (err, rows) => {
        if (err) {
          console.error("[re_syncController.getCalendarData] Database query error:", err);
          return res.status(500).json({
            status: "Failure",
            message: "Database Error while fetching calendar data",
          });
        }

        return res.status(200).json({
          status: "Success",
          message: "Calendar data retrieved successfully",
          data: rows || [],
        });
      });
    } catch (error) {
      console.error("[re_syncController.getCalendarData] Unhandled error:", error);
      return res.status(500).json({ status: "Failure", message: "Internal Server Error" });
    }
  })();
};

/**
 * 7c. Get Project Tasks Detail
 * GET /re-sf/project/:proforma_id/tasks
 * Protected by: authenticateToken
 */
exports.getProjectTasks = (req, res) => {
  (async () => {
    try {
      const { proforma_id } = req.params;
      if (!proforma_id) {
        return res.status(400).json({
          status: "Failure",
          message: "proforma_id parameter is required",
        });
      }

      const getProjectSQL = `
        SELECT 
          s.id AS project_sync_id,
          s.proforma_id,
          s.txn_id,
          s.sf_project_id,
          s.current_status,
          s.is_active,
          s.assigned_at,
          s.last_status_update_at,
          p.proforma_number,
          p.duration_start_date,
          p.duration_end_date,
          p.duration_start_date AS start_date,
          p.duration_end_date AS end_date,
          CONCAT('Project #', s.proforma_id) AS project_name,
          p.total_amount,
          p.pricing_snapshot,
          p.ads_snapshot,
          c.client_name,
          c.client_organization,
          e.employee_name AS assigned_by_name
        FROM re_project_sync s
        JOIN re_proposal_proforma p ON s.proforma_id = p.id
        LEFT JOIN re_revenue_engine_client_details c ON p.client_id = c.id
        LEFT JOIN re_revenue_engine_employees e ON s.assigned_by_employee_id = e.id
        WHERE s.proforma_id = ?
        LIMIT 1
      `;

      db.query(getProjectSQL, [proforma_id], (err, projectRows) => {
        if (err) {
          console.error("[re_syncController.getProjectTasks] Database error:", err);
          return res.status(500).json({ status: "Failure", message: "Database Error" });
        }

        if (!projectRows || projectRows.length === 0) {
          return res.status(404).json({
            status: "Failure",
            message: "Project sync record not found for this proforma",
          });
        }

        const project = projectRows[0];

        const getTasksSQL = `
          SELECT 
            id,
            project_sync_id,
            sf_task_id,
            task_name,
            task_description,
            assigned_to_name,
            assigned_to_role,
            deadline,
            status,
            last_updated_at
          FROM re_project_sync_tasks
          WHERE project_sync_id = ?
          ORDER BY deadline ASC, id ASC
        `;

        db.query(getTasksSQL, [project.project_sync_id], (taskErr, taskRows) => {
          if (taskErr) {
            console.error("[re_syncController.getProjectTasks] Tasks query error:", taskErr);
            return res.status(500).json({
              status: "Failure",
              message: "Database Error while fetching project tasks",
            });
          }

          return res.status(200).json({
            status: "Success",
            message: "Project tasks retrieved successfully",
            data: {
              project,
              tasks: taskRows || [],
            },
          });
        });
      });
    } catch (error) {
      console.error("[re_syncController.getProjectTasks] Unhandled error:", error);
      return res.status(500).json({ status: "Failure", message: "Internal Server Error" });
    }
  })();
};
