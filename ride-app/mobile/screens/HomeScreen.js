import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Pressable,
  Alert,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { COLORS } from "../theme";
import { api } from "../api/client";

const SUGGESTIONS = [
  { icon: "home", label: "Home", sub: "123 Green Street, New York" },
  { icon: "briefcase", label: "Work", sub: "456 Office Road, New York" },
  { icon: "plane", label: "Airport", sub: "John F. Kennedy International" },
  { icon: "city", label: "Downtown", sub: "789 City Center, New York" },
];

export default function HomeScreen({ navigation }) {
  const [from, setFrom] = useState("Current Location");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectMode, setSelectMode] = useState('pickup'); // 'pickup' or 'drop'
  const [pickupCoord, setPickupCoord] = useState(null);
  const [dropCoord, setDropCoord] = useState(null);


  const handleFindRide = async (toOverride) => {
    const dropValue = toOverride || to;
    if (!from || !dropValue) {
      Alert.alert('Missing info', 'Please enter both pickup and drop locations');
      return;
    }
    setLoading(true);
    try {
    // Build payload – use coordinates if available, otherwise fallback to address strings
    const payload = {};
    if (pickupCoord && dropCoord) {
      payload.pickup_lat = pickupCoord.lat;
      payload.pickup_lon = pickupCoord.lon;
      payload.drop_lat = dropCoord.lat;
      payload.drop_lon = dropCoord.lon;
    }
    // always include readable names for UI
    payload.pickup = from;
    payload.drop = dropValue;

    // Navigate immediately with the payload and coordinates
    navigation.navigate('ChooseRideScreen', {
      payload,
      pickupAddress: from,
      dropAddress: dropValue,
      pickup: pickupCoord,
      drop: dropCoord,
    });

    // Fetch estimate in background (no await, errors logged)
    api.estimate(payload).catch((e) => console.warn('Estimate error:', e));

    } catch (e) {
      Alert.alert('Error', e.message || 'Unable to find route');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Ionicons name="menu" size={26} color="#222" />
        <Ionicons name="notifications-outline" size={24} color="#222" />
      </View>

      <Text style={styles.greeting}>Hello Mr.Kamalakannan</Text>
      <Text style={styles.question}>Where do you want to go?</Text>

      {/* From / To card */}
      <View style={styles.locationCard}>
        <View style={styles.locationRow}>
          <View style={styles.dotGreen} />
          <View style={{ flex: 1 }}>
            <Text style={styles.locationLabel}>From</Text>
            <TextInput
              style={styles.locationInput}
              value={from}
              onChangeText={setFrom}
              placeholder="Pickup location"
            />
          </View>
          <Ionicons name="locate" size={20} color={COLORS.primary} />
        </View>

        <View style={styles.divider} />

        <View style={styles.locationRow}>
          <View style={styles.dotRed} />
          <View style={{ flex: 1 }}>
            <Text style={styles.locationLabel}>To</Text>
            <TextInput
              style={styles.locationInput}
              value={to}
              onChangeText={setTo}
              placeholder="Enter drop location"
            />
          </View>
          <Ionicons name="add" size={20} color={COLORS.primary} />
        </View>
      </View>

      {/* Suggestions */}
      <View style={styles.suggestionsHeader}>
        <Text style={styles.suggestionsTitle}>Suggestions</Text>
        <Text style={styles.seeAll}>See all</Text>
      </View>

      {SUGGESTIONS.map((s) => (
        <TouchableOpacity
          key={s.label}
          style={styles.suggestionRow}
          onPress={() => {
            setTo(s.sub);
          }}
        >
          <View style={styles.suggestionIconWrap}>
            <FontAwesome5 name={s.icon} size={16} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.suggestionLabel}>{s.label}</Text>
            <Text style={styles.suggestionSub}>{s.sub}</Text>
          </View>
        </TouchableOpacity>
      ))}

      {/* Mode toggle button */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 8 }}>
        <Pressable
          onPress={() => setSelectMode('pickup')}
          style={{
            padding: 8,
            backgroundColor: selectMode === 'pickup' ? COLORS.primary : '#e0e0e0',
            borderRadius: 8,
            marginRight: 4,
          }}
        >
          <Text style={{ color: selectMode === 'pickup' ? '#fff' : '#000' }}>Set Pickup</Text>
        </Pressable>
        <Pressable
          onPress={() => setSelectMode('drop')}
          style={{
            padding: 8,
            backgroundColor: selectMode === 'drop' ? COLORS.primary : '#e0e0e0',
            borderRadius: 8,
            marginLeft: 4,
          }}
        >
          <Text style={{ color: selectMode === 'drop' ? '#fff' : '#000' }}>Set Drop</Text>
        </Pressable>
      </View>

      {/* Interactive Map */}
      <View style={styles.mapPreview}>
        <MapView
          style={{ flex: 1, borderRadius: 14 }}
          initialRegion={{
            latitude: 13.0827,
            longitude: 80.2707,
            latitudeDelta: 0.2,
            longitudeDelta: 0.2,
          }}
          onPress={(e) => {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            if (selectMode === 'pickup') {
              setPickupCoord({ lat: latitude, lon: longitude });
              setFrom(`(${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
            } else {
              setDropCoord({ lat: latitude, lon: longitude });
              setTo(`(${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
            }
          }}
        >
          {pickupCoord && (
            <Marker coordinate={{ latitude: pickupCoord.lat, longitude: pickupCoord.lon }} pinColor="green" />
          )}
          {dropCoord && (
            <Marker coordinate={{ latitude: dropCoord.lat, longitude: dropCoord.lon }} pinColor="red" />
          )}
        </MapView>
      </View>

      {/* Find ride button */}
      <TouchableOpacity
        style={styles.findButton}
        onPress={() => handleFindRide()}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.findButtonText}>🚕 Select Taxi</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    marginTop: 24,
    paddingHorizontal: 12,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingHorizontal: 12,
  },
  menuIcon: {
    marginLeft: 12,
  },
  bellIcon: {
    marginRight: 12,
    marginTop: 4,
  },
  greeting: {
    marginLeft: 12,
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
    color: COLORS.text,
  },
  question: {
    color: COLORS.muted,
    marginLeft: 12,
    marginBottom: 16,
  },
  locationCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginTop: 12,
    marginHorizontal: 12,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  dotGreen: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginRight: 12,
  },
  dotRed: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.danger,
    marginRight: 12,
  },
  locationLabel: {
    fontSize: 11,
    color: COLORS.muted,
  },
  locationInput: {
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  suggestionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 12,
  },
  suggestionsTitle: {
    fontWeight: "700",
    fontSize: 15,
    color: COLORS.text,
  },
  seeAll: {
    color: COLORS.primary,
    fontSize: 13,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    marginLeft: 12,
    width: "90%",
    alignSelf: "flex-start",
  },
  suggestionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e8f5e9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  suggestionLabel: {
    fontWeight: "600",
    fontSize: 14,
    color: COLORS.text,
  },
  suggestionSub: {
    fontSize: 12,
    color: COLORS.muted,
  },
  mapPreview: {
    height: 130,
    width: "90%",
    alignSelf: "center",
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 14,
  },
  findButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 30,
    width: "90%",
    alignSelf: "center",
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 14,
    marginBottom: 16,
  },
  findButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
