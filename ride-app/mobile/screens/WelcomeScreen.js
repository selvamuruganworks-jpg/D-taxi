import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { COLORS } from "../theme";

const Skyline = () => {
  return (
    <View style={styles.skylineContainer}>
      {/* Background layer - light green towers */}
      <View style={[styles.tower, { height: 110, width: 45, left: '5%', backgroundColor: '#e2ede2' }]} />
      <View style={[styles.tower, { height: 140, width: 55, left: '15%', backgroundColor: '#d9ebd9' }]}>
        <View style={[styles.antenna, { backgroundColor: '#d9ebd9' }]} />
      </View>
      <View style={[styles.tower, { height: 90, width: 40, left: '30%', backgroundColor: '#e2ede2' }]} />
      <View style={[styles.tower, { height: 130, width: 50, left: '42%', backgroundColor: '#d9ebd9' }]} />
      <View style={[styles.tower, { height: 160, width: 55, left: '58%', backgroundColor: '#e2ede2' }]}>
        <View style={[styles.antenna, { backgroundColor: '#e2ede2' }]} />
      </View>
      <View style={[styles.tower, { height: 100, width: 35, left: '72%', backgroundColor: '#d9ebd9' }]} />
      <View style={[styles.tower, { height: 135, width: 50, left: '82%', backgroundColor: '#e2ede2' }]} />

      {/* Foreground layer - slightly darker green towers */}
      <View style={[styles.tower, { height: 75, width: 50, left: '0%', backgroundColor: '#cbe6cb' }]} />
      <View style={[styles.tower, { height: 115, width: 40, left: '10%', backgroundColor: '#c2e0c2' }]} />
      <View style={[styles.tower, { height: 85, width: 55, left: '25%', backgroundColor: '#cbe6cb' }]} />
      <View style={[styles.tower, { height: 135, width: 45, left: '38%', backgroundColor: '#c2e0c2' }]}>
        <View style={[styles.antenna, { backgroundColor: '#c2e0c2' }]} />
      </View>
      <View style={[styles.tower, { height: 100, width: 60, left: '50%', backgroundColor: '#cbe6cb' }]} />
      <View style={[styles.tower, { height: 120, width: 40, left: '68%', backgroundColor: '#c2e0c2' }]} />
      <View style={[styles.tower, { height: 80, width: 50, left: '78%', backgroundColor: '#cbe6cb' }]} />
      <View style={[styles.tower, { height: 110, width: 45, left: '90%', backgroundColor: '#c2e0c2' }]} />

      {/* Bush/Tree details for organic feel */}
      <View style={[styles.bush, { height: 26, width: 26, left: '7%', backgroundColor: '#add5ad' }]} />
      <View style={[styles.bush, { height: 32, width: 32, left: '20%', backgroundColor: '#add5ad' }]} />
      <View style={[styles.bush, { height: 22, width: 22, left: '33%', backgroundColor: '#add5ad' }]} />
      <View style={[styles.bush, { height: 30, width: 30, left: '65%', backgroundColor: '#add5ad' }]} />
      <View style={[styles.bush, { height: 25, width: 25, left: '76%', backgroundColor: '#add5ad' }]} />
    </View>
  );
};

export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      {/* Decorative Background Glows */}
      <View style={[styles.glow, { top: -100, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: '#e8f6e8' }]} />
      <View style={[styles.glow, { bottom: -150, right: -150, width: 400, height: 400, borderRadius: 200, backgroundColor: '#e2f4e2' }]} />

      <View style={styles.center}>
        {/* Logo with clean outer ring and shadow */}
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Titles */}
        <Text style={styles.title}>Dhuruvan</Text>
        <Text style={styles.subtitle}>Safe ride with{"\n"}Dhuruvan Taxi</Text>

        {/* Skyline & Car Area */}
        <View style={styles.skylineWrapper}>
          <Skyline />
          <Image
            source={require("../assets/car.png")}
            style={styles.car}
            resizeMode="contain"
          />
          <View style={styles.carShadow} />
        </View>
      </View>

      {/* Action Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Home")}
      >
        <Text style={styles.buttonText}>Get Started</Text>
        <View style={styles.arrowCircle}>
          <Text style={styles.arrowText}>→</Text>
        </View>
      </TouchableOpacity>

      {/* Bottom Features Bullet Row */}
      <View style={styles.featuresRow}>
        <Text style={styles.feature}>Safe</Text>
        <Text style={styles.separator}>•</Text>
        <Text style={styles.feature}>Reliable</Text>
        <Text style={styles.separator}>•</Text>
        <Text style={styles.feature}>Comfortable</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4faf4",
    justifyContent: "space-between",
    paddingBottom: 30,
    position: "relative",
  },
  glow: {
    position: "absolute",
    opacity: 0.6,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
  },
  logoContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: "#e8f5e9",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    shadowColor: "#2e7d32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 20,
    overflow: "hidden",
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  title: {
    color: "#1b5e20",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  subtitle: {
    color: "#2e7d32",
    textAlign: "center",
    marginTop: 10,
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 22,
  },
  skylineWrapper: {
    width: "100%",
    height: 240,
    alignItems: "center",
    justifyContent: "flex-end",
    position: "relative",
    marginTop: 20,
  },
  skylineContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  tower: {
    position: "absolute",
    bottom: 0,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  antenna: {
    width: 2,
    height: 12,
    alignSelf: "center",
    position: "absolute",
    top: -12,
  },
  bush: {
    position: "absolute",
    bottom: 0,
    borderRadius: 16,
  },
  car: {
    width: "80%",
    height: 140,
    zIndex: 2,
    marginBottom: 5,
  },
  carShadow: {
    width: 240,
    height: 12,
    backgroundColor: "#cce8cc",
    borderRadius: 6,
    opacity: 0.5,
    zIndex: 1,
    marginTop: -8,
  },
  button: {
    backgroundColor: "#2e7d32",
    marginHorizontal: 30,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#1b5e20",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 18,
    flex: 1,
    textAlign: "center",
    marginLeft: 32, // Offset to balance arrow button space
  },
  arrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
    marginTop: -2, // Vertical alignment fix
  },
  featuresRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },
  feature: {
    color: "#2e7d32",
    fontSize: 14,
    fontWeight: "600",
  },
  separator: {
    color: "#add5ad",
    marginHorizontal: 10,
    fontSize: 14,
    fontWeight: "600",
  },
});
