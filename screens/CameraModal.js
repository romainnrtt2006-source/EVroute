import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { showToast } from "../utils/feedback";
import { colors, radii, spacing } from "../constants/theme";

// Full-screen camera (expo-camera). Asks for permission first and shows a
// fallback with a button when it's denied.
export default function CameraModal({ visible, onClose, onPhotoTaken }) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [facing, setFacing] = useState("back");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleClose = () => {
    setReady(false);
    onClose();
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current || busy || !ready) return;
    setBusy(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.6 });
      onPhotoTaken(photo.uri);
      handleClose();
    } catch (error) {
      showToast("Couldn't take the photo, try again.", "error");
    } finally {
      setBusy(false);
    }
  };

  const renderPermission = () => {
    if (!permission) {
      return <ActivityIndicator color="#fff" />;
    }
    const blocked = !permission.canAskAgain;
    return (
      <View style={styles.permission}>
        <Ionicons name="camera-outline" size={48} color="#fff" />
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.permissionText}>
          EVRoute uses the camera so drivers can see your charger before they
          book.
        </Text>
        <Pressable
          style={styles.permissionButton}
          onPress={blocked ? () => Linking.openSettings() : requestPermission}
          accessibilityRole="button"
        >
          <Text style={styles.permissionButtonText}>
            {blocked ? "Open settings" : "Allow camera"}
          </Text>
        </Pressable>
        <Pressable onPress={handleClose} hitSlop={8}>
          <Text style={styles.cancelText}>Not now</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView style={styles.container}>
        {!permission || !permission.granted ? (
          <View style={styles.center}>{renderPermission()}</View>
        ) : (
          <>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={facing}
              onCameraReady={() => setReady(true)}
            />
            <View style={styles.controls}>
              <Pressable
                onPress={handleClose}
                hitSlop={10}
                accessibilityLabel="Close camera"
                style={styles.sideButton}
              >
                <Ionicons name="close" size={28} color="#fff" />
              </Pressable>
              <Pressable
                style={[styles.shutter, (!ready || busy) && { opacity: 0.5 }]}
                onPress={handleTakePhoto}
                disabled={!ready || busy}
                accessibilityLabel="Take photo"
              >
                {busy ? <ActivityIndicator color={colors.primary} /> : null}
              </Pressable>
              <Pressable
                onPress={() =>
                  setFacing((f) => (f === "back" ? "front" : "back"))
                }
                hitSlop={10}
                accessibilityLabel="Flip camera"
                style={styles.sideButton}
              >
                <Ionicons
                  name="camera-reverse-outline"
                  size={28}
                  color="#fff"
                />
              </Pressable>
            </View>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  camera: { flex: 1 },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  sideButton: { width: 48, alignItems: "center" },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: radii.round,
    backgroundColor: "#fff",
    borderWidth: 5,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  permission: {
    alignItems: "center",
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
  },
  permissionTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  permissionText: { color: "#ddd", fontSize: 15, textAlign: "center" },
  permissionButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
  permissionButtonText: {
    color: colors.onPrimary,
    fontWeight: "700",
    fontSize: 16,
  },
  cancelText: { color: "#fff", fontSize: 16, marginTop: spacing.sm },
});
