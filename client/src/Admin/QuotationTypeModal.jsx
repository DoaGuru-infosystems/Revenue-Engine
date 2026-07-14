// // src/components/QuotationAssignModal.jsx
// import React, { useEffect, useState, useMemo } from "react";
// import axios from "axios";
// import Swal from "sweetalert2";
// import TeamPickerModal from "./TeamPickerModal";

// export default function QuotationTypeModal({
//   open,
//   onClose,
//   clientId,
//   txnId,
//   baseURL,
//   token,
//   onDone,
// }) {
//   const [users, setUsers] = useState([]);
//   const [loadingUsers, setLoadingUsers] = useState(false);
//   const [selectedUser, setSelectedUser] = useState("");
//   const [deadline, setDeadline] = useState(""); // NEW
//   const [submitting, setSubmitting] = useState(false);
//   const [existing, setExisting] = useState(null);
//   const [checking, setChecking] = useState(false);
//   const [teamModalOpen, setTeamModalOpen] = useState(false);
//   const [assigningTeam, setAssigningTeam] = useState(false);

//   useEffect(() => {
//     if (!open) return;
//     if (!clientId || !txnId) {
//       Swal.fire({
//         icon: "warning",
//         title: "Missing Information",
//         text: !clientId ? "Client ID not found." : "Transaction ID not found.",
//       }).then(() => onClose?.());
//     }
//   }, [open, clientId, txnId, onClose]);

//   const headers = useMemo(
//     () => ({
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${token}`,
//     }),
//     [token]
//   );

//   // Load BD users
//   useEffect(() => {
//     if (!open) return;
//     const fetchUsers = async () => {
//       try {
//         setLoadingUsers(true);
//         const res = await axios.get(
//           `${baseURL}/auth/api/re_calculator/retrieveUser`,
//           { headers }
//         );
//         if (res.data?.status === "Success") {
//           setUsers(res.data.data || []);
//         } else {
//           setUsers([]);
//         }
//       } catch (err) {
//         console.error("retrieveUser error:", err);
//         if (err?.response?.status === 404) {
//           Swal.fire({
//             icon: "info",
//             title: "No Users",
//             text: "No BD users found to assign.",
//           });
//         } else if (err?.response?.status === 401) {
//           Swal.fire({
//             icon: "warning",
//             title: "Session Expired",
//             text: "Please login again.",
//           });
//         } else {
//           Swal.fire({
//             icon: "error",
//             title: "Error",
//             text: "Failed to load users.",
//           });
//         }
//       } finally {
//         setLoadingUsers(false);
//       }
//     };
//     fetchUsers();
//   }, [open, baseURL, headers]);

//   // Check if already assigned
//   useEffect(() => {
//     if (!open) return;
//     const checkExisting = async () => {
//       try {
//         setChecking(true);
//         const res = await axios.get(
//           `${baseURL}/auth/api/re_calculator/getAssignmentByTxn/${txnId}`,
//           { headers }
//         );
//         if (res.data?.status === "Success") {
//           const row = res.data.data;
//           setExisting(row);
//           setSelectedUser(String(row.user_id || ""));
//           setDeadline(row.deadline ? String(row.deadline).slice(0, 10) : "");
//         } else {
//           setExisting(null);
//           setSelectedUser("");
//           setDeadline("");
//         }
//       } catch (err) {
//         if (err?.response?.status === 404) {
//           setExisting(null);
//           setSelectedUser("");
//           setDeadline("");
//         } else if (err?.response?.status === 401) {
//           Swal.fire({
//             icon: "warning",
//             title: "Session Expired",
//             text: "Please login again.",
//           });
//         } else {
//           console.error("getAssignmentByTxn error:", err);
//           Swal.fire({
//             icon: "error",
//             title: "Error",
//             text: "Failed to check assignment.",
//           });
//         }
//       } finally {
//         setChecking(false);
//       }
//     };
//     checkExisting();
//   }, [open, baseURL, headers, txnId]);

//   console.log(existing);

//   const currentAssigneeName = useMemo(() => {
//     if (!existing?.user_id) return null;
//     const m = users.find((u) => Number(u.id) === Number(existing.user_id));
//     return m?.employee_name || existing.employee_name || `#${existing.user_id}`;
//   }, [existing, users]);

//   const isReassign = !!existing?.user_id;
//   const submitBtnText = isReassign ? "Update" : "Assign";
//   const today = new Date().toISOString().slice(0, 10);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!clientId || !txnId) return;

//     if (!selectedUser) {
//       Swal.fire({
//         icon: "warning",
//         title: "Required",
//         text: "Please select a user.",
//       });
//       return;
//     }

//     if (!isReassign && !deadline) {
//       Swal.fire({
//         icon: "warning",
//         title: "Deadline Required",
//         text: "Please select a deadline.",
//       });
//       return;
//     }

//     if (deadline && deadline < today) {
//       Swal.fire({
//         icon: "warning",
//         title: "Invalid Deadline",
//         text: "Deadline cannot be in the past.",
//       });
//       return;
//     }

//     const noUserChange =
//       isReassign && Number(selectedUser) === Number(existing.user_id);
//     const noDeadlineChange =
//       isReassign &&
//       (existing?.deadline ? String(existing.deadline).slice(0, 10) : "") ===
//         (deadline || "");
//     if (noUserChange && noDeadlineChange) {
//       Swal.fire({
//         icon: "info",
//         title: "No Change",
//         text: "Nothing to update.",
//       });
//       return;
//     }

//     if (isReassign && Number(selectedUser) !== Number(existing.user_id)) {
//       const ok = await Swal.fire({
//         icon: "question",
//         title: "Re-assign?",
//         text: `Currently assigned to ${currentAssigneeName}. Do you want to assign it to another member?`,
//         showCancelButton: true,
//         confirmButtonText: "Yes, update",
//       });
//       if (!ok.isConfirmed) return;
//     }

//     try {
//       setSubmitting(true);
//       if (!isReassign) {
//         await axios.post(
//           `${baseURL}/auth/api/re_calculator/assignQuotation`,
//           {
//             client_id: clientId,
//             txn_id: txnId,
//             user_id: Number(selectedUser),
//             deadline,
//           },
//           { headers }
//         );
//       } else {
//         await axios.put(
//           `${baseURL}/auth/api/re_calculator/reassignQuotation`,
//           { txn_id: txnId, user_id: Number(selectedUser), deadline },
//           { headers }
//         );
//       }

//       Swal.fire({
//         icon: "success",
//         title: isReassign ? "Updated" : "Assigned",
//         text: isReassign
//           ? "Quotation updated successfully."
//           : "Quotation assigned successfully.",
//         timer: 1500,
//         showConfirmButton: false,
//       });

//       onClose?.();
//       onDone?.();
//     } catch (err) {
//       console.error("assign/reassign error:", err);
//       Swal.fire({ icon: "error", title: "Error", text: "Operation failed." });
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   if (!open) return null;

//   // ------------------ TEAM ASSIGN ------------------
//   const assignToTeamBulkAPI = async (teamId) => {
//     await axios.post(
//       `${baseURL}/auth/api/re_calculator/assignQuotationToTeam`,
//       { client_id: clientId, txn_id: txnId, team_id: Number(teamId), deadline },
//       { headers }
//     );
//   };

//   const handleAssignToTeam = async (team) => {
//     if (!deadline) {
//       Swal.fire(
//         "Deadline Required",
//         "Please select a deadline first.",
//         "warning"
//       );
//       return;
//     }
//     if (deadline < today) {
//       Swal.fire(
//         "Invalid Deadline",
//         "Deadline cannot be in the past.",
//         "warning"
//       );
//       return;
//     }

