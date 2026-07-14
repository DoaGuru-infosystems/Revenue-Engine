import React from "react";
import moment from "moment";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import Swal from "sweetalert2";
import { PROPOSAL_STATUS_MAP } from "../../config/proposalStatuses";
import API_BASE_URL from "../../config/apiBaseUrl";
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
    <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-[600px]">
      <div className="p-5 border-b border-gray-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-900/40 gap-4">
        <h3 className="font-semibold text-white text-lg">Active Proposals</h3>
        <div className="relative w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search proposals..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="pl-10 pr-4 py-2 bg-gray-900/60 border border-gray-750 rounded-xl text-sm w-full sm:w-64 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all hover:bg-gray-900/80"
          />
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>
      
      <div className="p-5 flex-1 overflow-y-auto">
        <div className="hidden lg:grid grid-cols-6 gap-4 px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
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
              const statusInfo = PROPOSAL_STATUS_MAP[proposal.status] || PROPOSAL_STATUS_MAP['draft'];
              return (
                <div key={proposal.id} className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-center px-6 py-5 bg-gray-800/40 border border-gray-700/50 rounded-2xl hover:bg-gray-800/60 transition-all duration-300 shadow-sm group">
                  <div className="text-sm font-semibold text-orange-400">
                    <span className="lg:hidden text-gray-400 font-normal mr-2">ID:</span>
                    PRP-{proposal.id}
                  </div>
                  <div className="text-sm text-gray-300">
                    <span className="lg:hidden text-gray-400 font-normal mr-2">Date:</span>
                    {moment(proposal.created_at).format("DD MMM YYYY")}
                  </div>
                  <div className="text-sm text-gray-300 capitalize">
                    <span className="lg:hidden text-gray-400 font-normal mr-2">Type:</span>
                    {proposal.proposal_type}
                  </div>
                  <div className="text-sm font-medium text-white lg:text-right">
                    <span className="lg:hidden text-gray-400 font-normal mr-2">Amount:</span>
                    ₹{Number(proposal.grand_total_excl_gst).toLocaleString()}
                  </div>
                  <div className="lg:text-center">
                    <span 
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm"
                      style={{ backgroundColor: statusInfo.bg, color: statusInfo.color, border: `1px solid ${statusInfo.color}30` }}
                    >
                      {statusInfo.label}
                    </span>
                    {proposal.proforma_id && (
                      <div className="flex justify-center gap-2 mt-2">
                        <button
                          onClick={() => {
                            if (openProformaManager) {
                              openProformaManager(proposal);
                            } else {
                              const basePath = window.location.pathname.includes('/BD') ? '/BD' : '/admin';
                              navigate(`${basePath}/quotation/${proposal.client_id}/${proposal.proforma_id}?doc=proforma&source=proposal&gst=${proposal.proforma_is_gst ? 1 : 0}`);
                            }
                          }}
                          className="px-2.5 py-1 text-[11px] font-medium bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-600/30 transition-all w-full"
                        >
                          View Proformas
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="lg:text-right flex justify-start lg:justify-end">
                    <ProposalActions proposal={proposal} fetchProposals={fetchProposals} handleCreateProformaFromProposal={handleCreateProformaFromProposal} openProformaManager={openProformaManager} />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-16 flex flex-col items-center justify-center bg-gray-800/20 border border-gray-700/30 rounded-2xl border-dashed">
              <p className="text-lg font-semibold text-gray-400 mb-1">No proposals found</p>
              <p className="text-sm text-gray-500">Try adjusting your search query.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProposalTable;
