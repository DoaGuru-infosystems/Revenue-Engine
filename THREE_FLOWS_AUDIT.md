# THREE FLOWS AUDIT: PROFORMA CREATION, PREVIOUS BALANCE & PAYMENT VALIDATION

**Audit Date:** 2026-10-26  
**Audited Systems:** Proposal-to-Proforma, Quotation-to-Proforma, Instant Proforma (Direct Proforma)  
**Objective:** End-to-end architectural and live runtime investigation of how Ad Budget and Service Amount separation, Previous Balance calculations, and Payment Recording validations perform across all three proforma generation channels.

---

## 1. Executive Summary & Flow Comparison

| # | Flow Name | Proforma Creation Endpoint & Controller | Creates `service_amount`? | Creates `ad_budget_amount`? | Previous Balance Logic Correct? (Service-Only) | Ad Budget Pending Blue Notice? | Payment Validation Works? (`ProformaManagerModal`) | Status |
|---|---|---|---|---|---|---|---|---|
| **1** | **Proposal-to-Proforma** | `POST /proforma`<br>([`re_proposalController.js`](file:///d:/AdDubey/Revenue%20Engine/server/revenue_engen_server/re_controller/re_proposalController.js#L807)) | **YES** (Calculated & Stored) | **YES** (Calculated & Stored) | **YES** (`getClientPreviousBalance` returns service-only pending) | **YES** (Blue banner present in [`GenerateProformaModal.jsx`](file:///d:/AdDubey/Revenue%20Engine/client/src/features/history/components/GenerateProformaModal.jsx#L1333)) | **YES** (Separated validation active) | **OK** |
| **2** | **Quotation-to-Proforma** | `POST /proforma`<br>([`re_proposalController.js`](file:///d:/AdDubey/Revenue%20Engine/server/revenue_engen_server/re_controller/re_proposalController.js#L807)) | **YES** (Calculated & Stored) | **YES** (Calculated & Stored) | **YES** (Reuses `getClientPreviousBalance` via `GenerateProformaModal`) | **YES** (Reuses `GenerateProformaModal`, blue banner visible) | **YES** (Separated validation active) | **OK** *(Minor schema note: `source_type` defaults to 'proposal' rather than 'quotation')* |
| **3** | **Instant Proforma** | `POST /saveDirectProforma`<br>([`re_controller.js`](file:///d:/AdDubey/Revenue%20Engine/server/revenue_engen_server/re_controller/re_controller.js#L4018)) | **YES** (Calculated & Stored) | **YES** (Calculated & Stored) | **YES** (`InstantProforma.jsx` fetches `getClientPreviousBalance`) | **NO / MISSING** (`InstantProforma.jsx` does not display blue notice for `totalAdBudgetPending`) | **YES** (Separated validation active) | **GAP FOUND** (Blue notice missing in UI) |

---

## SECTION A: Proforma-Creation Code Analysis

### 1. Flow 1: Proposal-to-Proforma

#### Frontend Entry Point:
* **File:** [`GenerateProformaModal.jsx`](file:///d:/AdDubey/Revenue%20Engine/client/src/features/history/components/GenerateProformaModal.jsx#L403-L477)
* When a proposal is selected (`selectedProposalForProforma`), the pricing items are classified into `dmServices` and `adsServices` using `classifyProformaServices(parsed)`.
* **Payload Dispatched:**
  ```javascript
  const payload = {
    proposal_id: selectedProposalForProforma.id,
    client_id: selectedProposalForProforma.client_id,
    base_amount: finalBaseAmount,
    gst_amount: finalGstAmount,
    total_amount: finalTotalAmount,
    service_amount: dmTotalAfterDiscount + prevBalToApply,
    ad_budget_amount: adsTotalBudget,
    is_gst: isGST ? 1 : 0,
    gst_rate: 18,
    duration_start_date: formData.duration_start_date,
    duration_end_date: formData.duration_end_date,
    assigned_team: formData.assigned_team || null,
    previous_balance_amount: prevBalToApply,
  };
  await axios.post(`${baseURL}/auth/api/re_calculator/proforma`, payload);
  ```

#### Backend Handler:
* **Function:** `exports.createProforma` in [`re_proposalController.js`](file:///d:/AdDubey/Revenue%20Engine/server/revenue_engen_server/re_controller/re_proposalController.js#L807-L1121)
* Extracts `service_amount` and `ad_budget_amount` from `req.body`. If not provided, it calculates `dmAfterDiscCalculated + prevBal` and `adsTotalForBreakdown`.
* Executes database insertion:
  ```sql
  INSERT INTO re_proposal_proforma 
  (proposal_id, quotation_id, client_id, txn_id, proforma_number, is_gst, gst_rate, base_amount, gst_amount, total_amount, 
   service_amount, ad_budget_amount,
   pricing_snapshot, ads_snapshot, notes_snapshot, terms_snapshot, remarks_snapshot, client_instructions_snapshot, created_by,
   duration_start_date, duration_end_date, discount_snapshot, previous_balance_amount, assigned_team)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ```
* **Status:** Both `service_amount` and `ad_budget_amount` are correctly populated and saved.

---

### 2. Flow 2: Quotation-to-Proforma

#### Frontend Entry Point:
* **File:** [`GenerateProformaModal.jsx`](file:///d:/AdDubey/Revenue%20Engine/client/src/features/history/components/GenerateProformaModal.jsx#L343-L401)
* **Architecture Confirmation:** Quotation flow **reuses `GenerateProformaModal.jsx`** (triggered with `sourceKind === "quotation"` from `QuotationHistoryPage.jsx`).
* Extracts `quotationServicesPreview` and filters:
  - `dmServices = quotationServicesPreview.filter(s => s.service_type !== "Ads Campaign")`
  - `adsServices = quotationServicesPreview.filter(s => s.service_type === "Ads Campaign")`
* **Payload Dispatched:**
  ```javascript
  const payload = {
    quotation_id: selectedQuotationForProforma.id,
    client_id: selectedQuotationForProforma.client_id,
    base_amount: finalBaseAmount,
    gst_amount: finalGstAmount,
    total_amount: finalBaseAmount + finalGstAmount + prevBalToApply,
    service_amount: dmTotalAfterDiscount + prevBalToApply,
    ad_budget_amount: adsTotalBudget,
    is_gst: isGST ? 1 : 0,
    gst_rate: 18,
    duration_start_date: formData.duration_start_date,
    duration_end_date: formData.duration_end_date,
    assigned_team: formData.assigned_team || null,
    previous_balance_amount: prevBalToApply,
  };
  await axios.post(`${baseURL}/auth/api/re_calculator/proforma`, payload);
  ```

#### Backend Handler:
* **Function:** Reuses `exports.createProforma` in [`re_proposalController.js`](file:///d:/AdDubey/Revenue%20Engine/server/revenue_engen_server/re_controller/re_proposalController.js#L899-L977).
* Validates `quotation.status` is approved (`quotationProformaStatuses`).
* Loads `re_quotation_services` and `re_quotation_ads` from database.
* Computes `finalServiceAmount` and `finalAdBudgetAmount` through the exact same shared logic.
* Sets `quotation_id` in `re_proposal_proforma` and updates `re_quotation SET status = 'proforma_generated'`.
* **Status:** Correctly saves `service_amount`, `ad_budget_amount`, and `previous_balance_amount`.

---

### 3. Flow 3: Instant Proforma (Direct Proforma)

#### Frontend Entry Point:
* **Files:**
  1. [`InstantProforma.jsx`](file:///d:/AdDubey/Revenue%20Engine/client/src/Components/InstantProforma.jsx): Selects client, fetches previous balance, sets billing duration, and navigates to `InvoiceServices.jsx` with `location.state = { proformaDraft: { ... } }`.
  2. [`InvoiceServices.jsx`](file:///d:/AdDubey/Revenue%20Engine/client/src/Components/InvoiceServices.jsx#L841-L865): User adds Graphic/SEO services and Ads Campaigns. On clicking Save Proforma:
* **Payload Dispatched:**
  ```javascript
  const proformaPayload = {
    ...
    base_amount: baseAmt,
    gst_amount: gstAmt,
    total_amount: totalAmt,
    service_amount: Number((discountedGraphic + previousBalanceAmount).toFixed(2)),
    ad_budget_amount: Number(adsBudgetTotal.toFixed(2)),
    is_gst: isGSTBill ? 1 : 0,
    gst_rate: gstRate,
    previous_balance_amount: previousBalanceAmount,
  };
  await axios.post(`${baseURL}/auth/api/re_calculator/saveDirectProforma`, proformaPayload);
  ```

#### Backend Handler:
* **Function:** `exports.saveDirectProforma` in [`re_controller.js`](file:///d:/AdDubey/Revenue%20Engine/server/revenue_engen_server/re_controller/re_controller.js#L4018-L4138)
* Receives `req.body.service_amount` and `req.body.ad_budget_amount`.
* If null/undefined, backend invokes `calculateProformaTotals(pItems, aItems, dObj, 0, is_gst, gst_rate)` from `re_proformaSyncHelper.js`:
  ```javascript
  if (finalServiceAmount === null) {
    finalServiceAmount = (computed.dmAfterAdjustment || 0) + prevBal;
  }
  if (finalAdBudgetAmount === null) {
    finalAdBudgetAmount = computed.adBudgetAmount || 0;
  }
  ```
* Inserts into `re_proposal_proforma`:
  ```sql
  INSERT INTO re_proposal_proforma (
    client_id, txn_id, proforma_number, is_gst, gst_rate, base_amount, gst_amount, total_amount, 
    service_amount, ad_budget_amount,
    created_at, pricing_snapshot, ads_snapshot, discount_snapshot, notes_snapshot, terms_snapshot,
    source_type, duration_start_date, duration_end_date, client_instructions_snapshot, previous_balance_amount
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual', ?, ?, ?, ?)
  ```
* **Status:** Fully separation-aware; correctly stores `service_amount`, `ad_budget_amount`, and `source_type='manual'`.

---

## SECTION B: Previous Balance Behavior Across All 3 Flows

### 4. Proposal-to-Proforma Flow
* **API Call:** `GET /auth/api/re_calculator/client-previous-balance/:clientId`
* **Controller:** `exports.getClientPreviousBalance` in [`re_proposalController.js`](file:///d:/AdDubey/Revenue%20Engine/server/revenue_engen_server/re_controller/re_proposalController.js#L1215-L1283)
* **Logic:**
  ```javascript
  const serviceAndGst = svcAmount + gstAmount;
  const servicePaidSoFar = Math.max(0, totalPaid - adBudgetRealized);
  servicePending = Math.max(0, serviceAndGst - servicePaidSoFar);
  adBudgetPending = Math.max(0, adBudgetTotal - adBudgetRealized);
  ```
* **Verification:** `totalPending` returned to frontend contains **STRICTLY SERVICE (+ GST) PENDING**. Ad budget is completely stripped out of `totalPending` and returned separately in `totalAdBudgetPending`.
* **Frontend Handling in `GenerateProformaModal.jsx`:**
  ```javascript
  const { totalPending, pendingProformas, totalAdBudgetPending } = res.data.data;
  const tot = Number(totalPending || 0);
  setAdBudgetPending(Number(totalAdBudgetPending || 0));
  setPreviousBalance({
    totalPending: tot,
    include: tot > 0,
    customAmount: tot > 0 ? String(tot) : "",
    pendingProformas: pendingProformas || [],
  });
  ```
* **Result:** **CORRECT.**

### 5. Quotation-to-Proforma Flow
* Because Quotation-to-Proforma uses [`GenerateProformaModal.jsx`](file:///d:/AdDubey/Revenue%20Engine/client/src/features/history/components/GenerateProformaModal.jsx#L68-L96), it invokes the **EXACT SAME `fetchPreviousBalance(clientId)`** function hitting `/auth/api/re_calculator/client-previous-balance/:clientId`.
* **Result:** **CORRECT.**

### 6. Instant Proforma Flow (`InstantProforma.jsx` -> `InvoiceServices.jsx`)
* **API Call in `InstantProforma.jsx`:**
  ```javascript
  const res = await axios.get(`${baseURL}/auth/api/re_calculator/client-previous-balance/${clientId}`);
  if (res.data?.status === "Success" && res.data?.data) {
    const { totalPending, pendingProformas } = res.data.data;
    const tot = Number(totalPending || 0);
    setPreviousBalance({
      totalPending: tot,
      include: tot > 0,
      customAmount: tot > 0 ? String(tot) : "",
      pendingProformas: pendingProformas || [],
      loading: false,
    });
  }
  ```
* Passes `previous_balance_amount: tot` into `proformaDraft`, which is received in `InvoiceServices.jsx` as:
  ```javascript
  const previousBalanceAmount = useMemo(() => Number(clientContext.previous_balance_amount || 0), [clientContext.previous_balance_amount]);
  ```
* And saved into `re_proposal_proforma` as:
  ```javascript
  service_amount: Number((discountedGraphic + previousBalanceAmount).toFixed(2)),
  previous_balance_amount: previousBalanceAmount
  ```
* **Verification:** Because `getClientPreviousBalance` calculates `totalPending` as Service-only on the backend, the Previous Balance value used in Instant Proforma is **mathematically correct (Service-only)**.

### 7. Ad Budget Pending Blue Notice Indicator Investigation
* **In Proposal Flow (`GenerateProformaModal.jsx`):**
  - **Present:** Displays blue notification banner:
    ```jsx
    {adBudgetPending > 0 && (
      <div style={{ background: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.3)" }}>
        <span>Client ka ₹{adBudgetPending.toLocaleString("en-IN")} Ad Budget purane proforma(s) se pending hai (is naye proforma me shamil nahi hoga)</span>
      </div>
    )}
    ```
* **In Quotation Flow (`GenerateProformaModal.jsx`):**
  - **Present:** Since Quotation uses `GenerateProformaModal.jsx`, this identical blue banner is displayed automatically whenever the client has unpaid Ad Budget from past proformas.
* **In Instant Proforma Flow (`InstantProforma.jsx` / `InvoiceServices.jsx`):**
  - **MISSING:** In [`InstantProforma.jsx`](file:///d:/AdDubey/Revenue%20Engine/client/src/Components/InstantProforma.jsx#L121), the response destructuring only extracts:
    `const { totalPending, pendingProformas } = res.data.data;`
    It **does not extract `totalAdBudgetPending`**, does not set state for it, and **no blue info box exists** in `InstantProforma.jsx` or `InvoiceServices.jsx`. While the math is safe (ad budget is not added to previous balance), the user is not visually informed.

---

## SECTION C: Payment Recording & Live Runtime Verification

### 8. Modal Confirmation
* **Question:** Is [`ProformaManagerModal.jsx`](file:///d:/AdDubey/Revenue%20Engine/client/src/features/history/components/ProformaManagerModal.jsx) the only modal used across all proforma flows?
* **Answer:** **YES, 100% UNIFIED.**
  All history views (`ClientServiceHistoryPage.jsx`, `QuotationHistoryPage.jsx`, `ProformaHistoryPage.jsx`, and `HistoryHubPage.jsx`) route the "Record Payment" action to `<ProformaManagerModal>`. There is no duplicate or alternative payment recording UI in the application.

### 9. `source_type` Verification
* **Question:** Does `source_type` affect payment validation?
* **Answer:** **NO.**
  In both [`re_proposalController.js`](file:///d:/AdDubey/Revenue%20Engine/server/revenue_engen_server/re_controller/re_proposalController.js#L1616) (`recordProposalPayment`) and [`ProformaManagerModal.jsx`](file:///d:/AdDubey/Revenue%20Engine/client/src/features/history/components/ProformaManagerModal.jsx#L412), the validation logic queries the proforma's `service_amount`, `gst_amount`, `ad_budget_amount`, and approved payments. It **never branches on `source_type`**.

---

### 10. Live Test 1: Quotation-to-Proforma Flow

Conducted against live Node.js server (`http://localhost:5000`) and live MySQL database using JWT token:

#### Setup:
* Created Quotation #20: Service ₹40,000, 18% GST ₹7,200, Ad Budget ₹10,000. Total = ₹57,200.
* Called `POST /auth/api/re_calculator/proforma` with `{ quotation_id: 20, client_id: 277, ... }`.
* **Proforma Created:** `PROF-18` (id=34) with:
  - `service_amount`: ₹40,000
  - `gst_amount`: ₹7,200 (Service with GST = ₹47,200)
  - `ad_budget_amount`: ₹10,000
  - `quotation_id`: 20, `proposal_id`: null
* Recorded existing approved service payment of ₹35,000:
  - Remaining Service Pending: ₹47,200 - ₹35,000 = **₹12,200**
  - Remaining Ad Budget Pending: **₹10,000**

#### Scenario A: `amount=15000, has_ad_budget=false` (Checkbox unchecked)
* Attempted to record ₹15,000 as pure service (exceeds ₹12,200 service pending).
* **Live HTTP Call:** `POST /auth/api/re_calculator/proposal-payment`
* **Response Status:** `400 Bad Request`
* **Response Body:**
  ```json
  {
    "status": "Failure",
    "message": "Service amount (₹15,000) cannot exceed pending Service amount of ₹12,200. If part of this payment is for Ad Budget, please check 'Has Ad Budget' and specify the amount."
  }
  ```
* **Result:** **PASSED (Correctly Rejected).**

#### Scenario B: `amount=15000, has_ad_budget=true, google_budget=5000`
* Service portion = ₹15,000 - ₹5,000 = ₹10,000 (<= ₹12,200 pending service).
* Ad budget portion = ₹5,000 (<= ₹10,000 pending ad budget).
* **Live HTTP Call:** `POST /auth/api/re_calculator/proposal-payment`
* **Response Status:** `200 OK`
* **Response Body:**
  ```json
  {
    "status": "Success",
    "txn_id": "1793001625604",
    "message": "Payment recorded successfully and sent for approval."
  }
  ```
* **Database Verification (`re_proposal_payment_records`):**
  - `amount`: ₹15,000
  - `realized_service_amount`: **₹10,000**
  - `realized_ad_budget`: **₹5,000**
  - `realized_google_budget`: **₹5,000**
* **Result:** **PASSED (Correctly Accepted with Exact Split).**

---

### 11. Live Test 2: Instant Proforma Flow (`saveDirectProforma`)

#### Setup:
* Called `POST /auth/api/re_calculator/saveDirectProforma` with:
  - Service: Monthly SEO ₹30,000 (18% GST = ₹5,400 -> Service with GST = ₹35,400)
  - Ad Budget: Meta Ads ₹8,000
  - Total: ₹43,400
* **Proforma Created:** `PROF-19` (id=35) with:
  - `service_amount`: ₹30,000
  - `gst_amount`: ₹5,400
  - `ad_budget_amount`: ₹8,000
  - `source_type`: 'manual'
* Recorded existing approved service payment of ₹25,000:
  - Remaining Service Pending: ₹35,400 - ₹25,000 = **₹10,400**
  - Remaining Ad Budget Pending: **₹8,000**

#### Scenario A: `amount=15000, has_ad_budget=false` (Checkbox unchecked)
* Attempted to record ₹15,000 as pure service (exceeds ₹10,400 service pending).
* **Live HTTP Call:** `POST /auth/api/re_calculator/proposal-payment`
* **Response Status:** `400 Bad Request`
* **Response Body:**
  ```json
  {
    "status": "Failure",
    "message": "Service amount (₹15,000) cannot exceed pending Service amount of ₹10,400. If part of this payment is for Ad Budget, please check 'Has Ad Budget' and specify the amount."
  }
  ```
* **Result:** **PASSED (Correctly Rejected).**

#### Scenario B: `amount=15000, has_ad_budget=true, meta_budget=6000`
* Service portion = ₹15,000 - ₹6,000 = ₹9,000 (<= ₹10,400 pending service).
* Ad budget portion = ₹6,000 (<= ₹8,000 pending ad budget).
* **Live HTTP Call:** `POST /auth/api/re_calculator/proposal-payment`
* **Response Status:** `200 OK`
* **Response Body:**
  ```json
  {
    "status": "Success",
    "txn_id": "1793001633451",
    "message": "Payment recorded successfully and sent for approval."
  }
  ```
* **Database Verification (`re_proposal_payment_records`):**
  - `amount`: ₹15,000
  - `realized_service_amount`: **₹9,000**
  - `realized_ad_budget`: **₹6,000**
  - `realized_meta_budget`: **₹6,000**
* **Result:** **PASSED (Correctly Accepted with Exact Split).**

*(All test data from both live tests were cleanly removed from the database).*

---

## SECTION D: Identified Gaps & Architectural Discrepancies

Per instructions, **NO CODE CHANGES HAVE BEEN MADE**. The following are gaps observed during this audit:

### GAP 1 (UI Visibility): `totalAdBudgetPending` Blue Notice Missing in Instant Proforma
* **Location:** [`InstantProforma.jsx:L114-L135`](file:///d:/AdDubey/Revenue%20Engine/client/src/Components/InstantProforma.jsx#L114-L135) and [`InvoiceServices.jsx`](file:///d:/AdDubey/Revenue%20Engine/client/src/Components/InvoiceServices.jsx)
* **Description:** When generating an Instant Proforma for a client who has unpaid Ad Budget from previous proformas, `InstantProforma.jsx` calls `client-previous-balance/:clientId` but ignores `totalAdBudgetPending`.
* **Impact:** The math is 100% correct (the previous balance does not compound ad budget), but the admin is not visually notified that the client has pending Ad Budget from prior proformas, unlike in `GenerateProformaModal.jsx` where the informative blue banner is shown.

### GAP 2 (Database Schema Metadata): `source_type` on Quotation Proformas
* **Location:** [`re_proposalController.js:L1089`](file:///d:/AdDubey/Revenue%20Engine/server/revenue_engen_server/re_controller/re_proposalController.js#L1089)
* **Description:** In `createProforma`, the SQL `INSERT INTO re_proposal_proforma` does not explicitly pass a value for `source_type`. By MySQL table default, it defaults to `'proposal'`.
* **Impact:** Even though `quotation_id` is properly set (and `proposal_id` is null), `source_type` in the database column is stored as `'proposal'` instead of `'quotation'`. Payment recording and calculations are not impacted, but downstream database queries filtering strictly on `source_type = 'quotation'` would find 0 rows.

---

## Conclusion

The core financial architecture:
1. **Service Amount & Ad Budget separation** is properly saved across all three creation flows (`Proposal`, `Quotation`, and `Instant`).
2. **Previous Balance** correctly carries forward only the Service Pending amount across all three flows.
3. **Payment Recording Validation** in `ProformaManagerModal.jsx` and backend `recordProposalPayment` functions with 100% precision across proformas created by all three flows.
4. Only two minor non-breaking gaps exist (UI notice in Instant Proforma and `source_type` column default in Quotation proformas).
