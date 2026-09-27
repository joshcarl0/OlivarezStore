import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useCart } from "../context/CartContext";

const OC_GREEN = "#1a5c2e";

export default function OrdersScreen({ navigation }) {
  const { orders } = useCart();

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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={60} color="#ccc" />
            <Text style={styles.emptyTitle}>No Orders Yet</Text>
            <Text style={styles.emptySub}>Your claimed and active pickup tickets will appear here.</Text>
          </View>
        ) : (
          orders.map((order) => {
            const isReady = order.status === "Ready";
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
                      isReady ? styles.statusBadgeReady : styles.statusBadgeClaimed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        isReady ? styles.statusTextReady : styles.statusTextClaimed,
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
    backgroundColor: "#d4edda",
  },
  statusBadgeClaimed: {
    backgroundColor: "#e9ecef",
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  statusTextReady: {
    color: "#155724",
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
});
