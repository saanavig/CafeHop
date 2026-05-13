import {
  Animated,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Bell, Search } from "lucide-react-native";
import ForYouCard, { Comment, Post } from "../components/ui/ForYouCard";
import React, { useEffect, useRef, useState } from "react";
import { deviceHeight, moderateScale, scale } from "../utils/responsive";

import AsyncStorage from "@react-native-async-storage/async-storage";
import BottomNav from "../components/ui/BottomNav";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch } from "../api/client";
import { supabase } from "../api/supabaseClient";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const FEED_CACHE_KEY = "cafehop_feed_cache_v1";

const fallbackImages = [
  "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=900",
  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900",
  "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=900",
  "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=900",
];

const getFallbackImage = (key?: string) => {
  const value = key || "cafe";
  let hash = 0;

  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }

  return fallbackImages[Math.abs(hash) % fallbackImages.length];
};

const isValidMediaUrl = (url?: string | null) => {
  return !!url && (url.startsWith("http://") || url.startsWith("https://"));
};

const getRandomItem = <T,>(items: T[]): T | null => {
  if (!items || items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
};

const safeJson = async (res: Response) => {
  const text = await res.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    console.log("NON JSON RESPONSE:", text.slice(0, 300));
    return {};
  }
};

const calculateDistanceMiles = (
  lat1: number,
  lon1: number,
  lat2?: number | null,
  lon2?: number | null
) => {
  if (lat2 == null || lon2 == null) return 999999;

  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

type FeedPost = Post & {
  itemType?: "post";
  cafeId?: string;
  isRecommended?: boolean;
  postId?: string;
  distanceMiles?: number;
  canLike?: boolean;
  canComment?: boolean;
  canSavePost?: boolean;
  canSaveCafe?: boolean;
  mediaType?: "image" | "video" | string;
  liked?: boolean;
  saved?: boolean;
  liked_by_user?: boolean;
  saved_by_user?: boolean;
};

type PostMedia = {
  file_url: string;
  file_type: string;
};

type UserCoords = {
  lat: number;
  lng: number;
};

let sessionFeedCache: FeedPost[] | null = null;

const Index = () => {
  const navigation = useNavigation<any>();
  const { colors: themeColors } = useTheme();

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [listHeight, setListHeight] = useState(deviceHeight - 180);
  const [loading, setLoading] = useState(true);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  const flatListRef = useRef<FlatList<FeedPost>>(null);
  const hasFetchedFeed = useRef(false);

  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-12)).current;

  const [currentUserType, setCurrentUserType] = useState<
    "user" | "cafe_owner"
  >("user");

  useEffect(() => {
    const loadUserType = async () => {
      const type = await AsyncStorage.getItem("userType");

      if (type === "user" || type === "cafe_owner") {
        setCurrentUserType(type);
      }
    };

    loadUserType();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }),
      Animated.timing(headerSlide, {
        toValue: 0,
        duration: 400,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (hasFetchedFeed.current) return;

    hasFetchedFeed.current = true;
    loadFeed();
    fetchUnreadNotificationStatus();
  }, []);

  const clearFeedCache = async () => {
    sessionFeedCache = null;
    await AsyncStorage.removeItem(FEED_CACHE_KEY);
  };

  const updatePostInState = (
    postId: string,
    updater: (post: FeedPost) => FeedPost
  ) => {
    setPosts((prev) =>
      prev.map((post) => {
        const id = post.postId || post.id;
        return id === postId ? updater(post) : post;
      })
    );
  };

  const handleLikePost = async (postId: string, currentlyLiked: boolean) => {
    const previousPost = posts.find((p) => (p.postId || p.id) === postId);
    if (!previousPost) return;

    const nextLiked = !currentlyLiked;

    updatePostInState(postId, (post) => ({
      ...post,
      liked: nextLiked,
      liked_by_user: nextLiked,
      likes: nextLiked
        ? Number(post.likes || 0) + 1
        : Math.max(0, Number(post.likes || 0) - 1),
    }));

    try {
      const res = await apiFetch(`/posts/${postId}/like`, {
        method: nextLiked ? "POST" : "DELETE",
      });

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Like failed");
      }

      updatePostInState(postId, (post) => ({
        ...post,
        liked: Boolean(data.liked_by_user ?? nextLiked),
        liked_by_user: Boolean(data.liked_by_user ?? nextLiked),
        likes:
          typeof data.likes_count === "number" ? data.likes_count : post.likes,
      }));
    } catch (err) {
      console.error("LIKE ERROR:", err);
      updatePostInState(postId, () => previousPost);
    }
  };

  const handleSavePost = async (postId: string, currentlySaved: boolean) => {
    const previousPost = posts.find((p) => (p.postId || p.id) === postId);
    if (!previousPost) return;

    const nextSaved = !currentlySaved;

    updatePostInState(postId, (post) => ({
      ...post,
      saved: nextSaved,
      saved_by_user: nextSaved,
    }));

    try {
      const res = await apiFetch(`/posts/${postId}/save`, {
        method: nextSaved ? "POST" : "DELETE",
      });

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Save failed");
      }
    } catch (err) {
      console.error("SAVE ERROR:", err);
      updatePostInState(postId, () => previousPost);
    }
  };

  const handleFetchComments = async (postId: string): Promise<Comment[]> => {
    try {
      const res = await apiFetch(`/posts/${postId}/comments`);
      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Fetch comments failed");
      }

      const comments = Array.isArray(data) ? data : [];

      updatePostInState(postId, (post) => ({
        ...post,
        comments: comments.length,
      }));

      return comments;
    } catch (err) {
      console.error("FETCH COMMENTS ERROR:", err);
      return [];
    }
  };

  const handlePostComment = async (
    postId: string,
    content: string
  ): Promise<Comment | null> => {
    const previousPost = posts.find((p) => (p.postId || p.id) === postId);
    if (!previousPost) return null;

    updatePostInState(postId, (post) => ({
      ...post,
      comments: Number(post.comments || 0) + 1,
    }));

    try {
      const res = await apiFetch(`/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Comment failed");
      }

      updatePostInState(postId, (post) => ({
        ...post,
        comments:
          typeof data.comments_count === "number"
            ? data.comments_count
            : post.comments,
      }));

      return {
        ...(data.comment || {}),
        username: "You",
        content,
      };
    } catch (err) {
      console.error("POST COMMENT ERROR:", err);
      updatePostInState(postId, () => previousPost);
      return null;
    }
  };

  const fetchUnreadNotificationStatus = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      const response = await fetch(`${API_URL}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await safeJson(response);

      const notifications = Array.isArray(data)
        ? data
        : data.notifications || [];

      const hasUnread = notifications.some((n: any) => !n.is_read);
      setHasUnreadNotifications(hasUnread);
    } catch (err) {
      console.log("UNREAD NOTIFICATION ERROR:", err);
    }
  };

  const loadFeed = async () => {
    try {
      setLoading(true);
      await clearFeedCache();
      await getUserLocationAndFetchFeed();
    } catch (err) {
      console.error("LOAD FEED ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const getToken = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;

    const token = data.session?.access_token;
    if (!token) throw new Error("No auth token found");

    return token;
  };

  const getUserLocation = (): Promise<UserCoords> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => reject(error)
      );
    });
  };

  const getUserLocationAndFetchFeed = async () => {
    try {
      const coords = await getUserLocation();
      await fetchFeed(coords);
    } catch {
      await fetchFeed({
        lat: 40.741,
        lng: -73.989,
      });
    }
  };

  const uniqueByKey = <T,>(
    items: T[],
    getKey: (item: T) => string | undefined
  ) => {
    const seen = new Set<string>();
    const unique: T[] = [];

    for (const item of items) {
      const key = getKey(item);
      if (!key || seen.has(key)) continue;

      seen.add(key);
      unique.push(item);
    }

    return unique;
  };

  const getRecCafeId = (rec: any) => {
    return String(rec?.display?.cafe_id || rec?.cafe?.id || rec?.cafe_id || "");
  };

  const getPostMediaFromPost = (post: any): PostMedia | null => {
    const mediaList: any[] = post?.post_media || post?.media || [];

    const validMedia: PostMedia[] = mediaList.filter((m: any): m is PostMedia =>
      isValidMediaUrl(m?.file_url) && typeof m?.file_type === 'string'
    );

    const item = getRandomItem(validMedia);
    return item;
  };

  const buildPostCard = (
    post: any,
    cafe: any,
    isRecommended: boolean,
    coords: UserCoords,
    explanation?: string
  ): FeedPost | null => {
    const cafeId = String(post?.cafe_id || cafe?.id || post?.cafes?.id || "");
    const postId = String(post?.id || post?.post_id || "");
    const cafeName = cafe?.name || post?.cafes?.name || "Cafe";

    const media = getPostMediaFromPost(post);
    const mediaUrl = media?.file_url;
    const mediaType = media?.file_type;

    if (!postId || !cafeId || !mediaUrl) return null;

    const distanceMiles = calculateDistanceMiles(
      coords.lat,
      coords.lng,
      cafe?.latitude ?? post?.cafes?.latitude,
      cafe?.longitude ?? post?.cafes?.longitude
    );

    const likedByUser = Boolean(post.liked_by_user);
    const savedByUser = Boolean(post.saved_by_user);

    return {
      id: postId,
      itemType: "post",
      postId,
      cafeId,
      isRecommended,
      cafeName,
      image: { uri: mediaUrl },
      mediaType,

      caption: isRecommended
        ? explanation ||
          post.caption ||
          "Recommended for you based on your cafe preferences."
        : post.caption || `Posted at ${cafeName}`,

      likes: Number(post.likes_count || 0),
      liked: likedByUser,
      liked_by_user: likedByUser,

      comments: Number(post.comments_count || 0),

      saved: savedByUser,
      saved_by_user: savedByUser,

      postedBy:
        post.author_type === "cafe_owner"
          ? cafeName
          : post.author_profile?.full_name ||
            post.author_profile?.first_name ||
            "User",

      postedById:
        post.author_type === "cafe_owner"
          ? post.cafes?.id || post.cafe_id
          : post.author_id || post.user_id,

      postedByType:
        post.author_type === "cafe_owner" ? "cafe_owner" : "user",

      tags: isRecommended ? ["recommended", "for-you"] : ["cafe"],
      location: cafe?.address || post?.cafes?.address || "Nearby",
      commentList: [],
      distanceMiles,
      canLike: true,
      canComment: true,
      canSavePost: true,
      canSaveCafe: true,
    };
  };

  const fetchFeed = async (coords: UserCoords) => {
    try {
      setLoading(true);

      const token = await getToken();

      const recRes = await fetch(
        `${API_URL}/api/recommendations?lat=${coords.lat}&lng=${coords.lng}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const recData = await safeJson(recRes);
      const rawRecommendations = recData.recommendations || [];

      const recommendations = uniqueByKey(rawRecommendations, (rec: any) =>
        getRecCafeId(rec)
      );

      const maxDistanceMiles =
        Number(rawRecommendations?.[0]?.max_distance_miles) || 5;

      let explanationMap: Record<string, string> = {};

      try {
        const expRes = await fetch(
          `${API_URL}/api/recommendations/explanations?lat=${coords.lat}&lng=${coords.lng}&limit=10`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const expData = await safeJson(expRes);
        const explanations = expData.explanations || [];

        for (const item of explanations) {
          if (item.cafe_id && item.explanation) {
            explanationMap[String(item.cafe_id)] = item.explanation;
          }
        }
      } catch (err) {
        console.log("EXPLANATIONS FETCH FAILED:", err);
      }

      const cafesRes = await fetch(`${API_URL}/api/cafe/all`);
      const cafesData = await safeJson(cafesRes);
      const allCafes = Array.isArray(cafesData) ? cafesData : [];

      const postsRes = await fetch(`${API_URL}/api/posts/feed`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const postsData = await safeJson(postsRes);
      const rawPosts = postsData.posts || [];

      const postsByCafe: Record<string, any[]> = {};

      for (const post of rawPosts) {
        const cafeId = String(post.cafe_id || post?.cafes?.id || "");
        if (!cafeId) continue;

        if (!postsByCafe[cafeId]) postsByCafe[cafeId] = [];
        postsByCafe[cafeId].push(post);
      }

      const recMap: Record<string, any> = {};

      for (const rec of recommendations) {
        const cafeId = getRecCafeId(rec);
        if (cafeId) recMap[cafeId] = rec;
      }

      const recommendedIds = new Set(Object.keys(recMap));

      const buildCafeCard = (
        cafe: any,
        isRecommended: boolean,
        explanation?: string
      ): FeedPost | null => {
        const cafeId = String(cafe.id || "");
        if (!cafeId) return null;

        const cafePosts = postsByCafe[cafeId] || [];

        const postsWithMedia = cafePosts.filter((post: any) =>
          (post?.post_media || []).some((m: any) =>
            isValidMediaUrl(m?.file_url)
          )
        );

        const randomPost = getRandomItem(postsWithMedia);
        if (!randomPost) return null;

        return buildPostCard(
          randomPost,
          cafe,
          isRecommended,
          coords,
          explanation
        );
      };

      const recommendedCards = recommendations
        .map((rec: any) => {
          const cafe = rec.cafe || {};
          const cafeId = String(cafe.id || rec.display?.cafe_id || "");

          if (!cafeId) return null;

          const explanation =
            explanationMap[cafeId] ||
            rec.display?.caption ||
            (rec.reasons?.length
              ? `Recommended because ${String(rec.reasons[0]).toLowerCase()}.`
              : "Recommended for you based on your cafe preferences.");

          return buildCafeCard(cafe, true, explanation);
        })
        .filter((card: FeedPost | null): card is FeedPost => card !== null);

      const nonRecommendedCafes = allCafes
        .filter((cafe: any) => !recommendedIds.has(String(cafe.id)))
        .map((cafe: any) => ({
          ...cafe,
          distanceMiles: calculateDistanceMiles(
            coords.lat,
            coords.lng,
            cafe.latitude,
            cafe.longitude
          ),
        }));

      const nearbyCafes = nonRecommendedCafes
        .filter((cafe: any) => cafe.distanceMiles <= maxDistanceMiles)
        .sort((a: any, b: any) => a.distanceMiles - b.distanceMiles);

      const nearbyIds = new Set(
        nearbyCafes.map((cafe: any) => String(cafe.id))
      );

      const remainingCafes = nonRecommendedCafes
        .filter((cafe: any) => !nearbyIds.has(String(cafe.id)))
        .sort((a: any, b: any) => a.distanceMiles - b.distanceMiles);

      const nearbyCards = nearbyCafes
        .map((cafe: any) => buildCafeCard(cafe, false))
        .filter((card: FeedPost | null): card is FeedPost => card !== null);

      const remainingCards = remainingCafes
        .map((cafe: any) => buildCafeCard(cafe, false))
        .filter((card: FeedPost | null): card is FeedPost => card !== null);

      const finalFeed = uniqueByKey(
        [...recommendedCards, ...nearbyCards, ...remainingCards],
        (item) => item.cafeId
      );

      setPosts(finalFeed);
      sessionFeedCache = finalFeed;
    } catch (err) {
      console.error("FEED FETCH ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter((post) => {
    const caption = post.caption || "";
    const cafeName = post.cafeName || "";
    const searchText = search || "";

    return (
      caption.toLowerCase().includes(searchText.toLowerCase()) ||
      cafeName.toLowerCase().includes(searchText.toLowerCase())
    );
  });

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <View style={{ maxWidth: 430, width: "100%", alignSelf: "center", flex: 1 }}>
      <Animated.View
        style={[
          styles.header,
          {
            paddingTop: scale(12),
            opacity: headerFade,
            transform: [{ translateY: headerSlide }],
          },
        ]}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>CAFEHOP</Text>

          <TouchableOpacity
            onPress={() => {
              setHasUnreadNotifications(false);
              navigation.navigate("Notifications");
            }}
            style={styles.bellBtn}
          >
            <Bell size={scale(22)} color="#D4A373" strokeWidth={2} />

            {hasUnreadNotifications && <View style={[styles.notificationDot, { borderColor: themeColors.bg }]} />}
          </TouchableOpacity>
        </View>

        <View style={[styles.searchRow, { backgroundColor: themeColors.card, borderColor: themeColors.border }] }>
          <Search
            size={scale(18)}
            color="#AAA"
            style={{ marginRight: scale(8) }}
          />

          <TextInput
            placeholder="Search cafes..."
            placeholderTextColor={themeColors.textMuted}
            style={[styles.searchInput, { color: themeColors.text }]}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </Animated.View>

      <View
        style={{ flex: 1 }}
        onLayout={(e) => setListHeight(e.nativeEvent.layout.height)}
      >
        <FlatList
          ref={flatListRef}
          data={filteredPosts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ForYouCard
              post={item}
              listHeight={listHeight}
              onModalToggle={(isOpen) => setModalOpen(isOpen)}
              currentUserType={currentUserType}
              onLike={handleLikePost}
              onSave={handleSavePost}
              onFetchComments={handleFetchComments}
              onPostComment={handlePostComment}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {loading ? "Loading feed..." : "No posts found."}
              </Text>
            </View>
          }
          scrollEnabled={!modalOpen}
          showsVerticalScrollIndicator={false}
          pagingEnabled
          decelerationRate="fast"
          getItemLayout={(_, index) => ({
            length: listHeight,
            offset: listHeight * index,
            index,
          })}
        />
      </View>
      </View>

      <BottomNav />
    </SafeAreaView>
  );
};

export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F3F0",
  },
  header: {
    paddingBottom: scale(14),
    paddingHorizontal: scale(16),
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "center",
    marginBottom: scale(12),
    position: "relative",
  },
  title: {
    fontSize: moderateScale(28),
    fontWeight: "bold",
    fontFamily: "PlayfairDisplay_700Bold",
    color: "#2C1810",
  },
  bellBtn: {
    position: "absolute",
    right: 0,
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    backgroundColor: "rgba(212,163,115,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: scale(16),
    paddingHorizontal: scale(14),
    paddingVertical: scale(11),
    width: "100%",
    boxShadow: "0px 2px 4px rgba(0,0,0,0.08)",
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(15),
    color: "#1A1A1A",
    padding: 0,
  },
  emptyContainer: {
    height: deviceHeight - 180,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: moderateScale(15),
    color: "#777",
  },
  notificationDot: {
    position: "absolute",
    top: scale(6),
    right: scale(6),
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
    backgroundColor: "#FF4D4F",
    borderWidth: 2,
    borderColor: "#F7F3F0",
  },
});