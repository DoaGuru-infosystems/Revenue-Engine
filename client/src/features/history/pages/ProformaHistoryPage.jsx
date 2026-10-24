import React, { useEffect, useState, useRef } from "react";
import {
  Calendar,
  Search,
  Eye,
  FileText,
  Hash,
  ChevronDown,
  IndianRupee,
  Trash,
  Plus,
  CheckCircle2,
  CalendarPlus,
  XCircle,
  Clock,
  Users,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import moment from "moment";
import ReactPaginate from "react-paginate";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../../../redux/user/userSlice";
import Swal from "sweetalert2";
import API_BASE_URL from "../../../config/apiBaseUrl";
import GenerateProformaModal from "../components/GenerateProformaModal";
import { getBasePath, rolePath } from "../../../utils/rolePaths";

const parseIsGst = (val) => Boolean(val && (typeof val === 'object' && val.data ? val.data[0] === 1 : Number(val) === 1));

const ProformaHistoryPage = ({ openProformaManager, setActiveTab }) => {
  const baseURL = API_BASE_URL;
  const navigate = useNavigate();
  const [fetchServices, setFetchServices] = useState([]);
  const { currentUser, token } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const basePath = getBasePath(currentUser?.role);

  // Meeting Reschedule Modal State
  const [rescheduleModalItem, setRescheduleModalItem] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [gstFilter, setGstFilter] = useState("all"); // "all" | "gst" | "nongst"
  const [currentPage, setCurrentPage] = useState(0);
  const clientPerPage = 10;
  
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [dropdownPlacement, setDropdownPlacement] = useState({});
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
    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, []);

  const fetchProposalsForModal = async () => {
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
        const approvedProposals = uniqueTxnData.filter(p => 
          ['approved', 'client_approved', 'proforma_generated', 'proforma_sent', 'payment_awaited', 'partially_paid'].includes(p.status)
        );
        setProposalsList(approvedProposals);
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
        `${baseURL}/auth/api/re_calculator/proforma/all`,
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

  const gstCount = fetchServices.filter((row) => parseIsGst(row?.is_gst)).length;
  const nonGstCount = fetchServices.filter((row) => !parseIsGst(row?.is_gst)).length;

  const filteredItems = fetchServices.filter((row) => {
    const isGst = parseIsGst(row?.is_gst);

    if (gstFilter === "gst" && !isGst) return false;
    if (gstFilter === "nongst" && isGst) return false;

    if (!keyword.trim()) return true;
    const searchTerm = keyword.trim().toLowerCase();
    return (
      (row?.proforma_number && row.proforma_number.toLowerCase().includes(searchTerm)) ||
      (row?.id && `PROF-${row.id}`.toLowerCase().includes(searchTerm)) ||
      (row?.proposal_id && String(row.proposal_id).toLowerCase().includes(searchTerm)) ||
      (row?.client_name && row.client_name.toLowerCase().includes(searchTerm)) ||
      (searchTerm === "gst" && isGst) ||
      (searchTerm.includes("non") && !isGst)
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
    const isGST = parseIsGst(item?.is_gst);
    navigate(
      rolePath(
        basePath,
        "quotation",
        item.client_id,
        item.id,
        `doc=proforma&source=proposal&gst=${isGST ? 1 : 0}`
      )
    );
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
          await axios.delete(`${baseURL}/auth/api/re_calculator/proforma/${item.id}`, {
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

  const handleCreateBalanceProforma = async (item) => {
    Swal.fire({
      title: "Create Balance Proforma?",
      text: `Generate a new frozen balance snapshot for ${item.proforma_number || `PROF-${item.id}`}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#f59e0b",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Create Snapshot"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await axios.post(
            `${baseURL}/auth/api/re_calculator/balance-proforma/create`,
            {
              proforma_id: item.id,
              created_by: currentUser?.name || "Admin",
            },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              }
            }
          );
          if (res.data.status === "Success") {
            const newBal = res.data.data;
            const isGst = parseIsGst(item?.is_gst);
            Swal.fire({
              title: "Balance Proforma Created!",
              text: `${newBal.balance_proforma_number} generated with ₹${Number(newBal.current_balance || 0).toLocaleString("en-IN")} pending balance.`,
              icon: "success",
              showCancelButton: true,
              confirmButtonText: "View Now",
              cancelButtonText: "Close",
              confirmButtonColor: "#f59e0b"
            }).then((viewResult) => {
              if (viewResult.isConfirmed) {
                window.open(
                  `#${rolePath(basePath, "balance-proforma", item.client_id, newBal.id, `doc=balance-proforma-view&gst=${isGst ? 1 : 0}`)}`,
                  "_blank"
                );
              }
            });
          }
        } catch (error) {
          console.error("Failed to create balance proforma:", error);
          Swal.fire("Error", error.response?.data?.message || "Failed to create balance proforma.", "error");
        }
      }
    });
  };

  // Update Meeting Status
  const handleUpdateMeetingStatus = async (item, status, newDate = null) => {
    try {
      const res = await axios.patch(
        `${baseURL}/auth/api/re_calculator/proforma/${item.id}/meeting-status`,
        {
          meeting_status: status,
          meeting_rescheduled_date: newDate,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data?.status === "Success") {
        Swal.fire({
          icon: "success",
          title: "Meeting Status Updated!",
          text: `Marked as '${status}'${newDate ? ` (Rescheduled to ${moment(newDate).format("DD MMM YYYY")})` : ""}. Reminders updated.`,
          timer: 2000,
          showConfirmButton: false,
          background: "#1e293b",
          color: "#fff",
        });

        // Update in local state
        setFetchServices((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? { ...p, meeting_status: status, meeting_rescheduled_date: newDate }
              : p
          )
        );
      }
    } catch (err) {
      console.error("Update meeting status error:", err);
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: err.response?.data?.message || "Failed to update meeting status.",
        background: "#1e293b",
        color: "#fff",
      });
    }
  };

  // Submit Reschedule Modal
  const handleConfirmReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleDate) {
      Swal.fire({
        icon: "warning",
        title: "Date Required",
        text: "Please select the next meeting date.",
        background: "#1e293b",
        color: "#fff",
      });
      return;
    }

    setRescheduleLoading(true);
    await handleUpdateMeetingStatus(rescheduleModalItem, "rescheduled", rescheduleDate);
    setRescheduleLoading(false);
    setRescheduleModalItem(null);
  };

  const handleToggleDropdown = (e, id) => {
    e.stopPropagation();
    if (openDropdownId === id) {
      setOpenDropdownId(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const placement = spaceBelow < 340 && rect.top > 300 ? "top" : "bottom";
      setDropdownPlacement((prev) => ({ ...prev, [id]: placement }));
      setOpenDropdownId(id);
    }
  };

  // Dropdown for Actions
  const ActionDropdown = ({ item }) => {
    const isTop = dropdownPlacement[item.id] === "top";
    return (
      <div className="relative action-dropdown-container" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={(e) => handleToggleDropdown(e, item.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-700 hover:bg-gray-600 text-white transition-all shadow-sm shadow-black/20"
        >
          Actions <ChevronDown size={13} className={`transition-transform duration-200 ${openDropdownId === item.id ? "rotate-180" : ""}`} />
        </button>

        {openDropdownId === item.id && (
          <div
            className={`absolute right-0 ${
              isTop ? "bottom-full mb-2" : "top-full mt-2"
            } w-60 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700/60 max-h-[min(34rem,75vh)] overflow-y-auto custom-scrollbar z-[100] divide-y divide-gray-100 dark:divide-gray-700/60`}
            style={{
              boxShadow: "0 20px 40px -10px rgba(0,0,0,0.5), 0 0 15px rgba(0,0,0,0.3)",
            }}
          >
          <button
            onClick={() => {
              setOpenDropdownId(null);
              handlePreview(item);
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <Eye size={15} className="text-red-500 dark:text-red-400" /> Preview
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
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <IndianRupee size={15} className="text-amber-600 dark:text-yellow-400" /> Record Payment
          </button>

          { (item.payment_status === 'partial' || Number(item.total_paid_amount || 0) > 0) && (
            <button
              onClick={() => {
                setOpenDropdownId(null);
                handleCreateBalanceProforma(item);
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-gray-700/50 transition-colors font-medium"
            >
              <FileText size={15} className="text-amber-500 dark:text-amber-400" /> Balance Proforma
            </button>
          ) }

          {/* Meeting Reminder Actions */}
          <div className="py-1">
            <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400 flex items-center gap-1.5">
              <Clock size={11} className="text-orange-500 dark:text-orange-400" /> Meeting Status
            </div>

            <button
              onClick={() => {
                setOpenDropdownId(null);
                handleUpdateMeetingStatus(item, "done");
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <CheckCircle2 size={14} /> Mark as Done
            </button>

            <button
              onClick={() => {
                setOpenDropdownId(null);
                setRescheduleModalItem(item);
                setRescheduleDate(item.meeting_rescheduled_date || item.duration_end_date || "");
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-xs text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <CalendarPlus size={14} /> Reschedule Meeting
            </button>

            <button
              onClick={() => {
                setOpenDropdownId(null);
                handleUpdateMeetingStatus(item, "cancelled");
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-xs text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <XCircle size={14} /> Cancel Meeting
            </button>
          </div>

          <button
            onClick={() => {
              setOpenDropdownId(null);
              handleDelete(item);
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <Trash size={15} /> Delete
          </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="history-touch w-full min-h-full flex-1 space-y-6">
      {/* Search & Header */}
      <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center justify-between">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center w-full xl:w-auto min-w-0">
          {/* Search Input */}
          <div className="relative w-full md:flex-1 md:min-w-0 xl:w-80 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-amber-400 transition-colors" />
            </div>
            <input
              type="text"
              className="w-full pl-11 pr-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none text-white placeholder-gray-400 transition-all shadow-inner text-sm"
              placeholder="Search by Client, Proforma No, Proposal ID..."
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setCurrentPage(0);
              }}
            />
          </div>

          {/* GST / Non-GST / All Filter Tabs */}
          <div className="flex flex-wrap items-center p-1 bg-gray-800/60 border border-gray-700/50 rounded-xl w-full md:w-auto justify-center shadow-inner">
            <button
              onClick={() => {
                setGstFilter("all");
                setCurrentPage(0);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                gstFilter === "all"
                  ? "bg-amber-500 text-gray-950 shadow-md shadow-amber-500/20"
                  : "text-gray-400 hover:text-white hover:bg-gray-700/40"
              }`}
            >
              All{" "}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  gstFilter === "all"
                    ? "bg-black/20 text-gray-950"
                    : "bg-gray-700 text-gray-300"
                }`}
              >
                {fetchServices.length}
              </span>
            </button>
            <button
              onClick={() => {
                setGstFilter("gst");
                setCurrentPage(0);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                gstFilter === "gst"
                  ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                  : "text-gray-400 hover:text-white hover:bg-gray-700/40"
              }`}
            >
              GST{" "}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  gstFilter === "gst"
                    ? "bg-blue-700 text-white"
                    : "bg-gray-700 text-gray-300"
                }`}
              >
                {gstCount}
              </span>
            </button>
            <button
              onClick={() => {
                setGstFilter("nongst");
                setCurrentPage(0);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                gstFilter === "nongst"
                  ? "bg-slate-600 text-white shadow-md shadow-slate-600/20"
                  : "text-gray-400 hover:text-white hover:bg-gray-700/40"
              }`}
            >
              Non-GST{" "}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  gstFilter === "nongst"
                    ? "bg-slate-800 text-white"
                    : "bg-gray-700 text-gray-300"
                }`}
              >
                {nonGstCount}
              </span>
            </button>
          </div>
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
                      navigate(rolePath(basePath, "dashboard"));
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
      <div className="history-cards xl:hidden pb-40">
        {showApiData.length > 0 ? (
          showApiData.map((item, index) => (
            <div
              key={item.id}
              className={`bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 space-y-3 transition-all ${
                openDropdownId === item.id ? "relative z-30 ring-1 ring-amber-500/30" : "relative z-10"
              }`}
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
                  <p className="text-yellow-400 font-bold text-xs font-mono">{item.quotation_id ? (item.quotation_number || `QTN-${item.quotation_id}`) : item.proposal_id ? `PROP-${item.proposal_id}` : <span className="text-gray-500 italic">Manual</span>}</p>
                </div>
                <div>
                  <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">Proforma No</p>
                  <p className="text-amber-400 font-bold text-xs font-mono">{item.proforma_number || `PROF-${item.id}`}</p>
                </div>
                <div>
                  <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">Type</p>
                  {(() => {
                    const isGst = parseIsGst(item?.is_gst);
                    return isGst ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">GST</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-600/30 text-gray-300 border border-gray-600/30">Non-GST</span>
                    );
                  })()}
                </div>
                <div>
                  <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">Total Amount</p>
                  <p className="text-orange-400 font-bold text-xs">₹{Number(item.total_amount).toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">Payment Status</p>
                  {(() => {
                    const payStatus = item.payment_status || 'pending';
                    const payBadgeMap = {
                      'fully-paid': { label: 'Fully Paid', cls: 'bg-emerald-500/20 text-emerald-300' },
                      'partial': { label: 'Partial', cls: 'bg-amber-500/20 text-amber-300' },
                      'pending': { label: 'Pending', cls: 'bg-slate-700/50 text-slate-300' }
                    };
                    const conf = payBadgeMap[payStatus] || payBadgeMap['pending'];
                    return (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${conf.cls}`}>
                        {conf.label}
                      </span>
                    );
                  })()}
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
      <div className="hidden xl:block bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
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
                  <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">Meeting Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">Type</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs whitespace-nowrap">Total Amount</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">Payment Status</th>
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
                          <span className="font-bold text-xs font-mono">{item.quotation_id ? (item.quotation_number || `QTN-${item.quotation_id}`) : item.proposal_id ? `PROP-${item.proposal_id}` : <span className="text-gray-500 italic">Manual</span>}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg w-fit border border-amber-500/20 whitespace-nowrap">
                          <Hash className="w-3.5 h-3.5" />
                          <span className="font-bold text-xs font-mono">{item.proforma_number || `PROF-${item.id}`}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {item.assigned_team && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20 w-fit">
                              <Users size={10} /> {item.assigned_team}
                            </span>
                          )}
                          {(() => {
                            const status = item.meeting_status || "pending";
                            if (status === "done") {
                              return (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 w-fit">
                                  <CheckCircle2 size={10} /> Done
                                </span>
                              );
                            }
                            if (status === "rescheduled") {
                              return (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 w-fit">
                                  <CalendarPlus size={10} /> {item.meeting_rescheduled_date ? moment(item.meeting_rescheduled_date).format("DD MMM") : "Rescheduled"}
                                </span>
                              );
                            }
                            if (status === "cancelled") {
                              return (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-600/30 text-gray-400 border border-gray-600/30 w-fit">
                                  <XCircle size={10} /> Cancelled
                                </span>
                              );
                            }
                            return (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-600/30 dark:border-amber-500/20 w-fit">
                                <Clock size={10} className="text-amber-800 dark:text-amber-300" /> {item.duration_end_date ? `End: ${moment(item.duration_end_date).format("DD MMM")}` : "Pending"}
                              </span>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        {(() => {
                          const isGst = parseIsGst(item?.is_gst);
                          return isGst ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              GST
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-600/30 text-gray-300 border border-gray-600/30">
                              Non-GST
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="font-bold text-orange-400 text-sm">
                          ₹{Number(item.total_amount).toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {(() => {
                          const payStatus = item.payment_status || 'pending';
                          const payBadgeMap = {
                            'fully-paid': { label: 'Fully Paid', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
                            'partial': { label: 'Partial', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
                            'pending': { label: 'Pending', cls: 'bg-slate-700/50 text-slate-300 border-slate-600/40' }
                          };
                          const conf = payBadgeMap[payStatus] || payBadgeMap['pending'];
                          return (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border whitespace-nowrap ${conf.cls}`}>
                              {conf.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-4 px-6">
                        <ActionDropdown item={item} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="py-16 text-center text-gray-500">
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
      {/* Reschedule Meeting Modal */}
      {rescheduleModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CalendarPlus className="w-4 h-4 text-sky-400" /> Reschedule Meeting
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {rescheduleModalItem.client_name} ({rescheduleModalItem.proforma_number || `PROF-${rescheduleModalItem.id}`})
                </p>
              </div>
              <button
                onClick={() => setRescheduleModalItem(null)}
                className="p-1 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReschedule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Select Next Meeting Date *
                </label>
                <input
                  type="date"
                  value={rescheduleDate}
                  min={moment().format("YYYY-MM-DD")}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 [color-scheme:dark]"
                  required
                />
                <p className="text-[11px] text-gray-400 mt-1.5">
                  Meeting reminders (WhatsApp & Email) will begin 1 week prior to this new date.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setRescheduleModalItem(null)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rescheduleLoading}
                  className="px-5 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {rescheduleLoading && <Clock className="w-3.5 h-3.5 animate-spin" />}
                  Set Date & Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProformaHistoryPage;
