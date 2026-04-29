import {
  Alert,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  BarChart2,
  Bell,
  ChevronRight,
  Coffee,
  HelpCircle,
  History,
  LogOut,
  Settings,
  Store,
  User,
} from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import { moderateScale, scale } from "../utils/responsive";
import { SafeAreaView } from "react-native-safe-area-context";

import BottomNav from "../components/ui/BottomNav";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { useRole } from "../context/RoleContext";

type MenuItem = {
  icon: React.ElementType;
  label: string;
  desc: string;
  route: string;
};

const SettingsScreen = () => {
  const navigation = useNavigation<any>();
  const { role } = useRole();
  const { user, signOut } = useAuth();
  const { width } = Dimensions.get("window");
  const contentWidth = Math.min(width * 0.9, 480);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start();
  }, []);

  const customerMenu: MenuItem[] = [
    { icon: Bell, label: "Notifications", desc: "Manage alerts", route: "Notifications" },
    { icon: History, label: "Visit History", desc: "Your past cafe visits", route: "History" },
    { icon: Settings, label: "Account Settings", desc: "App preferences", route: "Preferences" },
    { icon: HelpCircle, label: "Help & Support", desc: "FAQs & contact", route: "Help" },
  ];

  const cafeMenu: MenuItem[] = [
    { icon: Store, label: "Cafe Profile", desc: "Edit your cafe details & hours", route: "CafeEdit" },
    { icon: Bell, label: "Live Visits", desc: "See who's checked in right now", route: "Notifications" },
    // { icon: BarChart2, label: "Analytics", desc: "Sales, trends & peak hours", route: "Analytics" },
    { icon: Coffee, label: "Account Settings", desc: "App preferences", route: "Preferences" },
    { icon: HelpCircle, label: "Support", desc: "FAQs & contact", route: "Help" },
  ];

  const menuItems = role === "customer" ? customerMenu : cafeMenu;

  const handleSignOut = async () => {
    console.log("SIGN OUT CLICKED");
    await signOut();
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <Animated.ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: scale(16) }]}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* Hero / Profile Section */}
        <View style={[styles.header, { width: contentWidth }]}>
          <View style={styles.avatarContainer}>
            {role === "customer" ? (
              <User size={36} color="#D4A373" />
            ) : (
              <Store size={36} color="#D4A373" />
            )}
          </View>
          <Text style={styles.title}>
            {role === "customer" ? "Welcome back!" : "Cafe Dashboard"}
          </Text>
          <Text style={styles.subtitle}>
            {user?.email ?? "No email"}
          </Text>
          <View style={styles.infoBadge}>
            {role === "customer" ? (
              <>
                <Coffee size={14} color="#D4A373" />
                <Text style={styles.infoText}>Explorer Status</Text>
                <Text style={styles.infoValue}>1,250 pts</Text>
              </>
            ) : (
              <>
                <Store size={14} color="#D4A373" />
                <Text style={styles.infoText}>Gold Partner</Text>
                <Text style={styles.infoValue}>5,420 visits</Text>
              </>
            )}
          </View>
        </View>

        {/* Menu Items */}
        <View style={[styles.content, { width: contentWidth }]}>
          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.menuItem,
                    index !== menuItems.length - 1 && styles.menuItemBorder,
                  ]}
                  onPress={() => navigation.navigate(item.route)}
                >
                  <View style={styles.menuIconBackground}>
                    <Icon size={20} color="#D4A373" />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <Text style={styles.menuDesc}>{item.desc}</Text>
                  </View>
                  <ChevronRight size={20} color="#CCC" />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Sign Out Button */}
          <View style={styles.signOutContainer}>
            {user ? (
              <Button
                variant="outline"
                onPress={handleSignOut}
                style={styles.signOutButton}
              >
                <LogOut size={16} color="#D32F2F" style={{ marginRight: 8 }} />
                <Text style={styles.signOutText}>Sign Out</Text>
              </Button>
            ) : (
              <Button
                variant="outline"
                onPress={() => navigation.navigate("Splash")}
                style={styles.signOutButton}
              >
                <User size={16} color="#D4A373" style={{ marginRight: 8 }} />
                <Text style={{ color: "#D4A373", fontWeight: "600" }}>
                  Sign Up/Login
                </Text>
              </Button>
            )}
          </View>
        </View>

      </Animated.ScrollView>

      {/* Bottom Nav */}
      <BottomNav />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F3F0",
  },
  scrollContent: {
    paddingBottom: scale(100),
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: scale(24),
  },
  avatarContainer: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    backgroundColor: "rgba(212,163,115,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: scale(12),
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: "bold",
    fontFamily: "PlayfairDisplay_700Bold",
    marginBottom: scale(4),
  },
  subtitle: {
    fontSize: moderateScale(14),
    color: "#555",
    marginBottom: scale(8),
  },
  infoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    backgroundColor: "#FFF",
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: "#DDD",
  },
  infoText: { fontSize: moderateScale(14), color: "#333" },
  infoValue: {
    fontSize: moderateScale(14),
    color: "#D4A373",
    fontWeight: "bold",
  },

  content: {
    alignSelf: "center",
    paddingHorizontal: scale(4),
  },
  menuContainer: {
    marginTop: scale(24),
    marginBottom: scale(24),
    backgroundColor: "#FFFFFF",
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: "#E8DFD5",
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(16),
    paddingVertical: scale(16),
    gap: scale(12),
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#E8DFD5",
  },
  menuIconBackground: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(10),
    backgroundColor: "#F7F3F0",
    justifyContent: "center",
    alignItems: "center",
  },
  menuTextContainer: {
    flex: 1,
  },
  menuLabel: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: scale(2),
  },
  menuDesc: {
    fontSize: moderateScale(12),
    color: "#888",
  },
  signOutContainer: {
    marginBottom: scale(24),
  },
  signOutButton: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E8DFD5",
    paddingVertical: scale(12),
    paddingHorizontal: scale(16),
    borderRadius: scale(12),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signOutText: {
    color: "#D32F2F",
    fontWeight: "600",
    fontSize: moderateScale(14),
    marginLeft: scale(8),
  },
  footerText: {
    textAlign: "center",
    fontSize: moderateScale(12),
    color: "#888",
    marginBottom: scale(80),
  },
});

export default SettingsScreen;