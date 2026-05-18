import * as ImagePicker from "expo-image-picker";

import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Bookmark, BookOpen, Globe, Grid3X3, Heart, MapPin, Pencil, Plus, Star, Trash2, X } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { ResizeMode, Video } from "expo-av";
import {
  deviceWidth,
  moderateScale,
  scale,
  verticalScale,
} from "../utils/responsive";

import BottomNav from "../components/ui/BottomNav";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput } from "react-native";
import { supabase } from "../api/supabaseClient";
import { useNavigation } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";

type Comment = { text: string };

type Post = {
  id: string | number;
  images: string[];
  media?: { file_url: string; file_type: "image" | "video" }[];
  hasVideo?: boolean;

  likes: number;
  liked: boolean;
  comments: Comment[];

  caption?: string;
  location?: string;
  saved?: boolean;
  tags?: string[];
};

type Cafe = {
  id: string;
  owner_id?: string;
  name?: string;
  address?: string;
  image_url?: string;
  image_urls?: string[];
  description?: string;
  price_level?: number;
  rating?: number;
  visits?: number;
  isOpen?: boolean;
  instagram_url?: string | null;
  facebook_url?: string | null;
  website_url?: string | null;
  attributes?: string[] | null;
};
  const TAG_OPTIONS = [
    "Cozy", "Quiet", "Lively", "Outdoor Seating", "Pet Friendly", "WiFi", "Power Outlets",
    "Specialty Drinks", "Great Pastries", "Vegan Options", "Study-friendly", "Good for Meetings",
    "Instagrammable", "Late-night", "Early morning"
  ];
