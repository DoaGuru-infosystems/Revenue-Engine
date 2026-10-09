import axios from "axios";
import API_BASE_URL from "../../../config/apiBaseUrl";

const getAuthHeaders = (token) => {
  const currentToken = token || localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
  };
};

export const bdService = {
  async getAssignedQuotationsByEmployee(employeeName, token) {
    const res = await axios.get(
      `${API_BASE_URL}/auth/api/re_calculator/assigned-quotations/by-employee/${encodeURIComponent(employeeName)}`,
      { headers: getAuthHeaders(token) }
    );
    return res.data;
  },

  async getAllRequirements(token) {
    const res = await axios.get(`${API_BASE_URL}/auth/api/re_calculator/requirements`, {
      headers: getAuthHeaders(token),
    });
    return res.data;
  },

  async getAllPlanData(token) {
    const res = await axios.get(`${API_BASE_URL}/auth/api/re_calculator/getAllPlanData`, {
      headers: getAuthHeaders(token),
    });
    return res.data;
  },

  async getPlanNotes(token) {
    const res = await axios.get(`${API_BASE_URL}/auth/api/re_calculator/getPlanNotes`, {
      headers: getAuthHeaders(token),
    });
    return res.data;
  },

  async saveAdsCampaign(adsItems, token) {
    const res = await axios.post(
      `${API_BASE_URL}/auth/api/re_calculator/saveAdsCampaign`,
      { adsItems },
      { headers: getAuthHeaders(token) }
    );
    return res.data;
  },

  async saveComplimentaryData(item, token) {
    const res = await axios.post(
      `${API_BASE_URL}/auth/api/re_calculator/saveComplimentaryData`,
      item,
      { headers: getAuthHeaders(token) }
    );
    return res.data;
  },
};

export default bdService;
