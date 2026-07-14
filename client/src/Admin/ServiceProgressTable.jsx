// // src/components/ServiceProgressTable.jsx
// import React, { useEffect, useMemo, useState } from "react";
// import axios from "axios";
// import Swal from "sweetalert2";

// const keyOf = (row) =>
//   `${row.service_name}|||${row.category_name}|||${row.editing_type_name || ""}`;

// export default function ServiceProgressTable({
//   baseURL,
//   token,
//   clientId,
//   txnId,
//   currentEmployeeId,
// }) {
//   const [historyRows, setHistoryRows] = useState([]);
//   const [progressMap, setProgressMap] = useState({}); // key -> { planned_qty, done_qty }
//   const [loading, setLoading] = useState(false);
//   const [savingKey, setSavingKey] = useState(null);

//   const headers = useMemo(
//     () => ({
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${token}`,
//     }),
//     [token]
//   );

//   // Fetch source history
//   useEffect(() => {
//     if (!clientId || !txnId) return;
//     const fetchAll = async () => {
//       try {
//         setLoading(true);
//         const [histRes, progRes] = await Promise.all([
//           axios.get(
//             `${baseURL}/auth/api/calculator/getClientServiceHistory/${clientId}/${txnId}`,
//             { headers }
//           ),
//           axios.get(`${baseURL}/auth/api/calculator/progress/by-txn/${txnId}`, {
//             headers,
//           }),
//         ]);

//         const hist = (histRes.data?.data || []).map((r) => ({
//           service_name: r.service_name,
//           category_name: r.category_name,
//           editing_type_name: r.editing_type_name || "",
//           planned_qty: parseInt(r.quantity, 10) || 0,
//         }));
//         setHistoryRows(hist);

//         const pm = {};
//         (progRes.data?.data || []).forEach((p) => {
//           const k = keyOf(p);
//           pm[k] = {
//             planned_qty: parseInt(p.planned_qty, 10) || 0,
//             done_qty: parseInt(p.done_qty, 10) || 0,
//           };
//         });
//         setProgressMap(pm);
//       } catch (e) {
//         console.error(e);
//         Swal.fire({
//           icon: "error",
//           title: "Error",
//           text: "Failed to load data.",
//         });
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchAll();
//   }, [baseURL, headers, clientId, txnId]);

//   const mergedRows = historyRows.map((r) => {
//     const k = keyOf(r);
//     const pm = progressMap[k] || { planned_qty: r.planned_qty, done_qty: 0 };
//     // if planned changed, prefer history planned
//     const planned = r.planned_qty;
//     const done = Math.min(pm.done_qty, planned);
//     return { ...r, key: k, planned_qty: planned, done_qty: done };
//   });

//   const setDoneFor = async (row, newDone) => {
//     const planned = row.planned_qty;
//     let val = parseInt(newDone, 10);
//     if (isNaN(val)) val = 0;
//     if (val < 0) val = 0;
//     if (val > planned) val = planned;

//     try {
//       setSavingKey(row.key);
//       await axios.patch(
//         `${baseURL}/auth/api/calculator/progress/set-done`,
//         {
//           client_id: clientId,
//           txn_id: txnId,
//           service_name: row.service_name,
//           category_name: row.category_name,
//           editing_type_name: row.editing_type_name || "",
//           planned_qty: planned,
//           done_qty: val,
//           user_id: currentEmployeeId,
//           // /* current employee id */ JSON.parse(
//           //   localStorage.getItem("dg_employee_id") || "0"
//           // ) || 0,
//         },
//         { headers }
//       );
//       setProgressMap((prev) => ({
//         ...prev,
//         [row.key]: { planned_qty: planned, done_qty: val },
//       }));
//     } catch (e) {
//       console.error(e);
//       Swal.fire({ icon: "error", title: "Error", text: "Failed to save." });
//     } finally {
//       setSavingKey(null);
//     }
//   };

//   const incDoneFor = async (row, delta) => {
//     const planned = row.planned_qty;
//     try {
//       setSavingKey(row.key);
//       await axios.patch(
//         `${baseURL}/auth/api/calculator/progress/increment`,
//         {
//           client_id: clientId,
//           txn_id: txnId,
//           service_name: row.service_name,
//           category_name: row.category_name,
//           editing_type_name: row.editing_type_name || "",
//           planned_qty: planned,
//           delta,
//           user_id: currentEmployeeId,
//           // JSON.parse(localStorage.getItem("dg_employee_id") || "0") || 0,
//         },
//         { headers }
//       );
//       // Optimistic refresh: recompute from local state
//       const current = progressMap[row.key]?.done_qty || 0;
//       const next = Math.max(0, Math.min(planned, current + delta));
//       setProgressMap((prev) => ({
//         ...prev,
//         [row.key]: { planned_qty: planned, done_qty: next },
//       }));
//     } catch (e) {
//       console.error(e);
//       Swal.fire({ icon: "error", title: "Error", text: "Failed to update." });
//     } finally {
//       setSavingKey(null);
//     }
//   };

//   if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

//   return (
//     <div className="bg-white rounded-xl shadow border p-4">
//       <h3 className="text-lg font-semibold mb-3">Work Progress</h3>
//       <div className="overflow-x-auto">
//         {/* <table className="min-w-full text-sm"> */}
//         <table className="min-w-full text-sm table-fixed">
//           <thead>
//             <tr className="text-left border-b">
//               <th className="py-2 pr-4">Service</th>
//               <th className="py-2 pr-4">Category</th>
//               <th className="py-2 pr-4">Planned Qty</th>
//               <th className="py-2 pr-4">Done / Complete Qty</th>
//               <th className="py-2 pr-4">Remaining</th>
//               <th className="py-2 pr-4">Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {mergedRows.map((row) => {
//               const remaining = Math.max(0, row.planned_qty - row.done_qty);
//               return (
//                 <tr key={row.key} className="border-b last:border-0">
//                   <td className="py-2 pr-4 font-medium">{row.service_name}</td>
//                   <td className="py-2 pr-4">{row.category_name}</td>
//                   <td className="py-2 pr-4">{row.planned_qty}</td>
//                   <td className="py-2 pr-4">
//                     <input
//                       type="number"
//                       min={0}
//                       max={row.planned_qty}
//                       value={row.done_qty}
//                       onChange={(e) => {
//                         const v = e.target.value;
//                         // local UI update only
//                         setProgressMap((prev) => ({
//                           ...prev,
//                           [row.key]: {
//                             planned_qty: row.planned_qty,
//                             done_qty: Math.max(
//                               0,
//                               Math.min(row.planned_qty, parseInt(v, 10) || 0)
//                             ),
//                           },
//                         }));
//                       }}
//                       onBlur={(e) => setDoneFor(row, e.target.value)}
//                       className="w-24 px-2 py-1 border rounded"
//                       disabled={savingKey === row.key}
//                     />
//                   </td>
//                   <td className="py-2 pr-4">{remaining}</td>
//                   <td className="py-2 pr-4">
//                     <div className="flex gap-2">
//                       <button
//                         onClick={() => incDoneFor(row, -1)}
//                         disabled={savingKey === row.key || row.done_qty <= 0}
//                         className="px-2 py-1 border rounded disabled:opacity-50"
//                       >
//                         -1
//                       </button>
//                       <button
//                         onClick={() => incDoneFor(row, +1)}
//                         disabled={
//                           savingKey === row.key ||
//                           row.done_qty >= row.planned_qty
//                         }
//                         className="px-2 py-1 border rounded disabled:opacity-50"
//                       >
//                         +1
//                       </button>

//                       <button
//                         onClick={() => setDoneFor(row, row.done_qty)}
//                         disabled={savingKey === row.key}
//                         className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-50"
//                       >
//                         {savingKey === row.key ? "Saving…" : "Save"}
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               );
//             })}
//             {mergedRows.length === 0 && (
//               <tr>
//                 <td colSpan={6} className="py-6 text-center text-gray-500">
//                   No items found for this transaction.
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

// src/components/ServiceProgressTable.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const keyOf = (row) =>
  `${row.service_name}|||${row.category_name}|||${row.editing_type_name || ""}`;

export default function ServiceProgressTable({
  baseURL,
  token,
  clientId,
  txnId,
  currentEmployeeId,
}) {
  const [historyRows, setHistoryRows] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  // Fetch history + progress
  useEffect(() => {
    if (!clientId || !txnId) return;
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [histRes, progRes] = await Promise.all([
          axios.get(
            `${baseURL}/auth/api/calculator/getClientServiceHistoryAssign/${clientId}/${txnId}`,
            { headers }
          ),
          axios.get(`${baseURL}/auth/api/calculator/progress/by-txn/${txnId}`, {
            headers,
          }),
        ]);

        const hist = (histRes.data?.data || []).map((r) => ({
          service_name: r.service_name,
          category_name: r.category_name,
          editing_type_name: r.editing_type_name || "",
          planned_qty: parseInt(r.quantity, 10) || 0,
        }));
        setHistoryRows(hist);

        const pm = {};
        (progRes.data?.data || []).forEach((p) => {
          const k = keyOf(p);
          pm[k] = {
            planned_qty: parseInt(p.planned_qty, 10) || 0,
            done_qty: parseInt(p.done_qty, 10) || 0,
          };
        });
        setProgressMap(pm);
      } catch (e) {
        console.error(e);
        Swal.fire("Error", "Failed to load data.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [baseURL, headers, clientId, txnId]);

  const mergedRows = historyRows.map((r) => {
    const k = keyOf(r);
    const pm = progressMap[k] || { planned_qty: r.planned_qty, done_qty: 0 };
    const planned = r.planned_qty;
    const done = Math.min(pm.done_qty, planned);
    return { ...r, key: k, planned_qty: planned, done_qty: done };
  });

  // Save All changes in one go
  const handleSaveAll = async () => {
    try {
      setSaving(true);
      for (const row of mergedRows) {
        const { planned_qty, done_qty } = row;
        await axios.patch(
          `${baseURL}/auth/api/calculator/progress/set-done`,
          {
            client_id: clientId,
            txn_id: txnId,
            service_name: row.service_name,
            category_name: row.category_name,
            editing_type_name: row.editing_type_name || "",
            planned_qty,
            done_qty,
            user_id: currentEmployeeId,
          },
          { headers }
        );
      }
      Swal.fire("Success", "All progress saved successfully.", "success");
    } catch (e) {
      console.error(e);
      Swal.fire("Error", "Failed to save progress.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div className="bg-white rounded-xl shadow border p-4">
      <h3 className="text-lg font-semibold mb-3">Work Progress</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm table-fixed">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">Service</th>
              <th className="py-2 pr-4">Category</th>
              <th className="py-2 pr-4">Planned Qty</th>
              <th className="py-2 pr-4">Done / Complete Qty</th>
              <th className="py-2 pr-4">Remaining</th>
            </tr>
          </thead>
          <tbody>
            {mergedRows.map((row) => {
              const remaining = Math.max(0, row.planned_qty - row.done_qty);
              return (
                <tr key={row.key} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">{row.service_name}</td>
                  <td className="py-2 pr-4">{row.category_name}</td>
                  <td className="py-2 pr-4">{row.planned_qty}</td>
                  <td className="py-2 pr-4">
                    {row.done_qty}
                    {/* <input
                      type="number"
                      min={0}
                      max={row.planned_qty}
                      value={row.done_qty}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10) || 0;
                        setProgressMap((prev) => ({
                          ...prev,
                          [row.key]: {
                            planned_qty: row.planned_qty,
                            done_qty: Math.max(0, Math.min(row.planned_qty, v)),
                          },
                        }));
                      }}
                      className="w-24 px-2 py-1 border rounded"
                    /> */}
                  </td>
                  <td className="py-2 pr-4">{remaining}</td>
                </tr>
              );
            })}
            {mergedRows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-gray-500">
                  No items found for this transaction.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Single Save Button */}
      <div className="mt-4 flex justify-end">
        {/* <button
          onClick={handleSaveAll}
          disabled={saving}
          className="px-6 py-2 bg-green-600 text-white rounded disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save All Changes"}
        </button> */}
      </div>
    </div>
  );
}

// src/components/ServiceProgressTable.jsx
// import React, { useEffect, useMemo, useState, useCallback } from "react";
// import axios from "axios";
// import Swal from "sweetalert2";

// const keyOf = (row) =>
//   `${row.service_name}|||${row.category_name}|||${row.editing_type_name || ""}`;

// export default function ServiceProgressTable({
//   baseURL,
//   token,
//   clientId,
//   txnId,
//   currentEmployeeId,
// }) {
//   const [historyRows, setHistoryRows] = useState([]);
//   const [progressMap, setProgressMap] = useState({}); // key -> { planned_qty, done_qty }
//   const [loading, setLoading] = useState(false);
//   const [savingKey, setSavingKey] = useState(null);

//   const headers = useMemo(
//     () => ({
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${token}`,
//     }),
//     [token]
//   );

