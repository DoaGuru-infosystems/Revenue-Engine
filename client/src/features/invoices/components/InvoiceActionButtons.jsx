import React from "react";
import { useNavigate } from "react-router-dom";

export default function InvoiceActionButtons({
  publicMode = false,
  handlePrintPage,
  handleDownload,
  basePath,
  onProposalHistory,
  onEdit,
  onDiscount,
}) {
  const navigate = useNavigate();

  return (
    <div
      data-html2canvas-ignore="true"
      className="print:hidden flex justify-end gap-3 my-4"
    >
      {!publicMode && handlePrintPage && (
        <button
          onClick={handlePrintPage}
          target="_blank"
          style={{ color: "#ffffff" }}
          className="bg-red-600 !text-white rounded-full px-4 py-2 hover:bg-red-700 transition-colors font-medium shadow-sm"
        >
          🖨️ Print
        </button>
      )}

      {onDiscount && (
        <button
          onClick={onDiscount}
          style={{ color: "#ffffff" }}
          className="bg-amber-600 !text-white rounded-full px-4 py-2 hover:bg-amber-700 transition-colors font-medium shadow-sm"
        >
          🏷️ Apply Discount
        </button>
      )}

      {onEdit && (
        <button
          onClick={onEdit}
          style={{ color: "#ffffff" }}
          className="bg-orange-600 !text-white rounded-full px-4 py-2 hover:bg-orange-700 transition-colors font-medium shadow-sm"
        >
          ✏️ Edit
        </button>
      )}

      {handleDownload && (
        <button
          onClick={handleDownload}
          style={{ color: "#ffffff" }}
          className="bg-orange-600 !text-white rounded-full px-4 py-2 hover:bg-orange-700 transition-colors font-medium shadow-sm"
        >
          ⬇️ Download
        </button>
      )}

      {onProposalHistory && (
        <button
          onClick={onProposalHistory}
          style={{ color: "#ffffff" }}
          className="px-4 py-2 bg-yellow-600 !text-white rounded-full hover:bg-yellow-700 transition-colors font-medium shadow-sm"
        >
          📝 Proposal History
        </button>
      )}

      {!publicMode && (
        <>
          <button
            onClick={() => navigate(`${basePath}/dashboard`)}
            style={{ color: "#ffffff" }}
            className="bg-yellow-600 !text-white rounded-full px-4 py-2 hover:bg-yellow-700 transition-colors font-medium shadow-sm"
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => {
              if (window.history.length > 1 && window.history.state && window.history.state.idx > 0) {
                navigate(-1);
              } else {
                window.close();
                setTimeout(() => navigate(`${basePath}/dashboard`), 300);
              }
            }}
            style={{ backgroundColor: "#374151", color: "#ffffff" }}
            className="!bg-gray-700 !text-white rounded-full px-4 py-2 hover:!bg-gray-800 transition-colors font-medium shadow-sm"
          >
            🔙 Back
          </button>
        </>
      )}
    </div>
  );
}
