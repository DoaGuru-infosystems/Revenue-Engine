// import React, { useEffect, useState } from "react";
// import { Calendar, Search, Eye, FileText, Hash } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import moment from "moment";
// import ReactPaginate from "react-paginate";
// import styled from "styled-components";
// import { useDispatch, useSelector } from "react-redux";
// import { clearUser } from "../redux/user/userSlice";
// import Swal from "sweetalert2";
// import API_BASE_URL from "../config/apiBaseUrl";

// const AllHistory = () => {
//   const baseURL = API_BASE_URL;
//   const navigate = useNavigate();
//   const [fetchServices, setFetchServices] = useState([]);
//   const { currentUser, token } = useSelector((state) => state.user);
//   const dispatch = useDispatch();
//   const [keyword, setKeyword] = useState("");
//   const [currentPage, setCurrentPage] = useState(0);
//   const clientPerPage = 10;
//   const [showModal, setShowModal] = useState(false);
//   const [selectedClient, setSelectedClient] = useState(null);
//   const [selectedTxn, setSelectedTxn] = useState(null);

//   const fetchAllClientServices = async () => {
//     try {
//       const res = await axios.get(
//         `${baseURL}/auth/api/re_calculator/getAllClientsTxnHistory?status=approved`,
//         {
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       if (res.data.status === "Success") {
//         const uniqueTxnData = [];
//         const seenTxnIds = new Set();

//         for (const item of res.data.data) {
//           if (item.txn_id && !seenTxnIds.has(item.txn_id)) {
//             seenTxnIds.add(item.txn_id);
//             uniqueTxnData.push(item);
//           }
//         }

//         setFetchServices(uniqueTxnData);
//       }
//     } catch (error) {
//       console.log(error);
//       if (error.response && error.response.status === 401) {
//         Swal.fire({
//           title: "Session Expired",
//           text: "Please login again.",
//           icon: "warning",
//           showConfirmButton: false,
//           timer: 1000,
//         }).then(() => {
//           dispatch(clearUser());
//           localStorage.removeItem("token");
//           navigate("/");
//         });
//       }
//     }
//   };

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

//   const getStatusLabel = (status) => {
//     const map = {
//       client_approved: "Client Approved",
//       proforma_invoice_generated: "Proforma Generated",
//       proforma_invoice_sent: "Proforma Sent",
//       payment_received_invoice_ready: "Payment Received - Invoice Ready",
//       invoice_sent: "Invoice Sent",
//     };
//     return map[status] || (status || "pending").replaceAll("_", " ").toUpperCase();
//   };

//   const handlePreview = (item) => {
//     setSelectedClient(item.client_id);
//     setSelectedTxn(item.txn_id);
//     setShowModal(true);
//   };

//   return (
//     <div className="w-full bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 relative overflow-hidden">
//       {/* Animated background */}
//       <div className="absolute inset-0 overflow-hidden pointer-events-none">
//         <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
//         <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
//         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
//       </div>

//       <div className="relative z-10 p-4 sm:p-6 space-y-4 sm:space-y-6">

//         {/* Header Section */}
//         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
//           <div>
//             <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
//               Approved Quotation History
//             </h2>
//             <p className="text-gray-400 text-sm mt-1">{filteredItems.length} records found</p>
//           </div>

//           {/* Search */}
//           <div className="relative w-full sm:w-72">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
//             <input
//               type="text"
//               value={keyword}
//               placeholder="Search by name or TXN ID..."
//               className="w-full pl-10 pr-4 py-2.5 bg-gray-800/60 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm outline-none transition-all"
//               onChange={(e) => {
//                 setKeyword(e.target.value);
//                 setCurrentPage(0);
//               }}
//             />
//           </div>
//         </div>

//         {/* ── MOBILE: Card List ─────────────────────────────────────────── */}
//         <div className="block md:hidden space-y-3 overflow-y-auto max-h-[calc(100vh-20rem)] pr-1">
//           {showApiData.length > 0 ? (
//             showApiData.map((item, index) => (
//               <div
//                 key={item.id || item.txn_id}
//                 className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 space-y-3 hover:border-gray-600/60 transition-all duration-200"
//               >
//                 {/* Top row: index + date */}
//                 <div className="flex items-center justify-between">
//                   <span className="w-7 h-7 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-bold flex items-center justify-center">
//                     {currentPage * clientPerPage + index + 1}
//                   </span>
//                   <div className="flex items-center gap-1.5 text-gray-400 text-xs">
//                     <Calendar className="w-3.5 h-3.5 text-orange-400" />
//                     <span>{moment(item.txn_date).format("DD MMM YYYY")}</span>
//                   </div>
//                 </div>

//                 {/* Client Name */}
//                 <div className="flex items-center gap-2">
//                   <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
//                     <FileText className="w-4 h-4 text-amber-400" />
//                   </div>
//                   <div>
//                     <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">Client</p>
//                     <p className="text-white font-semibold text-sm leading-tight">{item.client_name}</p>
//                   </div>
//                 </div>

//                 {/* TXN ID */}
//                 <div className="flex items-center gap-2">
//                   <div className="w-8 h-8 rounded-xl bg-yellow-500/15 flex items-center justify-center shrink-0">
//                     <Hash className="w-4 h-4 text-yellow-400" />
//                   </div>
//                   <div className="min-w-0">
//                     <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">TXN ID</p>
//                     <p className="text-yellow-400 font-bold text-xs font-mono truncate">{item.txn_id || "N/A"}</p>
//                   </div>
//                 </div>

//                 <div className="flex items-center justify-between">
//                   <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">Status</p>
//                   <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
//                     {getStatusLabel(item.quotation_status)}
//                   </span>
//                 </div>

//                 {/* Preview Button */}
//                 <button
//                   onClick={() => handlePreview(item)}
//                   className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:scale-[1.02] transition-all duration-200"
//                 >
//                   <Eye className="w-4 h-4" />
//                   Preview Quotation
//                 </button>
//               </div>
//             ))
//           ) : (
//             <div className="text-center py-16 text-gray-500">
//               <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
//               <p>No history found.</p>
//             </div>
//           )}
//         </div>

//         {/* ── DESKTOP: Table ────────────────────────────────────────────── */}
//         <div className="hidden md:block bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
//           <div className="overflow-x-auto">
//             <div
//               className="overflow-auto h-[calc(100vh-20rem)] max-h-[35rem]"
//               style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
//             >
//               <table className="w-full">
//               <thead>
//                 <tr className="border-b border-gray-700/50 bg-gray-900/30">
//                   <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">#</th>
//                   <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">Date</th>
//                   <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">Client Name</th>
//                   <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">TXN ID</th>
//                   <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">Status</th>
//                   <th className="text-left py-4 px-6 font-semibold text-gray-300 uppercase tracking-wider text-xs">Quotation Preview</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {showApiData.length > 0 ? (
//                   showApiData.map((item, index) => (
//                     <tr
//                       key={item.id || item.txn_id}
//                       className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-all duration-300 group"
//                     >
//                       <td className="py-4 px-6">
//                         <span className="font-semibold text-white group-hover:text-amber-300 transition-colors">
//                           {currentPage * clientPerPage + index + 1}
//                         </span>
//                       </td>
//                       <td className="py-4 px-6">
//                         <div className="flex items-center gap-2 text-gray-300 group-hover:text-white transition-colors">
//                           <Calendar className="w-4 h-4 text-orange-400 shrink-0" />
//                           <span className="font-medium text-sm">{moment(item.txn_date).format("DD MMMM YYYY")}</span>
//                         </div>
//                       </td>
//                       <td className="py-4 px-6">
//                         <span className="font-semibold text-white group-hover:text-amber-300 transition-colors">
//                           {item.client_name}
//                         </span>
//                       </td>
//                       <td className="py-4 px-6">
//                         <span className="font-bold text-lg bg-gradient-to-r from-green-400 to-yellow-400 bg-clip-text text-transparent font-mono">
//                           {item.txn_id || "N/A"}
//                         </span>
//                       </td>
//                       <td className="py-4 px-6">
//                         <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
//                           {getStatusLabel(item.quotation_status)}
//                         </span>
//                       </td>
//                       <td className="py-4 px-6">
//                         <button
//                           onClick={() => handlePreview(item)}
//                           className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25 hover:scale-105 transition-all duration-200"
//                         >
//                           <Eye className="w-3.5 h-3.5" />
//                           Preview
//                         </button>
//                       </td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td colSpan="6" className="py-16 text-center text-gray-400">
//                       <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
//                       No service history found.
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//               </table>
//             </div>
//           </div>
//         </div>

//         {/* Quotation Type Modal */}
//         {showModal && (
//           <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//             <div className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-sm p-6">
//               <button
//                 onClick={() => setShowModal(false)}
//                 className="absolute top-3 right-3 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center transition-colors text-lg font-bold"
//                 aria-label="Close"
//               >
//                 ×
//               </button>
//               <h2 className="text-lg font-bold text-white text-center mb-2">
//                 Select Quotation Type
//               </h2>
//               <p className="text-gray-400 text-sm text-center mb-6">Choose how you want to generate the quotation.</p>
//               <div className="flex flex-col gap-3">
//                 <button
//                   onClick={() => {
//                     navigate(`/admin/quotation/${selectedClient}/${selectedTxn}?gst=1`);
//                     setShowModal(false);
//                   }}
//                   className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-green-500 to-yellow-600 hover:scale-[1.02] transition-all duration-200 shadow-lg shadow-green-500/20"
//                 >
//                   With GST (18%)
//                 </button>
//                 <button
//                   onClick={() => {
//                     navigate(`/admin/quotation/${selectedClient}/${selectedTxn}?gst=0`);
//                     setShowModal(false);
//                   }}
//                   className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-gray-600 to-slate-700 hover:scale-[1.02] transition-all duration-200 shadow-lg"
//                 >
//                   Without GST
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Pagination */}
//         {totalPages > 1 && (
//           <PaginationContainer>
//             <ReactPaginate
//               previousLabel={"Previous"}
//               nextLabel={"Next"}
//               breakLabel={"..."}
//               pageCount={totalPages}
//               marginPagesDisplayed={2}
//               pageRangeDisplayed={5}
//               onPageChange={handlePageChange}
//               containerClassName={"pagination"}
//               activeClassName={"active"}
//               forcePage={currentPage}
//             />
//           </PaginationContainer>
//         )}
//       </div>
//     </div>
//   );
// };

// export default AllHistory;





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
//     font-size: 14px;
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
//   }
// `;
