import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import * as Notifications from "expo-notifications";
import { useStorage } from "../storage/StorageContext";
import { colors, spacing, radii, typography, cardShadow } from "../constants/theme";

const TIME_SLOTS = ["6:00 PM", "8:00 PM"];

const ESTIMATED_KWH = 14;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function BookingRequestScreen({ route, navigation }) {
  const { stationId } = route.params;
  const { stations, addBooking } = useStorage();
  const station = stations.find((item) => item.id === stationId);

  const [date, setDate] = useState("Fri, 5 Sep");
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);
  const [message, setMessage] = useState("");

  if (!station) {
    return (
      <View style={styles.container}>
        <Text style={typography.body}>This station could not be found.</Text>
      </View>
    );
  }

  const estimatedTotal = (ESTIMATED_KWH * station.pricePerKwh).toFixed(2);

  const handleSendRequest = async () => {
    addBooking({
      stationName: station.name,
      date,
      timeSlot,
      message: message.trim(),
    });

    // AI-assisted: the two-way notification simulation (requester +
    // "owner") below was designed and written with AI help.
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === "granted") {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Booking request sent",
          body: `Your request for "${station.name}" on ${date} has been sent.`,
        },
        trigger: null,
      });

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "New booking request",
          body: `Someone wants to charge at "${station.name}" on ${date}.`,
        },
        trigger: { seconds: 2 },
      });
    }

    Alert.alert("Request sent", "You'll find it under My Bookings.");
    navigation.navigate("Main", { screen: "MyBookings" });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.summary}>
        {station.name} · {station.type} · {station.kw}kW
      </Text>

      <Text style={styles.label}>Date</Text>
      <TextInput style={styles.input} value={date} onChangeText={setDate} />

      <Text style={styles.label}>Time slot</Text>
      <View style={styles.slotRow}>
        {TIME_SLOTS.map((slot) => (
          <TouchableOpacity
            key={slot}
            style={[
              styles.slotButton,
              timeSlot === slot && styles.slotButtonSelected,
            ]}
            onPress={() => setTimeSlot(slot)}
          >
            <Text
              style={[
                styles.slotButtonText,
                timeSlot === slot && styles.slotButtonTextSelected,
              ]}
            >
              {slot}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Message to host (optional)</Text>
      <TextInput
        style={[styles.input, styles.messageInput]}
        value={message}
        onChangeText={setMessage}
        multiline
        placeholder="Let the host know when you'll arrive..."
        placeholderTextColor={colors.textFaint}
      />

      <View style={styles.estimateBox}>
        <Text style={styles.estimateLine}>
          Estimated charge: ~{ESTIMATED_KWH} kWh
        </Text>
        <Text style={styles.estimateLine}>
          Estimated total: ${estimatedTotal}
        </Text>
      </View>

      <TouchableOpacity style={styles.sendButton} onPress={handleSendRequest}>
        <Text style={styles.sendButtonText}>Send request</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  summary: {
    ...typography.caption,
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.caption,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  messageInput: {
    height: 80,
    textAlignVertical: "top",
  },
  slotRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  slotButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
  },
  slotButtonSelected: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  slotButtonText: {
    color: colors.text,
    fontSize: 14,
  },
  slotButtonTextSelected: {
    color: colors.onPrimary,
    fontWeight: "700",
  },
  estimateBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  estimateLine: {
    ...typography.body,
    marginBottom: 2,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    ...cardShadow,
  },
  sendButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
});