//     const ok = await Swal.fire({
//       icon: "question",
//       title: "Assign to Team?",
//       html: `Assign TXN <b>${txnId}</b> to team <b>${team.name}</b> (ID: ${team.id})?<br/><small>All members will be notified.</small>`,
//       showCancelButton: true,
//       confirmButtonText: "Yes, assign",
//     });
//     if (!ok.isConfirmed) return;

//     try {
//       setAssigningTeam(true);
//       await assignToTeamBulkAPI(team.id);
//       Swal.fire("Success", "Quotation assigned to the team.", "success");
//       onClose?.();
//       onDone?.();
//     } catch (e) {
//       Swal.fire(
//         "Error",
//         e?.response?.data?.message || e.message || "Failed to assign to team",
//         "error"
//       );
//     } finally {
//       setAssigningTeam(false);
//       setTeamModalOpen(false);
//     }
//   };

//   if (!open) return null;

//   return (
//     <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
//       <div className="relative bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md">
//         <button
//           onClick={onClose}
//           className="absolute top-2 right-3 text-red-600 hover:text-gray-500 text-xl font-bold"
//           aria-label="Close"
//         >
//           ×
//         </button>

//         <h2 className="text-lg font-semibold mb-1 text-center">
//           {isReassign ? "Update Assignment" : "Assign Quotation"}
//         </h2>
//         <p className="text-xs text-center text-gray-500 mb-2">
//           Client ID: <span className="font-semibold">{clientId}</span> • TXN:{" "}
//           <span className="font-semibold">{txnId}</span>
//         </p>

//         <div className="flex items-center justify-center gap-2 mb-3">
//           <button
//             type="button"
//             className="px-3 py-1 rounded bg-orange-600 text-white hover:bg-orange-500"
//             onClick={() => setTeamModalOpen(true)}
//             disabled={assigningTeam || checking}
//           >
//             Team
//           </button>
//         </div>

//         {checking ? (
//           <p className="text-center text-sm text-gray-500 mb-3">
//             Checking assignment…
//           </p>
//         ) : isReassign ? (
//           <p className="text-center text-xs text-amber-600 mb-3">
//             Currently assigned to <b>{currentAssigneeName}</b>
//             {existing?.deadline ? (
//               <>
//                 {" "}
//                 • Current deadline:{" "}
//                 <b>{String(existing.deadline).slice(0, 10)}</b>
//               </>
//             ) : null}
//           </p>
//         ) : null}

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Assign to BD User
//             </label>
//             <select
//               value={selectedUser}
//               onChange={(e) => setSelectedUser(e.target.value)}
//               disabled={loadingUsers || checking}
//               className="w-full px-3 py-2 border rounded-lg bg-white"
//             >
//               <option value="">
//                 {loadingUsers ? "Loading users..." : "Select a user"}
//               </option>
//               {users.map((u) => (
//                 <option key={u.id} value={u.id}>
//                   {u.employee_name} — {u.employee_email} (#{u.id})
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Deadline <span className="text-gray-400">(YYYY-MM-DD)</span>
//             </label>
//             <input
//               type="date"
//               value={deadline}
//               onChange={(e) => setDeadline(e.target.value)}
//               min={today}
//               className="w-full px-3 py-2 border rounded-lg bg-white"
//               placeholder="Select deadline"
//             />
//             {!isReassign && (
//               <p className="text-xs text-gray-500 mt-1">
//                 Required when assigning.
//               </p>
//             )}
//           </div>

//           <button
//             type="submit"
//             disabled={submitting || loadingUsers || checking}
//             className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-70"
//           >
//             {submitting
//               ? isReassign
//                 ? "Updating..."
//                 : "Assigning..."
//               : submitBtnText}
//           </button>
//         </form>
//       </div>
//       <TeamPickerModal
//         open={teamModalOpen}
//         onClose={() => setTeamModalOpen(false)}
//         baseURL={baseURL}
//         headers={headers}
//         onSelectTeam={handleAssignToTeam}
//       />
//     </div>
//   );
// }
// ***********************************************************************
// src/components/QuotationAssignModal.jsx
// import React, { useEffect, useState, useMemo } from "react";
// import axios from "axios";
// import Swal from "sweetalert2";

// export default function QuotationTypeModal({
//   open,
//   onClose,
//   clientId,
//   txnId,
//   baseURL,
//   token,
//   onDone,
// }) {
//   // ---- Users (single assign)
//   const [users, setUsers] = useState([]);
//   const [loadingUsers, setLoadingUsers] = useState(false);
//   const [selectedUser, setSelectedUser] = useState("");

//   // ---- Teams (bulk assign)
//   const [teams, setTeams] = useState([]);
//   const [loadingTeams, setLoadingTeams] = useState(false);
//   const [selectedTeamId, setSelectedTeamId] = useState(""); // "" means none
//   const [assigningTeam, setAssigningTeam] = useState(false);

//   // ---- Common
//   const [deadline, setDeadline] = useState("");
//   const [submitting, setSubmitting] = useState(false);

//   // CHANGED: store full summary instead of single row
//   const [summary, setSummary] = useState(null);
//   const [checking, setChecking] = useState(false);

//   // put this near the top of the component
//   const toArray = (resp) => {
//     // axios response -> array in resp.data.data OR resp.data
//     if (Array.isArray(resp?.data?.data)) return resp.data.data;
//     if (Array.isArray(resp?.data)) return resp.data;
//     // already an array?
//     if (Array.isArray(resp)) return resp;
//     // anything else -> empty list
//     return [];
//   };

//   useEffect(() => {
//     if (!open) return;
//     if (!clientId || !txnId) {
//       Swal.fire({
//         icon: "warning",
//         title: "Missing Information",
//         text: !clientId ? "Client ID not found." : "Transaction ID not found.",
//       }).then(() => onClose?.());
//     }
//   }, [open, clientId, txnId, onClose]);

