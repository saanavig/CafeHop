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
import React, { useEffect, useState } from "react";
import { moderateScale, scale, verticalScale } from "../utils/responsive";

import { ArrowLeft } from "lucide-react-native";
import BottomNav from "../components/ui/BottomNav";
import Button from "../components/ui/Button";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../api/supabaseClient";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";

export default function EditCustomerProfileScreen() {
  const navigation = useNavigation<any>();
  const { colors: themeColors } = useTheme();
  const { width } = Dimensions.get("window");
  const contentWidth = Math.min(width * 0.9, 480);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [errors, setErrors] = useState({ firstName: false, lastName: false });
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Load profile error:", error);
      } else if (data) {
        setFirstName(data.first_name || "");
        setLastName(data.last_name || "");
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    const fnEmpty = !firstName.trim();
    const lnEmpty = !lastName.trim();
    if (fnEmpty || lnEmpty) {
      setErrors({ firstName: fnEmpty, lastName: lnEmpty });
      return;
    }
    setErrors({ firstName: false, lastName: false });
    setSaving(true);

    const { error: authError } = await supabase.auth.updateUser({
      data: { first_name: firstName.trim(), last_name: lastName.trim() },
    });
    if (authError) {
      setSaving(false);
      setMessage("Could not save. Please try again.");
      setMessageType("error");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      full_name: `${firstName.trim()} ${lastName.trim()}`,
    });

    setSaving(false);
    if (profileError) {
      setMessage("Could not save. Please try again.");
      setMessageType("error");
    } else {
      setMessage("Profile updated.");
      setMessageType("success");
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.bg, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="small" color="#D4A373" />
      </View>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: themeColors.bg }]}> 
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowLeft size={24} color={themeColors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Edit Profile</Text>
        </View>

        <View style={[styles.content, { width: contentWidth }]}> 
          <Text style={[styles.fieldLabel, { color: themeColors.textMuted }]}>First Name</Text>
          <TextInput
            placeholder="First name"
            value={firstName}
            onChangeText={(t) => { setFirstName(t); if (errors.firstName) setErrors((p) => ({ ...p, firstName: false })); }}
            style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }, errors.firstName && { borderColor: "#D9534F" }]}
          />

          <Text style={[styles.fieldLabel, { color: themeColors.textMuted }]}>Last Name</Text>
          <TextInput
            placeholder="Last name"
            value={lastName}
            onChangeText={(t) => { setLastName(t); if (errors.lastName) setErrors((p) => ({ ...p, lastName: false })); }}
            style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }, errors.lastName && { borderColor: "#D9534F" }]}
          />

          {(errors.firstName || errors.lastName) && (
            <Text style={styles.errorText}>Please fill out both fields</Text>
          )}

          {message && (
            <Text style={[styles.message, messageType === "success" ? styles.messageSuccess : styles.messageError, { color: messageType === "success" ? "#2E7D32" : "#D9534F" }]}>
              {message}
            </Text>
          )}

          <Button
            title={saving ? "Saving..." : "Save Changes"}
            variant="caramel"
            onPress={handleSave}
            disabled={saving}
            style={{ marginTop: verticalScale(12) }}
          />
        </View>
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F3F0" },
  scrollContent: { paddingBottom: scale(100) },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(16),
    paddingTop: scale(8),
    marginBottom: scale(16),
  },
  backButton: { padding: scale(8), marginRight: scale(12) },
  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: "600",
    fontFamily: "PlayfairDisplay_700Bold",
    marginLeft: scale(8),
    color: "#1A1A1A",
  },
  content: { alignSelf: "center", paddingHorizontal: scale(16) },
  fieldLabel: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: "#555",
    marginBottom: verticalScale(4),
    marginTop: verticalScale(8),
  },
  input: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: scale(8),
    padding: scale(12),
    marginBottom: verticalScale(8),
    backgroundColor: "#FFF",
    fontSize: moderateScale(15),
  },
  errorText: { color: "#D9534F", fontSize: moderateScale(13), marginTop: verticalScale(4) },
  message: {
    fontSize: moderateScale(13),
    marginTop: verticalScale(12),
    textAlign: "center",
  },
  messageSuccess: { color: "#2E7D32" },
  messageError: { color: "#D9534F" },
});
