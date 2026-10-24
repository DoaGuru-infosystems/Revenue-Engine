/**
 * Migration & Backfill Runner: Separate Ad Budget and Service Amount
 * Date: 2026-10-24
 * Run: node server/sql/run_ad_budget_migration.js
 */
const { db } = require('../connect');
const { calculateProformaTotals } = require('../revenue_engen_server/re_controller/re_proformaSyncHelper');

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

async function migrate() {
  try {
    console.log("🚀 Starting Step 1 Schema Migration & Backfill...");

    // ─── 1. Add columns to re_proposal_proforma ────────────────────────────────
    const proformaCols = await runQuery(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 're_proposal_proforma'
    `);
    const existingPfCols = new Set(proformaCols.map(c => c.COLUMN_NAME.toLowerCase()));

    if (!existingPfCols.has('service_amount')) {
      await runQuery(`ALTER TABLE re_proposal_proforma ADD COLUMN service_amount DECIMAL(12,2) DEFAULT 0.00`);
      console.log("✅ Added column `service_amount` to `re_proposal_proforma`.");
    } else {
      console.log("ℹ️ Column `service_amount` already exists in `re_proposal_proforma`.");
    }

    if (!existingPfCols.has('ad_budget_amount')) {
      await runQuery(`ALTER TABLE re_proposal_proforma ADD COLUMN ad_budget_amount DECIMAL(12,2) DEFAULT 0.00`);
      console.log("✅ Added column `ad_budget_amount` to `re_proposal_proforma`.");
    } else {
      console.log("ℹ️ Column `ad_budget_amount` already exists in `re_proposal_proforma`.");
    }

    // ─── 2. Add columns to re_proposal_payment_records ─────────────────────────
    const paymentCols = await runQuery(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 're_proposal_payment_records'
    `);
    const existingPayCols = new Set(paymentCols.map(c => c.COLUMN_NAME.toLowerCase()));

    if (!existingPayCols.has('realized_service_amount')) {
      await runQuery(`ALTER TABLE re_proposal_payment_records ADD COLUMN realized_service_amount DECIMAL(15,2) DEFAULT 0.00`);
      console.log("✅ Added column `realized_service_amount` to `re_proposal_payment_records`.");
    } else {
      console.log("ℹ️ Column `realized_service_amount` already exists in `re_proposal_payment_records`.");
    }

    // ─── 3. Backfill re_proposal_payment_records ───────────────────────────────
    console.log("🔄 Backfilling payment records...");
    const payResult = await runQuery(`
      UPDATE re_proposal_payment_records 
      SET realized_service_amount = GREATEST(0, amount - COALESCE(realized_ad_budget, 0))
    `);
    console.log(`✅ Updated payment records: ${payResult.affectedRows || payResult.changedRows || 0} rows.`);

    // ─── 4. Backfill re_proposal_proforma ──────────────────────────────────────
    console.log("🔄 Backfilling proformas...");
    const proformas = await runQuery(`
      SELECT id, base_amount, pricing_snapshot, ads_snapshot, discount_snapshot, adjustment_amount, is_gst, gst_rate 
      FROM re_proposal_proforma
    `);

    let pfCount = 0;
    for (const pf of proformas) {
      let pricing = [];
      let ads = [];
      let discountObj = null;

      try {
        if (pf.pricing_snapshot) pricing = typeof pf.pricing_snapshot === 'string' ? JSON.parse(pf.pricing_snapshot) : pf.pricing_snapshot;
      } catch {}
      try {
        if (pf.ads_snapshot) ads = typeof pf.ads_snapshot === 'string' ? JSON.parse(pf.ads_snapshot) : pf.ads_snapshot;
      } catch {}
      try {
        if (pf.discount_snapshot) discountObj = typeof pf.discount_snapshot === 'string' ? JSON.parse(pf.discount_snapshot) : pf.discount_snapshot;
      } catch {}

      if (Array.isArray(pricing) && pricing.length > 0) {
        const computed = calculateProformaTotals(
          pricing,
          Array.isArray(ads) ? ads : [],
          discountObj,
          pf.adjustment_amount || 0,
          pf.is_gst,
          pf.gst_rate || 18
        );
        const serviceAmt = Number(computed.dmAfterAdjustment || 0);
        const adsAmt = Number(computed.adsTotal || 0);

        await runQuery(
          `UPDATE re_proposal_proforma SET service_amount = ?, ad_budget_amount = ? WHERE id = ?`,
          [serviceAmt, adsAmt, pf.id]
        );
      } else {
        // Fallback if pricing_snapshot was empty
        const adsTotal = Array.isArray(ads)
          ? ads.reduce((sum, item) => sum + Number(item.amount || item.budget || item.ad_budget || 0), 0)
          : 0;
        const serviceAmt = Math.max(0, Number(pf.base_amount || 0) - adsTotal);
        await runQuery(
          `UPDATE re_proposal_proforma SET service_amount = ?, ad_budget_amount = ? WHERE id = ?`,
          [serviceAmt, adsTotal, pf.id]
        );
      }
      pfCount++;
    }
    console.log(`✅ Backfilled ${pfCount} proformas successfully.`);

    console.log("🎉 Step 1 Schema Migration & Backfill Completed Successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

migrate();
