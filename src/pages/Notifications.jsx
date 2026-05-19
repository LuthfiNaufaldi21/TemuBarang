import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";

function Notifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getCurrentUserEmail = () => {
    return localStorage.getItem("currentUserEmail") || "";
  };

  const formatNotificationTime = (createdAt) => {
    if (!createdAt) return "";

    const date = new Date(createdAt);
    const today = new Date();

    const isToday = date.toLocaleDateString() === today.toLocaleDateString();

    if (isToday) {
      return "Today";
    }

    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  };

  const loadNotifications = () => {
    const currentUserEmail = getCurrentUserEmail();

    if (!currentUserEmail) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    try {
      const savedNotifs = JSON.parse(
        localStorage.getItem("temuNotifications") || "[]"
      );

      const userNotifs = savedNotifs
        .filter((notif) => notif.userId === currentUserEmail)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map((notif) => ({
          ...notif,
          time: formatNotificationTime(notif.createdAt),
        }));

      setNotifications(userNotifs);
    } catch (error) {
      console.error("Error loading notifications:", error);
      setNotifications([]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadNotifications();

    const handleStorageChange = () => {
      loadNotifications();
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const updateNotificationReadStatus = (notificationId, readValue = true) => {
    const currentUserEmail = getCurrentUserEmail();

    try {
      const savedNotifs = JSON.parse(
        localStorage.getItem("temuNotifications") || "[]"
      );

      const updatedNotifs = savedNotifs.map((notif) => {
        const isTargetNotif =
          notif.id === notificationId && notif.userId === currentUserEmail;

        if (isTargetNotif) {
          return {
            ...notif,
            read: readValue,
          };
        }

        return notif;
      });

      localStorage.setItem("temuNotifications", JSON.stringify(updatedNotifs));

      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId
            ? {
              ...notif,
              read: readValue,
            }
            : notif
        )
      );
    } catch (error) {
      console.error("Error updating notification:", error);
    }
  };

  const markAllRead = () => {
    const currentUserEmail = getCurrentUserEmail();

    try {
      const savedNotifs = JSON.parse(
        localStorage.getItem("temuNotifications") || "[]"
      );

      const updatedNotifs = savedNotifs.map((notif) => {
        if (notif.userId === currentUserEmail) {
          return {
            ...notif,
            read: true,
          };
        }

        return notif;
      });

      localStorage.setItem("temuNotifications", JSON.stringify(updatedNotifs));

      setNotifications((prev) =>
        prev.map((notif) => ({
          ...notif,
          read: true,
        }))
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleCheckNow = (notif) => {
    updateNotificationReadStatus(notif.id, true);

    if (notif.conversationId) {
      navigate(`/messages/${notif.conversationId}`);
      return;
    }

    if (notif.itemId) {
      navigate(`/item/${notif.itemId}`);
      return;
    }

    navigate("/messages");
  };

  const handleDismiss = (notif) => {
    updateNotificationReadStatus(notif.id, true);
  };

  const hasUnreadNotification = notifications.some((notif) => !notif.read);

  return (
    <div className="flex h-screen bg-[#0E1511] text-white overflow-hidden">
      <Sidebar activePage="notifications" />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar hasNotification={hasUnreadNotification} />

        <main className="flex-1 overflow-y-auto px-6 md:px-12 py-8">
          <div className="w-full max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-[#DDE4DD] tracking-tight">
                  Notifications
                </h1>

                <p className="text-[#86948A] mt-2 text-lg">
                  Updates and alerts regarding your activities.
                </p>
              </div>

              {notifications.length > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[#9CC88D] font-bold text-sm hover:underline transition-all"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#9CC88D]" />
              </div>
            ) : notifications.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`group relative p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-1 ${notif.read
                      ? "bg-[#18181B]/40 border-[#27272A]"
                      : "bg-[#164A41]/10 border-[#9CC88D]/30 shadow-[0_8px_30px_rgba(0,0,0,0.3)]"
                      }`}
                  >
                    <div className="flex items-start gap-5">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${notif.type === "match"
                          ? "bg-[#F1B24A]/20 text-[#F1B24A]"
                          : "bg-[#9CC88D]/20 text-[#9CC88D]"
                          }`}
                      >
                        {notif.type === "match" ? (
                          <svg
                            className="w-7 h-7"
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
                        ) : (
                          <svg
                            className="w-7 h-7"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h3
                            className={`text-xl font-bold truncate ${notif.read ? "text-[#DDE4DD]" : "text-white"
                              }`}
                          >
                            {notif.title}
                          </h3>

                          <div className="flex items-center gap-3 ml-4 shrink-0">
                            <span className="text-[#3C4A42] text-sm font-bold whitespace-nowrap">
                              {notif.time}
                            </span>

                            {!notif.read && (
                              <div className="w-2.5 h-2.5 bg-[#9CC88D] rounded-full shadow-[0_0_8px_rgba(156,200,141,0.6)]" />
                            )}
                          </div>
                        </div>

                        <p className="text-[#86948A] text-base leading-relaxed max-w-3xl mt-1">
                          {notif.message}
                        </p>

                        {notif.finderName && (
                          <p className="text-[#3C4A42] text-sm mt-2">
                            Finder:{" "}
                            <span className="text-[#86948A] font-semibold">
                              {notif.finderName}
                            </span>
                          </p>
                        )}

                        {notif.foundLocation && (
                          <p className="text-[#3C4A42] text-sm mt-1">
                            Found at:{" "}
                            <span className="text-[#86948A] font-semibold">
                              {notif.foundLocation}
                            </span>
                          </p>
                        )}

                        {!notif.read && (
                          <div className="mt-4 flex gap-4">
                            <button
                              onClick={() => handleCheckNow(notif)}
                              className="bg-[#9CC88D] hover:bg-[#8bb47d] text-[#13342E] px-5 py-2 rounded-xl text-sm font-bold transition-colors"
                            >
                              Check Now
                            </button>

                            <button
                              onClick={() => handleDismiss(notif)}
                              className="bg-transparent border border-[#3C4A42] text-[#86948A] hover:bg-white/5 px-5 py-2 rounded-xl text-sm font-bold transition-colors"
                            >
                              Dismiss
                            </button>
                          </div>
                        )}

                        {notif.read && (
                          <div className="mt-4">
                            <button
                              onClick={() => handleCheckNow(notif)}
                              className="bg-transparent border border-[#3C4A42] text-[#86948A] hover:bg-white/5 px-5 py-2 rounded-xl text-sm font-bold transition-colors"
                            >
                              View
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-40">
                <div className="w-24 h-24 bg-[#18181B] rounded-full flex items-center justify-center mb-6">
                  <svg
                    className="w-12 h-12 text-[#27272A]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>

                <h3 className="text-2xl font-bold text-[#DDE4DD]">
                  All caught up!
                </h3>

                <p className="text-[#86948A] mt-2">
                  No new notifications at this time.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Notifications;