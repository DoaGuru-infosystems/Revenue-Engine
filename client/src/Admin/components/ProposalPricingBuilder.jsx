// // UNUSED — Dead code. Replaced by inline pricing UI in ProposalBuilder.jsx.
// import React, { useEffect, useMemo, useState } from "react";
// import axios from "axios";
// import Swal from "sweetalert2";
// import {
//   BadgePercent,
//   CheckCircle2,
//   ChevronDown,
//   Gift,
//   IndianRupee,
//   Megaphone,
//   Package,
//   Palette,
//   Plus,
//   Search,
//   Trash2,
//   X,
// } from "lucide-react";
// import API_BASE_URL from "../../config/apiBaseUrl";

// const money = (value) => Number(value || 0).toLocaleString("en-IN");
// const asNumber = (value) => Number.parseFloat(value || 0) || 0;

// const makeRowId = (prefix) =>
//   `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// const billableTotal = (rows) =>
//   rows.reduce((sum, row) => {
//     if (row.include_in_total === false) return sum;
//     return sum + asNumber(row.total_price);
//   }, 0);

// const normalizeRow = (row) => {
//   let parsedServiceName = row.service_name;
//   let parsedCategoryName = row.category_name;
//   let parsedEditingTypeName = row.editing_type_name;

//   if (!parsedServiceName && !parsedCategoryName && row.service) {
//     const serviceString = row.service;
//     const matchEditing = serviceString.match(/\(([^)]+)\)$/);
//     if (matchEditing) {
//       parsedEditingTypeName = matchEditing[1];
//     }
//     const stringWithoutEditing = serviceString.replace(/\s*\([^)]+\)$/, '').trim();
//     const parts = stringWithoutEditing.split(' - ');
//     if (parts.length >= 2) {
//       parsedServiceName = parts[0].trim();
//       parsedCategoryName = parts.slice(1).join(' - ').trim();
//     } else {
//       parsedServiceName = stringWithoutEditing;
//     }
//   }

//   return {
//     include_in_total: row.include_in_total !== false,
//     quantity: Number(row.quantity || 1),
//     unit_price: asNumber(row.unit_price),
//     total_price: asNumber(row.total_price),
//     ...row,
//     service_name: parsedServiceName || row.service_name,
//     category_name: parsedCategoryName || row.category_name,
//     editing_type_name: parsedEditingTypeName || row.editing_type_name,
//   };
// };

// const getServiceDisplayName = (name) => {
//   if (!name) return name;
//   const lower = name.toLowerCase();
//   if (lower.includes("content posting")) return "Meta Growth & Content Management";
//   if (lower.includes("youtube video posting")) return "YouTube Channel Growth & Optimization";
//   if (lower.includes("google ad")) return "Google Ads Campaign Management & Optimization";
//   if (lower.includes("meta ad")) return "Meta Ads Campaign Management & Optimization";
//   return name;
// };

// export default function ProposalPricingBuilder({
//   pricingTable,
//   onPricingChange,
//   discountType,
//   discountValue,
//   onDiscountTypeChange,
//   onDiscountValueChange,
//   token,
//   currentUser,
//   onMergeNotes,
// }) {
//   const baseURL = API_BASE_URL;
//   const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

//   const [pricingMode, setPricingMode] = useState("custom");
//   const [activeCustomTool, setActiveCustomTool] = useState("");

//   const [serviceCatalog, setServiceCatalog] = useState([]);
//   const [optionalServices, setOptionalServices] = useState([]);
//   const [adsData, setAdsData] = useState([]);
//   const [planData, setPlanData] = useState([]);
//   const [allPlanNotes, setAllPlanNotes] = useState([]);
//   const [loadingCatalog, setLoadingCatalog] = useState(false);

//   const [serviceType, setServiceType] = useState("paid");
//   const [selectedService, setSelectedService] = useState("");
//   const [selectedCategory, setSelectedCategory] = useState("");
//   const [selectedEditingType, setSelectedEditingType] = useState(null);
//   const [quantity, setQuantity] = useState(1);
//   const [addons, setAddons] = useState({});

//   const [enteredAdsAmounts, setEnteredAdsAmounts] = useState({});
//   const [adsError, setAdsError] = useState("");

//   const [planSearch, setPlanSearch] = useState("");
//   const [selectedPlan, setSelectedPlan] = useState(null);
//   const [planOpen, setPlanOpen] = useState(false);

//   useEffect(() => {
//     const savedMode = pricingTable.find((row) => row.source_mode)?.source_mode;
//     if (savedMode === "plan" || savedMode === "custom") {
//       setPricingMode(savedMode);
//     }
//   }, []);

//   useEffect(() => {
//     const fetchCatalogs = async () => {
//       setLoadingCatalog(true);
//       try {
//         const [servicesRes, optionalRes, adsRes, planRes, notesRes] = await Promise.allSettled([
//           axios.get(`${baseURL}/auth/api/calculator/services/category/editing`, {
//             headers: authHeaders,
//           }),
//           axios.get(`${baseURL}/auth/api/calculator/optional-service-amounts`, {
//             headers: authHeaders,
//           }),
//           axios.get(`${baseURL}/auth/api/calculator/getAdsServices`, {
//             headers: authHeaders,
//           }),
//           axios.get(`${baseURL}/auth/api/calculator/getAllPlanData`, {
//             headers: authHeaders,
//           }),
//           axios.get(`${baseURL}/auth/api/calculator/getPlanNotes`, {
//             headers: authHeaders,
//           }),
//         ]);

