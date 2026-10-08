import React from "react";

export default function SelectQuotationTypeGstModal({
  isOpen,
  onClose,
  onSelectGst,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="relative bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md">
        <button
          onClick={ onClose }
          className="absolute top-2 right-3 text-red-600 hover:text-gray-500 text-xl font-bold"
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-lg font-semibold mb-4 text-center">
          Select Quotation Type
        </h2>
        <div className="flex justify-center gap-4">
          <button
            onClick={ () => onSelectGst(true) }
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 font-medium"
          >
            With GST (18%)
          </button>
          <button
            onClick={ () => onSelectGst(false) }
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 font-medium"
          >
            Without GST
          </button>
        </div>
      </div>
    </div>
  );
}
