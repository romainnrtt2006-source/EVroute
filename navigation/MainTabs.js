import React from "react";
import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import HomeScreen from "../screens/HomeScreen";
import MyBookingsScreen from "../screens/MyBookingsScreen";
import RequestsReceivedScreen from "../screens/RequestsReceivedScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { colors } from "../constants/theme";

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: "\u{1F50D}",
  MyBookings: "\u{1F4C5}",
  RequestsReceived: "\u{1F4E5}",
  Profile: "\u{1F464}",
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarIcon: () => (
          <Text style={{ fontSize: 18 }}>{TAB_ICONS[route.name]}</Text>
        ),
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "EVRoute" }}
      />
      <Tab.Screen
        name="MyBookings"
        component={MyBookingsScreen}
        options={{ title: "My Bookings" }}
      />
      <Tab.Screen
        name="RequestsReceived"
        component={RequestsReceivedScreen}
        options={{ title: "Requests" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Profile" }}
      />
    </Tab.Navigator>
  );
}
