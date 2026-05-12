import { ArrowLeft, ChevronDown, ChevronUp, Info, Mail } from "lucide-react-native";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import React, { useState } from "react";
import { moderateScale, scale } from "../utils/responsive";

import BottomNav from "../components/ui/BottomNav";
import Button from "../components/ui/Button";
import { useNavigation } from "@react-navigation/native";
import { useRole } from "../context/RoleContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";

const customerFAQs = [
  {
    question: "How do I earn points?",
    answer:
      "You earn points by visiting cafes, making purchases, and participating in events. Each visit can add points to your CafeHop wallet.",
  },
  {
    question: "How do I redeem rewards?",
    answer:
      "Redeem rewards by going to the Rewards tab, selecting a reward, and confirming redemption at the cafe. Points will be deducted from your balance.",
  },
  {
    question: "Troubleshooting & support",
    answer:
      "If you encounter issues, try restarting the app or checking your internet connection. For further help, contact support.",
  },
  {
    question: "Can I transfer points to friends?",
    answer:
      "Currently, points cannot be transferred to other users, but you can redeem rewards for friends at participating cafes.",
  },
  {
    question: "How do I update my account info?",
    answer:
      "Go to the Settings tab and select Edit Profile. You can update your name, email, and cafe preferences there.",
  },
  {
    question: "What if I lose my phone?",
    answer:
      "Log in to your account on another device. Make sure you have two-factor authentication enabled for extra security.",
  },
];

const cafeFAQs = [
  {
    question: "How do I update my cafe profile?",
    answer:
      "Go to Settings → Edit Profile. You can update your cafe name, description, profile picture, and offered amenities.",
  },
  {
    question: "How do I manage cafe offerings?",
    answer:
      "Within Edit Profile, toggle options like WiFi availability, quiet atmosphere, vegan or gluten-free offerings, seating types, and other amenities.",
  },
  {
    question: "Can I highlight special promotions?",
    answer:
      "Yes! You can update your cafe's 'About' section or contact support to feature promotions in the app.",
  },
  {
    question: "How do I respond to customer feedback?",
    answer:
      "Customer feedback will appear in your dashboard. Reply directly to messages or update your cafe info to address common requests.",
  },
  {
    question: "Troubleshooting & support",
    answer:
      "If you experience issues with your cafe profile or the app, try refreshing or checking your internet connection. Contact support for further assistance.",
  },
];

const HelpScreen = () => {
  const navigation = useNavigation<any>();
  const { role } = useRole();
  const { colors: themeColors } = useTheme();

  const { width } = Dimensions.get("window");
  const contentWidth = Math.min(width * 0.9, 480);

  const styles = {
    container: {
      flex: 1,
      backgroundColor: themeColors.bg,
    },
    scrollContent: {
      paddingTop: scale(16),
      paddingBottom: scale(100),
      alignItems: "center",
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
      color: themeColors.text,
    },
    content: {
      alignSelf: "center",
      paddingHorizontal: scale(16),
    },
    section: {
      marginBottom: scale(24),
    },
    sectionTitle: {
      fontSize: moderateScale(16),
      fontWeight: "600",
      color: themeColors.text,
      marginBottom: scale(12),
    },
    faqContainer: {
      backgroundColor: themeColors.card,
      borderRadius: scale(16),
      borderWidth: 1,
      borderColor: themeColors.border,
      overflow: "hidden",
    },
    faqButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: scale(16),
      paddingVertical: scale(14),
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    faqLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: scale(12),
      flex: 1,
    },
    iconBg: {
      width: scale(36),
      height: scale(36),
      borderRadius: scale(8),
      backgroundColor: themeColors.bg,
      justifyContent: "center",
      alignItems: "center",
      flexShrink: 0,
    },
    faqQuestion: {
      fontSize: moderateScale(13),
      fontWeight: "600",
      color: themeColors.text,
      flex: 1,
    },
    faqAnswer: {
      paddingHorizontal: scale(16),
      paddingVertical: scale(12),
      backgroundColor: themeColors.bg,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    faqAnswerText: {
      fontSize: moderateScale(13),
      color: themeColors.textMuted,
      lineHeight: moderateScale(18),
    },
    emailButton: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: themeColors.accent,
      paddingVertical: scale(12),
      paddingHorizontal: scale(16),
      borderRadius: scale(12),
    },
    emailButtonText: {
      fontSize: moderateScale(14),
      fontWeight: "600",
      color: themeColors.card,
    },
    footer: {
      textAlign: "center",
      fontSize: moderateScale(12),
      color: themeColors.textMuted,
      marginTop: scale(24),
    },
  } as any;

  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const faqs = role === "cafe" ? cafeFAQs : customerFAQs;

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { alignItems: "flex-start" }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={themeColors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Help</Text>
        </View>

        {/* Content */}
        <View style={[styles.content, { width: contentWidth }]}>
          {/* FAQ Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            <View style={styles.faqContainer}>
              {faqs.map((faq, index) => (
                <View key={index}>
                  <Pressable
                    style={styles.faqButton}
                    onPress={() => toggleFAQ(index)}
                  >
                    <View style={styles.faqLeft}>
                      <View style={styles.iconBg}>
                        <Info size={16} color={themeColors.accent} />
                      </View>
                      <Text style={styles.faqQuestion}>{faq.question}</Text>
                    </View>
                    {openFAQ === index ? (
                      <ChevronUp size={20} color={themeColors.textMuted} />
                    ) : (
                      <ChevronDown size={20} color={themeColors.textMuted} />
                    )}
                  </Pressable>

                  {openFAQ === index && (
                    <View style={styles.faqAnswer}>
                      <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Contact Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Us</Text>
            <Button
              variant="caramel"
              onPress={() => {
                /* Handle email support */
              }}
              style={styles.emailButton}
            >
              <Mail size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.emailButtonText}>Email Support</Text>
            </Button>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>CafeHop v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Bottom Nav */}
      <BottomNav />
    </SafeAreaView>
  );
};

export default HelpScreen;
