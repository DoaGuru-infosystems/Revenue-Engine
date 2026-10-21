import React, { lazy, useState } from "react";
import {
  Users,
  Clock,
  CheckCircle,
  Plus,
  ShieldPlus,
  List,
  ArrowLeft,
  FileText,
  PercentDiamond,
  BellRing,
} from "lucide-react";

const AdminAddPlan = lazy(() => import("../pages/AdminAddPlanPage"));
const AdminExplorePlans = lazy(() => import("../pages/AdminExplorePlansPage"));
const CreateTeam = lazy(() => import("./CreateTeam"));
const RegisterBD = lazy(() => import("../pages/RegisterBDPage"));
const AdminAddServices = lazy(() => import("../../calculator/pages/AdminAddServicesPage"));
const AdminServicesHistory = lazy(() => import("../../history/pages/AdminServicesHistoryPage"));
const AdminAdsCampign = lazy(() => import("./AdminAdsCampaign"));
const NoteSection = lazy(() => import("../../../shared/NoteSection"));
const DiscountSetting = lazy(() => import("../../../shared/DiscountSetting"));
const ReminderSetting = lazy(() => import("./ReminderSetting"));

function AdmindashBoardSettings() {
  const [activeTab, setActiveTab] = useState("");

  const settingsTabs = [
    { id: "registerbd", label: "Register BD", description: "Manage and register Business Developers", icon: ShieldPlus, color: "from-red-500 to-orange-600" },
    { id: "AddADSCamp", label: "ADS Campaign", description: "Configure and track Ads Campaigns", icon: CheckCircle, color: "from-yellow-500 to-yellow-600" },
    { id: "AddServices", label: "Add Services", description: "Add new graphic or SEO services", icon: Plus, color: "from-amber-500 to-orange-600" },
    { id: "addplan", label: "Add Plan", description: "Create new subscription or custom plans", icon: List, color: "from-orange-500 to-pink-600" },
    { id: "exploreplan", label: "Explore Plans", description: "View and edit available plans", icon: List, color: "from-amber-500 to-red-600" },
    { id: "servicehistory", label: "Service History", description: "Check logs for graphic and SEO services", icon: Clock, color: "from-gray-500 to-slate-700" },
    { id: "createteam", label: "Create Team", description: "Set up and manage internal teams", icon: Users, color: "from-red-500 to-red-600" },
    { id: "notes", label: "Notes Settings", description: "Manage essential quotation remarks and conditions.", icon: FileText, color: "from-fuchsia-500 to-orange-600" },
    { id: "discount", label: "Discount Setting", description: "Configure global percentage and amount limits.", icon: PercentDiamond, color: "from-yellow-500 to-amber-600" },
    { id: "remindersettings", label: "Reminder Setting", description: "Configure Owner, Manager, and Team Lead meeting alerts", icon: BellRing, color: "from-amber-500 to-orange-600" },
  ];

  const activeTabData = settingsTabs.find((t) => t.id === activeTab);

  return (
    <div className="h-full w-full py-4 px-1 sm:px-4 text-gray-900 dark:text-white">
      { !activeTab ? (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="text-center sm:text-left mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard Settings</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Select a module below to manage configurations, services, and features.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            { settingsTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={ tab.id }
                  onClick={ () => setActiveTab(tab.id) }
                  className="group relative bg-white/80 dark:bg-gray-800/40 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 p-5 sm:p-6 rounded-3xl text-left transition-all duration-300 hover:bg-white dark:hover:bg-gray-800/80 shadow-sm hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1 overflow-hidden"
                >
                  <div className={ `absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${tab.color} opacity-5 rounded-bl-full -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-125 group-hover:opacity-10` }></div>

                  <div className={ `w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-4 sm:mb-5 bg-gradient-to-br ${tab.color} shadow-lg shadow-black/20 ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-300` }>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>

                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-amber-600 dark:group-hover:text-yellow-400 transition-colors">
                      { tab.label }
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm leading-relaxed mb-4">
                      { tab.description }
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-100 dark:border-gray-700/50 flex flex-row items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 group-hover:text-amber-600 dark:group-hover:text-white transition-colors">
                    <span>Manage Module</span>
                    <span className="opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                      →
                    </span>
                  </div>
                </button>
              );
            }) }
          </div>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6 animate-in slide-in-from-right-8 duration-300">
          <div className="flex items-center gap-3 sm:gap-4 border-b border-gray-200 dark:border-gray-700/50 pb-4">
            <button
              onClick={ () => setActiveTab("") }
              className="p-2.5 sm:p-3 bg-white dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-xl transition-all border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md shrink-0"
              title="Back to Settings Grid"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{ activeTabData?.label }</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Settings & Configuration</p>
            </div>
          </div>

          <div className="bg-white/90 dark:bg-gray-800/80 rounded-2xl p-2.5 sm:p-5 md:p-6 border border-gray-200 dark:border-gray-700 shadow-xl relative min-h-[500px]">
            <React.Suspense fallback={
              <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-white/60 gap-4">
                <div className="w-10 h-10 border-4 border-gray-300 dark:border-gray-600 border-t-orange-500 rounded-full animate-spin"></div>
                Loading Module...
              </div>
            }>
              { activeTab === "registerbd" && <RegisterBD /> }
              { activeTab === "AddADSCamp" && <AdminAdsCampign /> }
              { activeTab === "AddServices" && <AdminAddServices /> }
              { activeTab === "addplan" && <AdminAddPlan /> }
              { activeTab === "exploreplan" && <AdminExplorePlans /> }
              { activeTab === "servicehistory" && <AdminServicesHistory /> }
              { activeTab === "createteam" && <CreateTeam /> }
              { activeTab === "notes" && <NoteSection /> }
              { activeTab === "discount" && <DiscountSetting /> }
              { activeTab === "remindersettings" && <ReminderSetting /> }
            </React.Suspense>
          </div>
        </div>
      ) }
    </div>
  );
}

export default AdmindashBoardSettings;
