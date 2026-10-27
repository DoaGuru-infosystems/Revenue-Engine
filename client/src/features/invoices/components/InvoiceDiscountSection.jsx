import React from "react";

export default function InvoiceDiscountSection({
  graphicData = [],
  additionalServiceData = [],
  adsData = [],
  complimentaryData = [],
  servicesTotal = null,
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

  const effectiveServicesTotal =
    servicesTotal !== null && servicesTotal !== undefined
      ? Number(servicesTotal)
      : graphicData.reduce(
          (sum, service) =>
            sum +
            service.editingTypes.reduce((editSum, edit) => {
              const qty = Number(edit.quantity) || 1;
              const base = Number(
                edit.price ||
                edit.editing_type_amount ||
                edit.unit_price ||
                edit.amount ||
                0
              );
              const baseTotal = base * qty;
              const addons = Array.isArray(edit.additional_services) ? edit.additional_services : [];
              const addonsTotal = addons.reduce(
                (s, a) =>
                  s +
                  (Number(a.amount || a.unit_price) || 0) *
                    (Number(a.quantity) || qty),
                0
              );
              const recordedTotal = Number(edit.total || 0);
              const effectiveTotal =
                recordedTotal >= baseTotal + addonsTotal && recordedTotal > 0
                  ? recordedTotal
                  : (recordedTotal > 0 ? recordedTotal : baseTotal) + addonsTotal;
              return editSum + effectiveTotal;
            }, 0),
          0
        ) +
        additionalServiceData.reduce((sum, service) => {
          const amount =
            service.total_amount !== null && service.total_amount !== undefined
              ? Number(service.total_amount)
              : Number(service.editing_type_amount || service.price || 0) *
                Number(service.quantity || 1);
          return sum + amount;
        }, 0);

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
              <tr
                style={{
                  background: "white",
                  fontWeight: 600,
                }}
                className="text-gray-900"
              >
                <td className="border px-2 print:px-1.5 py-1 print:py-0.5 text-right font-medium" colSpan={4}>
                  Services Total
                </td>
                <td className="border px-2 print:px-1.5 py-1 print:py-0.5 text-right font-medium w-[15%]">
                  ₹{formatAmountNoDecimals(effectiveServicesTotal)}
                </td>
              </tr>
              {selecteddiscount && discountAmount > 0 && (
                <tr
                  style={{
                    color: "#dc2626",
                    background: "white",
                    fontWeight: 700,
                  }}
                >
                  <td className="border px-2 print:px-1.5 py-1 print:py-0.5 text-right" colSpan={4}>
                    Discount {selecteddiscount?.discount_type === "percent" || selecteddiscount?.type === "Percentage" ? `(${selecteddiscount.discount_per || selecteddiscount.value}%)` : selecteddiscount?.discount_amt ? `(₹${formatAmountNoDecimals(selecteddiscount.discount_amt || selecteddiscount.value)})` : ""}
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
                    background: "white",
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
              <tr
                style={{
                  background: "#E8EDFF",
                  printColorAdjust: "exact",
                  WebkitPrintColorAdjust: "exact",
                }}
                className="font-bold text-gray-900"
              >
                <td className="border px-2 print:px-1.5 py-1 print:py-0.5 text-right font-bold" colSpan={4}>
                  {prevBal > 0 ? "Current Services Subtotal" : "Subtotal"}
                </td>
                <td className="border px-2 print:px-1.5 py-1 print:py-0.5 text-right font-bold w-[15%]">
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
