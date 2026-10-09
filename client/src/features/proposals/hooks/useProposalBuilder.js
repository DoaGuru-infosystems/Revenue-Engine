import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Swal from "sweetalert2";
import { clearUser } from "../../../redux/user/userSlice";
import {
  PROPOSAL_SECTIONS,
  buildInitialSections,
  buildInitialToggles,
  MILESTONE_PRESETS,
} from "../../../config/proposalDefaults";
import { classifyProformaServices } from "../../../utils/proformaPricing";
import {
  getClientDetailsById,
  getNoteData,
  getDiscountSetting,
  getAllPlanData,
  getCustomServicesFromDB,
  getProposalById,
  saveProposal as apiSaveProposal,
  generateProposalPdf,
  sendProposal as apiSendProposal,
  updateProposalStatus,
  deleteGraphicEntryById,
  deleteAdsCampaignEntryById,
  deleteComplimentaryById,
} from "../services/proposalService";

const getClientRecord = (payload) => (Array.isArray(payload) ? payload[0] : payload);
export const getClientDisplayName = (client) =>
  client?.company_name || client?.client_organization || client?.client_name || "Client";

export const getBillableTotals = (table = []) => {
  const { dmServices, adsServices } = classifyProformaServices(table);
  const dmTotal = dmServices.reduce(
    (sum, row) => sum + (row?.include_in_total === false ? 0 : Number(row?.total_price) || 0),
    0
  );
  const adsTotal = adsServices.reduce((sum, row) => sum + (Number(row?.budget) || 0), 0);
  return { dmTotal, adsTotal };
};

export const normalizeRow = (row) => {
  let parsedServiceName = row.service_name;
  let parsedCategoryName = row.category_name;
  let parsedEditingTypeName = row.editing_type_name;

  if (!parsedServiceName && !parsedCategoryName && row.service) {
    const serviceString = row.service;
    const matchEditing = serviceString.match(/\(([^)]+)\)$/);
    if (matchEditing) {
      parsedEditingTypeName = matchEditing[1];
    }
    const stringWithoutEditing = serviceString.replace(/\s*\([^)]+\)$/, "").trim();
    const parts = stringWithoutEditing.split(" - ");
    if (parts.length >= 2) {
      parsedServiceName = parts[0].trim();
      parsedCategoryName = parts.slice(1).join(" - ").trim();
    } else {
      parsedServiceName = stringWithoutEditing;
    }
  }

  const serviceTitle =
    row.service ||
    (parsedEditingTypeName && parsedEditingTypeName !== "null" && parsedEditingTypeName !== "N/A"
      ? `${parsedServiceName || "Service"} - ${parsedCategoryName || "Category"} (${parsedEditingTypeName})`
      : parsedServiceName && parsedCategoryName
        ? `${parsedServiceName} - ${parsedCategoryName}`
        : parsedServiceName || parsedCategoryName || "Service");

  return {
    ...row,
    service: serviceTitle,
    service_name: parsedServiceName || row.service_name,
    category_name: parsedCategoryName || row.category_name,
    editing_type_name: parsedEditingTypeName || row.editing_type_name,
  };
};

