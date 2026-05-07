import {
  ArrowLeft,
  Bell,
  Coffee,
  Star,
  Store,
} from "lucide-react-native";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { moderateScale, scale } from "../utils/responsive";

import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../api/supabaseClient";
import { useNavigation } from "@react-navigation/native";

// import { useRole } from "../context/RoleContext";

const NotificationsScreen = () => {
  const navigation = useNavigation<any>();
  // const { role } = useRole();

  const { width } = Dimensions.get("window");
  const contentWidth = Math.min(width * 0.9, 480);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const title = "Notifications";

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);

    const seconds = Math.floor(
      (now.getTime() - date.getTime()) / 1000
    );

    if (seconds < 60) return "Just now";

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/notifications`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const data = await response.json();
      console.log("NOTIFICATIONS RESPONSE:", data);

      setNotifications(data || []);
    } catch (err) {
      console.log("NOTIFICATIONS ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "reward_redeemed":
        return Star;

      case "new_review":
        return Star;

      case "new_comment":
        return Bell;

      case "customer_visit":
        return Store;

      case "points_earned":
        return Coffee;

      default:
        return Bell;
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: "#F7F3F0" }}>
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
        {loading ? (
          <Text style={styles.emptyText}>
            Loading...
          </Text>
        ) : notifications.length === 0 ? (
          <Text style={styles.emptyText}>
            You're all caught up 🎉
          </Text>
        ) : (
          <View style={styles.notifications}>
            {notifications.map((item: any) => {
              const Icon = getNotificationIcon(item.type);

              return (
                <View
                  key={item.id}
                  style={[
                    styles.notificationCard,
                    !item.is_read && styles.unreadCard,
                  ]}
                >
                  <View style={styles.iconBackground}>
                    <Icon size={24} color="#D4A373" />
                  </View>

                  <View style={styles.notificationContent}>
                    <View style={styles.titleRow}>
                      <Text style={styles.notificationTitle}>
                        {item.title}
                      </Text>

                      <Text style={styles.timeText}>
                        {formatTimeAgo(item.created_at)}
                      </Text>
                    </View>

                    <Text style={styles.notificationMessage}>
                      {item.message}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F7F3F0",
    paddingTop: scale(8),
    paddingBottom: scale(16),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(16),
    marginBottom: scale(24),
  },
  backButton: {
    padding: scale(8),
    marginRight: scale(12),
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: "600",
    fontFamily: "PlayfairDisplay_700Bold",
    marginLeft: scale(8),
    color: "#1A1A1A",
  },
  content: {
    alignSelf: "center",
  },
  emptyText: {
    textAlign: "center",
    fontSize: moderateScale(16),
    color: "#888",
    marginTop: scale(48),
  },
  notifications: {
    gap: scale(12),
  },
  notificationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: scale(16),
    backgroundColor: "#FFFFFF",
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: "#E8DFD5",
    gap: scale(12),
  },
  iconBackground: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(12),
    backgroundColor: "#F7F3F0",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  notificationContent: {
    flex: 1,
    gap: scale(4),
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  notificationTitle: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    color: "#1A1A1A",
    flex: 1,
    marginRight: scale(8),
  },
  timeText: {
    fontSize: moderateScale(12),
    color: "#888",
    flexShrink: 0,
  },
  notificationMessage: {
    fontSize: moderateScale(13),
    color: "#666",
    lineHeight: moderateScale(18),
  },
  pointsText: {
    color: "#D4A373",
    fontWeight: "600",
  },
  unreadCard: {
    backgroundColor: "#FDF6EE",
    borderColor: "#E7C9A9",
  },
});

export default NotificationsScreen;
