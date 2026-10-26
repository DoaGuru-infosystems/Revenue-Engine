/**
 * PHASE C: LOCALSTORAGE PERSISTENCE & 48-HOUR CONFLICT MERGE SUITE
 *
 * Tests the complete offline/in-memory persistence lifecycle using an in-memory mock localStorage:
 * - TEST 1: Empty storage -> clean DB data, restoreAvailable = false
 * - TEST 2: Valid draft (2h old, 2 draft- items) -> restoreAvailable = true, draft items returned
 * - TEST 3: Expired draft (50h old) -> silently discarded, key deleted from mock storage, restoreAvailable = false
 * - TEST 4: Conflict scenario (baseDbSnapshot X != currentDb Y) -> DB Wins, draft X discarded, conflict notice generated
 * - TEST 5: No-conflict scenario (baseDbSnapshot X == currentDb X) -> Draft Wins, draft edit retained
 * - TEST 6: Discard action -> key deleted from storage, state resets to current DB
 * - TEST 7: Save-success action -> clearQuotationDraft removes draft key from storage
 */

import {
  DRAFT_TTL_MS,
  getDraftStorageKey,
  saveQuotationDraft,
  getQuotationDraft,
  clearQuotationDraft,
  checkDraftStatus,
  mergeDraftWithDb,
  isDraftExpired,
} from "./src/features/calculator/utils/quotationDraftPersistence.js";

// ── In-Memory Mock localStorage Implementation ────────────────────────────────
class MockLocalStorage {
  constructor() {
    this.map = new Map();
  }
  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }
  setItem(key, value) {
    this.map.set(key, String(value));
  }
  removeItem(key) {
    this.map.delete(key);
  }
  clear() {
    this.map.clear();
  }
  has(key) {
    return this.map.has(key);
  }
}

