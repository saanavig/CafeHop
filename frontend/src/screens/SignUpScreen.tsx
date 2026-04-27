import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import React, { useState } from "react";
import { moderateScale, scale } from "../utils/responsive";

import Button from "../components/ui/Button";
import { apiFetch } from "../api/client";
import { supabase } from "../api/supabaseClient";
import { useNavigation } from "@react-navigation/native";

export default function SignUpScreen() {
  const navigation = useNavigation<any>();
  const [selectedRole, setSelectedRole] = useState<"user" | "cafe">("user");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState("");

  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

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
      setConfirmPasswordError("Passwords do not match");
      return;
    }

    setConfirmPasswordError("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error(error.message);

      if (error.message.toLowerCase().includes("already registered")) {
        setEmailError("This email is already registered");
      } else {
        Alert.alert("Error", error.message);
      }

      return;
    }

    console.log("Signup success:", data);

    // try {
    //   await apiFetch("/users/me", {
    //     method: "POST",
    //   });
    // } catch (err) {
    //   console.error("Backend error:", err);
    // }

  if (selectedRole === "user") {
    navigation.navigate("Onboarding");
  }

  if (selectedRole === "cafe") {
    navigation.navigate("CafeOnboarding");
  }
};

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Sign up to get started</Text>

        {/* EMAIL */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[
              styles.input,
              emailError && { borderColor: "red" },
            ]}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) setEmailError("");
            }}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {emailError ? (
            <Text style={styles.errorText}>{emailError}</Text>
          ) : null}
        </View>

        {/* PASSWORD */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[
                styles.input,
                styles.passwordInput,
                passwordError && { borderColor: "red" },
              ]}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError("");
              }}
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

        {/* CONFIRM PASSWORD */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm Password</Text>

          <View style={styles.passwordContainer}>
            <TextInput
              style={[
                styles.input,
                styles.passwordInput,
                confirmPasswordError && { borderColor: "red" },
              ]}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (confirmPasswordError)
                  setConfirmPasswordError("");
              }}
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

          {confirmPasswordError ? (
            <Text style={styles.errorText}>
              {confirmPasswordError}
            </Text>
          ) : null}
        </View>

        {/* BUTTON */}
        <Button title="Continue" onPress={handleContinue} />

        {/* LOGIN LINK */}
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