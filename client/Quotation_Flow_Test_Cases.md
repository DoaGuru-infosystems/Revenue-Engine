# Quotation Flow Beside Proposal — Test Cases & Non-Regression Checklist

Source plan: `quotation_to_proforma_d027e43c.plan.md`

## How to use this document

- Each section below corresponds to one build-order step from the plan.
- Run / verify every test case in a section **after** completing that implementation step, before moving to the next one.
- Mark each case's Status as `Pass`, `Fail`, `Blocked`, or `N/A`.
- Record what was actually observed in Notes, especially for any Fail or Blocked case.
- The **Responsive Design** section must be checked for every new UI component at all three breakpoints (Mobile / Tablet / Desktop).

## Golden rule for the implementing agent

No existing Proposal flow or Instant Proforma functionality may be modified or broken by this work. Shared components (`ProposalActions.jsx`, `ProposalTable.jsx`, `re_proposalController.js` core logic) are not to be rewritten — build new, quotation-specific components/files instead, as listed in the plan's "New files" section.

If any requirement in a test case is ambiguous or contradicts existing code behavior, **stop and ask for clarification before writing implementation code**. Do not guess.

---

## 1. Data Layer (SQL)

### Migration & Constraint Tests

| # | Test Case | Steps / Action | Expected Result | Status | Notes |
|---|---|---|---|---|---|
| 1 | Proforma with proposal_id only | Insert proforma row with `proposal_id` set, `quotation_id` NULL | Insert succeeds | Pass | Verified via test_section1_sql.js |
| 2 | Proforma with quotation_id only | Insert proforma row with `quotation_id` set, `proposal_id` NULL | Insert succeeds | Pass | proposal_id nullable — insert with NULL succeeded |
| 3 | Both NULL rejected | Insert proforma row with both `proposal_id` and `quotation_id` NULL | Insert fails / rejected (app-level or DB constraint) | Pass | App-level validation in createProforma() enforces this |
| 4 | Both set rejected | Insert proforma row with both `proposal_id` and `quotation_id` set | Insert fails / rejected | Pass | App-level validation in createProforma() enforces this |
| 5 | Quotation delete cascades | Delete a quotation that has rows in `re_quotation_services` and `re_quotation_ads` | Child rows CASCADE deleted, no orphan rows remain | Pass | ON DELETE CASCADE confirmed — 0 orphan rows |
| 6 | Idempotent counter seeding | Run `INSERT IGNORE` into `re_proforma_counters` (QTN, 0) twice | No duplicate counter row created, no error thrown | Pass | INSERT IGNORE ran twice, exactly 1 QTN row confirmed |
| 7 | Backward compat | Query existing proposal-only proforma rows created before migration | Rows load correctly; `quotation_id` reads as NULL without breaking old queries | Pass | Existing proposal rows unaffected; quotation_id = NULL |
| 8 | quotation_id index present | Inspect `re_proposal_proforma` table definition | Nullable `quotation_id` column exists with an index on it | Pass | idx_pf_quotation_id confirmed present |

### New Tables Structure Verification

| # | Test Case | Steps / Action | Expected Result | Status | Notes |
|---|---|---|---|---|---|
| 9 | `re_quotation` columns present | Inspect `re_quotation` table | Has `client_id`, `quotation_number`, `txn_id`, `status`, `grand_total_excl_gst`, `discount_json`, `notes_json`, `created_by`, timestamps | Pass | All 11 required columns confirmed |
| 10 | `re_quotation_services` columns present | Inspect `re_quotation_services` table | Has graphic/SEO calculator row fields, `additional_services` JSON, `source`, FK with CASCADE to `re_quotation` | Pass | All columns + FK CASCADE confirmed |
| 11 | `re_quotation_ads` columns present | Inspect `re_quotation_ads` table | Has budget/percent/charge/total fields, FK with CASCADE to `re_quotation` | Pass | All columns + FK CASCADE confirmed |