//         if (servicesRes.status === "fulfilled") {
//           const rows = servicesRes.value.data?.data || [];
//           setServiceCatalog(rows.filter((service) => service.service_name?.toLowerCase() !== "complimentary"));
//         }

//         if (optionalRes.status === "fulfilled") {
//           const rows = optionalRes.value.data?.data || [];
//           setOptionalServices(rows);
//           const initial = {};
//           rows.forEach((item) => {
//             const key = item.editing_type_name?.toLowerCase().replace(/\s+/g, "_");
//             if (key) initial[key] = false;
//           });
//           setAddons(initial);
//         }

//         if (adsRes.status === "fulfilled") {
//           setAdsData(adsRes.value.data?.data || []);
//         }

//         if (planRes.status === "fulfilled") {
//           setPlanData(planRes.value.data?.data || []);
//         }

//         if (notesRes.status === "fulfilled") {
//           setAllPlanNotes(notesRes.value.data?.data || []);
//         }
//       } finally {
//         setLoadingCatalog(false);
//       }
//     };

//     fetchCatalogs();
//   }, [baseURL, token]);

//   const rows = useMemo(() => pricingTable.map(normalizeRow), [pricingTable]);
//   const subtotal = billableTotal(rows);
//   const discountAmount =
//     discountType === "Percentage" ? (subtotal * asNumber(discountValue)) / 100 : asNumber(discountValue);
//   const payableTotal = Math.max(0, subtotal - discountAmount);

//   const selectedServiceRecord = useMemo(
//     () => serviceCatalog.find((service) => service.service_name === selectedService),
//     [serviceCatalog, selectedService]
//   );

//   const selectedCategoryRecord = useMemo(
//     () => selectedServiceRecord?.categories?.find((category) => category.category_name === selectedCategory),
//     [selectedServiceRecord, selectedCategory]
//   );

//   const shouldShowAddons = selectedService === "Video Services" || selectedService === "Graphics Design";

//   const selectedAddonRows = useMemo(() => {
//     if (!shouldShowAddons) return [];
//     return optionalServices.filter((opt) => {
//       const key = opt.editing_type_name?.toLowerCase().replace(/\s+/g, "_");
//       if (!addons[key]) return false;
//       if (selectedService !== "Graphics Design") return true;
//       const name = opt.editing_type_name?.toLowerCase() || "";
//       return (
//         name !== "youtube video posting" &&
//         name !== "youtube channel growth & optimization" &&
//         name !== "thumbnail creation"
//       );
//     });
//   }, [addons, optionalServices, selectedService, shouldShowAddons]);

//   const servicePreview = useMemo(() => {
//     if (!selectedEditingType) return { baseAmount: 0, optionalTotal: 0, total: 0 };
//     const qty = Number(quantity || 1);
//     const baseAmount = asNumber(selectedEditingType.amount) * qty;
//     const optionalTotal = selectedAddonRows.reduce((sum, opt) => sum + asNumber(opt.amount) * qty, 0);
//     return { baseAmount, optionalTotal, total: baseAmount + optionalTotal };
//   }, [quantity, selectedAddonRows, selectedEditingType]);

//   const adsCategories = useMemo(
//     () => [...new Set(adsData.map((item) => item.ads_category).filter(Boolean))],
//     [adsData]
//   );

//   const adsPreview = useMemo(() => {
//     const errors = [];
//     const results = [];

//     Object.entries(enteredAdsAmounts).forEach(([category, rawAmount]) => {
//       if (!rawAmount || String(rawAmount).trim() === "") return;
//       const amount = asNumber(rawAmount);
//       if (amount <= 0) {
//         errors.push(`Invalid amount for ${category}`);
//         return;
//       }

//       const match = adsData
//         .filter((ad) => ad.ads_category === category)
//         .find((range) => {
//           const start = Number.parseFloat(range.amt_range_start);
//           const end = range.amt_range_end === "Above" ? Infinity : Number.parseFloat(range.amt_range_end);
//           return amount >= start && amount <= end;
//         });

//       if (!match) {
//         errors.push(`No matching slab for ${category}`);
//         return;
//       }

//       const percent = asNumber(match.percentage);
//       const charge = Math.round(((amount * percent) / 100) * 100) / 100;
//       results.push({
//         category,
//         amount,
//         percent,
//         charge,
//         total: amount + charge,
//       });
//     });

//     return { rows: results, errors };
//   }, [adsData, enteredAdsAmounts]);

//   const groupedPlans = useMemo(() => {
//     const grouped = {};
//     planData.forEach((item) => {
//       if (!grouped[item.plan_id]) {
//         grouped[item.plan_id] = {
//           id: item.plan_id,
//           title: item.plan_name,
//           features: [],
//           totalAmount: 0,
//         };
//       }

