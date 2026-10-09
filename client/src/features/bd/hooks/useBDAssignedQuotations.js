import { useState, useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { clearUser } from "../../../redux/user/userSlice";
import bdService from "../services/bdService";

export function useBDAssignedQuotations() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentUser, token } = useSelector((state) => state.user);

  const [loading, setLoading] = useState(false);
  const [assignedQuotations, setAssignedQuotations] = useState([]);

  const handleUnauthorized = useCallback(() => {
    Swal.fire({
      title: "Session Expired",
      text: "Please login again.",
      icon: "warning",
      confirmButtonText: "OK",
    }).then(() => {
      dispatch(clearUser());
      localStorage.removeItem("token");
      navigate("/");
    });
  }, [dispatch, navigate]);

  const fetchQuotations = useCallback(async () => {
    if (!currentUser?.name) return;
    setLoading(true);
    try {
      const res = await bdService.getAssignedQuotationsByEmployee(currentUser.name, token);
      if (res?.status === "Success" && Array.isArray(res?.data)) {
        setAssignedQuotations(res.data);
      }
    } catch (err) {
      if (err.response?.status === 401) handleUnauthorized();
    } finally {
      setLoading(false);
    }
  }, [currentUser?.name, token, handleUnauthorized]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  return {
    loading,
    assignedQuotations,
    refetch: fetchQuotations,
  };
}

export default useBDAssignedQuotations;
