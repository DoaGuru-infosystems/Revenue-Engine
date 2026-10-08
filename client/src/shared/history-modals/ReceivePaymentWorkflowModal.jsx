 import React from "react";
import { X, Loader2 } from "lucide-react";

export default function ReceivePaymentWorkflowModal({
  isOpen,
  onClose,
  paymentSummaryLoading,
  paymentSummary,
  livePendingPayment,
  paymentEntry,
  setPaymentEntry,
  handleReceivePaymentEntry,
  workflowLoading,
  toNumber,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Receive Payment Entry</h2>
          <button onClick={ onClose } className="text-gray-400 hover:text-gray-600">
            <X size={ 20 } />
          </button>
        </div>

        { paymentSummaryLoading ? (
          <div className="py-8 text-center text-gray-500">Loading payment summary...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                <p className="text-xs text-gray-500">Total Contract Value</p>
                <p className="text-sm font-semibold text-gray-800">
                  INR { toNumber(paymentSummary.total_contract_value).toLocaleString("en-IN") }
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                <p className="text-xs text-gray-500">Received Till Date</p>
                <p className="text-sm font-semibold text-gray-800">
                  INR { toNumber(paymentSummary.total_received_till_date).toLocaleString("en-IN") }
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3 bg-amber-50 border-amber-200">
                <p className="text-xs text-amber-700">Live Pending Amount</p>
                <p className="text-sm font-semibold text-amber-800">
                  INR { livePendingPayment.toLocaleString("en-IN") }
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 font-medium">Amount Received *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={ paymentEntry.amount_received }
                  onChange={ (e) =>
                    setPaymentEntry((prev) => ({ ...prev, amount_received: e.target.value }))
                  }
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Enter amount"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium">Payment Mode</label>
                  <select
                    value={ paymentEntry.payment_mode }
                    onChange={ (e) =>
                      setPaymentEntry((prev) => ({ ...prev, payment_mode: e.target.value }))
                    }
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="Online">Online / UPI</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium">Payment Date</label>
                  <input
                    type="date"
                    value={ paymentEntry.payment_date }
                    onChange={ (e) =>
                      setPaymentEntry((prev) => ({ ...prev, payment_date: e.target.value }))
                    }
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 font-medium">Transaction Reference / UTR</label>
                <input
                  type="text"
                  value={ paymentEntry.transaction_reference }
                  onChange={ (e) =>
                    setPaymentEntry((prev) => ({
                      ...prev,
                      transaction_reference: e.target.value,
                    }))
                  }
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="UTR / Cheque number (optional)"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 font-medium">Remark / Notes</label>
                <textarea
                  rows={ 2 }
                  value={ paymentEntry.remark }
                  onChange={ (e) =>
                    setPaymentEntry((prev) => ({ ...prev, remark: e.target.value }))
                  }
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Payment notes (optional)"
                />
              </div>
            </div>

            <button
              onClick={ handleReceivePaymentEntry }
              disabled={ workflowLoading }
              className="mt-5 w-full py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              { workflowLoading && <Loader2 size={ 16 } className="animate-spin" /> }
              Save Payment &amp; Update Workflow
            </button>
          </>
        ) }
      </div>
    </div>
  );
}
