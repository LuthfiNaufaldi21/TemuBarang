import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";

function extractStudentId(email) {
  if (!email) return "";

  const username = email.split("@")[0];

  return /^\d+$/.test(username) ? username : "";
}

function normalizeEmail(email) {
  return (email || "").toString().trim().toLowerCase();
}

function normalizeStatus(status) {
  return (status || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function readStorageArray(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch (error) {
    console.error(`Failed to read ${key}`, error);
    return [];
  }
}

function getReportOwnerEmail(report) {
  return normalizeEmail(
    report?.reporterEmail ||
    report?.ownerEmail ||
    report?.lostByEmail ||
    report?.createdByEmail ||
    report?.userEmail ||
    ""
  );
}

function getReportFinderEmail(report) {
  return normalizeEmail(
    report?.reporterEmail ||
    report?.founderEmail ||
    report?.foundByEmail ||
    report?.createdByEmail ||
    report?.userEmail ||
    ""
  );
}

function isResolvedLike(report) {
  const status = normalizeStatus(report?.status);

  return (
    status === "resolved" ||
    status === "returned" ||
    status === "completed" ||
    status === "closed" ||
    Boolean(report?.resolvedAt) ||
    Boolean(report?.returnedAt) ||
    Boolean(report?.completedAt) ||
    Boolean(report?.closedAt) ||
    report?.isResolved === true
  );
}

function getLinkedReport(report, allReports) {
  const linkedId =
    report?.matchedLostItemId ||
    report?.matchedFoundItemId ||
    report?.linkedLostItemId ||
    report?.linkedFoundItemId ||
    report?.resolvedWithItemId ||
    "";

  if (!linkedId) return null;

  return (
    allReports.find(
      (item) => item.id?.toString() === linkedId?.toString()
    ) || null
  );
}

function reportBelongsToUser(report, currentUserEmail) {
  const type = (report?.type || "").toUpperCase();
  const userEmail = normalizeEmail(currentUserEmail);

  if (!userEmail) return false;

  if (type === "LOST") {
    return getReportOwnerEmail(report) === userEmail;
  }

  if (type === "FOUND") {
    return getReportFinderEmail(report) === userEmail;
  }

  return (
    getReportOwnerEmail(report) === userEmail ||
    getReportFinderEmail(report) === userEmail
  );
}

function isSuccessfulMatchForUser(report, allReports, currentUserEmail) {
  if (!reportBelongsToUser(report, currentUserEmail)) return false;

  if (isResolvedLike(report)) return true;

  const linkedReport = getLinkedReport(report, allReports);

  if (linkedReport && isResolvedLike(linkedReport)) return true;

  return false;
}

function calculateProfileStats(allReports, currentUserEmail) {
  const userEmail = normalizeEmail(currentUserEmail);

  const myLostItems = allReports.filter((report) => {
    const type = (report.type || "").toUpperCase();

    return type === "LOST" && getReportOwnerEmail(report) === userEmail;
  });

  const myFoundItems = allReports.filter((report) => {
    const type = (report.type || "").toUpperCase();

    return type === "FOUND" && getReportFinderEmail(report) === userEmail;
  });

  const myReports = allReports.filter((report) =>
    reportBelongsToUser(report, userEmail)
  );

  const successfulReportIds = new Set();

  myReports.forEach((report) => {
    if (isSuccessfulMatchForUser(report, allReports, userEmail)) {
      successfulReportIds.add(report.id?.toString());
    }
  });

  const lostCount = myLostItems.length;
  const foundCount = myFoundItems.length;
  const matchCount = successfulReportIds.size;

  const totalPossible = lostCount + foundCount;

  const ratePercentage =
    totalPossible > 0
      ? Math.min(Math.round((matchCount / totalPossible) * 100), 100)
      : 0;

  return {
    lostItems: lostCount.toString().padStart(2, "0"),
    lostTrend: lostCount > 0 ? "Active Reports" : "No Reports",
    foundItems: foundCount.toString().padStart(2, "0"),
    foundText: foundCount > 0 ? "Items Found" : "No Reports",
    successMatches: matchCount.toString().padStart(2, "0"),
    successRate: totalPossible > 0 ? `${ratePercentage}% Rate` : "0% Rate",
    progress: `${ratePercentage}%`,
  };
}

function getProfileFromStorage(currentUserEmail) {
  const normalizedEmail = normalizeEmail(currentUserEmail);

  if (!normalizedEmail) {
    return {
      fullName: "",
      avatarUrl: null,
      id: "",
      email: "",
    };
  }

  const profileKey = `temuProfile_${normalizedEmail}`;
  const savedProfile = localStorage.getItem(profileKey);

  if (savedProfile) {
    try {
      const parsed = JSON.parse(savedProfile);

      return {
        fullName: parsed.fullName || normalizedEmail.split("@")[0],
        avatarUrl: parsed.avatarUrl || null,
        id: parsed.id || extractStudentId(normalizedEmail),
        email: parsed.email || normalizedEmail,
      };
    } catch (error) {
      console.error("Failed to read profile from localStorage", error);
    }
  }

  return {
    fullName: normalizedEmail.split("@")[0],
    avatarUrl: null,
    id: extractStudentId(normalizedEmail),
    email: normalizedEmail,
  };
}

function Profile() {
  const [userData, setUserData] = useState({
    fullName: "",
    avatarUrl: null,
    id: "",
    email: "",
  });

  const [stats, setStats] = useState({
    lostItems: "00",
    lostTrend: "None yet",
    foundItems: "00",
    foundText: "None yet",
    successMatches: "00",
    successRate: "0% Rate",
    progress: "0%",
  });

  const loadProfileData = useCallback(() => {
    const currentUserEmail = normalizeEmail(
      localStorage.getItem("currentUserEmail")
    );

    if (!currentUserEmail) {
      setUserData({
        fullName: "",
        avatarUrl: null,
        id: "",
        email: "",
      });

      setStats({
        lostItems: "00",
        lostTrend: "No Reports",
        foundItems: "00",
        foundText: "No Reports",
        successMatches: "00",
        successRate: "0% Rate",
        progress: "0%",
      });

      return;
    }

    const profile = getProfileFromStorage(currentUserEmail);
    setUserData(profile);

    const reports = readStorageArray("temuReports");
    const calculatedStats = calculateProfileStats(reports, currentUserEmail);

    setStats(calculatedStats);
  }, []);

  useEffect(() => {
    loadProfileData();

    const handleRefresh = () => {
      loadProfileData();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadProfileData();
      }
    };

    window.addEventListener("storage", handleRefresh);
    window.addEventListener("temuStorage", handleRefresh);
    window.addEventListener("focus", handleRefresh);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("storage", handleRefresh);
      window.removeEventListener("temuStorage", handleRefresh);
      window.removeEventListener("focus", handleRefresh);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadProfileData]);

  return (
    <div className="flex h-screen bg-[#0E1511] text-white overflow-hidden selection:bg-[#164A41] selection:text-white">
      <Sidebar activePage="profile" />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col items-center">
          <div className="w-full max-w-6xl flex flex-col gap-8">
            <div className="relative w-full rounded-2xl overflow-hidden bg-[#18181B] shadow-md">
              <div className="absolute inset-0 opacity-40 bg-linear-to-r from-[#9CC88D] to-[#18181B]" />

              <div className="relative p-8 flex flex-col md:flex-row items-center md:items-center justify-between gap-6">
                <div className="flex flex-col md:flex-row items-center gap-6 w-full">
                  <div className="relative w-32 h-32 rounded-full border-4 border-[#9CC88D] bg-[#164A41] shadow-2xl flex items-center justify-center shrink-0 overflow-hidden">
                    {userData.avatarUrl ? (
                      <img
                        src={userData.avatarUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg
                        className="w-24 h-24 text-[#9CC88D] absolute -bottom-2"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left gap-1">
                    <h2 className="text-[#DDE4DD] text-3xl font-bold">
                      {userData.fullName || "—"}
                    </h2>

                    <div className="flex flex-col md:flex-row items-center gap-4 mt-2">
                      <div className="flex items-center gap-1.5 text-[#A1A1AA] text-sm">
                        <svg
                          className="w-4 h-4 text-[#9CC88D]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                          />
                        </svg>

                        {userData.id
                          ? `ID: ${userData.id}`
                          : "ID: —  (Not Set)"}
                      </div>

                      <div className="flex items-center gap-1.5 text-[#A1A1AA] text-sm">
                        <svg
                          className="w-4 h-4 text-[#9CC88D]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>

                        {userData.email || "—"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 mt-4 md:mt-0">
                  <Link
                    to="/edit-profile"
                    className="px-6 py-2.5 bg-[#27272A] border border-[#3F3F46] rounded-xl text-[#DDE4DD] text-base font-semibold hover:bg-[#3F3F46] transition-colors inline-block text-center shadow-sm"
                  >
                    Edit Profile
                  </Link>
                </div>
              </div>
            </div>

            <div className="w-full bg-[#1A211D] border border-[#27272A]/50 shadow-sm rounded-2xl p-8 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[#DDE4DD] text-2xl font-semibold">
                  Profile Statistics
                </h3>

                <svg
                  className="w-5 h-5 text-[#9CC88D]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#27272A]/50 border border-[#3F3F46]/30 rounded-xl p-6 flex flex-col gap-2">
                  <p className="text-[#71717A] text-xs font-bold uppercase tracking-wide">
                    LOST ITEMS
                  </p>

                  <div className="flex items-baseline gap-2">
                    <span className="text-[#DDE4DD] text-3xl font-black">
                      {stats.lostItems}
                    </span>

                    <span className="text-[#B7FF9E] text-xs font-bold">
                      {stats.lostTrend}
                    </span>
                  </div>
                </div>

                <div className="bg-[#27272A]/50 border border-[#3F3F46]/30 rounded-xl p-6 flex flex-col gap-2">
                  <p className="text-[#71717A] text-xs font-bold uppercase tracking-wide">
                    FOUND ITEMS
                  </p>

                  <div className="flex items-baseline gap-2">
                    <span className="text-[#DDE4DD] text-3xl font-black">
                      {stats.foundItems}
                    </span>

                    <span className="text-[#B7FF9E] text-xs font-bold">
                      {stats.foundText}
                    </span>
                  </div>
                </div>

                <div className="bg-[#9CC88D]/10 border border-[#9CC88D]/20 rounded-xl p-6 flex flex-col gap-2">
                  <p className="text-[#B7FF9E] text-xs font-bold uppercase tracking-wide leading-tight">
                    SUCCESSFUL
                    <br />
                    MATCHES
                  </p>

                  <div className="flex items-baseline gap-2">
                    <span className="text-[#B7FF9E] text-3xl font-black">
                      {stats.successMatches}
                    </span>

                    <span className="text-[#9CC88D]/60 text-xs font-bold">
                      {stats.successRate}
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-full h-2 bg-[#27272A] rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-[#9CC88D] rounded-full transition-all duration-1000 ease-out"
                  style={{ width: stats.progress }}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Profile;