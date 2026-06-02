import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";

const CATEGORIES = [
  "Electronics",
  "Accessories",
  "Documents",
  "Bags",
  "Keys",
  "Clothing",
  "Other",
];

function readStorageArray(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch (error) {
    console.error(`Failed to read ${key}`, error);
    return [];
  }
}

function saveStorageArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("temuStorage"));
}

function getCurrentUserEmail() {
  return (localStorage.getItem("currentUserEmail") || "")
    .toString()
    .trim()
    .toLowerCase();
}

export default function Watchlist() {
  const currentUserEmail = getCurrentUserEmail();

  const [watchlists, setWatchlists] = useState([]);
  const [formData, setFormData] = useState({
    category_target: "Electronics",
    feature_description_target: "",
    search_area: "",
  });

  useEffect(() => {
    setWatchlists(readStorageArray("temuWatchlists"));
  }, []);

  const userWatchlists = useMemo(() => {
    return watchlists.filter(
      (item) =>
        (item.user_id || "").toString().toLowerCase() === currentUserEmail
    );
  }, [watchlists, currentUserEmail]);

  const activeCount = userWatchlists.filter((item) => item.is_active).length;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formData.feature_description_target.trim()) {
      alert("Please describe the item features.");
      return;
    }

    if (!formData.search_area.trim()) {
      alert("Please fill the search area.");
      return;
    }

    const newWatchlist = {
      watchlist_id: Date.now(),
      user_id: currentUserEmail,
      category_target: formData.category_target,
      feature_description_target:
        formData.feature_description_target.trim(),
      search_area: formData.search_area.trim(),
      is_active: true,
      created_at: new Date().toISOString(),
    };

    const updatedWatchlists = [newWatchlist, ...watchlists];

    setWatchlists(updatedWatchlists);
    saveStorageArray("temuWatchlists", updatedWatchlists);

    setFormData({
      category_target: "Electronics",
      feature_description_target: "",
      search_area: "",
    });
  };

  const handleToggleActive = (watchlistId) => {
    const updatedWatchlists = watchlists.map((item) => {
      if (item.watchlist_id !== watchlistId) return item;

      return {
        ...item,
        is_active: !item.is_active,
      };
    });

    setWatchlists(updatedWatchlists);
    saveStorageArray("temuWatchlists", updatedWatchlists);
  };

  const handleDelete = (watchlistId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this watchlist?"
    );

    if (!confirmed) return;

    const updatedWatchlists = watchlists.filter(
      (item) => item.watchlist_id !== watchlistId
    );

    setWatchlists(updatedWatchlists);
    saveStorageArray("temuWatchlists", updatedWatchlists);
  };

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
                <p className="text-[#9CC88D] text-sm font-bold uppercase tracking-[0.2em] mb-3">
                  Smart Monitoring
                </p>

                <h1 className="text-[#E2E3DD] text-3xl md:text-4xl font-bold mb-3">
                  My Watchlist
                </h1>

                <p className="text-[#C2C9BD] text-base md:text-lg max-w-2xl">
                  Save item criteria so the system can help you monitor
                  possible matching reports.
                </p>
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
              <form
                onSubmit={handleSubmit}
                className="bg-[#1A211D] border border-[#3C4A42]/50 rounded-2xl p-6 h-fit"
              >
                <h2 className="text-[#DDE4DD] text-xl font-bold mb-1">
                  Add Watchlist
                </h2>

                <p className="text-[#86948A] text-sm mb-6">
                  Describe the item you want to monitor.
                </p>

                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-[#DDE4DD] text-sm font-semibold">
                      Category
                    </label>

                    <select
                      name="category_target"
                      value={formData.category_target}
                      onChange={handleChange}
                      className="bg-[#0E1511] border border-[#3C4A42] rounded-xl px-4 py-3 text-[#DDE4DD] outline-none focus:border-[#9CC88D]"
                    >
                      {CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[#DDE4DD] text-sm font-semibold">
                      Item Features
                    </label>

                    <textarea
                      name="feature_description_target"
                      value={formData.feature_description_target}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Example: black wallet, has BCA card, small scratch on the corner..."
                      className="bg-[#0E1511] border border-[#3C4A42] rounded-xl px-4 py-3 text-[#DDE4DD] placeholder:text-[#657066] outline-none resize-none focus:border-[#9CC88D]"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[#DDE4DD] text-sm font-semibold">
                      Search Area
                    </label>

                    <input
                      name="search_area"
                      value={formData.search_area}
                      onChange={handleChange}
                      placeholder="Example: Fasilkom-TI, Library, Canteen..."
                      className="bg-[#0E1511] border border-[#3C4A42] rounded-xl px-4 py-3 text-[#DDE4DD] placeholder:text-[#657066] outline-none focus:border-[#9CC88D]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-[#9CC88D] hover:bg-[#8bb47d] text-[#13342E] font-bold py-3 rounded-xl transition-colors"
                  >
                    Save Watchlist
                  </button>
                </div>
              </form>

              <div className="bg-[#1A211D] border border-[#3C4A42]/50 rounded-2xl p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
                  <div>
                    <h2 className="text-[#DDE4DD] text-xl font-bold">
                      Saved Watchlists
                    </h2>

                    <p className="text-[#86948A] text-sm">
                      {userWatchlists.length} total, {activeCount} active.
                    </p>
                  </div>
                </div>

                {userWatchlists.length === 0 ? (
                  <div className="border border-dashed border-[#3C4A42] rounded-2xl p-10 text-center">
                    <div className="w-14 h-14 mx-auto rounded-full bg-[#13342E] border border-[#3C4A42] flex items-center justify-center mb-4">
                      <svg
                        className="w-7 h-7 text-[#9CC88D]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                        />
                      </svg>
                    </div>

                    <h3 className="text-[#DDE4DD] font-bold text-lg mb-2">
                      No watchlist yet
                    </h3>

                    <p className="text-[#86948A] text-sm">
                      Add your first watchlist to monitor possible matching
                      items.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {userWatchlists.map((item) => (
                      <article
                        key={item.watchlist_id}
                        className="bg-[#0E1511] border border-[#3C4A42]/60 rounded-2xl p-5"
                      >
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <span className="bg-[#164A41] text-[#9CC88D] text-xs font-bold px-3 py-1 rounded-full">
                                {item.category_target}
                              </span>

                              <span
                                className={`text-xs font-bold px-3 py-1 rounded-full ${
                                  item.is_active
                                    ? "bg-[#11996C]/20 text-[#9CC88D]"
                                    : "bg-[#3C4A42]/40 text-[#A1A1AA]"
                                }`}
                              >
                                {item.is_active ? "ACTIVE" : "INACTIVE"}
                              </span>
                            </div>

                            <p className="text-[#DDE4DD] text-base leading-relaxed mb-3">
                              {item.feature_description_target}
                            </p>

                            <p className="text-[#86948A] text-sm">
                              Search area:{" "}
                              <span className="text-[#BBCABF]">
                                {item.search_area}
                              </span>
                            </p>
                          </div>

                          <div className="flex md:flex-col gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleActive(item.watchlist_id)
                              }
                              className="px-4 py-2 rounded-lg bg-[#1A211D] border border-[#3C4A42] text-[#DDE4DD] text-sm font-semibold hover:border-[#9CC88D] transition-colors"
                            >
                              {item.is_active ? "Disable" : "Enable"}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(item.watchlist_id)}
                              className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm font-semibold hover:bg-red-500/20 transition-colors"
                            >
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