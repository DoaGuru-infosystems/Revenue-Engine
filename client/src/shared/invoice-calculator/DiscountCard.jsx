import React from "react";
import { BadgePercent, Pencil, Trash2, Tag, CheckCircle2 } from "lucide-react";

const DiscountCard = ({ discountData, grandTotal, onEdit, onDelete }) => {
  if (!discountData) return null;

  const isPercent = discountData.discount_type === "percent";
  const discountValue = isPercent
    ? parseFloat(discountData.discount_per)
    : parseFloat(discountData.discount_amt);
  const discountRupee = isPercent
    ? (grandTotal * discountValue) / 100
    : discountValue;
  const finalAmount = grandTotal - discountRupee;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-yellow-400/30 bg-gradient-to-br from-yellow-900/40 via-yellow-900/30 to-amber-900/40 backdrop-blur-sm shadow-xl">
      {/* Decorative top bar */}
      <div className="h-1 w-full bg-gradient-to-r from-yellow-400 via-yellow-400 to-amber-400" />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-yellow-400/20 flex items-center justify-center">
              <BadgePercent className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-yellow-300/70 font-medium uppercase tracking-wider">
                Discount Applied
              </p>
              <p className="text-white font-bold text-base leading-tight">
                {isPercent
                  ? `${discountValue}% Off`
                  : `₹${discountValue.toLocaleString()} Off`}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/40 border border-red-400/30 text-red-300 hover:text-red-100 flex items-center justify-center transition-all duration-200"
              title="Edit Discount"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/40 border border-red-400/30 text-red-300 hover:text-red-100 flex items-center justify-center transition-all duration-200"
              title="Delete Discount"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-white/60">
            <span>Original Amount</span>
            <span className="font-medium text-white/80">
              ₹{grandTotal.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-yellow-300">
            <span className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" />
              Discount{" "}
              {isPercent
                ? `(${discountValue}%)`
                : `(₹${discountValue.toLocaleString()})`}
            </span>
            <span className="font-semibold">
              − ₹{discountRupee.toFixed(2)}
            </span>
          </div>
          <div className="h-px bg-white/10 my-1" />
          <div className="flex justify-between text-white font-bold text-base">
            <span>You Pay</span>
            <span className="text-yellow-300">
              ₹{finalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Savings badge */}
        <div className="mt-3 inline-flex items-center gap-1.5 bg-yellow-400/15 border border-yellow-400/25 text-yellow-300 text-xs font-semibold px-3 py-1.5 rounded-full">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Saving ₹{discountRupee.toFixed(2)} on this invoice
        </div>
      </div>
    </div>
  );
};

export default DiscountCard;
