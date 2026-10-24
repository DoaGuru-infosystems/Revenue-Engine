import axios from "axios";
import API_BASE_URL from "../../../config/apiBaseUrl";

/**
 * Helper to construct request headers with JWT token.
 * Falls back to localStorage token if not explicitly provided.
 */
const getAuthHeaders = (token) => {
  const authToken = token || localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
  };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  return headers;
};

// ==========================================
// 1. DATA FETCHING APIS
// ==========================================

/**
 * Fetch quotation/proforma service history for a client & txn
 */
export const fetchClientServiceHistory = async (clientId, txnId, token) => {
  const response = await axios.get(
    `${API_BASE_URL}/auth/api/re_calculator/getClientServiceHistory/${clientId}/${txnId}`,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};

/**
 * Fetch quotation/proforma client notes by client ID & txn ID
 */
export const fetchClientNotes = async (clientId, txnId, token) => {
  const response = await axios.get(
    `${API_BASE_URL}/auth/api/re_calculator/getClientNotesbyId/${clientId}/${txnId}`,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};

/**
 * Fetch quotation/proforma complimentary data
 */
export const fetchByIDComplimentaryData = async (txnId, clientId, token) => {
  const response = await axios.get(
    `${API_BASE_URL}/auth/api/re_calculator/getByIDComplimentaryData/${txnId}/${clientId}`,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};

/**
 * Fetch invoice service history for a client & txn
 */
export const fetchInvoiceServices = async (clientId, txnId, token) => {
  const response = await axios.get(
    `${API_BASE_URL}/auth/api/re_calculator/getinInvoiceServiceHistory/${clientId}/${txnId}`,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};

/**
 * Fetch client details for an invoice by client ID & txn ID
 */
export const fetchInvoiceClientDetails = async (clientId, txnId, token) => {
  const response = await axios.get(
    `${API_BASE_URL}/auth/api/re_calculator/getInvoiceClientDetailsById/${clientId}/${txnId}`,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};

/**
 * Fetch client notes by client ID & txn ID
 */
export const fetchInvoiceClientNotes = async (clientId, txnId, token) => {
  const response = await axios.get(
    `${API_BASE_URL}/auth/api/re_calculator/getInvoiceClientNotesbyId/${clientId}/${txnId}`,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};

/**
 * Fetch complimentary items for a client & txn
 */
export const fetchInvoiceComplimentaryData = async (clientId, txnId, token) => {
  const response = await axios.get(
    `${API_BASE_URL}/auth/api/re_calculator/getComplimentaryInvoiceData/${txnId}/${clientId}`,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};

/**
 * Fetch document-scoped discount
 */
export const fetchDiscountByDocument = async (clientId, txnId, token) => {
  const response = await axios.get(
    `${API_BASE_URL}/auth/api/re_calculator/getDiscountByDocument/${clientId}/${txnId}`,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};

/**
 * Direct discount lookup by txn_id fallback
 */
export const fetchDiscountById = async (clientId, txnId, token) => {
  const response = await axios.get(
    `${API_BASE_URL}/auth/api/re_calculator/getByIDDiscountData/${clientId}/${txnId}`,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};

/**
 * Fetch global discount configuration settings
 */
export const fetchDiscountSettings = async (token) => {
  const response = await axios.get(
    `${API_BASE_URL}/auth/api/re_calculator/getDiscountSetting`,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};

/**
 * Fetch predefined default notes
 */
export const fetchPredefinedNotes = async (isBalanceProforma, token) => {
  const endpoint = isBalanceProforma
    ? `${API_BASE_URL}/auth/api/re_calculator/getNotesbydefault`
    : `${API_BASE_URL}/auth/api/re_calculator/getInvoiceNoteData`;

  const response = await axios.get(endpoint, {
    headers: getAuthHeaders(token),
  });
  return response.data;
};

/**
 * Fetch additional services for a client & txn
 */
export const fetchAdditionalServices = async (clientId, txnId, token) => {
  const response = await axios.get(
    `${API_BASE_URL}/auth/api/re_calculator/getAdditionByIdData/${clientId}/${txnId}`,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};

/**
 * Fetch remaining amount entries
 */
export const fetchRemainingAmountData = async (clientId, txnId, token) => {
  const response = await axios.get(
    `${API_BASE_URL}/auth/api/re_calculator/getRemainingAmountByIdData/${clientId}/${txnId}`,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};

/**
 * Fetch proforma payments recorded for a client
 */
export const fetchProformaPayments = async (clientId, token) => {
  const response = await axios.get(
    `${API_BASE_URL}/auth/api/re_calculator/proposal-payments/client/${clientId}`,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};

/**
 * Fetch proformas generated for a client
 */
export const fetchClientProformas = async (clientId, token) => {
  const response = await axios.get(
    `${API_BASE_URL}/auth/api/re_calculator/proforma/client/${clientId}`,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};

/**
 * Fetch proposal by proposal ID
 */
export const fetchProposalById = async (proposalId, token) => {
  const response = await axios.get(
    `${API_BASE_URL}/auth/api/re_calculator/proposal/${proposalId}`,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};

/**
 * Fetch client master details by client ID
 */
export const fetchClientDetailsById = async (clientId, token) => {
  const response = await axios.get(
    `${API_BASE_URL}/auth/api/re_calculator/getClientDetailsById/${clientId}`,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};

/**
 * Fetch balance proforma record by txn ID
 */
export const fetchBalanceProformaById = async (txnId, token) => {
  const response = await axios.get(
    `${API_BASE_URL}/auth/api/re_calculator/balance-proforma/${txnId}`,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};

// ==========================================
// 2. MUTATION APIS (SAVE / UPDATE / DELETE)
// ==========================================

/**
 * Create discount entry
 */
export const saveDiscountData = async (payload, token) => {
  const response = await axios.post(
    `${API_BASE_URL}/auth/api/re_calculator/saveDiscountData`,
    payload,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};

/**
 * Update existing discount entry
 */
export const updateDiscountData = async (discountId, payload, token) => {
  const response = await axios.put(
    `${API_BASE_URL}/auth/api/re_calculator/updateDiscountDataById/${discountId}`,
    payload,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};

/**
 * Delete discount entry by ID
 */
export const deleteDiscountById = async (discountId, token) => {
  const response = await axios.delete(
    `${API_BASE_URL}/auth/api/re_calculator/deleteDiscountById/${discountId}`,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};

/**
 * Save remaining payment entry
 */
export const saveRemainingAmountData = async (payload, token) => {
  const response = await axios.post(
    `${API_BASE_URL}/auth/api/re_calculator/saveRemainingAmountData`,
    payload,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};

/**
 * Update remaining payment entry
 */
export const updateRemainingAmountData = async (remainingId, payload, token) => {
  const response = await axios.put(
    `${API_BASE_URL}/auth/api/re_calculator/updateRemainingDataById/${remainingId}`,
    payload,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};

/**
 * Add custom note
 */
export const saveClientNote = async (payload, token) => {
  const response = await axios.post(
    `${API_BASE_URL}/auth/api/re_calculator/addNotebyplan`,
    payload,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};

/**
 * Update custom note
 */
export const updateClientNote = async (noteId, payload, token) => {
  const response = await axios.put(
    `${API_BASE_URL}/auth/api/re_calculator/updateInvoiceClientNoteDataById/${noteId}`,
    payload,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};

/**
 * Delete custom note by ID
 */
export const deleteClientNote = async (noteId, token) => {
  const response = await axios.delete(
    `${API_BASE_URL}/auth/api/re_calculator/deleteInvoiceClientNotes/${noteId}`,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};

/**
 * Save/Update proforma discount
 */
export const saveProformaDiscount = async (proformaId, payload, token) => {
  const response = await axios.put(
    `${API_BASE_URL}/auth/api/re_calculator/proforma/${proformaId}/discount`,
    payload,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};

/**
 * Save/Update proforma adjustment
 */
export const saveProformaAdjustment = async (proformaId, adjustmentAmount, token) => {
  const response = await axios.put(
    `${API_BASE_URL}/auth/api/re_calculator/proforma/${proformaId}/adjustment`,
    { adjustment_amount: adjustmentAmount },
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};

/**
 * Save client id wise notes (plan notes)
 */
export const saveClientIdwiseNotes = async (payload, token) => {
  const response = await axios.post(
    `${API_BASE_URL}/auth/api/re_calculator/saveClientIdwiseNotes`,
    payload,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};

/**
 * Update plan client note by ID
 */
export const updatePlanClientNoteById = async (noteId, payload, token) => {
  const response = await axios.put(
    `${API_BASE_URL}/auth/api/re_calculator/updateClientNoteDataById/${noteId}`,
    payload,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};

/**
 * Delete plan client note by ID
 */
export const deletePlanClientNotes = async (noteId, token) => {
  const response = await axios.delete(
    `${API_BASE_URL}/auth/api/re_calculator/deletePlanClientNotes/${noteId}`,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};

/**
 * Update balance proforma notes
 */
export const updateBalanceProformaNotes = async (txnId, notes, token) => {
  const response = await axios.put(
    `${API_BASE_URL}/auth/api/re_calculator/balance-proforma/${txnId}/notes`,
    { notes },
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};

/**
 * Update regular proforma notes (saved in re_proposal_proforma.notes_snapshot)
 */
export const updateProformaNotes = async (proformaId, notes, token) => {
  const response = await axios.put(
    `${API_BASE_URL}/auth/api/re_calculator/proformas/snapshot`,
    {
      proformaId,
      action: "set",
      snapshotType: "notes",
      item: notes,
    },
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};

/**
 * Fetch quotation by ID (re_quotation with services and ads)
 */
export const fetchQuotationById = async (quotationId, token) => {
  const response = await axios.get(
    `${API_BASE_URL}/auth/api/re_calculator/quotation/${quotationId}`,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};

/**
 * Update quotation notes, discount, and grand total excl gst
 */
export const updateQuotationNotes = async (quotationId, payload, token) => {
  const response = await axios.patch(
    `${API_BASE_URL}/auth/api/re_calculator/quotation/${quotationId}/notes`,
    payload,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
};


