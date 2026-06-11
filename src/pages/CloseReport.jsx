import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { setItemStatus } from "../utils/statusUtils";

export default function CloseReport() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [report, setReport] = useState(null);
    const [selectedMethod, setSelectedMethod] = useState("");
    const [successStory, setSuccessStory] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const getCurrentUserEmail = () => {
        return localStorage.getItem("currentUserEmail") || "";
    };

    const [userData] = useState(() => {
        const email = getCurrentUserEmail();

        if (email) {
            const savedProfile = localStorage.getItem(`temuProfile_${email}`);

            if (savedProfile) {
                try {
                    const parsed = JSON.parse(savedProfile);

                    return {
                        name: parsed.fullName
                            ? parsed.fullName.split(" ")[0]
                            : email.split("@")[0],
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

        return {
            name: "Student",
            email: "",
        };
    });

    const readStorageArray = (key) => {
        try {
            return JSON.parse(localStorage.getItem(key) || "[]");
        } catch (error) {
            console.error(`Failed to read ${key}`, error);
            return [];
        }
    };

    const writeStorageArray = (key, value) => {
        localStorage.setItem(key, JSON.stringify(value));
    };

    const normalizeStatus = (status) => {
        return (status || "searching").toLowerCase().replace(/\s/g, "_");
    };

    const isResolvedStatus = (status) => {
        const normalized = normalizeStatus(status);
        return normalized === "resolved" || normalized === "returned";
    };

    const formatResolvedDate = (dateValue) => {
        if (!dateValue) return "";

        return new Date(dateValue).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const getRelatedPeople = (item) => {
        const peopleMap = new Map();

        const addPerson = (email, name) => {
            if (!email) return;

            peopleMap.set(email, {
                email,
                name: name || email.split("@")[0],
            });
        };

        addPerson(item.reporterEmail, item.reporterName);
        addPerson(item.founderEmail, item.foundByName || item.founderName);
        addPerson(item.foundByEmail, item.foundByName);
        addPerson(item.ownerEmail, item.ownerName);

        if (Array.isArray(item.potentialFounders)) {
            item.potentialFounders.forEach((finder) => {
                addPerson(finder.email, finder.name);
            });
        }

        return Array.from(peopleMap.values());
    };

    const updateRelatedConversations = (item, now) => {
        const conversations = readStorageArray("temuConversations");

        let firstConversationId = null;

        const updatedConversations = conversations.map((conversation) => {
            const isRelated =
                conversation.itemId?.toString() === item.id?.toString();

            if (!isRelated) return conversation;

            if (!firstConversationId) {
                firstConversationId = conversation.id;
            }

            const oldMessages = Array.isArray(conversation.messages)
                ? conversation.messages
                : [];

            const alreadyHasResolvedEvent = oldMessages.some(
                (message) => message.eventType === "resolved"
            );

            const resolvedEvent = {
                id: `sys_resolved_${item.id}_${Date.now()}`,
                type: "system",
                eventType: "resolved",
                label: "Case marked as resolved",
                sentAt: now,
            };

            return {
                ...conversation,
                status: "resolved",
                resolvedAt: now,
                lastMessage: "Case marked as resolved",
                lastMessageAt: now,
                lastMessageSender: userData.email,
                readBy: [userData.email],
                messages: alreadyHasResolvedEvent
                    ? oldMessages
                    : [...oldMessages, resolvedEvent],
            };
        });

        writeStorageArray("temuConversations", updatedConversations);

        return firstConversationId;
    };

    const saveResolvedActivity = (item, now, resolvedDate) => {
        const activities = readStorageArray("temuActivities");

        const newActivity = {
            id: `activity_resolved_${item.id}_${Date.now()}`,
            type: "RESOLVED",
            kind: "resolved",
            reportId: item.id,
            title: item.title,
            text: `${item.title} has been marked as resolved.`,
            time: "Just now",
            date: resolvedDate,
            createdAt: now,
        };

        writeStorageArray("temuActivities", [newActivity, ...activities]);
    };

    const notifyRelatedUsers = (item, conversationId, now) => {
        const currentUserEmail = getCurrentUserEmail();
        const relatedPeople = getRelatedPeople(item);

        const recipients = relatedPeople.filter(
            (person) => person.email && person.email !== currentUserEmail
        );

        if (recipients.length === 0) return;

        const oldNotifications = readStorageArray("temuNotifications");

        const newNotifications = recipients.map((person) => ({
            id: `notif_resolved_${item.id}_${person.email}_${Date.now()}_${Math.random()
                .toString(16)
                .slice(2)}`,
            userId: person.email,
            title: "Case Resolved",
            message: `The case for "${item.title}" has been marked as resolved.`,
            itemId: item.id,
            conversationId: conversationId || null,
            type: "resolved",
            read: false,
            createdAt: now,
        }));

        writeStorageArray("temuNotifications", [
            ...newNotifications,
            ...oldNotifications,
        ]);
    };

    useEffect(() => {
        const allReports = readStorageArray("temuReports");

        const foundReport = allReports.find(
            (item) => item.id?.toString() === id?.toString()
        );

        if (foundReport) {
            setReport(foundReport);
            setSelectedMethod(foundReport.type === "LOST" ? "ai_match" : "direct");
            setSuccessStory(foundReport.successStory || foundReport.resolutionNote || "");
        }
    }, [id]);

    if (!report) {
        return (
            <div className="flex h-[100dvh] bg-[#0E1511] items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#9CC88D] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const isLost = report.type === "LOST";
    const reportIsResolved = isResolvedStatus(report.status);

    const lostOptions = [
        {
            id: "ai_match",
            title: "Found via AI Match",
            desc: "System matched the item.",
        },
        {
            id: "returned",
            title: "Returned by someone",
            desc: "An honest and kind person handed it over.",
        },
        {
            id: "myself",
            title: "Found it myself",
            desc: "Located it after reporting.",
        },
    ];

    const foundOptions = [
        {
            id: "direct",
            title: "Direct Handover",
            desc: "Item was handed over directly to the original owner.",
        },
        {
            id: "security",
            title: "Security / Admin",
            desc: "Item was deposited at the campus security center or administrative office.",
        },
    ];

    const currentOptions = isLost ? lostOptions : foundOptions;

    const handleConfirm = () => {
        if (!selectedMethod) return;

        if (reportIsResolved) {
            alert("This report is already resolved.");
            return;
        }

        setIsSubmitting(true);

        setTimeout(() => {
            try {
                const now = new Date().toISOString();
                const resolvedDate = formatResolvedDate(now);

                const allReports = readStorageArray("temuReports");

                let resolvedReport = null;

                const updatedReports = allReports.map((item) => {
                    if (item.id?.toString() !== id?.toString()) {
                        return item;
                    }

                    resolvedReport = {
                        ...item,
                        status: "resolved",
                        resolutionMethod: selectedMethod,
                        successStory,
                        resolutionNote:
                            successStory.trim() ||
                            "The item has been returned to the rightful owner.",
                        resolvedAt: now,
                        resolvedDate,
                        updatedAt: now,
                        resolvedByEmail: userData.email,
                        resolvedByName: userData.name,
                        ownerVerified: true,
                    };

                    return resolvedReport;
                });

                writeStorageArray("temuReports", updatedReports);
                setItemStatus(id, "resolved");

                const conversationId = updateRelatedConversations(
                    resolvedReport || report,
                    now
                );

                saveResolvedActivity(resolvedReport || report, now, resolvedDate);
                notifyRelatedUsers(resolvedReport || report, conversationId, now);

                setIsSubmitting(false);
                navigate(`/success-process?type=resolved&itemId=${id}`);
            } catch (error) {
                console.error("Failed to update data:", error);
                setIsSubmitting(false);
                alert("Failed to close this report. Please try again.");
            }
        }, 700);
    };

    return (
        <div className="flex h-[100dvh] min-h-0 bg-[#0E1511] text-white overflow-hidden">
            <Sidebar activePage="my-reports" />

            <div className="flex-1 min-w-0 min-h-0 flex flex-col h-full overflow-hidden">
                <TopBar />

                <main className="flex-1 min-h-0 overflow-y-auto bg-[#0E1511] pb-[calc(8rem+env(safe-area-inset-bottom))] md:pb-0">
                    <div className="w-full max-w-5xl mx-auto p-4 md:p-8 flex items-center justify-center min-h-[calc(100dvh-64px)]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                            <div className="relative bg-[#1A211D] rounded-2xl shadow-2xl border border-[#3C4A42]/30 p-8 overflow-hidden backdrop-blur-sm">
                                <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#9CC88D]/10 rounded-full blur-[60px] pointer-events-none" />

                                <div className="relative z-10">
                                    <h2 className="text-3xl font-bold text-[#DDE4DD] mb-2">
                                        Close {isLost ? "Lost" : "Found"} Report
                                    </h2>

                                    <p className="text-[#86948A] text-sm mb-8">
                                        {isLost
                                            ? "Please verify the item handover details to close report permanently."
                                            : "Review the details before confirming the resolution of this item."}
                                    </p>

                                    <div className="bg-[#2F3632]/50 rounded-xl border border-[#DDE4DD]/30 p-4 mb-6">
                                        <div className="flex gap-4 mb-4">
                                            <div className="w-24 h-24 bg-black rounded-lg overflow-hidden shrink-0 border border-[#DDE4DD]/30">
                                                <img
                                                    src={report.image}
                                                    alt={report.title}
                                                    className="w-full h-full object-cover opacity-90"
                                                    onError={(event) => {
                                                        event.target.src =
                                                            "https://placehold.co/96x96/1A211D/4D774E?text=No+Image";
                                                    }}
                                                />
                                            </div>

                                            <div className="flex flex-col flex-1">
                                                <div className="flex justify-between items-start mb-1 gap-3">
                                                    <h3 className="text-lg font-semibold text-[#DDE4DD] line-clamp-1">
                                                        {report.title}
                                                    </h3>

                                                    <span
                                                        className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${isLost
                                                            ? "bg-red-900/30 text-red-300 border-red-800/50"
                                                            : "bg-emerald-900/30 text-emerald-300 border-emerald-800/50"
                                                            }`}
                                                    >
                                                        {report.type}
                                                    </span>
                                                </div>

                                                <p className="text-sm text-[#86948A] line-clamp-3 leading-relaxed">
                                                    {report.description || "No description provided."}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#DDE4DD]/30">
                                            <div>
                                                <p className="text-[10px] font-bold text-[#DDE4DD]/70 uppercase tracking-wider mb-1">
                                                    Reported On
                                                </p>

                                                <p className="text-sm text-[#DDE4DD]">
                                                    {report.dateText || report.date || "-"}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-[10px] font-bold text-[#DDE4DD]/70 uppercase tracking-wider mb-1">
                                                    Location
                                                </p>

                                                <p
                                                    className="text-sm text-[#DDE4DD] truncate"
                                                    title={report.location || report.foundLocation}
                                                >
                                                    {report.location || report.foundLocation || "-"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {reportIsResolved && (
                                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                                            <p className="text-emerald-300 text-sm font-semibold">
                                                This report is already resolved.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-[#1A211D] rounded-2xl shadow-xl border border-[#3C4A42]/30 p-8 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-xl font-semibold text-[#DDE4DD] mb-2">
                                        {isLost ? "How was it recovered?" : "How was it resolved?"}
                                    </h3>

                                    <p className="text-[#86948A] text-sm mb-6">
                                        {isLost
                                            ? "Select the method that best describes how the item was found."
                                            : "Select the handover method used to resolve this report."}
                                    </p>

                                    <div className="flex flex-col gap-3 mb-6">
                                        {currentOptions.map((option) => {
                                            const isSelected = selectedMethod === option.id;

                                            return (
                                                <div
                                                    key={option.id}
                                                    onClick={() => setSelectedMethod(option.id)}
                                                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between group ${isSelected
                                                        ? "border-[#9CC88D]/50 bg-[#164A41]/20"
                                                        : "border-[#3C4A42]/30 bg-[#0E1511] hover:border-[#3C4A42]"
                                                        }`}
                                                >
                                                    <div>
                                                        <h4
                                                            className={`text-sm font-semibold mb-0.5 transition-colors ${isSelected
                                                                ? "text-[#9CC88D]"
                                                                : "text-[#DDE4DD] group-hover:text-[#9CC88D]"
                                                                }`}
                                                        >
                                                            {option.title}
                                                        </h4>

                                                        <p className="text-xs text-[#86948A]">
                                                            {option.desc}
                                                        </p>
                                                    </div>

                                                    <div
                                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected
                                                            ? "border-[#9CC88D] bg-[#9CC88D]"
                                                            : "border-[#3C4A42] bg-[#1A211D]"
                                                            }`}
                                                    >
                                                        {isSelected && (
                                                            <svg
                                                                className="w-3 h-3 text-[#13342E]"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={3}
                                                                    d="M5 13l4 4L19 7"
                                                                />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {isLost && (
                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-[#DDE4DD] mb-2">
                                                Success Story / Note (Optional)
                                            </label>

                                            <textarea
                                                value={successStory}
                                                onChange={(event) => setSuccessStory(event.target.value)}
                                                placeholder="Share how you got it back..."
                                                className="w-full bg-[#0E1511] border border-[#3C4A42]/40 rounded-xl p-4 text-sm text-[#DDE4DD] focus:outline-none focus:border-[#9CC88D]/50 resize-none h-24 placeholder:text-[#4D5E52] transition-colors"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 sm:gap-4 mt-4 pt-6 border-t border-[#3C4A42]/30">
                                    <button
                                        onClick={() => navigate(-1)}
                                        disabled={isSubmitting}
                                        className="w-full sm:w-auto px-8 py-3 bg-[#C62828] hover:bg-[#B71C1C] text-white font-bold rounded-full transition-all hover:shadow-lg transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        onClick={handleConfirm}
                                        disabled={isSubmitting || !selectedMethod || reportIsResolved}
                                        className="w-full sm:w-auto px-8 py-3 bg-[#164A41] hover:bg-[#13342E] text-[#9CC88D] border border-[#9CC88D]/30 font-bold rounded-full flex items-center justify-center gap-2 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 text-sm"
                                    >
                                        {isSubmitting ? (
                                            <div className="w-4 h-4 border-2 border-[#9CC88D] border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <svg
                                                className="w-4 h-4 text-[#9CC88D]"
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

                                        {isSubmitting ? "Confirming..." : "Confirm Resolution"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}