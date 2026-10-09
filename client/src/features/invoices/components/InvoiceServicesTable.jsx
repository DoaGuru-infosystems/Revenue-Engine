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
    <section className="mb-2 text-sm">
      <table className="w-full border text-xs">
        <thead
          style={{
            background: "#e8edff",
            color: "#111827",
            fontSize: "11px",
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

            return visibleEditingTypes.map((edit, eidx) => {
              const qty = Number(edit.quantity || 1);
              const base = Number(edit.price || 0);
              const totalBase = base * qty;

              return (
                <tr
                  key={`graphic-${idx}-${eidx}`}
                  className="bg-white"
                >
                  {/* Show Services name only once using rowspan */}
                  {eidx === 0 ? (
                    <td
                      className="border px-2 py-1 align-center"
                      rowSpan={visibleEditingTypes.length}
                    >
                      {service.service &&
                      service.service.toLowerCase() === "proposal item"
                        ? edit.category || service.service
                        : service.service}
                    </td>
                  ) : null}

                  <td className="border px-2 py-1">
                    {(() => {
                      if (service.service === "Service Charge") {
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
                    ₹{formatAmountNoDecimals(base)}
                  </td>
                  <td className="border px-2 py-1 text-right">
                    ₹{formatAmountNoDecimals(totalBase)}
                  </td>
                </tr>
              );
            });
          })}
        </tbody>
        <tfoot
          style={{
            background: "#f5f8fc",
            fontWeight: 800,
            border: "1px solid #cfd8e3",
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
