import React, { createContext, useContext, useEffect, useReducer } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Using AsyncStorage instead of the Week 6 lab's react-native-mmkv: MMKV is
// a native module that isn't available in Expo Snack or plain Expo Go
// (it needs a custom dev client), and the app needs to keep running in
// Snack for live demos. AsyncStorage is part of the standard Expo SDK, so
// it works everywhere, at the cost of an async (not synchronous) API -
// the useReducer + Context pattern from the lab stays the same either way.
const STATIONS_KEY = "evroute.stations";
const MY_BOOKINGS_KEY = "evroute.myBookings";
const REQUESTS_RECEIVED_KEY = "evroute.requestsReceived";

// Seed data so every screen has something to show on first launch, before
// the user has created stations/bookings of their own. Matches the sample
// content from the wireframes (Marie's charger, Tom's charger, etc.).
const SEED_STATIONS = [
  {
    id: "1",
    name: "Marie's charger",
    type: "Type 2",
    kw: 7,
    pricePerKwh: 0.35,
    availability: "Mon-Fri 6-10pm, weekends all day",
    accessNotes: "Driveway on the left",
    photoUri: null,
    latitude: -32.9283,
    longitude: 151.7817,
  },
  {
    id: "2",
    name: "Tom's charger",
    type: "CCS",
    kw: 22,
    pricePerKwh: 0.5,
    availability: "Weekdays after 5pm",
    accessNotes: "Garage roller door, text on arrival",
    photoUri: null,
    latitude: -32.8936,
    longitude: 151.7028,
  },
];

const SEED_MY_BOOKINGS = [
  {
    id: "b1",
    stationName: "Marie's charger",
    date: "Fri, 5 Sep",
    timeSlot: "6:00 PM - 8:00 PM",
    status: "waiting",
    rating: null,
  },
  {
    id: "b2",
    stationName: "Tom's charger",
    date: "Sat, 6 Sep",
    timeSlot: "2:00 PM - 3:30 PM",
    status: "confirmed",
    rating: 5,
  },
  {
    id: "b3",
    stationName: "Alex's charger",
    date: "Wed, 3 Sep",
    timeSlot: "10:00 AM - 11:00 AM",
    status: "declined",
    rating: null,
  },
];

// Bookings other people have sent for stations the current (mock) user
// owns. There's no real multi-user backend here, so this is just a
// separate mock list rather than being derived from real station
// ownership - kept simple on purpose for a local-only demo app.
const SEED_REQUESTS_RECEIVED = [
  {
    id: "r1",
    requesterName: "Jordan D.",
    date: "Fri, 5 Sep",
    timeSlot: "6:00 PM - 8:00 PM",
    message: "Hi, I'll pass by at 6pm",
    status: "pending",
  },
  {
    id: "r2",
    requesterName: "Sam L.",
    date: "Sat, 6 Sep",
    timeSlot: "1:00 PM - 2:00 PM",
    message: "",
    status: "confirmed",
  },
];

// Defaults for fields older/stale persisted stations might not have (e.g.
// ones saved by an earlier version of the app, before price/type/etc.
// existed). Applied both to freshly created stations and to anything
// loaded back out of AsyncStorage, so a schema change here can never
// crash a screen that expects these fields to be present.
const STATION_DEFAULTS = {
  type: "Home charger",
  kw: 7,
  pricePerKwh: 0.3,
  availability: "Contact host for availability",
  accessNotes: "No notes provided",
  photoUri: null,
};

function withStationDefaults(station) {
  return { ...STATION_DEFAULTS, ...station };
}

const StorageContext = createContext(null);

const initialState = {
  stations: [],
  myBookings: [],
  requestsReceived: [],
};

function storageReducer(state, action) {
  switch (action.type) {
    case "HYDRATE":
      return action.payload;
    case "ADD_STATION":
      return { ...state, stations: [...state.stations, action.station] };
    case "ADD_BOOKING":
      return { ...state, myBookings: [...state.myBookings, action.booking] };
    case "SET_REQUEST_STATUS":
      return {
        ...state,
        requestsReceived: state.requestsReceived.map((request) =>
          request.id === action.id
            ? { ...request, status: action.status }
            : request
        ),
      };
    default:
      return state;
  }
}

export function StorageProvider({ children }) {
  const [state, dispatch] = useReducer(storageReducer, initialState);

  // Load everything once when the app starts. Each piece of data falls
  // back to its own seed list if nothing was saved yet (first run).
  useEffect(() => {
    async function hydrate() {
      const [stationsRaw, bookingsRaw, requestsRaw] = await Promise.all([
        AsyncStorage.getItem(STATIONS_KEY),
        AsyncStorage.getItem(MY_BOOKINGS_KEY),
        AsyncStorage.getItem(REQUESTS_RECEIVED_KEY),
      ]);

      const loadedStations = stationsRaw
        ? JSON.parse(stationsRaw).map(withStationDefaults)
        : SEED_STATIONS;

      dispatch({
        type: "HYDRATE",
        payload: {
          stations: loadedStations,
          myBookings: bookingsRaw ? JSON.parse(bookingsRaw) : SEED_MY_BOOKINGS,
          requestsReceived: requestsRaw
            ? JSON.parse(requestsRaw)
            : SEED_REQUESTS_RECEIVED,
        },
      });
    }

    hydrate();
  }, []);

  // Persist each list to its own key whenever it changes, so everything
  // survives an app reload. JSON.stringify is enough since these are all
  // plain strings/numbers - no need for a more complex serialization.
  useEffect(() => {
    if (state.stations.length > 0) {
      AsyncStorage.setItem(STATIONS_KEY, JSON.stringify(state.stations));
    }
  }, [state.stations]);

  useEffect(() => {
    if (state.myBookings.length > 0) {
      AsyncStorage.setItem(MY_BOOKINGS_KEY, JSON.stringify(state.myBookings));
    }
  }, [state.myBookings]);

  useEffect(() => {
    if (state.requestsReceived.length > 0) {
      AsyncStorage.setItem(
        REQUESTS_RECEIVED_KEY,
        JSON.stringify(state.requestsReceived)
      );
    }
  }, [state.requestsReceived]);

  const addStation = (station) => {
    dispatch({
      type: "ADD_STATION",
      // withStationDefaults covers fields the Create Station form doesn't
      // collect (type/price/availability), so this station still renders
      // correctly on the Charger Details screen.
      station: { ...withStationDefaults(station), id: Date.now().toString() },
    });
  };

  const addBooking = (booking) => {
    dispatch({
      type: "ADD_BOOKING",
      booking: { ...booking, id: Date.now().toString(), status: "waiting" },
    });
  };

  const setRequestStatus = (id, status) => {
    dispatch({ type: "SET_REQUEST_STATUS", id, status });
  };

  return (
    <StorageContext.Provider
      value={{
        stations: state.stations,
        myBookings: state.myBookings,
        requestsReceived: state.requestsReceived,
        addStation,
        addBooking,
        setRequestStatus,
      }}
    >
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
