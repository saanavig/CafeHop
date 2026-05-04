import React, { useState } from "react";
import { Alert, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Camera, CameraType, useCameraPermissions } from "expo-camera";
import { supabase } from "../api/supabaseClient";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:3001";

export default function CafeQRScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Camera permission needed</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      const qrData = JSON.parse(data);

      if (
        !qrData.reward_id ||
        !qrData.cafe_id ||
        !qrData.submission_token ||
        !qrData.timestamp
      ) {
        throw new Error("Invalid reward QR code");
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;
      if (!token) throw new Error("You are not logged in");

      const res = await fetch(`${API_URL}/api/redeem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reward_id: qrData.reward_id,
          cafe_id: qrData.cafe_id,
          submission_token: qrData.submission_token,
          timestamp: qrData.timestamp,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        Alert.alert("Redemption failed", result.error || "Could not redeem");
        setScanned(false);
        return;
      }

      Alert.alert(
        "Reward redeemed!",
        `Points spent: ${result.points_spent}\nRemaining points: ${result.remaining_points}`,
        [{ text: "Scan another", onPress: () => setScanned(false) }]
      );
    } catch (err: any) {
      Alert.alert("Invalid QR", err.message || "Could not scan QR");
      setScanned(false);
    }
  };

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        type={CameraType.back}
        onBarCodeScanned={scanned ? undefined : handleScanned}
      />

      <View style={styles.overlay}>
        <Text style={styles.overlayTitle}>Scan Reward QR</Text>
        <Text style={styles.overlayText}>
          Scan the customer’s CafeHop reward QR code.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F7F3F0",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#D4A373",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
  overlay: {
    position: "absolute",
    top: 60,
    left: 24,
    right: 24,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 16,
    borderRadius: 14,
  },
  overlayTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  overlayText: {
    color: "#fff",
    textAlign: "center",
    marginTop: 6,
  },
});