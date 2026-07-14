const { db } = require("../connect");
const dotenv = require("dotenv");
dotenv.config();

exports.getAddServices = async (req, res) => {
  try {
    db.query("SELECT * FROM re_services", (err, results) => {
      if (err) {
        return res.status(500).json({
          status: "Failure",
          message: "Database error",
          error: err,
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          status: "Failure",
          message: "No re_services found",
        });
      }

      res.status(200).json({
        status: "Success",
        data: results,
      });
    });
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Server error",
      error,
    });
  }
};

exports.getAddCategories = async (req, res) => {
  const { service_id } = req.params;

  try {
    db.query(
      "SELECT * FROM re_categories WHERE service_id = ?",
      [service_id],
      (err, results) => {
        if (err) {
          return res.status(500).json({
            status: "Failure",
            message: "Database error",
            error: err,
          });
        }

        if (results.length === 0) {
          return res.status(404).json({
            status: "Failure",
            message: "No re_categories found for this service",
          });
        }

        res.status(200).json({
          status: "Success",
          data: results,
        });
      }
    );
    
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Server error",
      error,
    });
  }
};

exports.getAddEditingTypes = async (req, res) => {
  const { service, category } = req.params;

  try {
    db.query(
      "SELECT * FROM re_editing_types WHERE service_id = ? AND category_id = ?",
      [service, category],
      (err, results) => {
        if (err) {
          return res.status(500).json({
            status: "Failure",
            message: "Database error",
            error: err,
          });
        }

        if (results.length === 0) {
          return res.status(404).json({
            status: "Failure",
            message: "No Editing Type Found for this re_categories & service",
          });
        }

        res.status(200).json({
          status: "Success",
          data: results,
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Server error",
      error,
    });
  }
};

exports.getAllServiceData = (req, res) => {
  const query = `
    SELECT 
      s.service_id,
      s.service_name,
      c.category_id,
      c.category_name,
      e.editing_type_id,
      e.editing_type_name,
      e.amount,
      s.created_at AS service_created_at,
      c.created_at AS category_created_at,
      e.created_at AS editing_type_created_at
    FROM re_services s
    LEFT JOIN re_categories c ON s.service_id = c.service_id
    LEFT JOIN re_editing_types e ON c.category_id = e.category_id
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching joined data:", err);
      return res.status(500).json({
        status: "Error",
        message: "Failed to fetch data",
      });
    }

    res.json({
      status: "Success",
      data: results,
    });
  });
};

exports.getAdsServices = async (req, res) => {
  try {
    db.query(
      "SELECT * FROM re_revenue_engine_ads ORDER BY id DESC",
      (err, results) => {
        if (err) {
          return res.status(500).json({
            status: "Failure",
            message: "Database error",
          });
        }

        if (results.length === 0) {
          return res.status(404).json({
            status: "Failure",
            message: "No ads re_services found",
          });
        }

        res.status(200).json({
          status: "Success",
          data: results,
        });
      }
    );
  } catch (error) {
    res.status(500).json({ status: "Failure", message: "Server error", error });
  }
};

exports.getAllServiceDatas = (req, res) => {
  const query = `
    SELECT 
      s.service_id,
      s.service_name,
      c.category_id,
      c.category_name,
      e.editing_type_id,
      e.editing_type_name,
      e.amount,
      s.created_at AS service_created_at,
      c.created_at AS category_created_at,
      e.created_at AS editing_type_created_at
    FROM re_services s
    LEFT JOIN re_categories c ON s.service_id = c.service_id
    LEFT JOIN re_editing_types e ON c.category_id = e.category_id
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching joined data:", err);
      return res
        .status(500)
        .json({ status: "Failure", message: "Failed to fetch data" });
    }

    const groupedData = [];
    // console.log(`204 ${groupedData}`);
    // console.log(`205 ${results}`);

    results.forEach((row) => {
      let service = groupedData.find((s) => s.service_id === row.service_id);
      // console.log(`210 ${service}`);

      if (!service) {
        service = {
          service_id: row.service_id,
          service_name: row.service_name,
          service_created_at: row.service_created_at,
          categories: [],
        };
        groupedData.push(service);
        // console.log(`220 ${groupedData}`);
      }

      // console.log(`224 ${groupedData}`);
      // console.log(`225 ${service}`);

      let category = service.categories.find(
        (c) => c.category_id === row.category_id
      );
      // console.log(`230 ${category}`);
      if (!category && row.category_id) {
        category = {
          category_id: row.category_id,
          category_name: row.category_name,
          category_created_at: row.category_created_at,
          editing_types: [],
        };
        service.categories.push(category);
        // console.log(`239 ${category}`);
      }

      if (row.editing_type_id) {
        category.editing_types.push({
          editing_type_id: row.editing_type_id,
          editing_type_name: row.editing_type_name,
          amount: row.amount,
          editing_type_created_at: row.editing_type_created_at,
        });
      }
    });

    res.json({
      status: "Success",
      data: groupedData,
    });
  });
};

exports.getCalculatorTransactions = async (req, res) => {
  try {
    db.query("SELECT * FROM re_calculator_transactions", (err, results) => {
      if (err) {
        return res.status(500).json({
          status: "Failure",
          message: "Database error",
          error: err,
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          status: "Failure",
          message: "No re_services found",
        });
      }

      res.status(200).json({
        status: "Success",
        data: results,
      });
    });
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Server error",
      error,
    });
  }
};

