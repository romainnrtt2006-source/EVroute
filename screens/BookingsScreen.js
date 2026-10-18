// AI-assisted: written with help from generative AI (Claude), then reviewed and tested.
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Segmented,
  Stars,
  StatusBadge,
} from "../components/ui";
import { useStorage, bookingDisplayStatus } from "../storage/StorageContext";
import { formatDuration, formatSlot, overlaps, slotEnd } from "../utils/dates";
import { formatPrice } from "../utils/geo";
import { confirmDialog, showToast } from "../utils/feedback";
import { useNow } from "../utils/useNow";
import { colors, radii, spacing, typography } from "../constants/theme";

// One tab, two roles (the same profile is both driver and host):
//  • "Driving": the requests I sent (wireframe 5 – My bookings)
//  • "Hosting": the requests drivers sent to my chargers (wireframe 7)
export default function BookingsScreen({ route, navigation }) {
  const [segment, setSegment] = useState(route.params?.segment || "driver");
  const { pendingRequestCount } = useStorage();

  // Other screens can open this tab on a given segment.
  useEffect(() => {
    if (route.params?.segment) setSegment(route.params.segment);
  }, [route.params?.segment]);

  return (
    <View style={styles.container}>
      <View style={styles.segmentWrap}>
        <Segmented
          value={segment}
          onChange={setSegment}
          options={[
            { key: "driver", label: "Driving" },
            {
              key: "host",
              label: "Hosting",
              badge: pendingRequestCount || null,
            },
          ]}
        />
      </View>
      {segment === "driver" ? (
        <DriverBookings navigation={navigation} />
      ) : (
        <HostRequests navigation={navigation} />
      )}
    </View>
  );
}

function DriverBookings({ navigation }) {
  const { bookings, stations, cancelBooking, rateBooking } = useStorage();
  const now = useNow();

  const sections = useMemo(() => {
    const upcoming = [];
    const past = [];
    bookings.forEach((b) => {
      const active =
        (b.status === "waiting" || b.status === "confirmed") &&
        slotEnd(b.start, b.durationMin) > now;
      (active ? upcoming : past).push(b);
    });
    upcoming.sort((a, b) => new Date(a.start) - new Date(b.start));
    past.sort((a, b) => new Date(b.start) - new Date(a.start));
    return [
      { title: "Upcoming", data: upcoming },
      { title: "History", data: past },
    ].filter((section) => section.data.length);
  }, [bookings, now]);

  const handleCancel = (booking) =>
    confirmDialog({
      title: "Cancel this booking?",
      message: `${booking.stationName}\n${formatSlot(booking.start, booking.durationMin)}`,
      confirmLabel: "Cancel booking",
      destructive: true,
      onConfirm: () => {
        cancelBooking(booking.id);
        showToast("Booking cancelled", "info");
      },
    });

  const handleRate = (booking, rating) => {
    rateBooking(booking.id, rating);
    showToast(`Thanks! You rated ${booking.stationName} ${rating}/5`);
  };

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionTitle}>{section.title}</Text>
      )}
      ListEmptyComponent={
        <EmptyState
          icon="calendar-outline"
          title="No bookings yet"
          message="Find a charger near you and send your first request."
          action={
            <Button
              title="Find a charger"
              icon="search"
              onPress={() => navigation.navigate("Search")}
            />
          }
        />
      }
      renderItem={({ item }) => {
        const status = bookingDisplayStatus(item, now);
        const stationExists = stations.some((s) => s.id === item.stationId);
        const upcoming =
          (status === "waiting" || status === "confirmed") &&
          slotEnd(item.start, item.durationMin) > now;
        return (
          <Card
            style={styles.card}
            onPress={
              stationExists
                ? () =>
                    navigation.navigate("ChargerDetail", {
                      stationId: item.stationId,
                    })
                : undefined
            }
            accessibilityLabel={`${item.stationName}, ${status}`}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.stationName}
              </Text>
              <StatusBadge status={status} />
            </View>
            <View style={styles.metaRow}>
              <Ionicons
                name="calendar-outline"
                size={14}
                color={colors.textMuted}
              />
              <Text style={typography.caption}>
                {formatSlot(item.start, item.durationMin)}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons
                name="flash-outline"
                size={14}
                color={colors.textMuted}
              />
              <Text style={typography.caption}>
                {formatDuration(item.durationMin)} · ~{item.estimatedKwh} kWh ·{" "}
                {formatPrice(item.total)}
              </Text>
            </View>

            {status === "waiting" ? (
              <View style={styles.waitingRow}>
                <ActivityIndicator size="small" color={colors.warning} />
                <Text style={styles.waitingText}>
                  Waiting for the host to reply…
                </Text>
              </View>
            ) : null}
            {status === "confirmed" && item.reminderId ? (
              <View style={styles.metaRow}>
                <Ionicons
                  name="notifications-outline"
                  size={14}
                  color={colors.primaryDark}
                />
                <Text
                  style={[typography.caption, { color: colors.primaryDark }]}
                >
                  Reminder 30 min before
                </Text>
              </View>
            ) : null}

            {status === "completed" ? (
              <View style={styles.rateRow}>
                <Text style={typography.label}>
                  {item.rating ? "Your rating" : "Rate this charge"}
                </Text>
                <Stars
                  rating={item.rating || 0}
                  size={24}
                  onRate={(value) => handleRate(item, value)}
                />
              </View>
            ) : null}

            {upcoming ? (
              <Button
                title="Cancel booking"
                variant="secondary"
                small
                icon="close-circle-outline"
                onPress={() => handleCancel(item)}
                style={{ marginTop: spacing.md }}
              />
            ) : null}
          </Card>
        );
      }}
    />
  );
}

