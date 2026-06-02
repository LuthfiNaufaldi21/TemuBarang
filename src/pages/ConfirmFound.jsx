import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import {
  getOrCreateConversation,
  readConversations,
  writeConversations,
} from "../utils/conversationUtils";

function normalizeEmail(email) {
  return (email || "").toString().trim().toLowerCase();
}

function readStorageArray(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch (error) {
    console.error(`Failed to read ${key}:`, error);
    return [];
  }
}

function writeStorageArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("temuStorage"));
}

function normalizeStatus(status) {
  return (status || "searching")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function isResolvedStatus(status) {
  const normalized = normalizeStatus(status);

  return (
    normalized === "resolved" ||
    normalized === "returned" ||
    normalized === "closed" ||
    normalized === "completed"
  );
}

function createDirectClaimId(itemId, email) {
  const emailSlug = normalizeEmail(email)
    .split("@")[0]
    .replace(/[^a-z0-9]/gi, "_");

  return `direct_claim_${itemId}_${emailSlug}`;
}

function getCurrentUserEmail() {
  return normalizeEmail(localStorage.getItem("currentUserEmail"));
}

function getUserProfile(email) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return {
      name: "Student",
      email: "",
      avatarUrl: null,
    };
  }

  const profileKey = `temuProfile_${normalizedEmail}`;
  const savedProfile = localStorage.getItem(profileKey);

  if (savedProfile) {
    try {
      const parsed = JSON.parse(savedProfile);

      return {
        name: parsed.fullName
          ? parsed.fullName.split(" ")[0]
          : normalizedEmail.split("@")[0],
        email: normalizedEmail,
        avatarUrl: parsed.avatarUrl || null,
      };
    } catch (error) {
      console.error("Failed to read profile:", error);
    }
  }

  return {
    name: normalizedEmail.split("@")[0],
    email: normalizedEmail,
    avatarUrl: null,
  };
}

function upsertNotification(notificationPayload) {
  const notifications = readStorageArray("temuNotifications");

  const alreadyExists = notifications.some((notification) => {
    const sameUser =
      normalizeEmail(notification.userId || notification.recipientEmail) ===
      normalizeEmail(notificationPayload.userId);

    const sameItem =
      notification.itemId?.toString() === notificationPayload.itemId?.toString();

    const sameFinder =
      normalizeEmail(notification.finderEmail) ===
      normalizeEmail(notificationPayload.finderEmail);

    const sameType = notification.type === notificationPayload.type;

    return sameUser && sameItem && sameFinder && sameType && !notification.read;
  });

  if (alreadyExists) return;

  writeStorageArray("temuNotifications", [
    notificationPayload,
    ...notifications,
  ]);
}

function appendActivity(activityPayload) {
  const activities = readStorageArray("temuActivities");

  writeStorageArray("temuActivities", [activityPayload, ...activities]);
}

function appendConversationContext({
  conversationId,
  itemId,
  itemTitle,
  itemImage,
  ownerEmail,
  ownerName,
  finderEmail,
  finderName,
  foundLocation,
  storageLocation,
  notes,
}) {
  const conversations = readConversations();
  const convIndex = conversations.findIndex(
    (conversation) => conversation.id === conversationId
  );

  if (convIndex === -1) return conversationId;

  const now = new Date().toISOString();
  const conversation = conversations[convIndex];

  const oldMessages = Array.isArray(conversation.messages)
    ? conversation.messages
    : [];

  const alreadyHasSystemEvent = oldMessages.some(
    (message) =>
      message.type === "system" &&
      message.eventType === "found_report_submitted" &&
      message.itemId?.toString() === itemId?.toString() &&
      normalizeEmail(message.finderEmail) === normalizeEmail(finderEmail)
  );

  const systemEvent = alreadyHasSystemEvent
    ? []
    : [
      {
        id: `sys_found_report_${itemId}_${Date.now()}`,
        type: "system",
        eventType: "found_report_submitted",
        itemId,
        finderEmail,
        finderName,
        label: `${finderName} submitted found item details.`,
        details: {
          foundLocation,
          storageLocation,
          notes,
        },
        sentAt: now,
      },
    ];

  const itemHistory = Array.isArray(conversation.itemHistory)
    ? [...conversation.itemHistory]
    : [];

  const alreadyInHistory = itemHistory.some(
    (entry) => entry.itemId?.toString() === itemId?.toString()
  );

  if (!alreadyInHistory) {
    itemHistory.push({
      itemId,
      itemTitle,
      itemImage: itemImage || null,
      itemType: "LOST",
      addedAt: now,
    });
  }

  conversations[convIndex] = {
    ...conversation,
    itemId: conversation.itemId || itemId,
    itemTitle: conversation.itemTitle || itemTitle,
    itemImage: conversation.itemImage || itemImage || null,
    itemType: conversation.itemType || "LOST",
    activeItemId: itemId,
    activeItemTitle: itemTitle,
    activeItemImage: itemImage || null,
    activeItemType: "LOST",
    itemHistory,
    status: "open",
    closedAt: null,
    resolvedAt: null,
    participants: Array.from(
      new Set([
        ...(conversation.participants || []),
        normalizeEmail(ownerEmail),
        normalizeEmail(finderEmail),
      ])
    ),
    participantNames: {
      ...(conversation.participantNames || {}),
      [normalizeEmail(ownerEmail)]: ownerName,
      [normalizeEmail(finderEmail)]: finderName,
    },
    messages: [...oldMessages, ...systemEvent],
    lastMessage: `${finderName} submitted found item details.`,
    lastMessageAt: now,
    lastMessageSender: "system",
    readBy: [normalizeEmail(finderEmail)],
    updatedAt: now,
  };

  writeConversations(conversations);

  return conversationId;
}

