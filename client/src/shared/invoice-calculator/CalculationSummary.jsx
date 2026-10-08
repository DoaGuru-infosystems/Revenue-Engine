import React from "react";
import { Tag, Pencil, Trash2, CheckCircle2 } from "lucide-react";

const CalculationSummary = ({
  grandTotal,
  discountData,
  discountedTotal,
  onEditDiscount,
  onDeleteDiscount,
}) => {
  const discountAmount = discountData
    ? grandTotal - discountedTotal()
    : 0;
  const payableAmount = discountData
    ? discountedTotal().toFixed(2)
    : grandTotal.toLocaleString();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl">
      {/* Top accent bar */}
      <div
        className={`h-1 w-full ${
          discountData
            ? "bg-gradient-to-r from-yellow-400 via-yellow-400 to-amber-400"
            : "bg-gradient-to-r from-red-400 via-orange-400 to-orange-400"
        }`}
      />

      <div className="p-5 space-y-3">
        {/* Subtotal */}
        <div className="flex justify-between text-white/60 text-sm">
          <span>Subtotal</span>
          <span className="text-white font-medium">₹{grandTotal.toLocaleString()}</span>
        </div>

        {/* Discount row (only if discount exists) */}
        {discountData && (
          <>
            <div className="flex justify-between items-center text-yellow-400 text-sm">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                Discount{" "}
                {discountData.discount_type === "percent"
                  ? `(${discountData.discount_per}%)`
                  : `(₹${parseFloat(discountData.discount_amt).toLocaleString()})`}
              </span>
              <div className="flex items-center gap-3">
                <span className="font-semibold">
                  − ₹{discountAmount.toFixed(2)}
                </span>
                {/* Edit & Delete buttons */}
                <button
                  onClick={onEditDiscount}
                  className="w-7 h-7 rounded-lg bg-red-500/20 hover:bg-red-500/40 border border-red-400/30 text-red-300 hover:text-red-100 flex items-center justify-center transition-all duration-200"
                  title="Edit Discount"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onDeleteDiscount(discountData.id)}
                  className="w-7 h-7 rounded-lg bg-red-500/20 hover:bg-red-500/40 border border-red-400/30 text-red-300 hover:text-red-100 flex items-center justify-center transition-all duration-200"
                  title="Delete Discount"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="h-px bg-white/10" />
          </>
        )}

        {/* Grand Total / Total Payable */}
        <div className="flex justify-between text-white font-bold text-lg">
          <span>{discountData ? "Total Payable" : "Grand Total"}</span>
          <span className={discountData ? "text-yellow-300" : "text-green-300"}>
            ₹{payableAmount}
          </span>
        </div>

        {/* Savings badge */}
        {discountData && (
          <div className="inline-flex items-center gap-1.5 bg-yellow-400/15 border border-yellow-400/25 text-yellow-300 text-xs font-semibold px-3 py-1.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Saving ₹{discountAmount.toFixed(2)} on this invoice
          </div>
        )}
      </div>
    </div>
  );
};

export default CalculationSummary;
