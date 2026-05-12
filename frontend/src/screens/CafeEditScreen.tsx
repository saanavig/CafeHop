import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { moderateScale, scale } from "../utils/responsive";

import { ArrowLeft } from "lucide-react-native";
import BottomNav from "../components/ui/BottomNav";
import Button from "../components/ui/Button";
import { Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../api/supabaseClient";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const ATTRIBUTE_OPTIONS = [
  "Cozy", "Quiet", "Lively", "Outdoor Seating", "Pet Friendly", "WiFi", "Power Outlets",
  "Specialty Drinks", "Great Pastries", "Vegan Options", "Study-friendly", "Good for Meetings",
  "Instagrammable", "Late-night", "Early morning"
];

type DayHours = { open: boolean; start: string; end: string };

const defaultHours: Record<string, DayHours> = Object.fromEntries(
  DAYS.map((d) => [d, { open: true, start: "09:00", end: "21:00" }])
);

export default function CafeEditScreen() {
  const navigation = useNavigation<any>();
  const { colors: themeColors } = useTheme();
  const { width } = Dimensions.get("window");
  const contentWidth = Math.min(width * 0.9, 480);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cafeId, setCafeId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);

  const [cafeName, setCafeName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");

  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const debounceRef = useRef<any>(null);

  const [attributes, setAttributes] = useState<string[]>([]);
  const [hours, setHours] = useState<Record<string, DayHours>>(defaultHours);
  const [priceLevel, setPriceLevel] = useState<number | null>(null);

  const [images, setImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<any[]>([]); 

  useEffect(() => {
    const loadCafe = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data, error } = await supabase
        .from("cafes")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (error) { console.error("Load cafe error:", error); }

      if (data) {
        setCafeId(data.id);
        setCafeName(data.name || "");
        setAddress(data.address || "");
        setDescription(data.description || "");
        setContactEmail(data.contact_email || "");
        setContactPhone(data.contact_phone || "");
        setWebsiteUrl(data.website_url || "");
        setInstagramUrl(data.instagram_url || "");
        setFacebookUrl(data.facebook_url || "");
        if (Array.isArray(data.image_urls) && data.image_urls.length > 0) {
          setImages(data.image_urls.filter(Boolean));
        } else if (data.image_url) {
          setImages([data.image_url]);
        }
        if (data.price_level) {
          setPriceLevel(data.price_level);
        } else if (data.price_range) {
          const map: any = {
            "$ (Budget-friendly)": 1,
            "$$ (Moderate)": 2,
            "$$$ (Premium)": 3,
          };
          setPriceLevel(map[data.price_range] || null);
        }

        if (Array.isArray(data.attributes)) {
          setAttributes(data.attributes);
        } else if (typeof data.attributes === "string") {
          setAttributes(data.attributes.split(",").map((a: string) => a.trim()).filter(Boolean));
        }

        // Load hours from cafe_hours table
        const { data: hoursData } = await supabase
          .from("cafe_hours")
          .select("day_of_week, open_time, close_time")
          .eq("cafe_id", data.id);

        if (hoursData && hoursData.length > 0) {
        const DAY_MAP = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];
          const loadedHours: Record<string, DayHours> = { ...defaultHours };
          hoursData.forEach((row: any) => {
            const dayName = DAY_MAP[row.day_of_week];
            if (dayName) {
              loadedHours[dayName] = {
                open: !!row.open_time && !!row.close_time,
                start: row.open_time?.slice(0, 5) || "09:00",
                end: row.close_time?.slice(0, 5) || "21:00",
              };
            }
          });
          setHours(loadedHours);
        }
      }
      setLoading(false);
    };
    loadCafe();
  }, []);

  // useEffect(() => {
  //   const loadImages = async () => {
  //     if (!cafeId) return;

  //     const { data: files, error } = await supabase.storage
  //       .from("images")
  //       .list(`cafes/${cafeId}`, { limit: 100 });

  //     if (error) {
  //       console.error("Image load error:", error);
  //       return;
  //     }

  //     if (files) {
  //       const urls = files.map((file) => {
  //         const { data } = supabase.storage
  //           .from("images")
  //           .getPublicUrl(`cafes/${cafeId}/${file.name}`);

  //         return data.publicUrl;
  //       });

  //       setImages(urls);
  //     }
  //   };

  //   loadImages();
  // }, [cafeId]);

  const toggleAttribute = (attr: string) => {
    setAttributes((prev) =>
      prev.includes(attr) ? prev.filter((a) => a !== attr) : [...prev, attr]
    );
  };

  const updateHours = (day: string, field: keyof DayHours, value: boolean | string) => {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const DAY_INDEX_MAP = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
        setMessageType(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  // const { data: files, error: imageError } = await supabase.storage
  //   .from("images")
  //   .list(`cafes/${data.id}`, { limit: 100 });

  // if (imageError) {
  //   console.error("Image load error:", imageError);
  // }

  // if (files) {
  //   const urls = files.map((file) => {
  //     const { data: publicUrlData } = supabase.storage
  //       .from("images")
  //       .getPublicUrl(`cafes/${data.id}/${file.name}`);

  //     return publicUrlData.publicUrl;
  //   });

  //   setImages(urls);
  // }

  const handleSave = async () => {
    setMessage(null);
    setMessageType(null);

    if (!cafeId) {
      setMessage("Cafe not found.");
      setMessageType("error");
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setMessage("User not authenticated.");
        setMessageType("error");
        setSaving(false);
        return;
      }

      console.log("USER ID:", user.id);
      console.log("CAFE ID:", cafeId);

      const { data, error } = await supabase
        .from("cafes")
        .update({
          name: cafeName.trim(),
          address: address.trim(),
          description: description.trim() || null,
          contact_email: contactEmail.trim() || null,
          contact_phone: contactPhone.trim() || null,
          website_url: websiteUrl.trim() || null,
          instagram_url: instagramUrl.trim() || null,
          facebook_url: facebookUrl.trim() || null,
          attributes,
          price_level: priceLevel,
        })
        .eq("id", cafeId)
        .select();

      console.log("UPDATED DATA:", data);

      if (error) {
        console.error("Save error:", error);
        setMessage("Failed to save changes.");
        setMessageType("error");
        return;
      }

      const hoursPayload = Object.entries(hours).map(([day, value]) => ({
        cafe_id: cafeId,
        day_of_week: DAY_INDEX_MAP[day as keyof typeof DAY_INDEX_MAP],
        open_time: value.open ? value.start : null,
        close_time: value.open ? value.end : null,
      }));

      const { error: deleteError } = await supabase
      .from("cafe_hours")
      .delete()
      .eq("cafe_id", cafeId);

    if (deleteError) {
      console.error("Hours delete error:", deleteError);
      setMessage("Failed to reset hours.");
      setMessageType("error");
      return;
    }

    let uploadedUrls: string[] = [...images];

    for (const img of newImages) {
      const fileName = `cafes/${cafeId}/${Date.now()}-${Math.random()}.jpg`;

      const response = await fetch(img.uri);
      const blob = await response.blob();

      const { error } = await supabase.storage
        .from("images")
        .upload(fileName, blob);

      if (error) {
        console.error("Upload error:", error);
        continue;
      }

      const { data } = supabase.storage
        .from("images")
        .getPublicUrl(fileName);

      uploadedUrls.push(data.publicUrl);
    }

      const { error: imageUpdateError } = await supabase
        .from("cafes")
        .update({
          image_url: uploadedUrls[0] || null,
          image_urls: uploadedUrls,
        })
        .eq("id", cafeId);

      if (imageUpdateError) {
        console.error("Image URL save error:", imageUpdateError);
      }

    // Clear after upload
    setNewImages([]);
    setImages(uploadedUrls);

    const { error: hoursError } = await supabase
      .from("cafe_hours")
      .insert(hoursPayload);

    if (hoursError) {
      console.error("Hours insert error:", hoursError);
      setMessage("Cafe saved but hours failed to update.");
      setMessageType("error");
      return;
    }

      setMessage("Your cafe profile has been updated.");
      setMessageType("success");
    } catch (err) {
      console.error("Save crash:", err);
      setMessage("Something went wrong.");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled) {
      const asset = result.assets[0];

      const compressed = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 800 } }],
        {
          compress: 0.6,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      setNewImages((prev) => [...prev, compressed]);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: themeColors.bg }}>
        <ActivityIndicator size="small" color="#D4A373" />
      </View>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={themeColors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Edit Cafe Profile</Text>
        </View>

        <View style={[styles.content, { width: contentWidth }]}>

          {/* Basic Info */}
          <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>Basic Information</Text>
          <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Text style={[styles.fieldLabel, { color: themeColors.textMuted }]}>Cafe Name</Text>
            <TextInput style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]} value={cafeName} onChangeText={setCafeName} placeholder="Cafe name" />
            <Text style={[styles.fieldLabel, { color: themeColors.textMuted }]}>Address</Text>
            <TextInput
              style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]}
              value={address}
              onChangeText={(text) => {
                setAddress(text);
                setCoordinates(null);

                if (debounceRef.current) clearTimeout(debounceRef.current);

                debounceRef.current = setTimeout(async () => {
                  if (text.length < 3) {
                    setSuggestions([]);
                    return;
                  }

                  try {
                    const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/places/autocomplete?input=${text}`);
                    const data = await res.json();
                    setSuggestions(data.suggestions || []);
                  } catch (err) {
                    console.error("Autocomplete error:", err);
                  }
                }, 300);
              }}
              placeholder="Street address"
            />

            {suggestions.length > 0 && (
              <View style={{
                maxHeight: 200,
                backgroundColor: themeColors.card,
                borderRadius: 10,
                marginTop: 4,
                borderWidth: 1,
                borderColor: themeColors.border,
                overflow: "hidden"
              }}>
                <ScrollView keyboardShouldPersistTaps="handled">
                  {suggestions.map((item) => (
                    <Pressable
                      key={item.placePrediction.placeId}
                      onPress={async () => {
                        const placeId = item.placePrediction.placeId;

                        const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/places/details?place_id=${placeId}`);
                        const data = await res.json();

                        setAddress(data.formattedAddress);
                        setCoordinates({
                          lat: data.location.latitude,
                          lng: data.location.longitude,
                        });

                        setSuggestions([]);
                      }}
                      style={{
                        padding: 12,
                        borderBottomWidth: 1,
                        borderColor: themeColors.border
                      }}
                    >
                      <Text style={{ fontWeight: "600", color: themeColors.text }}>
                        {item.placePrediction.structuredFormat.mainText.text}
                      </Text>
                      <Text style={{ color: themeColors.textMuted, fontSize: 12 }}>
                        {item.placePrediction.structuredFormat.secondaryText.text}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            <Text style={[styles.fieldLabel, { color: themeColors.textMuted }]}>Description</Text>
            <TextInput
              style={[styles.input, styles.multilineInput, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]}
              value={description}
              onChangeText={setDescription}
              placeholder="What makes your cafe special?"
              multiline
              numberOfLines={4}
            />

            <Text style={[styles.fieldLabel, { color: themeColors.textMuted }]}>Photos</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>

              {images.map((url, index) => (
                <View key={index} style={{ position: "relative" }}>
                  <Image
                    source={{ uri: url }}
                    style={{ width: 80, height: 80, borderRadius: 10 }}
                  />

                  <Pressable
                    onPress={async () => {
                      const path = url.split("/storage/v1/object/public/images/")[1];

                      await supabase.storage.from("images").remove([path]);

                      const updatedImages = images.filter((_, i) => i !== index);
                      setImages(updatedImages);

                      await supabase
                        .from("cafes")
                        .update({
                          image_url: updatedImages[0] || null,
                          image_urls: updatedImages,
                        })
                        .eq("id", cafeId);
                    }}
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      backgroundColor: themeColors.card,
                      borderRadius: 12,
                      padding: 2,
                    }}
                  >
                    <Text style={{ color: "red", fontWeight: "bold" }}>×</Text>
                  </Pressable>
                </View>
              ))}

              {newImages.map((img, index) => (
              <View key={`new-${index}`} style={{ position: "relative" }}>
                <Image
                  source={{ uri: img.uri }}
                  style={{ width: 80, height: 80, borderRadius: 10 }}
                />

                <Pressable
                  onPress={() =>
                    setNewImages((prev) => prev.filter((_, i) => i !== index))
                  }
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    backgroundColor: "#fff",
                    borderRadius: 12,
                    padding: 2,
                  }}
                >
                  <Text style={{ color: "red", fontWeight: "bold" }}>×</Text>
                </Pressable>
              </View>
            ))}

              <Pressable
                onPress={pickImage}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: themeColors.border,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 24, color: themeColors.textMuted }}>+</Text>
              </Pressable>
            </View>
          </View>

          {/* Contact & Social */}
          <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>Contact & Social</Text>
          <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Text style={[styles.fieldLabel, { color: themeColors.textMuted }]}>Contact Email</Text>
            <TextInput style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]} value={contactEmail} onChangeText={setContactEmail} keyboardType="email-address" autoCapitalize="none" placeholder="hello@yourcafe.com" />
            <Text style={[styles.fieldLabel, { color: themeColors.textMuted }]}>Contact Phone</Text>
            <TextInput style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]} value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" placeholder="+1 (555) 000-0000" />
            <Text style={[styles.fieldLabel, { color: themeColors.textMuted }]}>Website</Text>
            <TextInput style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]} value={websiteUrl} onChangeText={setWebsiteUrl} autoCapitalize="none" keyboardType="url" placeholder="www.yourcafe.com" />
            <Text style={[styles.fieldLabel, { color: themeColors.textMuted }]}>Instagram</Text>
            <TextInput style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]} value={instagramUrl} onChangeText={setInstagramUrl} autoCapitalize="none" placeholder="@yourcafe" />
            <Text style={[styles.fieldLabel, { color: themeColors.textMuted }]}>Facebook</Text>
            <TextInput style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]} value={facebookUrl} onChangeText={setFacebookUrl} autoCapitalize="none" placeholder="facebook.com/yourcafe" />
          </View>

          {/* Price Level */}
          <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>Price Range</Text>
          <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={{ flexDirection: "row", gap: scale(8) }}>
              {[["$", 1], ["$$", 2], ["$$$", 3]].map(([label, val]) => (
                <Pressable
                  key={val}
                  onPress={() => setPriceLevel(val as number)}
                  style={[
                    styles.priceChip,
                    { backgroundColor: themeColors.iconBg, borderColor: themeColors.border },
                    priceLevel === val && styles.priceChipActive,
                  ]}
                >
                  <Text style={[styles.priceChipText, { color: themeColors.textMuted }, priceLevel === val && styles.priceChipTextActive]}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Amenities */}
          <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>Amenities</Text>
          <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={styles.chipsContainer}>
              {ATTRIBUTE_OPTIONS.map((attr) => {
                const selected = attributes.includes(attr);
                return (
                  <Pressable
                    key={attr}
                    style={[styles.chip, { backgroundColor: themeColors.iconBg, borderColor: themeColors.border }, selected && styles.chipSelected]}
                    onPress={() => toggleAttribute(attr)}
                  >
                    <Text style={[styles.chipText, { color: themeColors.textMuted }, selected && styles.chipTextSelected]}>{attr}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Operating Hours */}
          <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>Operating Hours</Text>
          <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            {DAYS.map((day, idx) => (
              <View key={day} style={[styles.dayRow, idx < DAYS.length - 1 && [styles.dayRowBorder, { borderBottomColor: themeColors.border }]]}>
                <View style={styles.dayHeader}>
                  <Text style={[styles.dayName, { color: themeColors.text }]}>{day}</Text>
                  <Pressable
                    style={[styles.togglePill, { borderColor: themeColors.border, backgroundColor: themeColors.iconBg }, hours[day].open && styles.togglePillActive]}
                    onPress={() => updateHours(day, "open", !hours[day].open)}
                  >
                    <Text style={[styles.togglePillText, { color: themeColors.textMuted }, hours[day].open && styles.togglePillTextActive]}>
                      {hours[day].open ? "Open" : "Closed"}
                    </Text>
                  </Pressable>
                </View>
                {hours[day].open && (
                  <View style={styles.timeRow}>
                    <View style={styles.timeField}>
                      <Text style={[styles.timeLabel, { color: themeColors.textMuted }]}>Opens</Text>
                      <TextInput style={[styles.timeInput, { backgroundColor: themeColors.iconBg, borderColor: themeColors.border, color: themeColors.text }]} value={hours[day].start} onChangeText={(v) => updateHours(day, "start", v)} placeholder="09:00" placeholderTextColor={themeColors.textMuted} />
                    </View>
                    <Text style={[styles.timeSep, { color: themeColors.border }]}>—</Text>
                    <View style={styles.timeField}>
                      <Text style={[styles.timeLabel, { color: themeColors.textMuted }]}>Closes</Text>
                      <TextInput style={[styles.timeInput, { backgroundColor: themeColors.iconBg, borderColor: themeColors.border, color: themeColors.text }]} value={hours[day].end} onChangeText={(v) => updateHours(day, "end", v)} placeholder="21:00" placeholderTextColor={themeColors.textMuted} />
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>

          {message && (
            <View
              style={[
                styles.messageBox,
                messageType === "success" ? styles.successBox : styles.errorBox,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  messageType === "success" ? styles.successText : styles.errorText,
                ]}
              >
                {message}
              </Text>
            </View>
          )}

          <Button
            title={saving ? "Saving..." : "Save Changes"}
            variant="caramel"
            onPress={handleSave}
            disabled={saving}
          />
          <Text style={[styles.footer, { color: themeColors.textMuted }]}>CafeHop v1.0.0</Text>
        </View>
      </ScrollView>

      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F3F0" },
  scrollContent: { paddingTop: scale(8), paddingBottom: scale(100), alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: scale(16), marginBottom: scale(16), width: "100%" },
  backButton: { padding: scale(8), marginRight: scale(12) },
  headerTitle: { fontSize: moderateScale(20), fontWeight: "600", fontFamily: "PlayfairDisplay_700Bold", color: "#1A1A1A" },
  content: { alignSelf: "center", paddingHorizontal: scale(16) },
  sectionLabel: {
    fontSize: moderateScale(12), fontWeight: "600", color: "#888",
    textTransform: "uppercase", marginBottom: scale(10), marginTop: scale(20), letterSpacing: 0.5,
  },
  card: {
    backgroundColor: "#FFF", borderRadius: scale(16), borderWidth: 1,
    borderColor: "#E8DFD5", padding: scale(16), marginBottom: scale(4),
  },
  fieldLabel: { fontSize: moderateScale(12), fontWeight: "600", color: "#555", marginBottom: scale(4), marginTop: scale(8) },
  input: {
    borderWidth: 1, borderColor: "#E0E0E0", borderRadius: scale(8),
    paddingHorizontal: scale(12), paddingVertical: scale(10),
    backgroundColor: "#FAFAFA", fontSize: moderateScale(14), color: "#1A1A1A",
  },
  multilineInput: { height: scale(88), textAlignVertical: "top", marginBottom: scale(4) },
  priceChip: {
    flex: 1, paddingVertical: scale(10), borderRadius: scale(10),
    borderWidth: 1, borderColor: "#CCC", backgroundColor: "#F7F3F0", alignItems: "center",
  },
  priceChipActive: { borderColor: "#D4A373", backgroundColor: "#FFF0E6" },
  priceChipText: { fontSize: moderateScale(14), fontWeight: "600", color: "#888" },
  priceChipTextActive: { color: "#D4A373" },
  chipsContainer: { flexDirection: "row", flexWrap: "wrap", gap: scale(8) },
  chip: { paddingHorizontal: scale(12), paddingVertical: scale(7), borderRadius: scale(20), borderWidth: 1, borderColor: "#CCC", backgroundColor: "#F7F3F0" },
  chipSelected: { borderColor: "#D4A373", backgroundColor: "#FFF0E6" },
  chipText: { fontSize: moderateScale(12), color: "#666" },
  chipTextSelected: { color: "#D4A373", fontWeight: "600" },
  dayRow: { paddingVertical: scale(12) },
  dayRowBorder: { borderBottomWidth: 1, borderBottomColor: "#F0EAE4" },
  dayHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dayName: { fontSize: moderateScale(14), fontWeight: "600", color: "#2C1810" },
  togglePill: { paddingHorizontal: scale(12), paddingVertical: scale(5), borderRadius: scale(20), borderWidth: 1, borderColor: "#CCC", backgroundColor: "#F5F5F5" },
  togglePillActive: { borderColor: "#D4A373", backgroundColor: "#FFF0E6" },
  togglePillText: { fontSize: moderateScale(12), color: "#888" },
  togglePillTextActive: { color: "#D4A373", fontWeight: "600" },
  timeRow: { flexDirection: "row", alignItems: "center", marginTop: scale(10), gap: scale(8) },
  timeField: { flex: 1 },
  timeLabel: { fontSize: moderateScale(11), color: "#999", marginBottom: scale(4) },
  timeInput: { borderWidth: 1, borderColor: "#DDD", borderRadius: scale(8), padding: scale(8), backgroundColor: "#FAFAFA", fontSize: moderateScale(13), textAlign: "center" },
  timeSep: { fontSize: moderateScale(16), color: "#CCC", marginTop: scale(16) },
  footer: { textAlign: "center", fontSize: moderateScale(12), color: "#888", marginTop: scale(24) },
  messageBox: {
    padding: scale(12),
    borderRadius: scale(10),
    marginBottom: scale(12),
    borderWidth: 1,
  },

  successBox: {
    backgroundColor: "#E8F5E9",
    borderColor: "#A5D6A7",
  },

  errorBox: {
    backgroundColor: "#FDECEA",
    borderColor: "#F5C6CB",
  },

  messageText: {
    fontSize: moderateScale(13),
    fontWeight: "500",
  },

  successText: {
    color: "#2E7D32",
  },

  errorText: {
    color: "#C62828",
  },
});
