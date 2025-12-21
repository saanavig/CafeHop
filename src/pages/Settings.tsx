import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  Lock,
  User,
  Moon,
  LogOut,
  ChevronRight,
  X,
  Camera,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

type SettingsProps = {
  role: "customer" | "cafe"; // add role
};

const Settings = ({ role }: SettingsProps) => {
  const navigate = useNavigate();

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  // Shared profile state
  const [profile, setProfile] = useState({
    name: "Cafe Hopper",
    email: "cafe.hopper@email.com",
    profilePic: null as File | null,
  });

  // Cafe-specific state
  const [cafeInfo, setCafeInfo] = useState({
    about: "We serve the best coffee in town!",
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

  // Privacy state (same for all)
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
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-muted transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-semibold">Settings</h1>
      </header>

      <main className="max-w-lg mx-auto space-y-6">
        {/* Preferences */}
        <section>
          <p className="text-sm font-medium mb-2">Preferences</p>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-caramel" />
                <div>
                  <p className="font-medium">Notifications</p>
                  <p className="text-xs text-muted-foreground">
                    Rewards, visits, and updates
                  </p>
                </div>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Moon className="h-5 w-5 text-caramel" />
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-xs text-muted-foreground">System appearance</p>
                </div>
              </div>
              <Switch />
            </div>
          </div>
        </section>

        {/* Account */}
        <section>
          <p className="text-sm font-medium mb-2">Account</p>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-4 border-b border-border hover:bg-muted transition"
              onClick={() => setShowEditProfile(true)}
            >
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-caramel" />
                <p className="font-medium">Edit Profile</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>

            <button
              className="w-full flex items-center justify-between p-4 hover:bg-muted transition"
              onClick={() => setShowPrivacy(true)}
            >
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-caramel" />
                <p className="font-medium">Privacy & Security</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </section>

        {/* Sign out */}
        <section>
          <Button
            variant="outline"
            className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive flex items-center gap-2 justify-center"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
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

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-2xl w-full max-w-sm relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowEditProfile(false)}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition"
            >
              <X className="h-4 w-4" />
            </button>
            <h2 className="font-semibold text-lg mb-4">
              {role === "cafe" ? "Edit Cafe Profile" : "Edit Profile"}
            </h2>

            {/* Profile picture */}
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

            {/* Cafe-only fields */}
            {role === "cafe" && (
              <>
                {/* About */}
                <textarea
                  className="w-full mb-2 p-2 border rounded"
                  placeholder="About your cafe"
                  value={cafeInfo.about}
                  onChange={(e) =>
                    setCafeInfo({ ...cafeInfo, about: e.target.value })
                  }
                  rows={3}
                />

                {/* Preferences */}
                <div className="space-y-4 mt-2">
                  {cafePreferenceCategories.map((cat) => (
                    <div key={cat.title}>
                      <p className="font-semibold text-sm mb-2">{cat.title}</p>
                      <div className="space-y-1">
                        {cat.options.map((opt) => (
                          <label key={opt.key} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={cafeInfo.preferences[opt.key]}
                              onChange={() =>
                                setCafeInfo({
                                  ...cafeInfo,
                                  preferences: {
                                    ...cafeInfo.preferences,
                                    [opt.key]: !cafeInfo.preferences[opt.key],
                                  },
                                })
                              }
                            />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <Button
              className="w-full mt-4"
              onClick={() => setShowEditProfile(false)}
            >
              Save
            </Button>
          </div>
        </div>
      )}

      {/* Privacy & Security Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-2xl w-full max-w-sm relative">
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
                  onCheckedChange={(val) =>
                    setPrivacy({ ...privacy, privateAccount: val })
                  }
                />
              </label>
              <label className="flex items-center justify-between">
                <span>Two-Factor Auth</span>
                <Switch
                  checked={privacy.twoFactorAuth}
                  onCheckedChange={(val) =>
                    setPrivacy({ ...privacy, twoFactorAuth: val })
                  }
                />
              </label>
              <label className="flex items-center justify-between">
                <span>Email Notifications</span>
                <Switch
                  checked={privacy.emailNotifications}
                  onCheckedChange={(val) =>
                    setPrivacy({ ...privacy, emailNotifications: val })
                  }
                />
              </label>
            </div>

            <Button
              className="w-full mt-4"
              onClick={() => setShowPrivacy(false)}
            >
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
