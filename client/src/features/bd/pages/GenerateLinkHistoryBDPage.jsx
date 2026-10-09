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
    <div className="w-full text-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6 text-orange-500" />
          Requirements Link History
        </h2>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by client name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(0);
            }}
            className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto bg-gray-800/40 border border-gray-700 rounded-2xl">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-gray-800/80 uppercase text-xs text-gray-400 border-b border-gray-700">
            <tr>
              <th className="py-3 px-4">#</th>
              <th className="py-3 px-4">Client Name</th>
              <th className="py-3 px-4">Created By</th>
              <th className="py-3 px-4">Created At</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((item, index) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                >
                  <td className="py-3 px-4">{offset + index + 1}</td>
                  <td className="py-3 px-4 font-medium text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-orange-400" />
                    {item.client_name}
                  </td>
                  <td className="py-3 px-4">{item.created_by || "—"}</td>
                  <td className="py-3 px-4">
                    {new Date(item.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 flex justify-center">
                    <button
                      onClick={() => navigate(`/BD/review/${item.link_id}`)}
                      className="p-1.5 bg-orange-500/20 text-orange-400 hover:bg-orange-500/40 rounded-lg transition"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-400">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="flex justify-between items-center mt-4 text-sm text-gray-400">
          <span>
            Page {currentPage + 1} of {pageCount}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(pageCount - 1, p + 1))
              }
              disabled={currentPage === pageCount - 1}
              className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
