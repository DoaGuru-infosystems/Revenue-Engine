import React, { lazy, useState } from "react";
import ThemeToggle from "../../../Components/ThemeToggle";
import { useTheme } from "../../../context/ThemeContext";
import {
  User,
  Clock,
  LogOut,
  Menu,
  X,
  List,
  Link,
  TrendingUp,
  FileText,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { clearUser } from "../../../redux/user/userSlice";
import NavTabs from "../../../Components/NavTabs";

const BD_ALLOWED_TABS = new Set([
  "clients",
  "history",
  "invoicehistory",
  "exploreplan",
  "generatelink",
  "seo",
  "convert-letterhead",
]);

function getInitialBdTab() {
  const saved = localStorage.getItem("bd-active-tab");
  if (saved && BD_ALLOWED_TABS.has(saved)) return saved;
  if (saved === "assign" || saved === "Convert Letterhead ") {
    localStorage.setItem("bd-active-tab", "clients");
  }
  return "clients";
}

const AllHistory = lazy(() => import("../../history/pages/AllTransactionHistoryBDPage"));
const InvoiceHistory = lazy(() => import("../../history/pages/InvoiceHistoryPage"));
const ClientDetails = lazy(() => import("./BDClientDetailsPage"));
const BdExplorePlans = lazy(() => import("./BdExplorePlansPage"));
const GenerateLinkHistoryBD = lazy(() => import("./GenerateLinkHistoryBDPage"));
const SeoServices = lazy(() => import("../../../shared/SeoServices"));
const ConvertLetterhead = lazy(() => import("../../../Components/ConvertLetterhead"));

export default function BusinessDeveloperDashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [activeTab, setActiveTab] = useState(getInitialBdTab);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTabChange = (tabId) => {
    const next = BD_ALLOWED_TABS.has(tabId) ? tabId : "clients";
    setActiveTab(next);
    setMobileMenuOpen(false);
  };

  const tabs = [
    { id: "clients", label: "Client Details", icon: User },
    { id: "history", label: "Quotation History", icon: Clock },
    { id: "invoicehistory", label: "Invoice History", icon: Clock },
    { id: "exploreplan", label: "Explore Plans", icon: List },
    { id: "generatelink", label: "Generate Link", icon: Link },
    { id: "seo", label: "Website SEO", icon: TrendingUp },
    { id: "convert-letterhead", label: "Convert Letterhead", icon: FileText },
  ];

  const handleLogout = () => {
    Swal.fire({
      title: "Are you sure?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Logout!",
    }).then((result) => {
      if (result.isConfirmed) {
        navigate("/");
        dispatch(clearUser());
        Swal.fire({
          title: "Logged Out!",
          text: "You have successfully logged out.",
          icon: "success",
          showConfirmButton: false,
          timer: 1500,
        });
      }
    });
  };

  return (
    <div
      className="h-screen h-dvh w-full relative overflow-hidden"
      style={{
        background: `linear-gradient(to bottom right, var(--gradient-from), var(--gradient-via), var(--gradient-to))`,
        overscrollBehavior: "none",
      }}
    >
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -inset-[100%] bg-cover bg-center animate-[spin_60s_linear_infinite]"
          style={{
            backgroundImage: isLight ? "none" : undefined,
            opacity: isLight ? 0 : 0.4,
            mixBlendMode: isLight ? "normal" : "screen",
          }}
        />
        <div
          className="absolute inset-0 backdrop-blur-3xl"
          style={{
            backgroundColor: isLight
              ? "rgba(253,246,236,0.82)"
              : "rgba(2, 6, 23, 0.70)",
          }}
        />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-orange-600/30 rounded-full blur-[100px] animate-[pulse_8s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 md:w-96 md:h-96 bg-red-600/20 rounded-full blur-[100px] animate-[pulse_10s_ease-in-out_infinite_reverse]"></div>
      </div>

      <header
        className="fixed top-0 left-0 right-0 z-30 h-16 select-none"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          touchAction: "none",
          overscrollBehavior: "none",
          backgroundColor: isLight ? "#ffffff" : "var(--bg-header)",
          borderBottom: isLight
            ? "1px solid rgba(234, 88, 12, 0.25)"
            : "1px solid var(--border-color)",
          boxShadow: isLight
            ? "0 2px 20px rgba(234, 88, 12, 0.12), 0 1px 4px rgba(0,0,0,0.06)"
            : "none",
          backdropFilter: "blur(24px)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20 ring-1 ring-white/20">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">
                  Revenue Engine
                </h1>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Business Developer
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden xl:block text-right">
                <div className="text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>
                  Welcome back,
                </div>
                <div className="font-semibold text-sm sm:text-base" style={{ color: "var(--text-primary)" }}>
                  {currentUser?.name || "BD User"}
                </div>
              </div>

              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>

              <ThemeToggle />

              <a
                href="https://csms.dentalguru.software/login"
                target="_blank"
                rel="noreferrer"
                className="hidden lg:flex px-3 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-500 rounded-xl transition-colors"
              >
                CSMS
              </a>

              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 backdrop-blur-sm"
                style={{ color: "var(--text-primary)", backgroundColor: "var(--btn-secondary-bg)" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--btn-secondary-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--btn-secondary-bg)")}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden xl:inline">Logout</span>
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl transition-colors"
                style={{ color: "var(--text-secondary)" }}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <NavTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={handleTabChange}
        fixedUnderHeader
        persistKey="bd-active-tab"
      />

      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div
        className={`lg:hidden fixed top-16 left-0 right-0 z-40 ${mobileMenuOpen ? "block" : "hidden"}`}
      >
        <div
          className="backdrop-blur-xl shadow-2xl"
          style={{
            backgroundColor: "var(--bg-nav-mobile)",
            borderBottom: "1px solid var(--border-color)",
          }}
        >
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-2 max-h-[75vh] overflow-auto">
            <div className="sm:block mb-2">
              <div className="text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>
                Welcome back,
              </div>
              <div
                className="font-semibold text-sm sm:text-base"
                style={{ color: "var(--text-primary)" }}
              >
                {currentUser?.name || "BD User"}
              </div>
            </div>

            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className="w-full flex items-center gap-3 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300"
                  style={{
                    color: isActive
                      ? "var(--mobile-tab-active-text)"
                      : "var(--mobile-tab-inactive-text)",
                    backgroundColor: isActive
                      ? "var(--mobile-tab-active-bg)"
                      : "transparent",
                    border: isActive
                      ? "1px solid var(--mobile-tab-active-border)"
                      : "1px solid transparent",
                  }}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 py-3 px-4 rounded-xl font-medium text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300 mt-4 pt-4 border-t border-gray-700/50"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <main
        className="fixed inset-x-0 top-16 lg:top-28 bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] lg:bottom-0 z-10 overflow-y-auto overscroll-contain"
        style={{
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
      >
        <div className="w-full min-h-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <React.Suspense
            fallback={
              <div className="flex items-center justify-center py-20 text-orange-400">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            }
          >
            {activeTab === "clients" && <ClientDetails />}
            {activeTab === "history" && <AllHistory />}
            {activeTab === "invoicehistory" && <InvoiceHistory />}
            {activeTab === "exploreplan" && <BdExplorePlans />}
            {activeTab === "generatelink" && <GenerateLinkHistoryBD />}
            {activeTab === "seo" && <SeoServices />}
            {activeTab === "convert-letterhead" && <ConvertLetterhead />}
          </React.Suspense>
        </div>
      </main>

      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 backdrop-blur-xl h-[calc(3.5rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] select-none"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          touchAction: "pan-x",
          overscrollBehavior: "none",
          backgroundColor: "var(--bg-bottom-nav)",
          borderTop: "1px solid var(--border-color)",
        }}
      >
        <div
          className="h-14 flex items-center overflow-x-auto no-scrollbar px-2 gap-1 justify-start sm:justify-around"
          style={{ touchAction: "pan-x", overscrollBehavior: "contain" }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className="flex flex-col items-center gap-1 py-1.5 px-3 rounded-lg transition-all duration-300 shrink-0 min-w-[64px]"
                style={{
                  color: isActive
                    ? "var(--bottom-tab-active-text)"
                    : "var(--bottom-tab-inactive-text)",
                  backgroundColor: isActive
                    ? "var(--bottom-tab-active-bg)"
                    : "transparent",
                }}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px] font-medium whitespace-nowrap">
                  {tab.label.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