//   // Fetch history + existing progress
//   useEffect(() => {
//     if (!clientId || !txnId) return;
//     let isMounted = true;

//     const fetchAll = async () => {
//       try {
//         setLoading(true);
//         const [histRes, progRes] = await Promise.all([
//           axios.get(
//             `${baseURL}/auth/api/calculator/getClientServiceHistory/${clientId}/${txnId}`,
//             { headers }
//           ),
//           axios.get(`${baseURL}/auth/api/calculator/progress/by-txn/${txnId}`, {
//             headers,
//           }),
//         ]);

//         if (!isMounted) return;

//         const hist = (histRes.data?.data || [])
//           // filter out rows without a valid planned qty (optional, but reduces junk)
//           .map((r) => ({
//             service_name: r.service_name,
//             category_name: r.category_name,
//             editing_type_name: r.editing_type_name || "",
//             planned_qty: parseInt(r.quantity, 10) || 0,
//           }))
//           .filter((r) => r.service_name && r.category_name);

//         setHistoryRows(hist);

//         const pm = {};
//         (progRes.data?.data || []).forEach((p) => {
//           const k = keyOf(p);
//           pm[k] = {
//             planned_qty: parseInt(p.planned_qty, 10) || 0,
//             done_qty: parseInt(p.done_qty, 10) || 0,
//           };
//         });
//         setProgressMap(pm);
//       } catch (e) {
//         console.error(e);
//         Swal.fire({
//           icon: "error",
//           title: "Error",
//           text: "Failed to load data.",
//         });
//       } finally {
//         if (isMounted) setLoading(false);
//       }
//     };

