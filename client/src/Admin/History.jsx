import React, { useEffect, useRef, useState } from "react";
import {
  Calendar,
  Search,
  ArrowLeft,
  X,
  User,
  Phone,
  MapPin,
  Trash,
  ChevronDown,
  EyeIcon,
  CheckCircle2,
  Copy,
  FilePlus,
  Eye,
  XCircle,
  MoreVertical,
  FilePlus2,
  Building2,
  CreditCard,
  Hash,
  CalendarDays,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import axios from "axios";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import GenerateProformaModal from "./components/GenerateProformaModal";
import { classifyProformaServices, calcAdsRowTotal } from "../utils/proformaPricing";
import { clearUser } from "../redux/user/userSlice";
import Swal from "sweetalert2";
import QuotationTypeModal from "./QuotationTypeModal";
import Header from "../Components/Header";
import API_BASE_URL from "../config/apiBaseUrl";
import ProposalTable from "./components/ProposalTable";
import PaymentModal from "./components/PaymentModal";
import ProformaManagerModal from "./components/ProformaManagerModal";

const History = () => {
  const baseURL = API_BASE_URL;
  const navigate = useNavigate();
  const [fetchServices, setFetchServices] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [open, setOpen] = useState(false);

  // Workflow modals
  const [submitAdminModal, setSubmitAdminModal] = useState(false);
  const [sendClientModal, setSendClientModal] = useState(false);
  const [clientResponseModal, setClientResponseModal] = useState(false);
  const [receivePaymentModal, setReceivePaymentModal] = useState(false);
  const [strategyModal, setStrategyModal] = useState(false);
  const [sendStrategyModal, setSendStrategyModal] = useState(false);
  const [clientStrategyModal, setClientStrategyModal] = useState(false);
  const [teamLeadModal, setTeamLeadModal] = useState(false);
  const [taskOwnersModal, setTaskOwnersModal] = useState(false);

  // Send success states for retry functionality
  const [clientSendSuccess, setClientSendSuccess] = useState(false);
  const [strategySendSuccess, setStrategySendSuccess] = useState(false);

  // Workflow data
  const [selectedChannel, setSelectedChannel] = useState("email");
  const [workflowRemark, setWorkflowRemark] = useState("");
  const [strategyTasks, setStrategyTasks] = useState([
    { service_name: "", description: "", deadline: "" }
  ]);
  const [savedStrategy, setSavedStrategy] = useState([]);
  const [sfTeams, setSfTeams] = useState([]);
  const [sfTeamLeads, setSfTeamLeads] = useState([]);
  const [sfEmployees, setSfEmployees] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedTeamLead, setSelectedTeamLead] = useState(null);
  const [taskAssignments, setTaskAssignments] = useState([]);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [clientDecision, setClientDecision] = useState("");
  const [paymentSummaryLoading, setPaymentSummaryLoading] = useState(false);
  const [paymentSummary, setPaymentSummary] = useState({
    total_contract_value: 0,
    total_received_till_date: 0,
    pending_payment_amount: 0,
  });
  const [paymentEntry, setPaymentEntry] = useState({
    amount_received: "",
    payment_date: moment().format("YYYY-MM-DD"),
    payment_mode: "UPI",
    transaction_reference: "",
  });

  const qtStartRef = useRef(null);
  const qtEndRef = useRef(null);

  const openDatePicker = (ref) => {
    const input = ref.current;
    if (!input) return;
    if (typeof input.showPicker === "function") input.showPicker();
    else input.focus();
  };

  const toggleDropdown = () => setOpen(!open);
  const [loading, setLoading] = useState(false);

  const [createdInvoices, setCreatedInvoices] = useState({});
  const [clientDataReceived, setClientDataReceived] = useState({});

  const [clientData, setClientData] = useState([]);

  const [activeTab, setActiveTab] = useState('proposals');
  const [showProformaManager, setShowProformaManager] = useState(false);
  const [selectedProposalForManager, setSelectedProposalForManager] = useState(null);

  const openProformaManager = (proposal) => {
    setSelectedProposalForManager(proposal);
    setShowProformaManager(true);
  };
  const [proposals, setProposals] = useState([]);
  const [proposalKeyword, setProposalKeyword] = useState('');
  const getServiceDisplayName = (name) => {
    if (!name) return name;
    const n = name.toLowerCase();
    if (n.includes("content posting")) return "Meta Growth & Content Management";
    if (n.includes("youtube video posting")) return "YouTube Channel Growth & Optimization";
    if (n.includes("google ad")) return "Google Ads Campaign Management & Optimization";
    if (n.includes("meta ad")) return "Meta Ads Campaign Management & Optimization";
    return name;
  };
  const toNumber = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };
  const { id } = useParams();
  const { currentUser, token } = useSelector((state) => state.user);

  const dispatch = useDispatch();
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const clientPerPage = 10;
  console.log(id);
  const [showModal, setShowModal] = useState(false);
  const [showModalInvoice, setShowModalInvoice] = useState(false);
  const [showModalInvoiceClient, setShowModalInvoiceClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [quotationServicesPreview, setQuotationServicesPreview] = useState([]);
  const [quotationPreviewLoading, setQuotationPreviewLoading] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const userName = currentUser?.name;
  const [invoiceData, setInvoiceData] = useState("");
  const [initialSelectedProposalId, setInitialSelectedProposalId] = useState(null);

  const handleCreateProformaFromProposal = (proposal) => {
    setSelectedTxn(null);
    setInitialSelectedProposalId(proposal.id);
    setShowModalInvoiceClient(true);
  };

  const fetchAllClientServices = React.useCallback(async () => {
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/calculator/getClientTxnHistory/${id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

        }

      );

      console.log("FULL RESPONSE:", res.data);
      console.log("DATA:", res.data.data);
      console.log("RESULT:", res.data.result);

      if (res.data.success || res.data.status === "Success") {
        const uniqueTxnData = [];
        const seenTxnIds = new Set();

        for (const item of res.data.data) {
          // ✅ Skip items with missing/null/empty txn_id
          if (item.txn_id && !seenTxnIds.has(item.txn_id)) {
            seenTxnIds.add(item.txn_id);
            uniqueTxnData.push(item);
          }
        }
        console.log(res.data);
        console.log("ID:", id);                          // ← YE ADD KARO
        console.log("First item:", res.data.data?.[0]);
        setFetchServices(uniqueTxnData.reverse());
      }
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
  }, [baseURL, id, token, dispatch, navigate]);
  const fetchAllInvoiceServices = React.useCallback(async (txnID) => {
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/calculator/getAllInvoiceServiceHistory/${id}/${txnID}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.success || res.data.status === "Success") {
        console.log(res.data.data);

        const hasInvoices = res.data.data && res.data.data.length > 0;

        setCreatedInvoices((prev) => ({
          ...prev,
          [txnID]: hasInvoices, // true if invoice exists
        }));
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
          // timerProgressBar: true,
        }).then(() => {
          dispatch(clearUser());
          localStorage.removeItem("token");
          navigate("/");
        });
      }
    }
  }, [baseURL, id, token, dispatch, navigate]);

  const fetchProposals = React.useCallback(async () => {
    try {
      const res = await axios.get(`${baseURL}/auth/api/calculator/proposals/client/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.status === "Success") {
        setProposals(res.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching proposals", error);
    }
  }, [baseURL, id, token]);

  console.log(fetchServices);

  // ✅ Return fetched data instead of just setting state
  const fetchServicesById = async (txnID) => {
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/calculator/getClientServiceHistory/${id}/${txnID}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = res.data.data || [];
      // console.log(data);


      return data; // ✅ return fetched data directly
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
      return []; // fallback
    }
  };
  const fetchComplimentaryData = async (txnID) => {
    try {
      const { data } = await axios.get(
        `${baseURL}/auth/api/calculator/getByIDComplimentaryData/${txnID}/${id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const complimentary = data.data || [];

      return complimentary; // ✅ return so we can use it
    } catch (error) {
      console.error(error);
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
      return [];
    }
  };

  const fetchClient = React.useCallback(async () => {
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/calculator/getClientDetailsById/${id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.data.success || res.data.status === "Success") {
        console.log(res.data.data);
        setClientData(res.data.data);
      }
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
  }, [baseURL, id, token, dispatch, navigate]);

  const fetchClientReceived = React.useCallback(async (txnId) => {
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/calculator/getInvoiceClientDetailsById/${id}/${txnId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.success || res.data.status === "Success") {
        setInvoiceData(res.data.data);
        setClientDataReceived((prev) => ({
          ...prev,
          [txnId]: res.data.data, // store result under txnId
        }));
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
  }, [baseURL, id, token, dispatch, navigate]);

  const handleDeletequotation = async (quotationId) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to delete this quotation permanently?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirm.isConfirmed) return;

    try {
      const response = await axios.delete(
        `${baseURL}/auth/api/calculator/deleteQuotationById/${quotationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.status === "Success") {
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Quatation deleted successfully.",
          showConfirmButton: false,
          timer: 1000,
          // timerProgressBar: true,
        });

        // Refresh client list
        fetchClient();
        fetchAllClientServices();
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed!",
          text: response.data.message || "Unable to delete client.",
          showConfirmButton: false,
          timer: 1000,
          // timerProgressBar: true,
        });
      }
    } catch (error) {
      console.error("Error deleting client:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong while deleting client.",
        showConfirmButton: false,
        timer: 1000,
        // timerProgressBar: true,
      });
    }
  };

  const handleCreateClientInvoice = async (txnId, clientId) => {
    setSelectedTxn(txnId || null);
    setSelectedClient(clientId || null);
    setQuotationPreviewLoading(true);
    setShowModalInvoiceClient(true);
    try {
      const [previewData, complimentaryPreview] = await Promise.all([
        fetchServicesById(txnId),
        fetchComplimentaryData(txnId),
      ]);

      const baseServices = Array.isArray(previewData) ? previewData : [];
      const complimentaryServices = Array.isArray(complimentaryPreview)
        ? complimentaryPreview.map((item) => ({
          ...item,
          service_type: item.service_type || "Complimentary",
          is_complimentary: true,
        }))
        : [];

      setQuotationServicesPreview([...baseServices, ...complimentaryServices]);
    } finally {
      setQuotationPreviewLoading(false);
    }
  };

  const generateUniqueId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };
  const handleCreateInvoiceForTxn = async (modalFormData, selectedTxn) => {
    setLoading(true);

    try {
      const data = await fetchServicesById(selectedTxn);
      const complimentaryItems = await fetchComplimentaryData(selectedTxn);

      if (!data || data.length === 0) {
        Swal.fire({
          icon: "info",
          title: "No Data",
          text: "No Data found for this Service.",
          showConfirmButton: false,
          timer: 1000,
        });
        setLoading(false);
        return;
      }

      const clientDetail = {
        client_name: clientData?.client_name,
        client_organization: clientData?.client_organization,
        email: clientData?.email,
        phone: clientData?.phone,
        address: clientData?.address,
        dg_employee: userName,
        duration_start_date: modalFormData?.duration_start_date,
        duration_end_date: modalFormData?.duration_end_date,
        payment_mode: modalFormData?.payment_mode,
        client_gst_no: modalFormData?.client_gst_no,
        client_pan_no: modalFormData?.client_pan_no,
        bill_type: modalFormData.bill_type,
      };

      const invoices = data
        .filter(
          (item) =>
            item.service_type !== "Ads Campaign" &&
            item.service_type !== "Complimentary"
        )
        .map((item) => ({
          service_name: item.service_name,
          category_name: item.category_name,
          editing_type_name: item.editing_type_name,
          editing_type_amount: item.editing_type_amount,
          quantity: item.quantity,
          include_content_posting: item.include_content_posting,
          include_thumbnail_creation: item.include_thumbnail_creation,
          include_youtube_video_posting: item.include_youtube_video_posting,
          total_amount: item.total_amount,
          plan_name: item.plan_name,
          employee: userName,
        }));

      const adsItems = data
        .filter((item) => item.service_type === "Ads Campaign")
        .map((item) => ({
          txn_id: selectedTxn,
          client_id: id,
          id: generateUniqueId(),
          category: item.category_name,
          amount: item.amount,
          percent: item.percent,
          charge: item.charge,
          total: item.total_amount,
          employee: userName,
        }));

      const payload = {
        txn_id: selectedTxn,
        ...clientDetail,
        client_id: id,
        invoices,
      };
      await axios.post(`${baseURL}/auth/api/calculator/saveInvoiceGD`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (adsItems.length > 0) {
        await axios.post(
          `${baseURL}/auth/api/calculator/saveInvoiceAdsCampaign`,
          { adsItems },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      if (complimentaryItems.length > 0) {
        for (const item of complimentaryItems) {
          await axios.post(
            `${baseURL}/auth/api/calculator/saveInvoiceComplimentaryData`,
            item,
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      }

      const normalTotal = invoices.reduce(
        (sum, item) => sum + toNumber(item.total_amount),
        0
      );
      const adsTotal = adsItems.reduce(
        (sum, item) => sum + toNumber(item.total),
        0
      );
      const proformaAmount = normalTotal + adsTotal;

      await axios.post(
        `${baseURL}/auth/api/calculator/workflow/generateProformaInvoice`,
        {
          txn_id: selectedTxn,
          client_id: selectedClient || id,
          proforma_amount: proformaAmount,
          remark: "Proforma generated from approved quotation",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await Swal.fire({
        icon: "success",
        title: "Proforma Generated",
        text: "Proforma invoice saved successfully.",
        showConfirmButton: false,
        timer: 1000,
      });

      setCreatedInvoices((prev) => ({
        ...prev,
        [selectedTxn]: true,
      }));

      fetchAllClientServices();
      fetchClientReceived(selectedTxn);
      setQuotationServicesPreview([]);
      setShowModalInvoiceClient(false);
      navigate(
        `/admin/quotation/${id}/${selectedTxn}?gst=${modalFormData.bill_type === "GST" ? 1 : 0}&doc=proforma`
      );
    } catch (err) {
      console.error("Save error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong while generating the proforma invoice.",
        showConfirmButton: false,
        timer: 1000,
      });
    } finally {
      setLoading(false);
    }
  };

  console.log(clientData);
  const clientName = clientData.client_name;
  console.log(clientName);

  useEffect(() => {
    fetchClient();
    fetchAllClientServices();
  }, [fetchClient, fetchAllClientServices]);

  useEffect(() => {
    if (fetchServices.length > 0) {
      console.log("Sample item:", fetchServices[0]);
    }
  }, [fetchServices]);

  // Closes dropdown when clicking anywhere outside it
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If the user didn't click inside any element with the 'action-dropdown-container' class, close the dropdown
      if (!event.target.closest(".action-dropdown-container")) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredItems = React.useMemo(() => {

    // no search => return all data
    if (!keyword.trim()) {
      return fetchServices;
    }

    return fetchServices.filter((row) => {

      const txn = String(row?.txn_id || "").toLowerCase();

      return txn.includes(keyword.trim().toLowerCase());

    });

  }, [fetchServices, keyword]);

  const totalPages = Math.ceil(filteredItems.length / clientPerPage);

  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  const showApiData = React.useMemo(() => {
    const startIndex = currentPage * clientPerPage;
    const endIndex = startIndex + clientPerPage;
    return filteredItems?.slice(startIndex, endIndex);
  }, [filteredItems, currentPage]);

  const handleAssignClick = (row) => {
    const cid = row?.client_id ?? null;
    const txn = row?.txn_id ?? null;

    if (!cid || !txn) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: !cid ? "Client ID not found." : "Transaction ID not found.",
        showConfirmButton: false,
        timer: 1000,
        // timerProgressBar: true,
      });
      return;
    }

    setSelectedClient(cid);
    setSelectedTxn(txn);
    setAssignModal(true);
  };

  const handleApproveMenuClick = async (row) => {
    const clientId = row?.client_id;
    const txnId = row?.txn_id;

    if (!clientId || !txnId) {
      // ... (Your existing Swal warning)
      return;
    }

    try {
      const res = await axios.put(
        `${baseURL}/auth/api/calculator/updateQuotationApprovalStatus`,
        {
          client_id: clientId,
          txn_id: txnId,
          approved_by: userName || "Admin",
          // Note: status backend handle kar lega toggle logic se
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.success || res.data.status === "Success") {
        Swal.fire({
          icon: "success",
          title: res.data.newStatus === "approved" ? "Approved" : "Unapproved",
          text: `Quotation status changed to ${res.data.newStatus}`,
          showConfirmButton: false,
          timer: 1000,
        });
        fetchAllClientServices(); // Refresh list
      }
    } catch (error) {
      console.error("Toggle Error:", error);
      // ... Swal error
    } finally {
      setOpenDropdown(null);
    }
  };

  // ── Helper: show success ──────────────────────────────────────────
  const wfSuccess = (msg) => {
    Swal.fire({ icon: "success", title: msg, showConfirmButton: false, timer: 1200 });
    fetchAllClientServices();
  };

  const wfError = (msg) => {
    Swal.fire({ icon: "error", title: "Error", text: msg });
  };

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // ── 1. Submit to Admin ────────────────────────────────────────────
  const handleSubmitToAdmin = async () => {
    setWorkflowLoading(true);
    try {
      const res = await axios.post(
        `${baseURL}/auth/api/calculator/workflow/submitToAdmin`,
        { txn_id: selectedTxn, client_id: selectedClient, remark: workflowRemark },
        { headers: authHeaders }
      );
      if (res.data.success || res.data.status === "Success") {
        setSubmitAdminModal(false);
        setWorkflowRemark("");
        wfSuccess("Submitted to Admin!");
      }
    } catch (e) { wfError(e?.response?.data?.message || "Failed"); }
    finally { setWorkflowLoading(false); }
  };

  // ── 2. Send Quotation to Client ───────────────────────────────────
  const handleSendToClient = async () => {
    setWorkflowLoading(true);
    try {
      const res = await axios.post(
        `${baseURL}/auth/api/calculator/workflow/sendQuotationToClient`,
        { txn_id: selectedTxn, client_id: selectedClient, channel: selectedChannel, remark: workflowRemark },
        { headers: authHeaders }
      );
      if (res.data.success || res.data.status === "Success") {
        setClientSendSuccess(true);
        wfSuccess("Quotation sent to client!");
      }
    } catch (e) { wfError(e?.response?.data?.message || "Failed"); }
    finally { setWorkflowLoading(false); }
  };

  // ── 3. Mark Client Quotation Response ────────────────────────────
  const handleMarkClientResponse = async () => {
    if (!clientDecision) return wfError("Please select a response");
    setWorkflowLoading(true);
    try {
      const res = await axios.put(
        `${baseURL}/auth/api/calculator/workflow/markClientQuotationApproved`,
        { txn_id: selectedTxn, client_id: selectedClient, decision: clientDecision, remark: workflowRemark },
        { headers: authHeaders }
      );
      if (res.data.success || res.data.status === "Success") {
        setClientResponseModal(false);
        setClientDecision("");
        setWorkflowRemark("");
        wfSuccess(`Marked as ${clientDecision}`);
      }
    } catch (e) { wfError(e?.response?.data?.message || "Failed"); }
    finally { setWorkflowLoading(false); }
  };

  const fetchPaymentSummaryForTxn = async (txnId, clientId) => {
    setPaymentSummaryLoading(true);
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/calculator/workflow/paymentSummary/${txnId}`,
        { params: { client_id: clientId }, headers: authHeaders }
      );
      if (res.data.success || res.data.status === "Success") {
        setPaymentSummary(res.data.data || {
          total_contract_value: 0,
          total_received_till_date: 0,
          pending_payment_amount: 0,
        });
      }
    } catch (e) {
      wfError(e?.response?.data?.message || "Failed to load payment summary");
    } finally {
      setPaymentSummaryLoading(false);
    }
  };

  const openReceivePaymentModal = async (item) => {
    setSelectedClient(item.client_id);
    setSelectedTxn(item.txn_id);
    setWorkflowRemark("");
    setPaymentEntry({
      amount_received: "",
      payment_date: moment().format("YYYY-MM-DD"),
      payment_mode: "UPI",
      transaction_reference: "",
    });
    setReceivePaymentModal(true);
    setOpenDropdown(null);
    await fetchPaymentSummaryForTxn(item.txn_id, item.client_id);
  };

  const handleReceivePaymentEntry = async () => {
    const amount = toNumber(paymentEntry.amount_received);
    if (!amount || amount <= 0) return wfError("Please enter a valid received amount");
    if (!paymentEntry.payment_date) return wfError("Please select payment date");
    if (!paymentEntry.payment_mode) return wfError("Please select payment mode");
    if (!paymentEntry.transaction_reference) return wfError("Please enter transaction reference/UTR");

    setWorkflowLoading(true);
    try {
      const res = await axios.post(
        `${baseURL}/auth/api/calculator/workflow/recordPaymentAndGenerateFinalInvoice`,
        {
          txn_id: selectedTxn,
          client_id: selectedClient,
          amount_received: amount,
          payment_date: paymentEntry.payment_date,
          payment_mode: paymentEntry.payment_mode,
          transaction_reference: paymentEntry.transaction_reference,
          remark: workflowRemark,
        },
        { headers: authHeaders }
      );
      if (res.data.success || res.data.status === "Success") {
        setReceivePaymentModal(false);
        setWorkflowRemark("");
        setPaymentEntry({
          amount_received: "",
          payment_date: moment().format("YYYY-MM-DD"),
          payment_mode: "UPI",
          transaction_reference: "",
        });

        let msg = "Payment saved. Final invoice is ready.";
        let icon = "success";
        let title = "Success";
        
        const { adminEmailStatus, adminWAStatus } = res.data;
        const failed = [];
        const success = [];
        
        if (adminEmailStatus && !adminEmailStatus.ok) failed.push("Admin Email"); else if (adminEmailStatus && adminEmailStatus.ok) success.push("Admin Email");
        if (adminWAStatus && !adminWAStatus.ok) failed.push("Admin WhatsApp"); else if (adminWAStatus && adminWAStatus.ok) success.push("Admin WhatsApp");
        
        if (failed.length > 0) {
          const htmlContent = `
            <div style="text-align: left; margin-top: 10px; font-size: 14px;">
              <p style="margin-bottom: 5px;"><strong>Payment saved, but ❌ Failed to alert via:</strong></p>
              <ul style="color: #ef4444; list-style-type: none; padding-left: 10px; margin-bottom: 15px;">
                ${failed.map(f => `<li>• ${f}</li>`).join('')}
              </ul>
              ${success.length > 0 ? `
              <p style="margin-bottom: 5px;"><strong>✅ Successfully alerted via:</strong></p>
              <ul style="color: #10b981; list-style-type: none; padding-left: 10px;">
                ${success.map(s => `<li>• ${s}</li>`).join('')}
              </ul>
              ` : ''}
            </div>
          `;
          Swal.fire({ icon: "warning", title: "Partial Success", html: htmlContent });
        } else {
          Swal.fire({ icon, title, text: msg, timer: 1200, showConfirmButton: false });
        }
        
        fetchAllClientServices();
      }
    } catch (e) {
      wfError(e?.response?.data?.message || "Failed to record payment");
    } finally {
      setWorkflowLoading(false);
    }
  };

  // ── 4. Save Strategy ──────────────────────────────────────────────
  const handleSaveStrategy = async () => {
    const valid = strategyTasks.every(t => t.service_name && t.deadline);
    if (!valid) return wfError("Service name and deadline required for all tasks");
    setWorkflowLoading(true);
    try {
      const res = await axios.post(
        `${baseURL}/auth/api/calculator/workflow/saveStrategy`,
        { txn_id: selectedTxn, client_id: selectedClient, tasks: strategyTasks },
        { headers: authHeaders }
      );
      if (res.data.success || res.data.status === "Success") {
        setStrategyModal(false);
        setStrategyTasks([{ service_name: "", description: "", deadline: "" }]);
        wfSuccess("Strategy saved!");
      }
    } catch (e) { wfError(e?.response?.data?.message || "Failed"); }
    finally { setWorkflowLoading(false); }
  };

  // ── 4b. Send Strategy to Admin (SF) ──────────────────────────────
  const handleSendStrategyToAdmin = async (txn_id, client_id) => {
    setWorkflowLoading(true);
    try {
      const res = await axios.post(
        `${baseURL}/auth/api/calculator/workflow/sendStrategyToAdmin`,
        { txn_id, client_id },
        { headers: authHeaders }
      );
      if (res.data.success || res.data.status === "Success") {
        wfSuccess("Strategy sent to Admin!");
        fetchAllClientServices();
      }
    } catch (e) { wfError(e?.response?.data?.message || "Failed"); }
    finally { setWorkflowLoading(false); }
  };

  // ── 5. Fetch saved strategy ───────────────────────────────────────
  const fetchStrategy = async (txn_id) => {
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/calculator/workflow/getStrategy/${txn_id}`,
        { headers: authHeaders }
      );
      if (res.data.success || res.data.status === "Success") setSavedStrategy(res.data.data);
    } catch (e) { console.error(e); }
  };

  // ── 6. Send Strategy to Client ────────────────────────────────────
  const handleSendStrategyToClient = async () => {
    setWorkflowLoading(true);
    try {
      const res = await axios.post(
        `${baseURL}/auth/api/calculator/workflow/sendStrategyToClient`,
        { txn_id: selectedTxn, client_id: selectedClient, channel: selectedChannel, remark: workflowRemark },
        { headers: authHeaders }
      );
      if (res.data.success || res.data.status === "Success") {
        setStrategySendSuccess(true);
        wfSuccess("Strategy sent to client!");
      }
    } catch (e) { wfError(e?.response?.data?.message || "Failed"); }
    finally { setWorkflowLoading(false); }
  };

  // ── 7. Mark Client Strategy Decision ─────────────────────────────
  const handleClientStrategyDecision = async () => {
    if (!clientDecision) return wfError("Please select a response");
    setWorkflowLoading(true);
    try {
      const res = await axios.put(
        `${baseURL}/auth/api/calculator/workflow/markClientStrategyDecision`,
        { txn_id: selectedTxn, client_id: selectedClient, decision: clientDecision, remark: workflowRemark },
        { headers: authHeaders }
      );
      if (res.data.success || res.data.status === "Success") {
        setClientStrategyModal(false);
        setClientDecision("");
        setWorkflowRemark("");
        wfSuccess(`Strategy marked: ${clientDecision}`);
      }
    } catch (e) { wfError(e?.response?.data?.message || "Failed"); }
    finally { setWorkflowLoading(false); }
  };

  // ── 8. Fetch SF Teams ─────────────────────────────────────────────
  const fetchSFTeams = async () => {
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/calculator/workflow/sfTeams`,
        { headers: authHeaders }
      );
      if (res.data.success || res.data.status === "Success") setSfTeams(res.data.data);
    } catch (e) { console.error(e); }
  };

  // ── 9. Fetch SF Team Leads by team ───────────────────────────────
  const fetchSFTeamLeads = async (teamId) => {
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/calculator/workflow/sfTeamLeads/${teamId}`,
        { headers: authHeaders }
      );
      if (res.data.success || res.data.status === "Success") setSfTeamLeads(res.data.data);
    } catch (e) { console.error(e); }
  };

  // ── 10. Assign Team Lead ──────────────────────────────────────────
  const handleAssignTeamLead = async () => {
    if (!selectedTeamLead) return wfError("Please select a team lead");
    setWorkflowLoading(true);
    try {
      const res = await axios.post(
        `${baseURL}/auth/api/calculator/workflow/assignTeamLead`,
        {
          txn_id: selectedTxn,
          client_id: selectedClient,
          team_id: selectedTeam?.id,
          team_name: selectedTeam?.team_name,
          team_lead_id: selectedTeamLead?.id,
          team_lead_name: selectedTeamLead?.name,
          team_lead_email: selectedTeamLead?.email,
          remark: workflowRemark,
        },
        { headers: authHeaders }
      );
      if (res.data.success || res.data.status === "Success") {
        setTeamLeadModal(false);
        setSelectedTeam(null);
        setSelectedTeamLead(null);
        setWorkflowRemark("");
        wfSuccess("Team Lead assigned!");
      }
    } catch (e) { wfError(e?.response?.data?.message || "Failed"); }
    finally { setWorkflowLoading(false); }
  };

  // ── 11. Fetch SF Employees + strategy for task assignment ─────────
  const openTaskOwnersModal = async (item) => {
    setSelectedClient(item.client_id);
    setSelectedTxn(item.txn_id);
    setOpenDropdown(null);
    try {
      const [stratRes, empRes] = await Promise.all([
        axios.get(`${baseURL}/auth/api/calculator/workflow/getStrategy/${item.txn_id}`, { headers: authHeaders }),
        axios.get(`${baseURL}/auth/api/calculator/workflow/sfEmployees`, { headers: authHeaders }),
      ]);
      const tasks = stratRes.data.success ? stratRes.data.data : [];
      const emps = empRes.data.success ? empRes.data.data : [];
      setSavedStrategy(tasks);
      setSfEmployees(emps);
      setTaskAssignments(tasks.map((t) => ({
        task_id: t.id, // ✅ YE ADD KARNA HAI

        task_name: t.service_name,

        task_description: t.description,

        deadline: t.deadline
          ? t.deadline.split("T")[0]
          : "",

        assigned_to_id: "",

        assigned_to_name: "",

        assigned_to_email: "",
      }))
      );
      setTaskOwnersModal(true);
    } catch (e) { wfError("Could not load data"); }
  };

  // ── 12. Save Task Assignments ─────────────────────────────────────
  const handleSaveTaskOwners = async () => {
    const invalid = taskAssignments.some(t => !t.assigned_to_id || !t.deadline);
    if (invalid) return wfError("Assign an employee and deadline for every task");
    setWorkflowLoading(true);
    try {
      const res = await axios.post(
        `${baseURL}/auth/api/calculator/workflow/assignTaskOwners`,
        { txn_id: selectedTxn, client_id: selectedClient, tasks: taskAssignments },
        { headers: authHeaders }
      );
      if (res.data.success || res.data.status === "Success") {
        setTaskOwnersModal(false);
        setTaskAssignments([]);
        wfSuccess("Tasks assigned successfully!");
      }
    } catch (e) { wfError(e?.response?.data?.message || "Failed"); }
    finally { setWorkflowLoading(false); }
  };

  useEffect(() => {
    showApiData.forEach((item) => {
      if (!(item.txn_id in createdInvoices)) {
        fetchAllInvoiceServices(item.txn_id);
      }
      if (!(item.txn_id in clientDataReceived)) {
        fetchClientReceived(item.txn_id);
      }
    });
    fetchProposals();
  }, [id, fetchAllClientServices, fetchClient, fetchClientReceived, fetchAllInvoiceServices, fetchProposals]);

  const handleDeleteInvoice = async (txnId) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to delete this invoice permanently?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirm.isConfirmed) return;

    try {
      const response = await axios.delete(
        `${baseURL}/auth/api/calculator/deleteAllInvoiceServiceHistory/${id}/${txnId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.status === "Success") {
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Invoice deleted successfully.",
          showConfirmButton: false,
          timer: 1000,
        });
        setCreatedInvoices((prev) => {
          const updated = { ...prev };
          delete updated[txnId];
          return updated;
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed!",
          text: response.data.message || "Unable to delete invoice.",
          showConfirmButton: false,
          timer: 1000,
        });
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong while deleting invoice.",
        showConfirmButton: false,
        timer: 1000,
      });
    }
  };

  const handleNavigateInovice = (selectedTxn, billtype, docType = "final") => {
    console.log(selectedTxn, billtype);

    const isGST = billtype === "GST";
    const docParam = docType === "proforma" ? "&doc=proforma" : "";
    navigate(`/admin/invoice/${id}/${selectedTxn}?gst=${isGST ? 1 : 0}${docParam}`);
  };
  const handleCreateProposal = () => {
    navigate(`/admin/proposal-builder/${id}`);
  };

  const currentPaymentInput = toNumber(paymentEntry.amount_received);
  const livePendingPayment = Math.max(
    toNumber(paymentSummary.total_contract_value) -
    toNumber(paymentSummary.total_received_till_date) -
    currentPaymentInput,
    0
  );

  return (
    <>
      <style>{ `
      .ci-scroll::-webkit-scrollbar { width: 4px; }
      .ci-scroll::-webkit-scrollbar-track { background: transparent; }
      .ci-scroll::-webkit-scrollbar-thumb { background: rgba(184,150,46,0.2); border-radius: 99px; }
      .ci-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
      @media (max-width: 640px) { .ci-grid-2 { grid-template-columns: 1fr; } }
      .ci-label { display: block; font-size: 10.5px; font-weight: 700; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
      .ci-input { width: 100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 10px 14px; color: #e8e8f0; font-size: 13px; outline: none; transition: all 0.2s; }
      .ci-input::placeholder { color: rgba(255,255,255,0.18); }
      .ci-input:focus { border-color: rgba(184,150,46,0.45); background: rgba(184,150,46,0.04); }
      .ci-input option { background: #0d0e1a; color: #e8e8f0; }
      .ci-input-icon { position: relative; }
      .ci-input-icon .icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.2); width: 16px; height: 16px; }
      .ci-input-icon .ci-input { padding-left: 36px; }
      .ci-input-icon .chevron { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); width: 14px; height: 14px; color: rgba(255,255,255,0.2); pointer-events: none; }
      select.ci-input { appearance: none; padding-right: 36px; cursor: pointer; }
      .ci-date-btn { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.04); border: none; color: rgba(255,255,255,0.3); border-radius: 6px; padding: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
      .ci-date-btn:hover { background: rgba(184,150,46,0.2); color: #d4a940; }
      .ci-date-input::-webkit-calendar-picker-indicator { opacity: 0; display: none; -webkit-appearance: none; }
      .ci-btn-primary { display: inline-flex; align-items: center; gap: 6px; padding: 10px 22px; border-radius: 12px; border: none; font-size: 13px; font-weight: 700; color: #0d0e1a; cursor: pointer; transition: all 0.2s; background: linear-gradient(135deg, #c9a83a 0%, #d4a940 45%, #b8922c 100%); }
      .ci-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 30px rgba(184,150,46,0.25); }
      .ci-btn-primary:active { transform: translateY(1px); }
      .ci-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
      .ci-btn-secondary { display: inline-flex; align-items: center; gap: 6px; padding: 10px 22px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.6); cursor: pointer; transition: all 0.2s; background: rgba(255,255,255,0.04); }
      .ci-btn-secondary:hover { background: rgba(255,255,255,0.08); color: #fff; border-color: rgba(255,255,255,0.14); }
      @keyframes fadeUp { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
      @keyframes spin { to { transform: rotate(360deg); } }
    `}</style>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 relative overflow-hidden">
        {/* Animated background elements */ }
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <Header />

        <div className="relative z-10 p-6 space-y-8 mt-10">
          {/* Header Section */ }
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 lg:gap-0">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Proposal & Quotation History
              </h2>
              <button
                onClick={ () => navigate(-1) }
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transform hover:scale-105 transition-all duration-200 bg-gradient-to-r from-yellow-500 to-green-500 text-white shadow-lg shadow-yellow-500/25"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </button>
              <button
                onClick={ () => {
                  localStorage.setItem("admin-active-tab", "assign");
                  navigate("/admin/dashboard");
                } }
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition mx-2"
              >
                Assign List
              </button>
              <button
                onClick={ handleCreateProposal }
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition mx-2"
              >
                New Proposal
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-hover:text-amber-400 transition-colors" />
                <input
                  type="text"
                  value={ keyword }
                  placeholder="Search By Name,Txn Id "
                  className="w-full sm:w-auto pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 backdrop-blur-sm hover:bg-gray-700/50 transition-all text-sm"
                  onChange={ (e) => {
                    setKeyword(e.target.value);
                    setCurrentPage(0);
                  } }
                />
              </div>
            </div>
          </div>

          {/* Main Table */ }
          <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
            <div className="p-8">

              {/* TABS HEADER */ }
              <div className="flex space-x-4 mb-6 border-b border-gray-700">
                <button
                  onClick={ () => setActiveTab('proposals') }
                  className={ `pb-2 px-1 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'proposals'
                    ? 'border-orange-500 text-orange-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                    }` }
                >
                  Proposals
                </button>
              </div>

              {/* TABS CONTENT */ }
              { activeTab === 'proposals' && (
                <ProposalTable
                  proposals={ proposals }
                  fetchProposals={ fetchProposals }
                  keyword={ proposalKeyword }
                  setKeyword={ setProposalKeyword }
                  handleCreateProformaFromProposal={ handleCreateProformaFromProposal }
                  openProformaManager={ openProformaManager }
                />
              ) }
            </div>
          </div>

          <QuotationTypeModal
            open={ assignModal }
            onClose={ () => setAssignModal(false) }
            clientId={ selectedClient }
            txnId={ selectedTxn }
            baseURL={ baseURL }
            token={ token }
            onDone={ () => {
              // optional refresh
              fetchAllClientServices();
            } }
          />

          { showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="relative bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md">
                <button
                  onClick={ () => setShowModal(false) }
                  className="absolute top-2 right-3 text-red-600 hover:text-gray-500 text-xl font-bold"
                  aria-label="Close"
                >
                  ×
                </button>
                <h2 className="text-lg font-semibold mb-4 text-center">
                  Select Quotation Type
                </h2>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={ () => {
                      navigate(
                        `/admin/quotation/${selectedClient}/${selectedTxn}?gst=1`
                      );
                      setShowModal(false);
                    } }
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    With GST (18%)
                  </button>
                  <button
                    onClick={ () => {
                      navigate(
                        `/admin/quotation/${selectedClient}/${selectedTxn}?gst=0`
                      );
                      setShowModal(false);
                    } }
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Without GST
                  </button>
                </div>
              </div>
            </div>
          ) }

          { showModalInvoiceClient && (
                <GenerateProformaModal
                  isOpen={showModalInvoiceClient}
                  onClose={() => {
                    setShowModalInvoiceClient(false);
                    setQuotationServicesPreview([]);
                    setQuotationPreviewLoading(false);
                    setInitialSelectedProposalId(null);
                  }}
                  clientData={clientData}
                  txnPreviewData={quotationServicesPreview}
                  previewLoading={quotationPreviewLoading}
                  selectedTxn={selectedTxn}
                  handleCreateInvoiceForTxn={handleCreateInvoiceForTxn}
                  proposalsList={proposals}
                  initialSelectedProposalId={initialSelectedProposalId}
                />
          ) }
          {/* ── MODAL: Submit to Admin ────────────────────────────── */ }
          { submitAdminModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Submit to Admin</h2>
                  <button onClick={ () => setSubmitAdminModal(false) } className="text-gray-400 hover:text-gray-600"><X size={ 20 } /></button>
                </div>
                <p className="text-sm text-gray-500 mb-4">This quotation will be sent to the Admin for approval.</p>
                <textarea
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
                  rows={ 3 } placeholder="Add a remark (optional)"
                  value={ workflowRemark } onChange={ e => setWorkflowRemark(e.target.value) }
                />
                <button
                  onClick={ handleSubmitToAdmin } disabled={ workflowLoading }
                  className="mt-4 w-full py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  { workflowLoading && <Loader2 size={ 16 } className="animate-spin" /> }
                  Submit to Admin
                </button>
              </div>
            </div>
          ) }

          {/* ── MODAL: Send to Client (Quotation) ─────────────────── */ }
          { sendClientModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Send Quotation to Client</h2>
                  <button onClick={ () => {
                    setSendClientModal(false);
                    setClientSendSuccess(false);
                    setWorkflowRemark("");
                    setSelectedChannel("email");
                  } } className="text-gray-400 hover:text-gray-600"><X size={ 20 } /></button>
                </div>

                { clientSendSuccess ? (
                  <div className="flex flex-col items-center justify-center py-6">
                    <CheckCircle2 size={ 48 } className="text-green-500 mb-3" />
                    <p className="text-lg font-semibold text-gray-800 mb-1">Sent Successfully!</p>
                    <p className="text-sm text-gray-500 mb-6">Quotation has been sent to the client via { selectedChannel === "both" ? "Email & WhatsApp" : selectedChannel === "email" ? "Email" : "WhatsApp" }</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-500 mb-3">Select how to send:</p>
                    <div className="flex gap-3 mb-4">
                      { ["email", "whatsapp", "both"].map(ch => (
                        <button key={ ch } onClick={ () => setSelectedChannel(ch) }
                          className={ `flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${selectedChannel === ch ? "bg-orange-500 text-white border-orange-500" : "border-gray-300 text-gray-600 hover:border-orange-400"}` }>
                          { ch === "email" ? "📧 Email" : ch === "whatsapp" ? "💬 WhatsApp" : "📧+💬 Both" }
                        </button>
                      )) }
                    </div>
                    <textarea
                      className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
                      rows={ 3 } placeholder="Add a remark (optional)"
                      value={ workflowRemark } onChange={ e => setWorkflowRemark(e.target.value) }
                    />
                  </>
                ) }

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={ handleSendToClient } disabled={ workflowLoading || clientSendSuccess }
                    className="flex-1 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-green-500 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    { workflowLoading && <Loader2 size={ 16 } className="animate-spin" /> }
                    { clientSendSuccess ? "Sent" : "Send Now" }
                  </button>
                  { clientSendSuccess && (
                    <button
                      onClick={ () => {
                        setClientSendSuccess(false);
                        setWorkflowRemark("");
                        setSelectedChannel("email");
                      } }
                      className="flex-1 py-2 rounded-lg bg-gradient-to-r from-red-500 to-amber-500 text-white font-semibold hover:opacity-90 flex items-center justify-center gap-2"
                    >
                      🔄 Retry
                    </button>
                  ) }
                </div>
              </div>
            </div>
          ) }

          {/* ── MODAL: Client Response (Quotation) ────────────────── */ }
          { receivePaymentModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Receive Payment Entry</h2>
                  <button onClick={ () => setReceivePaymentModal(false) } className="text-gray-400 hover:text-gray-600"><X size={ 20 } /></button>
                </div>

                { paymentSummaryLoading ? (
                  <div className="py-8 text-center text-gray-500">Loading payment summary...</div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                      <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                        <p className="text-xs text-gray-500">Total Contract Value</p>
                        <p className="text-sm font-semibold text-gray-800">INR { toNumber(paymentSummary.total_contract_value).toLocaleString("en-IN") }</p>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                        <p className="text-xs text-gray-500">Received Till Date</p>
                        <p className="text-sm font-semibold text-gray-800">INR { toNumber(paymentSummary.total_received_till_date).toLocaleString("en-IN") }</p>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-3 bg-amber-50 border-amber-200">
                        <p className="text-xs text-amber-700">Live Pending Amount</p>
                        <p className="text-sm font-semibold text-amber-800">INR { livePendingPayment.toLocaleString("en-IN") }</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-500 font-medium">Amount Received *</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={ paymentEntry.amount_received }
                          onChange={ (e) => setPaymentEntry((prev) => ({ ...prev, amount_received: e.target.value })) }
                          className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                          placeholder="Enter amount"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 font-medium">Payment Date *</label>
                          <input
                            type="date"
                            value={ paymentEntry.payment_date }
                            onChange={ (e) => setPaymentEntry((prev) => ({ ...prev, payment_date: e.target.value })) }
                            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 font-medium">Payment Mode *</label>
                          <select
                            value={ paymentEntry.payment_mode }
                            onChange={ (e) => setPaymentEntry((prev) => ({ ...prev, payment_mode: e.target.value })) }
                            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                          >
                            { ["UPI", "Bank Transfer", "Cash", "Cheque"].map((mode) => (
                              <option key={ mode } value={ mode }>{ mode }</option>
                            )) }
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-gray-500 font-medium">Transaction Reference / UTR *</label>
                        <input
                          type="text"
                          value={ paymentEntry.transaction_reference }
                          onChange={ (e) => setPaymentEntry((prev) => ({ ...prev, transaction_reference: e.target.value })) }
                          className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                          placeholder="Enter transaction reference"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-gray-500 font-medium">Remark (optional)</label>
                        <textarea
                          rows={ 2 }
                          value={ workflowRemark }
                          onChange={ (e) => setWorkflowRemark(e.target.value) }
                          className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
                          placeholder="Add a note"
                        />
                      </div>
                    </div>

                    <button
                      onClick={ handleReceivePaymentEntry }
                      disabled={ workflowLoading }
                      className="mt-5 w-full py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      { workflowLoading && <Loader2 size={ 16 } className="animate-spin" /> }
                      Save Payment & Prepare Final Invoice
                    </button>
                  </>
                ) }
              </div>
            </div>
          ) }

          { clientResponseModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Mark Client Response</h2>
                  <button onClick={ () => setClientResponseModal(false) } className="text-gray-400 hover:text-gray-600"><X size={ 20 } /></button>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  { [
                    { val: "approved", label: "✅ Approved", color: "border-green-400 bg-green-50 text-green-700" },
                    { val: "rejected", label: "❌ Rejected", color: "border-red-400 bg-red-50 text-red-700" },
                    { val: "changes", label: "🔄 Changes Requested", color: "border-amber-400 bg-amber-50 text-amber-700" },
                    { val: "pending", label: "⏳ Pending", color: "border-gray-400 bg-gray-50 text-gray-700" },
                  ].map(opt => (
                    <button key={ opt.val } onClick={ () => setClientDecision(opt.val) }
                      className={ `p-3 rounded-lg border-2 text-sm font-semibold transition-all ${clientDecision === opt.val ? opt.color + " ring-2 ring-offset-1" : "border-gray-200 text-gray-500 hover:border-gray-300"}` }>
                      { opt.label }
                    </button>
                  )) }
                </div>
                <textarea
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
                  rows={ 2 } placeholder="Add a remark (optional)"
                  value={ workflowRemark } onChange={ e => setWorkflowRemark(e.target.value) }
                />
                <button
                  onClick={ handleMarkClientResponse } disabled={ workflowLoading }
                  className="mt-4 w-full py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  { workflowLoading && <Loader2 size={ 16 } className="animate-spin" /> }
                  Save Response
                </button>
              </div>
            </div>
          ) }

          {/* --- FOR FUTURE DEVELOPMENT OK ---
          // ── MODAL: Make Strategy ──────────────────────────────── 
          { strategyModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Build Project Strategy</h2>
                  <button onClick={ () => setStrategyModal(false) } className="text-gray-400 hover:text-gray-600"><X size={ 20 } /></button>
                </div>
                { strategyTasks.map((task, idx) => (
                  <div key={ idx } className="border border-gray-200 rounded-lg p-4 mb-3 relative">
                    <button onClick={ () => setStrategyTasks(prev => prev.filter((_, i) => i !== idx)) }
                      className="absolute top-2 right-2 text-red-400 hover:text-red-600">
                      <X size={ 16 } />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 font-medium">Service Name *</label>
                        <input type="text" value={ task.service_name } placeholder="e.g. SEO Audit"
                          onChange={ e => setStrategyTasks(prev => prev.map((t, i) => i === idx ? { ...t, service_name: e.target.value } : t)) }
                          className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-medium">Deadline *</label>
                        <input type="date" value={ task.deadline }
                          onChange={ e => setStrategyTasks(prev => prev.map((t, i) => i === idx ? { ...t, deadline: e.target.value } : t)) }
                          className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs text-gray-500 font-medium">Description</label>
                        <textarea value={ task.description } placeholder="What needs to be done..."
                          onChange={ e => setStrategyTasks(prev => prev.map((t, i) => i === idx ? { ...t, description: e.target.value } : t)) }
                          className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
                          rows={ 2 }
                        />
                      </div>
                    </div>
                  </div>
                )) }
                <button
                  onClick={ () => setStrategyTasks(prev => [...prev, { service_name: "", description: "", deadline: "" }]) }
                  className="w-full py-2 rounded-lg border-2 border-dashed border-orange-300 text-orange-500 text-sm font-medium hover:border-orange-400 hover:bg-orange-50 mb-4"
                >
                  + Add Service
                </button>
                <button
                  onClick={ handleSaveStrategy } disabled={ workflowLoading }
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  { workflowLoading && <Loader2 size={ 16 } className="animate-spin" /> }
                  Save Strategy
                </button>
              </div>
            </div>
          ) }

          // ── MODAL: Send Strategy to Client ───────────────────── 
          { sendStrategyModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Send Strategy to Client</h2>
                  <button onClick={ () => {
                    setSendStrategyModal(false);
                    setStrategySendSuccess(false);
                    setWorkflowRemark("");
                    setSelectedChannel("email");
                  } } className="text-gray-400 hover:text-gray-600"><X size={ 20 } /></button>
                </div>

                { strategySendSuccess ? (
                  <div className="flex flex-col items-center justify-center py-6">
                    <CheckCircle2 size={ 48 } className="text-green-500 mb-3" />
                    <p className="text-lg font-semibold text-gray-800 mb-1">Sent Successfully!</p>
                    <p className="text-sm text-gray-500 mb-6">Strategy has been sent to the client via { selectedChannel === "both" ? "Email & WhatsApp" : selectedChannel === "email" ? "Email" : "WhatsApp" }</p>
                  </div>
                ) : (
                  <>
                    { savedStrategy.length > 0 && (
                      <div className="border border-gray-100 rounded-lg p-3 mb-4 bg-gray-50">
                        <p className="text-xs text-gray-500 font-medium mb-2">Strategy Tasks:</p>
                        { savedStrategy.map((t, i) => (
                          <div key={ i } className="flex justify-between text-sm text-gray-700 py-1 border-b border-gray-100 last:border-0">
                            <span>{ t.service_name }</span>
                            <span className="text-gray-400 text-xs">{ t.deadline ? t.deadline.split("T")[0] : "" }</span>
                          </div>
                        )) }
                      </div>
                    ) }
                    <p className="text-sm text-gray-500 mb-3">Select how to send:</p>
                    <div className="flex gap-3 mb-4">
                      { ["email", "whatsapp", "both"].map(ch => (
                        <button key={ ch } onClick={ () => setSelectedChannel(ch) }
                          className={ `flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${selectedChannel === ch ? "bg-orange-500 text-white border-orange-500" : "border-gray-300 text-gray-600 hover:border-orange-400"}` }>
                          { ch === "email" ? "📧 Email" : ch === "whatsapp" ? "💬 WhatsApp" : "📧+💬 Both" }
                        </button>
                      )) }
                    </div>
                    <textarea
                      className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
                      rows={ 2 } placeholder="Add a remark (optional)"
                      value={ workflowRemark } onChange={ e => setWorkflowRemark(e.target.value) }
                    />
                  </>
                ) }

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={ handleSendStrategyToClient } disabled={ workflowLoading || strategySendSuccess }
                    className="flex-1 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    { workflowLoading && <Loader2 size={ 16 } className="animate-spin" /> }
                    { strategySendSuccess ? "Sent" : "Send Now" }
                  </button>
                  { strategySendSuccess && (
                    <button
                      onClick={ () => {
                        setStrategySendSuccess(false);
                        setWorkflowRemark("");
                        setSelectedChannel("email");
                      } }
                      className="flex-1 py-2 rounded-lg bg-gradient-to-r from-red-500 to-amber-500 text-white font-semibold hover:opacity-90 flex items-center justify-center gap-2"
                    >
                      🔄 Retry
                    </button>
                  ) }
                </div>
              </div>
            </div>
          ) }

          // ── MODAL: Client Strategy Decision ──────────────────── 
          { clientStrategyModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Client Strategy Response</h2>
                  <button onClick={ () => setClientStrategyModal(false) } className="text-gray-400 hover:text-gray-600"><X size={ 20 } /></button>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  { [
                    { val: "approved", label: "✅ Approved", color: "border-green-400 bg-green-50 text-green-700" },
                    { val: "rejected", label: "❌ Rejected", color: "border-red-400 bg-red-50 text-red-700" },
                    { val: "changes", label: "🔄 Changes", color: "border-amber-400 bg-amber-50 text-amber-700" },
                  ].map(opt => (
                    <button key={ opt.val } onClick={ () => setClientDecision(opt.val) }
                      className={ `p-3 rounded-lg border-2 text-sm font-semibold transition-all ${clientDecision === opt.val ? opt.color : "border-gray-200 text-gray-500"}` }>
                      { opt.label }
                    </button>
                  )) }
                </div>
                <textarea className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
                  rows={ 2 } placeholder="Add a remark (optional)"
                  value={ workflowRemark } onChange={ e => setWorkflowRemark(e.target.value) }
                />
                <button onClick={ handleClientStrategyDecision } disabled={ workflowLoading }
                  className="mt-4 w-full py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                  { workflowLoading && <Loader2 size={ 16 } className="animate-spin" /> }
                  Save Response
                </button>
              </div>
            </div>
          ) }

          // ── MODAL: Assign Team Lead ───────────────────────────── 
          { teamLeadModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Assign Team Lead</h2>
                  <button onClick={ () => setTeamLeadModal(false) } className="text-gray-400 hover:text-gray-600"><X size={ 20 } /></button>
                </div>
                <div className="mb-4">
                  <label className="text-xs text-gray-500 font-medium">Select Team</label>
                  <select
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    value={ selectedTeam?.id || "" }
                    onChange={ e => {
                      const t = sfTeams.find(x => String(x.id) === e.target.value);
                      setSelectedTeam(t || null);
                      setSelectedTeamLead(null);
                      setSfTeamLeads([]);
                      if (t) fetchSFTeamLeads(t.id);
                    } }
                  >
                    <option value="">-- Select Team --</option>
                    { sfTeams.map(t => <option key={ t.id } value={ t.id }>{ t.team_name }</option>) }
                  </select>
                </div>
                { sfTeamLeads.length > 0 && (
                  <div className="mb-4">
                    <label className="text-xs text-gray-500 font-medium">Select Team Lead</label>
                    <select
                      className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      value={ selectedTeamLead?.id || "" }
                      onChange={ e => {
                        const lead = sfTeamLeads.find(x => String(x.id) === e.target.value);
                        setSelectedTeamLead(lead || null);
                      } }
                    >
                      <option value="">-- Select Team Lead --</option>
                      { sfTeamLeads.map(l => <option key={ l.id } value={ l.id }>{ l.name } — { l.designation }</option>) }
                    </select>
                  </div>
                ) }
                <textarea className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
                  rows={ 2 } placeholder="Add a remark (optional)"
                  value={ workflowRemark } onChange={ e => setWorkflowRemark(e.target.value) }
                />
                <button onClick={ handleAssignTeamLead } disabled={ workflowLoading }
                  className="mt-4 w-full py-2 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                  { workflowLoading && <Loader2 size={ 16 } className="animate-spin" /> }
                  Assign Team Lead
                </button>
              </div>
            </div>
          ) }

          // ── MODAL: Assign Task Owners ─────────────────────────── 
          { taskOwnersModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Assign Task Owners</h2>
                  <button onClick={ () => setTaskOwnersModal(false) } className="text-gray-400 hover:text-gray-600"><X size={ 20 } /></button>
                </div>
                { taskAssignments.map((task, idx) => (
                  <div key={ idx } className="border border-gray-200 rounded-lg p-4 mb-3 bg-gray-50">
                    <p className="text-sm font-semibold text-gray-700 mb-3">
                      <CalendarDays size={ 14 } className="inline mr-1 text-orange-500" />
                      { task.task_name }
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 font-medium">Assign To *</label>
                        <select
                          className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                          value={ task.assigned_to_id }
                          onChange={ e => {
                            const emp = sfEmployees.find(x => String(x.id) === e.target.value);
                            setTaskAssignments(prev => prev.map((t, i) => i === idx ? {
                              ...t,
                              assigned_to_id: emp?.id || "",
                              assigned_to_name: emp?.name || "",
                              assigned_to_email: emp?.email || "",
                            } : t));
                          } }
                        >
                          <option value="">-- Select Employee --</option>
                          { sfEmployees.map(e => (
                            <option key={ e.id } value={ e.id }>{ e.name } — { e.designation } ({ e.team })</option>
                          )) }
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-medium">Deadline *</label>
                        <input type="date" value={ task.deadline }
                          onChange={ e => setTaskAssignments(prev => prev.map((t, i) => i === idx ? { ...t, deadline: e.target.value } : t)) }
                          className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                      </div>
                    </div>
                  </div>
                )) }

                { taskAssignments.some(t => t.deadline) && (
                  <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-red-50">
                    <p className="text-xs font-medium text-gray-500 mb-2">Assigned Deadlines:</p>
                    <div className="flex flex-wrap gap-2">
                      { taskAssignments.filter(t => t.deadline && t.assigned_to_name).map((t, i) => (
                        <span key={ i } className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                          <CalendarDays size={ 12 } />
                          { t.task_name } — { t.assigned_to_name } — { t.deadline }
                        </span>
                      )) }
                    </div>
                  </div>
                ) }

                <button onClick={ handleSaveTaskOwners } disabled={ workflowLoading }
                  className="mt-4 w-full py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                  { workflowLoading && <Loader2 size={ 16 } className="animate-spin" /> }
                  Save & Assign All Tasks
                </button>
              </div>
            </div>
          ) }
          */}

          { totalPages > 1 && (
            <div className="p-3 flex items-center justify-center gap-3 mt-2">
              <button
                onClick={ () => setCurrentPage((p) => Math.max(0, p - 1)) }
                disabled={ currentPage === 0 }
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-700/50 text-gray-300 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Prev
              </button>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Page</span>
                <select
                  value={ currentPage }
                  onChange={ (e) => setCurrentPage(Number(e.target.value)) }
                  className="bg-gray-900/80 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer appearance-none min-w-[70px] text-center"
                  style={ { backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 fill=%27%239ca3af%27 viewBox=%270 0 16 16%27%3E%3Cpath d=%27M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z%27/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', paddingRight: '28px' } }
                >
                  { Array.from({ length: totalPages }, (_, i) => (
                    <option key={ i } value={ i }>{ i + 1 }</option>
                  )) }
                </select>
                <span className="text-gray-500 text-sm">of { totalPages }</span>
              </div>
              <button
                onClick={ () => setCurrentPage((p) => Math.min(totalPages - 1, p + 1)) }
                disabled={ currentPage >= totalPages - 1 }
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-700/50 text-gray-300 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          ) }

          {/* Stats Section */ }
          {/* <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl p-8">
          <h3 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Quick Stats
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-red-500/20 to-amber-500/20 rounded-xl border border-red-500/30 hover:from-red-500/30 hover:to-amber-500/30 transition-all duration-300 transform hover:scale-105">
              <div className="text-4xl font-bold bg-gradient-to-r from-red-400 to-amber-400 bg-clip-text text-transparent mb-2">
                12
              </div>
              <div className="text-gray-300 font-medium">Total Clients</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-green-500/20 to-yellow-500/20 rounded-xl border border-green-500/30 hover:from-green-500/30 hover:to-yellow-500/30 transition-all duration-300 transform hover:scale-105">
              <div className="text-4xl font-bold bg-gradient-to-r from-green-400 to-yellow-400 bg-clip-text text-transparent mb-2">
                8
              </div>
              <div className="text-gray-300 font-medium">Active Projects</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl border border-orange-500/30 hover:from-orange-500/30 hover:to-red-500/30 transition-all duration-300 transform hover:scale-105">
              <div className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-2">
                $485K
              </div>
              <div className="text-gray-300 font-medium">Total Revenue</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl border border-orange-500/30 hover:from-orange-500/30 hover:to-red-500/30 transition-all duration-300 transform hover:scale-105">
              <div className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-2">
                24
              </div>
              <div className="text-gray-300 font-medium">
                Completed Projects
              </div>
            </div>
          </div>
        </div> */}
        </div>
        <PaymentModal fetchProposals={ fetchProposals } />

        <ProformaManagerModal
          isOpen={ showProformaManager }
          onClose={ () => setShowProformaManager(false) }
          proposal={ selectedProposalForManager }
        />
      </div>
    </>
  );
};

export default History;





