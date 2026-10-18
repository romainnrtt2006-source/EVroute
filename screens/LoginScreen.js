// AI-assisted: written with help from generative AI (Claude), then reviewed and tested.
import React, { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, Field, Input } from "../components/ui";
import { useStorage } from "../storage/StorageContext";
import { showToast } from "../utils/feedback";
import { colors, radii, spacing, typography } from "../constants/theme";

// No backend is in scope, so accounts are local to the device:
// the form is validated, then the profile is saved with AsyncStorage.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function nameFromEmail(email) {
  const local = email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .trim();
  return local.replace(/\b\w/g, (c) => c.toUpperCase()) || "EV driver";
}

export default function LoginScreen({ navigation }) {
  const { user, logIn } = useStorage();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(user.email || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState({});
  const passwordRef = useRef(null);
  const isSignUp = mode === "signup";

  const enterApp = (profile, message) => {
    logIn(profile, rememberMe);
    showToast(message);
    navigation.replace("Main");
  };

  const handleSubmit = () => {
    const next = {};
    if (isSignUp && name.trim().length < 2) next.name = "Enter your name.";
    if (!EMAIL_PATTERN.test(email.trim()))
      next.email = "Enter a valid email address.";
    if (password.length < 6) next.password = "At least 6 characters.";
    setErrors(next);
    if (Object.keys(next).length) return;

    const cleanEmail = email.trim().toLowerCase();
    const profile = { email: cleanEmail };
    if (isSignUp) profile.name = name.trim();
    else if (!user.email || user.email !== cleanEmail)
      profile.name = user.name || nameFromEmail(cleanEmail);
    enterApp(
      profile,
      isSignUp ? "Account created — welcome to EVRoute!" : "Welcome back!",
    );
  };

  const handleSocial = (provider) => {
    enterApp(
      { email: user.email || `driver@${provider.toLowerCase()}.demo` },
      `Signed in with ${provider} (demo)`,
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logo}>
            <Ionicons name="flash" size={34} color={colors.onPrimary} />
          </View>
          <Text style={styles.title}>EVRoute</Text>
          <Text style={styles.subtitle}>Share a charger. Find a charge.</Text>

          {isSignUp ? (
            <Field label="Name" error={errors.name}>
              <Input
                placeholder="Your name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                textContentType="name"
                error={errors.name}
              />
            </Field>
          ) : null}

          <Field label="Email" error={errors.email}>
            <Input
              placeholder="you@example.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
              value={email}
              onChangeText={setEmail}
              onSubmitEditing={() => passwordRef.current?.focus()}
              error={errors.email}
            />
          </Field>

          <Field label="Password" error={errors.password}>
            <View>
              <Input
                ref={passwordRef}
                placeholder="••••••"
                secureTextEntry={!showPassword}
                textContentType={isSignUp ? "newPassword" : "password"}
                returnKeyType="go"
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={handleSubmit}
                error={errors.password}
                style={{ paddingRight: 48 }}
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                style={styles.eye}
                hitSlop={8}
                accessibilityLabel={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>
          </Field>

          <View style={styles.rememberRow}>
            <Text style={typography.body}>Remember me</Text>
            <Switch
              value={rememberMe}
              onValueChange={setRememberMe}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor={colors.background}
            />
          </View>

          <Button
            title={isSignUp ? "Create account" : "Log in"}
            onPress={handleSubmit}
          />

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.divider} />
          </View>

          <Button
            title="Continue with Google"
            icon="logo-google"
            variant="secondary"
            onPress={() => handleSocial("Google")}
          />
          <Button
            title="Continue with Apple"
            icon="logo-apple"
            variant="secondary"
            onPress={() => handleSocial("Apple")}
            style={{ marginTop: spacing.sm }}
          />

          <Pressable
            onPress={() => {
              setMode(isSignUp ? "login" : "signup");
              setErrors({});
            }}
            style={styles.switchMode}
          >
            <Text style={styles.switchModeText}>
              {isSignUp ? "Already have an account? " : "No account? "}
              <Text style={styles.switchModeLink}>
                {isSignUp ? "Log in" : "Sign up"}
              </Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.xl,
    maxWidth: 480,
    width: "100%",
    alignSelf: "center",
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  title: {
    ...typography.title,
    textAlign: "center",
    color: colors.primaryDark,
  },
  subtitle: {
    ...typography.subtitle,
    textAlign: "center",
    marginTop: 4,
    marginBottom: spacing.xxl,
  },
  eye: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  rememberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.lg,
    gap: spacing.md,
  },
  divider: { flex: 1, height: 1, backgroundColor: colors.border },
  orText: { ...typography.caption },
  switchMode: { marginTop: spacing.xl, alignItems: "center" },
  switchModeText: { ...typography.caption },
  switchModeLink: { color: colors.primaryDark, fontWeight: "700" },
});