//     fetchAll();
//     return () => {
//       isMounted = false;
//     };
//   }, [baseURL, headers, clientId, txnId]);

//   // Build merged rows and inject a stable onLocalChange for each
//   const mergedRows = useMemo(() => {
//     return historyRows.map((r) => {
//       const k = keyOf(r);
//       const pm = progressMap[k] || { planned_qty: r.planned_qty, done_qty: 0 };
//       // Always prefer "planned" from history row
//       const planned = r.planned_qty;
//       const done = Math.min(pm.done_qty, planned);

//       const onLocalChange = (v) => {
//         const n = Math.max(0, Math.min(planned, parseInt(v, 10) || 0));
//         setProgressMap((prev) => ({
//           ...prev,
//           [k]: { planned_qty: planned, done_qty: n },
//         }));
//       };

//       return {
//         ...r,
//         key: k,
//         planned_qty: planned,
//         done_qty: done,
//         onLocalChange,
//       };
//     });
//   }, [historyRows, progressMap]);

//   const setDoneFor = useCallback(
//     async (row, newDone) => {
//       const planned = row.planned_qty;
//       let val = parseInt(newDone, 10);
//       if (isNaN(val)) val = 0;
//       if (val < 0) val = 0;
//       if (val > planned) val = planned;

//       try {
//         setSavingKey(row.key);
//         await axios.patch(
//           `${baseURL}/auth/api/calculator/progress/set-done`,
//           {
//             client_id: clientId,
//             txn_id: txnId,
//             service_name: row.service_name,
//             category_name: row.category_name,
//             editing_type_name: row.editing_type_name || "",
//             planned_qty: planned,
//             done_qty: val,
//             user_id: currentEmployeeId,
//           },
//           { headers }
//         );
//         setProgressMap((prev) => ({
//           ...prev,
//           [row.key]: { planned_qty: planned, done_qty: val },
//         }));
//       } catch (e) {
//         console.error(e);
//         Swal.fire({ icon: "error", title: "Error", text: "Failed to save." });
//       } finally {
//         setSavingKey(null);
//       }
//     },
//     [baseURL, clientId, currentEmployeeId, headers, txnId]
//   );

