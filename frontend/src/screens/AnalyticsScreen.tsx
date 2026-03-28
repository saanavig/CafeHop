import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
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
import { moderateScale, scale } from "../utils/responsive";

import BottomNav from "../components/ui/BottomNav";
import { scale, moderateScale, deviceWidth } from "../utils/responsive";

const contentWidth = deviceWidth - 40; // 20px padding on each side

const PEAK_HOURS = [
  { label: "8am", value: 30 },
  { label: "9am", value: 65 },
  { label: "10am", value: 50 },
  { label: "11am", value: 40 },
  { label: "12pm", value: 90 },
  { label: "1pm", value: 75 },
  { label: "2pm", value: 55 },
  { label: "3pm", value: 70 },
  { label: "4pm", value: 85 },
  { label: "5pm", value: 60 },
  { label: "6pm", value: 45 },
  { label: "7pm", value: 25 },
];

const recentVisitors = [
  { name: "Sarah M.", time: "2h ago", spent: "$8.50", pts: 85 },
  { name: "Alex K.", time: "3h ago", spent: "$12.00", pts: 120 },
  { name: "Jamie L.", time: "5h ago", spent: "$6.75", pts: 68 },
  { name: "Riley P.", time: "Yesterday", spent: "$15.00", pts: 150 },
  { name: "Morgan T.", time: "Yesterday", spent: "$9.25", pts: 93 },
];

type Period = "Today" | "This Week" | "This Month";

const statsByPeriod: Record<Period, { visits: number; revenue: string; redeemed: number; newCustomers: number }> = {
  Today: { visits: 47, revenue: "$423", redeemed: 8, newCustomers: 5 },
  "This Week": { visits: 312, revenue: "$2,840", redeemed: 54, newCustomers: 28 },
  "This Month": { visits: 1248, revenue: "$11,320", redeemed: 203, newCustomers: 97 },
};

