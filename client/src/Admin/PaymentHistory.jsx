import React, { useEffect, useState } from "react";
import { CreditCard, Search, Calendar, User, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import moment from "moment";
import ReactPaginate from "react-paginate";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../redux/user/userSlice";
import Swal from "sweetalert2";
import styled from "styled-components";
import API_BASE_URL from "../config/apiBaseUrl";

const PaymentHistory = () => {
  const baseURL = API_BASE_URL;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.user);

  const [payments, setPayments] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [paymentPage, setPaymentPage] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await axios.get(`${baseURL}/auth/api/calculator/proposal-payments/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.status === "Success") {
        setPayments(res.data.data);
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

  const filteredPayments = payments.filter((p) => {
    if (!keyword.trim()) return true;
    const q = keyword.trim().toLowerCase();
    return (
      (p.client_name && p.client_name.toLowerCase().includes(q)) ||
      (p.client_organization && p.client_organization.toLowerCase().includes(q)) ||
      (p.transaction_reference && p.transaction_reference.toLowerCase().includes(q))
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

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={keyword}
              placeholder="Search by client name, org, or ref..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800/60 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm outline-none transition-all"
              onChange={(e) => {
                setKeyword(e.target.value);
                setPaymentPage(0);
              }}
            />
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
                      <td colSpan="6" className="py-16 text-center text-gray-500">
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
