import React from "react";
import { inrToWords } from "../../../utils/inrToWords";

export default function QuotationSummaryRightSide({
  graphicTotal = 0,
  selecteddiscount = null,
  discountAmount = 0,
  displayedTaxable = 0,
  isGST = false,
  displayedCgst = 0,
  displayedSgst = 0,
  displayedSubtotal = 0,
  adsData = [],
  showMetaAd = true,
  showGoogleAd = true,
  displayedGrandTotal = 0,
  isBalanceProforma = false,
  displayedReceived = 0,
  displayedCurrentBalance = 0,
}) {
  return (
    <div className="w-1/2 pl-5 border-l border-gray-200">
      <div className="space-y-1 text-xs text-gray-700">
        {discountAmount > 0 && (
          <>
            <div className="flex justify-between items-center text-gray-600 py-0.5">
              <span>Subtotal</span>
              <span className="font-semibold text-gray-900">
                ₹{graphicTotal.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between items-center text-red-600 font-semibold py-0.5">
              <span>
                Discount (
                {selecteddiscount?.discount_type === "percent"
                  ? `${selecteddiscount?.discount_per}%`
                  : `₹${selecteddiscount?.discount_amt}`}
                )
              </span>
              <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
            </div>
          </>
        )}

        <div className="flex justify-between items-center text-gray-600 py-0.5">
          <span>Taxable Amount</span>
          <span className="font-semibold text-gray-900">
            ₹
            {displayedTaxable.toLocaleString("en-IN", {
              minimumFractionDigits: displayedTaxable % 1 !== 0 ? 2 : 0,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>

        {isGST && (
          <>
            <div className="flex justify-between items-center text-gray-600 py-0.5">
              <span>CGST @9%</span>
              <span className="font-semibold text-gray-900">
                ₹
                {displayedCgst.toLocaleString("en-IN", {
                  minimumFractionDigits: displayedCgst % 1 !== 0 ? 2 : 0,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between items-center text-gray-600 py-0.5">
              <span>SGST @9%</span>
              <span className="font-semibold text-gray-900">
                ₹
                {displayedSgst.toLocaleString("en-IN", {
                  minimumFractionDigits: displayedSgst % 1 !== 0 ? 2 : 0,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </>
        )}

        <div className="flex justify-between items-center font-bold text-gray-800 py-1 border-t border-gray-200">
          <span>Subtotal</span>
          <span>₹{Math.round(displayedSubtotal).toLocaleString("en-IN")}</span>
        </div>

        {adsData &&
          adsData.length > 0 &&
          adsData.map((ad, idx) => {
            const amount = Number(ad.amount || ad.budget || 0);
            const cat = (ad.category_name || "").toLowerCase();
            if (cat.includes("meta") && !showMetaAd) return null;
            if (cat.includes("google") && !showGoogleAd) return null;
            let adsCategoryName = ad.category_name || ad.service_name || "Ads";
            adsCategoryName = adsCategoryName.replace(/\badd\b/gi, "Ad");
            return (
              <div
                key={idx}
                className="flex justify-between items-center text-gray-600 py-0.5"
              >
                <span>{adsCategoryName} Budget</span>
                <span className="font-semibold text-gray-900">
                  ₹{amount.toLocaleString("en-IN")}
                </span>
              </div>
            );
          })}

        <div className="flex justify-between items-center py-1 px-2.5 bg-gray-50/80 rounded border border-gray-200 mt-1">
          <span className="text-sm font-bold text-gray-900">Grand Total</span>
          <span className="text-base font-bold text-green-700">
            ₹{Math.round(displayedGrandTotal).toLocaleString("en-IN")}
          </span>
        </div>

        {isBalanceProforma && (
          <div className="pt-2 border-t border-gray-300 space-y-1">
            <div className="flex justify-between items-center px-2 py-0.5 text-gray-700">
              <span className="font-medium text-xs">Received</span>
              <span className="font-semibold text-gray-900 text-xs">
                ₹{Math.round(displayedReceived).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between items-center px-2.5 py-1 bg-green-50/70 rounded border border-green-200">
              <span className="text-xs font-bold text-green-900">
                Current Balance
              </span>
              {displayedCurrentBalance <= 0 ? (
                <span className="bg-green-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                  Fully Paid
                </span>
              ) : (
                <span className="text-sm font-bold text-green-700">
                  ₹{Math.round(displayedCurrentBalance).toLocaleString("en-IN")}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="mt-2 pt-2 border-t border-gray-200 text-right">
          <p className="text-[10px] text-gray-500 italic block leading-tight">
            Total Amount (in words):
          </p>
          <p className="font-semibold text-gray-800 text-xs capitalize leading-tight">
            {inrToWords(displayedGrandTotal)}
          </p>
        </div>
      </div>
    </div>
  );
}
