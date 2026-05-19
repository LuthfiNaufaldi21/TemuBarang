function normalizeEmail(email) {
    return (email || "").toString().trim().toLowerCase();
}

export function normalizeStatus(status) {
    return (status || "searching")
        .toString()
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");
}

export function isResolvedStatus(status) {
    const normalized = normalizeStatus(status);

    return (
        normalized === "resolved" ||
        normalized === "returned" ||
        normalized === "closed" ||
        normalized === "completed"
    );
}

function readStorageArray(key) {
    try {
        return JSON.parse(localStorage.getItem(key) || "[]");
    } catch (error) {
        console.error(`[statusUtils] failed to read ${key}:`, error);
        return [];
    }
}

function writeStorageArray(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event("temuStorage"));
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
        report?.founderEmail ||
        report?.foundByEmail ||
        report?.createdByEmail ||
        report?.userEmail ||
        ""
    );
}

function getCandidateKey(candidate) {
    const email = normalizeEmail(candidate?.email || candidate?.finderEmail || "");
    const foundItemId = candidate?.foundItemId?.toString() || "";

    return `${email}_${foundItemId}`;
}

function isRejectedCandidate(candidate, rejectedFinderEmail, rejectedFoundItemId) {
    const candidateEmail = normalizeEmail(candidate?.email || candidate?.finderEmail || "");
    const candidateFoundItemId = candidate?.foundItemId?.toString() || "";

    let sameEmail = false;
    if (rejectedFinderEmail && candidateEmail) {
        sameEmail = candidateEmail === normalizeEmail(rejectedFinderEmail);
    }

    let sameFoundItem = false;
    if (rejectedFoundItemId && candidateFoundItemId) {
        sameFoundItem = candidateFoundItemId === rejectedFoundItemId?.toString();
    }

    return sameEmail || sameFoundItem;
}

function isCandidateActive(candidate) {
    const status = normalizeStatus(candidate?.status || "verifying");

    return (
        status !== "rejected" &&
        status !== "cancelled" &&
        status !== "closed" &&
        status !== "resolved"
    );
}

function uniqueCandidates(candidates) {
    const seen = new Set();

    return candidates.filter((candidate) => {
        const key = getCandidateKey(candidate);

        if (seen.has(key)) return false;

        seen.add(key);
        return true;
    });
}

function buildDirectFounderCandidate(report) {
    const email = normalizeEmail(report?.founderEmail || report?.foundByEmail || "");

    if (!email) return null;

    return {
        email,
        name:
            report?.founderName ||
            report?.foundByName ||
            email.split("@")[0] ||
            "Finder",
        foundItemId: report?.matchedFoundItemId || "",
        foundLocation: report?.foundLocation || "",
        storageLocation: report?.storageLocation || "",
        notes: report?.finderNotes || "",
        status: normalizeStatus(report?.status) === "match_found" ? "match_found" : "verifying",
        addedAt: report?.updatedAt || report?.createdAt || new Date().toISOString(),
    };
}

function getActiveCandidatesAfterReject({
    report,
    rejectedFinderEmail = "",
    rejectedFoundItemId = "",
}) {
    const storedCandidates = Array.isArray(report?.potentialFounders)
        ? report.potentialFounders
        : [];

    const cleanedStoredCandidates = storedCandidates.filter((candidate) => {
        if (isRejectedCandidate(candidate, rejectedFinderEmail, rejectedFoundItemId)) {
            return false;
        }

        return isCandidateActive(candidate);
    });

    const directCandidate = buildDirectFounderCandidate(report);

    const directCandidateIsStillValid =
        directCandidate &&
        !isRejectedCandidate(
            directCandidate,
            rejectedFinderEmail,
            rejectedFoundItemId
        ) &&
        isCandidateActive(directCandidate);

    const allActiveCandidates = directCandidateIsStillValid
        ? [...cleanedStoredCandidates, directCandidate]
        : cleanedStoredCandidates;

    return uniqueCandidates(allActiveCandidates);
}

