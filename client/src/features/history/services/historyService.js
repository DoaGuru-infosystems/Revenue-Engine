import axios from "axios";
import API_BASE_URL from "../../../config/apiBaseUrl";

const historyService = {
  // Invoices History
  getAllInvoices: async (token) => {
    const res = await axios.get(`${API_BASE_URL}/auth/api/re_calculator/getAllInvoice`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  },

  deleteInvoice: async (invoiceId, token) => {
    const res = await axios.delete(
      `${API_BASE_URL}/auth/api/re_calculator/deleteInvoice/${invoiceId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  },

  // Revenue & Financials
  getRevenueHistory: async (token) => {
    const res = await axios.get(`${API_BASE_URL}/auth/api/re_calculator/revenue/history`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  },

  // Transactions & Client Histories
  getAllClientsTxnHistory: async (token, status = "approved") => {
    const res = await axios.get(
      `${API_BASE_URL}/auth/api/re_calculator/getAllClientsTxnHistory?status=${status}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  },

  getClientsTxnByEmployee: async (employeeName, token) => {
    const res = await axios.get(
      `${API_BASE_URL}/auth/api/re_calculator/getClientsTxnByEmployee/${encodeURIComponent(employeeName)}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  },

  getClientDetailsById: async (clientId, token) => {
    const res = await axios.get(
      `${API_BASE_URL}/auth/api/re_calculator/getClientDetailsById/${clientId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  },

  deleteProforma: async (proformaId, token) => {
    const res = await axios.delete(
      `${API_BASE_URL}/auth/api/re_calculator/proforma/${proformaId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  },
};

export default historyService;
