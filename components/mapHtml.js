// AI-assisted: this embedded Leaflet/OpenStreetMap HTML/JS was written
// with AI help.
//
// The map is a small web page (Leaflet + free OpenStreetMap tiles) shown
// in a WebView on the phone and in an <iframe> on the web. The page is
// built ONCE; later changes (pins, centre, picked point) are sent to it as
// JSON messages so the map doesn't reload and lose the user's zoom.
//
// Messages sent by the page:   { type: "ready" }
//                              { type: "mapPress", latitude, longitude }
//                              { type: "markerPress", id }
// Message received by the page: { type: "update", view?, markers, picked, user, fit }
export function buildMapHtml({
  latitude,
  longitude,
  zoom = 12,
  interactive = true,
}) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: #e8eef2; }
    .price-pin { background: #0F9D58; color: #fff; font: 700 12px -apple-system, system-ui, sans-serif;
      padding: 4px 8px; border-radius: 14px; border: 2px solid #fff; white-space: nowrap;
      box-shadow: 0 2px 6px rgba(0,0,0,.25); transform: translate(-50%, -100%); position: absolute; }
    .price-pin:after { content: ""; position: absolute; left: 50%; bottom: -6px; margin-left: -5px;
      border-width: 5px 5px 0; border-style: solid; border-color: #fff transparent transparent; }
    .price-pin.mine { background: #14181F; }
    .price-pin.paused { background: #9AA0A6; }
    .price-pin.selected { background: #0B7A43; transform: translate(-50%, -100%) scale(1.15); z-index: 1000; }
    .pick-pin { width: 22px; height: 22px; border-radius: 50% 50% 50% 0; background: #D64545;
      border: 3px solid #fff; transform: translate(-50%, -100%) rotate(-45deg); position: absolute;
      box-shadow: 0 2px 6px rgba(0,0,0,.35); }
    .user-dot { width: 14px; height: 14px; border-radius: 50%; background: #2B6CB0; border: 3px solid #fff;
      box-shadow: 0 0 0 6px rgba(43,108,176,.25); transform: translate(-50%, -50%); position: absolute; }
    .leaflet-div-icon { background: transparent; border: none; }
    .error { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      font: 14px system-ui, sans-serif; color: #5F6368; text-align: center; padding: 16px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    function send(message) {
      var payload = JSON.stringify(message);
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(payload);
      else if (window.parent) window.parent.postMessage(payload, "*");
    }

    if (typeof L === "undefined") {
      document.body.innerHTML = '<div class="error">Map unavailable offline.<br/>The list below still works.</div>';
    } else {
      var interactive = ${interactive ? "true" : "false"};
      var map = L.map("map", {
        zoomControl: interactive,
        dragging: interactive,
        scrollWheelZoom: interactive,
        doubleClickZoom: interactive,
        touchZoom: interactive,
        attributionControl: true
      }).setView([${latitude}, ${longitude}], ${zoom});

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap"
      }).addTo(map);

      // The WebView/iframe can be resized after Leaflet starts (layout,
      // keyboard, tab switch): recompute the map size when that happens.
      var FIT_OPTIONS = { paddingTopLeft: [24, 44], paddingBottomRight: [24, 12], maxZoom: 14 };
      var lastFit = null;
      function refreshSize() {
        map.invalidateSize();
        if (lastFit) map.fitBounds(lastFit, FIT_OPTIONS);
      }
      window.addEventListener("resize", refreshSize);
      if (window.ResizeObserver) new ResizeObserver(refreshSize).observe(document.getElementById("map"));

      var markerLayer = L.layerGroup().addTo(map);
      var pickedMarker = null;
      var userMarker = null;

      map.on("click", function (event) {
        send({ type: "mapPress", latitude: event.latlng.lat, longitude: event.latlng.lng });
      });

      function escapeHtml(text) {
        return String(text).replace(/[&<>"']/g, function (c) {
          return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
      }

      window.applyUpdate = function (data) {
        map.invalidateSize();
        if (data.view) {
          lastFit = null;
          map.setView([data.view.latitude, data.view.longitude], data.view.zoom || map.getZoom());
        }

        markerLayer.clearLayers();
        var bounds = [];
        (data.markers || []).forEach(function (m) {
          var classes = "price-pin" + (m.mine ? " mine" : "") + (m.paused ? " paused" : "") + (m.selected ? " selected" : "");
          var icon = L.divIcon({ className: "", html: '<div class="' + classes + '">' + escapeHtml(m.label) + "</div>", iconSize: [0, 0] });
          var marker = L.marker([m.latitude, m.longitude], { icon: icon, keyboard: false });
          marker.on("click", function (e) {
            L.DomEvent.stopPropagation(e);
            send({ type: "markerPress", id: m.id });
          });
          marker.addTo(markerLayer);
          bounds.push([m.latitude, m.longitude]);
        });

        if (pickedMarker) { map.removeLayer(pickedMarker); pickedMarker = null; }
        if (data.picked) {
          pickedMarker = L.marker([data.picked.latitude, data.picked.longitude], {
            icon: L.divIcon({ className: "", html: '<div class="pick-pin"></div>', iconSize: [0, 0] })
          }).addTo(map);
        }

        if (userMarker) { map.removeLayer(userMarker); userMarker = null; }
        if (data.user) {
          userMarker = L.marker([data.user.latitude, data.user.longitude], {
            icon: L.divIcon({ className: "", html: '<div class="user-dot"></div>', iconSize: [0, 0] }),
            interactive: false
          }).addTo(map);
          bounds.push([data.user.latitude, data.user.longitude]);
        }

        if (data.fit && bounds.length > 1) {
          lastFit = bounds;
          map.fitBounds(bounds, FIT_OPTIONS);
        }
      };

      window.addEventListener("message", function (event) {
        try {
          var data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
          if (data && data.type === "update") window.applyUpdate(data);
        } catch (e) {}
      });

      send({ type: "ready" });
    }
  </script>
</body>
</html>`;
}
