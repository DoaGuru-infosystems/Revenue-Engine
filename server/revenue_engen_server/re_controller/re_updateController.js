const { db } = require("../../connect");
const dotenv = require("dotenv");
const moment = require("moment-timezone");
dotenv.config();

exports.updateService = async (req, res) => {
  const { service_id } = req.params;
  const { service_name } = req.body;

  db.query(
    "UPDATE re_services SET service_name = ? WHERE service_id = ?",
    [service_name, service_id],
    (err, result) => {
      if (err)
        return res
          .status(500)
          .json({ status: "Failure", message: "Database error" });
      res.json({ status: "Success", message: "Service updated successfully" });
    },
  );
};

exports.updateCategory = async (req, res) => {
  const { category_id } = req.params;
  const { category_name } = req.body;

  db.query(
    "UPDATE re_categories SET category_name = ? WHERE category_id = ?",
    [category_name, category_id],
    (err, result) => {
      if (err)
        return res
          .status(500)
          .json({ status: "Failure", message: "Database error" });
      res.json({ status: "Success", message: "Category updated successfully" });
    },
  );
};

exports.updateEditingType = async (req, res) => {
  const { editing_type_id } = req.params;
  const { editing_type_name } = req.body;

  db.query(
    "UPDATE re_editing_types SET editing_type_name = ? WHERE editing_type_id = ?",
    [editing_type_name, editing_type_id],
    (err, result) => {
      if (err)
        return res
          .status(500)
          .json({ status: "Failure", message: "Database error" });
      res.json({
        status: "Success",
        message: "Editing type updated successfully",
      });
    },
  );
};

exports.updateCalculatorDataById = (req, res) => {
  const { id } = req.params;
  const {
    txn_id,
    client_id,
    service_name,
    category_name,
    editing_type_name,
    editing_type_amount,
    quantity,
    include_content_posting,
    include_thumbnail_creation,
    include_youtube_video_posting,
    total_amount,
    employee,
  } = req.body;

  const updatedAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  // --- First Update Quotation (re_calculator_transactions) ---
  const updateQuotationQuery = `
    UPDATE re_calculator_transactions
    SET
      quantity = ?,
      include_youtube_video_posting = ?,
      total_amount = ?,
      employee = ?,
      created_at = ?
    WHERE txn_id = ? 
      AND client_id = ? 
      AND service_name = ? 
      AND category_name = ? 
      AND editing_type_name = ?
  `;

  const quotationValues = [
    quantity,
    include_youtube_video_posting || 0,
    total_amount,
    employee,
    updatedAt,
    txn_id,
    client_id,
    service_name,
    category_name,
    editing_type_name,
  ];

  db.query(updateQuotationQuery, quotationValues, (err, result) => {
    if (err) {
      console.error("Update Quotation Error:", err);
      return res
        .status(500)
        .json({ status: "Failure", message: "Quotation DB error" });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ status: "Failure", message: "Quotation not found" });
    }

    // --- Check if re_invoice Exists ---
    const checkInvoiceQuery = `
      SELECT id FROM re_invoice_graphic 
      WHERE txn_id = ? 
        AND client_id = ? 
        AND service_name = ? 
        AND category_name = ? 
        AND editing_type_name = ?
      LIMIT 1
    `;

    const checkValues = [
      txn_id,
      client_id,
      service_name,
      category_name,
      editing_type_name,
    ];

    db.query(checkInvoiceQuery, checkValues, (checkErr, checkResult) => {
      if (checkErr) {
        console.error("Check re_invoice Error:", checkErr);
        return res
          .status(500)
          .json({ status: "Failure", message: "re_invoice check error" });
      }

      if (checkResult.length > 0) {
        // --- re_invoice exists → Update it as well ---
        const updateInvoiceQuery = `
          UPDATE re_invoice_graphic
          SET
            quantity = ?,
            total_amount = ?,
            employee = ?,
            created_at = ?
          WHERE txn_id = ? 
            AND client_id = ? 
            AND service_name = ? 
            AND category_name = ? 
            AND editing_type_name = ?
        `;

        const invoiceValues = [
          quantity,
          total_amount,
          employee,
          updatedAt,
          txn_id,
          client_id,
          service_name,
          category_name,
          editing_type_name,
        ];

        db.query(updateInvoiceQuery, invoiceValues, (invErr) => {
          if (invErr) {
            console.error("Update re_invoice Error:", invErr);
            return res
              .status(500)
              .json({ status: "Failure", message: "re_invoice update error" });
          }

          return res.status(200).json({
            status: "Success",
            message: "Quotation & re_invoice updated successfully",
          });
        });
      } else {
        // --- re_invoice does NOT exist → Only Quotation updated ---
        return res.status(200).json({
          status: "Success",
          message: "Quotation updated successfully (No re_invoice found)",
        });
      }
    });
  });
};

