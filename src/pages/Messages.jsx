import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";

// HELPER: format waktu relatif
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
  if (diffHours < 24) {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)
    return date.toLocaleDateString("en-US", { weekday: "long" });
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// FILTER DROPDOWN COMPONENT
function FilterDropdown({ activeFilter, onFilterChange, onClose }) {
  const filters = [
    { value: "all", label: "All Conversations" },
    { value: "unread", label: "Unread" },
    { value: "active", label: "Active Cases" },
    { value: "closed", label: "Closed Cases" },
  ];

  return (
    <div className="absolute right-0 top-full mt-2 w-52 bg-[#18181B] border border-[#3C4A42] rounded-xl shadow-2xl z-50 overflow-hidden">
      <div className="p-1.5 flex flex-col gap-0.5">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              onFilterChange(f.value);
              onClose();
            }}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2.5 ${
              activeFilter === f.value
                ? "bg-[#9CC88D]/15 text-[#9CC88D]"
                : "text-[#A1A1AA] hover:bg-white/5 hover:text-[#DDE4DD]"
            }`}
          >
            {activeFilter === f.value && (
              <svg
                className="w-3.5 h-3.5 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {activeFilter !== f.value && (
              <div className="w-3.5 shrink-0" />
            )}
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// MESSAGES PAGE
function Messages() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [showFilter, setShowFilter] = useState(false);

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
        } catch (e) {}
      }
      return {
        name: currentUserEmail.split("@")[0],
        email: currentUserEmail,
        avatarUrl: null,
      };
    }
    return { name: "Student", email: "student@usu.ac.id", avatarUrl: null };
  });

  useEffect(() => {
    loadConversations();
  }, []);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    if (!showFilter) return;
    const handler = (e) => {
      if (!e.target.closest("#filter-btn-wrapper")) setShowFilter(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showFilter]);

  const loadConversations = () => {
    const raw = localStorage.getItem("temuConversations");
    if (raw) {
      try {
        const convs = JSON.parse(raw);
        const myConvs = convs.filter(c => c.participants?.includes(userData.email));
        const sorted = myConvs.sort((a, b) => {
          const aTime = a.lastMessageAt || a.createdAt;
          const bTime = b.lastMessageAt || b.createdAt;
          return new Date(bTime) - new Date(aTime);
        });
        setConversations(sorted);
      } catch (e) {
        setConversations([]);
      }
    } else {
      setConversations([]);
    }
  };

  function getOtherParticipantName(conv) {
    const otherEmail = conv.participants?.find((p) => p !== userData.email);
    if (!otherEmail) return "Unknown";
    return conv.participantNames?.[otherEmail] || otherEmail.split("@")[0];
  }

  function hasUnread(conv) {
    if (!conv.lastMessage) return false;
    return conv.lastMessageSender && conv.lastMessageSender !== userData.email && !conv.readBy?.includes(userData.email);
  }

  // Apply filter + search
  const filtered = conversations.filter((conv) => {
    // Filter by status
    if (activeFilter === "unread" && !hasUnread(conv)) return false;
    if (activeFilter === "active" && conv.status === "closed") return false;
    if (activeFilter === "closed" && conv.status !== "closed") return false;

    // Filter by search
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const otherName = getOtherParticipantName(conv);
    return (
      otherName.toLowerCase().includes(q) ||
      conv.itemTitle?.toLowerCase().includes(q) ||
      conv.lastMessage?.toLowerCase().includes(q)
    );
  });

  const filterLabels = {
    all: "All",
    unread: "Unread",
    active: "Active",
    closed: "Closed",
  };

  return (
    <div className="flex h-screen bg-[#0E1511] text-white  overflow-hidden">
      <Sidebar activePage="messages" />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <TopBar />

        {/* Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col items-center">
          <div className="w-full max-w-225 flex flex-col gap-6">
            {/* Page Title */}
            <div className="flex justify-between items-end">
              <h2 className="text-[#E4E4E7] text-3xl font-bold leading-10">
                Messages
              </h2>

              {/*filter button*/}
              <div id="filter-btn-wrapper" className="relative">
                <button
                  onClick={() => setShowFilter((v) => !v)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    activeFilter !== "all"
                      ? "bg-[#9CC88D]/15 border-[#9CC88D]/40 text-[#9CC88D]"
                      : "bg-[#18181B] border-[#27272A] text-[#A1A1AA] hover:text-[#DDE4DD] hover:bg-[#27272A]"
                  }`}
                  title="Filter conversations"
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
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                  {filterLabels[activeFilter]}
                  {activeFilter !== "all" && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveFilter("all");
                      }}
                      className="ml-1 w-4 h-4 flex items-center justify-center rounded-full bg-[#9CC88D]/20 hover:bg-[#9CC88D]/40 text-[#9CC88D] cursor-pointer text-xs"
                    >
                      ×
                    </span>
                  )}
                </button>

                {showFilter && (
                  <FilterDropdown
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                    onClose={() => setShowFilter(false)}
                  />
                )}
              </div>
            </div>

            {/* Search conversations */}
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
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#A1A1AA] transition-colors"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Conversation List */}
            <div className="flex flex-col gap-2 pt-2">
              {filtered.length === 0 ? (
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
                      {searchQuery || activeFilter !== "all"
                        ? "No conversations found"
                        : "No messages yet"}
                    </p>
                    <p className="text-[#3C4A42] text-sm mt-1">
                      {searchQuery || activeFilter !== "all"
                        ? "Try a different search or filter"
                        : 'Start a conversation by clicking "Verify Ownership" on a found item'}
                    </p>
                  </div>
                </div>
              ) : (
                filtered.map((conv) => {
                  const otherName = getOtherParticipantName(conv);
                  const otherInitial = otherName.substring(0, 2).toUpperCase();
                  const unread = hasUnread(conv);
                  const timeLabel = formatTime(
                    conv.lastMessageAt || conv.createdAt,
                  );
                  const isClosed = conv.status === "closed";

                  return (
                    <div
                      key={conv.id}
                      onClick={() => navigate(`/messages/${conv.id}`)}
                      className={`w-full p-4 bg-[#18181B] rounded-xl cursor-pointer transition-all hover:bg-[#1E2820] hover:outline hover:outline-[#3C4A42] flex items-start gap-4 group ${
                        unread
                          ? "outline outline-[#27272A]"
                          : "outline outline-transparent"
                      } ${isClosed ? "opacity-60" : ""}`}
                    >
                      {/* Thumbnail */}
                      <div className="shrink-0 flex items-center self-center relative">
                        {conv.itemImage ? (
                          <img
                            src={conv.itemImage}
                            alt={conv.itemTitle}
                            className="w-14 h-14 rounded-lg object-cover shadow-sm"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-[#242C27] border border-[#3C4A42] flex items-center justify-center text-[#86948A] text-lg font-bold">
                            {otherInitial}
                          </div>
                        )}
                        {/* Closed badge overlay */}
                        {isClosed && (
                          <div className="absolute inset-0 rounded-lg bg-black/40 flex items-center justify-center">
                            <svg
                              className="w-5 h-5 text-[#A1A1AA]"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 py-1 flex flex-col justify-center">
                        <div className="mb-1 flex items-center gap-2">
                          <span
                            className={`text-sm font-medium leading-5 tracking-tight truncate ${unread ? "text-[#E4E4E7]" : "text-[#BBCABF]"}`}
                          >
                            {otherName}
                          </span>
                          {/* Closed pill */}
                          {isClosed && (
                            <span className="shrink-0 px-1.5 py-0.5 bg-[#27272A] rounded-full text-[#71717A] text-[10px] font-bold uppercase tracking-wide">
                              Closed
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <svg
                            className={`w-3 h-3 shrink-0 ${unread && !isClosed ? "text-[#9CC88D]" : "text-[#71717A]"}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span
                            className={`text-xs font-semibold leading-4 tracking-wide truncate ${unread && !isClosed ? "text-[#9CC88D]" : "text-[#71717A]"}`}
                          >
                            {conv.itemTitle || "Unknown Item"}
                          </span>
                        </div>
                        <p
                          className={`text-base leading-6 truncate ${unread && !isClosed ? "text-[#9CC88D] font-medium" : "text-[#71717A] font-normal"}`}
                        >
                          {conv.lastMessage || (
                            <span className="italic text-[#3C4A42]">
                              No messages yet — say hello!
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Right column: timestamp + unread dot */}
                      <div className="shrink-0 flex flex-col items-center gap-6 py-1 min-w-13">
                        <span
                          className={`text-xs font-semibold leading-4 tracking-wide text-center whitespace-nowrap ${unread && !isClosed ? "text-[#9CC88D]" : "text-[#71717A]"}`}
                        >
                          {timeLabel}
                        </span>
                        {unread && !isClosed ? (
                          <div className="w-2.5 h-2.5 bg-[#9CC88D] rounded-full shadow-[0px_0px_8px_0px_rgba(156,200,141,0.60)]" />
                        ) : (
                          <div className="w-2.5 h-2.5" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Messages;
