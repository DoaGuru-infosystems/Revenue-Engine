/**
 * Quotation Draft Persistence & 48-Hour Conflict Merge System
 * 
 * Manages in-memory quotation draft synchronization with localStorage:
 * - Saves drafts with timestamp, items, discount, and initial DB snapshot
 * - Enforces 48-hour expiration TTL (silent discard after 48 hours)
 * - Implements 3-way merge logic (Local Draft vs. Base Snapshot vs. Current Server DB)
 * - Server Wins on external conflicts (with conflict notice generation)
 * - Clean localStorage clear helper for post-save cleanup (Phase D ready)
 */

export const DRAFT_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours in milliseconds

export function getDraftStorageKey(quotationId) {
  return `quotation_draft_${quotationId}`;
}

/**
 * Robust item comparison between a DB snapshot item and current DB item.
 * Returns true if the items are content-identical, false if modified on server.
 */
export function areDbItemsEqual(itemA, itemB) {
  if (!itemA || !itemB) return false;

  const isAds =
    itemA._type === "ads" ||
    itemB._type === "ads" ||
    itemA.service_name === "Ads Campaign" ||
    itemB.service_name === "Ads Campaign";

  if (isAds) {
    const catA = String(itemA.category_name || itemA.category || "").trim().toLowerCase();
    const catB = String(itemB.category_name || itemB.category || "").trim().toLowerCase();
    const budgetA = Number(itemA.budget || itemA.amount || 0);
    const budgetB = Number(itemB.budget || itemB.amount || 0);
    const totalA = Number(itemA.total || itemA.total_amount || 0);
    const totalB = Number(itemB.total || itemB.total_amount || 0);
    return catA === catB && budgetA === budgetB && totalA === totalB;
  }

  // Graphic / Complimentary service comparison
  const svcA = String(itemA.service_name || "").trim().toLowerCase();
  const svcB = String(itemB.service_name || "").trim().toLowerCase();
  const catA = String(itemA.category_name || "").trim().toLowerCase();
  const catB = String(itemB.category_name || "").trim().toLowerCase();
  const etA = String(itemA.editing_type_name || "").trim().toLowerCase();
  const etB = String(itemB.editing_type_name || "").trim().toLowerCase();
  const qtyA = Number(itemA.quantity || 1);
  const qtyB = Number(itemB.quantity || 1);
  const totalA = Number(itemA.total_amount || itemA.total_price || 0);
  const totalB = Number(itemB.total_amount || itemB.total_price || 0);

  return svcA === svcB && catA === catB && etA === etB && qtyA === qtyB && totalA === totalB;
}

/**
 * Check if a timestamp is older than 48 hours.
 */
export function isDraftExpired(timestamp, now = Date.now()) {
  if (!timestamp) return true;
  return Number(now) - Number(timestamp) > DRAFT_TTL_MS;
}

/**
 * Get draft from storage.
 */
