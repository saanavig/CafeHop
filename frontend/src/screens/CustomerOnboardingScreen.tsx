import * as Location from "expo-location";

import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { moderateScale, scale, verticalScale } from "../utils/responsive";

import Button from "../components/ui/Button";
import { Coffee } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
      { label: "Pet Friendly", icon: "🐕" },
      { label: "No preference", icon: "➖" },
    ],
  },
  {
    title: "Work-Friendly",
    items: [
      { label: "WiFi", icon: "📶" },
      { label: "Power outlets", icon: "🔌" },
      { label: "Study-friendly", icon: "💻" },
      { label: "Good for meetings", icon: "💼" },
      { label: "No preference", icon: "➖" },
    ],
  },
  {
    title: "Food & Drinks",
    items: [
      { label: "Great pastries", icon: "🥐" },
      { label: "Vegan options", icon: "🌿" },
      { label: "Specialty drinks", icon: "☕" },
      { label: "No preference", icon: "➖" },
    ],
  },
  {
    title: "Vibe",
    items: [
      { label: "Instagrammable", icon: "📷" },
      { label: "Late-night", icon: "🌙" },
      { label: "Early morning", icon: "🌅" },
      { label: "No preference", icon: "➖" },
    ],
  },
  {
    title: "Budget",
    items: [
      { label: "$ (Budget-friendly)", icon: "💲" },
      { label: "$$ (Moderate)", icon: "👛" },
      { label: "$$$ (Premium)", icon: "💳" },
      { label: "No preference", icon: "➖" },
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
  const [distance, setDistance] = useState(5);
  const [step, setStep] = useState(0);
  const totalSteps = preferenceCategories.length + 1;
  const [error, setError] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nameErrors, setNameErrors] = useState({ firstName: false, lastName: false });

  // must pick a preference
  const togglePref = (pref: string) => {
    setSelectedPrefs((prev) => {
      if (pref === "No preference") {
        return ["No preference"];
      }

      // Otherwise remove "No preference" if present
      let updated = prev.filter((p) => p !== "No preference");

      if (updated.includes(pref)) {
        return updated.filter((p) => p !== pref);
      } else {
        return [...updated, pref];
      }
    });
  };

  const currentCategory = step >= 1 ? preferenceCategories[step - 1] : null;
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
        ["Quiet", "Cozy", "Lively", "Outdoor seating", "Pet Friendly"].includes(p)
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

      // max_distance_miles: distance,
    };
  };

  const maxWidth = 420;

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={[styles.innerContainer, { maxWidth }]}>
          {/* Header */}
          <Coffee size={scale(32)} color="#D4A373" style={{ alignSelf: "center", marginBottom: verticalScale(8) }} />
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
          <Pressable
            onPress={step === 0 ? () => navigation.navigate("Onboarding") : () => setStep((prev) => prev - 1)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.backPressable}
          >
            <Text style={styles.backText}>← Back</Text>
          </Pressable>

          {/* Step 0 — Name */}
          {step === 0 && (
            <View style={styles.prefSection}>
              <Text style={styles.prefTitle}>What's your name?</Text>
              <TextInput
                placeholder="First Name"
                value={firstName}
                onChangeText={(text) => {
                  setFirstName(text);
                  if (nameErrors.firstName) setNameErrors((prev) => ({ ...prev, firstName: false }));
                }}
                style={[styles.input, nameErrors.firstName && { borderColor: "#D9534F" }]}
              />
              <TextInput
                placeholder="Last Name"
                value={lastName}
                onChangeText={(text) => {
                  setLastName(text);
                  if (nameErrors.lastName) setNameErrors((prev) => ({ ...prev, lastName: false }));
                }}
                style={[styles.input, nameErrors.lastName && { borderColor: "#D9534F" }]}
              />
              {(nameErrors.firstName || nameErrors.lastName) && (
                <Text style={styles.errorText}>Please fill out both fields</Text>
              )}
            </View>
          )}

          {/* Preference Steps (1..N) */}
          {currentCategory && (
            <View key={currentCategory.title} style={styles.prefSection}>
              {error !== "" && (
                <Text style={styles.errorText}>{error}</Text>
              )}
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

          {/* Continue / Finish Button */}
          <View style={styles.finishButton}>
            <Button
            title={step === totalSteps - 1 ? "Finish Setup" : "Continue"}
            onPress={async () => {
            if (step === 0) {
              const fnEmpty = !firstName.trim();
              const lnEmpty = !lastName.trim();
              if (fnEmpty || lnEmpty) {
                setNameErrors({ firstName: fnEmpty, lastName: lnEmpty });
                return;
              }

              const { error: authError } = await supabase.auth.updateUser({
                data: { first_name: firstName.trim(), last_name: lastName.trim() },
              });
              if (authError) {
                console.error("Auth update error:", authError);
                return;
              }

              const { data: { user }, error: userError } = await supabase.auth.getUser();
              if (userError || !user) {
                console.error("User fetch error:", userError);
                return;
              }

              const { error: profileError } = await supabase.from("profiles").upsert({
                id: user.id,
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                full_name: `${firstName.trim()} ${lastName.trim()}`,
              });
              if (profileError) {
                console.error("Profile save error:", profileError);
                return;
              }

              setStep((prev) => prev + 1);
              return;
            }

            if (step < totalSteps - 1) {
              const hasSelection = selectedPrefs.length > 0;

              if (!hasSelection) {
                setError("Please select at least one option or choose 'No preference'");
                return;
              }

              setError("");
              setStep((prev) => prev + 1);
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
            disabled={false}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F3F0" },
  scrollContent: { paddingHorizontal: scale(24), paddingTop: scale(16), paddingBottom: scale(40), alignItems: "center", width: "100%" },
  innerContainer: { width: "100%" },
  title: {
    fontSize: moderateScale(22), fontWeight: "bold",
    fontFamily: "PlayfairDisplay_700Bold", marginBottom: verticalScale(4), textAlign: "center",
  },
  subtitle: { fontSize: moderateScale(14), color: "#555", marginBottom: verticalScale(16), textAlign: "center" },
  progressBackground: {
    width: "100%", height: verticalScale(6), backgroundColor: "#DDD",
    borderRadius: scale(3), marginBottom: verticalScale(16),
  },
  progressForeground: { height: verticalScale(6), backgroundColor: "#D4A373", borderRadius: scale(3) },
  backPressable: { alignSelf: "flex-start", paddingVertical: scale(4), paddingRight: scale(8) },
  backText: { color: "#555", marginBottom: verticalScale(8), fontSize: moderateScale(14) },
  prefSection: { width: "100%", marginBottom: verticalScale(24) },
  prefTitle: {
    fontSize: moderateScale(20), fontWeight: "bold", textAlign: "center",
    marginBottom: verticalScale(12), color: "#2C1810",
  },
  prefGrid: { flexDirection: "row", flexWrap: "wrap", gap: scale(8), justifyContent: "center" },
  prefButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: scale(20),
    backgroundColor: "#FFF",
  },
  prefButtonActive: { borderColor: "#D4A373", backgroundColor: "#FFF0E6" },
  prefIcon: { fontSize: moderateScale(16), color: "#555" },
  prefIconActive: { color: "#D4A373" },
  prefText: { fontSize: moderateScale(13), fontWeight: "500", color: "#555" },
  prefTextActive: { color: "#D4A373" },
  input: {
    borderWidth: 1, borderColor: "#CCC", borderRadius: scale(8),
    padding: scale(12), marginBottom: verticalScale(12),
    backgroundColor: "#FFF", fontSize: moderateScale(15),
  },
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

  errorText: {
  color: "#D9534F",
  marginTop: 8,
  fontSize: 13,
  },
});