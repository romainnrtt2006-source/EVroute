import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import * as Notifications from "expo-notifications";

// Hardcoded stations for now. Week 6's local storage work will replace/extend
// this with data the user actually creates in CreateScreen.
const MOCK_STATIONS = [
  {
    id: "1",
    name: "Sarah's Home Charger",
    city: "Newcastle",
    latitude: -32.9283,
    longitude: 151.7817,
  },
  {
    id: "2",
    name: "Callaghan Campus Charger",
    city: "Newcastle",
    latitude: -32.8936,
    longitude: 151.7028,
  },
  {
    id: "3",
    name: "Tom's Garage Plug",
    city: "Maitland",
    latitude: -32.7326,
    longitude: 151.5594,
  },
];

// Notifications need to actually display while the app is foregrounded,
// otherwise the "Request to charge" demo would appear to do nothing.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function HomeScreen({ navigation }) {
  const [search, setSearch] = useState("");

  const filteredStations = useMemo(() => {
    if (!search.trim()) return MOCK_STATIONS;
    const query = search.trim().toLowerCase();
    return MOCK_STATIONS.filter((station) =>
      station.city.toLowerCase().includes(query)
    );
  }, [search]);

  const handleRequestToCharge = async (station) => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Notifications disabled",
        "Enable notifications to receive updates on your charging request."
      );
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Booking request sent",
        body: `Your request to charge at "${station.name}" has been sent.`,
      },
      trigger: null,
    });
  };

  const renderStation = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.name}</Text>
      <Text style={styles.cardCity}>{item.city}</Text>
      <TouchableOpacity
        style={styles.requestButton}
        onPress={() => handleRequestToCharge(item)}
      >
        <Text style={styles.requestButtonText}>Request to charge</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search by city..."
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={filteredStations}
        keyExtractor={(item) => item.id}
        renderItem={renderStation}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No stations found for that city.</Text>
        }
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("Create")}
      >
        <Text style={styles.addButtonText}>+ Add a Charging Station</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 15,
  },
  listContent: {
    paddingBottom: 90,
  },
  card: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    backgroundColor: "#fafafa",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  cardCity: {
    fontSize: 13,
    color: "#666",
    marginBottom: 10,
  },
  requestButton: {
    alignSelf: "flex-start",
    backgroundColor: "#0F9D58",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  requestButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 40,
  },
  addButton: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: "#0F9D58",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
