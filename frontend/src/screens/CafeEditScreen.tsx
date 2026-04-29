import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { moderateScale, scale } from "../utils/responsive";

import { ArrowLeft } from "lucide-react-native";
import BottomNav from "../components/ui/BottomNav";
import Button from "../components/ui/Button";
import { supabase } from "../api/supabaseClient";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const ATTRIBUTE_OPTIONS = [
  "WiFi", "Outdoor Seating", "Pet Friendly", "Study Friendly",
  "Vegan Options", "Matcha", "Cold Brew", "Live Music",
  "Takeaway", "Accepts Cards", "Dog Friendly", "Cozy Vibes",
];

type DayHours = { open: boolean; start: string; end: string };

const defaultHours: Record<string, DayHours> = Object.fromEntries(
  DAYS.map((d) => [d, { open: true, start: "09:00", end: "21:00" }])
);

export default function CafeEditScreen() {
  const navigation = useNavigation<any>();
  const { width } = Dimensions.get("window");
  const contentWidth = Math.min(width * 0.9, 480);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cafeId, setCafeId] = useState<string | null>(null);

  const [cafeName, setCafeName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");

  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");

  const [attributes, setAttributes] = useState<string[]>([]);
  const [hours, setHours] = useState<Record<string, DayHours>>(defaultHours);
  const [priceLevel, setPriceLevel] = useState<number | null>(null);

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
        setPriceLevel(data.price_level ?? null);

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
          const DAY_MAP = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
          const loadedHours: Record<string, DayHours> = { ...defaultHours };
          hoursData.forEach((row: any) => {
            const dayName = DAY_MAP[row.day_of_week];
            if (dayName) {
              loadedHours[dayName] = {
                open: true,
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

  const toggleAttribute = (attr: string) => {
    setAttributes((prev) =>
      prev.includes(attr) ? prev.filter((a) => a !== attr) : [...prev, attr]
    );
  };

  const updateHours = (day: string, field: keyof DayHours, value: boolean | string) => {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const handleSave = async () => {
    if (!cafeId) {
      Alert.alert("Error", "Cafe not found.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
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
        .eq("id", cafeId);

      if (error) {
        console.error("Save error:", error);
        Alert.alert("Error", "Failed to save changes.");
        return;
      }

      Alert.alert("Saved", "Your cafe profile has been updated.");
    } catch (err) {
      console.error("Save crash:", err);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F7F3F0" }}>
        <ActivityIndicator size="small" color="#D4A373" />
      </View>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color="#333" />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Cafe Profile</Text>
        </View>

        <View style={[styles.content, { width: contentWidth }]}>

          {/* Basic Info */}
          <Text style={styles.sectionLabel}>Basic Information</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Cafe Name</Text>
            <TextInput style={styles.input} value={cafeName} onChangeText={setCafeName} placeholder="Cafe name" />
            <Text style={styles.fieldLabel}>Address</Text>
            <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Street address" />
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="What makes your cafe special?"
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Contact & Social */}
          <Text style={styles.sectionLabel}>Contact & Social</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Contact Email</Text>
            <TextInput style={styles.input} value={contactEmail} onChangeText={setContactEmail} keyboardType="email-address" autoCapitalize="none" placeholder="hello@yourcafe.com" />
            <Text style={styles.fieldLabel}>Contact Phone</Text>
            <TextInput style={styles.input} value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" placeholder="+1 (555) 000-0000" />
            <Text style={styles.fieldLabel}>Website</Text>
            <TextInput style={styles.input} value={websiteUrl} onChangeText={setWebsiteUrl} autoCapitalize="none" keyboardType="url" placeholder="www.yourcafe.com" />
            <Text style={styles.fieldLabel}>Instagram</Text>
            <TextInput style={styles.input} value={instagramUrl} onChangeText={setInstagramUrl} autoCapitalize="none" placeholder="@yourcafe" />
            <Text style={styles.fieldLabel}>Facebook</Text>
            <TextInput style={styles.input} value={facebookUrl} onChangeText={setFacebookUrl} autoCapitalize="none" placeholder="facebook.com/yourcafe" />
          </View>

          {/* Price Level */}
          <Text style={styles.sectionLabel}>Price Range</Text>
          <View style={styles.card}>
            <View style={{ flexDirection: "row", gap: scale(8) }}>
              {[["$", 1], ["$$", 2], ["$$$", 3], ["$$$$", 4]].map(([label, val]) => (
                <Pressable
                  key={val}
                  onPress={() => setPriceLevel(val as number)}
                  style={[
                    styles.priceChip,
                    priceLevel === val && styles.priceChipActive,
                  ]}
                >
                  <Text style={[styles.priceChipText, priceLevel === val && styles.priceChipTextActive]}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Amenities */}
          <Text style={styles.sectionLabel}>Amenities</Text>
          <View style={styles.card}>
            <View style={styles.chipsContainer}>
              {ATTRIBUTE_OPTIONS.map((attr) => {
                const selected = attributes.includes(attr);
                return (
                  <Pressable
                    key={attr}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => toggleAttribute(attr)}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{attr}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Operating Hours */}
          <Text style={styles.sectionLabel}>Operating Hours</Text>
          <View style={styles.card}>
            {DAYS.map((day, idx) => (
              <View key={day} style={[styles.dayRow, idx < DAYS.length - 1 && styles.dayRowBorder]}>
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
                      <TextInput style={styles.timeInput} value={hours[day].start} onChangeText={(v) => updateHours(day, "start", v)} placeholder="09:00" />
                    </View>
                    <Text style={styles.timeSep}>—</Text>
                    <View style={styles.timeField}>
                      <Text style={styles.timeLabel}>Closes</Text>
                      <TextInput style={styles.timeInput} value={hours[day].end} onChangeText={(v) => updateHours(day, "end", v)} placeholder="21:00" />
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>

          <Button
            title={saving ? "Saving..." : "Save Changes"}
            variant="caramel"
            onPress={handleSave}
            disabled={saving}
          />
          <Text style={styles.footer}>CafeHop v1.0.0</Text>
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
});