export default function CafeProfileScreen() {
    const route = useRoute<any>();
    const { cafeId } = route.params || {};

    const contentWidth = Math.min(deviceWidth * 0.9, 480);
    const photoSize = (contentWidth - 6) / 3;
    const heroWidth = Math.min(deviceWidth, 430);

    const [cafe, setCafe] = useState<Cafe | null>(null);
    const [cafeLoading, setCafeLoading] = useState(true);

    const [newName, setNewName] = useState("");
    const navigation = useNavigation<any>();
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
    const [showAddPostModal, setShowAddPostModal] = useState(false);
    const [postCaption, setPostCaption] = useState("");
    const [selectedMedia, setSelectedMedia] = useState<
      { uri: string; type: "image" | "video" }[]
    >([]);
    const [posting, setPosting] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [averageRating, setAverageRating] = useState<number | null>(null);
    const [visitCount, setVisitCount] = useState<number>(0);

    const [userId, setUserId] = useState<string | null>(null);
    const [ownerId, setOwnerId] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<"posts" | "menu" | "reviews">("posts");
    const [menuItems, setMenuItems] = useState<any[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [postsLoading, setPostsLoading] = useState(false);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);

    const [reviews, setReviews] = useState<any[]>([]);
    const [myReview, setMyReview] = useState<any | null>(null);
    const [reviewRating, setReviewRating] = useState<number | null>(null);
    const [reviewText, setReviewText] = useState("");
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewError, setReviewError] = useState("");
    const [reviewFormOpen, setReviewFormOpen] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
    const [hours, setHours] = useState<any[]>([]);
    const [heroIndex, setHeroIndex] = useState(0);
    const [cafeImages, setCafeImages] = useState<string[]>([]);
    const [previewIndex, setPreviewIndex] = useState(0);
    const [showHoursModal, setShowHoursModal] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [commentInput, setCommentInput] = useState("");

    const handleLike = (id: string | number) => {
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

    const handleSave = (id: string | number) => {
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, saved: !p.saved } : p))
      );
      if (selectedPost?.id === id) {
        setSelectedPost((prev) =>
          prev ? { ...prev, saved: !prev.saved } : prev
        );
      }
    };

    const handleAddComment = () => {
      if (!commentInput.trim() || !selectedPost) return;
      const newComment: Comment = { text: commentInput.trim() };
      setPosts((prev) =>
        prev.map((p) => p.id === selectedPost.id ? { ...p, comments: [...p.comments, newComment] } : p)
      );
      setSelectedPost((prev) => prev ? { ...prev, comments: [...prev.comments, newComment] } : prev);
      setCommentInput("");
    };

    const toggleTag = (tag: string) => {
      setSelectedTags((prev) =>
        prev.includes(tag)
          ? prev.filter((t) => t !== tag)
          : [...prev, tag]
      );
    };

  const isOwner = !!userId && !!ownerId && userId === ownerId;
  const canReview = userRole === "user";

  const { colors: themeColors } = useTheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(scale(18))).current;
  const tabFadeAnim = useRef(new Animated.Value(1)).current;

  const pickMedia = async () => {
    if (selectedMedia.length >= 5) {
      alert("Max 5 images");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newItems: { uri: string; type: "image" | "video" }[] = result.assets.map((a) => ({
      uri: a.uri,
      type: a.type === "video" ? "video" : "image",
    }));
  
        setSelectedMedia((prev) => [...prev, ...newItems].slice(0, 5));
    }
  };

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id || null;

      setUserId(uid);

      if (uid) {
        const { data: profile, error } = await supabase
          .from("profiles") // change if your table name is different
          .select("role")
          .eq("id", uid)
          .single();

        if (!error) {
          setUserRole(profile?.role || null);
        } else {
          console.error("Role fetch error:", error);
        }
      }

      setAuthLoading(false);
    };

    getUser();
  }, []);

  useEffect(() => {
    if (authLoading) return;

    const fetchCafe = async () => {
      setCafeLoading(true);

      const currentUserId = userId;

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

        const resolvedId = cafeId || data.id;
        if (resolvedId) {
          const { data: imgs, error: imgsError } = await supabase
            .from("cafe_images")
            .select("image_url")
            .eq("cafe_id", resolvedId)
            .order("order_index", { ascending: true });
          console.log("[cafe_images] resolvedId:", resolvedId, "rows:", imgs, "error:", imgsError);
          if (imgs && imgs.length > 0) {
            setCafeImages(imgs.map((r: any) => r.image_url).filter(Boolean));
          }
        }
      } else {
        setCafe(null);
      }

      setCafeLoading(false);
    };

    fetchCafe();
  }, [cafeId, userId, authLoading]);

    const getTodayIndex = () => {
      const jsDay = new Date().getDay(); // 0 = Sunday
      return (jsDay + 6) % 7; // converts to 0 = Monday
    };

  const getCafeStatus = () => {
    if (!hours || hours.length === 0) {
      return { label: "Hours unavailable", color: "#999" };
    }

    const now = new Date();
    const today = getTodayIndex();

    const todayHours = hours.find(
      h => Number(h.day_of_week) === today
    );

    if (!todayHours || !todayHours.open_time || !todayHours.close_time) {
      return { label: "Closed", color: "#999" };
    }

    const [openH, openM] = todayHours.open_time.split(":").map(Number);
    const [closeH, closeM] = todayHours.close_time.split(":").map(Number);

    const openDate = new Date();
    openDate.setHours(openH, openM, 0);

    const closeDate = new Date();
    closeDate.setHours(closeH, closeM, 0);

    if (now >= openDate && now <= closeDate) {
      return {
        label: `Open • Closes at ${todayHours.close_time.slice(0, 5)}`,
        color: "#D4A373",
      };
    }

    return { label: "Closed", color: "#999" };
  };

  const status = getCafeStatus();

  const handleCreatePost = async () => {
    if (selectedMedia.length === 0 || !cafe?.id || !userId) return;

    setPosting(true);

    try {
      const uploadResults = await Promise.all(
        selectedMedia.map(async (m) => {
          const response = await fetch(m.uri);
          const blob = await response.blob();

          const extension = m.type === "video" ? "mp4" : "jpg";
          const contentType = m.type === "video" ? "video/mp4" : "image/jpeg";

          const fileName = `${cafe.id}/${Date.now()}-${Math.random()}.${extension}`;

          const { error } = await supabase.storage
            .from("posts")
            .upload(fileName, blob, {
              contentType,
              upsert: true,
            });

          if (error) {
            console.error(error);
            return null;
          }

          const { data } = supabase.storage
            .from("posts")
            .getPublicUrl(fileName);

          return {
            url: data.publicUrl,
            path: fileName,
            type: m.type,
          };
        })
      );

      const validUploads = uploadResults.filter(
        (item): item is { url: string; path: string; type: "image" | "video" } =>
          item !== null
      );

      if (validUploads.length === 0) return;

      const { data: postData, error: postError } = await supabase
        .from("posts")
        .insert([
          {
            cafe_id: cafe.id,
            user_id: userId,
            caption: postCaption,
            tags: selectedTags,
            post_type: isOwner ? "owner" : "user",
          },
        ])
        .select()
        .single();

      if (postError || !postData) {
        console.error(postError);
        return;
      }

      const { error: mediaError } = await supabase
        .from("post_media")
        .insert(
          validUploads.map((item) => ({
            post_id: postData.id,
            file_url: item.url,
            file_path: item.path,
            file_type: item.type,
          }))
        );

      if (mediaError) {
        console.error("POST MEDIA ERROR:", mediaError);
      }

      const imageUrls = validUploads
        .filter((item) => item.type === "image")
        .map((item) => item.url);

        const newPost: Post = {
          id: postData.id,

          images: imageUrls,

          media: validUploads.map((item) => ({
            file_url: item.url,
            file_type: item.type,
          })),

          hasVideo: validUploads.some((item) => item.type === "video"),

          likes: 0,
          liked: false,
          comments: [],
          caption: postCaption,
          tags: selectedTags,
        };

      setPosts((prev) => [newPost, ...prev]);

      // reset
      setPostCaption("");
      setSelectedMedia([]);
      setSelectedTags([]);
      setShowAddPostModal(false);

    } finally {
      setPosting(false);
    }
  };

  const formatTime = (time: string) => {
    if (!time) return "";
    const [h, m] = time.split(":");
    const hour = Number(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formatted = hour % 12 || 12;
    return `${formatted}:${m} ${ampm}`;
  };

  useEffect(() => {
    if (!cafe?.id) return;

    const fetchHours = async () => {
      const { data, error } = await supabase
        .from("cafe_hours")
        .select("*")
        .eq("cafe_id", cafe.id);

      if (error) {
        console.error("Fetch hours error:", error);
        return;
      }
      console.log("HOURS DATA:", data);

      const sorted = (data || []).sort((a, b) => a.day_of_week - b.day_of_week);
      setHours(sorted);
    };

    fetchHours();
  }, [cafe?.id]);

  const isCafeOpenNow = () => {
    if (!hours || hours.length === 0) return false;

    const now = new Date();
    const today = getTodayIndex();

    const todayHours = hours.find(h => Number(h.day_of_week) === today);

    if (!todayHours || !todayHours.open_time || !todayHours.close_time) {
      return false;
    }

    const [openH, openM] = todayHours.open_time.split(":").map(Number);
    const [closeH, closeM] = todayHours.close_time.split(":").map(Number);

    const openDate = new Date();
    openDate.setHours(openH, openM, 0);

    const closeDate = new Date();
    closeDate.setHours(closeH, closeM, 0);

    return now >= openDate && now <= closeDate;
  };

  useEffect(() => {
    if (!cafe?.id) return;

    const fetchMenu = async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("cafe_id", cafe.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Fetch menu error:", error);
        return;
      }

      setMenuItems(data || []);
    };

    fetchMenu();
  }, [cafe?.id]);

  useEffect(() => {
    if (!cafe?.id) return;

    const fetchPosts = async () => {
      setPostsLoading(true);

      try {
        const { data, error } = await supabase
          .from("posts")
          .select("id, caption, tags, created_at, post_media(id, file_url, file_type)")
          .eq("cafe_id", cafe.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Fetch posts error:", error);
          return;
        }

        if (data) {
          const mapped = data.map((p: any) => {
            const media = p.post_media ?? [];

            return {
              id: p.id,

              // only images for grid thumbnails
              images: media
                .filter((m: any) => m.file_type === "image" && m.file_url)
                .map((m: any) => m.file_url as string),
              media: media,
              hasVideo: media.some((m: any) => m.file_type === "video"),

              likes: 0,
              liked: false,
              comments: [],
              caption: p.caption ?? "",
              tags: p.tags ?? [],
            };
          });

          setPosts(mapped);
        }
      } finally {
        setPostsLoading(false);
      }
    };

    fetchPosts();
  }, [cafe?.id]);

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
      .eq("cafe_id", cafe?.id);

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
    borderColor: themeColors.border,
    borderRadius: scale(8),
    padding: scale(10),
    marginBottom: verticalScale(10),
    color: themeColors.text,
    backgroundColor: themeColors.card,
  };


    const fetchReviews = async () => {
    if (!cafe?.id) return;


    setReviewsLoading(true);

    const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("cafe_id", cafe.id)
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
        if (mine) {
          setReviewRating(mine.rating);
          setReviewText(mine.review_text || "");
        }
    }
    setReviewsLoading(false);
    };

    useEffect(() => {
    if (!cafe?.id) return;
    fetchReviews();
    }, [cafe?.id, userId]);

    const submitReview = async () => {
    if (!userId || !cafe?.id) {
      setReviewError("You need to be logged in to leave a review.");
      return;
    }

    if (!canReview) {
      setReviewError("Cafe owners cannot leave reviews.");
      return;
    }

    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
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
        cafe_id: cafe.id,
        rating: reviewRating,
        review_text: reviewText.trim() || null,
        });

        if (error) {
        setReviewError("Could not submit review.");
        console.error(error);
        return;
        }
    }
    await fetchReviews();

    setReviewError("");
    setReviewFormOpen(false);
    };

  useEffect(() => {
    if (!cafe?.id) return;

    const fetchCafeStats = async () => {
      // FETCH REVIEWS
      const { data: reviewData, error: reviewError } = await supabase
        .from("reviews")
        .select("rating")
        .eq("cafe_id", cafe.id);

      if (reviewError) {
        console.error("Rating fetch error:", reviewError);
      }

      if (reviewData && reviewData.length > 0) {
        const avg =
          reviewData.reduce(
            (sum, row) => sum + Number(row.rating || 0),
            0
          ) / reviewData.length;

        setAverageRating(Number(avg.toFixed(1)));
      } else {
        setAverageRating(null);
      }

      // FETCH VISITS
      const { count, error: visitError } = await supabase
        .from("visits") // your visits/checkins table
        .select("*", { count: "exact", head: true })
        .eq("cafe_id", cafe.id);

      if (visitError) {
        console.error("Visit count fetch error:", visitError);
      }

      setVisitCount(count || 0);
    };

    fetchCafeStats();
  }, [cafe?.id, reviews]);

    if (cafeLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: themeColors.bg }]}>
        <ActivityIndicator size="small" color="#D4A373" />
      </View>
    );
  }

  if (!cafe) {
    return (
      <View style={[styles.centered, { backgroundColor: themeColors.bg }]}>
        <Text style={{ color: themeColors.text }}>Cafe not found.</Text>
        <BottomNav />
      </View>
    );
  }

  const heroImages: string[] = (() => {
    if (cafeImages.length > 0) return cafeImages;
    const arr: string[] = [];
    if (Array.isArray(cafe.image_urls)) {
      for (const u of cafe.image_urls) if (u && !arr.includes(u)) arr.push(u);
    }
    if (cafe.image_url && !arr.includes(cafe.image_url)) arr.push(cafe.image_url);
    if (arr.length === 0) arr.push("https://picsum.photos/800");
    return arr;
  })();

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: scale(100) }}
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <View style={{ maxWidth: 430, width: "100%", alignSelf: "center" }}>
          <View style={styles.hero}>
            {heroImages.length > 1 ? (
              <FlatList
                data={heroImages}
                keyExtractor={(_, i) => `hero-${i}`}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const i = Math.round(e.nativeEvent.contentOffset.x / heroWidth);
                  setHeroIndex(i);
                }}
                renderItem={({ item }) => (
                  <Image source={{ uri: item }} style={[styles.heroImage, { width: heroWidth }]} />
                )}
              />
            ) : (
              <Image source={{ uri: heroImages[0] }} style={styles.heroImage} />
            )}
            {heroImages.length > 1 && (
              <View style={styles.heroDots} pointerEvents="none">
                {heroImages.map((_, i) => (
                  <View
                    key={`hero-dot-${i}`}
                    style={[styles.heroDot, i === heroIndex && styles.heroDotActive]}
                  />
                ))}
              </View>
            )}
            <View style={styles.heroOverlay}>
              <TouchableOpacity
                style={[styles.statusBadge, { borderColor: status.color }]}
                onPress={() => setShowHoursModal(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.statusBadgeText, { color: status.color }]}>{status.label}</Text>
              </TouchableOpacity>
              <Text style={styles.heroTitle}>{cafe.name || "Cafe"}</Text>
              <Text style={styles.heroSubtitle}>
                ⭐ {averageRating ?? "New"} · {cafe.address || "No address"}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ width: contentWidth, alignSelf: "center" }}>
          <View style={styles.header}>
            {cafe.description ? (
              <Text style={[styles.bio, { color: themeColors.textMuted }]}>
                {cafe.description}
              </Text>
            ) : null}

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={[styles.statNumber, { color: themeColors.text }]}>{posts.length}</Text>
                <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>Posts</Text>
              </View>

              <View style={styles.stat}>
                <Text style={[styles.statNumber, { color: themeColors.text }]}>{visitCount}</Text>
                <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>Visits</Text>
              </View>

              <View style={styles.stat}>
                <Text style={[styles.statNumber, { color: themeColors.text }]}>
                  {averageRating ?? "New"}
                </Text>
                <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>Rating</Text>
              </View>

              <View style={styles.stat}>
                <Text style={[styles.statNumber, { color: themeColors.text }]}>
                  {"$".repeat(cafe.price_level || 1)}
                </Text>
                <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>Price</Text>
              </View>
            </View>

            {(cafe.instagram_url || cafe.facebook_url || cafe.website_url) && (
              <View style={styles.socialsRow}>
                {cafe.instagram_url ? (
                  <TouchableOpacity
                    style={[styles.socialChip, { backgroundColor: themeColors.iconBg, borderColor: themeColors.border }]}
                    onPress={() => Linking.openURL(cafe.instagram_url!).catch(() => {})}
                  >
                    <Globe size={scale(13)} color="#D4A373" />
                    <Text style={styles.socialChipText}>Instagram</Text>
                  </TouchableOpacity>
                ) : null}
                {cafe.facebook_url ? (
                  <TouchableOpacity
                    style={[styles.socialChip, { backgroundColor: themeColors.iconBg, borderColor: themeColors.border }]}
                    onPress={() => Linking.openURL(cafe.facebook_url!).catch(() => {})}
                  >
                    <Globe size={scale(13)} color="#D4A373" />
                    <Text style={styles.socialChipText}>Facebook</Text>
                  </TouchableOpacity>
                ) : null}
                {cafe.website_url ? (
                  <TouchableOpacity
                    style={[styles.socialChip, { backgroundColor: themeColors.iconBg, borderColor: themeColors.border }]}
                    onPress={() => Linking.openURL(cafe.website_url!).catch(() => {})}
                  >
                    <Globe size={scale(13)} color="#D4A373" />
                    <Text style={styles.socialChipText}>Website</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}

            {Array.isArray(cafe.attributes) && cafe.attributes.length > 0 && (
              <View style={styles.tagChipsRow}>
                {cafe.attributes.map((tag) => (
                  <View key={tag} style={[styles.attributeChip, { backgroundColor: themeColors.iconBg, borderColor: themeColors.border }]}>
                    <Text style={styles.attributeChipText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

        {isOwner && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={() => navigation.navigate("CafeEdit")}
              style={[styles.editProfileButton, { backgroundColor: themeColors.card }]}
              activeOpacity={0.85}
            >
              <Pencil size={scale(15)} color="#D4A373" />
              <Text style={styles.editProfileButtonText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowAddPostModal(true)}
              style={styles.addPostButton}
              activeOpacity={0.85}
            >
              <Plus size={scale(16)} color="#FFF" />
              <Text style={styles.addPostButtonText}>Add Post</Text>
            </TouchableOpacity>
          </View>
        )}

          <View style={[styles.tabs, { borderBottomColor: themeColors.border }]}>
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
                    <Text style={[styles.emptyTitle, { color: themeColors.textMuted }]}>No posts yet</Text>
                    <Text style={styles.emptySubtitle}>
                      {isOwner
                        ? "Share your first photo!"
                        : "No cafe photos have been posted yet."}
                    </Text>
                  </View>
                ) : (
                <View style={styles.grid}>
                  {posts.map((post) => {
                    const firstMedia = post.media?.[0];
                    if (!firstMedia) return null;
                    const isVideo = firstMedia.file_type === "video";

                    return (
                    <TouchableOpacity
                      key={post.id}
                      onPress={() => setSelectedPost(post)}
                    >
                      <View>
                        {(() => {
                          const firstMedia = post.media?.[0];
                          if (!firstMedia) return null;

                          const isVideo = firstMedia.file_type === "video";

                          return isVideo ? (
                            <Video
                              source={{ uri: firstMedia.file_url }}
                              style={{
                                width: photoSize,
                                height: photoSize,
                                margin: 1,
                                borderRadius: scale(4),
                              }}
                              resizeMode={ResizeMode.COVER}
                              shouldPlay={false} // grid = no autoplay
                              isLooping
                            />
                          ) : (
                            <Image
                              source={{ uri: firstMedia.file_url }}
                              style={{
                                width: photoSize,
                                height: photoSize,
                                margin: 1,
                                borderRadius: scale(4),
                              }}
                            />
                          );
                        })()}

                        {post.hasVideo && (
                          <View
                            style={{
                              position: "absolute",
                              top: 6,
                              right: 6,
                              backgroundColor: "rgba(0,0,0,0.6)",
                              borderRadius: 6,
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                            }}
                          >
                            <Text style={{ color: "#FFF", fontSize: 10 }}>▶</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                  })}
                </View>
                )}
              </>
            )}

            {activeTab === "menu" && (
              <View style={styles.section}>
                {!hasMenu && !isEditing && (
                  <View style={styles.emptyState}>
                    <Text style={[styles.emptyTitle, { color: themeColors.textMuted }]}>No menu yet</Text>

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
                    <View style={styles.menuSectionHeader}>
                      <Text style={styles.sectionTitle}>
                        {isEditing ? "Editing Menu" : "Menu"}
                      </Text>
                      {isOwner && (
                        <TouchableOpacity
                          onPress={() => {
                            if (isEditing) {
                              setIsEditing(false);
                              setAddingItemCategory(null);
                              setEditingItemId(null);
                              setFormError("");
                              setNewName("");
                              setNewPrice("");
                              setNewCategory("");
                              setNewDescription("");
                              setNewImage(null);
                            } else {
                              setIsEditing(true);
                            }
                          }}
                          style={styles.menuEditToggle}
                        >
                          {isEditing ? (
                            <Text style={styles.doneText}>Done</Text>
                          ) : (
                            <Pencil size={scale(14)} color="#D4A373" />
                          )}
                        </TouchableOpacity>
                      )}
                    </View>

                    {isEditing && isOwner && (
                      <TouchableOpacity
                        onPress={() => setAddingItemCategory("GLOBAL")}
                        style={styles.addButton}
                      >
                        <Text style={styles.primaryButtonText}>+ Add Item</Text>
                      </TouchableOpacity>
                    )}

                    {isEditing && addingItemCategory === "GLOBAL" && (
                      <View style={[styles.formCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                        <View style={styles.formHeader}>
                          <Text style={[styles.formTitle, { color: themeColors.text }]}>Add Item</Text>

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
                            style={[styles.closeSmallButton, { backgroundColor: themeColors.iconBg }]}
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
                          placeholder="Description (optional)"
                          value={newDescription}
                          onChangeText={setNewDescription}
                          style={[inputStyle, { minHeight: verticalScale(60) }]}
                          multiline
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
                          style={[styles.imageButton, { backgroundColor: themeColors.iconBg }]}
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
                            style={[styles.dropdownTrigger, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
                          >
                            <View style={styles.dropdownRow}>
                              <Text style={{ color: newCategory ? themeColors.text : themeColors.textMuted }}>
                                {newCategory || "Select Category"}
                              </Text>
                              <Text>▼</Text>
                            </View>
                          </TouchableOpacity>

                          {showCategoryDropdown && (
                            <View style={[styles.dropdownList, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
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
                                    <Text style={{ fontSize: moderateScale(14), color: themeColors.text }}>
                                      {cat}
                                    </Text>
                                  </TouchableOpacity>
                                ))
                              ) : (
                                <Text style={{ padding: 10, color: themeColors.textMuted }}>
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
                                    cafe_id: cafe?.id,
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
                              style={[styles.categoryEditInput, { backgroundColor: themeColors.iconBg, color: themeColors.text }]}
                            />
                          ) : (
                            <TouchableOpacity
                              onPress={() => {
                                setEditingCategory(section.title);
                                setNewCategoryName(section.title);
                              }}
                            >
                              <Text style={[styles.menuSectionTitle, { color: themeColors.text }]}>
                                {section.title}
                              </Text>
                            </TouchableOpacity>
                          )
                        ) : (
                          <Text style={[styles.menuSectionTitle, { color: themeColors.text }]}>
                            {section.title}
                          </Text>
                        )}

                        {section.items.map((item: any, j: number) => (
                          <View key={j}>
                            <View style={[styles.menuItem, { borderBottomColor: themeColors.border }]}>
                              {isEditing && isOwner ? (
                                <>
                                  <Image
                                    source={
                                      item.image_url
                                        ? { uri: item.image_url }
                                        : undefined
                                    }
                                    style={[styles.editItemImage, { backgroundColor: themeColors.iconBg }]}
                                  />

                                  <TextInput
                                    value={item.name}
                                    onChangeText={(text) =>
                                      handleEditItem(item.id, "name", text)
                                    }
                                    style={[styles.editNameInput, { backgroundColor: themeColors.iconBg, color: themeColors.text }]}
                                  />

                                  <TextInput
                                    value={item.price}
                                    onChangeText={(text) =>
                                      handleEditItem(item.id, "price", text)
                                    }
                                    style={[styles.editPriceInput, { backgroundColor: themeColors.iconBg, color: themeColors.text }]}
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
                                      <Pencil size={scale(15)} color="#D4A373" />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                      onPress={() => handleDeleteItem(item)}
                                    >
                                      <Trash2 size={scale(15)} color="#C62828" />
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
                                        style={[styles.menuDisplayImage, { backgroundColor: themeColors.iconBg }]}
                                      />
                                    </TouchableOpacity>

                                    <View style={{ flex: 1 }}>
                                      <Text style={[styles.menuItemName, { color: themeColors.text }]}>
                                        {item.name}
                                      </Text>

                                      {item.description ? (
                                        <Text style={[styles.menuItemDescription, { color: themeColors.textMuted }]}>
                                          {item.description}
                                        </Text>
                                      ) : null}
                                    </View>
                                  </View>

                                  <Text style={[styles.menuItemPrice, { color: themeColors.textMuted }]}>
                                    ${item.price}
                                  </Text>
                                </View>
                              )}
                            </View>

                            {editingItemId === item.id && isOwner && (
                              <View style={[styles.formCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
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
                                  style={[styles.imageButton, { backgroundColor: themeColors.iconBg }]}
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
                {canReview && !reviewFormOpen && !myReview && (
                <TouchableOpacity
                  onPress={() => {
                    setReviewRating(null);
                    setReviewText("");
                    setReviewError("");
                    setReviewFormOpen(true);
                  }}
                  style={styles.addPostButton}
                  activeOpacity={0.85}
                >
                  <Plus size={scale(16)} color="#FFF" />
                  <Text style={styles.addPostButtonText}>Leave a review</Text>
                </TouchableOpacity>
                )}

                {canReview && reviewFormOpen && (
                <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                    <Text style={[styles.cardTitle, { color: themeColors.text }]}>
                    {myReview ? "Edit your review" : "Leave a review"}
                    </Text>

                    <View style={{ flexDirection: "row", marginVertical: verticalScale(10) }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity key={star} onPress={() => setReviewRating(star)}>
                        <Star
                            size={scale(24)}
                            color={star <= (reviewRating ?? 0) ? "#D4A373" : "#ddd"}
                            fill={star <= (reviewRating ?? 0) ? "#D4A373" : "transparent"}
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

                    <View style={{ flexDirection: "row", gap: scale(10), marginTop: verticalScale(8) }}>
                      <TouchableOpacity
                        onPress={() => {
                          setReviewError("");
                          setReviewFormOpen(false);
                          if (myReview) {
                            setReviewRating(myReview.rating);
                            setReviewText(myReview.review_text || "");
                          } else {
                            setReviewRating(null);
                            setReviewText("");
                          }
                        }}
                        style={{
                          width: scale(42),
                          height: scale(42),
                          borderRadius: scale(10),
                          borderWidth: 1,
                          borderColor: "#D4A373",
                          backgroundColor: themeColors.card,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        activeOpacity={0.85}
                      >
                        <X size={scale(18)} color="#D4A373" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={submitReview} style={[styles.addPostButton, { flex: 1 }]} activeOpacity={0.85}>
                        <Text style={styles.addPostButtonText}>
                          {myReview ? "Update Review" : "Submit Review"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                </View>
                )}

                {reviewsLoading ? (
                <View style={styles.emptyState}>
                    <ActivityIndicator size="small" color="#D4A373" />
                </View>
                ) : reviews.length === 0 ? (
                <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                    <Text style={[styles.cardTitle, { color: themeColors.text }]}>No reviews yet</Text>
                    <Text style={[styles.cardSubtitle, { color: themeColors.textMuted }]}>
                    Be the first to leave a review.
                    Please note that cafe owners cannot review any cafes.
                    </Text>
                </View>
                ) : (
                reviews.map((review) => {
                  const isMine = !!userId && review.user_id === userId;
                  return (
                    <View key={review.id} style={styles.card}>
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: verticalScale(6) }}>
                        <View style={{ flexDirection: "row", flex: 1 }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={scale(14)}
                              color={star <= review.rating ? "#D4A373" : "#ddd"}
                              fill={star <= review.rating ? "#D4A373" : "transparent"}
                            />
                          ))}
                        </View>
                        {isMine && (
                          <TouchableOpacity
                            onPress={() => {
                              setReviewRating(review.rating);
                              setReviewText(review.review_text || "");
                              setReviewError("");
                              setReviewFormOpen(true);
                            }}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            style={[styles.reviewEditBtn, { backgroundColor: themeColors.iconBg, borderColor: themeColors.border }]}
                            accessibilityLabel="Edit your review"
                          >
                            <Pencil size={scale(14)} color="#D4A373" />
                          </TouchableOpacity>
                        )}
                      </View>

                      <Text style={[styles.cardTitle, { color: themeColors.text }]}>
                        {review.review_text || "No written review"}
                      </Text>
                      {isMine && (
                        <Text style={styles.reviewMineLabel}>Your review</Text>
                      )}
                    </View>
                  );
                })
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

      {showHoursModal && (
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowHoursModal(false)}
        >
          <View style={[styles.hoursModal, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.hoursTitle, { color: themeColors.text }]}>Opening Hours</Text>

            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day, index) => {
              const now = new Date();
              const today = getTodayIndex();
              const isToday = index === today;
              const dbDay = index;

              const dayData = hours.find(
                  h => Number(h.day_of_week) === dbDay
                );

              return (
                <View
                  key={day}
                  style={[
                    styles.hoursRow,
                    isToday && { backgroundColor: themeColors.accentMuted, borderRadius: 8, padding: 6 },
                  ]}
                >
                  <Text
                    style={[
                      styles.hoursDay,
                      { color: themeColors.text },
                      isToday && { fontWeight: "700", color: "#D4A373" },
                    ]}
                  >
                    {day}
                  </Text>

                  <Text
                    style={[
                      styles.hoursTime,
                      { color: themeColors.textMuted },
                      isToday && { fontWeight: "700", color: "#D4A373" },
                    ]}
                  >
                    {dayData && dayData.open_time && dayData.close_time
                      ? `${formatTime(dayData.open_time)} - ${formatTime(dayData.close_time)}`
                      : "Closed"}
                  </Text>
                </View>
              );
            })}

            <TouchableOpacity onPress={() => setShowHoursModal(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      {showAddPostModal && (
      <Modal visible animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles.postModalContainer, { backgroundColor: themeColors.bg }]}>

            {/* Header */}
            <View style={[styles.addPostHeader, { borderBottomColor: themeColors.border }]}>
              <TouchableOpacity
                onPress={() => {
                  setShowAddPostModal(false);
                  setSelectedMedia([]);
                  setPostCaption("");
                }}
              >
                <Text style={{ fontSize: 18 }}>✕</Text>
              </TouchableOpacity>

              <Text style={[styles.addPostTitle, { color: themeColors.text }]}>New Post</Text>

              <TouchableOpacity
                onPress={handleCreatePost}
                disabled={posting || selectedMedia.length === 0}
              >
                <View
                  style={[
                    styles.shareButton,
                    (selectedMedia.length === 0 || posting) && styles.shareButtonDisabled,
                  ]}
                >
                  <Text style={styles.shareButtonText}>
                    {posting ? "Posting…" : "Share"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={{ padding: scale(16) }}
              showsVerticalScrollIndicator={false}
            >
              {/* MEDIA */}
              <View style={{ marginBottom: scale(20) }}>
                {/* Add button ALWAYS visible */}
                <TouchableOpacity
                  onPress={pickMedia}
                  style={[
                    styles.mediaEmptyBox,
                    { height: scale(100), marginBottom: scale(12) },
                  ]}
                >
                  <Text style={[styles.mediaEmptyTitle, { color: themeColors.text }]}>
                    {selectedMedia.length === 0 ? "Add Photos" : "Add More"}
                  </Text>
                  <Text style={styles.mediaEmptySubtitle}>
                    {selectedMedia.length}/5 selected
                  </Text>
                </TouchableOpacity>

                {/* Preview */}
                {selectedMedia.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {selectedMedia.map((item, index) => (
                      <View key={index} style={{ marginRight: scale(10) }}>
                        <Image source={{ uri: item.uri }} style={styles.mediaPreview} />

                        <TouchableOpacity
                          onPress={() =>
                            setSelectedMedia((prev) =>
                              prev.filter((_, i) => i !== index)
                            )
                          }
                          style={styles.removeMediaBtn}
                        >
                          <Text style={{ color: "#FFF" }}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* CAPTION */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: themeColors.text }]}>Caption</Text>
                <TextInput
                  placeholder="Write something..."
                  placeholderTextColor="#BBB"
                  value={postCaption}
                  onChangeText={setPostCaption}
                  multiline
                  style={[styles.captionInput, { backgroundColor: themeColors.bg, borderColor: themeColors.border, color: themeColors.text }]}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: themeColors.text }]}>Tags</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: scale(8) }}>
                    {TAG_OPTIONS.map((tag) => {
                      const selected = selectedTags.includes(tag);
                      return (
                      <TouchableOpacity
                        key={tag}
                        onPress={() => toggleTag(tag)}
                        style={[styles.tagChip, { backgroundColor: themeColors.card, borderColor: themeColors.border }, selected && styles.tagChipSelected]}
                      >
                    <Text style={[styles.tagChipText, { color: themeColors.textMuted }, selected && styles.tagChipTextSelected]}>{tag}</Text>
                    </TouchableOpacity>
                    );
                  })}
              </View>
            </View>

              {/* OPTIONAL: show cafe context */}
              <Text style={styles.cafeContext}>
                Posting as {cafe?.name}
              </Text>
            </ScrollView>
  
          </View>
        </KeyboardAvoidingView>
      </Modal>
    )}

    <Modal
      visible={!!selectedPost}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => { setSelectedPost(null); setPreviewIndex(0); setCommentInput(""); }}
    >
      {selectedPost && (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.previewSheet, { backgroundColor: themeColors.bg, maxWidth: 430, width: "100%", alignSelf: "center" }]}>
          <TouchableOpacity
            style={styles.previewCloseBtn}
            onPress={() => { setSelectedPost(null); setPreviewIndex(0); setCommentInput(""); }}
            accessibilityLabel="Close"
          >
            <X size={scale(18)} color="#333" />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <View style={{ width: deviceWidth }}>
              <FlatList
                data={selectedPost.media ?? []}
                keyExtractor={(_, i) => `pv-${i}`}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(e) => {
                  const idx = Math.round(e.nativeEvent.contentOffset.x / deviceWidth);
                  setPreviewIndex(Math.max(0, Math.min(idx, (selectedPost.media?.length ?? 1) - 1)));
                }}
                scrollEventThrottle={32}
                onMomentumScrollEnd={(e) => {
                  setPreviewIndex(Math.round(e.nativeEvent.contentOffset.x / deviceWidth));
                }}
                onScrollEndDrag={(e) => {
                  setPreviewIndex(Math.round(e.nativeEvent.contentOffset.x / deviceWidth));
                }}
                renderItem={({ item }) =>
                  item.file_type === "video" ? (
                    <Video
                      source={{ uri: item.file_url }}
                      style={{ width: deviceWidth, height: deviceWidth }}
                      resizeMode={ResizeMode.COVER}
                      useNativeControls
                    />
                  ) : (
                    <Image
                      source={{ uri: item.file_url }}
                      style={{ width: deviceWidth, height: deviceWidth }}
                      resizeMode="cover"
                    />
                  )
                }
              />
              {(selectedPost.media?.length ?? 0) > 1 && (
                <View style={styles.previewDots} pointerEvents="none">
                  {selectedPost.media!.map((_, i) => (
                    <View
                      key={`pv-dot-${i}`}
                      style={[styles.previewDot, i === previewIndex && styles.previewDotActive]}
                    />
                  ))}
                </View>
              )}
            </View>

            {/* ── Actions ── */}
            <View style={styles.previewActionsRow}>
              <TouchableOpacity style={styles.previewActionBtn} onPress={() => handleLike(selectedPost.id)}>
                <Heart
                  size={scale(24)}
                  color={selectedPost.liked ? "#E0635A" : themeColors.text}
                  fill={selectedPost.liked ? "#E0635A" : "transparent"}
                  strokeWidth={selectedPost.liked ? 0 : 2}
                />
              </TouchableOpacity>
              <Text style={[styles.previewLikeCount, { color: themeColors.text }]}>{selectedPost.likes}</Text>
              <View style={{ flex: 1 }} />
              <TouchableOpacity style={styles.previewActionBtn} onPress={() => handleSave(selectedPost.id)}>
                <Bookmark
                  size={scale(24)}
                  color={selectedPost.saved ? "#D4A373" : themeColors.text}
                  fill={selectedPost.saved ? "#D4A373" : "transparent"}
                  strokeWidth={selectedPost.saved ? 0 : 2}
                />
              </TouchableOpacity>
            </View>

            {selectedPost.location ? (
              <View style={styles.previewLocationRow}>
                <MapPin size={scale(13)} color="#D4A373" />
                <Text style={styles.previewLocationText}>{selectedPost.location}</Text>
              </View>
            ) : null}

            {selectedPost.caption ? (
              <Text style={[styles.previewCaption, { color: themeColors.text }]}>{selectedPost.caption}</Text>
            ) : null}

            {selectedPost.tags && selectedPost.tags.length > 0 && (
              <View style={styles.previewTagsRow}>
                {selectedPost.tags.map((tag, i) => (
                  <View key={`pv-tag-${i}`} style={[styles.previewTagChip, { backgroundColor: themeColors.iconBg, borderColor: themeColors.border }]}>
                    <Text style={styles.previewTagChipText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* ── Comment input ── */}
          <View style={[styles.previewCommentBar, { backgroundColor: themeColors.card, borderTopColor: themeColors.border }]}>
            <TextInput
              placeholder="Add a comment…"
              placeholderTextColor={themeColors.textMuted}
              value={commentInput}
              onChangeText={setCommentInput}
              style={[styles.previewCommentInput, { backgroundColor: themeColors.iconBg, color: themeColors.text }]}
              returnKeyType="send"
              onSubmitEditing={handleAddComment}
            />
            <TouchableOpacity onPress={handleAddComment} disabled={!commentInput.trim()}>
              <Text style={[styles.previewCommentPostBtn, !commentInput.trim() && { opacity: 0.4 }]}>Post</Text>
            </TouchableOpacity>
          </View>

          {/* ── Comments list ── */}
          {selectedPost.comments.length > 0 && (
            <View style={[styles.previewCommentsSection, { borderTopColor: themeColors.border }]}>
              {selectedPost.comments.map((c, i) => (
                <Text key={i} style={[styles.previewCommentText, { color: themeColors.textMuted }]}>{c.text}</Text>
              ))}
            </View>
          )}
        </View>
        </KeyboardAvoidingView>
      )}
    </Modal>

      <BottomNav />
    </SafeAreaView>
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
  heroImage: { width: "100%", height: scale(240) },
  heroDots: {
    position: "absolute",
    top: scale(10),
    right: scale(12),
    flexDirection: "row",
    gap: scale(5),
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(10),
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  heroDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  heroDotActive: {
    backgroundColor: "#FFF",
    width: scale(10),
  },
  heroOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.52)",
    paddingHorizontal: scale(14),
    paddingTop: scale(22),
    paddingBottom: scale(14),
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: scale(10),
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    marginBottom: scale(6),
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  statusBadgeText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
  heroTitle: {
    color: "#FFF",
    fontSize: moderateScale(20),
    fontWeight: "700",
    marginBottom: scale(3),
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: moderateScale(12),
  },

  header: { paddingHorizontal: scale(16), paddingTop: scale(14), paddingBottom: scale(4) },
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
    marginBottom: verticalScale(10),
    lineHeight: moderateScale(19),
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
  menuSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: verticalScale(20),
    marginBottom: verticalScale(12),
  },
  menuEditToggle: {
    position: "absolute",
    right: 0,
    padding: scale(6),
  },
  sectionTitle: {
    color: "#D4A373",
    fontWeight: "700",
    fontSize: moderateScale(16),
    textAlign: "center",
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
  // editButton: {
  //   position: "absolute",
  //   right: scale(8),
  //   top: verticalScale(20),
  //   padding: scale(8),
  //   backgroundColor: "#fff",
  //   borderRadius: scale(20),
  //   elevation: 3,
  //   zIndex: 10,
  // },
  addPostButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#D4A373",
    paddingVertical: scale(11),
    borderRadius: scale(10),
    alignItems: "center",
    justifyContent: "center",
    gap: scale(6),
    shadowColor: "#D4A373",
    shadowOpacity: 0.25,
    shadowRadius: scale(6),
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  addPostButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: moderateScale(14),
  },
  reviewEditBtn: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7EE",
    borderWidth: 1,
    borderColor: "#F1E4D2",
  },
  reviewMineLabel: {
    fontSize: moderateScale(11),
    color: "#D4A373",
    fontWeight: "600",
    marginTop: verticalScale(4),
  },
  editProfileButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#FFF",
    paddingVertical: scale(11),
    borderRadius: scale(10),
    alignItems: "center",
    justifyContent: "center",
    gap: scale(6),
    borderWidth: 1,
    borderColor: "#D4A373",
  },
  editProfileButtonText: {
    color: "#D4A373",
    fontWeight: "600",
    fontSize: moderateScale(14),
  },
  socialsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: scale(8),
    marginTop: verticalScale(14),
  },
  socialChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
    paddingHorizontal: scale(10),
    paddingVertical: scale(6),
    borderRadius: scale(14),
    backgroundColor: "#FFF7EE",
    borderWidth: 1,
    borderColor: "#F1E4D2",
  },
  socialChipText: {
    color: "#8B6F47",
    fontSize: moderateScale(12),
    fontWeight: "500",
  },
  tagChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: scale(6),
    marginTop: verticalScale(12),
    paddingHorizontal: scale(8),
  },
  attributeChip: {
    paddingHorizontal: scale(10),
    paddingVertical: scale(5),
    borderRadius: scale(14),
    backgroundColor: "#FFF7EE",
    borderWidth: 1,
    borderColor: "#F1E4D2",
  },
  attributeChipText: {
    color: "#8B6F47",
    fontSize: moderateScale(11),
    fontWeight: "500",
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
  actionRow: {
    flexDirection: "row",
    gap: scale(12),
    marginTop: scale(16),
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: moderateScale(14),
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
  statusLink: {
    textDecorationLine: "underline",
    fontWeight: "600",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 200,
  },
  hoursModal: {
    width: Math.min(deviceWidth * 0.85, 360), 
    backgroundColor: "#FFF",
    padding: scale(18),
    borderRadius: scale(16),
  },
  hoursTitle: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    marginBottom: scale(12),
    textAlign: "center",
  },
  hoursRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: scale(8),
    alignItems: "center",
    paddingVertical: 8,
  },
  hoursDay: {
    fontSize: moderateScale(13),
    color: "#333",
  },
  hoursTime: {
    fontSize: moderateScale(13),
    color: "#777",
  },
  closeText: {
    marginTop: scale(12),
    textAlign: "center",
    color: "#D4A373",
    fontWeight: "600",
  },
  editButton: {
    flex: 1,
    backgroundColor: "#D4A373",
    paddingVertical: scale(12),
    borderRadius: scale(12),
    alignItems: "center",
  },
  postModal: {
    width: Math.min(deviceWidth * 0.85, 400),
    backgroundColor: "#FFF",
    padding: scale(16),
    borderRadius: scale(16),
  },
  postModalContainer: {
  flex: 1,
  backgroundColor: "#FFF",
},

addPostHeader: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: scale(16),
  paddingVertical: scale(14),
  borderBottomWidth: 1,
  borderBottomColor: "#EEE",
},

addPostTitle: {
  fontSize: moderateScale(16),
  fontWeight: "700",
  color: "#1A1A1A",
},

shareButton: {
  backgroundColor: "#D4A373",
  borderRadius: scale(20),
  paddingHorizontal: scale(16),
  paddingVertical: scale(7),
},

shareButtonDisabled: {
  backgroundColor: "#E8D5C0",
  opacity: 0.6,
},

shareButtonText: {
  color: "#FFF",
  fontWeight: "700",
  fontSize: moderateScale(14),
},

  mediaEmptyBox: {
    height: scale(200),
    borderRadius: scale(16),
    borderWidth: 1.5,
    borderColor: "#E0D8D0",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    gap: scale(8),
    backgroundColor: "rgba(212,163,115,0.04)",
    marginBottom: scale(20),
  },

  mediaEmptyTitle: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    color: "#2C1810",
  },

  mediaEmptySubtitle: {
    fontSize: moderateScale(12),
    color: "#AAA",
  },
  mediaPreview: {
    width: scale(110),
    height: scale(110),
    borderRadius: scale(12),
  },
  removeMediaBtn: {
    position: "absolute",
    top: scale(8),
    right: scale(8),
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: scale(14),
    width: scale(28),
    height: scale(28),
    justifyContent: "center",
    alignItems: "center",
  },

  inputGroup: {
    marginBottom: scale(20),
  },

  inputLabel: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#2C1810",
    marginBottom: scale(8),
  },

  captionInput: {
    fontSize: moderateScale(14),
    color: "#1A1A1A",
    lineHeight: moderateScale(22),
    minHeight: scale(90),
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#E8DFD5",
    borderRadius: scale(12),
    padding: scale(12),
    backgroundColor: "#F7F3F0",
  },
  cafeContext: {
    fontSize: moderateScale(12),
    color: "#AAA",
    textAlign: "center",
  },
  tagChip: {
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: "#E0D8D0",
    backgroundColor: "#FFF",
  },
  tagChipSelected: {
    backgroundColor: "#D4A373",
    borderColor: "#D4A373",
  },
  tagChipText: {
    fontSize: moderateScale(12),
    color: "#555",
  },
  tagChipTextSelected: {
    color: "#FFF",
    fontWeight: "600",
  },
  postPreviewContainer: {
    width: "100%",
    height: "80%",
    justifyContent: "center",
    alignItems: "center",
  },
  postPreviewMedia: {
    width: deviceWidth,
    height: "100%",
  },
  postPreviewCaption: {
    position: "absolute",
    bottom: scale(20),
    left: scale(16),
    right: scale(16),
    color: "#FFF",
    fontSize: moderateScale(14),
    textAlign: "center",
  },
  previewSheet: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  previewCloseBtn: {
    position: "absolute",
    top: scale(12),
    right: scale(12),
    zIndex: 10,
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: scale(4),
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  previewDots: {
    position: "absolute",
    bottom: scale(10),
    alignSelf: "center",
    flexDirection: "row",
    gap: scale(5),
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(10),
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  previewDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  previewDotActive: {
    backgroundColor: "#FFF",
    width: scale(10),
  },
  previewLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
    paddingHorizontal: scale(16),
    paddingTop: scale(12),
  },
  previewLocationText: {
    color: "#8B6F47",
    fontSize: moderateScale(12),
    fontWeight: "500",
  },
  previewCaption: {
    paddingHorizontal: scale(16),
    paddingTop: scale(12),
    color: "#1A1A1A",
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
  },
  previewTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(6),
    paddingHorizontal: scale(16),
    paddingTop: scale(12),
    paddingBottom: scale(24),
  },
  previewTagChip: {
    paddingHorizontal: scale(10),
    paddingVertical: scale(5),
    borderRadius: scale(14),
    backgroundColor: "#FFF7EE",
    borderWidth: 1,
    borderColor: "#F1E4D2",
  },
  previewTagChipText: {
    color: "#8B6F47",
    fontSize: moderateScale(11),
    fontWeight: "500",
  },
  previewActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(14),
    paddingVertical: scale(10),
  },
  previewActionBtn: { padding: scale(4) },
  previewLikeCount: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    marginLeft: scale(6),
  },
  previewCommentBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(14),
    paddingVertical: scale(10),
    borderTopWidth: 1,
    gap: scale(10),
  },
  previewCommentInput: {
    flex: 1,
    fontSize: moderateScale(14),
    borderRadius: scale(20),
    paddingHorizontal: scale(14),
    paddingVertical: scale(8),
  },
  previewCommentPostBtn: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#D4A373",
  },
  previewCommentsSection: {
    paddingHorizontal: scale(16),
    paddingBottom: scale(16),
    borderTopWidth: 1,
    paddingTop: scale(12),
    gap: scale(8),
  },
  previewCommentText: {
    fontSize: moderateScale(13),
    lineHeight: moderateScale(18),
  },
});