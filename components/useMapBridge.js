// AI-assisted: written with help from generative AI (Claude), then reviewed and tested.
import { useCallback, useEffect, useMemo, useRef } from "react";
import { buildMapHtml } from "./mapHtml";

// Shared logic for Map.js (phone, WebView) and Map.web.js (browser, iframe).
// `post(data)` is the platform-specific way to send a message into the map.
export function useMapBridge(props, post) {
  const {
    center,
    zoom = 12,
    markers = [],
    picked = null,
    userLocation = null,
    fitKey = null,
    interactive = true,
  } = props;
  const ready = useRef(false);
  const lastViewKey = useRef(null);
  const lastFitKey = useRef(null);
  const callbacks = useRef(props);
  callbacks.current = props;

  // The HTML is generated once with the first centre; later changes are messages.
  const html = useMemo(
    () =>
      buildMapHtml({
        latitude: center.latitude,
        longitude: center.longitude,
        zoom,
        interactive,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const sendUpdate = useCallback(() => {
    if (!ready.current) return;
    const viewKey = `${center.latitude.toFixed(5)},${center.longitude.toFixed(5)},${zoom}`;
    const update = { type: "update", markers, picked, user: userLocation };
    if (viewKey !== lastViewKey.current) {
      update.view = {
        latitude: center.latitude,
        longitude: center.longitude,
        zoom,
      };
      lastViewKey.current = viewKey;
    }
    if (fitKey && fitKey !== lastFitKey.current) {
      update.fit = true;
      lastFitKey.current = fitKey;
    }
    post(update);
  }, [
    center.latitude,
    center.longitude,
    zoom,
    markers,
    picked,
    userLocation,
    fitKey,
    post,
  ]);

  useEffect(() => {
    sendUpdate();
  }, [sendUpdate]);

  const handleMessage = useCallback(
    (raw) => {
      let data;
      try {
        data = typeof raw === "string" ? JSON.parse(raw) : raw;
      } catch (error) {
        return;
      }
      if (!data || !data.type) return;
      if (data.type === "ready") {
        ready.current = true;
        lastViewKey.current = null;
        lastFitKey.current = null;
        sendUpdate();
      } else if (data.type === "mapPress" && callbacks.current.onMapPress) {
        callbacks.current.onMapPress({
          latitude: data.latitude,
          longitude: data.longitude,
        });
      } else if (
        data.type === "markerPress" &&
        callbacks.current.onMarkerPress
      ) {
        callbacks.current.onMarkerPress(data.id);
      }
    },
    [sendUpdate],
  );

  return { html, handleMessage };
}
