import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  Dimensions,
  Animated,
  TouchableOpacity,
} from "react-native";

import BottomNav from "../components/ui/BottomNav";
import RewardsCard from "../components/ui/RewardsCard";
import Button from "../components/ui/Button";
import { useRole } from "../context/RoleContext";

interface Reward {
  id: number;
  title: string;
  cafe: string;
  points: number;
  image: any;
  popular: boolean;
}

const initialRewards: Reward[] = [
  {
    id: 1,
    title: "Free Latte",
    cafe: "Any participating café",
    points: 500,
    image: require("../assets/latte-art.jpg"),
    popular: true,
  },
  {
    id: 2,
    title: "20% Off Order",
    cafe: "The Roastery",
    points: 300,
    image: require("../assets/cafe-1.jpg"),
    popular: false,
  },
];

// ─── Cafe-owner mock data ────────────────────────────────────────────────────
interface CafeProgram {
  id: number;
  name: string;
  description: string;
  pointsPerVisit: number;
  totalIssued: number;
  redemptions: number;
  active: boolean;
}

const cafePrograms: CafeProgram[] = [
  { id: 1, name: "Coffee Stamp Card", description: "1 stamp per purchase, free drink at 10", pointsPerVisit: 100, totalIssued: 8420, redemptions: 312, active: true },
  { id: 2, name: "Loyalty Points", description: "Earn points on every £1 spent", pointsPerVisit: 50, totalIssued: 15230, redemptions: 890, active: true },
  { id: 3, name: "Weekend Bonus", description: "2× points every Saturday & Sunday", pointsPerVisit: 200, totalIssued: 3100, redemptions: 140, active: false },
];

interface RecentRedemption {
  customer: string;
  reward: string;
  points: number;
  time: string;
}

