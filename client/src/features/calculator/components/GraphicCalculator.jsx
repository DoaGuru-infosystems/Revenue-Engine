import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useLocation, useParams } from "react-router-dom";
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
  User,
  X,
  StickyNote,
  Notebook,
  ChevronUp,
  ChevronDown,
  IndianRupee,
  Tag,
  Percent,
  BadgePercent,
  Trash2,
  Pencil,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import DiscountCard from "../../../shared/invoice-calculator/DiscountCard";
import DiscountModal from "../../../shared/invoice-calculator/DiscountModal";
import ComplimentaryCalculator from "./ComplimentaryCalculator";
import {
  useGraphicCalculatorData,
  useGraphicCalculatorDiscount,
  useGraphicCalculatorNotes,
  isComplimentaryItem,
} from "../hooks";
import { getBasePathFromLocation, servicesLandingPath } from "../../../utils/rolePaths";

const GraphicCalculator = ({
  hideNotes,
  onSaveComplete,
  proposalIdOverride,
  onServiceAdded,
  onServiceDeleted,
  embeddedData,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, token } = useSelector((state) => state.user);
  const userName = currentUser?.name;
  const params = useParams();
  const id = params.id || params.clientId;
  const proposalId =
    proposalIdOverride !== undefined ? proposalIdOverride : params.proposalId;
  const searchParams = new URLSearchParams(location.search);
  const docTypeFromURL = searchParams.get("doc");

  // Quotation mode from location.state
  const locationState = location.state || {};
  const quotationSearch = new URLSearchParams(location.search);
  const isQuotationMode =
    locationState.mode === "quotation" || quotationSearch.get("mode") === "quotation";
  const quotationId = locationState.quotationId || (isQuotationMode ? proposalId : null);

  // ── Layer 2: Custom Hooks ────────────────────────────────────────────────
  const {
    data,
    optionalServices,
    getData,
    serviceType,
    setServiceType,
    selectedService,
    setSelectedService,
    selectedCategory,
    setSelectedCategory,
    selectedEditingType,
    setSelectedEditingType,
    quantity,
    setQuantity,
    addons,
    setAddons,
    selectedAdditionalServices,
    setSelectedAdditionalServices,
    editId,
    loading: loadingData,
    getSelectedService,
    getSelectedCategory,
    availableAddons,
    grandTotal,
    handleEdit,
    handleSave,
    handleDelete,
    resetForm,
  } = useGraphicCalculatorData({
    id,
    proposalId,
    token,
    userName,
    docTypeFromURL,
    onServiceAdded,
    onServiceDeleted,
    onSaveComplete,
    embeddedData,
    locationState: location.state,
    mode: isQuotationMode ? "quotation" : undefined,
    quotationId: isQuotationMode ? quotationId : undefined,
  });

  const {
    selecteddiscount,
    discountDataSet,
    discountAmount,
    totalAfterDiscount,
    showModalDiscount,
    loadingDiscount,
    formDataDiscount,
    handleShowDiscount,
    handleCloseDiscount,
    handleChangeDiscount,
    handleSaveDiscount,
    handleDeleteDiscount,
  } = useGraphicCalculatorDiscount({
    id,
    proposalId,
    grandTotal,
    token,
    mode: isQuotationMode ? "quotation" : undefined,
  });

  const {
    allClientNote,
    selectedNotes,
    manualNote,
    setManualNote,
    selectedNote,
    isOpen,
    setIsOpen,
    dropdownRef,
    uniquePredefinedNotes,
    showModal,
    setShowModal,
    isEditing,
    setIsEditing,
    selectedNotesId,
    setSelectedNotesId,
    loadingNotes,
    formData,
    setFormData,
    handleSelect,
    handleAddManualNote,
    handleRemoveNote,
    handleSaveNotes,
    handleDeleteClientNote,
    handleCloseModal: handleClose,
    handleChangeFormData: handleChange,
    handleSubmitModal: handleSubmit,
  } = useGraphicCalculatorNotes({
    id,
    proposalId,
    token,
    hideNotes,
    mode: isQuotationMode ? "quotation" : undefined,
    quotationId: isQuotationMode ? quotationId : undefined,
  });

  const loading = loadingData || loadingDiscount || loadingNotes;

  const getServiceDisplayName = (name) => {
    if (!name) return name;
    const n = name.toLowerCase();
    if (n.includes("content posting")) return "Meta Growth & Content Management";
    if (n.includes("youtube video posting")) return "YouTube Channel Growth & Optimization";
    if (n.includes("google ad")) return "Google Ads Campaign Management & Optimization";
    if (n.includes("meta ad")) return "Meta Ads Campaign Management & Optimization";
    return name;
  };

  const embedded = Boolean(onServiceAdded);
  const selectCls =
    "w-full min-h-11 rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-base text-white focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 disabled:bg-gray-800 disabled:text-gray-500 touch-manipulation";
  const labelCls =
    "block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1";
  const cardCls = "bg-gray-800 rounded-xl border border-gray-700 shadow-sm p-5";

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      const base = getBasePathFromLocation(location);
      const fallbackUrl =
        docTypeFromURL === "proforma"
          ? servicesLandingPath(base, id, proposalId, "doc=proforma")
          : servicesLandingPath(base, id, proposalId);
      navigate(fallbackUrl);
    }
  };

  return (
    <>
      <div className={embedded ? "w-full bg-transparent" : "min-h-screen bg-gray-900"}>
        <div className={embedded ? "w-full space-y-4" : "max-w-3xl mx-auto px-4 py-8 space-y-5"}>

          {!embedded && (
          <div className="flex items-center gap-3">
            {!onServiceAdded && (
              <button
                type="button"
                onClick={handleBack}
                className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white flex items-center gap-1.5 transition shadow-sm"
                title="Go Back"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-xs font-semibold pr-1 hidden sm:inline">Back</span>
              </button>
            )}
            <div>
              <h1 className="text-xl font-bold text-white">Service Calculator</h1>
              <p className="text-xs text-gray-500">Build &amp; save service quotations</p>
            </div>
          </div>
          )}

          {/* Service Type Toggle */ }
          <div className="flex gap-2 p-1 bg-gray-800 rounded-xl border border-gray-700">
            { [{ val: "paid", label: " Paid Service" }, { val: "complimentary", label: " Complimentary" }].map(({ val, label }) => (
              <button key={ val } onClick={ () => setServiceType(val) }
                className={ `flex-1 min-h-11 py-2.5 rounded-lg text-sm font-semibold transition-all touch-manipulation ${serviceType === val ? "bg-red-600 text-white shadow" : "text-gray-400 hover:text-white hover:bg-gray-700"}` }>
                { label }
              </button>
            )) }
          </div>

          { serviceType === "paid" ? (
            <div className="space-y-4">

              {/* Form Card */ }
              <div className={ cardCls + " space-y-4" }>
                <p className={ `text-xs font-bold uppercase tracking-widest ${editId ? "text-amber-500" : "text-red-500"}` }>
                  { editId ? "✏️ Editing Entry" : "➕ Add New Service" }
                </p>

                {/* Row 1: Service + Category */ }
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={ labelCls }>Service</label>
                    <select value={ selectedService } disabled={ !!editId } className={ selectCls }
                      onChange={ (e) => { setSelectedService(e.target.value); setSelectedCategory(""); setSelectedEditingType(null); setSelectedAdditionalServices([]); } }>
                      <option value="">-- Choose --</option>
                      { data.map((s) => <option key={ s.service_id } value={ s.service_name }>{ s.service_name }</option>) }
                    </select>
                  </div>
                  <div>
                    <label className={ labelCls }>Category</label>
                    <select value={ selectedCategory } disabled={ !getSelectedService } className={ selectCls }
                      onChange={ (e) => { 
                        const catName = e.target.value;
                        setSelectedCategory(catName);
                        setSelectedAdditionalServices([]);
                        const category = getSelectedService?.categories.find(c => c.category_name === catName);
                        const hasRealEditingTypes = category?.editing_types?.some(
                          et => et.editing_type_name && et.editing_type_name.trim() !== "" && et.editing_type_name !== "null" && et.editing_type_name !== "N/A"
                        );
                        if (category && category.editing_types && category.editing_types.length === 1 && !hasRealEditingTypes) {
                          setSelectedEditingType(category.editing_types[0]);
                        } else {
                          setSelectedEditingType(null);
                        }
                      } }>
                      <option value="">-- Choose Category --</option>
                      { getSelectedService?.categories.map((c) => <option key={ c.category_id } value={ c.category_name }>{ c.category_name }</option>) }
                    </select>
                  </div>
                </div>

                {/* Row 2: Editing Type + Quantity */ }
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  { (getSelectedCategory?.editing_types?.some(et => et.editing_type_name && et.editing_type_name.trim() !== "" && et.editing_type_name !== "null" && et.editing_type_name !== "N/A") || (getSelectedCategory?.editing_types?.length > 1)) && (
                    <div>
                      <label className={ labelCls }>Editing Type <span className="text-red-500 font-bold">*</span></label>
                      <select
                        value={ (() => {
                          if (selectedEditingType?.editing_type_id) return selectedEditingType.editing_type_id;
                          if (selectedEditingType?.editing_type_name && getSelectedCategory?.editing_types) {
                            const found = getSelectedCategory.editing_types.find(
                              (et) => et.editing_type_name && et.editing_type_name.trim().toLowerCase() === selectedEditingType.editing_type_name.trim().toLowerCase()
                            );
                            if (found) return found.editing_type_id;
                          }
                          return "";
                        })() }
                        disabled={ !getSelectedCategory }
                        className={ selectCls }
                        onChange={ (e) => { const ed = getSelectedCategory?.editing_types.find((et) => et.editing_type_id === parseInt(e.target.value)); setSelectedEditingType(ed || null); } }
                      >
                        <option value="">-- Choose Editing Type (Required) --</option>
                        { getSelectedCategory?.editing_types.map((ed) => <option key={ ed.editing_type_id } value={ ed.editing_type_id }>{ ed.editing_type_name || "Standard" } — ₹{ ed.amount }</option>) }
                      </select>
                    </div>
                  ) }
                  <div>
                    <label className={ labelCls }>Quantity</label>
                    <input type="number" min={ 1 } value={ quantity } onChange={ (e) => setQuantity(parseInt(e.target.value) || 1) }
                      className={ selectCls } />
                  </div>
                </div>

                {/* Optional Add-ons */ }
                { (selectedService === "Video Services" || selectedService === "Graphics Design") && optionalServices?.length > 0 && (
                  <div>
                    <label className={ labelCls }>Optional Add-ons</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      { optionalServices
                        .filter((opt) => {
                          if (selectedService !== "Graphics Design") return true;
                          const name = opt.editing_type_name?.toLowerCase() || "";
                          return name !== "youtube video posting" &&
                            name !== "youtube channel growth & optimization" &&
                            name !== "thumbnail creation";
                        })
                        .map((opt) => {
                          const key = opt.editing_type_name.toLowerCase().replace(/\s+/g, "_");
                          return (
                            <button
                              type="button"
                              key={ key }
                              onClick={ () => setAddons((p) => ({ ...p, [key]: !p[key] })) }
                              className={ `min-h-11 flex items-center justify-between gap-3 bg-gray-700 border rounded-lg px-3 py-2 touch-manipulation ${addons[key] ? "border-green-500" : "border-gray-600"}` }
                            >
                              <span className="text-sm text-white font-medium text-left">{ getServiceDisplayName(opt.editing_type_name) }</span>
                              <span className={ `shrink-0 text-xs font-bold px-2.5 py-1 rounded-md ${addons[key] ? "bg-green-600 text-white" : "bg-gray-600 text-gray-200"}` }>
                                { addons[key] ? `Added · ₹${opt.amount}` : `Add · ₹${opt.amount}` }
                              </span>
                            </button>
                          );
                        }) }
                    </div>
                  </div>
                ) }

                {/* Additional Services (Checkboxes) */}
                { selectedCategory && availableAddons.length > 0 && (
                  <div className="bg-gray-700/50 rounded-xl p-3 border border-gray-600 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className={ labelCls }>Additional Services</label>
                      <span className="text-[11px] text-gray-400">
                        (Qty: {quantity})
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                      { availableAddons.map((addon) => {
                        const addonName = addon.name || addon.additional_service_name;
                        const isChecked = selectedAdditionalServices.some(
                          (item) => String(item.id) === String(addon.id) || (item.name || item.additional_service_name) === addonName
                        );
                        return (
                          <label
                            key={ addon.id }
                            className={ `flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition select-none ${
                              isChecked
                                ? "bg-red-500/15 border-red-500/50 text-white"
                                : "bg-gray-800/60 border-gray-600 text-gray-300 hover:bg-gray-700/70"
                            }` }
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={ isChecked }
                                onChange={ (e) => {
                                  if (e.target.checked) {
                                    setSelectedAdditionalServices((prev) => [
                                      ...prev,
                                      {
                                        id: addon.id,
                                        name: addonName,
                                        additional_service_name: addonName,
                                        amount: Number(addon.amount) || 0,
                                        category_id: addon.category_id || getSelectedCategory?.category_id,
                                        category_name: addon.category_name || getSelectedCategory?.category_name,
                                        service_name: selectedService,
                                      },
                                    ]);
                                  } else {
                                    setSelectedAdditionalServices((prev) =>
                                      prev.filter(
                                        (item) =>
                                          String(item.id) !== String(addon.id) &&
                                          (item.name || item.additional_service_name) !== addonName
                                      )
                                    );
                                  }
                                } }
                                className="w-4 h-4 rounded text-red-600 bg-gray-700 border-gray-500 focus:ring-red-500 focus:ring-offset-gray-800"
                              />
                              <span className="text-sm font-medium truncate">{ addonName }</span>
                            </div>
                            <div className="flex flex-col items-end flex-shrink-0 ml-2">
                              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                + ₹{ Number(addon.amount).toLocaleString() }
                              </span>
                              { quantity > 1 && (
                                <span className="text-[10px] text-gray-400 mt-0.5">
                                  ₹{ (Number(addon.amount) * quantity).toLocaleString() } total
                                </span>
                              ) }
                            </div>
                          </label>
                        );
                      }) }
                    </div>
                  </div>
                ) }

                {/* Buttons */ }
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button type="button" onClick={ handleSave } disabled={ loading }
                    className="flex-1 min-h-11 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition shadow-sm text-base touch-manipulation">
                    { loading ? "Saving..." : editId ? "Update entry" : isQuotationMode ? "Save Quotation" : "Calculate & Save" }
                  </button>
                  {editId && (
                  <button type="button" onClick={ resetForm }
                    className="min-h-11 px-4 py-2.5 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition text-sm font-medium touch-manipulation">
                    Cancel
                  </button>
                  )}
                </div>
              </div>

              {/* Total Summary Card */}
              {!onServiceAdded && (
                <div className={cardCls}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-400">Summary</span>
                    {selecteddiscount && <span className="text-xs bg-green-500/20 text-green-400 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Discount Applied</span>}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Subtotal</span><span className="font-semibold text-white">₹{grandTotal.toLocaleString()}</span>
                    </div>
                    {selecteddiscount && (
                      <div className="flex justify-between items-center text-sm text-green-600">
                        <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" />Discount {selecteddiscount.discount_type === "percent" ? `(${selecteddiscount.discount_per}%)` : `(₹${parseFloat(selecteddiscount.discount_amt).toLocaleString()})`}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">− ₹{discountAmount.toFixed(2)}</span>
                          <button onClick={handleShowDiscount} className="p-1 rounded hover:bg-green-100 text-green-600"><Pencil className="w-3 h-3" /></button>
                          <button onClick={() => handleDeleteDiscount(selecteddiscount.id)} className="p-1 rounded hover:bg-red-100 text-red-500"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                    )}
                    {selecteddiscount && <div className="h-px bg-gray-700" />}
                    <div className="flex justify-between font-bold text-base text-white">
                      <span>{selecteddiscount ? "Total Payable" : "Grand Total"}</span>
                      <span className={selecteddiscount ? "text-green-600" : "text-red-600"}>₹{selecteddiscount ? totalAfterDiscount.toFixed(2) : grandTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Orders List */ }
              { getData.filter(order => !isComplimentaryItem(order)).length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><Package className="w-4 h-4 text-red-400" />Saved Services</h3>
                  { getData.filter(order => !isComplimentaryItem(order)).map((order) => (
                    <div key={ order.id } className={ cardCls + " hover:border-red-500/50 transition" }>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white text-sm">{ order.service_name } → { order.category_name }</p>
                          <p className="text-xs text-gray-400 mt-0.5">🎬 { order.editing_type_name } × { order.quantity }</p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            { Number(order.include_content_posting) > 0 && <span className="text-xs bg-red-500/20 border border-red-500/30 text-red-400 px-2 py-0.5 rounded-full">📢 Meta Growth & Content Mgmt</span> }
                            { Number(order.include_thumbnail_creation) > 0 && <span className="text-xs bg-orange-500/20 border border-orange-500/30 text-orange-400 px-2 py-0.5 rounded-full">🖼 Thumbnail</span> }
                            { Number(order.include_youtube_video_posting) > 0 && <span className="text-xs bg-red-500/20 border border-red-500/30 text-red-400 px-2 py-0.5 rounded-full">▶️ YouTube Channel Growth & Optimization</span> }
                            { (() => {
                              let orderAddons = [];
                              if (order.additional_services) {
                                try {
                                  orderAddons = typeof order.additional_services === "string"
                                    ? JSON.parse(order.additional_services)
                                    : order.additional_services;
                                  if (!Array.isArray(orderAddons)) orderAddons = [];
                                } catch {
                                  orderAddons = [];
                                }
                              }
                              return orderAddons.map((addon, aIdx) => (
                                <span key={ aIdx } className="text-xs bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  ✨ { addon.name || addon.additional_service_name } (+₹{ Number(addon.amount || 0).toLocaleString() })
                                </span>
                              ));
                            })() }
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold text-green-600 text-base mr-auto sm:mr-0">₹{ parseFloat(order.total_amount).toLocaleString() }</span>
                          <button type="button" onClick={ () => handleEdit(order) } className="min-h-11 min-w-11 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition touch-manipulation" title="Edit"><Pencil className="w-4 h-4" /></button>
                          <button type="button" onClick={ () => handleDelete(order.id) } className="min-h-11 min-w-11 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition touch-manipulation" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  )) }
                </div>
              ) }

              {/* Notes Section */}
              { !hideNotes && docTypeFromURL !== "proforma" && (
                <>
                  <div className={ cardCls + " space-y-3" }>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><StickyNote className="w-4 h-4 text-orange-400" />Notes</h3>

                    {/* Predefined Note Dropdown */ }
                    <div className="relative" ref={ dropdownRef }>
                      <button type="button" onClick={ () => setIsOpen(!isOpen) }
                        className="flex items-center justify-between w-full min-h-11 px-3 py-2.5 rounded-lg border border-gray-600 bg-gray-700 text-base cursor-pointer hover:border-gray-500 transition touch-manipulation">
                        <span className="text-gray-300 truncate">{ selectedNote ? selectedNote.note_text : "Select a predefined note to add..." }</span>
                        { isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" /> }
                      </button>
                      { isOpen && (
                        <div className="absolute z-20 w-full mt-1 max-h-56 overflow-auto rounded-lg border border-gray-600 bg-gray-800 shadow-2xl">
                          { uniquePredefinedNotes.length === 0
                            ? <p className="text-center text-gray-500 text-sm py-4">No more predefined notes</p>
                            : uniquePredefinedNotes.map((note) => (
                              <button type="button" key={ note.id } onPointerDown={ (e) => e.preventDefault() } onClick={ () => handleSelect(note) }
                                className="w-full text-left px-4 py-3 min-h-11 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-0 transition touch-manipulation">{ note.note_text }</button>
                            )) }
                        </div>
                      ) }
                    </div>

                    {/* Manual Note */ }
                    <div className="flex gap-2">
                      <textarea rows={ 1 } value={ manualNote } onChange={ (e) => setManualNote(e.target.value) } placeholder="Type a custom note..."
                        className="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 resize-none" />
                      <button onClick={ handleAddManualNote } className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold transition">+ Add</button>
                    </div>

                    {/* Selected Notes */ }
                    { selectedNotes.length > 0 && (
                      <div className="space-y-1.5">
                        { selectedNotes.map((note) => (
                          <div key={ note.id } className="flex items-start gap-2 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2">
                            <span className="flex-1 text-sm text-gray-300 leading-relaxed">{ note.note_name }</span>
                            <button onClick={ () => handleRemoveNote(note.id) } className="w-5 h-5 rounded-full bg-red-100 hover:bg-red-200 text-red-500 flex items-center justify-center flex-shrink-0 text-xs font-bold transition">×</button>
                          </div>
                        )) }
                      </div>
                    ) }

                    <button onClick={ handleSaveNotes }
                      className="w-full py-2.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold transition shadow-sm">
                      💾 Save Notes
                    </button>
                  </div>

                  {/* Saved Notes */ }
                  { allClientNote.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Saved Notes</h3>
                      { allClientNote.map((notes) => (
                        <div key={ notes.id } className="flex items-start gap-3 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 hover:border-gray-600 transition">
                          <span className="flex-1 text-sm text-gray-300 leading-relaxed">→ { notes.note_name }</span>
                          <div className="flex gap-2 flex-shrink-0">
                            <button onClick={ (e) => { e.stopPropagation(); setSelectedNotesId(notes); setFormData({ note_name: notes.note_name, plan: notes.plan }); setIsEditing(true); setShowModal(true); } }
                              className="w-7 h-7 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition"><Pencil className="w-3 h-3" /></button>
                            <button onClick={ () => handleDeleteClientNote(notes.id) }
                              className="w-7 h-7 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        </div>
                      )) }
                    </div>
                  ) }
                </>
              ) }

            </div>
          ) : serviceType === "complimentary" ? (
            <ComplimentaryCalculator 
              hideNotes={ hideNotes }
              onSaveComplete={ onSaveComplete }
              proposalIdOverride={ proposalIdOverride }
              onServiceAdded={ onServiceAdded }
              onServiceDeleted={ onServiceDeleted }
              embeddedData={ embeddedData ? embeddedData.filter(r => r.is_complimentary || r.source === 'custom_complimentary') : undefined }
            />
          ) : null }

        </div>
      </div>

      {/* Note Edit Modal */ }
      { showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={ handleClose } />
          <div className="relative w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
            <div className="h-1 w-full bg-gradient-to-r from-orange-500 to-red-500" />
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-orange-500/20 rounded-xl flex items-center justify-center"><StickyNote className="w-4 h-4 text-orange-400" /></div>
                <h2 className="font-bold text-white">{ isEditing ? "Edit Note" : "Add Note" }</h2>
              </div>
              <button onClick={ handleClose } className="w-8 h-8 rounded-lg hover:bg-gray-700 text-gray-400 flex items-center justify-center transition"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={ handleSubmit } className="p-5 space-y-4">
              <textarea name="note_name" value={ formData.note_name } onChange={ handleChange } rows={ 4 } required placeholder="Enter note..."
                className="w-full rounded-xl border border-gray-600 bg-gray-700 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 resize-none" />
              <div className="flex gap-2">
                <button type="button" onClick={ handleClose } className="flex-1 py-2.5 border border-gray-600 text-gray-300 hover:bg-gray-700 rounded-xl text-sm font-medium transition">Cancel</button>
                <button type="submit" disabled={ loading } className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white rounded-xl text-sm font-bold transition">
                  { loading ? "Saving..." : isEditing ? "Update" : "Save" }
                </button>
              </div>
            </form>
          </div>
        </div>
      ) }

      {/* Discount Modal */ }
      <DiscountModal
        show={ showModalDiscount }
        onClose={ handleCloseDiscount }
        onSubmit={ handleSaveDiscount }
        formDataDis={ formDataDiscount }
        handleChangeDis={ handleChangeDiscount }
        isEditingDis={ !!selecteddiscount }
        loading={ loading }
        grandTotal={ grandTotal }
        discountDataSet={ discountDataSet }
      />
    </>
  );
};

export default GraphicCalculator;