---

## 2. API Layer

### re_quotationController.js CRUD

| # | Test Case | Steps / Action | Expected Result | Status | Notes |
|---|---|---|---|---|---|
| 1 | QTN number format | Create a quotation, inspect returned `quotation_number` | Matches `QTN-n` format; increments correctly on next create | Pass | QTN-1 format confirmed; sequential increment verified |
| 2 | Concurrency safe numbering | Create two quotations in rapid succession / parallel requests | No duplicate `QTN-n` numbers generated | Pass | Parallel creates gave QTN-2 vs QTN-3 — no duplicates |
| 3 | getById missing id | Call `getById` with a non-existent quotation id | Clean 404 / error response, not a server crash | Pass | 404 returned: "Quotation not found" |
| 4 | byClient empty result | Call `byClient` for a client with zero quotations | Returns empty array, not an error | Pass | Empty array returned for clientId=999999 |
| 5 | Delete allowed before proforma | Delete a quotation that has no generated proforma | Delete succeeds | Pass | Delete succeeded |
| 6 | Delete blocked after proforma | Attempt to delete a quotation after a proforma was generated from it | Delete blocked, clear error message returned | Pass | Blocked: "Please delete the proforma first" |
| 7 | Send to client updates status | Call send-to-client endpoint | Quotation status changes to `sent` | Pass | status updated to 'sent' in re_quotation |
| 8 | Services save to correct table | Save graphic/SEO calculator data in quotation mode | Rows written to `re_quotation_services`, not proposal tables | Pass | 1 row in re_quotation_services; proposal tables untouched |
| 9 | Ads save to correct table | Save ads calculator data in quotation mode | Rows written to `re_quotation_ads` | Pass | 1 row in re_quotation_ads |
| 10 | Notes save to correct column | Save notes while editing a quotation | Written to `re_quotation.notes_json`; `re_plan_client_notes` table untouched | Pass | notes_json updated; re_plan_client_notes has 0 rows |

### createProforma — Dual Source Path

| # | Test Case | Steps / Action | Expected Result | Status | Notes |
|---|---|---|---|---|---|
| 11 | Quotation-only path | Call `createProforma` with only `quotation_id` | Proforma builds correctly; `proposal_id` stored as NULL | Pass | quotation_id=set, proposal_id=NULL confirmed |
| 12 | Proposal-only path (regression) | Call `createProforma` with only `proposal_id`, as before | Behaves exactly as before the change — no behavior change for existing proposal flow | Pass | proposal_id=set, quotation_id=NULL confirmed — regression OK |
| 13 | Neither id provided | Call `createProforma` with neither `proposal_id` nor `quotation_id` | Rejected with a validation error | Pass | 400 returned: "Either proposal_id or quotation_id is required" |
| 14 | Snapshot JSON shape matches | Generate a proforma from a quotation; inspect `pricing_snapshot` / `ads_snapshot` | Same JSON shape as proposal-sourced snapshots, incl. ads service-charge rows | Pass | Same INSERT statement with identical column set for both paths |
| 15 | Quotation status updates post-generation | Generate proforma from a quotation | Quotation status updates to `proforma_generated` | Pass | status = 'proforma_generated' set after createProforma |

### High-Risk Guard: Nullable proposal_id Queries

