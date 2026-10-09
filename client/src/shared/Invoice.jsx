import React from "react";
import InvoicePrintWrapper from "./invoice/InvoicePrintWrapper";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";

import {
  useInvoiceData,
  useInvoiceCalculations,
  useInvoiceModals,
  useInvoicePrint,
} from "../features/invoices/hooks";
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
  InvoiceModalsContainer,
} from "../features/invoices/components";
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

  const {
    modalLoading,
    showModalDiscount,
    formDataDiscount,
    handleShowDiscount,
    handleCloseDiscount,
    handleChangeDiscount,
    handleSaveDiscount,
    handleDeleteDiscount,

    showModalRemaining,
    setShowModalRemaining,
    isEditingRemaining,
    formDataRemaining,
    setFormDataRemaining,
    handleChangeRemaining,
    handleRemainingSave,

    showModalNote,
    setShowModalNote,
    isEditingNote,
    setIsEditingNote,
    setSelectedNotesId,
    formDataNote,
    setFormDataNote,
    handleChangeNote,
    handleCloseNote,
    handleSubmitNote,
    handleDeleteClientNote,
  } = useInvoiceModals({
    id,
    txn_id,
    token,
    userName,
    grandTotal,
    discountDataSet,
    selecteddiscount,
    setSelecteddiscount,
    setClientData,
    setNotesData,
    fetchDiscount,
    fetchRemainingAmount,
    fetchClientNotes,
  });

  const { handlePrintPage, handleDownload } = useInvoicePrint({
    clientData,
    isProforma,
    isBalanceProforma,
    contentId: "invoice-content",
  });

  if (loading) {
    return (
      <div className="text-center p-10 font-semibold text-gray-700">
        Loading...
      </div>
    );
  }


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
                      setIsEditingNote(true);
                      setShowModalNote(true);
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


        <InvoiceModalsContainer
          showModalNote={showModalNote}
          handleCloseNote={handleCloseNote}
          handleSubmitNote={handleSubmitNote}
          formDataNote={formDataNote}
          handleChangeNote={handleChangeNote}
          isEditingNote={isEditingNote}
          showModalRemaining={showModalRemaining}
          setShowModalRemaining={setShowModalRemaining}
          handleRemainingSave={handleRemainingSave}
          formDataRemaining={formDataRemaining}
          setFormDataRemaining={setFormDataRemaining}
          handleChangeRemaining={handleChangeRemaining}
          isEditingRemaining={isEditingRemaining}
          showModalDiscount={showModalDiscount}
          handleCloseDiscount={handleCloseDiscount}
          handleSaveDiscount={handleSaveDiscount}
          formDataDiscount={formDataDiscount}
          handleChangeDiscount={handleChangeDiscount}
          handleDeleteDiscount={handleDeleteDiscount}
          selecteddiscount={selecteddiscount}
          discountDataSet={discountDataSet}
          grandTotal={grandTotal}
          loading={loading || modalLoading}
        />
      </div>
    </InvoicePrintWrapper>
  );
}
