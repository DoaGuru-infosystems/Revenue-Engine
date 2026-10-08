import React from "react";
import { StickyNote, Notebook, X } from "lucide-react";

export const InvoiceNoteModal = ({
  show,
  onClose,
  onSubmit,
  formDataNote,
  onChangeNote,
  isEditing,
  loading,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-md rounded-xl shadow-2xl transform transition-all animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <StickyNote className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? "Edit Note" : "Add New Note"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Notebook className="w-4 h-4 inline mr-2" />
              Note
            </label>
            <textarea
              name="note_name"
              value={formDataNote.note_name}
              onChange={onChangeNote}
              className="w-full text-black px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors resize-none"
              placeholder="Enter note details"
              rows={4}
              required
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm"
            >
              {loading
                ? isEditing
                  ? "Updating..."
                  : "Saving..."
                : isEditing
                ? "Update Note"
                : "Save Note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceNoteModal;
