const { db } = require("../../connect");
const dotenv = require("dotenv");
dotenv.config();

exports.deleteService = async (req, res) => {
  const { service_id } = req.params;

  db.query(
    "DELETE FROM re_services WHERE service_id = ?",
    [service_id],
    (err, result) => {
      if (err) {
        return res
          .status(500)
          .json({ status: "Failure", message: "Database error" });
      }
      res.json({ status: "Success", message: "Service deleted successfully" });
    },
  );
};

exports.deleteCategory = async (req, res) => {
  const { category_id } = req.params;

  db.query(
    "DELETE FROM re_categories WHERE category_id = ?",
    [category_id],
    (err, result) => {
      if (err) {
        return res
          .status(500)
          .json({ status: "Failure", message: "Database error" });
      }
      res.json({ status: "Success", message: "Category deleted successfully" });
    },
  );
};

exports.deleteEditingType = async (req, res) => {
  const { editing_type_id } = req.params;

  db.query(
    "DELETE FROM re_editing_types WHERE editing_type_id = ?",
    [editing_type_id],
    (err, result) => {
      if (err) {
        return res
          .status(500)
          .json({ status: "Failure", message: "Database error" });
      }
      res.json({
        status: "Success",
        message: "Editing type deleted successfully",
      });
    },
  );
};

exports.deleteAdsServices = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      status: "Failure",
      message: "ID is required to delete the ad service.",
    });
  }

  try {
    db.query(
      "DELETE FROM re_revenue_engine_ads WHERE id = ?",
      [id],
      (err, result) => {
        if (err) {
          return res.status(500).json({
            status: "Failure",
            message: "Database error",
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            status: "Failure",
            message: "No ad service found with the given ID",
          });
        }

        res.status(200).json({
          status: "Success",
          message: "Ads Service deleted successfully",
        });
      },
    );
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Server error",
      error,
    });
  }
};

exports.deleteAdsCampaignDetails = async (req, res) => {
  const { txn_id, client_id } = req.params;

  try {
    db.query(
      "DELETE FROM re_ads_campaign_details WHERE txn_id = ? AND client_id = ?",
      [txn_id, client_id],
      (err, result) => {
        if (err) {
          return res.status(500).json({
            status: "Failure",
            message: "Database error while deleting",
            error: err,
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            status: "Failure",
            message: "No campaign data found to delete",
          });
        }

        res.status(200).json({
          status: "Success",
          message: "Campaign details deleted successfully",
        });
      },
    );
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Server error",
      error,
    });
  }
};

