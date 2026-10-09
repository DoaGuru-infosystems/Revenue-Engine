import React from "react";

export default function InvoiceTermsConditions({
  notesData = [],
  visibleAdBudget = 0,
  tdsAmountToShow = 0,
  previousAmountForSummary = 0,
  projectValueDeferred = 0,
  adsData = [],
  activeTaxableSubtotal = 0,
  pastReceivedAmount = 0,
  previousInvoiceNo = "",
  previousInvoiceDate = "",
  clientData = {},
  publicMode = false,
  onEditNote,
  onDeleteNote,
}) {
  const shouldShow =
    (notesData && notesData.length > 0) ||
    visibleAdBudget > 0 ||
    tdsAmountToShow > 0 ||
    previousAmountForSummary > 0 ||
    projectValueDeferred > 0;

  if (!shouldShow) return null;

  return (
    <div className="terms-conditions-section w-full text-left pt-2 border-t border-gray-300">
      <h2 className="font-bold mb-1 text-gray-800">Terms &amp; Conditions</h2>
      <ul className="list-decimal ml-5 space-y-0.5 text-gray-700">
        {visibleAdBudget > 0 && (
          <li className="leading-relaxed mt-1 text-gray-700">
            The advertising budget shown in this invoice represents third-party
            media spend incurred on behalf of the client. This amount is a
            reimbursement only and does not form part of our service charges or
            revenue, in accordance with Rule 33 of the CGST Rules, 2017.
          </li>
        )}
        {tdsAmountToShow > 0 && (
          <li className="leading-relaxed mt-1 text-gray-700">
            TDS, wherever applicable, has been deducted in accordance with the
            applicable provisions of the Income-tax Act, 1961, and the
            corresponding Form 16A shall be provided after the prescribed
            deposit.
          </li>
        )}
        {pastReceivedAmount > 0 && previousInvoiceNo && (
          <li className="leading-relaxed mt-1 text-gray-700">
            The taxable value already billed has been excluded from this
            invoice to avoid duplicate billing. This invoice covers only the
            remaining taxable value of the contract.
          </li>
        )}
        {projectValueDeferred > 0 && (
          <li className="leading-relaxed mt-1 text-gray-700">
            A portion of the contract value has been excluded from this invoice
            and will be billed separately in accordance with the agreed project
            scope and payment terms. GST shall be applicable at the time of such
            billing as per the provisions of the CGST Act, 2017.
          </li>
        )}
        {notesData?.map((note) => (
          <li key={note.id} className="leading-snug">
            {note.note_name}
            {clientData?.tag_received_amt === "received" ? null : (
              <div
                className={`flex items-center gap-1 sm:gap-2 print:hidden ${
                  publicMode ? "!hidden" : ""
                }`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onEditNote) onEditNote(note);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mt-1"
                  title="Edit"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (onDeleteNote) onDeleteNote(note.id);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mt-1"
                  title="Delete"
                >
                  X
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
