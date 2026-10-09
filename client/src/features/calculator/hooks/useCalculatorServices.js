import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { clearUser } from "../../../redux/user/userSlice";
import { getAddServices } from "../services/calculatorService";

export function useCalculatorServices() {
  const { token } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [servicesData, setServicesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchServices = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getAddServices(token);
      if (res?.data) {
        setServicesData(res.data);
      }
    } catch (err) {
      console.error("Error fetching services:", err);
      setError(err?.response?.data?.message || "Failed to load services");
      if (err?.response?.status === 401) {
        Swal.fire({
          title: "Session Expired",
          text: "Please login again.",
          icon: "warning",
          showConfirmButton: false,
          timer: 1000,
        }).then(() => {
          dispatch(clearUser());
          localStorage.removeItem("token");
          navigate("/");
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [token]);

  return {
    servicesData,
    loading,
    error,
    refreshServices: fetchServices,
  };
}
