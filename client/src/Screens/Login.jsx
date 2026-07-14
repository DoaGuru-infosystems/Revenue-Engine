import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, HelpCircle, Shield, ArrowRight } from "lucide-react";
import Swal from "sweetalert2";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/user/userSlice";
import API_BASE_URL from "../config/apiBaseUrl";

export default function Login() {
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const baseURL = API_BASE_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      Swal.fire({
        icon: "error",
        title: "Missing Fields",
        text: "Please fill in both email and password.",
        showConfirmButton: false,
        timer: 1000,
      });
      return;
    }
    try {
      setLoading(true);
      const response = await axios.post(
        `${baseURL}/auth/api/calculator/login`,
        {
          employee_email: email,
          employee_password: password,
        }
      );
      if (
        response.data.status === "Success" &&
        response.data.message === "Login successful"
      ) {
        setLoading(false);
        Swal.fire({
          icon: "success",
          title: "Login Successful",
          text: "Welcome back!",
          showConfirmButton: false,
          timer: 1000,
        });
        const user = response.data.user;
        const token = response.data.token;
        dispatch(setUser({ user, token }));
      } else {
        setLoading(false);
        Swal.fire({
          icon: "error",
          title: "Login Failed",
          text: response.data.message || "Invalid credentials.",
          showConfirmButton: false,
          timer: 1000,
        });
      }
    } catch (error) {
      setLoading(false);
      console.error("Login error:", error);
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: "Please check your credentials and try again.",
        showConfirmButton: false,
        timer: 1000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden selection:bg-orange-500 selection:text-white relative flex flex-col">
      {/* Full Screen Animated Background */ }
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute -inset-[100%] opacity-40 mix-blend-screen bg-cover bg-center animate-[spin_60s_linear_infinite]"
          style={ { backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCT9v6iizuoHxfKhHFpYAnJztv_3ApbHHC7Dyvq4D7pQzsVbIF-0pDnsBvhENFyWxnoiInnFwgsVWc5ENucoHd7CEUoA9DeAzNMmADjsz1J0FDPFcd7o74IXDwID61ElImaeyHJCCOCovXD_rkAj8KKLMkRgVOHfm_TNvaZ5VmSDHJZbByQZx8VLFFdoChrpBmjLktpnTinMSwpwQUh-r_-D8Th-33QUlcqUrHEzkFU3TiQoR1o3t-Unmchd64GWrJTf3-MD25CC3Xf')` } }
        ></div>
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-3xl"></div>

        {/* Animated Orbs */ }
        <div className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-orange-600/30 rounded-full blur-[100px] animate-[pulse_8s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 md:w-96 md:h-96 bg-red-600/20 rounded-full blur-[100px] animate-[pulse_10s_ease-in-out_infinite_reverse]"></div>
      </div>

      {/* Navigation Shell */ }
      <header className="relative z-50 flex justify-between items-center w-full px-6 py-6 md:px-12 md:py-8">
        <div className="flex items-center gap-3 animate-fade-in-down">
          <img 
            src="/revenue-engine-logo.png" 
            alt="Revenue Engine Logo" 
            className="w-10 h-10 md:w-12 md:h-12 object-contain rounded-full shadow-[0_0_15px_rgba(255,86,37,0.4)]"
          />
          <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent tracking-tight">
            Revenue Engine
          </div>
        </div>
      </header>

      {/* Main Content Area */ }
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        {/* Login Card (Glassmorphism) */ }
        <div className="w-full max-w-md p-8 sm:p-10 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.5)] transform transition-all hover:scale-[1.01] hover:shadow-[0_8px_40px_rgb(255,86,37,0.15)] animate-[fade-in-up_0.6s_ease-out]">

          {/* Card Header */ }
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3">
              Welcome Back
            </h1>
            <p className="text-slate-400 text-sm md:text-base font-medium">
              Sign in to access your elite revenue dashboard.
            </p>
          </div>

          {/* Login Form */ }
          <form className="space-y-6" onSubmit={ handleSubmit }>
            {/* Email Field */ }
            <div className="space-y-2 group">
              <label className="font-mono text-xs text-slate-400 block px-1 tracking-widest font-semibold group-focus-within:text-orange-400 transition-colors" htmlFor="email">
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-400 transition-colors">
                  <Mail size={ 20 } />
                </span>
                <input
                  className="w-full py-3.5 pl-12 pr-4 rounded-xl bg-slate-950/50 border border-slate-700/50 text-slate-200 placeholder-slate-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all outline-none"
                  id="email"
                  placeholder="name@company.com"
                  required
                  type="email"
                  value={ email }
                  onChange={ (e) => setEmail(e.target.value) }
                />
              </div>
            </div>

            {/* Password Field */ }
            <div className="space-y-2 group">
              <div className="flex justify-between items-center px-1">
                <label className="font-mono text-xs text-slate-400 tracking-widest font-semibold group-focus-within:text-orange-400 transition-colors" htmlFor="password">
                  PASSWORD
                </label>
                <button
                  type="button"
                  onClick={ () => navigate("/password-reset") }
                  className="font-mono text-xs text-orange-400/80 hover:text-orange-400 transition-colors tracking-widest font-medium"
                >
                  FORGOT?
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-400 transition-colors">
                  <Lock size={ 20 } />
                </span>
                <input
                  className="w-full py-3.5 pl-12 pr-12 rounded-xl bg-slate-950/50 border border-slate-700/50 text-slate-200 placeholder-slate-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all outline-none"
                  id="password"
                  placeholder="••••••••"
                  required
                  type={ showPassword ? "text" : "password" }
                  value={ password }
                  onChange={ (e) => setPassword(e.target.value) }
                />
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  type="button"
                  onClick={ () => setShowPassword(!showPassword) }
                >
                  { showPassword ? <EyeOff size={ 20 } /> : <Eye size={ 20 } /> }
                </button>
              </div>
            </div>

            {/* Action Button */ }
            <div className="pt-6">
              <button
                className="relative w-full py-4 rounded-xl text-lg font-bold text-white overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,86,37,0.3)] hover:shadow-[0_0_30px_rgba(255,86,37,0.5)] transition-all duration-300"
                type="submit"
                disabled={ loading }
              >
                {/* Button Background Gradient */ }
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 bg-[length:200%_100%] group-hover:animate-[gradient-x_2s_linear_infinite] transition-all"></div>

                <div className="relative flex items-center justify-center gap-2">
                  { loading ? (
                    <>
                      <span className="animate-spin border-2 border-white/30 border-t-white rounded-full w-5 h-5 inline-block"></span>
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Login to Engine</span>
                      <ArrowRight size={ 20 } className="group-hover:translate-x-1.5 transition-transform duration-300" />
                    </>
                  ) }
                </div>
              </button>
            </div>
          </form>

          {/* Security Note */ }
          <div className="mt-8 flex items-center justify-center gap-2">
            <Shield size={ 16 } className="text-green-500/70" />
            <p className="font-mono text-[10px] text-slate-500 tracking-widest uppercase">
              Secure Encrypted Access
            </p>
          </div>
        </div>
      </main>

      {/* Footer Shell */ }
      <footer className="relative z-50 flex flex-col sm:flex-row justify-between items-center w-full px-6 py-6 gap-4 animate-fade-in-up">
        <div className="font-mono text-[10px] sm:text-xs text-slate-600 uppercase tracking-widest text-center sm:text-left">
          © { new Date().getFullYear() } Revenue Engine. Elite Precision.
        </div>

      </footer>

      {/* Custom Keyframes for Animations */ }
      <style dangerouslySetInnerHTML={ {
        __html: `
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-down {
          0% { opacity: 0; transform: translateY(-20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        .animate-fade-in-up { animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in-down { animation: fade-in-down 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `} } />
    </div>
  );
}
