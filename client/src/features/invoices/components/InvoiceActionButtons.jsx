import React from "react";
import { useNavigate } from "react-router-dom";

export default function InvoiceActionButtons({
  publicMode = false,
  handlePrintPage,
  handleDownload,
  basePath,
}) {
  const navigate = useNavigate();

  return (
    <div
      data-html2canvas-ignore="true"
      className="print:hidden flex justify-end gap-3 my-4"
    >
      {!publicMode && (
        <button
          onClick={handlePrintPage}
          target="_blank"
          className="bg-red-600 text-white rounded-full px-4 py-2"
        >
          Print
        </button>
      )}

      <button
        onClick={handleDownload}
        className="bg-orange-600 text-white rounded-full px-4 py-2"
      >
        Download
      </button>

      {!publicMode && (
        <>
          <button
            onClick={() => navigate(`${basePath}/dashboard`)}
            className="bg-yellow-600 text-white rounded-full px-4 py-2"
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-600 text-white rounded-full px-4 py-2"
          >
            Back
          </button>
        </>
      )}
    </div>
  );
}
