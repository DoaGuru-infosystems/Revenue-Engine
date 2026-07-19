import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import Swal from "sweetalert2";
import {
  FileText, Save, ArrowLeft, Download, Send, Plus, Trash2, CheckCircle, ChevronDown, ChevronUp, AlignLeft, Building2, Search, Lightbulb, ClipboardList, Target, Calendar, TrendingUp, IndianRupee, ScrollText, Award, PenTool
} from "lucide-react";

import API_BASE_URL from "../config/apiBaseUrl";
import { clearUser } from "../redux/user/userSlice";
import { PROPOSAL_SECTIONS, PROPOSAL_TYPES, BILLING_TYPES, buildInitialSections, buildInitialToggles } from "../config/proposalDefaults";
import { classifyProformaServices } from "../utils/proformaPricing";

const getClientRecord = (payload) => (Array.isArray(payload) ? payload[0] : payload);
const getClientDisplayName = (client) =>
  client?.company_name || client?.client_organization || client?.client_name || "Client";

export default function ProposalBuilderBD() {
  const { clientId, proposalId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser, token } = useSelector((state) => state.user);
  
  const [loading, setLoading] = useState(false);
  const [clientData, setClientData] = useState(null);
  
  const [proposalType, setProposalType] = useState("development");
  const [billingType, setBillingType] = useState("monthly");
  const [billingStartDate, setBillingStartDate] = useState("");
  const [billingEndDate, setBillingEndDate] = useState("");
  
  const [sections, setSections] = useState(buildInitialSections());
  const [toggles, setToggles] = useState(buildInitialToggles());
  
  const [pricingTable, setPricingTable] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);
  
  const [discountType, setDiscountType] = useState("Amount");
  const [discountValue, setDiscountValue] = useState(0);
  const [discountSettings, setDiscountSettings] = useState([]);

  const [predefinedNotes, setPredefinedNotes] = useState([]);
  const [manualNote, setManualNote] = useState("");
  const [proposalStatus, setProposalStatus] = useState("");

  const [openSections, setOpenSections] = useState(
    PROPOSAL_SECTIONS.reduce((acc, sec) => ({ ...acc, [sec.key]: false }), {})
  );

  useEffect(() => {
    fetchClientData();
    fetchPredefinedNotes();
    fetchDiscountSettings();
    if (proposalId) {
      fetchProposalData();
    }
  }, [clientId, proposalId]);

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

  const fetchProposalData = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE_URL}/auth/api/re_calculator/proposal/${proposalId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.status === "Success") {
        const p = data.data;
        setProposalType(p.proposal_type);
        setBillingType(p.billing_type);
        setBillingStartDate(p.billing_start_date ? p.billing_start_date.split('T')[0] : "");
        setBillingEndDate(p.billing_end_date ? p.billing_end_date.split('T')[0] : "");
        setProposalStatus(p.status || "");
        
        const loadedSections = typeof p.sections_json === "string" ? JSON.parse(p.sections_json) : p.sections_json;
        const loadedToggles = typeof p.optional_toggles === "string" ? JSON.parse(p.optional_toggles) : p.optional_toggles;
        const loadedPricing = typeof p.pricing_table_json === "string" ? JSON.parse(p.pricing_table_json) : p.pricing_table_json;
        
        if (typeof loadedSections.cover_page === 'string') {
          loadedSections.cover_page = {
            duration: "1 Month",
            proposal_date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
            proposal_validity: "7 Days",
            prepared_by: "DOAGuru InfoSystems",
            website: "www.doaguru.com"
          };
        }

        setSections({ ...buildInitialSections(), ...loadedSections });
        setToggles({ ...buildInitialToggles(), ...loadedToggles });
        setPricingTable(loadedPricing || []);
        setGrandTotal(p.grand_total_excl_gst || 0);
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

  const addPricingRow = () => {
    setPricingTable([...pricingTable, { service: "", quantity: 1, unit_price: 0, total_price: 0 }]);
  };

  const removePricingRow = (index) => {
    const updated = pricingTable.filter((_, i) => i !== index);
    setPricingTable(updated);
    recalculateTotal(updated);
  };

  const handlePricingChange = (index, field, value) => {
    const updated = [...pricingTable];
    updated[index][field] = value;
    if (field === "quantity" || field === "unit_price") {
      updated[index].total_price = (Number(updated[index].quantity) || 0) * (Number(updated[index].unit_price) || 0);
    }
    setPricingTable(updated);
    recalculateTotal(updated);
  };

  const recalculateTotal = (table) => {
    const total = table.reduce((sum, row) => sum + (Number(row.total_price) || 0), 0);
    setGrandTotal(total);
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
      const sectionsForSave = {
        ...sections,
        terms_conditions: [],
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
        grand_total_excl_gst: grandTotal,
        terms_notes_json: [],
        notes_json: sections['notes_selection'] || [],
        additional_remarks: sections['additional_remarks'] || "",
        client_instructions: sections['client_instructions'] || "",
        created_by: currentUser?.name || "BD",
        updated_by: currentUser?.name || "BD",
      };

      let res;
      if (proposalId) {
        res = await axios.put(`${API_BASE_URL}/auth/api/re_calculator/proposal/${proposalId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        res = await axios.post(`${API_BASE_URL}/auth/api/re_calculator/proposal`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      if (res.data.status === "Success") {
        Swal.fire({ icon: "success", title: "Saved!", text: "Proposal saved successfully.", timer: 1500, showConfirmButton: false });
        const savedId = proposalId || res.data.proposalId;
        
        if (!proposalId) {
          navigate(`/BD/proposal-builder/${clientId}/${savedId}`, { replace: true });
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
    Swal.fire({ icon: "info", title: "Coming Soon", text: "Send to Client integration via Email/WhatsApp will be triggered here." });
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

  const isReadOnly = ["invoiced", "payment_received", "partially_paid"].includes(proposalStatus);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 pb-24">
      {isReadOnly && (
        <div className="max-w-5xl mx-auto mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 shadow-lg">
          <CheckCircle className="w-6 h-6 text-red-400" />
          <div>
            <h4 className="text-red-400 font-bold text-sm">Editing Locked</h4>
            <p className="text-red-300 text-xs mt-0.5">An invoice has been generated for this proposal. Further edits are disabled.</p>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="max-w-5xl mx-auto flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition">
            <ArrowLeft className="w-5 h-5 text-gray-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent">
              {proposalId ? "Edit Proposal" : "Create New Proposal"}
            </h1>
            <p className="text-gray-400 text-sm">Client: {clientData ? getClientDisplayName(clientData) : "Loading..."}</p>
          </div>
        </div>
        <div className="flex gap-3">
          {proposalId && (
            <>
              <button onClick={() => sendToClient()} className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-600/30 transition text-sm font-semibold">
                <Send className="w-4 h-4" /> Send to Client
              </button>
              <button onClick={() => markAsApproved()} className="flex items-center gap-2 px-4 py-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded-xl hover:bg-green-600/30 transition text-sm font-semibold">
                <CheckCircle className="w-4 h-4" /> Mark Approved
              </button>
              <button onClick={() => downloadPdf()} className="flex items-center gap-2 px-4 py-2 bg-yellow-600/20 text-yellow-400 border border-yellow-500/30 rounded-xl hover:bg-yellow-600/30 transition text-sm font-semibold">
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Basic Info Setup */}
        <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-red-400" /> Setup Proposal
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Proposal Category</label>
              <select value={proposalType} onChange={e => setProposalType(e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-3 text-white focus:border-red-500 outline-none">
                {PROPOSAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Billing Type</label>
              <select value={billingType} onChange={e => setBillingType(e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-3 text-white focus:border-red-500 outline-none">
                {BILLING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            {billingType === "custom" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Start Date</label>
                  <input type="date" value={billingStartDate} onClick={(e) => e.target.showPicker && e.target.showPicker()} onChange={e => setBillingStartDate(e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-3 text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">End Date</label>
                  <input type="date" value={billingEndDate} onClick={(e) => e.target.showPicker && e.target.showPicker()} onChange={e => setBillingEndDate(e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-3 text-white" />
                </div>
              </>
            )}
          </div>
        </div>

        {/* 13 Sections */}
        <div className="space-y-4">
          {PROPOSAL_SECTIONS.map((sec, idx) => {
            const isOpen = openSections[sec.key];
            const isOptional = sec.optional;
            const isEnabled = !isOptional || toggles[sec.key];

            return (
              <div key={sec.key} className={`bg-gray-800/30 backdrop-blur-xl border ${isOpen ? 'border-red-500/50 shadow-lg shadow-red-900/20' : 'border-gray-700/50'} rounded-2xl overflow-hidden transition-all duration-300`}>
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/50" onClick={() => toggleSection(sec.key)}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-700/50 flex items-center justify-center text-red-400">
                      {sec.key === 'pricing_investment' ? <IndianRupee className="w-4 h-4"/> : <FileText className="w-4 h-4"/>}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{idx + 1}. {sec.label}</h3>
                      <p className="text-xs text-gray-400">{sec.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {isOptional && (
                      <label className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <span className="text-xs text-gray-400 font-medium uppercase">Include</span>
                        <input 
                          type="checkbox" 
                          checked={toggles[sec.key]} 
                          onChange={(e) => setToggles(prev => ({ ...prev, [sec.key]: e.target.checked }))} 
                          className="w-4 h-4 accent-red-500" 
                        />
                      </label>
                    )}
                    {isOpen ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                  </div>
                </div>

                {/* Body */}
                {isOpen && (
                  <div className={`p-4 border-t border-gray-700/50 bg-gray-900/30 ${!isEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                    
                    {sec.type === 'textarea' || sec.type === 'readonly' ? (
                      <textarea
                        value={sections[sec.key] || ""}
                        onChange={(e) => handleSectionChange(sec.key, e.target.value)}
                        readOnly={sec.type === 'readonly'}
                        className="w-full h-48 bg-gray-900/50 border border-gray-700 rounded-xl p-4 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-y text-sm leading-relaxed"
                        placeholder="Enter content here..."
                      />
                    ) : sec.type === 'cover_fields' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Client Name</label>
                            <input type="text" value={clientData?.client_name || getClientDisplayName(clientData)} readOnly className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-gray-400 cursor-not-allowed" />
                          </div>
                          <div className="space-y-3">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Organization</label>
                            <input type="text" value={clientData?.company_name || clientData?.client_organization || getClientDisplayName(clientData)} readOnly className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-gray-400 cursor-not-allowed" />
                          </div>
                          <div className="space-y-3">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Duration</label>
                            <input type="text" value={sections[sec.key]?.duration || ''} onChange={e => handleSectionChange(sec.key, {...sections[sec.key], duration: e.target.value})} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white focus:border-red-500 outline-none" />
                          </div>
                          <div className="space-y-3">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Proposal Date</label>
                            <input type="text" value={sections[sec.key]?.proposal_date || ''} onChange={e => handleSectionChange(sec.key, {...sections[sec.key], proposal_date: e.target.value})} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white focus:border-red-500 outline-none" />
                          </div>
                          <div className="space-y-3">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Proposal Validity</label>
                            <input type="text" value={sections[sec.key]?.proposal_validity || ''} onChange={e => handleSectionChange(sec.key, {...sections[sec.key], proposal_validity: e.target.value})} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white focus:border-red-500 outline-none" />
                          </div>
                          <div className="space-y-3">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Prepared By</label>
                            <input type="text" value={sections[sec.key]?.prepared_by || ''} onChange={e => handleSectionChange(sec.key, {...sections[sec.key], prepared_by: e.target.value})} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white focus:border-red-500 outline-none" />
                          </div>
                          <div className="space-y-3">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Website</label>
                            <input type="text" value={sections[sec.key]?.website || ''} onChange={e => handleSectionChange(sec.key, {...sections[sec.key], website: e.target.value})} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white focus:border-red-500 outline-none" />
                          </div>
                        </div>
                    ) : sec.type === 'pricing_table' ? (
                      <div className="space-y-4">
                        <div className="overflow-x-auto">
                          {(() => {
                            const tableWithIndex = pricingTable.map((item, originalIndex) => ({ ...item, originalIndex }));
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
                                <div className="mb-6">
                                  <h4 className="text-white font-bold mb-2">{title}</h4>
                                  <table className="w-full text-left text-sm">
                                    <thead>
                                      <tr className="border-b border-gray-700 text-gray-400 uppercase tracking-wider text-xs">
                                        <th className="pb-3 font-semibold">Service / Deliverable</th>
                                        <th className="pb-3 font-semibold w-24">Quantity</th>
                                        <th className="pb-3 font-semibold w-32">Unit Price (₹)</th>
                                        <th className="pb-3 font-semibold w-32">Total (₹)</th>
                                        <th className="pb-3 font-semibold w-12"></th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {items.map((row, idx) => (
                                        <tr key={`${row.originalIndex}-${idx}`} className="border-b border-gray-800">
                                          <td className="py-2 pr-2">
                                            <input type="text" value={row.service} onChange={e => handlePricingChange(row.originalIndex, 'service', e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-2 text-white" placeholder="Service name" />
                                          </td>
                                          <td className="py-2 pr-2">
                                            <input type="number" value={row.quantity} onChange={e => handlePricingChange(row.originalIndex, 'quantity', e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-2 text-white" min="1" disabled={isAds} />
                                          </td>
                                          <td className="py-2 pr-2">
                                            <input type="number" value={row.unit_price} onChange={e => handlePricingChange(row.originalIndex, 'unit_price', e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-2 text-white" min="0" />
                                          </td>
                                          <td className="py-2 pr-2 text-yellow-400 font-semibold">
                                            ₹{isAds ? row.budget : row.total_price}
                                          </td>
                                          <td className="py-2">
                                            <button onClick={() => removePricingRow(row.originalIndex)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              );
                            };

                            if (pricingTable.length === 0) {
                              return (
                                <table className="w-full text-left text-sm">
                                  <thead>
                                    <tr className="border-b border-gray-700 text-gray-400 uppercase tracking-wider text-xs">
                                      <th className="pb-3 font-semibold">Service / Deliverable</th>
                                      <th className="pb-3 font-semibold w-24">Quantity</th>
                                      <th className="pb-3 font-semibold w-32">Unit Price (₹)</th>
                                      <th className="pb-3 font-semibold w-32">Total (₹)</th>
                                      <th className="pb-3 font-semibold w-12"></th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr><td colSpan="5" className="p-4 text-center text-gray-500">No services added</td></tr>
                                  </tbody>
                                </table>
                              );
                            }

                            return (
                              <>
                                {renderTable("DM Services", dmItems)}
                                {renderTable("Ads Services", adsServices, true)}
                                {renderTable("Complimentary Services", complimentaryItems)}
                              </>
                            );
                          })()}
                        </div>
                        <button onClick={addPricingRow} className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 font-semibold py-2">
                          <Plus className="w-4 h-4" /> Add Item
                        </button>
                        <div className="flex justify-end pt-4 border-t border-gray-700/50 mt-4">
                          <div className="w-1/2 space-y-3">
                            <div className="flex items-center gap-3">
                              <select 
                                value={discountType} 
                                onChange={(e) => setDiscountType(e.target.value)}
                                className="bg-gray-900/50 border border-gray-700 rounded-lg p-2 text-white w-1/3"
                              >
                                <option value="Amount">Amount (₹)</option>
                                <option value="Percentage">Percentage (%)</option>
                              </select>
                              <input 
                                type="number" 
                                value={discountValue} 
                                onChange={(e) => setDiscountValue(Number(e.target.value))}
                                className="bg-gray-900/50 border border-gray-700 rounded-lg p-2 text-white w-2/3"
                                placeholder="Discount Value"
                                min="0"
                              />
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">Subtotal (Excl. GST)</p>
                              <p className="text-lg font-semibold text-white">₹{grandTotal.toLocaleString()}</p>
                              
                              {discountValue > 0 && (
                                <>
                                  <p className="text-sm text-red-400 uppercase tracking-wider mt-2 mb-1">Discount</p>
                                  <p className="text-md font-semibold text-red-400">
                                    - ₹{discountType === 'Percentage' ? ((grandTotal * discountValue) / 100).toLocaleString() : discountValue.toLocaleString()}
                                  </p>
                                </>
                              )}

                              <p className="text-sm text-gray-400 uppercase tracking-wider mt-3 mb-1">Grand Total (Excl. GST)</p>
                              <p className="text-2xl font-bold text-white">
                                ₹{Math.max(0, grandTotal - (discountType === 'Percentage' ? (grandTotal * discountValue) / 100 : discountValue)).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : sec.type === 'combined_notes_tc' ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Left: Available Predefined Notes */}
                          <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700 h-64 overflow-y-auto">
                            <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Available Notes</h4>
                            <div className="space-y-2">
                              {predefinedNotes.map((note) => (
                                <div key={note.id} className="flex items-center justify-between p-2 hover:bg-gray-800 rounded-lg group">
                                  <span className="text-sm text-gray-400 truncate w-3/4" title={note.note_text}>{note.note_text}</span>
                                  <button onClick={() => handleAddPredefinedNote(note)} className="text-red-400 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition">
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Right: Selected Notes & Custom Input */}
                          <div className="space-y-4 h-64 flex flex-col">
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                value={manualNote} 
                                onChange={(e) => setManualNote(e.target.value)} 
                                className="flex-1 bg-gray-900/50 border border-gray-700 rounded-lg p-2 text-sm text-white focus:border-red-500 outline-none" 
                                placeholder="Add custom note..." 
                              />
                              <button onClick={handleAddManualNote} className="px-4 bg-red-600 hover:bg-red-500 text-white rounded-lg transition text-sm font-semibold">Add</button>
                            </div>
                            <div className="flex-1 bg-gray-900/50 p-4 rounded-xl border border-gray-700 overflow-y-auto">
                              <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Selected Notes</h4>
                              <div className="space-y-2">
                                {(sections['notes_selection'] || []).map((n, i) => (
                                  <div key={i} className="flex items-start justify-between gap-2 p-2 bg-gray-800 rounded-lg">
                                    <span className="text-sm text-gray-300">{n.note_name}</span>
                                    <button onClick={() => removeNote(i)} className="text-red-400 p-1 hover:bg-red-400/20 rounded transition mt-0.5">
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                                {(!sections['notes_selection'] || sections['notes_selection'].length === 0) && (
                                  <p className="text-sm text-gray-500 italic text-center mt-4">No notes selected.</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : sec.type === 'approval' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-300 border-b border-gray-700 pb-2">Our Signature</h4>
                          <input type="text" placeholder="Signatory Name" value={sections[sec.key]?.our_signatory_name || ''} onChange={e => handleSectionChange(sec.key, {...sections[sec.key], our_signatory_name: e.target.value})} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white" />
                          <input type="text" placeholder="Designation" value={sections[sec.key]?.our_signatory_designation || ''} onChange={e => handleSectionChange(sec.key, {...sections[sec.key], our_signatory_designation: e.target.value})} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white" />
                        </div>
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-300 border-b border-gray-700 pb-2">Client Approval</h4>
                          <input type="text" placeholder="Client Name" value={sections[sec.key]?.client_signatory_name || ''} onChange={e => handleSectionChange(sec.key, {...sections[sec.key], client_signatory_name: e.target.value})} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white" />
                          <input type="text" placeholder="Designation" value={sections[sec.key]?.client_signatory_designation || ''} onChange={e => handleSectionChange(sec.key, {...sections[sec.key], client_signatory_designation: e.target.value})} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white" />
                        </div>
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
                            {pricingTable.length === 0 ? (
                              <tr>
                                <td colSpan="3" className="p-8 text-center text-gray-500 text-sm">No deliverables added yet. Please select a plan or custom services.</td>
                              </tr>
                            ) : (
                              pricingTable.map((row, i) => (
                                <tr key={`sow-${i}`} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition">
                                  <td className="p-3 text-gray-300 font-medium">{row.category_name || '-'}</td>
                                  <td className="p-3 text-gray-300">
                                    {row.service_name || row.service || '-'}
                                    {row.editing_type_name ? <span className="text-gray-500 text-xs ml-1">({row.editing_type_name})</span> : ''}
                                  </td>
                                  <td className="p-3 text-center text-gray-300">{row.quantity || '-'}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-gray-500 italic text-sm">Table layout placeholder — Use text for now or expand this component.</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Bar (Sticky Bottom) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900/90 backdrop-blur-md border-t border-gray-800 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
            Status: <span className="text-red-400">{proposalId ? 'Draft / Saved' : 'Unsaved'}</span>
          </div>
          <div className="flex gap-3">
            {!isReadOnly && (
              <>
                <button 
                  onClick={() => saveProposal(false)}
                  disabled={loading}
                  className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 rounded-xl font-semibold transition"
                >
                  {loading ? "Saving..." : "Save Draft"}
                </button>
                <button 
                  onClick={() => saveProposal(true)}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-xl font-semibold shadow-lg shadow-red-900/20 transition"
                >
                  <Save className="w-4 h-4" /> Save & Generate PDF
                </button>
              </>
            )}
            {isReadOnly && (
              <button
                onClick={() => downloadPdf(proposalId)}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white rounded-xl font-semibold shadow-lg transition"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
