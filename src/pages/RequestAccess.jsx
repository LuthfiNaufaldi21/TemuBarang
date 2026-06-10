import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isUSUEmail } from "../utils/validateEmail";
import { authAPI } from "../services/api";

function RequestAccess() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);
    setMessage("");

    const formData = new FormData(e.currentTarget);
    const full_name = formData.get("fullName");
    const student_id_number = formData.get("nim");
    const email = formData.get("email");
    const password = formData.get("password");

    if (!isUSUEmail(email)) {
      setStatus("error");
      setMessage("Gunakan email institusi USU (@usu.ac.id atau @students.usu.ac.id).");
      setIsLoading(false);
      return;
    }

    try {
      await authAPI.register({ full_name, student_id_number, email, password });
      setStatus("success");
      setMessage("Akun berhasil dibuat! Mengalihkan ke halaman login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setStatus("error");
      setMessage(err.message || "Gagal membuat akun. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative min-h-[100dvh] flex items-start sm:items-center justify-center bg-linear-to-t from-[#0A100D]/98 to-[#164A41] overflow-x-hidden overflow-y-auto px-4 pt-8 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:py-12">
      <div className="absolute top-[-10%] left-[-10%] w-125 h-125 bg-teal-900/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-125 h-125 bg-emerald-950/60 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-140 flex flex-col items-center gap-7 sm:gap-10">
        <div className="text-center space-y-2">
          <h1 className="text-white text-[20px] font-bold tracking-wide">Request Access</h1>
          <p className="text-gray-400 text-base font-medium">Create your TemuBarang account</p>
        </div>

        <div className="w-full bg-white/3 backdrop-blur-xl border border-white/10 rounded-3xl sm:rounded-4xl p-6 sm:p-8 md:p-10 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.40)]">
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-stone-400 text-xs font-semibold uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <input name="fullName" type="text" placeholder="Adit Sopo Jarwo"
                    className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#4D774E] focus:bg-black/40 transition-all"
                    required />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-stone-400 text-xs font-semibold uppercase tracking-wider">NIM</label>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <rect x="4" y="5" width="16" height="14" rx="2" ry="2" />
                    <circle cx="9" cy="11" r="2" />
                    <path d="M7 15h4" /><path d="M13 11h4" /><path d="M13 15h4" />
                  </svg>
                  <input name="nim" type="text" placeholder="241401..."
                    className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#4D774E] focus:bg-black/40 transition-all"
                    required />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-stone-400 text-xs font-semibold uppercase tracking-wider">USU Email Address</label>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input name="email" type="email" placeholder="name@students.usu.ac.id"
                  className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#4D774E] focus:bg-black/40 transition-all"
                  required />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-stone-400 text-xs font-semibold uppercase tracking-wider">Create Password</label>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input name="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                  className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white tracking-widest placeholder:text-white/30 placeholder:tracking-widest focus:outline-none focus:border-[#4D774E] focus:bg-black/40 transition-all"
                  required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {status && (
              <div className={status === "success" ? "text-sm text-emerald-300 text-center" : "text-sm text-red-300 text-center"}>
                {message}
              </div>
            )}

            <p className="text-white/40 text-xs text-center mt-2 leading-relaxed">
              By requesting access, you agree to the campus community guidelines and verify that the provided information is accurate.
            </p>

            <button type="submit"
              className="w-full mt-2 bg-[#F1B24A] hover:bg-[#e0a239] text-black font-semibold text-[16px] py-4 rounded-2xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isLoading}>
              {isLoading ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        </div>

        <div className="text-center text-[15px]">
          <span className="text-gray-400">Already have an account? </span>
          <Link to="/login" className="text-stone-300 font-bold hover:text-white transition-colors">Sign In</Link>
        </div>
      </div>
    </div>
  );
}

export default RequestAccess;