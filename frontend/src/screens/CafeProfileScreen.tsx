import {
    Animated,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Bookmark, Heart, Layers, MapPin, Star, X } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { deviceWidth, moderateScale, scale } from "../utils/responsive";

const SCREEN_WIDTH = deviceWidth;

    type Comment = { text: string };
    type Post = {
    id: number;
    images: string[];
    likes: number;
    liked: boolean;
    comments: Comment[];
    caption?: string;
    location?: string;
    saved?: boolean;
    };

    export default function CafeProfileScreen() {
    const contentWidth = Math.min(deviceWidth * 0.9, 480);
    const photoSize = (contentWidth - 6) / 3;

    // ─── Mock Data (replace later with backend) ───
    const cafe = {
        name: "Bean & Bloom Café",
        rating: 4.8,
        location: "Brooklyn, NY",
        open: "Open until 8:00 PM",
        tags: ["Aesthetic", "Study Spot"],
    };

    const [activeTab, setActiveTab] = useState<"posts" | "menu" | "reviews">("posts");

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(18)).current;
    const tabFadeAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 380, useNativeDriver: true }),
        ]).start();
    }, []);

    const switchTab = (tab: "posts" | "menu" | "reviews") => {
        Animated.timing(tabFadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
        setActiveTab(tab);
        Animated.timing(tabFadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
        });
    };

    // ─── Posts ───
    const [posts, setPosts] = useState<Post[]>(
        Array.from({ length: 9 }).map((_, i) => ({
        id: i,
        images: [`https://picsum.photos/seed/cafe${i}/400`],
        likes: Math.floor(Math.random() * 200),
        liked: false,
        comments: [{ text: "Looks amazing!" }],
        caption: "Cozy vibes ☕",
        location: "Brooklyn, NY",
        }))
    );

    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [carouselIndex, setCarouselIndex] = useState(0);

    const handleLike = (id: number) => {
        setPosts((prev) =>
        prev.map((p) =>
            p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
        )
        );
    };

    // ─── Render ───
    return (
        <View style={styles.container}>
        <Animated.ScrollView
            contentContainerStyle={{ paddingBottom: scale(100) }}
            style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
            {/* ── Hero Section ── */}
            <View style={styles.hero}>
            <Image
                source={{ uri: "https://picsum.photos/800" }}
                style={styles.heroImage}
            />
            <View style={styles.heroOverlay}>
                <Text style={styles.heroTitle}>{cafe.name}</Text>
                <Text style={styles.heroSubtitle}>
                ⭐ {cafe.rating} • {cafe.location} • Open Now
                </Text>

                <View style={styles.heroButtons}>
                <TouchableOpacity style={styles.heroBtn}>
                    <Heart size={16} color="#FFF" />
                    <Text style={styles.heroBtnText}>Favorite</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.heroBtn}>
                    <MapPin size={16} color="#FFF" />
                    <Text style={styles.heroBtnText}>Directions</Text>
                </TouchableOpacity>
                </View>
            </View>
            </View>

            {/* ── Quick Info ── */}
            <View style={styles.infoRow}>
            <Text style={styles.infoText}>
                {cafe.open} • $$ • {cafe.tags.join(" • ")}
            </Text>
            </View>

            {/* ── Tabs ── */}
            <View style={styles.tabs}>
            <TouchableOpacity onPress={() => switchTab("posts")}>
                <Text style={activeTab === "posts" ? styles.activeTab : styles.tab}>Posts</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => switchTab("menu")}>
                <Text style={activeTab === "menu" ? styles.activeTab : styles.tab}>Menu</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => switchTab("reviews")}>
                <Text style={activeTab === "reviews" ? styles.activeTab : styles.tab}>Reviews</Text>
            </TouchableOpacity>
            </View>

            <Animated.View style={{ opacity: tabFadeAnim }}>

            {/* ── POSTS ── */}
            {activeTab === "posts" && (
                <View style={styles.grid}>
                {posts.map((post) => (
                    <TouchableOpacity key={post.id} onPress={() => setSelectedPost(post)}>
                    <Image
                        source={{ uri: post.images[0] }}
                        style={{ width: photoSize, height: photoSize, margin: 1 }}
                    />
                    </TouchableOpacity>
                ))}
                </View>
            )}

            {/* ── MENU ── */}
            {activeTab === "menu" && (
                <View style={styles.section}>
                {[
                    { name: "Latte", price: "$5" },
                    { name: "Matcha", price: "$6" },
                    { name: "Croissant", price: "$4" },
                ].map((item, i) => (
                    <View key={i} style={styles.card}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardSubtitle}>{item.price}</Text>
                    </View>
                ))}
                </View>
            )}

            {/* ── REVIEWS ── */}
            {activeTab === "reviews" && (
                <View style={styles.section}>
                {[1, 2, 3].map((_, i) => (
                    <View key={i} style={styles.card}>
                    <Text style={styles.cardTitle}>Amazing coffee!</Text>
                    <View style={{ flexDirection: "row", marginTop: 4 }}>
                        {Array.from({ length: 5 }).map((__, j) => (
                        <Star key={j} size={14} color={j < 4 ? "#D4A373" : "#ddd"} fill={j < 4 ? "#D4A373" : "transparent"} />
                        ))}
                    </View>
                    </View>
                ))}
                </View>
            )}

            </Animated.View>
        </Animated.ScrollView>

        {/* ── POST MODAL ── */}
        <Modal visible={!!selectedPost} animationType="slide">
            {selectedPost && (
            <View style={{ flex: 1, backgroundColor: "#FFF" }}>
                <TouchableOpacity onPress={() => setSelectedPost(null)} style={styles.closeBtn}>
                <X size={20} />
                </TouchableOpacity>

                <FlatList
                data={selectedPost.images}
                horizontal
                pagingEnabled
                renderItem={({ item }) => (
                    <Image source={{ uri: item }} style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }} />
                )}
                />

                <View style={styles.modalContent}>
                <Text>{selectedPost.caption}</Text>
                <Text>{selectedPost.likes} likes</Text>
                </View>
            </View>
            )}
        </Modal>
        </View>
    );
    }

    const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F7F3F0" },

    hero: { position: "relative" },
    heroImage: { width: "100%", height: scale(200) },
    heroOverlay: {
        position: "absolute",
        bottom: scale(12),
        left: scale(12),
    },
    heroTitle: { color: "#FFF", fontSize: 20, fontWeight: "700" },
    heroSubtitle: { color: "#FFF", fontSize: 12, marginTop: 4 },

    heroButtons: { flexDirection: "row", marginTop: 8 },
    heroBtn: {
        flexDirection: "row",
        backgroundColor: "rgba(0,0,0,0.4)",
        padding: 6,
        borderRadius: 6,
        marginRight: 8,
    },
    heroBtnText: { color: "#FFF", marginLeft: 4 },

    infoRow: { padding: 12 },
    infoText: { color: "#777" },

    tabs: {
        flexDirection: "row",
        justifyContent: "space-around",
        borderBottomWidth: 1,
        borderColor: "#DDD",
        paddingVertical: 10,
    },
    tab: { color: "#777" },
    activeTab: { color: "#D4A373", fontWeight: "700" },

    grid: { flexDirection: "row", flexWrap: "wrap" },

    section: { padding: 12 },
    card: {
        backgroundColor: "#FFF",
        padding: 12,
        borderRadius: 10,
        marginBottom: 10,
    },
    cardTitle: { fontWeight: "600" },
    cardSubtitle: { color: "#777", marginTop: 4 },

    closeBtn: { position: "absolute", top: 40, right: 20, zIndex: 10 },

    modalContent: { padding: 12 },
});