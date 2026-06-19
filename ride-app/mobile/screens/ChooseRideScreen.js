import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,


} from "react-native";
import { MapView, Marker, Polyline } from "react-native-maps";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { COLORS } from "../theme";
import { api } from "../api/client";

const ICONS = {
  Mini: "car-side",
  Sedan: "car",
  SUV: "car-estate",
  Premium: "car-sports",
};

export default function ChooseRideScreen({ route, navigation }) {
  const {
    pickup,
    drop,
    pickupAddress,
    dropAddress,
    distance_km,
    duration_min,
    route_geometry,
    ride_options,
    userType,

  } = route.params;

  // Initialize coordinates: use passed coordinates if available, otherwise fallback to existing values
  const [pickupCoord, setPickupCoord] = useState(pickup ? { lat: pickup.lat, lon: pickup.lon } : null);
  const [dropCoord, setDropCoord] = useState(drop ? { lat: drop.lat, lon: drop.lon } : null);

  // Determine a suggestion based on user type
  const suggestionText = userType === "premium"
    ? "Premium rides curated for you"
    : userType === "business"
    ? "Business‑class options for comfort"
    : "Best value rides for you";

  const [selected, setSelected] = useState(
    ride_options && ride_options.length > 0 ? ride_options[0] : null
  );
  // New states for interactive map selection
  const [selectMode, setSelectMode] = useState('pickup');
  // State for fetched route data
  const [distanceKm, setDistanceKm] = useState(distance_km || 0);
  const [durationMin, setDurationMin] = useState(duration_min || 0);
  const [routeGeo, setRouteGeo] = useState(route_geometry || []);
  const [rideOptions, setRideOptions] = useState(ride_options || []);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [staticMapUrl, setStaticMapUrl] = useState(null);


  const [loading, setLoading] = useState(false);

  const region = {
    latitude: (pickupCoord.lat + dropCoord.lat) / 2,
    longitude: (pickupCoord.lon + dropCoord.lon) / 2,
    latitudeDelta: Math.abs(pickupCoord.lat - dropCoord.lat) * 2 + 0.05,
    longitudeDelta: Math.abs(pickupCoord.lon - dropCoord.lon) * 2 + 0.05,
  };

  const polylineCoords = (routeGeo || []).map(([lat, lon]) => ({
    latitude: lat,
    longitude: lon,
}));

  const vehicleCoord =
    polylineCoords.length > 0
      ? polylineCoords[Math.floor(polylineCoords.length / 2)]
      : null;

  // Fetch route whenever pickup or drop coordinates change
  useEffect(() => {
  const fetchRoute = async () => {
    if (!pickupCoord || !dropCoord) return;
    try {
      setLoadingRoute(true);
      const response = await api.get('/route/', {
        params: {
          start: `${pickupCoord.lat},${pickupCoord.lon}`,
          end: `${dropCoord.lat},${dropCoord.lon}`,
        },
      });
      setDistanceKm(response.distance / 1000);
      setDurationMin(response.duration / 60);
      setRouteGeo(response.geometry || []);
      if (response.ride_options) setRideOptions(response.ride_options);
      // fetch static map URL
      const mapRes = await api.get('/static_map/', {
        params: {
          start: `${pickupCoord.lat},${pickupCoord.lon}`,
          end: `${dropCoord.lat},${dropCoord.lon}`,
        },
      });
      setStaticMapUrl(mapRes.map_url);
    } catch (e) {
      console.warn('Failed to fetch route', e);
    } finally {
      setLoadingRoute(false);
    }
  };
  fetchRoute();
}, [pickupCoord, dropCoord]);

 const handleConfirm = async () => {
    if (!selected) return;
    setLoading(true);
    try {
        const ride = await api.bookRide({
            pickup_address: pickupAddress,
            drop_address: dropAddress,
            pickup_lat: pickupCoord.lat,
            pickup_lon: pickupCoord.lon,
            drop_lat: dropCoord.lat,
            drop_lon: dropCoord.lon,
            category_id: selected.id,
        });
        navigation.navigate("OnTrip", { ride });
    } catch (e) {
        Alert.alert("Error", e.message || "Unable" + " able to confirm ride");
    } finally {
        setLoading(false);
    }
};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Choose Your Ride</Text>
        <View style={{ width: 24 }} />
      </View>
      <Text style={styles.subTitle}>
        Select the best ride for you · {distanceKm.toFixed(1)} km · {Math.round(durationMin)} min
      </Text>
      <Text style={styles.suggestion}>{suggestionText}</Text>

      {/* Mode selector */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 8 }}>
        <Pressable onPress={() => setSelectMode('pickup')} style={{ padding: 8, backgroundColor: selectMode === 'pickup' ? COLORS.primary : '#e0e0e0', borderRadius: 8, marginRight: 4 }}>
          <Text style={{ color: selectMode === 'pickup' ? '#fff' : '#000' }}>Set Pickup</Text>
        </Pressable>
        <Pressable onPress={() => setSelectMode('drop')} style={{ padding: 8, backgroundColor: selectMode === 'drop' ? COLORS.primary : '#e0e0e0', borderRadius: 8, marginLeft: 4 }}>
          <Text style={{ color: selectMode === 'drop' ? '#fff' : '#000' }}>Set Drop</Text>
        </Pressable>
      </View>

      <View style={styles.mapWrap}>
        {/* Interactive Map showing route */}
        <MapView
          style={{ flex: 1, borderRadius: 14 }}
          initialRegion={region}
          onPress={(e) => {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            if (selectMode === 'pickup') {
              setPickupCoord({ lat: latitude, lon: longitude });
            } else {
              setDropCoord({ lat: latitude, lon: longitude });
            }
          }}
        >
          {pickupCoord && (
            <Marker coordinate={{ latitude: pickupCoord.lat, longitude: pickupCoord.lon }} pinColor="green" />
          )}
          {dropCoord && (
            <Marker coordinate={{ latitude: dropCoord.lat, longitude: dropCoord.lon }} pinColor="red" />
          )}
          {routeGeo && routeGeo.length > 0 && (
            <Polyline
              coordinates={polylineCoords}
              strokeColor={COLORS.primary}
              strokeWidth={4}
            />
          )}
        </MapView>
      </View>


      {/* Ride options */}
      <ScrollView style={{ marginTop: 10 }}>
        {rideOptions.map((opt) => {
          const isSelected = selected && selected.id === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              style={[styles.optionCard, isSelected && styles.optionCardSelected]}
              onPress={() => setSelected(opt)}
            >
              <View style={styles.optionIconWrap}>
                <MaterialCommunityIcons
                  name={ICONS[opt.name] || "car"}
                  size={28}
                  color={COLORS.primary}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.optionName}>{opt.name}</Text>
                <Text style={styles.optionMeta}>
                  <Ionicons name="person" size={12} /> {opt.capacity}{"  "}
                  <Ionicons name="briefcase" size={12} /> {opt.bags}{"  "}
                  {opt.eta_min} min away
                </Text>
              </View>

              <Text style={styles.optionPrice}>
                ₹{opt.fare} ({(opt.fare / distanceKm).toFixed(2)}/km)
              </Text>

              {isSelected && (
                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Select Ride button */}
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => {
            if (!selected) return;
            navigation.navigate('ChoreRideScreen', {
              selectedRide: selected,
              pickup: pickupCoord,
              drop: dropCoord,
              distance_km: distanceKm,
              duration_min: durationMin,
              route_geometry: routeGeo,
            });
          }}
          disabled={!selected}
        >
          <Text style={styles.selectButtonText}>Select Ride</Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark" size={16} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Best prices · Verified drivers · Safe Rides
          </Text>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.confirmButton}
        onPress={handleConfirm}
        disabled={loading || !selected}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.confirmButtonText}>
            Confirm {selected ? selected.name : ""}
          </Text>
        )}
      </TouchableOpacity>
      <Text style={styles.footerNote}>🔒 100% Secure & Safe Rides</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  topTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  subTitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  mapWrap: {
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
  },
  vehicleMarker: {
    backgroundColor: COLORS.primary,
    padding: 6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#fff",
  },
  suggestion: {
    fontSize: 14,
    color: COLORS.primary,
    textAlign: "center",
    marginVertical: 6,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionCardSelected: {
    borderColor: COLORS.primary,
  },
  optionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e8f5e9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  optionName: {
    fontWeight: "700",
    fontSize: 15,
    color: COLORS.text,
  },
  optionMeta: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  optionPrice: {
    fontWeight: "700",
    fontSize: 16,
    color: COLORS.text,
    marginRight: 8,
  },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e8f5e9",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    gap: 8,
  },
  infoText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  footerNote: {
    textAlign: "center",
    color: COLORS.muted,
    fontSize: 11,
    marginVertical: 8,
  },
});
