import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { watchlistAPI } from "../services/api";

// Sama persis dengan kategori di ReportItem
const CATEGORIES = ["Electronics", "Keys", "Wallets & IDs", "Clothing", "Books", "Others"];

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    category_target: "Electronics",
    item_name_target: "",
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
    if (!formData.item_name_target.trim()) {
      alert("Nama barang wajib diisi.");
      return;
    }
    if (!formData.feature_description_target.trim()) {
      alert("Item Features wajib diisi.");
      return;
    }
    setSubmitting(true);
    try {
      const data = await watchlistAPI.add(formData);
      setWatchlist((prev) => [data.item, ...prev]);
      setFormData({ category_target: "Electronics", item_name_target: "", feature_description_target: "", search_area: "" });
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
    <div className="flex h-[100dvh] min-h-0 bg-[#0E1511] text-white overflow-hidden selection:bg-[#164A41] selection:text-white">
      <Sidebar activePage="watchlist" />
      <div className="flex-1 min-w-0 min-h-0 flex flex-col h-full overflow-hidden">
        <TopBar />
        <main className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:p-8 md:pb-8">
          <div className="max-w-6xl mx-auto flex flex-col gap-6">

            {/* Header */}
            <section className="bg-[#164A41]/40 border border-[#4D774E]/20 rounded-3xl p-5 md:p-8 relative overflow-hidden">
              <div className="absolute -top-24 -right-20 w-64 h-64 bg-[#164A41] rounded-full blur-2xl opacity-60" />
              <div className="relative z-10">
                <p className="text-[#9CC88D] text-sm font-bold uppercase tracking-[0.2em] mb-3">Smart Monitoring</p>
                <h1 className="text-[#E2E3DD] text-3xl md:text-4xl font-bold mb-3">My Watchlist</h1>
                <p className="text-[#C2C9BD] text-base md:text-lg max-w-2xl">
                  Simpan kriteria barang yang kamu cari. Sistem AI akan otomatis mencocokkan dengan laporan baru dan memberi notifikasi jika ada kecocokan.
                </p>
              </div>
            </section>

            {/* AI Info Banner */}
            <div className="flex items-start gap-3 bg-[#164A41]/20 border border-[#9CC88D]/20 rounded-2xl px-5 py-4">
              <div className="w-8 h-8 rounded-lg bg-[#9CC88D]/20 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-[#9CC88D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <p className="text-[#9CC88D] text-sm font-bold mb-1">Cara kerja AI Matching</p>
                <p className="text-[#C2C9BD] text-sm leading-relaxed">
                  AI membaca <span className="text-[#DDE4DD] font-semibold">nama barang</span>, <span className="text-[#DDE4DD] font-semibold">kategori</span>, <span className="text-[#DDE4DD] font-semibold">ciri-ciri</span>, dan <span className="text-[#DDE4DD] font-semibold">lokasi</span> dari setiap laporan baru, lalu membandingkan dengan kriteria watchlist kamu. Jika cocok ≥60%, kamu akan dapat notifikasi.
                </p>
              </div>
            </div>

            <section className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">

              {/* Form */}
              <form onSubmit={handleSubmit} className="bg-[#1A211D] border border-[#3C4A42]/50 rounded-2xl p-5 md:p-6 h-fit">
                <h2 className="text-[#DDE4DD] text-xl font-bold mb-1">Add Watchlist</h2>
                <p className="text-[#86948A] text-sm mb-6">Isi detail barang yang kamu cari.</p>
                <div className="flex flex-col gap-5">

                  <div className="flex flex-col gap-2">
                    <label className="text-[#DDE4DD] text-sm font-semibold">
                      Nama Barang <span className="text-[#EF4444]">*</span>
                    </label>
                    <p className="text-[#86948A] text-xs">Nama barang yang hilang. AI akan mencocokkan dengan nama di laporan.</p>
                    <input name="item_name_target" value={formData.item_name_target} onChange={handleChange}
                      placeholder="Contoh: Dompet Hitam, Kunci Motor Honda, Laptop Asus..."
                      className="bg-[#0E1511] border border-[#3C4A42] rounded-xl px-4 py-3 text-[#DDE4DD] placeholder:text-[#657066] outline-none focus:border-[#9CC88D] transition-colors text-sm" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[#DDE4DD] text-sm font-semibold">
                      Kategori Barang <span className="text-[#EF4444]">*</span>
                    </label>
                    <p className="text-[#86948A] text-xs">Digunakan AI untuk mencocokkan kategori laporan.</p>
                    <select name="category_target" value={formData.category_target} onChange={handleChange}
                      className="bg-[#0E1511] border border-[#3C4A42] rounded-xl px-4 py-3 text-[#DDE4DD] outline-none focus:border-[#9CC88D] transition-colors">
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[#DDE4DD] text-sm font-semibold">
                      Ciri-ciri Barang <span className="text-[#EF4444]">*</span>
                    </label>
                    <p className="text-[#86948A] text-xs">Deskripsikan ciri fisik barang sedetail mungkin. Ini yang paling penting dibaca AI.</p>
                    <textarea name="feature_description_target" value={formData.feature_description_target} onChange={handleChange}
                      rows={5} placeholder="Contoh: dompet kulit warna hitam, ada foto di dalamnya, berisi kartu BCA dan KTM USU..."
                      className="bg-[#0E1511] border border-[#3C4A42] rounded-xl px-4 py-3 text-[#DDE4DD] placeholder:text-[#657066] outline-none resize-none focus:border-[#9CC88D] transition-colors text-sm" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[#DDE4DD] text-sm font-semibold">Area Pencarian</label>
                    <p className="text-[#86948A] text-xs">Lokasi terakhir atau area kampus tempat barang hilang.</p>
                    <input name="search_area" value={formData.search_area} onChange={handleChange}
                      placeholder="Contoh: Fasilkom-TI, Perpustakaan USU..."
                      className="bg-[#0E1511] border border-[#3C4A42] rounded-xl px-4 py-3 text-[#DDE4DD] placeholder:text-[#657066] outline-none focus:border-[#9CC88D] transition-colors text-sm" />
                  </div>

                  <button type="submit" disabled={submitting}
                    className="bg-[#9CC88D] hover:bg-[#8bb47d] text-[#13342E] font-bold py-3 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#13342E] border-t-transparent rounded-full animate-spin" />
                        Menyimpan & Mencari...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Save Watchlist
                      </>
                    )}
                  </button>
                  {submitting && (
                    <p className="text-[#86948A] text-xs text-center -mt-2">
                      AI sedang mencocokkan dengan laporan yang ada...
                    </p>
                  )}
                </div>
              </form>

              {/* Saved Watchlists */}
              <div className="bg-[#1A211D] border border-[#3C4A42]/50 rounded-2xl p-5 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
                  <div>
                    <h2 className="text-[#DDE4DD] text-xl font-bold">Saved Watchlists</h2>
                    <p className="text-[#86948A] text-sm">{watchlist.length} total, {activeCount} aktif.</p>
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="w-8 h-8 border-2 border-[#9CC88D] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : watchlist.length === 0 ? (
                  <div className="border border-dashed border-[#3C4A42] rounded-2xl p-6 md:p-10 text-center">
                    <div className="w-12 h-12 rounded-full bg-[#164A41]/30 border border-[#3C4A42] flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-[#9CC88D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <h3 className="text-[#DDE4DD] font-bold text-lg mb-2">Belum ada watchlist</h3>
                    <p className="text-[#86948A] text-sm">Tambah watchlist pertamamu untuk mulai monitoring barang hilang.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {watchlist.map((item) => (
                      <article key={item.watchlist_id} className="bg-[#0E1511] border border-[#3C4A42]/60 rounded-2xl p-5">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div className="flex-1 flex flex-col gap-3">

                            {/* Badges */}
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="bg-[#164A41] text-[#9CC88D] text-xs font-bold px-3 py-1 rounded-full border border-[#9CC88D]/20">
                                {item.category_target}
                              </span>
                              <span className={`text-xs font-bold px-3 py-1 rounded-full ${item.is_active ? "bg-[#11996C]/20 text-[#9CC88D] border border-[#11996C]/30" : "bg-[#3C4A42]/40 text-[#A1A1AA] border border-[#3C4A42]"}`}>
                                {item.is_active ? "ACTIVE" : "INACTIVE"}
                              </span>
                            </div>

                            {/* Nama barang */}
                            <div className="flex flex-col gap-1">
                              <p className="text-[#86948A] text-xs font-semibold uppercase tracking-wide">Nama barang</p>
                              <p className="text-[#DDE4DD] text-sm font-semibold">{item.item_name_target || "-"}</p>
                            </div>

                            {/* Ciri-ciri */}
                            <div className="flex flex-col gap-1">
                              <p className="text-[#86948A] text-xs font-semibold uppercase tracking-wide">Ciri-ciri barang</p>
                              <p className="text-[#DDE4DD] text-sm leading-relaxed">{item.feature_description_target}</p>
                            </div>

                            {/* Search area */}
                            {item.search_area && (
                              <div className="flex items-center gap-2 text-sm">
                                <svg className="w-3.5 h-3.5 text-[#86948A] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-[#86948A] text-xs">Area: <span className="text-[#BBCABF] font-medium">{item.search_area}</span></span>
                              </div>
                            )}

                            {/* Created at */}
                            <p className="text-[#3C4A42] text-xs">
                              Dibuat {new Date(item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </div>

                          <button type="button" onClick={() => handleDelete(item.watchlist_id)}
                            className="w-full md:w-auto px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm font-semibold hover:bg-red-500/20 transition-colors shrink-0">
                            Delete
                          </button>
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