import axios from "axios";
import { ArrowRight, User, Phone, Mail, MapPin, X, Building, LayoutGrid, CheckCircle2, List, Search, ChevronDown } from "lucide-react";
import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/apiBaseUrl";

function AdminExplorePlans() {
  const [getPlanData, setGetPlanData] = useState([]);
  const { currentUser, token } = useSelector((state) => state.user);
  const [allPlanNote, setAllPlanNote] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null); // Track selected plan
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [planid, setPlanId] = useState("");
  const [planName, setPlanName] = useState("");
  const [formData, setFormData] = useState({
    client_name: "",
    client_organization: "",
    email: "",
    phone: "",
    address: "",
    dg_employee: currentUser?.name,
  });

  const baseURL = API_BASE_URL;
  const navigate = useNavigate();

  // Data Fetching Logic (Keeping your original logic)
  const fetchPlanData = async () => {
    try {
      const res = await axios.get(`${baseURL}/auth/api/re_calculator/getAllPlanData`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.status === "Success") {
        const grouped = groupByPlan(res.data.data);
        setGetPlanData(res.data.data);
        if (grouped.length > 0) setSelectedPlanId(grouped[0].id); // Default first plan
      }
    } catch (error) {
      console.log(error);
    }
  };

  const groupByPlan = (data) => {
    const grouped = {};
    data.forEach((item) => {
      if (!grouped[item.plan_id]) {
        grouped[item.plan_id] = {
          id: item.plan_id,
          title: item.plan_name,
          description: `Includes ${item.plan_name} services tailored to your needs.`,
          gradient: "from-yellow-500 to-yellow-600",
          features: [],
          totalAmount: 0,
        };
      }
      grouped[item.plan_id].features.push(`${item.service_name} - ${item.category_name}`);
      if (item.service_name?.toLowerCase() !== "complimentary") {
        grouped[item.plan_id].totalAmount += Number(item.total_amount || item.total_ads) || 0;
      }
    });
    return Object.values(grouped);
  };

  const plans = groupByPlan(getPlanData);
  const activePlan = plans.find((p) => p.id === selectedPlanId);
  const filteredPlans = plans.filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()));

  useEffect(() => { fetchPlanData(); }, []);

  const handleCreateQuotation = (plan) => {
    setPlanId(plan.id);
    setPlanName(plan.title);
    setShowModal(true);
  };

  const getAllPlanNotes = async () => {
    try {
      const response = await axios.get(
        `${baseURL}/auth/api/re_calculator/getPlanNotes`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const notes = response.data.data;
      const filtered = notes.filter((note) => String(note.plan) === String(planName));
      setAllPlanNote(filtered);
    } catch (error) {
      console.error("Error fetching No plan found:", error);
      if (error.response && error.response.status === 401) {
        Swal.fire({
          title: "Session Expired",
          text: "Please login again.",
          icon: "warning",
          showConfirmButton: false,
          timer: 1000,
        }).then(() => {
          localStorage.removeItem("token");
          navigate("/");
        });
      }
    }
  };

  useEffect(() => {
    if (planName) {
      getAllPlanNotes();
    }
  }, [planName]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone" && !/^\d{0,10}$/.test(value)) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const generateUniqueId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const proposalId = Date.now(); // txn_id
    try {
      const filteredPlanData = getPlanData.filter((item) => item.plan_id === planid);

      if (filteredPlanData.length === 0) {
        Swal.fire({ icon: "info", title: "No Data", text: "No services found for this plan.", showConfirmButton: false, timer: 1000 });
        setLoading(false);
        return;
      }

      const clientDetail = {
        client_name: formData?.client_name || "",
        client_organization: formData?.client_organization || "",
        email: formData?.email || "",
        phone: formData?.phone || "",
        address: formData?.address || "",
        dg_employee: currentUser?.name || "",
      };

      const adsItems = filteredPlanData
        .filter((item) => item.service_name === "Ads Campaign")
        .map((item) => ({
          txn_id: proposalId,
          client_id: null,
          id: generateUniqueId(),
          category: item.category_name,
          amount: item.amount_ads,
          percent: item.percent_ads,
          charge: item.charge_ads,
          total: item.total_ads,
          employee: currentUser?.name || "",
        }));

      const complimentaryItems = filteredPlanData
        .filter((item) => item.service_name === "Complimentary")
        .map((item) => ({
          txn_id: proposalId,
          client_id: null,
          service_name: item.service_name,
          category_name: item.category_name,
          editing_type_name: item.editing_type_name,
          editing_type_amount: item.editing_type_amount,
          quantity: item.quantity,
          include_content_posting: item.include_content_posting,
          include_thumbnail_creation: item.include_thumbnail_creation,
          total_amount: item.total_amount,
          employee: currentUser?.name || "",
        }));

      const plansSubmit = filteredPlanData
        .filter((item) => item.service_name !== "Ads Campaign" && item.service_name !== "Complimentary")
        .map((item) => ({
          service_name: item.service_name,
          category_name: item.category_name,
          editing_type_name: item.editing_type_name,
          editing_type_amount: item.editing_type_amount,
          quantity: item.quantity,
          include_content_posting: item.include_content_posting,
          include_thumbnail_creation: item.include_thumbnail_creation,
          total_amount: item.total_amount,
          plan_name: item.plan_name,
          employee: currentUser?.name || "",
        }));

      const planNotes = allPlanNote.map((item) => ({ note_name: item.note_name }));

      const payload = {
        txn_id: proposalId,
        ...clientDetail,
        plans: plansSubmit,
        planNotes,
      };

      const res = await axios.post(`${baseURL}/auth/api/re_calculator/saveClientWithPlan`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { status, message, client_id } = res.data;

      if (status === "Success") {
        if (adsItems.length > 0) {
          await axios.post(`${baseURL}/auth/api/re_calculator/saveAdsCampaign`, {
            adsItems: adsItems.map((item) => ({ ...item, client_id }))
          }, { headers: { Authorization: `Bearer ${token}` } });
        }

        if (complimentaryItems.length > 0) {
          for (const item of complimentaryItems) {
            await axios.post(`${baseURL}/auth/api/re_calculator/saveComplimentaryData`, { ...item, client_id }, { headers: { Authorization: `Bearer ${token}` } });
          }
        }

        Swal.fire({ icon: "success", title: "Quotation Created", text: message, showConfirmButton: false, timer: 1000 });
        setShowModal(false);
        navigate(`/admin/client/service/history/${client_id}`);
      } else {
        Swal.fire({ icon: "error", title: "Error", text: message || "Failed to save quotation", showConfirmButton: false, timer: 1000 });
      }
    } catch (err) {
      console.error("Save error:", err);
      Swal.fire({ icon: "error", title: "Error", text: err.response?.data?.message || "Something went wrong", showConfirmButton: false, timer: 1000 });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
  };

  return (
    <div className="flex flex-col h-full max-h-[100vh] overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Plan Explorer</h1>
        <div className="bg-white/10 px-4 py-1.5 rounded-full border border-white/10 self-start sm:self-auto">
          <span className="text-yellow-400 font-mono text-xs md:text-sm">{plans.length} Plans Available</span>
        </div>
      </div>

      {/* Main Dashboard Layout */}
      <div className="flex flex-col lg:flex-row gap-4 md:gap-6 h-[calc(100vh-130px)] md:h-[calc(100vh-180px)] overflow-hidden">
        
        {/* Left Sidebar: Plan List */}
        <div className="w-full lg:w-1/3 xl:w-1/4 flex flex-col shrink-0 overflow-visible">
          
          {/* Mobile Searchable Dropdown */}
          <div className="lg:hidden relative w-full mb-2">
            <div 
              className={`flex items-center justify-between w-full p-4 border rounded-2xl cursor-pointer transition-all ${isDropdownOpen ? "bg-white/10 border-white/20 shadow-lg" : "bg-white/5 border-white/10"}`}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <Search className="text-white/50 w-5 h-5 shrink-0" />
                <span className="text-white font-semibold truncate">{activePlan ? activePlan.title : "Search & Select Plan..."}</span>
              </div>
              <ChevronDown className={`text-white/50 w-5 h-5 shrink-0 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
            </div>

            {isDropdownOpen && (
              <div className="absolute z-50 w-full mt-2 bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
                <div className="p-3 bg-white/5 border-b border-white/10">
                  <input 
                    type="text" 
                    placeholder="Search plans by name..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/20 border border-white/5 rounded-xl py-2.5 px-4 text-white placeholder-white/30 focus:outline-none focus:border-yellow-500/50 text-sm"
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                </div>
                <div className="p-2 space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                  {filteredPlans.length > 0 ? filteredPlans.map(plan => (
                    <button
                      key={plan.id}
                      onClick={() => {
                        setSelectedPlanId(plan.id);
                        setIsDropdownOpen(false);
                        setSearchQuery("");
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all ${selectedPlanId === plan.id ? "bg-gradient-to-r from-yellow-500/30 to-yellow-500/10 text-yellow-300 font-semibold border border-yellow-500/30" : "hover:bg-white/5 text-white/70 border border-transparent"}`}
                    >
                      <div className="flex justify-between items-center gap-2">
                        <span className="truncate">{plan.title}</span>
                        <span className="text-xs shrink-0 bg-black/20 px-2 py-1 rounded-md">₹{plan.totalAmount.toLocaleString()}</span>
                      </div>
                    </button>
                  )) : <div className="p-6 text-center text-white/40 text-sm">No plans match your search</div>}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Search & Vertical List */}
          <div className="hidden lg:flex flex-col gap-3 h-full pb-2">
            <div className="relative shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search plans..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-yellow-500/50 transition-colors"
              />
            </div>
            
            <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar flex-1 pb-4">
              {filteredPlans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`text-left p-3 md:p-4 rounded-xl md:rounded-2xl border transition-all duration-200 shrink-0 ${
                    selectedPlanId === plan.id
                      ? "bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/50 shadow-lg shadow-yellow-500/10"
                      : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg shrink-0 ${selectedPlanId === plan.id ? "bg-yellow-500 text-white" : "bg-white/10 text-white/50"}`}>
                      <List size={18} />
                    </div>
                    <div className="overflow-hidden">
                      <h3 className={`font-semibold truncate text-sm md:text-base ${selectedPlanId === plan.id ? "text-yellow-400" : "text-white/80"}`}>
                        {plan.title}
                      </h3>
                      <p className="text-xs text-white/40 mt-0.5 md:mt-1">₹{plan.totalAmount.toLocaleString()}</p>
                    </div>
                  </div>
                </button>
              ))}
              {filteredPlans.length === 0 && <div className="p-4 text-center text-white/40 text-sm border border-dashed border-white/10 rounded-xl mt-2">No plans found</div>}
            </div>
          </div>
        </div>

        {/* Right Content: Active Plan Detail */}
        <div className="flex-1 overflow-y-auto bg-white/5 backdrop-blur-md rounded-2xl md:rounded-3xl border border-white/10 p-5 md:p-8 custom-scrollbar">
          {activePlan ? (
            <div className="max-w-2xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Plan Header */}
              <div className="flex flex-col md:flex-row justify-between items-start gap-4 md:gap-0">
                <div>
                  <h2 className="text-2xl md:text-4xl font-bold text-white mb-1.5 md:mb-2">{activePlan.title}</h2>
                  <p className="text-white/50 text-sm md:text-lg leading-relaxed">{activePlan.description}</p>
                </div>
                <div className="text-left md:text-right w-full md:w-auto bg-black/20 md:bg-transparent p-4 md:p-0 rounded-xl md:rounded-none">
                  <p className="text-white/40 text-xs md:text-sm uppercase tracking-wider mb-1 font-semibold">Total Investment</p>
                  <p className="text-3xl md:text-4xl font-black text-yellow-400">₹{activePlan.totalAmount.toLocaleString()}</p>
                </div>
              </div>

              <hr className="border-white/10 hidden md:block" />

              {/* Features Grid */}
              <div className="space-y-4">
                <h3 className="text-white font-semibold flex items-center gap-2 text-sm md:text-base">
                  <CheckCircle2 className="text-yellow-500" size={18} /> Included Services
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 md:gap-3">
                  {activePlan.features.map((feature, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/5 p-3 md:p-4 rounded-xl text-white/70 text-xs md:text-sm flex items-start gap-2.5 md:gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1 md:mt-1.5 shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleCreateQuotation(activePlan)}
                disabled={loading}
                className="w-full py-4 md:py-5 rounded-xl md:rounded-2xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold text-lg md:text-xl shadow-xl shadow-yellow-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 md:gap-3 mt-2"
              >
                {loading ? "Processing..." : "Generate Full Quotation"}
                <ArrowRight size={20} className="md:w-6 md:h-6" />
              </button>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-white/20 italic">
              Select a plan from the list to view details
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={ handleClose }
          />
          <div className="relative bg-white w-full max-w-md rounded-xl shadow-2xl transform transition-all animate-in fade-in-0 zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  { "Add New Client" }
                </h2>
              </div>
              <button
                onClick={ handleClose }
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={ handleSubmit } className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Client Name
                </label>
                <input
                  type="text"
                  name="client_name"
                  value={ formData.client_name }
                  onChange={ handleChange }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors text-black"
                  placeholder="Enter client name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building className="w-4 h-4 inline mr-2" />
                  Organization
                </label>
                <input
                  type="text"
                  name="client_organization"
                  value={ formData.client_organization }
                  onChange={ handleChange }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors text-black"
                  placeholder="Enter organization name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={ formData.email }
                  onChange={ handleChange }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors text-black"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Phone Number
                </label>
                <input
                  type="number"
                  name="phone"
                  value={ formData.phone }
                  onChange={ handleChange }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors text-black"
                  placeholder="Enter phone number"
                  required
                  minLength={ 10 }
                  maxLength={ 10 }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Address
                </label>
                <textarea
                  name="address"
                  value={ formData.address }
                  onChange={ handleChange }
                  rows={ 3 }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors resize-none text-black"
                  placeholder="Enter full address"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={ handleClose }
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={ loading }
                  className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm"
                >
                  { loading ? "Saving..." : "Save Client" }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}

export default AdminExplorePlans;
