import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useStorage } from "../storage/StorageContext";
import { colors, spacing, radii, typography, cardShadow } from "../constants/theme";

const STATUS_COLORS = {
  waiting: colors.statusWaiting,
  confirmed: colors.statusConfirmed,
  declined: colors.statusDeclined,
};

function renderStars(rating) {
  if (!rating) return null;
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

export default function MyBookingsScreen() {
  const { myBookings } = useStorage();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My bookings</Text>

      <FlatList
        data={myBookings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            You haven't requested any charging sessions yet.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.stationName}>{item.stationName}</Text>
            <Text style={styles.dateLine}>
              {item.date}, {item.timeSlot}
            </Text>
            <View style={styles.footerRow}>
              <Text
                style={[
                  styles.statusBadge,
                  { color: STATUS_COLORS[item.status] || colors.textMuted },
                ]}
              >
                {item.status}
              </Text>
              {item.rating ? (
                <Text style={styles.stars}>{renderStars(item.rating)}</Text>
              ) : null}
            </View>
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
  stationName: {
    ...typography.heading,
    fontSize: 15,
    marginBottom: 2,
  },
  dateLine: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  stars: {
    fontSize: 13,
    color: "#E8A93B",
  },
  emptyText: {
    textAlign: "center",
    color: colors.textFaint,
    marginTop: spacing.xxl,
  },
});
