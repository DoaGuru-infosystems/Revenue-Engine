import React from "react";
import InvoicePrintWrapper from "../../../shared/invoice/InvoicePrintWrapper";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";

import {
  useInvoiceData,
  useInvoiceCalculations,
  useInvoiceModals,
  useInvoicePrint,
} from "../hooks";
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
import Swal from "sweetalert2";
import { clearUser } from "../../auth/auth.slice";
import img2 from "../../../assets/Dg 2copy.png";
import DocumentHeaderBanner from "../../../shared/document/DocumentHeaderBanner";
import DocumentBankDetails from "../../../shared/document/DocumentBankDetails";

export default function QuotationPage() {
  const { id, txn_id } = useParams();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const basePath = isAdmin ? "/admin" : "/BD";
  const servicesPath = isAdmin ? "ServicesLanding" : "AddService";
  const query = new URLSearchParams(location.search);
  const isGSTFromURL = query.get("gst") === "1";
  const rawDocParam = query.get("doc");
  const isProforma = rawDocParam === "proforma";
  const isQuotation = !isProforma;
  const docTypeFromURL = isProforma ? "proforma" : "quotation";
  const sourceFromURL = query.get("source");
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
    activeTxnId: txn_id,
    token,
    isBalanceProforma: false,
    docTypeFromURL,
    sourceFromURL,
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

  const isGST = clientData?.bill_type
    ? clientData.bill_type === "GST"
    : isGSTFromURL;

  const {
    grandTotal,
    dmServiceTotal,
    discountAmount,
    totalAfterDiscount,
    visibleGoogleBudget,
    visibleMetaBudget,
    visibleAdBudget,
    isPartialPayment,
    currentBillGrossReceived,
    activeTaxableSubtotal,
    pastActiveTaxableSubtotal,
    projectValueDeferred,
    gstAmount,
    invoiceSubtotal,
    activeInvoiceTotal,
    previousAmountForSummary,
    pastReceivedAmount,
    previousInvoiceNo,
    previousInvoiceDate,
    receivedAmountForSummary,
    hasReceivedAmount,
    tdsAmountToShow,
    hasPayment,
    amountInWords,
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
    clientData: clientData || {},
    proformaPayments,
    isGST,
    isProforma,
    showGoogleAd,
    showMetaAd,
    txnIdFromURL: null,
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
    isBalanceProforma: false,
    contentId: "quotation-content",
  });

  if (loading) {
    return (
      <div className="text-center p-10 font-semibold text-gray-700">
        Loading {isProforma ? "Proforma Invoice" : "Quotation"}...
      </div>
    );
  }

  const handleProposalHistory = () => {
    navigate(`${basePath}/client/service/history/${id}`);
  };

  const handleEdit = () => {
    if (isProforma) {
      navigate(`${basePath}/${servicesPath}/${id}/${txn_id}?doc=proforma`);
    } else {
      navigate(`${basePath}/${servicesPath}/${id}/${txn_id}`);
    }
  };

  return (
    <InvoicePrintWrapper>
      <div
        id="quotation-content"
        className="page-wrapper w-[210mm] min-h-[297mm] flex flex-col justify-between p-4 mx-auto bg-white print:break-after-page print:p-0 print:m-0 print:h-auto print:block"
      >
        <InvoiceActionButtons
          handlePrintPage={handlePrintPage}
          handleDownload={handleDownload}
          basePath={basePath}
          onProposalHistory={handleProposalHistory}
          onEdit={clientData?.tag_received_amt !== "received" ? handleEdit : undefined}
        />

        <table className="print:table print:border-collapse w-full print:m-0 print:p-0">
          <DocumentHeaderBanner isGST={isGST} />

          <tbody className="print:table-row-group">
            <tr>
              <td className="p-0 m-0 align-top">
                <div className="print:block flex flex-col px-6 py-1 print:px-4 print:py-4 print:pt-6 pt-4">
                  <div className="w-full">
                    <InvoiceCustomerInfoCard
                      clientData={clientData}
                      isProforma={isProforma}
                      isBalanceProforma={false}
                      isQuotation={isQuotation}
                      isGST={isGST}
                    />

                    <InvoiceServicesTable
                      graphicData={graphicData}
                      complimentaryData={complimentaryData}
                      additionalServiceData={additionalServiceData}
                      adsData={adsData}
                      dmServiceTotal={dmServiceTotal}
                      formatAmountNoDecimals={formatAmountNoDecimals}
                    />

                    <InvoiceComplimentaryTable
                      complimentaryData={complimentaryData}
                      formatAmount={formatAmount}
                    />

                    <InvoiceDiscountSection
                      graphicData={graphicData}
                      additionalServiceData={additionalServiceData}
                      adsData={adsData}
                      complimentaryData={complimentaryData}
                      selecteddiscount={selecteddiscount}
                      discountAmount={discountAmount}
                      invoiceSubtotal={invoiceSubtotal}
                      clientData={clientData}
                      isProforma={isProforma}
                      handleShowDiscount={handleShowDiscount}
                      formatAmountNoDecimals={formatAmountNoDecimals}
                    />
                  </div>
                </div>

                <section className="terms-bank-section print:block px-6 py-1 text-sm text-gray-800 border-t mt-1">
                  <div className="bank-details-section flex w-full border border-gray-300 rounded-md mt-1 overflow-hidden">
                    <DocumentBankDetails isGST={isGST} />

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
                      isBalanceProforma={false}
                      formatAmount={formatAmount}
                      formatAmountNoDecimals={formatAmountNoDecimals}
                    />
                  </div>

                  <InvoiceAmountInWords amountInWords={amountInWords} />

                  <InvoicePaymentHistoryTable
                    isProforma={isProforma}
                    isBalanceProforma={false}
                    proformaPayments={proformaPayments}
                    id={id}
                    txn_id={txn_id}
                    parseAmount={parseAmount}
                    formatAmount={formatAmount}
                  />

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
          <img src={img2} alt="Footer" className="h-full w-full object-fill" />
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
