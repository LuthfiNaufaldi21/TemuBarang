import React, { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";

function DashboardIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.3}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3v5h5"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 7v5l4 2"
      />
    </svg>
  );
}

function SuccessCheckIcon() {
  return (
    <svg
      className="w-7 h-7 text-[#9CC88D]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={3}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function getSuccessContent(type) {
  if (type === "resolved") {
    return {
      title: "Case Resolved Successfully!",
      description:
        "We're glad you found your item! This report is now closed and moved to your history.",
    };
  }

  if (type === "found") {
    return {
      title: "Item Processed Successfully!",
      description:
        "The original reporter has been notified. Thank you for your contribution to the campus community.",
    };
  }

  return {
    title: "Report Submitted Successfully!",
    description:
      "Your report has been submitted. We will notify you when there is a relevant update.",
  };
}

function SuccessProcess() {
  const location = useLocation();

  const queryParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );

  const type = queryParams.get("type") || "report";
  const content = getSuccessContent(type);

  return (
    <div className="flex h-[100dvh] min-h-0 bg-[#0E1511] text-white overflow-hidden selection:bg-[#164A41] selection:text-white">
      <Sidebar activePage="" />

      <div className="flex-1 min-w-0 min-h-0 flex flex-col h-full overflow-hidden">
        <TopBar />

        <main className="flex-1 min-h-0 overflow-y-auto flex justify-center items-start md:items-center bg-[#0E1511] px-4 pt-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:p-6 md:pb-6">
          <div className="w-full max-w-194 md:min-h-125 bg-[#1A211D] border border-[#3C4A42]/40 rounded-2xl shadow-sm flex flex-col justify-center items-center gap-6 md:gap-8 px-5 py-10 md:px-10 md:py-16">
            <div className="relative flex justify-center items-center">
              <div className="absolute w-20 h-20 bg-[#9CC88D] rounded-full opacity-20 blur-xl" />

              <div className="relative z-10 w-16 h-16 bg-[#9CC88D] rounded-full flex justify-center items-center shadow-[0_0_30px_rgba(156,200,141,0.35)]">
                <div className="w-8 h-8 bg-[#164A41] rounded-full flex justify-center items-center">
                  <SuccessCheckIcon />
                </div>
              </div>
            </div>

            <div className="w-full max-w-130 flex flex-col justify-center items-center text-center gap-5">
              <h1 className="text-[#DDE4DD] text-2xl md:text-3xl font-bold leading-tight">
                {content.title}
              </h1>

              <p className="text-[#BBCABF] text-sm md:text-base font-normal leading-relaxed max-w-120">
                {content.description}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full">
              <Link
                to="/dashboard"
                className="w-full sm:w-52.5 py-3.5 bg-[#9CC88D] hover:bg-[#8bb67d] text-[#13342E] font-bold rounded-xl flex justify-center items-center gap-2 transition-all active:scale-95 text-sm"
              >
                <DashboardIcon />
                Back to Dashboard
              </Link>

              <Link
                to="/my-reports"
                className="w-full sm:w-45 py-3.5 bg-transparent border border-[#BBCABF]/40 hover:border-[#9CC88D]/60 hover:bg-[#9CC88D]/5 text-[#DDE4DD] font-bold rounded-xl flex justify-center items-center gap-2 transition-all active:scale-95 text-sm"
              >
                <HistoryIcon />
                View History
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default SuccessProcess;