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
  IndianRupee,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../redux/user/userSlice";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/apiBaseUrl";

const DiscountSetting = () => {
   const baseURL = API_BASE_URL;
const dispatch = useDispatch();
  const { currentUser, token } = useSelector((state) => state.user);
  const userName = currentUser?.name;
  const { id, proposalId } = useParams();
  const [selectedPercent, setSelectedPercent] = useState("");
  const [selectedAmount, setSelectedAmount] = useState("");
  const [getData, setGetData] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  console.log(id, proposalId);
  const [editId, setEditId] = useState(null);

  const fetchData = async () => {
    try {
      const { data } = await axios.get(
        `${baseURL}/auth/api/re_calculator/getDiscountSetting`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(data.data);
      setGetData(data.data[0]);
    } catch (error) {
      console.log(error);
      if (error.response && error.response.status === 401) {
        // Token is invalid or expired
        Swal.fire({
          title: "Session Expired",
          text: "Please login again.",
          icon: "warning",
          showConfirmButton: false,
          timer: 1000,
          // timerProgressBar: true,
        }).then(() => {
          dispatch(clearUser());
          localStorage.removeItem("token");
          navigate("/");
        });
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (entry) => {
    setEditId(entry.id);
    setSelectedPercent(entry.discount_per);
    setSelectedAmount(entry.discount_amt);
  };

  const handleSave = () => {
    setLoading(true);
    console.log(selectedPercent);

    if (!selectedPercent || !selectedAmount) {
      Swal.fire({
        icon: "warning", // use "warning" instead of "alert"
        title: "Both Filed required",
        text: "Please enter a both data",
        showConfirmButton: false,
        timer: 1000,
        // timerProgressBar: true,
      });
      setLoading(false); // stop loader
      return; // prevent saving
    }

    const payload = {
      discount_per: selectedPercent,
      discount_amt: selectedAmount,
    };

    const request = editId
      ? axios.put(
          `${baseURL}/auth/api/re_calculator/updateDiscountSettingDataById/${editId}`,
          payload
        )
      : axios.post(
          `${baseURL}/auth/api/re_calculator/saveDiscountSetting`,
          payload
        );

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
          setSelectedPercent("");
          setSelectedAmount("");
        }
      })
      .catch((err) => {
        setLoading(false);
        console.error("Save error:", err);
      });
  };

  const resetForm = () => {
    setSelectedPercent("");
    setSelectedAmount("");
  };

  console.log(getData);

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
        `${baseURL}/auth/api/re_calculator/deleteDiscountSettingById/${entryId}`
      );

      const result = res.data;

      if (result.status === "Success") {
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Entry has been deleted.",
          showConfirmButton: false,
          timer: 1000,
          // timerProgressBar: true,
        });
        setGetData("");
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
      console.error("Error deleting entry:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while deleting entry.",
        showConfirmButton: false,
        timer: 1000,
        // timerProgressBar: true,
      });
    }
  };

  return (
    <>
      <div className="w-full flex items-center justify-center text-gray-900 dark:text-white transition-colors">
        <div className="w-full max-w-2xl bg-white/90 dark:bg-slate-900/60 border border-gray-200 dark:border-white/10 rounded-2xl p-4 sm:p-7 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>🏷️</span> Global Discount Limits
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                Configure maximum discount percentage and maximum discount amount for proformas.
              </p>
            </div>
            {id && (
              <button
                onClick={() => navigate(-1)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition"
              >
                ← Go Back
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Max Discount (%)</label>
              <input
                type="number"
                className="w-full p-2.5 border border-gray-200 dark:border-white/15 rounded-xl bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors text-sm"
                value={selectedPercent}
                onChange={(e) => {
                  setSelectedPercent(e.target.value);
                }}
                placeholder="e.g. 15 (%)"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Max Discount Amount (₹)</label>
              <input
                type="number"
                className="w-full p-2.5 border border-gray-200 dark:border-white/15 rounded-xl bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors text-sm"
                value={selectedAmount}
                onChange={(e) => {
                  setSelectedAmount(e.target.value);
                }}
                placeholder="e.g. 5000 (₹)"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              className={`flex-1 font-semibold py-2.5 px-4 rounded-xl text-sm text-white shadow-md transition-all 
                ${
                  editId
                    ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-orange-500/20"
                    : getData
                    ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-60"
                    : "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-orange-500/20"
                }`}
              onClick={handleSave}
              disabled={!editId && Boolean(getData)}
            >
              {loading ? "Saving..." : editId ? "Update Discount Limits" : "Set Discount Limits"}
            </button>

            <button
              className="sm:w-auto px-5 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-700 dark:text-slate-200 font-semibold py-2.5 rounded-xl border border-gray-200 dark:border-white/10 transition-colors text-sm"
              onClick={resetForm}
            >
              Reset
            </button>
          </div>

          {/* Current Setting Preview */}
          <div className="border-t border-gray-100 dark:border-white/10 pt-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-500" />
              Active Discount Configuration
            </h3>
            {getData ? (
              <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="grid grid-cols-2 gap-4 flex-1">
                    <div className="rounded-lg bg-white dark:bg-white/5 p-3 border border-gray-200/80 dark:border-transparent">
                      <p className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Max Percentage</p>
                      <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">{getData.discount_per}%</p>
                    </div>
                    <div className="rounded-lg bg-white dark:bg-white/5 p-3 border border-gray-200/80 dark:border-transparent">
                      <p className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Max Amount Limit</p>
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center">
                        <IndianRupee className="w-4 h-4 mr-0.5" />
                        {getData.discount_amt}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleEdit(getData)}
                      className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/20 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors"
                      title="Edit"
                    >
                      ✎ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(getData.id)}
                      className="inline-flex items-center gap-1 bg-red-50 dark:bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-500/20 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors"
                      title="Delete"
                    >
                      × Delete
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-gray-400 dark:text-slate-400 border border-dashed border-gray-200 dark:border-white/10 rounded-xl">
                No active discount limits configured. Please set a maximum percentage and amount above.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DiscountSetting;