function getNextStatusAfterReject(report, activeCandidates) {
    if (isResolvedStatus(report?.status)) {
        return normalizeStatus(report.status);
    }

    if (activeCandidates.length === 0) {
        return "searching";
    }

    const hasVerifyingCandidate = activeCandidates.some(
        (candidate) => normalizeStatus(candidate.status) === "verifying"
    );

    const currentStatus = normalizeStatus(report?.status);

    if (currentStatus === "verifying" || hasVerifyingCandidate) {
        return "verifying";
    }

    return "match_found";
}

function appendRejectedMatch({
    report,
    rejectedFinderEmail = "",
    rejectedFoundItemId = "",
    reason = "The found item did not match the lost report.",
}) {
    const oldRejectedMatches = Array.isArray(report?.rejectedMatches)
        ? report.rejectedMatches
        : [];

    if (!rejectedFinderEmail && !rejectedFoundItemId) return oldRejectedMatches;

    const alreadyExists = oldRejectedMatches.some((match) => {
        const sameEmail =
            rejectedFinderEmail &&
            match.finderEmail &&
            normalizeEmail(match.finderEmail) === normalizeEmail(rejectedFinderEmail);

        const sameFoundItem =
            rejectedFoundItemId &&
            match.foundItemId &&
            match.foundItemId?.toString() === rejectedFoundItemId?.toString();

        return sameEmail || sameFoundItem;
    });

    if (alreadyExists) return oldRejectedMatches;

    return [
        ...oldRejectedMatches,
        {
            finderEmail: rejectedFinderEmail,
            foundItemId: rejectedFoundItemId,
            rejectedAt: new Date().toISOString(),
            reason,
        },
    ];
}

function applyPrimaryCandidateToLostReport(report, activeCandidates) {
    const primaryCandidate = activeCandidates[0];

    if (!primaryCandidate) {
        const cleanReport = {
            ...report,
            status: "searching",
            potentialFounders: [],
        };

        delete cleanReport.founderEmail;
        delete cleanReport.foundByEmail;
        delete cleanReport.founderName;
        delete cleanReport.foundByName;
        delete cleanReport.foundLocation;
        delete cleanReport.storageLocation;
        delete cleanReport.finderNotes;
        delete cleanReport.ownerVerified;
        delete cleanReport.matchedFoundItemId;
        delete cleanReport.matchedLostItemId;

        return cleanReport;
    }

    const nextStatus = getNextStatusAfterReject(report, activeCandidates);

    const nextReport = {
        ...report,
        status: nextStatus,
        founderEmail: primaryCandidate.email || "",
        foundByEmail: primaryCandidate.email || "",
        founderName: primaryCandidate.name || "Finder",
        foundByName: primaryCandidate.name || "Finder",
        foundLocation: primaryCandidate.foundLocation || report.foundLocation || "",
        storageLocation:
            primaryCandidate.storageLocation || report.storageLocation || "",
        finderNotes: primaryCandidate.notes || report.finderNotes || "",
        potentialFounders: activeCandidates,
    };

    if (primaryCandidate.foundItemId) {
        nextReport.matchedFoundItemId = primaryCandidate.foundItemId;
    } else {
        delete nextReport.matchedFoundItemId;
    }

    return nextReport;
}