export function useProposalBuilder() {
  const { clientId, proposalId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const basePath = isAdmin ? "/admin" : "/BD";
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
  const [proposalTxnId, setProposalTxnId] = useState("");
  const [milestones, setMilestones] = useState([]);
  const isFirstBillingTypeChange = useRef(true);

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
    discount_per: "",
  });

  const openDiscountModal = () => {
    setFormDataDis({
      discount_type: discountType === "Percentage" ? "percent" : "amount",
      discount_amt: discountType === "Amount" ? discountValue || "" : "",
      discount_per: discountType === "Percentage" ? discountValue || "" : "",
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
    setFormDataDis((prev) => ({ ...prev, [name]: value }));
  };

  const [predefinedNotes, setPredefinedNotes] = useState([]);
  const [manualNote, setManualNote] = useState("");

  const [openSections, setOpenSections] = useState(
    PROPOSAL_SECTIONS.reduce((acc, sec) => ({ ...acc, [sec.key]: false }), {})
  );

  const [showSendModal, setShowSendModal] = useState(false);
  const [sendChannel, setSendChannel] = useState("email");
  const [sending, setSending] = useState(false);

  // PRICING UI STATE
  const [pricingMode, setPricingMode] = useState("plan");
  const [getPlanData, setGetPlanData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeCalculator, setActiveCalculator] = useState(null);
  const [proposalStatus, setProposalStatus] = useState("");

  useEffect(() => {
    fetchClientData();
    fetchNotes();
    fetchDiscounts();
    fetchPlans();
    if (proposalId) {
      fetchProposal();
    } else {
      setIsInitialized(true);
    }
  }, [clientId, proposalId]);

  // Inject client name into summaries
  const clientNameInjected = useRef(false);
  useEffect(() => {
    if (!clientData || clientNameInjected.current) return;
    clientNameInjected.current = true;
    const clientName = getClientDisplayName(clientData);
    setSections((prev) => {
      const updated = { ...prev };
      if (typeof updated.executive_summary === "string" && updated.executive_summary.includes("[Client Name]")) {
        updated.executive_summary = updated.executive_summary.replace(/\[Client Name\]/g, clientName);
      }
      if (typeof updated.client_problem === "string" && updated.client_problem.includes("[Client Name]")) {
        updated.client_problem = updated.client_problem.replace(/\[Client Name\]/g, clientName);
      }
      return updated;
    });
  }, [clientData]);

  // Save drafts
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
  }, [
    pricingTable,
    sections,
    toggles,
    discountType,
    discountValue,
    proposalType,
    billingType,
    billingStartDate,
    billingEndDate,
    clientId,
    proposalId,
    loading,
    milestones,
  ]);

  const fetchClientData = async () => {
    try {
      const data = await getClientDetailsById(clientId, token);
      const client = data.status === "Success" ? getClientRecord(data.data) : null;
      if (client) {
        setClientData(client);
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        dispatch(clearUser());
        navigate("/");
      }
    }
  };

  const fetchNotes = async () => {
    try {
      const data = await getNoteData(token);
      setPredefinedNotes(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDiscounts = async () => {
    try {
      const data = await getDiscountSetting(token);
      setDiscountSettings(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await getAllPlanData(token);
      if (res.status === "Success") setGetPlanData(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchProposal = async () => {
    try {
      setLoading(true);
      const data = await getProposalById(proposalId, token);
      if (data.status === "Success") {
        const p = data.data;
        let loadedProposalType = p.proposal_type;
        let loadedBillingType = p.billing_type;
        let loadedBillingStartDate = p.billing_start_date ? p.billing_start_date.split("T")[0] : "";
        let loadedBillingEndDate = p.billing_end_date ? p.billing_end_date.split("T")[0] : "";

        let loadedSections = typeof p.sections_json === "string" ? JSON.parse(p.sections_json) : p.sections_json;
        let loadedToggles = typeof p.optional_toggles === "string" ? JSON.parse(p.optional_toggles) : p.optional_toggles;
        let loadedPricing = typeof p.pricing_table_json === "string" ? JSON.parse(p.pricing_table_json) : p.pricing_table_json;
        let loadedMilestones = Array.isArray(loadedSections?.timeline) ? loadedSections.timeline : [];

        if (typeof loadedSections?.cover_page === "string") {
          loadedSections.cover_page = {
            duration: "1 Month",
            proposal_date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
            proposal_validity: "7 Days",
            prepared_by: "DOAGuru InfoSystems",
            website: "www.doaguru.com",
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
        setProposalStatus(p.status || "");
        if (p.txn_id) setProposalTxnId(p.txn_id);

        setSections({ ...buildInitialSections(), ...loadedSections });
        setToggles({ ...buildInitialToggles(), ...loadedToggles });
        setMilestones(loadedMilestones);

        let finalPricingTable = loadedPricing || [];
        try {
          const customItems = await getCustomServicesFromDB(proposalId, clientId, token);
          if (customItems.length > 0) {
            const nonCustom = finalPricingTable.filter((item) => !item.source?.startsWith("custom"));
            finalPricingTable = [...nonCustom, ...customItems];
          }
        } catch (e) {
          console.error("Error syncing custom services on load", e);
        }

        const normalizedFinalTable = finalPricingTable.map(normalizeRow);
        setPricingTable(normalizedFinalTable);
        setIsInitialized(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSectionChange = (key, value) => {
    setSections((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePricingTableChange = (table) => {
    const normalizedTable = table.map(normalizeRow);
    setPricingTable(normalizedTable);
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

  const plans = Object.values(
    getPlanData.reduce((acc, item) => {
      if (!acc[item.plan_id]) {
        acc[item.plan_id] = { id: item.plan_id, title: item.plan_name, services: [] };
      }
      acc[item.plan_id].services.push(item);
      return acc;
    }, {})
  );

  const filteredPlans = plans.filter((p) => p.title?.toLowerCase().includes(searchQuery.toLowerCase()));

  const handlePlanSelect = (plan) => {
    const newItems = plan.services.map((item) => {
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
        source: "plan",
      };
    });

    const nonPlanItems = pricingTable.filter((item) => item.source !== "plan");
    handlePricingTableChange([...nonPlanItems, ...newItems]);

    setSearchQuery("");
    setDropdownOpen(false);
  };

  const handleServiceAdded = (row) => {
    const normalized = normalizeRow(row);
    setPricingTable((prevTable) => {
      const exists = prevTable.findIndex((p) => p.id === normalized.id);
      let newTable;
      if (exists !== -1) {
        newTable = [...prevTable];
        newTable[exists] = normalized;
      } else {
        newTable = [...prevTable, normalized];
      }
      return newTable;
    });
  };

  const handleServiceDeleted = (id) => {
    const newTable = pricingTable.filter((row) => row.id !== id);
    setPricingTable(newTable);
  };

  const removePricingRow = async (index) => {
    const row = pricingTable[index];
    if (row.source === "custom_graphic") {
      try {
        await deleteGraphicEntryById(row.id, token);
      } catch {
        /* ignore */
      }
    } else if (row.source === "custom_ads") {
      try {
        await deleteAdsCampaignEntryById(row.id, token);
      } catch {
        /* ignore */
      }
    } else if (row.source === "custom_complimentary") {
      try {
        await deleteComplimentaryById(row.id, token);
      } catch {
        /* ignore */
      }
    }
    const newTable = pricingTable.filter((_, i) => i !== index);
    handlePricingTableChange(newTable);
  };

  const getDiscountAmount = (baseTotal) => {
    const value = Number(discountValue) || 0;
    if (discountType === "Percentage") return (baseTotal * value) / 100;
    return value;
  };

  const handleAddPredefinedNote = (note) => {
    const currentNotes = sections["notes_selection"] || [];
    if (!currentNotes.find((n) => n.id === note.id)) {
      handleSectionChange("notes_selection", [
        ...currentNotes,
        { id: note.id, note_name: note.note_text, type: "predefined" },
      ]);
    }
  };

  const handleAddManualNote = () => {
    const currentNotes = sections["notes_selection"] || [];
    if (manualNote.trim() !== "") {
      handleSectionChange("notes_selection", [
        ...currentNotes,
        { id: Date.now(), note_name: manualNote, type: "manual" },
      ]);
      setManualNote("");
    }
  };

  const removeNote = (index) => {
    const currentNotes = sections["notes_selection"] || [];
    handleSectionChange("notes_selection", currentNotes.filter((_, i) => i !== index));
  };

  const saveProposalAction = async (generatePdf = false) => {
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
        ...(billingType === "custom"
          ? {
              billing_start_date: billingStartDate || null,
              billing_end_date: billingEndDate || null,
            }
          : {}),
        sections_json: sectionsForSave,
        optional_toggles: toggles,
        pricing_table_json: pricingTable,
        grand_total_excl_gst: finalTotal,
        terms_notes_json: [],
        notes_json: sections["notes_selection"] || [],
        additional_remarks: sections["additional_remarks"] || "",
        client_instructions: sections["client_instructions"] || "",
        created_by: currentUser?.name || "Admin",
        updated_by: currentUser?.name || "Admin",
      };

      let res;
      if (proposalId) {
        payload.txn_id = proposalTxnId;
        res = await apiSaveProposal(proposalId, payload, token);
      } else {
        const newTxnId = Date.now().toString();
        payload.txn_id = newTxnId;
        setProposalTxnId(newTxnId);
        res = await apiSaveProposal(null, payload, token);
      }

      if (res.data.status === "Success") {
        Swal.fire({
          icon: "success",
          title: "Saved!",
          text: "Proposal saved successfully.",
          timer: 1500,
          showConfirmButton: false,
        });

        const draftKey = `proposal_draft_${clientId}_${proposalId}`;
        localStorage.removeItem(draftKey);

        const savedId = proposalId || res.data.proposalId;

        if (!proposalId) {
          navigate(`${basePath}/proposal-builder/${clientId}/${savedId}`, { replace: true });
        }

        if (generatePdf) {
          downloadPdfAction(savedId);
        }
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to save proposal." });
    } finally {
      setLoading(false);
    }
  };

  const downloadPdfAction = async (idToDownload = proposalId) => {
    if (!idToDownload) return;
    try {
      setLoading(true);
      const res = await generateProposalPdf(idToDownload, token);

      if (res.status === "Success" && res.html) {
        const printWindow = window.open("", "_blank");
        printWindow.document.open();
        printWindow.document.write(res.html);
        printWindow.document.close();

        const titleMatch = res.html.match(/<title>(.*?)<\/title>/i);
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

  const sendToClientAction = async () => {
    if (!proposalId) {
      Swal.fire({ icon: "warning", title: "Unsaved", text: "Please save the proposal first before sending." });
      return;
    }
    setShowSendModal(true);
  };

  const executeSendAction = async () => {
    try {
      setSending(true);
      const res = await apiSendProposal(proposalId, sendChannel, token);

      if (res.status === "Success") {
        setShowSendModal(false);
        Swal.fire({
          icon: "success",
          title: "Sent!",
          text: `Proposal successfully sent via ${sendChannel}.`,
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to send proposal to client." });
    } finally {
      setSending(false);
    }
  };

  const markAsApprovedAction = async () => {
    if (!proposalId) return;
    try {
      const confirm = await Swal.fire({
        title: "Approve Proposal?",
        text: "Are you sure you want to manually mark this proposal as approved?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, Approve",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#10b981",
      });

      if (!confirm.isConfirmed) return;

      setLoading(true);
      const res = await updateProposalStatus(proposalId, "approved", token);

      if (res.status === "Success") {
        Swal.fire({ icon: "success", title: "Approved!", text: "Proposal has been marked as approved manually." });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to mark as approved." });
    } finally {
      setLoading(false);
    }
  };

  const isReadOnly = ["invoiced", "payment_received", "partially_paid"].includes(proposalStatus);

  return {
    clientId,
    proposalId,
    navigate,
    isAdmin,
    basePath,
    loading,
    clientData,
    proposalType,
    setProposalType,
    billingType,
    setBillingType,
    billingStartDate,
    setBillingStartDate,
    billingEndDate,
    setBillingEndDate,
    sections,
    handleSectionChange,
    toggles,
    setToggles,
    openSections,
    toggleSection,
    pricingTable,
    pricingMode,
    setPricingMode,
    searchQuery,
    setSearchQuery,
    dropdownOpen,
    setDropdownOpen,
    filteredPlans,
    handlePlanSelect,
    activeCalculator,
    setActiveCalculator,
    handleServiceAdded,
    handleServiceDeleted,
    removePricingRow,
    milestones,
    addMilestoneRow,
    removeMilestoneRow,
    handleMilestoneChange,
    predefinedNotes,
    handleAddPredefinedNote,
    manualNote,
    setManualNote,
    handleAddManualNote,
    removeNote,
    discountType,
    discountValue,
    discountSettings,
    showDiscountModal,
    setShowDiscountModal,
    formDataDis,
    openDiscountModal,
    handleApplyDiscount,
    handleChangeDis,
    showSendModal,
    setShowSendModal,
    sendChannel,
    setSendChannel,
    sending,
    isReadOnly,
    saveProposal: saveProposalAction,
    downloadPdf: downloadPdfAction,
    sendToClient: sendToClientAction,
    executeSend: executeSendAction,
    markAsApproved: markAsApprovedAction,
    getBillableTotals,
    getDiscountAmount,
  };
}
