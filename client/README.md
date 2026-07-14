# 🧮 Revenue Engine - Client Portal

> **DOAGURU IT Solution** का Digital Marketing Calculator और Quotation/Invoice Management System  
> यह एक React-based वेब एप्लीकेशन है जो Digital Marketing सेवाओं के लिए कैलकुलेशन, क्वोटेशन, इनवॉइस और क्लाइंट मैनेजमेंट को संभालती है।

---

## 📋 विषय सूची (Table of Contents)

- [प्रोजेक्ट परिचय](#-प्रोजेक्ट-परिचय)
- [टेक्नोलॉजी स्टैक](#-टेक्नोलॉजी-स्टैक)
- [प्रोजेक्ट संरचना](#-प्रोजेक्ट-संरचना)
- [इंस्टॉलेशन और सेटअप](#-इंस्टॉलेशन-और-सेटअप)
- [एप्लीकेशन वर्कफ़्लो](#-एप्लीकेशन-वर्कफ़्लो)
- [रोल-बेस्ड एक्सेस](#-रोल-बेस्ड-एक्सेस)
- [एडमिन वर्कफ़्लो](#-एडमिन-owner-वर्कफ़्लो)
- [बिज़नेस डेवलपर वर्कफ़्लो](#-बिज़नेस-डेवलपर-bd-वर्कफ़्लो)
- [क्लाइंट वर्कफ़्लो](#-क्लाइंट-वर्कफ़्लो)
- [रूटिंग संरचना](#-रूटिंग-संरचना)
- [स्टेट मैनेजमेंट](#-स्टेट-मैनेजमेंट)
- [थीम सिस्टम](#-थीम-सिस्टम)
- [एनवायरनमेंट वेरिएबल्स](#-एनवायरनमेंट-वेरिएबल्स)
- [स्क्रिप्ट्स](#-स्क्रिप्ट्स)

---

## 🎯 प्रोजेक्ट परिचय

**Revenue Engine** एक एंटरप्राइज़-लेवल वेब एप्लीकेशन है जो **DOAGURU IT Solution** में Digital Marketing सेवाओं की बिक्री और मैनेजमेंट प्रक्रिया को डिजिटल बनाती है। इसमें तीन मुख्य यूज़र रोल्स हैं:

| रोल | विवरण |
|------|--------|
| **Owner (Admin)** | पूरा सिस्टम मैनेज करता है - क्लाइंट, प्लान, सर्विस, टीम, इनवॉइस सब कुछ |
| **Business Developer (BD)** | क्लाइंट से इंटरैक्ट करता है - क्वोटेशन बनाता है, क्लाइंट डिटेल्स जोड़ता है |
| **Client** | पब्लिक लिंक के ज़रिए अपनी आवश्यकताएं भरता है |

---

## 🛠️ टेक्नोलॉजी स्टैक

| श्रेणी | टेक्नोलॉजी |
|--------|-------------|
| **Frontend Framework** | React 19 + Vite 6 |
| **Styling** | Tailwind CSS 3 + Styled Components 6 |
| **State Management** | Redux Toolkit + Redux Persist |
| **Routing** | React Router DOM 7 (Hash Router) |
| **HTTP Client** | Axios |
| **PDF Generation** | jsPDF + jspdf-autotable |
| **Print** | react-to-print |
| **Icons** | Lucide React + React Icons |
| **UI Alerts** | SweetAlert2 |
| **Animations** | LottieFiles (dotlottie-react) |
| **Date Handling** | Moment.js |
| **Number Conversion** | number-to-words |
| **Pagination** | react-paginate |

---

## 📁 प्रोजेक्ट संरचना

```
client/
├── public/                    # Static assets
├── src/
│   ├── Admin/                 # Owner/Admin मॉड्यूल
│   │   ├── AdminDashboard.jsx         # एडमिन डैशबोर्ड (मुख्य हब)
│   │   ├── AdminClientDetails.jsx      # क्लाइंट डिटेल्स मैनेजमेंट
│   │   ├── AdminCalculator.jsx         # DM सेवा कैलकुलेटर
│   │   ├── AdsCampaignCalculator.jsx   # Ads Campaign कैलकुलेटर
│   │   ├── ServicesLanding.jsx         # सेवाओं का लैंडिंग पेज
│   │   ├── AdminAddPlan.jsx            # नया प्लान जोड़ें
│   │   ├── AdminExplorePlans.jsx       # प्लान एक्सप्लोर करें
│   │   ├── AdminAddServices.jsx        # ग्राफिक/SEO सेवाएं जोड़ें
│   │   ├── AdminAdsCampign.jsx         # Ads Campaign मैनेजमेंट
│   │   ├── AdminComplimentaryData.jsx  # कॉम्प्लिमेंट्री डेटा
│   │   ├── Quotation.jsx              # क्वोटेशन जनरेटर
│   │   ├── QuotationTypeModal.jsx      # क्वोटेशन टाइप मॉडल
│   │   ├── AssignQuotation.jsx         # क्वोटेशन असाइनमेंट
│   │   ├── CreateInvoice.jsx          # इनवॉइस बनाएं
│   │   ├── AdminInvoice.jsx           # इनवॉइस व्यूअर/एडिटर
│   │   ├── InvoiceCustomise.jsx        # इनवॉइस कस्टमाइज़ेशन
│   │   ├── InvoiceCalculation.jsx      # इनवॉइस कैलकुलेशन
│   │   ├── InvoiceAds.jsx             # इनवॉइस Ads कैलकुलेशन
│   │   ├── InvoiceNoteSection.jsx      # इनवॉइस नोट्स
│   │   ├── InvoiceHistory.jsx         # इनवॉइस हिस्ट्री
│   │   ├── InoviceComplimentry.jsx     # इनवॉइस कॉम्प्लिमेंट्री
│   │   ├── DiscountSetting.jsx         # डिस्काउंट सेटिंग्स
│   │   ├── NoteSection.jsx            # क्वोटेशन नोट्स
│   │   ├── History.jsx                # क्वोटेशन हिस्ट्री
│   │   ├── AllHistory.jsx             # सभी हिस्ट्री
│   │   ├── AdminPlanHistory.jsx        # प्लान हिस्ट्री
│   │   ├── AdminServicesHistory.jsx    # सर्विस हिस्ट्री
│   │   ├── CreateTeam.jsx             # टीम बनाएं
│   │   ├── RegisterBD.jsx             # BD रजिस्टर
│   │   ├── GenerateLinkHistory.jsx     # जनरेटेड लिंक हिस्ट्री
│   │   ├── SeoServicesA.jsx           # SEO सेवाएं
│   │   ├── ServiceProgressTable.jsx    # सर्विस प्रोग्रेस टेबल
│   │   ├── ReviewRequirements.jsx      # क्लाइंट आवश्यकताओं की समीक्षा
│   │   ├── AdmindashBoardSettings.jsx  # डैशबोर्ड सेटिंग्स
│   │   ├── SkeletonTable.jsx          # लोडिंग स्केलेटन
│   │   ├── TeamPickerModal.jsx        # टीम पिकर मॉडल
│   │   └── GlobalStyle.jsx            # ग्लोबल स्टाइल्स
│   │
│   ├── BusinessDeveloper/      # BD मॉड्यूल
│   │   ├── BusinessDeveloperDashboard.jsx  # BD डैशबोर्ड (मुख्य हब)
│   │   ├── ClientDetails.jsx               # क्लाइंट डिटेल्स
│   │   ├── CalculatorBD.jsx                # DM कैलकुलेटर
│   │   ├── AdsCampaignCalciBD.jsx          # Ads Campaign कैलकुलेटर
│   │   ├── AddService.jsx                  # सेवाएं जोड़ें
│   │   ├── QuotationBD.jsx                 # क्वोटेशन जनरेटर
│   │   ├── QuotationTypeModalBD.jsx        # क्वोटेशन टाइप मॉडल
│   │   ├── AssignQuotationBD.jsx           # क्वोटेशन असाइनमेंट
│   │   ├── BDInvoice.jsx                   # इनवॉइस व्यूअर/एडिटर
│   │   ├── InvoiceCustomise.jsx            # इनवॉइस कस्टमाइज़ेशन
│   │   ├── InvoiceCalculation.jsx          # इनवॉइस कैलकुलेशन
│   │   ├── InvoiceAds.jsx                  # इनवॉइस Ads
│   │   ├── InvoiceNoteSection.jsx          # इनवॉइस नोट्स
│   │   ├── InvoiceHistory.jsx              # इनवॉइस हिस्ट्री
│   │   ├── InoviceComplmentry.jsx          # इनवॉइस कॉम्प्लिमेंट्री
│   │   ├── DiscountSetting.jsx             # डिस्काउंट सेटिंग्स
│   │   ├── BDNoteSection.jsx               # क्वोटेशन नोट्स
│   │   ├── HistoryBD.jsx                   # क्वोटेशन हिस्ट्री
│   │   ├── AllHistory.jsx                  # सभी हिस्ट्री
│   │   ├── BdExplorePlans.jsx              # प्लान एक्सप्लोर
│   │   ├── GenerateLinkHistoryBD.jsx       # जनरेटेड लिंक हिस्ट्री
│   │   ├── SeoServices.jsx                 # SEO सेवाएं
│   │   └── ServiceProgressTableBD.jsx      # सर्विस प्रोग्रेस
│   │
│   ├── Client/                 # क्लाइंट मॉड्यूल
│   │   └── PublicRequirementForm.jsx       # पब्लिक आवश्यकता फ़ॉर्म
│   │
│   ├── Components/             # शेयर्ड कंपोनेंट्स
│   │   ├── Header.jsx                    # हेडर कंपोनेंट
│   │   ├── NavTabs.jsx                   # नेविगेशन टैब्स
│   │   ├── ThemeToggle.jsx               # थीम टॉगल बटन
│   │   ├── Clientmode.jsx                # क्लाइंट मोड व्यू
│   │   ├── Quotationmode.jsx             # क्वोटेशन मोड व्यू
│   │   ├── InvoiceServices.jsx           # इनवॉइस सर्विसेज़
│   │   └── ConvertLetterhead.jsx         # लेटरहेड कन्वर्टर
│   │
│   ├── Routers/                # रूटिंग
│   │   ├── AdminRouter.jsx               # एडमिन रूट्स
│   │   └── BDRouter.jsx                  # BD रूट्स
│   │
│   ├── Screens/                # ऑथेंटिकेशन स्क्रीन
│   │   ├── Login.jsx                     # लॉगिन पेज
│   │   └── ForgotPassword.jsx            # पासवर्ड रीसेट
│   │
│   ├── config/                 # कॉन्फ़िगरेशन
│   │   ├── apiBaseUrl.js                 # API Base URL
│   │   └── sfBaseUrl.js                  # SF Base URL
│   │
│   ├── context/                # कॉन्टेक्स्ट
│   │   └── ThemeContext.jsx              # थीम कॉन्टेक्स्ट (Dark/Light)
│   │
│   ├── redux/                  # Redux State
│   │   ├── store.js                      # Redux Store + Persist
│   │   └── user/userSlice.js             # User Auth Slice
│   │
│   ├── styles/                 # स्टाइल्स
│   │   └── theme.css                     # थीम CSS वेरिएबल्स
│   │
│   ├── assets/                 # इमेजेज़ और मीडिया
│   ├── App.jsx                 # मुख्य ऐप कंपोनेंट
│   ├── main.jsx                # ऐप एंट्री पॉइंट
│   └── index.css               # ग्लोबल CSS
│
├── .env                        # एनवायरनमेंट वेरिएबल्स
├── .env.example                # एनवायरनमेंट वेरिएबल्स टेम्पलेट
├── package.json                # डिपेंडेंसीज़
├── vite.config.js              # Vite कॉन्फ़िग
├── tailwind.config.js          # Tailwind कॉन्फ़िग
├── postcss.config.js           # PostCSS कॉन्फ़िग
└── eslint.config.js            # ESLint कॉन्फ़िग
```

---

## 🚀 इंस्टॉलेशन और सेटअप

### 1. प्री-रिक्विज़िट्स
- **Node.js** >= 18.x
- **npm** >= 9.x (या yarn/pnpm)

### 2. इंस्टॉलेशन

```bash
# रिपॉज़िटरी क्लोन करें
git clone <repository-url>
cd client

# डिपेंडेंसीज़ इंस्टॉल करें
npm install
```

### 3. एनवायरनमेंट सेटअप

```bash
# .env फ़ाइल बनाएं
cp .env.example .env
```

`.env` फ़ाइल में निम्नलिखित सेट करें:
```env
# Local backend
VITE_API_BASE_URL=http://localhost:5000

# Production backend
# VITE_API_BASE_URL=https://revenueengine.siarasystems.com
```

### 4. ऐप चलाएं

```bash
# Development server शुरू करें
npm run dev

# Production build बनाएं
npm run build

# Production build प्रीव्यू करें
npm run preview
```

---

## 🔄 एप्लीकेशन वर्कफ़्लो

### समग्र वर्कफ़्लो आरेख (Overall Workflow Diagram)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DM CALCULATOR SYSTEM                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐     ┌──────────────────────┐     ┌────────────────┐  │
│  │  LOGIN    │────▶│  ROLE-BASED ROUTING  │────▶│  DASHBOARD     │  │
│  │  SCREEN   │     │  (Owner / BD)        │     │  (Admin / BD)  │  │
│  └──────────┘     └──────────────────────┘     └────────────────┘  │
│       │                                              │              │
│       │              ┌───────────────────────────────┤              │
│       │              │                               │              │
│       ▼              ▼                               ▼              │
│  ┌──────────┐  ┌──────────┐              ┌──────────────────┐     │
│  │ FORGOT   │  │  ADMIN   │              │    BD            │     │
│  │ PASSWORD │  │  PANEL   │              │    PANEL         │     │
│  └──────────┘  └────┬─────┘              └────────┬─────────┘     │
│                     │                              │               │
│     ┌───────────────┼──────────────┐   ┌──────────┼──────────┐    │
│     │               │              │   │          │          │    │
│     ▼               ▼              ▼   ▼          ▼          ▼    │
│  ┌───────┐   ┌──────────┐   ┌────────┐ ┌──────┐ ┌──────┐ ┌────┐ │
│  │CLIENT │   │QUOTATION │   │INVOICE │ │CLIENT│ │QUOT- │ │INVO│ │
│  │MGMT   │   │WORKFLOW  │   │WORKFLOW│ │MGMT  │ │ATION │ │ICE │ │
│  └───────┘   └──────────┘   └────────┘ └──────┘ └──────┘ └────┘ │
│                                                                     │
│              ┌──────────────────────────────┐                       │
│              │     PUBLIC CLIENT LINK       │                       │
│              │  /public/r/:slug             │                       │
│              │  (Client fills requirements) │                       │
│              └──────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 रोल-बेस्ड एक्सेस

```
┌──────────────────────────────────────────────────────────┐
│                    लॉगिन प्रक्रिया                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│   यूज़र लॉगिन करता है (Email + Password)                  │
│            │                                             │
│            ▼                                             │
│   POST /auth/api/calculator/login                        │
│            │                                             │
│            ▼                                             │
│   ┌─────────────────┐                                   │
│   │  रोल चेक        │                                   │
│   └────┬───────┬─────┘                                   │
│        │       │                                         │
│   ┌────▼───┐   ┌──▼──────┐                              │
│   │ Owner  │   │   BD    │                              │
│   │(Admin) │   │(Business│                              │
│   │        │   │Developer│                              │
│   └────┬───┘   └────┬────┘                              │
│        │            │                                    │
│        ▼            ▼                                    │
│   /admin/*      /BD/*                                   │
│   dashboard     dashboard                                │
└──────────────────────────────────────────────────────────┘
```

### रोल अनुसार डैशबोर्ड टैब्स

| टैब | Admin (Owner) | BD |
|-----|:---:|:---:|
| Client Details | ✅ | ✅ |
| Explore Plans | ✅ | ✅ |
| Quotation History | ✅ | ✅ |
| Invoice History | ✅ | ✅ |
| Assign | ✅ | ✅ |
| Generate Link | ✅ | ✅ |
| Website SEO | ✅ | ✅ |
| Convert Letterhead | ✅ | ✅ |
| Create Invoice | ✅ | ❌ |
| Dashboard Settings | ✅ | ❌ |

---

## 👑 एडमिन (Owner) वर्कफ़्लो

### एडमिन डैशबोर्ड से सभी ऑपरेशन

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN (Owner) WORKFLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📌 STEP 1: क्लाइंट जोड़ें                                      │
│  ┌──────────────────┐    ┌───────────────────────────────┐     │
│  │ Client Details   │───▶│ नया क्लाइंट रजिस्टर करें       │     │
│  │ Tab              │    │ क्लाइंट की जानकारी भरें        │     │
│  └──────────────────┘    └───────────────────────────────┘     │
│            │                                                    │
│            ▼                                                    │
│  📌 STEP 2: सेवा कैलकुलेशन                                     │
│  ┌──────────────────┐    ┌───────────────────────────────┐     │
│  │ Calculator       │───▶│ DM सेवाओं का कैलकुलेशन        │     │
│  │ /calculator/:id  │    │ SEO, SMO, PPC, etc.           │     │
│  └──────────────────┘    └───────────────────────────────┘     │
│            │                                                    │
│            ├──────────────────────────────────┐                 │
│            ▼                                  ▼                 │
│  ┌──────────────────┐              ┌──────────────────────┐    │
│  │ Ads Campaign     │              │ Services Landing     │    │
│  │ Calculator       │              │ Page                 │    │
│  │ /Adscalculator/  │              │ /ServicesLanding/    │    │
│  └──────────────────┘              └──────────────────────┘    │
│            │                                                    │
│            ▼                                                    │
│  📌 STEP 3: क्वोटेशन बनाएं                                      │
│  ┌──────────────────┐    ┌───────────────────────────────┐     │
│  │ Quotation        │───▶│ क्वोटेशन जनरेट करें           │     │
│  │ /quotation/:id   │    │ टाइप चुनें (Regular/Custom)  │     │
│  └──────────────────┘    └───────────────────────────────┘     │
│            │                                                    │
│            ▼                                                    │
│  ┌──────────────────┐    ┌───────────────────────────────┐     │
│  │ Note Section     │───▶│ क्वोटेशन में नोट्स जोड़ें     │     │
│  │ /note-section/   │    │ टर्म्स और कंडीशन्स           │     │
│  └──────────────────┘    └───────────────────────────────┘     │
│            │                                                    │
│            ▼                                                    │
│  📌 STEP 4: क्वोटेशन असाइन करें                                 │
│  ┌──────────────────┐    ┌───────────────────────────────┐     │
│  │ Assign Quotation │───▶│ BD को क्वोटेशन असाइन करें    │     │
│  │ Tab              │    │ टीम मेंबर चुनें              │     │
│  └──────────────────┘    └───────────────────────────────┘     │
│            │                                                    │
│            ▼                                                    │
│  📌 STEP 5: इनवॉइस बनाएं                                       │
│  ┌──────────────────┐    ┌───────────────────────────────┐     │
│  │ Create Invoice   │───▶│ नया इनवॉइस बनाएं             │     │
│  │ Tab              │    │ क्लाइंट और सेवाएं चुनें      │     │
│  └──────────────────┘    └───────────────────────────────┘     │
│            │                                                    │
│            ▼                                                    │
│  ┌──────────────────────────────────────────────────────┐      │
│  │              INVOICE WORKFLOW                         │      │
│  │                                                       │      │
│  │  Invoice Calculator ──▶ Invoice Customise             │      │
│  │  /invoice-calculator/    /invoice-edit/               │      │
│  │         │                                              │      │
│  │         ├──▶ Invoice Ads Calculator                   │      │
│  │         │    /invoice-Adscalculator/                   │      │
│  │         │                                              │      │
│  │         ├──▶ Invoice Note Section                     │      │
│  │         │    /invoice-note-section/                    │      │
│  │         │                                              │      │
│  │         ├──▶ Discount Setting                         │      │
│  │         │    /discount-setting/                        │      │
│  │         │                                              │      │
│  │         └──▶ Invoice Complimentary                    │      │
│  │              /complimentary/                           │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                 │
│  📌 अन्य एडमिन फ़ंक्शन्स:                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ Add Plan         │  │ Add Services     │  │ Register BD  │  │
│  │ /add-plan        │  │ (Graphic/SEO)    │  │ (नया BD)     │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ Create Team      │  │ Dashboard        │  │ Generate     │  │
│  │ /createteam      │  │ Settings         │  │ Link History │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💼 बिज़नेस डेवलपर (BD) वर्कफ़्लो

```
┌─────────────────────────────────────────────────────────────────┐
│                 BUSINESS DEVELOPER (BD) WORKFLOW                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📌 STEP 1: क्लाइंट डिटेल्स जोड़ें                               │
│  ┌──────────────────┐    ┌───────────────────────────────┐     │
│  │ Client Details   │───▶│ क्लाइंट की जानकारी दर्ज करें  │     │
│  │ Tab              │    │ बिज़नेस डिटेल्स भरें          │     │
│  └──────────────────┘    └───────────────────────────────┘     │
│            │                                                    │
│            ▼                                                    │
│  📌 STEP 2: सेवा कैलकुलेशन                                     │
│  ┌──────────────────┐    ┌───────────────────────────────┐     │
│  │ Calculator BD    │───▶│ DM सेवाओं का कैलकुलेशन        │     │
│  │ /calculator/:id  │    │ क्लाइंट के बजट अनुसार        │     │
│  └──────────────────┘    └───────────────────────────────┘     │
│            │                                                    │
│            ▼                                                    │
│  ┌──────────────────┐                                          │
│  │ Ads Campaign     │    (BD के लिए भी उपलब्ध)                │
│  │ Calculator BD    │                                          │
│  └──────────────────┘                                          │
│            │                                                    │
│            ▼                                                    │
│  📌 STEP 3: क्वोटेशन बनाएं                                      │
│  ┌──────────────────┐    ┌───────────────────────────────┐     │
│  │ Quotation BD     │───▶│ क्वोटेशन जनरेट करें           │     │
│  │ /quotation/:id   │    │ BD स्पेसिफिक क्वोटेशन        │     │
│  └──────────────────┘    └───────────────────────────────┘     │
│            │                                                    │
│            ▼                                                    │
│  📌 STEP 4: क्वोटेशन असाइन करें                                 │
│  ┌──────────────────┐    ┌───────────────────────────────┐     │
│  │ Assign Quotation │───▶│ क्वोटेशन असाइनमेंट           │     │
│  │ BD               │    │ BD लेवल पर                    │     │
│  └──────────────────┘    └───────────────────────────────┘     │
│            │                                                    │
│            ▼                                                    │
│  📌 STEP 5: इनवॉइस वर्कफ़्लो (Admin के समान)                   │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  BD Invoice ──▶ Invoice Customise                    │      │
│  │  /invoice/      /invoice-edit/                       │      │
│  │         │                                            │      │
│  │         ├──▶ Invoice Calculator                      │      │
│  │         ├──▶ Invoice Ads Calculator                  │      │
│  │         ├──▶ Invoice Note Section                    │      │
│  │         └──▶ Discount Setting                        │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                 │
│  📌 अन्य BD फ़ंक्शन्स:                                          │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ Explore Plans    │  │ Generate Link    │                    │
│  │ BD               │  │ History BD       │                    │
│  └──────────────────┘  └──────────────────┘                    │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ SEO Services     │  │ Add Service      │                    │
│  │ BD               │  │ /AddService/     │                    │
│  └──────────────────┘  └──────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 👤 क्लाइंट वर्कफ़्लो

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT WORKFLOW                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📌 क्लाइंट को पब्लिक लिंक भेजा जाता है                         │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  Generate Link (Admin/BD द्वारा)                     │      │
│  │  Unique slug के साथ पब्लिक लिंक जनरेट होता है       │      │
│  └──────────────────────┬───────────────────────────────┘      │
│                         │                                       │
│                         ▼                                       │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  Client Link: /public/r/:slug                        │      │
│  │  (PublicRequirementForm.jsx)                         │      │
│  │                                                       │      │
│  │  क्लाइंट भरता है:                                     │      │
│  │  • बिज़नेस का नाम                                     │      │
│  │  • वेबसाइट URL                                       │      │
│  │  • संपर्क जानकारी                                     │      │
│  │  • Digital Marketing आवश्यकताएं                      │      │
│  │  • बजट रेंज                                          │      │
│  │  • अन्य विशेषताएं                                    │      │
│  └──────────────────────┬───────────────────────────────┘      │
│                         │                                       │
│                         ▼                                       │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  Review Requirements (Admin द्वारा)                  │      │
│  │  /review/:linkId                                     │      │
│  │  Admin क्लाइंट की आवश्यकताओं की समीक्षा करता है     │      │
│  └──────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛤️ रूटिंग संरचना

### पब्लिक रूट्स
| पाथ | कंपोनेंट | विवरण |
|------|-----------|--------|
| `/` | Login | लॉगिन पेज |
| `/password-reset` | ForgotPassword | पासवर्ड रीसेट |
| `/public/r/:slug` | PublicRequirementForm | क्लाइंट पब्लिक फ़ॉर्म |

### एडमिन रूट्स (`/admin/*`)
| पाथ | कंपोनेंट | विवरण |
|------|-----------|--------|
| `/admin/dashboard` | AdminDashboard | एडमिन डैशबोर्ड |
| `/admin/calculator/:id/:proposalId` | AdminCalculator | DM कैलकुलेटर |
| `/admin/Adscalculator/:id/:proposalId` | AdsCampaignCalculator | Ads Campaign कैलकुलेटर |
| `/admin/ServicesLanding/:id/:proposalId` | ServicesLanding | सेवाएं लैंडिंग |
| `/admin/add-plan` | AdminAddPlan | प्लान जोड़ें |
| `/admin/plan-details/:id` | AdminPlanHistory | प्लान हिस्ट्री |
| `/admin/complimentary/:id/:proposalId` | AdminComplimentaryData | कॉम्प्लिमेंट्री |
| `/admin/quotation/:id/:txn_id` | Quotation | क्वोटेशन |
| `/admin/note-section/:id/:txn_id` | NoteSection | क्वोटेशन नोट्स |
| `/admin/invoice/:id/:txn_id` | AdminInvoice | इनवॉइस |
| `/admin/invoice-services` | InvoiceServices | इनवॉइस सर्विसेज़ |
| `/admin/invoice-edit/:id/:txn_id` | InvoiceCustomise | इनवॉइस कस्टमाइज़ |
| `/admin/invoice-calculator/:id/:proposalId` | InvoiceCalculation | इनवॉइस कैलकुलेशन |
| `/admin/invoice-Adscalculator/:id/:proposalId` | InvoiceAds | इनवॉइस Ads |
| `/admin/invoice-note-section/:id/:txn_id` | InvoiceNoteSection | इनवॉइस नोट्स |
| `/admin/Invoice-history` | InvoiceHistory | इनवॉइस हिस्ट्री |
| `/admin/discount-setting/:id/:txn_id` | DiscountSetting | डिस्काउंट |
| `/admin/history/:id` | History | क्वोटेशन हिस्ट्री |
| `/admin/review/:linkId` | ReviewRequirements | आवश्यकताएं समीक्षा |

### BD रूट्स (`/BD/*`)
| पाथ | कंपोनेंट | विवरण |
|------|-----------|--------|
| `/BD/dashboard` | BusinessDeveloperDashboard | BD डैशबोर्ड |
| `/BD/AddService/:id/:proposalId` | AddService | सेवाएं जोड़ें |
| `/BD/calculator/:id/:proposalId` | CalculatorBD | DM कैलकुलेटर |
| `/BD/Adscalculator/:id/:proposalId` | AdsCampaignCalciBD | Ads Campaign |
| `/BD/quotation/:id/:txn_id` | QuotationBD | क्वोटेशन |
| `/BD/note-section/:id/:txn_id` | BDNoteSection | क्वोटेशन नोट्स |
| `/BD/invoice/:id/:txn_id` | BDInvoice | इनवॉइस |
| `/BD/invoice-edit/:id/:txn_id` | InvoiceCustomise | इनवॉइस कस्टमाइज़ |
| `/BD/invoice-calculator/:id/:proposalId` | InvoiceCalculation | इनवॉइस कैलकुलेशन |
| `/BD/invoice-Adscalculator/:id/:proposalId` | InvoiceAds | इनवॉइस Ads |
| `/BD/invoice-note-section/:id/:txn_id` | InvoiceNoteSection | इनवॉइस नोट्स |
| `/BD/Invoice-history` | InvoiceHistory | इनवॉइस हिस्ट्री |
| `/BD/discount-setting/:id/:proposalId` | DiscountSetting | डिस्काउंट |
| `/BD/client/service/history/:id` | HistoryBD | सर्विस हिस्ट्री |
| `/BD/review/:linkId` | ReviewRequirements | आवश्यकताएं समीक्षा |

---

## 🗃️ स्टेट मैनेजमेंट

```
┌──────────────────────────────────────────────────────────┐
│                   REDUX STORE                            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  user Slice (userSlice.js)                       │   │
│  │                                                   │   │
│  │  State:                                           │   │
│  │  ├── currentUser: {                              │   │
│  │  │     role: "Owner" | "BD"                      │   │
│  │  │     email: string                             │   │
│  │  │     ...other user data                        │   │
│  │  │   }                                           │   │
│  │                                                   │   │
│  │  Actions:                                         │   │
│  │  ├── setUser(userData)   # लॉगिन पर यूज़र सेट   │   │
│  │  └── clearUser()         # लॉगआउट पर यूज़र हटाएं│   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Redux Persist                                   │   │
│  │  ├── Key: "root"                                │   │
│  │  ├── Storage: localStorage                      │   │
│  │  └── Version: 1                                 │   │
│  │                                                   │   │
│  │  → पेज रीफ्रेश होने पर भी यूज़र डेटा बना रहता है │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

---

## 🎨 थीम सिस्टम

```
┌──────────────────────────────────────────────────────────┐
│                   THEME SYSTEM                           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ThemeContext.jsx → Dark/Light मोड टॉगल                  │
│                                                          │
│  ┌─────────────┐     ┌──────────────────┐               │
│  │  Dark Mode  │◀───▶│   Light Mode     │               │
│  │  (Default)  │     │                  │               │
│  └─────────────┘     └──────────────────┘               │
│         │                     │                          │
│         ▼                     ▼                          │
│  data-theme="dark"    data-theme="light"                │
│         │                     │                          │
│         ▼                     ▼                          │
│  theme.css वेरिएबल्स → CSS Custom Properties            │
│                                                          │
│  Storage: localStorage ("app-theme")                     │
│  → यूज़र की प्राथमिकता सेव रहती है                      │
└──────────────────────────────────────────────────────────┘
```

---

## ⚙️ एनवायरनमेंट वेरिएबल्स

| वेरिएबल | विवरण | डिफ़ॉल्ट |
|----------|--------|----------|
| `VITE_API_BASE_URL` | Backend API Base URL | `http://localhost:5000` |

### API कॉन्फ़िगरेशन
- **config/apiBaseUrl.js** → `VITE_API_BASE_URL` को पढ़ता है, fallback: `http://localhost:5000`
- **config/sfBaseUrl.js** → अतिरिक्त API URL कॉन्फ़िगरेशन

---

## 📜 स्क्रिप्ट्स

| कमांड | विवरण |
|--------|--------|
| `npm run dev` | Development server शुरू करें (Vite + Hot Reload + Network Host) |
| `npm run build` | Production build बनाएं |
| `npm run preview` | Production build को प्रीव्यू करें |
| `npm run lint` | ESLint से कोड चेक करें |

---

## 🔑 मुख्य विशेषताएं

1. **📊 DM Service Calculator** - SEO, SMO, PPC, Content Marketing आदि का कैलकुलेशन
2. **📝 Quotation Generator** - क्लाइंट के लिए प्रोफेशनल क्वोटेशन बनाएं
3. **🧾 Invoice Management** - पूरा इनवॉइस वर्कफ़्लो (Create → Customise → Calculate → Notes → Discount)
4. **👥 Role-Based Access** - Owner और BD के लिए अलग-अलग डैशबोर्ड
5. **🔗 Public Client Links** - क्लाइंट को लिंक भेजकर आवश्यकताएं प्राप्त करें
6. **🎨 Dark/Light Theme** - यूज़र प्राथमिकता अनुसार थीम
7. **📄 PDF Generation** - jsPDF से क्वोटेशन/इनवॉइस का PDF बनाएं
8. **🖨️ Print Support** - react-to-print से सीधे प्रिंट करें
9. **📋 Letterhead Converter** - डॉक्यूमेंट को कंपनी लेटरहेड में बदलें
10. **📈 SEO Services** - Website SEO सेवाओं का मैनेजमेंट
11. **💰 Discount Management** - क्वोटेशन/इनवॉइस पर डिस्काउंट सेट करें
12. **🏪 Plan Management** - DM प्लान जोड़ें, एक्सप्लोर करें और मैनेज करें
13. **👥 Team Management** - टीम बनाएं और BD रजिस्टर करें (Admin only)
14. **📜 History Tracking** - क्वोटेशन, इनवॉइस और सर्विस हिस्ट्री

---

## 🏢 DOAGURU IT Solution

> Digital Marketing Solutions Provider  
> Website: [dentalguru.software](https://revenueengine.siarasystems.com)
