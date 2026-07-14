import React, { useEffect, useState } from "react";
import { Search, Eye, Trash2, FileText, X, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../config/apiBaseUrl";
import Swal from "sweetalert2";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../redux/user/userSlice";

const GenerateLinkHistory = () => {
  const baseURL = API_BASE_URL;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;
  const { token } = useSelector((state) => state.user);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          `${baseURL}/auth/api/calculator/requirements`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (res.data.success) {
          setData(res.data.data);
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
  }, []);

  const filteredData = data.filter((item) =>
    item.client_name?.toLowerCase().includes(search.toLowerCase())
  );

  const pageCount = Math.ceil(filteredData.length / itemsPerPage);
  const offset = currentPage * itemsPerPage;
  const currentItems = filteredData.slice(offset, offset + itemsPerPage);

  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  const handleDelete = async (linkId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "All submissions and items will be deleted permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(
        `${baseURL}/auth/api/calculator/deleteRequirementsBundle/${linkId}`
      );
      setData((prev) => prev.filter((row) => row.link_id !== linkId));
      Swal.fire({ title: "Deleted!", icon: "success", timer: 1000, showConfirmButton: false });
    } catch (err) {
      console.error("Delete failed:", err);
      Swal.fire({ title: "Error!", text: "Delete failed. Please try again.", icon: "error" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="relative z-10 p-4 sm:p-6 space-y-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Generate Link History
          </h2>

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search client..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(0); }}
                className="w-full pl-10 pr-9 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 backdrop-blur-sm hover:bg-gray-700/50 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Count badge */}
            <span className="text-sm text-gray-400">
              {filteredData.length} record{filteredData.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* ── Desktop Table (md+) ─────────────────────────────────────────── */}
        <div className="hidden md:block bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
          <div className="p-4 lg:p-8 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  {["#", "Client", "Created By", "Total Amount", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="text-left py-4 px-4 lg:px-6 font-semibold text-gray-200 uppercase tracking-wider text-xs lg:text-sm whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map((item, index) => (
                    <tr
                      key={item.link_id}
                      className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-all duration-300 group"
                    >
                      <td className="py-5 px-4 lg:px-6 text-white font-semibold group-hover:text-amber-300">
                        {offset + index + 1}
                      </td>
                      <td className="py-5 px-4 lg:px-6 text-white font-medium group-hover:text-amber-300 max-w-[160px] truncate">
                        {item.client_name}
                      </td>
                      <td className="py-5 px-4 lg:px-6 text-yellow-400 font-bold">
                        {item.created_by}
                      </td>
                      <td className="py-5 px-4 lg:px-6 text-amber-400 font-semibold">
                        ₹{item.total_amount}
                      </td>
                      <td className="py-5 px-4 lg:px-6">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/admin/review/${item.link_id}`)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md hover:scale-105 active:scale-95 transition-all"
                          >
                            <Eye size={14} /> Show
                          </button>
                          <button
                            onClick={() => handleDelete(item.link_id)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-red-600 to-red-600 text-white shadow-md hover:scale-105 active:scale-95 transition-all"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-16 text-center text-gray-400">
                      <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      No records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Mobile Cards (< md) ─────────────────────────────────────────── */}
        <div className="md:hidden space-y-3">
          {currentItems.length > 0 ? (
            currentItems.map((item, index) => (
              <div
                key={item.link_id}
                className="bg-gray-800/40 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-4 shadow-lg"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-0.5">#{offset + index + 1}</p>
                    <h3 className="font-bold text-white text-base truncate">
                      {item.client_name}
                    </h3>
                  </div>
                  {/* Total amount badge */}
                  <div className="flex-shrink-0 flex items-center gap-1 bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-sm font-bold">
                    ₹{item.total_amount}
                  </div>
                </div>

                {/* Created by */}
                <div className="flex items-center gap-2 mb-3 bg-gray-900/40 rounded-xl px-3 py-2">
                  <User size={13} className="text-yellow-400 flex-shrink-0" />
                  <span className="text-xs text-gray-400">Created by</span>
                  <span className="text-sm font-semibold text-yellow-400 truncate">
                    {item.created_by}
                  </span>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-2 border-t border-gray-700/40">
                  <button
                    onClick={() => navigate(`/admin/review/${item.link_id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md active:scale-95 transition-all"
                  >
                    <Eye size={13} /> Show
                  </button>
                  <button
                    onClick={() => handleDelete(item.link_id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-red-600/30 text-red-300 hover:bg-red-600/50 active:scale-95 transition-all"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-12 text-center">
              <FileText className="w-10 h-10 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400 text-sm">No records found.</p>
            </div>
          )}
        </div>

        {/* ── Pagination ──────────────────────────────────────────────────── */}
        {pageCount > 1 && (
          <div className="p-3 flex items-center justify-center gap-3 mt-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-700/50 text-gray-300 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">Page</span>
              <select
                value={currentPage}
                onChange={(e) => setCurrentPage(Number(e.target.value))}
                className="bg-gray-900/80 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer appearance-none min-w-[70px] text-center"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 fill=%27%239ca3af%27 viewBox=%270 0 16 16%27%3E%3Cpath d=%27M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z%27/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', paddingRight: '28px' }}
              >
                {Array.from({ length: pageCount }, (_, i) => (
                  <option key={i} value={i}>{i + 1}</option>
                ))}
              </select>
              <span className="text-gray-500 text-sm">of {pageCount}</span>
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={currentPage >= pageCount - 1}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-700/50 text-gray-300 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateLinkHistory;