import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { COLORS, API_BASE_URL } from "../theme";
import { api } from "../api/client";

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

export default function RegisterScreen({ navigation }) {
  const [role, setRole] = useState("customer"); // "customer" | "driver"
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Driver specific fields
  const [licenseNumber, setLicenseNumber] = useState("");
  const [vehicleName, setVehicleName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("Mini"); // "Bike", "Auto", "Mini", "Sedan", "SUV"
  const [vehicleColor, setVehicleColor] = useState("");
  
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !phone || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all core fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (role === "driver") {
      if (!licenseNumber || !vehicleName || !vehicleNumber || !vehicleColor) {
        Alert.alert("Error", "Please fill in all vehicle and license details");
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        role,
        name,
        phone,
        email,
        password,
        license_number: licenseNumber,
        vehicle_name: vehicleName,
        vehicle_number: vehicleNumber,
        vehicle_type: vehicleType,
        vehicle_color: vehicleColor,
      };

      const response = await fetch(`${API_BASE_URL}/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle error responses nicely
        const errMsg = data.error || (data.phone ? data.phone[0] : "Registration failed");
        throw new Error(errMsg);
      }

      // Save token, role, and name to AsyncStorage
      if (AsyncStorage) {
        await AsyncStorage.setItem("userToken", data.token);
        await AsyncStorage.setItem("userRole", data.role);
        await AsyncStorage.setItem("userName", data.name);
      }

      // Configure api client with token
      if (api && api.setToken) {
        api.setToken(data.token);
      }

      Alert.alert("Success", "Registered successfully", [
        {
          text: "OK",
          onPress: () => {
            if (data.role === "customer") {
              navigation.replace("Home", { userName: data.name });
            } else if (data.role === "driver") {
              navigation.replace("DriverDashboard");
            } else {
              navigation.replace("Login");
            }
          },
        },
      ]);
    } catch (error) {
      Alert.alert("Registration Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Register Account</Text>
            <Text style={styles.subtitle}>Join Dhuruvan Taxi to get riding or earning</Text>
          </View>

          {/* Role selector buttons */}
          <View style={styles.roleSelectorContainer}>
            <TouchableOpacity
              style={[styles.roleBtn, role === "customer" && styles.roleBtnActive]}
              onPress={() => setRole("customer")}
            >
              <Text style={[styles.roleBtnText, role === "customer" && styles.roleBtnTextActive]}>
                Customer
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleBtn, role === "driver" && styles.roleBtnActive]}
              onPress={() => setRole("driver")}
            >
              <Text style={[styles.roleBtnText, role === "driver" && styles.roleBtnTextActive]}>
                Driver
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter full name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter phone number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Driver specific field renders */}
            {role === "driver" && (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Driving License Number</Text>
                  <TextInput
                    style={styles.input}
                    value={licenseNumber}
                    onChangeText={setLicenseNumber}
                    placeholder="Enter license number"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Vehicle Model Name</Text>
                  <TextInput
                    style={styles.input}
                    value={vehicleName}
                    onChangeText={setVehicleName}
                    placeholder="e.g. Maruti Suzuki Swift"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Vehicle Plate Number</Text>
                  <TextInput
                    style={styles.input}
                    value={vehicleNumber}
                    onChangeText={setVehicleNumber}
                    placeholder="e.g. KA 01 AB 1234"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Vehicle Type</Text>
                  <View style={styles.pickerContainer}>
                    {["Bike", "Auto", "Mini", "Sedan", "SUV"].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[styles.typeBtn, vehicleType === type && styles.typeBtnActive]}
                        onPress={() => setVehicleType(type)}
                      >
                        <Text style={[styles.typeBtnText, vehicleType === type && styles.typeBtnTextActive]}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Vehicle Color</Text>
                  <TextInput
                    style={styles.input}
                    value={vehicleColor}
                    onChangeText={setVehicleColor}
                    placeholder="e.g. White"
                    placeholderTextColor="#999"
                  />
                </View>
              </>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                placeholderTextColor="#999"
                secureTextEntry
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm password"
                placeholderTextColor="#999"
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Register</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.footerLink}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4faf4",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1b5e20",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginTop: 6,
  },
  roleSelectorContainer: {
    flexDirection: "row",
    backgroundColor: "#e2ede2",
    borderRadius: 30,
    padding: 4,
    marginBottom: 24,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 26,
  },
  roleBtnActive: {
    backgroundColor: "#2e7d32",
  },
  roleBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2e7d32",
  },
  roleBtnTextActive: {
    color: "#fff",
  },
  form: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#2e7d32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2e7d32",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#f4faf4",
    borderWidth: 1.5,
    borderColor: "#e0efe0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: "#222",
  },
  pickerContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeBtn: {
    borderWidth: 1,
    borderColor: "#add5ad",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#f4faf4",
  },
  typeBtnActive: {
    backgroundColor: "#2e7d32",
    borderColor: "#2e7d32",
  },
  typeBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2e7d32",
  },
  typeBtnTextActive: {
    color: "#fff",
  },
  button: {
    backgroundColor: "#2e7d32",
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#1b5e20",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  footerText: {
    color: "#666",
    fontSize: 14,
  },
  footerLink: {
    color: "#2e7d32",
    fontSize: 14,
    fontWeight: "700",
  },
});
