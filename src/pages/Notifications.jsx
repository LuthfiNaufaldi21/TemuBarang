import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { notificationsAPI } from "../services/api";

function formatTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const today = new Date();
  if (date.toLocaleDateString() === today.toLocaleDateString()) return "Today";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await notificationsAPI.getAll();
      setNotifications(data.notifications || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  const handleCheck = async (notif) => {
    if (!notif.is_read) {
      await notificationsAPI.markRead(notif.notification_id).catch(() => {});
      setNotifications((prev) => prev.map((n) => n.notification_id === notif.notification_id ? { ...n, is_read: true } : n));
    }
    if (notif.related_post_id) navigate(`/item/${notif.related_post_id}`);
    else navigate("/messages");
  };

  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <div className="flex h-[100dvh] min-h-0 bg-[#0E1511] text-white overflow-hidden">
      <Sidebar activePage="notifications" />
      <div className="flex-1 min-w-0 min-h-0 flex flex-col h-full overflow-hidden">
        <TopBar />
        <main className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:px-12 md:py-8 md:pb-8">
          <div className="w-full max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8 md:mb-10">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-[#DDE4DD] tracking-tight">Notifications</h1>
                <p className="text-[#86948A] mt-2 text-base md:text-lg">Updates and alerts regarding your activities.</p>
              </div>
              {notifications.length > 0 && (
                <button onClick={markAllRead} className="text-[#9CC88D] font-bold text-sm hover:underline transition-all">Mark all as read</button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-2 border-[#9CC88D] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {notifications.map((notif) => (
                  <div key={notif.notification_id}
                    className={`group relative p-4 md:p-6 rounded-2xl md:rounded-3xl border transition-all duration-300 hover:-translate-y-1 ${notif.is_read ? "bg-[#18181B]/40 border-[#27272A]": "bg-[#164A41]/10 border-[#9CC88D]/30 shadow-[0_8px_30px_rgba(0,0,0,0.3)]"}`}>
                    <div className="flex items-start gap-3 md:gap-5">
                      <div className={`w-11 h-11 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${notif.notification_type === "POTENTIAL_MATCH"? "bg-[#F1B24A]/20 text-[#F1B24A]": "bg-[#9CC88D]/20 text-[#9CC88D]"}`}>
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-1">
                          <h3 className={`text-lg md:text-xl font-bold ${notif.is_read ? "text-[#DDE4DD]" : "text-white"}`}>
                            {notif.notification_type === "NEW_CHAT" ? "New Message" : notif.notification_type === "POTENTIAL_MATCH" ? "Potential Match" : "System Notification"}
                          </h3>
                          <div className="flex items-center gap-3 sm:ml-4 shrink-0">
                            <span className="text-[#3C4A42] text-sm font-bold whitespace-nowrap">{formatTime(notif.created_at)}</span>
                            {!notif.is_read && <div className="w-2.5 h-2.5 bg-[#9CC88D] rounded-full shadow-[0_0_8px_rgba(156,200,141,0.6)]" />}
                          </div>
                        </div>
                        <p className="text-[#86948A] text-base leading-relaxed max-w-3xl mt-1">{notif.content}</p>
                        <div className="mt-4">
                          <button onClick={() => handleCheck(notif)}
                            className={`px-5 py-2 rounded-xl text-sm font-bold transition-colors ${!notif.is_read ? "bg-[#9CC88D] hover:bg-[#8bb47d] text-[#13342E]" : "bg-transparent border border-[#3C4A42] text-[#86948A] hover:bg-white/5"}`}>
                            {!notif.is_read ? "Check Now" : "View"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 md:py-40 text-center">
                <div className="w-24 h-24 bg-[#18181B] rounded-full flex items-center justify-center mb-6">
                  <svg className="w-12 h-12 text-[#27272A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-[#DDE4DD]">All caught up!</h3>
                <p className="text-[#86948A] mt-2">No new notifications at this time.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}