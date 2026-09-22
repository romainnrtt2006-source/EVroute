import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from "react-native";
import FreeMapView from "../components/Map";
import CameraModal from "./CameraModal";
import { useStorage } from "../storage/StorageContext";
import { colors, spacing, radii, typography, cardShadow } from "../constants/theme";

// Newcastle, used as a sensible default map center until expo-location
// (optional Week 5 stretch goal) picks the user's real position.
const DEFAULT_LATITUDE = -32.9283;
const DEFAULT_LONGITUDE = 151.7817;

export default function CreateScreen({ navigation }) {
  const { addStation } = useStorage();
  const [name, setName] = useState("");
  const [photoUri, setPhotoUri] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [pin, setPin] = useState(null);

  const handleMapPress = (coords) => {
    setPin(coords);
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Missing name", "Give your station a name first.");
      return;
    }
    if (!pin) {
      Alert.alert("Missing location", "Tap the map to place a pin first.");
      return;
    }

    addStation({
      name: name.trim(),
      photoUri,
      latitude: pin.latitude,
      longitude: pin.longitude,
    });

    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Station name"
        placeholderTextColor={colors.textFaint}
        value={name}
        onChangeText={setName}
      />

      <TouchableOpacity
        style={styles.photoButton}
        onPress={() => setIsCameraOpen(true)}
      >
        <Text style={styles.photoButtonText}>
          {photoUri ? "Retake Photo" : "Add Photo"}
        </Text>
      </TouchableOpacity>

      {photoUri && (
        <Image source={{ uri: photoUri }} style={styles.preview} />
      )}

      <Text style={styles.mapHint}>Tap the map to place your station</Text>
      <View style={styles.mapContainer}>
        <FreeMapView
          latitude={pin ? pin.latitude : DEFAULT_LATITUDE}
          longitude={pin ? pin.longitude : DEFAULT_LONGITUDE}
          onMapPress={handleMapPress}
        />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Station</Text>
      </TouchableOpacity>

      <CameraModal
        visible={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onPhotoTaken={setPhotoUri}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  photoButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  photoButtonText: {
    fontWeight: "600",
    color: colors.text,
  },
  preview: {
    width: "100%",
    height: 160,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  mapHint: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  mapContainer: {
    flex: 1,
    borderRadius: radii.md,
    overflow: "hidden",
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    ...cardShadow,
  },
  saveButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
});
