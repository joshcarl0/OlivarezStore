import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useCart } from "../context/CartContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ENDPOINTS, apiGetAuth } from "../config/api";

const OC_GREEN = "#0F5D33";

/** Map DB status strings to display-friendly labels. */
function normalizeStatus(status = "") {
  const map = {
    placed: "Placed",
    packing: "Packing",
    ready: "Ready",
    claimed: "Claimed",
  };
  return map[status.toLowerCase()] ?? status;
}

export default function OrdersScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { orders: localOrders } = useCart();
  const [dbOrders, setDbOrders] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const studentStr = await AsyncStorage.getItem("student_info");
      const studentObj = studentStr ? JSON.parse(studentStr) : null;
      const studentId  = studentObj?.student_id;
      if (!studentId) return;

      const res = await apiGetAuth(`${ENDPOINTS.getOrders}?student_id=${encodeURIComponent(studentId)}`);
      if (res?.success && Array.isArray(res.data)) {
        const mapped = res.data.map((o) => ({
          orderId:       o.order_code,
          date:          `${o.pickup_day ?? ""} • ${o.time_slot ?? ""}`.trim().replace(/^• |• $/, ""),
          itemsSummary:  o.details || "Uniform items",
          details:       o.details || "Uniform items",
          total:         parseFloat(o.total_amount) || 0,
          paymentMethod: o.payment_method || "",
          status:        normalizeStatus(o.status),
          step:          { placed: 1, packing: 2, ready: 3, claimed: 4 }[
                           (o.status || "").toLowerCase()
                         ] ?? 1,
        }));
        setDbOrders(mapped);
      }
    } catch (_) {
      // Silently fall back to local orders
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Merge: prefer DB orders, keep local-only ones that aren't in DB
  const dbIds = new Set(dbOrders.map((o) => o.orderId));
  const localOnly = localOrders.filter((o) => !dbIds.has(o.orderId));
  const orders = [...dbOrders, ...localOnly];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate("Home")}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order History</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={OC_GREEN} />
          <Text style={styles.loaderText}>Loading your orders…</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 40 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchOrders(true)}
              colors={[OC_GREEN]}
              tintColor={OC_GREEN}
            />
          }
        >
          {orders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={60} color="#ccc" />
              <Text style={styles.emptyTitle}>No Orders Yet</Text>
              <Text style={styles.emptySub}>Your claimed and active pickup tickets will appear here.</Text>
            </View>
          ) : (
            orders.map((order) => {
              const isReady   = order.status === "Ready";
              const isPlaced  = order.status === "Placed";
              const isPacking = order.status === "Packing";
              return (
                <TouchableOpacity
                  key={order.orderId}
                  activeOpacity={0.85}
                  style={styles.orderCard}
                  onPress={() => navigation.navigate("OrderSuccess", { order })}
                >
                  <View style={styles.topRow}>
                    <View style={styles.iconBox}>
                      <MaterialCommunityIcons name="tshirt-v-outline" size={24} color="#ffffff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.orderCode}>{order.orderId}</Text>
                      <Text style={styles.orderDate}>{order.date}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        isReady   && styles.statusBadgeReady,
                        isPlaced  && styles.statusBadgePlaced,
                        isPacking && styles.statusBadgePacking,
                        !isReady && !isPlaced && !isPacking && styles.statusBadgeClaimed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          isReady   && styles.statusTextReady,
                          isPlaced  && styles.statusTextPlaced,
                          isPacking && styles.statusTextPacking,
                          !isReady && !isPlaced && !isPacking && styles.statusTextClaimed,
                        ]}
                      >
                        {order.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.bottomRow}>
                    <Text style={styles.detailsText}>{order.details}</Text>
                    <Text style={styles.totalText}>₱{(order.total || 0).toFixed(2)}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
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
    padding: 16,
    gap: 12,
  },
  orderCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: OC_GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  orderCode: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1c2833",
  },
  orderDate: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusBadgeReady: {
    backgroundColor: "#eaf5ed",
  },
  statusBadgeClaimed: {
    backgroundColor: "#e9ecef",
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  statusTextReady: {
    color: OC_GREEN,
  },
  statusTextClaimed: {
    color: "#495057",
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f3f5",
    marginVertical: 12,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailsText: {
    fontSize: 13,
    color: "#495057",
    flex: 1,
  },
  totalText: {
    fontSize: 15,
    fontWeight: "800",
    color: OC_GREEN,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginTop: 14,
  },
  emptySub: {
    fontSize: 13,
    color: "#777",
    marginTop: 6,
    textAlign: "center",
    paddingHorizontal: 30,
  },
  // Status badge variants
  statusBadgePlaced: {
    backgroundColor: "#e8f0fe",
  },
  statusBadgePacking: {
    backgroundColor: "#fff3cd",
  },
  statusTextPlaced: {
    color: "#1a73e8",
  },
  statusTextPacking: {
    color: "#856404",
  },
  // Loading state
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6c757d",
  },
});