exports.getByIDCalculatorTransactions = async (req, res) => {
  const { txn_id, client_id } = req.params;

  try {
    db.query(
      "SELECT * FROM re_calculator_transactions WHERE txn_id = ? AND client_id = ?",
      [txn_id, client_id],
      (err, results) => {
        if (err) {
          return res.status(500).json({
            status: "Failure",
            message: "Database error",
            error: err,
          });
        }

        if (results.length === 0) {
          return res.status(404).json({
            status: "Failure",
            message: "No calculator transactions found",
          });
        }

        res.status(200).json({
          status: "Success",
          data: results,
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Server error",
      error,
    });
  }
};

exports.getByIDAdsCampaignDetails = async (req, res) => {
  const { txn_id, client_id } = req.params;

  try {
    db.query(
      "SELECT * FROM re_ads_campaign_details WHERE txn_id = ? AND client_id = ?",
      [txn_id, client_id],
      (err, results) => {
        if (err) {
          return res.status(500).json({
            status: "Failure",
            message: "Database error",
            error: err,
          });
        }

        if (results.length === 0) {
          return res.status(404).json({
            status: "Failure",
            message: "No calculator transactions found",
          });
        }

        res.status(200).json({
          status: "Success",
          data: results,
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Server error",
      error,
    });
  }
};

exports.getClientDetailsById = async (req, res) => {
  const clientId = req.params.id;

  try {
    db.query(
      "SELECT * FROM re_revenue_engine_client_details WHERE id = ?",
      [clientId],
      (err, results) => {
        if (err) {
          return res.status(500).json({
            status: "Failure",
            message: "Database error",
            error: err,
          });
        }

        if (results.length === 0) {
          return res.status(404).json({
            status: "Failure",
            message: "Client not found",
          });
        }

        res.status(200).json({
          status: "Success",
          data: results[0],
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Server error",
      error,
    });
  }
};

exports.getClientTxnHistory = async (req, res) => {
  const client_id = req.params.id || req.params.client_id;

  const query = `
    WITH txn_services AS (
      SELECT txn_id, client_id, created_at FROM re_calculator_transactions
      UNION ALL
      SELECT txn_id, client_id, created_at FROM re_ads_campaign_details
    )
    SELECT
      t.txn_id,
      t.client_id,
      MAX(t.created_at) AS txn_date,
      COALESCE(qs.status, 'pending') AS re_quotation_status,
      qs.approved_by,
      qs.approved_at
    FROM txn_services t
    LEFT JOIN re_quotation_status qs
      ON qs.txn_id = t.txn_id
      AND qs.client_id = t.client_id
    WHERE t.client_id = ?
    GROUP BY t.txn_id, t.client_id, qs.status, qs.approved_by, qs.approved_at
    ORDER BY txn_date DESC
  `;

  db.query(query, [client_id], (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ status: "Failure", message: "Database error", error: err });
    }

    res.status(200).json({
      status: "Success",
      message: "Client txn history fetched successfully",
      data: result,
    });
  });
};

// exports.getClientServiceHistory = async (req, res) => {
//   const { client_id, txn_id } = req.params;

//   const query = `
//     SELECT
//       'Graphic Service' AS service_type,
//       ct.txn_id,
//       ct.created_at,
//       ct.service_name,
//       ct.category_name,
//       ct.editing_type_name,
//       ct.editing_type_amount,
//       ct.quantity,
//       ct.total_amount
//     FROM re_calculator_transactions ct
//     WHERE ct.txn_id = ? AND ct.client_id = ?

//     UNION

//     SELECT
//       'Ads Campaign' AS service_type,
//       ad.txn_id,
//       ad.created_at,
//       NULL AS service_name,
//       ad.category,
//       NULL AS editing_type_name,
//       NULL AS editing_type_amount,
//       NULL AS quantity,
//       ad.total
//     FROM re_ads_campaign_details ad
//     WHERE ad.txn_id = ? AND ad.client_id = ?
//   `;

//   db.query(query, [txn_id, client_id, txn_id, client_id], (err, result) => {
//     if (err) {
//       return res
//         .status(500)
//         .json({ status: "Failure", message: "Database error", error: err });
//     }

//     res.status(200).json({
//       status: "Success",
//       message: "Client service history fetched successfully",
//       data: result,
//     });
//   });
// };

// old code
exports.getClientServiceHistory = async (req, res) => {
  const { client_id, txn_id } = req.params;

  const query = `
  SELECT 
  'Graphic Service' AS service_type,
  ct.txn_id,
  ct.created_at,
  ct.service_name,
  ct.category_name,
  ct.editing_type_name,
  ct.editing_type_amount,
  ct.quantity,
  ct.include_content_posting,
  ct.include_thumbnail_creation,
  ct.include_youtube_video_posting,
  ct.plan_name,
  ct.total_amount,
  NULL AS amount,
  NULL AS percent,
  NULL AS charge
FROM re_calculator_transactions ct
WHERE ct.txn_id = ? AND ct.client_id = ?

UNION

SELECT 
  'Ads Campaign' AS service_type,
  ad.txn_id,
  ad.created_at,
  NULL AS service_name,
  ad.category AS category_name,
  NULL AS editing_type_name,
  NULL AS editing_type_amount,
  NULL AS quantity,
  NULL AS include_content_posting,
  NULL AS include_thumbnail_creation,
  NULL AS include_youtube_video_posting,
  NULL AS plan_name,
  ad.total AS total_amount,
  ad.amount,
  ad.percent,
  ad.charge
FROM re_ads_campaign_details ad
WHERE ad.txn_id = ? AND ad.client_id = ?;
  `;

  db.query(query, [txn_id, client_id, txn_id, client_id], (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ status: "Failure", message: "Database error", error: err });
    }

    res.status(200).json({
      status: "Success",
      message: "Client service history fetched successfully",
      data: result,
    });
  });
};

exports.getClientServiceHistoryAssign = async (req, res) => {
  const { client_id, txn_id } = req.params;

  const query = `
  SELECT 
  'Graphic Service' AS service_type,
  ct.txn_id,
  ct.created_at,
  ct.service_name,
  ct.category_name,
  ct.editing_type_name,
  ct.editing_type_amount,
  ct.quantity,
  ct.include_content_posting,
  ct.include_thumbnail_creation,
  ct.include_youtube_video_posting,
  ct.plan_name,
  ct.total_amount,
  NULL AS amount,
  NULL AS percent,
  NULL AS charge
FROM re_calculator_transactions ct
WHERE ct.txn_id = ? AND ct.client_id = ?
  AND NOT (ct.service_name = 'GMB' AND ct.category_name = 'LOCAL SEO')
  AND NOT (ct.service_name = 'SEO' AND ct.category_name = 'Intended for Lead Generation')
  AND NOT (ct.service_name = 'SEO' AND ct.category_name = 'Backlink Creation')
  AND NOT (ct.service_name = 'SEO' AND ct.category_name = 'Google My Business (GMB)')
  AND NOT (ct.service_name = 'Website Maintenance' AND ct.category_name = 'Website Maintenance')

UNION

SELECT 
  'Ads Campaign' AS service_type,
  ad.txn_id,
  ad.created_at,
  NULL AS service_name,
  ad.category AS category_name,
  NULL AS editing_type_name,
  NULL AS editing_type_amount,
  NULL AS quantity,
  NULL AS include_content_posting,
  NULL AS include_thumbnail_creation,
  NULL AS include_youtube_video_posting,
  NULL AS plan_name,
  ad.total AS total_amount,
  ad.amount,
  ad.percent,
  ad.charge
FROM re_ads_campaign_details ad
WHERE ad.txn_id = ? AND ad.client_id = ?
 
  `;

  db.query(query, [txn_id, client_id, txn_id, client_id], (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ status: "Failure", message: "Database error", error: err });
    }

    res.status(200).json({
      status: "Success",
      message: "Client service history fetched successfully",
      data: result,
    });
  });
};
// exports.getClientServiceHistory = async (req, res) => {
//   const { client_id, txn_id } = req.params;

//   const query = `
//   SELECT
//   'Graphic Service' AS service_type,
//   ct.txn_id,
//   ct.created_at,
//   ct.service_name,
//   ct.category_name,
//   ct.editing_type_name,
//   ct.editing_type_amount,
//   ct.quantity,
//   ct.include_content_posting,
//   ct.include_thumbnail_creation,
//   ct.plan_name,
//   ct.total_amount,
//   NULL AS amount,
//   NULL AS percent,
//   NULL AS charge
// FROM re_calculator_transactions ct
// WHERE ct.txn_id = ? AND ct.client_id = ?
//   AND NOT (ct.service_name = 'GMB' AND ct.category_name = 'LOCAL SEO')
//   AND NOT (ct.service_name = 'SEO' AND ct.category_name = 'Intended for Lead Generation')

