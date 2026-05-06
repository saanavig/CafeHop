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
import { moderateScale, scale } from "../utils/responsive";

import BottomNav from "../components/ui/BottomNav";
import Button from "../components/ui/Button";
import QRCode from "react-native-qrcode-svg";
// import { TextInput as RNTextInput } from "react-native";
import RewardsCard from "../components/ui/RewardsCard";
import { supabase } from "../api/supabaseClient";
import { useFocusEffect } from "@react-navigation/native";
import { useRole } from "../context/RoleContext";

interface Reward {
  id: string;
  title: string;
  cafe: string;
  points: number;
  image: any;
  popular: boolean;
}

const TIER_CONFIG = [
  { name: "bronze", min: 0 },
  { name: "silver", min: 1000 },
  { name: "gold", min: 3000 },
  { name: "platinum", min: 7000 },
];

const getTierData = (points: number) => {
  for (let i = TIER_CONFIG.length - 1; i >= 0; i--) {
    if (points >= TIER_CONFIG[i].min) {
      return {
        tier: TIER_CONFIG[i].name,
        current: TIER_CONFIG[i].min,
        next: TIER_CONFIG[i + 1]?.min ?? TIER_CONFIG[i].min + 3000,
      };
    }
  }
  return { tier: "bronze", current: 0, next: 1000 };
};

// ─── Cafe-owner mock data ────────────────────────────────────────────────────
// interface CafeProgram {
//   id: number;
//   name: string;
//   description: string;
//   pointsPerVisit: number;
//   totalIssued: number;
//   redemptions: number;
//   active: boolean;
// }

// const cafePrograms: CafeProgram[] = [
//   { id: 1, name: "Coffee Stamp Card", description: "1 stamp per purchase, free drink at 10", pointsPerVisit: 100, totalIssued: 8420, redemptions: 312, active: true },
//   { id: 2, name: "Loyalty Points", description: "Earn points on every £1 spent", pointsPerVisit: 50, totalIssued: 15230, redemptions: 890, active: true },
//   { id: 3, name: "Weekend Bonus", description: "2× points every Saturday & Sunday", pointsPerVisit: 200, totalIssued: 3100, redemptions: 140, active: false },
// ];
const API_URL = process.env.EXPO_PUBLIC_API_URL;
// interface RecentRedemption {
//   customer: string;
//   reward: string;
//   points: number;
//   time: string;
// }

// const recentRedemptions: RecentRedemption[] = [
//   { customer: "Emma W.", reward: "Free Latte", points: 500, time: "2 min ago" },
//   { customer: "James K.", reward: "20% Off", points: 300, time: "14 min ago" },
//   { customer: "Aisha M.", reward: "Free Latte", points: 500, time: "1 hr ago" },
// ];

