import React, { useEffect, useState } from "react";
import {
  Calendar,
  Search,
  Trash,
  ChevronDown,
  EyeIcon,
  Copy,
  FileText,
  X,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import axios from "axios";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../redux/user/userSlice";
import Swal from "sweetalert2";
import API_BASE_URL from "../config/apiBaseUrl";

const InvoiceHistory = ({ setActiveTab }) => {
  const baseURL = API_BASE_URL;
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [fetchServices, setFetchServices] = useState([]); // Legacy

  const { id } = useParams();
  const { currentUser, token } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const clientPerPage = 10;
  const [filterType, setFilterType] = useState("All");

  const fetchAllClientServices = async () => {
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/re_calculator/getAllInvoice`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.data.status === "Success") {
        setFetchServices(res.data.data.reverse());
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
    setCurrentPage(0);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".action-dropdown-container")) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getFilteredItems = () => {
    return fetchServices.filter((row) => {
      if (filterType !== "All" && row.bill_type !== filterType) return false;
      if (!keyword.trim()) return true;
      const searchTerm = keyword.trim().toLowerCase();
      return (
        (row?.txn_id && row.txn_id.toLowerCase().includes(searchTerm)) ||
        (row?.client_name && row.client_name.toLowerCase().includes(searchTerm)) ||
        (row?.client_organization &&
          row.client_organization.toLowerCase().includes(searchTerm))
      );
    });
  };

  const filteredItems = getFilteredItems();
  const totalPages = Math.ceil(filteredItems.length / clientPerPage);

  const filterPagination = () => {
    const startIndex = currentPage * clientPerPage;
    return filteredItems.slice(startIndex, startIndex + clientPerPage);
  };

  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
    setOpenDropdown(null);
  };

  const showApiData = filterPagination();

  // Legacy Actions
  const handleDeleteInvoice = async (txnId, clientId) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to delete this invoice permanently?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });
    if (!confirm.isConfirmed) return;
    try {
      const response = await axios.delete(
        `${baseURL}/auth/api/re_calculator/deleteAllInvoiceServiceHistory/${clientId}/${txnId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.status === "Success") {
        setFetchServices((prev) => prev.filter((item) => item.txn_id !== txnId));
        Swal.fire({ icon: "success", title: "Deleted!", showConfirmButton: false, timer: 1000 });
      } else {
        Swal.fire({ icon: "error", title: "Failed!", text: response.data.message || "Unable to delete.", showConfirmButton: false, timer: 1000 });
      }
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: "Something went wrong.", showConfirmButton: false, timer: 1000 });
    }
  };



  const handleNavigateInvoice = (selectedTxn, selectedClient, billType) => {
    const isGST = billType === "GST";
    navigate(`/admin/invoice/${selectedClient}/${selectedTxn}?gst=${isGST ? 1 : 0}`);
  };

  // Dropdown for Actions
  const ActionDropdown = ({ item, index, globalIndex }) => (
    <div className="relative action-dropdown-container">
      <button
        onClick={ () => setOpenDropdown(openDropdown === globalIndex ? null : globalIndex) }
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md"
      >
        Actions <ChevronDown size={ 13 } />
      </button>

      { openDropdown === globalIndex && (
        <div className="absolute right-0 top-full mt-2 w-36 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <button
            onClick={ () => {
              handleNavigateInvoice(item.txn_id, item.client_id, item.bill_type);
              setOpenDropdown(null);
            } }
            className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <EyeIcon size={ 13 } className="text-gray-500" /> Preview
          </button>

          { item.tag_received_amt !== "received" && (
            <button
              onClick={ () => {
                handleDeleteInvoice(item.txn_id, item.client_id);
                setOpenDropdown(null);
              } }
              className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash size={ 13 } /> Delete
            </button>
          ) }
        </div>
      ) }
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="relative z-10 p-4 sm:p-6 space-y-6">

        {/* ── Header ─────────────────────────────────────────────────────────── */ }
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Invoice History
            </h2>

          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            {/* Filter (Only for Legacy) */ }
            <select
              value={ filterType }
              onChange={ (e) => { setFilterType(e.target.value); setCurrentPage(0); } }
              className="w-full sm:w-auto px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 backdrop-blur-sm hover:bg-gray-700/50 transition-all"
            >
              <option value="All">All Types</option>
              <option value="GST">GST</option>
              <option value="NON_GST">Non-GST</option>
            </select>

            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={ keyword }
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 backdrop-blur-sm hover:bg-gray-700/50 transition-all"
                onChange={ (e) => { setKeyword(e.target.value); setCurrentPage(0); } }
              />
              { keyword && (
                <button onClick={ () => setKeyword("") } className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  <X size={ 14 } />
                </button>
              ) }
            </div>

            <div className="flex items-center text-sm text-gray-400 whitespace-nowrap">
              { filteredItems.length } record{ filteredItems.length !== 1 ? "s" : "" }
            </div>
          </div>
        </div>

        {/* ── Desktop Table (hidden on mobile) ──────────────────────────────── */ }
        <div className="hidden md:block bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
          <div className="p-4 lg:p-8">
            <div className="overflow-auto h-[35rem]" style={ { scrollbarWidth: 'none', msOverflowStyle: 'none' } }>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700/50">
                    <th className="text-left py-4 px-4 lg:px-6 font-semibold text-gray-200 uppercase tracking-wider text-xs lg:text-sm whitespace-nowrap">#</th>
                    <th className="text-left py-4 px-4 lg:px-6 font-semibold text-gray-200 uppercase tracking-wider text-xs lg:text-sm whitespace-nowrap">Date</th>
                    <th className="text-left py-4 px-4 lg:px-6 font-semibold text-gray-200 uppercase tracking-wider text-xs lg:text-sm whitespace-nowrap">Client</th>
                    <th className="text-left py-4 px-4 lg:px-6 font-semibold text-gray-200 uppercase tracking-wider text-xs lg:text-sm whitespace-nowrap">
                      { "TXN ID" }
                    </th>
                    <th className="text-left py-4 px-4 lg:px-6 font-semibold text-gray-200 uppercase tracking-wider text-xs lg:text-sm whitespace-nowrap">
                      { "Bill Number" }
                    </th>
                    <th className="text-left py-4 px-4 lg:px-6 font-semibold text-gray-200 uppercase tracking-wider text-xs lg:text-sm whitespace-nowrap">Action</th>
                    <th className="text-left py-4 px-4 lg:px-6 font-semibold text-gray-200 uppercase tracking-wider text-xs lg:text-sm whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody>
                  { showApiData.length > 0 ? (
                    showApiData.map((item, index) => {
                      const globalIndex = currentPage * clientPerPage + index;

                      // LEGACY RENDER
                      return (
                        <tr key={ item.id } className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-all duration-300 group">
                          <td className="py-5 px-4 lg:px-6 font-semibold text-white group-hover:text-orange-300">{ globalIndex + 1 }</td>
                          <td className="py-5 px-4 lg:px-6">
                            <div className="flex items-center gap-2 text-gray-300 group-hover:text-white transition-colors whitespace-nowrap">
                              <Calendar className="w-4 h-4 text-orange-400 flex-shrink-0" />
                              <span className="text-sm font-medium">{ moment(item.created_at).format("DD MMM YYYY") }</span>
                            </div>
                          </td>
                          <td className="py-5 px-4 lg:px-6 font-semibold text-white group-hover:text-orange-300 max-w-[140px] truncate">
                            { item.client_name }
                          </td>
                          <td className="py-5 px-4 lg:px-6 font-bold text-sm bg-gradient-to-r from-green-400 to-yellow-400 bg-clip-text text-transparent">
                            { item.txn_id || "N/A" }
                          </td>
                          <td className="py-5 px-4 lg:px-6">
                            <span className={ `inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${item.bill_type === "GST" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-300"}` }>
                              { item.bill_type === "GST" ? `GST-${item.bill_number}` : `N-GST-${item.bill_number}` }
                            </span>
                          </td>
                          <td className="py-5 px-4 lg:px-6 relative">
                            <ActionDropdown item={ item } index={ index } globalIndex={ globalIndex } />
                          </td>
                          <td className="py-5 px-4 lg:px-6">
                            <span className={ `inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${item.tag_received_amt === "received" ? "bg-red-500/80 text-white" : "bg-red-500/80 text-white"}` }>
                              { item.tag_received_amt }
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-16 text-center text-gray-400">
                        <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        No invoices found.
                      </td>
                    </tr>
                  ) }
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Mobile Cards (visible only on mobile) ─────────────────────────── */ }
        <div className="md:hidden space-y-3">
          { showApiData.length > 0 ? (
            showApiData.map((item, index) => {
              const globalIndex = currentPage * clientPerPage + index;

              // Legacy
              return (
                <div key={ item.id } className="bg-gray-800/40 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-4 shadow-lg">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 mb-0.5">#{ globalIndex + 1 }</p>
                      <h3 className="font-bold text-white text-base truncate">{ item.client_name }</h3>
                      <div className="flex items-center gap-1.5 mt-1 text-gray-400 text-xs">
                        <Calendar className="w-3.5 h-3.5 text-orange-400" />
                        { moment(item.created_at).format("DD MMM YYYY") }
                      </div>
                    </div>
                    <span className={ `flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${item.tag_received_amt === "received" ? "bg-red-500/80 text-white" : "bg-red-500/80 text-white"}` }>
                      { item.tag_received_amt }
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-gray-900/40 rounded-xl p-2.5">
                      <p className="text-xs text-gray-500 mb-0.5">TXN ID</p>
                      <p className="text-sm font-bold text-green-400 truncate">{ item.txn_id || "N/A" }</p>
                    </div>
                    <div className="bg-gray-900/40 rounded-xl p-2.5">
                      <p className="text-xs text-gray-500 mb-0.5">Bill</p>
                      <span className={ `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${item.bill_type === "GST" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-300"}` }>
                        { item.bill_type === "GST" ? `GST-${item.bill_number}` : `N-GST-${item.bill_number}` }
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-700/40">
                    <button
                      onClick={ () => handleNavigateInvoice(item.txn_id, item.client_id, item.bill_type) }
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-gray-700/60 text-gray-200 hover:bg-gray-600/60 active:scale-95 transition-all"
                    >
                      <EyeIcon size={ 13 } /> Preview
                    </button>
                    <button
                      onClick={ () => handleCopyInvoice(item.txn_id) }
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-red-600/30 text-red-300 hover:bg-red-600/50 active:scale-95 transition-all"
                    >
                      <Copy size={ 13 } /> Copy
                    </button>
                    { item.tag_received_amt !== "received" && (
                      <button
                        onClick={ () => handleDeleteInvoice(item.txn_id, item.client_id) }
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-red-600/30 text-red-300 hover:bg-red-600/50 active:scale-95 transition-all"
                      >
                        <Trash size={ 13 } /> Delete
                      </button>
                    ) }
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-12 text-center">
              <FileText className="w-10 h-10 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400 text-sm">No invoices found.</p>
            </div>
          ) }
        </div>

        {/* ── Pagination ────────────────────────────────────────────────────── */ }
        { totalPages > 1 && (
          <div className="p-3 border-t border-gray-700/30 bg-gray-800/40 flex items-center justify-center gap-3 rounded-2xl mt-2">
            <button
              onClick={ () => setCurrentPage((p) => Math.max(0, p - 1)) }
              disabled={ currentPage === 0 }
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-700/50 text-gray-300 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">Page</span>
              <select
                value={ currentPage }
                onChange={ (e) => setCurrentPage(Number(e.target.value)) }
                className="bg-gray-900/80 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer appearance-none min-w-[70px] text-center"
                style={ { backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 fill=%27%239ca3af%27 viewBox=%270 0 16 16%27%3E%3Cpath d=%27M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z%27/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', paddingRight: '28px' } }
              >
                { Array.from({ length: totalPages }, (_, i) => (
                  <option key={ i } value={ i }>{ i + 1 }</option>
                )) }
              </select>
              <span className="text-gray-500 text-sm">of { totalPages }</span>
            </div>
            <button
              onClick={ () => setCurrentPage((p) => Math.min(totalPages - 1, p + 1)) }
              disabled={ currentPage >= totalPages - 1 }
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-700/50 text-gray-300 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        ) }
      </div>
    </div>
  );
};

export default InvoiceHistory;