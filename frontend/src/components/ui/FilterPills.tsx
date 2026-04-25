import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { scale, moderateScale, verticalScale } from "../../utils/responsive";

interface Filter {
  icon: string; 
  label: string;
  id: string;
}

const filters: Filter[] = [
  { icon: "wifi", label: "Free Wi-Fi", id: "wifi" },
  { icon: "volume-up", label: "Quiet", id: "quiet" },
  { icon: "plug", label: "Outlets", id: "outlets" },
  { icon: "dollar-sign", label: "Budget", id: "budget" },
  { icon: "clock", label: "Open Now", id: "open" },
  { icon: "coffee", label: "Great Coffee", id: "coffee" },
];

const FilterPills = () => {
  const [activeFilters, setActiveFilters] = useState<string[]>(["open"]);

  const toggleFilter = (id: string) => {
    setActiveFilters(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {filters.map((filter) => {
        const active = activeFilters.includes(filter.id);
        return (
          <Pressable
            key={filter.id}
            style={[styles.pill, active ? styles.activePill : styles.inactivePill]}
            onPress={() => toggleFilter(filter.id)}
          >
            <FontAwesome5
              name={filter.icon}
              size={scale(14)}
              color={active ? "#FFF" : "#555"}
              style={{ marginRight: scale(6) }}
            />
            <Text style={[styles.pillText, active ? styles.activeText : styles.inactiveText]}>
              {filter.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    gap: scale(8),
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: scale(20),
    borderWidth: 1,
  },
  activePill: {
    backgroundColor: "#C17A54",
    borderColor: "#C17A54",
  },
  inactivePill: {
    backgroundColor: "#F0F0F0",
    borderColor: "#CCC",
  },
  pillText: {
    fontSize: moderateScale(12),
    fontWeight: "500",
  },
  activeText: {
    color: "#FFF",
  },
  inactiveText: {
    color: "#555",
  },
});

export default FilterPills;