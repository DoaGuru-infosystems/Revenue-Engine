import React from "react";
import { createPortal } from "react-dom";
import {
  Search,
  X,
  Palette,
  Megaphone,
  PenTool,
  Trash2,
  BadgePercent,
} from "lucide-react";
import GraphicCalculator from "../../calculator/components/GraphicCalculator";
import AdsCampaignCalculator from "../../calculator/components/AdsCampaignCalculator";
import ProposalDiscountModal from "./ProposalDiscountModal";
import { classifyProformaServices } from "../../../utils/proformaPricing";

export default function ProposalPricingSection({
  pricingMode,
  setPricingMode,
  searchQuery,
  setSearchQuery,
  dropdownOpen,
  setDropdownOpen,
  filteredPlans,
  handlePlanSelect,
  activeCalculator,
  setActiveCalculator,
  handleServiceAdded,
  handleServiceDeleted,
  pricingTable,
  isAdmin,
  removePricingRow,
  openDiscountModal,
  showDiscountModal,
  setShowDiscountModal,
  handleApplyDiscount,
  formDataDis,
  handleChangeDis,
  discountValue,
  discountSettings,
  getBillableTotals,
  getDiscountAmount,
}) {
  const tableWithIndex = pricingTable.map((item, originalIndex) => ({
    ...item,
    originalIndex,
  }));
  const { dmServices, adsServices } = classifyProformaServices(tableWithIndex);

  const isItemComplimentary = (item) => {
    if (item.is_complimentary !== undefined && item.is_complimentary !== null) {
      return Boolean(item.is_complimentary);
    }
    if (item.source === "custom_complimentary" || item.source === "complimentary") return true;
    if (item.include_in_total === false) return true;
    const sName = String(item.service_name || item.service || "").toLowerCase();
    return (
      sName.includes("(complimentary)") ||
      sName.includes("(complimntory)") ||
      sName === "complimentary"
    );
  };

  const complimentaryItems = tableWithIndex.filter(isItemComplimentary);
  const dmItems = dmServices.filter((item) => !isItemComplimentary(item));

  const getComplimentaryAmount = (row) => {
    const qty = Number(row.quantity) || 1;
    let unitAmt =
      Number(row.editing_type_amount) > 0
        ? Number(row.editing_type_amount)
        : Number(row.price) > 0
          ? Number(row.price)
          : Number(row.unit_price) > 0
            ? Number(row.unit_price)
            : Number(row.amount) > 0
              ? Number(row.amount) / qty
              : Number(row.total_price || row.total_amount) > 0
                ? Number(row.total_price || row.total_amount) / qty
                : 0;

    if (row.include_thumbnail_creation) {
      unitAmt += Number(row.include_thumbnail_creation) || 0;
    }
    if (row.include_content_posting) {
      unitAmt += Number(row.include_content_posting) || 0;
    }
    if (row.include_youtube_video_posting) {
      unitAmt += Number(row.include_youtube_video_posting) || 0;
    }

    return unitAmt * qty;
  };

  const renderTable = (title, items, isAds = false) => {
    if (items.length === 0) return null;
    const isComplimentaryTable = title.toLowerCase().includes("complimentary");

    return (
      <div className="overflow-x-auto bg-white dark:bg-gray-900/40 rounded-xl border border-gray-200 dark:border-gray-800/50 mb-4 shadow-sm">
        <h4 className="p-3 text-gray-900 dark:text-white font-bold bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700/50 text-sm sm:text-base">{title}</h4>
        <table className="w-full text-left text-sm min-w-[550px]">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700/50 bg-gray-50/70 dark:bg-gray-800/30 text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px] font-bold">
              <th className="p-3">Category Name</th>
              <th className="p-3">Service Name</th>
              <th className="p-3 w-20 text-center">Qty</th>
              <th className="p-3 w-36 text-right">Total</th>
              <th className="p-3 w-20 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row, idx) => {
              const isRowComplimentary = isComplimentaryTable || isItemComplimentary(row);
              const compAmt = isRowComplimentary ? getComplimentaryAmount(row) : 0;

              return (
                <React.Fragment key={`${row.originalIndex}-${idx}`}>
                  <tr
                    className="border-b border-gray-150 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition group"
                  >
                <td className="p-3">
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {row.category_name || "-"}
                    {row.editing_type_name &&
                    row.editing_type_name !== "null" &&
                    row.editing_type_name !== "N/A" &&
                    row.editing_type_name !== "undefined" &&
                    row.editing_type_name.toLowerCase() !== "proposal item" &&
                    row.editing_type_name.trim().toLowerCase() !== (row.category_name || "").trim().toLowerCase() &&
                    row.editing_type_name.trim().toLowerCase() !==
                      (row.service_name || row.service || "").trim().toLowerCase()
                      ? ` (${row.editing_type_name})`
                      : ""}
                  </p>
                  {row.source === "plan" && (
                    <span className="text-[10px] bg-red-50 text-red-600 border border-red-200 dark:border-transparent dark:bg-red-500/20 dark:text-red-400 px-2 py-0.5 rounded-full mt-1 inline-block">
                      Plan Service
                    </span>
                  )}
                  {row.source === "custom_graphic" && (
                    <span className="text-[10px] bg-orange-50 text-orange-600 border border-orange-200 dark:border-transparent dark:bg-orange-500/20 dark:text-orange-400 px-2 py-0.5 rounded-full mt-1 inline-block">
                      Graphic & SEO
                    </span>
                  )}
                  {(row.source === "custom_complimentary" || row.is_complimentary) && (
                    <span className="text-[10px] bg-yellow-50 text-yellow-700 border border-yellow-200 dark:border-transparent dark:bg-yellow-500/20 dark:text-yellow-400 px-2 py-0.5 rounded-full mt-1 inline-block">
                      Complimentary
                    </span>
                  )}
                  {row.source === "custom_ads" && (
                    <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 dark:border-transparent dark:bg-amber-500/20 dark:text-amber-400 px-2 py-0.5 rounded-full mt-1 inline-block">
                      Ads Campaign
                    </span>
                  )}
                  {!row.source && !row.is_complimentary && (
                    <span className="text-[10px] bg-gray-100 text-gray-700 border border-gray-200 dark:border-transparent dark:bg-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full mt-1 inline-block">
                      Manual
                    </span>
                  )}
                </td>
                <td className="p-3">
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {String(row.service_name || row.service || "-")
                      .replace(/\s*\((complimentary|complimntory)\)\s*$/i, "")
                      .trim()}
                  </p>
                </td>
                <td className="p-3 text-center text-gray-600 dark:text-gray-300">{isAds ? "-" : row.quantity || 1}</td>
                <td className="p-3 text-right font-semibold">
                  {isRowComplimentary ? (
                    <span className="text-amber-600 dark:text-yellow-400">
                      ₹{compAmt.toLocaleString("en-IN")}{" "}
                      <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">(Free)</span>
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-yellow-400">
                      {(() => {
                        let rowAddons = [];
                        if (row.additional_services) {
                          try {
                            rowAddons = typeof row.additional_services === "string"
                              ? JSON.parse(row.additional_services)
                              : row.additional_services;
                            if (!Array.isArray(rowAddons)) rowAddons = [];
                          } catch {
                            rowAddons = [];
                          }
                        }
                        const rowQty = Number(row.quantity) || 1;
                        const addonsSum = rowAddons.reduce((s, a) => s + ((Number(a.amount || a.unit_price) || 0) * (Number(a.quantity) || rowQty)), 0);
                        const recordedTotal = Number(isAds ? row.budget : row.total_price);
                        const rowBaseTotal = (!isAds && !isRowComplimentary && recordedTotal >= addonsSum && addonsSum > 0)
                          ? recordedTotal - addonsSum
                          : recordedTotal;
                        return `₹${Number(rowBaseTotal).toLocaleString("en-IN")}`;
                      })()}
                    </span>
                  )}
                </td>
                <td className="p-3 flex justify-center gap-2">
                  {row.source?.startsWith("custom") ? (
                    <button
                      onClick={() => setActiveCalculator(row.source === "custom_ads" ? "ads" : "graphic")}
                      className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-500/10 rounded-lg transition opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                    </button>
                  ) : isAdmin ? (
                    <button
                      onClick={() => removePricingRow(row.originalIndex)}
                      className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-500/10 rounded-lg transition opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                </td>
              </tr>

              {/* Dedicated rows for Additional Services */}
              {(() => {
                let rowAddons = [];
                if (row.additional_services) {
                  try {
                    rowAddons = typeof row.additional_services === "string"
                      ? JSON.parse(row.additional_services)
                      : row.additional_services;
                    if (!Array.isArray(rowAddons)) rowAddons = [];
                  } catch {
                    rowAddons = [];
                  }
                }
                if (rowAddons.length === 0) return null;
                const parentName = String(row.service_name || row.service || "-")
                  .replace(/\s*\((complimentary|complimntory)\)\s*$/i, "")
                  .trim();
                return rowAddons.map((addon, aIdx) => {
                  const addonAmt = Number(addon.amount || addon.unit_price || 0);
                  const addonQty = Number(addon.quantity) || Number(row.quantity) || 1;
                  const addonTotal = addonAmt * addonQty;
                  const addonName = addon.name || addon.additional_service_name || "Additional Service";
                  return (
                    <tr
                      key={`${row.originalIndex}-addon-${aIdx}`}
                      className="border-b border-gray-150 dark:border-gray-750 bg-gray-50/70 dark:bg-gray-900/30 hover:bg-gray-100 dark:hover:bg-gray-750/20 transition-colors"
                    >
                      <td className="p-3" colSpan={2}>
                        <p className="font-semibold text-gray-800 dark:text-white">
                          {addonName} ({parentName})
                        </p>
                      </td>
                      <td className="p-3 text-center text-gray-600 dark:text-gray-300">{addonQty}</td>
                      <td className="p-3 text-right font-semibold text-amber-600 dark:text-yellow-400">
                        {isRowComplimentary ? (
                          <span>
                            ₹{addonTotal.toLocaleString("en-IN")}{" "}
                            <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">(Free)</span>
                          </span>
                        ) : (
                          `₹${addonTotal.toLocaleString("en-IN")}`
                        )}
                      </td>
                      <td className="p-3 text-center text-gray-400 dark:text-gray-500">-</td>
                    </tr>
                  );
                });
              })()}
            </React.Fragment>
          );
        })}
          </tbody>
        </table>
      </div>
    );
  };

  const { dmTotal, adsTotal } = getBillableTotals(pricingTable);
  const discountAmt = getDiscountAmount(dmTotal);
  const finalDmTotal = Math.max(0, dmTotal - discountAmt);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Toggle Mode */}
      <div className="flex bg-gray-100 dark:bg-gray-900/50 rounded-xl p-1 border border-gray-200 dark:border-gray-700 w-full max-w-sm mx-auto shadow-sm">
        <button
          onClick={() => setPricingMode("plan")}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
            pricingMode === "plan" ? "bg-red-600 text-white shadow-md" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          Select Plan
        </button>
        <button
          onClick={() => setPricingMode("custom")}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
            pricingMode === "custom" ? "bg-orange-600 text-white shadow-md" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          Custom Service
        </button>
      </div>

      {/* Plan Selection UI */}
      {pricingMode === "plan" && (
        <div className="relative max-w-md mx-auto">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search plans..."
              value={searchQuery}
              onClick={() => setDropdownOpen(true)}
              onFocus={() => setDropdownOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setDropdownOpen(true);
              }}
              className="w-full min-h-11 bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-10 py-2.5 text-gray-900 dark:text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-base shadow-sm touch-manipulation"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setDropdownOpen(false);
                }}
                className="absolute right-3 text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {dropdownOpen && filteredPlans.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
              {filteredPlans.map((plan) => (
                <button
                  type="button"
                  key={plan.id}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => handlePlanSelect(plan)}
                  className="w-full text-left p-3 min-h-11 border-b border-gray-150 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 active:bg-gray-100 dark:active:bg-gray-700 cursor-pointer transition touch-manipulation"
                >
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{plan.title}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{plan.services.length} Services Included</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Custom Service UI */}
      {pricingMode === "custom" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div
            onClick={() => setActiveCalculator("graphic")}
            className="bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl p-4 sm:p-5 hover:border-orange-500/50 hover:shadow-md cursor-pointer transition group shadow-sm"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-orange-500/15 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-110 transition shrink-0">
                <Palette className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">Graphic & SEO</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">Design, SEO, Websites</p>
              </div>
            </div>
          </div>
          <div
            onClick={() => setActiveCalculator("ads")}
            className="bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl p-4 sm:p-5 hover:border-red-500/50 hover:shadow-md cursor-pointer transition group shadow-sm"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-500/15 flex items-center justify-center text-red-600 dark:text-red-400 group-hover:scale-110 transition shrink-0">
                <Megaphone className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">Ads Campaigns</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">Meta, Google Ads Budget</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grouped Pricing Tables */}
      <div className="space-y-4">
        {pricingTable.length === 0 ? (
          <div className="overflow-x-auto bg-white dark:bg-gray-900/40 rounded-xl border border-gray-200 dark:border-gray-800/50 p-6 sm:p-8 text-center text-gray-400 dark:text-gray-500 text-sm shadow-sm">
            Pricing is required. Add at least one service or ads budget with an amount greater than zero before saving.
          </div>
        ) : (
          <>
            {renderTable("DM Services", dmItems)}
            {renderTable("Ads Services", adsServices, true)}
            {renderTable("Complimentary Services", complimentaryItems)}
          </>
        )}
      </div>

      {/* Modals for Custom Calculators */}
      {activeCalculator === "graphic" && createPortal(
        <div
          className="fixed inset-0 z-[80] flex bg-black/60 p-0 md:p-4 isolate"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveCalculator(null);
          }}
        >
          <div className="flex flex-col w-full h-full md:max-w-3xl md:h-auto md:max-h-[calc(100dvh-2rem)] md:mx-auto md:my-auto md:rounded-2xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
            <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 min-w-0">
                <Palette className="w-5 h-5 text-orange-500 dark:text-orange-400 shrink-0" />
                <span className="truncate">Graphic & SEO Calculator</span>
              </h2>
              <button
                type="button"
                onClick={() => setActiveCalculator(null)}
                className="min-h-11 min-w-11 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white flex items-center justify-center transition touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="touch-form flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-4">
              <GraphicCalculator
                hideNotes={true}
                onServiceAdded={handleServiceAdded}
                onServiceDeleted={handleServiceDeleted}
                embeddedData={pricingTable.filter(
                  (r) =>
                    r.source === "custom_graphic" ||
                    r.source === "custom_complimentary" ||
                    r.is_complimentary
                )}
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {activeCalculator === "ads" && createPortal(
        <div
          className="fixed inset-0 z-[80] flex bg-black/60 p-0 md:p-4 isolate"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveCalculator(null);
          }}
        >
          <div className="flex flex-col w-full h-full md:max-w-3xl md:h-auto md:max-h-[calc(100dvh-2rem)] md:mx-auto md:my-auto md:rounded-2xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
            <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 min-w-0">
                <Megaphone className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0" />
                <span className="truncate">Ads Campaign Calculator</span>
              </h2>
              <button
                type="button"
                onClick={() => setActiveCalculator(null)}
                className="min-h-11 min-w-11 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white flex items-center justify-center transition touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="touch-form flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-4">
              <AdsCampaignCalculator
                hideNotes={true}
                onServiceAdded={handleServiceAdded}
                onServiceDeleted={handleServiceDeleted}
                embeddedData={pricingTable.filter((r) => r.source === "custom_ads")}
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Summary / Totals */}
      <div className="flex flex-col sm:flex-row justify-between sm:justify-end items-start sm:items-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700/50 mt-4">
        <div className="w-full sm:w-80 md:w-96 space-y-3 bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={openDiscountModal}
              className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-600 dark:text-yellow-400 border border-yellow-400/30 rounded-xl transition-all text-xs sm:text-sm font-semibold"
            >
              <BadgePercent className="w-4 h-4" />
              {discountValue > 0 ? "Edit Discount" : "Apply Discount"}
            </button>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Subtotal (Excl. GST)</p>
            <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">₹{dmTotal.toLocaleString()}</p>

            {discountValue > 0 && (
              <>
                <p className="text-xs text-red-500 dark:text-red-400 uppercase tracking-wider mt-2 mb-1">Discount</p>
                <p className="text-sm sm:text-md font-semibold text-red-500 dark:text-red-400">- ₹{discountAmt.toLocaleString()}</p>
              </>
            )}

            {adsTotal > 0 && (
              <>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-3 mb-1">Ads Budget Total</p>
                <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">₹{adsTotal.toLocaleString()}</p>
              </>
            )}

            <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mt-3 mb-1">Grand Total (Excl. GST)</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">₹{(finalDmTotal + adsTotal).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Proposal Discount Modal */}
      <ProposalDiscountModal
        show={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        onSubmit={handleApplyDiscount}
        formDataDis={formDataDis}
        handleChangeDis={handleChangeDis}
        grandTotal={dmTotal}
        discountDataSet={discountSettings[0]}
      />
    </div>
  );
}
