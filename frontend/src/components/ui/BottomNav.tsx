import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { BarChart2, Compass, Gift, Home, Settings, User } from "lucide-react-native";
import React, { useRef } from "react";
import { moderateScale, scale } from "../../utils/responsive";
import { useNavigation, useRoute } from "@react-navigation/native";

import { useRole } from "../../context/RoleContext";

interface NavItem {
  icon: React.ElementType;
  label: string;
  route: string;
}

const customerNavItems: NavItem[] = [
  { icon: Home, label: "Home", route: "Home" },
  { icon: Compass, label: "Explore", route: "Explore" },
  { icon: Gift, label: "Rewards", route: "Rewards" },
  { icon: User, label: "Profile", route: "UserProfile" },
  { icon: Settings, label: "Settings", route: "Settings" },
];

const cafeNavItems: NavItem[] = [
  { icon: Home, label: "Home", route: "Home" },
  { icon: Compass, label: "Explore", route: "Explore" },
  { icon: BarChart2, label: "Analytics", route: "Analytics" },
  { icon: Gift, label: "Rewards", route: "Rewards" },
  // { icon: User, label: "Profile", route: "Profile" },
  { icon: User, label: "Profile", route: "CafeProfile" },
  { icon: Settings, label: "Settings", route: "Settings" },
];

const BottomNav: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  // const { role, toggleRole } = useRole();
  const { role } = useRole();

  const navItems = role === "cafe" ? cafeNavItems : customerNavItems;

  // Animated scale for the active toggle pill
  // const pillScale = useRef(new Animated.Value(1)).current;

  // const handleToggle = () => {
  //   // Spring bounce on the pill
  //   Animated.sequence([
  //     Animated.timing(pillScale, { toValue: 0.92, duration: 80, useNativeDriver: true }),
  //     Animated.spring(pillScale, { toValue: 1, useNativeDriver: true, friction: 5 }),
  //   ]).start();

  //   toggleRole();
  //   const newRole = role === "customer" ? "cafe" : "customer";
  //   if (route.name === "Explore" && newRole === "cafe") {
  //     navigation.navigate("Analytics");
  //   } else if (route.name === "Analytics" && newRole === "customer") {
  //     navigation.navigate("Explore");
  //   }
  // };

  return (
    <View style={styles.container}>
      {/* Role Toggle */}
      {/* <Animated.View style={[styles.toggleRow, { transform: [{ scale: pillScale }] }]}>
        <Pressable
          style={[styles.togglePill, role === "customer" && styles.togglePillActive]}
          onPress={() => role !== "customer" && handleToggle()}
        >
          <Text style={styles.toggleIcon}>☕</Text>
          <Text style={[styles.toggleLabel, role === "customer" && styles.toggleLabelActive]}>
            Customer
          </Text>
        </Pressable>
        <Pressable
          style={[styles.togglePill, role === "cafe" && styles.togglePillActive]}
          onPress={() => role !== "cafe" && handleToggle()}
        >
          <Text style={styles.toggleIcon}>🏪</Text>
          <Text style={[styles.toggleLabel, role === "cafe" && styles.toggleLabelActive]}>
            Cafe Owner
          </Text>
        </Pressable>
      </Animated.View> */}

      {/* Nav Items */}
      <View style={styles.navWrapper}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = route.name === item.route;

          return (
            <Pressable
              key={item.label}
              style={[styles.navItem, isActive && styles.activeNavItem]}
              onPress={() => navigation.navigate(item.route)}
            >
              <Icon
                size={20}
                color={isActive ? "#FFF" : "#888"}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <Text style={[styles.navLabel, isActive && styles.activeNavLabel]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export default BottomNav;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E8DFD5",
    paddingBottom: scale(16),
    alignItems: "center",
  },
  toggleRow: {
    flexDirection: "row",
    gap: scale(8),
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    width: "90%",
    maxWidth: 480,
  },
  togglePill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(6),
    paddingVertical: scale(6),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: "#E8DFD5",
    backgroundColor: "#F7F3F0",
  },
  togglePillActive: {
    backgroundColor: "#D4A373",
    borderColor: "#D4A373",
  },
  toggleIcon: { fontSize: moderateScale(14) },
  toggleLabel: { fontSize: moderateScale(12), fontWeight: "600", color: "#888" },
  toggleLabelActive: { color: "#FFF" },

  navWrapper: {
    width: "90%",
    maxWidth: 480,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  navItem: {
    alignItems: "center",
    paddingVertical: scale(8),
    paddingHorizontal: scale(12),
    borderRadius: scale(16),
    gap: scale(4),
  },
  activeNavItem: {
    backgroundColor: "#D4A373",
  },
  navLabel: {
    fontSize: moderateScale(11),
    color: "#888",
    marginTop: scale(2),
    fontWeight: "500",
  },
  activeNavLabel: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
