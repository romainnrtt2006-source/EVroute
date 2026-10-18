import { atTime } from "../utils/dates";

// Demo data. Dates are generated relative to "now" so the bookings are
// always realistic (upcoming ones stay upcoming) whenever the app is opened.
export const ME = "me";

export const CONNECTOR_TYPES = ["Type 2", "CCS", "CHAdeMO", "Type 1"];
export const POWER_PRESETS = [3.7, 7, 11, 22, 50];
export const DURATIONS = [30, 60, 90, 120, 180, 240];
export const CHARGING_EFFICIENCY = 0.9;
export const MAX_SESSION_KWH = 60;

// Energy a car can take in a session, limited by the charger power.
export function estimateKwh(kw, durationMin) {
  const kwh = kw * (durationMin / 60) * CHARGING_EFFICIENCY;
  return Math.min(Math.round(kwh * 10) / 10, MAX_SESSION_KWH);
}

export function estimateCost(station, durationMin) {
  return (
    Math.round(
      estimateKwh(station.kw, durationMin) * station.pricePerKwh * 100,
    ) / 100
  );
}

export const STATION_DEFAULTS = {
  ownerId: "other",
  ownerName: "Host",
  type: "Type 2",
  kw: 7,
  pricePerKwh: 0.3,
  address: "",
  suburb: "",
  availability: "Contact the host for availability",
  accessNotes: "",
  photoUri: null,
  active: true,
  ratingTotal: 0,
  ratingCount: 0,
};

function station(fields) {
  return {
    ...STATION_DEFAULTS,
    createdAt: new Date().toISOString(),
    ...fields,
  };
}

export function buildSeedStations() {
  return [
    station({
      id: "s-marie",
      ownerName: "Marie",
      name: "Marie's charger",
      type: "Type 2",
      kw: 7,
      pricePerKwh: 0.35,
      suburb: "Adamstown, NSW",
      address: "Brunker Rd, Adamstown, NSW",
      availability: "Mon–Fri 6–10 PM, weekends all day",
      accessNotes: "Driveway on the left, cable in the green box.",
      latitude: -32.934,
      longitude: 151.726,
      ratingTotal: 58,
      ratingCount: 12,
    }),
    station({
      id: "s-tom",
      ownerName: "Tom",
      name: "Tom's fast charger",
      type: "CCS",
      kw: 25,
      pricePerKwh: 0.5,
      suburb: "Wallsend, NSW",
      address: "Cowper St, Wallsend, NSW",
      availability: "Weekdays after 5 PM",
      accessNotes: "Garage roller door — text Tom on arrival.",
      latitude: -32.8936,
      longitude: 151.7028,
      ratingTotal: 37,
      ratingCount: 8,
    }),
    station({
      id: "s-alex",
      ownerName: "Alex",
      name: "Alex's charger",
      type: "Type 2",
      kw: 11,
      pricePerKwh: 0.4,
      suburb: "Merewether, NSW",
      address: "Glebe Rd, Merewether, NSW",
      availability: "Every day 8 AM – 8 PM",
      accessNotes: "Park on the street side, charger on the carport wall.",
      latitude: -32.944,
      longitude: 151.752,
      ratingTotal: 21,
      ratingCount: 5,
    }),
    station({
      id: "s-priya",
      ownerName: "Priya",
      name: "Priya's charger",
      type: "Type 2",
      kw: 7,
      pricePerKwh: 0.32,
      suburb: "Hamilton, NSW",
      address: "Beaumont St, Hamilton, NSW",
      availability: "Evenings and weekends",
      accessNotes: "Shared driveway, use the left bay.",
      latitude: -32.923,
      longitude: 151.748,
      ratingTotal: 45,
      ratingCount: 10,
    }),
    station({
      id: "s-ben",
      ownerName: "Ben",
      name: "Ben's CHAdeMO",
      type: "CHAdeMO",
      kw: 20,
      pricePerKwh: 0.45,
      suburb: "Charlestown, NSW",
      address: "Pacific Hwy, Charlestown, NSW",
      availability: "Weekends only",
      accessNotes: "Ring the bell, Ben will unlock the gate.",
      latitude: -32.964,
      longitude: 151.693,
      ratingTotal: 12,
      ratingCount: 3,
    }),
    station({
      id: "s-lena",
      ownerName: "Lena",
      name: "Lena's charger",
      type: "Type 2",
      kw: 7.4,
      pricePerKwh: 0.3,
      suburb: "Lambton, NSW",
      address: "Elder St, Lambton, NSW",
      availability: "Every day 7 AM – 10 PM",
      accessNotes: "5 min from the Callaghan campus.",
      latitude: -32.91,
      longitude: 151.709,
      ratingTotal: 29,
      ratingCount: 6,
    }),
    station({
      id: "s-jack",
      ownerName: "Jack",
      name: "Jack's beach charger",
      type: "Type 2",
      kw: 22,
      pricePerKwh: 0.55,
      suburb: "Newcastle East, NSW",
      address: "Scott St, Newcastle East, NSW",
      availability: "Mon–Sat 9 AM – 6 PM",
      accessNotes: "Underground car park, bay 14.",
      latitude: -32.929,
      longitude: 151.788,
      ratingTotal: 18,
      ratingCount: 4,
    }),
    station({
      id: "s-sophie",
      ownerName: "Sophie",
      name: "Sophie's farm charger",
      type: "CCS",
      kw: 50,
      pricePerKwh: 0.6,
      suburb: "Maitland, NSW",
      address: "High St, Maitland, NSW",
      availability: "Every day, call ahead",
      accessNotes: "Large gravel area, fits a trailer.",
      latitude: -32.733,
      longitude: 151.557,
      ratingTotal: 14,
      ratingCount: 3,
    }),
    station({
      id: "s-chris",
      ownerName: "Chris",
      name: "Chris's city charger",
      type: "Type 2",
      kw: 7,
      pricePerKwh: 0.45,
      suburb: "Surry Hills, NSW",
      address: "Crown St, Surry Hills, NSW",
      availability: "Weeknights after 7 PM",
      accessNotes: "Laneway garage, blue door.",
      latitude: -33.886,
      longitude: 151.211,
      ratingTotal: 23,
      ratingCount: 5,
    }),
    station({
      id: "s-mia",
      ownerName: "Mia",
      name: "Mia's Bondi charger",
      type: "CCS",
      kw: 25,
      pricePerKwh: 0.58,
      suburb: "Bondi, NSW",
      address: "Curlewis St, Bondi, NSW",
      availability: "Every day 6 AM – 9 PM",
      accessNotes: "Visitor spot out front.",
      latitude: -33.8915,
      longitude: 151.2767,
      ratingTotal: 26,
      ratingCount: 6,
    }),
    station({
      id: "s-mine",
      ownerId: ME,
      ownerName: "You",
      name: "My home charger",
      type: "Type 2",
      kw: 7,
      pricePerKwh: 0.3,
      suburb: "Shortland, NSW",
      address: "Sandgate Rd, Shortland, NSW",
      availability: "Weekdays 9 AM – 5 PM",
      accessNotes: "Front driveway, cable hangs next to the door.",
      latitude: -32.879,
      longitude: 151.69,
      ratingTotal: 24,
      ratingCount: 5,
    }),
  ];
}

