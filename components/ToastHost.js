import React, { useEffect, useRef, useState } from "react";
import { Animated, Platform, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { subscribeToToasts } from "../utils/feedback";
import { colors, radii, spacing } from "../constants/theme";

const ICONS = {
  success: "checkmark-circle",
  info: "notifications",
  error: "alert-circle",
};
const TINTS = {
  success: colors.primary,
  info: colors.info,
  error: colors.danger,
};

// Displays messages sent with showToast() at the top of the screen.
export default function ToastHost() {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef(null);

  useEffect(
    () =>
      subscribeToToasts((next) => {
        clearTimeout(hideTimer.current);
        setToast(next);
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: Platform.OS !== "web",
        }).start();
        hideTimer.current = setTimeout(() => {
          Animated.timing(opacity, {
            toValue: 0,
            duration: 220,
            useNativeDriver: Platform.OS !== "web",
          }).start(() => setToast(null));
        }, 3500);
      }),
    [opacity],
  );

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  if (!toast) return null;
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[
        styles.toast,
        {
          top: insets.top + spacing.sm,
          opacity,
          borderLeftColor: TINTS[toast.kind],
        },
      ]}
    >
      <Ionicons
        name={ICONS[toast.kind] || ICONS.info}
        size={20}
        color={TINTS[toast.kind] || colors.info}
      />
      <Text style={styles.text}>{toast.message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.text,
    borderRadius: radii.md,
    borderLeftWidth: 5,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    zIndex: 1000,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  text: { color: colors.onPrimary, fontSize: 14, fontWeight: "600", flex: 1 },
});
