import { Link } from "react-router-dom";

export default function NotFound() {
  const currentUserEmail = localStorage.getItem("currentUserEmail");

  return (
    <div className="min-h-screen bg-[#0E1511] text-white flex items-center justify-center px-6">
      <div className="max-w-xl w-full text-center">
        <div className="mx-auto mb-6 w-20 h-20 rounded-3xl bg-[#164A41] border border-[#3C4A42] flex items-center justify-center">
          <svg
            className="w-10 h-10 text-[#9CC88D]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.172 16.172a4 4 0 015.656 0M12 14h.01M9 9h.01M15 9h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <p className="text-[#9CC88D] text-sm font-bold uppercase tracking-[0.25em] mb-3">
          404 Error
        </p>

        <h1 className="text-[#E2E3DD] text-4xl md:text-5xl font-bold mb-4">
          Page Not Found
        </h1>

        <p className="text-[#86948A] text-base leading-relaxed mb-8">
          The page you are looking for does not exist or may have been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={currentUserEmail ? "/dashboard" : "/"}
            className="bg-[#9CC88D] hover:bg-[#8bb47d] text-[#13342E] font-bold px-6 py-3 rounded-xl transition-colors"
          >
            {currentUserEmail ? "Back to Dashboard" : "Back to Home"}
          </Link>

          <Link
            to="/help"
            className="bg-[#1A211D] hover:bg-[#243029] border border-[#3C4A42] text-[#DDE4DD] font-bold px-6 py-3 rounded-xl transition-colors"
          >
            Open Help Center
          </Link>
        </div>
      </div>
    </div>
  );
}