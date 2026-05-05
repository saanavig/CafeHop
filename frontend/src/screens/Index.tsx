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
const fallbackImage = "https://picsum.photos/500/700";

const FEED_CACHE_KEY = "cafehop_feed_cache";
const FEED_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type FeedPost = Post & {
  cafeId?: string;
  isRecommended?: boolean;
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
        useNativeDriver: true,
      }),
      Animated.timing(headerSlide, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (hasFetchedFeed.current) return;
    hasFetchedFeed.current = true;
    loadFeed();
  }, []);

  const getCachedFeed = async () => {
    if (sessionFeedCache && sessionFeedCache.length > 0) {
      console.log("USING SESSION CACHE:", sessionFeedCache.length);
      return sessionFeedCache;
    }

    const raw = await AsyncStorage.getItem(FEED_CACHE_KEY);

    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const age = Date.now() - parsed.savedAt;

    if (age > FEED_CACHE_TTL_MS) {
      console.log("FEED CACHE EXPIRED");
      await AsyncStorage.removeItem(FEED_CACHE_KEY);
      return null;
    }

    console.log("USING DAILY CACHE:", parsed.posts.length);
    sessionFeedCache = parsed.posts;
    return parsed.posts;
  };

  const saveFeedCache = async (feed: FeedPost[]) => {
    sessionFeedCache = feed;

    await AsyncStorage.setItem(
      FEED_CACHE_KEY,
      JSON.stringify({
        savedAt: Date.now(),
        posts: feed,
      })
    );

    console.log("SAVED FEED CACHE:", feed.length);
  };

  const clearFeedCache = async () => {
    sessionFeedCache = null;
    await AsyncStorage.removeItem(FEED_CACHE_KEY);
    console.log("CLEARED FEED CACHE");
  };

  const loadFeed = async () => {
    try {
      setLoading(true);

      const cached = await getCachedFeed();

      if (cached && cached.length > 0) {
        setPosts(cached);
        setLoading(false);
        return;
      }

      await getUserLocationAndFetchFeed();
    } catch (err) {
      console.error("LOAD FEED ERROR:", err);
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
    return String(rec?.cafe?.id || rec?.cafe_id || "");
  };

  const cafeToPost = (
    cafe: any,
    explanation?: string,
    recommended = false
  ): FeedPost => {
    const cafeId = cafe.id ? String(cafe.id) : undefined;
    const cafeName = cafe.name || "Cafe";

    return {
      id: `cafe-${cafeId || cafeName}`,
      cafeId,
      isRecommended: recommended,
      cafeName,
      image: {
        uri:
          cafe.image_url ||
          `${fallbackImage}?random=${encodeURIComponent(cafeName)}`,
      },
      caption:
        explanation ||
        cafe.description ||
        "A cafe you may enjoy based on your preferences.",
      likes: recommended ? 400 : 100,
      comments: recommended ? 40 : 8,
      postedBy: recommended ? "CafeHop AI" : "CafeHop",
      tags: recommended ? ["recommended", "for-you"] : ["cafe"],
      location: cafe.address || "Nearby",
      commentList: [
        {
          user: "CafeHop",
          text:
            explanation || "Suggested based on your preferences and activity.",
        },
      ],
    };
  };

  const markCafeVisited = async (cafeId: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;

      if (!userId) return;

      await supabase.from("cafe_visit_logs").insert({
        user_id: userId,
        cafe_id: cafeId,
      });

      const { data: existingVisited } = await supabase
        .from("user_cafe_interactions")
        .select("interaction_type")
        .eq("user_id", userId)
        .eq("cafe_id", cafeId)
        .eq("interaction_type", "visited")
        .maybeSingle();

      if (!existingVisited) {
        await supabase.from("user_cafe_interactions").insert({
          user_id: userId,
          cafe_id: cafeId,
          interaction_type: "visited",
        });
      }
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

      const allCafeRes = await fetch(`${API_URL}/api/cafe/all`);
      const allCafeData = await allCafeRes.json();

      const rawAllCafes = Array.isArray(allCafeData)
        ? allCafeData
        : allCafeData.cafes || [];

      const recommendations = uniqueByKey(rawRecommendations, (rec: any) =>
        getRecCafeId(rec)
      );

      const recommendedPosts: FeedPost[] = recommendations
        .map((rec: any) => {
          const cafe = rec.cafe || {};
          const post = rec.post;

          if (!post || !post.id) return null;

          return {
            id: String(post.id),
            cafeId: String(cafe.id),

            cafeName: cafe.name || "Cafe",

            image: {
              uri:
                post.file_url ||
                post.media_url ||
                post.image_url ||
                cafe.image_url ||
                `${fallbackImage}?random=${encodeURIComponent(cafe.name || "cafe")}`,
            },

            caption: post.caption || "Recommended for you",

            likes: Number(post.likes_count ?? 0),
            comments: Number(post.comments_count ?? 0),

            postedBy: "CafeHop",
            tags: ["recommended", "for-you"],
            location: cafe.address || "Nearby",

            commentList: [],
          };
        })
        .filter((p): p is FeedPost => p !== null);

      const recommendedIds = new Set(
        recommendations.map((rec: any) => getRecCafeId(rec)).filter(Boolean)
      );

      const allCafes = uniqueByKey(rawAllCafes, (cafe: any) =>
        cafe.id ? String(cafe.id) : cafe.name?.trim().toLowerCase()
      );

      const regularPosts: FeedPost[] = allCafes
        .filter((cafe: any) => !recommendedIds.has(String(cafe.id)))
        .map((cafe: any) => cafeToPost(cafe, undefined, false));

      const finalFeed = uniqueByKey(
        [...recommendedPosts, ...regularPosts],
        (post) => post.cafeId || post.cafeName?.trim().toLowerCase()
      );

      setPosts(finalFeed);
      await saveFeedCache(finalFeed);
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
          <Text style={styles.title}>CAFÉHOP</Text>
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
            placeholder="Search posts..."
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
                {loading ? "Loading recommendations..." : "No cafes found."}
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
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