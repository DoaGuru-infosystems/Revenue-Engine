/** Normalize editing type name for duplicate / match (empty, null, whitespace → ""). */
export function normalizeEditingTypeName(name) {
  const trimmed = String(name ?? "").trim();
  return trimmed ? trimmed.toLowerCase() : "";
}

/** Sort price rows ascending for stable dropdown order. */
export function sortEditingTypesByAmount(editingTypes) {
  return [...(editingTypes || [])].sort(
    (a, b) => Number(a.amount) - Number(b.amount)
  );
}

/**
 * Resolve catalog row when editing a saved line: id → name+amount → first row (warn).
 */
export function matchEditingTypeFromCatalog(editingTypes, entry) {
  if (!editingTypes?.length) return null;

  const entryId =
    entry.editing_type_id != null && entry.editing_type_id !== ""
      ? Number(entry.editing_type_id)
      : null;
  if (entryId) {
    const byId = editingTypes.find((et) => Number(et.editing_type_id) === entryId);
    if (byId) return byId;
  }

  const entryName = normalizeEditingTypeName(entry.editing_type_name);
  const entryAmtRaw = entry.editing_type_amount ?? entry.unit_price ?? entry.amount;
  const entryAmt = Number(entryAmtRaw);
  const hasAmount = Number.isFinite(entryAmt);

  const byNameAndAmount = editingTypes.find((et) => {
    const etName = normalizeEditingTypeName(et.editing_type_name);
    const etAmt = Number(et.amount);
    if (etName !== entryName) return false;
    if (hasAmount) return etAmt === entryAmt;
    return true;
  });
  if (byNameAndAmount) return byNameAndAmount;

  console.warn(
    "[matchEditingTypeFromCatalog] No catalog match for saved line; using first price row for category.",
    {
      line_id: entry.id,
      editing_type_id: entry.editing_type_id,
      editing_type_name: entry.editing_type_name,
      editing_type_amount: entryAmtRaw,
    }
  );
  return editingTypes[0];
}

export function isBlankEditingTypeLabel(name) {
  if (!name) return true;
  const t = String(name).trim();
  return !t || t === "null" || t === "N/A";
}

/** Show price picker when multiple rows or any row has a real editing type name. */
export function shouldShowEditingTypePricePicker(category) {
  const types = category?.editing_types || [];
  if (types.length > 1) return true;
  return types.some((et) => !isBlankEditingTypeLabel(et.editing_type_name));
}
