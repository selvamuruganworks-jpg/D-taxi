import React from "react";
import { View, Text, StyleSheet, Button } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { COLORS } from "../theme";

export default function ChoreRideScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const {
    selectedRide,
    pickup,
    drop,
    distance_km,
    duration_min,
    route_geometry,
  } = route.params ?? {};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Ride</Text>
      {selectedRide && (
        <Text style={styles.subtitle}>Car: {selectedRide.name}</Text>
      )}
      <Text style={styles.info}>Distance: {distance_km?.toFixed(2)} km</Text>
      <Text style={styles.info}>Duration: {Math.round(duration_min)} min</Text>
      <Button title="Back to Home" onPress={() => navigation.navigate('Home')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 8,
    color: COLORS.text,
  },
  info: {
    fontSize: 16,
    marginBottom: 6,
    color: COLORS.muted,
  },
});
