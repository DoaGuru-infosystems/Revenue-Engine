import React, { useCallback, useEffect, useMemo, useState } from "react";
import ProposalDiscountModal from "../Admin/components/ProposalDiscountModal";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ListChecks,
  Mail,
  Megaphone,
  Phone,
  Plus,
  Save,
  Sparkles,
  Trash2,
  UserRound,
  Zap,
  TrendingUp,
  AlertCircle,
  FileText,
  List,
} from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { clearUser } from "../redux/user/userSlice";
import API_BASE_URL from "../config/apiBaseUrl";

const toNumber = (value) => Number(value || 0);
const formatRs = (value) => `Rs. ${toNumber(value).toFixed(2)}`;

const normalizeAddonKey = (label = "") =>
  String(label).toLowerCase().trim().replace(/\s+/g, "_");

const createInitialAddonState = (addons = []) => {
  const next = {};
  addons.forEach((item) => {
    const key = normalizeAddonKey(item.editing_type_name);
    if (key) next[key] = false;
  });
  return next;
};

const generateRowId = () => {
  if (typeof globalThis?.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const getMatchingAdsRange = (ranges, amount) => {
  if (!Array.isArray(ranges)) return null;
  return ranges.find((range) => {
    const start = toNumber(range.amt_range_start);
    const endValue = String(range.amt_range_end || "").toLowerCase();
    const end = endValue === "above" ? Infinity : toNumber(range.amt_range_end);
    if (Number.isNaN(start)) return false;
    if (end !== Infinity && Number.isNaN(end)) return false;
    return amount >= start && amount <= end;
  });
};

function ProformaServices() {
  const baseURL = API_BASE_URL;
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { token, currentUser } = useSelector((state) => state.user);

  const { proformaDraft, selectedClient } = location.state || {};
  const draft = proformaDraft || null;
  const selectedClientFromState = selectedClient || null;
  const isProformaContext = true; // eslint-disable-line no-unused-vars

  const [graphicServices, setGraphicServices] = useState([]);
  const [adsServices, setAdsServices] = useState([]);
  const [optionalServices, setOptionalServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pricingMode, setPricingMode] = useState("custom");

  // ── Discount state ──
  const [discountType, setDiscountType] = useState("percent"); // "percent" | "amount"
  const [discountValue, setDiscountValue] = useState(0);       // raw user input
  const [discountSettings, setDiscountSettings] = useState(null);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [formDataDis, setFormDataDis] = useState({ discount_type: "percent", discount_amt: "", discount_per: "" });

  const [selectedGraphicService, setSelectedGraphicService] = useState("");
  const [selectedGraphicCategory, setSelectedGraphicCategory] = useState("");
  const [selectedGraphicEditId, setSelectedGraphicEditId] = useState("");
  const [graphicQuantity, setGraphicQuantity] = useState("1");
  const [graphicAddons, setGraphicAddons] = useState({});
  const [plansData, setPlansData] = useState([]);

  const [selectedAdsCategory, setSelectedAdsCategory] = useState("");
  const [adsBudgetInput, setAdsBudgetInput] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);

  const clientContext = useMemo(() => ({
    id: selectedClientFromState?.id || draft?.client_id || "",
    name: draft?.client_name || selectedClientFromState?.client_name || "",
    organization: draft?.client_organization || selectedClientFromState?.client_organization || "",
    phone: draft?.phone || selectedClientFromState?.phone || "",
    email: draft?.email || selectedClientFromState?.email || "",
    bill_type: draft?.bill_type || "",
    duration_start_date: draft?.duration_start_date || "",
    duration_end_date: draft?.duration_end_date || "",
  }), [draft, selectedClientFromState]);

  const hasClientContext = Boolean(clientContext.name || clientContext.phone || clientContext.id);

  useEffect(() => {
    if (!draft) {
      Swal.fire({ icon: "info", title: "Create Draft First", text: "Please save a draft first, then add services for the same client." })
        .then(() => navigate(-1));
    }
  }, [draft, navigate]);

  const handleSessionExpired = useCallback(() => {
    Swal.fire({ title: "Session Expired", text: "Please login again.", icon: "warning", confirmButtonText: "OK" })
      .then(() => { dispatch(clearUser()); localStorage.removeItem("token"); navigate("/"); });
  }, [dispatch, navigate]);

  const fetchServiceOptions = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    try {
      const [graphicRes, adsRes, optionalRes, plansRes] = await Promise.all([
        axios.get(`${baseURL}/auth/api/re_calculator/services/category/editing`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${baseURL}/auth/api/re_calculator/getAdsServices`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${baseURL}/auth/api/re_calculator/optional-service-amounts`),
        axios.get(`${baseURL}/auth/api/re_calculator/getAllPlanData`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const graphicData = Array.isArray(graphicRes?.data?.data) ? graphicRes.data.data : [];
      const adsData = Array.isArray(adsRes?.data?.data) ? adsRes.data.data : [];
      const optionalData = Array.isArray(optionalRes?.data?.data) ? optionalRes.data.data : [];
      const plansRawData = Array.isArray(plansRes?.data?.data) ? plansRes.data.data : [];
      setGraphicServices(graphicData.filter((s) => String(s.service_name || "").toLowerCase() !== "complimentary"));
      setAdsServices(adsData);
      setOptionalServices(optionalData);
      setGraphicAddons(createInitialAddonState(optionalData));
      setPlansData(plansRawData);
    } catch (error) {
      if (error.response?.status === 401) { handleSessionExpired(); return; }
      Swal.fire({ icon: "error", title: "Error", text: "Unable to load service options." });
    } finally { setLoading(false); }
  }, [baseURL, handleSessionExpired, token]);

  useEffect(() => { fetchServiceOptions(); }, [fetchServiceOptions]);

  const fetchDiscountSettings = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await axios.get(`${baseURL}/auth/api/re_calculator/getDiscountSetting`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDiscountSettings(data.data?.[0] || null);
    } catch { /* non-critical */ }
  }, [baseURL, token]);

  useEffect(() => { fetchDiscountSettings(); }, [fetchDiscountSettings]);

  const selectedGraphicServiceObj = useMemo(() => graphicServices.find((s) => s.service_name === selectedGraphicService) || null, [graphicServices, selectedGraphicService]);
  const selectedGraphicCategoryObj = useMemo(() => {
    if (!selectedGraphicServiceObj) return null;
    return (Array.isArray(selectedGraphicServiceObj.categories) ? selectedGraphicServiceObj.categories : [])
      .find((c) => String(c.category_id) === selectedGraphicCategory) || null;
  }, [selectedGraphicCategory, selectedGraphicServiceObj]);
  const selectedGraphicEditingType = useMemo(() => {
    if (!selectedGraphicCategoryObj) return null;
    return (Array.isArray(selectedGraphicCategoryObj.editing_types) ? selectedGraphicCategoryObj.editing_types : [])
      .find((e) => String(e.editing_type_id) === selectedGraphicEditId) || null;
  }, [selectedGraphicCategoryObj, selectedGraphicEditId]);

  const optionalAddonList = useMemo(() => optionalServices.map((item) => ({ ...item, key: normalizeAddonKey(item.editing_type_name), amount_num: toNumber(item.amount) })), [optionalServices]);
  const adsOptions = useMemo(() => {
    const grouped = {};
    adsServices.forEach((item) => {
      const cat = item.ads_category || "Ads Category";
      if (!grouped[cat]) grouped[cat] = { category: cat, ranges: [] };
      grouped[cat].ranges.push(item);
    });
    return Object.values(grouped);
  }, [adsServices]);
  const adsOptionMap = useMemo(() => { const m = {}; adsOptions.forEach((i) => { m[i.category] = i; }); return m; }, [adsOptions]);
  const selectedAdsOption = useMemo(() => adsOptionMap[selectedAdsCategory] || null, [adsOptionMap, selectedAdsCategory]);
  const isAddonApplicable = useMemo(() => { const n = String(selectedGraphicService || "").toLowerCase(); return n === "video services" || n === "graphics design"; }, [selectedGraphicService]);
  const selectedGraphicAddonPerUnit = useMemo(() => optionalAddonList.reduce((sum, a) => graphicAddons[a.key] ? sum + a.amount_num : sum, 0), [graphicAddons, optionalAddonList]);
  const selectedGraphicPreviewTotal = useMemo(() => {
    if (!selectedGraphicEditingType) return 0;
    const qty = Math.max(1, toNumber(graphicQuantity || 1));
    const unit = toNumber(selectedGraphicEditingType.amount || selectedGraphicEditingType.editing_type_amount);
    return (unit + selectedGraphicAddonPerUnit) * qty;
  }, [graphicQuantity, selectedGraphicAddonPerUnit, selectedGraphicEditingType]);

  const groupedPlans = useMemo(() => {
    if (!Array.isArray(plansData)) return [];
    const grouped = {};
    plansData.forEach((item) => {
      if (!grouped[item.plan_id]) {
        grouped[item.plan_id] = {
          id: item.plan_id,
          title: item.plan_name || item.title || `Untitled Plan ${item.plan_id}`,
          services: [],
          totalAmount: 0,
        };
      }
      grouped[item.plan_id].services.push(item);
      if (item.service_name?.toLowerCase() !== "complimentary") {
        grouped[item.plan_id].totalAmount += Number(item.total_amount || item.total_ads) || 0;
      }
    });
    return Object.values(grouped);
  }, [plansData]);

  const handleGraphicServiceChange = (val) => { setSelectedGraphicService(val); setSelectedGraphicCategory(""); setSelectedGraphicEditId(""); setGraphicQuantity("1"); setGraphicAddons(createInitialAddonState(optionalServices)); };
  const handleGraphicCategoryChange = (val) => {
    setSelectedGraphicCategory(val);

    // Auto-select editing type if there is exactly 1 editing type and its name is null/empty
    if (selectedGraphicServiceObj && val) {
      const category = (Array.isArray(selectedGraphicServiceObj.categories) ? selectedGraphicServiceObj.categories : []).find(c => String(c.category_id) === val);
      if (category && category.editing_types && category.editing_types.length === 1) {
        const singleEditingType = category.editing_types[0];
        if (!singleEditingType.editing_type_name || singleEditingType.editing_type_name.trim() === "") {
          setSelectedGraphicEditId(String(singleEditingType.editing_type_id));
          return;
        }
      }
    }

    setSelectedGraphicEditId("");
  };

  const addGraphicServiceRow = () => {
    if (!selectedGraphicServiceObj || !selectedGraphicCategoryObj || !selectedGraphicEditingType) {
      Swal.fire({ icon: "warning", title: "Complete Graphic Selection", text: "Please select service, category and editing type." }); return;
    }
    const qty = Math.max(1, toNumber(graphicQuantity || 1));
    const unitPrice = toNumber(selectedGraphicEditingType.amount || selectedGraphicEditingType.editing_type_amount);
    let includeContentPosting = 0, includeThumbnailCreation = 0;
    const selectedAddonLabels = [];
    optionalAddonList.forEach((addon) => {
      if (!graphicAddons[addon.key]) return;
      selectedAddonLabels.push(`${addon.editing_type_name} (+${formatRs(addon.amount_num)})`);
      if (addon.key === "content_posting") includeContentPosting = addon.amount_num;
      if (addon.key === "thumbnail_creation") includeThumbnailCreation = addon.amount_num;
    });
    const rowTotal = (unitPrice + selectedGraphicAddonPerUnit) * qty;
    setSelectedItems((prev) => [...prev, { row_id: generateRowId(), source: "graphic", client_id: clientContext.id || null, client_name: clientContext.name || "", service_name: selectedGraphicServiceObj.service_name || "", category_name: selectedGraphicCategoryObj.category_name || "", editing_type_id: selectedGraphicEditingType.editing_type_id || null, editing_type_name: selectedGraphicEditingType.editing_type_name || "", unit_price: unitPrice, quantity: qty, optional_total_per_unit: selectedGraphicAddonPerUnit, include_content_posting: includeContentPosting, include_thumbnail_creation: includeThumbnailCreation, addon_labels: selectedAddonLabels, total: Number(rowTotal.toFixed(2)) }]);
    setSelectedGraphicEditId(""); setGraphicQuantity("1"); setGraphicAddons(createInitialAddonState(optionalServices));
  };

  const addAdsServiceRow = () => {
    if (!selectedAdsOption) { Swal.fire({ icon: "warning", title: "Select Ads Category", text: "Please choose Ads Campaign category first." }); return; }
    const budget = toNumber(adsBudgetInput);
    if (!budget || budget <= 0) { Swal.fire({ icon: "warning", title: "Invalid Budget", text: "Please enter valid budget amount." }); return; }
    const matchedRange = getMatchingAdsRange(selectedAdsOption.ranges, budget);
    if (!matchedRange) { Swal.fire({ icon: "warning", title: "Range Not Found", text: "No matching range found for this budget." }); return; }
    const percent = toNumber(matchedRange.percentage);
    const charge = Number(((budget * percent) / 100).toFixed(2));
    const total = Number((budget + charge).toFixed(2));
    setSelectedItems((prev) => [...prev, { row_id: generateRowId(), source: "ads", client_id: clientContext.id || null, client_name: clientContext.name || "", ads_category: selectedAdsOption.category, budget, percent, charge, total }]);
    setAdsBudgetInput("");
  };

  const addPlanServiceRows = () => {
    if (!selectedPlanId) {
      Swal.fire({ icon: "warning", title: "Select Plan", text: "Please select a plan first." });
      return;
    }
    const plan = groupedPlans.find((p) => String(p.id) === String(selectedPlanId));
    if (!plan || !plan.services || plan.services.length === 0) {
      Swal.fire({ icon: "warning", title: "Empty Plan", text: "Selected plan has no services." });
      return;
    }

    const newRows = plan.services.map((item) => {
      const isComplimentary = String(item.service_name || "").toLowerCase() === "complimentary";
      const isAds = Number(item.budget_amount) > 0 || Number(item.total_ads) > 0 || item.category;

      if (isComplimentary) {
        return {
          row_id: generateRowId(),
          source: "complimentary",
          client_id: clientContext.id || null,
          client_name: clientContext.name || "",
          service_name: item.service_name || "Complimentary",
          category_name: item.category_name || "Complimentary Service",
          editing_type_id: null,
          editing_type_name: item.editing_type_name || "",
          unit_price: 0,
          quantity: Number(item.quantity || 1),
          optional_total_per_unit: 0,
          include_content_posting: 0,
          include_thumbnail_creation: 0,
          addon_labels: [],
          total: 0
        };
      }

      if (!isAds) {
        return {
          row_id: generateRowId(),
          source: "graphic",
          client_id: clientContext.id || null,
          client_name: clientContext.name || "",
          service_name: item.service_name || "",
          category_name: item.category_name || "",
          editing_type_id: null,
          editing_type_name: item.editing_type_name || "",
          unit_price: Number(item.editing_type_amount || 0),
          quantity: Number(item.quantity || 1),
          optional_total_per_unit: 0,
          include_content_posting: item.include_content_posting || 0,
          include_thumbnail_creation: item.include_thumbnail_creation || 0,
          addon_labels: [],
          total: Number(item.total_amount || 0)
        };
      } else {
        const budget = Number(item.budget_amount || 0);
        const charge = Number(item.charge_amount || 0);
        return {
          row_id: generateRowId(),
          source: "ads",
          client_id: clientContext.id || null,
          client_name: clientContext.name || "",
          ads_category: item.category || item.category_name || "Ads Category",
          budget,
          percent: Number(item.percentage || 0),
          charge,
          total: Number(item.total_amount || item.total_ads || budget + charge)
        };
      }
    }).filter(Boolean);

    setSelectedItems((prev) => [...prev, ...newRows]);
    setSelectedPlanId("");
  };

  const updateGraphicQuantity = (rowId, qtyValue) => {
    const qty = Math.max(1, toNumber(qtyValue || 1));
    setSelectedItems((prev) => prev.map((item) => {
      if (item.row_id !== rowId || (item.source !== "graphic" && item.source !== "complimentary")) return item;
      return { ...item, quantity: qty, total: Number(((toNumber(item.unit_price) + toNumber(item.optional_total_per_unit)) * qty).toFixed(2)) };
    }));
  };

  const updateAdsBudget = (rowId, inputValue) => {
    if (!/^\d*\.?\d*$/.test(inputValue)) return;
    setSelectedItems((prev) => prev.map((item) => {
      if (item.row_id !== rowId || item.source !== "ads") return item;
      const budget = toNumber(inputValue);
      if (!budget) return { ...item, budget: 0, percent: 0, charge: 0, total: 0 };
      const option = adsOptionMap[item.ads_category];
      const matchedRange = getMatchingAdsRange(option?.ranges, budget);
      if (!matchedRange) return { ...item, budget, percent: 0, charge: 0, total: budget };
      const percent = toNumber(matchedRange.percentage);
      const charge = Number(((budget * percent) / 100).toFixed(2));
      return { ...item, budget, percent, charge, total: Number((budget + charge).toFixed(2)) };
    }));
  };

  const removeRow = (rowId) => setSelectedItems((prev) => prev.filter((item) => item.row_id !== rowId));
  // ── Derived totals (per user spec) ──
  const graphicTotal = useMemo(() =>
    selectedItems.filter((i) => i.source === "graphic").reduce((sum, i) => sum + toNumber(i.total), 0),
    [selectedItems]
  );
  const adsTotal = useMemo(() =>
    selectedItems.filter((i) => i.source === "ads").reduce((sum, i) => sum + toNumber(i.total), 0),
    [selectedItems]
  );

  const discountAmount = useMemo(() => {
    if (!discountValue || discountValue <= 0) return 0;
    if (discountType === "percent") return Number(((graphicTotal * discountValue) / 100).toFixed(2));
    return Math.min(Number(discountValue), graphicTotal);
  }, [discountType, discountValue, graphicTotal]);

  const discountedGraphic = useMemo(() => Math.max(0, graphicTotal - discountAmount), [graphicTotal, discountAmount]);

  const isGSTBill = useMemo(() =>
    String(clientContext.bill_type || draft?.bill_type || "").toUpperCase() === "GST",
    [clientContext.bill_type, draft?.bill_type]
  );
  const gstAmount = useMemo(() => isGSTBill ? Number((discountedGraphic * 0.18).toFixed(2)) : 0, [isGSTBill, discountedGraphic]);
  const grandTotal = useMemo(() => discountedGraphic + gstAmount + adsTotal, [discountedGraphic, gstAmount, adsTotal]);

  // ── Discount modal handlers ──
  const openDiscountModal = () => {
    setFormDataDis({
      discount_type: discountType === "percent" ? "percent" : "amount",
      discount_per: discountType === "percent" ? (discountValue || "") : "",
      discount_amt: discountType === "amount" ? (discountValue || "") : "",
    });
    setShowDiscountModal(true);
  };
  const handleChangeDis = (e) => {
    const { name, value } = e.target;
    setFormDataDis((prev) => {
      if (name === "discount_type") return { discount_type: value, discount_amt: "", discount_per: "" };
      return { ...prev, [name]: value };
    });
  };
  const handleApplyDiscount = (e) => {
    e.preventDefault();
    const isPercent = formDataDis.discount_type === "percent";
    setDiscountType(isPercent ? "percent" : "amount");
    setDiscountValue(isPercent ? Number(formDataDis.discount_per) : Number(formDataDis.discount_amt));
    setShowDiscountModal(false);
  };
  const handleRemoveDiscount = () => {
    setDiscountType("percent");
    setDiscountValue(0);
    setFormDataDis({ discount_type: "percent", discount_amt: "", discount_per: "" });
  };

  const handleSaveServices = async () => {
    if (!hasClientContext) {
      Swal.fire({ icon: "warning", title: "Client Context Missing", text: "Please open this page from Instant Proforma so services stay linked to same client." });
      return;
    }
    if (selectedItems.length === 0) {
      Swal.fire({ icon: "warning", title: "No Services Added", text: "Please add at least one service." });
      return;
    }

    setSaving(true);
    try {
      const txn_id = String(Date.now());
      const employeeName = draft?.dg_employee || currentUser?.name || "";

      // ── Graphic & SEO items ──
      const graphicServicesItems = selectedItems
        .filter((item) => item.source === "graphic")
        .map((item) => ({
          source: "custom_graphic",
          service_name: item.service_name,
          category_name: item.category_name,
          editing_type_name: item.editing_type_name,
          editing_type_amount: item.unit_price,
          unit_price: item.unit_price,
          quantity: item.quantity,
          include_content_posting: item.include_content_posting || 0,
          include_thumbnail_creation: item.include_thumbnail_creation || 0,
          total_amount: item.total,
          total_price: item.total,
          plan_name: "",
          employee: employeeName,
        }));

      // ── Ads Campaign items ──
      const adsServicesItems = selectedItems
        .filter((item) => item.source === "ads")
        .map((item) => ({
          source: "custom_ads",
          service_name: "Ads Campaign",
          category_name: item.ads_category,
          budget: item.budget,
          amount: item.budget,
          percent: item.percent,
          charge: item.charge,
          total: item.total,
          total_amount: item.total,
          unit_price: item.total,
          quantity: 1,
          employee: employeeName,
        }));

      // ── Complimentary items ──
      const complimentaryServicesItems = selectedItems
        .filter((item) => item.source === "complimentary")
        .map((item) => ({
          source: "custom_complimentary",
          service_name: item.service_name,
          category_name: item.category_name,
          editing_type_name: item.editing_type_name,
          editing_type_amount: 0,
          unit_price: 0,
          quantity: item.quantity,
          include_content_posting: 0,
          include_thumbnail_creation: 0,
          total_amount: 0,
          total_price: 0,
          plan_name: "",
          employee: employeeName,
        }));

      const combinedPricingSnapshot = [...graphicServicesItems, ...adsServicesItems, ...complimentaryServicesItems];

      // ── Amount logic per spec ──
      // discountBase = graphicTotal only (already computed as `discountedGraphic` useMemo)
      const gstRate = isGSTBill ? 18 : 0;
      // base_amount = discounted service total (no ads, no GST)
      const baseAmt   = Number(discountedGraphic.toFixed(2));
      const gstAmt    = Number(gstAmount.toFixed(2));
      const totalAmt  = Number(grandTotal.toFixed(2)); // discountedGraphic + gst + adsTotal

      const proformaPayload = {
        txn_id,
        client_id: clientContext.id || null,
        client_name: clientContext.name,
        client_organization: clientContext.organization,
        email: clientContext.email,
        phone: clientContext.phone,
        address: draft?.address || "",
        dg_employee: employeeName,
        duration_start_date: clientContext.duration_start_date,
        duration_end_date: clientContext.duration_end_date,
        payment_mode: draft?.payment_mode || "",
        client_gst_no: draft?.client_gst_no || "",
        client_pan_no: draft?.client_pan_no || "",
        bill_type: clientContext.bill_type || "NON_GST",
        pricing_snapshot: JSON.stringify(combinedPricingSnapshot),
        notes_snapshot: Array.isArray(draft?.notes_snapshot)
          ? JSON.stringify(draft.notes_snapshot)
          : (draft?.notes_snapshot ? JSON.stringify([{ id: 1, note_name: draft.notes_snapshot }]) : "[]"),
        base_amount: baseAmt,
        gst_amount: gstAmt,
        total_amount: totalAmt,
        is_gst: isGSTBill ? 1 : 0,
        gst_rate: gstRate,
      };

      // ── Discount payload (same txn_id, sent in parallel) ──
      const isDiscountApplied = discountAmount > 0;
      const discountPayload = isDiscountApplied ? {
        txn_id,
        client_id: clientContext.id || null,
        discount_type: discountType === "percent" ? "percent" : "amount",
        discount_per: discountType === "percent" ? discountValue : parseFloat(((discountAmount / graphicTotal) * 100).toFixed(2)),
        discount_amt: Number(discountAmount.toFixed(2)),
      } : null;

      // ── Parallel save: both or just proforma ──
      const [res] = await Promise.all([
        axios.post(`${baseURL}/auth/api/re_calculator/saveDirectProforma`, proformaPayload, { headers: { Authorization: `Bearer ${token}` } }),
        isDiscountApplied
          ? axios.post(`${baseURL}/auth/api/re_calculator/saveDiscountData`, discountPayload, { headers: { Authorization: `Bearer ${token}` } })
          : Promise.resolve(),
      ]);

      await Swal.fire({
        icon: "success",
        title: "Proforma Generated!",
        html: `<div style="font-size:14px;color:#888;margin-top:6px;">Proforma has been saved successfully.</div>`,
        confirmButtonColor: "#10b981",
        confirmButtonText: "View Proforma Preview",
      });

      if (clientContext.id && res.data.proformaId) {
        navigate(`/admin/quotation/${clientContext.id}/${res.data.proformaId}?doc=proforma&source=manual&gst=${isGSTBill ? 1 : 0}`);
      } else {
        navigate("/admin/dashboard");
      }
    } catch (err) {
      console.error("Save Proforma Error:", err);
      if (err.response?.status === 401) {
        handleSessionExpired();
        return;
      }
      Swal.fire({
        icon: "error",
        title: "Failed to Generate Proforma",
        text: err.response?.data?.message || "Something went wrong while saving the proforma.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{ `
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=Cormorant+Garamond:wght@400;500;600;700&display=swap');

        .is-root {
          font-family: 'Sora', sans-serif;
          min-height: 100vh;
          position: relative;
          background: #07080f;
          padding: 1.75rem 1.5rem;
        }

        .is-bg {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background:
            radial-gradient(ellipse 55% 40% at 10% 0%, rgba(184,150,46,0.065) 0%, transparent 65%),
            radial-gradient(ellipse 45% 50% at 90% 100%, rgba(184,150,46,0.045) 0%, transparent 60%),
            radial-gradient(ellipse 35% 35% at 50% 50%, rgba(20,22,40,0.7) 0%, transparent 100%);
        }
        .is-grid {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background-image:
            linear-gradient(rgba(184,150,46,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(184,150,46,0.025) 1px, transparent 1px);
          background-size: 52px 52px;
        }

        .is-inner {
          position: relative;
          z-index: 1;
          max-width: 1400px;
          margin: 0 auto;
        }

        /* ── Cards ── */
        .is-card {
          background: rgba(255,255,255,0.022);
          border: 1px solid rgba(255,255,255,0.065);
          border-radius: 20px;
          backdrop-filter: blur(20px);
          box-shadow: 0 8px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04);
        }

        /* ── Labels / Inputs ── */
        .is-label {
          display: block;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(184,150,46,0.65);
          margin-bottom: 5px;
        }

        .is-input {
          width: 100%;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 11px;
          padding: 9px 13px;
          font-size: 13px;
          font-family: 'Sora', sans-serif;
          color: #e8e8f0;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .is-input::placeholder { color: rgba(255,255,255,0.18); }
        .is-input:focus {
          border-color: rgba(184,150,46,0.4);
          background: rgba(184,150,46,0.035);
          box-shadow: 0 0 0 3px rgba(184,150,46,0.07);
        }
        .is-input:disabled { opacity: 0.4; cursor: not-allowed; }
        .is-input option { background: #0d0e1a; color: #e8e8f0; }
        select.is-input { appearance: none; cursor: pointer; }

        /* ── Section title ── */
        .is-section-title {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          color: rgba(184,150,46,0.55);
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
        }
        .is-section-title::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, rgba(184,150,46,0.18), transparent);
        }

        /* ── Badges ── */
        .is-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border-radius: 999px;
          padding: 5px 13px;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
        }
        .is-badge-gold { background: rgba(184,150,46,0.1); border: 1px solid rgba(184,150,46,0.28); color: #d4a940; }
        .is-badge-green { background: rgba(52,211,153,0.08); border: 1px solid rgba(52,211,153,0.22); color: #6ee7b7; }
        .is-badge-red { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.22); color: #fca5a5; }

        /* ── Client info tiles ── */
        .is-info-tile {
          background: rgba(255,255,255,0.018);
          border: 1px solid rgba(255,255,255,0.055);
          border-radius: 12px;
          padding: 10px 14px;
        }
        .is-tile-label { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(184,150,46,0.5); margin-bottom: 6px; }
        .is-tile-val { font-size: 13px; font-weight: 500; color: #e0e0f0; display: flex; align-items: center; gap: 7px; }

        /* ── Addon checkbox row ── */
        .is-addon-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .is-addon-row:last-child { border-bottom: none; }

        .is-checkbox {
          width: 16px;
          height: 16px;
          accent-color: #b8962e;
          cursor: pointer;
          flex-shrink: 0;
        }

        /* ── Preview box ── */
        .is-preview {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(184,150,46,0.06);
          border: 1px solid rgba(184,150,46,0.18);
          border-radius: 11px;
          padding: 10px 14px;
        }

        /* ── Range table ── */
        .is-range-box {
          background: rgba(255,255,255,0.018);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 11px;
          padding: 10px 14px;
        }

        /* ── Buttons ── */
        .is-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          background: linear-gradient(135deg, #b8962e 0%, #d4a940 45%, #b8962e 100%);
          border: 1px solid rgba(212,169,64,0.35);
          color: #07080f;
          font-family: 'Sora', sans-serif;
          font-size: 12.5px;
          font-weight: 700;
          padding: 10px 18px;
          border-radius: 11px;
          cursor: pointer;
          width: 100%;
          transition: all 0.2s ease;
          box-shadow: 0 4px 18px rgba(184,150,46,0.22);
        }
        .is-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(184,150,46,0.32); }
        .is-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

        .is-btn-amber {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          background: linear-gradient(135deg, #92400e 0%, #b45309 45%, #92400e 100%);
          border: 1px solid rgba(180,83,9,0.4);
          color: #fde68a;
          font-family: 'Sora', sans-serif;
          font-size: 12.5px;
          font-weight: 700;
          padding: 10px 18px;
          border-radius: 11px;
          cursor: pointer;
          width: 100%;
          transition: all 0.2s ease;
          box-shadow: 0 4px 18px rgba(146,64,14,0.2);
        }
        .is-btn-amber:hover { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(146,64,14,0.3); background: linear-gradient(135deg, #b45309 0%, #d97706 45%, #b45309 100%); }
        .is-btn-amber:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

        .is-btn-save {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: linear-gradient(135deg, #b8962e 0%, #d4a940 45%, #b8962e 100%);
          border: 1px solid rgba(212,169,64,0.35);
          color: #07080f;
          font-family: 'Sora', sans-serif;
          font-size: 13px;
          font-weight: 700;
          padding: 11px 24px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 20px rgba(184,150,46,0.25);
          letter-spacing: 0.02em;
        }
        .is-btn-save:hover { transform: translateY(-1px); box-shadow: 0 8px 30px rgba(184,150,46,0.35); }

        .is-btn-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: rgba(255,255,255,0.35);
          font-family: 'Sora', sans-serif;
          font-size: 12.5px;
          cursor: pointer;
          padding: 0;
          transition: color 0.2s;
        }
        .is-btn-back:hover { color: rgba(255,255,255,0.75); }

        .is-btn-remove {
          background: rgba(239,68,68,0.06);
          border: 1px solid rgba(239,68,68,0.15);
          border-radius: 8px;
          padding: 5px;
          color: rgba(252,165,165,0.7);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .is-btn-remove:hover {
          background: rgba(239,68,68,0.14);
          border-color: rgba(239,68,68,0.3);
          color: #fca5a5;
        }

        /* ── Table ── */
        .is-table {
          width: 100%;
          min-width: 980px;
          border-collapse: collapse;
          font-size: 13px;
        }
        .is-table thead tr { background: rgba(184,150,46,0.04); border-bottom: 1px solid rgba(184,150,46,0.12); }
        .is-table thead th {
          padding: 12px 16px;
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(184,150,46,0.6);
          white-space: nowrap;
        }
        .is-table thead th:first-child { border-radius: 12px 0 0 0; }
        .is-table thead th:last-child { border-radius: 0 12px 0 0; text-align: right; }
        .is-table thead th.right { text-align: right; }
        .is-table tbody tr { border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.15s; }
        .is-table tbody tr:hover { background: rgba(184,150,46,0.025); }
        .is-table tbody tr:last-child { border-bottom: none; }
        .is-table tbody td { padding: 14px 16px; color: #d0d0e0; vertical-align: middle; }
        .is-table tbody td.right { text-align: right; }

        /* ── Table input ── */
        .is-table-input {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px;
          padding: 6px 10px;
          font-size: 12.5px;
          font-family: 'Sora', sans-serif;
          color: #e0e0f0;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .is-table-input:focus { border-color: rgba(184,150,46,0.35); box-shadow: 0 0 0 2px rgba(184,150,46,0.06); }

        /* ── Source pills ── */
        .is-pill-graphic {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(6,182,212,0.08);
          border: 1px solid rgba(6,182,212,0.18);
          border-radius: 7px;
          padding: 3px 9px;
          font-size: 11px;
          font-weight: 600;
          color: #67e8f9;
          white-space: nowrap;
        }
        .is-pill-ads {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(245,158,11,0.08);
          border: 1px solid rgba(245,158,11,0.18);
          border-radius: 7px;
          padding: 3px 9px;
          font-size: 11px;
          font-weight: 600;
          color: #fcd34d;
          white-space: nowrap;
        }
        .is-pill-complimentary {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(59,130,246,0.08);
          border: 1px solid rgba(59,130,246,0.18);
          border-radius: 7px;
          padding: 3px 9px;
          font-size: 11px;
          font-weight: 600;
          color: #93c5fd;
          white-space: nowrap;
        }

        /* ── Page title ── */
        .is-page-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.2rem;
          font-weight: 600;
          color: #fff;
          letter-spacing: -0.01em;
          line-height: 1.15;
        }
        .is-page-title span {
          background: linear-gradient(135deg, #b8962e, #e0c060);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* ── Divider ── */
        .is-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(184,150,46,0.15), transparent);
          margin: 4px 0;
        }

        /* ── Grid helpers ── */
        .is-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .is-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
        .is-service-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
        @media (min-width: 1024px) { .is-service-grid { grid-template-columns: 1fr 1fr 1fr; } }

        /* ── Scrollbar ── */
        .is-scroll::-webkit-scrollbar { height: 4px; }
        .is-scroll::-webkit-scrollbar-track { background: transparent; }
        .is-scroll::-webkit-scrollbar-thumb { background: rgba(184,150,46,0.2); border-radius: 99px; }

        /* ── Animations ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .is-fadein { animation: fadeUp 0.35s ease both; }
        .is-fadein-d1 { animation: fadeUp 0.35s 0.06s ease both; }
        .is-fadein-d2 { animation: fadeUp 0.35s 0.12s ease both; }
        .is-fadein-d3 { animation: fadeUp 0.35s 0.18s ease both; }
        .is-fadein-d4 { animation: fadeUp 0.35s 0.24s ease both; }

        /* ── Empty state ── */
        .is-empty {
          padding: 3.5rem 0;
          text-align: center;
          color: rgba(255,255,255,0.18);
        }
        .is-empty-icon { font-size: 2rem; color: rgba(184,150,46,0.2); margin-bottom: 8px; }

        /* ── Footer bar ── */
        .is-footer-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          border-top: 1px solid rgba(184,150,46,0.12);
          background: rgba(184,150,46,0.03);
          padding: 14px 20px;
        }

        /* ── Panel header ── */
        .is-panel-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }
        .is-panel-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .is-panel-icon.cyan { background: rgba(6,182,212,0.1); border: 1px solid rgba(6,182,212,0.2); color: #67e8f9; }
        .is-panel-icon.amber { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); color: #fcd34d; }
        .is-panel-icon.gold { background: rgba(184,150,46,0.12); border: 1px solid rgba(184,150,46,0.22); color: #d4a940; }

        @media (max-width: 640px) {
          .is-root { padding: 1.25rem 1rem; }
          .is-grid-2 { grid-template-columns: 1fr; }
          .is-grid-3 { grid-template-columns: 1fr 1fr; }
          .is-page-title { font-size: 1.7rem; }
        }
      `}</style>

      <div className="is-root">
        <div className="is-bg" />
        <div className="is-grid" />

        <div className="is-inner">

          {/* ── Top Bar ── */ }
          <div className="is-fadein" style={ { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 28 } }>
            <div style={ { display: "flex", alignItems: "center", gap: 16 } }>
              <button type="button" onClick={ () => navigate(-1) } className="is-btn-back">
                <ArrowLeft size={ 15 } /> Back
              </button>
              <div style={ { width: 1, height: 20, background: "rgba(255,255,255,0.1)" } } />
              <div>
                <p style={ { fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(184,150,46,0.55)", marginBottom: 4 } }>◆ Billing Suite</p>
                <h1 className="is-page-title">Proforma <span>Services</span></h1>
              </div>
            </div>
            <div className="is-badge is-badge-gold">
              <Sparkles size={ 11 } /> Service Manager
            </div>
          </div>

          {/* ── Client Context Card ── */ }
          <div className="is-card is-fadein-d1" style={ { padding: "1.25rem 1.5rem", marginBottom: 20 } }>
            <div style={ { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 14 } }>
              <div style={ { display: "flex", alignItems: "center", gap: 10 } }>
                <div className="is-panel-icon gold"><UserRound size={ 16 } /></div>
                <div>
                  <div style={ { fontSize: 14, fontWeight: 600, color: "#fff" } }>Client Information</div>
                  <div style={ { fontSize: 11, color: "rgba(255,255,255,0.28)", marginTop: 1 } }>Bound from Instant Proforma draft</div>
                </div>
              </div>
              <span className={ `is-badge ${hasClientContext ? "is-badge-green" : "is-badge-red"}` }>
                { hasClientContext ? <CheckCircle2 size={ 11 } /> : <AlertCircle size={ 11 } /> }
                { hasClientContext ? "Client Locked" : "Client Missing" }
              </span>
            </div>

            <div className="is-divider" style={ { marginBottom: 14 } } />

            <div className="is-grid-3">
              <div className="is-info-tile">
                <div className="is-tile-label">Client Name</div>
                <div className="is-tile-val"><UserRound size={ 14 } style={ { color: "#d4a940", flexShrink: 0 } } />{ clientContext.name || "—" }</div>
              </div>
              <div className="is-info-tile">
                <div className="is-tile-label">Organization</div>
                <div className="is-tile-val"><Building2 size={ 14 } style={ { color: "#d4a940", flexShrink: 0 } } />{ clientContext.organization || "—" }</div>
              </div>
              <div className="is-info-tile">
                <div className="is-tile-label">Phone</div>
                <div className="is-tile-val"><Phone size={ 14 } style={ { color: "#d4a940", flexShrink: 0 } } />{ clientContext.phone || "—" }</div>
              </div>
              <div className="is-info-tile">
                <div className="is-tile-label">Email</div>
                <div className="is-tile-val"><Mail size={ 14 } style={ { color: "#d4a940", flexShrink: 0 } } /><span style={ { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }>{ clientContext.email || "—" }</span></div>
              </div>
              <div className="is-info-tile">
                <div className="is-tile-label">Bill Type</div>
                <div className="is-tile-val">{ clientContext.bill_type || "—" }</div>
              </div>
              <div className="is-info-tile">
                <div className="is-tile-label">Duration</div>
                <div className="is-tile-val" style={ { fontSize: 12 } }>{ clientContext.duration_start_date || "—" } → { clientContext.duration_end_date || "—" }</div>
              </div>
            </div>
          </div>

          {/* ── Pricing Mode Toggle ── */}
          <div className="is-fadein-d2" style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <div style={{ display: "flex", background: "rgba(255,255,255,0.02)", padding: 4, borderRadius: 14, border: "1px solid rgba(255,255,255,0.05)", width: "100%", maxWidth: 400 }}>
              <button
                type="button"
                onClick={() => setPricingMode("plan")}
                style={{ flex: 1, padding: "10px 0", fontSize: 13, fontWeight: 600, borderRadius: 10, cursor: "pointer", transition: "all 0.2s", background: pricingMode === "plan" ? "linear-gradient(135deg, #d946ef 0%, #a855f7 100%)" : "transparent", color: pricingMode === "plan" ? "#fff" : "rgba(255,255,255,0.4)", border: "none" }}
              >
                Select Plan
              </button>
              <button
                type="button"
                onClick={() => setPricingMode("custom")}
                style={{ flex: 1, padding: "10px 0", fontSize: 13, fontWeight: 600, borderRadius: 10, cursor: "pointer", transition: "all 0.2s", background: pricingMode === "custom" ? "linear-gradient(135deg, #b8962e 0%, #d4a940 100%)" : "transparent", color: pricingMode === "custom" ? "#111" : "rgba(255,255,255,0.4)", border: "none" }}
              >
                Custom Service
              </button>
            </div>
          </div>

          {/* ── Service Panels ── */ }
          <div className="is-service-grid is-fadein-d2" style={ { marginBottom: 20 } }>

            {pricingMode === "custom" && (
              <>
            {/* Graphic & SEO Panel */ }
            <div className="is-card" style={ { padding: "1.4rem" } }>
              <div className="is-panel-header">
                <div className="is-panel-icon cyan"><ListChecks size={ 17 } /></div>
                <div>
                  <div style={ { fontSize: 14, fontWeight: 600, color: "#fff" } }>Graphic & SEO Services</div>
                  <div style={ { fontSize: 11, color: "rgba(255,255,255,0.28)", marginTop: 1 } }>Select type, category and optional add-ons</div>
                </div>
              </div>

              <div style={ { display: "flex", flexDirection: "column", gap: 10 } }>
                <div>
                  <label className="is-label">Service</label>
                  <select value={ selectedGraphicService } onChange={ (e) => handleGraphicServiceChange(e.target.value) } className="is-input" disabled={ loading || !hasClientContext }>
                    <option value="">Select service…</option>
                    { graphicServices.map((s) => <option key={ s.service_id } value={ s.service_name }>{ s.service_name }</option>) }
                  </select>
                </div>
                <div>
                  <label className="is-label">Category</label>
                  <select value={ selectedGraphicCategory } onChange={ (e) => handleGraphicCategoryChange(e.target.value) } className="is-input" disabled={ !selectedGraphicServiceObj || !hasClientContext }>
                    <option value="">Select category…</option>
                    { (selectedGraphicServiceObj?.categories || []).map((c) => <option key={ c.category_id } value={ String(c.category_id) }>{ c.category_name }</option>) }
                  </select>
                </div>
                { (() => {
                  const hasOnlyEmptyEditingType = selectedGraphicCategoryObj?.editing_types?.length === 1 && (!selectedGraphicCategoryObj.editing_types[0].editing_type_name || selectedGraphicCategoryObj.editing_types[0].editing_type_name.trim() === "");
                  if (hasOnlyEmptyEditingType) {
                    return (
                      <div>
                        <label className="is-label">Amount</label>
                        <div className="is-input" style={ { display: 'flex', alignItems: 'center', opacity: 0.7, background: 'rgba(255,255,255,0.02)' } }>
                          { formatRs(selectedGraphicCategoryObj.editing_types[0].amount) }
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div>
                      <label className="is-label">Editing Type</label>
                      <select value={ selectedGraphicEditId } onChange={ (e) => setSelectedGraphicEditId(e.target.value) } className="is-input" disabled={ !selectedGraphicCategoryObj || !hasClientContext }>
                        <option value="">Select editing type…</option>
                        { (selectedGraphicCategoryObj?.editing_types || []).map((e) => <option key={ e.editing_type_id } value={ String(e.editing_type_id) }>{ e.editing_type_name ? `${e.editing_type_name} (${formatRs(e.amount)})` : formatRs(e.amount) }</option>) }
                      </select>
                    </div>
                  );
                })() }
                <div>
                  <label className="is-label">Quantity</label>
                  <input type="number" min="1" value={ graphicQuantity } onChange={ (e) => setGraphicQuantity(e.target.value) } placeholder="1" className="is-input" disabled={ !hasClientContext } />
                </div>

                { isAddonApplicable && optionalAddonList.length > 0 && (
                  <div>
                    <div className="is-section-title" style={ { marginTop: 4 } }>Optional Add-ons</div>
                    <div style={ { background: "rgba(255,255,255,0.018)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 11, padding: "6px 14px" } }>
                      { optionalAddonList.filter((addon) => {
                        // Hide Thumbnail Creation when Graphics Design is selected
                        const isGraphicsDesign = String(selectedGraphicService || "").toLowerCase() === "graphics design";
                        if (isGraphicsDesign && addon.key === "thumbnail_creation") return false;
                        return true;
                      }).map((addon) => (
                        <div key={ addon.key } className="is-addon-row">
                          <span style={ { fontSize: 12.5, color: "#c8c8d8" } }>{ addon.editing_type_name }</span>
                          <div style={ { display: "flex", alignItems: "center", gap: 10 } }>
                            <span style={ { fontSize: 11.5, fontWeight: 600, color: "rgba(184,150,46,0.75)" } }>+{ formatRs(addon.amount_num) }</span>
                            <input type="checkbox" checked={ Boolean(graphicAddons[addon.key]) } onChange={ (e) => setGraphicAddons((prev) => ({ ...prev, [addon.key]: e.target.checked })) } className="is-checkbox" />
                          </div>
                        </div>
                      )) }
                    </div>
                  </div>
                ) }

                <div className="is-preview">
                  <div style={ { display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 500 } }>
                    <Zap size={ 13 } style={ { color: "#d4a940" } } /> Preview Total
                  </div>
                  <div style={ { fontSize: 16, fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", color: "#d4a940" } }>
                    { formatRs(selectedGraphicPreviewTotal) }
                  </div>
                </div>

                <button type="button" onClick={ addGraphicServiceRow } disabled={ loading || !hasClientContext } className="is-btn-primary">
                  <Plus size={ 14 } /> Add Graphic & SEO Service
                </button>
              </div>
            </div>

            {/* Ads Campaign Panel */ }
            <div className="is-card" style={ { padding: "1.4rem" } }>
              <div className="is-panel-header">
                <div className="is-panel-icon amber"><Megaphone size={ 17 } /></div>
                <div>
                  <div style={ { fontSize: 14, fontWeight: 600, color: "#fff" } }>Ads Campaigns</div>
                  <div style={ { fontSize: 11, color: "rgba(255,255,255,0.28)", marginTop: 1 } }>Budget-based percentage auto-calculation</div>
                </div>
              </div>

              <div style={ { display: "flex", flexDirection: "column", gap: 10 } }>
                <div>
                  <label className="is-label">Ads Category</label>
                  <select value={ selectedAdsCategory } onChange={ (e) => setSelectedAdsCategory(e.target.value) } className="is-input" disabled={ loading || !hasClientContext }>
                    <option value="">Select ads category…</option>
                    { adsOptions.map((o) => <option key={ o.category } value={ o.category }>{ o.category }</option>) }
                  </select>
                </div>
                <div>
                  <label className="is-label">Budget Amount</label>
                  <input type="text" value={ adsBudgetInput } onChange={ (e) => { if (/^\d*\.?\d*$/.test(e.target.value)) setAdsBudgetInput(e.target.value); } } placeholder="Enter budget amount…" className="is-input" disabled={ !hasClientContext } />
                </div>

                { selectedAdsOption && (
                  <div>
                    <div className="is-section-title" style={ { marginTop: 4 } }>Available Ranges</div>
                    <div className="is-range-box">
                      { selectedAdsOption.ranges.map((range, idx) => {
                        const budget = toNumber(adsBudgetInput);
                        const start = toNumber(range.amt_range_start);
                        const endVal = String(range.amt_range_end || "").toLowerCase();
                        const end = endVal === "above" ? Infinity : toNumber(range.amt_range_end);
                        const isActive = budget > 0 && budget >= start && budget <= end;
                        return (
                          <div key={ idx } style={ { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: idx < selectedAdsOption.ranges.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" } }>
                            <span style={ { fontSize: 11.5, color: isActive ? "#fcd34d" : "rgba(255,255,255,0.28)" } }>
                              { range.amt_range_start } – { range.amt_range_end }
                            </span>
                            <span style={ { fontSize: 12, fontWeight: 700, color: isActive ? "#fcd34d" : "rgba(255,255,255,0.25)", background: isActive ? "rgba(245,158,11,0.12)" : "transparent", borderRadius: 6, padding: "2px 8px" } }>
                              { range.percentage }%
                            </span>
                          </div>
                        );
                      }) }
                    </div>
                  </div>
                ) }

                <button type="button" onClick={ addAdsServiceRow } disabled={ loading || !hasClientContext } className="is-btn-amber">
                  <Plus size={ 14 } /> Add Ads Campaign Service
                </button>
              </div>
            </div>
            </>
            )}

            {/* Pre-configured Plans Panel */ }
            {pricingMode === "plan" && (
            <div className="is-card" style={ { padding: "1.4rem" } }>
              <div className="is-panel-header">
                <div className="is-panel-icon purple" style={ { color: "#d946ef", background: "rgba(217, 70, 239, 0.15)" } }><List size={ 17 } /></div>
                <div>
                  <div style={ { fontSize: 14, fontWeight: 600, color: "#fff" } }>Pre-configured Plans</div>
                  <div style={ { fontSize: 11, color: "rgba(255,255,255,0.28)", marginTop: 1 } }>Select a predefined service bundle</div>
                </div>
              </div>
              <div style={ { display: "flex", flexDirection: "column", gap: 10 } }>
                <div>
                  <label className="is-label">Select Plan</label>
                  <select value={ selectedPlanId } onChange={ (e) => setSelectedPlanId(e.target.value) } className="is-input" disabled={ loading || !hasClientContext || groupedPlans.length === 0 }>
                    <option value="">{ groupedPlans.length === 0 ? "No plans available…" : "Select plan…" }</option>
                    { groupedPlans.map((p) => <option key={ p.id } value={ String(p.id) }>{ p.title } ({ formatRs(p.totalAmount) })</option>) }
                  </select>
                </div>
                <button type="button" onClick={ addPlanServiceRows } disabled={ loading || !hasClientContext || !selectedPlanId } className="is-btn-primary" style={ { backgroundColor: "rgba(217, 70, 239, 0.15)", color: "#d946ef", border: "1px solid rgba(217, 70, 239, 0.3)" } }>
                  <Plus size={ 14 } /> Add Plan Services
                </button>
              </div>
            </div>
            )}

          </div>

          {/* ── Selected Services Table ── */ }
          <div className="is-card is-fadein-d3" style={ { overflow: "hidden", marginBottom: 20 } }>
            <div style={ { padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 } }>
              <div style={ { display: "flex", alignItems: "center", gap: 10 } }>
                <div className="is-panel-icon gold" style={ { width: 32, height: 32 } }><TrendingUp size={ 15 } /></div>
                <div style={ { fontSize: 14, fontWeight: 600, color: "#fff" } }>Selected Services</div>
              </div>
              { selectedItems.length > 0 && (
                <span className="is-badge is-badge-gold">{ selectedItems.length } { selectedItems.length === 1 ? "row" : "rows" }</span>
              ) }
            </div>

            <div className="is-scroll" style={ { overflowX: "auto" } }>
              <table className="is-table">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Details</th>
                    <th>Input</th>
                    <th className="right">Unit / %</th>
                    <th className="right">Charge</th>
                    <th className="right">Total</th>
                    <th style={ { textAlign: "right" } }>Action</th>
                  </tr>
                </thead>
                <tbody>
                  { selectedItems.length === 0 ? (
                    <tr>
                      <td colSpan={ 7 }>
                        <div className="is-empty">
                          <div className="is-empty-icon">◎</div>
                          <div style={ { fontSize: 13 } }>No service rows added yet.</div>
                          <div style={ { fontSize: 11, marginTop: 4 } }>Add services from the panels above.</div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    selectedItems.map((item) => (
                      <tr key={ item.row_id }>
                        <td>
                          { item.source === "graphic" && <span className="is-pill-graphic"><ListChecks size={ 11 } />Graphic & SEO</span> }
                          { item.source === "ads" && <span className="is-pill-ads"><Megaphone size={ 11 } />Ads Campaign</span> }
                          { item.source === "complimentary" && <span className="is-pill-complimentary"><Sparkles size={ 11 } />Complimentary</span> }
                        </td>
                        <td>
                          { item.source === "graphic" || item.source === "complimentary" ? (
                            <div>
                              <div style={ { fontSize: 13, fontWeight: 600, color: "#e8e8f0" } }>{ item.service_name }</div>
                              <div style={ { fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 } }>{ item.category_name } { item.editing_type_name ? `› ${item.editing_type_name}` : "" }</div>
                              { item.addon_labels?.length > 0 && (
                                <div style={ { fontSize: 10.5, color: "rgba(184,150,46,0.65)", marginTop: 3 } }>{ item.addon_labels.join(" · ") }</div>
                              ) }
                            </div>
                          ) : (
                            <div>
                              <div style={ { fontSize: 13, fontWeight: 600, color: "#e8e8f0" } }>{ item.ads_category }</div>
                              <div style={ { fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 } }>Ads campaign row</div>
                            </div>
                          ) }
                        </td>
                        <td>
                          { item.source === "graphic" || item.source === "complimentary"
                            ? <input type="number" min="1" value={ item.quantity } onChange={ (e) => updateGraphicQuantity(item.row_id, e.target.value) } className="is-table-input" style={ { width: 90 } } />
                            : <input type="text" value={ item.budget } onChange={ (e) => updateAdsBudget(item.row_id, e.target.value) } className="is-table-input" style={ { width: 120 } } /> }
                        </td>
                        <td className="right" style={ { color: "rgba(255,255,255,0.5)", fontSize: 12 } }>
                          { item.source === "graphic" || item.source === "complimentary" ? formatRs(item.unit_price) : `${toNumber(item.percent).toFixed(2)}%` }
                        </td>
                        <td className="right" style={ { fontSize: 12, color: "rgba(255,255,255,0.45)" } }>
                          { item.source === "graphic" || item.source === "complimentary"
                            ? formatRs(toNumber(item.optional_total_per_unit) * toNumber(item.quantity))
                            : formatRs(item.charge) }
                        </td>
                        <td className="right">
                          <span style={ { fontSize: 13.5, fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", color: "#d4a940" } }>{ formatRs(item.total) }</span>
                        </td>
                        <td style={ { textAlign: "right" } }>
                          <button type="button" onClick={ () => removeRow(item.row_id) } className="is-btn-remove" title="Remove row">
                            <Trash2 size={ 14 } />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) }
                </tbody>
              </table>
            </div>

            <div className="is-footer-bar">
              <div style={ { fontSize: 12.5, color: "rgba(255,255,255,0.3)" } }>
                Total rows: <span style={ { fontWeight: 600, color: "rgba(255,255,255,0.6)" } }>{ selectedItems.length }</span>
              </div>
              <div style={ { display: "flex", alignItems: "center", gap: 10 } }>
                <span style={ { fontSize: 11, color: "rgba(184,150,46,0.5)", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" } }>Grand Total</span>
                <span style={ { fontSize: 22, fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", color: "#d4a940" } }>{ formatRs(grandTotal) }</span>
              </div>
            </div>

            {/* ── Billing Breakdown ── */}
            { selectedItems.length > 0 && (
              <div style={ { marginTop: 16, padding: "14px 20px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, fontSize: 13, color: "rgba(255,255,255,0.6)", display: "flex", flexDirection: "column", gap: 6, maxWidth: 360, marginLeft: "auto" } }>
                <div style={ { display: "flex", justifyContent: "space-between" } }>
                  <span>Graphic & SEO Total</span>
                  <span>{ formatRs(graphicTotal) }</span>
                </div>
                { discountAmount > 0 && (
                  <div style={ { display: "flex", justifyContent: "space-between", color: "#f87171" } }>
                    <span>Discount ({ discountType === "percent" ? `${discountValue}%` : `₹${discountValue}` })</span>
                    <span>− { formatRs(discountAmount) }</span>
                  </div>
                ) }
                { discountAmount > 0 && (
                  <div style={ { display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.5)", borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 5 } }>
                    <span>After Discount</span>
                    <span>{ formatRs(discountedGraphic) }</span>
                  </div>
                ) }
                { isGSTBill && (
                  <div style={ { display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.45)" } }>
                    <span>GST (18% on service)</span>
                    <span>+ { formatRs(gstAmount) }</span>
                  </div>
                ) }
                { adsTotal > 0 && (
                  <div style={ { display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.45)" } }>
                    <span>Ads Budget (excl. discount)</span>
                    <span>+ { formatRs(adsTotal) }</span>
                  </div>
                ) }
                <div style={ { display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(184,150,46,0.25)", paddingTop: 7, fontWeight: 700, color: "#d4a940", fontSize: 14 } }>
                  <span>Grand Total Payable</span>
                  <span>{ formatRs(grandTotal) }</span>
                </div>
              </div>
            ) }
          </div>

          {/* ── Discount + Save Buttons ── */ }
          <div className="is-fadein-d4" style={ { display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, marginTop: 16 } }>
            { discountAmount > 0 ? (
              <button
                type="button"
                onClick={ handleRemoveDiscount }
                style={ { fontSize: 12, padding: "7px 14px", background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 10, color: "#f87171", cursor: "pointer" } }
              >
                ✕ Remove Discount
              </button>
            ) : null }
            <button
              type="button"
              onClick={ openDiscountModal }
              disabled={ selectedItems.filter((i) => i.source === "graphic").length === 0 }
              style={ { fontSize: 12, padding: "7px 16px", background: discountAmount > 0 ? "rgba(184,150,46,0.18)" : "rgba(184,150,46,0.1)", border: "1px solid rgba(184,150,46,0.3)", borderRadius: 10, color: "#d4a940", cursor: selectedItems.filter((i) => i.source === "graphic").length === 0 ? "not-allowed" : "pointer", opacity: selectedItems.filter((i) => i.source === "graphic").length === 0 ? 0.45 : 1 } }
            >
              { discountAmount > 0 ? `🏷 Edit Discount (−${formatRs(discountAmount)})` : "🏷 Apply Discount" }
            </button>
            <button
              type="button"
              onClick={ handleSaveServices }
              disabled={ saving || selectedItems.length === 0 }
              className="is-btn-save"
              style={ { opacity: (saving || selectedItems.length === 0) ? 0.55 : 1, cursor: (saving || selectedItems.length === 0) ? "not-allowed" : "pointer" } }
            >
              <Save size={ 15 } /> { saving ? "Saving..." : "Save Services & Generate Proforma" }
            </button>
          </div>

        </div>
      </div>

      {/* ── Discount Modal ── */}
      <ProposalDiscountModal
        show={ showDiscountModal }
        onClose={ () => setShowDiscountModal(false) }
        onSubmit={ handleApplyDiscount }
        formDataDis={ formDataDis }
        handleChangeDis={ handleChangeDis }
        grandTotal={ graphicTotal }
        discountDataSet={ discountSettings }
      />
    </>
  );
}

export default ProformaServices;
