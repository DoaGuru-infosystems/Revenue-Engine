import React, { useEffect, useState } from "react";
import { Calendar, FileText, Hash, Eye, ArrowUpRight, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import moment from "moment";
import ReactPaginate from "react-paginate";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../redux/user/userSlice";
import Swal from "sweetalert2";
import API_BASE_URL from "../config/apiBaseUrl";

const BalanceProformaHistory = () => {
  const baseURL = API_BASE_URL;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.user);

  const [balanceProformas, setBalanceProformas] = useState([]);
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
      `#/admin/quotation/${item.client_id}/${item.id}?doc=balance-proforma-view&gst=${item.is_gst ? 1 : 0}`,
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
        <h2 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent flex items-center gap-2">
          <FileText className="w-6 h-6 text-yellow-400" /> Balance Proformas
        </h2>
        
        <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
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
                            <span className="text-sm font-semibold text-gray-200">
                              ₹{totalAmt.toLocaleString("en-IN")}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right whitespace-nowrap">
                            <span className="text-sm font-semibold text-emerald-400">
                              ₹{recAmt.toLocaleString("en-IN")}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="text-sm font-bold text-green-400">
                                ₹{curBal.toLocaleString("en-IN")}
                              </span>
                              {curBal <= 0 && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                                  Paid
                                </span>
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
                                <Eye size={14} /> View
                                <ArrowUpRight size={12} />
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
    </div>
  );
};

export default BalanceProformaHistory;
