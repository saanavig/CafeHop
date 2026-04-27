import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Search } from "lucide-react-native";
import ForYouCard, { Post } from "../components/ui/ForYouCard";
import BottomNav from "../components/ui/BottomNav";
import { scale, moderateScale, deviceHeight } from "../utils/responsive";
import { supabase } from "../api/supabaseClient";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:3001";
const fallbackImage = "https://picsum.photos/500/700";

type FeedPost = Post & {
  cafeId?: string;
  isRecommended?: boolean;
};

type UserCoords = {
  lat: number;
  lng: number;
};

const Index = () => {
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
    getUserLocationAndFetchFeed();
  }, []);

  const getToken = async () => {
    const { data, error } = await supabase.auth.getSession();

    console.log("AUTH SESSION USER:", data.session?.user?.id);
    console.log("HAS ACCESS TOKEN:", !!data.session?.access_token);

    if (error) throw error;

    const token = data.session?.access_token;
    if (!token) throw new Error("No auth token found");

    return token;
  };

  const getUserLocation = (): Promise<UserCoords> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          console.log("USER LOCATION SUCCESS:", coords);
          resolve(coords);
        },
        (error) => {
          console.log("USER LOCATION ERROR:", error);
          reject(error);
        }
      );
    });
  };

  const getUserLocationAndFetchFeed = async () => {
    try {
      const coords = await getUserLocation();
      await fetchFeed(coords);
    } catch (err) {
      console.log("USING FALLBACK LOCATION BECAUSE LOCATION FAILED:", err);

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

  const fetchFeed = async (coords: UserCoords) => {
    try {
      setLoading(true);

      console.log("====================================");
      console.log("START FETCH FEED");
      console.log("API URL:", API_URL);
      console.log("COORDS USED:", coords);

      const token = await getToken();

      const recUrl = `${API_URL}/api/recommendations?lat=${coords.lat}&lng=${coords.lng}&limit=10`;
      console.log("RECOMMENDATIONS URL:", recUrl);

      const recRes = await fetch(recUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("RECOMMENDATIONS STATUS:", recRes.status);

      const recData = await recRes.json();
      console.log("RECOMMENDATIONS RAW RESPONSE:", recData);

      const rawRecommendations = recData.recommendations || [];
      console.log("RAW RECOMMENDATION COUNT:", rawRecommendations.length);

      let explanationMap: Record<string, string> = {};

      const expUrl = `${API_URL}/api/recommendations/explanations?lat=${coords.lat}&lng=${coords.lng}&limit=10`;
      console.log("EXPLANATIONS URL:", expUrl);

      try {
        const expRes = await fetch(expUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("EXPLANATIONS STATUS:", expRes.status);

        const expData = await expRes.json();
        console.log("EXPLANATIONS RAW RESPONSE:", expData);

        const explanations = expData.explanations || [];
        console.log("EXPLANATION COUNT:", explanations.length);

        for (const item of explanations) {
          if (item.cafe_id && item.explanation) {
            explanationMap[String(item.cafe_id)] = item.explanation;
          }
        }

        console.log("EXPLANATION MAP IDS:", Object.keys(explanationMap));
      } catch (err) {
        console.log("EXPLANATIONS FETCH FAILED:", err);
      }

      const allCafeUrl = `${API_URL}/api/cafe/all`;
      console.log("ALL CAFES URL:", allCafeUrl);

      const allCafeRes = await fetch(allCafeUrl);
      console.log("ALL CAFES STATUS:", allCafeRes.status);

      const allCafeData = await allCafeRes.json();
      console.log("ALL CAFES RAW RESPONSE:", allCafeData);

      const rawAllCafes = Array.isArray(allCafeData)
        ? allCafeData
        : allCafeData.cafes || [];

      console.log("RAW ALL CAFES COUNT:", rawAllCafes.length);

      const recommendations = uniqueByKey(rawRecommendations, (rec: any) =>
        getRecCafeId(rec)
      );

      console.log("UNIQUE RECOMMENDATION COUNT:", recommendations.length);
      console.log(
        "UNIQUE RECOMMENDED IDS:",
        recommendations.map((rec: any) => getRecCafeId(rec))
      );

      const recommendedPosts: FeedPost[] = recommendations.map((rec: any) => {
        const cafe = rec.cafe || {};
        const cafeId = getRecCafeId(rec);

        const explanation =
          explanationMap[cafeId] ||
          rec.gemini_explanation ||
          (rec.reasons?.length ? rec.reasons.join(". ") : null) ||
          "Recommended for your taste.";

        console.log("RECOMMENDED CARD CREATED:", {
          cafeName: cafe.name,
          cafeId,
          hasGeminiExplanationFromEndpoint: !!explanationMap[cafeId],
          hasGeminiExplanationFromRec: !!rec.gemini_explanation,
          finalExplanationPreview: explanation.slice(0, 120),
        });

        return cafeToPost(cafe, explanation, true);
      });

      const recommendedIds = new Set(
        recommendations.map((rec: any) => getRecCafeId(rec)).filter(Boolean)
      );

      const allCafes = uniqueByKey(rawAllCafes, (cafe: any) =>
        cafe.id ? String(cafe.id) : cafe.name?.trim().toLowerCase()
      );

      console.log("UNIQUE ALL CAFES COUNT:", allCafes.length);

      const regularPosts: FeedPost[] = allCafes
        .filter((cafe: any) => !recommendedIds.has(String(cafe.id)))
        .map((cafe: any) => cafeToPost(cafe, undefined, false));

      console.log("RECOMMENDED POSTS COUNT:", recommendedPosts.length);
      console.log("REGULAR POSTS COUNT:", regularPosts.length);

      const finalFeed = uniqueByKey(
        [...recommendedPosts, ...regularPosts],
        (post) => post.cafeId || post.cafeName?.trim().toLowerCase()
      );

      console.log("FINAL FEED COUNT:", finalFeed.length);
      console.log(
        "FINAL FEED ORDER:",
        finalFeed.map((post) => ({
          cafeName: post.cafeName,
          cafeId: post.cafeId,
          isRecommended: post.isRecommended,
          captionPreview: post.caption.slice(0, 80),
        }))
      );
      console.log("END FETCH FEED");
      console.log("====================================");

      setPosts(finalFeed);
    } catch (err) {
      console.error("FEED FETCH ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(
    (post) =>
      post.caption.toLowerCase().includes(search.toLowerCase()) ||
      post.cafeName.toLowerCase().includes(search.toLowerCase())
  );

  console.log("RENDER POSTS COUNT:", posts.length);
  console.log("RENDER FILTERED POSTS COUNT:", filteredPosts.length);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerFade,
            transform: [{ translateY: headerSlide }],
          },
        ]}
      >
        <Text style={styles.title}>CAFÉHOP</Text>

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
          keyExtractor={(item) =>
            item.cafeId || item.cafeName.trim().toLowerCase()
          }
          renderItem={({ item }) => (
            <ForYouCard
              post={item}
              listHeight={listHeight}
              onModalToggle={(isOpen) => setModalOpen(isOpen)}
            />
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
    </View>
  );
};

export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F3F0",
  },
  header: {
    paddingTop: scale(30),
    paddingBottom: scale(14),
    paddingHorizontal: scale(16),
    alignItems: "center",
  },
  title: {
    fontSize: moderateScale(28),
    fontWeight: "bold",
    fontFamily: "PlayfairDisplay_700Bold",
    marginBottom: scale(12),
    color: "#2C1810",
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