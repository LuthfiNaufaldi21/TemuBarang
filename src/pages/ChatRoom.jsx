import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import {setItemStatus,resetItemToSearching,rejectFoundClaim,} from "../utils/statusUtils";
import {readConversations,writeConversations,findConversationById,} from "../utils/conversationUtils";

function normalizeStatus(status) {
  return (status || "searching").toLowerCase().replace(/\s+/g, "_");
}

function normalizeEmail(email) {
  return (email || "").toString().trim().toLowerCase();
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
  const currentUserEmail = localStorage.getItem("currentUserEmail");

  if (!currentUserEmail) {
    return {
      name: "Student",
      email: "student@usu.ac.id",
      avatarUrl: null,
    };
  }

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
    } catch (error) {
      console.error("Failed to read profile", error);
    }
  }

  return {
    name: currentUserEmail.split("@")[0],
    email: currentUserEmail,
    avatarUrl: null,
  };
}

function formatMessageTime(isoString) {
  if (!isoString) return "";

  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateLabel(isoString) {
  if (!isoString) return "";

  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const diffDays = Math.floor((now - date) / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function groupMessagesByDate(messages) {
  const groups = [];
  let currentDate = null;

  messages.forEach((message) => {
    const safeDate =
      message.sentAt || message.createdAt || new Date().toISOString();
    const dateKey = new Date(safeDate).toDateString();

    if (dateKey !== currentDate) {
      currentDate = dateKey;

      groups.push({
        type: "date",
        label: formatDateLabel(safeDate),
        key: dateKey,
      });
    }

    groups.push({
      type: "message",
      ...message,
    });
  });

  return groups;
}

function getReportOwnerEmail(report) {
  return (
    report?.reporterEmail ||
    report?.ownerEmail ||
    report?.founderEmail ||
    report?.foundByEmail ||
    ""
  );
}

function getOtherParticipant(conversation, currentUserEmail) {
  const otherEmail = conversation?.participants?.find(
    (email) => normalizeEmail(email) !== normalizeEmail(currentUserEmail)
  );

  const otherName = otherEmail
    ? conversation?.participantNames?.[otherEmail] || otherEmail.split("@")[0]
    : "Unknown";

  return {
    email: otherEmail || "",
    name: otherName,
    initial: otherName.substring(0, 2).toUpperCase(),
  };
}

function findItemByConversation(conversation) {
  const activeItemId = conversation?.activeItemId || conversation?.itemId;

  if (!activeItemId) return null;

  const allReports = readStorageArray("temuReports");

  return (
    allReports.find(
      (report) => report.id?.toString() === activeItemId?.toString()
    ) || null
  );
}

function getActiveItemId(conversation) {
  return conversation?.activeItemId || conversation?.itemId || "";
}

function getActiveItemTitle(conversation) {
  return conversation?.activeItemTitle || conversation?.itemTitle || "";
}

function getActiveItemImage(conversation) {
  return conversation?.activeItemImage || conversation?.itemImage || "";
}

function SystemEventPill({ event }) {
  const config =
    {
      resolved: {
        color: "text-[#9CC88D]",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        ),
      },
      closed: {
        color: "text-[#71717A]",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          />
        ),
      },
      reopened: {
        color: "text-[#9CC88D]",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        ),
      },
      verifying: {
        color: "text-blue-400",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        ),
      },
      case_started: {
        color: "text-[#9CC88D]",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
          />
        ),
      },
      claim_rejected: {
        color: "text-[#FFB4AB]",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        ),
      },
      match_rejected: {
        color: "text-[#FFB4AB]",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        ),
      },
    }[event.eventType] || {
      color: "text-[#71717A]",
      icon: null,
    };

  return (
    <div className="flex items-center gap-3 my-3">
      <div className="flex-1 h-px bg-[#27272A]" />

      <div
        className={`flex items-center gap-1.5 px-3 py-1 bg-[#18181B] border border-[#27272A] rounded-full text-xs font-semibold ${config.color}`}
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          {config.icon}
        </svg>

        {event.label}
      </div>

      <div className="flex-1 h-px bg-[#27272A]" />
    </div>
  );
}

