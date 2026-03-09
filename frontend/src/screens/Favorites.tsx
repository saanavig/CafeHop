import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";
import { ArrowLeft, Star } from "lucide-react-native";
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
        <Text style={styles.sectionTitle}>Your Favorite Cafés</Text>
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
  container: { padding: 24, backgroundColor: "#F7F3F0" },
  header: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 24 },
  backButton: { padding: 8, borderRadius: 16 },
  h1: { fontSize: 20, fontWeight: "600" },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DDD",
    overflow: "hidden",
  },
  sectionTitle: { fontSize: 14, fontWeight: "500", padding: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#DDD",
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  cafeName: { fontWeight: "500" },
  cafeLoc: { fontSize: 12, color: "#555" },
  footer: { textAlign: "center", fontSize: 12, color: "#555", marginTop: 40 },
});