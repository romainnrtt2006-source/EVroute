// AI-assisted: written with help from generative AI (Claude), then reviewed and tested.
import React, { useLayoutEffect, useMemo } from "react";
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import StationMap from "../components/Map";
import {
  Button,
  EmptyState,
  IconButton,
  InfoRow,
  Stars,
  StatusBadge,
} from "../components/ui";
import { useStorage, stationRating } from "../storage/StorageContext";
import { ME } from "../storage/seed";
import { confirmDialog, showToast } from "../utils/feedback";
import { directionsUrl, formatPrice } from "../utils/geo";
import {
  cardShadow,
  colors,
  radii,
  spacing,
  typography,
} from "../constants/theme";

export default function ChargerDetailScreen({ route, navigation }) {
  const { stationId } = route.params || {};
  const {
    stations,
    user,
    bookings,
    visibleRequests,
    updateStation,
    deleteStation,
  } = useStorage();
  const insets = useSafeAreaInsets();
  const station = stations.find((item) => item.id === stationId);
  const mine = station && station.ownerId === ME;

  useLayoutEffect(() => {
    if (station) {
      navigation.setOptions({
        title: station.name,
        headerRight: mine
          ? () => (
              <IconButton
                icon="create-outline"
                accessibilityLabel="Edit charger"
                onPress={() =>
                  navigation.navigate("EditStation", { stationId: station.id })
                }
              />
            )
          : undefined,
      });
    }
  }, [navigation, station, mine]);

  const marker = useMemo(
    () =>
      station
        ? [
            {
              id: station.id,
              latitude: station.latitude,
              longitude: station.longitude,
              label: formatPrice(station.pricePerKwh),
              mine,
            },
          ]
        : [],
    [station, mine],
  );
  const center = useMemo(
    () =>
      station
        ? { latitude: station.latitude, longitude: station.longitude }
        : { latitude: 0, longitude: 0 },
    [station],
  );

  if (!station) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="help-circle-outline"
          title="Charger not found"
          message="It may have been removed by its host."
        />
      </View>
    );
  }

  const rating = stationRating(station);
  const compatible = station.type === user.vehicleConnector;
  const myUpcoming = bookings.filter(
    (b) =>
      b.stationId === station.id &&
      (b.status === "waiting" || b.status === "confirmed") &&
      new Date(b.start) > new Date(),
  );
  const hostPending = visibleRequests.filter(
    (r) => r.stationId === station.id && r.status === "pending",
  ).length;

  const handleDelete = () =>
    confirmDialog({
      title: "Delete this charger?",
      message: "The listing and its requests will be removed from this phone.",
      confirmLabel: "Delete",
      destructive: true,
      onConfirm: () => {
        deleteStation(station.id);
        showToast("Charger deleted");
        navigation.goBack();
      },
    });

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}
      >
        {station.photoUri ? (
          <Image
            source={{ uri: station.photoUri }}
            style={styles.photo}
            accessibilityLabel={`Photo of ${station.name}`}
          />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Ionicons name="flash" size={42} color={colors.primary} />
            <Text style={styles.photoPlaceholderText}>No photo yet</Text>
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.stationName}>{station.name}</Text>
              <Text style={styles.suburb}>
                {station.suburb || "Location set on the map"}
              </Text>
            </View>
            <View style={styles.priceBox}>
              <Text style={styles.price}>
                {formatPrice(station.pricePerKwh)}
              </Text>
              <Text style={typography.small}>per kWh</Text>
            </View>
          </View>

          <View style={styles.ratingRow}>
            {rating ? (
              <>
                <Stars rating={rating} />
                <Text style={typography.caption}>
                  {rating.toFixed(1)} · {station.ratingCount} review
                  {station.ratingCount === 1 ? "" : "s"}
                </Text>
              </>
            ) : (
              <Text style={typography.caption}>No reviews yet</Text>
            )}
            {!station.active ? <StatusBadge status="paused" /> : null}
          </View>

          {!mine ? (
            <View
              style={[
                styles.compat,
                compatible ? styles.compatOk : styles.compatWarn,
              ]}
            >
              <Ionicons
                name={compatible ? "checkmark-circle" : "warning"}
                size={18}
                color={compatible ? colors.primaryDark : colors.warning}
              />
              <Text style={styles.compatText}>
                {compatible
                  ? `Compatible with your car (${user.vehicleConnector})`
                  : `Your car uses ${user.vehicleConnector} — this charger is ${station.type}. Bring an adapter.`}
              </Text>
            </View>
          ) : null}

          <View style={styles.specs}>
            <View style={styles.spec}>
              <Ionicons
                name="git-commit-outline"
                size={20}
                color={colors.primaryDark}
              />
              <Text style={styles.specValue}>{station.type}</Text>
              <Text style={typography.small}>Connector</Text>
            </View>
            <View style={styles.spec}>
              <Ionicons
                name="flash-outline"
                size={20}
                color={colors.primaryDark}
              />
              <Text style={styles.specValue}>{station.kw} kW</Text>
              <Text style={typography.small}>Power</Text>
            </View>
            <View style={styles.spec}>
              <Ionicons
                name="speedometer-outline"
                size={20}
                color={colors.primaryDark}
              />
              <Text style={styles.specValue}>
                {Math.round(station.kw * 6)} km
              </Text>
              <Text style={typography.small}>range / hour</Text>
            </View>
          </View>

          <InfoRow
            icon="time-outline"
            label="Availability"
            value={station.availability}
          />
          <InfoRow
            icon="key-outline"
            label="Access notes"
            value={station.accessNotes || "No notes provided"}
          />
          {station.address ? (
            <InfoRow
              icon="location-outline"
              label="Address"
              value={station.address}
            />
          ) : null}
          <InfoRow
            icon="person-outline"
            label="Host"
            value={mine ? "You" : station.ownerName}
          />

          <View style={styles.mapContainer}>
            <StationMap
              center={center}
              zoom={15}
              markers={marker}
              interactive={false}
            />
          </View>
          <Button
            title="Directions"
            icon="navigate-outline"
            variant="secondary"
            small
            onPress={() =>
              Linking.openURL(
                directionsUrl(station.latitude, station.longitude),
              )
            }
          />

          {myUpcoming.length ? (
            <View style={styles.notice}>
              <Ionicons name="calendar" size={16} color={colors.info} />
              <Text style={styles.noticeText}>
                You already have {myUpcoming.length} upcoming booking
                {myUpcoming.length > 1 ? "s" : ""} here.
              </Text>
            </View>
          ) : null}

          {mine ? (
            <View style={styles.ownerBox}>
              <View style={styles.ownerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={typography.label}>Listed on EVRoute</Text>
                  <Text style={typography.small}>
                    {station.active
                      ? "Drivers can find and book it."
                      : "Paused — hidden from search."}
                  </Text>
                </View>
                <Switch
                  value={station.active}
                  onValueChange={(active) => {
                    updateStation(station.id, { active });
                    showToast(
                      active ? "Listing is live again" : "Listing paused",
                      "info",
                    );
                  }}
                  trackColor={{ true: colors.primary, false: colors.border }}
                  thumbColor={colors.background}
                  accessibilityLabel="Listing active"
                />
              </View>
              <Button
                title="Delete charger"
                icon="trash-outline"
                variant="danger"
                small
                onPress={handleDelete}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View
        style={[styles.footer, { paddingBottom: spacing.md + insets.bottom }]}
      >
        {mine ? (
          <Button
            title={
              hostPending
                ? `See ${hostPending} pending request${hostPending > 1 ? "s" : ""}`
                : "See booking requests"
            }
            icon="mail-unread-outline"
            variant="dark"
            onPress={() =>
              navigation.navigate("Main", {
                screen: "Bookings",
                params: { segment: "host" },
              })
            }
          />
        ) : (
          <Button
            title={
              station.active ? "Request booking" : "Not available right now"
            }
            icon="calendar-outline"
            disabled={!station.active}
            onPress={() =>
              navigation.navigate("BookingRequest", { stationId: station.id })
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  photo: { width: "100%", height: 220 },
  photoPlaceholder: {
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  photoPlaceholderText: { ...typography.caption, color: colors.primaryDark },
  content: { padding: spacing.lg },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  stationName: { ...typography.title, fontSize: 22 },
  suburb: { ...typography.caption, marginTop: 2 },
  priceBox: { alignItems: "flex-end" },
  price: { fontSize: 22, fontWeight: "800", color: colors.primaryDark },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  compat: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  compatOk: { backgroundColor: colors.primaryLight },
  compatWarn: { backgroundColor: colors.warningLight },
  compatText: { ...typography.caption, color: colors.text, flex: 1 },
  specs: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    marginVertical: spacing.lg,
  },
  spec: { flex: 1, alignItems: "center", gap: 2 },
  specValue: { ...typography.label, fontSize: 15, marginTop: 2 },
  mapContainer: {
    height: 150,
    borderRadius: radii.lg,
    overflow: "hidden",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.infoLight,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  noticeText: { ...typography.caption, color: colors.text, flex: 1 },
  ownerBox: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  ownerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...cardShadow,
  },
});
