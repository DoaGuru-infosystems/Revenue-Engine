/**
 * Pure calculation helper for Quotation Pricing
 *
 * @param {Object} params
 * @param {Array} params.paidLines - Array of paid line items (including ad service charge lines)
 * @param {Array} params.complimentaryLines - Array of complimentary line items
 * @param {Array} params.adBudgetLines - Array of ad budget lines
 * @param {Object|string} params.discount - Discount object or JSON string ({ type, value, discount_amt, discount_per, ... })
 * @returns {Object} Calculated pricing summary
 */
export function computeQuotationPricing({
  paidLines = [],
  complimentaryLines = [],
  adBudgetLines = [],
  discount = null,
} = {}) {
  // 1. Service Amount: Sum of all paid lines (services + ad service charges)
  const serviceAmount = (Array.isArray(paidLines) ? paidLines : []).reduce(
    (sum, line) => {
      if (!line) return sum;
      const amt =
        line.amount !== undefined && line.amount !== null
          ? Number(line.amount)
          : line.total_amount !== undefined && line.total_amount !== null
          ? Number(line.total_amount)
          : line.total_price !== undefined && line.total_price !== null
          ? Number(line.total_price)
          : Number(line.editing_type_amount || line.unit_price || line.rate || 0) *
            Number(line.quantity || 1);
      return sum + (Number.isFinite(amt) ? amt : 0);
    },
    0
  );

  // 2. Complimentary Amount: sum of (editing_type_amount || unit_price) * quantity + additional_services + optional features
  // NOTE: Complimentary lines have total_amount: 0 for invoice totals, but for display we compute their theoretical value
  const complimentaryAmount = (
    Array.isArray(complimentaryLines) ? complimentaryLines : []
  ).reduce((sum, line) => {
    if (!line) return sum;
    const qty = Number(line.quantity || 1);
    const unitRate = Number(
      line.editing_type_amount || line.unit_price || line.rate || line.price || 0
    );
    const baseTotal = unitRate * qty;

    // Additional services (addons)
    let addons = line.additional_services;
    if (typeof addons === "string") {
      try {
        addons = JSON.parse(addons);
      } catch {
        addons = [];
      }
    }
    let addonsSum = 0;
    if (Array.isArray(addons) && addons.length > 0) {
      addonsSum = addons.reduce((aSum, a) => {
        if (!a) return aSum;
        const aQty = Number(a.quantity) || qty || 1;
        const aRate = Number(a.amount || a.unit_price || a.price || 0);
        const aTotalField = Number(a.total ?? a.total_amount);
        const aTotal =
          Number.isFinite(aTotalField) && aTotalField > 0
            ? aTotalField
            : aRate * aQty;
        return aSum + (Number.isFinite(aTotal) ? aTotal : 0);
      }, 0);
    } else if (Number(line.additional_services_amount) > 0) {
      addonsSum = Number(line.additional_services_amount);
    }

    // Optional features (thumbnail, content posting, youtube video posting)
    const thumb = (Number(line.include_thumbnail_creation) || 0) * qty;
    const post = (Number(line.include_content_posting) || 0) * qty;
    const yt = (Number(line.include_youtube_video_posting) || 0) * qty;

    const computed = baseTotal + addonsSum + thumb + post + yt;
    const fallback = Number(line.total_amount || line.total_price || line.original_total_amount || 0);
    const val = computed > 0 ? computed : fallback;

    return sum + (Number.isFinite(val) ? val : 0);
  }, 0);

  // 3. Discount: applies ONLY to serviceAmount (not on ad budget)
  let discountAmt = 0;
  let discountLabel = "";
  let parsedDiscount = discount;
  if (typeof parsedDiscount === "string") {
    try {
      parsedDiscount = JSON.parse(parsedDiscount);
    } catch {
      parsedDiscount = null;
    }
  }

  if (parsedDiscount) {
    const isPercent =
      parsedDiscount.type === "Percentage" ||
      parsedDiscount.discount_type === "percent";
    const val = Number(
      parsedDiscount.value ||
        (isPercent ? parsedDiscount.discount_per : parsedDiscount.discount_amt) ||
        0
    );
    if (Number.isFinite(val) && val > 0) {
      discountAmt = isPercent ? (serviceAmount * val) / 100 : val;
      discountLabel = isPercent ? `(${val}%)` : "";
    }
  }

  // 4. Subtotals
  const subtotal = serviceAmount;
  const subtotalAfterDiscount = Math.max(0, serviceAmount - discountAmt);

  // 5. Ad Budget Groups: group by trimmed lowercase category_name, maintain original order, filter out <= 0
  const groupMap = new Map();
  (Array.isArray(adBudgetLines) ? adBudgetLines : []).forEach((line) => {
    if (!line) return;
    const rawCategory = String(line.category_name || line.category || "Ads").trim();
    const key = rawCategory.toLowerCase();
    const budget = Number(line.budget || line.amount || 0);
    if (!Number.isFinite(budget) || budget <= 0) return;

    if (!groupMap.has(key)) {
      // Clean up common typos like "Google Add" -> "Google Ad"
      const cleanedLabel = rawCategory.replace(/\badd\b/gi, "Ad");
      groupMap.set(key, {
        category_name: rawCategory,
        label: cleanedLabel,
        budget: 0,
      });
    }
    const current = groupMap.get(key);
    current.budget += budget;
  });

  const adBudgetGroups = Array.from(groupMap.values());
  const adBudgetTotal = adBudgetGroups.reduce((sum, g) => sum + g.budget, 0);

  // 6. Total Payable Amount: subtotalAfterDiscount + adBudgetTotal (Complimentary is NEVER added)
  const totalPayable = subtotalAfterDiscount + adBudgetTotal;

  // 7. Full Total: serviceAmount + complimentaryAmount
  const fullTotal = (Number(serviceAmount) || 0) + (Number(complimentaryAmount) || 0);

  return {
    fullTotal: Number(fullTotal) || 0,
    serviceAmount: Number(serviceAmount) || 0,
    complimentaryAmount: Number(complimentaryAmount) || 0,
    discountAmt: Number(discountAmt) || 0,
    discountLabel: discountLabel || "",
    subtotal: Number(subtotal) || 0,
    subtotalAfterDiscount: Number(subtotalAfterDiscount) || 0,
    adBudgetGroups,
    adBudgetTotal: Number(adBudgetTotal) || 0,
    totalPayable: Number(totalPayable) || 0,
  };
}
