import React, { useRef, useState, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

export default function QuotationNotesDropdown({
  docTypeFromURL = "quotation",
  isBalanceProforma = false,
  predefinedNotes = [],
  notesData = [],
  selectedNotes = [],
  manualNote = "",
  setManualNote,
  handleSelect,
  handleAddManualNote,
  handleRemoveNote,
  handleSaveNotes,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (docTypeFromURL === "proforma") return null;

  const uniquePredefinedNotes = predefinedNotes.filter(
    (p) =>
      !notesData.some(
        (c) =>
          (c.note_name || "").trim().toLowerCase() ===
          (p.note_text || "").trim().toLowerCase()
      ) &&
      !selectedNotes.some(
        (s) =>
          (s.note_name || "").trim().toLowerCase() ===
          (p.note_text || "").trim().toLowerCase()
      )
  );

  return (
    <div className="space-y-2 print:hidden p-1 mt-4 border-t pt-4 border-gray-300">
      <h3 className="font-bold mb-2 text-gray-800">
        {isBalanceProforma
          ? "Add Notes for Balance Proforma"
          : "Add Notes"}
      </h3>

      {/* Predefined Notes Dropdown */}
      <div className="relative w-full" ref={dropdownRef}>
        <div
          className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
            isOpen
              ? "bg-gradient-to-r from-orange-500 to-red-500 border-orange-400 text-white shadow-lg shadow-orange-200"
              : "bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 text-orange-700 hover:border-orange-400 hover:shadow-md hover:shadow-orange-100"
          }`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`text-lg flex-shrink-0 ${
                isOpen ? "opacity-100" : "opacity-70"
              }`}
            >
              📋
            </span>
            <span
              className={`truncate text-sm font-medium ${
                isOpen
                  ? "text-white"
                  : !selectedNote
                  ? "text-orange-400 italic"
                  : "text-orange-800"
              }`}
            >
              {selectedNote
                ? selectedNote.note_text
                : isBalanceProforma
                ? "Select a predefined balance proforma note..."
                : "Select a predefined note to add..."}
            </span>
          </div>
          <div
            className={`flex-shrink-0 ml-2 w-6 h-6 rounded-full flex items-center justify-center ${
              isOpen ? "bg-white/20" : "bg-orange-100"
            }`}
          >
            {isOpen ? (
              <ChevronUp className="w-3.5 h-3.5 text-white" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-orange-500" />
            )}
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-20 bg-white w-full mt-1.5 max-h-52 overflow-auto rounded-xl border border-orange-100 shadow-xl shadow-orange-100">
            {uniquePredefinedNotes.length === 0 ? (
              <div className="p-4 text-sm text-orange-400 text-center">
                <span className="text-2xl block mb-1">✅</span>
                {isBalanceProforma
                  ? "All balance proforma notes are already added"
                  : "All notes are already added"}
              </div>
            ) : (
              uniquePredefinedNotes.map((note, idx) => (
                <div
                  key={note.id}
                  onClick={() => {
                    handleSelect(note);
                    setSelectedNote(null);
                    setIsOpen(false);
                  }}
                  className={`px-4 py-2.5 text-sm text-gray-700 cursor-pointer transition-all duration-150 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 hover:text-orange-700 ${
                    idx !== uniquePredefinedNotes.length - 1
                      ? "border-b border-gray-100"
                      : ""
                  }`}
                >
                  <span className="text-orange-300 mr-2 font-bold">›</span>
                  {note.note_text}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Manual Note Input */}
      <div className="flex flex-wrap gap-2">
        <textarea
          type="text"
          value={manualNote}
          onChange={(e) => setManualNote(e.target.value)}
          placeholder={
            isBalanceProforma
              ? "Enter custom note for this balance proforma"
              : "Enter custom note"
          }
          rows={1}
          className="flex-1 p-2 rounded-lg border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          onClick={handleAddManualNote}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
        >
          + Add
        </button>
      </div>

      {/* Staged Notes List */}
      {selectedNotes.length > 0 && (
        <div className="space-y-2">
          {selectedNotes.map((note) => (
            <div
              key={note.id}
              className="p-3 bg-gray-100 rounded-lg gap-5 flex justify-between items-center border border-gray-300"
            >
              <span className="text-gray-800 font-medium">
                {note.note_name}
              </span>
              <div>
                <button
                  onClick={() => handleRemoveNote(note.id)}
                  className="bg-red-500 mx-2 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold transition"
                  title="Remove"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
          {/* Save Button */}
          <button
            onClick={handleSaveNotes}
            className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition"
          >
            💾 Save Notes
          </button>
        </div>
      )}
    </div>
  );
}
