const { db } = require("../../connect");
const axios = require("axios");

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// ─────────────────────────────────────────────────────────────
// HELPER EXPORTS: DYNAMIC OWNER / MANAGER / TL RETRIEVAL
// ─────────────────────────────────────────────────────────────
async function getOwnerContact() {
  try {
    const rows = await runQuery("SELECT * FROM message_notification WHERE role = 'owner' LIMIT 1");
    if (rows && rows.length > 0) {
      return {
        name: rows[0].name || "Owner",
        email: rows[0].email || process.env.OWNER_EMAIL || "doaguruinfosystems@gmail.com",
        phone: rows[0].phone_number || process.env.OWNER_MOBILE_NUMBER || "7000102121",
      };
    }
  } catch (err) {
    console.error("[getOwnerContact] Error fetching owner from DB, using fallback:", err.message);
  }
  return {
    name: "Owner",
    email: process.env.OWNER_EMAIL || "doaguruinfosystems@gmail.com",
    phone: process.env.OWNER_MOBILE_NUMBER || "7000102121",
  };
}

async function getManagerContact() {
  try {
    const rows = await runQuery("SELECT * FROM message_notification WHERE role = 'manager' LIMIT 1");
    if (rows && rows.length > 0) {
      return {
        name: rows[0].name || "Manager",
        email: rows[0].email || "",
        phone: rows[0].phone_number || "",
      };
    }
  } catch (err) {
    console.error("[getManagerContact] Error fetching manager from DB:", err.message);
  }
  return null;
}

async function getTeamLeadByTeam(teamName) {
  if (!teamName) return null;
  try {
    const rows = await runQuery(
      "SELECT * FROM message_notification WHERE role = 'team_lead' AND (LOWER(TRIM(team_name)) = LOWER(TRIM(?)) OR LOWER(team_name) LIKE LOWER(?)) LIMIT 1",
      [teamName, `%${teamName}%`]
    );
    if (rows && rows.length > 0) {
      return {
        id: rows[0].id,
        team_name: rows[0].team_name,
        name: rows[0].name,
        email: rows[0].email,
        phone: rows[0].phone_number,
        designation: rows[0].designation,
      };
    }
  } catch (err) {
    console.error("[getTeamLeadByTeam] Error fetching TL from DB:", err.message);
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// CONTROLLERS
// ─────────────────────────────────────────────────────────────

// GET: All Reminder Settings
exports.getReminderSettings = async (req, res) => {
  try {
    const allRows = await runQuery("SELECT * FROM message_notification ORDER BY id ASC");
    
    const owner = allRows.find((r) => r.role === "owner") || {
      name: "Owner",
      email: process.env.OWNER_EMAIL || "doaguruinfosystems@gmail.com",
      phone_number: process.env.OWNER_MOBILE_NUMBER || "7000102121",
    };

    const manager = allRows.find((r) => r.role === "manager") || {
      name: "",
      email: "",
      phone_number: "",
    };

    const apiConfig = allRows.find((r) => r.role === "api_config") || {
      api_endpoint: "",
      api_token: "",
    };

    const teamLeads = allRows.filter((r) => r.role === "team_lead");

    return res.status(200).json({
      status: "Success",
      data: {
        owner,
        manager,
        apiConfig,
        teamLeads,
      },
    });
  } catch (error) {
    console.error("[getReminderSettings] Error:", error);
    return res.status(500).json({ status: "Failure", message: "Failed to load reminder settings" });
  }
};

// POST: Save Owner Settings
exports.saveOwnerSettings = async (req, res) => {
  try {
    const { name, email, phone_number } = req.body;
    if (!name || !email) {
      return res.status(400).json({ status: "Failure", message: "Name and email are required" });
    }

    const existing = await runQuery("SELECT id FROM message_notification WHERE role = 'owner' LIMIT 1");
    if (existing.length > 0) {
      await runQuery(
        "UPDATE message_notification SET name = ?, email = ?, phone_number = ? WHERE id = ?",
        [name, email, phone_number || null, existing[0].id]
      );
    } else {
      await runQuery(
        "INSERT INTO message_notification (role, name, email, phone_number) VALUES ('owner', ?, ?, ?)",
        [name, email, phone_number || null]
      );
    }

    return res.status(200).json({ status: "Success", message: "Owner settings saved successfully" });
  } catch (error) {
    console.error("[saveOwnerSettings] Error:", error);
    return res.status(500).json({ status: "Failure", message: "Failed to save owner settings" });
  }
};

// POST: Save Manager Settings
exports.saveManagerSettings = async (req, res) => {
  try {
    const { name, email, phone_number } = req.body;
    if (!name || !email) {
      return res.status(400).json({ status: "Failure", message: "Name and email are required" });
    }

    const existing = await runQuery("SELECT id FROM message_notification WHERE role = 'manager' LIMIT 1");
    if (existing.length > 0) {
      await runQuery(
        "UPDATE message_notification SET name = ?, email = ?, phone_number = ? WHERE id = ?",
        [name, email, phone_number || null, existing[0].id]
      );
    } else {
      await runQuery(
        "INSERT INTO message_notification (role, name, email, phone_number) VALUES ('manager', ?, ?, ?)",
        [name, email, phone_number || null]
      );
    }

    return res.status(200).json({ status: "Success", message: "Manager settings saved successfully" });
  } catch (error) {
    console.error("[saveManagerSettings] Error:", error);
    return res.status(500).json({ status: "Failure", message: "Failed to save manager settings" });
  }
};

// POST: Save API Config
exports.saveApiConfig = async (req, res) => {
  try {
    const { api_endpoint, api_token } = req.body;

    const existing = await runQuery("SELECT id FROM message_notification WHERE role = 'api_config' LIMIT 1");
    if (existing.length > 0) {
      await runQuery(
        "UPDATE message_notification SET api_endpoint = ?, api_token = ? WHERE id = ?",
        [api_endpoint || null, api_token || null, existing[0].id]
      );
    } else {
      await runQuery(
        "INSERT INTO message_notification (role, api_endpoint, api_token) VALUES ('api_config', ?, ?)",
        [api_endpoint || null, api_token || null]
      );
    }

    return res.status(200).json({ status: "Success", message: "API Configuration saved successfully" });
  } catch (error) {
    console.error("[saveApiConfig] Error:", error);
    return res.status(500).json({ status: "Failure", message: "Failed to save API config" });
  }
};

// POST: Add or Update Team Lead Manually
exports.saveTeamLead = async (req, res) => {
  try {
    const { id, team_name, name, email, phone_number, designation } = req.body;
    if (!team_name || !name || !email) {
      return res.status(400).json({ status: "Failure", message: "Team Name, Name, and Email are required" });
    }

    if (id) {
      await runQuery(
        "UPDATE message_notification SET team_name = ?, name = ?, email = ?, phone_number = ?, designation = ? WHERE id = ? AND role = 'team_lead'",
        [team_name, name, email, phone_number || null, designation || null, id]
      );
      return res.status(200).json({ status: "Success", message: "Team Lead updated successfully" });
    } else {
      const result = await runQuery(
        "INSERT INTO message_notification (role, team_name, name, email, phone_number, designation) VALUES ('team_lead', ?, ?, ?, ?, ?)",
        [team_name, name, email, phone_number || null, designation || null]
      );
      return res.status(200).json({ status: "Success", message: "Team Lead added successfully", id: result.insertId });
    }
  } catch (error) {
    console.error("[saveTeamLead] Error:", error);
    return res.status(500).json({ status: "Failure", message: "Failed to save Team Lead" });
  }
};

// DELETE: Delete Team Lead
exports.deleteTeamLead = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ status: "Failure", message: "ID is required" });
    }

    await runQuery("DELETE FROM message_notification WHERE id = ? AND role = 'team_lead'", [id]);
    return res.status(200).json({ status: "Success", message: "Team Lead deleted successfully" });
  } catch (error) {
    console.error("[deleteTeamLead] Error:", error);
    return res.status(500).json({ status: "Failure", message: "Failed to delete Team Lead" });
  }
};

