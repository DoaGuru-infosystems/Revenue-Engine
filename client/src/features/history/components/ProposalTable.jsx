import React from "react";
import moment from "moment";
import { Search, Calendar, FileText } from "lucide-react";
import { PROPOSAL_STATUS_MAP } from "../../../config/proposalStatuses";
import ProposalActions from "./ProposalActions";

const ProposalTable = ({
  proposals,
  keyword,
  setKeyword,
  fetchProposals,
  handleCreateProformaFromProposal,
  openProformaManager,
}) => {
  const filteredProposals = proposals.filter((p) => {
    const searchString =
      `${p.id} ${p.company_name || ""} ${p.client_name || ""} ${p.proposal_type}`.toLowerCase();
    return searchString.includes(keyword.toLowerCase());
  });

  const getDisplayStatus = (proposal) => {
    const displayStatus = [
      "proforma_generated",
      "proforma_sent",
      "payment_awaited",
      "partially_paid",
      "payment_received",
      "invoiced",
    ].includes(proposal.status)
      ? "client_approved"
      : proposal.status || "draft";
    return PROPOSAL_STATUS_MAP[displayStatus] || PROPOSAL_STATUS_MAP.draft;
  };

  return (
    <div className="bg-slate-50/60 dark:bg-gray-800/40 backdrop-blur-xl border border-gray-200 dark:border-gray-700/50 rounded-xl sm:rounded-2xl shadow-sm flex flex-col min-h-[280px] sm:min-h-[500px] overflow-visible">
      {/* Toolbar */}
      <div className="p-3 sm:p-5 border-b border-gray-200 dark:border-gray-700/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-white dark:bg-gray-900/40 gap-2.5 sm:gap-4 rounded-t-xl sm:rounded-t-2xl">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg">
            Active Proposals
          </h3>
          <span className="sm:hidden text-xs text-gray-500 dark:text-gray-400">
            {filteredProposals.length} shown
          </span>
        </div>
        <div className="relative w-full sm:w-auto sm:min-w-[16rem]">
          <input
            type="text"
            placeholder="Search proposals..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl text-sm w-full text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all shadow-sm"
          />
          <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      <div className="p-2.5 sm:p-5 flex-1 overflow-visible">
        {/* Desktop header */}
        <div className="hidden lg:grid grid-cols-6 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          <div>Proposal ID</div>
          <div>Date</div>
          <div>Type</div>
          <div className="text-right">Amount (₹)</div>
          <div className="text-center">Status</div>
          <div className="text-right">Actions</div>
        </div>

        <div className="flex flex-col space-y-2.5 sm:space-y-3">
          {filteredProposals.length > 0 ? (
            filteredProposals.map((proposal) => {
              const statusInfo = getDisplayStatus(proposal);
              const amount = Number(proposal.grand_total_excl_gst || 0).toLocaleString();

              return (
                <div
                  key={proposal.id}
                  className="relative bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl sm:rounded-2xl hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 shadow-sm overflow-visible"
                >
                  {/* Mobile / tablet card */}
                  <div className="lg:hidden p-3.5 sm:p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                          PRP-{proposal.id}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 capitalize truncate">
                          {proposal.proposal_type || "—"}
                        </p>
                      </div>
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold shadow-sm shrink-0 max-w-[45%] text-center"
                        style={{
                          backgroundColor: statusInfo.bg,
                          color: statusInfo.color,
                          border: `1px solid ${statusInfo.color}30`,
                        }}
                      >
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="rounded-xl bg-slate-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700/40 px-3 py-2.5">
                        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                          <Calendar className="w-3 h-3" />
                          Date
                        </div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {moment(proposal.created_at).format("DD MMM YYYY")}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700/40 px-3 py-2.5">
                        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                          <FileText className="w-3 h-3" />
                          Amount
                        </div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          ₹{amount}
                        </p>
                      </div>
                    </div>

                    {(proposal.company_name || proposal.client_name) && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {proposal.company_name || proposal.client_name}
                      </p>
                    )}

                    <div className="pt-0.5">
                      <ProposalActions
                        proposal={proposal}
                        fetchProposals={fetchProposals}
                        handleCreateProformaFromProposal={handleCreateProformaFromProposal}
                        openProformaManager={openProformaManager}
                        fullWidth
                      />
                    </div>
                  </div>

                  {/* Desktop row */}
                  <div className="hidden lg:grid grid-cols-6 gap-4 items-center px-6 py-5">
                    <div className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                      PRP-{proposal.id}
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {moment(proposal.created_at).format("DD MMM YYYY")}
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 capitalize truncate">
                      {proposal.proposal_type}
                    </div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white text-right">
                      ₹{amount}
                    </div>
                    <div className="text-center">
                      <span
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm"
                        style={{
                          backgroundColor: statusInfo.bg,
                          color: statusInfo.color,
                          border: `1px solid ${statusInfo.color}30`,
                        }}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="flex justify-end">
                      <ProposalActions
                        proposal={proposal}
                        fetchProposals={fetchProposals}
                        handleCreateProformaFromProposal={handleCreateProformaFromProposal}
                        openProformaManager={openProformaManager}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 sm:py-16 flex flex-col items-center justify-center bg-white dark:bg-gray-800/20 border border-gray-200 dark:border-gray-700/30 rounded-xl sm:rounded-2xl border-dashed px-4 text-center">
              <p className="text-base sm:text-lg font-semibold text-gray-500 dark:text-gray-400 mb-1">
                No proposals found
              </p>
              <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">
                Try adjusting your search query.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProposalTable;
