import React from "react";
import {
  Search,
  X,
  Palette,
  Megaphone,
  PenTool,
  Trash2,
  BadgePercent,
} from "lucide-react";
import Calculator from "../../../shared/Calculator";
import AdsCampaignCalculator from "../../../Admin/AdsCampaignCalculator";
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

  const renderTable = (title, items, isAds = false) => {
    if (items.length === 0) return null;
    return (
      <div className="overflow-x-auto bg-gray-900/40 rounded-xl border border-gray-800/50 mb-4">
        <h4 className="p-3 text-white font-bold bg-gray-800/80 border-b border-gray-700/50">{title}</h4>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-700/50 bg-gray-800/30 text-gray-400 uppercase tracking-wider text-[10px] font-bold">
              <th className="p-3">Category Name</th>
              <th className="p-3">Service Name</th>
              <th className="p-3 w-20 text-center">Qty</th>
              <th className="p-3 w-32 text-right">Total</th>
              <th className="p-3 w-20 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row, idx) => (
              <tr
                key={`${row.originalIndex}-${idx}`}
                className="border-b border-gray-800/50 hover:bg-gray-800/20 transition group"
              >
                <td className="p-3">
                  <p className="font-medium text-gray-200">
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
                    <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full mt-1 inline-block">
                      Plan Service
                    </span>
                  )}
                  {row.source === "custom_graphic" && (
                    <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full mt-1 inline-block">
                      Graphic & SEO
                    </span>
                  )}
                  {(row.source === "custom_complimentary" || row.is_complimentary) && (
                    <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full mt-1 inline-block">
                      Complimentary
                    </span>
                  )}
                  {row.source === "custom_ads" && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full mt-1 inline-block">
                      Ads Campaign
                    </span>
                  )}
                  {!row.source && !row.is_complimentary && (
                    <span className="text-[10px] bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full mt-1 inline-block">
                      Manual
                    </span>
                  )}
                </td>
                <td className="p-3">
                  <p className="font-medium text-gray-200">
                    {String(row.service_name || row.service || "-")
                      .replace(/\s*\((complimentary|complimntory)\)\s*$/i, "")
                      .trim()}
                  </p>
                </td>
                <td className="p-3 text-center text-gray-300">{isAds ? "-" : row.quantity || 1}</td>
                <td className="p-3 text-right text-yellow-400 font-semibold">
                  ₹{Number(isAds ? row.budget : row.total_price).toLocaleString()}
                </td>
                <td className="p-3 flex justify-center gap-2">
                  {row.source?.startsWith("custom") ? (
                    <button
                      onClick={() => setActiveCalculator(row.source === "custom_ads" ? "ads" : "graphic")}
                      className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition opacity-0 group-hover:opacity-100"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                    </button>
                  ) : isAdmin ? (
                    <button
                      onClick={() => removePricingRow(row.originalIndex)}
                      className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const { dmTotal, adsTotal } = getBillableTotals(pricingTable);
  const discountAmt = getDiscountAmount(dmTotal);
  const finalDmTotal = Math.max(0, dmTotal - discountAmt);

  return (
    <div className="space-y-6">
      {/* Toggle Mode */}
      <div className="flex bg-gray-900/50 rounded-xl p-1 border border-gray-700 w-full max-w-sm mx-auto">
        <button
          onClick={() => setPricingMode("plan")}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
            pricingMode === "plan" ? "bg-red-600 text-white shadow-md" : "text-gray-400 hover:text-white"
          }`}
        >
          Select Plan
        </button>
        <button
          onClick={() => setPricingMode("custom")}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
            pricingMode === "custom" ? "bg-orange-600 text-white shadow-md" : "text-gray-400 hover:text-white"
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
              onFocus={() => setDropdownOpen(true)}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900/80 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setDropdownOpen(false);
                }}
                className="absolute right-3 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {dropdownOpen && filteredPlans.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
              {filteredPlans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => handlePlanSelect(plan)}
                  className="p-3 border-b border-gray-700/50 hover:bg-gray-700/50 cursor-pointer transition"
                >
                  <h4 className="font-semibold text-white text-sm">{plan.title}</h4>
                  <p className="text-xs text-gray-400 mt-1">{plan.services.length} Services Included</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Custom Service UI */}
      {pricingMode === "custom" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => setActiveCalculator("graphic")}
            className="bg-gray-800/80 border border-gray-700 rounded-xl p-5 hover:border-orange-500/50 hover:bg-gray-800 cursor-pointer transition group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 group-hover:scale-110 transition">
                <Palette className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white">Graphic & SEO</h4>
                <p className="text-xs text-gray-400 mt-1">Design, SEO, Websites</p>
              </div>
            </div>
          </div>
          <div
            onClick={() => setActiveCalculator("ads")}
            className="bg-gray-800/80 border border-gray-700 rounded-xl p-5 hover:border-red-500/50 hover:bg-gray-800 cursor-pointer transition group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 group-hover:scale-110 transition">
                <Megaphone className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white">Ads Campaigns</h4>
                <p className="text-xs text-gray-400 mt-1">Meta, Google Ads Budget</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grouped Pricing Tables */}
      <div className="space-y-4">
        {pricingTable.length === 0 ? (
          <div className="overflow-x-auto bg-gray-900/40 rounded-xl border border-gray-800/50 p-8 text-center text-gray-500 text-sm">
            No services added yet.
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
      {activeCalculator === "graphic" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-6xl bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 my-8">
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900 rounded-t-2xl">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-orange-400" /> Graphic & SEO Calculator
              </h2>
              <button
                onClick={() => setActiveCalculator(null)}
                className="w-8 h-8 rounded-lg hover:bg-gray-800 text-gray-400 flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 max-h-[80vh] overflow-y-auto">
              <Calculator
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
        </div>
      )}

      {activeCalculator === "ads" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-6xl bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 my-8">
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900 rounded-t-2xl">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-red-400" /> Ads Campaign Calculator
              </h2>
              <button
                onClick={() => setActiveCalculator(null)}
                className="w-8 h-8 rounded-lg hover:bg-gray-800 text-gray-400 flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 max-h-[80vh] overflow-y-auto">
              <AdsCampaignCalculator
                hideNotes={true}
                onServiceAdded={handleServiceAdded}
                onServiceDeleted={handleServiceDeleted}
                embeddedData={pricingTable.filter((r) => r.source === "custom_ads")}
              />
            </div>
          </div>
        </div>
      )}

      {/* Summary / Totals */}
      <div className="flex justify-end pt-4 border-t border-gray-700/50 mt-4">
        <div className="w-1/2 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={openDiscountModal}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 border border-yellow-400/20 rounded-xl transition-all text-sm font-semibold"
            >
              <BadgePercent className="w-4 h-4" />
              {discountValue > 0 ? "Edit Discount" : "Apply Discount"}
            </button>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">Subtotal (Excl. GST)</p>
            <p className="text-lg font-semibold text-white">₹{dmTotal.toLocaleString()}</p>

            {discountValue > 0 && (
              <>
                <p className="text-sm text-red-400 uppercase tracking-wider mt-2 mb-1">Discount</p>
                <p className="text-md font-semibold text-red-400">- ₹{discountAmt.toLocaleString()}</p>
              </>
            )}

            {adsTotal > 0 && (
              <>
                <p className="text-sm text-gray-400 uppercase tracking-wider mt-3 mb-1">Ads Budget Total</p>
                <p className="text-lg font-semibold text-white">₹{adsTotal.toLocaleString()}</p>
              </>
            )}

            <p className="text-sm text-gray-400 uppercase tracking-wider mt-3 mb-1">Grand Total (Excl. GST)</p>
            <p className="text-2xl font-bold text-white">₹{(finalDmTotal + adsTotal).toLocaleString()}</p>
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
