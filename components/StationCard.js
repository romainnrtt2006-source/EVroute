import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ME } from "../storage/seed";
import { stationRating } from "../storage/StorageContext";
import { formatDistance, formatPrice } from "../utils/geo";
import {
  cardShadow,
  colors,
  radii,
  spacing,
  typography,
} from "../constants/theme";

export default function StationCard({
  station,
  distance,
  compatible,
  onPress,
}) {
  const rating = stationRating(station);
  const mine = station.ownerId === ME;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${station.name}, ${station.type}, ${formatPrice(station.pricePerKwh)} per kilowatt hour`}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
    >
      {station.photoUri ? (
        <Image source={{ uri: station.photoUri }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Ionicons name="flash" size={24} color={colors.primary} />
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {station.name}
          </Text>
          {mine ? (
            <View style={styles.mineTag}>
              <Text style={styles.mineTagText}>Yours</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.meta} numberOfLines={1}>
          {station.suburb || "Location set on map"}
          {distance != null ? ` · ${formatDistance(distance)}` : ""}
        </Text>
        <View style={styles.tagsRow}>
          <View style={[styles.tag, compatible && styles.tagCompatible]}>
            {compatible ? (
              <Ionicons name="checkmark" size={12} color={colors.primaryDark} />
            ) : null}
            <Text
              style={[
                styles.tagText,
                compatible && { color: colors.primaryDark },
              ]}
            >
              {station.type}
            </Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{station.kw} kW</Text>
          </View>
          {rating ? (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color={colors.star} />
              <Text style={styles.ratingText}>
                {rating.toFixed(1)} ({station.ratingCount})
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.priceBox}>
        <Text style={styles.price}>{formatPrice(station.pricePerKwh)}</Text>
        <Text style={styles.priceUnit}>/kWh</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
    ...cardShadow,
  },
  thumb: { width: 56, height: 56, borderRadius: radii.md },
  thumbPlaceholder: {
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { ...typography.heading, fontSize: 15, flexShrink: 1 },
  mineTag: {
    backgroundColor: colors.text,
    borderRadius: radii.round,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  mineTagText: { color: colors.onPrimary, fontSize: 10, fontWeight: "800" },
  meta: { ...typography.caption, marginTop: 2 },
  tagsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    flexWrap: "wrap",
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagCompatible: { backgroundColor: colors.primaryLight },
  tagText: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  ratingText: { fontSize: 12, color: colors.textMuted },
  priceBox: { alignItems: "flex-end" },
  price: { fontSize: 17, fontWeight: "800", color: colors.primaryDark },
  priceUnit: { ...typography.small },
});
