import React from "react";
import { StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { buildMapHtml } from "./mapHtml";

// Native (iOS/Android) map: renders the shared Leaflet HTML inside a WebView.
export default function FreeMapView({
  latitude,
  longitude,
  onMapPress,
}) {
  const html = buildMapHtml(latitude, longitude);

  const handleMessage = (event) => {
    try {
      const coords = JSON.parse(event.nativeEvent.data);
      onMapPress(coords);
    } catch (error) {
      // Malformed message from the WebView's JS bridge; nothing to recover
      // from here beyond dropping it, since the map itself is still usable.
      console.warn("Could not parse map tap coordinates", error);
    }
  };

  return (
    <WebView
      originWhitelist={["*"]}
      source={{ html }}
      style={styles.webview}
      onMessage={handleMessage}
    />
  );
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
  },
});