// POST: Fetch Team Leads from External API
exports.fetchExternalTeamLeads = async (req, res) => {
  try {
    let { api_endpoint, api_token } = req.body;

    // If not provided in body, read from DB
    if (!api_endpoint) {
      const cfg = await runQuery("SELECT api_endpoint, api_token FROM message_notification WHERE role = 'api_config' LIMIT 1");
      if (cfg.length > 0 && cfg[0].api_endpoint) {
        api_endpoint = cfg[0].api_endpoint;
        api_token = api_token || cfg[0].api_token;
      }
    }

    if (!api_endpoint) {
      return res.status(400).json({
        status: "Failure",
        message: "External API Endpoint URL is required. Please configure it in settings.",
      });
    }

    // Save config if passed
    if (api_endpoint) {
      const existing = await runQuery("SELECT id FROM message_notification WHERE role = 'api_config' LIMIT 1");
      if (existing.length > 0) {
        await runQuery(
          "UPDATE message_notification SET api_endpoint = ?, api_token = ? WHERE id = ?",
          [api_endpoint, api_token || null, existing[0].id]
        );
      } else {
        await runQuery(
          "INSERT INTO message_notification (role, api_endpoint, api_token) VALUES ('api_config', ?, ?)",
          [api_endpoint, api_token || null]
        );
      }
    }

    // Call External API
    const headers = { "Content-Type": "application/json" };
    if (api_token) {
      headers["Authorization"] = api_token.startsWith("Bearer ") ? api_token : `Bearer ${api_token}`;
    }

    let externalData = [];
    try {
      const response = await axios.get(api_endpoint, { headers, timeout: 15000 });
      const body = response.data;

      if (Array.isArray(body)) {
        externalData = body;
      } else if (Array.isArray(body?.data)) {
        externalData = body.data;
      } else if (Array.isArray(body?.employees)) {
        externalData = body.employees;
      } else if (Array.isArray(body?.users)) {
        externalData = body.users;
      } else if (Array.isArray(body?.results)) {
        externalData = body.results;
      } else {
        return res.status(400).json({
          status: "Failure",
          message: "External API responded, but could not find a list of employees in response.",
          raw: body,
        });
      }
    } catch (apiErr) {
      console.error("[fetchExternalTeamLeads] External API request failed:", apiErr.message);
      return res.status(502).json({
        status: "Failure",
        message: `External API call failed: ${apiErr.message}`,
      });
    }

    // Process & Upsert employees
    let importedCount = 0;
    for (const emp of externalData) {
      const name = emp.name || emp.employee_name || emp.full_name || emp.username || "";
      const email = emp.email || emp.employee_email || emp.user_email || "";
      const phone = emp.phone || emp.mobile || emp.phone_number || emp.employee_phone || emp.contact || "";
      const designation = emp.designation || emp.role || emp.employee_role || emp.position || "";
      const team_name = emp.team_name || emp.team || emp.department || emp.dept || designation || "Team Lead";

      if (!name || !email) continue;

      // Check if team lead with this email or (name + team_name) already exists
      const match = await runQuery(
        "SELECT id FROM message_notification WHERE role = 'team_lead' AND (email = ? OR (name = ? AND team_name = ?)) LIMIT 1",
        [email, name, team_name]
      );

      if (match.length > 0) {
        await runQuery(
          "UPDATE message_notification SET team_name = ?, name = ?, email = ?, phone_number = ?, designation = ? WHERE id = ?",
          [team_name, name, email, phone || null, designation || null, match[0].id]
        );
      } else {
        await runQuery(
          "INSERT INTO message_notification (role, team_name, name, email, phone_number, designation) VALUES ('team_lead', ?, ?, ?, ?, ?)",
          [team_name, name, email, phone || null, designation || null]
        );
      }
      importedCount++;
    }

    const updatedTeamLeads = await runQuery("SELECT * FROM message_notification WHERE role = 'team_lead' ORDER BY team_name ASC, name ASC");

    return res.status(200).json({
      status: "Success",
      message: `Successfully fetched and updated ${importedCount} Team Leads from external API.`,
      data: updatedTeamLeads,
    });
  } catch (error) {
    console.error("[fetchExternalTeamLeads] Error:", error);
    return res.status(500).json({ status: "Failure", message: "Failed to fetch external team leads" });
  }
};

