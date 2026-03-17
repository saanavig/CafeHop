import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Button from "../components/ui/Button";
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
      { label: "Student discounts", icon: "🎓" },
      { label: "Accepts cash", icon: "💵" },
    ],
  },
];

export default function CustomerOnboardingScreen() {
  const navigation = useNavigation<any>();
  const { setRole } = useRole();
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([]);
  const [locationAllowed, setLocationAllowed] = useState(false);
  const [step, setStep] = useState(0);

  const totalSteps = preferenceCategories.length + 1; // +1 for location
  const togglePref = (pref: string) => {
    setSelectedPrefs((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const currentCategory = preferenceCategories[step];

  // Max width for centered content (same as signup/login)
  const maxWidth = 480;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.innerContainer, { maxWidth }]}>
          {/* Header */}
          <Text style={styles.title}>Customize your café experience</Text>
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
                Find cafés near you and see what’s open.
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
            onPress={() => {
                if (step < preferenceCategories.length) {
                setStep((prev) => prev + 1); // can continue even if no prefs selected
                } else {
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
  scrollContent: { padding: 24, alignItems: "center" },
  innerContainer: { width: "100%" }, // center & maxWidth handled inline
  title: { fontSize: 22, fontWeight: "bold", fontFamily: "PlayfairDisplay_700Bold", marginBottom: 4, textAlign: "center" },
  subtitle: { fontSize: 14, color: "#555", marginBottom: 16, textAlign: "center" },
  progressBackground: { width: "100%", height: 6, backgroundColor: "#DDD", borderRadius: 3, marginBottom: 16 },
  progressForeground: { height: 6, backgroundColor: "#D4A373", borderRadius: 3 },
  backText: { color: "#555", marginBottom: 8, alignSelf: "flex-start" },
  prefSection: { marginBottom: 24 },
  prefTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  prefGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  prefButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 16,
    width: "48%",
    marginBottom: 12,
    backgroundColor: "#FFF",
  },
  prefButtonActive: { borderColor: "#D4A373", backgroundColor: "#FFF0E6" },
  prefIcon: { fontSize: 18, color: "#555" },
  prefIconActive: { color: "#D4A373" },
  prefText: { fontSize: 14, fontWeight: "500", color: "#555" },
  prefTextActive: { color: "#D4A373" },
  locationCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#CCC",
    padding: 16,
    marginBottom: 24,
  },
  locationHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 },
  locationIcon: { fontSize: 18, color: "#D4A373" },
  locationTitle: { fontWeight: "500", fontSize: 16 },
  locationDesc: { fontSize: 12, color: "#555", marginBottom: 12 },
  finishButton: { marginBottom: 24 },
});