export function getQuotationDraft(
  quotationId,
  storage = typeof window !== "undefined" ? window.localStorage : null
) {
  if (!quotationId || !storage) return null;
  try {
    const raw = storage.getItem(getDraftStorageKey(quotationId));
    if (!raw) return null;
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (e) {
    return null;
  }
}

/**
 * Save draft into storage with timestamp and base snapshot.
 */
export function saveQuotationDraft({
  quotationId,
  draftItems = [],
  discount = null,
  notes = undefined,
  baseDbSnapshot = [],
  storage = typeof window !== "undefined" ? window.localStorage : null,
  now = Date.now(),
}) {
  if (!quotationId || !storage) return false;
  try {
    let effectiveNotes = notes;
    if (effectiveNotes === undefined) {
      const existing = getQuotationDraft(quotationId, storage);
      effectiveNotes = existing?.notes || null;
    }

    const payload = {
      quotationId: String(quotationId),
      timestamp: Number(now),
      draftItems,
      discount,
      notes: effectiveNotes,
      baseDbSnapshot,
    };
    const serialized = JSON.stringify(payload);
    storage.setItem(getDraftStorageKey(quotationId), serialized);
    return true;
  } catch (e) {
    console.warn("Failed to persist quotation draft to localStorage:", e);
    return false;
  }
}

/**
 * Remove draft from storage (called on Discard or on Save-Success).
 */
export function clearQuotationDraft(
  quotationId,
  storage = typeof window !== "undefined" ? window.localStorage : null
) {
  if (!quotationId || !storage) return false;
  try {
    storage.removeItem(getDraftStorageKey(quotationId));
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Check draft status on page load:
 * - If no draft exists: returns { hasDraft: false, restoreAvailable: false }
 * - If draft expired (> 48h): SILENTLY discards from storage, returns { hasDraft: false, restoreAvailable: false, expired: true }
 * - If draft valid (<= 48h): returns { hasDraft: true, restoreAvailable: true, draft, itemCount, timestamp }
 */
export function checkDraftStatus({
  quotationId,
  storage = typeof window !== "undefined" ? window.localStorage : null,
  now = Date.now(),
}) {
  if (!quotationId || !storage) {
    return { hasDraft: false, restoreAvailable: false, draft: null };
  }

  const draft = getQuotationDraft(quotationId, storage);
  if (!draft) {
    return { hasDraft: false, restoreAvailable: false, draft: null };
  }

  if (isDraftExpired(draft.timestamp, now)) {
    // 48h expired -> silently discard
    clearQuotationDraft(quotationId, storage);
    return { hasDraft: false, restoreAvailable: false, expired: true, draft: null };
  }

  const items = Array.isArray(draft.draftItems) ? draft.draftItems : [];
  return {
    hasDraft: true,
    restoreAvailable: true,
    expired: false,
    draft,
    itemCount: items.length,
    timestamp: draft.timestamp,
  };
}

/**
 * 3-Way Conflict Merge Algorithm:
 * - draft: The stored draft object containing draftItems and baseDbSnapshot.
 * - currentDbItems: Fresh items fetched from the database on page load.
 *
 * Rules:
 * 1. draft- prefix items (created locally, never saved in DB):
 *    -> Keep as-is in merged state with _status: 'pending_add'.
 * 2. Numeric ID items (existed in DB when draft was initiated):
 *    - Compare currentDbItem against baseDbSnapshot version:
 *      - If DB item is missing (deleted in DB on server):
 *        -> DB Wins. Local edit discarded. Conflict notice generated.
 *      - If DB item differs from baseDbSnapshot (modified in DB on server):
 *        -> DB Wins! Local edit discarded. Current DB item kept with _status: 'saved'.
 *           Conflict notice generated with oldDraftValue and newDbValue.
 *      - If DB item is identical to baseDbSnapshot (no external server change):
 *        -> Local Draft is valid! Keep draft item with its pending changes (_status).
 * 3. Any current DB items not present in draft:
 *    -> Keep in merged state with _status: 'saved'.
 */
export function mergeDraftWithDb({
  draft,
  currentDbItems = [],
}) {
  if (!draft) {
    return {
      mergedItems: currentDbItems.map((i) => ({ ...i, _status: i._status || "saved" })),
      conflictNotices: [],
      discount: null,
      hadConflicts: false,
    };
  }

  const baseSnapshot = Array.isArray(draft.baseDbSnapshot) ? draft.baseDbSnapshot : [];
  const draftItems = Array.isArray(draft.draftItems) ? draft.draftItems : [];
  const conflictNotices = [];
  const mergedItems = [];
  const handledDbItemIds = new Set();

  for (const draftItem of draftItems) {
    const isNewDraft = String(draftItem.id).startsWith("draft-");

    if (isNewDraft) {
      // 1. Newly created draft item (safe overlay)
      mergedItems.push({
        ...draftItem,
        _status: draftItem._status || "pending_add",
      });
      continue;
    }

    // 2. Numeric / existing DB item
    const currentDbItem = currentDbItems.find((dbItem) => String(dbItem.id) === String(draftItem.id));
    const baseItem = baseSnapshot.find((b) => String(b.id) === String(draftItem.id));

    if (!currentDbItem) {
      // Item was deleted in DB by another session
      conflictNotices.push({
        itemId: draftItem.id,
        type: "deleted_on_server",
        itemTitle: draftItem.service_name || draftItem.category_name || `Item #${draftItem.id}`,
        message: `Item #${draftItem.id} was deleted on the server by another session; local draft changes were discarded.`,
      });
      // DB Wins -> item is not kept
      continue;
    }

    handledDbItemIds.add(String(currentDbItem.id));

    // Check if the server data was modified since draft was taken
    const serverUnchanged = baseItem && areDbItemsEqual(currentDbItem, baseItem);

    if (!serverUnchanged) {
      // Server was modified externally! SERVER WINS.
      conflictNotices.push({
        itemId: draftItem.id,
        type: "modified_on_server",
        itemTitle: currentDbItem.service_name || currentDbItem.category_name || `Item #${draftItem.id}`,
        oldDraftValue: draftItem,
        newDbValue: currentDbItem,
        message: `Item "${currentDbItem.service_name || currentDbItem.category_name}" was updated on the server by another session; your unsaved draft edits were discarded in favor of server data.`,
      });
      mergedItems.push({
        ...currentDbItem,
        _status: "saved",
      });
    } else {
      // Server is unchanged: local draft edit is valid!
      mergedItems.push({
        ...draftItem,
      });
    }
  }

  // 3. Include any DB items that were not part of the draft
  for (const dbItem of currentDbItems) {
    if (!handledDbItemIds.has(String(dbItem.id))) {
      mergedItems.push({
        ...dbItem,
        _status: dbItem._status || "saved",
      });
    }
  }

  return {
    mergedItems,
    conflictNotices,
    discount: draft.discount || null,
    notes: draft.notes || null,
    hadConflicts: conflictNotices.length > 0,
  };
}

/**
 * Filter active items from draft by type and complimentary flag, excluding pending_delete items.
 */
export function getActiveDraftItemsByType(draft, type, isComplimentary = false) {
  if (!draft || !Array.isArray(draft.draftItems)) return [];
  return draft.draftItems.filter((i) => {
    if (i._status === "pending_delete") return false;
    if (i._type !== type) return false;
    if (type === "service") {
      const isComp = Boolean(
        i.is_complimentary ||
        i.include_in_total === false ||
        i.source === "custom_complimentary" ||
        i.source === "complimentary" ||
        String(i.service_name || i.service || "").toLowerCase().includes("(complimentary)") ||
        String(i.service_name || i.service || "").toLowerCase() === "complimentary"
      );
      return isComp === Boolean(isComplimentary);
    }
    return true;
  });
}

/**
 * Ensure a valid quotation draft exists in storage.
 * If not present, calls fetchDbSnapshot() to initialize draft baseline.
 */
export async function ensureQuotationDraft({
  quotationId,
  fetchDbSnapshot = null,
  storage = typeof window !== "undefined" ? window.localStorage : null,
}) {
  if (!quotationId || !storage) return null;
  const status = checkDraftStatus({ quotationId, storage });
  if (status.hasDraft && status.draft) {
    return status.draft;
  }

  let baseDbSnapshot = [];
  let discount = null;
  if (typeof fetchDbSnapshot === "function") {
    try {
      const snap = await fetchDbSnapshot();
      if (snap) {
        baseDbSnapshot = Array.isArray(snap.items) ? snap.items : [];
        discount = snap.discount || null;
      }
    } catch (e) {
      console.warn("fetchDbSnapshot failed in ensureQuotationDraft:", e);
    }
  }

  const newDraft = {
    quotationId: String(quotationId),
    timestamp: Date.now(),
    draftItems: [...baseDbSnapshot],
    discount,
    baseDbSnapshot,
  };

  saveQuotationDraft({
    quotationId,
    draftItems: newDraft.draftItems,
    discount: newDraft.discount,
    baseDbSnapshot: newDraft.baseDbSnapshot,
    storage,
  });

  return newDraft;
}

/**
 * Save or update a service item in the quotation localStorage draft.
 * - If an item with matching ID or (service_name + category_name + editing_type_name) exists:
 *   Updates quantity (replacing old quantity) and recalculates totals.
 * - Otherwise:
 *   Creates a new draft item with _status: 'pending_add'.
 * Zero direct DB calls.
 */
export async function saveServiceToQuotationDraft({
  quotationId,
  item,
  editId = null,
  isComplimentary = false,
  fetchDbSnapshot = null,
  storage = typeof window !== "undefined" ? window.localStorage : null,
}) {
  if (!quotationId || !item || !storage) {
    return { success: false, error: "Missing quotationId, item, or storage" };
  }

  const draft = await ensureQuotationDraft({ quotationId, fetchDbSnapshot, storage });
  const draftItems = Array.isArray(draft?.draftItems) ? [...draft.draftItems] : [];
  const baseDbSnapshot = Array.isArray(draft?.baseDbSnapshot) ? draft.baseDbSnapshot : [];

  const targetEditId = editId || item.id;
  let targetIndex = -1;

  if (targetEditId) {
    targetIndex = draftItems.findIndex(
      (r) => String(r.id) === String(targetEditId) && r._status !== "pending_delete"
    );
  }

  // If not found by editId, match by service signature (service_name + category_name + editing_type_name)
  if (targetIndex === -1) {
    targetIndex = draftItems.findIndex((r) => {
      if (r._status === "pending_delete") return false;
      if (r._type !== "service") return false;
      const isComp = Boolean(
        r.is_complimentary ||
        r.include_in_total === false ||
        r.source === "custom_complimentary" ||
        r.source === "complimentary" ||
        String(r.service_name || r.service || "").toLowerCase().includes("(complimentary)") ||
        String(r.service_name || r.service || "").toLowerCase() === "complimentary"
      );
      if (isComp !== Boolean(isComplimentary)) return false;

      return (
        String(r.service_name || "").trim().toLowerCase() ===
          String(item.service_name || "").trim().toLowerCase() &&
        String(r.category_name || "").trim().toLowerCase() ===
          String(item.category_name || "").trim().toLowerCase() &&
        String(r.editing_type_name || "").trim().toLowerCase() ===
          String(item.editing_type_name || "").trim().toLowerCase()
      );
    });
  }

  let updatedItem;
  if (targetIndex !== -1) {
    // Update existing item
    const existing = draftItems[targetIndex];
    const isOriginallyInDb = !String(existing.id).startsWith("draft-");
    updatedItem = {
      ...existing,
      ...item,
      id: existing.id,
      quantity: Number(item.quantity) || 1,
      total_amount: Number(item.total_amount || item.total_price || 0),
      total_price: Number(item.total_amount || item.total_price || 0),
      editing_type_amount: Number(item.editing_type_amount || item.unit_price || 0),
      unit_price: Number(item.unit_price || item.editing_type_amount || 0),
      additional_services: item.additional_services || null,
      additional_services_amount: Number(item.additional_services_amount || 0),
      include_content_posting: item.include_content_posting || 0,
      include_thumbnail_creation: item.include_thumbnail_creation || 0,
      include_youtube_video_posting: item.include_youtube_video_posting || 0,
      is_complimentary: Boolean(isComplimentary),
      include_in_total: !isComplimentary,
      _type: "service",
      _status: isOriginallyInDb ? "pending_edit" : "pending_add",
    };
    draftItems[targetIndex] = updatedItem;
  } else {
    // Create new draft item
    const newId = `draft-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    updatedItem = {
      ...item,
      id: newId,
      quantity: Number(item.quantity) || 1,
      total_amount: Number(item.total_amount || item.total_price || 0),
      total_price: Number(item.total_amount || item.total_price || 0),
      editing_type_amount: Number(item.editing_type_amount || item.unit_price || 0),
      unit_price: Number(item.unit_price || item.editing_type_amount || 0),
      is_complimentary: Boolean(isComplimentary),
      include_in_total: !isComplimentary,
      source: isComplimentary ? "custom_complimentary" : (item.source || "custom_graphic"),
      _type: "service",
      _status: "pending_add",
    };
    draftItems.push(updatedItem);
  }

  saveQuotationDraft({
    quotationId,
    draftItems,
    discount: draft?.discount || null,
    baseDbSnapshot,
    storage,
  });

  return {
    success: true,
    updatedItem,
    draftItems,
    draft: { ...draft, draftItems },
  };
}

/**
 * Save or update ads campaign item(s) in the quotation localStorage draft.
 * Zero direct DB calls.
 */
export async function saveAdsToQuotationDraft({
  quotationId,
  adsResults = [],
  fetchDbSnapshot = null,
  storage = typeof window !== "undefined" ? window.localStorage : null,
}) {
  if (!quotationId || !storage) {
    return { success: false, error: "Missing quotationId or storage" };
  }

  const draft = await ensureQuotationDraft({ quotationId, fetchDbSnapshot, storage });
  const draftItems = Array.isArray(draft?.draftItems) ? [...draft.draftItems] : [];
  const baseDbSnapshot = Array.isArray(draft?.baseDbSnapshot) ? draft.baseDbSnapshot : [];

  for (const ad of adsResults) {
    const catName = ad.category || ad.category_name;
    const targetIndex = draftItems.findIndex((r) => {
      if (r._status === "pending_delete") return false;
      if (r._type !== "ads") return false;
      const rCat = r.category || r.category_name;
      return String(rCat || "").trim().toLowerCase() === String(catName || "").trim().toLowerCase();
    });

    const budget = Number(ad.amount || ad.budget || 0);
    const total = Number(ad.total || ad.total_amount || budget);
    const percent = Number(ad.percent || 0);
    const charge = Number(ad.charge || 0);

    if (targetIndex !== -1) {
      const existing = draftItems[targetIndex];
      const isOriginallyInDb = !String(existing.id).startsWith("draft-");
      draftItems[targetIndex] = {
        ...existing,
        ...ad,
        id: existing.id,
        category: catName,
        category_name: catName,
        budget,
        amount: budget,
        percent,
        charge,
        total,
        total_amount: total,
        _type: "ads",
        include_in_total: true,
        is_complimentary: false,
        _status: isOriginallyInDb ? "pending_edit" : "pending_add",
      };
    } else {
      const newId = `draft-ads-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      draftItems.push({
        ...ad,
        id: newId,
        category: catName,
        category_name: catName,
        budget,
        amount: budget,
        percent,
        charge,
        total,
        total_amount: total,
        _type: "ads",
        include_in_total: true,
        is_complimentary: false,
        _status: "pending_add",
      });
    }
  }

  saveQuotationDraft({
    quotationId,
    draftItems,
    discount: draft?.discount || null,
    baseDbSnapshot,
    storage,
  });

  return {
    success: true,
    draftItems,
    draft: { ...draft, draftItems },
  };
}

/**
 * Delete / mark pending_delete an item in quotation localStorage draft.
 * - If draft- created locally: removes completely from draftItems.
 * - If existed in DB snapshot: marks _status: 'pending_delete'.
 * Zero direct DB calls.
 */
export function deleteItemFromQuotationDraft({
  quotationId,
  itemId,
  storage = typeof window !== "undefined" ? window.localStorage : null,
}) {
  if (!quotationId || !itemId || !storage) {
    return { success: false, error: "Missing quotationId, itemId, or storage" };
  }

  const draft = getQuotationDraft(quotationId, storage);
  if (!draft || !Array.isArray(draft.draftItems)) {
    return { success: false, error: "No draft found" };
  }

  let draftItems = [...draft.draftItems];
  const isNewDraft = String(itemId).startsWith("draft-");

  if (isNewDraft) {
    draftItems = draftItems.filter((i) => String(i.id) !== String(itemId));
  } else {
    draftItems = draftItems.map((i) =>
      String(i.id) === String(itemId) ? { ...i, _status: "pending_delete" } : i
    );
  }

  saveQuotationDraft({
    quotationId,
    draftItems,
    discount: draft.discount || null,
    baseDbSnapshot: draft.baseDbSnapshot || [],
    storage,
  });

  return {
    success: true,
    draftItems,
    draft: { ...draft, draftItems },
  };
}

/**
 * Save quotation notes directly into localStorage draft.
 * Zero direct DB calls.
 */
export async function saveNotesToQuotationDraft({
  quotationId,
  notes = [],
  fetchDbSnapshot = null,
  storage = typeof window !== "undefined" ? window.localStorage : null,
  now = Date.now(),
}) {
  if (!quotationId || !storage) {
    return { success: false, error: "Missing quotationId or storage" };
  }

  const draft = await ensureQuotationDraft({ quotationId, fetchDbSnapshot, storage });
  const draftItems = Array.isArray(draft?.draftItems) ? [...draft.draftItems] : [];
  const baseDbSnapshot = Array.isArray(draft?.baseDbSnapshot) ? draft.baseDbSnapshot : [];
  const discount = draft?.discount || null;

  saveQuotationDraft({
    quotationId,
    draftItems,
    discount,
    notes,
    baseDbSnapshot,
    storage,
    now,
  });

  return {
    success: true,
    notes,
    draft: { ...draft, notes },
  };
}
