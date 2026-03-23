import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
  TextInput,
  Modal,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useRole } from "../context/RoleContext";
import {
  ArrowLeft,
  Clock,
  Coffee,
  User,
  X,
  CheckCircle,
} from "lucide-react-native";
import BottomNav from "../components/ui/BottomNav";
import { scale, moderateScale } from "../utils/responsive";

type VisitItem = { name: string; price: string };

type CustomerVisit = {
  id: number;
  cafe: string;
  date: string;
  pointsEarned: number;
  spent: string;
  items: VisitItem[];
  receiptImage: any;
};

type CustomerReward = {
  id: number;
  title: string;
  cafe: string;
  points: number;
  timestamp: string;
  image: any;
};

const customerVisitHistory: CustomerVisit[] = [
  {
    id: 1,
    cafe: "The Roastery",
    date: "Today, 2:30 PM",
    pointsEarned: 50,
    spent: "$8.50",
    items: [
      { name: "Oat Latte", price: "$5.50" },
      { name: "Almond Croissant", price: "$3.00" },
    ],
    receiptImage: require("../assets/cafe-1.jpg"),
  },
  {
    id: 2,
    cafe: "Bean & Leaf",
    date: "Yesterday, 10:15 AM",
    pointsEarned: 45,
    spent: "$6.75",
    items: [
      { name: "Matcha Latte", price: "$6.75" },
    ],
    receiptImage: require("../assets/cafe-2.jpg"),
  },
  {
    id: 3,
    cafe: "Brew Culture",
    date: "Dec 18, 4:00 PM",
    pointsEarned: 60,
    spent: "$12.00",
    items: [
      { name: "Cold Brew", price: "$6.00" },
      { name: "Avocado Toast", price: "$6.00" },
    ],
    receiptImage: require("../assets/cafe-3.jpg"),
  },
  {
    id: 4,
    cafe: "The Roastery",
    date: "Dec 17, 9:00 AM",
    pointsEarned: 35,
    spent: "$5.25",
    items: [
      { name: "Espresso", price: "$3.25" },
      { name: "Butter Cookie", price: "$2.00" },
    ],
    receiptImage: require("../assets/latte-art.jpg"),
  },
  {
    id: 5,
    cafe: "Cafe Latte",
    date: "Nov 25, 11:00 AM",
    pointsEarned: 40,
    spent: "$7.50",
    items: [
      { name: "Flat White", price: "$5.00" },
      { name: "Banana Bread", price: "$2.50" },
    ],
    receiptImage: require("../assets/cafe-1.jpg"),
  },
];

const customerRewardsHistory: CustomerReward[] = [
  {
    id: 1,
    title: "Free Latte",
    cafe: "The Roastery",
    points: 500,
    timestamp: "Dec 20, 3:15 PM",
    image: require("../assets/latte-art.jpg"),
  },
  {
    id: 2,
    title: "20% Off Order",
    cafe: "The Roastery",
    points: 300,
    timestamp: "Dec 15, 1:00 PM",
    image: require("../assets/cafe-1.jpg"),
  },
  {
    id: 3,
    title: "Free Pastry",
    cafe: "Bean & Leaf",
    points: 250,
    timestamp: "Dec 10, 11:30 AM",
    image: require("../assets/cafe-2.jpg"),
  },
  {
    id: 4,
    title: "Cappuccino Discount",
    cafe: "Brew Culture",
    points: 200,
    timestamp: "Nov 28, 9:45 AM",
    image: require("../assets/cafe-3.jpg"),
  },
];

const cafeVisitHistory = [
  { id: 1, customer: "Alice", date: "Today, 2:30 PM", spent: "$8.50", pointsRedeemed: 50 },
  { id: 2, customer: "Bob", date: "Yesterday, 10:15 AM", spent: "$6.75", pointsRedeemed: 45 },
  { id: 3, customer: "Charlie", date: "Dec 18, 4:00 PM", spent: "$12.00", pointsRedeemed: 60 },
  { id: 4, customer: "David", date: "Dec 17, 9:00 AM", spent: "$5.25", pointsRedeemed: 35 },
  { id: 5, customer: "Eve", date: "Nov 25, 11:00 AM", spent: "$7.50", pointsRedeemed: 40 },
];

