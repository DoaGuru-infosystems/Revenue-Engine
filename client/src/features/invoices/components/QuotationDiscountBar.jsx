import React from "react";

export default function QuotationDiscountBar({
  isBalanceProforma = false,
  clientDataReceived = {},
  docTypeFromURL = "quotation",
  proformaMeta = null,
  selecteddiscount = null,
  selectedAdjustment = null,
  adjustmentAmount = 0,
  adsData = [],
  showMetaAd = true,
  setShowMetaAd,
  showGoogleAd = true,
  setShowGoogleAd,
  handleShowDiscount,
  handleShowAdjustment,
}) {
  const isReceived = clientDataReceived?.tag_received_amt === "received";
  const hasInvoice = docTypeFromURL === "proforma" && proformaMeta?.has_invoice;
  const hideActions = isBalanceProforma || isReceived || hasInvoice;

  const hasMetaAd =
    (docTypeFromURL === "proforma" || isBalanceProforma) &&
    adsData.some((ad) => {
      const name = (
        ad.category_name ||
        ad.category ||
        ad.service_name ||
        ad.service ||
        ""
      ).toLowerCase();
      return (
        (name.includes("meta") ||
          name.includes("facebook") ||
          name.includes("fb") ||
          name.includes("insta")) &&
        Number(ad.amount || ad.budget || 0) > 0
      );
    });

  const hasGoogleAd =
    (docTypeFromURL === "proforma" || isBalanceProforma) &&
    adsData.some((ad) => {
      const name = (
        ad.category_name ||
        ad.category ||
        ad.service_name ||
        ad.service ||
        ""
      ).toLowerCase();
      return name.includes("google") && Number(ad.amount || ad.budget || 0) > 0;
    });

  return (
    <div className="print:hidden flex items-center justify-between gap-3 mt-3 mb-2 px-1">
      <div className="flex items-center gap-2">
        {!hideActions && (
          <>
            <button
              type="button"
              onClick={handleShowDiscount}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full transition-all border shadow-sm bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-amber-500/20"
            >
              🏷️ {selecteddiscount ? "Edit Discount" : "Set Discount"}
            </button>
            {docTypeFromURL === "proforma" && (
              <button
                type="button"
                onClick={handleShowAdjustment}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full transition-all border shadow-sm bg-purple-600 hover:bg-purple-700 text-white border-purple-700 shadow-purple-600/20"
              >
                ⚖️{" "}
                {selectedAdjustment && adjustmentAmount > 0
                  ? "Edit Adjustment"
                  : "+ Adjustment"}
              </button>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {hasMetaAd && (
          <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer font-bold text-gray-700 !text-black bg-white hover:bg-gray-50 px-3.5 py-1.5 rounded-full border border-gray-300 shadow-sm transition-all">
            <input
              type="checkbox"
              checked={showMetaAd}
              onChange={(e) => setShowMetaAd(e.target.checked)}
              className="w-4 h-4 accent-red-600 rounded cursor-pointer"
            />
            Show Meta Ads Budget
          </label>
        )}

        {hasGoogleAd && (
          <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer font-bold text-gray-700 !text-black bg-white hover:bg-gray-50 px-3.5 py-1.5 rounded-full border border-gray-300 shadow-sm transition-all">
            <input
              type="checkbox"
              checked={showGoogleAd}
              onChange={(e) => setShowGoogleAd(e.target.checked)}
              className="w-4 h-4 accent-red-600 rounded cursor-pointer"
            />
            Show Google Ads Budget
          </label>
        )}
      </div>
    </div>
  );
}
