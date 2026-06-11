import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { setItemStatus, resetItemToSearching } from "../utils/statusUtils";
import { detectDominantColor, detectBrand } from "../utils/colorDetector";
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
        console.error(`Failed to read ${key}`, error);
        return [];
    }
}

function writeStorageArray(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event("temuStorage"));
}

function getCurrentUser() {
    const email = normalizeEmail(localStorage.getItem("currentUserEmail"));

    if (!email) {
        return {
            name: "Student",
            email: "",
        };
    }

    const savedProfile = localStorage.getItem(`temuProfile_${email}`);

    if (savedProfile) {
        try {
            const parsed = JSON.parse(savedProfile);

            return {
                name: parsed.fullName ? parsed.fullName.split(" ")[0] : email.split("@")[0],
                email,
            };
        } catch (error) {
            console.error("Failed to read profile", error);
        }
    }

    return {
        name: email.split("@")[0],
        email,
    };
}

function safeText(value) {
    return (value || "").toString();
}

function normalizeText(value) {
    return safeText(value)
        .toLowerCase()
        .replace(/[^a-z0-9\s]/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function getLostReporterEmail(report) {
    return normalizeEmail(
        report?.reporterEmail ||
        report?.ownerEmail ||
        report?.lostByEmail ||
        report?.createdByEmail ||
        ""
    );
}

function isLostReportOwner(report, userEmail) {
    return getLostReporterEmail(report) === normalizeEmail(userEmail);
}

function getReportDateText(report, prefix) {
    if (report?.dateText) return `${prefix} ${report.dateText}`;

    const rawDate = report?.date || report?.createdAt || report?.updatedAt;

    if (!rawDate) return `${prefix} Unknown`;

    const parsedDate = new Date(rawDate);

    if (Number.isNaN(parsedDate.getTime())) return `${prefix} Unknown`;

    return `${prefix} ${parsedDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    })}`;
}

function getRawDate(report) {
    const rawDate = report?.date || report?.createdAt || report?.updatedAt;

    if (!rawDate) return null;

    const parsedDate = new Date(rawDate);

    if (Number.isNaN(parsedDate.getTime())) return null;

    return parsedDate;
}

function getDaysBetween(startDate, endDate) {
    if (!startDate || !endDate) return null;

    const diff = endDate.getTime() - startDate.getTime();

    return Math.floor(diff / 86400000);
}

function getTimeCorrelationScore(lostReport, foundReport) {
    const lostDate = getRawDate(lostReport);
    const foundDate = getRawDate(foundReport);
    const days = getDaysBetween(lostDate, foundDate);

    if (days === null) {
        return {
            score: 50,
            label: "Date data is incomplete, so time correlation is moderate.",
        };
    }

    if (days < 0) {
        return {
            score: 20,
            label:
                "Found date appears earlier than lost date, so this match needs manual checking.",
        };
    }

    if (days <= 1) {
        return {
            score: 95,
            label: "Found very close to the reported lost date.",
        };
    }

    if (days <= 3) {
        return {
            score: 85,
            label: "Found within a few days of the lost report.",
        };
    }

    if (days <= 7) {
        return {
            score: 70,
            label: "Found within the same week.",
        };
    }

    if (days <= 14) {
        return {
            score: 55,
            label: "Found within two weeks, still possible but less direct.",
        };
    }

    return {
        score: 35,
        label: "The date gap is quite far, so verification should be stricter.",
    };
}

const USU_LOCATION_GROUPS = [
    {
        key: "fasilkom-ti",
        label: "Fasilkom-TI Area",
        keywords: [
            "fasilkom",
            "fasilkom-ti",
            "ilmu komputer",
            "teknologi informasi",
            "fikom",
            "fasilkomti",
        ],
        nearby: ["fmipa", "perpustakaan"],
    },
    {
        key: "perpustakaan",
        label: "USU Library Area",
        keywords: ["perpustakaan", "library", "perpustakaan pusat"],
        nearby: ["fasilkom-ti", "rektorat", "fmipa"],
    },
    {
        key: "rektorat",
        label: "Rectorate Area",
        keywords: ["rektorat", "biro pusat", "administrasi", "bpa"],
        nearby: ["perpustakaan", "auditorium"],
    },
    {
        key: "fmipa",
        label: "FMIPA Area",
        keywords: ["fmipa", "matematika", "ilmu pengetahuan alam", "mipa"],
        nearby: ["fasilkom-ti", "perpustakaan"],
    },
    {
        key: "fakultas-hukum",
        label: "Faculty of Law Area",
        keywords: ["fakultas hukum", "hukum"],
        nearby: ["fisip"],
    },
    {
        key: "fisip",
        label: "FISIP Area",
        keywords: ["fisip", "ilmu sosial", "ilmu politik"],
        nearby: ["fakultas-hukum"],
    },
    {
        key: "teknik",
        label: "Faculty of Engineering Area",
        keywords: ["fakultas teknik", "teknik"],
        nearby: ["vokasi"],
    },
    {
        key: "ekonomi",
        label: "Faculty of Economics Area",
        keywords: ["fakultas ekonomi", "ekonomi", "feb"],
        nearby: ["vokasi"],
    },
    {
        key: "kedokteran",
        label: "Medical Faculty Area",
        keywords: ["kedokteran", "fakultas kedokteran", "fk"],
        nearby: ["rumah-sakit"],
    },
    {
        key: "rumah-sakit",
        label: "USU Hospital Area",
        keywords: ["rumah sakit", "rs usu", "hospital"],
        nearby: ["kedokteran"],
    },
    {
        key: "farmasi",
        label: "Pharmacy Faculty Area",
        keywords: ["farmasi", "fakultas farmasi"],
        nearby: ["kedokteran"],
    },
    {
        key: "psikologi",
        label: "Psychology Faculty Area",
        keywords: ["psikologi", "fakultas psikologi"],
        nearby: ["fisip"],
    },
    {
        key: "vokasi",
        label: "Vocational Faculty Area",
        keywords: ["vokasi", "fakultas vokasi"],
        nearby: ["teknik", "ekonomi"],
    },
    {
        key: "auditorium",
        label: "Auditorium Area",
        keywords: ["auditorium"],
        nearby: ["rektorat"],
    },
    {
        key: "gelanggang",
        label: "Student Center Area",
        keywords: ["gelanggang", "student center", "pusat kegiatan mahasiswa"],
        nearby: ["auditorium"],
    },
    {
        key: "security",
        label: "Campus Security Area",
        keywords: ["satpam", "security", "keamanan", "pos", "pintu"],
        nearby: ["rektorat", "perpustakaan"],
    },
];

function getLocationGroup(location) {
    const text = normalizeText(location);

    if (!text) {
        return {
            key: "unknown",
            label: "Unknown Area",
        };
    }

    const matchedGroup = USU_LOCATION_GROUPS.find((group) =>
        group.keywords.some((keyword) => text.includes(keyword))
    );

    if (matchedGroup) {
        return matchedGroup;
    }

    if (text.includes("usu")) {
        return {
            key: "usu-general",
            label: "USU Campus Area",
            nearby: [],
            keywords: ["usu"],
        };
    }

    return {
        key: "unknown",
        label: "Unknown Area",
    };
}

function getLocationProximityScore(lostLocation, foundLocation) {
    const lostGroup = getLocationGroup(lostLocation);
    const foundGroup = getLocationGroup(foundLocation);

    const lostText = normalizeText(lostLocation);
    const foundText = normalizeText(foundLocation);

    if (!lostText || !foundText) {
        return {
            score: 45,
            label: "Location data is incomplete.",
            lostArea: lostGroup.label,
            foundArea: foundGroup.label,
        };
    }

    if (lostText === foundText) {
        return {
            score: 98,
            label: "Both reports mention the same location.",
            lostArea: lostGroup.label,
            foundArea: foundGroup.label,
        };
    }

    if (lostGroup.key !== "unknown" && lostGroup.key === foundGroup.key) {
        return {
            score: 90,
            label: "Both reports are in the same USU area.",
            lostArea: lostGroup.label,
            foundArea: foundGroup.label,
        };
    }

    if (lostGroup.nearby?.includes(foundGroup.key)) {
        return {
            score: 75,
            label: "The locations are in nearby USU areas.",
            lostArea: lostGroup.label,
            foundArea: foundGroup.label,
        };
    }

    if (lostText.includes("usu") && foundText.includes("usu")) {
        return {
            score: 58,
            label: "Both locations are inside USU, but not in the same close area.",
            lostArea: lostGroup.label,
            foundArea: foundGroup.label,
        };
    }

    return {
        score: 35,
        label: "Location similarity is weak and needs manual confirmation.",
        lostArea: lostGroup.label,
        foundArea: foundGroup.label,
    };
}

function getKeywordScore(lostReport, foundReport) {
    const lostWords = normalizeText(
        `${lostReport?.title || ""} ${lostReport?.description || ""}`
    )
        .split(" ")
        .filter((word) => word.length > 2);

    const foundText = normalizeText(
        `${foundReport?.title || ""} ${foundReport?.description || ""}`
    );

    if (lostWords.length === 0 || !foundText) {
        return {
            score: 35,
            hits: [],
        };
    }

    const uniqueLostWords = Array.from(new Set(lostWords));
    const hits = uniqueLostWords.filter((word) => foundText.includes(word));

    const score = Math.min(
        95,
        Math.round((hits.length / Math.max(1, uniqueLostWords.length)) * 100)
    );

    return {
        score,
        hits,
    };
}

function getOverallConfidence({
    categoryMatch,
    colorMatch,
    brandMatch,
    keywordScore,
    locationScore,
    timeScore,
}) {
    const score =
        (categoryMatch ? 18 : 0) +
        (colorMatch ? 17 : 5) +
        (brandMatch ? 12 : 0) +
        keywordScore * 0.2 +
        locationScore * 0.2 +
        timeScore * 0.13;

    return Math.max(12, Math.min(98, Math.round(score)));
}

function getConfidenceLabel(score) {
    if (score >= 85) return "Very Strong Match";
    if (score >= 70) return "Strong Match";
    if (score >= 55) return "Possible Match";
    if (score >= 40) return "Weak Match";
    return "Low Confidence";
}

function getScoreColor(score) {
    if (score >= 75) return "text-[#9CC88D]";
    if (score >= 55) return "text-[#F1B24A]";
    return "text-[#FFB4AB]";
}

function getScoreBarColor(score) {
    if (score >= 75) return "bg-[#9CC88D]";
    if (score >= 55) return "bg-[#F1B24A]";
    return "bg-[#C62828]";
}

function createNotification({
    recipientEmail,
    currentUserEmail,
    currentUserName,
    itemId,
    itemTitle,
    conversationId,
    type,
}) {
    const normalizedRecipient = normalizeEmail(recipientEmail);
    const normalizedCurrent = normalizeEmail(currentUserEmail);

    if (!normalizedRecipient || normalizedRecipient === normalizedCurrent) return;

    const notifications = readStorageArray("temuNotifications");
    const now = new Date().toISOString();

    const alreadyExists = notifications.some(
        (notification) =>
            normalizeEmail(notification.userId) === normalizedRecipient &&
            notification.itemId?.toString() === itemId?.toString() &&
            notification.conversationId === conversationId &&
            notification.type === type &&
            !notification.read
    );

    if (alreadyExists) return;

    const message =
        type === "match_rejected"
            ? `${currentUserName} rejected the suggested match for "${itemTitle}".`
            : `${currentUserName} wants to verify ownership for "${itemTitle}".`;

    const newNotification = {
        id: `notif_${type}_${itemId}_${normalizedRecipient}_${Date.now()}`,
        userId: normalizedRecipient,
        title:
            type === "match_rejected"
                ? "Match Rejected"
                : "Ownership Verification Started",
        message,
        itemId,
        conversationId: conversationId || null,
        type,
        read: false,
        createdAt: now,
    };

    writeStorageArray("temuNotifications", [newNotification, ...notifications]);
}

function appendSystemEventToConversation(conversationId, event) {
    if (!conversationId) return;

    const conversations = readConversations();
    const index = conversations.findIndex(
        (conversation) => conversation.id === conversationId
    );

    if (index === -1) return;

    const messages = Array.isArray(conversations[index].messages)
        ? conversations[index].messages
        : [];

    const alreadyExists = messages.some(
        (message) =>
            message.type === "system" &&
            message.eventType === event.eventType &&
            message.itemId?.toString() === event.itemId?.toString()
    );

    if (alreadyExists) return;

    const now = new Date().toISOString();

    const systemEvent = {
        id: `sys_${event.eventType}_${event.itemId}_${Date.now()}`,
        type: "system",
        eventType: event.eventType,
        itemId: event.itemId,
        label: event.label,
        sentAt: now,
    };

    conversations[index] = {
        ...conversations[index],
        status: "open",
        messages: [...messages, systemEvent],
        lastMessage: event.label,
        lastMessageAt: now,
        lastMessageSender: "system",
        readBy: [],
        updatedAt: now,
    };

    writeConversations(conversations);
}

function updateReportsAfterConfirmedMatch({
    lostId,
    foundId,
    lost,
    found,
    finderEmail,
    finderName,
    userData,
}) {
    const now = new Date().toISOString();
    const allReports = readStorageArray("temuReports");

    const updatedReports = allReports.map((report) => {
        if (report.id?.toString() === lostId?.toString()) {
            const existingPotentialFounders = Array.isArray(report.potentialFounders)
                ? report.potentialFounders
                : [];

            const alreadyStored = existingPotentialFounders.some(
                (person) =>
                    normalizeEmail(person.email) === normalizeEmail(finderEmail) ||
                    person.foundItemId?.toString() === foundId?.toString()
            );

            const founderPayload = {
                email: finderEmail,
                name: finderName,
                foundItemId: found.id,
                foundLocation:
                    found.foundLocation || found.location || found.storageLocation || "",
                storageLocation:
                    found.storageLocation || found.foundLocation || found.location || "",
                notes: found.description || "",
                status: "verifying",
                addedAt: now,
            };

            const nextPotentialFounders = alreadyStored
                ? existingPotentialFounders.map((person) => {
                    const samePerson =
                        normalizeEmail(person.email) === normalizeEmail(finderEmail) ||
                        person.foundItemId?.toString() === foundId?.toString();

                    return samePerson
                        ? {
                            ...person,
                            ...founderPayload,
                        }
                        : person;
                })
                : [...existingPotentialFounders, founderPayload];

            return {
                ...report,
                status: "verifying",
                updatedAt: now,
                founderEmail: finderEmail,
                foundByEmail: finderEmail,
                founderName: finderName,
                foundByName: finderName,
                foundLocation:
                    found.foundLocation ||
                    found.location ||
                    found.storageLocation ||
                    report.foundLocation ||
                    "",
                storageLocation:
                    found.storageLocation ||
                    found.foundLocation ||
                    found.location ||
                    report.storageLocation ||
                    "",
                matchedFoundItemId: found.id,
                potentialFounders: nextPotentialFounders,
            };
        }

        if (report.id?.toString() === foundId?.toString()) {
            return {
                ...report,
                status: "verifying",
                updatedAt: now,
                ownerEmail: lost.reporterEmail || userData.email,
                ownerName: lost.reporterName || userData.name,
                matchedLostItemId: lost.id,
            };
        }

        return report;
    });

    writeStorageArray("temuReports", updatedReports);
}

function InfoRow({ label, value, hex, match, warning, full, colorLabel }) {
    return (
        <div
            className={`flex justify-between gap-4 py-3 border-b border-[#3C4A42]/30 ${full ? "items-start" : "items-center"
                }`}
        >
            <div className="flex items-center gap-2 text-[#86948A] text-sm">
                <span>{label}</span>

                {match && (
                    <svg
                        className="w-4 h-4 text-[#9CC88D] shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                )}

                {warning && (
                    <svg
                        className="w-4 h-4 text-[#F1B24A] shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                )}
            </div>

            <span
                className={`text-[#DDE4DD] text-sm text-right capitalize flex items-center justify-end gap-2 ${full ? "max-w-55 line-clamp-3" : "max-w-45 wrap-break-words whitespace-normal"
                    }`}
                title={value}
            >
                {hex && (
                    <span className="inline-flex items-center gap-1.5 shrink-0">
                        <span
                            className="w-4 h-4 rounded-full border border-[#BBCABF]/50"
                            style={{ backgroundColor: hex }}
                            title={colorLabel || value}
                        />
                    </span>
                )}

                {value || "Unknown"}
            </span>
        </div>
    );
}

function AnalysisRow({ label, value, note }) {
    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2 text-sm text-[#DDE4DD]">
                    <span className={`w-1.5 h-1.5 rounded-full ${getScoreBarColor(value)}`} />
                    {label}
                </div>

                <span className={`text-sm font-bold ${getScoreColor(value)}`}>
                    {value}% Match
                </span>
            </div>

            <div className="w-full bg-[#0E1511] rounded-full h-1.5 overflow-hidden">
                <div
                    className={`h-1.5 rounded-full ${getScoreBarColor(value)}`}
                    style={{ width: `${value}%` }}
                />
            </div>

            {note && <p className="text-[#86948A] text-xs mt-2 leading-relaxed">{note}</p>}
        </div>
    );
}

function AccessDenied({ onBack }) {
    return (
        <div className="flex w-full min-h-screen bg-[#0E1511] text-[#DDE4DD] overflow-hidden">
            <Sidebar activePage="my-reports" />

            <main className="flex-1 flex flex-col h-screen overflow-y-auto">
                <TopBar />

                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="w-full max-w-md bg-[#1A211D] border border-[#3C4A42]/30 rounded-2xl p-8 text-center shadow-sm">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#C62828]/10 border border-[#C62828]/20 flex items-center justify-center mb-5">
                            <svg
                                className="w-8 h-8 text-[#FFB4AB]"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 9v3.75m0 3.75h.008M4.5 19.5h15a1.5 1.5 0 001.3-2.25l-7.5-13a1.5 1.5 0 00-2.6 0l-7.5 13a1.5 1.5 0 001.3 2.25z"
                                />
                            </svg>
                        </div>

                        <h2 className="text-[#DDE4DD] text-2xl font-bold">Access Denied</h2>

                        <p className="text-[#86948A] text-sm mt-3 leading-relaxed">
                            Match review can only be opened by the owner of the lost item
                            report. This keeps the verification process safer and prevents the
                            finder from changing the match decision.
                        </p>

                        <button
                            onClick={onBack}
                            className="mt-6 px-6 py-3 rounded-full bg-[#164A41] border border-[#9CC88D]/30 text-[#9CC88D] hover:bg-[#13342E] font-bold text-sm transition-colors"
                        >
                            Back to My Reports
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}

function ReviewMatch() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const lostId = searchParams.get("lostId");
    const foundId = searchParams.get("foundId");

    const [matchData, setMatchData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAccessDenied, setIsAccessDenied] = useState(false);

    const [userData] = useState(() => getCurrentUser());

    useEffect(() => {
        const loadData = async () => {
            try {
                const allReports = readStorageArray("temuReports");

                const lost = allReports.find(
                    (report) => report.id?.toString() === lostId?.toString()
                );

                const found = allReports.find(
                    (report) => report.id?.toString() === foundId?.toString()
                );

                if (!lost || !found) {
                    setIsLoading(false);
                    return;
                }

                const lostType = (lost.type || "").toUpperCase();
                const foundType = (found.type || "").toUpperCase();

                if (lostType !== "LOST" || foundType !== "FOUND") {
                    setIsLoading(false);
                    return;
                }

                if (!userData.email || !isLostReportOwner(lost, userData.email)) {
                    alert("Access Denied: Only the reporter of the lost item can review this match.");
                    navigate("/my-reports");
                    return;
                }

                const [lostColor, foundColor] = await Promise.all([
                    detectDominantColor(lost.image),
                    detectDominantColor(found.image),
                ]);

                const lostBrand = detectBrand(
                    `${safeText(lost.title)} ${safeText(lost.description)}`
                );

                const foundBrand = detectBrand(
                    `${safeText(found.title)} ${safeText(found.description)}`
                );

                const categoryMatch = lost.category === found.category;

                const colorMatch =
                    lostColor.colorName !== "Unknown" &&
                    foundColor.colorName !== "Unknown" &&
                    lostColor.colorName === foundColor.colorName;

                const brandMatch =
                    lostBrand !== "Unknown" &&
                    foundBrand !== "Unknown" &&
                    lostBrand === foundBrand;

                const keywordAnalysis = getKeywordScore(lost, found);

                const locationAnalysis = getLocationProximityScore(
                    lost.location || lost.foundLocation,
                    found.foundLocation || found.location || found.storageLocation
                );

                const timeAnalysis = getTimeCorrelationScore(lost, found);

                const visualScore = Math.round(
                    (categoryMatch ? 35 : 12) +
                    (colorMatch ? 35 : 12) +
                    Math.min(30, keywordAnalysis.score * 0.3)
                );

                const detailScore = Math.round(
                    (brandMatch ? 40 : 10) +
                    Math.min(45, keywordAnalysis.score * 0.45) +
                    (categoryMatch ? 15 : 0)
                );

                const confidence = getOverallConfidence({
                    categoryMatch,
                    colorMatch,
                    brandMatch,
                    keywordScore: keywordAnalysis.score,
                    locationScore: locationAnalysis.score,
                    timeScore: timeAnalysis.score,
                });

                setMatchData({
                    lost: {
                        ...lost,
                        time: getReportDateText(lost, "Reported on"),
                        color: lostColor.colorName,
                        colorHex: lostColor.hex,
                        brand: lostBrand,
                        features: lost.description || "No description provided.",
                        location: lost.location || lost.foundLocation || "Unknown",
                        locationArea: locationAnalysis.lostArea,
                    },
                    found: {
                        ...found,
                        time: getReportDateText(found, "Found on"),
                        color: foundColor.colorName,
                        colorHex: foundColor.hex,
                        brand: foundBrand,
                        features: found.description || "No description provided.",
                        location:
                            found.foundLocation ||
                            found.location ||
                            found.storageLocation ||
                            "Unknown",
                        locationArea: locationAnalysis.foundArea,
                    },
                    confidence,
                    confidenceLabel: getConfidenceLabel(confidence),
                    analysis: {
                        visual: Math.max(10, Math.min(98, visualScore)),
                        details: Math.max(10, Math.min(98, detailScore)),
                        location: locationAnalysis.score,
                        time: timeAnalysis.score,
                    },
                    notes: {
                        location: locationAnalysis.label,
                        time: timeAnalysis.label,
                        keywordHits: keywordAnalysis.hits,
                    },
                    matches: {
                        color: colorMatch,
                        brand: brandMatch,
                        category: categoryMatch,
                    },
                });
            } catch (error) {
                console.error("Error loading match data:", error);
            }

            setIsLoading(false);
        };

        loadData();
    }, [lostId, foundId, userData.email, navigate]);

    const handleConfirmedMatch = () => {
        if (!matchData) return;

        const { found, lost } = matchData;

        if (!isLostReportOwner(lost, userData.email)) {
            alert("Only the lost item reporter can confirm this match.");
            return;
        }

        const finderEmail = normalizeEmail(
            found.reporterEmail || found.founderEmail || found.foundByEmail || ""
        );

        const finderName =
            found.reporterName ||
            found.foundByName ||
            found.founderName ||
            finderEmail.split("@")[0] ||
            "Finder";

        if (!userData.email) {
            alert("Please login first.");
            return;
        }

        if (!finderEmail || finderEmail === userData.email) {
            alert("No valid finder found for this match.");
            return;
        }

        updateReportsAfterConfirmedMatch({
            lostId,
            foundId,
            lost,
            found,
            finderEmail,
            finderName,
            userData,
        });

        setItemStatus(lostId, "verifying");
        setItemStatus(foundId, "verifying");

        const conversationId = getOrCreateConversation({
            itemId: lostId,
            itemTitle: lost.title,
            itemImage: lost.image || null,
            itemType: "LOST",
            currentUserEmail: userData.email,
            currentUserName: userData.name,
            otherEmail: finderEmail,
            otherName: finderName,
        });

        appendSystemEventToConversation(conversationId, {
            eventType: "verifying",
            itemId: lostId,
            label: "Match verification started",
        });

        createNotification({
            recipientEmail: finderEmail,
            currentUserEmail: userData.email,
            currentUserName: userData.name,
            itemId: lostId,
            itemTitle: lost.title,
            conversationId,
            type: "verification",
        });

        navigate(`/messages/${conversationId}`);
    };

    const handleNotMyItem = () => {
        if (!matchData) return;

        const { found, lost } = matchData;

        if (!isLostReportOwner(lost, userData.email)) {
            alert("Only the lost item reporter can reject this match.");
            return;
        }

        const finderEmail = normalizeEmail(
            found.reporterEmail || found.founderEmail || found.foundByEmail || ""
        );

        const finderName =
            found.reporterName ||
            found.foundByName ||
            found.founderName ||
            finderEmail.split("@")[0] ||
            "Finder";

        const confirmed = window.confirm(
            "Reject this AI match suggestion? Don't worry, your original lost report will NOT be deleted and will remain in 'Searching' status so you can find other matches."
        );

        if (!confirmed) return;

        const success = resetItemToSearching(lostId, finderEmail, foundId);

        if (!success) {
            alert("Failed to reject this match. Please try again.");
            return;
        }

        if (finderEmail) {
            createNotification({
                recipientEmail: finderEmail,
                currentUserEmail: userData.email,
                currentUserName: userData.name,
                itemId: lostId,
                itemTitle: lost.title,
                conversationId: null,
                type: "match_rejected",
            });
        }

        alert("Match rejected. Your report is now back to searching for other items.");
        navigate("/my-reports");
    };

    if (isLoading) {
        return (
            <div className="flex h-[100dvh] bg-[#0E1511] items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#9CC88D] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (isAccessDenied) {
        return <AccessDenied onBack={() => navigate("/my-reports")} />;
    }

    if (!matchData) {
        return (
            <div className="flex h-[100dvh] bg-[#0E1511] items-center justify-center px-4 text-center text-[#86948A]">
                Report data not found.
            </div>
        );
    }

    const confidenceColor = getScoreColor(matchData.confidence);

    return (
        <div className="flex w-full min-h-screen bg-[#0E1511] text-[#DDE4DD] overflow-hidden">
            <Sidebar activePage="my-reports" />

            <main className="flex-1 flex flex-col h-screen overflow-y-auto">
                <TopBar />

                <div className="p-6 md:p-8 w-full max-w-7xl mx-auto flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-2">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-[#86948A] hover:text-[#DDE4DD] transition-colors font-semibold text-sm w-fit"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
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

                        <div className="w-full sm:w-fit px-4 py-2 bg-[#1A211D] border border-[#3C4A42]/40 rounded-2xl sm:rounded-full flex items-start sm:items-center gap-2">
                            <svg
                                className={`w-4 h-4 ${confidenceColor}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 12l2 2 4-4"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 3.75a8.25 8.25 0 100 16.5 8.25 8.25 0 000-16.5z"
                                />
                            </svg>

                            <span className={`text-xs sm:text-sm font-bold tracking-wide leading-relaxed ${confidenceColor}`}>
                                AI Confidence: {matchData.confidence}% ·{" "}
                                {matchData.confidenceLabel}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-6 items-start">
                        <div className="flex-1 bg-[#1A211D] border border-[#3C4A42]/30 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">
                            <div className="flex-1 flex flex-col">
                                <div className="bg-[#0E1511]/70 p-4 border-b border-[#3C4A42]/30 text-center">
                                    <h3 className="text-[#DDE4DD] font-semibold text-lg">
                                        Your Lost Report
                                    </h3>

                                    <p className="text-[#86948A] text-xs mt-1">
                                        {matchData.lost.time}
                                    </p>
                                </div>

                                <div className="p-4 md:p-6 flex flex-col gap-6">
                                    <div className="w-full h-48 bg-[#0E1511] rounded-xl overflow-hidden border border-[#3C4A42]/40 flex items-center justify-center">
                                        <img
                                            src={matchData.lost.image}
                                            alt="Lost Item"
                                            className="w-full h-full object-cover"
                                            onError={(event) => {
                                                event.target.src =
                                                    "https://placehold.co/600x400/1A211D/9CC88D?text=No+Image";
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <span className="px-2.5 py-1 bg-[#EF4444]/20 border border-[#EF4444]/30 text-[#FFB4AB] rounded-full text-[10px] font-bold uppercase tracking-wide">
                                            Lost
                                        </span>

                                        <h2 className="text-2xl font-bold text-[#DDE4DD] mt-3">
                                            {matchData.lost.title}
                                        </h2>
                                    </div>

                                    <div className="flex flex-col gap-0 text-sm">
                                        <InfoRow
                                            label="Category"
                                            value={matchData.lost.category || "Others"}
                                        />

                                        <InfoRow
                                            label="Color"
                                            value={matchData.lost.color}
                                            hex={matchData.lost.colorHex}
                                            colorLabel={matchData.lost.color}
                                        />

                                        <InfoRow label="Brand" value={matchData.lost.brand} />

                                        <InfoRow
                                            label="Features"
                                            value={matchData.lost.features}
                                            full
                                        />

                                        <InfoRow
                                            label="Last Seen"
                                            value={matchData.lost.location}
                                        />

                                        <InfoRow
                                            label="USU Area"
                                            value={matchData.lost.locationArea}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="w-px bg-[#3C4A42]/30 hidden md:block" />

                            <div className="flex-1 flex flex-col bg-[#0A120D] relative">
                                <div className="absolute top-0 left-0 w-full h-40 bg-linear-to-b from-[#9CC88D]/10 to-transparent pointer-events-none" />

                                <div className="bg-[#0E1511]/60 p-4 border-b border-[#3C4A42]/30 text-center flex flex-col items-center justify-center relative z-10">
                                    <h3 className="text-[#DDE4DD] font-semibold text-lg flex items-center gap-2">
                                        <svg
                                            className="w-5 h-5 text-[#9CC88D]"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            strokeWidth={2.5}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                        Found Item Suggestion
                                    </h3>

                                    <p className="text-[#86948A] text-xs mt-1">
                                        {matchData.found.time}
                                    </p>
                                </div>

                                <div className="p-6 flex flex-col gap-6 relative z-10">
                                    <div className="w-full h-48 bg-[#0E1511] rounded-xl overflow-hidden border border-[#3C4A42]/40 flex items-center justify-center relative">
                                        <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 backdrop-blur border border-white/10 rounded-full flex items-center gap-2 z-10">
                                            <div className="w-2 h-2 rounded-full bg-[#9CC88D]" />

                                            <span className="text-white text-xs font-semibold tracking-wide">
                                                Found Item Photo
                                            </span>
                                        </div>

                                        <img
                                            src={matchData.found.image}
                                            alt="Found Item"
                                            className="w-full h-full object-cover"
                                            onError={(event) => {
                                                event.target.src =
                                                    "https://placehold.co/600x400/1A211D/9CC88D?text=No+Image";
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <span className="px-2.5 py-1 bg-[#9CC88D]/20 border border-[#9CC88D]/30 text-[#9CC88D] rounded-full text-[10px] font-bold uppercase tracking-wide">
                                            Found
                                        </span>

                                        <h2 className="text-2xl font-bold text-[#DDE4DD] mt-3">
                                            {matchData.found.title}
                                        </h2>
                                    </div>

                                    <div className="flex flex-col gap-0 text-sm">
                                        <InfoRow
                                            label="Category"
                                            value={matchData.found.category || "Others"}
                                            match={matchData.matches.category}
                                        />

                                        <InfoRow
                                            label="Color"
                                            value={matchData.found.color}
                                            hex={matchData.found.colorHex}
                                            colorLabel={matchData.found.color}
                                            match={matchData.matches.color}
                                            warning={!matchData.matches.color}
                                        />

                                        <InfoRow
                                            label="Brand"
                                            value={matchData.found.brand}
                                            match={matchData.matches.brand}
                                            warning={
                                                matchData.lost.brand !== "Unknown" &&
                                                matchData.found.brand !== "Unknown" &&
                                                !matchData.matches.brand
                                            }
                                        />

                                        <InfoRow
                                            label="Features"
                                            value={matchData.found.features}
                                            full
                                        />

                                        <InfoRow
                                            label="Found Location"
                                            value={matchData.found.location}
                                        />

                                        <InfoRow
                                            label="USU Area"
                                            value={matchData.found.locationArea}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="w-full lg:w-90 flex flex-col gap-6 shrink-0">
                            <div className="bg-[#1A211D] border border-[#3C4A42]/30 rounded-2xl p-5 md:p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#3C4A42]/30">
                                    <div className="w-12 h-12 bg-[#0E1511] border border-[#3C4A42] rounded-full flex justify-center items-center">
                                        <svg
                                            className="w-6 h-6 text-[#9CC88D]"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                                            />
                                        </svg>
                                    </div>

                                    <div>
                                        <h3 className="text-[#DDE4DD] text-lg font-semibold">
                                            Match Analysis
                                        </h3>

                                        <p className="text-[#86948A] text-xs font-medium uppercase tracking-wide">
                                            Weighted Similarity
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-5">
                                    <AnalysisRow
                                        label="Visual & Item Details"
                                        value={matchData.analysis.visual}
                                        note="Calculated from category, color, title, and description similarity."
                                    />

                                    <AnalysisRow
                                        label="Specific Detail Match"
                                        value={matchData.analysis.details}
                                        note={
                                            matchData.notes.keywordHits.length > 0
                                                ? `Shared keywords: ${matchData.notes.keywordHits
                                                    .slice(0, 5)
                                                    .join(", ")}`
                                                : "Few specific words overlap between the reports."
                                        }
                                    />

                                    <AnalysisRow
                                        label="Location Proximity"
                                        value={matchData.analysis.location}
                                        note={matchData.notes.location}
                                    />

                                    <AnalysisRow
                                        label="Time Correlation"
                                        value={matchData.analysis.time}
                                        note={matchData.notes.time}
                                    />
                                </div>
                            </div>

                            <div className="bg-[#1A211D] border border-[#3C4A42]/30 rounded-2xl p-6 shadow-sm">
                                <h3 className="text-[#DDE4DD] text-lg font-semibold border-b border-[#3C4A42]/30 pb-3 mb-4">
                                    Verification Advice
                                </h3>

                                <div className="flex gap-4">
                                    <div className="w-10 h-10 bg-[#0E1511] border border-[#3C4A42] rounded-xl flex items-center justify-center shrink-0">
                                        <svg
                                            className="w-5 h-5 text-[#9CC88D]"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-[#DDE4DD] mb-1">
                                            Chat before resolving
                                        </p>

                                        <p className="text-xs text-[#86948A] leading-relaxed">
                                            Ask the finder about details that are not obvious from the
                                            photo, such as scratches, contents, sticker position, or
                                            last known use.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleConfirmedMatch}
                                    className="w-full py-3.5 bg-[#164A41] hover:bg-[#13342E] text-[#9CC88D] border border-[#9CC88D]/30 rounded-full font-bold text-sm flex justify-center items-center gap-2 transition-all shadow-sm active:scale-95"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        strokeWidth={2.5}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                    This is My Item
                                </button>

                                <button
                                    onClick={handleNotMyItem}
                                    className="w-full py-3.5 bg-[#C62828] hover:bg-[#B71C1C] text-white rounded-full font-bold text-sm flex justify-center items-center gap-2 transition-all shadow-sm active:scale-95"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        strokeWidth={2.5}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                    Not My Item
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default ReviewMatch;