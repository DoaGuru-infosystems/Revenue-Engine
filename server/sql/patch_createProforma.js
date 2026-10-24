// patch_createProforma.js — run once, then delete
// Patches createProforma() to support quotation_id alongside proposal_id
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../revenue_engen_server/re_controller/re_proposalController.js');
let content = fs.readFileSync(filePath, 'utf8');

if (content.includes('quotation_id = req.body.quotation_id')) {
  console.log('Already patched. Nothing to do.');
  process.exit(0);
}

// ── Find the exact block to replace (using unique anchor strings) ─────────────
const START_ANCHOR = "exports.createProforma = async (req, res) => {";
const END_ANCHOR = "  } catch (error) {\r\n    console.error(\"createProforma error:\", error);\r\n    res.status(500).json({ status: \"Failure\", message: \"Server error\" });\r\n  }\r\n};";

const startIdx = content.indexOf(START_ANCHOR);
const endIdx = content.indexOf(END_ANCHOR, startIdx);

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find createProforma anchors. Aborting.');
  process.exit(1);
}

const endFull = endIdx + END_ANCHOR.length;
const before = content.slice(0, startIdx);
const after = content.slice(endFull);

const newBlock = `exports.createProforma = async (req, res) => {
  try {
    const {
      proposal_id,
      client_id,
      is_gst,
      gst_rate,
      base_amount,
      gst_amount,
      total_amount,
      created_by,
      duration_start_date,
      duration_end_date,
      previous_balance_amount,
      assigned_team,
    } = req.body;

    // ── NEW: also read quotation_id ───────────────────────────────────────────
    const quotation_id = req.body.quotation_id || null;

    // ── Validation: exactly one source must be provided ───────────────────────
    const hasProposal = proposal_id != null && proposal_id !== "";
    const hasQuotation = quotation_id != null && quotation_id !== "";

    if (!hasProposal && !hasQuotation) {
      return res.status(400).json({ status: "Failure", message: "Either proposal_id or quotation_id is required" });
    }
    if (hasProposal && hasQuotation) {
      return res.status(400).json({ status: "Failure", message: "Provide either proposal_id or quotation_id, not both" });
    }

    // ── Variables populated by whichever source path runs ─────────────────────
    let serviceItems = [];
    let adsItems = [];
    let notesJson = null;
    let termsJson = null;
    let remarksJson = null;
    let clientInstructions = null;
    let discountSnapshot = null;

    if (hasProposal) {
      // ─── EXISTING PROPOSAL PATH (unchanged) ──────────────────────────────
      const propQuery = \`SELECT * FROM re_proposals WHERE id = ?\`;
      const propResults = await runQuery(propQuery, [proposal_id]);
      if (propResults.length === 0) {
        return res
          .status(404)
          .json({ status: "Failure", message: "Proposal not found" });
      }
      const proposal = propResults[0];

      let allPricingItems = [];
      try { allPricingItems = JSON.parse(proposal.pricing_table_json || "[]"); } catch(e) { allPricingItems = []; }
      serviceItems = allPricingItems.filter(i => i.source !== 'custom_ads' && i.service_name !== 'Ads Campaign');
      adsItems = allPricingItems.filter(i => i.source === 'custom_ads' || i.service_name === 'Ads Campaign');

      adsItems.forEach(ad => {
        const charge = Number(ad.charge || ad.ad_charge || 0);
        if (charge > 0) {
          const catName = ad.category_name || ad.service_name || ad.service || "Ads Campaign";
          let campName = catName;
          if (!campName.toLowerCase().includes("campaign")) campName = campName + " Campaign";
          const percent = ad.percent !== undefined && ad.percent !== null ? ad.percent : (ad.charge_percentage || ad.ad_percent || "N/A");
          serviceItems.push({
            source: "custom_service_charge",
            service_type: "Graphic Service",
            service_name: "Service Charge",
            category_name: catName,
            editing_type_name: \`\${campName} Management & Optimization (\${percent}%)\`,
            quantity: 1,
            unit_price: charge,
            editing_type_amount: charge,
            total_price: charge,
            total_amount: charge,
            include_in_total: true,
          });
        }
      });

      try {
        const sec = typeof proposal.sections_json === "string" ? JSON.parse(proposal.sections_json) : proposal.sections_json;
        if (sec && sec.pricing_discount && Number(sec.pricing_discount.value) > 0) {
          discountSnapshot = JSON.stringify(sec.pricing_discount);
        }
      } catch(e) {}

      notesJson = proposal.notes_json;
      termsJson = proposal.terms_notes_json;
      remarksJson = proposal.additional_remarks;
      clientInstructions = proposal.client_instructions;

    } else {
      // ─── NEW QUOTATION PATH ───────────────────────────────────────────────
      const qtnRows = await runQuery(\`SELECT * FROM re_quotation WHERE id = ?\`, [quotation_id]);
      if (qtnRows.length === 0) {
        return res.status(404).json({ status: "Failure", message: "Quotation not found" });
      }
      const quotation = qtnRows[0];

      const rawServices = await runQuery(
        \`SELECT * FROM re_quotation_services WHERE quotation_id = ? ORDER BY id ASC\`,
        [quotation_id]
      );
      serviceItems = rawServices.map(s => ({
        source: s.source || "graphic",
        service_name: s.service_name,
        category_name: s.category_name,
        editing_type_name: s.editing_type_name,
        editing_type_amount: Number(s.editing_type_amount || 0),
        quantity: Number(s.quantity || 1),
        additional_services: s.additional_services,
        total_amount: Number(s.total_amount || 0),
        total_price: Number(s.total_amount || 0),
        include_in_total: true,
      }));

      const rawAds = await runQuery(
        \`SELECT * FROM re_quotation_ads WHERE quotation_id = ? ORDER BY id ASC\`,
        [quotation_id]
      );
      adsItems = rawAds.map(a => ({
        source: "custom_ads",
        service_name: "Ads Campaign",
        category_name: a.category_name,
        budget: Number(a.budget || 0),
        amount: Number(a.budget || 0),
        percent: Number(a.percent || 0),
        charge: Number(a.charge || 0),
        total: Number(a.total || 0),
      }));

      adsItems.forEach(ad => {
        const charge = Number(ad.charge || 0);
        if (charge > 0) {
          const catName = ad.category_name || "Ads Campaign";
          let campName = catName;
          if (!campName.toLowerCase().includes("campaign")) campName = campName + " Campaign";
          const percent = ad.percent !== undefined && ad.percent !== null ? ad.percent : "N/A";
          serviceItems.push({
            source: "custom_service_charge",
            service_type: "Graphic Service",
            service_name: "Service Charge",
            category_name: catName,
            editing_type_name: \`\${campName} Management & Optimization (\${percent}%)\`,
            quantity: 1,
            unit_price: charge,
            editing_type_amount: charge,
            total_price: charge,
            total_amount: charge,
            include_in_total: true,
          });
        }
      });

      if (quotation.discount_json) {
        try {
          const dObj = typeof quotation.discount_json === "string"
            ? JSON.parse(quotation.discount_json)
            : quotation.discount_json;
          if (dObj && Number(dObj.value) > 0) {
            discountSnapshot = typeof quotation.discount_json === "string"
              ? quotation.discount_json
              : JSON.stringify(quotation.discount_json);
          }
        } catch(e) {}
      }

      notesJson = quotation.notes_json;
      termsJson = null;
      remarksJson = null;
      clientInstructions = null;
    }

    // ── Amount calculation (shared) ───────────────────────────────────────────
    const prevBal = Number(previous_balance_amount) || 0;
    let finalBaseAmount = base_amount;
    let finalGstAmount = gst_amount;
    let finalTotalAmount = total_amount;

    if (!finalBaseAmount || !finalTotalAmount) {
      const dmTotal = serviceItems.reduce((sum, item) => {
        if (isComplimentaryItem(item)) return sum;
        const qty = Number(item.quantity) || 1;
        let addonsTotal = 0;
        if (item.additional_services) {
          try {
            const addons = typeof item.additional_services === "string" ? JSON.parse(item.additional_services) : item.additional_services;
            if (Array.isArray(addons)) {
              addonsTotal = addons.reduce((as, a) => as + ((Number(a.amount || a.unit_price) || 0) * (Number(a.quantity) || qty)), 0);
            }
          } catch {}
        }
        const base = Number(item.editing_type_amount || item.price || item.unit_price || 0);
        const baseTotal = base * qty;
        const recorded = Number(item.total_amount || item.total_price || 0);
        const effective = (recorded >= baseTotal + addonsTotal && recorded > 0)
          ? recorded
          : (recorded > 0 ? recorded : baseTotal) + addonsTotal;
        return sum + effective;
      }, 0);
      const adsTotal = adsItems.reduce((sum, item) => sum + Number(item.amount || item.budget || item.total || 0), 0);
      let discAmt = 0;
      if (discountSnapshot) {
        try {
          const dObj = JSON.parse(discountSnapshot);
          if (dObj.type === "Percentage") {
            discAmt = (dmTotal * Number(dObj.value)) / 100;
          } else {
            discAmt = Number(dObj.value);
          }
        } catch(e) {}
      }
      const dmAfterDisc = Math.max(0, dmTotal - discAmt);
      finalBaseAmount = dmAfterDisc + adsTotal;
      const rate = Number(gst_rate) || 18;
      finalGstAmount = is_gst ? Number(((dmAfterDisc * rate) / 100).toFixed(2)) : 0;
      finalTotalAmount = finalBaseAmount + finalGstAmount + prevBal;
    }

    const proformaTxnId = String(Date.now());
    const proformaNumber = await getNextProformaNumber(is_gst);

    const q = \`
      INSERT INTO re_proposal_proforma 
      (proposal_id, quotation_id, client_id, txn_id, proforma_number, is_gst, gst_rate, base_amount, gst_amount, total_amount, 
       pricing_snapshot, ads_snapshot, notes_snapshot, terms_snapshot, remarks_snapshot, client_instructions_snapshot, created_by,
       duration_start_date, duration_end_date, discount_snapshot, previous_balance_amount, assigned_team)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    \`;
    const result = await runQuery(q, [
      hasProposal ? proposal_id : null,
      hasQuotation ? quotation_id : null,
      client_id,
      proformaTxnId,
      proformaNumber,
      is_gst ? 1 : 0,
      gst_rate,
      finalBaseAmount,
      finalGstAmount || 0,
      finalTotalAmount,
      JSON.stringify(serviceItems),
      JSON.stringify(adsItems),
      notesJson,
      termsJson,
      remarksJson,
      clientInstructions,
      created_by || "System",
      duration_start_date || null,
      duration_end_date || null,
      discountSnapshot,
      prevBal,
      assigned_team || null,
    ]);

    if (prevBal > 0) {
      try {
        const pendingPfs = await runQuery(\`
          SELECT p.id, p.total_amount,
                 COALESCE((SELECT SUM(amount) FROM re_proposal_payment_records WHERE proforma_id = p.id AND status = 'approved'), 0) as paid
          FROM re_proposal_proforma p
          WHERE p.client_id = ? AND p.id != ? AND (p.is_carried_forward IS NULL OR p.is_carried_forward = 0) AND p.status != 'carried_forward'
        \`, [client_id, result.insertId]);

        for (const pf of pendingPfs) {
          const pend = Number(pf.total_amount || 0) - Number(pf.paid || 0);
          if (pend > 0.05) {
            await runQuery(\`
              UPDATE re_proposal_proforma 
              SET status = 'carried_forward', is_carried_forward = 1, carried_into_proforma_id = ?
              WHERE id = ?
            \`, [result.insertId, pf.id]);
          }
        }
      } catch (cfErr) {
        console.error("Error updating carried_forward status on previous proformas:", cfErr);
      }
    }

    if (hasProposal) {
      let updateFields = ["status = 'proforma_generated'"];
      let updateParams = [];
      if (duration_start_date) {
        updateFields.push("billing_start_date = ?");
        updateParams.push(duration_start_date);
      }
      if (duration_end_date) {
        updateFields.push("billing_end_date = ?");
        updateParams.push(duration_end_date);
      }
      updateParams.push(proposal_id);
      await runQuery(
        \`UPDATE re_proposals SET \${updateFields.join(", ")} WHERE id = ?\`,
        updateParams,
      );
    } else {
      await runQuery(
        \`UPDATE re_quotation SET status = 'proforma_generated', updated_at = NOW() WHERE id = ?\`,
        [quotation_id]
      );
    }

    res.status(200).json({
      status: "Success",
      message: "Proforma created",
      proformaId: result.insertId,
    });
  } catch (error) {
    console.error("createProforma error:", error);
    res.status(500).json({ status: "Failure", message: "Server error" });
  }
};`;

const newContent = before + newBlock + '\r\n' + after;
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('✅ createProforma patched successfully.');
console.log('Lines: ' + newContent.split('\n').length);
