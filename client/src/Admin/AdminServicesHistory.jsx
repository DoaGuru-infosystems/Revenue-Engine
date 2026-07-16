import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { IndianRupee, Pencil, Search, Trash2, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { clearUser } from "../redux/user/userSlice";
import API_BASE_URL from "../config/apiBaseUrl";

const inputClassName =
  "w-full rounded-xl border border-white/15 bg-slate-900/60 px-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30";

const AdminServicesHistory = () => {
  const baseURL = API_BASE_URL;
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const clientPerPage = 10;
  const [serviceData, setServiceData] = useState([]);
  const { token } = useSelector((state) => state.user);
  const [formData, setFormData] = useState({
    editing_type_id: "",
    editing_type_name: "",
    amount: "",
    category_id: "",
    category_name: "",
    service_id: "",
  });
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const fetchServices = async () => {
    try {
      const res = await axios.get(`${baseURL}/auth/api/re_calculator/getAddServices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setServices(res.data.data || []);
    } catch (error) {
      console.error("Error fetching services", error);
    }
  };

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

  const fetchData = async () => {
    try {
      const res = await axios.get(`${baseURL}/auth/api/re_calculator/api/services/details/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.data.status === "Success") {
        setServiceData(res.data.data || []);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      Swal.fire({
        icon: "error",
        title: "Fetch Failed",
        text: "Unable to load service history.",
        showConfirmButton: false,
        timer: 1200,
      });
    }
  };

  useEffect(() => {
    fetchData();
    fetchServices();
  }, []);

  const handleClose = () => {
    setShowModal(false);
    setFormData({
      editing_type_id: "",
      editing_type_name: "",
      amount: "",
      category_id: "",
      category_name: "",
      service_id: "",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.put(
        `${baseURL}/auth/api/re_calculator/updateServiceData/${formData.editing_type_id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status === "Success") {
        Swal.fire({
          icon: "success",
          title: "Updated",
          text: "Service editing type updated successfully.",
          showConfirmButton: false,
          timer: 1000,
        }).then(() => {
          handleClose();
          fetchData();
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: response.data.message || "Unable to update editing type.",
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
        text: error.response?.data?.message || "Unable to update service.",
        showConfirmButton: false,
        timer: 1200,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (row) => {
    const confirm = await Swal.fire({
      title: "Delete this row?",
      text: "This action is permanent.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#475569",
    });

    if (!confirm.isConfirmed) return;

    try {
      let res = null;
      if (row.editing_type_id) {
        res = await axios.delete(
          `${baseURL}/auth/api/re_calculator/deleteEditingType/${row.editing_type_id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else if (row.category_id) {
        res = await axios.delete(
          `${baseURL}/auth/api/re_calculator/deleteCategory/${row.category_id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else if (row.service_id) {
        res = await axios.delete(
          `${baseURL}/auth/api/re_calculator/deleteService/${row.service_id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      if (res?.data?.status === "Success") {
        Swal.fire({
          icon: "success",
          title: "Deleted",
          text: "Service record removed successfully.",
          showConfirmButton: false,
          timer: 1000,
        });
      } else if (res?.data?.message) {
        Swal.fire({
          icon: "warning",
          title: "Unable to Delete",
          text: res.data.message,
          showConfirmButton: false,
          timer: 1400,
        });
      }

      fetchData();
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text: error?.response?.data?.message || "Something went wrong.",
        showConfirmButton: false,
        timer: 1200,
      });
    }
  };

  const filteredItems = useMemo(() => {
    const search = keyword.trim().toLowerCase();
    if (!search) return serviceData;
    return serviceData.filter((row) => {
      return (
        row?.service_name?.toLowerCase().includes(search) ||
        row?.category_name?.toLowerCase().includes(search) ||
        row?.editing_type_name?.toLowerCase().includes(search)
      );
    });
  }, [keyword, serviceData]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(filteredItems.length / clientPerPage) - 1);
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [currentPage, filteredItems.length]);

  const pageCount = filteredItems.length
    ? Math.ceil(filteredItems.length / clientPerPage)
    : 0;

  const showApiData = useMemo(() => {
    const startIndex = currentPage * clientPerPage;
    return filteredItems.slice(startIndex, startIndex + clientPerPage);
  }, [filteredItems, currentPage]);

  const stats = useMemo(() => {
    return {
      totalRows: serviceData.length,
      serviceCount: new Set(serviceData.map((row) => row.service_name).filter(Boolean)).size,
      categoryCount: new Set(serviceData.map((row) => row.category_name).filter(Boolean)).size,
    };
  }, [serviceData]);

  return (
    <div className="space-y-6 text-white">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900/85 via-slate-800/70 to-yellow-900/55 p-4 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-yellow-300/80">History Log</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Services History</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Review all service-category-editing combinations and manage updates from one place.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 md:w-auto">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase text-slate-400">Rows</p>
              <p className="mt-1 text-xl font-semibold">{stats.totalRows}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase text-slate-400">Services</p>
              <p className="mt-1 text-xl font-semibold">{stats.serviceCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase text-slate-400">Categories</p>
              <p className="mt-1 text-xl font-semibold">{stats.categoryCount}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900/55 p-4 sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold">Search & Manage Entries</h3>
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={keyword}
              placeholder="Search service, category, editing type"
              className="w-full rounded-xl border border-white/15 bg-slate-900/70 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
              onChange={(e) => {
                setKeyword(e.target.value);
                setCurrentPage(0);
              }}
            />
          </div>
        </div>

        {showApiData.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/35 px-4 py-10 text-center text-slate-300">
            No services found.
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-auto h-[35rem]" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <table className="min-w-full text-sm">
                <thead className="bg-white/5 text-slate-300">
                  <tr>
                    <th className="px-4 py-3 text-left">Service</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Editing Type</th>
                    <th className="px-4 py-3 text-left">Amount</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {showApiData.map((item) => (
                    <tr key={`${item.service_id}-${item.category_id}-${item.editing_type_id}`} className="hover:bg-white/5">
                      <td className="px-4 py-3 font-medium text-white">{item.service_name}</td>
                      <td className="px-4 py-3 text-slate-300">{item.category_name}</td>
                      <td className="px-4 py-3 text-slate-300">{item.editing_type_name}</td>
                      <td className="px-4 py-3 text-slate-200">Rs {item.amount}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setFormData({
                                editing_type_id: item.editing_type_id,
                                editing_type_name: item.editing_type_name,
                                amount: item.amount,
                                category_id: item.category_id,
                                category_name: item.category_name,
                                service_id: item.service_id,
                              });
                              setShowModal(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
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
              {showApiData.map((item) => (
                <div
                  key={`${item.service_id}-${item.category_id}-${item.editing_type_id}`}
                  className="rounded-xl border border-white/10 bg-slate-900/60 p-4"
                >
                  <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Service</p>
                  <p className="mt-1 text-base font-semibold text-white">{item.service_name}</p>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-lg bg-white/5 p-2.5">
                      <p className="text-slate-400">Category</p>
                      <p className="mt-1 text-sm text-white">{item.category_name}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-2.5">
                      <p className="text-slate-400">Amount</p>
                      <p className="mt-1 text-sm text-white">Rs {item.amount}</p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg bg-white/5 p-2.5 text-xs">
                    <p className="text-slate-400">Editing Type</p>
                    <p className="mt-1 text-sm text-white">{item.editing_type_name}</p>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setFormData({
                          editing_type_id: item.editing_type_id,
                          editing_type_name: item.editing_type_name,
                          amount: item.amount,
                          category_id: item.category_id,
                          category_name: item.category_name,
                          service_id: item.service_id,
                        });
                        setShowModal(true);
                      }}
                      className="flex-1 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
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

        {pageCount > 1 && (
          <div className="p-3 flex items-center justify-center gap-3 mt-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-700/50 text-gray-300 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">Page</span>
              <select
                value={currentPage}
                onChange={(e) => setCurrentPage(Number(e.target.value))}
                className="bg-gray-900/80 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer appearance-none min-w-[70px] text-center"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 fill=%27%239ca3af%27 viewBox=%270 0 16 16%27%3E%3Cpath d=%27M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z%27/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', paddingRight: '28px' }}
              >
                {Array.from({ length: pageCount }, (_, i) => (
                  <option key={i} value={i}>{i + 1}</option>
                ))}
              </select>
              <span className="text-gray-500 text-sm">of {pageCount}</span>
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={currentPage >= pageCount - 1}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-700/50 text-gray-300 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={handleClose} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/15 bg-slate-900 p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Update Entry</p>
                <h2 className="mt-1 text-lg font-semibold text-white">Edit Service Details</h2>
              </div>
              <button
                onClick={handleClose}
                className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-slate-300">Service</label>
                <select
                  name="service_id"
                  value={formData.service_id}
                  onChange={handleChange}
                  className={inputClassName}
                  required
                >
                  <option value="" disabled>Select a service</option>
                  {services.map((s) => (
                    <option key={s.service_id} value={s.service_id}>
                      {s.service_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Category</label>
                <input
                  type="text"
                  name="category_name"
                  value={formData.category_name}
                  onChange={handleChange}
                  className={inputClassName}
                  placeholder="Enter category name"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Editing Type</label>
                <input
                  type="text"
                  name="editing_type_name"
                  value={formData.editing_type_name}
                  onChange={handleChange}
                  className={inputClassName}
                  placeholder="Enter editing type name (optional)"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Amount</label>
                <div className="relative">
                  <IndianRupee className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/15 bg-slate-900/60 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
                    placeholder="Enter amount"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminServicesHistory;
