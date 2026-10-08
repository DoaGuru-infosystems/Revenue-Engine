import React from "react";
import { X, CheckCircle2, Loader2 } from "lucide-react";

export default function SendClientWorkflowModal({
  isOpen,
  onClose,
  clientSendSuccess,
  setClientSendSuccess,
  selectedChannel,
  setSelectedChannel,
  workflowRemark,
  setWorkflowRemark,
  handleSendToClient,
  workflowLoading,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Send Quotation to Client</h2>
          <button
            onClick={ () => {
              onClose();
              setClientSendSuccess(false);
              setWorkflowRemark("");
              setSelectedChannel("email");
            } }
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={ 20 } />
          </button>
        </div>

        { clientSendSuccess ? (
          <div className="flex flex-col items-center justify-center py-6">
            <CheckCircle2 size={ 48 } className="text-green-500 mb-3" />
            <p className="text-lg font-semibold text-gray-800 mb-1">Sent Successfully!</p>
            <p className="text-sm text-gray-500 mb-6">
              Quotation has been sent to the client via{ " " }
              { selectedChannel === "both"
                ? "Email & WhatsApp"
                : selectedChannel === "email"
                ? "Email"
                : "WhatsApp" }
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-3">Select how to send:</p>
            <div className="flex gap-3 mb-4">
              { ["email", "whatsapp", "both"].map((ch) => (
                <button
                  key={ ch }
                  onClick={ () => setSelectedChannel(ch) }
                  className={ `flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${
                    selectedChannel === ch
                      ? "bg-orange-500 text-white border-orange-500"
                      : "border-gray-300 text-gray-600 hover:border-orange-400"
                  }` }
                >
                  { ch === "email"
                    ? "📧 Email"
                    : ch === "whatsapp"
                    ? "💬 WhatsApp"
                    : "📧+💬 Both" }
                </button>
              )) }
            </div>
            <textarea
              className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
              rows={ 3 }
              placeholder="Add a remark (optional)"
              value={ workflowRemark }
              onChange={ (e) => setWorkflowRemark(e.target.value) }
            />
          </>
        ) }

        <div className="flex gap-2 mt-4">
          <button
            onClick={ handleSendToClient }
            disabled={ workflowLoading || clientSendSuccess }
            className="flex-1 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-green-500 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            { workflowLoading && <Loader2 size={ 16 } className="animate-spin" /> }
            { clientSendSuccess ? "Sent" : "Send Now" }
          </button>
          { clientSendSuccess && (
            <button
              onClick={ () => {
                setClientSendSuccess(false);
                setWorkflowRemark("");
                setSelectedChannel("email");
              } }
              className="flex-1 py-2 rounded-lg bg-gradient-to-r from-red-500 to-amber-500 text-white font-semibold hover:opacity-90 flex items-center justify-center gap-2"
            >
              🔄 Retry
            </button>
          ) }
        </div>
      </div>
    </div>
  );
}
