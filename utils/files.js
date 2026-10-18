// AI-assisted: written with help from generative AI (Claude), then reviewed and tested.
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

// Week 6 – app-specific files. Camera/gallery pictures land in the cache
// folder, which the OS may clear at any time. We copy them into the app's
// private document directory so the charger photo survives restarts.
const isWeb = Platform.OS === "web";
const PHOTO_DIR = isWeb ? null : `${FileSystem.documentDirectory}photos/`;

export async function persistPhoto(uri) {
  if (!uri || isWeb || uri.startsWith(PHOTO_DIR)) return uri;
  try {
    await FileSystem.makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
    const extension = uri.split(".").pop().split("?")[0] || "jpg";
    const destination = `${PHOTO_DIR}charger-${Date.now()}.${extension}`;
    await FileSystem.copyAsync({ from: uri, to: destination });
    return destination;
  } catch (error) {
    console.warn("Could not save photo, keeping the temporary file", error);
    return uri;
  }
}

export async function deletePhoto(uri) {
  if (!uri || isWeb || !uri.startsWith(PHOTO_DIR)) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch (error) {
    // nothing to clean up
  }
}

// Serialises data to JSON, writes it to a file and opens the share sheet
// (on web the file is downloaded instead).
export async function exportJsonFile(fileName, data) {
  const json = JSON.stringify(data, null, 2);

  if (isWeb) {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    return fileName;
  }

  const path = `${FileSystem.documentDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(path, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, {
      mimeType: "application/json",
      dialogTitle: "Export EVRoute data",
      UTI: "public.json",
    });
  }
  return path;
}
