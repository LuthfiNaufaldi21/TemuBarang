import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { adminAPI } from "../services/api";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminDashboard() {
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("posts");

  useEffect(() => {
    Promise.all([adminAPI.getAllPosts(), adminAPI.getAllUsers()])
      .then(([postsData, usersData]) => {
        setPosts(postsData.posts || []);
        setUsers(usersData.users || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (filter !== "ALL" && p.report_type !== filter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (p.caption || "").toLowerCase().includes(q) || (p.building_location || "").toLowerCase().includes(q);
    });
  }, [posts, filter, search]);

  const stats = useMemo(() => ({
    total: posts.length,
    lost: posts.filter((p) => p.report_type === "LOST").length,
    found: posts.filter((p) => p.report_type === "FOUND").length,
    resolved: posts.filter((p) => p.is_resolved).length,
  }), [posts]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this post?")) return;
    try {
      await adminAPI.deletePost(id);
      setPosts((prev) => prev.filter((p) => p.post_id !== id));
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="flex h-[100dvh] min-h-0 bg-[#0E1511] text-white overflow-hidden">
      <Sidebar activePage="admin" />
      <div className="flex-1 min-w-0 min-h-0 flex flex-col h-full overflow-hidden">
        <TopBar />
        <main className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-[calc(7rem+env(safe-area-inset-bottom))] md:p-8">
          <div className="max-w-7xl mx-auto flex flex-col gap-6">
            <section className="bg-[#164A41]/40 border border-[#4D774E]/20 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute -top-24 -right-20 w-64 h-64 bg-[#164A41] rounded-full blur-2xl opacity-60" />
              <div className="relative z-10">
                <p className="text-[#9CC88D] text-sm font-bold uppercase tracking-[0.2em] mb-3">Moderation System</p>
                <h1 className="text-[#E2E3DD] text-3xl md:text-4xl font-bold mb-3">Admin Dashboard</h1>
                <p className="text-[#C2C9BD] text-base md:text-lg max-w-2xl">Monitor lost and found reports and manage posts.</p>
              </div>
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                { label: "Total Reports", value: stats.total },
                { label: "Lost Reports", value: stats.lost },
                { label: "Found Reports", value: stats.found },
                { label: "Resolved", value: stats.resolved },
              ].map((s) => (
                <div key={s.label} className="bg-[#1A211D] border border-[#3C4A42]/50 rounded-2xl p-5">
                  <p className="text-[#86948A] text-sm font-semibold">{s.label}</p>
                  <h2 className="text-[#DDE4DD] text-3xl font-bold mt-2">{s.value}</h2>
                </div>
              ))}
            </section>

            <div className="border-b border-[#27272A] flex gap-8">
              {["posts", "users"].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`relative pb-4 text-sm font-bold tracking-tight transition-colors ${activeTab === tab ? "text-[#9CC88D]" : "text-[#A1A1AA] hover:text-[#DDE4DD]"}`}>
                  {tab.toUpperCase()}
                  {activeTab === tab && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9CC88D] rounded-t-full" />}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-[#9CC88D] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : activeTab === "posts" ? (
              <section className="bg-[#1A211D] border border-[#3C4A42]/50 rounded-2xl p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-[#DDE4DD] text-xl font-bold">Report Moderation</h2>
                    <p className="text-[#86948A] text-sm mt-1">Showing {filteredPosts.length} report(s).</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reports..."
                      className="bg-[#0E1511] border border-[#3C4A42] rounded-xl px-4 py-3 text-[#DDE4DD] placeholder:text-[#657066] outline-none focus:border-[#9CC88D]" />
                    <select value={filter} onChange={(e) => setFilter(e.target.value)}
                      className="bg-[#0E1511] border border-[#3C4A42] rounded-xl px-4 py-3 text-[#DDE4DD] outline-none focus:border-[#9CC88D]">
                      <option value="ALL">All Reports</option>
                      <option value="LOST">Lost</option>
                      <option value="FOUND">Found</option>
                    </select>
                  </div>
                </div>

                {filteredPosts.length === 0 ? (
                  <div className="border border-dashed border-[#3C4A42] rounded-2xl p-10 text-center">
                    <h3 className="text-[#DDE4DD] font-bold text-lg mb-2">No reports found</h3>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] border-collapse">
                      <thead>
                        <tr className="border-b border-[#3C4A42] text-left">
                          {["Item", "Type", "Category", "Location", "Date", "Status", "Action"].map((h) => (
                            <th key={h} className="py-4 px-3 text-[#86948A] text-sm font-bold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPosts.map((post) => (
                          <tr key={post.post_id} className="border-b border-[#3C4A42]/40 hover:bg-[#0E1511]/60 transition-colors">
                            <td className="py-4 px-3">
                              <p className="text-[#DDE4DD] font-semibold">{post.caption || "Untitled"}</p>
                              <p className="text-[#86948A] text-xs mt-1">{post.users?.email || post.users?.full_name || "-"}</p>
                            </td>
                            <td className="py-4 px-3">
                              <span className={`text-xs font-bold px-3 py-1 rounded-full ${post.report_type === "LOST" ? "bg-red-500/10 text-red-300" : "bg-[#11996C]/20 text-[#9CC88D]"}`}>
                                {post.report_type}
                              </span>
                            </td>
                            <td className="py-4 px-3 text-[#C2C9BD]">{post.category || "-"}</td>
                            <td className="py-4 px-3 text-[#C2C9BD]">{post.building_location || "-"}</td>
                            <td className="py-4 px-3 text-[#C2C9BD]">{formatDate(post.occurrence_time || post.created_at)}</td>
                            <td className="py-4 px-3">
                              <span className={`text-xs font-bold px-3 py-1 rounded-full ${post.is_resolved ? "bg-[#11996C]/20 text-[#9CC88D]" : "bg-yellow-500/10 text-yellow-300"}`}>
                                {post.is_resolved ? "RESOLVED" : "ACTIVE"}
                              </span>
                            </td>
                            <td className="py-4 px-3">
                              <button type="button" onClick={() => handleDelete(post.post_id)}
                                className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold hover:bg-red-500/20 transition-colors">
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            ) : (
              <section className="bg-[#1A211D] border border-[#3C4A42]/50 rounded-2xl p-6">
                <h2 className="text-[#DDE4DD] text-xl font-bold mb-6">All Users ({users.length})</h2>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] border-collapse">
                    <thead>
                      <tr className="border-b border-[#3C4A42] text-left">
                        {["Name", "Email", "Role", "Faculty", "Joined"].map((h) => (
                          <th key={h} className="py-4 px-3 text-[#86948A] text-sm font-bold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-[#3C4A42]/40 hover:bg-[#0E1511]/60 transition-colors">
                          <td className="py-4 px-3 text-[#DDE4DD] font-semibold">{u.full_name}</td>
                          <td className="py-4 px-3 text-[#C2C9BD]">{u.email}</td>
                          <td className="py-4 px-3">
                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${u.role === "admin" ? "bg-red-500/20 text-red-300" : u.role === "staff" ? "bg-blue-500/20 text-blue-300" : "bg-[#11996C]/20 text-[#9CC88D]"}`}>
                              {u.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-4 px-3 text-[#C2C9BD]">{u.faculty || "-"}</td>
                          <td className="py-4 px-3 text-[#C2C9BD]">{formatDate(u.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}