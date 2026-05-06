import { ArrowLeft, Bell, Lock, Moon } from "lucide-react-native";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import React, { useCallback, useState } from "react";
import { moderateScale, scale } from "../utils/responsive";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";

import BottomNav from "../components/ui/BottomNav";
import { supabase } from "../api/supabaseClient";
import { useEffect } from "react";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:3001";

const preferenceCategories = [
  {
    key: "atmosphere",
    title: "Atmosphere",
    items: ["Quiet", "Cozy", "Lively", "Outdoor seating", "Pet Friendly"],
  },
  {
    key: "work_preferences",
    title: "Work-Friendly",
    items: ["WiFi", "Power outlets", "Study-friendly", "Good for meetings"],
  },
  {
    key: "food_preferences",
    title: "Food & Drinks",
    items: ["Great pastries", "Vegan options", "Specialty drinks"],
  },
  {
    key: "vibe",
    title: "Vibe",
    items: ["Instagrammable", "Late-night", "Early morning"],
  },
] as const;

const priceOptions = [
  { label: "$ - Budget-friendly", value: 1 },
  { label: "$$ - Moderate", value: 2 },
  { label: "$$$ - Premium", value: 3 },
];

type PreferenceKey =
  | "atmosphere"
  | "work_preferences"
  | "food_preferences"
  | "vibe";

type PreferencesState = {
  atmosphere: string[];
  work_preferences: string[];
  food_preferences: string[];
  vibe: string[];
};

const PreferencesScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  // const role = route.params?.role;

  const { width } = Dimensions.get("window");
  const contentWidth = Math.min(width * 0.9, 480);

  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const [maxDistance, setMaxDistance] = useState<number>(5);
  const [preferredPriceLevel, setPreferredPriceLevel] = useState<number | null>(null);
  const [role, setRole] = useState<string | null>(null);

  const [prefs, setPrefs] = useState<PreferencesState>({
    atmosphere: [],
    work_preferences: [],
    food_preferences: [],
    vibe: [],
  });

  const loadUserRole = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`${API_URL}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      console.log(" /api/users/me response:", data);
      console.log("role from API (raw):", data.role);

      if (!res.ok) {
        console.error("Load role error:", data);
        return;
      }

      setRole(data.role);
    } catch (err) {
      console.error("Load role crash:", err);
    }
  };

  useEffect(() => {
    if (role === "user") {
      console.log("role state updated:", role);
      loadPrefs();
    }
  }, [role]);

  useFocusEffect(
    useCallback(() => {
      loadUserRole();
      // loadPrefs();
    }, [])
  );

  const getToken = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token ?? null;
  };

  const loadPrefs = async () => {

    if (role !== "user") return;

    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`${API_URL}/api/users/preferences`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      console.log("ROLE FROM BACKEND:", data.role);

      if (!res.ok) {
        console.error("Load preferences error:", data);
        return;
      }

      const saved = data.preferences;
      if (!saved) return;

      const workPrefs = saved.work_preferences ?? [];

      const finalWorkPrefs =
        saved.wants_wifi && !workPrefs.includes("WiFi")
          ? [...workPrefs, "WiFi"]
          : workPrefs;

      setMaxDistance(Number(saved.max_distance_miles ?? 5));
      setPreferredPriceLevel(saved.preferred_price_level ?? null);

      setPrefs({
        atmosphere: saved.atmosphere ?? [],
        work_preferences: finalWorkPrefs,
        food_preferences: saved.food_preferences ?? [],
        vibe: saved.vibe ?? [],
      });
    } catch (err) {
      console.error("Load preferences crash:", err);
    }
  };

  const savePrefs = async (
    nextPrefs: PreferencesState,
    nextPrice = preferredPriceLevel,
    nextDistance = maxDistance
  ) => {

    if (role !== "user") return;

    try {
      const token = await getToken();
      if (!token) return;

      const payload = {
        max_distance_miles: nextDistance,
        wants_wifi: nextPrefs.work_preferences.includes("WiFi"),
        preferred_price_level: nextPrice,
        atmosphere: nextPrefs.atmosphere,
        vibe: nextPrefs.vibe,
        food_preferences: nextPrefs.food_preferences,
        work_preferences: nextPrefs.work_preferences,
      };

      const res = await fetch(`${API_URL}/api/users/preferences`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Save preferences error:", data);
      }
    } catch (err) {
      console.error("Save preferences crash:", err);
    }
  };

  const togglePref = (category: PreferenceKey, item: string) => {
    const current = prefs[category];

    const updatedCategory = current.includes(item)
      ? current.filter((p) => p !== item)
      : [...current, item];

    const nextPrefs = {
      ...prefs,
      [category]: updatedCategory,
    };

    setPrefs(nextPrefs);
    savePrefs(nextPrefs);
  };

  const selectPriceLevel = (level: number) => {
    const nextPrice = preferredPriceLevel === level ? null : level;
    setPreferredPriceLevel(nextPrice);
    savePrefs(prefs, nextPrice, maxDistance);
  };

  const selectDistance = (distance: number) => {
    setMaxDistance(distance);
    savePrefs(prefs, preferredPriceLevel, distance);
  };

  const isSelected = (category: PreferenceKey, item: string) => {
    return prefs[category].includes(item);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { alignItems: "flex-start" }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color="#333" />
          </Pressable>
          <Text style={styles.headerTitle}>Preferences</Text>
        </View>

        <View style={[styles.content, { width: contentWidth }]}>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>General</Text>

            <View style={styles.settingsContainer}>
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <View style={styles.iconBg}>
                    <Bell size={18} color="#D4A373" />
                  </View>
                  <View>
                    <Text style={styles.settingTitle}>Notifications</Text>
                    <Text style={styles.settingDesc}>Rewards, visits, and updates</Text>
                  </View>
                </View>

                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: "#E8DFD5", true: "#D4A373" }}
                />
              </View>

              <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
                <View style={styles.settingLeft}>
                  <View style={styles.iconBg}>
                    <Moon size={18} color="#D4A373" />
                  </View>
                  <View>
                    <Text style={styles.settingTitle}>Dark Mode</Text>
                    <Text style={styles.settingDesc}>System appearance</Text>
                  </View>
                </View>

                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: "#E8DFD5", true: "#D4A373" }}
                />
              </View>
            </View>
          </View>

          {role === "user" ? (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Cafe Preferences</Text>

                {preferenceCategories.map((category) => (
                  <View key={category.key} style={styles.preferenceGroup}>
                    <Text style={styles.preferenceTitle}>{category.title}</Text>

                    <View style={styles.chipWrap}>
                      {category.items.map((item) => {
                        const selected = isSelected(category.key, item);

                        return (
                          <Pressable
                            key={item}
                            onPress={() => togglePref(category.key, item)}
                            style={[styles.chip, selected && styles.chipSelected]}
                          >
                            <Text
                              style={[
                                styles.chipText,
                                selected && styles.chipTextSelected,
                              ]}
                            >
                              {item}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Budget</Text>

                <View style={styles.chipWrap}>
                  {priceOptions.map((option) => {
                    const selected = preferredPriceLevel === option.value;

                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => selectPriceLevel(option.value)}
                        style={[styles.chip, selected && styles.chipSelected]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            selected && styles.chipTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Max Distance</Text>

                <View style={styles.chipWrap}>
                  {[1, 2, 3, 5, 10].map((distance) => {
                    const selected = maxDistance === distance;

                    return (
                      <Pressable
                        key={distance}
                        onPress={() => selectDistance(distance)}
                        style={[styles.chip, selected && styles.chipSelected]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            selected && styles.chipTextSelected,
                          ]}
                        >
                          {distance} mi
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Privacy & Security</Text>

            <View style={styles.settingsContainer}>
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <View style={styles.iconBg}>
                    <Lock size={18} color="#D4A373" />
                  </View>
                  <View>
                    <Text style={styles.settingTitle}>Private Account</Text>
                    <Text style={styles.settingDesc}>Control profile visibility</Text>
                  </View>
                </View>

                <Switch
                  value={privateAccount}
                  onValueChange={setPrivateAccount}
                  trackColor={{ false: "#E8DFD5", true: "#D4A373" }}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <View style={styles.iconBg}>
                    <Lock size={18} color="#D4A373" />
                  </View>
                  <View>
                    <Text style={styles.settingTitle}>Two-Factor Authentication</Text>
                    <Text style={styles.settingDesc}>Enhanced security</Text>
                  </View>
                </View>

                <Switch
                  value={twoFactorAuth}
                  onValueChange={setTwoFactorAuth}
                  trackColor={{ false: "#E8DFD5", true: "#D4A373" }}
                />
              </View>

              <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
                <View style={styles.settingLeft}>
                  <View style={styles.iconBg}>
                    <Bell size={18} color="#D4A373" />
                  </View>
                  <View>
                    <Text style={styles.settingTitle}>Email Notifications</Text>
                    <Text style={styles.settingDesc}>Stay updated via email</Text>
                  </View>
                </View>

                <Switch
                  value={emailNotifications}
                  onValueChange={setEmailNotifications}
                  trackColor={{ false: "#E8DFD5", true: "#D4A373" }}
                />
              </View>
            </View>
          </View>

          <Text style={styles.footer}>CafeHop v1.0.0</Text>
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F3F0" },
  scrollContent: {
    paddingTop: scale(16),
    paddingBottom: scale(100),
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(16),
    marginBottom: scale(24),
  },
  backButton: { padding: scale(8), marginRight: scale(12) },
  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: "600",
    fontFamily: "PlayfairDisplay_700Bold",
    marginLeft: scale(8),
    color: "#1A1A1A",
  },
  content: { alignSelf: "center", paddingHorizontal: scale(16) },
  section: { marginBottom: scale(24) },
  sectionLabel: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
    marginBottom: scale(12),
    letterSpacing: 0.5,
  },
  settingsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: "#E8DFD5",
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingVertical: scale(14),
    borderBottomWidth: 1,
    borderBottomColor: "#E8DFD5",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
    flex: 1,
  },
  iconBg: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(10),
    backgroundColor: "#F7F3F0",
    justifyContent: "center",
    alignItems: "center",
  },
  settingTitle: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: scale(2),
  },
  settingDesc: {
    fontSize: moderateScale(12),
    color: "#888",
  },
  preferenceGroup: {
    backgroundColor: "#FFF",
    borderRadius: scale(16),
    padding: scale(14),
    borderWidth: 1,
    borderColor: "#E8DFD5",
    marginBottom: scale(12),
  },
  preferenceTitle: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: scale(10),
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(10),
  },
  chip: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E8DFD5",
    paddingHorizontal: scale(14),
    paddingVertical: scale(9),
    borderRadius: scale(20),
  },
  chipSelected: {
    backgroundColor: "#D4A373",
    borderColor: "#D4A373",
  },
  chipText: {
    color: "#444",
    fontSize: moderateScale(13),
    fontWeight: "600",
  },
  chipTextSelected: {
    color: "#FFF",
  },
  footer: {
    textAlign: "center",
    fontSize: moderateScale(12),
    color: "#888",
    marginTop: scale(24),
  },
});

export default PreferencesScreen;