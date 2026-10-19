import React from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import img2 from "../../../assets/Dg 2copy.png";

// Layer 1 (Shared)
import DocumentHeaderBanner from "../../../shared/document/DocumentHeaderBanner";
import DocumentBankDetails from "../../../shared/document/DocumentBankDetails";
import InvoicePrintWrapper from "../../../shared/invoice/InvoicePrintWrapper";
import InvoiceDiscountModal from "../../../shared/invoice/InvoiceDiscountModal";
import InvoiceAdjustmentModal from "../../../shared/invoice/InvoiceAdjustmentModal";

// Layer 2 (Business Logic Hook)
import { useQuotationData } from "../hooks/useQuotationData";

// Layer 3 (Presentational Components)
import {
  InvoiceActionButtons,
  QuotationCustomerInfoCard,
  QuotationServicesTable,
  QuotationComplimentaryTable,
  QuotationDiscountBar,
  QuotationSummaryRightSide,
  QuotationNotesDropdown,
  QuotationNotesSection,
  QuotationNoteModal,
} from "../components";
import { useForceDark } from "../../../context/ThemeContext";

// Layer 4 (Page Container) — ~245 lines
export default function BalanceProformaPage() {
  useForceDark();
  const { id, txn_id } = useParams();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const basePath = isAdmin ? "/admin" : "/BD";
  const servicesPath = isAdmin ? "ServicesLanding" : "AddService";
  const query = new URLSearchParams(location.search);
  const isGST = query.get("gst") === "1";
  const rawDocParam = query.get("doc");
  const isBalanceProforma = true;
  const docTypeFromURL = rawDocParam === "proforma" ? "proforma" : "balance-proforma";
  const sourceFromURL = query.get("source");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.user);

  const {
    loading,
    clientData,
    clientDataReceived,
    proformaMeta,
    graphicData,
    adsData,
    complimentaryData,
    notesData,
    predefinedNotes,
    selectedNotes,
    manualNote,
    setManualNote,
    showMetaAd,
    setShowMetaAd,
    showGoogleAd,
    setShowGoogleAd,
    selecteddiscount,
    discountAmount,
    discountDataSet,
    formDataDiscount,
    showModalDiscount,
    selectedAdjustment,
    adjustmentAmount,
    previousBalanceAmount,
    formDataAdjustment,
    showModalAdjustment,
    dmTotalAfterDiscount,
    graphicTotal,
    grandTotal,
    displayedTaxable,
    displayedCgst,
    displayedSgst,
    displayedSubtotal,
    displayedGrandTotal,
    displayedReceived,
    displayedCurrentBalance,
    // Note modal
    showModalNote,
    isEditingNote,
    formDataNote,
    handleCloseNoteModal,
    handleChangeNoteModal,
    handleSubmitNoteModal,
    handleOpenEditNoteModal,
    // Predefined notes
    handleSelectPredefinedNote,
    handleAddManualNote,
    handleRemoveNote,
    handleSaveNotes,
    handleDeleteClientNote,
    // Discount handlers
    handleShowDiscount,
    handleCloseDiscount,
    handleChangeDiscount,
    handleSaveDiscount,
    handleDeleteDiscount,
    // Adjustment handlers
    handleShowAdjustment,
    handleCloseAdjustment,
    handleChangeAdjustment,
    handleSaveAdjustment,
    handleDeleteAdjustment,
    // Actions
    handlePrintPage,
    handleProposalHistory,
    handleEdit,
  } = useQuotationData({
    id,
    txn_id,
    isBalanceProforma,
    docTypeFromURL,
    sourceFromURL,
    isGST,
    basePath,
    servicesPath,
    token,
    dispatch,
    navigate,
  });

  if (loading) {
    return (
      <div className="text-center p-10 font-semibold text-gray-700">
        Loading Balance Proforma Invoice...
      </div>
    );
  }

  return (
    <InvoicePrintWrapper>
      <div className="page-wrapper w-[210mm] min-h-[297mm] flex flex-col justify-between p-4 mx-auto bg-white print:p-0 print:m-0">
        {/* Layer 3 — Action Buttons */}
        <InvoiceActionButtons
          handlePrintPage={handlePrintPage}
          onProposalHistory={handleProposalHistory}
          basePath={basePath}
        />

        {/* Table for proper header/footer repetition on print */}
        <table className="print:table print:border-collapse w-full">

          {/* Repeating Header */}
          <DocumentHeaderBanner isGST={isGST} />

          {/* Main Content */}
          <tbody className="print:table-row-group">
            <tr>
              <td className="p-0 m-0 align-top">
                <div className="flex flex-col justify-between h-full px-6 py-1 print:px-4 print:block print:h-auto">
                  <div className="flex-grow print:block">

                    {/* Layer 3 — Client Info Card (handles "BALANCE PROFORMA INVOICE" banner & client grid) */}
                    <QuotationCustomerInfoCard
                      clientData={clientData}
                      isBalanceProforma={isBalanceProforma}
                      docTypeFromURL={docTypeFromURL}
                      sourceFromURL={sourceFromURL}
                      proformaMeta={proformaMeta}
                      txn_id={txn_id}
                    />

                    {/* Layer 3 — Graphic & Services Table */}
                    <QuotationServicesTable
                      graphicData={graphicData}
                      graphicTotal={graphicTotal}
                    />

                    {/* Layer 3 — Complimentary Services Table */}
                    <QuotationComplimentaryTable
                      complimentaryData={complimentaryData}
                    />

                    {/* Layer 3 — Discount/Adjustment Bar + Ads Toggles */}
                    <QuotationDiscountBar
                      isBalanceProforma={isBalanceProforma}
                      clientDataReceived={clientDataReceived}
                      docTypeFromURL={docTypeFromURL}
                      proformaMeta={proformaMeta}
                      selecteddiscount={selecteddiscount}
                      selectedAdjustment={selectedAdjustment}
                      adjustmentAmount={adjustmentAmount}
                      adsData={adsData}
                      showMetaAd={showMetaAd}
                      setShowMetaAd={setShowMetaAd}
                      showGoogleAd={showGoogleAd}
                      setShowGoogleAd={setShowGoogleAd}
                      handleShowDiscount={handleShowDiscount}
                      handleShowAdjustment={handleShowAdjustment}
                    />

                    {/* Bank Details + Financial Summary */}
                    <section className="terms-bank-section print:block px-6 py-2 text-sm text-gray-800 border-t mt-2 print:px-0 print:py-1 print:mt-1">
                      <div className="bank-details-section flex justify-between w-full mb-2 print:mb-0">

                        {/* LEFT — Bank Details */}
                        <DocumentBankDetails isGST={isGST} variant="quotation" />

                        {/* RIGHT — Totals (Received + Balance shown when isBalanceProforma=true) */}
                        <QuotationSummaryRightSide
                          graphicTotal={graphicTotal}
                          selecteddiscount={selecteddiscount}
                          discountAmount={discountAmount}
                          adjustmentAmount={adjustmentAmount}
                          previousBalanceAmount={previousBalanceAmount}
                          displayedTaxable={displayedTaxable}
                          isGST={isGST}
                          displayedCgst={displayedCgst}
                          displayedSgst={displayedSgst}
                          displayedSubtotal={displayedSubtotal}
                          adsData={adsData}
                          showMetaAd={showMetaAd}
                          showGoogleAd={showGoogleAd}
                          displayedGrandTotal={displayedGrandTotal}
                          isBalanceProforma={isBalanceProforma}
                          displayedReceived={displayedReceived}
                          displayedCurrentBalance={displayedCurrentBalance}
                          docTypeFromURL={docTypeFromURL}
                        />
                      </div>
                    </section>

                    {/* Layer 3 — Notes Dropdown (add/select/save notes) */}
                    <QuotationNotesDropdown
                      docTypeFromURL={docTypeFromURL}
                      isBalanceProforma={isBalanceProforma}
                      predefinedNotes={predefinedNotes}
                      notesData={notesData}
                      selectedNotes={selectedNotes}
                      manualNote={manualNote}
                      setManualNote={setManualNote}
                      handleSelect={handleSelectPredefinedNote}
                      handleAddManualNote={handleAddManualNote}
                      handleRemoveNote={handleRemoveNote}
                      handleSaveNotes={handleSaveNotes}
                    />

                    {/* Layer 3 — Notes Display Section (edit/delete per note) */}
                    <QuotationNotesSection
                      notesData={notesData}
                      isProforma={docTypeFromURL === "proforma" || isBalanceProforma}
                      clientData={clientDataReceived}
                      onEditNote={handleOpenEditNoteModal}
                      onDeleteNote={handleDeleteClientNote}
                    />

                  </div>
                </div>
              </td>
            </tr>
          </tbody>

          <tfoot className="print:table-footer-group">
            <tr>
              <td className="p-0 m-0">
                <div className="h-[20mm] w-full"></div>
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Print Footer Image */}
        <div className="hidden print:flex print-fixed-footer">
          <img src={img2} alt="Footer" className="h-full w-full object-fill" />
        </div>

        {/* Note Edit Modal */}
        <QuotationNoteModal
          show={showModalNote}
          isEditing={isEditingNote}
          formData={formDataNote}
          handleChange={handleChangeNoteModal}
          handleSubmit={handleSubmitNoteModal}
          handleClose={handleCloseNoteModal}
          loading={loading}
        />

        {/* Discount Modal */}
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

        {/* Adjustment Modal */}
        <InvoiceAdjustmentModal
          show={showModalAdjustment}
          onClose={handleCloseAdjustment}
          onSubmit={handleSaveAdjustment}
          formDataAdjustment={formDataAdjustment}
          onChangeAdjustment={handleChangeAdjustment}
          onDeleteAdjustment={handleDeleteAdjustment}
          selectedAdjustment={selectedAdjustment}
          maxAdjustment={dmTotalAfterDiscount}
          loading={loading}
        />

      </div>
    </InvoicePrintWrapper>
  );
}
