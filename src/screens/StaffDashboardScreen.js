import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { ENDPOINTS } from "../config/api";
import { secureLogout } from "../utils/security";

const OC_GREEN = "#1a5c2e";
const OC_DARK_GREEN = "#144924";
const OC_LIGHT_BG = "#f4f7f5";

export default function StaffDashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [staffInfo, setStaffInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("scan"); // "scan", "queue", "inventory"
  const [orders, setOrders] = useState([]);
  const [searchCode, setSearchCode] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});
  const [cashReceived, setCashReceived] = useState("");
  const [inventory, setInventory] = useState([]);
  const [queueFilter, setQueueFilter] = useState("All");

  useEffect(() => {
    loadStaffInfo();
    loadOrders();
    loadInventory();
  }, []);

  const loadStaffInfo = async () => {
    try {
      const str = await AsyncStorage.getItem("student_info");
      if (str) setStaffInfo(JSON.parse(str));
    } catch (e) {
      console.log(e);
    }
  };

  const loadOrders = async () => {
    try {
      const baseUrl = ENDPOINTS.login.replace("/login.php", "");
      const res = await fetch(`${baseUrl}/get_staff_orders.php`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setOrders(data.data);
        if (selectedOrder) {
          const updated = data.data.find((o) => o.id === selectedOrder.id);
          if (updated) setSelectedOrder(updated);
        }
      }
    } catch (err) {
      console.log("Error loading orders:", err);
    }
  };

  const loadInventory = async () => {
    try {
      const baseUrl = ENDPOINTS.login.replace("/login.php", "");
      const res = await fetch(`${baseUrl}/get_inventory.php`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setInventory(data.data);
      }
    } catch (err) {
      console.log("Error loading inventory:", err);
    }
  };

  const handleLookup = () => {
    if (!searchCode.trim()) {
      Alert.alert("Required", "Please enter an Order Code or Student ID.");
      return;
    }
    const clean = searchCode.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    const found = orders.find(
      (o) =>
        (o.order_code && o.order_code.toLowerCase().includes(clean)) ||
        (o.student_id && o.student_id.toLowerCase().includes(clean)) ||
        `${o.first_name} ${o.last_name}`.toLowerCase().includes(clean)
    );

    if (found) {
      selectOrder(found);
    } else {
      Alert.alert("Not Found", `No order found matching "${searchCode.trim()}".`);
    }
  };

  const selectOrder = (order) => {
    setSelectedOrder(order);
    setCheckedItems({});
    setCashReceived("");
    setActiveTab("scan");
  };

  const toggleCheckItem = (idx) => {
    setCheckedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const baseUrl = ENDPOINTS.login.replace("/login.php", "");
      const res = await fetch(`${baseUrl}/update_order_status.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert("Success! 🎉", `Order ${newStatus === "Completed" ? "successfully claimed and released!" : "marked as ready!"}`);
        loadOrders();
      } else {
        Alert.alert("Error", data.message || "Failed to update order status.");
      }
    } catch (err) {
      Alert.alert("Connection Error", "Cannot reach server.");
    }
  };

  const adjustStock = async (productId, action, amount) => {
    try {
      const baseUrl = ENDPOINTS.login.replace("/login.php", "");
      await fetch(`${baseUrl}/update_stock.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, action, amount }),
      });
      loadInventory();
    } catch (err) {
      console.log(err);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Log Out", "Log out from Store Staff Counter?", [
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

  // Calculations
  const totalAmount = parseFloat(selectedOrder?.total_amount || 0);
  const cashNum = parseFloat(cashReceived || 0);
  const changeDue = Math.max(0, cashNum - totalAmount);

  const pendingCount = orders.filter((o) => o.status === "Pending").length;
  const readyCount = orders.filter((o) => o.status === "Ready").length;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor={OC_DARK_GREEN} />

      {/* ── STAFF HEADER ── */}
      <View style={styles.header}>
        <View>
          <View style={styles.badgeRow}>
            <View style={styles.liveDot} />
            <Text style={styles.headerSubtitle}>
              {staffInfo?.course_strand || "Counter Station 01"} • Online
            </Text>
          </View>
          <Text style={styles.headerTitle}>Staff Releasing Counter</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text style={styles.logoutText}>Exit</Text>
        </TouchableOpacity>
      </View>

      {/* ── TOP TABS ── */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "scan" && styles.tabBtnActive]}
          onPress={() => setActiveTab("scan")}
        >
          <Ionicons
            name="scan-outline"
            size={18}
            color={activeTab === "scan" ? OC_GREEN : "#666"}
          />
          <Text style={[styles.tabText, activeTab === "scan" && styles.tabTextActive]}>
            Order Lookup
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "queue" && styles.tabBtnActive]}
          onPress={() => {
            setActiveTab("queue");
            loadOrders();
          }}
        >
          <Ionicons
            name="list-outline"
            size={18}
            color={activeTab === "queue" ? OC_GREEN : "#666"}
          />
          <Text style={[styles.tabText, activeTab === "queue" && styles.tabTextActive]}>
            Queue ({pendingCount + readyCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "inventory" && styles.tabBtnActive]}
          onPress={() => {
            setActiveTab("inventory");
            loadInventory();
          }}
        >
          <Ionicons
            name="cube-outline"
            size={18}
            color={activeTab === "inventory" ? OC_GREEN : "#666"}
          />
          <Text style={[styles.tabText, activeTab === "inventory" && styles.tabTextActive]}>
            Stocks
          </Text>
        </TouchableOpacity>
      </View>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB 1: LOOKUP & RELEASING */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === "scan" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: Math.max(insets.bottom, 24) + 60 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Search Box */}
          <View style={styles.searchCard}>
            <Text style={styles.cardHeading}>Enter Order Code or Student ID</Text>
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="e.g. OL-1042 or 232C-0018"
                placeholderTextColor="#999"
                value={searchCode}
                onChangeText={setSearchCode}
                autoCapitalize="characters"
                onSubmitEditing={handleLookup}
              />
              <TouchableOpacity style={styles.findBtn} onPress={handleLookup}>
                <Ionicons name="search" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Quick Preset Buttons */}
            <Text style={styles.quickPresetTitle}>QUICK DEMO PRESETS:</Text>
            <View style={styles.presetRow}>
              {orders.slice(0, 4).map((o) => (
                <TouchableOpacity
                  key={o.id}
                  style={styles.presetChip}
                  onPress={() => selectOrder(o)}
                >
                  <Text style={styles.presetText}>⚡ {o.order_code}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Active Order Detail Card */}
          {selectedOrder ? (
            <View style={styles.orderCard}>
              <View style={styles.orderHeroRow}>
                <View>
                  <Text style={styles.orderCode}>{selectedOrder.order_code}</Text>
                  <Text style={styles.orderDate}>
                    {new Date(selectedOrder.created_at || Date.now()).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    selectedOrder.status === "Completed"
                      ? styles.badgeCompleted
                      : selectedOrder.status === "Ready"
                      ? styles.badgeReady
                      : styles.badgePending,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      selectedOrder.status === "Completed"
                        ? styles.textCompleted
                        : selectedOrder.status === "Ready"
                        ? styles.textReady
                        : styles.textPending,
                    ]}
                  >
                    {selectedOrder.status}
                  </Text>
                </View>
              </View>

              {/* Student Identity */}
              <View style={styles.studentBox}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(selectedOrder.first_name?.[0] || "S") + (selectedOrder.last_name?.[0] || "")}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>
                    {selectedOrder.first_name} {selectedOrder.last_name}
                  </Text>
                  <Text style={styles.studentSub}>
                    {selectedOrder.department || "College"} • {selectedOrder.course_strand || "Enrolled"}
                  </Text>
                  <Text style={styles.studentIdBadge}>ID: {selectedOrder.student_id}</Text>
                </View>
              </View>

              {/* Pickup Schedule */}
              <View style={styles.scheduleRow}>
                <View style={styles.scheduleCol}>
                  <Text style={styles.schedLabel}>Pickup Day</Text>
                  <Text style={styles.schedVal}>{selectedOrder.pickup_day || "Regular Store"}</Text>
                </View>
                <View style={styles.scheduleCol}>
                  <Text style={styles.schedLabel}>Time Window</Text>
                  <Text style={styles.schedVal}>{selectedOrder.time_slot || "09:00 AM - 05:00 PM"}</Text>
                </View>
              </View>

              {/* Items Checklist */}
              <Text style={styles.itemsHeader}>Uniform Items Checklist:</Text>
              {(selectedOrder.items || []).map((item, idx) => {
                const isChecked = !!checkedItems[idx] || selectedOrder.status === "Completed";
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.itemCard, isChecked && styles.itemCardChecked]}
                    onPress={() => toggleCheckItem(idx)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={isChecked ? "checkbox" : "square-outline"}
                      size={22}
                      color={isChecked ? OC_GREEN : "#999"}
                    />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.itemName}>{item.product_name}</Text>
                      <Text style={styles.itemMeta}>
                        Size: <Text style={{ fontWeight: "700" }}>{item.size}</Text> • Qty:{" "}
                        <Text style={{ fontWeight: "700" }}>{item.quantity}</Text>
                      </Text>
                    </View>
                    <Text style={styles.itemPrice}>
                      ₱{(parseFloat(item.unit_price) * parseInt(item.quantity)).toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* Cashier Calculator */}
              <View style={styles.calcBox}>
                <View style={styles.calcTotalRow}>
                  <Text style={styles.calcLabel}>Total Bill Due:</Text>
                  <Text style={styles.calcTotalVal}>₱{totalAmount.toFixed(2)}</Text>
                </View>

                <View style={styles.cashInputRow}>
                  <Text style={styles.calcLabel}>Cash Received (₱):</Text>
                  <TextInput
                    style={styles.cashInput}
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={cashReceived}
                    onChangeText={setCashReceived}
                  />
                </View>

                {cashNum > 0 && (
                  <View style={styles.changeRow}>
                    <Text style={styles.changeLabel}>Change to Return:</Text>
                    <Text style={styles.changeVal}>₱{changeDue.toFixed(2)}</Text>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsBox}>
                {selectedOrder.status !== "Completed" && (
                  <TouchableOpacity
                    style={styles.btnClaimed}
                    onPress={() => updateStatus(selectedOrder.id, "Completed")}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.btnClaimedText}>Mark as Claimed & Released</Text>
                  </TouchableOpacity>
                )}

                {selectedOrder.status === "Pending" && (
                  <TouchableOpacity
                    style={styles.btnReady}
                    onPress={() => updateStatus(selectedOrder.id, "Ready")}
                  >
                    <Ionicons name="cube" size={18} color="#fff" />
                    <Text style={styles.btnReadyText}>Mark as Ready for Pickup</Text>
                  </TouchableOpacity>
                )}

                {selectedOrder.status === "Completed" && (
                  <View style={styles.completedNotice}>
                    <Ionicons name="checkmark-done" size={24} color={OC_GREEN} />
                    <Text style={styles.completedNoticeText}>
                      This order was officially released and claimed.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.emptyStateBox}>
              <Ionicons name="ticket-outline" size={54} color="#ccc" />
              <Text style={styles.emptyStateTitle}>No Order Selected</Text>
              <Text style={styles.emptyStateDesc}>
                Enter an order code above or tap a Quick Demo Preset to verify student uniforms.
              </Text>
            </View>
          )}

          {/* Switch to Student Shop button */}
          <TouchableOpacity
            style={styles.switchModeBtn}
            onPress={() => navigation.navigate("Home")}
          >
            <Ionicons name="cart-outline" size={18} color={OC_GREEN} />
            <Text style={styles.switchModeText}>View Student Store Catalog</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB 2: LIVE ORDERS QUEUE */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === "queue" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: Math.max(insets.bottom, 24) + 60 }]}
        >
          {/* Filters */}
          <View style={styles.filterRow}>
            {["All", "Pending", "Ready", "Completed"].map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, queueFilter === f && styles.filterChipActive]}
                onPress={() => setQueueFilter(f)}
              >
                <Text style={[styles.filterChipText, queueFilter === f && styles.filterChipTextActive]}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Orders List */}
          {orders
            .filter((o) => (queueFilter === "All" ? true : o.status === queueFilter))
            .map((o) => (
              <TouchableOpacity
                key={o.id}
                style={styles.queueCard}
                onPress={() => selectOrder(o)}
                activeOpacity={0.85}
              >
                {/* 1. Header: Order Code & Status Badge */}
                <View style={styles.queueHeader}>
                  <Text style={styles.queueOrderCode}>{o.order_code}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      o.status === "Completed"
                        ? styles.badgeCompleted
                        : o.status === "Ready"
                        ? styles.badgeReady
                        : styles.badgePending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        o.status === "Completed"
                          ? styles.textCompleted
                          : o.status === "Ready"
                          ? styles.textReady
                          : styles.textPending,
                      ]}
                    >
                      {o.status}
                    </Text>
                  </View>
                </View>

                {/* 2. Student Info */}
                <Text style={styles.queueStudent}>
                  {o.first_name} {o.last_name}
                </Text>

                <View style={styles.queueMetaRow}>
                  <Text style={styles.queueIdBadge}>ID: {o.student_id}</Text>
                  <Text style={styles.queueDeptText}>
                    {o.department || "College"} • {o.items?.length || 0} item(s)
                  </Text>
                  <Text style={styles.queueAmount}>
                    ₱{parseFloat(o.total_amount).toFixed(2)}
                  </Text>
                </View>

                {/* 3. Schedule Box */}
                <View style={styles.queueScheduleBox}>
                  <Ionicons name="calendar-outline" size={14} color="#92400e" style={{ marginRight: 6 }} />
                  <Text style={styles.queueSlotText} numberOfLines={1}>
                    {o.pickup_day} ({o.time_slot})
                  </Text>
                </View>

                {/* 4. Action Button */}
                <View style={styles.queueActionRow}>
                  <Text style={styles.queueActionText}>
                    {o.status === "Completed" ? "View Released Receipt" : "Inspect & Release Order"}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={OC_GREEN} />
                </View>
              </TouchableOpacity>
            ))}
        </ScrollView>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB 3: STOCKS & INVENTORY */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === "inventory" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: Math.max(insets.bottom, 24) + 60 }]}
        >
          <Text style={styles.invTitle}>Uniform Stock Inventory</Text>
          {inventory.map((item) => (
            <View key={item.id} style={styles.invCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.invDeptBadge}>{item.department || "Olivarez"}</Text>
                <Text style={styles.invName}>{item.name}</Text>
                <Text style={styles.invPrice}>₱{parseFloat(item.price).toFixed(2)}</Text>
              </View>

              <View style={styles.stockCol}>
                <Text style={styles.stockCount}>
                  {item.stock} <Text style={{ fontSize: 12, fontWeight: "normal" }}>pcs</Text>
                </Text>
                <View style={styles.stockBtnRow}>
                  <TouchableOpacity
                    style={styles.stockBtn}
                    onPress={() => adjustStock(item.id, "add", 5)}
                  >
                    <Text style={styles.stockBtnText}>+5</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.stockBtn}
                    onPress={() => adjustStock(item.id, "subtract", 1)}
                  >
                    <Text style={styles.stockBtnText}>-1</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: OC_LIGHT_BG },
  header: {
    backgroundColor: OC_DARK_GREEN,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badgeRow: { flexDirection: "row", alignItems: "center", marginBottom: 3 },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22c55e",
    marginRight: 6,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#a7f3d0",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  logoutText: { color: "#ffffff", fontSize: 13, fontWeight: "700" },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    gap: 6,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabBtnActive: {
    borderBottomColor: OC_GREEN,
  },
  tabText: { fontSize: 13, fontWeight: "600", color: "#666" },
  tabTextActive: { color: OC_GREEN, fontWeight: "800" },
  contentContainer: { padding: 16 },
  searchCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 16,
  },
  cardHeading: { fontSize: 13, fontWeight: "700", color: "#374151", marginBottom: 8 },
  searchRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  searchInput: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderWidth: 1.5,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: "#111",
  },
  findBtn: {
    backgroundColor: OC_GREEN,
    borderRadius: 10,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  quickPresetTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6b7280",
    marginBottom: 6,
  },
  presetRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  presetChip: {
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  presetText: { fontSize: 12, fontWeight: "700", color: OC_GREEN },
  orderCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 16,
  },
  orderHeroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    marginBottom: 14,
  },
  orderCode: { fontSize: 24, fontWeight: "900", color: OC_GREEN },
  orderDate: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  badgePending: { backgroundColor: "#fef3c7" },
  badgeReady: { backgroundColor: "#e0f2fe" },
  badgeCompleted: { backgroundColor: "#dcfce7" },
  statusBadgeText: { fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  textPending: { color: "#b45309" },
  textReady: { color: "#0369a1" },
  textCompleted: { color: "#15803d" },
  studentBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: OC_GREEN,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  studentName: { fontSize: 16, fontWeight: "800", color: "#111" },
  studentSub: { fontSize: 12, color: "#4b5563", marginTop: 2 },
  studentIdBadge: {
    fontSize: 11,
    color: "#374151",
    fontWeight: "700",
    backgroundColor: "#e5e7eb",
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  scheduleRow: {
    flexDirection: "row",
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  scheduleCol: { flex: 1 },
  schedLabel: { fontSize: 10, color: "#92400e", fontWeight: "700", textTransform: "uppercase" },
  schedVal: { fontSize: 12, color: "#78350f", fontWeight: "700", marginTop: 2 },
  itemsHeader: { fontSize: 14, fontWeight: "800", color: "#111", marginBottom: 8 },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  itemCardChecked: { backgroundColor: "#ecfdf5", borderColor: "#a7f3d0" },
  itemName: { fontSize: 14, fontWeight: "700", color: "#111" },
  itemMeta: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: "800", color: OC_GREEN },
  calcBox: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    marginVertical: 14,
  },
  calcTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  calcLabel: { fontSize: 13, fontWeight: "700", color: "#475569" },
  calcTotalVal: { fontSize: 20, fontWeight: "900", color: OC_GREEN },
  cashInputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  cashInput: {
    width: 120,
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "right",
  },
  changeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  changeLabel: { fontSize: 13, fontWeight: "700", color: "#0369a1" },
  changeVal: { fontSize: 18, fontWeight: "900", color: "#0369a1" },
  actionsBox: { gap: 8, marginTop: 4 },
  btnClaimed: {
    backgroundColor: OC_GREEN,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  btnClaimedText: { color: "#ffffff", fontSize: 15, fontWeight: "800" },
  btnReady: {
    backgroundColor: "#0284c7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnReadyText: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
  completedNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ecfdf5",
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  completedNoticeText: { color: OC_GREEN, fontSize: 13, fontWeight: "700" },
  emptyStateBox: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 16,
  },
  emptyStateTitle: { fontSize: 16, fontWeight: "800", color: "#374151", marginTop: 10 },
  emptyStateDesc: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  switchModeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
  },
  switchModeText: { color: OC_GREEN, fontSize: 13, fontWeight: "700" },
  filterRow: { flexDirection: "row", gap: 6, marginBottom: 14 },
  filterChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#e5e7eb",
  },
  filterChipActive: { backgroundColor: OC_GREEN },
  filterChipText: { fontSize: 12, fontWeight: "700", color: "#4b5563" },
  filterChipTextActive: { color: "#ffffff" },
  queueCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  queueHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  queueOrderCode: {
    fontSize: 18,
    fontWeight: "900",
    color: OC_GREEN,
    letterSpacing: 0.5,
  },
  queueStudent: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  queueMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  queueIdBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#374151",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  queueDeptText: {
    fontSize: 12,
    color: "#6b7280",
    flex: 1,
  },
  queueAmount: {
    fontSize: 14,
    fontWeight: "800",
    color: OC_GREEN,
  },
  queueScheduleBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    marginBottom: 10,
  },
  queueSlotText: {
    fontSize: 11,
    color: "#92400e",
    fontWeight: "700",
    flex: 1,
  },
  queueActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  queueActionText: {
    fontSize: 12,
    fontWeight: "800",
    color: OC_GREEN,
  },
  invTitle: { fontSize: 16, fontWeight: "800", color: "#111", marginBottom: 12 },
  invCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 8,
    alignItems: "center",
  },
  invDeptBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: OC_GREEN,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  invName: { fontSize: 14, fontWeight: "700", color: "#111" },
  invPrice: { fontSize: 13, color: "#b45309", fontWeight: "700", marginTop: 2 },
  stockCol: { alignItems: "flex-end" },
  stockCount: { fontSize: 18, fontWeight: "800", color: "#111" },
  stockBtnRow: { flexDirection: "row", gap: 4, marginTop: 4 },
  stockBtn: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  stockBtnText: { fontSize: 11, fontWeight: "700", color: "#374151" },
});
