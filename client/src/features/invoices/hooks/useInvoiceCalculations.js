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
  clientData = {},
  proformaPayments = [],
  isGST = false,
  isProforma = false,
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
          (editSum, edit) => editSum + (edit.total || edit.price * edit.quantity),
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

    const activeTaxableSubtotal = isGST
      ? Number((amountForServicesIncGst / 1.18).toFixed(2))
      : amountForServicesIncGst;

    const pastReceivedAmountForCalc = Number(clientData?.total_past_received || 0);
    const pastAdBudgetForCalc = Number(clientData?.total_past_ad_budget || 0);
    const pastServicesIncGst = Math.max(pastReceivedAmountForCalc - pastAdBudgetForCalc, 0);
    const pastActiveTaxableSubtotal = isGST
      ? Number((pastServicesIncGst / 1.18).toFixed(2))
      : pastServicesIncGst;

    const projectValueDeferred = Math.max(
      totalAfterDiscount - activeTaxableSubtotal - pastActiveTaxableSubtotal,
      0
    );

    // 6. GST & Totals
    const gstAmount = isGST
      ? isPartialPayment && currentBillGrossReceived > 0
        ? activeTaxableSubtotal * 0.18
        : totalAfterDiscount * 0.18
      : 0;

    const totalgstamount = gstAmount + totalAfterDiscount;
    const currentTotalAmount = totalgstamount + Number(clientData?.previous_amt || 0);
    const invoiceSubtotal = Math.max(totalAfterDiscount, 0);
    const invoiceTotal = invoiceSubtotal + gstAmount;

    const activeInvoiceTotal =
      isPartialPayment && currentBillGrossReceived > 0
        ? activeTaxableSubtotal + gstAmount
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
    clientData,
    proformaPayments,
    isGST,
    isProforma,
    showGoogleAd,
    showMetaAd,
    txnIdFromURL,
  ]);
};
