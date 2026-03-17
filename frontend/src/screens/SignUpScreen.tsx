import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Button from "../components/ui/Button";

export default function SignUpScreen() {
  const navigation = useNavigation<any>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordError, setPasswordError] = useState("");

  // Password validation logic
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

  const handleContinue = () => {
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
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Header */}
        <Text style={styles.title}>Create an Account</Text>
        <Text style={styles.subtitle}>
          Sign up to start discovering cafés
        </Text>

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
              onChangeText={(text) => {
                setPassword(text);
                setPasswordError(""); // clears error while typing
              }}
              placeholder="••••••••"
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
            />

            <Pressable
              onPress={() => setShowPassword((prev) => !prev)}
              style={styles.eyeButton}
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

        {/* Confirm Password */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm Password</Text>

          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput, { color: "#333" }]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              placeholderTextColor="#999"
              secureTextEntry={!showConfirmPassword}
            />

            <Pressable
              onPress={() =>
                setShowConfirmPassword((prev) => !prev)
              }
              style={styles.eyeButton}
            >
              <Text style={styles.eyeText}>
                {showConfirmPassword ? "Hide" : "Show"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Continue button */}
        <Button title="Continue" onPress={handleContinue} />

        {/* Already have account */}
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
    padding: 24,
    backgroundColor: "#F7F3F0",
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
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    fontFamily: "PlayfairDisplay_700Bold",
    marginBottom: 8,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 14,
    color: "#555",
    marginBottom: 24,
    textAlign: "center",
  },

  inputContainer: {
    marginBottom: 16,
  },

  label: {
    fontWeight: "500",
    marginBottom: 4,
  },

  input: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 8,
    padding: 12,
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

  eyeText: {
    color: "#D4A373",
    fontWeight: "500",
  },

  errorText: {
    color: "#d9534f",
    fontSize: 12,
    marginTop: 4,
  },

  loginText: {
    textAlign: "center",
    marginTop: 12,
  },

  linkText: {
    color: "#D4A373",
    fontWeight: "500",
  },
});