exports.updateClientDetails = async (req, res) => {
  const clientId = req.params.id;
  const { client_name, client_organization, email, phone, address } = req.body;

  if (!client_name || !phone) {
    return res.status(400).json({
      status: "Failure",
      message: "Client name and phone are required.",
    });
  }

  try {
    const updatedAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

    // ✅ Step 1: Always update re_revenue_engine_client_details
    const updateClientQuery = `
      UPDATE re_revenue_engine_client_details
      SET client_name = ?, client_organization = ?, email = ?, phone = ?, address = ?, created_at = ?
      WHERE id = ?
    `;

    const values = [
      client_name,
      client_organization || null,
      email || null,
      phone,
      address || null,
      updatedAt,
      clientId,
    ];

    db.query(updateClientQuery, values, (err, clientResult) => {
      if (err) {
        console.error("Error updating revenue_engine_client_details:", err);
        return res.status(500).json({
          status: "Failure",
          message: "Database error while updating client details",
          error: err,
        });
      }

      if (clientResult.affectedRows === 0) {
        return res.status(404).json({
          status: "Failure",
          message: "Client not found in revenue_engine_client_details.",
        });
      }

      // ✅ Step 2: Check if client exists in invoice
      const checkInvoiceQuery = `SELECT id FROM re_invoice WHERE client_id = ? LIMIT 1`;
      db.query(checkInvoiceQuery, [clientId], (checkErr, invoiceRows) => {
        if (checkErr) {
          console.error("Error checking invoice:", checkErr);
          return res.status(500).json({
            status: "Failure",
            message: "Error checking invoice data",
            error: checkErr,
          });
        }

        if (invoiceRows.length === 0) {
          // ✅ No re_invoice exists → update client only
          return res.status(200).json({
            status: "Success",
            message:
              "Client updated successfully in revenue_engine_client_details (no invoice found).",
          });
        }

        // ✅ Step 3: Update invoice details if present
        const updateInvoiceQuery = `
          UPDATE re_invoice
          SET client_name = ?, client_organization = ?, email = ?, phone = ?, address = ?, created_at = ?
          WHERE client_id = ?
        `;

        db.query(updateInvoiceQuery, values, (invErr, invoiceResult) => {
          if (invErr) {
            console.error("Error updating invoice:", invErr);
            return res.status(500).json({
              status: "Failure",
              message: "Database error while updating invoice data",
              error: invErr,
            });
          }

          return res.status(200).json({
            status: "Success",
            message:
              "Client details updated successfully in both tables (client + re_invoice).",
          });
        });
      });
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      status: "Failure",
      message: "Server error",
      error,
    });
  }
};

exports.updatePlanNameDetail = async (req, res) => {
  const { id } = req.params;
  const { plan_name } = req.body;

  if (!id) {
    return res.status(400).json({
      status: "Failure",
      message: "Missing id parameter",
    });
  }

  const updatePlanDetail =
    "UPDATE re_plan_details SET plan_name = ? WHERE id = ?";
  const updatePlanData =
    "UPDATE re_plan_data SET plan_name = ? WHERE plan_id = ?";
  const updatePlanDataNotes =
    "UPDATE re_plans_notes SET plan = ? WHERE plan_id = ?";

  // First query - update re_plan_details
  db.query(updatePlanDetail, [plan_name, id], (err1, result1) => {
    if (err1) {
      return res.status(500).json({
        status: "Failure",
        message: "Error updating plan detail",
        error: err1,
      });
    }

    // Second query - update re_plan_data
    db.query(updatePlanData, [plan_name, id], (err2, result2) => {
      if (err2) {
        return res.status(500).json({
          status: "Failure",
          message: "Error updating plan data",
          error: err2,
        });
      }

      // Third query - update re_plans_notes
      db.query(updatePlanDataNotes, [plan_name, id], (err3, result3) => {
        if (err3) {
          return res.status(500).json({
            status: "Failure",
            message: "Error updating plan data note",
            error: err3,
          });
        }

        // ✅ All queries successful
        res.status(200).json({
          status: "Success",
          message: "Plan name updated successfully in all tables",
        });
      });
    });
  });
};

