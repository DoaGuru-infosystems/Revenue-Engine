import React, { useEffect, useState } from "react";
import { Calendar, Search, Eye, FileText, Hash, Plus, ChevronDown, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import moment from "moment";
import ReactPaginate from "react-paginate";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../redux/user/userSlice";
import Swal from "sweetalert2";
import API_BASE_URL from "../config/apiBaseUrl";
import CreateProposalModal from "./components/CreateProposalModal";

const ProposalHistory = () => {
  const baseURL = API_BASE_URL;
  const navigate = useNavigate();
  const [fetchServices, setFetchServices] = useState([]);
  const { currentUser, token } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const clientPerPage = 10;
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [showCreateProposalModal, setShowCreateProposalModal] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleDeleteProposal = async (item) => {
    if (item.status !== "client_approved") {
      Swal.fire({
        icon: "warning",
        title: "Cannot Delete",
        text: "Is proposal ka proforma ban chuka hai. Pehle aapko proforma delete karna hoga, uske baad hi proposal delete ho payega."
      });
      return;
    }

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
        await axios.delete(`${baseURL}/auth/api/re_calculator/proposal/${item.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Proposal deleted successfully.",
          timer: 1500,
          showConfirmButton: false
        });
        fetchAllClientServices();
      } catch (error) {
        console.error("Delete proposal error:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error?.response?.data?.message || "Failed to delete proposal.",
        });
      }
    }
  };

  const fetchAllClientServices = async () => {
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/re_calculator/proposals/all`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.status === "Success") {
        const uniqueTxnData = [];
        const seenTxnIds = new Set();

        for (const item of res.data.data) {
          if (item.id && !seenTxnIds.has(item.id)) {
            seenTxnIds.add(item.id);
            uniqueTxnData.push(item);
          }
        }

        setFetchServices(uniqueTxnData);
      }
    } catch (error) {
      console.log(error);
      if (error.response && error.response.status === 401) {
        Swal.fire({
          title: "Session Expired",
          text: "Please login again.",
          icon: "warning",
          showConfirmButton: false,
          timer: 1000,
        }).then(() => {
          dispatch(clearUser());
          localStorage.removeItem("token");
          navigate("/");
        });
      }
    }
  };

  useEffect(() => {
    fetchAllClientServices();
  }, []);

  const filteredItems = fetchServices.filter((row) => {
    // Exclude draft, sent, changes, and rejected so only approved (and beyond) proposals are shown
    if (['draft', 'sent', 'changes', 'rejected'].includes(row?.status)) return false;

    if (!keyword.trim()) return true;
    const searchTerm = keyword.trim().toLowerCase();
    return (
      (row?.id && String(row.id).toLowerCase().includes(searchTerm)) ||
      (row?.client_name && row.client_name.toLowerCase().includes(searchTerm))
    );
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

  const getStatusLabel = (status) => {
    const map = {
      client_approved: "Client Approved",
      proforma_invoice_generated: "Proforma Generated",
      proforma_invoice_sent: "Proforma Sent",
      payment_received_invoice_ready: "Payment Received - Invoice Ready",
      invoice_sent: "Invoice Sent",
    };
    return map[status] || (status || "pending").replaceAll("_", " ").toUpperCase();
  };

  const handlePreview = (item) => {
    navigate(`/admin/proposal-builder/${item.client_id}/${item.id}`);
  };

  return (
    <div className="w-full bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 p-4 sm:p-6 space-y-4 sm:space-y-6">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Proposal History
            </h2>
            <p className="text-gray-400 text-sm mt-1">{filteredItems.length} records found</p>
          </div>

          {/* Search and Action */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={keyword}
                placeholder="Search by name or TXN ID..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800/60 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm outline-none transition-all"
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setCurrentPage(0);
                }}
              />
            </div>
            <button
              onClick={() => setShowCreateProposalModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-semibold whitespace-nowrap shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Proposal
            </button>
          </div>
        </div>

        {/* ── MOBILE: Card List ─────────────────────────────────────────── */}
        <div className="block md:hidden space-y-3 overflow-y-auto max-h-[calc(100vh-20rem)] pr-1">
          {showApiData.length > 0 ? (
            showApiData.map((item, index) => (
              <div
                key={item.id || item.txn_id}
                className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 space-y-3 hover:border-gray-600/60 transition-all duration-200"
              >
                {/* Top row: index + date */}
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-bold flex items-center justify-center">
                    {currentPage * clientPerPage + index + 1}
                  </span>
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-orange-400" />
                    <span>{moment(item.created_at).format("DD MMM YYYY")}</span>
                  </div>
                </div>

                {/* Client Name */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">Client</p>
                    <p className="text-white font-semibold text-sm leading-tight">{item.client_name}</p>
                  </div>
                </div>

                {/* Proposal ID */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-yellow-500/15 flex items-center justify-center shrink-0">
                    <Hash className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">Proposal ID</p>
                    <p className="text-yellow-400 font-bold text-xs font-mono truncate">{`PROP-${item.id}`}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">Status</p>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
                    {getStatusLabel(item.status)}
                  </span>
                </div>

                {/* Action Button */}
                <div className="relative w-full" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setOpenDropdownId(openDropdownId === item.id ? null : item.id)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-200"
                  >
                    Actions <ChevronDown className={`w-4 h-4 transition-transform ${openDropdownId === item.id ? 'rotate-180' : ''}`} />
                  </button>

                  {openDropdownId === item.id && (
                    <div className="absolute left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                      <button
                        onClick={() => { setOpenDropdownId(null); handlePreview(item); }}
                        className="w-full text-left px-4 py-3 text-sm font-medium text-gray-200 hover:bg-gray-700 flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4 text-blue-400" /> View Proposal
                      </button>
                      <button
                        onClick={() => { setOpenDropdownId(null); handleDeleteProposal(item); }}
                        className="w-full text-left px-4 py-3 text-sm font-medium text-gray-200 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center gap-2 border-t border-gray-700/50"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" /> Delete Proposal
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No history found.</p>
            </div>
          )}
        </div>

        {/* ── DESKTOP: Table ────────────────────────────────────────────── */}
        <div className="hidden md:block bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <div
              className="overflow-auto h-[calc(100vh-20rem)] max-h-[35rem]"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50 bg-gray-900/30">
                  <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">#</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">Date</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">Client Name</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">Proposal ID</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {showApiData.length > 0 ? (
                  showApiData.map((item, index) => (
                    <tr
                      key={item.id || item.txn_id}
                      className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-all duration-300 group"
                    >
                      <td className="py-4 px-6">
                        <span className="font-semibold text-white group-hover:text-amber-300 transition-colors">
                          {currentPage * clientPerPage + index + 1}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-gray-300 group-hover:text-white transition-colors">
                          <Calendar className="w-4 h-4 text-orange-400 shrink-0" />
                          <span className="font-medium text-sm">{moment(item.created_at).format("DD MMMM YYYY")}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-semibold text-white group-hover:text-amber-300 transition-colors">
                          {item.client_name}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-bold text-lg bg-gradient-to-r from-green-400 to-yellow-400 bg-clip-text text-transparent font-mono">
                          {`PROP-${item.id}`}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
                          {getStatusLabel(item.status)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setOpenDropdownId(openDropdownId === item.id ? null : item.id)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700 transition-all duration-200"
                          >
                            Action <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdownId === item.id ? 'rotate-180' : ''}`} />
                          </button>

                          {openDropdownId === item.id && (
                            <div className="absolute right-0 mt-2 w-36 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                              <button
                                onClick={() => { setOpenDropdownId(null); handlePreview(item); }}
                                className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-200 hover:bg-gray-700 flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4 text-blue-400" /> View
                              </button>
                              <button
                                onClick={() => { setOpenDropdownId(null); handleDeleteProposal(item); }}
                                className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-200 hover:bg-red-500/20 hover:text-red-400 flex items-center gap-2 border-t border-gray-700/50"
                              >
                                <Trash2 className="w-4 h-4 text-red-400" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-16 text-center text-gray-400">
                      <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      No proposal history found.
                    </td>
                  </tr>
                )}
              </tbody>
              </table>
            </div>
          </div>
        </div>


        {/* Pagination */}
        {totalPages > 1 && (
          <PaginationContainer>
            <ReactPaginate
              previousLabel={"Previous"}
              nextLabel={"Next"}
              breakLabel={"..."}
              pageCount={totalPages}
              marginPagesDisplayed={2}
              pageRangeDisplayed={5}
              onPageChange={handlePageChange}
              containerClassName={"pagination"}
              activeClassName={"active"}
              forcePage={currentPage}
            />
          </PaginationContainer>
        )}
      </div>
      <CreateProposalModal
        isOpen={showCreateProposalModal}
        onClose={() => setShowCreateProposalModal(false)}
      />
    </div>
  );
};

export default ProposalHistory;

const PaginationContainer = styled.div`
  .pagination {
    display: flex;
    justify-content: center;
    padding: 10px;
    list-style: none;
    border-radius: 5px;
    margin-bottom: 1.5rem;
  }

  .pagination li {
    margin: 0 5px;
  }

  .pagination li a {
    display: block;
    padding: 8px 16px;
    border: 1px solid #e6ecf1;
    color: #a73418;
    cursor: pointer;
    text-decoration: none;
    border-radius: 5px;
    box-shadow: 0px 0px 1px #000;
    font-size: 14px;
  }

  .pagination li.active a {
    background-color: #fef9c3;
    color: #d7a548;
    border: 1px solid #fef9c3;
  }

  .pagination li.disabled a {
    color: #166556;
    cursor: not-allowed;
    background-color: #dcfce7;
    border: 1px solid #dcfce7;
  }

  .pagination li a:hover:not(.active) {
    background-color: #dcfce7;
    color: #166556;
  }

  @media (max-width: 768px) {
    .pagination {
      padding: 5px;
      flex-wrap: wrap;
    }

    .pagination li {
      margin: 2px;
    }

    .pagination li a {
      padding: 6px 10px;
      font-size: 12px;
    }
  }

  @media (max-width: 480px) {
    .pagination {
      padding: 5px;
    }

    .pagination li {
      margin: 2px;
    }

    .pagination li a {
      padding: 4px 8px;
      font-size: 10px;
    }
  }
`;
