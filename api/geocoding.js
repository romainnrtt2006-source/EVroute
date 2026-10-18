// AI-assisted: written with help from generative AI (Claude), then reviewed and tested.
import { Platform } from "react-native";

// Week 7 – consuming a REST API.
// OpenStreetMap's Nominatim service turns a city name into coordinates
// (GET /search) and coordinates back into an address (GET /reverse).
// It's free and needs no API key, which suits a student project.
// Usage policy: max ~1 request/second and an identifying User-Agent.
const BASE_URL = "https://nominatim.openstreetmap.org";
const TIMEOUT_MS = 8000;

// Built-in fallback so city search still works offline or if the API is down.
const KNOWN_PLACES = [
  { name: "Newcastle, NSW", latitude: -32.9283, longitude: 151.7817 },
  { name: "Callaghan, NSW", latitude: -32.8927, longitude: 151.7042 },
  { name: "Lake Macquarie, NSW", latitude: -33.0333, longitude: 151.6333 },
  { name: "Maitland, NSW", latitude: -32.7333, longitude: 151.55 },
  { name: "Cessnock, NSW", latitude: -32.8342, longitude: 151.3555 },
  { name: "Port Stephens, NSW", latitude: -32.718, longitude: 152.108 },
  { name: "Central Coast, NSW", latitude: -33.425, longitude: 151.342 },
  { name: "Sydney, NSW", latitude: -33.8688, longitude: 151.2093 },
];

const cache = new Map();

// fetch() has no built-in timeout, so we abort it ourselves.
async function getJson(path, params) {
  const query = Object.entries(params)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
    )
    .join("&");
  const url = `${BASE_URL}${path}?${query}`;
  if (cache.has(url)) return cache.get(url);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const headers = { Accept: "application/json", "Accept-Language": "en" };
  // Browsers forbid setting User-Agent, so only send it from the phone.
  if (Platform.OS !== "web") {
    headers["User-Agent"] =
      "EVRoute/1.1 (student project, University of Newcastle)";
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Server answered ${response.status}`);
    }
    const data = await response.json();
    cache.set(url, data);
    return data;
  } finally {
    clearTimeout(timer);
  }
}

function shortName(result) {
  const a = result.address || {};
  const place =
    a.city || a.town || a.suburb || a.village || a.municipality || result.name;
  const state = a.state_code || abbreviateState(a.state);
  return [place, state].filter(Boolean).join(", ") || result.display_name;
}

function abbreviateState(state) {
  const map = {
    "New South Wales": "NSW",
    Victoria: "VIC",
    Queensland: "QLD",
    "South Australia": "SA",
    "Western Australia": "WA",
    Tasmania: "TAS",
    "Australian Capital Territory": "ACT",
    "Northern Territory": "NT",
  };
  return map[state] || state;
}

function findKnownPlace(query) {
  const q = query.trim().toLowerCase();
  return (
    KNOWN_PLACES.find((place) => place.name.toLowerCase().startsWith(q)) ||
    KNOWN_PLACES.find((place) => place.name.toLowerCase().includes(q))
  );
}

// Returns { name, latitude, longitude, offline } or throws a friendly Error.
export async function geocodeCity(query) {
  const text = query.trim();
  if (!text) throw new Error("Type a city or suburb first.");

  try {
    const results = await getJson("/search", {
      q: text,
      format: "jsonv2",
      addressdetails: 1,
      limit: 1,
      countrycodes: "au",
    });
    if (!results.length) {
      const known = findKnownPlace(text);
      if (known) return { ...known, offline: false };
      throw new Error(`No place called "${text}" was found in Australia.`);
    }
    const best = results[0];
    return {
      name: shortName(best),
      latitude: parseFloat(best.lat),
      longitude: parseFloat(best.lon),
      offline: false,
    };
  } catch (error) {
    if (error.message && error.message.startsWith("No place")) throw error;
    const known = findKnownPlace(text);
    if (known) return { ...known, offline: true };
    throw new Error(
      "Couldn't reach the map service. Check your connection and try again.",
    );
  }
}

// Returns { address, suburb } for a pin dropped on the map.
export async function reverseGeocode(latitude, longitude) {
  const result = await getJson("/reverse", {
    lat: latitude.toFixed(6),
    lon: longitude.toFixed(6),
    format: "jsonv2",
    addressdetails: 1,
    zoom: 18,
  });
  const a = result.address || {};
  const street = [a.house_number, a.road].filter(Boolean).join(" ");
  const suburb =
    a.suburb || a.town || a.city_district || a.village || a.city || "";
  const state = abbreviateState(a.state) || "";
  return {
    address:
      [street, suburb, state].filter(Boolean).join(", ") || result.display_name,
    suburb: [suburb, state].filter(Boolean).join(", "),
  };
}

export const QUICK_CITIES = ["Newcastle", "Callaghan", "Maitland", "Sydney"];
export const DEFAULT_PLACE = KNOWN_PLACES[0];
