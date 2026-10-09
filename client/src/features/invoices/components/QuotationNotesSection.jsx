import React from "react";

export default function QuotationNotesSection({
  notesData = [],
  isProforma = false,
  clientData = {},
  onEditNote,
  onDeleteNote,
}) {
  if (!notesData || notesData.length === 0) return null;

  const isReceived = clientData?.tag_received_amt === "received";

  return (
    <div className={isProforma ? "mt-4 border-t pt-4 border-gray-300" : "mt-2"}>
      <p className="text-sm font-bold text-gray-800">Notes</p>

      <ul className="list-disc pl-5 mt-1 space-y-1">
        {notesData.map((note) => (
          <div
            key={note.id}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <li className="text-xs text-gray-700 font-bold">
              {note.note_name}
            </li>
            {!isReceived && (
              <div className="flex print:hidden items-center gap-2 sm:gap-4">
                {onEditNote && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditNote(note);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-sm"
                    title="Edit"
                  >
                    ✎
                  </button>
                )}
                {onDeleteNote && (
                  <button
                    type="button"
                    onClick={() => onDeleteNote(note.id)}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-sm"
                    title="Delete"
                  >
                    ×
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </ul>
    </div>
  );
}
