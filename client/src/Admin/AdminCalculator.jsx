import React, { useEffect, useRef, useState } from "react";
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
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../redux/user/userSlice";
import { useNavigate } from "react-router-dom";
import AdminComplimentaryData from "./AdminComplimentaryData";
import API_BASE_URL from "../config/apiBaseUrl";

// ─── Discount Card ────────────────────────────────────────────────────────────
const DiscountCard = ({ discountData, grandTotal, onEdit, onDelete }) => {
  if (!discountData) return null;

  const isPercent = discountData.discount_type === "percent";
  const discountValue = isPercent
    ? parseFloat(discountData.discount_per)
    : parseFloat(discountData.discount_amt);
  const discountRupee = isPercent
    ? (grandTotal * discountValue) / 100
    : discountValue;
  const finalAmount = grandTotal - discountRupee;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-yellow-400/30 bg-gradient-to-br from-yellow-900/40 via-yellow-900/30 to-amber-900/40 backdrop-blur-sm shadow-xl">
      {/* Decorative top bar */ }
      <div className="h-1 w-full bg-gradient-to-r from-yellow-400 via-yellow-400 to-amber-400" />

      <div className="p-5">
        {/* Header row */ }
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-yellow-400/20 flex items-center justify-center">
              <BadgePercent className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-yellow-300/70 font-medium uppercase tracking-wider">
                Discount Applied
              </p>
              <p className="text-white font-bold text-base leading-tight">
                { isPercent
                  ? `${discountValue}% Off`
                  : `₹${discountValue.toLocaleString()} Off` }
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={ onEdit }
              className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/40 border border-red-400/30 text-red-300 hover:text-red-100 flex items-center justify-center transition-all duration-200"
              title="Edit Discount"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={ onDelete }
              className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/40 border border-red-400/30 text-red-300 hover:text-red-100 flex items-center justify-center transition-all duration-200"
              title="Delete Discount"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Breakdown */ }
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-white/60">
            <span>Original Amount</span>
            <span className="font-medium text-white/80">
              ₹{ grandTotal.toLocaleString() }
            </span>
          </div>
          <div className="flex justify-between text-yellow-300">
            <span className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" />
              Discount{ " " }
              { isPercent
                ? `(${discountValue}%)`
                : `(₹${discountValue.toLocaleString()})` }
            </span>
            <span className="font-semibold">
              − ₹{ discountRupee.toFixed(2) }
            </span>
          </div>
          <div className="h-px bg-white/10 my-1" />
          <div className="flex justify-between text-white font-bold text-base">
            <span>You Pay</span>
            <span className="text-yellow-300">
              ₹{ finalAmount.toFixed(2) }
            </span>
          </div>
        </div>

        {/* Savings badge */ }
        <div className="mt-3 inline-flex items-center gap-1.5 bg-yellow-400/15 border border-yellow-400/25 text-yellow-300 text-xs font-semibold px-3 py-1.5 rounded-full">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Saving ₹{ discountRupee.toFixed(2) } on this invoice
        </div>
      </div>
    </div>
  );
};

