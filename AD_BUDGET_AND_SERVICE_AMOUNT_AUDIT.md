# Complete Audit: Ad Budget vs Service Amount Implementation

> **Purpose**: This technical audit document details the exact current implementation of **Ad Budget** and **Service Amount** in the Revenue Engine codebase. It contains exact database schemas, file paths, line numbers, SQL queries, frontend JSX, and backend controllers for review and solution design.

---

## 1. DATABASE STRUCTURE

### 1.1 Table: `re_proposal_proforma`
* **File Definition**: [siarasys_dmcalculator.sql#L11338-L11374](file:///d:/AdDubey/Revenue%20Engine/siarasys_dmcalculator.sql#L11338-L11374)
* **Migrations**: [server/sql/2026-10-17-add-previous-balance-columns.sql#L5-L8](file:///d:/AdDubey/Revenue%20Engine/server/sql/2026-10-17-add-previous-balance-columns.sql#L5-L8)

```sql
CREATE TABLE `re_proposal_proforma` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `proposal_id` int(11) DEFAULT NULL,
  `quotation_id` int(11) DEFAULT NULL,               -- Added via run_quotation_migration.js
  `client_id` int(11) NOT NULL,
  `txn_id` varchar(255) DEFAULT NULL,
  `is_gst` tinyint(1) DEFAULT 0,
  `gst_rate` decimal(5,2) DEFAULT 18.00,
  `base_amount` decimal(12,2) DEFAULT 0.00,          -- Combines (Services After Discount) + (Ads Total Budget)
  `gst_amount` decimal(12,2) DEFAULT 0.00,           -- 18% of Services After Discount (Ads are excluded from GST)
  `total_amount` decimal(12,2) DEFAULT 0.00,         -- Base Amount + GST Amount + Previous Balance
  `status` enum('generated','sent','payment_awaited','payment_received','partially_paid','paid','carried_forward','invoiced','draft') DEFAULT 'generated',
  `pdf_path` varchar(500) DEFAULT NULL,
  `created_by` varchar(200) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `pricing_snapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'JSON array of service line items',
  `ads_snapshot` longtext DEFAULT NULL COMMENT 'JSON array of Ads Campaign budget items',
  `notes_snapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `terms_snapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `remarks_snapshot` text DEFAULT NULL,
  `client_instructions_snapshot` text DEFAULT NULL,
  `source_type` enum('proposal','manual','quotation') DEFAULT 'proposal',
  `source_id` int(11) DEFAULT NULL,
  `public_token_hash` varchar(64) DEFAULT NULL,
  `public_token_expires` datetime DEFAULT NULL,
  `duration_start_date` date DEFAULT NULL,
  `duration_end_date` date DEFAULT NULL,
  `discount_snapshot` text DEFAULT NULL,
  `proforma_number` varchar(50) DEFAULT NULL,
  `payment_status` varchar(50) DEFAULT NULL,         -- 'pending', 'partial', 'fully-paid'
  `adjustment_amount` decimal(10,2) DEFAULT 0.00,
  `adjustment_snapshot` text DEFAULT NULL,
  `assigned_team` varchar(255) DEFAULT NULL,
  `meeting_status` enum('pending','done','rescheduled','cancelled') DEFAULT 'pending',
  `meeting_rescheduled_date` date DEFAULT NULL,
  `last_meeting_reminder_sent_at` datetime DEFAULT NULL,
  `previous_balance_amount` decimal(10,2) DEFAULT 0.00,  -- Added 2026-10-17
  `is_carried_forward` tinyint(1) DEFAULT 0,             -- Added 2026-10-17
  `carried_into_proforma_id` int(11) DEFAULT NULL,       -- Added 2026-10-17
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

#### Key Findings on `re_proposal_proforma`:
1. **NO `service_amount` column**: Services total is not stored as a dedicated scalar column. It only exists inside the JSON array `pricing_snapshot`.
2. **NO `ad_budget_amount` column**: Ad budget is not stored as a dedicated scalar column. It only exists inside the JSON array `ads_snapshot`.
3. **NO `total_paid` column**: Payment totals are not maintained as a column on this table. They are dynamically summed from `re_proposal_payment_records`.
4. **`total_amount` combines EVERYTHING**:
   ```javascript
   // server/revenue_engen_server/re_controller/re_proposalController.js:1037-1040
   finalBaseAmount = dmAfterDisc + adsTotal;
   finalGstAmount = is_gst ? Number(((dmAfterDisc * rate) / 100).toFixed(2)) : 0;
   finalTotalAmount = finalBaseAmount + finalGstAmount + prevBal;
   ```
   Therefore, `total_amount` in `re_proposal_proforma` merges Service Amount, GST, Ad Budget, and Previous Balance into one single blended number.

---

### 1.2 Table: `re_proposal_payment_records`
* **File Definition**: [siarasys_dmcalculator.sql#L11294-L11318](file:///d:/AdDubey/Revenue%20Engine/siarasys_dmcalculator.sql#L11294-L11318)

```sql
CREATE TABLE `re_proposal_payment_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `proforma_id` int(11) NOT NULL,
  `proposal_id` int(11) DEFAULT NULL,
  `client_id` int(11) NOT NULL,
  `amount` decimal(12,2) NOT NULL,                    -- Total gross payment received in this transaction
  `is_gst` tinyint(1) DEFAULT 0,
  `tds_applicable` tinyint(1) DEFAULT 0,
  `tds_percentage` decimal(6,2) DEFAULT 0.00,
  `tds_amount` decimal(12,2) DEFAULT 0.00,
  `final_amount` decimal(12,2) NOT NULL,               -- amount - tds_amount
  `payment_date` date NOT NULL,
  `payment_mode` varchar(50) DEFAULT NULL,             -- 'UPI', 'Bank Transfer', 'Cash', 'Cheque'
  `transaction_reference` varchar(255) DEFAULT NULL,
  `status` enum('pending_approval','approved','rejected') DEFAULT 'pending_approval',
  `approved_by` varchar(200) DEFAULT NULL,
  `remark` text DEFAULT NULL,
  `created_by` varchar(200) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `notes` text DEFAULT NULL,
  `txn_id` varchar(255) DEFAULT NULL,
  `realized_ad_budget` decimal(15,2) DEFAULT 0.00,     -- Portion of 'amount' allocated to Ad Budget
  `realized_google_budget` decimal(15,2) DEFAULT 0.00, -- Google Ad portion
  `realized_meta_budget` decimal(15,2) DEFAULT 0.00,   -- Meta Ad portion
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

#### Key Findings on `re_proposal_payment_records`:
1. **`amount`**: Holds the total payment collected from the client.
2. **`realized_ad_budget`**: Holds the portion of `amount` that is declared as ad budget.
3. **NO `realized_service_amount` column**: Service amount received is **not explicitly stored**. It is assumed to be `amount - realized_ad_budget`.
4. If a payment is recorded with `realized_ad_budget = 0` (e.g. checkbox unchecked), the entire `amount` is treated as Service Revenue.

---

## 2. PREVIOUS BALANCE CALCULATION

### 2.1 Backend Function: `getClientPreviousBalance`
* **File**: [server/revenue_engen_server/re_controller/re_proposalController.js#L1168-L1217](file:///d:/AdDubey/Revenue%20Engine/server/revenue_engen_server/re_controller/re_proposalController.js#L1168-L1217)

```javascript
exports.getClientPreviousBalance = async (req, res) => {
  try {
    const { clientId } = req.params;
    if (!clientId) {
      return res.status(400).json({ status: "Failure", message: "clientId is required" });
    }
    await healOrphanedCarriedForwardProformas(clientId);
    const q = `
      SELECT p.id, p.proforma_number, p.client_id, p.total_amount, p.base_amount, p.is_gst, p.status, p.created_at,
             COALESCE((SELECT SUM(amount) FROM re_proposal_payment_records WHERE proforma_id = p.id AND status = 'approved'), 0) AS total_paid
      FROM re_proposal_proforma p
      WHERE p.client_id = ? 
        AND (p.is_carried_forward IS NULL OR p.is_carried_forward = 0)
        AND p.status NOT IN ('carried_forward', 'cancelled', 'superseded', 'draft')
      ORDER BY p.id ASC
    `;
    const rows = await runQuery(q, [clientId]);
    let totalPending = 0;
    const pendingProformas = [];

    rows.forEach(r => {
      const tot = Number(r.total_amount || 0);
      const paid = Number(r.total_paid || 0);
      const pending = Math.max(0, tot - paid);
      if (pending > 0.05) {
        totalPending += pending;
        pendingProformas.push({
          id: r.id,
          proforma_number: r.proforma_number,
          total_amount: tot,
          total_paid: paid,
          pending: Math.round(pending * 100) / 100,
          is_gst: r.is_gst,
          created_at: r.created_at,
        });
      }
    });

    res.status(200).json({
      status: "Success",
      data: {
        totalPending: Math.round(totalPending * 100) / 100,
        pendingProformas,
      }
    });
  } catch (error) {
    console.error("getClientPreviousBalance error:", error);
    res.status(500).json({ status: "Failure", message: "Server error" });
  }
};
```

#### Answer to Question 2.1:
> **Question**: "Ye function `total_amount - total_paid` ka ek hi combined number nikalta hai, ya service aur ad budget ka pending amount alag-alag track karta hai?"
> 
> **Answer**: **Yeh ek hi combined number nikalta hai (`tot - paid`).**
> Isme Service Pending aur Ad Budget Pending ka **koi separation nahi hai**.
> Agar proforma ₹7,000 ka tha (₹5,000 Service + ₹2,000 Ads) aur client ne ₹5,000 Service ke de diye, toh formula:
> `7000 - 5000 = 2000`
> Yeh ₹2,000 ko seedha "Pending" declare karta hai. System ko yeh pata hi nahi rehta ki yeh pending paisa Service ka hai ya Ads ka.

---

### 2.2 Frontend: `GenerateProformaModal.jsx` (Previous Balance Modal Logic)
* **File**: [client/src/features/history/components/GenerateProformaModal.jsx](file:///d:/AdDubey/Revenue%20Engine/client/src/features/history/components/GenerateProformaModal.jsx)

#### State & API Fetch (Lines 59–94):
```javascript
  const [previousBalance, setPreviousBalance] = useState({
    totalPending: 0,
    include: true,
    customAmount: "",
    pendingProformas: [],
    loading: false,
  });

  const fetchPreviousBalance = async (clientId) => {
    if (!clientId) return;
    try {
      setPreviousBalance((prev) => ({ ...prev, loading: true }));
      const res = await axios.get(
        `${baseURL}/auth/api/re_calculator/client-previous-balance/${clientId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.data.status === "Success" && res.data.data) {
        const { totalPending, pendingProformas } = res.data.data;
        const tot = Number(totalPending || 0);
        setPreviousBalance({
          totalPending: tot,
          include: tot > 0,
          customAmount: tot > 0 ? String(tot) : "",
          pendingProformas: pendingProformas || [],
          loading: false,
        });
      } else {
        setPreviousBalance((prev) => ({ ...prev, loading: false }));
      }
    } catch (e) {
      console.error("Error fetching previous balance:", e);
      setPreviousBalance((prev) => ({ ...prev, loading: false }));
    }
  };
```

#### JSX Display (Lines 1327–1383):
```jsx
{/* Previous Balance Section (Only visible if client has outstanding balance > 0) */}
{previousBalance.totalPending > 0 && (
  <div
    style={{
      padding: "12px 14px",
      borderRadius: "10px",
      background: theme === "dark" ? "rgba(245, 158, 11, 0.08)" : "#fffbeb",
      border: theme === "dark" ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid #fde68a",
      marginBottom: 16,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", margin: 0 }}>
        <input
          type="checkbox"
          checked={previousBalance.include}
          onChange={(e) => setPreviousBalance(prev => ({ ...prev, include: e.target.checked }))}
          style={{ width: 16, height: 16, accentColor: "#f59e0b", cursor: "pointer" }}
        />
        <span style={{ fontSize: 13, fontWeight: 700, color: theme === "dark" ? "#fbbf24" : "#b45309" }}>
          Include Previous Balance 
        </span>
      </label>
      <span style={{ fontSize: 14, fontWeight: 800, color: theme === "dark" ? "#fcd34d" : "#92400e" }}>
        Total Pending: ₹{Number(previousBalance.totalPending).toLocaleString("en-IN")}
      </span>
    </div>

    {previousBalance.include && (
      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: theme === "dark" ? "#d1d5db" : "#4b5563" }}>
          Carry Forward Amount (₹):
        </span>
        <input
          type="number"
          value={previousBalance.customAmount}
          onChange={(e) => setPreviousBalance(prev => ({ ...prev, customAmount: e.target.value }))}
          style={{
            width: 130,
            padding: "4px 8px",
            fontSize: 13,
            borderRadius: 6,
            border: "1px solid rgba(245, 158, 11, 0.4)",
            background: theme === "dark" ? "#1f2937" : "#ffffff",
            color: theme === "dark" ? "#ffffff" : "#111827",
            fontWeight: 600,
          }}
        />
        {previousBalance.pendingProformas.length > 0 && (
          <span style={{ fontSize: 11, color: theme === "dark" ? "#9ca3af" : "#6b7280" }}>
            From {previousBalance.pendingProformas.map(p => `${p.proforma_number || '#' + p.id} (₹${Number(p.pending).toLocaleString("en-IN")})`).join(", ")}
          </span>
        )}
      </div>
    )}
  </div>
)}
```

#### Saving to Backend (Lines 365–377):
```javascript
const prevBalToApply = previousBalance.include
  ? (Number(previousBalance.customAmount) || Number(previousBalance.totalPending) || 0)
  : 0;

const payload = {
  quotation_id: selectedQuotationForProforma.id,
  client_id: selectedQuotationForProforma.client_id,
  base_amount: finalBaseAmount,
  gst_amount: finalGstAmount,
  total_amount: finalBaseAmount + finalGstAmount + prevBalToApply,
  is_gst: isGST ? 1 : 0,
  gst_rate: 18,
  duration_start_date: formData.duration_start_date,
  duration_end_date: formData.duration_end_date,
  assigned_team: formData.assigned_team || null,
  previous_balance_amount: prevBalToApply,
};
```

---

## 3. PAYMENT RECORDING FLOW

### 3.1 Frontend: `ProformaManagerModal.jsx`
* **File**: [client/src/features/history/components/ProformaManagerModal.jsx](file:///d:/AdDubey/Revenue%20Engine/client/src/features/history/components/ProformaManagerModal.jsx)

#### Initial Form State (Lines 29–42):
```javascript
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    payment_date: moment().format("YYYY-MM-DD"),
    payment_mode: "UPI",
    transaction_reference: "",
    remark: "",
    tds_applicable: false,
    tds_percentage: 2,
    tds_amount: 0,
    final_amount: 0,
    has_ad_budget: false,
    realized_ad_budget: "",
    realized_google_budget: "",
    realized_meta_budget: "",
  });
```

#### JSX for "Has Ad Budget" Checkbox & Input (Lines 1028–1095):
```jsx
{ (hasGoogleAd || hasMetaAd) && (
  <div className="bg-gray-800 p-3.5 sm:p-4 rounded-xl border border-gray-700">
    <div className="flex items-center justify-between">
      <div>
        <span className="text-sm font-semibold text-gray-300">Ad Budget (This Payment)?</span>
        { Number(paymentForm.amount) > 0 && (
          <p className="text-[11px] text-gray-400 mt-0.5">
            Max allowable ad budget: <span className="text-yellow-400 font-semibold">₹{ Math.max(0, Number(paymentForm.amount) - 1).toLocaleString() }</span> (Min ₹1 reserved for service)
          </p>
        ) }
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={ paymentForm.has_ad_budget } onChange={ e => {
          setPaymentForm({
            ...paymentForm,
            has_ad_budget: e.target.checked,
            realized_google_budget: e.target.checked && hasGoogleAd ? paymentForm.realized_google_budget : "",
            realized_meta_budget: e.target.checked && hasMetaAd ? paymentForm.realized_meta_budget : ""
          })
        } } className="w-4 h-4 accent-yellow-500" />
        <span className="text-sm text-gray-400">Yes</span>
      </label>
    </div>

    { paymentForm.has_ad_budget && (() => {
      const activeGoogle = hasGoogleAd ? Number(paymentForm.realized_google_budget || 0) : 0;
      const activeMeta = hasMetaAd ? Number(paymentForm.realized_meta_budget || 0) : 0;
      const currentTotalAd = activeGoogle + activeMeta;
      const maxAllowed = Math.max(0, Number(paymentForm.amount || 0) - 1);

      return (
        <div className={ `grid grid-cols-1 ${hasGoogleAd && hasMetaAd ? 'md:grid-cols-2' : ''} gap-3 sm:gap-4 pt-2 border-t border-gray-700 mt-2` }>
          { hasGoogleAd && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                GOOGLE BUDGET (REMAINING: ₹{ remainingGoogleAdBudget })
              </label>
              <input type="number" step="0.01" value={ paymentForm.realized_google_budget } onChange={ e => {
                setPaymentForm({ ...paymentForm, realized_google_budget: e.target.value });
              } } className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-white focus:border-yellow-500 outline-none text-sm" placeholder="0.00" />
              { Number(paymentForm.realized_google_budget) > remainingGoogleAdBudget && (
                <p className="text-red-500 text-xs mt-1">Cannot exceed remaining Google budget ₹{ remainingGoogleAdBudget }</p>
              ) }
            </div>
          ) }
          { hasMetaAd && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                META BUDGET (REMAINING: ₹{ remainingMetaAdBudget })
              </label>
              <input type="number" step="0.01" value={ paymentForm.realized_meta_budget } onChange={ e => {
                setPaymentForm({ ...paymentForm, realized_meta_budget: e.target.value });
              } } className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-white focus:border-yellow-500 outline-none text-sm" placeholder="0.00" />
              { Number(paymentForm.realized_meta_budget) > remainingMetaAdBudget && (
                <p className="text-red-500 text-xs mt-1">Cannot exceed remaining Meta budget ₹{ remainingMetaAdBudget }</p>
              ) }
            </div>
          ) }
          { currentTotalAd > maxAllowed && (
            <div className="col-span-full text-red-400 text-xs font-semibold bg-red-900/30 p-2.5 rounded-lg border border-red-800">
              Total Ad Budget (₹{ currentTotalAd.toLocaleString() }) cannot exceed ₹{ maxAllowed.toLocaleString() }. Minimum ₹1 must be reserved for service amount.
            </div>
          ) }
        </div>
      );
    })() }
  </div>
) }
```

#### Frontend Payload Construction (Lines 425–474):
```javascript
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedProforma) return;

    const proformaPayments = payments.filter(p => p.proforma_id === selectedProforma.id && p.status === 'approved');
    const totalReceived = proformaPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const pendingAmount = Number(selectedProforma.total_amount) - totalReceived;
    
    if (Number(paymentForm.amount) > pendingAmount) {
      Swal.fire('Validation Error', `Amount cannot exceed the pending balance of ₹${pendingAmount.toLocaleString()}`, 'warning');
      return;
    }

    const activeGoogleBudget = hasGoogleAd ? Number(paymentForm.realized_google_budget || 0) : 0;
    const activeMetaBudget = hasMetaAd ? Number(paymentForm.realized_meta_budget || 0) : 0;
    const totalAdBudgetThisPayment = paymentForm.has_ad_budget
      ? activeGoogleBudget + activeMetaBudget
      : 0;
    const maxAllowedAdBudget = Math.max(0, Number(paymentForm.amount || 0) - 1);

    if (paymentForm.has_ad_budget && totalAdBudgetThisPayment > maxAllowedAdBudget) {
      Swal.fire(
        'Validation Error',
        `Total Ad Budget (₹${totalAdBudgetThisPayment.toLocaleString()}) cannot exceed ₹${maxAllowedAdBudget.toLocaleString()}. Minimum ₹1 must be reserved for service amount.`,
        'warning'
      );
      return;
    }

    setSavingPayment(true);

    try {
      const payload = {
        proforma_id: selectedProforma.id,
        proposal_id: selectedProforma.proposal_id || null,
        client_id: selectedProforma.client_id || proposal?.client_id || proposal?.clientId,
        ...paymentForm,
        realized_ad_budget: paymentForm.has_ad_budget ? totalAdBudgetThisPayment : 0,
        realized_google_budget: paymentForm.has_ad_budget && hasGoogleAd ? activeGoogleBudget : 0,
        realized_meta_budget: paymentForm.has_ad_budget && hasMetaAd ? activeMetaBudget : 0,
        created_by: currentUser?.name || "System"
      };

      const { data } = await axios.post(`${baseURL}/auth/api/re_calculator/proposal-payment`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
```

---

### 3.2 Backend: `recordPayment` Handler
* **File**: [server/revenue_engen_server/re_controller/re_proposalController.js#L1548-L1637](file:///d:/AdDubey/Revenue%20Engine/server/revenue_engen_server/re_controller/re_proposalController.js#L1548-L1637)

```javascript
    // Validate that the payment amount does not exceed the pending amount
    const existingPayments = await runQuery(
      `SELECT SUM(amount) as totalReceived FROM re_proposal_payment_records WHERE proforma_id = ? AND status = 'approved'`,
      [proforma_id]
    );
    const totalReceived = Number(existingPayments[0]?.totalReceived) || 0;
    const pendingAmount = Number(proforma.total_amount) - totalReceived;
    
    if (Number(amount) > pendingAmount) {
      return res.status(400).json({ 
        status: "Failure", 
        message: `Payment amount (₹${Number(amount).toLocaleString()}) cannot exceed the pending amount (₹${pendingAmount.toLocaleString()})` 
      });
    }

    // Validate that total ad budget realized leaves at least 1 rupee for service amount
    const totalAdBudget = (Number(realized_google_budget) || 0) + (Number(realized_meta_budget) || 0);
    if (totalAdBudget > 0) {
      const maxAllowedAdBudget = Math.max(0, Number(amount) - 1);
      if (totalAdBudget > maxAllowedAdBudget) {
        return res.status(400).json({
          status: "Failure",
          message: `Total realized ad budget (₹${totalAdBudget.toLocaleString()}) cannot exceed ₹${maxAllowedAdBudget.toLocaleString()}. Minimum ₹1 must be reserved for service amount.`
        });
      }
    }

    // Insert into re_proposal_payment_records
    const paymentQ = `
      INSERT INTO re_proposal_payment_records 
      (proforma_id, proposal_id, client_id, amount, is_gst, tds_applicable, tds_percentage, tds_amount, final_amount, payment_date, payment_mode, transaction_reference, remark, created_by, txn_id, status, realized_ad_budget, realized_google_budget, realized_meta_budget)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_approval', ?, ?, ?)
    `;
    const insertResult = await runQuery(paymentQ, [
      proforma_id,
      proposal_id,
      client_id,
      amount,
      is_gst ? 1 : 0,
      tds_applicable ? 1 : 0,
      tds_percentage || 0,
      tds_amount || 0,
      final_amount,
      payment_date,
      payment_mode,
      transaction_reference,
      remark,
      created_by || "System",
      invoice_txn_id,
      realized_ad_budget || 0,
      realized_google_budget || 0,
      realized_meta_budget || 0,
    ]);
```

---

## 4. CURRENT RULE: "SERVICE AMOUNT CANNOT BE ₹0 (MIN ₹1 RESERVED FOR SERVICE)"

### Exact Code & Locations:

#### 1. Backend API Guard
* **File**: [server/revenue_engen_server/re_controller/re_proposalController.js#L1563-L1573](file:///d:/AdDubey/Revenue%20Engine/server/revenue_engen_server/re_controller/re_proposalController.js#L1563-L1573)
```javascript
    // Validate that total ad budget realized leaves at least 1 rupee for service amount
    const totalAdBudget = (Number(realized_google_budget) || 0) + (Number(realized_meta_budget) || 0);
    if (totalAdBudget > 0) {
      const maxAllowedAdBudget = Math.max(0, Number(amount) - 1);
      if (totalAdBudget > maxAllowedAdBudget) {
        return res.status(400).json({
          status: "Failure",
          message: `Total realized ad budget (₹${totalAdBudget.toLocaleString()}) cannot exceed ₹${maxAllowedAdBudget.toLocaleString()}. Minimum ₹1 must be reserved for service amount.`
        });
      }
    }
```

#### 2. Frontend Submit Validation (`handleRecordPayment`)
* **File**: [client/src/features/history/components/ProformaManagerModal.jsx#L427-L439](file:///d:/AdDubey/Revenue%20Engine/client/src/features/history/components/ProformaManagerModal.jsx#L427-L439)
```javascript
    const activeGoogleBudget = hasGoogleAd ? Number(paymentForm.realized_google_budget || 0) : 0;
    const activeMetaBudget = hasMetaAd ? Number(paymentForm.realized_meta_budget || 0) : 0;
    const totalAdBudgetThisPayment = paymentForm.has_ad_budget
      ? activeGoogleBudget + activeMetaBudget
      : 0;
    const maxAllowedAdBudget = Math.max(0, Number(paymentForm.amount || 0) - 1);

    if (paymentForm.has_ad_budget && totalAdBudgetThisPayment > maxAllowedAdBudget) {
      Swal.fire(
        'Validation Error',
        `Total Ad Budget (₹${totalAdBudgetThisPayment.toLocaleString()}) cannot exceed ₹${maxAllowedAdBudget.toLocaleString()}. Minimum ₹1 must be reserved for service amount.`,
        'warning'
      );
      return;
    }
```

#### 3. Frontend JSX Form Helper Text & Real-time Warning
* **File**: [client/src/features/history/components/ProformaManagerModal.jsx#L1034-L1037](file:///d:/AdDubey/Revenue%20Engine/client/src/features/history/components/ProformaManagerModal.jsx#L1034-L1037)
```jsx
{ Number(paymentForm.amount) > 0 && (
  <p className="text-[11px] text-gray-400 mt-0.5">
    Max allowable ad budget: <span className="text-yellow-400 font-semibold">₹{ Math.max(0, Number(paymentForm.amount) - 1).toLocaleString() }</span> (Min ₹1 reserved for service)
  </p>
) }
```
* **File**: [client/src/features/history/components/ProformaManagerModal.jsx#L1086-L1090](file:///d:/AdDubey/Revenue%20Engine/client/src/features/history/components/ProformaManagerModal.jsx#L1086-L1090)
```jsx
{ currentTotalAd > maxAllowed && (
  <div className="col-span-full text-red-400 text-xs font-semibold bg-red-900/30 p-2.5 rounded-lg border border-red-800">
    Total Ad Budget (₹{ currentTotalAd.toLocaleString() }) cannot exceed ₹{ maxAllowed.toLocaleString() }. Minimum ₹1 must be reserved for service amount.
  </div>
) }
```

#### 4. Frontend Submit Button Disabled Guard
* **File**: [client/src/features/history/components/ProformaManagerModal.jsx#L1116-L1121](file:///d:/AdDubey/Revenue%20Engine/client/src/features/history/components/ProformaManagerModal.jsx#L1116-L1121)
```javascript
const isAdBudgetInvalid = paymentForm.has_ad_budget && (
  currentTotalAd <= 0 ||
  currentTotalAd > maxAllowed ||
  (hasGoogleAd && activeGoogle > remainingGoogleAdBudget) ||
  (hasMetaAd && activeMeta > remainingMetaAdBudget)
);
// Button: <button type="submit" disabled={ savingPayment || isAdBudgetInvalid }>
```

---

## 5. REPORTS / REVENUE DISPLAY QUERIES

### 5.1 Backend Function: `getRevenueHistory`
* **File**: [server/revenue_engen_server/re_controller/re_proposalController.js#L3319-L3408](file:///d:/AdDubey/Revenue%20Engine/server/revenue_engen_server/re_controller/re_proposalController.js#L3319-L3408)

```javascript
exports.getRevenueHistory = async (req, res) => {
  try {
    const proformaRows = await runQuery(
      `SELECT
         pp.id               AS proforma_id,
         pp.client_id,
         pp.proforma_number,
         pp.total_amount,
         pp.status           AS proforma_status,
         pp.is_carried_forward,
         pp.carried_into_proforma_id,
         c.client_name,
         IFNULL((
           SELECT SUM(ppr.amount)
           FROM re_proposal_payment_records ppr
           WHERE ppr.proforma_id = pp.id AND ppr.status = 'approved'
         ), 0) AS total_received_for_proforma,
         IFNULL((
           SELECT SUM(ppr.tds_amount)
           FROM re_proposal_payment_records ppr
           WHERE ppr.proforma_id = pp.id AND ppr.status = 'approved'
         ), 0) AS total_tds_for_proforma,
         GREATEST(0, pp.total_amount - IFNULL((
           SELECT SUM(ppr.amount)
           FROM re_proposal_payment_records ppr
           WHERE ppr.proforma_id = pp.id AND ppr.status = 'approved'
         ), 0)) AS current_pending_for_proforma
       FROM re_proposal_proforma pp
       LEFT JOIN re_revenue_engine_client_details c ON c.id = pp.client_id
       WHERE pp.status NOT IN ('cancelled', 'superseded', 'draft')
       ORDER BY pp.client_id, pp.id`,
      []
    );
```

#### Aggregation Loop (Lines 3376–3408):
```javascript
    let totalReceived = 0;
    let totalPending = 0;
    let totalTds = 0;
    let totalAmount = 0;
    const clientMap = {};

    proformaRows.forEach((pf) => {
      const cid = pf.client_id;
      const tot = Number(pf.total_amount || 0);
      const rec = Number(pf.total_received_for_proforma || 0);
      const isCarriedForward = pf.proforma_status === 'carried_forward' || pf.is_carried_forward === 1;
      const pend = isCarriedForward ? 0 : Number(pf.current_pending_for_proforma || 0);
      const effectiveTot = isCarriedForward ? rec : tot;
      const tds = Number(pf.total_tds_for_proforma || 0);
      const invCount = invoiceCountMap[pf.proforma_id] || 0;

      totalAmount += effectiveTot;
      totalReceived += rec;
      totalPending += pend;
      totalTds += tds;
```

#### Answer to Question 5:
> **Question**: "Ye function sirf `total_paid` use karta hai ya `service_amount` aur `ad_budget` ko alag calculate karta hai?"
> 
> **Answer**: **Yeh sirf `SUM(ppr.amount)` use karta hai.**
> Yeh query Ad Budget ko Service Collection se **alag nahi karti**.
> `total_received` aur `total_pending` me poora Ad Budget as Company Revenue/Collection show hota hai.

---

### 5.2 Proforma Listing Query (`getAllProformas`)
* **File**: [server/revenue_engen_server/re_controller/re_proposalController.js#L1246-L1266](file:///d:/AdDubey/Revenue%20Engine/server/revenue_engen_server/re_controller/re_proposalController.js#L1246-L1266)

```sql
SELECT p.*, c.client_name, c.client_organization, qtn.quotation_number,
       COALESCE((SELECT SUM(amount) FROM re_proposal_payment_records WHERE proforma_id = p.id AND status = 'approved'), 0) AS total_paid_amount,
       CASE
         WHEN COALESCE((SELECT SUM(amount) FROM re_proposal_payment_records WHERE proforma_id = p.id AND status = 'approved'), 0) >= (p.total_amount - 0.05) AND p.total_amount > 0
         THEN 'fully-paid'
         WHEN COALESCE((SELECT SUM(amount) FROM re_proposal_payment_records WHERE proforma_id = p.id AND status = 'approved'), 0) > 0
         THEN 'partial'
         ELSE 'pending'
       END AS payment_status,
       (SELECT COUNT(*) FROM re_invoice i WHERE i.proforma_id = p.id) > 0 as has_invoice
FROM re_proposal_proforma p
LEFT JOIN re_revenue_engine_client_details c ON p.client_id = c.id
LEFT JOIN re_quotation qtn ON qtn.id = p.quotation_id
ORDER BY p.created_at DESC
```

Notice that `payment_status` checks:
$$\text{total\_paid\_amount} \ge (p.\text{total\_amount} - 0.05)$$
Because $p.\text{total\_amount}$ includes the Ad Budget, if the client pays only the Service fee and does not pay the Ad Budget, the proforma remains permanently stuck in `'partial'`.

---

## 6. INVOICE VIEW / CALCULATION HOOK

* **File**: [client/src/features/invoices/hooks/useInvoiceCalculations.js](file:///d:/AdDubey/Revenue%20Engine/client/src/features/invoices/hooks/useInvoiceCalculations.js)

```javascript
// Lines 187-189
const currentBillGrossReceived = Number(clientData?.received_amt || 0);
const realizedAdBudget = Number(clientData?.realized_ad_budget || 0);
const amountForServicesIncGst = Math.max(currentBillGrossReceived - realizedAdBudget, 0);

// Lines 201-203
const activeTaxableSubtotal = isGST
  ? Number((currentServicesIncGst / 1.18).toFixed(2))
  : currentServicesIncGst;

// Lines 280-284
const calculatedSummaryBalance = hasSavedOutstandingFromPartial
  ? savedOutstanding
  : Math.max(
    previousAmountForSummary + invoiceTotal + visibleAdBudget - receivedAmountForBalance,
    0
  );
```

#### What happens if you uncheck "Has Ad Budget" when recording the ₹2,000?:
1. `realizedAdBudget` becomes `0`.
2. `amountForServicesIncGst = 5000 + 2000 = 7000`.
3. If GST is applied, GST is levied on the entire ₹7,000 (taxable subtotal ₹5,932.20 + GST ₹1,067.80) instead of only on the ₹5,000 service.
4. Total service collection in all records is inflated by ₹2,000.

---

## SUMMARY OF THE CORE ARCHITECTURAL CONFLICT

| Component | Current State | Impact on Business Logic |
| :--- | :--- | :--- |
| **`re_proposal_proforma`** | Blends `Services + GST + Ad Budget` into one `total_amount`. | System cannot determine how much of the proforma's outstanding balance belongs to services vs ads. |
| **`getClientPreviousBalance`** | Subtracts total payments from `total_amount`. | If client only paid services and cancelled ads, the unpaid ad budget is carried forward as a "Debt / Previous Balance" to future proformas. |
| **`re_proposal_payment_records`** | Has `amount` and `realized_ad_budget`, but NO `service_amount`. | If user leaves ad budget unchecked to clear the proforma, the payment is categorized as service revenue, inflating company service income and GST liability. |
| **Minimum ₹1 Rule** | Prohibits recording payment where `realized_ad_budget == amount`. | Impossible to record a pure ad-budget top-up without assigning at least ₹1 to services. |
| **Revenue Reports (`getRevenueHistory`)** | Simply queries `SUM(ppr.amount)`. | Ad budgets collected are lumped together with actual agency service earnings. |
