import React, { useCallback, useEffect, useRef } from "react";
import { useMapBridge } from "./useMapBridge";

// Web version (Snack web preview): the Leaflet page runs in an <iframe>.
// Several maps can be mounted at once (Search and Add tabs), so each one
// only listens to messages coming from its own iframe.
export default function StationMap(props) {
  const iframeRef = useRef(null);

  const post = useCallback((data) => {
    const target = iframeRef.current && iframeRef.current.contentWindow;
    if (target) target.postMessage(JSON.stringify(data), "*");
  }, []);

  const { html, handleMessage } = useMapBridge(props, post);

  useEffect(() => {
    const listener = (event) => {
      if (
        !iframeRef.current ||
        event.source !== iframeRef.current.contentWindow
      )
        return;
      handleMessage(event.data);
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [handleMessage]);

  return (
    <iframe
      ref={iframeRef}
      title="Charger map"
      srcDoc={html}
      style={{
        flex: 1,
        border: "none",
        width: "100%",
        height: "100%",
        display: "block",
      }}
    />
  );
}