// ─── Discount Modal ───────────────────────────────────────────────────────────
const DiscountModal = ({
  show,
  onClose,
  onSubmit,
  formDataDis,
  handleChangeDis,
  isEditingDis,
  loading,
  grandTotal,
  discountDataSet,
}) => {
  if (!show) return null;

  const isAmt = formDataDis.discount_type === "amount";
  const val = isAmt
    ? Number(formDataDis.discount_amt)
    : Number(formDataDis.discount_per);
  const maxAmt = discountDataSet?.discount_amt
    ? Number(discountDataSet.discount_amt)
    : grandTotal;
  const maxPer = discountDataSet?.discount_per
    ? Number(discountDataSet.discount_per)
    : 100;
  const calculatedRupee = isAmt ? val : (grandTotal * val) / 100;
  const isExceeded = isAmt
    ? val > maxAmt
    : val > maxPer || calculatedRupee > maxAmt;
  const hasValue = val > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */ }
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={ onClose }
      />

      {/* Modal */ }
      <div className="relative w-full max-w-sm bg-gradient-to-b from-gray-900 to-gray-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Top accent */ }
        <div className="h-1 w-full bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400" />

        {/* Header */ }
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-yellow-400/15 rounded-xl flex items-center justify-center">
              <BadgePercent className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">
                { isEditingDis ? "Update Discount" : "Apply Discount" }
              </h2>
              <p className="text-white/40 text-xs">
                Total service amount: ₹{ grandTotal.toLocaleString() }
              </p>
            </div>
          </div>
          <button
            onClick={ onClose }
            className="w-8 h-8 rounded-lg hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */ }
        <form onSubmit={ onSubmit } className="p-5 space-y-4">
          {/* Type Toggle */ }
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
              Discount Type
            </label>
            <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
              { [
                { value: "percent", label: "Percentage", icon: Percent },
                { value: "amount", label: "Fixed Amount", icon: IndianRupee },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={ value }
                  type="button"
                  onClick={ () =>
                    handleChangeDis({ target: { name: "discount_type", value } })
                  }
                  className={ `flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${formDataDis.discount_type === value
                    ? "bg-yellow-400 text-gray-900 shadow-lg shadow-yellow-400/20"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                    }` }
                >
                  <Icon className="w-3.5 h-3.5" />
                  { label }
                </button>
              )) }
            </div>
          </div>

          {/* Value Input */ }
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
              { isAmt ? "Discount Amount (₹)" : "Discount Percentage (%)" }
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">
                { isAmt ? (
                  <IndianRupee className="w-4 h-4" />
                ) : (
                  <Percent className="w-4 h-4" />
                ) }
              </div>
              <input
                type="number"
                name={ isAmt ? "discount_amt" : "discount_per" }
                value={ isAmt ? formDataDis.discount_amt : formDataDis.discount_per }
                onChange={ handleChangeDis }
                min="1"
                max={ isAmt ? maxAmt : maxPer }
                placeholder={
                  isAmt
                    ? `Max ₹${maxAmt.toLocaleString()}`
                    : `Max ${maxPer}%`
                }
                className={ `w-full pl-10 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/25 focus:outline-none focus:ring-2 transition-all text-sm ${isExceeded && hasValue
                  ? "border-red-400/50 focus:ring-red-400/30"
                  : "border-white/10 focus:ring-yellow-400/30 focus:border-yellow-400/40"
                  }` }
              />
            </div>

            {/* Limit hint */ }
            <p className="text-xs text-white/30 mt-1.5">
              { isAmt
                ? `Maximum allowed: ₹${maxAmt.toLocaleString()}`
                : `Maximum allowed: ${maxPer}%${discountDataSet?.discount_amt
                  ? ` (or ₹${Number(discountDataSet.discount_amt).toLocaleString()})`
                  : ""
                }` }
            </p>

            {/* Live Preview */ }
            { hasValue && (
              <div
                className={ `mt-3 p-3 rounded-xl border text-xs ${isExceeded
                  ? "bg-red-500/10 border-red-400/30 text-red-300"
                  : "bg-yellow-500/10 border-yellow-400/30 text-yellow-300"
                  }` }
              >
                { isExceeded ? (
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>
                      Exceeds allowed limit!{ " " }
                      { isAmt
                        ? `Max is ₹${maxAmt.toLocaleString()}`
                        : `Max is ${maxPer}%` }
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Discount amount</span>
                      <span className="font-bold">
                        ₹{ calculatedRupee.toFixed(2) }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Final payable</span>
                      <span className="font-bold">
                        ₹{ (grandTotal - calculatedRupee).toFixed(2) }
                      </span>
                    </div>
                  </div>
                ) }
              </div>
            ) }
          </div>


          {/* Actions */ }
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={ onClose }
              className="flex-1 py-2.5 border border-white/10 text-white/60 hover:text-white hover:border-white/20 rounded-xl text-sm font-medium transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={ loading || (hasValue && isExceeded) }
              className="flex-1 py-2.5 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed text-gray-900 rounded-xl text-sm font-bold shadow-lg shadow-yellow-400/20 transition-all duration-200"
            >
              { loading
                ? "Saving..."
                : isEditingDis
                  ? "Update Discount"
                  : "Apply Discount" }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const AdminCalculator = ({ hideNotes, onSaveComplete }) => {
  const location = useLocation();
  const [serviceType, setServiceType] = useState("paid");
  const baseURL = API_BASE_URL;
  const dispatch = useDispatch();
  const { currentUser, token } = useSelector((state) => state.user);
  const userName = currentUser?.name;
  const params = useParams();
  const id = params.id || params.clientId;
  const proposalId = params.proposalId;
  const [data, setData] = useState([]);
  const [selectedService, setSelectedService] = useState("");
  const [selecteddiscount, setSelecteddiscount] = useState(null);
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

  // console.log(data);


  const [total, setTotal] = useState(0);
  const navigate = useNavigate();
  console.log(id, proposalId);
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
  const [predefinedNotes, setPredefinedNotes] = useState([]); // fetched from API
  const [selectedNotes, setSelectedNotes] = useState([]); // selected + manual
  const [manualNote, setManualNote] = useState("");
  const dropdownRef = useRef(null);

  // Default notes that should appear automatically
  const defaultNotes = [
    {
      id: 1,
      note_name:
        "The client pays for the Meta ad budget, and ad service charges will apply only if the client wants to run the ad.",
    },
    {
      id: 2,
      note_name:
        "All amounts need to be paid in advance. Only the ad budget will be paid upon request of the client or immediately after the service is started.",
    },
    {
      id: 3,
      note_name:
        "Please note that service charges are non-refundable but may be adjusted against another service.",
    },
    {
      id: 4,
      note_name:
        "One dedicated SPOC (single point of contact) is required from the client side to approve the posts, contents, videos changes, etc.",
    },
    {
      id: 5,
      note_name:
        "Required details like credentials and other details are needed to share timely.",
    },
  ];

  // Initialize with default notes
  useEffect(() => {
    setSelectedNotes(defaultNotes);
  }, []);

  useEffect(() => {
    if (location.state?.servicetype) {
      setServiceType(location.state.servicetype);
    }
  }, [location.state]);
  useEffect(() => {
    axios
      .get(`${baseURL}/auth/api/calculator/services/category/editing`)
      .then((res) => {
        // Filter out "Complimentary" service
        const filteredServices = res.data.data.filter(
          (service) => service.service_name.toLowerCase() !== "complimentary"
        );
        setData(filteredServices);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    axios
      .get(`${baseURL}/auth/api/calculator/optional-service-amounts`)
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

  const fetchPredefinedNotes = async () => {
    try {
      const { data } = await axios.get(
        `${baseURL}/auth/api/calculator/getNoteData`,
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
  const fetchDiscount = async () => {
    try {
      const { data } = await axios.get(
        `${baseURL}/auth/api/calculator/getByIDDiscountData/${id}/${proposalId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (data.data && data.data.length > 0) {
        setSelecteddiscount(data.data[0]);
      } else {
        setSelecteddiscount(null);
      }
    } catch (error) {
      console.error(error);
      setSelecteddiscount(null);
    }
  };
  const fetchDiscountSetting = async () => {
    try {
      const { data } = await axios.get(
        `${baseURL}/auth/api/calculator/getDiscountSetting`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (data.data && data.data.length > 0) {
        setDiscountDataSet(data.data[0]);
      } else {
        setDiscountDataSet(null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPredefinedNotes();
    fetchDiscount();
    fetchDiscountSetting();
  }, [id, proposalId]);

  const getOptionalAddonAmount = (serviceName, editingTypeName) => {
    const match = optionalAmounts.find(
      (item) =>
        item.service_name === serviceName &&
        item.editing_type_name === editingTypeName
    );
    return match ? parseFloat(match.amount) : 0;
  };

  const handleEdit = (entry) => {
    console.log(entry);

    setEditId(entry.id);
    setSelectedService(entry.service_name);
    setSelectedCategory(entry.category_name);
    setSelectedEditingType({
      editing_type_id: entry.editing_type_id,
      editing_type_name: entry.editing_type_name,
      amount: parseFloat(entry.editing_type_amount),
    });
    console.log(selectedEditingType);

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
    if (!selectedEditingType) return;
    setLoading(true);

    // Base amount
    let baseAmount = selectedEditingType.amount * quantity;

    // Optional addon values
    let optionalTotal = 0;
    let include_content_posting = 0;
    let include_thumbnail_creation = 0;
    let include_youtube_video_posting = 0;

    optionalServices.forEach((opt) => {
      const key = opt.editing_type_name.toLowerCase().replace(/\s+/g, "_");
      if (addons[key]) {
        const amount = parseFloat(opt.amount);
        const totalForThisAddon = amount * quantity; // ✅ multiply by quantity
        optionalTotal += totalForThisAddon;

        const lowerKey = key.toLowerCase();
        if (lowerKey === "content_posting" || lowerKey === "meta_growth_&_content_management") {
          include_content_posting = amount;
        } else if (lowerKey === "thumbnail_creation") {
          include_thumbnail_creation = amount;
        } else if (lowerKey === "youtube_video_posting" || lowerKey === "youtube_channel_growth_&_optimization") {
          include_youtube_video_posting = amount;
        }
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
      include_youtube_video_posting,   // ← yeh missing tha
      total_amount: finalAmount,
      employee: userName,
    };

    // --- Only Quotation API ---
    const quotationRequest = editId
      ? axios.put(
        `${baseURL}/auth/api/calculator/updateGraphicEntryById/${editId}`,
        payload
      )
      : axios.post(
        `${baseURL}/auth/api/calculator/saveCalculatorData`,
        payload
      );

    quotationRequest
      .then((res) => {
        if (res.data.status === "Success") {
          Swal.fire({
            icon: "success",
            title: editId ? "Updated!" : "Saved!",
            text: editId
              ? "Quotation updated successfully"
              : "Quotation saved successfully",
            showConfirmButton: false,
            timer: 1000,
            // timerProgressBar: true,
          });
          resetForm();
          fetchData();
          if (onSaveComplete) onSaveComplete();
        } else if (res.data.status === "Alert") {
          // Handle backend "Failure" response
          Swal.fire({
            icon: "warning",
            title: "Already Exists",
            text: res.data.message || "This service already exists",
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

        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            err.response?.data?.message ||
            "Failed to save quotation. Please try again.",
          showConfirmButton: false,
          timer: 1000,
          // timerProgressBar: true,
        });
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

  const handleClose = () => {
    setShowModal(false);
    setFormData({
      note_name: "",
      plan: "",
    });
  };
  const handleShowDiscount = () => {
    if (selecteddiscount) {
      setFormDataDiscount({
        discount_type: selecteddiscount.discount_type || "amount",
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
    setFormDataDiscount({
      discount_type: "amount",
      discount_per: "",
      discount_amt: "",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleChangeDiscount = (e) => {
    const { name, value } = e.target;
    setFormDataDiscount((prev) => {
      if (name === "discount_type") {
        return {
          ...prev,
          discount_type: value,
          discount_per: "",
          discount_amt: "",
        };
      }
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handleSaveDiscount = async (e) => {
    e.preventDefault();
    setLoading(true);

    const resetAndClose = () => {
      setShowModalDiscount(false);
      setFormDataDiscount({
        discount_type: "amount",
        discount_per: "",
        discount_amt: "",
      });
    };

    try {
      if (grandTotal <= 0) {
        Swal.fire({
          icon: "warning",
          title: "Invalid Total!",
          text: "Grand total should be greater than 0 before setting discount.",
          showConfirmButton: false,
          timer: 1200,
        });
        setLoading(false);
        return;
      }

      const isAmountType = formDataDiscount.discount_type === "amount";
      const enteredValue = isAmountType
        ? Number(formDataDiscount.discount_amt)
        : Number(formDataDiscount.discount_per);

      if (!enteredValue || enteredValue < 0) {
        Swal.fire({
          icon: "warning",
          title: "Required!",
          text: `Please enter a valid discount ${isAmountType ? "amount (₹)" : "percentage (%)"
            }`,
          showConfirmButton: false,
          timer: 1000,
        });
        setLoading(false);
        return;
      }

      if (!isAmountType && enteredValue > 100) {
        Swal.fire({
          icon: "warning",
          title: "Invalid!",
          text: "Percentage cannot exceed 100%",
          showConfirmButton: false,
          timer: 1000,
        });
        setLoading(false);
        return;
      }

      if (isAmountType) {
        const maxAmt = discountDataSet?.discount_amt
          ? Number(discountDataSet.discount_amt)
          : grandTotal;
        if (enteredValue > maxAmt) {
          Swal.fire({
            icon: "warning",
            title: "Limit Exceeded!",
            text: `Max discount amount is ₹${maxAmt.toLocaleString()} (set in settings)`,
            showConfirmButton: false,
            timer: 2000,
          });
          setLoading(false);
          return;
        }
      }

      if (!isAmountType) {
        const maxPer = discountDataSet?.discount_per
          ? Number(discountDataSet.discount_per)
          : 100;
        if (enteredValue > maxPer) {
          Swal.fire({
            icon: "warning",
            title: "Limit Exceeded!",
            text: `Max discount percentage is ${maxPer}% (set in settings)`,
            showConfirmButton: false,
            timer: 2000,
          });
          setLoading(false);
          return;
        }

        if (discountDataSet?.discount_amt) {
          const calculatedRupee = (grandTotal * enteredValue) / 100;
          const maxAmt = Number(discountDataSet.discount_amt);
          if (calculatedRupee > maxAmt) {
            Swal.fire({
              icon: "warning",
              title: "Limit Exceeded!",
              text: `This % gives ₹${calculatedRupee.toFixed(
                0
              )} discount which exceeds max ₹${maxAmt.toLocaleString()}`,
              showConfirmButton: false,
              timer: 2000,
            });
            setLoading(false);
            return;
          }
        }
      }

      const payload = isAmountType
        ? {
          discount_type: "amount",
          discount_per: parseFloat(
            ((enteredValue / grandTotal) * 100).toFixed(4)
          ),
          discount_amt: enteredValue,
          client_id: id,
          txn_id: proposalId,
        }
        : {
          discount_type: "percent",
          discount_per: enteredValue,
          discount_amt: parseFloat(
            ((grandTotal * enteredValue) / 100).toFixed(2)
          ),
          client_id: id,
          txn_id: proposalId,
        };

      const response = selecteddiscount
        ? await axios.put(
          `${baseURL}/auth/api/calculator/updateDiscountDataById/${selecteddiscount.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        : await axios.post(
          `${baseURL}/auth/api/calculator/saveDiscountData`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );

      if (response.data.status === "Success") {
        Swal.fire({
          icon: "success",
          title: selecteddiscount ? "Updated!" : "Saved!",
          text: selecteddiscount
            ? "Discount updated successfully"
            : "Discount saved successfully",
          showConfirmButton: false,
          timer: 1000,
        });
        fetchDiscount();
        resetAndClose();
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed!",
          text: response.data.message || "Failed to save discount.",
          showConfirmButton: false,
          timer: 1000,
        });
      }
    } catch (err) {
      console.error("Save error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          err.response?.data?.message ||
          "Something went wrong while saving discount.",
        showConfirmButton: false,
        timer: 1500,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      console.log("Submitting form data:", formData);
      let response;

      if (isEditing && selectedNotesId) {
        response = await axios.put(
          `${baseURL}/auth/api/calculator/updateClientNoteDataById/${selectedNotesId.id}`,
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
          `${baseURL}/auth/api/calculator/addNotebyplan`,
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
        client_id: id,
        planNotes,
      };

      const res = await axios.post(
        `${baseURL}/auth/api/calculator/saveClientIdwiseNotes`,
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
        `${baseURL}/auth/api/calculator/deletePlanClientNotes/${noteId}`
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
  const handleDeleteDiscount = async () => {
    if (!selecteddiscount?.id) return;

    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to delete this discount?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirm.isConfirmed) return;

    setLoading(true);
    try {
      await axios.delete(
        `${baseURL}/auth/api/calculator/deleteDiscountById/${selecteddiscount.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelecteddiscount(null);
      setShowModalDiscount(false);
      setFormDataDiscount({
        discount_type: "amount",
        discount_per: "",
        discount_amt: "",
      });
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Discount has been deleted.",
        timer: 1000,
        showConfirmButton: false,
      });
      fetchDiscount();
    } catch (err) {
      console.error("Delete error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          err.response?.data?.message ||
          "Something went wrong while deleting discount.",
        showConfirmButton: false,
        timer: 1500,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    if (!id || !proposalId) return;
    try {
      const { data } = await axios.get(
        `${baseURL}/auth/api/calculator/getByIDCalculatorTransactions/${proposalId}/${id}`,
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
        `${baseURL}/auth/api/calculator/getClientNotesbyId/${id}/${proposalId}`,
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
  }, [id, proposalId]);

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
        `${baseURL}/auth/api/calculator/deleteGraphicEntryById/${entryId}`
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

  const discountAmount = selecteddiscount
    ? selecteddiscount.discount_type === "percent"
      ? (grandTotal * Number(selecteddiscount.discount_per)) / 100
      : selecteddiscount.discount_type === "amount"
        ? Number(selecteddiscount.discount_amt)
        : 0
    : 0;

  const totalAfterDiscount = grandTotal - discountAmount;

  const handleSelect = (note) => {
    handleAddPredefinedNote(note);
    setSelectedNote(null);
    setIsOpen(false);
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

  const uniquePredefinedNotes = predefinedNotes.filter(
    (p) => !allClientNote.some((c) => c.note_name === p.note_text) && !selectedNotes.some((s) => s.note_name === p.note_text)
  );
  const selectCls = "w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 disabled:bg-gray-800 disabled:text-gray-500";
  const labelCls = "block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1";
  const cardCls = "bg-gray-800 rounded-xl border border-gray-700 shadow-sm p-5";

  return (
    <>
      <div className="min-h-screen bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">

          {/* Header */ }
          <div className="flex items-center gap-3">
            <button onClick={ () => navigate(-1) } className="w-9 h-9 rounded-lg border border-gray-600 bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition flex-shrink-0">
              <ArrowLeft className="w-4 h-4 text-gray-300" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Service Calculator</h1>
              <p className="text-xs text-gray-500">Build &amp; save service quotations</p>
            </div>
          </div>

          {/* Service Type Toggle */ }
          <div className="flex gap-2 p-1 bg-gray-800 rounded-xl border border-gray-700">
            { [{ val: "paid", label: " Paid Service" }, { val: "complimentary", label: " Complimentary" }].map(({ val, label }) => (
              <button key={ val } onClick={ () => setServiceType(val) }
                className={ `flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${serviceType === val ? "bg-red-600 text-white shadow" : "text-gray-400 hover:text-white hover:bg-gray-700"}` }>
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={ labelCls }>Service</label>
                    <select value={ selectedService } disabled={ !!editId } className={ selectCls }
                      onChange={ (e) => { setSelectedService(e.target.value); setSelectedCategory(""); setSelectedEditingType(null); } }>
                      <option value="">-- Choose --</option>
                      { data.map((s) => <option key={ s.service_id } value={ s.service_name }>{ s.service_name }</option>) }
                    </select>
                  </div>
                  <div>
                    <label className={ labelCls }>Category</label>
                    <select value={ selectedCategory } disabled={ !!editId || !getSelectedService } className={ selectCls }
                      onChange={ (e) => { 
                        const catName = e.target.value;
                        setSelectedCategory(catName);
                        const category = getSelectedService?.categories.find(c => c.category_name === catName);
                        if (category && category.editing_types && category.editing_types.length === 1 && category.editing_types[0].editing_type_name === null) {
                          setSelectedEditingType(category.editing_types[0]);
                        } else {
                          setSelectedEditingType(null);
                        }
                      } }>
                      <option value="">-- Choose --</option>
                      { getSelectedService?.categories.map((c) => <option key={ c.category_id } value={ c.category_name }>{ c.category_name }</option>) }
                    </select>
                  </div>
                </div>

                {/* Row 2: Editing Type + Quantity */ }
                <div className="grid grid-cols-2 gap-3">
                  { !(getSelectedCategory?.editing_types?.length === 1 && getSelectedCategory.editing_types[0].editing_type_name === null) && (
                    <div>
                      <label className={ labelCls }>Editing Type</label>
                      <select value={ selectedEditingType?.editing_type_id || "" } disabled={ !!editId || !getSelectedCategory } className={ selectCls }
                        onChange={ (e) => { const ed = getSelectedCategory?.editing_types.find((et) => et.editing_type_id === parseInt(e.target.value)); setSelectedEditingType(ed); } }>
                        <option value="">-- Choose --</option>
                        { getSelectedCategory?.editing_types.map((ed) => <option key={ ed.editing_type_id } value={ ed.editing_type_id }>{ ed.editing_type_name } — ₹{ ed.amount }</option>) }
                      </select>
                    </div>
                  ) }
                  <div>
                    <label className={ labelCls }>Quantity</label>
                    <input type="number" min={ 1 } value={ quantity } onChange={ (e) => setQuantity(parseInt(e.target.value)) }
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
                            <div key={ key } className="flex items-center gap-1.5 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2">
                              <span className="text-sm text-white font-medium">{ getServiceDisplayName(opt.editing_type_name) }</span>
                              <span className="text-xs text-gray-400">₹{ opt.amount }</span>
                              <div className="flex gap-1 ml-2">
                                <button type="button" disabled={ !!editId } onClick={ () => !editId && setAddons((p) => ({ ...p, [key]: true })) }
                                  className={ `px-3 py-1 rounded-md text-xs font-bold transition ${addons[key] ? "bg-green-500 text-white" : "bg-gray-600 text-gray-300 hover:bg-green-900"} disabled:opacity-40` }>YES</button>
                                <button type="button" disabled={ !!editId } onClick={ () => !editId && setAddons((p) => ({ ...p, [key]: false })) }
                                  className={ `px-3 py-1 rounded-md text-xs font-bold transition ${!addons[key] ? "bg-red-500 text-white" : "bg-gray-600 text-gray-300 hover:bg-red-900"} disabled:opacity-40` }>NO</button>
                              </div>
                            </div>
                          );
                        }) }
                    </div>
                  </div>
                ) }

                {/* Buttons */ }
                <div className="flex gap-2 pt-1">
                  <button onClick={ handleSave } disabled={ loading }
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition shadow-sm text-sm">
                    { loading ? "Saving..." : editId ? "✔ Update Entry" : "💾 Calculate & Save" }
                  </button>
                  <button onClick={ resetForm }
                    className="px-4 py-2.5 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition text-sm font-medium">
                    Reset
                  </button>
                  <button onClick={ handleShowDiscount }
                    className="px-4 py-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition text-sm font-semibold">
                    <BadgePercent className="w-4 h-4 inline mr-1" />{ selecteddiscount ? "Edit Discount" : "Discount" }
                  </button>
                </div>
              </div>

              {/* Total Summary Card */ }
              <div className={ cardCls }>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-400">Summary</span>
                  { selecteddiscount && <span className="text-xs bg-green-500/20 text-green-400 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Discount Applied</span> }
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal</span><span className="font-semibold text-white">₹{ grandTotal.toLocaleString() }</span>
                  </div>
                  { selecteddiscount && (
                    <div className="flex justify-between items-center text-sm text-green-600">
                      <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" />Discount { selecteddiscount.discount_type === "percent" ? `(${selecteddiscount.discount_per}%)` : `(₹${parseFloat(selecteddiscount.discount_amt).toLocaleString()})` }</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">− ₹{ discountAmount.toFixed(2) }</span>
                        <button onClick={ handleShowDiscount } className="p-1 rounded hover:bg-green-100 text-green-600"><Pencil className="w-3 h-3" /></button>
                        <button onClick={ () => handleDeleteDiscount(selecteddiscount.id) } className="p-1 rounded hover:bg-red-100 text-red-500"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ) }
                  { selecteddiscount && <div className="h-px bg-gray-700" /> }
                  <div className="flex justify-between font-bold text-base text-white">
                    <span>{ selecteddiscount ? "Total Payable" : "Grand Total" }</span>
                    <span className={ selecteddiscount ? "text-green-600" : "text-red-600" }>₹{ selecteddiscount ? totalAfterDiscount.toFixed(2) : grandTotal.toLocaleString() }</span>
                  </div>
                </div>
              </div>

              {/* Orders List */ }
              { getData.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><Package className="w-4 h-4 text-red-400" />Saved Services</h3>
                  { getData.map((order) => (
                    <div key={ order.id } className={ cardCls + " hover:border-red-500/50 transition" }>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white text-sm">{ order.service_name } → { order.category_name }</p>
                          <p className="text-xs text-gray-400 mt-0.5">🎬 { order.editing_type_name } × { order.quantity }</p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            { Number(order.include_content_posting) > 0 && <span className="text-xs bg-red-500/20 border border-red-500/30 text-red-400 px-2 py-0.5 rounded-full">📢 Meta Growth & Content Mgmt</span> }
                            { Number(order.include_thumbnail_creation) > 0 && <span className="text-xs bg-orange-500/20 border border-orange-500/30 text-orange-400 px-2 py-0.5 rounded-full">🖼 Thumbnail</span> }
                            { Number(order.include_youtube_video_posting) > 0 && <span className="text-xs bg-red-500/20 border border-red-500/30 text-red-400 px-2 py-0.5 rounded-full">▶️ YouTube Channel Growth & Optimization</span> }
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-bold text-green-600 text-base">₹{ parseFloat(order.total_amount).toLocaleString() }</span>
                          <button onClick={ () => handleEdit(order) } className="w-8 h-8 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={ () => handleDelete(order.id) } className="w-8 h-8 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  )) }
                </div>
              ) }

              {/* Notes Section */ }
              { !hideNotes && (
                <>
                  <div className={ cardCls + " space-y-3" }>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><StickyNote className="w-4 h-4 text-orange-400" />Notes</h3>

                    {/* Predefined Note Dropdown */ }
                    <div className="relative" ref={ dropdownRef }>
                      <div onClick={ () => setIsOpen(!isOpen) }
                        className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg border border-gray-600 bg-gray-700 text-sm cursor-pointer hover:border-gray-500 transition">
                        <span className="text-gray-300 truncate">{ selectedNote ? selectedNote.note_text : "Select a predefined note to add..." }</span>
                        { isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" /> }
                      </div>
                      { isOpen && (
                        <div className="absolute z-20 w-full mt-1 max-h-56 overflow-auto rounded-lg border border-gray-600 bg-gray-800 shadow-2xl">
                          { uniquePredefinedNotes.length === 0
                            ? <p className="text-center text-gray-500 text-sm py-4">No more predefined notes</p>
                            : uniquePredefinedNotes.map((note) => (
                              <div key={ note.id } onClick={ () => handleSelect(note) }
                                className="px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-0 transition">{ note.note_text }</div>
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
            <AdminComplimentaryData />
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

export default AdminCalculator;
