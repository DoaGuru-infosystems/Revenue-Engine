# Graph Report - Revenue Engine  (2026-07-15)

## Corpus Check
- 143 files · ~298,966 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 757 nodes · 1505 edges · 37 communities (34 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0ec82c1f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]

## God Nodes (most connected - your core abstractions)
1. `API_BASE_URL` - 71 edges
2. `moment` - 39 edges
3. `runQuery()` - 25 edges
4. `classifyProformaServices()` - 16 edges
5. `moment` - 16 edges
6. `BusinessDeveloperDashboard` - 11 edges
7. `db` - 9 edges
8. `getLogoAttachment()` - 9 edges
9. `sendWhatsAppTemplate()` - 9 edges
10. `sendProposalToClient()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `History()` --calls--> `toNumber()`  [INFERRED]
  client/src/Admin/History.jsx → client/src/Components/InvoiceServices.jsx
- `getBillableTotals()` --calls--> `classifyProformaServices()`  [EXTRACTED]
  client/src/Admin/ProposalBuilder.jsx → client/src/utils/proformaPricing.js
- `sendProposalToClient()` --calls--> `sendProposalAdminNotifyEmail()`  [EXTRACTED]
  server/revenue_engen_server/re_controller/re_proposalController.js → server/revenue_engen_server/re_controller/re_sendEmails.js
- `sendProposalToClient()` --calls--> `sendProposalEmail()`  [EXTRACTED]
  server/revenue_engen_server/re_controller/re_proposalController.js → server/revenue_engen_server/re_controller/re_sendEmails.js
- `sendProposalToClient()` --calls--> `sendProposalAdminNotifyWA()`  [EXTRACTED]
  server/revenue_engen_server/re_controller/re_proposalController.js → server/revenue_engen_server/re_controller/re_sendWhatsApp.js

## Import Cycles
- None detected.

## Communities (37 total, 3 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (40): sendRegisterAdminOtp(), cron, { db }, moment, runPeriodicPaymentSummary(), runQuery(), {
  sendDailyPaymentSummaryEmail,
  TZ,
}, {
  sendPeriodicPaymentSummaryWA,
} (+32 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (58): addCategories(), addEditingTypes(), addMembersToTeam(), addNotebyplan(), addServices(), assignQuotation(), assignQuotationToTeam(), bcrypt (+50 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (64): { db }, dotenv, getAddCategories(), getAddEditingTypes(), getAdditionByIdData(), getAddServices(), getAdsServices(), getAllBD() (+56 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (43): dependencies, axios, html2pdf.js, jspdf, jspdf-autotable, @lottiefiles/dotlottie-react, lucide-react, moment (+35 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (29): author, dependencies, axios, axios-retry, bcryptjs, cors, dotenv, express (+21 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (35): AdminAddPlan(), AdminAddServices, AdminAdsCampign, AdminClientDetails, AdminServicesHistory, AssignQuotation, HistoryHub, RegisterBD (+27 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (23): GlobalStyle, SERVICES, PremiumLoader(), ThemeToggle(), ThemeContext, ThemeProvider(), useTheme(), persistConfig (+15 more)

### Community 7 - "Community 7"
Cohesion: 0.18
Nodes (3): PaginationContainer, PaginationContainer, BusinessDeveloperDashboard

### Community 8 - "Community 8"
Cohesion: 0.22
Nodes (6): PaginationContainer, LegacyQuotationTableBD(), PaymentModal(), ProposalActions(), ProposalTable(), PROPOSAL_STATUS_MAP

### Community 9 - "Community 9"
Cohesion: 0.07
Nodes (47): { addBrandedPage, embedImageToPdf, loadBrandImages, HEADER_HEIGHT, FOOTER_HEIGHT, CONTENT_TOP_PADDING }, approvePayment(), beginTransaction(), commitTransaction(), createProforma(), createProposal(), createProposalPdfBuffer(), { db } (+39 more)

### Community 10 - "Community 10"
Cohesion: 0.08
Nodes (5): PaginationContainer, PaginationContainer, PaginationContainer, CreateProposalModal(), API_BASE_URL

### Community 11 - "Community 11"
Cohesion: 0.11
Nodes (17): BDInvoice(), Wrapper, BDNoteSection(), DiscountSetting(), InvoiceAds(), InvoiceNoteSection(), Wrapper, AddService (+9 more)

### Community 12 - "Community 12"
Cohesion: 0.05
Nodes (27): AdminCalculator(), PaginationContainer, AdminComplimentaryData(), AdminPlanHistory(), DiscountSetting(), BalanceProformaHistory, HistoryHub(), InvoiceHistory (+19 more)

### Community 13 - "Community 13"
Cohesion: 0.06
Nodes (34): { db }, deleteAdditionalById(), deleteAdsCampaignDetails(), deleteAdsCampaignEntryById(), deleteAdsServices(), deleteAllInvoiceServiceHistory(), deleteCategory(), deleteClientAllPlanData() (+26 more)

### Community 14 - "Community 14"
Cohesion: 0.10
Nodes (25): crypto, { db }, dotenv, fs, getPublicInvoiceData(), getPublicInvoicePdf(), getPublicProposalData(), getPublicProposalPdf() (+17 more)

### Community 16 - "Community 16"
Cohesion: 0.21
Nodes (4): InoviceComplmentary(), InvoiceCalculation(), InoviceComplmentary(), InvoiceCalculation()

### Community 17 - "Community 17"
Cohesion: 0.11
Nodes (26): { db }, dotenv, moment, updateAdditionalDataById(), updateCalculatorDataById(), updateCategory(), updateClientDetails(), updateClientNoteDataById() (+18 more)

### Community 18 - "Community 18"
Cohesion: 0.12
Nodes (27): applyHeaderFooterWithMargins(), {
  ASSETS_DIR,
  HEADER_HEIGHT,
  FOOTER_HEIGHT,
  CONTENT_TOP_PADDING,
  embedImageToPdf,
  drawHeader,
  drawFooter,
  drawWatermark,
}, convertDocxToPdf(), deleteFile(), fs, generateInvoicePdf(), ILovePDF, ILovePDFFile (+19 more)

### Community 21 - "Community 21"
Cohesion: 0.21
Nodes (5): ServiceProgressTable(), SkeletonTable(), PaginationContainer, keyOf(), ServiceProgressTable()

### Community 22 - "Community 22"
Cohesion: 0.13
Nodes (17): AdsCampaignCalculator(), getBillableTotals(), getClientDisplayName(), ProposalBuilder(), getClientDisplayName(), getClientRecord(), ProposalBuilderBD(), formatRs() (+9 more)

### Community 33 - "Community 33"
Cohesion: 0.29
Nodes (6): app, cors, dotenv, express, morgan, re_apiRouter

### Community 40 - "Community 40"
Cohesion: 0.14
Nodes (12): Wrapper, History(), Wrapper, Wrapper, QuotationTypeModal(), EMPTY_ARRAY, GenerateProformaModal(), Header() (+4 more)

### Community 41 - "Community 41"
Cohesion: 0.38
Nodes (6): axios, buildReportHtml(), fetchPSI(), IN_MEMORY_PDF_CACHE, pagespeedReportpdf(), puppeteer

## Knowledge Gaps
- **224 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+219 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `API_BASE_URL` connect `Community 10` to `Community 5`, `Community 6`, `Community 7`, `Community 40`, `Community 8`, `Community 11`, `Community 12`, `Community 15`, `Community 16`, `Community 19`, `Community 21`, `Community 22`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `db` connect `Community 14` to `Community 0`, `Community 1`, `Community 2`, `Community 9`, `Community 13`, `Community 17`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Why does `PremiumLoader()` connect `Community 6` to `Community 11`, `Community 12`?**
  _High betweenness centrality (0.002) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _224 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08888888888888889 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05288207297726071 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05407925407925408 - nodes in this community are weakly interconnected._