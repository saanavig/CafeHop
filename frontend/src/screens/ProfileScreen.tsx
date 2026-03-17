import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Dimensions,
  StyleSheet,
  Animated,
} from "react-native";
import { useRole } from "../context/RoleContext";
import BottomNav from "../components/ui/BottomNav";
import Button from "../components/ui/Button";
import { Grid3X3, Star, Bookmark, Store, User, Heart, X, Camera } from "lucide-react-native";
import * as ImagePicker from 'expo-image-picker';

type Comment = { user: string; text: string };
type Post = { id: number; image: string; likes: number; liked: boolean; comments: Comment[]; caption?: string; saved?: boolean };

export default function ProfileScreen() {
  const { role } = useRole();
  const isCafe = role === "cafe";

  const { width } = Dimensions.get("window");
  const contentWidth = Math.min(width * 0.9, 480);
  const photoSize = (contentWidth - 6) / 3;

  const profile = {
    name: isCafe ? "Bean & Bloom Café" : "Harry Potter",
    username: isCafe ? "@beanandbloom" : "@thechosenone",
    bio: isCafe
      ? "Cozy neighbourhood café in Brooklyn ☕ | Mon–Sun 7am–8pm"
      : "Exploring NYC cafés ☕✨",
    stats: isCafe
      ? { posts: 42, visits: 5420, rating: 4.8 }
      : { posts: 27, visits: 340, favorites: 12 },
  };

  const [activeTab, setActiveTab] = useState<"photos" | "reviews" | "saved">("photos");

  // Entry & tab animations
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
  const [commentInput, setCommentInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editableName, setEditableName] = useState(profile.name);
  const [editableUsername, setEditableUsername] = useState(profile.username);
  const [editableBio, setEditableBio] = useState(profile.bio);
  const [showAddPost, setShowAddPost] = useState(false);
  const [newPostCaption, setNewPostCaption] = useState("");
  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);

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

  const [posts, setPosts] = useState<Post[]>(
    Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      image: isCafe
        ? `https://picsum.photos/seed/cafe${i + 10}/400`
        : `https://picsum.photos/400?random=${i}`,
      likes: isCafe ? Math.floor(Math.random() * 300) + 50 : Math.floor(Math.random() * 100),
      liked: false,
      caption: isCafe ? cafeCaptions[i % cafeCaptions.length] : "Study vibes ☕✨",
      saved: false,
      comments: [
        { user: "Alice", text: "Looks amazing!" },
        { user: "Bob", text: isCafe ? "Can't wait to visit!" : "Love this café" },
      ],
    }))
  );

  const handleLike = (id: number) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
      )
    );
  };

  const handleSave = (id: number) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, saved: !p.saved } : p
      )
    );
  };

  const pickImage = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
  };

  const handleAddComment = () => {
    if (!commentInput.trim() || !selectedPost) return;
    const newComment = { user: "You", text: commentInput };
    setPosts((prev) =>
      prev.map((p) =>
        p.id === selectedPost.id ? { ...p, comments: [...p.comments, newComment] } : p
      )
    );
    setSelectedPost({ ...selectedPost, comments: [...selectedPost.comments, newComment] });
    setCommentInput("");
  };

  const handleAddPost = () => {
    if (!newPostCaption.trim()) return;
    const newPost: Post = {
      id: posts.length,
      image: selectedImage?.uri || "https://picsum.photos/400?random=" + posts.length,
      likes: 0,
      liked: false,
      caption: newPostCaption,
      saved: false,
      comments: [],
    };
    setPosts([newPost, ...posts]);
    setNewPostCaption("");
    setSelectedImage(null);
    setShowAddPost(false);
  };

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >

        {/* Profile Header */}
        <View style={{ width: contentWidth, alignSelf: "center" }}>
          <View style={styles.header}>
            <View style={styles.avatar}>{isCafe ? <Store size={50} /> : <User size={50} />}</View>

            {isEditing ? (
              <>
                <TextInput style={styles.editInput} value={editableName} onChangeText={setEditableName} placeholder="Name" />
                <TextInput style={styles.editInput} value={editableUsername} onChangeText={setEditableUsername} placeholder="Username" />
                <TextInput style={styles.editInput} value={editableBio} onChangeText={setEditableBio} placeholder="Bio" multiline />
              </>
            ) : (
              <>
                <Text style={styles.name}>{profile.name}</Text>
                <Text style={styles.username}>{profile.username}</Text>
                <Text style={styles.bio}>{profile.bio}</Text>
              </>
            )}

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{posts.length}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{isCafe ? "5.4k" : profile.stats.visits}</Text>
                <Text style={styles.statLabel}>{isCafe ? "Check-ins" : "Visits"}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{isCafe ? "4.8 ★" : profile.stats.favorites}</Text>
                <Text style={styles.statLabel}>{isCafe ? "Rating" : "Favourites"}</Text>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <Button style={{ width: 140, marginRight: 8 }} onPress={() => setIsEditing(!isEditing)}>
                {isEditing ? "Save" : "Edit Profile"}
              </Button>
              <Button style={{ width: 140 }} onPress={() => setShowAddPost(true)}>
                Add Post
              </Button>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity onPress={() => switchTab("photos")}>
              <Grid3X3 size={22} color={activeTab === "photos" ? "#D4A373" : "#777"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => switchTab("reviews")}>
              <Star size={22} color={activeTab === "reviews" ? "#D4A373" : "#777"} />
            </TouchableOpacity>
            {!isCafe && (
              <TouchableOpacity onPress={() => switchTab("saved")}>
                <Bookmark size={22} color={activeTab === "saved" ? "#D4A373" : "#777"} />
              </TouchableOpacity>
            )}
          </View>

          {/* Tab content with fade transition */}
          <Animated.View style={{ opacity: tabFadeAnim }}>
            {/* Posts Grid */}
            {activeTab === "photos" && (
              <View style={styles.grid}>
                {posts.map((post) => (
                  <TouchableOpacity key={post.id} onPress={() => setSelectedPost(post)}>
                    <Image source={{ uri: post.image }} style={{ width: photoSize, height: photoSize, margin: 1, borderRadius: 8 }} />
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
                      { user: "Emma W.", text: "Best flat white in Brooklyn. Always consistent!", stars: 5 },
                      { user: "James K.", text: "Love the reading nook — perfect for WFH days.", stars: 5 },
                      { user: "Aisha M.", text: "Croissants are fresh every morning. Highly recommend!", stars: 4 },
                      { user: "Liam O.", text: "Staff are super friendly, great ambience.", stars: 5 },
                      { user: "Sophie R.", text: "The matcha latte is absolutely divine.", stars: 4 },
                    ]
                  : Array.from({ length: 5 }).map((_, i) => ({
                      user: `User ${i + 1}`,
                      text: "Great place! Love the atmosphere and coffee quality.",
                      stars: 4,
                    }))
                ).map((review, i) => (
                  <View key={i} style={styles.reviewItem}>
                    <Text style={styles.reviewUser}>{review.user}</Text>
                    <Text style={styles.reviewText}>{review.text}</Text>
                    <View style={styles.reviewStars}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} size={16} color={j < review.stars ? "#D4A373" : "#ddd"} fill={j < review.stars ? "#D4A373" : "transparent"} />
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Saved (customer only) */}
            {activeTab === "saved" && !isCafe && (
              <View style={styles.grid}>
                {posts.slice(0, 6).map((post) => (
                  <TouchableOpacity key={post.id} onPress={() => setSelectedPost(post)}>
                    <Image source={{ uri: post.image }} style={{ width: photoSize, height: photoSize, margin: 1, borderRadius: 8 }} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Animated.View>
        </View>
      </Animated.ScrollView>

      {/* Add Post Modal */}
      <Modal visible={showAddPost} animationType="slide">
        <View style={{ flex: 1, backgroundColor: "#f7f3f0", justifyContent: "center", alignItems: "center" }}>
          <View style={{ width: contentWidth, backgroundColor: "#fff", padding: 20, borderRadius: 8 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 20 }}>Add Post</Text>
            <TouchableOpacity onPress={pickImage} style={{ flexDirection: "row", alignItems: "center", marginBottom: 12, padding: 12, borderWidth: 1, borderColor: "#ddd", borderRadius: 8 }}>
              <Camera size={20} color="#777" />
              <Text style={{ marginLeft: 8 }}>Pick an image</Text>
            </TouchableOpacity>
            {selectedImage && (
              <Image source={{ uri: selectedImage.uri }} style={{ width: '100%', height: 150, borderRadius: 8, marginBottom: 12 }} />
            )}
            <TextInput
              placeholder="What's on your mind?"
              value={newPostCaption}
              onChangeText={setNewPostCaption}
              multiline
              style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, borderRadius: 8, height: 100, marginBottom: 20 }}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Button onPress={() => setShowAddPost(false)}>Cancel</Button>
              <Button onPress={handleAddPost}>Post</Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Comment Modal (slide up) */}
      <Modal visible={!!selectedPost} animationType="slide">
        {selectedPost && (
          <View style={{ flex: 1, backgroundColor: "#f7f3f0", justifyContent: "center", alignItems: "center" }}>
            <View style={{ width: contentWidth, backgroundColor: "#fff", flex: 1, borderRadius: 8 }}>
              <ScrollView>
              <Image source={{ uri: selectedPost.image }} style={{ width: '100%', height: 350 }} />
              <View style={{ padding: 16 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <TouchableOpacity onPress={() => handleLike(selectedPost.id)} style={{ flexDirection: "row", alignItems: "center" }}>
                    <Heart size={20} color={selectedPost.liked ? "#D4A373" : "#777"} fill={selectedPost.liked ? "#D4A373" : "transparent"} />
                    <Text style={{ marginLeft: 6, fontSize: 16 }}>{selectedPost.likes} likes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleSave(selectedPost.id)}>
                    <Bookmark size={20} color={selectedPost.saved ? "#D4A373" : "#777"} fill={selectedPost.saved ? "#D4A373" : "transparent"} />
                  </TouchableOpacity>
                </View>
                <Text style={{ marginTop: 10 }}>
                  <Text style={{ fontWeight: "bold" }}>{profile.username}</Text> {selectedPost.caption}
                </Text>
                <View style={{ marginTop: 16 }}>
                  {selectedPost.comments.map((c, i) => (
                    <Text key={i} style={{ marginBottom: 6 }}>
                      <Text style={{ fontWeight: "bold" }}>{c.user}</Text> {c.text}
                    </Text>
                  ))}
                </View>
              </View>
            </ScrollView>

              <View style={{ padding: 10, borderTopWidth: 1, borderColor: "#eee", flexDirection: "row", alignItems: "center" }}>
                <TextInput
                  placeholder="Add a comment..."
                  value={commentInput}
                  onChangeText={setCommentInput}
                  style={{ flex: 1, borderWidth: 1, borderColor: "#ddd", borderRadius: 20, paddingHorizontal: 12 }}
                />
                <TouchableOpacity onPress={handleAddComment}>
                  <Text style={{ marginLeft: 10, fontWeight: "bold", color: "#D4A373" }}>Post</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => setSelectedPost(null)} style={{ padding: 12, alignItems: "center" }}>
                <X size={24} color="#999" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f3f0" },
  header: { padding: 16, alignItems: "center" },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#ddd", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  statsRow: { flexDirection: "row", justifyContent: "space-around", alignItems: "center", width: "100%", marginVertical: 12 },
  stat: { alignItems: "center" },
  statNumber: { fontSize: 18, fontWeight: "bold" },
  statLabel: { fontSize: 12, color: "#777" },
  name: { fontSize: 18, fontWeight: "bold", marginTop: 10 },
  username: { color: "#777" },
  bio: { marginTop: 4 },
  buttonRow: { flexDirection: "row", justifyContent: "center", marginTop: 12 },
  editInput: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 8, marginVertical: 4, fontSize: 16, width: "100%" },
  reviewsContainer: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 16 },
  reviewItem: { backgroundColor: "#f9f9f9", padding: 12, borderRadius: 8, marginBottom: 12 },
  reviewUser: { fontWeight: "bold", marginBottom: 4 },
  reviewText: { marginBottom: 8 },
  reviewStars: { flexDirection: "row" },
  tabs: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#ddd" },
  grid: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
});