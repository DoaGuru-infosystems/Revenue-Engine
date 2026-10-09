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
