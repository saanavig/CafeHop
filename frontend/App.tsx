// frontend/App.tsx
import "react-native-gesture-handler";
import "react-native-reanimated";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useFonts, PlayfairDisplay_700Bold } from "@expo-google-fonts/playfair-display";
import { RoleProvider } from "./src/context/RoleContext";

import SplashScreen from "./src/screens/SplashScreen";
import LoginScreen from "./src/screens/LoginScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import OnboardingRoleScreen from "./src/screens/OnboardingRoleScreen";
import CustomerOnboardingScreen from "./src/screens/CustomerOnboardingScreen";
import ExploreScreen from "./src/screens/ExploreScreen";
import CafeOnboarding from "./src/screens/CafeOnboardingScreen";
import Index from "./src/screens/Index";
import SettingsScreen from "./src/screens/SettingsScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import FavoritesScreen from "./src/screens/Favorites";
import NotificationsScreen from "./src/screens/NotificationsScreen";
import PreferencesScreen from "./src/screens/PreferencesScreen";
import HelpScreen from "./src/screens/HelpScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import RewardsScreen from "./src/screens/RewardsScreen";
import AnalyticsScreen from "./src/screens/AnalyticsScreen";
import CafeEditScreen from "./src/screens/CafeEditScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <RoleProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Splash"
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
          <Stack.Screen name="Favorites" component={FavoritesScreen} />
          <Stack.Screen name="Rewards" component={RewardsScreen} />
          <Stack.Screen name="Analytics" component={AnalyticsScreen} />
          <Stack.Screen name="CafeEdit" component={CafeEditScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </RoleProvider>
  );
}
