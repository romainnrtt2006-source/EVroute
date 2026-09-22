import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "./screens/LoginScreen";
import MainTabs from "./navigation/MainTabs";
import CreateScreen from "./screens/CreateScreen";
import ChargerDetailScreen from "./screens/ChargerDetailScreen";
import BookingRequestScreen from "./screens/BookingRequestScreen";
import { StorageProvider } from "./storage/StorageContext";

const Stack = createNativeStackNavigator();

// Root stack: Login, then the bottom-tab "Main" area (Home / My Bookings /
// Requests Received / Profile), plus a couple of screens that are pushed
// on top of the tabs rather than being tabs themselves (Create, Charger
// Detail, Booking Request) - matches how the wireframes flow: you land on
// a tab, then drill into detail screens from there.
export default function App() {
  return (
    // StorageProvider wraps the whole navigator so every screen can reach
    // the shared app data via useStorage(), regardless of which screen
    // it's currently on.
    <StorageProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
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
            name="Create"
            component={CreateScreen}
            options={{ title: "Add a Charging Station" }}
          />
          <Stack.Screen
            name="ChargerDetail"
            component={ChargerDetailScreen}
            options={{ title: "Charger Details" }}
          />
          <Stack.Screen
            name="BookingRequest"
            component={BookingRequestScreen}
            options={{ title: "Request Booking" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </StorageProvider>
  );
}
