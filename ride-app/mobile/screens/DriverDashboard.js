import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView,
  Switch,
} from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { COLORS, API_BASE_URL } from "../theme";

// Safely import AsyncStorage for persistence
let AsyncStorage;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  try {
    AsyncStorage = require('react-native').AsyncStorage;
  } catch (err) {
    AsyncStorage = null;
  }
}

export default function DriverDashboard({ navigation }) {
  const [driverName, setDriverName] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);
  const [currentRide, setCurrentRide] = useState(null);
  
  // Mock Driver Stats
  const [stats, setStats] = useState({
    todayTrips: 4,
    totalTrips: 124,
    totalEarnings: 3240,
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (AsyncStorage) {
        const name = await AsyncStorage.getItem("userName");
        setDriverName(name || "Driver");
      }
    };
    loadProfile();
  }, []);

  // Poll for rides every 3 seconds if online and not on an active trip
  useEffect(() => {
    let interval;
    if (isOnline && !currentRide) {
      const checkForRequests = async () => {
        try {
          const token = AsyncStorage ? await AsyncStorage.getItem("userToken") : "";
          const response = await fetch(`${API_BASE_URL}/my-rides/`, { // Check all rides to find a pending one of same vehicle type
            headers: {
              "Authorization": `Token ${token}`,
            }
          });
          const data = await response.json();
          // Find any ride in "SEARCHING" state
          const pendingRide = data.find(r => r.status === "SEARCHING");
          if (pendingRide) {
            setActiveRequest(pendingRide);
          } else {
            setActiveRequest(null);
          }
        } catch (e) {
          console.warn("Poll error:", e);
        }
      };
      checkForRequests();
      interval = setInterval(checkForRequests, 3000);
    } else {
      setActiveRequest(null);
    }
    return () => clearInterval(interval);
  }, [isOnline, currentRide]);

  // Poll active ride details
  useEffect(() => {
    let interval;
    if (currentRide) {
      const getRideDetails = async () => {
        try {
          const token = AsyncStorage ? await AsyncStorage.getItem("userToken") : "";
          const response = await fetch(`${API_BASE_URL}/ride/${currentRide.id}/`, {
            headers: {
              "Authorization": `Token ${token}`,
            }
          });
          const data = await response.json();
          setCurrentRide(data);
          
          if (data.status === "CANCELLED" || data.status === "COMPLETED") {
            setCurrentRide(null);
            Alert.alert("Ride Status", `Ride has been ${data.status.toLowerCase()}`);
          }
        } catch (e) {
          console.warn("Poll active ride error:", e);
        }
      };
      getRideDetails();
      interval = setInterval(getRideDetails, 3000);
    }
    return () => clearInterval(interval);
  }, [currentRide?.id]);

  const toggleOnline = async (value) => {
    setLoading(true);
    try {
      const token = AsyncStorage ? await AsyncStorage.getItem("userToken") : "";
      const endpoint = value ? "driver-online/" : "driver-offline/";
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`,
        },
        body: JSON.stringify({ lat: 13.0827, lng: 80.2707 }), // Default driver coords
      });
      if (response.ok) {
        setIsOnline(value);
      } else {
        throw new Error("Unable to update online status");
      }
    } catch (e) {
      Alert.alert("Status Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRide = async (rideId) => {
    try {
      const token = AsyncStorage ? await AsyncStorage.getItem("userToken") : "";
      const response = await fetch(`${API_BASE_URL}/accept-ride/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`,
        },
        body: JSON.stringify({ ride_id: rideId }),
      });
      const data = await response.json();
      if (response.ok) {
        setCurrentRide(data);
        setActiveRequest(null);
      } else {
        throw new Error(data.error || "Accept ride failed");
      }
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const handleRejectRide = async (rideId) => {
    try {
      const token = AsyncStorage ? await AsyncStorage.getItem("userToken") : "";
      await fetch(`${API_BASE_URL}/reject-ride/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`,
        },
        body: JSON.stringify({ ride_id: rideId }),
      });
      setActiveRequest(null);
    } catch (e) {
      console.warn("Reject ride error:", e);
    }
  };

  const handleUpdateStatus = async (statusEndpoint) => {
    try {
      const token = AsyncStorage ? await AsyncStorage.getItem("userToken") : "";
      const response = await fetch(`${API_BASE_URL}/${statusEndpoint}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`,
        },
        body: JSON.stringify({ ride_id: currentRide.id }),
      });
      const data = await response.json();
      if (response.ok) {
        setCurrentRide(data);
        if (statusEndpoint === "complete-ride") {
          setCurrentRide(null);
          // Increment total stats
          setStats(prev => ({
            ...prev,
            todayTrips: prev.todayTrips + 1,
            totalTrips: prev.totalTrips + 1,
            totalEarnings: prev.totalEarnings + data.fare,
          }));
          Alert.alert("Trip Completed", "Earning added to your account!");
        }
      } else {
        throw new Error(data.error || "Update status failed");
      }
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const handleLogout = async () => {
    try {
      const token = AsyncStorage ? await AsyncStorage.getItem("userToken") : "";
      await fetch(`${API_BASE_URL}/logout/`, {
        method: "POST",
        headers: {
          "Authorization": `Token ${token}`,
        }
      });
      if (AsyncStorage) {
        await AsyncStorage.clear();
      }
      navigation.replace("Login");
    } catch (e) {
      if (AsyncStorage) await AsyncStorage.clear();
      navigation.replace("Login");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.driverGreeting}>Hello, {driverName}</Text>
          <Text style={styles.driverRole}>Dhuruvan Driver Partner</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#e53935" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Online/Offline Toggle */}
        <View style={[styles.card, styles.statusCard, isOnline && styles.statusCardOnline]}>
          <Text style={[styles.statusText, isOnline && styles.statusTextOnline]}>
            {isOnline ? "YOU ARE ONLINE" : "YOU ARE OFFLINE"}
          </Text>
          {loading ? (
            <ActivityIndicator color={isOnline ? "#fff" : "#2e7d32"} />
          ) : (
            <Switch
              value={isOnline}
              onValueChange={toggleOnline}
              trackColor={{ false: "#ccc", true: "#aedba4" }}
              thumbColor={isOnline ? "#2e7d32" : "#f4f4f4"}
            />
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>₹{stats.totalEarnings}</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{stats.todayTrips}</Text>
            <Text style={styles.statLabel}>Today's Trips</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{stats.totalTrips}</Text>
            <Text style={styles.statLabel}>Total Trips</Text>
          </View>
        </View>

        {/* Active Trip Sequence Card */}
        {currentRide ? (
          <View style={[styles.card, styles.tripCard]}>
            <Text style={styles.tripHeading}>ACTIVE TRIP IN PROGRESS</Text>
            <View style={styles.divider} />
            <Text style={styles.infoLabel}>Customer</Text>
            <Text style={styles.infoValue}>{currentRide.customer?.name || "Guest User"}</Text>

            <Text style={styles.infoLabel}>Pickup Address</Text>
            <Text style={styles.infoValue}>{currentRide.pickup_address}</Text>

            <Text style={styles.infoLabel}>Destination Address</Text>
            <Text style={styles.infoValue}>{currentRide.destination_address}</Text>

            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Trip Fare:</Text>
              <Text style={styles.fareValue}>₹{currentRide.fare}</Text>
            </View>

            <Text style={styles.rideStatusText}>Current Status: <Text style={styles.statusLabelBold}>{currentRide.status}</Text></Text>

            {currentRide.status === "ACCEPTED" && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleUpdateStatus("arrived")}
              >
                <Text style={styles.actionBtnText}>Arrived at Pickup</Text>
              </TouchableOpacity>
            )}

            {currentRide.status === "ARRIVED" && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleUpdateStatus("start-ride")}
              >
                <Text style={styles.actionBtnText}>Start Ride</Text>
              </TouchableOpacity>
            )}

            {currentRide.status === "STARTED" && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#1b5e20" }]}
                onPress={() => handleUpdateStatus("complete-ride")}
              >
                <Text style={styles.actionBtnText}>Complete Ride</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : isOnline && activeRequest ? (
          /* Incoming Request Offer Card */
          <View style={[styles.card, styles.requestCard]}>
            <View style={styles.requestHeader}>
              <FontAwesome5 name="bell" size={20} color="#e53935" />
              <Text style={styles.requestTitle}>NEW TRIP OFFER</Text>
            </View>
            <View style={styles.divider} />
            
            <Text style={styles.infoLabel}>Pickup Location</Text>
            <Text style={styles.infoValue}>{activeRequest.pickup_address}</Text>

            <Text style={styles.infoLabel}>Destination Location</Text>
            <Text style={styles.infoValue}>{activeRequest.destination_address}</Text>

            <View style={styles.fareContainer}>
              <View>
                <Text style={styles.fareLabel}>Distance</Text>
                <Text style={styles.fareValueText}>{activeRequest.distance} km</Text>
              </View>
              <View>
                <Text style={styles.fareLabel}>Estimated Fare</Text>
                <Text style={styles.fareValueText}>₹{activeRequest.fare}</Text>
              </View>
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.btnHalf, styles.btnReject]}
                onPress={() => handleRejectRide(activeRequest.id)}
              >
                <Text style={styles.btnRejectText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnHalf, styles.btnAccept]}
                onPress={() => handleAcceptRide(activeRequest.id)}
              >
                <Text style={styles.btnAcceptText}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : isOnline ? (
          <View style={styles.waitingContainer}>
            <ActivityIndicator size="large" color="#2e7d32" style={{ marginBottom: 16 }} />
            <Text style={styles.waitingText}>Waiting for new trip requests...</Text>
          </View>
        ) : (
          <View style={styles.waitingContainer}>
            <Ionicons name="cloud-offline-outline" size={48} color="#999" style={{ marginBottom: 16 }} />
            <Text style={styles.waitingText}>Go online to start receiving ride offers</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4faf4",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e8f5e9",
  },
  driverGreeting: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1b5e20",
  },
  driverRole: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
    marginTop: 2,
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#ffebee",
  },
  scrollContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#2e7d32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  statusCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e53935",
  },
  statusCardOnline: {
    borderColor: "#2e7d32",
    backgroundColor: "#e8f5e9",
  },
  statusText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#e53935",
  },
  statusTextOnline: {
    color: "#2e7d32",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statVal: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1b5e20",
  },
  statLabel: {
    fontSize: 11,
    color: "#666",
    marginTop: 4,
    fontWeight: "500",
  },
  tripCard: {
    borderLeftWidth: 5,
    borderLeftColor: "#2e7d32",
  },
  tripHeading: {
    fontSize: 14,
    fontWeight: "800",
    color: "#2e7d32",
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: "#e8f5e9",
    marginVertical: 14,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#888",
    marginTop: 10,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222",
    marginTop: 4,
  },
  fareRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    padding: 12,
    backgroundColor: "#f4faf4",
    borderRadius: 8,
  },
  fareLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  fareValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2e7d32",
  },
  rideStatusText: {
    fontSize: 14,
    color: "#444",
    marginTop: 14,
    textAlign: "center",
  },
  statusLabelBold: {
    fontWeight: "800",
    color: "#1b5e20",
  },
  actionBtn: {
    backgroundColor: "#2e7d32",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 20,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  requestCard: {
    borderColor: "#e53935",
    borderWidth: 1,
  },
  requestHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  requestTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#e53935",
    letterSpacing: 0.5,
  },
  fareContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
    padding: 12,
    backgroundColor: "#fbe9e7",
    borderRadius: 8,
  },
  fareValueText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#d84315",
    textAlign: "center",
    marginTop: 2,
  },
  btnRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  btnHalf: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: "center",
  },
  btnReject: {
    borderWidth: 1.5,
    borderColor: "#e53935",
    backgroundColor: "#fff",
  },
  btnRejectText: {
    color: "#e53935",
    fontWeight: "700",
  },
  btnAccept: {
    backgroundColor: "#2e7d32",
  },
  btnAcceptText: {
    color: "#fff",
    fontWeight: "700",
  },
  waitingContainer: {
    alignItems: "center",
    paddingVertical: 48,
  },
  waitingText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    textAlign: "center",
  },
});
