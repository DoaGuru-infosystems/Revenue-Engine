import React from "react";
import moment from "moment";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import Swal from "sweetalert2";
import { PROPOSAL_STATUS_MAP } from "../../../config/proposalStatuses";
import API_BASE_URL from "../../../config/apiBaseUrl";
import ProposalActions from "./ProposalActions";

const ProposalTable = ({ proposals, keyword, setKeyword, fetchProposals, handleCreateProformaFromProposal, openProformaManager }) => {
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.user);

  const handleDeleteProforma = async (proposal) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Warning: Deleting this proforma will also delete all associated payment records from this proforma!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel"
    });

    if (confirm.isConfirmed) {
      try {
        const res = await axios.delete(`${API_BASE_URL}/auth/api/re_calculator/proforma/${proposal.proforma_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.status === "Success") {
          Swal.fire({ icon: "success", title: "Deleted!", text: "Proforma deleted successfully.", timer: 1500, showConfirmButton: false });
          fetchProposals();
        }
      } catch (err) {
        console.error(err);
        Swal.fire({ icon: "error", title: "Failed", text: err.response?.data?.message || "Failed to delete proforma." });
      }
    }
  };

  const filteredProposals = proposals.filter((p) => {
    const searchString = `${p.id} ${p.company_name || ""} ${p.client_name || ""} ${p.proposal_type}`.toLowerCase();
    return searchString.includes(keyword.toLowerCase());
  });

  return (
    <div className="bg-slate-50/60 dark:bg-gray-800/40 backdrop-blur-xl border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-sm flex flex-col min-h-[500px]">
      <div className="p-3.5 sm:p-5 border-b border-gray-200 dark:border-gray-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white dark:bg-gray-900/40 gap-3 sm:gap-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg">Active Proposals</h3>
        <div className="relative w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search proposals..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-750 rounded-xl text-sm w-full sm:w-64 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all shadow-sm"
          />
          <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>
      
      <div className="p-3 sm:p-5 flex-1">
        <div className="hidden lg:grid grid-cols-6 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          <div>Proposal ID</div>
          <div>Date</div>
          <div>Type</div>
          <div className="text-right">Amount (₹)</div>
          <div className="text-center">Status</div>
          <div className="text-right">Actions</div>
        </div>
        
        <div className="flex flex-col space-y-3">
          {filteredProposals.length > 0 ? (
            filteredProposals.map((proposal) => {
              // Show pure proposal lifecycle status in proposals table (keep payment/proforma statuses scoped to proforma/payments)
              const displayStatus = [
                'proforma_generated',
                'proforma_sent',
                'payment_awaited',
                'partially_paid',
                'payment_received',
                'invoiced'
              ].includes(proposal.status)
                ? 'client_approved'
                : (proposal.status || 'draft');
              const statusInfo = PROPOSAL_STATUS_MAP[displayStatus] || PROPOSAL_STATUS_MAP['draft'];
              return (
                <div key={proposal.id} className="relative grid grid-cols-1 lg:grid-cols-6 gap-3 sm:gap-4 items-start lg:items-center px-4 sm:px-6 py-4 sm:py-5 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-2xl hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 shadow-sm group">
                  <div className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                    <span className="lg:hidden text-gray-500 dark:text-gray-400 font-normal mr-2">ID:</span>
                    PRP-{proposal.id}
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="lg:hidden text-gray-500 dark:text-gray-400 font-normal mr-2">Date:</span>
                    {moment(proposal.created_at).format("DD MMM YYYY")}
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                    <span className="lg:hidden text-gray-500 dark:text-gray-400 font-normal mr-2">Type:</span>
                    {proposal.proposal_type}
                  </div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white lg:text-right">
                    <span className="lg:hidden text-gray-500 dark:text-gray-400 font-normal mr-2">Amount:</span>
                    ₹{Number(proposal.grand_total_excl_gst).toLocaleString()}
                  </div>
                  <div className="lg:text-center">
                    <span 
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm"
                      style={{ backgroundColor: statusInfo.bg, color: statusInfo.color, border: `1px solid ${statusInfo.color}30` }}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="lg:text-right flex justify-start lg:justify-end mt-2 lg:mt-0">
                    <ProposalActions proposal={proposal} fetchProposals={fetchProposals} handleCreateProformaFromProposal={handleCreateProformaFromProposal} openProformaManager={openProformaManager} />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-16 flex flex-col items-center justify-center bg-white dark:bg-gray-800/20 border border-gray-200 dark:border-gray-700/30 rounded-2xl border-dashed">
              <p className="text-base sm:text-lg font-semibold text-gray-500 dark:text-gray-400 mb-1">No proposals found</p>
              <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">Try adjusting your search query.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProposalTable;
