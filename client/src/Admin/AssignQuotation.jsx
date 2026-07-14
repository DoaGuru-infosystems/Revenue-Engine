// import React, { useEffect, useState } from "react";
// import { Calendar, Search, ArrowLeft } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { useParams } from "react-router-dom";
// import axios from "axios";
// import moment from "moment";
// import ReactPaginate from "react-paginate";
// import styled from "styled-components";
// import { useDispatch, useSelector } from "react-redux";
// import { clearUser } from "../redux/user/userSlice";
// import Swal from "sweetalert2";
// import ServiceProgressTable from "./ServiceProgressTable";

// const AssignQuotation = () => {

//   const navigate = useNavigate();
//   const [fetchServices, setFetchServices] = useState([]);
//   // const [clientData, setClientData] = useState([]);
//   const { id } = useParams();
//   const { currentUser, token } = useSelector((state) => state.user);
//   const dispatch = useDispatch();
//   const [keyword, setKeyword] = useState("");
//   const [currentPage, setCurrentPage] = useState(0);
//   const clientPerPage = 5;
//   console.log(id);
//   console.log(currentUser);
//   const [showModal, setShowModal] = useState(false);
//   const [selectedClient, setSelectedClient] = useState(null);
//   const [selectedTxn, setSelectedTxn] = useState(null);
//   const [userID, setUserID] = useState(null);

