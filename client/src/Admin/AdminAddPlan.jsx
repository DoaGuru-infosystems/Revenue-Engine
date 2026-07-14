import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { FileText, List, Pencil, RotateCcw, Save, Search, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../redux/user/userSlice";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/apiBaseUrl";

const inputClassName =
  "w-full rounded-xl border border-white/15 bg-slate-900/60 px-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30";

const AdminAddPlan = () => {
  const baseURL = API_BASE_URL;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.user);

  const [selectedPlan, setSelectedPlan] = useState("");
  const [getData, setGetData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchText, setSearchText] = useState("");

  const handleUnauthorized = () => {
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
  };

  const resetForm = () => {
    setSelectedPlan("");
    setEditId(null);
  };

  const fetchData = async () => {
    try {
      const response = await axios.get(`${baseURL}/auth/api/calculator/getAllPlanDetails`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      setGetData(response.data?.data || []);
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      Swal.fire({
        icon: "error",
        title: "Fetch Failed",
        text: "Unable to fetch plan details.",
        showConfirmButton: false,
        timer: 1200,
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    const planName = selectedPlan.trim();
    if (!planName) {
      Swal.fire({
        icon: "warning",
        title: "Plan Name Required",
        text: "Please enter a plan name before saving.",
        showConfirmButton: false,
        timer: 1100,
      });
      return;
    }

    setLoading(true);
    try {
      const payload = { plan_name: planName };

      const res = editId
        ? await axios.put(`${baseURL}/auth/api/calculator/updatePlanName/${editId}`, payload, {
            headers: { Authorization: `Bearer ${token}` },
          })
        : await axios.post(
            `${baseURL}/auth/api/calculator/saveCalculatorDataofplanDetail`,
            payload,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

      if (res.data.status === "Success") {
        Swal.fire({
          icon: "success",
          title: editId ? "Plan Updated" : "Plan Created",
          text: editId ? "Plan updated successfully." : "Plan created successfully.",
          showConfirmButton: false,
          timer: 1000,
        });

        const insertedPlanId = res.data.insertId;
        await fetchData();
        resetForm();

        if (!editId && insertedPlanId) {
          navigate(`/admin/plan-details/${insertedPlanId}`);
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: res.data.message || "Unable to save plan.",
          showConfirmButton: false,
          timer: 1200,
        });
      }
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Something went wrong while saving.",
        showConfirmButton: false,
        timer: 1200,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry) => {
    setEditId(entry.id);
    setSelectedPlan(entry.plan_name || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (entryId) => {
    const confirm = await Swal.fire({
      title: "Delete this plan?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#475569",
      confirmButtonText: "Delete",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await axios.delete(
        `${baseURL}/auth/api/calculator/deletePlanNameDetail/${entryId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.status === "Success") {
        setGetData((prev) => prev.filter((item) => item.id !== entryId));
        Swal.fire({
          icon: "success",
          title: "Deleted",
          text: "Plan deleted successfully.",
          showConfirmButton: false,
          timer: 1000,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: res.data.message || "Could not delete this plan.",
          showConfirmButton: false,
          timer: 1200,
        });
      }
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text: error.response?.data?.message || "An error occurred while deleting.",
        showConfirmButton: false,
        timer: 1200,
      });
    }
  };

  const filteredPlans = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return getData;
    return getData.filter((item) => {
      return (
        item.plan_name?.toLowerCase().includes(keyword) ||
        item.category_name?.toLowerCase().includes(keyword) ||
        String(item.id).includes(keyword)
      );
    });
  }, [getData, searchText]);

  const uniquePlansCount = useMemo(() => {
    return new Set(getData.map((item) => item.plan_name).filter(Boolean)).size;
  }, [getData]);

  return (
    <div className="space-y-6 text-white">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900/85 via-slate-800/70 to-orange-900/60 p-4 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-orange-300/90">Plan Manager</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Create & Maintain Plans</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Add new plans, rename existing ones, and quickly open plan details for service mapping.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 md:w-auto">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase text-slate-400">Rows</p>
              <p className="mt-1 text-xl font-semibold">{getData.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase text-slate-400">Unique Plans</p>
              <p className="mt-1 text-xl font-semibold">{uniquePlansCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase text-slate-400">Editing</p>
              <p className="mt-1 text-xl font-semibold">{editId ? "Yes" : "No"}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900/55 p-4 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <List className="h-5 w-5 text-orange-300" />
          <h3 className="text-lg font-semibold">{editId ? "Edit Plan" : "Add New Plan"}</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
          <input
            className={inputClassName}
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            placeholder="Enter plan name"
          />

          <button
            onClick={handleSave}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {loading ? "Saving..." : editId ? "Update Plan" : "Create Plan"}
          </button>

          <button
            onClick={resetForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900/55 p-4 sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-orange-300" />
            <h3 className="text-lg font-semibold">Available Plans</h3>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search plan name or category"
              className="w-full rounded-xl border border-white/15 bg-slate-900/70 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
            />
          </div>
        </div>

        {filteredPlans.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/35 px-4 py-10 text-center text-slate-300">
            No plans found.
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-sm">
                <thead className="bg-white/5 text-slate-300">
                  <tr>
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Plan Name</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Created At</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredPlans.map((order, index) => (
                    <tr key={order.id} className="hover:bg-white/5">
                      <td className="px-4 py-3 text-slate-300">{index + 1}</td>
                      <td className="px-4 py-3 font-semibold text-white">{order.plan_name}</td>
                      <td className="px-4 py-3 text-slate-300">
                        {order.category_name || "Not assigned"}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{order.created_at || "-"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(order)}
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(order.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/20"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                          <button
                            onClick={() => navigate(`/admin/plan-details/${order.id}`)}
                            className="rounded-lg border border-orange-300/40 bg-orange-500/10 px-3 py-1.5 text-xs font-semibold text-orange-200 hover:bg-orange-500/20"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 md:hidden">
              {filteredPlans.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border border-white/10 bg-slate-900/60 p-4"
                >
                  <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Plan Name</p>
                  <p className="mt-1 text-base font-semibold text-white">{order.plan_name}</p>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-lg bg-white/5 p-2.5">
                      <p className="text-slate-400">Category</p>
                      <p className="mt-1 text-sm text-white">{order.category_name || "-"}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-2.5">
                      <p className="text-slate-400">Created</p>
                      <p className="mt-1 text-sm text-white">{order.created_at || "-"}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleEdit(order)}
                      className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(order.id)}
                      className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => navigate(`/admin/plan-details/${order.id}`)}
                      className="rounded-lg border border-orange-300/40 bg-orange-500/10 px-3 py-2 text-xs font-semibold text-orange-200"
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default AdminAddPlan;
