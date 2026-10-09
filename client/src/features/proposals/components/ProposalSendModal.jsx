import React from "react";
import { Send, X } from "lucide-react";

export default function ProposalSendModal({
  show,
  onClose,
  clientDisplayName,
  sendChannel,
  setSendChannel,
  onSend,
  sending,
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Send className="w-5 h-5 text-red-400" /> Send Proposal
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">
          <p className="text-sm text-gray-400 mb-4">
            Select how you want to send this proposal to <b>{clientDisplayName}</b>.
          </p>
          <div className="space-y-3 mb-6">
            <label
              className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition ${
                sendChannel === "email"
                  ? "bg-red-900/20 border-red-500/50"
                  : "bg-gray-800 border-gray-700 hover:border-gray-600"
              }`}
            >
              <input
                type="radio"
                name="channel"
                value="email"
                checked={sendChannel === "email"}
                onChange={() => setSendChannel("email")}
                className="accent-red-500 w-4 h-4"
              />
              <span className="font-medium text-white">Email Only</span>
            </label>
            <label
              className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition ${
                sendChannel === "whatsapp"
                  ? "bg-yellow-900/20 border-yellow-500/50"
                  : "bg-gray-800 border-gray-700 hover:border-gray-600"
              }`}
            >
              <input
                type="radio"
                name="channel"
                value="whatsapp"
                checked={sendChannel === "whatsapp"}
                onChange={() => setSendChannel("whatsapp")}
                className="accent-yellow-500 w-4 h-4"
              />
              <span className="font-medium text-white">WhatsApp Only</span>
            </label>
            <label
              className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition ${
                sendChannel === "both"
                  ? "bg-orange-900/20 border-orange-500/50"
                  : "bg-gray-800 border-gray-700 hover:border-gray-600"
              }`}
            >
              <input
                type="radio"
                name="channel"
                value="both"
                checked={sendChannel === "both"}
                onChange={() => setSendChannel("both")}
                className="accent-orange-500 w-4 h-4"
              />
              <span className="font-medium text-white">Both (Email & WhatsApp)</span>
            </label>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 font-semibold transition"
            >
              Cancel
            </button>
            <button
              disabled={sending}
              onClick={onSend}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition flex items-center gap-2"
            >
              {sending ? "Sending..." : "Send Now"} <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
