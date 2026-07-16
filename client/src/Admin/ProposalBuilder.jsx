import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import Swal from "sweetalert2";
import {
  FileText, Save, ArrowLeft, Download, Send, Plus, Trash2, CheckCircle, ChevronDown, ChevronUp, AlignLeft, Building2, Search, Lightbulb, ClipboardList, Target, Calendar, TrendingUp, IndianRupee, ScrollText, Award, PenTool, X, Palette, Megaphone, BadgePercent
} from "lucide-react";

import API_BASE_URL from "../config/apiBaseUrl";
import { clearUser } from "../redux/user/userSlice";
import { PROPOSAL_SECTIONS, PROPOSAL_TYPES, BILLING_TYPES, buildInitialSections, buildInitialToggles, MILESTONE_PRESETS } from "../config/proposalDefaults";
// import ProposalPricingBuilder from "./components/ProposalPricingBuilder";
import AdminCalculator from "./AdminCalculator";
import AdsCampaignCalculator from "./AdsCampaignCalculator";
import ProposalDiscountModal from "./components/ProposalDiscountModal";
import { classifyProformaServices } from "../utils/proformaPricing";

const getClientRecord = (payload) => (Array.isArray(payload) ? payload[0] : payload);
const getClientDisplayName = (client) =>
  client?.company_name || client?.client_organization || client?.client_name || "Client";
const getBillableTotals = (table = []) => {
  const { dmServices, adsServices } = classifyProformaServices(table);
  const dmTotal = dmServices.reduce((sum, row) => sum + (row?.include_in_total === false ? 0 : (Number(row?.total_price) || 0)), 0);
  const adsTotal = adsServices.reduce((sum, row) => sum + (Number(row?.budget) || 0), 0);
  return { dmTotal, adsTotal };
};

