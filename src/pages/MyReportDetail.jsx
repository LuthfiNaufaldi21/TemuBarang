import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { setItemStatus, rejectFoundClaim } from "../utils/statusUtils";
import { detectDominantColor, detectBrand } from "../utils/colorDetector";
import { getOrCreateConversation } from "../utils/conversationUtils";

// Recovery status logic 
const LOST_STEPS = [
  { key: "searching", label: "Searching" },
  { key: "match_found", label: "Match Found" },
  { key: "verifying", label: "Verifying" },
  { key: "resolved", label: "Resolved" },
];

const FOUND_STEPS = [
  { key: "searching", label: "Finding Owner" },
  { key: "match_found", label: "Owner Found" },
  { key: "verifying", label: "Verifying ID" },
  { key: "resolved", label: "Returned" },
];

function normalizeStatus(status = "") {
  return (status || "searching").toLowerCase().replace(/\s+/g, "_");
}

function getStepIndex(status = "", steps) {
  const normalized = normalizeStatus(status);
  const idx = steps.findIndex((st) => st.key === normalized);

  return idx >= 0 ? idx : 0;
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

function getConversationTime(conversation) {
  const rawDate =
    conversation?.lastMessageAt ||
    conversation?.updatedAt ||
    conversation?.createdAt ||
    0;

  const parsed = new Date(rawDate).getTime();

  return Number.isNaN(parsed) ? 0 : parsed;
}

function conversationIncludesReport(conversation, reportId) {
  if (!conversation || !reportId) return false;

  const targetId = reportId?.toString();

  const directMatch =
    conversation.itemId?.toString() === targetId ||
    conversation.activeItemId?.toString() === targetId;

  if (directMatch) return true;

  const history = Array.isArray(conversation.itemHistory)
    ? conversation.itemHistory
    : [];

  return history.some((entry) => entry.itemId?.toString() === targetId);
}

function findLatestConversationForReport(reportId, currentUserEmail) {
  const conversations = readStorageArray("temuConversations");

  return (
    conversations
      .filter((conversation) => {
        const relatedToReport = conversationIncludesReport(
          conversation,
          reportId
        );

        const participantMatch = conversation.participants?.some(
          (email) => normalizeEmail(email) === normalizeEmail(currentUserEmail)
        );

        return relatedToReport && participantMatch;
      })
      .sort((a, b) => getConversationTime(b) - getConversationTime(a))[0] ||
    null
  );
}

function getOtherParticipantFromConversation(conversation, currentUserEmail) {
  const otherEmail =
    conversation?.participants?.find(
      (email) => normalizeEmail(email) !== normalizeEmail(currentUserEmail)
    ) || "";

  return {
    email: otherEmail,
    name:
      conversation?.participantNames?.[otherEmail] ||
      otherEmail.split("@")[0] ||
      "Student",
  };
}

function formatResolvedDate(report) {
  const rawDate =
    report?.resolvedDate ||
    report?.resolvedAt ||
    report?.closedAt ||
    report?.updatedAt ||
    "";

  if (!rawDate) return "—";

  const parsed = new Date(rawDate);

  if (Number.isNaN(parsed.getTime())) {
    return rawDate;
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function safeLower(value) {
  return (value || "").toString().toLowerCase();
}

function getLocationScore(reportLocation, candidateLocation) {
  const a = safeLower(reportLocation);
  const b = safeLower(candidateLocation);

  if (!a || !b) return 0;

  if (a === b) return 10;

  const usuAreas = [
    "fasilkom",
    "ilmu komputer",
    "teknologi informasi",
    "perpustakaan",
    "rektorat",
    "fakultas hukum",
    "fakultas teknik",
    "fakultas kedokteran",
    "fakultas ekonomi",
    "fisip",
    "fmipa",
    "farmasi",
    "psikologi",
    "vokasi",
    "auditorium",
    "gelanggang",
    "rumah sakit",
    "usu",
  ];

  const hitA = usuAreas.find((area) => a.includes(area));
  const hitB = usuAreas.find((area) => b.includes(area));

  if (hitA && hitB && hitA === hitB) return 8;
  if (a.includes("usu") && b.includes("usu")) return 4;

  return 0;
}

function getReportOwnerEmail(report) {
  return normalizeEmail(
    report?.reporterEmail ||
    report?.ownerEmail ||
    report?.lostByEmail ||
    report?.createdByEmail ||
    report?.userEmail ||
    ""
  );
}

function getReportFinderEmail(report) {
  return normalizeEmail(
    report?.reporterEmail ||
    report?.finderEmail ||
    report?.founderEmail ||
    report?.foundByEmail ||
    report?.createdByEmail ||
    report?.userEmail ||
    ""
  );
}

function isRejectedAiPair(lostReport, foundReport) {
  const lostId = lostReport?.id?.toString();
  const foundId = foundReport?.id?.toString();
  const finderEmail = getReportFinderEmail(foundReport);

  const rejectedFromLost = Array.isArray(lostReport?.rejectedMatches)
    ? lostReport.rejectedMatches.some((item) => {
      const sameFound = item.foundItemId?.toString() === foundId;
      const sameFinder =
        finderEmail && normalizeEmail(item.finderEmail || item.email) === finderEmail;

      return sameFound || sameFinder;
    })
    : false;

  const rejectedFromFound = Array.isArray(foundReport?.rejectedClaims)
    ? foundReport.rejectedClaims.some(
      (claim) => claim.lostItemId?.toString() === lostId
    )
    : false;

  return rejectedFromLost || rejectedFromFound;
}

function createAiMatchNotifications(lostReport, matches, ownerEmail) {
  const normalizedOwner = normalizeEmail(ownerEmail);
  if (!normalizedOwner || !lostReport || !Array.isArray(matches)) return;

  const savedNotifs = readStorageArray("temuNotifications");
  const now = new Date().toISOString();

  const newNotifications = matches
    .filter((match) => match?.id)
    .filter((match) => {
      return !savedNotifs.some((notif) => {
        const sameUser = normalizeEmail(notif.userId || notif.recipientEmail) === normalizedOwner;
        const sameType = notif.type === "ai_match_detected";
        const sameLost = notif.lostId?.toString() === lostReport.id?.toString();
        const sameFound = notif.foundId?.toString() === match.id?.toString();

        return sameUser && sameType && sameLost && sameFound;
      });
    })
    .map((match) => ({
      id: `notif_ai_match_${lostReport.id}_${match.id}_${Date.now()}`,
      userId: normalizedOwner,
      recipientEmail: normalizedOwner,
      title: "Possible Match Detected",
      message: `A found item may match your report \"${lostReport.title || "Lost Item"}\". Review it before starting verification.`,
      itemId: lostReport.id,
      lostId: lostReport.id,
      foundId: match.id,
      type: "ai_match_detected",
      read: false,
      createdAt: now,
    }));

  if (newNotifications.length > 0) {
    localStorage.setItem(
      "temuNotifications",
      JSON.stringify([...newNotifications, ...savedNotifs])
    );
    window.dispatchEvent(new Event("temuStorage"));
  }
}

// Recovery Status Bar 
function RecoveryStatus({ steps, currentIndex }) {
  const progressPct = ((currentIndex + 0.5) / steps.length) * 100;

  const getIcon = (key, isCurrent, isDone) => {
    const paths = {
      searching: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
      match_found:
        "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1",
      verifying:
        "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
      resolved: "M5 13l4 4L19 7",
    };

    return (
      <svg
        className={`w-4 h-4 ${isDone || isCurrent ? "text-[#13342E]" : "text-[#4D5E52]"
          }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={isDone || isCurrent ? 2.5 : 2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d={paths[key] || ""}
        />
      </svg>
    );
  };

  return (
    <div className="w-full p-4 md:p-6 bg-[#1A211D] border border-[#3C4A42]/30 rounded-2xl shadow-sm overflow-x-auto">
      <p className="text-[#DDE4DD] text-sm font-semibold mb-6 uppercase tracking-widest">
        Recovery Status
      </p>

      <div className="relative flex items-start justify-between">
        <div
          className="absolute top-3.5 h-0.75 bg-[#2A2F2B] rounded-full"
          style={{
            left: `${100 / steps.length / 2}%`,
            right: `${100 / steps.length / 2}%`,
          }}
        />

        <div
          className="absolute top-3.5 h-0.75 bg-[#9CC88D] rounded-full transition-all duration-700"
          style={{
            left: `${100 / steps.length / 2}%`,
            width: `${Math.max(
              0,
              progressPct - 100 / steps.length / 2
            )}%`,
          }}
        />

        {steps.map((step, i) => {
          const done = i < currentIndex;
          const current = i === currentIndex;

          return (
            <div
              key={step.key}
              className="relative z-10 flex flex-col items-center gap-2 flex-1"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${done
                  ? "bg-[#9CC88D] border-[#9CC88D] shadow-[0_0_12px_rgba(156,200,141,0.4)]"
                  : current
                    ? "bg-[#9CC88D] border-[#9CC88D] shadow-[0_0_18px_rgba(156,200,141,0.5)] scale-110"
                    : "bg-[#1A211D] border-[#3C4A42]"
                  }`}
              >
                {getIcon(step.key, current, done)}
              </div>

              <span
                className={`text-[10px] sm:text-xs font-semibold text-center leading-tight mt-1 text-center leading-tight mt-1 ${current
                  ? "text-[#9CC88D]"
                  : done
                    ? "text-[#6B9A60]"
                    : "text-[#4D5E52]"
                  }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Main Page 
function MyReportDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [activeClaimConversation, setActiveClaimConversation] = useState(null);

  const [userData] = useState(() => {
    const email = localStorage.getItem("currentUserEmail");

    if (email) {
      const saved = localStorage.getItem(`temuProfile_${email}`);

      if (saved) {
        try {
          const p = JSON.parse(saved);

          return {
            name: p.fullName ? p.fullName.split(" ")[0] : email.split("@")[0],
            email,
            avatarUrl: p.avatarUrl || null,
          };
        } catch (_) {
          // Abaikan profile error
        }
      }

      return {
        name: email.split("@")[0],
        email,
        avatarUrl: null,
      };
    }

    return {
      name: "Student",
      email: "",
      avatarUrl: null,
    };
  });

  useEffect(() => {
    const loadAndMatch = async () => {
      try {
        const all = JSON.parse(localStorage.getItem("temuReports") || "[]");
        const found = all.find((r) => r?.id?.toString() === id?.toString());

        setReport(found || null);
        setActiveClaimConversation(
          found ? findLatestConversationForReport(found.id, userData.email) : null
        );

        if (!found) {
          setMatches([]);
          setIsLoading(false);
          return;
        }

        const foundStatus = normalizeStatus(found.status);
        const reportIsResolved = ["resolved", "returned", "closed"].includes(
          foundStatus
        );

        const lostOwnerEmail = getReportOwnerEmail(found);
        const currentEmail = normalizeEmail(userData.email);

        if (
          reportIsResolved ||
          found.type !== "LOST" ||
          !currentEmail ||
          lostOwnerEmail !== currentEmail
        ) {
          setMatches([]);
          setIsLoading(false);
          return;
        }

        const otherType = found.type === "LOST" ? "FOUND" : "LOST";

        const potentialMatches = all.filter((r) => {
          const candidateStatus = normalizeStatus(r.status);

          const validType = r.type === otherType;
          const notSameReport = r.id?.toString() !== found.id?.toString();
          const notResolved = !["resolved", "returned", "closed"].includes(
            candidateStatus
          );
          const notRejected = !isRejectedAiPair(found, r);

          return validType && notSameReport && notResolved && notRejected;
        });

        const reportColor = found.image
          ? await detectDominantColor(found.image)
          : { colorName: "Unknown", hex: "#3C4A42" };

        const reportBrand = detectBrand(`${found.title} ${found.description}`);

        const scoredMatchesPromises = potentialMatches.map(async (m) => {
          let score = 0;

          if (m.category && m.category === found.category) {
            score += 28;
          }

          const candidateColor = m.image
            ? await detectDominantColor(m.image)
            : { colorName: "Unknown", hex: "#3C4A42" };

          const candidateBrand = detectBrand(`${m.title} ${m.description}`);

          const colorMatch =
            reportColor.colorName !== "Unknown" &&
            reportColor.colorName === candidateColor.colorName;

          if (colorMatch) {
            score += 22;
          }

          const brandMatch =
            reportBrand !== "Unknown" && reportBrand === candidateBrand;

          if (brandMatch) {
            score += 15;
          }

          const foundKeywords = safeLower(
            `${found.title} ${found.description}`
          )
            .split(/\s+/)
            .map((word) => word.replace(/[^a-z0-9]/gi, ""))
            .filter((word) => word.length > 2);

          const candidateText = safeLower(`${m.title} ${m.description}`);

          let keywordHits = 0;

          foundKeywords.forEach((kw) => {
            if (candidateText.includes(kw)) {
              keywordHits += 1;
            }
          });

          score += Math.min(
            25,
            (keywordHits / Math.max(1, foundKeywords.length)) * 25
          );

          score += getLocationScore(
            found.location || found.foundLocation,
            m.location || m.foundLocation
          );

          return {
            ...m,
            matchScore: Math.min(100, Math.round(score)),
            detectedColor: candidateColor.colorName,
            detectedColorHex: candidateColor.hex,
            detectedBrand: candidateBrand,
            colorMatch,
            brandMatch,
          };
        });

        const scoredMatches = (await Promise.all(scoredMatchesPromises))
          .filter((m) => m.matchScore >= 25)
          .sort((a, b) => b.matchScore - a.matchScore);

        setMatches(scoredMatches);
        createAiMatchNotifications(found, scoredMatches, userData.email);

      } catch (error) {
        console.error("Failed to load report detail:", error);
        setMatches([]);
      }

      setIsLoading(false);
    };

    loadAndMatch();
  }, [id, userData.email]);

  const isOwner =
    normalizeEmail(report?.reporterEmail) === normalizeEmail(userData.email);

  const isLost = report?.type === "LOST";
  const steps = isLost ? LOST_STEPS : FOUND_STEPS;
  const stepIdx = report ? getStepIndex(report.status, steps) : 0;
  const currentStatus = normalizeStatus(report?.status);
  const isResolved = ["resolved", "returned", "closed"].includes(currentStatus);

  const claimant = getOtherParticipantFromConversation(
    activeClaimConversation,
    userData.email
  );

  const hasActiveClaim =
    !isLost &&
    isOwner &&
    !isResolved &&
    currentStatus === "verifying" &&
    Boolean(activeClaimConversation?.id) &&
    Boolean(claimant.email);

  const handleResolve = () => navigate(`/close-report/${id}`);
  const handleEdit = () => navigate(`/edit-report/${id}`);

  const handleViewMatch = (matchId) =>
    navigate(`/review-match?lostId=${id}&foundId=${matchId}`);

  const handleChat = () => {
    if (!report) return;

    if (!isLost) {
      const conversation =
        activeClaimConversation ||
        findLatestConversationForReport(report.id, userData.email);

      if (!conversation?.id) {
        alert("No active ownership claim found yet.");
        return;
      }

      navigate(`/messages/${conversation.id}`);
      return;
    }

    const otherEmail =
      report.founderEmail || report.potentialFounders?.[0]?.email || "";

    const otherName =
      report.foundByName || report.potentialFounders?.[0]?.name || "Finder";

    if (
      !otherEmail ||
      normalizeEmail(otherEmail) === normalizeEmail(userData.email)
    ) {
      alert("No valid finder found yet.");
      return;
    }

    const conversationId = getOrCreateConversation({
      itemId: report.id,
      itemTitle: report.title,
      itemImage: report.image || null,
      itemType: report.type,
      currentUserEmail: userData.email,
      currentUserName: userData.name,
      otherEmail,
      otherName,
    });

    if (!conversationId) {
      alert("Failed to open chat room. Please try again.");
      return;
    }

    if (["match_found", "searching"].includes(currentStatus)) {
      setItemStatus(id, "verifying");
      setReport((prev) => ({
        ...prev,
        status: "verifying",
      }));
    }

    navigate(`/messages/${conversationId}`);
  };

  const handleContinueFoundClaimChat = () => {
    const conversation =
      activeClaimConversation ||
      findLatestConversationForReport(report?.id, userData.email);

    if (!conversation?.id) {
      alert("No active ownership claim found yet.");
      return;
    }

    navigate(`/messages/${conversation.id}`);
  };

  const handleRejectFoundClaim = () => {
    if (!report) return;

    const conversation =
      activeClaimConversation ||
      findLatestConversationForReport(report.id, userData.email);

    if (!conversation?.id) {
      alert("No active ownership claim found yet.");
      return;
    }

    const rejectedClaimant = getOtherParticipantFromConversation(
      conversation,
      userData.email
    );

    if (!rejectedClaimant.email) {
      alert("Claimant data not found.");
      return;
    }

    const confirmed = window.confirm(
      `Reject ${rejectedClaimant.name}'s claim? The item will return to searching and this chat will be closed.`
    );

    if (!confirmed) return;

    const success = rejectFoundClaim({
      itemId: report.id,
      rejectedClaimantEmail: rejectedClaimant.email,
      rejectedClaimantName: rejectedClaimant.name,
      rejectedByEmail: userData.email,
      rejectedByName: userData.name,
      reason: "Your claim was rejected because the item details did not match.",
      conversationId: conversation.id,
    });

    if (!success) {
      alert("Failed to reject claim. Please try again.");
      return;
    }

    setReport((prev) => ({
      ...prev,
      status: "searching",
    }));

    setActiveClaimConversation(null);
  };

  const infoItems = [
    {
      label: isLost ? "LOCATION LOST" : "LOCATION FOUND",
      value: report?.foundLocation || report?.location || "—",
    },
    {
      label: isLost ? "DATE LOST" : "DATE FOUND",
      value: report?.dateText || "—",
    },
    {
      label: "CATEGORY",
      value: report?.category || "Others",
    },
  ];

  if (isResolved) {
    infoItems.push({
      label: "RESOLVED ON",
      value: formatResolvedDate(report),
    });
  }

  if (isLoading) {
    return (
      <div className="flex h-[100dvh] bg-[#0E1511] items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#9CC88D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col h-[100dvh] bg-[#0E1511] items-center justify-center gap-4 text-white">
        <h2 className="text-2xl font-bold text-[#DDE4DD]">
          Report not found
        </h2>

        <Link
          to="/my-reports"
          className="px-6 py-2 bg-[#164A41] rounded-lg text-[#9CC88D] font-semibold hover:bg-[#1a5a4e] transition-colors"
        >
          Back to My Reports
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] min-h-0 bg-[#0E1511] text-white overflow-hidden selection:bg-[#164A41]">
      <Sidebar activePage="my-reports" />

      <div className="flex-1 min-w-0 min-h-0 flex flex-col h-full overflow-hidden">
        <TopBar />

        <main className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:p-8 md:pb-8">
          <div className="w-full max-w-275 mx-auto flex flex-col gap-6">
            {/* Breadcrumb + actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <button
                onClick={() => navigate("/my-reports")}
                className="text-[#86948A] hover:text-[#DDE4DD] transition-colors flex items-center gap-1.5 font-semibold text-sm"
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
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back
              </button>

              {isOwner && !isResolved && (
                <div className="grid grid-cols-1 sm:flex sm:items-center gap-3 w-full sm:w-auto shrink-0">
                  <button
                    onClick={handleEdit}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl border border-[#3C4A42] text-[#A1A1AA] text-sm font-semibold hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
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
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit Report
                  </button>

                  <button
                    onClick={handleResolve}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#164A41] border border-[#9CC88D]/30 text-[#9CC88D] text-sm font-bold hover:bg-[#13342E] transition-colors flex items-center justify-center gap-2"
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
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Mark as Resolved
                  </button>
                </div>
              )}

              {isResolved && (
                <span className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-bold flex items-center gap-2">
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Resolved
                </span>
              )}
            </div>

            <RecoveryStatus steps={steps} currentIndex={stepIdx} />

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
              {/* LEFT */}
              <div className="bg-[#1A211D] border border-[#3C4A42]/30 rounded-2xl overflow-hidden shadow-sm">
                <div className="relative h-72 sm:h-96 overflow-hidden">
                  <img
                    src={report.image}
                    alt={report.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src =
                        "https://placehold.co/800x400/1A211D/4D774E?text=No+Image";
                    }}
                  />

                  <div className="absolute inset-0 bg-linear-to-t from-[#1A211D] via-transparent to-transparent" />

                  <div
                    className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide backdrop-blur-sm border flex items-center gap-1.5 ${isResolved
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                      : currentStatus.includes("match")
                        ? "bg-amber-500/30 border-amber-500/40 text-amber-300"
                        : currentStatus === "verifying"
                          ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
                          : "bg-[#1A211D]/80 border-[#3C4A42] text-[#9CC88D]"
                      }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isResolved
                        ? "bg-emerald-300"
                        : currentStatus.includes("match")
                          ? "bg-amber-300"
                          : currentStatus === "verifying"
                            ? "bg-blue-300"
                            : "bg-[#9CC88D]"
                        }`}
                    />
                    {steps[stepIdx]?.label}
                  </div>
                </div>

                <div className="p-6 flex flex-col gap-4">
                  <div>
                    <h2 className="text-[#DDE4DD] text-2xl font-bold mb-1">
                      {report.title}
                    </h2>
                  </div>

                  {isLost && (
                    <p className="text-[#BBCABF] text-sm leading-relaxed">
                      {report.description || "No description provided."}
                    </p>
                  )}

                  <div
                    className={`grid grid-cols-2 ${isResolved ? "sm:grid-cols-4" : "sm:grid-cols-3"
                      } gap-4 pt-4 border-t border-[#3C4A42]/30`}
                  >
                    {infoItems.map((m) => (
                      <div key={m.label}>
                        <p className="text-[#4D5E52] text-[10px] font-bold uppercase tracking-widest mb-1">
                          {m.label}
                        </p>
                        <p className="text-[#DDE4DD] text-sm font-semibold">
                          {m.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Found By */}
                  {isLost &&
                    (report.potentialFounders?.length > 0 ||
                      currentStatus === "match_found" ||
                      currentStatus === "verifying") && (
                      <div className="mt-6 pt-6 border-t border-[#3C4A42]/30 animate-[fadeIn_0.5s_ease-out]">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-[#86948A] text-xs font-semibold uppercase tracking-wide">
                            Found by
                          </h4>

                          {report.potentialFounders?.length > 1 && (
                            <span className="px-2 py-0.5 bg-[#F1B24A]/20 text-[#F1B24A] text-[10px] font-bold rounded uppercase">
                              {report.potentialFounders.length} Potential
                              Matches
                            </span>
                          )}
                        </div>

                        {report.potentialFounders?.length > 1 ? (
                          <div className="flex flex-col gap-3">
                            {report.potentialFounders.map((founder, idx) => (
                              <div
                                key={idx}
                                className="bg-[#0E1511] border border-[#3C4A42] rounded-xl p-3 flex items-center justify-between"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-zinc-800 border border-[#27272A] flex items-center justify-center text-xs font-bold text-gray-400">
                                    {founder.name
                                      ?.substring(0, 2)
                                      .toUpperCase() || "FD"}
                                  </div>

                                  <div>
                                    <span className="text-[#DDE4DD] text-sm font-medium">
                                      {founder.name || "Finder"}
                                    </span>
                                    <span className="block text-[#86948A] text-[10px] font-semibold">
                                      (Student)
                                    </span>
                                  </div>
                                </div>

                                <button
                                  onClick={() => {
                                    const convId = getOrCreateConversation({
                                      itemId: report.id,
                                      itemTitle: report.title,
                                      itemImage: report.image || null,
                                      itemType: report.type,
                                      currentUserEmail: userData.email,
                                      currentUserName: userData.name,
                                      otherEmail: founder.email,
                                      otherName: founder.name,
                                    });

                                    if (!convId) {
                                      alert(
                                        "Failed to open chat room. Please try again."
                                      );
                                      return;
                                    }

                                    if (
                                      ["match_found", "searching"].includes(
                                        currentStatus
                                      )
                                    ) {
                                      setItemStatus(id, "verifying");
                                      setReport((prev) => ({
                                        ...prev,
                                        status: "verifying",
                                      }));
                                    }

                                    navigate(`/messages/${convId}`);
                                  }}
                                  className="px-3 py-1.5 bg-[#9CC88D]/20 text-[#9CC88D] hover:bg-[#9CC88D] hover:text-[#13342E] rounded-lg text-xs font-bold transition-all"
                                >
                                  Chat
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-[#0E1511] border border-[#3C4A42] rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-zinc-800 border border-[#27272A] flex items-center justify-center text-lg font-bold text-gray-400">
                                {(report.foundByName ||
                                  report.potentialFounders?.[0]?.name)
                                  ?.substring(0, 2)
                                  .toUpperCase() || "FB"}
                              </div>

                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[#DDE4DD] text-base font-medium">
                                    {report.foundByName ||
                                      report.potentialFounders?.[0]?.name ||
                                      "Unknown Finder"}
                                  </span>

                                  <svg
                                    className="w-4 h-4 text-white"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>

                                <span className="text-[#86948A] text-xs font-semibold">
                                  (Student)
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={handleChat}
                              className="px-4 py-2 bg-[#9CC88D] text-[#13342E] rounded-lg text-sm font-bold hover:bg-[#8bb47d] transition-colors"
                            >
                              Chat Finder
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </div>

              {/* RIGHT */}
              <div className="flex flex-col gap-5">
                {isLost && !isResolved && (
                  <div className="bg-[#1A211D] border border-[#3C4A42]/30 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
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
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                        <span className="text-[#DDE4DD] text-base font-semibold">
                          AI Matches
                        </span>
                      </div>

                      {matches.length > 0 && (
                        <span className="px-2.5 py-0.5 bg-[#9CC88D]/10 border border-[#9CC88D]/20 rounded-full text-[#9CC88D] text-xs font-bold">
                          {matches.length} Found
                        </span>
                      )}
                    </div>

                    {matches.length > 0 ? (
                      <div className="flex flex-col gap-3">
                        {matches.slice(0, 3).map((match) => (
                          <div
                            key={match.id}
                            className="bg-[#0E1511] border border-[#3C4A42]/40 rounded-xl p-4"
                          >
                            <div className="flex items-start gap-4">
                              <div className="w-20 h-16 rounded-lg overflow-hidden bg-[#242C27] shrink-0 border border-[#3C4A42]/30 flex items-center justify-center">
                                {match.image ? (
                                  <img
                                    src={match.image}
                                    alt={match.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <svg
                                    className="w-8 h-8 text-[#9CC88D] opacity-80"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={1.5}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                                    />
                                  </svg>
                                )}
                              </div>

                              <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                                <div className="flex items-start justify-between">
                                  <p className="text-[#DDE4DD] text-sm font-semibold truncate">
                                    {match.title}
                                  </p>

                                  <span className="px-2 py-0.5 bg-[#9CC88D] text-[#13342E] text-[10px] font-bold rounded shrink-0 ml-2">
                                    {match.matchScore}% Match
                                  </span>
                                </div>

                                <div className="flex items-center gap-3 mt-0.5">
                                  {match.detectedColor &&
                                    match.detectedColor !== "Unknown" && (
                                      <span className="flex items-center gap-1.5 text-[10px] text-[#86948A]">
                                        <span
                                          className="w-3 h-3 rounded-full border border-[#3C4A42] shrink-0"
                                          style={{
                                            backgroundColor:
                                              match.detectedColorHex,
                                          }}
                                        />
                                        {match.detectedColor}
                                        {match.colorMatch && (
                                          <svg
                                            className="w-3 h-3 text-[#9CC88D]"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2.5}
                                              d="M5 13l4 4L19 7"
                                            />
                                          </svg>
                                        )}
                                      </span>
                                    )}

                                  {match.detectedBrand &&
                                    match.detectedBrand !== "Unknown" && (
                                      <span className="flex items-center gap-1 text-[10px] text-[#86948A]">
                                        {match.detectedBrand}
                                        {match.brandMatch && (
                                          <svg
                                            className="w-3 h-3 text-[#9CC88D]"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2.5}
                                              d="M5 13l4 4L19 7"
                                            />
                                          </svg>
                                        )}
                                      </span>
                                    )}
                                </div>

                                <p className="text-[#86948A] text-xs truncate">
                                  {match.location || "On Campus"}
                                </p>

                                <button
                                  onClick={() => handleViewMatch(match.id)}
                                  className="mt-3 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-[#9CC88D] text-xs font-semibold rounded-[9999px] w-fit"
                                >
                                  Review Match →
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-12 h-12 rounded-full bg-[#0E1511] border border-[#3C4A42] flex items-center justify-center mb-3">
                          <svg
                            className="w-6 h-6 text-[#4D5E52]"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                        </div>

                        <p className="text-[#4D5E52] text-sm">
                          No strong match found yet
                        </p>

                        <p className="text-[#3C4A42] text-xs mt-1">
                          You will be notified when someone reports a matching
                          item
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {isLost && (
                  <div className="bg-[#1A211D] border border-[#3C4A42]/30 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-[#DDE4DD] text-base font-semibold mb-5">
                      Recovery Guide
                    </h3>

                    <div className="flex flex-col gap-5 relative">
                      <div className="absolute left-2.75 top-6 bottom-8 w-0.5 bg-[#27272A]" />

                      {[
                        {
                          n: 1,
                          title: "Review AI Matches",
                          desc: "Check the AI Matcher panel frequently for high-confidence similarities.",
                          done: stepIdx >= 1,
                        },
                        {
                          n: 2,
                          title: "Verify Identity",
                          desc: "Confirm specific item details before accepting the match.",
                          done: stepIdx >= 2,
                        },
                        {
                          n: 3,
                          title: "Arrange Handover",
                          desc: "Communicate securely via the internal messaging system to meet at a safe campus location.",
                          done: stepIdx >= 3,
                        },
                      ].map((s) => (
                        <div
                          key={s.n}
                          className="flex items-start gap-4 relative z-10"
                        >
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${s.done
                              ? "bg-[#9CC88D] text-[#13342E]"
                              : "bg-[#0E1511] border border-[#3C4A42] text-[#4D5E52]"
                              }`}
                          >
                            {s.done ? "✓" : s.n}
                          </div>

                          <div>
                            <p
                              className={`text-sm font-semibold mb-0.5 ${s.done ? "text-[#9CC88D]" : "text-[#DDE4DD]"
                                }`}
                            >
                              {s.title}
                            </p>

                            <p className="text-[#86948A] text-xs leading-relaxed">
                              {s.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {hasActiveClaim && (
                  <div className="bg-[#1A211D] border border-blue-500/20 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-start gap-3 mb-5">
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
                        <h3 className="text-[#DDE4DD] text-base font-semibold">
                          Ownership Claim
                        </h3>

                        <p className="text-[#86948A] text-xs leading-relaxed mt-1">
                          {claimant.name} is claiming this found item. Verify
                          specific details before returning it.
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#0E1511] border border-[#3C4A42]/40 rounded-xl p-4 mb-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 border border-[#27272A] flex items-center justify-center text-xs font-bold text-gray-400 shrink-0">
                        {claimant.name?.substring(0, 2).toUpperCase() || "CL"}
                      </div>

                      <div className="min-w-0">
                        <p className="text-[#DDE4DD] text-sm font-semibold truncate">
                          {claimant.name}
                        </p>

                        <p className="text-[#86948A] text-xs truncate">
                          {claimant.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={handleContinueFoundClaimChat}
                        className="w-full px-4 py-2.5 bg-[#164A41] border border-[#9CC88D]/30 text-[#9CC88D] rounded-xl text-sm font-bold hover:bg-[#1a5a4e] transition-colors flex items-center justify-center gap-2"
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
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                        Continue Chat
                      </button>

                      <button
                        onClick={handleRejectFoundClaim}
                        className="w-full px-4 py-2.5 bg-[#C62828]/90 border border-[#FFB4AB]/20 text-white rounded-xl text-sm font-bold hover:bg-[#B71C1C] transition-colors flex items-center justify-center gap-2"
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
                        Reject Claim
                      </button>
                    </div>
                  </div>
                )}

                {!isLost && (
                  <div className="bg-[#1A211D] border border-[#3C4A42]/30 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-[#DDE4DD] text-base font-semibold mb-5">
                      Current Storage
                    </h3>

                    <div className="flex flex-col gap-5">
                      {[
                        {
                          icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
                          label: "Location",
                          value:
                            report.storageLocation || "Lobby Information Desk",
                        },
                        {
                          icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
                          label: "Building",
                          value:
                            report.storageBuilding ||
                            report.location ||
                            "Campus Building",
                        },
                        {
                          icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
                          label: "Person in Charge",
                          value:
                            report.storageContact || "Security Officer on Duty",
                        },
                      ].map((item) => (
                        <div key={item.label} className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#9CC88D]/10 border border-[#9CC88D]/20 flex items-center justify-center shrink-0">
                            <svg
                              className="w-4 h-4 text-[#9CC88D]"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              {item.icon.split(" M").map((d, i) => (
                                <path
                                  key={i}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d={i === 0 ? d : "M" + d}
                                />
                              ))}
                            </svg>
                          </div>

                          <div>
                            <p className="text-[#DDE4DD] text-sm font-semibold">
                              {item.label}
                            </p>

                            <p className="text-[#86948A] text-xs mt-0.5">
                              {item.value}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {report.description && (
                      <div className="mt-5 p-4 bg-[#9CC88D]/10 rounded-xl border border-[#9CC88D]/20 border-l-4 border-l-[#9CC88D]">
                        <p className="text-[#4D5E52] text-[10px] font-bold uppercase tracking-widest mb-1">
                          Internal Note
                        </p>

                        <p className="text-[#BBCABF] text-sm leading-relaxed">
                          {report.description}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="h-2 md:h-8 w-full shrink-0" />
          </div>
        </main>
      </div>
    </div>
  );
}

export default MyReportDetail;