import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import { postsAPI } from "../services/api";

export default function Profile() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ lost: 0, found: 0, resolved: 0 });

  const loadStats = useCallback(async () => {
    try {
      const data = await postsAPI.getMy();
      const posts = data.posts || [];
      setStats({
        lost: posts.filter((p) => p.report_type === "LOST").length,
        found: posts.filter((p) => p.report_type === "FOUND").length,
        resolved: posts.filter((p) => p.is_resolved).length,
      });
    } catch {}
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const totalPossible = stats.lost + stats.found;
  const ratePercent = totalPossible > 0 ? Math.min(Math.round((stats.resolved / totalPossible) * 100), 100) : 0;

  return (
    <div className="flex h-screen bg-[#0E1511] text-white overflow-hidden selection:bg-[#164A41] selection:text-white">
      <Sidebar activePage="profile" />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col items-center">
          <div className="w-full max-w-6xl flex flex-col gap-8">
            <div className="relative w-full rounded-2xl overflow-hidden bg-[#18181B] shadow-md">
              <div className="absolute inset-0 opacity-40 bg-linear-to-r from-[#9CC88D] to-[#18181B]" />
              <div className="relative p-8 flex flex-col md:flex-row items-center md:items-center justify-between gap-6">
                <div className="flex flex-col md:flex-row items-center gap-6 w-full">
                  <div className="relative w-32 h-32 rounded-full border-4 border-[#9CC88D] bg-[#164A41] shadow-2xl flex items-center justify-center shrink-0 overflow-hidden">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-24 h-24 text-[#9CC88D] absolute -bottom-2" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left gap-1">
                    <h2 className="text-[#DDE4DD] text-3xl font-bold">{user?.full_name || "—"}</h2>
                    <div className="flex flex-col md:flex-row items-center gap-4 mt-2">
                      {user?.student_id_number && (
                        <div className="flex items-center gap-1.5 text-[#A1A1AA] text-sm">
                          <svg className="w-4 h-4 text-[#9CC88D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                          </svg>
                          ID: {user.student_id_number}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-[#A1A1AA] text-sm">
                        <svg className="w-4 h-4 text-[#9CC88D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {user?.email || "—"}
                      </div>
                      {user?.faculty && (
                        <div className="flex items-center gap-1.5 text-[#A1A1AA] text-sm">
                          <span className="text-[#9CC88D]">🎓</span>
                          {user.faculty}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="shrink-0 mt-4 md:mt-0">
                  <Link to="/edit-profile" className="px-6 py-2.5 bg-[#27272A] border border-[#3F3F46] rounded-xl text-[#DDE4DD] text-base font-semibold hover:bg-[#3F3F46] transition-colors inline-block text-center shadow-sm">
                    Edit Profile
                  </Link>
                </div>
              </div>
            </div>

            <div className="w-full bg-[#1A211D] border border-[#27272A]/50 shadow-sm rounded-2xl p-8 flex flex-col gap-6">
              <h3 className="text-[#DDE4DD] text-2xl font-semibold">Profile Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#27272A]/50 border border-[#3F3F46]/30 rounded-xl p-6 flex flex-col gap-2">
                  <p className="text-[#71717A] text-xs font-bold uppercase tracking-wide">LOST ITEMS</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[#DDE4DD] text-3xl font-black">{String(stats.lost).padStart(2, "0")}</span>
                    <span className="text-[#B7FF9E] text-xs font-bold">{stats.lost > 0 ? "Active Reports" : "No Reports"}</span>
                  </div>
                </div>
                <div className="bg-[#27272A]/50 border border-[#3F3F46]/30 rounded-xl p-6 flex flex-col gap-2">
                  <p className="text-[#71717A] text-xs font-bold uppercase tracking-wide">FOUND ITEMS</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[#DDE4DD] text-3xl font-black">{String(stats.found).padStart(2, "0")}</span>
                    <span className="text-[#B7FF9E] text-xs font-bold">{stats.found > 0 ? "Items Found" : "No Reports"}</span>
                  </div>
                </div>
                <div className="bg-[#9CC88D]/10 border border-[#9CC88D]/20 rounded-xl p-6 flex flex-col gap-2">
                  <p className="text-[#B7FF9E] text-xs font-bold uppercase tracking-wide leading-tight">SUCCESSFUL<br />MATCHES</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[#B7FF9E] text-3xl font-black">{String(stats.resolved).padStart(2, "0")}</span>
                    <span className="text-[#9CC88D]/60 text-xs font-bold">{ratePercent}% Rate</span>
                  </div>
                </div>
              </div>
              <div className="w-full h-2 bg-[#27272A] rounded-full overflow-hidden mt-2">
                <div className="h-full bg-[#9CC88D] rounded-full transition-all duration-1000 ease-out" style={{ width: `${ratePercent}%` }} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}