export default function ProposalBuilder() {
  const { clientId, proposalId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser, token } = useSelector((state) => state.user);

  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [clientData, setClientData] = useState(null);

  const [proposalType, setProposalType] = useState("development");
  const [billingType, setBillingType] = useState("monthly");
  const [billingStartDate, setBillingStartDate] = useState("");
  const [billingEndDate, setBillingEndDate] = useState("");

  const [sections, setSections] = useState(buildInitialSections());
  const [toggles, setToggles] = useState(buildInitialToggles());

  const [pricingTable, setPricingTable] = useState([]);
  // Generated once at proposal creation, flows to all downstream tables
  const [proposalTxnId, setProposalTxnId] = useState("");
  const [grandTotal, setGrandTotal] = useState(0);

  const [milestones, setMilestones] = useState([]);
  const isFirstBillingTypeChange = React.useRef(true);

  useEffect(() => {
    if (!isInitialized) return;
    if (isFirstBillingTypeChange.current) {
      isFirstBillingTypeChange.current = false;
      return;
    }
    let preset = [];
    if (billingType === "monthly" || billingType === "yearly") {
      preset = MILESTONE_PRESETS.monthly || [];
    } else if (billingType === "custom") {
      preset = MILESTONE_PRESETS.project || [];
    }
    setMilestones(preset);
  }, [billingType, isInitialized]);

  const [discountType, setDiscountType] = useState("Amount");
  const [discountValue, setDiscountValue] = useState(0);
  const [discountSettings, setDiscountSettings] = useState([]);

  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [formDataDis, setFormDataDis] = useState({
    discount_type: "amount",
    discount_amt: "",
    discount_per: ""
  });

  const openDiscountModal = () => {
    setFormDataDis({
      discount_type: discountType === "Percentage" ? "percent" : "amount",
      discount_amt: discountType === "Amount" ? discountValue || "" : "",
      discount_per: discountType === "Percentage" ? discountValue || "" : ""
    });
    setShowDiscountModal(true);
  };

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

  const handleChangeDis = (e) => {
    const { name, value } = e.target;
    setFormDataDis(prev => ({ ...prev, [name]: value }));
  };

  const [predefinedNotes, setPredefinedNotes] = useState([]);
  const [manualNote, setManualNote] = useState("");

  const [openSections, setOpenSections] = useState(
    PROPOSAL_SECTIONS.reduce((acc, sec) => ({ ...acc, [sec.key]: false }), {})
  );

  const [showSendModal, setShowSendModal] = useState(false);
  const [sendChannel, setSendChannel] = useState("email");
  const [sending, setSending] = useState(false);

  // --- NEW PRICING UI STATE ---
  const [pricingMode, setPricingMode] = useState("plan"); // "plan" or "custom"
  const [getPlanData, setGetPlanData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeCalculator, setActiveCalculator] = useState(null); // "graphic" or "ads"
  // ----------------------------

  useEffect(() => {
    fetchClientData();
    fetchPredefinedNotes();
    fetchDiscountSettings();
    fetchPlanData();
    if (proposalId) {
      fetchProposalData();
    }
  }, [clientId, proposalId]);

  const isCreatingDraft = React.useRef(false);

  // Auto-draft creation when proposalId is undefined
  useEffect(() => {
    if (!proposalId && clientId) {
      if (isCreatingDraft.current) return;
      isCreatingDraft.current = true;

      const handleDraft = async () => {
        try {
          // Check for existing empty drafts
          const existingRes = await axios.get(`${API_BASE_URL}/auth/api/re_calculator/proposals/client/${clientId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (existingRes.data.status === "Success" && existingRes.data.data.length > 0) {
            const drafts = existingRes.data.data.filter(p => p.status === 'draft' && Number(p.grand_total_excl_gst) === 0);
            if (drafts.length > 0) {
              // Reuse the most recent empty draft
              const emptyDraft = drafts.sort((a, b) => b.id - a.id)[0];
              navigate(`/admin/proposal-builder/${clientId}/${emptyDraft.id}`, { replace: true });
              return;
            }
          }

          // Generated once at proposal creation, flows to all downstream tables
          const newTxnId = Date.now().toString();
          const payload = {
            client_id: clientId,
            proposal_type: "development",
            billing_type: "monthly",
            pricing_table_json: [],
            grand_total_excl_gst: 0,
            status: "draft",
            txn_id: newTxnId,
            created_by: currentUser?.name || "Admin",
            updated_by: currentUser?.name || "Admin"
          };
          const res = await axios.post(`${API_BASE_URL}/auth/api/re_calculator/proposal`, payload, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data.status === "Success" || res.data.proposalId) {
            setProposalTxnId(newTxnId);
            navigate(`/admin/proposal-builder/${clientId}/${res.data.proposalId}`, { replace: true });
          } else {
            isCreatingDraft.current = false;
          }
        } catch (err) {
          console.error("Failed to auto-create draft proposal:", err);
          isCreatingDraft.current = false;
        }
      };
      handleDraft();
    }
  }, [clientId, proposalId, navigate, token, currentUser]);

  // Save drafts to localStorage when things change
  useEffect(() => {
    if (isInitialized && proposalId) {
      const draftKey = `proposal_draft_${clientId}_${proposalId}`;
      const draftData = {
        pricingTable,
        sections,
        toggles,
        discountType,
        discountValue,
        proposalType,
        billingType,
        billingStartDate,
        billingEndDate,
        milestones,
      };
      localStorage.setItem(draftKey, JSON.stringify(draftData));
    }
  }, [pricingTable, sections, toggles, discountType, discountValue, proposalType, billingType, billingStartDate, billingEndDate, clientId, proposalId, loading, milestones]);

  const fetchClientData = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/auth/api/re_calculator/getClientDetailsById/${clientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const client = data.status === "Success" ? getClientRecord(data.data) : null;
      if (client) {
        setClientData(client);
        if (!proposalId) {
          // Cover page is already initialized as an object by buildInitialSections
        }
      }
    } catch (err) {
      console.error(err); 
      if (err.response?.status === 401) {
        dispatch(clearUser());
        navigate("/");
      }
    }
  };

  const fetchPredefinedNotes = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/auth/api/re_calculator/getNoteData`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPredefinedNotes(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDiscountSettings = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/auth/api/re_calculator/getDiscountSetting`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDiscountSettings(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPlanData = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/auth/api/re_calculator/getAllPlanData`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === "Success") setGetPlanData(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCustomServicesFromDB = async () => {
    try {
      const fetchGraphic = axios.get(`${API_BASE_URL}/auth/api/re_calculator/getByIDCalculatorTransactions/${proposalId}/${clientId}`, { headers: { Authorization: `Bearer ${token}` } })
        .catch(() => ({ data: { status: "Failure", data: [] } }));

      const fetchAds = axios.get(`${API_BASE_URL}/auth/api/re_calculator/getByIDAdsCampaignDetails/${proposalId}/${clientId}`, { headers: { Authorization: `Bearer ${token}` } })
        .catch(() => ({ data: { status: "Failure", data: [] } }));

      const fetchComplimentary = axios.get(`${API_BASE_URL}/auth/api/re_calculator/getByIDComplimentaryData/${proposalId}/${clientId}`, { headers: { Authorization: `Bearer ${token}` } })
        .catch(() => ({ data: { status: "Failure", data: [] } }));

      const [graphicRes, adsRes, compRes] = await Promise.all([fetchGraphic, fetchAds, fetchComplimentary]);

      const graphicData = graphicRes.data.status === "Success" ? graphicRes.data.data : [];
      const adsData = adsRes.data.status === "Success" ? adsRes.data.data : [];
      const compData = compRes.data.status === "Success" ? compRes.data.data : [];

      return [
        ...graphicData.map(item => ({
          id: item.id,
          service: (item.editing_type_name && item.editing_type_name !== "null") ? `${item.service_name} - ${item.category_name} (${item.editing_type_name})` : `${item.service_name} - ${item.category_name}`,
          service_name: item.service_name,
          category_name: item.category_name,
          editing_type_name: item.editing_type_name,
          quantity: item.quantity,
          unit_price: Number(item.total_amount) / Number(item.quantity || 1),
          total_price: Number(item.total_amount),
          include_in_total: true,
          source: 'custom_graphic'
        })),
        ...adsData.map(item => ({
          id: item.id,
          service: `Ads Campaign - ${item.category}`,
          service_name: 'Ads Campaign',
          category_name: item.category,
          quantity: 1,
          unit_price: Number(item.total),
          total_price: Number(item.total),
          include_in_total: true,
          source: 'custom_ads',
          budget: Number(item.amount),
          percent: Number(item.percent),
          charge: Number(item.charge)
        })),
        ...compData.map(item => ({
          id: item.id,
          service: (item.editing_type_name && item.editing_type_name !== "null") ? `${item.service_name} - ${item.category_name} (${item.editing_type_name})` : `${item.service_name} - ${item.category_name}`,
          service_name: item.service_name,
          category_name: item.category_name,
          editing_type_name: item.editing_type_name,
          quantity: item.quantity,
          unit_price: Number(item.editing_type_amount),
          total_price: Number(item.total_amount),
          include_in_total: false,
          source: 'custom_complimentary'
        }))
      ];
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const fetchProposalData = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE_URL}/auth/api/re_calculator/proposal/${proposalId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.status === "Success") {
        const p = data.data;
        let loadedProposalType = p.proposal_type;
        let loadedBillingType = p.billing_type;
        let loadedBillingStartDate = p.billing_start_date ? p.billing_start_date.split('T')[0] : "";
        let loadedBillingEndDate = p.billing_end_date ? p.billing_end_date.split('T')[0] : "";

        let loadedSections = typeof p.sections_json === "string" ? JSON.parse(p.sections_json) : p.sections_json;
        let loadedToggles = typeof p.optional_toggles === "string" ? JSON.parse(p.optional_toggles) : p.optional_toggles;
        let loadedPricing = typeof p.pricing_table_json === "string" ? JSON.parse(p.pricing_table_json) : p.pricing_table_json;
        let loadedMilestones = Array.isArray(loadedSections?.timeline) ? loadedSections.timeline : [];

        if (typeof loadedSections.cover_page === 'string') {
          loadedSections.cover_page = {
            duration: "1 Month",
            proposal_date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
            proposal_validity: "7 Days",
            prepared_by: "DOAGuru InfoSystems",
            website: "www.doaguru.com"
          };
        }

        const loadedDiscount = loadedSections?.pricing_discount || {};
        let loadedDiscountType = loadedDiscount.type || "Amount";
        let loadedDiscountValue = Number(loadedDiscount.value) || 0;

        const navEntries = window.performance.getEntriesByType("navigation");
        const isReload = navEntries.length > 0 && navEntries[0].type === "reload";
        const draftKey = `proposal_draft_${clientId}_${proposalId}`;

        if (isReload) {
          const draftStr = localStorage.getItem(draftKey);
          if (draftStr) {
            try {
              const draft = JSON.parse(draftStr);
              if (draft.pricingTable) loadedPricing = draft.pricingTable;
              if (draft.sections) loadedSections = draft.sections;
              if (draft.toggles) loadedToggles = draft.toggles;
              if (draft.proposalType) loadedProposalType = draft.proposalType;
              if (draft.billingType) loadedBillingType = draft.billingType;
              if (draft.billingStartDate !== undefined) loadedBillingStartDate = draft.billingStartDate;
              if (draft.billingEndDate !== undefined) loadedBillingEndDate = draft.billingEndDate;
              if (draft.discountType) loadedDiscountType = draft.discountType;
              if (draft.discountValue !== undefined) loadedDiscountValue = draft.discountValue;
              if (draft.milestones) loadedMilestones = draft.milestones;
            } catch (e) {
              console.error("Failed to parse draft", e);
            }
          }
        } else {
          localStorage.removeItem(draftKey);
        }

        setProposalType(loadedProposalType);
        setBillingType(loadedBillingType);
        setBillingStartDate(loadedBillingStartDate);
        setBillingEndDate(loadedBillingEndDate);
        setDiscountType(loadedDiscountType);
        setDiscountValue(loadedDiscountValue);
        // Load existing txn_id so it flows unchanged on edits
        if (p.txn_id) setProposalTxnId(p.txn_id);

        setSections({ ...buildInitialSections(), ...loadedSections });
        setToggles({ ...buildInitialToggles(), ...loadedToggles });
        setMilestones(loadedMilestones);

        let finalPricingTable = loadedPricing || [];
        try {
          const customItems = await fetchCustomServicesFromDB();
          if (customItems.length > 0) {
            const nonCustom = finalPricingTable.filter(p => !p.source?.startsWith('custom'));
            finalPricingTable = [...nonCustom, ...customItems];
          }
        } catch (e) {
          console.error("Error syncing custom services on load", e);
        }

        const normalizedFinalTable = finalPricingTable.map(normalizeRow);
        setPricingTable(normalizedFinalTable);
        setGrandTotal(getBillablePricingTotal(normalizedFinalTable));
        setIsInitialized(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSectionChange = (key, value) => {
    setSections(prev => ({ ...prev, [key]: value }));
  };

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const recalculateTotal = (table) => {
    setGrandTotal(getBillablePricingTotal(table));
  };

  const normalizeRow = (row) => {
    let parsedServiceName = row.service_name;
    let parsedCategoryName = row.category_name;
    let parsedEditingTypeName = row.editing_type_name;

    if (!parsedServiceName && !parsedCategoryName && row.service) {
      const serviceString = row.service;
      const matchEditing = serviceString.match(/\(([^)]+)\)$/);
      if (matchEditing) {
        parsedEditingTypeName = matchEditing[1];
      }
      const stringWithoutEditing = serviceString.replace(/\s*\([^)]+\)$/, '').trim();
      const parts = stringWithoutEditing.split(' - ');
      if (parts.length >= 2) {
        parsedServiceName = parts[0].trim();
        parsedCategoryName = parts.slice(1).join(' - ').trim();
      } else {
        parsedServiceName = stringWithoutEditing;
      }
    }

    return {
      ...row,
      service_name: parsedServiceName || row.service_name,
      category_name: parsedCategoryName || row.category_name,
      editing_type_name: parsedEditingTypeName || row.editing_type_name,
    };
  };

  const handlePricingTableChange = (table) => {
    const normalizedTable = table.map(normalizeRow);
    setPricingTable(normalizedTable);
    recalculateTotal(normalizedTable);
  };

  const handlePricingChange = (index, field, value) => {
    const newTable = [...pricingTable];
    newTable[index] = { ...newTable[index], [field]: value };
    if (field === 'quantity' || field === 'unit_price') {
      const qty = Number(newTable[index].quantity) || 0;
      const price = Number(newTable[index].unit_price) || 0;
      newTable[index].total_price = qty * price;
    }
    handlePricingTableChange(newTable);
  };

  const addMilestoneRow = () => {
    setMilestones([...milestones, { title: "", duration: "", deliverables: "" }]);
  };

  const removeMilestoneRow = (index) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const handleMilestoneChange = (index, field, value) => {
    const updated = [...milestones];
    updated[index][field] = value;
    setMilestones(updated);
  };

  const plans = Object.values(getPlanData.reduce((acc, item) => {
    if (!acc[item.plan_id]) {
      acc[item.plan_id] = { id: item.plan_id, title: item.plan_name, services: [] };
    }
    acc[item.plan_id].services.push(item);
    return acc;
  }, {}));

  const filteredPlans = plans.filter((p) => p.title?.toLowerCase().includes(searchQuery.toLowerCase()));

  const handlePlanSelect = (plan) => {
    const newItems = plan.services.map(item => {
      let price = Number(item.total_amount) || Number(item.total_ads) || 0;
      let qty = Number(item.quantity) || 1;
      return {
        service: `${item.service_name} - ${item.category_name}`,
        service_name: item.service_name,
        category_name: item.category_name,
        editing_type_name: item.editing_type_name,
        quantity: qty,
        unit_price: price / qty,
        total_price: price,
        include_in_total: item.service_name?.toLowerCase() !== "complimentary",
        source: 'plan'
      };
    });

    // Replace old plan services but keep custom/manual ones
    const nonPlanItems = pricingTable.filter(item => item.source !== 'plan');
    handlePricingTableChange([...nonPlanItems, ...newItems]);

    setSearchQuery("");
    setDropdownOpen(false);
  };

  const syncCustomServices = async () => {
    try {
      const customItems = await fetchCustomServicesFromDB();
      const nonCustom = pricingTable.filter(p => !p.source?.startsWith('custom'));
      handlePricingTableChange([...nonCustom, ...customItems]);
    } catch (error) {
      console.error(error);
    }
  };

  const removePricingRow = async (index) => {
    const row = pricingTable[index];
    if (row.source === 'custom_graphic') {
      try { await axios.delete(`${API_BASE_URL}/auth/api/re_calculator/deleteGraphicEntryById/${row.id}`); } catch (e) { }
    } else if (row.source === 'custom_ads') {
      try { await axios.delete(`${API_BASE_URL}/auth/api/re_calculator/deleteAdsCampaignEntryById/${row.id}`); } catch (e) { }
    } else if (row.source === 'custom_complimentary') {
      try { await axios.delete(`${API_BASE_URL}/auth/api/re_calculator/deleteComplimenatryById/${row.id}`); } catch (e) { }
    }
    const newTable = pricingTable.filter((_, i) => i !== index);
    handlePricingTableChange(newTable);
  };

  const mergeProposalNotes = (notes = []) => {
    if (!notes.length) return;
    const currentNotes = sections['notes_selection'] || [];
    const existing = new Set(currentNotes.map((note) => String(note.note_name || "").toLowerCase()));
    const nextNotes = notes.filter((note) => {
      const name = String(note.note_name || "").toLowerCase();
      return name && !existing.has(name);
    });
    if (nextNotes.length > 0) {
      handleSectionChange('notes_selection', [...currentNotes, ...nextNotes]);
    }
  };

  const getDiscountAmount = (baseTotal) => {
    const value = Number(discountValue) || 0;
    if (discountType === "Percentage") return (baseTotal * value) / 100;
    return value;
  };

  const handleAddPredefinedNote = (note) => {
    const currentNotes = sections['notes_selection'] || [];
    if (!currentNotes.find((n) => n.id === note.id)) {
      handleSectionChange('notes_selection', [
        ...currentNotes,
        { id: note.id, note_name: note.note_text, type: "predefined" },
      ]);
    }
  };

  const handleAddManualNote = () => {
    const currentNotes = sections['notes_selection'] || [];
    if (manualNote.trim() !== "") {
      handleSectionChange('notes_selection', [
        ...currentNotes,
        { id: Date.now(), note_name: manualNote, type: "manual" },
      ]);
      setManualNote("");
    }
  };

  const removeNote = (index) => {
    const currentNotes = sections['notes_selection'] || [];
    handleSectionChange('notes_selection', currentNotes.filter((_, i) => i !== index));
  };

  const saveProposal = async (generatePdf = false) => {
    try {
      setLoading(true);
      const { dmTotal, adsTotal } = getBillableTotals(pricingTable);
      const discountAmt = getDiscountAmount(dmTotal);
      const finalTotal = Math.max(0, dmTotal - discountAmt) + adsTotal;
      const sectionsForSave = {
        ...sections,
        timeline: milestones,
        terms_conditions: [],
        pricing_discount: {
          type: discountType,
          value: Number(discountValue) || 0,
        },
      };

      const payload = {
        client_id: clientId,
        proposal_type: proposalType,
        billing_type: billingType,
        ...(billingType === "custom" ? {
          billing_start_date: billingStartDate || null,
          billing_end_date: billingEndDate || null,
        } : {}),
        sections_json: sectionsForSave,
        optional_toggles: toggles,
        pricing_table_json: pricingTable,
        grand_total_excl_gst: finalTotal,
        terms_notes_json: [],
        notes_json: sections['notes_selection'] || [],
        additional_remarks: sections['additional_remarks'] || "",
        client_instructions: sections['client_instructions'] || "",
        created_by: currentUser?.name || "Admin",
        updated_by: currentUser?.name || "Admin",
      };

      let res;
      if (proposalId) {
        // On edit: send existing txn_id unchanged — do NOT regenerate
        payload.txn_id = proposalTxnId;
        res = await axios.put(`${API_BASE_URL}/auth/api/re_calculator/proposal/${proposalId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Generated once at proposal creation, flows to all downstream tables
        const newTxnId = Date.now().toString();
        payload.txn_id = newTxnId;
        setProposalTxnId(newTxnId);
        res = await axios.post(`${API_BASE_URL}/auth/api/re_calculator/proposal`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      if (res.data.status === "Success") {
        Swal.fire({ icon: "success", title: "Saved!", text: "Proposal saved successfully.", timer: 1500, showConfirmButton: false });

        const draftKey = `proposal_draft_${clientId}_${proposalId}`;
        localStorage.removeItem(draftKey);

        const savedId = proposalId || res.data.proposalId;

        if (!proposalId) {
          navigate(`/admin/proposal-builder/${clientId}/${savedId}`, { replace: true });
        }

        if (generatePdf) {
          downloadPdf(savedId);
        }
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to save proposal." });
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async (idToDownload = proposalId) => {
    if (!idToDownload) return;
    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE_URL}/auth/api/re_calculator/proposal/${idToDownload}/pdf`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.status === "Success" && res.data.html) {
        const printWindow = window.open('', '_blank');
        printWindow.document.open();
        printWindow.document.write(res.data.html);
        printWindow.document.close();
        
        // Extract title to set as PDF filename
        const titleMatch = res.data.html.match(/<title>(.*?)<\/title>/i);
        const docTitle = titleMatch ? titleMatch[1] : `Proposal_${getClientDisplayName(clientData)}`;
        printWindow.document.title = docTitle;
        
        setTimeout(() => {
          if (!printWindow.closed) {
            printWindow.focus();
            printWindow.print();
          }
        }, 1000);
      } else {
        throw new Error("Failed to generate PDF HTML");
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "PDF Error", text: "Failed to generate PDF." });
    } finally {
      setLoading(false);
    }
  };

  const sendToClient = async () => {
    if (!proposalId) {
      Swal.fire({ icon: "warning", title: "Unsaved", text: "Please save the proposal first before sending." });
      return;
    }
    setShowSendModal(true);
  };

  const executeSend = async () => {
    try {
      setSending(true);
      const res = await axios.post(`${API_BASE_URL}/auth/api/re_calculator/proposal/${proposalId}/send`,
        { channel: sendChannel },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.status === "Success") {
        setShowSendModal(false);
        Swal.fire({ icon: "success", title: "Sent!", text: `Proposal successfully sent via ${sendChannel}.`, timer: 1500, showConfirmButton: false });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to send proposal to client." });
    } finally {
      setSending(false);
    }
  };

  const markAsApproved = async () => {
    if (!proposalId) return;
    try {
      const confirm = await Swal.fire({
        title: 'Approve Proposal?',
        text: "Are you sure you want to manually mark this proposal as approved?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Approve',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#10b981',
      });
      
      if (!confirm.isConfirmed) return;
      
      setLoading(true);
      const res = await axios.put(`${API_BASE_URL}/auth/api/re_calculator/proposal/${proposalId}/status`, 
        { status: "approved" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.status === "Success") {
        Swal.fire({ icon: "success", title: "Approved!", text: "Proposal has been marked as approved manually." });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to mark as approved." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 pb-24">
      {/* Header */ }
      <div className="max-w-5xl mx-auto flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={ () => navigate(-1) } className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition">
            <ArrowLeft className="w-5 h-5 text-gray-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent">
              { proposalId ? "Edit Proposal" : "Create New Proposal" }
            </h1>
            <p className="text-gray-400 text-sm">Client: { clientData ? getClientDisplayName(clientData) : "Loading..." }</p>
          </div>
        </div>
        <div className="flex gap-3">
          { proposalId && (
            <>
              <button onClick={ () => sendToClient() } className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-600/30 transition text-sm font-semibold">
                <Send className="w-4 h-4" /> Send to Client
              </button>
              <button onClick={ () => markAsApproved() } className="flex items-center gap-2 px-4 py-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded-xl hover:bg-green-600/30 transition text-sm font-semibold">
                <CheckCircle className="w-4 h-4" /> Mark Approved
              </button>
              <button onClick={ () => downloadPdf() } className="flex items-center gap-2 px-4 py-2 bg-yellow-600/20 text-yellow-400 border border-yellow-500/30 rounded-xl hover:bg-yellow-600/30 transition text-sm font-semibold">
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </>
          ) }
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">

        {/* Basic Info Setup */ }
        <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-red-400" /> Setup Proposal
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Proposal Category</label>
              <select value={ proposalType } onChange={ e => setProposalType(e.target.value) } className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-3 text-white focus:border-red-500 outline-none">
                { PROPOSAL_TYPES.map(t => <option key={ t.value } value={ t.value }>{ t.label }</option>) }
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Billing Type</label>
              <select value={ billingType } onChange={ e => setBillingType(e.target.value) } className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-3 text-white focus:border-red-500 outline-none">
                { BILLING_TYPES.map(t => <option key={ t.value } value={ t.value }>{ t.label }</option>) }
              </select>
            </div>
            { billingType === "custom" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Start Date</label>
                  <input type="date" value={ billingStartDate } onClick={(e) => e.target.showPicker && e.target.showPicker()} onChange={ e => setBillingStartDate(e.target.value) } className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-3 text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">End Date</label>
                  <input type="date" value={ billingEndDate } onClick={(e) => e.target.showPicker && e.target.showPicker()} onChange={ e => setBillingEndDate(e.target.value) } className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-3 text-white" />
                </div>
              </>
            ) }
          </div>
        </div>

        {/* 13 Sections */ }
        <div className="space-y-4">
          { PROPOSAL_SECTIONS.map((sec, idx) => {
            const isOpen = openSections[sec.key];
            const isOptional = sec.optional;
            const isEnabled = !isOptional || toggles[sec.key];

            return (
              <div key={ sec.key } className={ `bg-gray-800/30 backdrop-blur-xl border ${isOpen ? 'border-red-500/50 shadow-lg shadow-red-900/20' : 'border-gray-700/50'} rounded-2xl overflow-hidden transition-all duration-300` }>

                {/* Header */ }
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/50" onClick={ () => toggleSection(sec.key) }>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-700/50 flex items-center justify-center text-red-400">
                      { sec.key === 'pricing_investment' ? <IndianRupee className="w-4 h-4" /> : <FileText className="w-4 h-4" /> }
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{ idx + 1 }. { sec.label }</h3>
                      <p className="text-xs text-gray-400">{ sec.description }</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    { isOptional && (
                      <label className="flex items-center gap-2" onClick={ e => e.stopPropagation() }>
                        <span className="text-xs text-gray-400 font-medium uppercase">Include</span>
                        <input
                          type="checkbox"
                          checked={ toggles[sec.key] }
                          onChange={ (e) => setToggles(prev => ({ ...prev, [sec.key]: e.target.checked })) }
                          className="w-4 h-4 accent-red-500"
                        />
                      </label>
                    ) }
                    { isOpen ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" /> }
                  </div>
                </div>

                {/* Body */ }
                { isOpen && (
                  <div className={ `p-4 border-t border-gray-700/50 bg-gray-900/30 ${!isEnabled ? 'opacity-50 pointer-events-none' : ''}` }>

                    { sec.type === 'textarea' || sec.type === 'readonly' ? (
                      <textarea
                        value={ sections[sec.key] || "" }
                        onChange={ (e) => handleSectionChange(sec.key, e.target.value) }
                        readOnly={ sec.type === 'readonly' }
                        className="w-full h-48 bg-gray-900/50 border border-gray-700 rounded-xl p-4 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-y text-sm leading-relaxed"
                        placeholder="Enter content here..."
                      />
                    ) : sec.type === 'cover_fields' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Client Name</label>
                          <input type="text" value={ clientData?.client_name || getClientDisplayName(clientData) } readOnly className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-gray-400 cursor-not-allowed" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Organization</label>
                          <input type="text" value={ clientData?.company_name || clientData?.client_organization || getClientDisplayName(clientData) } readOnly className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-gray-400 cursor-not-allowed" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Duration</label>
                          <input type="text" value={ sections[sec.key]?.duration || '' } onChange={ e => handleSectionChange(sec.key, { ...sections[sec.key], duration: e.target.value }) } className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white focus:border-red-500 outline-none" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Proposal Date</label>
                          <input type="text" value={ sections[sec.key]?.proposal_date || '' } onChange={ e => handleSectionChange(sec.key, { ...sections[sec.key], proposal_date: e.target.value }) } className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white focus:border-red-500 outline-none" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Proposal Validity</label>
                          <input type="text" value={ sections[sec.key]?.proposal_validity || '' } onChange={ e => handleSectionChange(sec.key, { ...sections[sec.key], proposal_validity: e.target.value }) } className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white focus:border-red-500 outline-none" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Prepared By</label>
                          <input type="text" value={ sections[sec.key]?.prepared_by || '' } onChange={ e => handleSectionChange(sec.key, { ...sections[sec.key], prepared_by: e.target.value }) } className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white focus:border-red-500 outline-none" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Website</label>
                          <input type="text" value={ sections[sec.key]?.website || '' } onChange={ e => handleSectionChange(sec.key, { ...sections[sec.key], website: e.target.value }) } className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white focus:border-red-500 outline-none" />
                        </div>
                      </div>
                    ) : sec.type === 'pricing_table' ? (
                      <div className="space-y-6">

                        {/* Toggle Mode */ }
                        <div className="flex bg-gray-900/50 rounded-xl p-1 border border-gray-700 w-full max-w-sm mx-auto">
                          <button
                            onClick={ () => setPricingMode("plan") }
                            className={ `flex-1 py-2 text-sm font-semibold rounded-lg transition ${pricingMode === "plan" ? "bg-red-600 text-white shadow-md" : "text-gray-400 hover:text-white"}` }
                          >
                            Select Plan
                          </button>
                          <button
                            onClick={ () => setPricingMode("custom") }
                            className={ `flex-1 py-2 text-sm font-semibold rounded-lg transition ${pricingMode === "custom" ? "bg-orange-600 text-white shadow-md" : "text-gray-400 hover:text-white"}` }
                          >
                            Custom Service
                          </button>
                        </div>

                        {/* Plan Selection UI */ }
                        { pricingMode === "plan" && (
                          <div className="relative max-w-md mx-auto">
                            <div className="relative flex items-center">
                              <Search className="absolute left-3 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                placeholder="Search plans..."
                                value={ searchQuery }
                                onFocus={ () => setDropdownOpen(true) }
                                onChange={ (e) => setSearchQuery(e.target.value) }
                                className="w-full bg-gray-900/80 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                              />
                              { searchQuery && (
                                <button onClick={ () => { setSearchQuery(""); setDropdownOpen(false); } } className="absolute right-3 text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
                              ) }
                            </div>
                            { dropdownOpen && filteredPlans.length > 0 && (
                              <div className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                                { filteredPlans.map(plan => (
                                  <div key={ plan.id } onClick={ () => handlePlanSelect(plan) } className="p-3 border-b border-gray-700/50 hover:bg-gray-700/50 cursor-pointer transition">
                                    <h4 className="font-semibold text-white text-sm">{ plan.title }</h4>
                                    <p className="text-xs text-gray-400 mt-1">{ plan.services.length } Services Included</p>
                                  </div>
                                )) }
                              </div>
                            ) }
                          </div>
                        ) }

                        {/* Custom Service UI */ }
                        { pricingMode === "custom" && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div
                              onClick={ () => setActiveCalculator("graphic") }
                              className="bg-gray-800/80 border border-gray-700 rounded-xl p-5 hover:border-orange-500/50 hover:bg-gray-800 cursor-pointer transition group"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 group-hover:scale-110 transition">
                                  <Palette className="w-6 h-6" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-white">Graphic & SEO</h4>
                                  <p className="text-xs text-gray-400 mt-1">Design, SEO, Websites</p>
                                </div>
                              </div>
                            </div>
                            <div
                              onClick={ () => setActiveCalculator("ads") }
                              className="bg-gray-800/80 border border-gray-700 rounded-xl p-5 hover:border-red-500/50 hover:bg-gray-800 cursor-pointer transition group"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 group-hover:scale-110 transition">
                                  <Megaphone className="w-6 h-6" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-white">Ads Campaigns</h4>
                                  <p className="text-xs text-gray-400 mt-1">Meta, Google Ads Budget</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) }

                        {/* Grouped Pricing Tables */ }
                        <div className="space-y-4">
                          { (() => {
                            const tableWithIndex = pricingTable.map((item, originalIndex) => ({
                              ...item,
                              originalIndex
                            }));
                            const { dmServices, adsServices } = classifyProformaServices(tableWithIndex);

                            const complimentaryItems = tableWithIndex.filter(item =>
                              item.service_name?.toLowerCase() === "complimentary" || item.include_in_total === false
                            );
                            const dmItems = dmServices.filter(item =>
                              item.service_name?.toLowerCase() !== "complimentary" && item.include_in_total !== false
                            );

                            const renderTable = (title, items, isAds = false) => {
                              if (items.length === 0) return null;
                              return (
                                <div className="overflow-x-auto bg-gray-900/40 rounded-xl border border-gray-800/50 mb-4">
                                  <h4 className="p-3 text-white font-bold bg-gray-800/80 border-b border-gray-700/50">{ title }</h4>
                                  <table className="w-full text-left text-sm">
                                    <thead>
                                      <tr className="border-b border-gray-700/50 bg-gray-800/30 text-gray-400 uppercase tracking-wider text-[10px] font-bold">
                                        <th className="p-3">Category Name</th>
                                        <th className="p-3">Service Name</th>
                                        <th className="p-3 w-20 text-center">Qty</th>
                                        <th className="p-3 w-32 text-right">Total</th>
                                        <th className="p-3 w-20 text-center">Action</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      { items.map((row, idx) => (
                                        <tr key={ `${row.originalIndex}-${idx}` } className="border-b border-gray-800/50 hover:bg-gray-800/20 transition group">
                                          <td className="p-3">
                                            <p className="font-medium text-gray-200">{ row.category_name || '-' }</p>
                                            { row.source === 'plan' && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full mt-1 inline-block">Plan Service</span> }
                                            { row.source === 'custom_graphic' && <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full mt-1 inline-block">Graphic & SEO</span> }
                                            { row.source === 'custom_ads' && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full mt-1 inline-block">Ads Campaign</span> }
                                            { !row.source && <span className="text-[10px] bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full mt-1 inline-block">Manual</span> }
                                          </td>
                                          <td className="p-3">
                                            <p className="font-medium text-gray-200">
                                              { row.service_name || row.service || '-' }
                                            </p>
                                          </td>
                                          <td className="p-3 text-center text-gray-300">{ isAds ? '-' : (row.quantity || 1) }</td>
                                          <td className="p-3 text-right text-yellow-400 font-semibold">₹{ Number(isAds ? row.budget : row.total_price).toLocaleString() }</td>
                                          <td className="p-3 flex justify-center gap-2">
                                            { row.source?.startsWith('custom') ? (
                                              <button onClick={ () => setActiveCalculator(row.source === 'custom_graphic' ? 'graphic' : 'ads') } className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition opacity-0 group-hover:opacity-100"><PenTool className="w-3.5 h-3.5" /></button>
                                            ) : (
                                              <button onClick={ () => removePricingRow(row.originalIndex) } className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button>
                                            ) }
                                          </td>
                                        </tr>
                                      )) }
                                    </tbody>
                                  </table>
                                </div>
                              );
                            };

                            if (pricingTable.length === 0) {
                              return (
                                <div className="overflow-x-auto bg-gray-900/40 rounded-xl border border-gray-800/50 p-8 text-center text-gray-500 text-sm">
                                  No services added yet.
                                </div>
                              );
                            }

                            return (
                              <>
                                { renderTable("DM Services", dmItems) }
                                { renderTable("Ads Services", adsServices, true) }
                                { renderTable("Complimentary Services", complimentaryItems) }
                              </>
                            );
                          })() }
                        </div>

                        {/* Modals for Custom Calculators */ }
                        { activeCalculator === "graphic" && (
                          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                            <div className="relative w-full max-w-6xl bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 my-8">
                              <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900 rounded-t-2xl">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2"><Palette className="w-5 h-5 text-orange-400" /> Graphic & SEO Calculator</h2>
                                <button onClick={ () => { setActiveCalculator(null); syncCustomServices(); } } className="w-8 h-8 rounded-lg hover:bg-gray-800 text-gray-400 flex items-center justify-center transition"><X className="w-5 h-5" /></button>
                              </div>
                              <div className="p-4 max-h-[80vh] overflow-y-auto">
                                <AdminCalculator hideNotes={ true } onSaveComplete={ syncCustomServices } />
                              </div>
                            </div>
                          </div>
                        ) }

                        { activeCalculator === "ads" && (
                          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                            <div className="relative w-full max-w-6xl bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 my-8">
                              <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900 rounded-t-2xl">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2"><Megaphone className="w-5 h-5 text-red-400" /> Ads Campaign Calculator</h2>
                                <button onClick={ () => { setActiveCalculator(null); syncCustomServices(); } } className="w-8 h-8 rounded-lg hover:bg-gray-800 text-gray-400 flex items-center justify-center transition"><X className="w-5 h-5" /></button>
                              </div>
                              <div className="p-4 max-h-[80vh] overflow-y-auto">
                                <AdsCampaignCalculator hideNotes={ true } onSaveComplete={ syncCustomServices } />
                              </div>
                            </div>
                          </div>
                        ) }

                        <div className="flex justify-end pt-4 border-t border-gray-700/50 mt-4">
                          <div className="w-1/2 space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <button
                                onClick={ openDiscountModal }
                                className="flex items-center gap-2 px-4 py-2 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 border border-yellow-400/20 rounded-xl transition-all text-sm font-semibold"
                              >
                                <BadgePercent className="w-4 h-4" />
                                { discountValue > 0 ? "Edit Discount" : "Apply Discount" }
                              </button>
                            </div>
                            <div className="text-right">
                              {(() => {
                                const { dmTotal, adsTotal } = getBillableTotals(pricingTable);
                                const discountAmt = getDiscountAmount(dmTotal);
                                const finalDmTotal = Math.max(0, dmTotal - discountAmt);
                                return (
                                  <>
                                    <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">Subtotal (Excl. GST)</p>
                                    <p className="text-lg font-semibold text-white">₹{ dmTotal.toLocaleString() }</p>
      
                                    { discountValue > 0 && (
                                      <>
                                        <p className="text-sm text-red-400 uppercase tracking-wider mt-2 mb-1">Discount</p>
                                        <p className="text-md font-semibold text-red-400">
                                          - ₹{ discountAmt.toLocaleString() }
                                        </p>
                                      </>
                                    ) }
                                    
                                    { adsTotal > 0 && (
                                      <>
                                        <p className="text-sm text-gray-400 uppercase tracking-wider mt-3 mb-1">Ads Budget Total</p>
                                        <p className="text-lg font-semibold text-white">₹{ adsTotal.toLocaleString() }</p>
                                      </>
                                    )}
      
                                    <p className="text-sm text-gray-400 uppercase tracking-wider mt-3 mb-1">Grand Total (Excl. GST)</p>
                                    <p className="text-2xl font-bold text-white">
                                      ₹{ (finalDmTotal + adsTotal).toLocaleString() }
                                    </p>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </div>

                        {/* Proposal Discount Modal */}
                        <ProposalDiscountModal
                          show={ showDiscountModal }
                          onClose={ () => setShowDiscountModal(false) }
                          onSubmit={ handleApplyDiscount }
                          formDataDis={ formDataDis }
                          handleChangeDis={ handleChangeDis }
                          grandTotal={ getBillableTotals(pricingTable).dmTotal }
                          discountDataSet={ discountSettings[0] }
                        />
                      </div>
                    ) : sec.type === 'combined_notes_tc' ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Left: Available Predefined Notes */ }
                          <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700 h-64 overflow-y-auto">
                            <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Available Notes</h4>
                            <div className="space-y-2">
                              { predefinedNotes.map((note) => (
                                <div key={ note.id } className="flex items-center justify-between p-2 hover:bg-gray-800 rounded-lg group">
                                  <span className="text-sm text-gray-400 truncate w-3/4" title={ note.note_text }>{ note.note_text }</span>
                                  <button onClick={ () => handleAddPredefinedNote(note) } className="text-red-400 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition">
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              )) }
                            </div>
                          </div>

                          {/* Right: Selected Notes & Custom Input */ }
                          <div className="space-y-4 h-64 flex flex-col">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={ manualNote }
                                onChange={ (e) => setManualNote(e.target.value) }
                                className="flex-1 bg-gray-900/50 border border-gray-700 rounded-lg p-2 text-sm text-white focus:border-red-500 outline-none"
                                placeholder="Add custom note..."
                              />
                              <button onClick={ handleAddManualNote } className="px-4 bg-red-600 hover:bg-red-500 text-white rounded-lg transition text-sm font-semibold">Add</button>
                            </div>
                            <div className="flex-1 bg-gray-900/50 p-4 rounded-xl border border-gray-700 overflow-y-auto">
                              <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Selected Notes</h4>
                              <div className="space-y-2">
                                { (sections['notes_selection'] || []).map((n, i) => (
                                  <div key={ i } className="flex items-start justify-between gap-2 p-2 bg-gray-800 rounded-lg">
                                    <span className="text-sm text-gray-300">{ n.note_name }</span>
                                    <button onClick={ () => removeNote(i) } className="text-red-400 p-1 hover:bg-red-400/20 rounded transition mt-0.5">
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                )) }
                                { (!sections['notes_selection'] || sections['notes_selection'].length === 0) && (
                                  <p className="text-sm text-gray-500 italic text-center mt-4">No notes selected.</p>
                                ) }
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : sec.type === 'approval' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-300 border-b border-gray-700 pb-2">Our Signature</h4>
                          <input type="text" placeholder="Signatory Name" value={ sections[sec.key]?.our_signatory_name || '' } onChange={ e => handleSectionChange(sec.key, { ...sections[sec.key], our_signatory_name: e.target.value }) } className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white" />
                          <input type="text" placeholder="Designation" value={ sections[sec.key]?.our_signatory_designation || '' } onChange={ e => handleSectionChange(sec.key, { ...sections[sec.key], our_signatory_designation: e.target.value }) } className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white" />
                        </div>
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-300 border-b border-gray-700 pb-2">Client Approval</h4>
                          <input type="text" placeholder="Client Name" value={ sections[sec.key]?.client_signatory_name || '' } onChange={ e => handleSectionChange(sec.key, { ...sections[sec.key], client_signatory_name: e.target.value }) } className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white" />
                          <input type="text" placeholder="Designation" value={ sections[sec.key]?.client_signatory_designation || '' } onChange={ e => handleSectionChange(sec.key, { ...sections[sec.key], client_signatory_designation: e.target.value }) } className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white" />
                        </div>
                      </div>
                    ) : sec.key === 'timeline' ? (
                      <div className="space-y-4">
                        <div className="overflow-x-auto bg-gray-900/40 rounded-xl border border-gray-800/50">
                          <table className="w-full text-left text-sm">
                            <thead>
                              <tr className="border-b border-gray-700/50 bg-gray-800/30 text-gray-400 uppercase tracking-wider text-[10px] font-bold">
                                <th className="p-3">Milestone Title</th>
                                <th className="p-3 w-48">Duration</th>
                                <th className="p-3">Deliverables / Details</th>
                                <th className="p-3 w-16 text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              { milestones.length === 0 ? (
                                <tr>
                                  <td colSpan="4" className="p-8 text-center text-gray-500 text-sm">No milestones added yet. Click 'Add Milestone' to begin.</td>
                                </tr>
                              ) : (
                                milestones.map((row, i) => (
                                  <tr key={ i } className="border-b border-gray-800/50 hover:bg-gray-800/20 transition group">
                                    <td className="p-2">
                                      <input
                                        type="text"
                                        value={ row.title || "" }
                                        onChange={ (e) => handleMilestoneChange(i, 'title', e.target.value) }
                                        className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-2 text-white text-sm focus:border-red-500 outline-none"
                                        placeholder="e.g. Month 1: Setup"
                                      />
                                    </td>
                                    <td className="p-2">
                                      <input
                                        type="text"
                                        value={ row.duration || "" }
                                        onChange={ (e) => handleMilestoneChange(i, 'duration', e.target.value) }
                                        className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-2 text-white text-sm focus:border-red-500 outline-none"
                                        placeholder="e.g. Days 1-7 or Week 1"
                                      />
                                    </td>
                                    <td className="p-2">
                                      <input
                                        type="text"
                                        value={ row.deliverables || "" }
                                        onChange={ (e) => handleMilestoneChange(i, 'deliverables', e.target.value) }
                                        className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-2 text-white text-sm focus:border-red-500 outline-none"
                                        placeholder="e.g. Initial setup, keyword research"
                                      />
                                    </td>
                                    <td className="p-2 text-center">
                                      <button
                                        onClick={ () => removeMilestoneRow(i) }
                                        className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              ) }
                            </tbody>
                          </table>
                        </div>
                        <button
                          onClick={ addMilestoneRow }
                          className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 font-semibold py-2"
                        >
                          <Plus className="w-4 h-4" /> Add Milestone
                        </button>
                      </div>
                    ) : sec.key === 'scope_of_work' ? (
                      <div className="overflow-x-auto bg-gray-900/40 rounded-xl border border-gray-800/50">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-gray-700/50 bg-gray-800/30 text-gray-400 uppercase tracking-wider text-[10px] font-bold">
                              <th className="p-3">Service Category</th>
                              <th className="p-3">Service Name</th>
                              <th className="p-3 w-24 text-center">Quantity</th>
                            </tr>
                          </thead>
                          <tbody>
                            { pricingTable.length === 0 ? (
                              <tr>
                                <td colSpan="3" className="p-8 text-center text-gray-500 text-sm">No deliverables added yet. Please select a plan or custom services.</td>
                              </tr>
                            ) : (
                              pricingTable.map((row, i) => (
                                <tr key={ `sow-${i}` } className="border-b border-gray-800/50 hover:bg-gray-800/20 transition">
                                  <td className="p-3 text-gray-300 font-medium">{ row.category_name || '-' }</td>
                                  <td className="p-3 text-gray-300">
                                    { row.service_name || row.service || '-' }
                                  </td>
                                  <td className="p-3 text-center text-gray-300">{ row.quantity || '-' }</td>
                                </tr>
                              ))
                            ) }
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-gray-500 italic text-sm">Table layout placeholder — Use text for now or expand this component.</div>
                    ) }
                  </div>
                ) }
              </div>
            );
          }) }
        </div>
      </div>

      {/* Action Bar (Sticky Bottom) */ }
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900/90 backdrop-blur-md border-t border-gray-800 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
            Status: <span className="text-red-400">{ proposalId ? 'Draft / Saved' : 'Unsaved' }</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={ () => saveProposal(false) }
              disabled={ loading }
              className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 rounded-xl font-semibold transition"
            >
              { loading ? "Saving..." : "Save Draft" }
            </button>
            <button
              onClick={ () => saveProposal(true) }
              disabled={ loading }
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-xl font-semibold shadow-lg shadow-red-900/20 transition"
            >
              <Save className="w-4 h-4" /> Save & Generate PDF
            </button>
          </div>
        </div>
      </div>
      {/* Send Modal */ }
      { showSendModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-red-400" /> Send Proposal
              </h3>
              <button onClick={ () => setShowSendModal(false) } className="text-gray-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-400 mb-4">
                Select how you want to send this proposal to <b>{ getClientDisplayName(clientData) }</b>.
              </p>
              <div className="space-y-3 mb-6">
                <label className={ `flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition ${sendChannel === 'email' ? 'bg-red-900/20 border-red-500/50' : 'bg-gray-800 border-gray-700 hover:border-gray-600'}` }>
                  <input type="radio" name="channel" value="email" checked={ sendChannel === 'email' } onChange={ () => setSendChannel('email') } className="accent-red-500 w-4 h-4" />
                  <span className="font-medium text-white">Email Only</span>
                </label>
                <label className={ `flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition ${sendChannel === 'whatsapp' ? 'bg-yellow-900/20 border-yellow-500/50' : 'bg-gray-800 border-gray-700 hover:border-gray-600'}` }>
                  <input type="radio" name="channel" value="whatsapp" checked={ sendChannel === 'whatsapp' } onChange={ () => setSendChannel('whatsapp') } className="accent-yellow-500 w-4 h-4" />
                  <span className="font-medium text-white">WhatsApp Only</span>
                </label>
                <label className={ `flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition ${sendChannel === 'both' ? 'bg-orange-900/20 border-orange-500/50' : 'bg-gray-800 border-gray-700 hover:border-gray-600'}` }>
                  <input type="radio" name="channel" value="both" checked={ sendChannel === 'both' } onChange={ () => setSendChannel('both') } className="accent-orange-500 w-4 h-4" />
                  <span className="font-medium text-white">Both (Email & WhatsApp)</span>
                </label>
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={ () => setShowSendModal(false) } className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 font-semibold transition">Cancel</button>
                <button disabled={ sending } onClick={ executeSend } className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition flex items-center gap-2">
                  { sending ? 'Sending...' : 'Send Now' } <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) }
    </div>
  );
}
