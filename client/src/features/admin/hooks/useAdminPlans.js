import { useState, useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { clearUser } from "../../../redux/user/userSlice";
import adminService from "../services/adminService";

export function useAdminPlans() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.user);

  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [planData, setPlanData] = useState([]);

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

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getAllPlanDetails(token);
      if (res?.data) {
        setPlans(res.data);
      }
    } catch (err) {
      if (err.response?.status === 401) handleUnauthorized();
    } finally {
      setLoading(false);
    }
  }, [token, handleUnauthorized]);

  const fetchAllPlanData = useCallback(async () => {
    try {
      const res = await adminService.getAllPlanData(token);
      if (res?.data) {
        setPlanData(res.data);
      }
    } catch (err) {
      if (err.response?.status === 401) handleUnauthorized();
    }
  }, [token, handleUnauthorized]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return {
    loading,
    plans,
    planData,
    fetchPlans,
    fetchAllPlanData,
    handleUnauthorized,
  };
}

export default useAdminPlans;