function booking(stations, stationId, start, durationMin, fields) {
  const s = stations.find((item) => item.id === stationId);
  return {
    stationId,
    stationName: s.name,
    start: start.toISOString(),
    durationMin,
    estimatedKwh: estimateKwh(s.kw, durationMin),
    total: estimateCost(s, durationMin),
    message: "",
    rating: null,
    reminderId: null,
    hostReplyAt: null,
    createdAt: new Date().toISOString(),
    ...fields,
  };
}

export function buildSeedBookings(stations) {
  return [
    // Still waiting: the simulated host answers ~25 s after first launch.
    booking(stations, "s-marie", atTime(1, 18), 120, {
      id: "b-1",
      status: "waiting",
      message: "I'll be there right at 6.",
      hostReplyAt: Date.now() + 25000,
    }),
    booking(stations, "s-tom", atTime(2, 14), 90, {
      id: "b-2",
      status: "confirmed",
    }),
    booking(stations, "s-alex", atTime(-3, 10), 60, {
      id: "b-3",
      status: "declined",
    }),
    // Finished but not rated yet, so the rating flow can be shown.
    booking(stations, "s-priya", atTime(-5, 19), 120, {
      id: "b-4",
      status: "confirmed",
    }),
    booking(stations, "s-lena", atTime(-9, 8), 60, {
      id: "b-5",
      status: "confirmed",
      rating: 4,
    }),
  ];
}

function request(stations, fields, start, durationMin) {
  const s = stations.find((item) => item.id === "s-mine");
  return {
    stationId: s.id,
    stationName: s.name,
    start: start.toISOString(),
    durationMin,
    total: estimateCost(s, durationMin),
    message: "",
    visibleAt: Date.now(),
    announced: true,
    createdAt: new Date().toISOString(),
    ...fields,
  };
}

export function buildSeedRequests(stations) {
  return [
    request(
      stations,
      {
        id: "r-1",
        requesterName: "Jordan D.",
        status: "pending",
        message: "Hi, I'll pass by at 6pm",
      },
      atTime(1, 18),
      120,
    ),
    request(
      stations,
      { id: "r-2", requesterName: "Sam L.", status: "confirmed" },
      atTime(2, 13),
      60,
    ),
    request(
      stations,
      {
        id: "r-3",
        requesterName: "Taylor K.",
        status: "pending",
        message: "Need a top-up before driving to Sydney.",
      },
      atTime(3, 9),
      90,
    ),
    request(
      stations,
      { id: "r-4", requesterName: "Noah P.", status: "confirmed" },
      atTime(-4, 11),
      120,
    ),
  ];
}

export const SIMULATED_DRIVERS = [
  "Emma W.",
  "Lucas B.",
  "Olivia R.",
  "Ethan M.",
  "Chloe T.",
  "Liam S.",
];
export const SIMULATED_MESSAGES = [
  "Is it OK if I arrive 10 min early?",
  "Visiting family nearby, thanks!",
  "First time using EVRoute :)",
  "",
];

export function buildDefaultUser() {
  return {
    name: "Romain N.",
    email: "",
    memberSince: new Date().toISOString(),
    vehicleConnector: "Type 2",
    notificationsEnabled: true,
    homeCity: "Newcastle, NSW",
    recentSearches: [],
  };
}
