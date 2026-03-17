import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Animated,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  Bell,
  History,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Store,
  User,
  Coffee,
  BarChart2,
} from "lucide-react-native";
import Button from "../components/ui/Button";
import { useRole } from "../context/RoleContext";
import BottomNav from "../components/ui/BottomNav";

type MenuItem = {
  icon: React.ElementType;
  label: string;
  desc: string;
  route: string;
};

const SettingsScreen = () => {
  const navigation = useNavigation<any>();
  const { role } = useRole();

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
    { icon: History, label: "Visit History", desc: "Your past café visits", route: "History" },
    { icon: Settings, label: "Account Settings", desc: "App preferences", route: "Preferences" },
    { icon: HelpCircle, label: "Help & Support", desc: "FAQs & contact", route: "Help" },
  ];

  const cafeMenu: MenuItem[] = [
    { icon: Bell, label: "Live Visits", desc: "See who's checked in right now", route: "Notifications" },
    { icon: BarChart2, label: "Analytics", desc: "Sales, trends & peak hours", route: "Analytics" },
    { icon: Coffee, label: "Account Settings", desc: "App preferences", route: "Preferences" },
    { icon: HelpCircle, label: "Support", desc: "FAQs & contact", route: "Help" },
  ];

  const menuItems = role === "customer" ? customerMenu : cafeMenu;

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", onPress: () => {}, style: "cancel" },
      {
        text: "Sign Out",
        onPress: () => {
          navigation.reset({ index: 0, routes: [{ name: "Splash" }] });
        },
        style: "destructive",
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
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
            {role === "customer" ? "cafe.hopper@email.com" : "beanandbloom@cafehop.com"}
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
            <Button
              variant="outline"
              onPress={handleSignOut}
              style={styles.signOutButton}
            >
              <LogOut size={16} color="#D32F2F" style={{ marginRight: 8 }} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </Button>
          </View>

          {/* Footer */}
          <Text style={styles.footerText}>CafeHop v1.0.0 • Made with ☕</Text>
        </View>
      </Animated.ScrollView>

      {/* Bottom Nav */}
      <BottomNav />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F3F0",
  },
  scrollContent: {
    paddingTop: 40,
    paddingBottom: 100,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(212,163,115,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  title: { fontSize: 24, fontWeight: "bold", fontFamily: "PlayfairDisplay_700Bold", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#555", marginBottom: 8 },
  infoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  infoText: { fontSize: 14, color: "#333" },
  infoValue: { fontSize: 14, color: "#D4A373", fontWeight: "bold" },

  content: {
    alignSelf: "center",
    paddingHorizontal:4,
  },
  menuContainer: {
    marginTop: 24,
    marginBottom: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8DFD5",
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#E8DFD5",
  },
  menuIconBackground: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F7F3F0",
    justifyContent: "center",
    alignItems: "center",
  },
  menuTextContainer: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  menuDesc: {
    fontSize: 12,
    color: "#888",
  },
  signOutContainer: {
    marginBottom: 24,
  },
  signOutButton: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E8DFD5",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signOutText: {
    color: "#D32F2F",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 8,
  },
  footerText: {
    textAlign: "center",
    fontSize: 12,
    color: "#888",
    marginBottom: 80,
  },
});

export default SettingsScreen;