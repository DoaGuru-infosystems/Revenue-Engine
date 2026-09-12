import React, { useEffect, useState } from "react";
import {
  CreditCard,
  Search,
  Calendar,
  User,
  FileText,
  Hash,
  IndianRupee,
  X,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Receipt,
  Layers,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import moment from "moment";
import ReactPaginate from "react-paginate";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../redux/user/userSlice";
import Swal from "sweetalert2";
import styled from "styled-components";
import API_BASE_URL from "../config/apiBaseUrl";

const parseIsGst = (val) =>
  Boolean(
    val &&
      (typeof val === "object" && val.data
        ? val.data[0] === 1
        : Number(val) === 1)
  );

const PaymentHistory = ({ openProformaManager }) => {
  const baseURL = API_BASE_URL;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.user);

  const [payments, setPayments] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [paymentPage, setPaymentPage] = useState(0);
  const itemsPerPage = 10;

  // State for Record Payment Proforma Selection Modal
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [proformaList, setProformaList] = useState([]);
  const [loadingProformas, setLoadingProformas] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [modalTab, setModalTab] = useState("partial"); // "partial" | "all_unpaid"

  useEffect(() => {
    fetchPayments();

    const handleRefresh = () => fetchPayments();
    window.addEventListener("paymentRecorded", handleRefresh);
    return () => window.removeEventListener("paymentRecorded", handleRefresh);
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await axios.get(`${baseURL}/auth/api/re_calculator/proposal-payments/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.status === "Success") {
        setPayments(res.data.data || []);
      }
    } catch (error) {
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

  const handleOpenSelectModal = async () => {
    setShowSelectModal(true);
    setModalSearch("");
    setModalTab("partial");
    setLoadingProformas(true);
    try {
      const res = await axios.get(`${baseURL}/auth/api/re_calculator/proforma/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.status === "Success") {
        setProformaList(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching proformas for payment modal:", err);
    } finally {
      setLoadingProformas(false);
    }
  };

  const handleSelectProformaForPayment = (proforma) => {
    setShowSelectModal(false);
    if (openProformaManager) {
      openProformaManager({
        ...proforma,
        isDirectProforma: true,
        client_id: proforma.client_id,
        client_name: proforma.client_name,
        openRecordPaymentDirectly: true,
      });
    }
  };

  // Filter proformas for the selection modal
  const partialProformas = proformaList.filter((item) => {
    const totalAmount = Number(item.total_amount) || 0;
    const paidAmount = Number(item.total_paid_amount) || 0;
    const isFullyPaid = totalAmount - paidAmount <= 0.05 && totalAmount > 0;
    if (isFullyPaid || item.status === "paid" || item.status === "invoiced") return false;
    return (
      item.payment_status === "partial" ||
      (paidAmount > 0 && paidAmount < totalAmount - 0.05)
    );
  });

  const allUnpaidProformas = proformaList.filter((item) => {
    const totalAmount = Number(item.total_amount) || 0;
    const paidAmount = Number(item.total_paid_amount) || 0;
    const isFullyPaid = totalAmount - paidAmount <= 0.05 && totalAmount > 0;
    return !isFullyPaid && item.status !== "paid" && item.status !== "invoiced";
  });

  const displayedProformas = (
    modalTab === "partial" ? partialProformas : allUnpaidProformas
  ).filter((item) => {
    if (!modalSearch.trim()) return true;
    const q = modalSearch.trim().toLowerCase();
    const isGst = parseIsGst(item.is_gst);
    const pfNo =
      item.proforma_number ||
      (isGst ? `GST-PROF-${item.id}` : `NONGST-PROF-${item.id}`);
    return (
      pfNo.toLowerCase().includes(q) ||
      `prof-${item.id}`.toLowerCase().includes(q) ||
      (item.client_name && item.client_name.toLowerCase().includes(q)) ||
      (item.client_organization &&
        item.client_organization.toLowerCase().includes(q)) ||
      (item.proposal_id && String(item.proposal_id).toLowerCase().includes(q))
    );
  });

  const filteredPayments = payments.filter((p) => {
    if (!keyword.trim()) return true;
    const q = keyword.trim().toLowerCase();
    const isGst = parseIsGst(p.is_gst);
    const pfNo =
      p.proforma_number ||
      (p.proforma_id
        ? isGst
          ? `GST-PROF-${p.proforma_id}`
          : `NONGST-PROF-${p.proforma_id}`
        : "");
    return (
      (p.client_name && p.client_name.toLowerCase().includes(q)) ||
      (p.client_organization &&
        p.client_organization.toLowerCase().includes(q)) ||
      (p.transaction_reference &&
        p.transaction_reference.toLowerCase().includes(q)) ||
      (pfNo && pfNo.toLowerCase().includes(q)) ||
      (p.proforma_id && `prof-${p.proforma_id}`.toLowerCase().includes(q))
    );
  });

  const paymentTotalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedPayments = filteredPayments.slice(
    paymentPage * itemsPerPage,
    (paymentPage + 1) * itemsPerPage
  );

  return (
    <div className="w-full bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 relative overflow-hidden rounded-2xl min-h-[500px]">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-orange-400" /> Payment History
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {filteredPayments.length} records found
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={keyword}
                placeholder="Search by client, org, proforma, or ref..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800/60 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm outline-none transition-all"
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setPaymentPage(0);
                }}
              />
            </div>

            <button
              onClick={handleOpenSelectModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-gray-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-105 whitespace-nowrap w-full sm:w-auto justify-center"
            >
              <IndianRupee className="w-4 h-4" />
              Record Payment
            </button>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <div className="overflow-auto max-h-[35rem]" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700/50 bg-gray-900/40">
                    <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">SNo</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">Client Details</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">Proforma No</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">Date</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">Mode & Ref</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">TDS</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">Received Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPayments.length > 0 ? (
                    paginatedPayments.map((p, index) => (
                      <tr key={p.id} className="border-b border-gray-700/30 hover:bg-gray-700/40 transition-all duration-300 group">
                        <td className="py-4 px-6">
                          <span className="font-bold text-gray-400 group-hover:text-amber-400 transition-colors">
                            {paymentPage * itemsPerPage + index + 1}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-700/50 flex items-center justify-center shrink-0 border border-gray-600/50 group-hover:border-amber-500/30 transition-colors">
                              <User className="w-5 h-5 text-gray-400 group-hover:text-amber-400 transition-colors" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-white whitespace-nowrap">
                                {p.client_name || "Unknown"}
                              </span>
                              {p.client_organization && (
                                <span className="text-xs text-gray-400 whitespace-nowrap flex items-center gap-1 mt-0.5">
                                  <FileText className="w-3 h-3" /> {p.client_organization}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          {p.proforma_id ? (
                            <div className="flex items-center gap-1.5 text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg w-fit border border-amber-500/20">
                              <Hash className="w-3.5 h-3.5" />
                              <span className="font-bold text-xs font-mono">
                                {p.proforma_number || (parseIsGst(p.is_gst) ? `GST-PROF-${p.proforma_id}` : `NONGST-PROF-${p.proforma_id}`)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-500 italic text-xs">-</span>
                          )}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-200">
                              {moment(p.payment_date).format('DD MMM YYYY')}
                            </span>
                            <span className="text-xs text-gray-500">
                              {moment(p.payment_date).format('hh:mm A')}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex w-fit items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-gray-700 text-gray-300 border border-gray-600">
                              {p.payment_mode || "N/A"}
                            </span>
                            <span className="text-gray-400 font-mono text-xs truncate max-w-[150px]">
                              {p.transaction_reference || 'No Ref'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {p.tds_applicable ? (
                            <div className="flex flex-col">
                              <span className="text-orange-400 text-sm font-semibold">
                                ₹{p.tds_amount}
                              </span>
                              <span className="text-gray-500 text-xs">
                                {p.tds_percentage}% TDS
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-600 italic text-sm">N/A</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="font-bold text-xl bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                            ₹{Number(p.amount).toLocaleString("en-IN")}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-16 text-center text-gray-500">
                        <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No payment history found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pagination */}
        {paymentTotalPages > 1 && (
          <PaginationContainer>
            <ReactPaginate
              previousLabel={"Prev"}
              nextLabel={"Next"}
              breakLabel={"..."}
              pageCount={paymentTotalPages}
              marginPagesDisplayed={2}
              pageRangeDisplayed={5}
              onPageChange={({ selected }) => setPaymentPage(selected)}
              containerClassName={"pagination"}
              activeClassName={"active"}
              forcePage={paymentPage}
            />
          </PaginationContainer>
        )}
      </div>

      {/* ── Select Proforma Modal (List of Partially Paid Proformas) ─────────────── */}
      {showSelectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-gray-700/80 rounded-2xl w-full max-w-3xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-gray-900/90 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <IndianRupee className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Record Payment</h3>
                  <p className="text-xs text-gray-400">
                    Select a proforma with pending balance to open the payment recorder
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSelectModal(false)}
                className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="p-4 border-b border-gray-800 bg-gray-900/50 space-y-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="inline-flex items-center p-1 bg-gray-800/80 border border-gray-700/60 rounded-xl w-full sm:w-auto">
                  <button
                    onClick={() => setModalTab("partial")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      modalTab === "partial"
                        ? "bg-amber-500 text-gray-950 shadow-md"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Partially Paid
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        modalTab === "partial"
                          ? "bg-black/20 text-gray-950"
                          : "bg-gray-700 text-gray-300"
                      }`}
                    >
                      {partialProformas.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setModalTab("all_unpaid")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      modalTab === "all_unpaid"
                        ? "bg-amber-500 text-gray-950 shadow-md"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    All Unpaid
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        modalTab === "all_unpaid"
                          ? "bg-black/20 text-gray-950"
                          : "bg-gray-700 text-gray-300"
                      }`}
                    >
                      {allUnpaidProformas.length}
                    </span>
                  </button>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                  <input
                    type="text"
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                    placeholder="Search client or proforma..."
                    className="w-full pl-9 pr-3 py-1.5 bg-gray-800/80 border border-gray-700 rounded-xl text-white placeholder-gray-400 text-xs outline-none focus:border-amber-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Proforma Cards List */}
            <div className="p-4 overflow-y-auto max-h-[55vh] space-y-3">
              {loadingProformas ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-xs">Loading proformas...</p>
                </div>
              ) : displayedProformas.length > 0 ? (
                displayedProformas.map((item) => {
                  const isGst = parseIsGst(item.is_gst);
                  const total = Number(item.total_amount) || 0;
                  const paid = Number(item.total_paid_amount) || 0;
                  const balance = Math.max(0, total - paid);
                  const pfNumber =
                    item.proforma_number ||
                    (isGst ? `GST-PROF-${item.id}` : `NONGST-PROF-${item.id}`);

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectProformaForPayment(item)}
                      className="bg-gray-800/40 hover:bg-gray-800/80 border border-gray-700/60 hover:border-amber-500/50 rounded-xl p-4 transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-lg hover:shadow-amber-500/5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Left: Info */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-xs text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                              {pfNumber}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                isGst
                                  ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                                  : "bg-gray-600/30 text-gray-300 border-gray-600/30"
                              }`}
                            >
                              {isGst ? "GST" : "Non-GST"}
                            </span>
                            {item.proposal_id && (
                              <span className="text-[10px] font-mono text-yellow-400/90 bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-500/20">
                                PROP-{item.proposal_id}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-sm">
                              {item.client_name || "Unknown Client"}
                            </span>
                            {item.client_organization && (
                              <span className="text-xs text-gray-400">
                                • {item.client_organization}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: Amounts & Action Button */}
                        <div className="flex items-center gap-4 sm:gap-6 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-700/40">
                          <div className="text-right">
                            <div className="text-xs text-gray-400">
                              Total:{" "}
                              <span className="text-gray-300 font-medium">
                                ₹{total.toLocaleString("en-IN")}
                              </span>
                            </div>
                            <div className="text-xs text-emerald-400">
                              Paid:{" "}
                              <span className="font-medium">
                                ₹{paid.toLocaleString("en-IN")}
                              </span>
                            </div>
                            <div className="text-sm font-bold text-amber-400 mt-0.5">
                              Bal: ₹{balance.toLocaleString("en-IN")}
                            </div>
                          </div>

                          <button
                            type="button"
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 group-hover:from-amber-600 group-hover:to-orange-600 text-gray-950 font-bold text-xs rounded-xl shadow transition-all whitespace-nowrap"
                          >
                            <span>Record</span>
                            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-gray-500 space-y-2">
                  <Receipt className="w-10 h-10 mx-auto opacity-30 text-amber-400" />
                  <p className="text-sm font-medium">No proformas match your filter.</p>
                  <p className="text-xs text-gray-600">
                    {modalTab === "partial"
                      ? "There are currently no proformas with partial payment status. Try 'All Unpaid' tab."
                      : "All proformas have been fully paid or none exist."}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-800 bg-gray-900/90 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Found <strong className="text-white">{displayedProformas.length}</strong> proforma{displayedProformas.length === 1 ? "" : "s"}
              </span>
              <button
                type="button"
                onClick={() => setShowSelectModal(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;

const PaginationContainer = styled.div`
  .pagination {
    display: flex;
    justify-content: flex-end;
    padding: 10px 0;
    list-style: none;
    gap: 6px;
  }
  .pagination li a {
    display: block;
    padding: 6px 14px;
    border: 1px solid rgba(107, 114, 128, 0.3);
    color: #9ca3af;
    cursor: pointer;
    text-decoration: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    background: rgba(31, 41, 55, 0.5);
    transition: all 0.2s ease;
  }
  .pagination li a:hover {
    background: rgba(245, 158, 11, 0.1);
    color: #fbbf24;
    border-color: rgba(245, 158, 11, 0.3);
  }
  .pagination li.active a {
    background: rgba(245, 158, 11, 0.2);
    color: #fcd34d;
    border-color: rgba(245, 158, 11, 0.5);
  }
  .pagination li.disabled a {
    color: #4b5563;
    cursor: not-allowed;
    background: transparent;
    border-color: transparent;
  }
`;
