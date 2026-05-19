import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { normalizeStatus, isResolvedStatus } from "../utils/statusUtils";

function MyReports() {
  const [userData] = useState(() => {
    const currentUserEmail = localStorage.getItem("currentUserEmail");

    if (currentUserEmail) {
      const profileKey = `temuProfile_${currentUserEmail}`;
      const savedProfile = localStorage.getItem(profileKey);

      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);

          return {
            name: parsed.fullName
              ? parsed.fullName.split(" ")[0]
              : currentUserEmail.split("@")[0],
            email: currentUserEmail,
            avatarUrl: parsed.avatarUrl || null,
          };
        } catch (error) {
          console.error("Gagal membaca profil", error);
        }
      }

      return {
        name: currentUserEmail.split("@")[0],
        email: currentUserEmail,
        avatarUrl: null,
      };
    }

    return {
      name: "Student",
      email: "",
      avatarUrl: null,
    };
  });

  const [activeTab, setActiveTab] = useState("active");
  const [myActiveReports, setMyActiveReports] = useState([]);
  const [myResolvedReports, setMyResolvedReports] = useState([]);



  const isUserRelatedToReport = (report, currentUserEmail) => {
    if (!report || !currentUserEmail) return false;

    const isReporter = report.reporterEmail === currentUserEmail;
    const isFounder = report.founderEmail === currentUserEmail;
    const isFoundBy = report.foundByEmail === currentUserEmail;

    const isPotentialFounder = Array.isArray(report.potentialFounders)
      ? report.potentialFounders.some(
        (finder) => finder.email === currentUserEmail
      )
      : false;

    return isReporter || isFounder || isFoundBy || isPotentialFounder;
  };

  const sortReportsByLatest = (reports) => {
    return [...reports].sort((a, b) => {
      const dateA = new Date(
        a.updatedAt || a.resolvedAt || a.createdAt || a.date || 0
      );
      const dateB = new Date(
        b.updatedAt || b.resolvedAt || b.createdAt || b.date || 0
      );

      return dateB - dateA;
    });
  };

  const loadMyReports = () => {
    const currentUserEmail =
      userData.email || localStorage.getItem("currentUserEmail");

    const savedReports = localStorage.getItem("temuReports");

    if (!savedReports || !currentUserEmail) {
      setMyActiveReports([]);
      setMyResolvedReports([]);
      return;
    }

    try {
      const allReports = JSON.parse(savedReports);

      const myReports = allReports.filter((report) =>
        isUserRelatedToReport(report, currentUserEmail)
      );

      const active = sortReportsByLatest(
        myReports.filter((report) => !isResolvedStatus(report.status))
      );

      const resolved = sortReportsByLatest(
        myReports.filter((report) => isResolvedStatus(report.status))
      );

      setMyActiveReports(active);
      setMyResolvedReports(resolved);
    } catch (error) {
      console.error("Gagal membaca data laporan", error);
      setMyActiveReports([]);
      setMyResolvedReports([]);
    }
  };

  useEffect(() => {
    loadMyReports();

    const handleStorageChange = () => {
      loadMyReports();
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const getStatusBadge = (report) => {
    const status = normalizeStatus(report.status);
    const type = (report.type || "").toUpperCase();

    let badgeText = type || "REPORT";
    let badgeStyle =
      type === "FOUND"
        ? "bg-[#11996C]/50 border-[#11996C] text-white"
        : "bg-[#EF4444]/50 border-[#EF4444]/30 text-white";

    if (status === "resolved" || status === "returned") {
      badgeText = "RESOLVED";
      badgeStyle = "bg-[#11996C]/80 border-[#11996C] text-white";
    } else if (status === "verifying") {
      badgeText = "VERIFYING";
      badgeStyle = "bg-blue-600/50 border-blue-500/30 text-white";
    } else if (status === "match_found") {
      badgeText = "MATCH FOUND";
      badgeStyle = "bg-amber-500/50 border-amber-500/30 text-amber-100";
    } else if (status === "searching") {
      badgeText = type === "FOUND" ? "FOUND" : "LOST";
      badgeStyle =
        type === "FOUND"
          ? "bg-[#11996C]/50 border-[#11996C] text-white"
          : "bg-[#EF4444]/50 border-[#EF4444]/30 text-white";
    }

    return (
      <span
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${badgeStyle}`}
      >
        {badgeText}
      </span>
    );
  };

  const getLocation = (report) => {
    const type = (report.type || "").toUpperCase();
    const status = normalizeStatus(report.status);

    if (type === "LOST") {
      if (status === "match_found" || status === "verifying") {
        return report.foundLocation || report.location || "-";
      }

      return report.location || report.foundLocation || "-";
    }

    return report.foundLocation || report.location || "-";
  };

  const getDateText = (report) => {
    if (report.dateText) return report.dateText;
    if (report.date) return report.date;

    if (report.createdAt) {
      return new Date(report.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }

    return "-";
  };

  const getResolvedDateText = (report) => {
    if (report.resolvedDate) return `Resolved ${report.resolvedDate}`;

    if (report.resolvedAt) {
      const resolvedDate = new Date(report.resolvedAt).toLocaleDateString(
        "en-GB",
        {
          day: "numeric",
          month: "short",
          year: "numeric",
        }
      );

      return `Resolved ${resolvedDate}`;
    }

    return getDateText(report);
  };

  return (
    <div className="flex h-screen bg-[#0E1511] text-white  overflow-hidden selection:bg-[#164A41] selection:text-white">
      <Sidebar activePage="my-reports" />

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-y-scroll p-6 md:p-8 flex flex-col items-center">
          <div className="w-full max-w-300 mx-auto flex flex-col gap-6 min-h-[calc(100vh-140px)] pb-32 md:pb-40">
            <div className="flex flex-col gap-1 w-full">
              <h2 className="text-[#DDE4DD] text-3xl font-bold  mb-1">
                {activeTab === "active" ? "My Reports" : "Report History"}
              </h2>

              <p className="text-[#A1A1AA] text-base">
                {activeTab === "active"
                  ? "Track the progress of your lost items and items you've found for others."
                  : "Manage and review your campus lost & found activity."}
              </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-[#27272A] flex gap-8">
              {["active", "resolved"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative pb-4 text-sm font-bold tracking-tight transition-colors ${activeTab === tab
                    ? "text-[#9CC88D]"
                    : "text-[#A1A1AA] hover:text-[#DDE4DD]"
                    }`}
                >
                  {tab.toUpperCase()}
                  {activeTab === tab && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9CC88D] rounded-t-full" />
                  )}
                </button>
              ))}
            </div>

            {/* ACTIVE TAB */}
            {activeTab === "active" &&
              (myActiveReports.length === 0 ? (
                <div className="w-full min-h-100 flex flex-col items-center justify-center bg-[#1A211D] border border-dashed border-[#4D774E]/50 rounded-2xl py-20 px-6 text-center mt-2">
                  <div className="w-16 h-16 mb-4 rounded-full bg-[#13342E] border border-[#3C4A42] flex items-center justify-center opacity-80">
                    <svg
                      className="w-8 h-8 text-[#9CC88D]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>

                  <h3 className="text-[#DDE4DD] text-lg font-semibold mb-1">
                    No active reports yet
                  </h3>

                  <p className="text-[#86948A] text-sm max-w-sm">
                    You have no active reports. Lost or found something on
                    campus?
                  </p>

                  <Link
                    to="/report-item"
                    className="mt-6 px-6 py-2.5 bg-[#9CC88D] text-[#13342E] font-bold rounded-lg text-sm hover:bg-[#8bb47d] transition-colors"
                  >
                    Report New Item
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4 mt-2">
                  {myActiveReports.map((report, index) => (
                    <div
                      key={report.id || index}
                      className="bg-[#1A211D] border border-[#3C4A42]/30 rounded-xl overflow-hidden flex"
                    >
                      {/* Image */}
                      <div className="w-64 shrink-0 relative overflow-hidden">
                        <img
                          src={report.image}
                          alt={report.title}
                          className="w-full h-full object-cover min-h-50"
                          onError={(e) => {
                            e.target.src =
                              "https://placehold.co/256x200/1A211D/4D774E?text=No+Image";
                          }}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-6 flex flex-col justify-between">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-[#DDE4DD] text-xl font-bold">
                                {report.title}
                              </h3>
                            </div>

                            {getStatusBadge(report)}
                          </div>

                          <div className="flex items-center gap-6">
                            <span className="flex items-center gap-2 text-sm text-[#BBCABF]">
                              <svg
                                className="w-3.5 h-3.5 shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              {getLocation(report)}
                            </span>

                            <span className="flex items-center gap-2 text-sm text-[#BBCABF]">
                              <svg
                                className="w-3.5 h-3.5 shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              {getDateText(report)}
                            </span>
                          </div>

                          <p className="text-[#BBCABF] text-sm leading-relaxed line-clamp-3">
                            {report.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-4 mt-2">
                          {report.ownerVerified ? (
                            <span className="flex items-center gap-1.5 text-amber-300 text-xs font-medium">
                              <svg
                                className="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                              </svg>
                              Owner verified via ID
                            </span>
                          ) : (
                            <span />
                          )}

                          <Link
                            to={`/my-reports/${report.id || ""}`}
                            className="flex items-center gap-2 px-6 py-2 bg-[#13342E] border border-[#3C4A42]/50 text-[#9CC88D] text-sm font-semibold rounded-lg hover:bg-[#1a443d] transition-colors"
                          >
                            View Details
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2.5}
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 12h14M12 5l7 7-7 7"
                              />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

            {/* RESOLVED TAB */}
            {activeTab === "resolved" &&
              (myResolvedReports.length === 0 ? (
                <div className="w-full min-h-100 flex flex-col items-center justify-center bg-[#1A211D] border border-dashed border-[#4D774E]/50 rounded-2xl py-20 px-6 text-center mt-2">
                  <div className="w-16 h-16 mb-4 rounded-full bg-[#13342E] border border-[#3C4A42] flex items-center justify-center opacity-80">
                    <svg
                      className="w-8 h-8 text-[#9CC88D]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                      />
                    </svg>
                  </div>

                  <h3 className="text-[#DDE4DD] text-lg font-semibold mb-1">
                    No resolved reports yet
                  </h3>

                  <p className="text-[#86948A] text-sm max-w-sm">
                    Reports that have been resolved or returned will appear
                    here.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-8 mt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myResolvedReports.map((report, index) => (
                      <Link
                        to={`/my-reports/${report.id || ""}`}
                        key={report.id || index}
                        className="bg-[#1A211D] border border-[#3C4A42]/30 rounded-xl overflow-hidden flex flex-col hover:border-[#9CC88D]/50 transition-colors group cursor-pointer"
                      >
                        <div className="h-48 relative overflow-hidden">
                          <img
                            src={report.image}
                            alt={report.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.src =
                                "https://placehold.co/400x192/1A211D/4D774E?text=No+Image";
                            }}
                          />

                          <div className="absolute top-3 right-3">
                            {getStatusBadge(report)}
                          </div>
                        </div>

                        <div className="p-5 flex flex-col gap-3 flex-1">
                          <div>
                            <h3 className="text-[#DDE4DD] text-lg font-semibold group-hover:text-[#9CC88D] transition-colors">
                              {report.title}
                            </h3>

                            <span className="flex items-center gap-1.5 text-[#71717A] text-xs font-semibold tracking-wide mt-1">
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              {getResolvedDateText(report)}
                            </span>
                          </div>

                          {report.resolutionNote && (
                            <div className="p-4 bg-[#9CC88D]/10 rounded-lg border-l-4 border-[#9CC88D] mt-auto">
                              <p className="text-[#DDE4DD] text-sm leading-relaxed">
                                {report.resolutionNote}
                              </p>
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>

                  <div className="p-8 mb-4 bg-[#9CC88D]/5 rounded-2xl border border-[#9CC88D]/10 flex flex-col items-center gap-3 text-center">
                    <div className="w-16 h-16 rounded-full bg-[#9CC88D]/20 flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-[#9CC88D]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>

                    <p className="text-xl font-semibold text-[#DDE4DD]">
                      You have {myResolvedReports.length} resolved{" "}
                      {myResolvedReports.length === 1 ? "case" : "cases"} in
                      your history!
                    </p>

                    <p className="text-[#A1A1AA] text-base max-w-lg leading-relaxed">
                      Whether recovering your own items or helping others find
                      theirs, your activity makes campus a better place. Keep it
                      up!
                    </p>
                  </div>
                </div>
              ))}

            <div className="h-6 md:h-8 w-full shrink-0"></div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default MyReports;