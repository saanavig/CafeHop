import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  PanResponder,
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
  Instagram,
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

const allCafes = [
  {
    id: 1,
    name: "The Roastery",
    category: "Specialty Coffee",
    description: "A beloved neighborhood spot renowned for single-origin pour-overs and house-baked pastries. Perfect for work sessions or lazy weekend mornings.",
    image: require("../assets/cafe-1.jpg"),
    photos: [
      require("../assets/cafe-1.jpg"),
      require("../assets/latte-art.jpg"),
      require("../assets/cafe-2.jpg"),
    ],
    rating: 4.8,
    distance: "0.3 mi",
    amenities: ["Wi-Fi", "Outlets", "Coffee"],
    vibes: ["Cozy", "Quiet"],
    isOpen: true,
    priceRange: "$$",
    reviews: 234,
    phone: "+1 (718) 555-0101",
    website: "theroastery.com",
    instagram: "@theroastery_bk",
    address: "42 Brew St, Brooklyn",
    fullHours: {
      Mon: "7:00 AM – 8:00 PM",
      Tue: "7:00 AM – 8:00 PM",
      Wed: "7:00 AM – 8:00 PM",
      Thu: "7:00 AM – 8:00 PM",
      Fri: "7:00 AM – 9:00 PM",
      Sat: "8:00 AM – 9:00 PM",
      Sun: "9:00 AM – 6:00 PM",
    },
    pin: { x: 0.44, y: 0.30 },
  },
  {
    id: 2,
    name: "Bean & Leaf",
    category: "Café · Tea Bar",
    description: "Light-filled minimalist café with an extensive tea menu alongside excellent espresso drinks. A calm escape from the city's energy.",
    image: require("../assets/cafe-2.jpg"),
    photos: [
      require("../assets/cafe-2.jpg"),
      require("../assets/cafe-3.jpg"),
      require("../assets/latte-art.jpg"),
    ],
    rating: 4.6,
    distance: "0.5 mi",
    amenities: ["Wi-Fi", "Coffee"],
    vibes: ["Bright", "Minimal"],
    isOpen: true,
    priceRange: "$",
    reviews: 189,
    phone: "+1 (718) 555-0202",
    website: "beanandleaf.co",
    instagram: "@beanandleaf",
    address: "15 Green Ave, Williamsburg",
    fullHours: {
      Mon: "8:00 AM – 7:00 PM",
      Tue: "8:00 AM – 7:00 PM",
      Wed: "8:00 AM – 7:00 PM",
      Thu: "8:00 AM – 7:00 PM",
      Fri: "8:00 AM – 8:00 PM",
      Sat: "9:00 AM – 8:00 PM",
      Sun: "10:00 AM – 5:00 PM",
    },
    pin: { x: 0.66, y: 0.50 },
  },
  {
    id: 3,
    name: "Brew Culture",
    category: "Third Wave Coffee",
    description: "Industrial-chic space with a rotating selection of micro-roasted beans. Known for exceptional cold brew and a late-night crowd.",
    image: require("../assets/cafe-3.jpg"),
    photos: [
      require("../assets/cafe-3.jpg"),
      require("../assets/cafe-1.jpg"),
      require("../assets/latte-art.jpg"),
    ],
    rating: 4.9,
    distance: "0.8 mi",
    amenities: ["Wi-Fi", "Outlets", "Coffee"],
    vibes: ["Industrial", "Hipster"],
    isOpen: false,
    priceRange: "$$$",
    reviews: 412,
    phone: "+1 (718) 555-0303",
    website: "brewculture.nyc",
    instagram: "@brewculture",
    address: "88 Culture Blvd, Bushwick",
    fullHours: {
      Mon: "Closed",
      Tue: "9:00 AM – 10:00 PM",
      Wed: "9:00 AM – 10:00 PM",
      Thu: "9:00 AM – 10:00 PM",
      Fri: "9:00 AM – 11:00 PM",
      Sat: "10:00 AM – 11:00 PM",
      Sun: "10:00 AM – 8:00 PM",
    },
    pin: { x: 0.26, y: 0.58 },
  },
];

// const FILTER_OPTIONS = [
//   { id: "open",    label: "Open Now",     Icon: Clock   },
//   { id: "wifi",    label: "Wi-Fi",        Icon: Wifi    },
//   { id: "outlets", label: "Outlets",      Icon: Zap     },
//   { id: "coffee",  label: "Great Coffee", Icon: Coffee  },
// ];

const SHEET_HEIGHT = height * 0.52;
const API_URL = "http://127.0.0.1:3001";

