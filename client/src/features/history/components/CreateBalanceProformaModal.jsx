import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  X,
  Search,
  User,
  Building2,
  Phone,
  Mail,
  ArrowLeft,
  FileText,
  Scale,
  CheckCircle2,
  Plus,
  Loader2,
  Calendar,
} from "lucide-react";
import moment from "moment";
import { useSelector } from "react-redux";
import API_BASE_URL from "../../../config/apiBaseUrl";
import { getBasePath, rolePath } from "../../../utils/rolePaths";
import { useTheme } from "../../../context/ThemeContext";

export default function CreateBalanceProformaModal({ isOpen, onClose, onSuccess }) {
  const baseURL = API_BASE_URL;
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { currentUser, token } = useSelector((state) => state.user);
  const basePath = getBasePath(currentUser?.role);

  const [step, setStep] = useState("client"); // "client" | "proformas"
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientKeyword, setClientKeyword] = useState("");

  const [selectedClient, setSelectedClient] = useState(null);
  const [proformas, setProformas] = useState([]);
  const [loadingProformas, setLoadingProformas] = useState(false);
  const [creatingForId, setCreatingForId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setStep("client");
      setSelectedClient(null);
      setProformas([]);
      setClientKeyword("");
      fetchClients();
    }
  }, [isOpen]);

  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      const res = await axios.get(`${baseURL}/auth/api/re_calculator/getClientDetails`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.status === "Success" && Array.isArray(res.data.data)) {
        setClients(res.data.data);
      } else {
        setClients([]);
      }
    } catch (err) {
      console.error("Error fetching clients:", err);
      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  };

  const handleSelectClient = async (client) => {
    setSelectedClient(client);
    setStep("proformas");
    try {
      setLoadingProformas(true);
      const res = await axios.get(`${baseURL}/auth/api/re_calculator/proforma/client/${client.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.status === "Success" && Array.isArray(res.data.data)) {
        setProformas(res.data.data);
      } else {
        setProformas([]);
      }
    } catch (err) {
      console.error("Error fetching client proformas:", err);
      setProformas([]);
    } finally {
      setLoadingProformas(false);
    }
  };

  const filteredClients = useMemo(() => {
    const kw = clientKeyword.trim().toLowerCase();
    if (!kw) return clients;
    return clients.filter((c) => {
      const name = String(c.client_name || "").toLowerCase();
      const org = String(c.client_organization || "").toLowerCase();
      const phone = String(c.phone || "").toLowerCase();
      const email = String(c.email || "").toLowerCase();
      return name.includes(kw) || org.includes(kw) || phone.includes(kw) || email.includes(kw);
    });
  }, [clients, clientKeyword]);

  const handleCreateSnapshot = async (proforma) => {
    const totalAmount = Number(proforma.total_amount || 0);
    const totalPaid = Number(proforma.total_paid_amount || 0);
    const pendingBalance = Math.max(0, totalAmount - totalPaid);

    const confirm = await Swal.fire({
      title: "Create Balance Proforma?",
      html: `
        <div style="text-align: left; font-size: 0.9em; color: ${isDark ? '#cbd5e1' : '#374151'}; line-height: 1.6;">
          <p><strong>Proforma:</strong> ${proforma.proforma_number || `Proforma #${proforma.id}`}</p>
          <p><strong>Invoice Total:</strong> ₹${totalAmount.toLocaleString("en-IN")}</p>
          <p><strong>Paid So Far:</strong> ₹${totalPaid.toLocaleString("en-IN")}</p>
          <p style="color: ${isDark ? '#fbbf24' : '#d97706'}; font-weight: 700; font-size: 1.05em; margin-top: 6px;">
            Pending Balance: ₹${pendingBalance.toLocaleString("en-IN")}
          </p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#f59e0b",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Create Snapshot",
      background: isDark ? "#1e293b" : "#ffffff",
      color: isDark ? "#ffffff" : "#111827",
      customClass: {
        popup: isDark ? "re-swal-dark" : "re-swal-light",
      },
    });

    if (!confirm.isConfirmed) return;

    try {
      setCreatingForId(proforma.id);
      const res = await axios.post(
        `${baseURL}/auth/api/re_calculator/balance-proforma/create`,
        {
          proforma_id: proforma.id,
          created_by: currentUser?.name || "Admin",
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.status === "Success") {
        const newBal = res.data.data;
        const isGST =
          proforma.is_gst && typeof proforma.is_gst === "object" && proforma.is_gst.data
            ? proforma.is_gst.data[0] === 1
            : Number(proforma.is_gst) === 1;

        if (onSuccess) onSuccess();
        onClose();

        Swal.fire({
          title: "Balance Proforma Created!",
          text: `${newBal.balance_proforma_number} generated with ₹${Number(newBal.current_balance || 0).toLocaleString("en-IN")} pending balance.`,
          icon: "success",
          showCancelButton: true,
          confirmButtonText: "View Now",
          cancelButtonText: "Close",
          confirmButtonColor: "#f59e0b",
          background: isDark ? "#1e293b" : "#ffffff",
          color: isDark ? "#ffffff" : "#111827",
          customClass: {
            popup: isDark ? "re-swal-dark" : "re-swal-light",
          },
        }).then((viewResult) => {
          if (viewResult.isConfirmed) {
            window.open(
              `#${rolePath(basePath, "balance-proforma", selectedClient.id, newBal.id, `doc=balance-proforma-view&gst=${isGST ? 1 : 0}`)}`,
              "_blank"
            );
          }
        });
      } else {
        Swal.fire("Error", res.data.message || "Failed to create balance proforma", "error");
      }
    } catch (err) {
      console.error("Failed to create balance proforma:", err);
      Swal.fire(
        "Error",
        err.response?.data?.message || "Failed to create balance proforma.",
        "error"
      );
    } finally {
      setCreatingForId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="cbp-overlay">
      <style>{`
        .cbp-overlay {
          position: fixed;
          inset: 0;
          z-index: 150;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(8px);
          animation: cbpFadeIn 0.2s ease both;
        }
        @keyframes cbpFadeIn { from { opacity: 0; } to { opacity: 1; } }

        .cbp-card {
          position: relative;
          width: 100%;
          max-width: 56rem;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          border-radius: 1.25rem;
          overflow: hidden;
          background: #0f172a;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8);
          animation: cbpSlideUp 0.25s ease both;
        }
        @keyframes cbpSlideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        [data-theme="light"] .cbp-card {
          background: #ffffff !important;
          border: 1px solid #e5e7eb !important;
          box-shadow: 0 25px 70px -15px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.04) !important;
        }

        .cbp-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          background: rgba(30, 41, 59, 0.85);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        [data-theme="light"] .cbp-header {
          background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 45%, #ffffff 100%) !important;
          border-bottom: 1px solid rgba(245, 158, 11, 0.25) !important;
        }

        .cbp-header-icon {
          width: 2.75rem;
          height: 2.75rem;
          border-radius: 0.875rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #fbbf24;
        }
        [data-theme="light"] .cbp-header-icon {
          background: #fef3c7 !important;
          border: 1px solid #fde68a !important;
          color: #b45309 !important;
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.15) !important;
        }

        .cbp-header-title {
          font-size: 1.25rem;
          font-weight: 800;
          letter-spacing: -0.01em;
          background: linear-gradient(135deg, #fbbf24 0%, #f97316 50%, #f59e0b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        [data-theme="light"] .cbp-header-title {
          background: linear-gradient(135deg, #9a3412 0%, #c2410c 50%, #b45309 100%) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
        }

        .cbp-header-subtitle {
          font-size: 0.75rem;
          color: #94a3b8;
          margin-top: 0.125rem;
        }
        [data-theme="light"] .cbp-header-subtitle {
          color: #78350f !important;
          font-weight: 600 !important;
        }

        .cbp-close-btn {
          padding: 0.5rem;
          border-radius: 0.75rem;
          color: #94a3b8;
          background: transparent;
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cbp-close-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.08);
        }
        [data-theme="light"] .cbp-close-btn {
          color: #6b7280 !important;
          background: #ffffff !important;
          border: 1px solid #e5e7eb !important;
        }
        [data-theme="light"] .cbp-close-btn:hover {
          color: #111827 !important;
          background: #f3f4f6 !important;
          border-color: #d1d5db !important;
        }

        .cbp-body {
          flex: 1 1 0%;
          overflow-y: auto;
          padding: 1.25rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        [data-theme="light"] .cbp-body {
          background: #ffffff !important;
        }

        .cbp-search-box {
          position: relative;
          display: flex;
          align-items: center;
        }
        .cbp-search-icon {
          position: absolute;
          left: 0.875rem;
          width: 1.125rem;
          height: 1.125rem;
          pointer-events: none;
          color: #64748b;
        }
        [data-theme="light"] .cbp-search-icon {
          color: #9ca3af !important;
        }
        .cbp-search-input {
          width: 100%;
          padding: 0.65rem 1rem 0.65rem 2.5rem;
          font-size: 0.875rem;
          border-radius: 0.75rem;
          outline: none;
          background: rgba(30, 41, 59, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #ffffff;
          transition: all 0.2s;
        }
        .cbp-search-input::placeholder { color: #64748b; }
        .cbp-search-input:focus {
          border-color: #f59e0b;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
        }
        [data-theme="light"] .cbp-search-input {
          background: #f9fafb !important;
          border: 1px solid #d1d5db !important;
          color: #111827 !important;
        }
        [data-theme="light"] .cbp-search-input::placeholder { color: #9ca3af !important; }
        [data-theme="light"] .cbp-search-input:focus {
          background: #ffffff !important;
          border-color: #f59e0b !important;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.18) !important;
        }

        .cbp-client-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 1.125rem;
          border-radius: 0.875rem;
          text-align: left;
          cursor: pointer;
          background: rgba(30, 41, 59, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.2s ease;
        }
        .cbp-client-card:hover {
          background: rgba(30, 41, 59, 0.85);
          border-color: rgba(245, 158, 11, 0.4);
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }
        [data-theme="light"] .cbp-client-card {
          background: #ffffff !important;
          border: 1px solid #e5e7eb !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
        }
        [data-theme="light"] .cbp-client-card:hover {
          background: #fffdf5 !important;
          border-color: #f59e0b !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 10px 25px rgba(245, 158, 11, 0.14) !important;
        }

        .cbp-client-name {
          font-weight: 700;
          font-size: 0.95rem;
          color: #ffffff;
          transition: color 0.15s;
        }
        .cbp-client-card:hover .cbp-client-name { color: #fbbf24; }
        [data-theme="light"] .cbp-client-name {
          color: #111827 !important;
        }
        [data-theme="light"] .cbp-client-card:hover .cbp-client-name {
          color: #b45309 !important;
        }

        .cbp-client-org {
          font-size: 0.75rem;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 0.3rem;
          margin-top: 0.2rem;
        }
        [data-theme="light"] .cbp-client-org {
          color: #4b5563 !important;
        }

        .cbp-client-id {
          font-size: 0.6875rem;
          font-family: monospace;
          padding: 0.125rem 0.5rem;
          border-radius: 0.375rem;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94a3b8;
        }
        [data-theme="light"] .cbp-client-id {
          background: #fef3c7 !important;
          border: 1px solid #fde68a !important;
          color: #92400e !important;
          font-weight: 700 !important;
        }

        .cbp-card-divider {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 0.625rem;
          margin-top: 0.625rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.6875rem;
          color: #94a3b8;
        }
        [data-theme="light"] .cbp-card-divider {
          border-top: 1px solid #f3f4f6 !important;
          color: #6b7280 !important;
        }

        .cbp-client-select {
          font-size: 0.75rem;
          font-weight: 700;
          color: #fbbf24;
          transition: transform 0.2s;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .cbp-client-card:hover .cbp-client-select {
          transform: translateX(3px);
        }
        [data-theme="light"] .cbp-client-select {
          color: #d97706 !important;
        }

        /* Step 2 Client Summary Bar */
        .cbp-step2-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        [data-theme="light"] .cbp-step2-bar {
          background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%) !important;
          border: 1px solid #fde68a !important;
          box-shadow: 0 2px 6px rgba(245, 158, 11, 0.08) !important;
        }

        .cbp-change-client-btn {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.375rem 0.75rem;
          border-radius: 0.5rem;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #e2e8f0;
          cursor: pointer;
          transition: all 0.2s;
        }
        .cbp-change-client-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #ffffff;
        }
        [data-theme="light"] .cbp-change-client-btn {
          background: #ffffff !important;
          border: 1px solid #d1d5db !important;
          color: #374151 !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05) !important;
        }
        [data-theme="light"] .cbp-change-client-btn:hover {
          background: #f9fafb !important;
          color: #111827 !important;
        }

        .cbp-step2-client-title {
          font-size: 0.75rem;
          color: #94a3b8;
        }
        [data-theme="light"] .cbp-step2-client-title {
          color: #78350f !important;
        }

        .cbp-step2-client-val {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #fbbf24;
        }
        [data-theme="light"] .cbp-step2-client-val {
          color: #92400e !important;
          font-weight: 800 !important;
        }

        /* Proforma Cards in Step 2 */
        .cbp-proforma-card {
          border-radius: 0.875rem;
          padding: 1.125rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          background: rgba(30, 41, 59, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.2s;
        }
        @media (min-width: 640px) {
          .cbp-proforma-card {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }
        .cbp-proforma-card:hover {
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }
        [data-theme="light"] .cbp-proforma-card {
          background: #ffffff !important;
          border: 1px solid #e5e7eb !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
        }
        [data-theme="light"] .cbp-proforma-card:hover {
          border-color: #cbd5e1 !important;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08) !important;
        }

        .cbp-proforma-num {
          font-weight: 800;
          font-family: monospace;
          font-size: 1rem;
          color: #ffffff;
        }
        [data-theme="light"] .cbp-proforma-num {
          color: #0f172a !important;
        }

        .cbp-metric-text {
          font-size: 0.75rem;
          color: #94a3b8;
        }
        [data-theme="light"] .cbp-metric-text {
          color: #64748b !important;
        }

        .cbp-metric-total {
          color: #ffffff;
          font-weight: 700;
        }
        [data-theme="light"] .cbp-metric-total {
          color: #0f172a !important;
        }

        .cbp-metric-recv {
          color: #34d399;
          font-weight: 700;
        }
        [data-theme="light"] .cbp-metric-recv {
          color: #059669 !important;
        }

        .cbp-metric-pend {
          color: #fbbf24;
          font-weight: 800;
        }
        [data-theme="light"] .cbp-metric-pend {
          color: #d97706 !important;
          font-weight: 800 !important;
          font-size: 0.875rem !important;
        }

        /* Footer */
        .cbp-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          background: rgba(15, 23, 42, 0.85);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 0.75rem;
          color: #94a3b8;
        }
        [data-theme="light"] .cbp-footer {
          background: #f9fafb !important;
          border-top: 1px solid #e5e7eb !important;
          color: #6b7280 !important;
        }

        .cbp-close-footer-btn {
          padding: 0.5rem 1rem;
          border-radius: 0.75rem;
          font-weight: 600;
          font-size: 0.8125rem;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #ffffff;
          cursor: pointer;
          transition: all 0.2s;
        }
        .cbp-close-footer-btn:hover {
          background: rgba(255, 255, 255, 0.15);
        }
        [data-theme="light"] .cbp-close-footer-btn {
          background: #ffffff !important;
          border: 1px solid #d1d5db !important;
          color: #374151 !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05) !important;
        }
        [data-theme="light"] .cbp-close-footer-btn:hover {
          background: #f3f4f6 !important;
          color: #111827 !important;
          border-color: #9ca3af !important;
        }

        .cbp-empty-state {
          padding: 4rem 1rem;
          text-align: center;
          border-radius: 1rem;
          background: rgba(30, 41, 59, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: #94a3b8;
        }
        [data-theme="light"] .cbp-empty-state {
          background: #f9fafb !important;
          border: 1px solid #e5e7eb !important;
          color: #6b7280 !important;
        }
      `}</style>

      <div className="cbp-card">
        {/* Header */}
        <div className="cbp-header">
          <div className="flex items-center gap-3">
            <div className="cbp-header-icon">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="cbp-header-title">
                Create Balance Proforma
              </h2>
              <p className="cbp-header-subtitle">
                {step === "client"
                  ? "Step 1: Select a client to view their proformas"
                  : `Step 2: Choose a proforma for ${selectedClient?.client_organization || selectedClient?.client_name}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="cbp-close-btn"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="cbp-body">
          {step === "client" ? (
            /* ── Step 1: Client Selection ── */
            <div className="space-y-4">
              <div className="cbp-search-box">
                <Search className="cbp-search-icon" />
                <input
                  type="search"
                  value={clientKeyword}
                  onChange={(e) => setClientKeyword(e.target.value)}
                  placeholder="Search client by name, organization, phone, or email..."
                  className="cbp-search-input"
                  autoFocus
                />
              </div>

              {loadingClients ? (
                <div className="py-16 text-center text-gray-400">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-2" />
                  <p className="text-sm font-medium">Loading clients...</p>
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="cbp-empty-state">
                  <User className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-semibold">No clients found matching your search.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                  {filteredClients.map((client) => {
                    const displayName = client.client_name || "Unnamed Client";
                    const org = client.client_organization;

                    return (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => handleSelectClient(client)}
                        className="cbp-client-card group"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0 flex-1">
                            <h4 className="cbp-client-name truncate">
                              {displayName}
                            </h4>
                            {org && (
                              <p className="cbp-client-org truncate">
                                <Building2 className="w-3.5 h-3.5 shrink-0 text-amber-500" /> {org}
                              </p>
                            )}
                          </div>
                          <span className="cbp-client-id">
                            #{client.id}
                          </span>
                        </div>

                        <div className="cbp-card-divider">
                          <div className="flex items-center gap-3">
                            {client.phone && (
                              <span className="flex items-center gap-1 font-mono">
                                <Phone className="w-3 h-3 text-gray-400" /> {client.phone}
                              </span>
                            )}
                            {client.email && (
                              <span className="flex items-center gap-1 truncate max-w-[150px]">
                                <Mail className="w-3 h-3 text-gray-400" /> {client.email}
                              </span>
                            )}
                          </div>
                          <span className="cbp-client-select">
                            Select →
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* ── Step 2: Proforma Selection ── */
            <div className="space-y-4">
              <div className="cbp-step2-bar">
                <button
                  type="button"
                  onClick={() => setStep("client")}
                  className="cbp-change-client-btn"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Change Client
                </button>
                <div className="text-right">
                  <span className="cbp-step2-client-title">Client: </span>
                  <span className="cbp-step2-client-val">
                    {selectedClient?.client_organization || selectedClient?.client_name}
                  </span>
                  <span className="text-[10px] font-mono ml-1.5 opacity-60">
                    (#{selectedClient?.id})
                  </span>
                </div>
              </div>

              {loadingProformas ? (
                <div className="py-16 text-center text-gray-400">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-2" />
                  <p className="text-sm font-medium">Fetching proformas for this client...</p>
                </div>
              ) : proformas.length === 0 ? (
                <div className="cbp-empty-state">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-40 text-amber-500" />
                  <p className="text-sm font-bold">No Proforma Invoices Found</p>
                  <p className="text-xs opacity-75 mt-1">
                    This client does not have any proformas yet. Create a proposal proforma or quotation proforma first.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {proformas.map((proforma) => {
                    const totalAmount = Number(proforma.total_amount || 0);
                    const totalPaid = Number(proforma.total_paid_amount || 0);
                    const pendingBalance = Math.max(0, totalAmount - totalPaid);
                    const isCarriedForward =
                      proforma.status === "carried_forward" || proforma.is_carried_forward === 1;
                    const isFullyPaid = totalPaid >= totalAmount - 0.05 && totalAmount > 0;
                    const isPartial = totalPaid > 0 && !isFullyPaid;

                    const isQuotation = proforma.source_type === "quotation" || Boolean(proforma.quotation_id);
                    const isInstant = !isQuotation && (proforma.source_type === "manual" || !proforma.proposal_id);

                    return (
                      <div
                        key={proforma.id}
                        className="cbp-proforma-card"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="cbp-proforma-num">
                              {proforma.proforma_number || `PROF-${proforma.id}`}
                            </span>

                            {isQuotation ? (
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                isDark
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}>
                                📄 {proforma.quotation_number ? `Quotation ${proforma.quotation_number}` : (proforma.quotation_id ? `Quotation #${proforma.quotation_id}` : "Quotation")}
                              </span>
                            ) : isInstant ? (
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                isDark
                                  ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                              }`}>
                                ⚡ Instant Proforma
                              </span>
                            ) : (
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                isDark
                                  ? "bg-gray-700/60 text-gray-300 border-gray-600/50"
                                  : "bg-purple-50 text-purple-700 border-purple-200"
                              }`}>
                                Proposal #{proforma.proposal_id}
                              </span>
                            )}

                            {isCarriedForward ? (
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                isDark
                                  ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                                  : "bg-purple-100 text-purple-800 border-purple-200"
                              }`}>
                                🔒 Carried Forward
                              </span>
                            ) : isFullyPaid ? (
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                isDark
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                  : "bg-emerald-100 text-emerald-800 border-emerald-200"
                              }`}>
                                ✓ Fully Paid
                              </span>
                            ) : isPartial ? (
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                isDark
                                  ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                  : "bg-amber-100 text-amber-900 border-amber-200 font-bold"
                              }`}>
                                Partial
                              </span>
                            ) : (
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                isDark
                                  ? "bg-slate-700/60 text-slate-300 border-slate-600/50"
                                  : "bg-gray-100 text-gray-700 border-gray-200"
                              }`}>
                                Pending
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-4 cbp-metric-text">
                            <span className="flex items-center gap-1 font-medium">
                              <Calendar className="w-3.5 h-3.5 opacity-70" />
                              {moment(proforma.created_at).format("DD MMM YYYY")}
                            </span>
                            <span>
                              Total: <strong className="cbp-metric-total">₹{totalAmount.toLocaleString("en-IN")}</strong>
                            </span>
                            <span>
                              Received: <strong className="cbp-metric-recv">₹{totalPaid.toLocaleString("en-IN")}</strong>
                            </span>
                            <span>
                              Pending:{" "}
                              <strong className="cbp-metric-pend">
                                ₹{pendingBalance.toLocaleString("en-IN")}
                              </strong>
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 w-full sm:w-auto">
                          {isCarriedForward ? (
                            <span className={`inline-block px-3 py-2 rounded-xl text-xs font-semibold text-center w-full border ${
                              isDark
                                ? "bg-purple-950/40 text-purple-300 border-purple-800/40"
                                : "bg-purple-50 text-purple-700 border-purple-200"
                            }`}>
                              🔒 Balance Frozen
                            </span>
                          ) : isFullyPaid ? (
                            <span className={`inline-block px-3 py-2 rounded-xl text-xs font-semibold text-center w-full border ${
                              isDark
                                ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/40"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}>
                              ✓ Paid in Full
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleCreateSnapshot(proforma)}
                              disabled={creatingForId === proforma.id}
                              className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              {creatingForId === proforma.id ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating...
                                </>
                              ) : (
                                <>
                                  <Scale className="w-3.5 h-3.5" /> Create Balance Proforma
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="cbp-footer">
          <span>
            {step === "client"
              ? `${filteredClients.length} clients available`
              : `${proformas.length} proformas found`}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="cbp-close-footer-btn"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
