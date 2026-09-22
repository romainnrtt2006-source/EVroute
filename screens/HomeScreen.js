import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import * as Notifications from "expo-notifications";
import { useStorage } from "../storage/StorageContext";
import { colors, spacing, radii, typography, cardShadow } from "../constants/theme";

// Notifications need to actually display while the app is foregrounded,
// otherwise the "Request to charge" demo would appear to do nothing.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function HomeScreen({ navigation }) {
  const { stations } = useStorage();
  const [search, setSearch] = useState("");

  // Stations created from CreateScreen don't have a "city" field (the form
  // only collects a name + map pin), so the search now matches against
  // name as well as city, instead of city alone like the old mock data did.
  const filteredStations = useMemo(() => {
    if (!search.trim()) return stations;
    const query = search.trim().toLowerCase();
    return stations.filter((station) => {
      const nameMatch = station.name.toLowerCase().includes(query);
      const cityMatch = station.city
        ? station.city.toLowerCase().includes(query)
        : false;
      return nameMatch || cityMatch;
    });
  }, [search, stations]);

  const handleRequestToCharge = async (station) => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Notifications disabled",
        "Enable notifications to receive updates on your charging request."
      );
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Booking request sent",
        body: `Your request to charge at "${station.name}" has been sent.`,
      },
      trigger: null,
    });
  };

  const renderStation = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.name}</Text>
      {item.city ? (
        <Text style={styles.cardCity}>{item.city}</Text>
      ) : null}
      <TouchableOpacity
        style={styles.requestButton}
        onPress={() => handleRequestToCharge(item)}
      >
        <Text style={styles.requestButtonText}>Request to charge</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search by name or city..."
        placeholderTextColor={colors.textFaint}
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={filteredStations}
        keyExtractor={(item) => item.id}
        renderItem={renderStation}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No stations found.</Text>
        }
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("Create")}
      >
        <Text style={styles.addButtonText}>+ Add a Charging Station</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.md,
    fontSize: 15,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  listContent: {
    paddingBottom: 90,
  },
  card: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    ...cardShadow,
  },
  cardTitle: {
    ...typography.heading,
    marginBottom: 2,
  },
  cardCity: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
  requestButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  requestButtonText: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    color: colors.textFaint,
    marginTop: spacing.xxl + spacing.md,
  },
  addButton: {
    position: "absolute",
    bottom: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    ...cardShadow,
  },
  addButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
});
