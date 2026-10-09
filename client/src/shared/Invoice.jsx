import React, { useState } from "react";
import InvoicePrintWrapper from "./invoice/InvoicePrintWrapper";
import InvoiceNoteModal from "./invoice/InvoiceNoteModal";
import RemainingPaymentModal from "./invoice/RemainingPaymentModal";
import InvoiceDiscountModal from "./invoice/InvoiceDiscountModal";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";

import {
  saveDiscountData,
  updateDiscountData,
  deleteDiscountById,
  saveRemainingAmountData,
  updateRemainingAmountData,
  saveClientNote,
  updateClientNote,
  deleteClientNote,
} from "../features/invoices/api";
import { useInvoiceData, useInvoiceCalculations } from "../features/invoices/hooks";
import {
  InvoiceActionButtons,
  InvoiceCustomerInfoCard,
  InvoiceServicesTable,
  InvoiceComplimentaryTable,
  InvoiceDiscountSection,
  InvoiceSummaryRightSide,
  InvoiceAmountInWords,
  InvoicePaymentHistoryTable,
  InvoiceTermsConditions,
} from "../features/invoices/components";
import moment from "moment";
import Swal from "sweetalert2";
import { clearUser } from "../redux/user/userSlice";
import img2 from "../assets/Dg 2copy.png";
import DocumentHeaderBanner from "./document/DocumentHeaderBanner";
import DocumentBankDetails from "./document/DocumentBankDetails";

