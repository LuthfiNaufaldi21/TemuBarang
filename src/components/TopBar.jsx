import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { notificationsAPI, postsAPI } from "../services/api";

function TopBar() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hasUnreadNotification, setHasUnreadNotification] = useState(false);
  const dropdownRef = useRef(null);
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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  const handleResultClick = (id) => {
    setIsDropdownOpen(false);
    setSearchQuery("");
    navigate(`/item/${id}`);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (!searchQuery.trim()) return;
    if (searchResults.length > 0) {
      handleResultClick(searchResults[0].post_id);
      return;
    }
    navigate("/recent-reports");
  };

  return (
    <header className="h-18 bg-[#1A211D]/90 backdrop-blur-md border-b border-[#3C4A42]/30 flex items-center justify-between px-6 shrink-0 z-50 relative shadow-sm">
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
                    <button
                      key={result.post_id}
                      onClick={() => handleResultClick(result.post_id)}
                      className="flex items-start gap-3 p-3 hover:bg-[#1E2820] transition-colors text-left border-b border-[#3C4A42]/30 last:border-0"
                    >
                      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border text-[10px] font-bold ${
                        result.report_type === "FOUND"
                          ? "bg-[#11996C]/20 border-[#11996C]/50 text-[#9CC88D]"
                          : "bg-[#EF4444]/20 border-[#EF4444]/50 text-[#EF4444]"
                      }`}>
                        {result.report_type === "FOUND" ? "F" : "L"}
                      </div>
                      <div className="flex flex-col overflow-hidden min-w-0">
                        <span className="text-sm font-semibold text-[#DDE4DD] truncate">
                          {result.caption || "Untitled Item"}
                        </span>
                        <span className="text-xs text-[#86948A] truncate">
                          {result.building_location || "Unknown location"}
                        </span>
                      </div>
                    </button>
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

      <div className="flex items-center gap-4">
        <Link
          to="/notifications"
          className="relative text-[#A1A1AA] hover:text-white transition-colors"
          onClick={() => setTimeout(refreshNotificationState, 200)}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {hasUnreadNotification && (
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#9CC88D] border-2 border-[#1A211D] rounded-full animate-pulse" />
          )}
        </Link>

        <Link to="/settings" className="text-[#A1A1AA] hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </Link>
      </div>
    </header>
  );
}

export default TopBar;