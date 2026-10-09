import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../../../redux/user/userSlice";
import API_BASE_URL from "../../../config/apiBaseUrl";

const ComplimentaryCalculator = ({
  hideNotes = false,
  onSaveComplete,
  proposalIdOverride,
  onServiceAdded,
  onServiceDeleted,
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
  const effectiveClientId = id || clientId;
  const effectiveProposalId = proposalIdOverride || proposalId;
  const [data, setData] = useState([]);

  const [selectedService, setSelectedService] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedEditingType, setSelectedEditingType] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [getData, setGetData] = useState([]);
  const [allClientNote, setAllClientNote] = useState([]);
  const [optionalServices, setOptionalServices] = useState([]);

  const [addons, setAddons] = useState({});

  const [loading, setLoading] = useState(false);

  const [total, setTotal] = useState(0);
  const navigate = useNavigate();
  const [editId, setEditId] = useState(null);
  const [allPlanNote, setAllPlanNote] = useState([]);
  const [formData, setFormData] = useState({
    note_name: "",
    plan: "Customise",
  });
  const [selectedNotesId, setSelectedNotesId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [predefinedNotes, setPredefinedNotes] = useState([]);
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [manualNote, setManualNote] = useState("");
  const [selectedNote, setSelectedNote] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    setShowModal(false);
    setIsEditing(false);
    setSelectedNotesId(null);
    setFormData({ note_name: "", plan: "Customise" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing) {
        await axios.put(
          `${baseURL}/auth/api/re_calculator/updateClientNote/${selectedNotesId.id}`,
          { ...formData, client_id: effectiveClientId },
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
          { ...formData, client_id: effectiveClientId },
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
        client_id: effectiveClientId,
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
    if (!effectiveClientId) return;
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/re_calculator/getClientNotesById/${effectiveClientId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.status === "Success") {
        setAllClientNote(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteClientNote = async (noteId) => {
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
      try {
        await axios.delete(`${baseURL}/auth/api/re_calculator/deleteClientNote/${noteId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Swal.fire("Deleted!", "Note has been deleted.", "success");
        fetchClientNotes();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const fetchServicesData = async () => {
    try {
      const res = await axios.get(`${baseURL}/auth/api/re_calculator/getAddServices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPredefinedNotes = async () => {
    try {
      const res = await axios.get(`${baseURL}/auth/api/re_calculator/getNoteData`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPredefinedNotes(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTransactions = async () => {
    if (!effectiveProposalId || !effectiveClientId) return;
    try {
      let endpoint = `${baseURL}/auth/api/re_calculator/getByIDComplimentaryData/${effectiveProposalId}/${effectiveClientId}`;
      if (docTypeFromURL === "proforma") {
        endpoint = `${baseURL}/auth/api/re_calculator/proformas/snapshot/${effectiveProposalId}`;
      }
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.status === "Success") {
        if (docTypeFromURL === "proforma") {
          const parsed = JSON.parse(res.data.data.complimentary_snapshot || "[]");
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
    fetchServicesData();
    fetchPredefinedNotes();
    fetchTransactions();
    fetchClientNotes();
  }, [effectiveClientId, effectiveProposalId]);

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

  const handleAddonToggle = (addonName) => {
    setAddons((prev) => ({
      ...prev,
      [addonName]: !prev[addonName],
    }));
  };

  const calculateItemTotal = () => {
    if (!selectedEditingType) return 0;
    const base = Number(selectedEditingType.editing_type_amount) || 0;
    return base * quantity;
  };

  const handleSaveService = async () => {
    if (!selectedService || !selectedCategory || !selectedEditingType) {
      Swal.fire("Incomplete selection", "Please select service, category, and editing type.", "warning");
      return;
    }

    const payload = {
      id: Date.now(),
      service_name: selectedService,
      category_name: selectedCategory,
      editing_type_name: selectedEditingType.editing_type_name,
      editing_type_amount: Number(selectedEditingType.editing_type_amount) || 0,
      quantity,
      total_amount: calculateItemTotal(),
      total_price: calculateItemTotal(),
      unit_price: Number(selectedEditingType.editing_type_amount) || 0,
      include_in_total: false,
      is_complimentary: true,
      source: "custom_complimentary",
      addons,
      client_id: effectiveClientId,
      txn_id: effectiveProposalId,
    };

    if (onServiceAdded) {
      onServiceAdded(payload);
      Swal.fire({
        icon: "success",
        title: "Added!",
        text: "Complimentary service added to proposal.",
        timer: 1000,
        showConfirmButton: false,
      });
      setSelectedEditingType(null);
      setQuantity(1);
      setAddons({});
      return;
    }

    try {
      setLoading(true);
      if (docTypeFromURL === "proforma") {
        await fetch(`${baseURL}/auth/api/re_calculator/proformas/snapshot`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            proformaId: effectiveProposalId,
            action: "addBulk",
            item: [payload],
            snapshotType: "complimentary",
          }),
        });
      } else {
        await axios.post(`${baseURL}/auth/api/re_calculator/saveComplimenatryData`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      Swal.fire({
        icon: "success",
        title: "Saved!",
        text: "Complimentary service saved successfully.",
        timer: 1000,
        showConfirmButton: false,
      });

      fetchTransactions();
      setSelectedEditingType(null);
      setQuantity(1);
      setAddons({});
      if (onSaveComplete) onSaveComplete();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to save complimentary service.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = async (transId) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Delete this complimentary service?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#4b5563",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirm.isConfirmed) return;

    if (onServiceDeleted) {
      onServiceDeleted(transId);
      setGetData((prev) => prev.filter((item) => item.id !== transId));
      Swal.fire("Deleted!", "Removed from proposal.", "success");
      return;
    }

    try {
      if (docTypeFromURL === "proforma") {
        await axios.put(
          `${baseURL}/auth/api/re_calculator/proformas/snapshot`,
          {
            proformaId: effectiveProposalId,
            action: "delete",
            entryId: transId,
            snapshotType: "complimentary",
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.delete(`${baseURL}/auth/api/re_calculator/deleteComplimenatryById/${transId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      Swal.fire("Deleted!", "Entry deleted.", "success");
      fetchTransactions();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to delete.", "error");
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      const isBd = location.pathname.startsWith("/BD");
      const basePath = isBd ? "/BD" : "/admin";
      const servicesLandingPath = isBd ? "AddService" : "ServicesLanding";
      const fallbackUrl =
        docTypeFromURL === "proforma"
          ? `${basePath}/${servicesLandingPath}/${effectiveClientId}/${effectiveProposalId}?doc=proforma`
          : `${basePath}/${servicesLandingPath}/${effectiveClientId}/${effectiveProposalId}`;
      navigate(fallbackUrl);
    }
  };

  return (
    <div className="space-y-6 text-white">
      <div className="flex items-center justify-between pb-4 border-b border-gray-700/50">
        <div className="flex items-center gap-3">
          {!onServiceAdded && (
            <button
              onClick={handleBack}
              className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
            🎁 Complimentary Services
          </h2>
        </div>
      </div>

      {/* Select Service & Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Select Service
          </label>
          <select
            value={selectedService}
            onChange={handleServiceChange}
            className="w-full bg-gray-900/60 border border-gray-700 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
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
            className="w-full bg-gray-900/60 border border-gray-700 rounded-xl p-3 text-white focus:border-amber-500 outline-none disabled:opacity-50"
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
                      ? "bg-amber-500/20 border-amber-500 shadow-md"
                      : "bg-gray-800/60 border-gray-700 hover:border-gray-600"
                  }`}
                >
                  <p className="font-semibold text-sm text-white">{type.editing_type_name}</p>
                  <p className="text-xs text-amber-400 font-bold mt-1">
                    Value: ₹{Number(type.editing_type_amount).toLocaleString()} (Free)
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity & Action */}
      {selectedEditingType && (
        <div className="p-4 bg-gray-800/40 rounded-xl border border-gray-700/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-300">Quantity:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center font-bold"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 text-center bg-gray-900 border border-gray-700 rounded-lg py-1 text-white"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center font-bold"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-gray-400">Complimentary Value</p>
              <p className="text-lg font-bold text-amber-400">
                ₹{calculateItemTotal().toLocaleString()} (₹0 Charged)
              </p>
            </div>
            <button
              onClick={handleSaveService}
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl transition shadow-lg"
            >
              Add Complimentary
            </button>
          </div>
        </div>
      )}

      {/* Saved Complimentary Services */}
      {getData.length > 0 && !onServiceAdded && (
        <div className="space-y-3 pt-6 border-t border-gray-700/50">
          <h3 className="font-bold text-lg text-white">Added Complimentary Services</h3>
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
                    Qty: {item.quantity} • Value: ₹{Number(item.total_amount || item.total_price).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteTransaction(item.id)}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                  title="Delete"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplimentaryCalculator;
