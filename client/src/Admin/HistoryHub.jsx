import React, { lazy, Suspense, useState, useEffect } from "react";
import {
  FileText,
  Receipt,
  TrendingUp,
  Clock,
  Scale,
  Menu,
  X,
} from "lucide-react";

// Lazy-load actual history components
const ProposalHistory = lazy(() => import("./ProposalHistory"));
const InvoiceHistory = lazy(() => import("./InvoiceHistory"));
const ProformaHistory = lazy(() => import("./ProformaHistory"));
const RevenueHistory = lazy(() => import("./RevenueHistory"));
const BalanceProformaHistory = lazy(() => import("./BalanceProformaHistory"));
const PaymentHistory = lazy(() => import("./PaymentHistory"));
import ProformaManagerModal from "./components/ProformaManagerModal";
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

// ─── Sub-tab config ─────────────────────────────────────────────────────────
const SUB_TABS = [
  {
    id: "proposals",
    label: "Proposal ",
    icon: FileText,
    color: "#a78bfa", // violet
  },

  {
    id: "proforma",
    label: "Proforma ",
    icon: FileCode,
    color: "#38bdf8", // sky
  },

  {
    id: "balance_proforma",
    label: "Balance Proforma",
    icon: Scale,
    color: "#f472b6", // pink
  },
  {
    id: "payment_history",
    label: "Payment History",
    icon: Receipt,
    color: "#f97316", // orange
  },


  {
    id: "invoices",
    label: "Invoice ",
    icon: Receipt,
    color: "#34d399", // emerald
  },




  {
    id: "revenue",
    label: "Revenue ",
    icon: TrendingUp,
    color: "#fbbf24", // amber
  },
];

// ─── Main HistoryHub Component ───────────────────────────────────────────────
const HistoryHub = ({ setActiveTab }) => {
  const [activeSubTab, setActiveSubTab] = useState(() => {
    return localStorage.getItem("history-hub-active-tab") || "proposals";
  });

  useEffect(() => {
    localStorage.setItem("history-hub-active-tab", activeSubTab);
  }, [activeSubTab]);
  const [showProformaManager, setShowProformaManager] = useState(false);
  const [selectedProposalForManager, setSelectedProposalForManager] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const openProformaManager = (proposal) => {
    setSelectedProposalForManager(proposal);
    setShowProformaManager(true);
  };

  const activeTabConfig = SUB_TABS.find((t) => t.id === activeSubTab);

  return (
    <div className="w-full min-h-full flex flex-col md:flex-row relative gap-4 md:gap-6">
      
      {/* ── Mobile Top Bar ─────────────────────────────────────────────────── */}
      <div className="md:hidden flex items-center justify-between bg-gray-900/80 backdrop-blur-xl border border-gray-800/60 rounded-xl px-4 py-3 z-30">
        <div className="flex items-center gap-2 font-semibold text-lg" style={{ color: activeTabConfig?.color || '#fff' }}>
          {activeTabConfig?.icon && React.createElement(activeTabConfig.icon, { className: "w-5 h-5" })}
          {activeTabConfig?.label}
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* ── Sub-tab Sidebar (Desktop & Mobile Drawer) ──────────────────────── */}
      <div className={`
        absolute md:sticky md:top-0 top-[60px] left-0 right-0 z-20 
        w-full md:w-64 flex-col gap-2 h-fit
        transition-all duration-300 ease-in-out
        ${isMobileMenuOpen 
          ? 'translate-y-0 opacity-100 pointer-events-auto shadow-2xl' 
          : '-translate-y-4 opacity-0 pointer-events-none md:translate-y-0 md:opacity-100 md:pointer-events-auto md:shadow-none'
        }
        flex
        bg-gray-900/95 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none
        border border-gray-800/60 md:border-none
        rounded-xl md:rounded-none
        p-4 md:p-0
        md:border-r md:border-gray-800/60 md:pr-6
        md:shrink-0
      `}>
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id);
                setIsMobileMenuOpen(false); // Close on mobile after selecting
              }}
              className={[
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 w-full text-left",
                isActive
                  ? "text-white shadow-md"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60",
              ].join(" ")}
              style={
                isActive
                  ? {
                      background: tab.color + "22",
                      border: `1px solid ${tab.color}55`,
                      color: tab.color,
                    }
                  : { border: "1px solid transparent" }
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Sub-tab Content ─────────────────────────────────────────────── */ }
      <div className="flex-1 w-full overflow-hidden">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          { activeSubTab === "proposals" && <ProposalHistory /> }
          { activeSubTab === "proforma" && <ProformaHistory openProformaManager={ openProformaManager } setActiveTab={setActiveTab} /> }

          { activeSubTab === "invoices" && <InvoiceHistory /> }


          { activeSubTab === "balance_proforma" && <BalanceProformaHistory /> }
          { activeSubTab === "payment_history" && <PaymentHistory /> }

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

export default HistoryHub;
