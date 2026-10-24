import React, { useState, useEffect, useMemo } from "react";
import { X, Search, User, Building, Mail, Phone, MapPin, Plus, ArrowRight, Loader2 } from "lucide-react";
import Swal from "sweetalert2";
import axios from "axios";
import { useSelector } from "react-redux";
import API_BASE_URL from "../config/apiBaseUrl";

/**
 * ClientSelectorModal - Unified Modal for Selecting or Creating Clients
 * Used across Proposals, Quotations, Instant Proforma, and Dashboards.
 *
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Closes the modal
 * @param {string} title - Modal heading (e.g. "Create Proposal", "Create Quotation")
 * @param {React.ReactNode} icon - Optional icon next to title
 * @param {string} actionText - Button label for existing client tab (e.g. "Proceed to Builder")
 * @param {function} onProceed - Async callback receiving the selected or newly created client object: (client) => Promise<void> | void
 * @param {string} initialTab - "existing" | "new" (default: "existing")
 * @param {boolean} allowCreateNew - Whether to show the "+ Create New Client" tab (default: true)
 * @param {string} description - Subtext below header
 */
const ClientSelectorModal = ({
  isOpen,
  onClose,
  title = "Select Client",
  icon = null,
  actionText = "Proceed",
  onProceed,
  initialTab = "existing",
  allowCreateNew = true,
  description = "Select an existing client or register a new one to continue.",
  clients: externalClients = null,
  onClientCreated = null,
}) => {
  const { currentUser, token } = useSelector((state) => state.user);

  const [activeTab, setActiveTab] = useState(initialTab); // 'existing' | 'new'

  // Existing Client State
  const [clients, setClients] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [loadingClients, setLoadingClients] = useState(false);
  const [submittingExisting, setSubmittingExisting] = useState(false);

  // New Client State
  const baseClientForm = {
    client_name: "",
    client_organization: "",
    email: "",
    phone: "",
    address: "",
    dg_employee: currentUser?.name || "Admin",
  };
  const [clientForm, setClientForm] = useState(baseClientForm);
  const [submittingNew, setSubmittingNew] = useState(false);

  // Reset & load on open
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || "existing");
      setSelectedClientId(null);
      setKeyword("");
      setClientForm({ ...baseClientForm, dg_employee: currentUser?.name || "Admin" });
      if (Array.isArray(externalClients) && externalClients.length > 0) {
        setClients(externalClients);
      } else {
        fetchClientsList();
      }
    }
  }, [isOpen, initialTab, externalClients]);

  const fetchClientsList = async () => {
    if (!token) return;
    setLoadingClients(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/auth/api/re_calculator/getClientDetails`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setClients(list);
    } catch (err) {
      console.error("Failed to load clients:", err);
    } finally {
      setLoadingClients(false);
    }
  };

  const filteredClients = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((item) =>
      [item.client_name, item.client_organization, item.phone, item.email, item.dg_employee]
        .filter(Boolean)
        .some((val) => String(val).toLowerCase().includes(q))
    );
  }, [clients, keyword]);

  const handleClientFormChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone" && !/^\d{0,10}$/.test(value)) return;
    setClientForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProceedExisting = async () => {
    if (!selectedClientId) return;
    const client = clients.find((c) => String(c.id) === String(selectedClientId));
    if (!client) return;

    setSubmittingExisting(true);
    try {
      await onProceed?.(client);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Action Failed",
        text: err?.response?.data?.message || err?.message || "Something went wrong.",
      });
    } finally {
      setSubmittingExisting(false);
    }
  };

  const handleCreateNewClient = async (e) => {
    e.preventDefault();
    if (!clientForm.client_name?.trim() || !clientForm.phone?.trim()) {
      Swal.fire({ icon: "warning", title: "Required Fields", text: "Client Name and Phone are required." });
      return;
    }

    setSubmittingNew(true);
    try {
      const payload = {
        ...clientForm,
        client_name: clientForm.client_name.trim(),
        client_organization: (clientForm.client_organization || "").trim(),
        email: (clientForm.email || "").trim(),
        phone: clientForm.phone.trim(),
        address: (clientForm.address || "").trim(),
        dg_employee: clientForm.dg_employee || currentUser?.name || "Admin",
      };

      const res = await axios.post(`${API_BASE_URL}/auth/api/re_calculator/insertClientDetails`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.status !== "Success") {
        Swal.fire({
          icon: "error",
          title: "Failed to Add Client",
          text: res.data?.message || "Database error.",
        });
        return;
      }

      let newClientId = res.data?.clientId;
      let createdClientObj = null;

      // Re-fetch clients to get the complete client row
      const latestRes = await axios.get(`${API_BASE_URL}/auth/api/re_calculator/getClientDetails`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = Array.isArray(latestRes.data?.data) ? latestRes.data.data : [];
      setClients(list);

      if (newClientId) {
        createdClientObj = list.find((c) => String(c.id) === String(newClientId));
      }
      if (!createdClientObj) {
        createdClientObj = list.find(
          (c) =>
            (c.client_name || "").trim().toLowerCase() === payload.client_name.toLowerCase() &&
            String(c.phone || "").trim() === payload.phone
        );
      }

      if (createdClientObj) {
        onClientCreated?.(createdClientObj);
        await onProceed?.(createdClientObj);
      } else {
        Swal.fire({
          icon: "info",
          title: "Client Added",
          text: "Client registered successfully. Please select the client from the list to continue.",
        });
        setActiveTab("existing");
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err?.response?.data?.message || "Failed to add new client.",
      });
    } finally {
      setSubmittingNew(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Modal Dialog */}
      <div
        className="relative bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700/60 flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40">
          <div className="flex items-center gap-2.5">
            {icon || <User className="w-5 h-5 text-amber-500 dark:text-amber-400" />}
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-tight">{title}</h2>
              {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs (if allowCreateNew is true) */}
        {allowCreateNew && (
          <div className="flex p-3 sm:p-4 gap-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/50">
            <button
              type="button"
              onClick={() => setActiveTab("existing")}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "existing"
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-sm"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              <User className="w-4 h-4" /> Existing Client
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("new")}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "new"
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-sm"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              <Plus className="w-4 h-4" /> Create New Client
            </button>
          </div>
        )}

        {/* Tab Body */}
        <div className="overflow-y-auto p-4 sm:p-5 no-scrollbar">
          {activeTab === "existing" ? (
            <div className="space-y-4">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Search by name, organization, phone..."
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm outline-none transition-all shadow-sm"
                />
              </div>

              {/* Client List */}
              <div className="space-y-2 max-h-64 sm:max-h-72 overflow-y-auto pr-1">
                {loadingClients ? (
                  <div className="text-center py-10 text-gray-400 text-sm flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-500" /> Loading clients...
                  </div>
                ) : filteredClients.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 dark:text-gray-400 text-sm">
                    {keyword ? "No matching clients found." : "No clients found."}
                  </div>
                ) : (
                  filteredClients.map((client) => {
                    const isSelected = selectedClientId === client.id;
                    return (
                      <div
                        key={client.id}
                        onClick={() => setSelectedClientId(client.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                          isSelected
                            ? "bg-amber-500/10 border-amber-500/60 shadow-sm"
                            : "bg-white dark:bg-gray-800/40 border-gray-200 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between items-center gap-2">
                            <p
                              className={`font-semibold text-sm truncate ${
                                isSelected ? "text-amber-600 dark:text-amber-400" : "text-gray-900 dark:text-white"
                              }`}
                            >
                              {client.client_organization || client.client_name}
                            </p>
                            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full shrink-0">
                              ID: {client.id}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                            {client.client_organization ? client.client_name : client.phone}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                            {client.phone} {client.email && `• ${client.email}`}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                <button
                  type="button"
                  onClick={handleProceedExisting}
                  disabled={!selectedClientId || submittingExisting}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-md"
                >
                  {submittingExisting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      {actionText} <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateNewClient} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Client Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      name="client_name"
                      value={clientForm.client_name}
                      onChange={handleClientFormChange}
                      required
                      placeholder="Full name"
                      className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-amber-500 text-sm outline-none shadow-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Organization
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      name="client_organization"
                      value={clientForm.client_organization}
                      onChange={handleClientFormChange}
                      placeholder="Company / Business name"
                      className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-amber-500 text-sm outline-none shadow-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      name="email"
                      type="email"
                      value={clientForm.email}
                      onChange={handleClientFormChange}
                      placeholder="email@example.com"
                      className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-amber-500 text-sm outline-none shadow-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Phone *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      name="phone"
                      value={clientForm.phone}
                      onChange={handleClientFormChange}
                      required
                      maxLength={10}
                      placeholder="10-digit phone number"
                      className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-amber-500 text-sm outline-none shadow-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                  <textarea
                    name="address"
                    value={clientForm.address}
                    onChange={handleClientFormChange}
                    rows={2}
                    placeholder="Full address (optional)"
                    className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-amber-500 text-sm outline-none shadow-sm"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                <button
                  type="submit"
                  disabled={submittingNew}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl text-sm disabled:opacity-50 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-md"
                >
                  {submittingNew ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      Create & Proceed <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientSelectorModal;
