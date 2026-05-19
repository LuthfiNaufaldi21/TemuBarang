import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";

export default function EditItemReport() {
  const { id } = useParams();
  const navigate = useNavigate();

  // State untuk menampung data form
  const [formData, setFormData] = useState({
    title: "",
    category: "Electronics",
    date: "",
    location: "",
    description: "",
    image: "",
    type: "LOST",
    status: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch data dari localStorage
  useEffect(() => {
    const loadData = () => {
      try {
        const allReports = JSON.parse(
          localStorage.getItem("temuReports") || "[]"
        );

        // Cari berdasarkan ID dari URL
        const report = allReports.find(
          (r) => r.id?.toString() === id?.toString()
        );

        if (report) {
          setFormData({
            title: report.title || "",
            category: report.category || "Electronics",
            date: report.dateText || report.dateLost || report.date || "",
            location: report.location || report.foundLocation || "",
            description: report.description || "",
            image:
              report.image ||
              "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
            type: report.type || "LOST",
            status: report.status || "",
          });
        } else {
          alert("Report not found!");
          navigate("/my-reports");
        }
      } catch (error) {
        console.error("Failed to read data from localStorage:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, navigate]);

  // Handler untuk mendeteksi ketikan user
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handler untuk menyimpan data
  const handleSave = () => {
    if (!formData.title || !formData.date || !formData.location) {
      alert("Please fill in Title, Date, and Location.");
      return;
    }

    setIsSaving(true);

    setTimeout(() => {
      try {
        const allReports = JSON.parse(
          localStorage.getItem("temuReports") || "[]"
        );

        const updatedReports = allReports.map((r) => {
          if (r.id?.toString() === id?.toString()) {
            return {
              ...r,
              title: formData.title,
              category: formData.category,
              dateText: formData.date,
              date: formData.date,
              location: formData.location,
              foundLocation:
                r.type === "FOUND" ? formData.location : r.foundLocation,
              description: formData.description,
              image: formData.image,
              updatedAt: new Date().toISOString(),
            };
          }

          return r;
        });

        localStorage.setItem("temuReports", JSON.stringify(updatedReports));

        const newActivity = {
          id: Date.now(),
          kind: "edit",
          title: "Report Edited",
          text: `You edited the report for ${formData.title}.`,
          time: "Just now",
          place: formData.location,
          createdAt: new Date().toISOString(),
        };

        const activities = JSON.parse(
          localStorage.getItem("temuActivities") || "[]"
        );

        localStorage.setItem(
          "temuActivities",
          JSON.stringify([newActivity, ...activities])
        );

        window.dispatchEvent(new Event("temuStorage"));

        alert("Report successfully edited!");
        navigate(`/my-reports/${id}`);
      } catch (error) {
        console.error("Error saving changes:", error);
        alert("Failed to save changes. Please try again.");
      } finally {
        setIsSaving(false);
      }
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-[#0E1511] items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#9CC88D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0E1511] text-white overflow-hidden">
      <Sidebar activePage="my-reports" />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col items-center">
          <div className="w-full max-w-225 flex flex-col gap-6">
            {/* Header Info */}
            <div className="flex flex-col gap-4">
              <button
                onClick={() => navigate(`/my-reports/${id}`)}
                className="text-[#86948A] hover:text-[#DDE4DD] transition-colors flex items-center gap-1.5 font-semibold text-sm w-fit"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Report Detail
              </button>

              <div>
                <h2 className="text-[#DDE4DD] text-3xl font-bold mb-2">
                  Edit Item Report
                </h2>

                <p className="text-[#86948A]">
                  Modify the details of your submitted report to help us
                  identify it faster.
                </p>
              </div>
            </div>

            {/* Form Container */}
            <div className="bg-[#1A211D] border border-[#3C4A42]/30 rounded-3xl shadow-sm overflow-hidden flex flex-col">
              <div className="flex flex-col lg:flex-row">
                {/* Left: Photo Preview */}
                <div className="w-full lg:w-80 p-8 border-b lg:border-b-0 lg:border-r border-[#3C4A42]/20 flex flex-col gap-4 relative overflow-hidden">
                  <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

                  <label className="text-[#86948A] text-xs font-bold uppercase tracking-wider relative z-10">
                    Item Photo
                  </label>

                  <div className="relative aspect-square rounded-2xl border-2 border-[#3C4A42]/30 overflow-hidden group cursor-pointer transition-all hover:border-[#9CC88D]/50 z-10">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(event) => {
                        event.target.src =
                          "https://placehold.co/500x500/1A211D/9CC88D?text=No+Image";
                      }}
                    />

                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center backdrop-blur-sm">
                      <svg
                        className="w-8 h-8 text-[#9CC88D] mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />

                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>

                      <span className="text-white text-xs font-bold">
                        CHANGE PHOTO
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Form Inputs */}
                <div className="flex-1 p-8 flex flex-col gap-6 relative">
                  <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

                  {/* Item Name */}
                  <div className="flex flex-col gap-2 relative z-10">
                    <label className="text-[#86948A] text-xs font-bold uppercase tracking-wider">
                      Item Name
                    </label>

                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full bg-[#0E1511] border border-[#3C4A42]/50 rounded-xl px-4 py-3 text-[#DDE4DD] focus:outline-none focus:border-[#9CC88D] transition-all placeholder:text-gray-700"
                      placeholder="e.g. Space Gray MacBook Pro"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    {/* Category */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[#86948A] text-xs font-bold uppercase tracking-wider">
                        Category
                      </label>

                      <div className="relative">
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="w-full bg-[#0E1511] border border-[#3C4A42]/50 rounded-xl px-4 py-3 text-[#DDE4DD] focus:outline-none focus:border-[#9CC88D] transition-all appearance-none cursor-pointer"
                        >
                          <option value="Electronics">Electronics</option>
                          <option value="Wallets & IDs">Wallets & IDs</option>
                          <option value="Keys">Keys</option>
                          <option value="Bags">Bags</option>
                          <option value="Others">Others</option>
                        </select>

                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#86948A]">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[#86948A] text-xs font-bold uppercase tracking-wider">
                        Date {formData.type === "LOST" ? "Lost" : "Found"}
                      </label>

                      <input
                        type="text"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        className="w-full bg-[#0E1511] border border-[#3C4A42]/50 rounded-xl px-4 py-3 text-[#DDE4DD] focus:outline-none focus:border-[#9CC88D] transition-all"
                        placeholder="DD/MM/YYYY"
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex flex-col gap-2 relative z-10">
                    <label className="text-[#86948A] text-xs font-bold uppercase tracking-wider">
                      Location
                    </label>

                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CC88D]">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
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
                      </div>

                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="w-full bg-[#0E1511] border border-[#3C4A42]/50 rounded-xl py-3 pl-11 pr-4 text-[#DDE4DD] focus:outline-none focus:border-[#9CC88D] transition-all"
                        placeholder="e.g. Lounge Library"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-2 relative z-10">
                    <label className="text-[#86948A] text-xs font-bold uppercase tracking-wider">
                      Detailed Description
                    </label>

                    <textarea
                      name="description"
                      rows="4"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full bg-[#0E1511] border border-[#3C4A42]/50 rounded-xl px-4 py-3 text-[#DDE4DD] focus:outline-none focus:border-[#9CC88D] transition-all resize-none leading-relaxed"
                      placeholder="Add specific details to help identification..."
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="px-8 pb-8 pt-2 flex flex-col sm:flex-row justify-end gap-4 relative z-10">
                <button
                  onClick={() => navigate(`/my-reports/${id}`)}
                  disabled={isSaving}
                  className="px-8 py-3 bg-[#C62828] hover:bg-[#B71C1C] text-white font-bold rounded-full transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-8 py-3 bg-[#164A41] hover:bg-[#13342E] text-[#9CC88D] border border-[#9CC88D]/30 font-bold rounded-full flex items-center justify-center gap-2 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-[#9CC88D] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                      />
                    </svg>
                  )}

                  {isSaving ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}