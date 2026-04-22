import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Clock,
  Coffee,
  DollarSign,
  Gift,
  TrendingUp,
  Users,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { deviceWidth, moderateScale, scale } from "../utils/responsive";

import BottomNav from "../components/ui/BottomNav";
import { API_BASE } from "../api/config";
import { supabase } from "../api/supabaseClient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const contentWidth = deviceWidth - 40;

type Period = "Today" | "This Week" | "This Month";

type PeakHour = { hour: number; count: number };
type Visitor  = { name: string; time: string; pts?: number };

type AnalyticsData = {
  visits:           number;
  revenue:          number;
  redeemed:         number;
  new_customers:    number;
  peak_hours:       PeakHour[];
  recent_visitors:  Visitor[];
};

const PERIOD_MAP: Record<Period, string> = {
  "Today":      "today",
  "This Week":  "week",
  "This Month": "month",
};

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const [period,    setPeriod]    = useState<Period>("Today");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [cafeId,    setCafeId]    = useState<string | null>(null);

  // Resolve the current owner's cafe ID from Supabase
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("cafes")
        .select("id")
        .eq("owner_id", user.id)
        .single();
      if (data?.id) setCafeId(String(data.id));
    };
    load();
  }, []);

  const fetchAnalytics = async (p: string, id: string) => {
    try {
      const res  = await fetch(`${API_BASE}/api/analytics/overview?cafe_id=${id}&period=${p}`);
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error("Analytics fetch error:", err);
    }
  };

  useEffect(() => {
    if (cafeId) fetchAnalytics("today", cafeId);
  }, [cafeId]);

  const peakHours = analytics?.peak_hours ?? [];
  const maxBar    = Math.max(...peakHours.map((h) => h.count), 1);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const formatHour = (hour: number) => {
    const suffix = hour >= 12 ? "pm" : "am";
    const h = hour % 12 || 12;
    return `${h}${suffix}`;
  };

  const newRate = analytics?.visits
    ? `${Math.round(((analytics.new_customers ?? 0) / analytics.visits) * 100)}%`
    : "—";

  const statCards = [
    { Icon: Users,      bg: "#FFF0E6", color: "#D4A373", value: analytics?.visits          ?? "—", label: "Visits"        },
    { Icon: DollarSign, bg: "#E8F5E9", color: "#4CAF50", value: analytics?.revenue != null ? `$${analytics.revenue}` : "—", label: "Revenue" },
    { Icon: Gift,       bg: "#FCE4EC", color: "#E91E63", value: analytics?.redeemed        ?? "—", label: "Redeemed"      },
    { Icon: TrendingUp, bg: "#E3F2FD", color: "#2196F3", value: analytics?.new_customers   ?? "—", label: "New Customers" },
  ];

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + scale(20) }]}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        <View style={{ width: contentWidth, alignSelf: "center" }}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Analytics</Text>
            <Text style={styles.subtitle}>Your café at a glance</Text>
          </View>

          {/* Period Toggle */}
          <View style={styles.periodRow}>
            {(Object.keys(PERIOD_MAP) as Period[]).map((p) => (
              <Pressable
                key={p}
                style={[styles.periodPill, period === p && styles.periodPillActive]}
                onPress={() => {
                  setPeriod(p);
                  if (cafeId) fetchAnalytics(PERIOD_MAP[p], cafeId);
                }}
              >
                <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}</Text>
              </Pressable>
            ))}
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {statCards.map(({ Icon, bg, color, value, label }) => (
              <View key={label} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: bg }]}>
                  <Icon size={20} color={color} />
                </View>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Peak Hours Chart */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock size={16} color="#D4A373" />
              <Text style={styles.sectionTitle}>Peak Hours</Text>
            </View>
            <View style={styles.chartContainer}>
              {peakHours.length === 0 ? (
                <Text style={styles.emptyText}>No visit data yet</Text>
              ) : peakHours.map((h) => (
                <View key={h.hour} style={styles.barGroup}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.bar,
                        { height: (h.count / maxBar) * scale(80) },
                        h.count === maxBar && styles.barPeak,
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{formatHour(h.hour)}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Recent Visitors */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Coffee size={16} color="#D4A373" />
              <Text style={styles.sectionTitle}>Recent Visitors</Text>
            </View>
            {(analytics?.recent_visitors ?? []).length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No recent visitors</Text>
              </View>
            ) : (
              <View style={styles.visitorsList}>
                {(analytics!.recent_visitors).map((v, i) => (
                  <View key={i} style={styles.visitorRow}>
                    <View style={styles.visitorAvatar}>
                      <Text style={styles.visitorInitial}>{v.name[0]}</Text>
                    </View>
                    <View style={styles.visitorInfo}>
                      <Text style={styles.visitorName}>{v.name}</Text>
                      <Text style={styles.visitorTime}>{v.time}</Text>
                    </View>
                    {v.pts != null && (
                      <View style={styles.ptsBadge}>
                        <Text style={styles.ptsText}>+{v.pts} pts</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Loyalty Summary */}
          <View style={styles.loyaltyCard}>
            <Text style={styles.loyaltyTitle}>Loyalty Overview</Text>
            <View style={styles.loyaltyRow}>
              <View style={styles.loyaltyStat}>
                <Text style={styles.loyaltyValue}>{analytics?.visits ?? "—"}</Text>
                <Text style={styles.loyaltyLabel}>Total Visits</Text>
              </View>
              <View style={styles.loyaltyDivider} />
              <View style={styles.loyaltyStat}>
                <Text style={styles.loyaltyValue}>{analytics?.redeemed ?? "—"}</Text>
                <Text style={styles.loyaltyLabel}>Rewards Redeemed</Text>
              </View>
              <View style={styles.loyaltyDivider} />
              <View style={styles.loyaltyStat}>
                <Text style={styles.loyaltyValue}>{newRate}</Text>
                <Text style={styles.loyaltyLabel}>New Customer Rate</Text>
              </View>
            </View>
          </View>

        </View>
      </Animated.ScrollView>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: "#F7F3F0" },
  scrollContent: { paddingBottom: scale(100), alignItems: "center" },

  header:   { marginBottom: scale(20) },
  title: {
    fontSize: moderateScale(28),
    fontWeight: "bold",
    fontFamily: "PlayfairDisplay_700Bold",
    color: "#1A1A1A",
    marginBottom: scale(4),
  },
  subtitle: { fontSize: moderateScale(14), color: "#666" },

  periodRow: { flexDirection: "row", gap: scale(8), marginBottom: scale(20) },
  periodPill: {
    flex: 1, paddingVertical: scale(8), borderRadius: scale(20),
    borderWidth: 1, borderColor: "#D4A373", alignItems: "center",
  },
  periodPillActive: { backgroundColor: "#D4A373" },
  periodText:       { fontSize: moderateScale(12), fontWeight: "600", color: "#D4A373" },
  periodTextActive: { color: "#FFF" },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: scale(12), marginBottom: scale(24) },
  statCard: {
    width: (contentWidth - scale(12)) / 2,
    backgroundColor: "#FFF", borderRadius: scale(16),
    padding: scale(16), borderWidth: 1, borderColor: "#E8DFD5",
  },
  statIcon: {
    width: scale(40), height: scale(40), borderRadius: scale(10),
    justifyContent: "center", alignItems: "center", marginBottom: scale(10),
  },
  statValue: { fontSize: moderateScale(22), fontWeight: "700", color: "#1A1A1A", marginBottom: scale(2) },
  statLabel: { fontSize: moderateScale(12), color: "#888" },

  section:       { marginBottom: scale(24) },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: scale(8), marginBottom: scale(12) },
  sectionTitle:  { fontSize: moderateScale(16), fontWeight: "600", color: "#1A1A1A" },

  chartContainer: {
    flexDirection: "row", alignItems: "flex-end",
    backgroundColor: "#FFF", borderRadius: scale(16),
    padding: scale(16), borderWidth: 1, borderColor: "#E8DFD5", gap: scale(4),
    minHeight: scale(110),
  },
  barGroup: { flex: 1, alignItems: "center" },
  barTrack:  { height: scale(80), justifyContent: "flex-end" },
  bar: {
    width: "100%", minWidth: scale(8),
    backgroundColor: "#F0E0D0", borderRadius: scale(4),
  },
  barPeak:  { backgroundColor: "#D4A373" },
  barLabel: { fontSize: moderateScale(9), color: "#888", marginTop: scale(4) },

  emptyCard: {
    backgroundColor: "#FFF", borderRadius: scale(16),
    padding: scale(20), borderWidth: 1, borderColor: "#E8DFD5",
    alignItems: "center",
  },
  emptyText: { color: "#AAA", fontSize: moderateScale(13), flex: 1, textAlign: "center" },

  visitorsList: { gap: scale(10) },
  visitorRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#FFF", borderRadius: scale(12),
    padding: scale(12), borderWidth: 1, borderColor: "#E8DFD5", gap: scale(12),
  },
  visitorAvatar: {
    width: scale(40), height: scale(40), borderRadius: scale(20),
    backgroundColor: "rgba(212,163,115,0.2)",
    justifyContent: "center", alignItems: "center",
  },
  visitorInitial: { fontSize: moderateScale(16), fontWeight: "600", color: "#D4A373" },
  visitorInfo:    { flex: 1 },
  visitorName:    { fontSize: moderateScale(14), fontWeight: "600", color: "#1A1A1A" },
  visitorTime:    { fontSize: moderateScale(12), color: "#888" },
  ptsBadge: {
    backgroundColor: "rgba(212,163,115,0.15)",
    paddingHorizontal: scale(8), paddingVertical: scale(4), borderRadius: scale(8),
  },
  ptsText: { fontSize: moderateScale(12), fontWeight: "600", color: "#D4A373" },

  loyaltyCard: {
    backgroundColor: "#FFF", borderRadius: scale(16),
    padding: scale(16), borderWidth: 1, borderColor: "#E8DFD5", marginBottom: scale(8),
  },
  loyaltyTitle:   { fontSize: moderateScale(15), fontWeight: "600", color: "#1A1A1A", marginBottom: scale(16) },
  loyaltyRow:     { flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
  loyaltyStat:    { alignItems: "center" },
  loyaltyValue:   { fontSize: moderateScale(20), fontWeight: "700", color: "#D4A373" },
  loyaltyLabel:   { fontSize: moderateScale(11), color: "#888", marginTop: scale(4), textAlign: "center" },
  loyaltyDivider: { width: 1, height: scale(32), backgroundColor: "#E8DFD5" },
});