exports.updatePlandata = async (req, res) => {
  const { id } = req.params;
  const data = req.body; // expect array of objects

  if (!Array.isArray(data) || data.length === 0) {
    return res
      .status(400)
      .json({ status: "Failure", message: "No data received" });
  }

  const updatedAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  const query = `
    UPDATE re_plan_data
    SET
      service_name = ?,
      category_name = ?,
      editing_type_name = ?,
      editing_type_amount = ?,
      quantity = ?,
      include_content_posting = ?,
      include_thumbnail_creation = ?,
      total_amount = ?,
      amount_ads = ?,
      percent_ads = ?,
      charge_ads = ?,
      total_ads = ?,
      employee = ?,
      created_at = ?
    WHERE id = ?
  `;

  try {
    const tasks = data.map((item) => {
      const values = [
        item.service_name || null,
        item.category_name || null,
        item.editing_type_name || null,
        item.editing_type_amount || null,
        item.quantity || null,
        item.include_content_posting || 0,
        item.include_thumbnail_creation || 0,
        item.total_amount || null,
        item.amount_ads || null,
        item.percent_ads || null,
        item.charge_ads || null,
        item.total_ads || null,
        item.employee || null,
        updatedAt,
        id, // push id here!
      ];

      return new Promise((resolve, reject) => {
        db.query(query, values, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });
    });

    const results = await Promise.all(tasks);

    const updatedRows = results.reduce((sum, r) => sum + r.affectedRows, 0);

    if (updatedRows === 0) {
      return res
        .status(404)
        .json({ status: "Failure", message: "No matching entries found" });
    }

    res.status(200).json({
      status: "Success",
      message: `${updatedRows} entries updated successfully`,
    });
  } catch (err) {
    console.error("Update Error:", err);
    return res.status(500).json({ status: "Failure", message: "DB error" });
  }
};

exports.updatePlanNotes = async (req, res) => {
  const { id } = req.params;
  const { note_name, plan, plan_id } = req.body;

  db.query(
    "UPDATE re_plans_notes SET note_name = ?, plan = ?,plan_id= ? WHERE id = ?",
    [note_name, plan, plan_id, id],
    (err, result) => {
      if (err)
        return res
          .status(500)
          .json({ status: "Failure", message: "Database error" });
      res.json({ status: "Success", message: "Note updated successfully" });
    },
  );
};

exports.updateServiceData = async (req, res) => {
  const { editing_type_id } = req.params;
  const { editing_type_name, amount, category_id, category_name, service_id } = req.body;

  try {
    if (category_id) {
      await new Promise((resolve, reject) => {
        db.query(
          "UPDATE re_categories SET category_name = ?, service_id = ? WHERE category_id = ?",
          [category_name, service_id, category_id],
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
      });
    }

    db.query(
      "UPDATE re_editing_types SET editing_type_name = ?, amount = ? WHERE editing_type_id = ?",
      [editing_type_name, amount, editing_type_id],
      (err, result) => {
        if (err)
          return res
            .status(500)
            .json({ status: "Failure", message: "Database error" });
        res.json({ status: "Success", message: "Edit updated successfully" });
      },
    );
  } catch (error) {
    res.status(500).json({ status: "Failure", message: "Database error" });
  }
};
// NEW Work

function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || "");
}

