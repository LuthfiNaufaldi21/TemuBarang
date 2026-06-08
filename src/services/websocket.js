const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const WS_URL =
  import.meta.env.VITE_WS_URL ||
  BASE_URL.replace(/^http/, "ws").replace(/\/api$/, "");

const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 10;
const PING_INTERVAL_MS = 25000;

class WebSocketService {
  constructor() {
    this._ws = null;
    this._authenticated = false;
    this._reconnectAttempts = 0;
    this._reconnectTimer = null;
    this._pingTimer = null;
    this._shouldConnect = false;
    this._listeners = new Map();
    this._queue = [];
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  connect(token) {
    this._token = token;
    this._shouldConnect = true;
    this._reconnectAttempts = 0;
    this._openSocket();
  }

  disconnect() {
    this._shouldConnect = false;
    this._authenticated = false;
    this._clearTimers();
    if (this._ws) {
      this._ws.onclose = null;
      this._ws.close(1000, "User disconnected");
      this._ws = null;
    }
  }

  get isReady() {
    return this._ws?.readyState === WebSocket.OPEN && this._authenticated;
  }

  joinRoom(roomId) {
    this._sendOrQueue({ type: "join_room", room_id: roomId });
  }

  leaveRoom(roomId) {
    this._send({ type: "leave_room", room_id: roomId });
  }

  sendMessage(roomId, messageBody) {
    this._sendOrQueue({
      type: "send_message",
      room_id: roomId,
      message_body: messageBody,
    });
  }

  sendTyping(roomId, isTyping) {
    this._send({ type: "typing", room_id: roomId, is_typing: isTyping });
  }

  // ─── Event System ─────────────────────────────────────────────────────────

  on(event, handler) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    this._listeners.get(event)?.delete(handler);
  }

  // ─── Internal ─────────────────────────────────────────────────────────────

  _openSocket() {
    if (this._ws && this._ws.readyState === WebSocket.OPEN) return;

    try {
      this._ws = new WebSocket(WS_URL);
    } catch (err) {
      console.error("[WS] Gagal membuat koneksi:", err);
      this._scheduleReconnect();
      return;
    }

    this._ws.onopen = () => {
      console.info("[WS] Terhubung →", WS_URL);
      this._reconnectAttempts = 0;
      this._emit("ws_open");
      this._send({ type: "authenticate", token: this._token });
      this._startPing();
    };

    this._ws.onmessage = (event) => {
      let payload;
      try {
        payload = JSON.parse(event.data);
      } catch {
        return;
      }
      this._handleMessage(payload);
    };

    this._ws.onerror = (err) => {
      console.warn("[WS] Error:", err);
      this._emit("ws_error", err);
    };

    this._ws.onclose = (event) => {
      console.warn("[WS] Terputus. Code:", event.code);
      this._authenticated = false;
      this._clearTimers();
      this._emit("ws_close", event);
      if (this._shouldConnect) this._scheduleReconnect();
    };
  }

  _handleMessage(payload) {
    const { type, ...rest } = payload;

    if (type === "authenticated") {
      this._authenticated = true;
      console.info("[WS] Terautentikasi.");
      this._emit("ws_ready");
      this._flushQueue();
      return;
    }

    if (type === "pong") return;

    this._emit(type, rest);
  }

  _emit(event, data) {
    this._listeners.get(event)?.forEach((fn) => {
      try { fn(data); } catch (err) {
        console.error(`[WS] Handler error untuk event "${event}":`, err);
      }
    });
  }

  _send(data) {
    if (this._ws?.readyState === WebSocket.OPEN) {
      this._ws.send(JSON.stringify(data));
    }
  }

  _sendOrQueue(data) {
    if (this.isReady) {
      this._send(data);
    } else {
      this._queue.push(data);
    }
  }

  _flushQueue() {
    while (this._queue.length > 0) {
      this._send(this._queue.shift());
    }
  }

  _scheduleReconnect() {
    if (this._reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error("[WS] Batas maksimum reconnect tercapai.");
      this._emit("ws_failed");
      return;
    }
    this._reconnectAttempts++;
    const delay = RECONNECT_DELAY_MS * Math.min(this._reconnectAttempts, 5);
    console.info(`[WS] Reconnect ke-${this._reconnectAttempts} dalam ${delay}ms...`);
    this._reconnectTimer = setTimeout(() => this._openSocket(), delay);
  }

  _startPing() {
    this._pingTimer = setInterval(() => {
      this._send({ type: "ping" });
    }, PING_INTERVAL_MS);
  }

  _clearTimers() {
    clearTimeout(this._reconnectTimer);
    clearInterval(this._pingTimer);
    this._reconnectTimer = null;
    this._pingTimer = null;
  }
}

// Singleton
export const wsService = new WebSocketService();
