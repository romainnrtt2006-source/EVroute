// AI-assisted: written with help from generative AI (Claude), then reviewed and tested.
import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, Chip, EmptyState, Field, Input } from "../components/ui";
import { useStorage } from "../storage/StorageContext";
import { DURATIONS, estimateCost, estimateKwh } from "../storage/seed";
import {
  addDays,
  atTime,
  formatDay,
  formatDuration,
  formatShortDate,
  formatSlot,
  formatTime,
  overlaps,
} from "../utils/dates";
import { formatPrice } from "../utils/geo";
import { showToast } from "../utils/feedback";
import {
  cardShadow,
  colors,
  radii,
  spacing,
  typography,
} from "../constants/theme";

const DAYS_AHEAD = 14;
const FIRST_HOUR = 6;
const LAST_HOUR = 22;
const MIN_NOTICE_MS = 15 * 60 * 1000;
const KM_PER_KWH = 6; // typical EV efficiency, used for the "range added" hint

export default function BookingRequestScreen({ route, navigation }) {
  const { stationId } = route.params || {};
  const { stations, bookings, requestBooking } = useStorage();
  const insets = useSafeAreaInsets();
  const station = stations.find((item) => item.id === stationId);

  // Start on tomorrow when today's last slot is already too close.
  const [dayOffset, setDayOffset] = useState(() =>
    atTime(0, LAST_HOUR).getTime() < Date.now() + MIN_NOTICE_MS ? 1 : 0,
  );
  const [duration, setDuration] = useState(120);
  const [startHour, setStartHour] = useState(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const days = useMemo(
    () => Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(new Date(), i)),
    [],
  );

  // My active bookings: I can't be at two chargers at the same time.
  const activeBookings = useMemo(
    () =>
      bookings.filter(
        (b) => b.status === "waiting" || b.status === "confirmed",
      ),
    [bookings],
  );

  const slots = useMemo(() => {
    const list = [];
    for (let hour = FIRST_HOUR; hour <= LAST_HOUR; hour += 1) {
      const start = atTime(dayOffset, hour);
      const tooSoon = start.getTime() < Date.now() + MIN_NOTICE_MS;
      const clash = activeBookings.find((b) =>
        overlaps(start, duration, b.start, b.durationMin),
      );
      list.push({
        hour,
        start,
        disabled: tooSoon || !!clash,
        reason: tooSoon ? "past" : clash ? "clash" : null,
      });
    }
    return list;
  }, [dayOffset, duration, activeBookings]);

  const selectedSlot =
    slots.find((slot) => slot.hour === startHour && !slot.disabled) || null;
  const anyClash = slots.some((slot) => slot.reason === "clash");

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

  const kwh = estimateKwh(station.kw, duration);
  const total = estimateCost(station, duration);

  const handleSend = () => {
    if (!selectedSlot) return;
    setSending(true);
    const booking = requestBooking({
      station,
      start: selectedSlot.start.toISOString(),
      durationMin: duration,
      message,
    });
    showToast(
      `Request sent to ${station.ownerName} — ${formatSlot(booking.start, booking.durationMin)}`,
    );
    navigation.navigate("Main", {
      screen: "Bookings",
      params: { segment: "driver" },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.summary}>
          <Ionicons name="flash" size={18} color={colors.primaryDark} />
          <Text style={styles.summaryText}>
            {station.name} · {station.type} · {station.kw} kW ·{" "}
            {formatPrice(station.pricePerKwh)}/kWh
          </Text>
        </View>
        <Text style={styles.availability}>
          Host availability: {station.availability}
        </Text>

        <Text style={styles.label}>Date</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {days.map((day, index) => {
            const selected = index === dayOffset;
            return (
              <Chip
                key={day.toDateString()}
                label={index < 2 ? `${formatDay(day)}` : formatShortDate(day)}
                selected={selected}
                onPress={() => setDayOffset(index)}
              />
            );
          })}
        </ScrollView>

        <Text style={styles.label}>Duration</Text>
        <View style={[styles.row, styles.wrap]}>
          {DURATIONS.map((minutes) => (
            <Chip
              key={minutes}
              label={formatDuration(minutes)}
              selected={duration === minutes}
              onPress={() => setDuration(minutes)}
            />
          ))}
        </View>

        <Text style={styles.label}>Start time</Text>
        <View style={[styles.row, styles.wrap]}>
          {slots.map((slot) => (
            <Chip
              key={slot.hour}
              label={formatTime(slot.start)}
              selected={startHour === slot.hour && !slot.disabled}
              disabled={slot.disabled}
              onPress={() => setStartHour(slot.hour)}
            />
          ))}
        </View>
        {slots.every((slot) => slot.disabled) ? (
          <Text style={styles.hint}>
            No more slots today — pick another day.
          </Text>
        ) : anyClash ? (
          <Text style={styles.hint}>
            Crossed-out times overlap with one of your other bookings.
          </Text>
        ) : null}

        <Field
          label="Message to host (optional)"
          style={{ marginTop: spacing.lg }}
        >
          <Input
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={200}
            placeholder="Let the host know when you'll arrive…"
          />
        </Field>

        <View style={styles.estimate}>
          <Text style={styles.estimateTitle}>Estimate</Text>
          <View style={styles.estimateRow}>
            <Text style={typography.caption}>When</Text>
            <Text style={styles.estimateValue}>
              {selectedSlot
                ? formatSlot(selectedSlot.start.toISOString(), duration)
                : "Pick a start time"}
            </Text>
          </View>
          <View style={styles.estimateRow}>
            <Text style={typography.caption}>Energy</Text>
            <Text style={styles.estimateValue}>
              ~{kwh} kWh (≈ {Math.round(kwh * KM_PER_KWH)} km of range)
            </Text>
          </View>
          <View style={[styles.estimateRow, styles.totalRow]}>
            <Text style={typography.label}>Estimated total</Text>
            <Text style={styles.total}>{formatPrice(total)}</Text>
          </View>
          <Text style={typography.small}>
            You only pay the host for the energy actually used. No payment is
            taken in the app.
          </Text>
        </View>
      </ScrollView>

      <View
        style={[styles.footer, { paddingBottom: spacing.md + insets.bottom }]}
      >
        <Button
          title={
            selectedSlot
              ? `Send request · ${formatPrice(total)}`
              : "Choose a start time"
          }
          icon="paper-plane-outline"
          disabled={!selectedSlot}
          loading={sending}
          onPress={handleSend}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 120 },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  summaryText: { ...typography.label, color: colors.primaryDark, flex: 1 },
  availability: { ...typography.caption, marginTop: spacing.sm },
  label: {
    ...typography.label,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  row: { flexDirection: "row", gap: spacing.sm },
  wrap: { flexWrap: "wrap" },
  hint: { ...typography.small, marginTop: spacing.sm },
  estimate: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  estimateTitle: { ...typography.heading, fontSize: 16 },
  estimateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  estimateValue: {
    ...typography.body,
    fontSize: 14,
    flexShrink: 1,
    textAlign: "right",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    alignItems: "center",
  },
  total: { fontSize: 22, fontWeight: "800", color: colors.primaryDark },
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
