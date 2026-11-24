import React, { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { touchSession } from "../utils/security";

const OC_GREEN = "#0F5D33";
const OC_GOLD = "#FBEBB8";

export function ProtectedRoute({ children, allowedRoles = null }) {
  const navigation = useNavigation();
  const { loading, isAuthenticated, role, isStaffOrAdmin, syncFromStorage } = useAuth();

  useEffect(() => {
    let active = true;
    (async () => {
      if (loading) return;
      if (!isAuthenticated) {
        // Double-check storage in case login just wrote directly to AsyncStorage
        const synced = await syncFromStorage();
        if (active && (!synced.token || !synced.user)) {
          navigation.reset({
            index: 0,
            routes: [{ name: "Login" }],
          });
        }
        return;
      }
      await touchSession();
    })();
    return () => {
      active = false;
    };
  }, [loading, isAuthenticated, navigation, syncFromStorage]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={OC_GREEN} />
        <Text style={styles.loadingText}>Verifying Supabase session...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={OC_GREEN} />
        <Text style={styles.loadingText}>Redirecting to Sign In...</Text>
      </View>
    );
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    const fallbackRoute = isStaffOrAdmin ? "StaffDashboard" : "Home";
    return (
      <View style={styles.restrictedContainer}>
        <View style={styles.restrictedCard}>
          <Text style={styles.restrictedBadge}>PROTECTED ROUTE</Text>
          <Text style={styles.restrictedTitle}>Access Restricted</Text>
          <Text style={styles.restrictedDesc}>
            Your current role ({role}) does not have permission to view this screen.
          </Text>
          <TouchableOpacity
            style={styles.restrictedBtn}
            onPress={() => navigation.replace(fallbackRoute)}
          >
            <Text style={styles.restrictedBtnText}>Return to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return children;
}

/**
 * Higher-order component that wraps a React Navigation screen with ProtectedRoute.
 */
export function withProtectedRoute(ScreenComponent, options = {}) {
  const { allowedRoles = null } = options;
  return function ProtectedScreenWrapper(props) {
    return (
      <ProtectedRoute allowedRoles={allowedRoles}>
        <ScreenComponent {...props} />
      </ProtectedRoute>
    );
  };
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
    color: OC_GREEN,
  },
  restrictedContainer: {
    flex: 1,
    backgroundColor: OC_GREEN,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  restrictedCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    elevation: 4,
  },
  restrictedBadge: {
    backgroundColor: OC_GOLD,
    color: OC_GREEN,
    fontSize: 11,
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  restrictedTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1c2833",
    marginBottom: 8,
  },
  restrictedDesc: {
    fontSize: 14,
    color: "#6c757d",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  restrictedBtn: {
    backgroundColor: OC_GREEN,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  restrictedBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
