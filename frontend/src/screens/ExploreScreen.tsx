import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
  PanResponder,
  Modal,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useRole } from "../context/RoleContext";
import BottomNav from "../components/ui/BottomNav";
import { Search, Star, Wifi, Zap, Coffee, Clock, X, Navigation, Gift } from "lucide-react-native";

const { width, height } = Dimensions.get("window");

// ─── Data ─────────────────────────────────────────────────────────────────────
const allCafes = [
  {
    id: 1,
    name: "The Roastery",
    image: require("../assets/cafe-1.jpg"),
    rating: 4.8,
    distance: "0.3 mi",
    amenities: ["Wi-Fi", "Outlets", "Coffee"],
    vibes: ["Cozy", "Quiet"],
    isOpen: true,
    priceRange: "$$",
    reviews: 234,
    hours: "Mon–Fri  7am–8pm",
    address: "42 Brew St, Brooklyn",
    pin: { x: 0.44, y: 0.30 },
  },
  {
    id: 2,
    name: "Bean & Leaf",
    image: require("../assets/cafe-2.jpg"),
    rating: 4.6,
    distance: "0.5 mi",
    amenities: ["Wi-Fi", "Coffee"],
    vibes: ["Bright", "Minimal"],
    isOpen: true,
    priceRange: "$",
    reviews: 189,
    hours: "Daily  8am–7pm",
    address: "15 Green Ave, Williamsburg",
    pin: { x: 0.66, y: 0.50 },
  },
  {
    id: 3,
    name: "Brew Culture",
    image: require("../assets/cafe-3.jpg"),
    rating: 4.9,
    distance: "0.8 mi",
    amenities: ["Wi-Fi", "Outlets", "Coffee"],
    vibes: ["Industrial", "Hipster"],
    isOpen: false,
    priceRange: "$$$",
    reviews: 412,
    hours: "Mon–Sat  9am–10pm",
    address: "88 Culture Blvd, Bushwick",
    pin: { x: 0.26, y: 0.58 },
  },
];

const FILTER_OPTIONS = [
  { id: "open",    label: "Open Now",     Icon: Clock   },
  { id: "wifi",    label: "Wi-Fi",        Icon: Wifi    },
  { id: "outlets", label: "Outlets",      Icon: Zap     },
  { id: "coffee",  label: "Great Coffee", Icon: Coffee  },
];

const SHEET_HEIGHT = height * 0.52;

