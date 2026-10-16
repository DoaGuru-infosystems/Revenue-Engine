import React from "react";

export default function QuotationComplimentaryTable({
  complimentaryData = [],
}) {
  if (!complimentaryData || complimentaryData.length === 0) return null;

  return (
    <section className="mb-2 mt-4 text-sm">
      <table className="w-full border text-xs">
        <thead className="bg-orange-100">
          <tr>
            <th className="border w-[12rem] px-2 py-1 text-left">
              Complimentary Service Name
            </th>
            <th className="border w-[18rem] px-2 py-1 text-left">
              Category Name
            </th>
            <th className="border px-2 py-1 text-right">Quantity</th>
            <th className="border px-2 py-1 text-right">Price (₹)</th>
            <th className="border px-2 py-1 text-right">Total (₹)</th>
          </tr>
        </thead>

        <tbody>
          {/* ================= COMPLIMENTARY SERVICES ================= */}
          {complimentaryData.map((edit, eidx) => {
            const qty = Number(edit.quantity || 1);
            const base = Number(
              edit.editing_type_amount || edit.price || edit.amount || 0
            );
            const totalBase = base * qty;

            let catName =
              edit.category_name &&
              edit.category_name !== "null" &&
              edit.category_name.toLowerCase() !== "proposal item"
                ? edit.category_name
                : "";
            const isGenericService =
              !edit.service_name ||
              edit.service_name.toLowerCase() === "complimentary" ||
              edit.service_name.toLowerCase() === "re_complimentary" ||
              edit.service_name.toLowerCase() === "proposal item";

            let serviceName = "";
            if (!isGenericService) {
              serviceName = edit.service_name;
            } else if (
              edit.service &&
              edit.service.toLowerCase() !== "proposal item"
            ) {
              serviceName = edit.service;
            } else if (
              edit.editing_type_name &&
              edit.editing_type_name !== "null" &&
              edit.editing_type_name.toLowerCase() !== "proposal item"
            ) {
              serviceName = edit.editing_type_name;
            } else if (catName) {
              serviceName = catName;
              catName = "Complimentary";
            } else {
              serviceName = "Complimentary Service";
            }

            if (
              !catName ||
              catName.trim().toLowerCase() === serviceName.trim().toLowerCase()
            ) {
              catName = edit.service_type || "Complimentary Service";
            }

            if (
              edit.editing_type_name &&
              edit.editing_type_name !== "null" &&
              edit.editing_type_name !== "N/A" &&
              edit.editing_type_name !== "undefined" &&
              edit.editing_type_name.toLowerCase() !== "proposal item" &&
              edit.editing_type_name.trim().toLowerCase() !==
                catName.trim().toLowerCase() &&
              edit.editing_type_name.trim().toLowerCase() !==
                serviceName.trim().toLowerCase()
            ) {
              catName = `${catName} (${edit.editing_type_name})`;
            }

            const finalCategory = String(catName)
              .replace(/\s*\((complimentary|complimntory)\)\s*$/i, "")
              .trim();
            const finalService =
              String(serviceName)
                .replace(/\s*\((complimentary|complimntory)\)\s*$/i, "")
                .trim() || "-";

            let rowAddons = [];
            if (edit.additional_services) {
              try {
                rowAddons =
                  typeof edit.additional_services === "string"
                    ? JSON.parse(edit.additional_services)
                    : edit.additional_services;
                if (!Array.isArray(rowAddons)) rowAddons = [];
              } catch {
                rowAddons = [];
              }
            }

            return (
              <React.Fragment key={`compl-${eidx}`}>
                <tr className="bg-gray-50">
                  <td className="border px-2 py-1 font-medium">{finalService}</td>
                  <td className="border px-2 py-1">{finalCategory}</td>
                  <td className="border px-2 py-1 text-right">{qty}</td>
                  <td className="border px-2 py-1 text-right">₹{base.toLocaleString("en-IN")}</td>
                  <td className="border px-2 py-1 text-right">₹{totalBase.toLocaleString("en-IN")}</td>
                </tr>
                {rowAddons.map((addon, aIdx) => {
                  const addonAmt = Number(addon.amount || addon.unit_price || 0);
                  const addonQty = Number(addon.quantity) || qty;
                  const addonName = addon.name || addon.additional_service_name || "Additional Service";
                  return (
                    <tr key={`compl-${eidx}-addon-${aIdx}`} className="bg-orange-50/40 text-gray-700">
                      <td className="border px-2 py-1 font-medium pl-4">+ {addonName}</td>
                      <td className="border px-2 py-1 text-gray-500 italic">Additional Service ({finalService})</td>
                      <td className="border px-2 py-1 text-right">{addonQty}</td>
                      <td className="border px-2 py-1 text-right">₹{addonAmt.toLocaleString("en-IN")}</td>
                      <td className="border px-2 py-1 text-right">₹{(addonAmt * addonQty).toLocaleString("en-IN")}</td>
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })}

          {/* ✅ Thumbnail Creation Total */}
          {(() => {
            const thumbEdits = complimentaryData.filter(
              (item) => Number(item.include_thumbnail_creation) > 0
            );
            if (thumbEdits.length === 0) return null;

            const totalThumbQty = thumbEdits.reduce(
              (sum, item) => sum + Number(item.quantity),
              0
            );
            const pricePerThumb =
              Number(thumbEdits[0].include_thumbnail_creation) || 0;
            const totalThumbAmount = thumbEdits.reduce(
              (sum, item) =>
                sum +
                Number(item.include_thumbnail_creation) *
                  Number(item.quantity),
              0
            );

            return (
              <tr className="bg-gray-50">
                <td className="border px-2 py-1" colSpan={2}>
                  Thumbnail Creation Total
                </td>
                <td className="border px-2 py-1 text-right">{totalThumbQty}</td>
                <td className="border px-2 py-1 text-right">₹{pricePerThumb}</td>
                <td className="border px-2 py-1 text-right">
                  ₹{totalThumbAmount}
                </td>
              </tr>
            );
          })()}

          {/* ✅ Content Posting Total */}
          {(() => {
            const postEdits = complimentaryData.filter(
              (item) => Number(item.include_content_posting) > 0
            );
            if (postEdits.length === 0) return null;

            const totalPostQty = postEdits.reduce(
              (sum, item) => sum + Number(item.quantity),
              0
            );
            const pricePerPost =
              Number(postEdits[0].include_content_posting) || 0;
            const totalPostAmount = postEdits.reduce(
              (sum, item) =>
                sum +
                Number(item.include_content_posting) *
                  Number(item.quantity),
              0
            );

            return (
              <tr className="bg-gray-50">
                <td className="border px-2 py-1" colSpan={2}>
                  Meta Growth & Content Management Total
                </td>
                <td className="border px-2 py-1 text-right">{totalPostQty}</td>
                <td className="border px-2 py-1 text-right">₹{pricePerPost}</td>
                <td className="border px-2 py-1 text-right">
                  ₹{totalPostAmount}
                </td>
              </tr>
            );
          })()}

          {/* ✅ YouTube Video Posting Total */}
          {(() => {
            const ytEdits = complimentaryData.filter(
              (item) => Number(item.include_youtube_video_posting) > 0
            );
            if (ytEdits.length === 0) return null;

            const totalYtQty = ytEdits.reduce(
              (sum, item) => sum + Number(item.quantity),
              0
            );
            const pricePerYt =
              Number(ytEdits[0].include_youtube_video_posting) || 0;
            const totalYtAmount = ytEdits.reduce(
              (sum, item) =>
                sum +
                Number(item.include_youtube_video_posting) *
                  Number(item.quantity),
              0
            );

            return (
              <tr className="bg-gray-50">
                <td className="border px-2 py-1" colSpan={2}>
                  YouTube Channel Growth & Optimization Total
                </td>
                <td className="border px-2 py-1 text-right">{totalYtQty}</td>
                <td className="border px-2 py-1 text-right">₹{pricePerYt}</td>
                <td className="border px-2 py-1 text-right">
                  ₹{totalYtAmount}
                </td>
              </tr>
            );
          })()}

          {/* Table Total */}
          {(() => {
            const compTableTotal = complimentaryData.reduce((sum, item) => {
              const qty = Number(item.quantity || 1);
              const base = Number(
                item.editing_type_amount || item.price || item.amount || 0
              );
              let rowAddons = [];
              if (item.additional_services) {
                try {
                  rowAddons =
                    typeof item.additional_services === "string"
                      ? JSON.parse(item.additional_services)
                      : item.additional_services;
                  if (!Array.isArray(rowAddons)) rowAddons = [];
                } catch {
                  rowAddons = [];
                }
              }
              const addonsSum = rowAddons.reduce(
                (s, a) =>
                  s +
                  (Number(a.amount || a.unit_price) || 0) *
                    (Number(a.quantity) || qty),
                0
              );
              const thumb =
                (Number(item.include_thumbnail_creation) || 0) * qty;
              const post = (Number(item.include_content_posting) || 0) * qty;
              const yt =
                (Number(item.include_youtube_video_posting) || 0) * qty;
              return sum + base * qty + thumb + post + yt + addonsSum;
            }, 0);
            return (
              <tr className="font-semibold">
                <td className="border px-2 py-1 text-right" colSpan={4}>
                  Total
                </td>
                <td className="border px-2 py-1 text-right">
                  ₹{compTableTotal.toLocaleString("en-IN")}
                </td>
              </tr>
            );
          })()}

          {/* Complimentary Total: ₹0 */}
          <tr className="font-semibold">
            <td className="border px-2 py-1 text-right" colSpan={4}>
              Complimentary Total
            </td>
            <td className="border px-2 py-1 text-right">₹0</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
