// frontend/src/screens/LoginScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import Button from "../components/ui/Button";

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <LinearGradient
      colors={["#F7F3F0", "#F0EDE8"]}
      style={styles.gradient}
    >
      <View style={styles.container}>
        <View style={styles.card}>
          {/* Header */}
          <Text style={styles.title}>Welcome back ☕</Text>
          <Text style={styles.subtitle}>Log in to continue exploring cafés</Text>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, { color: "#333" }]}
              value={email}
              onChangeText={setEmail}
              placeholder="you@email.com"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>

            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput, { color: "#333" }]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
              />

              <Pressable
                onPress={() => setShowPassword(prev => !prev)}
                style={styles.eyeButton}
              >
                <Text style={{ color: "#D4A373", fontWeight: "500" }}>
                  {showPassword ? "Hide" : "Show"}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Forgot password */}
          <Pressable onPress={() => alert("Password reset link sent! (demo)")}>
            <Text style={styles.linkText}>Forgot password?</Text>
          </Pressable>

          {/* Login button */}
          <Button title="Log In" onPress={() => navigation.navigate("Home", { role: "customer" })} />

          {/* Sign up link */}
          <Text style={styles.signUpText}>
            Don’t have an account?{" "}
            <Text
              style={styles.linkText}
              onPress={() => navigation.navigate("SignUp")}
            >
              Sign up
            </Text>
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { 
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  card: {
    width: "100%",
    maxWidth: 480,
    padding: 24,
    borderRadius: 16,
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    fontFamily: "PlayfairDisplay_700Bold",
    marginBottom: 8,
    textAlign: "center",
    color: "#1A1A1A",
  },

  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
  },

  inputContainer: {
    marginBottom: 16,
  },

  label: {
    fontWeight: "500",
    marginBottom: 4,
    color: "#333",
  },

  input: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#FFF",
  },

  passwordContainer: {
    position: "relative",
  },

  passwordInput: {
    paddingRight: 60,
  },

  eyeButton: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -10 }],
  },

  linkText: {
    color: "#D4A373",
    textAlign: "right",
    marginBottom: 16,
  },

  signUpText: {
    textAlign: "center",
    marginTop: 12,
    color: "#666",
  },
});