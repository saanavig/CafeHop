import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
} from "react-native";
import { Coffee, CheckCircle } from "lucide-react-native";
import Button from "../components/ui/Button";
import { useRole } from "../context/RoleContext";
import { scale, moderateScale } from "../utils/responsive";

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

export default function CafeOnboarding({ navigation }: any) {
  const { setRole } = useRole();
  const [step, setStep] = useState(1);

  // Step 1 — Basic Info
  const [cafeName, setCafeName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");

  // Step 2 — Contact & Social
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");

  // Step 3 — Attributes
  const [attributes, setAttributes] = useState<string[]>([]);

  // Step 4 — Hours
  const [hours, setHours] = useState<Record<string, DayHours>>(defaultHours);

  // Step 5 — Loyalty
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

  const toggleAttribute = (attr: string) => {
    setAttributes((prev) =>
      prev.includes(attr) ? prev.filter((a) => a !== attr) : [...prev, attr]
    );
  };

  const maxWidth = 480;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.innerContainer, { maxWidth }]}>
          {/* Header */}
          <Coffee size={32} color="#D4A373" style={{ alignSelf: "center", marginBottom: 8 }} />
          <Text style={styles.title}>Set Up Your Café</Text>
          <Text style={styles.subtitle}>Step {step} of {TOTAL_STEPS}</Text>

          {/* Progress Bar */}
          <View style={styles.progressBackground}>
            <View style={[styles.progressForeground, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
          </View>

          {/* Back */}
          <Pressable onPress={step === 1 ? () => navigation.goBack() : back}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>

          {/* STEP 1 — Basic Info */}
          {step === 1 && (
            <View style={styles.stepSection}>
              <Text style={styles.stepTitle}>Café Information</Text>
              <Text style={styles.stepDesc}>Tell us the basics about your café</Text>
              <TextInput
                placeholder="Café name *"
                style={styles.input}
                value={cafeName}
                onChangeText={setCafeName}
              />
              <TextInput
                placeholder="Address *"
                style={styles.input}
                value={address}
                onChangeText={setAddress}
              />
              <TextInput
                placeholder="Description (what makes your café special?)"
                style={[styles.input, styles.multilineInput]}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />
              <Button
                title="Continue"
                variant="caramel"
                onPress={next}
                disabled={!cafeName.trim() || !address.trim()}
              />
            </View>
          )}

          {/* STEP 2 — Contact & Social */}
          {step === 2 && (
            <View style={styles.stepSection}>
              <Text style={styles.stepTitle}>Contact & Social</Text>
              <Text style={styles.stepDesc}>How can customers reach you?</Text>
              <TextInput
                placeholder="Contact email *"
                style={styles.input}
                value={contactEmail}
                onChangeText={setContactEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                placeholder="Contact phone"
                style={styles.input}
                value={contactPhone}
                onChangeText={setContactPhone}
                keyboardType="phone-pad"
              />
              <TextInput
                placeholder="Website URL (optional)"
                style={styles.input}
                value={websiteUrl}
                onChangeText={setWebsiteUrl}
                autoCapitalize="none"
                keyboardType="url"
              />
              <TextInput
                placeholder="Instagram handle (e.g. @mycafe)"
                style={styles.input}
                value={instagramUrl}
                onChangeText={setInstagramUrl}
                autoCapitalize="none"
              />
              <Button
                title="Continue"
                variant="caramel"
                onPress={next}
                disabled={!contactEmail.trim()}
              />
            </View>
          )}

          {/* STEP 3 — Amenities */}
          {step === 3 && (
            <View style={styles.stepSection}>
              <Text style={styles.stepTitle}>Café Amenities</Text>
              <Text style={styles.stepDesc}>Select everything that applies to your café</Text>
              <View style={styles.chipsContainer}>
                {ATTRIBUTE_OPTIONS.map((attr) => {
                  const selected = attributes.includes(attr);
                  return (
                    <Pressable
                      key={attr}
                      style={[styles.chip, selected && styles.chipSelected]}
                      onPress={() => toggleAttribute(attr)}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                        {attr}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Button title="Continue" variant="caramel" onPress={next} />
            </View>
          )}

          {/* STEP 4 — Operating Hours */}
          {step === 4 && (
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

          {/* STEP 5 — Loyalty Tracking */}
          {step === 5 && (
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
              {posType === "square" && !linkedPOS && (
                <Button
                  title="Connect Square Account"
                  variant="outline"
                  onPress={() => setLinkedPOS("Square")}
                />
              )}
              {posType === "square" && linkedPOS && (
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
                  !posType ||
                  (posType === "square" &&
                    (!linkedPOS || !posEmail.trim() || !posPassword.trim() || !verificationCode.trim()))
                }
              />
            </View>
          )}

          {/* STEP 6 — Confirmation */}
          {step === 6 && (
            <View style={styles.stepSection}>
              <CheckCircle size={48} color="#D4A373" style={{ alignSelf: "center", marginBottom: 16 }} />
              <Text style={styles.stepTitle}>You're All Set!</Text>
              <Text style={styles.stepDesc}>
                Your café is registered. Once approved, you can start managing loyalty rewards on CafeHop.
              </Text>
              <Button
                title="Finish Setup"
                variant="caramel"
                onPress={() => { setRole("cafe"); navigation.navigate("Home"); }}
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
  scrollContent: { padding: scale(24), alignItems: "center" },
  innerContainer: { width: "100%" },
  title: {
    fontSize: moderateScale(22),
    fontWeight: "bold",
    fontFamily: "PlayfairDisplay_700Bold",
    marginBottom: scale(4),
    textAlign: "center",
  },
  subtitle: { fontSize: moderateScale(14), color: "#555", marginBottom: scale(16), textAlign: "center" },
  progressBackground: {
    width: "100%",
    height: scale(6),
    backgroundColor: "#DDD",
    borderRadius: scale(3),
    marginBottom: scale(16),
  },
  progressForeground: { height: scale(6), backgroundColor: "#D4A373", borderRadius: scale(3) },
  backText: { color: "#555", marginBottom: scale(8), alignSelf: "flex-start" },
  stepSection: { width: "100%", marginBottom: scale(24) },
  stepTitle: {
    fontSize: moderateScale(20),
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: scale(6),
    color: "#2C1810",
  },
  stepDesc: { fontSize: moderateScale(14), color: "#666", textAlign: "center", marginBottom: scale(20) },
  input: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: scale(8),
    padding: scale(12),
    marginBottom: scale(12),
    backgroundColor: "#FFF",
    fontSize: moderateScale(15),
  },
  multilineInput: {
    height: scale(96),
    textAlignVertical: "top",
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(8),
    marginBottom: scale(20),
  },
  chip: {
    paddingHorizontal: scale(14),
    paddingVertical: scale(8),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: "#CCC",
    backgroundColor: "#FFF",
  },
  chipSelected: { borderColor: "#D4A373", backgroundColor: "#FFF0E6" },
  chipText: { fontSize: moderateScale(13), color: "#666" },
  chipTextSelected: { color: "#D4A373", fontWeight: "600" },
  // Hours
  dayRow: {
    backgroundColor: "#FFF",
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#E0E0E0",
    padding: scale(12),
    marginBottom: scale(10),
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayName: { fontSize: moderateScale(15), fontWeight: "600", color: "#2C1810" },
  togglePill: {
    paddingHorizontal: scale(14),
    paddingVertical: scale(6),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: "#CCC",
    backgroundColor: "#F5F5F5",
  },
  togglePillActive: { borderColor: "#D4A373", backgroundColor: "#FFF0E6" },
  togglePillText: { fontSize: moderateScale(13), color: "#888" },
  togglePillTextActive: { color: "#D4A373", fontWeight: "600" },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: scale(10),
    gap: scale(8),
  },
  timeField: { flex: 1 },
  timeLabel: { fontSize: moderateScale(11), color: "#999", marginBottom: scale(4) },
  timeInput: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: scale(8),
    padding: scale(8),
    backgroundColor: "#FAFAFA",
    fontSize: moderateScale(14),
    textAlign: "center",
  },
  timeSep: { fontSize: moderateScale(18), color: "#CCC", marginTop: scale(16) },
});
