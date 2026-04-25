import React from "react";
import { View, StyleSheet } from "react-native";
import { Coffee } from "lucide-react-native";
import { scale, verticalScale } from "../../utils/responsive";

export default function Logo() {
  return (
    <View style={styles.logoContainer}>
      <Coffee color="#D4A373" size={scale(40)} />
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(16),
    backgroundColor: "rgba(212, 163, 115, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: verticalScale(24),
  },
});