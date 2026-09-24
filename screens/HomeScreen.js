import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import FreeMapView from "../components/Map";
import { useStorage } from "../storage/StorageContext";
import { colors, spacing, radii, typography, cardShadow } from "../constants/theme";

const DEFAULT_LATITUDE = -32.9283;
const DEFAULT_LONGITUDE = 151.7817;

export default function HomeScreen({ navigation }) {
  const { stations } = useStorage();
  const [cityInput, setCityInput] = useState("");
  const [search, setSearch] = useState("");

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

  const handleFindChargers = () => {
    setSearch(cityInput);
  };

  const renderStation = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("ChargerDetail", { stationId: item.id })}
    >
      <Text style={styles.cardTitle}>{item.name}</Text>
      <Text style={styles.cardSubtitle}>
        {item.type} · ${item.pricePerKwh.toFixed(2)}/kWh
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>EVRoute</Text>

      <TextInput
        style={styles.input}
        placeholder="Search a city or region"
        placeholderTextColor={colors.textFaint}
        value={cityInput}
        onChangeText={setCityInput}
      />

      <TouchableOpacity style={styles.findButton} onPress={handleFindChargers}>
        <Text style={styles.findButtonText}>Find chargers in this area</Text>
      </TouchableOpacity>

      <View style={styles.mapContainer}>
        <FreeMapView
          latitude={DEFAULT_LATITUDE}
          longitude={DEFAULT_LONGITUDE}
          onMapPress={() => {}}
        />
      </View>

      <Text style={styles.resultCount}>
        {filteredStations.length} charger
        {filteredStations.length === 1 ? "" : "s"} found
      </Text>

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
  title: {
    ...typography.heading,
    fontSize: 20,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.sm,
    fontSize: 15,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  findButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 2,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  findButtonText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  mapContainer: {
    height: 160,
    borderRadius: radii.md,
    overflow: "hidden",
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultCount: {
    ...typography.caption,
    marginBottom: spacing.sm,
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
    fontSize: 15,
    marginBottom: 2,
  },
  cardSubtitle: {
    ...typography.caption,
  },
  emptyText: {
    textAlign: "center",
    color: colors.textFaint,
    marginTop: spacing.xxl,
  },
  addButton: {
    position: "absolute",
    bottom: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.text,
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
