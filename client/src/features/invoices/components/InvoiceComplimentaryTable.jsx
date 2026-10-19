import React from "react";

export default function InvoiceComplimentaryTable({
  complimentaryData = [],
  formatAmount = (val) => Number(val || 0).toLocaleString("en-IN"),
}) {
  if (!complimentaryData || complimentaryData.length === 0) return null;

  return (
    <section className="text-sm mt-2">
      <table className="w-full border text-xs">
        <thead
          style={{
            background: "#E8EDFF",
            printColorAdjust: "exact",
            WebkitPrintColorAdjust: "exact",
          }}
        >
          <tr>
            <th className="border px-2 py-1 text-left w-[12rem] text-green-900 font-bold">
              Complimentary Service Name
            </th>
            <th className="border px-2 py-1 text-left w-[18rem] text-green-900 font-bold">
              Category Name
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

            let catName = svc.category_name && svc.category_name !== "null" && svc.category_name.toLowerCase() !== "proposal item"
              ? svc.category_name
              : "";
            const isGenericService = !svc.service_name || 
              svc.service_name.toLowerCase() === "complimentary" || 
              svc.service_name.toLowerCase() === "re_complimentary" ||
              svc.service_name.toLowerCase() === "proposal item";

            let serviceName = "";
            if (!isGenericService) {
              serviceName = svc.service_name;
            } else if (svc.service && svc.service.toLowerCase() !== "proposal item") {
              serviceName = svc.service;
            } else if (svc.editing_type_name && svc.editing_type_name !== "null" && svc.editing_type_name.toLowerCase() !== "proposal item") {
              serviceName = svc.editing_type_name;
            } else if (catName) {
              serviceName = catName;
              catName = "Complimentary";
            } else {
              serviceName = "Complimentary Service";
            }

            if (!catName || catName.trim().toLowerCase() === serviceName.trim().toLowerCase()) {
              catName = svc.service_type || "Complimentary Service";
            }

            if (
              svc.editing_type_name &&
              svc.editing_type_name !== "null" &&
              svc.editing_type_name !== "N/A" &&
              svc.editing_type_name !== "undefined" &&
              svc.editing_type_name.toLowerCase() !== "proposal item" &&
              svc.editing_type_name.trim().toLowerCase() !== catName.trim().toLowerCase() &&
              svc.editing_type_name.trim().toLowerCase() !== serviceName.trim().toLowerCase()
            ) {
              catName = `${catName} (${svc.editing_type_name})`;
            }

            const finalCategory = String(catName).replace(/\s*\((complimentary|complimntory)\)\s*$/i, "").trim();
            const finalService = String(serviceName).replace(/\s*\((complimentary|complimntory)\)\s*$/i, "").trim() || "-";

            let rowAddons = [];
            if (svc.additional_services) {
              try {
                rowAddons =
                  typeof svc.additional_services === "string"
                    ? JSON.parse(svc.additional_services)
                    : svc.additional_services;
                if (!Array.isArray(rowAddons)) rowAddons = [];
              } catch {
                rowAddons = [];
              }
            }

            return (
              <React.Fragment key={`comp-${idx}`}>
                <tr className="bg-white">
                  <td className="border px-2 py-1 font-medium">
                    {finalService}
                  </td>
                  <td className="border px-2 py-1">
                    {finalCategory}
                  </td>
                  <td className="border px-2 py-1 text-right">{qty}</td>
                  <td className="border px-2 py-1 text-right">
                    ₹{formatAmount(price)}
                  </td>
                  <td className="border px-2 py-1 text-right">
                    ₹{formatAmount(price * qty)}
                  </td>
                </tr>
                {rowAddons.map((addon, aIdx) => {
                  const addonAmt = Number(addon.amount || addon.unit_price || 0);
                  const addonQty = Number(addon.quantity) || qty;
                  const addonName = addon.name || addon.additional_service_name || "Additional Service";
                  return (
                    <tr
                      key={`comp-${idx}-addon-${aIdx}`}
                      className="bg-white text-gray-700"
                    >
                      <td className="border px-2 py-1 font-medium pl-4">
                        + {addonName}
                      </td>
                      <td className="border px-2 py-1 text-gray-500 italic">
                        Additional Service ({finalService})
                      </td>
                      <td className="border px-2 py-1 text-right">{addonQty}</td>
                      <td className="border px-2 py-1 text-right">
                        ₹{formatAmount(addonAmt)}
                      </td>
                      <td className="border px-2 py-1 text-right">
                        ₹{formatAmount(addonAmt * addonQty)}
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-white">
            <td colSpan={4} className="border px-2 py-1 text-right font-semibold">
              Total Complimentary Value
            </td>
            <td className="border px-2 py-1 text-right font-semibold">
              ₹
              {formatAmount(
                complimentaryData.reduce(
                  (sum, svc) => {
                    const basePrice =
                      Number(
                        svc.editing_type_amount || svc.price || svc.amount || 0
                      ) * Number(svc.quantity || 1);
                    let rowAddons = [];
                    if (svc.additional_services) {
                      try {
                        rowAddons =
                          typeof svc.additional_services === "string"
                            ? JSON.parse(svc.additional_services)
                            : svc.additional_services;
                        if (!Array.isArray(rowAddons)) rowAddons = [];
                      } catch {
                        rowAddons = [];
                      }
                    }
                    const addonsSum = rowAddons.reduce(
                      (s, a) =>
                        s +
                        (Number(a.amount || a.unit_price) || 0) *
                          (Number(a.quantity) || Number(svc.quantity || 1)),
                      0
                    );
                    return sum + basePrice + addonsSum;
                  },
                  0
                )
              )}
            </td>
          </tr>
          <tr className="bg-white font-bold">
            <td
              colSpan={4}
              className="border px-2 py-1 text-right text-green-900 font-bold"
            >
              Complimentary Total (Free)
            </td>
            <td className="border px-2 py-1 text-right text-green-900 font-bold">₹0</td>
          </tr>
        </tfoot>
      </table>
    </section>
  );
}