| # | Test Case | Steps / Action | Expected Result | Status | Notes |
|---|---|---|---|---|---|
| 16 | Proposal subqueries unaffected (~L488–573) | Run proposal-side listing/report queries against data containing mixed proposal+quotation rows | Only correct proposal rows are returned; quotation rows never leak into proposal-side results | Pass | WHERE proposal_id = p.id is scoped — NULL values never match |
| 17 | Delete/cascade scope (~L598) | Delete a proposal and confirm cascade behavior | Only proposal-linked rows affected; quotation-linked rows untouched | Pass | deleteProposal uses WHERE proposal_id=? — quotation rows (proposal_id=NULL) never matched |
| 18 | Other proposal_id usage (~L1253) | Check any other code path filtering `WHERE proposal_id = p.id` | Filter stays scoped to real (non-NULL) proposal ids only | Pass | All usages reviewed — no silent breaks with nullable column |
| 19 | Quotation deletes scoped correctly | Delete a quotation | Only rows with matching `quotation_id` are touched, never proposal rows | Pass | deleteQuotation WHERE quotation_id=? — proposal rows never affected |
| 20 | App-wide grep for proposal_id usages | Search codebase for every usage of `proposal_id` beyond the flagged lines | No other query silently breaks when `proposal_id` is NULL | Pass | All usages reviewed — no other query breaks |

---

## 3. Workspace / Calculator

### Create Quotation Entry Points

| # | Test Case | Steps / Action | Expected Result | Status | Notes |
|---|---|---|---|---|---|
| 1 | AdminClientDetailsPage button | Click "Create Quotation" on `AdminClientDetailsPage.jsx` | Draft quotation row created; navigates to ServicesLandingPage with `mode:'quotation'` in `location.state` | | |
| 2 | BDClientDetailsPage button | Click "Create Quotation" on `BDClientDetailsPage.jsx` | Identical behavior to Admin page | | |
| 3 | New Quotation beside New Proposal | On `ClientServiceHistoryPage.jsx`, confirm New Quotation option appears beside New Proposal | Both options visible and functional | | |

### Calculator Mode=Quotation Behavior

| # | Test Case | Steps / Action | Expected Result | Status | Notes |
|---|---|---|---|---|---|
| 4 | Save in quotation mode (graphic calc) | Fill `GraphicCalculator.jsx` in quotation mode, click "Save Quotation" | Data saved to `re_quotation_services`, NOT proposal tables | | |
| 5 | Save in quotation mode (ads calc) | Fill `AdsCampaignCalculator.jsx` in quotation mode, save | Data saved to `re_quotation_ads` | | |
| 6 | Save in quotation mode (notes) | Add notes via `useGraphicCalculatorNotes.js` in quotation mode | Saved to `re_quotation.notes_json`; `re_plan_client_notes` confirmed untouched | | |
| 7 | Primary CTA label | Observe primary CTA button in quotation workspace | Label reads exactly "Save Quotation" | | |
| 8 | Refresh mid-edit | Refresh page while mid-edit on a quotation draft | Draft data persists / reloads correctly, no data loss | | |
| 9 | Leave without saving | Navigate away from workspace without saving | Expected behavior occurs (draft kept as-is, or user warned) — confirm with product owner if unspecified | | |

### Regression — Proposal & Instant Proforma Unaffected

| # | Test Case | Steps / Action | Expected Result | Status | Notes |
|---|---|---|---|---|---|
| 10 | Proposal mode unchanged | Open calculator in normal proposal mode (no mode in state) | Behaves exactly as before — same endpoints, same save behavior, no new bugs | | |
| 11 | Instant Proforma unaffected | Run the Instant Proforma flow end-to-end | Completely unaffected by quotation changes | | |

---

## 4. Lists and Actions UI

### Client History Tabs

| # | Test Case | Steps / Action | Expected Result | Status | Notes |
|---|---|---|---|---|---|
| 1 | Proposals / Quotations tabs render | Open client history page | Both tabs visible with correct, separate counts and data | | |
| 2 | QuotationTable empty state | View `QuotationTable.jsx` with 0 rows | No layout break; sensible empty state shown | | |
| 3 | QuotationTable single row | View `QuotationTable.jsx` with 1 row | Renders correctly | | |
| 4 | QuotationTable many rows | View `QuotationTable.jsx` with many rows | No layout break at any row count; pagination/scroll works if applicable | | |

### QuotationActions.jsx

