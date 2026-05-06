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
import ForYouCard, { Post } from "../components/ui/ForYouCard";
import React, { useEffect, useRef, useState } from "react";
import { deviceHeight, moderateScale, scale } from "../utils/responsive";

import AsyncStorage from "@react-native-async-storage/async-storage";
import BottomNav from "../components/ui/BottomNav";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../api/supabaseClient";
import { useNavigation } from "@react-navigation/native";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:3001";

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

const isValidImageUrl = (url?: string | null) => {
  return !!url && (url.startsWith("http://") || url.startsWith("https://"));
};

const getRandomItem = <T,>(items: T[]): T | null => {
  if (!items || items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
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

const FEED_CACHE_KEY = "cafehop_feed_cache";

type FeedPost = Post & {
  itemType?: "post" | "empty_cafe_prompt";
  cafeId?: string;
  isRecommended?: boolean;
  postId?: string;
  distanceMiles?: number;
  canLike?: boolean;
  canComment?: boolean;
  canSavePost?: boolean;
  canSaveCafe?: boolean;
};

type UserCoords = {
  lat: number;
  lng: number;
};

let sessionFeedCache: FeedPost[] | null = null;

const Index = () => {
  const navigation = useNavigation<any>();

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [listHeight, setListHeight] = useState(deviceHeight - 180);
  const [loading, setLoading] = useState(true);

  const flatListRef = useRef<FlatList<FeedPost>>(null);
  const hasFetchedFeed = useRef(false);

  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-12)).current;

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
  }, []);

  const clearFeedCache = async () => {
    sessionFeedCache = null;
    await AsyncStorage.removeItem(FEED_CACHE_KEY);
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

  const getPostImageFromPost = (post: any) => {
    const mediaList = post?.post_media || post?.media || [];
    const validMedia = mediaList.filter((m: any) =>
      isValidImageUrl(m?.file_url)
    );

    const randomMedia = getRandomItem(validMedia);
    return randomMedia?.file_url || null;
  };

  const buildPostCard = (
    post: any,
    cafe: any,
    isRecommended: boolean,
    coords: UserCoords,
    explanation?: string
  ): FeedPost | null => {
    const cafeId = String(post?.cafe_id || cafe?.id || "");
    const postId = String(post?.id || post?.post_id || "");
    const cafeName = cafe?.name || post?.cafes?.name || "Cafe";
    const imageUrl = getPostImageFromPost(post);

    if (!cafeId || !imageUrl) return null;

    const distanceMiles = calculateDistanceMiles(
      coords.lat,
      coords.lng,
      cafe?.latitude ?? post?.cafes?.latitude,
      cafe?.longitude ?? post?.cafes?.longitude
    );

    return {
      id: `cafe-${cafeId}`,
      itemType: "post",
      postId,
      cafeId,
      isRecommended,
      cafeName,
      image: { uri: imageUrl },
      caption: isRecommended
        ? explanation || "Recommended for you based on your cafe preferences."
        : post.caption || `Posted at ${cafeName}`,
      likes: Number(post.likes_count || 0),
      comments: Number(post.comments_count || 0),
      postedBy: cafeName,
      tags: isRecommended ? ["recommended", "for-you"] : ["cafe"],
      location: cafe?.address || post?.cafes?.address || "Nearby",
      commentList: [],
      distanceMiles,
      canLike: !!postId,
      canComment: !!postId,
      canSavePost: !!postId,
      canSaveCafe: true,
    };
  };

  const buildEmptyCafePrompt = (
    cafe: any,
    isRecommended: boolean,
    coords: UserCoords,
    explanation?: string
  ): FeedPost => {
    const cafeId = String(cafe?.id || "");
    const cafeName = cafe?.name || "Cafe";

    const distanceMiles = calculateDistanceMiles(
      coords.lat,
      coords.lng,
      cafe?.latitude,
      cafe?.longitude
    );

    return {
      id: `cafe-${cafeId || cafeName}`,
      itemType: "empty_cafe_prompt",
      cafeId,
      isRecommended,
      cafeName,
      image: { uri: getFallbackImage(cafeId || cafeName) },
      caption: isRecommended
        ? explanation || `Recommended for you. Be the first to post a picture at ${cafeName}.`
        : `Be the first to post a picture at ${cafeName}.`,
      likes: 0,
      comments: 0,
      postedBy: "CafeHop",
      tags: isRecommended ? ["recommended", "needs-photo"] : ["needs-photo"],
      location: cafe?.address || "Nearby",
      commentList: [],
      distanceMiles,
      canLike: false,
      canComment: false,
      canSavePost: false,
      canSaveCafe: true,
    };
  };

  const markCafeVisited = async (cafeId: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;

      if (!userId) return;

      const { data: existing } = await supabase
        .from("user_cafe_interactions")
        .select("user_id")
        .eq("user_id", userId)
        .eq("cafe_id", cafeId)
        .eq("interaction_type", "visited")
        .maybeSingle();

      if (existing) return;

      await supabase.from("user_cafe_interactions").insert({
        user_id: userId,
        cafe_id: cafeId,
        interaction_type: "visited",
      });
    } catch (err) {
      console.error("Mark visited failed:", err);
    }
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

      const recData = await recRes.json();
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

        const expData = await expRes.json();
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
      const cafesData = await cafesRes.json();
      const allCafes = Array.isArray(cafesData) ? cafesData : [];

      const postsRes = await fetch(`${API_URL}/api/posts/feed`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const postsData = await postsRes.json();
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

      const recommendedCards: FeedPost[] = recommendations
        .map((rec: any) => {
          const cafe = rec.cafe || {};
          const cafeId = String(cafe.id || rec.display?.cafe_id || "");
          const randomPost = getRandomItem(postsByCafe[cafeId] || []);

          const explanation =
            explanationMap[cafeId] ||
            rec.display?.caption ||
            (rec.reasons?.length
              ? `Recommended because ${String(rec.reasons[0]).toLowerCase()}.`
              : "Recommended for you based on your cafe preferences.");

          if (randomPost) {
            const card = buildPostCard(randomPost, cafe, true, coords, explanation);
            if (card) return card;
          }

          return buildEmptyCafePrompt(cafe, true, coords, explanation);
        })
        .filter((item: FeedPost | null): item is FeedPost => item !== null);

      const nonRecommendedCafes = allCafes.filter(
        (cafe: any) => !recommendedIds.has(String(cafe.id))
      );

      const cafesWithDistance = nonRecommendedCafes.map((cafe: any) => ({
        ...cafe,
        distanceMiles: calculateDistanceMiles(
          coords.lat,
          coords.lng,
          cafe.latitude,
          cafe.longitude
        ),
      }));

      const nearbyCafes = cafesWithDistance
        .filter((cafe: any) => cafe.distanceMiles <= maxDistanceMiles)
        .sort((a: any, b: any) => a.distanceMiles - b.distanceMiles);

      const nearbyIds = new Set(nearbyCafes.map((cafe: any) => String(cafe.id)));

      const restCafes = cafesWithDistance
        .filter((cafe: any) => !nearbyIds.has(String(cafe.id)))
        .sort((a: any, b: any) => a.distanceMiles - b.distanceMiles);

      const buildCafeCard = (cafe: any): FeedPost => {
        const cafeId = String(cafe.id || "");
        const randomPost = getRandomItem(postsByCafe[cafeId] || []);

        if (randomPost) {
          const card = buildPostCard(randomPost, cafe, false, coords);
          if (card) {
            return {
              ...card,
              id: `cafe-${cafeId}`,
              cafeId,
              isRecommended: false,
              canSaveCafe: true,
            };
          }
        }

        return buildEmptyCafePrompt(cafe, false, coords);
      };

      const nearbyCards = nearbyCafes.map(buildCafeCard);
      const restCards = restCafes.map(buildCafeCard);

      const finalFeed = uniqueByKey(
        [...recommendedCards, ...nearbyCards, ...restCards],
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
    <SafeAreaView edges={["top"]} style={styles.container}>
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
            onPress={() => navigation.navigate("Notifications")}
            style={styles.bellBtn}
          >
            <Bell size={scale(22)} color="#D4A373" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <Search
            size={scale(18)}
            color="#AAA"
            style={{ marginRight: scale(8) }}
          />

          <TextInput
            placeholder="Search cafes..."
            placeholderTextColor="#AAA"
            style={styles.searchInput}
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
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.95}
              onPress={async () => {
                if (!item.cafeId) return;

                await markCafeVisited(item.cafeId);

                navigation.navigate("CafeProfile", {
                  cafeId: item.cafeId,
                });
              }}
            >
              <ForYouCard
                post={item}
                listHeight={listHeight}
                onModalToggle={(isOpen) => setModalOpen(isOpen)}
              />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {loading ? "Loading feed..." : "No cafes found."}
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
});