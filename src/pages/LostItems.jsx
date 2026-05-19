import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";

const categories = [
  "All Items",
  "Electronics",
  "Keys",
  "Wallets & IDs",
  "Clothing",
  "Books",
  "Others",
];

function normalizeStatus(status) {
  return (status || "searching").toLowerCase().replace(/\s/g, "_");
}

function readStorageArray(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch (error) {
    console.error(`Failed to read ${key}`, error);
    return [];
  }
}

function getReportDateText(report) {
  if (report.dateText) return report.dateText;

  const rawDate = report.date || report.createdAt || report.updatedAt;

  if (!rawDate) return "-";

  const parsedDate = new Date(rawDate);

  if (Number.isNaN(parsedDate.getTime())) return "-";

  return parsedDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getReportLocation(report) {
  return report.location || report.foundLocation || "Unknown location";
}

function LostItems() {
  const [activeFilter, setActiveFilter] = useState("All Items");
  const [allLostReports, setAllLostReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 6;

  const sortReportsByLatest = (reports) => {
    return [...reports].sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || a.date || 0);
      const dateB = new Date(b.updatedAt || b.createdAt || b.date || 0);

      return dateB - dateA;
    });
  };

  const applyCategoryFilter = (reportsSource, category) => {
    if (category === "All Items") {
      setFilteredReports(reportsSource);
      return;
    }

    const filtered = reportsSource.filter((item) => {
      const itemCategory = item.category || "Others";
      return itemCategory === category;
    });

    setFilteredReports(filtered);
  };

  const loadLostReports = () => {
    const parsedReports = readStorageArray("temuReports");

    const lostItems = parsedReports.filter((report) => {
      const type = (report.type || "").toUpperCase();
      const status = normalizeStatus(report.status);

      return type === "LOST" && status === "searching";
    });

    const sortedLostItems = sortReportsByLatest(lostItems);

    setAllLostReports(sortedLostItems);
    applyCategoryFilter(sortedLostItems, activeFilter);
  };

  useEffect(() => {
    loadLostReports();

    const handleStorageChange = () => {
      loadLostReports();
    };

    const handleFocus = () => {
      loadLostReports();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadLostReports();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("temuStorage", handleStorageChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("temuStorage", handleStorageChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter]);

  const handleFilterClick = (category) => {
    setActiveFilter(category);
    setCurrentPage(1);
    applyCategoryFilter(allLostReports, category);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentReports = filteredReports.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const getCardBadge = (report) => {
    const status = normalizeStatus(report.status);

    let badgeText = "LOST";
    let badgeStyle = "bg-[#EF4444]/50 border-[#EF4444]/30";

    if (status === "searching") {
      badgeText = "LOST";
      badgeStyle = "bg-[#EF4444]/50 border-[#EF4444]/30";
    }

    return (
      <div
        className={`absolute top-4 right-4 z-20 text-white text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur-md border ${badgeStyle}`}
      >
        {badgeText}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#0E1511] text-white  overflow-hidden selection:bg-[#164A41] selection:text-white">
      <Sidebar activePage="lost-items" />

      {/*Main content*/}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/*top navbar*/}
        <TopBar />

        {/*Main*/}
        <main className="flex-1 overflow-y-scroll p-6 md:p-8 flex flex-col items-center">
          <div className="w-full max-w-300 mx-auto flex flex-col gap-6 min-h-[calc(100vh-140px)]">
            {/* Page Header */}
            <div className="flex flex-col gap-1 w-full">
              <h2 className="text-[#DDE4DD] text-3xl font-bold  mb-1">
                Lost Items Gallery
              </h2>
              <p className="text-[#A1A1AA] text-base">
                Help your community reunite with their belongings. Browse recent
                lost reports or search for specific items.
              </p>
            </div>

            {/* Filter Kategori */}
            <div className="flex flex-wrap items-center gap-3 w-full mb-4">
              {categories.map((filter) => (
                <button
                  key={filter}
                  onClick={() => handleFilterClick(filter)}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${activeFilter === filter
                      ? "bg-[#164A41] text-[#9CC88D]"
                      : "bg-[#1A211D] text-[#A1A1AA] hover:bg-[#242C27] hover:text-[#DDE4DD]"
                    }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Cards Grid / Empty State */}
            {filteredReports.length === 0 ? (
              <div className="w-full min-h-100 flex flex-col items-center justify-center bg-[#1A211D] border border-dashed border-[#4D774E]/50 rounded-2xl py-20 px-6 text-center mt-2">
                <div className="w-16 h-16 mb-4 rounded-full bg-[#13342E] border border-[#3C4A42] flex items-center justify-center opacity-80">
                  <svg
                    className="w-8 h-8 text-[#9CC88D]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                    />
                  </svg>
                </div>
                <h3 className="text-[#DDE4DD] text-lg font-semibold mb-1">
                  No lost items found
                </h3>
                <p className="text-[#86948A] text-sm max-w-sm">
                  {allLostReports.length === 0
                    ? "There are no active lost item reports yet. Be the first to report one."
                    : "No items match the selected category. Try a different filter."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full mt-2">
                {currentReports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-[#1A211D] border border-[#3C4A42]/30 rounded-xl overflow-hidden shadow-sm flex flex-col"
                  >
                    {/* Image */}
                    <div className="h-48 bg-[#2F3632] relative overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-0 bg-linear-to-t from-[#1A211D] to-transparent opacity-60 z-10"></div>
                      <img
                        src={report.image}
                        alt={report.title || "Lost Item"}
                        className="w-full h-full object-cover"
                        onError={(event) => {
                          event.target.src =
                            "https://placehold.co/400x192/1A211D/4D774E?text=No+Image";
                        }}
                      />
                      {getCardBadge(report)}
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-1">
                      <h4 className="text-[#DDE4DD] text-base font-medium mb-2">
                        {report.title || "Untitled Item"}
                      </h4>
                      <p className="text-[#BBCABF] text-[14px] leading-relaxed mb-4 flex-1 line-clamp-3">
                        {report.description || "No description provided."}
                      </p>
                      <div className="space-y-2 mb-6">
                        <div className="flex items-center gap-2 text-[#BBCABF] text-sm">
                          <svg
                            className="w-4 h-4 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <span className="truncate">
                            {getReportLocation(report)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[#BBCABF] text-sm">
                          <svg
                            className="w-4 h-4 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span>{getReportDateText(report)}</span>
                        </div>
                      </div>

                      {/* View Details Button */}
                      <Link
                        to={`/item/${report.id}`}
                        className="w-full bg-[#13342E] border border-[#3C4A42]/50 text-[#9CC88D] py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1a443d] transition-colors flex justify-center items-center"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {filteredReports.length > 0 && (
              <div className="w-full flex flex-col md:flex-row justify-between items-center gap-6 mt-10 mb-6 pt-8 pb-8 border-t border-[#27272A]">
                <div className="text-[#71717A] text-sm">
                  Showing{" "}
                  <span className="text-[#DDE4DD] font-semibold">
                    {filteredReports.length}
                  </span>{" "}
                  lost items
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      currentPage > 1 && handlePageChange(currentPage - 1)
                    }
                    disabled={currentPage <= 1}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-colors ${currentPage <= 1
                        ? "border-[#27272A] text-[#27272A] opacity-50 cursor-not-allowed"
                        : "border-[#3C4A42] text-[#A1A1AA] hover:bg-white/5"
                      }`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${currentPage === page
                            ? "bg-[#9CC88D] text-[#174A41] font-bold shadow-sm shadow-[#4edea3]/10"
                            : "border border-[#27272A] text-[#A1A1AA] hover:bg-white/5"
                          }`}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    onClick={() =>
                      currentPage < totalPages &&
                      handlePageChange(currentPage + 1)
                    }
                    disabled={currentPage >= totalPages}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-colors ${currentPage >= totalPages || totalPages === 0
                        ? "border-[#27272A] text-[#27272A] opacity-50 cursor-not-allowed"
                        : "border-[#3C4A42] text-[#A1A1AA] hover:bg-white/5"
                      }`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default LostItems;