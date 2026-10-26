# Phase C Verification Report: LocalStorage Persistence & 48-Hour Conflict Merge Logic

**Date:** October 26, 2026  
**Environment:** Quotation Flow (`ServicesLandingPage.jsx`, `quotationDraftPersistence.js`, `mode === "quotation"`)  
**Scope:** Phase C — LocalStorage Draft Persistence, 48-Hour Expiration TTL, 3-Way Conflict Merge Resolution, and Restore/Discard Lifecycle.

---

## 1. Architectural Summary & Design Decisions

### A. Key Storage Schema
Drafts are persisted under the key:
```
quotation_draft_<quotationId>
```
With the payload:
```json
{
  "quotationId": "101",
  "timestamp": 1700000000000,
  "draftItems": [ ... ],
  "discount": { "discountType": "Amount", "discountValue": 500 },
  "baseDbSnapshot": [ ... ]
}
```

### B. Design Decisions & Assumptions
1. **TTL Limit (48 Hours):** `DRAFT_TTL_MS = 48 * 60 * 60 * 1000`. If `Date.now() - draft.timestamp > 48h`, the draft is **silently discarded** (`storage.removeItem(...)` is called immediately without prompting the user, and clean database data is shown).
2. **Auto-Save Throttling:** `ServicesLandingPage.jsx` listens to changes in `draftItems` and `discount`. It only persists to `localStorage` when at least one item has an unsaved status (`pending_add`, `pending_edit`, or `pending_delete`). When all items are clean/saved, it clears the draft key from storage.
3. **Banner Safety (No Overwrites While Deciding):** While the restore banner is visible (`restoreAvailable === true`), auto-save is paused so that opening the page does not inadvertently overwrite the stored draft.
4. **3-Way Conflict Resolution ("Server Wins"):**
   - **`draft-` prefix items:** New items created locally that were never in the database are always safe overlays and are retained with `_status: "pending_add"`.
   - **Numeric ID items:** Compared between `currentDbItem` and `baseDbSnapshot`:
     - If the item was deleted on the server: Local edit is discarded, conflict notice generated.
     - If the item was modified on the server (`currentDb != baseSnapshot`): **Server Wins!** Local draft edits are discarded in favor of the fresh server data (`_status: "saved"`), and a user-friendly conflict notice is recorded.
     - If the server item is unchanged (`currentDb == baseSnapshot`): Local draft edit is **Valid** and retained with `_status: "pending_edit"` or `"pending_delete"`.
   - **New Server Items:** Any items added to the server by other sessions that were not part of the draft are merged in with `_status: "saved"`.
5. **Phase D Save-Success Hook:** `clearQuotationDraft(quotationId)` is exposed and invoked whenever all items are successfully committed to the database, ensuring zero stale draft residues.

---

## 2. Code-Level Implementation Diffs

### A. New Persistence Module: `client/src/features/calculator/utils/quotationDraftPersistence.js`
A standalone, zero-dependency module handling persistence, expiration, and 3-way conflict merging. It accepts an optional `storage` engine (`window.localStorage` in browser or `MockLocalStorage` in testing).

Key functions provided:
- `saveQuotationDraft({ quotationId, draftItems, discount, baseDbSnapshot, storage, now })`
- `getQuotationDraft(quotationId, storage)`
- `clearQuotationDraft(quotationId, storage)`
- `checkDraftStatus({ quotationId, storage, now })`
- `mergeDraftWithDb({ draft, currentDbItems })`
- `areDbItemsEqual(itemA, itemB)`

---

### B. Integration in `client/src/features/calculator/pages/ServicesLandingPage.jsx`

#### 1. Imports and State Declarations:
```javascript
import {
  saveQuotationDraft,
  clearQuotationDraft,
  checkDraftStatus,
  mergeDraftWithDb,
} from "../utils/quotationDraftPersistence";

// State hooks for Phase C
const [restoreAvailable, setRestoreAvailable] = useState(false);
const [pendingDraftData, setPendingDraftData] = useState(null);
const [conflictNotices, setConflictNotices] = useState([]);
const baseDbSnapshotRef = useRef([]);
```

#### 2. Initial Fetch & Expiration Check in `fetchData`:
```javascript
baseDbSnapshotRef.current = initialDraft;

// Phase C: Check for valid unsaved localStorage draft (< 48h)
const draftStatus = checkDraftStatus({ quotationId: effectiveProposalId });
if (draftStatus.restoreAvailable && draftStatus.draft) {
  setRestoreAvailable(true);
  setPendingDraftData(draftStatus.draft);
  setDraftItems(initialDraft); // Clean baseline until user chooses Restore or Discard
} else {
  setRestoreAvailable(false);
  setPendingDraftData(null);
  setDraftItems(initialDraft);
}
```

