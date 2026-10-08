import React, { useEffect, useState, useCallback } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../redux/user/userSlice";
import Swal from "sweetalert2";
import Header from "../Components/Header";
import API_BASE_URL from "../config/apiBaseUrl";
import ProposalTable from "../Admin/components/ProposalTable";
import PaymentModal from "../Admin/components/PaymentModal";
import ProformaManagerModal from "../Admin/components/ProformaManagerModal";
import GenerateProformaModal from "../Admin/components/GenerateProformaModal";

const History = () => {
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
  const [clientData, setClientData] = useState([]);

  // Modals
  const [showProformaManager, setShowProformaManager] = useState(false);
  const [selectedProposalForManager, setSelectedProposalForManager] = useState(null);
  const [showModalInvoiceClient, setShowModalInvoiceClient] = useState(false);
  const [initialSelectedProposalId, setInitialSelectedProposalId] = useState(null);

  const openProformaManager = (proposal) => {
    setSelectedProposalForManager(proposal);
    setShowProformaManager(true);
  };

  const handleCreateProformaFromProposal = (proposal) => {
    setInitialSelectedProposalId(proposal.id);
    setShowModalInvoiceClient(true);
  };

  const handleCreateProposal = () => {
    navigate(`${basePath}/proposal-builder/${id}`);
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
        setClientData(res.data.data);
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

  useEffect(() => {
    fetchClient();
    fetchProposals();
  }, [fetchClient, fetchProposals]);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <Header />

        <div className="relative z-10 p-6 space-y-8 mt-10">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 lg:gap-0">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Proposal & Quotation History
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
                  localStorage.setItem(isAdmin ? "admin-active-tab" : "bd-active-tab", "assign");
                  navigate(`${basePath}/dashboard`);
                }}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition mx-2"
              >
                Assign List
              </button>
              <button
                onClick={handleCreateProposal}
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
                  value={proposalKeyword}
                  placeholder="Search proposals..."
                  className="w-full sm:w-auto pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 backdrop-blur-sm hover:bg-gray-700/50 transition-all text-sm"
                  onChange={(e) => setProposalKeyword(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Main Table */}
          <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
            <div className="p-8">
              {/* TABS HEADER */}
              <div className="flex space-x-4 mb-6 border-b border-gray-700">
                <button
                  onClick={() => setActiveTab("proposals")}
                  className={`pb-2 px-1 font-semibold text-sm transition-colors border-b-2 ${
                    activeTab === "proposals"
                      ? "border-orange-500 text-orange-400"
                      : "border-transparent text-gray-400 hover:text-gray-300"
                  }`}
                >
                  Proposals
                </button>
              </div>

              {/* TABS CONTENT */}
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
            </div>
          </div>

          {showModalInvoiceClient && (
            <GenerateProformaModal
              isOpen={showModalInvoiceClient}
              onClose={() => {
                setShowModalInvoiceClient(false);
                setInitialSelectedProposalId(null);
              }}
              clientData={clientData}
              proposalsList={proposals.filter((p) =>
                [
                  "approved",
                  "client_approved",
                  "proforma_generated",
                  "proforma_sent",
                  "payment_awaited",
                  "partially_paid",
                ].includes(p.status)
              )}
              initialSelectedProposalId={initialSelectedProposalId}
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

export default History;
