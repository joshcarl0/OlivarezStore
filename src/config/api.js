// ─── API Configuration ────────────────────────────────────
// Local backend API

import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Must match KEY_AUTH_TOKEN in utils/security.js
const AUTH_TOKEN_KEY = "auth_token";

export const API_BASE =
  Platform.OS === "web"
    ? "http://localhost/olivarez-store/backend_api/"
    : "https://subdepartmental-nakisha-postlabially.ngrok-free.dev/olivarez-store/backend_api/";

export const ENDPOINTS = {
  verifyStudent: `${API_BASE}verify_student.php`,
  register: `${API_BASE}register.php`,
  verifyOtp: `${API_BASE}verify_otp.php`,
  login: `${API_BASE}login.php`,
  products: `${API_BASE}products.php`,
  placeOrder: `${API_BASE}place_order.php`,
  getOrders: `${API_BASE}get_orders.php`,
};

// Common headers for public and ngrok requests
const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true",
};

// Helper: POST request (public — no auth header)
export async function apiPost(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(body),
  });
  return res.json();
}

// Helper: GET request (public — no auth header)
export async function apiGet(url) {
  const res = await fetch(url, {
    headers: {
      "ngrok-skip-browser-warning": "true",
    },
  });
  return res.json();
}

// ─────────────────────────────────────────────────────────
// Authenticated helpers — automatically attach Bearer token
// ─────────────────────────────────────────────────────────

/** POST with stored auth token in Authorization header. */
export async function apiPostAuth(url, body = {}) {
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...DEFAULT_HEADERS,
      "Authorization": token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

/** GET with stored auth token in Authorization header. */
export async function apiGetAuth(url) {
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  const res = await fetch(url, {
    headers: {
      "ngrok-skip-browser-warning": "true",
      "Authorization": token ? `Bearer ${token}` : "",
    },
  });
  return res.json();
}
