import React from "react";
import { View, Text, Image, StyleSheet, Pressable, Dimensions } from "react-native";
import { Star, MapPin } from "lucide-react-native";

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

const { width } = Dimensions.get("window");
const cardWidth = Math.min(width * 0.9, 440);

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
          <Star size={11} color="#D4A373" fill="#D4A373" />
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
          <MapPin size={12} color="#AAA" />
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
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 4,
  },
  imageWrap: { position: "relative", height: 160 },
  image:     { width: "100%", height: "100%" },

  ratingBadge: {
    position: "absolute",
    top: 10, right: 10,
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: { fontSize: 12, fontWeight: "700", color: "#1A1A1A" },

  openBadge: {
    position: "absolute",
    top: 10, left: 10,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 10,
  },
  openBadgeGreen: { backgroundColor: "rgba(232,245,233,0.95)" },
  openBadgeRed:   { backgroundColor: "rgba(255,235,238,0.95)" },
  openText:       { fontSize: 11, fontWeight: "600" },

  info: { paddingHorizontal: 14, paddingVertical: 12 },
  name: { fontSize: 16, fontWeight: "700", color: "#1A1A1A", marginBottom: 5 },

  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 10 },
  meta:    { fontSize: 12, color: "#888" },

  amenitiesRow: { flexDirection: "row", gap: 6 },
  amenityChip: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12, backgroundColor: "#F5F1EC",
  },
  amenityText: { fontSize: 11, color: "#666", fontWeight: "500" },
});
