import { useState } from "react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";

const DEFAULT_SETTINGS = {
  emailNotifications: true,
  matchNotifications: true,
  chatNotifications: true,
  profileVisibility: "limited",
  showContactInfo: false,
  compactMode: false,
};

function SettingToggle({ title, description, checked, onClick }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-[#0E1511] border border-[#3C4A42]/60 rounded-xl p-4">
      <div>
        <h3 className="text-[#DDE4DD] font-semibold">{title}</h3>
        <p className="text-[#86948A] text-sm mt-1">{description}</p>
      </div>
      <button type="button" onClick={onClick}
        className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${checked ? "bg-[#9CC88D]" : "bg-[#3C4A42]"}`}>
        <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [savedMessage, setSavedMessage] = useState("");

  const handleToggle = (key) => setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  const handleChange = (e) => setSettings((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = () => {
    setSavedMessage("Settings saved successfully.");
    setTimeout(() => setSavedMessage(""), 2500);
  };

  return (
    <div className="flex h-screen bg-[#0E1511] text-white overflow-hidden selection:bg-[#164A41] selection:text-white">
      <Sidebar activePage="settings" />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-5xl mx-auto flex flex-col gap-6">
            <section className="bg-[#164A41]/40 border border-[#4D774E]/20 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute -top-24 -right-20 w-64 h-64 bg-[#164A41] rounded-full blur-2xl opacity-60" />
              <div className="relative z-10">
                <p className="text-[#9CC88D] text-sm font-bold uppercase tracking-[0.2em] mb-3">Preferences</p>
                <h1 className="text-[#E2E3DD] text-3xl md:text-4xl font-bold mb-3">Settings</h1>
                <p className="text-[#C2C9BD] text-base md:text-lg max-w-2xl">Manage your account preferences and notification options.</p>
              </div>
            </section>

            <section className="bg-[#1A211D] border border-[#3C4A42]/50 rounded-2xl p-6">
              <h2 className="text-[#DDE4DD] text-xl font-bold mb-1">Account Information</h2>
              <p className="text-[#86948A] text-sm mb-6">Your current account details.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0E1511] border border-[#3C4A42]/60 rounded-xl p-4">
                  <p className="text-[#86948A] text-sm font-semibold mb-1">Email</p>
                  <p className="text-[#DDE4DD] font-semibold break-all">{user?.email || "-"}</p>
                </div>
                <div className="bg-[#0E1511] border border-[#3C4A42]/60 rounded-xl p-4">
                  <p className="text-[#86948A] text-sm font-semibold mb-1">Role</p>
                  <p className="text-[#DDE4DD] font-semibold capitalize">{user?.role || "student"}</p>
                </div>
              </div>
            </section>

            <section className="bg-[#1A211D] border border-[#3C4A42]/50 rounded-2xl p-6">
              <h2 className="text-[#DDE4DD] text-xl font-bold mb-1">Notifications</h2>
              <p className="text-[#86948A] text-sm mb-6">Choose what kind of updates you want to receive.</p>
              <div className="flex flex-col gap-4">
                <SettingToggle title="Email Notifications" description="Receive important system updates through email." checked={settings.emailNotifications} onClick={() => handleToggle("emailNotifications")} />
                <SettingToggle title="Potential Match Alerts" description="Notify me when the system detects a possible matching item." checked={settings.matchNotifications} onClick={() => handleToggle("matchNotifications")} />
                <SettingToggle title="Chat Notifications" description="Notify me when someone sends a new message." checked={settings.chatNotifications} onClick={() => handleToggle("chatNotifications")} />
              </div>
            </section>

            <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#1A211D] border border-[#3C4A42]/50 rounded-2xl p-6">
              <div>
                <h2 className="text-[#DDE4DD] text-xl font-bold">Save Changes</h2>
                {savedMessage && <p className="text-[#9CC88D] text-sm font-semibold mt-2">{savedMessage}</p>}
              </div>
              <button type="button" onClick={handleSave} className="bg-[#9CC88D] hover:bg-[#8bb47d] text-[#13342E] font-bold px-6 py-3 rounded-xl transition-colors">
                Save Settings
              </button>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}