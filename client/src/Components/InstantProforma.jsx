import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Mail,
  MapPin,
  Phone,
  Plus,
  ReceiptText,
  Save,
  Search,
  Trash2,
  User,
  X,
  FileText,
} from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/apiBaseUrl";

const paymentModes = ["Payment Cheque", "Net Banking", "UPI", "Cash"];

const baseProformaForm = {
  client_name: "",
  client_organization: "",
  email: "",
  phone: "",
  address: "",
  dg_employee: "",
  duration_start_date: "",
  duration_end_date: "",
  payment_mode: "",
  bill_type: "NON_GST",
  client_gst_no: "",
  client_pan_no: "",
  notes_snapshot: [],
};

const baseClientForm = {
  client_name: "",
  client_organization: "",
  email: "",
  phone: "",
  address: "",
  dg_employee: "",
};

// ── Shared style tokens ───────────────────────────────────────────────────
// Centralised so every field / button in this screen stays visually
// consistent and themes (light + dark) in one place.
const inputClass =
  "w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-950/60 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200 ease-out focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/50 hover:border-gray-400 dark:hover:border-white/20";

const labelClass = "mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400";

const cardClass =
  "rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-xl dark:backdrop-blur-xl";

const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-all duration-200 ease-out hover:from-orange-600 hover:to-red-700 hover:shadow-orange-500/35 disabled:cursor-not-allowed disabled:opacity-50 disabled:grayscale disabled:shadow-none";

const btnPrimarySmall =
  "inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-orange-500/20 transition-all duration-200 ease-out hover:bg-orange-600";

const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all duration-200 ease-out hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white";

const iconBtn =
  "rounded-xl p-2 text-gray-400 dark:text-gray-500 transition-all duration-200 ease-out hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white";

