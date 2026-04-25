import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Coffee,
  User,
  X,
} from "lucide-react-native";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import React, { useCallback, useState } from "react";
import { moderateScale, scale } from "../utils/responsive";

import BottomNav from "../components/ui/BottomNav";
import { supabase } from "../api/supabaseClient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useRole } from "../context/RoleContext";

type CustomerVisit = {
  id: string;
  cafe: string;
  date: string;
  pointsEarned: number;
  spent: string;
};

type CustomerReward = {
  id: string;
  title: string;
  cafe: string;
  points: number;
  timestamp: string;
};

type CafeVisit = {
  id: string;
  customer: string;
  date: string;
  spent: string;
};

type CafeReward = {
  id: string;
  reward: string;
  customer: string;
  points: number;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const HistoryScreen = () => {
  const navigation = useNavigation<any>();
  const { role } = useRole();
  const [showAllVisits, setShowAllVisits] = useState(false);
  const [showAllRewards, setShowAllRewards] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [customerVisits, setCustomerVisits] = useState<CustomerVisit[]>([]);
  const [customerRewards, setCustomerRewards] = useState<CustomerReward[]>([]);
  const [cafeVisits, setCafeVisits] = useState<CafeVisit[]>([]);
  const [cafeRewards, setCafeRewards] = useState<CafeReward[]>([]);

  const [selectedVisit, setSelectedVisit] = useState<CustomerVisit | null>(null);
  const [selectedReward, setSelectedReward] = useState<CustomerReward | null>(null);

  const { width } = Dimensions.get("window");
  const contentWidth = Math.min(width * 0.9, 480);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (role === "customer") {
        const [{ data: purchases }, { data: txns }] = await Promise.all([
          supabase
            .from("purchases")
            .select("id, amount, created_at, cafes(name)")
            .eq("user_id", user.id)
            .eq("status", "approved")
            .order("created_at", { ascending: false })
            .limit(20),
          supabase
            .from("loyalty_transactions")
            .select("id, points_change, reason, created_at, cafes(name)")
            .eq("user_id", user.id)
            .lt("points_change", 0)
            .order("created_at", { ascending: false })
            .limit(20),
        ]);

        setCustomerVisits(
          (purchases ?? []).map((p: any) => ({
            id: p.id,
            cafe: p.cafes?.name ?? "Unknown Cafe",
            date: timeAgo(p.created_at),
            pointsEarned: Math.floor(parseFloat(p.amount ?? 0)),
            spent: `$${parseFloat(p.amount ?? 0).toFixed(2)}`,
          }))
        );

        setCustomerRewards(
          (txns ?? []).map((t: any) => ({
            id: t.id,
            title: t.reason ?? "Reward Redeemed",
            cafe: t.cafes?.name ?? "Unknown Cafe",
            points: Math.abs(t.points_change ?? 0),
            timestamp: timeAgo(t.created_at),
          }))
        );
      } else {
        const { data: cafeRow } = await supabase
          .from("cafes")
          .select("id")
          .eq("owner_id", user.id)
          .maybeSingle();

        if (!cafeRow) return;
        const cafeId = cafeRow.id;

        const [{ data: purchases }, { data: txns }] = await Promise.all([
          supabase
            .from("purchases")
            .select("id, amount, created_at, profiles(first_name, last_name)")
            .eq("cafe_id", cafeId)
            .eq("status", "approved")
            .order("created_at", { ascending: false })
            .limit(20),
          supabase
            .from("loyalty_transactions")
            .select("id, points_change, reason, created_at, profiles(first_name, last_name)")
            .eq("cafe_id", cafeId)
            .lt("points_change", 0)
            .order("created_at", { ascending: false })
            .limit(20),
        ]);

        setCafeVisits(
          (purchases ?? []).map((p: any) => ({
            id: p.id,
            customer: `${p.profiles?.first_name ?? ""} ${p.profiles?.last_name ?? ""}`.trim() || "Guest",
            date: timeAgo(p.created_at),
            spent: `$${parseFloat(p.amount ?? 0).toFixed(2)}`,
          }))
        );

        setCafeRewards(
          (txns ?? []).map((t: any) => ({
            id: t.id,
            reward: t.reason ?? "Reward Redeemed",
            customer: `${t.profiles?.first_name ?? ""} ${t.profiles?.last_name ?? ""}`.trim() || "Guest",
            points: Math.abs(t.points_change ?? 0),
          }))
        );
      }
    } catch (err) {
      console.error("HistoryScreen fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [role])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData(true);
    setRefreshing(false);
  };

  const visitHistory   = role === "cafe" ? cafeVisits   : customerVisits;
  const rewardsHistory = role === "cafe" ? cafeRewards  : customerRewards;

  const filteredVisits = visitHistory.filter((v: any) =>
    role === "cafe"
      ? v.customer?.toLowerCase().includes(search.toLowerCase())
      : v.cafe?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredRewards = rewardsHistory.filter((r: any) =>
    role === "cafe"
      ? r.customer?.toLowerCase().includes(search.toLowerCase())
      : r.title?.toLowerCase().includes(search.toLowerCase())
  );

  const displayVisits  = showAllVisits  ? filteredVisits  : visitHistory.slice(0, 3);
  const displayRewards = showAllRewards ? filteredRewards : rewardsHistory.slice(0, 3);

  const stats =
    role === "cafe"
      ? {
          totalCustomers: cafeVisits.length,
          totalRewards: cafeRewards.length,
          totalRevenue: cafeVisits.reduce(
            (acc, v) => acc + parseFloat(v.spent.replace("$", "")),
            0
          ),
        }
      : {
          totalVisits: customerVisits.length,
          cafesTried: new Set(customerVisits.map((v) => v.cafe)).size,
          totalPoints: customerRewards.reduce((acc, r) => acc + r.points, 0),
        };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { alignItems: "flex-start" }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4A373" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color="#333" />
          </Pressable>
          <Text style={styles.headerTitle}>
            {role === "customer" ? "History" : "Customer Visits"}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color="#D4A373" />
          </View>
        ) : (
          <View style={[styles.content, { width: contentWidth }]}>
            {/* Stats */}
            <View style={styles.statsContainer}>
              {role === "cafe" ? (
                <>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.totalCustomers}</Text>
                    <Text style={styles.statLabel}>Customers</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.totalRewards}</Text>
                    <Text style={styles.statLabel}>Redeemed</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>${(stats as any).totalRevenue?.toFixed(2) || "0.00"}</Text>
                    <Text style={styles.statLabel}>Revenue</Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{(stats as any).totalVisits}</Text>
                    <Text style={styles.statLabel}>Total Visits</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{(stats as any).cafesTried}</Text>
                    <Text style={styles.statLabel}>Cafes Tried</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{(stats as any).totalPoints}</Text>
                    <Text style={styles.statLabel}>Pts Redeemed</Text>
                  </View>
                </>
              )}
            </View>

            {/* Search */}
            {(showAllVisits || showAllRewards) && (
              <TextInput
                style={styles.searchInput}
                placeholder={
                  showAllVisits
                    ? role === "cafe" ? "Search customers..." : "Search cafes..."
                    : role === "cafe" ? "Search customers..." : "Search rewards..."
                }
                value={search}
                onChangeText={setSearch}
                placeholderTextColor="#999"
              />
            )}

            {/* Visits Section */}
            {!showAllRewards && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {role === "cafe" ? "Recent Customers" : "Recent Visits"}
                </Text>
                {displayVisits.length === 0 ? (
                  <View style={styles.emptySection}>
                    <Text style={styles.emptyText}>
                      {role === "cafe" ? "No customer visits yet." : "No visits recorded yet."}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.itemsList}>
                    {displayVisits.map((visit) => (
                      <Pressable
                        key={visit.id}
                        style={styles.item}
                        onPress={role === "customer" ? () => setSelectedVisit(visit as CustomerVisit) : undefined}
                      >
                        <View style={styles.itemIconBg}>
                          {role === "cafe" ? (
                            <User size={16} color="#D4A373" />
                          ) : (
                            <Coffee size={16} color="#D4A373" />
                          )}
                        </View>
                        <View style={styles.itemContent}>
                          <Text style={styles.itemTitle}>
                            {role === "cafe" ? (visit as CafeVisit).customer : (visit as CustomerVisit).cafe}
                          </Text>
                          <Text style={styles.itemSubtext}>{visit.date}</Text>
                          <Text style={styles.itemSpent}>Spent: {visit.spent}</Text>
                          {role === "customer" && (
                            <View style={styles.pointsBadge}>
                              <Text style={styles.pointsText}>+{(visit as CustomerVisit).pointsEarned} pts</Text>
                            </View>
                          )}
                        </View>
                        {role === "customer" && (
                          <Text style={styles.receiptHint}>Details →</Text>
                        )}
                      </Pressable>
                    ))}
                  </View>
                )}
                {!showAllVisits && visitHistory.length > 3 && (
                  <Pressable style={styles.seeMoreButton} onPress={() => setShowAllVisits(true)}>
                    <Text style={styles.seeMoreText}>
                      {role === "cafe" ? "See All Customers" : "See More Visits"}
                    </Text>
                  </Pressable>
                )}
                {showAllVisits && (
                  <Pressable style={styles.seeMoreButton} onPress={() => { setShowAllVisits(false); setSearch(""); }}>
                    <Text style={styles.seeMoreText}>Show Less</Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* Rewards Section */}
            {!showAllVisits && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {role === "cafe" ? "Rewards Redeemed" : "Recent Rewards"}
                </Text>
                {displayRewards.length === 0 ? (
                  <View style={styles.emptySection}>
                    <Text style={styles.emptyText}>
                      {role === "cafe" ? "No rewards redeemed yet." : "No rewards redeemed yet."}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.itemsList}>
                    {displayRewards.map((reward) => (
                      <Pressable
                        key={reward.id}
                        style={styles.item}
                        onPress={role === "customer" ? () => setSelectedReward(reward as CustomerReward) : undefined}
                      >
                        <View style={styles.itemIconBg}>
                          {role === "cafe" ? (
                            <Coffee size={16} color="#D4A373" />
                          ) : (
                            <Clock size={16} color="#D4A373" />
                          )}
                        </View>
                        <View style={styles.itemContent}>
                          <Text style={styles.itemTitle}>
                            {role === "cafe" ? (reward as CafeReward).reward : (reward as CustomerReward).title}
                          </Text>
                          <Text style={styles.itemSubtext}>
                            {role === "cafe" ? (reward as CafeReward).customer : (reward as CustomerReward).cafe}
                          </Text>
                          {role === "customer" && (
                            <Text style={styles.itemSubtext}>{(reward as CustomerReward).timestamp}</Text>
                          )}
                          <View style={styles.pointsBadge}>
                            <Text style={styles.pointsText}>{(reward as any).points} pts</Text>
                          </View>
                        </View>
                        {role === "customer" && <Text style={styles.receiptHint}>Details →</Text>}
                      </Pressable>
                    ))}
                  </View>
                )}
                {!showAllRewards && rewardsHistory.length > 3 && (
                  <Pressable style={styles.seeMoreButton} onPress={() => setShowAllRewards(true)}>
                    <Text style={styles.seeMoreText}>
                      {role === "cafe" ? "See All Rewards" : "See More Rewards"}
                    </Text>
                  </Pressable>
                )}
                {showAllRewards && (
                  <Pressable style={styles.seeMoreButton} onPress={() => { setShowAllRewards(false); setSearch(""); }}>
                    <Text style={styles.seeMoreText}>Show Less</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <BottomNav />

      {/* Visit Detail Modal */}
      <Modal visible={!!selectedVisit} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {selectedVisit && (
              <>
                <Pressable style={styles.closeBtn} onPress={() => setSelectedVisit(null)}>
                  <X size={20} color="#555" />
                </Pressable>

                <View style={styles.receiptBody}>
                  <View style={styles.receiptIconRow}>
                    <Coffee size={scale(28)} color="#D4A373" />
                  </View>
                  <Text style={styles.receiptCafe}>{selectedVisit.cafe}</Text>
                  <Text style={styles.receiptDate}>{selectedVisit.date}</Text>

                  <View style={styles.receiptDivider} />

                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptTotalLabel}>Total Spent</Text>
                    <Text style={styles.receiptTotalValue}>{selectedVisit.spent}</Text>
                  </View>

                  <View style={styles.pointsEarnedBadge}>
                    <Text style={styles.pointsEarnedText}>+{selectedVisit.pointsEarned} pts earned</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Reward Detail Modal */}
      <Modal visible={!!selectedReward} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {selectedReward && (
              <>
                <Pressable style={styles.closeBtn} onPress={() => setSelectedReward(null)}>
                  <X size={20} color="#555" />
                </Pressable>

                <View style={styles.receiptBody}>
                  <View style={styles.rewardConfirmBadge}>
                    <CheckCircle size={20} color="#2E7D32" />
                    <Text style={styles.rewardConfirmText}>Redeemed</Text>
                  </View>

                  <Text style={styles.receiptCafe}>{selectedReward.title}</Text>

                  <View style={styles.rewardDetailRow}>
                    <Text style={styles.rewardDetailLabel}>Café</Text>
                    <Text style={styles.rewardDetailValue}>{selectedReward.cafe}</Text>
                  </View>
                  <View style={styles.rewardDetailRow}>
                    <Text style={styles.rewardDetailLabel}>Date</Text>
                    <Text style={styles.rewardDetailValue}>{selectedReward.timestamp}</Text>
                  </View>
                  <View style={styles.rewardDetailRow}>
                    <Text style={styles.rewardDetailLabel}>Points Used</Text>
                    <Text style={[styles.rewardDetailValue, { color: "#D4A373", fontWeight: "700" }]}>
                      {selectedReward.points} pts
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F3F0" },
  scrollContent: { paddingTop: scale(16), paddingBottom: scale(100), alignItems: "center" },
  loadingState: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: scale(80) },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(16),
    marginBottom: scale(24),
  },
  backButton: { padding: scale(8), marginRight: scale(12) },
  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: "600",
    fontFamily: "PlayfairDisplay_700Bold",
    marginLeft: scale(8),
    color: "#1A1A1A",
  },
  content: { alignSelf: "center", paddingHorizontal: scale(16) },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: scale(16),
    marginBottom: scale(24),
    borderBottomWidth: 1,
    borderBottomColor: "#E8DFD5",
  },
  statItem: { alignItems: "center" },
  statValue: { fontSize: moderateScale(22), fontWeight: "700", color: "#1A1A1A" },
  statLabel: { fontSize: moderateScale(10), color: "#888", marginTop: scale(4) },
  statDivider: { width: 1, height: scale(32), backgroundColor: "#E8DFD5" },
  searchInput: {
    width: "100%",
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    marginBottom: scale(16),
    borderWidth: 1,
    borderColor: "#E8DFD5",
    borderRadius: scale(12),
    fontSize: moderateScale(14),
    color: "#333",
  },
  section: { marginBottom: scale(24) },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: scale(12),
  },
  emptySection: {
    backgroundColor: "#FFF",
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#E8DFD5",
    padding: scale(20),
    alignItems: "center",
  },
  emptyText: { fontSize: moderateScale(13), color: "#AAA" },
  itemsList: { gap: scale(12) },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#E8DFD5",
    padding: scale(12),
    gap: scale(12),
  },
  itemIconBg: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(10),
    backgroundColor: "#F7F3F0",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: moderateScale(14), fontWeight: "600", color: "#1A1A1A", marginBottom: scale(2) },
  itemSubtext: { fontSize: moderateScale(12), color: "#888", marginBottom: scale(4) },
  itemSpent: { fontSize: moderateScale(12), color: "#888", marginBottom: scale(6) },
  pointsBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(212, 163, 115, 0.15)",
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(8),
  },
  pointsText: { fontSize: moderateScale(12), fontWeight: "600", color: "#D4A373" },
  receiptHint: { fontSize: moderateScale(11), color: "#D4A373", fontWeight: "500", flexShrink: 0 },
  seeMoreButton: {
    marginTop: scale(16),
    paddingVertical: scale(12),
    paddingHorizontal: scale(16),
    backgroundColor: "#D4A373",
    borderRadius: scale(12),
    alignItems: "center",
  },
  seeMoreText: { fontSize: moderateScale(14), fontWeight: "600", color: "#FFFFFF" },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: scale(24),
    borderTopRightRadius: scale(24),
    overflow: "hidden",
    maxHeight: "70%",
  },
  closeBtn: {
    position: "absolute",
    top: scale(12),
    right: scale(12),
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  receiptBody: { padding: scale(24) },
  receiptIconRow: { alignItems: "center", marginBottom: scale(12) },
  receiptCafe: {
    fontSize: moderateScale(20),
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: scale(4),
  },
  receiptDate: {
    fontSize: moderateScale(13),
    color: "#888",
    textAlign: "center",
    marginBottom: scale(16),
  },
  receiptDivider: {
    height: 1,
    backgroundColor: "#F0EAE4",
    marginVertical: scale(12),
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#E8DFD5",
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(8),
  },
  receiptTotalLabel: { fontSize: moderateScale(15), fontWeight: "700", color: "#1A1A1A" },
  receiptTotalValue: { fontSize: moderateScale(15), fontWeight: "700", color: "#1A1A1A" },
  pointsEarnedBadge: {
    marginTop: scale(16),
    alignSelf: "center",
    backgroundColor: "rgba(212, 163, 115, 0.15)",
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    borderRadius: scale(20),
  },
  pointsEarnedText: { fontSize: moderateScale(14), fontWeight: "700", color: "#D4A373" },

  rewardConfirmBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    alignSelf: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: scale(14),
    paddingVertical: scale(6),
    borderRadius: scale(20),
    marginBottom: scale(16),
  },
  rewardConfirmText: { fontSize: moderateScale(13), fontWeight: "600", color: "#2E7D32" },
  rewardDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: scale(12),
    borderBottomWidth: 1,
    borderBottomColor: "#F0EAE4",
  },
  rewardDetailLabel: { fontSize: moderateScale(13), color: "#888" },
  rewardDetailValue: { fontSize: moderateScale(13), color: "#1A1A1A", fontWeight: "500" },
});

export default HistoryScreen;
