import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import React, { useState } from "react";

import FontAwesome5 from "react-native-vector-icons/FontAwesome5";

const HeroSection = () => {
  const [search, setSearch] = useState("");

  return (
    <View style={styles.container}>
      {/* Decorative circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoWrapper}>
            <FontAwesome5 name="coffee" size={24} color="#D4A373" />
          </View>
          <Text style={styles.title}>CAFEHOP</Text>
          <Text style={styles.subtitle}>
            Connecting local cafes with cafe hoppers
          </Text>
        </View>

        {/* Search bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchInputWrapper}>
            <FontAwesome5 name="search" size={16} color="#555" />
            <TextInput
              placeholder="Search cafes, vibes, amenities..."
              placeholderTextColor="#555"
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <Pressable style={styles.nearButton}>
            <FontAwesome5 name="map-marker-alt" size={14} color="#FFF" />
            <Text style={styles.nearButtonText}>Near Me</Text>
          </Pressable>
        </View>

        {/* Quick stats */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>150+</Text>
            <Text style={styles.statLabel}>Cafes</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>2.5k</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: "#D4A373" }]}>$12k</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: "center",
    width: "100%",
    backgroundColor: "#F7F3F0",
  },
  content: { width: "90%" },
  // Decorative circles
  circle1: {
    position: "absolute",
    top: 32,
    right: 16,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(212,163,115,0.2)",
  },
  circle2: {
    position: "absolute",
    top: 80,
    left: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(222, 213, 192,0.4)",
  },
  // Logo
  logoSection: { alignItems: "center", marginBottom: 24 },
  logoWrapper: {
    backgroundColor: "#FFF",
    padding: 8,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000",
    letterSpacing: 1,
  },
  subtitle: { fontSize: 12, color: "#555", marginTop: 4 },
  // Search
  searchSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginRight: 8,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: "#000" },
  nearButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D4A373",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
  },
  nearButtonText: { color: "#FFF", marginLeft: 4, fontSize: 14, fontWeight: "600" },
  // Stats
  statsSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  statItem: { alignItems: "center", paddingHorizontal: 8 },
  statNumber: { fontSize: 24, fontWeight: "bold", color: "#000" },
  statLabel: { fontSize: 10, color: "#555" },
  divider: { width: 1, height: 32, backgroundColor: "#E0E0E0", marginHorizontal: 8 },
});

export default HeroSection;