// ─── Component ───────────────────────────────────────────────────────────────
export default function RewardsScreen({ navigation }) {
  const { role } = useRole();
  const { width } = Dimensions.get("window");
  const contentWidth = Math.min(width * 0.9, 480);
  // const [earnedPoints, setEarnedPoints] = useState(0);
  const [tier, setTier] = useState("bronze");
  const [catalogRewards, setCatalogRewards] = useState<Reward[]>([]);
  // const [transactions, setTransactions] = useState<{ id: string; points_change: number; reason: string; created_at: string }[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const toastAnim = useRef(new Animated.Value(-scale(80))).current;
  const [showQR, setShowQR] = useState(false);
  const searchRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const [selectedCafe, setSelectedCafe] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [showCafePicker, setShowCafePicker] = useState(false);
  const [cafeSearch, setCafeSearch] = useState("");
  const [cafes, setCafes] = useState<{ id: string; name: string }[]>([]);

  const getTier = (points: number): string => {
    if (points >= 7000) return "platinum";
    if (points >= 3000) return "gold";
    if (points >= 1000) return "silver";
    return "bronze";
  };
  const [showNewProgram, setShowNewProgram] = useState(false);
  const [newProgName, setNewProgName] = useState("");
  const [newProgDesc, setNewProgDesc] = useState("");
  const [newProgPoints, setNewProgPoints] = useState("");  
  const [programs, setPrograms] = useState<any[]>([]);
  const [deleteRewardId, setDeleteRewardId] = useState<string | null>(null);
  const [deleteRewardName, setDeleteRewardName] = useState("");

  const [recentRedemptions, setRecentRedemptions] = useState<any[]>([]);
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);

  const [analytics, setAnalytics] = useState({
    points_issued: 0,
    redemptions: 0,
    active_today: 0,
  });

  // const tierData = getTierData(points);

  const showToast = (message: string, type: "success" | "error" = "error") => {
    setToast({ message, type });
    Animated.spring(toastAnim, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
    setTimeout(() => {
      Animated.timing(toastAnim, { toValue: -scale(80), duration: 280, useNativeDriver: true }).start(() =>
        setToast(null)
      );
    }, 3000);
  };

  const filteredCafes = cafes.filter((cafe) =>
    cafe.name.toLowerCase().includes(cafeSearch.toLowerCase())
  );

  // Entry animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;
  const [points, setPoints] = useState(0);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [ownerCafeId, setOwnerCafeId] = useState<string | null>(null);

  const fetchTierAndCatalog = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) return;

      const { data: catalogData } = selectedCafe
      ? await supabase
          .from("rewards")
          .select("id, points_required, cafe_id, active, title")
          .eq("active", true)
          .eq("cafe_id", selectedCafe.id)
          .order("points_required")
      : { data: [] };

      // if (loyaltyData?.tier) setTier(loyaltyData.tier);
      // if (txData) setTransactions(txData);

      setCatalogRewards(
        (catalogData || []).map((r: any, i: number) => ({
          id: r.id,
          title: r.title,
          cafe: r.cafes?.name || selectedCafe?.name || "",
          points: r.points_required,
          image: require("../assets/latte-art.jpg"),
          popular: i === 0,
        }))
      );

      console.log("Selected cafe:", selectedCafe);
      console.log("Catalog raw:", catalogData);
  
      console.log("Catalog processed:", catalogRewards);
    } catch (err) {
      console.error("fetchTierAndCatalog error:", err);
    }
  };

  const redeemReward = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch(`${API_URL}/api/redeem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reward_id: String(selectedReward?.id),
          cafe_id: String(selectedCafe?.id),
          submission_token: `${Date.now()}-${Math.random().toString(36).substring(2)}`,
          timestamp: Date.now(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Failed to redeem");
        return;
      }

      showToast("Reward redeemed!", "success");

      setSelectedReward(null);
      setShowQR(false);

      // navigation.navigate("RedemptionSuccess", {
      //   reward: selectedReward,
      //   cafe: selectedCafe,
      // });

      fetchPoints();
      fetchTierAndCatalog();

    } catch (err) {
      console.error(err);
      showToast("Something went wrong");
    }
  };

  const fetchPoints = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch(`${API_URL}/api/users/me/points`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Error fetching points:", data);
        return;
      }

      const pts = data.points ?? 0;
      setPoints(pts);

      const computedTier = getTier(pts);
      setTier(computedTier);

    } catch (err) {
      console.error("Fetch points error:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPoints();

      if (role === "cafe") {
        fetchOwnerCafe();
      } else {
        fetchCafes();
      }
    }, [role])
  );

  useEffect(() => {
    if (!ownerCafeId) return;

    fetchAnalytics(ownerCafeId);
    fetchOwnerRewards(ownerCafeId);
    fetchRecentRedemptions(ownerCafeId);

  }, [ownerCafeId]);

  useEffect(() => {
    if (selectedCafe) {
      fetchTierAndCatalog();
    } else {
      setCatalogRewards([]);
    }
  }, [selectedCafe]);
  // useEffect(() => {
  //   if (selectedCafe) {
  //     fetchTierAndCatalog();
  //   }
  // }, [selectedCafe]);

  const fetchCafes = async () => {
    try {
      const { data, error } = await supabase
        .from("cafes")
        .select("id, name")
        .order("name");

      if (error) {
        console.error("Error fetching cafes:", error);
        return;
      }

      setCafes(data || []);

      // if (data && data.length > 0 && !selectedCafe) {
      //   setSelectedCafe(data[0]);
      // }

    } catch (err) {
      console.error("Fetch cafes error:", err);
    }
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start();
  }, []);


  useEffect(() => {
    if (showCafePicker) {
      setTimeout(() => {
      if (searchRef.current) {
        searchRef.current.focus();
      }
    }, 100);
    }
  }, [showCafePicker]);

  // Customer state
  // const [availableRewards] = useState<Reward[]>(initialRewards);

  // Cafe state
  // const [programs, setPrograms] = useState<CafeProgram[]>(cafePrograms);

  const fetchOwnerCafe = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) return;

      const { data, error } = await supabase
        .from("cafes")
        .select("id, name")
        .eq("owner_id", userId)
        .single();

      if (error) {
        console.error("Fetch owner cafe error:", error);
        return;
      }

      setOwnerCafeId(data.id);

    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnalytics = async (cafeId: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch(
        `${API_URL}/api/cafes/${cafeId}/analytics`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        return;
      }

      setAnalytics(data);

    } catch (err) {
      console.error(err);
    }
  };

  const fetchOwnerRewards = async (cafeId: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch(
        `${API_URL}/api/cafes/${cafeId}/owner/rewards`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        return;
      }

      setPrograms(data.rewards || []);

    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecentRedemptions = async (cafeId: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch(
        `${API_URL}/api/cafes/${cafeId}/recent-redemptions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        return;
      }

      setRecentRedemptions(data.redemptions || []);

    } catch (err) {
      console.error(err);
    }
  };

  // const handleAddProgram = () => {
  //   if (!newProgName.trim()) return;
  //   // const newProg: CafeProgram = {
  //   //   id: programs.length + 1,
  //   //   name: newProgName.trim(),
  //   //   description: newProgDesc.trim() || "Custom loyalty program",
  //   //   pointsPerVisit: parseInt(newProgPoints) || 100,
  //   //   totalIssued: 0,
  //   //   redemptions: 0,
  //   //   active: true,
  //   // };
  //   setPrograms((prev) => [...prev, newProg]);
  //   setNewProgName("");
  //   setNewProgDesc("");
  //   setNewProgPoints("");
  //   setShowNewProgram(false);
  // };
  
  const handleAddProgram = async () => {
    try {
      if (!ownerCafeId) {
        showToast("Cafe not found");
        return;
      }

      if (!newProgName.trim()) {
        showToast("Program name required");
        return;
      }

      if (!newProgPoints.trim()) {
        showToast("Points required");
        return;
      }

      const pointsRequired = parseInt(newProgPoints);

      if (isNaN(pointsRequired) || pointsRequired <= 0) {
        showToast("Invalid points value");
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      // ─── EDIT MODE ───
      if (editingRewardId) {
        const res = await fetch(
          `${API_URL}/api/rewards/${editingRewardId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              title: newProgName.trim(),
              description: newProgDesc.trim(),
              points_required: pointsRequired,
            }),
          }
        );

        const data = await res.json();

        if (!res.ok) {
          showToast(data.error || "Failed to update reward");
          return;
        }

        showToast("Reward updated!", "success");
      }

      // ─── CREATE MODE ───
      else {
        const res = await fetch(
          `${API_URL}/api/cafes/${ownerCafeId}/rewards`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              title: newProgName.trim(),
              description: newProgDesc.trim(),
              points_required: pointsRequired,
            }),
          }
        );

        const data = await res.json();

        if (!res.ok) {
          showToast(data.error || "Failed to create reward");
          return;
        }

        showToast("Reward created!", "success");
      }

      // reset modal state
      setEditingRewardId(null);
      setNewProgName("");
      setNewProgDesc("");
      setNewProgPoints("");
      setShowNewProgram(false);

      fetchOwnerRewards(ownerCafeId);

    } catch (err) {
      console.error(err);
      showToast("Something went wrong");
    }
  };

  const handleRedeem = () => {
    setShowQR(true);
  };

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();
      const id = data.session?.user.id;
      setUserId(id ?? null);
    };
    getUser();
  }, []);

  const generateQRValue = () => {
    if (!selectedReward || !selectedCafe || !userId) return "";

    return JSON.stringify({
      user_id: userId,
      cafe_id: selectedCafe.id,
      reward_id: selectedReward.id,
      submission_token: `${Date.now()}-${Math.random().toString(36).substring(2)}`,
      timestamp: Date.now(),
    });
  };

  const toggleProgram = async (rewardId: string, currentActive: boolean) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      console.log("API_URL =", API_URL);
      console.log("Reward ID =", rewardId);
      console.log("PATCH URL =", `${API_URL}/api/rewards/${rewardId}`);

      const res = await fetch(
        `${API_URL}/api/rewards/${rewardId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            active: !currentActive,
          }),
        }
      );

      if (!res.ok) {
        console.error(await res.json());
        return;
      }

      if (ownerCafeId) {
        fetchOwnerRewards(ownerCafeId);
      }

    } catch (err) {
      console.error(err);
    }
  };

  const deleteReward = async (rewardId: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch(
        `${API_URL}/api/rewards/${rewardId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Failed to delete");
        return;
      }

      showToast("Reward deleted", "success");

      if (ownerCafeId) {
        fetchOwnerRewards(ownerCafeId);
      }

    } catch (err) {
      console.error(err);
      showToast("Something went wrong");
    }
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
            <Text style={styles.title}>Reward Manager</Text>
            <Text style={styles.subtitle}>Create and manage cafe rewards</Text>
          </View>

          {/* QR Scanner Button */}
          <Button
            title="Scan Customer QR"
            onPress={() => navigation.navigate("CafeQRScanner")}
          />

          {/* Stats row */}
          <View style={[styles.cafeStatsRow, { marginTop: scale(16) }]}>
            <View style={styles.cafeStat}>
              <Text style={styles.cafeStatNumber}>
                {analytics.points_issued.toLocaleString()}
              </Text>
              <Text style={styles.cafeStatLabel}>Points Issued</Text>
            </View>
            <View style={styles.cafeStatDivider} />
            <View style={styles.cafeStat}>
              <Text style={styles.cafeStatNumber}>
                {analytics.redemptions.toLocaleString()}
              </Text>
              <Text style={styles.cafeStatLabel}>Redemptions</Text>
            </View>
            <View style={styles.cafeStatDivider} />
            <View style={styles.cafeStat}>
              <Text style={styles.cafeStatNumber}>
                {analytics.active_today}
              </Text>
              <Text style={styles.cafeStatLabel}>Active Today</Text>
            </View>
          </View>

          {/* Programs */}
          <View style={styles.section}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text style={styles.sectionTitle}>Reward Catalog</Text>

              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setShowNewProgram(true)}
              >
                <Text style={styles.addBtnText}>+ New</Text>
              </TouchableOpacity>
            </View>

            {programs.map((prog) => (
              <View
                key={prog.id}
                style={[
                  styles.programCard,
                  !prog.active && styles.programCardInactive,
                ]}
              >
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <Text style={styles.programName}>{prog.title}</Text>

                    <View
                      style={[
                        styles.statusBadge,
                        prog.active
                          ? styles.statusBadgeActive
                          : styles.statusBadgeOff,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          prog.active
                            ? { color: "#2E7D32" }
                            : { color: "#888" },
                        ]}
                      >
                        {prog.active ? "Live" : "Paused"}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.programDesc}>{prog.description || "Cafe Reward"}</Text>

                  <View style={{ flexDirection: "row", gap: 16, marginTop: 8 }}>
                    <Text style={styles.programStat}>
                      {prog.points_required} pts required
                    </Text>
                    <Text style={styles.programStat}>
                      {prog.active ? "Active reward" : "Paused reward"}
                    </Text>
                  </View>
                </View>

                <View style={{ gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => toggleProgram(prog.id, prog.active)}
                    style={[
                      styles.toggleBtn,
                      !prog.active && styles.resumeBtn,
                    ]}
                  >
                    <Text
                      style={[
                        styles.toggleBtnText,
                        !prog.active && styles.resumeBtnText,
                      ]}
                    >
                      {prog.active ? "Pause" : "Resume"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setEditingRewardId(prog.id);
                      setNewProgName(prog.title);
                      setNewProgDesc(prog.description || "");
                      setNewProgPoints(String(prog.points_required));
                      setShowNewProgram(true);
                    }}
                    style={styles.editBtn}
                  >
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setDeleteRewardId(prog.id);
                      setDeleteRewardName(prog.title);
                    }}
                    style={styles.deleteBtn}
                  >
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
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
            <Text style={styles.modalTitle}>
              {editingRewardId ? "Edit Reward" : "New Reward Program"}
            </Text>
  
            <TextInput
              placeholder="Program name"
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
              placeholder="Points Required"
              value={newProgPoints}
              onChangeText={setNewProgPoints}
              style={styles.newProgInput}
              keyboardType="numeric"
            />

            <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
              <Pressable
                style={[
                  styles.addBtn,
                  { flex: 1, alignItems: "center", paddingVertical: 10 },
                ]}
                onPress={handleAddProgram}
              >
                <Text style={styles.addBtnText}>
                  {editingRewardId ? "Save" : "Create"}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.closeBtn, { flex: 1, alignItems: "center" }]}
                onPress={() => setShowNewProgram(false)}
              >
                <Text style={{ color: "#999", fontWeight: "500" }}>
                  Cancel
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!deleteRewardId}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalCard}>
            <Text style={styles.modalTitle}>
              Delete Reward?
            </Text>

            <Text style={styles.confirmText}>
              Are you sure you want to delete{" "}
              <Text style={{ fontWeight: "700" }}>
                {deleteRewardName}
              </Text>
              ?
            </Text>

            <Text style={styles.confirmSubtext}>
              This action cannot be undone.
            </Text>

            <View style={styles.confirmBtnRow}>
              <Pressable
                style={styles.cancelDeleteBtn}
                onPress={() => {
                  setDeleteRewardId(null);
                  setDeleteRewardName("");
                }}
              >
                <Text style={styles.cancelDeleteText}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={styles.confirmDeleteBtn}
                onPress={async () => {
                  if (!deleteRewardId) return;

                  await deleteReward(deleteRewardId);

                  setDeleteRewardId(null);
                  setDeleteRewardName("");
                }}
              >
                <Text style={styles.confirmDeleteText}>
                  Delete
                </Text>
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
          {(() => {
            const tierData = getTierData(points);

            const TIER_STYLES: Record<string, { label: string; themeColor: "caramel" | "gold" }> = {
              bronze: { label: "BRONZE", themeColor: "caramel" },
              silver: { label: "SILVER", themeColor: "caramel" },
              gold: { label: "GOLD", themeColor: "gold" },
              platinum: { label: "PLATINUM", themeColor: "gold" },
            };

            const tierStyle = TIER_STYLES[tierData.tier];

            return (
              <RewardsCard
                points={points - tierData.current}
                status={tierStyle.label}
                nextReward={tierData.next - tierData.current}
                themeColor={tierStyle.themeColor}
                description="Earn points and unlock perks"
                role={role}
              />
            );
          })()}
          <Button
            title="Upload Receipt"
            onPress={() => navigation.navigate("ReceiptUpload")}
          />

          {/* ─── SELECT CAFE (CUSTOMER ONLY) ─── */}
          <TouchableOpacity
              style={styles.cafeSelector}
              onPress={() => setShowCafePicker(true)}
            >

            <Text style={styles.cafeSelectorText}>
              {selectedCafe ? selectedCafe.name : "Select a cafe"}
            </Text>
          </TouchableOpacity>


          {/* Transaction History */}
          {/* {transactions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Points History</Text>
              {transactions.map((tx) => {
                const timeAgo = (d: string) => {
                  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
                  if (mins < 60) return `${mins}m ago`;
                  const hrs = Math.floor(mins / 60);
                  if (hrs < 24) return `${hrs}h ago`;
                  return `${Math.floor(hrs / 24)}d ago`;
                };
                const positive = tx.points_change >= 0;
                return (
                  <View key={tx.id} style={styles.txRow}>
                    <View style={[styles.txDot, { backgroundColor: positive ? "#E8F5E9" : "#FCE4EC" }]}>
                      <Text style={{ fontSize: moderateScale(14) }}>{positive ? "+" : "−"}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.txReason} numberOfLines={1}>
                        {tx.reason || (positive ? "Points earned" : "Points spent")}
                      </Text>
                      <Text style={styles.txTime}>{timeAgo(tx.created_at)}</Text>
                    </View>
                    <Text style={[styles.txPoints, { color: positive ? "#2E7D32" : "#C62828" }]}>
                      {positive ? "+" : ""}{tx.points_change} pts
                    </Text>
                  </View>
                );
              })}
            </View>
          )} */}

          {/* Rewards List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Rewards</Text>

            {!selectedCafe ? (
              <Text style={{ color: "#777" }}>
                Select a cafe to view rewards
              </Text>
            ) : catalogRewards.length === 0 ? (
              <Text style={{ color: "#777" }}>
                No rewards available for this cafe.
              </Text>
            ) : (
              catalogRewards.map((reward) => {
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
                      variant={canAfford && selectedCafe ? "caramel" : "outline"}
                      disabled={!canAfford || !selectedCafe}
                      onPress={() => {
                        if (!selectedCafe) return;
                        setSelectedReward(reward);
                        setShowQR(false);
                      }}
                  />
                </View>
              );
            })
            )}
          </View>
        </View>
      </Animated.ScrollView>

      {/* Redeem Modal */}
      <Modal visible={!!selectedReward || showQR} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>

            {/* ─── HEADER ─── */}
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <Text style={styles.modalTitle}>Show this to cafe</Text>
              <Text style={styles.modalSubtitle}>
                Present this QR code to redeem your reward
              </Text>
            </View>

            {/* ─── REWARD INFO ─── */}
            {selectedReward && (
              <View style={styles.rewardPreview}>
                <Image source={selectedReward.image} style={styles.rewardPreviewImage} />
                <View>
                  <Text style={styles.rewardPreviewTitle}>{selectedReward.title}</Text>
                  <Text style={styles.rewardPreviewCafe}>{selectedReward.cafe}</Text>
                  <Text style={styles.rewardPreviewPoints}>{selectedReward.points} pts</Text>
                </View>
              </View>
            )}

            {!showQR ? (
              <>
                <Button title="Confirm Redemption" onPress={() => setShowQR(true)} />
              </>
            ) : (
              <>
              {/* ─── QR CODE ─── */}
              {/* <View style={styles.qrContainer}>
                {generateQRValue() !== "" && (
                  <QRCode value={generateQRValue()} size={180} />
                )}

                <Button
                  title="Complete Redemption"
                  onPress={redeemReward}
                />
              </View> */}

              {showQR && (
                <>
                  <View style={styles.qrContainer}>
                    <QRCode value={generateQRValue()} size={180} />
                  </View>

                  <Button title="Reward Redeemed" onPress={redeemReward} />
                </>
              )}
              </>
            )}

            {/* ─── BUTTONS ─── */}
            <Button
              title="Done"
              onPress={() => {
                setSelectedReward(null);
                setShowQR(false);
              }}
            />

            <Pressable
              style={styles.closeBtn}
              onPress={() => {
                setSelectedReward(null);
                setShowQR(false);
              }}
            >
              <Text style={{ color: "#999" }}>Close</Text>
            </Pressable>

          </View>
        </View>
      </Modal>

      <Modal visible={showCafePicker} transparent animationType="fade">
              <View style={styles.modalOverlay}>
                <View style={styles.modalCard}>

                  <Text style={styles.modalTitle}>Select a Cafe</Text>

                  <TextInput
                    ref={searchRef}
                    placeholder="Search cafes..."
                    value={cafeSearch}
                    onChangeText={setCafeSearch}
                    style={styles.searchInput}
                  />

                  <ScrollView style={{ maxHeight: 300 }}>
                    {filteredCafes.map((cafe) => (
                      <TouchableOpacity
                        key={cafe.id}
                        style={styles.cafeOption}
                        onPress={() => {
                          setSelectedCafe(cafe);
                          setShowCafePicker(false);
                          setCafeSearch("");
                        }}
                      >
                        <Text style={styles.cafeOptionText}>{cafe.name}</Text>
                      </TouchableOpacity>
                    ))}

                    {filteredCafes.length === 0 && (
                      <Text style={{ color: "#777", textAlign: "center", marginTop: 20 }}>
                        No cafes found
                      </Text>
                    )}
                  </ScrollView>

                  <Pressable
                    style={styles.closeBtn}
                    onPress={() => {
                      setShowCafePicker(false);
                      setCafeSearch("");
                    }}
                  >
                    <Text style={{ color: "#999" }}>Cancel</Text>
                  </Pressable>

                  {/* {cafeSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setCafeSearch("")}>
                      <Text style={{ color: "#D4A373", marginBottom: 10 }}>Clear</Text>
                    </TouchableOpacity>
                  )} */}

                </View>
              </View>
      </Modal>

      <BottomNav />

      {/* Toast */}
      {toast && (
        <Animated.View
          style={[
            styles.toast,
            toast.type === "success" && styles.toastSuccess,
            { transform: [{ translateY: toastAnim }] },
          ]}
        >
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}
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
  programCardInactive: {
    backgroundColor: "#FAF7F4",
  },
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

  txRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
    backgroundColor: "#FFF",
    borderRadius: scale(12),
    padding: scale(12),
    marginBottom: scale(8),
  },
  txDot: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    alignItems: "center",
    justifyContent: "center",
  },
  txReason: { fontSize: moderateScale(13), fontWeight: "500", color: "#1A1A1A" },
  txTime:   { fontSize: moderateScale(11), color: "#AAA", marginTop: scale(2) },
  txPoints: { fontSize: moderateScale(13), fontWeight: "700" },

  toast: {
    position: "absolute",
    top: scale(52),
    left: scale(16),
    right: scale(16),
    backgroundColor: "#C62828",
    borderRadius: scale(12),
    paddingVertical: scale(12),
    paddingHorizontal: scale(16),
    zIndex: 1000,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.18,
    shadowRadius: scale(8),
  },
  toastSuccess: { backgroundColor: "#2E7D32" },
  toastText: {
    color: "#FFF",
    fontSize: moderateScale(13),
    fontWeight: "600",
    textAlign: "center",
  },

  modalSubtitle: {
    color: "#777",
    fontSize: moderateScale(13),
    textAlign: "center",
    marginTop: 4,
  },

  rewardPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
    backgroundColor: "#F7F3F0",
    padding: scale(12),
    borderRadius: scale(12),
    marginBottom: scale(16),
  },

  rewardPreviewImage: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(10),
  },

  rewardPreviewTitle: {
    fontWeight: "600",
    fontSize: moderateScale(14),
  },

  rewardPreviewCafe: {
    fontSize: moderateScale(12),
    color: "#777",
  },

  rewardPreviewPoints: {
    fontSize: moderateScale(12),
    color: "#D4A373",
    fontWeight: "600",
    marginTop: 2,
  },

  qrContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    padding: scale(16),
    borderRadius: scale(16),
    marginBottom: scale(20),

    // subtle shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },

  cafeChip: {
    paddingHorizontal: scale(14),
    paddingVertical: scale(8),
    borderRadius: scale(20),
    backgroundColor: "#EEE",
    marginRight: scale(10),
  },

  cafeChipSelected: {
    backgroundColor: "#D4A373",
  },

  cafeChipText: {
    fontSize: moderateScale(13),
    color: "#555",
    fontWeight: "500",
  },

  cafeSelector: {
    backgroundColor: "#FFF",
    padding: scale(14),
    borderRadius: scale(14),
    marginTop: scale(16),
    borderWidth: 1,
    borderColor: "#E5DED8",
  },

  cafeSelectorText: {
    fontSize: moderateScale(14),
    color: "#444",
  },

  cafeOption: {
    paddingVertical: scale(12),
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },

  cafeOptionText: {
    fontSize: moderateScale(14),
    color: "#1A1A1A",
  },

  searchInput: {
    borderWidth: 1,
    borderColor: "#E5DED8",
    borderRadius: scale(10),
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    marginBottom: scale(12),
    fontSize: moderateScale(14),
    backgroundColor: "#F7F3F0",
  },
  editBtn: {
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: "#5C6BC0",
    alignItems: "center",
  },
  editBtnText: {
    fontSize: moderateScale(12),
    color: "#5C6BC0",
    fontWeight: "600",
  },
  deleteBtn: {
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: "#C62828",
    alignItems: "center",
  },
  deleteBtnText: {
    fontSize: moderateScale(12),
    color: "#C62828",
    fontWeight: "600",
  },
  confirmModalCard: {
    backgroundColor: "#FFF",
    borderRadius: scale(18),
    padding: scale(22),
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
  },
  confirmText: {
    fontSize: moderateScale(14),
    color: "#333",
    lineHeight: scale(22),
  },
  confirmSubtext: {
    fontSize: moderateScale(12),
    color: "#999",
    marginTop: scale(10),
  },
  confirmBtnRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: scale(10),
    marginTop: scale(24),
  },
  cancelDeleteBtn: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    borderRadius: scale(12),
    backgroundColor: "#F3F3F3",
  },
  cancelDeleteText: {
    color: "#555",
    fontWeight: "600",
  },
  confirmDeleteBtn: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    borderRadius: scale(12),
    backgroundColor: "#C62828",
  },
  confirmDeleteText: {
    color: "#FFF",
    fontWeight: "700",
  },
  resumeBtn: {
    backgroundColor: "#D4A373",
    borderColor: "#D4A373",
  },
  resumeBtnText: {
    color: "#FFF",
  },
});