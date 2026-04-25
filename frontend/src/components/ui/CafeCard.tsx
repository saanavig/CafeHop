import React from "react";
import { View, Text, Image, StyleSheet, Pressable } from "react-native";
import { Star, MapPin } from "lucide-react-native";
import { scale, moderateScale, verticalScale, deviceWidth } from "../../utils/responsive";

interface CafeCardProps {
  name: string;
  image: any;
  rating: number;
  distance: string;
  vibes: string[];
  amenities: string[];
  isOpen?: boolean;
  onPress?: () => void;
}

const cardWidth = Math.min(deviceWidth * 0.9, 440);

const CafeCard = ({ name, image, rating, distance, vibes, amenities, isOpen = true, onPress }: CafeCardProps) => {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, { width: cardWidth, opacity: pressed ? 0.93 : 1 }]}
      onPress={onPress}
    >
      {/* Hero image */}
      <View style={styles.imageWrap}>
        <Image source={image} style={styles.image} resizeMode="cover" />
        {/* Rating badge */}
        <View style={styles.ratingBadge}>
          <Star size={scale(11)} color="#D4A373" fill="#D4A373" />
          <Text style={styles.ratingText}>{rating}</Text>
        </View>
        {/* Open/closed */}
        <View style={[styles.openBadge, isOpen ? styles.openBadgeGreen : styles.openBadgeRed]}>
          <Text style={[styles.openText, isOpen ? { color: "#2E7D32" } : { color: "#C62828" }]}>
            {isOpen ? "Open" : "Closed"}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.metaRow}>
          <MapPin size={scale(12)} color="#AAA" />
          <Text style={styles.meta}>{distance}  ·  {vibes.join(", ")}</Text>
        </View>
        <View style={styles.amenitiesRow}>
          {amenities.slice(0, 3).map((a) => (
            <View key={a} style={styles.amenityChip}>
              <Text style={styles.amenityText}>{a}</Text>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
};

export default CafeCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    borderRadius: scale(18),
    overflow: "hidden",
    marginBottom: verticalScale(14),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 4,
  },
  imageWrap: { position: "relative", height: verticalScale(160) },
  image:     { width: "100%", height: "100%" },

  ratingBadge: {
    position: "absolute",
    top: scale(10), right: scale(10),
    flexDirection: "row", alignItems: "center", gap: scale(3),
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: scale(8), paddingVertical: scale(4),
    borderRadius: scale(12),
  },
  ratingText: { fontSize: moderateScale(12), fontWeight: "700", color: "#1A1A1A" },

  openBadge: {
    position: "absolute",
    top: scale(10), left: scale(10),
    paddingHorizontal: scale(8), paddingVertical: scale(4),
    borderRadius: scale(10),
  },
  openBadgeGreen: { backgroundColor: "rgba(232,245,233,0.95)" },
  openBadgeRed:   { backgroundColor: "rgba(255,235,238,0.95)" },
  openText:       { fontSize: moderateScale(11), fontWeight: "600" },

  info: { paddingHorizontal: scale(14), paddingVertical: verticalScale(12) },
  name: { fontSize: moderateScale(16), fontWeight: "700", color: "#1A1A1A", marginBottom: verticalScale(5) },

  metaRow: { flexDirection: "row", alignItems: "center", gap: scale(4), marginBottom: verticalScale(10) },
  meta:    { fontSize: moderateScale(12), color: "#888" },

  amenitiesRow: { flexDirection: "row", gap: scale(6) },
  amenityChip: {
    paddingHorizontal: scale(10), paddingVertical: scale(4),
    borderRadius: scale(12), backgroundColor: "#F5F1EC",
  },
  amenityText: { fontSize: moderateScale(11), color: "#666", fontWeight: "500" },
});
