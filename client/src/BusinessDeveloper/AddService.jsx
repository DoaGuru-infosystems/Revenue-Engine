import React, { useEffect, useState, useRef } from "react";
import {
  Palette,
  Megaphone,
  Search,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Eye,
  EyeOff,
  ArrowLeft,
  DollarSign,
  Package,
  IndianRupee,
  User,
  Notebook,
  Gift,
  FileText,
  PercentDiamond,
  ChevronDown,
  ChevronUp,
  X,
  Star,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import Swal from "sweetalert2";
import { clearUser } from "../redux/user/userSlice";
import API_BASE_URL from "../config/apiBaseUrl";

export default function AddService() {
  const baseURL = API_BASE_URL;
  const navigate = useNavigate();
  const { id, proposalId } = useParams();
  const [getData, setGetData] = useState([]);
  const [allPlanNote, setAllPlanNote] = useState([]);
  const [getPlanData, setGetPlanData] = useState([]);
  const [getAdsData, setGetAdsData] = useState([]);
  const [getComplimenatryData, setGetComplimenatryData] = useState([]);
  const [planName, setPlanName] = useState("");
  const [clientData, setClientData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notesData, setNotesData] = useState([]);
  const { currentUser, token } = useSelector((state) => state.user);
  const [showModal, setShowModal] = useState(false);
  const userName = currentUser?.name;
  const dispatch = useDispatch();

  // ─── Search & Plan Popup State ────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPlanPopup, setShowPlanPopup] = useState(false);
  const searchRef = useRef(null);
  // ──────────────────────────────────────────────────────────────────────────

  const services = [
    {
      id: 1,
      title: "Graphic & SEO",
      subtitle: "Visual Storytelling",
      description: "Transform your brand with stunning visuals that captivate and convert.",
      icon: Palette,
      gradient: "from-slate-600 to-gray-700",
      navigation: "/BD/calculator",
      features: ["Logo Design", "Brand Identity", "Print Materials", "Digital Graphics", "SEO Services"],
    },
    {
      id: 2,
      title: "Ads Campaigns",
      subtitle: "Strategic Growth",
      description: "Amplify your reach with data-driven advertising campaigns.",
      icon: Megaphone,
      gradient: "from-red-600 to-slate-700",
      navigation: "/BD/Adscalculator",
      features: ["Social Media Ads", "Google Ads", "Campaign Strategy", "Analytics & ROI"],
    },
    {
      id: 4,
      title: "Discount Setting",
      subtitle: "Manage Discounts",
      description: "Easily configure percentage and amount-based discount limits.",
      icon: PercentDiamond,
      gradient: "from-yellow-600 to-orange-700",
      navigation: "/BD/discount-setting",
      features: ["Set percentage-based discounts", "Set amount-based discounts", "Edit or delete discounts easily", "Apply dynamically"],
    },
  ];

  const fetchClient = async () => {
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/calculator/getClientDetailsById/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.status === "Success") setClientData(res.data.data);
    } catch (error) {
      if (error.response?.status === 401) handleUnauthorized();
    }
  };

  const fetchPlanData = async () => {
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/calculator/getAllPlanData`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.status === "Success") setGetPlanData(res.data.data);
    } catch (error) {
      if (error.response?.status === 401) handleUnauthorized();
    }
  };

  const getAllPlanNotes = async (planTitle) => {
    try {
      const response = await axios.get(
        `${baseURL}/auth/api/calculator/getPlanNotes`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const notes = response.data.data;
      return notes.filter((note) => String(note.plan) === String(planTitle));
    } catch (error) {
      console.error("Error fetching plan notes:", error);
      return [];
    }
  };

  const clientName = clientData?.client_name;

  const fetchData = async () => {
    if (!id || !proposalId) return;
    try {
      const { data } = await axios.get(
        `${baseURL}/auth/api/calculator/getByIDCalculatorTransactions/${proposalId}/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGetData(data.data);
      setPlanName(data.data[0]?.plan_name || "");
    } catch (error) {
      if (error.response?.status === 401) handleUnauthorized();
    }
  };

  const fetchAdsData = async () => {
    if (!id || !proposalId) return;
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/calculator/getByIDAdsCampaignDetails/${proposalId}/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.status === "Success") setGetAdsData(res.data.data);
    } catch (error) {
      if (error.response?.status === 401) handleUnauthorized();
    }
  };

  const fetchClientNotes = async () => {
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/calculator/getClientNotesbyId/${id}/${proposalId}`,
        { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
      );
      if (res.data.status === "Success") setNotesData(res.data.data);
    } catch (error) {
      if (error.response?.status === 401) handleUnauthorized();
    }
  };

  const fetchComplimenatryData = async () => {
    if (!id || !proposalId) return;
    try {
      const { data } = await axios.get(
        `${baseURL}/auth/api/calculator/getByIDComplimentaryData/${proposalId}/${id}`,
        { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
      );
      setGetComplimenatryData(data.data);
    } catch (error) {
      if (error.response?.status === 401) handleUnauthorized();
    }
  };

  const handleUnauthorized = () => {
    Swal.fire({ title: "Session Expired", text: "Please login again.", icon: "warning", confirmButtonText: "OK" }).then(() => {
      dispatch(clearUser());
      localStorage.removeItem("token");
      navigate("/");
    });
  };

  useEffect(() => {
    fetchClient();
    fetchData();
    fetchAdsData();
    fetchPlanData();
    fetchClientNotes();
    fetchComplimenatryData();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ─── Totals ────────────────────────────────────────────────────────────────
  const grandTotal = getData.reduce((acc, order) => {
    if (order.service_name?.toLowerCase() === "complimentary") return acc;
    return acc + parseFloat(order.total_amount || 0);
  }, 0);

  const grandAdsTotal = getAdsData.reduce((acc, order) => acc + parseFloat(order.total || 0), 0);
  const grandComplimentryTotal = getComplimenatryData.reduce((acc, order) => acc + parseFloat(order.total_amount || 0), 0);

  const graphLength = getData.length;
  const adsCampLength = getAdsData.length;
  const complimenatryLength = getComplimenatryData.length;
  const finalLength = graphLength + adsCampLength + complimenatryLength;
  const totalAmount = grandTotal + grandAdsTotal;

  // ─── Group plan data ───────────────────────────────────────────────────────
  const groupByPlan = (data) => {
    const grouped = {};
    data.forEach((item) => {
      if (!grouped[item.plan_id]) {
        grouped[item.plan_id] = {
          id: item.plan_id,
          title: item.plan_name,
          subtitle: "Custom Plan",
          description: `Includes ${item.plan_name} services tailored to your needs.`,
          gradient: "from-green-500 to-yellow-600",
          navigation: "/BD/dynamicPlan",
          features: [],
          totalAmount: 0,
        };
      }
      const qty = item.quantity ? ` - ${item.quantity}` : "";
      grouped[item.plan_id].features.push(`${item.service_name} - ${item.category_name}${qty}`);
      if (item.service_name?.toLowerCase() !== "complimentary") {
        grouped[item.plan_id].totalAmount += Number(item.total_amount || item.total_ads) || 0;
      }
    });
    return Object.values(grouped);
  };

  const plans = groupByPlan(getPlanData);

  // ─── Search filter ─────────────────────────────────────────────────────────
  const filteredPlans = plans.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setSearchQuery(plan.title);
    setDropdownOpen(false);
    setShowPlanPopup(true);
  };

  const generateUniqueId = () =>
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // ─── Create Quotation ──────────────────────────────────────────────────────
  const handleCreateQuotation = async (plan) => {
    if (loading) return;
    setLoading(true);
    try {
      const existingPlanName = String(planName || "").trim().toLowerCase();
      const selectedPlanName = String(plan?.title || "").trim().toLowerCase();

      if (existingPlanName && existingPlanName === selectedPlanName) return;

      const filteredNotes = await getAllPlanNotes(plan.title);

      if (filteredNotes.length === 0) {
        Swal.fire({ icon: "info", title: "No Notes", text: "No notes found for this plan.", showConfirmButton: false, timer: 1000 });
        return;
      }

      const filteredPlanData = getPlanData.filter((item) => item.plan_id === plan.id);

      if (filteredPlanData.length === 0) {
        Swal.fire({ icon: "info", title: "No Data", text: "No services found for this plan." });
        return;
      }

      if (existingPlanName && existingPlanName !== selectedPlanName) {
        await axios.delete(`${baseURL}/auth/api/calculator/deleteClientAllPlanData/${proposalId}`);
      }

      const planItems = filteredPlanData
        .filter((item) => item.service_name !== "Ads Campaign" && item.service_name !== "Complimentary")
        .map((item) => ({
          service_name: item.service_name,
          category_name: item.category_name,
          editing_type_id: item.editing_type_id,
          editing_type_name: item.editing_type_name,
          editing_type_amount: item.editing_type_amount,
          quantity: item.quantity,
          include_content_posting: item.include_content_posting,
          include_thumbnail_creation: item.include_thumbnail_creation,
          total_amount: item.total_amount,
          plan_name: item.plan_name,
          employee: userName,
        }));

      const adsItems = filteredPlanData
        .filter((item) => item.service_name === "Ads Campaign")
        .map((item) => ({
          txn_id: proposalId, client_id: id, id: generateUniqueId(),
          category: item.category_name, amount: item.amount_ads, percent: item.percent_ads,
          charge: item.charge_ads, total: item.total_ads, employee: userName,
        }));

      const complimentaryItems = filteredPlanData
        .filter((item) => item.service_name === "Complimentary")
        .map((item) => ({
          txn_id: proposalId, client_id: id,
          service_name: item.service_name, category_name: item.category_name,
          editing_type_id: item.editing_type_id, editing_type_name: item.editing_type_name,
          editing_type_amount: item.editing_type_amount, quantity: item.quantity,
          include_content_posting: item.include_content_posting,
          include_thumbnail_creation: item.include_thumbnail_creation,
          total_amount: item.total_amount, employee: userName,
        }));

      const planNotes = filteredNotes.map((item) => ({ note_name: item.note_name, plan: item.plan }));

      await axios.post(
        `${baseURL}/auth/api/calculator/savePlanClientNotes`,
        { txn_id: proposalId, client_id: id, plans: planItems, planNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (adsItems.length > 0) {
        await axios.post(
          `${baseURL}/auth/api/calculator/saveAdsCampaign`,
          { adsItems },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      for (const item of complimentaryItems) {
        await axios.post(
          `${baseURL}/auth/api/calculator/saveComplimentaryData`,
          item,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      Swal.fire({ icon: "success", title: "Quotation Created", text: "Plan quotation saved successfully!", showConfirmButton: false, timer: 1000 });
      setShowModal(true);
      setShowPlanPopup(false);
      setSelectedPlan(null);
      setSearchQuery("");
      fetchData(); fetchClientNotes(); fetchAdsData(); fetchComplimenatryData();
    } catch (err) {
      console.error("Save error:", err);
      Swal.fire({ icon: "error", title: "Error", text: "Something went wrong while saving the quotation.", showConfirmButton: false, timer: 1000 });
    } finally {
      setLoading(false);
    }
  };

  // ─── Delete handlers ──────────────────────────────────────────────────────
  const handleDeleteClientPlanData = async (txn_id) => {
    const confirm = await Swal.fire({ title: "Are you sure?", text: "Do you want to delete this client plan data permanently?", icon: "warning", showCancelButton: true, confirmButtonText: "Yes, delete it!" });
    if (confirm.isConfirmed) {
      try {
        const res = await axios.delete(`${baseURL}/auth/api/calculator/deleteClientAllPlanData/${txn_id}`);
        if (res.data.status === "Success") {
          Swal.fire({ icon: "success", title: "Deleted!", text: "Plan has been deleted.", showConfirmButton: false, timer: 1000 });
          setGetData([]); setPlanName(""); setNotesData([]); fetchClientNotes(); fetchAdsData(); setGetAdsData([]); setGetComplimenatryData([]);
        } else {
          Swal.fire("Error!", res.data.message || "Failed to delete plan.", "error");
        }
      } catch (err) {
        Swal.fire("Error!", "Something went wrong while deleting.", "error");
      }
    }
  };

  const handleDelete = async (entryId) => {
    const confirm = await Swal.fire({ title: "Are you sure?", text: "Do you really want to delete this entry?", icon: "warning", showCancelButton: true, confirmButtonColor: "#e11d48", cancelButtonColor: "#6b7280", confirmButtonText: "Yes, delete it!" });
    if (!confirm.isConfirmed) return;
    try {
      const res = await axios.delete(`${baseURL}/auth/api/calculator/deleteGraphicEntryById/${entryId}`);
      if (res.data.status === "Success") {
        setGetData((prev) => prev.filter((item) => item.id !== entryId));
        Swal.fire({ icon: "success", title: "Deleted!", text: "Entry has been deleted.", showConfirmButton: false, timer: 1000 });
        fetchClientNotes();
      } else {
        Swal.fire({ icon: "error", title: "Failed!", text: res.data.message || "Failed to delete entry.", showConfirmButton: false, timer: 1000 });
      }
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: "An error occurred while deleting entry.", showConfirmButton: false, timer: 1000 });
    }
  };

  const handleDeleteComplimenatry = async (entryId) => {
    const confirm = await Swal.fire({ title: "Are you sure?", text: "Do you really want to delete this entry?", icon: "warning", showCancelButton: true, confirmButtonColor: "#e11d48", cancelButtonColor: "#6b7280", confirmButtonText: "Yes, delete it!" });
    if (!confirm.isConfirmed) return;
    try {
      const res = await axios.delete(`${baseURL}/auth/api/calculator/deleteComplimenatryById/${entryId}`);
      if (res.data.status === "Success") {
        setGetComplimenatryData((prev) => prev.filter((item) => item.id !== entryId));
        Swal.fire({ icon: "success", title: "Deleted!", text: "Entry has been deleted.", showConfirmButton: false, timer: 1000 });
        fetchComplimenatryData();
      } else {
        Swal.fire({ icon: "error", title: "Failed!", text: res.data.message || "Failed to delete entry.", showConfirmButton: false, timer: 1000 });
      }
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: "An error occurred while deleting entry.", showConfirmButton: false, timer: 1000 });
    }
  };

  const handleDeleteClientNote = async (noteId) => {
    const confirm = await Swal.fire({ title: "Are you sure?", text: "Do you really want to delete this note?", icon: "warning", showCancelButton: true, confirmButtonColor: "#e11d48", cancelButtonColor: "#6b7280", confirmButtonText: "Yes, delete it!" });
    if (!confirm.isConfirmed) return;
    try {
      const res = await axios.delete(`${baseURL}/auth/api/calculator/deletePlanClientNotes/${noteId}`);
      if (res.data.status === "Success") {
        Swal.fire({ icon: "success", title: "Deleted!", text: "Note has been deleted.", timer: 1000, showConfirmButton: false });
        fetchClientNotes();
      } else {
        Swal.fire({ icon: "error", title: "Failed!", text: res.data.message || "Failed to delete entry.", showConfirmButton: false, timer: 1000 });
      }
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: "An error occurred while deleting entry.", showConfirmButton: false, timer: 1000 });
    }
  };

  const handleDeleteads = async (entryId) => {
    const confirm = await Swal.fire({ title: "Are you sure?", text: "Do you really want to delete this entry?", icon: "warning", showCancelButton: true, confirmButtonColor: "#e11d48", cancelButtonColor: "#6b7280", confirmButtonText: "Yes, delete it!" });
    if (!confirm.isConfirmed) return;
    try {
      const res = await axios.delete(`${baseURL}/auth/api/calculator/deleteAdsCampaignEntryById/${entryId}`);
      if (res.data.status === "Success") {
        setGetData((prev) => prev.filter((item) => item.id !== entryId));
        Swal.fire({ icon: "success", title: "Deleted!", text: "Entry has been deleted.", timer: 1000, showConfirmButton: false });
        fetchAdsData(); setGetAdsData([]); fetchClientNotes();
      } else {
        Swal.fire({ icon: "error", title: "Failed!", text: res.data.message || "Failed to delete entry.", showConfirmButton: false, timer: 1000 });
      }
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: "An error occurred while deleting entry.", showConfirmButton: false, timer: 1000 });
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 relative overflow-hidden flex flex-col">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[420px] h-[420px] bg-red-500/[0.06] rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -left-32 w-[420px] h-[420px] bg-orange-500/[0.06] rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/3 right-1/4 w-56 h-56 bg-yellow-500/[0.04] rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* ── MAIN LAYOUT: flex-col, fills screen ─────────────────────────── */}
      <div className="relative z-10 flex flex-col h-full px-4 sm:px-6 py-3 gap-3 overflow-hidden">

        {/* ── ROW 1: Back + Stats ───────────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Back */}
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl px-3 py-2 transition-all duration-200 group shrink-0"
          >
            <ArrowLeft className="w-4 h-4 transform transition-transform group-hover:-translate-x-1" />
            <span className="font-medium text-sm">Back</span>
          </button>

          {/* Stats row */}
          <div className="flex-1 flex overflow-x-auto sm:grid sm:grid-cols-4 gap-2 pb-1 pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {/* Total Amount */}
            <div className="min-w-[130px] sm:min-w-0 relative overflow-hidden bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-xl p-2.5 border border-white/10 hover:border-yellow-400/30 flex items-center gap-2 transition-all duration-200">
              <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-r" />
              <div className="w-8 h-8 bg-yellow-500/15 rounded-lg flex items-center justify-center shrink-0">
                <IndianRupee className="w-4 h-4 text-yellow-400" />
              </div>
              <div className="min-w-0">
                <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider truncate">Amount</p>
                <p className="text-sm font-bold text-white truncate">₹{totalAmount.toLocaleString()}</p>
              </div>
            </div>
            {/* Client */}
            <div className="min-w-[130px] sm:min-w-0 relative overflow-hidden bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-xl p-2.5 border border-white/10 hover:border-orange-400/30 flex items-center gap-2 transition-all duration-200">
              <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-orange-400 to-pink-500 rounded-r" />
              <div className="w-8 h-8 bg-orange-500/15 rounded-lg flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-orange-400" />
              </div>
              <div className="min-w-0">
                <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider truncate">Client</p>
                <p className="text-sm font-bold text-white truncate">{clientName || "N/A"}</p>
              </div>
            </div>
            {/* Orders */}
            <div className="min-w-[130px] sm:min-w-0 relative overflow-hidden bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-xl p-2.5 border border-white/10 hover:border-red-400/30 flex items-center gap-2 transition-all duration-200">
              <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-red-400 to-amber-500 rounded-r" />
              <div className="w-8 h-8 bg-red-500/15 rounded-lg flex items-center justify-center shrink-0">
                <Package className="w-4 h-4 text-red-400" />
              </div>
              <div className="min-w-0">
                <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider truncate">Orders</p>
                <p className="text-sm font-bold text-white truncate">{finalLength}</p>
              </div>
            </div>
            {/* Quotation */}
            <div className="min-w-[140px] sm:min-w-0 relative overflow-hidden bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-xl p-2.5 border border-white/10 hover:border-amber-400/30 transition-all duration-200">
              <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-amber-400 to-orange-500 rounded-r" />
              {finalLength ? (
                <button onClick={() => setShowModal(true)} className="w-full text-left flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-500/15 rounded-lg flex items-center justify-center shrink-0">
                    <Eye className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider truncate">Quotation</p>
                    <p className="text-sm font-bold text-white flex items-center gap-1 group/btn">
                      Preview <ArrowRight className="w-3 h-3 transform transition-transform group-hover/btn:translate-x-1" />
                    </p>
                  </div>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-500/15 rounded-lg flex items-center justify-center shrink-0">
                    <Notebook className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-white/30 text-xs">No quotation yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── ROW 2: Plan Search Bar (prominent, top) ───────────────────── */}
        <div className="flex-shrink-0" ref={searchRef}>
          <div className="relative">
            {/* Label */}
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5 flex items-center gap-1.5">
              <Star className="w-3 h-3 text-yellow-400" />
              Plan Wise Search
            </p>
            <div className="flex gap-2">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setDropdownOpen(true);
                    if (!e.target.value) { setSelectedPlan(null); setShowPlanPopup(false); }
                  }}
                  onFocus={() => setDropdownOpen(true)}
                  placeholder="Type to search a plan..."
                  className="w-full bg-white/[0.06] border border-white/10 rounded-xl pl-10 pr-8 py-2.5 text-white placeholder-white/25 text-sm outline-none focus:border-yellow-400/40 focus:bg-white/[0.09] focus:shadow-[0_0_15px_rgba(250,204,21,0.08)] transition-all duration-200"
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(""); setSelectedPlan(null); setShowPlanPopup(false); setDropdownOpen(false); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {/* Dropdown toggle */}
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="bg-white/[0.06] border border-white/10 hover:bg-white/[0.12] hover:border-white/20 rounded-xl px-3 py-2.5 text-white/50 hover:text-white transition-all duration-200 flex items-center gap-1.5 text-sm font-medium"
              >
                Plans <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>
            </div>

            {/* Dropdown list */}
            {dropdownOpen && filteredPlans.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900/98 backdrop-blur-xl border border-white/15 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] z-50 max-h-48 overflow-y-auto">
                {filteredPlans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => handlePlanSelect(plan)}
                    className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/[0.07] transition-all duration-150 flex items-center justify-between gap-3 border-b border-white/5 last:border-0"
                  >
                    <span className="flex items-center gap-2">
                      <Star className="w-3 h-3 text-yellow-400/60" />
                      <span className="font-medium">{plan.title}</span>
                    </span>
                    <span className="text-yellow-400 font-bold text-xs bg-yellow-400/10 px-2 py-0.5 rounded-md shrink-0">₹{plan.totalAmount.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            )}
            {dropdownOpen && searchQuery && filteredPlans.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900/98 backdrop-blur-xl border border-white/15 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] z-50 px-4 py-3 text-white/40 text-sm">
                No plan found for "{searchQuery}"
              </div>
            )}
          </div>
        </div>

        {/* ── ROW 3: Service Cards + Data Tables side by side ──────────── */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-3 min-h-0">

          {/* Left: Compact service quick-links */}
          <div className="lg:col-span-1 flex flex-col gap-1.5 lg:min-h-0 lg:overflow-hidden overflow-visible flex-shrink-0">
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.15em] flex-shrink-0">Services</p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:flex lg:flex-col gap-2 lg:gap-1.5 lg:overflow-y-auto pb-2 lg:pb-0 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {services.map((service) => {
                const IconComponent = service.icon;
                return (
                  <div key={service.id} className="w-full shrink-0 group relative overflow-hidden bg-gradient-to-r from-white/[0.06] to-white/[0.03] rounded-xl border border-white/10 hover:border-white/20 transition-all duration-200 flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-3 py-2.5 cursor-pointer hover:bg-white/[0.09]"
                    onClick={() => navigate(`${service.navigation}/${id}/${proposalId}`)}>
                    <div className={`absolute left-0 top-0 w-[3px] h-full bg-gradient-to-b ${service.gradient} rounded-r opacity-70`} />
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${service.gradient} shadow flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105`}>
                      <IconComponent className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-xs truncate leading-tight">{service.title}</p>
                      <p className={`text-[9px] font-semibold uppercase tracking-wider bg-gradient-to-r ${service.gradient} bg-clip-text text-transparent truncate`}>{service.subtitle}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/60 transform group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
                  </div>
                );
              })}
            </div>

            {/* Active Plan */}
            {planName && (
              <div className="flex-shrink-0 relative overflow-hidden bg-gradient-to-r from-yellow-500/10 to-white/[0.03] rounded-xl border border-yellow-400/20 px-3 py-2 flex items-center justify-between gap-2 mt-1">
                <div className="absolute left-0 top-0 w-[3px] h-full bg-gradient-to-b from-yellow-400 to-yellow-500 rounded-r" />
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-yellow-300/60 text-[9px] font-semibold uppercase tracking-wider">Active Plan</p>
                    <p className="text-white font-semibold text-[11px] truncate">{planName}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteClientPlanData(proposalId)}
                  className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-red-500/15 text-red-300 hover:bg-red-500 hover:text-white border border-red-400/25 transition-all duration-200 shrink-0"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* Right: Data Tables (wider) */}
          <div className="lg:col-span-4 flex flex-col gap-2 min-h-0 overflow-hidden">
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.15em] flex-shrink-0">Recent Orders</p>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">

              {/* Inline Selected Plan */}
              {selectedPlan && (
                <div className="relative bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-yellow-400/30 rounded-2xl p-4 md:p-6 mb-4 flex flex-col gap-4 md:gap-5 transition-all shadow-[0_0_20px_rgba(52,211,153,0.1)]">
                  <button onClick={() => setSelectedPlan(null)} className="absolute top-3 right-3 text-white/40 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full p-1.5 z-10"><X className="w-4 h-4" /></button>
                  
                  {/* Top: Header & Action */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start md:items-center gap-4 min-w-0 pr-8">
                      <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-r ${selectedPlan.gradient} shadow-lg flex items-center justify-center shrink-0`}>
                        <Star className="w-6 h-6 md:w-7 md:h-7 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                           <h3 className="text-lg md:text-xl font-bold text-white truncate">{selectedPlan.title}</h3>
                           <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r ${selectedPlan.gradient} text-white px-2 py-0.5 rounded-full shrink-0`}>SELECTED PLAN</span>
                        </div>
                        <p className="text-white/60 text-xs md:text-sm leading-relaxed mb-0">{selectedPlan.description}</p>
                      </div>
                    </div>
                    {/* Price and Action */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 shrink-0 pt-3 md:pt-0 border-t border-white/10 md:border-t-0">
                       <div className="text-left md:text-right">
                          <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-0.5">Total Amount</p>
                          <p className="text-xl md:text-2xl font-bold text-white leading-none">₹{selectedPlan.totalAmount.toLocaleString()}</p>
                       </div>
                       <button
                         onClick={() => handleCreateQuotation(selectedPlan)}
                         disabled={loading}
                         className={`w-auto py-2 px-5 md:py-2.5 md:px-6 rounded-xl font-semibold text-white text-xs md:text-sm bg-gradient-to-r ${selectedPlan.gradient} shadow-lg hover:shadow-xl hover:scale-[1.02] transform transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                       >
                         {loading ? "Saving..." : "Create Quotation"}
                         {!loading && <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                       </button>
                    </div>
                  </div>

                  {/* Bottom: Features */}
                  {selectedPlan.features.length > 0 && (
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-2.5">Included Features</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                        {selectedPlan.features.map((feature, i) => (
                           <div key={i} className="flex items-start gap-2 text-xs md:text-sm text-white/80 bg-white/[0.03] p-2 md:p-2.5 rounded-xl border border-white/[0.05] hover:bg-white/[0.08] transition-colors">
                             <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-gradient-to-r ${selectedPlan.gradient} mt-1.5 shrink-0`}></div>
                             <span className="whitespace-normal leading-relaxed">{feature}</span>
                           </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Graphic & SEO */}
              {getData.length > 0 && (
                <div className="relative overflow-hidden bg-gradient-to-br from-white/[0.06] to-white/[0.02] rounded-2xl border border-white/10">
                  <div className="h-[2px] w-full bg-gradient-to-r from-slate-500 to-gray-600" />
                  <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
                    <span className="text-white font-semibold text-sm flex items-center gap-1.5">
                      <Palette className="w-4 h-4 text-slate-400" /> Graphic & SEO
                    </span>
                    <span className="text-yellow-400 font-bold text-xs bg-yellow-400/10 px-2 py-0.5 rounded-md">₹{grandTotal.toLocaleString()}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-xs text-white">
                      <thead className="bg-white/5 text-white/60">
                        <tr>
                          {["#", "Date", "Service", "Category", "Editing Type", "Qty", "Amount", "Action"].map(h => (
                            <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {getData.map((order, index) => (
                          <tr key={order.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-3 py-2 whitespace-nowrap">{index + 1}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{order.created_at}</td>
                            <td className="px-3 py-2 min-w-[100px]">{order.service_name}</td>
                            <td className="px-3 py-2 min-w-[100px]">{order.category_name}</td>
                            <td className="px-3 py-2 min-w-[100px]">{order.editing_type_name}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{order.quantity}</td>
                            <td className="px-3 py-2 whitespace-nowrap">₹{order.total_amount}</td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <button className="px-2 py-1 rounded-md text-[10px] font-semibold bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white border border-red-500/30 transition-all"
                                  onClick={() => navigate(`/BD/calculator/${id}/${proposalId}`, { state: { servicetype: "paid" } })}>Edit</button>
                                <button onClick={() => handleDelete(order.id)} className="px-2 py-1 rounded-md text-[10px] font-semibold bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white border border-red-500/30 transition-all">Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Ads Campaign */}
              {getAdsData.length > 0 && (
                <div className="relative overflow-hidden bg-gradient-to-br from-white/[0.06] to-white/[0.02] rounded-2xl border border-white/10">
                  <div className="h-[2px] w-full bg-gradient-to-r from-red-500 to-slate-600" />
                  <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
                    <span className="text-white font-semibold text-sm flex items-center gap-1.5">
                      <Megaphone className="w-4 h-4 text-red-400" /> Campaigns
                    </span>
                    <span className="text-yellow-400 font-bold text-xs bg-yellow-400/10 px-2 py-0.5 rounded-md">₹{grandAdsTotal.toLocaleString()}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-xs text-white">
                      <thead className="bg-white/5 text-white/60">
                        <tr>
                          {["#", "Date", "Service", "Amt", "%", "Charge", "Total", "Action"].map(h => (
                            <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {getAdsData.map((order, index) => (
                          <tr key={order.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-3 py-2">{index + 1}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{order.created_at}</td>
                            <td className="px-3 py-2 min-w-[100px]">{order.category}</td>
                            <td className="px-3 py-2 whitespace-nowrap">₹{order.amount}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{order.percent}%</td>
                            <td className="px-3 py-2 whitespace-nowrap">₹{order.charge}</td>
                            <td className="px-3 py-2 whitespace-nowrap">₹{order.total}</td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <button className="px-2 py-1 rounded-md text-[10px] font-semibold bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white border border-red-500/30 transition-all"
                                  onClick={() => navigate(`/BD/Adscalculator/${id}/${proposalId}`)}>Edit</button>
                                <button onClick={() => handleDeleteads(order.id)} className="px-2 py-1 rounded-md text-[10px] font-semibold bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white border border-red-500/30 transition-all">Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Complimentary */}
              {getComplimenatryData.length > 0 && (
                <div className="relative overflow-hidden bg-gradient-to-br from-white/[0.06] to-white/[0.02] rounded-2xl border border-white/10">
                  <div className="h-[2px] w-full bg-gradient-to-r from-yellow-400 to-orange-500" />
                  <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
                    <span className="text-white font-semibold text-sm flex items-center gap-1.5">
                      <Gift className="w-4 h-4 text-yellow-400" /> Complimentary
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-orange-300 font-bold text-xs bg-orange-400/10 px-2 py-0.5 rounded-md">₹{grandComplimentryTotal.toLocaleString()}</span>
                      <span className="text-yellow-400 font-bold text-xs bg-yellow-400/10 px-2 py-0.5 rounded-md">₹0</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-xs text-white">
                      <thead className="bg-white/5 text-white/60">
                        <tr>
                          {["#", "Date", "Service", "Category", "Editing Type", "Qty", "Amount", "Action"].map(h => (
                            <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {getComplimenatryData.map((order, index) => (
                          <tr key={order.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-3 py-2">{index + 1}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{order.created_at}</td>
                            <td className="px-3 py-2 min-w-[100px]">{order.service_name}</td>
                            <td className="px-3 py-2 min-w-[100px]">{order.category_name}</td>
                            <td className="px-3 py-2 min-w-[100px]">{order.editing_type_name}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{order.quantity}</td>
                            <td className="px-3 py-2 whitespace-nowrap">₹{order.total_amount}</td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <button className="px-2 py-1 rounded-md text-[10px] font-semibold bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white border border-red-500/30 transition-all"
                                  onClick={() => navigate(`/BD/calculator/${id}/${proposalId}`, { state: { servicetype: "complimentary" } })}>Edit</button>
                                <button onClick={() => handleDeleteComplimenatry(order.id)} className="px-2 py-1 rounded-md text-[10px] font-semibold bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white border border-red-500/30 transition-all">Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Empty state (Replaced with Mini Plans Grid) */}
              {getData.length === 0 && getAdsData.length === 0 && getComplimenatryData.length === 0 && !selectedPlan && (
                <div className="flex-1 flex flex-col py-2 px-1">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <h3 className="text-white/80 font-semibold text-sm">Select a Plan to get started</h3>
                  </div>
                  
                  {plans.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 pb-4">
                      {plans.map((plan) => (
                        <button
                          key={plan.id}
                          onClick={() => handlePlanSelect(plan)}
                          className="group text-left bg-gradient-to-br from-white/[0.06] to-white/[0.02] hover:bg-white/[0.08] border border-white/10 hover:border-yellow-400/40 rounded-[14px] p-3 md:p-4 transition-all duration-300 flex flex-col gap-2 shadow-sm hover:shadow-[0_4px_20px_rgba(52,211,153,0.15)] relative overflow-hidden"
                        >
                          <div className={`absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r ${plan.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />
                          <div className="flex items-center gap-2 min-w-0 w-full">
                            <Star className="w-4 h-4 text-yellow-400 shrink-0" />
                            <h4 className="text-white font-bold text-[13px] md:text-sm truncate pr-2">{plan.title}</h4>
                          </div>
                          
                          <div className="flex flex-col mt-auto pt-2">
                            <span className="text-white/30 text-[9px] uppercase tracking-[0.15em] font-bold mb-0.5">Total Amount</span>
                            <span className="text-white group-hover:text-yellow-400 font-bold text-[15px] md:text-base transition-colors">₹{plan.totalAmount.toLocaleString()}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center mt-10 mb-8 border border-white/5 rounded-2xl bg-white/[0.02] py-10">
                      <div className="relative mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                          <Package className="w-6 h-6 text-white/20" />
                        </div>
                      </div>
                      <h4 className="text-white/50 text-sm font-semibold mb-1">No Plans Found</h4>
                      <p className="text-white/20 text-xs text-center max-w-[200px]">No predefined plans are currently available.</p>
                    </div>
                  )}

                  <div className="w-full h-px bg-white/5 my-4" />

                  {/* Quick action buttons */}
                  <div className="flex items-center gap-3">
                    <span className="text-white/30 text-[10px] font-bold uppercase tracking-wider">Or create manually:</span>
                    <button
                      onClick={() => navigate(`/BD/calculator/${id}/${proposalId}`, { state: { servicetype: "paid" } })}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-1.5"
                    >
                      <Palette className="w-3 h-3" /> Add Graphic
                    </button>
                    <button
                      onClick={() => navigate(`/BD/Adscalculator/${id}/${proposalId}`)}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-1.5"
                    >
                      <Megaphone className="w-3 h-3" /> Add Campaign
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Plan Card POPUP ───────────────────────────────────────────────── */}
      {showPlanPopup && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowPlanPopup(false); }}>
          <div className="relative bg-gray-900/95 border border-white/20 rounded-3xl shadow-2xl w-full max-w-sm
            animate-[fadeInScale_0.22s_cubic-bezier(.22,1,.36,1)_both]"
            style={{ animation: "fadeInScale 0.22s cubic-bezier(.22,1,.36,1) both" }}>
            <style>{`@keyframes fadeInScale{from{opacity:0;transform:scale(.92) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>

            {/* Close */}
            <button onClick={() => setShowPlanPopup(false)}
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all">
              <X className="w-4 h-4" />
            </button>

            <div className="p-6">
              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${selectedPlan.gradient} shadow-lg flex items-center justify-center mb-4`}>
                <Star className="w-7 h-7 text-white" />
              </div>

              {/* Title & amount */}
              <h3 className="text-xl font-bold text-white mb-0.5">{selectedPlan.title}</h3>
              <p className={`text-xs font-medium bg-gradient-to-r ${selectedPlan.gradient} bg-clip-text text-transparent mb-1`}>Plan</p>
              <p className="text-2xl font-bold text-white mb-3">₹{selectedPlan.totalAmount.toLocaleString()}</p>

              {/* Description */}
              <p className="text-white/60 text-sm leading-relaxed mb-4">{selectedPlan.description}</p>

              {/* Features */}
              {selectedPlan.features.length > 0 && (
                <div className="space-y-1.5 mb-5 max-h-36 overflow-y-auto pr-1">
                  {selectedPlan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-white/60">
                      <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${selectedPlan.gradient} mt-1 shrink-0`}></div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* CTA */}
              <button
                onClick={() => handleCreateQuotation(selectedPlan)}
                disabled={loading}
                className={`w-full py-3 px-6 rounded-2xl font-semibold text-white text-sm bg-gradient-to-r ${selectedPlan.gradient} shadow-lg hover:shadow-xl hover:scale-[1.02] transform transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? "Saving..." : "Create Quotation"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Quotation Type Modal ──────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative bg-gray-900 border border-gray-700 p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-md">
            <button onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700">✕</div>
            </button>
            <div className="text-center mb-8 mt-2">
              <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Notebook className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">Select Quotation Type</h2>
              <p className="text-gray-400 text-sm mt-2">Choose how you want to generate this quotation</p>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button onClick={() => { navigate(`/BD/quotation/${id}/${proposalId}?gst=1`); setShowModal(false); }}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2">
                With GST (18%)
              </button>
              <button onClick={() => { navigate(`/BD/quotation/${id}/${proposalId}?gst=0`); setShowModal(false); }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2">
                Without GST
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
