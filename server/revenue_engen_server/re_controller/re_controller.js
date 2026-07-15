const { db } = require("../../connect");
const moment = require("moment-timezone");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const {
  TZ,
  sendRegistrationOtpEmail,
  sendPasswordResetOtpEmail,
} = require("./re_sendEmails");
dotenv.config();

const registerOtpStore = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of registerOtpStore.entries()) {
    if (now > data.expiresAt) {
      registerOtpStore.delete(email);
    }
  }
}, 60 * 1000);

exports.register = async (req, res) => {
  const { employee_name, employee_role, employee_email, employee_password } =
    req.body;

  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  if (
    !employee_name ||
    !employee_role ||
    !employee_email ||
    !employee_password
  ) {
    return res
      .status(400)
      .json({ status: "Failure", message: "All fields are required." });
  }

  try {
    db.query(
      "SELECT * FROM re_revenue_engine_employees WHERE employee_email = ? OR employee_name = ?",
      [employee_email, employee_name],
      async (err, results) => {
        if (err) {
          return res
            .status(500)
            .json({ status: "Failure", message: "Database ", error: err });
        }

        if (results.length > 0) {
          return res.status(409).json({
            status: "Failure",
            message: "DOAGuru User already registered.",
          });
        }

        const hashedPassword = await bcrypt.hash(employee_password, 10);

        db.query(
          "INSERT INTO re_revenue_engine_employees (employee_name, employee_role, employee_email, employee_password, created_at) VALUES (?, ?, ?, ?, ?)",
          [
            employee_name,
            employee_role,
            employee_email,
            hashedPassword,
            createdAt,
          ],
          (err, result) => {
            if (err) {
              return res
                .status(500)
                .json({ status: "Failure", message: "DB error", error: err });
            }

            res.status(201).json({
              status: "Success",
              message: "DOAGuru User registered Successfully",
            });
          },
        );
      },
    );
  } catch (error) {
    res.status(500).json({ status: "Failure", message: "Server error", error });
  }
};