exports.deleteAdsCampaignEntryById = async (req, res) => {
  const { id } = req.params; // ads_campaign_details.id

  try {
    // Step 1: Find txn_id, client_id, and details for this quotation entry
    const findTxn =
      "SELECT txn_id, client_id, category, amount FROM re_ads_campaign_details WHERE id = ?";
    db.query(findTxn, [id], (err, rows) => {
      if (err) {
        return res.status(500).json({
          status: "Failure",
          message: "Database error while fetching entry",
          error: err,
        });
      }

      if (rows.length === 0) {
        return res.status(404).json({
          status: "Failure",
          message: "No Ads entry found to delete",
        });
      }

      const { txn_id, client_id, category, amount } = rows[0];

      // Step 2: Delete Ads row
      const deleteQuotation =
        "DELETE FROM re_ads_campaign_details WHERE id = ?";
      db.query(deleteQuotation, [id], (err2, result2) => {
        if (err2) {
          return res.status(500).json({
            status: "Failure",
            message: "Error deleting from re_ads_campaign_details",
            error: err2,
          });
        }

        // Step 3: Delete matching re_invoice row (if exists)
        const deleteInvoice = `
          DELETE FROM re_ads_campaign_details_invoice 
          WHERE txn_id = ? 
          AND client_id = ? 
          AND category = ? 
          AND amount = ? 
          LIMIT 1
        `;

        db.query(
          deleteInvoice,
          [txn_id, client_id, category, amount],
          (err3, result3) => {
            if (err3) {
              return res.status(500).json({
                status: "Failure",
                message: "Error deleting from re_ads_campaign_details_invoice",
                error: err3,
              });
            }

            if (result3.affectedRows > 0) {
              return res.status(200).json({
                status: "Success",
                message:
                  "Ads Quotation entry and matching Ads invoice entry deleted successfully",
              });
            } else {
              return res.status(200).json({
                status: "Success",
                message:
                  "Ads Quotation entry deleted successfully (No matching ads invoice found)",
              });
            }
          },
        );
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

exports.deleteGraphicEntryById = async (req, res) => {
  const { id } = req.params; // calculator_transactions.id

  try {
    // Step 1: Find txn_id, client_id, and details for this quotation entry
    const findTxn =
      "SELECT txn_id, client_id, service_name, category_name, editing_type_name FROM re_calculator_transactions WHERE id = ?";
    db.query(findTxn, [id], (err, rows) => {
      if (err) {
        return res.status(500).json({
          status: "Failure",
          message: "Database error while fetching entry",
          error: err,
        });
      }

      if (rows.length === 0) {
        return res.status(404).json({
          status: "Failure",
          message: "No quotation entry found to delete",
        });
      }

      const {
        txn_id,
        client_id,
        service_name,
        category_name,
        editing_type_name,
      } = rows[0];

      // Step 2: Delete quotation row
      const deleteQuotation =
        "DELETE FROM re_calculator_transactions WHERE id = ?";
      db.query(deleteQuotation, [id], (err2, result2) => {
        if (err2) {
          return res.status(500).json({
            status: "Failure",
            message: "Error deleting from re_calculator_transactions",
            error: err2,
          });
        }

        // Step 3: Delete matching re_invoice row (if exists)
        const deleteInvoice = `
          DELETE FROM re_invoice_graphic 
          WHERE txn_id = ? 
          AND client_id = ? 
          AND service_name = ? 
          AND category_name = ? 
          AND editing_type_name = ?
          LIMIT 1
        `;

        db.query(
          deleteInvoice,
          [txn_id, client_id, service_name, category_name, editing_type_name],
          (err3, result3) => {
            if (err3) {
              return res.status(500).json({
                status: "Failure",
                message: "Error deleting from re_invoice_graphic",
                error: err3,
              });
            }

            if (result3.affectedRows > 0) {
              return res.status(200).json({
                status: "Success",
                message:
                  "Quotation entry and matching invoice entry deleted successfully",
              });
            } else {
              return res.status(200).json({
                status: "Success",
                message:
                  "Quotation entry deleted successfully (No matching invoice found)",
              });
            }
          },
        );
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

exports.deleteClientById = async (req, res) => {
  const { id } = req.params;

  try {
    // Step 1: delete plan client notes
    const deletePlanClientNotes =
      "DELETE FROM re_plan_client_notes WHERE client_id = ?";
    db.query(deletePlanClientNotes, [id], (err1) => {
      if (err1) {
        return res.status(500).json({
          status: "Failure",
          message: "Error deleting plan client notes",
          error: err1,
        });
      }

      // Step 2: delete ads campaign
      const deleteAdsCampaign =
        "DELETE FROM re_ads_campaign_details WHERE client_id = ?";
      db.query(deleteAdsCampaign, [id], (err2) => {
        if (err2) {
          return res.status(500).json({
            status: "Failure",
            message: "Error deleting ads campaign details",
            error: err2,
          });
        }

        // Step 3: delete ads campaign re_invoice
        const deleteAdsCampaignInvoice =
          "DELETE FROM re_ads_campaign_details_invoice WHERE client_id = ?";
        db.query(deleteAdsCampaignInvoice, [id], (err3) => {
          if (err3) {
            return res.status(500).json({
              status: "Failure",
              message: "Error deleting ads campaign invoice",
              error: err3,
            });
          }

          // Step 4: delete calculator transactions
          const deleteTransactions =
            "DELETE FROM re_calculator_transactions WHERE client_id = ?";
          db.query(deleteTransactions, [id], (err4) => {
            if (err4) {
              return res.status(500).json({
                status: "Failure",
                message: "Error deleting calculator transactions",
                error: err4,
              });
            }

            // Step 5: delete re_complimentary
            const deleteComplimentary =
              "DELETE FROM re_complimentary WHERE client_id = ?";
            db.query(deleteComplimentary, [id], (err5) => {
              if (err5) {
                return res.status(500).json({
                  status: "Failure",
                  message: "Error deleting complimentary services",
                  error: err5,
                });
              }

              // Step 6: delete re_complimentary re_invoice
              const deleteComplimentaryInvoice =
                "DELETE FROM re_complimentary_invoice WHERE client_id = ?";
              db.query(deleteComplimentaryInvoice, [id], (err6) => {
                if (err6) {
                  return res.status(500).json({
                    status: "Failure",
                    message: "Error deleting complimentary invoice",
                    error: err6,
                  });
                }

                // Step 7: delete re_invoice client notes
                const deleteInvoiceNotes =
                  "DELETE FROM re_invoice_client_notes WHERE client_id = ?";
                db.query(deleteInvoiceNotes, [id], (err7) => {
                  if (err7) {
                    return res.status(500).json({
                      status: "Failure",
                      message: "Error deleting invoice client notes",
                      error: err7,
                    });
                  }

                  // Step 8: delete invoices
                  const deleteInvoice =
                    "DELETE FROM re_invoice WHERE client_id = ?";
                  db.query(deleteInvoice, [id], (err8) => {
                    if (err8) {
                      return res.status(500).json({
                        status: "Failure",
                        message: "Error deleting invoices",
                        error: err8,
                      });
                    }

                    // Step 9: finally delete client
                    const deleteClient =
                      "DELETE FROM re_revenue_engine_client_details WHERE id = ?";
                    db.query(deleteClient, [id], (err9, result) => {
                      if (err9) {
                        return res.status(500).json({
                          status: "Failure",
                          message: "Database error while deleting client entry",
                          error: err9,
                        });
                      }

                      if (result.affectedRows === 0) {
                        return res.status(404).json({
                          status: "Failure",
                          message: "No Client entry found to delete",
                        });
                      }

                      res.status(200).json({
                        status: "Success",
                        message:
                          "Client and all related data deleted successfully",
                      });
                    });
                  });
                });
              });
            });
          });
        });
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

exports.deleteQuoatationById = async (req, res) => {
  const { txn_id } = req.params;

  if (!txn_id) {
    return res.status(400).json({
      status: "Failure",
      message: "Missing txn_id parameter",
    });
  }

  // All related tables for quotation deletion
  const queries = [
    { table: "re_calculator_transactions", field: "txn_id" },
    { table: "re_ads_campaign_details", field: "txn_id" },
    { table: "re_plan_client_notes", field: "txn_id" },
    { table: "re_assign_quotation", field: "txn_id" },
    { table: "re_invoice", field: "txn_id" },
    { table: "re_invoice_graphic", field: "txn_id" },
    { table: "re_ads_campaign_details_invoice", field: "txn_id" },
    { table: "re_complimentary_invoice", field: "txn_id" },
    { table: "re_addtional_service", field: "txn_id" },
    { table: "re_amount_remaining", field: "txn_id" },
  ];

  try {
    let deletedTables = [];

    // Run deletes sequentially
    for (const q of queries) {
      const result = await new Promise((resolve, reject) => {
        db.query(
          `DELETE FROM ${q.table} WHERE ${q.field} = ?`,
          [txn_id],
          (err, result) => {
            if (err) return reject(err);
            resolve(result);
          },
        );
      });

      if (result.affectedRows > 0) {
        deletedTables.push(q.table);
      }
    }

    if (deletedTables.length === 0) {
      return res.status(404).json({
        status: "Failure",
        message: "No quotation records found for given txn_id",
      });
    }

    res.status(200).json({
      status: "Success",
      message: `Quotation deleted successfully from: ${deletedTables.join(", ")}`,
    });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({
      status: "Failure",
      message: "Error deleting quotation data",
      error,
    });
  }
};

exports.deletePlanNameDetail = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      status: "Failure",
      message: "Missing id parameter",
    });
  }

  const deletePlanDetail = "DELETE FROM re_plan_details WHERE id = ?";
  const deletePlanData = "DELETE FROM re_plan_data WHERE plan_id = ?";
  const deletePlanNotes = "DELETE FROM re_plans_notes WHERE plan_id = ?";

  db.query(deletePlanDetail, [id], (err1, result1) => {
    if (err1) {
      return res.status(500).json({
        status: "Failure",
        message: "Error deleting plan detail",
        error: err1,
      });
    }

    db.query(deletePlanData, [id], (err2, result2) => {
      if (err2) {
        return res.status(500).json({
          status: "Failure",
          message: "Error deleting plan data",
          error: err2,
        });
      }

      db.query(deletePlanNotes, [id], (err3, result3) => {
        if (err3) {
          return res.status(500).json({
            status: "Failure",
            message: "Error deleting plan notes",
            error: err3,
          });
        }

        return res.status(200).json({
          status: "Success",
          message:
            "Plan deleted successfully from re_plan_details, re_plan_data, and re_plans_notes",
        });
      });
    });
  });
};

exports.deletePlanData = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      status: "Failure",
      message: "Missing id parameter",
    });
  }

  const deletePlanData = "DELETE FROM re_plan_data  WHERE plan_id = ?";

  db.query(deletePlanData, [id], (err2, result2) => {
    if (err2) {
      return res.status(500).json({
        status: "Failure",
        message: "Error delete plan data",
        error: err2,
      });
    }

    res.status(200).json({
      status: "Success",
      message: ` delete of re_plan_data in successfully`,
    });
  });
};

exports.deletePlanNotesbyid = async (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM re_plans_notes WHERE id = ?", [id], (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ status: "Failure", message: "Database error" });
    }
  });
};

exports.deletePlanDataByService = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      status: "Failure",
      message: "Missing id parameter",
    });
  }

  const deletePlanData = "DELETE FROM re_plan_data  WHERE id = ?";

  db.query(deletePlanData, [id], (err2, result2) => {
    if (err2) {
      return res.status(500).json({
        status: "Failure",
        message: "Error delete plan data service",
        error: err2,
      });
    }

    res.status(200).json({
      status: "Success",
      message: ` delete of plan data service in successfully`,
    });
  });
};

exports.deletePlanbyChangeNotes = async (req, res) => {
  const { txn_id } = req.params;

  if (!txn_id) {
    return res.status(400).json({
      status: "Failure",
      message: "Missing txn_id parameter",
    });
  }

  const deletePlanData = "DELETE FROM re_plan_client_notes  WHERE txn_id = ?";

  db.query(deletePlanData, [txn_id], (err2, result2) => {
    if (err2) {
      return res.status(500).json({
        status: "Failure",
        message: "Error delete re_plan_client_notes ",
        error: err2,
      });
    }

    res.status(200).json({
      status: "Success",
      message: ` delete of re_plan_client_notes  in successfully`,
    });
  });
};

exports.deleteClientAllPlanData = async (req, res) => {
  const { txn_id } = req.params;

  if (!txn_id) {
    return res.status(400).json({
      status: "Failure",
      message: "Missing txn_id parameter",
    });
  }

  const deleteCalculatorQuery =
    "DELETE FROM re_calculator_transactions WHERE txn_id = ?";
  const deleteAdsCampaignQuery =
    "DELETE FROM re_ads_campaign_details WHERE txn_id = ?";
  const deleteNotesClient = "DELETE FROM re_plan_client_notes WHERE txn_id = ?";
  const deleteComplimenatry = "DELETE FROM re_complimentary WHERE txn_id = ?";

  db.query(deleteCalculatorQuery, [txn_id], (err1, result1) => {
    if (err1) {
      return res.status(500).json({
        status: "Failure",
        message: "Error deleting from re_calculator_transactions",
        error: err1,
      });
    }

    db.query(deleteAdsCampaignQuery, [txn_id], (err2, result2) => {
      if (err2) {
        return res.status(500).json({
          status: "Failure",
          message: "Error deleting from re_ads_campaign_details",
          error: err2,
        });
      }

      db.query(deleteNotesClient, [txn_id], (err3, result3) => {
        if (err3) {
          return res.status(500).json({
            status: "Failure",
            message: "Error deleting from re_plan_client_notes",
            error: err3,
          });
        }

        db.query(deleteComplimenatry, [txn_id], (err4, result4) => {
          if (err4) {
            return res.status(500).json({
              status: "Failure",
              message: "Error deleting from re_complimentary",
              error: err4,
            });
          }

          const deletedFromCalculator = result1.affectedRows > 0;
          const deletedFromAds = result2.affectedRows > 0;
          const deletedFromNotes = result3.affectedRows > 0;
          const deletedFromComplimentary = result4.affectedRows > 0;

          if (
            !deletedFromCalculator &&
            !deletedFromAds &&
            !deletedFromNotes &&
            !deletedFromComplimentary
          ) {
            return res.status(404).json({
              status: "Failure",
              message: "No transaction found with the given txn_id",
            });
          }

          res.status(200).json({
            status: "Success",
            message: `Transaction deleted from ${[
              deletedFromCalculator ? "re_calculator_transactions" : null,
              deletedFromAds ? "re_ads_campaign_details" : null,
              deletedFromNotes ? "re_plan_client_notes" : null,
              deletedFromComplimentary ? "re_complimentary" : null,
            ]
              .filter(Boolean)
              .join(", ")} successfully`,
          });
        });
      });
    });
  });
};

exports.deletePlanClientNotes = async (req, res) => {
  const { id } = req.params;

  db.query(
    "DELETE FROM re_plan_client_notes WHERE id = ?",
    [id],
    (err, result) => {
      if (err) {
        return res
          .status(500)
          .json({ status: "Failure", message: "Database error" });
      }
      res.json({
        status: "Success",
        message: "Note Client deleted successfully",
      });
    },
  );
};

//  NEW WORK For Team work

exports.removeMemberFromTeam = async (req, res) => {
  try {
    const { teamId, memberId } = req.params;

    const q = `DELETE FROM re_team_members WHERE team_id = ? AND employee_id = ?`;

    db.query(q, [teamId, memberId], (err, result) => {
      if (err) {
        console.error("Database Error:", err);
        return res.status(500).json({
          status: "Failure",
          message: "Failed to remove member",
        });
      }

      if (!result.affectedRows) {
        return res.status(404).json({
          status: "Failure",
          message: "Member not found in team",
        });
      }

      return res.status(200).json({
        status: "Success",
        message: "Member removed successfully",
        data: { removed: 1 },
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

exports.deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;

    const q = `DELETE FROM re_teams WHERE id = ?`;

    db.query(q, [id], (err, result) => {
      if (err) {
        console.error("Database Error:", err);
        return res.status(500).json({
          status: "Failure",
          message: "Failed to delete team",
        });
      }

      if (!result.affectedRows) {
        return res.status(404).json({
          status: "Failure",
          message: "Team not found",
        });
      }

      return res.status(200).json({
        status: "Success",
        message: "Team deleted successfully",
        data: { deleted: 1 },
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

exports.deleteComplimenatryById = async (req, res) => {
  const { id } = req.params; // complimentary.id

  try {
    // Step 1: Find txn_id, client_id, and details for this quotation entry
    const findTxn =
      "SELECT txn_id, client_id, service_name, category_name, editing_type_name FROM re_complimentary WHERE id = ?";
    db.query(findTxn, [id], (err, rows) => {
      if (err) {
        return res.status(500).json({
          status: "Failure",
          message: "Database error while fetching entry",
          error: err,
        });
      }

      if (rows.length === 0) {
        return res.status(404).json({
          status: "Failure",
          message: "No quotation entry found to delete",
        });
      }

      const {
        txn_id,
        client_id,
        service_name,
        category_name,
        editing_type_name,
      } = rows[0];

      // Step 2: Delete quotation row
      const deleteQuotation = "DELETE FROM re_complimentary WHERE id = ?";
      db.query(deleteQuotation, [id], (err2, result2) => {
        if (err2) {
          return res.status(500).json({
            status: "Failure",
            message: "Error deleting from re_complimentary",
            error: err2,
          });
        }

        // Step 3: Delete matching re_invoice row (if exists)
        const deleteInvoice = `
          DELETE FROM re_complimentary_invoice 
          WHERE txn_id = ? 
          AND client_id = ? 
          AND service_name = ? 
          AND category_name = ? 
          AND editing_type_name = ?
          LIMIT 1
        `;

        db.query(
          deleteInvoice,
          [txn_id, client_id, service_name, category_name, editing_type_name],
          (err3, result3) => {
            if (err3) {
              return res.status(500).json({
                status: "Failure",
                message: "Error deleting from re_complimentary_invoice",
                error: err3,
              });
            }

            if (result3.affectedRows > 0) {
              return res.status(200).json({
                status: "Success",
                message:
                  "ComplimentaryIinvoice entry and matching invoice entry deleted successfully",
              });
            } else {
              return res.status(200).json({
                status: "Success",
                message:
                  "Complimentary invoice entry deleted successfully (No matching invoice found)",
              });
            }
          },
        );
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
exports.deleteNoteById = async (req, res) => {
  const { id } = req.params;

  try {
    db.query("DELETE FROM re_notes_data WHERE id = ?", [id], (err, result) => {
      if (err) {
        return res.status(500).json({
          status: "Failure",
          message: "Database error while deleting entry",
          error: err,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          status: "Failure",
          message: "No Note entry found to delete",
        });
      }

      res.status(200).json({
        status: "Success",
        message: "Note entry deleted successfully",
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
exports.deleteDiscountById = async (req, res) => {
  const { id } = req.params;

  try {
    db.query("DELETE FROM re_discount WHERE id = ?", [id], (err, result) => {
      if (err) {
        return res.status(500).json({
          status: "Failure",
          message: "Database error while deleting entry",
          error: err,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          status: "Failure",
          message: "No Note entry found to delete",
        });
      }

      res.status(200).json({
        status: "Success",
        message: "Note entry deleted successfully",
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
exports.deleteInvoiceById = async (req, res) => {
  const { id } = req.params; // invoice_graphic.id

  try {
    // Step 1: Find txn_id, client_id, and details for this quotation entry
    const findTxn =
      "SELECT txn_id, client_id, service_name, category_name, editing_type_name FROM re_invoice_graphic WHERE id = ?";
    db.query(findTxn, [id], (err, rows) => {
      if (err) {
        return res.status(500).json({
          status: "Failure",
          message: "Database error while fetching entry",
          error: err,
        });
      }

      if (rows.length === 0) {
        return res.status(404).json({
          status: "Failure",
          message: "No quotation entry found to delete",
        });
      }

      const {
        txn_id,
        client_id,
        service_name,
        category_name,
        editing_type_name,
      } = rows[0];

      // Step 2: Delete quotation row
      const deleteQuotation = "DELETE FROM re_invoice_graphic WHERE id = ?";
      db.query(deleteQuotation, [id], (err2, result2) => {
        if (err2) {
          return res.status(500).json({
            status: "Failure",
            message: "Error deleting from re_invoice_graphic",
            error: err2,
          });
        }

        // Step 3: Delete matching re_invoice row (if exists)
        const deleteInvoice = `
          DELETE FROM re_calculator_transactions 
          WHERE txn_id = ? 
          AND client_id = ? 
          AND service_name = ? 
          AND category_name = ? 
          AND editing_type_name = ?
          LIMIT 1
        `;

        db.query(
          deleteInvoice,
          [txn_id, client_id, service_name, category_name, editing_type_name],
          (err3, result3) => {
            if (err3) {
              return res.status(500).json({
                status: "Failure",
                message: "Error deleting from re_calculator_transactions",
                error: err3,
              });
            }

            if (result3.affectedRows > 0) {
              return res.status(200).json({
                status: "Success",
                message:
                  "Invoice entry and matching Quotation entry deleted successfully",
              });
            } else {
              return res.status(200).json({
                status: "Success",
                message:
                  "Invoice entry deleted successfully (No matching quotation found)",
              });
            }
          },
        );
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

exports.deleteRequirementsBundle = async (req, res) => {
  const linkId = Number(req.params.linkId);
  if (!Number.isInteger(linkId)) {
    return res.status(400).json({ success: false, message: "Invalid linkId" });
  }

  const sql = `
    DELETE i, s, l
    FROM re_client_requirement_links l
    LEFT JOIN re_requirement_submissions s ON s.link_id = l.id
    LEFT JOIN re_requirement_submission_items i ON i.submission_id = s.id
    WHERE l.id = ?;
  `;

  db.query(sql, [linkId], (err, result) => {
    if (err) {
      console.error("Delete bundle error:", err);
      return res.status(500).json({ success: false, message: "DB error" });
    }
    // affectedRows = sum of all rows deleted across i, s, l
    return res.json({
      success: true,
      message: "Link + submissions + items deleted successfully",
      affectedRows: result.affectedRows || 0,
    });
  });
};
exports.deleteAllInvoiceServiceHistory = async (req, res) => {
  const { client_id, txn_id } = req.params;

  const queries = [
    { table: "re_invoice", field: "txn_id" },
    { table: "re_invoice_graphic", field: "txn_id" },
    { table: "re_ads_campaign_details_invoice", field: "txn_id" },
    { table: "re_complimentary_invoice", field: "txn_id" },
    { table: "re_addtional_service", field: "txn_id" },
    { table: "re_amount_remaining", field: "txn_id" },
  ];

  try {
    // Run delete queries one by one
    for (const q of queries) {
      await new Promise((resolve, reject) => {
        db.query(
          `DELETE FROM ${q.table} WHERE ${q.field} = ? AND client_id = ?`,
          [txn_id, client_id],
          (err, result) => {
            if (err) return reject(err);
            resolve(result);
          },
        );
      });
    }

    res.status(200).json({
      status: "Success",
      message: "Invoice data deleted successfully for all tables",
    });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({
      status: "Failure",
      message: "Error deleting invoice data",
      error,
    });
  }
};

exports.deleteInvoiceAdsCampaignEntryById = async (req, res) => {
  const { id } = req.params; // ads_campaign_details_invoice.id

  try {
    // Step 1: Find txn_id, client_id, and details for this quotation entry
    const findTxn =
      "SELECT txn_id, client_id, category, amount FROM re_ads_campaign_details_invoice WHERE id = ?";
    db.query(findTxn, [id], (err, rows) => {
      if (err) {
        return res.status(500).json({
          status: "Failure",
          message: "Database error while fetching entry",
          error: err,
        });
      }

      if (rows.length === 0) {
        return res.status(404).json({
          status: "Failure",
          message: "No Ads entry found to delete",
        });
      }

      const { txn_id, client_id, category, amount } = rows[0];

      // Step 2: Delete Ads row
      const deleteQuotation =
        "DELETE FROM re_ads_campaign_details_invoice WHERE id = ?";
      db.query(deleteQuotation, [id], (err2, result2) => {
        if (err2) {
          return res.status(500).json({
            status: "Failure",
            message: "Error deleting from re_ads_campaign_details_invoice",
            error: err2,
          });
        }

        // Step 3: Delete matching re_invoice row (if exists)
        const deleteInvoice = `
          DELETE FROM re_ads_campaign_details 
          WHERE txn_id = ? 
          AND client_id = ? 
          AND category = ? 
          AND amount = ? 
          LIMIT 1
        `;

        db.query(
          deleteInvoice,
          [txn_id, client_id, category, amount],
          (err3, result3) => {
            if (err3) {
              return res.status(500).json({
                status: "Failure",
                message: "Error deleting from re_ads_campaign_details",
                error: err3,
              });
            }

            if (result3.affectedRows > 0) {
              return res.status(200).json({
                status: "Success",
                message:
                  "Ads invoice entry and matching Ads Quotation entry deleted successfully",
              });
            } else {
              return res.status(200).json({
                status: "Success",
                message:
                  "Ads invoice entry deleted successfully (No matching ads Quotation found)",
              });
            }
          },
        );
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

exports.deleteInvoiceNoteById = async (req, res) => {
  const { id } = req.params;

  try {
    db.query(
      "DELETE FROM re_invoice_notes_data WHERE id = ?",
      [id],
      (err, result) => {
        if (err) {
          return res.status(500).json({
            status: "Failure",
            message: "Database error while deleting entry",
            error: err,
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            status: "Failure",
            message: "No Note entry found to delete",
          });
        }

        res.status(200).json({
          status: "Success",
          message: "Note entry deleted successfully",
        });
      },
    );
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Server error",
      error,
    });
  }
};

exports.deleteInvoiceClientNotes = async (req, res) => {
  const { id } = req.params;

  db.query(
    "DELETE FROM re_invoice_client_notes WHERE id = ?",
    [id],
    (err, result) => {
      if (err) {
        return res
          .status(500)
          .json({ status: "Failure", message: "Database error" });
      }
      res.json({
        status: "Success",
        message: "Invoice Note Client deleted successfully",
      });
    },
  );
};

exports.deleteInvoiceComplimenatryById = async (req, res) => {
  const { id } = req.params; // complimentary.id

  try {
    // Step 1: Find txn_id, client_id, and details for this quotation entry
    const findTxn =
      "SELECT txn_id, client_id, service_name, category_name, editing_type_name FROM re_complimentary_invoice WHERE id = ?";
    db.query(findTxn, [id], (err, rows) => {
      if (err) {
        return res.status(500).json({
          status: "Failure",
          message: "Database error while fetching entry",
          error: err,
        });
      }

      if (rows.length === 0) {
        return res.status(404).json({
          status: "Failure",
          message: "No quotation entry found to delete",
        });
      }

      const {
        txn_id,
        client_id,
        service_name,
        category_name,
        editing_type_name,
      } = rows[0];

      // Step 2: Delete quotation row
      const deleteQuotation =
        "DELETE FROM re_complimentary_invoice WHERE id = ?";
      db.query(deleteQuotation, [id], (err2, result2) => {
        if (err2) {
          return res.status(500).json({
            status: "Failure",
            message: "Error deleting from re_complimentary_invoice",
            error: err2,
          });
        }

        // Step 3: Delete matching re_invoice row (if exists)
        const deleteInvoice = `
          DELETE FROM re_complimentary 
          WHERE txn_id = ? 
          AND client_id = ? 
          AND service_name = ? 
          AND category_name = ? 
          AND editing_type_name = ?
          LIMIT 1
        `;

        db.query(
          deleteInvoice,
          [txn_id, client_id, service_name, category_name, editing_type_name],
          (err3, result3) => {
            if (err3) {
              return res.status(500).json({
                status: "Failure",
                message: "Error deleting from re_complimentary",
                error: err3,
              });
            }

            if (result3.affectedRows > 0) {
              return res.status(200).json({
                status: "Success",
                message:
                  "Complimentary invoice entry and matching Quotation entry deleted successfully",
              });
            } else {
              return res.status(200).json({
                status: "Success",
                message:
                  "re_complimentary re_invoice entry deleted successfully (No matching quotation found)",
              });
            }
          },
        );
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

exports.deleteAdditionalById = async (req, res) => {
  const { id } = req.params;

  try {
    db.query(
      "DELETE FROM re_addtional_service WHERE id = ?",
      [id],
      (err, result) => {
        if (err) {
          return res.status(500).json({
            status: "Failure",
            message: "Database error while deleting entry",
            error: err,
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            status: "Failure",
            message: "No Additional entry found to delete",
          });
        }

        res.status(200).json({
          status: "Success",
          message: "Additional entry deleted successfully",
        });
      },
    );
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Server error",
      error,
    });
  }
};

exports.deleteRemainingAmountById = async (req, res) => {
  const { id } = req.params;

  try {
    db.query(
      "DELETE FROM re_amount_remaining WHERE id = ?",
      [id],
      (err, result) => {
        if (err) {
          return res.status(500).json({
            status: "Failure",
            message: "Database error while deleting entry",
            error: err,
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            status: "Failure",
            message: "No Remaining Amount entry found to delete",
          });
        }

        res.status(200).json({
          status: "Success",
          message: "Remaining Amount entry deleted successfully",
        });
      },
    );
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Server error",
      error,
    });
  }
};

exports.deleteSeoClient = (req, res) => {
  try {
    const { clientId } = req.params;
    if (!clientId) {
      return res
        .status(400)
        .json({ status: "Failure", message: "Client ID is required" });
    }

    const deleteSql = `DELETE FROM seo_clients WHERE id = ?`;
    db.query(deleteSql, [clientId], (err, result) => {
      if (err) {
        console.error("DB Error:", err);
        return res
          .status(500)
          .json({ status: "Failure", message: "Database error", error: err });
      }
      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ status: "Failure", message: "Client not found" });
      }
      // Because of ON DELETE CASCADE, related keywords will be removed automatically.
      return res
        .status(200)
        .json({ status: "Success", message: "Client deleted successfully" });
    });
  } catch (error) {
    console.error("Server Error:", error);
    return res
      .status(500)
      .json({ status: "Failure", message: "Internal Server Error" });
  }
};

exports.deleteSeoKeyword = (req, res) => {
  try {
    const { keywordId } = req.params;
    if (!keywordId) {
      return res
        .status(400)
        .json({ status: "Failure", message: "Keyword ID is required" });
    }

    const deleteSql = `DELETE FROM seo_keywords WHERE id = ?`;
    db.query(deleteSql, [keywordId], (err, result) => {
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
      return res
        .status(200)
        .json({ status: "Success", message: "Keyword deleted successfully" });
    });
  } catch (error) {
    console.error("Server Error:", error);
    return res
      .status(500)
      .json({ status: "Failure", message: "Internal Server Error" });
  }
};

exports.deleteDiscountSettingById = async (req, res) => {
  const { id } = req.params;

  try {
    db.query(
      "DELETE FROM re_discount_settings WHERE id = ?",
      [id],
      (err, result) => {
        if (err) {
          return res.status(500).json({
            status: "Failure",
            message: "Database error while deleting entry",
            error: err,
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            status: "Failure",
            message: "No Note entry found to delete",
          });
        }

        res.status(200).json({
          status: "Success",
          message: "Note entry deleted successfully",
        });
      },
    );
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Server error",
      error,
    });
  }
};
