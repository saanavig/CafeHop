import * as ImagePicker from "expo-image-picker";

import {
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Bookmark, Camera, Grid3X3, Heart, Layers, MapPin, Plus, Star, Store, User, X } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { deviceWidth, moderateScale, scale } from "../utils/responsive";

import BottomNav from "../components/ui/BottomNav";
import Button from "../components/ui/Button";
import { supabase } from "../api/supabaseClient";
import { useRole } from "../context/RoleContext";

const SCREEN_WIDTH = deviceWidth;

type Comment = { text: string };
type Post = {
  id: number;
  images: string[];
  likes: number;
  liked: boolean;
  comments: Comment[];
  caption?: string;
  saved?: boolean;
  location?: string;
  tags?: string[];
};

export default function UserProfileScreen() {
  const { role } = useRole();
  const isCafe = role === "cafe";

  const [profileName, setProfileName] = useState("");


  useEffect(() => {
    if (isCafe) return;

    const fetchUserName = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", user.id)
          .maybeSingle();
        if (profile) {
          const full = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
          setProfileName(full);
        }
      } catch (err) {
        console.error("Error fetching user name:", err);
      }
    };

    fetchUserName();
  }, [isCafe]);

  useEffect(() => {
    if (!isCafe) {
      setEditableName(profileName);
    }
  }, [profileName, isCafe]);
  const contentWidth = Math.min(deviceWidth * 0.9, 480);
  const photoSize = (contentWidth - 6) / 3;

  const profile = {
    name: isCafe ? "Bean & Bloom Café" : profileName ,
    bio: isCafe
      ? "Cozy neighbourhood café in Brooklyn ☕ | Mon–Sun 7am–8pm"
      : "Exploring NYC cafés ☕✨",
    stats: isCafe
      ? { posts: 42, visits: 5420, rating: 4.8 }
      : { posts: 27, visits: 340, favorites: 12 },
  };


  const [activeTab, setActiveTab] = useState<"photos" | "reviews" | "saved">("photos");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;
  const tabFadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start();
  }, []);

  const switchTab = (tab: "photos" | "reviews" | "saved") => {
    Animated.timing(tabFadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setActiveTab(tab);
      Animated.timing(tabFadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [commentInput, setCommentInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editableName, setEditableName] = useState("");
  const [editableBio, setEditableBio] = useState(profile.bio);
  const [showAddPost, setShowAddPost] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<
      { uri: string; type: "image" | "video" }[]
    >([]);
  const [selectedCafeId, setSelectedCafeId] = useState<number | null>(null);
  const [caption, setCaption] = useState("");
  const [cafes, setCafes] = useState<any[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [cafeQuery, setCafeQuery] = useState("");
  const [filteredCafes, setFilteredCafes] = useState<any[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPostId, setMenuPostId] = useState<number | null>(null);

  useEffect(() => {
    if (!cafeQuery.trim()) {
      setFilteredCafes([]);
      return;
    }

    const results = cafes.filter((cafe) =>
      cafe.name.toLowerCase().includes(cafeQuery.toLowerCase())
    );

    setFilteredCafes(results);
  }, [cafeQuery, cafes]);


  const TAG_OPTIONS = [
    "Cozy", "Quiet", "Lively", "Outdoor Seating", "Pet Friendly", "WiFi", "Power Outlets",
    "Specialty Drinks", "Great Pastries", "Vegan Options", "Study-friendly", "Good for Meetings",
    "Instagrammable", "Late-night", "Early morning"
  ];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    );
  };
  const cafeCaptions = [
    "Our signature pour-over ☕",
    "Morning light in the lounge 🌤",
    "Freshly baked croissants 🥐",
    "Hand-crafted latte art ✨",
    "The cozy reading nook 📚",
    "Espresso bar at golden hour",
    "Weekly special: matcha tonic 🍵",
    "Our barista at work ☕",
    "New seasonal blend is here!",
    "Cinnamon roll Friday 🍂",
    "Outdoor terrace is open 🌿",
    "Meet the team! 👋",
  ];

  useEffect(() => {
    const fetchCafes = async () => {
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/cafe/all`
        );

        const data = await response.json();
        setCafes(data);
      } catch (err) {
        console.error("Error fetching cafes:", err);
      }
    };

    fetchCafes();
  }, []);

  const handleCreatePost = async () => {
    setIsPosting(true);

    try {
      if (selectedMedia.length === 0 || !selectedCafeId) {
        setIsPosting(false);
        return;
      }

  const uploadResults = await Promise.all(
    selectedMedia.map((m) =>
      uploadImageToSupabase(m.uri, m.type)
    )
  );

  const validUploads = uploadResults.filter(Boolean);

      if (validUploads.length === 0) {
        console.error("Uploads failed");
        setIsPosting(false);
        return;
      }

      // const { file_url, file_path, bucket_name } = uploadResult;

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cafe_id: selectedCafeId,
          caption,
          post_type: "user",
          tags: selectedTags,
          media: validUploads,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log(data);
        console.error("Failed to create post");
        return;
      }

      setPosts((prev) => [
      {
        id: data.post.id || Date.now(),
        images: data.media.map((m) => m.file_url),
        likes: 0,
        liked: false,
        caption,
        location: cafes.find(c => c.id === selectedCafeId)?.name,
        saved: false,
        comments: [],
        tags: selectedTags,
      },
      ...prev,
    ]);
  
      setShowAddPost(false);
      setSelectedMedia([]);
      setCaption("");
      setSelectedCafeId(null);
      setSelectedTags([]);

    } catch (err) {
      console.error(err);
    }
    finally {
      setIsPosting(false);
    }
  };

  const uploadImageToSupabase = async (uri: string, type: "image" | "video") => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      if (!blob) return null;

      const ext = type === "video" ? "mp4" : "jpg";
      const fileName = `posts/${Date.now()}-${Math.random()}.${ext}`;

      const { error } = await supabase.storage
        .from("posts")
        .upload(fileName, blob, {
          contentType: type === "video" ? "video/mp4" : "image/jpeg",
          upsert: true,
        });

      if (error) {
        console.error("Upload error:", error);
        return null;
      }

      const { data } = supabase.storage
        .from("posts")
        .getPublicUrl(fileName);

      return {
        file_url: data.publicUrl,
        file_path: fileName,
        bucket_name: "posts",
        file_type: type,
      };
    } catch (err) {
      console.error("Upload crash:", err);
      return null;
    }
  };

  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const res = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/posts/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        const formatted = data.map((p: any) => ({
          id: p.id,
          images: [p.file_url],
          likes: p.likes_count || 0,
          liked: false,
          caption: p.caption,
          location: p.cafe_name,
          saved: false,
          comments: [],
        }));

        setPosts(formatted);
      } catch (err) {
        console.error("Error fetching posts:", err);
      }
    };

    fetchPosts();
  }, []);


  const handleLike = (id: number) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
      )
    );
    if (selectedPost?.id === id) {
      setSelectedPost((prev) =>
        prev ? { ...prev, liked: !prev.liked, likes: prev.liked ? prev.likes - 1 : prev.likes + 1 } : prev
      );
    }
  };

  const handleSave = (id: number) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, saved: !p.saved } : p))
    );
    if (selectedPost?.id === id) {
      setSelectedPost((prev) =>
        prev ? { ...prev, saved: !prev.saved } : prev
      );
    }
  };

  const handleDeletePost = async (postId: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/posts/${postId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        console.error("Failed to delete");
        return;
      }

      setPosts((prev) => prev.filter((p) => p.id !== postId));

      // close modal if open
      if (selectedPost?.id === postId) {
        setSelectedPost(null);
      }

    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const openPost = (post: Post) => {
    setSelectedPost(post);
    setCarouselIndex(0);
  };

  const pickMedia = async () => {
    if (selectedMedia.length >= 5) {
      alert("Max 5 items");
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newItems = result.assets.map((a) => ({
        uri: a.uri,
        type: a.type === "video" ? "video" : "image",
      }));

      setSelectedMedia((prev) => [...prev, ...newItems].slice(0, 5));
    }
  };

  const handleAddComment = () => {
    if (!commentInput.trim() || !selectedPost) return;
    const newComment: Comment = { text: commentInput.trim() };
    setPosts((prev) =>
      prev.map((p) =>
        p.id === selectedPost.id ? { ...p, comments: [...p.comments, newComment] } : p
      )
    );
    setSelectedPost((prev) =>
      prev ? { ...prev, comments: [...prev.comments, newComment] } : prev
    );
    setCommentInput("");
  };

  const handleSaveProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const parts = editableName.trim().split(" ");
      const first_name = parts[0] || "";
      const last_name = parts.slice(1).join(" ") || "";

      await supabase
        .from("profiles")
        .update({ first_name, last_name })
        .eq("id", user.id);

      setProfileName(editableName);
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating name:", err);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: scale(100) }}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        <View style={{ width: contentWidth, alignSelf: "center" }}>

          {/* ── Profile Header ── */}
          <View style={styles.header}>
            <View style={styles.avatar}>
              {isCafe ? <Store size={scale(44)} color="#888" /> : <User size={scale(44)} color="#888" />}
            </View>

            {isEditing ? (
              <>
                <TextInput style={styles.editInput} value={editableName} onChangeText={setEditableName} placeholder="Name" />
                <TextInput style={styles.editInput} value={editableBio} onChangeText={setEditableBio} placeholder="Bio" multiline />
              </>
            ) : (
              <>
                <Text style={styles.name}>{editableName}</Text>
                <Text style={styles.bio}>{editableBio}</Text>
              </>
            )}

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{posts.length}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{isCafe ? "5.4k" : profile.stats.visits}</Text>
                <Text style={styles.statLabel}>{isCafe ? "Check-ins" : "Cafes Visited"}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{isCafe ? "4.8 ★" : profile.stats.favorites}</Text>
                <Text style={styles.statLabel}>{isCafe ? "Rating" : "Favourites"}</Text>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <Button
                style={{ flex: 1, marginRight: scale(8) }}
                onPress={() => {
                  if (isEditing) {
                    handleSaveProfile();
                  } else {
                    setIsEditing(true);
                  }
                }}
              >
                <Text>{isEditing ? "Save" : "Edit Profile"}</Text>
              </Button>

              <Button style={{ flex: 1 }} onPress={() => setShowAddPost(true)}>
                <Text>Add Post</Text>
              </Button>
            </View>
          </View>

          {/* ── Tabs ── */}
          <View style={styles.tabs}>
            <TouchableOpacity onPress={() => switchTab("photos")}>
              <Grid3X3 size={scale(22)} color={activeTab === "photos" ? "#D4A373" : "#777"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => switchTab("reviews")}>
              <Star size={scale(22)} color={activeTab === "reviews" ? "#D4A373" : "#777"} />
            </TouchableOpacity>
            {!isCafe && (
              <TouchableOpacity onPress={() => switchTab("saved")}>
                <Bookmark size={scale(22)} color={activeTab === "saved" ? "#D4A373" : "#777"} />
              </TouchableOpacity>
            )}
          </View>

          {/* ── Tab content ── */}
          <Animated.View style={{ opacity: tabFadeAnim }}>

            {/* Posts Grid */}
            {activeTab === "photos" && (
              <View style={styles.grid}>
                {posts.map((post) => (
                  <TouchableOpacity key={post.id} onPress={() => openPost(post)} style={{ position: "relative" }}>
                    <Image
                      source={{ uri: post.images[0] }}
                      style={{ width: photoSize, height: photoSize, margin: 1, borderRadius: scale(4) }}
                    />
                    {/* Carousel indicator on thumbnail */}
                    {post.images.length > 1 && (
                      <View style={styles.carouselBadge}>
                        <Layers size={scale(11)} color="#FFF" />
                      </View>
                    )}

                    <TouchableOpacity
                      onPress={() => {
                        setMenuPostId(post.id);
                        setShowMenu(true);
                      }}
                      style={{
                        position: "absolute",
                        top: 6,
                        left: 6,
                        borderRadius: 10,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        zIndex: 10,
                      }}
                    >
                      <Text style={{ color: "#FFF", fontSize: 12 }}>•••</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Reviews */}
            {activeTab === "reviews" && (
              <View style={styles.reviewsContainer}>
                <Text style={styles.sectionTitle}>{isCafe ? "Customer Reviews" : "Reviews"}</Text>
                {(isCafe
                  ? [
                      { text: "Best flat white in Brooklyn. Always consistent!", stars: 5 },
                      { text: "Love the reading nook — perfect for WFH days.", stars: 5 },
                      { text: "Croissants are fresh every morning. Highly recommend!", stars: 4 },
                      { text: "Staff are super friendly, great ambience.", stars: 5 },
                      { text: "The matcha latte is absolutely divine.", stars: 4 },
                    ]
                  : Array.from({ length: 5 }).map(() => ({
                      text: "Great place! Love the atmosphere and coffee quality.",
                      stars: 4,
                    }))
                ).map((review, i) => (
                  <View key={i} style={styles.reviewItem}>
                    <Text style={styles.reviewText}>{review.text}</Text>
                    <View style={styles.reviewStars}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} size={scale(16)} color={j < review.stars ? "#D4A373" : "#ddd"} fill={j < review.stars ? "#D4A373" : "transparent"} />
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Saved */}
            {activeTab === "saved" && !isCafe && (
              <View style={styles.grid}>
                {posts.filter((p) => p.saved).map((post) => (
                  <TouchableOpacity key={post.id} onPress={() => openPost(post)} style={{ position: "relative" }}>
                    <Image
                      source={{ uri: post.images[0] }}
                      style={{ width: photoSize, height: photoSize, margin: 1, borderRadius: scale(4) }}
                    />
                    {post.images.length > 1 && (
                      <View style={styles.carouselBadge}>
                        <Layers size={scale(11)} color="#FFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
                {posts.filter((p) => p.saved).length === 0 && (
                  <Text style={styles.emptyText}>Nothing saved yet.</Text>
                )}
              </View>
            )}
          </Animated.View>
        </View>
      </Animated.ScrollView>

      {/* ── Add Post Modal ── */}
      <Modal visible={showAddPost} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.addPostModal}>
            {/* Header */}
            <View style={styles.addPostHeader}>
              <TouchableOpacity
                onPress={() => {
                  setShowAddPost(false);
                  setSelectedMedia([]);
                  setCaption("");
                }}
              >
                <X size={scale(22)} color="#333" />
              </TouchableOpacity>

              <Text style={styles.addPostTitle}>New Post</Text>

              <TouchableOpacity
                onPress={handleCreatePost}
                disabled={isPosting || selectedMedia.length === 0 || !selectedCafeId}
              >
                <Text
                  style={[
                    styles.addPostShareBtn,
                    (isPosting || selectedMedia.length === 0  || !selectedCafeId) && { opacity: 0.4 }
                  ]}
                >
                  Share
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: scale(16) }}>
              {/* Image picker area */}
              <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {selectedMedia.map((item, i) => (
                <View key={i} style={{ position: "relative" }}>
                  {item.type === "image" ? (
                    <Image
                      source={{ uri: item.uri }}
                      style={{ width: 90, height: 90, borderRadius: 8 }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 90,
                        height: 90,
                        borderRadius: 8,
                        backgroundColor: "#000",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: "#FFF" }}>Video</Text>
                    </View>
                  )}

                  {/* Remove button */}
                  <TouchableOpacity
                    onPress={() =>
                      setSelectedMedia((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      backgroundColor: "rgba(0,0,0,0.6)",
                      borderRadius: 10,
                      padding: 4,
                    }}
                  >
                    <Text style={{ color: "#FFF" }}>X</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {selectedMedia.length < 5 && (
                <TouchableOpacity style={styles.addImageBtn} onPress={pickMedia}>
                  <Camera size={20} color="#D4A373" />
                  <Text>Add</Text>
                </TouchableOpacity>
              )}
            </View>
            </View>

            {/* Cafe Selector */}
              <Text style={{ marginBottom: 6, fontWeight: "600" }}>
                Select Cafe
              </Text>

              <TextInput
                placeholder="Search cafe..."
                value={
                  selectedCafeId
                    ? cafes.find((c) => c.id === selectedCafeId)?.name || ""
                    : cafeQuery
                }
                onChangeText={(text) => {
                  setCafeQuery(text);
                  setSelectedCafeId(null);
                }}
                style={{
                  borderWidth: 1,
                  borderColor: "#EEE",
                  borderRadius: 10,
                  padding: 10,
                  marginBottom: 10,
                }}
              />
              {/* Results */}
              {!selectedCafeId && filteredCafes.map((cafe) => (
                <TouchableOpacity
                  key={cafe.id}
                  onPress={() => {
                    setSelectedCafeId(cafe.id);
                    setCafeQuery(cafe.name);
                    setFilteredCafes([]); 
                  }}
                  style={{
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: "#F0F0F0",
                  }}
                >
                  <Text>{cafe.name}</Text>
                </TouchableOpacity>
              ))}

              {cafeQuery.length > 0 && filteredCafes.length === 0 && (
                <Text style={{ color: "#AAA", marginTop: 6 }}>
                  No cafes found
                </Text>
              )}

              {/* {selectedCafeId && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#F3E9DC",
                  padding: 10,
                  borderRadius: 10,
                  marginBottom: 10,
                  justifyContent: "space-between",
                }}
              >
              </View>
            )} */}

              {/* Caption */}
              <TextInput
                placeholder="Write a caption…"
                placeholderTextColor="#AAA"
                value={caption}
                onChangeText={setCaption}
                multiline
                style={styles.captionInput}
              />

              {/* Tags */}
              <Text style={{ fontWeight: "600", marginBottom: 6, marginTop: 6 }}>
                Tags
              </Text>

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {TAG_OPTIONS.map((tag) => {
                  const selected = selectedTags.includes(tag);

                  return (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => toggleTag(tag)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        backgroundColor: selected ? "#D4A373" : "#EEE",
                      }}
                    >
                      <Text style={{ color: selected ? "#FFF" : "#333" }}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Post Detail Modal (Instagram-style) ── */}
      <Modal visible={!!selectedPost} animationType="slide" presentationStyle="pageSheet">
        {selectedPost && (
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <View style={styles.detailModal}>

              {/* Close button – top right, floating */}
              <TouchableOpacity style={styles.detailCloseBtn} onPress={() => { setSelectedPost(null); setCommentInput(""); }}>
                <X size={scale(18)} color="#333" />
              </TouchableOpacity>

              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {/* ── Carousel ── */}
                <View style={{ width: SCREEN_WIDTH }}>
                  <FlatList
                    data={selectedPost.images}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(_, i) => i.toString()}
                    onMomentumScrollEnd={(e) => {
                      const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                      setCarouselIndex(idx);
                    }}
                    renderItem={({ item }) => (
                      <Image
                        source={{ uri: item }}
                        style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
                        resizeMode="cover"
                      />
                    )}
                  />
                  {/* Dot indicators */}
                  {selectedPost.images.length > 1 && (
                    <View style={styles.dotsRow}>
                      {selectedPost.images.map((_, i) => (
                        <View
                          key={i}
                          style={[styles.dot, i === carouselIndex && styles.dotActive]}
                        />
                      ))}
                    </View>
                  )}
                </View>

                {/* ── Location ── */}
                {selectedPost.location && (
                  <View style={styles.locationRow}>
                    <MapPin size={scale(13)} color="#D4A373" />
                    <Text style={styles.locationText}>{selectedPost.location}</Text>
                  </View>
                )}

                {/* ── Actions ── */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleLike(selectedPost.id)}>
                    <Heart
                      size={scale(24)}
                      color={selectedPost.liked ? "#E0635A" : "#222"}
                      fill={selectedPost.liked ? "#E0635A" : "transparent"}
                      strokeWidth={selectedPost.liked ? 0 : 2}
                    />
                  </TouchableOpacity>
                  <Text style={styles.likeCount}>{selectedPost.likes}</Text>
                  <View style={{ flex: 1 }} />
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleSave(selectedPost.id)}>
                    <Bookmark
                      size={scale(24)}
                      color={selectedPost.saved ? "#D4A373" : "#222"}
                      fill={selectedPost.saved ? "#D4A373" : "transparent"}
                      strokeWidth={selectedPost.saved ? 0 : 2}
                    />
                  </TouchableOpacity>
                </View>

                {/* ── Caption ── */}
                {selectedPost.caption ? (
                  <Text style={styles.detailCaption}>{selectedPost.caption}</Text>
                ) : null}

                {/* ── Comments ── */}
                {selectedPost.comments.length > 0 && (
                  <View style={styles.commentsSection}>
                    {selectedPost.comments.map((c, i) => (
                      <Text key={i} style={styles.commentText}>{c.text}</Text>
                    ))}
                  </View>
                )}

                {/* Tags */}
                {selectedPost.tags && selectedPost.tags.length > 0 && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, marginBottom: 10 }}>
                  {selectedPost.tags.map((tag, i) => (
                    <View
                      key={i}
                      style={{
                        backgroundColor: "#EEE",
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 12,
                        marginRight: 6,
                        marginBottom: 6,
                      }}
                    >
                      <Text style={{ fontSize: 12, color: "#555" }}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
              </ScrollView>

              {/* ── Comment input ── */}
              <View style={styles.commentBar}>
                <TextInput
                  placeholder="Add a comment…"
                  placeholderTextColor="#AAA"
                  value={commentInput}
                  onChangeText={setCommentInput}
                  style={styles.commentInput}
                  returnKeyType="send"
                  onSubmitEditing={handleAddComment}
                />
                <TouchableOpacity onPress={handleAddComment} disabled={!commentInput.trim()}>
                  <Text style={[styles.commentPostBtn, !commentInput.trim() && { opacity: 0.4 }]}>Post</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        )}
      </Modal>

      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            alignItems: "center",
          }}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View
            style={{
              width: 260,
              backgroundColor: "#FFF",
              borderRadius: 14,
              paddingVertical: 10,
            }}
          >
            <TouchableOpacity
              onPress={() => {
                if (menuPostId) handleDeletePost(menuPostId);
                setShowMenu(false);
              }}
              style={{
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#E0635A", fontWeight: "600" }}>
                Delete Post
              </Text>
            </TouchableOpacity>

            <View style={{ height: 1, backgroundColor: "#EEE" }} />

            <TouchableOpacity
              onPress={() => setShowMenu(false)}
              style={{
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#333" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F3F0" },

  // ── Profile header ──
  header: { padding: scale(16), alignItems: "center" },
  avatar: {
    width: scale(100), height: scale(100), borderRadius: scale(50),
    backgroundColor: "#E8DFD5", justifyContent: "center", alignItems: "center", marginBottom: scale(12),
  },
  name: { fontSize: moderateScale(18), fontWeight: "700", color: "#1A1A1A", marginTop: scale(4) },
  bio: { fontSize: moderateScale(13), color: "#777", textAlign: "center", marginTop: scale(4), lineHeight: moderateScale(18) },
  statsRow: { flexDirection: "row", justifyContent: "space-around", width: "100%", marginVertical: scale(14) },
  stat: { alignItems: "center" },
  statNumber: { fontSize: moderateScale(18), fontWeight: "700", color: "#1A1A1A" },
  statLabel: { fontSize: moderateScale(12), color: "#888", marginTop: scale(2) },
  buttonRow: { flexDirection: "row", width: "100%", marginTop: scale(4) },
  editInput: {
    borderWidth: 1, borderColor: "#DDD", borderRadius: scale(8),
    padding: scale(8), marginVertical: scale(4), fontSize: moderateScale(15), width: "100%",
    backgroundColor: "#FFF",
  },

  // ── Tabs ──
  tabs: {
    flexDirection: "row", justifyContent: "space-around",
    paddingVertical: scale(12), borderBottomWidth: 1, borderBottomColor: "#DDD",
  },

  // ── Grid ──
  grid: { flexDirection: "row", flexWrap: "wrap", marginTop: scale(2) },
  carouselBadge: {
    position: "absolute", top: scale(6), right: scale(6),
    backgroundColor: "rgba(0,0,0,0.45)", borderRadius: scale(4), padding: scale(3),
  },
  emptyText: { fontSize: moderateScale(13), color: "#AAA", padding: scale(24), textAlign: "center", width: "100%" },

  // ── Reviews ──
  reviewsContainer: { padding: scale(16) },
  sectionTitle: { fontSize: moderateScale(16), fontWeight: "700", color: "#1A1A1A", marginBottom: scale(12) },
  reviewItem: { backgroundColor: "#FFF", padding: scale(12), borderRadius: scale(10), marginBottom: scale(10), borderWidth: 1, borderColor: "#EEE" },
  reviewText: { fontSize: moderateScale(13), color: "#444", marginBottom: scale(8), lineHeight: moderateScale(18) },
  reviewStars: { flexDirection: "row", gap: scale(2) },

  // ── Add Post Modal ──
  addPostModal: { flex: 1, backgroundColor: "#FFF" },
  addPostHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: scale(16), paddingVertical: scale(14),
    borderBottomWidth: 1, borderBottomColor: "#EEE",
  },
  addPostTitle: { fontSize: moderateScale(16), fontWeight: "700", color: "#1A1A1A" },
  addPostShareBtn: { fontSize: moderateScale(15), fontWeight: "700", color: "#D4A373" },
  imagePickerRow: {
    flexDirection: "row", flexWrap: "wrap", gap: scale(8), marginBottom: scale(16),
  },
  pickedImageWrap: { position: "relative" },
  pickedImage: { width: scale(90), height: scale(90), borderRadius: scale(8) },
  removeImageBtn: {
    position: "absolute", top: scale(4), right: scale(4),
    backgroundColor: "rgba(0,0,0,0.55)", borderRadius: scale(10),
    width: scale(18), height: scale(18), justifyContent: "center", alignItems: "center",
  },
  addImageBtn: {
    width: scale(90), height: scale(90), borderRadius: scale(8),
    borderWidth: 1.5, borderColor: "#D4A373", borderStyle: "dashed",
    justifyContent: "center", alignItems: "center", gap: scale(4),
    backgroundColor: "rgba(212,163,115,0.06)",
  },
  addImageText: { fontSize: moderateScale(11), color: "#D4A373", fontWeight: "600", textAlign: "center" },
  addImageCount: { fontSize: moderateScale(10), color: "#AAA" },
  captionInput: {
    fontSize: moderateScale(15), color: "#1A1A1A", lineHeight: moderateScale(22),
    minHeight: scale(100), textAlignVertical: "top",
    borderWidth: 1, borderColor: "#EEE", borderRadius: scale(10),
    padding: scale(12), backgroundColor: "#FAFAFA",
  },

  // ── Post Detail Modal ──
  detailModal: { flex: 1, backgroundColor: "#FFF" },
  detailCloseBtn: {
    position: "absolute", top: scale(14), right: scale(14), zIndex: 10,
    width: scale(32), height: scale(32), borderRadius: scale(16),
    backgroundColor: "rgba(255,255,255,0.92)",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15, shadowRadius: 3, elevation: 3,
  },
  dotsRow: {
    flexDirection: "row", justifyContent: "center", alignItems: "center",
    gap: scale(5), paddingVertical: scale(8),
  },
  dot: {
    width: scale(6), height: scale(6), borderRadius: scale(3),
    backgroundColor: "#CCC",
  },
  dotActive: { backgroundColor: "#D4A373", width: scale(8), height: scale(8), borderRadius: scale(4) },
  actionsRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: scale(14), paddingVertical: scale(10),
  },
  actionBtn: { padding: scale(4) },
  likeCount: { fontSize: moderateScale(14), fontWeight: "600", color: "#1A1A1A", marginLeft: scale(6) },
  detailCaption: {
    paddingHorizontal: scale(16), paddingBottom: scale(10),
    fontSize: moderateScale(14), color: "#1A1A1A", lineHeight: moderateScale(20),
  },
  commentsSection: {
    paddingHorizontal: scale(16), paddingBottom: scale(16),
    borderTopWidth: 1, borderTopColor: "#F0F0F0", paddingTop: scale(12), gap: scale(8),
  },
  commentText: {
    fontSize: moderateScale(13), color: "#555", lineHeight: moderateScale(18),
  },
  commentBar: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: scale(14), paddingVertical: scale(10),
    borderTopWidth: 1, borderTopColor: "#EFEFEF",
    backgroundColor: "#FFF", gap: scale(10),
  },
  commentInput: {
    flex: 1, fontSize: moderateScale(14), color: "#1A1A1A",
    backgroundColor: "#F7F3F0", borderRadius: scale(20),
    paddingHorizontal: scale(14), paddingVertical: scale(8),
  },
  commentPostBtn: { fontSize: moderateScale(14), fontWeight: "700", color: "#D4A373" },
  locationRow: {
    flexDirection: "row", alignItems: "center", gap: scale(4),
    paddingHorizontal: scale(14), paddingBottom: scale(8),
  },
  locationText: { fontSize: moderateScale(12), color: "#D4A373", fontWeight: "500" },
});
