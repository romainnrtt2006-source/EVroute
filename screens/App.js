import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

import LoginScreen from "./screens/LoginScreen";
import MainTabs from "./navigation/MainTabs";
import ChargerDetailScreen from "./screens/ChargerDetailScreen";
import BookingRequestScreen from "./screens/BookingRequestScreen";
import CreateScreen from "./screens/CreateScreen";
import ToastHost from "./components/ToastHost";
import { StorageProvider, useStorage } from "./storage/StorageContext";
import { configureNotifications } from "./utils/notifications";
import { colors } from "./constants/theme";

const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
  },
};

// Waits for AsyncStorage to load before showing any screen, then opens
// the tabs directly if the user ticked "Remember me" last time.
function RootNavigator() {
  const { hydrated, session } = useStorage();

  if (!hydrated) {
    return (
      <View style={styles.splash}>
        <Ionicons name="flash" size={48} color={colors.onPrimary} />
        <Text style={styles.splashTitle}>EVRoute</Text>
        <ActivityIndicator color={colors.onPrimary} style={{ marginTop: 16 }} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName={session.loggedIn ? "Main" : "Login"}
        screenOptions={{
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: "700" },
          headerShadowVisible: false,
          headerBackTitle: "Back",
        }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ChargerDetail"
          component={ChargerDetailScreen}
          options={{ title: "Charger details" }}
        />
        <Stack.Screen
          name="BookingRequest"
          component={BookingRequestScreen}
          options={{ title: "Request booking" }}
        />
        <Stack.Screen
          name="EditStation"
          component={CreateScreen}
          options={{ title: "Edit my charger" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    configureNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <StorageProvider>
        <StatusBar style="dark" />
        <RootNavigator />
        <ToastHost />
      </StorageProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  splashTitle: {
    color: colors.onPrimary,
    fontSize: 32,
    fontWeight: "800",
    marginTop: 8,
  },
});
