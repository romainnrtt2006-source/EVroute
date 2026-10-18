import * as Location from "expo-location";

// Asks for permission (once) and returns { latitude, longitude }.
// Throws an Error with a user-friendly message when it isn't possible.
export async function getCurrentPosition() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    throw new Error(
      "Location permission was denied. You can still search by city.",
    );
  }
  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch (error) {
    throw new Error(
      "Couldn't get your position right now. Try searching by city.",
    );
  }
}