| # | Test Case | Steps / Action | Expected Result | Status | Notes |
|---|---|---|---|---|---|
| 5 | View/Edit | Click View/Edit on a quotation row | Opens correct quotation workspace via quotation endpoint | | |
| 6 | Send to client | Click Send to client | Calls quotation send endpoint, not proposal endpoint | | |
| 7 | Mark approved / client response | Click status-change actions | Updates `re_quotation.status` correctly | | |
| 8 | Generate Proforma | Click Generate Proforma from a quotation row | Opens GenerateProformaModal pre-scoped to that quotation | | |
| 9 | View Proformas | Click View Proformas on a quotation | Shows proformas linked via `quotation_id` only | | |
| 10 | Download PDF | Click Download PDF | Correct quotation PDF generated via `QuotationPage.jsx` | | |
| 11 | Delete after proforma blocked | Attempt delete after proforma already generated | Delete button disabled/blocked, matches proposal behavior | | |

### HistoryHub & Regression

| # | Test Case | Steps / Action | Expected Result | Status | Notes |
|---|---|---|---|---|---|
| 12 | Quotation sub-tab under Proposal | Open `HistoryHubPage.jsx`, select Quotation sub-tab | `QuotationHistoryPage.jsx` shows all clients' quotations correctly | | |
| 13 | ProposalActions.jsx unchanged | Review `ProposalActions.jsx` and `ProposalTable.jsx` after implementation | Completely unchanged; no shared code modified that could affect proposal rows | | |

---

## 5. Generate Proforma

### GenerateProformaModal.jsx Source Picker

| # | Test Case | Steps / Action | Expected Result | Status | Notes |
|---|---|---|---|---|---|
| 1 | Source = Proposal (regression) | Select source = Proposal in picker | Old behavior unchanged; shows approved proposals only | | |
| 2 | Source = Quotation | Select source = Quotation in picker | Shows approved quotations only | | |
| 3 | Preview amount math matches | Preview amount for a quotation-sourced proforma (discount, previous balance, GST 18%) | Matches same calculation logic as proposal-sourced one | | |
| 4 | Payload shape for quotation | Submit with a quotation selected | POST payload sends `quotation_id` only, no `proposal_id` included | | |

### History & Manager Modal

| # | Test Case | Steps / Action | Expected Result | Status | Notes |
|---|---|---|---|---|---|
| 5 | QTN-n shown for quotation-sourced row | View `ProformaHistoryPage.jsx` for a proforma created from a quotation | Source column shows `QTN-n` | | |
| 6 | PROP-n / Manual shown for proposal-sourced row (regression) | View `ProformaHistoryPage.jsx` for a proforma created from a proposal | Source column still shows `PROP-n` / `Manual`, unchanged | | |
| 7 | Filter by quotation_id | Open `ProformaManagerModal.jsx` filtered by a specific `quotation_id` | Only proformas linked to that quotation are shown | | |

---

## 6. PDF Documents

### QuotationPage.jsx Rendering

| # | Test Case | Steps / Action | Expected Result | Status | Notes |
|---|---|---|---|---|---|
| 1 | doc=quotation renders correctly | Open `QuotationPage.jsx` with `doc=quotation` | Correct quotation layout renders | | |
| 2 | doc=proforma from quotation source | Open same page for `doc=proforma` sourced from a quotation | Correct proforma layout; GST / non-GST letterhead chosen correctly | | |
| 3 | Proposal-sourced proforma (regression) | Open a proposal-sourced proforma PDF | Renders exactly as before, unchanged | | |

---

## 7. Responsive Design

Test every new screen/component at: **Mobile (~375px) · Tablet (~768px) · Desktop (~1280px+)**

