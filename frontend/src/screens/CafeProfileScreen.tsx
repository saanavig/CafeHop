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
import { useRoute } from "@react-navigation/native";
import {
  deviceWidth,
  moderateScale,
  scale,
  verticalScale,
} from "../utils/responsive";

import BottomNav from "../components/ui/BottomNav";
import { TextInput } from "react-native";
import { supabase } from "../api/supabaseClient";

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

type Cafe = {
  id: string;
  owner_id?: string;
  name?: string;
  address?: string;
  image_url?: string;
  description?: string;
  price_level?: number;
  rating?: number;
  visits?: number;
  isOpen?: boolean;
};

export default function CafeProfileScreen() {
    const route = useRoute<any>();
    const { cafeId } = route.params || {};

    const contentWidth = Math.min(deviceWidth * 0.9, 480);
    const photoSize = (contentWidth - 6) / 3;

    const [cafe, setCafe] = useState<Cafe | null>(null);
    const [cafeLoading, setCafeLoading] = useState(true);

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
    const [newImage, setNewImage] = useState<string | null>(null);
    const [editImage, setEditImage] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const [userId, setUserId] = useState<string | null>(null);
    const [ownerId, setOwnerId] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<"posts" | "menu" | "reviews">("posts");
    const [menuItems, setMenuItems] = useState<any[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [postsLoading, setPostsLoading] = useState(false);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);

    const [reviews, setReviews] = useState<any[]>([]);
    const [myReview, setMyReview] = useState<any | null>(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewText, setReviewText] = useState("");
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewError, setReviewError] = useState("");

  const isOwner = !!userId && !!ownerId && userId === ownerId;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(scale(18))).current;
  const tabFadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id || null);
    };

    getUser();
  }, []);

  useEffect(() => {
    const fetchCafe = async () => {
      setCafeLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData.user?.id || null;

      if (currentUserId) {
        setUserId(currentUserId);
      }

      let query = supabase.from("cafes").select("*");

      if (cafeId) {
        query = query.eq("id", cafeId);
      } else if (currentUserId) {
        query = query.eq("owner_id", currentUserId);
      } else {
        setCafeLoading(false);
        return;
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error("Fetch cafe error:", error);
      }

      if (data) {
        setCafe(data);
        setOwnerId(data.owner_id || null);
      } else {
        setCafe(null);
      }

      setCafeLoading(false);
    };

    fetchCafe();
  }, [cafeId]);

  useEffect(() => {
    if (!cafeId) return;

    const fetchMenu = async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("cafe_id", cafeId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Fetch menu error:", error);
      }

      if (data) setMenuItems(data);
    };

    fetchMenu();
  }, [cafeId]);

  useEffect(() => {
    if (!cafeId) return;

    const fetchPosts = async () => {
      setPostsLoading(true);

      try {
        const { data, error } = await supabase
          .from("posts")
          .select("id, caption, created_at, post_media(id, file_url, file_type)")
          .eq("cafe_id", cafeId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Fetch posts error:", error);
        }

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

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 380,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setNewImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();

    const fileName = `${cafeId}/${Date.now()}.jpg`;

    const { error } = await supabase.storage
      .from("menu-images")
      .upload(fileName, blob, {
        contentType: "image/jpeg",
        upsert: true,
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

  const groupMenuByCategory = (items: any[]) => {
    const grouped: any = {};

    items.forEach((item) => {
      const category = item.category || "Other";

      if (!grouped[category]) {
        grouped[category] = [];
      }

      grouped[category].push({
        id: item.id,
        name: item.name,
        price: item.price,
        description: item.description,
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

  const switchTab = (tab: "posts" | "menu" | "reviews") => {
    Animated.timing(tabFadeAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      setActiveTab(tab);
      Animated.timing(tabFadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleCreateMenu = () => {
    if (!isOwner) return;
    setIsEditing(true);
    setAddingItemCategory("GLOBAL");
  };

  const handleDeleteItem = async (item: any) => {
    if (!isOwner) return;

    const { error } = await supabase.from("menu_items").delete().eq("id", item.id);

    if (error) {
      console.error("Delete item error:", error);
      return;
    }

    setMenuItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  const handleRenameCategory = async (oldCategory: string) => {
    if (!isOwner) return;

    if (!newCategoryName || newCategoryName === oldCategory) {
      setEditingCategory(null);
      return;
    }

    const { error } = await supabase
      .from("menu_items")
      .update({ category: newCategoryName })
      .eq("category", oldCategory)
      .eq("cafe_id", cafeId);

    if (error) {
      console.error(error);
    } else {
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
    if (!isOwner) return;

    setMenuItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );

    const { error } = await supabase
      .from("menu_items")
      .update({ [field]: value })
      .eq("id", id);

    if (error) {
      console.error("Edit item error:", error);
    }
  };

  const inputStyle = {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: scale(8),
    padding: scale(10),
    marginBottom: verticalScale(10),
  };


    const fetchReviews = async () => {
    if (!cafeId) return;


    setReviewsLoading(true);

    const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("cafe_id", cafeId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Fetch reviews error:", error);
        setReviewsLoading(false);
        return;
    }

    if (data) {
        setReviews(data);

        const mine = userId
        ? data.find((review) => review.user_id === userId)
        : null;

        setMyReview(mine || null);
    }
    setReviewsLoading(false);
    };

    useEffect(() => {
    if (!cafeId) return;
    fetchReviews();
    }, [cafeId, userId]);

    const submitReview = async () => {
    if (!userId || !cafeId) {
        setReviewError("You need to be logged in to leave a review.");
        return;
    }

    if (reviewRating < 1 || reviewRating > 5) {
        setReviewError("Rating must be between 1 and 5.");
        return;
    }

    setReviewError("");

    if (myReview) {
        const { error } = await supabase
        .from("reviews")
        .update({
            rating: reviewRating,
            review_text: reviewText.trim() || null,
            updated_at: new Date().toISOString(),
        })
        .eq("id", myReview.id);

        if (error) {
        setReviewError("Could not update review.");
        console.error(error);
        return;
        }
    } else {
        const { error } = await supabase.from("reviews").insert({
        user_id: userId,
        cafe_id: cafeId,
        rating: reviewRating,
        review_text: reviewText.trim() || null,
        });

        if (error) {
        setReviewError("Could not submit review.");
        console.error(error);
        return;
        }
    }

    const { data: ratingRows, error: ratingError } = await supabase
        .from("reviews")
        .select("rating")
        .eq("cafe_id", cafeId);

    if (ratingError) {
        console.error("Rating fetch error:", ratingError);
    }

    if (ratingRows && ratingRows.length > 0) {
        const avg =
        ratingRows.reduce(
            (sum, row) => sum + Number(row.rating || 0),
            0
        ) / ratingRows.length;

        const averageRating = Number(avg.toFixed(1));

        const { error: cafeRatingError } = await supabase
        .from("cafes")
        .update({
            rating: averageRating,
        })
        .eq("id", cafeId);

        if (cafeRatingError) {
        console.error("Cafe rating update error:", cafeRatingError);
        } else {
        setCafe((prev) =>
            prev
            ? {
                ...prev,
                rating: averageRating,
                }
            : prev
        );
        }
    }

    await fetchReviews();

    setReviewText("");
    setReviewRating(5);
    setReviewError("");
    };



  if (cafeLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="small" color="#D4A373" />
      </View>
    );
  }

  if (!cafe) {
    return (
      <View style={styles.centered}>
        <Text>Cafe not found.</Text>
        <BottomNav />
      </View>
    );
  }





  return (
    <View style={styles.container}>
      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: scale(100) }}
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <View style={styles.hero}>
          <Image
            source={{ uri: cafe.image_url || "https://picsum.photos/800" }}
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTitle}>{cafe.name || "Cafe"}</Text>
            <Text style={styles.heroSubtitle}>
              ⭐ {cafe.rating || "New"} • {cafe.address || "No address"}
            </Text>
          </View>
        </View>

        <View style={{ width: contentWidth, alignSelf: "center" }}>
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Store size={scale(44)} color="#888" />
            </View>

            <Text style={styles.name}>{cafe.name || "Cafe"}</Text>

            <Text style={styles.bio}>
              {cafe.description || "No description yet"} •{" "}
              {cafe.isOpen ? "Open" : "Closed"}
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{posts.length}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>

              <View style={styles.stat}>
                <Text style={styles.statNumber}>{cafe.visits || 0}</Text>
                <Text style={styles.statLabel}>Visits</Text>
              </View>

              <View style={styles.stat}>
                <Text style={styles.statNumber}>{cafe.rating || "New"}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>

              <View style={styles.stat}>
                <Text style={styles.statNumber}>
                  {"$".repeat(cafe.price_level || 1)}
                </Text>
                <Text style={styles.statLabel}>Price</Text>
              </View>
            </View>
          </View>

          <View style={styles.tabs}>
            <TouchableOpacity onPress={() => switchTab("posts")}>
              <Grid3X3
                size={scale(22)}
                color={activeTab === "posts" ? "#D4A373" : "#777"}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => switchTab("menu")}>
              <BookOpen
                size={scale(22)}
                color={activeTab === "menu" ? "#D4A373" : "#777"}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => switchTab("reviews")}>
              <Star
                size={scale(22)}
                color={activeTab === "reviews" ? "#D4A373" : "#777"}
              />
            </TouchableOpacity>
          </View>

          <Animated.View style={{ opacity: tabFadeAnim }}>
            {activeTab === "posts" && (
              <>
                {postsLoading ? (
                  <View style={styles.emptyState}>
                    <ActivityIndicator size="small" color="#D4A373" />
                  </View>
                ) : posts.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>No posts yet</Text>
                    <Text style={styles.emptySubtitle}>
                      {isOwner
                        ? "Share your first photo!"
                        : "No cafe photos have been posted yet."}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.grid}>
                    {posts.map((post) => (
                      <TouchableOpacity
                        key={post.id}
                        onPress={() => setSelectedPost(post)}
                      >
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
              </>
            )}

            {activeTab === "menu" && (
              <View style={styles.section}>
                {!hasMenu && !isEditing && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>No menu yet</Text>

                    {isOwner && (
                      <TouchableOpacity
                        onPress={handleCreateMenu}
                        style={styles.primaryButton}
                      >
                        <Text style={styles.primaryButtonText}>Create Menu</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {(hasMenu || isEditing) && (
                  <>
                    {isOwner && (
                      <TouchableOpacity
                        onPress={() => setIsEditing((prev) => !prev)}
                        style={styles.editButton}
                      >
                        {isEditing ? (
                          <Text style={styles.doneText}>Done</Text>
                        ) : (
                          <Pencil size={scale(18)} color="#D4A373" />
                        )}
                      </TouchableOpacity>
                    )}

                    <Text style={styles.sectionTitle}>
                      {isEditing ? "Editing Menu" : "Menu"}
                    </Text>

                    {isEditing && isOwner && (
                      <TouchableOpacity
                        onPress={() => setAddingItemCategory("GLOBAL")}
                        style={styles.addButton}
                      >
                        <Text style={styles.primaryButtonText}>+ Add Item</Text>
                      </TouchableOpacity>
                    )}

                    {isEditing && addingItemCategory === "GLOBAL" && (
                      <View style={styles.formCard}>
                        <View style={styles.formHeader}>
                          <Text style={styles.formTitle}>Add Item</Text>

                          <TouchableOpacity
                            onPress={() => {
                              setAddingItemCategory(null);
                              setFormError("");
                              setNewName("");
                              setNewPrice("");
                              setNewCategory("");
                              setNewDescription("");
                              setNewImage(null);
                            }}
                            style={styles.closeSmallButton}
                          >
                            <Text style={styles.closeSmallText}>×</Text>
                          </TouchableOpacity>
                        </View>

                        <TextInput
                          placeholder="Item name"
                          value={newName}
                          onChangeText={setNewName}
                          style={inputStyle}
                        />

                        <TextInput
                          placeholder="Description optional"
                          value={newDescription}
                          onChangeText={setNewDescription}
                          style={[inputStyle, { minHeight: verticalScale(60) }]}
                          multiline
                          textAlignVertical="top"
                        />

                        <TextInput
                          placeholder="Price"
                          value={newPrice}
                          onChangeText={(text) => {
                            setNewPrice(text);

                            if (text && isNaN(Number(text))) {
                              setFormError("Price must be a numeric value only");
                            } else {
                              setFormError("");
                            }
                          }}
                          keyboardType="numeric"
                          style={inputStyle}
                        />

                        <TouchableOpacity
                          onPress={pickImage}
                          style={styles.imageButton}
                        >
                          <Text style={{ fontSize: moderateScale(14) }}>
                            {newImage ? "Change Image" : "Add Image"}
                          </Text>
                        </TouchableOpacity>

                        {newImage && (
                          <Image
                            source={{ uri: newImage }}
                            style={styles.formImagePreview}
                          />
                        )}

                        <View style={{ marginBottom: 10 }}>
                          <TouchableOpacity
                            onPress={() =>
                              setShowCategoryDropdown((prev) => !prev)
                            }
                            style={styles.dropdownTrigger}
                          >
                            <View style={styles.dropdownRow}>
                              <Text style={{ color: newCategory ? "#000" : "#888" }}>
                                {newCategory || "Select Category"}
                              </Text>
                              <Text>▼</Text>
                            </View>
                          </TouchableOpacity>

                          {showCategoryDropdown && (
                            <View style={styles.dropdownList}>
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
                                    <Text style={{ fontSize: moderateScale(14) }}>
                                      {cat}
                                    </Text>
                                  </TouchableOpacity>
                                ))
                              ) : (
                                <Text style={{ padding: 10, color: "#888" }}>
                                  No categories yet
                                </Text>
                              )}

                              <TouchableOpacity
                                onPress={() => setIsAddingNewCategory(true)}
                                style={styles.addCategoryButton}
                              >
                                <Text style={{ color: "#D4A373" }}>
                                  + Add new category
                                </Text>
                              </TouchableOpacity>

                              {isAddingNewCategory && (
                                <View style={{ padding: 10 }}>
                                  <TextInput
                                    placeholder="New category name"
                                    value={newCategory}
                                    onChangeText={setNewCategory}
                                    autoFocus
                                    style={styles.newCategoryInput}
                                  />

                                  <TouchableOpacity
                                    onPress={() => {
                                      if (!newCategory) return;
                                      setIsAddingNewCategory(false);
                                      setShowCategoryDropdown(false);
                                    }}
                                    style={styles.confirmCategoryButton}
                                  >
                                    <Text
                                      style={{
                                        color: "#fff",
                                        textAlign: "center",
                                      }}
                                    >
                                      Add Category
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                              )}
                            </View>
                          )}
                        </View>

                        {formError ? (
                          <Text style={styles.errorText}>{formError}</Text>
                        ) : null}

                        <TouchableOpacity
                          disabled={addingItem}
                          onPress={async () => {
                            if (!isOwner) return;

                            if (!newName || !newPrice || !newCategory) {
                              setFormError("Please fill out all fields");
                              return;
                            }

                            const exists = menuItems.some((item) => {
                              return (
                                item.category?.trim().toLowerCase() ===
                                  newCategory.trim().toLowerCase() &&
                                item.name?.trim().toLowerCase() ===
                                  newName.trim().toLowerCase()
                              );
                            });

                            if (exists) {
                              setFormError(
                                "This item already exists in this category"
                              );
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

                              const { data, error } = await supabase
                                .from("menu_items")
                                .insert([
                                  {
                                    cafe_id: cafeId,
                                    name: newName,
                                    price: newPrice,
                                    category: newCategory,
                                    image_url: imageUrl,
                                    description: newDescription || null,
                                  },
                                ])
                                .select();

                              if (error) {
                                console.error("Add item error:", error);
                                setFormError("Could not add item.");
                                return;
                              }

                              if (data) {
                                setMenuItems((prev) => [...prev, data[0]]);
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
                          style={[
                            styles.submitButton,
                            {
                              backgroundColor: addingItem
                                ? "#E5C9A8"
                                : "#D4A373",
                            },
                          ]}
                        >
                          {addingItem ? (
                            <ActivityIndicator size="small" color="#FFF" />
                          ) : (
                            <Text style={styles.primaryButtonText}>Add Item</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    )}

                    {menuSections.map((section, i) => (
                      <View key={i} style={{ marginBottom: scale(16) }}>
                        {isEditing && isOwner ? (
                          editingCategory === section.title ? (
                            <TextInput
                              value={newCategoryName}
                              onChangeText={setNewCategoryName}
                              onBlur={() => handleRenameCategory(section.title)}
                              autoFocus
                              style={styles.categoryEditInput}
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
                            <View style={styles.menuItem}>
                              {isEditing && isOwner ? (
                                <>
                                  <Image
                                    source={
                                      item.image_url
                                        ? { uri: item.image_url }
                                        : undefined
                                    }
                                    style={styles.editItemImage}
                                  />

                                  <TextInput
                                    value={item.name}
                                    onChangeText={(text) =>
                                      handleEditItem(item.id, "name", text)
                                    }
                                    style={styles.editNameInput}
                                  />

                                  <TextInput
                                    value={item.price}
                                    onChangeText={(text) =>
                                      handleEditItem(item.id, "price", text)
                                    }
                                    style={styles.editPriceInput}
                                  />

                                  <View style={styles.rowActions}>
                                    <TouchableOpacity
                                      onPress={() => {
                                        setEditingItemId(item.id);
                                        setEditName(item.name);
                                        setEditPrice(item.price);
                                        setEditImage(item.image_url || null);
                                      }}
                                      style={{ marginRight: scale(10) }}
                                    >
                                      <Text>✏️</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                      onPress={() => handleDeleteItem(item)}
                                    >
                                      <Text>🗑</Text>
                                    </TouchableOpacity>
                                  </View>
                                </>
                              ) : (
                                <View style={styles.menuDisplayRow}>
                                  <View style={styles.menuLeft}>
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
                                        style={styles.menuDisplayImage}
                                      />
                                    </TouchableOpacity>

                                    <View style={{ flex: 1 }}>
                                      <Text style={styles.menuItemName}>
                                        {item.name}
                                      </Text>

                                      {item.description ? (
                                        <Text style={styles.menuItemDescription}>
                                          {item.description}
                                        </Text>
                                      ) : null}
                                    </View>
                                  </View>

                                  <Text style={styles.menuItemPrice}>
                                    ${item.price}
                                  </Text>
                                </View>
                              )}
                            </View>

                            {editingItemId === item.id && isOwner && (
                              <View style={styles.formCard}>
                                <TextInput
                                  value={editName}
                                  onChangeText={setEditName}
                                  style={inputStyle}
                                />

                                <TextInput
                                  value={editPrice}
                                  onChangeText={(text) => {
                                    if (/^\d*\.?\d*$/.test(text)) {
                                      setEditPrice(text);
                                    }
                                  }}
                                  keyboardType="decimal-pad"
                                  style={inputStyle}
                                />
                                <TouchableOpacity
                                  onPress={async () => {
                                    const result =
                                      await ImagePicker.launchImageLibraryAsync({
                                        mediaTypes:
                                          ImagePicker.MediaTypeOptions.Images,
                                        quality: 0.7,
                                      });

                                    if (!result.canceled) {
                                      setEditImage(result.assets[0].uri);
                                    }
                                  }}
                                  style={styles.imageButton}
                                >
                                  <Text>
                                    {editImage ? "Change Image" : "Add Image"}
                                  </Text>
                                </TouchableOpacity>

                                {editImage && (
                                  <Image
                                    source={{ uri: editImage }}
                                    style={styles.formImagePreview}
                                  />
                                )}

                                {editImage && (
                                  <TouchableOpacity
                                    onPress={() => setEditImage(null)}
                                  >
                                    <Text style={styles.removeImageText}>
                                      Remove Image
                                    </Text>
                                  </TouchableOpacity>
                                )}


                                <TouchableOpacity
                                  onPress={async () => {
                                    let imageUrl = editImage;

                                    if (editImage && editImage.startsWith("file")) {
                                      imageUrl = await uploadImage(editImage);
                                    }

                                    if (!editImage) {
                                      imageUrl = null;
                                    }
                                    const { error } = await supabase
                                      .from("menu_items")
                                      .update({
                                        name: editName.trim(),
                                        price: editPrice,
                                        image_url: imageUrl,
                                      })
                                      .eq("id", item.id);

                                    if (error) {
                                      console.error("Save item error:", error);
                                      return;
                                    }

                                    setMenuItems((prev) =>
                                      prev.map((i) =>
                                        i.id === item.id
                                          ? {
                                              ...i,
                                              name: editName,
                                              price: editPrice,
                                              image_url: imageUrl,
                                            }
                                          : i
                                      )
                                    );
                                    setEditingItemId(null);
                                  }}
                                  style={styles.saveButton}
                                >
                                  <Text style={styles.primaryButtonText}>
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

            {activeTab === "reviews" && (
            <View style={styles.section}>
                {!isOwner && (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>
                    {myReview ? "Update your review" : "Leave a review"}
                    </Text>

                    <View style={{ flexDirection: "row", marginVertical: verticalScale(10) }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity key={star} onPress={() => setReviewRating(star)}>
                        <Star
                            size={scale(24)}
                            color={star <= reviewRating ? "#D4A373" : "#ddd"}
                            fill={star <= reviewRating ? "#D4A373" : "transparent"}
                        />
                        </TouchableOpacity>
                    ))}
                    </View>

                    <TextInput
                    placeholder="Write your thoughts..."
                    value={reviewText}
                    onChangeText={setReviewText}
                    multiline
                    style={[
                        inputStyle,
                        {
                        minHeight: verticalScale(80),
                        textAlignVertical: "top",
                        },
                    ]}
                    />

                    {reviewError ? (
                    <Text style={styles.errorText}>{reviewError}</Text>
                    ) : null}

                    <TouchableOpacity onPress={submitReview} style={styles.primaryButton}>
                    <Text style={styles.primaryButtonText}>
                        {myReview ? "Update Review" : "Submit Review"}
                    </Text>
                    </TouchableOpacity>
                </View>
                )}

                {reviewsLoading ? (
                <View style={styles.emptyState}>
                    <ActivityIndicator size="small" color="#D4A373" />
                </View>
                ) : reviews.length === 0 ? (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>No reviews yet</Text>
                    <Text style={styles.cardSubtitle}>
                    Be the first to leave a review.
                    </Text>
                </View>
                ) : (
                reviews.map((review) => (
                    <View key={review.id} style={styles.card}>
                    <View style={{ flexDirection: "row", marginBottom: verticalScale(6) }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                            key={star}
                            size={scale(14)}
                            color={star <= review.rating ? "#D4A373" : "#ddd"}
                            fill={star <= review.rating ? "#D4A373" : "transparent"}
                        />
                        ))}
                    </View>

                    <Text style={styles.cardTitle}>
                        {review.review_text || "No written review"}
                    </Text>
                    </View>
                ))
                )}
            </View>
            )}
          </Animated.View>
        </View>
      </Animated.ScrollView>

      {previewImage && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setPreviewImage(null)}
          style={styles.previewOverlay}
        >
          <Image
            source={{ uri: previewImage }}
            style={styles.previewImage}
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
  centered: {
    flex: 1,
    backgroundColor: "#F7F3F0",
    justifyContent: "center",
    alignItems: "center",
  },

  hero: { position: "relative" },
  heroImage: { width: "100%", height: scale(200) },
  heroOverlay: {
    position: "absolute",
    bottom: scale(12),
    left: scale(12),
    right: scale(12),
  },
  heroTitle: {
    color: "#FFF",
    fontSize: moderateScale(18),
    fontWeight: "700",
  },
  heroSubtitle: {
    color: "#FFF",
    fontSize: moderateScale(12),
    marginTop: verticalScale(4),
  },

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

  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: scale(12),
    borderBottomWidth: 1,
    borderBottomColor: "#DDD",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: scale(2),
  },

  section: { padding: scale(16) },
  sectionTitle: {
    color: "#D4A373",
    fontWeight: "700",
    fontSize: moderateScale(16),
    textAlign: "center",
    marginTop: verticalScale(20),
    marginBottom: verticalScale(12),
  },

  emptyState: {
    marginTop: verticalScale(40),
    alignItems: "center",
    paddingVertical: verticalScale(24),
  },
  emptyTitle: {
    fontSize: moderateScale(15),
    fontWeight: "600",
    color: "#777",
    marginBottom: verticalScale(8),
  },
  emptySubtitle: {
    fontSize: moderateScale(13),
    color: "#D4A373",
    textAlign: "center",
  },

  primaryButton: {
    backgroundColor: "#D4A373",
    paddingHorizontal: scale(18),
    paddingVertical: scale(12),
    borderRadius: scale(10),
  },
  primaryButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
    fontSize: moderateScale(14),
  },

  editButton: {
    position: "absolute",
    right: scale(8),
    top: verticalScale(20),
    padding: scale(8),
    backgroundColor: "#fff",
    borderRadius: scale(20),
    elevation: 3,
    zIndex: 10,
  },
  doneText: {
    color: "#D4A373",
    fontWeight: "600",
    fontSize: moderateScale(14),
  },
  addButton: {
    backgroundColor: "#D4A373",
    paddingVertical: scale(10),
    borderRadius: scale(10),
    marginBottom: verticalScale(12),
  },

  formCard: {
    backgroundColor: "#FFF",
    borderRadius: scale(12),
    padding: scale(14),
    marginBottom: verticalScale(16),
    borderWidth: 1,
    borderColor: "#E5DED6",
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(10),
  },
  formTitle: {
    fontWeight: "600",
    fontSize: moderateScale(16),
  },
  closeSmallButton: {
    padding: scale(6),
    backgroundColor: "#F3F0EC",
    borderRadius: scale(20),
  },
  closeSmallText: {
    fontSize: moderateScale(16),
    fontWeight: "600",
  },
  imageButton: {
    backgroundColor: "#F3F0EC",
    padding: scale(10),
    borderRadius: scale(8),
    marginBottom: verticalScale(10),
    alignItems: "center",
  },
  formImagePreview: {
    width: "100%",
    height: verticalScale(120),
    borderRadius: scale(8),
    marginBottom: verticalScale(10),
  },
  dropdownTrigger: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: scale(8),
    padding: scale(10),
    backgroundColor: "#fff",
  },
  dropdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: scale(8),
    marginTop: verticalScale(6),
    backgroundColor: "#fff",
    elevation: 4,
    zIndex: 10,
  },
  addCategoryButton: {
    padding: scale(10),
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  newCategoryInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: scale(6),
    padding: scale(8),
    fontSize: moderateScale(14),
  },
  confirmCategoryButton: {
    marginTop: verticalScale(8),
    backgroundColor: "#D4A373",
    padding: scale(8),
    borderRadius: scale(6),
  },
  errorText: {
    color: "red",
    marginBottom: 8,
  },
  submitButton: {
    padding: scale(12),
    borderRadius: scale(10),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: scale(8),
  },

  categoryEditInput: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#1A1A1A",
    backgroundColor: "#F3F0EC",
    padding: scale(6),
    borderRadius: scale(6),
    marginBottom: scale(8),
  },
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
  editItemImage: {
    width: scale(30),
    height: scale(30),
    borderRadius: scale(6),
    backgroundColor: "#E8DFD5",
    marginRight: scale(8),
  },
  editNameInput: {
    flex: 1,
    backgroundColor: "#F3F0EC",
    padding: scale(6),
    borderRadius: scale(6),
    fontSize: moderateScale(13),
  },
  editPriceInput: {
    width: scale(60),
    textAlign: "right",
    backgroundColor: "#F3F0EC",
    padding: scale(6),
    borderRadius: scale(6),
    marginLeft: scale(10),
    fontSize: moderateScale(13),
  },
  rowActions: {
    flexDirection: "row",
    marginLeft: scale(10),
  },
  menuDisplayRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    flex: 1,
  },
  menuDisplayImage: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(8),
    backgroundColor: "#E8DFD5",
  },
  menuItemName: {
    fontSize: moderateScale(13),
    color: "#333",
  },
  menuItemDescription: {
    fontSize: moderateScale(11),
    color: "#888",
    marginTop: scale(2),
  },
  menuItemPrice: {
    fontSize: moderateScale(13),
    color: "#777",
  },
  removeImageText: {
    color: "red",
    textAlign: "center",
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: "#D4A373",
    padding: scale(10),
    borderRadius: scale(8),
  },

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

  previewOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  previewImage: {
    width: "90%",
    height: "60%",
    borderRadius: scale(12),
  },
});