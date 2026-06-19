// mobile/screens/RouteChangeScreen.js
import React from "react";
import { View, Text, StyleSheet, Button } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

/**
 * Simple placeholder screen that represents the "Route Change" UI.
 * It receives any params you pass via navigation (e.g., rideId) and
 * displays a basic layout. Replace the content with your final design.
 */
export default function RouteChangeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { rideId } = route.params ?? {};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Route Change</Text>
      {rideId && <Text style={styles.subtitle}>Ride ID: {rideId}</Text>}
      <Text style={styles.body}>This is where you implement the UI for changing a route.</Text>
      <Button title="Go Back" onPress={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 8,
    color: "#555",
  },
  body: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#444",
  },
});
