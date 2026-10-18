import { Alert, Platform } from "react-native";

// --- In-app toast -----------------------------------------------------
// A tiny publish/subscribe channel: any file can call showToast(), and the
// <ToastHost /> mounted in App.js displays the message for a few seconds.
const listeners = new Set();

export function showToast(message, kind = "success") {
  listeners.forEach((listener) => listener({ message, kind, id: Date.now() }));
}

export function subscribeToToasts(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// --- Dialogs -----------------------------------------------------------
// Alert.alert() does nothing on react-native-web (the Snack web preview),
// so these helpers fall back to the browser's own dialogs there.
export function infoDialog(title, message) {
  if (Platform.OS === "web") {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

export function confirmDialog({
  title,
  message,
  confirmLabel = "OK",
  destructive = false,
  onConfirm,
}) {
  if (Platform.OS === "web") {
    if (window.confirm(message ? `${title}\n\n${message}` : title)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    {
      text: confirmLabel,
      style: destructive ? "destructive" : "default",
      onPress: onConfirm,
    },
  ]);
}
