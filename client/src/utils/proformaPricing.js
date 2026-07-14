/**
 * Shared utility for classifying and calculating Proforma/Proposal pricing items.
 * Handles the separation of DM Services and Ads Services based on the source field.
 */

export const calcAdsRowTotal = (svc) => {
  const amount = Number(svc.amount || svc.budget || 0);
  return amount; // Ads budget should NOT include GST
};

/**
 * Given an array of services (either from a proposal's pricing_table_json or an invoice),
 * strictly separates them into dmServices and adsServices based on the single source of truth:
 * `source === "custom_ads"`
 */
export const classifyProformaServices = (services) => {
  if (!Array.isArray(services)) return { dmServices: [], adsServices: [] };

  const dmServices = [];
  const adsServices = [];

  services.forEach(item => {
    // If it's an Ads item based on source or service_type
    const isAds =
      item.source === "custom_ads" ||
      item.service_type === "Ads Campaign" ||
      item.service_name === "Ads Campaign" ||
      item.source_type === "ads_campaign";

    // Skip complimentary items — they are handled separately by the caller
    const isComplimentary =
      item.source === "custom_complimentary" ||
      (item.service_name && item.service_name.toLowerCase() === "complimentary");

    if (isComplimentary) {
      // Do not add to either dmServices or adsServices
      return;
    }

    if (isAds) {
      const budget = Number(item.budget || item.ad_budget || item.amount || item.unit_price || 0);
      const percent = item.percent !== undefined && item.percent !== null ? item.percent : (item.ad_percent || "N/A");
      const charge = Number(item.charge || item.ad_charge || 0);
      const category = item.category_name || item.service_name || item.service || "Ads Campaign";

      // 1. Ads Budget strictly goes to adsServices
      adsServices.push({
        ...item,
        service_type: "Ads Campaign",
        category_name: category,
        budget: budget,
        amount: budget,
        percent: percent,
        charge: charge,
        total_amount: budget,
      });

      let campName = category;
      if (!campName.toLowerCase().includes("campaign")) {
        campName = campName + " Campaign";
      }

      // 2. Ad Charge strictly goes to dmServices as a Graphic Service
      if (charge > 0) {
        dmServices.push({
          ...item,
          service_type: "Graphic Service",
          service_name: "Service Charge",
          category_name: category,
          editing_type_name: `${campName} Management & Optimization (${percent}%)`,
          quantity: 1,
          editing_type_amount: charge,
          total_amount: charge,
          total_price: charge,
          unit_price: charge,
          include_in_total: true,
        });
      }
    } else {
      // DM service fallback
      dmServices.push({
        ...item,
        service_type: "Graphic Service",
        service_name: item.service_name || item.service,
        editing_type_name: item.editing_type_name || item.service_name || "Proposal Item",
        quantity: item.quantity || 1,
        editing_type_amount: item.editing_type_amount || item.unit_price || item.amount || 0,
        total_amount: item.total_amount || item.total_price || item.unit_price || 0,
      });
    }
  });

  return { dmServices, adsServices };
};
