import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useParams } from "react-router-dom";
import {
  Palette,
  Megaphone,
  Search,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Eye,
  ArrowLeft,
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  List,
  ListCheckIcon,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../redux/user/userSlice";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/apiBaseUrl";

const NoteSection = () => {
   const baseURL = API_BASE_URL;
const dispatch = useDispatch();
  const { currentUser, token } = useSelector((state) => state.user);
  const { id, proposalId } = useParams();
  const [selectedNote, setSelectedNote] = useState("");
  const [getData, setGetData] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  console.log(id, proposalId);
  const [editId, setEditId] = useState(null);

  const [selectedBalanceNote, setSelectedBalanceNote] = useState("");
  const [balanceData, setBalanceData] = useState([]);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [editBalanceId, setEditBalanceId] = useState(null);
  const handleEdit = (entry) => {
    setEditId(entry.id);
    setSelectedNote(entry.note_text);
  };

  const handleSave = () => {
    setLoading(true);
    console.log(selectedNote);

    if (!selectedNote) {
      Swal.fire({
        icon: "warning", // use "warning" instead of "alert"
        title: "Note Text required",
        text: "Please enter a Note Text",
        showConfirmButton: false,
        timer: 1000,
        // timerProgressBar: true,
      });
      setLoading(false); // stop loader
      return; // prevent saving
    }

    const payload = {
      note_text: selectedNote,
    };

    const request = editId
      ? axios.put(
          `${baseURL}/auth/api/re_calculator/updateNoteDataById/${editId}`,
          payload
        )
      : axios.post(`${baseURL}/auth/api/re_calculator/saveNotesData`, payload);

    request
      .then((res) => {
        resetForm();
        if (res.data.status === "Success") {
          Swal.fire({
            icon: "success",
            title: editId ? "Updated!" : "Saved!",
            text: editId ? "Entry updated successfully" : "Saved successfully",
            showConfirmButton: false,
            timer: 1000,
            // timerProgressBar: true,
          });
          setEditId("");
          fetchData();
          setLoading(false);
          setSelectedNote("");
        }
      })
      .catch((err) => {
        setLoading(false);
        console.error("Save error:", err);
      });
  };

  const resetForm = () => {
    setSelectedNote("");
    setEditId(null);
  };

  const handleEditBalance = (entry) => {
    setEditBalanceId(entry.id);
    setSelectedBalanceNote(entry.note_text);
  };

  const handleSaveBalance = () => {
    setLoadingBalance(true);

    if (!selectedBalanceNote) {
      Swal.fire({
        icon: "warning",
        title: "Note Text required",
        text: "Please enter a Note Text",
        showConfirmButton: false,
        timer: 1000,
      });
      setLoadingBalance(false);
      return;
    }

    const payload = {
      note_text: selectedBalanceNote,
    };

    const request = editBalanceId
      ? axios.put(
          `${baseURL}/auth/api/re_calculator/updateNotesbydefaultById/${editBalanceId}`,
          payload
        )
      : axios.post(`${baseURL}/auth/api/re_calculator/saveNotesbydefault`, payload);

    request
      .then((res) => {
        resetBalanceForm();
        if (res.data.status === "Success") {
          Swal.fire({
            icon: "success",
            title: editBalanceId ? "Updated!" : "Saved!",
            text: editBalanceId ? "Entry updated successfully" : "Saved successfully",
            showConfirmButton: false,
            timer: 1000,
          });
          setEditBalanceId(null);
          fetchBalanceData();
          setLoadingBalance(false);
          setSelectedBalanceNote("");
        }
      })
      .catch((err) => {
        setLoadingBalance(false);
        console.error("Save error:", err);
      });
  };

  const resetBalanceForm = () => {
    setSelectedBalanceNote("");
    setEditBalanceId(null);
  };

  const fetchData = async () => {
    try {
      const { data } = await axios.get(
        `${baseURL}/auth/api/re_calculator/getNoteData`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(data.data);
      setGetData(data.data);
    } catch (error) {
      console.log(error);
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
    }
  };

  const fetchBalanceData = async () => {
    try {
      const { data } = await axios.get(
        `${baseURL}/auth/api/re_calculator/getNotesbydefault`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setBalanceData(data.data || []);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchBalanceData();
  }, []);

  const handleDelete = async (entryId) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this entry?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48", // red
      cancelButtonColor: "#6b7280", // gray
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await axios.delete(
        `${baseURL}/auth/api/re_calculator/deleteNoteById/${entryId}`
      );

      const result = res.data;

      if (result.status === "Success") {
        setGetData((prev) => prev.filter((item) => item.id !== entryId));

        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Entry has been deleted.",
          showConfirmButton: false,
          timer: 1000,
          // timerProgressBar: true,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed!",
          text: result.message || "Failed to delete entry.",
          showConfirmButton: false,
          timer: 1000,
          // timerProgressBar: true,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while deleting entry.",
        showConfirmButton: false,
        timer: 1000,
      });
    }
  };

  const handleDeleteBalance = async (entryId) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this entry?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await axios.delete(
        `${baseURL}/auth/api/re_calculator/deleteNotesbydefaultById/${entryId}`
      );

      const result = res.data;

      if (result.status === "Success") {
        setBalanceData((prev) => prev.filter((item) => item.id !== entryId));

        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Entry has been deleted.",
          showConfirmButton: false,
          timer: 1000,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed!",
          text: result.message || "Failed to delete entry.",
          showConfirmButton: false,
          timer: 1000,
        });
      }
    } catch (error) {
      console.error("Error deleting entry:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while deleting entry.",
        showConfirmButton: false,
        timer: 1000,
      });
    }
  };

  return (
    <>
      <div className="w-full flex flex-col lg:flex-row gap-6 items-start justify-center text-gray-900 dark:text-white transition-colors">
        {/* Note Section 1 */}
        <div className="w-full lg:flex-1 max-w-xl bg-white/90 dark:bg-slate-900/60 border border-gray-200 dark:border-white/10 rounded-2xl p-4 sm:p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-3">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>📋</span> Standard Notes
            </h2>
            {id && (
              <button
                onClick={() => navigate(-1)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition"
              >
                ← Go Back
              </button>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Note Name / Content</label>
            <input
              className="w-full p-2.5 border border-gray-200 dark:border-white/15 rounded-xl bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors text-sm"
              value={selectedNote}
              onChange={(e) => {
                setSelectedNote(e.target.value);
              }}
              placeholder="Enter standard quotation note text..."
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-orange-500/20 transition-all hover:opacity-95 text-sm"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? "Saving..." : editId ? "Update Note" : "Create Note"}
            </button>
            <button
              className="sm:w-auto px-4 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-700 dark:text-slate-200 font-semibold py-2.5 rounded-xl border border-gray-200 dark:border-white/10 transition-colors text-sm"
              onClick={resetForm}
            >
              Reset
            </button>
          </div>

          <div className="border-t border-gray-100 dark:border-white/10 pt-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-500" />
              Existing Notes ({getData.length})
            </h3>
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {getData.map((order) => (
                <div
                  key={order.id}
                  className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200/80 dark:border-white/10 hover:bg-gray-100/70 dark:hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3 text-gray-900 dark:text-white">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="font-medium text-sm text-gray-800 dark:text-slate-200 break-words">
                        {order.note_text}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleEdit(order)}
                        className="bg-amber-50 dark:bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/20 rounded-lg w-8 h-8 flex items-center justify-center text-xs font-bold transition-colors"
                        title="Edit"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => handleDelete(order.id)}
                        className="bg-red-50 dark:bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg w-8 h-8 flex items-center justify-center text-xs font-bold transition-colors"
                        title="Delete"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {getData.length === 0 && (
                <p className="text-center py-6 text-xs text-gray-400 dark:text-slate-400">
                  No standard notes configured.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Note Section 2: Balance Proforma Notes */}
        <div className="w-full lg:flex-1 max-w-xl bg-white/90 dark:bg-slate-900/60 border border-gray-200 dark:border-white/10 rounded-2xl p-4 sm:p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-3">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>⚖️</span> Balance Proforma Notes
            </h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Note Name / Content</label>
            <input
              className="w-full p-2.5 border border-gray-200 dark:border-white/15 rounded-xl bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors text-sm"
              value={selectedBalanceNote}
              onChange={(e) => {
                setSelectedBalanceNote(e.target.value);
              }}
              placeholder="Enter balance proforma note text..."
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-orange-500/20 transition-all hover:opacity-95 text-sm"
              onClick={handleSaveBalance}
              disabled={loadingBalance}
            >
              {loadingBalance ? "Saving..." : editBalanceId ? "Update Note" : "Create Note"}
            </button>
            <button
              className="sm:w-auto px-4 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-700 dark:text-slate-200 font-semibold py-2.5 rounded-xl border border-gray-200 dark:border-white/10 transition-colors text-sm"
              onClick={resetBalanceForm}
            >
              Reset
            </button>
          </div>

          <div className="border-t border-gray-100 dark:border-white/10 pt-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-500" />
              Existing Balance Notes ({balanceData.length})
            </h3>
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {balanceData.map((order) => (
                <div
                  key={order.id}
                  className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200/80 dark:border-white/10 hover:bg-gray-100/70 dark:hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3 text-gray-900 dark:text-white">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="font-medium text-sm text-gray-800 dark:text-slate-200 break-words">
                        {order.note_text}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleEditBalance(order)}
                        className="bg-amber-50 dark:bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/20 rounded-lg w-8 h-8 flex items-center justify-center text-xs font-bold transition-colors"
                        title="Edit"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => handleDeleteBalance(order.id)}
                        className="bg-red-50 dark:bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg w-8 h-8 flex items-center justify-center text-xs font-bold transition-colors"
                        title="Delete"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {balanceData.length === 0 && (
                <p className="text-center py-6 text-xs text-gray-400 dark:text-slate-400">
                  No balance notes configured.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NoteSection;
