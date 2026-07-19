import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { ChevronDown, CalendarDays, FilePlus2, X, Hash, Building2, Phone, CreditCard, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTheme } from "../../context/ThemeContext";
import API_BASE_URL from "../../config/apiBaseUrl";
import { classifyProformaServices, calcAdsRowTotal } from "../../utils/proformaPricing";

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
    payment_mode: "",
    client_gst_no: "",
    client_pan_no: "",
    bill_type: "NON_GST",
  });

  const [selectedProposalForProforma, setSelectedProposalForProforma] = useState(null);
  const [quotationServicesPreview, setQuotationServicesPreview] = useState([]);
  const [quotationPreviewLoading, setQuotationPreviewLoading] = useState(false);
  const [loading, setLoading] = useState(false);

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
          payment_mode: "",
          client_gst_no: "",
          client_pan_no: "",
          bill_type: "NON_GST",
        });
        setQuotationServicesPreview([]);

        if (initialSelectedProposalId) {
          const prop = proposalsList.find((p) => String(p.id) === String(initialSelectedProposalId));
          if (prop) {
            handleCreateProformaFromProposal(prop);
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

    let previewData = [];
    try {
      const parsed = JSON.parse(proposal.pricing_table_json || "[]");
      const { dmServices, adsServices } = classifyProformaServices(parsed);
      const compServices = parsed.filter(item => item.source === 'custom_complimentary' || item.service_name?.toLowerCase() === 'complimentary').map(item => ({
        ...item,
        is_complimentary: true,
        service_type: item.service_type || "Complimentary",
        editing_type_amount: item.unit_price || item.editing_type_amount || item.total_price,
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
          return sum + (basePrice * qty) + (cp * qty) + (th * qty) + (yt * qty);
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
        const dmTotalAfterDiscount = Math.max(0, dmTotal - discountAmt);
        const dmGstAmount = isGST ? dmTotalAfterDiscount * 0.18 : 0;

        const adsTotalBudget = adsServices.reduce((sum, svc) => sum + Number(svc.budget || svc.amount || 0), 0);
        const adsGstAmount = 0;

        const finalBaseAmount = dmTotalAfterDiscount + adsTotalBudget;
        const finalGstAmount = dmGstAmount + adsGstAmount;
        const finalTotalAmount = finalBaseAmount + finalGstAmount;

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
        .ci-table { width: 100%; border-collapse: collapse; }

        .ci-th-dm { background: rgba(99,102,241,0.12); }
        [data-theme="light"] .ci-th-dm { background: rgba(99,102,241,0.06); }
        .ci-th-ads { background: rgba(168,85,247,0.12); }
        [data-theme="light"] .ci-th-ads { background: rgba(168,85,247,0.06); }
        .ci-th-comp { background: rgba(34,197,94,0.12); }
        [data-theme="light"] .ci-th-comp { background: rgba(34,197,94,0.06); }

        .ci-th-cell, .ci-th-cell-right { text-align: left; padding: 9px 12px; font-size: 11px; font-weight: 700; border-bottom: 1px solid rgba(255,255,255,0.08); color: #c7d2fe; }
        .ci-th-cell-right { text-align: right; }
        [data-theme="light"] .ci-th-cell, [data-theme="light"] .ci-th-cell-right { border-bottom-color: rgba(0,0,0,0.08); color: #4f46e5; }

        .ci-td-cell, .ci-td-cell-right { padding: 8px 12px; font-size: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); color: rgba(255,255,255,0.85); }
        .ci-td-cell-right { text-align: right; color: #e8e8f0; }
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

        .ci-footer-label { color: #c7d2fe; border-top: 1px solid rgba(99,102,241,0.2); }
        [data-theme="light"] .ci-footer-label { color: #312e81; border-top-color: rgba(99,102,241,0.15); }
        .ci-footer-value { color: #f0f5ff; border-top: 1px solid rgba(99,102,241,0.2); }
        [data-theme="light"] .ci-footer-value { color: #111827; border-top-color: rgba(99,102,241,0.15); }

        .ci-footer-ads-label { color: #d8b4fe; border-top: 1px solid rgba(168,85,247,0.2); }
        [data-theme="light"] .ci-footer-ads-label { color: #581c87; border-top-color: rgba(168,85,247,0.15); }
        .ci-footer-ads-value { color: #f0f5ff; border-top: 1px solid rgba(168,85,247,0.2); }
        [data-theme="light"] .ci-footer-ads-value { color: #111827; border-top-color: rgba(168,85,247,0.15); }

        .ci-footer-comp-label { color: #86efac; border-top: 1px solid rgba(34,197,94,0.2); }
        [data-theme="light"] .ci-footer-comp-label { color: #15803d; border-top-color: rgba(34,197,94,0.15); }
        .ci-footer-comp-value { color: #f0f5ff; border-top: 1px solid rgba(34,197,94,0.2); }
        [data-theme="light"] .ci-footer-comp-value { color: #111827; border-top-color: rgba(34,197,94,0.15); }

        .ci-comp-border-top { border-top: 1px solid rgba(255,255,255,0.08); }
        [data-theme="light"] .ci-comp-border-top { border-top-color: rgba(0,0,0,0.08); }

        .ci-text-orange { color: #f97316; }
        .font-medium { font-weight: 500; }
        .font-semibold { font-weight: 600; }
        .font-bold { font-weight: 700; }

        .ci-empty-text { text-align: center; color: rgba(255,255,255,0.5); padding: 1rem 0; }
        [data-theme="light"] .ci-empty-text { color: rgba(0,0,0,0.45); }

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

            <div>
              <label className="ci-label">Quotation Services Preview</label>
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
                  return sum + (basePrice * qty) + (cp * qty) + (th * qty) + (yt * qty);
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
                const dmTotalAfterDiscount = Math.max(0, dmTotal - discountAmt);
                const dmGstAmount = isGST ? dmTotalAfterDiscount * 0.18 : 0;
                const dmSubtotalWithGst = dmTotalAfterDiscount + dmGstAmount;

                const grandTotal = dmSubtotalWithGst + adsTotal;

                return (
                  <div style={ { display: "flex", flexDirection: "column", gap: 14 } }>
                    { dmServices.length > 0 && (
                      <div className="ci-table-container">
                        <div style={ { maxHeight: 220, overflow: "auto" } } className="ci-scroll">
                          <table className="ci-table">
                            <thead>
                              <tr className="ci-th-dm">
                                <th className="ci-th-cell">DM Service</th>
                                <th className="ci-th-cell">Service Name</th>
                                <th className="ci-th-cell-right">Qty</th>
                                <th className="ci-th-cell-right">Price (₹)</th>
                                <th className="ci-th-cell-right">Total (₹)</th>
                              </tr>
                            </thead>
                            <tbody>
                              { dmServices.map((svc, idx) => {
                                const qty = Number(svc.quantity || 1);
                                const basePrice = Number(svc.editing_type_amount || svc.amount || 0);
                                const cp = Number(svc.include_content_posting || 0);
                                const th2 = Number(svc.include_thumbnail_creation || 0);
                                const yt2 = Number(svc.include_youtube_video_posting || 0);
                                return (
                                  <React.Fragment key={ `dm-${idx}` }>
                                    <tr>
                                      <td className="ci-td-cell ci-text-orange font-medium">{ (svc.service_name && svc.service_name.toLowerCase() === "proposal item") ? (svc.category_name || svc.service_name) : (svc.service_name || "N/A") }</td>
                                      <td className="ci-td-cell">{ getServiceDisplayName((svc.editing_type_name && svc.editing_type_name.toLowerCase() === "proposal item") ? (svc.service || svc.category_name || svc.editing_type_name) : (svc.editing_type_name || svc.category_name || "N/A")) }</td>
                                      <td className="ci-td-cell-right">{ qty }</td>
                                      <td className="ci-td-cell-right">₹{ basePrice.toLocaleString("en-IN") }</td>
                                      <td className="ci-td-cell-right">₹{ (basePrice * qty).toLocaleString("en-IN") }</td>
                                    </tr>
                                    { th2 > 0 && (
                                      <tr className="ci-tr-subrow">
                                        <td className="ci-td-cell ci-text-orange font-medium">Thumbnail Creation Total</td>
                                        <td className="ci-td-cell"></td>
                                        <td className="ci-td-cell-right">{ qty }</td>
                                        <td className="ci-td-cell-right">₹{ th2.toLocaleString("en-IN") }</td>
                                        <td className="ci-td-cell-right">₹{ (th2 * qty).toLocaleString("en-IN") }</td>
                                      </tr>
                                    ) }
                                    { cp > 0 && (
                                      <tr className="ci-tr-subrow">
                                        <td className="ci-td-cell ci-text-orange font-medium">Meta Growth & Content Management Total</td>
                                        <td className="ci-td-cell"></td>
                                        <td className="ci-td-cell-right">{ qty }</td>
                                        <td className="ci-td-cell-right">₹{ cp.toLocaleString("en-IN") }</td>
                                        <td className="ci-td-cell-right">₹{ (cp * qty).toLocaleString("en-IN") }</td>
                                      </tr>
                                    ) }
                                    { yt2 > 0 && (
                                      <tr className="ci-tr-subrow">
                                        <td className="ci-td-cell ci-text-orange font-medium">YouTube Channel Growth & Optimization Total</td>
                                        <td className="ci-td-cell"></td>
                                        <td className="ci-td-cell-right">{ qty }</td>
                                        <td className="ci-td-cell-right">₹{ yt2.toLocaleString("en-IN") }</td>
                                        <td className="ci-td-cell-right">₹{ (yt2 * qty).toLocaleString("en-IN") }</td>
                                      </tr>
                                    ) }
                                  </React.Fragment>
                                );
                              }) }
                            </tbody>
                            <tfoot className="ci-tfoot-dm">
                              <tr>
                                <td colSpan={ 4 } className="ci-td-cell-right font-bold ci-footer-label">DM Service Total</td>
                                <td className="ci-td-cell-right font-bold ci-footer-value">₹{ dmTotal.toLocaleString("en-IN") }</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    ) }

                         { adsServices.length > 0 && (
                      <div className="ci-table-container">
                        <div style={ { maxHeight: 220, overflow: "auto" } } className="ci-scroll">
                          <table className="ci-table">
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
                    ) }

                    { complimentaryServices.length > 0 && (() => {
                      const compRawTotal = complimentaryServices.reduce((sum, svc) => {
                        return sum + (Number(svc.editing_type_amount || svc.amount || 0) * Number(svc.quantity || 1));
                      }, 0);
                      return (
                        <div className="ci-table-container">
                          <div style={ { maxHeight: 180, overflow: "auto" } } className="ci-scroll">
                            <table className="ci-table">
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
                                  const price = Number(svc.editing_type_amount || svc.amount || 0);
                                  return (
                                    <tr key={ `comp-${idx}` }>
                                      <td className="ci-td-cell" style={ { color: "#60a5fa" } }>{ getServiceDisplayName((svc.service_name && svc.service_name.toLowerCase() === "proposal item") ? (svc.category_name || svc.service_name) : (svc.service_name || svc.category_name || "N/A")) }</td>
                                      <td className="ci-td-cell">{ (svc.editing_type_name && svc.editing_type_name.toLowerCase() === "proposal item") ? (svc.service || svc.category_name || svc.editing_type_name) : (svc.editing_type_name || svc.service_type || "N/A") }</td>
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
                      );
                    })() }

                    <div style={ { textAlign: "right", paddingTop: 4 } }>
                      { discountAmt > 0 && (
                        <>
                          <div className="ci-summary-sub">
                            Subtotal: ₹{ dmTotal.toLocaleString("en-IN") }
                          </div>
                          <div className="ci-summary-disc">
                            Discount: -₹{ discountAmt.toLocaleString("en-IN") }
                          </div>
                        </>
                      ) }
                      <div className="ci-summary-taxable">
                        Taxable Amount: ₹{ dmTotalAfterDiscount.toLocaleString("en-IN") }
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
