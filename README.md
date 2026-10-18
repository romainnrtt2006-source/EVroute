# EVRoute — Share a charger. Find a charge.

INFT2051 Mobile Application Programming — Assignment project by Romain Neret.

EVRoute is a marketplace for private EV chargers. Drivers search a city, see chargers on a map, and request a time slot. Hosts list their home charger and accept or decline requests. One profile can do both.

## Run it

- **Expo Snack**: open the project and scan the QR code with Expo Go (SDK 51), or use the Web tab.
- **Locally**: `npm install` then `npx expo start`.

## Features

| Screen          | What works                                                                                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Login           | Email and password validation, sign-up mode, show/hide password, "Remember me" (the session is saved, so the app opens on the tabs next time)                                               |
| Search tab      | City search through a REST API, "near me" with GPS, Leaflet map with price pins, connector filters, sort by distance, price or rating, distance shown on every card                         |
| Charger detail  | Photo, rating, specs, compatibility with your car, access notes, mini map, directions. Owners can pause, edit or delete a listing                                                           |
| Booking request | Next 14 days, duration, start-time grid (past slots and clashes with your other bookings are crossed out), energy and price estimate                                                        |
| Bookings tab    | **Driving**: upcoming bookings and history, cancel, rate completed charges. **Hosting**: requests to answer, Accept/Decline with an overlap check, earnings summary, and a badge on the tab |
| Add tab         | Camera or gallery photo, map pin with automatic address lookup, connector, power, price, availability presets, inline validation. The same screen is reused to edit a listing               |
| Profile         | Real stats, my chargers (with live on/off switches), vehicle connector, notifications toggle, export of all data as JSON, demo reset, log out                                               |

There is no backend (out of scope), so the other side of the marketplace is simulated:

- the host replies to your request 8–15 seconds after you send it;
- a new listing gets a request from a simulated driver about 20 seconds later.

Both trigger a local notification on the phone, or an in-app banner on the web.

## Course topics used

**Week 6 – Local and cloud storage**

- `AsyncStorage` (key-value): the whole app state is saved as JSON and loaded at startup, with a schema version, recovery from corrupted data and migration of chargers saved by the previous version (`storage/StorageContext.js`).
- `expo-file-system`: photos are copied from the cache into the app's private document folder so they survive restarts, and deleted along with their charger. The JSON export is written to a file (`utils/files.js`).
- `expo-image-picker` and `expo-camera`: media from the gallery or the camera.
- `expo-sharing`: share the exported JSON file.

**Week 7 – Networking**

- REST `GET` requests to OpenStreetMap Nominatim (`api/geocoding.js`): `/search` turns a city into coordinates, and `/reverse` turns a map pin into an address.
- The code covers query parameters, headers (`Accept`, `Accept-Language`, `User-Agent`), JSON parsing, HTTP status checks, an 8-second timeout with `AbortController`, an in-memory cache and an offline fallback list of cities.

**Other**: React Navigation (a stack plus 4 tabs, nested), Context + `useReducer`, `expo-location`, `expo-notifications` (a reminder 30 minutes before a confirmed booking), a map component that works on both phone and web (`components/Map.js` and `Map.web.js`), and reusable UI components (`components/ui.js`).

## Project structure

```
App.js                  providers, splash while loading, root stack
navigation/MainTabs.js  Search · Bookings · Add · Profile
screens/                one file per screen (+ CameraModal)
components/             ui kit, StationCard, map (WebView / iframe + Leaflet), toasts
storage/                reducer + persistence, demo seed data
api/geocoding.js        REST client (Nominatim)
utils/                  dates, geo, files, notifications, location, dialogs
```

## Generative AI declaration

Generative AI tools (Claude) were used to help with coding, debugging, interface design and documentation, as the course allows. Files where AI wrote a significant part say so in a comment at the top.
