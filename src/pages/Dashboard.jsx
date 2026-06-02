import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";

function formatTimeAgo(dateString) {
  if (!dateString) return "Just now";

  const created = new Date(dateString);

  if (Number.isNaN(created.getTime())) return "Just now";

  const now = new Date();
  const diffMs = now - created;

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? "s" : ""} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;

  return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
}

function normalizeStatus(status) {
  return (status || "searching").toLowerCase().replace(/\s/g, "_");
}

function isResolvedStatus(status) {
  const normalized = normalizeStatus(status);

  return (
    normalized === "resolved" ||
    normalized === "returned" ||
    normalized === "closed"
  );
}

function normalizeActivity(activity) {
  if (activity.createdAt) return activity;

  return {
    ...activity,
    createdAt: new Date().toISOString(),
  };
}

function readStorageArray(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch (error) {
    console.error(`Failed to read ${key}`, error);
    return [];
  }
}

function getReportLocation(report) {
  return (
    report.location ||
    report.foundLocation ||
    report.storageLocation ||
    "Unknown location"
  );
}

function getReportDateText(report) {
  if (report.dateText) return report.dateText;

  const rawDate = report.date || report.createdAt || report.updatedAt;

  if (!rawDate) return "-";

  const parsedDate = new Date(rawDate);

  if (Number.isNaN(parsedDate.getTime())) return "-";

  return parsedDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function sortReportsByLatest(reports) {
  return [...reports].sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.createdAt || a.date || 0);
    const dateB = new Date(b.updatedAt || b.createdAt || b.date || 0);

    return dateB - dateA;
  });
}

