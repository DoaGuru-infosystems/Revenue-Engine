import React from "react";

export default function InvoiceServicesTable({
  graphicData = [],
  complimentaryData = [],
  additionalServiceData = [],
  adsData = [],
  dmServiceTotal = 0,
  formatAmountNoDecimals = (val) => Number(val || 0).toLocaleString("en-IN"),
}) {
  if (
    graphicData.length === 0 &&
    complimentaryData.length === 0 &&
    additionalServiceData.length === 0 &&
    adsData.length === 0
  ) {
    return null;
  }

  return (
    <section className="mb-2 text-sm text-gray-900">
      <table className="w-full border text-xs text-gray-900">
        <thead
          style={{
            background: "#E8EDFF",
            color: "#111827",
            fontSize: "11px",
            printColorAdjust: "exact",
            WebkitPrintColorAdjust: "exact",
          }}
        >
          <tr>
            <th
              style={{
                border: "1px solid #cfd8e3",
                padding: "6px 7px",
                textAlign: "left",
              }}
              className="w-[10rem]"
            >
              Services
            </th>
            <th
              style={{
                border: "1px solid #cfd8e3",
                padding: "6px 7px",
                textAlign: "left",
              }}
              className="w-[20rem]"
            >
              Categories
            </th>
            <th
              style={{
                border: "1px solid #cfd8e3",
                padding: "6px 7px",
                textAlign: "right",
              }}
            >
              Quantity
            </th>
            <th
              style={{
                border: "1px solid #cfd8e3",
                padding: "6px 7px",
                textAlign: "right",
              }}
            >
              Price (₹)
            </th>
            <th
              style={{
                border: "1px solid #cfd8e3",
                padding: "6px 7px",
                textAlign: "right",
              }}
            >
              Total (₹)
            </th>
          </tr>
        </thead>

        <tbody>
          {/* ================= GRAPHIC SERVICES (Grouped by Service) ================= */}
          {graphicData.map((service, idx) => {
            const visibleEditingTypes = service.editingTypes;
            if (visibleEditingTypes.length === 0) return null;

            const rawTitle = service.service && service.service.toLowerCase() === "proposal item"
              ? (visibleEditingTypes[0]?.category || service.service)
              : service.service;
            const parentServiceTitle = (rawTitle && (rawTitle.toLowerCase() === "service charge" || rawTitle.toLowerCase() === "ads service charge"))
              ? "Ads Service Charge"
              : rawTitle;

            return (
              <React.Fragment key={`graphic-${idx}`}>
                {/* Category rows for this service */}
                {visibleEditingTypes.map((edit, eidx) => {
                  const qty = Number(edit.quantity || 1);
                  const rawBase = Number(
                    edit.price ||
                    edit.editing_type_amount ||
                    edit.unit_price ||
                    edit.amount ||
                    0
                  );
                  const addons = Array.isArray(edit.additional_services) ? edit.additional_services : [];
                  const addonsTotal = addons.reduce((sum, a) => sum + ((Number(a.amount || a.unit_price) || 0) * (Number(a.quantity) || qty)), 0);
                  const baseTotal = rawBase * qty;
                  const recordedTotal = Number(edit.total || 0);
                  // For the category row, total is strictly base price * qty (without addons)
                  const categoryRowTotal = (recordedTotal > 0 && recordedTotal >= baseTotal + addonsTotal)
                    ? (recordedTotal - addonsTotal > 0 ? recordedTotal - addonsTotal : baseTotal)
                    : (baseTotal > 0 ? baseTotal : (recordedTotal > 0 ? Math.max(0, recordedTotal - addonsTotal) : 0));

                  const effectiveBase = rawBase > 0
                    ? rawBase
                    : (qty > 0 && categoryRowTotal > 0 ? categoryRowTotal / qty : 0);

                  return (
                    <tr key={`graphic-${idx}-${eidx}`} className="bg-white text-gray-900">
                      {eidx === 0 && (
                        <td
                          className="border px-2 py-1 align-middle text-left"
                          rowSpan={visibleEditingTypes.length}
                        >
                          {parentServiceTitle}
                        </td>
                      )}

                      <td className="border px-2 py-1">
                        {(() => {
                          if (service.service === "Service Charge" || service.service === "Ads Service Charge" || parentServiceTitle === "Ads Service Charge") {
                            return edit.type &&
                              edit.type !== "N/A" &&
                              edit.type.toLowerCase().includes("management")
                              ? edit.type
                              : `${
                                  edit.category &&
                                  !edit.category.toLowerCase().includes("campaign")
                                    ? edit.category + " Campaign"
                                    : edit.category || ""
                                } ${
                                  edit.type || "Management & Optimization"
                                }`.trim();
                          }

                          const cat =
                            edit.category && edit.category !== "N/A"
                              ? edit.category
                              : "";
                          const type =
                            edit.type &&
                            edit.type !== "N/A" &&
                            edit.type !== "null" &&
                            edit.type !== "undefined" &&
                            edit.type.trim() !== "" &&
                            edit.type.toLowerCase() !== "proposal item"
                              ? edit.type.trim()
                              : "";

                          if (
                            cat &&
                            type &&
                            cat.trim().toLowerCase() !== type.toLowerCase() &&
                            type.toLowerCase() !==
                              (service.service || "").trim().toLowerCase()
                          ) {
                            return `${cat} (${type})`;
                          }
                          return cat || type || service.service;
                        })()}
                      </td>
                      <td className="border px-2 py-1 text-right">{qty}</td>
                      <td className="border px-2 py-1 text-right">
                        ₹{formatAmountNoDecimals(effectiveBase)}
                      </td>
                      <td className="border px-2 py-1 text-right">
                        ₹{formatAmountNoDecimals(categoryRowTotal)}
                      </td>
                    </tr>
                  );
                })}

                {/* Separate new rows for Additional Services */}
                {visibleEditingTypes.flatMap((edit, eidx) => {
                  const qty = Number(edit.quantity || 1);
                  const addons = Array.isArray(edit.additional_services) ? edit.additional_services : [];
                  return addons.map((addon, aIdx) => {
                    const addonAmt = Number(addon.amount || addon.unit_price || 0);
                    const addonQty = Number(addon.quantity) || qty;
                    const addonTotal = addonAmt * addonQty;
                    const addonName = addon.name || addon.additional_service_name || "Additional Service";
                    return (
                      <tr
                        key={`graphic-${idx}-${eidx}-addon-${aIdx}`}
                        className="bg-white"
                      >
                        <td className="border px-2 py-1" colSpan={2}>
                          {addonName} ({parentServiceTitle})
                        </td>
                        <td className="border px-2 py-1 text-right">{addonQty}</td>
                        <td className="border px-2 py-1 text-right">
                          ₹{formatAmountNoDecimals(addonAmt)}
                        </td>
                        <td className="border px-2 py-1 text-right">
                          ₹{formatAmountNoDecimals(addonTotal)}
                        </td>
                      </tr>
                    );
                  });
                })}
              </React.Fragment>
            );
          })}
        </tbody>
        <tfoot
          style={{
            background: "#E8EDFF",
            fontWeight: 800,
            border: "1px solid #cfd8e3",
            printColorAdjust: "exact",
            WebkitPrintColorAdjust: "exact",
          }}
        >
          <tr>
            <td className="border px-2 py-1 text-right font-bold" colSpan={4}>
              Services Total
            </td>
            <td className="border px-2 py-1 text-right font-bold w-[15%]">
              ₹{formatAmountNoDecimals(dmServiceTotal)}
            </td>
          </tr>
        </tfoot>
      </table>
    </section>
  );
}
