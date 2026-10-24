import React, { useEffect, useState, useCallback } from "react";
import { ArrowLeft, Plus, ListChecks, FileText } from "lucide-react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../../../redux/user/userSlice";
import Swal from "sweetalert2";
import Header from "../../../Components/Header";
import API_BASE_URL from "../../../config/apiBaseUrl";
import ProposalTable from "../components/ProposalTable";
import QuotationTable from "../components/QuotationTable";
import PaymentModal from "../components/PaymentModal";
import ProformaManagerModal from "../components/ProformaManagerModal";
import GenerateProformaModal from "../components/GenerateProformaModal";

const ClientServiceHistoryPage = () => {
  const baseURL = API_BASE_URL;
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { id } = useParams();
  const { token } = useSelector((state) => state.user);

  const isAdmin = location.pathname.startsWith("/admin");
  const basePath = isAdmin ? "/admin" : "/BD";

  const [activeTab, setActiveTab] = useState("proposals");
  const [proposals, setProposals] = useState([]);
  const [proposalKeyword, setProposalKeyword] = useState("");
  const [quotations, setQuotations] = useState([]);
  const [quotationKeyword, setQuotationKeyword] = useState("");
  const [creatingQuotation, setCreatingQuotation] = useState(false);
  const [clientData, setClientData] = useState(null);

  // Modals
  const [showProformaManager, setShowProformaManager] = useState(false);
  const [selectedProposalForManager, setSelectedProposalForManager] = useState(null);
  const [showModalInvoiceClient, setShowModalInvoiceClient] = useState(false);
  const [initialSelectedProposalId, setInitialSelectedProposalId] = useState(null);
  const [initialSelectedQuotationId, setInitialSelectedQuotationId] = useState(null);

  const openProformaManager = (proposal) => {
    setSelectedProposalForManager(proposal);
    setShowProformaManager(true);
  };

  const handleCreateProformaFromProposal = (proposal) => {
    setInitialSelectedQuotationId(null);
    setInitialSelectedProposalId(proposal.id);
    setShowModalInvoiceClient(true);
  };

  const handleCreateProformaFromQuotation = (quotation) => {
    setInitialSelectedProposalId(null);
    setInitialSelectedQuotationId(quotation.id);
    setShowModalInvoiceClient(true);
  };

  const approvedStatuses = [
    "approved",
    "client_approved",
    "proforma_generated",
    "proforma_sent",
    "payment_awaited",
    "partially_paid",
  ];

  const handleCreateProposal = () => {
    navigate(`${basePath}/proposal-builder/${id}`);
  };

  const handleCreateQuotation = async () => {
    setCreatingQuotation(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/auth/api/re_calculator/quotation`,
        { client_id: id, created_by: token ? "BD" : "Admin" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.status === "Success") {
        const quotationId = res.data.quotationId;
        navigate(`${basePath}/ServicesLanding/${id}/${quotationId}?mode=quotation`, {
          state: { mode: "quotation", quotationId },
        });
      } else {
        Swal.fire({ icon: "error", title: "Error", text: res.data.message || "Failed to create quotation", timer: 1500, showConfirmButton: false });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err?.response?.data?.message || "Failed to create quotation", timer: 1500, showConfirmButton: false });
    } finally {
      setCreatingQuotation(false);
    }
  };

  const fetchClient = useCallback(async () => {
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
      if (res.data.success || res.data.status === "Success") {
        const data = res.data.data;
        setClientData(Array.isArray(data) ? data[0] || null : data);
      }
    } catch (error) {
      console.error(error);
      if (error.response && error.response.status === 401) {
        Swal.fire({
          title: "Session Expired",
          text: "Please login again.",
          icon: "warning",
          showConfirmButton: false,
          timer: 1000,
        }).then(() => {
          dispatch(clearUser());
          localStorage.removeItem("token");
          navigate("/");
        });
      }
    }
  }, [baseURL, id, token, dispatch, navigate]);

  const fetchProposals = useCallback(async () => {
    try {
      const res = await axios.get(`${baseURL}/auth/api/re_calculator/proposals/client/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.status === "Success") {
        setProposals(res.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching proposals", error);
    }
  }, [baseURL, id, token]);

  const fetchQuotations = useCallback(async () => {
    try {
      const res = await axios.get(`${baseURL}/auth/api/re_calculator/quotations/client/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.status === "Success") {
        setQuotations(res.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching quotations", error);
    }
  }, [baseURL, id, token]);

  useEffect(() => {
    fetchClient();
    fetchProposals();
    fetchQuotations();
  }, [fetchClient, fetchProposals, fetchQuotations]);

  const clientLabel =
    clientData?.client_organization || clientData?.client_name || "";

  return (
    <>
      <div className="min-h-screen bg-slate-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-slate-800 dark:to-gray-900 text-gray-900 dark:text-white relative overflow-x-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse delay-500" />
        </div>

        <Header />

        {/* pt-20/24 clears fixed Header (h-16) so page title is never clipped */}
        <div className="relative z-10 px-3 pb-24 sm:px-6 sm:pb-20 space-y-4 sm:space-y-6 pt-20 sm:pt-24 max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                Proposal & Quotation History
              </h2>
              {clientLabel ? (
                <p className="mt-1 text-sm sm:text-base text-gray-600 dark:text-gray-400 truncate">
                  {clientLabel}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 transition shadow-sm"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" />
                Go Back
              </button>

              {isAdmin && (
                <button
                  onClick={() => {
                    localStorage.setItem("admin-active-tab", "assign");
                    navigate(`${basePath}/dashboard`);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-orange-50 hover:bg-orange-100 dark:bg-orange-500/20 dark:hover:bg-orange-500/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30 transition shadow-sm"
                >
                  <ListChecks className="w-4 h-4 shrink-0" />
                  Assign List
                </button>
              )}

              <button
                onClick={handleCreateProposal}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-md transition"
              >
                <Plus className="w-4 h-4 shrink-0" />
                New Proposal
              </button>

              <button
                id="new-quotation-btn"
                onClick={handleCreateQuotation}
                disabled={creatingQuotation}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white shadow-md transition"
              >
                <FileText className="w-4 h-4 shrink-0" />
                {creatingQuotation ? "Creating..." : "New Quotation"}
              </button>
            </div>
          </div>

          {/* Main content */}
          <div className="bg-white dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-sm overflow-visible">
            <div className="p-3 sm:p-5 lg:p-6">
              <div className="flex space-x-4 mb-3 sm:mb-5 border-b border-gray-200 dark:border-gray-700 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setActiveTab("proposals")}
                  className={`pb-2 px-1 font-semibold text-sm whitespace-nowrap transition-colors border-b-2 shrink-0 ${
                    activeTab === "proposals"
                      ? "border-orange-500 text-orange-600 dark:text-orange-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  Proposals
                  {proposals.length > 0 && (
                    <span className="ml-1.5 text-xs font-medium text-gray-400 dark:text-gray-500">
                      ({proposals.length})
                    </span>
                  )}
                </button>

                <button
                  id="quotations-tab-btn"
                  onClick={() => setActiveTab("quotations")}
                  className={`pb-2 px-1 font-semibold text-sm whitespace-nowrap transition-colors border-b-2 shrink-0 ${
                    activeTab === "quotations"
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  Quotations
                  {quotations.length > 0 && (
                    <span className="ml-1.5 text-xs font-medium text-gray-400 dark:text-gray-500">
                      ({quotations.length})
                    </span>
                  )}
                </button>
              </div>

              {activeTab === "proposals" && (
                <ProposalTable
                  proposals={proposals}
                  fetchProposals={fetchProposals}
                  keyword={proposalKeyword}
                  setKeyword={setProposalKeyword}
                  handleCreateProformaFromProposal={handleCreateProformaFromProposal}
                  openProformaManager={openProformaManager}
                />
              )}

              {activeTab === "quotations" && (
                <QuotationTable
                  quotations={quotations}
                  keyword={quotationKeyword}
                  setKeyword={setQuotationKeyword}
                  fetchQuotations={fetchQuotations}
                  handleCreateProformaFromQuotation={handleCreateProformaFromQuotation}
                  openProformaManager={(quotation) => openProformaManager({ ...quotation, isQuotation: true })}
                />
              )}
            </div>
          </div>

          {showModalInvoiceClient && (
            <GenerateProformaModal
              isOpen={showModalInvoiceClient}
              onClose={() => {
                setShowModalInvoiceClient(false);
                setInitialSelectedProposalId(null);
                setInitialSelectedQuotationId(null);
              }}
              clientData={clientData}
              proposalsList={proposals.filter((p) => approvedStatuses.includes(p.status))}
              quotationsList={quotations.filter((q) => q.status !== "rejected")}
              initialSelectedProposalId={initialSelectedProposalId}
              initialSelectedQuotationId={initialSelectedQuotationId}
            />
          )}
        </div>

        <PaymentModal fetchProposals={fetchProposals} />

        <ProformaManagerModal
          isOpen={showProformaManager}
          onClose={() => setShowProformaManager(false)}
          proposal={selectedProposalForManager}
        />
      </div>
    </>
  );
};

export default ClientServiceHistoryPage;
