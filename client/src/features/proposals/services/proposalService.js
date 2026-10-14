import axios from "axios";
import API_BASE_URL from "../../../config/apiBaseUrl";

/**
 * Proposals API Service
 * Centralized HTTP service for proposal management, custom services, client fetching, and PDF generation.
 */

export const getClientDetailsById = async (clientId, token) => {
  const { data } = await axios.get(
    `${API_BASE_URL}/auth/api/re_calculator/getClientDetailsById/${clientId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};

export const getClients = async (token) => {
  const response = await axios.get(
    `${API_BASE_URL}/auth/api/re_calculator/getClientDetails`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const createClient = async (clientData, token) => {
  const response = await axios.post(
    `${API_BASE_URL}/auth/api/re_calculator/addClientDetails`,
    clientData,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const getNoteData = async (token) => {
  const { data } = await axios.get(
    `${API_BASE_URL}/auth/api/re_calculator/getNoteData`,
    { headers: { Authorization: `Bearer ${token}` } }
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

export const getAllPlanData = async (token) => {
  const { data } = await axios.get(
    `${API_BASE_URL}/auth/api/re_calculator/getAllPlanData`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};

export const getCustomServicesFromDB = async (proposalId, clientId, token) => {
  const headers = { Authorization: `Bearer ${token}` };

  const fetchGraphic = axios
    .get(`${API_BASE_URL}/auth/api/re_calculator/getByIDCalculatorTransactions/${proposalId}/${clientId}`, { headers })
    .catch(() => ({ data: { status: "Failure", data: [] } }));

  const fetchAds = axios
    .get(`${API_BASE_URL}/auth/api/re_calculator/getByIDAdsCampaignDetails/${proposalId}/${clientId}`, { headers })
    .catch(() => ({ data: { status: "Failure", data: [] } }));

  const fetchComplimentary = axios
    .get(`${API_BASE_URL}/auth/api/re_calculator/getByIDComplimentaryData/${proposalId}/${clientId}`, { headers })
    .catch(() => ({ data: { status: "Failure", data: [] } }));

  const [graphicRes, adsRes, compRes] = await Promise.all([fetchGraphic, fetchAds, fetchComplimentary]);

  const graphicData = graphicRes.data?.status === "Success" ? graphicRes.data.data : [];
  const adsData = adsRes.data?.status === "Success" ? adsRes.data.data : [];
  const compData = compRes.data?.status === "Success" ? compRes.data.data : [];

  return [
    ...graphicData.map((item) => {
      let additional_services = [];
      if (item.additional_services) {
        try {
          additional_services = typeof item.additional_services === "string"
            ? JSON.parse(item.additional_services)
            : item.additional_services;
          if (!Array.isArray(additional_services)) additional_services = [];
        } catch {
          additional_services = [];
        }
      }
      const qty = Number(item.quantity) || 1;
      const base = Number(item.editing_type_amount || item.price || item.unit_price || 0);
      const baseTotal = base * qty;
      const addonsTotal = additional_services.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
      const recordedTotal = Number(item.total_amount || item.total_price || 0);
      const effectiveTotal = (recordedTotal >= baseTotal + addonsTotal && recordedTotal > 0)
        ? recordedTotal
        : (recordedTotal > 0 ? recordedTotal : baseTotal) + addonsTotal;

      return {
        id: item.id,
        service: (item.editing_type_name && item.editing_type_name !== "null")
          ? `${item.service_name} - ${item.category_name} (${item.editing_type_name})`
          : `${item.service_name} - ${item.category_name}`,
        service_name: item.service_name,
        category_name: item.category_name,
        editing_type_name: item.editing_type_name,
        quantity: qty,
        unit_price: base > 0 ? base : (effectiveTotal / qty),
        total_price: effectiveTotal,
        total_amount: effectiveTotal,
        additional_services,
        include_in_total: true,
        source: "custom_graphic",
      };
    }),
    ...adsData.map((item) => ({
      id: item.id,
      service: `Ads Campaign - ${item.category}`,
      service_name: "Ads Campaign",
      category_name: item.category,
      quantity: 1,
      unit_price: Number(item.total),
      total_price: Number(item.total),
      include_in_total: true,
      source: "custom_ads",
      budget: Number(item.amount),
      percent: Number(item.percent),
      charge: Number(item.charge),
    })),
    ...compData.map((item) => ({
      id: item.id,
      service: (item.editing_type_name && item.editing_type_name !== "null")
        ? `${item.service_name} - ${item.category_name} (${item.editing_type_name})`
        : `${item.service_name} - ${item.category_name}`,
      service_name: item.service_name,
      category_name: item.category_name,
      editing_type_name: item.editing_type_name,
      quantity: item.quantity,
      unit_price: Number(item.editing_type_amount),
      total_price: Number(item.total_amount),
      include_in_total: false,
      source: "custom_complimentary",
    })),
  ];
};

export const getProposalById = async (proposalId, token) => {
  const { data } = await axios.get(
    `${API_BASE_URL}/auth/api/re_calculator/proposal/${proposalId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};

export const getAllProposals = async (token) => {
  const { data } = await axios.get(
    `${API_BASE_URL}/auth/api/re_calculator/proposals/all`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return data;
};

export const saveProposal = async (proposalId, payload, token) => {
  const headers = { Authorization: `Bearer ${token}` };
  if (proposalId) {
    return await axios.put(`${API_BASE_URL}/auth/api/re_calculator/proposal/${proposalId}`, payload, { headers });
  } else {
    return await axios.post(`${API_BASE_URL}/auth/api/re_calculator/proposal`, payload, { headers });
  }
};

export const deleteProposal = async (proposalId, token) => {
  return await axios.delete(
    `${API_BASE_URL}/auth/api/re_calculator/proposal/${proposalId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

export const deleteGraphicEntryById = async (id, token) => {
  return await axios.delete(
    `${API_BASE_URL}/auth/api/re_calculator/deleteGraphicEntryById/${id}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

export const deleteAdsCampaignEntryById = async (id, token) => {
  return await axios.delete(
    `${API_BASE_URL}/auth/api/re_calculator/deleteAdsCampaignEntryById/${id}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

export const deleteComplimentaryById = async (id, token) => {
  return await axios.delete(
    `${API_BASE_URL}/auth/api/re_calculator/deleteComplimenatryById/${id}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

export const generateProposalPdf = async (proposalId, token) => {
  const { data } = await axios.post(
    `${API_BASE_URL}/auth/api/re_calculator/proposal/${proposalId}/pdf`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};

export const sendProposal = async (proposalId, channel, token) => {
  const { data } = await axios.post(
    `${API_BASE_URL}/auth/api/re_calculator/proposal/${proposalId}/send`,
    { channel },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};

export const updateProposalStatus = async (proposalId, status, token) => {
  const { data } = await axios.put(
    `${API_BASE_URL}/auth/api/re_calculator/proposal/${proposalId}/status`,
    { status },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};

export const getPublicProposal = async (token) => {
  const response = await fetch(`${API_BASE_URL}/auth/api/re_calculator/public/proposal/${token}`);
  const result = await response.json();
  return { ok: response.ok, status: response.status, result };
};

export const generatePublicProposalPdf = async (token) => {
  const { data } = await axios.post(
    `${API_BASE_URL}/auth/api/re_calculator/public/proposal/${token}/pdf`,
    {}
  );
  return data;
};
