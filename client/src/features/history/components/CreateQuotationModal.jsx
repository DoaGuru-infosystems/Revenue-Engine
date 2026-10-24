import React, { useState, useEffect, useMemo } from "react";
import { X, Search, User, FileText, ArrowRight } from "lucide-react";
import Swal from "sweetalert2";
import axios from "axios";
import { useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import API_BASE_URL from "../../../config/apiBaseUrl";

const CreateQuotationModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith("/BD") ? "/BD" : "/admin";
  const { token } = useSelector((state) => state.user);

  const [clients, setClients] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [loadingClients, setLoadingClients] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchClientsList();
      setSelectedClientId(null);
      setKeyword("");
    }
  }, [isOpen]);

  const fetchClientsList = async () => {
    if (!token) return;
    setLoadingClients(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/auth/api/re_calculator/getClients`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setClients(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingClients(false);
    }
  };

  const filteredClients = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((item) =>
      [item.client_name, item.client_organization, item.phone, item.email]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [clients, keyword]);

  const handleProceed = async () => {
    if (!selectedClientId) return;
    setCreating(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/auth/api/re_calculator/quotation`,
        { client_id: selectedClientId, created_by: "Admin" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.status === "Success") {
        const quotationId = res.data.quotationId;
        onClose();
        navigate(`${basePath}/ServicesLanding/${selectedClientId}/${quotationId}?mode=quotation`, {
          state: { mode: "quotation", quotationId },
        });
      } else {
        Swal.fire({ icon: "error", title: "Error", text: res.data.message || "Failed to create quotation", timer: 1500, showConfirmButton: false });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err?.response?.data?.message || "Failed to create quotation", timer: 1500, showConfirmButton: false });
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 w-full max-w-xl rounded-2xl shadow-2xl border border-gray-700/50 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-gray-800/40">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" /> Create Quotation
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 space-y-4 no-scrollbar">
          <p className="text-sm text-gray-400">Select a client to create a new quotation for.</p>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search by name, organization, phone..."
              className="w-full pl-10 pr-4 py-3 bg-gray-800/60 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm outline-none transition-all"
            />
          </div>

          {/* Client List */}
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
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    selectedClientId === client.id
                      ? "bg-blue-500/10 border-blue-500/50"
                      : "bg-gray-800/40 border-gray-700/50 hover:border-gray-600"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      selectedClientId === client.id ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-center">
                      <p className={`font-semibold text-sm truncate ${selectedClientId === client.id ? "text-blue-400" : "text-white"}`}>
                        {client.client_organization || client.client_name}
                      </p>
                      <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                        ID: {client.id}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {client.client_organization ? client.client_name : client.phone}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {client.phone} {client.email && `• ${client.email}`}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Proceed */}
          <div className="pt-4 border-t border-gray-800 flex justify-end">
            <button
              onClick={handleProceed}
              disabled={!selectedClientId || creating}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
            >
              {creating ? "Creating..." : "Create Quotation"} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateQuotationModal;