function HostRequests({ navigation }) {
  const { visibleRequests, myStations, respondToRequest } = useStorage();
  const now = useNow();

  const { sections, earnings, upcomingCount } = useMemo(() => {
    const pending = [];
    const upcoming = [];
    const history = [];
    visibleRequests.forEach((r) => {
      const future = slotEnd(r.start, r.durationMin) > now;
      if (r.status === "pending" && future) pending.push(r);
      else if (r.status === "confirmed" && future) upcoming.push(r);
      else history.push(r);
    });
    pending.sort((a, b) => new Date(a.start) - new Date(b.start));
    upcoming.sort((a, b) => new Date(a.start) - new Date(b.start));
    history.sort((a, b) => new Date(b.start) - new Date(a.start));
    const total = visibleRequests
      .filter((r) => r.status === "confirmed")
      .reduce((sum, r) => sum + (r.total || 0), 0);
    return {
      sections: [
        { title: "To answer", data: pending },
        { title: "Upcoming sessions", data: upcoming },
        { title: "History", data: history },
      ].filter((s) => s.data.length),
      earnings: total,
      upcomingCount: upcoming.length,
    };
  }, [visibleRequests, now]);

  const accept = (request) => {
    respondToRequest(request.id, "confirmed");
    showToast(`Confirmed — ${request.requesterName} has been notified`);
  };

  const handleAccept = (request) => {
    const clash = visibleRequests.find(
      (r) =>
        r.id !== request.id &&
        r.stationId === request.stationId &&
        r.status === "confirmed" &&
        overlaps(r.start, r.durationMin, request.start, request.durationMin),
    );
    if (clash) {
      confirmDialog({
        title: "Time slot already taken",
        message: `This overlaps with ${clash.requesterName}'s session (${formatSlot(clash.start, clash.durationMin)}). Accept anyway?`,
        confirmLabel: "Accept anyway",
        onConfirm: () => accept(request),
      });
    } else {
      accept(request);
    }
  };

  const handleDecline = (request) =>
    confirmDialog({
      title: `Decline ${request.requesterName}'s request?`,
      message: formatSlot(request.start, request.durationMin),
      confirmLabel: "Decline",
      destructive: true,
      onConfirm: () => {
        respondToRequest(request.id, "declined");
        showToast("Request declined", "info");
      },
    });

  if (!myStations.length && !visibleRequests.length) {
    return (
      <EmptyState
        icon="home-outline"
        title="You're not hosting yet"
        message="List your home charger and earn money while it would sit idle."
        action={
          <Button
            title="List my charger"
            icon="add"
            variant="dark"
            onPress={() => navigation.navigate("Add")}
          />
        }
      />
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <View style={styles.statsCard}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatPrice(earnings)}</Text>
            <Text style={styles.statLabel}>confirmed earnings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{upcomingCount}</Text>
            <Text style={styles.statLabel}>
              upcoming session{upcomingCount === 1 ? "" : "s"}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{myStations.length}</Text>
            <Text style={styles.statLabel}>
              charger{myStations.length === 1 ? "" : "s"} listed
            </Text>
          </View>
        </View>
      }
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionTitle}>{section.title}</Text>
      )}
      ListEmptyComponent={
        <EmptyState
          icon="mail-open-outline"
          title="No requests yet"
          message="New requests from drivers will appear here."
        />
      }
      renderItem={({ item }) => {
        const future = slotEnd(item.start, item.durationMin) > now;
        const status =
          item.status === "pending" && !future
            ? "cancelled"
            : item.status === "confirmed" && !future
              ? "completed"
              : item.status;
        return (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.requester}>
                <Avatar
                  name={item.requesterName}
                  size={38}
                  color={colors.info}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.requesterName}</Text>
                  <Text style={typography.small} numberOfLines={1}>
                    {item.stationName}
                  </Text>
                </View>
              </View>
              {status !== "pending" ? <StatusBadge status={status} /> : null}
            </View>
            <View style={styles.metaRow}>
              <Ionicons
                name="calendar-outline"
                size={14}
                color={colors.textMuted}
              />
              <Text style={typography.caption}>
                {formatSlot(item.start, item.durationMin)}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons
                name="cash-outline"
                size={14}
                color={colors.textMuted}
              />
              <Text style={typography.caption}>
                You earn ~{formatPrice(item.total)}
              </Text>
            </View>
            {item.message ? (
              <View style={styles.bubble}>
                <Text style={styles.bubbleText}>“{item.message}”</Text>
              </View>
            ) : null}
            {status === "pending" ? (
              <View style={styles.actionRow}>
                <Button
                  title="Decline"
                  variant="danger"
                  small
                  onPress={() => handleDecline(item)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Accept"
                  small
                  icon="checkmark"
                  onPress={() => handleAccept(item)}
                  style={{ flex: 1 }}
                />
              </View>
            ) : null}
          </Card>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  segmentWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  card: { marginBottom: spacing.md },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardTitle: { ...typography.heading, fontSize: 16, flexShrink: 1 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 },
  waitingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.warningLight,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginTop: spacing.md,
  },
  waitingText: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: "600",
  },
  rateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  requester: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  bubble: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  bubbleText: { ...typography.body, fontStyle: "italic", fontSize: 14 },
  actionRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  statsCard: {
    flexDirection: "row",
    backgroundColor: colors.primaryLight,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
  },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "800", color: colors.primaryDark },
  statLabel: { ...typography.small, textAlign: "center", marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "rgba(11,122,67,0.2)" },
});
