// AI-assisted: written with help from generative AI (Claude), then reviewed and tested.
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import StationMap from "../components/Map";
import StationCard from "../components/StationCard";
import { Chip, EmptyState, Button } from "../components/ui";
import { useStorage, stationRating } from "../storage/StorageContext";
import { CONNECTOR_TYPES, ME } from "../storage/seed";
import { DEFAULT_PLACE, QUICK_CITIES, geocodeCity } from "../api/geocoding";
import { getCurrentPosition } from "../utils/location";
import { distanceKm } from "../utils/geo";
import { colors, radii, spacing, typography } from "../constants/theme";

const SEARCH_RADIUS_KM = 25;
const SORTS = [
  { key: "distance", label: "Nearest" },
  { key: "price", label: "Cheapest" },
  { key: "rating", label: "Top rated" },
];

export default function HomeScreen({ navigation }) {
  const { stations, user, updateUser } = useStorage();
  const [query, setQuery] = useState("");
  const [place, setPlace] = useState(DEFAULT_PLACE);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null); // { kind: "error" | "info", text }
  const [connector, setConnector] = useState("all");
  const [sortIndex, setSortIndex] = useState(0);
  const sort = SORTS[sortIndex].key;

  // Chargers within SEARCH_RADIUS_KM of the searched place, filtered and sorted.
  const results = useMemo(() => {
    const center = { latitude: place.latitude, longitude: place.longitude };
    return stations
      .filter((s) => s.active)
      .map((s) => ({ station: s, distance: distanceKm(center, s) }))
      .filter(({ distance }) => distance <= SEARCH_RADIUS_KM)
      .filter(
        ({ station }) => connector === "all" || station.type === connector,
      )
      .sort((a, b) => {
        if (sort === "price")
          return a.station.pricePerKwh - b.station.pricePerKwh;
        if (sort === "rating")
          return (
            (stationRating(b.station) || 0) - (stationRating(a.station) || 0)
          );
        return a.distance - b.distance;
      });
  }, [stations, place, connector, sort]);

  const markers = useMemo(
    () =>
      results.map(({ station }) => ({
        id: station.id,
        latitude: station.latitude,
        longitude: station.longitude,
        label: `$${station.pricePerKwh.toFixed(2)}`,
        mine: station.ownerId === ME,
      })),
    [results],
  );

  const center = useMemo(
    () => ({ latitude: place.latitude, longitude: place.longitude }),
    [place],
  );

  const runSearch = useCallback(
    async (text) => {
      const value = (text ?? query).trim();
      if (!value) {
        setNotice({ kind: "error", text: "Type a city or suburb to search." });
        return;
      }
      setLoading(true);
      setNotice(null);
      try {
        const found = await geocodeCity(value);
        setPlace(found);
        setQuery(found.name);
        if (found.offline) {
          setNotice({
            kind: "info",
            text: "Offline: using the built-in city list.",
          });
        }
        const recent = [
          found.name,
          ...(user.recentSearches || []).filter((r) => r !== found.name),
        ].slice(0, 4);
        updateUser({ recentSearches: recent });
      } catch (error) {
        setNotice({ kind: "error", text: error.message });
      } finally {
        setLoading(false);
      }
    },
    [query, user.recentSearches, updateUser],
  );

  const handleLocate = async () => {
    setLoading(true);
    setNotice(null);
    try {
      const position = await getCurrentPosition();
      setUserLocation(position);
      setPlace({ name: "your location", ...position });
      setQuery("");
    } catch (error) {
      setNotice({ kind: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const openStation = useCallback(
    (id) => navigation.navigate("ChargerDetail", { stationId: id }),
    [navigation],
  );

  // Recent searches first, then suggestions, without duplicates.
  const quickPlaces = [
    ...(user.recentSearches || []).map((r) => r.replace(", NSW", "")),
    ...QUICK_CITIES,
  ]
    .filter((city, index, list) => list.indexOf(city) === index)
    .slice(0, 5);

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search a city or suburb"
              placeholderTextColor={colors.textFaint}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => runSearch()}
              returnKeyType="search"
              autoCorrect={false}
              accessibilityLabel="City or suburb"
            />
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : query ? (
              <Pressable
                onPress={() => setQuery("")}
                hitSlop={8}
                accessibilityLabel="Clear search"
              >
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={colors.textFaint}
                />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            style={styles.squareButton}
            onPress={() => runSearch()}
            accessibilityLabel="Search chargers"
          >
            <Ionicons name="arrow-forward" size={20} color={colors.onPrimary} />
          </Pressable>
          <Pressable
            style={[styles.squareButton, styles.squareButtonLight]}
            onPress={handleLocate}
            accessibilityLabel="Use my location"
          >
            <Ionicons name="locate" size={20} color={colors.primaryDark} />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          keyboardShouldPersistTaps="handled"
        >
          {quickPlaces.map((city) => (
            <Chip
              key={city}
              label={city}
              icon={
                (user.recentSearches || []).some((r) => r.startsWith(city))
                  ? "time-outline"
                  : "location-outline"
              }
              selected={place.name.startsWith(city)}
              onPress={() => {
                setQuery(city);
                runSearch(city);
              }}
            />
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          <Chip
            label="All"
            selected={connector === "all"}
            onPress={() => setConnector("all")}
          />
          {CONNECTOR_TYPES.map((type) => (
            <Chip
              key={type}
              label={type === user.vehicleConnector ? `${type} · my car` : type}
              icon={
                type === user.vehicleConnector ? "car-sport-outline" : undefined
              }
              selected={connector === type}
              onPress={() => setConnector(type)}
            />
          ))}
        </ScrollView>

        {notice ? (
          <View
            style={[
              styles.notice,
              notice.kind === "error" ? styles.noticeError : styles.noticeInfo,
            ]}
          >
            <Ionicons
              name={
                notice.kind === "error"
                  ? "alert-circle"
                  : "cloud-offline-outline"
              }
              size={16}
              color={notice.kind === "error" ? colors.danger : colors.info}
            />
            <Text style={styles.noticeText}>{notice.text}</Text>
          </View>
        ) : null}

        <View style={styles.mapContainer}>
          <StationMap
            center={center}
            zoom={12}
            markers={markers}
            userLocation={userLocation}
            fitKey={`${place.name}|${connector}|${markers.length}`}
            onMarkerPress={openStation}
          />
        </View>

        <View style={styles.resultsHeader}>
          <Text style={styles.resultCount}>
            {results.length} charger{results.length === 1 ? "" : "s"} near{" "}
            {place.name}
          </Text>
          <Pressable
            onPress={() => setSortIndex((i) => (i + 1) % SORTS.length)}
            style={styles.sortButton}
            accessibilityLabel={`Sort: ${SORTS[sortIndex].label}. Tap to change.`}
          >
            <Ionicons
              name="swap-vertical"
              size={14}
              color={colors.primaryDark}
            />
            <Text style={styles.sortText}>{SORTS[sortIndex].label}</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.station.id}
        renderItem={({ item }) => (
          <StationCard
            station={item.station}
            distance={item.distance}
            compatible={item.station.type === user.vehicleConnector}
            onPress={() => openStation(item.station.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState
            icon="flash-off-outline"
            title="No chargers here yet"
            message={`Nothing within ${SEARCH_RADIUS_KM} km${connector !== "all" ? ` with a ${connector} plug` : ""}. Try another city or connector — or be the first host!`}
            action={
              <Button
                title="List my charger"
                icon="add"
                variant="dark"
                onPress={() => navigation.navigate("Add")}
              />
            }
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  top: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  searchRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 46,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    color: colors.text,
    height: "100%",
  },
  squareButton: {
    width: 46,
    height: 46,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  squareButtonLight: { backgroundColor: colors.primaryLight },
  chipsRow: { gap: spacing.sm, paddingTop: spacing.sm },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  noticeError: { backgroundColor: colors.dangerLight },
  noticeInfo: { backgroundColor: colors.infoLight },
  noticeText: { ...typography.caption, color: colors.text, flex: 1 },
  mapContainer: {
    height: 200,
    borderRadius: radii.lg,
    overflow: "hidden",
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  resultCount: { ...typography.label, flex: 1 },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: colors.primaryLight,
    borderRadius: radii.round,
  },
  sortText: { fontSize: 13, fontWeight: "700", color: colors.primaryDark },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
});
