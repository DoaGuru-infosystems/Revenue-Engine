import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useLocation, useParams, useNavigate } from "react-router-dom";
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
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../../../redux/user/userSlice";
import DiscountCard from "../../../shared/invoice-calculator/DiscountCard";
import DiscountModal from "../../../shared/invoice-calculator/DiscountModal";
import ComplimentaryCalculator from "./ComplimentaryCalculator";
import API_BASE_URL from "../../../config/apiBaseUrl";

const GraphicCalculator = ({
  hideNotes,
  onSaveComplete,
  proposalIdOverride,
  onServiceAdded,
  onServiceDeleted,
  embeddedData,
}) => {
  const location = useLocation();
  const [serviceType, setServiceType] = useState("paid");
  const baseURL = API_BASE_URL;
  const dispatch = useDispatch();
  const { currentUser, token } = useSelector((state) => state.user);
  const userName = currentUser?.name;
  const params = useParams();
  const id = params.id || params.clientId;
  const proposalId = proposalIdOverride !== undefined ? proposalIdOverride : params.proposalId;
  const searchParams = new URLSearchParams(location.search);
  const docTypeFromURL = searchParams.get("doc");
  const [data, setData] = useState([]);
  const [selectedService, setSelectedService] = useState("");
  const [selecteddiscount, setSelecteddiscount] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedEditingType, setSelectedEditingType] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [getData, setGetData] = useState([]);
  const [optionalServices, setOptionalServices] = useState([]);

  const [addons, setAddons] = useState({});
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);

  const navigate = useNavigate();
  const [editId, setEditId] = useState(null);
  const [allClientNote, setAllClientNote] = useState([]);
  const [discountDataSet, setDiscountDataSet] = useState(null);
  const [formData, setFormData] = useState({
    note_name: "",
    plan: "Customise",
  });
  const [formDataDiscount, setFormDataDiscount] = useState({
    discount_type: "amount",
    discount_per: "",
    discount_amt: "",
  });

  const [selectedNotesId, setSelectedNotesId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showModalDiscount, setShowModalDiscount] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [predefinedNotes, setPredefinedNotes] = useState([]);
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [manualNote, setManualNote] = useState("");
  const dropdownRef = useRef(null);

  const defaultNotes = [
    {
      id: 1,
      note_name:
        "The client pays for the Meta ad budget, and ad service charges will apply only if the client wants to run the ad.",
    },
    {
      id: 2,
      note_name:
        "All creative assets (raw footage, brand guidelines, logos, product images) must be provided by the client.",
    },
    {
      id: 3,
      note_name:
        "Standard delivery timeline is 2-4 business days per deliverable from the date of brief approval.",
    },
    {
      id: 4,
      note_name:
        "Includes up to 2 rounds of revisions per creative. Additional revisions will be charged separately.",
    },
    {
      id: 5,
      note_name:
        "Payment terms: 50% advance before project commencement, balance 50% upon delivery/completion.",
    },
  ];

  const fetchDiscountSettings = async () => {
    try {
      const response = await axios.get(
        `${baseURL}/auth/api/re_calculator/getDiscountSetting`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDiscountDataSet(response.data.data[0]);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchDiscountSettings();
  }, []);

  const handleOpenDiscountModal = () => {
    if (selecteddiscount) {
      setFormDataDiscount({
        discount_type: selecteddiscount.discount_type,
        discount_per: selecteddiscount.discount_per || "",
        discount_amt: selecteddiscount.discount_amt || "",
      });
    } else {
      setFormDataDiscount({
        discount_type: "amount",
        discount_per: "",
        discount_amt: "",
      });
    }
    setShowModalDiscount(true);
  };

  const handleCloseDiscount = () => {
    setShowModalDiscount(false);
  };

  const handleChangeDiscount = (e) => {
    const { name, value } = e.target;
    setFormDataDiscount((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveDiscount = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        discount_type: formDataDiscount.discount_type,
        discount_per:
          formDataDiscount.discount_type === "percent"
            ? formDataDiscount.discount_per
            : null,
        discount_amt:
          formDataDiscount.discount_type === "amount"
            ? formDataDiscount.discount_amt
            : null,
      };

      if (selecteddiscount) {
        await axios.put(
          `${baseURL}/auth/api/re_calculator/updateDiscount/${selecteddiscount.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Discount updated successfully!",
        });
      } else {
        await axios.post(
          `${baseURL}/auth/api/re_calculator/insertDiscount`,
          {
            ...payload,
            client_id: id,
            proposal_id: proposalId,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Swal.fire({
          icon: "success",
          title: "Applied!",
          text: "Discount applied successfully!",
        });
      }

      fetchDiscount();
      handleCloseDiscount();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || "Failed to save discount",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDiscount = async () => {
    if (!selecteddiscount) return;

    const result = await Swal.fire({
      title: "Remove Discount?",
      text: "Are you sure you want to remove this discount?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, remove it!",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(
          `${baseURL}/auth/api/re_calculator/deleteDiscount/${selecteddiscount.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Swal.fire({
          icon: "success",
          title: "Removed!",
          text: "Discount has been removed.",
        });
        setSelecteddiscount(null);
        handleCloseDiscount();
      } catch (err) {
        console.error(err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to delete discount",
        });
      }
    }
  };

  const fetchDiscount = async () => {
    try {
      const response = await axios.get(
        `${baseURL}/auth/api/re_calculator/getDiscountById/${id}/${proposalId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.data.length > 0) {
        setSelecteddiscount(response.data.data[0]);
      } else {
        setSelecteddiscount(null);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchDiscount();
  }, [id, proposalId]);

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

  const handleSelectNote = (note) => {
    setSelectedNote(note);
    if (!selectedNotes.some((n) => n.id === note.id)) {
      setSelectedNotes([...selectedNotes, note]);
    }
    setIsOpen(false);
  };

  const handleAddManualNote = () => {
    if (manualNote.trim()) {
      const newNote = {
        id: Date.now(),
        note_name: manualNote.trim(),
        isManual: true,
      };
      setSelectedNotes([...selectedNotes, newNote]);
      setManualNote("");
    }
  };

  const handleRemoveNote = (idToRemove) => {
    setSelectedNotes(selectedNotes.filter((note) => note.id !== idToRemove));
    if (selectedNote?.id === idToRemove) {
      setSelectedNote(null);
    }
  };

  const handleSaveNotes = async () => {
    if (selectedNotes.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "No notes selected",
        text: "Please select or add at least one note before saving.",
      });
      return;
    }

    try {
      const notesToSave = selectedNotes.map((note) => ({
        note_name: note.note_name,
        plan: "Customise",
        client_id: id,
      }));

      await Promise.all(
        notesToSave.map((noteData) =>
          axios.post(`${baseURL}/auth/api/re_calculator/insertClientNote`, noteData, {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "All notes saved successfully!",
      });

      setSelectedNotes([]);
      setSelectedNote(null);
      fetchClientNotes();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to save notes. Please try again.",
      });
    }
  };

  const fetchClientNotes = async () => {
    try {
      const response = await axios.get(
        `${baseURL}/auth/api/re_calculator/getClientNotesById/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAllClientNote(response.data.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchClientNotes();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClose = () => {
    setShowModal(false);
    setIsEditing(false);
    setSelectedNotesId(null);
    setFormData({
      note_name: "",
      plan: "Customise",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing) {
        await axios.put(
          `${baseURL}/auth/api/re_calculator/updateClientNote/${selectedNotesId.id}`,
          { ...formData, client_id: id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Note updated successfully!",
        });
      } else {
        await axios.post(
          `${baseURL}/auth/api/re_calculator/insertClientNote`,
          { ...formData, client_id: id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Note added successfully!",
        });
      }

      fetchClientNotes();
      handleClose();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to save note",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClientNote = async (noteId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(
          `${baseURL}/auth/api/re_calculator/deleteClientNote/${noteId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Swal.fire("Deleted!", "Your note has been deleted.", "success");
        fetchClientNotes();
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Failed to delete note", "error");
      }
    }
  };

  const getClientDetails = async () => {
    try {
      await axios.get(
        `${baseURL}/auth/api/re_calculator/getClientDetailsById/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.log(err);
      if (err.response && err.response.status === 401) {
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
      }
    }
  };

  useEffect(() => {
    getClientDetails();
  }, [id]);

  const handleEdit = (item) => {
    setEditId(item.id);
    setSelectedService(item.service_name);
    setSelectedCategory(item.category_name);

    const fullEditingType = data.find(
      (d) =>
        d.service_name === item.service_name &&
        d.category_name === item.category_name &&
        d.editing_type_name === item.editing_type_name
    );

    setSelectedEditingType(
      fullEditingType || {
        editing_type_name: item.editing_type_name,
        editing_type_amount: item.editing_type_amount,
      }
    );

    setQuantity(item.quantity);

    setAddons({
      contentPosting: item.include_content_posting === "1",
      thumbnailCreation: item.include_thumbnail_creation === "1",
    });
  };

  const handleSave = async () => {
    if (!selectedService || !selectedCategory || !selectedEditingType) {
      Swal.fire({
        icon: "warning",
        title: "Required Fields Missing",
        text: "Please select Service, Category, and Editing Type before saving.",
      });
      return;
    }

    const payload = {
      id: editId || Date.now(),
      service_name: selectedService,
      category_name: selectedCategory,
      editing_type_name: selectedEditingType.editing_type_name,
      editing_type_amount: selectedEditingType.editing_type_amount,
      quantity,
      addons,
      total_amount: currentTotal,
      client_id: id,
      txn_id: proposalId,
    };

    if (onServiceAdded) {
      onServiceAdded({
        id: payload.id,
        service: `${payload.service_name} - ${payload.category_name} (${payload.editing_type_name})`,
        service_name: payload.service_name,
        category_name: payload.category_name,
        editing_type_name: payload.editing_type_name,
        quantity: payload.quantity,
        unit_price: Number(payload.editing_type_amount) || 0,
        total_price: Number(payload.total_amount) || 0,
        total_amount: Number(payload.total_amount) || 0,
        include_in_total: true,
        source: "custom_graphic",
      });

      Swal.fire({
        icon: "success",
        title: editId ? "Updated!" : "Added!",
        text: "Service added to proposal successfully.",
        showConfirmButton: false,
        timer: 1000,
      });

      setSelectedEditingType(null);
      setQuantity(1);
      setAddons({});
      setEditId(null);
      return;
    }

    try {
      setLoading(true);
      let res;

      if (docTypeFromURL === "proforma") {
        res = await fetch(`${baseURL}/auth/api/re_calculator/proformas/snapshot`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            proformaId: proposalId,
            action: editId ? "update" : "addBulk",
            editId: editId ? String(editId) : undefined,
            item: editId ? payload : [payload],
            snapshotType: "graphic",
          }),
        });
      } else {
        res = editId
          ? await axios.put(
              `${baseURL}/auth/api/re_calculator/updateCalculatorTransactionsById/${editId}`,
              payload,
              { headers: { Authorization: `Bearer ${token}` } }
            )
          : await axios.post(
              `${baseURL}/auth/api/re_calculator/saveCalculatorData`,
              payload,
              { headers: { Authorization: `Bearer ${token}` } }
            );
      }

      const result = docTypeFromURL === "proforma" ? await res.json() : res.data;

      if (result.status === "Success") {
        fetchTransactions();
        if (onSaveComplete) onSaveComplete();

        Swal.fire({
          icon: "success",
          title: editId ? "Updated!" : "Saved!",
          text: editId
            ? "Service updated successfully!"
            : "Service saved successfully!",
          showConfirmButton: false,
          timer: 1000,
        });

        setSelectedEditingType(null);
        setQuantity(1);
        setAddons({});
        setEditId(null);
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Failed!",
        text: "Failed to save service.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#4b5563",
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      if (onServiceDeleted) {
        onServiceDeleted(itemId);
        setGetData((prev) => prev.filter((item) => item.id !== itemId));
        Swal.fire({
          title: "Deleted!",
          text: "Item has been removed from proposal.",
          icon: "success",
          timer: 1000,
          showConfirmButton: false,
        });
        return;
      }

      try {
        let res;
        if (docTypeFromURL === "proforma") {
          res = await axios.put(
            `${baseURL}/auth/api/re_calculator/proformas/snapshot`,
            {
              proformaId: proposalId,
              action: "delete",
              entryId: itemId,
              snapshotType: "graphic",
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } else {
          res = await axios.delete(
            `${baseURL}/auth/api/re_calculator/deleteGraphicEntryById/${itemId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }

        const result = res.data;
        if (result.status === "Success") {
          fetchTransactions();
          Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "Entry has been deleted.",
            timer: 1000,
            showConfirmButton: false,
          });
        }
      } catch (err) {
        console.error("Error deleting entry:", err);
      }
    }
  };

  const fetchTransactions = async () => {
    if (!id || !proposalId) return;
    try {
      let endpoint = `${baseURL}/auth/api/re_calculator/getByIDCalculatorTransactions/${proposalId}/${id}`;
      if (docTypeFromURL === "proforma") {
        endpoint = `${baseURL}/auth/api/re_calculator/proformas/snapshot/${proposalId}`;
      }
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.status === "Success") {
        if (docTypeFromURL === "proforma") {
          const parsed = JSON.parse(res.data.data.graphic_snapshot || "[]");
          setGetData(parsed);
        } else {
          setGetData(res.data.data);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [id, proposalId]);

  const fetchServices = async () => {
    try {
      const res = await axios.get(`${baseURL}/auth/api/re_calculator/getAddServices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const uniqueServices = Array.from(
    new Set(data.map((item) => item.service_name).filter(Boolean))
  );

  const categoriesForService = Array.from(
    new Set(
      data
        .filter((item) => item.service_name === selectedService)
        .map((item) => item.category_name)
        .filter(Boolean)
    )
  );

  const editingTypesForCategory = data.filter(
    (item) =>
      item.service_name === selectedService &&
      item.category_name === selectedCategory &&
      item.editing_type_name
  );

  const handleServiceChange = (e) => {
    setSelectedService(e.target.value);
    setSelectedCategory("");
    setSelectedEditingType(null);
    setQuantity(1);
    setAddons({});
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setSelectedEditingType(null);
    setQuantity(1);
    setAddons({});
  };

  const handleEditingTypeSelect = (type) => {
    setSelectedEditingType(type);
  };

  const handleQuantityChange = (delta) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleAddonToggle = (addonKey) => {
    setAddons((prev) => ({
      ...prev,
      [addonKey]: !prev[addonKey],
    }));
  };

  const calculateItemTotal = (item) => {
    const base = Number(item.editing_type_amount) || 0;
    const qty = Number(item.quantity) || 1;
    let totalVal = base * qty;
    if (item.include_content_posting === "1") totalVal += 1000 * qty;
    if (item.include_thumbnail_creation === "1") totalVal += 500 * qty;
    return totalVal;
  };

  const currentTotal = (() => {
    if (!selectedEditingType) return 0;
    const base = Number(selectedEditingType.editing_type_amount) || 0;
    let totalVal = base * quantity;
    if (addons.contentPosting) totalVal += 1000 * quantity;
    if (addons.thumbnailCreation) totalVal += 500 * quantity;
    return totalVal;
  })();

  const grandTotal = getData.reduce(
    (sum, item) => sum + calculateItemTotal(item),
    0
  );

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      const isBd = location.pathname.startsWith("/BD");
      const basePath = isBd ? "/BD" : "/admin";
      const servicesLandingPath = isBd ? "AddService" : "ServicesLanding";
      const fallbackUrl =
        docTypeFromURL === "proforma"
          ? `${basePath}/${servicesLandingPath}/${id}/${proposalId}?doc=proforma`
          : `${basePath}/${servicesLandingPath}/${id}/${proposalId}`;
      navigate(fallbackUrl);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4">
        <div className="w-full max-w-4xl bg-gray-800/60 backdrop-blur-md rounded-2xl shadow-xl border border-gray-700/50 p-6 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-gray-700/50">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {!onServiceAdded && (
                <button
                  onClick={handleBack}
                  className="p-2.5 rounded-xl bg-gray-700/50 hover:bg-gray-700 text-gray-300 transition hover:scale-105"
                  title="Go Back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                Service Calculator
              </h1>
            </div>

            {/* Toggle service type */}
            <div className="flex bg-gray-900/60 p-1 rounded-xl border border-gray-700/50 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setServiceType("paid")}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  serviceType === "paid"
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Standard Services
              </button>
              <button
                type="button"
                onClick={() => setServiceType("complimentary")}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  serviceType === "complimentary"
                    ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-md"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Complimentary
              </button>
            </div>
          </div>

          {serviceType === "paid" ? (
            <div className="space-y-6">
              {/* Service & Category Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Select Service
                  </label>
                  <select
                    value={selectedService}
                    onChange={handleServiceChange}
                    className="w-full bg-gray-900/60 border border-gray-700 rounded-xl p-3 text-white focus:border-orange-500 outline-none"
                  >
                    <option value="">-- Choose Service --</option>
                    {uniqueServices.map((svc) => (
                      <option key={svc} value={svc}>
                        {svc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Select Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                    disabled={!selectedService}
                    className="w-full bg-gray-900/60 border border-gray-700 rounded-xl p-3 text-white focus:border-orange-500 outline-none disabled:opacity-50"
                  >
                    <option value="">-- Choose Category --</option>
                    {categoriesForService.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Editing Types */}
              {selectedCategory && editingTypesForCategory.length > 0 && (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Select Editing Type / Tier
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {editingTypesForCategory.map((type) => {
                      const isSelected = selectedEditingType?.id === type.id;
                      return (
                        <div
                          key={type.id}
                          onClick={() => handleEditingTypeSelect(type)}
                          className={`p-4 rounded-xl border cursor-pointer transition ${
                            isSelected
                              ? "bg-orange-500/20 border-orange-500 shadow-md"
                              : "bg-gray-800/60 border-gray-700 hover:border-gray-600"
                          }`}
                        >
                          <p className="font-semibold text-sm text-white">
                            {type.editing_type_name}
                          </p>
                          <p className="text-xs text-orange-400 font-bold mt-1">
                            ₹{Number(type.editing_type_amount).toLocaleString()}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity, Addons, and Save */}
              {selectedEditingType && (
                <div className="p-4 bg-gray-800/40 rounded-xl border border-gray-700/50 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-300">Quantity:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(-1)}
                        className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center font-bold"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) =>
                          setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                        }
                        className="w-16 text-center bg-gray-900 border border-gray-700 rounded-lg py-1 text-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(1)}
                        className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Total Price</p>
                      <p className="text-lg font-bold text-orange-400">
                        ₹{currentTotal.toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-xl transition shadow-lg"
                    >
                      {editId ? "Update Service" : "Add Service"}
                    </button>
                  </div>
                </div>
              )}

              {/* Saved Items */}
              {getData.length > 0 && !onServiceAdded && (
                <div className="space-y-3 pt-6 border-t border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-white">Added Services</h3>
                    <p className="text-sm text-gray-400">
                      Total: <span className="font-bold text-orange-400">₹{grandTotal.toLocaleString()}</span>
                    </p>
                  </div>
                  <div className="space-y-2">
                    {getData.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 bg-gray-800/50 rounded-xl border border-gray-700 flex items-center justify-between gap-4"
                      >
                        <div>
                          <p className="font-semibold text-white">
                            {item.service_name} - {item.category_name} ({item.editing_type_name})
                          </p>
                          <p className="text-xs text-gray-400">
                            Qty: {item.quantity} • Total: ₹{calculateItemTotal(item).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <ComplimentaryCalculator
              hideNotes={hideNotes}
              onSaveComplete={onSaveComplete}
              proposalIdOverride={proposalIdOverride}
              onServiceAdded={onServiceAdded}
              onServiceDeleted={onServiceDeleted}
              embeddedData={
                embeddedData
                  ? embeddedData.filter(
                      (r) => r.is_complimentary || r.source === "custom_complimentary"
                    )
                  : undefined
              }
            />
          )}
        </div>
      </div>

      {/* Note Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
          <div className="relative w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
            <div className="h-1 w-full bg-gradient-to-r from-orange-500 to-red-500" />
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <StickyNote className="w-4 h-4 text-orange-400" />
                </div>
                <h2 className="font-bold text-white">{isEditing ? "Edit Note" : "Add Note"}</h2>
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

      {/* Discount Modal */}
      <DiscountModal
        show={showModalDiscount}
        onClose={handleCloseDiscount}
        onSubmit={handleSaveDiscount}
        formDataDis={formDataDiscount}
        handleChangeDis={handleChangeDiscount}
        isEditingDis={!!selecteddiscount}
        loading={loading}
        grandTotal={grandTotal}
        discountDataSet={discountDataSet}
      />
    </>
  );
};

export default GraphicCalculator;
