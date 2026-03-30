import * as ImagePicker from "expo-image-picker";

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
import { Image } from "react-native";
import { apiFetch } from "../api/client";
import { supabase } from "../api/supabaseClient";
import { useRole } from "../context/RoleContext";
import * as Location from "expo-location";

const requestLocation = async () => {
    const result = await Location.requestForegroundPermissionsAsync();
    if (result.status !== "granted") {
      throw new Error("Location permission denied");
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  };

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TOTAL_STEPS = 4;

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const ATTRIBUTE_OPTIONS = [
  "Cozy", "Quiet", "Lively", "Outdoor Seating", "Pet Friendly", "WiFi", "Power Outlets",
  "Specialty Drinks", "Great Pastries", "Vegan Options", "Study-friendly", "Good for Meetings",
  "Instagrammable", "Late-night", "Early morning"
];
type DayHours = { open: boolean; start: string; end: string };

const defaultHours: Record<string, DayHours> = Object.fromEntries(
  DAYS.map((d) => [d, { open: true, start: "09:00", end: "21:00" }])
);

// const TOTAL_STEPS = 5;
// const [selectedTags, setSelectedTags] = useState<string[]>([]);

export default function CafeOnboarding({ navigation }: any) {
  const { setRole } = useRole();
  const [step, setStep] = useState(1);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [cafeName, setCafeName] = useState("");
  const [address, setAddress] = useState("");
  const [contact, setContact] = useState("");
  const [hours, setHours] = useState<Record<string, DayHours>>(defaultHours);
  const [tagError, setTagError] = useState("");
  const [image, setImage] = useState<string | null>(null);
  // const [posType, setPosType] = useState<"manual" | "square" | null>(null);
  // const [linkedPOS, setLinkedPOS] = useState<"Square" | null>(null);
  // const [posEmail, setPosEmail] = useState("");
  // const [posPassword, setPosPassword] = useState("");
  // const [verificationCode, setVerificationCode] = useState("");
  const [priceRange, setPriceRange] = useState<string | null>(null);
  const [priceError, setPriceError] = useState("");

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const updated = prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag];

      if (updated.length > 0) {
        setTagError("");
      }

      return updated;
    });
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission required", "We need access to your photos");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const next = () => setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  const back = () => setStep((prev) => Math.max(prev - 1, 1));

  const updateHours = (day: string, field: keyof DayHours, value: boolean | string) => {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const maxWidth = 480;

  const handleFinishSetup = async () => {
    let imageUrl = null;

    if (image) {
      const fileName = `cafe-${Date.now()}-${Math.random()}.jpg`;

      const response = await fetch(image);
      const blob = await response.blob();

      const { data, error } = await supabase.storage
        .from("images")
        .upload(fileName, blob, {
          contentType: "image/jpeg",
        });

      if (error) {
        console.error("Upload error:", error);
        Alert.alert("Error", "Image upload failed");
        return; 
      } else {
        const { data: publicUrlData } = supabase.storage
          .from("images")
          .getPublicUrl(fileName);

        imageUrl = publicUrlData.publicUrl;
      }
    }

    try {
      const { latitude, longitude } = await requestLocation();

      const payload = {
        name: cafeName,
        address,
        contact,
        latitude,
        longitude,
        hours,
        price_range: priceRange,
        image_url: imageUrl,
        // pos_type: posType,
      };

      console.log("Sending cafe:", payload);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        Alert.alert("Error", "You are not logged in");
        return;
      }

      const res = await fetch(`${API_URL}/api/cafe/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      console.log("RAW RESPONSE:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: text };
      }

      if (!res.ok) {
        console.error("Backend error:", data);
        Alert.alert("Error", data.error || "Failed to create cafe");
        return;
      }

      console.log("Cafe created:", data);

      await supabase.auth.updateUser({
        data: {
          display_name: cafeName,
        },
      });

      setRole("cafe");
      navigation.navigate("Home");
    } catch (err) {
      console.error("CRASH:", err);
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
              <Pressable onPress={pickImage} style={styles.imageUploadBox}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.imagePreview} />
                ) : (
                  <Text style={styles.imageUploadText}>Upload Cafe Photo</Text>
                )}
              </Pressable>
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

          {/* STEP 3 — Loyalty Tracking
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
          )} */}

          {/* STEP 4 — Square */}
          {/* {step === 4 && posType === "square" && (
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
          )} */}

          {/* STEP 5 — Confirmation */}
          {/* {step === 5 && (
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
          )} */}

          {step === 3 && (
          <View style={styles.stepSection}>
            <Text style={styles.stepTitle}>Pricing</Text>
            <Text style={styles.stepDesc}>
              Select your cafe's general price range
            </Text>

            <View style={{ gap: 10, marginTop: 16 }}>
              {[
                "$ (Budget-friendly)",
                "$$ (Moderate)",
                "$$$ (Premium)",
              ].map((option) => (
                <Pressable
                  key={option}
                  onPress={() => {
                    setPriceRange(option);
                    setPriceError("");
                  }}
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor:
                      priceRange === option ? "#D4A373" : "#CCC",
                    backgroundColor:
                      priceRange === option ? "#FFF0E6" : "#FFF",
                  }}
                >
                  <Text style={{ textAlign: "center" }}>{option}</Text>
                </Pressable>
              ))}
            </View>

            {priceError ? (
              <Text style={{ color: "red", marginTop: 12, textAlign: "center" }}>
                {priceError}
              </Text>
            ) : null}

            <Button
              title="Continue"
              variant="caramel"
              onPress={() => {
                if (!priceRange) {
                  setPriceError("Please select a price range");
                  return;
                }
                next();
              }}
              style={{ marginTop: 24 }}
            />
          </View>
        )}

          {step === 4 && (
            <View style={styles.stepSection}>
              <Text style={styles.stepTitle}>Cafe Attributes</Text>
              <Text style={styles.stepDesc}>
                Select what best describes your cafe (optional)
              </Text>

              <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6, marginTop: 12, }}>
                {ATTRIBUTE_OPTIONS.map((tag) => (
                  <Pressable
                    key={tag}
                    onPress={() => toggleTag(tag)}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: selectedTags.includes(tag) ? "#D4A373" : "#CCC",
                      backgroundColor: selectedTags.includes(tag) ? "#FFF0E6" : "#FFF",
                      marginBottom: 6,
                    }}
                  >
                    <Text>{tag}</Text>
                  </Pressable>
                ))}
              </View>

              {tagError ? (
                <Text style={{ color: "red", marginTop: 10, textAlign: "center" }}>
                  {tagError}
                </Text>
              ) : null}

              <Button
                title="Finish Setup"
                variant="caramel"
                onPress={() => {
                  if (selectedTags.length === 0) {
                    setTagError("Please select at least one attribute");
                    return;
                  }

                  setTagError("");
                  handleFinishSetup();
                }}
                style={{ marginTop: 28 }}
              />
            </View>
          )}

          {/* STEP 4 — Manual */}
          {/* {step === 4 && (
            <View style={styles.stepSection}>
              <CheckCircle size={48} color="#D4A373" style={{ alignSelf: "center", marginBottom: 16 }} />
              <Text style={styles.stepTitle}>You're All Set!</Text>
              <Text style={styles.stepDesc}>
                Your cafe is registered. Once approved, you can start managing CafeHop.
              </Text>

              <Button
                title="Finish Setup"
                variant="caramel"
                onPress={handleFinishSetup}
              />
            </View>
          )} */}
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
  imageUploadBox: {
  height: 140,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: "#CCC",
  justifyContent: "center",
  alignItems: "center",
  marginBottom: 16,
  backgroundColor: "#FAFAFA",
  overflow: "hidden",
},

  imageUploadText: {
    color: "#888",
    fontSize: 14,
  },

  imagePreview: {
    width: "100%",
    height: "100%",
  },
});
