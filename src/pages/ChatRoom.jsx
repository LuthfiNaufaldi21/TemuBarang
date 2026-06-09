import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { chatAPI, postsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../hooks/useChat";

function formatMessageTime(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateLabel(isoString) {
  if (!isoString) return "";

  const date = new Date(isoString);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const diffDays = Math.round(
    (today - target) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function groupByDate(messages) {
  const groups = [];
  let currentDate = null;
  messages.forEach((msg) => {
    const safeDate = msg.sent_at || new Date().toISOString();
    const dateKey = new Date(safeDate).toDateString();
    if (dateKey !== currentDate) {
      currentDate = dateKey;
      groups.push({
        type: "date",
        label: formatDateLabel(safeDate),
        key: dateKey,
      });
    }
    groups.push({ type: "message", ...msg });
  });
  return groups;
}

function getMyId() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(b64)).sub || null;
  } catch {
    return null;
  }
}

function WsStatusBadge({ status }) {
  const map = {
    connected: { dot: "bg-[#9CC88D]", text: "Online" },
    connecting: { dot: "bg-yellow-400 animate-pulse", text: "Menghubungkan..." },
    reconnecting: { dot: "bg-yellow-400 animate-pulse", text: "Reconnecting..." },
    failed: { dot: "bg-red-500", text: "Offline" },
  };
  const cfg = map[status] || map.connecting;
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      <span className="text-[#86948A] text-xs">{cfg.text}</span>
    </span>
  );
}

