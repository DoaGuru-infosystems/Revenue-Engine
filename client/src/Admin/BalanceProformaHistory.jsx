import React, { useEffect, useState } from "react";
import { Calendar, FileText, Hash, Eye } from "lucide-react";
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

  const [proformas, setProformas] = useState([]);
  const [proformaPage, setProformaPage] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchProformas();
  }, []);

  const fetchProformas = async () => {
    try {
      const res = await axios.get(`${baseURL}/auth/api/re_calculator/proforma/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.status === "Success") {
        setProformas(res.data.data);
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

  // Pagination for Proformas
  const proformaTotalPages = Math.ceil(proformas.length / itemsPerPage);
  const paginatedProformas = proformas.slice(
    proformaPage * itemsPerPage,
    (proformaPage + 1) * itemsPerPage
  );

  const handlePreviewPdf = (item) => {
    // Navigate to the correct invoice route as requested by the user
    navigate(`/admin/invoice/${item.client_id}/${item.id}?doc=proforma&source=proposal`);
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
            <div className="overflow-auto max-h-[25rem]" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700/50 bg-gray-900/30">
                    <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">#</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">Balance Proforma No</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">Created Date</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">Client Name</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProformas.length > 0 ? (
                    paginatedProformas.map((item, index) => (
                      <tr key={item.id} className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-all duration-300 group">
                        <td className="py-4 px-6">
                          <span className="font-semibold text-white group-hover:text-amber-300 transition-colors">
                            {proformaPage * itemsPerPage + index + 1}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5 text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg w-fit border border-amber-500/20 whitespace-nowrap">
                            <Hash className="w-3.5 h-3.5" />
                            <span className="font-bold text-xs font-mono">{`PROF-${item.id}`}</span>
                          </div>
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
                        <td className="py-4 px-6">
                          <button
                            onClick={() => handlePreviewPdf(item)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 transition-all"
                          >
                            <Eye size={14} /> Preview PDF
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-10 text-center text-gray-500">
                        No balance proformas found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {proformaTotalPages > 1 && (
          <div className="flex justify-end mt-4">
            <ReactPaginate
              previousLabel={"Prev"}
              nextLabel={"Next"}
              pageCount={proformaTotalPages}
              onPageChange={({ selected }) => setProformaPage(selected)}
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
