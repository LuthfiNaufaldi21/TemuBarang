import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";

function readReports() {
  try {
    return JSON.parse(localStorage.getItem("temuReports") || "[]");
  } catch (error) {
    console.error("Failed to read reports:", error);
    return [];
  }
}

function saveReports(reports) {
  localStorage.setItem("temuReports", JSON.stringify(reports));
  window.dispatchEvent(new Event("temuStorage"));
}

function getReportId(report) {
  return report.id || report.post_id || report.report_id || report.createdAt;
}

function getReportType(report) {
  return (report.reportType || report.type || "UNKNOWN").toString().toUpperCase();
}

function isResolved(report) {
  const status = (report.status || "").toString().toLowerCase();

  return (
    report.isResolved === true ||
    report.resolved === true ||
    status === "resolved" ||
    status === "closed" ||
    status === "dikembalikan" ||
    status === "selesai"
  );
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminDashboard() {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setReports(readReports());
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const type = getReportType(report);

      const matchesFilter = filter === "ALL" || type === filter;

      const keyword = search.trim().toLowerCase();

      const searchableText = [
        report.title,
        report.name,
        report.itemName,
        report.category,
        report.location,
        report.foundLocation,
        report.description,
        report.ownerEmail,
        report.userEmail,
        report.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        keyword.length === 0 || searchableText.includes(keyword);

      return matchesFilter && matchesSearch;
    });
  }, [reports, filter, search]);

  const stats = useMemo(() => {
    const totalReports = reports.length;
    const lostReports = reports.filter(
      (report) => getReportType(report) === "LOST"
    ).length;
    const foundReports = reports.filter(
      (report) => getReportType(report) === "FOUND"
    ).length;
    const resolvedReports = reports.filter((report) => isResolved(report)).length;

    return {
      totalReports,
      lostReports,
      foundReports,
      resolvedReports,
    };
  }, [reports]);

  const handleMarkResolved = (reportId) => {
    const updatedReports = reports.map((report) => {
      if (getReportId(report) !== reportId) return report;

      return {
        ...report,
        status: "RESOLVED",
        isResolved: true,
        resolvedAt: new Date().toISOString(),
      };
    });

    setReports(updatedReports);
    saveReports(updatedReports);
  };

  const handleDeleteReport = (reportId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this report?"
    );

    if (!confirmed) return;

    const updatedReports = reports.filter(
      (report) => getReportId(report) !== reportId
    );

    setReports(updatedReports);
    saveReports(updatedReports);
  };

  return (
    <div className="flex h-screen bg-[#0E1511] text-white overflow-hidden selection:bg-[#164A41] selection:text-white">
      <Sidebar activePage="admin" />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto flex flex-col gap-6">
            <section className="bg-[#164A41]/40 border border-[#4D774E]/20 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute -top-24 -right-20 w-64 h-64 bg-[#164A41] rounded-full blur-2xl opacity-60" />

              <div className="relative z-10">
                <p className="text-[#9CC88D] text-sm font-bold uppercase tracking-[0.2em] mb-3">
                  Moderation System
                </p>

                <h1 className="text-[#E2E3DD] text-3xl md:text-4xl font-bold mb-3">
                  Admin Dashboard
                </h1>

                <p className="text-[#C2C9BD] text-base md:text-lg max-w-2xl">
                  Monitor lost and found reports, review report status, and
                  manage inappropriate or completed posts.
                </p>
              </div>
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="bg-[#1A211D] border border-[#3C4A42]/50 rounded-2xl p-5">
                <p className="text-[#86948A] text-sm font-semibold">
                  Total Reports
                </p>
                <h2 className="text-[#DDE4DD] text-3xl font-bold mt-2">
                  {stats.totalReports}
                </h2>
              </div>

              <div className="bg-[#1A211D] border border-[#3C4A42]/50 rounded-2xl p-5">
                <p className="text-[#86948A] text-sm font-semibold">
                  Lost Reports
                </p>
                <h2 className="text-[#DDE4DD] text-3xl font-bold mt-2">
                  {stats.lostReports}
                </h2>
              </div>

              <div className="bg-[#1A211D] border border-[#3C4A42]/50 rounded-2xl p-5">
                <p className="text-[#86948A] text-sm font-semibold">
                  Found Reports
                </p>
                <h2 className="text-[#DDE4DD] text-3xl font-bold mt-2">
                  {stats.foundReports}
                </h2>
              </div>

              <div className="bg-[#1A211D] border border-[#3C4A42]/50 rounded-2xl p-5">
                <p className="text-[#86948A] text-sm font-semibold">
                  Resolved
                </p>
                <h2 className="text-[#DDE4DD] text-3xl font-bold mt-2">
                  {stats.resolvedReports}
                </h2>
              </div>
            </section>

            <section className="bg-[#1A211D] border border-[#3C4A42]/50 rounded-2xl p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-[#DDE4DD] text-xl font-bold">
                    Report Moderation
                  </h2>
                  <p className="text-[#86948A] text-sm mt-1">
                    Showing {filteredReports.length} report(s).
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search reports..."
                    className="bg-[#0E1511] border border-[#3C4A42] rounded-xl px-4 py-3 text-[#DDE4DD] placeholder:text-[#657066] outline-none focus:border-[#9CC88D]"
                  />

                  <select
                    value={filter}
                    onChange={(event) => setFilter(event.target.value)}
                    className="bg-[#0E1511] border border-[#3C4A42] rounded-xl px-4 py-3 text-[#DDE4DD] outline-none focus:border-[#9CC88D]"
                  >
                    <option value="ALL">All Reports</option>
                    <option value="LOST">Lost</option>
                    <option value="FOUND">Found</option>
                  </select>
                </div>
              </div>

              {filteredReports.length === 0 ? (
                <div className="border border-dashed border-[#3C4A42] rounded-2xl p-10 text-center">
                  <h3 className="text-[#DDE4DD] font-bold text-lg mb-2">
                    No reports found
                  </h3>
                  <p className="text-[#86948A] text-sm">
                    There are no reports matching your current filter.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] border-collapse">
                    <thead>
                      <tr className="border-b border-[#3C4A42] text-left">
                        <th className="py-4 px-3 text-[#86948A] text-sm font-bold">
                          Item
                        </th>
                        <th className="py-4 px-3 text-[#86948A] text-sm font-bold">
                          Type
                        </th>
                        <th className="py-4 px-3 text-[#86948A] text-sm font-bold">
                          Category
                        </th>
                        <th className="py-4 px-3 text-[#86948A] text-sm font-bold">
                          Location
                        </th>
                        <th className="py-4 px-3 text-[#86948A] text-sm font-bold">
                          Date
                        </th>
                        <th className="py-4 px-3 text-[#86948A] text-sm font-bold">
                          Status
                        </th>
                        <th className="py-4 px-3 text-[#86948A] text-sm font-bold">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredReports.map((report) => {
                        const reportId = getReportId(report);
                        const type = getReportType(report);
                        const resolved = isResolved(report);

                        return (
                          <tr
                            key={reportId}
                            className="border-b border-[#3C4A42]/40 hover:bg-[#0E1511]/60 transition-colors"
                          >
                            <td className="py-4 px-3">
                              <p className="text-[#DDE4DD] font-semibold">
                                {report.title ||
                                  report.name ||
                                  report.itemName ||
                                  "Untitled Report"}
                              </p>
                              <p className="text-[#86948A] text-xs mt-1 line-clamp-1">
                                {report.description || "No description"}
                              </p>
                            </td>

                            <td className="py-4 px-3">
                              <span
                                className={`text-xs font-bold px-3 py-1 rounded-full ${
                                  type === "LOST"
                                    ? "bg-red-500/10 text-red-300"
                                    : "bg-[#11996C]/20 text-[#9CC88D]"
                                }`}
                              >
                                {type}
                              </span>
                            </td>

                            <td className="py-4 px-3 text-[#C2C9BD]">
                              {report.category || "-"}
                            </td>

                            <td className="py-4 px-3 text-[#C2C9BD]">
                              {report.location ||
                                report.foundLocation ||
                                report.lastSeenLocation ||
                                "-"}
                            </td>

                            <td className="py-4 px-3 text-[#C2C9BD]">
                              {formatDate(
                                report.date ||
                                  report.createdAt ||
                                  report.created_at
                              )}
                            </td>

                            <td className="py-4 px-3">
                              <span
                                className={`text-xs font-bold px-3 py-1 rounded-full ${
                                  resolved
                                    ? "bg-[#11996C]/20 text-[#9CC88D]"
                                    : "bg-yellow-500/10 text-yellow-300"
                                }`}
                              >
                                {resolved ? "RESOLVED" : "ACTIVE"}
                              </span>
                            </td>

                            <td className="py-4 px-3">
                              <div className="flex gap-2">
                                {!resolved && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleMarkResolved(reportId)
                                    }
                                    className="px-3 py-2 rounded-lg bg-[#164A41] text-[#9CC88D] text-xs font-bold hover:bg-[#1f5f53] transition-colors"
                                  >
                                    Resolve
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleDeleteReport(reportId)}
                                  className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold hover:bg-red-500/20 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}