//   const headers = useMemo(
//     () => ({
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${token}`,
//     }),
//     [token]
//   );

//   // ---- Load BD users
//   useEffect(() => {
//     if (!open) return;
//     (async () => {
//       try {
//         setLoadingUsers(true);
//         const res = await axios.get(
//           `${baseURL}/auth/api/re_calculator/retrieveUser`,
//           { headers }
//         );
//         setUsers(res.data?.status === "Success" ? res.data.data || [] : []);
//       } catch (err) {
//         if (err?.response?.status === 404) setUsers([]);
//         else if (err?.response?.status === 401)
//           Swal.fire({
//             icon: "warning",
//             title: "Session Expired",
//             text: "Please login again.",
//           });
//         else
//           Swal.fire({
//             icon: "error",
//             title: "Error",
//             text: "Failed to load users.",
//           });
//       } finally {
//         setLoadingUsers(false);
//       }
//     })();
//   }, [open, baseURL, headers]);

//   // ---- Load Teams (dropdown)
//   useEffect(() => {
//     if (!open) return;
//     (async () => {
//       try {
//         setLoadingTeams(true);
//         const candidates = [
//           `${baseURL}/auth/api/re_calculator/retrieveTeam`,
//           `${baseURL}/retrieveTeam`,
//           `${baseURL}/api/retrieveTeam`,
//         ];
//         let loaded = [];
//         for (const url of candidates) {
//           try {
//             // const r = await axios.get(url, { headers });
//             // loaded = r?.data?.data || r?.data || [];
//             const r = await axios.get(url, { headers });
//             loaded = toArray(r);
//             break;
//           } catch (e) {
//             if (e?.response?.status === 404) {
//               loaded = [];
//               break;
//             }
//           }
//         }
//         // setTeams(loaded);
//         setTeams(Array.isArray(loaded) ? loaded : []);
//       } catch {
//         Swal.fire({
//           icon: "error",
//           title: "Error",
//           text: "Failed to load teams.",
//         });
//       } finally {
//         setLoadingTeams(false);
//       }
//     })();
//   }, [open, baseURL, headers]);

//   // // CHANGED: use summary endpoint to prefill mode/user/team
//   // useEffect(() => {
//   //   if (!open) return;
//   //   let cancelled = false;

//   //   (async () => {
//   //     try {
//   //       setChecking(true);
//   //       const res = await axios.get(
//   //         `${baseURL}/auth/api/re_calculator/getAssignmentsSummary/${txnId}`,
//   //         { headers }
//   //       );
//   //       if (cancelled) return;

//   //       if (res.data?.status === "Success") {
//   //         const s = res.data.data || {
//   //           mode: "none",
//   //           team: null,
//   //           assignees: [],
//   //           total: 0,
//   //         };
//   //         setSummary(s);

//   //         if (s.mode === "team" && s.team?.id) {
//   //           setSelectedTeamId(s.team.id);
//   //           setSelectedUser("");
//   //           // deadline optional: keep as-is
//   //         } else if (s.mode === "single" && s.assignees?.[0]) {
//   //           setSelectedUser(String(s.assignees[0].user_id));
//   //           setSelectedTeamId("");
//   //           setDeadline(
//   //             s.assignees[0]?.deadline
//   //               ? String(s.assignees[0].deadline).slice(0, 10)
//   //               : ""
//   //           );
//   //         } else {
//   //           // none/mixed
//   //           setSelectedUser("");
//   //           setSelectedTeamId("");
//   //         }
//   //       } else {
//   //         // unexpected shape -> treat as none
//   //         setSummary({ mode: "none", team: null, assignees: [], total: 0 });
//   //         setSelectedUser("");
//   //         setSelectedTeamId("");
//   //         setDeadline("");
//   //       }
//   //     } catch (err) {
//   //       // IMPORTANT: treat 404 as "none"
//   //       if (err?.response?.status === 404) {
//   //         setSummary({ mode: "none", team: null, assignees: [], total: 0 });
//   //         setSelectedUser("");
//   //         setSelectedTeamId("");
//   //         setDeadline("");
//   //       } else {
//   //         // network/other -> still keep UI usable
//   //         setSummary({ mode: "none", team: null, assignees: [], total: 0 });
//   //       }
//   //     } finally {
//   //       setChecking(false);
//   //     }
//   //   })();

//   //   return () => {
//   //     cancelled = true;
//   //   };
//   // }, [open, baseURL, headers, txnId]);

//   useEffect(() => {
//     if (!open) return;
//     let cancelled = false;
//     (async () => {
//       try {
//         setChecking(true);
//         const res = await axios.get(
//           `${baseURL}/auth/api/re_calculator/getAssignmentsSummary/${txnId}`,
//           { headers }
//         );
//         if (cancelled) return;

//         if (res.data?.status === "Success") {
//           const s = res.data.data;
//           setSummary(s);

//           if (s.mode === "team" && s.team?.id) {
//             setSelectedTeamId(s.team.id);
//             setSelectedUser("");
//           } else if (s.mode === "single" && s.assignees?.[0]) {
//             setSelectedUser(String(s.assignees[0].user_id));
//             setSelectedTeamId("");
//             setDeadline(
//               s.assignees[0]?.deadline
//                 ? String(s.assignees[0].deadline).slice(0, 10)
//                 : ""
//             );
//           } else {
//             // mixed or none
//             setSelectedUser("");
//             setSelectedTeamId("");
//             // keep deadline empty unless you want to persist last value
//           }
//         } else {
//           setSummary(null);
//           setSelectedUser("");
//           setSelectedTeamId("");
//           setDeadline("");
//         }
//       } catch (err) {
//         console.log(err);

//         // 404 => nothing assigned yet
//         setSummary(null);
//         setSelectedUser("");
//         setSelectedTeamId("");
//         setDeadline("");
//       } finally {
//         setChecking(false);
//       }
//     })();

//     return () => {
//       cancelled = true;
//     };
//   }, [open, baseURL, headers, txnId]);

//   // derive helpers from summary
//   const summaryMode = summary?.mode || "none";
//   const singleRow = useMemo(() => {
//     return summaryMode === "single" ? summary?.assignees?.[0] : null;
//   }, [summaryMode, summary]);

//   const currentAssigneeName = useMemo(() => {
//     if (!singleRow?.user_id) return null;
//     const m = users.find((u) => Number(u.id) === Number(singleRow.user_id));
//     return m?.employee_name || singleRow?.name || `#${singleRow?.user_id}`;
//   }, [singleRow, users]);

//   // CHANGED: reassign only when previous mode was single
//   const isReassign = summaryMode === "single" && !!singleRow?.user_id;
//   const submitBtnText = isReassign ? "Update" : "Assign";
//   const today = new Date().toISOString().slice(0, 10);

//   // ---------------- SINGLE USER ASSIGN ----------------
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!clientId || !txnId) return;

//     if (!selectedUser) {
//       Swal.fire({
//         icon: "warning",
//         title: "Required",
//         text: "Please select a user.",
//       });
//       return;
//     }
//     if (!isReassign && !deadline) {
//       Swal.fire({
//         icon: "warning",
//         title: "Deadline Required",
//         text: "Please select a deadline.",
//       });
//       return;
//     }
//     if (deadline && deadline < today) {
//       Swal.fire({
//         icon: "warning",
//         title: "Invalid Deadline",
//         text: "Deadline cannot be in the past.",
//       });
//       return;
//     }

//     // CHANGED: compare against singleRow when reassign
//     const noUserChange =
//       isReassign && Number(selectedUser) === Number(singleRow.user_id);
//     const prevDeadline = singleRow?.deadline
//       ? String(singleRow.deadline).slice(0, 10)
//       : "";
//     const noDeadlineChange = isReassign && prevDeadline === (deadline || "");

//     if (noUserChange && noDeadlineChange) {
//       Swal.fire({
//         icon: "info",
//         title: "No Change",
//         text: "Nothing to update.",
//       });
//       return;
//     }

//     if (isReassign && Number(selectedUser) !== Number(singleRow.user_id)) {
//       const ok = await Swal.fire({
//         icon: "question",
//         title: "Re-assign?",
//         text: `Currently assigned to ${currentAssigneeName}. Do you want to assign it to another member?`,
//         showCancelButton: true,
//         confirmButtonText: "Yes, update",
//       });
//       if (!ok.isConfirmed) return;
//     }

//     try {
//       // If current mode is team/mixed, single assign will replace existing rows
//       if (summaryMode === "team" || summaryMode === "mixed") {
//         const okReplace = await Swal.fire({
//           icon: "warning",
//           title: "Replace existing assignments?",
//           html: "This will remove current team/mixed assignments for this TXN and assign it to the selected user.",
//           showCancelButton: true,
//           confirmButtonText: "Yes, replace",
//         });
//         if (!okReplace.isConfirmed) return;
//       }

//       setSubmitting(true);

//       if (isReassign) {
//         // CHANGED: pass old_user_id to update the specific row
//         await axios.put(
//           `${baseURL}/auth/api/re_calculator/reassignQuotation`,
//           {
//             txn_id: txnId,
//             user_id: Number(selectedUser),
//             deadline,
//             old_user_id: Number(singleRow.user_id),
//           },
//           { headers }
//         );
//       } else {
//         // from team/mixed/none -> make a fresh single assignment
//         await axios.post(
//           `${baseURL}/auth/api/re_calculator/assignQuotation`,
//           {
//             client_id: clientId,
//             txn_id: txnId,
//             user_id: Number(selectedUser),
//             deadline,
//           },
//           { headers }
//         );
//       }