// UNION

// SELECT
//   'Ads Campaign' AS service_type,
//   ad.txn_id,
//   ad.created_at,
//   NULL AS service_name,
//   ad.category AS category_name,
//   NULL AS editing_type_name,
//   NULL AS editing_type_amount,
//   NULL AS quantity,
//   NULL AS include_content_posting,
//   NULL AS include_thumbnail_creation,
//   NULL AS plan_name,
//   ad.total AS total_amount,
//   ad.amount,
//   ad.percent,
//   ad.charge
// FROM re_ads_campaign_details ad
// WHERE ad.txn_id = ? AND ad.client_id = ?
//   AND NOT (ad.category = 'Google Ad')
//   AND NOT (ad.category = 'Meta Ad');
//   `;

//   db.query(query, [txn_id, client_id, txn_id, client_id], (err, result) => {
//     if (err) {
//       return res
//         .status(500)
//         .json({ status: "Failure", message: "Database error", error: err });
//     }

//     res.status(200).json({
//       status: "Success",
//       message: "Client service history fetched successfully",
//       data: result,
//     });
//   });
// };

exports.getAllClientsTxnHistory = async (req, res) => {
  const { status } = req.query;
  const allowedStatuses = [
    "pending",
    "approved",
    "admin_approved",
    "admin_rejected",
    "client_sent",
    "client_approved",
    "client_rejected",
    "proforma_invoice_generated",
    "proforma_invoice_sent",
    "payment_received_invoice_ready",
    "invoice_sent",
    "strategy_saved",
    "strategy_sent_to_admin",
    "strategy_admin_approved",
    "strategy_admin_rejected",
    "strategy_changes_requested",
    "strategy_client_sent",
    "strategy_client_approved",
    "strategy_client_rejected",
    "team_assigned",
    "tasks_assigned",
    "execution",
  ];

  if (status && !allowedStatuses.includes(status)) {
    return res.status(400).json({
      status: "Failure",
      message: "Invalid status filter.",
    });
  }

  const filters = [];
  const params = [];
  if (status) {
    if (status === "approved") {
      filters.push("(COALESCE(qs.status, 'pending') = 'approved' OR COALESCE(qs.status, 'pending') = 'client_approved')");
    } else {
      filters.push("COALESCE(qs.status, 'pending') = ?");
      params.push(status);
    }
  }

  const query = `
WITH txn_services AS (
  SELECT txn_id, client_id, created_at, 'calculator' AS source FROM re_calculator_transactions
  UNION
  SELECT txn_id, client_id, created_at, 'ads_campaign' AS source FROM re_ads_campaign_details
),
txn_grouped AS (
  SELECT txn_id, client_id, MAX(created_at) AS txn_date
  FROM txn_services
  GROUP BY txn_id, client_id
)
SELECT
  d.id AS client_id,
  d.client_name,
  d.client_organization,
  d.email,
  d.phone,
  d.address,
  d.dg_employee,
  d.created_at AS client_created_at,
  tg.txn_id,
  tg.txn_date,
  COALESCE(qs.status, 'pending') AS re_quotation_status,
  qs.approved_by,
  qs.approved_at
FROM re_revenue_engine_client_details d
LEFT JOIN txn_grouped tg
  ON d.id = tg.client_id
LEFT JOIN re_quotation_status qs
  ON qs.client_id = d.id
  AND qs.txn_id = tg.txn_id
${filters.length ? `WHERE ${filters.join(" AND ")}` : ""}
ORDER BY tg.txn_date DESC
`;

  // const query = `
  //   WITH txn_services AS (
  //     SELECT txn_id, client_id, created_at FROM re_calculator_transactions
  //     UNION ALL
  //     SELECT txn_id, client_id, created_at FROM re_ads_campaign_details
  //   )
  //   SELECT
  //     d.id AS client_id,
  //     d.client_name,
  //     d.client_organization,
  //     d.email,
  //     d.phone,
  //     d.address,
  //     d.dg_employee,
  //     d.created_at AS client_created_at,
  //     t.txn_id,
  //     t.created_at AS txn_date
  //   FROM re_revenue_engine_client_details d
  //   LEFT JOIN txn_services t ON d.id = t.client_id
  //   ORDER BY txn_date DESC
  // `;

  db.query(query, params, (err, result) => {
    if (err) {
      return res.status(500).json({
        status: "Failure",
        message: "Database error",
        error: err,
      });
    }

    res.status(200).json({
      status: "Success",
      message: "All client transaction history fetched successfully",
      data: result,
    });
  });
};

exports.getAllBD = async (req, res) => {
  try {
    db.query("SELECT * FROM re_revenue_engine_employees", (err, results) => {
      if (err) {
        return res.status(500).json({
          status: "Failure",
          message: "Database error",
          error: err,
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          status: "Failure",
          message: "No re_services found",
        });
      }

      res.status(200).json({
        status: "Success",
        data: results,
      });
    });
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Server error",
      error,
    });
  }
};

// >>>>>>>>>> BD GET API's <<<<<<<<<<<