function closeRelatedConversations({
    itemId,
    relatedItemId = "",
    targetEmail = "",
    systemLabel = "Verification closed.",
    eventType = "verification_closed",
}) {
    const now = new Date().toISOString();
    const normalizedTargetEmail = normalizeEmail(targetEmail);
    const conversations = readStorageArray("temuConversations");

    const updatedConversations = conversations.map((conversation) => {
        const conversationItemId = conversation.itemId?.toString();
        const conversationActiveItemId = conversation.activeItemId?.toString();

        const sameMainItem =
            conversationItemId === itemId?.toString() ||
            conversationActiveItemId === itemId?.toString();

        const sameRelatedItem =
            relatedItemId &&
            (conversationItemId === relatedItemId?.toString() ||
                conversationActiveItemId === relatedItemId?.toString());

        const history = Array.isArray(conversation.itemHistory)
            ? conversation.itemHistory
            : [];

        const historyMatch = history.some((entry) => {
            const entryItemId = entry.itemId?.toString();

            return (
                entryItemId === itemId?.toString() ||
                (relatedItemId && entryItemId === relatedItemId?.toString())
            );
        });

        const involvesTargetUser =
            normalizedTargetEmail &&
            conversation.participants?.some(
                (email) => normalizeEmail(email) === normalizedTargetEmail
            );

        const shouldClose =
            (sameMainItem || sameRelatedItem || historyMatch) &&
            (!normalizedTargetEmail || involvesTargetUser);

        if (!shouldClose) {
            return conversation;
        }

        const oldMessages = Array.isArray(conversation.messages)
            ? conversation.messages
            : [];

        const alreadyHasEvent = oldMessages.some(
            (message) =>
                message.type === "system" &&
                message.eventType === eventType &&
                message.itemId?.toString() === itemId?.toString()
        );

        const systemEvent = {
            id: `sys_${eventType}_${itemId}_${Date.now()}`,
            type: "system",
            eventType,
            itemId,
            label: systemLabel,
            sentAt: now,
        };

        const nextMessages = alreadyHasEvent
            ? oldMessages
            : [...oldMessages, systemEvent];

        return {
            ...conversation,
            status: "closed",
            messages: nextMessages,
            lastMessage: systemLabel,
            lastMessageAt: now,
            lastMessageSender: "system",
            closedAt: now,
            readBy: [],
            updatedAt: now,
        };
    });

    writeStorageArray("temuConversations", updatedConversations);
}

function markRelatedNotificationsAsRead({
    itemId,
    relatedItemId = "",
    targetEmail = "",
}) {
    const normalizedTargetEmail = normalizeEmail(targetEmail);
    const notifications = readStorageArray("temuNotifications");
    const now = new Date().toISOString();

    const updatedNotifications = notifications.map((notification) => {
        const sameMainItem =
            notification.itemId?.toString() === itemId?.toString();

        const sameRelatedItem =
            relatedItemId &&
            notification.itemId?.toString() === relatedItemId?.toString();

        const sameFoundItem =
            relatedItemId &&
            notification.foundId?.toString() === relatedItemId?.toString();

        const sameLostItem =
            notification.lostId?.toString() === itemId?.toString();

        const sameTargetUser =
            !normalizedTargetEmail ||
            normalizeEmail(notification.userId) === normalizedTargetEmail ||
            normalizeEmail(notification.recipientEmail) === normalizedTargetEmail;

        if (
            (sameMainItem || sameRelatedItem || sameFoundItem || sameLostItem) &&
            sameTargetUser
        ) {
            return {
                ...notification,
                read: true,
                readAt: notification.readAt || now,
            };
        }

        return notification;
    });

    writeStorageArray("temuNotifications", updatedNotifications);
}

function createPrivateNotification({
    recipientEmail,
    title,
    message,
    itemId,
    conversationId = "",
    type = "system",
    lostId = "",
    foundId = "",
}) {
    const normalizedRecipient = normalizeEmail(recipientEmail);

    if (!normalizedRecipient) return;

    const notifications = readStorageArray("temuNotifications");
    const now = new Date().toISOString();

    const alreadyExists = notifications.some((notification) => {
        const sameUser = normalizeEmail(notification.userId) === normalizedRecipient;
        const sameType = notification.type === type;
        const sameItem = notification.itemId?.toString() === itemId?.toString();
        const sameLost = !lostId || notification.lostId?.toString() === lostId?.toString();
        const sameFound =
            !foundId || notification.foundId?.toString() === foundId?.toString();

        return sameUser && sameType && sameItem && sameLost && sameFound && !notification.read;
    });

    if (alreadyExists) return;

    const newNotification = {
        id: `notif_${type}_${itemId}_${normalizedRecipient}_${Date.now()}`,
        userId: normalizedRecipient,
        title,
        message,
        itemId,
        conversationId,
        lostId,
        foundId,
        type,
        read: false,
        createdAt: now,
    };

    writeStorageArray("temuNotifications", [newNotification, ...notifications]);
}

