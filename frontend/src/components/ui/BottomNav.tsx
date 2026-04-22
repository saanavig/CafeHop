import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { BarChart2, Compass, Gift, Home, Settings, User } from "lucide-react-native";
import React, { useRef } from "react";
import { moderateScale, scale } from "../../utils/responsive";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useRole } from "../../context/RoleContext";

interface NavItem {
  icon: React.ElementType;
  label: string;
  route: string;
}

const customerNavItems: NavItem[] = [
  { icon: Home,     label: "Home",    route: "Home"        },
  { icon: Compass,  label: "Explore", route: "Explore"     },
  { icon: Gift,     label: "Rewards", route: "Rewards"     },
  { icon: User,     label: "Profile", route: "UserProfile" },
  { icon: Settings, label: "More",    route: "Settings"    },
];

const cafeNavItems: NavItem[] = [
  { icon: Home,       label: "Home",      route: "Home"        },
  { icon: Compass,    label: "Explore",   route: "Explore"     },
  { icon: BarChart2,  label: "Analytics", route: "Analytics"   },
  { icon: Gift,       label: "Rewards",   route: "Rewards"     },
  { icon: User,       label: "Profile",   route: "CafeProfile" },
  { icon: Settings,   label: "More",      route: "Settings"    },
];

const BottomNav: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { role } = useRole();
  const insets = useSafeAreaInsets();

  const navItems = role === "cafe" ? cafeNavItems : customerNavItems;

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, scale(8)) }]}>
      <View style={styles.pill}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = route.name === item.route;

          return (
            <Pressable
              key={item.label}
              style={styles.navItem}
              onPress={() => navigation.navigate(item.route)}
            >
              <Icon
                size={scale(21)}
                color={isActive ? "#D4A373" : "#B0A89E"}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <Text style={[styles.navLabel, isActive && styles.activeNavLabel]}>
                {item.label}
              </Text>
              {isActive && <View style={styles.activeDot} />}
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
    paddingHorizontal: scale(16),
    paddingTop: scale(6),
    backgroundColor: "transparent",
    alignItems: "center",
  },
  pill: {
    width: "100%",
    maxWidth: 480,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: scale(26),
    paddingVertical: scale(10),
    paddingHorizontal: scale(6),
    shadowColor: "#2C1810",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 10,
  },
  navItem: {
    alignItems: "center",
    paddingHorizontal: scale(10),
    paddingVertical: scale(2),
    gap: scale(3),
    minWidth: scale(40),
  },
  navLabel: {
    fontSize: moderateScale(10),
    color: "#B0A89E",
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  activeNavLabel: {
    color: "#D4A373",
    fontWeight: "700",
  },
  activeDot: {
    width: scale(4),
    height: scale(4),
    borderRadius: scale(2),
    backgroundColor: "#D4A373",
    marginTop: scale(1),
  },
});
