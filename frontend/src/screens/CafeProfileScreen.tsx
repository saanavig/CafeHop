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
import { BookOpen, Bookmark, Grid3X3, Heart, Layers, MapPin, Star, Store, X } from "lucide-react-native";
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

    const cafe = {
        name: "Bean & Bloom Café",
        rating: 4.8,
        visits: 5420,
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

    const menuSections = [
    {
        title: "Drinks",
        items: [
        { name: "Latte", price: "$5" },
        { name: "Matcha", price: "$6" },
        { name: "Espresso", price: "$4" },
        ],
    },
    {
        title: "Pastries",
        items: [
        { name: "Croissant", price: "$4" },
        { name: "Banana Bread", price: "$5" },
        ],
    },
    ];

    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [carouselIndex, setCarouselIndex] = useState(0);

    const handleLike = (id: number) => {
        setPosts((prev) =>
        prev.map((p) =>
            p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
        )
        );
    };

    return (
        <View style={styles.container}>
        <Animated.ScrollView
            contentContainerStyle={{ paddingBottom: scale(100) }}
            style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
            {/* HERO */}
            <View style={styles.hero}>
            <Image source={{ uri: "https://picsum.photos/800" }} style={styles.heroImage} />
            <View style={styles.heroOverlay}>
                <Text style={styles.heroTitle}>{cafe.name}</Text>
                <Text style={styles.heroSubtitle}>
                ⭐ {cafe.rating} • {cafe.location}
                </Text>
            </View>
            </View>

            {/* CONTENT WRAPPER */}
            <View style={{ width: contentWidth, alignSelf: "center" }}>

            <View style={styles.header}>
                <View style={styles.avatar}>
                <Store size={scale(44)} color="#888" />
                </View>

                <Text style={styles.name}>{cafe.name}</Text>
                <Text style={styles.bio}>
                {cafe.tags.join(" • ")} • {cafe.open}
                </Text>

            <View style={styles.statsRow}>
                <View style={styles.stat}>
                    <Text style={styles.statNumber}>{posts.length}</Text>
                    <Text style={styles.statLabel}>Posts</Text>
                </View>

                <View style={styles.stat}>
                    <Text style={styles.statNumber}>{cafe.visits}</Text>
                    <Text style={styles.statLabel}>Visits</Text>
                </View>

                <View style={styles.stat}>
                    <Text style={styles.statNumber}>{cafe.rating}</Text>
                    <Text style={styles.statLabel}>Rating</Text>
                </View>

                <View style={styles.stat}>
                    <Text style={styles.statNumber}>$$</Text>
                    <Text style={styles.statLabel}>Price</Text>
                </View>
                </View>
            </View>

            {/* ICON TABS (MATCH USER PROFILE) */}
            <View style={styles.tabs}>
                <TouchableOpacity onPress={() => switchTab("posts")}>
                <Grid3X3 size={22} color={activeTab === "posts" ? "#D4A373" : "#777"} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => switchTab("menu")}>
                <BookOpen size={22} color={activeTab === "menu" ? "#D4A373" : "#777"} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => switchTab("reviews")}>
                <Star size={22} color={activeTab === "reviews" ? "#D4A373" : "#777"} />
                </TouchableOpacity>
            </View>

            <Animated.View style={{ opacity: tabFadeAnim }}>

                {/* POSTS */}
                {activeTab === "posts" && (
                <View style={styles.grid}>
                    {posts.map((post) => (
                    <TouchableOpacity key={post.id} onPress={() => setSelectedPost(post)}>
                        <Image
                        source={{ uri: post.images[0] }}
                        style={{
                            width: photoSize,
                            height: photoSize,
                            margin: 1,
                            borderRadius: scale(4),
                        }}
                        />
                    </TouchableOpacity>
                    ))}
                </View>
                )}

                {/* MENU */}
                {activeTab === "menu" && (
                <View style={styles.section}>
                    {menuSections.map((section, i) => (
                    <View key={i} style={{ marginBottom: scale(16) }}>
                        
                        {/* Section Title */}
                        <Text style={styles.menuSectionTitle}>
                        {section.title}
                        </Text>

                        {/* Items */}
                        {section.items.map((item, j) => (
                        <View key={j} style={styles.menuItem}>
                            <Text style={styles.menuItemName}>{item.name}</Text>
                            <Text style={styles.menuItemPrice}>{item.price}</Text>
                        </View>
                        ))}
                    </View>
                    ))}
                </View>
                )}

                {/* REVIEWS */}
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
            </View>
        </Animated.ScrollView>

        {/* MODAL (unchanged behavior) */}
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

    // HERO
    hero: { position: "relative" },
    heroImage: { width: "100%", height: scale(200) },
    heroOverlay: {
        position: "absolute",
        bottom: scale(12),
        left: scale(12),
        right: scale(12),
    },
    heroTitle: { color: "#FFF", fontSize: 18, fontWeight: "700" },
    heroSubtitle: { color: "#FFF", fontSize: 12, marginTop: 4 },

    header: { padding: scale(16), alignItems: "center" },
    avatar: {
        width: scale(100),
        height: scale(100),
        borderRadius: scale(50),
        backgroundColor: "#E8DFD5",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: scale(12),
    },
    name: {
        fontSize: moderateScale(18),
        fontWeight: "700",
        color: "#1A1A1A",
        marginTop: scale(4),
    },
    bio: {
        fontSize: moderateScale(13),
        color: "#777",
        textAlign: "center",
        marginTop: scale(4),
        lineHeight: moderateScale(18),
    },

    statsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        marginVertical: scale(14),
    },
    stat: { alignItems: "center" },
    statNumber: {
        fontSize: moderateScale(18),
        fontWeight: "700",
        color: "#1A1A1A",
    },
    statLabel: {
        fontSize: moderateScale(12),
        color: "#888",
        marginTop: scale(2),
    },

    // TABS
    tabs: {
        flexDirection: "row",
        justifyContent: "space-around",
        paddingVertical: scale(12),
        borderBottomWidth: 1,
        borderBottomColor: "#DDD",
    },

    // GRID
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: scale(2),
    },

    // SECTIONS
    section: { padding: scale(16) },

    // CARDS (match user profile)
    card: {
        backgroundColor: "#FFF",
        padding: scale(14),
        borderRadius: scale(12),
        marginBottom: scale(12),
        borderWidth: 1,
        borderColor: "#EEE",
    },
    cardTitle: {
        fontWeight: "600",
        fontSize: moderateScale(14),
        color: "#1A1A1A",
    },
    cardSubtitle: {
        color: "#777",
        marginTop: 4,
    },

    closeBtn: {
        position: "absolute",
        top: 40,
        right: 20,
        zIndex: 10,
    },
    modalContent: { padding: 12 },

    menuSectionTitle: {
        fontSize: moderateScale(14),
        fontWeight: "700",
        color: "#1A1A1A",
        marginBottom: scale(8),
        },

        menuItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: scale(10),
        borderBottomWidth: 1,
        borderBottomColor: "#EEE",
        },

        menuItemName: {
        fontSize: moderateScale(13),
        color: "#333",
        },

        menuItemPrice: {
        fontSize: moderateScale(13),
        color: "#777",
        },
});