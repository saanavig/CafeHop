import React from "react";
import { View, Text, StyleSheet } from "react-native";

type SplashTextProps = {
  title: string;
  subtitle: string;
};

export default function SplashText({ title, subtitle }: SplashTextProps) {
  return (
    <View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    color: "#555",
    marginBottom: 32,
  },
});