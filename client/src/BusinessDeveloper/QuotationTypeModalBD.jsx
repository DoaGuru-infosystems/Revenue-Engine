// src/components/QuotationAssignModal.jsx
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function QuotationTypeModalBD({
  open,
  onClose,
  clientId,
  txnId,
  baseURL,
  token,
  onDone,
}) {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [existing, setExisting] = useState(null);
  const [checking, setChecking] = useState(false);

  // Guard: if opened without IDs, warn + close
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

  // Fetch BD users when modal opens
  useEffect(() => {
    if (!open) return;
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const res = await axios.get(
          `${baseURL}/auth/api/calculator/retrieveUser`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (res.data?.status === "Success") {
          setUsers(res.data.data || []);
        } else {
          setUsers([]);
        }
      } catch (err) {
        console.error("retrieveUser error:", err);
        if (err?.response?.status === 404) {
          Swal.fire({
            icon: "info",
            title: "No Users",
            text: "No BD users found to assign.",
          });
        } else if (err?.response?.status === 401) {
          Swal.fire({
            icon: "warning",
            title: "Session Expired",
            text: "Please login again.",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to load users.",
          });
        }
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, [open, baseURL, token]);

  useEffect(() => {
    if (!open) return;
    const checkExisting = async () => {
      try {
        setChecking(true);
        const res = await axios.get(
          `${baseURL}/auth/api/calculator/getAssignmentByTxn/${txnId}`,
          { headers }
        );
        if (res.data?.status === "Success") {
          setExisting(res.data.data);
          setSelectedUser(String(res.data.data.user_id || ""));
        } else {
          setExisting(null);
          setSelectedUser("");
        }
      } catch (err) {
        if (err?.response?.status === 404) {
          // not assigned yet
          setExisting(null);
          setSelectedUser("");
        } else if (err?.response?.status === 401) {
          Swal.fire({
            icon: "warning",
            title: "Session Expired",
            text: "Please login again.",
          });
        } else {
          console.error("getAssignmentByTxn error:", err);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to check assignment.",
          });
        }
      } finally {
        setChecking(false);
      }
    };
    checkExisting();
  }, [open, baseURL, headers, txnId]);

  const currentAssigneeName = useMemo(() => {
    if (!existing?.user_id) return null;
    const m = users.find((u) => Number(u.id) === Number(existing.user_id));
    return m?.employee_name || existing.employee_name || `#${existing.user_id}`;
  }, [existing, users]);

  const isReassign = !!existing?.user_id;
  const submitBtnText = isReassign ? "Update" : "Assign";

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

    // If already assigned and no change in user, do nothing
    if (isReassign && Number(selectedUser) === Number(existing.user_id)) {
      Swal.fire({
        icon: "info",
        title: "No Change",
        text: "Already assigned to this user.",
      });
      return;
    }

    // Optional confirm when changing assignee
    if (isReassign && Number(selectedUser) !== Number(existing.user_id)) {
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
      setSubmitting(true);

      if (!isReassign) {
        // First time assign
        await axios.post(
          `${baseURL}/auth/api/calculator/assignQuotation`,
          { client_id: clientId, txn_id: txnId, user_id: Number(selectedUser) },
          { headers }
        );
      } else {
        // Update existing assignment
        await axios.put(
          `${baseURL}/auth/api/calculator/reassignQuotation`,
          { txn_id: txnId, user_id: Number(selectedUser) },
          { headers }
        );
      }

      Swal.fire({
        icon: "success",
        title: isReassign ? "Updated" : "Assigned",
        text: isReassign
          ? "Quotation re-assigned successfully."
          : "Quotation assigned successfully.",
        timer: 1500,
        showConfirmButton: false,
      });

      onClose?.();
      onDone?.(); // parent refresh if provided
    } catch (err) {
      console.error("assign/reassign error:", err);
      Swal.fire({ icon: "error", title: "Error", text: "Operation failed." });
    } finally {
      setSubmitting(false);
    }
  };

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

        {checking ? (
          <p className="text-center text-sm text-gray-500 mb-3">
            Checking assignment…
          </p>
        ) : isReassign ? (
          <p className="text-center text-xs text-amber-600 mb-3">
            Currently assigned to <b>{currentAssigneeName}</b>
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Assign to BD User
          </label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            disabled={loadingUsers || checking}
            className="w-full px-3 py-2 border rounded-lg bg-white"
          >
            <option value="">
              {loadingUsers ? "Loading users..." : "Select a user"}
            </option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.employee_name} (#{u.id})
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={submitting || loadingUsers || checking}
            className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-70"
          >
            {submitting
              ? isReassign
                ? "Updating..."
                : "Assigning..."
              : submitBtnText}
          </button>
        </form>
      </div>
    </div>
  );
}
