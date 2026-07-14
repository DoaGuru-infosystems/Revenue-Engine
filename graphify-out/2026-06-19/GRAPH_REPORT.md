# Graph Report - .  (2026-06-19)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 413 nodes · 626 edges · 33 communities (28 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `08e37c35`
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
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]

## God Nodes (most connected - your core abstractions)
1. `BusinessDeveloperDashboard` - 11 edges
2. `db` - 9 edges
3. `moment` - 8 edges
4. `isEmail()` - 8 edges
5. `sendAssignmentWhatsApp()` - 7 edges
6. `scripts` - 5 edges
7. `History()` - 5 edges
8. `QuotationBD` - 5 edges
9. `applyHeaderFooterWithMargins()` - 5 edges
10. `embedImageToPdf()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `History()` --calls--> `moment`  [INFERRED]
  client/src/Admin/History.jsx → server/controller/sendEmails.js
- `QuotationBD` --calls--> `moment`  [INFERRED]
  client/src/Routers/BDRouter.jsx → server/controller/sendEmails.js
- `History()` --calls--> `toNumber()`  [INFERRED]
  client/src/Admin/History.jsx → client/src/Components/InvoiceServices.jsx
- `History()` --calls--> `calcAdsRowTotal()`  [EXTRACTED]
  client/src/Admin/History.jsx → client/src/utils/proformaPricing.js
- `History()` --calls--> `classifyProformaServices()`  [EXTRACTED]
  client/src/Admin/History.jsx → client/src/utils/proformaPricing.js

## Import Cycles
- None detected.

## Communities (33 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (37): { db }, dotenv, { db }, dotenv, { db }, dotenv, isEmail(), moment (+29 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (32): applyHeaderFooterWithMargins(), {
  ASSETS_DIR,
  HEADER_HEIGHT,
  FOOTER_HEIGHT,
  CONTENT_TOP_PADDING,
  embedImageToPdf,
  drawHeader,
  drawFooter,
  drawWatermark,
}, convertDocxToPdf(), deleteFile(), fs, ILovePDF, ILovePDFFile, multer (+24 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (25): bcrypt, crypto, { db }, dotenv, forgototpStore, jwt, moment, nodemailer (+17 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (29): dependencies, axios, jspdf, jspdf-autotable, @lottiefiles/dotlottie-react, lucide-react, moment, number-to-words (+21 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (28): author, dependencies, axios, axios-retry, bcryptjs, cors, dotenv, express (+20 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (8): AllHistory, RegisterBD, AllHistory, RegisterBD, PaginationContainer, AllHistory, PaginationContainer, BusinessDeveloperDashboard

### Community 6 - "Community 6"
Cohesion: 0.10
Nodes (14): GlobalStyle, SERVICES, ThemeProvider(), useTheme(), persistConfig, persistedReducer, persistor, rootReducer (+6 more)

### Community 7 - "Community 7"
Cohesion: 0.13
Nodes (6): Wrapper, History(), PaginationContainer, PROPOSAL_STATUS_MAP, calcAdsRowTotal(), classifyProformaServices()

### Community 8 - "Community 8"
Cohesion: 0.13
Nodes (7): asNumber(), normalizeRow(), BILLING_TYPES, buildInitialSections(), buildInitialToggles(), PROPOSAL_SECTIONS, PROPOSAL_TYPES

### Community 9 - "Community 9"
Cohesion: 0.17
Nodes (16): cron, { db }, moment, runReminderSweep(), { sendReminderWhatsApp }, isEmail(), moment, nodemailer (+8 more)

### Community 10 - "Community 10"
Cohesion: 0.17
Nodes (3): PaginationContainer, API_BASE_URL, CalculatorBD

### Community 11 - "Community 11"
Cohesion: 0.14
Nodes (8): Wrapper, Wrapper, AddService, AdsCampaignCalciBD, HistoryBD, ProposalPaymentsBD, QuotationBD, Wrapper

### Community 12 - "Community 12"
Cohesion: 0.15
Nodes (4): NoteSection(), Wrapper, History, Wrapper

### Community 13 - "Community 13"
Cohesion: 0.17
Nodes (12): devDependencies, autoprefixer, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, postcss (+4 more)

### Community 14 - "Community 14"
Cohesion: 0.22
Nodes (3): PaginationContainer, PaginationContainer, initialState

### Community 15 - "Community 15"
Cohesion: 0.22
Nodes (5): baseClientForm, baseInvoiceForm, paymentModes, defaultQtForm, paymentModes

### Community 18 - "Community 18"
Cohesion: 0.33
Nodes (3): axios, IN_MEMORY_PDF_CACHE, puppeteer

## Knowledge Gaps
- **180 isolated node(s):** `Codegeex.CommitMessage.LanguagePreference`, `Codegeex.CommitMessageStyle`, `name`, `private`, `version` (+175 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `moment` connect `Community 9` to `Community 11`, `Community 12`, `Community 7`?**
  _High betweenness centrality (0.298) - this node is a cross-community bridge._
- **Why does `QuotationBD` connect `Community 11` to `Community 9`, `Community 10`, `Community 14`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Why does `sendAssignmentEmail()` connect `Community 9` to `Community 2`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **What connects `Codegeex.CommitMessage.LanguagePreference`, `Codegeex.CommitMessageStyle`, `name` to the rest of the system?**
  _180 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05314009661835749 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06448202959830866 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.09032258064516129 - nodes in this community are weakly interconnected._