//       const qty = item.quantity ? ` x ${item.quantity}` : "";
//       grouped[item.plan_id].features.push(`${item.service_name} - ${item.category_name || "Service"}${qty}`);
//       if (item.service_name?.toLowerCase() !== "complimentary") {
//         grouped[item.plan_id].totalAmount += asNumber(item.total_amount || item.total_ads);
//       }
//     });

//     return Object.values(grouped);
//   }, [planData]);

//   const filteredPlans = useMemo(
//     () => groupedPlans.filter((plan) => plan.title?.toLowerCase().includes(planSearch.toLowerCase())),
//     [groupedPlans, planSearch]
//   );

//   const selectedPlanRows = useMemo(() => {
//     if (!selectedPlan) return [];
//     return planData.filter((item) => String(item.plan_id) === String(selectedPlan.id));
//   }, [planData, selectedPlan]);

//   const selectedPlanPricingRows = useMemo(
//     () =>
//       selectedPlanRows.map((item) => {
//         const isAds = item.service_name === "Ads Campaign";
//         const isComplimentary = item.service_name?.toLowerCase() === "complimentary";
//         const total = asNumber(isAds ? item.total_ads : item.total_amount);
//         const quantityValue = Number(item.quantity || 1);

//         return {
//           id: makeRowId("plan"),
//           source_mode: "plan",
//           source_type: isAds ? "plan_ads_campaign" : isComplimentary ? "plan_complimentary" : "plan_service",
//           source_plan_id: item.plan_id,
//           plan_name: item.plan_name,
//           service: isAds
//             ? `Ads Campaign - ${item.category_name}`
//             : `${item.service_name} - ${item.category_name || "Service"}${item.editing_type_name ? ` (${item.editing_type_name})` : ""}`,
//           service_name: item.service_name,
//           category_name: item.category_name,
//           editing_type_id: item.editing_type_id,
//           editing_type_name: item.editing_type_name,
//           quantity: isAds ? 1 : quantityValue,
//           unit_price: isAds ? total : quantityValue > 0 ? total / quantityValue : total,
//           total_price: isComplimentary ? 0 : total,
//           display_value: isComplimentary ? total : undefined,
//           include_in_total: !isComplimentary,
//           include_content_posting: item.include_content_posting || 0,
//           include_thumbnail_creation: item.include_thumbnail_creation || 0,
//           ad_budget: item.amount_ads,
//           ad_percent: item.percent_ads,
//           ad_charge: item.charge_ads,
//         };
//       }),
//     [selectedPlanRows]
//   );

//   const selectedPlanTotal = billableTotal(selectedPlanPricingRows);

//   const updateRows = (nextRows) => {
//     onPricingChange(nextRows.map(normalizeRow));
//   };

//   const clearSelectionForMode = () => {
//     setActiveCustomTool("");
//     setSelectedPlan(null);
//     setPlanSearch("");
//   };

//   const handleModeChange = async (nextMode) => {
//     if (nextMode === pricingMode) return;

//     if (rows.length > 0) {
//       const result = await Swal.fire({
//         title: "Switch pricing mode?",
//         text: "Current pricing items will be cleared before switching.",
//         icon: "warning",
//         showCancelButton: true,
//         confirmButtonText: "Switch",
//         cancelButtonText: "Cancel",
//       });

//       if (!result.isConfirmed) return;
//       updateRows([]);
//     }

//     setPricingMode(nextMode);
//     clearSelectionForMode();
//   };

//   const resetServiceForm = () => {
//     setSelectedService("");
//     setSelectedCategory("");
//     setSelectedEditingType(null);
//     setQuantity(1);
//     const resetAddons = {};
//     optionalServices.forEach((item) => {
//       const key = item.editing_type_name?.toLowerCase().replace(/\s+/g, "_");
//       if (key) resetAddons[key] = false;
//     });
//     setAddons(resetAddons);
//   };

//   const addServiceRow = () => {
//     if (!selectedService || !selectedCategory || !selectedEditingType) {
//       Swal.fire({
//         icon: "warning",
//         title: "Incomplete service",
//         text: "Please choose service, category and editing type first.",
//         timer: 1200,
//         showConfirmButton: false,
//       });
//       return;
//     }

//     const qty = Number(quantity || 1);
//     const includeValues = {
//       include_content_posting: 0,
//       include_thumbnail_creation: 0,
//       include_youtube_video_posting: 0,
//     };

//     selectedAddonRows.forEach((opt) => {
//       const key = opt.editing_type_name?.toLowerCase().replace(/\s+/g, "_");
//       const amount = asNumber(opt.amount);
//       if (key === "content_posting" || key === "meta_growth_&_content_management") {
//         includeValues.include_content_posting = amount;
//       }
//       if (key === "thumbnail_creation") {
//         includeValues.include_thumbnail_creation = amount;
//       }
//       if (key === "youtube_video_posting" || key === "youtube_channel_growth_&_optimization") {
//         includeValues.include_youtube_video_posting = amount;
//       }
//     });

