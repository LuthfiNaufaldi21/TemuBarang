import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { chatAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

function formatTime(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24)
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Messages() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await chatAPI.getRooms();
      setRooms(data.rooms || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const getOtherName = (room) => {
    if (!user) return "Unknown";
    if (user.id === room.initiator_id)
      return room.post_owner?.full_name || "Unknown";
    return room.initiator?.full_name || "Unknown";
  };

  const filtered = rooms.filter((room) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      getOtherName(room).toLowerCase().includes(q) ||
      room.posts?.caption?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex h-[100dvh] min-h-0 bg-[#0E1511] text-white overflow-hidden">
      <Sidebar activePage="messages" />
      <div className="flex-1 min-w-0 min-h-0 flex flex-col h-full overflow-hidden">
        <TopBar />
        <main className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-[calc(8rem+env(safe-area-inset-bottom))] md:p-10 flex flex-col items-center">
          <div className="w-full max-w-225 flex flex-col gap-6">
            <h2 className="text-[#E4E4E7] text-3xl font-bold leading-10">
              Messages
            </h2>

            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86948A]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#09100C] border border-[#27272A] rounded-xl py-3.5 pl-12 pr-4 text-[#DDE4DD] text-base focus:outline-none focus:border-[#4EDEA3] transition-colors placeholder-[#86948A]"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-[#9CC88D] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-16 h-16 rounded-full bg-[#18181B] border border-[#27272A] flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-[#3C4A42]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-[#86948A] text-base font-medium">
                    {searchQuery ? "No conversations found" : "No messages yet"}
                  </p>
                  <p className="text-[#3C4A42] text-sm mt-1">
                    {searchQuery
                      ? "Try a different search"
                      : "Start a conversation via an item's detail page"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                {filtered.map((room) => {
                  const otherName = getOtherName(room);
                  const otherInitial = otherName.substring(0, 2).toUpperCase();
                  return (
                    <div key={room.room_id} onClick={() => navigate(`/messages/${room.room_id}`)}
                      className="w-full p-4 bg-[#18181B] rounded-xl cursor-pointer transition-all hover:bg-[#1E2820] hover:outline hover:outline-[#3C4A42] flex items-start gap-4"
                    >
                      <div className="shrink-0 flex items-center self-center">
                        {room.posts?.item_image ? (
                          <img
                            src={room.posts.item_image}
                            alt={room.posts.caption}
                            className="w-14 h-14 rounded-lg object-cover shadow-sm"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-[#242C27] border border-[#3C4A42] flex items-center justify-center text-[#86948A] text-lg font-bold">
                            {otherInitial}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 py-1 flex flex-col justify-center">
                        <span className="text-sm font-medium leading-5 tracking-tight truncate text-[#BBCABF]">
                          {otherName}
                        </span>
                        {room.posts?.caption && (
                          <div className="flex items-center gap-1.5 mb-1">
                            <svg
                              className="w-3 h-3 shrink-0 text-[#71717A]"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="text-xs font-semibold text-[#71717A] truncate">
                              {room.posts.caption}
                            </span>
                          </div>
                        )}
                        <p className="text-base leading-6 truncate text-[#71717A]">
                          Tap to open conversation
                        </p>
                      </div>
                      <div className="shrink-0 flex flex-col items-center gap-6 py-1">
                        <span className="text-xs font-semibold text-[#71717A] whitespace-nowrap">
                          {formatTime(room.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