function Dashboard({ hasNotification = false }) {
  const [userData, setUserData] = useState(() => {
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
            avatarUrl: parsed.avatarUrl || null,
          };
        } catch (error) {
          console.error("Failed to read profile from localStorage", error);
        }
      }

      return {
        name: currentUserEmail.split("@")[0],
        avatarUrl: null,
      };
    }

    return {
      name: "Student",
      avatarUrl: null,
    };
  });

  const [recentReports, setRecentReports] = useState([]);
  const [activities, setActivities] = useState([]);
  const [, setNowTick] = useState(Date.now());

  const loadUserData = () => {
    const currentUserEmail = localStorage.getItem("currentUserEmail");

    if (!currentUserEmail) {
      setUserData({
        name: "Student",
        avatarUrl: null,
      });
      return;
    }

    const profileKey = `temuProfile_${currentUserEmail}`;
    const savedProfile = localStorage.getItem(profileKey);

    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);

        setUserData({
          name: parsed.fullName
            ? parsed.fullName.split(" ")[0]
            : currentUserEmail.split("@")[0],
          avatarUrl: parsed.avatarUrl || null,
        });

        return;
      } catch (error) {
        console.error("Failed to read profile from localStorage", error);
      }
    }

    setUserData({
      name: currentUserEmail.split("@")[0],
      avatarUrl: null,
    });
  };

  const loadDashboardData = useCallback(() => {
    loadUserData();

    const parsedReports = readStorageArray("temuReports");

    const activeReports = parsedReports.filter((report) => {
      const status = normalizeStatus(report.status);
      return !isResolvedStatus(status);
    });

    setRecentReports(sortReportsByLatest(activeReports));

    const parsedActivities = readStorageArray("temuActivities");

    const realActivities = parsedActivities.filter((activity) => {
      const isOldMock =
        activity.id === 1 || activity.id === 2 || activity.id === 3;

      const activityType = normalizeStatus(activity.type);
      const activityKind = normalizeStatus(activity.kind);
      const hiddenActivityTypes = [
        "match_rejected",
        "rejected",
        "not_my_item",
        "verification",
        "verifying",
        "match_found",
      ];

      const shouldHideActivity =
        hiddenActivityTypes.includes(activityType) ||
        hiddenActivityTypes.includes(activityKind);

      return !isOldMock && !shouldHideActivity;
    });

    const normalizedActivities = realActivities.map(normalizeActivity);

    normalizedActivities.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);

      return dateB - dateA;
    });

    setActivities(normalizedActivities);
    localStorage.setItem("temuActivities", JSON.stringify(normalizedActivities));
  }, []);

  useEffect(() => {
    loadDashboardData();

    const handleStorageChange = (event) => {
      if (
        !event.key ||
        event.key === "temuReports" ||
        event.key === "temuActivities" ||
        event.key === "temuConversations" ||
        event.key === "temuNotifications" ||
        event.key.includes("temuProfile")
      ) {
        loadDashboardData();
      }
    };

    const handleFocus = () => {
      loadDashboardData();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadDashboardData();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("temuStorage", handleStorageChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const intervalId = setInterval(() => {
      setNowTick(Date.now());
    }, 30000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("temuStorage", handleStorageChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [loadDashboardData]);

  const displayName = userData.name;

  const getCardBadge = (report) => {
    const type = (report.type || "").toUpperCase();
    const status = normalizeStatus(report.status);

    let badgeText = type || "REPORT";
    let badgeStyle =
      type === "FOUND"
        ? "bg-[#11996C]/50 border-[#11996C]"
        : "bg-[#EF4444]/50 border-[#EF4444]/30";

    if (status === "verifying") {
      badgeText = "VERIFYING";
      badgeStyle = "bg-blue-600/50 border-blue-500/30";
    } else if (status === "match_found") {
      badgeText = type === "FOUND" ? "OWNER FOUND" : "MATCH FOUND";
      badgeStyle = "bg-amber-500/50 border-amber-500/30";
    } else if (status === "searching") {
      badgeText = type === "FOUND" ? "FOUND" : "LOST";
    }

    return (
      <div
        className={`absolute top-4 right-4 z-20 text-white text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur-md border ${badgeStyle}`}
      >
        {badgeText}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#0E1511] text-white  overflow-hidden selection:bg-[#164A41] selection:text-white">
      <Sidebar activePage="dashboard" />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar hasNotification={hasNotification} />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-28 md:pb-8">
          <div className="bg-[#164A41]/40 border border-[#4D774E]/20 rounded-3xl p-8 md:p-10 relative overflow-hidden backdrop-blur-sm">
            <div className="absolute -top-32 -right-20 w-64 h-64 bg-[#164A41] rounded-full blur-2xl opacity-60"></div>

            <div className="relative z-10">
              <h2 className="text-[#E2E3DD] text-3xl font-bold mb-2">
                Welcome, {displayName}!
              </h2>

              <p className="text-[#C2C9BD] text-lg font-normal">
                Here is an overview of campus property reports.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col lg:flex-row gap-6 items-start">
            <div className="flex-1 flex flex-col w-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white text-xl font-semibold tracking-wide">
                  Recent Reports
                </h3>

                {recentReports.length > 0 && (
                  <Link
                    to="/recent-reports"
                    className="text-[#9CC88D] text-xs font-bold uppercase tracking-wide hover:underline"
                  >
                    View All Items
                  </Link>
                )}
              </div>

              {recentReports.length === 0 ? (
                <div className="flex flex-col items-center justify-center bg-[#1A211D] border border-dashed border-[#3C4A42]/50 rounded-xl py-16 px-6 text-center gap-4 h-full">
                  <div className="w-14 h-14 rounded-full bg-[#13342E] border border-[#3C4A42] flex items-center justify-center">
                    <svg
                      className="w-7 h-7 text-[#9CC88D]"
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

                  <div>
                    <p className="text-[#DDE4DD] text-base font-semibold">
                      No reports yet
                    </p>

                    <p className="text-[#86948A] text-sm mt-1 max-w-70 mx-auto">
                      Start by submitting a lost or found item report.
                    </p>
                  </div>

                  <Link
                    to="/report-item"
                    className="mt-2 px-5 py-2.5 bg-[#9CC88D] hover:bg-[#8bb47d] text-[#13342E] text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Report New Item
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {recentReports.slice(0, 4).map((report) => (
                    <div
                      key={report.id}
                      className="bg-[#1A211D] border border-[#3C4A42]/30 rounded-xl overflow-hidden shadow-sm flex flex-col"
                    >
                      <div className="h-60 bg-[#2F3632] relative overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 bg-linear-to-t from-[#1A211D] to-transparent opacity-60 z-10"></div>

                        <img
                          src={report.image}
                          alt={report.title || "Item"}
                          className="w-full h-full object-cover"
                          onError={(event) => {
                            event.target.src =
                              "https://placehold.co/400x240/1A211D/4D774E?text=No+Image";
                          }}
                        />

                        {getCardBadge(report)}
                      </div>

                      <div className="p-5 flex flex-col flex-1">
                        <h4 className="text-[#DDE4DD] text-base font-medium mb-2">
                          {report.title || "Untitled Item"}
                        </h4>

                        <p className="text-[#BBCABF] text-[14px] leading-relaxed mb-4 flex-1">
                          {report.description || "No description provided."}
                        </p>

                        <div className="space-y-2 mb-6">
                          <div className="flex items-center gap-2 text-[#BBCABF] text-sm">
                            <svg
                              className="w-4 h-4 shrink-0"
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

                            <span className="truncate">
                              {getReportLocation(report)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[#BBCABF] text-sm">
                            <svg
                              className="w-4 h-4 shrink-0"
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

                            {getReportDateText(report)}
                          </div>
                        </div>

                        <Link
                          to={`/item/${report.id}`}
                          className="w-full bg-[#13342E] border border-[#3C4A42]/50 text-[#9CC88D] py-2.5 rounded-lg text-sm hover:bg-[#1a443d] transition-colors flex justify-center"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="w-full lg:w-87.5 shrink-0">
              <div className="bg-[#164A41]/60 border border-[#4D774E]/20 rounded-xl p-6 backdrop-blur-md relative overflow-hidden flex flex-col">
                <h3 className="text-[#A7D296] text-xl font-semibold mb-6">
                  Campus Activity
                </h3>

                <div className="relative max-h-120 overflow-y-auto pl-2 pr-2 pb-24 scrollbar-hide">
                  <div className="relative border-l border-[#4D774E]/40 ml-2.75 space-y-6 pb-6 pt-2">
                    {activities.length === 0 ? (
                      <p className="text-xs text-[#BBCABF] pl-6">
                        No activity yet.
                      </p>
                    ) : (
                      activities.map((item) => (
                        <div key={item.id} className="relative pl-6">
                          {/* UI REVISI: Icon ceklis ketika status item Resolved */}
                          <div className="absolute -left-3.25 top-1 w-6 h-6 bg-[#164A41] border border-[#4D774E] rounded-full flex items-center justify-center">
                            {item.kind === "found1" ? (
                              <svg
                                className="w-3 h-3 text-[#9CC88D]"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={4}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M12 5v14M5 12h14"
                                />
                              </svg>
                            ) : item.kind === "urgent1" ? (
                              <svg
                                className="w-3 h-3 text-[#FFB4AB]"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={4}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M12 7v8"
                                />
                                <circle
                                  cx="12"
                                  cy="22"
                                  r="2"
                                  fill="currentColor"
                                  stroke="none"
                                />
                              </svg>
                            ) : item.kind === "resolved" || item.type === "RESOLVED" ? (
                              <svg
                                className="w-3.5 h-3.5 text-[#F1B24A]"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-3 h-3 text-[#9CC88D]"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={4}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M12 5v14M5 12h14"
                                />
                              </svg>
                            )}
                          </div>

                          <p className="text-[#E2E3DD] text-sm leading-snug">
                            <span className="font-bold">
                              {item.kind === "resolved" || item.type === "RESOLVED"
                                ? "Item Resolved"
                                : item.title || "Activity"}
                              :{" "}
                            </span>
                            {item.text || "New activity recorded."}
                          </p>

                          <p className="text-[#9DC88D]/50 text-xs mt-1">
                            {formatTimeAgo(item.createdAt)} •{" "}
                            {item.place || "Campus Area"}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-20 bg-linear-to-t from-[#0e1a15] to-transparent pointer-events-none rounded-b-xl"></div>
              </div>
            </div>
          </div>

          <footer className="mt-12 pt-6 border-t border-[#18181B] flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#71717A] w-full">
            <p className="text-[#D4D4D8] font-semibold">TemuBarang</p>

            <p>©️ 2026 TemuBarang</p>

            <div className="flex gap-4">
              <a
                href="#privacy"
                className="hover:text-white underline transition-colors"
              >
                Privacy Policy
              </a>

              <a
                href="#terms"
                className="hover:text-white underline transition-colors"
              >
                Terms of Service
              </a>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;