// GET: Available Teams list (for Proforma dropdown)
exports.getAvailableTeams = async (req, res) => {
  try {
    // Collect from message_notification where role = 'team_lead'
    const tlTeams = await runQuery(
      "SELECT DISTINCT team_name FROM message_notification WHERE role = 'team_lead' AND team_name IS NOT NULL AND team_name != ''"
    );

    // Also collect from re_teams table if existing
    let registeredTeams = [];
    try {
      registeredTeams = await runQuery("SELECT name as team_name FROM re_teams WHERE name IS NOT NULL AND name != ''");
    } catch (_) {}

    const teamSet = new Set();
    tlTeams.forEach((t) => t.team_name && teamSet.add(t.team_name.trim()));
    registeredTeams.forEach((t) => t.team_name && teamSet.add(t.team_name.trim()));

    const teams = Array.from(teamSet).sort();

    return res.status(200).json({
      status: "Success",
      data: teams,
    });
  } catch (error) {
    console.error("[getAvailableTeams] Error:", error);
    return res.status(500).json({ status: "Failure", message: "Failed to load teams" });
  }
};

// PATCH: Update Proforma Meeting Status
exports.updateProformaMeetingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { meeting_status, meeting_rescheduled_date } = req.body;

    if (!id) {
      return res.status(400).json({ status: "Failure", message: "Proforma ID is required" });
    }

    if (!["pending", "done", "rescheduled", "cancelled"].includes(meeting_status)) {
      return res.status(400).json({
        status: "Failure",
        message: "Invalid meeting_status. Must be one of: pending, done, rescheduled, cancelled",
      });
    }

    if (meeting_status === "rescheduled" && !meeting_rescheduled_date) {
      return res.status(400).json({
        status: "Failure",
        message: "Next meeting date is required when rescheduling",
      });
    }

    const cleanDate = meeting_status === "rescheduled" ? meeting_rescheduled_date : null;

    await runQuery(
      "UPDATE re_proposal_proforma SET meeting_status = ?, meeting_rescheduled_date = ? WHERE id = ?",
      [meeting_status, cleanDate, id]
    );

    return res.status(200).json({
      status: "Success",
      message: `Meeting status updated to '${meeting_status}'`,
      data: {
        id,
        meeting_status,
        meeting_rescheduled_date: cleanDate,
      },
    });
  } catch (error) {
    console.error("[updateProformaMeetingStatus] Error:", error);
    return res.status(500).json({ status: "Failure", message: "Failed to update meeting status" });
  }
};

module.exports = {
  ...exports,
  getOwnerContact,
  getManagerContact,
  getTeamLeadByTeam,
};