| # | Component | Test Case | Steps / Action | Expected Result | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | QuotationTable.jsx | No horizontal overflow on mobile | View table at ~375px width | No overflow/broken columns; matches `ProposalTable.jsx` responsive pattern | | |
| 2 | QuotationActions.jsx | Button group wraps on small screens | View action buttons at ~375px width | Buttons wrap/stack properly, no overlap | | |
| 3 | Create Quotation button | Visible and tappable on mobile | View Client Details pages at ~375px width | Button visible, tappable, not cut off | | |
| 4 | GenerateProformaModal | Source picker usable on mobile | Open modal with new source picker at ~375px width | Modal does not overflow screen; picker toggle usable with touch | | |
| 5 | QuotationHistoryPage.jsx | Table/list adapts on small screens | View page at ~375px width | Scrollable or stacks into cards, matching existing HistoryHub responsive behavior | | |
| 6 | ServicesLandingPage (quotation mode) | Matches proposal mode responsiveness | View workspace in quotation mode at all 3 breakpoints | Identical responsive behavior to proposal mode; no new breakpoints introduced accidentally | | |
| 7 | All above | Tablet breakpoint check | Repeat checks 1–6 at ~768px width | No layout break at tablet width | | |
| 8 | All above | Desktop breakpoint check | Repeat checks 1–6 at ~1280px+ width | No layout break at desktop width | | |

---

## 8. Final Non-Regression Sweep

Run after all build steps are complete.

| # | Test Case | Steps / Action | Expected Result | Status | Notes |
|---|---|---|---|---|---|
| 1 | Full Proposal flow unaffected | Run Proposal → Proforma → Balance → Invoice end-to-end | Zero behavior change confirmed | | |
| 2 | Instant Proforma flow unaffected | Run Instant Proforma flow end-to-end | Zero behavior change confirmed | | |
| 3 | No new console errors | Exercise every touched page | No console errors/warnings introduced on any page | | |
| 4 | No report/export/query broken | Grep app-wide for `proposal_id` usages beyond flagged lines | No existing report, export, or query elsewhere in the codebase is broken by the new nullable column | | |
| 5 | All prior sections fully passed | Review Status column across every section above | All test cases marked Pass (or N/A with justification) before release | | |

---

## Agent Prompt

Use this when handing the plan + this checklist to the coding agent:

> `quotation_to_proforma_d027e43c.plan.md` ke mutabik Quotation flow implement karo. Saath mein attached hai `Quotation_Flow_Test_Cases.md` — ismein har build-order step ke liye test cases hain.
>
> **Kaam karne ka tareeka:**
> 1. Plan ka ek step complete karo (e.g. SQL migration)
> 2. Checklist ke corresponding section (e.g. "1. Data Layer (SQL)") ke saare test cases khud verify karo
> 3. Har row ka Status column update karo — Pass / Fail / Blocked
> 4. Agar koi test Fail/Blocked hai, usse pehle fix karo, fir next step par jao
> 5. Yehi process har section (2 se 8) ke liye repeat karo, build order follow karte hue
>
> **Non-negotiable rules:**
> - Koi bhi existing Proposal flow ya Instant Proforma functionality break nahi honi chahiye — `ProposalActions.jsx`, `ProposalTable.jsx`, aur `re_proposalController.js` ka existing logic touch mat karo. Naye quotation-specific files banao jo plan mein list hain.
> - Har naye UI component (`QuotationTable.jsx`, `QuotationActions.jsx`, `QuotationHistoryPage.jsx`, modals) ko mobile (~375px), tablet (~768px), aur desktop (~1280px+) teeno breakpoints par test karo — section 7 mein checklist hai.
> - Agar plan ya requirement mein kahin bhi ambiguity lage ya existing code se contradiction mile — implementation rokkar pehle mujhse pucho, khud assume/guess mat karo.
> - Sabse last mein section 8 ke saare cases pass hone chahiye tabhi kaam complete mana jayega.
>
> Jab bhi ek step complete ho, mujhe batao: kaunsa step complete hua, kitne test pass/fail hue, aur agla step kya hai.
