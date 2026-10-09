import React from "react";

export default function InvoiceDiscountSection({
  graphicData = [],
  additionalServiceData = [],
  adsData = [],
  complimentaryData = [],
  selecteddiscount = null,
  discountAmount = 0,
  invoiceSubtotal = 0,
  clientData = {},
  publicMode = false,
  isProforma = false,
  handleShowDiscount,
  formatAmountNoDecimals = (val) => Number(val || 0).toLocaleString("en-IN"),
}) {
  const hasAnyServices =
    graphicData.length > 0 ||
    additionalServiceData.length > 0 ||
    adsData.length > 0 ||
    complimentaryData.length > 0;

  return (
    <>
      {hasAnyServices && (
        <section className="mb-2 text-sm mt-2">
          <table className="w-full border text-xs">
            <tbody>
              {selecteddiscount && discountAmount > 0 && (
                <tr
                  style={{
                    color: "#dc2626",
                    background: "#fef2f2",
                    fontWeight: 700,
                  }}
                >
                  <td className="border px-2 py-1 text-right" colSpan={4}>
                    Discount
                  </td>
                  <td className="border px-2 py-1 text-right w-[15%]">
                    -₹{formatAmountNoDecimals(discountAmount)}
                  </td>
                </tr>
              )}
              <tr className="bg-orange-50 font-semibold">
                <td className="border px-2 py-1 text-right" colSpan={4}>
                  Subtotal
                </td>
                <td className="border px-2 py-1 text-right w-[15%]">
                  ₹{formatAmountNoDecimals(invoiceSubtotal)}
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
            <button
              onClick={handleShowDiscount}
              className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-semibold shadow-sm flex items-center gap-1 transition-colors"
              title="Add/Edit Discount"
            >
              {selecteddiscount ? "Edit Discount" : "+ Discount"}
            </button>
          </div>
        )}
    </>
  );
}
