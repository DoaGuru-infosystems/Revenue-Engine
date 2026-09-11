import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../redux/user/userSlice";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, ChevronDown, Package, Plus, Sparkles } from "lucide-react";
import API_BASE_URL from "../config/apiBaseUrl";

const inputClassName =
  "w-full rounded-xl border border-white/15 bg-slate-900/60 px-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30";

const AdminAddServices = () => {
  const baseURL = API_BASE_URL;
  const { token } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [serviceName, setServiceName] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [editingTypeName, setEditingTypeName] = useState("");
  const [editingTypeAmount, setEditingTypeAmount] = useState("");

  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [categories, setCategories] = useState([]);

  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const catDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(event.target)) {
        setIsCatDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const fetchServices = async () => {
    try {
      const res = await axios.get(`${baseURL}/auth/api/re_calculator/getAddServices`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      setServices(res.data.data || []);
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: "Unable to fetch service list.",
        showConfirmButton: false,
        timer: 1200,
      });
    }
  };

  const fetchCategories = async (serviceId) => {
    if (!serviceId) {
      setCategories([]);
      return;
    }

    try {
      const res = await axios.get(`${baseURL}/auth/api/re_calculator/categories/${serviceId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      setCategories(res.data.data || []);
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
      } else if (error.response?.status === 404) {
        // Normal case: newly created service has no categories yet
        setCategories([]);
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: "Unable to fetch categories for selected service.",
          showConfirmButton: false,
          timer: 1200,
        });
      }
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const addService = async () => {
    if (!serviceName.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Validation",
        text: "Service name is required.",
        showConfirmButton: false,
        timer: 1000,
      });
      return;
    }

    try {
      const res = await axios.post(
        `${baseURL}/auth/api/re_calculator/addServices`,
        { service_name: serviceName.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire({
        icon: "success",
        title: "Added",
        text: res.data.message,
        showConfirmButton: false,
        timer: 1000,
      });

      setServiceName("");
      fetchServices();
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Could not add service.",
        showConfirmButton: false,
        timer: 1200,
      });
    }
  };

  const isExistingCategory = useMemo(() => {
    if (!categoryName.trim() || !categories.length) return false;
    return categories.some(
      (c) => c.category_name.trim().toLowerCase() === categoryName.trim().toLowerCase()
    );
  }, [categories, categoryName]);

  const filteredCategories = useMemo(() => {
    if (!categoryName.trim()) return categories;
    return categories.filter((c) =>
      c.category_name.toLowerCase().includes(categoryName.trim().toLowerCase())
    );
  }, [categories, categoryName]);

  const addCategory = async () => {
    if (!selectedServiceId || !categoryName.trim() || editingTypeAmount === "") {
      Swal.fire({
        icon: "warning",
        title: "Validation",
        text: "Service, category name, and amount are required.",
        showConfirmButton: false,
        timer: 1500,
      });
      return;
    }

    const trimmedCatName = categoryName.trim();
    const existingCat = categories.find(
      (c) => c.category_name.trim().toLowerCase() === trimmedCatName.toLowerCase()
    );

    // If existing category, editing type is MANDATORY
    if (existingCat) {
      if (!editingTypeName.trim()) {
        Swal.fire({
          icon: "warning",
          title: "Editing Type Required",
          text: "Existing category ke liye editing type enter karna zaroori hai.",
          showConfirmButton: true,
        });
        return;
      }

      setIsSavingCategory(true);
      try {
        const finalAmount = parseFloat(editingTypeAmount) || 0;
        await axios.post(
          `${baseURL}/auth/api/re_calculator/addEditingTypes`,
          {
            service_id: selectedServiceId,
            category_id: existingCat.category_id,
            editing_type_name: editingTypeName.trim(),
            amount: finalAmount,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        Swal.fire({
          icon: "success",
          title: "Added",
          text: "Editing type added to existing category successfully!",
          showConfirmButton: false,
          timer: 1500,
        });

        setCategoryName("");
        setEditingTypeName("");
        setEditingTypeAmount("");
        fetchCategories(selectedServiceId);
      } catch (error) {
        if (error.response?.status === 401) {
          handleUnauthorized();
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text:
              error.response?.data?.message ||
              error.message ||
              "Could not add editing type to existing category.",
            showConfirmButton: false,
            timer: 1500,
          });
        }
      } finally {
        setIsSavingCategory(false);
      }
      return;
    }

    // New Category flow
    setIsSavingCategory(true);
    try {
      // 1. Create Category
      const catRes = await axios.post(
        `${baseURL}/auth/api/re_calculator/addCategories`,
        {
          service_id: selectedServiceId,
          category_name: trimmedCatName,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newCategoryId = catRes.data.data?.category_id;
      if (!newCategoryId) {
        throw new Error("Category ID not returned from server.");
      }

      // 2. Add Editing Type (Optional Name, Default to null)
      const finalEditingTypeName = editingTypeName.trim() || null;
      const finalAmount = parseFloat(editingTypeAmount) || 0;

      await axios.post(
        `${baseURL}/auth/api/re_calculator/addEditingTypes`,
        {
          service_id: selectedServiceId,
          category_id: newCategoryId,
          editing_type_name: finalEditingTypeName,
          amount: finalAmount,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire({
        icon: "success",
        title: "Added",
        text:
          finalEditingTypeName === null
            ? "Category saved! Editing type is empty."
            : "Category with editing type saved!",
        showConfirmButton: false,
        timer: 1500,
      });

      setCategoryName("");
      setEditingTypeName("");
      setEditingTypeAmount("");
      fetchCategories(selectedServiceId);
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            error.response?.data?.message ||
            error.message ||
            "Could not add category.",
          showConfirmButton: false,
          timer: 1500,
        });
      }
    } finally {
      setIsSavingCategory(false);
    }
  };

  const selectedServiceName = useMemo(() => {
    if (!selectedServiceId) return "None selected";
    return services.find((s) => s.service_id == selectedServiceId)?.service_name || "None selected";
  }, [selectedServiceId, services]);

  return (
    <div className="space-y-6 text-white">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900/85 via-slate-800/70 to-amber-900/60 p-4 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-300/80">Service Builder</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Graphic & SEO Service Management</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Create service hierarchy in two steps: service, and category with amount (editing type optional).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-right">
              <p className="text-xs text-slate-400 uppercase tracking-widest">Services</p>
              <p className="text-lg font-bold text-amber-300">{services.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-right">
              <p className="text-xs text-slate-400 uppercase tracking-widest">Selected Categories</p>
              <p className="text-lg font-bold text-amber-300">{categories.length}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-slate-900/55 p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-red-500/20 p-2 text-red-200">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Step 1</p>
              <h3 className="text-base font-semibold">Add Service</h3>
            </div>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="Enter service name"
              className={inputClassName}
            />
            <button
              onClick={addService}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Save Service
            </button>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-slate-900/55 p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-yellow-500/20 p-2 text-yellow-200">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Step 2</p>
              <h3 className="text-base font-semibold">Add Category</h3>
            </div>
          </div>

          <div className="space-y-3">
            <select
              className={inputClassName}
              value={selectedServiceId}
              onChange={(e) => {
                const serviceId = e.target.value;
                setSelectedServiceId(serviceId);
                fetchCategories(serviceId);
                setCategoryName("");
              }}
            >
              <option value="">Select service</option>
              {services.map((service) => (
                <option key={service.service_id} value={service.service_id}>
                  {service.service_name}
                </option>
              ))}
            </select>

            {/* Category Input with Integrated Dropdown */}
            <div className="relative" ref={catDropdownRef}>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => {
                  setCategoryName(e.target.value);
                  setIsCatDropdownOpen(true);
                }}
                onFocus={() => {
                  if (selectedServiceId && categories.length > 0) {
                    setIsCatDropdownOpen(true);
                  }
                }}
                onClick={() => {
                  if (selectedServiceId && categories.length > 0) {
                    setIsCatDropdownOpen(true);
                  }
                }}
                placeholder={
                  !selectedServiceId
                    ? "Select service first"
                    : "Enter or choose category name"
                }
                disabled={!selectedServiceId}
                className={`${inputClassName} ${isExistingCategory ? "border-amber-400/80 ring-1 ring-amber-400/30" : ""} pr-24`}
              />
              <div className="absolute right-2 top-2.5 flex items-center gap-1.5">
                {isExistingCategory && (
                  <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[11px] font-medium text-amber-300">
                    Existing Category
                  </span>
                )}
                {selectedServiceId && categories.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCatDropdownOpen((prev) => !prev);
                    }}
                    className="rounded p-1 text-slate-400 hover:text-white transition"
                    title="Toggle categories list"
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        isCatDropdownOpen ? "rotate-180 text-amber-400" : ""
                      }`}
                    />
                  </button>
                )}
              </div>

              {/* Integrated Dropdown Menu */}
              {isCatDropdownOpen && selectedServiceId && categories.length > 0 && (
                <div className="absolute left-0 top-full z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-white/15 bg-slate-900/95 shadow-2xl backdrop-blur-md">
                  <div className="border-b border-white/10 px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>Existing Categories ({categories.length})</span>
                    <span className="text-[10px] text-slate-500">Click to select</span>
                  </div>
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((cat) => {
                      const isSelected =
                        cat.category_name.trim().toLowerCase() ===
                        categoryName.trim().toLowerCase();
                      return (
                        <div
                          key={cat.category_id}
                          onClick={() => {
                            setCategoryName(cat.category_name);
                            setIsCatDropdownOpen(false);
                          }}
                          className={`flex cursor-pointer items-center justify-between px-3 py-2.5 text-sm transition hover:bg-amber-500/20 hover:text-amber-200 ${
                            isSelected
                              ? "bg-amber-500/15 font-semibold text-amber-300"
                              : "text-slate-200"
                          }`}
                        >
                          <span>{cat.category_name}</span>
                          {isSelected && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-3 py-2.5 text-xs text-slate-400">
                      No matching existing category. Typing will create: <span className="font-semibold text-amber-300">"{categoryName}"</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <input
              type="number"
              value={editingTypeAmount}
              onChange={(e) => setEditingTypeAmount(e.target.value)}
              placeholder="Enter amount (Required)"
              className={inputClassName}
            />

            <div>
              <input
                type="text"
                value={editingTypeName}
                onChange={(e) => setEditingTypeName(e.target.value)}
                placeholder={
                  isExistingCategory
                    ? "Enter editing type (Required for existing category)"
                    : "Enter editing type (Optional for new category)"
                }
                className={`${inputClassName} ${
                  isExistingCategory && !editingTypeName.trim()
                    ? "border-amber-500/50 ring-1 ring-amber-500/30"
                    : ""
                }`}
              />
              {isExistingCategory && (
                <p className="mt-1 text-xs text-amber-400">
                  * Note: Editing type is required when adding an entry to an existing category.
                </p>
              )}
            </div>

            <button
              onClick={addCategory}
              disabled={isSavingCategory}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSavingCategory ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Save Category
                </>
              )}
            </button>
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900/55 p-4 sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Current Selection</p>
            <h4 className="mt-1 text-base font-semibold text-white">{selectedServiceName}</h4>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            <ArrowRight className="h-4 w-4" />
            Create structure top to bottom for best result.
          </div>
        </div>

        {categories.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((category) => (
              <span
                key={category.category_id}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-200"
              >
                {category.category_name}
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminAddServices;
