import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  User,
  Mail,
  Lock,
  UserPlus,
  Users,
  Phone,
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { clearUser } from "../../../redux/user/userSlice";
import API_BASE_URL from "../../../config/apiBaseUrl";

export default function RegisterBDPage() {
  const baseURL = API_BASE_URL;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.user);
  const [formData, setFormData] = useState({
    employee_name: "",
    employee_email: "",
    employee_password: "",
    employee_phone: "",
  });
  const [registeredBDs, setRegisteredBDs] = useState([]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const fetchRegisteredBDs = async () => {
    try {
      const response = await axios.get(
        `${baseURL}/auth/api/re_calculator/getAllBD`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setRegisteredBDs(response.data.data || []);
    } catch (error) {
      console.error("Error fetching BDs:", error);
      if (error.response && error.response.status === 401) {
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
      }
    }
  };

  useEffect(() => {
    fetchRegisteredBDs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        `${baseURL}/auth/api/re_calculator/registerBD`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Swal.fire({
        icon: "success",
        title: "Registered",
        text: response.data.message,
      });

      setFormData({
        employee_name: "",
        employee_email: "",
        employee_password: "",
        employee_phone: "",
      });

      fetchRegisteredBDs();
    } catch (error) {
      console.error(error);
      Swal.fire("Error", error.response?.data?.message || "Registration failed", "error");
    }
  };

  return (
    <div className="w-full py-2 sm:py-4 px-1 sm:px-2 text-gray-900 dark:text-white transition-colors">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-red-500 to-orange-600 rounded-2xl mb-3 shadow-lg shadow-orange-500/20">
            <UserPlus className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
            BD Registration Portal
          </h1>
          <p className="text-gray-600 dark:text-slate-300 text-xs sm:text-sm">
            Register new Business Development team members
          </p>
        </div>

        <div className="bg-white/90 dark:bg-slate-900/60 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 p-4 sm:p-7 mb-6">
          <div className="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-white/10 pb-3">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <User className="h-5 w-5 mr-2 text-red-500" />
              Register New BD
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5 uppercase tracking-wider">
                  Employee Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400 dark:text-slate-400" />
                  </div>
                  <input
                    type="text"
                    name="employee_name"
                    value={formData.employee_name}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-white/15 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm transition-all"
                    placeholder="Enter full name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5 uppercase tracking-wider">
                  Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400 dark:text-slate-400" />
                  </div>
                  <input
                    type="email"
                    name="employee_email"
                    value={formData.employee_email}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-white/15 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm transition-all"
                    placeholder="you@company.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5 uppercase tracking-wider">
                  Phone Number *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-gray-400 dark:text-slate-400" />
                  </div>
                  <input
                    type="tel"
                    name="employee_phone"
                    value={formData.employee_phone}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-white/15 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm transition-all"
                    placeholder="Enter phone number"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5 uppercase tracking-wider">
                  Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400 dark:text-slate-400" />
                  </div>
                  <input
                    type="password"
                    name="employee_password"
                    value={formData.employee_password}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-white/15 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-6 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold rounded-xl shadow-md shadow-red-500/20 transition-all hover:opacity-95 text-sm"
            >
              Register Employee
            </button>
          </form>
        </div>

        {registeredBDs.length > 0 && (
          <div className="bg-white/90 dark:bg-slate-900/60 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 p-4 sm:p-7">
            <div className="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-white/10 pb-3">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-red-500 mr-2" />
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Registered BDs</h3>
              </div>
              <span className="px-3 py-1 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 rounded-full text-xs font-bold border border-red-200 dark:border-transparent">
                {registeredBDs.length} Members
              </span>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 dark:border-white/10">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-slate-300">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        Phone No.
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        Email
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                    {registeredBDs.map((bd, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center text-white text-xs font-bold">
                              {bd.employee_name
                                ? bd.employee_name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                : "BD"}
                            </div>
                            <div className="ml-3 font-semibold text-gray-900 dark:text-white">
                              {bd.employee_name}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-slate-300">
                          {bd.employee_phone}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-green-100/20 text-emerald-800 dark:text-green-300">
                            {bd.employee_role || "BD"}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-slate-300">
                          {bd.employee_email}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="grid gap-3 md:hidden">
              {registeredBDs.map((bd, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {bd.employee_name
                          ? bd.employee_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                          : "BD"}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">{bd.employee_name}</h4>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400">{bd.employee_email}</p>
                      </div>
                    </div>
                    <span className="inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-100 dark:bg-green-100/20 text-emerald-800 dark:text-green-300">
                      {bd.employee_role || "BD"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-slate-300 pt-2 border-t border-gray-100 dark:border-white/10">
                    <span className="text-gray-400 dark:text-slate-400">Phone:</span>
                    <span className="font-medium text-gray-800 dark:text-slate-200">{bd.employee_phone}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
