import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import moment from "moment";
import Swal from "sweetalert2";
import { clearUser } from "../redux/user/userSlice";
import img1 from "../assets/Dg 1copy.png";
import img2 from "../assets/Dg 2copy.png";
import img3 from "../assets/dghead.jpeg";
import img4 from "../assets/DOAGURU Infosystyem.png";
import {
  Package,
  X,
  StickyNote,
  Notebook,
  ChevronUp,
  ChevronDown,
  IndianRupeeIcon,
} from "lucide-react";
import { classifyProformaServices } from "../utils/proformaPricing";
import API_BASE_URL from "../config/apiBaseUrl";
export default function Quotation() {
  const baseURL = API_BASE_URL;
  const { id, txn_id } = useParams();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const isGST = query.get("gst") === "1";
  const docTypeFromURL = query.get("doc") === "proforma" ? "proforma" : "quotation";
  const sourceFromURL = query.get("source");
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const [serviceData, setServiceData] = useState([]);
  const [graphicData, setGraphicData] = useState([]);
  const [adsData, setAdsData] = useState([]);
  const [complimentaryData, setComplimentaryData] = useState([]);
  const [selecteddiscount, setSelecteddiscount] = useState("");
  const [selectedplan, setSelectedPlan] = useState("");
  const [notesData, setNotesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState([]);
  const [clientDataReceived, setClientDataReceived] = useState([]);
  const [imagesLoaded, setImagesLoaded] = useState({
    header: false,
    footer: false,
  });
  const [formData, setFormData] = useState({
    note_name: "",
    plan: "Customise",
  });
  const [allClientNote, setAllClientNote] = useState([]);
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
  const [showMetaAd, setShowMetaAd] = useState(true);
  const [showGoogleAd, setShowGoogleAd] = useState(true);
  const dropdownRef = useRef(null);
  const getServiceDisplayName = (name) => {
    if (!name) return name;
    const n = name.toLowerCase();
    if (n.includes("content posting")) return "Meta Growth & Content Management";
    if (n.includes("youtube video posting")) return "YouTube Channel Growth & Optimization";
    if (n.includes("google ad")) return "Google Ads Campaign Management & Optimization";
    if (n.includes("meta ad")) return "Meta Ads Campaign Management & Optimization";
    return name;
  };
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

  const fetchServices = async () => {
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/re_calculator/getClientServiceHistory/${id}/${txn_id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setServiceData(res.data.data);

      setSelectedPlan(res.data.data[0].plan_name || "Customise");

      console.log(serviceData);
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
        `${baseURL}/auth/api/re_calculator/getClientDetailsById/${id}`,
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
        `${baseURL}/auth/api/re_calculator/getClientNotesbyId/${id}/${txn_id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.data.status === "Success" && res.data.data && res.data.data.length > 0) {
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
        `${baseURL}/auth/api/re_calculator/getByIDComplimentaryData/${txn_id}/${id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(data.data);
      setComplimentaryData(data.data);
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
  const fetchDiscount = async () => {
    try {
      const { data } = await axios.get(
        `${baseURL}/auth/api/re_calculator/getByIDDiscountData/${id}/${txn_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (data.data && data.data.length > 0) {
        let fetched = data.data[0];
        if (fetched && fetched.discount_type) {
          fetched.discount_type = fetched.discount_type.toLowerCase();
          if (fetched.discount_type === "percentage") {
            fetched.discount_type = "percent";
          }
        }
        setSelecteddiscount(fetched);
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
        `${baseURL}/auth/api/re_calculator/getDiscountSetting`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.data && data.data.length > 0) {
        setDiscountDataSet(data.data[0]);
      }
    } catch (error) {
      console.error("Error fetching discount setting:", error);
    }
  };

  const fetchClientReceived = async () => {
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/re_calculator/getInvoiceClientDetailsById/${id}/${txn_id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.data.status === "Success") {
        setClientDataReceived(res.data.data);
      }
      console.log(clientData);
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
  const clientAddress = clientData?.address;
  const clientPhone = clientData?.phone;

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

  const fetchProformaData = async () => {
    try {
      const res = await axios.get(`${baseURL}/auth/api/re_calculator/proforma/client/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === "Success") {
        const proformas = res.data.data;
        const proforma = proformas.find(p => p.id === parseInt(txn_id));
        if (proforma) {
          let p = null;
          let propRes = null;
          if (proforma.proposal_id) {
            propRes = await axios.get(`${baseURL}/auth/api/re_calculator/proposal/${proforma.proposal_id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (propRes.data.status === "Success") {
              p = propRes.data.data;
            }
          } else {
            const clientRes = await axios.get(`${baseURL}/auth/api/re_calculator/getClientDetailsById/${id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (clientRes.data.status === "Success") {
              const c = clientRes.data.data;
              p = {
                client_name: c.client_name,
                company_name: c.client_organization || c.company_name,
                email: c.email,
                phone: c.phone,
                address: c.address,
              };
            }
          }

          if (p) {
            setClientData({
              client_name: p.client_name,
              client_organization: p.company_name || p.client_organization,
              email: p.email,
              phone: p.phone,
              address: p.address,
              bill_type: proforma.is_gst ? "GST" : "NON_GST",
              document_type: "proforma",
              created_at: proforma.created_at,
            });

            try {
              const liveNotes = JSON.parse(p.notes_json || proforma.notes_snapshot || p.terms_notes_json || "[]");
              const formattedNotes = liveNotes.map((note, idx) => ({ 
                id: idx + 1, 
                note_name: typeof note === 'string' ? note : note.note_name || "" 
              }));
              setNotesData(formattedNotes);
            } catch (e) {
              setNotesData([]);
            }

            try {
              const sectionsData = typeof p.sections_json === 'string' ? JSON.parse(p.sections_json) : p.sections_json;
              const pricingDiscount = sectionsData?.pricing_discount;
              if (pricingDiscount && Number(pricingDiscount.value) > 0) {
                const discType = pricingDiscount.type === 'Percentage' ? 'percent' : 'amount';
                const discVal = Number(pricingDiscount.value);
                setSelecteddiscount({
                  discount_type: discType,
                  discount_amt: discType === 'amount' ? discVal : 0,
                  discount_per: discType === 'percent' ? discVal : 0,
                });
              } else {
                setSelecteddiscount(null);
              }
            } catch (e) {
              setSelecteddiscount(null);
            }
          }

          try {
            const livePricing = propRes && propRes.data.status === "Success" && propRes.data.data ? propRes.data.data.pricing_table_json : null;
            const parsed = JSON.parse(livePricing || proforma.pricing_snapshot || "[]");
            const { dmServices, adsServices } = classifyProformaServices(parsed);

            const compServices = parsed.filter(item => item.source === 'custom_complimentary' || item.service_name?.toLowerCase() === 'complimentary').map(item => ({
              ...item,
              is_complimentary: true,
              service_type: item.service_type || "Complimentary",
              editing_type_amount: item.unit_price ?? item.editing_type_amount ?? item.total_price ?? 0,
              total_amount: item.total_amount ?? item.total_price ?? 0
            }));

            setServiceData([...dmServices, ...adsServices]);
            setComplimentaryData(compServices);
          } catch (e) {
            console.error("Failed to parse proforma.pricing_snapshot", e);
            setServiceData([]);
            setComplimentaryData([]);
          }
          setDiscountDataSet(null);
          setLoading(false);
        }
      }
    } catch (e) {
      console.log(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (docTypeFromURL === "proforma" || sourceFromURL === "proposal") {
      fetchProformaData();
      fetchPredefinedNotes();
    } else {
      fetchServices();
      fetchClient();
      fetchClientNotes();
      fetchComplimentaryData();
      fetchDiscount();
      fetchDiscountSetting();
      fetchClientReceived();
      fetchPredefinedNotes();
    }
  }, [id, txn_id, docTypeFromURL, sourceFromURL]);

  const handleClose = () => {
    setShowModal(false);
    setFormData({
      note_name: "",
      plan: "",
    });
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

        setManualNote("");
        setPredefinedNotes([]);
        setSelectedNotes([]);
        fetchPredefinedNotes();
        fetchClientNotes();
      } else if (res.data.status === "Alert") {
        Swal.fire({
          icon: "warning",
          title: "Duplicate Notes",
          text: res.data.message,

          showConfirmButton: false,
          timer: 1000,
          // timerProgressBar: true,
        });
        setManualNote("");
        setPredefinedNotes([]);
        setSelectedNotes([]);
        fetchPredefinedNotes();
        fetchClientNotes();
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

  useEffect(() => {
    if (serviceData.length === 0) return;

    const graphicRaw = serviceData.filter(
      (item) => item.service_type === "Graphic Service"
    );
    const adsRaw = serviceData.filter(
      (item) => item.service_type === "Ads Campaign"
    );

    const groupedGraphic = [];

    graphicRaw.forEach((item) => {
      // Find service (e.g., Video Services, Video Shoot)
      let service = groupedGraphic.find((s) => s.service === item.service_name);
      if (!service) {
        service = { service: item.service_name, editingTypes: [] };
        groupedGraphic.push(service);
      }

      // Push editing types directly (attach category info in the row if needed)
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
  console.log(graphicData);

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

  const adsTotalBudget = adsData.reduce((sum, ad) => {
    const cat = (ad.category_name || "").toLowerCase();
    const amt = Number(ad.budget || ad.amount || 0);
    if (cat.includes("meta") && !showMetaAd) return sum;
    if (cat.includes("google") && !showGoogleAd) return sum;
    return sum + amt;
  }, 0);

  // Discount applies ONLY on DM Services (graphicTotal)
  const discountAmount = selecteddiscount
    ? selecteddiscount.discount_type === "percent"
      ? (graphicTotal * Number(selecteddiscount.discount_per)) / 100
      : selecteddiscount.discount_type === "amount"
        ? Number(selecteddiscount.discount_amt)
        : 0
    : 0;

  const dmTotalAfterDiscount = Math.max(0, graphicTotal - discountAmount);

  const dmGstAmount = isGST ? dmTotalAfterDiscount * 0.18 : 0;
  const dmSubtotalWithGst = dmTotalAfterDiscount + dmGstAmount;

  const adsGstAmount = 0; // Ads GST removed
  const adsTotalWithGst = adsTotalBudget;

  const grandTotal = dmSubtotalWithGst + adsTotalWithGst;

  // if (loading) {
  //   return (
  //     <div className="text-center p-10 font-semibold text-gray-700">
  //       Loading...
  //     </div>
  //   );
  // }

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
        setNotesData((prev) => prev.filter((item) => item.id !== noteId));

        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "note has been deleted.",
          timer: 1000,
          showConfirmButton: false,
        });
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
  const clientOrganization = clientData?.client_organization;

  const handlePrintPage = () => {
    const docName = docTypeFromURL === "proforma" ? "Proforma Invoice" : "Quotation";
    document.title = clientOrganization
      ? `${clientOrganization} ${docName}`
      : `${clientName} ${docName}`;
    window.print();
  };
  const handleProposalHistory = () => {
    navigate(`/admin/client/service/history/${id}`);
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
          txn_id: txn_id,
        }
        : {
          discount_type: "percent",
          discount_per: enteredValue,
          discount_amt: parseFloat(
            ((grandTotal * enteredValue) / 100).toFixed(2)
          ),
          client_id: id,
          txn_id: txn_id,
        };

      const response = selecteddiscount
        ? await axios.put(
          `${baseURL}/auth/api/re_calculator/updateDiscountDataById/${selecteddiscount.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        : await axios.post(
          `${baseURL}/auth/api/re_calculator/saveDiscountData`,
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
        `${baseURL}/auth/api/re_calculator/deleteDiscountById/${selecteddiscount.id}`,
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
        showConfirmButton: false,
        timer: 1000,
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

  const uniquePredefinedNotes = predefinedNotes.filter(
    (p) =>
      !notesData.some((c) => c.note_name === p.note_text) &&
      !selectedNotes.some((s) => s.note_name === p.note_text)
  );
  return (
    <Wrapper>
      <div className="page-wrapper w-[210mm] min-h-[297mm] flex flex-col justify-between p-4 mx-auto bg-white print:p-0 print:m-0">
        {/* Hidden on print - Action Buttons */ }

        <div className="print:hidden flex justify-end gap-3 my-4">
          <button
            onClick={ handlePrintPage }
            target="_blank"
            className="bg-red-600 text-white rounded-full px-4 py-2"
          >
            🖨️ Print
          </button>
          { clientDataReceived.tag_received_amt === "received" ? null : (
            <button
              onClick={ () => navigate(`/admin/ServicesLanding/${id}/${txn_id}`) }
              className="bg-orange-600 text-white rounded-full px-4 py-2"
            >
              ✏️ Edit
            </button>
          ) }
          <button
            onClick={ handleProposalHistory }
            className=" px-4 py-2 bg-yellow-600 text-white rounded-full hover:bg-yellow-700 transition-colors"
          >
            📝Proposal History
          </button>
          <button
            onClick={ () => navigate("/admin/dashboard") }
            className="bg-yellow-600 text-white rounded-full px-4 py-2"
          >
            📊 Dashboard
          </button>
          <button
            onClick={ () => {
              if (window.history.length > 1 && window.history.state && window.history.state.idx > 0) {
                navigate(-1);
              } else {
                window.close();
                setTimeout(() => navigate("/admin/dashboard"), 300);
              }
            } }
            className="bg-gray-600 text-white rounded-full px-4 py-2"
          >
            🔙 Back
          </button>
        </div>

        {/* Table for proper header/footer repetition */ }
        <table className="print:table print:border-collapse w-full">
          {/* Repeating Header */ }
          <thead className="print:table-header-group w-full">
            <tr>
              <td className="p-0 m-0 w-full">
                <div className="w-full h-auto">
                  <img
                    src={ img1 }
                    alt="Header"
                    className="w-full h-full object-cover " // use object-cover for full width fitting
                  />
                </div>
              </td>
            </tr>
          </thead>

          {/* Repeating Footer */ }

          {/* Main Content */ }
          <tbody className="print:table-row-group">
            <tr>
              <td className="p-0 m-0 align-top">
                <div className="flex flex-col justify-between h-full px-6 py-1 print:px-4 ">
                  <div className="flex-grow">
                    {/* Client Details */ }
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3 print:grid-cols-2">
                      <div className="break-words text-xs">
                        <h3 className="text-md font-bold">Client Details</h3>
                        <p className="break-words">
                          <strong>Name:</strong> { clientData?.client_name }
                        </p>
                        <p className="break-words">
                          <strong>Organization Name:</strong>{ " " }
                          { clientData?.client_organization }
                        </p>
                        <p className="break-words">
                          <strong>Contact:</strong> { clientData?.phone }
                        </p>
                        <p className="break-words">
                          <strong>Address:</strong> { clientData?.address }
                        </p>
                      </div>
                      <div className="text-end text-xs">
                        <h2 className="text-md font-bold">
                          { selectedplan } Plan
                        </h2>
                        <p>{ moment().format("DD/MM/YYYY") }</p>
                        <p>
                          { sourceFromURL === "proposal" || docTypeFromURL === "proforma" ? null : <span className="font-bold text-amber-600 border border-amber-600 px-1 py-0.5 rounded mr-1">Legacy</span> }
                          { docTypeFromURL === "proforma" ? "Proforma Invoice: " : "Quotation: " } { txn_id }
                        </p>
                      </div>
                      {/* <div className="text-right text-gray-600 break-words">
                    <p>1815, Wright Town, Jabalpur,</p>
                    <p>Madhya Pradesh 482002</p>
                    <p>Phone: 074409 92424</p>
                  </div> */}
                    </div>

                    {/* Graphic Services */ }
                    { graphicData.length > 0 && (
                      <section className="mb-2 text-sm">
                        <table className="w-full border text-xs">
                          <thead className="bg-orange-100">
                            <tr>
                              <th className="border w-[10rem] px-2 py-1 text-left">
                                DM Service
                              </th>
                              <th className="border w-[20rem] px-2 py-1 text-left">
                                Service Name
                              </th>
                              <th className="border px-2 py-1 text-right">
                                Quantity
                              </th>
                              <th className="border px-2 py-1 text-right">
                                Price (₹)
                              </th>
                              <th className="border px-2 py-1 text-right">
                                Total (₹)
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {/* ================= GRAPHIC SERVICES (Grouped by Service) ================= */ }
                            { graphicData.map((service, idx) =>
                              service.editingTypes.map((edit, eidx) => {
                                const qty = Number(edit.quantity);
                                const base = Number(edit.price);
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
                                    <td className="border px-2 py-1 text-right">
                                      ₹{ base }
                                    </td>
                                    <td className="border px-2 py-1 text-right">
                                      ₹{ totalBase }
                                    </td>
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



                            {/* ================= DM SERVICE TOTAL ================= */ }
                            { (() => {
                              const graphicTotal = graphicData.reduce(
                                (sum, service) =>
                                  sum +
                                  service.editingTypes.reduce(
                                    (s, edit) =>
                                      s +
                                      Number(edit.price) *
                                      Number(edit.quantity),
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

                              const dmServiceTotal = graphicTotal + thumbTotal + postTotal + ytTotal;

                              return (
                                <tr className=" font-semibold">
                                  <td
                                    className="border px-2 py-1 text-right"
                                    colSpan={ 4 }
                                  >
                                    DM Service Total
                                  </td>
                                  <td className="border px-2 py-1 text-right">
                                    ₹{ dmServiceTotal }
                                  </td>
                                </tr>
                              );
                            })() }

                            {/* ================= DM SERVICE TOTAL ================= */ }
                          </tbody>
                        </table>
                      </section>
                    ) }
                    {/* Ads Services Table has been removed per user request */ }

                  { complimentaryData.length > 0 && (
                    <section className="mb-2 mt-4 text-sm">
                      <table className="w-full border text-xs">
                        <thead className="bg-orange-100">
                          <tr>
                            <th className="border w-[10rem] px-2 py-1 text-left">
                              Complimentary Service
                            </th>
                            <th className="border w-[20rem] px-2 py-1 text-left">
                              Service Name
                            </th>
                            <th className="border px-2 py-1 text-right">
                              Quantity
                            </th>
                            <th className="border px-2 py-1 text-right">
                              Price (₹)
                            </th>
                            <th className="border px-2 py-1 text-right">
                              Total (₹)
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {/* ================= COMPLIMENTARY SERVICES ================= */ }
                          { complimentaryData.map((edit, eidx) => {
                            const qty = Number(edit.quantity);
                            const base = Number(edit.editing_type_amount);
                            const totalBase = base * qty;

                            // For the first complimentary service, show "Complimentary Service" once
                            return (
                              <tr
                                key={ `compl-${eidx}` }
                                className="bg-gray-50"
                              >
                                <td className="border px-2 py-1">
                                  { edit.category_name }
                                </td>
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
                          {/* ✅ Thumbnail Creation Total */ }
                          { (() => {
                            const thumbEdits = complimentaryData.filter(
                              (item) =>
                                Number(item.include_thumbnail_creation) > 0
                            );
                            if (thumbEdits.length === 0) return null;

                            const totalThumbQty = thumbEdits.reduce(
                              (sum, item) => sum + Number(item.quantity),
                              0
                            );
                            const pricePerThumb =
                              Number(
                                thumbEdits[0].include_thumbnail_creation
                              ) || 0;
                            const totalThumbAmount = thumbEdits.reduce(
                              (sum, item) =>
                                sum +
                                Number(item.include_thumbnail_creation) *
                                Number(item.quantity),
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

                          {/* ✅ Content Posting Total */ }
                          { (() => {
                            const postEdits = complimentaryData.filter(
                              (item) =>
                                Number(item.include_content_posting) > 0
                            );
                            if (postEdits.length === 0) return null;

                            const totalPostQty = postEdits.reduce(
                              (sum, item) => sum + Number(item.quantity),
                              0
                            );
                            const pricePerPost =
                              Number(postEdits[0].include_content_posting) ||
                              0;
                            const totalPostAmount = postEdits.reduce(
                              (sum, item) =>
                                sum +
                                Number(item.include_content_posting) *
                                Number(item.quantity),
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

                          {/* ✅ YouTube Video Posting Total */ }
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
                              Number(ytEdits[0].include_youtube_video_posting) ||
                              0;
                            const totalYtAmount = ytEdits.reduce(
                              (sum, item) =>
                                sum +
                                Number(item.include_youtube_video_posting) *
                                Number(item.quantity),
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
                          {/* ================= COMPLIMENTARY TOTAL ================= */ }
                          { (() => {
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
                        </tbody>
                      </table>
                    </section>
                  ) }

                  {/* Grand Total Section with Bank Details */ }
                  { docTypeFromURL === "proforma" && (
                    <div className="print:hidden flex justify-end gap-3 mt-4 mb-2 pr-6">
                      { adsData.some(ad => (ad.category_name || "").toLowerCase().includes("meta") && Number(ad.amount || ad.budget || 0) > 0) && (
                        <label className="inline-flex items-center gap-1 mx-1 text-xs cursor-pointer font-bold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-300">
                          <input
                            type="checkbox"
                            checked={ showMetaAd }
                            onChange={ (e) => setShowMetaAd(e.target.checked) }
                            className="w-4 h-4 accent-red-600"
                          />
                          Show Meta Ads Budget
                        </label>
                      ) }

                      { adsData.some(ad => (ad.category_name || "").toLowerCase().includes("google") && Number(ad.amount || ad.budget || 0) > 0) && (
                        <label className="inline-flex items-center gap-1 mx-1 text-xs cursor-pointer font-bold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-300">
                          <input
                            type="checkbox"
                            checked={ showGoogleAd }
                            onChange={ (e) => setShowGoogleAd(e.target.checked) }
                            className="w-4 h-4 accent-red-600"
                          />
                          Show Google Ads Budget
                        </label>
                      ) }
                    </div>
                  ) }
                  <section className="terms-bank-section print:block px-6 py-2 text-sm text-gray-800 border-t mt-2">
                    <div className="bank-details-section flex justify-between w-full mb-2">
                      {/* LEFT SIDE: Bank Details */ }
                      <div className="w-1/2 pr-3">
                        <h2 className="font-bold mb-0.5 text-gray-800">Bank Details:</h2>
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
                        <div className="mt-3 text-center border border-gray-400 rounded-md p-0.5 inline-block">
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

                      {/* RIGHT SIDE: Totals */ }
                      <div className="w-1/2 pl-3 text-right border-l border-gray-200">
                        { (() => {
                          const inrToWords = (num) => {
                            const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
                            const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
                            const convert = (n) => {
                              if (n < 20) return a[n];
                              if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? "-" + a[n % 10] : "");
                              if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + convert(n % 100) : "");
                              if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + convert(n % 1000) : "");
                              if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + convert(n % 100000) : "");
                              return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + convert(n % 10000000) : "");
                            };
                            if (num === 0) return "Zero Rupees";
                            return convert(num) + " Rupees";
                          };

                          return (
                            <div className="space-y-0.5 text-gray-700">
                              { discountAmount > 0 && (
                                <>
                                  <p>Subtotal ₹{ graphicTotal.toLocaleString("en-IN") }</p>
                                  <p className="text-red-600 font-bold mt-1">
                                    Discount (
                                    { selecteddiscount.discount_type === "percent"
                                      ? `${selecteddiscount.discount_per}%`
                                      : `₹${selecteddiscount.discount_amt}` }
                                    ): -₹{ discountAmount.toLocaleString("en-IN") }
                                  </p>
                                </>
                              ) }

                              <p className="mt-1">Taxable Amount ₹{ dmTotalAfterDiscount.toLocaleString("en-IN") }</p>

                              { isGST && (
                                <>
                                  <p>CGST @9% ₹{ (dmGstAmount / 2).toLocaleString("en-IN") }</p>
                                  <p>SGST @9% ₹{ (dmGstAmount / 2).toLocaleString("en-IN") }</p>
                                </>
                              ) }

                              <p className="font-bold mt-1">Subtotal ₹{ dmSubtotalWithGst.toLocaleString("en-IN") }</p>

                              { adsData && adsData.length > 0 && adsData.map((ad, idx) => {
                                const amount = Number(ad.amount || ad.budget || 0);
                                const cat = (ad.category_name || "").toLowerCase();
                                if (cat.includes("meta") && !showMetaAd) return null;
                                if (cat.includes("google") && !showGoogleAd) return null;
                                const adsCategoryName = ad.category_name || ad.service_name || "Ads";
                                return (
                                  <p key={ idx }>{ adsCategoryName } Budget ₹{ amount.toLocaleString("en-IN") }</p>
                                );
                              }) }

                              <p className="text-lg font-bold text-green-700 mt-2">
                                Grand Total ₹{ grandTotal.toLocaleString("en-IN") }
                              </p>

                              <div className="mt-1 pt-2 border-t text-right">
                                <p className="text-xs text-gray-500">Total Amount (in words):</p>
                                <p className="font-semibold text-gray-800 leading-snug">{ inrToWords(grandTotal) }</p>
                              </div>
                            </div>
                          );
                        })() }
                      </div>
                    </div>
                  </section>



                      { showModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                          {/* Backdrop */ }
                          <div
                            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
                            onClick={ handleClose }
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
                                onClick={ handleClose }
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>

                            {/* Form */ }
                            <form
                              onSubmit={ handleSubmit }
                              className="p-6 space-y-4"
                            >
                              {/* Note */ }
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  <Notebook className="w-4 h-4 inline mr-2" />
                                  Note
                                </label>
                                <textarea
                                  name="note_name"
                                  value={ formData.note_name }
                                  onChange={ handleChange }
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
                                  onClick={ handleClose }
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

                      { showModalDiscount && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                          <div
                            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
                            onClick={ handleCloseDiscount }
                          />

                          <div className="relative bg-white w-full max-w-xs rounded-xl shadow-2xl transform transition-all animate-in fade-in-0 zoom-in-95 duration-200">
                            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
                              <div className="flex items-center gap-1.5">
                                <div className="w-6 h-6 bg-red-100 rounded flex items-center justify-center">
                                  <IndianRupeeIcon className="w-3.5 h-3.5 text-red-600" />
                                </div>
                                <h2 className="text-sm font-semibold text-gray-900">
                                  { selecteddiscount
                                    ? "Update Discount"
                                    : "Set Discount" }
                                </h2>
                              </div>
                              <button
                                onClick={ handleCloseDiscount }
                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <form
                              onSubmit={ handleSaveDiscount }
                              className="px-3 py-2 space-y-2"
                            >
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-0.5">
                                  Discount Value
                                </label>
                                <div className="flex gap-1.5">
                                  <input
                                    type="number"
                                    name={
                                      formDataDiscount.discount_type ===
                                        "amount"
                                        ? "discount_amt"
                                        : "discount_per"
                                    }
                                    value={
                                      formDataDiscount.discount_type ===
                                        "amount"
                                        ? formDataDiscount.discount_amt
                                        : formDataDiscount.discount_per
                                    }
                                    onChange={ handleChangeDiscount }
                                    className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-black text-sm"
                                    placeholder={
                                      formDataDiscount.discount_type ===
                                        "amount"
                                        ? `Enter ₹ (max ₹${discountDataSet?.discount_amt
                                          ? Number(
                                            discountDataSet.discount_amt
                                          )
                                          : grandTotal.toFixed(0)
                                        })`
                                        : `Enter % (max ${discountDataSet?.discount_per
                                          ? discountDataSet.discount_per
                                          : 100
                                        }%)`
                                    }
                                    min="0"
                                    max={
                                      formDataDiscount.discount_type ===
                                        "percent"
                                        ? discountDataSet?.discount_per
                                          ? Number(
                                            discountDataSet.discount_per
                                          )
                                          : 100
                                        : discountDataSet?.discount_amt
                                          ? Number(discountDataSet.discount_amt)
                                          : grandTotal
                                    }
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
                                <p className="text-xs text-gray-400 mt-0.5">
                                  { formDataDiscount.discount_type === "amount"
                                    ? `Max allowed: ₹${discountDataSet?.discount_amt
                                      ? Number(
                                        discountDataSet.discount_amt
                                      )
                                      : grandTotal.toFixed(0)
                                    }`
                                    : `Max allowed: ${discountDataSet?.discount_per
                                      ? discountDataSet.discount_per
                                      : 100
                                    }%${discountDataSet?.discount_amt
                                      ? ` (or ₹${Number(
                                        discountDataSet.discount_amt
                                      ).toFixed(2)})`
                                      : ""
                                    }` }
                                </p>
                                { (() => {
                                  const isAmt =
                                    formDataDiscount.discount_type ===
                                    "amount";
                                  const val = isAmt
                                    ? Number(formDataDiscount.discount_amt)
                                    : Number(formDataDiscount.discount_per);
                                  if (!val || val <= 0) return null;

                                  const maxAmt = discountDataSet?.discount_amt
                                    ? Number(discountDataSet.discount_amt)
                                    : grandTotal;
                                  const maxPer = discountDataSet?.discount_per
                                    ? Number(discountDataSet.discount_per)
                                    : 100;
                                  const calculatedRupee = isAmt
                                    ? val
                                    : (grandTotal * val) / 100;
                                  const isExceeded = isAmt
                                    ? val > maxAmt
                                    : val > maxPer || calculatedRupee > maxAmt;

                                  return (
                                    <p
                                      className={ `text-xs mt-1 ${isExceeded
                                        ? "text-red-500 font-semibold"
                                        : "text-green-600"
                                        }` }
                                    >
                                      { isAmt
                                        ? `Discount: ₹${val.toLocaleString()} (${(
                                          (val / grandTotal) *
                                          100
                                        ).toFixed(2)}% of ₹${grandTotal.toFixed(
                                          0
                                        )})${isExceeded
                                          ? " Limit exceeded!"
                                          : ""
                                        }`
                                        : `Discount: ₹${calculatedRupee.toFixed(
                                          2
                                        )} (${val}% of ₹${grandTotal.toFixed(
                                          0
                                        )})${isExceeded
                                          ? " Limit exceeded!"
                                          : ""
                                        }` }
                                    </p>
                                  );
                                })() }
                              </div>

                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  { selecteddiscount && (
                                    <button
                                      type="button"
                                      onClick={ handleDeleteDiscount }
                                      disabled={ loading }
                                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-medium disabled:opacity-50"
                                    >
                                      Delete
                                    </button>
                                  ) }
                                </div>
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
                                    { loading
                                      ? "Saving..."
                                      : selecteddiscount
                                        ? "Update"
                                        : "Set Discount" }
                                  </button>
                                </div>
                              </div>
                            </form>
                          </div>
                        </div>
                      ) }

                  { notesData.length > 0 ? (
                    <>
                      <p className="text-sm  font-bold">Notes</p>

                      <ul className="list-disc pl-5">
                        { notesData.map((note) => (
                          <>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-white">
                              <li
                                key={ note.id }
                                className="text-xs text-gray-700 font-bold"
                              >
                                { note.note_name }
                              </li>
                              { clientDataReceived.tag_received_amt ===
                                "received" ? null : (
                                <div className="flex print:hidden items-center gap-2 sm:gap-4">
                                  <button
                                    onClick={ (e) => {
                                      e.stopPropagation(); // prevent card onClick
                                      setSelectedNotesId(note);
                                      setFormData({
                                        note_name: note.note_name,
                                        plan: note.plan,
                                      });
                                      setIsEditing(true);
                                      setShowModal(true);
                                    } }
                                    className="bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold"
                                    title="Edit"
                                  >
                                    ✎
                                  </button>
                                  <button
                                    onClick={ () =>
                                      handleDeleteClientNote(note.id)
                                    }
                                    className="bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold"
                                    title="Delete"
                                  >
                                    ×
                                  </button>
                                </div>
                              ) }
                            </div>
                          </>
                        )) }
                      </ul>
                    </>
                  ) : (
                    <p className="text-gray-500 italic"></p>
                  ) }
                </div>
              </div>
            </td>
          </tr>
        </tbody>

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
    </div>
    </Wrapper >
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

    section {
      page-break-inside: auto;
      break-inside: auto;
      page-break-before: auto;
      break-before: auto;
      page-break-after: auto;
      break-after: auto;
    }

    .terms-bank-section {
      page-break-inside: auto !important;
      break-inside: auto !important;
    }

    .bank-details-section {
      page-break-inside: auto;
      break-inside: auto;
    }

    .terms-conditions-section {
      page-break-inside: auto;
      break-inside: auto;
    }
  }
`;
