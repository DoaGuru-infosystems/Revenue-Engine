import axios from "axios";
import API_BASE_URL from "../../../config/apiBaseUrl";

const getAuthHeaders = (token) => {
  const currentToken = token || localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
  };
};

export const adminService = {
  // --- Team Management ---
  async getEmployees(token) {
    const res = await axios.get(`${API_BASE_URL}/auth/api/re_calculator/retrieveUser`, {
      headers: getAuthHeaders(token),
    });
    return res.data;
  },

  async getTeams(token) {
    const res = await axios.get(`${API_BASE_URL}/auth/api/re_calculator/retrieveTeam`, {
      headers: getAuthHeaders(token),
    });
    return res.data;
  },

  async getTeamById(teamId, token) {
    const res = await axios.get(`${API_BASE_URL}/auth/api/re_calculator/retrieveTeamById/${teamId}`, {
      headers: getAuthHeaders(token),
    });
    return res.data;
  },

  async createTeam(teamData, token) {
    const res = await axios.post(`${API_BASE_URL}/auth/api/re_calculator/createTeam`, teamData, {
      headers: getAuthHeaders(token),
    });
    return res.data;
  },

  async addMembersToTeam(teamId, memberIds, token) {
    const res = await axios.post(
      `${API_BASE_URL}/auth/api/re_calculator/addMembersToTeam/${teamId}/members`,
      { members: memberIds },
      { headers: getAuthHeaders(token) }
    );
    return res.data;
  },

  async removeMemberFromTeam(teamId, memberId, token) {
    const res = await axios.delete(
      `${API_BASE_URL}/auth/api/re_calculator/removeMemberFromTeam/${teamId}/members/${memberId}`,
      { headers: getAuthHeaders(token) }
    );
    return res.data;
  },

  async deleteTeam(teamId, token) {
    const res = await axios.delete(`${API_BASE_URL}/auth/api/re_calculator/deleteTeam/${teamId}`, {
      headers: getAuthHeaders(token),
    });
    return res.data;
  },

  // --- BD Management ---
  async registerBD(bdData, token) {
    const res = await axios.post(`${API_BASE_URL}/auth/api/re_calculator/registerBD`, bdData, {
      headers: getAuthHeaders(token),
    });
    return res.data;
  },

  async getAllBDs(token) {
    const res = await axios.get(`${API_BASE_URL}/auth/api/re_calculator/getAllBD`, {
      headers: getAuthHeaders(token),
    });
    return res.data;
  },

  // --- Plan Management ---
  async getAllPlanDetails(token) {
    const res = await axios.get(`${API_BASE_URL}/auth/api/re_calculator/getAllPlanDetails`, {
      headers: getAuthHeaders(token),
    });
    return res.data;
  },

  async addPlan(planData, token) {
    const res = await axios.post(`${API_BASE_URL}/auth/api/re_calculator/addPlan`, planData, {
      headers: getAuthHeaders(token),
    });
    return res.data;
  },

  async updatePlan(planId, planData, token) {
    const res = await axios.put(`${API_BASE_URL}/auth/api/re_calculator/updatePlan/${planId}`, planData, {
      headers: getAuthHeaders(token),
    });
    return res.data;
  },

  async deletePlan(planId, token) {
    const res = await axios.delete(`${API_BASE_URL}/auth/api/re_calculator/deletePlan/${planId}`, {
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

  async savePlanNotes(noteData, token) {
    const res = await axios.post(`${API_BASE_URL}/auth/api/re_calculator/savePlanNotes`, noteData, {
      headers: getAuthHeaders(token),
    });
    return res.data;
  },

  async deletePlanNotes(noteId, token) {
    const res = await axios.delete(`${API_BASE_URL}/auth/api/re_calculator/deletePlanNotes/${noteId}`, {
      headers: getAuthHeaders(token),
    });
    return res.data;
  },

  // --- Requirements & Links ---
  async getAllRequirements(token) {
    const res = await axios.get(`${API_BASE_URL}/auth/api/re_calculator/requirements`, {
      headers: getAuthHeaders(token),
    });
    return res.data;
  },

  async getRequirementsDetail(linkId) {
    const res = await axios.get(`${API_BASE_URL}/auth/api/re_calculator/getRequirementsDetail/${linkId}`, {
      headers: { Accept: "application/json" },
      params: { ts: Date.now() },
      validateStatus: () => true,
    });
    return res.data;
  },

  async deleteRequirement(id, token) {
    const res = await axios.delete(`${API_BASE_URL}/auth/api/re_calculator/deleteRequirement/${id}`, {
      headers: getAuthHeaders(token),
    });
    return res.data;
  },

  // --- Assigned Quotations ---
  async getAssignedQuotations(token) {
    const res = await axios.get(`${API_BASE_URL}/auth/api/re_calculator/getAssignedQuotations`, {
      headers: getAuthHeaders(token),
    });
    return res.data;
  },
};

export default adminService;
