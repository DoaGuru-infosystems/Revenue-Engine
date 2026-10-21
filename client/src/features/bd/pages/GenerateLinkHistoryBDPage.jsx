import React, { useEffect, useState } from "react";
import { Search, Eye, FileText, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../../../config/apiBaseUrl";
import Swal from "sweetalert2";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../../../redux/user/userSlice";

export default function GenerateLinkHistoryBDPage() {
  const baseURL = API_BASE_URL;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;
  const { token } = useSelector((state) => state.user);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          `${baseURL}/auth/api/re_calculator/requirements`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (res.data.success) {
          setData(res.data.data || []);
        }
      } catch (err) {
        console.error("Error fetching history:", err);
        if (err.response && err.response.status === 401) {
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
    fetchData();
  }, [baseURL, token, dispatch, navigate]);

  const filteredData = data.filter((item) =>
    item.client_name?.toLowerCase().includes(search.toLowerCase())
  );

  const pageCount = Math.ceil(filteredData.length / itemsPerPage);
  const offset = currentPage * itemsPerPage;
  const currentItems = filteredData.slice(offset, offset + itemsPerPage);

  return (
    <div className="w-full" style={{ color: "var(--text-primary)" }}>
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6 text-orange-500 shrink-0" />
          <span>Requirements Link History</span>
        </h2>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by client name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(0);
            }}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)",
            }}
          />
        </div>
      </div>

      {/* Desktop table */}
      <div
        className="hidden md:block overflow-x-auto rounded-2xl"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-color)",
        }}
      >
        <table className="w-full text-left text-sm min-w-[560px]">
          <thead
            className="uppercase text-xs border-b"
            style={{
              color: "var(--text-muted)",
              borderColor: "var(--border-color)",
              backgroundColor: "var(--bg-secondary)",
            }}
          >
            <tr>
              <th className="py-3 px-4">#</th>
              <th className="py-3 px-4">Client Name</th>
              <th className="py-3 px-4">Created By</th>
              <th className="py-3 px-4">Created At</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody style={{ color: "var(--text-secondary)" }}>
            {currentItems.length > 0 ? (
              currentItems.map((item, index) => (
                <tr
                  key={item.id}
                  className="border-b transition-colors"
                  style={{ borderColor: "var(--border-light)" }}
                >
                  <td className="py-3 px-4">{offset + index + 1}</td>
                  <td
                    className="py-3 px-4 font-medium flex items-center gap-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <User className="w-4 h-4 text-orange-400 shrink-0" />
                    {item.client_name}
                  </td>
                  <td className="py-3 px-4">{item.created_by || "—"}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {new Date(item.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 flex justify-center">
                    <button
                      onClick={() => navigate(`/BD/review/${item.link_id}`)}
                      className="p-1.5 bg-orange-500/20 text-orange-500 hover:bg-orange-500/40 rounded-lg transition"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-6"
                  style={{ color: "var(--text-muted)" }}
                >
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {currentItems.length > 0 ? (
          currentItems.map((item, index) => (
            <div
              key={item.id}
              className="rounded-2xl p-4 space-y-2"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-color)",
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <User className="w-4 h-4 text-orange-400 shrink-0" />
                  <span className="font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                    {item.client_name}
                  </span>
                </div>
                <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
                  #{offset + index + 1}
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                By {item.created_by || "—"} · {new Date(item.created_at).toLocaleString()}
              </p>
              <button
                onClick={() => navigate(`/BD/review/${item.link_id}`)}
                className="w-full mt-1 py-2 rounded-xl text-sm font-semibold bg-orange-500/15 text-orange-500 hover:bg-orange-500/25 transition flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" /> View Details
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
            No records found.
          </div>
        )}
      </div>

      {pageCount > 1 && (
        <div
          className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-3 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          <span>
            Page {currentPage + 1} of {pageCount}
          </span>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl disabled:opacity-50"
              style={{
                backgroundColor: "var(--btn-secondary-bg)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
              }}
            >
              Prev
            </button>
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(pageCount - 1, p + 1))
              }
              disabled={currentPage === pageCount - 1}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl disabled:opacity-50"
              style={{
                backgroundColor: "var(--btn-secondary-bg)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
