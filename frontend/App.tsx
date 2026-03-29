// frontend/App.tsx
import "react-native-gesture-handler";
import "react-native-reanimated";

import { PlayfairDisplay_700Bold, useFonts } from "@expo-google-fonts/playfair-display";

import AnalyticsScreen from "./src/screens/AnalyticsScreen";
import { AuthProvider } from "./src/context/AuthContext";
import CafeEditScreen from "./src/screens/CafeEditScreen";
import CafeOnboarding from "./src/screens/CafeOnboardingScreen";
import CustomerOnboardingScreen from "./src/screens/CustomerOnboardingScreen";
import ExploreScreen from "./src/screens/ExploreScreen";
import FavoritesScreen from "./src/screens/Favorites";
import HelpScreen from "./src/screens/HelpScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import Index from "./src/screens/Index";
import LoginScreen from "./src/screens/LoginScreen";
import { NavigationContainer } from "@react-navigation/native";
import NotificationsScreen from "./src/screens/NotificationsScreen";
import OnboardingRoleScreen from "./src/screens/OnboardingRoleScreen";
import PreferencesScreen from "./src/screens/PreferencesScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import React from "react";
import ReceiptUploadScreen from "./src/screens/ReceiptUploadScreen";
import RewardsScreen from "./src/screens/RewardsScreen";
import { RoleProvider } from "./src/context/RoleContext";
import SettingsScreen from "./src/screens/SettingsScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import SplashScreen from "./src/screens/SplashScreen";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "./src/context/AuthContext";

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
        <RoleProvider>
          <AppContent />
        </RoleProvider>
      </AuthProvider>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator
        key={user ? "user" : "guest"}
        initialRouteName={user ? "Home" : "Splash"}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingRoleScreen} />
        <Stack.Screen name="OnboardingRoleScreen" component={OnboardingRoleScreen} />
        <Stack.Screen name="CustomerOnboarding" component={CustomerOnboardingScreen} />
        <Stack.Screen name="Explore" component={ExploreScreen} />
        <Stack.Screen name="Home" component={Index} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Preferences" component={PreferencesScreen} />
        <Stack.Screen name="Help" component={HelpScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="CafeOnboarding" component={CafeOnboarding} />
        <Stack.Screen name="ReceiptUpload" component={ReceiptUploadScreen} />
        <Stack.Screen name="Favorites" component={FavoritesScreen} />
        <Stack.Screen name="Rewards" component={RewardsScreen} />
        <Stack.Screen name="Analytics" component={AnalyticsScreen} />
        <Stack.Screen name="CafeEdit" component={CafeEditScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}