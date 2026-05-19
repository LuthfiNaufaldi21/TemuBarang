import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";

function extractStudentId(email) {
  if (!email) return "";
  const username = email.split("@")[0];
  return /^\d+$/.test(username) ? username : "";
}

function EditProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState(() => {
    const currentUserEmail = localStorage.getItem("currentUserEmail");

    if (currentUserEmail) {
      const profileKey = `temuProfile_${currentUserEmail}`;
      const saved = localStorage.getItem(profileKey);

      if (saved) {
        try {
          const parsed = JSON.parse(saved);

          return {
            fullName: parsed.fullName || currentUserEmail.split("@")[0],
            phone: parsed.phone || "",
            location:
              parsed.location ||
              "Fasilkom-TI ",
            id: parsed.id || extractStudentId(currentUserEmail),
            email: parsed.email || currentUserEmail,
          };
        } catch {
          
        }
      }

      return {
        fullName: currentUserEmail.split("@")[0],
        phone: "",
        location: "Fasilkom-TI ",
        id: extractStudentId(currentUserEmail),
        email: currentUserEmail,
      };
    }

    return {
      fullName: "",
      phone: "",
      location: "Fasilkom-TI ",
      id: "",
      email: "",
    };
  });

  const [avatarPreview, setAvatarPreview] = useState(() => {
    const currentUserEmail = localStorage.getItem("currentUserEmail");

    if (currentUserEmail) {
      const profileKey = `temuProfile_${currentUserEmail}`;
      const saved = localStorage.getItem(profileKey);

      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed.avatarUrl || null;
        } catch {
          return null;
        }
      }
    }

    return null;
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };

      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setAvatarPreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const currentUserEmail = localStorage.getItem("currentUserEmail");
    if (!currentUserEmail) return;

    const profileKey = `temuProfile_${currentUserEmail}`;
    const saved = localStorage.getItem(profileKey);
    const existingProfile = saved ? JSON.parse(saved) : {};

    const payload = {
      ...existingProfile,
      fullName: formData.fullName,
      phone: formData.phone,
      location: formData.location,
      id: formData.id,
      avatarUrl: avatarPreview,
    };

    localStorage.setItem(profileKey, JSON.stringify(payload));
    navigate("/profile");
  };

  return (
    <div className="flex h-screen bg-[#0E1511] text-white overflow-hidden selection:bg-[#164A41] selection:text-white">
      <Sidebar activePage="profile" />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col items-center">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-6xl flex flex-col gap-6 pb-10"
          >
            <div className="w-full bg-[#1A211D] border border-[#3C4A42]/30 rounded-xl p-8 backdrop-blur-md flex flex-col md:flex-row items-center gap-8 shadow-sm">
              <div className="relative">
                <div className="relative w-32 h-32 rounded-full border-4 border-[#9CC88D] bg-[#164A41] shadow-2xl flex items-center justify-center overflow-hidden">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Profile Preview"
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

                <div className="absolute bottom-1 right-1 w-9 h-9 bg-[#9CC88D] rounded-full border-4 border-[#1A211D] flex items-center justify-center pointer-events-none">
                  <svg
                    className="w-4 h-4 text-[#13342E]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
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
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h2 className="text-[#DDE4DD] text-xl font-semibold mb-1">
                  Profile Picture
                </h2>

                <p className="text-[#BBCABF] text-base mb-4">
                  Recommended: JPG, PNG or WebP. Max size 2MB.
                </p>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current && fileInputRef.current.click()
                    }
                    className="px-4 py-2 bg-[#9CC88D] text-[#13342E] rounded-lg text-sm font-medium hover:bg-[#8bb47d] transition-colors"
                  >
                    Upload New Photo
                  </button>

                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="px-4 py-2 bg-[#2F3632] text-[#BBCABF] rounded-lg text-sm font-medium hover:bg-[#3C4A42] transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>

            <div className="w-full bg-[#1A211D] border border-[#3C4A42]/30 rounded-xl p-8 backdrop-blur-md flex flex-col gap-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#9CC88D]/20 flex items-center justify-center text-[#9CC88D]">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>

                <h2 className="text-[#DDE4DD] text-xl font-semibold">
                  Personal Information
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[#BBCABF] text-sm font-medium pl-1">
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full bg-[#0E1511] border border-[#3C4A42] rounded-xl py-3 px-4 text-[#DDE4DD] focus:outline-none focus:border-[#9CC88D] transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-2 md:col-start-2 md:row-start-1">
                  <label className="text-[#BBCABF] text-sm font-medium pl-1">
                    Student / Staff ID
                  </label>

                  <input
                    type="text"
                    name="id"
                    value={formData.id}
                    onChange={handleInputChange}
                    placeholder="Masukkan NIM / NIP"
                    className="w-full bg-[#0E1511] border border-[#3C4A42] rounded-xl py-3 px-4 text-[#DDE4DD] placeholder:text-[#52525B] focus:outline-none focus:border-[#9CC88D] transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-2 md:col-start-1 md:row-start-2">
                  <label className="text-[#BBCABF] text-sm font-medium pl-1">
                    Institutional Email
                  </label>

                  <div className="relative">
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full bg-[#2F3632] opacity-70 border border-[#3C4A42]/50 rounded-xl py-3 pl-4 pr-10 text-[#BBCABF] cursor-not-allowed"
                    />

                    <svg
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86948A]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full bg-[#1A211D] border border-[#3C4A42]/30 rounded-xl p-8 backdrop-blur-md flex flex-col gap-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#9CC88D]/20 flex items-center justify-center text-[#9CC88D]">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>

                <h2 className="text-[#DDE4DD] text-xl font-semibold">
                  Contact Information
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[#BBCABF] text-sm font-medium pl-1">
                    Phone Number
                  </label>

                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+62 8xx-xxxx-xxxx"
                    className="w-full bg-[#0E1511] border border-[#3C4A42] rounded-xl py-3 px-4 text-[#DDE4DD] placeholder:text-[#52525B] focus:outline-none focus:border-[#9CC88D] transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[#BBCABF] text-sm font-medium pl-1">
                    Primary Campus Location
                  </label>

                  <div className="relative">
                    <select
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full bg-[#0E1511] border border-[#3C4A42] rounded-xl py-3 px-4 pr-10 text-[#DDE4DD] appearance-none focus:outline-none focus:border-[#9CC88D] transition-colors cursor-pointer"
                    >
                      <optgroup label="Main Facilities">
                        <option value="Rectorate Building (Biro Pusat Administrasi)">
                          Rectorate Building (Biro Pusat Administrasi)
                        </option>
                        <option value="University Library (Perpustakaan USU)">
                          University Library (Perpustakaan USU)
                        </option>
                        <option value="USU Hospital (Rumah Sakit USU)">
                          USU Hospital (Rumah Sakit USU)
                        </option>
                        <option value="Student Center (Gelanggang Mahasiswa)">
                          Student Center (Gelanggang Mahasiswa)
                        </option>
                        <option value="Auditorium USU">Auditorium USU</option>
                      </optgroup>

                      <optgroup label="Faculties">
                        <option value="Fasilkom-TI (Ilmu Komputer dan Teknologi Informasi)">
                          Fasilkom-TI (Ilmu Komputer dan Teknologi Informasi)
                        </option>
                        <option value="Fakultas Kedokteran">
                          Fakultas Kedokteran
                        </option>
                        <option value="Fakultas Hukum">Fakultas Hukum</option>
                        <option value="Fakultas Pertanian">
                          Fakultas Pertanian
                        </option>
                        <option value="Fakultas Teknik">Fakultas Teknik</option>
                        <option value="Fakultas Ekonomi dan Bisnis">
                          Fakultas Ekonomi dan Bisnis
                        </option>
                        <option value="Fakultas Kedokteran Gigi">
                          Fakultas Kedokteran Gigi
                        </option>
                        <option value="Fakultas Ilmu Budaya">
                          Fakultas Ilmu Budaya
                        </option>
                        <option value="FMIPA (Matematika dan Ilmu Pengetahuan Alam)">
                          FMIPA (Matematika dan Ilmu Pengetahuan Alam)
                        </option>
                        <option value="FISIP (Ilmu Sosial dan Ilmu Politik)">
                          FISIP (Ilmu Sosial dan Ilmu Politik)
                        </option>
                        <option value="FKM (Kesehatan Masyarakat)">
                          FKM (Kesehatan Masyarakat)
                        </option>
                        <option value="Fakultas Farmasi">
                          Fakultas Farmasi
                        </option>
                        <option value="Fakultas Psikologi">
                          Fakultas Psikologi
                        </option>
                        <option value="Fakultas Keperawatan">
                          Fakultas Keperawatan
                        </option>
                        <option value="Fakultas Kehutanan">
                          Fakultas Kehutanan
                        </option>
                        <option value="Fakultas Vokasi">Fakultas Vokasi</option>
                        <option value="Sekolah Pascasarjana">
                          Sekolah Pascasarjana
                        </option>
                      </optgroup>
                    </select>

                    <svg
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86948A] pointer-events-none"
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
              </div>
            </div>

            <div className="w-full flex flex-col sm:flex-row items-center justify-end gap-4 mt-2">
              <button
                type="submit"
                className="w-full sm:w-auto px-12 py-3 bg-[#9CC88D] hover:bg-[#8bb47d] text-[#13342E] rounded-xl text-sm font-medium transition-colors"
              >
                Save Changes
              </button>

              <Link
                to="/profile"
                className="w-full sm:w-auto px-12 py-3 bg-transparent border border-[#A1A1AA] hover:bg-white/5 text-[#DDE4DD] rounded-xl text-sm font-medium text-center transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

export default EditProfile;