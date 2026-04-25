import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from "react-native";

import { Gift, ChevronRight, Star } from "lucide-react-native";
import Button from "./Button";
import { scale, moderateScale, verticalScale } from "../../utils/responsive";

interface RewardsCardProps {
  points: number;
  status: string;
  nextReward: number;
  description?: string;
  themeColor?: "caramel" | "gold";
  role: "customer" | "cafe";
  onScan?: () => void;
}

export default function RewardsCard({
  points,
  status,
  nextReward,
  description,
  themeColor = "caramel",
  role,
  onScan,
}: RewardsCardProps) {

  const progress = (points / nextReward) * 100;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  const isGold = themeColor === "gold";

  return (
    <View
      style={[
        styles.card,
        isGold ? styles.goldCard : styles.caramelCard,
      ]}
    >
      {/* Header */}
      <View style={styles.header}>

        <View style={styles.statusContainer}>
          <View
            style={[
              styles.iconBox,
              isGold ? styles.iconGold : styles.iconCaramel,
            ]}
          >
            <Gift
              size={scale(18)}
              color={isGold ? "#D4A017" : "#D4A373"}
            />
          </View>

          <View>
            <Text style={styles.statusLabel}>My Status</Text>
            <Text style={styles.status}>{status}</Text>
          </View>
        </View>

        <View style={styles.pointsContainer}>
          <Text style={styles.points}>{points}</Text>
          <Text style={styles.pointsLabel}>Points</Text>
        </View>

      </View>

      {/* Description */}
      {description && (
        <Text style={styles.description}>
          {description}
        </Text>
      )}

      {/* Progress */}
      <View style={styles.progressSection}>

        <View style={styles.progressLabels}>
          <Text style={styles.progressText}>
            Progress to next reward
          </Text>
          <Text style={styles.progressText}>
            {nextReward - points} pts away
          </Text>
        </View>

        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              isGold && styles.progressGold,
              { width: progressWidth },
            ]}
          />
        </View>

      </View>

      {/* CTA */}
      {role === "customer" && (
        <Button
          variant="outline"
          onPress={onScan || (() => {})}
          style={styles.scanButton}
        >
          <View style={styles.scanContent}>
            <Star size={scale(16)} color="#D4A373" />
            <Text style={styles.scanText}>Scan QR</Text>
          </View>

          <ChevronRight size={scale(16)} color="#D4A373" />
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({

  card: {
    borderRadius: scale(20),
    padding: scale(20),
    marginVertical: verticalScale(10),
  },

  caramelCard: {
    backgroundColor: "#3E2723",
  },

  goldCard: {
    backgroundColor: "#F6E7A1",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: verticalScale(14),
  },

  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconBox: {
    padding: scale(8),
    borderRadius: scale(10),
    marginRight: scale(10),
  },

  iconCaramel: {
    backgroundColor: "#D4A37330",
  },

  iconGold: {
    backgroundColor: "#FFD70030",
  },

  statusLabel: {
    fontSize: moderateScale(11),
    color: "#CCCCCC",
    textTransform: "uppercase",
  },

  status: {
    fontSize: moderateScale(18),
    fontWeight: "600",
    color: "#FFF",
  },

  pointsContainer: {
    alignItems: "flex-end",
  },

  points: {
    fontSize: moderateScale(26),
    fontWeight: "700",
    color: "#FFF",
  },

  pointsLabel: {
    fontSize: moderateScale(12),
    color: "#CCCCCC",
  },

  description: {
    color: "#EEE",
    marginBottom: verticalScale(12),
  },

  progressSection: {
    marginBottom: verticalScale(14),
  },

  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: verticalScale(6),
  },

  progressText: {
    fontSize: moderateScale(12),
    color: "#BBBBBB",
  },

  progressBar: {
    height: verticalScale(8),
    backgroundColor: "#00000020",
    borderRadius: scale(20),
    overflow: "hidden",
  },

  progressFill: {
    height: verticalScale(8),
    backgroundColor: "#D4A373",
  },

  progressGold: {
    backgroundColor: "#D4A017",
  },

  scanButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  scanContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },

  scanText: {
    color: "#D4A373",
    fontWeight: "600",
  },
});