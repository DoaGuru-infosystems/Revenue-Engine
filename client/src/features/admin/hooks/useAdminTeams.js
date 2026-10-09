import { useState, useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { clearUser } from "../../../redux/user/userSlice";
import adminService from "../services/adminService";

export function useAdminTeams() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.user);

  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [teams, setTeams] = useState([]);

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

  const fetchEmployees = useCallback(async () => {
    try {
      const data = await adminService.getEmployees(token);
      setEmployees(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.response?.status === 401) handleUnauthorized();
    }
  }, [token, handleUnauthorized]);

  const fetchTeams = useCallback(async () => {
    try {
      const data = await adminService.getTeams(token);
      setTeams(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.response?.status === 401) handleUnauthorized();
    }
  }, [token, handleUnauthorized]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchEmployees(), fetchTeams()]);
    setLoading(false);
  }, [fetchEmployees, fetchTeams]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return {
    loading,
    employees,
    teams,
    refetch: loadAll,
    fetchEmployees,
    fetchTeams,
    handleUnauthorized,
  };
}

export default useAdminTeams;
