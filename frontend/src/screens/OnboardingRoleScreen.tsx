import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { scale, moderateScale } from "../utils/responsive";

export default function OnboardingRoleScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>How will you use CafeHop?</Text>

        {/* Customer */}
        <Pressable
          style={styles.button}
          onPress={() => navigation.navigate("CustomerOnboarding")}
        >
          <Text style={styles.icon}>☕</Text>
          <Text style={styles.buttonText}>I’m a customer</Text>
        </Pressable>

        {/* Cafe Owner */}
        <Pressable
          style={styles.button}
          onPress={() => navigation.navigate("CafeOnboarding")}
        >
          <Text style={styles.icon}>🏪</Text>
          <Text style={styles.buttonText}>I own a café</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: scale(24),
    backgroundColor: "#F7F3F0",
  },

  card: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: "#FFF",
    padding: scale(24),
    borderRadius: scale(16),
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    gap: scale(16),
  },

  title: {
    fontSize: moderateScale(22),
    fontWeight: "bold",
    fontFamily: "PlayfairDisplay_700Bold",
    textAlign: "center",
    marginBottom: scale(12),
  },

  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(10),
    padding: scale(14),
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: scale(10),
    backgroundColor: "#FFF",
  },

  buttonText: {
    fontSize: moderateScale(16),
    fontWeight: "500",
  },

  icon: {
    fontSize: moderateScale(18),
  },
});