export function setItemStatus(itemId, newStatus) {
    try {
        const allReports = readStorageArray("temuReports");

        const STATUS_ORDER = ["searching", "match_found", "verifying", "resolved"];
        const normalizedNewStatus = normalizeStatus(newStatus);

        if (!STATUS_ORDER.includes(normalizedNewStatus)) {
            console.warn("[statusUtils] unknown new status:", newStatus);
            return false;
        }

        let changed = false;
        const now = new Date().toISOString();

        const updatedReports = allReports.map((report) => {
            if (report.id?.toString() !== itemId?.toString()) {
                return report;
            }

            const currentStatus = normalizeStatus(report.status);
            const currentIndex = STATUS_ORDER.indexOf(currentStatus);
            const newIndex = STATUS_ORDER.indexOf(normalizedNewStatus);
            const safeCurrentIndex = currentIndex >= 0 ? currentIndex : 0;

            if (newIndex > safeCurrentIndex) {
                changed = true;

                const nextReport = {
                    ...report,
                    status: normalizedNewStatus,
                    updatedAt: now,
                };

                if (normalizedNewStatus === "resolved") {
                    nextReport.resolvedAt = report.resolvedAt || now;
                    nextReport.closedAt = report.closedAt || now;
                }

                return nextReport;
            }

            return report;
        });

        writeStorageArray("temuReports", updatedReports);
        return changed;
    } catch (error) {
        console.error("[statusUtils] setItemStatus error:", error);
        return false;
    }
}

export function getItemStatus(itemId) {
    try {
        const allReports = readStorageArray("temuReports");

        const item = allReports.find(
            (report) => report.id?.toString() === itemId?.toString()
        );

        return normalizeStatus(item?.status);
    } catch (error) {
        console.error("[statusUtils] getItemStatus error:", error);
        return "searching";
    }
}

export function resetItemToSearching(
    itemId,
    rejectedFinderEmail = "",
    rejectedFoundItemId = ""
) {
    try {
        const allReports = readStorageArray("temuReports");
        const now = new Date().toISOString();

        let targetLostReport = null;
        let rejectedFoundReport = null;

        const updatedReports = allReports.map((report) => {
            const isTargetLostItem = report.id?.toString() === itemId?.toString();

            const isRejectedFoundItem =
                rejectedFoundItemId &&
                report.id?.toString() === rejectedFoundItemId?.toString();

            if (!isTargetLostItem && !isRejectedFoundItem) {
                return report;
            }

            if (isTargetLostItem) {
                targetLostReport = report;

                const activeCandidates = getActiveCandidatesAfterReject({
                    report,
                    rejectedFinderEmail,
                    rejectedFoundItemId,
                });

                const rejectedMatches = appendRejectedMatch({
                    report,
                    rejectedFinderEmail,
                    rejectedFoundItemId,
                });

                const nextReport = applyPrimaryCandidateToLostReport(
                    {
                        ...report,
                        rejectedMatches,
                        updatedAt: now,
                    },
                    activeCandidates
                );

                return {
                    ...nextReport,
                    updatedAt: now,
                };
            }

            if (isRejectedFoundItem) {
                rejectedFoundReport = report;

                if (isResolvedStatus(report.status)) {
                    return report;
                }

                const nextReport = {
                    ...report,
                    status: "searching",
                    updatedAt: now,
                    rejectedByOwner: true,
                    rejectedAt: now,
                    rejectedLostItemId: itemId,
                };

                delete nextReport.ownerEmail;
                delete nextReport.ownerName;
                delete nextReport.ownerVerified;
                delete nextReport.matchedLostItemId;
                delete nextReport.matchedFoundItemId;

                return nextReport;
            }

            return report;
        });

        if (!targetLostReport) {
            console.warn("[statusUtils] resetItemToSearching target item not found:", itemId);
            return false;
        }

        writeStorageArray("temuReports", updatedReports);

        closeRelatedConversations({
            itemId,
            relatedItemId: rejectedFoundItemId,
            targetEmail: rejectedFinderEmail,
            systemLabel: "Match rejected. Other active verification remains unchanged.",
            eventType: "match_rejected",
        });

        markRelatedNotificationsAsRead({
            itemId,
            relatedItemId: rejectedFoundItemId,
            targetEmail: rejectedFinderEmail,
        });

        if (rejectedFinderEmail) {
            createPrivateNotification({
                recipientEmail: rejectedFinderEmail,
                title: "Match Rejected",
                message:
                    "The owner rejected this suggested match because the item details did not match.",
                itemId,
                type: "match_rejected",
                lostId: itemId,
                foundId: rejectedFoundItemId,
            });
        }

        return true;
    } catch (error) {
        console.error("[statusUtils] resetItemToSearching error:", error);
        return false;
    }
}