// ─── Component ────────────────────────────────────────────────────────────────
export default function ExploreScreen() {
  const { role } = useRole();
  const navigation = useNavigation<any>();

  const [search, setSearch]               = useState("");
  const [selectedCafe, setSelectedCafe]   = useState<(typeof allCafes)[0] | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>(["open"]);
  const [activeTab, setActiveTab]         = useState<"info" | "rewards" | "reviews">("info");
  const [detailVisible, setDetailVisible] = useState(false);

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

  // Pin pulse – one Animated.Value per cafe
  const pulseScales  = useRef(allCafes.map(() => new Animated.Value(1))).current;
  const pulseOpacity = useRef(allCafes.map(() => new Animated.Value(0.6))).current;

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

  const filteredCafes = allCafes.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const openDetail = (cafe: (typeof allCafes)[0]) => {
    setSelectedCafe(cafe);
    setActiveTab("info");
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

  const toggleFilter = (id: string) =>
    setActiveFilters((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );

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
          {/* Park patches */}
          <View style={[styles.park, { top: "14%", left: "54%", width: 88, height: 64 }]} />
          <View style={[styles.park, { top: "62%", left: "8%",  width: 66, height: 48 }]} />
          {/* Water */}
          <View style={[styles.water, { top: "68%", left: "52%", width: 110, height: 56 }]} />
          {/* Building blocks */}
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
          {/* Minor roads */}
          {["21%", "39%", "57%", "73%"].map((t, i) => (
            <View key={`h${i}`} style={[styles.roadH, { top: t as any }]} />
          ))}
          {["19%", "39%", "61%", "79%"].map((l, i) => (
            <View key={`v${i}`} style={[styles.roadV, { left: l as any }]} />
          ))}
          {/* Major roads */}
          <View style={[styles.roadHMaj, { top: "39%" }]} />
          <View style={[styles.roadVMaj, { left: "39%" }]} />
        </View>

        {/* You-are-here */}
        <View style={styles.youAreHere}>
          <View style={styles.youRing} />
          <View style={styles.youDot} />
        </View>

        {/* Cafe pins */}
        {filteredCafes.map((cafe, i) => (
          <TouchableOpacity
            key={cafe.id}
            style={[styles.pinWrap, { top: `${cafe.pin.y * 100}%` as any, left: `${cafe.pin.x * 100}%` as any }]}
            onPress={() => openDetail(cafe)}
            activeOpacity={0.8}
          >
            <Animated.View
              style={[styles.pinRing, { transform: [{ scale: pulseScales[i] }], opacity: pulseOpacity[i] }]}
            />
            <View style={[styles.pin, selectedCafe?.id === cafe.id && styles.pinSelected]}>
              <Text style={styles.pinText}>{cafe.name.split(" ")[0]}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* ── BOTTOM SHEET (list, always visible) ─────────────── */}
      <View style={styles.sheet}>
        <View style={styles.handle} />

        {/* Search bar – FYP-consistent style, top of sheet */}
        <View style={styles.searchContainer}>
          <Search size={15} color="#999" />
          <TextInput
            placeholder="Search cafés near you…"
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

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* List header */}
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Cafés Near You</Text>
            <View style={styles.listCountChip}>
              <Navigation size={11} color="#D4A373" />
              <Text style={styles.listCountText}>{filteredCafes.length} places</Text>
            </View>
          </View>

          {/* Filter chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 16 }}
          >
            {FILTER_OPTIONS.map((f) => {
              const active = activeFilters.includes(f.id);
              const Icon = f.Icon;
              return (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => toggleFilter(f.id)}
                >
                  <Icon size={12} color={active ? "#FFF" : "#666"} />
                  <Text style={[styles.filterChipText, active && { color: "#FFF" }]}>{f.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Cafe cards */}
          {filteredCafes.map((cafe) => (
            <TouchableOpacity
              key={cafe.id}
              style={styles.cafeCard}
              onPress={() => openDetail(cafe)}
              activeOpacity={0.9}
            >
              <Image source={cafe.image} style={styles.cafeCardImage} resizeMode="cover" />
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
                  <Text style={styles.cafeCardSub}>{cafe.vibes.join(" · ")}</Text>
                  <Text style={styles.cafeCardDist}>{cafe.distance}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.navWrapper}>
        <BottomNav />
      </View>

      {/* ── CAFE DETAIL MODAL (covers BottomNav) ────────────── */}
      <Modal visible={detailVisible} transparent animationType="none" statusBarTranslucent onRequestClose={closeDetail}>
        <View style={{ flex: 1 }}>
          {/* Dim backdrop */}
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeDetail}>
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.25)" }} />
          </TouchableOpacity>

          {selectedCafe && (
            <Animated.View style={[styles.detailSheet, { transform: [{ translateY: detailSlide }] }]}>
              <View style={styles.handle} />

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
                {/* Close */}
                <TouchableOpacity style={styles.closeBtn} onPress={closeDetail}>
                  <X size={16} color="#444" />
                </TouchableOpacity>

                {/* Hero image */}
                <Image source={selectedCafe.image} style={styles.detailHero} resizeMode="cover" />

                <View style={styles.detailBody}>
                  {/* Name + rating */}
                  <View style={styles.detailTopRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailName}>{selectedCafe.name}</Text>
                      <Text style={styles.detailAddress}>{selectedCafe.address}</Text>
                    </View>
                    <View style={styles.ratingChip}>
                      <Star size={13} color="#D4A373" fill="#D4A373" />
                      <Text style={styles.ratingNum}>{selectedCafe.rating}</Text>
                      <Text style={styles.ratingReviews}>({selectedCafe.reviews})</Text>
                    </View>
                  </View>

                  {/* Status + meta */}
                  <View style={styles.metaRow}>
                    <View style={[styles.statusChip, selectedCafe.isOpen ? styles.statusOpen : styles.statusClosed]}>
                      <Text style={[styles.statusChipText, selectedCafe.isOpen ? { color: "#2E7D32" } : { color: "#C62828" }]}>
                        {selectedCafe.isOpen ? "Open Now" : "Closed"}
                      </Text>
                    </View>
                    <Text style={styles.metaText}>{selectedCafe.hours}</Text>
                    <Text style={styles.metaDot}>·</Text>
                    <Text style={styles.metaText}>{selectedCafe.distance}</Text>
                    <Text style={styles.metaDot}>·</Text>
                    <Text style={styles.metaText}>{selectedCafe.priceRange}</Text>
                  </View>

                  {/* Amenity chips */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: 20 }}
                    contentContainerStyle={{ gap: 8 }}
                  >
                    {selectedCafe.amenities.map((a) => (
                      <View key={a} style={styles.amenityChip}>
                        <Text style={styles.amenityChipText}>{a}</Text>
                      </View>
                    ))}
                  </ScrollView>

                  {/* Tabs */}
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

                  {/* Tab content */}
                  <Animated.View style={{ opacity: tabFade }}>
                    {activeTab === "info" && (
                      <View style={styles.tabContent}>
                        {[
                          "Specialty coffee & artisan pastries",
                          "Free high-speed Wi-Fi",
                          "Curated lo-fi & jazz playlist",
                          "Plenty of seating & power outlets",
                        ].map((item, i) => (
                          <View key={i} style={styles.infoRow}>
                            <View style={styles.infoDot} />
                            <Text style={styles.infoText}>{item}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {activeTab === "rewards" && (
                      <View style={styles.tabContent}>
                        {[
                          ["500 pts", "Free Latte"],
                          ["300 pts", "20% Off Order"],
                          ["700 pts", "Buy 1 Get 1 Free"],
                        ].map(([pts, label], i) => (
                          <View key={i} style={styles.rewardRow}>
                            <Text style={styles.rewardPts}>{pts}</Text>
                            <Text style={styles.rewardLabel}>{label}</Text>
                          </View>
                        ))}

                        {/* Navigate to full Rewards screen */}
                        <TouchableOpacity
                          style={styles.goToRewardsBtn}
                          onPress={() => { closeDetail(); navigation.navigate("Rewards"); }}
                        >
                          <Gift size={15} color="#FFF" />
                          <Text style={styles.goToRewardsBtnText}>View All Rewards</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {activeTab === "reviews" && (
                      <View style={styles.tabContent}>
                        {[
                          { user: "Emma W.", text: "Best flat white in the area. Perfect study spot!", stars: 5 },
                          { user: "James K.", text: "Love the atmosphere. Come every morning.", stars: 5 },
                          { user: "Aisha M.", text: "Cozy vibes, great music. Highly recommend!", stars: 4 },
                        ].map((r, i) => (
                          <View key={i} style={styles.reviewCard}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                              <Text style={styles.reviewUser}>{r.user}</Text>
                              <View style={{ flexDirection: "row", gap: 2 }}>
                                {Array.from({ length: 5 }).map((_, j) => (
                                  <Star key={j} size={11} color={j < r.stars ? "#D4A373" : "#DDD"} fill={j < r.stars ? "#D4A373" : "transparent"} />
                                ))}
                              </View>
                            </View>
                            <Text style={styles.reviewText}>{r.text}</Text>
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

  // ── Map ──
  mapBg: { flex: 1, backgroundColor: "#EDE9E1" },
  block: { position: "absolute", backgroundColor: "#DDD9D1", borderRadius: 6 },
  park:  { position: "absolute", backgroundColor: "#C5D9A6", borderRadius: 6 },
  water: { position: "absolute", backgroundColor: "#A8CCE0", borderRadius: 8 },
  roadH: { position: "absolute", left: 0, right: 0, height: 4, backgroundColor: "#F5F2EC" },
  roadV: { position: "absolute", top: 0, bottom: 0, width: 4, backgroundColor: "#F5F2EC" },
  roadHMaj: { position: "absolute", left: 0, right: 0, height: 7, backgroundColor: "#FDFAF6" },
  roadVMaj: { position: "absolute", top: 0, bottom: 0, width: 7, backgroundColor: "#FDFAF6" },

  navWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },

  // You-are-here
  youAreHere: {
    position: "absolute",
    top: "47%",
    left: "50%",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -10,
    marginTop: -10,
  },
  youRing: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(66,133,244,0.2)",
    borderWidth: 1.5,
    borderColor: "rgba(66,133,244,0.4)",
  },
  youDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4285F4",
    borderWidth: 2.5,
    borderColor: "#FFF",
  },

  // Pins
  pinWrap: { position: "absolute", alignItems: "center", marginLeft: -32, marginTop: -16 },
  pinRing: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(212,163,115,0.35)",
  },
  pin: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#D4A373",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  pinSelected: { backgroundColor: "#2C1810" },
  pinText: { color: "#FFF", fontSize: 11, fontWeight: "700" },

  // Bottom sheet (list, static)
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
    overflow: "hidden",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#DADADA",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 8,
  },

  // Search bar (FYP-consistent)
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F3F0",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginHorizontal: 16,
    marginBottom: 4,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#1A1A1A" },

  // List
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "PlayfairDisplay_700Bold",
    color: "#1A1A1A",
  },
  listCountChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(212,163,115,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  listCountText: { fontSize: 12, color: "#D4A373", fontWeight: "600" },

  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0D8D0",
    backgroundColor: "#F7F3F0",
  },
  filterChipActive: { backgroundColor: "#D4A373", borderColor: "#D4A373" },
  filterChipText: { fontSize: 12, fontWeight: "600", color: "#666" },

  // Cafe card
  cafeCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 20,
    overflow: "hidden",
    height: 160,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 5,
  },
  cafeCardImage: { width: "100%", height: "100%" },
  openPip: { position: "absolute", top: 12, left: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  openPipGreen: { backgroundColor: "rgba(232,245,233,0.95)" },
  openPipRed:   { backgroundColor: "rgba(255,235,238,0.95)" },
  openPipText:  { fontSize: 11, fontWeight: "600" },
  cardRatingBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardRatingText: { fontSize: 12, fontWeight: "700", color: "#1A1A1A" },
  cafeCardTextArea: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.48)",
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 12,
  },
  cafeCardName: { fontSize: 17, fontWeight: "700", color: "#FFF", marginBottom: 2 },
  cafeCardMeta: { flexDirection: "row", justifyContent: "space-between" },
  cafeCardSub:  { fontSize: 12, color: "rgba(255,255,255,0.85)" },
  cafeCardDist: { fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: "600" },

  // Detail modal sheet
  detailSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.90,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 24,
    overflow: "hidden",
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 16,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  detailHero: { width: "100%", height: 220 },
  detailBody: { paddingHorizontal: 16, paddingTop: 16 },
  detailTopRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 6 },
  detailName: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "PlayfairDisplay_700Bold",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  detailAddress: { fontSize: 13, color: "#777", marginBottom: 12 },
  ratingChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(212,163,115,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginLeft: 8,
  },
  ratingNum:     { fontSize: 14, fontWeight: "700", color: "#1A1A1A" },
  ratingReviews: { fontSize: 11, color: "#888" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  statusChip:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusOpen:     { backgroundColor: "#E8F5E9" },
  statusClosed:   { backgroundColor: "#FFEBEE" },
  statusChipText: { fontSize: 12, fontWeight: "600" },
  metaText: { fontSize: 12, color: "#666" },
  metaDot:  { fontSize: 12, color: "#CCC" },
  amenityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0D8D0",
    backgroundColor: "#F7F3F0",
  },
  amenityChipText: { fontSize: 12, color: "#555", fontWeight: "500" },
  tabRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    backgroundColor: "#F5F2EE",
    borderRadius: 16,
    padding: 4,
  },
  tabBtn:           { flex: 1, paddingVertical: 8, borderRadius: 12, alignItems: "center" },
  tabBtnActive:     { backgroundColor: "#FFF", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  tabBtnText:       { fontSize: 13, fontWeight: "500", color: "#888" },
  tabBtnTextActive: { color: "#1A1A1A", fontWeight: "700" },
  tabContent: { marginBottom: 16 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  infoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#D4A373" },
  infoText: { fontSize: 14, color: "#333", lineHeight: 20 },
  rewardRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F3F0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  rewardPts:   { fontSize: 13, fontWeight: "700", color: "#D4A373", width: 64 },
  rewardLabel: { fontSize: 14, color: "#333", fontWeight: "500" },
  goToRewardsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#D4A373",
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 8,
  },
  goToRewardsBtnText: { color: "#FFF", fontSize: 14, fontWeight: "700" },
  reviewCard: { backgroundColor: "#F7F3F0", borderRadius: 12, padding: 12, marginBottom: 8 },
  reviewUser: { fontSize: 13, fontWeight: "700", color: "#1A1A1A" },
  reviewText: { fontSize: 13, color: "#555", lineHeight: 19, marginTop: 2 },
});
