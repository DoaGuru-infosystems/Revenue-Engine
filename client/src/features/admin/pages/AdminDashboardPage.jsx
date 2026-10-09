import React, { lazy, useState } from "react";
import { useTheme } from "../../../context/ThemeContext";
import {
  User,
  Users,
  Clock,
  Plus,
  List,
  UserPlus,
  Link,
  TrendingUp,
  FileText,
  Menu,
  X,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { clearUser } from "../../../redux/user/userSlice";
import NavTabs from "../../../Components/NavTabs";
import ThemeToggle from "../../../Components/ThemeToggle";

const AdminAddPlan = lazy(() => import("./AdminAddPlanPage"));
const AdminExplorePlans = lazy(() => import("./AdminExplorePlansPage"));
const CreateTeam = lazy(() => import("../components/CreateTeam"));
const GenerateLinkHistory = lazy(() => import("./GenerateLinkHistoryPage"));
const SeoServicesA = lazy(() => import("../../../shared/SeoServices"));
const ConvertLetterhead = lazy(() => import("../../../Components/ConvertLetterhead"));
const AdmindashBoardSettings = lazy(() => import("../components/AdmindashBoardSettings"));
const AssignQuotation = lazy(() => import("./AssignQuotationPage"));
const HistoryHub = lazy(() => import("../../history/pages/HistoryHubPage"));
const RegisterBD = lazy(() => import("./RegisterBDPage"));
const AdminClientDetails = lazy(() => import("./AdminClientDetailsPage"));
const AdminAddServices = lazy(() => import("../../calculator/pages/AdminAddServicesPage"));
const AdminServicesHistory = lazy(() => import("../../history/pages/AdminServicesHistoryPage"));
const AdminAdsCampign = lazy(() => import("../components/AdminAdsCampaign"));
const InstantProforma = lazy(() => import("../../../Components/InstantProforma"));

export default function AdminDashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("admin-active-tab") || "clients";
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  const tabs = [
    { id: "clients", label: "Client Details", icon: User },
    { id: "exploreplan", label: "Explore Plans", icon: List },
    ...(currentUser?.role === "Owner" ? [{ id: "history", label: "Account", icon: Clock }] : []),
    { id: "assign", label: "Assign", icon: UserPlus },
    { id: "generatelink", label: "Generate Link", icon: Link },
    { id: "seo", label: "Website SEO", icon: TrendingUp },
    { id: "Convert Letterhead ", label: "Convert Letterhead ", icon: FileText },
    { id: "dashboardsettings", label: "Dashboard Settings", icon: List },
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
      className="min-h-screen relative overflow-hidden"
      style={{ background: `linear-gradient(to bottom right, var(--gradient-from), var(--gradient-via), var(--gradient-to))` }}
    >
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -inset-[100%] bg-cover bg-center animate-[spin_60s_linear_infinite]"
          style={{
            backgroundImage: isLight
              ? "none"
              : `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCT9v6iizuoHxfKhHFpYAnJztv_3ApbHHC7Dyvq4D7pQzsVbIF-0pDnsBvhENFyWxnoiInnFwgsVWc5ENucoHd7CEUoA9DeAzNMmADjsz1J0FDPFcd7o74IXDwID61ElImaeyHJCCOCovXD_rkAj8KKLMkRgVOHfm_TNvaZ5VmSDHJZbByQZx8VLFFdoChrpBmjLktpnTinMSwpwQUh-r_-D8Th-33QUlcqUrHEzkFU3TiQoR1o3t-Unmchd64GWrJTf3-MD25CC3Xf')`,
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
        className="fixed top-0 left-0 right-0 z-30 h-16"
        style={{
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
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">
                  Revenue Engine
                </h1>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Admin Workspace
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <ThemeToggle />

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
        persistKey="admin-active-tab"
      />

      <div
        className={`lg:hidden relative z-20 ${mobileMenuOpen ? "block" : "hidden"}`}
      >
        <div
          className="backdrop-blur-xl"
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
                {currentUser?.name || "User"}
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
              Logout
            </button>
          </div>
        </div>
      </div>

      <main className="fixed inset-x-0 top-16 lg:top-28 bottom-14 lg:bottom-0 z-10">
        <div className="h-full overflow-y-auto w-full">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <React.Suspense
              fallback={
                <div className="flex items-center justify-center py-20 text-orange-400">
                  <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              }
            >
              {activeTab === "clients" && <AdminClientDetails />}
              {activeTab === "registerbd" && <RegisterBD />}
              {activeTab === "AddADSCamp" && <AdminAdsCampign />}
              {activeTab === "AddServices" && <AdminAddServices />}
              {activeTab === "servicehistory" && <AdminServicesHistory />}
              {activeTab === "addplan" && <AdminAddPlan />}
              {activeTab === "exploreplan" && <AdminExplorePlans />}
              {activeTab === "history" && (
                <HistoryHub setActiveTab={handleTabChange} />
              )}
              {activeTab === "assign" && <AssignQuotation />}
              {activeTab === "createteam" && <CreateTeam />}
              {activeTab === "generatelink" && <GenerateLinkHistory />}
              {activeTab === "seo" && <SeoServicesA />}
              {activeTab === "createinvoice" && (
                <InstantProforma onBack={() => handleTabChange("history")} />
              )}
              {activeTab === "Convert Letterhead " && <ConvertLetterhead />}
              {activeTab === "dashboardsettings" && <AdmindashBoardSettings />}
            </React.Suspense>
          </div>
        </div>
      </main>

      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 backdrop-blur-xl h-14"
        style={{
          backgroundColor: "var(--bg-bottom-nav)",
          borderTop: "1px solid var(--border-color)",
        }}
      >
        <div className="h-full flex justify-around items-center">
          {tabs.slice(0, 4).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className="flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all duration-300"
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
                <span className="text-xs font-medium">
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