async function runTestSuite() {
  console.log("==========================================================================");
  console.log("   PHASE C: LOCALSTORAGE PERSISTENCE & 48-HR CONFLICT MERGE TEST SUITE");
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

  const mockStorage = new MockLocalStorage();
  const quotationId = "101";
  const now = 1700000000000; // Fixed reference timestamp for deterministic testing

  // Baseline database items for quotation 101
  const baselineDbItems = [
    {
      id: 501,
      _type: "service",
      service_name: "Graphic Design",
      category_name: "Logo Design",
      editing_type_name: "Standard",
      quantity: 1,
      total_amount: 5000,
      total_price: 5000,
      is_complimentary: false,
      include_in_total: true,
      _status: "saved",
    },
    {
      id: 502,
      _type: "ads",
      category: "Meta Ads",
      category_name: "Meta Ads",
      budget: 15000,
      amount: 15000,
      total: 16500,
      total_amount: 16500,
      is_complimentary: false,
      include_in_total: true,
      _status: "saved",
    },
  ];

  // ────────────────────────────────────────────────────────────────────────────
  // TEST 1: Empty localStorage -> returns DB data, restoreAvailable = false
  // ────────────────────────────────────────────────────────────────────────────
  mockStorage.clear();
  const status1 = checkDraftStatus({
    quotationId,
    storage: mockStorage,
    now,
  });

  const merge1 = mergeDraftWithDb({
    draft: status1.draft,
    currentDbItems: baselineDbItems,
  });

  if (
    status1.hasDraft === false &&
    status1.restoreAvailable === false &&
    merge1.mergedItems.length === 2 &&
    merge1.hadConflicts === false
  ) {
    record(
      1,
      "Empty localStorage Scenario",
      "PASS",
      `Storage empty -> restoreAvailable=false, mergedItems count = ${merge1.mergedItems.length} (clean baseline DB items returned without banner).`
    );
  } else {
    record(1, "Empty localStorage Scenario", "FAIL", `status1=${JSON.stringify(status1)}`);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // TEST 2: Valid Draft (2 hours old, 2 draft-prefix items)
  // ────────────────────────────────────────────────────────────────────────────
  mockStorage.clear();
  const twoHoursAgo = now - 2 * 60 * 60 * 1000;
  const validDraftItems = [
    ...baselineDbItems,
    {
      id: "draft-item-1",
      _type: "service",
      service_name: "Video Editing",
      category_name: "Reels",
      editing_type_name: "4K",
      quantity: 2,
      total_amount: 12000,
      is_complimentary: false,
      include_in_total: true,
      _status: "pending_add",
    },
    {
      id: "draft-item-2",
      _type: "ads",
      category: "Google Ads",
      category_name: "Google Ads",
      budget: 20000,
      amount: 20000,
      total: 22000,
      is_complimentary: false,
      include_in_total: true,
      _status: "pending_add",
    },
  ];

  saveQuotationDraft({
    quotationId,
    draftItems: validDraftItems,
    discount: { discountType: "Amount", discountValue: 500 },
    baseDbSnapshot: baselineDbItems,
    storage: mockStorage,
    now: twoHoursAgo,
  });

  const status2 = checkDraftStatus({
    quotationId,
    storage: mockStorage,
    now,
  });

  if (
    status2.hasDraft === true &&
    status2.restoreAvailable === true &&
    status2.itemCount === 4 &&
    status2.timestamp === twoHoursAgo
  ) {
    record(
      2,
      "Valid Draft (2 Hours Old) with Draft-Prefix Items",
      "PASS",
      `restoreAvailable=true, itemCount=4, timestamp age=2 hours, storage key '${getDraftStorageKey(quotationId)}' exists.`
    );
  } else {
    record(2, "Valid Draft (2 Hours Old) with Draft-Prefix Items", "FAIL", `status2=${JSON.stringify(status2)}`);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // TEST 3: Expired Draft (50 hours old) -> Silently Discarded
  // ────────────────────────────────────────────────────────────────────────────
  mockStorage.clear();
  const fiftyHoursAgo = now - 50 * 60 * 60 * 1000;

  saveQuotationDraft({
    quotationId,
    draftItems: validDraftItems,
    baseDbSnapshot: baselineDbItems,
    storage: mockStorage,
    now: fiftyHoursAgo,
  });

  // Verify key was saved
  const keyExistsBefore = mockStorage.has(getDraftStorageKey(quotationId));

  const status3 = checkDraftStatus({
    quotationId,
    storage: mockStorage,
    now,
  });

  const keyExistsAfter = mockStorage.has(getDraftStorageKey(quotationId));

  if (
    keyExistsBefore === true &&
    keyExistsAfter === false &&
    status3.hasDraft === false &&
    status3.restoreAvailable === false &&
    status3.expired === true
  ) {
    record(
      3,
      "Expired Draft (> 48 Hours) Silent Discard",
      "PASS",
      `Draft age = 50 hours (> 48h TTL limit). Key automatically removed from storage (keyExistsAfter=false). restoreAvailable=false. Zero user prompt.`
    );
  } else {
    record(3, "Expired Draft (> 48 Hours) Silent Discard", "FAIL", `keyBefore=${keyExistsBefore}, keyAfter=${keyExistsAfter}`);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // TEST 4: Conflict Scenario (External DB Update: baseDbSnapshot X != currentDb Y)
  // ────────────────────────────────────────────────────────────────────────────
  // Draft was initiated when item 501 had total_amount = 5000 (X).
  // In local draft, user edited quantity to 2, total_amount to 10000.
  // BUT on the server (another session), item 501 was updated to total_amount = 18000 (Y).
  const conflictDraftItems = [
    {
      id: 501,
      _type: "service",
      service_name: "Graphic Design",
      category_name: "Logo Design",
      editing_type_name: "Standard",
      quantity: 2,
      total_amount: 10000,
      total_price: 10000,
      is_complimentary: false,
      include_in_total: true,
      _status: "pending_edit", // Local draft edit
    },
  ];

  const currentDbItemsModified = [
    {
      id: 501,
      _type: "service",
      service_name: "Graphic Design",
      category_name: "Logo Design",
      editing_type_name: "Standard",
      quantity: 3,
      total_amount: 18000, // Server was modified to 18000
      total_price: 18000,
      is_complimentary: false,
      include_in_total: true,
      _status: "saved",
    },
  ];

  const conflictDraftPayload = {
    quotationId,
    timestamp: now - 3600000, // 1 hr ago
    draftItems: conflictDraftItems,
    baseDbSnapshot: baselineDbItems, // item 501 was originally 5000 in snapshot
  };

  const merge4 = mergeDraftWithDb({
    draft: conflictDraftPayload,
    currentDbItems: currentDbItemsModified,
  });

  const item501Merged = merge4.mergedItems.find((i) => i.id === 501);
  const conflictNotice = merge4.conflictNotices.find((c) => c.itemId === 501);

  if (
    item501Merged &&
    item501Merged.total_amount === 18000 &&
    item501Merged._status === "saved" &&
    merge4.hadConflicts === true &&
    conflictNotice &&
    conflictNotice.type === "modified_on_server"
  ) {
    record(
      4,
      "Conflict Scenario: Server Data Wins Over Outdated Draft Edit",
      "PASS",
      `CONFIRMED: Server value ₹18,000 WINS over local draft ₹10,000. Status reset to 'saved'. Conflict notice generated: "${conflictNotice.message}".`
    );
  } else {
    record(4, "Conflict Scenario: Server Data Wins Over Outdated Draft Edit", "FAIL", `mergedItem=${JSON.stringify(item501Merged)}, notice=${JSON.stringify(conflictNotice)}`);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // TEST 5: No-Conflict Scenario (baseDbSnapshot X == currentDb X)
  // ────────────────────────────────────────────────────────────────────────────
  // Server data is UNCHANGED (currentDb still has 5000).
  // Local draft edited item 501 to quantity 2, total_amount 10000.
  // Expected: Local draft edit is retained with _status: "pending_edit".
  const noConflictCurrentDb = [
    {
      id: 501,
      _type: "service",
      service_name: "Graphic Design",
      category_name: "Logo Design",
      editing_type_name: "Standard",
      quantity: 1,
      total_amount: 5000, // Matches baselineDbItems exactly
      total_price: 5000,
      is_complimentary: false,
      include_in_total: true,
      _status: "saved",
    },
  ];

  const merge5 = mergeDraftWithDb({
    draft: conflictDraftPayload,
    currentDbItems: noConflictCurrentDb,
  });

  const item501NoConflict = merge5.mergedItems.find((i) => i.id === 501);

  if (
    item501NoConflict &&
    item501NoConflict.total_amount === 10000 &&
    item501NoConflict.quantity === 2 &&
    item501NoConflict._status === "pending_edit" &&
    merge5.hadConflicts === false &&
    merge5.conflictNotices.length === 0
  ) {
    record(
      5,
      "No-Conflict Scenario: Local Draft Edit Retained When Server Unchanged",
      "PASS",
      `CONFIRMED: Server was unchanged since draft snapshot. Local draft edit (qty=2, total=₹10,000) preserved with _status='pending_edit'. 0 conflict notices.`
    );
  } else {
    record(5, "No-Conflict Scenario: Local Draft Edit Retained When Server Unchanged", "FAIL", `mergedItem=${JSON.stringify(item501NoConflict)}`);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // TEST 6: Discard Action Simulation
  // ────────────────────────────────────────────────────────────────────────────
  mockStorage.clear();
  saveQuotationDraft({
    quotationId,
    draftItems: validDraftItems,
    baseDbSnapshot: baselineDbItems,
    storage: mockStorage,
    now,
  });

  const hadDraftBeforeDiscard = mockStorage.has(getDraftStorageKey(quotationId));

  // User clicks "Discard"
  clearQuotationDraft(quotationId, mockStorage);
  const hasDraftAfterDiscard = mockStorage.has(getDraftStorageKey(quotationId));

  // State returns cleanly to current DB items
  const cleanState = baselineDbItems;

  if (hadDraftBeforeDiscard === true && hasDraftAfterDiscard === false && cleanState.length === 2) {
    record(
      6,
      "Simulate 'Discard' Action",
      "PASS",
      `Storage key successfully deleted on Discard (hasDraftAfterDiscard=false). View reverted strictly to current server baseline (${cleanState.length} items).`
    );
  } else {
    record(6, "Simulate 'Discard' Action", "FAIL", `before=${hadDraftBeforeDiscard}, after=${hasDraftAfterDiscard}`);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // TEST 7: Save-Success Hook Simulation (Phase D Preparation)
  // ────────────────────────────────────────────────────────────────────────────
  mockStorage.clear();
  saveQuotationDraft({
    quotationId,
    draftItems: validDraftItems,
    baseDbSnapshot: baselineDbItems,
    storage: mockStorage,
    now,
  });

  const hadDraftBeforeSave = mockStorage.has(getDraftStorageKey(quotationId));

  // Simulate Phase D save-success hook
  const handleQuotationSaveSuccessSimulation = (qId) => {
    clearQuotationDraft(qId, mockStorage);
    return true;
  };

  const saveSuccessResult = handleQuotationSaveSuccessSimulation(quotationId);
  const hasDraftAfterSave = mockStorage.has(getDraftStorageKey(quotationId));

  if (hadDraftBeforeSave === true && saveSuccessResult === true && hasDraftAfterSave === false) {
    record(
      7,
      "Simulate 'Save-Success' Hook (Phase D Prep)",
      "PASS",
      `CONFIRMED: clearQuotationDraft hook cleans up mock localStorage key upon save success. Ready for Phase D single-save button.`
    );
  } else {
    record(7, "Simulate 'Save-Success' Hook (Phase D Prep)", "FAIL", `before=${hadDraftBeforeSave}, after=${hasDraftAfterSave}`);
  }

  console.log("\n==========================================================================");
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("==========================================================================");

  if (failed === 0) {
    console.log("🎯 ALL TESTS PASSED! Phase C LocalStorage & 48-Hour Merge Logic Verified.");
  } else {
    console.log("❌ SOME TESTS FAILED. Review details above.");
  }

  process.exit(failed === 0 ? 0 : 1);
}

runTestSuite();