#### 3. Restore, Discard, and Auto-Save Handlers:
```javascript
const handleRestoreDraft = () => {
  if (!pendingDraftData) return;
  const { mergedItems, conflictNotices: conflicts, discount } = mergeDraftWithDb({
    draft: pendingDraftData,
    currentDbItems: baseDbSnapshotRef.current,
  });
  setDraftItems(mergedItems);
  if (discount) {
    if (discount.discountType) setDiscountType(discount.discountType);
    if (discount.discountValue !== undefined) setDiscountValue(discount.discountValue);
  }
  if (conflicts.length > 0) {
    setConflictNotices(conflicts);
    Swal.fire({
      icon: "info",
      title: "Server Changes Detected",
      html: `<div class="text-left text-xs space-y-1">` +
        `<p class="font-medium mb-2">Some items were modified or deleted on the server by another session. Server data was preserved for those items:</p>` +
        conflicts.map((c) => `<div class="p-1.5 bg-slate-800 rounded border border-slate-700"><b>${c.itemTitle}</b>: ${c.message}</div>`).join("") +
        `</div>`,
      confirmButtonText: "Got it",
    });
  } else {
    Swal.fire({
      icon: "success",
      title: "Draft Restored",
      text: `Restored ${mergedItems.length} items from your previous session.`,
      timer: 1500,
      showConfirmButton: false,
    });
  }
  setRestoreAvailable(false);
  setPendingDraftData(null);
};

const handleDiscardDraft = () => {
  clearQuotationDraft(effectiveProposalId);
  setRestoreAvailable(false);
  setPendingDraftData(null);
  Swal.fire({
    icon: "info",
    title: "Draft Discarded",
    text: "Local unsaved changes discarded. Showing current server data.",
    timer: 1500,
    showConfirmButton: false,
  });
};

// Helper hook for Phase D save-success to cleanly wipe localStorage draft
const handleQuotationSaveSuccess = () => {
  clearQuotationDraft(effectiveProposalId);
  setDraftItems((prev) => prev.map((item) => ({ ...item, _status: "saved" })));
  baseDbSnapshotRef.current = draftItems.map((item) => ({ ...item, _status: "saved" }));
};

// Auto-save draft changes to localStorage whenever draftItems or discount change
useEffect(() => {
  if (!isQuotationMode || !effectiveProposalId) return;
  if (restoreAvailable) return;

  const hasPendingChanges = draftItems.some(
    (item) => item._status && item._status !== "saved"
  );

  if (hasPendingChanges) {
    saveQuotationDraft({
      quotationId: effectiveProposalId,
      draftItems,
      discount: { discountType, discountValue },
      baseDbSnapshot: baseDbSnapshotRef.current,
    });
  } else if (draftItems.length > 0) {
    clearQuotationDraft(effectiveProposalId);
  }
}, [draftItems, discountType, discountValue, isQuotationMode, effectiveProposalId, restoreAvailable]);
```

#### 4. Restore/Discard Banner JSX:
```jsx
{isQuotationMode && restoreAvailable && pendingDraftData && (
  <div className="flex-shrink-0 bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/20 border border-amber-500/40 rounded-2xl p-3 sm:px-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl backdrop-blur-md">
    <div className="flex items-center gap-3 text-white min-w-0 w-full sm:w-auto">
      <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
        <AlertTriangle className="w-5 h-5 text-amber-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-amber-300 uppercase tracking-wide">
          Unsaved Draft Available
        </p>
        <p className="text-[11px] text-white/80 truncate">
          Aapka pichla unsaved kaam mila ({pendingDraftData.draftItems?.length || 0} items,{" "}
          {Math.max(1, Math.round((Date.now() - Number(pendingDraftData.timestamp || Date.now())) / (60 * 1000)))} min pehle).
        </p>
      </div>
    </div>
    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
      <button
        onClick={handleRestoreDraft}
        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-md active:scale-95 flex items-center gap-1.5"
      >
        Restore Draft
      </button>
      <button
        onClick={handleDiscardDraft}
        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white/90 border border-white/20 transition-all active:scale-95"
      >
        Discard
      </button>
    </div>
  </div>
)}
```

---

## 3. Test Suite Matrix: `client/test_phase_c_persistence.js`

