import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";

function ReportItem() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [reportType, setReportType] = useState("LOST");
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    category: "Electronics",
    location: "",
    date: "",
    description: "",
    foundLocation: "",
  });

  const readStorageArray = (key) => {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch (error) {
      console.error(`Failed to read ${key}`, error);
      return [];
    }
  };

  const writeStorageArray = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  const getCurrentUserProfile = () => {
    const currentUserEmail = localStorage.getItem("currentUserEmail") || "";

    if (!currentUserEmail) {
      return {
        email: "",
        name: "Student",
      };
    }

    let reporterName = currentUserEmail.split("@")[0];

    const profileKey = `temuProfile_${currentUserEmail}`;
    const savedProfile = localStorage.getItem(profileKey);

    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);

        if (parsed.fullName) {
          reporterName = parsed.fullName.split(" ")[0];
        }
      } catch (error) {
        console.error("Failed to read profile", error);
      }
    }

    return {
      email: currentUserEmail,
      name: reporterName,
    };
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ["image/png", "image/jpeg"];

    if (!allowedTypes.includes(file.type)) {
      alert("Only PNG, JPG, or JPEG images are allowed.");
      event.target.value = "";
      return;
    }

    if (file.size > maxSize) {
      alert("Image size must be less than 5MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setImagePreview(reader.result);
    };

    reader.readAsDataURL(file);
  };

  const formatDateText = (dateValue) => {
    if (!dateValue) return "Just now";

    return new Date(dateValue).toLocaleDateString("en-US", {
      month: "long",
      day: "2-digit",
      year: "numeric",
    });
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      alert("Item Name is required!");
      return false;
    }

    if (!formData.category) {
      alert("Category is required!");
      return false;
    }

    if (reportType === "LOST" && !formData.location.trim()) {
      alert("Location Lost is required!");
      return false;
    }

    if (reportType === "FOUND" && !formData.foundLocation.trim()) {
      alert("Please fill where you found it.");
      return false;
    }

    if (!formData.date) {
      alert("Date is required!");
      return false;
    }

    if (!formData.description.trim()) {
      alert("Description is required!");
      return false;
    }

    if (!imagePreview) {
      alert("Photo Upload is required!");
      return false;
    }

    return true;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    const now = new Date().toISOString();
    const reportId = Date.now();

    const currentUser = getCurrentUserProfile();

    const itemLocation =
      reportType === "FOUND" ? formData.foundLocation : formData.location;

    const reportImage = imagePreview;

    const newReport = {
      id: reportId,
      type: reportType,
      status: "searching",

      reporterName: currentUser.name,
      reporterEmail: currentUser.email,

      title: formData.title.trim(),
      category: formData.category,
      description: formData.description.trim(),

      location: itemLocation,
      date: formData.date || now,
      dateText: formatDateText(formData.date),

      image: reportImage,

      foundLocation:
        reportType === "FOUND" ? formData.foundLocation.trim() : undefined,

      foundLocation:
        reportType === "FOUND" ? formData.foundLocation.trim() : undefined,

      potentialFounders: [],
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
      resolvedDate: null,
      ownerVerified: false,
    };

    const existingReports = readStorageArray("temuReports");

    writeStorageArray("temuReports", [newReport, ...existingReports]);

    const newActivity = {
      id: `activity_${reportId}`,
      reportId,
      kind: reportType === "FOUND" ? "found1" : "urgent1",
      type: reportType,
      title: reportType === "FOUND" ? "New Found Item" : "Urgent Lost",
      text: `${formData.title.trim()} reported as ${reportType.toLowerCase()} at ${reportType === "FOUND"
        ? formData.foundLocation.trim()
        : formData.location.trim()
        }.`,
      time: "Just now",
      place:
      reportType === "FOUND"
        ? formData.foundLocation.trim()
        : formData.location.trim(),
      createdAt: now,
    };

    const existingActivities = readStorageArray("temuActivities");

    writeStorageArray("temuActivities", [
      newActivity,
      ...existingActivities,
    ]);

    navigate("/success-process");
  };

  return (
    <div className="flex h-screen bg-[#0E1511] text-white overflow-hidden selection:bg-[#164A41] selection:text-white">
      <Sidebar activePage="report-item" />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col items-center">
          <div className="w-full max-w-225 flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
              <div>
                <h2 className="text-[#DDE4DD] text-3xl font-bold mb-2">
                  Report New Item
                </h2>

                <p className="text-[#BBCABF] text-base">
                  Provide details to help us track and return items quickly.
                </p>
              </div>

              <div className="flex p-1 bg-[#1A211D] rounded-xl border border-[#3C4A42]">
                <button
                  type="button"
                  onClick={() => setReportType("LOST")}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${reportType === "LOST"
                    ? "bg-[#EF4444]/20 text-[#EF4444] shadow-sm"
                    : "text-[#86948A] hover:text-[#BBCABF]"
                    }`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  Report Lost
                </button>

                <button
                  type="button"
                  onClick={() => setReportType("FOUND")}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${reportType === "FOUND"
                    ? "bg-[#9CC88D] text-[#13342E] shadow-sm"
                    : "text-[#86948A] hover:text-[#BBCABF]"
                    }`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Report Found
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="w-full bg-[#1A211D] border border-[#3C4A42]/30 rounded-3xl p-8 backdrop-blur-md shadow-xl flex flex-col gap-8 relative overflow-hidden"
            >
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#9CC88D]/5 rounded-full blur-[80px] pointer-events-none"></div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[#DDE4DD] text-sm font-bold tracking-tight">
                      Item Name
                    </label>

                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Example: Kunci Kost, Dompet Hitam, Laptop Asus..."
                      className="w-full bg-[#0E1511] border border-[#3C4A42] rounded-xl px-4 py-3 text-[#DDE4DD] placeholder:text-[#657066] outline-none focus:border-[#9CC88D]"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[#DDE4DD] text-sm font-bold tracking-tight">
                      Category
                    </label>

                    <div className="relative">
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full bg-[#0E1511] border border-[#3C4A42] rounded-xl py-3 px-4 text-[#DDE4DD] appearance-none focus:outline-none focus:border-[#9CC88D] transition-colors cursor-pointer"
                        required
                      >
                        <option>Electronics</option>
                        <option>Keys</option>
                        <option>Wallets & IDs</option>
                        <option>Clothing</option>
                        <option>Books</option>
                        <option>Others</option>
                      </select>

                      <svg
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
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

                  {reportType === "LOST" && (
                    <div className="flex flex-col gap-2">
                      <label className="text-[#DDE4DD] text-sm font-bold tracking-tight">
                        Location / Building Lost
                      </label>

                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="e.g. Near Science Building entrance"
                        className="w-full bg-[#0E1511] border border-[#3C4A42] rounded-xl py-3 px-4 text-[#DDE4DD] placeholder:text-gray-600 focus:outline-none focus:border-[#9CC88D] transition-colors"
                        required
                      />
                    </div>
                  )}

                  {reportType === "FOUND" && (
                    <>
                      <div className="flex flex-col gap-2">
                        <label className="text-[#DDE4DD] text-sm font-bold tracking-tight">
                          Where did you find it?
                        </label>

                        <input
                          type="text"
                          name="foundLocation"
                          value={formData.foundLocation}
                          onChange={handleInputChange}
                          placeholder="e.g. Fasilkom-TI Gedung D-104"
                          className="w-full bg-[#0E1511] border border-[#3C4A42] rounded-xl py-3 px-4 text-[#DDE4DD] placeholder:text-gray-600 focus:outline-none focus:border-[#9CC88D] transition-colors"
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[#DDE4DD] text-sm font-bold tracking-tight">
                          Where is it stored now?
                        </label>

                        <div className="relative">
                          <select
                            name="storageLocation"
                            value={formData.storageLocation}
                            onChange={handleInputChange}
                            className="w-full bg-[#0E1511] border border-[#3C4A42] rounded-xl py-3 px-4 text-[#DDE4DD] appearance-none focus:outline-none focus:border-[#9CC88D] transition-colors cursor-pointer"
                            required
                          >
                            <option value="Pos Satpam Pintu 1 USU">
                              Pos Satpam Pintu 1 USU
                            </option>
                            <option value="Pos Satpam Pintu 2 USU">
                              Pos Satpam Pintu 2 USU
                            </option>
                            <option value="Unit Keamanan Kampus USU">
                              Unit Keamanan Kampus USU
                            </option>
                            <option value="Unit Layanan Terpadu (ULT) USU">
                              Unit Layanan Terpadu (ULT) USU
                            </option>
                            <option value="Biro Pusat Administrasi USU">
                              Biro Pusat Administrasi USU
                            </option>
                            <option value="Perpustakaan Pusat USU">
                              Perpustakaan Pusat USU
                            </option>
                            <option value="Sekretariat Fakultas / Front Office Fakultas">
                              Sekretariat Fakultas / Front Office Fakultas
                            </option>
                            <option value="Bagian Akademik Fakultas">
                              Bagian Akademik Fakultas
                            </option>
                            <option value="Ruang Tata Usaha Departemen">
                              Ruang Tata Usaha Departemen
                            </option>
                            <option value="Kantor Program Studi">
                              Kantor Program Studi
                            </option>
                            <option value="Other (Detail in description)">
                              Other (Provide details in description)
                            </option>
                          </select>

                          <svg
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
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
                    </>
                  )}

                  <div className="flex gap-4">
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="text-[#DDE4DD] text-sm font-bold tracking-tight">
                        Date
                      </label>

                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        className="w-full bg-[#0E1511] border border-[#3C4A42] rounded-xl py-3 px-4 text-[#DDE4DD] placeholder:text-gray-600 focus:outline-none focus:border-[#9CC88D] transition-colors cursor-pointer css-date-picker-icon"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[#DDE4DD] text-sm font-bold tracking-tight">
                      Description
                    </label>

                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder={
                        reportType === "FOUND"
                          ? "Mention item details and where you deposited it, e.g. already left at Fasilkom-TI security post."
                          : "Mention any distinguishing features like stickers, scratches, or protective cases..."
                      }
                      className="w-full h-32 bg-[#0E1511] border border-[#3C4A42] rounded-xl py-3 px-4 text-[#DDE4DD] placeholder:text-gray-600 focus:outline-none focus:border-[#9CC88D] transition-colors resize-none"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2 flex-1">
                    <label className="text-[#DDE4DD] text-sm font-bold tracking-tight">
                      Photo Upload
                    </label>

                    <div
                      className="flex-1 bg-[#0E1511] border-2 border-dashed border-[#3C4A42] rounded-xl flex flex-col justify-center items-center gap-3 cursor-pointer hover:border-[#9CC88D] transition-colors relative overflow-hidden group"
                      onClick={() =>
                        fileInputRef.current && fileInputRef.current.click()
                      }
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                      />

                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover absolute inset-0 opacity-80 group-hover:opacity-50 transition-opacity"
                        />
                      ) : (
                        <>
                          <svg
                            className="w-10 h-10 text-gray-500 group-hover:text-[#9CC88D] transition-colors"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                            />
                          </svg>

                          <div className="text-center">
                            <p className="text-[#DDE4DD] text-sm font-bold tracking-tight">
                              Click or Drag Image
                            </p>

                            <p className="text-gray-500 text-xs mt-1">
                              PNG, JPG or JPEG (Max 5MB)
                            </p>
                          </div>
                        </>
                      )}

                      {imagePreview && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <p className="bg-black/70 px-4 py-2 rounded-lg text-sm font-bold">
                            Change Image
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-[#3C4A42]/30 mt-2"></div>

              <div className="flex justify-end items-center gap-4">
                <Link
                  to="/dashboard"
                  className="px-8 py-3 text-stone-300 font-bold hover:text-white transition-colors"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  className="px-8 py-3 bg-[#9CC88D] hover:bg-[#8bb47d] text-[#13342E] font-bold rounded-xl flex items-center gap-2 transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  Post Item

                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

export default ReportItem;