exports.reassignQuotation = (req, res) => {
  (async () => {
    try {
      const { txn_id, user_id, deadline } = req.body;

      if (!txn_id || !user_id) {
        return res
          .status(400)
          .json({ status: "Failure", message: "Missing ID(s)" });
      }
      if (deadline && !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
        return res.status(400).json({
          status: "Failure",
          message: "Invalid deadline format (YYYY-MM-DD)",
        });
      }

      const now = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
      const q = `
        UPDATE re_assign_quotation
        SET
          user_id = ?,
          ${deadline ? "deadline = ?," : ""}
          updated_at = ?,
          version = CAST(CAST(COALESCE(NULLIF(version,''),'1') AS UNSIGNED) + 1 AS CHAR)
        WHERE txn_id = ?
      `;
      const params = deadline
        ? [user_id, deadline, now, txn_id]
        : [user_id, now, txn_id];

      db.query(q, params, async (err, result) => {
        if (err) {
          console.error("Database Error:", err);
          return res
            .status(500)
            .json({ status: "Failure", message: "Database Error" });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({
            status: "Failure",
            message: "No assignment found to update",
          });
        }

        // Read back for context
        const fetchQ = `SELECT client_id, user_id, deadline FROM re_assign_quotation WHERE txn_id = ? LIMIT 1`;
        db.query(fetchQ, [txn_id], async (e2, rows) => {
          if (e2) {
            console.error("Read-after-update error:", e2);
            return res.status(200).json({
              status: "Success",
              message:
                "Quotation re-assigned successfully (mail may not be sent)",
            });
          }

          const record = rows?.[0];
          const clientId = record?.client_id;
          const finalDeadline = record?.deadline || deadline || null;

          return res.status(200).json({
            status: "Success",
            message: "Quotation re-assigned successfully",
          });
        });
      });
    } catch (e) {
      console.error("Server Error:", e);
      return res
        .status(500)
        .json({ status: "Failure", message: "Internal Server Error" });
    }
  })();
};

exports.updateNoteDataById = (req, res) => {
  const { id } = req.params;
  const { note_text } = req.body;

  const updatedAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  const query = `
    UPDATE re_notes_data
    SET
      note_text = ?,
      created_at = ?
    WHERE id = ?
  `;

  const values = [note_text, updatedAt, id];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Update Error:", err);
      return res.status(500).json({ status: "Failure", message: "DB error" });
    }

    res.status(200).json({
      status: "Success",
      message: "Entry updated of Note successfully",
    });
  });
};

exports.updateClientNoteDataById = (req, res) => {
  const { id } = req.params;
  const { note_name } = req.body;

  const updatedAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  const query = `
    UPDATE re_plan_client_notes
    SET
      note_name = ?,
      created_at = ?
    WHERE id = ?
  `;

  const values = [note_name, updatedAt, id];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Update Error:", err);
      return res.status(500).json({ status: "Failure", message: "DB error" });
    }

    res.status(200).json({
      status: "Success",
      message: "Entry updated of Client Note successfully",
    });
  });
};
exports.updateDiscountDataById = (req, res) => {
  const { id } = req.params;
  const { discount_type, discount_per, discount_amt } = req.body;

  const updatedAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  const query = `
    UPDATE re_discount
    SET
      discount_type = ?,discount_per = ?,discount_amt= ?,
      created_at = ?
    WHERE id = ?
  `;

  const values = [discount_type, discount_per, discount_amt, updatedAt, id];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Update Error:", err);
      return res.status(500).json({ status: "Failure", message: "DB error" });
    }

    res.status(200).json({
      status: "Success",
      message: "Entry updated of re_discount successfully",
    });
  });
};
exports.updateComplimenatryDataById = (req, res) => {
  const { id } = req.params;
  const {
    txn_id,
    client_id,
    service_name,
    category_name,
    editing_type_name,
    editing_type_amount,
    quantity,
    include_content_posting,
    include_thumbnail_creation,
    total_amount,
    employee,
  } = req.body;

  const updatedAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  // --- First Update Quotation (re_complimentary) ---
  const updateQuotationQuery = `
    UPDATE re_complimentary
    SET
      quantity = ?,
      total_amount = ?,
      employee = ?,
      created_at = ?
    WHERE txn_id = ? 
      AND client_id = ? 
      AND service_name = ? 
      AND category_name = ? 
      AND editing_type_name = ?
  `;

  const quotationValues = [
    quantity,
    total_amount,
    employee,
    updatedAt,
    txn_id,
    client_id,
    service_name,
    category_name,
    editing_type_name,
  ];

  db.query(updateQuotationQuery, quotationValues, (err, result) => {
    if (err) {
      console.error("Update Quotation Error:", err);
      return res
        .status(500)
        .json({ status: "Failure", message: "Quotation DB error" });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ status: "Failure", message: "Quotation not found" });
    }

    // --- Check if re_invoice Exists ---
    const checkInvoiceQuery = `
      SELECT id FROM re_complimentary_invoice 
      WHERE txn_id = ? 
        AND client_id = ? 
        AND service_name = ? 
        AND category_name = ? 
        AND editing_type_name = ?
      LIMIT 1
    `;

    const checkValues = [
      txn_id,
      client_id,
      service_name,
      category_name,
      editing_type_name,
    ];

    db.query(checkInvoiceQuery, checkValues, (checkErr, checkResult) => {
      if (checkErr) {
        console.error("Check re_invoice Error:", checkErr);
        return res
          .status(500)
          .json({ status: "Failure", message: "re_invoice check error" });
      }

      if (checkResult.length > 0) {
        // --- re_invoice exists → Update it as well ---
        const updateInvoiceQuery = `
          UPDATE re_complimentary_invoice
          SET
            quantity = ?,
            total_amount = ?,
            employee = ?,
            created_at = ?
          WHERE txn_id = ? 
            AND client_id = ? 
            AND service_name = ? 
            AND category_name = ? 
            AND editing_type_name = ?
        `;

        const invoiceValues = [
          quantity,
          total_amount,
          employee,
          updatedAt,
          txn_id,
          client_id,
          service_name,
          category_name,
          editing_type_name,
        ];

        db.query(updateInvoiceQuery, invoiceValues, (invErr) => {
          if (invErr) {
            console.error("Update re_invoice Error:", invErr);
            return res
              .status(500)
              .json({ status: "Failure", message: "re_invoice update error" });
          }

          return res.status(200).json({
            status: "Success",
            message: "Quotation & re_invoice updated successfully",
          });
        });
      } else {
        // --- re_invoice does NOT exist → Only Quotation updated ---
        return res.status(200).json({
          status: "Success",
          message: "Quotation updated successfully (No re_invoice found)",
        });
      }
    });
  });
};

