import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  TextStyle,
} from "react-native";
//recueptuploadscreen.tsx
import React, { useState } from "react";
import { moderateScale, scale } from "../utils/responsive";

import Button from "../components/ui/Button";
import { supabase } from "../api/supabaseClient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";

type UploadState = "idle" | "uploading" | "success" | "error";

interface ReceiptUploadScreenProps {
  navigation: any;
}

export default function ReceiptUploadScreen({
  navigation,
}: ReceiptUploadScreenProps) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null);
  const { colors: themeColors } = useTheme();

  const BACKEND_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/receipt`;

  const styles = {
    container: {
      flex: 1,
      backgroundColor: themeColors.bg,
    },
    scrollContent: {
      padding: scale(20),
      paddingBottom: scale(40),
    },
    title: {
      fontSize: moderateScale(28),
      fontWeight: "700",
      color: themeColors.text,
      marginBottom: scale(6),
    },
    subtitle: {
      fontSize: moderateScale(14),
      color: themeColors.textMuted,
      marginBottom: scale(20),
    },
    card: {
      backgroundColor: themeColors.card,
      borderRadius: scale(18),
      padding: scale(16),
    },
    placeholder: {
      height: scale(240),
      borderRadius: scale(14),
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: themeColors.border,
      backgroundColor: themeColors.bg,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: scale(16),
    },
    placeholderText: {
      color: themeColors.textMuted,
      fontSize: moderateScale(14),
    },
    previewImage: {
      width: "100%",
      height: scale(240),
      borderRadius: scale(14),
      marginBottom: scale(16),
    },
    buttonGroup: {
      marginTop: scale(4),
    },
    statusBox: {
      marginTop: scale(16),
      alignItems: "center",
    },
    statusText: {
      marginTop: scale(8),
      color: themeColors.textMuted,
      textAlign: "center",
      fontSize: moderateScale(13),
    },
    successBox: {
      marginTop: scale(16),
      backgroundColor: themeColors.card,
      padding: scale(14),
      borderRadius: scale(12),
    },
    successTitle: {
      fontSize: moderateScale(16),
      fontWeight: "700",
      color: themeColors.text,
      marginBottom: scale(4),
    },
    successText: {
      color: themeColors.text,
      fontSize: moderateScale(13),
    },
    pointsText: {
      marginTop: scale(8),
      fontSize: moderateScale(15),
      fontWeight: "700",
      color: themeColors.accent,
    },
    errorBox: {
      marginTop: scale(16),
      backgroundColor: themeColors.card,
      padding: scale(14),
      borderRadius: scale(12),
    },
    errorTitle: {
      fontSize: moderateScale(16),
      fontWeight: "700",
      color: themeColors.text,
      marginBottom: scale(4),
    },
    errorText: {
      color: themeColors.text,
      fontSize: moderateScale(13),
    },
    resultCard: {
      marginTop: scale(16),
      backgroundColor: themeColors.card,
      borderRadius: scale(12),
      padding: scale(14),
    },
    resultTitle: {
      fontSize: moderateScale(15),
      fontWeight: "600",
      marginBottom: scale(8),
      color: themeColors.text,
    },
    resultBody: {
      color: themeColors.textMuted,
      fontSize: moderateScale(13),
      lineHeight: moderateScale(20),
    },
    bottomActions: {
      marginTop: scale(20),
      flexDirection: "row",
      justifyContent: "space-between",
    },
    secondaryAction: {
      color: themeColors.accent,
      fontWeight: "600",
      fontSize: moderateScale(14),
    },
  } as any;

  const requestCameraPermission = async () => {
    const result = await ImagePicker.requestCameraPermissionsAsync();
    if (!result.granted) {
      Alert.alert("Permission needed", "Camera permission is required.");
      return false;
    }
    return true;
  };

  const requestMediaPermission = async () => {
    const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!result.granted) {
      Alert.alert(
        "Permission needed",
        "Media library permission is required."
      );
      return false;
    }
    return true;
  };

  const requestLocation = async () => {
    const result = await Location.requestForegroundPermissionsAsync();
    if (result.status !== "granted") {
      throw new Error("Location permission denied");
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  };

  const takePhoto = async () => {
    const ok = await requestCameraPermission();
    if (!ok) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"] as any,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setUploadState("idle");
      setErrorMessage("");
      setSuccessMessage("");
      setOcrText("");
      setEarnedPoints(null);
    }
  };

  const pickFromGallery = async () => {
    const ok = await requestMediaPermission();
    if (!ok) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"] as any,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setUploadState("idle");
      setErrorMessage("");
      setSuccessMessage("");
      setOcrText("");
      setEarnedPoints(null);
    }
  };

  const buildFormData = async () => {
    if (!imageUri) {
      throw new Error("Please select a receipt image first.");
    }

    const { latitude, longitude } = await requestLocation();

    const filename = imageUri.split("/").pop() || "receipt.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const ext = match?.[1]?.toLowerCase();

    let mimeType = "image/jpeg";
    if (ext === "png") mimeType = "image/png";

    const formData = new FormData();

    if (Platform.OS === "web") {
      const imgResponse = await fetch(imageUri);
      const blob = await imgResponse.blob();
      formData.append("file", blob, filename);
    } else {
      formData.append("file", {
        uri: imageUri,
        name: filename,
        type: mimeType,
      } as any);
    }

    formData.append("latitude", String(latitude));
    formData.append("longitude", String(longitude));

    return formData;
  };

  const uploadReceipt = async () => {
    try {
      setUploadState("uploading");
      setErrorMessage("");
      setSuccessMessage("");
      setOcrText("");
      setEarnedPoints(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;

      if (!token) {
        throw new Error("User not authenticated");
      }

      console.log("imageUri:", imageUri);
      console.log("platform:", Platform.OS);

      const formData = await buildFormData();

      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const text = await response.text();
      console.log("RECEIPT RAW RESPONSE:", text);

      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: text };
      }

      console.log("RECEIPT STATUS:", response.status);
      console.log("RECEIPT DATA:", data);

      if (!response.ok || !data.success) {
        const backendError =
          data?.error ||
          data?.details?.reason ||
          "Receipt upload failed. Please try again.";
        throw new Error(backendError);
      }

      setUploadState("success");
      setSuccessMessage("Receipt uploaded successfully.");
      setOcrText(data?.data?.ocrText || "");
      setEarnedPoints(data.data.points_earned);
    } catch (error: any) {
      setUploadState("error");
      setErrorMessage(error.message || "Something went wrong.");
    }
  };

  const resetForm = () => {
    setImageUri(null);
    setUploadState("idle");
    setErrorMessage("");
    setSuccessMessage("");
    setOcrText("");
    setEarnedPoints(null);
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Upload Receipt</Text>
        <Text style={styles.subtitle}>
          Submit a cafe receipt to earn loyalty points
        </Text>

        <View style={styles.card}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>No receipt selected</Text>
            </View>
          )}

          <View style={styles.buttonGroup}>
            <Button title="Take Photo" onPress={takePhoto} />
            <View style={{ height: scale(10) }} />
            <Button
              title="Choose From Gallery"
              variant="outline"
              onPress={pickFromGallery}
            />
          </View>

          <View style={{ height: scale(14) }} />

          <Button
            title={
              uploadState === "uploading" ? "Uploading..." : "Submit Receipt"
            }
            onPress={uploadReceipt}
            disabled={!imageUri || uploadState === "uploading"}
          />

          {uploadState === "uploading" && (
            <View style={styles.statusBox}>
              <ActivityIndicator />
              <Text style={styles.statusText}>
                Processing receipt, getting location, and validating purchase...
              </Text>
            </View>
          )}

          {uploadState === "success" && (
            <View style={styles.successBox}>
              <Text style={styles.successTitle}>Success 🎉</Text>
              <Text style={styles.successText}>{successMessage}</Text>
              {earnedPoints !== null && (
                <Text style={styles.pointsText}>
                  +{earnedPoints} points earned
                </Text>
              )}
            </View>
          )}

          {uploadState === "error" && (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>Upload Failed</Text>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {!!ocrText && (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>OCR Text Preview</Text>
              <Text style={styles.resultBody}>{ocrText}</Text>
            </View>
          )}

          <View style={styles.bottomActions}>
            <Pressable onPress={resetForm}>
              <Text style={styles.secondaryAction}>Start Over</Text>
            </Pressable>

            <Pressable onPress={() => navigation.goBack()}>
              <Text style={styles.secondaryAction}>Back to Rewards</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}