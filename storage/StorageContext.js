import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ME,
  STATION_DEFAULTS,
  SIMULATED_DRIVERS,
  SIMULATED_MESSAGES,
  buildDefaultUser,
  buildSeedBookings,
  buildSeedRequests,
  buildSeedStations,
  estimateCost,
  estimateKwh,
} from "./seed";
import { atTime, formatSlot } from "../utils/dates";
import {
  cancelReminder,
  notifyNow,
  scheduleBookingReminder,
} from "../utils/notifications";
import { deletePhoto, persistPhoto } from "../utils/files";

// AI-assisted: the useReducer + Context + AsyncStorage persistence pattern
// in this file was designed and written with AI help.
//
// Week 6 – local storage:
//  • the whole app state is serialised to JSON and saved with AsyncStorage
//    (key-value storage, works in Expo Go and Snack — MMKV doesn't);
//  • the login session is kept under its own key ("remember me");
//  • photos are copied into the app's private folder (see utils/files.js).
//
// There is no backend (out of scope), so the host side is simulated:
// a request you send is answered by the "host" a few seconds later, and
// a new listing receives a request from a simulated driver.
const STATE_KEY = "evroute.state.v2";
const SESSION_KEY = "evroute.session";
const LEGACY_STATIONS_KEY = "evroute.stations";
const SCHEMA_VERSION = 2;
const TICK_MS = 2000;

const StorageContext = createContext(null);

function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function withStationDefaults(station) {
  return { ...STATION_DEFAULTS, ...station };
}

function buildSeedState() {
  const stations = buildSeedStations();
  return {
    stations,
    bookings: buildSeedBookings(stations),
    requests: buildSeedRequests(stations),
    user: buildDefaultUser(),
  };
}

function safeParse(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn("Ignoring corrupted saved data", error);
    return null;
  }
}

const initialState = {
  hydrated: false,
  stations: [],
  bookings: [],
  requests: [],
  user: buildDefaultUser(),
  session: { loggedIn: false, remember: false },
};

function storageReducer(state, action) {
  switch (action.type) {
    case "HYDRATE":
      return { ...state, ...action.payload, hydrated: true };
    case "RESET":
      return { ...state, ...action.payload };
    case "LOG_IN":
      return {
        ...state,
        session: { loggedIn: true, remember: action.remember },
        user: { ...state.user, ...action.user },
      };
    case "LOG_OUT":
      return { ...state, session: { loggedIn: false, remember: false } };
    case "UPDATE_USER":
      return { ...state, user: { ...state.user, ...action.changes } };

    case "ADD_STATION":
      return {
        ...state,
        stations: [action.station, ...state.stations],
        requests: action.incomingRequest
          ? [action.incomingRequest, ...state.requests]
          : state.requests,
      };
    case "UPDATE_STATION":
      return {
        ...state,
        stations: state.stations.map((s) =>
          s.id === action.id ? { ...s, ...action.changes } : s,
        ),
      };
    case "DELETE_STATION":
      return {
        ...state,
        stations: state.stations.filter((s) => s.id !== action.id),
        requests: state.requests.filter((r) => r.stationId !== action.id),
      };

    case "ADD_BOOKING":
      return { ...state, bookings: [action.booking, ...state.bookings] };
    case "CANCEL_BOOKING":
      return {
        ...state,
        bookings: state.bookings.map((b) =>
          b.id === action.id
            ? { ...b, status: "cancelled", reminderId: null }
            : b,
        ),
      };
    case "SET_BOOKING_REMINDER":
      return {
        ...state,
        bookings: state.bookings.map((b) =>
          b.id === action.id ? { ...b, reminderId: action.reminderId } : b,
        ),
      };
    case "RATE_BOOKING": {
      const target = state.bookings.find((b) => b.id === action.id);
      if (!target) return state;
      const previous = target.rating || 0;
      return {
        ...state,
        bookings: state.bookings.map((b) =>
          b.id === action.id ? { ...b, rating: action.rating } : b,
        ),
        // Keep the charger's average rating in sync with the driver's review.
        stations: state.stations.map((s) =>
          s.id === target.stationId
            ? {
                ...s,
                ratingTotal: s.ratingTotal - previous + action.rating,
                ratingCount: s.ratingCount + (previous ? 0 : 1),
              }
            : s,
        ),
      };
    }

    case "SET_REQUEST_STATUS":
      return {
        ...state,
        requests: state.requests.map((r) =>
          r.id === action.id ? { ...r, status: action.status } : r,
        ),
      };

    case "PROCESS_DUE":
      return {
        ...state,
        bookings: state.bookings.map((b) =>
          action.bookingStatuses[b.id]
            ? { ...b, status: action.bookingStatuses[b.id], hostReplyAt: null }
            : b,
        ),
        requests: state.requests.map((r) =>
          action.requestIds.includes(r.id) ? { ...r, announced: true } : r,
        ),
      };

    default:
      return state;
  }
}

