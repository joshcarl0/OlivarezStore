import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert, Image,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ENDPOINTS, apiPost } from "../config/api";
import {
  checkLockout,
  recordFailedAttempt,
  clearFailedAttempts,
  getRemainingAttempts,
  sanitizeInput,
  isValidEmail,
  touchSession,
  formatCountdown,
  MAX_LOGIN_ATTEMPTS,
} from "../utils/security";

const OC_GREEN = "#0F5D33";
const OC_GOLD  = "#FBEBB8";

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [studentId, setStudentId]   = useState("");
  const [password, setPassword]     = useState("");
  const [showPassword, setShowPass] = useState(false);
  const [loading, setLoading]       = useState(false);

  // ── Security state ───────────────────────────────────────
  const [lockoutMs, setLockoutMs]         = useState(0);   // ms remaining in lockout
  const [attemptsLeft, setAttemptsLeft]   = useState(MAX_LOGIN_ATTEMPTS); // remaining tries
  const lockoutInterval                   = useRef(null);

  // ── Check lockout on mount & restore attempt count ──────
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const { locked, remainingMs } = await checkLockout();
      if (!mounted) return;
      if (locked) startLockoutTimer(remainingMs);
      const left = await getRemainingAttempts();
      if (mounted) setAttemptsLeft(left);
    };
    init();
    return () => { mounted = false; clearInterval(lockoutInterval.current); };
  }, []);

  /** Starts a countdown interval that decrements lockoutMs every second. */
  function startLockoutTimer(ms) {
    setLockoutMs(ms);
    clearInterval(lockoutInterval.current);
    lockoutInterval.current = setInterval(() => {
      setLockoutMs((prev) => {
        if (prev <= 1000) {
          clearInterval(lockoutInterval.current);
          setAttemptsLeft(MAX_LOGIN_ATTEMPTS);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
  }

  const handleIdChange = (text) => {
    setStudentId(sanitizeInput(text));
  };

  const handleLogin = async () => {
    // ── Lockout guard ──────────────────────────────────────
    if (lockoutMs > 0) {
      Alert.alert("Account Locked", `Too many failed attempts.\nPlease wait ${formatCountdown(lockoutMs)} before trying again.`);
      return;
    }

    // ── Input validation ───────────────────────────────────
    const cleanId = sanitizeInput(studentId);
    if (!cleanId) {
      Alert.alert("Required", "Please enter your Student ID.");
      return;
    }
    if (!password) {
      Alert.alert("Required", "Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiPost(ENDPOINTS.login, {
        identifier: cleanId,
        email     : cleanId,
        password  : password,
      });

      if (res.success) {
        // ── Successful login: clear lockout state & record session ──
        await clearFailedAttempts();
        await AsyncStorage.setItem("auth_token",   res.data.token);
        await AsyncStorage.setItem("student_info", JSON.stringify(res.data.student));
        await touchSession(); // start idle-timeout tracking
        const role = res.data?.role || res.data?.student?.role;
        if (role === "Store Staff" || role === "Super Admin") {
          navigation.replace("StaffDashboard");
        } else {
          navigation.replace("Home");
        }
      } else {
        // ── Failed login: record attempt & update UI ──────────────
        const { lockedOut, attempts } = await recordFailedAttempt();
        if (lockedOut) {
          startLockoutTimer(5 * 60 * 1000);
          Alert.alert(
            "Account Locked 🔒",
            `You have exceeded ${MAX_LOGIN_ATTEMPTS} failed login attempts.\nYour account is locked for 5 minutes.`
          );
        } else {
          const left = MAX_LOGIN_ATTEMPTS - attempts;
          setAttemptsLeft(left);
          Alert.alert(
            "Login Failed",
            `${res.message || "Invalid credentials."}\n\n${left} attempt${left !== 1 ? "s" : ""} remaining before account lock.`
          );
        }
      }
    } catch (err) {
      Alert.alert("Connection Error", "Cannot reach the server.\nMake sure XAMPP is running and check your API_BASE in config/api.js");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor={OC_GREEN} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" bounces={false}>

          {/* ── Green Header ── */}
          <View style={styles.header}>
            <View style={styles.sealContainer}>
              <Image source={require("../../assets/OC-LOGO.png")} style={styles.sealImage} resizeMode="contain" />
            </View>
            <Text style={styles.titleMain}>Olivarian</Text>
            <Text style={styles.titleSub}>{"Uniform Store\nSupply"}</Text>
          </View>

          {/* ── White Card ── */}
          <View style={[styles.card, { paddingBottom: Math.max(insets.bottom, 24) + 24 }]}>

            <Text style={styles.label}>Student ID Number</Text>
            <View style={styles.emailInputWrapper}>
              <TextInput
                style={styles.emailInput}
                placeholder="e.g. 232C-0018"
                placeholderTextColor="#8B8B8A"
                value={studentId}
                onChangeText={handleIdChange}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
            <Text style={styles.inputSubHint}>
              Enter your official Olivarez College Student ID number.
            </Text>

            <Text style={[styles.label, { marginTop: 18 }]}>Password</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your password here"
                placeholderTextColor="#bbb"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPassword)} style={styles.eyeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.eyeIcon}>{showPassword ? "🙈" : "👁️"}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")} style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* ── Lockout banner ── */}
            {lockoutMs > 0 && (
              <View style={styles.lockoutBanner}>
                <Text style={styles.lockoutIcon}>🔒</Text>
                <Text style={styles.lockoutText}>
                  Account locked — try again in{" "}
                  <Text style={{ fontWeight: "800" }}>{formatCountdown(lockoutMs)}</Text>
                </Text>
              </View>
            )}

            {/* ── Attempts-remaining warning (show when <3 attempts left & not locked) ── */}
            {lockoutMs === 0 && attemptsLeft < MAX_LOGIN_ATTEMPTS && attemptsLeft > 0 && (
              <View style={styles.warningBanner}>
                <Text style={styles.warningText}>
                  ⚠️  {attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""} remaining before lock
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.signInBtn, (loading || lockoutMs > 0) && styles.signInBtnDisabled]}
              onPress={handleLogin}
              disabled={loading || lockoutMs > 0}
              activeOpacity={0.85}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signInText}>Sign in</Text>}
            </TouchableOpacity>

            <View style={styles.registerRow}>
              <Text style={styles.registerText}>{"First time here? "}</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.registerLink}>Register with your student ID</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea        : { flex: 1, backgroundColor: OC_GREEN },
  scrollContent   : { flexGrow: 1 },
  header          : { backgroundColor: OC_GREEN, alignItems: "center", paddingTop: 40, paddingBottom: 50, paddingHorizontal: 24 },
  sealContainer   : { alignItems: "center", justifyContent: "center", marginBottom: 20 },
  sealImage       : { width: 120, height: 120 },
  titleMain       : { fontSize: 32, fontWeight: "800", color: "#fff", letterSpacing: 0.5, marginBottom: 4 },
  titleSub        : { fontSize: 28, fontWeight: "700", color: OC_GOLD, textAlign: "center", lineHeight: 36 },
  card            : { flex: 1, backgroundColor: "#f7f7f7", borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 28, paddingTop: 36, paddingBottom: 40, minHeight: 420 },
  label           : { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 8 },
  emailInputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, borderWidth: 1.5, borderColor: "#e0e0e0", overflow: "hidden" },
  emailInput      : { flex: 1, paddingVertical: 14, paddingHorizontal: 16, fontSize: 15, color: "#222" },
  inputSubHint    : { fontSize: 12, color: "#777", marginTop: 6, lineHeight: 16 },
  passwordWrapper : { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, borderWidth: 1.5, borderColor: "#e0e0e0" },
  passwordInput   : { flex: 1, paddingVertical: 14, paddingHorizontal: 16, fontSize: 15, color: "#222" },
  eyeBtn          : { paddingHorizontal: 14 },
  eyeIcon         : { fontSize: 18 },
  forgotBtn       : { alignSelf: "flex-start", marginTop: 10, marginBottom: 4 },
  forgotText      : { fontSize: 13, fontWeight: "700", color: OC_GREEN },
  signInBtn       : { backgroundColor: OC_GREEN, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 24, elevation: 5 },
  signInBtnDisabled: { opacity: 0.7 },
  signInText      : { color: "#fff", fontSize: 16, fontWeight: "700", letterSpacing: 0.5 },
  registerRow     : { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 24, flexWrap: "wrap" },
  registerText    : { fontSize: 13, color: "#8B8B8A" },
  registerLink    : { fontSize: 13, fontWeight: "700", color: OC_GREEN },
  lockoutBanner   : { flexDirection: "row", alignItems: "center", backgroundColor: "#FFEEF1", borderRadius: 10, padding: 12, marginTop: 14, borderLeftWidth: 4, borderLeftColor: "#F10930" },
  lockoutIcon     : { fontSize: 18, marginRight: 8 },
  lockoutText     : { fontSize: 13, color: "#C00624", flex: 1, lineHeight: 18 },
  warningBanner   : { backgroundColor: "#FBEBB8", borderRadius: 10, padding: 10, marginTop: 10, borderLeftWidth: 4, borderLeftColor: "#377445" },
  warningText     : { fontSize: 12, color: "#0F5D33", fontWeight: "700" },
});
