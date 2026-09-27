// --- Security Utilities --------------------------------------
// Centralised helpers for brute-force protection, input
// sanitisation, auth-token guards, and session timeout.
// -------------------------------------------------------------

import AsyncStorage from "@react-native-async-storage/async-storage";

// -- Constants ------------------------------------------------
export const MAX_LOGIN_ATTEMPTS  = 5;          // attempts before lockout
export const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes
export const SESSION_TIMEOUT_MS  = 30 * 60 * 1000; // 30 min idle timeout

// AsyncStorage keys
const KEY_ATTEMPTS        = "sec_login_attempts";
const KEY_LOCKOUT_UNTIL   = "sec_lockout_until";
const KEY_LAST_ACTIVE     = "sec_last_active";
export const KEY_AUTH_TOKEN    = "auth_token";
export const KEY_STUDENT_INFO  = "student_info";

// -------------------------------------------------------------
// BRUTE-FORCE / RATE LIMITING
// -------------------------------------------------------------

/**
 * Returns { locked: true, remainingMs } if the account is currently locked,
 * or { locked: false } if the user may attempt login.
 */
export async function checkLockout() {
  const until = parseInt(await AsyncStorage.getItem(KEY_LOCKOUT_UNTIL) || "0", 10);
  const now   = Date.now();
  if (until > now) return { locked: true, remainingMs: until - now };
  return { locked: false };
}

/**
 * Increments the failed-attempt counter.
 * If MAX_LOGIN_ATTEMPTS is reached, stores a lockout timestamp.
 * Returns { attempts, lockedOut }.
 */
export async function recordFailedAttempt() {
  const prev      = parseInt(await AsyncStorage.getItem(KEY_ATTEMPTS) || "0", 10);
  const attempts  = prev + 1;
  await AsyncStorage.setItem(KEY_ATTEMPTS, String(attempts));

  if (attempts >= MAX_LOGIN_ATTEMPTS) {
    const until = Date.now() + LOCKOUT_DURATION_MS;
    await AsyncStorage.setItem(KEY_LOCKOUT_UNTIL, String(until));
    await AsyncStorage.setItem(KEY_ATTEMPTS, "0");
    return { attempts, lockedOut: true };
  }
  return { attempts, lockedOut: false };
}

/** Clears failed-attempt counter and lockout on successful login. */
export async function clearFailedAttempts() {
  await AsyncStorage.multiRemove([KEY_ATTEMPTS, KEY_LOCKOUT_UNTIL]);
}

/** Returns remaining attempts before lockout. */
export async function getRemainingAttempts() {
  const attempts = parseInt(await AsyncStorage.getItem(KEY_ATTEMPTS) || "0", 10);
  return Math.max(0, MAX_LOGIN_ATTEMPTS - attempts);
}

// -------------------------------------------------------------
// INPUT SANITISATION / VALIDATION
// -------------------------------------------------------------

/** Strips leading/trailing whitespace and removes control characters. */
export function sanitizeInput(str = "") {
  return str.trim().replace(/[\x00-\x1F\x7F]/g, "");
}

/** Basic email validation. */
export function isValidEmail(email = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Password strength: min 8 chars, 1 uppercase, 1 digit. */
export function isStrongPassword(pw = "") {
  return pw.length >= 8 && /[A-Z]/.test(pw) && /\d/.test(pw);
}

/** Mobile number: accepts PH format (09xxxxxxxxx or +639xxxxxxxxx). */
export function isValidMobile(mobile = "") {
  return /^(\+639|09)\d{9}$/.test(mobile.trim());
}

// -------------------------------------------------------------
// AUTH TOKEN GUARD
// -------------------------------------------------------------

/** Returns true if a valid auth token is stored. */
export async function isAuthenticated() {
  const token = await AsyncStorage.getItem(KEY_AUTH_TOKEN);
  return !!token && token.length > 0;
}

/**
 * Performs a full secure logout:
 *  - removes token, student info, session timestamp
 */
export async function secureLogout() {
  await AsyncStorage.multiRemove([KEY_AUTH_TOKEN, KEY_STUDENT_INFO, KEY_LAST_ACTIVE]);
}

// -------------------------------------------------------------
// SESSION / IDLE TIMEOUT
// -------------------------------------------------------------

/** Records "now" as the last activity time. */
export async function touchSession() {
  await AsyncStorage.setItem(KEY_LAST_ACTIVE, String(Date.now()));
}

/**
 * Returns true if the session has exceeded SESSION_TIMEOUT_MS of inactivity.
 * If no timestamp is stored, assumes fresh session (not expired).
 */
export async function isSessionExpired() {
  const last = parseInt(await AsyncStorage.getItem(KEY_LAST_ACTIVE) || "0", 10);
  if (!last) return false;
  return Date.now() - last > SESSION_TIMEOUT_MS;
}

// -------------------------------------------------------------
// HELPER: format ms to "MM:SS"
// -------------------------------------------------------------
export function formatCountdown(ms) {
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
