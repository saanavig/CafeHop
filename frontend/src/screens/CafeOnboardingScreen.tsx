import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
// import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

import { Alert, Linking } from "react-native";
import { CheckCircle, Coffee } from "lucide-react-native";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import React, { useState, useRef, useEffect } from "react";
import { moderateScale, scale, verticalScale } from "../utils/responsive";

import Button from "../components/ui/Button";
import { Image } from "react-native";
import { apiFetch } from "../api/client";
import { supabase } from "../api/supabaseClient";
import { useRole } from "../context/RoleContext";

const requestLocation = async (): Promise<{
  latitude: number;
  longitude: number;
} | null> => {
  console.log("Requesting location permission...");

  const { status } = await Location.requestForegroundPermissionsAsync();

  console.log("Permission status:", status);

  if (status !== "granted") {
    console.log("Location permission denied");

    Alert.alert(
      "Location Required",
      "Please enable location to register your cafe.",
      [
        {
          text: "Open Settings",
          onPress: () => {
            console.log("Opening settings");
            Linking.openSettings();
          },
        },
      ]
    );

    return null;
  }

  try {
    console.log("Getting current position...");

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    console.log("Location received:", location.coords);

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (err) {
    console.error("Error getting location:", err);
    return null;
  }
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
  const debounceRef = useRef<any>(null);
  // const [email, setEmail] = useState("");
  const [priceRange, setPriceRange] = useState<string | null>(null);
  const [priceError, setPriceError] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

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

  const maxWidth = scale(480);

  const handleFinishSetup = async () => {
    console.log("Finish setup clicked");
    
    let imageUrl = null;

    // if (!email.trim()) {
    //   Alert.alert("Invalid Email", "Please enter a valid email");
    //   return;
    // }

    if (phone.length !== 10) {
      Alert.alert("Invalid Phone Number", "Phone number must be 10 digits");
      return;
    }

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
      if (!coordinates) {
        Alert.alert("Please select a valid address from the dropdown");
        return;
      }

      const latitude = coordinates.lat;
      const longitude = coordinates.lng;

      const payload = {
        name: cafeName,
        address,
        // contact_email: email,
        contact_phone: phone,
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
      console.log("Navigating to Home");
      navigation.navigate("Home");
    } catch (err) {
      console.error("CRASH:", err);
      Alert.alert("Error", "Something went wrong");
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={[styles.innerContainer, { maxWidth }]}>
          {/* Header */}
          <Coffee size={scale(32)} color="#D4A373" style={{ alignSelf: "center", marginBottom: verticalScale(8) }} />
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
                placeholder="Cafe Location"
                style={styles.input}
                value={address}
                onChangeText={(text) => {
                  setAddress(text);
                  setCoordinates(null);

                  if (debounceRef.current) {
                    clearTimeout(debounceRef.current);
                  }

                  debounceRef.current = setTimeout(async () => {
                    if (text.length < 3) {
                      setSuggestions([]);
                      return;
                    }

                    try {
                      const res = await fetch(
                        `${API_URL}/api/places/autocomplete?input=${text}`
                      );

                      const data = await res.json();

                      // if (data.status !== "OK") {
                      //   console.warn("Places API error:", data.status);
                      //   return;
                      // }

                      setSuggestions(data.suggestions || []);
                    } catch (err) {
                      console.error("Autocomplete error:", err);
                    }
                  }, 300);
                }}
              />
              {suggestions.length > 0 && (
                <View
                  style={{
                    maxHeight: 200,
                    backgroundColor: "#fff",
                    borderRadius: 10,
                    marginTop: 4,
                    borderWidth: 1,
                    borderColor: "#ddd",
                    overflow: "hidden",
                  }}
                >
                  <ScrollView keyboardShouldPersistTaps="handled">
                    {suggestions.map((item) => (
                      <Pressable
                        key={item.placePrediction.placeId || item.placePrediction.text.text}
                        onPress={async () => {
                          console.log("PLACE OBJECT:", item);
                          const placeId = item.placePrediction.placeId;

                          const res = await fetch(
                            `${API_URL}/api/places/details?place_id=${placeId}`
                          );

                          const data = await res.json();
                          console.log("DETAILS:", data);

                          if (!data || !data.formattedAddress) {
                            Alert.alert("Error", "Place details not found");
                            return;
                          }

                          setAddress(data.formattedAddress);

                          setCoordinates({
                            lat: data.location.latitude,
                            lng: data.location.longitude,
                          });

                          setTimeout(() => {
                            setSuggestions([]);
                          }, 0);
                          setSuggestions([]);
                        }}
                        style={{
                          padding: 12,
                          borderBottomWidth: 1,
                          borderColor: "#eee",
                        }}
                      >
                        <Text style={{ fontWeight: "600" }}>
                          {item.placePrediction.structuredFormat.mainText.text}
                        </Text>
                        <Text style={{ color: "#666", fontSize: 12 }}>
                          {item.placePrediction.structuredFormat.secondaryText.text}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
              {/* done with location here */}

              {/* <TextInput
                placeholder="Email"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              /> */}
              <TextInput
                placeholder="Phone Number"
                style={styles.input}
                value={phone}
                onChangeText={(text) => {
                  const cleaned = text.replace(/\D/g, "").slice(0, 10);
                  setPhone(cleaned);

                  if (cleaned.length !== 10) {
                    setPhoneError("Phone number must be 10 digits");
                  } else {
                    setPhoneError("");
                  }
                }}
                keyboardType="phone-pad"
                maxLength={10}
              />

              {phoneError ? (
                <Text style={{ color: "red", marginBottom: 10 }}>
                  {phoneError}
                </Text>
              ) : null}



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
                disabled={
                  !cafeName.trim() ||
                  !address.trim() ||
                  // !email.trim() ||
                  phone.length !== 10 ||
                  !coordinates
                }
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
          {step === 3 && (
          <View style={styles.stepSection}>
            <Text style={styles.stepTitle}>Pricing</Text>
            <Text style={styles.stepDesc}>
              Select your cafe's general price range
            </Text>

            <View style={{ gap: scale(10), marginTop: verticalScale(16) }}>
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
                    padding: scale(14),
                    borderRadius: scale(10),
                    borderWidth: 1,
                    borderColor:
                      priceRange === option ? "#D4A373" : "#CCC",
                    backgroundColor:
                      priceRange === option ? "#FFF0E6" : "#FFF",
                  }}
                >
                  <Text style={{ textAlign: "center", fontSize: moderateScale(14) }}>{option}</Text>
                </Pressable>
              ))}
            </View>

            {priceError ? (
              <Text style={{ color: "red", marginTop: verticalScale(12), textAlign: "center", fontSize: moderateScale(13) }}>
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
              style={{ marginTop: verticalScale(24) }}
            />
          </View>
        )}

          {step === 4 && (
            <View style={styles.stepSection}>
              <Text style={styles.stepTitle}>Cafe Attributes</Text>
              <Text style={styles.stepDesc}>
                Select what best describes your cafe (optional)
              </Text>

              <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: scale(6), marginTop: verticalScale(12) }}>
                {ATTRIBUTE_OPTIONS.map((tag) => (
                  <Pressable
                    key={tag}
                    onPress={() => toggleTag(tag)}
                    style={{
                      paddingVertical: scale(10),
                      paddingHorizontal: scale(14),
                      borderRadius: scale(20),
                      borderWidth: 1,
                      borderColor: selectedTags.includes(tag) ? "#D4A373" : "#CCC",
                      backgroundColor: selectedTags.includes(tag) ? "#FFF0E6" : "#FFF",
                      marginBottom: scale(6),
                    }}
                  >
                    <Text style={{ fontSize: moderateScale(13) }}>{tag}</Text>
                  </Pressable>
                ))}
              </View>

              {tagError ? (
                <Text style={{ color: "red", marginTop: verticalScale(10), textAlign: "center", fontSize: moderateScale(13) }}>
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
                style={{ marginTop: verticalScale(28) }}
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
  scrollContent: { padding: scale(24), alignItems: "center", width: "100%" },
  innerContainer: { width: "100%" },
  title: {
    fontSize: moderateScale(22),
    fontWeight: "bold",
    fontFamily: "PlayfairDisplay_700Bold",
    marginBottom: verticalScale(4),
    textAlign: "center",
  },
  subtitle: { fontSize: moderateScale(14), color: "#555", marginBottom: verticalScale(16), textAlign: "center" },
  progressBackground: {
    width: "100%",
    height: verticalScale(6),
    backgroundColor: "#DDD",
    borderRadius: scale(3),
    marginBottom: verticalScale(16),
  },
  progressForeground: { height: verticalScale(6), backgroundColor: "#D4A373", borderRadius: scale(3) },
  backText: { color: "#555", marginBottom: verticalScale(8), alignSelf: "flex-start", fontSize: moderateScale(14) },
  stepSection: { width: "100%", marginBottom: verticalScale(24) },
  stepTitle: {
    fontSize: moderateScale(20),
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: verticalScale(6),
    color: "#2C1810",
  },
  stepDesc: { fontSize: moderateScale(14), color: "#666", textAlign: "center", marginBottom: verticalScale(20) },
  input: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: scale(8),
    padding: scale(12),
    marginBottom: verticalScale(12),
    backgroundColor: "#FFF",
    fontSize: moderateScale(15),
  },
  // Hours
  dayRow: {
    backgroundColor: "#FFF",
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#E0E0E0",
    padding: scale(12),
    marginBottom: verticalScale(10),
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
    marginTop: verticalScale(10),
    gap: scale(8),
  },
  timeField: { flex: 1 },
  timeLabel: { fontSize: moderateScale(11), color: "#999", marginBottom: verticalScale(4) },
  timeInput: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: scale(8),
    padding: scale(8),
    backgroundColor: "#FAFAFA",
    fontSize: moderateScale(14),
    textAlign: "center",
  },
  timeSep: { fontSize: moderateScale(18), color: "#CCC", marginTop: verticalScale(16) },
  imageUploadBox: {
    height: verticalScale(140),
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#CCC",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: verticalScale(16),
    backgroundColor: "#FAFAFA",
    overflow: "hidden",
  },
  imageUploadText: {
    color: "#888",
    fontSize: moderateScale(14),
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
});
