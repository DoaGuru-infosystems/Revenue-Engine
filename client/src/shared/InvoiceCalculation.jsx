import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useLocation, useParams } from "react-router-dom";
import {
  Megaphone,
  Package,
  StickyNote,
  Notebook,
  ChevronUp,
  ChevronDown,
  X,
  BadgePercent,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../redux/user/userSlice";
import { useNavigate } from "react-router-dom";
import InoviceComplmentary from "./InoviceComplmentary";
import API_BASE_URL from "../config/apiBaseUrl";
import DiscountCard from "./invoice-calculator/DiscountCard";
import DiscountModal from "./invoice-calculator/DiscountModal";
import CalculationSummary from "./invoice-calculator/CalculationSummary";
import OrderItemCard from "./invoice-calculator/OrderItemCard";

// ─── Main Component ───────────────────────────────────────────────────────────
const InvoiceCalculation = () => {
  const location = useLocation();
  const [serviceType, setServiceType] = useState("paid");
  const baseURL = API_BASE_URL;
  const dispatch = useDispatch();
  const { currentUser, token } = useSelector((state) => state.user);
  const userName = currentUser?.name;
  const { id, proposalId } = useParams();
  const [data, setData] = useState([]);
  const [selectedService, setSelectedService] = useState("");
  const [selecteddiscount, setSelecteddiscount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedEditingType, setSelectedEditingType] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [getData, setGetData] = useState([]);
  const [optionalServices, setOptionalServices] = useState([]);
  const [addons, setAddons] = useState({});
  const [optionalAmounts, setOptionalAmounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();
  const [editId, setEditId] = useState(null);
  const [allClientNote, setAllClientNote] = useState([]);
  const [discountData, setDiscountData] = useState("");
  const [formData, setFormData] = useState({ note_name: "", plan: "Customise" });
  const [formDataDis, setFormDataDis] = useState({
    discount_type: "percent",
    discount_per: "",
    discount_amt: "",
    client_id: id,
    txn_id: proposalId,
  });
  const [discountDataSet, setDiscountDataSet] = useState("");
  const [selectedNotesId, setSelectedNotesId] = useState(null);
  const [selectedDiscountId, setSelectedDiscountId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showModalDis, setShowModalDis] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingDis, setIsEditingDis] = useState(false);
  const [predefinedNotes, setPredefinedNotes] = useState([]);
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [manualNote, setManualNote] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (location.state?.servicetype) setServiceType(location.state.servicetype);
  }, [location.state]);

  useEffect(() => {
    axios
      .get(`${baseURL}/auth/api/re_calculator/services/category/editing`)
      .then((res) => {
        const filteredServices = res.data.data.filter(
          (s) => s.service_name.toLowerCase() !== "complimentary"
        );
        setData(filteredServices);
      })
      .catch(console.error);
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
            const key = item.editing_type_name.toLowerCase().replace(/\s+/g, "_");
            initialAddons[key] = false;
          });
          setAddons(initialAddons);
          setOptionalAmounts(services);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedService === "Video Services") {
      setAddons({ thumbnail_creation: true, content_posting: true });
    } else if (selectedService === "Graphics Design") {
      setAddons({ content_posting: true, thumbnail_creation: false });
    } else {
      setAddons({});
    }
  }, [selectedService]);

  const fetchPredefinedNotes = async () => {
    try {
      const { data } = await axios.get(
        `${baseURL}/auth/api/re_calculator/getInvoiceNoteData`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPredefinedNotes(data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchDiscount = async () => {
    try {
      const { data } = await axios.get(
        `${baseURL}/auth/api/re_calculator/getByIDDiscountData/${id}/${proposalId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDiscountData(data.data[0]);
      setSelecteddiscount(data.data[0].discount_per);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchDiscountSetting = async () => {
    try {
      const { data } = await axios.get(
        `${baseURL}/auth/api/re_calculator/getDiscountSetting`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDiscountDataSet(data.data[0]);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPredefinedNotes();
    fetchDiscount();
    fetchDiscountSetting();
  }, []);

  const getSelectedService = data.find((s) => s.service_name === selectedService);
  const getSelectedCategory = getSelectedService?.categories.find(
    (c) => c.category_name === selectedCategory
  );

  const handleEdit = (entry) => {
    setEditId(entry.id);
    setSelectedService(entry.service_name);
    setSelectedCategory(entry.category_name);
    setSelectedEditingType({
      editing_type_id: entry.editing_type_id,
      editing_type_name: entry.editing_type_name,
      amount: parseFloat(entry.editing_type_amount),
    });
    setQuantity(parseInt(entry.quantity));
    const updatedAddons = {};
    optionalServices.forEach((opt) => {
      const key = opt.editing_type_name.toLowerCase().replace(/\s+/g, "_");
      updatedAddons[key] = parseFloat(entry[`include_${key}`]) > 0;
    });
    setAddons(updatedAddons);
    setTotal(parseFloat(entry.total_amount));
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

    try {
      const res = await axios.delete(
        `${baseURL}/auth/api/re_calculator/deleteGraphicEntryById/${entryId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.status === "Success") {
        setGetData((prev) => prev.filter((item) => String(item.id) !== String(entryId)));
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Entry has been deleted.",
          showConfirmButton: false,
          timer: 1000,
        });
      }
    } catch (err) {
      console.error("Delete error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Could not delete entry.",
        showConfirmButton: false,
        timer: 1000,
      });
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
    if (!selectedEditingType || !selectedEditingType.editing_type_id) {
      Swal.fire({ icon: "warning", title: "Editing Type Required", text: "Please select an editing type." });
      return;
    }
    if (!quantity || quantity <= 0) {
      Swal.fire({ icon: "warning", title: "Validation", text: "Please enter a valid quantity of at least 1." });
      return;
    }
    setLoading(true);
    let baseAmount = selectedEditingType.amount * quantity;
    let optionalTotal = 0;
    let include_content_posting = 0;
    let include_thumbnail_creation = 0;

    optionalServices.forEach((opt) => {
      const key = opt.editing_type_name.toLowerCase().replace(/\s+/g, "_");
      if (addons[key]) {
        const amount = parseFloat(opt.amount);
        optionalTotal += amount * quantity;
        if (key === "content_posting") include_content_posting = amount;
        else if (key === "thumbnail_creation") include_thumbnail_creation = amount;
      }
    });

    const finalAmount = baseAmount + optionalTotal;
    setTotal(finalAmount);

    const payload = {
      txn_id: proposalId,
      client_id: id,
      service_name: selectedService,
      category_name: selectedCategory,
      editing_type_id: selectedEditingType.editing_type_id,
      editing_type_name: selectedEditingType.editing_type_name,
      editing_type_amount: selectedEditingType.amount,
      quantity,
      include_content_posting,
      include_thumbnail_creation,
      total_amount: finalAmount,
      employee: userName,
    };

    const quotationRequest = editId
      ? axios.put(`${baseURL}/auth/api/re_calculator/updateGraphicEntryById/${editId}`, payload)
      : axios.post(`${baseURL}/auth/api/re_calculator/saveCalculatorData`, payload);

    quotationRequest
      .then((res) => {
        if (res.data.status === "Success") {
          Swal.fire({ icon: "success", title: editId ? "Updated!" : "Saved!", showConfirmButton: false, timer: 1000 });
          resetForm();
          fetchData();
        } else if (res.data.status === "Alert") {
          Swal.fire({ icon: "warning", title: "Already Exists", text: res.data.message, showConfirmButton: false, timer: 1000 });
          resetForm();
          fetchData();
        }
      })
      .catch(() => Swal.fire("Error!", "Something went wrong while saving.", "error"))
      .finally(() => setLoading(false));
  };

  const resetForm = () => {
    setEditId(null);
    setSelectedService("");
    setSelectedCategory("");
    setSelectedEditingType(null);
    setQuantity(1);
    const initialAddons = {};
    optionalServices.forEach((item) => {
      const key = item.editing_type_name.toLowerCase().replace(/\s+/g, "_");
      initialAddons[key] = false;
    });
    setAddons(initialAddons);
    setTotal(0);
  };

  const handleClose = () => {
    setShowModal(false);
    setFormData({ note_name: "", plan: "" });
  };

  const handleCloseDis = () => {
    setShowModalDis(false);
    setFormDataDis({ discount_type: "percent", discount_per: "", discount_amt: "", client_id: id, txn_id: proposalId });
  };

  const handleShowDiscount = () => {
    setFormDataDis({ discount_type: "percent", discount_per: "", discount_amt: "", client_id: id, txn_id: proposalId });
    setIsEditingDis(false);
    setShowModalDis(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangeDis = (e) => {
    const { name, value } = e.target;
    setFormDataDis((prev) => {
      if (name === "discount_type") {
        return { ...prev, discount_type: value, discount_per: "", discount_amt: "" };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleSubmitDis = async (e) => {
    e.preventDefault();
    const discountVal = formDataDis.discount_type === "amount"
      ? Number(formDataDis.discount_amt)
      : Number(formDataDis.discount_per);
    if (!discountVal || discountVal <= 0) {
      Swal.fire({ icon: "warning", title: "Invalid Value", text: "Discount value must be greater than 0.", showConfirmButton: false, timer: 1500 });
      return;
    }
    setLoading(true);
    try {
      let response;
      if (isEditingDis && selectedDiscountId) {
        response = await axios.put(
          `${baseURL}/auth/api/re_calculator/updateDiscountDataById/${selectedDiscountId.id}`,
          formDataDis,
          { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
        );
      } else {
        response = await axios.post(
          `${baseURL}/auth/api/re_calculator/saveDiscountData`,
          formDataDis,
          { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
        );
      }
      if (response.data.status === "Success") {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: isEditingDis ? "Discount updated!" : "Discount applied!",
          showConfirmButton: false,
          timer: 1000,
        }).then(() => {
          setShowModalDis(false);
          fetchDiscount();
        });
      } else {
        Swal.fire({ icon: "error", title: "Error", text: response.data.message || "Failed to save Discount.", showConfirmButton: false, timer: 1000 });
      }
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: "Failed to save Discount. Please try again.", showConfirmButton: false, timer: 1000 });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let response;
      if (isEditing && selectedNotesId) {
        response = await axios.put(
          `${baseURL}/auth/api/re_calculator/updateInvoiceClientNoteDataById/${selectedNotesId.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
        );
      } else {
        response = await axios.post(
          `${baseURL}/auth/api/re_calculator/addNotebyplan`,
          formData,
          { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
        );
      }
      if (response.data.status === "Success") {
        Swal.fire({ icon: "success", title: "Success", text: isEditing ? "Note updated!" : "Note added!", showConfirmButton: false, timer: 1000 })
          .then(() => { setShowModal(false); getAllPlanNotes(); });
      } else {
        Swal.fire({ icon: "error", title: "Error", text: response.data.message || "Failed to save Note.", showConfirmButton: false, timer: 1000 });
      }
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "Failed to save note.", showConfirmButton: false, timer: 1000 });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPredefinedNote = (note) => {
    if (!selectedNotes.find((n) => n.id === note.id)) {
      setSelectedNotes([...selectedNotes, { id: note.id, note_name: note.note_text, type: "predefined" }]);
    }
  };
  const handleAddManualNote = () => {
    if (manualNote.trim() !== "") {
      setSelectedNotes([...selectedNotes, { id: Date.now(), note_name: manualNote, type: "manual" }]);
      setManualNote("");
    }
  };
  const handleRemoveNote = (id) => setSelectedNotes(selectedNotes.filter((n) => n.id !== id));

  const handleSaveNotes = async () => {
    if (selectedNotes.length === 0) {
      Swal.fire({ icon: "warning", title: "No Notes", text: "Please add at least one note.", showConfirmButton: false, timer: 1000 });
      return;
    }
    try {
      const payload = { txn_id: proposalId, client_id: id, planNotes: selectedNotes.map((i) => ({ note_name: i.note_name })) };
      const response = await axios.post(`${baseURL}/auth/api/re_calculator/saveInvoiceClientIdwiseNotes`, payload, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.status === "Alert") {
        Swal.fire({ icon: "warning", title: "Duplicate Note", text: response.data.message, showConfirmButton: false, timer: 1000 });
      } else {
        Swal.fire({ icon: "success", title: "Notes Created", text: "Notes saved successfully!", showConfirmButton: false, timer: 1000 });
      }
      getAllPlanNotes();
      setManualNote("");
      setSelectedNotes([]);
      fetchPredefinedNotes();
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "Something went wrong.", showConfirmButton: false, timer: 1000 });
    }
  };

  const handleDeleteClientNote = async (noteId) => {
    const confirm = await Swal.fire({ title: "Delete Note?", icon: "warning", showCancelButton: true, confirmButtonColor: "#e11d48", cancelButtonColor: "#6b7280", confirmButtonText: "Yes, delete!" });
    if (!confirm.isConfirmed) return;
    try {
      const res = await axios.delete(`${baseURL}/auth/api/re_calculator/deleteInvoiceClientNotes/${noteId}`);
      if (res.data.status === "Success") {
        setAllClientNote((prev) => prev.filter((i) => i.id !== noteId));
        Swal.fire({ icon: "success", title: "Deleted!", timer: 1000, showConfirmButton: false });
        getAllPlanNotes();
      }
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "Could not delete note.", showConfirmButton: false, timer: 1000 });
    }
  };

  const handleDeleteDiscount = async (disId) => {
    const confirm = await Swal.fire({ title: "Delete Discount?", text: "This will remove the discount from this invoice.", icon: "warning", showCancelButton: true, confirmButtonColor: "#e11d48", cancelButtonColor: "#6b7280", confirmButtonText: "Yes, delete!" });
    if (!confirm.isConfirmed) return;
    try {
      const res = await axios.delete(`${baseURL}/auth/api/re_calculator/deleteDiscountById/${disId}`);
      if (res.data.status === "Success") {
        Swal.fire({ icon: "success", title: "Deleted!", text: "Discount removed.", timer: 1000, showConfirmButton: false });
        fetchDiscount();
        setSelecteddiscount("");
        setDiscountData("");
      }
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "Could not delete discount.", showConfirmButton: false, timer: 1000 });
    }
  };

  const fetchData = async () => {
    if (!id || !proposalId) return;
    try {
      const { data } = await axios.get(
        `${baseURL}/auth/api/re_calculator/getInvoiceGraphic/${proposalId}/${id}`,
        { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
      );
      setGetData(data.data);
    } catch (error) {
      if (error.response?.status === 401) {
        Swal.fire({ title: "Session Expired", text: "Please login again.", icon: "warning", showConfirmButton: false, timer: 1000 })
          .then(() => { dispatch(clearUser()); localStorage.removeItem("token"); navigate("/"); });
      }
    }
  };

  const getAllPlanNotes = async () => {
    try {
      const response = await axios.get(
        `${baseURL}/auth/api/re_calculator/getInvoiceClientNotesbyId/${id}/${proposalId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAllClientNote(response.data.data);
    } catch (error) {
      if (error.response?.status === 401) {
        Swal.fire({ title: "Session Expired", text: "Please login again.", icon: "warning", showConfirmButton: false, timer: 1000 })
          .then(() => { dispatch(clearUser()); localStorage.removeItem("token"); navigate("/"); });
      }
    }
  };

  useEffect(() => {
    fetchData();
    getAllPlanNotes();
  }, [id, proposalId]);

  const grandTotal = getData.reduce((acc, o) => acc + parseFloat(o.total_amount || 0), 0);

  const discountedTotal = () => {
    if (!discountData) return grandTotal;
    if (discountData.discount_type === "percent")
      return grandTotal - (grandTotal * parseFloat(discountData.discount_per)) / 100;
    if (discountData.discount_type === "amount")
      return grandTotal - parseFloat(discountData.discount_amt);
    return grandTotal;
  };

  const handleSelect = (note) => {
    handleAddPredefinedNote(note);
    setSelectedNote(null);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const uniquePredefinedNotes = predefinedNotes.filter(
    (p) => !allClientNote.some((c) => c.note_name === p.note_text) && !selectedNotes.some((s) => s.note_name === p.note_text)
  );

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white p-6">
        <div className="w-full max-w-2xl bg-white/10 backdrop-blur rounded-xl px-10 py-8 space-y-6 shadow-2xl">
          <div>
            <h2 className="text-3xl font-bold text-white text-center mb-6">
              🧮 Service Calculator
            </h2>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition"
            >
              ← Go Back
            </button>

            <label className="block font-semibold mb-1 mt-4">
              Select Service Type:
            </label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full p-2 border rounded bg-white text-black"
            >
              <option value="">-- Choose Service --</option>
              <option value="paid">Paid Service</option>
              <option value="complimentary">Complimentary Service</option>
            </select>
          </div>

          {serviceType === "paid" ? (
            <div className="w-full max-w-2xl backdrop-blur rounded-xl space-y-6">
              {/* Service Selectors */}
              <div>
                <label className="block font-semibold mb-1">Select Service</label>
                <select
                  className="w-full p-2 border rounded bg-white text-black"
                  value={selectedService}
                  onChange={(e) => { setSelectedService(e.target.value); setSelectedCategory(""); setSelectedEditingType(null); }}
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

              {getSelectedService && (
                <div>
                  <label className="block font-semibold mb-1">Select Category</label>
                  <select
                    className="w-full p-2 border rounded bg-white text-black"
                    value={selectedCategory}
                    onChange={(e) => { setSelectedCategory(e.target.value); setSelectedEditingType(null); }}
                    disabled={!!editId}
                  >
                    <option value="">-- Choose Category --</option>
                    {getSelectedService.categories.map((category) => (
                      <option key={category.category_id} value={category.category_name}>
                        {category.category_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {getSelectedCategory && (
                <div>
                  <label className="block font-semibold mb-1">
                    Select Editing Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full p-2 border rounded bg-white text-black"
                    value={selectedEditingType?.editing_type_id || ""}
                    onChange={(e) => {
                      const edit = getSelectedCategory.editing_types.find(
                        (et) => et.editing_type_id === parseInt(e.target.value)
                      );
                      setSelectedEditingType(edit || null);
                    }}
                    disabled={!!editId}
                  >
                    <option value="">-- Choose Editing Type (Required) --</option>
                    {getSelectedCategory.editing_types.map((edit) => (
                      <option key={edit.editing_type_id} value={edit.editing_type_id}>
                        {edit.editing_type_name} - ₹{edit.amount}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1">Quantity</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded bg-white text-black"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                />
              </div>

              {/* Optional Services */}
              {(selectedService === "Video Services" || selectedService === "Graphics Design") &&
                optionalServices?.length > 0 && (
                  <div className="space-y-4">
                    {optionalServices.map((opt) => {
                      const key = opt.editing_type_name.toLowerCase().replace(/\s+/g, "_");
                      return (
                        <div key={key}>
                          <label className="block font-semibold">{opt.editing_type_name}?</label>
                          <div className="flex gap-4 mt-2">
                            <button
                              type="button"
                              disabled={!!editId}
                              className={`px-4 py-2 rounded ${addons[key] ? "bg-green-600 text-white" : "bg-gray-300 text-black"} ${editId ? "opacity-50 cursor-not-allowed" : ""}`}
                              onClick={() => !editId && setAddons((prev) => ({ ...prev, [key]: true }))}
                            >YES</button>
                            <button
                              type="button"
                              disabled={!!editId}
                              className={`px-4 py-2 rounded ${!addons[key] ? "bg-red-600 text-white" : "bg-gray-300 text-black"} ${editId ? "opacity-50 cursor-not-allowed" : ""}`}
                              onClick={() => !editId && setAddons((prev) => ({ ...prev, [key]: false }))}
                            >NO</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              {/* Action Buttons */}
              <button
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold p-3 rounded mt-4"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? "Saving..." : "Calculate & Save"}
              </button>

              <div className="flex flex-wrap gap-2">
                {!discountData && (
                  <button
                    onClick={handleShowDiscount}
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition flex items-center gap-2"
                  >
                    <BadgePercent className="w-4 h-4" />
                    Apply Discount
                  </button>
                )}
                <button
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition"
                  onClick={resetForm}
                >
                  Reset Form
                </button>
              </div>

              {/* ─── Unified Total Summary ─── */}
              <CalculationSummary
                grandTotal={grandTotal}
                discountData={discountData}
                discountedTotal={discountedTotal}
                onEditDiscount={() => {
                  setSelectedDiscountId(discountData);
                  setFormDataDis({
                    discount_type: discountData.discount_type,
                    discount_per: discountData.discount_per,
                    discount_amt: discountData.discount_amt,
                    client_id: id,
                    txn_id: proposalId,
                  });
                  setIsEditingDis(true);
                  setShowModalDis(true);
                }}
                onDeleteDiscount={handleDeleteDiscount}
              />

              {/* ─── Orders ─── */}
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5" />
                Recent Client Orders
              </h3>
              <div className="space-y-4">
                {getData.map((order) => (
                  <OrderItemCard
                    key={order.id}
                    order={order}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>

              {/* ─── Notes Section ─── */}
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <StickyNote className="w-5 h-5" />
                Notes Section
              </h3>
              <div className="space-y-4">
                <div className="relative w-full" ref={dropdownRef}>
                  <div
                    className="flex items-center justify-between w-full p-2 bg-white rounded-lg border border-gray-300 text-black cursor-pointer"
                    onClick={() => setIsOpen(!isOpen)}
                  >
                    <span className="truncate">
                      {selectedNote ? selectedNote.note_text : "-- Select Predefined Note --"}
                    </span>
                    {isOpen ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                  </div>
                  {isOpen && (
                    <div className="absolute z-10 bg-white w-full mt-1 max-h-60 overflow-auto border rounded-lg text-black">
                      {uniquePredefinedNotes.map((note) => (
                        <div key={note.id} onClick={() => handleSelect(note)} className="p-2 m-1 border rounded-lg bg-gray-100 hover:bg-orange-100 cursor-pointer break-words">
                          {note.note_text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <textarea
                    value={manualNote}
                    rows={1}
                    onChange={(e) => setManualNote(e.target.value)}
                    placeholder="Enter custom note"
                    className="flex-1 p-2 rounded-lg border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button onClick={handleAddManualNote} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition">
                    + Add
                  </button>
                </div>

                <div className="space-y-2">
                  {selectedNotes.map((note) => (
                    <div key={note.id} className="p-3 bg-gray-100 rounded-lg flex justify-between items-center border border-gray-300">
                      <span className="text-gray-800 font-medium">{note.note_name}</span>
                      <button onClick={() => handleRemoveNote(note.id)} className="bg-red-500 mx-2 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold transition" title="Remove">×</button>
                    </div>
                  ))}
                </div>

                <button onClick={handleSaveNotes} className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition">
                  💾 Save Notes
                </button>
              </div>

              <div className="space-y-4">
                {allClientNote.map((notes) => (
                  <div key={notes.id} className="p-4 bg-white/10 rounded-xl border border-white/10 hover:bg-white/20 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-white">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 font-semibold text-lg">
                          <span>→ {notes.note_name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNotesId(notes);
                            setFormData({ note_name: notes.note_name, plan: notes.plan });
                            setIsEditing(true);
                            setShowModal(true);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold"
                          title="Edit"
                        >✎</button>
                        <button onClick={() => handleDeleteClientNote(notes.id)} className="bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold" title="Delete">×</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Note Edit Modal */}
              {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={handleClose} />
                  <div className="relative bg-white w-full max-w-md rounded-xl shadow-2xl">
                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <StickyNote className="w-5 h-5 text-red-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          {isEditing ? "Edit Note" : "Add New Note"}
                        </h2>
                      </div>
                      <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Notebook className="w-4 h-4 inline mr-2" />
                          Note
                        </label>
                        <textarea
                          name="note_name"
                          value={formData.note_name}
                          onChange={handleChange}
                          className="w-full text-black px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                          placeholder="Enter note details"
                          rows={4}
                          required
                        />
                      </div>
                      <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={handleClose} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">Cancel</button>
                        <button type="submit" disabled={loading} className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm">
                          {loading ? (isEditing ? "Updating..." : "Saving...") : isEditing ? "Update Note" : "Save Note"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          ) : serviceType === "complimentary" ? (
            <InoviceComplmentary />
          ) : null}
        </div>
      </div>

      {/* ─── Discount Modal (Admin Invoice Style) ─── */}
      <DiscountModal
        show={showModalDis}
        onClose={handleCloseDis}
        onSubmit={handleSubmitDis}
        formDataDis={formDataDis}
        handleChangeDis={handleChangeDis}
        isEditingDis={isEditingDis}
        loading={loading}
        grandTotal={grandTotal}
        discountDataSet={discountDataSet}
      />
    </>
  );
};

export default InvoiceCalculation;
