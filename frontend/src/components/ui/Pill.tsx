// components/ui/Pill.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { scale, moderateScale } from "../../utils/responsive";

interface PillProps {
  text: string;
  variant?: "default" | "caramel"; 
}

const Pill = ({ text, variant = "default" }: PillProps) => {
  return (
    <View
      style={[
        styles.pill,
        variant === "caramel" ? styles.caramel : styles.default,
      ]}
    >
      <Text style={[styles.text, variant === "caramel" && styles.caramelText]}>
        {text}
      </Text>
    </View>
  );
};

export default Pill;

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
    borderRadius: scale(12),
    marginRight: scale(6),
    marginBottom: scale(6),
  },
  text: { fontSize: moderateScale(12), color: "#555" },
  default: { backgroundColor: "#EEE" },
  caramel: { backgroundColor: "#C68D59" },
  caramelText: { color: "#FFF" },
});