const cafeRewardsHistory = [
  { id: 1, reward: "Free Latte", customer: "Alice", points: 500 },
  { id: 2, reward: "20% Off Order", customer: "Bob", points: 300 },
  { id: 3, reward: "Free Pastry", customer: "Charlie", points: 250 },
  { id: 4, reward: "Cappuccino Discount", customer: "David", points: 200 },
];

const HistoryScreen = () => {
  const navigation = useNavigation<any>();
  const { role } = useRole();
  const [showAllVisits, setShowAllVisits] = useState(false);
  const [showAllRewards, setShowAllRewards] = useState(false);
  const [search, setSearch] = useState("");

  const [selectedVisit, setSelectedVisit] = useState<CustomerVisit | null>(null);
  const [selectedReward, setSelectedReward] = useState<CustomerReward | null>(null);

  const { width } = Dimensions.get("window");
  const contentWidth = Math.min(width * 0.9, 480);

  const visitHistory = role === "cafe" ? cafeVisitHistory : customerVisitHistory;
  const rewardsHistory = role === "cafe" ? cafeRewardsHistory : customerRewardsHistory;

  const stats =
    role === "cafe"
      ? {
          totalCustomers: cafeVisitHistory.length,
          totalRewards: cafeRewardsHistory.length,
          totalRevenue: cafeVisitHistory.reduce(
            (acc, v) => acc + parseFloat(v.spent.replace("$", "")),
            0
          ),
        }
      : {
          totalVisits: customerVisitHistory.length,
          cafesTried: new Set(customerVisitHistory.map((v) => v.cafe)).size,
          totalPoints: customerVisitHistory.reduce((acc, v) => acc + v.pointsEarned, 0),
        };

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

  const displayVisits = showAllVisits ? filteredVisits : visitHistory.slice(0, 3);
  const displayRewards = showAllRewards ? filteredRewards : rewardsHistory.slice(0, 3);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { alignItems: "flex-start" }]}
        showsVerticalScrollIndicator={false}
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

        {/* Content */}
        <View style={[styles.content, { width: contentWidth }]}>
          {/* Stats Section */}
          <View style={styles.statsContainer}>
            {role === "cafe" ? (
              <>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.totalCustomers}</Text>
                  <Text style={styles.statLabel}>Total Customers</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.totalRewards}</Text>
                  <Text style={styles.statLabel}>Rewards Redeemed</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>${(stats as any).totalRevenue?.toFixed(2) || "0.00"}</Text>
                  <Text style={styles.statLabel}>Total Revenue</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.totalVisits}</Text>
                  <Text style={styles.statLabel}>Total Visits</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{(stats as any).cafesTried}</Text>
                  <Text style={styles.statLabel}>Cafés Tried</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{(stats as any).totalPoints}</Text>
                  <Text style={styles.statLabel}>Total Points</Text>
                </View>
              </>
            )}
          </View>

          {/* Search (if showing all) */}
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
                        {role === "cafe" ? (visit as any).customer : (visit as any).cafe}
                      </Text>
                      <Text style={styles.itemSubtext}>{visit.date}</Text>
                      <Text style={styles.itemSpent}>Spent: {visit.spent}</Text>
                      <View style={styles.pointsBadge}>
                        <Text style={styles.pointsText}>
                          {role === "cafe" ? "-" : "+"}
                          {role === "cafe"
                            ? (visit as any).pointsRedeemed
                            : (visit as any).pointsEarned}{" "}
                          pts
                        </Text>
                      </View>
                    </View>
                    {role === "customer" && (
                      <Text style={styles.receiptHint}>View receipt →</Text>
                    )}
                  </Pressable>
                ))}
              </View>
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
                        {role === "cafe" ? (reward as any).reward : (reward as any).title}
                      </Text>
                      <Text style={styles.itemSubtext}>
                        {role === "cafe" ? (reward as any).customer : (reward as any).cafe}
                      </Text>
                      {role === "customer" && (
                        <Text style={styles.itemSubtext}>{(reward as CustomerReward).timestamp}</Text>
                      )}
                      <View style={styles.pointsBadge}>
                        <Text style={styles.pointsText}>{reward.points} pts</Text>
                      </View>
                    </View>
                    {role === "customer" && (
                      <Text style={styles.receiptHint}>Details →</Text>
                    )}
                  </Pressable>
                ))}
              </View>
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
      </ScrollView>

      <BottomNav />

      {/* Receipt Modal */}
      <Modal visible={!!selectedVisit} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {selectedVisit && (
              <>
                {/* Cafe photo */}
                <Image source={selectedVisit.receiptImage} style={styles.receiptPhoto} />

                {/* Close button */}
                <Pressable style={styles.closeBtn} onPress={() => setSelectedVisit(null)}>
                  <X size={20} color="#555" />
                </Pressable>

                <ScrollView contentContainerStyle={styles.receiptBody}>
                  {/* Receipt header */}
                  <Text style={styles.receiptCafe}>{selectedVisit.cafe}</Text>
                  <Text style={styles.receiptDate}>{selectedVisit.date}</Text>

                  <View style={styles.receiptDivider} />

                  {/* Items */}
                  {selectedVisit.items.map((item, idx) => (
                    <View key={idx} style={styles.receiptRow}>
                      <Text style={styles.receiptItemName}>{item.name}</Text>
                      <Text style={styles.receiptItemPrice}>{item.price}</Text>
                    </View>
                  ))}

                  <View style={styles.receiptDivider} />

                  {/* Total */}
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptTotalLabel}>Total</Text>
                    <Text style={styles.receiptTotalValue}>{selectedVisit.spent}</Text>
                  </View>

                  {/* Points earned */}
                  <View style={styles.pointsEarnedBadge}>
                    <Text style={styles.pointsEarnedText}>+{selectedVisit.pointsEarned} pts earned</Text>
                  </View>
                </ScrollView>
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
                {/* Cafe photo */}
                <Image source={selectedReward.image} style={styles.receiptPhoto} />

                {/* Close button */}
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
                    <Text style={styles.rewardDetailLabel}>Date & Time</Text>
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
  container: {
    flex: 1,
    backgroundColor: "#F7F3F0",
  },
  scrollContent: {
    paddingTop: scale(16),
    paddingBottom: scale(100),
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(16),
    marginBottom: scale(24),
  },
  backButton: {
    padding: scale(8),
    marginRight: scale(12),
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: "600",
    fontFamily: "PlayfairDisplay_700Bold",
    marginLeft: scale(8),
    color: "#1A1A1A",
  },
  content: {
    alignSelf: "center",
    paddingHorizontal: scale(16),
  },
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
  statValue: { fontSize: moderateScale(24), fontWeight: "700", color: "#1A1A1A" },
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
  itemTitle: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: scale(2),
  },
  itemSubtext: {
    fontSize: moderateScale(12),
    color: "#888",
    marginBottom: scale(4),
  },
  itemSpent: { fontSize: moderateScale(12), color: "#888", marginBottom: scale(6) },
  pointsBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(212, 163, 115, 0.15)",
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(8),
  },
  pointsText: { fontSize: moderateScale(12), fontWeight: "600", color: "#D4A373" },
  receiptHint: {
    fontSize: moderateScale(11),
    color: "#D4A373",
    fontWeight: "500",
    flexShrink: 0,
  },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: scale(24),
    borderTopRightRadius: scale(24),
    overflow: "hidden",
    maxHeight: "80%",
  },
  receiptPhoto: {
    width: "100%",
    height: scale(180),
    resizeMode: "cover",
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
  },
  receiptBody: {
    padding: scale(20),
  },
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
  receiptItemName: { fontSize: moderateScale(14), color: "#333" },
  receiptItemPrice: { fontSize: moderateScale(14), color: "#333", fontWeight: "500" },
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

  // Reward detail
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
