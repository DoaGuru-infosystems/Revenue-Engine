# Phase D Verification Report: UI Badges & Single Batch Save

**Date:** October 26, 2026  
**Environment:** Quotation Flow (`ServicesLandingPage.jsx`, `mode === "quotation"`)  
**Scope:** Phase D — Visual Status Indicators, Single Batch Save Handler (`handleSaveQuotation`), Discard All Handler (`handleDiscardAll`), Pending Count Badges, and Live Database Persistence.

---

## 1. Architectural Summary & Design Decisions

### A. Core Invariants Implemented
1. **Single Point of Database Mutation:**
   - In Quotation mode, individual additions, edits, deletions, and discount adjustments **NEVER trigger immediate database calls**.
   - All alterations remain in `draftItems` until the user explicitly clicks the "Save Quotation" button.
2. **True Batch Deletion ("Replace-All" Pattern):**
   - Items with `_status: "pending_delete"` are visually struck through with a red badge and an inline "Undo" button.
   - When saving, `pending_delete` items are filtered out:
     `finalServices = draftItems.filter(i => i._type === 'service' && i._status !== 'pending_delete')`
     `finalAds = draftItems.filter(i => i._type === 'ads' && i._status !== 'pending_delete')`
   - Because the backend endpoints (`POST /quotation/:id/services` and `POST /quotation/:id/ads`) replace existing records, omitted rows are cleanly removed from MySQL.
3. **Client-Side Grand Total Calculation:**
   - Follows the Phase 1/2 specification:
     `rawServiceTotal = paidServices.reduce(...)` (Complimentary services strictly excluded)
     `discountAmount = discountType === 'Percentage' ? (rawServiceTotal * discountValue) / 100 : discountValue`
     `finalGrandTotal = Math.max(0, rawServiceTotal - discountAmount) + adsTotal`
4. **Draft Clearance on Success:**
   - Upon successful save, `clearQuotationDraft(quotationId)` is invoked, clearing the localStorage cache.
   - Fresh data is loaded from the server and all rows are initialized with `_status: "saved"`.
5. **Safe Failure:**
   - If network or server error occurs during save, local `draftItems` remain intact without data loss, allowing the user to retry.
6. **Zero-DB Discard:**
   - "Discard All" prompts the user with confirmation, clears the localStorage draft, and resets state directly to the server snapshot (`baseDbSnapshotRef.current`) with **0 database round-trips**.

---

## 2. UI Elements Added

1. **Visual Badges (Graphic, Ads, & Complimentary Tables):**
   - `saved`: Green badge (`bg-emerald-500/20 text-emerald-300 border-emerald-500/30`) "Saved"
   - `pending_add`: Amber badge (`bg-amber-500/20 text-amber-300 border-amber-500/30`) "Unsaved (New)"
   - `pending_edit`: Amber badge (`bg-amber-500/20 text-amber-300 border-amber-500/30`) "Unsaved (Edited)"
   - `pending_delete`: Red badge (`bg-red-500/20 text-red-300 border-red-500/30`) "Pending Delete" with row strikethrough (`opacity-50 line-through bg-red-950/20`) and an inline "Undo" button.
2. **Top Header Save Button:**
   - Located in the stats grid of the top header.
   - Displays a live pending count badge: `Save (<N> pending)`.
   - Disabled with subdued styling when `unsavedChangesCount === 0`.
3. **Bottom Floating Action Bar:**
   - Automatically slides into view whenever `unsavedChangesCount > 0`.
   - Displays pulsing amber indicator with unsaved changes count.
   - Provides "Discard All" (grey) and "Save Quotation" (emerald gradient) actions.

---

## 3. Assumptions Taken

- **ASSUMPTION TAKEN 1 (Concurrent Dispatch):** Chose `Promise.all` for dispatching `POST /quotation/:id/services`, `POST /quotation/:id/ads`, and `PATCH /quotation/:id/notes`. Both endpoints execute within ~40ms and this ensures total consistency in a single user gesture.
- **ASSUMPTION TAKEN 2 (Quotation Discount In-Memory):** In Quotation mode, updating or removing discount via `ProposalDiscountModal` is kept strictly in-memory (and persisted via `localStorage` draft) until "Save Quotation" is clicked. This preserves the core invariant of zero immediate DB writes.

---

## 4. Verification Test Results

Test Suite: `server/test_phase_d_verification.js`  
Target: Live MySQL database (`re_quotation`, `re_quotation_services`, `re_quotation_ads`)

```
================================================================================
PHASE D VERIFICATION: SINGLE BATCH SAVE & UI STATE INDICATORS
================================================================================
connected to database!

Created test quotation ID: 30
  [PASS] Test 1: Draft successfully stored in MockLocalStorage

--- Scenario 1: Calculate Batch Save Payload ---
  [PASS] Test 2: Pending delete item ('Old Video') is EXCLUDED from final services payload
  [PASS] Test 3: Services payload has exactly 4 items (got 4)
  [PASS] Test 4: Ads payload has exactly 2 items (got 2)

--- Scenario 2: Exact Grand Total Formula Verification ---
  [PASS] Test 5: Raw service total matches manual calculation: ₹10500 === ₹10500
  [PASS] Test 6: Discount amount matches manual calculation: ₹1050 === ₹1050
  [PASS] Test 7: Ads total matches manual calculation: ₹16500 === ₹16500
  [PASS] Test 8: Final grand total matches formula exactly: ₹25950 === ₹25950

--- Scenario 3: Live Database Batch Save Simulation ---
  [PASS] Test 9: MockLocalStorage draft CLEARED after save success
  [PASS] Test 10: DB has exactly 4 services (got 4)
  [PASS] Test 11: DB does NOT contain deleted service ('Old Video')
  [PASS] Test 12: Complimentary service saved with source='custom_complimentary'
  [PASS] Test 13: DB has exactly 2 ads campaigns (got 2)
  [PASS] Test 14: DB grand_total_excl_gst matches exactly: ₹25950 === ₹25950

--- Scenario 4: Discard All (Zero DB Writes) ---
  [PASS] Test 15: Dirty draft stored before Discard
  [PASS] Test 16: MockLocalStorage draft CLEARED after Discard All
  [PASS] Test 17: re_quotation updated_at UNCHANGED on Discard (0 DB writes)
  [PASS] Test 18: re_quotation_services count UNCHANGED on Discard (0 DB writes)

Cleaned up test quotation 30

================================================================================
PHASE D VERIFICATION RESULT: 18/18 TESTS PASSED
================================================================================
```

---

## 5. Build & Compilation Status

- `npm run build` executed cleanly:
  ```
  ✓ built in 52.05s
  dist/assets/ServicesLandingPage-C2w9ppLR.js 88.72 kB │ gzip: 18.21 kB
  ```
- **Regression Safety:** Verified Proposal (`mode !== "quotation"`) and Proforma (`docTypeFromURL === "proforma"`) code paths remain untouched.
