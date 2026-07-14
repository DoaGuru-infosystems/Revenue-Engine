import React, { useEffect, useState, useRef } from "react";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Plus,
  Search,
  X,
  Building,
  Link as LinkIcon,
  ExternalLink,
  Copy,
  FileText,
  CreditCard,
  Trash2,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";
import ReactPaginate from "react-paginate";
import styled from "styled-components";
import AdminCalculator from "./AdminCalculator";
import { clearUser } from "../redux/user/userSlice";
import API_BASE_URL from "../config/apiBaseUrl";

const AdminClientDetails = () => {
  const baseURL = API_BASE_URL;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser, token } = useSelector((state) => state.user);
  const employeeName = currentUser?.name;
  const [selectedClient, setSelectedClient] = useState(null);
  const detailRef = useRef(null);
  const [formData, setFormData] = useState({
    client_name: "",
    client_organization: "",
    email: "",
    phone: "",
    address: "",
    dg_employee: employeeName,
  });
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [generating, setGenerating] = useState(false);

  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [getClients, setGetClients] = useState([]);
  
  // -- Proposal Modal State --
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [clientProposals, setClientProposals] = useState([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const clientPerPage = 10;
  const [isEditing, setIsEditing] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const handleClose = () => {
    setShowModal(false);
    setFormData({
      client_name: "",
      client_organization: "",
      email: "",
      phone: "",
      address: "",
      dg_employee: employeeName,
    });
  };

  const handleShow = () => {
    setSelectedClient(null);
    setFormData({
      client_name: "",
      client_organization: "",
      email: "",
      phone: "",
      address: "",
      dg_employee: employeeName,
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      if (!/^\d{0,10}$/.test(value)) return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let response;

      if (isEditing && selectedClient) {
        response = await axios.put(
          `${baseURL}/auth/api/re_calculator/updateClientDetails/${selectedClient.id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      } else {
        response = await axios.post(
          `${baseURL}/auth/api/re_calculator/insertClientDetails`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      }

      if (response.data.status === "Success") {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: isEditing
            ? "Client updated successfully!"
            : "Client added successfully!",
          showConfirmButton: false,
          timer: 1000,
        }).then(() => {
          setShowModal(false);
          getAllClients();
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            response.data.message || "Failed to save client. Please try again.",
          showConfirmButton: false,
          timer: 1000,
        });
      }
    } catch (error) {
      console.error("Error saving client:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.response?.data?.message || "Failed to save client. Please try again.",
        showConfirmButton: false,
        timer: 1000,
      });
    } finally {
      setLoading(false);
    }
  };

  const isFkConstraintError = (payload) => {
    const code = payload?.code || payload?.error?.code;
    const errno = payload?.errno || payload?.error?.errno;
    const st = payload?.sqlState || payload?.error?.sqlState;
    return (
      code === "ER_ROW_IS_REFERENCED_2" || errno === 1451 || st === "23000"
    );
  };

  const handleDeleteClient = async (clientId) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to delete this client permanently?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#4B5563",
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete(`${baseURL}/auth/api/re_calculator/deleteClientById/${clientId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Client deleted successfully.",
          background: "#1F2937",
          color: "#fff",
          timer: 1500,
          showConfirmButton: false
        });
        if (selectedClient?.id === clientId) {
          setSelectedClient(null);
          setMobileDetailOpen(false);
        }
        getAllClients();
      } catch (error) {
        if (isFkConstraintError(error.response?.data)) {
          Swal.fire({
            icon: "error",
            title: "Cannot Delete",
            text: "This entry cannot be deleted because it is referenced by other data. Like (Link or Assign)",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error!",
            text: error.response?.data?.message || "Unable to delete client.",
          });
        }
      }
    }
  };

  const handleDeleteProposal = async (proposalId) => {
    const confirm = await Swal.fire({
      title: "Delete Proposal?",
      text: "Are you sure you want to delete this proposal?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#4B5563",
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete(`${baseURL}/auth/api/re_calculator/proposal/${proposalId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Proposal deleted successfully.",
          background: "#1F2937",
          color: "#fff",
          timer: 1500,
          showConfirmButton: false
        });
        // Remove from the local list
        setClientProposals(prev => prev.filter(p => p.id !== proposalId));
      } catch (error) {
        console.error("Delete proposal error:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to delete proposal.",
        });
      }
    }
  };

  const getAllClients = async () => {
    try {
      const response = await axios.get(
        `${baseURL}/auth/api/re_calculator/getClientDetails`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setGetClients(response.data.data);
    } catch (error) {
      console.error("Error fetching clients:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch clients. Please try again.",
      });
      if (error.response && error.response.status === 401) {
        Swal.fire({
          title: "Session Expired",
          text: "Please login again.",
          icon: "warning",
          confirmButtonText: "OK",
        }).then(() => {
          dispatch(clearUser());
          localStorage.removeItem("token");
          navigate("/");
        });
      }
    }
  };

  useEffect(() => {
    getAllClients();
  }, []);

  const filteredItems = getClients.filter((row) => {
    const matchesKeyword =
      (row?.client_name &&
        row.client_name.toLowerCase().includes(keyword.trim().toLowerCase())) ||
      (row?.dg_employee &&
        row.dg_employee.toLowerCase().includes(keyword.trim().toLowerCase())) ||
      (row?.client_organization &&
        row.client_organization
          .toLowerCase()
          .includes(keyword.trim().toLowerCase())) ||
      (row?.phone &&
        row.phone.toLowerCase().includes(keyword.trim().toLowerCase()));

    return matchesKeyword;
  });

  const totalPages = Math.ceil(filteredItems.length / clientPerPage);

  const filterPagination = () => {
    const startIndex = currentPage * clientPerPage;
    const endIndex = startIndex + clientPerPage;
    return filteredItems?.slice(startIndex, endIndex);
  };

  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  const showApiData = filterPagination();

  const handleCreateProposal = async () => {
    if (!selectedClient) return;
    setLoadingProposals(true);
    setShowProposalModal(true);
    try {
      const res = await axios.get(`${baseURL}/auth/api/re_calculator/proposals/client/${selectedClient.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === "Success") {
        setClientProposals(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to fetch proposals' });
      setShowProposalModal(false);
    } finally {
      setLoadingProposals(false);
    }
  };

  function toSqlDateTimeIST(date = new Date()) {
    const pad = (n) => String(n).padStart(2, "0");
    const istOffsetMin = 330;
    const utcMs = date.getTime() + date.getTimezoneOffset() * 60000;
    const ist = new Date(utcMs + istOffsetMin * 60000);
    return (
      `${ist.getFullYear()}-${pad(ist.getMonth() + 1)}-${pad(ist.getDate())} ` +
      `${pad(ist.getHours())}:${pad(ist.getMinutes())}:${pad(ist.getSeconds())}`
    );
  }

  const handleGeneratePublicLink = async () => {
    if (!selectedClient) {
      Swal.fire({ icon: "warning", title: "Select a client first" });
      return;
    }
    setGenerating(true);
    try {
      const expiresAt = toSqlDateTimeIST(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      );

      const payload = {
        client_id: selectedClient.id,
        created_by: employeeName,
        expires_at: expiresAt,
        is_active: 1,
      };

      const resp = await axios.post(
        `${baseURL}/auth/api/re_calculator/generateClientLink`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { status, data, message } = resp?.data || {};
      if (status !== "Success" || !data?.slug) {
        throw new Error(message || "Failed to generate link");
      }

      const FRONTEND_ORIGIN = window.location.origin;
      const useHash =
        !!window.location.hash || window.location.href.includes("#/");

      let finalUrl;
      try {
        const u = new URL(data.url);
        const path = u.pathname + u.search + u.hash;
        const cleanPath = path.startsWith("/public/")
          ? path
          : `/public/r/${data.slug}`;
        finalUrl = `${FRONTEND_ORIGIN}${useHash ? "/#" : ""}${cleanPath}`;
      } catch {
        finalUrl = `${FRONTEND_ORIGIN}${useHash ? "/#" : ""}/public/r/${data.slug}`;
      }

      setGeneratedLink(finalUrl);
      setShowLinkModal(true);
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Failed to generate link" });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      Swal.fire({ icon: "success", title: "Link copied!", showConfirmButton: false, timer: 1000 });
    } catch {
      Swal.fire({ icon: "error", title: "Copy failed" });
    }
  };

  const handleClientClick = (client) => {
    setSelectedClient(client);
    if (window.innerWidth < 1024) {
      setMobileDetailOpen(true);
    }
  };

  return (
    <>
    <div className="flex flex-col h-full overflow-hidden p-2 md:p-4 gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Client Management</h2>
          <p className="text-gray-400 text-sm mt-1">Manage clients, proposals and public links</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="search"
              value={keyword}
              placeholder="Search clients..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800/60 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500/50 focus:border-transparent outline-none transition-all"
              onChange={(e) => {
                setKeyword(e.target.value);
                setCurrentPage(0);
              }}
            />
          </div>
          <button
            onClick={handleShow}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white shadow-lg shadow-orange-500/20 active:scale-95 transition-all font-medium w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Add Client
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0 overflow-hidden">
        <div ref={detailRef} className="hidden lg:block w-80 xl:w-96 shrink-0 lg:order-2">
          <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6 min-h-[400px] flex flex-col">
            {selectedClient ? (
              <div className="flex flex-col h-full gap-6">
                <div className="flex flex-col text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full flex items-center justify-center mx-auto border border-gray-700/50">
                    <User className="w-10 h-10 text-gray-400" />
                  </div>
                  <div className="mt-3">
                    {selectedClient.client_organization && (
                      <h4 className="font-bold text-xl text-white">{selectedClient.client_organization}</h4>
                    )}
                    <p className={`text-base ${selectedClient.client_organization ? "text-gray-400" : "text-white font-bold text-lg"}`}>
                      {selectedClient.client_name}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2.5">
                  {selectedClient.email && (
                    <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl border border-gray-700/50">
                      <div className="p-1.5 bg-red-500/10 rounded-lg"><Mail className="w-4 h-4 text-red-400" /></div>
                      <span className="text-sm text-gray-300 break-all">{selectedClient.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl border border-gray-700/50">
                    <div className="p-1.5 bg-amber-500/10 rounded-lg"><Phone className="w-4 h-4 text-amber-400" /></div>
                    <span className="text-sm text-gray-300">{selectedClient.phone}</span>
                  </div>
                  {selectedClient.address && (
                    <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl border border-gray-700/50">
                      <div className="p-1.5 bg-red-500/10 rounded-lg"><MapPin className="w-4 h-4 text-red-400" /></div>
                      <span className="text-sm text-gray-300 line-clamp-2">{selectedClient.address}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2.5 mt-auto pt-4 border-t border-gray-700/50">
                  <button onClick={handleCreateProposal} className="w-full px-4 py-3 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-sm">
                    <Plus className="w-4 h-4" /> Create Proposal
                  </button>
                  <button onClick={(e) => { e.preventDefault(); handleGeneratePublicLink(); }} disabled={generating} className="w-full px-4 py-2.5 bg-orange-500/10 text-orange-400 font-semibold border border-orange-500/20 rounded-xl hover:bg-orange-500/20 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50">
                    <LinkIcon className="w-4 h-4" /> {generating ? "Generating..." : "Generate Link"}
                  </button>
                  <button onClick={() => navigate(`/admin/client/service/history/${selectedClient.id}`)} className="w-full px-4 py-2.5 bg-gray-800 text-gray-300 font-medium rounded-xl hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-sm">
                    <Calendar className="w-4 h-4" /> History
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-500 py-12 text-center">
                <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 opacity-30" />
                </div>
                <h3 className="text-lg font-semibold text-gray-400 mt-4 mb-1">No Client Selected</h3>
                <p className="text-sm">Click a client to view profile</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col lg:order-1">
          <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 overflow-hidden">
            <div className="p-4 border-b border-gray-700/30 bg-gray-800/40 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">All Clients</h3>
              <span className="text-xs text-gray-500">{filteredItems.length} total</span>
            </div>
            <div className="p-2 md:p-4 grid grid-cols-1 gap-2 md:gap-3 overflow-y-auto no-scrollbar flex-1 min-h-0" style={{ maxHeight: 'calc(100vh - 340px)' }}>
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : showApiData && showApiData.length > 0 ? (
                showApiData.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => handleClientClick(client)}
                    className={`p-2.5 md:p-4 rounded-xl md:rounded-2xl cursor-pointer transition-all duration-200 border group ${
                      selectedClient?.id === client.id
                        ? "bg-orange-500/10 border-orange-500/30 ring-1 ring-orange-500/20"
                        : "bg-gray-800/40 border-gray-700/50 hover:bg-gray-700/40 hover:border-gray-600/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                        <div className={`w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 ${
                          selectedClient?.id === client.id ? "bg-gradient-to-br from-orange-500 to-red-600 text-white" : "bg-gray-700/50 text-gray-400"
                        }`}>
                          <User className="w-4 h-4 md:w-6 md:h-6" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-white truncate text-xs md:text-base leading-tight">
                            {client.client_organization || client.client_name}
                          </h4>
                          <p className="text-[10px] md:text-sm text-gray-400 truncate">
                            {client.client_organization ? client.client_name : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] md:text-sm text-gray-400 mt-1 md:mt-0">
                        <span className="flex items-center gap-1 md:gap-1.5 truncate">
                          <Phone className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-400 shrink-0" />
                          {client.phone}
                        </span>
                        {client.email && (
                          <span className="hidden md:flex items-center gap-1.5 truncate">
                            <Mail className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            {client.email}
                          </span>
                        )}
                        <span className="hidden lg:flex items-center gap-1.5 truncate">
                          <Calendar className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                          {client.dg_employee}
                        </span>
                      </div>
                      <div className={`flex flex-col md:flex-row gap-1.5 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity ${selectedClient?.id === client.id ? 'md:opacity-100' : ''}`}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClient(client);
                            setFormData({
                              client_name: client.client_name,
                              client_organization: client.client_organization,
                              email: client.email,
                              phone: client.phone,
                              address: client.address,
                              dg_employee: client.dg_employee,
                            });
                            setIsEditing(true);
                            setShowModal(true);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-700/50 hover:bg-gray-600/80 text-white transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteClient(client.id); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                  <Search className="w-10 h-10 mb-3 opacity-20" />
                  <p>No clients found</p>
                </div>
              )}
            </div>
            <div className="p-3 border-t border-gray-700/30 bg-gray-800/40 flex items-center justify-center gap-3">
              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-700/50 text-gray-300 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ← Prev
              </button>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Page</span>
                <select
                  value={currentPage}
                  onChange={(e) => setCurrentPage(Number(e.target.value))}
                  className="bg-gray-900/80 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer appearance-none min-w-[70px] text-center"
                >
                  {Array.from({ length: totalPages }, (_, i) => (
                    <option key={i} value={i}>{i + 1}</option>
                  ))}
                </select>
                <span className="text-gray-500 text-sm">of {totalPages}</span>
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-700/50 text-gray-300 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Client Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />
          <div className="relative bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-400">
                  <User className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-white">
                  {isEditing ? "Edit Client" : "Add New Client"}
                </h2>
              </div>
              <button onClick={handleClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Client Name</label>
                <input type="text" name="client_name" value={formData.client_name} onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
                  placeholder="Enter client name" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Organization</label>
                <input type="text" name="client_organization" value={formData.client_organization} onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
                  placeholder="Enter organization" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
                    placeholder="email@example.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Phone</label>
                  <input type="number" name="phone" value={formData.phone} onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
                    placeholder="10-digit number" required minLength={10} maxLength={10} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Address</label>
                <textarea name="address" value={formData.address} onChange={handleChange} rows={2}
                  className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors resize-none"
                  placeholder="Enter full address" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-700/50">
                <button type="button" onClick={handleClose}
                  className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50">
                  {loading ? "Processing..." : isEditing ? "Save Changes" : "Create Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-gray-700/50 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Share Client Portal</h3>
              <button onClick={() => setShowLinkModal(false)} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-400">Share this link with {selectedClient?.client_name}. The link will automatically expire in 30 days.</p>
              <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 break-all text-sm text-red-400 font-medium">
                {generatedLink}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={handleCopyLink}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white text-gray-900 font-bold hover:bg-gray-100 transition-colors">
                  <Copy className="w-4 h-4" /> Copy Link
                </button>
                <a href={generatedLink} target="_blank" rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-600 text-white font-medium hover:bg-gray-700 transition-colors">
                  <ExternalLink className="w-4 h-4" /> Open Link
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE Client Detail Bottom Sheet ── */}
      {mobileDetailOpen && selectedClient && (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileDetailOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700/60 rounded-t-3xl p-5 pb-20 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mb-2" />
            <button
              onClick={() => setMobileDetailOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full flex items-center justify-center border border-gray-700/50 shrink-0">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <div className="min-w-0">
                {selectedClient.client_organization && (
                  <h4 className="font-bold text-lg text-white truncate">{selectedClient.client_organization}</h4>
                )}
                <p className={`text-sm truncate ${selectedClient.client_organization ? "text-gray-400" : "text-white font-bold text-lg"}`}>
                  {selectedClient.client_name}
                </p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-2">
              {selectedClient.email && (
                <div className="flex items-center gap-3 p-3 bg-gray-800/60 rounded-xl border border-gray-700/50">
                  <div className="p-1.5 bg-red-500/10 rounded-lg shrink-0"><Mail className="w-4 h-4 text-red-400" /></div>
                  <span className="text-sm text-gray-300 break-all">{selectedClient.email}</span>
                </div>
              )}
              <div className="flex items-center gap-3 p-3 bg-gray-800/60 rounded-xl border border-gray-700/50">
                <div className="p-1.5 bg-amber-500/10 rounded-lg shrink-0"><Phone className="w-4 h-4 text-amber-400" /></div>
                <span className="text-sm text-gray-300">{selectedClient.phone}</span>
              </div>
              {selectedClient.address && (
                <div className="flex items-center gap-3 p-3 bg-gray-800/60 rounded-xl border border-gray-700/50">
                  <div className="p-1.5 bg-red-500/10 rounded-lg shrink-0"><MapPin className="w-4 h-4 text-red-400" /></div>
                  <span className="text-sm text-gray-300">{selectedClient.address}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => { setMobileDetailOpen(false); handleCreateProposal(); }}
                className="w-full py-3 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" /> Create Proposal
              </button>
              <button
                onClick={(e) => { e.preventDefault(); setMobileDetailOpen(false); handleGeneratePublicLink(); }}
                disabled={generating}
                className="w-full py-3 bg-orange-500/10 text-orange-400 font-semibold border border-orange-500/20 rounded-xl hover:bg-orange-500/20 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                <LinkIcon className="w-4 h-4" /> {generating ? "Generating..." : "Generate Link"}
              </button>
              <button
                onClick={() => { setMobileDetailOpen(false); navigate(`/admin/client/service/history/${selectedClient.id}`); }}
                className="w-full py-3 bg-gray-800 text-gray-300 font-medium rounded-xl hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Calendar className="w-4 h-4" /> History
              </button>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    setMobileDetailOpen(false);
                    setFormData({
                      client_name: selectedClient.client_name,
                      client_organization: selectedClient.client_organization,
                      email: selectedClient.email,
                      phone: selectedClient.phone,
                      address: selectedClient.address,
                      dg_employee: selectedClient.dg_employee,
                    });
                    setIsEditing(true);
                    setShowModal(true);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-700/60 hover:bg-gray-600 text-white transition-colors"
                >Edit</button>
                <button
                  onClick={() => { setMobileDetailOpen(false); handleDeleteClient(selectedClient.id); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                >Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

      {/* Proposal Modal */}
      {showProposalModal && selectedClient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowProposalModal(false)} />
          <div className="relative bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-700/50 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-gray-800/40">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-400" /> Client Proposals
              </h2>
              <button onClick={() => setShowProposalModal(false)} className="text-gray-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 flex gap-3 border-b border-gray-800">
              <button 
                onClick={() => navigate(`/admin/proposal-builder/${selectedClient.id}`)}
                className="flex-1 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold transition flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" /> Create New Proposal
              </button>
              <button 
                onClick={() => navigate(`/admin/client/service/history/${selectedClient.id}`)}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition flex items-center justify-center gap-2"
              >
                <FileText className="w-5 h-5" /> Manage Proposals
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 no-scrollbar space-y-3">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Existing Proposals</h3>
              {loadingProposals ? (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : clientProposals.length === 0 ? (
                <div className="text-center py-10 text-gray-500 bg-gray-800/30 rounded-xl border border-gray-700/50">
                  No proposals found for {selectedClient.client_name}.
                </div>
              ) : (
                clientProposals.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-4 bg-gray-800/40 rounded-xl border border-gray-700/50 hover:bg-gray-800 transition">
                    <div>
                      <h4 className="font-semibold text-white">Proposal #{p.id} - {p.proposal_type}</h4>
                      <p className="text-xs text-gray-400 mt-1">Status: {p.status} • Total: ₹{p.grand_total_excl_gst}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => navigate(`/admin/proposal-builder/${selectedClient.id}/${p.id}`)}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold rounded-lg transition"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteProposal(p.id)}
                        className="px-3 py-2 bg-red-900/40 hover:bg-red-800 text-red-400 text-sm font-semibold rounded-lg transition"
                        title="Delete Proposal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>

  );
  
};

export default AdminClientDetails;

const PaginationContainer = styled.div`
  .pagination {
    display: flex;
    justify-content: center;
    padding: 8px;
    list-style: none;
    gap: 4px;
  }
  .pagination li a {
    display: block;
    padding: 6px 12px;
    border: 1px solid rgba(107, 114, 128, 0.3);
    color: #9ca3af;
    cursor: pointer;
    text-decoration: none;
    border-radius: 8px;
    font-size: 13px;
    background: rgba(31, 41, 55, 0.5);
    transition: all 0.2s;
  }
  .pagination li a:hover {
    background: rgba(139, 92, 246, 0.2);
    color: #c4b5fd;
    border-color: rgba(139, 92, 246, 0.3);
  }
  .pagination li.active a {
    background: rgba(139, 92, 246, 0.3);
    color: #e9d5ff;
    border-color: rgba(139, 92, 246, 0.5);
  }
  .pagination li.disabled a {
    color: #4b5563;
    cursor: not-allowed;
    background: rgba(31, 41, 55, 0.3);
  }
  @media (max-width: 640px) {
    .pagination li a {
      padding: 4px 8px;
      font-size: 11px;
    }
  }
`;
