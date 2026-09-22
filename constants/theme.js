// Shared design tokens so every screen uses the same colors, spacing and
// radii instead of each one picking its own numbers. Deliberately just a
// plain object of values (no UI library) - the goal is consistency, not a
// full design system.

export const colors = {
  primary: "#0F9D58",
  primaryDark: "#0B7A43",
  background: "#FFFFFF",
  surface: "#F7F8FA",
  border: "#E1E4E8",
  text: "#1A1A1A",
  textMuted: "#5F6368",
  textFaint: "#9AA0A6",
  onPrimary: "#FFFFFF",
  danger: "#D64545",
  // Booking/request status badges (My Bookings, Requests Received).
  statusWaiting: "#B8860B",
  statusConfirmed: "#0F9D58",
  statusDeclined: "#D64545",
  statusPending: "#B8860B",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radii = {
  sm: 6,
  md: 8,
  lg: 12,
  round: 999,
};

export const typography = {
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
  },
  heading: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  body: {
    fontSize: 15,
    color: colors.text,
  },
  caption: {
    fontSize: 13,
    color: colors.textMuted,
  },
};

// A light shadow used on cards/buttons that should look "raised". Split by
// platform since elevation (Android) and shadow* (iOS) aren't the same API.
export const cardShadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.08,
  shadowRadius: 4,
  elevation: 2,
};
