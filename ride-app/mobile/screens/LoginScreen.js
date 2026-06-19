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

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Login failed");
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

      // Navigate based on role
      if (data.role === "customer") {
        navigation.replace("Home", { userName: data.name });
      } else if (data.role === "driver") {
        navigation.replace("DriverDashboard");
      } else if (data.role === "admin") {
        navigation.replace("AdminDashboard");
      } else {
        Alert.alert("Error", "Unknown user role");
      }
    } catch (error) {
      Alert.alert("Login Failed", error.message);
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
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Log in to book a ride or start driving</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="#999"
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Log In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.footerLink}>Register Here</Text>
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
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 36,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1b5e20",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    marginTop: 8,
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
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2e7d32",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f4faf4",
    borderWidth: 1.5,
    borderColor: "#e0efe0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#222",
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
