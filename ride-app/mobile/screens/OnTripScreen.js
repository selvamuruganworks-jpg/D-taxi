import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
} from "react-native";
import SafeMapView, { Marker, Polyline } from "../components/SafeMapView";
import { Ionicons, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../theme";
import { api } from "../api/client";

export default function OnTripScreen({ route, navigation }) {
  const { ride } = route.params;
  const [status, setStatus] = useState(ride.status);

  const polylineCoords = (ride.route_geometry || []).map(([lat, lon]) => ({
    latitude: lat,
    longitude: lon,
  }));

  const vehicleCoord =
    polylineCoords.length > 0
      ? polylineCoords[Math.floor(polylineCoords.length / 2)]
      : { latitude: ride.pickup_lat, longitude: ride.pickup_lon };

  const region = {
    latitude: (ride.pickup_lat + ride.drop_lat) / 2,
    longitude: (ride.pickup_lon + ride.drop_lon) / 2,
    latitudeDelta: Math.abs(ride.pickup_lat - ride.drop_lat) * 2 + 0.05,
    longitudeDelta: Math.abs(ride.pickup_lon - ride.drop_lon) * 2 + 0.05,
  };

  const handleCancel = async () => {
    try {
      const updated = await api.cancelRide(ride.id);
      setStatus(updated.status);
      Alert.alert("Ride Cancelled", "Your ride has been cancelled.", [
        { text: "OK", onPress: () => navigation.popToTop() },
      ]);
    } catch (e) {
      Alert.alert("Error", e.message || "Unable to cancel ride");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <View>
          <Text style={styles.topTitle}>On Trip</Text>
          <Text style={styles.tripId}>Trip ID: #DR{String(ride.id).padStart(8, "0")}</Text>
        </View>
        <Ionicons name="headset-outline" size={22} color="#222" />
      </View>

      {/* Map */}
      <View style={styles.mapWrap}>
        <SafeMapView style={{ flex: 1 }} initialRegion={region}>
          <Marker
            coordinate={{ latitude: ride.pickup_lat, longitude: ride.pickup_lon }}
            pinColor="green"
            title="Pickup"
          />
          <Marker
            coordinate={{ latitude: ride.drop_lat, longitude: ride.drop_lon }}
            pinColor="red"
            title="Drop"
          />
          <Marker coordinate={vehicleCoord} title="Driver">
            <View style={styles.vehicleMarker}>
              <FontAwesome5 name="car" size={14} color="#fff" />
            </View>
          </Marker>
          {polylineCoords.length > 0 && (
            <Polyline
              coordinates={polylineCoords}
              strokeColor={COLORS.primaryLight}
              strokeWidth={5}
            />
          )}
        </SafeMapView>

        <View style={styles.arrivingBadge}>
          <Text style={styles.arrivingText}>Arriving in</Text>
          <Text style={styles.arrivingTime}>
            {ride.category ? ride.category.eta_offset_min : 3} min
          </Text>
        </View>
      </View>

      {/* Driver card */}
      <View style={styles.driverCard}>
        <Image
          source={require("../assets/driver.png")}
          style={styles.driverAvatar}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.driverName}>{ride.driver_name}</Text>
          <Text style={styles.driverRating}>★ {ride.driver_rating}</Text>
          <Text style={styles.driverVehicle}>
            {ride.driver_vehicle_no} · {ride.driver_vehicle_model}
          </Text>
        </View>
        <View style={styles.driverActions}>
          <TouchableOpacity style={styles.iconCircle}>
            <Ionicons name="call" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Pickup / drop */}
      <View style={styles.addressCard}>
        <View style={styles.addressRow}>
          <View style={styles.dotGreen} />
          <View>
            <Text style={styles.addressLabel}>Pickup</Text>
            <Text style={styles.addressText}>{ride.pickup_address}</Text>
          </View>
        </View>
        <View style={styles.addressDivider} />
        <View style={styles.addressRow}>
          <View style={styles.dotRed} />
          <View>
            <Text style={styles.addressLabel}>Drop</Text>
            <Text style={styles.addressText}>{ride.drop_address}</Text>
          </View>
        </View>
      </View>

      {/* Bottom actions */}
      <View style={styles.bottomActions}>
        <View style={styles.bottomAction}>
          <Ionicons name="share-social-outline" size={20} color={COLORS.text} />
          <Text style={styles.bottomActionText}>Share</Text>
        </View>
        <View style={styles.bottomAction}>
          <Ionicons name="chatbubble-outline" size={20} color={COLORS.text} />
          <Text style={styles.bottomActionText}>Message</Text>
        </View>
        <View style={styles.bottomAction}>
          <Ionicons name="call-outline" size={20} color={COLORS.text} />
          <Text style={styles.bottomActionText}>Call</Text>
        </View>
        <TouchableOpacity style={styles.bottomAction} onPress={handleCancel}>
          <MaterialIcons name="cancel" size={20} color={COLORS.danger} />
          <Text style={[styles.bottomActionText, { color: COLORS.danger }]}>
            Cancel Ride
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.statusText}>Status: {status}</Text>
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
    marginBottom: 8,
  },
  topTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
  },
  tripId: {
    fontSize: 11,
    color: COLORS.muted,
    textAlign: "center",
  },
  mapWrap: {
    height: 240,
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
  arrivingBadge: {
    position: "absolute",
    left: 12,
    bottom: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  arrivingText: {
    fontSize: 11,
    color: COLORS.muted,
  },
  arrivingTime: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
  },
  driverCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: "#ddd",
  },
  driverName: {
    fontWeight: "700",
    fontSize: 15,
    color: COLORS.text,
  },
  driverRating: {
    fontSize: 12,
    color: "#f5a623",
  },
  driverVehicle: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  driverActions: {
    flexDirection: "row",
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e8f5e9",
    justifyContent: "center",
    alignItems: "center",
  },
  addressCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  addressDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
    marginLeft: 22,
  },
  dotGreen: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginTop: 4,
  },
  dotRed: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.danger,
    marginTop: 4,
  },
  addressLabel: {
    fontSize: 11,
    color: COLORS.muted,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "600",
  },
  bottomActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    paddingHorizontal: 4,
  },
  bottomAction: {
    alignItems: "center",
    gap: 4,
  },
  bottomActionText: {
    fontSize: 11,
    color: COLORS.text,
  },
  statusText: {
    textAlign: "center",
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 10,
  },
});
