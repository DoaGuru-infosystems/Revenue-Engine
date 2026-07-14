import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
// import { Mail, Lock, User } from "lucide-react";
import {
  User,
  Mail,
  Lock,
  UserPlus,
  Eye,
  Calendar,
  Users,
  Phone,
} from "lucide-react";
import { useSelector } from "react-redux";
// import moment from "moment";
// import { useNavigate } from "react-router-dom";
// import { clearUser } from "../redux/user/userSlice";

export default function RegisterBD() {
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
      });

      fetchRegisteredBDs();
    } catch (error) {
      console.log(error);
    }
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
      setRegisteredBDs(response.data.data);
    } catch (error) {
      console.error("Error fetching BDs:", error);
      Swal.fire("Error", "Failed to fetch registered BDs", "error");
      if (error.response && error.response.status === 401) {
        // Token is invalid or expired
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

  console.log(registeredBDs);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-orange-600 rounded-full mb-4">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            BD Registration Portal
          </h1>
          <p className="text-slate-300 text-lg">
            Register new Business Development team members
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <User className="h-6 w-6 mr-2" />
              Register New BD
            </h2>
            {/* <button
              onClick={fetchRegisteredBDs}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <Eye className="h-4 w-4 mr-2" />
              View All BDs
            </button> */}
          </div>

          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Employee Name */}
              <div className="">
                <label className="block text-sm font-semibold text-slate-200 mb-2">
                  Employee Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    name="employee_name"
                    value={formData.employee_name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter full name"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    name="employee_email"
                    value={formData.employee_email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                    placeholder="you@company.com"
                    required
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {/* Phone icon (lucide-react se import karein) */}
                    <Phone className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="tel"
                    name="employee_phone"
                    value={formData.employee_phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter phone number"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    name="employee_password"
                    value={formData.employee_password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              className="w-full py-3 px-6 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Register Employee
            </button>
          </div>
        </div>

        {/* History Section */}
        {registeredBDs.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8">
            <div className="flex items-center mb-6">
              <Users className="h-6 w-6 text-white mr-2" />
              <h3 className="text-2xl font-bold text-white">Registered BDs</h3>
              <span className="ml-3 px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm font-medium">
                {registeredBDs.length} Members
              </span>
            </div>

            <div className="overflow-hidden rounded-lg border border-white/20">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black/20">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2" />
                          Phone No.
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Email
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {registeredBDs.map((bd, index) => (
                      <tr
                        key={index}
                        className="hover:bg-white/5 transition-colors duration-150"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-red-500 to-orange-600 rounded-full text-white font-semibold">
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                          {/* {moment(bd.created_at).format("DD MMM YYYY")} */}
                          {bd.employee_phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-orange-400 to-pink-400 flex items-center justify-center">
                                <span className="text-sm font-medium text-white">
                                  {bd.employee_name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-white">
                                {bd.employee_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100/20 text-green-300">
                            {bd.employee_role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                          {bd.employee_email}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // return (
  //   // <div className="flex items-center justify-center px-4">
  //   <div className="flex flex-col lg:flex-row lg:items-start lg:justify-center px-4 gap-8">
  //     <div className="w-full max-w-md space-y-8">
  //       <div className="flex justify-end">
  //         <button
  //           onClick={fetchRegisteredBDs}
  //           className="mb-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded shadow"
  //         >
  //           Show All Registered BD
  //         </button>
  //       </div>

  //       <h2 className="text-3xl font-bold text-center text-gray-200">
  //         Register BD
  //       </h2>

  //       <form onSubmit={handleSubmit} className="space-y-5">
  //         {/* Employee Name */}
  //         <div>
  //           <label className="block text-sm font-medium text-gray-50 mb-1">
  //             Employee Name
  //           </label>
  //           <div className="flex items-center bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-orange-500">
  //             <User className="h-5 w-5 text-gray-400 mr-2" />
  //             <input
  //               type="text"
  //               name="employee_name"
  //               value={formData.employee_name}
  //               onChange={handleChange}
  //               className="w-full outline-none bg-transparent"
  //               placeholder="Enter full name"
  //               required
  //             />
  //           </div>
  //         </div>

  //         {/* Email */}
  //         <div>
  //           <label className="block text-sm font-medium text-gray-50 mb-1">
  //             Email
  //           </label>
  //           <div className="flex items-center bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-orange-500">
  //             <Mail className="h-5 w-5 text-gray-400 mr-2" />
  //             <input
  //               type="email"
  //               name="employee_email"
  //               value={formData.employee_email}
  //               onChange={handleChange}
  //               className="w-full outline-none bg-transparent"
  //               placeholder="you@example.com"
  //               required
  //             />
  //           </div>
  //         </div>

  //         {/* Password */}
  //         <div>
  //           <label className="block text-sm font-medium text-gray-50 mb-1">
  //             Password
  //           </label>
  //           <div className="flex items-center bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-orange-500">
  //             <Lock className="h-5 w-5 text-gray-400 mr-2" />
  //             <input
  //               type="password"
  //               name="employee_password"
  //               value={formData.employee_password}
  //               onChange={handleChange}
  //               className="w-full outline-none bg-transparent"
  //               placeholder="••••••••"
  //               required
  //             />
  //           </div>
  //         </div>

  //         {/* Submit */}
  //         <button
  //           type="submit"
  //           className="w-full py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow transition"
  //         >
  //           Register
  //         </button>
  //       </form>
  //     </div>
  //     {registeredBDs.length > 0 && (
  //       <>
  //         <div className="w-full max-w-3xl mt-8 lg:mt-0">
  //           <div className="bg-white rounded-lg shadow p-4 overflow-x-auto">
  //             <h3 className="text-xl font-semibold mb-3 text-gray-800">
  //               Registered BDs
  //             </h3>
  //             <table className="min-w-full text-sm text-left text-gray-700">
  //               <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
  //                 <tr>
  //                   <th className="px-6 py-3">#</th>
  //                   <th className="px-6 py-3">Date</th>
  //                   <th className="px-6 py-3">Name</th>
  //                   <th className="px-6 py-3">Role</th>
  //                   <th className="px-6 py-3">Email</th>
  //                 </tr>
  //               </thead>
  //               <tbody>
  //                 {registeredBDs.map((bd, index) => (
  //                   <tr key={index} className="border-b hover:bg-gray-50">
  //                     <td className="px-6 py-3">{index + 1}</td>
  //                     <td className="px-6 py-3">
  //                       {moment(bd.created_at).format("DD MMMM YYYY")}
  //                     </td>
  //                     <td className="px-6 py-3">{bd.employee_name}</td>
  //                     <td className="px-6 py-3">{bd.employee_role}</td>
  //                     <td className="px-6 py-3">{bd.employee_email}</td>
  //                   </tr>
  //                 ))}
  //               </tbody>
  //             </table>
  //           </div>
  //         </div>
  //       </>
  //     )}
  //   </div>
  // );
}
