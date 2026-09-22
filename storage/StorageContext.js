import React, { createContext, useContext, useEffect, useReducer } from "react";
import { MMKV } from "react-native-mmkv";

// react-native-mmkv is a native module: it needs a custom dev client
// (`npx expo run:android` / `npx expo run:ios`, or an EAS "development"
// build) - it will NOT work inside the plain Expo Go app. This matches
// what the Week 6 lab uses, so keeping it here even though it means the
// app can no longer be demoed from Expo Go without that extra build step.
const storage = new MMKV();
const STATIONS_KEY = "evroute.stations";

// Seed data so the list isn't empty on first launch, before the user has
// created any stations of their own. Mirrors the old hardcoded
// MOCK_STATIONS array HomeScreen used before this storage layer existed.
const SEED_STATIONS = [
  {
    id: "1",
    name: "Sarah's Home Charger",
    city: "Newcastle",
    latitude: -32.9283,
    longitude: 151.7817,
    photoUri: null,
  },
  {
    id: "2",
    name: "Callaghan Campus Charger",
    city: "Newcastle",
    latitude: -32.8936,
    longitude: 151.7028,
    photoUri: null,
  },
  {
    id: "3",
    name: "Tom's Garage Plug",
    city: "Maitland",
    latitude: -32.7326,
    longitude: 151.5594,
    photoUri: null,
  },
];

const StorageContext = createContext(null);

function stationsReducer(state, action) {
  switch (action.type) {
    case "HYDRATE":
      // Replace in-memory state with whatever was loaded from disk.
      return action.stations;
    case "ADD_STATION":
      return [...state, action.station];
    default:
      return state;
  }
}

export function StorageProvider({ children }) {
  const [stations, dispatch] = useReducer(stationsReducer, []);

  // Load stations once when the app starts. If nothing was saved yet
  // (first run), fall back to the seed list above.
  useEffect(() => {
    const raw = storage.getString(STATIONS_KEY);
    if (raw) {
      dispatch({ type: "HYDRATE", stations: JSON.parse(raw) });
    } else {
      dispatch({ type: "HYDRATE", stations: SEED_STATIONS });
    }
  }, []);

  // Persist to MMKV every time the list changes, so new stations survive
  // an app reload. JSON.stringify is enough here since a station is just
  // plain strings/numbers - no need for a more complex serialization.
  useEffect(() => {
    if (stations.length > 0) {
      storage.set(STATIONS_KEY, JSON.stringify(stations));
    }
  }, [stations]);

  const addStation = (station) => {
    dispatch({
      type: "ADD_STATION",
      station: { ...station, id: Date.now().toString() },
    });
  };

  return (
    <StorageContext.Provider value={{ stations, addStation }}>
      {children}
    </StorageContext.Provider>
  );
}

// Small hook wrapper so screens don't need to import useContext + the
// context object separately, and so a missing <StorageProvider> higher up
// the tree fails loudly instead of returning undefined silently.
export function useStorage() {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error("useStorage must be used within a StorageProvider");
  }
  return context;
}
