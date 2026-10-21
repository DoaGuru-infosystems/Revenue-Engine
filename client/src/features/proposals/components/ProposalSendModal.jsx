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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 sm:p-5 border-b border-gray-150 dark:border-gray-800 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Send className="w-5 h-5 text-red-500 dark:text-red-400" /> Send Proposal
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-5">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
            Select how you want to send this proposal to <b className="text-gray-900 dark:text-white">{clientDisplayName}</b>.
          </p>
          <div className="space-y-2.5 sm:space-y-3 mb-6">
            <label
              className={`flex items-center gap-3 p-3.5 sm:p-4 rounded-xl border cursor-pointer transition ${
                sendChannel === "email"
                  ? "bg-red-50 border-red-400 dark:bg-red-900/20 dark:border-red-500/50 shadow-sm"
                  : "bg-gray-50 border-gray-200 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-600"
              }`}
            >
              <input
                type="radio"
                name="channel"
                value="email"
                checked={sendChannel === "email"}
                onChange={() => setSendChannel("email")}
                className="accent-red-500 w-4 h-4 cursor-pointer"
              />
              <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Email Only</span>
            </label>
            <label
              className={`flex items-center gap-3 p-3.5 sm:p-4 rounded-xl border cursor-pointer transition ${
                sendChannel === "whatsapp"
                  ? "bg-emerald-50 border-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-500/50 shadow-sm"
                  : "bg-gray-50 border-gray-200 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-600"
              }`}
            >
              <input
                type="radio"
                name="channel"
                value="whatsapp"
                checked={sendChannel === "whatsapp"}
                onChange={() => setSendChannel("whatsapp")}
                className="accent-emerald-500 w-4 h-4 cursor-pointer"
              />
              <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">WhatsApp Only</span>
            </label>
            <label
              className={`flex items-center gap-3 p-3.5 sm:p-4 rounded-xl border cursor-pointer transition ${
                sendChannel === "both"
                  ? "bg-orange-50 border-orange-400 dark:bg-orange-900/20 dark:border-orange-500/50 shadow-sm"
                  : "bg-gray-50 border-gray-200 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-600"
              }`}
            >
              <input
                type="radio"
                name="channel"
                value="both"
                checked={sendChannel === "both"}
                onChange={() => setSendChannel("both")}
                className="accent-orange-500 w-4 h-4 cursor-pointer"
              />
              <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Both (Email & WhatsApp)</span>
            </label>
          </div>
          <div className="flex gap-2.5 sm:gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold transition text-xs sm:text-sm"
            >
              Cancel
            </button>
            <button
              disabled={sending}
              onClick={onSend}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition flex items-center gap-2 text-xs sm:text-sm shadow-sm disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send Now"} <Send className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
