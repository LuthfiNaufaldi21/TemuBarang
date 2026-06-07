import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { watchlistAPI } from "../services/api";

const CATEGORIES = ["Electronics", "Accessories", "Documents", "Bags", "Keys", "Clothing", "Other"];

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    category_target: "Electronics",
    feature_description_target: "",
    search_area: "",
  });

  const load = useCallback(async () => {
    try {
      const data = await watchlistAPI.getAll();
      setWatchlist(data.watchlist || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.feature_description_target.trim()) { alert("Please describe the item features."); return; }
    setSubmitting(true);
    try {
      const data = await watchlistAPI.add(formData);
      setWatchlist((prev) => [data.item, ...prev]);
      setFormData({ category_target: "Electronics", feature_description_target: "", search_area: "" });
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Hapus watchlist ini?")) return;
    try {
      await watchlistAPI.remove(id);
      setWatchlist((prev) => prev.filter((item) => item.watchlist_id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const activeCount = watchlist.filter((item) => item.is_active).length;

  return (
    <div className="flex h-screen bg-[#0E1511] text-white overflow-hidden selection:bg-[#164A41] selection:text-white">
      <Sidebar activePage="watchlist" />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto flex flex-col gap-6">
            <section className="bg-[#164A41]/40 border border-[#4D774E]/20 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute -top-24 -right-20 w-64 h-64 bg-[#164A41] rounded-full blur-2xl opacity-60" />
              <div className="relative z-10">
                <p className="text-[#9CC88D] text-sm font-bold uppercase tracking-[0.2em] mb-3">Smart Monitoring</p>
                <h1 className="text-[#E2E3DD] text-3xl md:text-4xl font-bold mb-3">My Watchlist</h1>
                <p className="text-[#C2C9BD] text-base md:text-lg max-w-2xl">Save item criteria so the system can help you monitor possible matching reports.</p>
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
              <form onSubmit={handleSubmit} className="bg-[#1A211D] border border-[#3C4A42]/50 rounded-2xl p-6 h-fit">
                <h2 className="text-[#DDE4DD] text-xl font-bold mb-1">Add Watchlist</h2>
                <p className="text-[#86948A] text-sm mb-6">Describe the item you want to monitor.</p>
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-[#DDE4DD] text-sm font-semibold">Category</label>
                    <select name="category_target" value={formData.category_target} onChange={handleChange}
                      className="bg-[#0E1511] border border-[#3C4A42] rounded-xl px-4 py-3 text-[#DDE4DD] outline-none focus:border-[#9CC88D]">
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[#DDE4DD] text-sm font-semibold">Item Features</label>
                    <textarea name="feature_description_target" value={formData.feature_description_target} onChange={handleChange}
                      rows={5} placeholder="Example: black wallet, has BCA card..."
                      className="bg-[#0E1511] border border-[#3C4A42] rounded-xl px-4 py-3 text-[#DDE4DD] placeholder:text-[#657066] outline-none resize-none focus:border-[#9CC88D]" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[#DDE4DD] text-sm font-semibold">Search Area</label>
                    <input name="search_area" value={formData.search_area} onChange={handleChange}
                      placeholder="Example: Fasilkom-TI, Library..."
                      className="bg-[#0E1511] border border-[#3C4A42] rounded-xl px-4 py-3 text-[#DDE4DD] placeholder:text-[#657066] outline-none focus:border-[#9CC88D]" />
                  </div>
                  <button type="submit" disabled={submitting}
                    className="bg-[#9CC88D] hover:bg-[#8bb47d] text-[#13342E] font-bold py-3 rounded-xl transition-colors disabled:opacity-60">
                    {submitting ? "Saving..." : "Save Watchlist"}
                  </button>
                </div>
              </form>

              <div className="bg-[#1A211D] border border-[#3C4A42]/50 rounded-2xl p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
                  <div>
                    <h2 className="text-[#DDE4DD] text-xl font-bold">Saved Watchlists</h2>
                    <p className="text-[#86948A] text-sm">{watchlist.length} total, {activeCount} active.</p>
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="w-8 h-8 border-2 border-[#9CC88D] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : watchlist.length === 0 ? (
                  <div className="border border-dashed border-[#3C4A42] rounded-2xl p-10 text-center">
                    <h3 className="text-[#DDE4DD] font-bold text-lg mb-2">No watchlist yet</h3>
                    <p className="text-[#86948A] text-sm">Add your first watchlist to monitor possible matching items.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {watchlist.map((item) => (
                      <article key={item.watchlist_id} className="bg-[#0E1511] border border-[#3C4A42]/60 rounded-2xl p-5">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <span className="bg-[#164A41] text-[#9CC88D] text-xs font-bold px-3 py-1 rounded-full">{item.category_target}</span>
                              <span className={`text-xs font-bold px-3 py-1 rounded-full ${item.is_active ? "bg-[#11996C]/20 text-[#9CC88D]" : "bg-[#3C4A42]/40 text-[#A1A1AA]"}`}>
                                {item.is_active ? "ACTIVE" : "INACTIVE"}
                              </span>
                            </div>
                            <p className="text-[#DDE4DD] text-base leading-relaxed mb-3">{item.feature_description_target}</p>
                            {item.search_area && (
                              <p className="text-[#86948A] text-sm">Search area: <span className="text-[#BBCABF]">{item.search_area}</span></p>
                            )}
                          </div>
                          <div className="flex md:flex-col gap-2">
                            <button type="button" onClick={() => handleDelete(item.watchlist_id)}
                              className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm font-semibold hover:bg-red-500/20 transition-colors">
                              Delete
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}