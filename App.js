import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import CreateScreen from "./screens/CreateScreen";
import { StorageProvider } from "./storage/StorageContext";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    // StorageProvider wraps the whole navigator so every screen can reach
    // the shared station list via useStorage(), regardless of which screen
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
            name="Home"
            component={HomeScreen}
            options={{ title: "EVRoute" }}
          />
          <Stack.Screen
            name="Create"
            component={CreateScreen}
            options={{ title: "Add a Charging Station" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </StorageProvider>
  );
}
