import React from "react";
import { X, Percent, IndianRupee, BadgePercent, AlertTriangle } from "lucide-react";

const ProposalDiscountModal = ({
  show,
  onClose,
  onSubmit,
  formDataDis,
  handleChangeDis,
  grandTotal,
  discountDataSet,
}) => {
  if (!show) return null;

  const isAmt = formDataDis.discount_type === "amount";
  const val = isAmt
    ? Number(formDataDis.discount_amt)
    : Number(formDataDis.discount_per);
  
  // For Proposal Builder we might not always have strict limits from a dataset.
  // We fall back to grandTotal for amount, and 100 for percentage if not specified.
  const maxAmt = discountDataSet?.discount_amt
    ? Number(discountDataSet.discount_amt)
    : grandTotal;
  const maxPer = discountDataSet?.discount_per
    ? Number(discountDataSet.discount_per)
    : 100;
    
  const calculatedRupee = isAmt ? val : (grandTotal * val) / 100;
  const isExceeded = isAmt
    ? val > maxAmt
    : val > maxPer || calculatedRupee > maxAmt;
  const hasValue = val > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-gradient-to-b from-gray-900 to-gray-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Top accent */}
        <div className="h-1 w-full bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-yellow-400/15 rounded-xl flex items-center justify-center">
              <BadgePercent className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">Apply Discount</h2>
              <p className="text-white/40 text-xs">
                Invoice total: ₹{grandTotal.toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="p-5 space-y-4">
          {/* Type Toggle */}
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
              Discount Type
            </label>
            <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
              {[
                { value: "percent", label: "Percentage", icon: Percent },
                { value: "amount", label: "Fixed Amount", icon: IndianRupee },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    handleChangeDis({ target: { name: "discount_type", value } })
                  }
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    formDataDis.discount_type === value
                      ? "bg-yellow-400 text-gray-900 shadow-lg shadow-yellow-400/20"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Value Input */}
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
              {isAmt ? "Discount Amount (₹)" : "Discount Percentage (%)"}
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">
                {isAmt ? (
                  <IndianRupee className="w-4 h-4" />
                ) : (
                  <Percent className="w-4 h-4" />
                )}
              </div>
              <input
                type="number"
                name={isAmt ? "discount_amt" : "discount_per"}
                value={isAmt ? formDataDis.discount_amt : formDataDis.discount_per}
                onChange={handleChangeDis}
                min="0"
                max={isAmt ? maxAmt : maxPer}
                placeholder={
                  isAmt
                    ? `Max ₹${maxAmt.toLocaleString()}`
                    : `Max ${maxPer}%`
                }
                className={`w-full pl-10 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/25 focus:outline-none focus:ring-2 transition-all text-sm ${
                  isExceeded && hasValue
                    ? "border-red-400/50 focus:ring-red-400/30"
                    : "border-white/10 focus:ring-yellow-400/30 focus:border-yellow-400/40"
                }`}
              />
            </div>

            {/* Limit hint */}
            <p className="text-xs text-white/30 mt-1.5">
              {isAmt
                ? `Maximum allowed: ₹${maxAmt.toLocaleString()}`
                : `Maximum allowed: ${maxPer}%${
                    discountDataSet?.discount_amt
                      ? ` (or ₹${Number(discountDataSet.discount_amt).toLocaleString()})`
                      : ""
                  }`}
            </p>

            {/* Live Preview */}
            {hasValue && (
              <div
                className={`mt-3 p-3 rounded-xl border text-xs ${
                  isExceeded
                    ? "bg-red-500/10 border-red-400/30 text-red-300"
                    : "bg-yellow-500/10 border-yellow-400/30 text-yellow-300"
                }`}
              >
                {isExceeded ? (
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>
                      Exceeds allowed limit!{" "}
                      {isAmt
                        ? `Max is ₹${maxAmt.toLocaleString()}`
                        : `Max is ${maxPer}%`}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Discount amount</span>
                      <span className="font-bold">
                        ₹{calculatedRupee.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Final payable</span>
                      <span className="font-bold">
                        ₹{(grandTotal - calculatedRupee).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-white/10 text-white/60 hover:text-white hover:border-white/20 rounded-xl text-sm font-medium transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={hasValue && isExceeded}
              className="flex-1 py-2.5 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed text-gray-900 rounded-xl text-sm font-bold shadow-lg shadow-yellow-400/20 transition-all duration-200"
            >
              Apply Discount
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProposalDiscountModal;
