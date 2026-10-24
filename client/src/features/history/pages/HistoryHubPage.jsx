import React, { lazy, Suspense, useState, useEffect } from "react";
import {
  FileText,
  Receipt,
  TrendingUp,
  Clock,
  Scale,
} from "lucide-react";

// Lazy-load actual history components
const ProposalHistory = lazy(() => import("./ProposalHistoryPage"));
const QuotationHistory = lazy(() => import("./QuotationHistoryPage"));
const InvoiceHistory = lazy(() => import("./InvoiceHistoryPage"));
const ProformaHistory = lazy(() => import("./ProformaHistoryPage"));
const RevenueHistory = lazy(() => import("./RevenueHistoryPage"));
const BalanceProformaHistory = lazy(() => import("./BalanceProformaHistoryPage"));
const PaymentHistory = lazy(() => import("./PaymentHistoryPage"));
import ProformaManagerModal from "../components/ProformaManagerModal";
import { FileCode } from "lucide-react";

// ─── Placeholder for future tabs ───────────────────────────────────────────
const ComingSoonPlaceholder = ({ title, description, icon: Icon, color }) => (
  <div className="flex flex-col items-center justify-center py-28 px-6 text-center select-none">
    <div
      className={ `w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg` }
      style={ { background: color + "22", border: `1.5px solid ${color}44` } }
    >
      <Icon className="w-9 h-9" style={ { color } } />
    </div>
    <h3 className="text-2xl font-bold text-white mb-2">{ title }</h3>
    <p className="text-gray-400 text-sm max-w-xs leading-relaxed">{ description }</p>
    <span
      className="mt-6 inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold border"
      style={ { color, borderColor: color + "55", background: color + "18" } }
    >
      <Clock className="w-3.5 h-3.5" />
      Coming Soon
    </span>
  </div>
);

import { useTheme } from "../../../context/ThemeContext";

// ─── Sub-tab config ─────────────────────────────────────────────────────────
const SUB_TABS = [
  {
    id: "proposals",
    label: "Proposal ",
    icon: FileText,
    colorDark: "#a78bfa", // violet
    colorLight: "#6d28d9",
  },
  {
    id: "quotations",
    label: "Quotation",
    icon: FileText,
    colorDark: "#fb923c",
    colorLight: "#ea580c",
  },
  {
    id: "proforma",
    label: "Proforma ",
    icon: FileCode,
    colorDark: "#38bdf8", // sky
    colorLight: "#0284c7",
  },
  {
    id: "balance_proforma",
    label: "Balance Proforma",
    icon: Scale,
    colorDark: "#f472b6", // pink
    colorLight: "#be185d",
  },
  {
    id: "payment_history",
    label: "Payment History",
    icon: Receipt,
    colorDark: "#f97316", // orange
    colorLight: "#c2410c",
  },
  {
    id: "invoices",
    label: "Invoice ",
    icon: Receipt,
    colorDark: "#34d399", // emerald
    colorLight: "#047857",
  },
  {
    id: "revenue",
    label: "Revenue ",
    icon: TrendingUp,
    colorDark: "#fbbf24", // amber
    colorLight: "#b45309",
  },
];

// ─── Main HistoryHub Component ───────────────────────────────────────────────
const HistoryHubPage = ({ setActiveTab }) => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [activeSubTab, setActiveSubTab] = useState(() => {
    return localStorage.getItem("history-hub-active-tab") || "proposals";
  });

  useEffect(() => {
    localStorage.setItem("history-hub-active-tab", activeSubTab);
  }, [activeSubTab]);
  const [showProformaManager, setShowProformaManager] = useState(false);
  const [selectedProposalForManager, setSelectedProposalForManager] = useState(null);

  const openProformaManager = (proposal) => {
    setSelectedProposalForManager(proposal);
    setShowProformaManager(true);
  };

  return (
    <div className="history-touch w-full min-w-0 min-h-full flex flex-col xl:flex-row relative gap-4 xl:gap-6">
      <div className="xl:hidden min-w-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SUB_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            const tabColor = isLight ? tab.colorLight : tab.colorDark;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                className="min-h-11 w-full touch-manipulation flex items-center justify-center gap-2 px-3 rounded-xl text-sm font-semibold"
                style={
                  isActive
                    ? {
                        background: tabColor + (isLight ? "18" : "22"),
                        border: `1.5px solid ${tabColor}55`,
                        color: tabColor,
                      }
                    : {
                        background: isLight ? "#ffffff" : "rgba(17,24,39,0.8)",
                        border: "1.5px solid rgba(148,163,184,0.35)",
                        color: isLight ? "#1f2937" : "#e5e7eb",
                      }
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {tab.label.trim()}
              </button>
            );
          })}
        </div>
      </div>

      <div className="hidden xl:flex xl:sticky xl:top-0 w-56 xl:w-64 flex-col gap-2 h-fit shrink-0 xl:border-r xl:border-gray-200 dark:xl:border-gray-800/60 xl:pr-6">
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          const tabColor = isLight ? tab.colorLight : tab.colorDark;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={[
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 w-full text-left",
                isActive
                  ? "shadow-md font-bold"
                  : isLight
                    ? "text-gray-700 hover:text-gray-950 hover:bg-orange-500/10"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60",
              ].join(" ")}
              style={
                isActive
                  ? {
                      background: tabColor + (isLight ? "18" : "22"),
                      border: `1.5px solid ${tabColor}55`,
                      color: tabColor,
                    }
                  : {
                      border: "1.5px solid transparent",
                      color: isLight ? "#374151" : undefined,
                    }
              }
            >
              <Icon
                className="w-5 h-5 shrink-0"
                style={{ color: isActive ? tabColor : (isLight ? "#4b5563" : undefined) }}
              />
              <span style={{ color: isActive ? tabColor : (isLight ? "#1f2937" : undefined) }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 w-full min-w-0">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          { activeSubTab === "proposals" && <ProposalHistory /> }
          { activeSubTab === "quotations" && <QuotationHistory /> }
          { activeSubTab === "proforma" && <ProformaHistory openProformaManager={ openProformaManager } setActiveTab={setActiveTab} /> }

          { activeSubTab === "invoices" && <InvoiceHistory /> }


          { activeSubTab === "balance_proforma" && <BalanceProformaHistory /> }
          { activeSubTab === "payment_history" && <PaymentHistory openProformaManager={ openProformaManager } /> }

          { activeSubTab === "revenue" && <RevenueHistory /> }
        </Suspense>
      </div>

      <ProformaManagerModal
        isOpen={ showProformaManager }
        onClose={ () => {
          setShowProformaManager(false);
          setSelectedProposalForManager(null);
        } }
        proposal={ selectedProposalForManager }
      />
    </div>
  );
};

export default HistoryHubPage;