exports.registerBD = async (req, res) => {
  const { employee_name, employee_phone, employee_email, employee_password } =
    req.body;

  const employee_role = "BD";
  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  if (
    !employee_name ||
    !employee_phone ||
    !employee_email ||
    !employee_password
  ) {
    return res.status(400).json({
      status: "Failure",
      message: "All fields are required.",
    });
  }

  try {
    db.query(
      "SELECT * FROM re_revenue_engine_employees WHERE employee_email = ? OR employee_name = ?",
      [employee_email, employee_name, employee_phone],
      async (err, results) => {
        if (err) {
          return res
            .status(500)
            .json({ status: "Failure", message: "Database error", error: err });
        }

        if (results.length > 0) {
          return res.status(409).json({
            status: "Failure",
            message: "DOAGuru User already registered.",
          });
        }

        const hashedPassword = await bcrypt.hash(employee_password, 10);

        db.query(
          "INSERT INTO re_revenue_engine_employees (employee_name, employee_phone, employee_role, employee_email, employee_password, created_at) VALUES (?, ?, ?, ?, ?, ?)",
          [
            employee_name,
            employee_phone,
            employee_role,
            employee_email,
            hashedPassword,
            createdAt,
          ],
          (err, result) => {
            if (err) {
              return res.status(500).json({
                status: "Failure",
                message: "DB error",
                error: err,
              });
            }

            res.status(201).json({
              status: "Success",
              message: "DOAGuru User registered Successfully",
            });
          },
        );
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

exports.login = async (req, res) => {
  const { employee_email, employee_password } = req.body;
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!employee_email || !employee_password) {
    return res.status(400).json({
      status: "Failure",
      message: "Email and Password are required",
    });
  }

  try {
    const getUserQuery = `SELECT * FROM re_revenue_engine_employees WHERE employee_email = ?`;

    db.query(getUserQuery, [employee_email], async (err, results) => {
      if (err) {
        console.error("Error fetching user:", err);
        return res
          .status(500)
          .json({ status: "Failure", message: err.message });
      }

      if (results.length === 0) {
        return res
          .status(404)
          .json({ status: "Failure", message: "Invalid user ID or password" });
      }

      const user = results[0];

      const isPasswordMatch = await bcrypt.compare(
        employee_password,
        user.employee_password,
      );

      if (!isPasswordMatch) {
        return res
          .status(401)
          .json({ status: "Failure", message: "Invalid user ID or password" });
      }

      const payload = {
        id: user.id,
        name: user.employee_name,
        role: user.employee_role,
        email: user.employee_email,
      };

      // const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });

      const token = jwt.sign(
        {
          id: user.id,
          name: user.employee_name,
          role: user.employee_role,
        },
        JWT_SECRET,
        { expiresIn: "24h" },
      );

      return res.json({
        status: "Success",
        message: "Login successful",
        token,
        user: {
          name: user.employee_name,
          role: user.employee_role,
          email: user.employee_email,
        },
      });
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return res
      .status(500)
      .json({ status: "Failure", message: "Internal server error" });
  }
};

const forgototpStore = new Map();

exports.forgotPassword = async (req, res) => {
  const { User } = req.body;

  if (!User) {
    return res
      .status(400)
      .json({ status: "Failure", message: "UserId is required" });
  }

  try {
    const getUserQuery = `SELECT * FROM re_revenue_engine_employees WHERE employee_email = ?`;

    db.query(getUserQuery, [User], async (err, result) => {
      if (err || result.length === 0) {
        return res
          .status(400)
          .json({ status: "Failure", message: "User not found" });
      }

      const user = result[0];
      const otp = crypto.randomInt(100000, 999999).toString();
      const otpHash = await bcrypt.hash(otp, 10);

      forgototpStore.set(user.id, {
        otpHash,
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      try {
        await sendPasswordResetOtpEmail(user.employee_email, otp);
      } catch (mailErr) {
        console.error("[forgotPassword] email send failed:", mailErr);
        return res.status(500).json({
          status: "Failure",
          message: "Could not send OTP email. Please try again later.",
        });
      }

      return res.status(200).json({
        status: "Success",
        message: `OTP sent to ${user.employee_email}`,
      });
    });
  } catch (error) {
    console.error("Error processing forgot password request:", error);
    return res
      .status(500)
      .json({ status: "Failure", message: "Internal server error" });
  }
};

// exports.verifyOtpAndResetPassword = async (req, res) => {
//   const { User, otp, newPassword } = req.body;

//   if (!User || !otp || !newPassword) {
//     return res.status(400).json({
//       status: "Failure",
//       message: "UserId, OTP, and new password are required",
//     });
//   }

//   try {
//     const getUserQuery = `SELECT * FROM re_revenue_engine_employees WHERE employee_email = ?`;
//     db.query(getUserQuery, [User], async (err, results) => {
//       if (err || results.length === 0) {
//         return res
//           .status(404)
//           .json({ status: "Failure", message: "User not found" });
//       }

//       const user = results[0];
//       const otpData = forgototpStore.get(user.User);

//       if (!otpData || Date.now() > otpData.expiresAt) {
//         return res
//           .status(400)
//           .json({ status: "Failure", message: "OTP expired or invalid" });
//       }

//       console.log("OTP Provided:", otp);
//       console.log("Stored OTP Hash:", otpData.otpHash);

//       const isOtpValid = await bcrypt.compare(otp.toString(), otpData.otpHash);
//       console.log("OTP Valid:", isOtpValid);
//       if (!isOtpValid) {
//         return res
//           .status(400)
//           .json({ status: "Failure", message: "Invalid OTP" });
//       }

//       const hashedPassword = await bcrypt.hash(newPassword, 10);

//       const updatePasswordQuery = `UPDATE re_revenue_engine_employees SET employee_password = ? WHERE employee_email = ?`;
//       db.query(updatePasswordQuery, [hashedPassword, UserId], (updateErr) => {
//         if (updateErr) {
//           console.error("Error updating password:", updateErr);
//           return res
//             .status(500)
//             .json({ status: "Failure", message: "Failed to reset password" });
//         }

//         forgototpStore.delete(user.UserId);

//         return res
//           .status(200)
//           .json({ status: "Success", message: "Password reset successful" });
//       });
//     });
//   } catch (error) {
//     console.error("Error processing password reset:", error);
//     return res
//       .status(500)
//       .json({ status: "Failure", message: "Internal server error" });
//   }
// };

exports.verifyOtpAndResetPassword = async (req, res) => {
  const { User, otp, newPassword } = req.body;

  if (!User || !otp || !newPassword) {
    return res.status(400).json({
      status: "Failure",
      message: "UserId, OTP, and new password are required",
    });
  }

  try {
    const getUserQuery = `SELECT * FROM re_revenue_engine_employees WHERE employee_email = ?`;
    db.query(getUserQuery, [User], async (err, results) => {
      if (err || results.length === 0) {
        return res
          .status(404)
          .json({ status: "Failure", message: "User not found" });
      }

      const user = results[0];
      const otpData = forgototpStore.get(user.id); // FIXED

      if (!otpData || Date.now() > otpData.expiresAt) {
        return res
          .status(400)
          .json({ status: "Failure", message: "OTP expired or invalid" });
      }

      const isOtpValid = await bcrypt.compare(otp.toString(), otpData.otpHash);
      if (!isOtpValid) {
        return res
          .status(400)
          .json({ status: "Failure", message: "Invalid OTP" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const updatePasswordQuery = `UPDATE re_revenue_engine_employees SET employee_password = ? WHERE employee_email = ?`;
      db.query(updatePasswordQuery, [hashedPassword, User], (updateErr) => {
        if (updateErr) {
          console.error("Error updating password:", updateErr);
          return res
            .status(500)
            .json({ status: "Failure", message: "Failed to reset password" });
        }

        forgototpStore.delete(user.id); // FIXED

        return res
          .status(200)
          .json({ status: "Success", message: "Password reset successful" });
      });
    });
  } catch (error) {
    console.error("Error processing password reset:", error);
    return res
      .status(500)
      .json({ status: "Failure", message: "Internal server error" });
  }
};

// exports.insertServices = async (req, res) => {
//   const { re_services, category, editing_type, amount, selected } = req.body;

//   const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

//   if (!re_services || !category || !editing_type || !amount) {
//     // selected is optional, so we don't check it
//     return res
//       .status(400)
//       .json({ status: "Failure", message: "All fields are required." });
//   }

//   if (isNaN(amount)) {
//     return res.status(400).json({
//       status: "Failure",
//       message: "Amount must be numbers.",
//     });
//   }

//   try {
//     db.query(
//       "INSERT INTO revenue_engine_services (re_services, category, editing_type, amount, selected, created_at) VALUES (?, ?, ?, ?, ?, ?)",
//       [re_services, category, editing_type, amount, selected || "N/A", createdAt],
//       (err, result) => {
//         if (err) {
//           return res
//             .status(500)
//             .json({ status: "Failure", message: "Database error" });
//         }

//         res.status(201).json({
//           status: "Success",
//           message: "Service added successfully",
//         });
//       }
//     );
//   } catch (error) {
//     res.status(500).json({ status: "Failure", message: "Server error", error });
//   }
// };

// exports.getServices = async (req, res) => {
//   try {
//     db.query(
//       "SELECT * FROM revenue_engine_services ORDER BY id DESC",
//       (err, results) => {
//         if (err) {
//           return res
//             .status(500)
//             .json({ status: "Failure", message: "DB error", error: err });
//         }

//         if (results.length === 0) {
//           return res.status(404).json({
//             status: "Failure",
//             message: "Invalid user ID or password",
//           });
//         }

//         res.status(200).json({
//           status: "Success",
//           data: results,
//         });
//       }
//     );
//   } catch (error) {
//     res.status(500).json({ status: "Failure", message: "Server error", error });
//   }
// };

// exports.updateServices = async (req, res) => {
//   const { id } = req.params;
//   const { re_services, category, editing_type, amount, selected } = req.body;

//   if (!re_services || !category || !editing_type || !amount) {
//     return res.status(400).json({
//       status: "Failure",
//       message: "All fields except 'selected' are required.",
//     });
//   }

//   try {
//     db.query(
//       "UPDATE revenue_engine_services SET re_services = ?, category = ?, editing_type = ?, amount = ?, selected = ? WHERE id = ?",
//       [re_services, category, editing_type, amount, selected || "N/A", id],
//       (err, result) => {
//         if (err) {
//           return res
//             .status(500)
//             .json({ status: "Failure", message: "DB error", error: err });
//         }

//         if (result.affectedRows === 0) {
//           return res.status(404).json({
//             status: "Failure",
//             message: "No service found with the given ID",
//           });
//         }

//         res.status(200).json({
//           status: "Success",
//           message: "Service updated successfully",
//         });
//       }
//     );
//   } catch (error) {
//     res.status(500).json({ status: "Failure", message: "Server error", error });
//   }
// };

exports.insertAdsServices = async (req, res) => {
  const { ads_category, amt_range_start, amt_range_end, percentage } = req.body;

  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  if (!ads_category || !amt_range_start || !amt_range_end || !percentage) {
    return res
      .status(400)
      .json({ status: "Failure", message: "All fields are required." });
  }

  if (
    isNaN(amt_range_start) ||
    (amt_range_end !== "Above" && isNaN(amt_range_end)) ||
    isNaN(percentage)
  ) {
    return res.status(400).json({
      status: "Failure",
      message:
        "Amount ranges must be numbers or 'Above', and percentage must be a number.",
    });
  }

  try {
    db.query(
      "INSERT INTO re_revenue_engine_ads (ads_category, amt_range_start, amt_range_end, percentage, created_at) VALUES (?, ?, ?, ?, ?)",
      [ads_category, amt_range_start, amt_range_end, percentage, createdAt],
      (err, result) => {
        if (err) {
          return res
            .status(500)
            .json({ status: "Failure", message: "Database error" });
        }

        res.status(201).json({
          status: "Success",
          message: "Ads Service added successfully",
        });
      },
    );
  } catch (error) {
    res.status(500).json({ status: "Failure", message: "Server error", error });
  }
};

exports.updateAdsServices = async (req, res) => {
  const { id } = req.params;
  const { ads_category, amt_range_start, amt_range_end, percentage } = req.body;

  if (!ads_category || !amt_range_start || !amt_range_end || !percentage) {
    return res
      .status(400)
      .json({ status: "Failure", message: "All fields are required." });
  }

  // if (isNaN(amt_range_start) || isNaN(amt_range_end) || isNaN(percentage)) {
  if (
    isNaN(amt_range_start) ||
    (amt_range_end !== "Above" && isNaN(amt_range_end)) ||
    isNaN(percentage)
  ) {
    return res.status(400).json({
      status: "Failure",
      message: "Amount ranges and percentage must be numbers.",
    });
  }

  try {
    db.query(
      "UPDATE re_revenue_engine_ads SET ads_category = ?, amt_range_start = ?, amt_range_end = ?, percentage = ? WHERE id = ?",
      [ads_category, amt_range_start, amt_range_end, percentage, id],
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
          message: "Ads Service updated successfully",
        });
      },
    );
  } catch (error) {
    res.status(500).json({ status: "Failure", message: "Server error", error });
  }
};

exports.insertClientDetails = async (req, res) => {
  const {
    client_name,
    client_organization,
    email,
    phone,
    address,
    dg_employee,
  } = req.body;

  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  if (!client_name || !phone || !dg_employee) {
    return res.status(400).json({
      status: "Failure",
      message: "All fields are required Client Name , Phone Number.",
    });
  }

  try {
    db.query(
      "INSERT INTO re_revenue_engine_client_details (client_name, client_organization, email, phone, address, dg_employee, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        client_name,
        client_organization,
        email,
        phone,
        address,
        dg_employee,
        createdAt,
      ],
      (err, result) => {
        if (err) {
          return res
            .status(500)
            .json({ status: "Failure", message: "Database error", error: err });
        }

        res.status(201).json({
          status: "Success",
          message: "Client added successfully",
        });
      },
    );
  } catch (error) {
    res.status(500).json({ status: "Failure", message: "Server error", error });
  }
};

exports.getClientDetails = async (req, res) => {
  try {
    db.query(
      "SELECT * FROM re_revenue_engine_client_details ORDER BY id DESC",
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
            message: "No client details found",
          });
        }

        res.status(200).json({
          status: "Success",
          data: results,
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

exports.getClientsByEmployee = async (req, res) => {
  const { employee } = req.params;

  try {
    db.query(
      "SELECT * FROM re_revenue_engine_client_details WHERE dg_employee = ? ORDER BY id DESC",
      [employee],
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
            message: "No clients found for this employee",
          });
        }

        res.status(200).json({
          status: "Success",
          data: results,
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

exports.addServices = async (req, res) => {
  const { service_name } = req.body;

  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  if (!service_name) {
    return res
      .status(400)
      .json({ status: "Failure", message: "All fields are required." });
  }

  try {
    db.query(
      "INSERT INTO re_services (service_name, created_at) VALUES (?, ?)",
      [service_name, createdAt],
      (err, result) => {
        if (err) {
          return res
            .status(500)
            .json({ status: "Failure", message: "Database error" });
        }

        res.status(201).json({
          status: "Success",
          message: "Service added successfully",
        });
      },
    );
  } catch (error) {
    res.status(500).json({ status: "Failure", message: "Server error", error });
  }
};

exports.addCategories = async (req, res) => {
  const { service_id, category_name } = req.body;

  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  if (!service_id || !category_name) {
    return res.status(400).json({
      status: "Failure",
      message: "Service ID and Category name required",
    });
  }

  try {
    // Check for duplicate category name under the same service
    db.query(
      "SELECT category_id FROM re_categories WHERE service_id = ? AND category_name = ?",
      [service_id, category_name],
      (checkErr, checkResult) => {
        if (checkErr) {
          return res.status(500).json({
            status: "Failure",
            message: "Database error during check",
          });
        }

        if (checkResult.length > 0) {
          return res.status(400).json({
            status: "Failure",
            message:
              "Category with this name already exists for the selected service",
          });
        }

        db.query(
          "INSERT INTO re_categories (service_id, category_name, created_at) VALUES (?, ?, ?)",
          [service_id, category_name, createdAt],
          (err, result) => {
            if (err) {
              console.error("Database INSERT error in addCategories:", err);
              return res.status(500).json({
                status: "Failure",
                message: "Database error",
                error: err.message,
              });
            }

            res.status(201).json({
              status: "Success",
              message: "Category added successfully",
              data: { category_id: result.insertId },
            });
          },
        );
      },
    );
  } catch (error) {
    res.status(500).json({ status: "Failure", message: "Server error", error });
  }
};

exports.addEditingTypes = async (req, res) => {
  const { service_id, category_id, editing_type_name, amount } = req.body;

  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  if (
    !service_id ||
    !category_id ||
    amount === undefined ||
    amount === null ||
    amount === ""
  ) {
    return res.status(400).json({
      status: "Failure",
      message: "All fields are required",
    });
  }

  try {
    db.query(
      "INSERT INTO re_editing_types (service_id, category_id, editing_type_name, amount, created_at) VALUES (?, ?, ?, ?, ?)",
      [service_id, category_id, editing_type_name, amount, createdAt],
      (err, result) => {
        if (err) {
          return res
            .status(500)
            .json({ status: "Failure", message: "Database error" });
        }

        res.status(201).json({
          status: "Success",
          message: "Editing type added successfully",
        });
      },
    );
  } catch (error) {
    res.status(500).json({ status: "Failure", message: "Server error", error });
  }
};

exports.saveCalculatorData = (req, res) => {
  const {
    txn_id,
    client_id,
    service_name,
    category_name,
    editing_type_id,
    editing_type_name,
    editing_type_amount,
    quantity,
    include_content_posting,
    include_thumbnail_creation,
    include_youtube_video_posting,
    total_amount,
    employee,
    plan_name,
  } = req.body;

  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  // ?? Step 0: Check if the same service already exists for this txn_id
  const checkDuplicate = `
    SELECT id FROM re_calculator_transactions 
    WHERE txn_id = ? AND service_name = ? AND category_name = ? AND editing_type_id = ?
  `;

  db.query(
    checkDuplicate,
    [txn_id, service_name, category_name, editing_type_id],
    (dupErr, dupResult) => {
      if (dupErr) {
        console.error("Duplicate Check Error:", dupErr);
        return res.status(500).json({ status: "Failure", message: "DB error" });
      }

      if (dupResult.length > 0) {
        // ?? Service already exists, stop insert
        return res.status(200).json({
          status: "Alert",
          message: "This service already exists for the selected quotation",
        });
      }

      // Step 1: Insert into re_calculator_transactions (Quotation)
      const query = `
        INSERT INTO re_calculator_transactions (
          txn_id,
          client_id,
          service_name,
          category_name,
          editing_type_id,
          editing_type_name,
          editing_type_amount,
          quantity,
          include_content_posting,
          include_thumbnail_creation,
          include_youtube_video_posting,
          total_amount,
          employee,
          plan_name,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
      `;

      const values = [
        txn_id,
        client_id,
        service_name,
        category_name,
        editing_type_id,
        editing_type_name,
        editing_type_amount,
        quantity,
        include_content_posting,
        include_thumbnail_creation,
        include_youtube_video_posting || 0,
        total_amount,
        employee,
        plan_name || "Customise",
        createdAt,
      ];

      db.query(query, values, (err, result) => {
        if (err) {
          console.error("Insert Error (Quotation):", err);
          return res
            .status(500)
            .json({ status: "Failure", message: "DB error" });
        }

        // Step 2: Check if re_invoice already exists
        const checkInvoice = "SELECT id FROM re_invoice WHERE txn_id = ?";
        db.query(checkInvoice, [txn_id], (err2, invoiceResult) => {
          if (err2) {
            console.error("Invoice Check Error:", err2);
            return res
              .status(500)
              .json({ status: "Failure", message: "DB error" });
          }

          if (invoiceResult.length > 0) {
            // Step 3: Insert into re_invoice_graphic table
            const invoiceQuery = `
              INSERT INTO re_invoice_graphic (
                txn_id,
                client_id,
                service_name,
                category_name,
                editing_type_id,
                editing_type_name,
                editing_type_amount,
                quantity,
                include_content_posting,
                include_thumbnail_creation,
                total_amount,
                employee,
                plan_name,
                created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
            `;

            db.query(invoiceQuery, values, (err3) => {
              if (err3) {
                console.error("Insert Error (re_invoice):", err3);
                return res.status(500).json({
                  status: "Failure",
                  message: "Quotation saved but re_invoice insert failed",
                });
              }

              return res.status(200).json({
                status: "Success",
                message: "Quotation & re_invoice saved successfully",
              });
            });
          } else {
            // Only Quotation saved
            return res.status(200).json({
              status: "Success",
              message:
                "Quotation saved successfully (re_invoice not created yet)",
            });
          }
        });
      });
    },
  );
};

exports.saveAdsCampaign = async (req, res) => {
  const adsItems = req.body.adsItems;

  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  if (!Array.isArray(adsItems) || adsItems.length === 0) {
    return res
      .status(400)
      .json({ status: "Failure", message: "No data provided." });
  }

  const insertValues = adsItems.map((item) => [
    item.txn_id,
    item.client_id,
    item.id,
    item.category,
    item.amount,
    item.percent,
    item.charge,
    item.total,
    item.employee,
    createdAt,
  ]);

  // Step 1: Insert into re_ads_campaign_details
  const sql = `
    INSERT INTO re_ads_campaign_details 
    (txn_id, client_id, unique_id, category, amount, percent, charge, total, employee, created_at) 
    VALUES ?
  `;

  db.query(sql, [insertValues], (err) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({
        status: "Failure",
        message: "Database error while saving ads campaign.",
      });
    }

    // Step 2: Check if invoice exists
    const checkInvoice = "SELECT id FROM re_invoice WHERE txn_id = ?";
    db.query(checkInvoice, [adsItems[0].txn_id], (err2, invoiceResult) => {
      if (err2) {
        console.error("Invoice Check Error:", err2);
        return res.status(500).json({
          status: "Failure",
          message: "DB error while checking re_invoice.",
        });
      }

      if (invoiceResult.length > 0) {
        // Step 3: Insert into re_ads_campaign_details_invoice if re_invoice exists
        const invoiceSql = `
          INSERT INTO re_ads_campaign_details_invoice 
          (txn_id, client_id, unique_id, category, amount, percent, charge, total, employee, created_at) 
          VALUES ?
        `;

        db.query(invoiceSql, [insertValues], (err3) => {
          if (err3) {
            console.error("Error saving re_invoice ads campaign:", err3);
            return res.status(500).json({
              status: "Failure",
              message: "Ads campaign saved, but re_invoice insert failed.",
              error: err3,
            });
          }

          return res.status(200).json({
            status: "Success",
            message: "Ads campaign saved successfully with re_invoice.",
          });
        });
      } else {
        // Only ads campaign saved
        return res.status(200).json({
          status: "Success",
          message:
            "Ads campaign saved successfully (re_invoice not created yet).",
        });
      }
    });
  });
};

exports.saveCalculatorDataOfPlan = (req, res) => {
  const data = req.body; // expect array of objects

  if (!Array.isArray(data) || data.length === 0) {
    return res
      .status(400)
      .json({ status: "Failure", message: "No data received" });
  }

  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  const query = `
    INSERT INTO re_plan_data (
      plan_id, plan_name, service_name, category_name,editing_type_id,
      editing_type_name, editing_type_amount, quantity,
      include_content_posting, include_thumbnail_creation,
      total_amount, amount_ads, percent_ads,
      charge_ads, total_ads, employee, created_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `;

  const tasks = data.map((item) => {
    const values = [
      item.plan_id || null,
      item.plan_name || null,
      item.service_name || null,
      item.category_name || null,
      item.editing_type_id || null,
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
      createdAt,
    ];

    return new Promise((resolve, reject) => {
      db.query(query, values, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  });

  Promise.all(tasks)
    .then(() => {
      res
        .status(200)
        .json({ status: "Success", message: "Plan data saved successfully" });
    })
    .catch((err) => {
      console.error("Insert Error:", err);
      res
        .status(500)
        .json({ status: "Failure", message: "Error saving plan data" });
    });
};

exports.saveCalculatorDataOfPlanDetail = (req, res) => {
  const { plan_name } = req.body;

  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  const query = `
    INSERT INTO re_plan_details (
      plan_name,
      created_at
    ) VALUES (?, ?)
  `;

  const values = [plan_name, createdAt];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Insert Error:", err);
      return res.status(500).json({ status: "Failure", message: "Plan error" });
    }

    // ? return insertId for navigation
    res.status(200).json({
      status: "Success",
      message: "Saved successfully of Plan Detail",
      insertId: result.insertId, // <-- return this
    });
  });
};

exports.saveClientWithPlan = async (req, res) => {
  const {
    client_name,
    client_organization,
    email,
    phone,
    address,
    dg_employee,
    txn_id,
    plans, // array of plans
    planNotes, // array of notes
  } = req.body;

  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  try {
    // Step 1: Insert client details
    const clientQuery = `
      INSERT INTO re_revenue_engine_client_details 
      (client_name, client_organization, email, phone, address, dg_employee, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const clientValues = [
      client_name,
      client_organization || null,
      email || null,
      phone,
      address || null,
      dg_employee,
      createdAt,
    ];

    db.query(clientQuery, clientValues, (err, clientResult) => {
      if (err) {
        return res.status(500).json({
          status: "Failure",
          message: "Error saving client",
          error: err,
        });
      }

      const client_id = clientResult.insertId;

      // Step 2: Insert plans
      const planQuery = `
        INSERT INTO re_calculator_transactions 
        (txn_id, client_id, service_name, category_name, editing_type_name, editing_type_amount, quantity, include_content_posting, include_thumbnail_creation, total_amount, employee, plan_name, created_at) 
        VALUES ?`;

      const planValues = plans.map((p) => [
        txn_id,
        client_id,
        p.service_name,
        p.category_name,
        p.editing_type_name,
        p.editing_type_amount,
        p.quantity,
        p.include_content_posting,
        p.include_thumbnail_creation,
        p.total_amount,
        p.employee,
        p.plan_name,
        createdAt,
      ]);

      db.query(planQuery, [planValues], (err) => {
        if (err) {
          return res.status(500).json({
            status: "Failure",
            message: "Error saving plans",
            error: err,
          });
        }

        // Step 3: Insert notes
        const noteClientQuery = `
          INSERT INTO re_plan_client_notes 
          (txn_id, client_id, note_name, created_at) 
          VALUES ?`;

        const noteClientValues = planNotes.map((p) => [
          txn_id,
          client_id,
          p.note_name,
          createdAt,
        ]);

        db.query(noteClientQuery, [noteClientValues], (err) => {
          if (err) {
            return res.status(500).json({
              status: "Failure",
              message:
                "Error saving notes and if notes are not exist please create",
              error: err,
            });
          }

          // ? Final response (only once)
          res.status(201).json({
            status: "Success",
            message: "Client, Plans, and Notes saved successfully",
            client_id,
            txn_id,
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

exports.addNotebyplan = async (req, res) => {
  const { note_name, plan, plan_id } = req.body;

  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  if (!note_name || !plan) {
    return res.status(400).json({
      status: "Failure",
      message: "Notes name and plan are required",
    });
  }

  try {
    // Step 1: Check if the note already exists for this plan_id
    const checkQuery = `
      SELECT note_name 
      FROM re_plans_notes 
      WHERE plan_id = ? AND LOWER(note_name) = LOWER(?)
    `;

    db.query(checkQuery, [plan_id, note_name], (checkErr, existingRows) => {
      if (checkErr) {
        return res.status(500).json({
          status: "Failure",
          message: "Error checking existing notes",
          error: checkErr,
        });
      }

      if (existingRows.length > 0) {
        // Duplicate found
        return res.status(200).json({
          status: "Alert",
          message: "Duplicate Note, please use a unique note",
        });
      }

      // Step 2: Insert new note
      const insertQuery = `
        INSERT INTO re_plans_notes (note_name, plan, plan_id, created_at) 
        VALUES (?, ?, ?, ?)
      `;

      db.query(
        insertQuery,
        [note_name, plan, plan_id, createdAt],
        (err, result) => {
          if (err) {
            return res
              .status(500)
              .json({ status: "Failure", message: "Database error" });
          }

          res.status(201).json({
            status: "Success",
            message: "Note added successfully",
          });
        },
      );
    });
  } catch (error) {
    res.status(500).json({ status: "Failure", message: "Server error", error });
  }
};

exports.savePlanClientNotes = (req, res) => {
  const { txn_id, client_id, plans, planNotes } = req.body;

  if (!txn_id || !client_id || !plans || plans.length === 0) {
    return res
      .status(400)
      .json({ status: "Failure", message: "Missing required data" });
  }

  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  // Step 1: Insert Plans (re_calculator_transactions)
  const planQuery = `
    INSERT INTO re_calculator_transactions 
    (txn_id, client_id, service_name, category_name, editing_type_name, editing_type_amount, quantity, include_content_posting, include_thumbnail_creation, total_amount, employee, plan_name, created_at) 
    VALUES ?
  `;

  const planValues = plans.map((p) => [
    txn_id,
    client_id,
    p.service_name,
    p.category_name,
    p.editing_type_name,
    p.editing_type_amount,
    p.quantity,
    p.include_content_posting,
    p.include_thumbnail_creation,
    p.total_amount,
    p.employee,
    p.plan_name && p.plan_name.trim() !== "" ? p.plan_name : "Customise",
    createdAt,
  ]);

  db.query(planQuery, [planValues], (err) => {
    if (err) {
      console.error("Error saving plans:", err);
      return res.status(500).json({
        status: "Failure",
        message: "Error saving plans",
        error: err,
      });
    }

    // Step 2: Insert Notes (re_plan_client_notes)
    const insertNotes = (callback) => {
      if (planNotes && planNotes.length > 0) {
        const noteClientQuery = `
          INSERT INTO re_plan_client_notes 
          (txn_id, client_id, note_name, created_at) 
          VALUES ?
        `;

        const noteClientValues = planNotes.map((n) => [
          txn_id,
          client_id,
          n.note_name,
          createdAt,
        ]);

        db.query(noteClientQuery, [noteClientValues], (err) => {
          if (err) {
            console.error("Error saving notes:", err);
            return res.status(500).json({
              status: "Failure",
              message: "Error saving notes",
              error: err,
            });
          }
          callback();
        });
      } else {
        callback();
      }
    };

    // Step 3: Check if re_invoice exists
    const checkInvoice = "SELECT id FROM re_invoice WHERE txn_id = ?";
    db.query(checkInvoice, [txn_id], (err2, invoiceResult) => {
      if (err2) {
        console.error("Invoice Check Error:", err2);
        return res.status(500).json({ status: "Failure", message: "DB error" });
      }

      insertNotes(() => {
        if (invoiceResult.length > 0) {
          // Step 4: Save re_invoice plans if re_invoice exists
          const planInvoiceQuery = `
            INSERT INTO re_invoice_graphic 
            (txn_id, client_id, service_name, category_name, editing_type_name, editing_type_amount, quantity, include_content_posting, include_thumbnail_creation, total_amount, employee, plan_name, created_at) 
            VALUES ?
          `;

          db.query(planInvoiceQuery, [planValues], (err3) => {
            if (err3) {
              console.error("Error saving plan invoice:", err3);
              return res.status(500).json({
                status: "Failure",
                message: "Plans saved but invoice insert failed",
                error: err3,
              });
            }

            return res.status(200).json({
              status: "Success",
              message: "Plans & Notes saved successfully with re_invoice",
            });
          });
        } else {
          // Only quotation saved
          return res.status(200).json({
            status: "Success",
            message:
              "Plans & Notes saved successfully (re_invoice not created yet)",
          });
        }
      });
    });
  });
};

exports.saveClientIdwiseNotes = (req, res) => {
  const { txn_id, client_id, planNotes } = req.body;

  if (!txn_id || !client_id) {
    return res
      .status(400)
      .json({ status: "Failure", message: "Missing required data" });
  }

  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  // Step 1: Check duplicates before inserting
  const checkQuery = `
    SELECT note_name 
    FROM re_plan_client_notes 
    WHERE txn_id = ? AND client_id = ?
  `;

  db.query(checkQuery, [txn_id, client_id], (checkErr, existingRows) => {
    if (checkErr) {
      return res.status(500).json({
        status: "Failure",
        message: "Error checking existing notes",
        error: checkErr,
      });
    }

    // Extract existing note names
    const existingNotes = existingRows.map((row) =>
      row.note_name.toLowerCase(),
    );

    // Filter out duplicates
    const filteredNotes = planNotes.filter(
      (n) => !existingNotes.includes(n.note_name.toLowerCase()),
    );

    if (filteredNotes.length === 0) {
      return res.status(200).json({
        status: "Alert",
        message: "Duplicate Note Please Unique Note",
      });
    }

    // Step 2: Insert only new notes
    const NotesQuery = `
      INSERT INTO re_plan_client_notes 
          (txn_id, client_id, note_name, created_at) 
          VALUES ?
    `;

    const NotesValues = filteredNotes.map((n) => [
      txn_id,
      client_id,
      n.note_name,
      createdAt,
    ]);

    db.query(NotesQuery, [NotesValues], (insertErr) => {
      if (insertErr) {
        console.error("Error saving Client Notes:", insertErr);
        return res.status(500).json({
          status: "Failure",
          message: "Error saving Client Notes",
          error: insertErr,
        });
      }

      return res.status(200).json({
        status: "Success",
        message: `${filteredNotes.length} Client Notes saved successfully (duplicates skipped)`,
      });
    });
  });
};

//NEW Work

// Helper: fetch all assignment rows for a txn
function getTxnRows(txn_id) {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT id, client_id, user_id, team_id, assignment_mode FROM re_assign_quotation WHERE txn_id = ?",
      [txn_id],
      (e, rows) => (e ? reject(e) : resolve(rows || [])),
    );
  });
}

// Helper: detect current 'mode' for this txn
function detectMode(rows) {
  if (!rows.length) return { mode: "none", teamId: null };
  const allTeam = rows.every((r) => r.assignment_mode === "team" && r.team_id);
  const teamIds = [...new Set(rows.map((r) => r.team_id).filter(Boolean))];
  const singleOnly =
    rows.length === 1 &&
    rows[0].assignment_mode === "single" &&
    !rows[0].team_id;
  if (singleOnly) return { mode: "single", teamId: null };
  if (allTeam && teamIds.length === 1)
    return { mode: "team", teamId: teamIds[0] };
  return { mode: "mixed", teamId: teamIds.length ? teamIds[0] : null };
}

exports.assignQuotation = (req, res) => {
  (async () => {
    try {
      const { client_id, txn_id, user_id, deadline } = req.body;
      if (!client_id || !txn_id || !user_id)
        return res
          .status(400)
          .json({ status: "Failure", message: "Missing ID(s)" });
      if (deadline && !/^\d{4}-\d{2}-\d{2}$/.test(deadline))
        return res.status(400).json({
          status: "Failure",
          message: "Invalid deadline (YYYY-MM-DD)",
        });

      const createdAt = moment().tz(TZ).format("YYYY-MM-DD HH:mm:ss");
      const existingRows = await getTxnRows(txn_id);
      const { mode } = detectMode(existingRows);
      const mustClear = mode === "team" || mode === "mixed"; // switching

      db.beginTransaction((tErr) => {
        if (tErr) {
          console.error("TX Err:", tErr);
          return res
            .status(500)
            .json({ status: "Failure", message: "Transaction error" });
        }

        const doInsert = () => {
          const insertQuery = `
            INSERT INTO re_assign_quotation
              (client_id, txn_id, user_id, deadline, created_at,
               reminder_start_sent, reminder_mid_sent, reminder_day_before_sent,
               assignment_mode, team_id, assign_group_id)
            VALUES (?, ?, ?, ?, ?, 0, 0, 0, 'single', NULL, NULL)
          `;
          db.query(
            insertQuery,
            [client_id, txn_id, user_id, deadline || null, createdAt],
            async (err, result) => {
              if (err) {
                if (err?.code === "ER_DUP_ENTRY") {
                  // same user already had this txn (shouldn't happen after clear)
                  return db.rollback(() =>
                    res.status(409).json({
                      status: "Failure",
                      message: "Already assigned to this user",
                    }),
                  );
                }
                console.error("DB Error:", err);
                return db.rollback(() =>
                  res
                    .status(500)
                    .json({ status: "Failure", message: "Database Error" }),
                );
              }

              db.commit(async (cErr) => {
                if (cErr) {
                  console.error("Commit Err:", cErr);
                  return db.rollback(() =>
                    res
                      .status(500)
                      .json({ status: "Failure", message: "Commit Error" }),
                  );
                }

                // send mail (post-commit)
                try {
                  const [assignee] = await new Promise((resolve, reject) => {
                    db.query(
                      "SELECT employee_name, employee_email, employee_phone FROM re_revenue_engine_employees WHERE id = ? LIMIT 1",
                      [user_id],
                      (e, rows) => (e ? reject(e) : resolve(rows || [])),
                    );
                  });
                  const [client] = await new Promise((resolve, reject) => {
                    db.query(
                      "SELECT client_name FROM re_revenue_engine_client_details WHERE id = ? LIMIT 1",
                      [client_id],
                      (e, rows) => (e ? reject(e) : resolve(rows || [])),
                    );
                  });

                  const link = process.env.PUBLIC_APP_URL
                    ? `${process.env.PUBLIC_APP_URL}/quotation/${client_id}/${txn_id}`
                    : null;
                } catch (mailErr) {
                  console.error("[MAIL] assign send error:", mailErr);
                }

                return res.status(201).json({
                  status: "Success",
                  message: mustClear
                    ? "Replaced previous team assignment with single user"
                    : "Quotation assigned",
                  data: {
                    id: result.insertId,
                    client_id,
                    txn_id,
                    user_id,
                    deadline: deadline || null,
                    created_at: createdAt,
                  },
                });
              });
            },
          );
        };

        if (!mustClear) return doInsert();

        db.query(
          "DELETE FROM re_assign_quotation WHERE txn_id = ?",
          [txn_id],
          (dErr) => {
            if (dErr) {
              console.error("Delete Err:", dErr);
              return db.rollback(() =>
                res.status(500).json({
                  status: "Failure",
                  message: "Failed to clear existing assignments",
                }),
              );
            }
            doInsert();
          },
        );
      });
    } catch (error) {
      console.error("Server Error:", error);
      res
        .status(500)
        .json({ status: "Failure", message: "Internal Server Error" });
    }
  })();
};

exports.reassignQuotation = (req, res) => {
  (async () => {
    try {
      const { txn_id, user_id, deadline, old_user_id } = req.body; // old_user_id optional now
      if (!txn_id || !user_id)
        return res
          .status(400)
          .json({ status: "Failure", message: "Missing ID(s)" });
      if (deadline && !/^\d{4}-\d{2}-\d{2}$/.test(deadline))
        return res.status(400).json({
          status: "Failure",
          message: "Invalid deadline (YYYY-MM-DD)",
        });

      const rows = await getTxnRows(txn_id);
      if (!rows.length)
        return res.status(404).json({
          status: "Failure",
          message: "No assignment found to update",
        });

      const { mode } = detectMode(rows);
      const now = moment().tz(TZ).format("YYYY-MM-DD HH:mm:ss");
      // client_id sab rows me same hona chahiye; first row se le lete hain
      const clientId = rows[0].client_id;

      // ---- CASE A: not a pure single row (team/mixed/multiple rows) => PURGE + INSERT SINGLE
      if (mode !== "single" || rows.length !== 1) {
        db.beginTransaction((tErr) => {
          if (tErr) {
            console.error("TX Err:", tErr);
            return res
              .status(500)
              .json({ status: "Failure", message: "Transaction error" });
          }
          db.query(
            "DELETE FROM re_assign_quotation WHERE txn_id = ?",
            [txn_id],
            (dErr) => {
              if (dErr) {
                console.error("Delete Err:", dErr);
                return db.rollback(() =>
                  res.status(500).json({
                    status: "Failure",
                    message: "Failed to clear existing assignments",
                  }),
                );
              }

              const insertSQL = `
              INSERT INTO re_assign_quotation
                (client_id, txn_id, user_id, deadline, created_at,
                 reminder_start_sent, reminder_mid_sent, reminder_day_before_sent,
                 assignment_mode, team_id, assign_group_id)
              VALUES (?, ?, ?, ?, ?, 0, 0, 0, 'single', NULL, NULL)
            `;
              db.query(
                insertSQL,
                [clientId, txn_id, user_id, deadline || null, now],
                (iErr, result) => {
                  if (iErr) {
                    if (iErr?.code === "ER_DUP_ENTRY") {
                      // after purge yeh unlikely hai, but race me ho sakta hai
                      return db.rollback(() =>
                        res.status(409).json({
                          status: "Failure",
                          message: "Already assigned to this user",
                        }),
                      );
                    }
                    console.error("Insert Err:", iErr);
                    return db.rollback(() =>
                      res
                        .status(500)
                        .json({ status: "Failure", message: "Database Error" }),
                    );
                  }

                  db.commit(async (cErr) => {
                    if (cErr) {
                      console.error("Commit Err:", cErr);
                      return db.rollback(() =>
                        res
                          .status(500)
                          .json({ status: "Failure", message: "Commit Error" }),
                      );
                    }

                    // Mail (best-effort)
                    try {
                      const [assignee] = await new Promise(
                        (resolve, reject) => {
                          db.query(
                            "SELECT employee_name, employee_email FROM re_revenue_engine_employees WHERE id = ? LIMIT 1",
                            [user_id],
                            (e, r) => (e ? reject(e) : resolve(r || [])),
                          );
                        },
                      );
                      const [client] = await new Promise((resolve, reject) => {
                        db.query(
                          "SELECT client_name FROM re_revenue_engine_client_details WHERE id = ? LIMIT 1",
                          [clientId],
                          (e, r) => (e ? reject(e) : resolve(r || [])),
                        );
                      });
                    } catch (mailErr) {
                      console.error("[MAIL] reassign(send) error:", mailErr);
                    }

                    return res.status(200).json({
                      status: "Success",
                      message:
                        "Replaced previous assignment(s) with single user",
                      data: { id: result.insertId },
                    });
                  });
                },
              );
            },
          );
        });
        return; // important
      }

      // ---- CASE B: exactly one single row => UPDATE IN PLACE
      const currentRow = rows[0];
      const updateSQL = `
        UPDATE re_assign_quotation
        SET user_id = ?, ${deadline ? "deadline = ?," : ""}
            assignment_mode = 'single', team_id = NULL, assign_group_id = NULL,
            updated_at = ?,
            -- reset reminders since we are re-assigning/updating
            reminder_start_sent = 0, reminder_mid_sent = 0, reminder_day_before_sent = 0,
            version = CAST(CAST(COALESCE(NULLIF(version,''),'1') AS UNSIGNED) + 1 AS CHAR)
        WHERE txn_id = ? AND user_id = ?
      `;
      const params = deadline
        ? [user_id, deadline, now, txn_id, currentRow.user_id]
        : [user_id, now, txn_id, currentRow.user_id];

      db.query(updateSQL, params, async (uErr, result) => {
        if (uErr) {
          if (uErr?.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
              status: "Failure",
              message: "Already assigned to this user for this txn",
            });
          }
          console.error("DB Error:", uErr);
          return res
            .status(500)
            .json({ status: "Failure", message: "Database Error" });
        }
        if (!result.affectedRows)
          return res.status(404).json({
            status: "Failure",
            message: "Target assignment row not found",
          });

        return res.status(200).json({
          status: "Success",
          message: "Quotation re-assigned & start reminder sent",
        });
      });
    } catch (e) {
      console.error("Server Error:", e);
      res
        .status(500)
        .json({ status: "Failure", message: "Internal Server Error" });
    }
  })();
};

// exports.assignQuotationToTeam = (req, res) => {
//   (async () => {
//     try {
//       const { client_id, txn_id, team_id, deadline } = req.body;
//       if (!client_id || !txn_id || !team_id)
//         return res.status(400).json({
//           status: "Failure",
//           message: "Missing client_id/txn_id/team_id",
//         });
//       if (deadline && !/^\d{4}-\d{2}-\d{2}$/.test(deadline))
//         return res.status(400).json({
//           status: "Failure",
//           message: "Invalid deadline (YYYY-MM-DD)",
//         });

//       // team members
//       const members = await new Promise((resolve, reject) => {
//         const sql = `
//           SELECT e.id, e.employee_name, e.employee_email, e.employee_phone
//           FROM re_team_members tm
//           JOIN re_revenue_engine_employees e ON e.id = tm.employee_id
//           WHERE tm.team_id = ?
//         `;
//         db.query(sql, [team_id], (e, rows) =>
//           e ? reject(e) : resolve(rows || [])
//         );
//       });
//       if (!members.length)
//         return res
//           .status(404)
//           .json({ status: "Failure", message: "No members in this team" });

//       const ids = Array.from(
//         new Set(members.map((m) => Number(m.id)).filter(Boolean))
//       );

//       const existingRows = await getTxnRows(txn_id);
//       const { mode, teamId: currentTeamId } = detectMode(existingRows);
//       const mustClear =
//         mode === "single" ||
//         mode === "mixed" ||
//         (mode === "team" && Number(currentTeamId) !== Number(team_id));

//       db.beginTransaction((tErr) => {
//         if (tErr) {
//           console.error("TX Err:", tErr);
//           return res
//             .status(500)
//             .json({ status: "Failure", message: "Transaction error" });
//         }

//         const proceed = () => {
//           // if not cleared (same team), still dedupe against existing users
//           const existingIds = new Set(
//             existingRows.map((r) => Number(r.user_id))
//           );
//           const targetIds = mustClear
//             ? ids
//             : ids.filter((id) => !existingIds.has(id));
//           if (!targetIds.length) {
//             db.commit(() =>
//               res.status(200).json({
//                 status: "Success",
//                 message:
//                   "Nothing new to assign (all team members already assigned)",
//                 data: {
//                   attempted: ids.length,
//                   inserted: 0,
//                   duplicates: Array.from(existingIds),
//                     mailed: 0,
//                   whatsapped: 0,
//                 },
//               })
//             );
//             return;
//           }

//           const now = moment().tz(TZ).format("YYYY-MM-DD HH:mm:ss");
//           const groupId = String(Date.now());
//           const values = targetIds.map((uid) => [
//             client_id,
//             txn_id,
//             uid,
//             deadline || null,
//             now,
//             0,
//             0,
//             0,
//             "team",
//             team_id,
//             groupId,
//           ]);

//           const insertSQL = `
//             INSERT INTO re_assign_quotation
//               (client_id, txn_id, user_id, deadline, created_at,
//                reminder_start_sent, reminder_mid_sent, reminder_day_before_sent,
//                assignment_mode, team_id, assign_group_id)
//             VALUES ?
//           `;
//           db.query(insertSQL, [values], (iErr) => {
//             if (iErr) {
//               if (iErr?.code === "ER_DUP_ENTRY") {
//                 // race-safe: ignore; continue
//               } else {
//                 console.error("Insert Err:", iErr);
//                 return db.rollback(() =>
//                   res
//                     .status(500)
//                     .json({ status: "Failure", message: "Database Error" })
//                 );
//               }
//             }

//             db.commit(async (cErr) => {
//               if (cErr) {
//                 console.error("Commit Err:", cErr);
//                 return db.rollback(() =>
//                   res
//                     .status(500)
//                     .json({ status: "Failure", message: "Commit Error" })
//                 );
//               }

//               // email after commit (best effort)
//               const idToMember = new Map(members.map((m) => [Number(m.id), m]));
//               let mailed = 0;
//               const link = process.env.PUBLIC_APP_URL
//                 ? `${process.env.PUBLIC_APP_URL}/quotation/${client_id}/${txn_id}`
//                 : null;
//               for (const uid of targetIds) {
//                 const m = idToMember.get(uid);
//                 if (!m?.employee_email) continue;
//                 try {
//                   await sendAssignmentEmail({
//                     to: m.employee_email,
//                     assigneeName: m.employee_name,
//                     clientName: undefined,
//                     clientId: client_id,
//                     txnId: txn_id,
//                     deadline: deadline || null,
//                     baseUrl: process.env.PUBLIC_APP_URL,
//                   });
//                   mailed++;
//                   db.query(
//                     "UPDATE re_assign_quotation SET reminder_start_sent = 1 WHERE txn_id = ? AND user_id = ?",
//                     [txn_id, uid]
//                   );
//                 } catch (mailErr) {
//                   console.error("[MAIL] team member send error:", mailErr);
//                 }
//               }

//               return res.status(201).json({
//                 status: "Success",
//                 message: mustClear
//                   ? "Replaced previous assignment(s) with team assignment"
//                   : "Quotation assigned to team members",
//                 data: {
//                   attempted: ids.length,
//                   inserted: targetIds.length,
//                   mailed,
//                 },
//               });
//             });
//           });
//         };

//         if (!mustClear) return proceed();

//         db.query(
//           "DELETE FROM re_assign_quotation WHERE txn_id = ?",
//           [txn_id],
//           (dErr) => {
//             if (dErr) {
//               console.error("Delete Err:", dErr);
//               return db.rollback(() =>
//                 res.status(500).json({
//                   status: "Failure",
//                   message: "Failed to clear existing assignments",
//                 })
//               );
//             }
//             proceed();
//           }
//         );
//       });
//     } catch (error) {
//       console.error("Server Error:", error);
//       res
//         .status(500)
//         .json({ status: "Failure", message: "Internal Server Error" });
//     }
//   })();
// };

exports.assignQuotationToTeam = (req, res) => {
  (async () => {
    try {
      const { client_id, txn_id, team_id, deadline } = req.body;
      if (!client_id || !txn_id || !team_id)
        return res.status(400).json({
          status: "Failure",
          message: "Missing client_id/txn_id/team_id",
        });
      if (deadline && !/^\d{4}-\d{2}-\d{2}$/.test(deadline))
        return res.status(400).json({
          status: "Failure",
          message: "Invalid deadline (YYYY-MM-DD)",
        });

      // team members
      const members = await new Promise((resolve, reject) => {
        const sql = `
          SELECT e.id, e.employee_name, e.employee_email, e.employee_phone
          FROM re_team_members tm
          JOIN re_revenue_engine_employees e ON e.id = tm.employee_id
          WHERE tm.team_id = ?
        `;
        db.query(sql, [team_id], (e, rows) =>
          e ? reject(e) : resolve(rows || []),
        );
      });
      if (!members.length)
        return res
          .status(404)
          .json({ status: "Failure", message: "No members in this team" });

      const ids = Array.from(
        new Set(members.map((m) => Number(m.id)).filter(Boolean)),
      );

      const existingRows = await getTxnRows(txn_id);
      const { mode, teamId: currentTeamId } = detectMode(existingRows);
      const mustClear =
        mode === "single" ||
        mode === "mixed" ||
        (mode === "team" && Number(currentTeamId) !== Number(team_id));

      db.beginTransaction((tErr) => {
        if (tErr) {
          console.error("TX Err:", tErr);
          return res
            .status(500)
            .json({ status: "Failure", message: "Transaction error" });
        }

        const proceed = () => {
          // if not cleared (same team), still dedupe against existing users
          const existingIds = new Set(
            existingRows.map((r) => Number(r.user_id)),
          );
          const targetIds = mustClear
            ? ids
            : ids.filter((id) => !existingIds.has(id));
          if (!targetIds.length) {
            db.commit(() =>
              res.status(200).json({
                status: "Success",
                message:
                  "Nothing new to assign (all team members already assigned)",
                data: {
                  attempted: ids.length,
                  inserted: 0,
                  duplicates: Array.from(existingIds),
                  mailed: 0,
                  whatsapped: 0,
                },
              }),
            );
            return;
          }

          const now = moment().tz(TZ).format("YYYY-MM-DD HH:mm:ss");
          const groupId = String(Date.now());
          const values = targetIds.map((uid) => [
            client_id,
            txn_id,
            uid,
            deadline || null,
            now,
            0,
            0,
            0,
            "team",
            team_id,
            groupId,
          ]);

          const insertSQL = `
            INSERT INTO re_assign_quotation
              (client_id, txn_id, user_id, deadline, created_at,
               reminder_start_sent, reminder_mid_sent, reminder_day_before_sent,
               assignment_mode, team_id, assign_group_id)
            VALUES ?
          `;
          db.query(insertSQL, [values], (iErr) => {
            if (iErr) {
              if (iErr?.code === "ER_DUP_ENTRY") {
                // race-safe: ignore; continue
              } else {
                console.error("Insert Err:", iErr);
                return db.rollback(() =>
                  res
                    .status(500)
                    .json({ status: "Failure", message: "Database Error" }),
                );
              }
            }

            db.commit(async (cErr) => {
              if (cErr) {
                console.error("Commit Err:", cErr);
                return db.rollback(() =>
                  res
                    .status(500)
                    .json({ status: "Failure", message: "Commit Error" }),
                );
              }

              // -------- Notify (post-commit, best-effort) ----------
              let clientName = null;
              try {
                const [clientRow] = await new Promise((resolve, reject) => {
                  db.query(
                    "SELECT client_name FROM re_revenue_engine_client_details WHERE id = ? LIMIT 1",
                    [client_id],
                    (e, r) => (e ? reject(e) : resolve(r || [])),
                  );
                });
                clientName = clientRow?.client_name || null;
              } catch (e) {
                console.error("Fetch client_name error:", e);
              }

              const idToMember = new Map(members.map((m) => [Number(m.id), m]));
              let mailed = 0;
              let whatsapped = 0;

              const link = process.env.PUBLIC_APP_URL
                ? `${process.env.PUBLIC_APP_URL}/quotation/${client_id}/${txn_id}`
                : null;

              for (const uid of targetIds) {
                const m = idToMember.get(uid);
                if (!m) continue;
              }

              return res.status(201).json({
                status: "Success",
                message: mustClear
                  ? "Replaced previous assignment(s) with team assignment"
                  : "Quotation assigned to team members",
                data: {
                  attempted: ids.length,
                  inserted: targetIds.length,
                  mailed,
                  whatsapped,
                },
              });
            });
          });
        };

        if (!mustClear) return proceed();

        db.query(
          "DELETE FROM re_assign_quotation WHERE txn_id = ?",
          [txn_id],
          (dErr) => {
            if (dErr) {
              console.error("Delete Err:", dErr);
              return db.rollback(() =>
                res.status(500).json({
                  status: "Failure",
                  message: "Failed to clear existing assignments",
                }),
              );
            }
            proceed();
          },
        );
      });
    } catch (error) {
      console.error("Server Error:", error);
      res
        .status(500)
        .json({ status: "Failure", message: "Internal Server Error" });
    }
  })();
};

// NEW WORK FOR Remainder work progress

exports.setDoneQty = (req, res) => {
  const {
    client_id,
    txn_id,
    service_name,
    category_name,
    editing_type_name = "",
    planned_qty,
    done_qty,
    user_id,
  } = req.body;

  if (
    !client_id ||
    !txn_id ||
    !service_name ||
    !category_name ||
    planned_qty == null ||
    done_qty == null ||
    !user_id
  ) {
    return res
      .status(400)
      .json({ status: "Failure", message: "Missing fields" });
  }

  // ? normalize
  const svc = (service_name || "").trim();
  const cat = (category_name || "").trim();
  const edit = (editing_type_name || "").trim(); // default '' OK

  const planned = Math.max(0, parseInt(planned_qty, 10) || 0);
  let done = Math.max(0, parseInt(done_qty, 10) || 0);
  if (done > planned) done = planned;

  const now = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  const upsert = `
    INSERT INTO re_service_progress
      (client_id, txn_id, service_name, category_name, editing_type_name,
       planned_qty, done_qty, last_updated_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      planned_qty = VALUES(planned_qty),
      done_qty = VALUES(done_qty),
      last_updated_by = VALUES(last_updated_by),
      updated_at = VALUES(updated_at)
  `;

  db.query(
    upsert,
    [
      client_id,
      txn_id,
      svc, // ?? normalized values
      cat,
      edit,
      planned,
      done,
      user_id,
      now,
      now,
    ],
    (err) => {
      if (err) {
        console.error("DB Error:", err);
        return res
          .status(500)
          .json({ status: "Failure", message: "Database Error" });
      }
      return res.status(200).json({
        status: "Success",
        message: "Progress saved",
        data: {
          client_id,
          txn_id,
          service_name: svc,
          category_name: cat,
          editing_type_name: edit,
          planned_qty: planned,
          done_qty: done,
        },
      });
    },
  );
};

// exports.setDoneQty = (req, res) => {
//   const {
//     client_id,
//     txn_id,
//     service_name,
//     category_name,
//     editing_type_name = "",
//     planned_qty, // send the latest planned (from history) to keep in sync
//     done_qty, // new absolute value
//     user_id, // employee who updates
//   } = req.body;

//   if (
//     !client_id ||
//     !txn_id ||
//     !service_name ||
//     !category_name ||
//     planned_qty == null ||
//     done_qty == null ||
//     !user_id
//   ) {
//     return res
//       .status(400)
//       .json({ status: "Failure", message: "Missing fields" });
//   }

//   const planned = Math.max(0, parseInt(planned_qty, 10) || 0);
//   let done = Math.max(0, parseInt(done_qty, 10) || 0);
//   if (done > planned) done = planned;

//   const now = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

//   const upsert = `
//     INSERT INTO re_service_progress
//       (client_id, txn_id, service_name, category_name, editing_type_name, planned_qty, done_qty, last_updated_by, created_at, updated_at)
//     VALUES
//       (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     ON DUPLICATE KEY UPDATE
//       planned_qty = VALUES(planned_qty),
//       done_qty = VALUES(done_qty),
//       last_updated_by = VALUES(last_updated_by),
//       updated_at = VALUES(updated_at)
//   `;

//   db.query(
//     upsert,
//     [
//       client_id,
//       txn_id,
//       service_name,
//       category_name,
//       editing_type_name,
//       planned,
//       done,
//       user_id,
//       now,
//       now,
//     ],
//     (err, result) => {
//       if (err) {
//         console.error("DB Error:", err);
//         return res
//           .status(500)
//           .json({ status: "Failure", message: "Database Error" });
//       }
//       return res.status(200).json({
//         status: "Success",
//         message: "Progress saved",
//         data: {
//           client_id,
//           txn_id,
//           service_name,
//           category_name,
//           editing_type_name,
//           planned_qty: planned,
//           done_qty: done,
//         },
//       });
//     }
//   );
// };

exports.incrementDoneQty = (req, res) => {
  const {
    client_id,
    txn_id,
    service_name,
    category_name,
    editing_type_name = "",
    planned_qty,
    delta,
    user_id,
  } = req.body;

  if (
    !client_id ||
    !txn_id ||
    !service_name ||
    !category_name ||
    planned_qty == null ||
    delta == null ||
    !user_id
  ) {
    return res
      .status(400)
      .json({ status: "Failure", message: "Missing fields" });
  }

  const planned = Math.max(0, parseInt(planned_qty, 10) || 0);
  const step = parseInt(delta, 10) || 0;
  const now = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  // Use one statement: create-if-missing with 0, then increment and clamp
  const q = `
    INSERT INTO re_service_progress
      (client_id, txn_id, service_name, category_name, editing_type_name, planned_qty, done_qty, last_updated_by, created_at, updated_at)
    VALUES
      (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      planned_qty = VALUES(planned_qty),
      done_qty = GREATEST(0, LEAST(VALUES(planned_qty), done_qty + ?)),
      last_updated_by = VALUES(last_updated_by),
      updated_at = VALUES(updated_at)
  `;

  db.query(
    q,
    [
      client_id,
      txn_id,
      service_name,
      category_name,
      editing_type_name,
      planned,
      user_id,
      now,
      now,
      step,
    ],
    (err) => {
      if (err) {
        console.error("DB Error:", err);
        return res
          .status(500)
          .json({ status: "Failure", message: "Database Error" });
      }
      return res
        .status(200)
        .json({ status: "Success", message: "Progress updated" });
    },
  );
};

// NEW WORK for TEAM work

exports.createTeam = async (req, res) => {
  try {
    const { name, member_ids } = req.body;

    // Validate name
    if (!name || !String(name).trim()) {
      return res.status(400).json({
        status: "Failure",
        message: "Team name is required",
      });
    }

    const now = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
    const members = Array.isArray(member_ids) ? member_ids : [];

    db.beginTransaction((tErr) => {
      if (tErr) {
        console.error("Transaction Error:", tErr);
        return res.status(500).json({
          status: "Failure",
          message: "Failed to start database transaction",
        });
      }

      // Insert new team
      const insertTeam = `INSERT INTO re_teams (name, created_at) VALUES (?, ?)`;
      db.query(insertTeam, [String(name).trim(), now], (err, result) => {
        if (err) {
          console.error("Insert Team Error:", err);
          return db.rollback(() =>
            res.status(500).json({
              status: "Failure",
              message: "Failed to create team",
            }),
          );
        }

        const teamId = result.insertId;

        // If no members, commit directly
        if (!members.length) {
          return db.commit((cErr) => {
            if (cErr) {
              console.error("Commit Error:", cErr);
              return db.rollback(() =>
                res.status(500).json({
                  status: "Failure",
                  message: "Failed to commit transaction",
                }),
              );
            }
            return res.status(201).json({
              status: "Success",
              message: "Team created successfully",
              data: { id: teamId, name: String(name).trim() },
            });
          });
        }

        // Insert team members
        const values = members.map((empId) => [teamId, empId, now]);
        const insertMembers = `
          INSERT IGNORE INTO re_team_members (team_id, employee_id, created_at)
          VALUES ?
        `;

        db.query(insertMembers, [values], (mErr) => {
          if (mErr) {
            console.error("Insert Members Error:", mErr);
            return db.rollback(() =>
              res.status(500).json({
                status: "Failure",
                message: "Failed to add team members",
              }),
            );
          }

          db.commit((cErr) => {
            if (cErr) {
              console.error("Commit Error:", cErr);
              return db.rollback(() =>
                res.status(500).json({
                  status: "Failure",
                  message: "Failed to commit transaction",
                }),
              );
            }

            return res.status(201).json({
              status: "Success",
              message: "Team created successfully with members",
              data: { id: teamId, name: String(name).trim() },
            });
          });
        });
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

exports.addMembersToTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { member_ids } = req.body;

    const now = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
    const members = Array.isArray(member_ids) ? member_ids : [];

    // Validate
    if (!members.length) {
      return res.status(400).json({
        status: "Failure",
        message: "member_ids must be a non-empty array",
      });
    }

    // Prepare values
    const values = members.map((empId) => [id, empId, now]);
    const q = `
      INSERT IGNORE INTO re_team_members (team_id, employee_id, created_at)
      VALUES ?
    `;

    db.query(q, [values], (err, result) => {
      if (err) {
        console.error("Database Error:", err);
        return res.status(500).json({
          status: "Failure",
          message: "Failed to add members",
        });
      }

      return res.status(200).json({
        status: "Success",
        message: "Members added successfully",
        data: { added: result.affectedRows },
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

exports.saveComplimentaryData = (req, res) => {
  const {
    txn_id,
    client_id,
    service_name,
    category_name,
    editing_type_id,
    editing_type_name,
    editing_type_amount,
    quantity,
    include_content_posting,
    include_thumbnail_creation,
    total_amount,
    employee,
  } = req.body;

  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  // ? Step 0: Check if service already exists for this txn_id + editing_type_id
  const checkDuplicate = `
    SELECT id FROM re_complimentary 
    WHERE txn_id = ? AND client_id = ? AND service_name = ? AND category_name = ? AND editing_type_id = ?
  `;

  db.query(
    checkDuplicate,
    [txn_id, client_id, service_name, category_name, editing_type_id],
    (dupErr, dupResult) => {
      if (dupErr) {
        console.error("Duplicate Check Error:", dupErr);
        return res.status(500).json({ status: "Failure", message: "DB error" });
      }

      if (dupResult.length > 0) {
        // Already exists ? stop here
        return res.status(200).json({
          status: "Alert",
          message: "This complimentary service already exists",
        });
      }

      // Step 1: Insert into re_complimentary (Quotation)
      const query = `
        INSERT INTO re_complimentary (
          txn_id,
          client_id,
          service_name,
          category_name,
          editing_type_id,
          editing_type_name,
          editing_type_amount,
          quantity,
          include_content_posting,
          include_thumbnail_creation,
          total_amount,
          employee,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        txn_id,
        client_id,
        service_name,
        category_name,
        editing_type_id,
        editing_type_name,
        editing_type_amount,
        quantity,
        include_content_posting,
        include_thumbnail_creation,
        total_amount,
        employee,
        createdAt,
      ];

      db.query(query, values, (err, result) => {
        if (err) {
          console.error("Insert Error (complimentary):", err);
          return res
            .status(500)
            .json({ status: "Failure", message: "DB error" });
        }

        // Step 2: Check if invoice exists
        const checkInvoice = "SELECT id FROM re_invoice WHERE txn_id = ?";
        db.query(checkInvoice, [txn_id], (err2, invoiceResult) => {
          if (err2) {
            console.error("Invoice Check Error:", err2);
            return res
              .status(500)
              .json({ status: "Failure", message: "DB error" });
          }

          if (invoiceResult.length > 0) {
            // Step 3: Insert into complimentary_invoice
            const invoiceQuery = `
              INSERT INTO re_complimentary_invoice (
                txn_id,
                client_id,
                service_name,
                category_name,
                editing_type_id,
                editing_type_name,
                editing_type_amount,
                quantity,
                include_content_posting,
                include_thumbnail_creation,
                total_amount,
                employee,
                created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            db.query(invoiceQuery, values, (err3) => {
              if (err3) {
                console.error("Insert Error (complimentary invoice):", err3);
                return res.status(500).json({
                  status: "Failure",
                  message: "Complimentary saved but invoice insert failed",
                });
              }

              return res.status(200).json({
                status: "Success",
                message: "Complimentary & invoice saved successfully",
              });
            });
          } else {
            // Only complimentary saved
            return res.status(200).json({
              status: "Success",
              message:
                "Complimentary saved successfully (invoice not created yet)",
            });
          }
        });
      });
    },
  );
};

function makeSlug(clientId) {
  return `${clientId}-${Date.now().toString(36)}-${crypto
    .randomBytes(3)
    .toString("hex")}`;
}

exports.generateClientLink = async (req, res) => {
  try {
    const { client_id, created_by, expires_at, is_active } = req.body;

    if (!client_id) {
      return res
        .status(400)
        .json({ status: "Failure", message: "client_id is required" });
    }

    // 1) ensure client exists
    db.query(
      "SELECT id FROM re_revenue_engine_client_details WHERE id = ?",
      [client_id],
      (e, rows) => {
        if (e) {
          console.error("client check error:", e.sqlMessage || e);
          return res
            .status(500)
            .json({ status: "Failure", message: "DB error (client check)" });
        }
        if (!rows.length) {
          return res
            .status(404)
            .json({ status: "Failure", message: "Client not found" });
        }

        // 2) existing active, non-expired link?
        const nowStr = moment()
          .tz("Asia/Kolkata")
          .format("YYYY-MM-DD HH:mm:ss");
        const qExisting = `
          SELECT slug FROM re_client_requirement_links
          WHERE client_id = ?
            AND is_active = 1
            AND (expires_at = '' OR expires_at > ?)
          ORDER BY id DESC
          LIMIT 1
        `;
        db.query(qExisting, [client_id, nowStr], (e2, rows2) => {
          if (e2) {
            console.error("lookup error:", e2.sqlMessage || e2);
            return res
              .status(500)
              .json({ status: "Failure", message: "DB error (lookup)" });
          }

          const origin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
          if (rows2.length) {
            const slug = rows2[0].slug;
            return res.json({
              status: "Success",
              data: { slug, url: `${origin}/public/r/${slug}` },
              note: "Reusing existing active link",
            });
          }

          // 3) create new slug & insert
          const slug = makeSlug(client_id);

          // body se aaya hua, ya defaults:
          const isActive = typeof is_active === "number" ? is_active : 1;
          // VARCHAR NOT NULL schema ke hisaab se:
          // - "" : no expiry
          // - "YYYY-MM-DD HH:mm:ss" : valid expiry
          const expiresAt =
            typeof expires_at === "string" ? expires_at.trim() : "";

          const createdAt = moment()
            .tz("Asia/Kolkata")
            .format("YYYY-MM-DD HH:mm:ss");

          const qInsert = `
            INSERT INTO re_client_requirement_links
              (client_id, slug, is_active, expires_at, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `;

          // ?? NOTE: 6 placeholders ? 6 values
          db.query(
            qInsert,
            [client_id, slug, isActive, expiresAt, created_by, createdAt],
            (e3) => {
              if (e3) {
                console.error("insert error:", e3.code, e3.sqlMessage || e3);
                if (e3.code === "ER_DUP_ENTRY") {
                  // rare slug collision: retry once
                  const retry = makeSlug(client_id);
                  db.query(
                    qInsert,
                    [
                      client_id,
                      retry,
                      isActive,
                      expiresAt,
                      created_by,
                      createdAt,
                    ],
                    (e4) => {
                      if (e4) {
                        console.error(
                          "retry insert error:",
                          e4.sqlMessage || e4,
                        );
                        return res.status(500).json({
                          status: "Failure",
                          message: "DB error (insert duplicate)",
                        });
                      }
                      return res.json({
                        status: "Success",
                        data: {
                          slug: retry,
                          url: `${origin}/public/r/${retry}`,
                        },
                      });
                    },
                  );
                  return;
                }
                return res
                  .status(500)
                  .json({ status: "Failure", message: "DB error (insert)" });
              }

              return res.json({
                status: "Success",
                data: { slug, url: `${origin}/public/r/${slug}` },
              });
            },
          );
        });
      },
    );
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ status: "Failure", message: "Unexpected server error" });
  }
};

function nowISTString() {
  return moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
}

exports.submitRequirement = (req, res) => {
  const {
    slug,
    name,
    email = null,
    phone,
    requirement = "",
    items_json = [],
    total_amount = 0,
  } = req.body || {};

  if (!slug)
    return res
      .status(400)
      .json({ status: "Failure", message: "slug is required" });
  if (!name)
    return res
      .status(400)
      .json({ status: "Failure", message: "name is required" });
  if (!phone || String(phone).replace(/\D/g, "").length < 10) {
    return res
      .status(400)
      .json({ status: "Failure", message: "phone must be 10 digits" });
  }

  // items_json string/array dono accept
  let items = [];
  if (Array.isArray(items_json)) items = items_json;
  else if (typeof items_json === "string") {
    try {
      const parsed = JSON.parse(items_json);
      if (Array.isArray(parsed)) items = parsed;
    } catch {}
  }
  const hasAnyItem = items.length > 0;
  if (!hasAnyItem && !String(requirement).trim()) {
    return res.status(400).json({
      status: "Failure",
      message: "Select at least one item or provide requirement text",
    });
  }

  const nowStr = nowISTString();

  // 1) link verify + expiry check
  const qLink = `
    SELECT id, client_id, is_active, expires_at
    FROM re_client_requirement_links
    WHERE slug = ?
    LIMIT 1
  `;
  db.query(qLink, [slug], (e1, rows1) => {
    if (e1) {
      console.error("link lookup error:", e1);
      return res
        .status(500)
        .json({ status: "Failure", message: "DB error (link lookup)" });
    }
    if (!rows1.length) {
      return res
        .status(404)
        .json({ status: "Failure", message: "Invalid link" });
    }

    const link = rows1[0];
    if (!Number(link.is_active)) {
      return res
        .status(410)
        .json({ status: "Failure", message: "Link is inactive" });
    }

    const exp = link.expires_at; // VARCHAR "" => no expiry, DATETIME => check
    const isExpired = exp && String(exp).trim() !== "" && exp <= nowStr;
    if (isExpired) {
      return res
        .status(410)
        .json({ status: "Failure", message: "Link expired" });
    }

    // 2) transaction start
    db.beginTransaction((e2) => {
      if (e2) {
        console.error("tx begin err:", e2);
        return res
          .status(500)
          .json({ status: "Failure", message: "DB error (tx start)" });
      }

      const qMaster = `
  INSERT INTO re_requirement_submissions
    (client_id, link_id, slug, name, email, phone, requirement, total_amount, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`;
      const masterVals = [
        link.client_id,
        link.id,
        slug,
        name,
        email,
        phone,
        requirement || null,
        Number(total_amount) || 0,
        nowISTString(),
      ];

      db.query(qMaster, masterVals, (e3, result) => {
        if (e3) {
          console.error("insert master err:", e3);
          return db.rollback(() =>
            res.status(500).json({
              status: "Failure",
              message: "DB error (insert submission)",
            }),
          );
        }

        const submissionId = result.insertId;
        if (!hasAnyItem) {
          return db.commit((e4) => {
            if (e4) {
              console.error("commit err:", e4);
              return res
                .status(500)
                .json({ status: "Failure", message: "DB error (commit)" });
            }
            return res.json({
              status: "Success",
              data: { submission_id: submissionId },
            });
          });
        }

        const qItems = `
          INSERT INTO re_requirement_submission_items
            (submission_id, category, sub_category, unit_price, qty, line_total)
          VALUES ?
        `;
        const rows = items.map((it) => [
          submissionId,
          String(it.category || "").slice(0, 191),
          String(it.sub_category || "").slice(0, 191),
          Number(it.unit_price) || 0,
          parseInt(it.qty, 10) || 0,
          Number(it.line_total) || 0,
        ]);

        db.query(qItems, [rows], (e5) => {
          if (e5) {
            console.error("insert items err:", e5);
            return db.rollback(() =>
              res.status(500).json({
                status: "Failure",
                message: "DB error (insert items)",
              }),
            );
          }
          db.commit((e6) => {
            if (e6) {
              console.error("commit err:", e6);
              return res
                .status(500)
                .json({ status: "Failure", message: "DB error (commit)" });
            }
            return res.json({
              status: "Success",
              data: { submission_id: submissionId },
            });
          });
        });
      });
    });
  });
};

exports.saveNotesData = (req, res) => {
  const { note_text } = req.body;

  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  const query = `
    INSERT INTO re_notes_data (
    note_text,
      created_at
    ) VALUES (?, ?)
  `;

  const values = [note_text, createdAt];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Insert Error:", err);
      return res.status(500).json({ status: "Failure", message: "DB error" });
    }

    res
      .status(200)
      .json({ status: "Success", message: "Saved Notes successfully" });
  });
};
exports.saveNotesbydefault = (req, res) => {
  const { note_text } = req.body;

  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  const query = `
    INSERT INTO re_notes_bydefault (
    note_text,
      created_at
    ) VALUES (?, ?)
  `;

  const values = [note_text, createdAt];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Insert Error:", err);
      return res.status(500).json({ status: "Failure", message: "DB error" });
    }

    res.status(200).json({
      status: "Success",
      message: "Saved Notes Bydefault successfully",
    });
  });
};
exports.saveDiscountData = (req, res) => {
  const { client_id, txn_id, discount_type, discount_per, discount_amt } =
    req.body;

  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  const query = `
    INSERT INTO re_discount (
    client_id,txn_id,discount_type,discount_per,discount_amt,
      created_at
    ) VALUES (?, ?,?,?,?,?)
  `;

  const values = [
    client_id,
    txn_id,
    discount_type,
    discount_per,
    discount_amt,
    createdAt,
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Insert Error:", err);
      return res.status(500).json({ status: "Failure", message: "DB error" });
    }

    res
      .status(200)
      .json({ status: "Success", message: "Saved discount successfully" });
  });
};

exports.saveInvoiceData = (req, res) => {
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

  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  const query = `
    INSERT INTO re_invoice_graphic (
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
      created_at
    ) VALUES (?, ?, ?, ?,?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
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

    createdAt,
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Insert Error:", err);
      return res.status(500).json({ status: "Failure", message: "DB error" });
    }

    res.status(200).json({ status: "Success", message: "Saved successfully" });
  });
};

exports.saveInvoiceGD = (req, res) => {
  const {
    txn_id,
    client_id,
    client_name,
    client_organization,
    email,
    phone,
    address,
    dg_employee,
    duration_start_date,
    duration_end_date,
    payment_mode,
    client_gst_no,
    client_pan_no,
    invoices,
    bill_type, // expect 'GST' or 'NON_GST' from frontend
  } = req.body;

  if (!txn_id || !client_id || !invoices || !bill_type) {
    return res
      .status(400)
      .json({ status: "Failure", message: "Missing required data" });
  }

  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  // ? Step 1: Get latest bill number for the selected type
  const getLastBillQuery = `
    SELECT bill_number FROM re_invoice WHERE bill_type = ? ORDER BY id DESC LIMIT 1
  `;

  db.query(getLastBillQuery, [bill_type], (err, results) => {
    if (err) {
      console.error("Error fetching last bill number:", err);
      return res.status(500).json({
        status: "Failure",
        message: "Error fetching last bill number",
        error: err,
      });
    }

    let newBillNumber;

    if (results.length > 0 && results[0].bill_number) {
      const lastBill = results[0].bill_number;
      const lastNumber = parseInt(lastBill.split("-").pop());
      const nextNumber = lastNumber + 1;
      newBillNumber =
        bill_type === "GST"
          ? `${nextNumber.toString().padStart(2, "0")}`
          : `${nextNumber.toString().padStart(2, "0")}`;
    } else {
      newBillNumber = bill_type === "GST" ? "01" : "01";
    }

    // ? Step 2: Insert into re_invoice table
    const clientQuery = `
      INSERT INTO re_invoice 
      (bill_type, bill_number, txn_id, client_id, client_name, client_organization, email, phone, address, dg_employee, duration_start_date, duration_end_date, payment_mode, client_gst_no, client_pan_no, created_at) 
      VALUES (?)
    `;

    const clientValues = [
      bill_type,
      newBillNumber,
      txn_id,
      client_id,
      client_name,
      client_organization || null,
      email || null,
      phone,
      address || null,
      dg_employee,
      duration_start_date,
      duration_end_date,
      payment_mode,
      client_gst_no || null,
      client_pan_no || null,
      createdAt,
    ];

    db.query(clientQuery, [clientValues], (err2) => {
      if (err2) {
        console.error("Error saving invoice:", err2);
        return res.status(500).json({
          status: "Failure",
          message: "Error saving invoice",
          error: err2,
        });
      }

      // ? Step 3: Insert re_invoice line items into re_invoice_graphic
      const invoiceValues = invoices.map((p) => [
        txn_id,
        client_id,
        p.service_name,
        p.category_name,
        p.editing_type_name,
        p.editing_type_amount,
        p.quantity,
        p.include_content_posting,
        p.include_thumbnail_creation,
        p.total_amount,
        p.employee,
        p.plan_name && p.plan_name.trim() !== "" ? p.plan_name : "Customise",
        createdAt,
      ]);

      // ? CRITICAL FIX: Validate before executing query
      if (
        !Array.isArray(invoices) ||
        invoices.length === 0 ||
        invoiceValues.length === 0
      ) {
        console.warn("No invoice items to insert for txn_id:", txn_id);
        return res.status(200).json({
          status: "Success",
          message: "Invoice saved successfully (no items to add)",
          billNumber: newBillNumber,
          billType: bill_type,
        });
      }

      // Only execute query if we have valid items
      const invoiceQuery = `
  INSERT INTO re_invoice_graphic 
  (txn_id, client_id, service_name, category_name, editing_type_name, editing_type_amount, quantity, include_content_posting, include_thumbnail_creation, total_amount, employee, plan_name, created_at) 
  VALUES ?
`;

      db.query(invoiceQuery, [invoiceValues], (err3) => {
        if (err3) {
          console.error("Error saving invoice items:", err3);
          return res.status(500).json({
            status: "Failure",
            message: "Error saving invoice items",
            error: err3,
          });
        }

        // ? Final Success Response
        return res.status(200).json({
          status: "Success",
          message: "Invoice saved successfully",
          billNumber: newBillNumber,
          billType: bill_type,
        });
      });
    });
  });
};

exports.saveInvoiceAdsCampaign = async (req, res) => {
  const adsItems = req.body.adsItems;

  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  if (!Array.isArray(adsItems) || adsItems.length === 0) {
    return res
      .status(400)
      .json({ status: "Failure", message: "No data provided." });
  }

  const insertValues = adsItems.map((item) => [
    item.txn_id,
    item.client_id,
    item.id,
    item.category,
    item.amount,
    item.percent,
    item.charge,
    item.total,
    item.employee,
    createdAt,
  ]);

  const sql = `
    INSERT INTO re_ads_campaign_details_invoice 
    (	txn_id, client_id, unique_id, category, amount, percent, charge, total, employee, created_at) 
    VALUES ?
  `;

  db.query(sql, [insertValues], (err, result) => {
    if (err) {
      console.error("DB Error:", err);
      return res
        .status(500)
        .json({ status: "Failure", message: "Database error." });
    }
    res
      .status(200)
      .json({ status: "Success", message: "Invoice Ads campaign saved." });
  });
};

exports.saveInvoiceComplimentaryData = (req, res) => {
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

  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  const query = `
    INSERT INTO re_complimentary_invoice (
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
      created_at
    ) VALUES (?, ?, ?, ?,?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
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

    createdAt,
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Insert Error:", err);
      return res.status(500).json({ status: "Failure", message: "DB error" });
    }

    res
      .status(200)
      .json({ status: "Success", message: "Invoice saved successfully" });
  });
};

exports.saveInvoiceCalculatorData = (req, res) => {
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
    plan_name,
  } = req.body;

  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  const query = `
    INSERT INTO re_invoice_graphic (
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
      employee,plan_name,
      created_at
    ) VALUES (?, ?, ?, ?,?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
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
    plan_name || "Customise",
    createdAt,
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Insert Error:", err);
      return res.status(500).json({ status: "Failure", message: "DB error" });
    }

    res.status(200).json({
      status: "Success",
      message: "Invoice Calculation Saved successfully",
    });
  });
};

exports.saveInvoiceNotesData = (req, res) => {
  const { note_text } = req.body;

  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  const query = `
    INSERT INTO re_invoice_notes_data (
    note_text,
      created_at
    ) VALUES (?, ?)
  `;

  const values = [note_text, createdAt];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Insert Error:", err);
      return res.status(500).json({ status: "Failure", message: "DB error" });
    }

    res
      .status(200)
      .json({ status: "Success", message: "Saved Notes successfully" });
  });
};

exports.saveInvoiceClientIdwiseNotes = (req, res) => {
  return res.status(403).json({
    status: "Failure",
    message:
      "Editing notes is disabled for invoice/Proforma as per business requirement.",
  });
  const { txn_id, client_id, planNotes } = req.body;
  if (!txn_id || !client_id) {
    return res
      .status(400)
      .json({ status: "Failure", message: "Missing required data" });
  }

  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  // Step 1: Check duplicates before inserting
  const checkQuery = `
    SELECT note_name 
    FROM re_invoice_client_notes 
    WHERE txn_id = ? AND client_id = ?
  `;

  db.query(checkQuery, [txn_id, client_id], (checkErr, existingRows) => {
    if (checkErr) {
      return res.status(500).json({
        status: "Failure",
        message: "Error checking existing notes",
        error: checkErr,
      });
    }

    // Extract existing note names
    const existingNotes = existingRows.map((row) =>
      row.note_name.toLowerCase(),
    );

    // Filter out duplicates
    const filteredNotes = planNotes.filter(
      (n) => !existingNotes.includes(n.note_name.toLowerCase()),
    );

    if (filteredNotes.length === 0) {
      return res.status(200).json({
        status: "Alert",
        message: "Duplicate Note, please use a unique note",
      });
    }

    // Step 2: Insert only new notes
    const NotesQuery = `
      INSERT INTO re_invoice_client_notes 
          (txn_id, client_id, note_name, created_at) 
          VALUES ?
    `;

    const NotesValues = filteredNotes.map((n) => [
      txn_id,
      client_id,
      n.note_name,
      createdAt,
    ]);

    db.query(NotesQuery, [NotesValues], (insertErr) => {
      if (insertErr) {
        console.error("Error saving Client Notes:", insertErr);
        return res.status(500).json({
          status: "Failure",
          message: "Error saving Client Notes",
          error: insertErr,
        });
      }

      return res.status(200).json({
        status: "Success",
        message: `${filteredNotes.length} Client Notes saved successfully (duplicates skipped)`,
      });
    });
  });
};

exports.saveAdditionalData = (req, res) => {
  const {
    txn_id,
    client_id,
    service_name,
    category_name,
    editing_type_id,
    editing_type_name,
    editing_type_amount,
    quantity,
    include_content_posting,
    include_thumbnail_creation,
    total_amount,
    employee,
  } = req.body;

  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  const values = [
    txn_id,
    client_id,
    service_name,
    category_name,
    editing_type_id,
    editing_type_name,
    editing_type_amount,
    quantity,
    include_content_posting,
    include_thumbnail_creation,
    total_amount,
    employee,
    createdAt,
  ];

  // ? Step 1: Check if this service already exists
  const checkDuplicate = `
    SELECT id FROM re_addtional_service
     WHERE txn_id = ? AND client_id = ? AND service_name = ? AND category_name = ? AND editing_type_id = ?
 
  `;

  db.query(
    checkDuplicate,
    [txn_id, client_id, service_name, category_name, editing_type_id],
    (err, duplicateResult) => {
      if (err) {
        console.error("Duplicate Check Error:", err);
        return res.status(500).json({ status: "Failure", message: "DB error" });
      }

      if (duplicateResult.length > 0) {
        return res.status(200).json({
          status: "Alert",
          message: "This additional service already exists for this quotation",
        });
      }

      // ? Step 2: Insert into re_addtional_service (Only Quotation)
      const insertQuery = `
      INSERT INTO re_addtional_service (
        txn_id,
        client_id,
        service_name,
        category_name,
        editing_type_id,
        editing_type_name,
        editing_type_amount,
        quantity,
        include_content_posting,
        include_thumbnail_creation,
        total_amount,
        employee,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

      db.query(insertQuery, values, (err2) => {
        if (err2) {
          console.error("Insert Error (Additional Quotation):", err2);
          return res
            .status(500)
            .json({ status: "Failure", message: "DB error" });
        }

        return res.status(200).json({
          status: "Success",
          message: "Additional Quotation saved successfully",
        });
      });
    },
  );
};

exports.saveRemainingAmountData = (req, res) => {
  const { txn_id, client_id, service_name, price, employee } = req.body;

  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  const query = `
    INSERT INTO re_amount_remaining (
    	txn_id,
      client_id,
      service_name,
      price,
      employee,
      created_at
    ) VALUES (?, ?, ?, ?,?, ?)
  `;

  const values = [txn_id, client_id, service_name, price, employee, createdAt];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Insert Error:", err);
      return res.status(500).json({ status: "Failure", message: "DB error" });
    }

    res.status(200).json({ status: "Success", message: "Saved successfully" });
  });
};