//   const fetchAllClientServices = async () => {
//     try {
//       const res = await axios.get(
//         `${baseURL}/auth/api/re_calculator/getAssignedQuotations`,
//         {
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       if (res.data.status === "Success") {
//         setFetchServices(res.data.data);
//       }
//     } catch (error) {
//       console.log(error);
//       if (error.response && error.response.status === 401) {
//         Swal.fire({
//           title: "Session Expired",
//           text: "Please login again.",
//           icon: "warning",
//           confirmButtonText: "OK",
//         }).then(() => {
//           dispatch(clearUser());
//           localStorage.removeItem("token");
//           navigate("/");
//         });
//       }
//     }
//   };

//   console.log(fetchServices);

//   useEffect(() => {
//     fetchAllClientServices();
//   }, []);

//   const filteredItems = fetchServices.filter((row) => {
//     if (!keyword.trim()) return true;

//     const searchTerm = keyword.trim().toLowerCase();
//     return (
//       (row?.txn_id && row.txn_id.toLowerCase().includes(searchTerm)) ||
//       (row?.client_name && row.client_name.toLowerCase().includes(searchTerm))
//     );
//   });

//   console.log("Filtered:", filteredItems.length, filteredItems);

//   const totalPages = Math.ceil(filteredItems.length / clientPerPage);

//   const filterPagination = () => {
//     const startIndex = currentPage * clientPerPage;
//     const endIndex = startIndex + clientPerPage;
//     return filteredItems?.slice(startIndex, endIndex);
//   };

//   const handlePageChange = ({ selected }) => {
//     setCurrentPage(selected);
//   };

//   const showApiData = filterPagination();

//   const handleOpenProgress = (row) => {
//     const cid = row?.client_id ?? null;
//     const txn = row?.txn_id ?? null;
//     const uid = row?.user_id ?? null;

//     if (!cid || !txn) {
//       Swal.fire({
//         icon: "warning",
//         title: "Missing Information",
//         text: !cid
//           ? "Client ID not found for this row."
//           : "Transaction ID not found for this row.",
//       });
//       return;
//     }

//     setSelectedClient(cid);
//     setSelectedTxn(txn);
//     setUserID(uid);
//     setShowModal(true);
//   };

//   useEffect(() => {
//     if (showModal) {
//       const prev = document.body.style.overflow;
//       document.body.style.overflow = "hidden";
//       return () => (document.body.style.overflow = prev);
//     }
//   }, [showModal]);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 relative overflow-hidden">
//       {/* Animated background elements */}
//       <div className="absolute inset-0 overflow-hidden">
//         <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
//         <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
//         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
//       </div>

//       <div className="relative z-10 p-6 space-y-8">
//         {/* Header Section */}
//         <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 lg:gap-0">
//           <div>
//             <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
//               Assign Quotation List
//             </h2>
//           </div>
//           <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
//             <div className="relative group">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-hover:text-amber-400 transition-colors" />
//               <input
//                 type="text"
//                 value={keyword}
//                 placeholder="Search history..."
//                 className="w-full sm:w-auto pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 backdrop-blur-sm hover:bg-gray-700/50 transition-all text-sm"
//                 onChange={(e) => {
//                   setKeyword(e.target.value);
//                   setCurrentPage(0);
//                 }}
//               />
//             </div>
//           </div>
//         </div>

//         {/* Main Table */}
//         <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
//           <div className="p-8">
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead>
//                   <tr className="border-b border-gray-700/50">
//                     <th className="text-left py-4 px-6 font-semibold text-gray-200 uppercase tracking-wider text-sm">
//                       SNo.
//                     </th>
//                     <th className="text-left py-4 px-6 font-semibold text-gray-200 uppercase tracking-wider text-sm">
//                       Date
//                     </th>
//                     <th className="text-left py-4 px-6 font-semibold text-gray-200 uppercase tracking-wider text-sm">
//                       Client
//                     </th>
//                     <th className="text-left py-4 px-6 font-semibold text-gray-200 uppercase tracking-wider text-sm">
//                       TXN ID
//                     </th>
//                     <th className="text-left py-4 px-6 font-semibold text-gray-200 uppercase tracking-wider text-sm">
//                       User Name
//                     </th>
//                     <th className="text-left py-4 px-6 font-semibold text-gray-200 uppercase tracking-wider text-sm">
//                       Action
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {showApiData.length > 0 ? (
//                     showApiData.map((item, index) => (
//                       <tr
//                         key={item.id}
//                         className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-all duration-300 group"
//                         style={{ animationDelay: `${index * 100}ms` }}
//                       >
//                         <td className="py-5 px-6">
//                           <div className="font-semibold text-white text-lg group-hover:text-amber-300 transition-colors">
//                             {index + 1}
//                           </div>
//                         </td>
//                         <td className="py-5 px-6">
//                           <div className="flex items-center gap-3 text-gray-300 group-hover:text-white transition-colors">
//                             <Calendar className="w-4 h-4 text-orange-400" />
//                             <span className="font-medium">
//                               {moment(item.txn_date).format("DD MMMM YYYY")}
//                             </span>
//                           </div>
//                         </td>
//                         <td className="py-5 px-6">
//                           <div className="font-semibold text-white text-lg group-hover:text-amber-300 transition-colors">
//                             {item.client_name}
//                           </div>
//                         </td>
//                         <td className="py-5 px-6">
//                           <div className="font-bold text-xl bg-gradient-to-r from-green-400 to-yellow-400 bg-clip-text text-transparent">
//                             {item.txn_id ? item.txn_id : "N/A"}
//                           </div>
//                         </td>
//                         <td className="py-5 px-6">
//                           <div className="font-semibold text-white text-lg group-hover:text-amber-300 transition-colors">
//                             {item.employee_name}
//                           </div>
//                         </td>
//                         <td className="py-5 px-6">
//                           <button
//                             onClick={() => handleOpenProgress(item)}
//                             className="inline-block px-4 py-2 rounded-full text-sm font-semibold transform hover:scale-105 transition-all duration-200 bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25"
//                           >
//                             View / Update Progress
//                           </button>
//                         </td>
//                       </tr>
//                     ))
//                   ) : (
//                     <tr>
//                       <td
//                         colSpan="5"
//                         className="py-10 text-center text-gray-400"
//                       >
//                         No service history found for this client.
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </div>

//         {/* {showModal && (
//           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
//             <div className="relative bg-white w-[95%] max-w-6xl rounded-2xl shadow-xl p-4">
//               <button
//                 onClick={() => setShowModal(false)}
//                 className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 text-2xl"
//               >
//                 ×
//               </button>

//               <div className="mb-3">
//                 <h3 className="text-xl font-semibold">
//                   Progress — TXN:{" "}
//                   <span className="text-yellow-600">{selectedTxn}</span>
//                 </h3>
//                 <p className="text-sm text-gray-500">
//                   Client ID: {selectedClient}
//                 </p>
//               </div>

//               <ServiceProgressTable
//                 baseURL={baseURL}
//                 token={token}
//                 clientId={selectedClient}
//                 txnId={selectedTxn}
//                 currentEmployeeId={userID}
//               />
//             </div>
//           </div>
//         )} */}

//         {showModal && (
//           <div
//             className="fixed inset-0 z-50 grid place-items-center bg-black/50
//                motion-safe:transition-opacity motion-safe:duration-200"
//           >
//             <div
//               className="relative bg-white w-[95%] max-w-6xl rounded-2xl shadow-xl
//                  p-4 max-h-[85vh] overflow-y-auto transform-gpu
//                  motion-safe:transition-all motion-safe:duration-200
//                  will-change-transform"
//             >
//               <button
//                 onClick={() => setShowModal(false)}
//                 className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 text-2xl"
//               >
//                 ×
//               </button>

//               <div className="mb-3">
//                 <h3 className="text-xl font-semibold">
//                   Progress — TXN:{" "}
//                   <span className="text-yellow-600">{selectedTxn}</span>
//                 </h3>
//                 <p className="text-sm text-gray-500">
//                   Client ID: {selectedClient}
//                 </p>
//               </div>

//               <ServiceProgressTable
//                 baseURL={baseURL}
//                 token={token}
//                 clientId={selectedClient}
//                 txnId={selectedTxn}
//                 currentEmployeeId={userID}
//               />
//             </div>
//           </div>
//         )}

//         <PaginationContainer>
//           <ReactPaginate
//             previousLabel={"Previous"}
//             nextLabel={"Next"}
//             breakLabel={"..."}
//             pageCount={totalPages}
//             marginPagesDisplayed={2}
//             pageRangeDisplayed={5}
//             onPageChange={handlePageChange}
//             containerClassName={"pagination"}
//             activeClassName={"active"}
//             forcePage={currentPage}
//           />
//         </PaginationContainer>
//       </div>
//     </div>
//   );
// };

// export default AssignQuotation;
// const PaginationContainer = styled.div`
//   .pagination {
//     display: flex;
//     justify-content: center;
//     padding: 10px;
//     list-style: none;
//     border-radius: 5px;
//     margin-bottom: 1.5rem;
//   }

//   .pagination li {
//     margin: 0 5px;
//   }

//   .pagination li a {
//     display: block;
//     padding: 8px 16px;
//     border: 1px solid #e6ecf1;
//     color: #a73418;
//     cursor: pointer;
//     text-decoration: none;
//     border-radius: 5px;
//     box-shadow: 0px 0px 1px #000;
//     font-size: 14px; /* Default font size */
//   }

//   .pagination li.active a {
//     background-color: #fef9c3;
//     color: #d7a548;
//     border: 1px solid #fef9c3;
//   }

//   .pagination li.disabled a {
//     color: #166556;
//     cursor: not-allowed;
//     background-color: #dcfce7;
//     border: 1px solid #dcfce7;
//   }

//   .pagination li a:hover:not(.active) {
//     background-color: #dcfce7;
//     color: #166556;
//   }

//   /* Responsive adjustments for smaller screens */
//   @media (max-width: 768px) {
//     .pagination {
//       padding: 5px;
//       flex-wrap: wrap;
//     }

//     .pagination li {
//       margin: 2px;
//     }

//     .pagination li a {
//       padding: 6px 10px;
//       font-size: 12px;
//     }
//   }

//   @media (max-width: 480px) {
//     .pagination {
//       padding: 5px;
//     }

//     .pagination li {
//       margin: 2px;
//     }

//     .pagination li a {
//       padding: 4px 8px;
//       font-size: 10px;
//     }

//     /* Hide the previous and next labels for extra-small screens */
//     .pagination li:first-child a::before {
//       content: "«";
//       margin-right: 5px;
//     }

//     .pagination li:last-child a::after {
//       content: "»";
//       margin-left: 5px;
//     }
//   }
// `;

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, Search, Users, User, FileText, Eye, CheckSquare, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../redux/user/userSlice";
import Swal from "sweetalert2";
import ServiceProgressTable from "./ServiceProgressTable";
import SkeletonTable from "./SkeletonTable";
import API_BASE_URL from "../config/apiBaseUrl";

const ComingSoonPlaceholder = ({ title, description, icon: Icon, color }) => (
  <div className="flex flex-col items-center justify-center py-28 px-6 text-center select-none bg-gray-800/20 backdrop-blur-xl rounded-2xl border border-gray-700/50 mt-4">
    <div
      className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg`}
      style={{ background: color + "22", border: `1.5px solid ${color}44` }}
    >
      <Icon className="w-9 h-9" style={{ color }} />
    </div>
    <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
    <p className="text-gray-400 text-sm max-w-xs leading-relaxed">{description}</p>
    <span
      className="mt-6 inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold border"
      style={{ color, borderColor: color + "55", background: color + "18" }}
    >
      <Clock className="w-3.5 h-3.5" />
      Coming Soon
    </span>
  </div>
);

const PAGE_SIZE = 4;

const AssignQuotation = () => {
  const baseURL = API_BASE_URL;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token } = useSelector((s) => s.user);
  const modalTimerRef = useRef(null);

  const [mainTab, setMainTab] = useState("assign");
  const [rows, setRows] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [activeTab, setActiveTab] = useState("single"); // mobile tab state

  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [selectedDline, setSelectedDline] = useState(null);
  const [userID, setUserID] = useState(null);

  const [singlePage, setSinglePage] = useState(0);
  const [teamPage, setTeamPage] = useState(0);

  const [modalLoading, setModalLoading] = useState(false);
  const [showModalquotation, setShowModalQuotation] = useState(false);

  const fetchAllClientServices = async () => {
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/re_calculator/getAssignedQuotations`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.data?.status === "Success") {
        setRows(res.data.data || []);
      }
    } catch (error) {
      console.error(error);
      if (error?.response?.status === 401) {
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

  const normalizeDate = (d) => (d ? String(d).slice(0, 10) : "");
  const pickTeamCommonDeadline = (assignees = []) => {
    const uniq = Array.from(
      new Set(assignees.map((a) => normalizeDate(a.deadline)).filter(Boolean))
    );
    return uniq.length === 1 ? uniq[0] : "";
  };

  async function getDisplayDeadline({ baseURL, token, txnId }) {
    const res = await axios.get(
      `${baseURL}/auth/api/re_calculator/getAssignmentsSummary/${txnId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (res?.data?.status !== "Success") return "";
    const s = res.data.data || {};
    if (s.mode === "single" && s.assignees?.[0]) return normalizeDate(s.assignees[0].deadline);
    if (s.mode === "team") return pickTeamCommonDeadline(s.assignees || []);
    return "";
  }

  useEffect(() => { fetchAllClientServices(); }, []);

  const norm = (s) => String(s || "").toLowerCase();
  const groupKey = (r) => r.assign_group_id || `${r.team_id || "NA"}|${r.txn_id}`;

  const filtered = useMemo(() => {
    if (!keyword.trim()) return rows;
    const q = norm(keyword);
    return rows.filter((r) =>
      norm(r.txn_id).includes(q) ||
      norm(r.client_name).includes(q) ||
      norm(r.employee_name).includes(q) ||
      norm(r.team_name).includes(q)
    );
  }, [rows, keyword]);

  const singles = useMemo(() => filtered.filter((r) => r.assignment_mode === "single"), [filtered]);

  const teamGroups = useMemo(() => {
    const map = new Map();
    filtered.filter((r) => r.assignment_mode === "team").forEach((r) => {
      const key = groupKey(r);
      if (!map.has(key)) {
        map.set(key, {
          key, txn_id: r.txn_id, client_id: r.client_id, client_name: r.client_name,
          txn_date: r.txn_date, team_id: r.team_id, team_name: r.team_name, members: [],
        });
      }
      map.get(key).members.push({ user_id: r.user_id, employee_name: r.employee_name });
    });
    return Array.from(map.values()).map((g) => ({
      ...g,
      team_label: g.team_name || (g.team_id ? `Team #${g.team_id}` : "Team"),
      members_count: g.members.length,
      member_names: g.members.map((m) => m.employee_name).join(", "),
    }));
  }, [filtered]);

  const singleTotalPages = Math.ceil(singles.length / PAGE_SIZE) || 1;
  const teamTotalPages = Math.ceil(teamGroups.length / PAGE_SIZE) || 1;

  const singlePageRows = useMemo(() => {
    const start = singlePage * PAGE_SIZE;
    return singles.slice(start, start + PAGE_SIZE);
  }, [singles, singlePage]);

  const teamPageRows = useMemo(() => {
    const start = teamPage * PAGE_SIZE;
    return teamGroups.slice(start, start + PAGE_SIZE);
  }, [teamGroups, teamPage]);

  useEffect(() => { setSinglePage(0); setTeamPage(0); }, [keyword]);

  const handleOpenProgressSingle = async (row) => {
    const cid = row?.client_id, txn = row?.txn_id, uid = row?.user_id || null;
    if (!cid || !txn) return Swal.fire({ icon: "warning", title: "Missing Information", text: "Client or TXN missing." });
    setSelectedClient(cid); setSelectedTxn(txn); setUserID(uid); setModalLoading(true); setShowModal(true);
    try {
      const d = await getDisplayDeadline({ baseURL, token, txnId: txn });
      setSelectedDline(d || "");
    } catch { setSelectedDline(""); }
    finally {
      if (modalTimerRef.current) clearTimeout(modalTimerRef.current);
      modalTimerRef.current = setTimeout(() => { setModalLoading(false); modalTimerRef.current = null; }, 1200);
    }
  };

  const handleOpenProgressTeam = async (group) => {
    const cid = group?.client_id, txn = group?.txn_id;
    if (!cid || !txn) return Swal.fire({ icon: "warning", title: "Missing Information", text: "Client or TXN missing." });
    setSelectedClient(cid); setSelectedTxn(txn); setUserID(null); setShowModal(true); setModalLoading(true);
    try {
      const d = await getDisplayDeadline({ baseURL, token, txnId: txn });
      setSelectedDline(d || "");
    } catch { setSelectedDline(""); }
    finally {
      if (modalTimerRef.current) clearTimeout(modalTimerRef.current);
      modalTimerRef.current = setTimeout(() => { setModalLoading(false); modalTimerRef.current = null; }, 1200);
    }
  };

  useEffect(() => {
    if (showModal) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => (document.body.style.overflow = prev);
    }
  }, [showModal]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 relative overflow-hidden">
      {/* bg blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="relative z-10 p-3 sm:p-6 space-y-4 sm:space-y-8 pb-8">

        {/* ── Header ── */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              {mainTab === "assign" ? "Assign Quotation List" : "Tasks History"}
            </h2>
            <div className="flex bg-gray-800/50 rounded-xl p-1 border border-gray-700/50">
              <button
                onClick={() => setMainTab("assign")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  mainTab === "assign"
                    ? "bg-gradient-to-r from-yellow-500 to-yellow-500 text-white shadow-lg"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Active Assignments
              </button>
              <button
                onClick={() => setMainTab("history")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  mainTab === "history"
                    ? "bg-gradient-to-r from-red-500 to-amber-500 text-white shadow-lg"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Tasks History
              </button>
            </div>
          </div>

          {/* Search */}
          {mainTab === "assign" && (
            <div className="relative group w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-amber-400 transition-colors" />
            <input
              type="text"
              value={keyword}
              placeholder="Search by txn / client / team"
              className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 backdrop-blur-sm text-sm"
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          )}

          {/* Mobile Tab Switcher */}
          {mainTab === "assign" && (
            <div className="flex sm:hidden bg-gray-800/50 rounded-xl p-1 border border-gray-700/50">
            <button
              onClick={() => setActiveTab("single")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "single"
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <User className="w-4 h-4" />
              Single
              {singles.length > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === "single" ? "bg-white/20" : "bg-gray-700"}`}>
                  {singles.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("team")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "team"
                  ? "bg-gradient-to-r from-orange-500 to-orange-500 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Users className="w-4 h-4" />
              Team
              {teamGroups.length > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === "team" ? "bg-white/20" : "bg-gray-700"}`}>
                  {teamGroups.length}
                </span>
              )}
            </button>
          </div>
          )}
        </div>

        {mainTab === "assign" ? (
          <>
        {/* ═══════════════════ SINGLE ASSIGNMENTS ═══════════════════ */}
        <section className={`space-y-3 ${activeTab !== "single" ? "hidden sm:block" : ""}`}>
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-orange-400" />
              <h3 className="text-lg font-semibold text-white/90">Single Assignments</h3>
            </div>
            <div className="text-xs text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700/50">
              {singles.length ? `${singles.length} rows` : "Empty"}
            </div>
          </div>

          {/* ── Desktop Table ── */}
          <div className="hidden sm:block bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-6">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-gray-700/50">
                      {["SNo.", "Date", "Client", "TXN ID", "User Name", "Action", "Quotation"].map((h) => (
                        <th key={h} className="text-left py-3 px-4 text-gray-400 uppercase tracking-wider text-xs font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {singlePageRows.length ? singlePageRows.map((item, idx) => (
                      <tr key={`${item.id}-${idx}`} className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors">
                        <td className="py-4 px-4 text-white/60 text-sm">{singlePage * PAGE_SIZE + idx + 1}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2 text-gray-300 text-sm">
                            <Calendar className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                            {item.txn_date ? moment(item.txn_date).format("DD MMM YYYY") : "-"}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-white text-sm font-medium">{item.client_name}</td>
                        <td className="py-4 px-4 font-semibold text-yellow-300 text-sm">{item.txn_id || "N/A"}</td>
                        <td className="py-4 px-4 text-white text-sm">{item.employee_name}</td>
                        <td className="py-4 px-4">
                          <button onClick={() => handleOpenProgressSingle(item)}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-90 transition-opacity whitespace-nowrap">
                            View Progress
                          </button>
                        </td>
                        <td className="py-4 px-4">
                          <button onClick={() => { setSelectedClient(item.client_id); setSelectedTxn(item.txn_id); setShowModalQuotation(true); }}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-600 text-white hover:bg-orange-500 transition-colors">
                            Review
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={7} className="py-12 text-center text-gray-500 text-sm">No single assignments found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── Mobile Cards ── */}
          <div className="sm:hidden space-y-3">
            {singlePageRows.length ? singlePageRows.map((item, idx) => (
              <div key={`m-${item.id}-${idx}`}
                className="bg-gray-800/40 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-4 space-y-3">
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-base truncate">{item.client_name}</p>
                    <p className="text-yellow-300 text-sm font-mono font-bold mt-0.5">{item.txn_id || "N/A"}</p>
                  </div>
                  <span className="shrink-0 text-xs text-gray-500 bg-gray-700/50 px-2 py-1 rounded-lg">
                    #{singlePage * PAGE_SIZE + idx + 1}
                  </span>
                </div>

                {/* Meta Row */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-orange-400" />
                    {item.txn_date ? moment(item.txn_date).format("DD MMM YYYY") : "-"}
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    {item.employee_name}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button onClick={() => handleOpenProgressSingle(item)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-orange-500 to-red-500 text-white active:scale-95 transition-transform">
                    <Eye className="w-3.5 h-3.5" /> View Progress
                  </button>
                  <button onClick={() => { setSelectedClient(item.client_id); setSelectedTxn(item.txn_id); setShowModalQuotation(true); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold bg-orange-600 text-white active:scale-95 transition-transform hover:bg-orange-500">
                    <FileText className="w-3.5 h-3.5" /> Review
                  </button>
                </div>
              </div>
            )) : (
              <div className="py-12 text-center text-gray-500 text-sm bg-gray-800/20 rounded-2xl border border-gray-700/30">
                No single assignments found.
              </div>
            )}
          </div>

          {singleTotalPages > 1 && (
            <div className="p-3 flex items-center justify-center gap-3 mt-2">
              <button
                onClick={() => setSinglePage((p) => Math.max(0, p - 1))}
                disabled={singlePage === 0}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-700/50 text-gray-300 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ← Prev
              </button>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Page</span>
                <select
                  value={singlePage}
                  onChange={(e) => setSinglePage(Number(e.target.value))}
                  className="bg-gray-900/80 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer appearance-none min-w-[70px] text-center"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 fill=%27%239ca3af%27 viewBox=%270 0 16 16%27%3E%3Cpath d=%27M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z%27/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', paddingRight: '28px' }}
                >
                  {Array.from({ length: singleTotalPages }, (_, i) => (
                    <option key={i} value={i}>{i + 1}</option>
                  ))}
                </select>
                <span className="text-gray-500 text-sm">of {singleTotalPages}</span>
              </div>
              <button
                onClick={() => setSinglePage((p) => Math.min(singleTotalPages - 1, p + 1))}
                disabled={singlePage >= singleTotalPages - 1}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-700/50 text-gray-300 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </section>

        {/* ═══════════════════ TEAM ASSIGNMENTS ═══════════════════ */}
        <section className={`space-y-3 ${activeTab !== "team" ? "hidden sm:block" : ""}`}>
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-400" />
              <h3 className="text-lg font-semibold text-white/90">Team Assignments</h3>
            </div>
            <div className="text-xs text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700/50">
              {teamGroups.length ? `${teamGroups.length} rows` : "Empty"}
            </div>
          </div>

          {/* ── Desktop Table ── */}
          <div className="hidden sm:block bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-6">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-gray-700/50">
                      {["SNo.", "Date", "Client", "TXN ID", "Team", "Members", "Action", "Quotation"].map((h) => (
                        <th key={h} className="text-left py-3 px-4 text-gray-400 uppercase tracking-wider text-xs font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {teamPageRows.length ? teamPageRows.map((g, idx) => (
                      <tr key={g.key} className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors">
                        <td className="py-4 px-4 text-white/60 text-sm">{teamPage * PAGE_SIZE + idx + 1}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2 text-gray-300 text-sm">
                            <Calendar className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                            {g.txn_date ? moment(g.txn_date).format("DD MMM YYYY") : "-"}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-white text-sm font-medium">{g.client_name}</td>
                        <td className="py-4 px-4 font-semibold text-yellow-300 text-sm">{g.txn_id}</td>
                        <td className="py-4 px-4 text-white text-sm">{g.team_label}</td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1 text-gray-200 text-sm">
                            <Users className="w-3.5 h-3.5 text-orange-400" />{g.members_count}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <button onClick={() => handleOpenProgressTeam(g)} title={g.member_names}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-600 text-white hover:bg-orange-500 transition-colors whitespace-nowrap">
                            View Progress
                          </button>
                        </td>
                        <td className="py-4 px-4">
                          <button onClick={() => { setSelectedClient(g.client_id); setSelectedTxn(g.txn_id); setShowModalQuotation(true); }}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-90 transition-opacity whitespace-nowrap">
                            Review
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={8} className="py-12 text-center text-gray-500 text-sm">No team assignments found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── Mobile Cards ── */}
          <div className="sm:hidden space-y-3">
            {teamPageRows.length ? teamPageRows.map((g, idx) => (
              <div key={`mt-${g.key}`}
                className="bg-gray-800/40 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-4 space-y-3">
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-base truncate">{g.client_name}</p>
                    <p className="text-yellow-300 text-sm font-mono font-bold mt-0.5">{g.txn_id}</p>
                  </div>
                  <span className="shrink-0 text-xs text-gray-500 bg-gray-700/50 px-2 py-1 rounded-lg">
                    #{teamPage * PAGE_SIZE + idx + 1}
                  </span>
                </div>

                {/* Meta Row */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-orange-400" />
                    {g.txn_date ? moment(g.txn_date).format("DD MMM YYYY") : "-"}
                  </div>
                  <div className="flex items-center gap-1.5 text-orange-300 text-xs font-medium">
                    <Users className="w-3.5 h-3.5" />
                    {g.team_label}
                  </div>
                </div>

                {/* Members chip */}
                <div className="flex flex-wrap gap-1.5">
                  {g.members.slice(0, 3).map((m, i) => (
                    <span key={i} className="text-xs bg-gray-700/60 text-gray-300 px-2.5 py-1 rounded-full border border-gray-600/40">
                      {m.employee_name}
                    </span>
                  ))}
                  {g.members.length > 3 && (
                    <span className="text-xs bg-orange-600/30 text-orange-300 px-2.5 py-1 rounded-full border border-orange-500/30">
                      +{g.members.length - 3} more
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button onClick={() => handleOpenProgressTeam(g)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold bg-orange-600 text-white active:scale-95 transition-transform hover:bg-orange-500">
                    <Eye className="w-3.5 h-3.5" /> View Progress
                  </button>
                  <button onClick={() => { setSelectedClient(g.client_id); setSelectedTxn(g.txn_id); setShowModalQuotation(true); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-orange-500 to-red-500 text-white active:scale-95 transition-transform">
                    <FileText className="w-3.5 h-3.5" /> Review
                  </button>
                </div>
              </div>
            )) : (
              <div className="py-12 text-center text-gray-500 text-sm bg-gray-800/20 rounded-2xl border border-gray-700/30">
                No team assignments found.
              </div>
            )}
          </div>

          {teamTotalPages > 1 && (
            <div className="p-3 flex items-center justify-center gap-3 mt-2">
              <button
                onClick={() => setTeamPage((p) => Math.max(0, p - 1))}
                disabled={teamPage === 0}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-700/50 text-gray-300 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ← Prev
              </button>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Page</span>
                <select
                  value={teamPage}
                  onChange={(e) => setTeamPage(Number(e.target.value))}
                  className="bg-gray-900/80 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer appearance-none min-w-[70px] text-center"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 fill=%27%239ca3af%27 viewBox=%270 0 16 16%27%3E%3Cpath d=%27M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z%27/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', paddingRight: '28px' }}
                >
                  {Array.from({ length: teamTotalPages }, (_, i) => (
                    <option key={i} value={i}>{i + 1}</option>
                  ))}
                </select>
                <span className="text-gray-500 text-sm">of {teamTotalPages}</span>
              </div>
              <button
                onClick={() => setTeamPage((p) => Math.min(teamTotalPages - 1, p + 1))}
                disabled={teamPage >= teamTotalPages - 1}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-700/50 text-gray-300 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </section>
        </>
        ) : (
          <ComingSoonPlaceholder
            title="Tasks History"
            description="Track all assigned tasks, their progress, and completion logs. This feature is under development."
            icon={CheckSquare}
            color="#60a5fa"
          />
        )}

        {/* ═══════════════════ PROGRESS MODAL ═══════════════════ */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
            <div className="
              relative bg-white w-full sm:w-[95%] sm:max-w-6xl
              rounded-t-3xl sm:rounded-2xl shadow-2xl
              flex flex-col
              max-h-[92vh] sm:max-h-[80vh]
              min-h-[60vh]
            ">
              {/* Modal Handle (mobile) */}
              <div className="sm:hidden flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>

              {/* Modal Header */}
              <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                <div>
                  <h3 className="text-base sm:text-xl font-semibold text-gray-800">
                    Progress — <span className="text-yellow-600">{selectedTxn}</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Client ID: {selectedClient}</p>
                  <p className="text-xs text-red-500 mt-0.5">
                    Deadline: {selectedDline ? moment(selectedDline).format("DD/MM/YYYY") : "-"}
                  </p>
                </div>
                <button
                  onClick={() => { if (modalTimerRef.current) clearTimeout(modalTimerRef.current); setModalLoading(false); setShowModal(false); }}
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 text-lg transition-colors ml-3"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              {/* Modal Body */}
              <div className="relative flex-1 overflow-y-auto">
                {modalLoading && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm grid place-items-center z-10">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-gray-700 animate-spin" />
                      <div className="text-sm text-gray-600 font-medium">Loading progress…</div>
                    </div>
                  </div>
                )}
                {modalLoading ? <SkeletonTable /> : (
                  <ServiceProgressTable
                    baseURL={baseURL} token={token}
                    clientId={selectedClient} txnId={selectedTxn}
                    currentEmployeeId={userID}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════ QUOTATION TYPE MODAL ═══════════════════ */}
        {showModalquotation && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className="relative bg-white w-full sm:w-auto sm:min-w-80 rounded-t-3xl sm:rounded-2xl shadow-2xl p-6">
              {/* Handle */}
              <div className="sm:hidden flex justify-center mb-4">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>

              <button onClick={() => setShowModalQuotation(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 text-lg font-bold transition-colors"
                aria-label="Close">
                ×
              </button>

              <h2 className="text-base font-semibold mb-1 text-gray-800">Select Quotation Type</h2>
              <p className="text-xs text-gray-500 mb-5">Choose whether to include GST in the quotation.</p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => { navigate(`/admin/quotation/${selectedClient}/${selectedTxn}?gst=1`); setShowModalQuotation(false); }}
                  className="flex-1 flex items-center justify-center gap-2 bg-yellow-500 text-white px-5 py-3.5 rounded-xl hover:bg-yellow-600 active:scale-95 transition-all font-semibold text-sm">
                  With GST (18%)
                </button>
                <button
                  onClick={() => { navigate(`/admin/quotation/${selectedClient}/${selectedTxn}?gst=0`); setShowModalQuotation(false); }}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-600 text-white px-5 py-3.5 rounded-xl hover:bg-gray-700 active:scale-95 transition-all font-semibold text-sm">
                  Without GST
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AssignQuotation;
