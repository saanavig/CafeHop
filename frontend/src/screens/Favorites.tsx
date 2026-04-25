import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ArrowLeft, MapPin, Star } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { moderateScale, scale } from "../utils/responsive";

import { supabase } from "../api/supabaseClient";
import { useNavigation } from "@react-navigation/native";

type FavoriteCafe = {
  id: string;
  name: string;
  address?: string;
  image_url?: string;
};

export default function FavoritesScreen() {
  const navigation = useNavigation<any>();
  const [favorites, setFavorites] = useState<FavoriteCafe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data } = await supabase
          .from("user_cafe_interactions")
          .select("cafes(id, name, address, image_url)")
          .eq("user_id", user.id)
          .eq("interaction_type", "saved");

        if (data) {
          const cafes = data
            .map((d: any) => d.cafes)
            .filter(Boolean) as FavoriteCafe[];
          setFavorites(cafes);
        }
      } catch (err) {
        console.error("fetchFavorites error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={20} color="#555" />
        </Pressable>
        <Text style={styles.h1}>Favorites</Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#D4A373" style={{ marginTop: scale(40) }} />
      ) : (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Your Saved Cafes</Text>
          {favorites.length === 0 ? (
            <View style={styles.emptyState}>
              <Star size={scale(28)} color="#D4A373" />
              <Text style={styles.emptyTitle}>No favorites yet</Text>
              <Text style={styles.emptySub}>Save cafes from the Explore tab to see them here.</Text>
            </View>
          ) : (
            favorites.map((cafe) => (
              <View key={cafe.id} style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconBg}>
                    <Star size={scale(18)} color="#D4A373" fill="#D4A373" />
                  </View>
                  <View style={styles.cafeInfo}>
                    <Text style={styles.cafeName}>{cafe.name}</Text>
                    {cafe.address ? (
                      <View style={styles.addressRow}>
                        <MapPin size={scale(11)} color="#AAA" />
                        <Text style={styles.cafeLoc}>{cafe.address}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      <Text style={styles.footer}>CafeHop v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: scale(24), backgroundColor: "#F7F3F0", flexGrow: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: scale(8), marginBottom: scale(24) },
  backButton: { padding: scale(8), borderRadius: scale(16) },
  h1: { fontSize: moderateScale(20), fontWeight: "600", color: "#1A1A1A" },
  card: {
    backgroundColor: "#FFF",
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: "#E8DFD5",
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    padding: scale(14),
    paddingBottom: scale(10),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: scale(14),
    borderTopWidth: 1,
    borderTopColor: "#F0EAE4",
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: scale(12), flex: 1 },
  iconBg: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(10),
    backgroundColor: "rgba(212,163,115,0.12)",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  cafeInfo: { flex: 1 },
  cafeName: { fontSize: moderateScale(14), fontWeight: "600", color: "#1A1A1A" },
  addressRow: { flexDirection: "row", alignItems: "center", gap: scale(3), marginTop: scale(2) },
  cafeLoc: { fontSize: moderateScale(12), color: "#AAA" },
  emptyState: {
    alignItems: "center",
    paddingVertical: scale(40),
    paddingHorizontal: scale(24),
    gap: scale(8),
  },
  emptyTitle: { fontSize: moderateScale(15), fontWeight: "600", color: "#555", marginTop: scale(8) },
  emptySub: { fontSize: moderateScale(13), color: "#AAA", textAlign: "center", lineHeight: moderateScale(18) },
  footer: { textAlign: "center", fontSize: moderateScale(12), color: "#555", marginTop: scale(40) },
});