//   const incDoneFor = useCallback(
//     async (row, delta) => {
//       const planned = row.planned_qty;
//       try {
//         setSavingKey(row.key);
//         await axios.patch(
//           `${baseURL}/auth/api/calculator/progress/increment`,
//           {
//             client_id: clientId,
//             txn_id: txnId,
//             service_name: row.service_name,
//             category_name: row.category_name,
//             editing_type_name: row.editing_type_name || "",
//             planned_qty: planned,
//             delta,
//             user_id: currentEmployeeId,
//           },
//           { headers }
//         );
//         // Optimistic update
//         setProgressMap((prev) => {
//           const current = prev[row.key]?.done_qty ?? 0;
//           const next = Math.max(0, Math.min(planned, current + delta));
//           return {
//             ...prev,
//             [row.key]: { planned_qty: planned, done_qty: next },
//           };
//         });
//       } catch (e) {
//         console.error(e);
//         Swal.fire({ icon: "error", title: "Error", text: "Failed to update." });
//       } finally {
//         setSavingKey(null);
//       }
//     },
//     [baseURL, clientId, currentEmployeeId, headers, txnId]
//   );

//   if (loading) {
//     return (
//       <div className="bg-white rounded-xl shadow border p-4">
//         <h3 className="text-lg font-semibold mb-3">Work Progress</h3>
//         <p className="text-sm text-gray-500">Loading…</p>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-white rounded-xl shadow border p-4">
//       <h3 className="text-lg font-semibold mb-3">Work Progress</h3>
//       <div className="overflow-x-auto">
//         <table className="min-w-full text-sm table-fixed">
//           {/* Lock column widths to prevent reflow on content changes */}
//           <colgroup>
//             <col className="w-[22%]" />
//             <col className="w-[22%]" />
//             <col className="w-[12%]" />
//             <col className="w-[18%]" />
//             <col className="w-[12%]" />
//             <col className="w-[14%]" />
//           </colgroup>
//           <thead>
//             <tr className="text-left border-b">
//               <th className="py-2 pr-4">Service</th>
//               <th className="py-2 pr-4">Category</th>
//               <th className="py-2 pr-4">Planned Qty</th>
//               <th className="py-2 pr-4">Done / Complete Qty</th>
//               <th className="py-2 pr-4">Remaining</th>
//               <th className="py-2 pr-4">Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {mergedRows.map((row) => (
//               <Row
//                 key={row.key}
//                 row={row}
//                 savingKey={savingKey}
//                 setDoneFor={setDoneFor}
//                 incDoneFor={incDoneFor}
//               />
//             ))}

