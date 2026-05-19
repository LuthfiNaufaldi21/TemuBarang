// ─── conversationUtils.js ─────────────────────────────────────────────────────
// Single source of truth untuk conversation ID generation dan creation.
// Dipakai oleh ItemDetail, ConfirmFound, MyReportDetail, ReviewMatch, dan ChatRoom.
//
// Logic utama:
// 1. Satu pasangan user hanya punya satu room chat.
// 2. Conversation ID tidak lagi bergantung pada itemId.
// 3. Kalau user yang sama membahas item baru, room lama dipakai lagi.
// 4. Item terbaru disimpan sebagai active item.
// 5. Riwayat item yang pernah dibahas disimpan di itemHistory.
// ─────────────────────────────────────────────────────────────────────────────

function normalizeEmail(email) {
  return (email || "").toString().trim().toLowerCase();
}

function safeNameFromEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return "Student";
  return normalized.split("@")[0] || "Student";
}

function makeEmailSlug(email) {
  return safeNameFromEmail(email)
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .toLowerCase();
}

function sortEmails(emailA, emailB) {
  return [normalizeEmail(emailA), normalizeEmail(emailB)].sort();
}

function getPairKey(emailA, emailB) {
  const [first, second] = sortEmails(emailA, emailB);
  return `${first}__${second}`;
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

function readAliasMap() {
  try {
    return JSON.parse(localStorage.getItem("temuConversationAliases") || "{}");
  } catch {
    return {};
  }
}

function writeAliasMap(aliasMap) {
  localStorage.setItem("temuConversationAliases", JSON.stringify(aliasMap));
}

function getParticipants(conversation) {
  return Array.isArray(conversation?.participants)
    ? conversation.participants.map(normalizeEmail).filter(Boolean)
    : [];
}

function conversationMatchesParticipants(conversation, emailA, emailB) {
  const participants = getParticipants(conversation);

  const normalizedA = normalizeEmail(emailA);
  const normalizedB = normalizeEmail(emailB);

  return (
    participants.includes(normalizedA) &&
    participants.includes(normalizedB)
  );
}

function mergeUniqueArray(...arrays) {
  const result = [];

  arrays.flat().forEach((value) => {
    if (!value) return;

    if (!result.includes(value)) {
      result.push(value);
    }
  });

  return result;
}

function mergeReadBy(...arrays) {
  const result = [];

  arrays.flat().forEach((email) => {
    const normalized = normalizeEmail(email);

    if (!normalized) return;

    if (!result.includes(normalized)) {
      result.push(normalized);
    }
  });

  return result;
}

function mergeMessages(...messageArrays) {
  const map = new Map();

  messageArrays.flat().forEach((message) => {
    if (!message) return;

    const key =
      message.id ||
      `${message.type || "message"}_${message.senderId || "system"}_${message.sentAt || Date.now()
      }_${message.text || message.label || ""}`;

    if (!map.has(key)) {
      map.set(key, message);
    }
  });

  return Array.from(map.values()).sort((a, b) => {
    const aTime = new Date(a.sentAt || a.createdAt || 0).getTime();
    const bTime = new Date(b.sentAt || b.createdAt || 0).getTime();

    return (Number.isNaN(aTime) ? 0 : aTime) - (Number.isNaN(bTime) ? 0 : bTime);
  });
}

function createItemHistoryEntry({
  itemId,
  itemTitle,
  itemImage,
  itemType = "",
}) {
  if (!itemId && !itemTitle) return null;

  const now = new Date().toISOString();

  return {
    itemId,
    itemTitle: itemTitle || "Untitled Item",
    itemImage: itemImage || null,
    itemType,
    firstUsedAt: now,
    lastUsedAt: now,
  };
}

function mergeItemHistory(oldHistory = [], newEntry = null) {
  const safeOldHistory = Array.isArray(oldHistory) ? oldHistory : [];

  if (!newEntry?.itemId) {
    return safeOldHistory;
  }

  let found = false;

  const updatedHistory = safeOldHistory.map((entry) => {
    if (entry.itemId?.toString() !== newEntry.itemId?.toString()) {
      return entry;
    }

    found = true;

    return {
      ...entry,
      itemTitle: newEntry.itemTitle || entry.itemTitle,
      itemImage: newEntry.itemImage || entry.itemImage || null,
      itemType: newEntry.itemType || entry.itemType || "",
      lastUsedAt: new Date().toISOString(),
    };
  });

  if (found) {
    return updatedHistory;
  }

  return [...updatedHistory, newEntry];
}

function hasItemInHistory(conversation, itemId) {
  if (!itemId) return false;

  const history = Array.isArray(conversation?.itemHistory)
    ? conversation.itemHistory
    : [];

  return history.some(
    (entry) => entry.itemId?.toString() === itemId?.toString()
  );
}

function createCaseStartedEvent({ itemId, itemTitle }) {
  return {
    id: `sys_case_started_${itemId}_${Date.now()}`,
    type: "system",
    eventType: "case_started",
    itemId,
    label: `Now discussing: ${itemTitle || "this item"}`,
    sentAt: new Date().toISOString(),
  };
}

/**
 * Generate conversation ID yang konsisten untuk satu pasangan user.
 *
 * Catatan:
 * Function ini tetap menerima 3 parameter agar kompatibel dengan kode lama:
 * makeConversationId(itemId, emailA, emailB)
 *
 * Tetapi itemId tidak lagi dipakai untuk membuat ID.
 *
 * Format baru:
 * conv_dm_{emailA_sorted}_{emailB_sorted}
 */
export function makeConversationId(itemIdOrEmailA, emailAOrEmailB, maybeEmailB) {
  let emailA = emailAOrEmailB;
  let emailB = maybeEmailB;

  // Support kalau dipanggil dengan format baru:
  // makeConversationId(emailA, emailB)
  if (!maybeEmailB) {
    emailA = itemIdOrEmailA;
    emailB = emailAOrEmailB;
  }

  const [first, second] = sortEmails(emailA, emailB);

  const slugA = makeEmailSlug(first);
  const slugB = makeEmailSlug(second);

  return `conv_dm_${slugA}_${slugB}`;
}

/**
 * Generate ID lama berbasis item.
 * Ini hanya dipakai untuk membaca atau mengenali conversation lama.
 */
export function makeLegacyConversationId(itemId, emailA, emailB) {
  const [first, second] = sortEmails(emailA, emailB);

  const slugA = makeEmailSlug(first);
  const slugB = makeEmailSlug(second);

  return `conv_${itemId}_${slugA}_${slugB}`;
}

/**
 * Ambil ID canonical jika ada conversation lama yang sudah diarahkan ke room baru.
 */
export function getCanonicalConversationId(conversationId) {
  const aliasMap = readAliasMap();

  return aliasMap[conversationId] || conversationId;
}

/**
 * Baca semua conversations dari localStorage.
 */
export function readConversations() {
  try {
    return JSON.parse(localStorage.getItem("temuConversations") || "[]");
  } catch {
    return [];
  }
}

/**
 * Tulis semua conversations ke localStorage.
 */
export function writeConversations(convs) {
  localStorage.setItem("temuConversations", JSON.stringify(convs));
  window.dispatchEvent(new Event("temuStorage"));
}

/**
 * Cari conversation berdasarkan pasangan user.
 */
export function findConversationByParticipants(emailA, emailB) {
  const convs = readConversations();

  return (
    convs
      .filter((conversation) =>
        conversationMatchesParticipants(conversation, emailA, emailB)
      )
      .sort((a, b) => getConversationTime(b) - getConversationTime(a))[0] ||
    null
  );
}

/**
 * Cari conversation berdasarkan ID.
 * Sudah support alias untuk conversation lama.
 */
export function findConversationById(conversationId) {
  const convs = readConversations();
  const canonicalId = getCanonicalConversationId(conversationId);

  return (
    convs.find((conversation) => conversation.id === canonicalId) ||
    convs.find((conversation) => conversation.id === conversationId) ||
    null
  );
}

/**
 * Cari atau buat conversation.
 *
 * Logic baru:
 * - Jika akun A dan akun B sudah pernah chat, pakai room yang sama.
 * - Jika item baru dibahas oleh pasangan user yang sama, update active item.
 * - Jika ada conversation lama yang duplikat untuk pasangan user yang sama,
 *   sistem akan memakai conversation terbaru sebagai room utama.
 *
 * @param {object} params
 * @param {string|number} params.itemId
 * @param {string}        params.itemTitle
 * @param {string|null}   params.itemImage
 * @param {string}        params.itemType
 * @param {string}        params.currentUserEmail
 * @param {string}        params.currentUserName
 * @param {string}        params.otherEmail
 * @param {string}        params.otherName
 * @returns {string} conversationId
 */
export function getOrCreateConversation({
  itemId,
  itemTitle,
  itemImage,
  itemType = "",
  currentUserEmail,
  currentUserName,
  otherEmail,
  otherName,
}) {
  const normalizedCurrentEmail = normalizeEmail(currentUserEmail);
  const normalizedOtherEmail = normalizeEmail(otherEmail);

  if (!normalizedCurrentEmail || !normalizedOtherEmail) {
    console.warn("[conversationUtils] Missing participant email.", {
      currentUserEmail,
      otherEmail,
    });

    return "";
  }

  if (normalizedCurrentEmail === normalizedOtherEmail) {
    console.warn("[conversationUtils] Cannot create conversation with self.", {
      currentUserEmail,
      otherEmail,
    });

    return "";
  }

  const stableConversationId = makeConversationId(
    itemId,
    normalizedCurrentEmail,
    normalizedOtherEmail
  );

  const now = new Date().toISOString();
  const convs = readConversations();
  const aliasMap = readAliasMap();

  const matchingIndexes = convs
    .map((conversation, index) => ({
      conversation,
      index,
    }))
    .filter(({ conversation }) =>
      conversationMatchesParticipants(
        conversation,
        normalizedCurrentEmail,
        normalizedOtherEmail
      )
    );

  const itemEntry = createItemHistoryEntry({
    itemId,
    itemTitle,
    itemImage,
    itemType,
  });

  if (matchingIndexes.length === 0) {
    const newConv = {
      id: stableConversationId,

      // Active item yang sedang dibahas sekarang.
      itemId,
      itemTitle,
      itemImage: itemImage || null,
      itemType,

      activeItemId: itemId,
      activeItemTitle: itemTitle,
      activeItemImage: itemImage || null,
      activeItemType: itemType,

      itemHistory: itemEntry ? [itemEntry] : [],

      pairKey: getPairKey(normalizedCurrentEmail, normalizedOtherEmail),
      participants: [normalizedCurrentEmail, normalizedOtherEmail],
      participantNames: {
        [normalizedCurrentEmail]:
          currentUserName || safeNameFromEmail(normalizedCurrentEmail),
        [normalizedOtherEmail]: otherName || safeNameFromEmail(normalizedOtherEmail),
      },

      createdAt: now,
      updatedAt: now,

      lastMessage: null,
      lastMessageAt: null,
      lastMessageSender: null,

      readBy: [],
      messages: [],
      status: "open",
      resolvedAt: null,
      closedAt: null,
    };

    writeConversations([newConv, ...convs]);
    return newConv.id;
  }

  const exactStableIndex = matchingIndexes.find(
    ({ conversation }) => conversation.id === stableConversationId
  );

  const primaryIndex = exactStableIndex
    ? exactStableIndex.index
    : matchingIndexes
      .slice()
      .sort(
        (a, b) =>
          getConversationTime(b.conversation) -
          getConversationTime(a.conversation)
      )[0].index;

  const primaryConversation = convs[primaryIndex];

  const duplicateIndexes = matchingIndexes
    .map(({ index }) => index)
    .filter((index) => index !== primaryIndex);

  let mergedConversation = { ...primaryConversation };

  duplicateIndexes.forEach((duplicateIndex) => {
    const duplicate = convs[duplicateIndex];

    aliasMap[duplicate.id] = mergedConversation.id;

    mergedConversation = {
      ...mergedConversation,

      participants: mergeUniqueArray(
        mergedConversation.participants,
        duplicate.participants
      ),

      participantNames: {
        ...(duplicate.participantNames || {}),
        ...(mergedConversation.participantNames || {}),
      },

      readBy: mergeReadBy(mergedConversation.readBy, duplicate.readBy),

      messages: mergeMessages(
        mergedConversation.messages || [],
        duplicate.messages || []
      ),

      itemHistory: [
        ...(Array.isArray(mergedConversation.itemHistory)
          ? mergedConversation.itemHistory
          : []),
        ...(Array.isArray(duplicate.itemHistory) ? duplicate.itemHistory : []),
      ],

      createdAt:
        getConversationTime(duplicate) < getConversationTime(mergedConversation)
          ? duplicate.createdAt || mergedConversation.createdAt
          : mergedConversation.createdAt,
    };
  });

  if (mergedConversation.id !== stableConversationId) {
    aliasMap[stableConversationId] = mergedConversation.id;
  }

  const alreadyHasThisItem = hasItemInHistory(mergedConversation, itemId);

  const shouldAddCaseEvent =
    itemId &&
    !alreadyHasThisItem &&
    Array.isArray(mergedConversation.messages) &&
    mergedConversation.messages.length > 0;

  const caseEvent = shouldAddCaseEvent
    ? createCaseStartedEvent({
      itemId,
      itemTitle,
    })
    : null;

  const nextMessages = caseEvent
    ? mergeMessages(mergedConversation.messages || [], [caseEvent])
    : mergedConversation.messages || [];

  const nextItemHistory = mergeItemHistory(
    mergedConversation.itemHistory,
    itemEntry
  );

  const isNewActiveItem =
    itemId &&
    mergedConversation.itemId?.toString() !== itemId?.toString();

  const shouldReopenForNewCase =
    isNewActiveItem && mergedConversation.status !== "open";

  const updatedConversation = {
    ...mergedConversation,

    // Tetap gunakan ID utama yang sudah ada agar link lama tidak langsung rusak.
    id: mergedConversation.id,

    // Active item terbaru.
    itemId,
    itemTitle,
    itemImage: itemImage || null,
    itemType,

    activeItemId: itemId,
    activeItemTitle: itemTitle,
    activeItemImage: itemImage || null,
    activeItemType: itemType,

    itemHistory: nextItemHistory,

    pairKey: getPairKey(normalizedCurrentEmail, normalizedOtherEmail),
    participants: mergeUniqueArray(
      [normalizedCurrentEmail, normalizedOtherEmail],
      mergedConversation.participants || []
    ),

    participantNames: {
      ...(mergedConversation.participantNames || {}),
      [normalizedCurrentEmail]:
        currentUserName ||
        mergedConversation.participantNames?.[normalizedCurrentEmail] ||
        safeNameFromEmail(normalizedCurrentEmail),
      [normalizedOtherEmail]:
        otherName ||
        mergedConversation.participantNames?.[normalizedOtherEmail] ||
        safeNameFromEmail(normalizedOtherEmail),
    },

    messages: nextMessages,

    updatedAt: now,

    status: shouldReopenForNewCase
      ? "open"
      : mergedConversation.status || "open",

    resolvedAt: shouldReopenForNewCase
      ? null
      : mergedConversation.resolvedAt || null,

    closedAt: shouldReopenForNewCase
      ? null
      : mergedConversation.closedAt || null,

    lastMessage: caseEvent
      ? caseEvent.label
      : mergedConversation.lastMessage || null,

    lastMessageAt: caseEvent
      ? caseEvent.sentAt
      : mergedConversation.lastMessageAt || null,

    lastMessageSender: caseEvent
      ? "system"
      : mergedConversation.lastMessageSender || null,

    readBy: caseEvent ? [] : mergedConversation.readBy || [],
  };

  const cleanedConversations = convs.filter(
    (_, index) => !duplicateIndexes.includes(index)
  );

  const updatedConversations = cleanedConversations.map((conversation, index) =>
    index === primaryIndex ||
      conversation.id === updatedConversation.id
      ? updatedConversation
      : conversation
  );

  const hasUpdatedConversation = updatedConversations.some(
    (conversation) => conversation.id === updatedConversation.id
  );

  const finalConversations = hasUpdatedConversation
    ? updatedConversations
    : [updatedConversation, ...updatedConversations];

  writeAliasMap(aliasMap);
  writeConversations(finalConversations);

  return updatedConversation.id;
}

/**
 * Update active item pada conversation yang sudah ada.
 * Ini berguna kalau nanti ChatRoom butuh mengganti item aktif tanpa membuat room baru.
 */
export function updateConversationActiveItem(conversationId, itemData = {}) {
  const convs = readConversations();
  const canonicalId = getCanonicalConversationId(conversationId);

  const index = convs.findIndex(
    (conversation) =>
      conversation.id === canonicalId || conversation.id === conversationId
  );

  if (index === -1) {
    return false;
  }

  const conversation = convs[index];

  const itemEntry = createItemHistoryEntry({
    itemId: itemData.itemId,
    itemTitle: itemData.itemTitle,
    itemImage: itemData.itemImage,
    itemType: itemData.itemType || "",
  });

  const updatedConversation = {
    ...conversation,

    itemId: itemData.itemId,
    itemTitle: itemData.itemTitle,
    itemImage: itemData.itemImage || null,
    itemType: itemData.itemType || "",

    activeItemId: itemData.itemId,
    activeItemTitle: itemData.itemTitle,
    activeItemImage: itemData.itemImage || null,
    activeItemType: itemData.itemType || "",

    itemHistory: mergeItemHistory(conversation.itemHistory, itemEntry),

    updatedAt: new Date().toISOString(),
  };

  const updatedConvs = [...convs];
  updatedConvs[index] = updatedConversation;

  writeConversations(updatedConvs);

  return true;
}