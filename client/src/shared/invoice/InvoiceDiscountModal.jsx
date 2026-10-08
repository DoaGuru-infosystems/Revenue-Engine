import React from "react";
import { IndianRupeeIcon, X } from "lucide-react";

export const InvoiceDiscountModal = ({
  show,
  onClose,
  onSubmit,
  formDataDiscount,
  onChangeDiscount,
  onDeleteDiscount,
  selecteddiscount,
  discountDataSet,
  grandTotal,
  loading,
}) => {
  if (!show) return null;

  const isAmt = formDataDiscount.discount_type === "amount";
  const val = isAmt
    ? Number(formDataDiscount.discount_amt)
    : Number(formDataDiscount.discount_per);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Compact Discount Modal */}
      <div className="relative bg-white w-full max-w-xs rounded-xl shadow-2xl transform transition-all animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 bg-red-100 rounded flex items-center justify-center">
              <IndianRupeeIcon className="w-3.5 h-3.5 text-red-600" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">
              {selecteddiscount ? "Update Discount" : "Set Discount"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="px-3 py-2 space-y-2">
          {/* Discount value + type inline */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-0.5">
              Discount Value
            </label>
            <div className="flex gap-1.5">
              <input
                type="number"
                name={isAmt ? "discount_amt" : "discount_per"}
                value={isAmt ? formDataDiscount.discount_amt : formDataDiscount.discount_per}
                onChange={onChangeDiscount}
                className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-black text-sm"
                placeholder={
                  isAmt
                    ? `Enter ₹ (max ₹${discountDataSet?.discount_amt ? Number(discountDataSet.discount_amt).toLocaleString() : grandTotal.toFixed(0)})`
                    : `Enter % (max ${discountDataSet?.discount_per ? discountDataSet.discount_per : 100}%)`
                }
                min="0"
                max={isAmt ? maxAmt : maxPer}
              />
              <select
                name="discount_type"
                value={formDataDiscount.discount_type}
                onChange={onChangeDiscount}
                className="px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-black text-sm bg-white"
              >
                <option value="amount">₹</option>
                <option value="percent">%</option>
              </select>
            </div>
            {/* DB Limit helper */}
            <p className="text-xs text-gray-400 mt-0.5">
              {isAmt
                ? `Max allowed: ₹${discountDataSet?.discount_amt ? Number(discountDataSet.discount_amt).toLocaleString() : grandTotal.toFixed(0)}`
                : `Max allowed: ${discountDataSet?.discount_per ? discountDataSet.discount_per : 100}%${discountDataSet?.discount_amt ? ` (or ₹${Number(discountDataSet.discount_amt).toLocaleString()})` : ""}`}
            </p>
            {/* Preview */}
            {val > 0 && (
              <p
                className={`text-xs mt-1 ${isExceeded ? "text-red-500 font-semibold" : "text-green-600"}`}
              >
                {isAmt
                  ? `Discount: ₹${val.toLocaleString()} (${((val / grandTotal) * 100).toFixed(2)}% of ₹${grandTotal.toFixed(0)})${isExceeded ? " [Limit exceeded]" : ""}`
                  : `Discount: ₹${calculatedRupee.toFixed(2)} (${val}% of ₹${grandTotal.toFixed(0)})${isExceeded ? " [Limit exceeded]" : ""}`}
              </p>
            )}
          </div>
          {/* Buttons */}
          <div className="flex items-center justify-between gap-2">
            <div>
              {selecteddiscount && (
                <button
                  type="button"
                  onClick={onDeleteDiscount}
                  disabled={loading}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-medium disabled:opacity-50"
                >
                  Delete
                </button>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-xs font-medium"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-medium shadow-sm disabled:opacity-50"
              >
                {loading ? "Saving..." : selecteddiscount ? "Update" : "Set Discount"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceDiscountModal;
