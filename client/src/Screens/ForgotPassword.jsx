import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";
import API_BASE_URL from "../config/apiBaseUrl";
import { Mail, Key, Lock, ArrowLeft, CheckCircle, X } from "lucide-react";

const ForgotPassword = () => {
   const baseURL = API_BASE_URL;
const [userId, setUserId] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${baseURL}/auth/api/calculator/forgot-password`,
        { User: userId }
      );
      if (response.data.status === "Success") {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: `Sent OTP successfully!`,
          showConfirmButton: false,
          timer: 1000,
        });
        setOtpSent(true);
        setShowOtpModal(true);
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed!",
          text: response.data.message || "error",
          showConfirmButton: false,
          timer: 1000,
        });
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Something went wrong",
        showConfirmButton: false,
        timer: 1000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      const response = await axios.post(
        `${baseURL}/auth/api/calculator/verifyOTP-forgot`,
        {
          User: userId,
          otp: otp,
          newPassword: newPassword,
        }
      );
      if (response.data.status === "Success") {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: response.data.message,
          showConfirmButton: false,
          timer: 1000,
        });
        setShowOtpModal(false);
        navigate("/");
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed!",
          text: response.data.message || "error",
          showConfirmButton: false,
          timer: 1000,
        });
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error resetting password",
        showConfirmButton: false,
        timer: 1000,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-orange-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 md:w-80 md:h-80 bg-red-600/15 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-sm sm:max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img 
              src="/revenue-engine-logo.png" 
              alt="Revenue Engine Logo" 
              className="w-10 h-10 md:w-12 md:h-12 object-contain rounded-full shadow-[0_0_15px_rgba(255,86,37,0.4)]"
            />
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent tracking-tight">
              Revenue Engine
            </h1>
          </div>
          <h2 className="text-slate-200 text-lg sm:text-xl font-semibold mt-3">Forgot Your Password?</h2>
          <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">
            Enter your email to receive an OTP and reset your password.
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="font-mono text-xs text-slate-400 block tracking-widest font-semibold uppercase">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  className="w-full py-3.5 pl-11 pr-4 rounded-xl bg-slate-950/50 border border-slate-700/50 text-slate-200 placeholder-slate-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all outline-none text-sm"
                  placeholder="Enter your email address"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>
            </div>

            <button
              onClick={handleSendOtp}
              className="relative w-full py-3.5 rounded-xl text-base font-bold text-white overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,86,37,0.3)] hover:shadow-[0_0_30px_rgba(255,86,37,0.5)] transition-all duration-300"
              disabled={loading}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500"></div>
              <span className="relative">{loading ? "Sending OTP..." : "Send OTP"}</span>
            </button>

            <button
              onClick={() => navigate("/")}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm text-slate-400 hover:text-orange-400 transition-colors font-medium"
            >
              <ArrowLeft size={16} />
              Back to Login
            </button>
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Verify & Reset</h2>
              <button
                onClick={() => setShowOtpModal(false)}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            {otpSent && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="font-mono text-xs text-slate-400 block tracking-widest uppercase">OTP Code</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"><Key size={18} /></span>
                    <input
                      type="text"
                      className="w-full py-3.5 pl-11 pr-4 rounded-xl bg-slate-950/50 border border-slate-700/50 text-slate-200 placeholder-slate-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all outline-none text-sm"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter the OTP from email"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono text-xs text-slate-400 block tracking-widest uppercase">New Password</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"><Lock size={18} /></span>
                    <input
                      type="password"
                      className="w-full py-3.5 pl-11 pr-4 rounded-xl bg-slate-950/50 border border-slate-700/50 text-slate-200 placeholder-slate-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all outline-none text-sm"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={handleResetPassword}
                    className="relative flex-1 py-3.5 rounded-xl text-base font-bold text-white overflow-hidden shadow-[0_0_15px_rgba(255,86,37,0.3)] hover:shadow-[0_0_25px_rgba(255,86,37,0.5)] transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500"></div>
                    <span className="relative flex items-center justify-center gap-2">
                      <CheckCircle size={18} />
                      Reset Password
                    </span>
                  </button>
                  <button
                    onClick={() => setShowOtpModal(false)}
                    className="flex-1 py-3.5 rounded-xl text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ForgotPassword;
