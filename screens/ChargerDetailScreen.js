import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useStorage } from "../storage/StorageContext";
import { colors, spacing, radii, typography, cardShadow } from "../constants/theme";

export default function ChargerDetailScreen({ route, navigation }) {
  const { stationId } = route.params;
  const { stations } = useStorage();
  const station = stations.find((item) => item.id === stationId);

  if (!station) {
    return (
      <View style={styles.container}>
        <Text style={typography.body}>This station could not be found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {station.photoUri ? (
        <Image source={{ uri: station.photoUri }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Text style={styles.photoPlaceholderText}>Photo of the charger</Text>
        </View>
      )}

      <View style={styles.headerRow}>
        <Text style={styles.stationName}>{station.name}</Text>
        <Text style={styles.price}>${station.pricePerKwh.toFixed(2)}/kWh</Text>
      </View>
      <Text style={styles.typeLine}>
        {station.type} · {station.kw} kW
      </Text>

      <View style={styles.infoBlock}>
        <Text style={styles.infoLabel}>Availability</Text>
        <Text style={styles.infoValue}>{station.availability}</Text>
      </View>

      <View style={styles.infoBlock}>
        <Text style={styles.infoLabel}>Access notes</Text>
        <Text style={styles.infoValue}>{station.accessNotes}</Text>
      </View>

      <TouchableOpacity
        style={styles.requestButton}
        onPress={() =>
          navigation.navigate("BookingRequest", { stationId: station.id })
        }
      >
        <Text style={styles.requestButtonText}>Request booking</Text>
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
  photo: {
    width: "100%",
    height: 180,
    borderRadius: radii.lg,
    marginBottom: spacing.lg,
  },
  photoPlaceholder: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  photoPlaceholderText: {
    ...typography.caption,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stationName: {
    ...typography.title,
    fontSize: 20,
  },
  price: {
    ...typography.heading,
    fontSize: 16,
    color: colors.primary,
  },
  typeLine: {
    ...typography.caption,
    marginBottom: spacing.lg,
  },
  infoBlock: {
    marginBottom: spacing.md,
  },
  infoLabel: {
    ...typography.caption,
    fontWeight: "700",
    marginBottom: 2,
  },
  infoValue: {
    ...typography.body,
  },
  requestButton: {
    backgroundColor: colors.text,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.lg,
    ...cardShadow,
  },
  requestButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
});
