import React from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import * as Notifications from "expo-notifications";
import { useStorage } from "../storage/StorageContext";
import { colors, spacing, radii, typography, cardShadow } from "../constants/theme";

const STATUS_COLORS = {
  pending: colors.statusPending,
  confirmed: colors.statusConfirmed,
  declined: colors.statusDeclined,
};

async function notifyRequester(requesterName, outcome) {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Booking ${outcome}`,
      body: `${requesterName}, your charging request was ${outcome}.`,
    },
    trigger: null,
  });
}

export default function RequestsReceivedScreen() {
  const { requestsReceived, setRequestStatus } = useStorage();

  const handleAccept = (request) => {
    setRequestStatus(request.id, "confirmed");
    notifyRequester(request.requesterName, "confirmed");
  };

  const handleDecline = (request) => {
    setRequestStatus(request.id, "declined");
    notifyRequester(request.requesterName, "declined");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Requests received</Text>

      <FlatList
        data={requestsReceived}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No requests yet.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.requesterName}>{item.requesterName}</Text>
            <Text style={styles.dateLine}>
              {item.date}, {item.timeSlot}
            </Text>
            {item.message ? (
              <Text style={styles.message}>"{item.message}"</Text>
            ) : null}

            {item.status === "pending" ? (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.acceptButton]}
                  onPress={() => handleAccept(item)}
                >
                  <Text style={styles.acceptButtonText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.declineButton]}
                  onPress={() => handleDecline(item)}
                >
                  <Text style={styles.declineButtonText}>Decline</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text
                style={[
                  styles.statusBadge,
                  { color: STATUS_COLORS[item.status] || colors.textMuted },
                ]}
              >
                {item.status}
              </Text>
            )}
          </View>
        )}
      />
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
    marginBottom: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  card: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    ...cardShadow,
  },
  requesterName: {
    ...typography.heading,
    fontSize: 15,
    marginBottom: 2,
  },
  dateLine: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  message: {
    ...typography.body,
    fontStyle: "italic",
    marginBottom: spacing.sm,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionButton: {
    flex: 1,
    borderRadius: radii.sm,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  acceptButton: {
    backgroundColor: colors.primary,
  },
  acceptButtonText: {
    color: colors.onPrimary,
    fontWeight: "700",
    fontSize: 13,
  },
  declineButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  declineButtonText: {
    color: colors.danger,
    fontWeight: "700",
    fontSize: 13,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
    marginTop: spacing.xs,
  },
  emptyText: {
    textAlign: "center",
    color: colors.textFaint,
    marginTop: spacing.xxl,
  },
});
