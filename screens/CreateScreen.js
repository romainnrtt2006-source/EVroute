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
    backgroundColor: "#fff",
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  photoButton: {
    backgroundColor: "#eee",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  photoButtonText: {
    fontWeight: "600",
    color: "#333",
  },
  preview: {
    width: "100%",
    height: 160,
    borderRadius: 8,
    marginBottom: 12,
  },
  mapHint: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
  },
  mapContainer: {
    flex: 1,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: "#0F9D58",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
