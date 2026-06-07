import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import { postsAPI } from "../services/api";

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

function Dashboard({ hasNotification = false }) {
  const { user } = useAuth();
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const displayName = user?.full_name
    ? user.full_name.split(" ")[0]
    : user?.email?.split("@")[0] || "Student";

  const loadDashboardData = useCallback(async () => {
    try {
      const data = await postsAPI.getAll({ limit: 6 });
      const posts = (data.posts || []).filter((p) => !p.is_resolved);
      setRecentReports(posts);
    } catch (err) {
      console.error("Failed to load posts", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const getCardBadge = (report) => {
    const type = (report.report_type || "").toUpperCase();
    const badgeStyle =
      type === "FOUND"
        ? "bg-[#11996C]/50 border-[#11996C]"
        : "bg-[#EF4444]/50 border-[#EF4444]/30";
    return (
      <div
        className={`absolute top-4 right-4 z-20 text-white text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur-md border ${badgeStyle}`}
      >
        {type || "REPORT"}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#0E1511] text-white overflow-hidden selection:bg-[#164A41] selection:text-white">
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

          <div className="mt-8">
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

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-[#9CC88D] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : recentReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center bg-[#1A211D] border border-dashed border-[#3C4A42]/50 rounded-xl py-16 px-6 text-center gap-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentReports.slice(0, 6).map((report) => (
                  <div
                    key={report.post_id}
                    className="bg-[#1A211D] border border-[#3C4A42]/30 rounded-xl overflow-hidden shadow-sm flex flex-col"
                  >
                    <div className="h-48 bg-[#2F3632] relative overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-0 bg-linear-to-t from-[#1A211D] to-transparent opacity-60 z-10"></div>
                      <img
                        src={
                          report.item_image ||
                          "https://placehold.co/400x240/1A211D/4D774E?text=No+Image"
                        }
                        alt={report.caption || "Item"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src =
                            "https://placehold.co/400x240/1A211D/4D774E?text=No+Image";
                        }}
                      />
                      {getCardBadge(report)}
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <h4 className="text-[#DDE4DD] text-base font-medium mb-2">
                        {report.caption || "Untitled Item"}
                      </h4>
                      <div className="space-y-2 mb-4 flex-1">
                        {report.building_location && (
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
                              {report.building_location}
                            </span>
                          </div>
                        )}
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
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {formatTimeAgo(report.created_at)}
                        </div>
                      </div>
                      <Link
                        to={`/item/${report.post_id}`}
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