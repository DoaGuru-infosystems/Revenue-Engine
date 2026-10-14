import React from "react";
import { Scale, X } from "lucide-react";

export const InvoiceAdjustmentModal = ({
  show,
  onClose,
  onSubmit,
  formDataAdjustment,
  onChangeAdjustment,
  onDeleteAdjustment,
  selectedAdjustment,
  maxAdjustment = 0,
  loading = false,
}) => {
  if (!show) return null;

  const enteredVal = Number(formDataAdjustment.adjustment_amt || 0);
  const isExceeded = enteredVal > maxAdjustment;
  const remainingAfterAdjustment = Math.max(0, maxAdjustment - enteredVal);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Compact Adjustment Modal */}
      <div className="relative bg-white w-full max-w-sm rounded-xl shadow-2xl transform transition-all animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
              <Scale className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                {selectedAdjustment ? "Update Adjustment" : "Set Adjustment"}
              </h2>
              <p className="text-[11px] text-gray-500">
                Deducted from Service Charges (excluding Ads Budget)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="px-4 py-3 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Adjustment Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-sm text-gray-500 font-medium">₹</span>
              <input
                type="number"
                name="adjustment_amt"
                value={formDataAdjustment.adjustment_amt ?? ""}
                onChange={onChangeAdjustment}
                className="w-full pl-7 pr-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-black text-sm"
                placeholder={`Enter amount (max ₹${Number(maxAdjustment).toLocaleString("en-IN")})`}
                min="0"
                max={maxAdjustment}
                step="any"
                autoFocus
              />
            </div>

            {/* Helper text */}
            <div className="mt-1.5 text-xs flex justify-between items-center text-gray-500">
              <span>Max allowed:</span>
              <span className="font-semibold text-gray-700">₹{Number(maxAdjustment).toLocaleString("en-IN")}</span>
            </div>

            {/* Live calculation preview */}
            {enteredVal > 0 && (
              <div
                className={`mt-2 p-2 rounded text-xs ${
                  isExceeded
                    ? "bg-red-50 text-red-600 font-semibold border border-red-200"
                    : "bg-purple-50 text-purple-800 border border-purple-100"
                }`}
              >
                {isExceeded ? (
                  <span>⚠️ Limit exceeded! Max adjustment allowed is ₹{Number(maxAdjustment).toLocaleString("en-IN")}.</span>
                ) : (
                  <div className="space-y-0.5">
                    <div className="flex justify-between">
                      <span>Adjustment:</span>
                      <span className="font-bold">-₹{enteredVal.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-purple-900 font-semibold pt-0.5 border-t border-purple-200">
                      <span>Service Charge after adjustment:</span>
                      <span>₹{remainingAfterAdjustment.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
            <div>
              {selectedAdjustment && (
                <button
                  type="button"
                  onClick={onDeleteAdjustment}
                  disabled={loading}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-medium disabled:opacity-50 shadow-sm"
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
                disabled={loading || isExceeded}
                className="px-3.5 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs font-semibold shadow-sm disabled:opacity-50"
              >
                {loading ? "Saving..." : selectedAdjustment ? "Update Adjustment" : "Save Adjustment"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceAdjustmentModal;
