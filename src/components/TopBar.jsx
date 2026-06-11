import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { notificationsAPI, postsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isNotificationsActive = location.pathname === "/notifications";
  const isWatchlistActive = location.pathname === "/watchlist";
  const { user, logout } = useAuth();
  const role = String(user?.role || "student").toLowerCase();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const moreMenuRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hasUnreadNotification, setHasUnreadNotification] = useState(false);
  const dropdownRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const refreshNotificationState = useCallback(async () => {
    try {
      const data = await notificationsAPI.getAll();
      const notifications = data.notifications || [];
      const hasUnread = notifications.some((n) => !n.is_read);
      setHasUnreadNotification(hasUnread);
    } catch {
      // silent fail
    }
  }, []);

  useEffect(() => {
    refreshNotificationState();
    const intervalId = window.setInterval(refreshNotificationState, 30000);
    return () => window.clearInterval(intervalId);
  }, [refreshNotificationState]);

  useEffect(() => {
    function handleClickOutside(event) {
      const outsideDesktopSearch =
        !dropdownRef.current ||
        !dropdownRef.current.contains(event.target);

      const outsideMobileSearch =
        !mobileSearchRef.current ||
        !mobileSearchRef.current.contains(event.target);

      if (outsideDesktopSearch && outsideMobileSearch) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      setIsDropdownOpen(false);
      return;
    }
    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const data = await postsAPI.getAll({ search: query, limit: 5 });
        setSearchResults(data.posts || []);
        setIsDropdownOpen(true);
      } catch {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutsideMore = (event) => {
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(event.target)
      ) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutsideMore);
    return () => {
      document.removeEventListener("mousedown", handleClickOutsideMore);
    };
  }, []);

  const handleResultClick = (id) => {
    setIsDropdownOpen(false);
    setShowMobileSearch(false);
    setSearchQuery("");
    navigate(`/item/${id}`);
  };

    const handleMobileResultClick = (result) => {
    const resultId = result?.post_id ?? result?.id;

    if (!resultId) {
      console.error("Search result tidak memiliki ID:", result);
      return;
    }

    setIsDropdownOpen(false);
    setShowMobileSearch(false);
    setSearchQuery("");
    setSearchResults([]);

    navigate(`/item/${resultId}`);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    if (!searchQuery.trim()) return;

    if (searchResults.length > 0) {
      handleResultClick(searchResults[0].post_id);
      return;
    }

    setShowMobileSearch(false);
    navigate("/recent-reports");
  };

  const handleSignOut = () => {
    setShowMoreMenu(false);
    logout();
    window.location.replace("/login");
  };

  return (
    <header className="h-18 bg-[#1A211D]/90 backdrop-blur-md border-b border-[#3C4A42]/30 flex items-center justify-between px-4 md:px-6 shrink-0 z-50 relative shadow-sm">
      <div className="flex items-center gap-6 flex-1">
        <h1 className="text-[#9CC88D] text-xl font-bold">TemuBarang</h1>

        <div className="hidden md:block relative w-full max-w-md" ref={dropdownRef}>
          <form onSubmit={handleSearchSubmit} className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (searchQuery.trim()) setIsDropdownOpen(true); }}
              placeholder="Search items by name or location..."
              className="w-full bg-[#0E1511] border border-[#3C4A42]/50 rounded-full py-2 pl-10 pr-4 text-[#DDE4DD] text-sm focus:outline-none focus:border-[#9CC88D] transition-colors placeholder:text-[#86948A]"
            />
          </form>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A211D] border border-[#3C4A42]/50 rounded-xl shadow-2xl overflow-hidden z-50">
              {searchResults.length > 0 ? (
                <div className="flex flex-col">
                  {searchResults.map((result) => (
                    <Link
                      key={result.post_id}
                      to={`/item/${result.post_id}`}
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setShowMobileSearch(false);
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      className="flex w-full items-start gap-3 border-b border-[#3C4A42]/30 p-3 text-left transition-colors last:border-0 hover:bg-[#1E2820]"
                    >
                      <div
                        className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center border text-[10px] font-bold ${
                          result.report_type === "FOUND"
                            ? "bg-[#11996C]/20 border-[#11996C]/50 text-[#9CC88D]"
                            : "bg-[#EF4444]/20 border-[#EF4444]/50 text-[#EF4444]"
                        }`}
                      >
                        {result.report_type === "FOUND" ? "F" : "L"}
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-semibold text-[#DDE4DD]">
                          {result.caption || "Untitled Item"}
                        </span>

                        <span className="truncate text-xs text-[#86948A]">
                          {result.building_location || "Unknown location"}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-[#86948A]">
                  No results found for <span className="font-medium text-[#DDE4DD]">{searchQuery}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Search — mobile only */} 
        <button 
          type="button" 
          onClick={() => { 
            setShowMobileSearch((prev) => !prev); 
            setShowMoreMenu(false); 
          }}
          className={`md:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${ 
            showMobileSearch 
              ? "bg-[#164A41] text-[#9CC88D]" 
              : "text-[#A1A1AA] hover:text-white hover:bg-white/5"
          }`}
          aria-label="Search items"
          aria-expanded={showMobileSearch}
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </button>

        {/* Notifications */}
        <Link
          to="/notifications"
          className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
            isNotificationsActive
              ? "bg-[#164A41] text-[#9CC88D] md:bg-transparent md:text-[#A1A1AA] md:hover:bg-white/5 md:hover:text-white"
              : "text-[#A1A1AA] hover:text-white hover:bg-white/5"
          }`}
          onClick={() => setTimeout(refreshNotificationState, 200)}
          aria-label="Notifications"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {hasUnreadNotification && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#9CC88D] border-2 border-[#1A211D] rounded-full animate-pulse" />
          )}
        </Link>
        {/* Watchlist — mobile only */}
        <Link
          to="/watchlist"
          className={`md:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
            isWatchlistActive
              ? "bg-[#164A41] text-[#9CC88D]"
              : "text-[#A1A1AA] hover:text-white hover:bg-white/5"
          }`}
          aria-label="Watchlist"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </Link>
        {/* Settings */}
        <Link
          to="/settings"
          className="hidden md:flex w-9 h-9 rounded-xl items-center justify-center text-[#A1A1AA] hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Settings"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </Link>
        {/* More — mobile only */}
        <div ref={moreMenuRef} className="relative md:hidden">
          <button
            type="button"
            onClick={() => setShowMoreMenu((prev) => !prev)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              showMoreMenu
                ? "bg-[#164A41] text-[#9CC88D]"
                : "text-[#A1A1AA] hover:text-white hover:bg-white/5"
            }`}
            aria-label="Open more menu"
            aria-expanded={showMoreMenu}
          >
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="5" cy="12" r="1.7" />
              <circle cx="12" cy="12" r="1.7" />
              <circle cx="19" cy="12" r="1.7" />
            </svg>
          </button>
          {showMoreMenu && (
            <div className="absolute right-0 top-[calc(100%+0.75rem)] z-[100] w-52 overflow-hidden rounded-2xl border border-[#3C4A42] bg-[#1A211D] shadow-2xl">
              <Link
                to="/profile"
                onClick={() => setShowMoreMenu(false)}
                className="flex items-center gap-3 px-4 py-3.5 text-sm text-[#DDE4DD] hover:bg-white/5 transition-colors"
              >
                <svg
                  className="w-5 h-5 text-[#9CC88D]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19a6 6 0 00-12 0m6-8a4 4 0 100-8 4 4 0 000 8z"
                  />
                </svg>
                Profile
              </Link>
              <Link
                to="/my-reports"
                onClick={() => setShowMoreMenu(false)}
                className="flex items-center gap-3 border-t border-[#3C4A42]/50 px-4 py-3.5 text-sm text-[#DDE4DD] hover:bg-white/5 transition-colors"
              >
                <svg
                  className="w-5 h-5 text-[#9CC88D]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                My Reports
              </Link>
              <Link
                to="/settings"
                onClick={() => setShowMoreMenu(false)}
                className="flex items-center gap-3 border-t border-[#3C4A42]/50 px-4 py-3.5 text-sm text-[#DDE4DD] hover:bg-white/5 transition-colors"
              >
                <svg
                  className="w-5 h-5 text-[#9CC88D]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Settings
              </Link>
              {role === "admin" && (
                <Link
                  to="/admin"
                  onClick={() => setShowMoreMenu(false)}
                  className="flex items-center gap-3 border-t border-[#3C4A42]/50 px-4 py-3.5 text-sm text-[#DDE4DD] hover:bg-white/5 transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-[#9CC88D]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 17v-2a4 4 0 014-4h4m0 0V7m0 4h-4M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2h-4l-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  Admin Dashboard
                </Link>
              )}
              <Link
                to="/help"
                onClick={() => setShowMoreMenu(false)}
                className="flex items-center gap-3 border-t border-[#3C4A42]/50 px-4 py-3.5 text-sm text-[#DDE4DD] hover:bg-white/5 transition-colors"
              >
                <svg
                  className="w-5 h-5 text-[#9CC88D]"
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
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 border-t border-[#3C4A42]/50 px-4 py-3.5 text-left text-sm text-red-300 hover:bg-red-500/10 transition-colors"
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
          )}
        </div>
      </div>

      {showMobileSearch && (
        <div 
          ref={mobileSearchRef} 
          className="md:hidden fixed top-[72px] left-0 right-0 z-[9999] pointer-events-auto bg-[#1A211D] border-b border-[#3C4A42]/50 px-4 py-3 shadow-2xl">
          <form onSubmit={handleSearchSubmit} className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]"
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim()) {
                  setIsDropdownOpen(true);
                }
              }}
              placeholder="Search items by name or location..."
              autoFocus
              className="w-full bg-[#0E1511] border border-[#3C4A42]/50 rounded-xl py-3 pl-11 pr-10 text-[#DDE4DD] text-sm focus:outline-none focus:border-[#9CC88D] transition-colors placeholder:text-[#86948A]"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  setIsDropdownOpen(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg text-[#86948A] hover:text-white hover:bg-white/5"
                aria-label="Clear search"
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
          </form>

          {isDropdownOpen && searchQuery.trim() && (
            <div className="mt-2 max-h-72 overflow-y-auto bg-[#0E1511] border border-[#3C4A42]/50 rounded-xl shadow-2xl">
              {searchResults.length > 0 ? (
                <div className="flex flex-col">
                  {searchResults.map((result) => {
                    const resultId = result?.post_id ?? result?.id;
                    return (
                      <button
                        key={resultId}
                        type="button"
                        onPointerDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          handleMobileResultClick(result);
                        }}
                        className="relative z-[10000] flex w-full touch-manipulation items-start gap-3 border-b border-[#3C4A42]/30 p-3 text-left transition-colors last:border-0 active:bg-[#1E2820]"
                      >
                        <div
                          className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center border text-[10px] font-bold ${
                            result.report_type === "FOUND"
                              ? "bg-[#11996C]/20 border-[#11996C]/50 text-[#9CC88D]"
                              : "bg-[#EF4444]/20 border-[#EF4444]/50 text-[#EF4444]"
                          }`}
                        >
                          {result.report_type === "FOUND" ? "F" : "L"}
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-sm font-semibold text-[#DDE4DD]">
                            {result.caption || "Untitled Item"}
                          </span>

                          <span className="truncate text-xs text-[#86948A]">
                            {result.building_location || "Unknown location"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-[#86948A]">
                  No results found for{" "}
                  <span className="font-medium text-[#DDE4DD]">
                    {searchQuery}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}

export default TopBar;