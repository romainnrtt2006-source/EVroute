// AI-assisted: written with help from generative AI (Claude), then reviewed and tested.
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { showToast } from "./feedback";

// Local notifications only: there is no backend, so nothing is pushed from
// a server. On the web preview notifications aren't supported, so we fall
// back to the in-app toast.
const isWeb = Platform.OS === "web";

export function configureNotifications() {
  if (isWeb) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("bookings", {
      name: "Bookings",
      importance: Notifications.AndroidImportance.HIGH,
    }).catch(() => {});
  }
}

export async function ensureNotificationPermission() {
  if (isWeb) return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  } catch (error) {
    return false;
  }
}

// Shows a notification immediately (or a toast when not possible).
export async function notifyNow(title, body, enabled = true) {
  if (!enabled) return;
  if (isWeb || !(await ensureNotificationPermission())) {
    showToast(`${title} — ${body}`, "info");
    return;
  }
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });
  } catch (error) {
    showToast(`${title} — ${body}`, "info");
  }
}

// Schedules a reminder 30 minutes before a confirmed booking.
// Returns the notification id (so it can be cancelled) or null.
export async function scheduleBookingReminder({
  startIso,
  stationName,
  enabled = true,
}) {
  if (!enabled || isWeb) return null;
  const fireAt = new Date(new Date(startIso).getTime() - 30 * 60 * 1000);
  if (fireAt.getTime() <= Date.now() + 5000) return null;
  if (!(await ensureNotificationPermission())) return null;
  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: "Charging in 30 minutes",
        body: `Your session at ${stationName} starts soon. Check the access notes before you go.`,
      },
      trigger: { date: fireAt, channelId: "bookings" },
    });
  } catch (error) {
    return null;
  }
}

export async function cancelReminder(notificationId) {
  if (!notificationId || isWeb) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    // already fired or removed
  }
}
