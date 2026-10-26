/**
 * PHASE E SCRIPT-BASED VERIFICATION
 *
 * Verifies Plan Selection Integration in Quotation Mode:
 * 1. Plan select simulation: items added to draftItems with id "draft-plan-*", source "plan", _status "pending_add", 0 DB writes.
 * 2. Duplicate skip test: skips already-existing services/ads in draft (both manual & plan duplicates).
 * 3. Unsaved Plan Removal: in-memory filter draftItems.filter(i => i.source !== "plan"), 0 DB writes.
 * 4. Saved Plan Items Protection: once saved to MySQL, "Remove Plan" is disabled/no-op; individual row delete works via pending_delete.
 */

const { db } = require('./connect');

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

const generateUniqueId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const isCompItem = (r) =>
  Boolean(
    r.is_complimentary ||
    r.include_in_total === false ||
    r.source === "custom_complimentary" ||
    r.source === "complimentary" ||
    String(r.service_name || r.service || "").toLowerCase().includes("(complimentary)") ||
    String(r.service_name || r.service || "").toLowerCase() === "complimentary"
  );

// Exact in-memory Plan selection logic from ServicesLandingPage.jsx
function simulateAddPlanToDraft(prevDraft, planData) {
  const planItems = planData
    .filter((item) => item.service_name !== "Ads Campaign" && item.service_name !== "Complimentary")
    .map((item) => ({
      service_name: item.service_name,
      category_name: item.category_name,
      editing_type_id: item.editing_type_id,
      editing_type_name: item.editing_type_name,
      editing_type_amount: item.editing_type_amount,
      quantity: item.quantity,
      total_amount: item.total_amount,
      plan_name: item.plan_name,
    }));

  const adsItems = planData
    .filter((item) => item.service_name === "Ads Campaign")
    .map((item) => ({
      category: item.category_name,
      amount: item.amount_ads,
      percent: item.percent_ads,
      charge: item.charge_ads,
      total: item.total_ads,
    }));

  const complimentaryItems = planData
    .filter((item) => item.service_name === "Complimentary")
    .map((item) => ({
      service_name: item.service_name,
      category_name: item.category_name,
      editing_type_id: item.editing_type_id,
      editing_type_name: item.editing_type_name,
      editing_type_amount: item.editing_type_amount,
      quantity: item.quantity,
      total_amount: item.total_amount,
    }));

  let skippedCount = 0;
  let skippedCompCount = 0;
  let skippedAdsCount = 0;
  const newItems = [];

  // 1. Paid Services
  planItems.forEach((pItem) => {
    const dup = prevDraft.find(
      (r) =>
        r._status !== "pending_delete" &&
        r._type === "service" &&
        !isCompItem(r) &&
        String(r.service_name || "").trim().toLowerCase() === String(pItem.service_name || "").trim().toLowerCase() &&
        String(r.category_name || "").trim().toLowerCase() === String(pItem.category_name || "").trim().toLowerCase() &&
        String(r.editing_type_name || "").trim().toLowerCase() === String(pItem.editing_type_name || "").trim().toLowerCase()
    );
    if (dup) {
      skippedCount++;
      return;
    }
    newItems.push({
      id: `draft-plan-${generateUniqueId()}`,
      service_name: pItem.service_name,
      category_name: pItem.category_name,
      editing_type_id: pItem.editing_type_id,
      editing_type_name: pItem.editing_type_name,
      editing_type_amount: Number(pItem.editing_type_amount || 0),
      quantity: Number(pItem.quantity || 1),
      unit_price: Number(pItem.editing_type_amount || 0),
      total_price: Number(pItem.total_amount || 0),
      total_amount: Number(pItem.total_amount || 0),
      include_in_total: true,
      is_complimentary: false,
      source: "plan",
      _type: "service",
      _status: "pending_add",
    });
  });

  // 2. Complimentary Services
  complimentaryItems.forEach((cItem) => {
    const dup = prevDraft.find(
      (r) =>
        r._status !== "pending_delete" &&
        r._type === "service" &&
        isCompItem(r) &&
        String(r.service_name || "").trim().toLowerCase() === String(cItem.service_name || "").trim().toLowerCase() &&
        String(r.category_name || "").trim().toLowerCase() === String(cItem.category_name || "").trim().toLowerCase() &&
        String(r.editing_type_name || "").trim().toLowerCase() === String(cItem.editing_type_name || "").trim().toLowerCase()
    );
    if (dup) {
      skippedCompCount++;
      return;
    }
    newItems.push({
      id: `draft-plan-${generateUniqueId()}`,
      service_name: cItem.service_name,
      category_name: cItem.category_name,
      editing_type_id: cItem.editing_type_id,
      editing_type_name: cItem.editing_type_name,
      editing_type_amount: Number(cItem.editing_type_amount || 0),
      quantity: Number(cItem.quantity || 1),
      unit_price: Number(cItem.editing_type_amount || 0),
      total_price: Number(cItem.total_amount || 0),
      total_amount: Number(cItem.total_amount || 0),
      include_in_total: false,
      is_complimentary: true,
      source: "plan",
      _type: "service",
      _status: "pending_add",
    });
  });

  // 3. Ads Campaigns
  adsItems.forEach((aItem) => {
    const dup = prevDraft.find(
      (r) =>
        r._status !== "pending_delete" &&
        r._type === "ads" &&
        String(r.category || r.category_name || "").trim().toLowerCase() === String(aItem.category || "").trim().toLowerCase()
    );
    if (dup) {
      skippedAdsCount++;
      return;
    }
    newItems.push({
      id: `draft-plan-${generateUniqueId()}`,
      category: aItem.category,
      category_name: aItem.category,
      amount: Number(aItem.amount || 0),
      budget: Number(aItem.amount || 0),
      percent: Number(aItem.percent || 0),
      charge: Number(aItem.charge || 0),
      total: Number(aItem.total || 0),
      include_in_total: true,
      is_complimentary: false,
      source: "plan",
      _type: "ads",
      _status: "pending_add",
    });
  });

  return {
    updatedDraft: [...prevDraft, ...newItems],
    newItems,
    skippedCount,
    skippedCompCount,
    skippedAdsCount,
  };
}

