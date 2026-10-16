import React from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Swal from "sweetalert2";
import { clearUser } from "../../../redux/user/userSlice";
import img2 from "../../../assets/Dg 2copy.png";

// Layer 1 (Shared)
import DocumentHeaderBanner from "../../../shared/document/DocumentHeaderBanner";
import DocumentBankDetails from "../../../shared/document/DocumentBankDetails";
import InvoicePrintWrapper from "../../../shared/invoice/InvoicePrintWrapper";

// Layer 2 (Business Logic & State Hooks)
import {
  useInvoiceData,
  useInvoiceCalculations,
  useInvoiceModals,
  useInvoicePrint,
} from "../hooks";

// Layer 3 (Presentational Components)
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
} from "../components";

// Layer 4 (Page Container) — Modular 4-Layer Architecture
export default function InvoicePage({
  publicMode = false,
  publicData = null,
  publicToken = null,
}) {
  const { id, txn_id } = useParams();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const basePath = isAdmin ? "/admin" : "/BD";
  const query = new URLSearchParams(location.search);
  const rawDocParam = query.get("doc");
  const isBalanceProforma =
    rawDocParam === "balance-proforma-view" || rawDocParam === "balance-proforma";
  const docTypeFromURL = isBalanceProforma
    ? "balance-proforma"
    : rawDocParam === "proforma"
    ? "proforma"
    : "final";
  const sourceFromURL = query.get("source");
  const txnIdFromURL = query.get("txnId");
  const activeTxnId = txnIdFromURL || txn_id;
  const isGSTFromURL = query.get("gst") === "1";

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser, token: userToken } = useSelector((state) => state.user);
  const token = publicMode ? publicToken : userToken;
  const userName = currentUser?.name;

  const onSessionExpired = () => {
    Swal.fire({
      icon: "error",
      title: "Session Expired",
      text: "Your session has expired. Please log in again.",
    }).then(() => {
      dispatch(clearUser());
      navigate("/login");
    });
  };

  // Layer 2: Data fetching & lifecycle hook
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
    clientData,
    setClientData,
    proformaPayments,
    loading,
    showMetaAd,
    showGoogleAd,
    fetchDiscount,
    fetchRemainingAmount,
    fetchClientNotes,
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
    onSessionExpired,
  });

  // Derived flags
  const isGST = clientData?.bill_type
    ? clientData.bill_type === "GST"
    : isGSTFromURL;
  const isProforma =
    isBalanceProforma ||
    String(clientData?.document_type || clientData?.invoice_type || docTypeFromURL)
      .toLowerCase() === "proforma";

  // Layer 2: Financial calculations hook
  const {
    graphicTotal,
    additionalTotal,
    grandTotal,
    totalAfterDiscount,
    discountAmount,
    adjustmentAmount,
    previousBalanceAmount,
    totalAfterAdjustment,
    invoiceSubtotal,
    gstAmount,
    dmServiceTotal,
    isPartialPayment,
    currentBillGrossReceived,
    activeTaxableSubtotal,
    pastActiveTaxableSubtotal,
    projectValueDeferred,
    activeInvoiceTotal,
    visibleAdBudget,
    visibleGoogleBudget,
    visibleMetaBudget,
    hasReceivedAmount,
    receivedAmountForSummary,
    hasPayment,
    tdsAmountToShow,
    amountInWords,
    previousInvoiceNo,
    previousInvoiceDate,
    pastReceivedAmount,
    previousAmountForSummary,
    formatAmount,
    formatAmountNoDecimals,
    parseAmount,
  } = useInvoiceCalculations({
    serviceData,
    graphicData,
    adsData,
    additionalServiceData,
    remainingAmountData,
    complimentaryData,
    selecteddiscount,
    selectedAdjustment: null,
    clientData,
    proformaPayments,
    isGST,
    isProforma,
    isBalanceProforma,
    showGoogleAd,
    showMetaAd,
    txnIdFromURL,
  });

  // Layer 2: Modals hook
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
    isEditingNote,
    formDataNote,
    handleChangeNote,
    handleCloseNote,
    handleOpenEditNote,
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

  // Layer 2: Print & download hook
  const { handlePrintPage, handleDownload } = useInvoicePrint({
    clientData,
    isProforma,
    isBalanceProforma,
    contentId: "invoice-content",
  });

  // Proposal history navigation if applicable
  const handleProposalHistory =
    clientData?.proposal_id || (sourceFromURL === "proposal" && id)
      ? () => navigate(`${basePath}/proposal-history/${clientData?.proposal_id || id}`)
      : null;

  if (loading) {
    return (
      <div className="text-center p-10 font-semibold text-gray-700">
        Loading Invoice...
      </div>
    );
  }

  return (
    <InvoicePrintWrapper>
      <div
        id="invoice-content"
        className="page-wrapper w-[210mm] min-h-[297mm] flex flex-col justify-between p-4 mx-auto bg-white print:break-after-page print:p-0 print:m-0 print:h-auto print:block"
      >
        {/* Layer 3 — Action Buttons */}
        <InvoiceActionButtons
          publicMode={publicMode}
          handlePrintPage={handlePrintPage}
          handleDownload={handleDownload}
          basePath={basePath}
          onProposalHistory={handleProposalHistory}
        />

        {/* Table for proper header/footer repetition on print */}
        <table className="print:table print:border-collapse w-full print:m-0 print:p-0">
          {/* Repeating Header */}
          <DocumentHeaderBanner isGST={isGST} />

          {/* Main Content */}
          <tbody className="print:table-row-group">
            <tr>
              <td className="p-0 m-0 align-top">
                <div className="flex flex-col justify-between h-full px-6 py-1 print:px-4 print:block print:h-auto">
                  <div className="w-full">
                    {/* Layer 3 — Client Info Card */}
                    <InvoiceCustomerInfoCard
                      clientData={clientData}
                      isProforma={isProforma}
                      isBalanceProforma={isBalanceProforma}
                      isGST={isGST}
                    />

                    {/* Layer 3 — Services Table */}
                    <InvoiceServicesTable
                      graphicData={graphicData}
                      complimentaryData={complimentaryData}
                      additionalServiceData={additionalServiceData}
                      adsData={adsData}
                      dmServiceTotal={dmServiceTotal}
                      formatAmountNoDecimals={formatAmountNoDecimals}
                    />

                    {/* Layer 3 — Complimentary Services Table */}
                    <InvoiceComplimentaryTable
                      complimentaryData={complimentaryData}
                      formatAmount={formatAmount}
                    />

                    {/* Layer 3 — Discount Section */}
                    <InvoiceDiscountSection
                      graphicData={graphicData}
                      additionalServiceData={additionalServiceData}
                      adsData={adsData}
                      complimentaryData={complimentaryData}
                      selecteddiscount={selecteddiscount}
                      discountAmount={discountAmount}
                      selectedAdjustment={null}
                      adjustmentAmount={adjustmentAmount}
                      previousBalanceAmount={previousBalanceAmount}
                      invoiceSubtotal={invoiceSubtotal}
                      clientData={clientData}
                      publicMode={publicMode}
                      isProforma={isProforma}
                      handleShowDiscount={handleShowDiscount}
                      formatAmountNoDecimals={formatAmountNoDecimals}
                    />
                  </div>

                  {/* Bank Details + Financial Summary */}
                  <section className="terms-bank-section print:block px-6 py-1 text-sm text-gray-800 border-t mt-1 print:px-0 print:py-1 print:mt-1">
                    <div className="bank-details-section flex w-full border border-gray-300 rounded-md mt-1 overflow-hidden">
                      {/* Left: Bank Details */}
                      <DocumentBankDetails isGST={isGST} variant="invoice" />

                      {/* Right: Summary */}
                      <InvoiceSummaryRightSide
                        isPartialPayment={isPartialPayment}
                        currentBillGrossReceived={currentBillGrossReceived}
                        totalAfterDiscount={totalAfterDiscount}
                        totalAfterAdjustment={totalAfterAdjustment}
                        adjustmentAmount={adjustmentAmount}
                        previousBalanceAmount={previousBalanceAmount}
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
                  </section>

                  {/* Amount in words */}
                  <InvoiceAmountInWords amountInWords={amountInWords} />

                  {/* Payment History Table (for Proforma with partial payments) */}
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
                    onEditNote={handleOpenEditNote}
                    onDeleteNote={handleDeleteClientNote}
                  />
                </div>
              </td>
            </tr>
          </tbody>

          {/* Repeating Footer */}
          <tfoot className="print:table-footer-group">
            <tr>
              <td className="p-0 m-0">
                <div className="h-[25mm] w-full" />
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Print Fixed Footer */}
        <div className="hidden print:flex print-fixed-footer">
          <img
            src={img2}
            alt="Footer"
            className="h-full w-full object-fill"
          />
        </div>

        {/* Layer 3 — Modals Container */}
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