//     const isComplimentary = serviceType === "complimentary";
//     const total = servicePreview.total;
//     const nextRow = normalizeRow({
//       id: makeRowId("custom-service"),
//       source_mode: "custom",
//       source_type: isComplimentary ? "custom_complimentary" : "service_calculator",
//       service: `${isComplimentary ? "Complimentary: " : ""}${selectedService} - ${selectedCategory} (${selectedEditingType.editing_type_name})`,
//       service_name: selectedService,
//       category_name: selectedCategory,
//       editing_type_id: selectedEditingType.editing_type_id,
//       editing_type_name: selectedEditingType.editing_type_name,
//       quantity: qty,
//       unit_price: qty > 0 ? total / qty : total,
//       total_price: isComplimentary ? 0 : total,
//       display_value: isComplimentary ? total : undefined,
//       include_in_total: !isComplimentary,
//       employee: currentUser?.name || "Admin",
//       optional_addons: selectedAddonRows.map((opt) => ({
//         name: opt.editing_type_name,
//         amount: asNumber(opt.amount),
//       })),
//       ...includeValues,
//     });

//     updateRows([...rows.filter((row) => row.source_mode !== "plan"), nextRow]);
//     resetServiceForm();
//   };

//   const addAdsRows = () => {
//     if (adsPreview.errors.length > 0) {
//       setAdsError(adsPreview.errors.join(", "));
//       return;
//     }

//     if (adsPreview.rows.length === 0) {
//       setAdsError("Enter at least one ad budget amount.");
//       return;
//     }

//     const nextAdsRows = adsPreview.rows.map((item) =>
//       normalizeRow({
//         id: makeRowId("ads"),
//         source_mode: "custom",
//         source_type: "ads_campaign",
//         service: `Ads Campaign - ${item.category}`,
//         service_name: "Ads Campaign",
//         category_name: item.category,
//         quantity: 1,
//         unit_price: item.total,
//         total_price: item.total,
//         include_in_total: true,
//         ad_budget: item.amount,
//         ad_percent: item.percent,
//         ad_charge: item.charge,
//         employee: currentUser?.name || "Admin",
//       })
//     );

//     const replacedCategories = new Set(nextAdsRows.map((row) => row.category_name));
//     const withoutSameAds = rows.filter(
//       (row) => row.source_type !== "ads_campaign" || !replacedCategories.has(row.category_name)
//     );

//     updateRows([...withoutSameAds.filter((row) => row.source_mode !== "plan"), ...nextAdsRows]);
//     setEnteredAdsAmounts({});
//     setAdsError("");
//   };

//   const applySelectedPlan = async () => {
//     if (!selectedPlan || selectedPlanPricingRows.length === 0) return;

//     if (rows.length > 0) {
//       const result = await Swal.fire({
//         title: "Replace pricing with this plan?",
//         text: "Plan pricing will replace current section 10 items.",
//         icon: "question",
//         showCancelButton: true,
//         confirmButtonText: "Apply Plan",
//         cancelButtonText: "Cancel",
//       });
//       if (!result.isConfirmed) return;
//     }

//     updateRows(selectedPlanPricingRows);

//     const notes = allPlanNotes
//       .filter((note) => String(note.plan) === String(selectedPlan.title))
//       .map((note) => ({
//         id: `plan-${selectedPlan.id}-${note.id || note.note_name}`,
//         note_name: note.note_name || note.note_text,
//         type: "plan",
//       }))
//       .filter((note) => note.note_name);

//     if (notes.length > 0) {
//       onMergeNotes(notes);
//     }
//   };

//   const removeRow = async (rowId) => {
//     const rowToDelete = rows.find((row) => row.id === rowId);
//     if (rowToDelete) {
//       try {
//         if (rowToDelete.source === "custom_graphic") {
//           await axios.delete(`${baseURL}/auth/api/calculator/deleteGraphicEntryById/${rowId}`, { headers: authHeaders });
//         } else if (rowToDelete.source === "custom_ads") {
//           await axios.delete(`${baseURL}/auth/api/calculator/deleteAdsCampaignEntryById/${rowId}`, { headers: authHeaders });
//         }
//       } catch (err) {
//         console.error("Failed to delete custom item from DB", err);
//       }
//     }
//     updateRows(rows.filter((row) => row.id !== rowId));
//   };

//   const renderCustomCards = () => (
//     <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
//       {[
//         {
//           id: "services",
//           title: "Graphic & SEO",
//           subtitle: "Visual Storytelling",
//           icon: Palette,
//           body: "Add service calculator items such as graphic, SEO, video, website and optional add-ons.",
//           bullets: ["Logo Design", "Brand Identity", "Print Materials", "Digital Graphics", "SEO Services"],
//         },
//         {
//           id: "ads",
//           title: "Ads Campaigns",
//           subtitle: "Strategic Growth",
//           icon: Megaphone,
//           body: "Calculate campaign budget, service charge and total investment for ad campaigns.",
//           bullets: ["Social Media Ads", "Google Ads", "Campaign Strategy", "Analytics & ROI"],
//         },
//       ].map((card) => {
//         const Icon = card.icon;
//         const active = activeCustomTool === card.id;
//         return (
//           <button
//             type="button"
//             key={card.id}
//             onClick={() => setActiveCustomTool(active ? "" : card.id)}
//             className={`text-left rounded-xl border p-5 transition ${
//               active
//                 ? "border-red-500 bg-red-500/10"
//                 : "border-gray-700 bg-gray-900/40 hover:border-gray-500"
//             }`}
//           >
//             <div className="w-11 h-11 rounded-xl bg-red-600 flex items-center justify-center mb-5">
//               <Icon className="w-5 h-5 text-white" />
//             </div>
//             <h4 className="text-xl font-bold text-white">{card.title}</h4>
//             <p className="text-xs uppercase tracking-[0.2em] text-red-400 mt-2">{card.subtitle}</p>
//             <p className="text-sm text-gray-400 mt-5 leading-relaxed">{card.body}</p>
//             <div className="mt-6 space-y-2">
//               {card.bullets.map((bullet) => (
//                 <div key={bullet} className="flex items-center gap-2 text-sm text-gray-400">
//                   <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
//                   {bullet}
//                 </div>
//               ))}
//             </div>
//             <div className="mt-6 rounded-lg bg-gray-700 px-4 py-2 text-center text-sm font-semibold text-white">
//               {active ? "Close" : "Get Started"}
//             </div>
//           </button>
//         );
//       })}
//     </div>
//   );