exports.getClientDetailsEmp = async (req, res) => {
  const dg_employee = req.params.dg_employee;

  try {
    if (!dg_employee) {
      return res.status(400).json({
        status: "Failure",
        message: "Missing employee route parameter",
      });
    }

    db.query(
      "SELECT * FROM re_revenue_engine_client_details WHERE dg_employee = ? ORDER BY id DESC",
      [dg_employee],
      (err, results) => {
        if (err) {
          return res.status(500).json({
            status: "Failure",
            message: "Database error",
            error: err,
          });
        }

        if (results.length === 0) {
          return res.status(404).json({
            status: "Failure",
            message: "No client details found for the given employee",
          });
        }

        res.status(200).json({
          status: "Success",
          data: results,
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Server error",
      error,
    });
  }
};

exports.getClientsTxnHistoryByEmployee = async (req, res) => {
  const { dg_employee } = req.params;

  // const query = `
  //   WITH txn_services AS (
  //     SELECT txn_id, client_id, created_at FROM re_calculator_transactions
  //     UNION ALL
  //     SELECT txn_id, client_id, created_at FROM re_ads_campaign_details
  //   )
  //   SELECT
  //     d.id AS client_id,
  //     d.client_name,
  //     d.client_organization,
  //     d.email,
  //     d.phone,
  //     d.address,
  //     d.dg_employee,
  //     d.created_at AS client_created_at,
  //     t.txn_id,
  //     DATE(t.created_at) AS txn_date
  //   FROM re_revenue_engine_client_details d
  //   LEFT JOIN txn_services t ON d.id = t.client_id
  //   WHERE d.dg_employee = ?
  //   ORDER BY txn_date DESC
  // `;

  const query = `
WITH txn_services AS (
  SELECT txn_id, client_id, created_at, 'calculator' AS source FROM re_calculator_transactions
  UNION
  SELECT txn_id, client_id, created_at, 'ads_campaign' AS source FROM re_ads_campaign_details
)
SELECT
  d.id AS client_id,
  d.client_name,
  d.client_organization,
  d.email,
  d.phone,
  d.address,
  d.dg_employee,
  d.created_at AS client_created_at,
  t.txn_id,
  t.created_at AS txn_date,
  t.source
FROM re_revenue_engine_client_details d
LEFT JOIN (
  SELECT txn_id, client_id, created_at, source
  FROM txn_services
  GROUP BY txn_id, client_id, created_at, source
) t ON d.id = t.client_id
WHERE d.dg_employee = ?
ORDER BY txn_date DESC;
    `;
  //   const query = `
  //  WITH txn_services AS (
  //   SELECT txn_id, client_id, created_at FROM re_calculator_transactions
  //   UNION ALL
  //   SELECT txn_id, client_id, created_at FROM re_ads_campaign_details
  // ),
  // latest_txn AS (
  //   SELECT client_id, MAX(created_at) AS last_txn_date
  //   FROM txn_services
  //   GROUP BY client_id
  // )
  // SELECT
  //   d.id AS client_id,
  //   d.client_name,
  //   d.client_organization,
  //   d.email,
  //   d.phone,
  //   d.address,
  //   d.dg_employee,
  //   d.created_at AS client_created_at,
  //   lt.last_txn_date
  // FROM re_revenue_engine_client_details d
  // LEFT JOIN latest_txn lt ON d.id = lt.client_id
  // WHERE d.dg_employee = ?
  // ORDER BY
  //   CASE WHEN lt.last_txn_date IS NULL THEN 1 ELSE 0 END,
  //   lt.last_txn_date DESC;

  //     `;

  db.query(query, [dg_employee], (err, result) => {
    if (err) {
      return res.status(500).json({
        status: "Failure",
        message: "Database error",
        error: err,
      });
    }

    res.status(200).json({
      status: "Success",
      message: `Transaction history fetched for employee: ${dg_employee}`,
      data: result,
    });
  });
};

exports.optionalServiceAmounts = (req, res) => {
  const query = `
    SELECT 
      s.service_name, 
      c.category_name, 
      et.editing_type_name, 
      et.amount 
    FROM re_editing_types et
    JOIN re_services s ON et.service_id = s.service_id
    JOIN re_categories c ON et.category_id = c.category_id
    WHERE et.editing_type_name IN ('Content Posting', 'Thumbnail Creation', 'YouTube Video Posting')
  `;

  db.query(query, (err, rows) => {
    if (err) {
      console.error("Database error in optionalServiceAmounts:", err);
      return res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }

    res.status(200).json({
      status: "success",
      data: rows,
    });
  });
};

exports.getPlanData = async (req, res) => {
  try {
    db.query("SELECT * FROM re_plan_data", (err, results) => {
      if (err) {
        return res.status(500).json({
          status: "Failure",
          message: "Database error",
          error: err,
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          status: "Failure",
          message: "No plan found",
        });
      }

      res.status(200).json({
        status: "Success",
        data: results,
      });
    });
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Server error",
      error,
    });
  }
};

exports.getPlanDataById = async (req, res) => {
  const { id } = req.params;
  try {
    db.query(
      "SELECT * FROM re_plan_data WHERE plan_id = ?",
      [id],
      (err, results) => {
        if (err) {
          return res.status(500).json({
            status: "Failure",
            message: "Database error",
            error: err,
          });
        }

        if (results.length === 0) {
          return res.status(404).json({
            status: "Failure",
            message: "No plan found",
          });
        }

        res.status(200).json({
          status: "Success",
          data: results,
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Server error",
      error,
    });
  }
};

exports.getPlanDetails = async (req, res) => {
  try {
    db.query("SELECT * FROM re_plan_details", (err, results) => {
      if (err) {
        return res.status(500).json({
          status: "Failure",
          message: "Database error",
          error: err,
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          status: "Failure",
          message: "No plan found",
        });
      }

      res.status(200).json({
        status: "Success",
        data: results,
      });
    });
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Server error",
      error,
    });
  }
};

exports.getPlanDetailsById = async (req, res) => {
  const { id } = req.params;

  try {
    db.query(
      "SELECT * FROM re_plan_details WHERE id = ?",
      [id],
      (err, results) => {
        if (err) {
          return res.status(500).json({
            status: "Failure",
            message: "Database error",
            error: err,
          });
        }

        if (results.length === 0) {
          return res.status(404).json({
            status: "Failure",
            message: "No plan found",
          });
        }

        res.status(200).json({
          status: "Success",
          data: results,
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Server error",
      error,
    });
  }
};

exports.getPlanNotes = async (req, res) => {
  try {
    db.query("SELECT * FROM re_plans_notes", (err, results) => {
      if (err) {
        return res.status(500).json({
          status: "Failure",
          message: "Database error",
          error: err,
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          status: "Failure",
          message: "No plan found",
        });
      }

      res.status(200).json({
        status: "Success",
        data: results,
      });
    });
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Server error",
      error,
    });
  }
};