function StatusBanner({ status, onReopen }) {
  if (status === "open") return null;

  const isResolved = status === "resolved";

  return (
    <div
      className={`border-b px-6 py-3 flex items-center gap-3 ${isResolved
        ? "bg-[#0A120D] border-[#3C4A42]/40"
        : "bg-[#111318] border-[#27272A]"
        }`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isResolved ? "bg-[#9CC88D]/10" : "bg-[#27272A]"
          }`}
      >
        {isResolved ? (
          <svg
            className="w-4 h-4 text-[#9CC88D]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ) : (
          <svg
            className="w-4 h-4 text-[#71717A]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </div>

      <div className="flex-1">
        <span
          className={`text-sm font-semibold block ${isResolved ? "text-[#9CC88D]" : "text-[#A1A1AA]"
            }`}
        >
          {isResolved ? "Case Marked as Resolved" : "Conversation Closed"}
        </span>

        <span className="text-[#71717A] text-xs">
          {isResolved
            ? "Item has been returned. You can still send messages, and this conversation will reopen automatically."
            : "This case is closed. Send a message anytime to reopen it automatically."}
        </span>
      </div>

      <button
        onClick={onReopen}
        className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${isResolved
          ? "bg-[#164A41] border-[#9CC88D]/30 text-[#9CC88D] hover:bg-[#1a5a4e]"
          : "bg-[#27272A] border-[#3C4A42] text-[#A1A1AA] hover:bg-[#3C4A42] hover:text-white"
          }`}
      >
        Reopen
      </button>
    </div>
  );
}

