import React, { useState } from "react";
import { Link } from "react-router-dom";

function ForgotPassword() {
  const [status, setStatus] = useState(null); // "success"/ "error"/ null
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus(null);
    setMessage("");
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");

    // Validasi khusus email mahasiswa USU
    if (!email.endsWith("@usu.ac.id")) {
      setStatus("error");
      setMessage("Please use your official USU email address (@usu.ac.id).");
      setIsLoading(false);
      return;
    }

    try {
      // Menggunakan Environment Variable dari Vite untuk URL Backend
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg =
          data?.message ||
          "Failed to send reset link. Please check your email and try again.";
        setStatus("error");
        setMessage(msg);
      } else {
        setStatus("success");
        setMessage(
          "If this email is registered, a reset link has been sent to your inbox.",
        );
        e.currentTarget.reset();
      }
    } catch (err) {
      setStatus("error");
      setMessage("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    // bg paling belakang
    <div className="relative min-h-screen flex items-center justify-center bg-linear-to-t from-[#0A100D]/98 to-[#164A41]  overflow-hidden px-4 py-12">
      {/* ellipse */}
      <div className="absolute top-[-10%] left-[-10%] w-125 h-125 bg-teal-900/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-125 h-125 bg-emerald-950/60 rounded-full blur-3xl pointer-events-none" />

      {/* kotak main */}
      <div className="relative z-10 w-full max-w-120 flex flex-col items-center gap-10">
        {/* teks header */}
        <div className="text-center space-y-2">
          <h1 className="text-white text-[20px] font-bold tracking-wide">
            Reset Password
          </h1>
          <p className="text-gray-400 text-base font-medium">
            Enter your USU email to receive a reset link
          </p>
        </div>

        {/* card form */}
        <div className="w-full bg-white/3 backdrop-blur-xl border border-white/10 rounded-4xl p-8 md:p-10 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.40)]">
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            {/* input email */}
            <div className="flex flex-col gap-2">
              <label className="text-stone-400 text-xs font-semibold uppercase tracking-wider">
                USU Email Address
              </label>
              <div className="relative">
                {/* icon email */}
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <input
                  name="email"
                  type="email"
                  placeholder="name@usu.ac.id"
                  className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#4D774E] focus:bg-black/40 transition-all"
                  required
                />
              </div>
            </div>

            {/* status message */}
            {status && (
              <div
                className={
                  status === "success"
                    ? "text-sm text-emerald-300"
                    : "text-sm text-red-300"
                }
              >
                {message}
              </div>
            )}

            {/* button send link */}
            <button
              type="submit"
              className="w-full mt-2 bg-[#F1B24A] hover:bg-[#e0a239] text-black font-semibold text-[16px] py-4 rounded-2xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        </div>

        {/* footer text (Back to Login) */}
        <div className="text-center text-[15px] -mt-2.5">
          <span className="text-gray-400">Remember your password? </span>
          <Link
            to="/login"
            className="text-stone-300 font-bold hover:text-white transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;