import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import historyService from "../services/historyService";

export default function useRevenueHistory() {
  const { token } = useSelector((state) => state.user);
  const [data, setData] = useState({
    totals: { totalPayment: 0, totalReceived: 0, totalPending: 0 },
    invoices: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRevenue = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const res = await historyService.getRevenueHistory(token);
      if (res?.status === "Success") {
        setData(res);
      }
    } catch (err) {
      console.error("Error fetching revenue history:", err);
      setError(err?.response?.data?.message || "Failed to fetch revenue data.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRevenue();
  }, [fetchRevenue]);

  return {
    revenueData: data,
    loading,
    error,
    refresh: fetchRevenue,
  };
}