//       Swal.fire({
//         icon: "success",
//         title: isReassign ? "Updated" : "Assigned",
//         text: isReassign
//           ? "Quotation updated successfully."
//           : "Quotation assigned successfully.",
//         timer: 1500,
//         showConfirmButton: false,
//       });
//       onClose?.();
//       onDone?.();
//     } catch (err) {
//       Swal.fire({
//         icon: "error",
//         title: "Error",
//         text: err?.response?.data?.message || "Operation failed.",
//       });
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   // ---------------- TEAM BULK ASSIGN ----------------
//   const assignToTeamBulkAPI = async (teamId) => {
//     await axios.post(
//       `${baseURL}/auth/api/re_calculator/assignQuotationToTeam`,
//       { client_id: clientId, txn_id: txnId, team_id: Number(teamId), deadline },
//       { headers }
//     );
//   };

//   const teamsSafe = useMemo(() => (Array.isArray(teams) ? teams : []), [teams]);

//   const handleAssignToTeamClick = async () => {
//     if (!selectedTeamId) {
//       Swal.fire("Required", "Please select a team.", "warning");
//       return;
//     }
//     if (!deadline) {
//       Swal.fire(
//         "Deadline Required",
//         "Please select a deadline first.",
//         "warning"
//       );
//       return;
//     }
//     if (deadline < today) {
//       Swal.fire(
//         "Invalid Deadline",
//         "Deadline cannot be in the past.",
//         "warning"
//       );
//       return;
//     }

//     const team = teamsSafe.find((t) => Number(t.id) === Number(selectedTeamId));
//     const willReplace =
//       summaryMode === "single" ||
//       summaryMode === "mixed" ||
//       (summaryMode === "team" &&
//         Number(summary?.team?.id) !== Number(selectedTeamId));

//     if (willReplace) {
//       const okReplace = await Swal.fire({
//         icon: "warning",
//         title: "Replace existing assignments?",
//         html:
//           summaryMode === "team" &&
//           Number(summary?.team?.id) !== Number(selectedTeamId)
//             ? `This will remove assignments for team <b>${
//                 summary?.team?.name || "#" + summary?.team?.id
//               }</b> and assign to team <b>${
//                 team?.name || "#" + selectedTeamId
//               }</b>.`
//             : "This will remove current single/mixed assignments and assign to the selected team.",
//         showCancelButton: true,
//         confirmButtonText: "Yes, replace",
//       });
//       if (!okReplace.isConfirmed) return;
//     }
//     const ok = await Swal.fire({
//       icon: "question",
//       title: "Assign to Team?",
//       html: `Assign TXN <b>${txnId}</b> to team <b>${
//         team?.name || `#${selectedTeamId}`
//       }</b>?<br/><small>All members will be notified.</small>`,
//       showCancelButton: true,
//       confirmButtonText: "Yes, assign",
//     });
//     if (!ok.isConfirmed) return;

//     try {
//       setAssigningTeam(true);
//       await assignToTeamBulkAPI(selectedTeamId);
//       Swal.fire("Success", "Quotation assigned to the team.", "success");
//       onClose?.();
//       onDone?.();
//     } catch (e) {
//       Swal.fire(
//         "Error",
//         e?.response?.data?.message || e.message || "Failed to assign to team",
//         "error"
//       );
//     } finally {
//       setAssigningTeam(false);
//     }
//   };

//   // Clear helpers
//   const clearUser = () => setSelectedUser("");
//   const clearTeam = () => setSelectedTeamId("");

//   if (!open) return null;

//   return (
//     <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
//       <div className="relative bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md">
//         <button
//           onClick={onClose}
//           className="absolute top-2 right-3 text-red-600 hover:text-gray-500 text-xl font-bold"
//           aria-label="Close"
//         >
//           ×
//         </button>

//         <h2 className="text-lg font-semibold mb-1 text-center">
//           {isReassign ? "Update Assignment" : "Assign Quotation"}
//         </h2>
//         <p className="text-xs text-center text-gray-500 mb-2">
//           Client ID: <span className="font-semibold">{clientId}</span> • TXN:{" "}
//           <span className="font-semibold">{txnId}</span>
//         </p>

//         {/* Status from summary */}
//         {checking ? (
//           <p className="text-center text-sm text-gray-500 mb-3">
//             Checking assignment…
//           </p>
//         ) : summaryMode === "team" && summary?.team ? (
//           <p className="text-center text-xs text-orange-600 mb-3">
//             Assigned to team <b>{summary.team.name}</b> • Members:{" "}
//             <b>{summary.total}</b>
//           </p>
//         ) : summaryMode === "single" ? (
//           <p className="text-center text-xs text-amber-600 mb-3">
//             Currently assigned to <b>{currentAssigneeName}</b>
//             {singleRow?.deadline ? (
//               <>
//                 {" "}
//                 • Current deadline:{" "}
//                 <b>{String(singleRow.deadline).slice(0, 10)}</b>
//               </>
//             ) : null}
//           </p>
//         ) : summaryMode === "mixed" ? (
//           <p className="text-center text-xs text-gray-600 mb-3">
//             Assigned to <b>{summary?.total || 0}</b> members (mixed)
//           </p>
//         ) : null}

//         {/* DEADLINE (shared) */}
//         <div className="mb-4">
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Deadline <span className="text-gray-400">(YYYY-MM-DD)</span>
//           </label>
//           <input
//             type="date"
//             value={deadline}
//             onChange={(e) => setDeadline(e.target.value)}
//             min={today}
//             className="w-full px-3 py-2 border rounded-lg bg-white"
//             placeholder="Select deadline"
//           />
//           {!isReassign && (
//             <p className="text-xs text-gray-500 mt-1">
//               Required when assigning.
//             </p>
//           )}
//         </div>

//         {/* --- Assign to User --- */}
//         <form onSubmit={handleSubmit} className="space-y-3 border-t pt-4">
//           <div>
//             <div className="flex items-center justify-between">
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Assign to BD User
//               </label>
//               {selectedUser ? (
//                 <button
//                   type="button"
//                   onClick={clearUser}
//                   className="text-xs text-red-600 hover:underline"
//                 >
//                   Clear
//                 </button>
//               ) : null}
//             </div>

//             <select
//               value={selectedUser}
//               onChange={(e) => {
//                 setSelectedUser(e.target.value);
//                 if (selectedTeamId) setSelectedTeamId(""); // mutually exclusive
//               }}
//               disabled={loadingUsers || checking}
//               className="w-full px-3 py-2 border rounded-lg bg-white"
//             >
//               <option value="">
//                 {loadingUsers ? "Loading users..." : "Select a user"}
//               </option>
//               {users.map((u) => (
//                 <option key={u.id} value={u.id}>
//                   {u.employee_name} — {u.employee_email} (#{u.id})
//                 </option>
//               ))}
//             </select>
//             {selectedTeamId ? (
//               <p className="text-[11px] text-gray-500 mt-1">
//                 Selecting a user will ignore the chosen team and assign only to
//                 the selected user.
//               </p>
//             ) : null}
//           </div>

//           <button
//             type="submit"
//             disabled={submitting || loadingUsers || checking || !selectedUser}
//             className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-70"
//           >
//             {submitting
//               ? isReassign
//                 ? "Updating..."
//                 : "Assigning..."
//               : submitBtnText}
//           </button>
//         </form>