exports.getClientNotesbyId = async (req, res) => {
  const { client_id, txn_id } = req.params;
  try {
    db.query(
      "SELECT * FROM re_plan_client_notes WHERE client_id = ? AND txn_id = ?",
      [client_id, txn_id],
      (err, results) => {
        if (err) {
          return res.status(500).json({
            status: "Failure",
            message: "Database error",
            error: err,
          });
        }

        if (results.length === 0) {
          return res.status(404).json({
            status: "Failure",
            message: "No notes of client found",
          });
        }

        res.status(200).json({
          status: "Success",
          data: results,
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Server error",
      error,
    });
  }
};

//NEW Work
exports.retrieveUser = async (req, res) => {
  try {
    const getQuery = `
      SELECT id, employee_name, employee_role, employee_email
      FROM re_revenue_engine_employees 
      WHERE employee_role = 'BD'
    `;

    db.query(getQuery, (err, results) => {
      if (err) {
        console.error("Database Error:", err);
        return res
          .status(500)
          .json({ status: "Failure", message: "Internal Server Error" });
      }

      if (results.length === 0) {
        return res
          .status(404)
          .json({ status: "Failure", message: "Users not found" });
      }

      return res.status(200).json({
        status: "Success",
        message: "Users retrieved successfully",
        data: results,
      });
    });
  } catch (error) {
    console.error("Server Error:", error);
    return res
      .status(500)
      .json({ status: "Failure", message: "Internal Server Error" });
  }
};

exports.getAssignmentByTxn = (req, res) => {
  try {
    const { txn_id } = req.params;
    if (!txn_id) {
      return res
        .status(400)
        .json({ status: "Failure", message: "Missing txn_id" });
    }

    const q = `
      SELECT aq.id, aq.client_id, aq.txn_id, aq.user_id, aq.deadline, aq.created_at, aq.updated_at, aq.version,
             e.employee_name
      FROM re_assign_quotation aq
      LEFT JOIN re_revenue_engine_employees e ON e.id = aq.user_id
      WHERE aq.txn_id = ?
      LIMIT 1
    `;

    db.query(q, [txn_id], (err, rows) => {
      if (err) {
        console.error("Database Error:", err);
        return res
          .status(500)
          .json({ status: "Failure", message: "Internal Server Error" });
      }
      if (!rows.length) {
        return res
          .status(404)
          .json({ status: "Failure", message: "No assignment found" });
      }
      return res.status(200).json({
        status: "Success",
        message: "Assignment fetched",
        data: rows[0],
      });
    });
  } catch (e) {
    console.error("Server Error:", e);
    return res
      .status(500)
      .json({ status: "Failure", message: "Internal Server Error" });
  }
};

// exports.getAssignedQuotations = async (req, res) => {
//   try {
//     const getQuery = `
//       SELECT
//         aq.id,
//         aq.client_id,
//         aq.txn_id,
//         aq.user_id,
//         aq.created_at,
//         aq.version,
//         aq.updated_at,
//         c.client_name,
//         e.employee_name
//       FROM re_assign_quotation aq
//       JOIN re_revenue_engine_client_details c
//           ON aq.client_id = c.id
//       JOIN re_revenue_engine_employees e
//           ON aq.user_id = e.id
//           ORDER BY aq.id DESC
//     `;

//     db.query(getQuery, (err, results) => {
//       if (err) {
//         console.error("Database Error:", err);
//         return res
//           .status(500)
//           .json({ status: "Failure", message: "Internal Server Error" });
//       }

//       if (results.length === 0) {
//         return res
//           .status(404)
//           .json({ status: "Failure", message: "No assigned quotations found" });
//       }

//       return res.status(200).json({
//         status: "Success",
//         message: "Assigned quotations retrieved successfully",
//         data: results,
//       });
//     });
//   } catch (error) {
//     console.error("Server Error:", error);
//     return res
//       .status(500)
//       .json({ status: "Failure", message: "Internal Server Error" });
//   }
// };

exports.getAssignedQuotations = async (req, res) => {
  try {
    // OPTIONAL query params (future friendly):
    //   ?mode=single|team   -> server-side filter
    const { mode } = req.query;
    const where = [];
    const params = [];
    if (mode === "single") {
      where.push("aq.assignment_mode = 'single'");
    } else if (mode === "team") {
      where.push("aq.assignment_mode = 'team'");
    }
    const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const getQuery = `
      SELECT
        aq.id,
        aq.client_id,
        aq.txn_id,
        aq.user_id,
        aq.assignment_mode,
        aq.team_id,
        aq.assign_group_id,
        aq.deadline,
        aq.created_at,
        aq.created_at AS txn_date,   -- alias for your UI date
        aq.version,
        aq.updated_at,
        c.client_name,
        e.employee_name,
        t.name AS team_name
      FROM re_assign_quotation aq
      JOIN re_revenue_engine_client_details c
        ON c.id = aq.client_id
      JOIN re_revenue_engine_employees e
        ON e.id = aq.user_id
      LEFT JOIN re_teams t
        ON t.id = aq.team_id
      ${whereSQL}
      ORDER BY aq.id DESC
    `;

    db.query(getQuery, params, (err, results) => {
      if (err) {
        console.error("Database Error:", err);
        return res
          .status(500)
          .json({ status: "Failure", message: "Internal Server Error" });
      }

      // Prefer returning empty list with Success (frontend simpler),
      // but keep your old behavior if you want:
      if (!results.length) {
        return res.status(200).json({
          status: "Success",
          message: "No assigned quotations found",
          data: [],
        });
      }

      return res.status(200).json({
        status: "Success",
        message: "Assigned quotations retrieved successfully",
        data: results,
      });
    });
  } catch (error) {
    console.error("Server Error:", error);
    return res
      .status(500)
      .json({ status: "Failure", message: "Internal Server Error" });
  }
};

exports.getAssignedQuotationsByEmployeeName = async (req, res) => {
  try {
    const { employee_name } = req.params;

    if (!employee_name) {
      return res
        .status(400)
        .json({ status: "Failure", message: "employee_name is required" });
    }

    const getQuery = `
      SELECT 
        aq.id,
        aq.client_id,
        aq.txn_id,
        aq.user_id,
        aq.created_at,
        aq.version,
        aq.updated_at,
        c.client_name,
        e.employee_name
      FROM re_assign_quotation aq
      JOIN re_revenue_engine_client_details c 
        ON aq.client_id = c.id
      JOIN re_revenue_engine_employees e 
        ON aq.user_id = e.id
      WHERE e.employee_name = ?
      ORDER BY aq.created_at DESC
    `;

    db.query(getQuery, [employee_name], (err, results) => {
      if (err) {
        console.error("Database Error:", err);
        return res
          .status(500)
          .json({ status: "Failure", message: "Internal Server Error" });
      }

      return res.status(200).json({
        status: "Success",
        message: "Assigned quotations retrieved successfully",
        data: results, // [] if none
      });
    });
  } catch (error) {
    console.error("Server Error:", error);
    return res
      .status(500)
      .json({ status: "Failure", message: "Internal Server Error" });
  }
};

// NEW WORK FOR Remainder work progress

exports.getProgressByTxn = (req, res) => {
  const { txn_id } = req.params;
  if (!txn_id) {
    return res
      .status(400)
      .json({ status: "Failure", message: "Missing txn_id" });
  }

  const q = `
    SELECT id, client_id, txn_id, service_name, category_name, editing_type_name,
           planned_qty, done_qty, last_updated_by, updated_at
    FROM re_service_progress
    WHERE txn_id = ?
    ORDER BY service_name, category_name, editing_type_name
  `;
  db.query(q, [txn_id], (err, rows) => {
    if (err) {
      console.error("DB Error:", err);
      return res
        .status(500)
        .json({ status: "Failure", message: "Internal Server Error" });
    }
    return res.status(200).json({
      status: "Success",
      message: "Progress fetched",
      data: rows,
    });
  });
};

// NEW WORK FOR re_teams Members

// USE API retrieveUser
exports.retrieveTeam = async (req, res) => {
  try {
    const getQuery = `SELECT id, name, created_at FROM re_teams ORDER BY id DESC`;

    db.query(getQuery, (err, results) => {
      if (err) {
        console.error("Database Error:", err);
        return res
          .status(500)
          .json({ status: "Failure", message: "Internal Server Error" });
      }

      if (results.length === 0) {
        return res
          .status(404)
          .json({ status: "Failure", message: "TEAM not found" });
      }

      return res.status(200).json({
        status: "Success",
        message: "TEAM retrieved successfully",
        data: results,
      });
    });
  } catch (error) {
    console.error("Server Error:", error);
    return res
      .status(500)
      .json({ status: "Failure", message: "Internal Server Error" });
  }
};

exports.retrieveTeamById = async (req, res) => {
  try {
    const { id } = req.params;

    const qTeam = `SELECT id, name, created_at FROM re_teams WHERE id = ? LIMIT 1`;

    db.query(qTeam, [id], (err, rows) => {
      if (err) {
        console.error("Database Error:", err);
        return res
          .status(500)
          .json({ status: "Failure", message: "Internal Server Error" });
      }

      if (!rows.length) {
        return res
          .status(404)
          .json({ status: "Failure", message: "Team not found" });
      }

      const team = rows[0];

      const qMembers = `
        SELECT e.id, e.employee_name, e.employee_email
        FROM re_team_members tm
        JOIN re_revenue_engine_employees e ON e.id = tm.employee_id
        WHERE tm.team_id = ?
        ORDER BY e.employee_name ASC
      `;

      db.query(qMembers, [id], (mErr, mRows) => {
        if (mErr) {
          console.error("Database Error:", mErr);
          return res
            .status(500)
            .json({ status: "Failure", message: "Internal Server Error" });
        }

        return res.status(200).json({
          status: "Success",
          message: "Team retrieved successfully",
          data: {
            ...team,
            members: mRows,
          },
        });
      });
    });
  } catch (error) {
    console.error("Server Error:", error);
    return res
      .status(500)
      .json({ status: "Failure", message: "Internal Server Error" });
  }
};

exports.getAssignmentsSummary = (req, res) => {
  const { txn_id } = req.params;
  const sql = `
    SELECT aq.id, aq.txn_id, aq.user_id, aq.team_id, aq.assignment_mode, DATE_FORMAT(aq.deadline, '%Y-%m-%d') AS deadline_local,
           e.employee_name, e.employee_email, t.name as team_name
    FROM re_assign_quotation aq
    JOIN re_revenue_engine_employees e ON e.id = aq.user_id
    LEFT JOIN re_teams t ON t.id = aq.team_id
    WHERE aq.txn_id = ?
    ORDER BY e.employee_name ASC
  `;
  db.query(sql, [txn_id], (err, rows = []) => {
    if (err)
      return res
        .status(500)
        .json({ status: "Failure", message: "Internal Server Error" });
    if (!rows.length)
      return res
        .status(404)
        .json({ status: "Failure", message: "No assignment found" });

    const distinctTeam = [
      ...new Set(rows.map((r) => r.team_id).filter(Boolean)),
    ];
    const hasTeam = distinctTeam.length === 1;
    const allTeamMode = rows.every(
      (r) => r.assignment_mode === "team" && r.team_id
    );
    const isSingle =
      rows.length === 1 &&
      rows[0].assignment_mode === "single" &&
      !rows[0].team_id;
    const mode = isSingle
      ? "single"
      : allTeamMode && hasTeam
      ? "team"
      : "mixed";

    return res.status(200).json({
      status: "Success",
      message: "Summary fetched",
      data: {
        mode,
        total: rows.length,
        team: hasTeam ? { id: rows[0].team_id, name: rows[0].team_name } : null,
        assignees: rows.map((r) => ({
          id: r.id,
          user_id: r.user_id,
          name: r.employee_name,
          email: r.employee_email,
          via_team: !!r.team_id,
          deadline: r.deadline,
        })),
      },
    });
  });
};

exports.getByIDComplimentaryData = async (req, res) => {
  const { txn_id, client_id } = req.params;

  try {
    db.query(
      "SELECT * FROM re_complimentary WHERE txn_id = ? AND client_id = ?",
      [txn_id, client_id],
      (err, results) => {
        if (err) {
          return res.status(500).json({
            status: "Failure",
            message: "Database error",
            error: err,
          });
        }

        if (results.length === 0) {
          return res.status(404).json({
            status: "Failure",
            message: "No calculator transactions found",
          });
        }

        res.status(200).json({
          status: "Success",
          data: results,
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Server error",
      error,
    });
  }
};

exports.getRequirementsLink = async (req, res) => {
  try {
    // const query = `
    //   SELECT
    //     c.id AS client_id,
    //     c.client_name,
    //     l.id AS link_id,
    //     l.created_by,
    //     l.created_at AS link_created_at,
    //     r.id,
    //     COALESCE(SUM(r.total_amount), 0) AS total_amount
    //   FROM re_revenue_engine_client_details c
    //   LEFT JOIN re_client_requirement_links l ON l.client_id = c.id
    //   LEFT JOIN re_requirement_submissions r ON r.link_id = l.id
    //   GROUP BY c.id, c.client_name, l.id, l.created_by, l.created_at
    //   ORDER BY l.created_at DESC
    // `;
    const query = `
SELECT 
  l.id AS link_id,
  l.client_id,
  c.client_name,
  l.created_by,
  l.created_at,
  GROUP_CONCAT(r.id ORDER BY r.id) AS submission_ids,   -- <-- list of IDs
  COALESCE(SUM(r.total_amount), 0) AS total_amount
FROM re_client_requirement_links l
LEFT JOIN re_revenue_engine_client_details c ON c.id = l.client_id
LEFT JOIN re_requirement_submissions r ON r.link_id = l.id
GROUP BY l.id, l.client_id, c.client_name, l.created_by, l.created_at
ORDER BY l.created_at DESC;
    `;

    db.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching data:", err);
        return res.status(500).json({ error: "Database query failed" });
      }
      res.json({ success: true, data: results });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getRequirementsDetail = async (req, res) => {
  const linkId = req.params.linkId;

  const sql = `
    SELECT
      l.id              AS link_id,
      l.client_id,
      c.client_name,
      l.created_by,
      l.created_at      AS link_created_at,

      s.id              AS submission_id,
      s.slug            AS submission_slug,
      s.name            AS submission_name,
      s.email           AS submission_email,
      s.phone           AS submission_phone,
      s.requirement     AS submission_requirement,
      s.total_amount    AS submission_total_amount,
      s.created_at      AS submission_created_at,

      i.id              AS item_id,
      i.category        AS item_category,
      i.sub_category    AS item_sub_category,
      i.unit_price      AS item_unit_price,
      i.qty             AS item_qty,
      i.line_total      AS item_line_total

    FROM re_client_requirement_links l
    LEFT JOIN re_revenue_engine_client_details c ON c.id = l.client_id
    LEFT JOIN re_requirement_submissions s      ON s.link_id = l.id
    LEFT JOIN re_requirement_submission_items i ON i.submission_id = s.id
    WHERE l.id = ?
    ORDER BY s.id DESC, i.id ASC;
  `;

  db.query(sql, [linkId], (err, rows) => {
    if (err) {
      console.error("getRequirementsDetail error:", err);
      return res.status(500).json({ success: false, message: "DB error" });
    }

    if (!rows || rows.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: "No data for this link_id",
      });
    }

    // Top-level link meta (same for all rows)
    const { link_id, client_id, client_name, created_by, link_created_at } =
      rows[0];

    // Group rows -> submissions[] -> items[]
    const submissionsMap = new Map();

    for (const r of rows) {
      if (!r.submission_id) continue; // कोई submission ही नहीं

      if (!submissionsMap.has(r.submission_id)) {
        submissionsMap.set(r.submission_id, {
          id: r.submission_id,
          slug: r.submission_slug,
          name: r.submission_name,
          email: r.submission_email,
          phone: r.submission_phone,
          requirement: r.submission_requirement,
          total_amount: Number(r.submission_total_amount || 0),
          created_at: r.submission_created_at,
          items: [],
        });
      }

      if (r.item_id) {
        submissionsMap.get(r.submission_id).items.push({
          id: r.item_id,
          category: r.item_category,
          sub_category: r.item_sub_category,
          unit_price: Number(r.item_unit_price || 0),
          qty: Number(r.item_qty || 0),
          line_total: Number(r.item_line_total || 0),
        });
      }
    }

    const submissions = Array.from(submissionsMap.values());

    // Overall totals (अगर चाहिए)
    const grand_total = submissions.reduce(
      (sum, s) => sum + (s.total_amount || 0),
      0
    );

    return res.json({
      success: true,
      data: {
        link: {
          link_id,
          client_id,
          client_name,
          created_by,
          created_at: link_created_at,
          grand_total,
          submission_count: submissions.length,
        },
        submissions,
      },
    });
  });
};

exports.getNoteData = async (req, res) => {
  try {
    db.query("SELECT * FROM re_notes_data", (err, results) => {
      if (err) {
        return res.status(500).json({
          status: "Failure",
          message: "Database error",
          error: err,
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          status: "Failure",
          message: "No Data Found",
        });
      }

      res.status(200).json({
        status: "Success",
        data: results,
      });
    });
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Server error",
      error,
    });
  }
};
exports.getNoteData = async (req, res) => {
  try {
    db.query("SELECT * FROM re_notes_data", (err, results) => {
      if (err) {
        return res.status(500).json({
          status: "Failure",
          message: "Database error",
          error: err,
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          status: "Failure",
          message: "No Data Found",
        });
      }

      res.status(200).json({
        status: "Success",
        data: results,
      });
    });
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Server error",
      error,
    });
  }
};