function TypingIndicator({ name }) {
  return (
    <div className="flex items-end gap-2 mb-1">
      <div className="w-7 h-7 rounded-full bg-[#164A41] border border-[#4D774E] flex items-center justify-center text-[10px] font-bold text-[#9CC88D] shrink-0 mb-1">
        {name.substring(0, 2).toUpperCase()}
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-[#1E2820] border border-[#3C4A42]/50 flex items-center gap-1.5">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="w-1.5 h-1.5 rounded-full bg-[#86948A] animate-bounce"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function ChatRoom() {
  const navigate = useNavigate();
  const { conversationId: roomId } = useParams();
  const { user } = useAuth();
  const myId = user?.id || getMyId();

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [showResolveConfirm, setShowResolveConfirm] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
  const [menuMsgId, setMenuMsgId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);

  const messageIdsRef = useRef(new Set());

  const load = useCallback(async () => {
    try {
      const [roomsData, msgsData] = await Promise.all([
        chatAPI.getRooms(),
        chatAPI.getMessages(roomId),
      ]);
      const currentRoom = (roomsData.rooms || []).find(
        (r) => r.room_id == roomId
      );
      setRoom(currentRoom || null);
      if (currentRoom?.posts?.is_resolved) {
        setIsResolved(true);
      }
      const msgs = msgsData.messages || [];
      setMessages(msgs);
      messageIdsRef.current = new Set(msgs.map((m) => m.message_id));
    } catch {
      // error diabaikan
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!menuMsgId) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuMsgId(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuMsgId]);

  const handleWsMessage = useCallback((message) => {
    if (!message?.message_id) return;
    if (messageIdsRef.current.has(message.message_id)) return;
    messageIdsRef.current.add(message.message_id);
    setMessages((prev) => [...prev, message]);
  }, []);

  const handleWsDeleted = useCallback(
    ({ message_id, deleted_for }) => {
      if (deleted_for === "everyone") {
        setMessages((prev) =>
          prev.map((m) =>
            m.message_id === message_id
              ? { ...m, message_body: "🚫 Pesan ini telah dihapus", deleted_for: "everyone" }
              : m
          )
        );
      } else if (deleted_for === myId) {
        setMessages((prev) => prev.filter((m) => m.message_id !== message_id));
        messageIdsRef.current.delete(message_id);
      }
    },
    [myId]
  );

  const {
  wsStatus,
  otherTyping,
  sendViaWs,
  sendTyping,
  lastError,
  } = useChat({
    roomId,
    myId,
    onMessage: handleWsMessage,
    onMessageDeleted: handleWsDeleted,
  });

  const typingTimeoutRef = useRef(null);
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    sendTyping(true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => sendTyping(false), 2000);
  };

  const handleSend = async () => {
    if (isResolved) return;
    const text = inputText.trim();
    if (!text) return;
    setSending(true);
    sendTyping(false);
    clearTimeout(typingTimeoutRef.current);

    const sentViaWs = sendViaWs(text);

    if (sentViaWs) {
      setInputText("");
      setTimeout(() => inputRef.current?.focus(), 0);
      setSending(false);
    } else {
      try {
        const data = await chatAPI.sendMessage(roomId, text);
        const newMsg = data.message;
        if (newMsg && !messageIdsRef.current.has(newMsg.message_id)) {
          messageIdsRef.current.add(newMsg.message_id);
          setMessages((prev) => [...prev, newMsg]);
        }
        setInputText("");
        setTimeout(() => inputRef.current?.focus(), 0);
      } catch (err) {
        alert(err.message);
      } finally {
        setSending(false);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDelete = async (messageId, deleteFor) => {
    setMenuMsgId(null);
    try {
      await chatAPI.deleteMessage(roomId, messageId, deleteFor);
      if (deleteFor === "everyone") {
        setMessages((prev) =>
          prev.map((m) =>
            m.message_id === messageId
              ? { ...m, message_body: "🚫 Pesan ini telah dihapus", deleted_for: "everyone" }
              : m
          )
        );
      } else {
        setMessages((prev) => prev.filter((m) => m.message_id !== messageId));
        messageIdsRef.current.delete(messageId);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResolve = async () => {
    if (!room?.posts?.post_id) return;
    setResolving(true);
    try {
      await postsAPI.resolve(room.posts.post_id);
      setIsResolved(true);
      setShowResolveConfirm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-[#0E1511] items-center justify-center text-white">
        <div className="w-8 h-8 border-2 border-[#9CC88D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex flex-col h-screen bg-[#0E1511] items-center justify-center gap-4 text-white">
        <h2 className="text-2xl font-bold text-[#DDE4DD]">Conversation not found</h2>
        <button onClick={() => navigate("/messages")} className="px-6 py-2 bg-[#164A41] rounded-lg">
          Back to Messages
        </button>
      </div>
    );
  }

  const otherName = room
    ? (myId === room.initiator_id
        ? room.post_owner?.full_name
        : room.initiator?.full_name) || "Unknown"
    : "Unknown";
  const otherInitial = otherName.substring(0, 2).toUpperCase();
  const allItems = groupByDate(messages);

  // Siapa yang bisa resolve: post owner (posts.user_id)
  const postOwnerId = room?.post_owner_id;
  const isPostOwner = String(myId) === String(postOwnerId);
  const showResolveBtn = isPostOwner && !isResolved;

  return (
    <div className="flex h-screen bg-[#0E1511] text-white overflow-hidden">
      <Sidebar activePage="messages" />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="bg-[#1A211D] border-b border-[#27272A] px-4 py-3 flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate("/messages")}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#86948A] hover:text-[#DDE4DD] hover:bg-[#164A41]/40 transition-all shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="w-9 h-9 rounded-full bg-[#164A41] border border-[#4D774E] flex items-center justify-center text-sm font-bold text-[#9CC88D] shrink-0">
            {otherInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#DDE4DD] text-sm font-semibold leading-tight truncate">{otherName}</p>
            <WsStatusBadge status={wsStatus} />
          </div>
        </div>

        {/* Item context bar */}
        {room.posts && (
          <button
            type="button"
            onClick={() => navigate(`/item/${room.posts.post_id}`)}
            className="bg-[#0E1511] border-b border-[#27272A]/50 px-6 py-2.5 flex items-center gap-3 text-left hover:bg-[#101A13] transition-colors"
          >
            {room.posts.item_image && (
              <img
                src={room.posts.item_image}
                alt={room.posts.caption}
                className="w-8 h-8 rounded-md object-cover border border-[#3C4A42]"
              />
            )}
            <span className="text-[#86948A] text-xs truncate">
              Regarding:{" "}
              <span className="text-[#DDE4DD] font-medium">{room.posts.caption}</span>
            </span>
            {isResolved && (
              <span className="ml-auto shrink-0 text-[10px] font-semibold text-[#9CC88D] bg-[#164A41]/60 border border-[#4D774E]/50 px-2 py-0.5 rounded-full">
                RESOLVED
              </span>
            )}
          </button>
        )}

        {/* Resolve button banner — hanya untuk post owner, sebelum resolved */}
        {showResolveBtn && (
          <div className="bg-[#0F1A10] border-b border-[#4D774E]/40 px-4 py-3 flex items-center justify-between gap-3 shrink-0">
            <div className="flex-1 min-w-0">
              <p className="text-[#9CC88D] text-xs font-semibold">
                {room.posts?.report_type === "LOST" ? "Sudah ketemu barangnya?" : "Sudah ketemu pemiliknya?"}
              </p>
              <p className="text-[#86948A] text-[11px] mt-0.5 leading-snug">
                Tekan tombol ini <span className="text-amber-400/80 font-medium">hanya jika sudah benar-benar yakin</span> — chat akan terkunci dan laporan akan ditutup.
              </p>
            </div>
            <button
              onClick={() => setShowResolveConfirm(true)}
              className="shrink-0 px-3 py-1.5 bg-[#164A41] hover:bg-[#1d5c51] border border-[#4D774E] rounded-lg text-[#9CC88D] text-xs font-semibold transition-colors"
            >
              Mark as Resolved
            </button>
          </div>
        )}

        {/* Locked banner — setelah resolved */}
        {isResolved && (
          <div className="bg-[#1A211D]/80 border-b border-[#3C4A42]/50 px-4 py-2.5 flex items-center justify-center gap-2 shrink-0">
            <svg className="w-3.5 h-3.5 text-[#4D774E]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1C8.676 1 6 3.676 6 7v1H4v14h16V8h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v1H8V7c0-2.276 1.724-4 4-4zm0 9a2 2 0 110 4 2 2 0 010-4z"/>
            </svg>
            <span className="text-[#4D774E] text-xs font-medium">Chat ini sudah ditutup — laporan telah diselesaikan</span>
          </div>
        )}

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 80%, rgba(22,74,65,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(156,200,141,0.04) 0%, transparent 50%)",
          }}
        >
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
              <div className="text-center">
                <p className="text-[#86948A] text-base font-medium">Start the conversation</p>
              </div>
            </div>
          ) : (
            allItems.map((item, idx) => {
              if (item.type === "date") {
                return (
                  <div key={item.key} className="flex items-center gap-4 my-4">
                    <div className="flex-1 h-px bg-[#27272A]" />
                    <span className="text-[#3C4A42] text-xs font-semibold tracking-wide px-3 py-1 bg-[#1A211D] rounded-full border border-[#27272A]">
                      {item.label}
                    </span>
                    <div className="flex-1 h-px bg-[#27272A]" />
                  </div>
                );
              }

              if (
                item.deleted_for &&
                Array.isArray(item.deleted_for) &&
                item.deleted_for.includes(myId)
              ) {
                return null;
              }

              const isMe = String(item.sender_id) === String(myId);
              const isDeleted =
                item.message_body === "🚫 Pesan ini telah dihapus" ||
                item.deleted_for === "everyone";
              const isMenuOpen = menuMsgId === item.message_id;

              return (
                <div
                  key={item.message_id || idx}
                  className={`flex items-end gap-2 mb-1 group ${isMe ? "flex-row-reverse" : "flex-row"}`}
                >
                  {!isMe && (
                    <div className="w-7 h-7 rounded-full bg-[#164A41] border border-[#4D774E] flex items-center justify-center text-[10px] font-bold text-[#9CC88D] shrink-0 mb-1">
                      {otherInitial}
                    </div>
                  )}

                  <div className={`max-w-[70%] flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
                    <div className={`flex items-center gap-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-all whitespace-pre-wrap overflow-hidden max-w-full ${
                          isDeleted
                            ? "bg-[#1A211D] border border-[#3C4A42]/30 text-[#4D5C50] italic"
                            : isMe
                              ? "bg-[#164A41] text-[#DDE4DD] rounded-br-sm"
                              : "bg-[#1E2820] border border-[#3C4A42]/50 text-[#DDE4DD] rounded-bl-sm"
                        }`}
                      >
                        {isDeleted ? "🚫 Pesan ini telah dihapus" : item.message_body}
                      </div>

                      {!isDeleted && !isResolved && (
                        <div className="relative">
                          <button
                            onClick={() => setMenuMsgId(isMenuOpen ? null : item.message_id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 text-[#86948A]"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <circle cx="5" cy="12" r="1.5" />
                              <circle cx="12" cy="12" r="1.5" />
                              <circle cx="19" cy="12" r="1.5" />
                            </svg>
                          </button>

                          {isMenuOpen && (
                            <div
                              ref={menuRef}
                              className={`absolute z-50 bottom-8 ${isMe ? "right-0" : "left-0"} w-48 bg-[#1E2820] border border-[#3C4A42] rounded-xl shadow-2xl overflow-hidden`}
                            >
                              <button
                                onClick={() => handleDelete(item.message_id, "me")}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#A1A1AA] hover:bg-white/5 hover:text-[#DDE4DD] transition-colors"
                              >
                                Hapus untuk saya
                              </button>
                              {isMe && (
                                <button
                                  onClick={() => handleDelete(item.message_id, "everyone")}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#FFB4AB] hover:bg-red-500/10 transition-colors border-t border-[#3C4A42]"
                                >
                                  Hapus untuk semua
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <span className="text-[#3C4A42] text-[10px] px-1">
                      {formatMessageTime(item.sent_at)}
                    </span>
                  </div>

                  {isMe && <div className="w-7 shrink-0" />}
                </div>
              );
            })
          )}

          {otherTyping && !isResolved && <TypingIndicator name={otherName} />}

          <div ref={messagesEndRef} />
        </div>

        {/* Input — disabled jika resolved */}
        <div className="bg-[#1A211D] border-t border-[#27272A] px-4 py-3 shrink-0">
          {lastError && (
            <div className="mb-2 px-3 py-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
              {lastError}
            </div>
        )}
          {isResolved ? (
            <div className="flex items-center justify-center py-2">
              <span className="text-[#3C4A42] text-xs">Chat ini sudah ditutup</span>
            </div>
          ) : (
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${otherName}...`}
                  rows={1}
                  className="w-full bg-[#0E1511] border border-[#3C4A42] focus:border-[#9CC88D]/60 rounded-2xl px-4 py-3 text-[#DDE4DD] text-sm placeholder-[#4D5C50] focus:outline-none transition-colors resize-none leading-relaxed max-h-32"
                  style={{ minHeight: "44px" }}
                  onInput={(e) => {
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
                  }}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || sending}
                className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  inputText.trim() && !sending
                    ? "bg-[#9CC88D] hover:bg-[#8bb47d] text-[#13342E] hover:scale-105"
                    : "bg-[#27272A] text-[#3C4A42] cursor-not-allowed"
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirm dialog Mark as Resolved */}
      {showResolveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#1A211D] border border-[#3C4A42] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#164A41] border border-[#4D774E] flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-[#9CC88D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-[#DDE4DD] text-sm font-semibold">Tandai sebagai Selesai?</p>
                <p className="text-[#86948A] text-xs mt-0.5">Tindakan ini tidak bisa dibatalkan</p>
              </div>
            </div>
            <p className="text-[#86948A] text-xs leading-relaxed mb-5">
              Pastikan kamu sudah benar-benar yakin barang telah ditemukan/dikembalikan ke pemiliknya.
              Setelah ini <span className="text-amber-400/80 font-medium">chat akan terkunci</span> dan{" "}
              <span className="text-amber-400/80 font-medium">laporan akan dihapus dari daftar</span>.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResolveConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#3C4A42] text-[#86948A] text-sm hover:bg-white/5 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleResolve}
                disabled={resolving}
                className="flex-1 py-2.5 rounded-xl bg-[#164A41] hover:bg-[#1d5c51] border border-[#4D774E] text-[#9CC88D] text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {resolving ? "Memproses..." : "Ya, Selesai"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}