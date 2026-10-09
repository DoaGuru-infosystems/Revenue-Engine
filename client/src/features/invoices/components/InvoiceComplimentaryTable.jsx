import React from "react";

export default function InvoiceComplimentaryTable({
  complimentaryData = [],
  formatAmount = (val) => Number(val || 0).toLocaleString("en-IN"),
}) {
  if (!complimentaryData || complimentaryData.length === 0) return null;

  return (
    <section className="text-sm mt-2">
      <table className="w-full border text-xs">
        <thead className="bg-green-100">
          <tr>
            <th className="border px-2 py-1 text-left w-[10rem] text-green-900 font-bold">
              Complimentary Service
            </th>
            <th className="border px-2 py-1 text-left w-[20rem] text-green-900 font-bold">
              Service Name
            </th>
            <th className="border px-2 py-1 text-right text-green-900 font-bold">
              Qty
            </th>
            <th className="border px-2 py-1 text-right text-green-900 font-bold">
              Price (₹)
            </th>
            <th className="border px-2 py-1 text-right text-green-900 font-bold">
              Total (₹)
            </th>
          </tr>
        </thead>
        <tbody>
          {complimentaryData.map((svc, idx) => {
            const qty = Number(svc.quantity || 1);
            const price = Number(
              svc.editing_type_amount || svc.price || svc.amount || 0
            );
            return (
              <tr key={`comp-${idx}`} className="bg-white">
                <td className="border px-2 py-1 font-medium">
                  {String(
                    svc.service_name &&
                      svc.service_name.toLowerCase() === "proposal item"
                      ? svc.category_name || svc.service_name
                      : svc.service_name || svc.category_name || "N/A"
                  )
                    .replace(/\s*\((complimentary|complimntory)\)\s*$/i, "")
                    .trim()}
                </td>
                <td className="border px-2 py-1">
                  {String(
                    svc.editing_type_name &&
                      svc.editing_type_name.toLowerCase() === "proposal item"
                      ? svc.service ||
                          svc.category_name ||
                          svc.editing_type_name
                      : svc.editing_type_name &&
                        svc.editing_type_name !== "null"
                      ? svc.editing_type_name
                      : "-"
                  )
                    .replace(/\s*\((complimentary|complimntory)\)\s*$/i, "")
                    .trim()}
                </td>
                <td className="border px-2 py-1 text-right">{qty}</td>
                <td className="border px-2 py-1 text-right">
                  ₹{formatAmount(price)}
                </td>
                <td className="border px-2 py-1 text-right">
                  ₹{formatAmount(price * qty)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-green-50">
            <td colSpan={4} className="border px-2 py-1 text-right font-semibold">
              Total
            </td>
            <td className="border px-2 py-1 text-right font-semibold">
              ₹
              {formatAmount(
                complimentaryData.reduce(
                  (sum, svc) =>
                    sum +
                    Number(
                      svc.editing_type_amount || svc.price || svc.amount || 0
                    ) *
                      Number(svc.quantity || 1),
                  0
                )
              )}
            </td>
          </tr>
          <tr className="bg-green-100 font-bold">
            <td
              colSpan={4}
              className="border px-2 py-1 text-right text-green-900"
            >
              Complimentary Total (Free)
            </td>
            <td className="border px-2 py-1 text-right text-green-900">₹0</td>
          </tr>
        </tfoot>
      </table>
    </section>
  );
}
