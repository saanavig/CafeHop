import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
// frontend/src/screens/LoginScreen.tsx
import React, { useState } from "react";
import { moderateScale, scale } from "../utils/responsive";

import Button from "../components/ui/Button";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../api/supabaseClient";
import { useNavigation } from "@react-navigation/native";

export default function LoginScreen() {
  const navigation = useNavigation<any>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setLoginError("Please fill in all fields");
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        let message = "Something went wrong";

        if (error.message.toLowerCase().includes("invalid login")) {
          message = "Incorrect email or password";
        } else if (error.message.toLowerCase().includes("email not confirmed")) {
          message = "Please verify your email before logging in";
        }

        setLoginError(message);
        return;
      }

      console.log("Login success:", data);

      // ✅ Clear error
      setLoginError("");

      // TODO: later replace with role-based routing
      navigation.navigate("Home", { role: "customer" });

    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong");
    }
  };

  return (
    <LinearGradient colors={["#F7F3F0", "#F0EDE8"]} style={styles.gradient}>
      <View style={styles.container}>
        <View style={styles.card}>
          {/* Header */}
          <Text style={styles.title}>Welcome back ☕</Text>
          <Text style={styles.subtitle}>
            Log in to continue exploring cafes
          </Text>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, { color: "#333" }]}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setLoginError(""); // clear error while typing
              }}
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
                onChangeText={(text) => {
                  setPassword(text);
                  setLoginError(""); 
                }}
                placeholder="••••••••"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
              />

              <Pressable
                onPress={() => setShowPassword((prev) => !prev)}
                style={styles.eyeButton}
              >
                <Text style={{ color: "#D4A373", fontWeight: "500" }}>
                  {showPassword ? "Hide" : "Show"}
                </Text>
              </Pressable>
            </View>

            {loginError ? (
              <Text style={styles.errorText}>{loginError}</Text>
            ) : null}
          </View>

          <Pressable
            onPress={() => alert("Password reset link sent! (demo)")}
          >
            <Text style={styles.linkText}>Forgot password?</Text>
          </Pressable>

          <Button title="Log In" onPress={handleLogin} />

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
    padding: scale(24),
  },

  card: {
    width: "100%",
    maxWidth: 480,
    padding: scale(24),
    borderRadius: scale(16),
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },

  title: {
    fontSize: moderateScale(28),
    fontWeight: "bold",
    fontFamily: "PlayfairDisplay_700Bold",
    marginBottom: scale(8),
    textAlign: "center",
    color: "#1A1A1A",
  },

  subtitle: {
    fontSize: moderateScale(14),
    color: "#666",
    marginBottom: scale(24),
    textAlign: "center",
  },

  inputContainer: {
    marginBottom: scale(16),
  },

  label: {
    fontWeight: "500",
    marginBottom: scale(4),
    color: "#333",
  },

  input: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: scale(8),
    padding: scale(12),
    backgroundColor: "#FFF",
  },

  passwordContainer: {
    position: "relative",
  },

  passwordInput: {
    paddingRight: scale(60),
  },

  eyeButton: {
    position: "absolute",
    right: scale(12),
    top: "50%",
    transform: [{ translateY: -10 }],
  },

  linkText: {
    color: "#D4A373",
    textAlign: "right",
    marginBottom: scale(16),
  },

  signUpText: {
    textAlign: "center",
    marginTop: scale(12),
    color: "#666",
  },

  errorText: {
    color: "#d9534f",
    fontSize: moderateScale(12),
    marginTop: scale(4),
  },
});