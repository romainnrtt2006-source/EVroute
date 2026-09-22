import React, { useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { colors, spacing, radii } from "../constants/theme";

// Full-screen modal that lets the user snap a photo of their charging
// station. Kept separate from CreateScreen so the permission flow and
// camera lifecycle don't clutter the main form.
export default function CameraModal({ visible, onClose, onPhotoTaken }) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);

  const handleTakePhoto = async () => {
    if (!cameraRef.current || isTakingPhoto) return;

    setIsTakingPhoto(true);
    try {
      const photo = await cameraRef.current.takePictureAsync();
      onPhotoTaken(photo.uri);
      onClose();
    } finally {
      setIsTakingPhoto(false);
    }
  };

  // Permission hasn't loaded yet.
  if (!permission) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {!permission.granted ? (
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionText}>
              EVRoute needs camera access to take a photo of your station.
            </Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={requestPermission}
            >
              <Text style={styles.permissionButtonText}>Grant permission</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <CameraView ref={cameraRef} style={styles.camera} facing="back" />
            <View style={styles.controls}>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shutterButton}
                onPress={handleTakePhoto}
                disabled={isTakingPhoto}
              />
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    backgroundColor: "#000",
  },
  shutterButton: {
    width: 64,
    height: 64,
    borderRadius: radii.round,
    backgroundColor: "#fff",
    borderWidth: 4,
    borderColor: colors.primary,
  },
  cancelText: {
    color: "#fff",
    fontSize: 16,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl + spacing.sm,
  },
  permissionText: {
    color: "#fff",
    fontSize: 15,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  permissionButtonText: {
    color: colors.onPrimary,
    fontWeight: "600",
  },
});
