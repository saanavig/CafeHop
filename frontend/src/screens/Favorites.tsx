import { ArrowLeft, Star } from "lucide-react-native";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { moderateScale, scale } from "../utils/responsive";

import React from "react";
import { useNavigation } from "@react-navigation/native";

const favoriteCafes = [
  { name: "Daily Grind", location: "Brooklyn, NY" },
  { name: "Bean There", location: "Queens, NY" },
  { name: "Java Junction", location: "Manhattan, NY" },
];

export default function FavoritesScreen() {
  const navigation = useNavigation<any>();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft size={20} color="#555" />
        </Pressable>
        <Text style={styles.h1}>Favorites</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Your Favorite Cafes</Text>
        {favoriteCafes.map((cafe, idx) => (
          <View key={idx} style={styles.row}>
            <View style={styles.rowLeft}>
              <Star size={20} color="#D4A373" />
              <View>
                <Text style={styles.cafeName}>{cafe.name}</Text>
                <Text style={styles.cafeLoc}>{cafe.location}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.footer}>CafeHop v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: scale(24), backgroundColor: "#F7F3F0" },
  header: { flexDirection: "row", alignItems: "center", gap: scale(8), marginBottom: scale(24) },
  backButton: { padding: scale(8), borderRadius: scale(16) },
  h1: { fontSize: moderateScale(20), fontWeight: "600" },
  card: {
    backgroundColor: "#FFF",
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: "#DDD",
    overflow: "hidden",
  },
  sectionTitle: { fontSize: moderateScale(14), fontWeight: "500", padding: scale(12) },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: scale(12),
    borderTopWidth: 1,
    borderTopColor: "#DDD",
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: scale(8) },
  cafeName: { fontWeight: "500" },
  cafeLoc: { fontSize: moderateScale(12), color: "#555" },
  footer: { textAlign: "center", fontSize: moderateScale(12), color: "#555", marginTop: scale(40) },
});