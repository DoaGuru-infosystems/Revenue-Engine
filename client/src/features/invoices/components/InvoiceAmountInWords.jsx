import React from "react";

export default function InvoiceAmountInWords({
  amountInWords = "",
  isBalanceProforma = false,
  label = null,
}) {
  if (!amountInWords) return null;

  const displayLabel =
    label || (isBalanceProforma ? "Current Balance (in words):" : "Total Amount (in words):");

  return (
    <div className="flex justify-end mt-1 print:mt-0.5 px-1 mb-2 print:mb-0.5 amount-in-words-section">
      <div className="text-right">
        <span className="text-[10px] print:text-[9px] text-gray-500 italic block leading-tight">
          {displayLabel}
        </span>
        <span
          style={{
            color: "#1d4ed8",
            fontStyle: "italic",
            fontWeight: 700,
            fontSize: "12px",
            textAlign: "right",
          }}
          className="capitalize leading-tight print:text-[10.5px]"
        >
          {amountInWords}{" "}
        </span>
      </div>
    </div>
  );
}