export default function Invoice({ publicMode = false, publicData = null, publicToken = null }) {
  const { id, txn_id } = useParams();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const basePath = isAdmin ? "/admin" : "/BD";
  const query = new URLSearchParams(location.search);
  const rawDocParam = query.get("doc");
  const isBalanceProforma = rawDocParam === "balance-proforma-view" || rawDocParam === "balance-proforma";
  const docTypeFromURL = isBalanceProforma ? "balance-proforma" : (rawDocParam === "proforma" ? "proforma" : "final");
  const sourceFromURL = query.get("source");
  const txnIdFromURL = query.get("txnId");
  const activeTxnId = txnIdFromURL || txn_id;
  // ✅ URL param as initial fallback; real value comes from DB via clientData.bill_type
  const isGSTFromURL = query.get("gst") === "1";
  const navigate = useNavigate();
  const { currentUser, token } = useSelector((state) => state.user);
  const userName = currentUser?.name;
  const dispatch = useDispatch();

  const {
    serviceData,
    additionalServiceData,
    remainingAmountData,
    graphicData,
    adsData,
    complimentaryData,
    selecteddiscount,
    setSelecteddiscount,
    discountDataSet,
    notesData,
    setNotesData,
    predefinedNotes,
    clientData,
    setClientData,
    proformaPayments,
    loading,
    showMetaAd,
    setShowMetaAd,
    showGoogleAd,
    setShowGoogleAd,
    fetchServices,
    fetchClient,
    fetchClientNotes,
    fetchComplimentaryData,
    fetchDiscount,
    fetchDiscountSetting,
    fetchPredefinedNotes,
    fetchAdditionservice,
    fetchRemainingAmount,
    fetchProformaPayments,
    fetchProformaData,
    fetchBalanceProformaData,
    fetchProposalInvoiceData,
  } = useInvoiceData({
    id,
    txn_id,
    activeTxnId,
    token,
    isBalanceProforma,
    docTypeFromURL,
    sourceFromURL,
    txnIdFromURL,
    publicMode,
    publicData,
    onSessionExpired: () => {
      Swal.fire({
        title: "Session Expired",
        text: "Please login again.",
        icon: "warning",
      }).then(() => {
        dispatch(clearUser());
        localStorage.removeItem("token");
        navigate("/");
      });
    },
  });

  // ✅ isGST derived from DB bill_type; falls back to URL param until clientData loads
  const isGST = clientData?.bill_type
    ? clientData.bill_type === "GST"
    : isGSTFromURL;
  const isProforma =
    isBalanceProforma ||
    String(clientData?.document_type || clientData?.invoice_type || docTypeFromURL)
      .toLowerCase() === "proforma";

  const clientName = clientData?.client_name;
  const clientOrganization = clientData?.client_organization;
  const clientAddress = clientData?.address;
  const clientPhone = clientData?.phone;

  const {
    graphicTotal,
    complimentaryTotal,
    additionalTotal,
    remainingTotalAmount,
    grandTotal,
    thumbTotal,
    postTotal,
    ytTotal,
    addTotal,
    dmServiceTotal,
    discountAmount,
    totalAfterDiscount,
    realizedAdBudget,
    realizedGoogleBudget,
    realizedMetaBudget,
    visibleGoogleBudget,
    visibleMetaBudget,
    visibleAdBudget,
    isPartialPayment,
    currentBillGrossReceived,
    amountForServicesIncGst,
    activeTaxableSubtotal,
    pastReceivedAmountForCalc,
    pastAdBudgetForCalc,
    pastServicesIncGst,
    pastActiveTaxableSubtotal,
    projectValueDeferred,
    gstAmount,
    totalgstamount,
    currentTotalAmount,
    invoiceSubtotal,
    invoiceTotal,
    activeInvoiceTotal,
    budgetAwareCurrentTotalAmount,
    totalProformaReceivedAmount,
    totalProformaSettledAmount,
    totalProformaTdsAmount,
    previousAmountForSummary,
    pastReceivedAmount,
    previousInvoiceNo,
    previousInvoiceDate,
    savedReceivedAmountForSummary,
    receivedAmountForSummary,
    receivedAmountForBalance,
    hasReceivedAmount,
    tdsAmountToShow,
    calculatedSummaryBalance,
    summaryCurrentBalance,
    netBankAmount,
    hasPayment,
    totalForWords,
    safeTotal,
    amountInWords,
    previousBalance,
    totalcurrentamount,
    hasSavedOutstandingFromPartial,
    totalDueForReceived,
    formatAmount,
    formatAmountNoDecimals,
    parseAmount,
    getOptionalAmountFromItem,
  } = useInvoiceCalculations({
    serviceData,
    graphicData,
    adsData,
    additionalServiceData,
    remainingAmountData,
    complimentaryData,
    selecteddiscount,
    clientData: clientData || {},
    proformaPayments,
    isGST,
    isProforma,
    showGoogleAd,
    showMetaAd,
    txnIdFromURL,
  });

  const [imagesLoaded, setImagesLoaded] = useState({
    header: false,
    footer: false,
  });
  const [showModalRemaining, setShowModalRemaining] = useState(false);
  const [isEditingRemaining, setIsEditingRemaining] = useState(false);
  const [formDataRemaining, setFormDataRemaining] = useState({
    service_name: "",
    price: "",
  });

  const [formDataNote, setFormDataNote] = useState({
    note_name: "",
    plan: "Customise",
  });
  const [selectedNotesId, setSelectedNotesId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [showModalDiscount, setShowModalDiscount] = useState(false);
  const [formDataDiscount, setFormDataDiscount] = useState({
    discount_type: "amount",
    discount_per: "",
    discount_amt: "",
  });

  const currentBalanceTextClass = "font-extrabold text-lg text-green-800";

  const handleChangeNote = (e) => {
    const { name, value } = e.target;
    setFormDataNote((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleCloseNote = () => {
    setShowModal(false);
    setFormDataNote({
      note_name: "",
      plan: "",
    });
  };

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
    setLoading(true);

    const resetAndClose = () => {
      setShowModalDiscount(false);
      setFormDataDiscount({ discount_type: "amount", discount_per: "", discount_amt: "" });
    };

    try {
      const isAmountType = formDataDiscount.discount_type === "amount";
      const enteredValue = isAmountType
        ? Number(formDataDiscount.discount_amt)
        : Number(formDataDiscount.discount_per);
      // Value validation
      if (!enteredValue || enteredValue < 0) {
        Swal.fire({ icon: "warning", title: "Required!", text: `Please enter a valid discount ${isAmountType ? "amount (₹)" : "percentage (%)"}`, showConfirmButton: false, timer: 1000 });
        setLoading(false);
        return;
      }

      // % max 100 check
      if (!isAmountType && enteredValue > 100) {
        Swal.fire({ icon: "warning", title: "Invalid!", text: "Percentage cannot exceed 100%", showConfirmButton: false, timer: 1000 });
        setLoading(false);
        return;
      }

      // Amount max check - DB limit ya grandTotal
      if (isAmountType) {
        const maxAmt = discountDataSet?.discount_amt
          ? Number(discountDataSet.discount_amt)
          : grandTotal;
        if (enteredValue > maxAmt) {
          Swal.fire({ icon: "warning", title: "Limit Exceeded!", text: `Max discount amount is ₹${maxAmt.toLocaleString()} (set in settings)`, showConfirmButton: false, timer: 2000 });
          setLoading(false);
          return;
        }
      }

      // % max check - DB limit ya 100
      if (!isAmountType) {
        const maxPer = discountDataSet?.discount_per
          ? Number(discountDataSet.discount_per)
          : 100;
        if (enteredValue > maxPer) {
          Swal.fire({ icon: "warning", title: "Limit Exceeded!", text: `Max discount percentage is ${maxPer}% (set in settings)`, showConfirmButton: false, timer: 2000 });
          setLoading(false);
          return;
        }
        // Also check if calculated rupee amount exceeds DB amount limit
        if (discountDataSet?.discount_amt) {
          const calculatedRupee = (grandTotal * enteredValue) / 100;
          const maxAmt = Number(discountDataSet.discount_amt);
          if (calculatedRupee > maxAmt) {
            Swal.fire({ icon: "warning", title: "Limit Exceeded!", text: `This % gives ₹${calculatedRupee.toFixed(0)} discount which exceeds max ₹${maxAmt.toLocaleString()}`, showConfirmButton: false, timer: 2000 });
            setLoading(false);
            return;
          }
        }
      }

      // Payload banao:
      // Amount type â†’ discount_amt = direct rupee value, discount_per = calculated %
      // Percent type â†’ discount_per = entered %, discount_amt = calculated rupee value
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
        fetchDiscount();
        resetAndClose();
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed!",
          text: response.data.message || "Failed to save discount.",
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
      setLoading(false);
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

    setLoading(true);
    try {
      await deleteDiscountById(selecteddiscount.id, token);
      setSelecteddiscount(null);
      setClientData((prev) => (prev ? { ...prev, discount_snapshot: null } : prev));
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
      fetchDiscount();
    } catch (err) {
      console.error("Delete error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          err.response?.data?.message ||
          "Something went wrong while deleting discount.",
        showConfirmButton: false,
        timer: 1500,
      });
    } finally {
      setLoading(false);
    }
  };


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
            text: isEditingRemaining
              ? "Entry updated successfully"
              : "Saved successfully",
            showConfirmButton: false,
            timer: 1000,
            // timerProgressBar: true,
          });
          fetchRemainingAmount();
          setShowModalRemaining(false);
        }
      })
      .catch((err) => {
        console.error("Save error:", err);
      });
  };
  // console.log(graphicData);
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // console.log("Submitting form data:", formDataNote);
      let response;

      if (isEditing && selectedNotesId) {
        response = await updateClientNote(selectedNotesId.id, formDataNote, token);
      } else {
        response = await saveClientNote(formDataNote, token);
      }

      if (response.status === "Success") {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: isEditing
            ? "Note updated successfully!"
            : "Note added successfully!",
          showConfirmButton: false,
          timer: 1000,
          // timerProgressBar: true,
        }).then(() => {
          setShowModal(false);
          fetchClientNotes();
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            response.data.message || "Failed to save Note. Please try again.",
          showConfirmButton: false,
          timer: 1000,
          // timerProgressBar: true,
        });
      }
    } catch (error) {
      console.error("Error saving Note:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Status:", error.response.status);
        Swal.fire({
          icon: "error",
          title: `Error ${error.response.status}`,
          text:
            error.response.data.message ||
            "Failed to save note. Please try again.",
          showConfirmButton: false,
          timer: 1000,
          // timerProgressBar: true,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to save note. Please try again.",
          showConfirmButton: false,
          timer: 1000,
          // timerProgressBar: true,
        });
      }
    } finally {
      setLoading(false);
    }
  };
  const handleAddPredefinedNote = (note) => {
    if (!selectedNotes.find((n) => n.id === note.id)) {
      setSelectedNotes([
        ...selectedNotes,
        { id: note.id, note_name: note.note_text, type: "predefined" },
      ]);
    }
  };

  const handleDeleteClientNote = async (noteId) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this note ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48", // red
      cancelButtonColor: "#6b7280", // gray
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirm.isConfirmed) return;

    try {
      const result = await deleteClientNote(noteId, token);

      if (result.status === "Success") {
        setNotesData((prev) => prev.filter((item) => item.id !== noteId));

        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "note has been deleted.",
          timer: 1000,
          showConfirmButton: false,
        });

        fetchClientNotes();
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while deleting entry.",
        showConfirmButton: false,
        timer: 1000,
        // timerProgressBar: true,
      });
    }
  };
  if (loading) {
    return (
      <div className="text-center p-10 font-semibold text-gray-700">
        Loading...
      </div>
    );
  }




  const handlePrintPage = () => {
    const docName = isBalanceProforma 
      ? "Balance Proforma Invoice" 
      : (isProforma ? "Proforma Invoice" : "Invoice");
    document.title = clientOrganization
      ? `${clientOrganization} ${docName}`
      : `${clientName} ${docName}`;
    window.print();
  };

  const handleDownload = async () => {
    try {
      const invoiceElement = document.getElementById("invoice-content");

      if (!invoiceElement) {
        alert("Invoice element not found!");
        return;
      }

      // 1. Clone element banayein taaki active screen distrub na ho
      const invoiceClone = invoiceElement.cloneNode(true);
      const originalImages = invoiceElement.getElementsByTagName("img");
      const clonedImages = invoiceClone.getElementsByTagName("img");

      // 2. Images ko automatic Base64 data URL me convert karein
      for (let i = 0; i < originalImages.length; i++) {
        const altText = (originalImages[i].getAttribute("alt") || "").toLowerCase();

        if (
          altText.includes("signature") || 
          altText.includes("authorized") ||
          altText.includes("footer") ||
          altText.includes("header")
        ) {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = originalImages[i].naturalWidth || originalImages[i].width;
            canvas.height = originalImages[i].naturalHeight || originalImages[i].height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(originalImages[i], 0, 0);

            // Base64 direct source assign karein cloned image ko
            clonedImages[i].src = canvas.toDataURL("image/png");
          } catch (imgErr) {
            console.error("Image base64 conversion failed, fallback to relative:", imgErr);
          }
        }
      }

      const origin = window.location.origin;
      const fullHtmlCode = `
      <html>
         <head>
          <base href="${origin}/">
          <meta charset="utf-8">
          <title>Invoice Layout</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; background-color: white; }

            .print\\:hidden { display: none !important; }

            @media print {
              @page {
                size: A4;
                margin: 0mm;
              }
              body, html { margin: 0 !important; padding: 0 !important; height: auto !important; overflow: visible !important; }
              
              /* ✅ FIX 1: Remove forced heights that cause spillover to next page */
              .page-wrapper {
                min-height: auto !important;
                height: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                page-break-after: avoid !important;
              }

              /* ✅ FIX 2: Footer div ko wapas fixed position pe rakho */
              .print-fixed-footer {
                position: fixed !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                width: 100% !important;
                height: 25mm !important;
                display: flex !important;
                pointer-events: none !important;
                z-index: 9999 !important;
              }

              .print-fixed-footer img {
                width: 100% !important;
                height: 100% !important;
                object-fit: fill !important;
              }

              table { page-break-inside: auto; }
              tr    { page-break-inside: avoid; page-break-after: auto; }
              thead { display: table-header-group !important; }
              tfoot { display: table-footer-group !important; }
            }
          </style>
        </head>
        <body class="bg-white p-0 m-0">
          ${invoiceClone.outerHTML}
        </body>
      </html>
    `;

      // 4. File configuration filename selection
      const dynamicFileName = clientOrganization
        ? `${clientOrganization.replace(/\s+/g, '_')}_Invoice`
        : `${clientName.replace(/\s+/g, '_')}_Invoice`;

      // Assign dynamic filename to window title so default PDF save name matches
      const originalTitle = document.title;
      document.title = dynamicFileName;

      // Print directly from the frontend since we already generated the full HTML
      const printWindow = window.open('', '_blank');
      printWindow.document.open();
      printWindow.document.write(fullHtmlCode);
      printWindow.document.title = dynamicFileName;
      printWindow.document.close();
      
      printWindow.onload = () => {
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          // Restore original title
          document.title = originalTitle;
        }, 500);
      };

    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please check console logs.");
    }
  };

  const uniquePredefinedNotes = predefinedNotes.filter(
    (p) =>
      !notesData.some((c) => c.note_name === p.note_text) &&
      !selectedNotes.some((s) => s.note_name === p.note_text)
  );
  return (
    <InvoicePrintWrapper>
      <div id="invoice-content" className="page-wrapper w-[210mm] min-h-[297mm] flex flex-col justify-between p-4 mx-auto bg-white print:break-after-page print:p-0 print:m-0 print:h-auto print:block">
        {/* Hidden on print - Action Buttons */}
        <InvoiceActionButtons
          publicMode={publicMode}
          handlePrintPage={handlePrintPage}
          handleDownload={handleDownload}
          basePath={basePath}
        />


        {/* Table for proper header/footer repetition */ }
        <table className="print:table print:border-collapse w-full print:m-0 print:p-0">
          {/* Repeating Header */ }
          <DocumentHeaderBanner isGST={isGST} />

          {/* Main Content */ }
          <tbody className="print:table-row-group">
            <tr>
              <td className="p-0 m-0 align-top">
                <div className="print:block flex flex-col px-6 py-1 print:px-4 print:py-4 print:pt-6 pt-4">

                  <div className="w-full">
                    <InvoiceCustomerInfoCard
                      clientData={clientData}
                      isProforma={isProforma}
                      isBalanceProforma={isBalanceProforma}
                      isGST={isGST}
                    />

                    {/* Combined Services Table */}
                    <InvoiceServicesTable
                      graphicData={graphicData}
                      complimentaryData={complimentaryData}
                      additionalServiceData={additionalServiceData}
                      adsData={adsData}
                      dmServiceTotal={dmServiceTotal}
                      formatAmountNoDecimals={formatAmountNoDecimals}
                    />



                    {/* Complimentary Services Table */}
                    <InvoiceComplimentaryTable
                      complimentaryData={complimentaryData}
                      formatAmount={formatAmount}
                    />


                    {/* Totals Summary & Discount Section */}
                    <InvoiceDiscountSection
                      graphicData={graphicData}
                      additionalServiceData={additionalServiceData}
                      adsData={adsData}
                      complimentaryData={complimentaryData}
                      selecteddiscount={selecteddiscount}
                      discountAmount={discountAmount}
                      invoiceSubtotal={invoiceSubtotal}
                      clientData={clientData}
                      publicMode={publicMode}
                      isProforma={isProforma}
                      handleShowDiscount={handleShowDiscount}
                      formatAmountNoDecimals={formatAmountNoDecimals}
                    />



                  </div>
                </div>


                {/* Terms & Conditions + Bank Details Section */ }


                {/* Terms & Conditions + Bank Details Section */ }
                <section className={ `terms-bank-section print:block px-6 py-1 text-sm text-gray-800 border-t mt-1` }>
                  <div className="bank-details-section flex w-full border border-gray-300 rounded-md mt-1 overflow-hidden">
                      <DocumentBankDetails isGST={isGST} />

                    {/* RIGHT SIDE: Table-like financial breakdown layout */}
                    <InvoiceSummaryRightSide
                      isPartialPayment={isPartialPayment}
                      currentBillGrossReceived={currentBillGrossReceived}
                      totalAfterDiscount={totalAfterDiscount}
                      pastActiveTaxableSubtotal={pastActiveTaxableSubtotal}
                      projectValueDeferred={projectValueDeferred}
                      activeTaxableSubtotal={activeTaxableSubtotal}
                      isGST={isGST}
                      gstAmount={gstAmount}
                      invoiceSubtotal={invoiceSubtotal}
                      activeInvoiceTotal={activeInvoiceTotal}
                      hasReceivedAmount={hasReceivedAmount}
                      receivedAmountForSummary={receivedAmountForSummary}
                      clientData={clientData}
                      isProforma={isProforma}
                      visibleAdBudget={visibleAdBudget}
                      visibleGoogleBudget={visibleGoogleBudget}
                      visibleMetaBudget={visibleMetaBudget}
                      hasPayment={hasPayment}
                      tdsAmountToShow={tdsAmountToShow}
                      isBalanceProforma={isBalanceProforma}
                      formatAmount={formatAmount}
                      formatAmountNoDecimals={formatAmountNoDecimals}
                    />
              </div>

                  {/* Total in words right-aligned below */}
                  <InvoiceAmountInWords amountInWords={amountInWords} />

                  {/* Payment History */}
                  <InvoicePaymentHistoryTable
                    isProforma={isProforma}
                    isBalanceProforma={isBalanceProforma}
                    proformaPayments={proformaPayments}
                    id={id}
                    txn_id={txn_id}
                    parseAmount={parseAmount}
                    formatAmount={formatAmount}
                  />

                  {/* Terms & Conditions */}
                  <InvoiceTermsConditions
                    notesData={notesData}
                    visibleAdBudget={visibleAdBudget}
                    tdsAmountToShow={tdsAmountToShow}
                    previousAmountForSummary={previousAmountForSummary}
                    projectValueDeferred={projectValueDeferred}
                    adsData={adsData}
                    activeTaxableSubtotal={activeTaxableSubtotal}
                    pastReceivedAmount={pastReceivedAmount}
                    previousInvoiceNo={previousInvoiceNo}
                    previousInvoiceDate={previousInvoiceDate}
                    clientData={clientData}
                    publicMode={publicMode}
                    onEditNote={(note) => {
                      setSelectedNotesId(note);
                      setFormDataNote({
                        note_name: note.note_name,
                        plan: note.plan,
                      });
                      setIsEditing(true);
                      setShowModal(true);
                    }}
                    onDeleteNote={handleDeleteClientNote}
                  />

                </section>




                <div className="border-t mt-0"></div>

              </td>
            </tr>
          </tbody>

          <tfoot className="print:table-footer-group">
            <tr>
              <td className="p-0 m-0">
                <div className="h-[25mm] w-full"></div>
              </td>
            </tr>
          </tfoot>
        </table>

        <div className="hidden print:flex print-fixed-footer">
          <img
            src={ img2 }
            alt="Footer"
            className="h-full w-full object-fill"
          />
        </div>


        <InvoiceNoteModal
          show={showModal}
          onClose={handleCloseNote}
          onSubmit={handleSubmit}
          formDataNote={formDataNote}
          onChangeNote={handleChangeNote}
          isEditing={isEditing}
          loading={loading}
        />
        <RemainingPaymentModal
          show={showModalRemaining}
          onClose={() => { setShowModalRemaining(false); setFormDataRemaining({ service_name: "", price: "" }); }}
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
      </div>
    </InvoicePrintWrapper>
  );
}
