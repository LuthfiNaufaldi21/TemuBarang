import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { postsAPI } from "../services/api";

const categories = ["All Items", "Electronics", "Keys", "Wallets & IDs", "Clothing", "Books", "Others"];

function formatDate(dateString) {
  if (!dateString) return "-";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function LostItems() {
  const [activeFilter, setActiveFilter] = useState("All Items");
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const load = useCallback(async () => {
    try {
      const data = await postsAPI.getAll({ type: "lost" });
      setAllPosts((data.posts || []).filter((p) => !p.is_resolved));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = activeFilter === "All Items"
    ? allPosts
    : allPosts.filter((p) => p.category === activeFilter);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const current = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex h-[100dvh] min-h-0 bg-[#0E1511] text-white overflow-hidden">
      <Sidebar activePage="lost-items" />
      <div className="flex-1 min-w-0 min-h-0 flex flex-col h-full overflow-hidden">
        <TopBar />
        <main className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:p-8 md:pb-8 flex flex-col items-center">
          <div className="w-full max-w-300 mx-auto flex flex-col gap-6">
            <div className="flex flex-col gap-1 w-full">
              <h2 className="text-[#DDE4DD] text-3xl font-bold mb-1">Lost Items Gallery</h2>
              <p className="text-[#A1A1AA] text-base">Help your community reunite with their belongings.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full mb-4">
              {categories.map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setActiveFilter(f);
                    setCurrentPage(1);
                  }}
                  className={`px-4 md:px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeFilter === f
                      ? "bg-[#164A41] text-[#9CC88D]"
                      : "bg-[#1A211D] text-[#A1A1AA] hover:bg-[#242C27] hover:text-[#DDE4DD]"
                  }`}
                >
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
                <p className="text-[#DDE4DD] text-lg font-semibold">No lost items found</p>
                <p className="text-[#86948A] text-sm mt-1">
                  {allPosts.length === 0 ? "No active lost item reports yet." : "No items match the selected category."}
                </p>
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
                      <div className="absolute top-4 right-4 z-20 text-white text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur-md border bg-[#EF4444]/50 border-[#EF4444]/30">LOST</div>
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
              <div className="w-full flex flex-col md:flex-row justify-between items-center gap-5 mt-8 pt-6 pb-2 border-t border-[#27272A]">
                <div className="text-[#71717A] text-sm">Showing <span className="text-[#DDE4DD] font-semibold">{filtered.length}</span> lost items</div>
                <div className="flex items-center gap-2">
                  <button onClick={() => currentPage > 1 && setCurrentPage(p => p - 1)} disabled={currentPage <= 1}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-colors ${currentPage <= 1 ? "border-[#27272A] text-[#27272A] opacity-50 cursor-not-allowed" : "border-[#3C4A42] text-[#A1A1AA] hover:bg-white/5"}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button key={page} onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${currentPage === page ? "bg-[#9CC88D] text-[#174A41] font-bold" : "border border-[#27272A] text-[#A1A1AA] hover:bg-white/5"}`}>
                      {page}
                    </button>
                  ))}
                  <button onClick={() => currentPage < totalPages && setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-colors ${currentPage >= totalPages ? "border-[#27272A] text-[#27272A] opacity-50 cursor-not-allowed" : "border-[#3C4A42] text-[#A1A1AA] hover:bg-white/5"}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}