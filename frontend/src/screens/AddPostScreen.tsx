import React, { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../api/supabaseClient";
import Button from "../components/ui/Button";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type AddPostScreenProps = {
  navigation: any;
  route: {
    params: {
      cafeId: string;
      cafeName: string;
    };
  };
};

type UploadedMedia = {
  bucket_name: "images" | "videos";
  file_path: string;
  file_url: string;
  file_type: "image" | "video";
};

export default function AddPostScreen({
  navigation,
  route,
}: AddPostScreenProps) {
  const { cafeId, cafeName } = route.params;

  const [caption, setCaption] = useState("");
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission required", "We need access to your photos/videos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      quality: 0.7,
      allowsEditing: false,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setMediaUri(asset.uri);

      if (asset.type === "video") {
        setMediaType("video");
      } else {
        setMediaType("image");
      }
    }
  };

  const uploadMediaToSupabase = async (): Promise<UploadedMedia> => {
    if (!mediaUri || !mediaType) {
      throw new Error("No media selected");
    }

    const bucketName = mediaType === "image" ? "images" : "videos";
    const extension = mediaType === "image" ? ".jpg" : ".mp4";
    const contentType = mediaType === "image" ? "image/jpeg" : "video/mp4";
    const fileName = `post-${Date.now()}-${Math.random()}${extension}`;

    const response = await fetch(mediaUri);
    const blob = await response.blob();

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, blob, {
        contentType,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return {
      bucket_name: bucketName,
      file_path: fileName,
      file_url: publicUrlData.publicUrl,
      file_type: mediaType,
    };
  };

  const handlePost = async () => {
    if (!mediaUri || !mediaType) {
      Alert.alert("Missing media", "Please select an image or video.");
      return;
    }

    setUploading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        Alert.alert("Error", "You are not logged in.");
        return;
      }

      const uploadedMedia = await uploadMediaToSupabase();

      const payload = {
        cafe_id: cafeId,
        caption,
        post_type: "user",
        bucket_name: uploadedMedia.bucket_name,
        file_path: uploadedMedia.file_path,
        file_url: uploadedMedia.file_url,
        file_type: uploadedMedia.file_type,
      };

      console.log("POST PAYLOAD:", payload);

      const res = await fetch(`${API_URL}/api/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      console.log("RAW RESPONSE:", text);

      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: text };
      }

      if (!res.ok) {
        console.error("Backend error:", data);
        Alert.alert("Error", data.error || "Failed to create post.");
        return;
      }

      Alert.alert("Success", "Post created successfully!");
      navigation.goBack();
    } catch (err) {
      console.error("CREATE POST ERROR:", err);
      Alert.alert("Error", "Something went wrong while creating the post.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Add Post</Text>
        <Text style={styles.subtitle}>Posting about {cafeName}</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Caption</Text>
          <TextInput
            style={styles.input}
            placeholder="Write something about this cafe..."
            value={caption}
            onChangeText={setCaption}
            multiline
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Media</Text>
          <Pressable style={styles.mediaBox} onPress={pickMedia}>
            {mediaUri ? (
              mediaType === "image" ? (
                <Image source={{ uri: mediaUri }} style={styles.previewImage} />
              ) : (
                <View style={styles.videoPlaceholder}>
                  <Text style={styles.videoText}>Video selected</Text>
                  <Text style={styles.videoSubtext}>{mediaUri.split("/").pop()}</Text>
                </View>
              )
            ) : (
              <Text style={styles.mediaText}>Select image or video</Text>
            )}
          </Pressable>
        </View>

        <Button
          title={uploading ? "Posting..." : "Post"}
          variant="caramel"
          onPress={handlePost}
          disabled={uploading || !mediaUri}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F3F0",
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
    color: "#2C1810",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
    color: "#2C1810",
  },
  input: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: "#D8D8D8",
    borderRadius: 12,
    backgroundColor: "#FFF",
    padding: 14,
    textAlignVertical: "top",
    fontSize: 15,
  },
  mediaBox: {
    height: 220,
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 12,
    backgroundColor: "#FAFAFA",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  mediaText: {
    color: "#777",
    fontSize: 15,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  videoPlaceholder: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  videoText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C1810",
    marginBottom: 6,
  },
  videoSubtext: {
    fontSize: 13,
    color: "#777",
    textAlign: "center",
  },
});