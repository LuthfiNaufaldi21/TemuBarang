import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { normalizeStatus, isResolvedStatus } from "../utils/statusUtils";

const filters = [
  "All Items",
  "Electronics",
  "Keys",
  "Wallets & IDs",
  "Clothing",
  "Books",
  "Others",
];



function readStorageArray(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch (error) {
    console.error(`Gagal membaca ${key}`, error);
    return [];
  }
}

function getReportLocation(report) {
  return (
    report.location ||
    report.foundLocation ||
    report.storageLocation ||
    "Unknown location"
  );
}

function getReportDateValue(report) {
  const rawDate = report.date || report.createdAt || report.updatedAt;

  if (!rawDate) return null;

  const parsedDate = new Date(rawDate);

  if (Number.isNaN(parsedDate.getTime())) return null;

  return parsedDate;
}

function getReportDateText(report) {
  if (report.dateText) return report.dateText;

  const parsedDate = getReportDateValue(report);

  if (!parsedDate) return "-";

  return parsedDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusBadge(report) {
  const type = (report.type || "").toUpperCase();
  const status = normalizeStatus(report.status);

  let badgeText = type || "REPORT";
  let badgeStyle =
    type === "FOUND"
      ? "bg-[#11996C]/50 border-[#11996C]"
      : "bg-[#EF4444]/50 border-[#EF4444]/30";

  if (status === "verifying") {
    badgeText = "VERIFYING";
    badgeStyle = "bg-blue-600/50 border-blue-500/30";
  } else if (status === "match_found") {
    badgeText = type === "FOUND" ? "OWNER FOUND" : "MATCH FOUND";
    badgeStyle = "bg-amber-500/50 border-amber-500/30";
  } else if (status === "searching") {
    badgeText = type === "FOUND" ? "FOUND" : "LOST";
  }

  return (
    <div
      className={`absolute top-4 right-4 z-20 text-white text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur-md border ${badgeStyle}`}
    >
      {badgeText}
    </div>
  );
}

function RecentReports() {
  const [activeFilter, setActiveFilter] = useState("All Items");
  const [currentPage, setCurrentPage] = useState(1);
  const [allReports, setAllReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [advancedFilterValues, setAdvancedFilterValues] = useState({
    type: "ALL",
    location: "",
    dateFrom: "",
    dateTo: "",
  });

  const itemsPerPage = 6;

  const sortReportsByLatest = (reports) => {
    return [...reports].sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || a.date || 0);
      const dateB = new Date(b.updatedAt || b.createdAt || b.date || 0);

      return dateB - dateA;
    });
  };

  const applyAllFilters = (reportsSource, categoryParam, advancedParam) => {
    let result = [...reportsSource];

    if (categoryParam !== "All Items") {
      result = result.filter((report) => {
        const reportCategory = report.category || "Others";
        return reportCategory === categoryParam;
      });
    }

    if (advancedParam.type !== "ALL") {
      result = result.filter((report) => {
        const reportType = (report.type || "").toUpperCase();
        return reportType === advancedParam.type;
      });
    }

    if (advancedParam.location.trim() !== "") {
      const searchLocation = advancedParam.location.toLowerCase().trim();

      result = result.filter((report) => {
        const locationText = [
          report.location,
          report.foundLocation,
          report.storageLocation,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return locationText.includes(searchLocation);
      });
    }

    if (advancedParam.dateFrom !== "") {
      const fromDate = new Date(advancedParam.dateFrom);
      fromDate.setHours(0, 0, 0, 0);

      result = result.filter((report) => {
        const reportDate = getReportDateValue(report);
        if (!reportDate) return true;

        return reportDate.getTime() >= fromDate.getTime();
      });
    }

    if (advancedParam.dateTo !== "") {
      const toDate = new Date(advancedParam.dateTo);
      toDate.setHours(23, 59, 59, 999);

      result = result.filter((report) => {
        const reportDate = getReportDateValue(report);
        if (!reportDate) return true;

        return reportDate.getTime() <= toDate.getTime();
      });
    }

    setFilteredReports(sortReportsByLatest(result));
    setCurrentPage(1);
  };

  const loadData = () => {
    const parsedReports = readStorageArray("temuReports");

    const activeReports = parsedReports.filter((report) => {
      const status = normalizeStatus(report.status);
      return !isResolvedStatus(status);
    });

    const sortedReports = sortReportsByLatest(activeReports);

    setAllReports(sortedReports);

    applyAllFilters(sortedReports, activeFilter, advancedFilterValues);
  };

  useEffect(() => {
    loadData();

    const handleStorageChange = () => {
      loadData();
    };

    const handleFocus = () => {
      loadData();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadData();
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
  }, []);

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    applyAllFilters(allReports, filter, advancedFilterValues);
  };

  const handleAdvancedFilterSubmit = (event) => {
    event.preventDefault();
    setIsFilterOpen(false);
    applyAllFilters(allReports, activeFilter, advancedFilterValues);
  };

  const handleAdvancedInputChange = (event) => {
    const { name, value } = event.target;

    setAdvancedFilterValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleResetFilters = () => {
    const defaultValues = {
      type: "ALL",
      location: "",
      dateFrom: "",
      dateTo: "",
    };

    setAdvancedFilterValues(defaultValues);
    applyAllFilters(allReports, activeFilter, defaultValues);
    setIsFilterOpen(false);
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

  const hasActiveAdvancedFilter =
    advancedFilterValues.type !== "ALL" ||
    advancedFilterValues.location !== "" ||
    advancedFilterValues.dateFrom !== "" ||
    advancedFilterValues.dateTo !== "";

  return (
    <div className="flex h-screen bg-[#0E1511] text-white overflow-hidden selection:bg-[#164A41] selection:text-white">
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-[#1A211D] border border-[#3C4A42]/30 w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-[slideUp_0.2s_ease-out]">
            <div className="flex justify-between items-center p-6 border-b border-[#3C4A42]/30">
              <h3 className="text-[#DDE4DD] text-xl font-bold">
                Advanced Filters
              </h3>

              <button
                onClick={() => setIsFilterOpen(false)}
                className="text-[#A1A1AA] hover:text-white transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form
              onSubmit={handleAdvancedFilterSubmit}
              className="p-6 flex flex-col gap-5"
            >
              <div className="flex flex-col gap-2">
                <label className="text-[#BBCABF] text-sm font-semibold">
                  Report Type
                </label>

                <div className="flex bg-[#0E1511] border border-[#3C4A42] rounded-lg p-1">
                  {["ALL", "LOST", "FOUND"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        setAdvancedFilterValues((prev) => ({
                          ...prev,
                          type,
                        }))
                      }
                      className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${advancedFilterValues.type === type
                        ? "bg-[#164A41] text-[#9CC88D] shadow-sm"
                        : "text-[#A1A1AA] hover:text-[#DDE4DD]"
                        }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[#BBCABF] text-sm font-semibold">
                  Location / Building
                </label>

                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
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

                  <input
                    type="text"
                    name="location"
                    value={advancedFilterValues.location}
                    onChange={handleAdvancedInputChange}
                    placeholder="Search by specific building..."
                    className="w-full bg-[#0E1511] border border-[#3C4A42] rounded-lg py-2.5 pl-9 pr-4 text-[#DDE4DD] focus:outline-none focus:border-[#9CC88D]"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1 flex flex-col gap-2">
                  <label className="text-[#BBCABF] text-sm font-semibold">
                    From Date
                  </label>

                  <input
                    type="date"
                    name="dateFrom"
                    value={advancedFilterValues.dateFrom}
                    onChange={handleAdvancedInputChange}
                    className="w-full bg-[#0E1511] border border-[#3C4A42] rounded-lg py-2.5 px-3 text-[#DDE4DD] text-sm focus:outline-none focus:border-[#9CC88D]"
                  />
                </div>

                <div className="flex-1 flex flex-col gap-2">
                  <label className="text-[#BBCABF] text-sm font-semibold">
                    To Date
                  </label>

                  <input
                    type="date"
                    name="dateTo"
                    value={advancedFilterValues.dateTo}
                    onChange={handleAdvancedInputChange}
                    className="w-full bg-[#0E1511] border border-[#3C4A42] rounded-lg py-2.5 px-3 text-[#DDE4DD] text-sm focus:outline-none focus:border-[#9CC88D]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#3C4A42]/30">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex-1 py-3 bg-transparent border border-[#3C4A42] hover:bg-[#2F3632] text-[#DDE4DD] font-semibold rounded-xl transition-colors"
                >
                  Reset
                </button>

                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#9CC88D] hover:bg-[#8bb47d] text-[#13342E] font-bold rounded-xl transition-colors shadow-lg shadow-[#9CC88D]/10"
                >
                  Apply Filters
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Sidebar activePage="recent-reports" />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-y-scroll p-6 md:p-8 pb-32 flex flex-col items-center">
          <div className="w-full max-w-300 mx-auto flex flex-col gap-6 min-h-[calc(100vh-140px)]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 w-full">
              <div className="flex flex-col gap-1">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 text-[#A1A1AA] hover:text-[#DDE4DD] transition-colors text-sm font-medium mb-2 w-fit"
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
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  back
                </Link>

                <h2 className="text-[#DDE4DD] text-3xl font-bold mb-1">
                  Recent Reports
                </h2>

                <p className="text-[#A1A1AA] text-base">
                  Browse through recently lost and found items on campus.
                </p>
              </div>

              <button
                onClick={() => setIsFilterOpen(true)}
                className="px-5 py-2.5 bg-[#1A211D] hover:bg-[#242C27] border border-[#3C4A42]/30 rounded-xl text-[#DDE4DD] text-sm font-semibold flex items-center gap-2 transition-colors shrink-0"
              >
                <svg
                  className="w-4 h-4 text-[#DDE4DD]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                Advanced Filters
                {hasActiveAdvancedFilter && (
                  <span className="w-2 h-2 rounded-full bg-[#F1B24A]" />
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full mb-4">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => handleFilterChange(filter)}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${activeFilter === filter
                    ? "bg-[#164A41] text-[#9CC88D]"
                    : "bg-[#1A211D] text-[#A1A1AA] hover:bg-[#242C27] hover:text-[#DDE4DD]"
                    }`}
                >
                  {filter}
                </button>
              ))}
            </div>

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
                  No items found
                </h3>

                <p className="text-[#86948A] text-sm max-w-sm">
                  {allReports.length === 0
                    ? "There are no reports submitted yet. Be the first to report a lost or found item."
                    : "No reports match your current filters. Try adjusting your search."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full mt-2">
                {currentReports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-[#1A211D] border border-[#3C4A42]/30 rounded-xl overflow-hidden shadow-sm flex flex-col"
                  >
                    <div className="h-48 bg-[#2F3632] relative overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-0 bg-linear-to-t from-[#1A211D] to-transparent opacity-60 z-10" />

                      <img
                        src={report.image}
                        alt={report.title || "Item"}
                        className="w-full h-full object-cover"
                        onError={(event) => {
                          event.target.src =
                            "https://placehold.co/400x192/1A211D/4D774E?text=No+Image";
                        }}
                      />

                      {getStatusBadge(report)}
                    </div>

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

            {filteredReports.length > 0 && (
              <div className="w-full flex flex-col md:flex-row justify-between items-center gap-6 mt-10 mb-6 pt-8 pb-8 border-t border-[#27272A]">
                <div className="text-[#71717A] text-sm">
                  Showing{" "}
                  <span className="text-[#DDE4DD] font-semibold">
                    {filteredReports.length}
                  </span>{" "}
                  reports
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

export default RecentReports;