function InstantProforma({ onBack, handleSessionExpired }) {
  const baseURL = API_BASE_URL;
  const navigate = useNavigate();
  const { currentUser, token } = useSelector((state) => state.user);

  const [proformaForm, setProformaForm] = useState(baseProformaForm);
  const [clientForm, setClientForm] = useState(baseClientForm);
  const [clients, setClients] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [loadingClients, setLoadingClients] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [savingClient, setSavingClient] = useState(false);
  const [predefinedNotes, setPredefinedNotes] = useState([]);
  const [customNote, setCustomNote] = useState("");
  const [selectedPredefinedNote, setSelectedPredefinedNote] = useState("");

  const startRef = useRef(null);
  const endRef = useRef(null);
  const isGST = proformaForm.bill_type === "GST";

  useEffect(() => {
    if (!currentUser?.name) return;
    setProformaForm((prev) => (prev.dg_employee ? prev : { ...prev, dg_employee: currentUser.name }));
    setClientForm((prev) => (prev.dg_employee ? prev : { ...prev, dg_employee: currentUser.name }));
  }, [currentUser?.name]);

  const fetchClients = useCallback(async () => {
    if (!token) return [];
    setLoadingClients(true);
    try {
      const response = await axios.get(`${baseURL}/auth/api/re_calculator/getClientDetails`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = Array.isArray(response?.data?.data) ? response.data.data : [];
      setClients(list);
      return list;
    } catch (error) {
      if (error.response?.status === 401) handleSessionExpired();
      else Swal.fire({ icon: "error", title: "Error", text: "Failed to fetch clients." });
      return [];
    } finally {
      setLoadingClients(false);
    }
  }, [baseURL, handleSessionExpired, token]);

  const fetchPredefinedNotes = useCallback(async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${baseURL}/auth/api/re_calculator/getNoteData`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data && response.data.data) {
        setPredefinedNotes(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching predefined notes:", error);
    }
  }, [baseURL, token]);

  useEffect(() => {
    fetchClients();
    fetchPredefinedNotes();
  }, [fetchClients, fetchPredefinedNotes]);

  const filteredClients = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    if (!query) return clients;
    return clients.filter((item) =>
      [item.client_name, item.client_organization, item.phone, item.email, item.dg_employee]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(query))
    );
  }, [clients, keyword]);

  const selectedClient = useMemo(
    () => clients.find((item) => String(item.id) === String(selectedClientId)) || null,
    [clients, selectedClientId]
  );

  const durationDays = useMemo(() => {
    if (!proformaForm.duration_start_date || !proformaForm.duration_end_date) return "";
    const start = new Date(proformaForm.duration_start_date);
    const end = new Date(proformaForm.duration_end_date);
    if (isNaN(start) || isNaN(end)) return "";
    const days = Math.floor((end - start) / 86400000) + 1;
    return days > 0 ? days : "";
  }, [proformaForm.duration_end_date, proformaForm.duration_start_date]);

  const applyClient = useCallback(
    (client) => {
      if (!client) return;
      setSelectedClientId(client.id);
      setProformaForm((prev) => ({
        ...prev,
        client_name: client.client_name || "",
        client_organization: client.client_organization || "",
        email: client.email || "",
        phone: client.phone || "",
        address: client.address || "",
        dg_employee: client.dg_employee || prev.dg_employee || currentUser?.name || "",
      }));
    },
    [currentUser?.name]
  );

  const handleProformaChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone" && !/^\d{0,10}$/.test(value)) return;
    setProformaForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleClientChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone" && !/^\d{0,10}$/.test(value)) return;
    setClientForm((prev) => ({ ...prev, [name]: value }));
  };

  const openDatePicker = (ref) => {
    const input = ref.current;
    if (!input) return;
    if (typeof input.showPicker === "function") input.showPicker();
    else input.focus();
  };

  const openAddClientModal = () => {
    setClientForm({ ...baseClientForm, dg_employee: currentUser?.name || "" });
    setShowClientModal(true);
  };

  const closeAddClientModal = () => {
    setShowClientModal(false);
    setClientForm({ ...baseClientForm, dg_employee: currentUser?.name || "" });
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    setSavingClient(true);
    try {
      const payload = { ...clientForm, dg_employee: clientForm.dg_employee || currentUser?.name || "" };
      const response = await axios.post(`${baseURL}/auth/api/re_calculator/insertClientDetails`, payload, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (response?.data?.status !== "Success") {
        Swal.fire({ icon: "error", title: "Error", text: response?.data?.message || "Failed to add client." });
        return;
      }
      const latestClients = await fetchClients();
      const matched = latestClients.find(
        (item) =>
          (item.client_name || "").trim().toLowerCase() === (payload.client_name || "").trim().toLowerCase() &&
          String(item.phone || "").trim() === String(payload.phone || "").trim()
      );
      if (matched) applyClient(matched);
      closeAddClientModal();
      Swal.fire({ icon: "success", title: "Client Added", text: "Client saved and selected.", showConfirmButton: false, timer: 1200 });
    } catch (error) {
      if (error.response?.status === 401) handleSessionExpired();
      else Swal.fire({ icon: "error", title: "Error", text: "Something went wrong while adding client." });
    } finally {
      setSavingClient(false);
    }
  };

  const resetProformaForm = () => {
    if (selectedClient) {
      applyClient(selectedClient);
      setProformaForm((prev) => ({
        ...prev,
        bill_type: "NON_GST",
        duration_start_date: "",
        duration_end_date: "",
        payment_mode: "",
        client_gst_no: "",
        client_pan_no: "",
      }));
      return;
    }
    setProformaForm({ ...baseProformaForm, dg_employee: currentUser?.name || "" });
  };

  const isFormInvalid =
    !proformaForm.client_name ||
    !proformaForm.phone ||
    !proformaForm.payment_mode ||
    !proformaForm.duration_start_date ||
    !proformaForm.duration_end_date;

  const handleSubmitProforma = (e) => {
    e?.preventDefault?.();

    const startValue = proformaForm.duration_start_date;
    const endValue = proformaForm.duration_end_date;

    if (startValue && endValue) {
      const startDate = new Date(startValue);
      const endDate = new Date(endValue);

      if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime()) && endDate < startDate) {
        Swal.fire({
          icon: "warning",
          title: "Invalid Duration",
          text: "End date must be greater than or equal to start date.",
        });
        return;
      }
    }

    navigate("/admin/invoice-services", {
      state: {
        proformaDraft: proformaForm,
        selectedClient,
      },
    });
  };

  const summaryRows = [
    { label: "Client", value: proformaForm.client_name },
    { label: "Phone", value: proformaForm.phone },
    { label: "Bill Type", value: proformaForm.bill_type === "GST" ? "GST Bill" : "Non-GST Bill" },
    {
      label: "Duration",
      value:
        proformaForm.duration_start_date && proformaForm.duration_end_date
          ? `${proformaForm.duration_start_date} → ${proformaForm.duration_end_date}`
          : null,
    },
    { label: "Total Days", value: durationDays ? `${durationDays} days` : null },
    { label: "Payment", value: proformaForm.payment_mode },
    { label: "Client ID", value: selectedClient ? `#${selectedClient.id}` : null },
  ];

  return (
    <div className="animate-fade-in">
      {/* Top bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBack} className={btnSecondary}>
          <ArrowLeft size={15} /> Back to options
        </button>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={12} /> Client Based Mode
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* ── Client List ── */}
        <div className={`${cardClass} p-4 sm:p-5 xl:col-span-3`}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">Clients</h2>
              {clients.length > 0 && (
                <span className="mt-1 inline-flex items-center rounded-full bg-gray-100 dark:bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-gray-600 dark:text-gray-300">
                  {filteredClients.length} of {clients.length}
                </span>
              )}
            </div>
            <button type="button" onClick={openAddClientModal} className={btnPrimarySmall}>
              <Plus size={13} /> Add Client
            </button>
          </div>

          <div className="relative mb-3.5 flex items-center text-gray-400 dark:text-gray-500 focus-within:text-orange-500">
            <Search className="pointer-events-none absolute left-3 h-4 w-4" />
            <input
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search clients..."
              className={`${inputClass} pl-9`}
            />
          </div>

          <div className="flex max-h-[31rem] flex-col gap-2 overflow-y-auto pr-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {loadingClients && (
              <div className="py-12 text-center text-[13px] text-gray-400 dark:text-gray-500">
                <div className="mb-2 text-2xl text-orange-500/50">◌</div>
                Loading clients...
              </div>
            )}
            {!loadingClients && filteredClients.length === 0 && (
              <div className="py-12 text-center text-[13px] text-gray-400 dark:text-gray-500">No clients found.</div>
            )}
            {!loadingClients &&
              filteredClients.map((client) => {
                const active = String(selectedClientId) === String(client.id);
                return (
                  <button
                    type="button"
                    key={client.id}
                    onClick={() => applyClient(client)}
                    className={`w-full rounded-xl border p-3 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 ${
                      active
                        ? "border-orange-500/30 bg-orange-500/10"
                        : "border-transparent hover:border-gray-200 dark:hover:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                          active
                            ? "bg-orange-500/20 text-orange-600 dark:text-orange-400"
                            : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        <User size={15} />
                      </div>
                      <div className="min-w-0">
                        <div
                          className={`truncate text-[13px] font-semibold ${
                            active ? "text-orange-600 dark:text-orange-400" : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {client.client_organization || client.client_name}
                        </div>
                        <div className="mt-0.5 truncate text-[11.5px] text-gray-500 dark:text-gray-400">
                          {client.client_organization ? client.client_name : client.phone}
                        </div>
                        <div className="mt-0.5 truncate text-[10.5px] text-gray-400 dark:text-gray-500">
                          {client.phone}
                          {client.email ? ` · ${client.email}` : ""}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>

        {/* ── Form + Summary ── */}
        <div className="flex flex-col gap-6 xl:col-span-9 lg:flex-row">
          {/* Proforma Form */}
          <form onSubmit={handleSubmitProforma} noValidate className={`${cardClass} flex-1 p-5 sm:p-7`}>
            <div className="mb-6 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 ring-1 ring-inset ring-orange-500/20">
                  <ReceiptText size={16} className="text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">Proforma Form</h2>
                  <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">Fill in all required fields</p>
                </div>
              </div>
              {selectedClient && (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-[10px] font-medium text-orange-600 dark:text-orange-400">
                  <CheckCircle2 size={11} /> Client #{selectedClient.id}
                </span>
              )}
            </div>

            {/* Client Details Section */}
            <div className="mb-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                Client Details
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="client_name" className={labelClass}>
                    Client Name
                  </label>
                  <input
                    id="client_name"
                    name="client_name"
                    value={proformaForm.client_name}
                    onChange={handleProformaChange}
                    placeholder="Full name"
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="client_organization" className={labelClass}>
                    Organization
                  </label>
                  <div className="relative flex items-center">
                    <Building2 className="pointer-events-none absolute left-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <input
                      id="client_organization"
                      name="client_organization"
                      value={proformaForm.client_organization}
                      onChange={handleProformaChange}
                      placeholder="Company name"
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className={labelClass}>
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="pointer-events-none absolute left-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={proformaForm.email}
                      onChange={handleProformaChange}
                      placeholder="email@example.com"
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="phone" className={labelClass}>
                    Phone Number
                  </label>
                  <div className="relative flex items-center">
                    <Phone className="pointer-events-none absolute left-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <input
                      id="phone"
                      name="phone"
                      value={proformaForm.phone}
                      onChange={handleProformaChange}
                      placeholder="10-digit number"
                      maxLength={10}
                      className={`${inputClass} pl-9`}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="mt-3.5">
                <label htmlFor="address" className={labelClass}>
                  Address
                </label>
                <div className="relative flex items-start">
                  <MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <textarea
                    id="address"
                    name="address"
                    value={proformaForm.address}
                    onChange={handleProformaChange}
                    rows={2}
                    placeholder="Client's full address"
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </div>
            </div>

            <div className="mb-6 h-px w-full bg-gray-200 dark:bg-white/10" />

            {/* Proforma Details Section */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                Profarma  Details
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="bill_type" className={labelClass}>
                    Bill Type
                  </label>
                  <div className="relative flex items-center">
                    <select
                      id="bill_type"
                      name="bill_type"
                      value={proformaForm.bill_type}
                      onChange={handleProformaChange}
                      className={`${inputClass} appearance-none pr-9`}
                    >
                      <option value="NON_GST">Non-GST Bill</option>
                      <option value="GST">GST Bill</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  </div>
                </div>
                <div>
                  <label htmlFor="payment_mode" className={labelClass}>
                    Payment Mode
                  </label>
                  <div className="relative flex items-center">
                    <CreditCard className="pointer-events-none absolute left-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <select
                      id="payment_mode"
                      name="payment_mode"
                      value={proformaForm.payment_mode}
                      onChange={handleProformaChange}
                      className={`${inputClass} appearance-none pl-9 pr-9`}
                      required
                    >
                      <option value="">Select mode</option>
                      {paymentModes.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  </div>
                </div>
                <div>
                  <label htmlFor="duration_start_date" className={labelClass}>
                    Duration Start
                  </label>
                  <div className="relative">
                    <input
                      ref={startRef}
                      id="duration_start_date"
                      type="date"
                      name="duration_start_date"
                      value={proformaForm.duration_start_date}
                      onChange={handleProformaChange}
                      className={`${inputClass} pr-11 [color-scheme:light] dark:[color-scheme:dark]`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => openDatePicker(startRef)}
                      aria-label="Open start date picker"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 dark:text-gray-500 transition-all duration-200 ease-out hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-white"
                    >
                      <CalendarDays size={14} />
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="duration_end_date" className={labelClass}>
                    Duration End
                  </label>
                  <div className="relative">
                    <input
                      ref={endRef}
                      id="duration_end_date"
                      type="date"
                      name="duration_end_date"
                      value={proformaForm.duration_end_date}
                      min={proformaForm.duration_start_date || undefined}
                      onChange={handleProformaChange}
                      className={`${inputClass} pr-11 [color-scheme:light] dark:[color-scheme:dark]`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => openDatePicker(endRef)}
                      aria-label="Open end date picker"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 dark:text-gray-500 transition-all duration-200 ease-out hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-white"
                    >
                      <CalendarDays size={14} />
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="dg_employee" className={labelClass}>
                    DG Employee
                  </label>
                  <input
                    id="dg_employee"
                    name="dg_employee"
                    value={proformaForm.dg_employee}
                    onChange={handleProformaChange}
                    placeholder="Employee name"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor={isGST ? "client_gst_no" : "client_pan_no"} className={labelClass}>
                    {isGST ? "Client GST No." : "Client PAN No."}
                  </label>
                  <input
                    id={isGST ? "client_gst_no" : "client_pan_no"}
                    name={isGST ? "client_gst_no" : "client_pan_no"}
                    value={isGST ? proformaForm.client_gst_no : proformaForm.client_pan_no}
                    onChange={handleProformaChange}
                    placeholder={isGST ? "Enter GST number" : "Enter PAN number"}
                    className={inputClass}
                    maxLength={isGST ? 15 : 10}
                    required={isGST}
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="mt-6">
              <label className={labelClass}>Terms &amp; Conditions (Notes)</label>

              <div className="relative mb-3">
                <select
                  value={selectedPredefinedNote}
                  onChange={(e) => {
                    const selectedVal = e.target.value;
                    if (!selectedVal) return;
                    setProformaForm((prev) => {
                      const arr = Array.isArray(prev.notes_snapshot) ? prev.notes_snapshot : [];
                      if (arr.some((n) => n.note_name === selectedVal)) return prev;
                      return { ...prev, notes_snapshot: [...arr, { id: Date.now(), note_name: selectedVal }] };
                    });
                    setSelectedPredefinedNote("");
                  }}
                  className={`${inputClass} appearance-none pr-9`}
                >
                  <option value="">-- Select Predefined Note --</option>
                  {predefinedNotes
                    .filter((note) => {
                      const noteText = note.note_text || note.note_name;
                      const arr = Array.isArray(proformaForm.notes_snapshot) ? proformaForm.notes_snapshot : [];
                      return !arr.some((n) => n.note_name === noteText);
                    })
                    .map((note) => (
                      <option key={note.id} value={note.note_text || note.note_name}>
                        {note.note_text || note.note_name}
                      </option>
                    ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              </div>

              <div className="mb-3 flex flex-col gap-2.5 sm:flex-row sm:items-center">
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="Enter custom note here"
                  className={`${inputClass} flex-1`}
                />
                <button
                  type="button"
                  className={`${btnSecondary} shrink-0 whitespace-nowrap`}
                  onClick={() => {
                    if (!customNote.trim()) return;
                    setProformaForm((prev) => {
                      const arr = Array.isArray(prev.notes_snapshot) ? prev.notes_snapshot : [];
                      return { ...prev, notes_snapshot: [...arr, { id: Date.now(), note_name: customNote.trim() }] };
                    });
                    setCustomNote("");
                  }}
                >
                  <Plus size={14} /> Add Custom
                </button>
              </div>

              {Array.isArray(proformaForm.notes_snapshot) && proformaForm.notes_snapshot.length > 0 && (
                <div className="mt-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] p-4">
                  <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Selected Notes
                  </div>
                  <ul className="flex list-decimal flex-col gap-2.5 pl-5 text-[13px] text-gray-700 dark:text-gray-300">
                    {proformaForm.notes_snapshot.map((note, idx) => (
                      <li key={note.id || idx}>
                        <div className="flex items-start justify-between gap-3">
                          <span className="flex-1 leading-relaxed">{note.note_name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setProformaForm((prev) => ({
                                ...prev,
                                notes_snapshot: prev.notes_snapshot.filter(
                                  (n) => (n.id || n.note_name) !== (note.id || note.note_name)
                                ),
                              }));
                            }}
                            aria-label="Remove note"
                            className="shrink-0 rounded-lg border border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 p-1.5 text-rose-600 dark:text-rose-400 transition-all duration-200 ease-out hover:bg-rose-100 dark:hover:bg-rose-500/20"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-7 flex flex-wrap gap-2.5 border-t border-gray-200 dark:border-white/10 pt-5">
              <button type="button" onClick={resetProformaForm} className={btnSecondary}>
                Reset
              </button>
              <button type="submit" disabled={isFormInvalid} className={btnPrimary}>
                <Save size={14} /> Save Draft
              </button>
            </div>
          </form>

          {/* Quick Summary Panel */}
          <aside className={`${cardClass} w-full self-start p-5 sm:p-6 lg:w-72 lg:shrink-0`}>
            <div className="mb-5 flex items-center gap-2">
              <FileText size={14} className="text-orange-500" />
              <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-orange-500/80">Quick Summary</span>
            </div>

            <dl className="divide-y divide-gray-200 dark:divide-white/10">
              {summaryRows.map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</dt>
                  <dd
                    className={`max-w-[60%] truncate text-right text-sm font-semibold ${
                      !value ? "italic text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    {value || "—"}
                  </dd>
                </div>
              ))}
            </dl>

            {durationDays > 0 && (
              <div className="mt-4 rounded-xl border border-orange-500/15 bg-orange-500/[0.07] px-4 py-3 text-center">
                <div className="font-['Cormorant_Garamond',serif] text-[26px] font-bold tabular-nums text-orange-500">
                  {durationDays}
                </div>
                <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-orange-500/60">
                  Billing Days
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* ─── Add Client Modal ─── */}
      {showClientModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 p-4 backdrop-blur-sm"
          onClick={closeAddClientModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] p-6">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Add New Client</h3>
                <p className="mt-0.5 text-[11.5px] text-gray-400 dark:text-gray-500">Fill in the client's information</p>
              </div>
              <button type="button" onClick={closeAddClientModal} aria-label="Close" className={iconBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddClient} className="flex flex-col gap-3.5 p-6">
              <div>
                <label htmlFor="modal_client_name" className={labelClass}>
                  Client Name
                </label>
                <input
                  id="modal_client_name"
                  name="client_name"
                  value={clientForm.client_name}
                  onChange={handleClientChange}
                  className={inputClass}
                  placeholder="Full name"
                  required
                />
              </div>
              <div>
                <label htmlFor="modal_client_organization" className={labelClass}>
                  Organization
                </label>
                <input
                  id="modal_client_organization"
                  name="client_organization"
                  value={clientForm.client_organization}
                  onChange={handleClientChange}
                  className={inputClass}
                  placeholder="Company / Organization"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="modal_email" className={labelClass}>
                    Email
                  </label>
                  <input
                    id="modal_email"
                    name="email"
                    type="email"
                    value={clientForm.email}
                    onChange={handleClientChange}
                    className={inputClass}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="modal_phone" className={labelClass}>
                    Phone
                  </label>
                  <input
                    id="modal_phone"
                    name="phone"
                    value={clientForm.phone}
                    onChange={handleClientChange}
                    className={inputClass}
                    placeholder="10-digit"
                    maxLength={10}
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="modal_address" className={labelClass}>
                  Address
                </label>
                <textarea
                  id="modal_address"
                  name="address"
                  value={clientForm.address}
                  onChange={handleClientChange}
                  rows={2}
                  className={inputClass}
                  placeholder="Full address"
                />
              </div>

              <div className="mt-1 flex justify-end gap-2.5 border-t border-gray-200 dark:border-white/10 pt-4">
                <button type="button" onClick={closeAddClientModal} className={btnSecondary}>
                  Cancel
                </button>
                <button type="submit" disabled={savingClient} className={btnPrimary}>
                  <Plus size={14} /> {savingClient ? "Saving..." : "Create Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default InstantProforma;