import React, { useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
import { buildMapHtml } from "./mapHtml";

export default function FreeMapView({ latitude, longitude, onMapPress }) {
  const iframeRef = useRef(null);
  const html = buildMapHtml(latitude, longitude);

  useEffect(() => {
    const handleMessage = (event) => {
      try {
        const coords = JSON.parse(event.data);
        onMapPress(coords);
      } catch (error) {
        // ignore non-JSON messages
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
