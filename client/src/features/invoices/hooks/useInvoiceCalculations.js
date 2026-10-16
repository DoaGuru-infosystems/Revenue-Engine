import { useMemo } from "react";
import moment from "moment";
import { inrToWords } from "../../../utils/inrToWords";

/**
 * Parses numeric values safely from strings/numbers
 */
export const parseAmount = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const normalized = String(value).replace(/[^0-9.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Reads an optional field value from item matching any alias
 */
export const getOptionalAmountFromItem = (item, aliases = []) => {
  const keys = Object.keys(item || {});
  const exactMatch = keys.find((key) =>
    aliases.some((alias) => key.toLowerCase() === alias.toLowerCase())
  );
  if (exactMatch && item[exactMatch] !== undefined && item[exactMatch] !== null && item[exactMatch] !== "") {
    return parseAmount(item[exactMatch]);
  }
  return 0;
};

/**
 * Custom hook for all Invoice financial calculations, tax computations, and balance totals.
 */
export const useInvoiceCalculations = ({
  serviceData = [],
  graphicData = [],
  adsData = [],
  additionalServiceData = [],
  remainingAmountData = [],
  complimentaryData = [],
  selecteddiscount = null,
  selectedAdjustment = null,
  clientData = {},
  proformaPayments = [],
  isGST = false,
  isProforma = false,
  isBalanceProforma = false,
  showGoogleAd = true,
  showMetaAd = true,
  txnIdFromURL = null,
}) => {
  return useMemo(() => {
    // 1. Service Totals
    const graphicTotal = graphicData.reduce(
      (sum, service) =>
        sum +
        service.editingTypes.reduce(
          (editSum, edit) => {
            const qty = Number(edit.quantity) || 1;
            const base = Number(edit.price || edit.editing_type_amount || 0);
            const baseTotal = base * qty;
            const addons = Array.isArray(edit.additional_services) ? edit.additional_services : [];
            const addonsTotal = addons.reduce((s, a) => s + ((Number(a.amount || a.unit_price) || 0) * (Number(a.quantity) || qty)), 0);
            const recordedTotal = Number(edit.total || 0);
            const effectiveTotal = (recordedTotal >= baseTotal + addonsTotal && recordedTotal > 0)
              ? recordedTotal
              : (recordedTotal > 0 ? recordedTotal : baseTotal) + addonsTotal;
            return editSum + effectiveTotal;
          },
          0
        ),
      0
    );

    const complimentaryTotal = complimentaryData.reduce((sum, service) => {
      const amount =
        service.total_amount !== null && service.total_amount !== undefined
          ? Number(service.total_amount)
          : Number(service.editing_type_amount || 0) * Number(service.quantity || 0);
      return sum + amount;
    }, 0);

    const additionalTotal = additionalServiceData.reduce((sum, service) => {
      const amount =
        service.total_amount !== null && service.total_amount !== undefined
          ? Number(service.total_amount)
          : Number(service.editing_type_amount || 0) * Number(service.quantity || 0);
      return sum + amount;
    }, 0);

    const remainingTotalAmount = remainingAmountData.reduce(
      (sum, item) => sum + (parseFloat(item.price) || 0),
      0
    );

    const grandTotal = graphicTotal + additionalTotal;

    // 2. Breakdown Totals
    const thumbTotal = graphicData
      .flatMap((s) => s.editingTypes.filter((e) => Number(e.include_thumbnail_creation) > 0))
      .reduce((sum, e) => sum + Number(e.include_thumbnail_creation) * Number(e.quantity), 0);

    const postTotal = graphicData
      .flatMap((s) => s.editingTypes.filter((e) => Number(e.include_content_posting) > 0))
      .reduce((sum, e) => sum + Number(e.include_content_posting) * Number(e.quantity), 0);

    const ytTotal = graphicData
      .flatMap((s) => s.editingTypes.filter((e) => Number(e.include_youtube_video_posting) > 0))
      .reduce((sum, e) => sum + Number(e.include_youtube_video_posting) * Number(e.quantity), 0);

    const addTotal = additionalServiceData.reduce((sum, e) => {
      const amount =
        e.total_amount !== null && e.total_amount !== undefined
          ? Number(e.total_amount || 0)
          : Number(e.editing_type_amount || e.price || 0) * Number(e.quantity || 1);
      return sum + Number(amount || 0);
    }, 0);

    const dmServiceTotal = graphicTotal + thumbTotal + postTotal + ytTotal + addTotal;

    // 3. Discount Calculations
    const discountAmount = selecteddiscount
      ? selecteddiscount.discount_type === "percent"
        ? (grandTotal * Number(selecteddiscount.discount_per)) / 100
        : selecteddiscount.discount_type === "amount"
          ? Number(selecteddiscount.discount_amt)
          : 0
      : 0;

    const totalAfterDiscount = grandTotal - discountAmount;

    // 3.1 Adjustment Calculations (applies strictly to Service Charges after discount, Ads excluded)
    const adjustmentAmount = selectedAdjustment
      ? Number(selectedAdjustment.amount || selectedAdjustment.adjustment_amount || 0)
      : Number(clientData?.adjustment_amount || 0);

    const totalAfterAdjustment = Math.max(0, totalAfterDiscount - adjustmentAmount);

    // 3.2 Previous Balance Calculations
    const previousBalanceAmount = Number(
      clientData?.previous_balance_amount !== undefined && clientData?.previous_balance_amount !== null
        ? clientData.previous_balance_amount
        : 0
    );

    const totalWithPreviousBalance = totalAfterAdjustment + previousBalanceAmount;

    // 4. Ad Budget Calculations
    const realizedAdBudget = Number(clientData?.realized_ad_budget || 0);
    const realizedGoogleBudget = Number(clientData?.realized_google_budget || 0);
    const realizedMetaBudget = Number(clientData?.realized_meta_budget || 0);

    const isPendingOrProforma = isProforma || clientData?.tag_received_amt === "pending";

    const visibleGoogleBudget =
      clientData?.invoice_source === "proposal" && !isProforma
        ? realizedGoogleBudget
        : isPendingOrProforma || clientData?.invoice_source === "manual"
          ? adsData.reduce((sum, ad) => {
            const cat = (ad.category_name || "").toLowerCase();
            if (cat.includes("google") && showGoogleAd) {
              return sum + Number(ad.amount || ad.budget || 0);
            }
            return sum;
          }, 0)
          : realizedGoogleBudget;

    const visibleMetaBudget =
      clientData?.invoice_source === "proposal" && !isProforma
        ? realizedMetaBudget
        : isPendingOrProforma || clientData?.invoice_source === "manual"
          ? adsData.reduce((sum, ad) => {
            const cat = (ad.category_name || "").toLowerCase();
            if (cat.includes("meta") && showMetaAd) {
              return sum + Number(ad.amount || ad.budget || 0);
            }
            return sum;
          }, 0)
          : realizedMetaBudget;

    const visibleAdBudget = visibleGoogleBudget + visibleMetaBudget;

    // 5. Partial Payment & Tax Subtotals
    const isPartialPayment =
      clientData?.tag_received_amt === "partial" ||
      (Number(clientData?.received_amt || 0) > 0 && Number(clientData?.current_amt || 0) > 0);

    const currentBillGrossReceived = Number(clientData?.received_amt || 0);
    const amountForServicesIncGst = Math.max(currentBillGrossReceived - realizedAdBudget, 0);

    const pastReceivedAmountForCalc = Number(clientData?.total_past_received || 0);
    const pastAdBudgetForCalc = Number(clientData?.total_past_ad_budget || 0);
    const pastServicesIncGst = Math.max(pastReceivedAmountForCalc - pastAdBudgetForCalc, 0);

    // Previous balance is settled first without compounding GST
    const pastPrevBalPaid = Math.min(previousBalanceAmount, pastServicesIncGst);
    const remainingPrevBalBeforeCurrent = Math.max(0, previousBalanceAmount - pastPrevBalPaid);
    const currentPrevBalPaid = Math.min(remainingPrevBalBeforeCurrent, amountForServicesIncGst);

    // The portion of current bill paying for current services (inclusive of GST)
    const currentServicesIncGst = Math.max(0, amountForServicesIncGst - currentPrevBalPaid);
    const activeTaxableSubtotal = isGST
      ? Number((currentServicesIncGst / 1.18).toFixed(2))
      : currentServicesIncGst;

    const pastServicesNetOfPrevBal = Math.max(0, pastServicesIncGst - pastPrevBalPaid);
    const pastActiveTaxableSubtotal = isGST
      ? Number((pastServicesNetOfPrevBal / 1.18).toFixed(2))
      : pastServicesNetOfPrevBal;

    const projectValueDeferred = Math.max(
      totalAfterAdjustment - activeTaxableSubtotal - pastActiveTaxableSubtotal,
      0
    );

    // 6. GST & Totals
    const gstAmount = isGST
      ? isPartialPayment && currentBillGrossReceived > 0
        ? Number((activeTaxableSubtotal * 0.18).toFixed(2))
        : Number((totalAfterAdjustment * 0.18).toFixed(2))
      : 0;

    const totalgstamount = totalAfterAdjustment + gstAmount + previousBalanceAmount;
    const currentTotalAmount = totalgstamount + Number(clientData?.previous_amt || 0);
    const invoiceSubtotal = Math.max(totalAfterAdjustment, 0);
    const invoiceTotal = invoiceSubtotal + gstAmount + previousBalanceAmount;

    const activeInvoiceTotal =
      isPartialPayment && currentBillGrossReceived > 0
        ? activeTaxableSubtotal + gstAmount + currentPrevBalPaid
        : invoiceTotal;

    const budgetAwareCurrentTotalAmount = currentTotalAmount + visibleAdBudget;

    // 7. Proforma Payment History
    const totalProformaReceivedAmount = proformaPayments.reduce(
      (sum, payment) => sum + parseAmount(payment.amount),
      0
    );
    const totalProformaSettledAmount = proformaPayments.reduce(
      (sum, payment) => sum + parseAmount(payment.final_amount || payment.amount),
      0
    );
    const totalProformaTdsAmount = proformaPayments.reduce(
      (sum, payment) => sum + parseAmount(payment.tds_amount),
      0
    );

    const previousAmountForSummary = Number(clientData?.previous_amt || 0);
    const pastReceivedAmount = Number(clientData?.total_past_received || 0);
    const previousInvoiceNo = clientData?.previous_invoice_no || null;
    const previousInvoiceDate = clientData?.previous_invoice_date
      ? moment(clientData.previous_invoice_date).format("DD-MMM-YYYY")
      : null;

    const savedReceivedAmountForSummary = Number(clientData?.received_amt || 0);
    const receivedAmountForSummary =
      isProforma && proformaPayments.length > 0 && !txnIdFromURL
        ? totalProformaReceivedAmount
        : savedReceivedAmountForSummary;

    const receivedAmountForBalance =
      isProforma && proformaPayments.length > 0 && !txnIdFromURL
        ? totalProformaSettledAmount
        : savedReceivedAmountForSummary;

    const hasReceivedAmount = receivedAmountForSummary > 0;

    const tdsAmountToShow = txnIdFromURL
      ? Number(clientData?.tds_amount || 0)
      : isProforma && proformaPayments.length > 0
        ? totalProformaTdsAmount
        : Number(clientData?.tds_amount || 0);

    // 8. Outstanding Balances
    const savedOutstanding = Number(clientData?.current_amt || 0);
    const hasOutstandingBalance = savedOutstanding > 0;
    const hasSavedOutstandingFromPartial = hasOutstandingBalance && hasReceivedAmount;

    const calculatedSummaryBalance = hasSavedOutstandingFromPartial
      ? savedOutstanding
      : Math.max(
        previousAmountForSummary + invoiceTotal + visibleAdBudget - receivedAmountForBalance,
        0
      );

    const summaryCurrentBalance = txnIdFromURL
      ? Number(clientData?.current_amt || 0)
      : clientData?.tag_received_amt === "received"
        ? 0
        : calculatedSummaryBalance;

    const floorAmount = (value) => Number(value || 0);
    const formatAmountNoDecimals = (value) =>
      Math.round(floorAmount(value)).toLocaleString("en-IN");
    const formatAmount = (value) =>
      floorAmount(value).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    // 9. Words & Bank Amounts
    const netBankAmount = receivedAmountForSummary - tdsAmountToShow;
    const hasPayment =
      clientData?.tag_received_amt === "received" ||
      hasReceivedAmount ||
      receivedAmountForSummary > 0;
    const totalForWords = hasPayment
      ? netBankAmount
      : activeInvoiceTotal + visibleAdBudget;
    const safeTotal = Math.round(Number(totalForWords) || 0);
    const amountInWords =
      safeTotal > 0 ? inrToWords(safeTotal) : "Zero Rupees Only";

    const previousBalance = Number(clientData?.previous_amt || 0);
    const totalcurrentamount = Number(clientData?.current_amt || 0);
    const totalDueForReceived = hasSavedOutstandingFromPartial
      ? totalcurrentamount
      : budgetAwareCurrentTotalAmount;

    // Quotation / Proforma / Balance Proforma specific totals
    const dmTotalAfterDiscount = Math.max(0, graphicTotal - discountAmount);
    const dmTotalAfterAdjustment = Math.max(0, dmTotalAfterDiscount - adjustmentAmount);
    const dmGstAmount = isGST ? Number((dmTotalAfterAdjustment * 0.18).toFixed(2)) : 0;
    const dmSubtotalWithGst = dmTotalAfterAdjustment + dmGstAmount + previousBalanceAmount;

    const googleAdItem = adsData.find((ad) =>
      (ad.category_name || "").toLowerCase().includes("google")
    );
    const googleAdAmount = Number(googleAdItem?.amount || googleAdItem?.budget || 0);

    const metaAdItem = adsData.find((ad) =>
      (ad.category_name || "").toLowerCase().includes("meta")
    );
    const metaAdAmount = Number(metaAdItem?.amount || metaAdItem?.budget || 0);

    const activeAdsBudget =
      (showGoogleAd ? googleAdAmount : 0) + (showMetaAd ? metaAdAmount : 0);

    let displayedSubtotal = dmSubtotalWithGst;
    const isBalProf = Boolean(isBalanceProforma);
    const totalAmt =
      clientData?.total_amt !== undefined
        ? Number(clientData.total_amt)
        : Number(clientData?.total_amount || 0);

    if (isBalProf && totalAmt > 0) {
      const fullAdBudgets = googleAdAmount + metaAdAmount;
      if (fullAdBudgets > 0 && totalAmt > fullAdBudgets) {
        displayedSubtotal = Math.max(0, totalAmt - fullAdBudgets);
      }
    }

    const displayedGrandTotal =
      isBalProf && totalAmt > 0
        ? displayedSubtotal + activeAdsBudget
        : dmSubtotalWithGst + activeAdsBudget;

    let displayedTaxable = dmTotalAfterAdjustment;
    let displayedCgst = dmGstAmount / 2;
    let displayedSgst = dmGstAmount / 2;

    if (isBalProf && Math.abs(dmSubtotalWithGst - displayedSubtotal) > 1) {
      const serviceSubtotalWithGst = Math.max(0, displayedSubtotal - previousBalanceAmount);
      if (isGST) {
        displayedTaxable = Math.round((serviceSubtotalWithGst / 1.18) * 100) / 100;
        const gstTotal = serviceSubtotalWithGst - displayedTaxable;
        displayedCgst = gstTotal / 2;
        displayedSgst = gstTotal / 2;
      } else {
        displayedTaxable = serviceSubtotalWithGst;
        displayedCgst = 0;
        displayedSgst = 0;
      }
    }

    const removedAdsBudget =
      (!showGoogleAd ? googleAdAmount : 0) + (!showMetaAd ? metaAdAmount : 0);
    const baseReceived = Number(
      clientData?.received_amt || clientData?.received_amount || 0
    );
    const displayedReceived = Math.max(0, baseReceived - removedAdsBudget);
    const displayedCurrentBalance = Math.max(
      0,
      displayedGrandTotal - displayedReceived
    );

    return {
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
      dmTotalAfterDiscount,
      adjustmentAmount,
      totalAfterAdjustment,
      previousBalanceAmount,
      totalWithPreviousBalance,
      currentPrevBalPaid,
      dmTotalAfterAdjustment,
      dmGstAmount,
      dmSubtotalWithGst,
      displayedTaxable,
      displayedCgst,
      displayedSgst,
      displayedSubtotal,
      displayedGrandTotal,
      displayedReceived,
      displayedCurrentBalance,
      formatAmount,
      formatAmountNoDecimals,
      parseAmount,
      getOptionalAmountFromItem,
    };
  }, [
    serviceData,
    graphicData,
    adsData,
    additionalServiceData,
    remainingAmountData,
    complimentaryData,
    selecteddiscount,
    selectedAdjustment,
    clientData,
    proformaPayments,
    isGST,
    isProforma,
    isBalanceProforma,
    showGoogleAd,
    showMetaAd,
    txnIdFromURL,
  ]);
};