//   const renderServiceCalculator = () => (
//     <div className="rounded-xl border border-gray-700 bg-gray-900/40 p-4 space-y-4">
//       <div className="flex items-center justify-between gap-3">
//         <div>
//           <h4 className="font-bold text-white">Service Calculator</h4>
//           <p className="text-xs text-gray-500">Build proposal service rows with live totals.</p>
//         </div>
//         <button
//           type="button"
//           onClick={() => setActiveCustomTool("")}
//           className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white"
//         >
//           <X className="w-4 h-4" />
//         </button>
//       </div>

//       <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-800 p-1 border border-gray-700">
//         {[
//           { value: "paid", label: "Paid Service" },
//           { value: "complimentary", label: "Complimentary" },
//         ].map((item) => (
//           <button
//             type="button"
//             key={item.value}
//             onClick={() => setServiceType(item.value)}
//             className={`rounded-lg py-2 text-sm font-semibold transition ${
//               serviceType === item.value ? "bg-red-600 text-white" : "text-gray-400 hover:bg-gray-700"
//             }`}
//           >
//             {item.label}
//           </button>
//         ))}
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//         <label className="space-y-1">
//           <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Service</span>
//           <select
//             value={selectedService}
//             onChange={(event) => {
//               setSelectedService(event.target.value);
//               setSelectedCategory("");
//               setSelectedEditingType(null);
//             }}
//             className="w-full rounded-lg border border-gray-700 bg-gray-800 p-2.5 text-sm text-white outline-none focus:border-red-500"
//           >
//             <option value="">-- Choose --</option>
//             {serviceCatalog.map((service) => (
//               <option key={service.service_id} value={service.service_name}>
//                 {service.service_name}
//               </option>
//             ))}
//           </select>
//         </label>

//         <label className="space-y-1">
//           <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Category</span>
//           <select
//             value={selectedCategory}
//             disabled={!selectedServiceRecord}
//             onChange={(event) => {
//               setSelectedCategory(event.target.value);
//               setSelectedEditingType(null);
//             }}
//             className="w-full rounded-lg border border-gray-700 bg-gray-800 p-2.5 text-sm text-white outline-none focus:border-red-500 disabled:opacity-50"
//           >
//             <option value="">-- Choose --</option>
//             {selectedServiceRecord?.categories?.map((category) => (
//               <option key={category.category_id} value={category.category_name}>
//                 {category.category_name}
//               </option>
//             ))}
//           </select>
//         </label>

//         <label className="space-y-1">
//           <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Editing Type</span>
//           <select
//             value={selectedEditingType?.editing_type_id || ""}
//             disabled={!selectedCategoryRecord}
//             onChange={(event) => {
//               const editing = selectedCategoryRecord?.editing_types?.find(
//                 (item) => String(item.editing_type_id) === String(event.target.value)
//               );
//               setSelectedEditingType(editing || null);
//             }}
//             className="w-full rounded-lg border border-gray-700 bg-gray-800 p-2.5 text-sm text-white outline-none focus:border-red-500 disabled:opacity-50"
//           >
//             <option value="">-- Choose --</option>
//             {selectedCategoryRecord?.editing_types?.map((editing) => (
//               <option key={editing.editing_type_id} value={editing.editing_type_id}>
//                 {editing.editing_type_name} - Rs {money(editing.amount)}
//               </option>
//             ))}
//           </select>
//         </label>

//         <label className="space-y-1">
//           <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Quantity</span>
//           <input
//             type="number"
//             min="1"
//             value={quantity}
//             onChange={(event) => setQuantity(Math.max(1, Number(event.target.value || 1)))}
//             className="w-full rounded-lg border border-gray-700 bg-gray-800 p-2.5 text-sm text-white outline-none focus:border-red-500"
//           />
//         </label>
//       </div>

