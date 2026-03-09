import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
  Switch,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ArrowLeft, Bell, Moon, Lock } from "lucide-react-native";
import BottomNav from "../components/ui/BottomNav";
import Button from "../components/ui/Button";

const PreferencesScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const role = route.params?.role ?? "customer";

  const { width } = Dimensions.get("window");
  const contentWidth = Math.min(width * 0.9, 480);

  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
  });

  const [privacy, setPrivacy] = useState({
    privateAccount: false,
    twoFactorAuth: false,
    emailNotifications: true,
  });

  const handleNotificationsToggle = () => {
    setSettings({ ...settings, notifications: !settings.notifications });
  };

  const handleDarkModeToggle = () => {
    setSettings({ ...settings, darkMode: !settings.darkMode });
  };

  const handlePrivacyToggle = (key: keyof typeof privacy) => {
    setPrivacy({ ...privacy, [key]: !privacy[key] });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { alignItems: "flex-start" }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color="#333" />
          </Pressable>
          <Text style={styles.headerTitle}>Preferences</Text>
        </View>

        {/* Content */}
        <View style={[styles.content, { width: contentWidth }]}>
          {/* General Preferences Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>General</Text>
            <View style={styles.settingsContainer}>
              {/* Notifications Toggle */}
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
                  value={settings.notifications}
                  onValueChange={handleNotificationsToggle}
                  trackColor={{ false: "#E8DFD5", true: "#D4A373" }}
                />
              </View>

              {/* Dark Mode Toggle */}
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
                  value={settings.darkMode}
                  onValueChange={handleDarkModeToggle}
                  trackColor={{ false: "#E8DFD5", true: "#D4A373" }}
                />
              </View>
            </View>
          </View>

          {/* Privacy & Security Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Privacy & Security</Text>
            <View style={styles.settingsContainer}>
              {/* Private Account */}
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
                  value={privacy.privateAccount}
                  onValueChange={() => handlePrivacyToggle("privateAccount")}
                  trackColor={{ false: "#E8DFD5", true: "#D4A373" }}
                />
              </View>

              {/* Two-Factor Auth */}
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
                  value={privacy.twoFactorAuth}
                  onValueChange={() => handlePrivacyToggle("twoFactorAuth")}
                  trackColor={{ false: "#E8DFD5", true: "#D4A373" }}
                />
              </View>

              {/* Email Notifications */}
              <View style={styles.settingRow}>
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
                  value={privacy.emailNotifications}
                  onValueChange={() => handlePrivacyToggle("emailNotifications")}
                  trackColor={{ false: "#E8DFD5", true: "#D4A373" }}
                />
              </View>
            </View>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>CafeHop v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Bottom Nav */}
      <BottomNav role={role} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F3F0",
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    fontFamily: "PlayfairDisplay_700Bold",
    marginLeft: 8,
    color: "#1A1A1A",
  },
  content: {
    alignSelf: "center",
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  settingsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8DFD5",
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E8DFD5",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F7F3F0",
    justifyContent: "center",
    alignItems: "center",
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: 12,
    color: "#888",
  },
  footer: {
    textAlign: "center",
    fontSize: 12,
    color: "#888",
    marginTop: 24,
  },
});

export default PreferencesScreen;
