import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../../../redux/user/userSlice";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Layers,
  Package,
  Plus,
  Sparkles,
  Trash2,
  FolderPlus,
} from "lucide-react";
import API_BASE_URL from "../../../config/apiBaseUrl";

const inputClassName =
  "w-full rounded-xl border border-white/15 bg-slate-900/60 px-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 transition-all";

export default function AdminAddServicesPage() {
  const baseURL = API_BASE_URL;
  const { token } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Mode for Card 1: "existing" (select from dropdown) or "new" (enter new service name)
  const [serviceMode, setServiceMode] = useState("existing");
  const [serviceName, setServiceName] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [editingTypeName, setEditingTypeName] = useState("");
  const [editingTypeAmount, setEditingTypeAmount] = useState("");

  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [categories, setCategories] = useState([]);

  // Card 2: Dedicated Additional Services state
  const [addonServiceId, setAddonServiceId] = useState("");
  const [addonCategories, setAddonCategories] = useState([]);
  const [addonCategoryId, setAddonCategoryId] = useState("");
  const [addonCategoryName, setAddonCategoryName] = useState("");
  const [additionalServices, setAdditionalServices] = useState([]);
  const [addonName, setAddonName] = useState("");
  const [addonAmount, setAddonAmount] = useState("");
  const [isSavingAddon, setIsSavingAddon] = useState(false);

  const [isSavingServiceCategory, setIsSavingServiceCategory] = useState(false);
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
      const list = res.data.data || [];
      setServices(list);
      return list;
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return [];
      }
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: "Unable to fetch service list.",
        showConfirmButton: false,
        timer: 1200,
      });
      return [];
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

  const fetchAddonCategories = async (serviceId) => {
    if (!serviceId) {
      setAddonCategories([]);
      setAddonCategoryId("");
      setAddonCategoryName("");
      return;
    }
    try {
      const res = await axios.get(`${baseURL}/auth/api/re_calculator/categories/${serviceId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const cats = res.data.data || [];
      setAddonCategories(cats);
      if (cats.length > 0) {
        setAddonCategoryId(cats[0].category_id);
        setAddonCategoryName(cats[0].category_name);
      } else {
        setAddonCategoryId("");
        setAddonCategoryName("");
      }
    } catch (error) {
      setAddonCategories([]);
      setAddonCategoryId("");
      setAddonCategoryName("");
    }
  };

  const fetchAdditionalServices = async (serviceId) => {
    if (!serviceId) {
      setAdditionalServices([]);
      return;
    }
    try {
      const res = await axios.get(`${baseURL}/auth/api/re_calculator/additionalServices/${serviceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.status === "Success") {
        setAdditionalServices(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching additional services", err);
    }
  };

  useEffect(() => {
    fetchServices().then((list) => {
      if (list && list.length > 0 && !selectedServiceId) {
        setSelectedServiceId(list[0].service_id);
        setAddonServiceId(list[0].service_id);
        fetchCategories(list[0].service_id);
        fetchAddonCategories(list[0].service_id);
        fetchAdditionalServices(list[0].service_id);
      }
    });
  }, []);

  const handleSelectServiceInCard1 = (serviceId) => {
    setSelectedServiceId(serviceId);
    fetchCategories(serviceId);
    setCategoryName("");
    if (!addonServiceId || addonServiceId === selectedServiceId) {
      setAddonServiceId(serviceId);
      fetchAddonCategories(serviceId);
      fetchAdditionalServices(serviceId);
    }
  };

  const handleSelectAddonService = (serviceId) => {
    setAddonServiceId(serviceId);
    fetchAddonCategories(serviceId);
    fetchAdditionalServices(serviceId);
  };

  const handleSaveAdditionalService = async () => {
    if (!addonServiceId) {
      Swal.fire({
        icon: "warning",
        title: "Select Service",
        text: "Please select a service for the additional service.",
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }
    if (!addonCategoryId) {
      Swal.fire({
        icon: "warning",
        title: "Select Category",
        text: "Please select a category for the additional service.",
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }
    if (!addonName.trim() || addonAmount === "") {
      Swal.fire({
        icon: "warning",
        title: "Validation",
        text: "Additional service name and amount are required.",
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }

    setIsSavingAddon(true);
    try {
      const res = await axios.post(
        `${baseURL}/auth/api/re_calculator/addAdditionalService`,
        {
          service_id: addonServiceId,
          category_id: addonCategoryId,
          category_name: addonCategoryName,
          additional_service_name: addonName.trim(),
          amount: parseFloat(addonAmount) || 0,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.status === "Success") {
        Swal.fire({
          icon: "success",
          title: "Saved!",
          text: "Additional service added successfully.",
          timer: 1000,
          showConfirmButton: false,
        });
        setAddonName("");
        setAddonAmount("");
        fetchAdditionalServices(addonServiceId);
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: err.response?.data?.message || "Failed to save additional service.",
      });
    } finally {
      setIsSavingAddon(false);
    }
  };

  const handleDeleteAdditionalService = async (addonId) => {
    const confirm = await Swal.fire({
      title: "Delete Additional Service?",
      text: "Are you sure you want to delete this additional service?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      confirmButtonText: "Yes, delete",
    });
    if (!confirm.isConfirmed) return;

    try {
      await axios.delete(
        `${baseURL}/auth/api/re_calculator/deleteAdditionalService/${addonId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Additional service deleted.",
        timer: 1000,
        showConfirmButton: false,
      });
      fetchAdditionalServices(addonServiceId);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to delete additional service.",
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

  // Unified Save Handler for Card 1 (Service & Category)
  const handleSaveServiceAndCategory = async () => {
    // ── Mode: Create New Service ──
    if (serviceMode === "new") {
      if (!serviceName.trim()) {
        Swal.fire({
          icon: "warning",
          title: "Validation",
          text: "Please enter a new service name.",
          timer: 1500,
          showConfirmButton: false,
        });
        return;
      }

      const hasCategory = Boolean(categoryName.trim());
      const hasAmount = editingTypeAmount !== "";

      if (hasCategory && !hasAmount) {
        Swal.fire({
          icon: "warning",
          title: "Amount Required",
          text: "Please enter the amount for the category.",
          timer: 1500,
          showConfirmButton: false,
        });
        return;
      }

      setIsSavingServiceCategory(true);
      try {
        // Step 1: Create Service
        const sRes = await axios.post(
          `${baseURL}/auth/api/re_calculator/addServices`,
          { service_name: serviceName.trim() },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        let newServiceId = sRes.data?.data?.service_id;
        const updatedList = await fetchServices();

        if (!newServiceId && updatedList.length > 0) {
          const found = updatedList.find(
            (s) => s.service_name.trim().toLowerCase() === serviceName.trim().toLowerCase()
          );
          if (found) newServiceId = found.service_id;
        }

        // Step 2: If category details were also filled, create category & editing type
        if (hasCategory && hasAmount && newServiceId) {
          const catRes = await axios.post(
            `${baseURL}/auth/api/re_calculator/addCategories`,
            {
              service_id: newServiceId,
              category_name: categoryName.trim(),
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const newCategoryId = catRes.data.data?.category_id;
          if (newCategoryId) {
            await axios.post(
              `${baseURL}/auth/api/re_calculator/addEditingTypes`,
              {
                service_id: newServiceId,
                category_id: newCategoryId,
                editing_type_name: editingTypeName.trim() || null,
                amount: parseFloat(editingTypeAmount) || 0,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          }
        }

        Swal.fire({
          icon: "success",
          title: "Success!",
          text: hasCategory
            ? "New service, category & amount created successfully!"
            : "New service created successfully!",
          timer: 1500,
          showConfirmButton: false,
        });

        setServiceName("");
        setCategoryName("");
        setEditingTypeName("");
        setEditingTypeAmount("");

        if (newServiceId) {
          setSelectedServiceId(newServiceId);
          setAddonServiceId(newServiceId);
          fetchCategories(newServiceId);
          fetchAddonCategories(newServiceId);
          fetchAdditionalServices(newServiceId);
          setServiceMode("existing");
        }
      } catch (err) {
        if (err.response?.status === 401) {
          handleUnauthorized();
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: err.response?.data?.message || "Failed to create new service.",
          });
        }
      } finally {
        setIsSavingServiceCategory(false);
      }
      return;
    }

    // ── Mode: Select Existing Service ──
    if (serviceMode === "existing") {
      if (!selectedServiceId) {
        Swal.fire({
          icon: "warning",
          title: "Select Service",
          text: "Please select an existing service first, or switch to 'Create New Service'.",
          timer: 1500,
          showConfirmButton: false,
        });
        return;
      }
      if (!categoryName.trim()) {
        Swal.fire({
          icon: "warning",
          title: "Category Name Required",
          text: "Please enter or select a category name.",
          timer: 1500,
          showConfirmButton: false,
        });
        return;
      }
      if (editingTypeAmount === "") {
        Swal.fire({
          icon: "warning",
          title: "Amount Required",
          text: "Please enter amount for this category.",
          timer: 1500,
          showConfirmButton: false,
        });
        return;
      }

      const trimmedCatName = categoryName.trim();
      const existingCat = categories.find(
        (c) => c.category_name.trim().toLowerCase() === trimmedCatName.toLowerCase()
      );

      // If existing category, editing type is required
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

        setIsSavingServiceCategory(true);
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
              text: error.response?.data?.message || "Could not add editing type to existing category.",
              showConfirmButton: false,
              timer: 1500,
            });
          }
        } finally {
          setIsSavingServiceCategory(false);
        }
        return;
      }

      // New Category under existing service
      setIsSavingServiceCategory(true);
      try {
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
        if (addonServiceId === selectedServiceId) {
          fetchAddonCategories(selectedServiceId);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          handleUnauthorized();
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: error.response?.data?.message || "Could not add category.",
            showConfirmButton: false,
            timer: 1500,
          });
        }
      } finally {
        setIsSavingServiceCategory(false);
      }
    }
  };

  const selectedServiceName = useMemo(() => {
    if (!selectedServiceId) return "None selected";
    return services.find((s) => s.service_id == selectedServiceId)?.service_name || "None selected";
  }, [selectedServiceId, services]);

  const addonServiceName = useMemo(() => {
    if (!addonServiceId) return "None selected";
    return services.find((s) => s.service_id == addonServiceId)?.service_name || "None selected";
  }, [addonServiceId, services]);

  return (
    <div className="space-y-6 text-white">
      {/* Header Banner */}
      <section className="rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900/85 via-slate-800/70 to-amber-900/60 p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-300/80">Service Builder</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Graphic & SEO Service Management</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Create and manage services, categories with amounts, and dedicated additional services seamlessly.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-right">
              <p className="text-xs text-slate-400 uppercase tracking-widest">Services</p>
              <p className="text-lg font-bold text-amber-300">{services.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-right">
              <p className="text-xs text-slate-400 uppercase tracking-widest">Categories</p>
              <p className="text-lg font-bold text-amber-300">{categories.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-right">
              <p className="text-xs text-slate-400 uppercase tracking-widest">Add-ons</p>
              <p className="text-lg font-bold text-amber-300">{additionalServices.length}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main 2-Card Layout */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ============================================================== */}
        {/* CARD 1: ADD SERVICE & CATEGORY (UNIFIED ALL-IN-ONE) */}
        {/* ============================================================== */}
        <article className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 sm:p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 p-2 text-amber-300">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.15em] text-amber-400/90 font-semibold">Step 1</p>
                  <h3 className="text-base font-bold text-white">Add Service & Category</h3>
                </div>
              </div>

              {/* Segmented Mode Switch */}
              <div className="inline-flex rounded-xl bg-slate-950/80 p-1 border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setServiceMode("existing")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    serviceMode === "existing"
                      ? "bg-amber-500 text-slate-950 font-bold shadow-md"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  Select Existing
                </button>
                <button
                  type="button"
                  onClick={() => setServiceMode("new")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    serviceMode === "new"
                      ? "bg-amber-500 text-slate-950 font-bold shadow-md"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  + Create New
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* Service Selection or Entry */}
              {serviceMode === "existing" ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Select Service <span className="text-red-400">*</span>
                  </label>
                  <select
                    className={inputClassName}
                    value={selectedServiceId}
                    onChange={(e) => handleSelectServiceInCard1(e.target.value)}
                  >
                    <option value="">-- Choose Existing Service --</option>
                    {services.map((service) => (
                      <option key={service.service_id} value={service.service_id}>
                        {service.service_name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-amber-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
                    New Service Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    placeholder="Enter new service name (e.g. Website Development)"
                    className={inputClassName}
                  />
                </div>
              )}

              {/* Category Name */}
              <div className="relative" ref={catDropdownRef}>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Category Name {serviceMode === "existing" && <span className="text-red-400">*</span>}
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => {
                    setCategoryName(e.target.value);
                    if (serviceMode === "existing") setIsCatDropdownOpen(true);
                  }}
                  onFocus={() => {
                    if (serviceMode === "existing" && selectedServiceId && categories.length > 0) {
                      setIsCatDropdownOpen(true);
                    }
                  }}
                  onClick={() => {
                    if (serviceMode === "existing" && selectedServiceId && categories.length > 0) {
                      setIsCatDropdownOpen(true);
                    }
                  }}
                  placeholder={
                    serviceMode === "existing"
                      ? (!selectedServiceId ? "Select service first" : "Enter or choose category name")
                      : "Enter category name (optional if saving service only)"
                  }
                  disabled={serviceMode === "existing" && !selectedServiceId}
                  className={`${inputClassName} ${
                    isExistingCategory ? "border-amber-400/80 ring-1 ring-amber-400/30" : ""
                  } pr-24`}
                />
                <div className="absolute right-2 top-8 flex items-center gap-1.5">
                  {isExistingCategory && (
                    <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[11px] font-medium text-amber-300">
                      Existing Category
                    </span>
                  )}
                  {serviceMode === "existing" && selectedServiceId && categories.length > 0 && (
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

                {isCatDropdownOpen && serviceMode === "existing" && selectedServiceId && categories.length > 0 && (
                  <div className="absolute left-0 top-full z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-white/15 bg-slate-900/95 shadow-2xl backdrop-blur-md">
                    <div className="border-b border-white/10 px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span>Existing Categories ({categories.length})</span>
                      <span className="text-[10px] text-slate-500">Click to select</span>
                    </div>
                    {filteredCategories.length > 0 ? (
                      filteredCategories.map((cat) => {
                        const isSelected =
                          cat.category_name.trim().toLowerCase() === categoryName.trim().toLowerCase();
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
                            {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />}
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-3 py-2.5 text-xs text-slate-400">
                        No matching category. Typing will create:{" "}
                        <span className="font-semibold text-amber-300">"{categoryName}"</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Service Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Service Amount (₹) {serviceMode === "existing" && <span className="text-red-400">*</span>}
                </label>
                <input
                  type="number"
                  value={editingTypeAmount}
                  onChange={(e) => setEditingTypeAmount(e.target.value)}
                  placeholder="Enter amount in ₹ (e.g. 5000)"
                  className={inputClassName}
                />
              </div>

              {/* Editing Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Editing Type</span>
                  <span className="text-[10px] font-normal text-slate-400">
                    {isExistingCategory ? "(Required for existing category)" : "(Optional)"}
                  </span>
                </label>
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
                    * Note: Editing type is required when adding a new entry to an existing category.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="pt-5 mt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleSaveServiceAndCategory}
              disabled={isSavingServiceCategory}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-5 py-3 text-sm font-bold text-slate-950 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20"
            >
              {isSavingServiceCategory ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Plus className="h-4 w-4 text-slate-950" />
                  {serviceMode === "new"
                    ? categoryName.trim()
                      ? "Save New Service & Category"
                      : "Save Service Only"
                    : "Save Category to Service"}
                </>
              )}
            </button>
          </div>
        </article>

        {/* ============================================================== */}
        {/* CARD 2: ADDITIONAL SERVICES (DEDICATED SIDE CARD) */}
        {/* ============================================================== */}
        <article className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 sm:p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-gradient-to-br from-amber-400/20 to-yellow-500/20 border border-amber-400/30 p-2 text-amber-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.15em] text-amber-400/90 font-semibold">Step 2</p>
                  <h3 className="text-base font-bold text-white">Add Additional Service</h3>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 font-semibold">
                {additionalServices.length} {additionalServices.length === 1 ? "Addon" : "Addons"}
              </span>
            </div>

            <div className="space-y-4">
              {/* Select Service Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Select Service for Additional Service <span className="text-red-400">*</span>
                </label>
                <select
                  className={inputClassName}
                  value={addonServiceId}
                  onChange={(e) => handleSelectAddonService(e.target.value)}
                >
                  <option value="">-- Choose Service for Additional Services --</option>
                  {services.map((service) => (
                    <option key={service.service_id} value={service.service_id}>
                      {service.service_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Category Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Select Category for Additional Service <span className="text-red-400">*</span>
                </label>
                <select
                  className={`${inputClassName} disabled:opacity-50`}
                  value={addonCategoryId}
                  disabled={!addonServiceId || addonCategories.length === 0}
                  onChange={(e) => {
                    const catId = e.target.value;
                    setAddonCategoryId(catId);
                    const catObj = addonCategories.find((c) => String(c.category_id) === String(catId));
                    setAddonCategoryName(catObj ? catObj.category_name : "");
                  }}
                >
                  <option value="">
                    {addonCategories.length === 0
                      ? "-- No Categories Found for this Service --"
                      : "-- Choose Category --"}
                  </option>
                  {addonCategories.map((cat) => (
                    <option key={cat.category_id} value={cat.category_id}>
                      {cat.category_name}
                    </option>
                  ))}
                </select>
                {addonServiceId && addonCategories.length === 0 && (
                  <p className="mt-1 text-xs text-amber-400/90">
                    * This service has no categories yet. Please create a category first in Card 1.
                  </p>
                )}
              </div>

              {/* Additional Service Name Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Additional Service Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={addonName}
                  onChange={(e) => setAddonName(e.target.value)}
                  placeholder="e.g. Website Maintenance, Domain & Server, Logo Design"
                  disabled={!addonServiceId || !addonCategoryId}
                  className={`${inputClassName} disabled:opacity-50`}
                />
              </div>

              {/* Additional Service Amount Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Additional Service Amount (₹) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={addonAmount}
                  onChange={(e) => setAddonAmount(e.target.value)}
                  placeholder="Enter addon amount in ₹ (e.g. 2000)"
                  disabled={!addonServiceId || !addonCategoryId}
                  className={`${inputClassName} disabled:opacity-50`}
                />
              </div>

              {/* Save Additional Service Button */}
              <button
                type="button"
                onClick={handleSaveAdditionalService}
                disabled={isSavingAddon || !addonServiceId || !addonCategoryId}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-amber-500/20"
              >
                {isSavingAddon ? (
                  <span>Saving Additional Service...</span>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Save Additional Service
                  </>
                )}
              </button>

              {/* Saved Additional Services for this service */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Configured Add-ons for "{addonServiceName}"
                  </span>
                </div>

                {additionalServices.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {additionalServices.map((ad) => (
                      <div
                        key={ad.id}
                        className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-200 transition hover:bg-amber-500/10"
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <div>
                            <span className="font-semibold text-white">{ad.additional_service_name}</span>
                            {ad.category_name && (
                              <span className="ml-2 text-[10px] text-amber-300/90 bg-amber-500/15 border border-amber-500/25 px-1.5 py-0.5 rounded font-medium">
                                {ad.category_name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-amber-400 bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 rounded-lg">
                            ₹{parseFloat(ad.amount).toLocaleString("en-IN")}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteAdditionalService(ad.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/20 transition"
                            title="Delete this additional service"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/40 p-4 text-center text-xs text-slate-400">
                    {addonServiceId
                      ? "No additional services added yet for this service. Fill the form above to add one."
                      : "Please select a service above to view or add its additional services."}
                  </div>
                )}
              </div>
            </div>
          </div>
        </article>
      </section>

      {/* ============================================================== */}
      {/* BOTTOM SECTION: CURRENT SELECTION & HIERARCHY OVERVIEW */}
      {/* ============================================================== */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/55 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Active Service Hierarchy</p>
            <h4 className="mt-1 text-lg font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-400" />
              {selectedServiceName}
            </h4>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-200">
            <ArrowRight className="h-4 w-4" />
            Top-down service and addon structure is live and active
          </div>
        </div>

        {/* Categories list */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">
            Categories ({categories.length})
          </p>
          {categories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <span
                  key={category.category_id}
                  className="rounded-full border border-white/15 bg-slate-800/80 px-3.5 py-1.5 text-xs font-medium text-slate-200 hover:border-amber-400/50 transition"
                >
                  📁 {category.category_name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No categories created yet for this service.</p>
          )}
        </div>
      </section>
    </div>
  );
}