//         {/* --- OR divider --- */}
//         <div className="my-4 flex items-center">
//           <div className="flex-1 h-px bg-gray-200" />
//           <span className="px-3 text-xs uppercase tracking-wide text-gray-500">
//             or
//           </span>
//           <div className="flex-1 h-px bg-gray-200" />
//         </div>

//         {/* --- Assign to Team --- */}
//         <div className="space-y-3">
//           <div>
//             <div className="flex items-center justify-between">
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Assign to Team
//               </label>
//               {selectedTeamId ? (
//                 <button
//                   type="button"
//                   onClick={clearTeam}
//                   className="text-xs text-red-600 hover:underline"
//                 >
//                   Clear
//                 </button>
//               ) : null}
//             </div>

//             <select
//               value={selectedTeamId}
//               onChange={(e) => {
//                 const v = Number(e.target.value) || "";
//                 setSelectedTeamId(v);
//                 if (selectedUser) setSelectedUser(""); // mutually exclusive
//               }}
//               disabled={loadingTeams || checking}
//               className="w-full px-3 py-2 border rounded-lg bg-white"
//             >
//               <option value="">
//                 {loadingTeams ? "Loading teams..." : "Select a team"}
//               </option>
//               {/* {teams.map((t) => ( */}
//               {teamsSafe.map((t) => (
//                 <option key={t.id} value={t.id}>
//                   {t.name} (#{t.id})
//                 </option>
//               ))}
//             </select>
//             <p className="text-xs text-gray-500 mt-1">
//               All members of the selected team will receive this quotation.
//             </p>
//           </div>

//           <button
//             type="button"
//             onClick={handleAssignToTeamClick}
//             disabled={!selectedTeamId || assigningTeam || checking}
//             className="w-full bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-500 disabled:opacity-70"
//           >
//             {assigningTeam ? "Assigning to Team..." : "Assign to Team"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// ***********************************************************************

