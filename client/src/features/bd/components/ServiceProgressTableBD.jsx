import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const keyOf = (row) =>
  `${row.service_name}|||${row.category_name}|||${row.editing_type_name || ""}`;

export default function ServiceProgressTableBD({
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

  useEffect(() => {
    if (!clientId || !txnId) return;
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [histRes, progRes] = await Promise.all([
          axios.get(
            `${baseURL}/auth/api/re_calculator/getClientServiceHistoryAssign/${clientId}/${txnId}`,
            { headers }
          ),
          axios.get(`${baseURL}/auth/api/re_calculator/progress/by-txn/${txnId}`, {
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

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      for (const row of mergedRows) {
        const { planned_qty, done_qty } = row;
        await axios.patch(
          `${baseURL}/auth/api/re_calculator/progress/set-done`,
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
                    <input
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
                    />
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

      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="px-6 py-2 bg-green-600 text-white rounded disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save All Changes"}
        </button>
      </div>
    </div>
  );
}
