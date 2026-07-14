import React, { lazy, useEffect, useState } from "react";
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
  ArrowLeft,
  FileText,
  PercentDiamond,
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
import InvoiceHistory from "./InvoiceHistory";
import SeoServicesA from "./SeoServicesA";
import ConvertLetterhead from "../Components/ConvertLetterhead";
const AssignQuotation = lazy(() => import("./AssignQuotation"));
// const AllHistory = lazy(() => import("./AllHistory"));
const RegisterBD = lazy(() => import("./RegisterBD"));
const AdminClientDetails = lazy(() => import("./AdminClientDetails"));
const AdminAddServices = lazy(() => import("./AdminAddServices"));
const AdminServicesHistory = lazy(() => import("./AdminServicesHistory"));
const AdminAdsCampign = lazy(() => import("./AdminAdsCampign"));
const NoteSection = lazy(() => import("./NoteSection"));
const DiscountSetting = lazy(() => import("./DiscountSetting"));

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
  ];

  const activeTabData = settingsTabs.find((t) => t.id === activeTab);

  return (
    <div className="h-full w-full py-4 px-2">

      { !activeTab ? (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="text-center sm:text-left mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Dashboard Settings</h2>
            <p className="text-gray-400">Select a module below to manage configurations, services, and features.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            { settingsTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={ tab.id }
                  onClick={ () => setActiveTab(tab.id) }
                  className="group relative bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 p-6 rounded-3xl text-left transition-all duration-300 hover:bg-gray-800/80 hover:shadow-2xl hover:shadow-black/50 hover:-translate-y-1 overflow-hidden"
                >
                  {/* Background decoration */ }
                  <div className={ `absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${tab.color} opacity-5 rounded-bl-full -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-125 group-hover:opacity-10` }></div>

                  {/* Icon */ }
                  <div className={ `w-14 h-14 rounded-2xl flex items-center justify-center mb-5 bg-gradient-to-br ${tab.color} shadow-lg shadow-black/20 ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-300` }>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Content */ }
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:text-yellow-500 transition-colors">
                      { tab.label }
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-4">
                      { tab.description }
                    </p>
                  </div>

                  {/* Footer interaction indicator */ }
                  <div className="pt-4 border-t border-gray-700/50 flex flex-row items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-500 group-hover:text-white transition-colors">
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
        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
          <div className="flex items-center gap-4 border-b border-gray-700/50 pb-4">
            <button
              onClick={ () => setActiveTab("") }
              className="p-3 bg-gray-800/50 hover:bg-gray-700 text-white rounded-xl transition-all border border-gray-700 hover:shadow-lg"
              title="Back to Settings Grid"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-white">{ activeTabData?.label }</h2>
              <p className="text-xs text-gray-400">Settings & Configuration</p>
            </div>
          </div>

          {/* We remove properties like backdrop-blur-sm that establish a containing block for fixed positioning */ }
          <div className="bg-gray-800/80 rounded-2xl p-6 border border-gray-700 shadow-2xl relative min-h-[500px]">
            <React.Suspense fallback={
              <div className="flex flex-col items-center justify-center h-64 text-white/60 gap-4">
                <div className="w-10 h-10 border-4 border-gray-600 border-t-orange-500 rounded-full animate-spin"></div>
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
            </React.Suspense>
          </div>
        </div>
      ) }
    </div>
  );
}

export default AdmindashBoardSettings;
