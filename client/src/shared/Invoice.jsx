/* eslint-disable no-constant-binary-expression, no-constant-condition */
import React, { useEffect, useRef, useState } from "react";
import InvoicePrintWrapper from "./invoice/InvoicePrintWrapper";
import InvoiceNoteModal from "./invoice/InvoiceNoteModal";
import RemainingPaymentModal from "./invoice/RemainingPaymentModal";
import InvoiceDiscountModal from "./invoice/InvoiceDiscountModal";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";

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
  Trash,
  RefreshCcw,
  IndianRupeeIcon,
} from "lucide-react";
import axios from "axios";
import { classifyProformaServices } from "../utils/proformaPricing";
import { inrToWords } from "../utils/inrToWords";
import moment from "moment";
import Swal from "sweetalert2";
import { clearUser } from "../redux/user/userSlice";
import img2 from "../assets/Dg 2copy.png";
import DocumentHeaderBanner from "./document/DocumentHeaderBanner";
import DocumentBankDetails from "./document/DocumentBankDetails";
import DocumentCompanyFrom from "./document/DocumentCompanyFrom";
import API_BASE_URL from "../config/apiBaseUrl";

export default function Invoice({ publicMode = false, publicData = null, publicToken = null }) {
  const baseURL = API_BASE_URL;
  const { id, txn_id } = useParams();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const basePath = isAdmin ? "/admin" : "/BD";
  const query = new URLSearchParams(location.search);
  const rawDocParam = query.get("doc");
  const isBalanceProforma = rawDocParam === "balance-proforma-view" || rawDocParam === "balance-proforma";
  const docTypeFromURL = isBalanceProforma ? "balance-proforma" : (rawDocParam === "proforma" ? "proforma" : "final");
  const sourceFromURL = query.get("source");
  const txnIdFromURL = query.get("txnId");
  const activeTxnId = txnIdFromURL || txn_id;
  // ✅ URL param as initial fallback; real value comes from DB via clientData.bill_type
  const isGSTFromURL = query.get("gst") === "1";
  const navigate = useNavigate();
  const { currentUser, token } = useSelector((state) => state.user);
  const userName = currentUser?.name;
  const dispatch = useDispatch();


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
  const [showMetaAd, setShowMetaAd] = useState(true);
  const [showGoogleAd, setShowGoogleAd] = useState(true);
  const [proformaPayments, setProformaPayments] = useState([]);
  // ✅ isGST derived from DB bill_type; falls back to URL param until clientData loads
  const isGST = clientData?.bill_type
    ? clientData.bill_type === "GST"
    : isGSTFromURL;
  const isProforma =
    isBalanceProforma ||
    String(clientData?.document_type || clientData?.invoice_type || docTypeFromURL)
      .toLowerCase() === "proforma";
  const [imagesLoaded, setImagesLoaded] = useState({
    header: false,
    footer: false,
  });
  const [showModalRemaining, setShowModalRemaining] = useState(false);
  const [isEditingRemaining, setIsEditingRemaining] = useState(false);


  const parseAmount = (value) => {
    if (value === null || value === undefined || value === "") return 0;
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    const normalized = String(value).replace(/[^0-9.-]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  };



  const getOptionalAmountFromItem = (item, aliases = []) => {
    const keys = Object.keys(item || {});
    const exactMatch = keys.find((key) =>
      aliases.some((alias) => key.toLowerCase() === alias.toLowerCase())
    );
    if (exactMatch) {
      const amount = parseAmount(item[exactMatch]);
      if (amount > 0) return amount;
    }

    const fuzzyMatch = keys.find((key) => {
      const k = key.toLowerCase();
      return (
        k.startsWith("include_") &&
        aliases.some((alias) => k.includes(alias.toLowerCase()))
      );
    });
    return fuzzyMatch ? parseAmount(item[fuzzyMatch]) : 0;
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
        `${baseURL}/auth/api/re_calculator/getinInvoiceServiceHistory/${id}/${activeTxnId}`,
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
        `${baseURL}/auth/api/re_calculator/getInvoiceClientDetailsById/${id}/${activeTxnId}`,
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
        `${baseURL}/auth/api/re_calculator/getInvoiceClientNotesbyId/${id}/${activeTxnId}`,
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
        `${baseURL}/auth/api/re_calculator/getComplimentaryInvoiceData/${activeTxnId}/${id}`,
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
    const normalizeDiscount = (fetched) => {
      if (fetched && fetched.discount_type) {
        fetched.discount_type = fetched.discount_type.toLowerCase();
        if (fetched.discount_type === "percentage") {
          fetched.discount_type = "percent";
        }
      }
      return fetched;
    };

    try {
      // 1. Scoped fetch: resolves discount for THIS invoice/document strictly
      const { data } = await axios.get(
        `${baseURL}/auth/api/re_calculator/getDiscountByDocument/${id}/${activeTxnId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.data && data.data.length > 0) {
        setSelecteddiscount(normalizeDiscount(data.data[0]));
        return;
      }

      // 2. Direct lookup in re_discount table by txn_id
      try {
        const direct = await axios.get(
          `${baseURL}/auth/api/re_calculator/getByIDDiscountData/${id}/${activeTxnId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (direct.data?.data && direct.data.data.length > 0) {
          setSelecteddiscount(normalizeDiscount(direct.data.data[0]));
        } else {
          setSelecteddiscount(null);
        }
      } catch {
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

  const fetchPredefinedNotes = async () => {
    try {
      const endpoint = isBalanceProforma 
        ? `${baseURL}/auth/api/re_calculator/getNotesbydefault` 
        : `${baseURL}/auth/api/re_calculator/getInvoiceNoteData`;

      const { data } = await axios.get(endpoint,
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
        `${baseURL}/auth/api/re_calculator/getAdditionByIdData/${id}/${activeTxnId}`,
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
        `${baseURL}/auth/api/re_calculator/getRemainingAmountByIdData/${id}/${activeTxnId}`,
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

  const fetchProformaPayments = async (proformaId = txn_id, clientId = id) => {
    try {
      const { data } = await axios.get(
        `${baseURL}/auth/api/re_calculator/proposal-payments/client/${clientId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const rows =
        data.status === "Success"
          ? (data.data || []).filter(
            (payment) => Number(payment.proforma_id) === Number(proformaId)
          )
          : [];
      setProformaPayments(rows);
      return rows;
    } catch (error) {
      console.error("Error fetching proforma payments:", error);
      setProformaPayments([]);
      return [];
    }
  };

  const clientName = clientData?.client_name;
  const clientOrganization = clientData?.client_organization;
  const clientAddress = clientData?.address;
  const clientPhone = clientData?.phone;
  // console.log(clientName, clientOrganization);
  console.log("clientData.realized_ad_budget:", clientData?.realized_ad_budget);

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

          const proformaPaymentRows = await fetchProformaPayments(proforma.id, id);
          const totalRecordedReceived = proformaPaymentRows.reduce(
            (sum, payment) => sum + parseAmount(payment.amount),
            0
          );
          const totalRecordedSettled = proformaPaymentRows.reduce(
            (sum, payment) =>
              sum + parseAmount(payment.final_amount || payment.amount),
            0
          );
          const latestPayment = proformaPaymentRows[0];

          if (p) {
            setClientData({
              id: proforma.id,
              client_name: p.client_name,
              client_organization: p.company_name || p.client_organization,
              email: p.email,
              phone: p.phone,
              address: p.address,
              bill_type: (proforma.is_gst && typeof proforma.is_gst === 'object' && proforma.is_gst.data ? proforma.is_gst.data[0] === 1 : Number(proforma.is_gst) === 1) ? "GST" : "NON_GST",
              document_type: "proforma",
              bill_number: proforma.bill_number || `PF-${proforma.id}`,
              duration_start_date: proforma.duration_start_date || p.billing_start_date || proforma.created_at,
              duration_end_date: proforma.duration_end_date || p.billing_end_date || proforma.created_at,
              payment_mode: latestPayment?.payment_mode || "",
              tag_received_amt:
                totalRecordedSettled >= parseAmount(proforma.total_amount) && totalRecordedSettled > 0
                  ? "received"
                  : totalRecordedReceived > 0
                    ? "partial"
                    : "pending",
              received_amt: totalRecordedReceived,
              current_amt: Math.max(
                parseAmount(proforma.total_amount) - totalRecordedSettled,
                0
              ),
              previous_amt: 0,
              created_at: proforma.created_at,
              discount_snapshot: proforma.discount_snapshot || null,
            });
          }

          try {
            const livePricing = propRes && propRes.data.status === "Success" && propRes.data.data ? propRes.data.data.pricing_table_json : null;
            const parsed = JSON.parse(livePricing || proforma.pricing_snapshot || "[]");
            let adsParsed = [];
            if (proforma.ads_snapshot) {
              try { adsParsed = JSON.parse(proforma.ads_snapshot || "[]"); } catch(e) {}
            }
            const combined = [...parsed, ...adsParsed];
            const { dmServices, adsServices } = classifyProformaServices(combined);
            setServiceData([...dmServices, ...adsServices]);
          } catch (e) {
            console.error("Failed to parse proforma.pricing_snapshot", e);
            setServiceData([]);
          }
          setComplimentaryData([]);
          setAdditionalServiceData([]);
          setDiscountDataSet(null);
          fetchDiscount();
          setLoading(false);
        } else {
          setProformaPayments([]);
          setLoading(false);
        }
      }
    } catch (e) {
      console.log(e);
      setLoading(false);
    }
  };

  const fetchBalanceProformaData = async () => {
    try {
      const res = await axios.get(`${baseURL}/auth/api/re_calculator/balance-proforma/${txn_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === "Success") {
        const bp = res.data.data;
        const isGstVal = (bp.is_gst && typeof bp.is_gst === 'object' && bp.is_gst.data ? bp.is_gst.data[0] === 1 : Number(bp.is_gst) === 1);

        setClientData({
          id: bp.id,
          client_name: bp.client_name || "",
          client_organization: bp.client_organization || "",
          email: bp.email || "",
          phone: bp.phone || "",
          address: bp.address || "",
          bill_type: isGstVal ? "GST" : "NON_GST",
          document_type: "balance-proforma",
          bill_number: bp.balance_proforma_number || `BAL-PROF-${bp.balance_number}`,
          source_proforma_number: bp.source_proforma_number,
          duration_start_date: bp.duration_start_date || bp.created_at,
          duration_end_date: bp.duration_end_date || bp.created_at,
          payment_mode: "",
          tag_received_amt: Number(bp.current_balance || 0) <= 0 ? "received" : (Number(bp.received_amount || 0) > 0 ? "partial" : "pending"),
          received_amt: Number(bp.received_amount || 0),
          current_amt: Number(bp.current_balance || 0),
          total_amt: Number(bp.total_amount || 0),
          previous_amt: 0,
          created_at: bp.created_at,
          discount_snapshot: bp.discount_snapshot || null,
        });

        setShowGoogleAd(Boolean(bp.show_google_ad));
        setShowMetaAd(Boolean(bp.show_meta_ad));

        try {
          const parsed = JSON.parse(bp.pricing_snapshot || "[]");
          let adsParsed = [];
          if (bp.ads_snapshot) {
            try { adsParsed = JSON.parse(bp.ads_snapshot || "[]"); } catch(e) {}
          }
          const combined = [...parsed, ...adsParsed];
          const { dmServices, adsServices } = classifyProformaServices(combined);
          setServiceData([...dmServices, ...adsServices]);

          const complimentary = parsed.filter(item =>
            item.source === "custom_complimentary" ||
            (item.service_name && item.service_name.toLowerCase() === "complimentary") ||
            Boolean(item.is_complimentary)
          ).map(item => ({
            service_type: "Complimentary",
            service_name: item.service_name || "Complimentary",
            category_name: item.category_name,
            editing_type_name: item.editing_type_name,
            quantity: item.quantity || 1,
            editing_type_amount: (item.editing_type_amount && Number(item.editing_type_amount) > 0)
              ? Number(item.editing_type_amount)
              : (item.price && Number(item.price) > 0
                ? Number(item.price)
                : (item.amount && Number(item.amount) > 0
                  ? Number(item.amount)
                  : (item.unit_price && Number(item.unit_price) > 0
                    ? Number(item.unit_price)
                    : 0))),
            total_amount: 0
          }));
          setComplimentaryData(complimentary);
        } catch (e) {
          console.error("Failed to parse bp.pricing_snapshot", e);
          setServiceData([]);
          setComplimentaryData([]);
        }

        try {
          if (bp.notes_snapshot) {
            const parsedNotes = JSON.parse(bp.notes_snapshot || "[]");
            const formattedNotes = parsedNotes.map((note, idx) => ({
              id: note.id || idx + 1,
              note_name: typeof note === 'string' ? note : note.note_name || ""
            }));
            setNotesData(formattedNotes);
          } else {
            setNotesData([]);
          }
        } catch (e) {
          setNotesData([]);
        }

        setAdditionalServiceData([]);
        setDiscountDataSet(null);
        fetchDiscount();
        setProformaPayments([]);
        setLoading(false);
      }
    } catch (e) {
      console.error("fetchBalanceProformaData error:", e);
      setLoading(false);
    }
  };

  const fetchProposalInvoiceData = async () => {
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/re_calculator/getInvoiceClientDetailsById/${id}/${txn_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.status === "Success") {
        const client = res.data.data;

        // Ensure tag_received_amt is set for UI logic
        const received = Number(client.received_amt || 0);
        // For proposal invoices, current_amt in DB actually holds the total_amount. 
        // We need to calculate the actual outstanding balance for the UI.
        const total = Number(client.current_amt || 0);
        const current = Math.max(total - received, 0);
        client.current_amt = current; // override for UI

        if (current <= 0 && received > 0) {
          client.tag_received_amt = "received";
        } else if (received > 0) {
          client.tag_received_amt = "partial";
        } else {
          client.tag_received_amt = "pending";
        }

        setClientData(client);

        try {
          const parsed = JSON.parse(client.pricing_snapshot || "[]");
          let adsParsed = [];
          if (client.ads_snapshot) {
            try { adsParsed = JSON.parse(client.ads_snapshot || "[]"); } catch(e) {}
          }
          const combined = [...parsed, ...adsParsed];
          const { dmServices, adsServices } = classifyProformaServices(combined);
          setServiceData([...dmServices, ...adsServices]);

          const complimentary = parsed.filter(item =>
            item.source === "custom_complimentary" ||
            (item.service_name && item.service_name.toLowerCase() === "complimentary")
          ).map(item => ({
            service_type: "Complimentary",
            service_name: item.service_name || "Complimentary",
            category_name: item.category_name,
            editing_type_name: item.editing_type_name,
            quantity: item.quantity,
            editing_type_amount: (item.editing_type_amount && Number(item.editing_type_amount) > 0)
              ? Number(item.editing_type_amount)
              : (item.price && Number(item.price) > 0
                ? Number(item.price)
                : (item.amount && Number(item.amount) > 0
                  ? Number(item.amount)
                  : (item.unit_price && Number(item.unit_price) > 0
                    ? Number(item.unit_price)
                    : 0))),
            total_amount: 0
          }));
          setComplimentaryData(complimentary);

          if (client.notes_snapshot) {
            const parsedNotes = JSON.parse(client.notes_snapshot || "[]");
            const formattedNotes = parsedNotes.map((note, idx) => ({
              id: note.id || idx + 1,
              note_name: typeof note === 'string' ? note : note.note_name || ""
            }));
            setNotesData(formattedNotes);
          } else {
            setNotesData([]);
          }
        } catch (e) {
          console.error("Failed to parse snapshots", e);
          setServiceData([]);
          setComplimentaryData([]);
          setNotesData([]);
        }

        setAdditionalServiceData([]);
        setDiscountDataSet(null);
        fetchDiscount();
        setProformaPayments([]);
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (publicMode && publicData) {
      setClientData(publicData.clientData || {});

      let parsedServices = [];
      if (publicData.clientData?.pricing_snapshot) {
        try {
          const parsed = JSON.parse(publicData.clientData.pricing_snapshot || "[]");
          let adsParsed = [];
          if (publicData.clientData?.ads_snapshot) {
            try { adsParsed = JSON.parse(publicData.clientData.ads_snapshot || "[]"); } catch(e) {}
          }
          const combined = [...parsed, ...adsParsed];
          const { dmServices, adsServices } = classifyProformaServices(combined);
          parsedServices = [...dmServices, ...adsServices];
        } catch (e) {
          console.error("Failed to parse publicData pricing_snapshot", e);
        }
      }

      if (parsedServices.length === 0) {
        const { dmServices, adsServices } = classifyProformaServices(publicData.serviceData || []);
        const mappedGraphicData = (publicData.graphicData || []).map(item => ({
          ...item,
          service_type: "Graphic Service",
          category_name: item.category_name || item.service_name || "",
          editing_type_name: (item.editing_type_name && item.editing_type_name !== "N/A" && item.editing_type_name !== "null" && item.editing_type_name !== "")
            ? item.editing_type_name
            : (item.category_name || item.service_name || "N/A")
        }));
        const mappedAdsData = (publicData.adsData || []).map(item => ({ ...item, service_type: "Ads Campaign" }));
        parsedServices = [...dmServices, ...adsServices, ...mappedGraphicData, ...mappedAdsData];
      }

      setServiceData(parsedServices);

      setComplimentaryData(publicData.complimentaryData || []);
      setDiscountDataSet(publicData.discountDataSet || null);
      setAdditionalServiceData(publicData.additionalServiceData || []);
      setRemainingAmountData(publicData.remainingAmountData || []);
      setNotesData(publicData.notesData || []);
      setProformaPayments(publicData.proformaPayments || []);
      setPredefinedNotes([]);
      setLoading(false);
      return;
    }

    if (isBalanceProforma) {
      fetchBalanceProformaData();
      fetchPredefinedNotes();
    } else if (docTypeFromURL === "proforma" || sourceFromURL === "proposal") {
      fetchProformaData();
      fetchPredefinedNotes();
    } else if (sourceFromURL === "proposal_invoice") {
      fetchProposalInvoiceData();
      fetchPredefinedNotes();
    } else {
      if (txnIdFromURL) {
        fetchProformaPayments(txn_id, id);
      } else {
        setProformaPayments([]);
      }
      fetchServices();
      fetchClient();
      fetchClientNotes();
      fetchComplimentaryData();
      fetchDiscount();
      fetchDiscountSetting();
      fetchPredefinedNotes();
      fetchRemainingAmount();
      fetchAdditionservice();
    }
  }, [id, txn_id, docTypeFromURL, sourceFromURL, txnIdFromURL, isBalanceProforma, publicMode, publicData]);


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
    if (!Array.isArray(serviceData) || serviceData.length === 0) {
      setLoading(false);
      return;
    }

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

      const quantity = parseAmount(item.quantity) || 1;
      const price = parseAmount(item.editing_type_amount);
      const include_content_posting = getOptionalAmountFromItem(item, [
        "include_content_posting",
        "include_meta_growth_&_content_management",
      ]);
      const include_thumbnail_creation = getOptionalAmountFromItem(item, [
        "include_thumbnail_creation",
      ]);

      let include_youtube_video_posting = getOptionalAmountFromItem(item, [
        "include_youtube_video_posting",
        "include_youtube_channel_growth_&_optimization",
      ]);

      // Fallback: some invoice records include this amount only in total_amount.
      if (include_youtube_video_posting <= 0) {
        const rowTotal = parseAmount(item.total_amount);
        const knownTotal =
          quantity *
          (price + include_content_posting + include_thumbnail_creation);
        const inferredYoutube = rowTotal - knownTotal;
        if (inferredYoutube > 0) {
          include_youtube_video_posting = Number(
            (inferredYoutube / quantity).toFixed(2)
          );
        }
      }

      const catName = item.category_name || item.service_name || "N/A";
      const typeName = (item.editing_type_name && item.editing_type_name !== "N/A" && item.editing_type_name !== "null" && item.editing_type_name.trim() !== "")
        ? item.editing_type_name
        : catName;

      service.editingTypes.push({
        category: catName,
        type: typeName,
        quantity,
        price,
        include_content_posting,
        include_thumbnail_creation,
        include_youtube_video_posting,
        total: parseAmount(item.total_amount),
      });
    });

    setGraphicData(groupedGraphic);

    setAdsData(adsRaw);
    setLoading(false);
  }, [serviceData]);

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
      // Amount type â†’ discount_amt = direct rupee value, discount_per = calculated %
      // Percent type â†’ discount_per = entered %, discount_amt = calculated rupee value
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
      setClientData((prev) => (prev ? { ...prev, discount_snapshot: null } : prev));
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
        `${baseURL}/auth/api/re_calculator/updateRemainingDataById/${isEditingRemaining}`,
        payload
      )
      : axios.post(
        `${baseURL}/auth/api/re_calculator/saveRemainingAmountData`,
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
          `${baseURL}/auth/api/re_calculator/updateInvoiceClientNoteDataById/${selectedNotesId.id}`,
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
          `${baseURL}/auth/api/re_calculator/addNotebyplan`,
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
        `${baseURL}/auth/api/re_calculator/deleteInvoiceClientNotes/${noteId}`
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
        (editSum, edit) => {
          // Service Charge (ads % charge) hamesha count hoga — hide/show sirf budget line pe apply hoti hai
          return editSum + (edit.total || edit.price * edit.quantity);
        },
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
  //   const totalBudget = Number(ad.charge || 0);

  //   return sum + totalBudget;
  // }, 0);


  const grandTotal = graphicTotal + additionalTotal;

  const thumbTotal = graphicData
    .flatMap((s) => s.editingTypes.filter((e) => Number(e.include_thumbnail_creation) > 0))
    .reduce((sum, e) => sum + Number(e.include_thumbnail_creation) * Number(e.quantity), 0);
  const postTotal = graphicData
    .flatMap((s) => s.editingTypes.filter((e) => Number(e.include_content_posting) > 0))
    .reduce((sum, e) => sum + Number(e.include_content_posting) * Number(e.quantity), 0);
  const ytTotal = graphicData
    .flatMap((s) => s.editingTypes.filter((e) => Number(e.include_youtube_video_posting) > 0))
    .reduce((sum, e) => sum + Number(e.include_youtube_video_posting) * Number(e.quantity), 0);
  const addTotal = additionalServiceData.reduce((sum, e) => {
    const amount = e.total_amount !== null && e.total_amount !== undefined
      ? Number(e.total_amount || 0)
      : Number(e.editing_type_amount || e.price || 0) * Number(e.quantity || 1);
    return sum + Number(amount || 0);
  }, 0);
  const dmServiceTotal = graphicTotal + thumbTotal + postTotal + ytTotal + addTotal;

  // Apply discount percentage only for display
  // Compute discounted amount based on type
  const discountAmount = selecteddiscount
    ? selecteddiscount.discount_type === "percent"
      ? (grandTotal * Number(selecteddiscount.discount_per)) / 100
      : selecteddiscount.discount_type === "amount"
        ? Number(selecteddiscount.discount_amt)
        : 0
    : 0;

  // Grand total after discount
  const totalAfterDiscount = grandTotal - discountAmount;

  const realizedAdBudget = Number(clientData?.realized_ad_budget || 0);
  const realizedGoogleBudget = Number(clientData?.realized_google_budget || 0);
  const realizedMetaBudget = Number(clientData?.realized_meta_budget || 0);

  const isPendingOrProforma = isProforma || clientData?.tag_received_amt === "pending";

  const visibleGoogleBudget = (clientData?.invoice_source === "proposal" && !isProforma)
    ? realizedGoogleBudget
    : (isPendingOrProforma || clientData?.invoice_source === "manual")
      ? adsData.reduce((sum, ad) => {
        const cat = (ad.category_name || "").toLowerCase();
        if (cat.includes("google") && showGoogleAd) {
          return sum + Number(ad.amount || ad.budget || 0);
        }
        return sum;
      }, 0)
      : realizedGoogleBudget;

  const visibleMetaBudget = (clientData?.invoice_source === "proposal" && !isProforma)
    ? realizedMetaBudget
    : (isPendingOrProforma || clientData?.invoice_source === "manual")
      ? adsData.reduce((sum, ad) => {
        const cat = (ad.category_name || "").toLowerCase();
        if (cat.includes("meta") && showMetaAd) {
          return sum + Number(ad.amount || ad.budget || 0);
        }
        return sum;
      }, 0)
      : realizedMetaBudget;

  const visibleAdBudget = visibleGoogleBudget + visibleMetaBudget;

  // ── Partial Payment Detection ──
  const isPartialPayment =
    clientData?.tag_received_amt === "partial" ||
    (Number(clientData?.received_amt || 0) > 0 &&
      Number(clientData?.current_amt || 0) > 0);

  // ── Amount received this payment cycle ──
  const currentBillGrossReceived = Number(clientData?.received_amt || 0);

  // ── Ad Budget realized this payment (saved from modal) ──
  // (already defined above as realizedAdBudget)

  // ── Services portion (received minus ad budget) ──
  const amountForServicesIncGst = Math.max(currentBillGrossReceived - realizedAdBudget, 0);

  // ── Active Taxable Subtotal ──
  const activeTaxableSubtotal = isGST
    ? Number((amountForServicesIncGst / 1.18).toFixed(2))
    : amountForServicesIncGst;

  // Past Taxable Subtotal (already paid)
  const pastReceivedAmountForCalc = Number(clientData?.total_past_received || 0);
  const pastAdBudgetForCalc = Number(clientData?.total_past_ad_budget || 0);
  const pastServicesIncGst = Math.max(pastReceivedAmountForCalc - pastAdBudgetForCalc, 0);
  const pastActiveTaxableSubtotal = isGST
    ? Number((pastServicesIncGst / 1.18).toFixed(2))
    : pastServicesIncGst;

  // ── Project Value Deferred to future bills ──
  const projectValueDeferred = Math.max(totalAfterDiscount - activeTaxableSubtotal - pastActiveTaxableSubtotal, 0);

  // ── GST Amount (conditional) ──
  const gstAmount = isGST
    ? (isPartialPayment && currentBillGrossReceived > 0)
      ? activeTaxableSubtotal * 0.18
      : totalAfterDiscount * 0.18
    : 0;

  const totalgstamount = gstAmount + totalAfterDiscount;
  const currentTotalAmount = totalgstamount + Number(clientData.previous_amt || 0);
  const invoiceSubtotal = Math.max(totalAfterDiscount, 0);
  const invoiceTotal = invoiceSubtotal + gstAmount;

  // Explicitly calculate the active billed amount
  const activeInvoiceTotal = (isPartialPayment && currentBillGrossReceived > 0)
    ? activeTaxableSubtotal + gstAmount
    : invoiceTotal;

  const budgetAwareCurrentTotalAmount = currentTotalAmount + visibleAdBudget;

  const totalProformaReceivedAmount = proformaPayments.reduce(
    (sum, payment) => sum + parseAmount(payment.amount),
    0
  );
  const totalProformaSettledAmount = proformaPayments.reduce(
    (sum, payment) =>
      sum + parseAmount(payment.final_amount || payment.amount),
    0
  );
  const totalProformaTdsAmount = proformaPayments.reduce(
    (sum, payment) => sum + parseAmount(payment.tds_amount),
    0
  );
  const previousAmountForSummary = Number(clientData.previous_amt || 0);
  const pastReceivedAmount = Number(clientData.total_past_received || 0);
  const previousInvoiceNo = clientData.previous_invoice_no || null;
  const previousInvoiceDate = clientData.previous_invoice_date ? moment(clientData.previous_invoice_date).format("DD-MMM-YYYY") : null;
  const savedReceivedAmountForSummary = Number(clientData.received_amt || 0);
  const receivedAmountForSummary =
    isProforma && proformaPayments.length > 0 && !txnIdFromURL
      ? totalProformaReceivedAmount
      : savedReceivedAmountForSummary;
  const receivedAmountForBalance =
    isProforma && proformaPayments.length > 0 && !txnIdFromURL
      ? totalProformaSettledAmount
      : savedReceivedAmountForSummary;
  const hasReceivedAmount = receivedAmountForSummary > 0;

  // When viewing a specific payment invoice directly (txnIdFromURL) → use its own tds_amount
  // When viewing the proforma aggregate (no txnIdFromURL, isProforma) → sum all payment TDS
  // When viewing a final/direct invoice (no txnIdFromURL, not isProforma) → use DB tds_amount
  const tdsAmountToShow = txnIdFromURL
    ? Number(clientData.tds_amount || 0)
    : (isProforma && proformaPayments.length > 0)
      ? totalProformaTdsAmount
      : Number(clientData.tds_amount || 0);

  // ✅ Fixed logic: current_amt > 0 means a partial payment was already saved

  // ✅ Visible Ad Budget ko Current Balance calculation me include karo
  const calculatedSummaryBalance = (() => {
    const savedOutstanding = Number(clientData.current_amt || 0);
    const hasOutstandingBalance = savedOutstanding > 0;
    const hasSavedOutstandingFromPartial = hasOutstandingBalance && hasReceivedAmount;

    if (hasSavedOutstandingFromPartial) {
      // Partial payment already saved: DB ka outstanding seedha use karo
      return savedOutstanding;
    } else {
      // 1st payment: invoice + visible budget + previous amount - received
      return Math.max(
        previousAmountForSummary + invoiceTotal + visibleAdBudget - receivedAmountForBalance,
        0
      );
    }
  })();

  const summaryCurrentBalance = txnIdFromURL
    ? Number(clientData.current_amt || 0)
    : clientData.tag_received_amt === "received"
      ? 0
      : calculatedSummaryBalance;
  const currentBalanceTextClass = "font-extrabold text-lg text-green-800";
  const floorAmount = (value) => Number(value || 0);
  const formatAmountNoDecimals = (value) => Math.round(floorAmount(value)).toLocaleString("en-IN");
  const formatAmount = (value) => floorAmount(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const netBankAmount = receivedAmountForSummary - tdsAmountToShow;
  const hasPayment = (clientData.tag_received_amt === "received" || hasReceivedAmount || receivedAmountForSummary > 0);
  const totalForWords = hasPayment ? netBankAmount : (activeInvoiceTotal + visibleAdBudget);
  const safeTotal = Math.round(Number(totalForWords) || 0);
  const amountInWords = safeTotal > 0
    ? inrToWords(safeTotal)
    : "Zero Rupees Only";

  if (loading) {
    return (
      <div className="text-center p-10 font-semibold text-gray-700">
        Loading...
      </div>
    );
  }

  const previousBalance = Number(clientData.previous_amt || 0);


  const totalcurrentamount = Number(clientData.current_amt || 0);
  const hasSavedOutstandingFromPartial =
    totalcurrentamount > 0 && receivedAmountForSummary > 0;
  // ✅ Received Amount limit bhi wahi ho jo budget add hone ke baad Current Balance hai
  const totalDueForReceived =
    hasSavedOutstandingFromPartial ? totalcurrentamount : budgetAwareCurrentTotalAmount;

  // Calculate Current Amount (Outstanding)




  const handlePrintPage = () => {
    const docName = isBalanceProforma 
      ? "Balance Proforma Invoice" 
      : (isProforma ? "Proforma Invoice" : "Invoice");
    document.title = clientOrganization
      ? `${clientOrganization} ${docName}`
      : `${clientName} ${docName}`;
    window.print();
  };

  const handleDownload = async () => {
    try {
      const invoiceElement = document.getElementById("invoice-content");

      if (!invoiceElement) {
        alert("Invoice element not found!");
        return;
      }

      // 1. Clone element banayein taaki active screen distrub na ho
      const invoiceClone = invoiceElement.cloneNode(true);
      const originalImages = invoiceElement.getElementsByTagName("img");
      const clonedImages = invoiceClone.getElementsByTagName("img");

      // 2. Images ko automatic Base64 data URL me convert karein
      for (let i = 0; i < originalImages.length; i++) {
        const altText = (originalImages[i].getAttribute("alt") || "").toLowerCase();

        if (
          altText.includes("signature") || 
          altText.includes("authorized") ||
          altText.includes("footer") ||
          altText.includes("header")
        ) {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = originalImages[i].naturalWidth || originalImages[i].width;
            canvas.height = originalImages[i].naturalHeight || originalImages[i].height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(originalImages[i], 0, 0);

            // Base64 direct source assign karein cloned image ko
            clonedImages[i].src = canvas.toDataURL("image/png");
          } catch (imgErr) {
            console.error("Image base64 conversion failed, fallback to relative:", imgErr);
          }
        }
      }

      const origin = window.location.origin;
      const fullHtmlCode = `
      <html>
         <head>
          <base href="${origin}/">
          <meta charset="utf-8">
          <title>Invoice Layout</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; background-color: white; }

            .print\\:hidden { display: none !important; }

            @media print {
              @page {
                size: A4;
                margin: 0mm;
              }
              body, html { margin: 0 !important; padding: 0 !important; height: auto !important; overflow: visible !important; }
              
              /* ✅ FIX 1: Remove forced heights that cause spillover to next page */
              .page-wrapper {
                min-height: auto !important;
                height: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                page-break-after: avoid !important;
              }

              /* ✅ FIX 2: Footer div ko wapas fixed position pe rakho */
              .print-fixed-footer {
                position: fixed !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                width: 100% !important;
                height: 25mm !important;
                display: flex !important;
                pointer-events: none !important;
                z-index: 9999 !important;
              }

              .print-fixed-footer img {
                width: 100% !important;
                height: 100% !important;
                object-fit: fill !important;
              }

              table { page-break-inside: auto; }
              tr    { page-break-inside: avoid; page-break-after: auto; }
              thead { display: table-header-group !important; }
              tfoot { display: table-footer-group !important; }
            }
          </style>
        </head>
        <body class="bg-white p-0 m-0">
          ${invoiceClone.outerHTML}
        </body>
      </html>
    `;

      // 4. File configuration filename selection
      const dynamicFileName = clientOrganization
        ? `${clientOrganization.replace(/\s+/g, '_')}_Invoice`
        : `${clientName.replace(/\s+/g, '_')}_Invoice`;

      // Assign dynamic filename to window title so default PDF save name matches
      const originalTitle = document.title;
      document.title = dynamicFileName;

      // Print directly from the frontend since we already generated the full HTML
      const printWindow = window.open('', '_blank');
      printWindow.document.open();
      printWindow.document.write(fullHtmlCode);
      printWindow.document.title = dynamicFileName;
      printWindow.document.close();
      
      printWindow.onload = () => {
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          // Restore original title
          document.title = originalTitle;
        }, 500);
      };

    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please check console logs.");
    }
  };

  const uniquePredefinedNotes = predefinedNotes.filter(
    (p) =>
      !notesData.some((c) => c.note_name === p.note_text) &&
      !selectedNotes.some((s) => s.note_name === p.note_text)
  );
  return (
    <InvoicePrintWrapper>
      <div id="invoice-content" className="page-wrapper w-[210mm] min-h-[297mm] flex flex-col justify-between p-4 mx-auto bg-white print:break-after-page print:p-0 print:m-0 print:h-auto print:block">
        {/* Hidden on print - Action Buttons */ }

        <div data-html2canvas-ignore="true" className={ `print:hidden ${publicMode ? '' : ''} flex justify-end gap-3 my-4` }>
          { !publicMode && (
            <button
              onClick={ handlePrintPage }
              target="_blank"
              className="bg-red-600    text-white rounded-full px-4 py-2"
            >
              Print
            </button>
          ) }

          <button
            onClick={ handleDownload }
            className="bg-orange-600 text-white rounded-full px-4 py-2"
          >
            Download
          </button>

          { !publicMode && (
            <>
              <button
                onClick={ () => navigate(`${basePath}/dashboard`) }
                className="bg-yellow-600 text-white rounded-full px-4 py-2"
              >
                Dashboard
              </button>
              <button
                onClick={ () => navigate(-1) }
                className="bg-gray-600 text-white rounded-full px-4 py-2"
              >
                Back
              </button>
            </>
          ) }
        </div>


        {/* Table for proper header/footer repetition */ }
        <table className="print:table print:border-collapse w-full print:m-0 print:p-0">
          {/* Repeating Header */ }
          <DocumentHeaderBanner isGST={isGST} />

          {/* Main Content */ }
          <tbody className="print:table-row-group">
            <tr>
              <td className="p-0 m-0 align-top">
                <div className="print:block flex flex-col px-6 py-1 print:px-4 print:py-4 print:pt-6 pt-4">

                  <div className="w-full">
                      <div className="mb-1 text-center">
                        <p className="text-sm font-bold tracking-wide uppercase">
                          { isProforma 
                              ? (isBalanceProforma ? "BALANCE PROFORMA INVOICE" : "PROFORMA INVOICE") 
                              : "INVOICE" }
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
                              { isBalanceProforma && clientData?.source_proforma_number && (
                                <div className="text-gray-500 font-semibold text-[11px] mt-0.5">
                                  Ref: { clientData.source_proforma_number }
                                </div>
                              ) }
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
                        <p>
                          <strong>Email:</strong> { clientData?.email || "N/A" }
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
                      <DocumentCompanyFrom isGST={isGST} className="mt-1" />
                    </div>

                    {/* ==================== COMBINED SERVICES TABLE ==================== */ }
                    { (graphicData.length > 0 ||
                      complimentaryData.length > 0 ||
                      additionalServiceData.length > 0 ||
                      adsData.length > 0) && (
                        <section className="mb-2 text-sm">
                          <table className="w-full border text-xs">
                            <thead style={ { background: "#e8edff", color: "#111827", fontSize: "11px" } }>
                              <tr>
                                <th style={ { border: "1px solid #cfd8e3", padding: "6px 7px", textAlign: "left" } } className="w-[10rem]">
                                  Services
                                </th>
                                <th style={ { border: "1px solid #cfd8e3", padding: "6px 7px", textAlign: "left" } } className="w-[20rem]">
                                  Categories
                                </th>
                                <th style={ { border: "1px solid #cfd8e3", padding: "6px 7px", textAlign: "right" } }>
                                  Quantity
                                </th>
                                <th style={ { border: "1px solid #cfd8e3", padding: "6px 7px", textAlign: "right" } }>
                                  Price (₹)
                                </th>
                                <th style={ { border: "1px solid #cfd8e3", padding: "6px 7px", textAlign: "right" } }>
                                  Total (₹)
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              {/* ================= GRAPHIC SERVICES (Grouped by Service) ================= */}
                              { graphicData.map((service, idx) => {
                                // Service Charge (ads % charge) hamesha visible rahega
                                // Hide/Show checkboxes sirf Ads Budget amounts pe apply hoti hain
                                const visibleEditingTypes = service.editingTypes;

                                if (visibleEditingTypes.length === 0) return null;

                                return visibleEditingTypes.map((edit, eidx) => {
                                  const qty = Number(edit.quantity || 1);
                                  const base = Number(edit.price || 0);
                                  const totalBase = base * qty;

                                  return (
                                    <tr
                                      key={ `graphic-${idx}-${eidx}` }
                                      className="bg-white"
                                    >
                                      {/* Show Services name only once using rowspan */ }
                                      { eidx === 0 ? (
                                        <td
                                          className="border px-2 py-1 align-center"
                                          rowSpan={ visibleEditingTypes.length }
                                        >
                                          { (service.service && service.service.toLowerCase() === "proposal item") ? edit.category || service.service : service.service }
                                        </td>
                                      ) : null }

                                      <td className="border px-2 py-1">
                                        {(() => {
                                          if (service.service === "Service Charge") {
                                            return edit.type && edit.type !== "N/A" && edit.type.toLowerCase().includes("management")
                                              ? edit.type
                                              : `${edit.category && !edit.category.toLowerCase().includes("campaign") ? edit.category + " Campaign" : (edit.category || "")} ${edit.type || "Management & Optimization"}`.trim();
                                          }

                                          const cat = edit.category && edit.category !== "N/A" ? edit.category : "";
                                          const type =
                                            edit.type &&
                                            edit.type !== "N/A" &&
                                            edit.type !== "null" &&
                                            edit.type !== "undefined" &&
                                            edit.type.trim() !== "" &&
                                            edit.type.toLowerCase() !== "proposal item"
                                              ? edit.type.trim()
                                              : "";

                                          if (
                                            cat &&
                                            type &&
                                            cat.trim().toLowerCase() !== type.toLowerCase() &&
                                            type.toLowerCase() !== (service.service || "").trim().toLowerCase()
                                          ) {
                                            return `${cat} (${type})`;
                                          }
                                          return cat || type || service.service;
                                        })()}
                                      </td>
                                      <td className="border px-2 py-1 text-right">
                                        { qty }
                                      </td>
                                      <td className="border px-2 py-1 text-right">
                                        ₹{ formatAmountNoDecimals(base) }
                                      </td>
                                      <td className="border px-2 py-1 text-right">
                                        ₹{ formatAmountNoDecimals(totalBase) }
                                      </td>
                                    </tr>
                                  );
                                });
                              }) }




                            </tbody>
                            <tfoot style={ { background: "#f5f8fc", fontWeight: 800, border: "1px solid #cfd8e3" } }>
                              <tr>
                                <td className="border px-2 py-1 text-right font-bold" colSpan={ 4 }>Services Total</td>
                                <td className="border px-2 py-1 text-right font-bold w-[15%]">
                                  ₹{ formatAmountNoDecimals(dmServiceTotal) }
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </section>
                      ) }



                    {/* ================= COMPLIMENTARY SERVICES TABLE ================= */ }
                    { complimentaryData.length > 0 && (
                      <section className=" text-sm mt-2">
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
                              const price = Number(svc.editing_type_amount || svc.price || svc.amount || 0);
                              return (
                                <tr key={ `comp-${idx}` } className="bg-white">
                                  <td className="border px-2 py-1 font-medium">{ String((svc.service_name && svc.service_name.toLowerCase() === "proposal item") ? (svc.category_name || svc.service_name) : (svc.service_name || svc.category_name || "N/A")).replace(/\s*\((complimentary|complimntory)\)\s*$/i, "").trim() }</td>
                                  <td className="border px-2 py-1">{ String((svc.editing_type_name && svc.editing_type_name.toLowerCase() === "proposal item") ? (svc.service || svc.category_name || svc.editing_type_name) : ((svc.editing_type_name && svc.editing_type_name !== "null") ? svc.editing_type_name : "-")).replace(/\s*\((complimentary|complimntory)\)\s*$/i, "").trim() }</td>
                                  <td className="border px-2 py-1 text-right">{ qty }</td>
                                  <td className="border px-2 py-1 text-right">₹{ formatAmount(price) }</td>
                                  <td className="border px-2 py-1 text-right">₹{ formatAmount(price * qty) }</td>
                                </tr>
                              );
                            }) }
                          </tbody>
                          <tfoot>
                            <tr className="bg-green-50">
                              <td colSpan={ 4 } className="border px-2 py-1 text-right font-semibold">Total</td>
                              <td className="border px-2 py-1 text-right font-semibold">
                                ₹{ formatAmount(complimentaryData.reduce((sum, svc) => sum + (Number(svc.editing_type_amount || svc.price || svc.amount || 0) * Number(svc.quantity || 1)), 0)) }</td>
                            </tr>
                            <tr className="bg-green-100 font-bold">
                              <td colSpan={ 4 } className="border px-2 py-1 text-right text-green-900">Complimentary Total (Free)</td>
                              <td className="border px-2 py-1 text-right text-green-900">₹0</td>
                            </tr>
                          </tfoot>
                        </table>
                      </section>
                    ) }


                    {/* ================= TOTALS SUMMARY ================= */ }
                    { (graphicData.length > 0 || additionalServiceData.length > 0 || adsData.length > 0 || complimentaryData.length > 0) && (
                      <section className="mb-2 text-sm mt-2">
                        <table className="w-full border text-xs">
                          <tbody>
                            { selecteddiscount && discountAmount > 0 && (
                                    <tr style={ { color: "#dc2626", background: "#fef2f2", fontWeight: 700 } }>
                                      <td className="border px-2 py-1 text-right" colSpan={ 4 }>Discount</td>
                                      <td className="border px-2 py-1 text-right w-[15%]">
                                        -₹{ formatAmountNoDecimals(discountAmount) }
                                      </td>
                                    </tr>
                                  ) }
                                  <tr className="bg-orange-50 font-semibold">
                                    <td className="border px-2 py-1 text-right" colSpan={ 4 }>Subtotal</td>
                                    <td className="border px-2 py-1 text-right w-[15%]">
                                      ₹{ formatAmountNoDecimals(invoiceSubtotal) }
                                    </td>
                                  </tr>
                          </tbody>
                        </table>
                      </section>
                    ) }

                    { clientData.tag_received_amt !== "received" && !publicMode && isProforma && (
                      <div className="print:hidden my-2 flex items-center gap-2">

                        <button
                          onClick={ handleShowDiscount }
                          className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-semibold shadow-sm flex items-center gap-1 transition-colors"
                          title="Add/Edit Discount"
                        >
                          { selecteddiscount ? "Edit Discount" : "+ Discount" }
                        </button>
                      </div>
                    ) }



                  </div>
                </div>


                {/* Terms & Conditions + Bank Details Section */ }


                {/* Terms & Conditions + Bank Details Section */ }
                <section className={ `terms-bank-section print:block px-6 py-1 text-sm text-gray-800 border-t mt-1` }>
                  <div className="bank-details-section flex w-full border border-gray-300 rounded-md mt-1 overflow-hidden">
                      <DocumentBankDetails isGST={isGST} />

                    {/* RIGHT SIDE: Table-like layout */ }
                    <div className="w-[55%] flex flex-col text-xs bg-white">
                      <div className="flex flex-col">
                        { isPartialPayment && currentBillGrossReceived > 0 ? (
                          <>
                            <div style={ { background: "#f5f8fc", fontWeight: 800, color: "#111827" } } className="flex justify-between items-center px-3 py-1 border-b border-gray-100">
                              <span className="text-gray-600">Total Project Base Value</span>
                              <span className="text-gray-900 font-medium">₹{ formatAmount(totalAfterDiscount) }</span>
                            </div>
                            { pastActiveTaxableSubtotal > 0 && (
                              <div style={ { background: "white", color: "#5f6b7a", fontWeight: "normal" } } className="flex justify-between items-center px-3 py-1 border-b border-gray-100">
                                <span className="text-gray-600">Less: Taxable Value Billed Earlier</span>
                                <span className="text-gray-900 font-medium">-₹{ formatAmount(pastActiveTaxableSubtotal) }</span>
                              </div>
                            ) }
                            { projectValueDeferred > 0 && (
                              <div style={ { background: "#fef2f2", color: "#dc2626", fontWeight: 700 } } className="flex justify-between items-center px-3 py-1 border-b border-gray-100">
                                <span>Less: Amount to be Billed Separately</span>
                                <span className="font-medium">-₹{ formatAmount(projectValueDeferred) }</span>
                              </div>
                            ) }
                            <div style={ { background: "#e8edff", color: "#111827", fontWeight: 800 } } className="flex justify-between items-center px-3 py-1 border-b border-gray-200">
                              <span className="text-gray-800">Net Taxable Value</span>
                              <span className="text-gray-900">₹{ formatAmount(activeTaxableSubtotal) }</span>
                            </div>
                            { isGST && (
                              <>
                                <div style={ { background: "white", color: "#5f6b7a", fontWeight: "normal" } } className="flex justify-between items-center px-3 py-1 border-b border-gray-100">
                                  <span className="text-gray-600">CGST @9%</span>
                                  <span className="text-gray-900 font-medium">₹{ formatAmount(gstAmount / 2) }</span>
                                </div>
                                <div style={ { background: "white", color: "#5f6b7a", fontWeight: "normal" } } className="flex justify-between items-center px-3 py-1 border-b border-gray-100">
                                  <span className="text-gray-600">SGST @9%</span>
                                  <span className="text-gray-900 font-medium">₹{ formatAmount(gstAmount / 2) }</span>
                                </div>
                              </>
                            ) }

                          </>
                        ) : (
                          isGST && (
                            <>
                              <div style={ { background: "white", color: "#5f6b7a", fontWeight: "normal" } } className="flex justify-between items-center px-3 py-1 border-b border-gray-100">
                                <span className="text-gray-600">Taxable Amount</span>
                                <span className="text-gray-900 font-medium">₹{ formatAmount(invoiceSubtotal) }</span>
                              </div>
                              <div style={ { background: "white", color: "#5f6b7a", fontWeight: "normal" } } className="flex justify-between items-center px-3 py-1 border-b border-gray-100">
                                <span className="text-gray-600">CGST @9%</span>
                                <span className="text-gray-900 font-medium">₹{ formatAmount(gstAmount / 2) }</span>
                              </div>
                              <div style={ { background: "white", color: "#5f6b7a", fontWeight: "normal" } } className="flex justify-between items-center px-3 py-1 border-b border-gray-100">
                                <span className="text-gray-600">SGST @9%</span>
                                <span className="text-gray-900 font-medium">₹{ formatAmount(gstAmount / 2) }</span>
                              </div>

                            </>
                          )
                        ) }

                        <div style={ { background: "#dcf7e8", color: "#047968", fontWeight: 900 } } className="flex justify-between items-center px-3 py-1.5 border-b border-gray-100">
                          <span className="font-bold text-xs">Total Service Amount</span>
                          <span className="font-bold text-xs">
                            ₹{ formatAmountNoDecimals(activeInvoiceTotal) }
                          </span>
                        </div>
                      </div>

                      {/* Payment / Ad Budget Summary */ }
                      { (hasReceivedAmount || receivedAmountForSummary > 0 || clientData?.invoice_source === "proposal" || isProforma || visibleAdBudget > 0) && (
                        <div className="flex flex-col border-b border-gray-100">
                          { visibleGoogleBudget > 0 && (
                            <div style={ { background: "white", color: "#5f6b7a", fontWeight: "normal" } } className="flex justify-between items-center px-3 py-1 border-b border-gray-100">
                              <span className="text-gray-600">Google Ad Budget  (Reimbursable)</span>
                              <span className="text-gray-900 font-medium">₹{ formatAmountNoDecimals(visibleGoogleBudget) }</span>
                            </div>
                          ) }
                          { visibleMetaBudget > 0 && (
                            <div style={ { background: "white", color: "#5f6b7a", fontWeight: "normal" } } className="flex justify-between items-center px-3 py-1 border-b border-gray-100">
                              <span className="text-gray-600">Meta Ad Budget  (Reimbursable)</span>
                              <span className="text-gray-900 font-medium">₹{ formatAmountNoDecimals(visibleMetaBudget) }</span>
                            </div>
                          ) }
                          { visibleAdBudget > 0 && !hasPayment && (
                            <div style={ { background: "#dcf7e8", color: "#047968", fontWeight: 900 } } className="flex justify-between items-center px-3 py-1.5 border-b border-gray-100">
                              <span className="font-bold text-xs">Grand Total</span>
                              <span className="font-bold text-xs">
                                ₹{ formatAmountNoDecimals(activeInvoiceTotal + visibleAdBudget) }
                              </span>
                            </div>
                          ) }
                          { hasPayment && (
                            <>
                              <div style={ { background: "#dcf7e8", color: "#047968", fontWeight: 900 } } className="flex justify-between items-center px-3 py-1 border-b border-gray-100">
                                <span className="text-gray-600">Gross Payments Received (Now)</span>
                                <span className="text-gray-900 font-medium">₹{ formatAmountNoDecimals(receivedAmountForSummary) }</span>
                              </div>
                              { tdsAmountToShow > 0 && (
                                <div style={ { background: "#fef2f2", color: "#dc2626", fontWeight: 700 } } className="flex justify-between items-center px-3 py-1 border-b border-gray-100">
                                  <span className="text-red-600">Less: TDS Deducted</span>
                                  <span className="text-red-600 font-medium">₹{ formatAmountNoDecimals(tdsAmountToShow) }</span>
                                </div>
                              ) }
                              <div style={ { background: "#dcf7e8", color: "#047968", fontWeight: 900 } } className="flex justify-between items-center px-3 py-1.5 border-b border-gray-100">
                                <span className="font-bold text-yellow-700">Net Amount Credited to Bank</span>
                                <span className="font-bold text-yellow-700">₹{ formatAmountNoDecimals(receivedAmountForSummary - tdsAmountToShow) }</span>
                              </div>
                            </>
                          ) }
                      { isBalanceProforma && (
                        <div className="flex flex-col border-t border-gray-200 mt-1 pt-1 bg-white">
                          <div style={ { background: "#f8fafc", color: "#334155" } } className="flex justify-between items-center px-3 py-1 border-b border-gray-100">
                            <span className="font-semibold text-xs text-gray-700">Received Amount</span>
                            <span className="font-bold text-xs text-gray-900">
                              ₹{ formatAmountNoDecimals(clientData?.received_amt || 0) }
                            </span>
                          </div>
                          <div style={ { background: "#ecfdf5", color: "#065f46" } } className="flex justify-between items-center px-3 py-1.5 border-b border-gray-100">
                            <span className="font-bold text-xs text-green-800">Current Balance</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-sm text-green-700">
                                ₹{ formatAmountNoDecimals(clientData?.current_amt || 0) }
                              </span>
                              { Number(clientData?.current_amt || 0) <= 0 && (
                                <span className="bg-green-200 text-green-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-green-400">
                                  Fully Paid
                                </span>
                              ) }
                            </div>
                          </div>
                        </div>
                      ) }
                    </div>
                  ) }
                </div>
              </div>

                  {/* Total in words right-aligned below */ }
                  <div className="flex justify-end mt-1 px-1 mb-2 amount-in-words-section">
                    <div className="text-right">
                      <span className="text-[10px] text-gray-500 italic block leading-tight">Total Amount (in words):</span>
                      <span style={ { color: "#1d4ed8", fontStyle: "italic", fontWeight: 700, fontSize: "12px", textAlign: "right" } } className="capitalize leading-tight">{ amountInWords } </span>
                    </div>
                  </div>

                  { isProforma && !isBalanceProforma && proformaPayments.length > 0 && (
                    <div className="payment-history-section w-full text-left pt-2 border-t border-gray-300">
                      <h2 className="font-bold mb-1 text-gray-800">
                        Payment History
                      </h2>
                      <table className="w-full border text-xs">
                        <thead className="bg-orange-100">
                          <tr>
                            <th className="border px-2 py-1 text-left">Date</th>
                            <th className="border px-2 py-1 text-left">TXN ID</th>
                            <th className="border px-2 py-1 text-left">Mode</th>
                            <th className="border px-2 py-1 text-left">Ref</th>
                            <th className="border px-2 py-1 text-right">TDS</th>
                            <th className="border px-2 py-1 text-right">Received Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          { proformaPayments.map((payment) => {
                            const tdsAmount = parseAmount(payment.tds_amount);
                            return (
                              <tr key={ payment.id } className="bg-white">
                                <td className="border px-2 py-1 whitespace-nowrap">
                                  { payment.txn_id ? (
                                    <a
                                      href={ `/#/admin/invoice/${id}/${txn_id}?doc=proforma&source=proposal&txnId=${payment.txn_id}` }
                                      className="text-orange-600 hover:underline font-semibold"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      { moment(payment.payment_date).format("DD MMM YYYY") } 🔗
                                    </a>
                                  ) : (
                                    moment(payment.payment_date).format("DD MMM YYYY")
                                  ) }
                                </td>
                                <td className="border px-2 py-1">
                                  { payment.txn_id ? (
                                    <span
                                      className="font-mono text-[10px] text-gray-600 cursor-pointer hover:text-orange-700"
                                      title={ payment.txn_id }
                                      onClick={ () => { navigator.clipboard.writeText(payment.txn_id); } }
                                    >
                                      { payment.txn_id.length > 20 ? payment.txn_id.slice(-20) : payment.txn_id } 📋
                                    </span>
                                  ) : "-" }
                                </td>
                                <td className="border px-2 py-1">
                                  { payment.payment_mode || "-" }
                                </td>
                                <td className="border px-2 py-1">
                                  { payment.transaction_reference || "-" }
                                </td>
                                <td className="border px-2 py-1 text-right">
                                  { payment.tds_applicable && tdsAmount > 0
                                    ? `₹${formatAmount(tdsAmount)} (${formatAmount(payment.tds_percentage)}%)`
                                    : "-" }
                                </td>
                                <td className="border px-2 py-1 text-right font-semibold">
                                  ₹{ formatAmount(payment.amount) }
                                </td>
                              </tr>
                            );
                          }) }
                        </tbody>
                      </table>
                    </div>
                  ) }

                  {/* 2. SECOND: Terms & Conditions (NEECHE) */ }
                  { (notesData?.length > 0 || visibleAdBudget > 0 || tdsAmountToShow > 0 || previousAmountForSummary > 0 || projectValueDeferred > 0) && (
                    <div className="terms-conditions-section w-full text-left pt-2 border-t border-gray-300">
                      <h2 className="font-bold mb-1 text-gray-800">
                        Terms &amp; Conditions
                      </h2>
                      <ul className="list-decimal ml-5 space-y-0.5 text-gray-700">
                        { visibleAdBudget > 0 && (() => {
                          let platforms = [];
                          if (adsData.some(ad => (ad.category_name || "").toLowerCase().includes("google"))) platforms.push("Google LLC");
                          if (adsData.some(ad => (ad.category_name || "").toLowerCase().includes("meta"))) platforms.push("Meta Platforms Inc.");
                          const platformNames = platforms.length > 0 ? platforms.join(" and/or ") : "Google LLC and/or Meta Platforms Inc.";
                          const shortNames = platforms.length > 0 ? platforms.map(p => p.split(" ")[0]).join(" and ") : "Google and Meta";

                          return (
                            // <li className="leading-relaxed mt-1 text-gray-700">
                            //   The Ad Budget of <strong>₹{ formatAmount(visibleAdBudget) }</strong> is a direct pass-through payment made to { platformNames } on your behalf. It is not revenue of DOAGuru InfoSystems. Ad performance and platform policies remain the responsibility of { shortNames }.
                            // </li>
                            <li className="leading-relaxed mt-1 text-gray-700">
                              The advertising budget shown in this invoice represents third-party media spend incurred on behalf of the client. This amount is a reimbursement only and does not form part of our service charges or revenue, in accordance with Rule 33 of the CGST Rules, 2017.
                            </li>
                          );
                        })() }
                        { tdsAmountToShow > 0 && (() => {
                          const tdsPercent = (tdsAmountToShow / activeTaxableSubtotal * 100).toFixed(1);
                          return (
                            // <li className="leading-relaxed mt-1 text-gray-700">
                            //   TDS @ <strong>{ tdsPercent.replace(".0", "") }%</strong> has been deducted on the taxable service (excluding GST and Ad Budget) under the Income Tax Act, 1961.
                            // </li>
                            <li className="leading-relaxed mt-1 text-gray-700">
                              TDS, wherever applicable, has been deducted in accordance with the applicable provisions of the Income-tax Act, 1961, and the corresponding Form 16A shall be provided after the prescribed deposit.
                            </li>
                          );
                        })() }
                        { pastReceivedAmount > 0 && previousInvoiceNo && (
                          // <li className="leading-relaxed mt-1 text-gray-700">
                          //   This invoice is in continuation of Invoice No. <strong>{ previousInvoiceNo }</strong> dated <strong>{ previousInvoiceDate }</strong>. Payment of <strong>₹{ formatAmount(pastReceivedAmount) }</strong> has already been received. This invoice covers the remaining outstanding balance.
                          // </li>
                          <li className="leading-relaxed mt-1 text-gray-700">
                            The taxable value already billed has been excluded from this invoice to avoid duplicate billing. This invoice covers only the remaining taxable value of the contract.
                          </li>
                        ) }
                        { projectValueDeferred > 0 && (
                          // <li className="leading-relaxed mt-1 text-gray-700">
                          //   An amount of <strong>₹{ formatAmount(projectValueDeferred + (isGST ? projectValueDeferred * 0.18 : 0)) }</strong> has been deferred and is not included in this invoice. It will be billed separately upon completion of the next project milestone or as mutually agreed.
                          // </li>
                          <li className="leading-relaxed mt-1 text-gray-700">
                            A portion of the contract value has been excluded from this invoice and will be billed separately in accordance with the agreed project scope and payment terms. GST shall be applicable at the time of such billing as per the provisions of the CGST Act, 2017.
                          </li>
                        ) }
                        { notesData?.map((note) => (
                          <li key={ note.id } className="leading-snug">
                            { note.note_name }
                            { clientData.tag_received_amt === "received" ? null : (
                              <div className={ `flex items-center gap-1 sm:gap-2 print:hidden ${publicMode ? '!hidden' : ''}` }>
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
                                  Edit
                                </button>
                                <button
                                  onClick={ () => handleDeleteClientNote(note.id) }
                                  className="bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mt-1"
                                  title="Delete"
                                >
                                  X
                                </button>
                              </div>
                            ) }
                          </li>
                        )) }
                      </ul>
                    </div>
                  ) }

                </section>




                <div className="border-t mt-0"></div>

              </td>
            </tr>
          </tbody>

          <tfoot className="print:table-footer-group">
            <tr>
              <td className="p-0 m-0">
                <div className="h-[25mm] w-full"></div>
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


        <InvoiceNoteModal
          show={showModal}
          onClose={handleCloseNote}
          onSubmit={handleSubmit}
          formDataNote={formDataNote}
          onChangeNote={handleChangeNote}
          isEditing={isEditing}
          loading={loading}
        />
        <RemainingPaymentModal
          show={showModalRemaining}
          onClose={() => { setShowModalRemaining(false); setFormDataRemaining({ service_name: "", price: "" }); }}
          onSubmit={handleRemainingSave}
          formDataRemaining={formDataRemaining}
          onChangeRemaining={handleChangeRemaining}
          isEditingRemaining={isEditingRemaining}
          loading={loading}
        />
        <InvoiceDiscountModal
          show={showModalDiscount}
          onClose={handleCloseDiscount}
          onSubmit={handleSaveDiscount}
          formDataDiscount={formDataDiscount}
          onChangeDiscount={handleChangeDiscount}
          onDeleteDiscount={handleDeleteDiscount}
          selecteddiscount={selecteddiscount}
          discountDataSet={discountDataSet}
          grandTotal={grandTotal}
          loading={loading}
        />
      </div>
    </InvoicePrintWrapper>
  );
}