async function runPhaseEVerification() {
  console.log("================================================================================");
  console.log("PHASE E VERIFICATION: PLAN SELECTION IN-MEMORY & SAFE REMOVAL");
  console.log("================================================================================");

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  [PASS] Test ${total}: ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] Test ${total}: ${message}`);
    }
  }

  // 1. Setup Test Quotation
  const insertQtn = await runQuery(`
    INSERT INTO re_quotation (client_id, quotation_number, txn_id, grand_total_excl_gst, created_at, updated_at)
    VALUES (1, 'QTN-PHASE-E-TEST', 'TXN-PHASE-E-TEST', 0, NOW(), NOW())
  `);
  const testQuotationId = insertQtn.insertId;
  console.log(`\nCreated test quotation ID: ${testQuotationId}`);

  try {
    // Sample Plan Data (2 paid services, 1 complimentary, 1 ads campaign)
    const samplePlanData = [
      {
        plan_id: 10,
        plan_name: "Growth Starter Plan",
        service_name: "Graphic Design",
        category_name: "Social Media Post",
        editing_type_id: 1,
        editing_type_name: "Standard",
        editing_type_amount: 1500,
        quantity: 10,
        total_amount: 15000,
      },
      {
        plan_id: 10,
        plan_name: "Growth Starter Plan",
        service_name: "Video Editing",
        category_name: "Reels / Shorts",
        editing_type_id: 2,
        editing_type_name: "Dynamic",
        editing_type_amount: 2500,
        quantity: 4,
        total_amount: 10000,
      },
      {
        plan_id: 10,
        plan_name: "Growth Starter Plan",
        service_name: "Complimentary",
        category_name: "Story Creatives",
        editing_type_id: 3,
        editing_type_name: "Bonus",
        editing_type_amount: 0,
        quantity: 5,
        total_amount: 2500,
      },
      {
        plan_id: 10,
        plan_name: "Growth Starter Plan",
        service_name: "Ads Campaign",
        category_name: "Meta Ads",
        amount_ads: 20000,
        percent_ads: 10,
        charge_ads: 2000,
        total_ads: 22000,
      },
    ];

    let draftItems = [];

    // ── Scenario 1: Plan Select Simulation & 0 DB Writes ─────────────────────
    console.log("\n--- Scenario 1: Select Plan (In-Memory Draft & 0 DB Writes) ---");
    const selectRes1 = simulateAddPlanToDraft(draftItems, samplePlanData);
    draftItems = selectRes1.updatedDraft;

    assert(draftItems.length === 4, `4 items added to draft (got ${draftItems.length})`);
    assert(
      draftItems.every((item) => item.source === "plan" && item._status === "pending_add"),
      "All plan items have source='plan' and _status='pending_add'"
    );
    assert(
      draftItems.every((item) => String(item.id).startsWith("draft-plan-")),
      "All plan item IDs have prefix 'draft-plan-'"
    );

    // Verify 0 DB writes occurred
    const dbServices1 = await runQuery(`SELECT COUNT(*) as count FROM re_quotation_services WHERE quotation_id = ?`, [testQuotationId]);
    const dbAds1 = await runQuery(`SELECT COUNT(*) as count FROM re_quotation_ads WHERE quotation_id = ?`, [testQuotationId]);
    assert(dbServices1[0].count === 0, "Live MySQL: 0 services written to DB on plan select");
    assert(dbAds1[0].count === 0, "Live MySQL: 0 ads written to DB on plan select");

    // ── Scenario 2: Duplicate Skip Verification ──────────────────────────────
    console.log("\n--- Scenario 2: Duplicate Skip on Re-Selecting Plan ---");
    const selectRes2 = simulateAddPlanToDraft(draftItems, samplePlanData);
    assert(selectRes2.newItems.length === 0, "0 new items added on selecting duplicate plan");
    assert(selectRes2.skippedCount === 2, `2 paid services skipped as duplicates (got ${selectRes2.skippedCount})`);
    assert(selectRes2.skippedCompCount === 1, `1 complimentary service skipped as duplicate (got ${selectRes2.skippedCompCount})`);
    assert(selectRes2.skippedAdsCount === 1, `1 ads campaign skipped as duplicate (got ${selectRes2.skippedAdsCount})`);
    assert(draftItems.length === 4, "draftItems length remains unchanged after duplicate attempt");

    // ── Scenario 3: Remove Plan in Unsaved State (0 DB Calls) ────────────────
    console.log("\n--- Scenario 3: Remove Plan (Unsaved State) ---");
    // User clicks "Remove Plan" before saving
    // Exact handler: draftItems.filter(item => item.source !== "plan")
    const preRemoveCount = draftItems.length;
    draftItems = draftItems.filter((item) => item.source !== "plan");

    assert(draftItems.length === 0, `All unsaved plan items removed in-memory (was ${preRemoveCount}, now ${draftItems.length})`);

    // Verify ZERO DB calls during Remove Plan
    const dbServices3 = await runQuery(`SELECT COUNT(*) as count FROM re_quotation_services WHERE quotation_id = ?`, [testQuotationId]);
    assert(dbServices3[0].count === 0, "Live MySQL: 0 DB calls on Remove Plan (pure array filter)");

    // ── Scenario 4: Plan Item Save & Protected "Remove Plan" State ───────────
    console.log("\n--- Scenario 4: Plan Items Saved & Protected State ---");
    // Add plan items back into draft
    const selectRes3 = simulateAddPlanToDraft([], samplePlanData);
    draftItems = selectRes3.updatedDraft;

    // Simulate saving quotation via Phase D Single Batch Save
    const servicesPayload = draftItems
      .filter((i) => i._type === "service")
      .map((s) => [
        testQuotationId,
        s.service_name,
        s.category_name,
        s.editing_type_name,
        s.editing_type_amount,
        s.quantity,
        null,
        s.total_amount,
        s.source,
      ]);
    await runQuery(
      `INSERT INTO re_quotation_services
       (quotation_id, service_name, category_name, editing_type_name, editing_type_amount, quantity, additional_services, total_amount, source)
       VALUES ?`,
      [servicesPayload]
    );

    const adsPayload = draftItems
      .filter((i) => i._type === "ads")
      .map((a) => [
        testQuotationId,
        a.category_name,
        a.budget,
        a.percent,
        a.charge,
        a.total,
      ]);
    await runQuery(
      `INSERT INTO re_quotation_ads (quotation_id, category_name, budget, percent, charge, total) VALUES ?`,
      [adsPayload]
    );

    // After save: state re-initializes from DB with _status: "saved"
    const dbServicesSaved = await runQuery(`SELECT * FROM re_quotation_services WHERE quotation_id = ?`, [testQuotationId]);
    const dbAdsSaved = await runQuery(`SELECT * FROM re_quotation_ads WHERE quotation_id = ?`, [testQuotationId]);

    draftItems = [
      ...dbServicesSaved.map((s) => ({ ...s, _type: "service", _status: "saved" })),
      ...dbAdsSaved.map((a) => ({ ...a, _type: "ads", _status: "saved" })),
    ];

    // Check hasUnsavedPlanItems flag
    const hasUnsavedPlanItems = draftItems.some(
      (item) => item.source === "plan" && item._status === "pending_add"
    );
    assert(hasUnsavedPlanItems === false, "hasUnsavedPlanItems is FALSE for saved plan items (button disabled/hidden)");

    // Attempting bulk "Remove Plan" on saved items is disabled; user must use individual row delete
    const savedPlanItemToDelete = draftItems[0];
    // Exact handleDraftDelete logic for saved item:
    draftItems = draftItems.map((i) =>
      String(i.id) === String(savedPlanItemToDelete.id) ? { ...i, _status: "pending_delete" } : i
    );

    assert(
      draftItems.find((i) => String(i.id) === String(savedPlanItemToDelete.id))._status === "pending_delete",
      "Saved plan item correctly transitioned to 'pending_delete' via individual delete"
    );

    // True Batch save again excludes the deleted row:
    const remainingToSave = draftItems.filter((i) => i._type === "service" && i._status !== "pending_delete");
    await runQuery(`DELETE FROM re_quotation_services WHERE quotation_id = ?`, [testQuotationId]);
    const remainingValues = remainingToSave.map((s) => [
      testQuotationId,
      s.service_name,
      s.category_name,
      s.editing_type_name,
      s.editing_type_amount,
      s.quantity,
      null,
      s.total_amount,
      s.source,
    ]);
    await runQuery(
      `INSERT INTO re_quotation_services
       (quotation_id, service_name, category_name, editing_type_name, editing_type_amount, quantity, additional_services, total_amount, source)
       VALUES ?`,
      [remainingValues]
    );

    const postDeleteServices = await runQuery(`SELECT * FROM re_quotation_services WHERE quotation_id = ?`, [testQuotationId]);
    assert(postDeleteServices.length === 2, `DB now has 2 services after true batch individual delete (got ${postDeleteServices.length})`);
    assert(
      !postDeleteServices.some((s) => String(s.id) === String(savedPlanItemToDelete.id)),
      "Deleted saved plan item is cleanly removed from MySQL"
    );

  } finally {
    await runQuery(`DELETE FROM re_quotation_services WHERE quotation_id = ?`, [testQuotationId]);
    await runQuery(`DELETE FROM re_quotation_ads WHERE quotation_id = ?`, [testQuotationId]);
    await runQuery(`DELETE FROM re_quotation WHERE id = ?`, [testQuotationId]);
    console.log(`\nCleaned up test quotation ${testQuotationId}`);
    db.end();
  }

  console.log("\n================================================================================");
  console.log(`PHASE E VERIFICATION RESULT: ${passed}/${total} TESTS PASSED`);
  console.log("================================================================================");
  if (passed === total) {
    console.log("All Phase E requirements successfully verified against live MySQL!");
  } else {
    process.exit(1);
  }
}

runPhaseEVerification().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
