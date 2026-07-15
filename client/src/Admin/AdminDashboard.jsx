import React, { lazy, useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  User,
  Users,
  Clock,
  CheckCircle,
  Plus,
  LogOut,
  Menu,
  X,
  ShieldPlus,
  PlaneIcon,
  List,
  UserPlus,
  Link,
  TrendingUp,
  FileText,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { clearUser } from "../redux/user/userSlice";
import AdminAddPlan from "./AdminAddPlan";
import AdminExplorePlans from "./AdminExplorePlans";
import CreateTeam from "./CreateTeam";
import GenerateLinkHistory from "./GenerateLinkHistory";
import NavTabs from "../Components/NavTabs";
import SeoServicesA from "./SeoServicesA";
import ConvertLetterhead from "../Components/ConvertLetterhead";
import AdmindashBoardSettings from "./AdmindashBoardSettings";
const AssignQuotation = lazy(() => import("./AssignQuotation"));
const HistoryHub = lazy(() => import("./HistoryHub"));
const RegisterBD = lazy(() => import("./RegisterBD"));
const AdminClientDetails = lazy(() => import("./AdminClientDetails"));
const AdminAddServices = lazy(() => import("./AdminAddServices"));
const AdminServicesHistory = lazy(() => import("./AdminServicesHistory"));
const AdminAdsCampign = lazy(() => import("./AdminAdsCampign"));
// const AdminCalculator = lazy(() => import("./AdminCalculator"));
import InstantProforma from "../Components/InstantProforma";

const AdminDashboard = () => {
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
    setMobileMenuOpen(false); // Close mobile menu on tab change
  };

  const tabs = [
    { id: "clients", label: "Client Details", icon: User },   // home tab

    // { id: "AddADSCamp", label: "Add Ads Campaigns", icon: CheckCircle },
    // { id: "AddADSCamp", label: "Campaigns", icon: CheckCircle }, //moved to admin setting component
    // { id: "AddServices", label: "Add Graphic Services", icon: Plus },
    // { id: "AddServices", label: "Creatives & SEO Service", icon: Plus }, //moved to admin setting component
    // { id: "servicehistory", label: "Graphic Service History", icon: Clock }, // moved to admin setting component
    // { id: "addplan", label: "Add Plan", icon: List }, // moved to admin setting component
    { id: "exploreplan", label: "Explore Plans", icon: List }, // moved to admin setting component
    // { id: "registerbd", label: "Register BD", icon: ShieldPlus },// moved to admin setting component
    ...(currentUser?.role === "Owner" ? [{ id: "history", label: "Account", icon: Clock }] : []), // unified history hub
    { id: "createinvoice", label: "Instant Proforma", icon: Plus },
    { id: "assign", label: "Assign", icon: UserPlus }, // home tab
    // { id: "createteam", label: "Team", icon: Users }, // moved to admin setting component
    { id: "generatelink", label: "Generate Link", icon: Link }, // home tab
    { id: "seo", label: "Website SEO", icon: TrendingUp },  // home tab
    { id: "Convert Letterhead ", label: "Convert Letterhead ", icon: FileText }, // home tab

    { id: "dashboardsettings", label: "Dashboard Settings", icon: List }, // home tab


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
      {/* Full Screen Animated Background (From Login) */ }
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -inset-[100%] bg-cover bg-center animate-[spin_60s_linear_infinite]"
          style={{
            backgroundImage: isLight
              ? 'none'
              : `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCT9v6iizuoHxfKhHFpYAnJztv_3ApbHHC7Dyvq4D7pQzsVbIF-0pDnsBvhENFyWxnoiInnFwgsVWc5ENucoHd7CEUoA9DeAzNMmADjsz1J0FDPFcd7o74IXDwID61ElImaeyHJCCOCovXD_rkAj8KKLMkRgVOHfm_TNvaZ5VmSDHJZbByQZx8VLFFdoChrpBmjLktpnTinMSwpwQUh-r_-D8Th-33QUlcqUrHEzkFU3TiQoR1o3t-Unmchd64GWrJTf3-MD25CC3Xf')`,
            opacity: isLight ? 0 : 0.4,
            mixBlendMode: isLight ? 'normal' : 'screen',
          }}
        />
        <div
          className="absolute inset-0 backdrop-blur-3xl"
          style={{
            backgroundColor: isLight
              ? 'rgba(253,246,236,0.82)'
              : 'rgba(2, 6, 23, 0.70)',
          }}
        />

        {/* Animated Orbs */ }
        <div className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-orange-600/30 rounded-full blur-[100px] animate-[pulse_8s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 md:w-96 md:h-96 bg-red-600/20 rounded-full blur-[100px] animate-[pulse_10s_ease-in-out_infinite_reverse]"></div>
      </div>

      {/* Header */ }
      {/* <header className="relative z-10 bg-gray-800/30 backdrop-blur-xl border-b border-gray-700/50"> */ }
      <header
        className="fixed top-0 left-0 right-0 z-30 h-16"
        style={{
          backgroundColor: isLight ? '#ffffff' : 'var(--bg-header)',
          borderBottom: isLight
            ? '1px solid rgba(234, 88, 12, 0.25)'
            : '1px solid var(--border-color)',
          boxShadow: isLight
            ? '0 2px 20px rgba(234, 88, 12, 0.12), 0 1px 4px rgba(0,0,0,0.06)'
            : 'none',
          backdropFilter: 'blur(24px)',
        }}
      >
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-full flex justify-between items-center">
            <div>
              <h1
                className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent"
                style={{ backgroundImage: `linear-gradient(to right, var(--text-heading-gradient-from), var(--text-heading-gradient-to))` }}
              >
                Control Panel
              </h1>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              {/* User Info - Hidden on small screens */}
              <div className="hidden sm:block text-right">
                <div className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
                  Welcome back,
                </div>
                <div className="font-semibold text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
                  { currentUser.name }
                </div>
              </div>

              {/* Avatar */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>

              {/* CSMS Button */}
              <a
                href="https://csms.dentalguru.software/login"
                target="blank"
                className="hidden sm:flex px-3 py-2 text-sm font-medium text-white bg-orange-600 rounded-xl"
              >
                CSMS
              </a>

              {/* Logout Button - Hidden on mobile */}
              <button
                onClick={ handleLogout }
                className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 backdrop-blur-sm"
                style={{ color: 'var(--text-primary)', backgroundColor: 'var(--btn-secondary-bg)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--btn-secondary-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--btn-secondary-bg)'}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden lg:inline">Logout</span>
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={ () => setMobileMenuOpen(!mobileMenuOpen) }
                className="lg:hidden p-2 rounded-xl transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                { mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                ) }
              </button>
            </div>
          </div>
        </div>
      </header>

      <NavTabs
        tabs={ tabs }
        activeTab={ activeTab }
        onChange={ handleTabChange }
        fixedUnderHeader
        persistKey="admin-active-tab"
      />

      {/* Navigation Tabs - Desktop */ }
      {/* Navigation Tabs - Desktop (fixed under header, pill style) */ }
      {/* Navigation Tabs - Desktop (fixed, full-width, no truncate) */ }
      {/* <nav className="hidden lg:block fixed top-16 left-0 right-0 z-20 h-12 bg-gray-900/40 backdrop-blur-xl border-b border-gray-800/50">
        <div className="h-full w-full px-3 lg:px-4">
          <div className="h-full overflow-x-auto no-scrollbar">
            <div className="h-full flex items-center gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={[
                      "flex items-center gap-2 h-9 px-4 rounded-full text-sm font-medium",
                      "whitespace-nowrap min-w-max",
                      "transition-all duration-200",
                      isActive
                        ? "bg-orange-500/20 text-orange-100 ring-1 ring-orange-400/40"
                        : "text-gray-200 hover:text-white hover:bg-white/10",
                    ].join(" ")}
                    title={tab.label}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </nav> */}

      {/* Mobile Navigation Menu */ }
      <div
        className={ `lg:hidden relative z-20 ${mobileMenuOpen ? "block" : "hidden"
          }` }
      >
        <div className="backdrop-blur-xl" style={{ backgroundColor: 'var(--bg-nav-mobile)', borderBottom: '1px solid var(--border-color)' }}>
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-2 max-h-[75vh] overflow-auto">
            <div className=" sm:block mb-2">
              <div className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
                Welcome back,
              </div>
              <div className="font-semibold text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
                { currentUser?.name || "User" }
              </div>
            </div>

            { tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={ tab.id }
                  onClick={ () => handleTabChange(tab.id) }
                  className="w-full flex items-center gap-3 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300"
                  style={{
                    color: isActive ? 'var(--mobile-tab-active-text)' : 'var(--mobile-tab-inactive-text)',
                    backgroundColor: isActive ? 'var(--mobile-tab-active-bg)' : 'transparent',
                    border: isActive ? '1px solid var(--mobile-tab-active-border)' : '1px solid transparent',
                  }}
                >
                  <Icon className="w-5 h-5" />
                  { tab.label }
                </button>
              );
            }) }
            {/* Mobile Logout Button */ }
            <button
              onClick={ handleLogout }
              className="w-full flex items-center gap-3 py-3 px-4 rounded-xl font-medium text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300 mt-4 pt-4"
              style={{ borderTop: '1px solid var(--border-color)' }}
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */ }
      {/* <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8"> */ }
      <main className="fixed inset-x-0    top-16 lg:top-28 bottom-14 lg:bottom-0 z-10">
        {/* <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 lg:pt-[112px] pb-16 lg:pb-8"> */ }
        {/* <div className="transition-all duration-300 ease-in-out"> */ }
        {/* <div className="transition-all duration-300 ease-in-out h-[calc(100vh-64px-56px)] lg:h-[calc(100vh-64px-48px)] overflow-y-auto"> */ }
        <div className="h-full overflow-y-auto no-scrollbar w-full">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            { activeTab === "clients" && <AdminClientDetails /> }
            { activeTab === "registerbd" && <RegisterBD /> }
            { activeTab === "AddADSCamp" && <AdminAdsCampign /> }
            { activeTab === "AddServices" && <AdminAddServices /> }
            { activeTab === "servicehistory" && <AdminServicesHistory /> }
            { activeTab === "addplan" && <AdminAddPlan /> }
            { activeTab === "exploreplan" && <AdminExplorePlans /> }
            { activeTab === "history" && <HistoryHub setActiveTab={handleTabChange} /> }
            { activeTab === "assign" && <AssignQuotation /> }
            { activeTab === "createteam" && <CreateTeam /> }
            { activeTab === "generatelink" && <GenerateLinkHistory /> }
            { activeTab === "seo" && <SeoServicesA /> }
            { activeTab === "createinvoice" && <InstantProforma onBack={() => handleTabChange("history")} /> }
            { activeTab === "Convert Letterhead " && <ConvertLetterhead /> }
            { activeTab === "dashboardsettings" && <AdmindashBoardSettings /> }
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation (Alternative) */ }
      {/* <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-gray-800/95 backdrop-blur-xl border-t border-gray-700/50">
        <div className="flex justify-around py-2"> */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 backdrop-blur-xl h-14"
        style={{ backgroundColor: 'var(--bg-bottom-nav)', borderTop: '1px solid var(--border-color)' }}
      >
        <div className="h-full flex justify-around items-center">
          { tabs.slice(0, 4).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={ tab.id }
                onClick={ () => handleTabChange(tab.id) }
                className="flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all duration-300"
                style={{
                  color: isActive ? 'var(--bottom-tab-active-text)' : 'var(--bottom-tab-inactive-text)',
                  backgroundColor: isActive ? 'var(--bottom-tab-active-bg)' : 'transparent',
                }}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">
                  { tab.label.split(" ")[0] }
                </span>
              </button>
            );
          }) }
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