export function rejectFoundClaim({
    itemId,
    rejectedClaimantEmail = "",
    rejectedClaimantName = "",
    rejectedByEmail = "",
    rejectedByName = "",
    reason = "Item details did not match.",
    conversationId = "",
}) {
    try {
        const allReports = readStorageArray("temuReports");
        const now = new Date().toISOString();
        const normalizedClaimantEmail = normalizeEmail(rejectedClaimantEmail);

        let targetItem = null;

        const updatedReports = allReports.map((report) => {
            if (report.id?.toString() !== itemId?.toString()) {
                return report;
            }

            targetItem = report;

            const oldRejectedClaims = Array.isArray(report.rejectedClaims)
                ? report.rejectedClaims
                : [];

            const alreadyRejected = oldRejectedClaims.some(
                (claim) =>
                    normalizeEmail(claim.claimantEmail) === normalizedClaimantEmail
            );

            const nextRejectedClaims =
                alreadyRejected || !rejectedClaimantEmail
                    ? oldRejectedClaims
                    : [
                        ...oldRejectedClaims,
                        {
                            claimantEmail: rejectedClaimantEmail,
                            claimantName: rejectedClaimantName || "Claimant",
                            rejectedByEmail,
                            rejectedByName,
                            rejectedAt: now,
                            reason,
                        },
                    ];

            const resetReport = {
                ...report,
                status: "searching",
                updatedAt: now,
                rejectedClaims: nextRejectedClaims,
            };

            delete resetReport.ownerEmail;
            delete resetReport.ownerName;
            delete resetReport.ownerVerified;
            delete resetReport.claimantEmail;
            delete resetReport.claimantName;
            delete resetReport.claimStartedAt;
            delete resetReport.matchedLostItemId;
            delete resetReport.matchedFoundItemId;

            return resetReport;
        });

        if (!targetItem) {
            console.warn("[statusUtils] rejectFoundClaim target item not found:", itemId);
            return false;
        }

        writeStorageArray("temuReports", updatedReports);

        closeRelatedConversations({
            itemId,
            targetEmail: rejectedClaimantEmail,
            systemLabel: "Claim rejected. Item is available for other valid claims.",
            eventType: "claim_rejected",
        });

        markRelatedNotificationsAsRead({
            itemId,
            targetEmail: rejectedClaimantEmail,
        });

        if (rejectedClaimantEmail) {
            createPrivateNotification({
                recipientEmail: rejectedClaimantEmail,
                title: "Claim Rejected",
                message:
                    reason ||
                    "Your claim was rejected because the item details did not match.",
                itemId,
                conversationId,
                type: "claim_rejected",
            });
        }

        return true;
    } catch (error) {
        console.error("[statusUtils] rejectFoundClaim error:", error);
        return false;
    }
}