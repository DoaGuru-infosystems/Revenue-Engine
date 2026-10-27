import React from "react";
import moment from "moment";
import { Search, Calendar, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PROPOSAL_STATUS_MAP } from "../../../config/proposalStatuses";
import QuotationActions from "./QuotationActions";
import { checkDraftStatus } from "../../calculator/utils/quotationDraftPersistence";

const QuotationTable = ({
  quotations,
  keyword,
  setKeyword,
  fetchQuotations,
  handleCreateProformaFromQuotation,
  openProformaManager,
}) => {
  const navigate = useNavigate();
  const basePath = window.location.pathname.includes("/BD/") ? "/BD" : "/admin";
  const filtered = (quotations || []).filter((q) => {
    const searchString = `${q.quotation_number || ""} ${q.id} ${q.client_name || ""} ${q.client_organization || ""}`.toLowerCase();
    return searchString.includes((keyword || "").toLowerCase());
  });

  const getDisplayStatus = (row) => {
    const key = row.status || "draft";
    return PROPOSAL_STATUS_MAP[key] || PROPOSAL_STATUS_MAP.draft;
  };

  const getDisplayAmount = (row) => {
    if (Number(row.grand_total_excl_gst) > 0) {
      return Number(row.grand_total_excl_gst).toLocaleString();
    }
    try {
      const draftStatus = checkDraftStatus({ quotationId: row.id });
      if (draftStatus?.restoreAvailable && draftStatus?.draft && Array.isArray(draftStatus.draft.draftItems)) {
        const active = draftStatus.draft.draftItems.filter((i) => i._status !== "pending_delete");
        const paidServices = active.filter(
          (i) => i._type === "service" && !i.is_complimentary && i.include_in_total !== false
        );
        const serviceTotal = paidServices.reduce(
          (sum, it) => sum + Number(it.total_amount || it.total_price || it.total || 0),
          0
        );
        const adsTotal = active
          .filter((i) => i._type === "ads")
          .reduce((sum, it) => sum + Number(it.total || it.total_amount || it.budget || 0), 0);
        let raw = serviceTotal + adsTotal;
        const discount = draftStatus.draft.discount;
        if (discount) {
          if (discount.discount_type === "percentage" || discount.type === "percentage") {
            const pct = Number(discount.discount_per || discount.value || 0);
            raw = Math.max(0, raw - (raw * pct) / 100);
          } else {
            const amt = Number(discount.discount_amt || discount.value || 0);
            raw = Math.max(0, raw - amt);
          }
        }
        if (raw > 0) return `${raw.toLocaleString()} (Draft)`;
      }
    } catch {}
    return Number(row.grand_total_excl_gst || 0).toLocaleString();
  };

  return (
    <div className="bg-slate-50/60 dark:bg-gray-800/40 backdrop-blur-xl border border-gray-200 dark:border-gray-700/50 rounded-xl sm:rounded-2xl shadow-sm flex flex-col min-h-[280px] overflow-visible">
      <div className="p-3 sm:p-5 border-b border-gray-200 dark:border-gray-700/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 rounded-t-xl">
        <h3 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg">Quotations</h3>
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search quotations..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl text-sm w-full text-gray-900 dark:text-white"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      <div className="p-2.5 sm:p-5 flex-1 overflow-visible">
        <div className="hidden lg:grid grid-cols-5 gap-4 px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
          <div>Number</div>
          <div>Date</div>
          <div className="text-right">Amount (₹)</div>
          <div className="text-center">Status</div>
          <div className="text-right">Actions</div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
            No quotations yet.
          </div>
        ) : (
          <div className="flex flex-col space-y-2.5">
            {filtered.map((row) => {
              const statusInfo = getDisplayStatus(row);
              const amount = getDisplayAmount(row);
              const isDraft = (row.status || "draft") === "draft";
              return (
                <div key={row.id} className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl overflow-visible">
                  <div className="lg:hidden p-3.5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (isDraft) {
                            navigate(
                              `${basePath}/ServicesLanding/${row.client_id}/${row.id}?mode=quotation`,
                              { state: { mode: "quotation", quotationId: row.id } }
                            );
                          } else {
                            navigate(`${basePath}/quotation/${row.client_id}/${row.id}?doc=quotation&source=new_quotation`);
                          }
                        }}
                        className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline text-left cursor-pointer"
                      >
                        {row.quotation_number || `QTN-${row.id}`}
                      </button>
                      <span className="text-[11px] font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: statusInfo.bg, color: statusInfo.color }}>{statusInfo.label}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="inline-flex items-center gap-1 text-gray-500"><Calendar className="w-3 h-3" />{row.created_at ? moment(row.created_at).format("DD MMM YYYY") : "—"}</span>
                      <span className="font-semibold">₹{amount}</span>
                    </div>
                    {isDraft && (
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `${basePath}/ServicesLanding/${row.client_id}/${row.id}?mode=quotation`,
                            { state: { mode: "quotation", quotationId: row.id } }
                          )
                        }
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md transition"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Continue Editing</span>
                      </button>
                    )}
                    <QuotationActions
                      quotation={row}
                      fetchQuotations={fetchQuotations}
                      handleCreateProformaFromQuotation={handleCreateProformaFromQuotation}
                      openProformaManager={openProformaManager}
                      fullWidth
                    />
                  </div>
                  <div className="hidden lg:grid grid-cols-5 gap-4 items-center px-4 py-3">
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          if (isDraft) {
                            navigate(
                              `${basePath}/ServicesLanding/${row.client_id}/${row.id}?mode=quotation`,
                              { state: { mode: "quotation", quotationId: row.id } }
                            );
                          } else {
                            navigate(`${basePath}/quotation/${row.client_id}/${row.id}?doc=quotation&source=new_quotation`);
                          }
                        }}
                        className="font-semibold text-blue-600 dark:text-blue-400 hover:underline text-left cursor-pointer"
                      >
                        {row.quotation_number || `QTN-${row.id}`}
                      </button>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">{row.created_at ? moment(row.created_at).format("DD MMM YYYY") : "—"}</div>
                    <div className="text-right font-semibold">₹{amount}</div>
                    <div className="text-center">
                      <span className="text-[11px] font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: statusInfo.bg, color: statusInfo.color }}>{statusInfo.label}</span>
                    </div>
                    <div className="text-right flex items-center justify-end gap-2">
                      {isDraft && (
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `${basePath}/ServicesLanding/${row.client_id}/${row.id}?mode=quotation`,
                              { state: { mode: "quotation", quotationId: row.id } }
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-sm transition"
                          title="Continue editing unsaved draft"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Continue Editing</span>
                        </button>
                      )}
                      <QuotationActions
                        quotation={row}
                        fetchQuotations={fetchQuotations}
                        handleCreateProformaFromQuotation={handleCreateProformaFromQuotation}
                        openProformaManager={openProformaManager}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuotationTable;
