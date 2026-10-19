import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { ChevronDown, CalendarDays, FilePlus2, X, Hash, Building2, Phone, CreditCard, Loader2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTheme } from "../../../context/ThemeContext";
import API_BASE_URL from "../../../config/apiBaseUrl";
import { classifyProformaServices, calcAdsRowTotal } from "../../../utils/proformaPricing";

const EMPTY_ARRAY = [];

const GenerateProformaModal = ({
  isOpen,
  onClose,
  clientData,
  proposalsList = EMPTY_ARRAY,
  initialSelectedProposalId = null,
  selectedTxn = null,
  txnPreviewData = EMPTY_ARRAY, // Optional preview data for Txn
  handleCreateInvoiceForTxn = null
}) => {
  const baseURL = API_BASE_URL;
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { currentUser, token } = useSelector((state) => state.user);
  const userName = currentUser?.name;

  const [formData, setFormData] = useState({
    client_name: clientData?.client_name || "",
    client_organization: clientData?.client_organization || "",
    email: clientData?.email || "",
    phone: clientData?.phone || "",
    address: clientData?.address || "",
    dg_employee: userName,
    duration_start_date: "",
    duration_end_date: "",
    assigned_team: "",
    payment_mode: "",
    client_gst_no: "",
    client_pan_no: "",
    bill_type: "NON_GST",
  });

  const [availableTeams, setAvailableTeams] = useState([]);

  const [selectedProposalForProforma, setSelectedProposalForProforma] = useState(null);
  const [quotationServicesPreview, setQuotationServicesPreview] = useState([]);
  const [quotationPreviewLoading, setQuotationPreviewLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mobileTableView, setMobileTableView] = useState("cards");
  const [previousBalance, setPreviousBalance] = useState({
    totalPending: 0,
    include: true,
    customAmount: "",
    pendingProformas: [],
    loading: false,
  });

  const fetchPreviousBalance = async (clientId) => {
    if (!clientId) return;
    try {
      setPreviousBalance((prev) => ({ ...prev, loading: true }));
      const res = await axios.get(
        `${baseURL}/auth/api/re_calculator/client-previous-balance/${clientId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.data.status === "Success" && res.data.data) {
        const { totalPending, pendingProformas } = res.data.data;
        const tot = Number(totalPending || 0);
        setPreviousBalance({
          totalPending: tot,
          include: tot > 0,
          customAmount: tot > 0 ? String(tot) : "",
          pendingProformas: pendingProformas || [],
          loading: false,
        });
      } else {
        setPreviousBalance((prev) => ({ ...prev, loading: false }));
      }
    } catch (e) {
      console.error("Error fetching previous balance:", e);
      setPreviousBalance((prev) => ({ ...prev, loading: false }));
    }
  };

  const qtStartRef = useRef(null);
  const qtEndRef = useRef(null);

  const openDatePicker = (ref) => {
    if (ref.current && ref.current.showPicker) {
      ref.current.showPicker();
    }
  };

  const getServiceDisplayName = (serviceName) => {
    if (!serviceName) return "";
    return serviceName.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getCategoryDisplay = (svc) => {
    const isServiceCharge = (svc.service_name || "").toLowerCase() === "service charge" || (svc.service_name || "").toLowerCase() === "ads service charge";
    if (isServiceCharge) {
      return getServiceDisplayName(
        (svc.editing_type_name && svc.editing_type_name.toLowerCase() === "proposal item")
          ? (svc.service || svc.category_name || svc.editing_type_name)
          : (svc.editing_type_name || svc.category_name || "N/A")
      );
    }
    const cat = svc.category_name && svc.category_name !== "N/A" ? svc.category_name : "";
    const type =
      svc.editing_type_name &&
      svc.editing_type_name !== "N/A" &&
      svc.editing_type_name !== "null" &&
      svc.editing_type_name !== "undefined" &&
      svc.editing_type_name.trim() !== "" &&
      svc.editing_type_name.toLowerCase() !== "proposal item"
        ? svc.editing_type_name.trim()
        : "";

    if (
      cat &&
      type &&
      cat.trim().toLowerCase() !== type.toLowerCase() &&
      type.toLowerCase() !== (svc.service_name || "").trim().toLowerCase()
    ) {
      return `${cat} (${type})`;
    }
    return cat || type || "N/A";
  };

  const getAddons = (svc, defaultQty) => {
    let addons = [];
    if (svc.additional_services) {
      try {
        addons = typeof svc.additional_services === 'string'
          ? JSON.parse(svc.additional_services)
          : svc.additional_services;
        if (!Array.isArray(addons)) addons = [];
      } catch {
        addons = [];
      }
    }
    return addons.map((ad) => {
      const amount = Number(ad.amount || ad.unit_price || 0);
      const quantity = Number(ad.quantity) || defaultQty;
      return {
        name: ad.name || ad.additional_service_name || "Additional Service",
        amount,
        quantity,
        total: amount * quantity
      };
    });
  };

  const getCompServiceName = (svc) => {
    return getServiceDisplayName(
      String((svc.service_name && svc.service_name.toLowerCase() === "proposal item")
        ? (svc.category_name || svc.service_name)
        : (svc.service_name || svc.category_name || "N/A")
      ).replace(/\s*\((complimentary|complimntory)\)\s*$/i, "").trim()
    );
  };

  const getCompEditingName = (svc) => {
    return String(
      (svc.editing_type_name && svc.editing_type_name.toLowerCase() === "proposal item")
        ? (svc.service || svc.category_name || svc.editing_type_name)
        : (svc.editing_type_name || svc.service_type || "N/A")
    ).replace(/\s*\((complimentary|complimntory)\)\s*$/i, "").trim();
  };

  const isInitialized = useRef(false);

  useEffect(() => {
    if (isOpen) {
      if (!isInitialized.current) {
        isInitialized.current = true;
        setFormData({
          client_name: clientData?.client_name || "",
          client_organization: clientData?.client_organization || "",
          email: clientData?.email || "",
          phone: clientData?.phone || "",
          address: clientData?.address || "",
          dg_employee: userName,
          duration_start_date: "",
          duration_end_date: "",
          assigned_team: "",
          payment_mode: "",
          client_gst_no: "",
          client_pan_no: "",
          bill_type: "NON_GST",
        });
        setQuotationServicesPreview([]);

        // Load available teams for reminder assignment
        axios
          .get(`${baseURL}/auth/api/re_calculator/reminder-settings/teams`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) => {
            if (res.data?.status === "Success") {
              setAvailableTeams(res.data.data || []);
            }
          })
          .catch(() => {});

        const effectiveCid = clientData?.id || clientData?.client_id || (proposalsList[0] && proposalsList[0].client_id);
        if (effectiveCid) {
          fetchPreviousBalance(effectiveCid);
        }

        if (initialSelectedProposalId) {
          const prop = proposalsList.find((p) => String(p.id) === String(initialSelectedProposalId));
          if (prop) {
            handleCreateProformaFromProposal(prop);
          } else {
            axios.get(`${baseURL}/auth/api/re_calculator/proposal/${initialSelectedProposalId}`, {
              headers: { Authorization: `Bearer ${token}` }
            }).then(res => {
              if (res.data.status === "Success" && res.data.data) {
                handleCreateProformaFromProposal(res.data.data);
              }
            }).catch(err => console.error("Failed to load initial proposal:", err));
          }
        } else if (selectedTxn) {
          setQuotationServicesPreview(txnPreviewData);
        } else if (proposalsList.length > 0) {
          handleCreateProformaFromProposal(proposalsList[0]);
        }
      }
    } else {
      isInitialized.current = false;
    }
  }, [isOpen, initialSelectedProposalId, proposalsList, clientData, selectedTxn, userName, txnPreviewData]);

  const handleCreateProformaFromProposal = (proposal) => {
    setSelectedProposalForProforma(proposal);
    setQuotationPreviewLoading(false);

    if (proposal) {
      setFormData(prev => ({
        ...prev,
        client_name: prev.client_name || proposal.client_name || "",
        client_organization: prev.client_organization || proposal.client_organization || "",
        email: prev.email || proposal.email || "",
        phone: prev.phone || proposal.phone || "",
        address: prev.address || proposal.address || "",
      }));

      const cid = proposal.client_id || clientData?.id || clientData?.client_id;
      if (cid) {
        fetchPreviousBalance(cid);
      }
    }

    let previewData = [];
    try {
      const parsed = JSON.parse(proposal.pricing_table_json || "[]");
      const { dmServices, adsServices } = classifyProformaServices(parsed);
      const compServices = parsed.filter(item => item.source === 'custom_complimentary' || item.service_name?.toLowerCase() === 'complimentary').map(item => ({
        ...item,
        is_complimentary: true,
        service_type: item.service_type || "Complimentary",
        editing_type_amount: (item.editing_type_amount && Number(item.editing_type_amount) > 0)
          ? Number(item.editing_type_amount)
          : (item.price && Number(item.price) > 0
            ? Number(item.price)
            : (item.amount && Number(item.amount) > 0
              ? Number(item.amount)
              : (item.unit_price || 0))),
        total_amount: item.total_price || item.total_amount
      }));
      previewData = [...dmServices, ...adsServices, ...compServices];
    } catch (e) {
      console.error("Failed to parse proposal.pricing_table_json", e);
    }
    setQuotationServicesPreview(previewData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (selectedProposalForProforma) {
      try {
        const parsed = JSON.parse(selectedProposalForProforma.pricing_table_json || "[]");
        const { dmServices, adsServices } = classifyProformaServices(parsed);

        const dmTotal = dmServices.reduce((sum, svc) => {
          const qty = Number(svc.quantity || 1);
          const basePrice = Number(svc.editing_type_amount || svc.amount || 0);
          const cp = Number(svc.include_content_posting || 0);
          const th = Number(svc.include_thumbnail_creation || 0);
          const yt = Number(svc.include_youtube_video_posting || 0);
          let addons = [];
          if (svc.additional_services) {
            try {
              addons = typeof svc.additional_services === 'string'
                ? JSON.parse(svc.additional_services)
                : svc.additional_services;
              if (!Array.isArray(addons)) addons = [];
            } catch {
              addons = [];
            }
          }
          const addonsTotal = addons.reduce((s, a) => s + ((Number(a.amount || a.unit_price) || 0) * (Number(a.quantity) || qty)), 0);
          return sum + (basePrice * qty) + (cp * qty) + (th * qty) + (yt * qty) + addonsTotal;
        }, 0);

        const adsTotal = adsServices.reduce((sum, svc) => sum + calcAdsRowTotal(svc, true), 0);

        let discountAmt = 0;
        try {
          const sectionsData = typeof selectedProposalForProforma.sections_json === 'string'
            ? JSON.parse(selectedProposalForProforma.sections_json)
            : selectedProposalForProforma.sections_json;
          const pd = sectionsData?.pricing_discount;
          if (pd && Number(pd.value) > 0) {
            if (pd.type === 'Percentage') {
              discountAmt = (dmTotal * Number(pd.value)) / 100;
            } else {
              discountAmt = Number(pd.value);
            }
          }
        } catch (e) {
          console.log(e.message);
        }

        const isGST = formData.bill_type === "GST";
        const prevBalToApply = previousBalance.include ? Number(previousBalance.customAmount || 0) : 0;
        const dmTotalAfterDiscount = Math.max(0, dmTotal - discountAmt);
        const dmGstAmount = isGST ? dmTotalAfterDiscount * 0.18 : 0;

        const adsTotalBudget = adsServices.reduce((sum, svc) => sum + Number(svc.budget || svc.amount || 0), 0);
        const adsGstAmount = 0;

        const finalBaseAmount = dmTotalAfterDiscount + adsTotalBudget;
        const finalGstAmount = dmGstAmount + adsGstAmount;
        const finalTotalAmount = finalBaseAmount + finalGstAmount + prevBalToApply;

        const payload = {
          proposal_id: selectedProposalForProforma.id,
          client_id: selectedProposalForProforma.client_id,
          base_amount: finalBaseAmount,
          gst_amount: finalGstAmount,
          total_amount: finalTotalAmount,
          is_gst: isGST ? 1 : 0,
          gst_rate: 18,
          duration_start_date: formData.duration_start_date,
          duration_end_date: formData.duration_end_date,
          assigned_team: formData.assigned_team || null,
          previous_balance_amount: prevBalToApply,
        };
        const res = await axios.post(`${baseURL}/auth/api/re_calculator/proforma`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.status === "Success") {
          Swal.fire({ icon: "success", title: "Saved!", text: "Proforma Generated Successfully", timer: 1500, showConfirmButton: false });
          onClose();
          navigate(`/admin/quotation/${selectedProposalForProforma.client_id}/${res.data.proformaId}?doc=proforma&source=proposal&gst=${formData.bill_type === "GST" ? 1 : 0}`);
        }
      } catch (err) {
        Swal.fire({ icon: "error", title: "Error", text: "Failed to create proforma." });
      }
      setLoading(false);
      return;
    }

    if (handleCreateInvoiceForTxn) {
      await handleCreateInvoiceForTxn(formData, selectedTxn);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  const currentClientName = clientData?.client_name || selectedProposalForProforma?.client_name || "Unknown Client";
  const currentClientOrg = clientData?.client_organization || "";
  const currentClientPhone = clientData?.phone || "";

  return createPortal(
    <>
      <style>{ `
        .ci-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(12px);
          animation: fadeIn 0.2s ease both;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .ci-modal-card {
          position: relative;
          width: 100%;
          max-width: 980px;
          background: #0a0b14;
          border: 1px solid rgba(99,102,241,0.25);
          border-radius: 24px;
          overflow: hidden;
          max-height: 92vh;
          box-shadow: 0 40px 100px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04);
          animation: fadeUp 0.3s ease both;
        }
        [data-theme="light"] .ci-modal-card {
          background: #ffffff;
          border-color: rgba(99,102,241,0.15);
          box-shadow: 0 40px 100px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05);
        }

        .ci-modal-header {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(99,102,241,0.05);
        }
        [data-theme="light"] .ci-modal-header {
          border-bottom-color: rgba(0,0,0,0.08);
          background: rgba(99,102,241,0.02);
        }

        .ci-header-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(99,102,241,0.15);
          border: 1px solid rgba(99,102,241,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        [data-theme="light"] .ci-header-icon-wrap {
          background: rgba(99,102,241,0.08);
          border-color: rgba(99,102,241,0.15);
        }

        .ci-modal-title {
          font-size: 16px;
          font-weight: 700;
          color: #ffffff;
        }
        [data-theme="light"] .ci-modal-title {
          color: #1e1b4b;
        }

        .ci-modal-subtitle {
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          margin-top: 2px;
        }
        [data-theme="light"] .ci-modal-subtitle {
          color: rgba(0,0,0,0.5);
        }

        .ci-client-highlight { color: #a5b4fc; }
        [data-theme="light"] .ci-client-highlight { color: #4f46e5; }

        .ci-close-btn {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          padding: 6px;
          color: rgba(255,255,255,0.4);
          cursor: pointer;
          display: flex;
          transition: all 0.2s;
        }
        .ci-close-btn:hover {
          background: rgba(255,255,255,0.08);
          color: #fff;
        }
        [data-theme="light"] .ci-close-btn {
          background: rgba(0,0,0,0.03);
          border-color: rgba(0,0,0,0.08);
          color: rgba(0,0,0,0.5);
        }
        [data-theme="light"] .ci-close-btn:hover {
          background: rgba(0,0,0,0.06);
          color: #000;
        }

        .ci-meta-bar {
          padding: 12px 24px;
          background: rgba(52,211,153,0.05);
          border-bottom: 1px solid rgba(52,211,153,0.1);
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        [data-theme="light"] .ci-meta-bar {
          background: rgba(52,211,153,0.03);
          border-bottom-color: rgba(52,211,153,0.08);
        }

        .ci-meta-label {
          color: rgba(255,255,255,0.35);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          font-size: 10px;
        }
        [data-theme="light"] .ci-meta-label {
          color: rgba(0,0,0,0.5);
        }

        .ci-meta-val {
          color: rgba(255,255,255,0.45);
        }
        [data-theme="light"] .ci-meta-val {
          color: #374151;
        }

        .ci-form-body {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: 78vh;
          overflow-y: auto;
        }

        .ci-scroll::-webkit-scrollbar { width: 4px; }
        .ci-scroll::-webkit-scrollbar-track { background: transparent; }
        .ci-scroll::-webkit-scrollbar-thumb { background: rgba(184,150,46,0.2); border-radius: 99px; }
        .ci-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 640px) { .ci-grid-2 { grid-template-columns: 1fr; } }
        
        .ci-label { display: block; font-size: 10.5px; font-weight: 700; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
        [data-theme="light"] .ci-label { color: #4b5563; }

        .ci-label-optional { font-size: 10px; color: rgba(255,255,255,0.2); font-weight: 400; text-transform: none; }
        [data-theme="light"] .ci-label-optional { color: rgba(0,0,0,0.4); }

        .ci-input { width: 100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 10px 14px; color: #e8e8f0; font-size: 13px; outline: none; transition: all 0.2s; }
        [data-theme="light"] .ci-input { background: #ffffff; border: 1px solid rgba(0,0,0,0.15); color: #111827; }

        .ci-input::placeholder { color: rgba(255,255,255,0.18); }
        [data-theme="light"] .ci-input::placeholder { color: rgba(0,0,0,0.4); }

        .ci-input:focus { border-color: rgba(184,150,46,0.45); background: rgba(184,150,46,0.04); }
        [data-theme="light"] .ci-input:focus { border-color: #d4a940; background: rgba(212,169,64,0.04); }

        .ci-input option { background: #0d0e1a; color: #e8e8f0; }
        [data-theme="light"] .ci-input option { background: #ffffff; color: #111827; }

        .ci-input-icon { position: relative; }
        .ci-input-icon .icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.2); width: 16px; height: 16px; }
        [data-theme="light"] .ci-input-icon .icon { color: rgba(0,0,0,0.4); }

        .ci-input-icon .ci-input { padding-left: 36px; }
        .ci-input-icon .chevron { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); width: 14px; height: 14px; color: rgba(255,255,255,0.2); pointer-events: none; }
        [data-theme="light"] .ci-input-icon .chevron { color: rgba(0,0,0,0.4); }

        select.ci-input { appearance: none; padding-right: 36px; cursor: pointer; }
        
        .ci-date-btn { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.04); border: none; color: rgba(255,255,255,0.3); border-radius: 6px; padding: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .ci-date-btn:hover { background: rgba(184,150,46,0.2); color: #d4a940; }
        [data-theme="light"] .ci-date-btn { background: rgba(0,0,0,0.03); color: rgba(0,0,0,0.5); }
        [data-theme="light"] .ci-date-btn:hover { background: rgba(212,169,64,0.15); color: #b8922c; }

        .ci-date-input::-webkit-calendar-picker-indicator { opacity: 0; display: none; -webkit-appearance: none; }
        .ci-btn-primary { display: inline-flex; align-items: center; gap: 6px; padding: 10px 22px; border-radius: 12px; border: none; font-size: 13px; font-weight: 700; color: #0d0e1a; cursor: pointer; transition: all 0.2s; background: linear-gradient(135deg, #c9a83a 0%, #d4a940 45%, #b8922c 100%); }
        .ci-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 30px rgba(184,150,46,0.25); }
        .ci-btn-primary:active { transform: translateY(1px); }
        .ci-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
        
        .ci-btn-secondary { display: inline-flex; align-items: center; gap: 6px; padding: 10px 22px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.6); cursor: pointer; transition: all 0.2s; background: rgba(255,255,255,0.04); }
        .ci-btn-secondary:hover { background: rgba(255,255,255,0.08); color: #fff; border-color: rgba(255,255,255,0.14); }
        [data-theme="light"] .ci-btn-secondary { border: 1px solid rgba(0,0,0,0.1); color: #374151; background: rgba(0,0,0,0.02); }
        [data-theme="light"] .ci-btn-secondary:hover { background: rgba(0,0,0,0.05); color: #111827; border-color: rgba(0,0,0,0.15); }

        .ci-table-container { border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; overflow: hidden; background: rgba(255,255,255,0.02); }
        [data-theme="light"] .ci-table-container { border-color: rgba(0,0,0,0.08); background: rgba(0,0,0,0.01); }
        
        .ci-table { width: 100%; border-collapse: collapse; min-width: 520px; }
        .ci-table-ads { width: 100%; border-collapse: collapse; min-width: 280px; }
        .ci-table-comp { width: 100%; border-collapse: collapse; min-width: 500px; }

        .ci-table thead th, .ci-table-ads thead th, .ci-table-comp thead th {
          position: sticky;
          top: 0;
          z-index: 2;
        }

        .ci-th-dm { background: #18192a; }
        [data-theme="light"] .ci-th-dm { background: #eef2ff; }
        .ci-th-ads { background: #1e192a; }
        [data-theme="light"] .ci-th-ads { background: #faf5ff; }
        .ci-th-comp { background: #15221d; }
        [data-theme="light"] .ci-th-comp { background: #f0fdf4; }

        .ci-th-cell, .ci-th-cell-right { text-align: left; padding: 9px 12px; font-size: 11px; font-weight: 700; border-bottom: 1px solid rgba(255,255,255,0.08); color: #c7d2fe; white-space: nowrap; }
        .ci-th-cell-right { text-align: right; }
        [data-theme="light"] .ci-th-cell, [data-theme="light"] .ci-th-cell-right { border-bottom-color: rgba(0,0,0,0.08); color: #4f46e5; }

        .ci-td-cell, .ci-td-cell-right { padding: 8px 12px; font-size: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); color: rgba(255,255,255,0.85); }
        .ci-td-cell-right { text-align: right; color: #e8e8f0; white-space: nowrap; font-variant-numeric: tabular-nums; }
        [data-theme="light"] .ci-td-cell { border-bottom-color: rgba(0,0,0,0.04); color: #374151; }
        [data-theme="light"] .ci-td-cell-right { border-bottom-color: rgba(0,0,0,0.04); color: #111827; }

        .ci-tr-subrow { background: rgba(255,255,255,0.01); }
        [data-theme="light"] .ci-tr-subrow { background: rgba(0,0,0,0.015); }

        .ci-tfoot-dm { background: rgba(99,102,241,0.08); }
        [data-theme="light"] .ci-tfoot-dm { background: rgba(99,102,241,0.04); }
        .ci-tfoot-ads { background: rgba(168,85,247,0.08); }
        [data-theme="light"] .ci-tfoot-ads { background: rgba(168,85,247,0.04); }
        .ci-tfoot-comp-row { background: rgba(34,197,94,0.08); }
        [data-theme="light"] .ci-tfoot-comp-row { background: rgba(34,197,94,0.04); }

        .ci-footer-label { color: #c7d2fe; border-top: 1px solid rgba(99,102,241,0.2); white-space: nowrap; }
        [data-theme="light"] .ci-footer-label { color: #312e81; border-top-color: rgba(99,102,241,0.15); }
        .ci-footer-value { color: #f0f5ff; border-top: 1px solid rgba(99,102,241,0.2); white-space: nowrap; font-variant-numeric: tabular-nums; }
        [data-theme="light"] .ci-footer-value { color: #111827; border-top-color: rgba(99,102,241,0.15); }

        .ci-footer-ads-label { color: #d8b4fe; border-top: 1px solid rgba(168,85,247,0.2); white-space: nowrap; }
        [data-theme="light"] .ci-footer-ads-label { color: #581c87; border-top-color: rgba(168,85,247,0.15); }
        .ci-footer-ads-value { color: #f0f5ff; border-top: 1px solid rgba(168,85,247,0.2); white-space: nowrap; font-variant-numeric: tabular-nums; }
        [data-theme="light"] .ci-footer-ads-value { color: #111827; border-top-color: rgba(168,85,247,0.15); }

        .ci-footer-comp-label { color: #86efac; border-top: 1px solid rgba(34,197,94,0.2); white-space: nowrap; }
        [data-theme="light"] .ci-footer-comp-label { color: #15803d; border-top-color: rgba(34,197,94,0.15); }
        .ci-footer-comp-value { color: #f0f5ff; border-top: 1px solid rgba(34,197,94,0.2); white-space: nowrap; font-variant-numeric: tabular-nums; }
        [data-theme="light"] .ci-footer-comp-value { color: #111827; border-top-color: rgba(34,197,94,0.15); }

        .ci-comp-border-top { border-top: 1px solid rgba(255,255,255,0.08); white-space: nowrap; }
        [data-theme="light"] .ci-comp-border-top { border-top-color: rgba(0,0,0,0.08); }

        .ci-text-orange { color: #f97316; }
        .font-medium { font-weight: 500; }
        .font-semibold { font-weight: 600; }
        .font-bold { font-weight: 700; }

        .ci-empty-text { text-align: center; color: rgba(255,255,255,0.5); padding: 1rem 0; }
        [data-theme="light"] .ci-empty-text { color: rgba(0,0,0,0.45); }

        /* Mobile Toggle Switch */
        .ci-mobile-toggle-wrap {
          display: none;
          align-items: center;
          gap: 3px;
          background: rgba(255, 255, 255, 0.04);
          padding: 2px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        [data-theme="light"] .ci-mobile-toggle-wrap {
          background: rgba(0, 0, 0, 0.03);
          border-color: rgba(0, 0, 0, 0.08);
        }
        @media (max-width: 640px) {
          .ci-mobile-toggle-wrap {
            display: inline-flex;
          }
        }
        .ci-toggle-btn {
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.45);
          font-size: 11px;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        [data-theme="light"] .ci-toggle-btn {
          color: rgba(0, 0, 0, 0.5);
        }
        .ci-toggle-btn.active {
          background: rgba(184, 150, 46, 0.25);
          color: #d4a940;
          font-weight: 700;
        }
        [data-theme="light"] .ci-toggle-btn.active {
          background: #fef3c7;
          color: #b45309;
        }

        /* Mobile Card Layout */
        .ci-mobile-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 10px 12px;
        }
        [data-theme="light"] .ci-mobile-card {
          background: #f8fafc;
          border-color: rgba(0, 0, 0, 0.08);
        }

        .ci-mobile-card-title {
          font-size: 12px;
          font-weight: 700;
          color: #f97316;
          padding-bottom: 6px;
          margin-bottom: 6px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        [data-theme="light"] .ci-mobile-card-title {
          border-bottom-color: rgba(0, 0, 0, 0.06);
        }

        .ci-mobile-card-item {
          padding: 4px 0;
        }
        .ci-mobile-card-item + .ci-mobile-card-item {
          border-top: 1px dashed rgba(255, 255, 255, 0.06);
          margin-top: 6px;
          padding-top: 6px;
        }
        [data-theme="light"] .ci-mobile-card-item + .ci-mobile-card-item {
          border-top-color: rgba(0, 0, 0, 0.06);
        }

        .ci-mobile-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .ci-mobile-cat {
          font-size: 12px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.85);
          word-break: break-word;
        }
        [data-theme="light"] .ci-mobile-cat {
          color: #1f2937;
        }

        .ci-mobile-price {
          font-size: 12px;
          font-weight: 700;
          color: #f3f4f6;
          white-space: nowrap;
        }
        [data-theme="light"] .ci-mobile-price {
          color: #111827;
        }

        .ci-mobile-subinfo {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.45);
          margin-top: 3px;
        }
        [data-theme="light"] .ci-mobile-subinfo {
          color: #6b7280;
        }
        .ci-mobile-subinfo strong {
          color: rgba(255, 255, 255, 0.75);
        }
        [data-theme="light"] .ci-mobile-subinfo strong {
          color: #374151;
        }

        .ci-mobile-subrow {
          margin-top: 5px;
          padding: 4px 8px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
          border-left: 2px solid rgba(99, 102, 241, 0.4);
        }
        [data-theme="light"] .ci-mobile-subrow {
          background: rgba(0, 0, 0, 0.02);
          border-left-color: rgba(99, 102, 241, 0.6);
        }

        .ci-mobile-subname {
          font-size: 11px;
          color: #c7d2fe;
          font-weight: 500;
        }
        [data-theme="light"] .ci-mobile-subname {
          color: #4338ca;
        }

        .ci-free-badge {
          display: inline-flex;
          align-items: center;
          padding: 2px 7px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 700;
          background: rgba(34, 197, 94, 0.15);
          color: #4ade80;
          border: 1px solid rgba(34, 197, 94, 0.3);
          letter-spacing: 0.04em;
        }
        [data-theme="light"] .ci-free-badge {
          background: #dcfce7;
          color: #15803d;
          border-color: #86efac;
        }

        .ci-mobile-total-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 9px 12px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
        }

        .ci-mobile-total-dm {
          background: rgba(99, 102, 241, 0.12);
          border: 1px solid rgba(99, 102, 241, 0.25);
          color: #c7d2fe;
        }
        [data-theme="light"] .ci-mobile-total-dm {
          background: #eef2ff;
          border-color: #c7d2fe;
          color: #3730a3;
        }

        .ci-mobile-total-ads {
          background: rgba(168, 85, 247, 0.12);
          border: 1px solid rgba(168, 85, 247, 0.25);
          color: #e9d5ff;
        }
        [data-theme="light"] .ci-mobile-total-ads {
          background: #faf5ff;
          border-color: #e9d5ff;
          color: #6b21a8;
        }

        .ci-mobile-total-comp {
          background: rgba(34, 197, 94, 0.12);
          border: 1px solid rgba(34, 197, 94, 0.25);
          color: #86efac;
        }
        [data-theme="light"] .ci-mobile-total-comp {
          background: #f0fdf4;
          border-color: #bbf7d0;
          color: #166534;
        }

        .ci-table-scroll-hint {
          display: none;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.4);
          text-align: right;
          margin-bottom: 4px;
        }
        [data-theme="light"] .ci-table-scroll-hint {
          color: rgba(0, 0, 0, 0.4);
        }
        @media (max-width: 640px) {
          .ci-table-scroll-hint {
            display: block;
          }
        }

        .ci-summary-sub { font-size: 12px; color: #93c5fd; margin-bottom: 2px; }
        [data-theme="light"] .ci-summary-sub { color: #1d4ed8; }
        .ci-summary-disc { font-size: 12px; color: #f87171; margin-bottom: 2px; }
        [data-theme="light"] .ci-summary-disc { color: #dc2626; }
        .ci-summary-taxable, .ci-summary-gst, .ci-summary-sub-gst, .ci-summary-ads { font-size: 12px; color: #c7d2fe; margin-bottom: 2px; }
        [data-theme="light"] .ci-summary-taxable, [data-theme="light"] .ci-summary-gst, [data-theme="light"] .ci-summary-sub-gst, [data-theme="light"] .ci-summary-ads { color: #374151; }
        .ci-summary-grand { font-size: 14px; font-weight: 700; color: #c7d2fe; }
        [data-theme="light"] .ci-summary-grand { color: #111827; }

        .ci-modal-footer { display: flex; gap: 10px; justify-content: flex-end; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.05); margin-top: 4px; }
        [data-theme="light"] .ci-modal-footer { border-top-color: rgba(0,0,0,0.08); }

        @media (max-width: 640px) {
          .ci-modal-overlay {
            padding: 0.5rem;
          }
          .ci-modal-card {
            max-height: 95vh;
            border-radius: 16px;
          }
          .ci-modal-header {
            padding: 0.875rem 1rem;
          }
          .ci-modal-title {
            font-size: 15px;
          }
          .ci-meta-bar {
            padding: 8px 12px;
            gap: 8px 12px;
          }
          .ci-form-body {
            padding: 1rem 0.75rem;
            max-height: 80vh;
            gap: 12px;
          }
          .ci-grid-2 {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          .ci-modal-footer {
            flex-direction: column-reverse;
            gap: 8px;
          }
          .ci-modal-footer button {
            width: 100%;
            justify-content: center;
          }
        }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div
        className="ci-modal-overlay"
        onClick={ onClose }
      >
        <div
          className="ci-modal-card"
          onClick={ (e) => e.stopPropagation() }
        >
          <div className="ci-modal-header">
            <div style={ { display: "flex", alignItems: "center", gap: 12 } }>
              <div className="ci-header-icon-wrap">
                <FilePlus2 size={ 18 } style={ { color: "#a5b4fc" } } />
              </div>
              <div>
                <div className="ci-modal-title">Generate Proforma Invoice</div>
                <div className="ci-modal-subtitle">
                  For:{ " " }
                  <span className="ci-client-highlight" style={ { fontWeight: 600 } }>
                    { currentClientName }
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={ onClose }
              className="ci-close-btn"
            >
              <X size={ 18 } />
            </button>
          </div>

          <div className="ci-meta-bar">
            <div style={ { display: "flex", alignItems: "center", gap: 6, fontSize: 12 } }>
              <Hash size={ 12 } style={ { color: "rgba(52,211,153,0.6)" } } />
              <span className="ci-meta-label">
                { selectedProposalForProforma ? 'PROPOSAL:' : 'TXN:' }
              </span>
              <span
                style={ {
                  color: "#6ee7b7",
                  fontFamily: "monospace",
                  fontWeight: 700,
                  fontSize: 11,
                } }
              >
                { selectedProposalForProforma ? `PRP-${selectedProposalForProforma.id}` : selectedTxn }
              </span>
            </div>
            { currentClientOrg && (
              <div style={ { display: "flex", alignItems: "center", gap: 6, fontSize: 12 } }>
                <Building2 size={ 12 } style={ { color: "rgba(184,150,46,0.5)" } } />
                <span className="ci-meta-val">
                  { currentClientOrg }
                </span>
              </div>
            ) }
            { currentClientPhone && (
              <div style={ { display: "flex", alignItems: "center", gap: 6, fontSize: 12 } }>
                <Phone size={ 12 } style={ { color: "rgba(184,150,46,0.5)" } } />
                <span className="ci-meta-val">{ currentClientPhone }</span>
              </div>
            ) }
          </div>

          <form
            onSubmit={ handleCreateInvoice }
            className="ci-form-body ci-scroll"
          >
            { (!selectedTxn || selectedProposalForProforma) && (
              <div style={ { marginBottom: 16 } }>
                <label className="ci-label">Select Proposal</label>
                <div className="ci-input-icon">
                  <select
                    className="ci-input"
                    value={ selectedProposalForProforma?.id || "" }
                    onChange={ (e) => {
                      const prop = proposalsList.find(p => String(p.id) === String(e.target.value));
                      if (prop) handleCreateProformaFromProposal(prop);
                    } }
                  >
                    { selectedProposalForProforma && !proposalsList.some(p => String(p.id) === String(selectedProposalForProforma.id)) && (
                      <option key={ selectedProposalForProforma.id } value={ selectedProposalForProforma.id }>
                        Proposal #{ selectedProposalForProforma.id } - { selectedProposalForProforma.grand_total_excl_gst } INR ({ selectedProposalForProforma.proposal_type }) - { selectedProposalForProforma.client_name || currentClientName }
                      </option>
                    ) }
                    { proposalsList.map(p => (
                      <option key={ p.id } value={ p.id }>Proposal #{ p.id } - { p.grand_total_excl_gst } INR ({ p.proposal_type }) - { p.client_name }</option>
                    )) }
                  </select>
                  <ChevronDown className="chevron" />
                </div>
              </div>
            ) }

            <div className="ci-grid-2">
              <div>
                <label className="ci-label">Bill Type</label>
                <div className="ci-input-icon">
                  <select
                    name="bill_type"
                    value={ formData.bill_type }
                    onChange={ handleChange }
                    className="ci-input"
                    required
                  >
                    <option value="NON_GST">Non-GST Bill</option>
                    <option value="GST">GST Bill</option>
                  </select>
                  <ChevronDown className="chevron" />
                </div>
              </div>
              <div>
                <label className="ci-label">Payment Mode</label>
                <div className="ci-input-icon">
                  <CreditCard className="icon" />
                  <select
                    name="payment_mode"
                    value={ formData.payment_mode }
                    onChange={ handleChange }
                    className="ci-input"
                    required
                  >
                    <option value="">Select mode</option>
                    { ["Payment Cheque", "Net Banking", "UPI", "Cash"].map((m) => (
                      <option key={ m } value={ m }>
                        { m }
                      </option>
                    )) }
                  </select>
                  <ChevronDown className="chevron" />
                </div>
              </div>
            </div>

            <div className="ci-grid-2">
              <div>
                <label className="ci-label">
                  <CalendarDays size={ 14 } style={ { marginRight: 4, verticalAlign: "middle", opacity: 0.6 } } />
                  Duration Start
                </label>
                <div style={ { position: "relative" } }>
                  <input
                    ref={ qtStartRef }
                    type="date"
                    name="duration_start_date"
                    value={ formData.duration_start_date }
                    onChange={ handleChange }
                    className="ci-input ci-date-input"
                    style={ { colorScheme: theme === "dark" ? "dark" : "light", paddingRight: 42 } }
                    required
                  />
                  <button
                    type="button"
                    onClick={ () => openDatePicker(qtStartRef) }
                    className="ci-date-btn"
                  >
                    <CalendarDays size={ 14 } />
                  </button>
                </div>
              </div>
              <div>
                <label className="ci-label">
                  <CalendarDays size={ 14 } style={ { marginRight: 4, verticalAlign: "middle", opacity: 0.6 } } />
                  Duration End
                </label>
                <div style={ { position: "relative" } }>
                  <input
                    ref={ qtEndRef }
                    type="date"
                    name="duration_end_date"
                    value={ formData.duration_end_date }
                    min={ formData.duration_start_date || undefined }
                    onChange={ handleChange }
                    className="ci-input ci-date-input"
                    style={ { colorScheme: theme === "dark" ? "dark" : "light", paddingRight: 42 } }
                    required
                  />
                  <button
                    type="button"
                    onClick={ () => openDatePicker(qtEndRef) }
                    className="ci-date-btn"
                  >
                    <CalendarDays size={ 14 } />
                  </button>
                </div>
              </div>
            </div>

            {/* Assign Team for Meeting Reminders */}
            <div>
              <label className="ci-label flex items-center justify-between">
                <span>
                  <Users size={14} style={{ marginRight: 4, verticalAlign: "middle", opacity: 0.7 }} />
                  Assign Team (Meeting Reminder)
                </span>
                <span className="ci-label-optional" style={{ fontSize: "11px", opacity: 0.7 }}>
                  (Team Lead will receive alerts)
                </span>
              </label>
              <select
                name="assigned_team"
                value={formData.assigned_team}
                onChange={handleChange}
                className="ci-input ci-select"
                style={{
                  colorScheme: theme === "dark" ? "dark" : "light",
                  backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
                }}
              >
                <option value="">-- Select Team (Optional) --</option>
                {availableTeams.map((teamName) => (
                  <option key={teamName} value={teamName}>
                    {teamName}
                  </option>
                ))}
              </select>
            </div>

            { formData.bill_type === "GST" && (
              <div>
                <label className="ci-label">Client GST Number</label>
                <input
                  name="client_gst_no"
                  value={ formData.client_gst_no }
                  onChange={ handleChange }
                  placeholder="Enter GST number"
                  maxLength={ 15 }
                  required
                  className="ci-input"
                />
              </div>
            ) }
            { formData.bill_type === "NON_GST" && (
              <div>
                <label className="ci-label">
                  Client PAN Number{ " " }
                  <span className="ci-label-optional">
                    (optional)
                  </span>
                </label>
                <input
                  name="client_pan_no"
                  value={ formData.client_pan_no }
                  onChange={ handleChange }
                  placeholder="Enter PAN number"
                  maxLength={ 10 }
                  className="ci-input"
                />
              </div>
            ) }

            {/* Previous Balance Section (Only visible if client has outstanding balance > 0) */}
            {previousBalance.totalPending > 0 && (
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: theme === "dark" ? "rgba(245, 158, 11, 0.08)" : "#fffbeb",
                  border: theme === "dark" ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid #fde68a",
                  marginBottom: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={previousBalance.include}
                      onChange={(e) => setPreviousBalance(prev => ({ ...prev, include: e.target.checked }))}
                      style={{ width: 16, height: 16, accentColor: "#f59e0b", cursor: "pointer" }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 700, color: theme === "dark" ? "#fbbf24" : "#b45309" }}>
                      Include Previous Balance 
                    </span>
                  </label>
                  <span style={{ fontSize: 14, fontWeight: 800, color: theme === "dark" ? "#fcd34d" : "#92400e" }}>
                    Total Pending: ₹{Number(previousBalance.totalPending).toLocaleString("en-IN")}
                  </span>
                </div>

                {previousBalance.include && (
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, color: theme === "dark" ? "#d1d5db" : "#4b5563" }}>
                      Carry Forward Amount (₹):
                    </span>
                    <input
                      type="number"
                      value={previousBalance.customAmount}
                      onChange={(e) => setPreviousBalance(prev => ({ ...prev, customAmount: e.target.value }))}
                      style={{
                        width: 130,
                        padding: "4px 8px",
                        fontSize: 13,
                        borderRadius: 6,
                        border: "1px solid rgba(245, 158, 11, 0.4)",
                        background: theme === "dark" ? "#1f2937" : "#ffffff",
                        color: theme === "dark" ? "#ffffff" : "#111827",
                        fontWeight: 600,
                      }}
                    />
                    {previousBalance.pendingProformas.length > 0 && (
                      <span style={{ fontSize: 11, color: theme === "dark" ? "#9ca3af" : "#6b7280" }}>
                        From {previousBalance.pendingProformas.map(p => `${p.proforma_number || '#' + p.id} (₹${Number(p.pending).toLocaleString("en-IN")})`).join(", ")}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <label className="ci-label" style={{ marginBottom: 0 }}>Quotation Services Preview</label>
                {/* Mobile view toggle */}
                <div className="ci-mobile-toggle-wrap">
                  <button
                    type="button"
                    onClick={() => setMobileTableView("cards")}
                    className={`ci-toggle-btn ${mobileTableView === "cards" ? "active" : ""}`}
                  >
                    Cards
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileTableView("table")}
                    className={`ci-toggle-btn ${mobileTableView === "table" ? "active" : ""}`}
                  >
                    Table
                  </button>
                </div>
              </div>

              { quotationPreviewLoading && (
                <div className="ci-empty-text">
                  Loading services...
                </div>
              ) }
              { !quotationPreviewLoading && quotationServicesPreview.length === 0 && (
                <div className="ci-empty-text">
                  No services found for this quotation.
                </div>
              ) }
              { !quotationPreviewLoading && quotationServicesPreview.length > 0 && (() => {
                const dmServices = quotationServicesPreview.filter(
                  (s) => s.service_type !== "Ads Campaign" &&
                    !s.is_complimentary &&
                    String(s.service_name || "").toLowerCase() !== "complimentary" &&
                    String(s.category_name || "").toLowerCase() !== "complimentary"
                );
                const adsServices = quotationServicesPreview.filter(
                  (s) => s.service_type === "Ads Campaign"
                );
                const complimentaryServices = quotationServicesPreview.filter(
                  (s) =>
                    s.is_complimentary ||
                    String(s.service_name || "").toLowerCase() === "complimentary" ||
                    String(s.category_name || "").toLowerCase() === "complimentary"
                );

                const dmTotal = dmServices.reduce((sum, svc) => {
                  const qty = Number(svc.quantity || 1);
                  const basePrice = Number(svc.editing_type_amount || svc.amount || 0);
                  const cp = Number(svc.include_content_posting || 0);
                  const th = Number(svc.include_thumbnail_creation || 0);
                  const yt = Number(svc.include_youtube_video_posting || 0);
                  let addons = [];
                  if (svc.additional_services) {
                    try {
                      addons = typeof svc.additional_services === 'string'
                        ? JSON.parse(svc.additional_services)
                        : svc.additional_services;
                      if (!Array.isArray(addons)) addons = [];
                    } catch {
                      addons = [];
                    }
                  }
                  const addonsTotal = addons.reduce((s, a) => s + ((Number(a.amount || a.unit_price) || 0) * (Number(a.quantity) || qty)), 0);
                  return sum + (basePrice * qty) + (cp * qty) + (th * qty) + (yt * qty) + addonsTotal;
                }, 0);

                const isProposalSource = !!selectedProposalForProforma;
                const adsTotal = adsServices.reduce((sum, svc) => sum + calcAdsRowTotal(svc, isProposalSource), 0);

                let discountAmt = 0;
                if (selectedProposalForProforma) {
                  try {
                    const sectionsData = typeof selectedProposalForProforma.sections_json === 'string'
                      ? JSON.parse(selectedProposalForProforma.sections_json)
                      : selectedProposalForProforma.sections_json;
                    const pd = sectionsData?.pricing_discount;
                    if (pd && Number(pd.value) > 0) {
                      if (pd.type === 'Percentage') {
                        discountAmt = (dmTotal * Number(pd.value)) / 100;
                      } else {
                        discountAmt = Number(pd.value);
                      }
                    }
                  } catch (e) { }
                }

                const isGST = formData.bill_type === "GST";
                const prevBalToApply = previousBalance.include ? Number(previousBalance.customAmount || 0) : 0;
                const dmTotalAfterDiscount = Math.max(0, dmTotal - discountAmt) + prevBalToApply;
                const dmGstAmount = isGST ? dmTotalAfterDiscount * 0.18 : 0;
                const dmSubtotalWithGst = dmTotalAfterDiscount + dmGstAmount;

                const grandTotal = dmSubtotalWithGst + adsTotal;

                // Group DM services
                const groupedDm = [];
                dmServices.forEach((svc) => {
                  let parentServiceTitle = (svc.service_name && svc.service_name.toLowerCase() === "proposal item")
                    ? (svc.category_name || svc.service_name)
                    : (svc.service_name || "N/A");
                  if (parentServiceTitle && (parentServiceTitle.toLowerCase() === "service charge" || parentServiceTitle.toLowerCase() === "ads service charge")) {
                    parentServiceTitle = "Ads Service Charge";
                  }
                  let lastGroup = groupedDm[groupedDm.length - 1];
                  if (lastGroup && lastGroup.title === parentServiceTitle) {
                    lastGroup.items.push(svc);
                  } else {
                    groupedDm.push({ title: parentServiceTitle, items: [svc] });
                  }
                });

                return (
                  <div style={ { display: "flex", flexDirection: "column", gap: 14 } }>
                    { dmServices.length > 0 && (
                      <div>
                        {/* MOBILE: Cards View */}
                        <div className={ mobileTableView === "cards" ? "sm:hidden space-y-2.5" : "hidden" }>
                          { groupedDm.map((group, gIdx) => (
                            <div key={ `m-group-${gIdx}` } className="ci-mobile-card space-y-2">
                              <div className="ci-mobile-card-title">
                                { group.title }
                              </div>
                              { group.items.map((svc, sIdx) => {
                                const qty = Number(svc.quantity || 1);
                                const basePrice = Number(svc.editing_type_amount || svc.amount || 0);
                                const catDisplay = getCategoryDisplay(svc);
                                const addons = getAddons(svc, qty);
                                const cp = Number(svc.include_content_posting || 0);
                                const th2 = Number(svc.include_thumbnail_creation || 0);
                                const yt2 = Number(svc.include_youtube_video_posting || 0);

                                return (
                                  <div key={ `m-item-${gIdx}-${sIdx}` } className="ci-mobile-card-item">
                                    <div className="ci-mobile-row">
                                      <span className="ci-mobile-cat">{ catDisplay }</span>
                                      <span className="ci-mobile-price">₹{ (basePrice * qty).toLocaleString("en-IN") }</span>
                                    </div>
                                    <div className="ci-mobile-subinfo">
                                      <span>Qty: <strong>{ qty }</strong></span>
                                      <span>Rate: <strong>₹{ basePrice.toLocaleString("en-IN") }</strong></span>
                                    </div>

                                    { addons.map((ad, aIdx) => (
                                      <div key={ `m-ad-${aIdx}` } className="ci-mobile-subrow">
                                        <div className="ci-mobile-row">
                                          <span className="ci-mobile-subname">+ { ad.name }</span>
                                          <span className="ci-mobile-price">₹{ ad.total.toLocaleString("en-IN") }</span>
                                        </div>
                                        <div className="ci-mobile-subinfo">
                                          <span>Qty: <strong>{ ad.quantity }</strong></span>
                                          <span>Rate: <strong>₹{ ad.amount.toLocaleString("en-IN") }</strong></span>
                                        </div>
                                      </div>
                                    )) }

                                    { th2 > 0 && (
                                      <div className="ci-mobile-subrow">
                                        <div className="ci-mobile-row">
                                          <span className="ci-mobile-subname">Thumbnail Creation</span>
                                          <span className="ci-mobile-price">₹{ (th2 * qty).toLocaleString("en-IN") }</span>
                                        </div>
                                        <div className="ci-mobile-subinfo">
                                          <span>Qty: <strong>{ qty }</strong></span>
                                          <span>Rate: <strong>₹{ th2.toLocaleString("en-IN") }</strong></span>
                                        </div>
                                      </div>
                                    ) }
                                    { cp > 0 && (
                                      <div className="ci-mobile-subrow">
                                        <div className="ci-mobile-row">
                                          <span className="ci-mobile-subname">Meta Growth & Content</span>
                                          <span className="ci-mobile-price">₹{ (cp * qty).toLocaleString("en-IN") }</span>
                                        </div>
                                        <div className="ci-mobile-subinfo">
                                          <span>Qty: <strong>{ qty }</strong></span>
                                          <span>Rate: <strong>₹{ cp.toLocaleString("en-IN") }</strong></span>
                                        </div>
                                      </div>
                                    ) }
                                    { yt2 > 0 && (
                                      <div className="ci-mobile-subrow">
                                        <div className="ci-mobile-row">
                                          <span className="ci-mobile-subname">YouTube Optimization</span>
                                          <span className="ci-mobile-price">₹{ (yt2 * qty).toLocaleString("en-IN") }</span>
                                        </div>
                                        <div className="ci-mobile-subinfo">
                                          <span>Qty: <strong>{ qty }</strong></span>
                                          <span>Rate: <strong>₹{ yt2.toLocaleString("en-IN") }</strong></span>
                                        </div>
                                      </div>
                                    ) }
                                  </div>
                                );
                              }) }
                            </div>
                          )) }
                          <div className="ci-mobile-total-bar ci-mobile-total-dm">
                            <span>Services Total</span>
                            <span>₹{ dmTotal.toLocaleString("en-IN") }</span>
                          </div>
                        </div>

                        {/* DESKTOP/TABLET (or mobile table mode): Table */}
                        <div className={ mobileTableView === "table" ? "block" : "hidden sm:block" }>
                          <div className="ci-table-scroll-hint">← Swipe to view all columns →</div>
                          <div className="ci-table-container">
                            <div style={ { maxHeight: 240, overflow: "auto" } } className="ci-scroll">
                              <table className="ci-table">
                                <thead>
                                  <tr className="ci-th-dm">
                                    <th className="ci-th-cell">Services</th>
                                    <th className="ci-th-cell">Categories</th>
                                    <th className="ci-th-cell-right">Qty</th>
                                    <th className="ci-th-cell-right">Price (₹)</th>
                                    <th className="ci-th-cell-right">Total (₹)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  { groupedDm.map((group, gIdx) => {
                                    return (
                                      <React.Fragment key={ `dm-${gIdx}` }>
                                        { group.items.map((svc, sIdx) => {
                                          const qty = Number(svc.quantity || 1);
                                          const basePrice = Number(svc.editing_type_amount || svc.amount || 0);
                                          const catDisplay = getCategoryDisplay(svc);

                                          return (
                                            <tr key={ `dm-${gIdx}-${sIdx}` }>
                                              { sIdx === 0 && (
                                                <td
                                                  className="ci-td-cell ci-text-orange font-medium align-middle"
                                                  rowSpan={ group.items.length }
                                                >
                                                  { group.title }
                                                </td>
                                              ) }
                                              <td className="ci-td-cell">{ catDisplay }</td>
                                              <td className="ci-td-cell-right">{ qty }</td>
                                              <td className="ci-td-cell-right">₹{ basePrice.toLocaleString("en-IN") }</td>
                                              <td className="ci-td-cell-right">₹{ (basePrice * qty).toLocaleString("en-IN") }</td>
                                            </tr>
                                          );
                                        }) }

                                        {/* Separate rows for Additional Services */}
                                        { group.items.flatMap((svc, sIdx) => {
                                          const qty = Number(svc.quantity || 1);
                                          const addons = getAddons(svc, qty);
                                          return addons.map((ad, aIdx) => (
                                            <tr key={ `dm-${gIdx}-${sIdx}-addon-${aIdx}` } className="ci-tr-subrow">
                                              <td className="ci-td-cell" colSpan={ 2 }>{ ad.name } ({ group.title })</td>
                                              <td className="ci-td-cell-right">{ ad.quantity }</td>
                                              <td className="ci-td-cell-right">₹{ ad.amount.toLocaleString("en-IN") }</td>
                                              <td className="ci-td-cell-right">₹{ ad.total.toLocaleString("en-IN") }</td>
                                            </tr>
                                          ));
                                        }) }

                                        {/* Optional service subrows for this group */}
                                        { group.items.map((svc, sIdx) => {
                                          const qty = Number(svc.quantity || 1);
                                          const cp = Number(svc.include_content_posting || 0);
                                          const th2 = Number(svc.include_thumbnail_creation || 0);
                                          const yt2 = Number(svc.include_youtube_video_posting || 0);
                                          return (
                                            <React.Fragment key={ `dm-${gIdx}-${sIdx}-opt` }>
                                              { th2 > 0 && (
                                                <tr className="ci-tr-subrow">
                                                  <td className="ci-td-cell" colSpan={ 2 }>Thumbnail Creation Total</td>
                                                  <td className="ci-td-cell-right">{ qty }</td>
                                                  <td className="ci-td-cell-right">₹{ th2.toLocaleString("en-IN") }</td>
                                                  <td className="ci-td-cell-right">₹{ (th2 * qty).toLocaleString("en-IN") }</td>
                                                </tr>
                                              ) }
                                              { cp > 0 && (
                                                <tr className="ci-tr-subrow">
                                                  <td className="ci-td-cell" colSpan={ 2 }>Meta Growth & Content Management Total</td>
                                                  <td className="ci-td-cell-right">{ qty }</td>
                                                  <td className="ci-td-cell-right">₹{ cp.toLocaleString("en-IN") }</td>
                                                  <td className="ci-td-cell-right">₹{ (cp * qty).toLocaleString("en-IN") }</td>
                                                </tr>
                                              ) }
                                              { yt2 > 0 && (
                                                <tr className="ci-tr-subrow">
                                                  <td className="ci-td-cell" colSpan={ 2 }>YouTube Channel Growth & Optimization Total</td>
                                                  <td className="ci-td-cell-right">{ qty }</td>
                                                  <td className="ci-td-cell-right">₹{ yt2.toLocaleString("en-IN") }</td>
                                                  <td className="ci-td-cell-right">₹{ (yt2 * qty).toLocaleString("en-IN") }</td>
                                                </tr>
                                              ) }
                                            </React.Fragment>
                                          );
                                        }) }
                                      </React.Fragment>
                                    );
                                  }) }
                                </tbody>
                                <tfoot className="ci-tfoot-dm">
                                  <tr>
                                    <td colSpan={ 4 } className="ci-td-cell-right font-bold ci-footer-label">Services Total</td>
                                    <td className="ci-td-cell-right font-bold ci-footer-value">₹{ dmTotal.toLocaleString("en-IN") }</td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) }

                    { adsServices.length > 0 && (
                      <div>
                        {/* MOBILE: Cards View */}
                        <div className={ mobileTableView === "cards" ? "sm:hidden space-y-2" : "hidden" }>
                          { adsServices.map((svc, idx) => {
                            const adsCategoryName = getServiceDisplayName(svc.category || svc.category_name || svc.service_name || "N/A");
                            const amount = Number(svc.amount || svc.budget || 0);
                            return (
                              <div key={ `m-ads-${idx}` } className="ci-mobile-card ci-mobile-row">
                                <span className="font-semibold text-[#60a5fa]">{ adsCategoryName }</span>
                                <span className="font-bold text-white">₹{ amount.toLocaleString("en-IN") }</span>
                              </div>
                            );
                          }) }
                          <div className="ci-mobile-total-bar ci-mobile-total-ads">
                            <span>Ads Total</span>
                            <span>₹{ adsTotal.toLocaleString("en-IN") }</span>
                          </div>
                        </div>

                        {/* DESKTOP/TABLET (or mobile table mode): Table */}
                        <div className={ mobileTableView === "table" ? "block" : "hidden sm:block" }>
                          <div className="ci-table-scroll-hint">← Swipe to view all columns →</div>
                          <div className="ci-table-container">
                            <div style={ { maxHeight: 220, overflow: "auto" } } className="ci-scroll">
                              <table className="ci-table-ads">
                                <thead>
                                  <tr className="ci-th-ads">
                                    <th className="ci-th-cell">Ads Services</th>
                                    <th className="ci-th-cell-right">Budget (₹)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  { adsServices.map((svc, idx) => {
                                    const adsCategoryName = getServiceDisplayName(svc.category || svc.category_name || svc.service_name || "N/A");
                                    const amount = Number(svc.amount || svc.budget || 0);
                                    return (
                                      <tr key={ `ads-${idx}` }>
                                        <td className="ci-td-cell font-medium" style={ { color: "#60a5fa" } }>{ adsCategoryName }</td>
                                        <td className="ci-td-cell-right">₹{ amount.toLocaleString("en-IN") }</td>
                                      </tr>
                                    );
                                  }) }
                                </tbody>
                                <tfoot className="ci-tfoot-ads">
                                  <tr>
                                    <td colSpan={ 1 } className="ci-td-cell-right font-bold ci-footer-ads-label">Ads Total</td>
                                    <td className="ci-td-cell-right font-bold ci-footer-ads-value">₹{ adsTotal.toLocaleString("en-IN") }</td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) }

                    { complimentaryServices.length > 0 && (() => {
                      const compRawTotal = complimentaryServices.reduce((sum, svc) => {
                        return sum + (Number(svc.editing_type_amount || svc.amount || 0) * Number(svc.quantity || 1));
                      }, 0);
                      return (
                        <div>
                          {/* MOBILE: Cards View */}
                          <div className={ mobileTableView === "cards" ? "sm:hidden space-y-2" : "hidden" }>
                            { complimentaryServices.map((svc, idx) => {
                              const qty = Number(svc.quantity || 1);
                              const price = Number(svc.editing_type_amount || svc.price || svc.amount || 0);
                              const sName = getCompServiceName(svc);
                              const eName = getCompEditingName(svc);
                              return (
                                <div key={ `m-comp-${idx}` } className="ci-mobile-card space-y-1.5 border-emerald-500/20">
                                  <div className="ci-mobile-row">
                                    <div>
                                      <span className="font-bold text-[#60a5fa] block leading-tight">{ sName }</span>
                                      <span className="text-[11px] text-gray-400">{ eName }</span>
                                    </div>
                                    <span className="ci-free-badge">FREE</span>
                                  </div>
                                  <div className="ci-mobile-subinfo border-t border-white/5 pt-1.5">
                                    <span>Qty: <strong>{ qty }</strong> × ₹{ price.toLocaleString("en-IN") }</span>
                                    <span className="line-through opacity-50">₹{ (price * qty).toLocaleString("en-IN") }</span>
                                  </div>
                                </div>
                              );
                            }) }
                            <div className="ci-mobile-total-bar ci-mobile-total-comp">
                              <span>Complimentary Total</span>
                              <span>₹0</span>
                            </div>
                          </div>

                          {/* DESKTOP/TABLET (or mobile table mode): Table */}
                          <div className={ mobileTableView === "table" ? "block" : "hidden sm:block" }>
                            <div className="ci-table-scroll-hint">← Swipe to view all columns →</div>
                            <div className="ci-table-container">
                              <div style={ { maxHeight: 180, overflow: "auto" } } className="ci-scroll">
                                <table className="ci-table-comp">
                                  <thead>
                                    <tr className="ci-th-comp">
                                      <th className="ci-th-cell">Complimentary Service</th>
                                      <th className="ci-th-cell">Service Name</th>
                                      <th className="ci-th-cell-right">Qty</th>
                                      <th className="ci-th-cell-right">Price (₹)</th>
                                      <th className="ci-th-cell-right">Total (₹)</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    { complimentaryServices.map((svc, idx) => {
                                      const qty = Number(svc.quantity || 1);
                                      const price = Number(svc.editing_type_amount || svc.price || svc.amount || 0);
                                      return (
                                        <tr key={ `comp-${idx}` }>
                                          <td className="ci-td-cell" style={ { color: "#60a5fa" } }>{ getCompServiceName(svc) }</td>
                                          <td className="ci-td-cell">{ getCompEditingName(svc) }</td>
                                          <td className="ci-td-cell-right">{ qty }</td>
                                          <td className="ci-td-cell-right">₹{ price.toLocaleString("en-IN") }</td>
                                          <td className="ci-td-cell-right">₹{ (price * qty).toLocaleString("en-IN") }</td>
                                        </tr>
                                      );
                                    }) }
                                  </tbody>
                                  <tfoot>
                                    <tr>
                                      <td colSpan={ 4 } className="ci-td-cell-right font-medium ci-comp-border-top">Total</td>
                                      <td className="ci-td-cell-right font-medium ci-comp-border-top">₹{ compRawTotal.toLocaleString("en-IN") }</td>
                                    </tr>
                                    <tr className="ci-tfoot-comp-row">
                                      <td colSpan={ 4 } className="ci-td-cell-right font-bold ci-footer-comp-label">Complimentary Total</td>
                                      <td className="ci-td-cell-right font-bold ci-footer-comp-value">₹0</td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })() }

                    <div style={ { textAlign: "right", paddingTop: 4 } }>
                      { (discountAmt > 0 || (previousBalance.include && prevBalToApply > 0)) && (
                        <div className="ci-summary-sub">
                          Subtotal: ₹{ dmTotal.toLocaleString("en-IN") }
                        </div>
                      ) }
                      { discountAmt > 0 && (
                        <div className="ci-summary-disc">
                          Discount: -₹{ discountAmt.toLocaleString("en-IN") }
                        </div>
                      ) }
                      { previousBalance.include && prevBalToApply > 0 && (
                        <div style={{ fontSize: 12, color: "#38bdf8", fontWeight: 600, marginBottom: 2 }}>
                          Previous Balance (बकाया): +₹{ prevBalToApply.toLocaleString("en-IN") }
                        </div>
                      ) }
                      <div className="ci-summary-taxable">
                        Taxable Service Amount: ₹{ dmTotalAfterDiscount.toLocaleString("en-IN") }
                      </div>
                      { isGST && (
                        <div className="ci-summary-gst">
                          GST @18%: ₹{ dmGstAmount.toLocaleString("en-IN") }
                        </div>
                      ) }
                      <div className="ci-summary-sub-gst font-semibold">
                        Subtotal: ₹{ dmSubtotalWithGst.toLocaleString("en-IN") }
                      </div>
                      { adsTotal > 0 && (
                        <div className="ci-summary-ads font-semibold">
                          Ads Services Total: ₹{ adsTotal.toLocaleString("en-IN") }
                        </div>
                      ) }
                      <div className="ci-summary-grand">
                        Grand Total: ₹{ grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
                      </div>
                    </div>
                  </div>
                );
              })() }
            </div>

            <div className="ci-modal-footer">
              <button type="button" onClick={ onClose } className="ci-btn-secondary">
                Cancel
              </button>
              <button
                type="submit"
                className="ci-btn-primary"
                disabled={ loading || !selectedProposalForProforma }
                style={ { opacity: (loading || !selectedProposalForProforma) ? 0.7 : 1 } }
              >
                { loading ? (
                  <Loader2 size={ 14 } style={ { animation: "spin 1s linear infinite" } } />
                ) : (
                  <FilePlus2 size={ 14 } />
                ) }
                { loading ? "Generating..." : "Generate Proforma" }
              </button>
            </div>
          </form>
        </div>
      </div>
    </>,
    document.body
  );
};

export default GenerateProformaModal;
