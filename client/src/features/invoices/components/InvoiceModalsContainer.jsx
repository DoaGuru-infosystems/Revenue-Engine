import React from "react";
import InvoiceNoteModal from "../../../shared/invoice/InvoiceNoteModal";
import RemainingPaymentModal from "../../../shared/invoice/RemainingPaymentModal";
import InvoiceDiscountModal from "../../../shared/invoice/InvoiceDiscountModal";

export default function InvoiceModalsContainer({
  // Note Modal
  showModalNote = false,
  handleCloseNote,
  handleSubmitNote,
  formDataNote,
  handleChangeNote,
  isEditingNote = false,

  // Remaining Modal
  showModalRemaining = false,
  setShowModalRemaining,
  handleRemainingSave,
  formDataRemaining,
  setFormDataRemaining,
  handleChangeRemaining,
  isEditingRemaining = false,

  // Discount Modal
  showModalDiscount = false,
  handleCloseDiscount,
  handleSaveDiscount,
  formDataDiscount,
  handleChangeDiscount,
  handleDeleteDiscount,
  selecteddiscount,
  discountDataSet,
  grandTotal,

  // Loading
  loading = false,
}) {
  return (
    <>
      <InvoiceNoteModal
        show={showModalNote}
        onClose={handleCloseNote}
        onSubmit={handleSubmitNote}
        formDataNote={formDataNote}
        onChangeNote={handleChangeNote}
        isEditing={isEditingNote}
        loading={loading}
      />

      <RemainingPaymentModal
        show={showModalRemaining}
        onClose={() => {
          if (setShowModalRemaining) setShowModalRemaining(false);
          if (setFormDataRemaining) {
            setFormDataRemaining({ service_name: "", price: "" });
          }
        }}
        onSubmit={handleRemainingSave}
        formDataRemaining={formDataRemaining}
        onChangeRemaining={handleChangeRemaining}
        isEditingRemaining={isEditingRemaining}
        loading={loading}
      />

      <InvoiceDiscountModal
        show={showModalDiscount}
        onClose={handleCloseDiscount}
        onSubmit={handleSaveDiscount}
        formDataDiscount={formDataDiscount}
        onChangeDiscount={handleChangeDiscount}
        onDeleteDiscount={handleDeleteDiscount}
        selecteddiscount={selecteddiscount}
        discountDataSet={discountDataSet}
        grandTotal={grandTotal}
        loading={loading}
      />
    </>
  );
}
