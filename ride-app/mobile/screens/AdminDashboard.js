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
  FlatList,
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

export default function AdminDashboard({ navigation }) {
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" | "users" | "drivers" | "rides"
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState({
    total_customers: 0,
    total_drivers: 0,
    online_drivers: 0,
    total_rides: 0,
    completed_rides: 0,
    cancelled_rides: 0,
  });
  
  const [usersList, setUsersList] = useState([]);
  const [driversList, setDriversList] = useState([]);
  const [ridesList, setRidesList] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = AsyncStorage ? await AsyncStorage.getItem("userToken") : "";
      
      // 1. Fetch Dashboard Metrics
      const metricsResp = await fetch(`${API_BASE_URL}/admin/dashboard/`, {
        headers: { "Authorization": `Token ${token}` }
      });
      if (metricsResp.ok) {
        const metricsData = await metricsResp.json();
        setMetrics(metricsData);
      }

      // 2. Fetch User Accounts
      const usersResp = await fetch(`${API_BASE_URL}/admin/users/`, {
        headers: { "Authorization": `Token ${token}` }
      });
      if (usersResp.ok) {
        const usersData = await usersResp.json();
        setUsersList(usersData);
      }

      // 3. Fetch Driver Accounts
      const driversResp = await fetch(`${API_BASE_URL}/admin/drivers/`, {
        headers: { "Authorization": `Token ${token}` }
      });
      if (driversResp.ok) {
        const driversData = await driversResp.json();
        setDriversList(driversData);
      }

      // 4. Fetch Ride Logs
      const ridesResp = await fetch(`${API_BASE_URL}/admin/rides/`, {
        headers: { "Authorization": `Token ${token}` }
      });
      if (ridesResp.ok) {
        const ridesData = await ridesResp.json();
        setRidesList(ridesData);
      }

    } catch (e) {
      console.warn("Admin fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleUserAction = async (userId, action) => {
    try {
      const token = AsyncStorage ? await AsyncStorage.getItem("userToken") : "";
      const response = await fetch(`${API_BASE_URL}/admin/users/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`,
        },
        body: JSON.stringify({ user_id: userId, action }),
      });
      if (response.ok) {
        Alert.alert("Success", `User successfully ${action}ed`);
        fetchData();
      } else {
        throw new Error("Action failed");
      }
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const handleDriverAction = async (driverId, action) => {
    try {
      const token = AsyncStorage ? await AsyncStorage.getItem("userToken") : "";
      const response = await fetch(`${API_BASE_URL}/admin/drivers/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`,
        },
        body: JSON.stringify({ driver_id: driverId, action }),
      });
      if (response.ok) {
        Alert.alert("Success", `Driver successfully ${action}ed`);
        fetchData();
      } else {
        throw new Error("Action failed");
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
        headers: { "Authorization": `Token ${token}` }
      });
      if (AsyncStorage) await AsyncStorage.clear();
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
          <Text style={styles.adminTitle}>Admin Portal</Text>
          <Text style={styles.adminSubtitle}>Dhuruvan Fleet Management</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchData}>
            <Ionicons name="refresh" size={20} color="#2e7d32" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#e53935" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {[
          { key: "dashboard", label: "Overview", icon: "th-large" },
          { key: "users", label: "Users", icon: "users" },
          { key: "drivers", label: "Drivers", icon: "id-card" },
          { key: "rides", label: "Rides", icon: "route" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <FontAwesome5
              name={tab.icon}
              size={14}
              color={activeTab === tab.key ? "#fff" : "#2e7d32"}
              style={{ marginBottom: 4 }}
            />
            <Text style={[styles.tabBtnText, activeTab === tab.key && styles.tabBtnTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#2e7d32" />
        </View>
      )}

      {/* Main Content Area */}
      {!loading && (
        <ScrollView contentContainerStyle={styles.contentContainer}>
          {activeTab === "dashboard" && (
            <View style={styles.metricsGrid}>
              <View style={[styles.metricCard, { borderLeftColor: "#2e7d32" }]}>
                <Text style={styles.metricVal}>{metrics.total_customers}</Text>
                <Text style={styles.metricLabel}>Total Users</Text>
              </View>
              <View style={[styles.metricCard, { borderLeftColor: "#1565c0" }]}>
                <Text style={styles.metricVal}>{metrics.total_drivers}</Text>
                <Text style={styles.metricLabel}>Total Drivers</Text>
              </View>
              <View style={[styles.metricCard, { borderLeftColor: "#00c853" }]}>
                <Text style={styles.metricVal}>{metrics.online_drivers}</Text>
                <Text style={styles.metricLabel}>Online Drivers</Text>
              </View>
              <View style={[styles.metricCard, { borderLeftColor: "#ff9100" }]}>
                <Text style={styles.metricVal}>{metrics.total_rides}</Text>
                <Text style={styles.metricLabel}>Total Rides</Text>
              </View>
              <View style={[styles.metricCard, { borderLeftColor: "#2e7d32" }]}>
                <Text style={styles.metricVal}>{metrics.completed_rides}</Text>
                <Text style={styles.metricLabel}>Completed Rides</Text>
              </View>
              <View style={[styles.metricCard, { borderLeftColor: "#e53935" }]}>
                <Text style={styles.metricVal}>{metrics.cancelled_rides}</Text>
                <Text style={styles.metricLabel}>Cancelled Rides</Text>
              </View>
            </View>
          )}

          {activeTab === "users" && (
            <View style={styles.listContainer}>
              <Text style={styles.sectionHeading}>Manage Customers</Text>
              {usersList.length === 0 ? (
                <Text style={styles.emptyText}>No registered customers found</Text>
              ) : (
                usersList.map((user) => (
                  <View key={user.id} style={styles.accountItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{user.name || "Unnamed User"}</Text>
                      <Text style={styles.itemDetail}>📞 {user.phone}</Text>
                      <Text style={styles.itemDetail}>✉️ {user.email || "No email"}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.actionBtn, user.is_active ? styles.btnBlock : styles.btnUnblock]}
                      onPress={() => handleUserAction(user.id, user.is_active ? "block" : "unblock")}
                    >
                      <Text style={styles.actionBtnText}>{user.is_active ? "Block" : "Unblock"}</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === "drivers" && (
            <View style={styles.listContainer}>
              <Text style={styles.sectionHeading}>Manage Driver Fleet</Text>
              {driversList.length === 0 ? (
                <Text style={styles.emptyText}>No registered drivers found</Text>
              ) : (
                driversList.map((d) => (
                  <View key={d.id} style={styles.accountItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{d.user?.name || d.user?.username}</Text>
                      <Text style={styles.itemDetail}>🚗 {d.vehicle_name} ({d.vehicle_number})</Text>
                      <Text style={styles.itemDetail}>⚙️ Type: {d.vehicle_type} | 🎨 {d.vehicle_color}</Text>
                      <Text style={styles.itemDetail}>⭐️ Rating: {d.rating} | Online: {d.is_online ? "Yes" : "No"}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.actionBtn, d.user?.is_active ? styles.btnBlock : styles.btnUnblock]}
                      onPress={() => handleDriverAction(d.id, d.user?.is_active ? "block" : "unblock")}
                    >
                      <Text style={styles.actionBtnText}>{d.user?.is_active ? "Block" : "Unblock"}</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === "rides" && (
            <View style={styles.listContainer}>
              <Text style={styles.sectionHeading}>Ride Booking Logs</Text>
              {ridesList.length === 0 ? (
                <Text style={styles.emptyText}>No rides logged in database</Text>
              ) : (
                ridesList.map((ride) => (
                  <View key={ride.id} style={styles.rideItem}>
                    <View style={styles.rideItemHeader}>
                      <Text style={styles.rideId}>RIDE #{ride.id}</Text>
                      <View style={[styles.statusBadge, styles[`badge${ride.status}`]]}>
                        <Text style={styles.statusBadgeText}>{ride.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.rideAddress}><Text style={styles.boldText}>Pickup:</Text> {ride.pickup_address}</Text>
                    <Text style={styles.rideAddress}><Text style={styles.boldText}>Drop:</Text> {ride.destination_address}</Text>
                    
                    <View style={styles.rideDetailRow}>
                      <Text style={styles.itemDetail}>👤 Cust: {ride.customer?.name || "Guest"}</Text>
                      <Text style={styles.itemDetail}>🚕 Driver: {ride.driver?.user?.name || "Unassigned"}</Text>
                    </View>
                    <View style={styles.rideDetailRow}>
                      <Text style={styles.itemDetail}>📏 Dist: {ride.distance} km</Text>
                      <Text style={styles.rideFareText}>₹{ride.fare}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      )}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e8f5e9",
  },
  adminTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1b5e20",
  },
  adminSubtitle: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    gap: 8,
  },
  refreshBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#e8f5e9",
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#ffebee",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e8f5e9",
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 12,
  },
  tabBtnActive: {
    backgroundColor: "#2e7d32",
  },
  tabBtnText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#2e7d32",
  },
  tabBtnTextActive: {
    color: "#ffffff",
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  contentContainer: {
    padding: 16,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricCard: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  metricVal: {
    fontSize: 24,
    fontWeight: "800",
    color: "#222",
  },
  metricLabel: {
    fontSize: 11,
    color: "#666",
    fontWeight: "600",
    marginTop: 4,
  },
  listContainer: {
    width: "100%",
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1b5e20",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginTop: 24,
  },
  accountItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
    marginBottom: 4,
  },
  itemDetail: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
    fontWeight: "500",
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  btnBlock: {
    backgroundColor: "#ffebee",
  },
  btnUnblock: {
    backgroundColor: "#e8f5e9",
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: "700",
  },
  rideItem: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  rideItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  rideId: {
    fontSize: 13,
    fontWeight: "800",
    color: "#2e7d32",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#fff",
  },
  badgePENDING: { backgroundColor: "#ffa726" },
  badgeSEARCHING: { backgroundColor: "#29b6f6" },
  badgeACCEPTED: { backgroundColor: "#ab47bc" },
  badgeARRIVED: { backgroundColor: "#66bb6a" },
  badgeSTARTED: { backgroundColor: "#26a69a" },
  badgeCOMPLETED: { backgroundColor: "#2e7d32" },
  badgeCANCELLED: { backgroundColor: "#e53935" },
  rideAddress: {
    fontSize: 13,
    color: "#333",
    marginTop: 4,
  },
  boldText: {
    fontWeight: "700",
    color: "#666",
  },
  rideDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  rideFareText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2e7d32",
  },
});
