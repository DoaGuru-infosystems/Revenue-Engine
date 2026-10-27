import { useState, useEffect, useRef, useMemo } from "react";
import Swal from "sweetalert2";
import {
  getServiceCategoryEditingTree,
  getOptionalServiceAmounts,
  getCalculatorTransactions,
  getProformaSnapshot,
  updateProformaSnapshot,
  saveGraphicService,
  deleteGraphicEntryById,
} from "../services/calculatorService";

export const isComplimentaryItem = (item) => {
  if (!item) return false;
  if (item.is_complimentary !== undefined && item.is_complimentary !== null) {
    return Boolean(item.is_complimentary);
  }
  if (item.source === "custom_complimentary" || item.source === "complimentary") return true;
  if (item.include_in_total === false) return true;
  const s = String(item.service_name || item.service || "").toLowerCase();
  return (
    s.includes("(complimentary)") ||
    s.includes("(complimntory)") ||
    s === "complimentary"
  );
};

export function useGraphicCalculatorData({
  id,
  proposalId,
  token,
  userName,
  docTypeFromURL,
  onServiceAdded,
  onServiceDeleted,
  onSaveComplete,
  embeddedData,
  locationState,
  mode,
  quotationId,
  editItem,
  serviceTypeOverride,
}) {
  const [data, setData] = useState([]);
  const [optionalServices, setOptionalServices] = useState([]);
  const [getData, setGetData] = useState([]);
  const [serviceType, setServiceType] = useState("paid");

  // Form states
  const [selectedService, setSelectedService] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedEditingType, setSelectedEditingType] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addons, setAddons] = useState({});
  const [selectedAdditionalServices, setSelectedAdditionalServices] = useState([]);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const lastProcessedEditIdRef = useRef(null);

  // Load service catalog
  useEffect(() => {
    getServiceCategoryEditingTree(token)
      .then((res) => {
        const filtered = (res?.data || []).filter(
          (service) => service.service_name.toLowerCase() !== "complimentary"
        );
        setData(filtered);
      })
      .catch((err) => console.error("Error loading services tree:", err));
  }, [token]);

  // Load optional service amounts
  useEffect(() => {
    getOptionalServiceAmounts(token)
      .then((res) => {
        if (res?.status === "success") {
          const services = res.data || [];
          setOptionalServices(services);

          const initialAddons = {};
          services.forEach((item) => {
            const key = item.editing_type_name.toLowerCase().replace(/\s+/g, "_");
            initialAddons[key] = false;
          });
          setAddons(initialAddons);
        }
      })
      .catch((err) => console.error("Error loading optional services:", err));
  }, [token]);

  // Handle incoming service type from router navigation or prop
  useEffect(() => {
    if (serviceTypeOverride) {
      setServiceType(serviceTypeOverride);
    } else if (locationState?.servicetype) {
      setServiceType(locationState.servicetype);
    }
  }, [locationState, serviceTypeOverride]);

  // Fetch saved transactions / snapshot
  const fetchData = async () => {
    if (embeddedData) {
      setGetData(embeddedData.filter((r) => !isComplimentaryItem(r)));
      return;
    }
    if (!id || (!proposalId && !quotationId) || !token) return;

    try {
      if (mode === "quotation" && quotationId) {
        // Quotation mode: check localStorage draft with 48h TTL, fallback to DB if absent/expired
        const { checkDraftStatus, ensureQuotationDraft, getActiveDraftItemsByType } = await import(
          "../utils/quotationDraftPersistence"
        );
        const draftStatus = checkDraftStatus({ quotationId });
        if (draftStatus.restoreAvailable && draftStatus.draft && Array.isArray(draftStatus.draft.draftItems)) {
          const items = getActiveDraftItemsByType(draftStatus.draft, "service", false);
          setGetData(items);
          return;
        }

        const API_BASE_URL = (await import("../../../config/apiBaseUrl")).default;
        const axios = (await import("axios")).default;
        const res = await axios.get(
          `${API_BASE_URL}/auth/api/re_calculator/quotation/${quotationId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.status === "Success") {
          const rawServices = res.data.data?.services || [];
          const rawAds = res.data.data?.ads || [];
          const baseItems = [
            ...rawServices.map((s) => ({
              ...s,
              _type: "service",
              is_complimentary: isComplimentaryItem(s),
              include_in_total: !isComplimentaryItem(s),
              _status: "saved",
            })),
            ...rawAds.map((a) => ({
              ...a,
              _type: "ads",
              is_complimentary: false,
              include_in_total: true,
              _status: "saved",
            })),
          ];
          const newDraft = await ensureQuotationDraft({
            quotationId,
            fetchDbSnapshot: async () => ({ items: baseItems }),
          });
          const items = getActiveDraftItemsByType(newDraft, "service", false);
          setGetData(items);
        }
      } else if (docTypeFromURL === "proforma") {
        const res = await getProformaSnapshot(proposalId, token);
        const parsed = JSON.parse(res?.data?.pricing_snapshot || "[]");
        setGetData(parsed.filter((r) => !isComplimentaryItem(r)));
      } else {
        const res = await getCalculatorTransactions(proposalId, id, token);
        setGetData((res?.data || []).filter((r) => !isComplimentaryItem(r)));
      }
    } catch (error) {
      console.error("fetchData error:", error);
    }
  };

  useEffect(() => {
    if (embeddedData) {
      setGetData(embeddedData.filter((r) => !isComplimentaryItem(r)));
    } else {
      fetchData();
    }
  }, [id, proposalId, embeddedData, token, docTypeFromURL]);

  // Edit action
  const handleEdit = (entry) => {
    if (!entry) return;
    setEditId(entry.id);

    const entryService = (entry.service_name || "").trim().toLowerCase();
    const serviceObj = data.find(
      (s) => (s.service_name || "").trim().toLowerCase() === entryService
    );
    const resolvedServiceName = serviceObj ? serviceObj.service_name : entry.service_name;
    setSelectedService(resolvedServiceName);

    const entryCategory = (entry.category_name || "").trim().toLowerCase();
    const categoryObj = serviceObj?.categories?.find(
      (c) => (c.category_name || "").trim().toLowerCase() === entryCategory
    );
    const resolvedCategoryName = categoryObj ? categoryObj.category_name : entry.category_name;
    setSelectedCategory(resolvedCategoryName);

    let matchedEt = null;
    if (categoryObj?.editing_types?.length > 0) {
      if (entry.editing_type_id) {
        matchedEt = categoryObj.editing_types.find(
          (et) => et.editing_type_id === Number(entry.editing_type_id)
        );
      }
      if (!matchedEt && entry.editing_type_name) {
        matchedEt = categoryObj.editing_types.find(
          (et) =>
            et.editing_type_name &&
            et.editing_type_name.trim().toLowerCase() === entry.editing_type_name.trim().toLowerCase()
        );
      }
      if (!matchedEt && (entry.editing_type_amount || entry.unit_price)) {
        const targetAmt = Number(entry.editing_type_amount || entry.unit_price);
        matchedEt = categoryObj.editing_types.find((et) => Number(et.amount) === targetAmt);
      }
      if (!matchedEt && categoryObj.editing_types.length === 1) {
        matchedEt = categoryObj.editing_types[0];
      }
    }

    if (matchedEt) {
      setSelectedEditingType({
        editing_type_id: matchedEt.editing_type_id,
        editing_type_name: matchedEt.editing_type_name,
        amount: parseFloat(matchedEt.amount),
      });
    } else {
      setSelectedEditingType({
        editing_type_id: entry.editing_type_id || null,
        editing_type_name: entry.editing_type_name || null,
        amount: parseFloat(entry.editing_type_amount || entry.unit_price || 0),
      });
    }

    setQuantity(parseInt(entry.quantity) || 1);

    const updatedAddons = {};
    optionalServices.forEach((opt) => {
      const key = opt.editing_type_name.toLowerCase().replace(/\s+/g, "_");
      const entryKey = `include_${key}`;
      updatedAddons[key] = parseFloat(entry[entryKey]) > 0;
    });
    setAddons(updatedAddons);

    let initialSelectedAddons = [];
    if (entry.additional_services) {
      try {
        initialSelectedAddons =
          typeof entry.additional_services === "string"
            ? JSON.parse(entry.additional_services)
            : entry.additional_services;
        if (!Array.isArray(initialSelectedAddons)) initialSelectedAddons = [];
      } catch {
        initialSelectedAddons = [];
      }
    }
    setSelectedAdditionalServices(initialSelectedAddons);
  };

  // Auto pre-fill from router state or direct editItem prop
  useEffect(() => {
    const item = editItem || locationState?.editItem;
    if (item && data.length > 0 && lastProcessedEditIdRef.current !== item.id) {
      lastProcessedEditIdRef.current = item.id;
      handleEdit(item);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [locationState, editItem, data, optionalServices]);

  const resetForm = () => {
    setEditId(null);
    setSelectedService("");
    setSelectedCategory("");
    setSelectedEditingType(null);
    setQuantity(1);
    setSelectedAdditionalServices([]);
    const initialAddons = {};
    optionalServices.forEach((item) => {
      const key = item.editing_type_name.toLowerCase().replace(/\s+/g, "_");
      initialAddons[key] = false;
    });
    setAddons(initialAddons);
  };

  const getSelectedService = data.find((s) => s.service_name === selectedService);
  const getSelectedCategory = getSelectedService?.categories?.find(
    (c) => c.category_name === selectedCategory
  );

  const availableAddons = useMemo(() => {
    if (!getSelectedCategory) return [];
    if (
      Array.isArray(getSelectedCategory.additional_services) &&
      getSelectedCategory.additional_services.length > 0
    ) {
      return getSelectedCategory.additional_services;
    }
    if (Array.isArray(getSelectedService?.additional_services)) {
      return getSelectedService.additional_services.filter((a) => {
        if (a.category_id && getSelectedCategory.category_id) {
          return String(a.category_id) === String(getSelectedCategory.category_id);
        }
        if (a.category_name && getSelectedCategory.category_name) {
          return (
            a.category_name.trim().toLowerCase() ===
            getSelectedCategory.category_name.trim().toLowerCase()
          );
        }
        return false;
      });
    }
    return [];
  }, [getSelectedCategory, getSelectedService]);

  const grandTotal = useMemo(() => {
    return getData
      .filter((order) => !isComplimentaryItem(order))
      .reduce((acc, order) => acc + parseFloat(order.total_amount || 0), 0);
  }, [getData]);

  const handleSave = async () => {
    if (!selectedService) {
      Swal.fire({
        icon: "warning",
        title: "Validation",
        text: "Please select a service.",
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }

    if (!selectedCategory) {
      Swal.fire({
        icon: "warning",
        title: "Validation",
        text: "Please select a category.",
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }

    const hasEditingTypesToSelect =
      getSelectedCategory?.editing_types?.some(
        (et) =>
          et.editing_type_name &&
          et.editing_type_name.trim() !== "" &&
          et.editing_type_name !== "null" &&
          et.editing_type_name !== "N/A"
      ) || getSelectedCategory?.editing_types?.length > 1;

    let effectiveEditingType = selectedEditingType;
    if (
      getSelectedCategory &&
      (!effectiveEditingType?.editing_type_id || !effectiveEditingType?.amount)
    ) {
      if (effectiveEditingType?.editing_type_name) {
        const found = getSelectedCategory.editing_types?.find(
          (et) =>
            et.editing_type_name &&
            et.editing_type_name.trim().toLowerCase() ===
              effectiveEditingType.editing_type_name.trim().toLowerCase()
        );
        if (found) effectiveEditingType = found;
      }
      if (
        !effectiveEditingType &&
        getSelectedCategory.editing_types?.length === 1 &&
        !hasEditingTypesToSelect
      ) {
        effectiveEditingType = getSelectedCategory.editing_types[0];
      }
    }

    if (
      hasEditingTypesToSelect &&
      (!effectiveEditingType || !effectiveEditingType.editing_type_id)
    ) {
      Swal.fire({
        icon: "warning",
        title: "Editing Type Required",
        text: "Is service category ke liye Editing Type chunna anivarya (mandatory) hai.",
        showConfirmButton: true,
      });
      return;
    }

    if (!effectiveEditingType) {
      Swal.fire({
        icon: "warning",
        title: "Validation",
        text: "Please select an editing type or pricing tier.",
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }

    if (!quantity || quantity <= 0 || isNaN(quantity)) {
      Swal.fire({
        icon: "warning",
        title: "Validation",
        text: "Please enter a valid quantity of at least 1.",
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }

    setLoading(true);

    const baseAmount = (Number(effectiveEditingType.amount) || 0) * quantity;
    let optionalTotal = 0;
    let include_content_posting = 0;
    let include_thumbnail_creation = 0;
    let include_youtube_video_posting = 0;

    optionalServices.forEach((opt) => {
      const key = opt.editing_type_name.toLowerCase().replace(/\s+/g, "_");
      if (addons[key]) {
        const amount = parseFloat(opt.amount);
        const totalForThisAddon = amount * quantity;
        optionalTotal += totalForThisAddon;

        const lowerKey = key.toLowerCase();
        if (
          lowerKey === "content_posting" ||
          lowerKey === "meta_growth_&_content_management"
        ) {
          include_content_posting = amount;
        } else if (lowerKey === "thumbnail_creation") {
          include_thumbnail_creation = amount;
        } else if (
          lowerKey === "youtube_video_posting" ||
          lowerKey === "youtube_channel_growth_&_optimization"
        ) {
          include_youtube_video_posting = amount;
        }
      }
    });

    const additionalServicesTotal = selectedAdditionalServices.reduce(
      (sum, item) => sum + (Number(item.amount || item.unit_price) || 0) * quantity,
      0
    );
    const finalAmount = baseAmount + optionalTotal + additionalServicesTotal;

    const formattedAdditionalServices = selectedAdditionalServices.map((addon) => {
      const addonName = addon.name || addon.additional_service_name;
      const unitAmt = Number(addon.amount || addon.unit_price) || 0;
      return {
        ...addon,
        id: addon.id,
        name: addonName,
        additional_service_name: addonName,
        amount: unitAmt,
        unit_price: unitAmt,
        quantity,
        total: unitAmt * quantity,
        total_amount: unitAmt * quantity,
        category_id: addon.category_id || getSelectedCategory?.category_id,
        category_name: addon.category_name || selectedCategory,
        service_name: selectedService,
      };
    });

    const formattedServiceTitle =
      effectiveEditingType?.editing_type_name &&
      effectiveEditingType.editing_type_name !== "null" &&
      effectiveEditingType.editing_type_name !== "N/A"
        ? `${selectedService} - ${selectedCategory} (${effectiveEditingType.editing_type_name})`
        : `${selectedService} - ${selectedCategory}`;

    // ── IN-MEMORY MODE (ProposalBuilder) ──────────────────────────────
    if (onServiceAdded) {
      const paidItems = embeddedData && embeddedData.length > 0 ? embeddedData.filter((r) => !isComplimentaryItem(r)) : [];
      const dupRow = !editId ? paidItems.find(
        (r) =>
          r.service_name === selectedService &&
          r.category_name === selectedCategory &&
          r.editing_type_name === effectiveEditingType.editing_type_name
      ) : null;
      const effectiveId = editId || dupRow?.id || Date.now();

      const row = {
        id: effectiveId,
        service_name: selectedService,
        category_name: selectedCategory,
        editing_type_id: effectiveEditingType.editing_type_id,
        editing_type_name: effectiveEditingType.editing_type_name,
        editing_type_amount: effectiveEditingType.amount,
        quantity,
        unit_price: effectiveEditingType.amount,
        total_price: finalAmount,
        total_amount: finalAmount,
        include_content_posting,
        include_thumbnail_creation,
        include_youtube_video_posting,
        additional_services: formattedAdditionalServices,
        include_in_total: serviceType !== "complimentary",
        is_complimentary: serviceType === "complimentary",
        source: serviceType === "complimentary" ? "custom_complimentary" : "custom_graphic",
        service: formattedServiceTitle,
      };
      onServiceAdded(row);
      const isUpdated = Boolean(editId || dupRow);
      Swal.fire({
        icon: "success",
        title: isUpdated ? "Updated!" : "Added!",
        text: isUpdated
          ? "Service updated in proposal. Click Save to save everything."
          : "Service added to proposal. Click Save to save everything.",
        showConfirmButton: false,
        timer: 1200,
      });
      resetForm();
      setLoading(false);
      return;
    }

    // ── DB / SNAPSHOT MODE ──────────────────────────────────────────
    const payload = {
      txn_id: proposalId,
      client_id: id,
      service_name: selectedService,
      category_name: selectedCategory,
      editing_type_id: effectiveEditingType.editing_type_id,
      editing_type_name: effectiveEditingType.editing_type_name,
      editing_type_amount: effectiveEditingType.amount,
      quantity,
      unit_price: effectiveEditingType.amount,
      total_price: finalAmount,
      total_amount: finalAmount,
      include_content_posting,
      include_thumbnail_creation,
      include_youtube_video_posting,
      additional_services: formattedAdditionalServices,
      service: formattedServiceTitle,
      include_in_total: true,
      source: "custom_graphic",
      employee: userName,
    };

    try {
      let res;
      // If editId is not set, check if matching entry already exists in getData to update it
      let effectiveEditId = editId;
      if (!effectiveEditId && Array.isArray(getData)) {
        const normalizeName = (name) =>
          String(name || "")
            .replace(/\s*\((complimentary|complimntory)\)\s*$/i, "")
            .trim()
            .toLowerCase();
        const existingEntry = getData.find((r) => {
          const rName = normalizeName(r.service_name || r.service);
          const sName = normalizeName(selectedService);
          const rCat = String(r.category_name || "").trim().toLowerCase();
          const sCat = String(selectedCategory || "").trim().toLowerCase();
          const rEdit = String(r.editing_type_name || "").trim().toLowerCase();
          const sEdit = String(effectiveEditingType?.editing_type_name || "").trim().toLowerCase();
          const isComp = Boolean(isComplimentaryItem(r));
          return rName === sName && rCat === sCat && rEdit === sEdit && isComp === (serviceType === "complimentary");
        });
        if (existingEntry) {
          effectiveEditId = existingEntry.id;
        }
      }

      if (mode === "quotation" && quotationId) {
        const { saveServiceToQuotationDraft, getActiveDraftItemsByType } = await import(
          "../utils/quotationDraftPersistence"
        );
        const saveRes = await saveServiceToQuotationDraft({
          quotationId,
          item: payload,
          editId: effectiveEditId,
          isComplimentary: false,
          fetchDbSnapshot: async () => {
            const API_BASE_URL = (await import("../../../config/apiBaseUrl")).default;
            const axios = (await import("axios")).default;
            const currentQ = await axios.get(
              `${API_BASE_URL}/auth/api/re_calculator/quotation/${quotationId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const rawServices = currentQ.data?.data?.services || [];
            const rawAds = currentQ.data?.data?.ads || [];
            return {
              items: [
                ...rawServices.map((s) => ({
                  ...s,
                  _type: "service",
                  is_complimentary: isComplimentaryItem(s),
                  include_in_total: !isComplimentaryItem(s),
                  _status: "saved",
                })),
                ...rawAds.map((a) => ({
                  ...a,
                  _type: "ads",
                  is_complimentary: false,
                  include_in_total: true,
                  _status: "saved",
                })),
              ],
            };
          },
        });

        if (saveRes?.success) {
          const active = getActiveDraftItemsByType(saveRes.draft, "service", false);
          setGetData(active);
          resetForm();
          const isDraftUpdate = Boolean(editId || effectiveEditId);
          Swal.fire({
            icon: "success",
            title: isDraftUpdate ? "Draft Updated!" : "Saved to Draft!",
            text: "Service saved to draft. Go back to Services Landing and click 'Save' to commit to database.",
            timer: 1500,
            showConfirmButton: false,
          });
          if (onSaveComplete) onSaveComplete();
          setLoading(false);
          return;
        }
      } else if (docTypeFromURL === "proforma") {
        res = await updateProformaSnapshot(
          {
            proformaId: proposalId,
            action: effectiveEditId ? "update" : "add",
            editId: effectiveEditId,
            item: payload,
            snapshotType: "services",
          },
          token
        );
      } else {
        res = await saveGraphicService(payload, token, effectiveEditId);
      }

      if (res?.status === "Success") {
        const isUpdate = Boolean(editId || effectiveEditId);
        const docLabel =
          docTypeFromURL === "proforma"
            ? "Proforma"
            : isQuotationMode
            ? "Quotation"
            : "Service";
        Swal.fire({
          icon: "success",
          title: isUpdate ? "Updated!" : "Saved!",
          text: isUpdate
            ? `${docLabel} updated successfully`
            : `${docLabel} saved successfully`,
          showConfirmButton: false,
          timer: 1000,
        });
        resetForm();
        fetchData();
        if (onSaveComplete) onSaveComplete();
      } else if (res?.status === "Alert") {
        Swal.fire({
          icon: "warning",
          title: "Already Exists",
          text: res?.message || "This service already exists",
          showConfirmButton: false,
          timer: 1000,
        });
        resetForm();
        fetchData();
      }
    } catch (err) {
      console.error("Save error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err?.response?.data?.message || "Failed to save quotation. Please try again.",
        showConfirmButton: false,
        timer: 1000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (entryId) => {
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

    if (onServiceDeleted) {
      onServiceDeleted(entryId);
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Service removed from proposal.",
        showConfirmButton: false,
        timer: 1000,
      });
      return;
    }

    try {
      let res;
      if (mode === "quotation" && quotationId) {
        const { deleteItemFromQuotationDraft, getActiveDraftItemsByType } = await import(
          "../utils/quotationDraftPersistence"
        );
        const delRes = deleteItemFromQuotationDraft({
          quotationId,
          itemId: entryId,
        });
        if (delRes?.success) {
          const active = getActiveDraftItemsByType(delRes.draft, "service", false);
          setGetData(active);
          Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "Service removed from draft.",
            timer: 1000,
            showConfirmButton: false,
          });
          if (onSaveComplete) onSaveComplete();
          return;
        }
      } else if (docTypeFromURL === "proforma") {
        res = await updateProformaSnapshot(
          {
            proformaId: proposalId,
            action: "delete",
            entryId,
            snapshotType: "services",
          },
          token
        );
      } else {
        res = await deleteGraphicEntryById(entryId, token);
      }

      if (res?.status === "Success") {
        setGetData((prev) => prev.filter((item) => String(item.id) !== String(entryId)));
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
          text: res?.message || "Failed to delete entry.",
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

  return {
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
    loading,
    getSelectedService,
    getSelectedCategory,
    availableAddons,
    grandTotal,
    handleEdit,
    handleSave,
    handleDelete,
    resetForm,
    fetchData,
  };
}