const recentRedemptions: RecentRedemption[] = [
  { customer: "Emma W.", reward: "Free Latte", points: 500, time: "2 min ago" },
  { customer: "James K.", reward: "20% Off", points: 300, time: "14 min ago" },
  { customer: "Aisha M.", reward: "Free Latte", points: 500, time: "1 hr ago" },
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function RewardsScreen() {
  const { role } = useRole();
  const { width } = Dimensions.get("window");
  const contentWidth = Math.min(width * 0.9, 480);

  // Entry animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start();
  }, []);

  // Customer state
  const [points, setPoints] = useState(1250);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showScan, setShowScan] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [availableRewards] = useState<Reward[]>(initialRewards);

  // Cafe state
  const [programs, setPrograms] = useState<CafeProgram[]>(cafePrograms);
  const [showNewProgram, setShowNewProgram] = useState(false);
  const [newProgName, setNewProgName] = useState("");
  const [newProgDesc, setNewProgDesc] = useState("");
  const [newProgPoints, setNewProgPoints] = useState("");

  const handleAddProgram = () => {
    if (!newProgName.trim()) return;
    const newProg: CafeProgram = {
      id: programs.length + 1,
      name: newProgName.trim(),
      description: newProgDesc.trim() || "Custom loyalty program",
      pointsPerVisit: parseInt(newProgPoints) || 100,
      totalIssued: 0,
      redemptions: 0,
      active: true,
    };
    setPrograms((prev) => [...prev, newProg]);
    setNewProgName("");
    setNewProgDesc("");
    setNewProgPoints("");
    setShowNewProgram(false);
  };

  const handleRedeem = () => {
    if (!selectedReward) return;
    if (points < selectedReward.points) return;
    setPoints((prev) => prev - selectedReward.points);
    setSelectedReward(null);
  };

  const toggleProgram = (id: number) => {
    setPrograms((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p))
    );
  };

  // ── Cafe owner view ─────────────────────────────────────────────────────────
  if (role === "cafe") {
    return (
      <View style={styles.container}>
        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          <View style={[styles.content, { width: contentWidth }]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Reward Programs</Text>
              <Text style={styles.subtitle}>Manage your loyalty offerings</Text>
            </View>

            {/* Stats row */}
            <View style={styles.cafeStatsRow}>
              <View style={styles.cafeStat}>
                <Text style={styles.cafeStatNumber}>23,750</Text>
                <Text style={styles.cafeStatLabel}>Points Issued</Text>
              </View>
              <View style={styles.cafeStatDivider} />
              <View style={styles.cafeStat}>
                <Text style={styles.cafeStatNumber}>1,342</Text>
                <Text style={styles.cafeStatLabel}>Redemptions</Text>
              </View>
              <View style={styles.cafeStatDivider} />
              <View style={styles.cafeStat}>
                <Text style={styles.cafeStatNumber}>89</Text>
                <Text style={styles.cafeStatLabel}>Active Today</Text>
              </View>
            </View>

            {/* Programs */}
            <View style={styles.section}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <Text style={styles.sectionTitle}>Active Programs</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => setShowNewProgram(true)}>
                  <Text style={styles.addBtnText}>+ New</Text>
                </TouchableOpacity>
              </View>

              {programs.map((prog) => (
                <View key={prog.id} style={[styles.programCard, !prog.active && styles.programCardInactive]}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <Text style={styles.programName}>{prog.name}</Text>
                      <View style={[styles.statusBadge, prog.active ? styles.statusBadgeActive : styles.statusBadgeOff]}>
                        <Text style={[styles.statusBadgeText, prog.active ? { color: "#2E7D32" } : { color: "#888" }]}>
                          {prog.active ? "Live" : "Paused"}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.programDesc}>{prog.description}</Text>
                    <View style={{ flexDirection: "row", gap: 16, marginTop: 8 }}>
                      <Text style={styles.programStat}>↑ {prog.totalIssued.toLocaleString()} pts issued</Text>
                      <Text style={styles.programStat}>✓ {prog.redemptions} redeemed</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => toggleProgram(prog.id)} style={styles.toggleBtn}>
                    <Text style={styles.toggleBtnText}>{prog.active ? "Pause" : "Resume"}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Recent redemptions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Redemptions</Text>
              {recentRedemptions.map((r, i) => (
                <View key={i} style={styles.redemptionRow}>
                  <View style={styles.redemptionAvatar}>
                    <Text style={{ fontSize: 16 }}>☕</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.redemptionCustomer}>{r.customer}</Text>
                    <Text style={styles.redemptionReward}>{r.reward}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.redemptionPoints}>−{r.points} pts</Text>
                    <Text style={styles.redemptionTime}>{r.time}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </Animated.ScrollView>

        <BottomNav />

        {/* New Program Modal */}
        <Modal visible={showNewProgram} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>New Reward Program</Text>

              <TextInput
                placeholder="Program name (e.g. Coffee Stamp Card)"
                value={newProgName}
                onChangeText={setNewProgName}
                style={styles.newProgInput}
              />
              <TextInput
                placeholder="Description"
                value={newProgDesc}
                onChangeText={setNewProgDesc}
                style={styles.newProgInput}
                multiline
              />
              <TextInput
                placeholder="Points per visit (e.g. 100)"
                value={newProgPoints}
                onChangeText={setNewProgPoints}
                style={styles.newProgInput}
                keyboardType="numeric"
              />

              <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                <Pressable
                  style={[styles.addBtn, { flex: 1, alignItems: "center", paddingVertical: 10 }]}
                  onPress={handleAddProgram}
                >
                  <Text style={styles.addBtnText}>Create</Text>
                </Pressable>
                <Pressable style={[styles.closeBtn, { flex: 1, alignItems: "center" }]} onPress={() => setShowNewProgram(false)}>
                  <Text style={{ color: "#999", fontWeight: "500" }}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // ── Customer view ───────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        <View style={[styles.content, { width: contentWidth }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Rewards</Text>
            <Text style={styles.subtitle}>Earn & redeem across cafés</Text>
          </View>

          {/* Rewards Card */}
          <RewardsCard
            points={points}
            status="EXPLORER"
            nextReward={2000}
            description="Earn points and unlock perks"
            role={role}
            onScan={() => setShowScan(true)}
          />

          {/* Rewards List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Rewards</Text>

            {availableRewards.map((reward) => {
              const canAfford = points >= reward.points;
              return (
                <View key={reward.id} style={styles.rewardCard}>
                  <Image source={reward.image} style={styles.rewardImage} />
                  <View style={styles.rewardInfo}>
                    <Text style={styles.rewardTitle}>{reward.title}</Text>
                    <Text style={styles.rewardCafe}>{reward.cafe}</Text>
                    <Text style={styles.rewardPoints}>{reward.points} pts</Text>
                  </View>
                  <Button
                    title="Redeem"
                    size="sm"
                    variant={canAfford ? "caramel" : "outline"}
                    disabled={!canAfford}
                    onPress={() => setSelectedReward(reward)}
                  />
                </View>
              );
            })}
          </View>
        </View>
      </Animated.ScrollView>

      {/* Scan Modal */}
      <Modal visible={showScan} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {!scanSuccess ? (
              <>
                <Text style={styles.modalTitle}>Scan Café QR Code</Text>
                <View style={styles.fakeQR} />
                <Button title="Simulate Scan" onPress={() => { setPoints((p) => p + 150); setScanSuccess(true); }} />
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>+150 Points Earned 🎉</Text>
                <Button title="Close" onPress={() => { setShowScan(false); setScanSuccess(false); }} />
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Redeem Modal */}
      <Modal visible={!!selectedReward} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {selectedReward && (
              <>
                <Text style={styles.modalTitle}>Redeem {selectedReward.title}?</Text>
                <Text style={styles.modalText}>This costs {selectedReward.points} points.</Text>
                <Button title="Confirm Redemption" onPress={handleRedeem} />
              </>
            )}
            <Pressable style={styles.closeBtn} onPress={() => setSelectedReward(null)}>
              <Text style={{ color: "#999" }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F3F0",
  },

  scrollContent: {
    paddingTop: 24,
    paddingBottom: 100,
    alignItems: "center",
  },

  content: {
    alignSelf: "center",
    paddingHorizontal: 16,
  },

  header: {
    marginBottom: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    fontFamily: "PlayfairDisplay_700Bold",
    color: "#1A1A1A",
    marginBottom: 4,
  },

  subtitle: {
    color: "#666",
    fontSize: 14,
  },

  section: {
    marginTop: 24,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 16,
  },

  rewardCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },

  rewardImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },

  rewardInfo: {
    flex: 1,
    marginLeft: 12,
  },

  rewardTitle: {
    fontWeight: "600",
  },

  rewardCafe: {
    fontSize: 13,
    color: "#777",
  },

  rewardPoints: {
    marginTop: 4,
    color: "#D4A373",
    fontWeight: "600",
  },

    modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: 20, // horizontal padding only
    },

    modalCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    alignSelf: "center",            // center horizontally
    width: "100%",                  // take full width of parent overlay padding
    maxWidth: 480,                  // match contentWidth max
    },

  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },

  modalText: {
    color: "#666",
    marginBottom: 16,
  },

  fakeQR: {
    width: 160,
    height: 160,
    backgroundColor: "#EEE",
    alignSelf: "center",
    marginBottom: 20,
    borderRadius: 12,
  },

  closeBtn: {
    marginTop: 12,
    alignItems: "center",
  },

  newProgInput: {
    borderWidth: 1,
    borderColor: "#E0D8D0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 10,
    backgroundColor: "#F7F3F0",
  },

  // Cafe owner styles
  cafeStatsRow: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "space-around",
  },
  cafeStat: { alignItems: "center", flex: 1 },
  cafeStatNumber: { fontSize: 20, fontWeight: "700", color: "#2C1810" },
  cafeStatLabel: { fontSize: 11, color: "#888", marginTop: 2 },
  cafeStatDivider: { width: 1, height: 32, backgroundColor: "#E8DFD5" },

  programCard: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  programCardInactive: { opacity: 0.6 },
  programName: { fontSize: 15, fontWeight: "600", color: "#1A1A1A" },
  programDesc: { fontSize: 12, color: "#777", marginTop: 2 },
  programStat: { fontSize: 11, color: "#D4A373", fontWeight: "500" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusBadgeActive: { backgroundColor: "#E8F5E9" },
  statusBadgeOff: { backgroundColor: "#F5F5F5" },
  statusBadgeText: { fontSize: 11, fontWeight: "600" },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D4A373",
  },
  toggleBtnText: { fontSize: 12, color: "#D4A373", fontWeight: "600" },

  addBtn: {
    backgroundColor: "#D4A373",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addBtnText: { color: "#FFF", fontSize: 13, fontWeight: "600" },

  redemptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  redemptionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F7F3F0",
    justifyContent: "center",
    alignItems: "center",
  },
  redemptionCustomer: { fontSize: 14, fontWeight: "600", color: "#1A1A1A" },
  redemptionReward: { fontSize: 12, color: "#888" },
  redemptionPoints: { fontSize: 13, color: "#D4A373", fontWeight: "600" },
  redemptionTime: { fontSize: 11, color: "#BBB", marginTop: 2 },
});