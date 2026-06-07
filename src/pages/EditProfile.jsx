import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    faculty: user?.faculty || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = await authAPI.updateProfile(formData);
      updateUser(data.user);
      navigate("/profile");
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0E1511] text-white overflow-hidden selection:bg-[#164A41] selection:text-white">
      <Sidebar activePage="profile" />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col items-center">
          <form onSubmit={handleSubmit} className="w-full max-w-6xl flex flex-col gap-6 pb-10">
            <div className="w-full bg-[#1A211D] border border-[#3C4A42]/30 rounded-xl p-8 backdrop-blur-md flex flex-col gap-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#9CC88D]/20 flex items-center justify-center text-[#9CC88D]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-[#DDE4DD] text-xl font-semibold">Personal Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[#BBCABF] text-sm font-medium pl-1">Full Name</label>
                  <input type="text" name="full_name" value={formData.full_name} onChange={handleInputChange}
                    className="w-full bg-[#0E1511] border border-[#3C4A42] rounded-xl py-3 px-4 text-[#DDE4DD] focus:outline-none focus:border-[#9CC88D] transition-colors" />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[#BBCABF] text-sm font-medium pl-1">Institutional Email</label>
                  <input type="email" value={user?.email || ""} disabled
                    className="w-full bg-[#2F3632] opacity-70 border border-[#3C4A42]/50 rounded-xl py-3 px-4 text-[#BBCABF] cursor-not-allowed" />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[#BBCABF] text-sm font-medium pl-1">Faculty</label>
                  <div className="relative">
                    <select name="faculty" value={formData.faculty} onChange={handleInputChange}
                      className="w-full bg-[#0E1511] border border-[#3C4A42] rounded-xl py-3 px-4 pr-10 text-[#DDE4DD] appearance-none focus:outline-none focus:border-[#9CC88D] transition-colors cursor-pointer">
                      <option value="">-- Pilih Fakultas --</option>
                      <optgroup label="Faculties">
                        <option value="Fasilkom-TI">Fasilkom-TI (Ilmu Komputer dan Teknologi Informasi)</option>
                        <option value="Fakultas Kedokteran">Fakultas Kedokteran</option>
                        <option value="Fakultas Hukum">Fakultas Hukum</option>
                        <option value="Fakultas Pertanian">Fakultas Pertanian</option>
                        <option value="Fakultas Teknik">Fakultas Teknik</option>
                        <option value="Fakultas Ekonomi dan Bisnis">Fakultas Ekonomi dan Bisnis</option>
                        <option value="FMIPA">FMIPA</option>
                        <option value="FISIP">FISIP</option>
                        <option value="FKM">FKM (Kesehatan Masyarakat)</option>
                        <option value="Fakultas Farmasi">Fakultas Farmasi</option>
                        <option value="Fakultas Psikologi">Fakultas Psikologi</option>
                        <option value="Sekolah Pascasarjana">Sekolah Pascasarjana</option>
                      </optgroup>
                    </select>
                    <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86948A] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full flex flex-col sm:flex-row items-center justify-end gap-4 mt-2">
              <button type="submit" disabled={isSubmitting}
                className="w-full sm:w-auto px-12 py-3 bg-[#9CC88D] hover:bg-[#8bb47d] text-[#13342E] rounded-xl text-sm font-medium transition-colors disabled:opacity-60">
                {isSubmitting ? "Menyimpan..." : "Save Changes"}
              </button>
              <Link to="/profile" className="w-full sm:w-auto px-12 py-3 bg-transparent border border-[#A1A1AA] hover:bg-white/5 text-[#DDE4DD] rounded-xl text-sm font-medium text-center transition-colors">
                Cancel
              </Link>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}