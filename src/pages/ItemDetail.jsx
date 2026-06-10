import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { postsAPI, chatAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

function formatDate(dateString) {
  if (!dateString) return "-";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function ItemDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await postsAPI.getById(id);
      setPost(data.post);
    } catch {
      setPost(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const isOwner = user && post && user.id === post.user_id;
  const isResolved = post?.is_resolved;
  const isLost = post?.report_type === "LOST";

  const handleChat = async () => {
    if (!user) { navigate("/login"); return; }
    if (isOwner) { alert("Kamu tidak bisa chat dengan diri sendiri."); return; }
    setChatLoading(true);
    try {
      const data = await chatAPI.getOrCreateRoom(post.post_id);
      navigate(`/messages/${data.room.room_id}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setChatLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!confirm("Tandai item ini sebagai sudah ditemukan/diselesaikan?")) return;
    try {
      await postsAPI.resolve(id);
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[100dvh] bg-[#0E1511] items-center justify-center text-white">
        <div className="w-8 h-8 border-2 border-[#9CC88D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col h-[100dvh] bg-[#0E1511] items-center justify-center gap-4 text-white">
        <h2 className="text-2xl font-bold text-[#DDE4DD]">Item not found</h2>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-[#164A41] rounded-lg">Go Back</button>
      </div>
    );
  }

  const badge = isResolved
    ? { text: "RESOLVED", style: "bg-[#11996C]/80 border-[#11996C]" }
    : isLost
      ? { text: "LOST", style: "bg-[#EF4444]/50 border-[#EF4444]/30" }
      : { text: "FOUND", style: "bg-[#11996C]/50 border-[#11996C]" };

  return (
    <div className="flex h-[100dvh] min-h-0 bg-[#0E1511] text-white overflow-hidden selection:bg-[#164A41] selection:text-white">
      <Sidebar activePage="" />
      <div className="flex-1 min-w-0 min-h-0 flex flex-col h-full overflow-hidden">
        <TopBar />
        <main className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-[calc(9rem+env(safe-area-inset-bottom))] md:p-8 flex flex-col items-center">
          <div className="w-full max-w-250 flex flex-col gap-6">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#86948A] text-sm font-medium hover:text-[#DDE4DD] transition-colors w-fit">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              back
            </button>

            <div className="flex flex-col lg:flex-row gap-6 items-start mt-2">
              <div className="w-full lg:w-[45%] h-75 lg:h-125 bg-[#A0A0A0] rounded-xl outline outline-neutral-700 overflow-hidden shrink-0">
                <img src={post.item_image || "https://placehold.co/500x500/1A211D/4D774E?text=No+Image"}
                  alt={post.caption} className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = "https://placehold.co/500x500/1A211D/4D774E?text=No+Image"; }} />
              </div>

              <div className="w-full lg:w-[55%] bg-[#161D19] border border-[#3C4A42] rounded-xl p-5 md:p-6 lg:p-8 flex flex-col relative overflow-hidden">
                <div className="absolute inset-0 bg-[#164A41]/40 shadow-lg pointer-events-none" />
                <div className="relative z-10 flex flex-col flex-1">
                  <span className={`inline-block text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide backdrop-blur-sm mb-3 border ${badge.style}`}>
                    {badge.text}
                  </span>

                  <h2 className="text-[#DDE4DD] text-2xl md:text-3xl font-bold leading-tight mb-3">{post.caption || "Untitled Item"}</h2>

                  <hr className="border-[#3C4A42] my-4" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4 mb-6">
                    <div>
                      <h4 className="text-[#86948A] text-xs font-semibold uppercase tracking-wide mb-2">
                        {isLost ? "Date Lost" : "Date Found"}
                      </h4>
                      <p className="text-[#DDE4DD] text-base">{formatDate(post.occurrence_time || post.created_at)}</p>
                    </div>
                    <div>
                      <h4 className="text-[#86948A] text-xs font-semibold uppercase tracking-wide mb-2">Location</h4>
                      <p className="text-[#DDE4DD] text-base">{post.building_location || "Unknown location"}</p>
                    </div>
                    {post.detailed_location && (
                      <div>
                        <h4 className="text-[#86948A] text-xs font-semibold uppercase tracking-wide mb-2">Storage Location</h4>
                        <p className="text-[#DDE4DD] text-base">{post.detailed_location}</p>
                      </div>
                    )}
                    <div>
                      <h4 className="text-[#86948A] text-xs font-semibold uppercase tracking-wide mb-2">Category</h4>
                      <p className="text-[#DDE4DD] text-base">{post.category || "Others"}</p>
                    </div>
                    {post.description && (
                      <div className="md:col-span-2">
                        <h4 className="text-[#86948A] text-xs font-semibold uppercase tracking-wide mb-2">Description</h4>
                        <p className="text-[#DDE4DD] text-base leading-relaxed">{post.description}</p>
                      </div>
                    )}
                    {post.users && (
                      <div className="md:col-span-2">
                        <h4 className="text-[#86948A] text-xs font-semibold uppercase tracking-wide mb-2">
                          {isLost ? "Reported by" : "Found by"}
                        </h4>
                        <p className="text-[#DDE4DD] text-base">{post.users.full_name || "Unknown"}</p>
                        {post.users.faculty && <p className="text-[#86948A] text-sm">{post.users.faculty}</p>}
                      </div>
                    )}
                  </div>

                  <hr className="border-[#3C4A42] mb-6" />

                  <div className="mt-auto pt-4 flex flex-col gap-3">
                    {isResolved ? (
                      <div className="w-full py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-center text-base">
                        ✓ This item has been resolved
                      </div>
                    ) : (
                      <>
                        {!isOwner && (
                          <button onClick={handleChat} disabled={chatLoading}
                            className="w-full text-[18px] font-bold py-4 rounded-xl transition-all shadow-lg hover:-translate-y-0.5 bg-white hover:bg-gray-200 text-[#003824] shadow-white/10 flex justify-center items-center gap-2 disabled:opacity-60">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {chatLoading ? "Membuka chat..." : isLost ? "I Found This Item" : "This Is Mine"}
                          </button>
                        )}
                        {isOwner && (
                          <button onClick={handleResolve}
                            className="w-full text-[18px] font-bold py-4 rounded-xl transition-all bg-[#164A41] hover:bg-[#1a5a4e] border border-[#9CC88D]/30 text-[#9CC88D] flex justify-center items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Mark as Resolved
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}