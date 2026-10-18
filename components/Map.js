import React, { useCallback, useRef } from "react";
import { StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { useMapBridge } from "./useMapBridge";

// Phone version: the Leaflet page runs inside a WebView.
// Same props as Map.web.js — see useMapBridge.js.
export default function StationMap(props) {
  const webViewRef = useRef(null);

  const post = useCallback((data) => {
    webViewRef.current?.injectJavaScript(
      `window.applyUpdate && window.applyUpdate(${JSON.stringify(data)}); true;`,
    );
  }, []);

  const { html, handleMessage } = useMapBridge(props, post);

  return (
    <WebView
      ref={webViewRef}
      originWhitelist={["*"]}
      source={{ html }}
      style={styles.webview}
      onMessage={(event) => handleMessage(event.nativeEvent.data)}
      javaScriptEnabled
      domStorageEnabled
      nestedScrollEnabled
      scrollEnabled={false}
      setSupportMultipleWindows={false}
    />
  );
}

const styles = StyleSheet.create({
  webview: { flex: 1, backgroundColor: "#e8eef2" },
});
