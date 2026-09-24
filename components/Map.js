import React from "react";
import { StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { buildMapHtml } from "./mapHtml";

export default function FreeMapView({ latitude, longitude, onMapPress }) {
  const html = buildMapHtml(latitude, longitude);

  const handleMessage = (event) => {
    try {
      const coords = JSON.parse(event.nativeEvent.data);
      onMapPress(coords);
    } catch (error) {
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
