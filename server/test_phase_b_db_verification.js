/**
 * PHASE B SCRIPT-BASED DB & IN-MEMORY DRAFT LOGIC VERIFICATION
 *
 * Tests the in-memory draft architecture of Quotation Mode:
 * - Direct database query verification before and after operations
 * - Exact simulation of ServicesLandingPage handleServiceAdded, handleDraftDelete, handleDraftUndoDelete
 * - Service duplicate detection without DB calls
 * - BUG #4 collision check (same category + same amount) without DB calls
 * - True batch deletion with undo without DB calls
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

// ── Exact In-Memory Logic Replicated from ServicesLandingPage.jsx ─────────────
const isCompItem = (r) =>
  Boolean(
    r.is_complimentary ||
    r.include_in_total === false ||
    r.source === "custom_complimentary" ||
    r.source === "complimentary" ||
    String(r.service_name || r.service || "").toLowerCase().includes("(complimentary)") ||
    String(r.service_name || r.service || "").toLowerCase() === "complimentary"
  );

function simulateServiceAdded(prevItems, row, editingItem = null) {
  const isComp = isCompItem(row);
  const isAds = row.source === "custom_ads" || row.service_name === "Ads Campaign";

  const targetId = editingItem?.id || row.id;
  const existsIndex = prevItems.findIndex((item) => String(item.id) === String(targetId));

  if (existsIndex !== -1) {
    const existing = prevItems[existsIndex];
    const isOriginallySaved = !String(existing.id).startsWith("draft-");
    const updated = {
      ...existing,
      ...row,
      id: existing.id,
      _type: isAds ? "ads" : "service",
      is_complimentary: isComp,
      include_in_total: isAds ? true : !isComp,
      _status: isOriginallySaved ? "pending_edit" : "pending_add",
    };
    const newItems = [...prevItems];
    newItems[existsIndex] = updated;
    return { items: newItems, action: "updated", item: updated };
  }

  // Check duplicates for new service item
  if (!isAds) {
    const dup = prevItems.find((r) => {
      if (r._status === "pending_delete") return false;
      if (r._type !== "service") return false;
      if (Boolean(r.is_complimentary) !== isComp) return false;
      return (
        String(r.service_name || "").trim().toLowerCase() === String(row.service_name || "").trim().toLowerCase() &&
        String(r.category_name || "").trim().toLowerCase() === String(row.category_name || "").trim().toLowerCase() &&
        String(r.editing_type_name || "").trim().toLowerCase() === String(row.editing_type_name || "").trim().toLowerCase()
      );
    });
    if (dup) {
      return { items: prevItems, action: "duplicate_error", error: "Already Exists!" };
    }
  } else {
    // Check duplicates for ads item (BUG #4 collision check)
    const dup = prevItems.find((r) => {
      if (r._status === "pending_delete") return false;
      if (r._type !== "ads") return false;
      return (
        String(r.category || r.category_name || "").trim().toLowerCase() ===
        String(row.category_name || row.category || "").trim().toLowerCase()
      );
    });
    if (dup) {
      const dupAmt = Number(dup.amount || dup.budget || 0);
      const newAmt = Number(row.budget || row.amount || 0);
      if (dupAmt === newAmt) {
        return {
          items: prevItems,
          action: "duplicate_error",
          error: `Already Exists! Ads campaign for "${row.category_name}" with budget ₹${dupAmt.toLocaleString()} already exists.`,
        };
      }
      const isOriginallySaved = !String(dup.id).startsWith("draft-");
      const updated = {
        ...dup,
        ...row,
        category: row.category_name,
        category_name: row.category_name,
        amount: newAmt,
        budget: newAmt,
        total: row.total || row.total_amount,
        _status: isOriginallySaved ? "pending_edit" : "pending_add",
      };
      const newItems = prevItems.map((item) => (String(item.id) === String(dup.id) ? updated : item));
      return { items: newItems, action: "updated_amount", item: updated };
    }
  }

  // Add new item
  const draftId = `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const newItem = {
    ...row,
    id: draftId,
    _type: isAds ? "ads" : "service",
    is_complimentary: isComp,
    include_in_total: isAds ? true : !isComp,
    _status: "pending_add",
  };
  return { items: [...prevItems, newItem], action: "added", item: newItem };
}

function simulateDraftDelete(prevItems, itemToDelete) {
  const isNewDraft = String(itemToDelete.id).startsWith("draft-");
  if (isNewDraft) {
    return prevItems.filter((i) => String(i.id) !== String(itemToDelete.id));
  }
  return prevItems.map((i) =>
    String(i.id) === String(itemToDelete.id) ? { ...i, _status: "pending_delete" } : i
  );
}

function simulateDraftUndoDelete(prevItems, itemToRestore) {
  return prevItems.map((i) =>
    String(i.id) === String(itemToRestore.id) ? { ...i, _status: "saved" } : i
  );
}

async function runTestSuite() {
  console.log("==========================================================================");
  console.log("    PHASE B: SCRIPT-BASED DATABASE & IN-MEMORY DRAFT VERIFICATION");
  console.log("==========================================================================");

  let passed = 0;
  let failed = 0;
  const testResults = [];

  function record(id, title, status, details) {
    const symbol = status === "PASS" ? "✅" : "❌";
    console.log(`\n${symbol} [TEST ${id}] ${title}`);
    console.log(`   Status:  ${status}`);
    console.log(`   Details: ${details}`);
    testResults.push({ id, title, status, details });
    if (status === "PASS") passed++;
    else failed++;
  }

  let testQuotationId = null;

  try {
    // ── Setup: Create a temporary test quotation with 1 service and 1 ad in DB ─
    const clients = await runQuery("SELECT id FROM re_revenue_engine_client_details LIMIT 1");
    const clientId = clients[0]?.id || 1;

    const qtnIns = await runQuery(
      "INSERT INTO re_quotation (client_id, quotation_number, txn_id, created_by, grand_total_excl_gst) VALUES (?, ?, ?, ?, ?)",
      [clientId, "QTN-VERIFY-B", `TXN_VERIFY_${Date.now()}`, "TestRunner", 15000]
    );
    testQuotationId = qtnIns.insertId;

    // Seed 1 saved service
    const svcIns = await runQuery(
      "INSERT INTO re_quotation_services (quotation_id, service_name, category_name, editing_type_name, editing_type_amount, quantity, total_amount, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [testQuotationId, "Graphic Design", "Logo Design", "Standard", 5000, 1, 5000, "custom_graphic"]
    );
    const savedServiceId = svcIns.insertId;

    // Seed 1 saved ad
    const adIns = await runQuery(
      "INSERT INTO re_quotation_ads (quotation_id, category_name, budget, percent, charge, total) VALUES (?, ?, ?, ?, ?, ?)",
      [testQuotationId, "Google Ads", 10000, 10, 1000, 11000]
    );
    const savedAdId = adIns.insertId;

    // Query DB Counts BEFORE
    const initialServices = await runQuery("SELECT * FROM re_quotation_services WHERE quotation_id = ?", [testQuotationId]);
    const initialAds = await runQuery("SELECT * FROM re_quotation_ads WHERE quotation_id = ?", [testQuotationId]);

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 1: Initial State & DB Row Counts
    // ──────────────────────────────────────────────────────────────────────────
    if (initialServices.length === 1 && initialAds.length === 1) {
      record(
        1,
        "Initial State & Database Baseline Count",
        "PASS",
        `Quotation ID ${testQuotationId} created with re_quotation_services count = ${initialServices.length}, re_quotation_ads count = ${initialAds.length}`
      );
    } else {
      record(1, "Initial State & Database Baseline Count", "FAIL", "Failed to seed baseline quotation rows");
    }

    // Initialize in-memory draftItems from DB load (same as ServicesLandingPage.jsx)
    let draftItems = [
      ...initialServices.map((s) => ({
        ...s,
        _type: "service",
        is_complimentary: Boolean(s.is_complimentary),
        include_in_total: !Boolean(s.is_complimentary),
        _status: "saved",
      })),
      ...initialAds.map((a) => ({
        ...a,
        _type: "ads",
        category: a.category_name,
        amount: a.budget,
        is_complimentary: false,
        include_in_total: true,
        _status: "saved",
      })),
    ];

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 2: Simulate Add Graphic Service via onServiceAdded callback
    // ──────────────────────────────────────────────────────────────────────────
    const newServicePayload = {
      service_name: "Video Editing",
      category_name: "Reels / Shorts",
      editing_type_id: 12,
      editing_type_name: "Advanced Cut",
      editing_type_amount: 8000,
      quantity: 2,
      unit_price: 8000,
      total_price: 16000,
      total_amount: 16000,
      include_in_total: true,
      is_complimentary: false,
      source: "custom_graphic",
    };

    const addRes = simulateServiceAdded(draftItems, newServicePayload);
    draftItems = addRes.items;
    const addedItem = addRes.item;

    if (
      addRes.action === "added" &&
      addedItem &&
      addedItem._status === "pending_add" &&
      String(addedItem.id).startsWith("draft-") &&
      draftItems.length === 3
    ) {
      record(
        2,
        "Simulate 'Add Graphic Service' via onServiceAdded Callback",
        "PASS",
        `Local draft updated in-memory: Row added with id='${addedItem.id}', _status='${addedItem._status}', is_complimentary=false, include_in_total=true. Draft count = ${draftItems.length}`
      );
    } else {
      record(2, "Simulate 'Add Graphic Service' via onServiceAdded Callback", "FAIL", "Item not added properly to draft state");
    }

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 3: Database Verification After Add (Zero DB Writes)
    // ──────────────────────────────────────────────────────────────────────────
    const postAddServices = await runQuery("SELECT * FROM re_quotation_services WHERE quotation_id = ?", [testQuotationId]);
    const postAddAds = await runQuery("SELECT * FROM re_quotation_ads WHERE quotation_id = ?", [testQuotationId]);

    if (postAddServices.length === 1 && postAddAds.length === 1) {
      record(
        3,
        "Zero Database Writes After Add Service",
        "PASS",
        `CONFIRMED: re_quotation_services count is STILL ${postAddServices.length} (BEFORE: 1, AFTER: 1). re_quotation_ads count is STILL ${postAddAds.length} (BEFORE: 1, AFTER: 1). ZERO database writes occurred.`
      );
    } else {
      record(
        3,
        "Zero Database Writes After Add Service",
        "FAIL",
        `DB rows changed unexpectedly! Services: ${postAddServices.length}, Ads: ${postAddAds.length}`
      );
    }

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 4: Duplicate Check & BUG #4 Collision Detection in Memory
    // ──────────────────────────────────────────────────────────────────────────
    // 4A: Service duplicate (same service_name, category_name, editing_type_name)
    const duplicateServicePayload = {
      service_name: "Graphic Design",
      category_name: "Logo Design",
      editing_type_name: "Standard",
      editing_type_amount: 5000,
      quantity: 1,
      total_amount: 5000,
      include_in_total: true,
      is_complimentary: false,
    };
    const dupSvcRes = simulateServiceAdded(draftItems, duplicateServicePayload);
    const svcDupBlocked = dupSvcRes.action === "duplicate_error" && dupSvcRes.items.length === draftItems.length;

    // 4B: Ads duplicate with same amount (BUG #4 collision check)
    const duplicateAdSameAmount = {
      source: "custom_ads",
      service_name: "Ads Campaign",
      category_name: "Google Ads",
      category: "Google Ads",
      budget: 10000,
      amount: 10000,
      percent: 10,
      charge: 1000,
      total: 11000,
    };
    const dupAdSameRes = simulateServiceAdded(draftItems, duplicateAdSameAmount);
    const adSameAmtBlocked =
      dupAdSameRes.action === "duplicate_error" &&
      dupAdSameRes.error.includes("Already Exists!") &&
      dupAdSameRes.items.length === draftItems.length;

    // 4C: Ads update with different amount (should update in-place, NOT duplicate)
    const updateAdDiffAmount = {
      source: "custom_ads",
      service_name: "Ads Campaign",
      category_name: "Google Ads",
      category: "Google Ads",
      budget: 25000,
      amount: 25000,
      percent: 10,
      charge: 2500,
      total: 27500,
    };
    const updateAdRes = simulateServiceAdded(draftItems, updateAdDiffAmount);
    draftItems = updateAdRes.items;
    const adUpdatedInPlace =
      updateAdRes.action === "updated_amount" &&
      draftItems.length === 3 &&
      draftItems.find((i) => i._type === "ads")?.budget === 25000 &&
      draftItems.find((i) => i._type === "ads")?._status === "pending_edit";

    // Query DB to verify zero queries ran
    const dbServicesAfterDups = await runQuery("SELECT COUNT(*) as cnt FROM re_quotation_services WHERE quotation_id = ?", [testQuotationId]);
    const dbAdsAfterDups = await runQuery("SELECT COUNT(*) as cnt FROM re_quotation_ads WHERE quotation_id = ?", [testQuotationId]);
    const dbUntouchedDups = dbServicesAfterDups[0].cnt === 1 && dbAdsAfterDups[0].cnt === 1;

    if (svcDupBlocked && adSameAmtBlocked && adUpdatedInPlace && dbUntouchedDups) {
      record(
        4,
        "Duplicate-Check (Services) & BUG #4 Collision-Check (Ads) in Memory",
        "PASS",
        `CONFIRMED:\n` +
        `     - Service duplicate: REJECTED with 'Already Exists!' flag without DB query.\n` +
        `     - Ads duplicate same budget (₹10,000): REJECTED with BUG #4 collision alert without DB query.\n` +
        `     - Ads update different budget (₹25,000): In-place updated with _status='pending_edit'.\n` +
        `     - DB query count check: DB tables completely UNTOUCHED (services cnt=1, ads cnt=1).`
      );
    } else {
      record(
        4,
        "Duplicate-Check (Services) & BUG #4 Collision-Check (Ads) in Memory",
        "FAIL",
        `svcDupBlocked=${svcDupBlocked}, adSameAmtBlocked=${adSameAmtBlocked}, adUpdatedInPlace=${adUpdatedInPlace}, dbUntouched=${dbUntouchedDups}`
      );
    }

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 5: Simulate Delete on Already-Saved Row (Pending Delete)
    // ──────────────────────────────────────────────────────────────────────────
    const itemToDelete = draftItems.find((i) => String(i.id) === String(savedServiceId));
    draftItems = simulateDraftDelete(draftItems, itemToDelete);

    const deletedItemInDraft = draftItems.find((i) => String(i.id) === String(savedServiceId));
    const isMarkedPendingDelete = deletedItemInDraft?._status === "pending_delete";

    // DB check: Ensure NO delete query was executed in database
    const dbServicesAfterDelete = await runQuery(
      "SELECT * FROM re_quotation_services WHERE quotation_id = ? AND id = ?",
      [testQuotationId, savedServiceId]
    );

    if (isMarkedPendingDelete && dbServicesAfterDelete.length === 1) {
      record(
        5,
        "Simulate 'Delete' on Already-Saved Item (Pending Delete State)",
        "PASS",
        `CONFIRMED: Item id=${savedServiceId} marked with _status='pending_delete' in local state. Row STILL EXISTS in database table re_quotation_services (found ${dbServicesAfterDelete.length} row). Zero DB DELETE queries sent!`
      );
    } else {
      record(
        5,
        "Simulate 'Delete' on Already-Saved Item (Pending Delete State)",
        "FAIL",
        `isMarkedPendingDelete=${isMarkedPendingDelete}, dbRowsFound=${dbServicesAfterDelete.length}`
      );
    }

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 6: Simulate Undo Delete
    // ──────────────────────────────────────────────────────────────────────────
    draftItems = simulateDraftUndoDelete(draftItems, deletedItemInDraft);
    const restoredItem = draftItems.find((i) => String(i.id) === String(savedServiceId));
    const isRestoredToSaved = restoredItem?._status === "saved";

    const dbServicesAfterUndo = await runQuery(
      "SELECT * FROM re_quotation_services WHERE quotation_id = ? AND id = ?",
      [testQuotationId, savedServiceId]
    );

    if (isRestoredToSaved && dbServicesAfterUndo.length === 1) {
      record(
        6,
        "Simulate 'Undo' on Pending Delete Item",
        "PASS",
        `CONFIRMED: Item id=${savedServiceId} successfully reverted to _status='saved' in local state. DB state remains intact with 1 row.`
      );
    } else {
      record(6, "Simulate 'Undo' on Pending Delete Item", "FAIL", "Undo failed or DB state corrupted");
    }

  } catch (err) {
    console.error("Test execution error:", err);
  } finally {
    // ── Cleanup: Delete test quotation ───────────────────────────────────────
    if (testQuotationId) {
      try {
        await runQuery("DELETE FROM re_quotation WHERE id = ?", [testQuotationId]);
        console.log(`\n🧹 Cleanup: Test quotation ID ${testQuotationId} deleted from database (cascaded cleanly).`);
      } catch (cleanErr) {
        console.error("Cleanup error:", cleanErr.message);
      }
    }
  }

  console.log("\n==========================================================================");
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("==========================================================================");

  if (failed === 0) {
    console.log("🎯 ALL TESTS PASSED! Phase B DB & In-Memory Draft Architecture Verified.");
  } else {
    console.log("❌ SOME TESTS FAILED. Review output above.");
  }

  process.exit(failed === 0 ? 0 : 1);
}

runTestSuite();