function VerificationActionBanner({
  item,
  conversationStatus,
  currentUserEmail,
  otherName,
  onResolve,
  onRejectFoundClaim,
  onRejectLostMatch,
}) {
  if (!item) return null;

  const itemType = (item.type || "").toUpperCase();
  const itemStatus = normalizeStatus(item.status);
  const isConversationOpen = conversationStatus === "open";

  if (itemStatus !== "verifying" || !isConversationOpen) return null;

  const itemOwnerEmail = getReportOwnerEmail(item);
  const isItemReporter =
    normalizeEmail(currentUserEmail) === normalizeEmail(itemOwnerEmail);

  if (itemType === "FOUND") {
    if (isItemReporter) {
      return (
        <div className="border-b border-[#3C4A42]/40 bg-[#0A120D] px-6 py-4">
          <div className="bg-[#1A211D] border border-[#3C4A42]/40 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
                <svg
                  className="w-5 h-5 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>

              <div>
                <p className="text-[#DDE4DD] text-sm font-bold">
                  Ownership verification in progress
                </p>

                <p className="text-[#86948A] text-xs mt-1 leading-relaxed">
                  Ask {otherName} to describe specific details before returning
                  the item. Reject the claim if the answer does not match.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <button
                onClick={onResolve}
                className="px-4 py-2.5 rounded-xl bg-[#164A41] border border-[#9CC88D]/30 text-[#9CC88D] hover:bg-[#1a5a4e] text-xs font-bold transition-colors"
              >
                Mark as Resolved
              </button>

              <button
                onClick={onRejectFoundClaim}
                className="px-4 py-2.5 rounded-xl bg-[#C62828] hover:bg-[#B71C1C] text-white text-xs font-bold transition-colors"
              >
                Reject Claim
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="border-b border-[#3C4A42]/40 bg-[#0A120D] px-6 py-4">
        <div className="bg-[#1A211D] border border-[#3C4A42]/40 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
            <svg
              className="w-5 h-5 text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>

          <div>
            <p className="text-[#DDE4DD] text-sm font-bold">
              Ownership verification in progress
            </p>

            <p className="text-[#86948A] text-xs mt-1 leading-relaxed">
              Answer the finder’s questions clearly. The item should only be
              returned after your details match the report.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (itemType === "LOST" && isItemReporter) {
    return (
      <div className="border-b border-[#3C4A42]/40 bg-[#0A120D] px-6 py-4">
        <div className="bg-[#1A211D] border border-[#3C4A42]/40 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
              <svg
                className="w-5 h-5 text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>

            <div>
              <p className="text-[#DDE4DD] text-sm font-bold">
                Match verification in progress
              </p>

              <p className="text-[#86948A] text-xs mt-1 leading-relaxed">
                Confirm the found item details first. If it is not your item,
                reject the match so your lost report returns to searching.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <button
              onClick={onResolve}
              className="px-4 py-2.5 rounded-xl bg-[#164A41] border border-[#9CC88D]/30 text-[#9CC88D] hover:bg-[#1a5a4e] text-xs font-bold transition-colors"
            >
              Mark as Resolved
            </button>

            <button
              onClick={onRejectLostMatch}
              className="px-4 py-2.5 rounded-xl bg-[#C62828] hover:bg-[#B71C1C] text-white text-xs font-bold transition-colors"
            >
              Not My Item
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function StatusActionModal({ action, onConfirm, onCancel }) {
  const modalConfig = {
    reject_found_claim: {
      title: "Reject This Claim?",
      description:
        "Use this only if the claimant cannot prove the item is theirs. The item will return to searching and this conversation will be closed.",
      iconBg: "bg-[#C62828]/10",
      iconColor: "text-[#FFB4AB]",
      buttonClass: "bg-[#C62828] hover:bg-[#B71C1C] text-white",
      confirmText: "Reject Claim",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 18L18 6M6 6l12 12"
        />
      ),
    },
    reject_lost_match: {
      title: "Reject This Match?",
      description:
        "Use this if the found item is not yours. Your lost report will return to searching and this conversation will be closed.",
      iconBg: "bg-[#C62828]/10",
      iconColor: "text-[#FFB4AB]",
      buttonClass: "bg-[#C62828] hover:bg-[#B71C1C] text-white",
      confirmText: "Not My Item",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 18L18 6M6 6l12 12"
        />
      ),
    },
  };

  const config = modalConfig[action];

  if (!config) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${config.iconBg}`}
          >
            <svg
              className={`w-5 h-5 ${config.iconColor}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              {config.icon}
            </svg>
          </div>

          <div>
            <h3 className="text-[#E4E4E7] text-base font-bold">
              {config.title}
            </h3>

            <p className="text-[#86948A] text-sm mt-1 leading-relaxed">
              {config.description}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-[#27272A] text-[#A1A1AA] hover:bg-white/5 transition-colors text-sm font-medium"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${config.buttonClass}`}
          >
            {config.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatRoom() {
  const navigate = useNavigate();
  const { conversationId } = useParams();

  const [conversation, setConversation] = useState(null);
  const [itemData, setItemData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  const hasTriggeredVerifying = useRef(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const [userData] = useState(() => getCurrentUserData());

  const loadConversation = useCallback(() => {
    const currentConversation = findConversationById(conversationId);

    if (currentConversation) {
      if (currentConversation.id !== conversationId) {
        navigate(`/messages/${currentConversation.id}`, { replace: true });
      }

      setConversation(currentConversation);
      setMessages(currentConversation.messages || []);

      const currentItem = findItemByConversation(currentConversation);
      setItemData(currentItem);

      const activeItemId = getActiveItemId(currentConversation);

      const hasVerifying = (currentConversation.messages || []).some(
        (message) =>
          message.eventType === "verifying" &&
          (!activeItemId ||
            !message.itemId ||
            message.itemId?.toString() === activeItemId?.toString())
      );

      if (hasVerifying) {
        hasTriggeredVerifying.current = true;
      }

      if (
        currentConversation.lastMessageSender &&
        currentConversation.lastMessageSender !== userData.email
      ) {
        const conversationsCopy = readConversations();
        const index = conversationsCopy.findIndex(
          (item) => item.id === currentConversation.id
        );

        if (index !== -1) {
          const readByList = conversationsCopy[index].readBy || [];

          if (!readByList.includes(userData.email)) {
            conversationsCopy[index].readBy = [...readByList, userData.email];
            writeConversations(conversationsCopy);
          }
        }
      }
    } else {
      setConversation(null);
      setMessages([]);
      setItemData(null);
    }

    setIsLoading(false);
  }, [conversationId, navigate, userData.email]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleStorageRefresh = () => {
      loadConversation();
    };

    window.addEventListener("storage", handleStorageRefresh);
    window.addEventListener("temuStorage", handleStorageRefresh);

    return () => {
      window.removeEventListener("storage", handleStorageRefresh);
      window.removeEventListener("temuStorage", handleStorageRefresh);
    };
  }, [loadConversation]);

  const addSystemEventToConversation = ({
    eventType,
    label,
    nextStatus,
    resolvedAt = null,
  }) => {
    const activeItemId = getActiveItemId(conversation);

    const systemEvent = {
      id: `sys_${eventType}_${activeItemId || "conversation"}_${Date.now()}`,
      type: "system",
      eventType,
      itemId: activeItemId,
      label,
      sentAt: new Date().toISOString(),
    };

    const updatedMessages = [...messages, systemEvent];

    setMessages(updatedMessages);

    const conversations = readConversations();
    const index = conversations.findIndex((item) => item.id === conversation.id);

    if (index !== -1) {
      conversations[index] = {
        ...conversations[index],
        status: nextStatus,
        messages: updatedMessages,
        lastMessage: label,
        lastMessageAt: systemEvent.sentAt,
        lastMessageSender: "system",
        resolvedAt,
        closedAt: nextStatus === "closed" ? systemEvent.sentAt : null,
        readBy: [],
      };

      writeConversations(conversations);
      setConversation(conversations[index]);
    }
  };

  const handleGoToCloseReport = () => {
    const activeItemId = getActiveItemId(conversation) || itemData?.id;

    if (!activeItemId) {
      alert("Item data not found.");
      return;
    }

    navigate(`/close-report/${activeItemId}`);
  };

  const handleReopen = () => {
    addSystemEventToConversation({
      eventType: "reopened",
      label: "Conversation reopened",
      nextStatus: "open",
      resolvedAt: null,
    });
  };

  const handleRejectFoundClaim = () => {
    const activeItemId = getActiveItemId(conversation);

    if (!activeItemId || !itemData) {
      alert("Item data not found.");
      setPendingAction(null);
      return;
    }

    const otherParticipant = getOtherParticipant(conversation, userData.email);

    const success = rejectFoundClaim({
      itemId: activeItemId,
      rejectedClaimantEmail: otherParticipant.email,
      rejectedClaimantName: otherParticipant.name,
      rejectedByEmail: userData.email,
      rejectedByName: userData.name,
      reason: "Your claim was rejected because the item details did not match.",
      conversationId: conversation.id,
    });

    if (!success) {
      alert("Failed to reject claim. Please try again.");
      setPendingAction(null);
      return;
    }

    setPendingAction(null);

    setTimeout(() => {
      loadConversation();
    }, 0);
  };

  const handleRejectLostMatch = () => {
    const activeItemId = getActiveItemId(conversation);

    if (!activeItemId) {
      alert("Item data not found.");
      setPendingAction(null);
      return;
    }

    const otherParticipant = getOtherParticipant(conversation, userData.email);

    const success = resetItemToSearching(
      activeItemId,
      otherParticipant.email,
      itemData?.matchedFoundItemId || ""
    );

    if (!success) {
      alert("Failed to reject match. Please try again.");
      setPendingAction(null);
      return;
    }

    setPendingAction(null);

    setTimeout(() => {
      loadConversation();
    }, 0);
  };

  const confirmPendingAction = () => {
    if (pendingAction === "reject_found_claim") {
      handleRejectFoundClaim();
      return;
    }

    if (pendingAction === "reject_lost_match") {
      handleRejectLostMatch();
    }
  };

  const handleSend = () => {
    const text = inputText.trim();
    const hasPhoto = Boolean(photoPreview);

    if (!text && !hasPhoto) return;
    if (!conversation) return;

    const activeItemId = getActiveItemId(conversation);
    const wasNotOpen = conversation?.status && conversation.status !== "open";
    const isFirstMessage = !hasTriggeredVerifying.current;

    const systemReopen = wasNotOpen
      ? {
        id: `sys_reopened_${activeItemId || "conversation"}_${Date.now()}`,
        type: "system",
        eventType: "reopened",
        itemId: activeItemId,
        label: "Conversation reopened",
        sentAt: new Date().toISOString(),
      }
      : null;

    const systemVerifying = isFirstMessage
      ? {
        id: `sys_verifying_${activeItemId || "conversation"}_${Date.now() + 1
          }`,
        type: "system",
        eventType: "verifying",
        itemId: activeItemId,
        label: "Ownership verification started",
        sentAt: new Date(Date.now() + 1).toISOString(),
      }
      : null;

    const newMessage = {
      id: `msg_${Date.now() + 2}`,
      type: "message",
      itemId: activeItemId,
      senderId: userData.email,
      senderName: userData.name,
      text: text || null,
      imageUrl: hasPhoto ? photoPreview.dataUrl : null,
      sentAt: new Date(Date.now() + 3).toISOString(),
    };

    const updatedMessages = [
      ...messages,
      ...(systemReopen ? [systemReopen] : []),
      ...(systemVerifying ? [systemVerifying] : []),
      newMessage,
    ];

    setMessages(updatedMessages);
    setInputText("");
    setPhotoPreview(null);

    const conversations = readConversations();
    const index = conversations.findIndex((item) => item.id === conversation.id);

    if (index !== -1) {
      conversations[index] = {
        ...conversations[index],
        messages: updatedMessages,
        lastMessage: hasPhoto ? "📷 Photo" : text,
        lastMessageAt: newMessage.sentAt,
        lastMessageSender: userData.email,
        readBy: [userData.email],
        status: wasNotOpen ? "open" : conversations[index].status || "open",
        resolvedAt: wasNotOpen ? null : conversations[index].resolvedAt,
        closedAt: wasNotOpen ? null : conversations[index].closedAt,
        updatedAt: newMessage.sentAt,
      };

      writeConversations(conversations);
      setConversation(conversations[index]);
    }

    if (isFirstMessage && activeItemId) {
      setItemStatus(activeItemId, "verifying");
      hasTriggeredVerifying.current = true;

      setTimeout(() => {
        loadConversation();
      }, 0);
    }

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handlePhotoSelect = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    event.target.value = "";

    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      setPhotoPreview({
        dataUrl: readerEvent.target.result,
      });
    };

    reader.readAsDataURL(file);
  };

  const status = conversation?.status || "open";
  const isNotOpen = status !== "open";
  const otherParticipant = getOtherParticipant(conversation, userData.email);
  const allItems = groupMessagesByDate(messages);

  const activeItemId = getActiveItemId(conversation);
  const activeItemTitle = getActiveItemTitle(conversation);
  const activeItemImage = getActiveItemImage(conversation);

  if (isLoading) {
    return (
      <div className="flex h-screen bg-[#0E1511] items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex flex-col h-screen bg-[#0E1511] items-center justify-center gap-4 text-white">
        <h2 className="text-2xl font-bold text-[#DDE4DD]">
          Conversation not found
        </h2>

        <button
          onClick={() => navigate("/messages")}
          className="px-6 py-2 bg-[#164A41] rounded-lg"
        >
          Back to Messages
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0E1511] text-white overflow-hidden">
      {pendingAction && (
        <StatusActionModal
          action={pendingAction}
          onConfirm={confirmPendingAction}
          onCancel={() => setPendingAction(null)}
        />
      )}

      <Sidebar activePage="messages" />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="bg-[#0E1511] border-b border-[#27272A] px-4 py-3 flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate("/messages")}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#86948A] hover:text-[#DDE4DD] hover:bg-[#164A41]/40 transition-all shrink-0"
            title="Back to Messages"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>

          <div className="w-9 h-9 rounded-full bg-[#242C27] border border-[#3C4A42] flex items-center justify-center text-sm font-bold text-[#86948A] shrink-0">
            {otherParticipant.initial}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[#DDE4DD] text-sm font-semibold leading-tight truncate">
              {otherParticipant.name}
            </p>
          </div>

          <div
            className={`px-2 py-0.5 rounded-full border text-xs font-bold uppercase tracking-wide shrink-0 ${status === "resolved"
              ? "bg-[#9CC88D]/10 border-[#9CC88D]/30 text-[#9CC88D]"
              : status === "closed"
                ? "bg-[#27272A] border-[#3C4A42] text-[#71717A]"
                : "bg-[#11996C]/20 border-[#11996C]/30 text-[#11996C]"
              }`}
          >
            {status === "resolved"
              ? "RESOLVED"
              : status === "closed"
                ? "CLOSED"
                : "OPEN"}
          </div>
        </div>

        {activeItemTitle && (
          <button
            type="button"
            onClick={() => {
              if (activeItemId) {
                navigate(`/item/${activeItemId}`);
              }
            }}
            className="bg-[#0A120D] border-b border-[#27272A]/50 px-6 py-2.5 flex items-center gap-3 text-left hover:bg-[#101A13] transition-colors"
          >
            {activeItemImage && (
              <img
                src={activeItemImage}
                alt={activeItemTitle}
                className="w-8 h-8 rounded-md object-cover border border-[#3C4A42]"
              />
            )}

            <span className="text-[#86948A] text-xs truncate">
              Regarding:{" "}
              <span className="text-[#DDE4DD] font-medium">
                {activeItemTitle}
              </span>
            </span>
          </button>
        )}

        <VerificationActionBanner
          item={itemData}
          conversationStatus={status}
          currentUserEmail={userData.email}
          otherName={otherParticipant.name}
          onResolve={handleGoToCloseReport}
          onRejectFoundClaim={() => setPendingAction("reject_found_claim")}
          onRejectLostMatch={() => setPendingAction("reject_lost_match")}
        />

        <StatusBanner status={status} onReopen={handleReopen} />

        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-1">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
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
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>

              <div className="text-center">
                <p className="text-[#86948A] text-base font-medium">
                  Start the conversation
                </p>

                <p className="text-[#3C4A42] text-sm mt-1 max-w-xs">
                  Introduce yourself and describe specific details to verify
                  ownership of the item.
                </p>
              </div>

              <button
                onClick={() =>
                  setInputText(
                    `Hi ${otherParticipant.name}! I believe the ${activeItemTitle || "item"
                    } you found is mine. Can I verify some details?`
                  )
                }
                className="mt-2 px-4 py-2.5 bg-[#18181B] hover:bg-[#1E2820] border border-[#3C4A42] hover:border-[#4EDEA3]/40 text-[#9CC88D] text-sm font-medium rounded-xl transition-all"
              >
                "I think this item is mine..."
              </button>
            </div>
          ) : (
            allItems.map((item) => {
              if (item.type === "date") {
                return (
                  <div key={item.key} className="flex items-center gap-4 my-4">
                    <div className="flex-1 h-px bg-[#27272A]" />

                    <span className="text-[#3C4A42] text-xs font-semibold tracking-wide">
                      {item.label}
                    </span>

                    <div className="flex-1 h-px bg-[#27272A]" />
                  </div>
                );
              }

              if (item.type === "system") {
                return <SystemEventPill key={item.id} event={item} />;
              }

              const isMe = item.senderId === userData.email;

              return (
                <div
                  key={item.id}
                  className={`flex items-end gap-2 mb-1 ${isMe ? "flex-row-reverse" : "flex-row"
                    }`}
                >
                  {!isMe && (
                    <div className="w-7 h-7 rounded-full bg-[#242C27] border border-[#3C4A42] flex items-center justify-center text-xs font-bold text-[#86948A] shrink-0 mb-1">
                      {otherParticipant.initial}
                    </div>
                  )}

                  <div
                    className={`max-w-[70%] flex flex-col gap-1 ${isMe ? "items-end" : "items-start"
                      }`}
                  >
                    {item.imageUrl && (
                      <div
                        className={`rounded-2xl overflow-hidden border ${isMe
                          ? "border-[#164A41] rounded-br-sm"
                          : "border-[#27272A] rounded-bl-sm"
                          }`}
                      >
                        <img
                          src={item.imageUrl}
                          alt="Sent"
                          className="max-w-60 max-h-80 object-cover cursor-pointer"
                          onClick={() => window.open(item.imageUrl, "_blank")}
                        />
                      </div>
                    )}

                    {item.text && (
                      <div
                        className={`px-4 py-3 rounded-2xl text-base leading-relaxed wrap-break-words ${isMe
                          ? "bg-[#164A41] text-[#DDE4DD] rounded-br-sm"
                          : "bg-[#18181B] border border-[#27272A] text-[#DDE4DD] rounded-bl-sm"
                          }`}
                      >
                        {item.text}
                      </div>
                    )}

                    <span className="text-[#3C4A42] text-xs px-1">
                      {formatMessageTime(item.sentAt)}
                    </span>
                  </div>

                  {isMe && <div className="w-7 shrink-0" />}
                </div>
              );
            })
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="bg-[#18181B]/90 backdrop-blur-md border-t border-[#27272A] px-6 py-4 shrink-0">
          {isNotOpen && (
            <div className="mb-3 flex items-center gap-2 text-xs text-[#86948A]">
              <svg
                className="w-3.5 h-3.5 text-[#9CC88D] shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Sending a message will automatically reopen this conversation.
            </div>
          )}

          {photoPreview && (
            <div className="mb-3 flex items-start gap-3">
              <div className="relative">
                <img
                  src={photoPreview.dataUrl}
                  alt="Preview"
                  className="w-20 h-20 object-cover rounded-xl border border-[#3C4A42]"
                />

                <button
                  onClick={() => setPhotoPreview(null)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-[#27272A] border border-[#3C4A42] rounded-full flex items-center justify-center text-[#A1A1AA] hover:text-white transition-colors"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <span className="text-[#86948A] text-xs mt-2">
                Photo ready to send
              </span>
            </div>
          )}

          <div className="flex items-end gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-[#18181B] border border-[#27272A] text-[#86948A] hover:text-[#9CC88D] hover:border-[#3C4A42] transition-all"
              title="Send photo"
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
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />

            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isNotOpen
                    ? `Reopen by messaging ${otherParticipant.name}.`
                    : `Message ${otherParticipant.name}.`
                }
                rows={1}
                className="w-full bg-[#0E1511] border border-[#3C4A42] focus:border-[#4EDEA3]/60 rounded-xl px-4 py-3 text-[#DDE4DD] text-base placeholder-[#3C4A42] focus:outline-none transition-colors resize-none leading-relaxed max-h-36"
                style={{ minHeight: "48px" }}
                onInput={(event) => {
                  event.target.style.height = "auto";
                  event.target.style.height = `${Math.min(
                    event.target.scrollHeight,
                    144
                  )}px`;
                }}
              />
            </div>

            <button
              onClick={handleSend}
              disabled={!inputText.trim() && !photoPreview}
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${inputText.trim() || photoPreview
                ? "bg-[#164A41] hover:bg-[#14433b] text-[#9CC88D] hover:-translate-y-0.5"
                : "bg-[#18181B] border border-[#27272A] text-[#3C4A42] cursor-not-allowed"
                }`}
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
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatRoom;