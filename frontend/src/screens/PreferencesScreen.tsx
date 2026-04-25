import React, { useCallback, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { ArrowLeft, Bell, Lock, Moon, Wifi } from "lucide-react-native";
import { moderateScale, scale } from "../utils/responsive";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";

import BottomNav from "../components/ui/BottomNav";
import { supabase } from "../api/supabaseClient";

const PreferencesScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const role = route.params?.role ?? "customer";

  const { width } = Dimensions.get("window");
  const contentWidth = Math.min(width * 0.9, 480);

  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [wantsWifi, setWantsWifi] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const loadPrefs = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from("user_preferences")
          .select("wants_wifi")
          .eq("user_id", user.id)
          .maybeSingle();
        if (data) {
          setWantsWifi(data.wants_wifi ?? false);
        }
      };
      loadPrefs();
    }, [])
  );

  const persistPref = async (key: string, value: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("user_preferences")
      .upsert({ user_id: user.id, [key]: value }, { onConflict: "user_id" });
  };

  const handleWifiToggle = (val: boolean) => {
    setWantsWifi(val);
    persistPref("wants_wifi", val);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { alignItems: "flex-start" }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color="#333" />
          </Pressable>
          <Text style={styles.headerTitle}>Preferences</Text>
        </View>

        <View style={[styles.content, { width: contentWidth }]}>

          {/* General Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>General</Text>
            <View style={styles.settingsContainer}>
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <View style={styles.iconBg}>
                    <Bell size={18} color="#D4A373" />
                  </View>
                  <View>
                    <Text style={styles.settingTitle}>Notifications</Text>
                    <Text style={styles.settingDesc}>Rewards, visits, and updates</Text>
                  </View>
                </View>
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: "#E8DFD5", true: "#D4A373" }}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <View style={styles.iconBg}>
                    <Moon size={18} color="#D4A373" />
                  </View>
                  <View>
                    <Text style={styles.settingTitle}>Dark Mode</Text>
                    <Text style={styles.settingDesc}>System appearance</Text>
                  </View>
                </View>
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: "#E8DFD5", true: "#D4A373" }}
                />
              </View>
            </View>
          </View>

          {/* Cafe Preferences Section (customer only) */}
          {role === "customer" && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Cafe Preferences</Text>
              <View style={styles.settingsContainer}>
                <View style={styles.settingRow}>
                  <View style={styles.settingLeft}>
                    <View style={styles.iconBg}>
                      <Wifi size={18} color="#D4A373" />
                    </View>
                    <View>
                      <Text style={styles.settingTitle}>Wi-Fi Required</Text>
                      <Text style={styles.settingDesc}>Only show cafes with Wi-Fi</Text>
                    </View>
                  </View>
                  <Switch
                    value={wantsWifi}
                    onValueChange={handleWifiToggle}
                    trackColor={{ false: "#E8DFD5", true: "#D4A373" }}
                  />
                </View>
              </View>
            </View>
          )}

          {/* Privacy & Security Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Privacy & Security</Text>
            <View style={styles.settingsContainer}>
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <View style={styles.iconBg}>
                    <Lock size={18} color="#D4A373" />
                  </View>
                  <View>
                    <Text style={styles.settingTitle}>Private Account</Text>
                    <Text style={styles.settingDesc}>Control profile visibility</Text>
                  </View>
                </View>
                <Switch
                  value={privateAccount}
                  onValueChange={setPrivateAccount}
                  trackColor={{ false: "#E8DFD5", true: "#D4A373" }}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <View style={styles.iconBg}>
                    <Lock size={18} color="#D4A373" />
                  </View>
                  <View>
                    <Text style={styles.settingTitle}>Two-Factor Authentication</Text>
                    <Text style={styles.settingDesc}>Enhanced security</Text>
                  </View>
                </View>
                <Switch
                  value={twoFactorAuth}
                  onValueChange={setTwoFactorAuth}
                  trackColor={{ false: "#E8DFD5", true: "#D4A373" }}
                />
              </View>

              <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
                <View style={styles.settingLeft}>
                  <View style={styles.iconBg}>
                    <Bell size={18} color="#D4A373" />
                  </View>
                  <View>
                    <Text style={styles.settingTitle}>Email Notifications</Text>
                    <Text style={styles.settingDesc}>Stay updated via email</Text>
                  </View>
                </View>
                <Switch
                  value={emailNotifications}
                  onValueChange={setEmailNotifications}
                  trackColor={{ false: "#E8DFD5", true: "#D4A373" }}
                />
              </View>
            </View>
          </View>

          <Text style={styles.footer}>CafeHop v1.0.0</Text>
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F3F0" },
  scrollContent: { paddingTop: scale(16), paddingBottom: scale(100), alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(16),
    marginBottom: scale(24),
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
  section: { marginBottom: scale(24) },
  sectionLabel: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
    marginBottom: scale(12),
    letterSpacing: 0.5,
  },
  settingsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: "#E8DFD5",
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingVertical: scale(14),
    borderBottomWidth: 1,
    borderBottomColor: "#E8DFD5",
  },
  settingLeft: { flexDirection: "row", alignItems: "center", gap: scale(12), flex: 1 },
  iconBg: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(10),
    backgroundColor: "#F7F3F0",
    justifyContent: "center",
    alignItems: "center",
  },
  settingTitle: { fontSize: moderateScale(14), fontWeight: "600", color: "#1A1A1A", marginBottom: scale(2) },
  settingDesc: { fontSize: moderateScale(12), color: "#888" },
  footer: { textAlign: "center", fontSize: moderateScale(12), color: "#888", marginTop: scale(24) },
});

export default PreferencesScreen;
