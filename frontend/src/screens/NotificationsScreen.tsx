import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useRole } from "../context/RoleContext";
import {
  ArrowLeft,
  Bell,
  Coffee,
  Star,
  Store,
} from "lucide-react-native";

const customerNotifications = [
  {
    id: 1,
    icon: Coffee,
    title: "Visit approved ☕",
    message: "Your receipt from BrewLab was verified. +120 points!",
    time: "2h ago",
  },
  {
    id: 2,
    icon: Star,
    title: "Reward unlocked 🎉",
    message: "You can now redeem a free latte at Oak Tree Café.",
    time: "Yesterday",
  },
  {
    id: 3,
    icon: Bell,
    title: "New café nearby",
    message: "Sunrise Roasters just joined CafeHop near you.",
    time: "2 days ago",
  },
];

const cafeVisits = [
  {
    id: 1,
    customer: "Sarah M.",
    points: 120,
    cafe: "BrewLab",
    time: "2h ago",
  },
  {
    id: 2,
    customer: "Alex K.",
    points: 90,
    cafe: "Java Junction",
    time: "3h ago",
  },
  {
    id: 3,
    customer: "Jamie L.",
    points: 150,
    cafe: "Bean Street",
    time: "Yesterday",
  },
];

const NotificationsScreen = () => {
  const navigation = useNavigation<any>();
  const { role } = useRole();

  const { width } = Dimensions.get("window");
  const contentWidth = Math.min(width * 0.9, 480);

  const isCustomer = role === "customer";
  const notifications = isCustomer ? customerNotifications : cafeVisits;
  const title = isCustomer ? "Notifications" : "Customer Visits";

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#333" />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      {/* Main Content */}
      <View style={[styles.content, { width: contentWidth }]}>
        {notifications.length === 0 ? (
          <Text style={styles.emptyText}>
            {isCustomer ? "You're all caught up 🎉" : "No recent customer visits"}
          </Text>
        ) : (
          <View style={styles.notifications}>
            {notifications.map((item: any, index: number) => {
              const Icon = isCustomer ? item.icon : Store;
              return (
                <View key={item.id} style={styles.notificationCard}>
                  {/* Icon Background */}
                  <View style={styles.iconBackground}>
                    <Icon size={24} color="#D4A373" />
                  </View>

                  {/* Content */}
                  <View style={styles.notificationContent}>
                    <View style={styles.titleRow}>
                      <Text style={styles.notificationTitle}>
                        {isCustomer ? item.title : `${item.customer} visited`}
                      </Text>
                      <Text style={styles.timeText}>{item.time}</Text>
                    </View>
                    <Text style={styles.notificationMessage}>
                      {isCustomer
                        ? item.message
                        : `${item.cafe} • `}
                      {!isCustomer && (
                        <Text style={styles.pointsText}>+{item.points} pts</Text>
                      )}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F7F3F0",
    paddingVertical: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    fontFamily: "PlayfairDisplay_700Bold",
    marginLeft: 8,
    color: "#1A1A1A",
  },
  content: {
    alignSelf: "center",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#888",
    marginTop: 48,
  },
  notifications: {
    gap: 12,
  },
  notificationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8DFD5",
    gap: 12,
  },
  iconBackground: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F7F3F0",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  notificationContent: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: 12,
    color: "#888",
    flexShrink: 0,
  },
  notificationMessage: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  pointsText: {
    color: "#D4A373",
    fontWeight: "600",
  },
});

export default NotificationsScreen;
