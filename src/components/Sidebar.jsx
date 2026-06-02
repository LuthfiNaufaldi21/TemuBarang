import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const NAV_LINKS = [
  {
    to: "/dashboard",
    key: "dashboard",
    label: "Dashboard",
    icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
  },
  {
    to: "/admin",
    key: "admin",
    label: "Admin",
    icon: "M9 17v-2a4 4 0 014-4h4m0 0V7m0 4h-4m-6 8H5a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v2",
  },
  {
    to: "/lost-items",
    key: "lost-items",
    label: "Lost Items",
    icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  },
  {
    to: "/found-items",
    key: "found-items",
    label: "Found Items",
    icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4",
  },
  {
    to: "/my-reports",
    key: "my-reports",
    label: "My Reports",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    to: "/messages",
    key: "messages",
    label: "Messages",
    icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
  },
  {
    to: "/watchlist",
    key: "watchlist",
    label: "Watchlist",
    icon: "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z",
  },

];

function normalizeEmail(email) {
  return (email || "").toString().trim().toLowerCase();
}

function normalizeStatus(status) {
  return (status || "").toString().toLowerCase().replace(/\s+/g, "_");
}

function isClosedStatus(status) {
  const normalized = normalizeStatus(status);

  return (
    normalized === "closed" ||
    normalized === "resolved" ||
    normalized === "returned"
  );
}

function readStorageArray(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch (error) {
    console.error(`Failed to read ${key}`, error);
    return [];
  }
}

function getCurrentUserData() {
  const email = normalizeEmail(localStorage.getItem("currentUserEmail"));

  if (email) {
    const saved = localStorage.getItem(`temuProfile_${email}`);

    if (saved) {
      try {
        const profile = JSON.parse(saved);
        const displayName = profile.fullName
          ? profile.fullName.split(" ")[0]
          : email.split("@")[0];

        return {
          email,
          name: displayName,
          avatarUrl: profile.avatarUrl || null,
        };
      } catch (error) {
        console.error("Failed to read profile", error);
      }
    }

    return {
      email,
      name: email.split("@")[0],
      avatarUrl: null,
    };
  }

  return {
    email: "",
    name: "Student",
    avatarUrl: null,
  };
}

function Sidebar({ activePage = "" }) {
  const navigate = useNavigate();

  const currentUserRole = localStorage.getItem("currentUserRole");

  const [userData, setUserData] = useState(() => getCurrentUserData());
  const [hasUnreadMessage, setHasUnreadMessage] = useState(false);

  const checkUnreadMessages = useCallback(() => {
    const currentUserEmail = normalizeEmail(
      localStorage.getItem("currentUserEmail")
    );

    if (!currentUserEmail) {
      setHasUnreadMessage(false);
      return;
    }

    const conversations = readStorageArray("temuConversations");

    const hasUnread = conversations.some((conversation) => {
      const participants = Array.isArray(conversation.participants)
        ? conversation.participants.map((email) => normalizeEmail(email))
        : [];

      const isMine = participants.includes(currentUserEmail);
      const isClosed = isClosedStatus(conversation.status);

      const lastMessageSender = normalizeEmail(conversation.lastMessageSender);
      const sentByOtherUser =
        lastMessageSender &&
        lastMessageSender !== "system" &&
        lastMessageSender !== currentUserEmail;

      const readBy = Array.isArray(conversation.readBy)
        ? conversation.readBy.map((email) => normalizeEmail(email))
        : [];

      const alreadyRead = readBy.includes(currentUserEmail);

      return (
        isMine &&
        !isClosed &&
        Boolean(conversation.lastMessage) &&
        sentByOtherUser &&
        !alreadyRead
      );
    });

    setHasUnreadMessage(hasUnread);
  }, []);

  const refreshSidebarData = useCallback(() => {
    setUserData(getCurrentUserData());
    checkUnreadMessages();
  }, [checkUnreadMessages]);

  useEffect(() => {
    refreshSidebarData();

    const handleRefresh = () => {
      refreshSidebarData();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshSidebarData();
      }
    };

    window.addEventListener("storage", handleRefresh);
    window.addEventListener("temuStorage", handleRefresh);
    window.addEventListener("focus", handleRefresh);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const intervalId = window.setInterval(() => {
      checkUnreadMessages();
    }, 2000);

    return () => {
      window.removeEventListener("storage", handleRefresh);
      window.removeEventListener("temuStorage", handleRefresh);
      window.removeEventListener("focus", handleRefresh);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [refreshSidebarData, checkUnreadMessages]);

  const handleSignOut = () => {
    localStorage.removeItem("currentUserEmail");
    localStorage.removeItem("currentUserRole");
    window.dispatchEvent(new Event("temuStorage"));
    navigate("/login");
  };

  const displayName = userData.name || "Student";
  const hasAvatar = Boolean(userData.avatarUrl);

  return (
    <aside className="hidden md:flex flex-col w-[256px] bg-[#0E1511] border-r border-[#3C4A42]/30 shrink-0 z-20 shadow-[4px_0px_24px_rgba(0,0,0,0.18)]">
      <div className="p-6 border-b border-[#3C4A42]/30">
        <Link
          to="/profile"
          className="flex items-center gap-3 group cursor-pointer"
        >
          {hasAvatar ? (
            <img
              src={userData.avatarUrl}
              alt={displayName}
              className="w-10 h-10 rounded-full border-2 border-[#9CC88D] object-cover group-hover:border-[#8bb47d] transition-colors"
            />
          ) : (
            <div className="relative w-10 h-10 rounded-full border-2 border-[#9CC88D] bg-[#164A41] flex items-center justify-center overflow-hidden group-hover:border-[#8bb47d] transition-colors">
              <svg
                className="w-7 h-7 text-[#9CC88D] absolute -bottom-0.75"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}

          <div className="flex flex-col min-w-0">
            <h3 className="text-[#DDE4DD] text-[16px] font-semibold leading-tight group-hover:text-[#9CC88D] transition-colors truncate">
              {displayName}
            </h3>

            <p className="text-[#86948A] text-[13px] font-medium leading-tight mt-1 group-hover:text-[#BBCABF] transition-colors">
              Student Portal
            </p>
          </div>
        </Link>
      </div>

      <div className="p-4">
        <Link
          to="/report-item"
          className="w-full bg-[#9CC88D] hover:bg-[#8bb47d] text-[#13342E] font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-md transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
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

      <nav className="flex-1 overflow-y-auto px-2 space-y-1 mt-2">
        {NAV_LINKS.filter((link) => {
          if (link.key === "admin") {
            return currentUserRole === "admin";
          }

          return true;
        }).map((link) => {
          const isActive = link.key === activePage;
          const showIndicator = link.key === "messages" && hasUnreadMessage;

          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative group ${
                isActive
                  ? "bg-[#1A211D] text-[#9CC88D] border-r-4 border-[#9CC88D]"
                  : "text-[#86948A] hover:bg-[#1A211D] hover:text-[#DDE4DD]"
              }`}
            >
              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={link.icon}
                />
              </svg>

              <span className="flex-1">{link.label}</span>

              {showIndicator && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#9CC88D] rounded-full shadow-[0_0_8px_rgba(156,200,141,0.5)]" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#3C4A42]/30 space-y-1">
        <Link
          to="/help"
          className="flex items-center gap-3 px-4 py-3 text-[#86948A] hover:text-[#DDE4DD] hover:bg-[#1A211D] rounded-lg transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Help Center
        </Link>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 text-[#86948A] hover:text-[#DDE4DD] hover:bg-[#1A211D] rounded-lg transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;