//       {shouldShowAddons && optionalServices.length > 0 && (
//         <div className="space-y-2">
//           <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Optional Add-ons</span>
//           <div className="flex flex-wrap gap-2">
//             {optionalServices
//               .filter((opt) => {
//                 if (selectedService !== "Graphics Design") return true;
//                 const name = opt.editing_type_name?.toLowerCase() || "";
//                 return (
//                   name !== "youtube video posting" &&
//                   name !== "youtube channel growth & optimization" &&
//                   name !== "thumbnail creation"
//                 );
//               })
//               .map((opt) => {
//                 const key = opt.editing_type_name?.toLowerCase().replace(/\s+/g, "_");
//                 const enabled = !!addons[key];
//                 return (
//                   <button
//                     type="button"
//                     key={key}
//                     onClick={() => setAddons((prev) => ({ ...prev, [key]: !enabled }))}
//                     className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
//                       enabled
//                         ? "border-yellow-500 bg-yellow-500/15 text-yellow-300"
//                         : "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-500"
//                     }`}
//                   >
//                     {getServiceDisplayName(opt.editing_type_name)} + Rs {money(opt.amount)}
//                   </button>
//                 );
//               })}
//           </div>
//         </div>
//       )}

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-xl border border-gray-700 bg-gray-800/70 p-4">
//         <div>
//           <p className="text-xs uppercase tracking-wide text-gray-500">Base</p>
//           <p className="font-semibold text-white">Rs {money(servicePreview.baseAmount)}</p>
//         </div>
//         <div>
//           <p className="text-xs uppercase tracking-wide text-gray-500">Add-ons</p>
//           <p className="font-semibold text-white">Rs {money(servicePreview.optionalTotal)}</p>
//         </div>
//         <div>
//           <p className="text-xs uppercase tracking-wide text-gray-500">Live Total</p>
//           <p className="font-bold text-red-400">Rs {money(servicePreview.total)}</p>
//         </div>
//       </div>

//       <div className="flex flex-wrap gap-2">
//         <button
//           type="button"
//           onClick={addServiceRow}
//           className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500"
//         >
//           Calculate & Add
//         </button>
//         <button
//           type="button"
//           onClick={resetServiceForm}
//           className="rounded-lg border border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-300 hover:bg-gray-800"
//         >
//           Reset
//         </button>
//       </div>
//     </div>
//   );

//   const renderAdsCalculator = () => (
//     <div className="rounded-xl border border-gray-700 bg-gray-900/40 p-4 space-y-4">
//       <div className="flex items-center justify-between gap-3">
//         <div>
//           <h4 className="font-bold text-white">Ads Campaign Budget Calculator</h4>
//           <p className="text-xs text-gray-500">Enter ad budgets and add calculated campaign totals.</p>
//         </div>
//         <button
//           type="button"
//           onClick={() => setActiveCustomTool("")}
//           className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white"
//         >
//           <X className="w-4 h-4" />
//         </button>
//       </div>

//       <div className="space-y-3">
//         {adsCategories.map((category) => (
//           <label key={category} className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-3 items-center">
//             <span className="text-sm font-semibold text-gray-300">{category}</span>
//             <input
//               type="number"
//               min="0"
//               value={enteredAdsAmounts[category] || ""}
//               onChange={(event) => {
//                 setAdsError("");
//                 setEnteredAdsAmounts((prev) => ({ ...prev, [category]: event.target.value }));
//               }}
//               className="rounded-lg border border-gray-700 bg-gray-800 p-2.5 text-sm text-white outline-none focus:border-red-500"
//               placeholder="Enter amount"
//             />
//           </label>
//         ))}
//       </div>

//       {adsError && (
//         <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
//           {adsError}
//         </div>
//       )}

//       {adsPreview.rows.length > 0 && (
//         <div className="overflow-x-auto rounded-xl border border-gray-700">
//           <table className="w-full text-left text-sm">
//             <thead className="bg-gray-800 text-xs uppercase tracking-wide text-gray-400">
//               <tr>
//                 <th className="px-3 py-2">Category</th>
//                 <th className="px-3 py-2">Budget</th>
//                 <th className="px-3 py-2">Charge</th>
//                 <th className="px-3 py-2">Total</th>
//               </tr>
//             </thead>
//             <tbody>
//               {adsPreview.rows.map((item) => (
//                 <tr key={item.category} className="border-t border-gray-700">
//                   <td className="px-3 py-2 text-white">{item.category}</td>
//                   <td className="px-3 py-2 text-gray-300">Rs {money(item.amount)}</td>
//                   <td className="px-3 py-2 text-gray-300">
//                     {item.percent}% = Rs {money(item.charge)}
//                   </td>
//                   <td className="px-3 py-2 font-semibold text-yellow-400">Rs {money(item.total)}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}

//       <div className="flex flex-wrap gap-2">
//         <button
//           type="button"
//           onClick={addAdsRows}
//           className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500"
//         >
//           Calculate & Add
//         </button>
//         <button
//           type="button"
//           onClick={() => {
//             setEnteredAdsAmounts({});
//             setAdsError("");
//           }}
//           className="rounded-lg border border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-300 hover:bg-gray-800"
//         >
//           Clear All
//         </button>
//       </div>
//     </div>
//   );

