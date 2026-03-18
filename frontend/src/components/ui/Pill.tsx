// components/ui/Pill.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface PillProps {
  text: string;
  variant?: "default" | "caramel"; // optional styling
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  text: { fontSize: 12, color: "#555" },
  default: { backgroundColor: "#EEE" },
  caramel: { backgroundColor: "#C68D59" },
  caramelText: { color: "#FFF" },
});