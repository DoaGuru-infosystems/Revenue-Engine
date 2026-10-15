import axios from "axios";
import API_BASE_URL from "../../../config/apiBaseUrl";

/**
 * Calculator & Services API Service
 * Centralized HTTP service for Graphic/SEO calculator, Ads Campaign calculator, Complimentary services, and Service Catalog.
 */

export const getAddServices = async (token) => {
  const { data } = await axios.get(
    `${API_BASE_URL}/auth/api/re_calculator/getAddServices`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};

export const getAdsServices = async (token) => {
  const { data } = await axios.get(
    `${API_BASE_URL}/auth/api/re_calculator/getAdsServices`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return data;
};

export const getDiscountSetting = async (token) => {
  const { data } = await axios.get(
    `${API_BASE_URL}/auth/api/re_calculator/getDiscountSetting`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};

export const getNoteData = async (token) => {
  const { data } = await axios.get(
    `${API_BASE_URL}/auth/api/re_calculator/getNoteData`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};

export const insertNoteData = async (payload, token) => {
  const { data } = await axios.post(
    `${API_BASE_URL}/auth/api/re_calculator/insertNoteData`,
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};

export const getClientDetailsById = async (id, token) => {
  const { data } = await axios.get(
    `${API_BASE_URL}/auth/api/re_calculator/getClientDetailsById/${id}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};

export const getCalculatorTransactions = async (proposalId, id, token) => {
  const { data } = await axios.get(
    `${API_BASE_URL}/auth/api/re_calculator/getByIDCalculatorTransactions/${proposalId}/${id}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};

export const saveCalculatorData = async (payload, token, isUpdate = false) => {
  const endpoint = isUpdate
    ? `${API_BASE_URL}/auth/api/re_calculator/updateCalculatorTransactions`
    : `${API_BASE_URL}/auth/api/re_calculator/saveCalculatorData`;
  const { data } = await axios.post(endpoint, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const updateCalculatorTransactionsById = async (editId, payload, token) => {
  const { data } = await axios.put(
    `${API_BASE_URL}/auth/api/re_calculator/updateCalculatorTransactionsById/${editId}`,
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};

export const deleteGraphicEntryById = async (id, token) => {
  const { data } = await axios.delete(
    `${API_BASE_URL}/auth/api/re_calculator/deleteGraphicEntryById/${id}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};

export const getAdsCampaignDetails = async (proposalId, id, token) => {
  const { data } = await axios.get(
    `${API_BASE_URL}/auth/api/re_calculator/getByIDAdsCampaignDetails/${proposalId}/${id}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};

export const saveAdsCampaignData = async (payload, token, isUpdate = false) => {
  const endpoint = isUpdate
    ? `${API_BASE_URL}/auth/api/re_calculator/updateAdsCampaignDetails`
    : `${API_BASE_URL}/auth/api/re_calculator/insertAdsCampaignDetails`;
  const { data } = await axios.post(endpoint, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const deleteAdsCampaignEntryById = async (id, token) => {
  const { data } = await axios.delete(
    `${API_BASE_URL}/auth/api/re_calculator/deleteAdsCampaignEntryById/${id}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};

export const getComplimentaryData = async (proposalId, id, token) => {
  const { data } = await axios.get(
    `${API_BASE_URL}/auth/api/re_calculator/getByIDComplimentaryData/${proposalId}/${id}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};

export const saveComplimentaryData = async (payload, token, isUpdate = false) => {
  const endpoint = isUpdate
    ? `${API_BASE_URL}/auth/api/re_calculator/updateComplimenatryData`
    : `${API_BASE_URL}/auth/api/re_calculator/saveComplimenatryData`;
  const { data } = await axios.post(endpoint, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const deleteComplimentaryById = async (id, token) => {
  const { data } = await axios.delete(
    `${API_BASE_URL}/auth/api/re_calculator/deleteComplimenatryById/${id}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};

export const insertService = async (serviceName, token) => {
  const { data } = await axios.post(
    `${API_BASE_URL}/auth/api/re_calculator/insertServices`,
    { service_name: serviceName },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};

export const insertCategory = async (payload, token) => {
  const { data } = await axios.post(
    `${API_BASE_URL}/auth/api/re_calculator/insertCategory`,
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};

export const insertEditingType = async (payload, token) => {
  const { data } = await axios.post(
    `${API_BASE_URL}/auth/api/re_calculator/insertEditingType`,
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};

// ── Graphic Calculator Dedicated Services (Layer 1) ──────────────────────────

export const getServiceCategoryEditingTree = async (token) => {
  const { data } = await axios.get(
    `${API_BASE_URL}/auth/api/re_calculator/services/category/editing`,
    token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
  );
  return data;
};

export const getOptionalServiceAmounts = async (token) => {
  const { data } = await axios.get(
    `${API_BASE_URL}/auth/api/re_calculator/optional-service-amounts`,
    token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
  );
  return data;
};

export const getGraphicDiscount = async (proposalId, id, token) => {
  const { data } = await axios.get(
    `${API_BASE_URL}/auth/api/re_calculator/getByIDDiscountData/${id}/${proposalId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};

export const saveGraphicDiscountData = async (payload, token, editId = null) => {
  const endpoint = editId
    ? `${API_BASE_URL}/auth/api/re_calculator/updateDiscountDataById/${editId}`
    : `${API_BASE_URL}/auth/api/re_calculator/saveDiscountData`;
  const method = editId ? axios.put : axios.post;
  const { data } = await method(endpoint, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const deleteDiscountById = async (id, token) => {
  const { data } = await axios.delete(
    `${API_BASE_URL}/auth/api/re_calculator/deleteDiscountById/${id}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};

export const getProformaSnapshot = async (proposalId, token) => {
  const { data } = await axios.get(
    `${API_BASE_URL}/auth/api/re_calculator/proformas/snapshot/${proposalId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};

export const updateProformaSnapshot = async (payload, token) => {
  const { data } = await axios.put(
    `${API_BASE_URL}/auth/api/re_calculator/proformas/snapshot`,
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};

export const saveGraphicService = async (payload, token, editId = null) => {
  const endpoint = editId
    ? `${API_BASE_URL}/auth/api/re_calculator/updateGraphicEntryById/${editId}`
    : `${API_BASE_URL}/auth/api/re_calculator/saveCalculatorData`;
  const method = editId ? axios.put : axios.post;
  const { data } = await method(endpoint, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const getClientNotesById = async (proposalId, id, token) => {
  const { data } = await axios.get(
    `${API_BASE_URL}/auth/api/re_calculator/getClientNotesbyId/${id}/${proposalId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};

export const saveClientIdwiseNotes = async (payload, token) => {
  const { data } = await axios.post(
    `${API_BASE_URL}/auth/api/re_calculator/saveClientIdwiseNotes`,
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};

export const deletePlanClientNote = async (noteId, token) => {
  const { data } = await axios.delete(
    `${API_BASE_URL}/auth/api/re_calculator/deletePlanClientNotes/${noteId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};

export const saveClientNoteByPlan = async (formData, token, editId = null) => {
  const endpoint = editId
    ? `${API_BASE_URL}/auth/api/re_calculator/updateClientNoteDataById/${editId}`
    : `${API_BASE_URL}/auth/api/re_calculator/addNotebyplan`;
  const method = editId ? axios.put : axios.post;
  const { data } = await method(endpoint, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return data;
};

