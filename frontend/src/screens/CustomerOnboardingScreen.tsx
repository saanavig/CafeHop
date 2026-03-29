import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import React, { useState } from "react";
import { moderateScale, scale } from "../utils/responsive";

import Button from "../components/ui/Button";
import { supabase } from "../api/supabaseClient";
import { useNavigation } from "@react-navigation/native";
import { useRole } from "../context/RoleContext";

const preferenceCategories = [
  {
    title: "Atmosphere",
    items: [
      { label: "Quiet", icon: "🌙" },
      { label: "Cozy", icon: "☕" },
      { label: "Lively", icon: "👥" },
      { label: "Outdoor seating", icon: "☀️" },
    ],
  },
  {
    title: "Work-Friendly",
    items: [
      { label: "WiFi", icon: "📶" },
      { label: "Power outlets", icon: "🔌" },
      { label: "Study-friendly", icon: "💻" },
      { label: "Good for meetings", icon: "💼" },
    ],
  },
  {
    title: "Food & Drinks",
    items: [
      { label: "Great pastries", icon: "🥐" },
      { label: "Vegan options", icon: "🌿" },
      { label: "Specialty drinks", icon: "☕" },
    ],
  },
  {
    title: "Vibe",
    items: [
      { label: "Instagrammable", icon: "📷" },
      { label: "Late-night", icon: "🌙" },
      { label: "Early morning", icon: "🌅" },
    ],
  },
  {
    title: "Budget",
    items: [
      { label: "$ (Budget-friendly)", icon: "💲" },
      { label: "$$ (Moderate)", icon: "👛" },
      { label: "$$$ (Premium)", icon: "💳" },
      // { label: "Student discounts", icon: "🎓" },
      // { label: "Accepts cash", icon: "💵" },
      // { label: "Deals & specials", icon: "🏷️" },
      // { label: "Affordable portions", icon: "🍽️" },
    ],
  },
];

