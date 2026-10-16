// LOCAL CODE 

const { db } = require("../../connect");

const runQuery = (query, values) => {
  return new Promise((resolve, reject) => {
    db.query(query, values, (error, results) => {
      if (error) reject(error);
      else resolve(results);
    });
  });
};

/**
 * Robustly resolve the correct proforma_id from a txn_id and/or client_id.
 * Hierarchy:
 * 1. Direct match on re_proposal_proforma (txn_id or numeric id)
 * 2. Via re_invoice (if txn_id is invoice txn_id)
 * 3. Via re_proposal_payment_records (if txn_id is payment txn_id)
 * 4. Fallback: client_id (only if methods 1-3 fail; logs warning)
 */
const resolveProformaId = async (txn_id, client_id) => {
  if (!txn_id && !client_id) return null;

  if (txn_id) {
    const isNum = !isNaN(txn_id) && Number(txn_id) > 0;
    try {
      // 1. Direct match on re_proposal_proforma txn_id or id
      const directProf = await runQuery(
        "SELECT id FROM re_proposal_proforma WHERE txn_id = ? OR (id = ? AND ? < 1000000) LIMIT 1",
        [String(txn_id), isNum ? Number(txn_id) : 0, isNum ? Number(txn_id) : 0]
      );
      if (directProf.length > 0) {
        return directProf[0].id;
      }

      // 2. Via re_invoice (if txn_id is invoice txn_id)
      const invProf = await runQuery(
        "SELECT proforma_id FROM re_invoice WHERE txn_id = ? AND proforma_id IS NOT NULL LIMIT 1",
        [String(txn_id)]
      );
      if (invProf.length > 0 && invProf[0].proforma_id) {
        return invProf[0].proforma_id;
      }

      // 3. Via re_proposal_payment_records (if txn_id is payment txn_id)
      const payProf = await runQuery(
        "SELECT proforma_id FROM re_proposal_payment_records WHERE txn_id = ? AND proforma_id IS NOT NULL LIMIT 1",
        [String(txn_id)]
      );
      if (payProf.length > 0 && payProf[0].proforma_id) {
        return payProf[0].proforma_id;
      }
    } catch (err) {
      console.error("[Proforma Sync] Error resolving proforma by txn_id:", err);
    }
  }

  // 4. Fallback: only if client_id exists and the above 3 methods failed
  if (client_id) {
    console.warn(`[Proforma Sync] Primary 3 methods failed for txn_id '${txn_id}'. Using fallback client_id '${client_id}'.`);
    try {
      const clientProf = await runQuery(
        "SELECT id FROM re_proposal_proforma WHERE client_id = ? ORDER BY id DESC LIMIT 1",
        [client_id]
      );
      if (clientProf.length > 0) {
        return clientProf[0].id;
      }
    } catch (err) {
      console.error("[Proforma Sync] Error resolving proforma by client_id fallback:", err);
    }
  }

  console.error(`[Proforma Sync ERROR] Could not resolve proforma for txn_id: '${txn_id}', client_id: '${client_id}'`);
  return null;
};

exports.resolveProformaId = resolveProformaId;

const isComplimentaryItem = (item) => {
  if (!item) return false;
  if (item.source === "custom_complimentary" || item.source === "complimentary") return true;
  if (item.is_complimentary === true || item.is_complimentary === 1 || item.is_complimentary === "true") return true;
  if (item.include_in_total === false || item.include_in_total === 0 || item.include_in_total === "false") return true;
  const name = String(item.service_name || item.service || "").toLowerCase();
  if (name === "complimentary" || name.includes("(complimentary)") || name.includes("(complimntory)")) return true;
  const type = String(item.service_type || "").toLowerCase();
  if (type === "complimentary") return true;
  return false;
};

