//rewardscreen.tsx
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { moderateScale, scale } from "../utils/responsive";

import BottomNav from "../components/ui/BottomNav";
import Button from "../components/ui/Button";
import RewardsCard from "../components/ui/RewardsCard";
import { supabase } from "../api/supabaseClient";
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
    cafe: "Any participating cafe",
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
const API_URL = "http://127.0.0.1:3001";

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
export default function RewardsScreen({ navigation }) {
  const { role } = useRole();
  const { width } = Dimensions.get("window");
  const contentWidth = Math.min(width * 0.9, 480);
  const [earnedPoints, setEarnedPoints] = useState(0);

  // Entry animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;
  const [points, setPoints] = useState(0);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showScan, setShowScan] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);

  const handleScan = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch(`${API_URL}/purchase/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cafe_id: 1,
          amount: 10,
          latitude: 40.74,
          longitude: -74.03,
          submission_token: Date.now().toString(),
          receipt_timestamp: new Date().toISOString(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setPoints(data.total_points);
        setEarnedPoints(data.points_earned);
        setScanSuccess(true);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error("Scan error:", err);
    }
  };

  const fetchPoints = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const userId = sessionData.session?.user.id;

      const res = await fetch(`${API_URL}/api/users/me/points`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setPoints(data.points);
    } catch (err) {
      console.error("Error fetching points:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPoints();
    }, [])
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start();
  }, []);

  // Customer state
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

  const handleRedeem = async () => {
    if (!selectedReward) return;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch(`${API_URL}/redeem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cafe_id: 1, // TEMP
          points: selectedReward.points,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setPoints(data.remaining_points);
        setSelectedReward(null);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error("Redeem error:", err);
    }
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
            <Text style={styles.subtitle}>Earn & redeem across cafes</Text>
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
          <Button
            title="Upload Receipt"
            onPress={() => navigation.navigate("ReceiptUpload")}
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
                <Text style={styles.modalTitle}>Scan Cafe QR Code</Text>
                <View style={styles.fakeQR} />
                <Button title="Simulate Scan" onPress={handleScan} />
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>+{earnedPoints} Points Earned 🎉</Text>
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
    paddingTop: scale(24),
    paddingBottom: scale(100),
    alignItems: "center",
  },

  content: {
    alignSelf: "center",
    paddingHorizontal: scale(16),
  },

  header: {
    marginBottom: scale(24),
  },

  title: {
    fontSize: moderateScale(28),
    fontWeight: "bold",
    fontFamily: "PlayfairDisplay_700Bold",
    color: "#1A1A1A",
    marginBottom: scale(4),
  },

  subtitle: {
    color: "#666",
    fontSize: moderateScale(14),
  },

  section: {
    marginTop: scale(24),
  },

  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: scale(16),
  },

  rewardCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: scale(12),
    borderRadius: scale(16),
    marginBottom: scale(12),
  },

  rewardImage: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(12),
  },

  rewardInfo: {
    flex: 1,
    marginLeft: scale(12),
  },

  rewardTitle: {
    fontWeight: "600",
  },

  rewardCafe: {
    fontSize: moderateScale(13),
    color: "#777",
  },

  rewardPoints: {
    marginTop: scale(4),
    color: "#D4A373",
    fontWeight: "600",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: scale(20),
  },

  modalCard: {
    backgroundColor: "#FFF",
    borderRadius: scale(16),
    padding: scale(20),
    alignSelf: "center",
    width: "100%",
    maxWidth: 480,
  },

  modalTitle: {
    fontSize: moderateScale(18),
    fontWeight: "600",
    marginBottom: scale(12),
  },

  modalText: {
    color: "#666",
    marginBottom: scale(16),
  },

  fakeQR: {
    width: scale(160),
    height: scale(160),
    backgroundColor: "#EEE",
    alignSelf: "center",
    marginBottom: scale(20),
    borderRadius: scale(12),
  },

  closeBtn: {
    marginTop: scale(12),
    alignItems: "center",
  },

  newProgInput: {
    borderWidth: 1,
    borderColor: "#E0D8D0",
    borderRadius: scale(10),
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    fontSize: moderateScale(14),
    marginBottom: scale(10),
    backgroundColor: "#F7F3F0",
  },

  // Cafe owner styles
  cafeStatsRow: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: scale(16),
    padding: scale(16),
    marginBottom: scale(8),
    alignItems: "center",
    justifyContent: "space-around",
  },
  cafeStat: { alignItems: "center", flex: 1 },
  cafeStatNumber: { fontSize: moderateScale(20), fontWeight: "700", color: "#2C1810" },
  cafeStatLabel: { fontSize: moderateScale(11), color: "#888", marginTop: scale(2) },
  cafeStatDivider: { width: 1, height: scale(32), backgroundColor: "#E8DFD5" },

  programCard: {
    backgroundColor: "#FFF",
    borderRadius: scale(14),
    padding: scale(14),
    marginBottom: scale(10),
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
  },
  programCardInactive: { opacity: 0.6 },
  programName: { fontSize: moderateScale(15), fontWeight: "600", color: "#1A1A1A" },
  programDesc: { fontSize: moderateScale(12), color: "#777", marginTop: scale(2) },
  programStat: { fontSize: moderateScale(11), color: "#D4A373", fontWeight: "500" },
  statusBadge: { paddingHorizontal: scale(8), paddingVertical: scale(2), borderRadius: scale(10) },
  statusBadgeActive: { backgroundColor: "#E8F5E9" },
  statusBadgeOff: { backgroundColor: "#F5F5F5" },
  statusBadgeText: { fontSize: moderateScale(11), fontWeight: "600" },
  toggleBtn: {
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: "#D4A373",
  },
  toggleBtnText: { fontSize: moderateScale(12), color: "#D4A373", fontWeight: "600" },

  addBtn: {
    backgroundColor: "#D4A373",
    paddingHorizontal: scale(14),
    paddingVertical: scale(6),
    borderRadius: scale(20),
  },
  addBtnText: { color: "#FFF", fontSize: moderateScale(13), fontWeight: "600" },

  redemptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
    paddingVertical: scale(10),
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  redemptionAvatar: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: "#F7F3F0",
    justifyContent: "center",
    alignItems: "center",
  },
  redemptionCustomer: { fontSize: moderateScale(14), fontWeight: "600", color: "#1A1A1A" },
  redemptionReward: { fontSize: moderateScale(12), color: "#888" },
  redemptionPoints: { fontSize: moderateScale(13), color: "#D4A373", fontWeight: "600" },
  redemptionTime: { fontSize: moderateScale(11), color: "#BBB", marginTop: scale(2) },
});