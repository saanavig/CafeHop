import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useState } from "react";

import { supabase } from "../api/supabaseClient";
import { useTheme } from "../context/ThemeContext";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function CafeQRScannerScreen({ navigation }: any) {
  const { colors: themeColors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

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

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: themeColors.bg }]}>
        <Text style={[styles.title, { color: themeColors.text }]}>Camera permission needed</Text>

        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Allow Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.permissionBackButton}
        >
          <Text style={[styles.permissionBackText, { color: themeColors.textMuted }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={scanned ? undefined : handleScanned}
      />

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Close</Text>
      </TouchableOpacity>

      <View style={styles.overlay}>
        <Text style={styles.overlayTitle}>Scan Reward QR</Text>
        <Text style={styles.overlayText}>
          Scan the customer’s CafeHop reward QR code.
        </Text>
      </View>

      {scanned && (
        <TouchableOpacity
          style={styles.scanAgainButton}
          onPress={() => setScanned(false)}
        >
          <Text style={styles.scanAgainText}>Scan Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

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
    color: "#1A1A1A",
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

  permissionBackButton: {
    marginTop: 16,
  },

  permissionBackText: {
    color: "#777",
    fontWeight: "600",
  },

  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 100,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },

  backButtonText: {
    color: "#fff",
    fontWeight: "700",
  },

  overlay: {
    position: "absolute",
    top: 100,
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

  scanAgainButton: {
    position: "absolute",
    bottom: 60,
    alignSelf: "center",
    backgroundColor: "#D4A373",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },

  scanAgainText: {
    color: "#fff",
    fontWeight: "700",
  },
});