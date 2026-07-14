import React, { useEffect, useRef, useState } from "react";
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
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../redux/user/userSlice";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/apiBaseUrl";

const AdminComplimentaryData = () => {
   const baseURL = API_BASE_URL;
const dispatch = useDispatch();
  const { currentUser, token } = useSelector((state) => state.user);
  const userName = currentUser?.name;
  const { id, clientId, proposalId } = useParams();
  const effectiveClientId = id || clientId;
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

  // console.log(data);


  const [total, setTotal] = useState(0);
  const navigate = useNavigate();
  console.log(id, proposalId);
  const [editId, setEditId] = useState(null);
  const [allPlanNote, setAllPlanNote] = useState([]);
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
        // Keep only "Complimentary" service
        const complimentaryService = res.data.data.filter(
          (service) => service.service_name.toLowerCase() === "complimentary"
        );
        setData(complimentaryService);
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
      setPredefinedNotes(data.data || []);
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    fetchPredefinedNotes();
  }, []);

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

    // Dynamically map optional services from entry
    const updatedAddons = {};
    optionalServices.forEach((opt) => {
      const key = opt.editing_type_name.toLowerCase().replace(/\s+/g, "_");
      const entryKey = `include_${key}`;
      updatedAddons[key] = parseFloat(entry[entryKey]) > 0;
    });

    setAddons(updatedAddons);
    setTotal(parseFloat(entry.total_amount));
  };

  const getSelectedService = data.find(
    (s) => s.service_name === selectedService
  );
  const getSelectedCategory = getSelectedService?.categories.find(
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

  const handleSave = () => {
    if (!selectedEditingType) return;
    setLoading(true);

    // Base amount
    let baseAmount = selectedEditingType.amount * quantity;

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
            include_content_posting = amount; // send unit amount
          } else if (key === "thumbnail_creation") {
            include_thumbnail_creation = amount;
          }
        }
      });
    }

    const finalAmount = baseAmount + optionalTotal;
    setTotal(finalAmount);

    const payload = {
      txn_id: proposalId,
      client_id: effectiveClientId,
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

    // ✅ Only Quotation API (no invoice)
    const quotationRequest = editId
      ? axios.put(
          `${baseURL}/auth/api/re_calculator/updateComplimenatryDataById/${editId}`,
          payload
        )
      : axios.post(
          `${baseURL}/auth/api/re_calculator/saveComplimentaryData`,
          payload
        );

    quotationRequest
      .then((res) => {
        if (res.data.status === "Success") {
          Swal.fire({
            icon: "success",
            title: editId ? "Updated!" : "Saved!",
            text: editId
              ? "Complimentary updated successfully"
              : "Complimentary saved successfully",
            showConfirmButton: false,
            timer: 1000,
            // timerProgressBar: true,
          });
          resetForm();
          fetchData();
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
    const initialAddons = {};
    optionalServices.forEach((item) => {
      const key = item.editing_type_name.toLowerCase().replace(/\s+/g, "_");
      initialAddons[key] = false;
    });
    setAddons(initialAddons);

    setTotal(0);
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
        // timerProgressBar: true,
      });
      return;
    }

    try {
      const planNotes = selectedNotes.map((item) => ({
        note_name: item.note_name,
      }));

      const payload = {
        txn_id: proposalId,
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

      if (res.data.status === "Success") {
        Swal.fire({
          icon: "success",
          title: "Notes Created",
          text: res.data.message,
          showConfirmButton: false,
          timer: 1000,
          // timerProgressBar: true,
        });

        getAllPlanNotes();
        setManualNote("");
        setPredefinedNotes([]);
        setSelectedNotes([]);
        fetchPredefinedNotes();
      } else if (res.data.status === "Alert") {
        Swal.fire({
          icon: "warning",
          title: "Duplicate Notes",
          text: res.data.message,

          showConfirmButton: false,
          timer: 1000,
          // timerProgressBar: true,
        });
        getAllPlanNotes();
        setManualNote("");
        setPredefinedNotes([]);
        setSelectedNotes([]);
        fetchPredefinedNotes();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            res.data.message || "Something went wrong while saving the notes.",
          showConfirmButton: false,
          timer: 1000,
          // timerProgressBar: true,
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
        // timerProgressBar: true,
      });
    }
  };

  const fetchData = async () => {
    if (!effectiveClientId || !proposalId) return;
    try {
      const { data } = await axios.get(
        `${baseURL}/auth/api/re_calculator/getByIDComplimentaryData/${proposalId}/${effectiveClientId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(data.data);
      setGetData(data.data);
    } catch (error) {
      console.log(error);
      if (error.response && error.response.status === 401) {
        // Token is invalid or expired
        Swal.fire({
          title: "Session Expired",
          text: "Please login again.",
          icon: "warning",
          showConfirmButton: false,
          timer: 1000,
          // timerProgressBar: true,
        }).then(() => {
          dispatch(clearUser());
          localStorage.removeItem("token");
          navigate("/");
        });
      }
    }
  };
  const getAllPlanNotes = async () => {
    try {
      const response = await axios.get(
        `${baseURL}/auth/api/re_calculator/getClientNotesbyId/${effectiveClientId}/${proposalId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const notes = response.data.data;

      setAllClientNote(notes);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        Swal.fire({
          title: "Session Expired",
          text: "Please login again.",
          icon: "warning",
          showConfirmButton: false,
          timer: 1000,
          // timerProgressBar: true,
        }).then(() => {
          dispatch(clearUser());
          localStorage.removeItem("token");
          navigate("/");
        });
      }
    }
  };
  useEffect(() => {
    fetchData();
    getAllPlanNotes();
  }, [effectiveClientId, proposalId]);

  console.log(getData);

  const handleDelete = async (entryId) => {
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
      const res = await axios.delete(
        `${baseURL}/auth/api/re_calculator/deleteComplimenatryById/${entryId}`
      );

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
  const grandTotal = getData.reduce(
    (acc, order) => acc + parseFloat(order.total_amount),
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
  const uniquePredefinedNotes = predefinedNotes.filter(
    (p) => !allClientNote.some((c) => c.note_name === p.note_text)
  );
  return (
    <>
      <div className="w-full max-w-2xl backdrop-blur rounded-xl px-10 py-8 space-y-6 shadow-2xl">
        <div>
          <label className="block font-semibold mb-1">Select Service</label>
          <select
            className="w-full p-2 border rounded bg-white text-black"
            value={selectedService}
            onChange={(e) => {
              setSelectedService(e.target.value);
              setSelectedCategory("");
              setSelectedEditingType(null);
            }}
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
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedEditingType(null);
              }}
              disabled={!!editId}
            >
              <option value="">-- Choose Category --</option>
              {getSelectedService.categories.map((category) => (
                <option
                  key={category.category_id}
                  value={category.category_name}
                >
                  {category.category_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {getSelectedCategory && (
          <div>
            <label className="block font-semibold mb-1">
              Select Editing Type
            </label>
            <select
              className="w-full p-2 border rounded bg-white text-black"
              value={selectedEditingType?.editing_type_id || ""}
              onChange={(e) => {
                const edit = getSelectedCategory.editing_types.find(
                  (et) => et.editing_type_id === parseInt(e.target.value)
                );
                setSelectedEditingType(edit);
              }}
              disabled={!!editId}
            >
              <option value="">-- Choose Editing Type --</option>
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

        {shouldShowOptionalAddons && optionalServices?.length > 0 && (
          <div className="space-y-4">
            {optionalServices.map((opt) => {
              const key = opt.editing_type_name
                .toLowerCase()
                .replace(/\s+/g, "_");

              return (
                <div key={key}>
                  <label className="block font-semibold">
                    {opt.editing_type_name}?
                  </label>
                  <div className="flex gap-4 mt-2">
                  <button
                    type="button"
                    disabled={editId} // ✅ disable when editing
                    className={`px-4 py-2 rounded ${
                      addons[key]
                        ? "bg-green-600 text-white"
                        : "bg-gray-300 text-black"
                    } ${editId ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() =>
                      !editId &&
                      setAddons((prev) => ({
                        ...prev,
                        [key]: true,
                      }))
                    }
                  >
                    YES
                  </button>
                  <button
                    type="button"
                    disabled={editId} // ✅ disable when editing
                    className={`px-4 py-2 rounded ${
                      !addons[key]
                        ? "bg-red-600 text-white"
                        : "bg-gray-300 text-black"
                    } ${editId ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() =>
                      !editId &&
                      setAddons((prev) => ({
                        ...prev,
                        [key]: false,
                      }))
                    }
                  >
                    NO
                  </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold p-3 rounded mt-4"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? "Save..." : "Calculate & Save"}
        </button>
        <button
          className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold p-3 rounded mt-2"
          onClick={resetForm}
        >
          Reset Form
        </button>

        <div className="text-xl font-semibold text-center text-green-300 mt-4">
          Total Amount: ₹{grandTotal.toLocaleString()}
        </div>

        {/* Client Orders */}

        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Recent Client Orders
        </h3>
        <div className="space-y-4">
          {getData.map((order) => (
            <div
              key={order.id}
              className="p-4 bg-white/10 rounded-xl border border-white/10 hover:bg-white/20 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 text-white">
                {/* Left Section: Info */}
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-start gap-2 font-semibold text-lg break-words whitespace-pre-wrap leading-relaxed">
                    <Megaphone className="w-5 h-5 text-yellow-400" />
                    <span>
                      {order.service_name} → {order.category_name}
                    </span>
                  </div>
                  <div className="text-lg text-white/80">
                    🎬 {order.editing_type_name} × {order.quantity}
                  </div>
                  {(Number(order.include_content_posting) > 0 ||
                    Number(order.include_thumbnail_creation) > 0) && (
                    <div className="text-base text-white/60 italic">
                      {Number(order.include_content_posting) > 0 && (
                        <>📢 Meta Growth & Content Management </>                      )}
                      {Number(order.include_thumbnail_creation) > 0 && (
                        <>🖼 Thumbnail Creation </>
                      )}
                    </div>
                  )}

                  {/* <div className="text-xs text-white/50">
                      🕒 {new Date(order.created_at).toLocaleString("en-IN")}
                    </div> */}
                </div>

                {/* Right Section: Amount + Delete */}
                <div className="flex items-start gap-2 sm:gap-4 flex-shrink-0">
                  <div className="text-green-400 font-bold text-xl">
                    ₹{parseFloat(order.total_amount).toLocaleString()}
                  </div>
                  <button
                    onClick={() => handleEdit(order)}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold"
                    title="Edit"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => handleDelete(order.id)}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold"
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Notes Section
        </h3>

        <div className="space-y-4">
          <div className="relative w-full" ref={dropdownRef}>
            {/* Button to open dropdown */}
            <div
              className="flex items-center justify-between w-full p-2 bg-white rounded-lg border border-gray-300 text-black cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500"
              onClick={() => setIsOpen(!isOpen)}
            >
              <span className="truncate">
                {selectedNote
                  ? selectedNote.note_text
                  : "-- Select Predefined Note --"}
              </span>
              {isOpen ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </div>
            {/* Dropdown menu */}
            {isOpen && (
              <div className="absolute z-10 bg-white w-full mt-1 max-h-60 overflow-auto border rounded-lg text-black focus:ring-2 focus:ring-orange-500">
                {uniquePredefinedNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => handleSelect(note)}
                    className="p-2 m-1 border rounded-lg bg-gray-100 hover:bg-orange-100 cursor-pointer break-words"
                  >
                    {note.note_text}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Manual Note Input */}
          <div className="flex flex-wrap gap-2">
            <textarea
              type="text"
              value={manualNote}
              onChange={(e) => setManualNote(e.target.value)}
              placeholder="Enter custom note"
              rows={1}
              className="flex-1 p-2 rounded-lg border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={handleAddManualNote}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
            >
              + Add
            </button>
          </div>

          {/* Selected Notes List */}
          <div className="space-y-2">
            {selectedNotes.map((note) => (
              <div
                key={note.id}
                className="p-3 bg-gray-100 rounded-lg flex justify-between items-start gap-3 border border-gray-300"
              >
                <span className="text-gray-800 font-medium break-words whitespace-pre-wrap leading-relaxed flex-1">
                  {note.note_name}
                </span>
                <div className="flex-shrink-0">
                  <button
                    onClick={() => handleRemoveNote(note.id)}
                    className="bg-red-500 mx-2 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold transition"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveNotes}
            className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition"
          >
            💾 Save Notes
          </button>
        </div>

        <div className="space-y-4">
          {allClientNote.map((notes) => (
            <div
              key={notes.id}
              className="p-4 bg-white/10 rounded-xl border border-white/10 hover:bg-white/20 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 text-white">
                {/* Left Section: Info */}
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-start gap-2 font-semibold text-lg break-words whitespace-pre-wrap leading-relaxed">
                    <span>→ {notes.note_name}</span>
                  </div>
                </div>

                {/* Right Section: Amount + Delete */}
                <div className="flex items-start gap-2 sm:gap-4 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // prevent card onClick
                      setSelectedNotesId(notes);
                      setFormData({
                        note_name: notes.note_name,
                        plan: notes.plan,
                      });
                      setIsEditing(true);
                      setShowModal(true);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold"
                    title="Edit"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => handleDeleteClientNote(notes.id)}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold"
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
              onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-white w-full max-w-md rounded-xl shadow-2xl transform transition-all animate-in fade-in-0 zoom-in-95 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <StickyNote className="w-5 h-5 text-red-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {isEditing ? "Edit Note" : "Add New Note"}
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Note */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Notebook className="w-4 h-4 inline mr-2" />
                    Note
                  </label>
                  <textarea
                    name="note_name"
                    value={formData.note_name}
                    onChange={handleChange}
                    className="w-full text-black px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors resize-none"
                    placeholder="Enter note details"
                    rows={4} // number of visible lines
                    required
                  ></textarea>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm"
                  >
                    {loading
                      ? isEditing
                        ? "Updating..."
                        : "Saving..."
                      : isEditing
                      ? "Update Note"
                      : "Save Note"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* <div className="space-y-3">
            {getData.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 bg-white/10 rounded-xl border border-white/10 hover:bg-white/15 transition-colors"
              >
                <div className="flex flex-wrap gap-6 text-white items-center">
                  <div className="flex items-center gap-1">
                    <Megaphone className="w-4 h-4 text-yellow-400" />
                    <span className="font-medium">
                      {order.service_name} → {order.category_name}
                    </span>
                  </div>
                  <div className="text-sm">
                    🎬 {order.editing_type_name} × {order.quantity}
                  </div>
                  <div className="text-xs italic text-white/70">
                    {order.include_content_posting === "1" &&
                      "📢 Meta Growth & Content Management"}
                    {order.include_thumbnail_creation === "1" &&
                      " 🖼 Thumbnail Creation"}
                  </div>
                  <div className="text-xs text-white/50">
                    🕒 {new Date(order.created_at).toLocaleString("en-IN")}
                  </div>
                  <div className="ml-auto text-green-400 font-bold text-lg">
                    <div className="text-green-400 font-bold text-lg">
                      ₹{parseFloat(order.total_amount).toLocaleString()}
                    </div>
                    <button
                      onClick={() => handleDelete(order.id)}
                      className="bg-red-600 hover:bg-red-700 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold"
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div> */}
      </div>
    </>
  );
};

export default AdminComplimentaryData;