exports.updateInvoiceDataById = (req, res) => {
  const { id } = req.params;
  const {
    txn_id,
    client_id,
    service_name,
    category_name,
    editing_type_name,
    editing_type_amount,
    quantity,
    include_content_posting,
    include_thumbnail_creation,
    total_amount,
    employee,
  } = req.body;

  const updatedAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  const query = `
    UPDATE re_invoice_graphic
    SET
      
      quantity = ?,

      total_amount = ?,
      employee = ?,
      created_at = ?
   WHERE txn_id = ? 
        AND client_id = ? 
        AND service_name = ? 
        AND category_name = ? 
        AND editing_type_name = ?
  `;

  const values = [
    quantity,
    total_amount,
    employee,
    updatedAt,
    txn_id,
    client_id,
    service_name,
    category_name,
    editing_type_name,
    editing_type_amount,
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Update Error:", err);
      return res.status(500).json({ status: "Failure", message: "DB error" });
    }

    res.status(200).json({
      status: "Success",
      message: "Entry re_invoice updated successfully",
    });
  });
};
exports.updateInvoiceNoteDataById = (req, res) => {
  const { id } = req.params;
  const { note_text } = req.body;

  const updatedAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  const query = `
    UPDATE re_invoice_notes_data
    SET
      note_text = ?,
      created_at = ?
    WHERE id = ?
  `;

  const values = [note_text, updatedAt, id];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Update Error:", err);
      return res.status(500).json({ status: "Failure", message: "DB error" });
    }

    res.status(200).json({
      status: "Success",
      message: "Entry updated of Note successfully",
    });
  });
};
exports.updateInvoiceClientNoteDataById = (req, res) => {
  const { id } = req.params;
  const { note_name } = req.body;

  const updatedAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  const query = `
    UPDATE re_invoice_client_notes
    SET
      note_name = ?,
      created_at = ?
    WHERE id = ?
  `;

  const values = [note_name, updatedAt, id];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Update Error:", err);
      return res.status(500).json({ status: "Failure", message: "DB error" });
    }

    res.status(200).json({
      status: "Success",
      message: "Entry updated of Client Note successfully",
    });
  });
};
exports.updateInvoiceComplimenatryDataById = (req, res) => {
  const { id } = req.params;
  const {
    txn_id,
    client_id,
    service_name,
    category_name,
    editing_type_name,
    editing_type_amount,
    quantity,
    include_content_posting,
    include_thumbnail_creation,
    total_amount,
    employee,
  } = req.body;

  const updatedAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  const query = `
    UPDATE re_complimentary_invoice
    SET
        quantity = ?,

      total_amount = ?,
      employee = ?,
      created_at = ?
   WHERE txn_id = ? 
        AND client_id = ? 
        AND service_name = ? 
        AND category_name = ? 
        AND editing_type_name = ?
  `;

  const values = [
    quantity,
    total_amount,
    employee,
    updatedAt,
    txn_id,
    client_id,
    service_name,
    category_name,
    editing_type_name,
    editing_type_amount,
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Update Error:", err);
      return res.status(500).json({ status: "Failure", message: "DB error" });
    }

    res.status(200).json({
      status: "Success",
      message: "Entry re_invoice updated successfully",
    });
  });
};

