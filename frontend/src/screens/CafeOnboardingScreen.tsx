import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

import { Alert, Linking } from "react-native";
import { ArrowLeft, CheckCircle, Coffee } from "lucide-react-native";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { moderateScale, scale, verticalScale } from "../utils/responsive";

import Button from "../components/ui/Button";
import { Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch } from "../api/client";
import { supabase } from "../api/supabaseClient";
import { useRole } from "../context/RoleContext";

const requestLocation = async (): Promise<{
  latitude: number;
  longitude: number;
} | null> => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    Alert.alert(
      "Location Required",
      "Please enable location to register your cafe.",
      [{ text: "Open Settings", onPress: () => Linking.openSettings() }]
    );
    return null;
  }
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
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
const TOTAL_STEPS = 5;

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
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [contact, setContact] = useState(""); 
  const [hours, setHours] = useState<Record<string, DayHours>>(defaultHours);
  const [tagError, setTagError] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const debounceRef = useRef<any>(null);
  const [priceRange, setPriceRange] = useState<string | null>(null);
  const [priceError, setPriceError] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [imageError, setImageError] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Socials
  const [instagramUrl, setInstagramUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const updated = prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag];
      if (updated.length > 0) setTagError("");
      return updated;
    });
  };

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "We need access to your photos");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const uris = result.assets.map((asset) => asset.uri);
      setImages((prev) => [...prev, ...uris]);
    }
  };

  const next = () => setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  const back = () => setStep((prev) => Math.max(prev - 1, 1));

  const updateHours = (day: string, field: keyof DayHours, value: boolean | string) => {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const formatTimeInput = (raw: string): string => {
    const digits = raw.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  };
  const isValidTime = (s: string): boolean => /^([01]\d|2[0-3]):([0-5]\d)$/.test(s);
  const hoursValid = DAYS.every((d) => !hours[d].open || (isValidTime(hours[d].start) && isValidTime(hours[d].end)));

  const maxWidth = 420;

  const handleFinishSetup = async () => {
    console.log("[Finish] called, isSubmitting=", isSubmitting);
    if (isSubmitting) return;

    console.log("[Finish] phone=", phone.length, "coords=", coordinates);
    if (phone.length !== 10) {
      Alert.alert("Invalid Phone Number", "Phone number must be 10 digits");
      return;
    }

    setIsSubmitting(true);
    console.log("[Finish] starting upload, images=", images.length);
    try {
      let imageUrls: string[] = [];

      for (const img of images) {
        try {
          const fileName = `cafe-${Date.now()}-${Math.random()}.jpg`;
          const response = await fetch(img);
          const blob = await response.blob();

          const { error } = await supabase.storage
            .from("images")
            .upload(fileName, blob, { contentType: "image/jpeg" });

          if (error) {
            console.error("Image upload error:", error);
            Alert.alert("Error", "Image upload failed: " + error.message);
            return;
          }

          const { data: urlData } = supabase.storage
            .from("images")
            .getPublicUrl(fileName);

          imageUrls.push(urlData.publicUrl);
        } catch (imgErr) {
          console.error("Image fetch/upload crash:", imgErr);
          Alert.alert("Error", "Failed to process an image. Please try again.");
          return;
        }
      }

      console.log("[Finish] images uploaded, urls=", imageUrls);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert("Error", "You are not logged in");
        return;
      }

      console.log("[Finish] session ok, calling register API");
      const payload = {
        name: cafeName,
        description: description.trim() || null,
        address,
        contact_phone: phone,
        latitude: coordinates?.lat ?? null,
        longitude: coordinates?.lng ?? null,
        hours,
        price_range: priceRange,
        image_urls: imageUrls,
        attributes: selectedTags,
        instagram_url: instagramUrl.trim() || null,
        facebook_url: facebookUrl.trim() || null,
        website_url: websiteUrl.trim() || null,
      };

      const res = await fetch(`${API_URL}/api/cafe/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { data = { error: text }; }

      console.log("[Finish] API response status=", res.status, "data=", data);
      if (!res.ok) {
        Alert.alert("Error", data.error || "Failed to create cafe");
        return;
      }

      await supabase.auth.updateUser({ data: { display_name: cafeName } });
      setRole("cafe");
      console.log("[Finish] navigating to Home");
      navigation.navigate("Home");
    } catch (err) {
      console.error("CRASH:", err);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
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
          <Pressable
            onPress={step === 1 ? () => navigation.navigate("Onboarding") : back}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.backPressable}
          >
            <ArrowLeft size={22} color="#555" />
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
                placeholder="Short description (e.g. Cozy corner cafe with great espresso)"
                style={[styles.input, { minHeight: verticalScale(72), textAlignVertical: "top" }]}
                value={description}
                onChangeText={setDescription}
                multiline
              />
              <TextInput
                placeholder="Cafe Location"
                style={[styles.input, address.trim() && !coordinates ? { borderColor: "#D9534F" } : null]}
                value={address}
                onChangeText={(text) => {
                  setAddress(text);
                  setCoordinates(null);
                  if (debounceRef.current) clearTimeout(debounceRef.current);
                  debounceRef.current = setTimeout(async () => {
                    if (text.length < 3) { setSuggestions([]); return; }
                    try {
                      const res = await fetch(`${API_URL}/api/places/autocomplete?input=${text}`);
                      const data = await res.json();
                      setSuggestions(data.suggestions || []);
                    } catch (err) { console.error("Autocomplete error:", err); }
                  }, 300);
                }}
              />
              {suggestions.length > 0 && (
                <View style={{ maxHeight: 200, backgroundColor: "#fff", borderRadius: 10, marginTop: 4, borderWidth: 1, borderColor: "#ddd", overflow: "hidden" }}>
                  <ScrollView keyboardShouldPersistTaps="handled">
                    {suggestions.map((item) => (
                      <Pressable
                        key={item.placePrediction.placeId || item.placePrediction.text.text}
                        onPress={async () => {
                          const placeId = item.placePrediction.placeId;
                          const res = await fetch(`${API_URL}/api/places/details?place_id=${placeId}`);
                          const data = await res.json();
                          if (!data || !data.formattedAddress) {
                            Alert.alert("Error", "Place details not found");
                            return;
                          }
                          setAddress(data.formattedAddress);
                          setCoordinates({ lat: data.location.latitude, lng: data.location.longitude });
                          setTimeout(() => setSuggestions([]), 0);
                          setSuggestions([]);
                        }}
                        style={{ padding: 12, borderBottomWidth: 1, borderColor: "#eee" }}
                      >
                        <Text style={{ fontWeight: "600" }}>{item.placePrediction.structuredFormat.mainText.text}</Text>
                        <Text style={{ color: "#666", fontSize: 12 }}>{item.placePrediction.structuredFormat.secondaryText.text}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
              {address.trim().length > 0 && !coordinates && (
                <Text style={{ color: "#D9534F", fontSize: moderateScale(12), marginBottom: verticalScale(8), marginTop: -verticalScale(8) }}>
                  Please select your address from the suggestions above
                </Text>
              )}
              {coordinates && (
                <Text style={{ color: "#5A9E6F", fontSize: moderateScale(12), marginBottom: verticalScale(8), marginTop: -verticalScale(8) }}>
                  ✓ Address confirmed
                </Text>
              )}

              <TextInput
                placeholder="Phone Number"
                style={styles.input}
                value={phone}
                onChangeText={(text) => {
                  const cleaned = text.replace(/\D/g, "").slice(0, 10);
                  setPhone(cleaned);
                  setPhoneError(cleaned.length !== 10 ? "Phone number must be 10 digits" : "");
                }}
                keyboardType="phone-pad"
                maxLength={10}
              />
              {phoneError ? <Text style={{ color: "red", marginBottom: 10 }}>{phoneError}</Text> : null}

                <View style={{ marginBottom: verticalScale(16) }}>
                  <Text style={{ fontWeight: "600", marginBottom: 6 }}>
                    Cafe Photos
                  </Text>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <Pressable onPress={pickImages} style={styles.addImageBox}>
                      <Text style={{ fontSize: 24, color: "#D4A373" }}>+</Text>
                    </Pressable>

                    {images.map((uri, index) => (
                      <View key={index} style={{ marginRight: 10 }}>
                        <Pressable onPress={() => setPreviewImage(uri)}>
                          <Image source={{ uri }} style={styles.multiImage} />
                        </Pressable>

                        <Pressable
                          onPress={() =>
                            setImages((prev) => prev.filter((_, i) => i !== index))
                          }
                          style={styles.removeImageBtn}
                        >
                          <Text style={{ color: "#fff", fontSize: 12 }}>✕</Text>
                        </Pressable>
                      </View>
                    ))}
                  </ScrollView>

                  {imageError && (
                    <Text style={{ color: "red", marginTop: 6 }}>
                      Please upload at least one photo
                    </Text>
                  )}
                </View>
              {/* </View>
              )} */}

              <View style={styles.infoNote}>
                <Text style={styles.infoNoteText}>
                  💡 You can edit cafe details anytime in your Settings
                </Text>
              </View>

              <Button
                title="Continue"
                variant="caramel"
                onPress={() => {
                  if (images.length === 0) {
                    setImageError(true);
                    return;
                  }
                  setImageError(false);
                  next();
                }}
                disabled={
                  !cafeName.trim() ||
                  !address.trim() ||
                  phone.length !== 10 ||
                  images.length === 0
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
                          style={[
                            styles.timeInput,
                            hours[day].start.length > 0 && !isValidTime(hours[day].start) && { borderColor: "#D9534F" },
                          ]}
                          value={hours[day].start}
                          onChangeText={(v) => updateHours(day, "start", formatTimeInput(v))}
                          placeholder="09:00"
                          keyboardType="number-pad"
                          maxLength={5}
                        />
                      </View>
                      <Text style={styles.timeSep}>—</Text>
                      <View style={styles.timeField}>
                        <Text style={styles.timeLabel}>Closes</Text>
                        <TextInput
                          style={[
                            styles.timeInput,
                            hours[day].end.length > 0 && !isValidTime(hours[day].end) && { borderColor: "#D9534F" },
                          ]}
                          value={hours[day].end}
                          onChangeText={(v) => updateHours(day, "end", formatTimeInput(v))}
                          placeholder="21:00"
                          keyboardType="number-pad"
                          maxLength={5}
                        />
                      </View>
                    </View>
                  )}
                </View>
              ))}
              {!hoursValid && (
                <Text style={{ color: "#D9534F", fontSize: moderateScale(12), marginTop: verticalScale(4), textAlign: "center" }}>
                  Please enter valid times in HH:MM format (00:00 – 23:59).
                </Text>
              )}
              <Button title="Continue" variant="caramel" onPress={next} disabled={!hoursValid} />
            </View>
          )}

          {/* STEP 3 — Pricing */}
          {step === 3 && (
            <View style={styles.stepSection}>
              <Text style={styles.stepTitle}>Pricing</Text>
              <Text style={styles.stepDesc}>Select your cafe's general price range</Text>
              <View style={{ gap: scale(10), marginTop: verticalScale(16) }}>
                {["$ (Budget-friendly)", "$$ (Moderate)", "$$$ (Premium)"].map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => { setPriceRange(option); setPriceError(""); }}
                    style={{
                      padding: scale(14), borderRadius: scale(10), borderWidth: 1,
                      borderColor: priceRange === option ? "#D4A373" : "#CCC",
                      backgroundColor: priceRange === option ? "#FFF0E6" : "#FFF",
                    }}
                  >
                    <Text style={{ textAlign: "center", fontSize: moderateScale(14) }}>{option}</Text>
                  </Pressable>
                ))}
              </View>
              {priceError ? <Text style={{ color: "red", marginTop: verticalScale(12), textAlign: "center", fontSize: moderateScale(13) }}>{priceError}</Text> : null}
              <Button
                title="Continue"
                variant="caramel"
                onPress={() => {
                  if (!priceRange) { setPriceError("Please select a price range"); return; }
                  next();
                }}
                style={{ marginTop: verticalScale(24) }}
              />
            </View>
          )}

          {/* STEP 4 — Socials */}
          {step === 4 && (
            <View style={styles.stepSection}>
              <Text style={styles.stepTitle}>Contact & Socials</Text>
              <Text style={styles.stepDesc}>Help customers find and connect with you (all optional)</Text>
              <Text style={styles.fieldLabel}>Instagram</Text>
              <TextInput
                placeholder="@yourcafe"
                style={styles.input}
                value={instagramUrl}
                onChangeText={setInstagramUrl}
                autoCapitalize="none"
              />
              <Text style={styles.fieldLabel}>Facebook</Text>
              <TextInput
                placeholder="facebook.com/yourcafe"
                style={styles.input}
                value={facebookUrl}
                onChangeText={setFacebookUrl}
                autoCapitalize="none"
              />
              <Text style={styles.fieldLabel}>Website</Text>
              <TextInput
                placeholder="www.yourcafe.com"
                style={styles.input}
                value={websiteUrl}
                onChangeText={setWebsiteUrl}
                autoCapitalize="none"
                keyboardType="url"
              />
              <Button title="Continue" variant="caramel" onPress={next} style={{ marginTop: verticalScale(8) }} />
            </View>
          )}

          {/* STEP 5 — Cafe Attributes */}
          {step === 5 && (
            <View style={styles.stepSection}>
              <Text style={styles.stepTitle}>Cafe Attributes</Text>
              <Text style={styles.stepDesc}>Select what best describes your cafe (optional)</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: scale(6), marginTop: verticalScale(12) }}>
                {ATTRIBUTE_OPTIONS.map((tag) => (
                  <Pressable
                    key={tag}
                    onPress={() => toggleTag(tag)}
                    style={{
                      paddingVertical: scale(10), paddingHorizontal: scale(14),
                      borderRadius: scale(20), borderWidth: 1,
                      borderColor: selectedTags.includes(tag) ? "#D4A373" : "#CCC",
                      backgroundColor: selectedTags.includes(tag) ? "#FFF0E6" : "#FFF",
                      marginBottom: scale(6),
                    }}
                  >
                    <Text style={{ fontSize: moderateScale(13) }}>{tag}</Text>
                  </Pressable>
                ))}
              </View>
              {tagError ? <Text style={{ color: "red", marginTop: verticalScale(10), textAlign: "center", fontSize: moderateScale(13) }}>{tagError}</Text> : null}
              <Button
                title={isSubmitting ? "Setting up…" : "Finish Setup"}
                variant="caramel"
                disabled={isSubmitting}
                onPress={() => {
                  setTagError("");
                  handleFinishSetup();
                }}
                style={{ marginTop: verticalScale(28) }}
              />
            </View>
          )}
        </View>
      </ScrollView>
      {previewImage && (
        <Pressable
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.9)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setPreviewImage(null)}
        >
          <Image
            source={{ uri: previewImage }}
            style={{
              width: "90%",
              height: "70%",
              borderRadius: 12,
            }}
            resizeMode="contain"
          />
        </Pressable>
      )}
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
  stepSection: { width: "100%", marginBottom: verticalScale(24) },
  stepTitle: {
    fontSize: moderateScale(20), fontWeight: "bold", textAlign: "center",
    marginBottom: verticalScale(6), color: "#2C1810",
  },
  stepDesc: { fontSize: moderateScale(14), color: "#666", textAlign: "center", marginBottom: verticalScale(20) },
  fieldLabel: { fontSize: moderateScale(13), fontWeight: "600", color: "#555", marginBottom: verticalScale(4), marginTop: verticalScale(4) },
  input: {
    borderWidth: 1, borderColor: "#CCC", borderRadius: scale(8),
    padding: scale(12), marginBottom: verticalScale(12),
    backgroundColor: "#FFF", fontSize: moderateScale(15),
  },
  infoNote: {
    backgroundColor: "rgba(212,163,115,0.1)", borderRadius: scale(10),
    padding: scale(12), marginBottom: verticalScale(16),
  },
  infoNoteText: { fontSize: moderateScale(13), color: "#D4A373", textAlign: "center" },
  dayRow: {
    backgroundColor: "#FFF", borderRadius: scale(12), borderWidth: 1,
    borderColor: "#E0E0E0", padding: scale(12), marginBottom: verticalScale(10),
  },
  dayHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dayName: { fontSize: moderateScale(15), fontWeight: "600", color: "#2C1810" },
  togglePill: {
    paddingHorizontal: scale(14), paddingVertical: scale(6),
    borderRadius: scale(20), borderWidth: 1, borderColor: "#CCC", backgroundColor: "#F5F5F5",
  },
  togglePillActive: { borderColor: "#D4A373", backgroundColor: "#FFF0E6" },
  togglePillText: { fontSize: moderateScale(13), color: "#888" },
  togglePillTextActive: { color: "#D4A373", fontWeight: "600" },
  timeRow: { flexDirection: "row", alignItems: "center", marginTop: verticalScale(10), gap: scale(8) },
  timeField: { flex: 1 },
  timeLabel: { fontSize: moderateScale(11), color: "#999", marginBottom: verticalScale(4) },
  timeInput: {
    borderWidth: 1, borderColor: "#DDD", borderRadius: scale(8),
    padding: scale(8), backgroundColor: "#FAFAFA", fontSize: moderateScale(14), textAlign: "center",
  },
  timeSep: { fontSize: moderateScale(18), color: "#CCC", marginTop: verticalScale(16) },
  imageUploadBox: {
    height: verticalScale(160), borderRadius: scale(12), borderWidth: 1,
    borderColor: "#CCC", justifyContent: "center", alignItems: "center",
    marginBottom: verticalScale(10), backgroundColor: "#FAFAFA", overflow: "hidden",
  },
  imageUploadText: { color: "#888", fontSize: moderateScale(14) },
  imagePreview: { width: "100%", height: "100%" },

  addImageBox: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D4A373",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    backgroundColor: "#FFF0E6",
  },

  multiImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },

  removeImageBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
});