export default function CustomerOnboardingScreen() {
  const navigation = useNavigation<any>();
  const { setRole } = useRole();
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([]);
  const [locationAllowed, setLocationAllowed] = useState(false);
  const [step, setStep] = useState(0);
  const totalSteps = preferenceCategories.length + 1;
  const togglePref = (pref: string) => {
    setSelectedPrefs((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const currentCategory = preferenceCategories[step];
  const buildPreferences = () => {
    return {
      wants_wifi: selectedPrefs.includes("WiFi"),

      preferred_price_level: selectedPrefs.includes("$$$ (Premium)")
        ? 3
        : selectedPrefs.includes("$$ (Moderate)")
        ? 2
        : selectedPrefs.includes("$ (Budget-friendly)")
        ? 1
        : null,

      // preferred_price_level: null,

      atmosphere: selectedPrefs.filter((p) =>
        ["Quiet", "Cozy", "Lively", "Outdoor seating"].includes(p)
      ),

      work_preferences: selectedPrefs.filter((p) =>
        ["Study-friendly", "Good for meetings", "Power outlets"].includes(p)
      ),

      food_preferences: selectedPrefs.filter((p) =>
        ["Vegan options", "Great pastries", "Specialty drinks"].includes(p)
      ),

      vibe: selectedPrefs.filter((p) =>
        ["Instagrammable", "Late-night", "Early morning"].includes(p)
      ),

      // budget_preferences: selectedPrefs.filter((p) =>
      //   ["Student discounts", "Accepts cash", "Deals & specials", "Affordable portions"].includes(p)
      // ),
    };
  };

  // Max width for centered content (same as signup/login)
  const maxWidth = 480;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.innerContainer, { maxWidth }]}>
          {/* Header */}
          <Text style={styles.title}>Customize your cafe experience</Text>
          <Text style={styles.subtitle}>
            Step {step + 1} of {totalSteps}
          </Text>

          {/* Progress Bar */}
          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressForeground,
                { width: `${((step + 1) / totalSteps) * 100}%` },
              ]}
            />
          </View>

          {/* Back Button */}
          <Pressable onPress={step === 0 ? () => navigation.goBack() : () => setStep((prev) => prev - 1)}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>

          {/* Preference Steps */}
          {step < preferenceCategories.length && (
            <View key={currentCategory.title} style={styles.prefSection}>
              <Text style={styles.prefTitle}>{currentCategory.title}</Text>
              <View style={styles.prefGrid}>
                {currentCategory.items.map((pref) => {
                  const active = selectedPrefs.includes(pref.label);
                  return (
                    <Pressable
                      key={pref.label}
                      style={[
                        styles.prefButton,
                        active && styles.prefButtonActive,
                      ]}
                      onPress={() => togglePref(pref.label)}
                    >
                      <Text
                        style={[styles.prefIcon, active && styles.prefIconActive]}
                      >
                        {pref.icon}
                      </Text>
                      <Text
                        style={[styles.prefText, active && styles.prefTextActive]}
                      >
                        {pref.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Location Step */}
          {step === preferenceCategories.length && (
            <View style={styles.locationCard}>
              <View style={styles.locationHeader}>
                <Text style={styles.locationIcon}>📍</Text>
                <Text style={styles.locationTitle}>Enable location</Text>
              </View>
              <Text style={styles.locationDesc}>
                Find cafes near you and see what’s open.
              </Text>
              <Button
                title={locationAllowed ? "Location enabled" : "Allow location"}
                variant={locationAllowed ? "outline" : "caramel"}
                onPress={() => setLocationAllowed(true)}
              />
            </View>
          )}

          {/* Continue / Finish Button */}
          <View style={styles.finishButton}>
            <Button
            title={step < preferenceCategories.length ? "Continue" : "Finish"}
            onPress={async () => {
                if (step < preferenceCategories.length) {
                setStep((prev) => prev + 1); // can continue even if no prefs selected
                } else {
                  const preferences = buildPreferences();

                  const {
                    data: { user },
                    error: userError,
                  } = await supabase.auth.getUser();

                  if (userError || !user) {
                    console.error("User not found:", userError);
                    return;
                  }

                  const { error } = await supabase
                    .from("user_preferences")
                    .upsert({
                      user_id: user.id,
                      ...preferences,
                    });

                  if (error) {
                    console.error("Error saving preferences:", error);
                    return;
                  }

                  setRole("customer");
                  navigation.navigate("Home");
                }
            }}
            disabled={step === preferenceCategories.length && !locationAllowed} // only disables on location step
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F3F0" },
  scrollContent: { padding: scale(24), alignItems: "center" },
  innerContainer: { width: "100%" },
  title: { fontSize: moderateScale(22), fontWeight: "bold", fontFamily: "PlayfairDisplay_700Bold", marginBottom: scale(4), textAlign: "center" },
  subtitle: { fontSize: moderateScale(14), color: "#555", marginBottom: scale(16), textAlign: "center" },
  progressBackground: { width: "100%", height: scale(6), backgroundColor: "#DDD", borderRadius: scale(3), marginBottom: scale(16) },
  progressForeground: { height: scale(6), backgroundColor: "#D4A373", borderRadius: scale(3) },
  backText: { color: "#555", marginBottom: scale(8), alignSelf: "flex-start" },
  prefSection: { marginBottom: scale(24) },
  prefTitle: { fontSize: moderateScale(16), fontWeight: "600", marginBottom: scale(12) },
  prefGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  prefButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    padding: scale(12),
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: scale(16),
    width: "48%",
    marginBottom: scale(12),
    backgroundColor: "#FFF",
  },
  prefButtonActive: { borderColor: "#D4A373", backgroundColor: "#FFF0E6" },
  prefIcon: { fontSize: moderateScale(18), color: "#555" },
  prefIconActive: { color: "#D4A373" },
  prefText: { fontSize: moderateScale(14), fontWeight: "500", color: "#555" },
  prefTextActive: { color: "#D4A373" },
  locationCard: {
    backgroundColor: "#FFF",
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: "#CCC",
    padding: scale(16),
    marginBottom: scale(24),
  },
  locationHeader: { flexDirection: "row", alignItems: "center", marginBottom: scale(8), gap: scale(8) },
  locationIcon: { fontSize: moderateScale(18), color: "#D4A373" },
  locationTitle: { fontWeight: "500", fontSize: moderateScale(16) },
  locationDesc: { fontSize: moderateScale(12), color: "#555", marginBottom: scale(12) },
  finishButton: { marginBottom: scale(24) },
});