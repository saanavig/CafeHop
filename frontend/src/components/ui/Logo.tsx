import React from "react";
import { View, StyleSheet } from "react-native";
import { Coffee } from "lucide-react-native";

export default function Logo() {
  return (
    <View style={styles.logoContainer}>
      <Coffee color="#D4A373" size={40} />
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: "rgba(212, 163, 115, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
});