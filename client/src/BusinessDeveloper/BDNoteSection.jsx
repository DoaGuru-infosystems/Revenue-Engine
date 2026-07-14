import React, { useEffect, useState } from "react";
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
  List,
  ListCheckIcon,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../redux/user/userSlice";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/apiBaseUrl";

const BDNoteSection = () => {
   const baseURL = API_BASE_URL;
const dispatch = useDispatch();
  const { currentUser, token } = useSelector((state) => state.user);
  const userName = currentUser?.name;
  const { id, proposalId } = useParams();
  const [data, setData] = useState([]);
  const [selectedService, setSelectedService] = useState("");
  const [selectedNote, setSelectedNote] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedEditingType, setSelectedEditingType] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [getData, setGetData] = useState([]);
  const [optionalServices, setOptionalServices] = useState([]);

  const [addons, setAddons] = useState({});

  const [optionalAmounts, setOptionalAmounts] = useState([]);
  const [loading, setLoading] = useState(false);

  // console.log(data);


  const [total, setTotal] = useState(0);
  const navigate = useNavigate();
  console.log(id, proposalId);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    axios
      .get(`${baseURL}/auth/api/re_calculator/services/category/editing`)
      .then((res) => {
        setData(res.data.data);
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
          setOptionalAmounts(services); // already done in your code
        }
      })
      .catch((err) => console.error(err));
  }, []);

  // useEffect(() => {
  //   if (data.length && optionalServices.length) {
  //     const filtered = filterOptionalServices(data);
  //     setData(filtered);
  //   }
  // }, [data, optionalServices]);

  const getOptionalAddonAmount = (serviceName, editingTypeName) => {
    const match = optionalAmounts.find(
      (item) =>
        item.service_name === serviceName &&
        item.editing_type_name === editingTypeName
    );
    return match ? parseFloat(match.amount) : 0;
  };

  const handleEdit = (entry) => {
    setEditId(entry.id);
    setSelectedNote(entry.note_text);
  };

  const filterOptionalServices = (services) => {
    return services
      .map((service) => {
        const filteredCategories = service.categories
          .map((category) => {
            const filteredEditing = category.editing_types.filter((editing) => {
              // Check if this editing type is an optional service
              const isOptional = optionalServices.some(
                (opt) =>
                  opt.service_name === service.service_name &&
                  opt.category_name === category.category_name &&
                  opt.editing_type_name === editing.editing_type_name
              );
              return !isOptional; // Only keep non-optional services
            });

            return { ...category, editing_types: filteredEditing };
          })
          .filter((cat) => cat.editing_types.length > 0);

        return { ...service, categories: filteredCategories };
      })
      .filter((service) => service.categories.length > 0);
  };

  const getSelectedService = data.find(
    (s) => s.service_name === selectedService
  );
  const getSelectedCategory = getSelectedService?.categories.find(
    (c) => c.category_name === selectedCategory
  );

  const handleSave = () => {
    setLoading(true);
    console.log(selectedNote);

    if (!selectedNote) {
      Swal.fire({
        icon: "warning", // use "warning" instead of "alert"
        title: "Note Text required",
        text: "Please enter a Note Text",
        showConfirmButton: false,
        timer: 1000,
        // timerProgressBar: true,
      });
      setLoading(false); // stop loader
      return; // prevent saving
    }

    const payload = {
      note_text: selectedNote,
    };

    const request = editId
      ? axios.put(
          `${baseURL}/auth/api/re_calculator/updateNoteDataById/${editId}`,
          payload
        )
      : axios.post(`${baseURL}/auth/api/re_calculator/saveNotesData`, payload);

    request
      .then((res) => {
        resetForm();
        if (res.data.status === "Success") {
          Swal.fire({
            icon: "success",
            title: editId ? "Updated!" : "Saved!",
            text: editId ? "Entry updated successfully" : "Saved successfully",
            showConfirmButton: false,
            timer: 1000,
            // timerProgressBar: true,
          });
          setEditId("");
          fetchData();
          setLoading(false);
          setSelectedNote("");
        }
      })
      .catch((err) => {
        setLoading(false);
        console.error("Save error:", err);
      });
  };

  const resetForm = () => {
    setSelectedNote("");
  };

  const fetchData = async () => {
    try {
      const { data } = await axios.get(
        `${baseURL}/auth/api/re_calculator/getNoteData`,
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

  useEffect(() => {
    fetchData();
  }, []);

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
        `${baseURL}/auth/api/re_calculator/deleteNoteById/${entryId}`
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
  const grandTotal = getData.reduce(
    (acc, order) => acc + parseFloat(order.total_amount || 0),
    0
  );

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white p-6">
        <div className="w-full max-w-2xl bg-white/10 backdrop-blur rounded-xl px-10 py-8 space-y-6 shadow-2xl">
          <h2 className="text-3xl font-bold text-white text-center mb-6">
            🧮 Note Section
          </h2>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition"
          >
            ← Go Back
          </button>
          <div>
            <label className="block font-semibold mb-1">Note Name</label>
            <input
              className="w-full p-2 border rounded bg-white text-black"
              value={selectedNote}
              onChange={(e) => {
                setSelectedNote(e.target.value);
              }}
              placeholder="Enter the Note Text"
            />
          </div>

          <button
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold p-3 rounded mt-4"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Save..." : editId ? "Update Note" : "Create Note"}
          </button>
          <button
            className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold p-3 rounded mt-2"
            onClick={resetForm}
          >
            Reset Form
          </button>

          {/* Client Orders */}

          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Note Added
          </h3>
          <div className="space-y-4">
            {getData.map((order) => (
              <div
                key={order.id}
                className="p-4 bg-white/10 rounded-xl border border-white/10 hover:bg-white/20 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-white">
                  {/* Left Section: Info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-semibold text-lg">
                      <span>→ {order.note_text}</span>
                    </div>
                  </div>

                  {/* Right Section: Amount + Delete */}
                  <div className="flex items-center gap-2 sm:gap-4">
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
        </div>
      </div>
    </>
  );
};

export default BDNoteSection;
