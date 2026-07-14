import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import axios from "axios";
import moment from "moment";
import ReactPaginate from "react-paginate";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../redux/user/userSlice";
import Swal from "sweetalert2";
import API_BASE_URL from "../config/apiBaseUrl";
import LegacyQuotationTableBD from "./components/LegacyQuotationTableBD";
import ProposalTable from "../Admin/components/ProposalTable"; // Reusing the same ProposalTable component
import PaymentModal from "../Admin/components/PaymentModal";

const HistoryBD = () => {
   const baseURL = API_BASE_URL;
const navigate = useNavigate();
  const [fetchServices, setFetchServices] = useState([]);

  const [loading, setLoading] = useState(false);

  const [createdInvoices, setCreatedInvoices] = useState({});
  const [clientDataReceived, setClientDataReceived] = useState({});

  const [clientData, setClientData] = useState([]);
  const { id } = useParams();
  const { currentUser, token } = useSelector((state) => state.user);

  const dispatch = useDispatch();
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const clientPerPage = 10;
  console.log(id);

  const [activeTab, setActiveTab] = useState('proposals');
  const [proposals, setProposals] = useState([]);
  const [proposalKeyword, setProposalKeyword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showModalInvoice, setShowModalInvoice] = useState(false);
  const [showModalInvoiceClient, setShowModalInvoiceClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [assignModal, setAssignModal] = useState(false);
  const userName = currentUser?.name;
  const [formData, setFormData] = useState({
    client_name: "",
    client_organization: "",
    email: "",
    phone: "",
    address: "",
    dg_employee: userName,
    duration_start_date: "",
    duration_end_date: "",
    payment_mode: "",
    client_gst_no: "",
    client_pan_no: "",
    bill_type: "NON_GST",
  });
  const [invoiceData, setInvoiceData] = useState("");

  const fetchAllClientServices = async () => {
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/re_calculator/getClientTxnHistory/${id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.data.status === "Success") {
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
  };

  const fetchProposals = React.useCallback(async () => {
    try {
      const res = await axios.get(`${baseURL}/auth/api/re_calculator/proposal/client/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.status === "Success") {
        setProposals(res.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching proposals", error);
    }
  }, [baseURL, id, token]);

  const fetchAllInvoiceServices = async (txnID) => {
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/re_calculator/getAllInvoiceServiceHistory/${id}/${txnID}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.status === "Success") {
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
  };

  console.log(fetchServices);

  // ✅ Return fetched data instead of just setting state
  const fetchServicesById = async (txnID) => {
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/re_calculator/getClientServiceHistory/${id}/${txnID}`,
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
        `${baseURL}/auth/api/re_calculator/getByIDComplimentaryData/${txnID}/${id}`,
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
  };

  const fetchClientReceived = async (txnId) => {
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/re_calculator/getInvoiceClientDetailsById/${id}/${txnId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.status === "Success") {
        setInvoiceData(res.data.data);
        setClientDataReceived((prev) => ({
          ...prev,
          [txnId]: res.data.data, // store result under txnId
        }));
        console.log(clientDataReceived);
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
        `${baseURL}/auth/api/re_calculator/deleteQuotationById/${quotationId}`,
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

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleCreateClientInvoice = () => {
    setFormData({
      client_name: "",
      client_organization: "",
      email: "",
      phone: "",
      address: "",
      dg_employee: userName,
      duration_start_date: "",
      duration_end_date: "",
      payment_mode: "",
      client_gst_no: "",
      client_pan_no: "",
      bill_type: "NON_GST",
    });
    setShowModalInvoiceClient(true);
  };

  const generateUniqueId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };
  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      // ✅ Get fresh services
      const data = await fetchServicesById(selectedTxn);
      // console.log(data);


      // ✅ Get complimentary separately
      const complimentaryItems = await fetchComplimentaryData(selectedTxn);

      if (!data || data.length === 0) {
        Swal.fire({
          icon: "info",
          title: "No Data",
          text: "No Data found for this Service.",
          showConfirmButton: false,
          timer: 1000,
          // timerProgressBar: true,
        });
        return;
      }

      const clientDetail = {
        client_name: clientData?.client_name,
        client_organization: clientData?.client_organization,
        email: clientData?.email,
        phone: clientData?.phone,
        address: clientData?.address,
        dg_employee: userName,
        duration_start_date: formData?.duration_start_date,
        duration_end_date: formData?.duration_end_date,
        payment_mode: formData?.payment_mode,
        client_gst_no: formData?.client_gst_no,
        client_pan_no: formData?.client_pan_no,
        bill_type: formData.bill_type,
      };

      // ✅ Step 1: Normal Invoices
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
          total_amount: item.total_amount,
          plan_name: item.plan_name,
          employee: userName,
        }));

      // ✅ Step 2: Ads Campaign
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

      // ✅ Step 3: Save invoices
      const payload = {
        txn_id: selectedTxn,
        ...clientDetail,
        client_id: id,
        invoices,
      };
      await axios.post(
        `${baseURL}/auth/api/re_calculator/saveInvoiceGD`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // ✅ Step 4: Save Ads
      if (adsItems.length > 0) {
        await axios.post(
          `${baseURL}/auth/api/re_calculator/saveInvoiceAdsCampaign`,
          { adsItems },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // ✅ Step 5: Save Complimentary (from separate API)
      if (complimentaryItems.length > 0) {
        for (const item of complimentaryItems) {
          await axios.post(
            `${baseURL}/auth/api/re_calculator/saveInvoiceComplimentaryData`,
            item,
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      }

      Swal.fire({
        icon: "success",
        title: "Invoice Created",
        text: "Invoice saved successfully!",
        showConfirmButton: false,
        timer: 1000,
        // timerProgressBar: true,
      });
      setCreatedInvoices((prev) => ({
        ...prev,
        [selectedTxn]: true,
      }));
      setShowModalInvoiceClient(false);
    } catch (err) {
      console.error("Save error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong while saving the invoice.",
        showConfirmButton: false,
        timer: 1000,
        // timerProgressBar: true,
      });
    }
  };

  console.log(clientData);
  const clientName = clientData.client_name;
  console.log(clientName);

  useEffect(() => {
    fetchClient();
    fetchAllClientServices();
    fetchAllInvoiceServices();
    fetchClientReceived();
    fetchProposals();
  }, [fetchProposals]);

  const filteredItems = fetchServices.filter((row) => {
    const matchesKeyword =
      row?.txn_id &&
      row.txn_id.toLowerCase().includes(keyword.trim().toLowerCase());

    return matchesKeyword;
  });

  const totalPages = Math.ceil(filteredItems.length / clientPerPage);

  const filterPagination = () => {
    const startIndex = currentPage * clientPerPage;
    const endIndex = startIndex + clientPerPage;
    return filteredItems?.slice(startIndex, endIndex);
  };

  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  const showApiData = filterPagination();

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
  useEffect(() => {
    showApiData.forEach((item) => {
      if (!createdInvoices[item.txn_id]) {
        fetchAllInvoiceServices(item.txn_id);
      }
      if (!clientDataReceived[item.txn_id]) {
        fetchClientReceived(item.txn_id);
      }
    });
  }, [showApiData]);

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
        `${baseURL}/auth/api/re_calculator/deleteAllInvoiceServiceHistory/${id}/${txnId}`,
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
          // timerProgressBar: true,
        });
        setCreatedInvoices((prev) => {
          const updated = { ...prev };
          delete updated[txnId]; // remove from created list
          return updated;
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed!",
          text: response.data.message || "Unable to delete invoice.",
          showConfirmButton: false,
          timer: 1000,
          // timerProgressBar: true,
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
        // timerProgressBar: true,
      });
    }
  };

  const handleCloseInvoiceClient = () => {
    setShowModalInvoiceClient(false);
    setFormData({
      client_name: "",
      client_organization: "",
      email: "",
      phone: "",
      address: "",
      dg_employee: userName,
      duration_start_date: "",
      duration_end_date: "",
      payment_mode: "",
      client_gst_no: "",
      client_pan_no: "",
    });
  };

  const handleNavigateInovice = (selectedTxn, billtype) => {
    console.log(selectedTxn, billtype);

    const isGST = billtype === "GST";
    navigate(`/BD/invoice/${id}/${selectedTxn}?gst=${isGST ? 1 : 0}`);
  };
  const handleCreateProposal = () => {
    const txn_id = Date.now();
    navigate(`/BD/AddService/${id}/${txn_id}`);
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 p-6 space-y-8 mt-10">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 lg:gap-0">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Quotation History
            </h2>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transform hover:scale-105 transition-all duration-200 bg-gradient-to-r from-yellow-500 to-green-500 text-white shadow-lg shadow-yellow-500/25"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
            <button
              onClick={() => {
                localStorage.setItem("bd-active-tab", "assign"); // tab select karne ke liye
                navigate("/BD/dashboard"); // dashboard open karne ke liye
              }}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition mx-2"
            >
              Assign List
            </button>

            <button
              onClick={handleCreateProposal}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition mx-2"
            >
              New Plan
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* <div className="relative group">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-hover:text-orange-400 transition-colors" />
              <select className="w-full sm:w-auto pl-10 pr-8 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 backdrop-blur-sm hover:bg-gray-700/50 transition-all text-sm">
                <option>All Activities</option>
                <option>Completed</option>
                <option>Active</option>
              </select>
            </div> */}
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-hover:text-amber-400 transition-colors" />
              <input
                type="text"
                value={keyword}
                placeholder="Search By Name,Txn Id"
                className="w-full sm:w-auto pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 backdrop-blur-sm hover:bg-gray-700/50 transition-all text-sm"
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setCurrentPage(0);
                }}
              />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden p-8">
          <div className="flex gap-4 mb-6 border-b border-gray-700/50 pb-2">
            <button
              onClick={() => setActiveTab('proposals')}
              className={`pb-2 px-4 font-semibold transition-colors ${activeTab === 'proposals' ? 'text-red-400 border-b-2 border-red-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Proposals (New)
            </button>
            <button
              onClick={() => setActiveTab('quotations')}
              className={`pb-2 px-4 font-semibold transition-colors ${activeTab === 'quotations' ? 'text-red-400 border-b-2 border-red-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Legacy Quotations (Read Only)
            </button>
          </div>

          {activeTab === 'proposals' ? (
            <ProposalTable 
              proposals={proposals} 
              keyword={proposalKeyword} 
              setKeyword={setProposalKeyword} 
              fetchProposals={fetchProposals}
            />
          ) : (
            <LegacyQuotationTableBD
              quotations={showApiData}
              clientName={clientName}
              setSelectedClient={setSelectedClient}
              setSelectedTxn={setSelectedTxn}
              setShowModal={setShowModal}
              clientDataReceived={clientDataReceived}
              handleDeletequotation={handleDeletequotation}
              createdInvoices={createdInvoices}
              handleNavigateInovice={handleNavigateInovice}
              handleDeleteInvoice={handleDeleteInvoice}
              handleCreateClientInvoice={handleCreateClientInvoice}
            />
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="relative bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md">
              <button
                onClick={() => setShowModal(false)}
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
                  onClick={() => {
                    navigate(
                      `/BD/quotation/${selectedClient}/${selectedTxn}?gst=1`
                    );
                    setShowModal(false);
                  }}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  With GST (18%)
                </button>
                <button
                  onClick={() => {
                    navigate(
                      `/BD/quotation/${selectedClient}/${selectedTxn}?gst=0`
                    );
                    setShowModal(false);
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Without GST
                </button>
              </div>
            </div>
          </div>
        )}
        {showModalInvoice && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="relative bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md">
              <button
                onClick={() => setShowModalInvoice(false)}
                className="absolute top-2 right-3 text-red-600 hover:text-gray-500 text-xl font-bold"
                aria-label="Close"
              >
                ×
              </button>
              <h2 className="text-lg font-semibold mb-4 text-center">
                Select Invoice Type
              </h2>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => {
                    navigate(`/BD/invoice/${id}/${selectedTxn}?gst=1`);
                    setShowModalInvoice(false);
                  }}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  With GST (18%)
                </button>
                <button
                  onClick={() => {
                    navigate(`/BD/invoice/${id}/${selectedTxn}?gst=0`);
                    setShowModalInvoice(false);
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Without GST
                </button>
              </div>
            </div>
          </div>
        )}
        {showModalInvoiceClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
              onClick={handleCloseInvoiceClient}
            />

            {/* Modal */}
            <div className="relative bg-white w-full max-w-md rounded-xl shadow-2xl transform transition-all animate-in fade-in-0 zoom-in-95 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-red-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {"Add Invoice Detail"}
                  </h2>
                </div>
                <button
                  onClick={handleCloseInvoiceClient}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateInvoice} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bill Type
                  </label>
                  <select
                    name="bill_type"
                    value={formData.bill_type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                    required
                  >
                    <option value="NON_GST">Non-GST Bill</option>
                    <option value="GST">GST Bill</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar1 className="w-4 h-4 inline mr-2" />
                    Duration start date
                  </label>
                  <input
                    type="date"
                    name="duration_start_date"
                    value={formData.duration_start_date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                    placeholder="Enter Duration start date"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar1 className="w-4 h-4 inline mr-2" />
                    Duration end date
                  </label>
                  <input
                    type="date"
                    name="duration_end_date"
                    value={formData.duration_end_date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                    placeholder="Enter Duration end date"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building className="w-4 h-4 inline mr-2" />
                    Payment Mode
                  </label>
                  <select
                    name="payment_mode"
                    value={formData.payment_mode}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                    required
                  >
                    <option value="" className="text-gray-500">
                      Select Payment Mode
                    </option>
                    <option value="Payment Cheque">Payment Cheque</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                {formData.bill_type === "GST" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      GST Number (Required for GST Bill)
                    </label>
                    <input
                      type="text"
                      name="client_gst_no"
                      value={formData.client_gst_no}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                      placeholder="Enter GST Number"
                      required={formData.bill_type === "GST"} // make required only for GST
                      maxLength={15}
                    />
                  </div>
                )}

                {formData.bill_type === "NON_GST" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Pan Card Number (Optional)
                    </label>
                    <input
                      type="text"
                      name="client_pan_no"
                      maxLength={10}
                      value={formData.client_pan_no}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                      placeholder="Enter Pan Card Number"
                    />
                  </div>
                )}

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseInvoiceClient}
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm"
                  >
                    {loading ? "Saving..." : "Save Client"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        <PaginationContainer>
          <ReactPaginate
            previousLabel={"Previous"}
            nextLabel={"Next"}
            breakLabel={"..."}
            pageCount={totalPages}
            marginPagesDisplayed={2}
            pageRangeDisplayed={5}
            onPageChange={handlePageChange}
            containerClassName={"pagination"}
            activeClassName={"active"}
            forcePage={currentPage}
          />
        </PaginationContainer>

        {/* Stats Section */}
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
        <PaymentModal fetchProposals={fetchProposals} />
      </div>
    </div>
  );
};

export default HistoryBD;
const PaginationContainer = styled.div`
  .pagination {
    display: flex;
    justify-content: center;
    padding: 10px;
    list-style: none;
    border-radius: 5px;
  }

  .pagination li {
    margin: 0 5px;
  }

  .pagination li a {
    display: block;
    padding: 8px 16px;
    border: 1px solid #e6ecf1;
    color: #a73418;
    cursor: pointer;
    text-decoration: none;
    border-radius: 5px;
    box-shadow: 0px 0px 1px #000;
    font-size: 14px; /* Default font size */
  }

  .pagination li.active a {
    background-color: #fef9c3;
    color: #d7a548;
    border: 1px solid #fef9c3;
  }

  .pagination li.disabled a {
    color: #166556;
    cursor: not-allowed;
    background-color: #dcfce7;
    border: 1px solid #dcfce7;
  }

  .pagination li a:hover:not(.active) {
    background-color: #dcfce7;
    color: #166556;
  }

  /* Responsive adjustments for smaller screens */
  @media (max-width: 768px) {
    .pagination {
      padding: 5px;
      flex-wrap: wrap;
    }

    .pagination li {
      margin: 2px;
    }

    .pagination li a {
      padding: 6px 10px;
      font-size: 12px;
    }
  }

  @media (max-width: 480px) {
    .pagination {
      padding: 5px;
    }

    .pagination li {
      margin: 2px;
    }

    .pagination li a {
      padding: 4px 8px;
      font-size: 10px;
    }

    /* Hide the previous and next labels for extra-small screens */
    .pagination li:first-child a::before {
      content: "«";
      margin-right: 5px;
    }

    .pagination li:last-child a::after {
      content: "»";
      margin-left: 5px;
    }
  }
`;
