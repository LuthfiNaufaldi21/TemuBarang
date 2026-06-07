import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { postsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

function formatDate(dateString) {
  if (!dateString) return "-";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function MyReports() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("active");
  const [activePosts, setActivePosts] = useState([]);
  const [resolvedPosts, setResolvedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await postsAPI.getMy();
      const posts = data.posts || [];
      setActivePosts(posts.filter((p) => !p.is_resolved));
      setResolvedPosts(posts.filter((p) => p.is_resolved));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getTypeBadge = (post) => {
    const type = post.report_type || "LOST";
    const style = type === "FOUND" ? "bg-[#11996C]/50 border-[#11996C] text-white" : "bg-[#EF4444]/50 border-[#EF4444]/30 text-white";
    return <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${style}`}>{type}</span>;
  };

  return (
    <div className="flex h-screen bg-[#0E1511] text-white overflow-hidden selection:bg-[#164A41] selection:text-white">
      <Sidebar activePage="my-reports" />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-scroll p-6 md:p-8 flex flex-col items-center">
          <div className="w-full max-w-300 mx-auto flex flex-col gap-6 min-h-[calc(100vh-140px)] pb-32 md:pb-40">
            <div className="flex flex-col gap-1 w-full">
              <h2 className="text-[#DDE4DD] text-3xl font-bold mb-1">
                {activeTab === "active" ? "My Reports" : "Report History"}
              </h2>
              <p className="text-[#A1A1AA] text-base">
                {activeTab === "active" ? "Track the progress of your reports." : "Your resolved and closed reports."}
              </p>
            </div>

            <div className="border-b border-[#27272A] flex gap-8">
              {["active", "resolved"].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`relative pb-4 text-sm font-bold tracking-tight transition-colors ${activeTab === tab ? "text-[#9CC88D]" : "text-[#A1A1AA] hover:text-[#DDE4DD]"}`}>
                  {tab.toUpperCase()}
                  {activeTab === tab && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9CC88D] rounded-t-full" />}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-[#9CC88D] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : activeTab === "active" ? (
              activePosts.length === 0 ? (
                <div className="w-full min-h-100 flex flex-col items-center justify-center bg-[#1A211D] border border-dashed border-[#4D774E]/50 rounded-2xl py-20 px-6 text-center mt-2">
                  <p className="text-[#DDE4DD] text-lg font-semibold mb-2">No active reports yet</p>
                  <p className="text-[#86948A] text-sm">Lost or found something on campus?</p>
                  <Link to="/report-item" className="mt-6 px-6 py-2.5 bg-[#9CC88D] text-[#13342E] font-bold rounded-lg text-sm hover:bg-[#8bb47d] transition-colors">Report New Item</Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4 mt-2">
                  {activePosts.map((post) => (
                    <div key={post.post_id} className="bg-[#1A211D] border border-[#3C4A42]/30 rounded-xl overflow-hidden flex">
                      <div className="w-64 shrink-0 relative overflow-hidden">
                        <img src={post.item_image || "https://placehold.co/256x200/1A211D/4D774E?text=No+Image"}
                          alt={post.caption} className="w-full h-full object-cover min-h-50"
                          onError={(e) => { e.target.src = "https://placehold.co/256x200/1A211D/4D774E?text=No+Image"; }} />
                      </div>
                      <div className="flex-1 p-6 flex flex-col justify-between">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-start justify-between">
                            <h3 className="text-[#DDE4DD] text-xl font-bold">{post.caption || "Untitled"}</h3>
                            {getTypeBadge(post)}
                          </div>
                          <div className="flex items-center gap-6">
                            <span className="flex items-center gap-2 text-sm text-[#BBCABF]">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {post.building_location || "-"}
                            </span>
                            <span className="flex items-center gap-2 text-sm text-[#BBCABF]">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatDate(post.occurrence_time || post.created_at)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-end pt-4 mt-2">
                          <Link to={`/item/${post.post_id}`}
                            className="flex items-center gap-2 px-6 py-2 bg-[#13342E] border border-[#3C4A42]/50 text-[#9CC88D] text-sm font-semibold rounded-lg hover:bg-[#1a443d] transition-colors">
                            View Details
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              resolvedPosts.length === 0 ? (
                <div className="w-full min-h-100 flex flex-col items-center justify-center bg-[#1A211D] border border-dashed border-[#4D774E]/50 rounded-2xl py-20 px-6 text-center mt-2">
                  <p className="text-[#DDE4DD] text-lg font-semibold mb-2">No resolved reports yet</p>
                  <p className="text-[#86948A] text-sm">Reports that have been resolved will appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
                  {resolvedPosts.map((post) => (
                    <Link to={`/item/${post.post_id}`} key={post.post_id}
                      className="bg-[#1A211D] border border-[#3C4A42]/30 rounded-xl overflow-hidden flex flex-col hover:border-[#9CC88D]/50 transition-colors group">
                      <div className="h-48 relative overflow-hidden">
                        <img src={post.item_image || "https://placehold.co/400x192/1A211D/4D774E?text=No+Image"}
                          alt={post.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { e.target.src = "https://placehold.co/400x192/1A211D/4D774E?text=No+Image"; }} />
                        <div className="absolute top-3 right-3">
                          <span className="px-3 py-1 rounded-full text-xs font-bold border bg-[#11996C]/80 border-[#11996C] text-white">RESOLVED</span>
                        </div>
                      </div>
                      <div className="p-5 flex flex-col gap-3 flex-1">
                        <h3 className="text-[#DDE4DD] text-lg font-semibold group-hover:text-[#9CC88D] transition-colors">{post.caption}</h3>
                        <span className="text-[#71717A] text-xs font-semibold">{formatDate(post.created_at)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            )}
          </div>
        </main>
      </div>
    </div>
  );
}