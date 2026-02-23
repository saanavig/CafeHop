import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Bell, Lock, Moon, X, Camera, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useMode } from "@/context/Mode";

type PreferencesProps = {
  role: "customer" | "cafe";
};

const Preferences = ({ role }: PreferencesProps) => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useMode();

  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  const [profile, setProfile] = useState({
    name: "Cafe Hopper",
    email: "cafe.hopper@email.com",
    profilePic: null as File | null,
  });

  const [cafeInfo, setCafeInfo] = useState({
    about: "We serve the best coffee in town!",
    timings: "Mon-Sun 8am-8pm",
    tags: ["Cozy", "Specialty Coffee"],
    hours: {} as Record<string, { open?: string; close?: string; closed?: boolean }>,
    preferences: {
      wifi: true,
      quiet: false,
      outdoorSeating: true,
      liveMusic: false,
      petFriendly: false,
      veganOptions: true,
      glutenFree: false,
      specialtyCoffee: true,
      groupSeating: false,
      wheelchairAccessible: true,
      liveSports: false,
      boardGames: true,
    },
  });

  const [privacy, setPrivacy] = useState({
    privateAccount: false,
    twoFactorAuth: false,
    emailNotifications: true,
  });

  const cafePreferenceCategories = [
    {
      title: "Ambience",
      options: [
        { key: "wifi", label: "Free WiFi" },
        { key: "quiet", label: "Quiet Atmosphere" },
        { key: "outdoorSeating", label: "Outdoor Seating" },
        { key: "liveMusic", label: "Live Music" },
        { key: "petFriendly", label: "Pet-Friendly" },
      ],
    },
    {
      title: "Food & Drink",
      options: [
        { key: "veganOptions", label: "Vegan Options" },
        { key: "glutenFree", label: "Gluten-Free Options" },
        { key: "specialtyCoffee", label: "Specialty Coffee" },
      ],
    },
    {
      title: "Seating & Accessibility",
      options: [
        { key: "groupSeating", label: "Group Seating" },
        { key: "wheelchairAccessible", label: "Wheelchair Accessible" },
      ],
    },
    {
      title: "Other",
      options: [
        { key: "liveSports", label: "Live Sports" },
        { key: "boardGames", label: "Board Games" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background px-4">
      {/* Header */}
      <header className="flex items-center gap-3 py-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted transition">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-semibold">Preferences</h1>
      </header>

      <main className="max-w-lg mx-auto space-y-6">
        {/* General Preferences */}
        <section>
          <p className="text-sm font-medium mb-2">General</p>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-caramel" />
                <div>
                  <p className="font-medium">Notifications</p>
                  <p className="text-xs text-muted-foreground">Rewards, visits, and updates</p>
                </div>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Moon className="h-5 w-5 text-caramel" />
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-xs text-muted-foreground">System appearance</p>
                </div>
              </div>
              <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
            </div>

            <button
              className="w-full flex items-center justify-between p-4 hover:bg-muted transition"
              onClick={() => setShowEditProfile(true)}
            >
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-caramel" />
                <p className="font-medium">
                  {role === "cafe" ? "Edit Cafe Profile & Preferences" : "Edit Preferences"}
                </p>
              </div>
            </button>

            <button
              className="w-full flex items-center justify-between p-4 hover:bg-muted transition"
              onClick={() => setShowPrivacy(true)}
            >
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-caramel" />
                <p className="font-medium">Privacy & Security</p>
              </div>
            </button>
          </div>
        </section>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-xs text-muted-foreground"
        >
          CafeHop v1.0.0
        </motion.p>
      </main>

      {/* ---------------- MODALS ---------------- */}

      {/* Edit Profile / Cafe Info Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-card p-8 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setShowEditProfile(false)}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="font-semibold text-lg mb-4">
              {role === "cafe" ? "Edit Cafe Profile & Preferences" : "Edit Preferences"}
            </h2>

            {/* ---------- Cafe Only: Profile & About ---------- */}
            {role === "cafe" && (
              <>
                {/* Profile Pic */}
                <div className="relative w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-caramel to-primary flex items-center justify-center shadow-elevated cursor-pointer">
                  {profile.profilePic ? (
                    <img
                      src={URL.createObjectURL(profile.profilePic)}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-12 w-12 text-primary-foreground" />
                  )}
                  <label
                    htmlFor="profilePicInput"
                    className="absolute bottom-0 right-0 h-6 w-6 bg-caramel rounded-full flex items-center justify-center cursor-pointer"
                  >
                    <Camera className="h-4 w-4 text-white" />
                  </label>
                  <input
                    id="profilePicInput"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      e.target.files?.[0] &&
                      setProfile({ ...profile, profilePic: e.target.files[0] })
                    }
                  />
                </div>

                {/* Name & Email */}
                <input
                  type="text"
                  className="w-full mb-2 p-2 border rounded"
                  placeholder="Name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
                <input
                  type="email"
                  className="w-full mb-2 p-2 border rounded"
                  placeholder="Email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />

                {/* About */}
                <textarea
                  className="w-full mb-2 p-2 border rounded"
                  placeholder="About your cafe"
                  rows={3}
                  value={cafeInfo.about}
                  onChange={(e) => setCafeInfo({ ...cafeInfo, about: e.target.value })}
                />

                {/* Timings - Aligned */}
                <div className="mb-2">
                  <label className="block mb-1 font-medium text-sm">Timings</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded text-sm text-muted-foreground"
                    placeholder="Mon-Sun 8am-8pm"
                    value={cafeInfo.timings}
                    onChange={(e) => setCafeInfo({ ...cafeInfo, timings: e.target.value })}
                  />
                </div>
              </>
            )}

            {/* ---------- Cafe + Customer: Preferences Buttons ---------- */}
            <div className="space-y-4 mt-4">
              {cafePreferenceCategories.map((cat) => (
                <div key={cat.title}>
                  <p className="font-semibold text-sm mb-2">{cat.title}</p>
                  <div className="flex flex-wrap gap-2">
                    {cat.options.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() =>
                          setCafeInfo({
                            ...cafeInfo,
                            preferences: {
                              ...cafeInfo.preferences,
                              [opt.key]: !cafeInfo.preferences[opt.key],
                            },
                          })
                        }
                        className={`px-3 py-1 rounded-full text-sm border transition ${
                          cafeInfo.preferences[opt.key]
                            ? "bg-caramel text-white border-caramel"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Hours Section */}
            {role === "cafe" && (
              <div className="space-y-2 mt-4">
                <p className="text-sm text-muted-foreground">
                  Set your café hours. Check "Closed" if the café is not open on a day.
                </p>
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
                  const dayHours = cafeInfo.hours[day] || {};
                  const isClosed = dayHours.closed;
                  return (
                    <div key={day} className="flex items-center gap-3">
                      <span className="w-16 font-medium">{day}</span>
                      <input
                        type="time"
                        value={dayHours.open || ""}
                        onChange={(e) =>
                          setCafeInfo({
                            ...cafeInfo,
                            hours: {
                              ...cafeInfo.hours,
                              [day]: { ...dayHours, open: e.target.value },
                            },
                          })
                        }
                        disabled={isClosed}
                        className="border border-gray-300 rounded px-2 py-1 w-28"
                      />
                      <span className="text-sm font-medium">to</span>
                      <input
                        type="time"
                        value={dayHours.close || ""}
                        onChange={(e) =>
                          setCafeInfo({
                            ...cafeInfo,
                            hours: {
                              ...cafeInfo.hours,
                              [day]: { ...dayHours, close: e.target.value },
                            },
                          })
                        }
                        disabled={isClosed}
                        className="border border-gray-300 rounded px-2 py-1 w-28"
                      />
                      <label className="ml-4 flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={isClosed || false}
                          onChange={(e) =>
                            setCafeInfo({
                              ...cafeInfo,
                              hours: {
                                ...cafeInfo.hours,
                                [day]: { ...dayHours, closed: e.target.checked },
                              },
                            })
                          }
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        Closed
                      </label>
                    </div>
                  );
                })}
              </div>
            )}

            <Button className="w-full mt-6" onClick={() => setShowEditProfile(false)}>
              Save Changes
            </Button>
          </div>
        </div>
      )}

      {/* Privacy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-card p-6 rounded-2xl w-full max-w-sm">
            <button
              onClick={() => setShowPrivacy(false)}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition"
            >
              <X className="h-4 w-4" />
            </button>
            <h2 className="font-semibold text-lg mb-4">Privacy & Security</h2>

            <div className="space-y-2">
              <label className="flex items-center justify-between">
                <span>Private Account</span>
                <Switch
                  checked={privacy.privateAccount}
                  onCheckedChange={(val) => setPrivacy({ ...privacy, privateAccount: val })}
                />
              </label>
              <label className="flex items-center justify-between">
                <span>Two-Factor Auth</span>
                <Switch
                  checked={privacy.twoFactorAuth}
                  onCheckedChange={(val) => setPrivacy({ ...privacy, twoFactorAuth: val })}
                />
              </label>
              <label className="flex items-center justify-between">
                <span>Email Notifications</span>
                <Switch
                  checked={privacy.emailNotifications}
                  onCheckedChange={(val) => setPrivacy({ ...privacy, emailNotifications: val })}
                />
              </label>
            </div>

            <Button className="w-full mt-4" onClick={() => setShowPrivacy(false)}>
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Preferences;