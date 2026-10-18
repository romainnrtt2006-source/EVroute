// AI-assisted: written with help from generative AI (Claude), then reviewed and tested.
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  cardShadow,
  colors,
  radii,
  spacing,
  statusStyles,
  typography,
} from "../constants/theme";

// Small reusable building blocks so every screen shares the same look.

const BUTTON_VARIANTS = {
  primary: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary },
  dark: { bg: colors.text, fg: colors.onPrimary, border: colors.text },
  secondary: { bg: colors.background, fg: colors.text, border: colors.border },
  danger: { bg: colors.background, fg: colors.danger, border: colors.danger },
  ghost: { bg: "transparent", fg: colors.primaryDark, border: "transparent" },
};

export function Button({
  title,
  onPress,
  variant = "primary",
  icon,
  loading,
  disabled,
  small,
  style,
  accessibilityLabel,
}) {
  const v = BUTTON_VARIANTS[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: !!inactive }}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: v.bg, borderColor: v.border },
        variant === "primary" || variant === "dark" ? cardShadow : null,
        pressed && { opacity: 0.8 },
        inactive && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <View style={styles.buttonContent}>
          {icon ? (
            <Ionicons name={icon} size={small ? 16 : 18} color={v.fg} />
          ) : null}
          <Text
            style={[
              styles.buttonText,
              small && styles.buttonTextSmall,
              { color: v.fg },
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  color = colors.text,
  size = 22,
  style,
  accessibilityLabel,
  disabled,
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.iconButton,
        pressed && { opacity: 0.6 },
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
}

export function Chip({ label, selected, onPress, icon, disabled, style }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        disabled && styles.chipDisabled,
        pressed && { opacity: 0.75 },
        style,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={14}
          color={selected ? colors.onPrimary : colors.textMuted}
          style={{ marginRight: 4 }}
        />
      ) : null}
      <Text
        style={[
          styles.chipText,
          selected && styles.chipTextSelected,
          disabled && {
            color: colors.textFaint,
            textDecorationLine: "line-through",
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Card({ children, style, onPress, accessibilityLabel }) {
  if (!onPress) return <View style={[styles.card, style]}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.card,
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

export function StatusBadge({ status }) {
  const s = statusStyles[status] || {
    label: status,
    color: colors.textMuted,
    bg: colors.surface,
  };
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

// Read-only when onRate is missing, tappable otherwise.
export function Stars({ rating = 0, size = 14, onRate }) {
  return (
    <View
      style={styles.starsRow}
      accessibilityLabel={`${rating || 0} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((value) => {
        const name =
          rating >= value
            ? "star"
            : rating >= value - 0.5
              ? "star-half"
              : "star-outline";
        const star = <Ionicons name={name} size={size} color={colors.star} />;
        return onRate ? (
          <Pressable
            key={value}
            onPress={() => onRate(value)}
            hitSlop={6}
            accessibilityLabel={`Rate ${value} stars`}
          >
            {star}
          </Pressable>
        ) : (
          <View key={value}>{star}</View>
        );
      })}
    </View>
  );
}

export function EmptyState({ icon = "leaf-outline", title, message, action }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={28} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {message ? <Text style={styles.emptyMessage}>{message}</Text> : null}
      {action ? (
        <View style={{ marginTop: spacing.lg, alignSelf: "stretch" }}>
          {action}
        </View>
      ) : null}
    </View>
  );
}

export function SectionHeader({ title, right, style }) {
  return (
    <View style={[styles.sectionHeader, style]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {right}
    </View>
  );
}

export function Field({ label, error, hint, children, style }) {
  return (
    <View style={[styles.field, style]}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      {children}
      {error ? (
        <Text style={styles.fieldError}>{error}</Text>
      ) : hint ? (
        <Text style={styles.fieldHint}>{hint}</Text>
      ) : null}
    </View>
  );
}

export const Input = React.forwardRef(function Input(
  { error, style, multiline, ...rest },
  ref,
) {
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={colors.textFaint}
      multiline={multiline}
      style={[
        styles.input,
        multiline && styles.inputMultiline,
        error && styles.inputError,
        style,
      ]}
      {...rest}
    />
  );
});

export function Segmented({ options, value, onChange }) {
  return (
    <View style={styles.segmented} accessibilityRole="tablist">
      {options.map((option) => {
        const selected = option.key === value;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            <Text
              style={[
                styles.segmentText,
                selected && styles.segmentTextSelected,
              ]}
            >
              {option.label}
            </Text>
            {option.badge ? (
              <View style={styles.segmentBadge}>
                <Text style={styles.segmentBadgeText}>{option.badge}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function Avatar({ name = "?", size = 44, color = colors.primary }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: colors.onPrimary,
          fontWeight: "800",
          fontSize: size * 0.38,
        }}
      >
        {initials || "?"}
      </Text>
    </View>
  );
}

export function InfoRow({ icon, label, value, style }) {
  return (
    <View style={[styles.infoRow, style]}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={colors.primaryDark} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={typography.small}>{label}</Text>
        <Text style={typography.body}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radii.md,
    paddingVertical: 13,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    minHeight: 48,
  },
  buttonSmall: {
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    minHeight: 36,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  buttonText: { fontSize: 16, fontWeight: "700" },
  buttonTextSmall: { fontSize: 14 },
  iconButton: { padding: 4 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.round,
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: colors.background,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipDisabled: { backgroundColor: colors.surface },
  chipText: { fontSize: 14, color: colors.text, fontWeight: "500" },
  chipTextSelected: { color: colors.onPrimary, fontWeight: "700" },
  card: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },
  badge: {
    borderRadius: radii.round,
    paddingVertical: 3,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: 12, fontWeight: "700" },
  starsRow: { flexDirection: "row", gap: 2 },
  empty: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: { ...typography.heading, fontSize: 16, textAlign: "center" },
  emptyMessage: {
    ...typography.caption,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  field: { marginBottom: spacing.lg },
  fieldLabel: { ...typography.label, marginBottom: 6 },
  fieldError: { color: colors.danger, fontSize: 12, marginTop: 4 },
  fieldHint: { ...typography.small, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputMultiline: { minHeight: 84, textAlignVertical: "top" },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerLight,
  },
  segmented: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: radii.md - 2,
    gap: 6,
  },
  segmentSelected: { backgroundColor: colors.background, ...cardShadow },
  segmentText: { fontSize: 14, fontWeight: "600", color: colors.textMuted },
  segmentTextSelected: { color: colors.text, fontWeight: "800" },
  segmentBadge: {
    backgroundColor: colors.danger,
    borderRadius: radii.round,
    minWidth: 18,
    paddingHorizontal: 5,
    alignItems: "center",
  },
  segmentBadgeText: {
    color: colors.onPrimary,
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
});
