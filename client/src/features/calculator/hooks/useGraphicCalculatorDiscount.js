import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  getGraphicDiscount,
  getDiscountSetting,
  saveGraphicDiscountData,
  deleteDiscountById,
} from "../services/calculatorService";

export function useGraphicCalculatorDiscount({ id, proposalId, grandTotal, token, mode }) {
  const [selecteddiscount, setSelecteddiscount] = useState(null);
  const [discountDataSet, setDiscountDataSet] = useState(null);
  const [showModalDiscount, setShowModalDiscount] = useState(false);
  const [loadingDiscount, setLoadingDiscount] = useState(false);
  const [formDataDiscount, setFormDataDiscount] = useState({
    discount_type: "amount",
    discount_per: "",
    discount_amt: "",
  });

  const fetchDiscount = async () => {
    if (mode === "quotation") {
      setSelecteddiscount(null);
      return;
    }
    if (!id || !proposalId || !token) return;
    try {
      const res = await getGraphicDiscount(proposalId, id, token);
      if (res?.data && res.data.length > 0) {
        setSelecteddiscount(res.data[0]);
      } else {
        setSelecteddiscount(null);
      }
    } catch (error) {
      console.error("fetchDiscount error:", error);
      setSelecteddiscount(null);
    }
  };

  const fetchDiscountSettingData = async () => {
    if (!token) return;
    try {
      const res = await getDiscountSetting(token);
      if (res?.data && res.data.length > 0) {
        setDiscountDataSet(res.data[0]);
      } else {
        setDiscountDataSet(null);
      }
    } catch (error) {
      console.error("fetchDiscountSetting error:", error);
    }
  };

  useEffect(() => {
    fetchDiscount();
    fetchDiscountSettingData();
  }, [id, proposalId, token, mode]);

  const discountAmount = selecteddiscount
    ? selecteddiscount.discount_type === "percent"
      ? (grandTotal * Number(selecteddiscount.discount_per)) / 100
      : selecteddiscount.discount_type === "amount"
      ? Number(selecteddiscount.discount_amt)
      : 0
    : 0;

  const totalAfterDiscount = Math.max(0, grandTotal - discountAmount);

  const handleShowDiscount = () => {
    if (selecteddiscount) {
      setFormDataDiscount({
        discount_type: selecteddiscount.discount_type || "amount",
        discount_per: selecteddiscount.discount_per || "",
        discount_amt: selecteddiscount.discount_amt || "",
      });
    } else {
      setFormDataDiscount({
        discount_type: "amount",
        discount_per: "",
        discount_amt: "",
      });
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
    if (e && e.preventDefault) e.preventDefault();
    setLoadingDiscount(true);

    const resetAndClose = () => {
      setShowModalDiscount(false);
      setFormDataDiscount({
        discount_type: "amount",
        discount_per: "",
        discount_amt: "",
      });
    };

    try {
      if (grandTotal <= 0) {
        Swal.fire({
          icon: "warning",
          title: "Invalid Total!",
          text: "Grand total should be greater than 0 before setting discount.",
          showConfirmButton: false,
          timer: 1200,
        });
        setLoadingDiscount(false);
        return;
      }

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
        setLoadingDiscount(false);
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
        setLoadingDiscount(false);
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
          setLoadingDiscount(false);
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
          setLoadingDiscount(false);
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
            setLoadingDiscount(false);
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
            txn_id: proposalId,
          }
        : {
            discount_type: "percent",
            discount_per: enteredValue,
            discount_amt: parseFloat(((grandTotal * enteredValue) / 100).toFixed(2)),
            client_id: id,
            txn_id: proposalId,
          };

      const response = await saveGraphicDiscountData(
        payload,
        token,
        selecteddiscount ? selecteddiscount.id : null
      );

      if (response?.status === "Success") {
        Swal.fire({
          icon: "success",
          title: selecteddiscount ? "Updated!" : "Saved!",
          text: selecteddiscount
            ? "Discount updated successfully"
            : "Discount saved successfully",
          showConfirmButton: false,
          timer: 1000,
        });
        fetchDiscount();
        resetAndClose();
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed!",
          text: response?.message || "Failed to save discount.",
          showConfirmButton: false,
          timer: 1000,
        });
      }
    } catch (err) {
      console.error("Save error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err?.response?.data?.message || "Something went wrong while saving discount.",
        showConfirmButton: false,
        timer: 1500,
      });
    } finally {
      setLoadingDiscount(false);
    }
  };

  const handleDeleteDiscount = async (discountId) => {
    const targetId = discountId || selecteddiscount?.id;
    if (!targetId) return;

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

    setLoadingDiscount(true);
    try {
      await deleteDiscountById(targetId, token);
      setSelecteddiscount(null);
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
        timer: 1000,
        showConfirmButton: false,
      });
      fetchDiscount();
    } catch (err) {
      console.error("Delete error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err?.response?.data?.message || "Something went wrong while deleting discount.",
        showConfirmButton: false,
        timer: 1500,
      });
    } finally {
      setLoadingDiscount(false);
    }
  };

  return {
    selecteddiscount,
    discountDataSet,
    discountAmount,
    totalAfterDiscount,
    showModalDiscount,
    loadingDiscount,
    formDataDiscount,
    handleShowDiscount,
    handleCloseDiscount,
    handleChangeDiscount,
    handleSaveDiscount,
    handleDeleteDiscount,
    fetchDiscount,
  };
}
