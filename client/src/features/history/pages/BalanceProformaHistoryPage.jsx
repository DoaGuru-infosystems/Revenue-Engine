import React, { useEffect, useState } from "react";
import { Calendar, FileText, Hash, Eye, ArrowUpRight, Trash2, Plus, Scale } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import moment from "moment";
import ReactPaginate from "react-paginate";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../../../redux/user/userSlice";
import Swal from "sweetalert2";
import API_BASE_URL from "../../../config/apiBaseUrl";
import CreateBalanceProformaModal from "../components/CreateBalanceProformaModal";
import { getBasePath, rolePath } from "../../../utils/rolePaths";

const BalanceProformaHistoryPage = () => {
  const baseURL = API_BASE_URL;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token, currentUser } = useSelector((state) => state.user);
  const basePath = getBasePath(currentUser?.role);

  const [balanceProformas, setBalanceProformas] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [page, setPage] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchBalanceProformas();
  }, []);

  const fetchBalanceProformas = async () => {
    try {
      const res = await axios.get(`${baseURL}/auth/api/re_calculator/balance-proforma/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.status === "Success") {
        setBalanceProformas(res.data.data || []);
      }
    } catch (error) {
      handleAuthError(error);
    }
  };

  const handleAuthError = (error) => {
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
  };

  // Pagination
  const totalPages = Math.ceil(balanceProformas.length / itemsPerPage);
  const paginatedItems = balanceProformas.slice(
    page * itemsPerPage,
    (page + 1) * itemsPerPage
  );

  const handlePreviewPdf = (item) => {
    window.open(
      `#${rolePath(basePath, "balance-proforma", item.client_id, item.id, `doc=balance-proforma-view&gst=${item.is_gst ? 1 : 0}`)}`,
      "_blank"
    );
  };

  const handleDelete = (item) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Do you want to permanently delete ${item.balance_proforma_number || `BAL-PROF-${item.balance_number}`}? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await axios.delete(`${baseURL}/auth/api/re_calculator/balance-proforma/${item.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data.status === "Success") {
            Swal.fire("Deleted!", res.data.message || "Balance Proforma deleted.", "success");
            fetchBalanceProformas();
          }
        } catch (error) {
          console.error("Error deleting balance proforma:", error);
          Swal.fire("Error", error.response?.data?.message || "Failed to delete balance proforma.", "error");
        }
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Balance Proformas Table Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent flex items-center gap-2">
            <Scale className="w-6 h-6 text-yellow-400" /> Balance Proformas
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Balance Proforma
          </button>
        </div>
        
        {/* MOBILE/TABLET: Cards (hidden on lg+) */}
        <div className="lg:hidden space-y-3">
          {paginatedItems.length > 0 ? (
            paginatedItems.map((item, index) => {
              const totalAmt = Number(item.total_amount || 0);
              const recAmt = Number(item.received_amount || 0);
              const curBal = Number(item.current_balance || 0);
              return (
                <div key={item.id} className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 space-y-3 hover:border-gray-600/60 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-bold flex items-center justify-center">
                      {page * itemsPerPage + index + 1}
                    </span>
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                      <Calendar className="w-3.5 h-3.5 text-orange-400" />
                      <span>{moment(item.created_at).format("DD MMM YYYY")}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">Client</p>
                    <p className="text-white font-semibold text-sm">{item.client_name || "Unknown"}</p>
                    {item.client_organization && <p className="text-gray-400 text-xs">{item.client_organization}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-t border-gray-700/50 pt-2">
                    <div>
                      <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">Balance No</p>
                      <p className="text-amber-400 font-bold text-xs font-mono">{item.balance_proforma_number || `BAL-PROF-${item.balance_number}`}</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">Source Ref</p>
                      <p className="text-gray-300 text-xs">{item.source_proforma_number || `PROF-${item.source_proforma_id}`}</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">Total</p>
                      <p className="text-gray-200 font-semibold text-xs">₹{totalAmt.toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">Received</p>
                      <p className="text-emerald-400 font-semibold text-xs">₹{recAmt.toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">Current Balance</p>
                      <div className="flex items-center gap-1">
                        <p className="text-green-400 font-bold text-xs">₹{curBal.toLocaleString("en-IN")}</p>
                        {curBal <= 0 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">Paid</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 border-t border-gray-700/50 pt-2">
                    <button
                      onClick={() => handlePreviewPdf(item)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/30 transition-all"
                    >
                      <Eye size={13} /> View <ArrowUpRight size={11} />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/30 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No balance proformas found.</p>
            </div>
          )}
        </div>

        {/* DESKTOP: Table (lg+ only) */}
        <div className="hidden lg:block bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <div className="overflow-auto max-h-[28rem]" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700/50 bg-gray-900/30">
                    <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">#</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">Balance Proforma No</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">Source Ref</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">Created Date</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">Client Name</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">Total</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">Received</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">Current Balance</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.length > 0 ? (
                    paginatedItems.map((item, index) => {
                      const totalAmt = Number(item.total_amount || 0);
                      const recAmt = Number(item.received_amount || 0);
                      const curBal = Number(item.current_balance || 0);
                      return (
                        <tr key={item.id} className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-all duration-300 group">
                          <td className="py-4 px-6">
                            <span className="font-semibold text-white group-hover:text-amber-300 transition-colors">
                              {page * itemsPerPage + index + 1}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-1.5 text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg w-fit border border-amber-500/20 whitespace-nowrap">
                              <Hash className="w-3.5 h-3.5" />
                              <span className="font-bold text-xs font-mono">
                                {item.balance_proforma_number || `BAL-PROF-${item.balance_number}`}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-700/60 text-gray-300 border border-gray-600">
                              Ref: {item.source_proforma_number || `PROF-${item.source_proforma_id}`}
                            </span>
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-gray-300 group-hover:text-white transition-colors">
                              <Calendar className="w-4 h-4 text-orange-400 shrink-0" />
                              <span className="font-medium text-sm">{moment(item.created_at).format("DD MMM YYYY")}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-col">
                              <span className="font-semibold text-white group-hover:text-amber-300 transition-colors whitespace-nowrap">
                                {item.client_name || "Unknown"}
                              </span>
                              {item.client_organization && (
                                <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors whitespace-nowrap">
                                  {item.client_organization}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right whitespace-nowrap">
                            <span className="text-sm font-semibold text-gray-200">₹{totalAmt.toLocaleString("en-IN")}</span>
                          </td>
                          <td className="py-4 px-6 text-right whitespace-nowrap">
                            <span className="text-sm font-semibold text-emerald-400">₹{recAmt.toLocaleString("en-IN")}</span>
                          </td>
                          <td className="py-4 px-6 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="text-sm font-bold text-green-400">₹{curBal.toLocaleString("en-IN")}</span>
                              {curBal <= 0 && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">Paid</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handlePreviewPdf(item)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/30 transition-all"
                                title="View Balance Proforma"
                              >
                                <Eye size={14} /> View <ArrowUpRight size={12} />
                              </button>
                              <button
                                onClick={() => handleDelete(item)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/30 transition-all"
                                title="Delete Balance Proforma"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="9" className="py-10 text-center text-gray-500">
                        No balance proformas found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>


        {totalPages > 1 && (
          <div className="flex justify-end mt-4">
            <ReactPaginate
              previousLabel={"Prev"}
              nextLabel={"Next"}
              pageCount={totalPages}
              onPageChange={({ selected }) => setPage(selected)}
              containerClassName={"flex gap-2 items-center"}
              pageLinkClassName={"px-3 py-1 bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 rounded-lg text-sm"}
              previousLinkClassName={"px-3 py-1 bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 rounded-lg text-sm"}
              nextLinkClassName={"px-3 py-1 bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 rounded-lg text-sm"}
              activeLinkClassName={"!bg-amber-500/20 !border-amber-500/50 !text-amber-400"}
            />
          </div>
        )}
      </div>

      <CreateBalanceProformaModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchBalanceProformas}
      />
    </div>
  );
};

export default BalanceProformaHistoryPage;
