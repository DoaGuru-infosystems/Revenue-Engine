import React, { useEffect, useState, useRef } from "react";
import { useTheme } from "../../../context/ThemeContext";
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
  BadgePercent,
} from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import Swal from "sweetalert2";
import { clearUser } from "../../../redux/user/userSlice";
import API_BASE_URL from "../../../config/apiBaseUrl";
import ProposalDiscountModal from "../../proposals/components/ProposalDiscountModal";

export default function ServicesLandingPage() {
  const baseURL = API_BASE_URL;
  const navigate = useNavigate();
  const location = useLocation();
  const isBd = location.pathname.startsWith("/BD");
  const basePath = isBd ? "/BD" : "/admin";
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
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [showModal, setShowModal] = useState(false);
  const userName = currentUser?.name;
  const dispatch = useDispatch();

  // Discount State
  const [discountType, setDiscountType] = useState("Amount");
  const [discountValue, setDiscountValue] = useState(0);
  const [discountSettings, setDiscountSettings] = useState([]);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [formDataDis, setFormDataDis] = useState({
    discount_type: "amount",
    discount_amt: "",
    discount_per: "",
  });

  // Search & Plan Popup State
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPlanPopup, setShowPlanPopup] = useState(false);
  const searchRef = useRef(null);

  const customServicesCards = [
    {
      id: "graphic",
      title: "Graphic & SEO",
      subtitle: "Visual Storytelling",
      description:
        "Transform your brand with stunning visuals that captivate and convert, from logos to complete brand identities.",
      icon: Palette,
      gradient: "from-slate-500 to-gray-600",
      buttonGradient: "from-slate-600 to-gray-600",
      features: ["Logo Design", "Brand Identity", "Print Materials", "Digital Graphics", "SEO Services"],
      navigation: `${basePath}/calculator/${id}/${proposalId}`,
      navigationState: { servicetype: "paid" },
    },
    {
      id: "ads",
      title: "Ads Campaigns",
      subtitle: "Strategic Growth",
      description:
        "Amplify your reach with data-driven advertising campaigns that deliver measurable results across all channels.",
      icon: Megaphone,
      gradient: "from-red-500 to-orange-600",
      buttonGradient: "from-red-600 to-slate-600",
      features: ["Social Media Ads", "Google Ads", "Campaign Strategy", "Analytics & ROI"],
      navigation: `${basePath}/adsCampaignCalculator/${id}/${proposalId}`,
    },
  ];

  const searchParams = new URLSearchParams(location.search);
  const docTypeFromURL = searchParams.get("doc");

  const handleCustomServiceNavigate = (card) => {
    let target = card.navigation;
    if (!target.includes(`/${id}/${proposalId}`)) {
      target = `${target}/${id}/${proposalId}`;
    }
    const navUrl = docTypeFromURL === "proforma" ? `${target}?doc=proforma` : target;
    if (card.navigationState) {
      navigate(navUrl, { state: card.navigationState });
      return;
    }
    navigate(navUrl);
  };

  const handleUnauthorized = () => {
    Swal.fire({
      title: "Session Expired",
      text: "Please login again.",
      icon: "warning",
      confirmButtonText: "OK",
    }).then(() => {
      dispatch(clearUser());
      localStorage.removeItem("token");
      navigate("/");
    });
  };

  const fetchClient = async () => {
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/re_calculator/getClientDetailsById/${id}`,
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
        `${baseURL}/auth/api/re_calculator/getAllPlanData`,
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
        `${baseURL}/auth/api/re_calculator/getPlanNotes`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.status === "Success") {
        return response.data.data.filter((item) => item.plan === planTitle);
      }
      return [];
    } catch (error) {
      if (error.response?.status === 401) handleUnauthorized();
      return [];
    }
  };

  const fetchClientNotes = async () => {
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/re_calculator/getClientNotesById/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.status === "Success") {
        setNotesData(res.data.data.filter((item) => item.plan === planName));
      }
    } catch (error) {
      if (error.response?.status === 401) handleUnauthorized();
    }
  };

  const fetchData = async () => {
    try {
      let endpoint = `${baseURL}/auth/api/re_calculator/getByIDCalculatorTransactions/${proposalId}/${id}`;
      if (docTypeFromURL === "proforma") {
        endpoint = `${baseURL}/auth/api/re_calculator/proformas/snapshot/${proposalId}`;
      }
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.status === "Success") {
        if (docTypeFromURL === "proforma") {
          const parsed = JSON.parse(res.data.data.graphic_snapshot || "[]");
          setGetData(parsed);
          setPlanName(parsed[0]?.plan_name || "");
        } else {
          setGetData(res.data.data);
          setPlanName(res.data.data[0]?.plan_name || "");
        }
      }
    } catch (error) {
      if (error.response?.status === 401) handleUnauthorized();
    }
  };

  const fetchAdsData = async () => {
    try {
      let endpoint = `${baseURL}/auth/api/re_calculator/getByIDAdsCampaignDetails/${proposalId}/${id}`;
      if (docTypeFromURL === "proforma") {
        endpoint = `${baseURL}/auth/api/re_calculator/proformas/snapshot/${proposalId}`;
      }
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.status === "Success") {
        if (docTypeFromURL === "proforma") {
          const parsed = JSON.parse(res.data.data.ads_snapshot || "[]");
          setGetAdsData(parsed);
        } else {
          setGetAdsData(res.data.data);
        }
      }
    } catch (error) {
      if (error.response?.status === 401) handleUnauthorized();
    }
  };

  const fetchComplimenatryData = async () => {
    try {
      let endpoint = `${baseURL}/auth/api/re_calculator/getByIDComplimentaryData/${proposalId}/${id}`;
      if (docTypeFromURL === "proforma") {
        endpoint = `${baseURL}/auth/api/re_calculator/proformas/snapshot/${proposalId}`;
      }
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.status === "Success") {
        if (docTypeFromURL === "proforma") {
          const parsed = JSON.parse(res.data.data.complimentary_snapshot || "[]");
          setGetComplimenatryData(parsed);
        } else {
          setGetComplimenatryData(res.data.data);
        }
      }
    } catch (error) {
      if (error.response?.status === 401) handleUnauthorized();
    }
  };

  const fetchDiscountSettings = async () => {
    try {
      const response = await axios.get(
        `${baseURL}/auth/api/re_calculator/getDiscountSetting`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDiscountSettings(response.data.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchClient();
    fetchPlanData();
    fetchData();
    fetchAdsData();
    fetchComplimenatryData();
    fetchDiscountSettings();
  }, [id, proposalId]);

  useEffect(() => {
    if (planName) fetchClientNotes();
  }, [planName]);

  const groupByPlan = (data) => {
    const grouped = {};
    data.forEach((item) => {
      const key = item.plan_id;
      if (!grouped[key]) {
        grouped[key] = {
          id: item.plan_id,
          title: item.plan_name,
          subtitle: "Complete Digital Growth Suite",
          description: "All-in-one package for your brand growth.",
          price: 0,
          services: [],
          features: [],
          gradient: "from-blue-600 to-indigo-700",
        };
      }
      grouped[key].services.push(item);
      const isAds = item.service_name === "Ads Campaign";
      const isComp = item.service_name === "Complimentary";
      const itemCost = isAds
        ? Number(item.total_ads) || 0
        : isComp
        ? 0
        : Number(item.total_amount) || 0;
      grouped[key].price += itemCost;
      const feat = isAds
        ? `${item.category_name} (Ads Budget: ₹${item.amount_ads})`
        : isComp
        ? `${item.category_name} (${item.editing_type_name}) - Free`
        : `${item.service_name} - ${item.category_name}`;
      if (!grouped[key].features.includes(feat)) grouped[key].features.push(feat);
    });
    return Object.values(grouped);
  };

  const plans = groupByPlan(getPlanData);
  const filteredPlans = plans.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setSearchQuery(plan.title);
    setDropdownOpen(false);
    setShowPlanPopup(true);
  };

  const generateUniqueId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleCreateQuotation = async (plan) => {
    if (loading) return;
    setLoading(true);
    try {
      const existingPlanName = String(planName || "").trim().toLowerCase();
      const selectedPlanName = String(plan?.title || "").trim().toLowerCase();

      if (existingPlanName && existingPlanName === selectedPlanName) return;

      const filteredNotes = await getAllPlanNotes(plan.title);

      if (filteredNotes.length === 0) {
        Swal.fire({
          icon: "info",
          title: "No Notes",
          text: "No notes found for this plan.",
          showConfirmButton: false,
          timer: 1000,
        });
        return;
      }

      const filteredPlanData = getPlanData.filter((item) => item.plan_id === plan.id);
      if (filteredPlanData.length === 0) {
        Swal.fire({ icon: "info", title: "No Data", text: "No services found for this plan." });
        return;
      }

      if (existingPlanName && existingPlanName !== selectedPlanName) {
        await axios.delete(`${baseURL}/auth/api/re_calculator/deleteClientAllPlanData/${proposalId}`);
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
          txn_id: proposalId,
          client_id: id,
          id: generateUniqueId(),
          category: item.category_name,
          amount: item.amount_ads,
          percent: item.percent_ads,
          charge: item.charge_ads,
          total: item.total_ads,
          employee: userName,
        }));

      const complimentaryItems = filteredPlanData
        .filter((item) => item.service_name === "Complimentary")
        .map((item) => ({
          txn_id: proposalId,
          client_id: id,
          service_name: item.service_name,
          category_name: item.category_name,
          editing_type_id: item.editing_type_id,
          editing_type_name: item.editing_type_name,
          editing_type_amount: item.editing_type_amount,
          quantity: item.quantity,
          include_content_posting: item.include_content_posting,
          include_thumbnail_creation: item.include_thumbnail_creation,
          total_amount: item.total_amount,
          employee: userName,
        }));

      const planNotes = filteredNotes.map((item) => ({ note_name: item.note_name, plan: item.plan }));

      await axios.post(
        `${baseURL}/auth/api/re_calculator/savePlanClientNotes`,
        { txn_id: proposalId, client_id: id, plans: planItems, planNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (adsItems.length > 0) {
        await axios.post(
          `${baseURL}/auth/api/re_calculator/saveAdsCampaign`,
          { adsItems },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      for (const item of complimentaryItems) {
        await axios.post(`${baseURL}/auth/api/re_calculator/saveComplimentaryData`, item, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      Swal.fire({
        icon: "success",
        title: "Quotation Created",
        text: "Plan quotation saved successfully!",
        showConfirmButton: false,
        timer: 1000,
      });

      setShowModal(true);
      setShowPlanPopup(false);
      setSelectedPlan(null);
      setSearchQuery("");
      fetchData();
      fetchClientNotes();
      fetchAdsData();
      fetchComplimenatryData();
    } catch (err) {
      console.error("Save error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong while saving the quotation.",
        showConfirmButton: false,
        timer: 1000,
      });
    } finally {
      setLoading(false);
    }
  };

  const subtotalGraphic = getData.reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0);
  const subtotalAds = getAdsData.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const grandTotal = subtotalGraphic + subtotalAds;

  const handleApplyDiscount = (e) => {
    e.preventDefault();
    if (formDataDis.discount_type === "percent") {
      setDiscountType("Percentage");
      setDiscountValue(Number(formDataDis.discount_per));
    } else {
      setDiscountType("Amount");
      setDiscountValue(Number(formDataDis.discount_amt));
    }
    setShowDiscountModal(false);
  };

  const handleRemoveDiscount = () => {
    setDiscountValue(0);
    setShowDiscountModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      {/* Top Header */}
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
              Services Catalog
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Client: {clientData[0]?.client_name || "Client"}
            </p>
          </div>
        </div>

        {/* Search Plan */}
        <div className="relative w-full sm:w-72" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setDropdownOpen(true)}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ready plans..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800/80 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:border-amber-500 text-sm outline-none"
          />
          {dropdownOpen && filteredPlans.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
              {filteredPlans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => handlePlanSelect(plan)}
                  className="p-3 border-b border-gray-700/50 hover:bg-gray-700/50 cursor-pointer transition"
                >
                  <p className="font-semibold text-sm text-white">{plan.title}</p>
                  <p className="text-xs text-amber-400 mt-0.5">
                    ₹{plan.price.toLocaleString()} • {plan.services.length} services
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Custom Services Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {customServicesCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onClick={() => handleCustomServiceNavigate(card)}
              className="group relative bg-gray-800/50 hover:bg-gray-800 border border-gray-700/60 hover:border-amber-500/50 rounded-2xl p-6 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-amber-500/10 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition">
                      {card.title}
                    </h3>
                    <p className="text-xs text-gray-400">{card.subtitle}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed mb-6">{card.description}</p>
                <div className="space-y-1.5 mb-6">
                  {card.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
                <span className="text-xs text-gray-400">Configure deliverables</span>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-amber-400 group-hover:translate-x-1 transition">
                  Open Calculator <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Services Summary */}
      {(getData.length > 0 || getAdsData.length > 0 || getComplimenatryData.length > 0) && (
        <div className="max-w-6xl mx-auto bg-gray-800/40 border border-gray-700/60 rounded-2xl p-6 mb-12">
          <div className="flex items-center justify-between pb-4 border-b border-gray-700/60 mb-6">
            <h2 className="text-xl font-bold text-white">Current Services Selection</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  navigate(
                    `${basePath}/proforma/${id}/${proposalId}${
                      docTypeFromURL === "proforma" ? "?doc=proforma" : ""
                    }`
                  )
                }
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition"
              >
                Go to Proforma
              </button>
              <button
                onClick={() =>
                  navigate(
                    `${basePath}/quotation/${id}/${proposalId}${
                      docTypeFromURL === "proforma" ? "?doc=proforma" : ""
                    }`
                  )
                }
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold rounded-xl transition shadow-md"
              >
                Go to Quotation
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Graphic & SEO ({getData.length})
              </h4>
              <p className="text-2xl font-bold text-white">₹{subtotalGraphic.toLocaleString()}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Ads Campaigns ({getAdsData.length})
              </h4>
              <p className="text-2xl font-bold text-white">₹{subtotalAds.toLocaleString()}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Grand Total (Excl. GST)
              </h4>
              <p className="text-2xl font-bold text-amber-400">₹{grandTotal.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Plan Details Modal */}
      {showPlanPopup && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white">{selectedPlan.title}</h3>
              <button
                onClick={() => setShowPlanPopup(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Total Price:</span>
                <span className="text-2xl font-bold text-amber-400">
                  ₹{selectedPlan.price.toLocaleString()}
                </span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Included Deliverables:
                </p>
                {selectedPlan.features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-800">
              <button
                onClick={() => setShowPlanPopup(false)}
                className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCreateQuotation(selectedPlan)}
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl text-sm transition"
              >
                {loading ? "Saving..." : "Apply This Plan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quotation Type Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative bg-gray-900 border border-gray-700 p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-md">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700">
                ✕
              </div>
            </button>
            <div className="text-center mb-8 mt-2">
              <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Notebook className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">Select Quotation Type</h2>
              <p className="text-gray-400 text-sm mt-2">
                Choose how you want to generate this quotation
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={() => {
                  navigate(
                    `${basePath}/quotation/${id}/${proposalId}?gst=1${
                      docTypeFromURL === "proforma" ? "&doc=proforma" : ""
                    }`
                  );
                  setShowModal(false);
                }}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                With GST (18%)
              </button>
              <button
                onClick={() => {
                  navigate(
                    `${basePath}/quotation/${id}/${proposalId}?gst=0${
                      docTypeFromURL === "proforma" ? "&doc=proforma" : ""
                    }`
                  );
                  setShowModal(false);
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                Without GST
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discount Modal */}
      <ProposalDiscountModal
        show={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        onSubmit={handleApplyDiscount}
        onDelete={discountValue > 0 ? handleRemoveDiscount : null}
        formDataDis={formDataDis}
        handleChangeDis={(e) => {
          const { name, value } = e.target;
          setFormDataDis((prev) => ({ ...prev, [name]: value }));
        }}
        grandTotal={grandTotal}
        discountDataSet={discountSettings[0]}
      />
    </div>
  );
}