//   const renderPlanSelector = () => (
//     <div className="space-y-4">
//       <div className="relative">
//         <div className="flex gap-2">
//           <div className="relative flex-1">
//             <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
//             <input
//               value={planSearch}
//               onFocus={() => setPlanOpen(true)}
//               onChange={(event) => {
//                 setPlanSearch(event.target.value);
//                 setPlanOpen(true);
//               }}
//               className="w-full rounded-xl border border-gray-700 bg-gray-900/60 py-3 pl-10 pr-3 text-sm text-white outline-none focus:border-yellow-500"
//               placeholder="Type to search a plan..."
//             />
//           </div>
//           <button
//             type="button"
//             onClick={() => setPlanOpen((prev) => !prev)}
//             className="flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-4 text-sm font-semibold text-gray-300"
//           >
//             Plans <ChevronDown className={`h-4 w-4 transition ${planOpen ? "rotate-180" : ""}`} />
//           </button>
//         </div>

//         {planOpen && filteredPlans.length > 0 && (
//           <div className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-gray-700 bg-gray-900 shadow-xl">
//             {filteredPlans.map((plan) => (
//               <button
//                 type="button"
//                 key={plan.id}
//                 onClick={() => {
//                   setSelectedPlan(plan);
//                   setPlanSearch(plan.title);
//                   setPlanOpen(false);
//                 }}
//                 className="flex w-full items-center justify-between gap-3 border-b border-gray-800 px-4 py-3 text-left text-sm text-gray-300 hover:bg-gray-800"
//               >
//                 <span className="font-semibold">{plan.title}</span>
//                 <span className="rounded-md bg-yellow-400/10 px-2 py-1 text-xs font-bold text-yellow-300">
//                   Rs {money(plan.totalAmount)}
//                 </span>
//               </button>
//             ))}
//           </div>
//         )}
//       </div>

//       {selectedPlan ? (
//         <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4">
//           <div className="flex flex-wrap items-center justify-between gap-3">
//             <div>
//               <h4 className="font-bold text-white">{selectedPlan.title}</h4>
//               <p className="text-xs text-gray-400">{selectedPlanRows.length} plan items ready for proposal</p>
//             </div>
//             <div className="text-right">
//               <p className="text-xs uppercase tracking-wide text-gray-500">Plan Total</p>
//               <p className="text-xl font-bold text-yellow-400">Rs {money(selectedPlanTotal)}</p>
//             </div>
//           </div>

//           <div className="mt-4 max-h-72 overflow-y-auto rounded-xl border border-gray-700">
//             <table className="w-full text-left text-sm">
//               <thead className="bg-gray-900/70 text-xs uppercase tracking-wide text-gray-400">
//                 <tr>
//                   <th className="px-3 py-2">Category</th>
//                   <th className="px-3 py-2">Service</th>
//                   <th className="px-3 py-2">Qty</th>
//                   <th className="px-3 py-2">Total</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {selectedPlanPricingRows.map((row) => (
//                   <tr key={row.id} className="border-t border-gray-700">
//                     <td className="px-3 py-2 text-gray-300">
//                       {row.category_name || '-'}
//                     </td>
//                     <td className="px-3 py-2 text-white">
//                       {row.service_name || row.service || '-'}
//                       {row.editing_type_name ? <span className="text-gray-400 text-xs ml-1">({row.editing_type_name})</span> : ''}
//                       {row.include_in_total === false && (
//                         <span className="ml-2 rounded bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-300">
//                           Complimentary value Rs {money(row.display_value)}
//                         </span>
//                       )}
//                     </td>
//                     <td className="px-3 py-2 text-gray-300">{row.quantity}</td>
//                     <td className="px-3 py-2 font-semibold text-yellow-400">Rs {money(row.total_price)}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//           <button
//             type="button"
//             onClick={applySelectedPlan}
//             className="mt-4 w-full rounded-lg bg-yellow-500 px-4 py-2.5 text-sm font-bold text-gray-950 hover:bg-yellow-400"
//           >
//             Apply Plan to Proposal
//           </button>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//           {groupedPlans.slice(0, 6).map((plan) => (
//             <button
//               type="button"
//               key={plan.id}
//               onClick={() => {
//                 setSelectedPlan(plan);
//                 setPlanSearch(plan.title);
//               }}
//               className="rounded-xl border border-gray-700 bg-gray-900/40 p-4 text-left hover:border-yellow-500/50"
//             >
//               <div className="flex items-start justify-between gap-3">
//                 <h4 className="font-semibold text-white">{plan.title}</h4>
//                 <span className="shrink-0 text-sm font-bold text-yellow-400">Rs {money(plan.totalAmount)}</span>
//               </div>
//               <p className="mt-2 line-clamp-2 text-xs text-gray-500">{plan.features.slice(0, 3).join(", ")}</p>
//             </button>
//           ))}
//         </div>
//       )}
//     </div>
//   );

//   return (
//     <div className="space-y-5">
//       {loadingCatalog && (
//         <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
//           Loading pricing catalogs...
//         </div>
//       )}

//       <div className="grid grid-cols-2 gap-2 rounded-xl border border-gray-700 bg-gray-900/60 p-1">
//         {[
//           { value: "custom", label: "Custom" },
//           { value: "plan", label: "Plan" },
//         ].map((mode) => (
//           <button
//             type="button"
//             key={mode.value}
//             onClick={() => handleModeChange(mode.value)}
//             className={`rounded-lg py-2.5 text-sm font-bold transition ${
//               pricingMode === mode.value ? "bg-red-600 text-white" : "text-gray-400 hover:bg-gray-800"
//             }`}
//           >
//             {mode.label}
//           </button>
//         ))}
//       </div>

