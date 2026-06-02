import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";

function getCurrentUserEmail() {
  return localStorage.getItem("currentUserEmail") || "";
}

function getCurrentUserRole() {
  return localStorage.getItem("currentUserRole") || "student";
}

function getSavedSettings(email) {
  if (!email) return null;

  try {
    return JSON.parse(localStorage.getItem(`temuSettings_${email}`) || "null");
  } catch (error) {
    console.error("Failed to read settings:", error);
    return null;
  }
}

const DEFAULT_SETTINGS = {
  emailNotifications: true,
  matchNotifications: true,
  chatNotifications: true,
  profileVisibility: "limited",
  showContactInfo: false,
  compactMode: false,
};

export default function Settings() {
  const currentUserEmail = getCurrentUserEmail();
  const currentUserRole = getCurrentUserRole();

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    const savedSettings = getSavedSettings(currentUserEmail);

    if (savedSettings) {
      setSettings({
        ...DEFAULT_SETTINGS,
        ...savedSettings,
      });
    }
  }, [currentUserEmail]);

  const handleToggle = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    if (!currentUserEmail) {
      alert("User email not found. Please login again.");
      return;
    }

    localStorage.setItem(
      `temuSettings_${currentUserEmail}`,
      JSON.stringify(settings)
    );

    setSavedMessage("Settings saved successfully.");

    setTimeout(() => {
      setSavedMessage("");
    }, 2500);
  };

  const handleClearPrototypeData = () => {
    const confirmed = window.confirm(
      "This will clear prototype data such as reports, notifications, conversations, and watchlists from this browser. Continue?"
    );

    if (!confirmed) return;

    localStorage.removeItem("temuReports");
    localStorage.removeItem("temuNotifications");
    localStorage.removeItem("temuConversations");
    localStorage.removeItem("temuWatchlists");
    localStorage.removeItem("temuActivities");

    window.dispatchEvent(new Event("temuStorage"));

    alert("Prototype data has been cleared.");
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
                <p className="text-[#9CC88D] text-sm font-bold uppercase tracking-[0.2em] mb-3">
                  Preferences
                </p>

                <h1 className="text-[#E2E3DD] text-3xl md:text-4xl font-bold mb-3">
                  Settings
                </h1>

                <p className="text-[#C2C9BD] text-base md:text-lg max-w-2xl">
                  Manage your account preferences, notification options, and
                  privacy settings for TemuBarang.
                </p>
              </div>
            </section>

            <section className="bg-[#1A211D] border border-[#3C4A42]/50 rounded-2xl p-6">
              <h2 className="text-[#DDE4DD] text-xl font-bold mb-1">
                Account Information
              </h2>

              <p className="text-[#86948A] text-sm mb-6">
                Basic account details currently used in this prototype.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0E1511] border border-[#3C4A42]/60 rounded-xl p-4">
                  <p className="text-[#86948A] text-sm font-semibold mb-1">
                    Email
                  </p>
                  <p className="text-[#DDE4DD] font-semibold break-all">
                    {currentUserEmail || "-"}
                  </p>
                </div>

                <div className="bg-[#0E1511] border border-[#3C4A42]/60 rounded-xl p-4">
                  <p className="text-[#86948A] text-sm font-semibold mb-1">
                    Role
                  </p>
                  <p className="text-[#DDE4DD] font-semibold capitalize">
                    {currentUserRole}
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-[#1A211D] border border-[#3C4A42]/50 rounded-2xl p-6">
              <h2 className="text-[#DDE4DD] text-xl font-bold mb-1">
                Notifications
              </h2>

              <p className="text-[#86948A] text-sm mb-6">
                Choose what kind of updates you want to receive.
              </p>

              <div className="flex flex-col gap-4">
                <SettingToggle
                  title="Email Notifications"
                  description="Receive important system updates through email."
                  checked={settings.emailNotifications}
                  onClick={() => handleToggle("emailNotifications")}
                />

                <SettingToggle
                  title="Potential Match Alerts"
                  description="Notify me when the system detects a possible matching item."
                  checked={settings.matchNotifications}
                  onClick={() => handleToggle("matchNotifications")}
                />

                <SettingToggle
                  title="Chat Notifications"
                  description="Notify me when someone sends a new message."
                  checked={settings.chatNotifications}
                  onClick={() => handleToggle("chatNotifications")}
                />
              </div>
            </section>

            <section className="bg-[#1A211D] border border-[#3C4A42]/50 rounded-2xl p-6">
              <h2 className="text-[#DDE4DD] text-xl font-bold mb-1">
                Privacy
              </h2>

              <p className="text-[#86948A] text-sm mb-6">
                Control how much information is visible to other users.
              </p>

              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[#DDE4DD] text-sm font-semibold">
                    Profile Visibility
                  </label>

                  <select
                    name="profileVisibility"
                    value={settings.profileVisibility}
                    onChange={handleChange}
                    className="bg-[#0E1511] border border-[#3C4A42] rounded-xl px-4 py-3 text-[#DDE4DD] outline-none focus:border-[#9CC88D]"
                  >
                    <option value="limited">Limited - show basic profile only</option>
                    <option value="private">Private - hide most profile details</option>
                    <option value="public">Public - show profile to other users</option>
                  </select>
                </div>

                <SettingToggle
                  title="Show Contact Information"
                  description="Allow other users to see contact information. Recommended: off."
                  checked={settings.showContactInfo}
                  onClick={() => handleToggle("showContactInfo")}
                />
              </div>
            </section>

            <section className="bg-[#1A211D] border border-[#3C4A42]/50 rounded-2xl p-6">
              <h2 className="text-[#DDE4DD] text-xl font-bold mb-1">
                System Preferences
              </h2>

              <p className="text-[#86948A] text-sm mb-6">
                Adjust minor display preferences for the application.
              </p>

              <SettingToggle
                title="Compact Mode"
                description="Use a more compact layout for lists and report cards."
                checked={settings.compactMode}
                onClick={() => handleToggle("compactMode")}
              />
            </section>

            <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#1A211D] border border-[#3C4A42]/50 rounded-2xl p-6">
              <div>
                <h2 className="text-[#DDE4DD] text-xl font-bold">
                  Save Changes
                </h2>

                <p className="text-[#86948A] text-sm mt-1">
                  Your settings will be saved locally in this browser.
                </p>

                {savedMessage && (
                  <p className="text-[#9CC88D] text-sm font-semibold mt-2">
                    {savedMessage}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleSave}
                className="bg-[#9CC88D] hover:bg-[#8bb47d] text-[#13342E] font-bold px-6 py-3 rounded-xl transition-colors"
              >
                Save Settings
              </button>
            </section>

            <section className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
              <h2 className="text-red-300 text-xl font-bold mb-1">
                Danger Zone
              </h2>

              <p className="text-red-200/80 text-sm mb-5">
                This action is only for prototype testing. It clears local data
                from this browser.
              </p>

              <button
                type="button"
                onClick={handleClearPrototypeData}
                className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 font-bold px-5 py-3 rounded-xl transition-colors"
              >
                Clear Prototype Data
              </button>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

function SettingToggle({ title, description, checked, onClick }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-[#0E1511] border border-[#3C4A42]/60 rounded-xl p-4">
      <div>
        <h3 className="text-[#DDE4DD] font-semibold">{title}</h3>
        <p className="text-[#86948A] text-sm mt-1">{description}</p>
      </div>

      <button
        type="button"
        onClick={onClick}
        className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${
          checked ? "bg-[#9CC88D]" : "bg-[#3C4A42]"
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}