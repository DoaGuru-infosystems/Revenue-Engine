import React from "react";
import { X, Loader2 } from "lucide-react";

export default function ClientResponseWorkflowModal({
  isOpen,
  onClose,
  clientDecision,
  setClientDecision,
  workflowRemark,
  setWorkflowRemark,
  handleMarkClientResponse,
  workflowLoading,
}) {
  if (!isOpen) return null;

  const decisionOptions = [
    { val: "approved", label: "✅ Approved", color: "border-green-400 bg-green-50 text-green-700" },
    { val: "rejected", label: "❌ Rejected", color: "border-red-400 bg-red-50 text-red-700" },
    { val: "changes", label: "🔄 Changes Requested", color: "border-amber-400 bg-amber-50 text-amber-700" },
    { val: "pending", label: "⏳ Pending", color: "border-gray-400 bg-gray-50 text-gray-700" },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Mark Client Response</h2>
          <button onClick={ onClose } className="text-gray-400 hover:text-gray-600">
            <X size={ 20 } />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          { decisionOptions.map((opt) => (
            <button
              key={ opt.val }
              type="button"
              onClick={ () => setClientDecision(opt.val) }
              className={ `p-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                clientDecision === opt.val
                  ? opt.color + " ring-2 ring-offset-1"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }` }
            >
              { opt.label }
            </button>
          )) }
        </div>
        <textarea
          className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
          rows={ 2 }
          placeholder="Add a remark (optional)"
          value={ workflowRemark }
          onChange={ (e) => setWorkflowRemark(e.target.value) }
        />
        <button
          onClick={ handleMarkClientResponse }
          disabled={ workflowLoading }
          className="mt-4 w-full py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          { workflowLoading && <Loader2 size={ 16 } className="animate-spin" /> }
          Save Response
        </button>
      </div>
    </div>
  );
}
