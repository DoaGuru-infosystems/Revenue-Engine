import React from "react";
import { useNavigate } from "react-router-dom";

export default function InvoiceActionButtons({
  publicMode = false,
  handlePrintPage,
  handleDownload,
  basePath,
  onProposalHistory,
  onEdit,
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
          className="bg-red-600 text-white rounded-full px-4 py-2 hover:bg-red-700 transition-colors"
        >
          🖨️ Print
        </button>
      )}

      {onEdit && (
        <button
          onClick={onEdit}
          className="bg-orange-600 text-white rounded-full px-4 py-2 hover:bg-orange-700 transition-colors"
        >
          ✏️ Edit
        </button>
      )}

      {handleDownload && (
        <button
          onClick={handleDownload}
          className="bg-orange-600 text-white rounded-full px-4 py-2 hover:bg-orange-700 transition-colors"
        >
          ⬇️ Download
        </button>
      )}

      {onProposalHistory && (
        <button
          onClick={onProposalHistory}
          className="px-4 py-2 bg-yellow-600 text-white rounded-full hover:bg-yellow-700 transition-colors"
        >
          📝 Proposal History
        </button>
      )}

      {!publicMode && (
        <>
          <button
            onClick={() => navigate(`${basePath}/dashboard`)}
            className="bg-yellow-600 text-white rounded-full px-4 py-2 hover:bg-yellow-700 transition-colors"
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
            className="bg-gray-600 text-white rounded-full px-4 py-2 hover:bg-gray-700 transition-colors"
          >
            🔙 Back
          </button>
        </>
      )}
    </div>
  );
}
