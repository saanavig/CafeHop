import * as ImagePicker from "expo-image-picker";

import {
    ActivityIndicator,
    Animated,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { BookOpen, Grid3X3, Pencil, Star, Store } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { deviceWidth, moderateScale, scale, verticalScale } from "../utils/responsive";

import BottomNav from "../components/ui/BottomNav";
import { TextInput } from "react-native";
import { supabase } from "../api/supabaseClient";

const SCREEN_WIDTH = deviceWidth;

    type Comment = { text: string };
    type Post = {
    id: string | number;
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
    const [cafeId, setCafeId] = useState<string | null>(null);
    const [newName, setNewName] = useState("");
    const [newPrice, setNewPrice] = useState("");
    const [newCategory, setNewCategory] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [addingItemCategory, setAddingItemCategory] = useState<string | null>(null);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
    const [formError, setFormError] = useState("");
    const [addingItem, setAddingItem] = useState(false);
    const [newDescription, setNewDescription] = useState("");
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editPrice, setEditPrice] = useState("");
    const [editCategory, setEditCategory] = useState("");
    const [newImage, setNewImage] = useState<string | null>(null);
    const [editImage, setEditImage] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const cafe = {
        name: "Bean & Bloom Cafe",
        rating: 4.8,
        visits: 5420,
        location: "Brooklyn, NY",
        open: "Open until 8:00 PM",
        tags: ["Aesthetic", "Study Spot"],
    };

    const [userId, setUserId] = useState<string | null>(null);
    const [ownerId, setOwnerId] = useState<string | null>(null);

    useEffect(() => {
        const getUser = async () => {
            const { data } = await supabase.auth.getUser();
            setUserId(data.user?.id || null);
        };

        getUser();
    }, []);

    const isOwner = userId && ownerId && userId === ownerId;

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
        });

        if (!result.canceled) {
            setNewImage(result.assets[0].uri);
        }
    };

    const [activeTab, setActiveTab] = useState<"posts" | "menu" | "reviews">("posts");

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(scale(18))).current;
    const tabFadeAnim = useRef(new Animated.Value(1)).current;

    const handleDeleteItem = async (item: any) => {
    const token = (await supabase.auth.getSession()).data.session?.access_token;

    await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/cafes/${cafeId}/menu/items/${item.id}`, {
        method: "DELETE",
        headers: {
        Authorization: `Bearer ${token}`,
        },
    });

    setMenuItems((prev) => prev.filter((i) => i.id !== item.id));
    };

    useEffect(() => {
        if (!userId) return;

        const fetchCafe = async () => {
            const { data, error } = await supabase
            .from("cafes")
            .select("id, owner_id")
            .eq("owner_id", userId)
            .single();

            if (data) {
                setCafeId(data.id);
                setOwnerId(data.owner_id);
            }
        };

    fetchCafe();
    }, [userId]);

    const [menuItems, setMenuItems] = useState<any[]>([]);
    useEffect(() => {
        if (!cafeId) return;

        const fetchMenu = async () => {
        const res = await fetch(
            `${process.env.EXPO_PUBLIC_API_URL}/api/cafes/${cafeId}/menu`
        );

        const data = await res.json();

            if (data?.menu_items) {
                setMenuItems(data.menu_items);
            }
        };

        fetchMenu();
        }, [cafeId]);

    const groupMenuByCategory = (items: any[]) => {
        const grouped: any = {};

        items.forEach((item) => {
            if (!grouped[item.category]) {
            grouped[item.category] = [];
            }

            grouped[item.category].push({
            id: item.id,
            name: item.name,
            price: item.price,
            image_url: item.image_url, 
            description: item.description, 
            });
        });

        return Object.keys(grouped).map((category) => ({
            title: category,
            items: grouped[category],
        }));
    };
    const rawSections = groupMenuByCategory(menuItems);
    const hasMenu = rawSections.length > 0;
    const categories = rawSections.map((section) => section.title);

    const menuSections = rawSections;

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

    const handleCreateMenu = () => {
        setIsEditing(true);
        setAddingItemCategory('GLOBAL');
    };

    const [posts, setPosts] = useState<Post[]>([]);
    const [postsLoading, setPostsLoading] = useState(false);

    useEffect(() => {
        if (!cafeId) return;
        const fetchPosts = async () => {
            setPostsLoading(true);
            try {
                const { data } = await supabase
                    .from("posts")
                    .select("id, caption, created_at, post_media(id, file_url, file_type)")
                    .eq("cafe_id", cafeId)
                    .order("created_at", { ascending: false });
                if (data) {
                    const mapped = data
                        .map((p: any) => ({
                            id: p.id,
                            images: (p.post_media ?? [])
                                .filter((m: any) => m.file_type === "image" && m.file_url)
                                .map((m: any) => m.file_url as string),
                            likes: 0,
                            liked: false,
                            comments: [],
                            caption: p.caption ?? "",
                        }))
                        .filter((p: any) => p.images.length > 0);
                    setPosts(mapped);
                }
            } finally {
                setPostsLoading(false);
            }
        };
        fetchPosts();
    }, [cafeId]);


    const handleCreateCategory = async () => {
    if (!cafeId) return;

    const token = (await supabase.auth.getSession()).data.session?.access_token;

    const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/cafes/${cafeId}/menu/items`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            cafe_id: cafeId,
            name: newName,
            price: newPrice,
            category: newCategory,
            image_url: null,
            description: newDescription || null,
        }),
        }
    );

    const data = await res.json();

    if (data?.item) {
        setMenuItems((prev) => [...prev, data.item]);
    }
    };

    const handleAddItemWithCategory = async (category: string) => {
    const token = (await supabase.auth.getSession()).data.session?.access_token;

    const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/cafes/${cafeId}/menu/items`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            cafe_id: cafeId,
            name: "New Item",
            price: "0",
            category,
        }),
        }
    );

    const data = await res.json();

    if (data?.item) {
        setMenuItems((prev) => [...prev, data.item]);
    }
    };

    const handleRenameCategory = async (oldCategory: string) => {
    if (!newCategoryName || newCategoryName === oldCategory) {
        setEditingCategory(null);
        return;
    }

    setMenuItems((prev) =>
        prev.map((item) =>
        item.category === oldCategory
            ? { ...item, category: newCategoryName }
            : item
        )
    );

    setEditingCategory(null);
    };

    const inputStyle = {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: scale(8),
        padding: scale(10),
        marginBottom: verticalScale(10),
    };

    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [carouselIndex, setCarouselIndex] = useState(0);

    const handleLike = (id: number) => {
        setPosts((prev) =>
        prev.map((p) =>
            p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
        )
        );
    };

    const uploadImage = async (uri: string) => {
        const response = await fetch(uri);
        const blob = await response.blob();

        const fileName = `${Date.now()}.jpg`;

        const { data, error } = await supabase.storage
            .from("menu-images")
            .upload(fileName, blob, {
                contentType: "image/jpeg",
            });

        if (error) {
            console.error("Upload error:", error);
            return null;
        }

        const { data: publicUrlData } = supabase.storage
            .from("menu-images")
            .getPublicUrl(fileName);

        return publicUrlData.publicUrl;
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
                <Grid3X3 size={scale(22)} color={activeTab === "posts" ? "#D4A373" : "#777"} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => switchTab("menu")}>
                <BookOpen size={scale(22)} color={activeTab === "menu" ? "#D4A373" : "#777"} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => switchTab("reviews")}>
                <Star size={scale(22)} color={activeTab === "reviews" ? "#D4A373" : "#777"} />
                </TouchableOpacity>
            </View>

            <Animated.View style={{ opacity: tabFadeAnim }}>

                {/* POSTS */}
                {activeTab === "posts" && (
                  postsLoading ? (
                    <View style={{ alignItems: "center", paddingVertical: verticalScale(48) }}>
                      <ActivityIndicator size="small" color="#D4A373" />
                    </View>
                  ) : posts.length === 0 ? (
                    <View style={{ alignItems: "center", paddingVertical: verticalScale(48), gap: verticalScale(8) }}>
                      <Text style={{ fontSize: moderateScale(15), fontWeight: "600", color: "#BBB" }}>
                        No posts yet
                      </Text>
                      {isOwner && (
                        <Text style={{ fontSize: moderateScale(13), color: "#D4A373" }}>
                          Share your first photo!
                        </Text>
                      )}
                    </View>
                  ) : (
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
                  )
                )}

                {/* MENU */}
                {activeTab === "menu" && (
                <View style={styles.section}>

                {/* EMPTY STATE */}
                {!hasMenu && !isEditing && (
                <View style={{ marginTop: verticalScale(40), alignItems: "center" }}>
                    <Text style={{ color: "#777", marginBottom: verticalScale(12), fontSize: moderateScale(14) }}>
                        {isEditing ? "No Menu Yet" : "No menu yet"}
                    </Text>

                    <TouchableOpacity
                    onPress={handleCreateMenu}
                    style={{
                        backgroundColor: "#D4A373",
                        paddingHorizontal: scale(18),
                        paddingVertical: scale(12),
                        borderRadius: scale(10),
                    }}
                    >
                    <Text style={{ color: "#fff", fontWeight: "600", fontSize: moderateScale(14) }}>
                        Create Menu
                    </Text>
                    </TouchableOpacity>

                </View>
                )}
                {(hasMenu || isEditing) && (
                <>
                    {/* EDIT ICON */}
                    <TouchableOpacity
                    onPress={() => {
                        if (!isOwner) return;
                        setIsEditing((prev) => !prev);
                    }}
                    style={{
                        position: "absolute",
                        right: scale(8),
                        top: verticalScale(20),
                        padding: scale(8),
                        backgroundColor: "#fff",
                        borderRadius: scale(20),
                        elevation: 3,
                        zIndex: 10,
                    }}
                    >
                    {isEditing ? (
                        <Text style={{ color: "#D4A373", fontWeight: "600", fontSize: moderateScale(14) }}>
                        Done
                        </Text>
                    ) : (
                        <Pencil size={scale(18)} color="#D4A373" />
                    )}
                    </TouchableOpacity>

                        {/* EDIT MODE LABEL */}
                        <View
                        style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            marginTop: verticalScale(20),
                            alignItems: "center",
                            marginBottom: verticalScale(10),
                        }}
                        >
                        <Text
                            style={{
                                color: "#D4A373",
                                fontWeight: "700",
                                fontSize: moderateScale(16),
                                textAlign: "center",
                                width: "100%",
                                marginBottom: verticalScale(6),
                            }}
                        >
                            {isEditing ? "Editing Menu" : "Menu"}
                        </Text>
                        </View>

                        {/* ADD ITEM */}
                        {isEditing && (
                        <TouchableOpacity
                            onPress={() => setAddingItemCategory("GLOBAL")}
                            style={{
                            backgroundColor: "#D4A373",
                            paddingVertical: scale(10),
                            borderRadius: scale(10),
                            marginBottom: verticalScale(12),
                            }}
                        >
                            <Text style={{ color: "#fff", textAlign: "center", fontWeight: "600", fontSize: moderateScale(14) }}>
                            + Add Item
                            </Text>
                        </TouchableOpacity>
                        )}

                        {/* MENU CONTENT */}
                        {isEditing && (
                        <View
                            style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            marginBottom: verticalScale(6),
                            paddingBottom: verticalScale(4),
                            borderBottomWidth: 1,
                            borderBottomColor: "#DDD",
                            }}
                        >
                            <Text style={{ flex: 1, fontWeight: "600", color: "#888", fontSize: moderateScale(13) }}>
                            Item
                            </Text>
                            <Text style={{ width: scale(60), textAlign: "right", color: "#888", fontSize: moderateScale(13) }}>
                            Price
                            </Text>
                            <Text style={{ width: scale(40), textAlign: "right", color: "#888", fontSize: moderateScale(13) }}>
                            Edit
                            </Text>
                        </View>
                        )}

                        {isEditing && addingItemCategory === "GLOBAL" && (
                        <View
                        style={{
                            backgroundColor: "#FFF",
                            borderRadius: scale(12),
                            padding: scale(14),
                            marginBottom: verticalScale(16),
                            borderWidth: 1,
                            borderColor: "#E5DED6",
                        }}
                    >

                    {/* HEADER WITH X */}
                    <View
                        style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: verticalScale(10),
                        }}
                    >
                        <Text style={{ fontWeight: "600", fontSize: moderateScale(16) }}>
                            Add Item
                        </Text>

                        <TouchableOpacity
                            onPress={() => {
                                setAddingItemCategory(null);
                                setFormError("");
                                setNewName("");
                                setNewPrice("");
                                setNewCategory("");
                                setNewImage(null);
                            }}
                            style={{
                                padding: scale(6),
                                backgroundColor: "#F3F0EC",
                                borderRadius: scale(20),
                            }}
                        >
                            <Text style={{ fontSize: moderateScale(16), fontWeight: "600" }}>×</Text>
                        </TouchableOpacity>

                    </View>
                            {/* NAME */}
                            <TextInput
                            placeholder="Item name"
                            value={newName}
                            onChangeText={setNewName}
                            style={inputStyle}
                            />

                            {/* DESCRIPTION */}
                            <TextInput
                            placeholder="Description (optional)"
                            value={newDescription}
                            onChangeText={setNewDescription}
                            style={[inputStyle, { minHeight: verticalScale(60) }]}
                            multiline
                            textAlignVertical="top"
                            />

                            {/* PRICE */}
                            <TextInput
                                placeholder="Price"
                                value={newPrice}
                                onChangeText={(text) => {
                                    setNewPrice(text);

                                    // validate live
                                    if (text && isNaN(Number(text))) {
                                        setFormError("Price must be a numberic value only");
                                    } else {
                                        setFormError("");
                                    }
                                }}
                                keyboardType="numeric"
                                style={inputStyle}
                            />

                            <TouchableOpacity
                                onPress={pickImage}
                                style={{
                                    backgroundColor: "#F3F0EC",
                                    padding: scale(10),
                                    borderRadius: scale(8),
                                    marginBottom: verticalScale(10),
                                    alignItems: "center",
                                }}
                            >
                                <Text style={{ fontSize: moderateScale(14) }}>{newImage ? "Change Image" : "Add Image"}</Text>
                            </TouchableOpacity>
                            {newImage && (
                            <Image
                                source={{ uri: newImage }}
                                style={{ width: "100%", height: verticalScale(120), borderRadius: scale(8), marginBottom: verticalScale(10) }}
                            />
                            )}

                            {/* CATEGORY DROPDOWN */}
                            <View style={{ marginBottom: 10 }}>
                            {/* Dropdown trigger */}
                            <TouchableOpacity
                                onPress={() => setShowCategoryDropdown((prev) => !prev)}
                                style={{
                                borderWidth: 1,
                                borderColor: "#ddd",
                                borderRadius: scale(8),
                                padding: scale(10),
                                backgroundColor: "#fff",
                                }}
                            >
                                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                <Text style={{ color: newCategory ? "#000" : "#888" }}>
                                    {newCategory || "Select Category"}
                                </Text>
                                <Text>▼</Text>
                                </View>
                            </TouchableOpacity>

                            {/* Dropdown list */}
                            {showCategoryDropdown && (
                                <View
                                style={{
                                    borderWidth: 1,
                                    borderColor: "#ddd",
                                    borderRadius: scale(8),
                                    marginTop: verticalScale(6),
                                    backgroundColor: "#fff",
                                    elevation: 4,
                                    zIndex: 10,
                                }}
                                >
                                {categories.length > 0 ? (
                                    categories.map((cat, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => {
                                        setNewCategory(cat);
                                        setShowCategoryDropdown(false);
                                        setIsAddingNewCategory(false);
                                        }}
                                        style={{ padding: scale(10) }}
                                    >
                                        <Text style={{ fontSize: moderateScale(14) }}>{cat}</Text>
                                    </TouchableOpacity>
                                    ))
                                ) : (
                                    <Text style={{ padding: 10, color: "#888" }}>
                                    No categories yet
                                    </Text>
                                )}

                                {/* Add new category button */}
                                <TouchableOpacity
                                    onPress={() => setIsAddingNewCategory(true)}
                                    style={{
                                    padding: scale(10),
                                    borderTopWidth: 1,
                                    borderTopColor: "#eee",
                                    }}
                                >
                                    <Text style={{ color: "#D4A373" }}>
                                    + Add new category
                                    </Text>
                                </TouchableOpacity>

                                {/* New category input */}
                                {isAddingNewCategory && (
                                    <View style={{ padding: 10 }}>
                                    <TextInput
                                        placeholder="New category name"
                                        value={newCategory}
                                        onChangeText={setNewCategory}
                                        autoFocus
                                        style={{
                                        borderWidth: 1,
                                        borderColor: "#ddd",
                                        borderRadius: scale(6),
                                        padding: scale(8),
                                        fontSize: moderateScale(14),
                                        }}
                                    />

                                    <TouchableOpacity
                                        onPress={() => {
                                        if (!newCategory) return;

                                        setIsAddingNewCategory(false);
                                        setShowCategoryDropdown(false);
                                        }}
                                        style={{
                                        marginTop: verticalScale(8),
                                        backgroundColor: "#D4A373",
                                        padding: scale(8),
                                        borderRadius: scale(6),
                                        }}
                                    >
                                        <Text style={{ color: "#fff", textAlign: "center" }}>
                                        Add Category
                                        </Text>
                                    </TouchableOpacity>
                                    </View>
                                )}
                                </View>
                            )}
                            </View>

                            {formError ? (
                            <Text style={{ color: "red", marginBottom: 8 }}>
                                {formError}
                            </Text>
                            ) : null}

                            <TouchableOpacity
                            disabled={addingItem}
                            onPress={async () => {
                                if (!newName || !newPrice || !newCategory) {
                                    setFormError("Please fill out all fields");
                                    return;
                                }

                                const exists = menuItems.some((item) => {
                                return (
                                    item.category?.trim().toLowerCase() === newCategory.trim().toLowerCase() &&
                                    item.name?.trim().toLowerCase() === newName.trim().toLowerCase()
                                );
                                });

                                if (exists) {
                                    setFormError("This item already exists in this category");
                                    return;
                                }

                                if (isNaN(Number(newPrice))) {
                                    setFormError("Price must be a valid number");
                                    return;
                                }

                                setAddingItem(true);
                                setFormError("");
                                try {
                                    let imageUrl = null;
                                    if (newImage) {
                                        imageUrl = await uploadImage(newImage);
                                        if (imageUrl === null) {
                                            setFormError("Image upload failed. Try again.");
                                            return;
                                        }
                                    }

                                    const token = (await supabase.auth.getSession()).data.session?.access_token;

                                    const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/cafes/${cafeId}/menu/items`, {
                                        method: "POST",
                                        headers: {
                                        "Content-Type": "application/json",
                                        Authorization: `Bearer ${token}`,
                                        },
                                        body: JSON.stringify({
                                        cafe_id: cafeId,
                                        name: newName,
                                        price: newPrice,
                                        category: newCategory,
                                        image_url: imageUrl,
                                        description: newDescription || null,
                                        }),
                                    }
                                    );

                                    const data = await res.json();

                                    if (data?.item) {
                                    setMenuItems((prev) => [...prev, data.item]);
                                    }

                                    setNewName("");
                                    setNewPrice("");
                                    setNewCategory("");
                                    setNewDescription("");
                                    setNewImage(null);
                                    setAddingItemCategory(null);
                                } catch {
                                    setFormError("Something went wrong. Please try again.");
                                } finally {
                                    setAddingItem(false);
                                }
                            }}
                            style={{
                                backgroundColor: addingItem ? "#E5C9A8" : "#D4A373",
                                padding: scale(12),
                                borderRadius: scale(10),
                                flexDirection: "row",
                                justifyContent: "center",
                                alignItems: "center",
                                gap: scale(8),
                            }}
                            >
                            {addingItem
                                ? <ActivityIndicator size="small" color="#FFF" />
                                : <Text style={{ color: "#fff", textAlign: "center", fontSize: moderateScale(14) }}>Add Item</Text>
                            }
                            </TouchableOpacity>
                        </View>
                        )}

                        {menuSections.map((section, i) => (
                        <View key={i} style={{ marginBottom: scale(16) }}>
                            {isEditing ? (
                                editingCategory === section.title ? (
                                    <TextInput
                                    value={newCategoryName}
                                    onChangeText={setNewCategoryName}
                                    onBlur={() => handleRenameCategory(section.title)}
                                    autoFocus
                                    style={{
                                        fontSize: moderateScale(14),
                                        fontWeight: "700",
                                        color: "#1A1A1A",
                                        backgroundColor: "#F3F0EC",
                                        padding: scale(6),
                                        borderRadius: scale(6),
                                        marginBottom: scale(8),
                                    }}
                                    />
                                ) : (
                                    <TouchableOpacity
                                    onPress={() => {
                                        setEditingCategory(section.title);
                                        setNewCategoryName(section.title);
                                    }}
                                    >
                                    <Text style={styles.menuSectionTitle}>
                                        {section.title}
                                    </Text>
                                    </TouchableOpacity>
                                )
                                ) : (
                                <Text style={styles.menuSectionTitle}>
                                    {section.title}
                                </Text>
                                )}

                                {section.items.map((item: any, j: number) => (
                                    <View key={j}>
                                        {/* ROW */}
                                        <View style={styles.menuItem}>
                                            {isEditing ? (
                                                <>
                                                <Image
                                                    source={
                                                        item.image_url
                                                            ? { uri: item.image_url }
                                                            : undefined
                                                    }
                                                    style={{
                                                        width: scale(30),
                                                        height: scale(30),
                                                        borderRadius: scale(6),
                                                        backgroundColor: "#E8DFD5",
                                                        marginRight: scale(8),
                                                    }}
                                                />

                                                    <TextInput
                                                        value={editingItemId === item.id ? editName : item.name}
                                                        onChangeText={setEditName}
                                                        editable={editingItemId === item.id}
                                                        style={{
                                                            flex: 1,
                                                            backgroundColor: "#F3F0EC",
                                                            padding: scale(6),
                                                            borderRadius: scale(6),
                                                            fontSize: moderateScale(13),
                                                        }}
                                                    />

                                                    <TextInput
                                                        value={editingItemId === item.id ? editPrice : item.price}
                                                        onChangeText={setEditPrice}
                                                        editable={editingItemId === item.id}
                                                        style={{
                                                            width: scale(60),
                                                            textAlign: "right",
                                                            backgroundColor: "#F3F0EC",
                                                            padding: scale(6),
                                                            borderRadius: scale(6),
                                                            marginLeft: scale(10),
                                                            fontSize: moderateScale(13),
                                                        }}
                                                    />

                                                    {/* ✏️ + 🗑 ICONS */}
                                                    <View style={{ flexDirection: "row", marginLeft: scale(10) }}>
                                                        <TouchableOpacity
                                                            onPress={() => {
                                                                setEditingItemId(item.id);
                                                                setEditName(item.name);
                                                                setEditPrice(item.price);
                                                                setEditCategory(section.title);
                                                                setEditImage(item.image_url || null);
                                                            }}
                                                            style={{ marginRight: scale(10) }}
                                                        >
                                                            <Text>✏️</Text>
                                                        </TouchableOpacity>

                                                        <TouchableOpacity onPress={() => handleDeleteItem(item)}>
                                                            <Text>🗑</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </>
                                            ) : (
                                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                                                {/* LEFT SIDE: IMAGE + NAME */}
                                                <View style={{ flexDirection: "row", alignItems: "center", gap: scale(10) }}>
                                                    <TouchableOpacity
                                                    onPress={() => {
                                                        if (item.image_url) {
                                                            setPreviewImage(item.image_url);
                                                        }
                                                    }}
                                                >
                                                    <Image
                                                        source={
                                                            item.image_url
                                                                ? { uri: item.image_url }
                                                                : undefined
                                                        }
                                                        style={{
                                                            width: scale(40),
                                                            height: scale(40),
                                                            borderRadius: scale(8),
                                                            backgroundColor: "#E8DFD5",
                                                        }}
                                                    />
                                                </TouchableOpacity>

                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.menuItemName}>{item.name}</Text>
                                                        {item.description ? (
                                                            <Text style={{ fontSize: moderateScale(11), color: "#888", marginTop: scale(2) }}>
                                                                {item.description}
                                                            </Text>
                                                        ) : null}
                                                    </View>
                                                </View>

                                                {/* RIGHT SIDE: PRICE */}
                                                <Text style={styles.menuItemPrice}>${item.price}</Text>
                                            </View>
                                            )}
                                        </View>

                                        {editingItemId === item.id && (
                                            <View
                                                style={{
                                                    backgroundColor: "#FFF",
                                                    borderRadius: scale(10),
                                                    padding: scale(10),
                                                    marginTop: verticalScale(8),
                                                    borderWidth: 1,
                                                    borderColor: "#E5DED6",
                                                }}
                                            >
                                                <TextInput
                                                    value={editName}
                                                    onChangeText={setEditName}
                                                    style={inputStyle}
                                                />

                                                <TextInput
                                                    value={editPrice}
                                                    onChangeText={(text) => {
                                                        if (/^\d*$/.test(text)) setEditPrice(text);
                                                    }}
                                                    keyboardType="number-pad"
                                                    style={inputStyle}
                                                />

                                                <TouchableOpacity
                                                onPress={async () => {
                                                    const result = await ImagePicker.launchImageLibraryAsync({
                                                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                                        quality: 0.7,
                                                    });

                                                    if (!result.canceled) {
                                                        setEditImage(result.assets[0].uri);
                                                    }
                                                }}
                                                style={{
                                                    backgroundColor: "#F3F0EC",
                                                    padding: scale(10),
                                                    borderRadius: scale(8),
                                                    marginBottom: verticalScale(10),
                                                    alignItems: "center",
                                                }}
                                            >
                                                <Text>{editImage ? "Change Image" : "Add Image"}</Text>
                                            </TouchableOpacity>

                                            {/* PREVIEW */}
                                            {editImage && (
                                                <Image
                                                    source={{ uri: editImage }}
                                                    style={{ width: "100%", height: verticalScale(120), borderRadius: scale(8), marginBottom: verticalScale(10) }}
                                                />
                                            )}

                                            {/* REMOVE */}
                                            {editImage && (
                                                <TouchableOpacity onPress={() => setEditImage(null)}>
                                                    <Text style={{ color: "red", textAlign: "center", marginBottom: 10 }}>
                                                        Remove Image
                                                    </Text>
                                                </TouchableOpacity>
                                            )}

                                                <TouchableOpacity
                                                    onPress={async () => {
                                                        let imageUrl = editImage;

                                                        // if new image selected (local file)
                                                        if (editImage && editImage.startsWith("file")) {
                                                            imageUrl = await uploadImage(editImage);
                                                        }

                                                        // if removed
                                                        if (!editImage) {
                                                            imageUrl = null;
                                                        }

                                                        const token = (await supabase.auth.getSession()).data.session?.access_token;

                                                        await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/cafes/${cafeId}/menu/items/${item.id}`, {
                                                            method: "PUT",
                                                            headers: {
                                                                "Content-Type": "application/json",
                                                                Authorization: `Bearer ${token}`,
                                                            },
                                                            body: JSON.stringify({
                                                                name: editName,
                                                                price: editPrice,
                                                                image_url: imageUrl,
                                                            }),
                                                        });

                                                        // update UI
                                                        setMenuItems((prev) =>
                                                            prev.map((i) =>
                                                                i.id === item.id
                                                                    ? { ...i, name: editName, price: editPrice, image_url: imageUrl }
                                                                    : i
                                                            )
                                                        );
                                                        setEditingItemId(null);
                                                    }}
                                                    style={{
                                                        backgroundColor: "#D4A373",
                                                        padding: scale(10),
                                                        borderRadius: scale(8),
                                                    }}
                                                >
                                                    <Text style={{ color: "#fff", textAlign: "center", fontSize: moderateScale(14) }}>
                                                        Save Changes
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}

                                    </View>
                                ))}
                        </View>
                        ))}
                    </>
                    )}
                    </View>
                    )}

                {/* REVIEWS */}
                {activeTab === "reviews" && (
                <View style={styles.section}>
                    {[1, 2, 3].map((_, i) => (
                    <View key={i} style={styles.card}>
                        <Text style={styles.cardTitle}>Amazing coffee!</Text>
                        <View style={{ flexDirection: "row", marginTop: verticalScale(4) }}>
                        {Array.from({ length: 5 }).map((__, j) => (
                            <Star key={j} size={scale(14)} color={j < 4 ? "#D4A373" : "#ddd"} fill={j < 4 ? "#D4A373" : "transparent"} />
                        ))}
                        </View>
                    </View>
                    ))}
                </View>
                )}

            </Animated.View>
            </View>
        </Animated.ScrollView>

        {previewImage && (
        <TouchableOpacity
            activeOpacity={1}
            onPress={() => setPreviewImage(null)}
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.8)",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 100,
            }}
        >
            <Image
                source={{ uri: previewImage }}
                style={{
                    width: "90%",
                    height: "60%",
                    borderRadius: scale(12),
                }}
                resizeMode="contain"
            />
        </TouchableOpacity>
    )}

        <BottomNav />
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
    heroTitle: { color: "#FFF", fontSize: moderateScale(18), fontWeight: "700" },
    heroSubtitle: { color: "#FFF", fontSize: moderateScale(12), marginTop: verticalScale(4) },

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
        top: verticalScale(40),
        right: scale(20),
        zIndex: 10,
    },
    modalContent: { padding: scale(12) },

    menuSectionTitle: {
        fontSize: moderateScale(14),
        fontWeight: "700",
        color: "#1A1A1A",
        marginBottom: scale(8),
        },

        menuItem: {
            flexDirection: "row",
            alignItems: "center",
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