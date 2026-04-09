import * as ImagePicker from "expo-image-picker";

import {
    Animated,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { BookOpen, Grid3X3, Pencil, Star, Store } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { deviceWidth, moderateScale, scale } from "../utils/responsive";

import BottomNav from "../components/ui/BottomNav";
import { TextInput } from "react-native";
import { supabase } from "../api/supabaseClient";

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
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editPrice, setEditPrice] = useState("");
    const [editCategory, setEditCategory] = useState("");
    const [newImage, setNewImage] = useState<string | null>(null);
    const [editImage, setEditImage] = useState<string | null>(null);

    const cafe = {
        name: "Bean & Bloom Cafe",
        rating: 4.8,
        visits: 5420,
        location: "Brooklyn, NY",
        open: "Open until 8:00 PM",
        tags: ["Aesthetic", "Study Spot"],
    };

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
    const slideAnim = useRef(new Animated.Value(18)).current;
    const tabFadeAnim = useRef(new Animated.Value(1)).current;

    const handleDeleteItem = async (item: any) => {
    await supabase
        .from("menu_items")
        .delete()
        .eq("id", item.id);

    setMenuItems((prev) =>
        prev.filter((i) => i.id !== item.id)
    );
    };

    useEffect(() => {
    const fetchCafe = async () => {
        const { data, error } = await supabase
        .from("cafes")
        .select("id")
        .limit(1)
        .single();

        if (!error && data) {
        setCafeId(data.id);
        }
    };

    fetchCafe();
    }, []);

    const [menuItems, setMenuItems] = useState<any[]>([]);
    useEffect(() => {
        if (!cafeId) return;

        const fetchMenu = async () => {
            const { data } = await supabase
            .from("menu_items")
            .select("*")
            .eq("cafe_id", cafeId);

            if (data) setMenuItems(data);
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

    const handleCreateCategory = async () => {
    const newCategory = "New Category";

    const { data, error } = await supabase
        .from("menu_items")
        .insert([
        {
            cafe_id: cafeId,
            name: "New Item",
            price: "$0",
            category: newCategory,
        },
        ])
        .select();

    if (!error && data) {
        setMenuItems((prev) => [...prev, data[0]]);
    }
    };

    const handleRenameCategory = async (oldCategory: string) => {
    if (!newCategoryName || newCategoryName === oldCategory) {
        setEditingCategory(null);
        return;
    }

    // update DB
    const { error } = await supabase
        .from("menu_items")
        .update({ category: newCategoryName })
        .eq("category", oldCategory)
        .eq("cafe_id", cafeId);

    if (error) {
        console.error(error);
    } else {
        // update UI instantly
        setMenuItems((prev) =>
        prev.map((item) =>
            item.category === oldCategory
            ? { ...item, category: newCategoryName }
            : item
        )
        );
    }

    setEditingCategory(null);
    };

    const handleEditItem = async (id: string, field: string, value: string) => {
        setMenuItems((prev) =>
            prev.map((item) =>
            item.id === id ? { ...item, [field]: value } : item
            )
        );

        // update database
        await supabase
            .from("menu_items")
            .update({ [field]: value })
            .eq("id", id);
        };

    const handleAddItem = async () => {
    if (!newName || !newPrice) return;

    const { error } = await supabase.from("menu_items").insert([
        {
        cafe_id: cafeId,
        name: newName,
        price: newPrice,
        category: newCategory,
        },
    ]);

    if (error) {
        console.error(error);
    } else {
        setMenuItems((prev) => [
        ...prev,
        {
            name: newName,
            price: newPrice,
            category: newCategory,
        },
        ]);
        setIsEditing(true); 

        // reset + close
        setNewName("");
        setNewPrice("");
        setNewCategory("");
        // setShowAddModal(false);
    }
    };

    const inputStyle = {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
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

    const handleAddItemWithCategory = async (category: string) => {
    const newItem = {
        cafe_id: cafeId,
        name: "New Item",
        price: "$0",
        category,
    };

    const { data, error } = await supabase
        .from("menu_items")
        .insert([newItem])
        .select();

    if (!error && data) {
        setMenuItems((prev) => [...prev, data[0]]);
    }
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

                {/* EMPTY STATE */}
                {!hasMenu && !isEditing && (
                <View style={{ marginTop: 40, alignItems: "center" }}>
                    <Text style={{ color: "#777", marginBottom: 12 }}>
                        {isEditing ? "No Menu Yet" : "No menu yet"}
                    </Text>

                    <TouchableOpacity
                    onPress={handleCreateMenu}
                    style={{
                        backgroundColor: "#D4A373",
                        paddingHorizontal: 18,
                        paddingVertical: 12,
                        borderRadius: 10,
                    }}
                    >
                    <Text style={{ color: "#fff", fontWeight: "600" }}>
                        Create Menu
                    </Text>
                    </TouchableOpacity>

                </View>
                )}
                {(hasMenu || isEditing) && (
                <>
                    {/* EDIT ICON */}
                    <TouchableOpacity
                    onPress={() => setIsEditing((prev) => !prev)}
                    style={{
                        position: "absolute",
                        right: 8,
                        top: 20,
                        padding: 8,
                        backgroundColor: "#fff",
                        borderRadius: 20,
                        elevation: 3,
                        zIndex: 10,
                    }}
                    >
                    {isEditing ? (
                        <Text style={{ color: "#D4A373", fontWeight: "600" }}>
                        Done
                        </Text>
                    ) : (
                        <Pencil size={18} color="#D4A373" />
                    )}
                    </TouchableOpacity>

                        {/* EDIT MODE LABEL */}
                        <View
                        style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            marginTop: 20, 
                            alignItems: "center",
                            marginBottom: 10,
                        }}
                        >
                        <Text
                            style={{
                                color: "#D4A373",
                                fontWeight: "700",
                                fontSize: moderateScale(16),
                                textAlign: "center",
                                width: "100%",
                                marginBottom: 6,
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
                            paddingVertical: 10,
                            borderRadius: 10,
                            marginBottom: 12,
                            }}
                        >
                            <Text style={{ color: "#fff", textAlign: "center", fontWeight: "600" }}>
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
                            marginBottom: 6,
                            paddingBottom: 4,
                            borderBottomWidth: 1,
                            borderBottomColor: "#DDD",
                            }}
                        >
                            <Text style={{ flex: 1, fontWeight: "600", color: "#888" }}>
                            Item
                            </Text>
                            <Text style={{ width: 60, textAlign: "right", color: "#888" }}>
                            Price
                            </Text>
                            <Text style={{ width: 40, textAlign: "right", color: "#888" }}>
                            Edit
                            </Text>
                        </View>
                        )}

                        {isEditing && addingItemCategory === "GLOBAL" && (
                        <View
                        style={{
                            backgroundColor: "#FFF",
                            borderRadius: 12,
                            padding: 14,
                            marginBottom: 16,
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
                            marginBottom: 10,
                        }}
                    >
                        <Text style={{ fontWeight: "600", fontSize: 16 }}>
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
                                padding: 6,
                                backgroundColor: "#F3F0EC",
                                borderRadius: 20,
                            }}
                        >
                            <Text style={{ fontSize: 16, fontWeight: "600" }}>×</Text>
                        </TouchableOpacity>

                    </View>
                            {/* NAME */}
                            <TextInput
                            placeholder="Item name"
                            value={newName}
                            onChangeText={setNewName}
                            style={inputStyle}
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
                                    padding: 10,
                                    borderRadius: 8,
                                    marginBottom: 10,
                                    alignItems: "center",
                                }}
                            >
                                <Text>{newImage ? "Change Image" : "Add Image"}</Text>
                            </TouchableOpacity>
                            {newImage && (
                            <Image
                                source={{ uri: newImage }}
                                style={{ width: "100%", height: 120, borderRadius: 8, marginBottom: 10 }}
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
                                borderRadius: 8,
                                padding: 10,
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
                                    borderRadius: 8,
                                    marginTop: 6,
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
                                        style={{ padding: 10 }}
                                    >
                                        <Text>{cat}</Text>
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
                                    padding: 10,
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
                                        borderRadius: 6,
                                        padding: 8,
                                        }}
                                    />

                                    <TouchableOpacity
                                        onPress={() => {
                                        if (!newCategory) return;

                                        setIsAddingNewCategory(false);
                                        setShowCategoryDropdown(false);
                                        }}
                                        style={{
                                        marginTop: 8,
                                        backgroundColor: "#D4A373",
                                        padding: 8,
                                        borderRadius: 6,
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

                                let imageUrl = null;
                                if (newImage) {
                                    imageUrl = await uploadImage(newImage);
                                }

                                const { data } = await supabase
                                .from("menu_items")
                                .insert([
                                    {
                                    cafe_id: cafeId,
                                    name: newName,
                                    price: newPrice,
                                    category: newCategory,
                                    image_url: imageUrl,
                                    },
                                ])
                                .select();

                                if (data) {
                                setMenuItems((prev) => [...prev, data[0]]);
                                }
                                setFormError("");

                                setNewName("");
                                setNewPrice("");
                                setNewCategory("");
                                setAddingItemCategory(null);
                            }}
                            style={{
                                backgroundColor: "#D4A373",
                                padding: 12,
                                borderRadius: 10,
                            }}
                            >
                            <Text style={{ color: "#fff", textAlign: "center" }}>
                                Add Item
                            </Text>
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
                                        padding: 6,
                                        borderRadius: 6,
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
                                                        width: 30,
                                                        height: 30,
                                                        borderRadius: 6,
                                                        backgroundColor: "#E8DFD5",
                                                        marginRight: 8,
                                                    }}
                                                />

                                                    <TextInput
                                                        value={item.name}
                                                        onChangeText={(text) =>
                                                            handleEditItem(item.id, "name", text)
                                                        }
                                                        style={{
                                                            flex: 1,
                                                            backgroundColor: "#F3F0EC",
                                                            padding: 6,
                                                            borderRadius: 6,
                                                        }}
                                                    />

                                                    <TextInput
                                                        value={item.price}
                                                        onChangeText={(text) =>
                                                            handleEditItem(item.id, "price", text)
                                                        }
                                                        style={{
                                                            width: 60,
                                                            textAlign: "right",
                                                            backgroundColor: "#F3F0EC",
                                                            padding: 6,
                                                            borderRadius: 6,
                                                            marginLeft: 10,
                                                        }}
                                                    />

                                                    {/* ✏️ + 🗑 ICONS */}
                                                    <View style={{ flexDirection: "row", marginLeft: 10 }}>
                                                        <TouchableOpacity
                                                            onPress={() => {
                                                                setEditingItemId(item.id);
                                                                setEditName(item.name);
                                                                setEditPrice(item.price);
                                                                setEditCategory(section.title);
                                                                setEditImage(item.image_url || null); 
                                                            }}
                                                            style={{ marginRight: 10 }}
                                                        >
                                                            <Text>✏️</Text>
                                                        </TouchableOpacity>

                                                        <TouchableOpacity onPress={() => handleDeleteItem(item)}>
                                                            <Text>🗑</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </>
                                            ) : (
                                                <View style={{ flexDirection: "row", alignItems: "center", width: "100%" }}>
                                                {/* LEFT SIDE: IMAGE + NAME */}
                                                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                                    <Image
                                                        source={
                                                            item.image_url
                                                                ? { uri: item.image_url }
                                                                : undefined
                                                        }
                                                        style={{
                                                            width: 40,
                                                            height: 40,
                                                            borderRadius: 8,
                                                            backgroundColor: "#E8DFD5",
                                                        }}
                                                    />

                                                    <Text style={styles.menuItemName}>{item.name}</Text>
                                                </View>

                                                {/* RIGHT SIDE: PRICE */}
                                                <View style={{ flex: 1 }} />

                                                <Text style={styles.menuItemPrice}>${item.price}</Text>
                                            </View>
                                            )}
                                        </View>

                                        {editingItemId === item.id && (
                                            <View
                                                style={{
                                                    backgroundColor: "#FFF",
                                                    borderRadius: 10,
                                                    padding: 10,
                                                    marginTop: 8,
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
                                                    padding: 10,
                                                    borderRadius: 8,
                                                    marginBottom: 10,
                                                    alignItems: "center",
                                                }}
                                            >
                                                <Text>{editImage ? "Change Image" : "Add Image"}</Text>
                                            </TouchableOpacity>

                                            {/* PREVIEW */}
                                            {editImage && (
                                                <Image
                                                    source={{ uri: editImage }}
                                                    style={{ width: "100%", height: 120, borderRadius: 8, marginBottom: 10 }}
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

                                                        await supabase
                                                            .from("menu_items")
                                                            .update({
                                                                name: editName.trim(),
                                                                price: editPrice,
                                                                image_url: imageUrl,
                                                            })
                                                            .eq("id", item.id);

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
                                                        padding: 10,
                                                        borderRadius: 8,
                                                    }}
                                                >
                                                    <Text style={{ color: "#fff", textAlign: "center" }}>
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