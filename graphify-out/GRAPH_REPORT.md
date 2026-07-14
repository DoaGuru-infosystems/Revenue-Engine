# Graph Report - Revenue Engine  (2026-07-14)

## Corpus Check
- 143 files · ~447,524 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 760 nodes · 1494 edges · 43 communities (41 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8567fcaf`
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
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 41|Community 41]]

## God Nodes (most connected - your core abstractions)
1. `API_BASE_URL` - 69 edges
2. `moment` - 39 edges
3. `runQuery()` - 25 edges
4. `moment` - 16 edges
5. `classifyProformaServices()` - 14 edges
6. `BusinessDeveloperDashboard` - 11 edges
7. `db` - 9 edges
8. `sendWhatsAppTemplate()` - 9 edges
9. `sendProposalToClient()` - 8 edges
10. `createProposalPdfBuffer()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `History()` --calls--> `toNumber()`  [INFERRED]
  client/src/Admin/History.jsx → client/src/Components/InvoiceServices.jsx
- `getBillableTotals()` --calls--> `classifyProformaServices()`  [EXTRACTED]
  client/src/Admin/ProposalBuilder.jsx → client/src/utils/proformaPricing.js
- `sendRegisterAdminOtp()` --calls--> `sendRegistrationOtpEmail()`  [EXTRACTED]
  server/re_controller/re_controller.js → server/re_controller/re_sendEmails.js
- `sendProposalToClient()` --calls--> `generatePublicAccessToken()`  [EXTRACTED]
  server/re_controller/re_proposalController.js → server/re_controller/re_publicController.js
- `sendProposalToClient()` --calls--> `sendProposalAdminNotifyEmail()`  [EXTRACTED]
  server/re_controller/re_proposalController.js → server/re_controller/re_sendEmails.js

## Import Cycles
- None detected.

## Communities (43 total, 2 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.17
Nodes (18): sendProposalToClient(), axios, DEFAULT_LANG_FALLBACK, normalizeMsisdn(), postToGraph(), sendInvoiceAdminNotifyWA(), sendInvoiceWhatsApp(), sendOnce() (+10 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (61): addCategories(), addEditingTypes(), addMembersToTeam(), addNotebyplan(), addServices(), assignQuotation(), assignQuotationToTeam(), bcrypt (+53 more)

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
Cohesion: 0.08
Nodes (23): AdminAddPlan(), AdminAddServices, AdminAdsCampign, AdminClientDetails, AdminServicesHistory, AssignQuotation, HistoryHub, RegisterBD (+15 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (22): GlobalStyle, SERVICES, ThemeToggle(), ThemeContext, ThemeProvider(), useTheme(), persistConfig, persistedReducer (+14 more)

### Community 7 - "Community 7"
Cohesion: 0.13
Nodes (11): AllHistory, AssignQuotationBD, BdExplorePlans, ClientDetails, GenerateLinkHistoryBD, PaginationContainer, InvoiceHistory(), PaginationContainer (+3 more)

### Community 8 - "Community 8"
Cohesion: 0.22
Nodes (6): PaginationContainer, LegacyQuotationTableBD(), PaymentModal(), ProposalActions(), ProposalTable(), PROPOSAL_STATUS_MAP

### Community 9 - "Community 9"
Cohesion: 0.09
Nodes (38): { addBrandedPage, embedImageToPdf, loadBrandImages, HEADER_HEIGHT, FOOTER_HEIGHT, CONTENT_TOP_PADDING }, approvePayment(), beginTransaction(), commitTransaction(), createProforma(), createProposal(), { db }, deleteProforma() (+30 more)

### Community 10 - "Community 10"
Cohesion: 0.10
Nodes (8): AdminCalculator(), PaginationContainer, AdminComplimentaryData(), PaginationContainer, PaginationContainer, CalculatorBD, initialState, userSlice

### Community 11 - "Community 11"
Cohesion: 0.12
Nodes (14): BDInvoice(), Wrapper, BDNoteSection(), DiscountSetting(), InvoiceAds(), InvoiceNoteSection(), PremiumLoader(), AddService (+6 more)

### Community 12 - "Community 12"
Cohesion: 0.11
Nodes (15): AdminPlanHistory(), DiscountSetting(), InvoiceAds(), InvoiceNoteSection(), NoteSection(), Quotation(), Wrapper, AdminCalculator (+7 more)

### Community 13 - "Community 13"
Cohesion: 0.06
Nodes (34): { db }, deleteAdditionalById(), deleteAdsCampaignDetails(), deleteAdsCampaignEntryById(), deleteAdsServices(), deleteAllInvoiceServiceHistory(), deleteCategory(), deleteClientAllPlanData() (+26 more)

### Community 14 - "Community 14"
Cohesion: 0.10
Nodes (26): authenticateToken(), verifyAdminToken, { db }, dotenv, jwt, crypto, { db }, dotenv (+18 more)

### Community 15 - "Community 15"
Cohesion: 0.40
Nodes (4): baseClientForm, baseProformaForm, InstantProforma(), paymentModes

### Community 16 - "Community 16"
Cohesion: 0.21
Nodes (4): InoviceComplmentary(), InvoiceCalculation(), InoviceComplmentary(), InvoiceCalculation()

### Community 17 - "Community 17"
Cohesion: 0.10
Nodes (28): { db }, dotenv, moment, nodemailer, transporter, updateAdditionalDataById(), updateCalculatorDataById(), updateCategory() (+20 more)

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

### Community 19 - "Community 19"
Cohesion: 0.11
Nodes (6): AdminInvoice(), Wrapper, PaginationContainer, PaginationContainer, CreateProposalModal(), API_BASE_URL

### Community 20 - "Community 20"
Cohesion: 0.29
Nodes (13): getLogoAttachment(), isEmail(), moment, nodemailer, path, sendDailyPaymentSummaryEmail(), sendFinalInvoiceEmail(), sendInvoiceAdminNotifyEmail() (+5 more)

### Community 21 - "Community 21"
Cohesion: 0.21
Nodes (5): ServiceProgressTable(), SkeletonTable(), PaginationContainer, keyOf(), ServiceProgressTable()

### Community 22 - "Community 22"
Cohesion: 0.06
Nodes (35): AdsCampaignCalculator(), History(), BalanceProformaHistory, HistoryHub(), InvoiceHistory, PaymentHistory, ProformaHistory, ProposalHistory (+27 more)

### Community 24 - "Community 24"
Cohesion: 0.31
Nodes (8): cron, { db }, moment, runPeriodicPaymentSummary(), runQuery(), {
  sendDailyPaymentSummaryEmail,
  TZ,
}, {
  sendPeriodicPaymentSummaryWA,
}, sendPeriodicPaymentSummaryWA()

### Community 32 - "Community 32"
Cohesion: 0.29
Nodes (7): createProposalPdfBuffer(), generateProposalPdf(), getImageDataURI(), hasRenderableContent(), parseJsonValue(), textToHtml(), valueToText()

### Community 33 - "Community 33"
Cohesion: 0.29
Nodes (6): app, cors, dotenv, express, morgan, re_apiRouter

### Community 41 - "Community 41"
Cohesion: 0.38
Nodes (6): axios, buildReportHtml(), fetchPSI(), IN_MEMORY_PDF_CACHE, pagespeedReportpdf(), puppeteer

## Knowledge Gaps
- **226 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+221 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `API_BASE_URL` connect `Community 19` to `Community 34`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 10`, `Community 11`, `Community 12`, `Community 15`, `Community 16`, `Community 21`, `Community 22`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `db` connect `Community 14` to `Community 1`, `Community 2`, `Community 9`, `Community 13`, `Community 17`, `Community 24`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Why does `PremiumLoader()` connect `Community 11` to `Community 12`, `Community 6`?**
  _High betweenness centrality (0.002) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _226 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.048484848484848485 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05407925407925408 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.045454545454545456 - nodes in this community are weakly interconnected._