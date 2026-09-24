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

export default function App() {
  return (
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
