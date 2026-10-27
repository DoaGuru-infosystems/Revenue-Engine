import React, { useEffect, useMemo, useRef, useState } from "react";
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
  User,
  X,
  StickyNote,
  Notebook,
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  CheckCircle2,
  Gift,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../../../redux/user/userSlice";
import { useNavigate, useLocation } from "react-router-dom";
import API_BASE_URL from "../../../config/apiBaseUrl";

const ComplimentaryCalculator = ({
  hideNotes = false,
  onSaveComplete,
  proposalIdOverride,
  onServiceAdded,
  onServiceDeleted,
  isQuotationMode: isQuotationModeProp,
  quotationId: quotationIdProp,
  editItem,
  embeddedData,
}) => {
   const baseURL = API_BASE_URL;
const dispatch = useDispatch();
  const { currentUser, token } = useSelector((state) => state.user);
  const userName = currentUser?.name;
  const { id, clientId, proposalId } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const docTypeFromURL = searchParams.get("doc");
  const isQuotationExplicit = Boolean(
    isQuotationModeProp ||
    location.state?.mode === "quotation" ||
    searchParams.get("mode") === "quotation" ||
    searchParams.get("doc") === "quotation" ||
    docTypeFromURL === "quotation"
  );
  const [isDetectedQuotation, setIsDetectedQuotation] = useState(false);
  const isQuotationMode = isQuotationExplicit || isDetectedQuotation;
  const effectiveClientId = id || clientId;
  const effectiveProposalId = proposalIdOverride || proposalId;
  const effectiveQuotationId =
    quotationIdProp ||
    location.state?.quotationId ||
    (isQuotationMode ? effectiveProposalId : null);

  const isComplimentaryRecord = (item) => {
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
  const [data, setData] = useState([]);

  const [selectedService, setSelectedService] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedEditingType, setSelectedEditingType] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedAdditionalServices, setSelectedAdditionalServices] = useState([]);
  const [getData, setGetData] = useState([]);
  const [allClientNote, setAllClientNote] = useState([]);
  const [optionalServices, setOptionalServices] = useState([]);

  const [addons, setAddons] = useState({});

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  console.log(id, proposalId);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    note_name: "",
    plan: "Customise",
  });
  const [selectedNotesId, setSelectedNotesId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [predefinedNotes, setPredefinedNotes] = useState([]); // fetched from API
  const [selectedNotes, setSelectedNotes] = useState([]); // selected + manual
  const [manualNote, setManualNote] = useState("");
  const [selectedNote, setSelectedNote] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    axios
      .get(`${baseURL}/auth/api/re_calculator/services/category/editing`)
      .then((res) => {
        // Exclude dummy "complimentary" if any, show all normal services
        const normalServices = (res.data.data || []).filter(
          (service) => service.service_name.toLowerCase() !== "complimentary"
        );
        setData(normalServices);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    axios
      .get(`${baseURL}/auth/api/re_calculator/optional-service-amounts`)
      .then((res) => {
        if (res.data.status === "success") {
          const services = res.data.data;
          setOptionalServices(services);

          const initialAddons = {};
          services.forEach((item) => {
            const key = item.editing_type_name
              .toLowerCase()
              .replace(/\s+/g, "_");
            initialAddons[key] = false;
          });
          setAddons(initialAddons);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  // useEffect(() => {
  //   if (selectedService === "Video Services") {
  //     setAddons({
  //       thumbnail_creation: true,
  //       content_posting: true,
  //     });
  //   } else if (selectedService === "Graphics Design") {
  //     setAddons({
  //       content_posting: true,
  //       thumbnail_creation: false,
  //     });
  //   } else {
  //     setAddons({});
  //   }
  // }, [selectedService]);
  const DEFAULT_PREDEFINED_NOTES = [
    {
      id: 1,
      note_text:
        "The client pays for the Meta ad budget, and ad service charges will apply only if the client wants to run the ad.",
    },
    {
      id: 2,
      note_text:
        "All amounts need to be paid in advance. Only the ad budget will be paid upon request of the client or immediately after the service is started.",
    },
    {
      id: 3,
      note_text:
        "Please note that service charges are non-refundable but may be adjusted against another service.",
    },
    {
      id: 4,
      note_text:
        "One dedicated SPOC (single point of contact) is required from the client side to approve the posts, contents, videos changes, etc.",
    },
    {
      id: 5,
      note_text:
        "Required details like credentials and other details are needed to share timely.",
    },
  ];

  const fetchPredefinedNotes = async () => {
    try {
      const { data } = await axios.get(
        `${baseURL}/auth/api/re_calculator/getNoteData`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
        setPredefinedNotes(data.data);
      } else {
        setPredefinedNotes(DEFAULT_PREDEFINED_NOTES);
      }
    } catch (error) {
      console.error("fetchPredefinedNotes error:", error);
      setPredefinedNotes(DEFAULT_PREDEFINED_NOTES);
    }
  };
  useEffect(() => {
    fetchPredefinedNotes();
  }, []);

  const handleEdit = (entry) => {
    setEditId(entry.id);
    const cleanServiceName = (entry.service_name || "").replace(/\s*\((complimentary|complimntory)\)\s*$/i, "").trim();
    setSelectedService(cleanServiceName);
    setSelectedCategory(entry.category_name);

    const serviceObj = data.find((s) => s.service_name === cleanServiceName);
    const categoryObj = serviceObj?.categories?.find(
      (c) => c.category_name === entry.category_name
    );

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
            et.editing_type_name.trim().toLowerCase() ===
              entry.editing_type_name.trim().toLowerCase()
        );
      }
      if (!matchedEt && (entry.editing_type_amount || entry.unit_price)) {
        const targetAmt = Number(entry.editing_type_amount || entry.unit_price);
        matchedEt = categoryObj.editing_types.find(
          (et) => Number(et.amount) === targetAmt
        );
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
    setQuantity(parseInt(entry.quantity || 1));

    // Dynamically map optional services from entry
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

  const lastProcessedEditIdRef = useRef(null);

  useEffect(() => {
    const item = editItem || location.state?.editItem;
    if (item && data.length > 0 && lastProcessedEditIdRef.current !== item.id) {
      lastProcessedEditIdRef.current = item.id;
      handleEdit(item);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location.state, editItem, data, optionalServices]);

  const getSelectedService = data.find(
    (s) => s.service_name === selectedService
  );
  const getSelectedCategory = getSelectedService?.categories?.find(
    (c) => c.category_name === selectedCategory
  );
  const normalizeSelection = (value) => String(value || "").trim().toLowerCase();
  const shouldShowOptionalAddons =
    ["video services", "graphics design"].includes(
      normalizeSelection(selectedService)
    ) ||
    ["video services", "graphics design"].includes(
      normalizeSelection(selectedCategory)
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

  const hasEditingTypesToSelect = useMemo(() => {
    if (!getSelectedCategory) return false;
    return (
      getSelectedCategory.editing_types?.some(
        (et) =>
          et.editing_type_name &&
          et.editing_type_name.trim() !== "" &&
          et.editing_type_name !== "null" &&
          et.editing_type_name !== "N/A"
      ) || (getSelectedCategory.editing_types?.length > 1)
    );
  }, [getSelectedCategory]);

  const handleServiceChange = (svcName) => {
    setSelectedService(svcName);
    setSelectedCategory("");
    setSelectedEditingType(null);
    setSelectedAdditionalServices([]);
  };

  const handleCategoryChange = (catName) => {
    setSelectedCategory(catName);
    setSelectedAdditionalServices([]);
    const category = getSelectedService?.categories?.find(c => c.category_name === catName);
    const hasRealEditingTypes = category?.editing_types?.some(
      et => et.editing_type_name && et.editing_type_name.trim() !== "" && et.editing_type_name !== "null" && et.editing_type_name !== "N/A"
    ) || (category?.editing_types?.length > 1);

    if (category && category.editing_types && category.editing_types.length === 1 && !hasRealEditingTypes) {
      setSelectedEditingType(category.editing_types[0]);
    } else if (category && (!category.editing_types || category.editing_types.length === 0)) {
      setSelectedEditingType({ editing_type_id: null, editing_type_name: "", amount: 0 });
    } else {
      setSelectedEditingType(null);
    }
  };

  const handleSave = () => {
    if (!selectedService) {
      Swal.fire({ icon: "warning", title: "Validation", text: "Please select a service." });
      return;
    }
    if (!selectedCategory) {
      Swal.fire({ icon: "warning", title: "Validation", text: "Please select a category." });
      return;
    }

    let effectiveEditingType = selectedEditingType;
    if (getSelectedCategory && (!effectiveEditingType?.editing_type_id || !effectiveEditingType?.amount)) {
      if (effectiveEditingType?.editing_type_name) {
        const found = getSelectedCategory.editing_types?.find(
          (et) => et.editing_type_name && et.editing_type_name.trim().toLowerCase() === effectiveEditingType.editing_type_name.trim().toLowerCase()
        );
        if (found) effectiveEditingType = found;
      }
      if (!effectiveEditingType && getSelectedCategory.editing_types?.length === 1 && !hasEditingTypesToSelect) {
        effectiveEditingType = getSelectedCategory.editing_types[0];
      }
      if (!effectiveEditingType && (!getSelectedCategory.editing_types || getSelectedCategory.editing_types.length === 0)) {
        effectiveEditingType = { editing_type_id: null, editing_type_name: "", amount: 0 };
      }
    }

    if (hasEditingTypesToSelect && (!effectiveEditingType || !effectiveEditingType.editing_type_id)) {
      Swal.fire({ icon: "warning", title: "Editing Type Required", text: "Is service category ke liye Editing Type chunna anivarya (mandatory) hai." });
      return;
    }

    if (!effectiveEditingType) {
      effectiveEditingType = { editing_type_id: null, editing_type_name: "", amount: 0 };
    }

    if (!quantity || quantity <= 0) {
      Swal.fire({ icon: "warning", title: "Validation", text: "Please enter a valid quantity of at least 1." });
      return;
    }
    setLoading(true);

    // Optional addon values
    let optionalTotal = 0;
    let include_content_posting = 0;
    let include_thumbnail_creation = 0;

    if (shouldShowOptionalAddons) {
      optionalServices.forEach((opt) => {
        const key = opt.editing_type_name.toLowerCase().replace(/\s+/g, "_");
        if (addons[key]) {
          const amount = parseFloat(opt.amount);
          const totalForThisAddon = amount * quantity;

          optionalTotal += totalForThisAddon;

          if (key === "content_posting") {
            include_content_posting = amount;
          } else if (key === "thumbnail_creation") {
            include_thumbnail_creation = amount;
          }
        }
      });
    }

    const additionalServicesTotal = selectedAdditionalServices.reduce(
      (sum, item) => sum + (Number(item.amount || item.unit_price) || 0) * quantity,
      0
    );

    const baseUnit = parseFloat(effectiveEditingType?.amount || 0);
    const baseAmount = baseUnit * quantity;
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

    const cleanBase = selectedService.replace(/\s*\((complimentary|complimntory)\)\s*$/i, "").trim();
    const finalServiceName = cleanBase;

    // ── IN-MEMORY MODE (embedded inside ProposalBuilder) ──────────────────────
    if (onServiceAdded) {
      let effectiveEditId = editId;
      if (!effectiveEditId && embeddedData && embeddedData.length > 0) {
        const isComp = (r) => {
          if (r.is_complimentary !== undefined && r.is_complimentary !== null) {
            return Boolean(r.is_complimentary);
          }
          if (r.source === 'custom_complimentary' || r.source === 'complimentary') return true;
          if (r.include_in_total === false) return true;
          const s = String(r.service_name || r.service || "").toLowerCase();
          return s.includes('(complimentary)') || s.includes('(complimntory)') || s === 'complimentary';
        };
        const compRows = embeddedData.filter(r => isComp(r));
        const dupRow = compRows.find((r) => {
          const rClean = String(r.service_name || r.service || "").replace(/\s*\((complimentary|complimntory)\)\s*$/i, "").trim().toLowerCase();
          return (
            rClean === cleanBase.toLowerCase() &&
            String(r.category_name || "").trim().toLowerCase() === String(selectedCategory || "").trim().toLowerCase() &&
            String(r.editing_type_name || "").trim().toLowerCase() === String(effectiveEditingType.editing_type_name || "").trim().toLowerCase()
          );
        });
        if (dupRow) {
          effectiveEditId = dupRow.id;
        }
      }

      const row = {
        id: effectiveEditId || Date.now(),
        service_name: finalServiceName,
        service: (effectiveEditingType?.editing_type_name && effectiveEditingType?.editing_type_name !== "null" && effectiveEditingType?.editing_type_name !== "N/A")
          ? `${finalServiceName} - ${selectedCategory} (${effectiveEditingType.editing_type_name})`
          : `${finalServiceName} - ${selectedCategory}`,
        category_name: selectedCategory,
        editing_type_name: effectiveEditingType?.editing_type_name || null,
        editing_type_amount: effectiveEditingType?.amount || 0,
        quantity,
        unit_price: baseUnit,
        total_price: finalAmount,
        total_amount: finalAmount,
        include_content_posting,
        include_thumbnail_creation,
        additional_services: formattedAdditionalServices,
        additional_services_amount: additionalServicesTotal,
        include_in_total: false,
        is_complimentary: true,
        source: 'custom_complimentary',
      };
      onServiceAdded(row);
      const isUpdated = Boolean(editId || effectiveEditId);
      Swal.fire({
        icon: "success",
        title: isUpdated ? "Updated!" : "Added!",
        text: isUpdated ? "Complimentary service updated." : "Complimentary service added to proposal.",
        showConfirmButton: false,
        timer: 1200,
      });
      resetForm();
      setLoading(false);
      return;
    }

    // ── DB / SNAPSHOT MODE ───────────────────────────────────────────────────
    const payload = {
      txn_id: effectiveProposalId,
      client_id: effectiveClientId,
      service_name: finalServiceName,
      category_name: selectedCategory,
      editing_type_id: effectiveEditingType.editing_type_id || null,
      editing_type_name: effectiveEditingType.editing_type_name || "",
      editing_type_amount: effectiveEditingType.amount || 0,
      quantity,
      include_content_posting,
      include_thumbnail_creation,
      additional_services: formattedAdditionalServices,
      total_amount: finalAmount,
      total_price: finalAmount,
      unit_price: baseUnit,
      include_in_total: false,
      is_complimentary: true,
      source: 'custom_complimentary',
      employee: userName,
    };

    if (isQuotationMode) {
      (async () => {
        try {
          const qId = effectiveQuotationId || effectiveProposalId;
          const { saveServiceToQuotationDraft, getActiveDraftItemsByType } = await import(
            "../utils/quotationDraftPersistence"
          );

          const quotationItem = {
            ...payload,
            id: editId || undefined,
            service_name: finalServiceName,
            category_name: selectedCategory,
            editing_type_name: effectiveEditingType.editing_type_name || null,
            editing_type_amount: effectiveEditingType.amount || 0,
            quantity,
            additional_services: formattedAdditionalServices,
            total_amount: finalAmount,
            unit_price: baseUnit,
            source: "custom_complimentary",
            is_complimentary: true,
            include_in_total: false,
          };

          const saveRes = await saveServiceToQuotationDraft({
            quotationId: qId,
            item: quotationItem,
            editId,
            isComplimentary: true,
            fetchDbSnapshot: async () => {
              const currentQ = await axios.get(
                `${baseURL}/auth/api/re_calculator/quotation/${qId}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              const rawServices = currentQ.data?.data?.services || [];
              const rawAds = currentQ.data?.data?.ads || [];
              return {
                items: [
                  ...rawServices.map((s) => ({
                    ...s,
                    _type: "service",
                    is_complimentary: isComplimentaryRecord(s),
                    include_in_total: !isComplimentaryRecord(s),
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
            const activeComp = getActiveDraftItemsByType(saveRes.draft, "service", true);
            setGetData(activeComp);
            Swal.fire({
              icon: "success",
              title: editId ? "Updated!" : "Saved to Draft!",
              text: editId
                ? "Complimentary service updated in draft. Return to Services Landing and click 'Save' to commit to database."
                : "Complimentary service saved to draft. Return to Services Landing and click 'Save' to commit to database.",
              showConfirmButton: false,
              timer: 1500,
            });
            resetForm();
            if (onSaveComplete) onSaveComplete();
          }
        } catch (err) {
          console.error("Quotation complimentary save error:", err);
          Swal.fire("Error!", "Something went wrong while saving to draft.", "error");
        } finally {
          setLoading(false);
        }
      })();
      return;
    }

    // ✅ Snapshot (proforma) or Legacy Proposal API
    let effectiveEditId = editId;
    if (!effectiveEditId && Array.isArray(getData)) {
      const cleanBase = finalServiceName.replace(/\s*\((complimentary|complimntory)\)\s*$/i, "").trim().toLowerCase();
      const existingEntry = getData.find((r) => {
        const rClean = String(r.service_name || r.service || "").replace(/\s*\((complimentary|complimntory)\)\s*$/i, "").trim().toLowerCase();
        return (
          rClean === cleanBase &&
          String(r.category_name || "").trim().toLowerCase() === String(selectedCategory || "").trim().toLowerCase() &&
          String(r.editing_type_name || "").trim().toLowerCase() === String(effectiveEditingType?.editing_type_name || "").trim().toLowerCase()
        );
      });
      if (existingEntry) {
        effectiveEditId = existingEntry.id;
      }
    }

    let quotationRequest;
    if (docTypeFromURL === "proforma") {
      quotationRequest = axios.put(
        `${baseURL}/auth/api/re_calculator/proformas/snapshot`,
        {
          proformaId: effectiveProposalId,
          action: effectiveEditId ? "update" : "add",
          editId: effectiveEditId,
          item: { ...payload, source: "custom_complimentary" },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } else {
      quotationRequest = effectiveEditId
        ? axios.put(
            `${baseURL}/auth/api/re_calculator/updateComplimenatryDataById/${effectiveEditId}`,
            payload,
            { headers: { Authorization: `Bearer ${token}` } }
          )
        : axios.post(
            `${baseURL}/auth/api/re_calculator/saveComplimentaryData`,
            payload,
            { headers: { Authorization: `Bearer ${token}` } }
          );
    }

    quotationRequest
      .then((res) => {
        if (res.data.status === "Success") {
          const isUpdate = Boolean(editId || effectiveEditId);
          const docLabel = docTypeFromURL === "proforma" ? "Proforma" : isQuotationMode ? "Quotation" : "Complimentary";
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
        } else if (res.data.status === "Alert") {
          Swal.fire({
            icon: "warning",
            title: "Already Exists",
            text:
              res.data.message || "This complimentary service already exists",
            showConfirmButton: false,
            timer: 1000,
            // timerProgressBar: true,
          });
          resetForm();
          fetchData();
        }
      })

      .catch((err) => {
        console.error("Save error:", err);
        Swal.fire("Error!", "Something went wrong while saving.", "error");
      })
      .finally(() => {
        setLoading(false);
      });
  };

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

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      console.log("Submitting form data:", formData);
      let response;

      if (isEditing && selectedNotesId) {
        response = await axios.put(
          `${baseURL}/auth/api/re_calculator/updateClientNoteDataById/${selectedNotesId.id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log(response.data);
      } else {
        response = await axios.post(
          `${baseURL}/auth/api/re_calculator/addNotebyplan`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log(response.data);
      }

      console.log("API response:", response.data);

      if (response.data.status === "Success") {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: isEditing
            ? "Note updated successfully!"
            : "Note added successfully!",
          showConfirmButton: false,
          timer: 1000,
          // timerProgressBar: true,
        }).then(() => {
          setShowModal(false);
          getAllPlanNotes();
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            response.data.message || "Failed to save Note. Please try again.",
          showConfirmButton: false,
          timer: 1000,
          // timerProgressBar: true,
        });
      }
    } catch (error) {
      console.error("Error saving Note:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Status:", error.response.status);
        Swal.fire({
          icon: "error",
          title: `Error ${error.response.status}`,
          text:
            error.response.data.message ||
            "Failed to save note. Please try again.",
          showConfirmButton: false,
          timer: 1000,
          // timerProgressBar: true,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to save note. Please try again.",
          showConfirmButton: false,
          timer: 1000,
          // timerProgressBar: true,
        });
      }
    } finally {
      setLoading(false);
    }
  };
  const handleAddPredefinedNote = (note) => {
    if (!selectedNotes.find((n) => n.id === note.id)) {
      setSelectedNotes([
        ...selectedNotes,
        { id: note.id, note_name: note.note_text, type: "predefined" },
      ]);
    }
  };
  const handleAddManualNote = () => {
    if (manualNote.trim() !== "") {
      setSelectedNotes([
        ...selectedNotes,
        { id: Date.now(), note_name: manualNote, type: "manual" },
      ]);
      setManualNote("");
    }
  };

  const handleRemoveNote = (id) => {
    setSelectedNotes(selectedNotes.filter((note) => note.id !== id));
  };
  const handleSaveNotes = async () => {
    if (selectedNotes.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "No Notes",
        text: "Please add at least one note before saving.",
        showConfirmButton: false,
        timer: 1000,
      });
      return;
    }

    try {
      const planNotes = selectedNotes.map((item) => ({
        note_name: item.note_name,
      }));

      if (isQuotationMode) {
        const qId = effectiveQuotationId || effectiveProposalId;
        const { saveNotesToQuotationDraft } = await import("../utils/quotationDraftPersistence");
        const saveRes = await saveNotesToQuotationDraft({
          quotationId: qId,
          notes: planNotes,
          fetchDbSnapshot: async () => {
            const API_BASE_URL = (await import("../../../config/apiBaseUrl")).default;
            const axios = (await import("axios")).default;
            const currentQ = await axios.get(
              `${API_BASE_URL}/auth/api/re_calculator/quotation/${qId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const rawServices = currentQ.data?.data?.services || [];
            const rawAds = currentQ.data?.data?.ads || [];
            return {
              items: [
                ...rawServices.map((s) => ({ ...s, _type: "service", _status: "saved" })),
                ...rawAds.map((a) => ({ ...a, _type: "ads", _status: "saved" })),
              ],
            };
          },
        });

        if (saveRes?.success) {
          Swal.fire({
            icon: "success",
            title: "Notes Saved to Draft!",
            text: "Notes saved to draft. Go back to Services Landing and click 'Save Quotation' to commit to database.",
            showConfirmButton: false,
            timer: 1500,
          });
          getAllPlanNotes();
          setManualNote("");
          setSelectedNotes([]);
          fetchPredefinedNotes();
        }
        return;
      }

      const payload = {
        txn_id: effectiveProposalId,
        client_id: effectiveClientId,
        planNotes,
      };

      const res = await axios.post(
        `${baseURL}/auth/api/re_calculator/saveClientIdwiseNotes`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Also sync to proforma notes_snapshot if in proforma mode
      if (docTypeFromURL === "proforma") {
        const mergedNotes = [
          ...allClientNote.map((n) => ({ note_name: n.note_name })),
          ...planNotes,
        ];
        await axios.put(
          `${baseURL}/auth/api/re_calculator/proformas/snapshot`,
          {
            proformaId: effectiveProposalId,
            action: "set",
            item: mergedNotes,
            snapshotType: "notes",
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      if (res.data?.status === "Success" || docTypeFromURL === "proforma") {
        Swal.fire({
          icon: "success",
          title: "Notes Created",
          text: res.data?.message || "Notes saved successfully!",
          showConfirmButton: false,
          timer: 1000,
        });

        getAllPlanNotes();
        setManualNote("");
        setSelectedNotes([]);
        fetchPredefinedNotes();
      } else if (res.data?.status === "Alert") {
        Swal.fire({
          icon: "warning",
          title: "Duplicate Notes",
          text: res.data.message,
          showConfirmButton: false,
          timer: 1000,
        });
        getAllPlanNotes();
        setManualNote("");
        setSelectedNotes([]);
        fetchPredefinedNotes();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            res.data?.message || "Something went wrong while saving the notes.",
          showConfirmButton: false,
          timer: 1000,
        });
      }
    } catch (err) {
      console.error("Save error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong while saving the notes.",
        showConfirmButton: false,
        timer: 1000,
      });
    }
  };

  const fetchData = async () => {
    if (embeddedData !== undefined) {
      setGetData(embeddedData);
      return;
    }
    if (!effectiveClientId || !effectiveProposalId) return;
    try {
      if (isQuotationMode) {
        const qId = effectiveQuotationId || effectiveProposalId;
        const { checkDraftStatus, getActiveDraftItemsByType } = await import(
          "../utils/quotationDraftPersistence"
        );
        const draftStatus = checkDraftStatus({ quotationId: qId });
        if (draftStatus.restoreAvailable && draftStatus.draft && Array.isArray(draftStatus.draft.draftItems)) {
          const filtered = getActiveDraftItemsByType(draftStatus.draft, "service", true);
          setGetData(filtered);
          return;
        }
        const { data } = await axios.get(
          `${baseURL}/auth/api/re_calculator/quotation/${qId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const services = data.data?.services || [];
        const filtered = services.filter(isComplimentaryRecord);
        setGetData(filtered);
        return;
      }
      let endpoint = `${baseURL}/auth/api/re_calculator/getByIDComplimentaryData/${effectiveProposalId}/${effectiveClientId}`;
      if (docTypeFromURL === "proforma") {
        endpoint = `${baseURL}/auth/api/re_calculator/proformas/snapshot/${effectiveProposalId}`;
      }
      try {
        const { data } = await axios.get(endpoint, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (docTypeFromURL === "proforma") {
          const parsed = JSON.parse(data.data?.pricing_snapshot || "[]");
          const filtered = parsed.filter(isComplimentaryRecord);
          setGetData(filtered);
        } else {
          setGetData(data.data || []);
        }
      } catch (err) {
        if (err.response && err.response.status === 401) {
          throw err;
        }
        // If not found in proposal complimentary and not proforma, check if effectiveProposalId is a quotation ID
        if (err.response?.status === 404 && docTypeFromURL !== "proforma") {
          try {
            const qRes = await axios.get(
              `${baseURL}/auth/api/re_calculator/quotation/${effectiveProposalId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (qRes.data?.status === "Success" && qRes.data?.data?.id) {
              setIsDetectedQuotation(true);
              const services = qRes.data.data?.services || [];
              setGetData(services.filter(isComplimentaryRecord));
              return;
            }
          } catch (qErr) {}
        }
        setGetData([]);
      }
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
  const getAllPlanNotes = async () => {
    if (hideNotes) return;
    if (!effectiveClientId || !effectiveProposalId) return;
    try {
      if (isQuotationMode) {
        const qId = effectiveQuotationId || effectiveProposalId;
        const res = await axios.get(
          `${baseURL}/auth/api/re_calculator/quotation/${qId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        let dbNotes = [];
        if (res.data?.status === "Success" && res.data?.data?.notes_json) {
          try {
            const notes = typeof res.data.data.notes_json === "string"
              ? JSON.parse(res.data.data.notes_json)
              : res.data.data.notes_json;
            if (Array.isArray(notes)) {
              dbNotes = notes.map((n, i) => ({
                id: `db-${i + 1}`,
                note_name: typeof n === "string" ? n : n.note_name,
                _status: "saved",
              }));
            }
          } catch {
            dbNotes = [];
          }
        }

        const { checkDraftStatus } = await import("../utils/quotationDraftPersistence");
        const draftStatus = checkDraftStatus({ quotationId: qId });
        if (draftStatus?.restoreAvailable && draftStatus?.draft && Array.isArray(draftStatus.draft.notes)) {
          const draftNotes = draftStatus.draft.notes.map((n, i) => ({
            id: `draft-${i + 1}`,
            note_name: typeof n === "string" ? n : n.note_name,
            _status: "pending_add",
          }));
          setAllClientNote(draftNotes);
        } else {
          setAllClientNote(dbNotes);
        }
        return;
      }

      if (docTypeFromURL === "proforma") {
        try {
          const snapRes = await axios.get(
            `${baseURL}/auth/api/re_calculator/proformas/snapshot/${effectiveProposalId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const snapNotes = JSON.parse(snapRes.data?.data?.notes_snapshot || "[]");
          if (Array.isArray(snapNotes) && snapNotes.length > 0) {
            setAllClientNote(
              snapNotes.map((n, idx) =>
                typeof n === "string"
                  ? { id: idx + 1, note_name: n }
                  : { id: n.id || idx + 1, note_name: n.note_name || n.note_text || "" }
              )
            );
            return;
          }
        } catch (snapErr) {
          console.warn("Could not fetch proforma notes snapshot:", snapErr);
        }
      }

      const response = await axios.get(
        `${baseURL}/auth/api/re_calculator/getClientNotesbyId/${effectiveClientId}/${effectiveProposalId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const notes = response.data?.data || [];
      setAllClientNote(notes);
    } catch (error) {
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
      } else {
        setAllClientNote([]);
      }
    }
  };
  useEffect(() => {
    if (embeddedData !== undefined) {
      setGetData(embeddedData);
      return;
    }
    fetchData();
    getAllPlanNotes();
  }, [effectiveClientId, effectiveProposalId, embeddedData]);

  console.log(getData);

  const handleDelete = async (entryId) => {
    if (onServiceDeleted) {
      onServiceDeleted(entryId);
      return;
    }
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
      if (isQuotationMode) {
        const qId = effectiveQuotationId || effectiveProposalId;
        const { deleteItemFromQuotationDraft, getActiveDraftItemsByType } = await import(
          "../utils/quotationDraftPersistence"
        );
        const delRes = deleteItemFromQuotationDraft({
          quotationId: qId,
          itemId: entryId,
        });
        if (delRes?.success) {
          const activeComp = getActiveDraftItemsByType(delRes.draft, "service", true);
          setGetData(activeComp);
          Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "Complimentary entry removed from draft.",
            timer: 1000,
            showConfirmButton: false,
          });
          if (onSaveComplete) onSaveComplete();
          return;
        }
      }

      let res;
      if (docTypeFromURL === "proforma") {
        res = await axios.put(
          `${baseURL}/auth/api/re_calculator/proformas/snapshot`,
          {
            proformaId: effectiveProposalId,
            action: "delete",
            entryId: entryId
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        res = await axios.delete(
          `${baseURL}/auth/api/re_calculator/deleteComplimenatryById/${entryId}`
        );
      }

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
  const handleDeleteClientNote = async (noteId) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this note ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48", // red
      cancelButtonColor: "#6b7280", // gray
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirm.isConfirmed) return;

    try {
      if (isQuotationMode) {
        const qId = effectiveQuotationId || effectiveProposalId;
        const remaining = allClientNote.filter((item) => item.id !== noteId);
        setAllClientNote(remaining);
        const { saveNotesToQuotationDraft } = await import("../utils/quotationDraftPersistence");
        await saveNotesToQuotationDraft({
          quotationId: qId,
          notes: remaining.map((n) => ({ note_name: n.note_name })),
        });
        Swal.fire({
          icon: "success",
          title: "Removed from Draft!",
          text: "Note removed from draft. Click 'Save Quotation' on main page to commit.",
          timer: 1000,
          showConfirmButton: false,
        });
        return;
      }

      if (docTypeFromURL === "proforma") {
        const remaining = allClientNote.filter((item) => item.id !== noteId);
        setAllClientNote(remaining);
        await axios.put(
          `${baseURL}/auth/api/re_calculator/proformas/snapshot`,
          {
            proformaId: effectiveProposalId,
            action: "set",
            item: remaining.map((n) => ({ note_name: n.note_name })),
            snapshotType: "notes",
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Note has been deleted.",
          timer: 1000,
          showConfirmButton: false,
        });
        return;
      }

      const res = await axios.delete(
        `${baseURL}/auth/api/re_calculator/deletePlanClientNotes/${noteId}`
      );

      const result = res.data;

      if (result.status === "Success") {
        setAllClientNote((prev) => prev.filter((item) => item.id !== noteId));

        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "note has been deleted.",
          timer: 1000,
          showConfirmButton: false,
        });

        getAllPlanNotes();
      }
    } catch (error) {
      console.error("Error deleting note:", error);
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

  const getOrderItemAmount = (order) => {
    const qty = Number(order.quantity || 1);
    const unit = Number(order.editing_type_amount || order.unit_price || order.price || 0);
    const thumb = Number(order.include_thumbnail_creation || 0);
    const post = Number(order.include_content_posting || 0);
    const yt = Number(order.include_youtube_video_posting || 0);
    let addonsTotal = 0;
    if (order.additional_services) {
      try {
        const parsed = typeof order.additional_services === "string" ? JSON.parse(order.additional_services) : order.additional_services;
        if (Array.isArray(parsed)) {
          addonsTotal = parsed.reduce((sum, a) => sum + (Number(a.amount || a.unit_price) || 0) * (Number(a.quantity) || qty), 0);
        }
      } catch {}
    }
    const rawTotal = Number(order.total_amount || order.total_price || 0);
    if (rawTotal > 0 && rawTotal >= (unit * qty + thumb * qty + post * qty + yt * qty + addonsTotal)) {
      return rawTotal;
    }
    return (unit * qty) + (thumb * qty) + (post * qty) + (yt * qty) + addonsTotal;
  };

  const grandTotal = getData.reduce(
    (acc, order) => acc + getOrderItemAmount(order),
    0
  );
  const handleSelect = (note) => {
    handleAddPredefinedNote(note);
    setSelectedNote(null);
    setIsOpen(false);
  };
  const handleClose = () => {
    setShowModal(false);
    setFormData({
      note_name: "",
      plan: "",
    });
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const getServiceDisplayName = (name) => {
    if (!name) return name;
    const n = name.toLowerCase();
    if (n.includes("content posting")) return "Meta Growth & Content Management";
    if (n.includes("youtube video posting")) return "YouTube Channel Growth & Optimization";
    if (n.includes("google ad")) return "Google Ads Campaign Management & Optimization";
    if (n.includes("meta ad")) return "Meta Ads Campaign Management & Optimization";
    return name;
  };

  const liveServiceValue = useMemo(() => {
    const baseUnit = parseFloat(selectedEditingType?.amount || 0);
    const qty = parseInt(quantity) || 1;
    let optionalTotal = 0;
    if (shouldShowOptionalAddons && optionalServices?.length > 0) {
      optionalServices.forEach((opt) => {
        const key = opt.editing_type_name.toLowerCase().replace(/\s+/g, "_");
        if (addons[key]) {
          optionalTotal += (parseFloat(opt.amount) || 0) * qty;
        }
      });
    }
    const additionalServicesVal = selectedAdditionalServices.reduce(
      (sum, item) => sum + (Number(item.amount || item.unit_price) || 0) * qty,
      0
    );
    return baseUnit * qty + optionalTotal + additionalServicesVal;
  }, [selectedEditingType, quantity, shouldShowOptionalAddons, optionalServices, addons, selectedAdditionalServices]);

  const uniquePredefinedNotes = predefinedNotes.filter(
    (p) =>
      !allClientNote.some((c) => c.note_name === p.note_text) &&
      !selectedNotes.some((s) => s.note_name === p.note_text)
  );

  const selectCls =
    "w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 disabled:bg-gray-800 disabled:text-gray-500";
  const labelCls =
    "block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1";
  const cardCls = "bg-gray-800 rounded-xl border border-gray-700 shadow-sm p-5";

  return (
    <>
      <div className="space-y-4 w-full">
        {/* Form Card */}
        <div className={cardCls + " space-y-4"}>
          <div className="flex items-center justify-between">
            <p
              className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 ${
                editId ? "text-amber-400" : "text-emerald-400"
              }`}
            >
              <Gift className="w-4 h-4" />
              {editId
                ? "✏️ Editing Complimentary Service"
                : "🎁 Add Complimentary Service"}
            </p>
            <span className="text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              100% Free / Value Add
            </span>
          </div>

          {/* Row 1: Service + Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Service</label>
              <select
                className={selectCls}
                value={selectedService}
                onChange={(e) => handleServiceChange(e.target.value)}
                disabled={!!editId}
              >
                <option value="">-- Choose Service --</option>
                {data.map((service) => (
                  <option key={service.service_id} value={service.service_name}>
                    {service.service_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Category</label>
              <select
                className={selectCls}
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                disabled={!getSelectedService}
              >
                <option value="">-- Choose Category --</option>
                {getSelectedService?.categories?.map((category) => (
                  <option
                    key={category.category_id}
                    value={category.category_name}
                  >
                    {category.category_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Editing Type + Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {hasEditingTypesToSelect && (
              <div>
                <label className={labelCls}>
                  Editing Type <span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  className={selectCls}
                  value={(() => {
                    if (selectedEditingType?.editing_type_id)
                      return selectedEditingType.editing_type_id;
                    if (
                      selectedEditingType?.editing_type_name &&
                      getSelectedCategory?.editing_types
                    ) {
                      const found = getSelectedCategory.editing_types.find(
                        (et) =>
                          et.editing_type_name &&
                          et.editing_type_name.trim().toLowerCase() ===
                            selectedEditingType.editing_type_name
                              .trim()
                              .toLowerCase()
                      );
                      if (found) return found.editing_type_id;
                    }
                    return "";
                  })()}
                  onChange={(e) => {
                    const edit = getSelectedCategory?.editing_types.find(
                      (et) => et.editing_type_id === parseInt(e.target.value)
                    );
                    setSelectedEditingType(edit || null);
                  }}
                  disabled={!getSelectedCategory}
                >
                  <option value="">-- Choose Editing Type (Required) --</option>
                  {getSelectedCategory?.editing_types?.map((edit) => (
                    <option
                      key={edit.editing_type_id}
                      value={edit.editing_type_id}
                    >
                      {edit.editing_type_name || "Standard"} — ₹{edit.amount}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className={hasEditingTypesToSelect ? "" : "sm:col-span-2"}>
              <label className={labelCls}>Quantity</label>
              <input
                type="number"
                className={selectCls}
                min={1}
                value={quantity}
                onChange={(e) =>
                  setQuantity(parseInt(e.target.value) || 1)
                }
              />
            </div>
          </div>

          {/* Additional Services (Checkboxes) */}
          {selectedCategory && availableAddons.length > 0 && (
            <div className="bg-gray-700/50 rounded-xl p-3 border border-gray-600 space-y-2">
              <div className="flex items-center justify-between">
                <label className={labelCls}>Additional Services</label>
                <span className="text-[11px] text-gray-400">
                  (Qty: {quantity})
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                {availableAddons.map((addon) => {
                  const addonName = addon.name || addon.additional_service_name;
                  const isChecked = selectedAdditionalServices.some(
                    (item) =>
                      String(item.id) === String(addon.id) ||
                      (item.name || item.additional_service_name) === addonName
                  );
                  return (
                    <label
                      key={addon.id}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition select-none ${
                        isChecked
                          ? "bg-emerald-500/15 border-emerald-500/50 text-white"
                          : "bg-gray-800/60 border-gray-600 text-gray-300 hover:bg-gray-700/70"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAdditionalServices((prev) => [
                                ...prev,
                                {
                                  id: addon.id,
                                  name: addonName,
                                  additional_service_name: addonName,
                                  amount: Number(addon.amount) || 0,
                                  category_id:
                                    addon.category_id ||
                                    getSelectedCategory?.category_id,
                                  category_name:
                                    addon.category_name ||
                                    getSelectedCategory?.category_name,
                                  service_name: selectedService,
                                },
                              ]);
                            } else {
                              setSelectedAdditionalServices((prev) =>
                                prev.filter(
                                  (item) =>
                                    String(item.id) !== String(addon.id) &&
                                    (item.name || item.additional_service_name) !==
                                      addonName
                                )
                              );
                            }
                          }}
                          className="w-4 h-4 rounded text-emerald-600 bg-gray-700 border-gray-500 focus:ring-emerald-500 focus:ring-offset-gray-800"
                        />
                        <span className="text-sm font-medium truncate">
                          {addonName}
                        </span>
                      </div>
                      <div className="flex flex-col items-end flex-shrink-0 ml-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          + ₹{Number(addon.amount).toLocaleString()} (Free)
                        </span>
                        {quantity > 1 && (
                          <span className="text-[10px] text-gray-400 mt-0.5">
                            ₹{(Number(addon.amount) * quantity).toLocaleString()}{" "}
                            value
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Optional Add-ons */}
          {shouldShowOptionalAddons && optionalServices?.length > 0 && (
            <div>
              <label className={labelCls}>Optional Add-ons</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {optionalServices
                  .filter((opt) => {
                    if (selectedService !== "Graphics Design") return true;
                    const name = opt.editing_type_name?.toLowerCase() || "";
                    return (
                      name !== "youtube video posting" &&
                      name !== "youtube channel growth & optimization" &&
                      name !== "thumbnail creation"
                    );
                  })
                  .map((opt) => {
                    const key = opt.editing_type_name
                      .toLowerCase()
                      .replace(/\s+/g, "_");

                    return (
                      <div
                        key={key}
                        className="flex items-center gap-1.5 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
                      >
                        <span className="text-sm text-white font-medium">
                          {getServiceDisplayName(opt.editing_type_name)}
                        </span>
                        <span className="text-xs text-gray-400">
                          ₹{opt.amount}
                        </span>
                        <div className="flex gap-1 ml-2">
                          <button
                            type="button"
                            onClick={() =>
                              setAddons((p) => ({ ...p, [key]: true }))
                            }
                            className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                              addons[key]
                                ? "bg-green-500 text-white"
                                : "bg-gray-600 text-gray-300 hover:bg-green-900"
                            }`}
                          >
                            YES
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setAddons((p) => ({ ...p, [key]: false }))
                            }
                            className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                              !addons[key]
                                ? "bg-red-500 text-white"
                                : "bg-gray-600 text-gray-300 hover:bg-red-900"
                            }`}
                          >
                            NO
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Live Service Value Preview */}
          {(selectedEditingType || selectedAdditionalServices.length > 0 || liveServiceValue > 0) && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm">
              <span className="text-gray-300 font-medium flex items-center gap-2">
                <Gift className="w-4 h-4 text-emerald-400" />
                Service Value:
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-emerald-400 font-bold text-base">
                  ₹{liveServiceValue.toLocaleString()}
                </span>
                <span className="text-[11px] text-emerald-300/80">
                  (Complimentary / Free)
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition shadow-sm text-sm flex items-center justify-center gap-2"
            >
              {loading
                ? "Saving..."
                : editId
                ? "✔ Update Entry"
                : "💾 Calculate & Save"}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2.5 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition text-sm font-medium"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Complimentary Summary Card */}
        <div className={cardCls}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-emerald-400" />
              Complimentary Summary
            </span>
            <span className="text-xs bg-emerald-500/20 text-emerald-400 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Value Provided at Zero Cost
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-700">
            <span className="text-sm text-gray-400">Total Complimentary Value</span>
            <span className="text-2xl font-black text-emerald-400 tracking-tight">
              ₹{grandTotal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Recent Client Orders */}
        {getData.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Package className="w-4 h-4 text-red-400" />
              Recent Client Orders ({getData.length})
            </h3>
            {getData.map((order) => (
              <div
                key={order.id}
                className={cardCls + " hover:border-red-500/50 transition"}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left Section: Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                      <span>
                        {order.service_name} → {order.category_name}
                      </span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {order.editing_type_name && order.editing_type_name !== "null" && order.editing_type_name !== "N/A"
                        ? `🎬 ${order.editing_type_name} × ${order.quantity}`
                        : `📦 Qty: ${order.quantity}`}
                    </p>
                    {/* Additional services badges */}
                    {(() => {
                      let parsedAddons = [];
                      if (order.additional_services) {
                        try {
                          parsedAddons = typeof order.additional_services === "string" ? JSON.parse(order.additional_services) : order.additional_services;
                          if (!Array.isArray(parsedAddons)) parsedAddons = [];
                        } catch {
                          parsedAddons = [];
                        }
                      }
                      if (parsedAddons.length === 0) return null;
                      return (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {parsedAddons.map((addon, aIdx) => (
                            <span key={aIdx} className="text-xs bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full">
                              ✨ {addon.name || addon.additional_service_name} (+₹{addon.amount || addon.unit_price})
                            </span>
                          ))}
                        </div>
                      );
                    })()}
                    {(Number(order.include_content_posting) > 0 ||
                      Number(order.include_thumbnail_creation) > 0) && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {Number(order.include_content_posting) > 0 && (
                          <span className="text-xs bg-red-500/20 border border-red-500/30 text-red-400 px-2 py-0.5 rounded-full">
                            📢 Meta Growth & Content Mgmt
                          </span>
                        )}
                        {Number(order.include_thumbnail_creation) > 0 && (
                          <span className="text-xs bg-orange-500/20 border border-orange-500/30 text-orange-400 px-2 py-0.5 rounded-full">
                            🖼 Thumbnail Creation
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Section: Amount + Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-bold text-emerald-400 text-base">
                      ₹{getOrderItemAmount(order).toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleEdit(order)}
                      className="w-8 h-8 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(order.id)}
                      className="w-8 h-8 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Notes Section */}
        {!hideNotes && (
          <>
            <div className={cardCls + " space-y-3"}>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-orange-400" />
                Notes Section
              </h3>

              {/* Predefined Note Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <div
                  onClick={() => setIsOpen(!isOpen)}
                  className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg border border-gray-600 bg-gray-700 text-sm cursor-pointer hover:border-gray-500 transition"
                >
                  <span className="text-gray-300 truncate">
                    {selectedNote
                      ? selectedNote.note_text
                      : "-- Select Predefined Note --"}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                </div>
                {isOpen && (
                  <div className="absolute z-20 w-full mt-1 max-h-56 overflow-auto rounded-lg border border-gray-600 bg-gray-800 shadow-2xl">
                    {uniquePredefinedNotes.length === 0 ? (
                      <p className="text-center text-gray-500 text-sm py-4">
                        No more predefined notes
                      </p>
                    ) : (
                      uniquePredefinedNotes.map((note) => (
                        <div
                          key={note.id}
                          onClick={() => handleSelect(note)}
                          className="px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-0 transition"
                        >
                          {note.note_text}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Manual Note Input */}
              <div className="flex gap-2">
                <textarea
                  rows={1}
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  placeholder="Enter custom note..."
                  className="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 resize-none"
                />
                <button
                  onClick={handleAddManualNote}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition flex items-center gap-1"
                >
                  + Add
                </button>
              </div>

              {/* Selected Notes List */}
              {selectedNotes.length > 0 && (
                <div className="space-y-1.5">
                  {selectedNotes.map((note) => (
                    <div
                      key={note.id}
                      className="flex items-start gap-2 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
                    >
                      <span className="flex-1 text-sm text-gray-300 leading-relaxed">
                        {note.note_name}
                      </span>
                      <button
                        onClick={() => handleRemoveNote(note.id)}
                        className="w-5 h-5 rounded-full bg-red-100 hover:bg-red-200 text-red-500 flex items-center justify-center flex-shrink-0 text-xs font-bold transition"
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={handleSaveNotes}
                className="w-full py-2.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold transition shadow-sm flex items-center justify-center gap-2"
              >
                💾 Save Notes
              </button>
            </div>

            {/* Saved Notes List */}
            {allClientNote.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Saved Notes ({allClientNote.length})
                </h3>
                {allClientNote.map((notes) => (
                  <div
                    key={notes.id}
                    className="flex items-start gap-3 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 hover:border-gray-600 transition"
                  >
                    <span className="flex-1 text-sm text-gray-300 leading-relaxed flex items-center gap-2">
                      <span>→ {notes.note_name}</span>
                      {notes._status === "pending_add" && (
                        <span className="text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded font-medium">
                          Draft
                        </span>
                      )}
                    </span>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNotesId(notes);
                          setFormData({
                            note_name: notes.note_name,
                            plan: notes.plan,
                          });
                          setIsEditing(true);
                          setShowModal(true);
                        }}
                        className="w-7 h-7 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition"
                        title="Edit"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteClientNote(notes.id)}
                        className="w-7 h-7 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Note Edit Modal */}
            {showModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                  onClick={handleClose}
                />
                <div className="relative w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
                  <div className="h-1 w-full bg-gradient-to-r from-orange-500 to-red-500" />
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-orange-500/20 rounded-xl flex items-center justify-center">
                        <StickyNote className="w-4 h-4 text-orange-400" />
                      </div>
                      <h2 className="font-bold text-white">
                        {isEditing ? "Edit Note" : "Add Note"}
                      </h2>
                    </div>
                    <button
                      onClick={handleClose}
                      className="w-8 h-8 rounded-lg hover:bg-gray-700 text-gray-400 flex items-center justify-center transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <textarea
                      name="note_name"
                      value={formData.note_name}
                      onChange={handleChange}
                      rows={4}
                      required
                      placeholder="Enter note..."
                      className="w-full rounded-xl border border-gray-600 bg-gray-700 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 py-2.5 border border-gray-600 text-gray-300 hover:bg-gray-700 rounded-xl text-sm font-medium transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white rounded-xl text-sm font-bold transition"
                      >
                        {loading ? "Saving..." : isEditing ? "Update" : "Save"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default ComplimentaryCalculator;