//             {mergedRows.length === 0 && (
//               <tr>
//                 <td colSpan={6} className="py-6 text-center text-gray-500">
//                   No items found for this transaction.
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

// const Row = React.memo(function Row({
//   row,
//   savingKey,
//   setDoneFor,
//   incDoneFor,
// }) {
//   const remaining = Math.max(0, row.planned_qty - row.done_qty);
//   const isSaving = savingKey === row.key;

//   return (
//     <tr className="border-b last:border-0">
//       <td className="py-2 pr-4 font-medium">{row.service_name}</td>
//       <td className="py-2 pr-4">{row.category_name}</td>
//       <td className="py-2 pr-4">{row.planned_qty}</td>
//       <td className="py-2 pr-4">
//         <input
//           type="number"
//           min={0}
//           max={row.planned_qty}
//           value={row.done_qty}
//           onChange={(e) => row.onLocalChange(e.target.value)}
//           onBlur={(e) => setDoneFor(row, e.target.value)}
//           className="w-24 px-2 py-1 border rounded"
//           disabled={isSaving}
//         />
//       </td>
//       <td className="py-2 pr-4">{remaining}</td>
//       <td className="py-2 pr-4">
//         <div className="flex gap-2">
//           <button
//             onClick={() => incDoneFor(row, -1)}
//             disabled={isSaving || row.done_qty <= 0}
//             className="px-2 py-1 border rounded disabled:opacity-50"
//             type="button"
//           >
//             -1
//           </button>
//           <button
//             onClick={() => incDoneFor(row, +1)}
//             disabled={isSaving || row.done_qty >= row.planned_qty}
//             className="px-2 py-1 border rounded disabled:opacity-50"
//             type="button"
//           >
//             +1
//           </button>

//           {/* Fixed width so "Save" ↔ "Saving…" doesn't shift layout */}
//           <button
//             onClick={() => setDoneFor(row, row.done_qty)}
//             disabled={isSaving}
//             className="relative w-24 px-3 py-1 bg-green-600 text-white rounded disabled:opacity-50"
//             type="button"
//           >
//             <span className={isSaving ? "opacity-0" : "opacity-100"}>Save</span>
//             {isSaving && (
//               <span className="absolute inset-0 grid place-items-center">
//                 Saving…
//               </span>
//             )}
//           </button>
//         </div>
//       </td>
//     </tr>
//   );
// });
