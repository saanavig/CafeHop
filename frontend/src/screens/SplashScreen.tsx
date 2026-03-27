import Animated, { FadeInDown } from "react-native-reanimated";
import { PlayfairDisplay_700Bold, useFonts } from "@expo-google-fonts/playfair-display";
import { StyleSheet, Text, View } from "react-native";
import { moderateScale, scale } from "../utils/responsive";

import Button from "../components/ui/Button";
import { Coffee } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
// frontend/src/screens/SplashScreen.tsx
import React from "react";
import { useNavigation } from "@react-navigation/native";

export default function SplashScreen() {
  const navigation = useNavigation<any>();
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
  });

  if (!fontsLoaded) {
    return null; // or a loading screen
  }

  return (
    <LinearGradient
      colors={["#F7F3F0", "#F0EDE8"]}
      style={styles.container}
    >
      <Animated.View entering={FadeInDown.duration(600)} style={styles.content}>
        <View style={styles.logoContainer}>
          <Coffee color="#D4A373" size={40} />
        </View>
        <Text style={styles.title}>CafeHop</Text>
        <Text style={styles.subtitle}>
          Discover cafes. Earn rewards. Build community.
        </Text>
        <View style={styles.buttonsContainer}>
          <Button title="Log In" onPress={() => navigation.navigate("Login")} />
          <Button
            title="Sign Up"
            variant="outline"
            onPress={() => navigation.navigate("SignUp")}
          />
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: scale(24) },
  content: { maxWidth: 480, alignItems: "center" },
  logoContainer: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(16),
    backgroundColor: "rgba(212, 163, 115, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: scale(24),
  },
  title: {
    fontSize: moderateScale(36),
    fontWeight: "bold",
    fontFamily: "PlayfairDisplay_700Bold",
    marginBottom: scale(12),
    textAlign: "center",
    color: "#1A1A1A",
  },
  subtitle: {
    fontSize: moderateScale(16),
    textAlign: "center",
    color: "#666",
    marginBottom: scale(32),
  },
  buttonsContainer: { width: "100%" },
});