import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";

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
    alignItems: "center", // centers horizontally
    padding: 24,
    backgroundColor: "#F7F3F0",
  },

  card: {
    width: "100%",       // takes full width of container
    maxWidth: 480,       // same width constraint as login/signup
    backgroundColor: "#FFF",
    padding: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    gap: 16,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    fontFamily: "PlayfairDisplay_700Bold",
    textAlign: "center",
    marginBottom: 12,
  },

  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    backgroundColor: "#FFF",
  },

  buttonText: {
    fontSize: 16,
    fontWeight: "500",
  },

  icon: {
    fontSize: 18,
  },
});