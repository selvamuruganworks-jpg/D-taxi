import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";

let RNMapView = null;
let RNMarker = null;
let RNPolyline = null;

// Only try to import react-native-maps on native platforms
if (Platform.OS !== "web") {
  try {
    const Maps = require("react-native-maps");
    RNMapView = Maps.default || Maps;
    RNMarker = Maps.Marker;
    RNPolyline = Maps.Polyline;
  } catch (e) {
    console.warn("react-native-maps not available:", e.message);
  }
}

// Fallback map placeholder
function MapPlaceholder({ style, children, region, ...props }) {
  return (
    <View style={[styles.placeholder, style]}>
      <Text style={styles.placeholderIcon}>🗺️</Text>
      <Text style={styles.placeholderText}>Map View</Text>
      {region && (
        <Text style={styles.coordText}>
          {region.latitude?.toFixed(4)}, {region.longitude?.toFixed(4)}
        </Text>
      )}
      {children}
    </View>
  );
}

function MarkerPlaceholder() {
  return null;
}

function PolylinePlaceholder() {
  return null;
}

export const SafeMapView = RNMapView || MapPlaceholder;
export const Marker = RNMarker || MarkerPlaceholder;
export const Polyline = RNPolyline || PolylinePlaceholder;

export default SafeMapView;

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: "#e8f5e9",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#c8e6c9",
    borderStyle: "dashed",
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 16,
    color: "#2e7d32",
    fontWeight: "600",
  },
  coordText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
});
