const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function getToken() {
  return localStorage.getItem("token");
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`${BASE_URL}/api${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || "Terjadi kesalahan");
  return data;
}

export const authAPI = {
  login: (email, password) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (payload) =>
    request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  getProfile: () => request("/auth/me"),
  updateProfile: (payload) =>
    request("/auth/me", { method: "PATCH", body: JSON.stringify(payload) }),
};

export const postsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/posts${query ? `?${query}` : ""}`);
  },
  getMy: () => request("/posts/my"),
  getById: (id) => request(`/posts/${id}`),
  create: (payload) =>
    request("/posts", {
      method: "POST",
      body: JSON.stringify({
        report_type: payload.type,
        caption: payload.title,
        category: payload.category,
        building_location: payload.location,
        detailed_location: payload.storage_location || null,
        occurrence_time: payload.date ? new Date(payload.date).toISOString() : null,
        item_image: payload.image_url || null,
      }),
    }),
  update: (id, payload) =>
    request(`/posts/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        caption: payload.title,
        category: payload.category,
        building_location: payload.location,
        detailed_location: payload.storage_location || null,
        occurrence_time: payload.date ? new Date(payload.date).toISOString() : null,
        item_image: payload.image_url || null,
      }),
    }),
  delete: (id) => request(`/posts/${id}`, { method: "DELETE" }),
  resolve: (id) => request(`/posts/${id}/resolve`, { method: "PATCH" }),
};

export const chatAPI = {
  getRooms: () => request("/chat/rooms"),
  getOrCreateRoom: (post_id) =>
    request("/chat/rooms", { method: "POST", body: JSON.stringify({ post_id }) }),
  getMessages: (room_id) => request(`/chat/rooms/${room_id}/messages`),
  sendMessage: (room_id, message_body) =>
    request(`/chat/rooms/${room_id}/messages`, {
      method: "POST",
      body: JSON.stringify({ message_body }),
    }),
  // --- FUNGSI HAPUS PESAN DITAMBAHKAN DI SINI ---
  deleteMessage: (room_id, message_id, delete_for) =>
    request(`/chat/rooms/${room_id}/messages/${message_id}`, {
      method: "DELETE",
      body: JSON.stringify({ delete_for }),
    }),
};

export const watchlistAPI = {
  getAll: () => request("/watchlist"),
  add: (payload) =>
    request("/watchlist", { method: "POST", body: JSON.stringify(payload) }),
  remove: (id) => request(`/watchlist/${id}`, { method: "DELETE" }),
};

export const notificationsAPI = {
  getAll: () => request("/notifications"),
  markRead: (id) => request(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllRead: () => request("/notifications/read-all", { method: "PATCH" }),
};

export const adminAPI = {
  getAllPosts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/posts${query ? `?${query}` : ""}`);
  },
  deletePost: (id) => request(`/admin/posts/${id}`, { method: "DELETE" }),
  getAllUsers: () => request("/admin/users"),
};

export async function uploadImageAPI(file) {
  const token = getToken();
  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch(`${BASE_URL}/api/upload/image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload gagal");
  return data.url;
}