import { useSelector, useDispatch } from "react-redux";
import { setUser, clearUser, setLoading, setError } from "../auth.slice";
import { loginUser } from "../services";
import Swal from "sweetalert2";

export function useAuth() {
  const dispatch = useDispatch();
  const { currentUser, token, loading, error } = useSelector((state) => state.user);

  const isAuthenticated = Boolean(token && currentUser);
  const role = currentUser?.role || null;
  const userName = currentUser?.name || "";

  const login = async (email, password) => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
      const response = await loginUser({
        employee_email: email,
        employee_password: password,
      });

      if (response.status === "Success" && response.message === "Login successful") {
        dispatch(setLoading(false));
        Swal.fire({
          icon: "success",
          title: "Login Successful",
          text: "Welcome back!",
          showConfirmButton: false,
          timer: 1000,
        });
        dispatch(setUser({ user: response.user, token: response.token }));
        return { success: true, user: response.user };
      } else {
        dispatch(setLoading(false));
        const errMsg = response.message || "Invalid credentials.";
        dispatch(setError(errMsg));
        Swal.fire({
          icon: "error",
          title: "Login Failed",
          text: errMsg,
          showConfirmButton: false,
          timer: 1000,
        });
        return { success: false, error: errMsg };
      }
    } catch (err) {
      dispatch(setLoading(false));
      const errMsg = err.response?.data?.message || "Login failed. Please check your credentials.";
      dispatch(setError(errMsg));
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: errMsg,
        showConfirmButton: false,
        timer: 1500,
      });
      return { success: false, error: errMsg };
    }
  };

  const logout = () => {
    dispatch(clearUser());
    localStorage.removeItem("token");
  };

  return {
    currentUser,
    token,
    userName,
    role,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
  };
}

export default useAuth;