function ConfirmFound() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [itemDetail, setItemDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    foundLocation: "",
    notes: "",
  });

  const [userData] = useState(() => {
    const currentUserEmail = getCurrentUserEmail();
    return getUserProfile(currentUserEmail);
  });

  useEffect(() => {
    const reports = readStorageArray("temuReports");
    const selectedItem = reports.find(
      (report) => report.id?.toString() === id?.toString()
    );

    if (selectedItem) {
      setItemDetail(selectedItem);
    } else {
      navigate("/lost-items");
    }

    setIsLoading(false);
  }, [id, navigate]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const currentUserEmail = getCurrentUserEmail();

    if (!currentUserEmail) {
      alert("Please login first.");
      return;
    }

    if (!itemDetail) {
      alert("Item data is missing. Please try again.");
      return;
    }

    if (!formData.foundLocation.trim()) {
      alert("Please fill where you found it.");
      return;
    }

    const ownerEmail = normalizeEmail(itemDetail.reporterEmail);
    const ownerName =
      itemDetail.reporterName || ownerEmail.split("@")[0] || "Owner";

    if (!ownerEmail) {
      alert("Owner data is missing. Please try again.");
      return;
    }

    if (ownerEmail === currentUserEmail) {
      alert("You cannot report your own lost item as found.");
      return;
    }

    if (isResolvedStatus(itemDetail.status)) {
      alert("This report has already been resolved.");
      return;
    }

    const now = new Date().toISOString();
    const itemId = id;
    const itemTitle = itemDetail.title || "Untitled Item";
    const claimId = createDirectClaimId(itemId, currentUserEmail);

    const reports = readStorageArray("temuReports");

    const updatedReports = reports.map((report) => {
      if (report.id?.toString() !== itemId?.toString()) return report;

      const oldCandidates = Array.isArray(report.potentialFounders)
        ? [...report.potentialFounders]
        : [];

      const existingIndex = oldCandidates.findIndex((candidate) => {
        const sameEmail = normalizeEmail(candidate.email) === currentUserEmail;
        const sameClaim =
          candidate.foundItemId?.toString() === claimId?.toString();

        return sameEmail || sameClaim;
      });

      const candidatePayload = {
        foundItemId: claimId,
        source: "direct_report_as_found",
        email: currentUserEmail,
        finderEmail: currentUserEmail,
        name: userData.name,
        finderName: userData.name,
        foundAt: now,
        foundLocation: formData.foundLocation.trim(),
        notes: formData.notes.trim(),
        status: "match_found",
      };

      if (existingIndex >= 0) {
        oldCandidates[existingIndex] = {
          ...oldCandidates[existingIndex],
          ...candidatePayload,
        };
      } else {
        oldCandidates.push(candidatePayload);
      }

      const currentStatus = normalizeStatus(report.status);
      const shouldKeepCurrentPrimary =
        Boolean(report.founderEmail || report.foundByEmail) &&
        currentStatus !== "searching";

      return {
        ...report,
        status:
          currentStatus === "verifying" || currentStatus === "resolved"
            ? currentStatus
            : "match_found",
        foundLocation: shouldKeepCurrentPrimary
          ? report.foundLocation
          : formData.foundLocation.trim(),
        storageLocation: shouldKeepCurrentPrimary
          ? report.storageLocation
          : formData.storageLocation.trim(),
        finderNotes: shouldKeepCurrentPrimary
          ? report.finderNotes
          : formData.notes.trim(),
        foundByName: shouldKeepCurrentPrimary
          ? report.foundByName
          : userData.name,
        founderName: shouldKeepCurrentPrimary
          ? report.founderName
          : userData.name,
        founderEmail: shouldKeepCurrentPrimary
          ? report.founderEmail
          : currentUserEmail,
        foundByEmail: shouldKeepCurrentPrimary
          ? report.foundByEmail
          : currentUserEmail,
        potentialFounders: oldCandidates,
        updatedAt: now,
      };
    });

    writeStorageArray("temuReports", updatedReports);

    const conversationId = getOrCreateConversation({
      itemId,
      itemTitle,
      itemImage: itemDetail.image || null,
      itemType: "LOST",
      currentUserEmail,
      currentUserName: userData.name,
      otherEmail: ownerEmail,
      otherName: ownerName,
    });

    const activeConversationId = appendConversationContext({
      conversationId,
      itemId,
      itemTitle,
      itemImage: itemDetail.image || null,
      ownerEmail,
      ownerName,
      finderEmail: currentUserEmail,
      finderName: userData.name,
      foundLocation: formData.foundLocation.trim(),
      storageLocation: formData.storageLocation.trim(),
      notes: formData.notes.trim(),
    });

    upsertNotification({
      id: `notif_match_${itemId}_${claimId}_${Date.now()}`,
      userId: ownerEmail,
      recipientEmail: ownerEmail,
      title: "Potential Match Found",
      message: `${userData.name} reported that they found an item that may match your "${itemTitle}" report.`,
      itemId,
      lostId: itemId,
      foundId: claimId,
      conversationId: activeConversationId,
      finderEmail: currentUserEmail,
      finderName: userData.name,
      foundLocation: formData.foundLocation.trim(),
      storageLocation: formData.storageLocation.trim(),
      type: "match",
      read: false,
      createdAt: now,
    });

    appendActivity({
      id: Date.now(),
      kind: "match_found",
      title: "Potential Match Found",
      text: `${itemTitle} was reported found at ${formData.foundLocation.trim()} and secured at ${formData.storageLocation.trim()}.`,
      time: "Just now",
      place: formData.storageLocation.trim(),
      itemId,
      createdAt: now,
    });

    localStorage.setItem(
      "temuLastSuccessProcess",
      JSON.stringify({
        type: "found_submission",
        itemId,
        itemTitle,
        itemImage: itemDetail.image || null,
        foundLocation: formData.foundLocation.trim(),
        storageLocation: formData.storageLocation.trim(),
        conversationId: activeConversationId,
        createdAt: now,
      })
    );

    window.dispatchEvent(new Event("temuStorage"));

    navigate(
      `/success-process?type=found&itemId=${itemId}&conversationId=${activeConversationId}`
    );
  };

  if (isLoading || !itemDetail) {
    return (
      <div className="flex h-screen bg-[#0E1511] items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0E1511] text-white overflow-hidden selection:bg-[#164A41] selection:text-white">
      <Sidebar activePage="" />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col items-center">
          <div className="w-full max-w-7xl flex flex-col gap-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-[#A1A1AA] hover:text-[#DDE4DD] text-sm font-medium transition-colors w-fit tracking-tight"
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
              Back
            </button>

            <div className="w-full p-8 flex flex-col gap-6 mt-2">
              <div className="w-full flex justify-between items-center mb-2">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#A1A1AA]/20 rounded-xl flex justify-center items-center">
                    <svg
                      className="w-6 h-6 text-[#A1A1AA]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>

                  <div className="flex flex-col gap-1">
                    <h2 className="text-[#E5E5E5] text-2xl font-semibold leading-8">
                      Confirm Found Item
                    </h2>

                    <p className="text-[#9CA3AF] text-sm font-medium leading-5 tracking-tight">
                      Found a {itemDetail.title} near{" "}
                      {itemDetail.location || "the reported location"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-8 mt-2 items-start">
                <form
                  id="confirmFoundForm"
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-6"
                >
                  <div className="flex flex-col gap-2">
                    <label className="text-[#D4D4D8] text-sm font-medium tracking-tight">
                      Where did you find it?
                    </label>

                    <div className="relative">
                      <svg
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]"
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

                      <input
                        type="text"
                        name="foundLocation"
                        value={formData.foundLocation}
                        onChange={handleInputChange}
                        placeholder="e.g. Fasilkom-TI Building D-104"
                        className="w-full bg-[#18181B] border border-[#27272A] rounded-xl py-3.5 pl-12 pr-4 text-[#D4D4D8] placeholder:text-[#4B5563] text-base focus:outline-none focus:border-[#4EDEA3] transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[#D4D4D8] text-sm font-medium tracking-tight">
                      Where is it stored now?
                    </label>

                    <div className="relative">
                      <svg
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]"
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

                      <select
                        name="storageLocation"
                        value={formData.storageLocation}
                        onChange={handleInputChange}
                        className="w-full bg-[#18181B] border border-[#27272A] rounded-xl py-3 pl-12 pr-10 text-[#E5E5E5] text-base appearance-none focus:outline-none focus:border-[#4EDEA3] transition-colors cursor-pointer"
                        required
                      >
                        <option value="Pos Satpam Pintu 1 USU">
                          Pos Satpam Pintu 1 USU
                        </option>
                        <option value="Pos Satpam Pintu 2 USU">
                          Pos Satpam Pintu 2 USU
                        </option>
                        <option value="Unit Keamanan Kampus USU">
                          Unit Keamanan Kampus USU
                        </option>
                        <option value="Unit Layanan Terpadu (ULT) USU">
                          Unit Layanan Terpadu (ULT) USU
                        </option>
                        <option value="Biro Pusat Administrasi USU">
                          Biro Pusat Administrasi USU
                        </option>
                        <option value="Perpustakaan Pusat USU">
                          Perpustakaan Pusat USU
                        </option>
                        <option value="Sekretariat Fakultas / Front Office Fakultas">
                          Sekretariat Fakultas / Front Office Fakultas
                        </option>
                        <option value="Bagian Akademik Fakultas">
                          Bagian Akademik Fakultas
                        </option>
                        <option value="Ruang Tata Usaha Departemen">
                          Ruang Tata Usaha Departemen
                        </option>
                        <option value="Kantor Program Studi">
                          Kantor Program Studi
                        </option>
                        <option value="Other (Detail in notes)">
                          Other (Provide details below)
                        </option>
                      </select>

                      <svg
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF] pointer-events-none"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>

                    <p className="text-[#71717A] text-xs font-semibold leading-4 tracking-wide mt-1">
                      Use an official campus storage point so the owner can
                      safely verify and collect the item.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[#D4D4D8] text-sm font-medium tracking-tight">
                      Additional Notes (Optional)
                    </label>

                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Condition details, item position, or specific identifiers..."
                      className="w-full h-32 bg-[#18181B] border border-[#27272A] rounded-xl py-3 px-4 text-[#E5E5E5] placeholder:text-[#4B5563] text-base focus:outline-none focus:border-[#4EDEA3] transition-colors resize-none"
                    />
                  </div>
                </form>

                <div className="flex flex-col gap-4">
                  <div className="w-full h-70 bg-[#27272A] rounded-xl border border-[#27272A] relative flex justify-center items-center overflow-hidden">
                    <img
                      src={itemDetail.image}
                      alt="Item Preview"
                      className="w-full h-full object-cover"
                    />

                    <div className="absolute bottom-4 left-4">
                      <div className="px-2.5 py-1 bg-[#4EDEA3]/50 backdrop-blur-md rounded-full border border-[#4EDEA3]/20">
                        <span className="text-white text-[10px] font-bold uppercase tracking-wide">
                          ITEM PREVIEW
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-[#27272A]/50 rounded-xl border border-[#27272A] flex items-start gap-3.5">
                    <svg
                      className="w-5 h-5 text-[#4EDEA3] shrink-0 mt-0.5"
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

                    <p className="text-[#D4D4D8] text-xs font-semibold leading-5 tracking-wide pr-1">
                      Submitting this form will notify the original reporter.
                      They can open the message room to verify details before
                      closing the report.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end items-center gap-4 mt-2 pt-2">
                    <button
                      type="button"
                      onClick={() => navigate(-1)}
                      className="w-full sm:w-auto px-8 py-3 bg-[#C62828] hover:bg-[#B71C1C] text-white font-bold rounded-full transition-all hover:shadow-lg transform active:scale-95 text-sm"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      form="confirmFoundForm"
                      className="w-full sm:w-auto px-8 py-3 bg-[#164A41] hover:bg-[#13342E] text-[#9CC88D] border border-[#9CC88D]/30 font-bold rounded-full flex items-center justify-center gap-2 transition-all hover:shadow-lg transform active:scale-95 text-sm"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Confirm Found
                    </button>
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

export default ConfirmFound;