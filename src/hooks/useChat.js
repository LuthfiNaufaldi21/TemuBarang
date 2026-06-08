import { useEffect, useRef, useCallback, useState } from "react";
import { wsService } from "../services/websocket";

/**
 * useChat — Hook untuk real-time chat di dalam satu room.
 *
 * @param {string|number} roomId   — ID room yang sedang dibuka
 * @param {string}        myId     — ID user yang login
 * @param {Function}      onMessage        — callback(message) saat pesan baru masuk dari WS
 * @param {Function}      onMessageDeleted — callback({ message_id, deleted_for })
 * @returns {{ wsReady, otherTyping, sendViaWs, sendTyping, wsStatus }}
 */
export function useChat({ roomId, myId, onMessage, onMessageDeleted }) {
  const [wsReady, setWsReady] = useState(wsService.isReady);
  const [wsStatus, setWsStatus] = useState(
    wsService.isReady ? "connected" : "connecting"
  );
  const [otherTyping, setOtherTyping] = useState(false);

  const typingTimerRef = useRef(null);
  const roomIdRef = useRef(roomId);
  roomIdRef.current = roomId;

  // ── Hubungkan ke WebSocket dan join room ──────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (!wsService.isReady) {
      wsService.connect(token);
    }

    const unsubOpen = wsService.on("ws_open", () => setWsStatus("connecting"));
    const unsubReady = wsService.on("ws_ready", () => {
      setWsReady(true);
      setWsStatus("connected");
      wsService.joinRoom(roomIdRef.current);
    });
    const unsubClose = wsService.on("ws_close", () => {
      setWsReady(false);
      setWsStatus("reconnecting");
    });
    const unsubFailed = wsService.on("ws_failed", () => setWsStatus("failed"));

    // Jika sudah ready, langsung join room
    if (wsService.isReady) {
      setWsReady(true);
      setWsStatus("connected");
      wsService.joinRoom(roomId);
    }

    return () => {
      wsService.leaveRoom(roomIdRef.current);
      unsubOpen();
      unsubReady();
      unsubClose();
      unsubFailed();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // ── Listener pesan masuk ──────────────────────────────────────────────────
  useEffect(() => {
    const unsub = wsService.on("message", ({ room_id, message }) => {
      if (String(room_id) !== String(roomIdRef.current)) return;
      if (message && typeof onMessage === "function") {
        onMessage(message);
      }
    });
    return unsub;
  }, [onMessage]);

  // ── Listener pesan dihapus ────────────────────────────────────────────────
  useEffect(() => {
    const unsub = wsService.on(
      "message_deleted",
      ({ room_id, message_id, deleted_for }) => {
        if (String(room_id) !== String(roomIdRef.current)) return;
        if (typeof onMessageDeleted === "function") {
          onMessageDeleted({ message_id, deleted_for });
        }
      }
    );
    return unsub;
  }, [onMessageDeleted]);

  // ── Listener typing indicator ─────────────────────────────────────────────
  useEffect(() => {
    const unsub = wsService.on(
      "typing",
      ({ room_id, user_id, is_typing }) => {
        if (String(room_id) !== String(roomIdRef.current)) return;
        if (String(user_id) === String(myId)) return;

        setOtherTyping(is_typing);

        clearTimeout(typingTimerRef.current);
        if (is_typing) {
          typingTimerRef.current = setTimeout(
            () => setOtherTyping(false),
            3000
          );
        }
      }
    );
    return () => {
      unsub();
      clearTimeout(typingTimerRef.current);
    };
  }, [myId]);

  // ── API untuk komponen ────────────────────────────────────────────────────

  const sendViaWs = useCallback(
    (messageBody) => {
      if (!wsService.isReady) return false;
      wsService.sendMessage(roomId, messageBody);
      return true;
    },
    [roomId]
  );

  const sendTyping = useCallback(
    (isTyping) => {
      if (wsService.isReady) {
        wsService.sendTyping(roomId, isTyping);
      }
    },
    [roomId]
  );

  return { wsReady, wsStatus, otherTyping, sendViaWs, sendTyping };
}
