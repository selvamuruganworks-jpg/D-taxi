import { API_BASE_URL } from "../theme";

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

let authToken = "";

// Load token from storage on startup
const loadToken = async () => {
  if (AsyncStorage) {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (token) authToken = token;
    } catch (e) {
      console.warn("Error loading token:", e);
    }
  }
};
loadToken();

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json" };
  if (authToken) {
    headers["Authorization"] = `Token ${authToken}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

export const api = {
  setToken: (token) => {
    authToken = token;
  },

  geocode: (place) =>
    request(`/geocode/?place=${encodeURIComponent(place)}`),

  categories: () => request(`/categories/`),

  estimate: (payload) =>
    request(`/estimate/`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  bookRide: (payload) =>
    request(`/book-ride/`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getRide: (id) => request(`/ride/${id}/`),

  cancelRide: (id) =>
    request(`/cancel-ride/`, { 
      method: "POST",
      body: JSON.stringify({ ride_id: id })
    }),
};
