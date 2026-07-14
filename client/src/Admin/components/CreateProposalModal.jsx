import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, User, Building, Mail, Phone, MapPin, Plus, ArrowRight, FileText } from 'lucide-react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from "../../config/apiBaseUrl";

const CreateProposalModal = ({ isOpen, onClose }) => {
  const baseURL = API_BASE_URL;
  const navigate = useNavigate();
  const { currentUser, token } = useSelector((state) => state.user);
  
  const [activeTab, setActiveTab] = useState('existing'); // 'existing' or 'new'
  
  // Existing Client State
  const [clients, setClients] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [loadingClients, setLoadingClients] = useState(false);

  // New Client State
  const baseClientForm = {
    client_name: "",
    client_organization: "",
    email: "",
    phone: "",
    address: "",
    dg_employee: currentUser?.name || "",
  };
  const [clientForm, setClientForm] = useState(baseClientForm);
  const [savingClient, setSavingClient] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchClients();
      setActiveTab('existing');
      setSelectedClientId(null);
      setClientForm({ ...baseClientForm, dg_employee: currentUser?.name || "" });
      setKeyword("");
    }
  }, [isOpen]);

  const fetchClients = async () => {
    if (!token) return;
    setLoadingClients(true);
    try {
      const response = await axios.get(`${baseURL}/auth/api/re_calculator/getClientDetails`, { headers: { Authorization: `Bearer ${token}` } });
      const list = Array.isArray(response?.data?.data) ? response.data.data : [];
      setClients(list);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingClients(false);
    }
  };

  const filteredClients = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    if (!query) return clients;
    return clients.filter((item) =>
      [item.client_name, item.client_organization, item.phone, item.email, item.dg_employee]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(query))
    );
  }, [clients, keyword]);

  const handleClientChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone" && !/^\d{0,10}$/.test(value)) return;
    setClientForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateNewClient = async (e) => {
    e.preventDefault();
    setSavingClient(true);
    try {
      const payload = { ...clientForm, dg_employee: clientForm.dg_employee || currentUser?.name || "" };
      const response = await axios.post(`${baseURL}/auth/api/re_calculator/insertClientDetails`, payload, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
      
      if (response?.data?.status !== "Success") { 
        Swal.fire({ icon: "error", title: "Error", text: response?.data?.message || "Failed to add client." }); 
        return; 
      }
      
      const latestClients = await axios.get(`${baseURL}/auth/api/re_calculator/getClientDetails`, { headers: { Authorization: `Bearer ${token}` } });
      const list = Array.isArray(latestClients?.data?.data) ? latestClients.data.data : [];
      const matched = list.find((item) => (item.client_name || "").trim().toLowerCase() === (payload.client_name || "").trim().toLowerCase() && String(item.phone || "").trim() === String(payload.phone || "").trim());
      
      if (matched) {
        onClose();
        navigate(`/admin/proposal-builder/${matched.id}`);
      } else {
        Swal.fire({ icon: "warning", title: "Warning", text: "Client created but ID could not be found. Please select from existing clients." });
        fetchClients();
        setActiveTab('existing');
      }
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: "Something went wrong while adding client." });
    } finally {
      setSavingClient(false);
    }
  };

  const handleProceedExisting = () => {
    if (!selectedClientId) return;
    onClose();
    navigate(`/admin/proposal-builder/${selectedClientId}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-700/50 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-gray-800/40">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" /> Create Proposal
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-4 gap-2 border-b border-gray-800 bg-gray-900/50">
          <button 
            onClick={() => setActiveTab('existing')}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'existing' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            <User className="w-4 h-4" /> Existing Client
          </button>
          <button 
            onClick={() => setActiveTab('new')}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'new' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            <Plus className="w-4 h-4" /> Create New Client
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-5 no-scrollbar">
          {activeTab === 'existing' ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Search by name, organization, phone..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/60 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm outline-none transition-all"
                />
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {loadingClients ? (
                  <div className="text-center py-8 text-gray-400 text-sm">Loading clients...</div>
                ) : filteredClients.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">No clients found.</div>
                ) : (
                  filteredClients.map((client) => (
                    <div 
                      key={client.id}
                      onClick={() => setSelectedClientId(client.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${selectedClientId === client.id ? 'bg-amber-500/10 border-amber-500/50' : 'bg-gray-800/40 border-gray-700/50 hover:border-gray-600'}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${selectedClientId === client.id ? 'bg-amber-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-center">
                          <p className={`font-semibold text-sm truncate ${selectedClientId === client.id ? 'text-amber-400' : 'text-white'}`}>
                            {client.client_organization || client.client_name}
                          </p>
                          <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">ID: {client.id}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 truncate">{client.client_organization ? client.client_name : client.phone}</p>
                        <p className="text-xs text-gray-500 truncate">{client.phone} {client.email && `• ${client.email}`}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-4 border-t border-gray-800 flex justify-end">
                <button
                  onClick={handleProceedExisting}
                  disabled={!selectedClientId}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:scale-105 transition-all"
                >
                  Proceed to Builder <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateNewClient} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Client Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input name="client_name" value={clientForm.client_name} onChange={handleClientChange} required placeholder="Full name" className="w-full pl-9 pr-3 py-2.5 bg-gray-800/60 border border-gray-700 rounded-xl text-white focus:ring-1 focus:ring-amber-500 text-sm outline-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Organization</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input name="client_organization" value={clientForm.client_organization} onChange={handleClientChange} placeholder="Company name" className="w-full pl-9 pr-3 py-2.5 bg-gray-800/60 border border-gray-700 rounded-xl text-white focus:ring-1 focus:ring-amber-500 text-sm outline-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input name="email" type="email" value={clientForm.email} onChange={handleClientChange} placeholder="email@example.com" className="w-full pl-9 pr-3 py-2.5 bg-gray-800/60 border border-gray-700 rounded-xl text-white focus:ring-1 focus:ring-amber-500 text-sm outline-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Phone *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input name="phone" value={clientForm.phone} onChange={handleClientChange} required maxLength={10} placeholder="10-digit number" className="w-full pl-9 pr-3 py-2.5 bg-gray-800/60 border border-gray-700 rounded-xl text-white focus:ring-1 focus:ring-amber-500 text-sm outline-none" />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-gray-500 w-4 h-4" />
                  <textarea name="address" value={clientForm.address} onChange={handleClientChange} rows={2} placeholder="Full address" className="w-full pl-9 pr-3 py-2.5 bg-gray-800/60 border border-gray-700 rounded-xl text-white focus:ring-1 focus:ring-amber-500 text-sm outline-none" />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-800 flex justify-end">
                <button
                  type="submit"
                  disabled={savingClient}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl text-sm disabled:opacity-50 flex items-center gap-2 hover:scale-105 transition-all"
                >
                  {savingClient ? "Saving..." : "Create & Proceed"} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateProposalModal;
