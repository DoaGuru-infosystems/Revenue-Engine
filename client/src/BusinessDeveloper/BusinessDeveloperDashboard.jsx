import React, { lazy, useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  User,
  Clock,
  LogOut,
  Menu,
  X,
  List,
  UserPlus,
  Link,
  TrendingUp,
  Plus,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { clearUser } from "../redux/user/userSlice";
import NavTabs from "../Components/NavTabs";
import InvoiceHistory from "./InvoiceHistory";
import SeoServices from "./SeoServices";
import ConvertLetterhead from "../Components/ConvertLetterhead";

const AssignQuotationBD = lazy(() => import("./AssignQuotationBD"));
const AllHistory = lazy(() => import("./AllHistory"));
const ClientDetails = lazy(() => import("./ClientDetails"));
const BdExplorePlans = lazy(() => import("./BdExplorePlans"));
const GenerateLinkHistoryBD = lazy(() => import("./GenerateLinkHistoryBD"));

const BusinessDeveloperDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [activeTab, setActiveTab] = useState("clients");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  const tabs = [
    { id: "clients", label: "Client Details", icon: User },
    { id: "history", label: "Quotation History", icon: Clock },
    { id: "invoicehistory", label: "Invoice History", icon: Clock },
    { id: "assign", label: "Assign", icon: UserPlus },
    { id: "exploreplan", label: "Explore Plans", icon: List },
    { id: "generatelink", label: "Generate Link", icon: Link },
    { id: "seo", label: "Website SEO", icon: TrendingUp },
    { id: "Convert Letterhead ", label: "Convert Letterhead ", icon: Plus },
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
      style={{
        background: isLight
          ? 'linear-gradient(135deg, #fdf6ec 0%, #fef3e8 50%, #fdf6ec 100%)'
          : 'linear-gradient(to bottom right, #111827, #1e293b, #111827)',
      }}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <header
        className="fixed top-0 left-0 right-0 z-30 h-16"
        style={{
          backgroundColor: isLight ? '#ffffff' : 'rgba(31, 41, 55, 0.3)',
          borderBottom: isLight ? '1px solid rgba(234,88,12,0.25)' : '1px solid rgba(55, 65, 81, 0.5)',
          boxShadow: isLight ? '0 2px 20px rgba(234,88,12,0.12), 0 1px 4px rgba(0,0,0,0.06)' : 'none',
          backdropFilter: 'blur(24px)',
        }}
      >
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-full flex justify-between items-center">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Developer Panel
              </h1>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <div className="hidden sm:block text-right">
                <div className="text-xs sm:text-sm text-gray-400">Welcome back,</div>
                <div className="font-semibold text-white text-sm sm:text-base">
                  {currentUser?.name}
                </div>
              </div>

              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>

              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-gray-700/50 hover:bg-gray-600/50 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-800 backdrop-blur-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden lg:inline">Logout</span>
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-xl transition-colors"
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

      <div className={`lg:hidden relative z-20 ${mobileMenuOpen ? "block" : "hidden"}`}>
        <div className="bg-gray-800/95 backdrop-blur-xl border-b border-gray-700/50">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-2 max-h-[75vh] overflow-auto">
            <div className="sm:block mb-2">
              <div className="text-xs sm:text-sm text-gray-400">Welcome back,</div>
              <div className="font-semibold text-white text-sm sm:text-base">
                {currentUser?.name || "User"}
              </div>
            </div>

            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300 ${
                    activeTab === tab.id
                      ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                      : "text-gray-300 hover:text-white hover:bg-gray-700/50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 py-3 px-4 rounded-xl font-medium text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300 border-t border-gray-700/50 mt-4 pt-4"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <main className="fixed inset-x-0 top-16 lg:top-28 bottom-14 lg:bottom-0 z-10">
        <div className="h-full overflow-y-auto w-full">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            {activeTab === "clients" && <ClientDetails />}
            {activeTab === "history" && <AllHistory />}
            {activeTab === "invoicehistory" && <InvoiceHistory />}
            {activeTab === "assign" && <AssignQuotationBD />}
            {activeTab === "exploreplan" && <BdExplorePlans />}
            {activeTab === "generatelink" && <GenerateLinkHistoryBD />}
            {activeTab === "seo" && <SeoServices />}
            {activeTab === "Convert Letterhead " && <ConvertLetterhead />}
          </div>
        </div>
      </main>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-gray-800/95 backdrop-blur-xl border-t border-gray-700/50 h-14">
        <div className="h-full flex justify-around items-center">
          {tabs.slice(0, 4).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all duration-300 ${
                  activeTab === tab.id
                    ? "text-orange-400 bg-orange-500/20"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{tab.label.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BusinessDeveloperDashboard;
