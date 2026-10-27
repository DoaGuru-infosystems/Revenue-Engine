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

export default function CreateBalanceProformaModal({ isOpen, onClose, onSuccess }) {
  const baseURL = API_BASE_URL;
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
        <div style="text-align: left; font-size: 0.9em; color: #cbd5e1; line-height: 1.6;">
          <p><strong>Proforma:</strong> ${proforma.proforma_number || `Proforma #${proforma.id}`}</p>
          <p><strong>Invoice Total:</strong> ₹${totalAmount.toLocaleString("en-IN")}</p>
          <p><strong>Paid So Far:</strong> ₹${totalPaid.toLocaleString("en-IN")}</p>
          <p style="color: #fbbf24; font-weight: 700; font-size: 1.05em; margin-top: 6px;">
            Pending Balance: ₹${pendingBalance.toLocaleString("en-IN")}
          </p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#f59e0b",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Create Snapshot",
      background: "#1e293b",
      color: "#fff",
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
          background: "#1e293b",
          color: "#fff",
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
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-gray-900 border border-gray-700/70 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 bg-gray-800/90 border-b border-gray-700/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                Create Balance Proforma
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {step === "client"
                  ? "Step 1: Select a client to view their proformas"
                  : `Step 2: Choose a proforma for ${selectedClient?.client_organization || selectedClient?.client_name}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/60 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          
          {step === "client" ? (
            /* ── Step 1: Client Selection ── */
            <div className="space-y-4">
              <div className="relative flex items-center text-gray-400 focus-within:text-amber-400">
                <Search className="pointer-events-none absolute left-3.5 h-4 w-4" />
                <input
                  type="search"
                  value={clientKeyword}
                  onChange={(e) => setClientKeyword(e.target.value)}
                  placeholder="Search client by name, organization, phone, or email..."
                  className="w-full rounded-xl border border-gray-700 bg-gray-800/60 pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                  autoFocus
                />
              </div>

              {loadingClients ? (
                <div className="py-16 text-center text-gray-400">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Loading clients...</p>
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="py-16 text-center text-gray-500 bg-gray-800/30 rounded-2xl border border-gray-800">
                  <User className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No clients found matching your search.</p>
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
                        className="group flex flex-col justify-between p-4 rounded-xl bg-gray-800/50 hover:bg-gray-800 border border-gray-700/60 hover:border-amber-500/40 text-left transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/5"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-white text-sm group-hover:text-amber-300 transition-colors truncate">
                              {displayName}
                            </h4>
                            {org && (
                              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                                <Building2 className="w-3 h-3 shrink-0 text-gray-500" /> {org}
                              </p>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-gray-500 bg-gray-900/60 px-2 py-0.5 rounded border border-gray-700/50">
                            #{client.id}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-700/40 gap-2">
                          <div className="flex items-center gap-3">
                            {client.phone && (
                              <span className="flex items-center gap-1 font-mono">
                                <Phone className="w-3 h-3 text-gray-500" /> {client.phone}
                              </span>
                            )}
                            {client.email && (
                              <span className="flex items-center gap-1 truncate max-w-[150px]">
                                <Mail className="w-3 h-3 text-gray-500" /> {client.email}
                              </span>
                            )}
                          </div>
                          <span className="text-amber-400 group-hover:translate-x-0.5 transition-transform font-medium">
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
              <div className="flex items-center justify-between bg-gray-800/50 border border-gray-700/60 rounded-xl p-3">
                <button
                  type="button"
                  onClick={() => setStep("client")}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 hover:text-white px-3 py-1.5 rounded-lg bg-gray-700/60 hover:bg-gray-700 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Change Client
                </button>
                <div className="text-right">
                  <span className="text-xs text-gray-400">Client: </span>
                  <span className="text-xs font-semibold text-amber-400">
                    {selectedClient?.client_organization || selectedClient?.client_name}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono ml-1.5">
                    (#{selectedClient?.id})
                  </span>
                </div>
              </div>

              {loadingProformas ? (
                <div className="py-16 text-center text-gray-400">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Fetching proformas for this client...</p>
                </div>
              ) : proformas.length === 0 ? (
                <div className="py-16 text-center text-gray-400 bg-gray-800/30 rounded-2xl border border-gray-800">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-40 text-gray-500" />
                  <p className="text-sm font-semibold text-gray-300">No Proforma Invoices Found</p>
                  <p className="text-xs text-gray-500 mt-1">
                    This client does not have any proformas yet. Create a proposal proforma or instant proforma first.
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
                    const isEligible = !isCarriedForward && !isFullyPaid && pendingBalance > 0.05;

                    return (
                      <div
                        key={proforma.id}
                        className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-gray-600 transition"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-base font-mono">
                              {proforma.proforma_number || `PROF-${proforma.id}`}
                            </span>

                            {isQuotation ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                📄 {proforma.quotation_number ? `Quotation ${proforma.quotation_number}` : (proforma.quotation_id ? `Quotation #${proforma.quotation_id}` : "Quotation")}
                              </span>
                            ) : isInstant ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                ⚡ Instant Proforma
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-700/60 text-gray-300 border border-gray-600/50">
                                Proposal #{proforma.proposal_id}
                              </span>
                            )}

                            {isCarriedForward ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                🔒 Carried Forward
                              </span>
                            ) : isFullyPaid ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                ✓ Fully Paid
                              </span>
                            ) : isPartial ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Partial
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-700/60 text-slate-300 border border-slate-600/50">
                                Pending
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-gray-500" />
                              {moment(proforma.created_at).format("DD MMM YYYY")}
                            </span>
                            <span>
                              Total: <strong className="text-white">₹{totalAmount.toLocaleString("en-IN")}</strong>
                            </span>
                            <span>
                              Received: <strong className="text-emerald-400">₹{totalPaid.toLocaleString("en-IN")}</strong>
                            </span>
                            <span>
                              Pending:{" "}
                              <strong className="text-amber-400">
                                ₹{pendingBalance.toLocaleString("en-IN")}
                              </strong>
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 w-full sm:w-auto">
                          {isCarriedForward ? (
                            <span className="inline-block px-3 py-2 bg-purple-950/40 text-purple-300 border border-purple-800/40 rounded-xl text-xs font-medium text-center w-full">
                              🔒 Balance Frozen
                            </span>
                          ) : isFullyPaid ? (
                            <span className="inline-block px-3 py-2 bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 rounded-xl text-xs font-medium text-center w-full">
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
        <div className="flex items-center justify-between p-4 sm:p-5 bg-gray-800/60 border-t border-gray-700/70 text-xs text-gray-400">
          <span>
            {step === "client"
              ? `${filteredClients.length} clients available`
              : `${proformas.length} proformas found`}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
