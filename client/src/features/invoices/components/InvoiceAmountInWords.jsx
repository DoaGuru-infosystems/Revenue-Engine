import React from "react";

export default function InvoiceAmountInWords({ amountInWords = "" }) {
  if (!amountInWords) return null;

  return (
    <div className="flex justify-end mt-1 px-1 mb-2 amount-in-words-section">
      <div className="text-right">
        <span className="text-[10px] text-gray-500 italic block leading-tight">
          Total Amount (in words):
        </span>
        <span
          style={{
            color: "#1d4ed8",
            fontStyle: "italic",
            fontWeight: 700,
            fontSize: "12px",
            textAlign: "right",
          }}
          className="capitalize leading-tight"
        >
          {amountInWords}{" "}
        </span>
      </div>
    </div>
  );
}
