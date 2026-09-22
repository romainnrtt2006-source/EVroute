import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { colors, spacing, radii, typography, cardShadow } from "../constants/theme";

// Static mock profile - there's no real account system yet (Login is a
// mock too), so this is just a placeholder screen matching the wireframe
// until user accounts are a real feature.
const MOCK_USER = {
  name: "Romain N.",
  chargeCount: 3,
  chargerCount: 1,
  rating: 4.8,
};

const MENU_ITEMS = ["My vehicle", "Payment methods", "Notifications"];

export default function ProfileScreen({ navigation }) {
  const handleMenuPress = (label) => {
    Alert.alert(label, "This section isn't built yet.");
  };

  const handleLogOut = () => {
    navigation.getParent()?.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.nameCard}>
        <Text style={styles.name}>{MOCK_USER.name}</Text>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.statsText}>
          {MOCK_USER.chargeCount} charges | {MOCK_USER.chargerCount} charger |{" "}
          {MOCK_USER.rating} stars
        </Text>
      </View>

      <View style={styles.menu}>
        {MENU_ITEMS.map((label) => (
          <TouchableOpacity
            key={label}
            style={styles.menuRow}
            onPress={() => handleMenuPress(label)}
          >
            <Text style={styles.menuLabel}>{label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.menuRow} onPress={handleLogOut}>
          <Text style={[styles.menuLabel, styles.logOutLabel]}>Log out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    ...typography.heading,
    fontSize: 20,
    marginBottom: spacing.lg,
  },
  nameCard: {
    height: 60,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    ...cardShadow,
  },
  name: {
    ...typography.heading,
  },
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 2,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  statsText: {
    ...typography.caption,
  },
  menu: {
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  menuRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  menuLabel: {
    ...typography.body,
  },
  logOutLabel: {
    color: colors.danger,
    fontWeight: "600",
  },
});
