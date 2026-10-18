// AI-assisted: written with help from generative AI (Claude), then reviewed and tested.
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import StationMap from "../components/Map";
import CameraModal from "./CameraModal";
import { Button, Chip, Field, Input } from "../components/ui";
import { useStorage } from "../storage/StorageContext";
import { CONNECTOR_TYPES, POWER_PRESETS } from "../storage/seed";
import { DEFAULT_PLACE, geocodeCity, reverseGeocode } from "../api/geocoding";
import { getCurrentPosition } from "../utils/location";
import { confirmDialog, infoDialog, showToast } from "../utils/feedback";
import { colors, radii, spacing, typography } from "../constants/theme";

// Used twice: as the "Add" tab (new charger) and as the "EditStation"
// stack screen (route.params.stationId = charger to edit).
const AVAILABILITY_PRESETS = [
  "Every day 7 AM – 10 PM",
  "Weekdays 9 AM – 5 PM",
  "Evenings 6 – 10 PM",
  "Weekends all day",
];

const EMPTY_FORM = {
  name: "",
  photoUri: null,
  location: null,
  address: "",
  suburb: "",
  type: "Type 2",
  kw: "7",
  price: "0.30",
  availability: "",
  accessNotes: "",
};

function parseNumber(text) {
  return parseFloat(String(text).replace(",", "."));
}

function validate(form) {
  const errors = {};
  if (form.name.trim().length < 3)
    errors.name = "Give your charger a name (3+ characters).";
  if (!form.location)
    errors.location = "Tap the map or use your location to place the charger.";
  const kw = parseNumber(form.kw);
  if (!(kw >= 1 && kw <= 350))
    errors.kw = "Power must be between 1 and 350 kW.";
  const price = parseNumber(form.price);
  if (!(price >= 0.05 && price <= 2))
    errors.price = "Price must be between $0.05 and $2.00 per kWh.";
  if (!form.availability.trim())
    errors.availability = "Tell drivers when they can come.";
  return errors;
}