// ─── Component ────────────────────────────────────────────────────────────────
export default function ExploreScreen() {
  const { role } = useRole();
  const navigation = useNavigation<any>();

  const [search, setSearch]               = useState("");
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  // const [activeFilters, setActiveFilters] = useState<string[]>(["open"]);
  const [activeTab, setActiveTab]         = useState<"info" | "rewards" | "reviews">("info");
  const [detailVisible, setDetailVisible] = useState(false);
  const [photoIndex, setPhotoIndex]       = useState(0);
  const [hoursExpanded, setHoursExpanded] = useState(false);
  const [saved, setSaved]                 = useState<(string | number)[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("All");

  type Cafe = {
    id: string | number;
    name: string;

    // backend
    attributes?: string[];
    price_level?: number;
    isOpen?: boolean;
    latitude?: number;
    longitude?: number;
    image_url?: string;

    // static / enriched
    image?: any;
    photos?: any[];
    rating?: number;
    reviews?: number;
    category?: string;
    description?: string;
    amenities?: string[];
    vibes?: string[];
    distance?: string;
    priceRange?: string;
    phone?: string;
    website?: string;
    instagram?: string;
    address?: string;
    fullHours?: Record<string, string>;
    pin?: { x: number; y: number };
  };

  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [cafes, setCafes] = useState<Cafe[]>(allCafes);
  const [loading, setLoading] = useState(false);

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

  // Pin pulse
  const pulseScales  = useRef(allCafes.map(() => new Animated.Value(1))).current;
  const pulseOpacity = useRef(allCafes.map(() => new Animated.Value(0.6))).current;

  useEffect(() => {
    fetchCafes();
  }, []);

  const fetchCafes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/cafe/all`);
      const data = await res.json();
      console.log("FILTER INPUT:", data);

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

      if (cleaned.length > 0) {
        setCafes([...allCafes, ...cleaned]);
      }
    } catch (err) {
      console.error("Error fetching cafes:", err);
    } finally {
      setLoading(false);
    }
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
    allCafes.forEach((_, i) => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(i * 600),
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
    });
  }, []);

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

  const toggleSave = (id: string | number) =>
    setSaved((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  const todayKey = DAYS_SHORT[new Date().getDay()];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      {/* ── PANNABLE MAP ────────────────────────────────────── */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ translateX: mapOffset.x }, { translateY: mapOffset.y }] },
        ]}
        {...mapPanResponder.panHandlers}
      >
        <View style={styles.mapBg}>
          <View style={[styles.park,  { top: "14%", left: "54%", width: 88, height: 64 }]} />
          <View style={[styles.park,  { top: "62%", left: "8%",  width: 66, height: 48 }]} />
          <View style={[styles.water, { top: "68%", left: "52%", width: 110, height: 56 }]} />
          {[
            { t: "7%",  l: "4%",  w: 100, h: 68 },
            { t: "20%", l: "28%", w: 82,  h: 54 },
            { t: "10%", l: "64%", w: 92,  h: 66 },
            { t: "44%", l: "38%", w: 72,  h: 48 },
            { t: "54%", l: "70%", w: 86,  h: 52 },
            { t: "30%", l: "72%", w: 60,  h: 42 },
          ].map((b, i) => (
            <View key={i} style={[styles.block, { top: b.t as any, left: b.l as any, width: b.w, height: b.h }]} />
          ))}
          {["21%", "39%", "57%", "73%"].map((t, i) => (
            <View key={`h${i}`} style={[styles.roadH, { top: t as any }]} />
          ))}
          {["19%", "39%", "61%", "79%"].map((l, i) => (
            <View key={`v${i}`} style={[styles.roadV, { left: l as any }]} />
          ))}
          <View style={[styles.roadHMaj, { top: "39%" }]} />
          <View style={[styles.roadVMaj, { left: "39%" }]} />
        </View>

        <View style={styles.youAreHere}>
          <View style={styles.youRing} />
          <View style={styles.youDot} />
        </View>

        {filteredCafes.map((cafe, i) => (
          <TouchableOpacity
            key={cafe.id}
            style={[
              styles.pinWrap,
              {
                top: `${(cafe.pin?.y ?? Math.random() * 0.8) * 100}%`,
                left: `${(cafe.pin?.x ?? Math.random() * 0.8) * 100}%`,
              },
            ]}
            onPress={() => openDetail(cafe)}
            activeOpacity={0.8}
          >
            <Animated.View
              style={[
                styles.pinRing,
                {
                  transform: [{ scale: pulseScales[i] }],
                  opacity: pulseOpacity[i],
                },
              ]}
            />
            <View
              style={[
                styles.pin,
                selectedCafe?.id === cafe.id && styles.pinSelected,
              ]}
            >
              <Text style={styles.pinText}>
                {cafe.name?.split(" ")[0] ?? "Cafe"}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* ── BOTTOM SHEET + NAV (stacked, not both absolute) ── */}
      <View style={styles.bottomWrapper}>
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.searchContainer}>
          <Search size={15} color="#999" />
          <TextInput
            placeholder="Search cafes near you…"
            placeholderTextColor="#BBB"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <X size={14} color="#BBB" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: scale(16) }}>
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

          {filteredCafes.map((cafe) => (
            <TouchableOpacity
              key={cafe.id}
              style={styles.cafeCard}
              onPress={() => openDetail(cafe)}
              activeOpacity={0.9}
            >
              <Image
                source={
                  cafe.image_url
                    ? { uri: cafe.image_url }
                    : (cafe.image ?? require("../assets/cafe-1.jpg"))
                }
                style={styles.cafeCardImage}
                resizeMode="cover"
              />
              <View style={[styles.openPip, cafe.isOpen ? styles.openPipGreen : styles.openPipRed]}>
                <Text style={[styles.openPipText, cafe.isOpen ? { color: "#2E7D32" } : { color: "#C62828" }]}>
                  {cafe.isOpen ? "Open" : "Closed"}
                </Text>
              </View>
              {cafe.rating != null && (
                <View style={styles.cardRatingBadge}>
                  <Star size={11} color="#D4A373" fill="#D4A373" />
                  <Text style={styles.cardRatingText}>{cafe.rating}</Text>
                </View>
              )}
              <View style={styles.cafeCardTextArea}>
                <Text style={styles.cafeCardName}>{cafe.name}</Text>
                <View style={styles.cafeCardMeta}>
                  <Text style={styles.cafeCardSub}>{(cafe.vibes ?? []).join(" · ")}</Text>
                  <Text style={styles.cafeCardDist}>{cafe.distance}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
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
                    data={selectedCafe.photos ?? (selectedCafe.image_url ? [{ uri: selectedCafe.image_url }] : [])}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(_, i) => i.toString()}
                    onMomentumScrollEnd={(e) => {
                      setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / width));
                    }}
                    renderItem={({ item }) => (
                      <Image source={typeof item === "string" ? { uri: item } : item} style={styles.detailHero} resizeMode="cover" />
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
                      {selectedCafe.photos!.map((_, i) => (
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
                      {selectedCafe.category ? (
                        <Text style={styles.detailCategory}>{selectedCafe.category}</Text>
                      ) : null}
                    </View>
                    {selectedCafe.rating != null && (
                      <View style={styles.ratingChip}>
                        <Star size={13} color="#D4A373" fill="#D4A373" />
                        <Text style={styles.ratingNum}>{selectedCafe.rating}</Text>
                        {selectedCafe.reviews != null && (
                          <Text style={styles.ratingReviews}>({selectedCafe.reviews})</Text>
                        )}
                      </View>
                    )}
                  </View>

                  {/* ── Address + distance ── */}
                  {(selectedCafe.address || selectedCafe.distance) ? (
                    <View style={styles.addressRow}>
                      <MapPin size={scale(13)} color="#D4A373" />
                      {selectedCafe.address ? (
                        <Text style={styles.addressText}>{selectedCafe.address}</Text>
                      ) : null}
                      {selectedCafe.distance ? (
                        <Text style={styles.distancePill}>{selectedCafe.distance}</Text>
                      ) : null}
                    </View>
                  ) : null}

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
                  {((selectedCafe.amenities?.length ?? 0) > 0 || (selectedCafe.vibes?.length ?? 0) > 0) && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ marginBottom: scale(20) }}
                      contentContainerStyle={{ gap: scale(8) }}
                    >
                      {(selectedCafe.amenities ?? []).map((a) => (
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
                  )}

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
                        {selectedCafe.description && (
                          <>
                            <Text style={styles.sectionHeading}>About</Text>
                            <Text style={styles.descriptionText}>{selectedCafe.description}</Text>
                          </>
                        )}

                        {/* Hours */}
                        {selectedCafe.fullHours && (
                          <>
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
                                  Today: {selectedCafe.fullHours[todayKey as keyof typeof selectedCafe.fullHours]}
                                </Text>
                                {hoursExpanded
                                  ? <ChevronUp size={scale(14)} color="#888" />
                                  : <ChevronDown size={scale(14)} color="#888" />
                                }
                              </View>
                            </TouchableOpacity>

                            {hoursExpanded && (
                              <View style={styles.hoursGrid}>
                                {Object.entries(selectedCafe.fullHours).map(([day, hrs]) => (
                                  <View key={day} style={[styles.hoursRow, day === todayKey && styles.hoursRowToday]}>
                                    <Text style={[styles.hoursDay, day === todayKey && styles.hoursDayToday]}>{day}</Text>
                                    <Text style={[styles.hoursTime, day === todayKey && styles.hoursTimeToday]}>{hrs}</Text>
                                  </View>
                                ))}
                              </View>
                            )}
                          </>
                        )}

                        {/* Contact */}
                        {(selectedCafe.phone || selectedCafe.website || selectedCafe.instagram) && (
                          <>
                            <Text style={[styles.sectionHeading, { marginTop: scale(16) }]}>Contact</Text>
                            <View style={styles.contactCard}>
                              {selectedCafe.phone && (
                                <View style={styles.contactRow}>
                                  <Phone size={scale(15)} color="#D4A373" />
                                  <Text style={styles.contactText}>{selectedCafe.phone}</Text>
                                </View>
                              )}
                              {selectedCafe.website && (
                                <View style={styles.contactRow}>
                                  <Globe size={scale(15)} color="#D4A373" />
                                  <Text style={styles.contactText}>{selectedCafe.website}</Text>
                                </View>
                              )}
                              {selectedCafe.instagram && (
                                <View style={[styles.contactRow, { borderBottomWidth: 0 }]}>
                                  <Instagram size={scale(15)} color="#D4A373" />
                                  <Text style={styles.contactText}>{selectedCafe.instagram}</Text>
                                </View>
                              )}
                            </View>
                          </>
                        )}

                        {/* Price */}
                        {selectedCafe.priceRange && (
                          <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Price range</Text>
                            <Text style={styles.priceValue}>{selectedCafe.priceRange}</Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* REWARDS TAB */}
                    {activeTab === "rewards" && (
                      <View style={styles.tabContent}>
                        <Text style={styles.sectionHeading}>Available Rewards</Text>
                        {[
                          ["500 pts", "Free Latte"],
                          ["300 pts", "20% Off Order"],
                          ["700 pts", "Buy 1 Get 1 Free"],
                        ].map(([pts, label], i) => (
                          <View key={i} style={styles.rewardRow}>
                            <View style={styles.rewardPtsBadge}>
                              <Text style={styles.rewardPts}>{pts}</Text>
                            </View>
                            <Text style={styles.rewardLabel}>{label}</Text>
                          </View>
                        ))}
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
                        {selectedCafe.rating != null && (
                          <View style={styles.ratingSummary}>
                            <Text style={styles.ratingSummaryBig}>{selectedCafe.rating}</Text>
                            <View>
                              <View style={{ flexDirection: "row", gap: scale(3), marginBottom: scale(4) }}>
                                {Array.from({ length: 5 }).map((_, j) => (
                                  <Star key={j} size={scale(14)} color="#D4A373" fill={j < Math.round(selectedCafe.rating!) ? "#D4A373" : "transparent"} />
                                ))}
                              </View>
                              <Text style={styles.ratingSummaryCount}>{selectedCafe.reviews ?? 0} reviews</Text>
                            </View>
                          </View>
                        )}

                        <Text style={styles.sectionHeading}>Recent Reviews</Text>
                        {[
                          { text: "Best flat white in the area. Perfect study spot!", stars: 5, time: "2 days ago" },
                          { text: "Love the atmosphere. Come every morning.", stars: 5, time: "1 week ago" },
                          { text: "Cozy vibes, great music. Highly recommend!", stars: 4, time: "2 weeks ago" },
                        ].map((r, i) => (
                          <View key={i} style={styles.reviewCard}>
                            <View style={styles.reviewHeader}>
                              <View style={styles.reviewAvatar}>
                                <Coffee size={scale(14)} color="#D4A373" />
                              </View>
                              <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                  <View style={{ flexDirection: "row", gap: scale(2) }}>
                                    {Array.from({ length: 5 }).map((_, j) => (
                                      <Star key={j} size={scale(11)} color={j < r.stars ? "#D4A373" : "#DDD"} fill={j < r.stars ? "#D4A373" : "transparent"} />
                                    ))}
                                  </View>
                                  <Text style={styles.reviewTime}>{r.time}</Text>
                                </View>
                                <Text style={styles.reviewText}>{r.text}</Text>
                              </View>
                            </View>
                          </View>
                        ))}
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

  bottomWrapper: { position: "absolute", bottom: 0, left: 0, right: 0 },

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
});