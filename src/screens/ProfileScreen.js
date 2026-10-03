import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, Feather } from "@expo/vector-icons";
import { secureLogout } from "../utils/security";

const OC_GREEN = "#0F5D33";

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [student, setStudent] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const str = await AsyncStorage.getItem("student_info");
        if (str) setStudent(JSON.parse(str));
      } catch (_) {
        // silently ignore
      }
    })();
  }, []);

  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure you want to log out of your account?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await secureLogout();
          navigation.replace("Login");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate("Home")}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 40 },
        ]}
      >
        {/* Profile Card */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>
              {student?.first_name?.charAt(0) || "J"}
            </Text>
          </View>
          <Text style={styles.profileName}>
            {student ? `${student.first_name} ${student.last_name}` : "Juan Dela Cruz"}
          </Text>
          <Text style={styles.profileEmail}>{student?.email || "student@olivarezcollege.edu.ph"}</Text>
          <View style={styles.idBadge}>
            <Text style={styles.idBadgeText}>ID: {student?.student_id || "2024-00123"}</Text>
          </View>
        </View>

        {/* Staff / Admin Access Card */}
        {(student?.role === "Store Staff" || student?.role === "Super Admin") ? (
          <TouchableOpacity
            style={styles.staffAccessBtn}
            onPress={() => navigation.navigate("StaffDashboard")}
            activeOpacity={0.85}
          >
            <View style={styles.staffAccessIconBox}>
              <Ionicons name="scan" size={24} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.staffAccessTitle}>Store Releasing Counter</Text>
              <Text style={styles.staffAccessSub}>Open QR Lookup, Orders Queue & Stocks</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={OC_GREEN} />
          </TouchableOpacity>
        ) : (
          /* Saved Sizes Section */
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Registered Uniform Sizes</Text>
            <View style={styles.sizesRow}>
              <View style={styles.sizeBox}>
                <Text style={styles.sizeLabel}>Blouse</Text>
                <Text style={styles.sizeVal}>{student?.size_blouse || "M"}</Text>
              </View>
              <View style={styles.sizeBox}>
                <Text style={styles.sizeLabel}>Skirt</Text>
                <Text style={styles.sizeVal}>{student?.size_skirt || "M"}</Text>
              </View>
              <View style={styles.sizeBox}>
                <Text style={styles.sizeLabel}>PE Shirt</Text>
                <Text style={styles.sizeVal}>{student?.size_pe_shirt || "L"}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate("Orders")}
          >
            <Ionicons name="receipt-outline" size={20} color="#333" style={{ marginRight: 12 }} />
            <Text style={styles.actionLabel}>My Orders</Text>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => Alert.alert("Store Help", "For size exchanges or store concerns, visit Window 2 at the Bookstore, ground floor.")}
          >
            <Ionicons name="help-circle-outline" size={20} color="#333" style={{ marginRight: 12 }} />
            <Text style={styles.actionLabel}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </TouchableOpacity>
        </View>


        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Feather name="log-out" size={18} color="#dc3545" style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1c2833",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  profileHeaderCard: {
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e9ecef",
    marginBottom: 20,
  },
  avatarBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: OC_GREEN,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "800",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1c2833",
  },
  profileEmail: {
    fontSize: 13,
    color: "#6c757d",
    marginTop: 2,
  },
  idBadge: {
    backgroundColor: "#e8f5e9",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  idBadgeText: {
    color: OC_GREEN,
    fontSize: 12,
    fontWeight: "700",
  },
  infoSection: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1c2833",
    marginBottom: 12,
  },
  sizesRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  sizeBox: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
  },
  sizeLabel: {
    fontSize: 12,
    color: "#6c757d",
  },
  sizeVal: {
    fontSize: 18,
    fontWeight: "800",
    color: OC_GREEN,
    marginTop: 4,
  },
  actionSection: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
    marginBottom: 24,
    overflow: "hidden",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f5",
  },
  actionLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#1c2833",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#FFEEF1",
    backgroundColor: "#FFEEF1",
  },
  logoutBtnText: {
    color: "#F10930",
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 8,
  },
  staffAccessBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#a7f3d0",
    marginBottom: 20,
    elevation: 2,
  },
  staffAccessIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: OC_GREEN,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  staffAccessTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111",
  },
  staffAccessSub: {
    fontSize: 12,
    color: "#059669",
    marginTop: 2,
    fontWeight: "600",
  },
});
