import React, { useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
import { buildMapHtml } from "./mapHtml";

// Web version of the same map. react-native-webview's <WebView> doesn't work
// on web, so Metro/Expo picks this file automatically (the ".web.js" suffix)
// and we use a plain iframe instead, listening for the same postMessage
// payload the Leaflet page sends.
export default function FreeMapView({ latitude, longitude, onMapPress }) {
  const iframeRef = useRef(null);
  const html = buildMapHtml(latitude, longitude);

  useEffect(() => {
    const handleMessage = (event) => {
      try {
        const coords = JSON.parse(event.data);
        onMapPress(coords);
      } catch (error) {
        // Ignore messages that aren't our map's coordinate payload
        // (the browser can fire postMessage events from other sources).
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onMapPress]);

  return (
    <iframe
      ref={iframeRef}
      title="Charging station map"
      srcDoc={html}
      style={styles.iframe}
    />
  );
}

const styles = StyleSheet.create({
  iframe: {
    flex: 1,
    border: "none",
    width: "100%",
    height: "100%",
  },
});