//       {pricingMode === "custom" ? (
//         <div className="space-y-4">
//           {renderCustomCards()}
//           {activeCustomTool === "services" && renderServiceCalculator()}
//           {activeCustomTool === "ads" && renderAdsCalculator()}
//         </div>
//       ) : (
//         renderPlanSelector()
//       )}

//       <div className="rounded-xl border border-gray-700 bg-gray-900/40">
//         <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-700 p-4">
//           <div>
//             <h4 className="font-bold text-white flex items-center gap-2">
//               <Package className="h-4 w-4 text-red-400" /> Proposal Pricing Items
//             </h4>
//             <p className="text-xs text-gray-500">These rows are saved inside the proposal and inherited by proforma.</p>
//           </div>
//           <div className="rounded-lg bg-gray-800 px-3 py-2 text-sm font-semibold text-white">
//             {rows.length} item{rows.length === 1 ? "" : "s"}
//           </div>
//         </div>

//         {rows.length === 0 ? (
//           <div className="p-8 text-center text-sm text-gray-500">No proposal pricing items added yet.</div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="w-full text-left text-sm">
//               <thead className="text-xs uppercase tracking-wide text-gray-400">
//                 <tr className="border-b border-gray-800">
//                   <th className="px-4 py-3">Category Name</th>
//                   <th className="px-4 py-3">Service / Deliverable</th>
//                   <th className="px-4 py-3">Qty</th>
//                   <th className="px-4 py-3">Unit Price</th>
//                   <th className="px-4 py-3">Total</th>
//                   <th className="px-4 py-3"></th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {rows.map((row) => (
//                   <tr key={row.id || row.service} className="border-b border-gray-800">
//                     <td className="px-4 py-3 text-white">
//                       <div className="font-semibold">{row.category_name || '-'}</div>
//                       <div className="mt-1 flex flex-wrap gap-2">
//                         {row.source_mode && (
//                           <span className="rounded bg-red-500/10 px-2 py-0.5 text-xs text-red-300">
//                             {row.source_mode === "plan" ? row.plan_name || "Plan" : "Custom"}
//                           </span>
//                         )}
//                         {row.include_in_total === false && (
//                           <span className="rounded bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-300">
//                             Complimentary value Rs {money(row.display_value)}
//                           </span>
//                         )}
//                       </div>
//                     </td>
//                     <td className="px-4 py-3 text-white">
//                       <div className="font-semibold">
//                         {row.service_name || row.service || '-'}
//                         {row.editing_type_name ? <span className="text-gray-400 text-xs ml-1">({row.editing_type_name})</span> : ''}
//                       </div>
//                     </td>
//                     <td className="px-4 py-3 text-gray-300">{row.quantity}</td>
//                     <td className="px-4 py-3 text-gray-300">Rs {money(row.unit_price)}</td>
//                     <td className="px-4 py-3 font-semibold text-yellow-400">Rs {money(row.total_price)}</td>
//                     <td className="px-4 py-3 text-right">
//                       <button
//                         type="button"
//                         onClick={() => removeRow(row.id)}
//                         className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"
//                       >
//                         <Trash2 className="h-4 w-4" />
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
//         <div className="rounded-xl border border-gray-700 bg-gray-900/40 p-4">
//           <h4 className="mb-3 flex items-center gap-2 font-bold text-white">
//             <BadgePercent className="h-4 w-4 text-yellow-400" /> Discount
//           </h4>
//           <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-3">
//             <select
//               value={discountType}
//               onChange={(event) => onDiscountTypeChange(event.target.value)}
//               className="rounded-lg border border-gray-700 bg-gray-800 p-2.5 text-sm text-white outline-none focus:border-red-500"
//             >
//               <option value="Amount">Amount</option>
//               <option value="Percentage">Percentage</option>
//             </select>
//             <input
//               type="number"
//               min="0"
//               value={discountValue}
//               onChange={(event) => onDiscountValueChange(Number(event.target.value || 0))}
//               className="rounded-lg border border-gray-700 bg-gray-800 p-2.5 text-sm text-white outline-none focus:border-red-500"
//               placeholder="Discount value"
//             />
//           </div>
//         </div>

//         <div className="rounded-xl border border-gray-700 bg-gray-900/60 p-4 space-y-3">
//           <div className="flex justify-between text-sm text-gray-400">
//             <span>Subtotal</span>
//             <span className="font-semibold text-white">Rs {money(subtotal)}</span>
//           </div>
//           {discountAmount > 0 && (
//             <div className="flex justify-between text-sm text-red-300">
//               <span>Discount</span>
//               <span>- Rs {money(discountAmount)}</span>
//             </div>
//           )}
//           <div className="h-px bg-gray-700" />
//           <div className="flex justify-between text-base font-bold text-white">
//             <span>Grand Total</span>
//             <span className="text-yellow-400">Rs {money(payableTotal)}</span>
//           </div>
//           <div className="flex items-center gap-2 text-xs text-gray-500">
//             <CheckCircle2 className="h-3.5 w-3.5 text-yellow-400" />
//             Saved as proposal pricing snapshot
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