exports.getByIDDiscountData = async (req, res) => {
  const { txn_id, client_id } = req.params;

  try {
    db.query(
      "SELECT * FROM re_discount WHERE txn_id = ? AND client_id = ?",
      [txn_id, client_id],
      (err, results) => {
        if (err) {
          return res.status(500).json({
            status: "Failure",
            message: "Database error",
            error: err,
          });
        }

        if (results.length === 0) {
          return res.status(404).json({
            status: "Failure",
            message: "No Data found",
          });
        }

        res.status(200).json({
          status: "Success",
          data: results,
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Server error",
      error,
    });
  }
};
exports.getInvoiceByIdData = async (req, res) => {
  const { txn_id, client_id } = req.params;

  try {
    db.query(
      "SELECT * FROM re_invoice_graphic WHERE txn_id = ? AND client_id = ?",
      [txn_id, client_id],
      (err, results) => {
        if (err) {
          return res.status(500).json({
            status: "Failure",
            message: "Database error",
            error: err,
          });
        }

        if (results.length === 0) {
          return res.status(404).json({
            status: "Failure",
            message: "No Data found",
          });
        }

        res.status(200).json({
          status: "Success",
          data: results,
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Server error",
      error,
    });
  }
};

exports.getinInvoiceServiceHistory = async (req, res) => {
  const { client_id, txn_id } = req.params;

  const query = `
  SELECT 
  'Graphic Service' AS service_type,
  ct.txn_id,
  NULL AS created_at,
  ct.service_name,
  ct.category_name,
  ct.editing_type_name,
  ct.editing_type_amount,
  ct.quantity,
  ct.include_content_posting,
  ct.include_thumbnail_creation,
  ct.include_youtube_video_posting,
  ct.plan_name,
  ct.total_amount,
  NULL AS amount,
  NULL AS percent,
  NULL AS charge
FROM re_invoice_graphic ct
WHERE ct.txn_id = ? AND ct.client_id = ?
  
UNION

SELECT 
  'Ads Campaign' AS service_type,
  ad.txn_id,
  NULL AS created_at,
  NULL AS service_name,
  ad.category AS category_name,
  NULL AS editing_type_name,
  NULL AS editing_type_amount,
  NULL AS quantity,
  NULL AS include_content_posting,
  NULL AS include_thumbnail_creation,
  NULL AS include_youtube_video_posting,
  NULL AS plan_name,
  ad.total AS total_amount,
  ad.amount,
  ad.percent,
  ad.charge
FROM re_ads_campaign_details_invoice ad
WHERE ad.txn_id = ? AND ad.client_id = ?
 
  `;

  db.query(query, [txn_id, client_id, txn_id, client_id], (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ status: "Failure", message: "Database error", error: err });
    }

    res.status(200).json({
      status: "Success",
      message: "Client service history fetched successfully",
      data: result,
    });
  });
};

exports.getAllInvoiceServiceHistory = async (req, res) => {
  const { client_id, txn_id } = req.params;

  const query = `
    SELECT 
      'Graphic Service' AS service_type,
      ct.txn_id,
      ct.created_at,
      ct.service_name,
      ct.category_name,
      ct.editing_type_name,
      ct.editing_type_amount,
      ct.quantity,
      ct.include_content_posting,
      ct.include_thumbnail_creation,
      ct.include_youtube_video_posting,
      ct.plan_name,
      ct.total_amount,
      NULL AS amount,
      NULL AS percent,
      NULL AS charge
    FROM re_invoice_graphic ct
    WHERE ct.txn_id = ? AND ct.client_id = ?
    
    UNION ALL

    SELECT 
      'Ads Campaign' AS service_type,
      ad.txn_id,
      ad.created_at,
      NULL AS service_name,
      ad.category AS category_name,
      NULL AS editing_type_name,
      NULL AS editing_type_amount,
      NULL AS quantity,
      NULL AS include_content_posting,
      NULL AS include_thumbnail_creation,
      NULL AS include_youtube_video_posting,
      NULL AS plan_name,
      ad.total AS total_amount,
      ad.amount,
      ad.percent,
      ad.charge
    FROM re_ads_campaign_details_invoice ad
    WHERE ad.txn_id = ? AND ad.client_id = ?

    UNION ALL

    SELECT 
      're_complimentary' AS service_type,
      c.txn_id,
      c.created_at,
      c.service_name,
      c.category_name,
      c.editing_type_name,
      c.editing_type_amount,
      c.quantity,
      c.include_content_posting,
      c.include_thumbnail_creation,
      NULL AS include_youtube_video_posting,
      NULL AS plan_name,
      c.total_amount,
      NULL AS amount,
      NULL AS percent,
      NULL AS charge
    FROM re_complimentary_invoice c
    WHERE c.txn_id = ? AND c.client_id = ?
  `;

  try {
    db.query(
      query,
      [txn_id, client_id, txn_id, client_id, txn_id, client_id],
      (err, result) => {
        if (err) {
          return res.status(500).json({
            status: "Failure",
            message: "Database error",
            error: err,
          });
        }

        if (!result || result.length === 0) {
          return res.status(404).json({
            status: "Failure",
            message: "No service history found",
          });
        }

        res.status(200).json({
          status: "Success",
          message: "Client service history fetched successfully",
          data: result,
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Server error",
      error,
    });
  }
};

exports.getComplimentaryInvoiceData = async (req, res) => {
  const { txn_id, client_id } = req.params;

  try {
    db.query(
      "SELECT * FROM re_complimentary_invoice WHERE txn_id = ? AND client_id = ?",
      [txn_id, client_id],
      (err, results) => {
        if (err) {
          return res.status(500).json({
            status: "Failure",
            message: "Database error",
            error: err,
          });
        }

        if (results.length === 0) {
          return res.status(404).json({
            status: "Failure",
            message: "No calculator transactions found",
          });
        }

        res.status(200).json({
          status: "Success",
          data: results,
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Server error",
      error,
    });
  }
};

exports.getInvoiceClientDetailsById = async (req, res) => {
  const { client_id, txn_id } = req.params;
  const util = require('util');
  const query = util.promisify(db.query).bind(db);

  try {
    const results = await query("SELECT * FROM re_invoice WHERE client_id = ? AND txn_id = ?", [client_id, txn_id]);
    
    if (results.length === 0) {
      return res.status(404).json({ status: "Failure", message: "Client not found" });
    }

    const invoice = results[0];

    if (invoice.invoice_source === 'proposal' && invoice.proforma_id) {
       const prevInvoices = await query(
         "SELECT bill_number, created_at FROM re_invoice WHERE proforma_id = ? AND id < ? ORDER BY id DESC LIMIT 1",
         [invoice.proforma_id, invoice.id]
       );
       if (prevInvoices.length > 0) {
         invoice.previous_invoice_no = prevInvoices[0].bill_number;
         invoice.previous_invoice_date = prevInvoices[0].created_at;
       }
       
       const pastPayments = await query(
         "SELECT SUM(amount) as total_past, SUM(realized_ad_budget) as total_past_ad FROM re_proposal_payment_records WHERE proforma_id = ? AND status = 'approved' AND id < (SELECT id FROM (SELECT id FROM re_proposal_payment_records WHERE txn_id = ? LIMIT 1) as t)",
         [invoice.proforma_id, invoice.txn_id]
       );
       invoice.total_past_received = Number(pastPayments[0].total_past || 0);
       invoice.total_past_ad_budget = Number(pastPayments[0].total_past_ad || 0);
    }

    res.status(200).json({ status: "Success", data: invoice });
  } catch (error) {
    res.status(500).json({ status: "Failure", message: "Server error", error });
  }
};
exports.getInvoiceGraphic = async (req, res) => {
  const { txn_id, client_id } = req.params;

  try {
    db.query(
      "SELECT * FROM  re_invoice_graphic WHERE txn_id = ? AND client_id = ?",
      [txn_id, client_id],
      (err, results) => {
        if (err) {
          return res.status(500).json({
            status: "Failure",
            message: "Database error",
            error: err,
          });
        }

        if (results.length === 0) {
          return res.status(404).json({
            status: "Failure",
            message: "No re_invoice calculator transactions found",
          });
        }

        res.status(200).json({
          status: "Success",
          data: results,
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Server error",
      error,
    });
  }
};

exports.getInvoiceAdsCampaign = async (req, res) => {
  const { txn_id, client_id } = req.params;

  try {
    db.query(
      "SELECT * FROM re_ads_campaign_details_invoice WHERE txn_id = ? AND client_id = ?",
      [txn_id, client_id],
      (err, results) => {
        if (err) {
          return res.status(500).json({
            status: "Failure",
            message: "Database error",
            error: err,
          });
        }

        if (results.length === 0) {
          return res.status(404).json({
            status: "Failure",
            message: "No re_invoice calculator transactions found",
          });
        }

        res.status(200).json({
          status: "Success",
          data: results,
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Server error",
      error,
    });
  }
};
exports.getInvoiceNoteData = async (req, res) => {
  try {
    db.query("SELECT * FROM re_invoice_notes_data", (err, results) => {
      if (err) {
        return res.status(500).json({
          status: "Failure",
          message: "Database error",
          error: err,
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          status: "Failure",
          message: "No Data Found",
        });
      }

      res.status(200).json({
        status: "Success",
        data: results,
      });
    });
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Server error",
      error,
    });
  }
};
exports.getInvoiceClientNotesbyId = async (req, res) => {
  const { client_id, txn_id } = req.params;
  try {
    db.query(
      "SELECT * FROM re_invoice_client_notes WHERE client_id = ? AND txn_id = ?",
      [client_id, txn_id],
      (err, results) => {
        if (err) {
          return res.status(500).json({
            status: "Failure",
            message: "Database error",
            error: err,
          });
        }

        if (results.length === 0) {
          return res.status(404).json({
            status: "Failure",
            message: "No re_invoice notes of client found",
          });
        }

        res.status(200).json({
          status: "Success",
          data: results,
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Server error",
      error,
    });
  }
};

exports.getAllInvoice = async (req, res) => {
  try {
    db.query("SELECT * FROM re_invoice", (err, results) => {
      if (err) {
        return res.status(500).json({
          status: "Failure",
          message: "Database error",
          error: err,
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          status: "Failure",
          message: "No re_services found",
        });
      }

      res.status(200).json({
        status: "Success",
        data: results,
      });
    });
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Server error",
      error,
    });
  }
};

exports.getAdditionByIdData = async (req, res) => {
  const { txn_id, client_id } = req.params;

  try {
    db.query(
      "SELECT * FROM re_addtional_service WHERE txn_id = ? AND client_id = ?",
      [txn_id, client_id],
      (err, results) => {
        if (err) {
          return res.status(500).json({
            status: "Failure",
            message: "Database error",
            error: err,
          });
        }

        if (results.length === 0) {
          return res.status(404).json({
            status: "Failure",
            message: "No Data found",
          });
        }

        res.status(200).json({
          status: "Success",
          data: results,
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Server error",
      error,
    });
  }
};
exports.getRemainingAmountByIdData = async (req, res) => {
  const { txn_id, client_id } = req.params;

  try {
    db.query(
      "SELECT * FROM re_amount_remaining WHERE txn_id = ? AND client_id = ?",
      [txn_id, client_id],
      (err, results) => {
        if (err) {
          return res.status(500).json({
            status: "Failure",
            message: "Database error",
            error: err,
          });
        }

        if (results.length === 0) {
          return res.status(404).json({
            status: "Failure",
            message: "No Data found",
          });
        }

        res.status(200).json({
          status: "Success",
          data: results,
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Server error",
      error,
    });
  }
};

exports.getSeoClientsWithKeywords = (req, res) => {
  try {
    const querySQL = `
      SELECT c.id AS client_id, c.name, c.website, k.id AS keyword_id, k.keyword, k.created_at AS keyword_created_at
      FROM seo_clients c
      LEFT JOIN seo_keywords k ON c.id = k.client_id
      ORDER BY c.id DESC, k.id DESC
    `;

    db.query(querySQL, (err, results) => {
      if (err) {
        console.error("DB Error:", err);
        return res.status(500).json({
          status: "Failure",
          message: "Database error",
          error: err,
        });
      }

      return res.status(200).json({
        status: "Success",
        message: "Clients with keywords fetched successfully",
        data: results,
      });
    });
  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({
      status: "Failure",
      message: "Internal Server Error",
    });
  }
};

exports.getDiscountSetting = async (req, res) => {
  try {
    db.query("SELECT * FROM re_discount_settings", (err, results) => {
      if (err) {
        return res.status(500).json({
          status: "Failure",
          message: "Database error",
          error: err,
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          status: "Failure",
          message: "No plan found",
        });
      }

      res.status(200).json({
        status: "Success",
        data: results,
      });
    });
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Server error",
      error,
    });
  }
};