exports.updateAdditionalDataById = (req, res) => {
  const { id } = req.params;
  const {
    txn_id,
    client_id,
    service_name,
    category_name,
    editing_type_name,
    editing_type_amount,
    quantity,
    include_content_posting,
    include_thumbnail_creation,
    total_amount,
    employee,
  } = req.body;

  const updatedAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  const query = `
    UPDATE re_addtional_service
    SET
        quantity = ?,

      total_amount = ?,
      employee = ?,
      created_at = ?
   WHERE txn_id = ? 
        AND client_id = ? 
        AND service_name = ? 
        AND category_name = ? 
        AND editing_type_name = ?
  `;

  const values = [
    quantity,
    total_amount,
    employee,
    updatedAt,
    txn_id,
    client_id,
    service_name,
    category_name,
    editing_type_name,
    editing_type_amount,
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Update Error:", err);
      return res.status(500).json({ status: "Failure", message: "DB error" });
    }

    res.status(200).json({
      status: "Success",
      message: "Entry Additional Service updated successfully",
    });
  });
};
exports.updateRemainingDataById = (req, res) => {
  const { id } = req.params;
  const { price, employee } = req.body;

  const updatedAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  const query = `
    UPDATE re_amount_remaining
    SET
        
 price= ?,
  employee = ?,
      created_at = ?
   WHERE id = ?  `;

  const values = [price, employee, updatedAt, id];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Update Error:", err);
      return res.status(500).json({ status: "Failure", message: "DB error" });
    }

    res.status(200).json({
      status: "Success",
      message: "Entry Remaning Amount updated successfully",
    });
  });
};

exports.updateSeoClient = (req, res) => {
  try {
    const { clientId } = req.params;
    const { name, website } = req.body;

    if (!clientId) {
      return res
        .status(400)
        .json({ status: "Failure", message: "Client ID is required" });
    }
    if (!name || !website) {
      return res
        .status(400)
        .json({ status: "Failure", message: "Name & Website are required" });
    }

    // Optional: check if website is used by another client (unique constraint)
    const checkSql = `SELECT id FROM seo_clients WHERE website = ? AND id <> ? LIMIT 1`;
    db.query(checkSql, [website.trim(), clientId], (err, rows) => {
      if (err) {
        console.error("DB Error:", err);
        return res
          .status(500)
          .json({ status: "Failure", message: "Database error", error: err });
      }
      if (rows.length > 0) {
        return res.status(409).json({
          status: "Failure",
          message: "Website already in use by another client",
        });
      }

      const updatedAt = moment()
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DD HH:mm:ss");
      const updateSql = `UPDATE seo_clients SET name = ?, website = ?, created_at = ? WHERE id = ?`;
      db.query(
        updateSql,
        [name.trim(), website.trim(), updatedAt, clientId],
        (uErr, result) => {
          if (uErr) {
            console.error("DB Error:", uErr);
            return res.status(500).json({
              status: "Failure",
              message: "Database error",
              error: uErr,
            });
          }
          if (result.affectedRows === 0) {
            return res
              .status(404)
              .json({ status: "Failure", message: "Client not found" });
          }
          return res.status(200).json({
            status: "Success",
            message: "Client updated successfully",
            data: {
              id: Number(clientId),
              name: name.trim(),
              website: website.trim(),
              updated_at: updatedAt,
            },
          });
        },
      );
    });
  } catch (error) {
    console.error("Server Error:", error);
    return res
      .status(500)
      .json({ status: "Failure", message: "Internal Server Error" });
  }
};

