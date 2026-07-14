import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import numberToWords from "number-to-words";
import {
  Calendar,
  Search,
  ArrowLeft,
  X,
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Timer,
  Calendar1,
  Trash,
  RefreshCcw,
  Package,
  StickyNote,
  Notebook,
  ChevronUp,
  ChevronDown,
  IndianRupeeIcon,
} from "lucide-react";
import axios from "axios";
import { classifyProformaServices } from "../utils/proformaPricing";
import moment from "moment";
import Swal from "sweetalert2";
import { clearUser } from "../redux/user/userSlice";
import img1 from "../assets/Dg 1copy.png";
import img2 from "../assets/Dg 2copy.png";
import img3 from "../assets/DOAGURU IT Solution.png";
import img4 from "../assets/DOAGURU Infosystyem.png";
import img5 from "../assets/dghead.jpeg";
import API_BASE_URL from "../config/apiBaseUrl";

export default function BDInvoice() {
  const baseURL = API_BASE_URL;
  const { id, txn_id } = useParams();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const docTypeFromURL = query.get("doc") === "proforma" ? "proforma" : "final";
  const txnIdFromURL = query.get("txnId");
  const activeTxnId = txnIdFromURL || txn_id;
  const isGST = query.get("gst") === "1";
  const navigate = useNavigate();
  const { currentUser, token } = useSelector((state) => state.user);
  const userName = currentUser?.name;
  const dispatch = useDispatch();
  const [total, setTotal] = useState(0);

  const [serviceData, setServiceData] = useState([]);
  const [additionalServiceData, setAdditionalServiceData] = useState([]);
  const [remainingAmountData, setRemainingAmountData] = useState([]);
  const [graphicData, setGraphicData] = useState([]);
  const [adsData, setAdsData] = useState([]);
  const [complimentaryData, setComplimentaryData] = useState([]);
  const [selecteddiscount, setSelecteddiscount] = useState("");
  const [selectedBudget, setSelectedBudgest] = useState(0);
  const [notesData, setNotesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState([]);
  const isProforma =
    String(clientData?.document_type || clientData?.invoice_type || docTypeFromURL)
      .toLowerCase() === "proforma";
  const [imagesLoaded, setImagesLoaded] = useState({
    header: false,
    footer: false,
  });
  const [selectedService, setSelectedService] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedEditingType, setSelectedEditingType] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [getData, setGetData] = useState([]);
  const [optionalServices, setOptionalServices] = useState([]);
  const [data, setData] = useState([]);

  const [addons, setAddons] = useState({});
  const [isEditingAddition, setIsEditingAddition] = useState(false);
  const [showModalAddition, setShowModalAddition] = useState(false);
  const [showModalRemaining, setShowModalRemaining] = useState(false);
  const [isEditingRemaining, setIsEditingRemaining] = useState(false);

  const [optionalAmounts, setOptionalAmounts] = useState([]);
  const getServiceDisplayName = (name) => {
    if (!name) return name;
    const n = name.toLowerCase();
    if (n.includes("content posting")) return "Meta Growth & Content Management";
    if (n.includes("youtube video posting")) return "YouTube Channel Growth & Optimization";
    if (n.includes("google ad")) return "Google Ads Campaign Management & Optimization";
    if (n.includes("meta ad")) return "Meta Ads Campaign Management & Optimization";
    return name;
  };

  const [formDataRemaining, setFormDataRemaining] = useState({
    service_name: "",
    price: "",
  });

  const [formDataNote, setFormDataNote] = useState({
    note_name: "",
    plan: "Customise",
  });
  const [selectedNotesId, setSelectedNotesId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [predefinedNotes, setPredefinedNotes] = useState([]); // fetched from API
  const [selectedNotes, setSelectedNotes] = useState([]); // selected + manual
  const [manualNote, setManualNote] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [showModalDiscount, setShowModalDiscount] = useState(false);
  const [discountDataSet, setDiscountDataSet] = useState(null);
  const [formDataDiscount, setFormDataDiscount] = useState({
    discount_type: "amount",
    discount_per: "",
    discount_amt: "",
  });
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

  const fetchServices = async () => {
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/calculator/getinInvoiceServiceHistory/${id}/${activeTxnId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.data.status === "Success" || res.data.data) {
        const { dmServices, adsServices } = classifyProformaServices(res.data.data || []);
        setServiceData([...dmServices, ...adsServices]);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        Swal.fire({
          title: "Session Expired",
          text: "Please login again.",
          icon: "warning",
        }).then(() => {
          dispatch(clearUser());
          localStorage.removeItem("token");
          navigate("/");
        });
      }
    }
  };

  const fetchClient = async () => {
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/calculator/getInvoiceClientDetailsById/${id}/${activeTxnId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.data.status === "Success") {
        setClientData(res.data.data);
      }
      // console.log(clientData);
    } catch (error) {
      if (error.response?.status === 401) {
        Swal.fire({
          title: "Session Expired",
          text: "Please login again.",
          icon: "warning",
        }).then(() => {
          dispatch(clearUser());
          localStorage.removeItem("token");
          navigate("/");
        });
      }
    }
  };
  const fetchClientNotes = async () => {
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/calculator/getInvoiceClientNotesbyId/${id}/${activeTxnId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.data.status === "Success") {
        setNotesData(res.data.data);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        Swal.fire({
          title: "Session Expired",
          text: "Please login again.",
          icon: "warning",
        }).then(() => {
          dispatch(clearUser());
          localStorage.removeItem("token");
          navigate("/");
        });
      }
    }
  };
  const fetchComplimentaryData = async () => {
    try {
      const { data } = await axios.get(
        `${baseURL}/auth/api/calculator/getComplimentaryInvoiceData/${activeTxnId}/${id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // console.log(data.data);
      setComplimentaryData(data.data);
      // console.log(complimentaryData);
    } catch (error) {
      // console.log(error);
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
  const fetchDiscount = async () => {
    try {
      const { data } = await axios.get(
        `${baseURL}/auth/api/calculator/getByIDDiscountData/${id}/${activeTxnId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.data && data.data.length > 0) {
        // console.log("✅ Discount loaded:", data.data[0]);
        setSelecteddiscount(data.data[0]);
      } else {
        // console.log("⚠️ No discount found for this invoice");
        setSelecteddiscount(null);
      }
    } catch (error) {
      console.error("Error fetching discount:", error);
      setSelecteddiscount(null);
    }
  };

  const fetchDiscountSetting = async () => {
    try {
      const { data } = await axios.get(
        `${baseURL}/auth/api/calculator/getDiscountSetting`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.data && data.data.length > 0) {
        setDiscountDataSet(data.data[0]);
      }
    } catch (error) {
      console.error("Error fetching discount setting:", error);
    }
  };

  const fetchPredefinedNotes = async () => {
    try {
      const { data } = await axios.get(
        `${baseURL}/auth/api/calculator/getInvoiceNoteData`,
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

  const fetchAdditionservice = async () => {
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/calculator/getAdditionByIdData/${id}/${activeTxnId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.data.status === "Success") {
        setAdditionalServiceData(res.data.data);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        Swal.fire({
          title: "Session Expired",
          text: "Please login again.",
          icon: "warning",
        }).then(() => {
          dispatch(clearUser());
          localStorage.removeItem("token");
          navigate("/");
        });
      }
    }
  };
  const fetchRemainingAmount = async () => {
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/calculator/getRemainingAmountByIdData/${id}/${activeTxnId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.data.status === "Success") {
        setRemainingAmountData(res.data.data);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        Swal.fire({
          title: "Session Expired",
          text: "Please login again.",
          icon: "warning",
        }).then(() => {
          dispatch(clearUser());
          localStorage.removeItem("token");
          navigate("/");
        });
      }
    }
  };

  const clientName = clientData?.client_name;
  const clientOrganization = clientData?.client_organization;
  const clientAddress = clientData?.address;
  const clientPhone = clientData?.phone;
  // console.log(clientName, clientOrganization);
  console.log("clientData.realized_ad_budget:", clientData?.realized_ad_budget);

  const fetchProformaData = async () => {};

  useEffect(() => {
    fetchServices();
    fetchClient();
    fetchClientNotes();
    fetchComplimentaryData();
    fetchDiscount();
    fetchDiscountSetting();
    fetchAdditionservice();
    fetchRemainingAmount();
    fetchPredefinedNotes();
  }, [id, txn_id]);

  const handleEdit = (entry) => {
    setIsEditingAddition(entry.id);
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
    setShowModalAddition(true);
  };

  const getSelectedService = data.find(
    (s) => s.service_name === selectedService
  );
  const getSelectedCategory = getSelectedService?.categories.find(
    (c) => c.category_name === selectedCategory
  );

  const handleShow = () => {
    setIsEditingAddition(false);
    setShowModalAddition(true);
  };
  const handleRemainingShow = () => {
    setIsEditingRemaining(false);
    setShowModalRemaining(true);
  };
  const handleChangeNote = (e) => {
    const { name, value } = e.target;

    setFormDataNote((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleCloseNote = () => {
    setShowModal(false);
    setFormDataNote({
      note_name: "",
      plan: "",
    });
  };

  useEffect(() => {
    if (!Array.isArray(serviceData) || serviceData.length === 0) return;

    const graphicRaw = serviceData.filter(
      (item) => item.service_type === "Graphic Service"
    );
    const adsRaw = serviceData.filter(
      (item) => item.service_type === "Ads Campaign"
    );

    const groupedGraphic = [];

    graphicRaw.forEach((item) => {
      let service = groupedGraphic.find((s) => s.service === item.service_name);
      if (!service) {
        service = { service: item.service_name, editingTypes: [] };
        groupedGraphic.push(service);
      }

      service.editingTypes.push({
        category: item.category_name,
        type: item.editing_type_name || "N/A",
        quantity: Number(item.quantity) || 1,
        price: Number(item.editing_type_amount) || 0,
        include_content_posting: Number(item.include_content_posting) || 0,
        include_thumbnail_creation:
          Number(item.include_thumbnail_creation) || 0,
        include_youtube_video_posting:
          Number(item.include_youtube_video_posting) || 0,
        total: Number(item.total_amount) || 0,
      });
    });

    setGraphicData(groupedGraphic);

    setAdsData(adsRaw);
    setLoading(false);
  }, [serviceData]);

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

  useEffect(() => {
    if (selectedService === "Video Services") {
      setAddons({
        thumbnail_creation: true,
        content_posting: true,
      });
    } else if (selectedService === "Graphics Design") {
      setAddons({
        content_posting: true,
        thumbnail_creation: false,
      });
    } else {
      setAddons({});
    }
  }, [selectedService]);

  const handleSave = (e) => {
    e.preventDefault();
    if (!selectedEditingType) return;

    // Base amount
    let baseAmount = selectedEditingType.amount * quantity;

    // Optional addon values
    let optionalTotal = 0;
    let include_content_posting = 0;
    let include_thumbnail_creation = 0;

    optionalServices.forEach((opt) => {
      const key = opt.editing_type_name.toLowerCase().replace(/\s+/g, "_");
      if (addons[key]) {
        const amount = parseFloat(opt.amount);
        const totalForThisAddon = amount * quantity; // ✅ multiply by quantity

        optionalTotal += totalForThisAddon;

        if (key === "content_posting") {
          include_content_posting = amount; // Send unit amount, not total
        } else if (key === "thumbnail_creation") {
          include_thumbnail_creation = amount; // Send unit amount, not total
        }
      }
    });

    const finalAmount = baseAmount + optionalTotal;
    setTotal(finalAmount);

    const payload = {
      txn_id: txn_id,
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

    const request = isEditingAddition
      ? axios.put(
        `${baseURL}/auth/api/calculator/updateAdditionalDataById/${isEditingAddition}`,
        payload
      )
      : axios.post(
        `${baseURL}/auth/api/calculator/saveAdditionalData`,
        payload
      );

    request
      .then((res) => {
        resetForm();
        if (res.data.status === "Success") {
          Swal.fire({
            icon: "success",
            title: isEditingAddition ? "Updated!" : "Saved!",
            text: isEditingAddition
              ? "Entry updated successfully"
              : "Saved successfully",
            showConfirmButton: false,
            timer: 1000,
            // timerProgressBar: true,
          });
          fetchAdditionservice();
          setShowModalAddition(false);
        } else if (res.data.status === "Alert") {
          Swal.fire({
            icon: "warning",
            title: "Already Exists",
            text: res.data.message || "This Additoinal service already exists",
            showConfirmButton: false,
            timer: 1000,
            // timerProgressBar: true,
          });
          resetForm();
          fetchAdditionservice();
          setShowModalAddition(false);
        }
      })
      .catch((err) => {
        console.error("Save error:", err);
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
      setFormDataDiscount({ discount_type: "amount", discount_per: "", discount_amt: "" });
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
      setFormDataDiscount({ discount_type: "amount", discount_per: "", discount_amt: "" });
    };

    try {
      const isAmountType = formDataDiscount.discount_type === "amount";
      const enteredValue = isAmountType
        ? Number(formDataDiscount.discount_amt)
        : Number(formDataDiscount.discount_per);

      // Agar 0 enter kiya → existing discount delete karo
      if (enteredValue === 0) {
        if (selecteddiscount?.id) {
          await axios.delete(
            `${baseURL}/auth/api/calculator/deleteDiscountById/${selecteddiscount.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setSelecteddiscount(null);
          Swal.fire({ icon: "success", title: "Removed!", text: "Discount has been removed.", showConfirmButton: false, timer: 1000 });
        }
        resetAndClose();
        fetchDiscount();
        setLoading(false);
        return;
      }

      // Value validation
      if (!enteredValue || enteredValue < 0) {
        Swal.fire({ icon: "warning", title: "Required!", text: `Please enter a valid discount ${isAmountType ? "amount (₹)" : "percentage (%)"}`, showConfirmButton: false, timer: 1000 });
        setLoading(false);
        return;
      }

      // % max 100 check
      if (!isAmountType && enteredValue > 100) {
        Swal.fire({ icon: "warning", title: "Invalid!", text: "Percentage cannot exceed 100%", showConfirmButton: false, timer: 1000 });
        setLoading(false);
        return;
      }

      // Amount max check - DB limit ya grandTotal
      if (isAmountType) {
        const maxAmt = discountDataSet?.discount_amt
          ? Number(discountDataSet.discount_amt)
          : grandTotal;
        if (enteredValue > maxAmt) {
          Swal.fire({ icon: "warning", title: "Limit Exceeded!", text: `Max discount amount is ₹${maxAmt.toLocaleString()} (set in settings)`, showConfirmButton: false, timer: 2000 });
          setLoading(false);
          return;
        }
      }

      // % max check - DB limit ya 100
      if (!isAmountType) {
        const maxPer = discountDataSet?.discount_per
          ? Number(discountDataSet.discount_per)
          : 100;
        if (enteredValue > maxPer) {
          Swal.fire({ icon: "warning", title: "Limit Exceeded!", text: `Max discount percentage is ${maxPer}% (set in settings)`, showConfirmButton: false, timer: 2000 });
          setLoading(false);
          return;
        }
        // Also check if calculated rupee amount exceeds DB amount limit
        if (discountDataSet?.discount_amt) {
          const calculatedRupee = (grandTotal * enteredValue) / 100;
          const maxAmt = Number(discountDataSet.discount_amt);
          if (calculatedRupee > maxAmt) {
            Swal.fire({ icon: "warning", title: "Limit Exceeded!", text: `This % gives ₹${calculatedRupee.toFixed(0)} discount which exceeds max ₹${maxAmt.toLocaleString()}`, showConfirmButton: false, timer: 2000 });
            setLoading(false);
            return;
          }
        }
      }

      // Payload banao:
      // Amount type → discount_amt = direct rupee value, discount_per = calculated %
      // Percent type → discount_per = entered %, discount_amt = calculated rupee value
      const payload = isAmountType
        ? {
            discount_type: "amount",
            discount_per: parseFloat(((enteredValue / grandTotal) * 100).toFixed(4)),
            discount_amt: enteredValue,
            client_id: id,
            txn_id: txn_id,
          }
        : {
            discount_type: "percent",
            discount_per: enteredValue,
            discount_amt: parseFloat(((grandTotal * enteredValue) / 100).toFixed(2)),
            client_id: id,
            txn_id: txn_id,
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
          text: selecteddiscount ? "Discount updated successfully" : "Discount saved successfully",
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
        text: err.response?.data?.message || "Something went wrong while saving discount.",
        showConfirmButton: false,
        timer: 1500,
      });
    } finally {
      setLoading(false);
    }
  };

  // handleDeleteDiscount removed - delete functionality removed from UI

  const handleEditRemaining = (items) => {
    setIsEditingRemaining(items.id);
    setFormDataRemaining({
      service_name: items.service_name,
      price: items.price,
    });
    setShowModalRemaining(true);
  };



  const handleChangeRemaining = (e) => {
    const { name, value } = e.target;

    setFormDataRemaining((prev) => ({
      ...prev,
      [name]: value,
    }));
  };



  const handleRemainingSave = (e) => {
    e.preventDefault();

    const payload = {
      txn_id: txn_id,
      client_id: id,
      service_name: formDataRemaining.service_name,
      price: formDataRemaining.price,
      employee: userName,
    };

    const request = isEditingRemaining
      ? axios.put(
        `${baseURL}/auth/api/calculator/updateRemainingDataById/${isEditingRemaining}`,
        payload
      )
      : axios.post(
        `${baseURL}/auth/api/calculator/saveRemainingAmountData`,
        payload
      );

    request
      .then((res) => {
        resetForm();
        if (res.data.status === "Success") {
          Swal.fire({
            icon: "success",
            title: isEditingAddition ? "Updated!" : "Saved!",
            text: isEditingAddition
              ? "Entry updated successfully"
              : "Saved successfully",
            showConfirmButton: false,
            timer: 1000,
            // timerProgressBar: true,
          });
          fetchRemainingAmount();
          setShowModalRemaining(false);
        }
      })
      .catch((err) => {
        console.error("Save error:", err);
      });
  };
  // console.log(graphicData);
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // console.log("Submitting form data:", formDataNote);
      let response;

      if (isEditing && selectedNotesId) {
        response = await axios.put(
          `${baseURL}/auth/api/calculator/updateInvoiceClientNoteDataById/${selectedNotesId.id}`,
          formDataNote,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        // console.log(response.data);
      } else {
        response = await axios.post(
          `${baseURL}/auth/api/calculator/addNotebyplan`,
          formDataNote,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        // console.log(response.data);
      }

      // console.log("API response:", response.data);

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
          fetchClientNotes();
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
        txn_id: txn_id,
        client_id: id,
        planNotes,
      };

      const response = await axios.post(
        `${baseURL}/auth/api/calculator/saveInvoiceClientIdwiseNotes`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.status === "Alert") {
        Swal.fire({
          icon: "warning",
          title: "Duplicate Note",
          text: response.data.message,
          showConfirmButton: false,
          timer: 1000,
          // timerProgressBar: true,
        });
        fetchClientNotes();
        setManualNote("");
        setPredefinedNotes([]);
        setSelectedNotes([]);
        fetchPredefinedNotes();
        return; // stop execution here
      }

      Swal.fire({
        icon: "success",
        title: "Notes Created",
        text: response.data.message || "Notes saved successfully!",
        showConfirmButton: false,
        timer: 1000,
        // timerProgressBar: true,
      });

      fetchClientNotes();
      setManualNote("");
      setPredefinedNotes([]);
      setSelectedNotes([]);
      fetchPredefinedNotes();
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
        `${baseURL}/auth/api/calculator/deleteInvoiceClientNotes/${noteId}`
      );

      const result = res.data;

      if (result.status === "Success") {
        setNotesData((prev) => prev.filter((item) => item.id !== noteId));

        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "note has been deleted.",
          timer: 1000,
          showConfirmButton: false,
        });

        fetchClientNotes();
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

  const graphicTotal = graphicData.reduce(
    (sum, service) =>
      sum +
      service.editingTypes.reduce(
        (editSum, edit) => editSum + (edit.total || edit.price * edit.quantity),
        0
      ),
    0
  );
  const complimentaryTotal = complimentaryData.reduce((sum, service) => {
    // prefer total_amount if available, otherwise editing_type_amount * quantity
    const amount =
      service.total_amount !== null && service.total_amount !== undefined
        ? Number(service.total_amount)
        : Number(service.editing_type_amount || 0) *
        Number(service.quantity || 0);

    return sum + amount;
  }, 0);
  const additionalTotal = additionalServiceData.reduce((sum, service) => {
    // prefer total_amount if available, otherwise editing_type_amount * quantity
    const amount =
      service.total_amount !== null && service.total_amount !== undefined
        ? Number(service.total_amount)
        : Number(service.editing_type_amount || 0) *
        Number(service.quantity || 0);

    return sum + amount;
  }, 0);
  const remainingTotalAmount = remainingAmountData.reduce(
    (sum, item) => sum + (parseFloat(item.price) || 0),
    0
  );
  // console.log(remainingAmountData);

  // const adsTotal = adsData.reduce((sum, ad) => {
  //   const amount = Number(ad.amount || 0);
  //   const totalBudget = Number(ad.total_amount || 0);
  //   const gstTotal = (amount * 18) / 100;
  //   return sum + totalBudget + gstTotal;
  // }, 0);
  // const adsTotalBudget = adsData.reduce((sum, ad) => {
  //   const amount = Number(ad.amount || 0);

  //   const gstTotal = (amount * 18) / 100;
  //   return sum + amount + gstTotal;
  // }, 0);
  // const grandTotalAds =
  //   graphicTotal + adsTotal + additionalTotal - adsTotalBudget;

  // const grandTotal =
  //   graphicTotal + adsTotal + additionalTotal;

  // const adsTotal = adsData.reduce((sum, ad) => {
  //   const totalBudget = Number(ad.charge || 0);

  //   return sum + totalBudget;
  // }, 0);

  const grandTotalAds = graphicTotal + additionalTotal;

  const grandTotal = graphicTotal + additionalTotal;

  // Apply discount percentage only for display
  // Compute discounted amount based on type
  const discountAmount = selecteddiscount
    ? selecteddiscount.discount_type === "percent"
      ? (grandTotalAds * Number(selecteddiscount.discount_per)) / 100
      : selecteddiscount.discount_type === "amount"
        ? Number(selecteddiscount.discount_amt)
        : 0
    : 0;

  // Grand total after discount
  const totalAfterDiscount = grandTotal - discountAmount;

  // GST on discounted total if applicable
  const gstAmount = isGST ? (grandTotalAds - discountAmount) * 0.18 : 0;

  const currentAmtPreviousAmt = gstAmount + totalAfterDiscount;
  // console.log(currentAmtPreviousAmt);

  const totalgstamount = gstAmount + totalAfterDiscount;

  const currentTotalAmount =
    totalgstamount + Number(clientData.previous_amt || 0);
  const invoiceSubtotal = Math.max(totalAfterDiscount, 0);
  const invoiceTotal = invoiceSubtotal + gstAmount;

  const visibleAdBudget = Number(clientData?.realized_ad_budget || 0);
  const budgetAwareCurrentTotalAmount = currentTotalAmount + visibleAdBudget;

  const netBankAmount = Number(clientData?.received_amt || 0) - Number(clientData?.tds_amount || 0);
  const hasPayment = (clientData?.tag_received_amt === "received" || Number(clientData?.received_amt || 0) > 0);
  const totalForWords = hasPayment ? netBankAmount : totalgstamount;

  const realizedGoogleBudget = Number(clientData?.realized_google_budget || 0);
  const realizedMetaBudget = Number(clientData?.realized_meta_budget || 0);

  const safeTotal = Math.floor(Number(totalForWords) || 0);
  const amountInWords = safeTotal > 0
    ? numberToWords
        .toWords(safeTotal)
        .replace(/\b\w/g, (c) => c.toUpperCase()) + " Rupees Only"
    : "Zero Rupees Only";

  if (loading) {
    return (
      <div className="text-center p-10 font-semibold text-gray-700">
        Loading...
      </div>
    );
  }

  const previousBalance = Number(clientData.previous_amt || 0);

  const currentInvoiceTotal = totalgstamount;

  const totalcurrentamount = Number(clientData.current_amt || 0);



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
        `${baseURL}/auth/api/calculator/deleteAdditionalById/${entryId}`
      );

      const result = res.data;

      if (result.status === "Success") {
        setAdditionalServiceData((prev) =>
          prev.filter((item) => item.id !== entryId)
        );

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
  const handleRemainingDelete = async (entryId) => {
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
        `${baseURL}/auth/api/calculator/deleteRemainingAmountById/${entryId}`
      );

      const result = res.data;

      if (result.status === "Success") {
        setRemainingAmountData((prev) =>
          prev.filter((item) => item.id !== entryId)
        );

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

  const handleClosesetRemaining = () => {
    setShowModalRemaining(false);
    setFormDataRemaining({
      service_name: "",
      price: "",
    });
  };
  const handleCloseAddition = () => {
    setShowModalAddition(false);
  };
  const resetForm = () => {
    // setIsEditingAddition(null);
    setSelectedService("");
    setSelectedCategory("");
    // setSelectedEditingType(null);
    setQuantity(1);
    const initialAddons = {};
    optionalServices.forEach((item) => {
      const key = item.editing_type_name.toLowerCase().replace(/\s+/g, "_");
      initialAddons[key] = false;
    });
    setAddons(initialAddons);

    setTotal(0);
  };

  const handlePrintPage = () => {
    document.title = clientOrganization
      ? `${clientOrganization} ${isProforma ? "Proforma Invoice" : "Invoice"}`
      : `${clientName} ${isProforma ? "Proforma Invoice" : "Invoice"}`;
    window.print();
  };
  const handleSelect = (note) => {
    handleAddPredefinedNote(note);
    setSelectedNote(null);
    setIsOpen(false);
  };

  const uniquePredefinedNotes = predefinedNotes.filter(
    (p) =>
      !notesData.some((c) => c.note_name === p.note_text) &&
      !selectedNotes.some((s) => s.note_name === p.note_text)
  );
  return (
    <Wrapper>
      <div className="page-wrapper w-[210mm] h-[297mm] flex flex-col justify-between p-4 mx-auto bg-white print:break-after-page print:p-0 print:m-0">
        {/* Hidden on print - Action Buttons */ }

        <div className="print:hidden flex justify-end gap-3 my-4">
          <button
            onClick={ handlePrintPage }
            target="_blank"
            className="bg-red-600    text-white rounded-full px-4 py-2"
          >
            🖨️ Print
          </button>

          <button
            onClick={ () => navigate("/BD/dashboard") }
            className="bg-yellow-600 text-white rounded-full px-4 py-2"
          >
            📊 Dashboard
          </button>
          <button
            onClick={ () => navigate(-1) }
            className="bg-gray-600 text-white rounded-full px-4 py-2"
          >
            🔙 Back
          </button>
        </div>


        {/* Table for proper header/footer repetition */ }
        <table className="print:table print:border-collapse w-full print:m-0 print:p-0">
          {/* Repeating Header */ }
          <thead className="print:table-header-group w-full">
            <tr>
              <td className="p-0 m-0 w-full" style={ { padding: 0, margin: 0 } }>
                <div className="w-full h-[35mm] print:h-[35mm]" style={ { margin: 0, padding: 0, lineHeight: 0 } }>
                  { isGST ? (
                    <img
                      src={ img1 }
                      alt="Header"
                      className="w-full h-full object-cover object-top"
                      style={ { display: 'block', margin: 0, padding: 0 } }
                    />
                  ) : (
                    <img
                      src={ img5 }
                      alt="Header"
                      className="w-full h-full object-cover object-top"
                      style={ { display: 'block', margin: 0, padding: 0 } }
                    />
                  ) }
                </div>
              </td>
            </tr>
          </thead>

          {/* Main Content */ }
          <tbody className="print:table-row-group">
            <tr>
              <td className="p-0 m-0 align-top">
                <div className="print:block flex flex-col px-6 py-1 print:px-4 print:py-0">

                  <div className="w-full">
                    <div className="mb-2 text-center">
                      <p className="text-sm font-bold tracking-wide">
                        {isProforma ? "PROFORMA INVOICE" : (isGST ? "GST INVOICE" : "INVOICE")}
                      </p>
                    </div>
                    {/* Client Details */ }
                    <div className="flex justify-between text-xs mb-1">
                      <div className="space-y-1">
                        <p>
                          <strong>Payment Mode:</strong>{ " " }
                          { clientData?.payment_mode }
                        </p>
                        <p>
                          <strong>Service From:</strong>{ " " }
                          { moment(clientData?.duration_start_date).format(
                            "DD/MM/YYYY"
                          ) }{ " " }
                          to{ " " }
                          { moment(clientData?.duration_end_date).format(
                            "DD/MM/YYYY"
                          ) }
                        </p>
                      </div>

                      <div className="space-y-1 text-xs">
                        <p>
                          { isProforma ? (
                            <>
                              <strong>Proforma Invoice No: </strong>{ " " }
                              { clientData?.bill_number }
                            </>
                          ) : isGST > 0 ? (
                            <>
                              <strong>GST Invoice No: </strong>{ " " }
                              { clientData?.bill_number }
                            </>
                          ) : (
                            <>
                              <strong>N-GST Invoice No: </strong>{ " " }
                              { clientData?.bill_number }
                            </>
                          ) }
                        </p>
                        <p>
                          <strong>Date:</strong>{ " " }
                          { moment(clientData.created_at).format("DD/MM/YYYY") }
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                      {/* Client Info */ }
                      <div className="border p-2 rounded-lg">
                        <p>
                          <strong>BILL TO:</strong>{ " " }
                          { clientData.client_organization }
                        </p>
                        <p>
                          <strong>Name:</strong> { clientData?.client_name }
                        </p>

                        <p>
                          <strong>Contact:</strong> { clientData?.phone }
                        </p>
                        { clientData.client_gst_no && (
                          <p>
                            <strong>GST No:</strong> { clientData.client_gst_no }
                          </p>
                        ) }
                        { clientData.client_pan_no && (
                          <p>
                            <strong>PAN No:</strong> { clientData.client_pan_no }
                          </p>
                        ) }
                        { clientData.address && (
                          <p>
                            <strong>Address:</strong> { clientData.address }
                          </p>
                        ) }
                      </div>

                      {/* Company Info */ }
                      <div className="border p-2 rounded-lg">
                        <p>
                          <strong> FROM:</strong>{ " " }
                          { isGST
                            ? "DOAGuru InfoSystems"
                            : "DOAGuru IT Solutions" }
                        </p>
                        <p>
                          <strong>Email:</strong> info@doaguru.com
                        </p>
                        <p>
                          <strong>Phone:</strong> +91 74409 92424
                        </p>
                        { isGST ? (
                          <p>
                            <strong>GST No:</strong> 23AGLPP2890G1Z7
                          </p>
                        ) : (
                          <p>
                            <strong>Pan Card No:</strong> ASTPT3654Q
                          </p>
                        ) }
                        <p>
                          <strong>Address:</strong> 1815, Wright Town, Jabalpur
                        </p>
                      </div>
                    </div>

                    {/* ==================== COMBINED SERVICES TABLE ==================== */ }
                    { (graphicData.length > 0 ||
                      complimentaryData.length > 0 ||
                      additionalServiceData.length > 0 ||
                      adsData.length > 0) && (
                        <section className="mb-2 text-sm">
                          <table className="w-full border text-xs">
                            <thead style={{ background: "#e8edff", color: "#111827", fontSize: "11px" }}>
                              <tr>
                                <th style={{ border: "1px solid #cfd8e3", padding: "6px 7px", textAlign: "left" }} className="w-[10rem]">
                                  DM Service
                                </th>
                                <th style={{ border: "1px solid #cfd8e3", padding: "6px 7px", textAlign: "left" }} className="w-[20rem]">
                                  Service Name
                                </th>
                                <th style={{ border: "1px solid #cfd8e3", padding: "6px 7px", textAlign: "right" }}>
                                  Quantity
                                </th>
                                <th style={{ border: "1px solid #cfd8e3", padding: "6px 7px", textAlign: "right" }}>
                                  Price (₹)
                                </th>
                                <th style={{ border: "1px solid #cfd8e3", padding: "6px 7px", textAlign: "right" }}>
                                  Total (₹)
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              {/* ================= GRAPHIC SERVICES (Grouped by Service) ================= */ }
                              { graphicData.map((service, idx) =>
                                service.editingTypes.map((edit, eidx) => {
                                  const qty = Number(edit.quantity || 1);
                                  const base = Number(edit.price || 0);
                                  const totalBase = base * qty;

                                  return (
                                    <tr
                                      key={ `graphic-${idx}-${eidx}` }
                                      className="bg-white"
                                    >
                                      {/* Show DM Service name only once using rowspan */ }
                                      { eidx === 0 ? (
                                        <td
                                          className="border px-2 py-1 align-center"
                                          rowSpan={ service.editingTypes.length }
                                        >
                                          { service.service }
                                        </td>
                                      ) : null }

                                      <td className="border px-2 py-1">
                                        { service.service === "Video Services"
                                          ? `${edit.category} With ${edit.type}`
                                          : service.service === "Service Charge" && edit.type && edit.type.startsWith("Management")
                                            ? (`${edit.category && !edit.category.toLowerCase().includes("campaign") ? edit.category + " Campaign" : (edit.category || "")} ${edit.type}`.trim())
                                          : edit.type }
                                      </td>
                                      <td className="border px-2 py-1 text-right">
                                        { qty }
                                      </td>
                                      {totalBase === 0 ? (
                                        <td className="border px-2 py-1 text-center">
                                          <span className="line-through text-gray-400 text-xs">₹0</span>
                                          <span className="text-green-600 italic font-medium text-[10px] block">COMPLIMENTARY</span>
                                        </td>
                                      ) : (
                                        <td className="border px-2 py-1 text-right">
                                          ₹{base.toLocaleString()}
                                        </td>
                                      )}
                                      {totalBase === 0 ? (
                                        <td className="border px-2 py-1 text-center">
                                          <span className="line-through text-gray-400 text-xs">₹0</span>
                                          <span className="text-green-600 italic font-medium text-[10px] block">COMPLIMENTARY</span>
                                        </td>
                                      ) : (
                                        <td className="border px-2 py-1 text-right">
                                          ₹{totalBase.toLocaleString()}
                                        </td>
                                      )}
                                    </tr>
                                  );
                                })
                              ) }

                              {/* ================= THUMBNAIL CREATION TOTAL ================= */ }
                              { (() => {
                                const thumbEdits = graphicData.flatMap(
                                  (service) =>
                                    service.editingTypes.filter(
                                      (edit) =>
                                        Number(edit.include_thumbnail_creation) >
                                        0
                                    )
                                );
                                if (thumbEdits.length === 0) return null;

                                const totalThumbQty = thumbEdits.reduce(
                                  (sum, edit) => sum + Number(edit.quantity),
                                  0
                                );
                                const pricePerThumb =
                                  thumbEdits[0]?.include_thumbnail_creation || 0;
                                const totalThumbAmount = thumbEdits.reduce(
                                  (sum, edit) =>
                                    sum +
                                    Number(edit.include_thumbnail_creation) *
                                    Number(edit.quantity),
                                  0
                                );

                                return (
                                  <tr className="bg-gray-50">
                                    <td className="border px-2 py-1" colSpan={ 2 }>
                                      Thumbnail Creation Total
                                    </td>
                                    <td className="border px-2 py-1 text-right">
                                      { totalThumbQty }
                                    </td>
                                    <td className="border px-2 py-1 text-right">
                                      ₹{ pricePerThumb }
                                    </td>
                                    <td className="border px-2 py-1 text-right">
                                      ₹{ totalThumbAmount }
                                    </td>
                                  </tr>
                                );
                              })() }

                              {/* ================= CONTENT POSTING TOTAL ================= */ }
                              { (() => {
                                const postEdits = graphicData.flatMap((service) =>
                                  service.editingTypes.filter(
                                    (edit) =>
                                      Number(edit.include_content_posting) > 0
                                  )
                                );
                                if (postEdits.length === 0) return null;

                                const totalPostQty = postEdits.reduce(
                                  (sum, edit) => sum + Number(edit.quantity),
                                  0
                                );
                                const pricePerPost =
                                  postEdits[0]?.include_content_posting || 0;
                                const totalPostAmount = postEdits.reduce(
                                  (sum, edit) =>
                                    sum +
                                    Number(edit.include_content_posting) *
                                    Number(edit.quantity),
                                  0
                                );

                                return (
                                  <tr className="bg-gray-50">
                                    <td className="border px-2 py-1" colSpan={ 2 }>
                                      Meta Growth & Content Management Total
                                    </td>
                                    <td className="border px-2 py-1 text-right">
                                      { totalPostQty }
                                    </td>
                                    <td className="border px-2 py-1 text-right">
                                      ₹{ pricePerPost }
                                    </td>
                                    <td className="border px-2 py-1 text-right">
                                      ₹{ totalPostAmount }
                                    </td>
                                  </tr>
                                );
                              })() }

                              {/* ================= YOUTUBE VIDEO POSTING TOTAL ================= */ }
                              { (() => {
                                const ytEdits = graphicData.flatMap((service) =>
                                  service.editingTypes.filter(
                                    (edit) =>
                                      Number(edit.include_youtube_video_posting) > 0
                                  )
                                );
                                if (ytEdits.length === 0) return null;

                                const totalYtQty = ytEdits.reduce(
                                  (sum, edit) => sum + Number(edit.quantity),
                                  0
                                );
                                const pricePerYt =
                                  ytEdits[0]?.include_youtube_video_posting || 0;
                                const totalYtAmount = ytEdits.reduce(
                                  (sum, edit) =>
                                    sum +
                                    Number(edit.include_youtube_video_posting) *
                                    Number(edit.quantity),
                                  0
                                );

                                return (
                                  <tr className="bg-gray-50">
                                    <td className="border px-2 py-1" colSpan={ 2 }>
                                      YouTube Channel Growth & Optimization Total
                                    </td>
                                    <td className="border px-2 py-1 text-right">
                                      { totalYtQty }
                                    </td>
                                    <td className="border px-2 py-1 text-right">
                                      ₹{ pricePerYt }
                                    </td>
                                    <td className="border px-2 py-1 text-right">
                                      ₹{ totalYtAmount }
                                    </td>
                                  </tr>
                                );
                              })() }

                              {/* ================= ADDITIONAL SERVICES ================= */ }
                              { additionalServiceData.map((edit, eidx) => {
                                const qty = Number(edit.quantity || 1);
                                const base = Number(edit.editing_type_amount || edit.price || 0);
                                const totalBase = base * qty;

                                return (
                                  <tr key={ `add-${eidx}` } className="bg-white">
                                    { eidx === 0 ? (
                                      <td
                                        className="border px-2 py-1 align-top"
                                        rowSpan={ additionalServiceData.length }
                                      >
                                        <div className="flex items-center gap-2">
                                          <span>Additional Service</span>
                                          { clientData.tag_received_amt !== "received" && (
                                            <button
                                              onClick={ () => navigate(`/BD/discount-setting/${id}/${txn_id}`) }
                                              className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded whitespace-nowrap transition"
                                              title="Edit Discount"
                                            >
                                              💰 Discount
                                            </button>
                                          ) }
                                        </div>
                                      </td>
                                    ) : null }
                                    <td className="border px-2 py-1">
                                      { edit.editing_type_name }
                                    </td>
                                    <td className="border  py-1 text-right">
                                      { qty }
                                    </td>
                                    {totalBase === 0 ? (
                                      <td className="border px-2 py-1 text-center">
                                        <span className="line-through text-gray-400 text-xs">₹0</span>
                                        <span className="text-green-600 italic font-medium text-[10px] block">COMPLIMENTARY</span>
                                      </td>
                                    ) : (
                                      <td className="border px-2 py-1 text-right">
                                        ₹{base.toLocaleString()}
                                      </td>
                                    )}
                                    {totalBase === 0 ? (
                                      <td className="border px-2 py-1 text-center">
                                        <span className="line-through text-gray-400 text-xs">₹0</span>
                                        <span className="text-green-600 italic font-medium text-[10px] block">COMPLIMENTARY</span>
                                      </td>
                                    ) : (
                                      <td className="border px-2 py-1 text-right">
                                        ₹{totalBase.toLocaleString()}
                                      </td>
                                    )}
                                    { clientData.tag_received_amt !==
                                      "received" && (
                                        <td className="border px-2 py-1 text-right print:hidden">
                                          <div className="flex gap-1">
                                            <button
                                              onClick={ () => handleEdit(edit) }
                                              className="bg-red-600 hover:bg-red-700 text-white rounded w-6 h-6 flex items-center justify-center text-xs"
                                              title="Edit"
                                            >
                                              ✎{ " " }
                                            </button>{ " " }
                                            <button
                                              onClick={ () => handleDelete(edit.id) }
                                              className="bg-red-600 hover:bg-red-700 text-white rounded w-6 h-6 flex items-center justify-center text-xs"
                                              title="Delete"
                                            >
                                              ×{ " " }
                                            </button>{ " " }
                                          </div>{ " " }
                                        </td>
                                      ) }
                                  </tr>
                                );
                              }) }

                              {/* ================= DM SERVICE TOTAL ================= */ }
                              { (() => {
                                const graphicTotal = graphicData.reduce(
                                  (sum, service) =>
                                    sum +
                                    service.editingTypes.reduce(
                                      (s, edit) =>
                                        s +
                                        (Number(edit.price || 0) *
                                        Number(edit.quantity || 1)),
                                      0
                                    ),
                                  0
                                );
                                const thumbTotal = graphicData
                                  .flatMap((s) =>
                                    s.editingTypes.filter(
                                      (e) =>
                                        Number(e.include_thumbnail_creation) > 0
                                    )
                                  )
                                  .reduce(
                                    (sum, e) =>
                                      sum +
                                      Number(e.include_thumbnail_creation) *
                                      Number(e.quantity),
                                    0
                                  );
                                const postTotal = graphicData
                                  .flatMap((s) =>
                                    s.editingTypes.filter(
                                      (e) => Number(e.include_content_posting) > 0
                                    )
                                  )
                                  .reduce(
                                    (sum, e) =>
                                      sum +
                                      Number(e.include_content_posting) *
                                      Number(e.quantity),
                                    0
                                  );
                                const addTotal = additionalServiceData.reduce(
                                  (sum, e) =>
                                    sum +
                                    (Number(e.editing_type_amount || e.price || 0) *
                                    Number(e.quantity || 1)),
                                  0
                                );

                                const ytTotal = graphicData
                                  .flatMap((s) =>
                                    s.editingTypes.filter(
                                      (e) => Number(e.include_youtube_video_posting) > 0
                                    )
                                  )
                                  .reduce(
                                    (sum, e) =>
                                      sum +
                                      Number(e.include_youtube_video_posting) *
                                      Number(e.quantity),
                                    0
                                  );

                                const dmServiceTotal = graphicTotal + thumbTotal + postTotal + ytTotal + addTotal;

                                return (
                                  <>

                              {/* ================= COMPLIMENTARY ITEMS ================= */}
                              {complimentaryData.length > 0 &&
                                complimentaryData.map((svc, idx) => {
                                  const qty = Number(svc.quantity || 1);
                                  const price = Number(
                                    svc.editing_type_amount ||
                                    svc.amount ||
                                    svc.price || 0
                                  );
                                  const svcName = svc.editing_type_name ||
                                                  svc.service_name || "N/A";

                                  return (
                                    <tr key={`comp-main-${idx}`}
                                        style={{backgroundColor: "#dcf7e8"}}>
                                      <td className="border px-2 py-1 text-center">
                                        <span style={{
                                          background: "#fef2f2",
                                          color: "#dc2626",
                                          fontWeight: "bold",
                                          fontSize: "10px",
                                          padding: "1px 5px",
                                          borderRadius: "4px"
                                        }}>FREE</span>
                                      </td>
                                      <td className="border px-2 py-1">
                                        <span style={{color: "#047968", fontWeight: "600"}}>
                                          {svcName}
                                        </span>
                                        <span style={{
                                          color: "#6b7280",
                                          fontStyle: "italic",
                                          fontSize: "10px"
                                        }}> (Complementary)</span>
                                      </td>
                                      <td className="border px-2 py-1 text-right">
                                        {qty}
                                      </td>
                                      <td className="border px-2 py-1 text-right">
                                        <span style={{
                                          textDecoration: "line-through",
                                          color: "#9ca3af"
                                        }}>
                                          ₹{Number(price || 0).toLocaleString()}
                                        </span>
                                      </td>
                                      <td className="border px-2 py-1 text-right"
                                          style={{fontWeight: "bold", color: "#047968"}}>
                                        ₹0
                                      </td>
                                    </tr>
                                  );
                                })
                              }

                                  <tr style={{ background: "#f5f8fc", fontWeight: 800, border: "1px solid #cfd8e3" }}>
                                    <td
                                      className="border px-2 py-1 text-right"
                                      colSpan={ 4 }
                                    >
                                      DM Service Total
                                    </td>
                                    <td className="border px-2 py-1 text-right">
                                      ₹
                                      { dmServiceTotal.toFixed(0).toLocaleString() }
                                    </td>
                                  </tr>
                                  </>
                                );
                              })() }
                              {/* ================= COMPLIMENTARY SERVICES ================= */ }
                              { false && complimentaryData.length > 0 && (
                                <>
                                  {/* Complimentary Services + Totals */ }
                                  { (() => {
                                    // ✅ Totals inside Complimentary Service
                                    const thumbEdits = complimentaryData.filter(
                                      (item) =>
                                        Number(item.include_thumbnail_creation) >
                                        0
                                    );
                                    const postEdits = complimentaryData.filter(
                                      (item) =>
                                        Number(item.include_content_posting) > 0
                                    );

                                    const totalThumbQty = thumbEdits.reduce(
                                      (sum, item) => sum + Number(item.quantity),
                                      0
                                    );
                                    const pricePerThumb =
                                      thumbEdits[0]?.include_thumbnail_creation ||
                                      0;
                                    const totalThumbAmount = thumbEdits.reduce(
                                      (sum, item) =>
                                        sum +
                                        Number(item.include_thumbnail_creation) *
                                        Number(item.quantity),
                                      0
                                    );

                                    const totalPostQty = postEdits.reduce(
                                      (sum, item) => sum + Number(item.quantity),
                                      0
                                    );
                                    const pricePerPost =
                                      postEdits[0]?.include_content_posting || 0;
                                    const totalPostAmount = postEdits.reduce(
                                      (sum, item) =>
                                        sum +
                                        Number(item.include_content_posting) *
                                        Number(item.quantity),
                                      0
                                    );

                                    return (
                                      <>
                                        { complimentaryData.map((edit, eidx) => {
                                          const qty = Number(edit.quantity);
                                          const base = Number(
                                            edit.editing_type_amount
                                          );
                                          const totalBase = base * qty;

                                          return (
                                            <tr
                                              key={ `compl-${eidx}` }
                                              className="bg-gray-50"
                                            >
                                              { eidx === 0 && (
                                                <td
                                                  className="border px-2 py-1 align-center"
                                                  rowSpan={
                                                    complimentaryData.length +
                                                    (thumbEdits.length > 0
                                                      ? 1
                                                      : 0) +
                                                    (postEdits.length > 0 ? 1 : 0) +
                                                    (complimentaryData.some(item => Number(item.include_youtube_video_posting) > 0) ? 1 : 0)
                                                  }
                                                >
                                                  Complimentary Service
                                                </td>
                                              ) }
                                              <td className="border px-2 py-1">
                                                { edit.editing_type_name }
                                              </td>
                                              <td className="border px-2 py-1 text-right">
                                                { qty }
                                              </td>
                                              <td className="border px-2 py-1 text-right">
                                                ₹{ base }
                                              </td>
                                              <td className="border px-2 py-1 text-right">
                                                ₹{ totalBase }
                                              </td>
                                            </tr>
                                          );
                                        }) }

                                        {/* ✅ Thumbnail Creation Total inside Complimentary Service */ }
                                        { thumbEdits.length > 0 && (
                                          <tr className="bg-gray-50">
                                            <td
                                              className="border px-2 py-1"
                                              colSpan={ 0 }
                                            >
                                              Thumbnail Creation Total
                                            </td>
                                            <td className="border px-2 py-1 text-right">
                                              { totalThumbQty }
                                            </td>
                                            <td className="border px-2 py-1 text-right">
                                              ₹{ pricePerThumb.toLocaleString() }
                                            </td>
                                            <td className="border px-2 py-1 text-right">
                                              ₹{ totalThumbAmount.toLocaleString() }
                                            </td>
                                          </tr>
                                        ) }

                                        {/* ✅ Content Posting Total inside Complimentary Service */ }
                                        { postEdits.length > 0 && (
                                          <tr className="bg-gray-50">
                                            <td
                                              className="border px-2 py-1"
                                              colSpan={ 0 }
                                            >
                                              Meta Growth & Content Management Total
                                            </td>
                                            <td className="border px-2 py-1 text-right">
                                              { totalPostQty }
                                            </td>
                                            <td className="border px-2 py-1 text-right">
                                              ₹{ pricePerPost.toLocaleString() }
                                            </td>
                                            <td className="border px-2 py-1 text-right">
                                              ₹{ totalPostAmount.toLocaleString() }
                                            </td>
                                          </tr>
                                        ) }

                                        {/* ✅ YouTube Video Posting Total inside Complimentary Service */ }
                                        { (() => {
                                          const ytEdits = complimentaryData.filter(
                                            (item) =>
                                              Number(item.include_youtube_video_posting) > 0
                                          );
                                          if (ytEdits.length === 0) return null;

                                          const totalYtQty = ytEdits.reduce(
                                            (sum, item) => sum + Number(item.quantity),
                                            0
                                          );
                                          const pricePerYt =
                                            Number(ytEdits[0].include_youtube_video_posting) || 0;
                                          const totalYtAmount = ytEdits.reduce(
                                            (sum, item) =>
                                              sum +
                                              Number(item.include_youtube_video_posting) *
                                              Number(item.quantity),
                                            0
                                          );

                                          return (
                                            <tr className="bg-gray-50">
                                              <td
                                                className="border px-2 py-1"
                                                colSpan={ 0 }
                                              >
                                                YouTube Channel Growth & Optimization Total
                                              </td>
                                              <td className="border px-2 py-1 text-right">
                                                { totalYtQty }
                                              </td>
                                              <td className="border px-2 py-1 text-right">
                                                ₹{ pricePerYt.toLocaleString() }
                                              </td>
                                              <td className="border px-2 py-1 text-right">
                                                ₹{ totalYtAmount.toLocaleString() }
                                              </td>
                                            </tr>
                                          );
                                        })() }
                                      </>
                                    );
                                  })() }
                                </>
                              ) }

                              { false && complimentaryData.length > 0 ? (
                                <>
                                  <tr className=" font-semibold">
                                    <td
                                      className="border px-2 py-1 text-right"
                                      colSpan={ 4 }
                                    >
                                      Total
                                    </td>
                                    <td className="border px-2 py-1 text-right">
                                      ₹{ complimentaryTotal }
                                    </td>
                                  </tr>

                                  { (() => {
                                    const complimentaryTotal =
                                      complimentaryData.reduce(
                                        (sum, e) =>
                                          sum +
                                          Number(e.editing_type_amount) *
                                          Number(e.quantity),
                                        0
                                      );

                                    return (
                                      <tr className=" font-semibold">
                                        <td
                                          className="border px-2 py-1 text-right"
                                          colSpan={ 4 }
                                        >
                                          Complimentary Total
                                        </td>
                                        <td className="border px-2 py-1 text-right">
                                          ₹0
                                        </td>
                                      </tr>
                                    );
                                  })() }
                                </>
                              ) : null }

                              {/* ================= DM SERVICE TOTAL ================= */ }
                              { (() => {
                                const graphicTotal = graphicData.reduce(
                                  (sum, service) => {
                                    return (
                                      sum +
                                      service.editingTypes.reduce(
                                        (s, edit) =>
                                          s +
                                          Number(edit.price) *
                                          Number(edit.quantity),
                                        0
                                      )
                                    );
                                  },
                                  0
                                );

                                const thumbTotal = graphicData
                                  .flatMap((s) =>
                                    s.editingTypes.filter(
                                      (e) =>
                                        Number(e.include_thumbnail_creation) > 0
                                    )
                                  )
                                  .reduce(
                                    (sum, e) =>
                                      sum +
                                      Number(e.include_thumbnail_creation) *
                                      Number(e.quantity),
                                    0
                                  );

                                const postTotal = graphicData
                                  .flatMap((s) =>
                                    s.editingTypes.filter(
                                      (e) => Number(e.include_content_posting) > 0
                                    )
                                  )
                                  .reduce(
                                    (sum, e) =>
                                      sum +
                                      Number(e.include_content_posting) *
                                      Number(e.quantity),
                                    0
                                  );

                                const addTotal = additionalServiceData.reduce(
                                  (sum, e) =>
                                    sum +
                                    Number(e.editing_type_amount) *
                                    Number(e.quantity),
                                  0
                                );

                                const dmServiceTotal = graphicTotal + thumbTotal + postTotal + addTotal;

                                return (
                                  <tr className="bg-orange-50 font-semibold">
                                    <td
                                      className="border px-2 py-1 text-right"
                                      colSpan={ 4 }
                                    >
                                      Subtotal
                                    </td>
                                    <td className="border px-2 py-1 text-right">
                                      ₹
                                      { invoiceSubtotal.toLocaleString("en-IN", {
                                        maximumFractionDigits: 0,
                                      }) }
                                    </td>
                                  </tr>
                                );
                              })() }
                            </tbody>
                          </table>
                        </section>
                      ) }

                      {/* ================= COMPLIMENTARY SERVICES TABLE ================= */}
                      { complimentaryData.length > 0 && (
                        <section className="mb-2 text-sm mt-4">
                          <table className="w-full border text-xs">
                            <thead className="bg-green-100">
                              <tr>
                                <th className="border px-2 py-1 text-left w-[10rem] text-green-900 font-bold">Complimentary Service</th>
                                <th className="border px-2 py-1 text-left w-[20rem] text-green-900 font-bold">Service Name</th>
                                <th className="border px-2 py-1 text-right text-green-900 font-bold">Qty</th>
                                <th className="border px-2 py-1 text-right text-green-900 font-bold">Price (₹)</th>
                                <th className="border px-2 py-1 text-right text-green-900 font-bold">Total (₹)</th>
                              </tr>
                            </thead>
                            <tbody>
                              { complimentaryData.map((svc, idx) => {
                                const qty = Number(svc.quantity || 1);
                                const price = Number(svc.editing_type_amount || svc.amount || 0);
                                return (
                                  <tr key={`comp-${idx}`} className="bg-white">
                                    <td className="border px-2 py-1 font-medium">{(svc.service_name && svc.service_name.toLowerCase() === "proposal item") ? (svc.category_name || svc.service_name) : (svc.service_name || svc.category_name || "N/A")}</td>
                                    <td className="border px-2 py-1">{(svc.editing_type_name && svc.editing_type_name.toLowerCase() === "proposal item") ? (svc.service || svc.category_name || svc.editing_type_name) : (svc.editing_type_name || svc.service_type || "N/A")}</td>
                                    <td className="border px-2 py-1 text-right">{qty}</td>
                                    <td className="border px-2 py-1 text-right">₹{price.toLocaleString("en-IN")}</td>
                                    <td className="border px-2 py-1 text-right">₹{(price * qty).toLocaleString("en-IN")}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr className="bg-green-50">
                                <td colSpan={4} className="border px-2 py-1 text-right font-semibold">Total</td>
                                <td className="border px-2 py-1 text-right font-semibold">
                                  ₹{complimentaryData.reduce((sum, svc) => sum + (Number(svc.editing_type_amount || svc.amount || 0) * Number(svc.quantity || 1)), 0).toLocaleString("en-IN")}
                                </td>
                              </tr>
                              <tr className="bg-green-100 font-bold">
                                <td colSpan={4} className="border px-2 py-1 text-right text-green-900">Complimentary Total (Free)</td>
                                <td className="border px-2 py-1 text-right text-green-900">₹0</td>
                              </tr>
                            </tfoot>
                          </table>
                        </section>
                      )}

                    { clientData.tag_received_amt === "pending" && (
                      <div className="print:hidden">
                        <button
                          onClick={ handleShow }
                          className="px-2 py-1 print:hidden mb-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-xs"
                        >
                          + Additional Service
                        </button>

                        <button
                          onClick={ handleShowDiscount }
                          className="px-2 py-1 mx-1 print:hidden mb-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs"
                        >
                          + Discount
                        </button>
                      </div>
                    ) }
                  </div>
                </div>
                { clientData.tag_received_amt === "received" ? null : (
                  <div className="space-y-2 print:hidden p-1">
                    {/* Predefined Notes Dropdown */ }
                    <div className="relative w-full" ref={ dropdownRef }>
                      <div
                        className={ `flex items-center justify-between w-full px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${ isOpen ? 'bg-gradient-to-r from-orange-500 to-red-500 border-orange-400 text-white shadow-lg shadow-orange-200' : 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 text-orange-700 hover:border-orange-400 hover:shadow-md hover:shadow-orange-100' }` }
                        onClick={ () => setIsOpen(!isOpen) }
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={ `text-lg flex-shrink-0 ${ isOpen ? 'opacity-100' : 'opacity-70' }` }>📋</span>
                          <span className={ `truncate text-sm font-medium ${ isOpen ? 'text-white' : ( !selectedNote ? 'text-orange-400 italic' : 'text-orange-800' ) }` }>
                            { selectedNote ? selectedNote.note_text : "Select a predefined note to add..." }
                          </span>
                        </div>
                        <div className={ `flex-shrink-0 ml-2 w-6 h-6 rounded-full flex items-center justify-center ${ isOpen ? 'bg-white/20' : 'bg-orange-100' }` }>
                          { isOpen ? (
                            <ChevronUp className="w-3.5 h-3.5 text-white" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-orange-500" />
                          ) }
                        </div>
                      </div>

                      { isOpen && (
                        <div className="absolute z-20 bg-white w-full mt-1.5 max-h-52 overflow-auto rounded-xl border border-orange-100 shadow-xl shadow-orange-100">
                          { uniquePredefinedNotes.length === 0 ? (
                            <div className="p-4 text-sm text-orange-400 text-center">
                              <span className="text-2xl block mb-1">✅</span>
                              All notes are already added
                            </div>
                          ) : (
                            uniquePredefinedNotes.map((note, idx) => (
                              <div
                                key={ note.id }
                                onClick={ () => handleSelect(note) }
                                className={ `px-4 py-2.5 text-sm text-gray-700 cursor-pointer transition-all duration-150 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 hover:text-orange-700 ${ idx !== uniquePredefinedNotes.length - 1 ? 'border-b border-gray-100' : '' }` }
                              >
                                <span className="text-orange-300 mr-2 font-bold">›</span>
                                { note.note_text }
                              </div>
                            ))
                          ) }
                        </div>
                      ) }
                    </div>

                    {/* Manual Note Input */ }
                    <div className="flex flex-wrap gap-2">
                      <textarea
                        type="text"
                        value={ manualNote }
                        onChange={ (e) => setManualNote(e.target.value) }
                        placeholder="Enter custom note"
                        rows={ 1 }
                        className="flex-1 p-2 rounded-lg border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <button
                        onClick={ handleAddManualNote }
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
                      >
                        + Add
                      </button>
                    </div>

                    {/* Selected Notes List */ }
                    <div className="space-y-2">
                      { selectedNotes.map((note) => (
                        <div
                          key={ note.id }
                          className="p-3 bg-gray-100 rounded-lg gap-5 flex justify-between items-center border border-gray-300"
                        >
                          <span className="text-gray-800 font-medium">
                            { note.note_name }
                          </span>
                          <div className="">
                            <button
                              onClick={ () => handleRemoveNote(note.id) }
                              className="bg-red-500 mx-2 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold transition"
                              title="Remove"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      )) }
                    </div>

                    {/* Save Button */ }
                    <button
                      onClick={ handleSaveNotes }
                      className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                    >
                      💾 Save Notes
                    </button>
                  </div>
                ) }

                {/* Terms & Conditions + Bank Details Section */ }
                <section className={ `terms-bank-section print:block p-2 text-sm text-gray-800 border-t pt-2 mt-2` }>

                  {/* 1. FIRST: Bank Details (Left) & Totals (Right) */ }
                  <div className={ `bank-details-section flex justify-between w-full mb-2` }>

                    {/* LEFT SIDE: Bank Details */ }
                    <div className="w-1/2 pr-3">
                      <h2 className="font-bold mb-0.5 text-gray-800">
                        Bank Details:
                      </h2>
                      { isGST ? (
                        <ul className="space-y-0.5 text-gray-700">
                          <li><span className="font-semibold">Name:</span> DOAGuru InfoSystems</li>
                          <li><span className="font-semibold">IFSC:</span> SBIN0004677</li>
                          <li><span className="font-semibold">Account No:</span> 38666325192</li>
                          <li><span className="font-semibold">Bank:</span> SBI Bank, Jabalpur</li>
                        </ul>
                      ) : (
                        <ul className="space-y-0.5 text-gray-700">
                          <li><span className="font-semibold">Name:</span> DOAGuru IT Solutions</li>
                          <li><span className="font-semibold">IFSC:</span> HDFC0000224</li>
                          <li><span className="font-semibold">Account No:</span> 50200074931981</li>
                          <li><span className="font-semibold">Bank:</span> HDFC Bank, Jabalpur</li>
                        </ul>
                      ) }
                       {/* Signature */ }
                      <div className="mt-3 text-center border border-gray-400 rounded-md p-0.5 inline-block ml-auto">
                        <img
                          src={ isGST ? img4 : img3 }
                          alt="Authorized Signature"
                          className="mx-auto h-[40px] w-[100px] min-w-[30px] max-w-none object-contain"
                        />
                        <p className="text-xs font-semibold text-gray-800">Signature</p>
                        <p className="text-xs text-gray-700">
                          { isGST ? "DOAGuru InfoSystems" : "DOAGuru IT Solutions" }
                        </p>
                      </div>
                    </div>

                    {/* RIGHT SIDE: Totals, GST, Signature */ }
                    <div className="w-1/2 pl-3 text-right border-l border-gray-200">
                      {/* GST Breakdown */ }
                      { isGST && (
                        <div className="space-y-0.5 text-gray-700">
                          <p>Taxable Amount ₹ { totalAfterDiscount.toFixed(0).toLocaleString() }</p>
                          <p>CGST @9% ₹ { (gstAmount / 2).toFixed(2) }</p>
                          <p>SGST @9% ₹ { (gstAmount / 2).toFixed(2) }</p>
                          <p className="font-bold text-gray-900 border-t border-gray-200 mt-1 pt-1">
                            Total Billed Amount (Inc GST) ₹ { currentAmtPreviousAmt.toFixed(0).toLocaleString() }
                          </p>
                        </div>
                      ) }

                      {/* Totals */ }
                      <div className="mt-1 p-3 border-t space-y-0.5 text-gray-800 font-medium">
                        {/* { selecteddiscount && (
                          <p>
                            <span className="font-semibold">Total Amount:</span> ₹ { grandTotalAds.toLocaleString() }
                          </p>
                        ) } */}
                        { selecteddiscount && (
                          <p className="text-red-600 text-sm">
                            { selecteddiscount.discount_type === "percent"
                              ? `Discount (%): -${selecteddiscount.discount_per}`
                              : `Discount (₹): -${Number(selecteddiscount.discount_amt).toLocaleString()}` }
                          </p>
                        ) }
                        { selecteddiscount && (
                          <p className="text-green-600">
                            <span className="font-semibold">After { selecteddiscount.discount_type === "percent" ? `${selecteddiscount.discount_per}%` : `₹${selecteddiscount.discount_amt}` } Discount:</span> ₹ { totalAfterDiscount.toLocaleString() }
                          </p>
                        ) }
                        { !selecteddiscount && (
                          <p>
                            <span className="font-semibold ">Invoice Total:</span> ₹ { currentAmtPreviousAmt.toFixed(0).toLocaleString() }
                          </p>
                        ) }

                        {/* NEW: Explicit breakdown for Proposal Invoices */ }
                        { (clientData?.invoice_source === "proposal" || isProforma) ? (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-sm font-semibold text-gray-600 mb-1">Payment Summary</p>
                            <div className="space-y-0.5 text-sm text-gray-700">
                              <div className="flex justify-between mt-2 pt-1 border-t border-dashed border-gray-300">
                                <span>Service Payment Received (Base + GST)</span>
                                <span>₹ { (Number(clientData.received_amt || 0) - visibleAdBudget).toLocaleString() }</span>
                              </div>
                              { realizedGoogleBudget > 0 && (
                                <div className="flex justify-between">
                                  <span>Google Ad Budget Reimbursed</span>
                                  <span>₹ { realizedGoogleBudget.toLocaleString() }</span>
                                </div>
                              ) }
                              { realizedMetaBudget > 0 && (
                                <div className="flex justify-between">
                                  <span>Meta Ad Budget Reimbursed</span>
                                  <span>₹ { realizedMetaBudget.toLocaleString() }</span>
                                </div>
                              ) }
                              <div className="flex justify-between mt-1 pt-1 border-t border-dashed border-gray-300 font-semibold">
                                <span>Gross Payments Received (Now)</span>
                                <span>₹ { Number(clientData.received_amt || 0).toLocaleString() }</span>
                              </div>
                              { Number(clientData.tds_amount || 0) > 0 && (
                                <div className="flex justify-between text-orange-600">
                                  <span>Less: TDS Deducted</span>
                                  <span>₹ { Number(clientData.tds_amount).toLocaleString() }</span>
                                </div>
                              ) }
                              <div className="flex justify-between font-extrabold text-yellow-700 mt-1 pt-1 border-t border-gray-300">
                                <span>Net Amount Credited to Bank</span>
                                <span>₹ { (Number(clientData.received_amt || 0) - Number(clientData.tds_amount || 0)).toLocaleString() }</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Legacy Flow Display */
                          <>
                            { clientData.received_amt && clientData.tag_received_amt !== "received" && (
                              <>
                                { Number(clientData.tds_amount || 0) > 0 && (
                                  <p className="text-orange-600">TDS Deducted ₹ { Number(clientData.tds_amount).toLocaleString() }</p>
                                ) }
                                <p>Received Amount ₹ { Number(clientData.received_amt || 0).toLocaleString() }</p>
                                <p>Current Balance ₹ { Number(clientData.current_amt || 0).toFixed(0).toLocaleString() }</p>
                              </>
                            ) }

                            { clientData.received_amt && clientData.tag_received_amt === "received" && (
                              <>
                                { Number(clientData.tds_amount || 0) > 0 && (
                                  <p className="text-orange-600">TDS Deducted ₹ { Number(clientData.tds_amount).toLocaleString() }</p>
                                ) }
                                <p>Received Amount ₹ { Number(clientData.received_amt || 0).toLocaleString() }</p>
                                <p>Current Balance ₹ { Number(clientData.current_amt || 0).toFixed(0).toLocaleString() }</p>
                              </>
                            ) }

                            { clientData.tag_received_amt === "pending" && (
                              <>
                                { Number(clientData.tds_amount || 0) > 0 && (
                                  <p className="text-orange-600">TDS Deducted ₹ { Number(clientData.tds_amount).toLocaleString() }</p>
                                ) }
                                <p className="border-t font-extrabold text-lg text-green-800 pt-1 mt-1">
                                  Current Balance ₹ { currentTotalAmount.toFixed(0).toLocaleString() }
                                </p>
                              </>
                            ) }
                          </>
                        ) }
                      </div>

                      {/* Total in Words */ }
                      <p className="mt-0.5 italic border-t pt-1 text-gray-700 text-sm leading-snug">
                        Total Amount (in words): <br />
                        <span className="font-medium capitalize">{ amountInWords }</span>
                      </p>

                     
                    </div>
                  </div>

                  {/* 2. SECOND: Terms & Conditions (NEECHE) */ }
                  { (notesData?.length > 0 || visibleAdBudget > 0 || Number(clientData?.tds_amount || 0) > 0 || Number(clientData?.previous_amt || 0) > 0) && (
                    <div className="terms-conditions-section w-full text-left pt-2 border-t border-gray-300">
                      <h2 className="font-bold mb-1 text-gray-800">
                        Terms &amp; Conditions
                      </h2>
                      <ul className="list-decimal ml-5 space-y-0.5 text-gray-700">
                        { notesData?.map((note) => (
                          <li key={ note.id } className="leading-snug">
                            { note.note_name }
                            { clientData.tag_received_amt === "received" ? null : (
                              <div className="flex items-center gap-1 sm:gap-2 print:hidden">
                                <button
                                  onClick={ (e) => {
                                    e.stopPropagation();
                                    setSelectedNotesId(note);
                                    setFormDataNote({
                                      note_name: note.note_name,
                                      plan: note.plan,
                                    });
                                    setIsEditing(true);
                                    setShowModal(true);
                                  } }
                                  className="bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mt-1"
                                  title="Edit"
                                >
                                  ✎
                                </button>
                                <button
                                  onClick={ () => handleDeleteClientNote(note.id) }
                                  className="bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mt-1"
                                  title="Delete"
                                >
                                  ×
                                </button>
                              </div>
                            ) }
                          </li>
                        )) }
                        { visibleAdBudget > 0 && (() => {
                            let platforms = [];
                            if (adsData.some(ad => (ad.category_name||"").toLowerCase().includes("google"))) platforms.push("Google LLC");
                            if (adsData.some(ad => (ad.category_name||"").toLowerCase().includes("meta"))) platforms.push("Meta Platforms Inc.");
                            const platformNames = platforms.length > 0 ? platforms.join(" and/or ") : "Google LLC and/or Meta Platforms Inc.";
                            const shortNames = platforms.length > 0 ? platforms.map(p => p.split(" ")[0]).join(" and ") : "Google and Meta";
                            
                            return (
                              <li className="leading-relaxed mt-1 text-gray-700">
                                The Ad Budget of <strong>₹{visibleAdBudget.toLocaleString()}</strong> is a direct pass-through payment made to {platformNames} on your behalf. It is not revenue of DOAGuru InfoSystems. Ad performance and platform policies remain the responsibility of {shortNames}.
                              </li>
                            );
                        })() }
                        { Number(clientData?.tds_amount || 0) > 0 && (() => {
                            const tdsAmt = Number(clientData.tds_amount);
                            const tdsPercent = (tdsAmt / totalAfterDiscount * 100).toFixed(1);
                            return (
                              <li className="leading-relaxed mt-1 text-gray-700">
                                TDS @ <strong>{tdsPercent.replace(".0", "")}%</strong> amounting to <strong>₹{tdsAmt.toLocaleString()}</strong> has been deducted on the taxable service value of <strong>₹{totalAfterDiscount.toLocaleString()}</strong> (excluding GST and Ad Budget) under the Income Tax Act, 1961. Please deposit the TDS against PAN <strong>AGLPP2890G</strong> and issue Form 16A.
                              </li>
                            );
                        })() }
                        { Number(clientData?.previous_amt || 0) > 0 && (
                          <li className="leading-relaxed mt-1 text-gray-700">
                            This invoice is in continuation of Invoice No. <strong>[PREVIOUS_INVOICE_NO]</strong> dated <strong>[PREVIOUS_INVOICE_DATE]</strong>. Payment of <strong>₹{Number(clientData.previous_amt).toLocaleString()}</strong> has already been received. This invoice covers the remaining outstanding balance.
                          </li>
                        ) }
                      </ul>
                    </div>
                  ) }

                </section>
                <div className="border-t mt-0"></div>

              </td>
            </tr>
          </tbody>

          {/* NAYA CODE: Empty Tfoot to reserve space for fixed footer on every page */ }
          <tfoot className="print:table-footer-group">
            <tr>
              <td className="p-0 m-0">
                <div className="h-[20mm] w-full"></div>
              </td>
            </tr>
          </tfoot>
        </table>

        <div className="hidden print:flex print-fixed-footer">
          <img
            src={ img2 }
            alt="Footer"
            className="h-full w-full object-fill"
          />
        </div>


        { showModalAddition && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */ }
            <div
              className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
              onClick={ handleCloseAddition }
            />

            {/* Modal */ }
            <div className="relative bg-white w-full max-w-md rounded-xl shadow-2xl transform transition-all animate-in fade-in-0 zoom-in-95 duration-200">
              {/* Header */ }
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-red-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    { isEditingAddition
                      ? "Edit Additional Detail"
                      : "Add Additional Detail" }
                  </h2>
                </div>
                <button
                  onClick={ handleCloseAddition }
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mx-2 mt-2">
                <button
                  className=" px-4 py-1 float-end bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition"
                  onClick={ resetForm }
                >
                  <RefreshCcw />
                </button>
              </div>
              {/* Form */ }
              <form onSubmit={ handleSave } className="p-6 space-y-4">
                <div>
                  <label className="block font-semibold mb-1">
                    Select Service
                  </label>
                  <select
                    className="w-full p-2 border rounded bg-white text-black"
                    value={ selectedService }
                    onChange={ (e) => {
                      setSelectedService(e.target.value);
                      setSelectedCategory("");
                      setSelectedEditingType(null);
                    } }
                    disabled={ !!isEditingAddition }
                  >
                    <option value="">-- Choose Service --</option>
                    { data.map((service) => (
                      <option
                        key={ service.service_id }
                        value={ service.service_name }
                      >
                        { service.service_name }
                      </option>
                    )) }
                  </select>
                </div>

                <div>
                  { getSelectedService && (
                    <div>
                      <label className="block font-semibold mb-1">
                        Select Category
                      </label>
                      <select
                        className="w-full p-2 border rounded bg-white text-black"
                        value={ selectedCategory }
                        onChange={ (e) => {
                          setSelectedCategory(e.target.value);
                          setSelectedEditingType(null);
                        } }
                        disabled={ !!isEditingAddition }
                      >
                        <option value="">-- Choose Category --</option>
                        { getSelectedService.categories.map((category) => (
                          <option
                            key={ category.category_id }
                            value={ category.category_name }
                          >
                            { category.category_name }
                          </option>
                        )) }
                      </select>
                    </div>
                  ) }
                </div>
                <div>
                  { getSelectedCategory && (
                    <div>
                      <label className="block font-semibold mb-1">
                        Select Editing Type
                      </label>
                      <select
                        className="w-full p-2 border rounded bg-white text-black"
                        value={ selectedEditingType?.editing_type_id || "" }
                        onChange={ (e) => {
                          const edit = getSelectedCategory.editing_types.find(
                            (et) =>
                              et.editing_type_id === parseInt(e.target.value)
                          );
                          setSelectedEditingType(edit);
                        } }
                        disabled={ !!isEditingAddition }
                      >
                        <option value="">-- Choose Editing Type --</option>
                        { getSelectedCategory.editing_types.map((edit) => (
                          <option
                            key={ edit.editing_type_id }
                            value={ edit.editing_type_id }
                          >
                            { edit.editing_type_name } - ₹{ edit.amount }
                          </option>
                        )) }
                      </select>
                    </div>
                  ) }
                </div>

                <div>
                  <label className="block font-semibold mb-1">Quantity</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded bg-white text-black"
                    min={ 1 }
                    value={ quantity }
                    onChange={ (e) => setQuantity(parseInt(e.target.value)) }
                  />
                </div>

                { selectedService === "Video Services" &&
                  optionalServices?.length > 0 && (
                    <div className="space-y-4">
                      { optionalServices.map((opt) => {
                        const key = opt.editing_type_name
                          .toLowerCase()
                          .replace(/\s+/g, "_");

                        return (
                          <div key={ key }>
                            <label className="block font-semibold">
                              { opt.editing_type_name }?
                            </label>
                            <div className="flex gap-4 mt-2">
                              <button
                                type="button"
                                disabled={ isEditingAddition } // ✅ disable when editing
                                className={ `px-4 py-2 rounded ${addons[key]
                                  ? "bg-green-600 text-white"
                                  : "bg-gray-300 text-black"
                                  } ${isEditingAddition
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                  }` }
                                onClick={ () =>
                                  !isEditingAddition &&
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
                                disabled={ isEditingAddition } // ✅ disable when editing
                                className={ `px-4 py-2 rounded ${!addons[key]
                                  ? "bg-red-600 text-white"
                                  : "bg-gray-300 text-black"
                                  } ${isEditingAddition
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                  }` }
                                onClick={ () =>
                                  !isEditingAddition &&
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
                      }) }
                    </div>
                  ) }

                { selectedService === "Graphics Design" &&
                  optionalServices?.length > 0 && (
                    <div className="space-y-4">
                      { optionalServices.map((opt) => {
                        const key = opt.editing_type_name
                          .toLowerCase()
                          .replace(/\s+/g, "_");

                        return (
                          <div key={ key }>
                            <label className="block font-semibold">
                              { opt.editing_type_name }?
                            </label>
                            <div className="flex gap-4 mt-2">
                              <button
                                type="button"
                                disabled={ isEditingAddition } // ✅ disable when editing
                                className={ `px-4 py-2 rounded ${addons[key]
                                  ? "bg-green-600 text-white"
                                  : "bg-gray-300 text-black"
                                  } ${isEditingAddition
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                  }` }
                                onClick={ () =>
                                  !isEditingAddition &&
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
                                disabled={ isEditingAddition } // ✅ disable when editing
                                className={ `px-4 py-2 rounded ${!addons[key]
                                  ? "bg-red-600 text-white"
                                  : "bg-gray-300 text-black"
                                  } ${isEditingAddition
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                  }` }
                                onClick={ () =>
                                  !isEditingAddition &&
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
                      }) }
                    </div>
                  ) }

                {/* Buttons */ }
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={ handleCloseAddition }
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={ loading }
                    className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm"
                  >
                    { loading ? "Saving..." : "Save" }
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) }
        { showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */ }
            <div
              className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
              onClick={ handleCloseNote }
            />

            {/* Modal */ }
            <div className="relative bg-white w-full max-w-md rounded-xl shadow-2xl transform transition-all animate-in fade-in-0 zoom-in-95 duration-200">
              {/* Header */ }
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <StickyNote className="w-5 h-5 text-red-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    { isEditing ? "Edit Note" : "Add New Note" }
                  </h2>
                </div>
                <button
                  onClick={ handleCloseNote }
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */ }
              <form onSubmit={ handleSubmit } className="p-6 space-y-4">
                {/* Note */ }
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Notebook className="w-4 h-4 inline mr-2" />
                    Note
                  </label>
                  <textarea
                    name="note_name"
                    value={ formDataNote.note_name }
                    onChange={ handleChangeNote }
                    className="w-full text-black px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors resize-none"
                    placeholder="Enter note details"
                    rows={ 4 } // number of visible lines
                    required
                  ></textarea>
                </div>

                {/* Buttons */ }
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={ handleCloseNote }
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={ loading }
                    className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm"
                  >
                    { loading
                      ? isEditing
                        ? "Updating..."
                        : "Saving..."
                      : isEditing
                        ? "Update Note"
                        : "Save Note" }
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) }
        { showModalRemaining && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */ }
            <div
              className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
              onClick={ handleClosesetRemaining }
            />

            {/* Modal */ }
            <div className="relative bg-white w-full max-w-md rounded-xl shadow-2xl transform transition-all animate-in fade-in-0 zoom-in-95 duration-200">
              {/* Header */ }
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-red-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    { isEditingRemaining
                      ? "Edit Remaining Amount Detail"
                      : "Add Remaining Amount Detail" }
                  </h2>
                </div>
                <button
                  onClick={ handleClosesetRemaining }
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */ }
              <form onSubmit={ handleRemainingSave } className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Name
                  </label>
                  <input
                    type="text"
                    name="service_name"
                    value={ formDataRemaining.service_name }
                    onChange={ handleChangeRemaining }
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                    placeholder="Enter Service Name"
                    required
                    disabled={ !!isEditingRemaining }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={ formDataRemaining.price }
                    min="1"
                    onChange={ handleChangeRemaining }
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                    placeholder="Enter Duration start date"
                    required
                  />
                </div>

                {/* Buttons */ }
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={ handleClosesetRemaining }
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={ loading }
                    className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm"
                  >
                    { loading ? "Saving..." : "Save Amount" }
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) }
        { showModalDiscount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */ }
            <div
              className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
              onClick={ handleCloseDiscount }
            />

            {/* Compact Discount Modal */ }
            <div className="relative bg-white w-full max-w-xs rounded-xl shadow-2xl transform transition-all animate-in fade-in-0 zoom-in-95 duration-200">
              {/* Header */ }
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 bg-red-100 rounded flex items-center justify-center">
                    <IndianRupeeIcon className="w-3.5 h-3.5 text-red-600" />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    { selecteddiscount ? "Update Discount" : "Set Discount" }
                  </h2>
                </div>
                <button
                  onClick={ handleCloseDiscount }
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Form */ }
              <form onSubmit={ handleSaveDiscount } className="px-3 py-2 space-y-2">
                {/* Discount value + type inline */ }
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-0.5">
                    Discount Value
                    { selecteddiscount && (
                      <span className="ml-1 text-gray-400 font-normal text-[10px]">
                        (0 enter karo to discount hatega)
                      </span>
                    ) }
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      name={ formDataDiscount.discount_type === "amount" ? "discount_amt" : "discount_per" }
                      value={ formDataDiscount.discount_type === "amount" ? formDataDiscount.discount_amt : formDataDiscount.discount_per }
                      onChange={ handleChangeDiscount }
                      className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-black text-sm"
                      placeholder={ formDataDiscount.discount_type === "amount"
                        ? `Enter ₹ (max ₹${ discountDataSet?.discount_amt ? Number(discountDataSet.discount_amt).toLocaleString() : grandTotal.toFixed(0) })`
                        : `Enter % (max ${ discountDataSet?.discount_per ? discountDataSet.discount_per : 100 }%)` }
                      min="0"
                      max={ formDataDiscount.discount_type === "percent"
                        ? (discountDataSet?.discount_per ? Number(discountDataSet.discount_per) : 100)
                        : (discountDataSet?.discount_amt ? Number(discountDataSet.discount_amt) : grandTotal) }
                    />
                    <select
                      name="discount_type"
                      value={ formDataDiscount.discount_type }
                      onChange={ handleChangeDiscount }
                      className="px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-black text-sm bg-white"
                    >
                      <option value="amount">₹</option>
                      <option value="percent">%</option>
                    </select>
                  </div>
                  {/* DB Limit helper */ }
                  <p className="text-xs text-gray-400 mt-0.5">
                    { formDataDiscount.discount_type === "amount"
                      ? `Max allowed: ₹${ discountDataSet?.discount_amt ? Number(discountDataSet.discount_amt).toLocaleString() : grandTotal.toFixed(0) }`
                      : `Max allowed: ${ discountDataSet?.discount_per ? discountDataSet.discount_per : 100 }%${ discountDataSet?.discount_amt ? ` (or ₹${Number(discountDataSet.discount_amt).toLocaleString()})` : "" }` }
                  </p>
                  {/* Preview */ }
                  { (() => {
                    const isAmt = formDataDiscount.discount_type === "amount";
                    const val = isAmt ? Number(formDataDiscount.discount_amt) : Number(formDataDiscount.discount_per);
                    if (!val || val <= 0) return null;
                    const maxAmt = discountDataSet?.discount_amt ? Number(discountDataSet.discount_amt) : grandTotal;
                    const maxPer = discountDataSet?.discount_per ? Number(discountDataSet.discount_per) : 100;
                    const calculatedRupee = isAmt ? val : (grandTotal * val) / 100;
                    const isExceeded = isAmt ? val > maxAmt : (val > maxPer || calculatedRupee > maxAmt);
                    return (
                      <p className={ `text-xs mt-1 ${ isExceeded ? "text-red-500 font-semibold" : "text-green-600" }` }>
                        { isAmt
                          ? `Discount: ₹${val.toLocaleString()} (${((val / grandTotal) * 100).toFixed(2)}% of ₹${grandTotal.toFixed(0)})${ isExceeded ? " ⚠️ Limit exceeded!" : "" }`
                          : `Discount: ₹${calculatedRupee.toFixed(2)} (${val}% of ₹${grandTotal.toFixed(0)})${ isExceeded ? " ⚠️ Limit exceeded!" : "" }` }
                      </p>
                    );
                  })() }
                </div>

                {/* Info Note - only when updating existing discount */ }
                { selecteddiscount && (
                  <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-lg px-2 py-1.5 text-[11px] text-orange-800">
                    <span className="text-orange-500 text-xs flex-shrink-0">⚠️</span>
                    <span>Value <span className="font-bold bg-orange-200 text-orange-900 rounded px-1">0</span> → <span className="font-bold text-red-600">permanently deletes</span> discount</span>
                  </div>
                ) }

                {/* Buttons */ }
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={ handleCloseDiscount }
                    className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-xs font-medium"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={ loading }
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-medium shadow-sm disabled:opacity-50"
                  >
                    { loading ? "Saving..." : (selecteddiscount ? "Update" : "Set Discount") }
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) }
      </div>
    </Wrapper>
  );
}
const Wrapper = styled.div`
  @media print {
    @page {
      size: A4;
      margin: 0 0 20mm 0;
    }

    @page :first {
      margin-top: 0 !important;
    }

    html, body {
      width: 210mm;
      height: auto;
      margin: 0 !important;
      padding: 0 !important;
    }

    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .page-wrapper {
      width: 210mm;
      height: auto !important;
      min-height: auto !important;
      break-after: auto;
      page-break-after: auto;
      display: block;
      margin: 0 !important;
      padding: 0 !important;
      padding-top: 0 !important;
      margin-top: 0 !important;
    }

    .print-fixed-footer {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      height: 20mm;
      align-items: flex-end;
      justify-content: center;
      pointer-events: none;
      z-index: 9999;
    }

    .print-fixed-footer img {
      width: 210mm;
      height: 20mm;
      object-fit: fill;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      margin: 0 !important;
      padding: 0 !important;
      margin-top: 0 !important;
      border-spacing: 0;
    }

    thead {
      display: table-header-group;
    }

    thead tr {
      margin: 0 !important;
      padding: 0 !important;
    }

    thead tr td {
      padding: 0 !important;
      margin: 0 !important;
      line-height: 0;
    }

    thead tr td > div {
      margin: 0 !important;
      padding: 0 !important;
      line-height: 0;
    }

    thead tr td img {
      display: block;
      margin: 0 !important;
      padding: 0 !important;
    }

    tfoot {
      display: table-footer-group;
    }

    tfoot tr td {
      padding: 0 !important;
      margin: 0 !important;
    }

    tbody {
      display: table-row-group;
    }

    tbody tr:first-child td {
      padding-top: 0 !important;
    }

    tr {
      page-break-inside: auto;
    }

    td {
      vertical-align: top;
    }

    /* Outer section: pure natural flow */
    section {
      page-break-inside: auto;
      break-inside: auto;
      page-break-before: auto;
      break-before: auto;
      page-break-after: auto;
      break-after: auto;
    }

    /* terms-bank-section: natural flow, content fits toh page 1, nahi toh page 2 */
    .terms-bank-section {
      page-break-inside: auto !important;
      break-inside: auto !important;
    }

    /* Bank Details div: NO forced break — Chrome ko khud decide karne do */
    .bank-details-section {
      page-break-inside: auto;
      break-inside: auto;
    }

    /* Terms & Conditions: natural flow */
    .terms-conditions-section {
      page-break-inside: auto;
      break-inside: auto;
    }
  }
`;
