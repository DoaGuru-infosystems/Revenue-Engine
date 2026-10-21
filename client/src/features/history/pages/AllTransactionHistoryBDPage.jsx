import React, { useEffect, useState } from "react";
import { Calendar, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import moment from "moment";
import ReactPaginate from "react-paginate";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../../../redux/user/userSlice";
import Swal from "sweetalert2";
import API_BASE_URL from "../../../config/apiBaseUrl";

const AllTransactionHistoryBDPage = () => {
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

  const fetchAllClientServices = async () => {
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/re_calculator/getClientsTxnByEmployee/${currentUser.name}`,
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
          if (item.txn_id && !seenTxnIds.has(item.txn_id)) {
            seenTxnIds.add(item.txn_id);
            uniqueTxnData.push(item);
          }
        }

        setFetchServices(uniqueTxnData);
      }
    } catch (error) {
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
    fetchAllClientServices();
  }, []);

  const filteredItems = fetchServices.filter((row) => {
    if (!keyword.trim()) return true;
    const searchTerm = keyword.trim().toLowerCase();
    return (
      (row?.txn_id && row.txn_id.toLowerCase().includes(searchTerm)) ||
      (row?.client_name && row.client_name.toLowerCase().includes(searchTerm))
    );
  });

  const totalPages = Math.ceil(filteredItems.length / clientPerPage) || 1;

  const filterPagination = () => {
    const startIndex = currentPage * clientPerPage;
    const endIndex = startIndex + clientPerPage;
    return filteredItems?.slice(startIndex, endIndex);
  };

  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  const showApiData = filterPagination();

  const openPreview = (item) => {
    setSelectedClient(item.client_id);
    setSelectedTxn(item.txn_id);
    setShowModal(true);
  };

  return (
    <div className="w-full relative overflow-hidden min-h-0">
      <div className="relative z-10 p-3 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h2
            className="text-2xl sm:text-3xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            History
          </h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400" />
            <input
              type="text"
              value={keyword}
              placeholder="Search by name or TXN ID"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
              }}
              onChange={(e) => {
                setKeyword(e.target.value);
                setCurrentPage(0);
              }}
            />
          </div>
        </div>

        {/* Desktop table */}
        <div
          className="hidden md:block rounded-2xl overflow-hidden"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-color)",
          }}
        >
          <div className="overflow-x-auto max-h-[min(35rem,calc(100vh-16rem))]">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                  {["#", "Date", "Client", "TXN ID", "Quotation"].map((h) => (
                    <th
                      key={h}
                      className="text-left py-4 px-4 lg:px-6 font-semibold uppercase tracking-wider text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {showApiData.length > 0 ? (
                  showApiData.map((item, index) => (
                    <tr
                      key={item.id}
                      className="transition-colors"
                      style={{ borderBottom: "1px solid var(--border-light)" }}
                    >
                      <td className="py-4 px-4 lg:px-6 font-semibold" style={{ color: "var(--text-primary)" }}>
                        {currentPage * clientPerPage + index + 1}
                      </td>
                      <td className="py-4 px-4 lg:px-6">
                        <div className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                          <Calendar className="w-4 h-4 text-orange-400 shrink-0" />
                          <span className="font-medium whitespace-nowrap">
                            {moment(item.txn_date).format("DD MMM YYYY")}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 lg:px-6 font-semibold" style={{ color: "var(--text-primary)" }}>
                        {item.client_name}
                      </td>
                      <td className="py-4 px-4 lg:px-6 font-bold text-amber-600 dark:text-yellow-400">
                        {item.txn_id || "N/A"}
                      </td>
                      <td className="py-4 px-4 lg:px-6">
                        <button
                          onClick={() => openPreview(item)}
                          className="px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20"
                        >
                          Preview
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="py-10 text-center"
                      style={{ color: "var(--text-muted)" }}
                    >
                      No service history found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {showApiData.length > 0 ? (
            showApiData.map((item, index) => (
              <div
                key={item.id}
                className="rounded-2xl p-4 space-y-3"
                style={{
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <div className="flex justify-between gap-2">
                  <span className="font-bold truncate" style={{ color: "var(--text-primary)" }}>
                    {item.client_name}
                  </span>
                  <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
                    #{currentPage * clientPerPage + index + 1}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                  <Calendar className="w-3.5 h-3.5 text-orange-400" />
                  {moment(item.txn_date).format("DD MMM YYYY")}
                </div>
                <p className="text-sm font-semibold text-amber-600 dark:text-yellow-400 break-all">
                  {item.txn_id || "N/A"}
                </p>
                <button
                  onClick={() => openPreview(item)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-orange-500 to-red-500 text-white"
                >
                  Preview Quotation
                </button>
              </div>
            ))
          ) : (
            <div
              className="text-center py-10 rounded-2xl text-sm"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                color: "var(--text-muted)",
              }}
            >
              No service history found.
            </div>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div
              className="relative w-full max-w-md rounded-2xl p-6 shadow-xl"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
              }}
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-3 right-3 text-red-500 hover:opacity-80 text-xl font-bold"
                aria-label="Close"
              >
                ×
              </button>
              <h2 className="text-lg font-semibold mb-4 text-center">
                Select Quotation Type
              </h2>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={() => {
                    navigate(`/BD/quotation/${selectedClient}/${selectedTxn}?gst=1`);
                    setShowModal(false);
                  }}
                  className="bg-green-500 text-white px-4 py-2.5 rounded-xl hover:bg-green-600 font-medium"
                >
                  With GST (18%)
                </button>
                <button
                  onClick={() => {
                    navigate(`/BD/quotation/${selectedClient}/${selectedTxn}?gst=0`);
                    setShowModal(false);
                  }}
                  className="px-4 py-2.5 rounded-xl font-medium"
                  style={{
                    backgroundColor: "var(--btn-secondary-bg)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  Without GST
                </button>
              </div>
            </div>
          </div>
        )}

        <PaginationContainer>
          <ReactPaginate
            previousLabel={"Previous"}
            nextLabel={"Next"}
            breakLabel={"..."}
            pageCount={totalPages}
            marginPagesDisplayed={1}
            pageRangeDisplayed={3}
            onPageChange={handlePageChange}
            containerClassName={"pagination"}
            activeClassName={"active"}
            forcePage={Math.min(currentPage, totalPages - 1)}
          />
        </PaginationContainer>
      </div>
    </div>
  );
};

export default AllTransactionHistoryBDPage;

const PaginationContainer = styled.div`
  .pagination {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    padding: 8px;
    list-style: none;
    gap: 4px;
    margin-bottom: 0.5rem;
  }

  .pagination li a {
    display: block;
    padding: 6px 12px;
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
    cursor: pointer;
    text-decoration: none;
    border-radius: 8px;
    font-size: 13px;
    background: var(--bg-card);
    transition: all 0.2s;
  }

  .pagination li a:hover {
    background: var(--hover-bg);
    color: var(--text-primary);
  }

  .pagination li.active a {
    background: rgba(234, 88, 12, 0.15);
    color: #ea580c;
    border-color: rgba(234, 88, 12, 0.35);
  }

  .pagination li.disabled a {
    color: var(--text-muted);
    cursor: not-allowed;
    opacity: 0.5;
  }

  @media (max-width: 640px) {
    .pagination li a {
      padding: 4px 8px;
      font-size: 11px;
    }
  }
`;
