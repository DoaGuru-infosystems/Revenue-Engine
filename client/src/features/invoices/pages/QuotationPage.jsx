import React, { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import img2 from "../../../assets/Dg 2copy.png";

// Layer 1/Shared
import DocumentHeaderBanner from "../../../shared/document/DocumentHeaderBanner";
import DocumentBankDetails from "../../../shared/document/DocumentBankDetails";
import InvoicePrintWrapper from "../../../shared/invoice/InvoicePrintWrapper";
import InvoiceDiscountModal from "../../../shared/invoice/InvoiceDiscountModal";
import InvoiceAdjustmentModal from "../../../shared/invoice/InvoiceAdjustmentModal";
import ProposalDiscountModal from "../../proposals/components/ProposalDiscountModal";

// Layer 2: Hook
import { useQuotationData } from "../hooks/useQuotationData";

// Layer 3: Presentational Components
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

export default function QuotationPage() {
  useForceDark();
  const { id, txn_id } = useParams();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const basePath = isAdmin ? "/admin" : "/BD";
  const servicesPath = isAdmin ? "ServicesLanding" : "AddService";
  const query = new URLSearchParams(location.search);
  const isGST = query.get("gst") === "1";
  const rawDocParam = query.get("doc");
  const isBalanceProforma = false;
  const docTypeFromURL = rawDocParam === "proforma" ? "proforma" : "quotation";
  const sourceFromURL = query.get("source");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.user);

  const {
    loading,
    quotationLines,
    adBudgetLines,
    quotationNumber,
    quotationDiscount,
    quotationMeta,
    handleSaveQuotationDiscount,
    handleDeleteQuotationDiscount,
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
    formDataAdjustment,
    showModalAdjustment,
    dmTotalAfterDiscount,
    previousBalanceAmount,
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

  const [showProposalDiscountModal, setShowProposalDiscountModal] = useState(false);
  const [proposalDiscountForm, setProposalDiscountForm] = useState({
    discount_type: "amount",
    discount_amt: "",
    discount_per: "",
  });

  if (loading) {
    return (
      <div className="text-center p-10 font-semibold text-gray-700">
        Loading {docTypeFromURL === "proforma" ? "Proforma Invoice" : "Quotation"}...
      </div>
    );
  }

  const isPlainQuotation = Array.isArray(quotationLines);
  const quotationServicesSubtotal = (quotationLines || []).reduce(
    (sum, line) => sum + Number(line.amount || 0),
    0
  );
  const quotationAdsBudgetTotal = (adBudgetLines || []).reduce(
    (sum, ad) => sum + Number(ad.budget || ad.amount || 0),
    0
  );

  let discountAmt = 0;
  let discountLabel = "";
  if (quotationDiscount) {
    const isPercent =
      quotationDiscount.type === "Percentage" ||
      quotationDiscount.discount_type === "percent";
    const val = Number(
      quotationDiscount.value ||
      (isPercent ? quotationDiscount.discount_per : quotationDiscount.discount_amt) ||
      0
    );
    if (val > 0) {
      discountAmt = isPercent ? (quotationServicesSubtotal * val) / 100 : val;
      discountLabel = isPercent ? `(${val}%)` : `(₹${Number(val).toLocaleString("en-IN")})`;
    }
  }

  const servicesAfterDiscount = Math.max(0, quotationServicesSubtotal - discountAmt);
  const finalQuotationTotal = servicesAfterDiscount + quotationAdsBudgetTotal;
  const formatInr = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  const isQuotationDoc = docTypeFromURL === "quotation" || isPlainQuotation;
  const isQuotationFrozen =
    isQuotationDoc &&
    Boolean(
      quotationMeta?.proforma_id ||
        Number(quotationMeta?.proforma_count) > 0 ||
        [
          "proforma_generated",
          "proforma_sent",
          "payment_awaited",
          "payment_received",
          "partially_paid",
          "paid",
          "invoiced",
        ].includes(String(quotationMeta?.status || "").toLowerCase())
    );
  const isReceived = clientDataReceived?.tag_received_amt === "received";
  const hasInvoice = docTypeFromURL === "proforma" && proformaMeta?.has_invoice;
  const canEdit = !isReceived && !hasInvoice && !isQuotationFrozen;

  const openProposalDiscountModal = () => {
    if (quotationDiscount) {
      const isPercent =
        quotationDiscount.type === "Percentage" ||
        quotationDiscount.discount_type === "percent";
      setProposalDiscountForm({
        discount_type: isPercent ? "percent" : "amount",
        discount_amt: isPercent ? "" : (quotationDiscount.value || quotationDiscount.discount_amt || ""),
        discount_per: isPercent ? (quotationDiscount.value || quotationDiscount.discount_per || "") : "",
      });
    } else {
      setProposalDiscountForm({
        discount_type: "amount",
        discount_amt: "",
        discount_per: "",
      });
    }
    setShowProposalDiscountModal(true);
  };

  const handleProposalDiscountSubmit = async (e) => {
    e.preventDefault();
    const isPercent = proposalDiscountForm.discount_type === "percent";
    const val = Number(isPercent ? proposalDiscountForm.discount_per : proposalDiscountForm.discount_amt) || 0;
    const calcRupee = isPercent ? (quotationServicesSubtotal * val) / 100 : val;
    const newTotal = Math.max(0, quotationServicesSubtotal - calcRupee) + quotationAdsBudgetTotal;
    const payload = {
      type: isPercent ? "Percentage" : "Amount",
      value: val,
      discount_type: isPercent ? "percent" : "amount",
      discount_amt: isPercent ? 0 : val,
      discount_per: isPercent ? val : 0,
      calculatedAmount: calcRupee,
    };
    await handleSaveQuotationDiscount(payload, newTotal);
    setShowProposalDiscountModal(false);
  };

  const handleProposalDiscountDelete = async () => {
    const newTotal = quotationServicesSubtotal + quotationAdsBudgetTotal;
    await handleDeleteQuotationDiscount(newTotal);
    setShowProposalDiscountModal(false);
  };

  return (
    <InvoicePrintWrapper>
      <div className="page-wrapper w-[210mm] min-h-[297mm] flex flex-col justify-start p-4 mx-auto bg-white print:p-0 print:m-0">
        {/* Top Action Buttons */}
        <InvoiceActionButtons
          handlePrintPage={handlePrintPage}
          onEdit={canEdit ? handleEdit : undefined}
          onProposalHistory={handleProposalHistory}
          basePath={basePath}
        />

        {isQuotationFrozen && (
          <div className="mb-3 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 text-xs font-medium flex items-center justify-between print:hidden shadow-sm">
            <span className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>
                <strong>Quotation Locked:</strong> A proforma has already been created for this quotation. Editing services and discounts is disabled.
              </span>
            </span>
          </div>
        )}

        {/* Table for proper header/footer repetition */}
        <table className="print:table print:border-collapse w-full">
          {/* Repeating Header */}
          <DocumentHeaderBanner isGST={isPlainQuotation ? false : isGST} />

          {/* Main Content */}
          <tbody className="print:table-row-group">
            <tr>
              <td className="p-0 m-0 align-top">
                <div className="flex flex-col justify-start px-6 py-1 print:px-4 print:block">
                  <div className="flex-grow print:block">
                    {/* Header & Client Info */}
                    <QuotationCustomerInfoCard
                      clientData={clientData}
                      isBalanceProforma={isBalanceProforma}
                      docTypeFromURL={docTypeFromURL}
                      sourceFromURL={sourceFromURL}
                      proformaMeta={proformaMeta}
                      txn_id={txn_id}
                      quotationNumber={quotationNumber}
                    />

                    {isPlainQuotation && (
                      <>
                        {/* 1. Services Table (DM Services + Ads Service Charges) */}
                        <section className="mb-3 text-sm text-gray-900">
                          <table className="w-full border text-xs">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="border px-2 py-1 text-left">Service</th>
                                <th className="border px-2 py-1 text-left">Category</th>
                                <th className="border px-2 py-1 text-right">Quantity</th>
                              </tr>
                            </thead>
                            <tbody>
                              {quotationLines.length === 0 && (
                                <tr>
                                  <td className="border px-2 py-2 text-center" colSpan={3}>No services added</td>
                                </tr>
                              )}
                              {quotationLines.map((line, index) => {
                                const catName = line.category_name || "—";
                                const editType = (line.editing_type_name || "").trim();
                                const showEditType =
                                  editType &&
                                  editType.toLowerCase() !== "n/a" &&
                                  !catName.toLowerCase().includes(editType.toLowerCase());
                                const categoryDisplay = showEditType ? `${catName} (${editType})` : catName;

                                let addons = [];
                                if (line.additional_services) {
                                  try {
                                    addons = typeof line.additional_services === "string"
                                      ? JSON.parse(line.additional_services)
                                      : line.additional_services;
                                    if (!Array.isArray(addons)) addons = [];
                                  } catch {
                                    addons = [];
                                  }
                                }

                                return (
                                  <React.Fragment key={`${line.service_name}-${index}`}>
                                    <tr className="bg-white">
                                      <td className="border px-2 py-1 font-medium">{line.service_name}</td>
                                      <td className="border px-2 py-1">{categoryDisplay}</td>
                                      <td className="border px-2 py-1 text-right">{line.quantity}</td>
                                    </tr>
                                    {addons.map((addon, aIdx) => {
                                      const addonName = addon.name || addon.additional_service_name || "Additional Service";
                                      const parentName = line.service_name || "Service";
                                      const addonQty = Number(addon.quantity) || line.quantity || 1;
                                      return (
                                        <tr key={`${line.service_name}-${index}-addon-${aIdx}`} className="bg-white">
                                          <td className="border px-2 py-1 font-medium">{addonName} ({parentName})</td>
                                          <td className="border px-2 py-1 text-gray-500">—</td>
                                          <td className="border px-2 py-1 text-right">{addonQty}</td>
                                        </tr>
                                      );
                                    })}
                                  </React.Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </section>

                        {/* 2. Ads Budget Table (Dedicated table for Ads Campaign Budgets) */}
                        {adBudgetLines && adBudgetLines.length > 0 && (
                          <section className="mb-3 text-sm text-gray-900">
                            <div className="font-semibold text-xs text-gray-700 uppercase tracking-wider mb-1">
                              Ads Budget
                            </div>
                            <table className="w-full border text-xs">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="border px-2 py-1 text-left">Campaign Platform</th>
                                  <th className="border px-2 py-1 text-left">Category</th>
                                  <th className="border px-2 py-1 text-right">Quantity</th>
                                </tr>
                              </thead>
                              <tbody>
                                {adBudgetLines.map((ad, index) => (
                                  <tr key={`ad-budget-${index}`} className="bg-white">
                                    <td className="border px-2 py-1 font-medium">{ad.service_name || "Ads Campaign"}</td>
                                    <td className="border px-2 py-1">{ad.category_name}</td>
                                    <td className="border px-2 py-1 text-right">{ad.quantity || 1}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </section>
                        )}

                        {/* 3. Complimentary Services Table (if any) */}
                        {complimentaryData && complimentaryData.length > 0 && (
                          <section className="mb-3 text-sm text-gray-900">
                            <div className="font-semibold text-xs text-gray-700 uppercase tracking-wider mb-1">
                              Complimentary Services
                            </div>
                            <table className="w-full border text-xs">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="border px-2 py-1 text-left">Service</th>
                                  <th className="border px-2 py-1 text-left">Category</th>
                                  <th className="border px-2 py-1 text-right">Quantity</th>
                                </tr>
                              </thead>
                              <tbody>
                                {complimentaryData.map((comp, index) => {
                                  const catName = comp.category_name || "—";
                                  const editType = (comp.editing_type_name || "").trim();
                                  const showEditType =
                                    editType &&
                                    editType.toLowerCase() !== "n/a" &&
                                    !catName.toLowerCase().includes(editType.toLowerCase());
                                  const categoryDisplay = showEditType ? `${catName} (${editType})` : catName;

                                  let addons = [];
                                  if (comp.additional_services) {
                                    try {
                                      addons = typeof comp.additional_services === "string"
                                        ? JSON.parse(comp.additional_services)
                                        : comp.additional_services;
                                      if (!Array.isArray(addons)) addons = [];
                                    } catch {
                                      addons = [];
                                    }
                                  }

                                  return (
                                    <React.Fragment key={`comp-${index}`}>
                                      <tr className="bg-white">
                                        <td className="border px-2 py-1 font-medium">{comp.service_name}</td>
                                        <td className="border px-2 py-1">{categoryDisplay}</td>
                                        <td className="border px-2 py-1 text-right">{comp.quantity || 1}</td>
                                      </tr>
                                      {addons.map((addon, aIdx) => {
                                        const addonName = addon.name || addon.additional_service_name || "Additional Service";
                                        const parentName = comp.service_name || "Service";
                                        const addonQty = Number(addon.quantity) || comp.quantity || 1;
                                        return (
                                          <tr key={`comp-${index}-addon-${aIdx}`} className="bg-white">
                                            <td className="border px-2 py-1 font-medium">{addonName} ({parentName})</td>
                                            <td className="border px-2 py-1 text-gray-500">—</td>
                                            <td className="border px-2 py-1 text-right">{addonQty}</td>
                                          </tr>
                                        );
                                      })}
                                    </React.Fragment>
                                  );
                                })}
                              </tbody>
                            </table>
                          </section>
                        )}

                        {/* 4. Pricing Summary */}
                        <section className="mb-3 border-t border-gray-300 pt-2 text-xs text-gray-900">
                          <div className="flex justify-between items-center mb-1">
                            <p className="font-bold text-sm">Pricing</p>
                            {canEdit && (
                              <button
                                type="button"
                                onClick={openProposalDiscountModal}
                                className="print:hidden text-[11px] font-semibold px-2.5 py-1 bg-yellow-50 text-yellow-700 border border-yellow-300 rounded hover:bg-yellow-100 transition shadow-sm"
                              >
                                {discountAmt > 0 ? "Edit Discount" : "+ Apply Discount"}
                              </button>
                            )}
                          </div>

                          <div className="flex justify-between gap-3 py-0.5">
                            <span className="text-gray-600">Subtotal</span>
                            <span>{formatInr(quotationServicesSubtotal)}</span>
                          </div>

                          {discountAmt > 0 && (
                            <div className="flex justify-between gap-3 py-0.5 text-red-600">
                              <span>Discount {discountLabel}</span>
                              <span>- {formatInr(discountAmt)}</span>
                            </div>
                          )}

                          {/* Ads Budget rows in Pricing */}
                          {adBudgetLines && adBudgetLines.length > 0 && (
                            adBudgetLines.map((ad, idx) => {
                              let catName = ad.category_name || "Ads";
                              catName = catName.replace(/\badd\b/gi, "Ad");
                              return (
                                <div key={`pricing-ad-${idx}`} className="flex justify-between gap-3 py-0.5 text-gray-700">
                                  <span>{catName} Budget</span>
                                  <span className="font-medium">{formatInr(ad.budget || ad.amount)}</span>
                                </div>
                              );
                            })
                          )}

                          <div className="flex justify-between gap-3 border-t border-gray-400 mt-1 pt-1 font-bold text-sm">
                            <span>Total</span>
                            <span>{formatInr(finalQuotationTotal)}</span>
                          </div>
                        </section>
                        {/* Notes Dropdown for Quotation */}
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
                        <QuotationNotesSection notesData={notesData} isProforma={false} clientData={clientData}
                          onEditNote={handleOpenEditNoteModal}
                          onDeleteNote={handleDeleteClientNote}
                        />
                      </>
                    )}

                    {!isPlainQuotation && (
                    <>
                    {/* Graphic & Service Table */}
                    <QuotationServicesTable
                      graphicData={graphicData}
                      graphicTotal={graphicTotal}
                    />

                    {/* Complimentary Services Table */}
                    <QuotationComplimentaryTable
                      complimentaryData={complimentaryData}
                    />

                    {/* Action row: Discount on left, Ads toggles on right */}
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

                    {/* Terms & Bank Details Section */}
                    <section className="terms-bank-section print:block px-6 py-2 text-sm text-gray-800 border-t mt-2 print:px-0 print:py-1 print:mt-1">
                      <div className="bank-details-section flex justify-between w-full mb-2 print:mb-0">
                        {/* LEFT SIDE: Bank Details */}
                        <DocumentBankDetails isGST={isGST} variant="quotation" />

                        {/* RIGHT SIDE: Totals */}
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

                    {/* Notes Dropdown & Input */}
                    {canEdit && (
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
                    )}

                    {/* Displayed Notes List */}
                    <QuotationNotesSection
                      notesData={notesData}
                      isProforma={docTypeFromURL === "proforma"}
                      clientData={clientDataReceived}
                      onEditNote={canEdit ? handleOpenEditNoteModal : undefined}
                      onDeleteNote={canEdit ? handleDeleteClientNote : undefined}
                    />
                    </>
                    )}
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

        {/* Footer image for print */}
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

        {/* Proposal Discount Modal for Quotation */}
        <ProposalDiscountModal
          show={showProposalDiscountModal}
          onClose={() => setShowProposalDiscountModal(false)}
          onSubmit={handleProposalDiscountSubmit}
          onDelete={discountAmt > 0 ? handleProposalDiscountDelete : undefined}
          formDataDis={proposalDiscountForm}
          handleChangeDis={(e) => {
            const { name, value } = e.target;
            setProposalDiscountForm((prev) => ({ ...prev, [name]: value }));
          }}
          grandTotal={quotationServicesSubtotal}
          discountDataSet={discountDataSet}
        />
      </div>
    </InvoicePrintWrapper>
  );
}