export default function AnalyticsScreen() {
  const [period, setPeriod] = useState<Period>("Today");
  const stats = statsByPeriod[period];
  const maxBar = Math.max(...PEAK_HOURS.map((h) => h.value));

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        <View style={{ width: contentWidth, alignSelf: "center" }}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Analytics</Text>
            <Text style={styles.subtitle}>Your cafe at a glance</Text>
          </View>

          {/* Period Toggle */}
          <View style={styles.periodRow}>
            {(["Today", "This Week", "This Month"] as Period[]).map((p) => (
              <Pressable
                key={p}
                style={[styles.periodPill, period === p && styles.periodPillActive]}
                onPress={() => setPeriod(p)}
              >
                <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                  {p}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: "#FFF0E6" }]}>
                <Users size={20} color="#D4A373" />
              </View>
              <Text style={styles.statValue}>{stats.visits}</Text>
              <Text style={styles.statLabel}>Visits</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: "#E8F5E9" }]}>
                <DollarSign size={20} color="#4CAF50" />
              </View>
              <Text style={styles.statValue}>{stats.revenue}</Text>
              <Text style={styles.statLabel}>Revenue</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: "#FCE4EC" }]}>
                <Gift size={20} color="#E91E63" />
              </View>
              <Text style={styles.statValue}>{stats.redeemed}</Text>
              <Text style={styles.statLabel}>Redeemed</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: "#E3F2FD" }]}>
                <TrendingUp size={20} color="#2196F3" />
              </View>
              <Text style={styles.statValue}>{stats.newCustomers}</Text>
              <Text style={styles.statLabel}>New Customers</Text>
            </View>
          </View>

          {/* Peak Hours Chart */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock size={16} color="#D4A373" />
              <Text style={styles.sectionTitle}>Peak Hours</Text>
            </View>
            <View style={styles.chartContainer}>
              {PEAK_HOURS.map((hour) => (
                <View key={hour.label} style={styles.barGroup}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.bar,
                        { height: (hour.value / maxBar) * 80 },
                        hour.value === maxBar && styles.barPeak,
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{hour.label}</Text>
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
            <View style={styles.visitorsList}>
              {recentVisitors.map((v, i) => (
                <View key={i} style={styles.visitorRow}>
                  <View style={styles.visitorAvatar}>
                    <Text style={styles.visitorInitial}>{v.name[0]}</Text>
                  </View>
                  <View style={styles.visitorInfo}>
                    <Text style={styles.visitorName}>{v.name}</Text>
                    <Text style={styles.visitorTime}>{v.time} • {v.spent}</Text>
                  </View>
                  <View style={styles.ptsBadge}>
                    <Text style={styles.ptsText}>+{v.pts} pts</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Loyalty Summary */}
          <View style={styles.loyaltyCard}>
            <Text style={styles.loyaltyTitle}>Loyalty Program</Text>
            <View style={styles.loyaltyRow}>
              <View style={styles.loyaltyStat}>
                <Text style={styles.loyaltyValue}>1,248</Text>
                <Text style={styles.loyaltyLabel}>Total Pts Given</Text>
              </View>
              <View style={styles.loyaltyDivider} />
              <View style={styles.loyaltyStat}>
                <Text style={styles.loyaltyValue}>203</Text>
                <Text style={styles.loyaltyLabel}>Rewards Redeemed</Text>
              </View>
              <View style={styles.loyaltyDivider} />
              <View style={styles.loyaltyStat}>
                <Text style={styles.loyaltyValue}>84%</Text>
                <Text style={styles.loyaltyLabel}>Return Rate</Text>
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
  container: { flex: 1, backgroundColor: "#F7F3F0" },
  scrollContent: { paddingTop: scale(50), paddingBottom: scale(100), alignItems: "center" },

  header: { marginBottom: scale(20) },
  title: {
    fontSize: moderateScale(28),
    fontWeight: "bold",
    fontFamily: "PlayfairDisplay_700Bold",
    color: "#1A1A1A",
    marginBottom: scale(4),
  },
  subtitle: { fontSize: moderateScale(14), color: "#666" },

  periodRow: {
    flexDirection: "row",
    gap: scale(8),
    marginBottom: scale(20),
  },
  periodPill: {
    flex: 1,
    paddingVertical: scale(8),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: "#D4A373",
    alignItems: "center",
  },
  periodPillActive: { backgroundColor: "#D4A373" },
  periodText: { fontSize: moderateScale(12), fontWeight: "600", color: "#D4A373" },
  periodTextActive: { color: "#FFF" },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(12),
    marginBottom: scale(24),
  },
  statCard: {
    width: (contentWidth - scale(12)) / 2,
    backgroundColor: "#FFF",
    borderRadius: scale(16),
    padding: scale(16),
    borderWidth: 1,
    borderColor: "#E8DFD5",
  },
  statIcon: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(10),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: scale(10),
  },
  statValue: { fontSize: moderateScale(22), fontWeight: "700", color: "#1A1A1A", marginBottom: scale(2) },
  statLabel: { fontSize: moderateScale(12), color: "#888" },

  section: { marginBottom: scale(24) },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: scale(8), marginBottom: scale(12) },
  sectionTitle: { fontSize: moderateScale(16), fontWeight: "600", color: "#1A1A1A" },

  chartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#FFF",
    borderRadius: scale(16),
    padding: scale(16),
    borderWidth: 1,
    borderColor: "#E8DFD5",
    gap: scale(4),
  },
  barGroup: { flex: 1, alignItems: "center" },
  barTrack: { height: scale(80), justifyContent: "flex-end" },
  bar: {
    width: "100%",
    minWidth: scale(8),
    backgroundColor: "#F0E0D0",
    borderRadius: scale(4),
  },
  barPeak: { backgroundColor: "#D4A373" },
  barLabel: { fontSize: moderateScale(9), color: "#888", marginTop: scale(4) },

  visitorsList: { gap: scale(10) },
  visitorRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: scale(12),
    padding: scale(12),
    borderWidth: 1,
    borderColor: "#E8DFD5",
    gap: scale(12),
  },
  visitorAvatar: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: "rgba(212,163,115,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  visitorInitial: { fontSize: moderateScale(16), fontWeight: "600", color: "#D4A373" },
  visitorInfo: { flex: 1 },
  visitorName: { fontSize: moderateScale(14), fontWeight: "600", color: "#1A1A1A" },
  visitorTime: { fontSize: moderateScale(12), color: "#888" },
  ptsBadge: {
    backgroundColor: "rgba(212,163,115,0.15)",
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(8),
  },
  ptsText: { fontSize: moderateScale(12), fontWeight: "600", color: "#D4A373" },

  loyaltyCard: {
    backgroundColor: "#FFF",
    borderRadius: scale(16),
    padding: scale(16),
    borderWidth: 1,
    borderColor: "#E8DFD5",
    marginBottom: scale(8),
  },
  loyaltyTitle: { fontSize: moderateScale(15), fontWeight: "600", color: "#1A1A1A", marginBottom: scale(16) },
  loyaltyRow: { flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
  loyaltyStat: { alignItems: "center" },
  loyaltyValue: { fontSize: moderateScale(20), fontWeight: "700", color: "#D4A373" },
  loyaltyLabel: { fontSize: moderateScale(11), color: "#888", marginTop: scale(4) },
  loyaltyDivider: { width: 1, height: scale(32), backgroundColor: "#E8DFD5" },
});