exports.seoClientsDetails = (req, res) => {
  try {
    const { name, website } = req.body;

    // Validation
    if (!name || !website) {
      return res.status(400).json({
        status: "Failure",
        message: "Client Name & Website is required",
      });
    }

    const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

    const querySQL = `INSERT INTO seo_clients (name, website, created_at) VALUES (?, ?, ?)`;

    db.query(querySQL, [name, website, createdAt], (err, result) => {
      if (err) {
        console.error("DB Error:", err);
        return res
          .status(500)
          .json({ status: "Failure", message: "Database error", error: err });
      }

      return res.status(201).json({
        status: "Success",
        message: "Client added successfully",
        data: {
          id: result.insertId,
          name,
          website,
          created_at: createdAt,
        },
      });
    });
  } catch (error) {
    console.error("Server Error:", error);
    return res
      .status(500)
      .json({ status: "Failure", message: "Internal Server Error" });
  }
};

exports.seoWebsiteKeyword = (req, res) => {
  try {
    const { client_id } = req.params;

    if (!client_id) {
      return res.status(400).json({
        status: "Failure",
        message: "Client ID is required",
      });
    }

    const { keyword } = req.body;

    if (!keyword) {
      return res.status(400).json({
        status: "Failure",
        message: "Keyword is required",
      });
    }

    const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

    const querySQL = `INSERT INTO seo_keywords (client_id, keyword, created_at) VALUES (?, ?, ?)`;

    db.query(querySQL, [client_id, keyword, createdAt], (err, result) => {
      if (err) {
        console.error("DB Error:", err);
        return res.status(500).json({
          status: "Failure",
          message: "Database error",
          error: err,
        });
      }

      return res.status(201).json({
        status: "Success",
        message: "Keyword added successfully",
        data: {
          id: result.insertId,
          client_id,
          keyword,
          created_at: createdAt,
        },
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
exports.saveDiscountSetting = (req, res) => {
  const { discount_per, discount_amt } = req.body;

  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  const query = `
    INSERT INTO re_discount_settings (
   discount_per,discount_amt,
      created_at
    ) VALUES (?, ?,?)
  `;

  const values = [discount_per, discount_amt, createdAt];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Insert Error:", err);
      return res.status(500).json({ status: "Failure", message: "DB error" });
    }

    res.status(200).json({
      status: "Success",
      message: "Saved discount setting successfully",
    });
  });
};

exports.saveDirectProforma = (req, res) => {
  const {
    txn_id,
    client_id,
    is_gst,
    gst_rate,
    base_amount,
    gst_amount,
    total_amount,
    pricing_snapshot,
    notes_snapshot,
    duration_start_date,
    duration_end_date,
  } = req.body;

  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  const query = `
    INSERT INTO re_proposal_proforma (
      client_id, txn_id, is_gst, gst_rate, base_amount, gst_amount, total_amount, 
      created_at, pricing_snapshot, notes_snapshot, source_type, duration_start_date, duration_end_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual', ?, ?)
  `;

  const values = [
    client_id,
    txn_id,
    is_gst,
    gst_rate,
    base_amount,
    gst_amount,
    total_amount,
    createdAt,
    pricing_snapshot || "[]",
    notes_snapshot || "[]",
    duration_start_date || null,
    duration_end_date || null,
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Insert Error:", err);
      return res.status(500).json({ status: "Failure", message: "DB error" });
    }

    res.status(200).json({
      status: "Success",
      message: "Proforma generated successfully",
      proformaId: result.insertId,
    });
  });
};

exports.sendRegisterAdminOtp = async (req, res) => {
  try {
    const { employee_name, employee_email, employee_password } = req.body;
    if (!employee_name || !employee_email || !employee_password) {
      return res
        .status(400)
        .json({ status: "Failure", message: "All fields are required." });
    }

    const email = employee_email.trim().toLowerCase();

    const dbQuery = (query, params) =>
      new Promise((resolve, reject) => {
        db.query(query, params, (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      });

    const existingUser = await dbQuery(
      "SELECT * FROM re_revenue_engine_employees WHERE employee_email = ?",
      [email],
    );
    if (existingUser.length > 0) {
      return res.status(409).json({
        status: "Failure",
        message: "User with this email already exists.",
      });
    }

    const existingOwner = await dbQuery(
      "SELECT * FROM re_revenue_engine_employees WHERE employee_role = 'Owner'",
      [],
    );
    if (existingOwner.length > 0) {
      return res.status(403).json({
        status: "Failure",
        message: "An Owner account already exists.",
      });
    }

    const existingOtpData = registerOtpStore.get(email);
    const now = Date.now();

    if (existingOtpData) {
      if (now < existingOtpData.resendCooldown) {
        return res.status(429).json({
          status: "Failure",
          message: "Please wait before requesting a new OTP.",
        });
      }
      if (existingOtpData.requests >= 3) {
        if (now > existingOtpData.expiresAt) {
          registerOtpStore.delete(email);
        } else {
          return res.status(429).json({
            status: "Failure",
            message: "Too many OTP requests. Try again later.",
          });
        }
      }
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const hashedPassword = await bcrypt.hash(employee_password, 10);
    const requests = existingOtpData ? existingOtpData.requests + 1 : 1;

    registerOtpStore.set(email, {
      employee_name,
      employee_email: email,
      hashedPassword,
      otpHash,
      expiresAt: now + 5 * 60 * 1000, // 5 minutes
      attempts: 0,
      resendCooldown: now + 30 * 1000, // 30 seconds cooldown
      requests,
    });

    const emailResult = await sendRegistrationOtpEmail({ to: email, otp });
    if (!emailResult.ok) {
      return res
        .status(500)
        .json({ status: "Failure", message: "Failed to send OTP email." });
    }

    return res
      .status(200)
      .json({ status: "Success", message: "OTP sent to email." });
  } catch (error) {
    console.error("Error in sendRegisterAdminOtp:", error);
    return res
      .status(500)
      .json({ status: "Failure", message: "Internal server error." });
  }
};

exports.registerAdminWithOtp = async (req, res) => {
  try {
    const { employee_email, otp } = req.body;
    if (!employee_email || !otp) {
      return res
        .status(400)
        .json({ status: "Failure", message: "Email and OTP are required." });
    }

    const email = employee_email.trim().toLowerCase();
    const otpData = registerOtpStore.get(email);
    const now = Date.now();

    if (!otpData) {
      return res
        .status(400)
        .json({ status: "Failure", message: "Invalid or expired OTP." });
    }

    if (now > otpData.expiresAt) {
      registerOtpStore.delete(email);
      return res
        .status(400)
        .json({ status: "Failure", message: "Invalid or expired OTP." });
    }

    if (otpData.attempts >= 5) {
      registerOtpStore.delete(email);
      return res
        .status(400)
        .json({ status: "Failure", message: "Invalid or expired OTP." });
    }

    const isOtpValid = await bcrypt.compare(otp.toString(), otpData.otpHash);
    if (!isOtpValid) {
      otpData.attempts += 1;
      return res
        .status(400)
        .json({ status: "Failure", message: "Invalid or expired OTP." });
    }

    const dbQuery = (query, params) =>
      new Promise((resolve, reject) => {
        db.query(query, params, (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      });

    const existingUser = await dbQuery(
      "SELECT * FROM re_revenue_engine_employees WHERE employee_email = ?",
      [email],
    );
    if (existingUser.length > 0) {
      registerOtpStore.delete(email);
      return res.status(409).json({
        status: "Failure",
        message: "User with this email already exists.",
      });
    }

    const existingOwner = await dbQuery(
      "SELECT * FROM re_revenue_engine_employees WHERE employee_role = 'Owner'",
      [],
    );
    if (existingOwner.length > 0) {
      registerOtpStore.delete(email);
      return res.status(403).json({
        status: "Failure",
        message: "An Owner account already exists.",
      });
    }

    const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

    await dbQuery(
      "INSERT INTO re_revenue_engine_employees (employee_name, employee_role, employee_email, employee_password, created_at) VALUES (?, ?, ?, ?, ?)",
      [
        otpData.employee_name,
        "Owner",
        email,
        otpData.hashedPassword,
        createdAt,
      ],
    );

    registerOtpStore.delete(email);

    return res
      .status(201)
      .json({ status: "Success", message: "Admin registered successfully." });
  } catch (error) {
    console.error("Error in registerAdminWithOtp:", error);
    return res
      .status(500)
      .json({ status: "Failure", message: "Internal server error." });
  }
};
