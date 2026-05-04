import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  PanResponder,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  Clock,
  Coffee,
  Gift,
  Globe,
  MapPin,
  Navigation,
  Phone,
  Search,
  Share2,
  Star,
  Wifi,
  X,
  Zap,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { moderateScale, scale } from "../utils/responsive";

import BottomNav from "../components/ui/BottomNav";
import { Platform } from "react-native";
import { supabase } from "../api/supabaseClient";
import { useNavigation } from "@react-navigation/native";
import { useRole } from "../context/RoleContext";

const { width: RAW_WIDTH, height: RAW_HEIGHT } = Dimensions.get("window");
const width  = Math.min(RAW_WIDTH,  430);
const height = Math.min(RAW_HEIGHT, 932);

// ─── Data ─────────────────────────────────────────────────────────────────────
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const FILTERS = [
  "All",
  "Open Now",
];

let MapView: any = null;
let Marker: any = null;

if (Platform.OS !== "web") {
  const maps = eval("require")("react-native-maps");
  MapView = maps.default;
  Marker = maps.Marker;
}

const SHEET_HEIGHT = height * 0.52;
const API_URL = process.env.EXPO_PUBLIC_API_URL;

// ─── Component ────────────────────────────────────────────────────────────────
export default function ExploreScreen() {
  const { role } = useRole();
  const navigation = useNavigation<any>();

  const [search, setSearch]               = useState("");
  const [inputText, setInputText]         = useState("");
  const [refreshing, setRefreshing]       = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  // const [activeFilters, setActiveFilters] = useState<string[]>(["open"]);
  const [activeTab, setActiveTab]         = useState<"info" | "rewards" | "reviews">("info");
  const [detailVisible, setDetailVisible] = useState(false);
  const [photoIndex, setPhotoIndex]       = useState(0);
  const [hoursExpanded, setHoursExpanded] = useState(false);
  const [saved, setSaved]                 = useState<string[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("All");

  type Cafe = {
    id: string;
    name: string;

    // backend — cafes table
    attributes?: string[];
    price_level?: number;
    isOpen?: boolean;
    latitude?: number;
    longitude?: number;
    image_url?: string;
    contact_phone?: string;
    website_url?: string;
    instagram_url?: string;
    facebook_url?: string;
    description?: string;
    address?: string;
    active?: boolean;

    // frontend-only / legacy static fields
    pin?: { x: number; y: number };
    rating?: number;
    reviews?: number;
    category?: string;
    amenities?: string[];
    photos?: any[];
    vibes?: string[];
    distance?: string;
  };

  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [cafeHours, setCafeHours]         = useState<Record<string, string>>({});
  const [cafeReviews, setCafeReviews]     = useState<any[]>([]);
  const [cafeRewards, setCafeRewards]     = useState<any[]>([]);
  const [cafeAiProfile, setCafeAiProfile] = useState<{ vibe_summary?: string; best_for?: string[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const tabFade     = useRef(new Animated.Value(1)).current;
  const detailSlide = useRef(new Animated.Value(height)).current;

  // Map panning
  const mapOffset     = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const lastMapOffset = useRef({ x: 0, y: 0 });

  const mapPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3,
      onPanResponderGrant: () => {
        mapOffset.setOffset({ x: lastMapOffset.current.x, y: lastMapOffset.current.y });
        mapOffset.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: mapOffset.x, dy: mapOffset.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, g) => {
        mapOffset.flattenOffset();
        lastMapOffset.current = {
          x: lastMapOffset.current.x + g.dx,
          y: lastMapOffset.current.y + g.dy,
        };
      },
    })
  ).current;

  // Pin pulse — pre-allocate a pool large enough for any realistic cafe count
  const MAX_PINS = 60;
  const pulseScales  = useRef(Array.from({ length: MAX_PINS }, () => new Animated.Value(1))).current;
  const pulseOpacity = useRef(Array.from({ length: MAX_PINS }, () => new Animated.Value(0.6))).current;
  // const pinAnimRefs  = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    fetchCafes();
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      setCurrentUserId(uid);
      if (!uid) return;
      const { data: savedData } = await supabase
        .from("user_cafe_interactions")
        .select("cafe_id")
        .eq("user_id", uid)
        .eq("interaction_type", "saved");
      if (savedData) setSaved(savedData.map((d: any) => d.cafe_id));
    };
    init();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCafes(true);
    setRefreshing(false);
  };

  const fetchCafes = async (silent = false) => {
    setFetchError(false);
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/cafe/all`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      const cleaned = data.map((c: any) => ({
        ...c,
        attributes: Array.isArray(c.attributes)
          ? c.attributes.map((a: string) => a.toLowerCase())
          : typeof c.attributes === "string"
          ? c.attributes.toLowerCase().split(",").map((a: string) => a.trim())
          : [],
        price_level: c.price_level ? Number(c.price_level) : null,
        latitude: c.latitude ? Number(c.latitude) : null,
        longitude: c.longitude ? Number(c.longitude) : null,
        isOpen: c.isOpen ?? false,
      }));

      setCafes(cleaned);
    } catch (err) {
      console.error("Error fetching cafes:", err);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchCafeDetail = async (cafeId: string) => {
    setDetailLoading(true);
    setCafeHours({});
    setCafeReviews([]);
    setCafeRewards([]);
    setCafeAiProfile(null);
    try {
      const formatTime = (t: string) => {
        const [h, m] = t.split(":").map(Number);
        return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
      };
      const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      const [{ data: hours }, { data: reviews }, { data: rewards }, { data: ai }] = await Promise.all([
        supabase.from("cafe_hours").select("day_of_week, open_time, close_time").eq("cafe_id", cafeId),
        supabase.from("reviews").select("id, rating, review_text, created_at, profiles(first_name, last_name)").eq("cafe_id", cafeId).order("created_at", { ascending: false }).limit(8),
        supabase.from("rewards").select("id, title, description, points_required").eq("cafe_id", cafeId).eq("active", true),
        supabase.from("cafe_ai_profiles").select("vibe_summary, best_for").eq("cafe_id", cafeId).maybeSingle(),
      ]);

      if (hours && hours.length > 0) {
        const map: Record<string, string> = {};
        for (const row of hours) {
          map[DAY[row.day_of_week]] = `${formatTime(row.open_time)} – ${formatTime(row.close_time)}`;
        }
        setCafeHours(map);
      }
      setCafeReviews(reviews ?? []);
      setCafeRewards(rewards ?? []);
      setCafeAiProfile(ai ?? null);
    } catch (err) {
      console.error("fetchCafeDetail error:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const formattedDistance = (cafe: Cafe): string | undefined => {
    if (userLocation && cafe.latitude && cafe.longitude) {
      const km = getDistance(userLocation.lat, userLocation.lng, cafe.latitude, cafe.longitude);
      const mi = km * 0.621371;
      return mi < 0.1 ? "< 0.1 mi" : `${mi.toFixed(1)} mi`;
    }
    return cafe.distance;
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setUserLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    });
  }, []);

  useEffect(() => {
    // pinAnimRefs.current.forEach((a) => a.stop());
    // pinAnimRefs.current = [];
    const count = Math.min(cafes.length, MAX_PINS);
    for (let i = 0; i < count; i++) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay((i % 10) * 400),
          Animated.parallel([
            Animated.timing(pulseScales[i],  { toValue: 2.2, duration: 1100, useNativeDriver: true }),
            Animated.timing(pulseOpacity[i], { toValue: 0,   duration: 1100, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(pulseScales[i],  { toValue: 1,   duration: 0, useNativeDriver: true }),
            Animated.timing(pulseOpacity[i], { toValue: 0.6, duration: 0, useNativeDriver: true }),
          ]),
        ])
      );
      loop.start();
      // pinAnimRefs.current.push(loop);
    }
  }, [cafes.length]);

  const mergedCafes = cafes.map((cafe) => ({
    ...cafe,
    pin: {
      x: Math.random() * 0.8,
      y: Math.random() * 0.8,
    },
  }));

  const normalizeAttributes = (attrs: any): string[] => {
    if (!attrs) return [];

    if (Array.isArray(attrs)) {
      return attrs.map((a) => a.toLowerCase());
    }

    if (typeof attrs === "string") {
      return attrs.toLowerCase().split(",").map((a) => a.trim());
    }

    return [];
  };

  const filteredCafes: Cafe[] = mergedCafes.filter((c) => {
    const matchesSearch = c.name
      ?.toLowerCase()
      .includes(search.toLowerCase());

    if (selectedFilter === "All") {
      return matchesSearch;
    }

    if (selectedFilter === "Open Now") {
      return matchesSearch && c.isOpen === true;
    }
    return matchesSearch;
  });

  const openDetail = (cafe: Cafe) => {
    setSelectedCafe(cafe);
    setActiveTab("info");
    setPhotoIndex(0);
    setHoursExpanded(false);
    detailSlide.setValue(height);
    setDetailVisible(true);
    Animated.spring(detailSlide, { toValue: 0, friction: 9, tension: 60, useNativeDriver: true }).start();
    fetchCafeDetail(cafe.id);
  };

  const closeDetail = () => {
    Animated.timing(detailSlide, { toValue: height, duration: 280, useNativeDriver: true }).start(() => {
      setDetailVisible(false);
      setSelectedCafe(null);
    });
  };

  const switchTab = (tab: "info" | "rewards" | "reviews") => {
    Animated.timing(tabFade, { toValue: 0, duration: 100, useNativeDriver: true }).start(() => {
      setActiveTab(tab);
      Animated.timing(tabFade, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    });
  };

  // const toggleFilter = (id: string) =>
  //   setActiveFilters((prev) =>
  //     prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
  //   );

  const toggleSave = async (id: string) => {
    const isSaved = saved.includes(id);
    setSaved((prev) => isSaved ? prev.filter((s) => s !== id) : [...prev, id]);
    if (!currentUserId) return;
    if (isSaved) {
      await supabase.from("user_cafe_interactions").delete()
        .eq("user_id", currentUserId).eq("cafe_id", id).eq("interaction_type", "saved");
    } else {
      await supabase.from("user_cafe_interactions").upsert(
        { user_id: currentUserId, cafe_id: id, interaction_type: "saved" },
        { onConflict: "user_id,cafe_id,interaction_type" }
      );
    }
  };

  const todayKey = DAYS_SHORT[new Date().getDay()];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      {/* ── PANNABLE MAP ────────────────────────────────────── */}
      {Platform.OS === "web" ? (
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
        <iframe
          src={`https://www.google.com/maps?q=${userLocation?.lat || 40.743},${userLocation?.lng || -74.032}&z=14&output=embed`}
          style={{
            border: "none",
            width: "100%",
            height: "100%",
          }}
        />
      </View>
    ) : (
        <MapView
          style={StyleSheet.absoluteFill}
          initialRegion={{
            latitude: userLocation?.lat || 40.743,
            longitude: userLocation?.lng || -74.032,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation
          showsMyLocationButton
        >
          {filteredCafes.map((cafe) => {
            if (!cafe.latitude || !cafe.longitude) return null;

            return (
              <Marker
                key={cafe.id}
                coordinate={{
                  latitude: cafe.latitude,
                  longitude: cafe.longitude,
                }}
                onPress={() => openDetail(cafe)}
              >
                <View
                  style={{
                    backgroundColor: "#D4A373",
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 20,
                  }}
                >
                  <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 11 }}>
                    {cafe.name?.split(" ")[0] ?? "Cafe"}
                  </Text>
                </View>
              </Marker>
            );
          })}
        </MapView>
      )}

      {/* ── BOTTOM SHEET (list) ─────────────────────────────── */}
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.searchContainer}>
          <Search size={15} color="#999" />
          <TextInput
            placeholder="Search cafes near you…"
            placeholderTextColor="#BBB"
            style={styles.searchInput}
            value={inputText}
            onChangeText={(text) => {
              setInputText(text);
              if (searchTimeout.current) clearTimeout(searchTimeout.current);
              searchTimeout.current = setTimeout(() => setSearch(text), 300);
            }}
          />
          {inputText.length > 0 && (
            <TouchableOpacity onPress={() => { setInputText(""); setSearch(""); }}>
              <X size={14} color="#BBB" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#D4A373"
              colors={["#D4A373"]}
            />
          }
        >
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Cafes Near You</Text>
            <View style={styles.listCountChip}>
              <Navigation size={11} color="#D4A373" />
              <Text style={styles.listCountText}>{filteredCafes.length} places</Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 16 }}
          >
            {FILTERS.map((filter) => {
              const isActive = selectedFilter === filter;

              return (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setSelectedFilter(filter)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.filterChip,
                      isActive && styles.filterChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isActive && { color: "#FFF" },
                      ]}
                    >
                      {filter}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Error state */}
          {fetchError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>Couldn't load cafes</Text>
              <TouchableOpacity onPress={() => fetchCafes()} style={styles.retryBtn}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Loading state */}
          {loading && (
            <View style={styles.loadingState}>
              <ActivityIndicator size="small" color="#D4A373" />
              <Text style={styles.loadingText}>Finding cafes near you…</Text>
            </View>
          )}

          {/* Empty state */}
          {!loading && !fetchError && filteredCafes.length === 0 && (
            <View style={styles.emptyState}>
              <Coffee size={scale(32)} color="#CCC" />
              <Text style={styles.emptyStateText}>No cafes found</Text>
              <Text style={styles.emptyStateSub}>Try a different search or filter</Text>
            </View>
          )}

          {filteredCafes.map((cafe) => (
            <TouchableOpacity
              key={cafe.id}
              style={styles.cafeCard}
              onPress={() => navigation.navigate("CafeProfile", { cafe })}
              activeOpacity={0.9}
            >
              <Image
                source={
                  cafe.image_url
                    ? { uri: cafe.image_url }
                    : require("../assets/cafe-1.jpg")
                }
                style={styles.cafeCardImage}
                resizeMode="cover"
              />
              <View style={[styles.openPip, cafe.isOpen ? styles.openPipGreen : styles.openPipRed]}>
                <Text style={[styles.openPipText, cafe.isOpen ? { color: "#2E7D32" } : { color: "#C62828" }]}>
                  {cafe.isOpen ? "Open" : "Closed"}
                </Text>
              </View>
              <View style={styles.cardRatingBadge}>
                <Star size={11} color="#D4A373" fill="#D4A373" />
                <Text style={styles.cardRatingText}>{cafe.rating}</Text>
              </View>
              <View style={styles.cafeCardTextArea}>
                <Text style={styles.cafeCardName}>{cafe.name}</Text>
                <View style={styles.cafeCardMeta}>
                  <Text style={styles.cafeCardSub}>{(cafe.vibes ?? []).join(" · ")}</Text>
                  <Text style={styles.cafeCardDist}>{formattedDistance(cafe)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.navWrapper}>
        <BottomNav />
      </View>

      {/* ── CAFE DETAIL MODAL ───────────────────────────────── */}
      <Modal visible={detailVisible} transparent animationType="none" statusBarTranslucent onRequestClose={closeDetail}>
        <View style={{ flex: 1 }}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeDetail}>
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.25)" }} />
          </TouchableOpacity>

          {selectedCafe && (
            <Animated.View style={[styles.detailSheet, { transform: [{ translateY: detailSlide }] }]}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: scale(48) }}>

                {/* ── Photo Carousel ── */}
                <View style={styles.heroWrap}>
                  <FlatList
                    data={selectedCafe.photos ?? (selectedCafe.image_url ? [{ uri: selectedCafe.image_url }] : [require("../assets/cafe-1.jpg")])}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(_, i) => i.toString()}
                    onMomentumScrollEnd={(e) => {
                      setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / width));
                    }}
                    renderItem={({ item }) => (
                      <Image source={item} style={styles.detailHero} resizeMode="cover" />
                    )}
                  />

                  {/* Gradient-like dark overlay at bottom of hero */}
                  <View style={styles.heroOverlay} pointerEvents="none">
                    <View style={[styles.heroBadge, selectedCafe.isOpen ? styles.heroBadgeOpen : styles.heroBadgeClosed]}>
                      <Text style={[styles.heroBadgeText, selectedCafe.isOpen ? { color: "#2E7D32" } : { color: "#C62828" }]}>
                        {selectedCafe.isOpen ? "Open Now" : "Closed"}
                      </Text>
                    </View>
                  </View>

                  {/* Dot indicators */}
                  {(selectedCafe.photos?.length ?? 0) > 1 && (
                    <View style={styles.photoDots}>
                      {(selectedCafe.photos ?? []).map((_: any, i: number) => (
                        <View key={i} style={[styles.photoDot, i === photoIndex && styles.photoDotActive]} />
                      ))}
                    </View>
                  )}

                  {/* Close button */}
                  <TouchableOpacity style={styles.closeBtn} onPress={closeDetail}>
                    <X size={scale(16)} color="#444" />
                  </TouchableOpacity>
                </View>

                <View style={styles.detailBody}>

                  {/* ── Name, category, rating ── */}
                  <View style={styles.nameRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailName}>{selectedCafe.name}</Text>
                      <Text style={styles.detailCategory}>{selectedCafe.category}</Text>
                    </View>
                    <View style={styles.ratingChip}>
                      <Star size={13} color="#D4A373" fill="#D4A373" />
                      <Text style={styles.ratingNum}>{selectedCafe.rating}</Text>
                      <Text style={styles.ratingReviews}>({selectedCafe.reviews})</Text>
                    </View>
                  </View>

                  {/* ── Address + distance ── */}
                  <View style={styles.addressRow}>
                    <MapPin size={scale(13)} color="#D4A373" />
                    <Text style={styles.addressText}>{selectedCafe.address}</Text>
                    {formattedDistance(selectedCafe) ? (
                      <Text style={styles.distancePill}>{formattedDistance(selectedCafe)}</Text>
                    ) : null}
                  </View>

                  {/* ── Quick action buttons ── */}
                  <View style={styles.actionsRow}>
                    {[
                      { icon: Navigation, label: "Directions" },
                      { icon: Phone,      label: "Call"       },
                      { icon: Globe,      label: "Website"    },
                      {
                        icon: Bookmark,
                        label: saved.includes(selectedCafe.id) ? "Saved" : "Save",
                        onPress: () => toggleSave(selectedCafe.id),
                        active: saved.includes(selectedCafe.id),
                      },
                    ].map(({ icon: Icon, label, onPress, active }) => (
                      <TouchableOpacity
                        key={label}
                        style={[styles.actionBtn, active && styles.actionBtnActive]}
                        onPress={onPress}
                      >
                        <Icon size={scale(18)} color={active ? "#D4A373" : "#444"} fill={active ? "#D4A373" : "transparent"} />
                        <Text style={[styles.actionBtnLabel, active && { color: "#D4A373" }]}>{label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* ── Amenity chips ── */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: scale(20) }}
                    contentContainerStyle={{ gap: scale(8) }}
                  >
                    {(selectedCafe.amenities ?? []).map((a: string) => (
                      <View key={a} style={styles.amenityChip}>
                        <Text style={styles.amenityChipText}>{a}</Text>
                      </View>
                    ))}
                    {(selectedCafe.vibes ?? []).map((v) => (
                      <View key={v} style={[styles.amenityChip, styles.vibeChip]}>
                        <Text style={[styles.amenityChipText, { color: "#D4A373" }]}>{v}</Text>
                      </View>
                    ))}
                  </ScrollView>

                  {/* ── Tabs ── */}
                  <View style={styles.tabRow}>
                    {(["info", "rewards", "reviews"] as const).map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.tabBtn, activeTab === t && styles.tabBtnActive]}
                        onPress={() => switchTab(t)}
                      >
                        <Text style={[styles.tabBtnText, activeTab === t && styles.tabBtnTextActive]}>
                          {t[0].toUpperCase() + t.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* ── Tab Content ── */}
                  <Animated.View style={{ opacity: tabFade }}>

                    {/* INFO TAB */}
                    {activeTab === "info" && (
                      <View>
                        {/* About */}
                        <Text style={styles.sectionHeading}>About</Text>
                        {selectedCafe.description ? (
                          <Text style={styles.descriptionText}>{selectedCafe.description}</Text>
                        ) : (
                          <Text style={[styles.descriptionText, { color: "#CCC" }]}>No description available.</Text>
                        )}
                        {cafeAiProfile?.vibe_summary ? (
                          <Text style={[styles.descriptionText, { fontStyle: "italic", color: "#888", marginTop: scale(-8) }]}>
                            {cafeAiProfile.vibe_summary}
                          </Text>
                        ) : null}
                        {(cafeAiProfile?.best_for ?? []).length > 0 && (
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ gap: scale(6), marginBottom: scale(16) }}
                          >
                            {(cafeAiProfile?.best_for ?? []).map((tag: string) => (
                              <View key={tag} style={styles.aiTag}>
                                <Text style={styles.aiTagText}>{tag}</Text>
                              </View>
                            ))}
                          </ScrollView>
                        )}

                        {/* Hours */}
                        {Object.keys(cafeHours).length > 0 ? (
                          <TouchableOpacity
                            style={styles.hoursHeader}
                            onPress={() => setHoursExpanded(!hoursExpanded)}
                          >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: scale(8) }}>
                              <Clock size={scale(15)} color="#D4A373" />
                              <Text style={styles.sectionHeading}>Hours</Text>
                            </View>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: scale(6) }}>
                              <Text style={styles.todayHoursPreview}>
                                Today: {cafeHours[todayKey] ?? "—"}
                              </Text>
                              {hoursExpanded
                                ? <ChevronUp size={scale(14)} color="#888" />
                                : <ChevronDown size={scale(14)} color="#888" />
                              }
                            </View>
                          </TouchableOpacity>
                        ) : detailLoading ? (
                          <Text style={[styles.todayHoursPreview, { marginBottom: scale(12) }]}>
                            Loading hours…
                          </Text>
                        ) : null}

                        {hoursExpanded && Object.keys(cafeHours).length > 0 && (
                          <View style={styles.hoursGrid}>
                            {Object.entries(cafeHours).map(([day, hrs]) => (
                              <View key={day} style={[styles.hoursRow, day === todayKey && styles.hoursRowToday]}>
                                <Text style={[styles.hoursDay, day === todayKey && styles.hoursDayToday]}>{day}</Text>
                                <Text style={[styles.hoursTime, day === todayKey && styles.hoursTimeToday]}>{hrs as string}</Text>
                              </View>
                            ))}
                          </View>
                        )}

                        {/* Contact */}
                        <Text style={[styles.sectionHeading, { marginTop: scale(16) }]}>Contact</Text>
                        <View style={styles.contactCard}>
                          <View style={styles.contactRow}>
                            <Phone size={scale(15)} color="#D4A373" />
                            <Text style={styles.contactText}>{selectedCafe.contact_phone || "—"}</Text>
                          </View>
                          <View style={styles.contactRow}>
                            <Globe size={scale(15)} color="#D4A373" />
                            <Text style={styles.contactText}>{selectedCafe.website_url || "—"}</Text>
                          </View>
                          <View style={[styles.contactRow, { borderBottomWidth: 0 }]}>
                            <Instagram size={scale(15)} color="#D4A373" />
                            <Text style={styles.contactText}>{selectedCafe.instagram_url || "—"}</Text>
                          </View>
                        </View>

                        {/* Price */}
                        <View style={styles.priceRow}>
                          <Text style={styles.priceLabel}>Price range</Text>
                          <Text style={styles.priceValue}>
                            {["", "$", "$$", "$$$", "$$$$"][selectedCafe.price_level ?? 0] || "—"}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* REWARDS TAB */}
                    {activeTab === "rewards" && (
                      <View style={styles.tabContent}>
                        <Text style={styles.sectionHeading}>Available Rewards</Text>
                        {detailLoading ? (
                          <ActivityIndicator size="small" color="#D4A373" style={{ marginVertical: scale(16) }} />
                        ) : cafeRewards.length > 0 ? (
                          cafeRewards.map((r: any) => (
                            <View key={r.id} style={styles.rewardRow}>
                              <View style={styles.rewardPtsBadge}>
                                <Text style={styles.rewardPts}>{r.points_required} pts</Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.rewardLabel}>{r.title}</Text>
                                {r.description ? (
                                  <Text style={{ fontSize: moderateScale(11), color: "#AAA", marginTop: scale(2) }}>
                                    {r.description}
                                  </Text>
                                ) : null}
                              </View>
                            </View>
                          ))
                        ) : (
                          <Text style={{ color: "#BBB", fontSize: moderateScale(13), marginVertical: scale(16) }}>
                            No rewards available yet
                          </Text>
                        )}
                        <TouchableOpacity
                          style={styles.goToRewardsBtn}
                          onPress={() => { closeDetail(); navigation.navigate("Rewards"); }}
                        >
                          <Gift size={scale(15)} color="#FFF" />
                          <Text style={styles.goToRewardsBtnText}>View All Rewards</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* REVIEWS TAB */}
                    {activeTab === "reviews" && (
                      <View style={styles.tabContent}>
                        {/* Rating summary */}
                        {(() => {
                          const avgRating = cafeReviews.length > 0
                            ? cafeReviews.reduce((s: number, r: any) => s + r.rating, 0) / cafeReviews.length
                            : (selectedCafe.rating ?? 0);
                          const displayRating = avgRating > 0 ? avgRating.toFixed(1) : "—";
                          return (
                            <View style={styles.ratingSummary}>
                              <Text style={styles.ratingSummaryBig}>{displayRating}</Text>
                              <View>
                                <View style={{ flexDirection: "row", gap: scale(3), marginBottom: scale(4) }}>
                                  {Array.from({ length: 5 }).map((_, j) => (
                                    <Star key={j} size={scale(14)} color="#D4A373" fill={j < Math.round(avgRating) ? "#D4A373" : "transparent"} />
                                  ))}
                                </View>
                                <Text style={styles.ratingSummaryCount}>{cafeReviews.length} reviews</Text>
                              </View>
                            </View>
                          );
                        })()}

                        <Text style={styles.sectionHeading}>Recent Reviews</Text>
                        {detailLoading ? (
                          <ActivityIndicator size="small" color="#D4A373" style={{ marginVertical: scale(16) }} />
                        ) : cafeReviews.length > 0 ? (
                          cafeReviews.map((r: any) => {
                            const timeAgo = (d: string) => {
                              const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
                              if (mins < 60) return `${mins}m ago`;
                              const hrs = Math.floor(mins / 60);
                              if (hrs < 24) return `${hrs}h ago`;
                              return `${Math.floor(hrs / 24)}d ago`;
                            };
                            const profile = r.profiles as { first_name?: string; last_name?: string } | null;
                            const name = profile?.first_name
                              ? `${profile.first_name}${profile.last_name ? " " + profile.last_name[0] + "." : ""}`
                              : "Anonymous";
                            return (
                              <View key={r.id} style={styles.reviewCard}>
                                <View style={styles.reviewHeader}>
                                  <View style={styles.reviewAvatar}>
                                    <Text style={{ fontSize: moderateScale(13), fontWeight: "700", color: "#D4A373" }}>
                                      {name[0]}
                                    </Text>
                                  </View>
                                  <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                                      <View>
                                        <Text style={{ fontSize: moderateScale(12), fontWeight: "600", color: "#333", marginBottom: scale(2) }}>
                                          {name}
                                        </Text>
                                        <View style={{ flexDirection: "row", gap: scale(2) }}>
                                          {Array.from({ length: 5 }).map((_, j) => (
                                            <Star key={j} size={scale(11)} color={j < r.rating ? "#D4A373" : "#DDD"} fill={j < r.rating ? "#D4A373" : "transparent"} />
                                          ))}
                                        </View>
                                      </View>
                                      <Text style={styles.reviewTime}>{timeAgo(r.created_at)}</Text>
                                    </View>
                                    {r.review_text ? (
                                      <Text style={styles.reviewText}>{r.review_text}</Text>
                                    ) : null}
                                  </View>
                                </View>
                              </View>
                            );
                          })
                        ) : (
                          <View style={{ alignItems: "center", paddingVertical: scale(24) }}>
                            <Text style={{ color: "#BBB", fontSize: moderateScale(13) }}>No reviews yet</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </Animated.View>
                </View>
              </ScrollView>
            </Animated.View>
          )}
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#EDE9E1" },

  mapBg: { flex: 1, backgroundColor: "#EDE9E1" },
  block: { position: "absolute", backgroundColor: "#DDD9D1", borderRadius: scale(6) },
  park:  { position: "absolute", backgroundColor: "#C5D9A6", borderRadius: scale(6) },
  water: { position: "absolute", backgroundColor: "#A8CCE0", borderRadius: scale(8) },
  roadH: { position: "absolute", left: 0, right: 0, height: scale(4), backgroundColor: "#F5F2EC" },
  roadV: { position: "absolute", top: 0, bottom: 0, width: scale(4), backgroundColor: "#F5F2EC" },
  roadHMaj: { position: "absolute", left: 0, right: 0, height: scale(7), backgroundColor: "#FDFAF6" },
  roadVMaj: { position: "absolute", top: 0, bottom: 0, width: scale(7), backgroundColor: "#FDFAF6" },

  navWrapper: { position: "absolute", bottom: 0, left: 0, right: 0 },

  youAreHere: {
    position: "absolute", top: "47%", left: "50%",
    alignItems: "center", justifyContent: "center",
    marginLeft: scale(-10), marginTop: scale(-10),
  },
  youRing: {
    position: "absolute", width: scale(28), height: scale(28),
    borderRadius: scale(14), backgroundColor: "rgba(66,133,244,0.2)",
    borderWidth: 1.5, borderColor: "rgba(66,133,244,0.4)",
  },
  youDot: {
    width: scale(12), height: scale(12), borderRadius: scale(6),
    backgroundColor: "#4285F4", borderWidth: 2.5, borderColor: "#FFF",
  },

  pinWrap: { position: "absolute", alignItems: "center", marginLeft: scale(-32), marginTop: scale(-16) },
  pinRing: {
    position: "absolute", width: scale(36), height: scale(36), borderRadius: scale(18),
    backgroundColor: "rgba(212,163,115,0.35)",
  },
  pin: {
    flexDirection: "row", alignItems: "center", gap: scale(4),
    backgroundColor: "#D4A373", paddingHorizontal: scale(10), paddingVertical: scale(5),
    borderRadius: scale(20), shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4, elevation: 4,
  },
  pinSelected: { backgroundColor: "#2C1810" },
  pinText: { color: "#FFF", fontSize: moderateScale(11), fontWeight: "700" },

  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    height: SHEET_HEIGHT, backgroundColor: "#FFF",
    borderTopLeftRadius: scale(28), borderTopRightRadius: scale(28),
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 20, overflow: "hidden",
  },
  handle: {
    width: scale(40), height: scale(4), backgroundColor: "#DADADA",
    borderRadius: scale(2), alignSelf: "center",
    marginTop: scale(10), marginBottom: scale(8),
  },
  searchContainer: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#F7F3F0",
    borderRadius: scale(16), paddingHorizontal: scale(14), paddingVertical: scale(11),
    marginHorizontal: scale(16), marginBottom: scale(4), gap: scale(10),
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  searchInput: { flex: 1, fontSize: moderateScale(14), color: "#1A1A1A" },

  listHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: scale(16), paddingTop: scale(10), paddingBottom: scale(4),
  },
  listTitle: {
    fontSize: moderateScale(18), fontWeight: "700",
    fontFamily: "PlayfairDisplay_700Bold", color: "#1A1A1A",
  },
  listCountChip: {
    flexDirection: "row", alignItems: "center", gap: scale(4),
    backgroundColor: "rgba(212,163,115,0.12)",
    paddingHorizontal: scale(10), paddingVertical: scale(4), borderRadius: scale(12),
  },
  listCountText: { fontSize: moderateScale(12), color: "#D4A373", fontWeight: "600" },

  filterChip: {
    flexDirection: "row", alignItems: "center", gap: scale(5),
    paddingHorizontal: scale(12), paddingVertical: scale(7),
    borderRadius: scale(20), borderWidth: 1,
    borderColor: "#E0D8D0", backgroundColor: "#F7F3F0",
  },
  filterChipActive: { backgroundColor: "#D4A373", borderColor: "#D4A373" },
  filterChipText: { fontSize: moderateScale(12), fontWeight: "600", color: "#666" },

  cafeCard: {
    marginHorizontal: scale(16), marginBottom: scale(14),
    borderRadius: scale(20), overflow: "hidden", height: scale(160),
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14, shadowRadius: 10, elevation: 5,
  },
  cafeCardImage: { width: "100%", height: "100%" },
  openPip: {
    position: "absolute", top: scale(12), left: scale(12),
    paddingHorizontal: scale(10), paddingVertical: scale(4), borderRadius: scale(12),
  },
  openPipGreen: { backgroundColor: "rgba(232,245,233,0.95)" },
  openPipRed:   { backgroundColor: "rgba(255,235,238,0.95)" },
  openPipText:  { fontSize: moderateScale(11), fontWeight: "600" },
  cardRatingBadge: {
    position: "absolute", top: scale(12), right: scale(12),
    flexDirection: "row", alignItems: "center", gap: scale(3),
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: scale(8), paddingVertical: scale(4), borderRadius: scale(12),
  },
  cardRatingText: { fontSize: moderateScale(12), fontWeight: "700", color: "#1A1A1A" },
  cafeCardTextArea: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(0,0,0,0.48)",
    paddingHorizontal: scale(14), paddingTop: scale(20), paddingBottom: scale(12),
  },
  cafeCardName: { fontSize: moderateScale(17), fontWeight: "700", color: "#FFF", marginBottom: scale(2) },
  cafeCardMeta: { flexDirection: "row", justifyContent: "space-between" },
  cafeCardSub:  { fontSize: moderateScale(12), color: "rgba(255,255,255,0.85)" },
  cafeCardDist: { fontSize: moderateScale(12), color: "rgba(255,255,255,0.85)", fontWeight: "600" },

  // ── Detail modal ──
  detailSheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    height: height * 0.92, backgroundColor: "#FFF",
    borderTopLeftRadius: scale(28), borderTopRightRadius: scale(28),
    shadowColor: "#000", shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.18, shadowRadius: 24, elevation: 24, overflow: "hidden",
  },

  heroWrap: { position: "relative", width: "100%", height: scale(230) },
  detailHero: { width, height: scale(230) },
  heroOverlay: {
    position: "absolute", bottom: scale(12), left: scale(12),
  },
  heroBadge: {
    paddingHorizontal: scale(10), paddingVertical: scale(4), borderRadius: scale(12),
  },
  heroBadgeOpen:   { backgroundColor: "rgba(232,245,233,0.95)" },
  heroBadgeClosed: { backgroundColor: "rgba(255,235,238,0.95)" },
  heroBadgeText:   { fontSize: moderateScale(12), fontWeight: "600" },
  photoDots: {
    position: "absolute", bottom: scale(12), alignSelf: "center",
    width: "100%", flexDirection: "row", justifyContent: "center", gap: scale(5),
  },
  photoDot: {
    width: scale(6), height: scale(6), borderRadius: scale(3),
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  photoDotActive: {
    backgroundColor: "#FFF", width: scale(18), borderRadius: scale(3),
  },
  closeBtn: {
    position: "absolute", top: scale(14), right: scale(14), zIndex: 10,
    width: scale(32), height: scale(32), borderRadius: scale(16),
    backgroundColor: "rgba(255,255,255,0.92)",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15, shadowRadius: 3, elevation: 3,
  },

  detailBody: { paddingHorizontal: scale(16), paddingTop: scale(16) },

  nameRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: scale(6) },
  detailName: {
    fontSize: moderateScale(22), fontWeight: "700",
    fontFamily: "PlayfairDisplay_700Bold", color: "#1A1A1A", marginBottom: scale(2),
  },
  detailCategory: { fontSize: moderateScale(13), color: "#888" },
  ratingChip: {
    flexDirection: "row", alignItems: "center", gap: scale(3),
    backgroundColor: "rgba(212,163,115,0.12)",
    paddingHorizontal: scale(10), paddingVertical: scale(5),
    borderRadius: scale(12), marginLeft: scale(8),
  },
  ratingNum:     { fontSize: moderateScale(14), fontWeight: "700", color: "#1A1A1A" },
  ratingReviews: { fontSize: moderateScale(11), color: "#888" },

  addressRow: {
    flexDirection: "row", alignItems: "center", gap: scale(6),
    marginBottom: scale(16),
  },
  addressText:  { fontSize: moderateScale(13), color: "#555", flex: 1 },
  distancePill: {
    fontSize: moderateScale(12), color: "#D4A373", fontWeight: "600",
    backgroundColor: "rgba(212,163,115,0.1)",
    paddingHorizontal: scale(8), paddingVertical: scale(3), borderRadius: scale(10),
  },

  actionsRow: {
    flexDirection: "row", gap: scale(8), marginBottom: scale(20),
  },
  actionBtn: {
    flex: 1, alignItems: "center", justifyContent: "center", gap: scale(5),
    paddingVertical: scale(10), borderRadius: scale(14),
    backgroundColor: "#F5F2EE",
  },
  actionBtnActive: { backgroundColor: "rgba(212,163,115,0.12)" },
  actionBtnLabel: { fontSize: moderateScale(11), fontWeight: "600", color: "#444" },

  amenityChip: {
    paddingHorizontal: scale(12), paddingVertical: scale(6),
    borderRadius: scale(16), borderWidth: 1,
    borderColor: "#E0D8D0", backgroundColor: "#F7F3F0",
  },
  vibeChip: { borderColor: "rgba(212,163,115,0.3)", backgroundColor: "rgba(212,163,115,0.08)" },
  amenityChipText: { fontSize: moderateScale(12), color: "#555", fontWeight: "500" },

  tabRow: {
    flexDirection: "row", gap: scale(8), marginBottom: scale(16),
    backgroundColor: "#F5F2EE", borderRadius: scale(16), padding: scale(4),
  },
  tabBtn:           { flex: 1, paddingVertical: scale(8), borderRadius: scale(12), alignItems: "center" },
  tabBtnActive:     { backgroundColor: "#FFF", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  tabBtnText:       { fontSize: moderateScale(13), fontWeight: "500", color: "#888" },
  tabBtnTextActive: { color: "#1A1A1A", fontWeight: "700" },
  tabContent: { marginBottom: scale(16) },

  sectionHeading: {
    fontSize: moderateScale(14), fontWeight: "700", color: "#1A1A1A",
    marginBottom: scale(8),
  },
  descriptionText: {
    fontSize: moderateScale(13), color: "#555", lineHeight: moderateScale(20),
    marginBottom: scale(20),
  },

  hoursHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: scale(8),
  },
  todayHoursPreview: { fontSize: moderateScale(12), color: "#888" },
  hoursGrid: {
    backgroundColor: "#F7F3F0", borderRadius: scale(12),
    paddingHorizontal: scale(12), paddingVertical: scale(8),
    marginBottom: scale(16),
  },
  hoursRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: scale(6), borderBottomWidth: 1, borderBottomColor: "#EEEBE6",
  },
  hoursRowToday: { backgroundColor: "rgba(212,163,115,0.08)", marginHorizontal: scale(-4), paddingHorizontal: scale(4), borderRadius: scale(6) },
  hoursDay:      { fontSize: moderateScale(13), color: "#666", width: scale(36) },
  hoursDayToday: { color: "#D4A373", fontWeight: "700" },
  hoursTime:     { fontSize: moderateScale(13), color: "#444" },
  hoursTimeToday:{ color: "#D4A373", fontWeight: "700" },

  contactCard: {
    backgroundColor: "#F7F3F0", borderRadius: scale(12),
    paddingHorizontal: scale(12), paddingVertical: scale(4),
    marginBottom: scale(12),
  },
  contactRow: {
    flexDirection: "row", alignItems: "center", gap: scale(10),
    paddingVertical: scale(10), borderBottomWidth: 1, borderBottomColor: "#EEEBE6",
  },
  contactText: { fontSize: moderateScale(13), color: "#444" },

  priceRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: scale(12), borderTopWidth: 1, borderTopColor: "#EEEBE6",
  },
  priceLabel: { fontSize: moderateScale(13), color: "#888" },
  priceValue: { fontSize: moderateScale(13), fontWeight: "700", color: "#1A1A1A" },

  rewardRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#F7F3F0", borderRadius: scale(12),
    padding: scale(12), marginBottom: scale(8), gap: scale(12),
  },
  rewardPtsBadge: {
    backgroundColor: "rgba(212,163,115,0.15)",
    paddingHorizontal: scale(10), paddingVertical: scale(5), borderRadius: scale(10),
  },
  rewardPts:   { fontSize: moderateScale(13), fontWeight: "700", color: "#D4A373" },
  rewardLabel: { fontSize: moderateScale(14), color: "#333", fontWeight: "500" },
  goToRewardsBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: scale(8), backgroundColor: "#D4A373",
    borderRadius: scale(14), paddingVertical: scale(12), marginTop: scale(8),
  },
  goToRewardsBtnText: { color: "#FFF", fontSize: moderateScale(14), fontWeight: "700" },

  ratingSummary: {
    flexDirection: "row", alignItems: "center", gap: scale(16),
    backgroundColor: "#F7F3F0", borderRadius: scale(14),
    padding: scale(16), marginBottom: scale(16),
  },
  ratingSummaryBig: {
    fontSize: moderateScale(40), fontWeight: "800", color: "#1A1A1A",
    fontFamily: "PlayfairDisplay_700Bold",
  },
  ratingSummaryCount: { fontSize: moderateScale(12), color: "#888" },

  reviewCard: {
    backgroundColor: "#F7F3F0", borderRadius: scale(12),
    padding: scale(12), marginBottom: scale(8),
  },
  reviewHeader: { flexDirection: "row", gap: scale(10) },
  reviewAvatar: {
    width: scale(32), height: scale(32), borderRadius: scale(16),
    backgroundColor: "rgba(212,163,115,0.15)",
    justifyContent: "center", alignItems: "center",
  },
  reviewTime: { fontSize: moderateScale(11), color: "#AAA" },
  reviewText: {
    fontSize: moderateScale(13), color: "#555",
    lineHeight: moderateScale(19), marginTop: scale(4),
  },

  errorBanner: {
    marginHorizontal: scale(16), marginBottom: scale(12),
    backgroundColor: "rgba(198,40,40,0.08)",
    borderRadius: scale(12), padding: scale(14),
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  errorBannerText: { fontSize: moderateScale(13), color: "#C62828", fontWeight: "500" },
  retryBtn: {
    backgroundColor: "#C62828", borderRadius: scale(10),
    paddingHorizontal: scale(14), paddingVertical: scale(6),
  },
  retryBtnText: { color: "#FFF", fontSize: moderateScale(12), fontWeight: "700" },

  loadingState: {
    alignItems: "center", paddingVertical: scale(32), gap: scale(10),
  },
  loadingText: { fontSize: moderateScale(13), color: "#AAA" },

  emptyState: {
    alignItems: "center", paddingVertical: scale(40), gap: scale(8),
  },
  emptyStateText: { fontSize: moderateScale(16), fontWeight: "700", color: "#888" },
  emptyStateSub:  { fontSize: moderateScale(13), color: "#BBB" },

  aiTag: {
    paddingHorizontal: scale(10), paddingVertical: scale(4),
    borderRadius: scale(12), backgroundColor: "rgba(212,163,115,0.12)",
    borderWidth: 1, borderColor: "rgba(212,163,115,0.25)",
  },
  aiTagText: { fontSize: moderateScale(11), color: "#D4A373", fontWeight: "600" },
});