import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function QuotationTypeModal({
  open,
  onClose,
  clientId,
  txnId,
  baseURL,
  token,
  onDone,
}) {
  // ---- Users (single assign)
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");

  // ---- Teams (bulk assign)
  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState(""); // "" means none
  const [assigningTeam, setAssigningTeam] = useState(false);

  // ---- Common
  const [deadline, setDeadline] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // CHANGED: store full summary instead of single row
  const [summary, setSummary] = useState(null);
  const [checking, setChecking] = useState(false);

  const normalizeDate = (d) => (d ? String(d).slice(0, 10) : "");
  const getTeamCommonDeadline = (assignees = []) => {
    const uniq = Array.from(
      new Set(assignees.map((a) => normalizeDate(a.deadline)).filter(Boolean))
    );
    return uniq.length === 1 ? uniq[0] : "";
  };

  useEffect(() => {
    if (!open) return;
    if (!clientId || !txnId) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: !clientId ? "Client ID not found." : "Transaction ID not found.",
      }).then(() => onClose?.());
    }
  }, [open, clientId, txnId, onClose]);

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  useEffect(() => {
    if (!open) return;
    setSummary(null);
    setSelectedUser("");
    setSelectedTeamId("");
    setDeadline("");
  }, [open]);

  // ---- Load BD users
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        setLoadingUsers(true);
        const res = await axios.get(
          `${baseURL}/auth/api/re_calculator/retrieveUser`,
          { headers }
        );
        setUsers(res.data?.status === "Success" ? res.data.data || [] : []);
      } catch (err) {
        if (err?.response?.status === 404) setUsers([]);
        else if (err?.response?.status === 401)
          Swal.fire({
            icon: "warning",
            title: "Session Expired",
            text: "Please login again.",
          });
        else
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to load users.",
          });
      } finally {
        setLoadingUsers(false);
      }
    })();
  }, [open, baseURL, headers]);

  // ---- Load Teams (dropdown)
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        setLoadingTeams(true);
        const candidates = [
          `${baseURL}/auth/api/re_calculator/retrieveTeam`,
          `${baseURL}/retrieveTeam`,
          `${baseURL}/api/retrieveTeam`,
        ];
        let loaded = [];
        for (const url of candidates) {
          try {
            const r = await axios.get(url, { headers });
            loaded = r?.data?.data || r?.data || [];
            break;
          } catch (e) {
            if (e?.response?.status === 404) {
              loaded = [];
              break;
            }
          }
        }
        setTeams(loaded);
      } catch {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to load teams.",
        });
      } finally {
        setLoadingTeams(false);
      }
    })();
  }, [open, baseURL, headers]);

  // CHANGED: use summary endpoint to prefill mode/user/team
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        setChecking(true);
        const res = await axios.get(
          `${baseURL}/auth/api/re_calculator/getAssignmentsSummary/${txnId}`,
          { headers }
        );
        if (cancelled) return;

        console.log(res.data);

        if (res.data?.status === "Success") {
          const s = res.data.data;
          console.log(s);
          setSummary(s);

          if (s.mode === "team" && s.team?.id) {
            setSelectedTeamId(s.team.id);
            setSelectedUser("");
            const teamDeadline = getTeamCommonDeadline(s.assignees);
            setDeadline(teamDeadline);
          } else if (s.mode === "single" && s.assignees?.[0]) {
            setSelectedUser(String(s.assignees[0].user_id));
            setSelectedTeamId("");
            setDeadline(normalizeDate(s.assignees[0]?.deadline || ""));
            // setDeadline(
            //   s.assignees[0]?.deadline
            //     ? String(s.assignees[0].deadline).slice(0, 10)
            //     : ""
            // );
          } else {
            // mixed or none
            setSelectedUser("");
            setSelectedTeamId("");
            setDeadline("");
            // keep deadline empty unless you want to persist last value
          }
        } else {
          setSummary(null);
          setSelectedUser("");
          setSelectedTeamId("");
          setDeadline("");
        }
      } catch (err) {
        console.log(err);

        // 404 => nothing assigned yet
        setSummary(null);
        setSelectedUser("");
        setSelectedTeamId("");
        setDeadline("");
      } finally {
        setChecking(false);
      }
    })();

    console.log(summary);
    console.log(deadline);

    return () => {
      cancelled = true;
    };
  }, [open, baseURL, headers, txnId]);

  // derive helpers from summary
  const summaryMode = summary?.mode || "none";
  const singleRow = useMemo(() => {
    return summaryMode === "single" ? summary?.assignees?.[0] : null;
  }, [summaryMode, summary]);

  const currentAssigneeName = useMemo(() => {
    if (!singleRow?.user_id) return null;
    const m = users.find((u) => Number(u.id) === Number(singleRow.user_id));
    return m?.employee_name || singleRow?.name || `#${singleRow?.user_id}`;
  }, [singleRow, users]);

  // CHANGED: reassign only when previous mode was single
  const isReassign = summaryMode === "single" && !!singleRow?.user_id;
  const submitBtnText = isReassign ? "Update" : "Assign";
  const today = new Date().toISOString().slice(0, 10);

  // ---------------- SINGLE USER ASSIGN ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientId || !txnId) return;

    if (!selectedUser) {
      Swal.fire({
        icon: "warning",
        title: "Required",
        text: "Please select a user.",
      });
      return;
    }
    if (!isReassign && !deadline) {
      Swal.fire({
        icon: "warning",
        title: "Deadline Required",
        text: "Please select a deadline.",
      });
      return;
    }
    if (deadline && deadline < today) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Deadline",
        text: "Deadline cannot be in the past.",
      });
      return;
    }

    // CHANGED: compare against singleRow when reassign
    const noUserChange =
      isReassign && Number(selectedUser) === Number(singleRow.user_id);
    const prevDeadline = singleRow?.deadline
      ? String(singleRow.deadline).slice(0, 10)
      : "";
    const noDeadlineChange = isReassign && prevDeadline === (deadline || "");

    if (noUserChange && noDeadlineChange) {
      Swal.fire({
        icon: "info",
        title: "No Change",
        text: "Nothing to update.",
      });
      return;
    }

    if (isReassign && Number(selectedUser) !== Number(singleRow.user_id)) {
      const ok = await Swal.fire({
        icon: "question",
        title: "Re-assign?",
        text: `Currently assigned to ${currentAssigneeName}. Do you want to assign it to another member?`,
        showCancelButton: true,
        confirmButtonText: "Yes, update",
      });
      if (!ok.isConfirmed) return;
    }

    try {
      // If current mode is team/mixed, single assign will replace existing rows
      if (summaryMode === "team" || summaryMode === "mixed") {
        const okReplace = await Swal.fire({
          icon: "warning",
          title: "Replace existing assignments?",
          html: "This will remove current team/mixed assignments for this TXN and assign it to the selected user.",
          showCancelButton: true,
          confirmButtonText: "Yes, replace",
        });
        if (!okReplace.isConfirmed) return;
      }

      setSubmitting(true);

      if (isReassign) {
        // CHANGED: pass old_user_id to update the specific row
        await axios.put(
          `${baseURL}/auth/api/re_calculator/reassignQuotation`,
          {
            txn_id: txnId,
            user_id: Number(selectedUser),
            deadline,
            old_user_id: Number(singleRow.user_id),
          },
          { headers }
        );
      } else {
        // from team/mixed/none -> make a fresh single assignment
        await axios.post(
          `${baseURL}/auth/api/re_calculator/assignQuotation`,
          {
            client_id: clientId,
            txn_id: txnId,
            user_id: Number(selectedUser),
            deadline,
          },
          { headers }
        );
      }

      Swal.fire({
        icon: "success",
        title: isReassign ? "Updated" : "Assigned",
        text: isReassign
          ? "Quotation updated successfully."
          : "Quotation assigned successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
      onClose?.();
      onDone?.();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err?.response?.data?.message || "Operation failed.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------- TEAM BULK ASSIGN ----------------
  const assignToTeamBulkAPI = async (teamId) => {
    await axios.post(
      `${baseURL}/auth/api/re_calculator/assignQuotationToTeam`,
      { client_id: clientId, txn_id: txnId, team_id: Number(teamId), deadline },
      { headers }
    );
  };

  const handleAssignToTeamClick = async () => {
    if (!selectedTeamId) {
      Swal.fire("Required", "Please select a team.", "warning");
      return;
    }
    if (!deadline) {
      Swal.fire(
        "Deadline Required",
        "Please select a deadline first.",
        "warning"
      );
      return;
    }
    if (deadline < today) {
      Swal.fire(
        "Invalid Deadline",
        "Deadline cannot be in the past.",
        "warning"
      );
      return;
    }

    const team = teams.find((t) => Number(t.id) === Number(selectedTeamId));
    const willReplace =
      summaryMode === "single" ||
      summaryMode === "mixed" ||
      (summaryMode === "team" &&
        Number(summary?.team?.id) !== Number(selectedTeamId));

    if (willReplace) {
      const okReplace = await Swal.fire({
        icon: "warning",
        title: "Replace existing assignments?",
        html:
          summaryMode === "team" &&
          Number(summary?.team?.id) !== Number(selectedTeamId)
            ? `This will remove assignments for team <b>${
                summary?.team?.name || "#" + summary?.team?.id
              }</b> and assign to team <b>${
                team?.name || "#" + selectedTeamId
              }</b>.`
            : "This will remove current single/mixed assignments and assign to the selected team.",
        showCancelButton: true,
        confirmButtonText: "Yes, replace",
      });
      if (!okReplace.isConfirmed) return;
    }
    const ok = await Swal.fire({
      icon: "question",
      title: "Assign to Team?",
      html: `Assign TXN <b>${txnId}</b> to team <b>${
        team?.name || `#${selectedTeamId}`
      }</b>?<br/><small>All members will be notified.</small>`,
      showCancelButton: true,
      confirmButtonText: "Yes, assign",
    });
    if (!ok.isConfirmed) return;

    try {
      setAssigningTeam(true);
      await assignToTeamBulkAPI(selectedTeamId);
      Swal.fire("Success", "Quotation assigned to the team.", "success");
      onClose?.();
      onDone?.();
    } catch (e) {
      Swal.fire(
        "Error",
        e?.response?.data?.message || e.message || "Failed to assign to team",
        "error"
      );
    } finally {
      setAssigningTeam(false);
    }
  };

  // Clear helpers
  const clearUser = () => setSelectedUser("");
  const clearTeam = () => setSelectedTeamId("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="relative bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md">
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-red-600 hover:text-gray-500 text-xl font-bold"
          aria-label="Close"
        >
          ×
        </button>

        <h2 className="text-lg font-semibold mb-1 text-center">
          {isReassign ? "Update Assignment" : "Assign Quotation"}
        </h2>
        <p className="text-xs text-center text-gray-500 mb-2">
          Client ID: <span className="font-semibold">{clientId}</span> • TXN:{" "}
          <span className="font-semibold">{txnId}</span>
        </p>

        {/* Status from summary */}
        {checking ? (
          <p className="text-center text-sm text-gray-500 mb-3">
            Checking assignment…
          </p>
        ) : summaryMode === "team" && summary?.team ? (
          <p className="text-center text-xs text-orange-600 mb-3">
            Assigned to team <b>{summary.team.name}</b> • Members:{" "}
            <b>{summary.total}</b>
            {getTeamCommonDeadline(summary.assignees) ? (
              <>
                {" "}
                • Current deadline:{" "}
                <b>{getTeamCommonDeadline(summary.assignees)}</b>
              </>
            ) : (
              <>
                {" "}
                •{" "}
                <span className="text-gray-500">
                  Members have different deadlines
                </span>
              </>
            )}
          </p>
        ) : summaryMode === "single" ? (
          <p className="text-center text-xs text-amber-600 mb-3">
            Currently assigned to <b>{currentAssigneeName}</b>
            {singleRow?.deadline ? (
              <>
                {" "}
                • Current deadline:{" "}
                <b>{String(singleRow.deadline).slice(0, 10)}</b>
              </>
            ) : null}
          </p>
        ) : summaryMode === "mixed" ? (
          <p className="text-center text-xs text-gray-600 mb-3">
            Assigned to <b>{summary?.total || 0}</b> members (mixed)
          </p>
        ) : null}

        {/* DEADLINE (shared) */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deadline <span className="text-gray-400">(YYYY-MM-DD)</span>
          </label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            min={today}
            className="w-full px-3 py-2 border rounded-lg bg-white"
            placeholder="Select deadline"
          />
          {!isReassign && (
            <p className="text-xs text-gray-500 mt-1">
              Required when assigning.
            </p>
          )}
        </div>

        {/* --- Assign to User --- */}
        <form onSubmit={handleSubmit} className="space-y-3 border-t pt-4">
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign to BD User
              </label>
              {selectedUser ? (
                <button
                  type="button"
                  onClick={clearUser}
                  className="text-xs text-red-600 hover:underline"
                >
                  Clear
                </button>
              ) : null}
            </div>

            <select
              value={selectedUser}
              onChange={(e) => {
                setSelectedUser(e.target.value);
                if (selectedTeamId) setSelectedTeamId(""); // mutually exclusive
              }}
              disabled={loadingUsers || checking}
              className="w-full px-3 py-2 border rounded-lg bg-white"
            >
              <option value="">
                {loadingUsers ? "Loading users..." : "Select a user"}
              </option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.employee_name} — {u.employee_email} (#{u.id})
                </option>
              ))}
            </select>
            {selectedTeamId ? (
              <p className="text-[11px] text-gray-500 mt-1">
                Selecting a user will ignore the chosen team and assign only to
                the selected user.
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={submitting || loadingUsers || checking || !selectedUser}
            className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-70"
          >
            {submitting
              ? isReassign
                ? "Updating..."
                : "Assigning..."
              : submitBtnText}
          </button>
        </form>

        {/* --- OR divider --- */}
        <div className="my-4 flex items-center">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="px-3 text-xs uppercase tracking-wide text-gray-500">
            or
          </span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* --- Assign to Team --- */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign to Team
              </label>
              {selectedTeamId ? (
                <button
                  type="button"
                  onClick={clearTeam}
                  className="text-xs text-red-600 hover:underline"
                >
                  Clear
                </button>
              ) : null}
            </div>

            <select
              value={selectedTeamId}
              onChange={(e) => {
                const v = Number(e.target.value) || "";
                setSelectedTeamId(v);
                if (selectedUser) setSelectedUser(""); // mutually exclusive
              }}
              disabled={loadingTeams || checking}
              className="w-full px-3 py-2 border rounded-lg bg-white"
            >
              <option value="">
                {loadingTeams ? "Loading teams..." : "Select a team"}
              </option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (#{t.id})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              All members of the selected team will receive this quotation.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAssignToTeamClick}
            disabled={!selectedTeamId || assigningTeam || checking}
            className="w-full bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-500 disabled:opacity-70"
          >
            {assigningTeam ? "Assigning to Team..." : "Assign to Team"}
          </button>
        </div>
      </div>
    </div>
  );
}

// src/components/QuotationAssignModal.jsx
// import React, { useEffect, useState, useMemo } from "react";
// import axios from "axios";
// import Swal from "sweetalert2";

// export default function QuotationTypeModal({
//   open,
//   onClose,
//   clientId,
//   txnId,
//   baseURL,
//   token,
//   onDone,
// }) {
//   // ---- Users (single assign)
//   const [users, setUsers] = useState([]);
//   const [loadingUsers, setLoadingUsers] = useState(false);
//   const [selectedUser, setSelectedUser] = useState("");

//   // ---- Teams (bulk assign)
//   const [teams, setTeams] = useState([]);
//   const [loadingTeams, setLoadingTeams] = useState(false);
//   const [selectedTeamId, setSelectedTeamId] = useState(""); // keep "" when none
//   const [assigningTeam, setAssigningTeam] = useState(false);

//   // ---- Common
//   const [deadline, setDeadline] = useState("");
//   const [submitting, setSubmitting] = useState(false);
//   const [existing, setExisting] = useState(null);
//   const [checking, setChecking] = useState(false);

//   useEffect(() => {
//     if (!open) return;
//     if (!clientId || !txnId) {
//       Swal.fire({
//         icon: "warning",
//         title: "Missing Information",
//         text: !clientId ? "Client ID not found." : "Transaction ID not found.",
//       }).then(() => onClose?.());
//     }
//   }, [open, clientId, txnId, onClose]);

//   const headers = useMemo(
//     () => ({
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${token}`,
//     }),
//     [token]
//   );

//   // ---- Load BD users
//   useEffect(() => {
//     if (!open) return;
//     (async () => {
//       try {
//         setLoadingUsers(true);
//         const res = await axios.get(
//           `${baseURL}/auth/api/re_calculator/retrieveUser`,
//           { headers }
//         );
//         setUsers(res.data?.status === "Success" ? res.data.data || [] : []);
//       } catch (err) {
//         if (err?.response?.status === 404) {
//           setUsers([]);
//         } else if (err?.response?.status === 401) {
//           Swal.fire({
//             icon: "warning",
//             title: "Session Expired",
//             text: "Please login again.",
//           });
//         } else {
//           Swal.fire({
//             icon: "error",
//             title: "Error",
//             text: "Failed to load users.",
//           });
//         }
//       } finally {
//         setLoadingUsers(false);
//       }
//     })();
//   }, [open, baseURL, headers]);

//   // ---- Load Teams (dropdown)
//   useEffect(() => {
//     if (!open) return;
//     (async () => {
//       try {
//         setLoadingTeams(true);
//         // try with auth prefix first, then fallback to unprefixed
//         const candidates = [
//           `${baseURL}/auth/api/re_calculator/retrieveTeam`,
//           `${baseURL}/retrieveTeam`,
//           `${baseURL}/api/retrieveTeam`,
//         ];
//         let loaded = [];
//         for (const url of candidates) {
//           try {
//             const r = await axios.get(url, { headers });
//             loaded = r?.data?.data || r?.data || [];
//             break;
//           } catch (e) {
//             // try next; treat 404 as empty (stop)
//             if (e?.response?.status === 404) {
//               loaded = [];
//               break;
//             }
//           }
//         }
//         setTeams(loaded);
//       } catch {
//         Swal.fire({
//           icon: "error",
//           title: "Error",
//           text: "Failed to load teams.",
//         });
//       } finally {
//         setLoadingTeams(false);
//       }
//     })();
//   }, [open, baseURL, headers]);

//   // ---- Check if already assigned (single)
//   useEffect(() => {
//     if (!open) return;
//     (async () => {
//       try {
//         setChecking(true);
//         const res = await axios.get(
//           `${baseURL}/auth/api/re_calculator/getAssignmentByTxn/${txnId}`,
//           { headers }
//         );
//         if (res.data?.status === "Success") {
//           const row = res.data.data;
//           setExisting(row);
//           setSelectedUser(String(row.user_id || ""));
//           setDeadline(row.deadline ? String(row.deadline).slice(0, 10) : "");
//         } else {
//           setExisting(null);
//           setSelectedUser("");
//           setDeadline("");
//         }
//       } catch (err) {
//         if (err?.response?.status === 404) {
//           setExisting(null);
//           setSelectedUser("");
//           setDeadline("");
//         } else if (err?.response?.status === 401) {
//           Swal.fire({
//             icon: "warning",
//             title: "Session Expired",
//             text: "Please login again.",
//           });
//         } else {
//           Swal.fire({
//             icon: "error",
//             title: "Error",
//             text: "Failed to check assignment.",
//           });
//         }
//       } finally {
//         setChecking(false);
//       }
//     })();
//   }, [open, baseURL, headers, txnId]);

//   const currentAssigneeName = useMemo(() => {
//     if (!existing?.user_id) return null;
//     const m = users.find((u) => Number(u.id) === Number(existing.user_id));
//     return m?.employee_name || existing.employee_name || `#${existing.user_id}`;
//   }, [existing, users]);

//   const isReassign = !!existing?.user_id;
//   const submitBtnText = isReassign ? "Update" : "Assign";
//   const today = new Date().toISOString().slice(0, 10);

//   // ---------------- SINGLE USER ASSIGN ----------------
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!clientId || !txnId) return;

//     if (!selectedUser) {
//       Swal.fire({
//         icon: "warning",
//         title: "Required",
//         text: "Please select a user.",
//       });
//       return;
//     }
//     if (!isReassign && !deadline) {
//       Swal.fire({
//         icon: "warning",
//         title: "Deadline Required",
//         text: "Please select a deadline.",
//       });
//       return;
//     }
//     if (deadline && deadline < today) {
//       Swal.fire({
//         icon: "warning",
//         title: "Invalid Deadline",
//         text: "Deadline cannot be in the past.",
//       });
//       return;
//     }

//     const noUserChange =
//       isReassign && Number(selectedUser) === Number(existing.user_id);
//     const noDeadlineChange =
//       isReassign &&
//       (existing?.deadline ? String(existing.deadline).slice(0, 10) : "") ===
//         (deadline || "");
//     if (noUserChange && noDeadlineChange) {
//       Swal.fire({
//         icon: "info",
//         title: "No Change",
//         text: "Nothing to update.",
//       });
//       return;
//     }

//     if (isReassign && Number(selectedUser) !== Number(existing.user_id)) {
//       const ok = await Swal.fire({
//         icon: "question",
//         title: "Re-assign?",
//         text: `Currently assigned to ${currentAssigneeName}. Do you want to assign it to another member?`,
//         showCancelButton: true,
//         confirmButtonText: "Yes, update",
//       });
//       if (!ok.isConfirmed) return;
//     }

//     try {
//       setSubmitting(true);
//       if (!isReassign) {
//         await axios.post(
//           `${baseURL}/auth/api/re_calculator/assignQuotation`,
//           {
//             client_id: clientId,
//             txn_id: txnId,
//             user_id: Number(selectedUser),
//             deadline,
//           },
//           { headers }
//         );
//       } else {
//         await axios.put(
//           `${baseURL}/auth/api/re_calculator/reassignQuotation`,
//           { txn_id: txnId, user_id: Number(selectedUser), deadline },
//           { headers }
//         );
//       }

//       Swal.fire({
//         icon: "success",
//         title: isReassign ? "Updated" : "Assigned",
//         text: isReassign
//           ? "Quotation updated successfully."
//           : "Quotation assigned successfully.",
//         timer: 1500,
//         showConfirmButton: false,
//       });
//       onClose?.();
//       onDone?.();
//     } catch (err) {
//       console.log(err);

//       Swal.fire({ icon: "error", title: "Error", text: "Operation failed." });
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   // ---------------- TEAM BULK ASSIGN ----------------
//   const assignToTeamBulkAPI = async (teamId) => {
//     await axios.post(
//       `${baseURL}/auth/api/re_calculator/assignQuotationToTeam`,
//       { client_id: clientId, txn_id: txnId, team_id: Number(teamId), deadline },
//       { headers }
//     );
//   };

//   const handleAssignToTeamClick = async () => {
//     if (!selectedTeamId) {
//       Swal.fire("Required", "Please select a team.", "warning");
//       return;
//     }
//     if (!deadline) {
//       Swal.fire(
//         "Deadline Required",
//         "Please select a deadline first.",
//         "warning"
//       );
//       return;
//     }
//     if (deadline < today) {
//       Swal.fire(
//         "Invalid Deadline",
//         "Deadline cannot be in the past.",
//         "warning"
//       );
//       return;
//     }

//     const team = teams.find((t) => Number(t.id) === Number(selectedTeamId));
//     const ok = await Swal.fire({
//       icon: "question",
//       title: "Assign to Team?",
//       html: `Assign TXN <b>${txnId}</b> to team <b>${
//         team?.name || `#${selectedTeamId}`
//       }</b>?<br/><small>All members will be notified.</small>`,
//       showCancelButton: true,
//       confirmButtonText: "Yes, assign",
//     });
//     if (!ok.isConfirmed) return;

//     try {
//       setAssigningTeam(true);
//       await assignToTeamBulkAPI(selectedTeamId);
//       Swal.fire("Success", "Quotation assigned to the team.", "success");
//       onClose?.();
//       onDone?.();
//     } catch (e) {
//       Swal.fire(
//         "Error",
//         e?.response?.data?.message || e.message || "Failed to assign to team",
//         "error"
//       );
//     } finally {
//       setAssigningTeam(false);
//     }
//   };

//   if (!open) return null;

//   return (
//     <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
//       <div className="relative bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md">
//         <button
//           onClick={onClose}
//           className="absolute top-2 right-3 text-red-600 hover:text-gray-500 text-xl font-bold"
//           aria-label="Close"
//         >
//           ×
//         </button>

//         <h2 className="text-lg font-semibold mb-1 text-center">
//           {isReassign ? "Update Assignment" : "Assign Quotation"}
//         </h2>
//         <p className="text-xs text-center text-gray-500 mb-2">
//           Client ID: <span className="font-semibold">{clientId}</span> • TXN:{" "}
//           <span className="font-semibold">{txnId}</span>
//         </p>

//         {/* existing status */}
//         {checking ? (
//           <p className="text-center text-sm text-gray-500 mb-3">
//             Checking assignment…
//           </p>
//         ) : isReassign ? (
//           <p className="text-center text-xs text-amber-600 mb-3">
//             Currently assigned to <b>{currentAssigneeName}</b>
//             {existing?.deadline ? (
//               <>
//                 {" "}
//                 • Current deadline:{" "}
//                 <b>{String(existing.deadline).slice(0, 10)}</b>
//               </>
//             ) : null}
//           </p>
//         ) : null}

//         {/* DEADLINE (shared) */}
//         <div className="mb-4">
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Deadline <span className="text-gray-400">(YYYY-MM-DD)</span>
//           </label>
//           <input
//             type="date"
//             value={deadline}
//             onChange={(e) => setDeadline(e.target.value)}
//             min={today}
//             className="w-full px-3 py-2 border rounded-lg bg-white"
//             placeholder="Select deadline"
//           />
//           {!isReassign && (
//             <p className="text-xs text-gray-500 mt-1">
//               Required when assigning.
//             </p>
//           )}
//         </div>

//         {/* --- Assign to User --- */}
//         <form onSubmit={handleSubmit} className="space-y-3 border-t pt-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Assign to Single User
//             </label>
//             <select
//               value={selectedUser}
//               onChange={(e) => setSelectedUser(e.target.value)}
//               disabled={loadingUsers || checking}
//               className="w-full px-3 py-2 border rounded-lg bg-white"
//             >
//               <option value="">
//                 {loadingUsers ? "Loading users..." : "Select a user"}
//               </option>
//               {users.map((u) => (
//                 <option key={u.id} value={u.id}>
//                   {u.employee_name} — {u.employee_email} (#{u.id})
//                 </option>
//               ))}
//             </select>
//           </div>

//           <button
//             type="submit"
//             disabled={submitting || loadingUsers || checking}
//             className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-70"
//           >
//             {submitting
//               ? isReassign
//                 ? "Updating..."
//                 : "Assigning..."
//               : submitBtnText}
//           </button>
//         </form>

//         {/* --- OR divider --- */}
//         <div className="my-4 flex items-center">
//           <div className="flex-1 h-px bg-gray-200" />
//           <span className="px-3 text-xs uppercase tracking-wide text-gray-500">
//             or
//           </span>
//           <div className="flex-1 h-px bg-gray-200" />
//         </div>

//         {/* --- Assign to Team --- */}
//         <div className="space-y-3">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Assign to Team
//             </label>
//             <select
//               value={selectedTeamId}
//               onChange={(e) => setSelectedTeamId(Number(e.target.value) || "")}
//               disabled={loadingTeams || checking}
//               className="w-full px-3 py-2 border rounded-lg bg-white"
//             >
//               <option value="">
//                 {loadingTeams ? "Loading teams..." : "Select a team"}
//               </option>
//               {teams.map((t) => (
//                 <option key={t.id} value={t.id}>
//                   {t.name} (#{t.id})
//                 </option>
//               ))}
//             </select>
//             <p className="text-xs text-gray-500 mt-1">
//               All members of the selected team will receive this quotation.
//             </p>
//           </div>

//           <button
//             type="button"
//             onClick={handleAssignToTeamClick}
//             disabled={!selectedTeamId || assigningTeam || checking}
//             className="w-full bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-500 disabled:opacity-70"
//           >
//             {assigningTeam ? "Assigning to Team..." : "Assign to Team"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }
