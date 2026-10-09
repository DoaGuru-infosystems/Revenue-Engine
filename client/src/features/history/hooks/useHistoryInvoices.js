import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import historyService from "../services/historyService";

export default function useHistoryInvoices() {
  const { token } = useSelector((state) => state.user);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInvoices = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const data = await historyService.getAllInvoices(token);
      if (data?.status === "Success" && Array.isArray(data.data)) {
        setInvoices([...data.data].reverse());
      } else {
        setInvoices([]);
      }
    } catch (err) {
      console.error("Error loading invoice history:", err);
      setError(err?.response?.data?.message || "Failed to load invoice history");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return {
    invoices,
    loading,
    error,
    refresh: fetchInvoices,
  };
}
