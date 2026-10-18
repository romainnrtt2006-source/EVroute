import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";
import BookingsScreen from "../screens/BookingsScreen";
import CreateScreen from "../screens/CreateScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { useStorage } from "../storage/StorageContext";
import { colors } from "../constants/theme";

// AI-assisted: this bottom-tab navigator and its nesting inside the root
// stack (see App.js) were designed and written with AI help.
// The four tabs match the wireframes: Search, Bookings, Add, Profile.
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Search: ["search", "search-outline"],
  Bookings: ["calendar", "calendar-outline"],
  Add: ["add-circle", "add-circle-outline"],
  Profile: ["person", "person-outline"],
};

export default function MainTabs() {
  const { pendingRequestCount } = useStorage();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
        headerTitleStyle: { fontWeight: "800" },
        headerShadowVisible: false,
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons
            name={TAB_ICONS[route.name][focused ? 0 : 1]}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen
        name="Search"
        component={HomeScreen}
        options={{ title: "EVRoute", tabBarLabel: "Search" }}
      />
      <Tab.Screen
        name="Bookings"
        component={BookingsScreen}
        options={{
          title: "Bookings",
          tabBarBadge:
            pendingRequestCount > 0 ? pendingRequestCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.danger, fontSize: 11 },
        }}
      />
      <Tab.Screen
        name="Add"
        component={CreateScreen}
        options={{ title: "Add my charger", tabBarLabel: "Add" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Profile" }}
      />
    </Tab.Navigator>
  );
}
