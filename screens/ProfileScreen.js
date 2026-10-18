// AI-assisted: written with help from generative AI (Claude), then reviewed and tested.
import React, { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Avatar,
  Button,
  Chip,
  IconButton,
  Input,
  SectionHeader,
  StatusBadge,
} from "../components/ui";
import { useStorage, bookingDisplayStatus } from "../storage/StorageContext";
import { CONNECTOR_TYPES } from "../storage/seed";
import { formatMonthYear } from "../utils/dates";
import { formatPrice } from "../utils/geo";
import { exportJsonFile } from "../utils/files";
import { ensureNotificationPermission } from "../utils/notifications";
import { confirmDialog, infoDialog, showToast } from "../utils/feedback";
import {
  cardShadow,
  colors,
  radii,
  spacing,
  typography,
} from "../constants/theme";

export default function ProfileScreen({ navigation }) {
  const {
    user,
    myStations,
    bookings,
    stations,
    visibleRequests,
    updateUser,
    updateStation,
    logOut,
    resetDemoData,
  } = useStorage();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(user.name);
  const [exporting, setExporting] = useState(false);

  const stats = useMemo(() => {
    const charges = bookings.filter(
      (b) => bookingDisplayStatus(b) === "completed",
    ).length;
    const totals = myStations.reduce(
      (acc, s) => ({
        total: acc.total + s.ratingTotal,
        count: acc.count + s.ratingCount,
      }),
      { total: 0, count: 0 },
    );
    return {
      charges,
      chargers: myStations.length,
      rating: totals.count ? (totals.total / totals.count).toFixed(1) : "–",
    };
  }, [bookings, myStations]);

  const saveName = () => {
    const name = nameDraft.trim();
    if (name.length < 2) {
      showToast("Name is too short", "error");
      return;
    }
    updateUser({ name });
    setEditingName(false);
    showToast("Profile updated");
  };

  const toggleNotifications = async (enabled) => {
    if (enabled && Platform.OS !== "web") {
      const granted = await ensureNotificationPermission();
      if (!granted) {
        infoDialog(
          "Notifications are blocked",
          "Allow notifications for Expo Go / EVRoute in your phone settings.",
        );
        return;
      }
    }
    updateUser({ notificationsEnabled: enabled });
  };

  // Week 6: JSON serialisation + writing an app-specific file + sharing it.
  const handleExport = async () => {
    setExporting(true);
    try {
      await exportJsonFile(
        `evroute-export-${new Date().toISOString().slice(0, 10)}.json`,
        {
          app: "EVRoute",
          exportedAt: new Date().toISOString(),
          profile: {
            name: user.name,
            email: user.email,
            vehicleConnector: user.vehicleConnector,
          },
          myChargers: myStations,
          myBookings: bookings,
          requestsReceived: visibleRequests,
          totals: { chargersInApp: stations.length },
        },
      );
      showToast("Data exported as JSON");
    } catch (error) {
      showToast("Export failed", "error");
    } finally {
      setExporting(false);
    }
  };

  const handleReset = () =>
    confirmDialog({
      title: "Reset demo data?",
      message:
        "Bookings, requests and chargers go back to the original demo data. Your name and email are kept.",
      confirmLabel: "Reset",
      destructive: true,
      onConfirm: () => {
        resetDemoData();
        showToast("Demo data restored", "info");
      },
    });

  const handleLogOut = () =>
    confirmDialog({
      title: "Log out?",
      message: "Your data stays saved on this phone.",
      confirmLabel: "Log out",
      onConfirm: () => {
        logOut();
        navigation
          .getParent()
          ?.reset({ index: 0, routes: [{ name: "Login" }] });
      },
    });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <Avatar name={user.name} size={64} />
        <View style={{ flex: 1 }}>
          {editingName ? (
            <View style={styles.nameEditRow}>
              <Input
                value={nameDraft}
                onChangeText={setNameDraft}
                autoFocus
                style={{ flex: 1, paddingVertical: 8 }}
                onSubmitEditing={saveName}
                returnKeyType="done"
              />
              <IconButton
                icon="checkmark-circle"
                color={colors.primary}
                size={30}
                onPress={saveName}
                accessibilityLabel="Save name"
              />
            </View>
          ) : (
            <Pressable
              style={styles.nameRow}
              onPress={() => {
                setNameDraft(user.name);
                setEditingName(true);
              }}
              accessibilityLabel="Edit name"
            >
              <Text style={styles.name}>{user.name}</Text>
              <Ionicons name="pencil" size={16} color={colors.textMuted} />
            </Pressable>
          )}
          {user.email ? (
            <Text style={typography.caption}>{user.email}</Text>
          ) : null}
          <Text style={typography.small}>
            Member since {formatMonthYear(user.memberSince)}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{stats.charges}</Text>
          <Text style={styles.statLabel}>charges</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{stats.chargers}</Text>
          <Text style={styles.statLabel}>
            charger{stats.chargers === 1 ? "" : "s"}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {stats.rating}{" "}
            <Ionicons name="star" size={16} color={colors.star} />
          </Text>
          <Text style={styles.statLabel}>host rating</Text>
        </View>
      </View>

      <SectionHeader
        title="My chargers"
        right={
          <Button
            title="Add"
            icon="add"
            variant="ghost"
            small
            onPress={() => navigation.navigate("Add")}
          />
        }
      />
      <View style={styles.group}>
        {myStations.length ? (
          myStations.map((station, index) => (
            <Pressable
              key={station.id}
              style={[styles.row, index > 0 && styles.rowBorder]}
              onPress={() =>
                navigation.navigate("ChargerDetail", { stationId: station.id })
              }
              accessibilityLabel={`Open ${station.name}`}
            >
              <View style={styles.rowIcon}>
                <Ionicons name="flash" size={18} color={colors.primaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{station.name}</Text>
                <Text style={typography.small}>
                  {station.type} · {station.kw} kW ·{" "}
                  {formatPrice(station.pricePerKwh)}/kWh
                </Text>
              </View>
              {!station.active ? <StatusBadge status="paused" /> : null}
              <Switch
                value={station.active}
                onValueChange={(active) =>
                  updateStation(station.id, { active })
                }
                trackColor={{ true: colors.primary, false: colors.border }}
                thumbColor={colors.background}
                accessibilityLabel={`${station.name} listed`}
              />
            </Pressable>
          ))
        ) : (
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate("Add")}
          >
            <View style={styles.rowIcon}>
              <Ionicons name="add" size={18} color={colors.primaryDark} />
            </View>
            <Text style={[styles.rowTitle, { flex: 1 }]}>
              List your first charger
            </Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textFaint}
            />
          </Pressable>
        )}
      </View>

      <SectionHeader title="My vehicle" />
      <View style={[styles.group, styles.groupPadded]}>
        <Text style={typography.caption}>
          Connector on your car — used to highlight compatible chargers.
        </Text>
        <View style={styles.chips}>
          {CONNECTOR_TYPES.map((type) => (
            <Chip
              key={type}
              label={type}
              selected={user.vehicleConnector === type}
              onPress={() => updateUser({ vehicleConnector: type })}
            />
          ))}
        </View>
      </View>

      <SectionHeader title="Settings" />
      <View style={styles.group}>
        <View style={styles.row}>
          <View style={styles.rowIcon}>
            <Ionicons
              name="notifications-outline"
              size={18}
              color={colors.primaryDark}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Booking notifications</Text>
            <Text style={typography.small}>
              {Platform.OS === "web"
                ? "Shown as in-app banners on the web"
                : "Replies, new requests and reminders"}
            </Text>
          </View>
          <Switch
            value={user.notificationsEnabled}
            onValueChange={toggleNotifications}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor={colors.background}
            accessibilityLabel="Booking notifications"
          />
        </View>
        <Pressable
          style={[styles.row, styles.rowBorder]}
          onPress={handleExport}
          disabled={exporting}
        >
          <View style={styles.rowIcon}>
            <Ionicons
              name="download-outline"
              size={18}
              color={colors.primaryDark}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>
              {exporting ? "Exporting…" : "Export my data"}
            </Text>
            <Text style={typography.small}>
              Bookings and chargers as a JSON file
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
        </Pressable>
        <Pressable style={[styles.row, styles.rowBorder]} onPress={handleReset}>
          <View style={styles.rowIcon}>
            <Ionicons
              name="refresh-outline"
              size={18}
              color={colors.primaryDark}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Reset demo data</Text>
            <Text style={typography.small}>Handy before a demo</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
        </Pressable>
      </View>

      <Button
        title="Log out"
        icon="log-out-outline"
        variant="danger"
        onPress={handleLogOut}
        style={{ marginTop: spacing.xl }}
      />
      <Text style={styles.footer}>
        EVRoute 1.1 · Your data is stored on this device only.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...cardShadow,
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  nameEditRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  name: { ...typography.heading, fontSize: 20 },
  statsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  stat: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    ...cardShadow,
  },
  statValue: { fontSize: 20, fontWeight: "800", color: colors.text },
  statLabel: { ...typography.small, marginTop: 2 },
  group: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    overflow: "hidden",
    ...cardShadow,
  },
  groupPadded: { padding: spacing.lg, gap: spacing.md },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { ...typography.body, fontWeight: "600" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  footer: { ...typography.small, textAlign: "center", marginTop: spacing.lg },
});
