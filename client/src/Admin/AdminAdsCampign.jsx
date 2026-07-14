import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  Edit,
  Layers,
  Megaphone,
  Percent,
  Search,
  Trash2,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../redux/user/userSlice";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/apiBaseUrl";

const inputClassName =
  "w-full rounded-xl border border-white/15 bg-slate-900/60 px-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30";

const AdminAdsCampign = () => {
  const baseURL = API_BASE_URL;
  const [formData, setFormData] = useState({
    ads_category: "",
    amt_range_start: "",
    amt_range_end: "",
    percentage: "",
  });
  const [adsList, setAdsList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const { token } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleUnauthorized = () => {
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
  };

  const resetForm = () => {
    setFormData({
      ads_category: "",
      amt_range_start: "",
      amt_range_end: "",
      percentage: "",
    });
    setEditingId(null);
  };

  const fetchAds = async () => {
    try {
      const res = await axios.get(`${baseURL}/auth/api/calculator/getAdsServices`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.status === "Success") {
        setAdsList(res.data.data || []);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      Swal.fire({
        icon: "error",
        title: "Fetch Failed",
        text: "Unable to load ads campaign services.",
        showConfirmButton: false,
        timer: 1200,
      });
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.ads_category.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Category Required",
        text: "Please enter ads category name.",
        showConfirmButton: false,
        timer: 1100,
      });
      return;
    }

    const startAmount = Number(formData.amt_range_start);
    const percentageAmount = Number(formData.percentage);

    if (!Number.isFinite(startAmount) || startAmount < 0) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Amount",
        text: "Amount range start should be a valid number.",
        showConfirmButton: false,
        timer: 1200,
      });
      return;
    }

    if (!Number.isFinite(percentageAmount) || percentageAmount < 0) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Percentage",
        text: "Percentage should be a valid positive number.",
        showConfirmButton: false,
        timer: 1200,
      });
      return;
    }

    const url = editingId
      ? `${baseURL}/auth/api/calculator/updateAdsServices/${editingId}`
      : `${baseURL}/auth/api/calculator/insertAdsServices`;

    try {
      const res = await axios({
        method: editingId ? "put" : "post",
        url,
        data: formData,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.status === "Success") {
        Swal.fire({
          icon: "success",
          title: editingId ? "Service Updated" : "Service Added",
          text: res.data.message,
          showConfirmButton: false,
          timer: 1000,
        });
        resetForm();
        fetchAds();
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: res.data.message || "Something went wrong",
          showConfirmButton: false,
          timer: 1100,
        });
      }
    } catch (err) {
      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || "Unable to save ads service.",
        showConfirmButton: false,
        timer: 1200,
      });
    }
  };

  const handleEdit = (item) => {
    setFormData({
      ads_category: item.ads_category || "",
      amt_range_start: item.amt_range_start ?? "",
      amt_range_end: item.amt_range_end ?? "",
      percentage: item.percentage ?? "",
    });
    setEditingId(item.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete this ads service?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#475569",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await axios.delete(`${baseURL}/auth/api/calculator/ads/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.status === "Success") {
        Swal.fire({
          icon: "success",
          title: "Deleted",
          text: "Ads service deleted successfully.",
          showConfirmButton: false,
          timer: 1000,
        });
        fetchAds();
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: res.data.message || "Unable to delete ads service.",
          showConfirmButton: false,
          timer: 1200,
        });
      }
    } catch (err) {
      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text: err.response?.data?.message || "Something went wrong.",
        showConfirmButton: false,
        timer: 1200,
      });
    }
  };

  const filteredAdsList = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return adsList;
    return adsList.filter((item) => {
      return (
        item.ads_category?.toLowerCase().includes(keyword) ||
        String(item.amt_range_start ?? "").toLowerCase().includes(keyword) ||
        String(item.amt_range_end ?? "").toLowerCase().includes(keyword) ||
        String(item.percentage ?? "").toLowerCase().includes(keyword)
      );
    });
  }, [adsList, searchText]);

  const stats = useMemo(() => {
    const avgPercentage =
      adsList.length > 0
        ? (
            adsList.reduce((sum, item) => sum + Number(item.percentage || 0), 0) /
            adsList.length
          ).toFixed(1)
        : "0.0";

    const uniqueCategories = new Set(
      adsList.map((item) => item.ads_category).filter(Boolean)
    ).size;

    return {
      totalRows: adsList.length,
      uniqueCategories,
      avgPercentage,
    };
  }, [adsList]);

  return (
    <div className="space-y-6 text-white">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900/85 via-slate-800/70 to-amber-900/60 p-4 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-300/80">
              Dashboard Module
            </p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Ads Campaign Services</h2>
            <p className="mt-2 text-sm text-slate-300">
              Manage campaign slabs, percentage rules, and keep pricing structured for sales
              teams.
            </p>
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-3 md:w-auto">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-xs uppercase text-slate-400">Services</div>
              <div className="mt-1 text-xl font-semibold">{stats.totalRows}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-xs uppercase text-slate-400">Categories</div>
              <div className="mt-1 text-xl font-semibold">{stats.uniqueCategories}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-xs uppercase text-slate-400">Avg. %</div>
              <div className="mt-1 text-xl font-semibold">{stats.avgPercentage}%</div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900/55 p-4 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-amber-300" />
          <h3 className="text-lg font-semibold">
            {editingId ? "Update Campaign Service" : "Add Campaign Service"}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-slate-300">Ads Category</label>
            <input
              type="text"
              name="ads_category"
              placeholder="Google Ads, Meta Ads"
              value={formData.ads_category}
              onChange={handleChange}
              className={inputClassName}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-300">Amount Range Start</label>
            <input
              type="number"
              name="amt_range_start"
              placeholder="0"
              value={formData.amt_range_start}
              onChange={handleChange}
              className={inputClassName}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-300">Amount Range End</label>
            <input
              type="text"
              name="amt_range_end"
              placeholder="10000 or Above"
              value={formData.amt_range_end}
              onChange={handleChange}
              className={inputClassName}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-300">Percentage (%)</label>
            <input
              type="number"
              name="percentage"
              placeholder="15"
              value={formData.percentage}
              onChange={handleChange}
              className={inputClassName}
            />
          </div>

          <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Percent className="h-4 w-4" />
              {editingId ? "Update Service" : "Save Service"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900/55 p-4 sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-amber-300" />
            <h3 className="text-lg font-semibold">Existing Ads Services</h3>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search category or range"
              className="w-full rounded-xl border border-white/15 bg-slate-900/70 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
            />
          </div>
        </div>

        {filteredAdsList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/35 px-4 py-10 text-center text-slate-300">
            No ads services found for the current filter.
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-sm">
                <thead className="bg-white/5 text-slate-300">
                  <tr>
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Range Start</th>
                    <th className="px-4 py-3 text-left">Range End</th>
                    <th className="px-4 py-3 text-left">Percentage</th>
                    <th className="px-4 py-3 text-left">Created At</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredAdsList.map((item, index) => (
                    <tr key={item.id} className="hover:bg-white/5">
                      <td className="px-4 py-3 text-slate-300">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-white">{item.ads_category}</td>
                      <td className="px-4 py-3 text-slate-300">{item.amt_range_start}</td>
                      <td className="px-4 py-3 text-slate-300">{item.amt_range_end}</td>
                      <td className="px-4 py-3 text-amber-300">{item.percentage}%</td>
                      <td className="px-4 py-3 text-slate-400">{item.created_at}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/20"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 md:hidden">
              {filteredAdsList.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-white/10 bg-slate-900/60 p-4"
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.15em] text-slate-400">
                        Service {index + 1}
                      </p>
                      <p className="text-base font-semibold text-white">{item.ads_category}</p>
                    </div>
                    <p className="rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-200">
                      {item.percentage}%
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
                    <div className="rounded-lg bg-white/5 p-2.5">
                      <p className="text-slate-400">Range Start</p>
                      <p className="mt-1 text-sm font-medium text-white">{item.amt_range_start}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-2.5">
                      <p className="text-slate-400">Range End</p>
                      <p className="mt-1 text-sm font-medium text-white">{item.amt_range_end}</p>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-slate-500">Created: {item.created_at}</p>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="flex-1 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex-1 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300"
                    >
                      Delete
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

export default AdminAdsCampign;
