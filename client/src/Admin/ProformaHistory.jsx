import React, { useEffect, useState, useRef } from "react";
import { Calendar, Search, Eye, FileText, Hash, ChevronDown, IndianRupee, Trash, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import moment from "moment";
import ReactPaginate from "react-paginate";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../redux/user/userSlice";
import Swal from "sweetalert2";
import API_BASE_URL from "../config/apiBaseUrl";
import GenerateProformaModal from "./components/GenerateProformaModal";

const ProformaHistory = ({ openProformaManager, setActiveTab }) => {
  const baseURL = API_BASE_URL;
  const navigate = useNavigate();
  const [fetchServices, setFetchServices] = useState([]);
  const { currentUser, token } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const clientPerPage = 10;
  
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [createDropdownOpen, setCreateDropdownOpen] = useState(false);
  const [showProformaModal, setShowProformaModal] = useState(false);
  const [proposalsList, setProposalsList] = useState([]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".action-dropdown-container")) {
        setOpenDropdownId(null);
      }
      if (!event.target.closest(".create-dropdown-container")) {
        setCreateDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchProposalsForModal = async () => {
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/calculator/proposals/all`,
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
        setProposalsList(uniqueTxnData);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchProposalsForModal();
  }, [token, baseURL]);

  const fetchAllProformas = async () => {
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/calculator/proforma/all`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.status === "Success") {
        setFetchServices(res.data.data);
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
    fetchAllProformas();
  }, []);

  const filteredItems = fetchServices.filter((row) => {
    if (!keyword.trim()) return true;
    const searchTerm = keyword.trim().toLowerCase();
    return (
      (row?.id && `PROF-${row.id}`.toLowerCase().includes(searchTerm)) ||
      (row?.proposal_id && String(row.proposal_id).toLowerCase().includes(searchTerm)) ||
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
      draft: "Draft",
      active: "Active",
      rejected: "Rejected",
      invoiced: "Invoiced",
      partially_paid: "Partially Paid"
    };
    return map[status] || status || "Pending";
  };

  const handlePreview = (item) => {
    // Determine GST status based on is_gst field safely
    const isGST = item.is_gst && typeof item.is_gst === 'object' && item.is_gst.data ? item.is_gst.data[0] === 1 : Number(item.is_gst) === 1;
    navigate(`/admin/quotation/${item.client_id}/${item.id}?doc=proforma&source=proposal&gst=${isGST ? 1 : 0}`);
  };

  const handleDelete = async (item) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You will not be able to recover this proforma!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${baseURL}/auth/api/calculator/proforma/${item.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          Swal.fire("Deleted!", "Proforma has been deleted.", "success");
          fetchAllProformas();
        } catch (error) {
          console.error("Error deleting proforma:", error);
          Swal.fire("Error", "Failed to delete proforma.", "error");
        }
      }
    });
  };

  // Dropdown for Actions
  const ActionDropdown = ({ item }) => (
    <div className="relative action-dropdown-container">
      <button
        onClick={() => setOpenDropdownId(openDropdownId === item.id ? null : item.id)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-700 hover:bg-gray-600 text-white transition-all shadow-sm shadow-black/20"
      >
        Actions <ChevronDown size={13} />
      </button>

      {openDropdownId === item.id && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-xl shadow-xl shadow-black/50 border border-gray-700/50 overflow-hidden z-[50]">
          <button
            onClick={() => {
              setOpenDropdownId(null);
              handlePreview(item);
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-700/50 hover:text-white transition-colors"
          >
            <Eye size={15} className="text-red-400" /> Preview
          </button>
          
          <button
            onClick={() => {
              setOpenDropdownId(null);
              // Pass the entire proforma object to the manager
              openProformaManager({ 
                ...item, 
                isDirectProforma: true, 
                client_id: item.client_id, 
                client_name: item.client_name 
              });
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-700/50 hover:text-white transition-colors"
          >
            <IndianRupee size={15} className="text-yellow-400" /> Record Payment
          </button>

          <button
            onClick={() => {
              setOpenDropdownId(null);
              handleDelete(item);
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-gray-700/50 hover:text-red-300 transition-colors"
          >
            <Trash size={15} /> Delete
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Search & Header */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-amber-400 transition-colors" />
          </div>
          <input
            type="text"
            className="w-full pl-11 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-2xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none text-white placeholder-gray-400 transition-all shadow-inner"
            placeholder="Search by Client, Proforma No, Proposal ID..."
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setCurrentPage(0);
            }}
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="relative create-dropdown-container">
            <button
              onClick={() => setCreateDropdownOpen(!createDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition-all hover:scale-105"
            >
              <FileText className="w-4 h-4" />
              Create Proforma <ChevronDown size={14} />
            </button>
            {createDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-xl shadow-xl shadow-black/50 border border-gray-700/50 overflow-hidden z-50">
                <button
                  onClick={() => {
                    setCreateDropdownOpen(false);
                    setShowProformaModal(true);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-200 hover:bg-gray-700/50 hover:text-white transition-colors border-b border-gray-700/50"
                >
                  <FileText className="w-4 h-4 text-orange-400" />
                  Create Proforma
                </button>
                <button
                  onClick={() => {
                    setCreateDropdownOpen(false);
                    if (setActiveTab) {
                      localStorage.setItem("createInvoiceDefaultMode", "client");
                      setActiveTab("createinvoice");
                    } else {
                      navigate("/admin/dashboard");
                    }
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-200 hover:bg-gray-700/50 hover:text-white transition-colors"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  Instant Proforma
                </button>
              </div>
            )}
          </div>
          <div className="text-sm font-medium text-gray-400 bg-gray-800/30 px-4 py-2.5 rounded-xl border border-gray-700/50 whitespace-nowrap">
            {filteredItems.length} {filteredItems.length === 1 ? "record" : "records"}
          </div>
        </div>
      </div>

      {/* MOBILE: Cards */}
      <div className="md:hidden space-y-4">
        {showApiData.length > 0 ? (
          showApiData.map((item, index) => (
            <div
              key={item.id}
              className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-bold flex items-center justify-center">
                  {currentPage * clientPerPage + index + 1}
                </span>
                <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                  <Calendar className="w-3.5 h-3.5 text-orange-400" />
                  <span>{moment(item.created_at).format("DD MMM YYYY")}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">Client</p>
                  <p className="text-white font-semibold text-sm leading-tight">{item.client_name}</p>
                </div>
                <ActionDropdown item={item} />
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-gray-700/50 pt-2">
                <div>
                  <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">Proposal ID</p>
                  <p className="text-yellow-400 font-bold text-xs font-mono">{item.proposal_id ? `PROP-${item.proposal_id}` : <span className="text-gray-500 italic">Manual</span>}</p>
                </div>
                <div>
                  <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">Proforma No</p>
                  <p className="text-amber-400 font-bold text-xs font-mono">{`PROF-${item.id}`}</p>
                </div>
                <div>
                  <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">Total Amount</p>
                  <p className="text-orange-400 font-bold text-xs">₹{Number(item.total_amount).toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">Status</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-500/20 text-yellow-300">
                    {getStatusLabel(item.status)}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No proforma history found.</p>
          </div>
        )}
      </div>

      {/* DESKTOP: Table */}
      <div className="hidden md:block bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <div className="overflow-auto h-[calc(100vh-20rem)] max-h-[35rem]" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50 bg-gray-900/30">
                  <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">#</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">Date</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">Client Name</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">Proposal ID</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">Proforma No</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs whitespace-nowrap">Total Amount</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">Action</th>
                </tr>
              </thead>
              <tbody>
                {showApiData.length > 0 ? (
                  showApiData.map((item, index) => (
                    <tr key={item.id} className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-all duration-300 group">
                      <td className="py-4 px-6">
                        <span className="font-semibold text-white group-hover:text-amber-300 transition-colors">
                          {currentPage * clientPerPage + index + 1}
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-gray-300 group-hover:text-white transition-colors">
                          <Calendar className="w-4 h-4 text-orange-400 shrink-0" />
                          <span className="font-medium text-sm">{moment(item.created_at).format("DD MMMM YYYY")}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-semibold text-white group-hover:text-amber-300 transition-colors whitespace-nowrap">
                          {item.client_name}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-yellow-400 bg-yellow-400/10 px-2.5 py-1 rounded-lg w-fit border border-yellow-500/20 whitespace-nowrap">
                          <Hash className="w-3.5 h-3.5" />
                          <span className="font-bold text-xs font-mono">{item.proposal_id ? `PROP-${item.proposal_id}` : <span className="text-gray-500 italic">Manual</span>}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg w-fit border border-amber-500/20 whitespace-nowrap">
                          <Hash className="w-3.5 h-3.5" />
                          <span className="font-bold text-xs font-mono">{`PROF-${item.id}`}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="font-bold text-orange-400 text-sm">
                          ₹{Number(item.total_amount).toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 whitespace-nowrap">
                          {getStatusLabel(item.status)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <ActionDropdown item={item} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="py-16 text-center text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No proforma history found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center md:justify-end mt-6">
          <ReactPaginate
            previousLabel={"Prev"}
            nextLabel={"Next"}
            breakLabel={"..."}
            pageCount={totalPages}
            marginPagesDisplayed={2}
            pageRangeDisplayed={3}
            onPageChange={handlePageChange}
            containerClassName={"flex gap-2 items-center"}
            pageClassName={"rounded-xl overflow-hidden"}
            pageLinkClassName={"px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors block font-medium"}
            previousClassName={"rounded-xl overflow-hidden"}
            previousLinkClassName={"px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors block font-medium"}
            nextClassName={"rounded-xl overflow-hidden"}
            nextLinkClassName={"px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors block font-medium"}
            activeLinkClassName={"!bg-amber-500/20 !border-amber-500/50 !text-amber-400"}
            disabledClassName={"opacity-50 cursor-not-allowed"}
            disabledLinkClassName={"hover:bg-gray-800 hover:text-gray-300 cursor-not-allowed"}
          />
        </div>
      )}
      <GenerateProformaModal
        isOpen={showProformaModal}
        onClose={() => setShowProformaModal(false)}
        proposalsList={proposalsList}
      />
    </div>
  );
};

export default ProformaHistory;
