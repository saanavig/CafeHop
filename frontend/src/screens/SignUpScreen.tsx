import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import React, { useState } from "react";

import Button from "../components/ui/Button";
import { apiFetch } from "../api/client";
import { supabase } from "../api/supabaseClient";
import { useNavigation } from "@react-navigation/native";
import { scale, moderateScale } from "../utils/responsive";

export default function SignUpScreen() {
  const navigation = useNavigation<any>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordError, setPasswordError] = useState("");

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      minLength,
      hasNumber,
      hasSymbol,
      valid: minLength && hasNumber && hasSymbol,
    };
  };

  const handleContinue = async () => {
    const validation = validatePassword(password);

    if (!validation.valid) {
      setPasswordError(
        "Password must be at least 8 characters and include a number and symbol."
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match!");
      return;
    }

    setPasswordError("");
    navigation.navigate("Onboarding");

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        Alert.alert("Signup Error", error.message);
        return;
      }

      console.log("Signup success:", data);

      if (data.session) {
        await apiFetch("/users/me", {
          method: "POST",
        });
      }

      navigation.navigate("Onboarding");

    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Sign up to get started</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <Pressable
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.eyeText}>
                {showPassword ? "Hide" : "Show"}
              </Text>
            </Pressable>
          </View>
          {passwordError ? (
            <Text style={styles.errorText}>{passwordError}</Text>
          ) : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
            />
            <Pressable
              style={styles.eyeButton}
              onPress={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
            >
              <Text style={styles.eyeText}>
                {showConfirmPassword ? "Hide" : "Show"}
              </Text>
            </Pressable>
          </View>
        </View>

        <Button title="Continue" onPress={handleContinue} />

        <Text style={styles.loginText}>
          Already have an account?{" "}
          <Text
            style={styles.linkText}
            onPress={() => navigation.navigate("Login")}
          >
            Log in
          </Text>
        </Text>
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
    padding: scale(24),
    borderRadius: scale(16),
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },

  title: {
    fontSize: moderateScale(28),
    fontWeight: "bold",
    fontFamily: "PlayfairDisplay_700Bold",
    marginBottom: scale(8),
    textAlign: "center",
  },

  subtitle: {
    fontSize: moderateScale(14),
    color: "#555",
    marginBottom: scale(24),
    textAlign: "center",
  },

  inputContainer: {
    marginBottom: scale(16),
  },

  label: {
    fontWeight: "500",
    marginBottom: scale(4),
  },

  input: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: scale(8),
    padding: scale(12),
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

  eyeText: {
    color: "#D4A373",
    fontWeight: "500",
  },

  errorText: {
    color: "#d9534f",
    fontSize: moderateScale(12),
    marginTop: scale(4),
  },

  loginText: {
    textAlign: "center",
    marginTop: scale(12),
  },

  linkText: {
    color: "#D4A373",
    fontWeight: "500",
  },
});