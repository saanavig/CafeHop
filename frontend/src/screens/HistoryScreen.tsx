import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useRole } from "../context/RoleContext";
import {
  ArrowLeft,
  Clock,
  Coffee,
  User,
  Store,
} from "lucide-react-native";
import BottomNav from "../components/ui/BottomNav";

const customerVisitHistory = [
  {
    id: 1,
    cafe: "The Roastery",
    date: "Today, 2:30 PM",
    pointsEarned: 50,
    spent: "$8.50",
  },
  {
    id: 2,
    cafe: "Bean & Leaf",
    date: "Yesterday, 10:15 AM",
    pointsEarned: 45,
    spent: "$6.75",
  },
  {
    id: 3,
    cafe: "Brew Culture",
    date: "Dec 18, 4:00 PM",
    pointsEarned: 60,
    spent: "$12.00",
  },
  {
    id: 4,
    cafe: "The Roastery",
    date: "Dec 17, 9:00 AM",
    pointsEarned: 35,
    spent: "$5.25",
  },
  {
    id: 5,
    cafe: "Cafe Latte",
    date: "Nov 25, 11:00 AM",
    pointsEarned: 40,
    spent: "$7.50",
  },
];

const customerRewardsHistory = [
  { id: 1, title: "Free Latte", cafe: "Any participating café", points: 500 },
  { id: 2, title: "20% Off Order", cafe: "The Roastery", points: 300 },
  { id: 3, title: "Free Pastry", cafe: "Bean & Leaf", points: 250 },
  { id: 4, title: "Cappuccino Discount", cafe: "Brew Culture", points: 200 },
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
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
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
                  <Text style={styles.statValue}>
                    {stats.totalCustomers}
                  </Text>
                  <Text style={styles.statLabel}>Total Customers</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {stats.totalRewards}
                  </Text>
                  <Text style={styles.statLabel}>Rewards Redeemed</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    ${stats.totalRevenue?.toFixed(2) || "0.00"}
                  </Text>
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
                  <Text style={styles.statValue}>{stats.cafesTried}</Text>
                  <Text style={styles.statLabel}>Cafés Tried</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.totalPoints}</Text>
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
                  ? role === "cafe"
                    ? "Search customers..."
                    : "Search cafes..."
                  : role === "cafe"
                  ? "Search customers..."
                  : "Search rewards..."
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
                  <View key={visit.id} style={styles.item}>
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
                  </View>
                ))}
              </View>
              {!showAllVisits && visitHistory.length > 3 && (
                <Pressable
                  style={styles.seeMoreButton}
                  onPress={() => setShowAllVisits(true)}
                >
                  <Text style={styles.seeMoreText}>
                    {role === "cafe" ? "See All Customers" : "See More Visits"}
                  </Text>
                </Pressable>
              )}
              {showAllVisits && (
                <Pressable
                  style={styles.seeMoreButton}
                  onPress={() => {
                    setShowAllVisits(false);
                    setSearch("");
                  }}
                >
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
                  <View key={reward.id} style={styles.item}>
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
                      <View style={styles.pointsBadge}>
                        <Text style={styles.pointsText}>
                          {reward.points} pts
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
              {!showAllRewards && rewardsHistory.length > 3 && (
                <Pressable
                  style={styles.seeMoreButton}
                  onPress={() => setShowAllRewards(true)}
                >
                  <Text style={styles.seeMoreText}>
                    {role === "cafe"
                      ? "See All Rewards"
                      : "See More Rewards"}
                  </Text>
                </Pressable>
              )}
              {showAllRewards && (
                <Pressable
                  style={styles.seeMoreButton}
                  onPress={() => {
                    setShowAllRewards(false);
                    setSearch("");
                  }}
                >
                  <Text style={styles.seeMoreText}>Show Less</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fixed Bottom Nav */}
      <BottomNav role={role} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F3F0",
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    fontFamily: "PlayfairDisplay_700Bold",
    marginLeft: 8,
    color: "#1A1A1A",
  },
  content: {
    alignSelf: "center",
    paddingHorizontal: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 16,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E8DFD5",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  statLabel: {
    fontSize: 10,
    color: "#888",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#E8DFD5",
  },
  searchInput: {
    width: "100%",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E8DFD5",
    borderRadius: 12,
    fontSize: 14,
    color: "#333",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 12,
  },
  itemsList: {
    gap: 12,
  },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8DFD5",
    padding: 12,
    gap: 12,
  },
  itemIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F7F3F0",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  itemSubtext: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
  },
  itemSpent: {
    fontSize: 12,
    color: "#888",
    marginBottom: 6,
  },
  pointsBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(212, 163, 115, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#D4A373",
  },
  seeMoreButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#D4A373",
    borderRadius: 12,
    alignItems: "center",
  },
  seeMoreText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default HistoryScreen;
