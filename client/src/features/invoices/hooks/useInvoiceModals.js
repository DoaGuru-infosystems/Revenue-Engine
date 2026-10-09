import { useState } from "react";
import Swal from "sweetalert2";
import {
  saveDiscountData,
  updateDiscountData,
  deleteDiscountById,
  saveRemainingAmountData,
  updateRemainingAmountData,
  saveClientNote,
  updateClientNote,
  deleteClientNote,
} from "../api";

export function useInvoiceModals({
  id,
  txn_id,
  token,
  userName,
  grandTotal = 0,
  discountDataSet = {},
  selecteddiscount = null,
  setSelecteddiscount,
  setClientData,
  setNotesData,
  fetchDiscount,
  fetchRemainingAmount,
  fetchClientNotes,
}) {
  const [modalLoading, setModalLoading] = useState(false);

  // ================= DISCOUNT MODAL STATE =================
  const [showModalDiscount, setShowModalDiscount] = useState(false);
  const [formDataDiscount, setFormDataDiscount] = useState({
    discount_type: "amount",
    discount_per: "",
    discount_amt: "",
  });

  const handleShowDiscount = () => {
    if (selecteddiscount) {
      setFormDataDiscount({
        discount_type: selecteddiscount.discount_type || "amount",
        discount_per: selecteddiscount.discount_per || "",
        discount_amt: selecteddiscount.discount_amt || "",
      });
    } else {
      setFormDataDiscount({ discount_type: "amount", discount_per: "", discount_amt: "" });
    }
    setShowModalDiscount(true);
  };

  const handleCloseDiscount = () => {
    setShowModalDiscount(false);
    setFormDataDiscount({
      discount_type: "amount",
      discount_per: "",
      discount_amt: "",
    });
  };

  const handleChangeDiscount = (e) => {
    const { name, value } = e.target;
    setFormDataDiscount((prev) => {
      if (name === "discount_type") {
        return {
          ...prev,
          discount_type: value,
          discount_per: "",
          discount_amt: "",
        };
      }
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handleSaveDiscount = async (e) => {
    e.preventDefault();
    setModalLoading(true);

    const resetAndClose = () => {
      setShowModalDiscount(false);
      setFormDataDiscount({ discount_type: "amount", discount_per: "", discount_amt: "" });
    };

    try {
      const isAmountType = formDataDiscount.discount_type === "amount";
      const enteredValue = isAmountType
        ? Number(formDataDiscount.discount_amt)
        : Number(formDataDiscount.discount_per);

      if (!enteredValue || enteredValue < 0) {
        Swal.fire({
          icon: "warning",
          title: "Required!",
          text: `Please enter a valid discount ${isAmountType ? "amount (₹)" : "percentage (%)"}`,
          showConfirmButton: false,
          timer: 1000,
        });
        setModalLoading(false);
        return;
      }

      if (!isAmountType && enteredValue > 100) {
        Swal.fire({
          icon: "warning",
          title: "Invalid!",
          text: "Percentage cannot exceed 100%",
          showConfirmButton: false,
          timer: 1000,
        });
        setModalLoading(false);
        return;
      }

      if (isAmountType) {
        const maxAmt = discountDataSet?.discount_amt
          ? Number(discountDataSet.discount_amt)
          : grandTotal;
        if (enteredValue > maxAmt) {
          Swal.fire({
            icon: "warning",
            title: "Limit Exceeded!",
            text: `Max discount amount is ₹${maxAmt.toLocaleString()} (set in settings)`,
            showConfirmButton: false,
            timer: 2000,
          });
          setModalLoading(false);
          return;
        }
      }

      if (!isAmountType) {
        const maxPer = discountDataSet?.discount_per
          ? Number(discountDataSet.discount_per)
          : 100;
        if (enteredValue > maxPer) {
          Swal.fire({
            icon: "warning",
            title: "Limit Exceeded!",
            text: `Max discount percentage is ${maxPer}% (set in settings)`,
            showConfirmButton: false,
            timer: 2000,
          });
          setModalLoading(false);
          return;
        }
        if (discountDataSet?.discount_amt) {
          const calculatedRupee = (grandTotal * enteredValue) / 100;
          const maxAmt = Number(discountDataSet.discount_amt);
          if (calculatedRupee > maxAmt) {
            Swal.fire({
              icon: "warning",
              title: "Limit Exceeded!",
              text: `This % gives ₹${calculatedRupee.toFixed(0)} discount which exceeds max ₹${maxAmt.toLocaleString()}`,
              showConfirmButton: false,
              timer: 2000,
            });
            setModalLoading(false);
            return;
          }
        }
      }

      const payload = isAmountType
        ? {
            discount_type: "amount",
            discount_per: parseFloat(((enteredValue / grandTotal) * 100).toFixed(4)),
            discount_amt: enteredValue,
            client_id: id,
            txn_id: txn_id,
          }
        : {
            discount_type: "percent",
            discount_per: enteredValue,
            discount_amt: parseFloat(((grandTotal * enteredValue) / 100).toFixed(2)),
            client_id: id,
            txn_id: txn_id,
          };

      const response = selecteddiscount
        ? await updateDiscountData(selecteddiscount.id, payload, token)
        : await saveDiscountData(payload, token);

      if (response.status === "Success") {
        Swal.fire({
          icon: "success",
          title: selecteddiscount ? "Updated!" : "Saved!",
          text: selecteddiscount ? "Discount updated successfully" : "Discount saved successfully",
          showConfirmButton: false,
          timer: 1000,
        });
        if (fetchDiscount) fetchDiscount();
        resetAndClose();
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed!",
          text: response.data?.message || "Failed to save discount.",
          showConfirmButton: false,
          timer: 1000,
        });
      }
    } catch (err) {
      console.error("Save error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || "Something went wrong while saving discount.",
        showConfirmButton: false,
        timer: 1500,
      });
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteDiscount = async () => {
    if (!selecteddiscount?.id) return;

    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to delete this discount?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirm.isConfirmed) return;

    setModalLoading(true);
    try {
      await deleteDiscountById(selecteddiscount.id, token);
      if (setSelecteddiscount) setSelecteddiscount(null);
      if (setClientData) {
        setClientData((prev) => (prev ? { ...prev, discount_snapshot: null } : prev));
      }
      setShowModalDiscount(false);
      setFormDataDiscount({
        discount_type: "amount",
        discount_per: "",
        discount_amt: "",
      });
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Discount has been deleted.",
        showConfirmButton: false,
        timer: 1000,
      });
      if (fetchDiscount) fetchDiscount();
    } catch (err) {
      console.error("Delete error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || "Something went wrong while deleting discount.",
        showConfirmButton: false,
        timer: 1500,
      });
    } finally {
      setModalLoading(false);
    }
  };

  // ================= REMAINING PAYMENT MODAL STATE =================
  const [showModalRemaining, setShowModalRemaining] = useState(false);
  const [isEditingRemaining, setIsEditingRemaining] = useState(false);
  const [formDataRemaining, setFormDataRemaining] = useState({
    service_name: "",
    price: "",
  });

  const handleChangeRemaining = (e) => {
    const { name, value } = e.target;
    setFormDataRemaining((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRemainingSave = (e) => {
    e.preventDefault();

    const payload = {
      txn_id: txn_id,
      client_id: id,
      service_name: formDataRemaining.service_name,
      price: formDataRemaining.price,
      employee: userName,
    };

    const request = isEditingRemaining
      ? updateRemainingAmountData(isEditingRemaining, payload, token)
      : saveRemainingAmountData(payload, token);

    request
      .then((res) => {
        setFormDataRemaining({ service_name: "", price: "" });
        setIsEditingRemaining(false);
        if (res.status === "Success") {
          Swal.fire({
            icon: "success",
            title: isEditingRemaining ? "Updated!" : "Saved!",
            text: isEditingRemaining ? "Entry updated successfully" : "Saved successfully",
            showConfirmButton: false,
            timer: 1000,
          });
          if (fetchRemainingAmount) fetchRemainingAmount();
          setShowModalRemaining(false);
        }
      })
      .catch((err) => {
        console.error("Save error:", err);
      });
  };

  // ================= NOTE MODAL STATE =================
  const [formDataNote, setFormDataNote] = useState({
    note_name: "",
    plan: "Customise",
  });
  const [selectedNotesId, setSelectedNotesId] = useState(null);
  const [showModalNote, setShowModalNote] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState([]);

  const handleChangeNote = (e) => {
    const { name, value } = e.target;
    setFormDataNote((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCloseNote = () => {
    setShowModalNote(false);
    setFormDataNote({
      note_name: "",
      plan: "",
    });
  };

  const handleSubmitNote = async (e) => {
    e.preventDefault();
    setModalLoading(true);

    try {
      let response;
      if (isEditingNote && selectedNotesId) {
        response = await updateClientNote(selectedNotesId.id, formDataNote, token);
      } else {
        response = await saveClientNote(formDataNote, token);
      }

      if (response.status === "Success") {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: isEditingNote ? "Note updated successfully!" : "Note added successfully!",
          showConfirmButton: false,
          timer: 1000,
        }).then(() => {
          setShowModalNote(false);
          if (fetchClientNotes) fetchClientNotes();
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: response.data?.message || "Failed to save Note. Please try again.",
          showConfirmButton: false,
          timer: 1000,
        });
      }
    } catch (error) {
      console.error("Error saving Note:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to save note. Please try again.",
        showConfirmButton: false,
        timer: 1000,
      });
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteClientNote = async (noteId) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this note ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirm.isConfirmed) return;

    try {
      const result = await deleteClientNote(noteId, token);
      if (result.status === "Success") {
        if (setNotesData) {
          setNotesData((prev) => prev.filter((item) => item.id !== noteId));
        }
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "note has been deleted.",
          timer: 1000,
          showConfirmButton: false,
        });
        if (fetchClientNotes) fetchClientNotes();
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while deleting entry.",
        showConfirmButton: false,
        timer: 1000,
      });
    }
  };

  return {
    modalLoading,

    // Discount Modal
    showModalDiscount,
    setShowModalDiscount,
    formDataDiscount,
    setFormDataDiscount,
    handleShowDiscount,
    handleCloseDiscount,
    handleChangeDiscount,
    handleSaveDiscount,
    handleDeleteDiscount,

    // Remaining Payment Modal
    showModalRemaining,
    setShowModalRemaining,
    isEditingRemaining,
    setIsEditingRemaining,
    formDataRemaining,
    setFormDataRemaining,
    handleChangeRemaining,
    handleRemainingSave,

    // Note Modal
    showModalNote,
    setShowModalNote,
    isEditingNote,
    setIsEditingNote,
    selectedNotesId,
    setSelectedNotesId,
    formDataNote,
    setFormDataNote,
    selectedNotes,
    setSelectedNotes,
    handleChangeNote,
    handleCloseNote,
    handleSubmitNote,
    handleDeleteClientNote,
  };
}
