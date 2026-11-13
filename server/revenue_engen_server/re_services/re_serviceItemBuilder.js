const crypto = require("crypto");

function parseAdditionalServices(value) {
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch (_) {
      return [];
    }
  }

  return Array.isArray(value) ? value : [];
}

function getFiniteNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function buildServiceItems(pricingItems, adsItems) {
  const serviceItems = [];

  if (Array.isArray(pricingItems)) {
    pricingItems.forEach((item) => {
      if (!item) return;

      const parentName = item.service_name || item.name || "Service";
      const parentReItemId = item.re_item_id || item.id || crypto.randomUUID();
      serviceItems.push({
        re_item_id: parentReItemId,
        name: parentName,
        category: item.category_name || item.category || "",
        description: item.editing_type_name || item.description || "",
        quantity: item.quantity != null ? Number(item.quantity) : null,
      });

      parseAdditionalServices(item.additional_services).forEach((additionalService) => {
        if (!additionalService) return;
        const name = additionalService.name || additionalService.additional_service_name;
        if (!name) return;

        const quantity = getFiniteNumber(additionalService.quantity) ??
          getFiniteNumber(item.quantity);
        const unitPrice = getFiniteNumber(
          additionalService.amount ?? additionalService.unit_price ?? additionalService.price
        );
        const totalAmount = getFiniteNumber(
          additionalService.total_amount ?? additionalService.total
        ) ?? (unitPrice !== null && quantity !== null ? unitPrice * quantity : null);

        const instanceId =
          additionalService.instance_id ||
          additionalService.re_item_id ||
          (typeof additionalService.id === "string" && additionalService.id.includes("-")
            ? additionalService.id
            : crypto.randomUUID());

        serviceItems.push({
          re_item_id: instanceId,
          parent_re_item_id: parentReItemId,
          name,
          category: additionalService.category_name || additionalService.category ||
            item.category_name || item.category || "",
          description: `Additional Service of ${parentName}`,
          quantity,
          is_additional_service: true,
          parent_service_name: parentName,
          ...(unitPrice !== null ? { unit_price: unitPrice } : {}),
          ...(totalAmount !== null ? { total_amount: totalAmount } : {}),
        });
      });
    });
  }

  if (Array.isArray(adsItems)) {
    adsItems.forEach((ad) => {
      if (!ad) return;
      serviceItems.push({
        re_item_id: ad.re_item_id || ad.id || crypto.randomUUID(),
        name: ad.service_name || "Ads Campaign",
        category: ad.category_name || "Ads",
        description: ad.editing_type_name || `Budget: ₹${ad.budget || ad.amount || 0}`,
        quantity: null,
      });
    });
  }

  return serviceItems;
}

module.exports = { buildServiceItems };
