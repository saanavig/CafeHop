import { CheckCircle, Coffee } from "lucide-react-native";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import React, { useState } from "react";

import { Alert } from "react-native";
import Button from "../components/ui/Button";
import { apiFetch } from "../api/client";
import { useRole } from "../context/RoleContext";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TOTAL_STEPS = 6;

const ATTRIBUTE_OPTIONS = [
  "WiFi", "Outdoor Seating", "Pet Friendly", "Study Friendly",
  "Vegan Options", "Matcha", "Cold Brew", "Live Music",
  "Takeaway", "Accepts Cards", "Dog Friendly", "Cozy Vibes",
];

type DayHours = { open: boolean; start: string; end: string };

const defaultHours: Record<string, DayHours> = Object.fromEntries(
  DAYS.map((d) => [d, { open: true, start: "09:00", end: "21:00" }])
);

// const TOTAL_STEPS = 5;

export default function CafeOnboarding({ navigation }: any) {
  const { setRole } = useRole();
  const [step, setStep] = useState(1);
  const [cafeName, setCafeName] = useState("");
  const [address, setAddress] = useState("");
  const [contact, setContact] = useState("");
  const [hours, setHours] = useState<Record<string, DayHours>>(defaultHours);
  const [posType, setPosType] = useState<"manual" | "square" | null>(null);
  const [linkedPOS, setLinkedPOS] = useState<"Square" | null>(null);
  const [posEmail, setPosEmail] = useState("");
  const [posPassword, setPosPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  const next = () => setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  const back = () => setStep((prev) => Math.max(prev - 1, 1));

  const updateHours = (day: string, field: keyof DayHours, value: boolean | string) => {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const maxWidth = 480;

  const handleFinishSetup = async () => {
    try {
      const payload = {
        name: cafeName,
        address,
        contact,
        hours,
        pos_type: posType,
      };

      console.log("Sending cafe:", payload);

      const res = await apiFetch("/cafe/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // if (!res.ok) {
      //   const text = await res.text();
      //   console.error("Backend error:", text);
      //   Alert.alert("Error", "Failed to create cafe");
      //   return;
      // }

      const data = await res.json();

      if (!res.ok) {
        console.error("Backend error:", data);
        Alert.alert("Error", data.error || "Failed to create cafe");
        return;
      }

      console.log("Cafe created:", data);
      setRole("cafe");
      navigation.navigate("Home");

    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong");
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.innerContainer, { maxWidth }]}>
          {/* Header */}
          <Coffee size={32} color="#D4A373" style={{ alignSelf: "center", marginBottom: 8 }} />
          <Text style={styles.title}>Set Up Your Cafe</Text>
          <Text style={styles.subtitle}>Step {step} of {TOTAL_STEPS}</Text>

          {/* Progress Bar */}
          <View style={styles.progressBackground}>
            <View style={[styles.progressForeground, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
          </View>

          {/* Back */}
          <Pressable onPress={step === 1 ? () => navigation.goBack() : back}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>

          {/* STEP 1 — Cafe Info */}
          {step === 1 && (
            <View style={styles.stepSection}>
              <Text style={styles.stepTitle}>Cafe Information</Text>
              <Text style={styles.stepDesc}>Tell us about your cafe</Text>
              <TextInput
                placeholder="Cafe name"
                style={styles.input}
                value={cafeName}
                onChangeText={setCafeName}
              />
              <TextInput
                placeholder="Address"
                style={styles.input}
                value={address}
                onChangeText={setAddress}
              />
              <TextInput
                placeholder="Contact email or phone"
                style={styles.input}
                value={contact}
                onChangeText={setContact}
                keyboardType="email-address"
              />
              <Button
                title="Continue"
                variant="caramel"
                onPress={next}
                disabled={!cafeName.trim() || !address.trim() || !contact.trim()}
              />
            </View>
          )}

          {/* STEP 2 — Operating Hours */}
          {step === 2 && (
            <View style={styles.stepSection}>
              <Text style={styles.stepTitle}>Operating Hours</Text>
              <Text style={styles.stepDesc}>Set your opening and closing times for each day</Text>
              {DAYS.map((day) => (
                <View key={day} style={styles.dayRow}>
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayName}>{day}</Text>
                    <Pressable
                      style={[styles.togglePill, hours[day].open && styles.togglePillActive]}
                      onPress={() => updateHours(day, "open", !hours[day].open)}
                    >
                      <Text style={[styles.togglePillText, hours[day].open && styles.togglePillTextActive]}>
                        {hours[day].open ? "Open" : "Closed"}
                      </Text>
                    </Pressable>
                  </View>
                  {hours[day].open && (
                    <View style={styles.timeRow}>
                      <View style={styles.timeField}>
                        <Text style={styles.timeLabel}>Opens</Text>
                        <TextInput
                          style={styles.timeInput}
                          value={hours[day].start}
                          onChangeText={(v) => updateHours(day, "start", v)}
                          placeholder="09:00"
                        />
                      </View>
                      <Text style={styles.timeSep}>—</Text>
                      <View style={styles.timeField}>
                        <Text style={styles.timeLabel}>Closes</Text>
                        <TextInput
                          style={styles.timeInput}
                          value={hours[day].end}
                          onChangeText={(v) => updateHours(day, "end", v)}
                          placeholder="21:00"
                        />
                      </View>
                    </View>
                  )}
                </View>
              ))}
              <Button title="Continue" variant="caramel" onPress={next} />
            </View>
          )}

          {/* STEP 3 — Loyalty Tracking */}
          {step === 3 && (
            <View style={styles.stepSection}>
              <Text style={styles.stepTitle}>Loyalty Tracking</Text>
              <Text style={styles.stepDesc}>How will you track customer visits and rewards?</Text>
              <Button
                title="Manual Entry (No POS)"
                variant={posType === "manual" ? "caramel" : "outline"}
                onPress={() => setPosType("manual")}
              />
              <Button
                title="Integrate with Square POS"
                variant={posType === "square" ? "caramel" : "outline"}
                onPress={() => setPosType("square")}
              />
              <Button title="Continue" variant="caramel" onPress={next} disabled={!posType} />
            </View>
          )}

          {/* STEP 4 — Square */}
          {step === 4 && posType === "square" && (
            <View style={styles.stepSection}>
              <Text style={styles.stepTitle}>Connect Square</Text>
              <Text style={styles.stepDesc}>Link your Square account to automatically track loyalty</Text>
              {!linkedPOS ? (
                <Button
                  title="Connect Square Account"
                  variant="outline"
                  onPress={() => setLinkedPOS("Square")}
                />
              ) : (
                <>
                  <TextInput
                    placeholder="POS Account Email"
                    style={styles.input}
                    value={posEmail}
                    onChangeText={setPosEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <TextInput
                    placeholder="POS Account Password"
                    style={styles.input}
                    secureTextEntry
                    value={posPassword}
                    onChangeText={setPosPassword}
                  />
                  <TextInput
                    placeholder="Business verification code"
                    style={styles.input}
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                  />
                </>
              )}
              <Button
                title="Continue"
                variant="caramel"
                onPress={next}
                disabled={
                  !linkedPOS ||
                  !posEmail.trim() ||
                  !posPassword.trim() ||
                  !verificationCode.trim()
                }
              />
            </View>
          )}

          {/* STEP 4 — Manual */}
          {step === 4 && posType === "manual" && (
            <View style={styles.stepSection}>
              <Text style={styles.stepTitle}>Manual Setup</Text>
              <Text style={styles.stepDesc}>
                Staff can add visits or points manually through the app. No extra setup needed!
              </Text>
              <Button title="Continue" variant="caramel" onPress={next} />
            </View>
          )}

          {/* STEP 5 — Confirmation */}
          {step === 5 && (
            <View style={styles.stepSection}>
              <CheckCircle size={48} color="#D4A373" style={{ alignSelf: "center", marginBottom: 16 }} />
              <Text style={styles.stepTitle}>You're All Set!</Text>
              <Text style={styles.stepDesc}>
                Your cafe is registered. Once approved, you can start managing loyalty rewards on CafeHop.
              </Text>
              <Button
                title="Finish Setup"
                variant="caramel"
                onPress={handleFinishSetup} 
              />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F3F0" },
  scrollContent: { padding: 24, alignItems: "center" },
  innerContainer: { width: "100%" },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    fontFamily: "PlayfairDisplay_700Bold",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: { fontSize: 14, color: "#555", marginBottom: 16, textAlign: "center" },
  progressBackground: {
    width: "100%",
    height: 6,
    backgroundColor: "#DDD",
    borderRadius: 3,
    marginBottom: 16,
  },
  progressForeground: { height: 6, backgroundColor: "#D4A373", borderRadius: 3 },
  backText: { color: "#555", marginBottom: 8, alignSelf: "flex-start" },
  stepSection: { width: "100%", marginBottom: 24 },
  stepTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 6,
    color: "#2C1810",
  },
  stepDesc: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#FFF",
    fontSize: 15,
  },
  // Hours
  dayRow: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    padding: 12,
    marginBottom: 10,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayName: { fontSize: 15, fontWeight: "600", color: "#2C1810" },
  togglePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#CCC",
    backgroundColor: "#F5F5F5",
  },
  togglePillActive: { borderColor: "#D4A373", backgroundColor: "#FFF0E6" },
  togglePillText: { fontSize: 13, color: "#888" },
  togglePillTextActive: { color: "#D4A373", fontWeight: "600" },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
  },
  timeField: { flex: 1 },
  timeLabel: { fontSize: 11, color: "#999", marginBottom: 4 },
  timeInput: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 8,
    backgroundColor: "#FAFAFA",
    fontSize: 14,
    textAlign: "center",
  },
  timeSep: { fontSize: 18, color: "#CCC", marginTop: 16 },
});
