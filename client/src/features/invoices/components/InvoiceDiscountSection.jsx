import React from "react";

export default function InvoiceDiscountSection({
  graphicData = [],
  additionalServiceData = [],
  adsData = [],
  complimentaryData = [],
  selecteddiscount = null,
  discountAmount = 0,
  selectedAdjustment = null,
  adjustmentAmount = 0,
  totalAfterAdjustment = null,
  invoiceSubtotal = 0,
  previousBalanceAmount = 0,
  clientData = {},
  publicMode = false,
  isProforma = false,
  handleShowDiscount,
  handleShowAdjustment,
  formatAmountNoDecimals = (val) => Number(val || 0).toLocaleString("en-IN"),
}) {
  const hasAnyServices =
    graphicData.length > 0 ||
    additionalServiceData.length > 0 ||
    adsData.length > 0 ||
    complimentaryData.length > 0;

  const baseServicesSubtotal =
    totalAfterAdjustment !== null && totalAfterAdjustment !== undefined
      ? totalAfterAdjustment
      : invoiceSubtotal;

  const prevBal = Number(previousBalanceAmount || 0);

  return (
    <>
      {hasAnyServices && (
        <section className="mb-2 print:mb-1 text-sm mt-2 print:mt-0.5">
          <table className="w-full border text-xs print:text-[11px]">
            <tbody>
              {selecteddiscount && discountAmount > 0 && (
                <tr
                  style={{
                    color: "#dc2626",
                    background: "#fef2f2",
                    fontWeight: 700,
                  }}
                >
                  <td className="border px-2 print:px-1.5 py-1 print:py-0.5 text-right" colSpan={4}>
                    Discount
                  </td>
                  <td className="border px-2 print:px-1.5 py-1 print:py-0.5 text-right w-[15%]">
                    -₹{formatAmountNoDecimals(discountAmount)}
                  </td>
                </tr>
              )}
              {adjustmentAmount > 0 && (
                <tr
                  style={{
                    color: "#7e22ce",
                    background: "#faf5ff",
                    fontWeight: 700,
                  }}
                >
                  <td className="border px-2 print:px-1.5 py-1 print:py-0.5 text-right" colSpan={4}>
                    Adjustment
                  </td>
                  <td className="border px-2 print:px-1.5 py-1 print:py-0.5 text-right w-[15%]">
                    -₹{formatAmountNoDecimals(adjustmentAmount)}
                  </td>
                </tr>
              )}
              <tr className="bg-orange-50 font-semibold">
                <td className="border px-2 print:px-1.5 py-1 print:py-0.5 text-right" colSpan={4}>
                  {prevBal > 0 ? "Current Services Subtotal" : "Subtotal"}
                </td>
                <td className="border px-2 print:px-1.5 py-1 print:py-0.5 text-right w-[15%]">
                  ₹{formatAmountNoDecimals(baseServicesSubtotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      {clientData?.tag_received_amt !== "received" &&
        !publicMode &&
        isProforma && (
          <div className="print:hidden my-2 flex items-center gap-2">
            {handleShowDiscount && (
              <button
                onClick={handleShowDiscount}
                className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-semibold shadow-sm flex items-center gap-1 transition-colors"
                title="Add/Edit Discount"
              >
                {selecteddiscount ? "Edit Discount" : "+ Discount"}
              </button>
            )}
            {handleShowAdjustment && (
              <button
                onClick={handleShowAdjustment}
                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold shadow-sm flex items-center gap-1 transition-colors"
                title="Add/Edit Adjustment"
              >
                {selectedAdjustment && adjustmentAmount > 0 ? "Edit Adjustment" : "+ Adjustment"}
              </button>
            )}
          </div>
        )}
    </>
  );
}