export function StorageProvider({ children }) {
  const [state, dispatch] = useReducer(storageReducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  // --- Load saved data once at startup ---------------------------------
  useEffect(() => {
    async function hydrate() {
      let payload = null;
      let session = initialState.session;
      try {
        const [savedState, savedSession, legacyStations] = await Promise.all([
          AsyncStorage.getItem(STATE_KEY),
          AsyncStorage.getItem(SESSION_KEY),
          AsyncStorage.getItem(LEGACY_STATIONS_KEY),
        ]);

        const parsed = safeParse(savedState);
        if (parsed && parsed.version === SCHEMA_VERSION) {
          payload = {
            stations: (parsed.stations || []).map(withStationDefaults),
            bookings: parsed.bookings || [],
            requests: parsed.requests || [],
            user: { ...buildDefaultUser(), ...parsed.user },
          };
        } else {
          payload = buildSeedState();
          // Keep chargers created with the previous version of the app.
          const legacy = safeParse(legacyStations) || [];
          legacy
            .filter(
              (s) => s && s.id !== "1" && s.id !== "2" && s.latitude != null,
            )
            .forEach((s) =>
              payload.stations.unshift(
                withStationDefaults({
                  ...s,
                  id: `legacy-${s.id}`,
                  ownerId: ME,
                  ownerName: "You",
                }),
              ),
            );
        }

        const parsedSession = safeParse(savedSession);
        if (parsedSession && parsedSession.remember) session = parsedSession;
      } catch (error) {
        console.warn("Could not read saved data, starting fresh", error);
        payload = buildSeedState();
      }
      dispatch({ type: "HYDRATE", payload: { ...payload, session } });
    }
    hydrate();
  }, []);

  // --- Save whenever data changes (only after loading finished) --------
  useEffect(() => {
    if (!state.hydrated) return;
    const snapshot = {
      version: SCHEMA_VERSION,
      savedAt: new Date().toISOString(),
      stations: state.stations,
      bookings: state.bookings,
      requests: state.requests,
      user: state.user,
    };
    AsyncStorage.setItem(STATE_KEY, JSON.stringify(snapshot)).catch((error) =>
      console.warn("Could not save data", error),
    );
  }, [
    state.hydrated,
    state.stations,
    state.bookings,
    state.requests,
    state.user,
  ]);

  useEffect(() => {
    if (!state.hydrated) return;
    AsyncStorage.setItem(SESSION_KEY, JSON.stringify(state.session)).catch(
      () => {},
    );
  }, [state.hydrated, state.session]);

  // --- Simulated host / driver activity --------------------------------
  // Every couple of seconds, answer requests whose reply time has passed
  // and reveal scheduled incoming requests. Side effects (notifications)
  // run after the reducer update.
  useEffect(() => {
    if (!state.hydrated) return undefined;
    const timer = setInterval(() => {
      const current = stateRef.current;
      const now = Date.now();
      const dueBookings = current.bookings.filter(
        (b) => b.status === "waiting" && b.hostReplyAt && b.hostReplyAt <= now,
      );
      const dueRequests = current.requests.filter(
        (r) => !r.announced && r.visibleAt <= now,
      );
      if (!dueBookings.length && !dueRequests.length) return;

      const bookingStatuses = {};
      dueBookings.forEach((b) => {
        const station = current.stations.find((s) => s.id === b.stationId);
        bookingStatuses[b.id] =
          station && station.active ? "confirmed" : "declined";
      });
      dispatch({
        type: "PROCESS_DUE",
        bookingStatuses,
        requestIds: dueRequests.map((r) => r.id),
      });

      const enabled = current.user.notificationsEnabled;
      dueBookings.forEach(async (b) => {
        const status = bookingStatuses[b.id];
        await notifyNow(
          status === "confirmed" ? "Booking confirmed ✅" : "Booking declined",
          `${b.stationName} · ${formatSlot(b.start, b.durationMin)}`,
          enabled,
        );
        if (status === "confirmed") {
          const reminderId = await scheduleBookingReminder({
            startIso: b.start,
            stationName: b.stationName,
            enabled,
          });
          if (reminderId)
            dispatch({ type: "SET_BOOKING_REMINDER", id: b.id, reminderId });
        }
      });
      dueRequests.forEach((r) =>
        notifyNow(
          "New booking request",
          `${r.requesterName} wants to charge at ${r.stationName}`,
          enabled,
        ),
      );
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [state.hydrated]);

  // --- Actions ----------------------------------------------------------
  const logIn = useCallback(
    (user, remember) => dispatch({ type: "LOG_IN", user, remember }),
    [],
  );
  const logOut = useCallback(() => dispatch({ type: "LOG_OUT" }), []);
  const updateUser = useCallback(
    (changes) => dispatch({ type: "UPDATE_USER", changes }),
    [],
  );

  const addStation = useCallback(async (form) => {
    const photoUri = await persistPhoto(form.photoUri);
    const station = withStationDefaults({
      ...form,
      photoUri,
      id: makeId("s"),
      ownerId: ME,
      ownerName: "You",
      createdAt: new Date().toISOString(),
    });
    // A simulated driver discovers the new listing ~20 seconds later.
    const duration = randomItem([60, 90, 120]);
    const incomingRequest = {
      id: makeId("r"),
      stationId: station.id,
      stationName: station.name,
      requesterName: randomItem(SIMULATED_DRIVERS),
      message: randomItem(SIMULATED_MESSAGES),
      start: atTime(1, randomItem([9, 12, 17, 19])).toISOString(),
      durationMin: duration,
      total: estimateCost(station, duration),
      status: "pending",
      visibleAt: Date.now() + 20000,
      announced: false,
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: "ADD_STATION", station, incomingRequest });
    return station;
  }, []);

  const updateStation = useCallback(async (id, changes) => {
    const existing = stateRef.current.stations.find((s) => s.id === id);
    const next = { ...changes };
    if (
      existing &&
      changes.photoUri !== undefined &&
      changes.photoUri !== existing.photoUri
    ) {
      next.photoUri = await persistPhoto(changes.photoUri);
      deletePhoto(existing.photoUri);
    }
    dispatch({ type: "UPDATE_STATION", id, changes: next });
  }, []);

  const deleteStation = useCallback((id) => {
    const existing = stateRef.current.stations.find((s) => s.id === id);
    if (existing) deletePhoto(existing.photoUri);
    dispatch({ type: "DELETE_STATION", id });
  }, []);

  const requestBooking = useCallback(
    ({ station, start, durationMin, message }) => {
      const booking = {
        id: makeId("b"),
        stationId: station.id,
        stationName: station.name,
        start,
        durationMin,
        estimatedKwh: estimateKwh(station.kw, durationMin),
        total: estimateCost(station, durationMin),
        message: message.trim(),
        status: "waiting",
        rating: null,
        reminderId: null,
        // The simulated host answers 8–15 seconds later.
        hostReplyAt: Date.now() + 8000 + Math.round(Math.random() * 7000),
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: "ADD_BOOKING", booking });
      return booking;
    },
    [],
  );

  const cancelBooking = useCallback((id) => {
    const booking = stateRef.current.bookings.find((b) => b.id === id);
    if (booking) cancelReminder(booking.reminderId);
    dispatch({ type: "CANCEL_BOOKING", id });
  }, []);

  const rateBooking = useCallback(
    (id, rating) => dispatch({ type: "RATE_BOOKING", id, rating }),
    [],
  );

  const respondToRequest = useCallback(
    (id, status) => dispatch({ type: "SET_REQUEST_STATUS", id, status }),
    [],
  );

  const resetDemoData = useCallback(() => {
    const current = stateRef.current;
    current.bookings.forEach((b) => cancelReminder(b.reminderId));
    current.stations
      .filter((s) => s.ownerId === ME)
      .forEach((s) => deletePhoto(s.photoUri));
    const seed = buildSeedState();
    dispatch({
      type: "RESET",
      payload: {
        ...seed,
        user: {
          ...seed.user,
          email: current.user.email,
          name: current.user.name,
        },
      },
    });
  }, []);

  const value = useMemo(() => {
    const myStations = state.stations.filter((s) => s.ownerId === ME);
    const visibleRequests = state.requests.filter((r) => r.announced);
    return {
      ...state,
      myStations,
      visibleRequests,
      pendingRequestCount: visibleRequests.filter((r) => r.status === "pending")
        .length,
      logIn,
      logOut,
      updateUser,
      addStation,
      updateStation,
      deleteStation,
      requestBooking,
      cancelBooking,
      rateBooking,
      respondToRequest,
      resetDemoData,
    };
  }, [
    state,
    logIn,
    logOut,
    updateUser,
    addStation,
    updateStation,
    deleteStation,
    requestBooking,
    cancelBooking,
    rateBooking,
    respondToRequest,
    resetDemoData,
  ]);

  return (
    <StorageContext.Provider value={value}>{children}</StorageContext.Provider>
  );
}

export function useStorage() {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error("useStorage must be used within a StorageProvider");
  }
  return context;
}

// Average rating of a charger, e.g. 4.8 (or null when no reviews yet).
export function stationRating(station) {
  if (!station || !station.ratingCount) return null;
  return Math.round((station.ratingTotal / station.ratingCount) * 10) / 10;
}

// "completed" isn't stored: a confirmed session whose end time has passed.
export function bookingDisplayStatus(booking, now = Date.now()) {
  const end = new Date(booking.start).getTime() + booking.durationMin * 60000;
  if (booking.status === "confirmed" && end < now) return "completed";
  return booking.status;
}
