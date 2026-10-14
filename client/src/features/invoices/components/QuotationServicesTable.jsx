import React from "react";

export default function QuotationServicesTable({
  graphicData = [],
  graphicTotal = 0,
}) {
  if (!graphicData || graphicData.length === 0) return null;

  return (
    <section className="mb-2 text-sm">
      <table className="w-full border text-xs">
        <thead className="bg-orange-100">
          <tr>
            <th className="border w-[10rem] px-2 py-1 text-left">Services</th>
            <th className="border w-[20rem] px-2 py-1 text-left">Categories</th>
            <th className="border px-2 py-1 text-right">Quantity</th>
            <th className="border px-2 py-1 text-right">Price (₹)</th>
            <th className="border px-2 py-1 text-right">Total (₹)</th>
          </tr>
        </thead>

        <tbody>
          {/* ================= GRAPHIC SERVICES (Grouped by Service) ================= */}
          {graphicData.map((service, idx) => {
            const visibleEditingTypes = service.editingTypes;
            if (visibleEditingTypes.length === 0) return null;

            const rawTitle =
              service.service &&
              service.service.toLowerCase() === "proposal item"
                ? visibleEditingTypes[0]?.category || service.service
                : service.service;
            const parentServiceTitle =
              rawTitle &&
              (rawTitle.toLowerCase() === "service charge" ||
                rawTitle.toLowerCase() === "ads service charge")
                ? "Ads Service Charge"
                : rawTitle;

            return (
              <React.Fragment key={`graphic-${idx}`}>
                {/* Category rows for this service */}
                {visibleEditingTypes.map((edit, eidx) => {
                  const qty = Number(edit.quantity) || 1;
                  const base = Number(edit.price || 0);
                  const addons = Array.isArray(edit.additional_services)
                    ? edit.additional_services
                    : [];
                  const addonsTotal = addons.reduce(
                    (sum, a) =>
                      sum +
                      (Number(a.amount || a.unit_price) || 0) *
                        (Number(a.quantity) || qty),
                    0
                  );
                  const baseTotal = base * qty;
                  const recordedTotal = Number(edit.total || 0);
                  // For the category row, total is strictly base price * qty (without addons)
                  const categoryRowTotal =
                    recordedTotal > 0 && recordedTotal >= baseTotal + addonsTotal
                      ? recordedTotal - addonsTotal > 0
                        ? recordedTotal - addonsTotal
                        : baseTotal
                      : baseTotal;

                  return (
                    <tr key={`graphic-${idx}-${eidx}`} className="bg-white">
                      {eidx === 0 && (
                        <td
                          className="border px-2 py-1 align-middle text-center"
                          rowSpan={visibleEditingTypes.length}
                        >
                          {parentServiceTitle}
                        </td>
                      )}

                      <td className="border px-2 py-1">
                        {(() => {
                          if (
                            service.service === "Service Charge" ||
                            service.service === "Ads Service Charge" ||
                            parentServiceTitle === "Ads Service Charge"
                          ) {
                            return edit.type &&
                              edit.type !== "N/A" &&
                              edit.type.toLowerCase().includes("management")
                              ? edit.type
                              : `${
                                  edit.category &&
                                  !edit.category
                                    .toLowerCase()
                                    .includes("campaign")
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
                        ₹{base.toLocaleString("en-IN")}
                      </td>
                      <td className="border px-2 py-1 text-right">
                        ₹{categoryRowTotal.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  );
                })}

                {/* Separate new rows for Additional Services */}
                {visibleEditingTypes.flatMap((edit, eidx) => {
                  const qty = Number(edit.quantity) || 1;
                  const addons = Array.isArray(edit.additional_services)
                    ? edit.additional_services
                    : [];
                  return addons.map((addon, aIdx) => {
                    const addonAmt =
                      Number(addon.amount || addon.unit_price) || 0;
                    const addonQty = Number(addon.quantity) || qty;
                    const addonTotal = addonAmt * addonQty;
                    const addonName =
                      addon.name ||
                      addon.additional_service_name ||
                      "Additional Service";
                    return (
                      <tr
                        key={`graphic-${idx}-${eidx}-addon-${aIdx}`}
                        className="bg-white"
                      >
                        <td className="border px-2 py-1" colSpan={2}>
                          {addonName} ({parentServiceTitle})
                        </td>
                        <td className="border px-2 py-1 text-right">
                          {addonQty}
                        </td>
                        <td className="border px-2 py-1 text-right">
                          ₹{addonAmt.toLocaleString("en-IN")}
                        </td>
                        <td className="border px-2 py-1 text-right">
                          ₹{addonTotal.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    );
                  });
                })}
              </React.Fragment>
            );
          })}

          {/* ================= THUMBNAIL CREATION TOTAL ================= */}
          {(() => {
            const thumbEdits = graphicData.flatMap((service) =>
              service.editingTypes.filter(
                (edit) => Number(edit.include_thumbnail_creation) > 0
              )
            );
            if (thumbEdits.length === 0) return null;

            const totalThumbQty = thumbEdits.reduce(
              (sum, edit) => sum + Number(edit.quantity),
              0
            );
            const pricePerThumb =
              thumbEdits[0]?.include_thumbnail_creation || 0;

            return (
              <tr className="bg-gray-50">
                <td className="border px-2 py-1" colSpan={2}>
                  Thumbnail Creation Total
                </td>
                <td className="border px-2 py-1 text-right">{totalThumbQty}</td>
                <td className="border px-2 py-1 text-right">₹{pricePerThumb}</td>
                <td className="border px-2 py-1 text-right">₹0</td>
              </tr>
            );
          })()}

          {/* ================= CONTENT POSTING TOTAL ================= */}
          {(() => {
            const postEdits = graphicData.flatMap((service) =>
              service.editingTypes.filter(
                (edit) => Number(edit.include_content_posting) > 0
              )
            );
            if (postEdits.length === 0) return null;

            const totalPostQty = postEdits.reduce(
              (sum, edit) => sum + Number(edit.quantity),
              0
            );
            const pricePerPost = postEdits[0]?.include_content_posting || 0;

            return (
              <tr className="bg-gray-50">
                <td className="border px-2 py-1" colSpan={2}>
                  Meta Growth & Content Management Total
                </td>
                <td className="border px-2 py-1 text-right">{totalPostQty}</td>
                <td className="border px-2 py-1 text-right">₹{pricePerPost}</td>
                <td className="border px-2 py-1 text-right">₹0</td>
              </tr>
            );
          })()}

          {/* ================= YOUTUBE VIDEO POSTING TOTAL ================= */}
          {(() => {
            const ytEdits = graphicData.flatMap((service) =>
              service.editingTypes.filter(
                (edit) => Number(edit.include_youtube_video_posting) > 0
              )
            );
            if (ytEdits.length === 0) return null;

            const totalYtQty = ytEdits.reduce(
              (sum, edit) => sum + Number(edit.quantity),
              0
            );
            const pricePerYt =
              ytEdits[0]?.include_youtube_video_posting || 0;

            return (
              <tr className="bg-gray-50">
                <td className="border px-2 py-1" colSpan={2}>
                  YouTube Channel Growth & Optimization Total
                </td>
                <td className="border px-2 py-1 text-right">{totalYtQty}</td>
                <td className="border px-2 py-1 text-right">₹{pricePerYt}</td>
                <td className="border px-2 py-1 text-right">₹0</td>
              </tr>
            );
          })()}

          {/* ================= DM SERVICE TOTAL ================= */}
          {(() => {
            const thumbTotal = graphicData
              .flatMap((s) =>
                s.editingTypes.filter(
                  (e) => Number(e.include_thumbnail_creation) > 0
                )
              )
              .reduce(
                (sum, e) =>
                  sum +
                  Number(e.include_thumbnail_creation) * Number(e.quantity),
                0
              );
            const postTotal = graphicData
              .flatMap((s) =>
                s.editingTypes.filter(
                  (e) => Number(e.include_content_posting) > 0
                )
              )
              .reduce(
                (sum, e) =>
                  sum + Number(e.include_content_posting) * Number(e.quantity),
                0
              );

            const ytTotal = graphicData
              .flatMap((s) =>
                s.editingTypes.filter(
                  (e) => Number(e.include_youtube_video_posting) > 0
                )
              )
              .reduce(
                (sum, e) =>
                  sum +
                  Number(e.include_youtube_video_posting) * Number(e.quantity),
                0
              );

            const dmServiceTotal =
              graphicTotal + thumbTotal + postTotal + ytTotal;

            return (
              <tr className="font-semibold">
                <td className="border px-2 py-1 text-right" colSpan={4}>
                  Services Total
                </td>
                <td className="border px-2 py-1 text-right">
                  ₹{dmServiceTotal.toLocaleString("en-IN")}
                </td>
              </tr>
            );
          })()}
        </tbody>
      </table>
    </section>
  );
}
