// Shared design tokens so every screen looks like part of the same app.
export const colors = {
  primary: "#0F9D58",
  primaryDark: "#0B7A43",
  primaryLight: "#E6F4EC",
  background: "#FFFFFF",
  surface: "#F5F7F9",
  border: "#E1E4E8",
  text: "#14181F",
  textMuted: "#5F6368",
  textFaint: "#9AA0A6",
  onPrimary: "#FFFFFF",
  danger: "#D64545",
  dangerLight: "#FBEAEA",
  warning: "#B7791F",
  warningLight: "#FDF3E1",
  info: "#2B6CB0",
  infoLight: "#E8F0FA",
  star: "#E8A93B",
  overlay: "rgba(20, 24, 31, 0.55)",
};

// One place to map a status to its label and colours (used by badges).
export const statusStyles = {
  waiting: { label: "Waiting", color: colors.warning, bg: colors.warningLight },
  pending: { label: "Pending", color: colors.warning, bg: colors.warningLight },
  confirmed: {
    label: "Confirmed",
    color: colors.primaryDark,
    bg: colors.primaryLight,
  },
  completed: { label: "Completed", color: colors.info, bg: colors.infoLight },
  declined: { label: "Declined", color: colors.danger, bg: colors.dangerLight },
  cancelled: {
    label: "Cancelled",
    color: colors.textMuted,
    bg: colors.surface,
  },
  paused: { label: "Paused", color: colors.textMuted, bg: colors.surface },
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
  md: 10,
  lg: 14,
  round: 999,
};

export const typography = {
  title: { fontSize: 26, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted },
  heading: { fontSize: 18, fontWeight: "700", color: colors.text },
  body: { fontSize: 15, color: colors.text },
  label: { fontSize: 13, fontWeight: "700", color: colors.text },
  caption: { fontSize: 13, color: colors.textMuted },
  small: { fontSize: 12, color: colors.textMuted },
};

export const cardShadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.07,
  shadowRadius: 6,
  elevation: 2,
};
