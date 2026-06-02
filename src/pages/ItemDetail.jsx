import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import {
  normalizeStatus,
  isResolvedStatus,
  setItemStatus,
} from "../utils/statusUtils";
import { getOrCreateConversation } from "../utils/conversationUtils";

function readStorageArray(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch (error) {
    console.error(`Failed to read ${key}`, error);
    return [];
  }
}

function writeStorageArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("temuStorage"));
}

function normalizeEmail(email) {
  return (email || "").toString().trim().toLowerCase();
}

function getProfileByEmail(email, fallbackName = "Student") {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return {
      name: fallbackName || "Student",
      email: "",
      avatarUrl: null,
      initial: (fallbackName || "ST").substring(0, 2).toUpperCase(),
    };
  }

  const profileKey = `temuProfile_${normalizedEmail}`;
  const savedProfile = localStorage.getItem(profileKey);

  if (savedProfile) {
    try {
      const parsed = JSON.parse(savedProfile);
      const displayName =
        parsed.fullName || fallbackName || normalizedEmail.split("@")[0];

      return {
        name: displayName,
        email: normalizedEmail,
        avatarUrl: parsed.avatarUrl || null,
        initial: displayName.substring(0, 2).toUpperCase(),
      };
    } catch (error) { 
      console.error("Failed to read user profile", error);
    }
  }

  const fallbackDisplayName =
    fallbackName || normalizedEmail.split("@")[0] || "Student";

  return {
    name: fallbackDisplayName,
    email: normalizedEmail,
    avatarUrl: null,
    initial: fallbackDisplayName.substring(0, 2).toUpperCase(),
  };
}

function getReportDateText(report) {
  if (report?.dateText) return report.dateText;

  const rawDate = report?.date || report?.createdAt || report?.updatedAt;

  if (!rawDate) return "-";

  const parsedDate = new Date(rawDate);

  if (Number.isNaN(parsedDate.getTime())) return "-";

  return parsedDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ProfileMiniCard({ title, profile, showMessage = false, onMessage }) {
  return (
    <div>
      <h4 className="text-[#86948A] text-xs font-semibold uppercase tracking-wide mb-3">
        {title}
      </h4>

      <div className="bg-[#0E1511] border border-[#3C4A42] rounded-lg p-3 flex items-center gap-4 w-full">
        <div className="w-10 h-10 rounded-full bg-zinc-800 border border-[#27272A] flex items-center justify-center text-sm font-bold text-gray-400 overflow-hidden shrink-0">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          ) : (
            profile.initial || "US"
          )}
        </div>

        <div className="flex flex-col pr-4 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[#DDE4DD] text-sm font-medium truncate">
              {profile.name || "Unknown Student"}
            </span>

            <svg
              className="w-4 h-4 text-white shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>

            {showMessage && (
              <button
                type="button"
                onClick={onMessage}
                title="Send message"
                className="ml-1 w-7 h-7 rounded-full bg-[#164A41] border border-[#3C4A42] text-[#9CC88D] flex items-center justify-center hover:bg-[#1f5f53] hover:border-[#9CC88D] transition-colors"
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
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </button>
            )}
          </div>

          <span className="text-[#86948A] text-xs font-semibold">
            (Student)
          </span>
        </div>
      </div>
    </div>
  );
}

function ItemDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [itemDetail, setItemDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [userData] = useState(() => {
    const currentUserEmail = normalizeEmail(
      localStorage.getItem("currentUserEmail")
    );

    if (currentUserEmail) {
      const profile = getProfileByEmail(
        currentUserEmail,
        currentUserEmail.split("@")[0]
      );

      return {
        name: profile.name,
        email: currentUserEmail,
        avatarUrl: profile.avatarUrl,
      };
    }

    return {
      name: "Student",
      email: "student@usu.ac.id",
      avatarUrl: null,
    };
  });

  const loadItemDetail = () => {
    const reportsArray = readStorageArray("temuReports");

    const foundItem = reportsArray.find(
      (report) => report.id?.toString() === id?.toString()
    );

    if (foundItem) {
      setItemDetail(foundItem);
    } else {
      setItemDetail(null);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadItemDetail();

    const handleStorageChange = () => {
      loadItemDetail();
    };

    const handleFocus = () => {
      loadItemDetail();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadItemDetail();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("temuStorage", handleStorageChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("temuStorage", handleStorageChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [id]);

  const getPotentialFounder = () => {
    if (!Array.isArray(itemDetail?.potentialFounders)) return null;

    return (
      itemDetail.potentialFounders.find((person) => Boolean(person.email)) ||
      null
    );
  };

  const getOwnerEmail = () => {
    if (!itemDetail) return "";

    if (itemDetail.type === "FOUND") {
      return normalizeEmail(itemDetail.ownerEmail || "");
    }

    return normalizeEmail(itemDetail.reporterEmail || "");
  };

  const getOwnerName = () => {
    if (!itemDetail) return "Unknown";

    if (itemDetail.type === "FOUND") {
      return (
        itemDetail.ownerName || getOwnerEmail().split("@")[0] || "Owner"
      );
    }

    return (
      itemDetail.reporterName || getOwnerEmail().split("@")[0] || "Owner"
    );
  };

  const getFinderEmail = () => {
    if (!itemDetail) return "";

    if (itemDetail.type === "FOUND") {
      return normalizeEmail(
        itemDetail.founderEmail ||
        itemDetail.foundByEmail ||
        itemDetail.reporterEmail ||
        ""
      );
    }

    const potentialFounder = getPotentialFounder();

    return normalizeEmail(
      itemDetail.founderEmail ||
      itemDetail.foundByEmail ||
      potentialFounder?.email ||
      ""
    );
  };

  const getFinderName = () => {
    if (!itemDetail) return "Unknown";

    if (itemDetail.type === "FOUND") {
      return (
        itemDetail.foundByName ||
        itemDetail.founderName ||
        itemDetail.reporterName ||
        getFinderEmail().split("@")[0] ||
        "Finder"
      );
    }

    const potentialFounder = getPotentialFounder();

    return (
      itemDetail.foundByName ||
      itemDetail.founderName ||
      potentialFounder?.name ||
      getFinderEmail().split("@")[0] ||
      "Finder"
    );
  };

  const getReporterProfile = () => {
    if (!itemDetail) {
      return getProfileByEmail("", "Unknown Student");
    }

    return getProfileByEmail(
      itemDetail.reporterEmail,
      itemDetail.reporterName || "Unknown Student"
    );
  };

  const getOwnerProfile = () => {
    return getProfileByEmail(getOwnerEmail(), getOwnerName());
  };

  const getFinderProfile = () => {
    return getProfileByEmail(getFinderEmail(), getFinderName());
  };

  const isCurrentUserReporter = () => {
    return normalizeEmail(itemDetail?.reporterEmail) === userData.email;
  };

  const isCurrentUserOwner = () => {
    if (!itemDetail) return false;

    if (itemDetail.type === "LOST") {
      return normalizeEmail(itemDetail.reporterEmail) === userData.email;
    }

    return normalizeEmail(itemDetail.ownerEmail) === userData.email;
  };

  const getFoundLocationText = () => {
    const potentialFounder = getPotentialFounder();

    return (
      itemDetail?.foundLocation ||
      potentialFounder?.foundLocation ||
      potentialFounder?.location ||
      itemDetail?.location ||
      "—"
    );
  };

  const getStorageLocationText = () => {
    const potentialFounder = getPotentialFounder();

    return (
      itemDetail?.storageLocation ||
      potentialFounder?.storageLocation ||
      "—"
    );
  };

  const getOtherPersonForChat = () => {
    if (!itemDetail) {
      return {
        email: "",
        name: "Unknown",
      };
    }

    if (itemDetail.type === "LOST") {
      const ownerEmail = getOwnerEmail();
      const ownerName = getOwnerName();
      const finderEmail = getFinderEmail();
      const finderName = getFinderName();

      if (userData.email === ownerEmail) {
        return {
          email: finderEmail,
          name: finderName,
        };
      }

      return {
        email: ownerEmail,
        name: ownerName,
      };
    }

    const finderEmail = getFinderEmail();
    const finderName = getFinderName();
    const ownerEmail = getOwnerEmail();
    const ownerName = getOwnerName();

    if (userData.email === finderEmail) {
      return {
        email: ownerEmail,
        name: ownerName,
      };
    }

    return {
      email: finderEmail,
      name: finderName,
    };
  };

  const updateCurrentItem = (updater) => {
    const allReports = readStorageArray("temuReports");
    let updatedItem = null;

    const updatedReports = allReports.map((report) => {
      if (report.id?.toString() !== itemDetail.id?.toString()) {
        return report;
      }

      updatedItem = updater(report);
      return updatedItem;
    });

    writeStorageArray("temuReports", updatedReports);

    if (updatedItem) {
      setItemDetail(updatedItem);
    }

    return updatedItem;
  };

  const createNotification = ({ recipientEmail, conversationId, type }) => {
    const normalizedRecipient = normalizeEmail(recipientEmail);

    if (!normalizedRecipient || normalizedRecipient === userData.email) return;
    if (!conversationId) return;

    const notifications = readStorageArray("temuNotifications");

    const alreadyExists = notifications.some(
      (notification) =>
        normalizeEmail(notification.userId) === normalizedRecipient &&
        notification.itemId?.toString() === itemDetail.id?.toString() &&
        notification.conversationId === conversationId &&
        notification.type === type &&
        !notification.read
    );

    if (alreadyExists) return;

    const now = new Date().toISOString();

    const message =
      type === "verification"
        ? `${userData.name} wants to verify ownership for "${itemDetail.title}".`
        : `${userData.name} sent a message about "${itemDetail.title}".`;

    const newNotification = {
      id: `notif_${type}_${itemDetail.id}_${normalizedRecipient}_${Date.now()}`,
      userId: normalizedRecipient,
      title:
        type === "verification"
          ? "Ownership Verification Started"
          : "New Message",
      message,
      itemId: itemDetail.id,
      conversationId,
      type,
      read: false,
      createdAt: now,
    };

    writeStorageArray("temuNotifications", [
      newNotification,
      ...notifications,
    ]);
  };

  const ensureVerifyingStatus = () => {
    if (!itemDetail || isResolvedStatus(itemDetail.status)) return;

    const now = new Date().toISOString();
    const finderEmail = getFinderEmail();

    setItemStatus(itemDetail.id, "verifying");

    updateCurrentItem((report) => {
      if (isResolvedStatus(report.status)) return report;

      const nextReport = {
        ...report,
        status: "verifying",
        updatedAt: now,
      };

      if (report.type === "FOUND" && userData.email !== finderEmail) {
        nextReport.ownerEmail = report.ownerEmail || userData.email;
        nextReport.ownerName = report.ownerName || userData.name;
        nextReport.ownerVerified = false;
      }

      return nextReport;
    });
  };

  const handleVerifyOwnership = () => {
    if (!itemDetail) return;

    const currentStatus = normalizeStatus(itemDetail.status);

    if (isResolvedStatus(currentStatus)) {
      alert("This item has already been resolved.");
      return;
    }

    if (itemDetail.type === "FOUND" && isCurrentUserReporter()) {
      alert("You cannot verify ownership with yourself.");
      return;
    }

    const otherPerson = getOtherPersonForChat();

    if (!otherPerson.email || normalizeEmail(otherPerson.email) === userData.email) {
      alert("No valid chat participant found.");
      return;
    }

    ensureVerifyingStatus();

    const conversationId = getOrCreateConversation({
      itemId: itemDetail.id,
      itemTitle: itemDetail.title,
      itemImage: itemDetail.image || null,
      itemType: itemDetail.type,
      currentUserEmail: userData.email,
      currentUserName: userData.name,
      otherEmail: otherPerson.email,
      otherName: otherPerson.name,
    });

    createNotification({
      recipientEmail: otherPerson.email,
      conversationId,
      type: "verification",
    });

    navigate(`/messages/${conversationId}`);
  };

  const handleReportAsFound = () => {
    if (!itemDetail) return;

    if (!itemDetail.type || itemDetail.type !== "LOST") {
      alert("Only lost item reports can be marked as found.");
      return;
    }

    if (isResolvedStatus(itemDetail.status)) {
      alert("This item has already been resolved.");
      return;
    }

    if (isCurrentUserOwner()) {
      alert("You cannot report your own lost item as found.");
      return;
    }

    navigate(`/confirm-found/${itemDetail.id}`);
  };

  const handleContinueChat = () => {
    if (!itemDetail) return;

    const currentStatus = normalizeStatus(itemDetail.status);

    if (isResolvedStatus(currentStatus)) {
      alert("This item has already been resolved.");
      return;
    }

    const otherPerson = getOtherPersonForChat();

    if (!otherPerson.email || normalizeEmail(otherPerson.email) === userData.email) {
      alert("No valid chat participant found.");
      return;
    }

    if (currentStatus === "match_found" || currentStatus === "searching") {
      ensureVerifyingStatus();
    }

    const conversationId = getOrCreateConversation({
      itemId: itemDetail.id,
      itemTitle: itemDetail.title,
      itemImage: itemDetail.image || null,
      itemType: itemDetail.type,
      currentUserEmail: userData.email,
      currentUserName: userData.name,
      otherEmail: otherPerson.email,
      otherName: otherPerson.name,
    });

    createNotification({
      recipientEmail: otherPerson.email,
      conversationId,
      type: "message",
    });

    navigate(`/messages/${conversationId}`);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-[#0E1511] items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  if (!itemDetail) {
    return (
      <div className="flex flex-col h-screen bg-[#0E1511] items-center justify-center gap-4 text-white">
        <h2 className="text-2xl font-bold text-[#DDE4DD]">Item not found</h2>

        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 bg-[#164A41] rounded-lg"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isLost = itemDetail.type === "LOST";
  const currentStatus = normalizeStatus(itemDetail.status);
  const hasFinder = Boolean(getFinderEmail());
  const isResolved = isResolvedStatus(currentStatus);

  const isMatchOrVerifying =
    currentStatus === "match_found" ||
    currentStatus === "verifying" ||
    (isLost && hasFinder && !isResolved);

  const reporterProfile = getReporterProfile();
  const ownerProfile = getOwnerProfile();
  const finderProfile = getFinderProfile();

  const shouldShowFoundBy = isLost && isResolved && hasFinder;

  const getStatusBadge = () => {
    if (isResolved) {
      return {
        text: "RESOLVED",
        style: "bg-[#11996C]/80 border-[#11996C]",
      };
    }

    if (currentStatus === "verifying") {
      return {
        text: "VERIFYING",
        style: "bg-blue-600/50 border-blue-500/30",
      };
    }

    if (isLost && (currentStatus === "match_found" || hasFinder)) {
      return {
        text: "MATCH FOUND",
        style: "bg-amber-500/40 border-amber-400/40",
      };
    }

    if (isLost) {
      return {
        text: "LOST",
        style: "bg-[#EF4444]/50 border-[#EF4444]/30",
      };
    }

    return {
      text: "FOUND",
      style: "bg-[#11996C]/50 border-[#11996C]",
    };
  };

  const badge = getStatusBadge();

  const getLostChatButtonText = () => {
    if (currentStatus === "verifying") return "Continue Chat";

    if (isCurrentUserOwner()) {
      return "Message Finder";
    }

    return "Message Owner";
  };

  return (
    <div className="flex h-screen bg-[#0E1511] text-white font-['Inter'] overflow-hidden selection:bg-[#164A41] selection:text-white">
      <Sidebar activePage="" />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-y-auto p-6 md:p-8 pb-32 flex flex-col items-center">
          <div className="w-full max-w-250 flex flex-col gap-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-[#86948A] text-sm font-medium hover:text-[#DDE4DD] transition-colors w-fit"
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              back
            </button>

            <div className="flex flex-col lg:flex-row gap-6 items-start mt-2">
              <div className="w-full lg:w-[45%] h-75 lg:h-125 bg-[#A0A0A0] rounded-xl outline outline-neutral-700 overflow-hidden shrink-0">
                <img
                  src={itemDetail.image}
                  alt={itemDetail.title || "Item"}
                  className="w-full h-full object-cover"
                  onError={(event) => {
                    event.target.src =
                      "https://placehold.co/500x500/1A211D/4D774E?text=No+Image";
                  }}
                />
              </div>

              <div className="w-full lg:w-[55%] bg-[#161D19] border border-[#3C4A42] rounded-xl p-6 lg:p-8 flex flex-col relative overflow-hidden">
                <div className="absolute inset-0 bg-[#164A41]/40 shadow-lg pointer-events-none" />

                <div className="relative z-10 flex flex-col flex-1">
                  {isLost ? (
                    <>
                      <div className="mb-4">
                        <span
                          className={`inline-block text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide backdrop-blur-sm mb-3 border ${badge.style}`}
                        >
                          {badge.text}
                        </span>

                        <h2 className="text-[#DDE4DD] text-3xl font-bold leading-tight mb-3">
                          {itemDetail.title || "Untitled Item"}
                        </h2>

                        <p className="text-[#BBCABF] text-base leading-relaxed wrap-break-words">
                          {itemDetail.description || "No description provided."}
                        </p>
                      </div>

                      <hr className="border-[#3C4A42] my-6" />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4 mb-6">
                        <div>
                          <h4 className="text-[#86948A] text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-2">
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
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            Date Lost
                          </h4>

                          <p className="text-[#DDE4DD] text-base">
                            {getReportDateText(itemDetail)}
                          </p>
                        </div>

                        <div>
                          <h4 className="text-[#86948A] text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-2">
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
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />

                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            Location Lost
                          </h4>

                          <p className="text-[#DDE4DD] text-base">
                            {itemDetail.location || "Unknown location"}
                          </p>
                        </div>

                        {isMatchOrVerifying && (
                          <>
                            <div>
                              <h4 className="text-[#86948A] text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-2">
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
                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                  />

                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                </svg>
                                Location Found
                              </h4>

                              <p className="text-[#DDE4DD] text-base">
                                {getFoundLocationText()}
                              </p>
                            </div>

                            <div>
                              <h4 className="text-[#86948A] text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-2">
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
                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                  />
                                </svg>
                                Storage Location
                              </h4>

                              <p className="text-[#DDE4DD] text-base">
                                {getStorageLocationText()}
                              </p>
                            </div>
                          </>
                        )}

                        <div className="md:col-span-2">
                          <h4 className="text-[#86948A] text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-2">
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
                                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                              />
                            </svg>
                            Category
                          </h4>

                          <p className="text-[#DDE4DD] text-base">
                            {itemDetail.category || "Others"}
                          </p>
                        </div>
                      </div>

                      <hr className="border-[#3C4A42] mb-6" />

                      {isMatchOrVerifying && (
                        <div className="flex flex-col gap-4 relative mb-8">
                          <h3 className="text-[#DDE4DD] text-xl font-semibold mb-2">
                            How to Claim
                          </h3>

                          <div className="absolute left-2.75 top-12 bottom-6 w-0.5 bg-[#3C4A42]" />

                          {[
                            {
                              n: 1,
                              title: "Verify ownership via Chat",
                              desc: "Message the finder to confirm specific details about the item.",
                            },
                            {
                              n: 2,
                              title: "Bring your Campus ID",
                              desc: "Present your valid ID at the storage location.",
                            },
                            {
                              n: 3,
                              title: "Sign the handover log",
                              desc: "Complete the formal handover process and retrieve your item.",
                            },
                          ].map((s) => (
                            <div
                              key={s.n}
                              className="flex items-start gap-4 relative z-10"
                            >
                              <div className="w-6 h-6 rounded-full bg-white text-[#13342E] flex items-center justify-center text-xs font-bold shrink-0 shadow-md">
                                {s.n}
                              </div>

                              <div className="flex flex-col pb-6 flex-1">
                                <span className="text-[#DDE4DD] text-base font-medium">
                                  {s.title}
                                </span>

                                <span className="text-[#86948A] text-sm mt-0.5">
                                  {s.desc}
                                </span>
                              </div>
                            </div>
                          ))}

                          <hr className="border-[#3C4A42] mt-2" />
                        </div>
                      )}

                      <div className="flex flex-col gap-8 mb-8">
                        <ProfileMiniCard
                          title="Reported by"
                          profile={reporterProfile}
                          showMessage={!isCurrentUserReporter() && !isResolved}
                          onMessage={handleContinueChat}
                        />

                        {shouldShowFoundBy && (
                          <div className="animate-[fadeIn_0.5s_ease-out]">
                            <ProfileMiniCard
                              title="Found by"
                              profile={finderProfile}
                            />
                          </div>
                        )}
                      </div>

                      <div className="mt-auto pt-4">
                        {isResolved ? (
                          <div className="w-full py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-center text-base">
                            ✓ This item has been resolved
                          </div>
                        ) : isMatchOrVerifying ? (
                          <button
                            onClick={handleContinueChat}
                            className="w-full text-[18px] font-bold py-4 rounded-xl transition-all shadow-lg hover:-translate-y-0.5 bg-white hover:bg-gray-200 text-[#003824] shadow-white/10 flex justify-center items-center gap-2"
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
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                              />
                            </svg>

                            {getLostChatButtonText()}
                          </button>
                        ) : (
                          <button
                            onClick={handleReportAsFound}
                            className="w-full text-[18px] font-bold py-4 rounded-xl transition-all shadow-lg hover:-translate-y-0.5 bg-white hover:bg-gray-200 text-[#003824] shadow-white/10"
                          >
                            Report as Found
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mb-4">
                        <div className="flex justify-start items-center gap-3 mb-3">
                          <div
                            className={`px-2.5 py-0.5 rounded-full flex justify-center items-center border ${badge.style}`}
                          >
                            <span className="text-xs font-bold leading-4 tracking-wide uppercase">
                              {badge.text}
                            </span>
                          </div>

                          {currentStatus !== "verifying" && !isResolved && (
                            <div className="pl-2.5 pr-4 py-0.5 rounded-full outline -outline-offset-1 outline-[#11996C]/30 flex justify-start items-center gap-1.5">
                              <div className="w-1.5 h-1.5 bg-[#11996C] rounded-full" />

                              <span className="text-white text-xs font-normal leading-4">
                                Status: Ready for Pickup
                              </span>
                            </div>
                          )}
                        </div>

                        <h2 className="text-[#DDE4DD] text-3xl font-bold leading-tight mb-3">
                          {itemDetail.title || "Untitled Item"}
                        </h2>

                        <p className="text-[#BBCABF] text-base leading-relaxed wrap-break-words">
                          {itemDetail.description || "No description provided."}
                        </p>
                      </div>

                      <hr className="border-[#3C4A42] my-6" />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4 mb-6">
                        <div>
                          <h4 className="text-[#86948A] text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-2">
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
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            Date Found
                          </h4>

                          <p className="text-[#DDE4DD] text-base">
                            {getReportDateText(itemDetail)}
                          </p>
                        </div>

                        <div>
                          <h4 className="text-[#86948A] text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-2">
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
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />

                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            Location Found
                          </h4>

                          <p className="text-[#DDE4DD] text-base">
                            {itemDetail.foundLocation ||
                              itemDetail.location ||
                              "Unknown location"}
                          </p>
                        </div>

                        <div className="md:col-span-2">
                          <h4 className="text-[#86948A] text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-2">
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
                                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                              />
                            </svg>
                            Category
                          </h4>

                          <p className="text-[#DDE4DD] text-base">
                            {itemDetail.category || "Others"}
                          </p>
                        </div>
                      </div>

                      <hr className="border-[#3C4A42] my-6" />

                      <div className="flex flex-col gap-4 relative">
                        <h3 className="text-[#DDE4DD] text-xl font-semibold mb-2">
                          How to Claim
                        </h3>

                        <div className="absolute left-2.75 top-12 bottom-6 w-0.5 bg-[#3C4A42]" />

                        <div
                          onClick={
                            !isResolved ? handleVerifyOwnership : undefined
                          }
                          className={`flex items-start gap-4 relative z-10 group ${isResolved ? "" : "cursor-pointer"
                            }`}
                        >
                          <div className="w-6 h-6 rounded-full bg-white text-[#13342E] flex items-center justify-center text-xs font-bold shrink-0 shadow-md">
                            1
                          </div>

                          <div className="flex flex-col pb-6 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[#DDE4DD] text-base font-medium group-hover:underline transition-all">
                                {currentStatus === "verifying"
                                  ? "Chat Active, Continue Verifying"
                                  : "Verify ownership via Chat"}
                              </span>

                              {!isResolved && (
                                <svg
                                  className="w-4 h-4 text-[#4EDEA3] opacity-0 group-hover:opacity-100 transition-opacity"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                  />
                                </svg>
                              )}
                            </div>

                            <span className="text-[#86948A] text-sm mt-0.5">
                              Message the finder and describe specific item
                              details before pickup.
                            </span>
                          </div>
                        </div>

                        {[
                          {
                            n: 2,
                            title: "Bring your Campus ID",
                            desc: "Present your valid ID at the storage location.",
                          },
                          {
                            n: 3,
                            title: "Sign the handover log",
                            desc: "Complete the formal handover process and retrieve your item.",
                          },
                        ].map((s) => (
                          <div
                            key={s.n}
                            className="flex items-start gap-4 relative z-10"
                          >
                            <div className="w-6 h-6 rounded-full bg-white text-[#13342E] flex items-center justify-center text-xs font-bold shrink-0 shadow-md">
                              {s.n}
                            </div>

                            <div className="flex flex-col pb-6">
                              <span className="text-[#DDE4DD] text-base font-medium">
                                {s.title}
                              </span>

                              <span className="text-[#86948A] text-sm mt-0.5">
                                {s.desc}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <hr className="border-[#3C4A42] my-6" />

                      <div className="mb-4">
                        <ProfileMiniCard
                          title="Found by"
                          profile={finderProfile}
                        />
                      </div>

                      <div className="mt-auto pt-4">
                        {isResolved ? (
                          <div className="w-full py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-center text-base">
                            ✓ This item has been resolved
                          </div>
                        ) : (
                          <button
                            onClick={handleVerifyOwnership}
                            className="w-full text-[18px] font-bold py-4 rounded-xl transition-all shadow-lg hover:-translate-y-0.5 bg-white hover:bg-gray-200 text-[#003824] shadow-white/10 flex justify-center items-center gap-2"
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
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                              />
                            </svg>

                            {currentStatus === "verifying"
                              ? "Continue Chat"
                              : "Verify Ownership via Chat"}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default ItemDetail;