exports.updateSeoKeyword = (req, res) => {
  try {
    const { keywordId } = req.params;
    const { keyword } = req.body;

    if (!keywordId) {
      return res
        .status(400)
        .json({ status: "Failure", message: "Keyword ID is required" });
    }
    if (!keyword || !keyword.trim()) {
      return res
        .status(400)
        .json({ status: "Failure", message: "Keyword is required" });
    }

    const updatedAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
    const updateSql = `UPDATE seo_keywords SET keyword = ?, created_at = ? WHERE id = ?`;
    db.query(
      updateSql,
      [keyword.trim(), updatedAt, keywordId],
      (err, result) => {
        if (err) {
          console.error("DB Error:", err);
          return res
            .status(500)
            .json({ status: "Failure", message: "Database error", error: err });
        }
        if (result.affectedRows === 0) {
          return res
            .status(404)
            .json({ status: "Failure", message: "Keyword not found" });
        }
        return res.status(200).json({
          status: "Success",
          message: "Keyword updated successfully",
          data: {
            id: Number(keywordId),
            keyword: keyword.trim(),
            updated_at: updatedAt,
          },
        });
      },
    );
  } catch (error) {
    console.error("Server Error:", error);
    return res
      .status(500)
      .json({ status: "Failure", message: "Internal Server Error" });
  }
};
exports.updateDiscountSettingDataById = (req, res) => {
  const { id } = req.params;
  const { discount_per, discount_amt } = req.body;

  const updatedAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  const query = `
    UPDATE re_discount_settings
    SET
      discount_per = ?,discount_amt = ?,
      created_at = ?
    WHERE id = ?
  `;

  const values = [discount_per, discount_amt, updatedAt, id];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Update Error:", err);
      return res.status(500).json({ status: "Failure", message: "DB error" });
    }

    res.status(200).json({
      status: "Success",
      message: "Entry updated of re_discount Setting successfully",
    });
  });
};

exports.updateQuotationApprovalStatus = (req, res) => {
  const { client_id, txn_id, approved_by = null } = req.body;

  if (!client_id || !txn_id) {
    return res
      .status(400)
      .json({ status: "Failure", message: "Required fields missing" });
  }

  // Pehle check karein ki current status kya hai
  const checkQuery = `SELECT status FROM re_quotation_status WHERE client_id = ? AND txn_id = ?`;

  db.query(checkQuery, [client_id, txn_id], (err, results) => {
    if (err) return res.status(500).json({ status: "Failure", error: err });

    // Toggle legacy quick-approve between pending and admin_approved
    let currentStatus = results.length > 0 ? results[0].status : "pending";
    let newStatus =
      currentStatus === "admin_approved" ? "pending" : "admin_approved";

    const upsertQuery = `
      INSERT INTO re_quotation_status (client_id, txn_id, status, approved_by, approved_at)
      VALUES (?, ?, ?, ?, CASE WHEN ? = 'admin_approved' THEN NOW() ELSE NULL END)
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        approved_by = CASE WHEN VALUES(status) = 'admin_approved' THEN VALUES(approved_by) ELSE NULL END,
        approved_at = CASE WHEN VALUES(status) = 'admin_approved' THEN NOW() ELSE NULL END,
        updated_at = NOW()
    `;

    db.query(
      upsertQuery,
      [client_id, txn_id, newStatus, approved_by, newStatus],
      (err) => {
        if (err) return res.status(500).json({ status: "Failure", error: err });

        return res.status(200).json({
          status: "Success",
          message: `Status toggled to ${newStatus}`,
          newStatus: newStatus,
        });
      },
    );
  });
};

// working code

// ------------------

// exports.reassignQuotation = (req, res) => {
//   try {
//     const { txn_id, user_id } = req.body;
//     if (!txn_id || !user_id) {
//       return res
//         .status(400)
//         .json({ status: "Failure", message: "Missing ID(s)" });
//     }

//     const now = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
//     const q = `
//       UPDATE re_assign_quotation
//       SET
//         user_id = ?,
//         updated_at = ?,
//         version = CAST(CAST(COALESCE(NULLIF(version,''),'1') AS UNSIGNED) + 1 AS CHAR)
//       WHERE txn_id = ?
//     `;

//     db.query(q, [user_id, now, txn_id], (err, result) => {
//       if (err) {
//         console.error("Database Error:", err);
//         return res
//           .status(500)
//           .json({ status: "Failure", message: "Database Error" });
//       }
//       if (result.affectedRows === 0) {
//         return res.status(404).json({
//           status: "Failure",
//           message: "No assignment found to update",
//         });
//       }
//       return res.status(200).json({
//         status: "Success",
//         message: "Quotation re-assigned successfully",
//       });
//     });
//   } catch (e) {
//     console.error("Server Error:", e);
//     return res
//       .status(500)
//       .json({ status: "Failure", message: "Internal Server Error" });
//   }
// };
