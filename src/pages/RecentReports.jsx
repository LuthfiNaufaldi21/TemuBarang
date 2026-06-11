import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { postsAPI } from "../services/api";

const filters = ["All Items", "Electronics", "Keys", "Wallets & IDs", "Clothing", "Books", "Others"];

function formatDate(dateString) {
  if (!dateString) return "-";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function RecentReports() {
  const [activeFilter, setActiveFilter] = useState("All Items");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const itemsPerPage = 6;

  const load = useCallback(async () => {
    try {
      const data = await postsAPI.getAll({ limit: 100 });
      setAllPosts((data.posts || []).filter((p) => !p.is_resolved));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = allPosts.filter((p) => {
    if (activeFilter !== "All Items" && p.category !== activeFilter) return false;
    if (typeFilter !== "ALL" && p.report_type !== typeFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const current = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex h-[100dvh] min-h-0 bg-[#0E1511] text-white overflow-hidden selection:bg-[#164A41] selection:text-white">
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1A211D] border border-[#3C4A42]/30 w-full max-w-md max-h-[calc(100dvh-2rem)] rounded-2xl shadow-2xl flex flex-col overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-[#3C4A42]/30">
              <h3 className="text-[#DDE4DD] text-xl font-bold">Advanced Filters</h3>
              <button onClick={() => setIsFilterOpen(false)} className="text-[#A1A1AA] hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[#BBCABF] text-sm font-semibold">Report Type</label>
                <div className="flex bg-[#0E1511] border border-[#3C4A42] rounded-lg p-1">
                  {["ALL", "LOST", "FOUND"].map((type) => (
                    <button key={type} type="button" onClick={() => setTypeFilter(type)}
                      className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${typeFilter === type ? "bg-[#164A41] text-[#9CC88D]" : "text-[#A1A1AA] hover:text-[#DDE4DD]"}`}>
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#3C4A42]/30">
                <button onClick={() => { setTypeFilter("ALL"); setIsFilterOpen(false); }}
                  className="flex-1 py-3 border border-[#3C4A42] hover:bg-[#2F3632] text-[#DDE4DD] font-semibold rounded-xl transition-colors">Reset</button>
                <button onClick={() => setIsFilterOpen(false)}
                  className="flex-1 py-3 bg-[#9CC88D] hover:bg-[#8bb47d] text-[#13342E] font-bold rounded-xl transition-colors">Apply</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Sidebar activePage="recent-reports" />
      <div className="flex-1 min-w-0 min-h-0 flex flex-col h-full overflow-hidden">
        <TopBar />
        <main className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:p-8 md:pb-8 flex flex-col items-center">
          <div className="w-full max-w-300 mx-auto flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 w-full">
              <div className="flex flex-col gap-1">
                <Link to="/dashboard" className="inline-flex items-center gap-2 text-[#A1A1AA] hover:text-[#DDE4DD] transition-colors text-sm font-medium mb-2 w-fit">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  back
                </Link>
                <h2 className="text-[#DDE4DD] text-3xl font-bold mb-1">Recent Reports</h2>
                <p className="text-[#A1A1AA] text-base">Browse recently lost and found items on campus.</p>
              </div>
              <button onClick={() => setIsFilterOpen(true)}
                className="px-5 py-2.5 bg-[#1A211D] hover:bg-[#242C27] border border-[#3C4A42]/30 rounded-xl text-[#DDE4DD] text-sm font-semibold flex items-center gap-2 transition-colors shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Advanced Filters
                {typeFilter !== "ALL" && <span className="w-2 h-2 rounded-full bg-[#F1B24A]" />}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full mb-4">
              {filters.map((f) => (
                <button key={f} onClick={() => { setActiveFilter(f); setCurrentPage(1); }}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${activeFilter === f ? "bg-[#164A41] text-[#9CC88D]" : "bg-[#1A211D] text-[#A1A1AA] hover:bg-[#242C27] hover:text-[#DDE4DD]"}`}>
                  {f}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-[#9CC88D] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="w-full min-h-100 flex flex-col items-center justify-center bg-[#1A211D] border border-dashed border-[#4D774E]/50 rounded-2xl py-20 px-6 text-center mt-2">
                <p className="text-[#DDE4DD] text-lg font-semibold">No items found</p>
                <p className="text-[#86948A] text-sm mt-1">{allPosts.length === 0 ? "No reports submitted yet." : "No reports match your current filters."}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full mt-2">
                {current.map((post) => (
                  <div key={post.post_id} className="bg-[#1A211D] border border-[#3C4A42]/30 rounded-xl overflow-hidden shadow-sm flex flex-col">
                    <div className="h-48 bg-[#2F3632] relative overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-0 bg-linear-to-t from-[#1A211D] to-transparent opacity-60 z-10" />
                      <img src={post.item_image || "https://placehold.co/400x192/1A211D/4D774E?text=No+Image"}
                        alt={post.caption} className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = "https://placehold.co/400x192/1A211D/4D774E?text=No+Image"; }} />
                      <div className={`absolute top-4 right-4 z-20 text-white text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur-md border ${post.report_type === "FOUND" ? "bg-[#11996C]/50 border-[#11996C]" : "bg-[#EF4444]/50 border-[#EF4444]/30"}`}>
                        {post.report_type || "REPORT"}
                      </div>
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <h4 className="text-[#DDE4DD] text-base font-medium mb-2">{post.caption || "Untitled Item"}</h4>
                      <div className="space-y-2 mb-6 flex-1">
                        <div className="flex items-center gap-2 text-[#BBCABF] text-sm">
                          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="truncate">{post.building_location || "Unknown location"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#BBCABF] text-sm">
                          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{formatDate(post.occurrence_time || post.created_at)}</span>
                        </div>
                      </div>
                      <Link to={`/item/${post.post_id}`} className="w-full bg-[#13342E] border border-[#3C4A42]/50 text-[#9CC88D] py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1a443d] transition-colors flex justify-center items-center">
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filtered.length > 0 && (
              <div className="w-full flex flex-col md:flex-row justify-between items-center gap-4 mt-6 pt-5 pb-2 border-t border-[#27272A]">
                <div className="text-[#71717A] text-sm">
                  Showing{" "}
                  <span className="text-[#DDE4DD] font-semibold">
                    {filtered.length}
                  </span>{" "}
                  reports
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    {/* tombol previous, angka halaman, dan next */}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}