| Test ID | Test Case | Scenario / Setup | Expected Outcome | Actual Outcome | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TEST 1** | **Empty localStorage** | `mockStorage` has no entry for quotation `101`. | `restoreAvailable = false`, `hasDraft = false`. Current DB items (2 rows) returned cleanly without any banner prompt. | `restoreAvailable: false`, 2 items returned, 0 conflicts. | **PASS** ✅ |
| **TEST 2** | **Valid Draft (< 48h)** | Draft timestamp = 2 hours ago. Contains 2 existing rows + 2 `draft-` prefix items. | `restoreAvailable = true`, `hasDraft = true`. Draft contains 4 items with correct timestamp. | `restoreAvailable: true`, 4 items found, age = 2 hours. | **PASS** ✅ |
| **TEST 3** | **Expired Draft (> 48h)** | Draft timestamp = 50 hours ago. | Draft is silently discarded. Key deleted from `mockStorage`. `restoreAvailable = false`. Zero user prompt. | Key removed from storage (`keyExistsAfter = false`). `restoreAvailable: false`. | **PASS** ✅ |
| **TEST 4** | **Conflict Scenario** | Item 501 in `baseDbSnapshot` had ₹5,000. Local draft edited it to ₹10,000. Server `currentDb` was modified to ₹18,000. | **Server Wins!** Local edit ₹10,000 discarded. Merged state has server value ₹18,000 with `_status: "saved"`. Conflict notice generated. | Item 501 has ₹18,000 (`_status: "saved"`). Conflict notice generated for Graphic Design. | **PASS** ✅ |
| **TEST 5** | **No-Conflict Scenario** | Item 501 in `baseDbSnapshot` had ₹5,000. Server `currentDb` is unchanged (₹5,000). Local draft edited it to ₹10,000. | **Draft Wins!** Local draft edit preserved with ₹10,000 and `_status: "pending_edit"`. 0 conflict notices. | Item 501 has ₹10,000 (`_status: "pending_edit"`). 0 conflict notices. | **PASS** ✅ |
| **TEST 6** | **Simulate 'Discard' Action** | User clicks Discard. `clearQuotationDraft` invoked. | Key deleted from storage. State cleanly reverts to current server baseline. | Storage key deleted (`hasDraftAfterDiscard = false`). View reverted to clean baseline. | **PASS** ✅ |
| **TEST 7** | **Simulate 'Save-Success' Hook** | Simulate Phase D save-success hook. | `clearQuotationDraft` cleans up the storage key upon successful server commit. Ready for Phase D. | Key cleaned from storage (`hasDraftAfterSave = false`). | **PASS** ✅ |

---

## 4. Test Console Execution Output

```
==========================================================================
   PHASE C: LOCALSTORAGE PERSISTENCE & 48-HR CONFLICT MERGE TEST SUITE
==========================================================================

✅ [TEST 1] Empty localStorage Scenario
   Status:  PASS
   Details: Storage empty -> restoreAvailable=false, mergedItems count = 2 (clean baseline DB items returned without banner).

✅ [TEST 2] Valid Draft (2 Hours Old) with Draft-Prefix Items
   Status:  PASS
   Details: restoreAvailable=true, itemCount=4, timestamp age=2 hours, storage key 'quotation_draft_101' exists.

✅ [TEST 3] Expired Draft (> 48 Hours) Silent Discard
   Status:  PASS
   Details: Draft age = 50 hours (> 48h TTL limit). Key automatically removed from storage (keyExistsAfter=false). restoreAvailable=false. Zero user prompt.

✅ [TEST 4] Conflict Scenario: Server Data Wins Over Outdated Draft Edit
   Status:  PASS
   Details: CONFIRMED: Server value ₹18,000 WINS over local draft ₹10,000. Status reset to 'saved'. Conflict notice generated: "Item "Graphic Design" was updated on the server by another session; your unsaved draft edits were discarded in favor of server data.".

✅ [TEST 5] No-Conflict Scenario: Local Draft Edit Retained When Server Unchanged
   Status:  PASS
   Details: CONFIRMED: Server was unchanged since draft snapshot. Local draft edit (qty=2, total=₹10,000) preserved with _status='pending_edit'. 0 conflict notices.

✅ [TEST 6] Simulate 'Discard' Action
   Status:  PASS
   Details: Storage key successfully deleted on Discard (hasDraftAfterDiscard=false). View reverted strictly to current server baseline (2 items).

✅ [TEST 7] Simulate 'Save-Success' Hook (Phase D Prep)
   Status:  PASS
   Details: CONFIRMED: clearQuotationDraft hook cleans up mock localStorage key upon save success. Ready for Phase D single-save button.

==========================================================================
TOTAL TESTS: 7 | PASSED: 7 | FAILED: 0
==========================================================================
🎯 ALL TESTS PASSED! Phase C LocalStorage & 48-Hour Merge Logic Verified.
```

---

## 5. Phase C Sign-off

- ✅ `npm run build` passes with zero errors (`✓ built in 15.49s`).
- ✅ Full 48-hour TTL silently discards expired drafts.
- ✅ Unexpired drafts cleanly trigger restore banner with Continue / Discard actions.
- ✅ 3-way conflict resolution strictly enforces **Server Wins** on modified items and generates descriptive conflict notices.
- ✅ `clearQuotationDraft` helper is ready for Phase D integration.

**Phase C is completely implemented and verified.** Ready for Phase D (Single "Save Changes" Button & Batch Database Sync).
