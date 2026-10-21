import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useSelector } from "react-redux";
import API_BASE_URL from "../../../config/apiBaseUrl";
import {
  BellRing,
  User,
  Shield,
  Briefcase,
  Users,
  Mail,
  Phone,
  CloudDownload,
  Key,
  Globe,
  Plus,
  Pencil,
  Trash2,
  Save,
  CheckCircle2,
  RefreshCw,
  Search,
  AlertCircle,
  X,
} from "lucide-react";

export default function ReminderSetting() {
  const baseURL = API_BASE_URL;
  const { token } = useSelector((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [fetchingApi, setFetchingApi] = useState(false);
  const [savingOwner, setSavingOwner] = useState(false);
  const [savingManager, setSavingManager] = useState(false);
  const [savingApi, setSavingApi] = useState(false);

  // Form states
  const [owner, setOwner] = useState({ name: "", email: "", phone_number: "" });
  const [manager, setManager] = useState({ name: "", email: "", phone_number: "" });
  const [apiConfig, setApiConfig] = useState({ api_endpoint: "", api_token: "" });
  const [teamLeads, setTeamLeads] = useState([]);

  // Search & Filter
  const [tlSearch, setTlSearch] = useState("");

  // Modal State for Add / Edit Team Lead
  const [showTlModal, setShowTlModal] = useState(false);
  const [editingTl, setEditingTl] = useState(null);
  const [tlFormData, setTlFormData] = useState({
    team_name: "",
    name: "",
    email: "",
    phone_number: "",
    designation: "",
  });
  const [savingTl, setSavingTl] = useState(false);

  const authHeaders = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };

  // Fetch all reminder settings
  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${baseURL}/auth/api/re_calculator/reminder-settings`, authHeaders);
      if (res.data?.status === "Success") {
        const { owner: o, manager: m, apiConfig: ac, teamLeads: tls } = res.data.data;
        setOwner({
          name: o?.name || "",
          email: o?.email || "",
          phone_number: o?.phone_number || "",
        });
        setManager({
          name: m?.name || "",
          email: m?.email || "",
          phone_number: m?.phone_number || "",
        });
        setApiConfig({
          api_endpoint: ac?.api_endpoint || "",
          api_token: ac?.api_token || "",
        });
        setTeamLeads(tls || []);
      }
    } catch (err) {
      console.error("Failed to load reminder settings:", err);
      Swal.fire({
        icon: "error",
        title: "Load Error",
        text: "Could not fetch reminder settings from server.",
        background: "#1e293b",
        color: "#fff",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Validation Helpers
  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(String(email || "").trim());
  };

  const validatePhone = (phone, isRequired = true) => {
    const clean = String(phone || "").replace(/\D/g, "");
    if (!clean) return !isRequired;
    return clean.length === 10 && /^[6-9]\d{9}$/.test(clean);
  };

  // Save Owner Details
  const handleSaveOwner = async (e) => {
    e.preventDefault();
    if (!owner.name.trim() || !owner.email.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Required Fields",
        text: "Please enter Owner Name and Email address.",
        background: "#1e293b",
        color: "#fff",
      });
      return;
    }

    if (!validateEmail(owner.email)) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Email",
        text: "Please enter a valid Owner Email address (e.g. owner@doaguru.com).",
        background: "#1e293b",
        color: "#fff",
      });
      return;
    }

    if (!validatePhone(owner.phone_number, true)) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Phone Number",
        text: "Owner WhatsApp/Phone must be a valid 10-digit number starting with 6, 7, 8, or 9 (without +91, 0 or spaces).",
        background: "#1e293b",
        color: "#fff",
      });
      return;
    }

    try {
      setSavingOwner(true);
      const res = await axios.post(
        `${baseURL}/auth/api/re_calculator/reminder-settings/owner`,
        {
          ...owner,
          name: owner.name.trim(),
          email: owner.email.trim().toLowerCase(),
          phone_number: String(owner.phone_number || "").replace(/\D/g, "").slice(0, 10),
        },
        authHeaders
      );
      if (res.data?.status === "Success") {
        Swal.fire({
          icon: "success",
          title: "Owner Settings Saved!",
          text: "System notifications will now dynamically route to this owner.",
          background: "#1e293b",
          color: "#fff",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      console.error("Save Owner Error:", err);
      Swal.fire({
        icon: "error",
        title: "Failed to Save",
        text: err.response?.data?.message || "Error saving owner details.",
        background: "#1e293b",
        color: "#fff",
      });
    } finally {
      setSavingOwner(false);
    }
  };

  // Save Manager Details
  const handleSaveManager = async (e) => {
    e.preventDefault();
    if (!manager.name.trim() || !manager.email.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Required Fields",
        text: "Please enter Manager Name and Email address.",
        background: "#1e293b",
        color: "#fff",
      });
      return;
    }

    if (!validateEmail(manager.email)) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Email",
        text: "Please enter a valid Manager Email address (e.g. manager@doaguru.com).",
        background: "#1e293b",
        color: "#fff",
      });
      return;
    }

    if (!validatePhone(manager.phone_number, true)) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Phone Number",
        text: "Manager WhatsApp/Phone must be a valid 10-digit number starting with 6, 7, 8, or 9 (without +91, 0 or spaces).",
        background: "#1e293b",
        color: "#fff",
      });
      return;
    }

    try {
      setSavingManager(true);
      const res = await axios.post(
        `${baseURL}/auth/api/re_calculator/reminder-settings/manager`,
        {
          ...manager,
          name: manager.name.trim(),
          email: manager.email.trim().toLowerCase(),
          phone_number: String(manager.phone_number || "").replace(/\D/g, "").slice(0, 10),
        },
        authHeaders
      );
      if (res.data?.status === "Success") {
        Swal.fire({
          icon: "success",
          title: "Manager Settings Saved!",
          text: "Meeting reminders will be dispatched to this manager.",
          background: "#1e293b",
          color: "#fff",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      console.error("Save Manager Error:", err);
      Swal.fire({
        icon: "error",
        title: "Failed to Save",
        text: err.response?.data?.message || "Error saving manager details.",
        background: "#1e293b",
        color: "#fff",
      });
    } finally {
      setSavingManager(false);
    }
  };

  // Save External API Configuration
  const handleSaveApiConfig = async (e) => {
    e.preventDefault();
    try {
      setSavingApi(true);
      const res = await axios.post(
        `${baseURL}/auth/api/re_calculator/reminder-settings/api-config`,
        apiConfig,
        authHeaders
      );
      if (res.data?.status === "Success") {
        Swal.fire({
          icon: "success",
          title: "API Config Saved!",
          text: "External API Endpoint & Auth details updated.",
          background: "#1e293b",
          color: "#fff",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      console.error("Save API Config Error:", err);
      Swal.fire({
        icon: "error",
        title: "Failed to Save",
        text: err.response?.data?.message || "Error saving API config.",
        background: "#1e293b",
        color: "#fff",
      });
    } finally {
      setSavingApi(false);
    }
  };

  // Fetch Team Leads from External API
  const handleFetchTeamLeads = async () => {
    if (!apiConfig.api_endpoint.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Endpoint Required",
        text: "Please enter an External API Endpoint URL first.",
        background: "#1e293b",
        color: "#fff",
      });
      return;
    }

    try {
      setFetchingApi(true);
      const res = await axios.post(
        `${baseURL}/auth/api/re_calculator/reminder-settings/fetch-team-leads`,
        apiConfig,
        authHeaders
      );
      if (res.data?.status === "Success") {
        setTeamLeads(res.data.data || []);
        Swal.fire({
          icon: "success",
          title: "Team Leads Synced!",
          text: res.data.message || "Team leads fetched successfully from external API.",
          background: "#1e293b",
          color: "#fff",
        });
      }
    } catch (err) {
      console.error("Fetch Team Leads Error:", err);
      Swal.fire({
        icon: "error",
        title: "Fetch Failed",
        text: err.response?.data?.message || "Failed to fetch team leads from external API.",
        background: "#1e293b",
        color: "#fff",
      });
    } finally {
      setFetchingApi(false);
    }
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingTl(null);
    setTlFormData({
      team_name: "",
      name: "",
      email: "",
      phone_number: "",
      designation: "",
    });
    setShowTlModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (tl) => {
    setEditingTl(tl);
    setTlFormData({
      team_name: tl.team_name || "",
      name: tl.name || "",
      email: tl.email || "",
      phone_number: tl.phone_number || "",
      designation: tl.designation || "",
    });
    setShowTlModal(true);
  };

  // Save/Update Single Team Lead
  const handleSaveTeamLead = async (e) => {
    e.preventDefault();
    if (!tlFormData.team_name.trim() || !tlFormData.name.trim() || !tlFormData.email.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Required Fields",
        text: "Team Name, Name, and Email are mandatory.",
        background: "#1e293b",
        color: "#fff",
      });
      return;
    }

    if (!validateEmail(tlFormData.email)) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Email",
        text: "Please enter a valid Team Lead email address.",
        background: "#1e293b",
        color: "#fff",
      });
      return;
    }

    if (tlFormData.phone_number && !validatePhone(tlFormData.phone_number, false)) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Phone Number",
        text: "Team Lead Phone Number must be a valid 10-digit number starting with 6, 7, 8, or 9 (without +91, 0 or spaces).",
        background: "#1e293b",
        color: "#fff",
      });
      return;
    }

    try {
      setSavingTl(true);
      const payload = {
        ...tlFormData,
        id: editingTl?.id || undefined,
      };
      const res = await axios.post(
        `${baseURL}/auth/api/re_calculator/reminder-settings/team-lead`,
        payload,
        authHeaders
      );
      if (res.data?.status === "Success") {
        setShowTlModal(false);
        Swal.fire({
          icon: "success",
          title: editingTl ? "Team Lead Updated!" : "Team Lead Added!",
          text: res.data.message,
          background: "#1e293b",
          color: "#fff",
          timer: 1800,
          showConfirmButton: false,
        });
        loadSettings();
      }
    } catch (err) {
      console.error("Save Team Lead Error:", err);
      Swal.fire({
        icon: "error",
        title: "Save Failed",
        text: err.response?.data?.message || "Failed to save team lead.",
        background: "#1e293b",
        color: "#fff",
      });
    } finally {
      setSavingTl(false);
    }
  };

  // Delete Team Lead
  const handleDeleteTeamLead = (tl) => {
    Swal.fire({
      title: "Delete Team Lead?",
      text: `Are you sure you want to remove ${tl.name} (${tl.team_name})?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#475569",
      confirmButtonText: "Yes, delete",
      background: "#1e293b",
      color: "#fff",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await axios.delete(
            `${baseURL}/auth/api/re_calculator/reminder-settings/team-lead/${tl.id}`,
            authHeaders
          );
          if (res.data?.status === "Success") {
            Swal.fire({
              icon: "success",
              title: "Deleted!",
              text: "Team Lead removed successfully.",
              background: "#1e293b",
              color: "#fff",
              timer: 1500,
              showConfirmButton: false,
            });
            setTeamLeads((prev) => prev.filter((item) => item.id !== tl.id));
          }
        } catch (err) {
          console.error("Delete Error:", err);
          Swal.fire({
            icon: "error",
            title: "Delete Failed",
            text: err.response?.data?.message || "Failed to delete team lead.",
            background: "#1e293b",
            color: "#fff",
          });
        }
      }
    });
  };

  // Filtered TLs
  const filteredTeamLeads = teamLeads.filter((tl) => {
    if (!tlSearch.trim()) return true;
    const q = tlSearch.toLowerCase();
    return (
      (tl.name && tl.name.toLowerCase().includes(q)) ||
      (tl.team_name && tl.team_name.toLowerCase().includes(q)) ||
      (tl.email && tl.email.toLowerCase().includes(q)) ||
      (tl.phone_number && tl.phone_number.includes(q)) ||
      (tl.designation && tl.designation.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-3 text-gray-400">
        <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
        <p className="text-sm">Loading Reminder Settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-gray-900 dark:text-white transition-colors">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-transparent border border-orange-500/20 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
              <BellRing className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Meeting Reminder Settings</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Configure notifications sent 1 week before service deadlines daily at 10 AM, 12 PM, and 3 PM.
              </p>
            </div>
          </div>
          <button
            onClick={loadSettings}
            className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-600/50 shadow-sm transition-all"
            title="Refresh settings"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Grid: Owner & Manager Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Owner Configuration Card */}
        <div className="bg-white/90 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-4 sm:p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-125"></div>
          
          <div className="flex items-center gap-3 mb-5 border-b border-gray-100 dark:border-gray-700/50 pb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/20 dark:border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Company Owner Details</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Dynamic recipient for all owner alerts across Revenue Engine</p>
            </div>
          </div>

          <form onSubmit={handleSaveOwner} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">Owner Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={owner.name}
                  onChange={(e) => setOwner({ ...owner, name: e.target.value })}
                  placeholder="e.g. Ad Dubay"
                  className="w-full bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">Owner Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={owner.email}
                  onChange={(e) => setOwner({ ...owner, email: e.target.value })}
                  placeholder="e.g. owner@doaguru.com"
                  className="w-full bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">WhatsApp / Phone Number *</label>
                <span className={`text-[10px] font-mono ${owner.phone_number?.length === 10 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-gray-400 dark:text-gray-500'}`}>
                  {owner.phone_number?.length || 0}/10 digits
                </span>
              </div>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-3" />
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={owner.phone_number}
                  onChange={(e) => setOwner({ ...owner, phone_number: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                  placeholder="e.g. 7000102121 (10 digits only)"
                  className="w-full bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors font-mono tracking-wide"
                  required
                />
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">10-digit mobile number for WhatsApp alerts & daily cron summaries</p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingOwner}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                {savingOwner ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Owner Contact
              </button>
            </div>
          </form>
        </div>

        {/* 2. Manager Configuration Card */}
        <div className="bg-white/90 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-4 sm:p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-125"></div>

          <div className="flex items-center gap-3 mb-5 border-b border-gray-100 dark:border-gray-700/50 pb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/20 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Project Manager Details</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Receives all upcoming meeting reminders across teams</p>
            </div>
          </div>

          <form onSubmit={handleSaveManager} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">Manager Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={manager.name}
                  onChange={(e) => setManager({ ...manager, name: e.target.value })}
                  placeholder="e.g. Operations Manager"
                  className="w-full bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">Manager Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={manager.email}
                  onChange={(e) => setManager({ ...manager, email: e.target.value })}
                  placeholder="e.g. manager@doaguru.com"
                  className="w-full bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Manager WhatsApp / Phone *</label>
                <span className={`text-[10px] font-mono ${manager.phone_number?.length === 10 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-gray-400 dark:text-gray-500'}`}>
                  {manager.phone_number?.length || 0}/10 digits
                </span>
              </div>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-3" />
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={manager.phone_number}
                  onChange={(e) => setManager({ ...manager, phone_number: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                  placeholder="e.g. 9826012345 (10 digits only)"
                  className="w-full bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors font-mono tracking-wide"
                  required
                />
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Dispatches alerts directly to Manager's WhatsApp (Must be 10 digits)</p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingManager}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                {savingManager ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Manager Contact
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 3. External API Integration Card */}
      <div className="bg-white/90 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 border-b border-gray-100 dark:border-gray-700/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">External Employee API Configuration</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Connect external company HR/CRM application to fetch all Team Leads automatically
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveApiConfig}
              disabled={savingApi}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-600 transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
              Save Config
            </button>
            <button
              type="button"
              onClick={handleFetchTeamLeads}
              disabled={fetchingApi}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-105 disabled:opacity-50"
            >
              {fetchingApi ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CloudDownload className="w-3.5 h-3.5" />
              )}
              {fetchingApi ? "Fetching..." : "Fetch Team Leads"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">External API Endpoint URL</label>
            <div className="relative">
              <Globe className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-3" />
              <input
                type="url"
                value={apiConfig.api_endpoint}
                onChange={(e) => setApiConfig({ ...apiConfig, api_endpoint: e.target.value })}
                placeholder="https://api.yourcompany.com/v1/employees"
                className="w-full bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">Authorization Header / Bearer Token (Optional)</label>
            <div className="relative">
              <Key className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-3" />
              <input
                type="text"
                value={apiConfig.api_token}
                onChange={(e) => setApiConfig({ ...apiConfig, api_token: e.target.value })}
                placeholder="Bearer eyJhbGciOi... or API Key"
                className="w-full bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Team Leads Directory Section */}
      <div className="bg-white/90 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-4 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/20 dark:border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Configured Team Leads ({teamLeads.length})</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Mapped teams will appear in Proforma creation. The respective TL will receive meeting reminders.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search team lead..."
                value={tlSearch}
                onChange={(e) => setTlSearch(e.target.value)}
                className="bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 w-full sm:w-56 transition-colors"
              />
            </div>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-500/20 transition-all hover:scale-105 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Manually
            </button>
          </div>
        </div>

        {/* Team Leads Table / Cards */}
        {filteredTeamLeads.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredTeamLeads.map((tl) => (
              <div
                key={tl.id}
                className="bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 rounded-xl p-4 transition-all hover:shadow-md space-y-3 relative group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                      {tl.team_name || "Unassigned"}
                    </span>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mt-1.5 truncate">{tl.name}</h4>
                    {tl.designation && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{tl.designation}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => handleOpenEditModal(tl)}
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg transition-colors"
                      title="Edit details"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTeamLead(tl)}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/20 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-lg transition-colors"
                      title="Delete team lead"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300 border-t border-gray-200/80 dark:border-gray-700/40 pt-2.5">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                    <span className="truncate">{tl.email || "No email"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                    <span>{tl.phone_number || "No phone"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-gray-200 dark:border-gray-700/80 rounded-xl text-gray-400 space-y-3">
            <Users className="w-10 h-10 mx-auto text-gray-400 dark:text-gray-600" />
            <p className="text-sm text-gray-600 dark:text-gray-400">No Team Leads found.</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Click "Fetch Team Leads" to sync from external API, or click "Add Manually" to create one.
            </p>
          </div>
        )}
      </div>

      {/* Modal: Add / Edit Team Lead */}
      {showTlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {editingTl ? "Edit Team Lead" : "Add Team Lead Manually"}
              </h3>
              <button
                onClick={() => setShowTlModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeamLead} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
                  Team Name * (e.g. Web Development, SEO, Graphic Designing)
                </label>
                <input
                  type="text"
                  value={tlFormData.team_name}
                  onChange={(e) => setTlFormData({ ...tlFormData, team_name: e.target.value })}
                  placeholder="e.g. Web Development"
                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
                  Team Lead Name *
                </label>
                <input
                  type="text"
                  value={tlFormData.name}
                  onChange={(e) => setTlFormData({ ...tlFormData, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={tlFormData.email}
                  onChange={(e) => setTlFormData({ ...tlFormData, email: e.target.value })}
                  placeholder="e.g. rahul@doaguru.com"
                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    WhatsApp / Phone Number
                  </label>
                  <span className={`text-[10px] font-mono ${tlFormData.phone_number?.length === 10 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-gray-400 dark:text-gray-500'}`}>
                    {tlFormData.phone_number?.length || 0}/10 digits
                  </span>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={tlFormData.phone_number}
                  onChange={(e) => setTlFormData({ ...tlFormData, phone_number: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                  placeholder="e.g. 9876543210 (10 digits)"
                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 font-mono tracking-wide"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
                  Designation (Optional)
                </label>
                <input
                  type="text"
                  value={tlFormData.designation}
                  onChange={(e) => setTlFormData({ ...tlFormData, designation: e.target.value })}
                  placeholder="e.g. Sr. Tech Lead"
                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowTlModal(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTl}
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {savingTl && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {editingTl ? "Update Team Lead" : "Add Team Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