const calculateProformaTotals = (pricing = [], ads = [], discountObj = null, adjustmentAmt = 0, isGst = false, gstRate = 18) => {
  let dmTotal = pricing.reduce((sum, item) => {
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

  // CRITICAL: Include Ads Service Charges in dmTotal (unless already added as custom_service_charge in pricing)
  ads.forEach(ad => {
    const charge = Number(ad.charge || ad.ad_charge || 0);
    if (charge > 0) {
      const catName = ad.category_name || ad.service_name || ad.service || "";
      const alreadyInPricing = pricing.some(p => 
        (p.service_name === "Service Charge" || p.source === "custom_service_charge") &&
        (p.category_name || "").toLowerCase() === catName.toLowerCase()
      );
      if (!alreadyInPricing) {
        dmTotal += charge;
      }
    }
  });

  const adsTotal = ads.reduce((sum, item) => {
    return sum + Number(item.amount || item.budget || item.ad_budget || 0);
  }, 0);

  let calculatedDiscount = 0;
  if (discountObj && Number(discountObj.value || discountObj.discount_amt || 0) > 0) {
    const isPercent = discountObj.type === "Percentage" || discountObj.type === "percent" || discountObj.discountType === "percentage";
    const val = Number(discountObj.value || discountObj.discount_amt || discountObj.discount_per || 0);
    if (isPercent) {
      calculatedDiscount = (dmTotal * val) / 100;
    } else {
      calculatedDiscount = val;
    }
  }

  const dmAfterDiscount = Math.max(0, dmTotal - calculatedDiscount);
  const adjAmt = Number(adjustmentAmt) || 0;
  const dmAfterAdjustment = Math.max(0, dmAfterDiscount - adjAmt);
  const isGstActive = isGst && (Buffer.isBuffer(isGst) ? isGst[0] === 1 : (Number(isGst) === 1 || isGst === true));
  const rate = Number(gstRate) || 18;

  const baseAmount = dmAfterAdjustment + adsTotal;
  const gstAmount = isGstActive ? Number(((dmAfterAdjustment * rate) / 100).toFixed(2)) : 0;
  const totalAmount = baseAmount + gstAmount;

  return {
    dmTotal,
    adsTotal,
    calculatedDiscount,
    dmAfterDiscount,
    adjustmentAmount: adjAmt,
    dmAfterAdjustment,
    baseAmount,
    gstAmount,
    totalAmount
  };
};

exports.isComplimentaryItem = isComplimentaryItem;
exports.calculateProformaTotals = calculateProformaTotals;

/**
 * Synchronize discount_snapshot and recalculate base_amount, gst_amount, total_amount in re_proposal_proforma.
 * Pass discountObj = null to delete/clear discount.
 */
exports.syncProformaDiscount = async (txn_id, client_id, discountObj) => {
  try {
    const proformaId = await resolveProformaId(txn_id, client_id);
    if (!proformaId) {
      console.error(`[Proforma Sync ERROR] syncProformaDiscount failed: No proforma found for txn_id: '${txn_id}'`);
      return;
    }

    const rows = await runQuery(
      "SELECT id, pricing_snapshot, ads_snapshot, is_gst, gst_rate, adjustment_amount, previous_balance_amount FROM re_proposal_proforma WHERE id = ?",
      [proformaId]
    );
    if (rows.length === 0) return;
    const prof = rows[0];

    let services = [];
    try { services = JSON.parse(prof.pricing_snapshot || "[]"); } catch (e) {}
    let ads = [];
    try { ads = JSON.parse(prof.ads_snapshot || "[]"); } catch (e) {}

    const { baseAmount, gstAmount, totalAmount } = calculateProformaTotals(
      services,
      ads,
      discountObj,
      prof.adjustment_amount,
      prof.is_gst,
      prof.gst_rate
    );

    const prevBal = Number(prof.previous_balance_amount || 0);
    const finalTotal = totalAmount + prevBal;

    const snapshotVal = (discountObj && Number(discountObj.value || discountObj.discount_amt || 0) > 0)
      ? JSON.stringify(discountObj)
      : null;

    await runQuery(
      `UPDATE re_proposal_proforma 
       SET discount_snapshot = ?, base_amount = ?, gst_amount = ?, total_amount = ? 
       WHERE id = ?`,
      [snapshotVal, baseAmount, gstAmount, finalTotal, proformaId]
    );
    console.log(`[Proforma Sync] discount_snapshot synced for proforma_id: ${proformaId} (snapshot: ${snapshotVal}, total: ${finalTotal})`);
  } catch (err) {
    console.error("Error syncing proforma discount:", err);
  }
};

exports.syncProformaAdditionalService = async (txn_id, client_id, action, entryId, data) => {
  try {
    const proformaId = await resolveProformaId(txn_id, client_id);
    if (!proformaId) {
      console.warn(`[Proforma Sync] syncProformaAdditionalService: No proforma resolved for txn_id '${txn_id}'`);
      return;
    }

    const rows = await runQuery(
      "SELECT id, pricing_snapshot, ads_snapshot, discount_snapshot, adjustment_amount, is_gst, gst_rate, previous_balance_amount FROM re_proposal_proforma WHERE id = ?",
      [proformaId]
    );
    if (rows.length === 0) return;
    const prof = rows[0];

    let snapshot = [];
    try {
      snapshot = JSON.parse(prof.pricing_snapshot || "[]");
    } catch (e) {}

    if (action === "add" && data) {
      snapshot.push({
        id: entryId,
        source: "custom_additional",
        service_type: "Graphic Service",
        service_name: data.service_name,
        category_name: data.category_name,
        editing_type_name: data.editing_type_name,
        quantity: Number(data.quantity || 1),
        editing_type_amount: Number(data.editing_type_amount || 0),
        include_content_posting: Number(data.include_content_posting || 0),
        include_thumbnail_creation: Number(data.include_thumbnail_creation || 0),
        include_youtube_video_posting: Number(data.include_youtube_video_posting || 0),
        total_amount: Number(data.total_amount || (Number(data.editing_type_amount || 0) * Number(data.quantity || 1)))
      });
    } else if (action === "update" && data) {
      const idx = snapshot.findIndex(item => String(item.id) === String(entryId) && item.source === "custom_additional");
      if (idx !== -1) {
        snapshot[idx] = {
          ...snapshot[idx],
          service_name: data.service_name || snapshot[idx].service_name,
          category_name: data.category_name || snapshot[idx].category_name,
          editing_type_name: data.editing_type_name || snapshot[idx].editing_type_name,
          quantity: Number(data.quantity || snapshot[idx].quantity || 1),
          editing_type_amount: Number(data.editing_type_amount || snapshot[idx].editing_type_amount || 0),
          include_content_posting: Number(data.include_content_posting !== undefined ? data.include_content_posting : snapshot[idx].include_content_posting || 0),
          include_thumbnail_creation: Number(data.include_thumbnail_creation !== undefined ? data.include_thumbnail_creation : snapshot[idx].include_thumbnail_creation || 0),
          include_youtube_video_posting: Number(data.include_youtube_video_posting !== undefined ? data.include_youtube_video_posting : snapshot[idx].include_youtube_video_posting || 0),
          total_amount: Number(data.total_amount || snapshot[idx].total_amount || 0)
        };
      }
    } else if (action === "delete") {
      snapshot = snapshot.filter(item => !(String(item.id) === String(entryId) && item.source === "custom_additional"));
    }

    // Recalculate totals
    let ads = [];
    try { ads = JSON.parse(prof.ads_snapshot || "[]"); } catch (e) {}

    let discountObj = null;
    if (prof.discount_snapshot) {
      try {
        discountObj = typeof prof.discount_snapshot === "string" ? JSON.parse(prof.discount_snapshot) : prof.discount_snapshot;
      } catch (e) {}
    }

    const { baseAmount, gstAmount, totalAmount } = calculateProformaTotals(
      snapshot,
      ads,
      discountObj,
      prof.adjustment_amount,
      prof.is_gst,
      prof.gst_rate
    );

    const prevBal = Number(prof.previous_balance_amount || 0);
    const finalTotal = totalAmount + prevBal;

    await runQuery(
      "UPDATE re_proposal_proforma SET pricing_snapshot = ?, base_amount = ?, gst_amount = ?, total_amount = ? WHERE id = ?",
      [JSON.stringify(snapshot), baseAmount, gstAmount, finalTotal, proformaId]
    );
    console.log(`[Proforma Sync] pricing_snapshot (Additional Service: ${action}) synced for proforma_id: ${proformaId} (new total: ${finalTotal})`);
  } catch (err) {
    console.error("Error syncing proforma additional service:", err);
  }
};