export default function CreateScreen({ navigation, route }) {
  const editingId = route.params?.stationId;
  const { stations, user, addStation, updateStation, deleteStation } =
    useStorage();
  const editing = editingId ? stations.find((s) => s.id === editingId) : null;

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [cameraOpen, setCameraOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const lookupId = useRef(0);
  const scrollRef = useRef(null);

  // Pre-fill the form when editing an existing charger.
  useEffect(() => {
    if (!editing) return;
    setForm({
      name: editing.name,
      photoUri: editing.photoUri,
      location: { latitude: editing.latitude, longitude: editing.longitude },
      address: editing.address || "",
      suburb: editing.suburb || "",
      type: editing.type,
      kw: String(editing.kw),
      price: editing.pricePerKwh.toFixed(2),
      availability: editing.availability,
      accessNotes: editing.accessNotes || "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId]);

  const set = (key) => (value) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  // Week 7: reverse geocoding (REST GET) fills in the address for a pin.
  const placePin = async (coords) => {
    setForm((current) => ({ ...current, location: coords }));
    setErrors((current) => ({ ...current, location: undefined }));
    const id = ++lookupId.current;
    setResolvingAddress(true);
    try {
      const { address, suburb } = await reverseGeocode(
        coords.latitude,
        coords.longitude,
      );
      if (id === lookupId.current)
        setForm((current) => ({ ...current, address, suburb }));
    } catch (error) {
      if (id === lookupId.current)
        showToast("Couldn't look up the address — you can type it.", "error");
    } finally {
      if (id === lookupId.current) setResolvingAddress(false);
    }
  };

  const handleUseMyLocation = async () => {
    setLocating(true);
    try {
      const position = await getCurrentPosition();
      await placePin(position);
    } catch (error) {
      infoDialog("Location unavailable", error.message);
    } finally {
      setLocating(false);
    }
  };

  const handleFindAddress = async () => {
    if (!form.address.trim()) return;
    setResolvingAddress(true);
    try {
      const found = await geocodeCity(form.address);
      setForm((current) => ({
        ...current,
        location: { latitude: found.latitude, longitude: found.longitude },
        suburb: current.suburb || found.name,
      }));
      setErrors((current) => ({ ...current, location: undefined }));
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setResolvingAddress(false);
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6,
      });
      if (!result.canceled && result.assets && result.assets.length) {
        set("photoUri")(result.assets[0].uri);
      }
    } catch (error) {
      showToast("Couldn't open your photos.", "error");
    }
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const handleSave = async () => {
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) {
      showToast("Please fix the highlighted fields.", "error");
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    const data = {
      name: form.name.trim(),
      photoUri: form.photoUri,
      latitude: form.location.latitude,
      longitude: form.location.longitude,
      address: form.address.trim(),
      suburb: form.suburb.trim(),
      type: form.type,
      kw: Math.round(parseNumber(form.kw) * 10) / 10,
      pricePerKwh: Math.round(parseNumber(form.price) * 100) / 100,
      availability: form.availability.trim(),
      accessNotes: form.accessNotes.trim(),
    };

    setSaving(true);
    try {
      if (editing) {
        await updateStation(editing.id, data);
        showToast("Changes saved");
        navigation.goBack();
      } else {
        const station = await addStation(data);
        showToast("Your charger is live on EVRoute!");
        resetForm();
        navigation.navigate("ChargerDetail", { stationId: station.id });
      }
    } catch (error) {
      showToast("Something went wrong while saving.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () =>
    confirmDialog({
      title: "Delete this charger?",
      message: "The listing and its requests will be removed.",
      confirmLabel: "Delete",
      destructive: true,
      onConfirm: () => {
        deleteStation(editing.id);
        showToast("Charger deleted");
        navigation.navigate("Main", { screen: "Profile" });
      },
    });

  const center = useMemo(
    () =>
      form.location || {
        latitude: DEFAULT_PLACE.latitude,
        longitude: DEFAULT_PLACE.longitude,
      },
    [form.location],
  );
  const firstName = (user.name || "My").split(" ")[0];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={scrollEnabled}
      >
        {!editing ? (
          <Text style={styles.intro}>
            Earn money from your idle home charger. Drivers send a request, you
            accept or decline.
          </Text>
        ) : null}

        {/* Photo (expo-camera or the photo library) */}
        {form.photoUri ? (
          <Image
            source={{ uri: form.photoUri }}
            style={styles.photo}
            accessibilityLabel="Charger photo"
          />
        ) : (
          <Pressable
            style={[styles.photo, styles.photoPlaceholder]}
            onPress={() => setCameraOpen(true)}
            accessibilityLabel="Take a photo"
          >
            <Ionicons
              name="camera-outline"
              size={34}
              color={colors.primaryDark}
            />
            <Text style={styles.photoText}>Add a photo of your charger</Text>
            <Text style={typography.small}>
              Drivers book more when they can see it
            </Text>
          </Pressable>
        )}
        <View style={styles.photoButtons}>
          <Button
            title={form.photoUri ? "Retake" : "Camera"}
            icon="camera-outline"
            variant="secondary"
            small
            onPress={() => setCameraOpen(true)}
            style={{ flex: 1 }}
          />
          <Button
            title="Gallery"
            icon="images-outline"
            variant="secondary"
            small
            onPress={handlePickFromGallery}
            style={{ flex: 1 }}
          />
          {form.photoUri ? (
            <Button
              title="Remove"
              icon="trash-outline"
              variant="danger"
              small
              onPress={() => set("photoUri")(null)}
              style={{ flex: 1 }}
            />
          ) : null}
        </View>

        <Field label="Name" error={errors.name}>
          <Input
            value={form.name}
            onChangeText={set("name")}
            placeholder={`${firstName}'s charger`}
            maxLength={40}
            error={errors.name}
          />
        </Field>

        {/* Location */}
        <Field
          label="Location"
          error={errors.location}
          hint="Tap the map to drop the pin exactly on your driveway."
        >
          <View style={styles.addressRow}>
            <Input
              value={form.address}
              onChangeText={set("address")}
              placeholder="Street address or suburb"
              style={{ flex: 1 }}
              returnKeyType="search"
              onSubmitEditing={handleFindAddress}
            />
            <Pressable
              style={styles.squareButton}
              onPress={handleFindAddress}
              accessibilityLabel="Find address on map"
            >
              {resolvingAddress ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Ionicons name="search" size={18} color={colors.onPrimary} />
              )}
            </Pressable>
          </View>
          <View
            style={[
              styles.mapContainer,
              errors.location && { borderColor: colors.danger },
            ]}
            onTouchStart={() => setScrollEnabled(false)}
            onTouchEnd={() => setScrollEnabled(true)}
            onTouchCancel={() => setScrollEnabled(true)}
          >
            <StationMap
              center={center}
              zoom={form.location ? 15 : 12}
              picked={form.location}
              onMapPress={placePin}
            />
          </View>
          <Button
            title="Use my current location"
            icon="locate-outline"
            variant="ghost"
            small
            loading={locating}
            onPress={handleUseMyLocation}
          />
        </Field>

        <Field label="Connector type">
          <View style={styles.chips}>
            {CONNECTOR_TYPES.map((type) => (
              <Chip
                key={type}
                label={type}
                selected={form.type === type}
                onPress={() => set("type")(type)}
              />
            ))}
          </View>
        </Field>

        <Field label="Power output (kW)" error={errors.kw}>
          <View style={[styles.chips, { marginBottom: spacing.sm }]}>
            {POWER_PRESETS.map((kw) => (
              <Chip
                key={kw}
                label={`${kw}`}
                selected={parseNumber(form.kw) === kw}
                onPress={() => set("kw")(String(kw))}
              />
            ))}
          </View>
          <Input
            value={form.kw}
            onChangeText={set("kw")}
            keyboardType="decimal-pad"
            placeholder="7"
            error={errors.kw}
          />
        </Field>

        <Field
          label="Price per kWh ($)"
          error={errors.price}
          hint="Home electricity costs about $0.30/kWh in NSW — price a little above to earn."
        >
          <Input
            value={form.price}
            onChangeText={set("price")}
            keyboardType="decimal-pad"
            placeholder="0.30"
            error={errors.price}
          />
        </Field>

        <Field label="Availability" error={errors.availability}>
          <View style={[styles.chips, { marginBottom: spacing.sm }]}>
            {AVAILABILITY_PRESETS.map((preset) => (
              <Chip
                key={preset}
                label={preset}
                selected={form.availability === preset}
                onPress={() => set("availability")(preset)}
              />
            ))}
          </View>
          <Input
            value={form.availability}
            onChangeText={set("availability")}
            placeholder="e.g. Mon–Fri 6–10 PM"
            error={errors.availability}
          />
        </Field>

        <Field label="Access notes (optional)">
          <Input
            value={form.accessNotes}
            onChangeText={set("accessNotes")}
            multiline
            maxLength={200}
            placeholder="Where to park, where the cable is, gate code…"
          />
        </Field>

        <Button
          title={editing ? "Save changes" : "Publish charger"}
          icon={editing ? "save-outline" : "cloud-upload-outline"}
          loading={saving}
          onPress={handleSave}
        />
        {editing ? (
          <Button
            title="Delete charger"
            icon="trash-outline"
            variant="danger"
            onPress={handleDelete}
            style={{ marginTop: spacing.md }}
          />
        ) : null}
      </ScrollView>

      <CameraModal
        visible={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onPhotoTaken={set("photoUri")}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  intro: { ...typography.caption, marginBottom: spacing.lg },
  photo: { width: "100%", height: 180, borderRadius: radii.lg },
  photoPlaceholder: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  photoText: { ...typography.label, color: colors.primaryDark },
  photoButtons: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  addressRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  squareButton: {
    width: 48,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  mapContainer: {
    height: 220,
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
});
