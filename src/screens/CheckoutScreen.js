import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCart } from "../context/CartContext";
import { apiPost, ENDPOINTS } from "../config/api";

const OC_GREEN = "#0F5D33";
const OC_GOLD = "#FBEBB8";
const OC_SECONDARY_GREEN = "#377445";

const DAY_NAMES  = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/** Generates the next `count` weekdays (Mon–Fri) starting from tomorrow. */
function getNextWeekdays(count = 4) {
  const days = [];
  const cursor = new Date();
  cursor.setDate(cursor.getDate() + 1); // start from tomorrow
  while (days.length < count) {
    const dow = cursor.getDay(); // 0=Sun, 6=Sat
    if (dow !== 0 && dow !== 6) {
      days.push({
        id: String(days.length + 1),
        day: DAY_NAMES[dow],
        date: String(cursor.getDate()),
        month: MONTH_NAMES[cursor.getMonth()],
        full: `${DAY_NAMES[dow]}, ${MONTH_NAMES[cursor.getMonth()]} ${cursor.getDate()}`,
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export default function CheckoutScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { cart, totalPrice, addOrder, clearCart } = useCart();

  const PICKUP_DAYS = useMemo(() => getNextWeekdays(4), []);
  const [selectedDay, setSelectedDay] = useState(() => getNextWeekdays(4)[0]);
  const [paymentMethod, setPaymentMethod] = useState("Hello Money");
  const [placing, setPlacing] = useState(false);

  const handlePlaceOrder = async () => {

    setPlacing(true);

    // Generate random Order code like OL-1042
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderId = `OL-${randomNum}`;

    // Item summary string
    const itemsSummary = cart
      .map((i) => `${i.quantity}x ${i.name.split(",")[0]}`)
      .join(", ");

    const newOrder = {
      orderId,
      date: `${selectedDay.full}`,
      itemsSummary: `${cart.length} item${cart.length !== 1 ? "s" : ""} • Window 2 (8:00 AM - 5:00 PM)`,
      details: itemsSummary,
      total: totalPrice,
      paymentMethod,
      status: "Placed",
      step: 1,
    };

    try {
      const studentStr = await AsyncStorage.getItem("student_info");
      const studentObj = studentStr ? JSON.parse(studentStr) : null;
      const studentId = studentObj?.student_id || "2024-00123";

      const apiItems = cart.map((c) => ({
        product_id: c.id,
        size: c.size,
        quantity: c.quantity,
        unit_price: c.price,
      }));

      const res = await apiPost(ENDPOINTS.placeOrder, {
        student_id: studentId,
        order_code: orderId,
        total_amount: totalPrice,
        pickup_day: selectedDay.full,
        time_slot: "Store Hours (8:00 AM – 5:00 PM)",
        payment_method: paymentMethod,
        items: apiItems,
      });

      if (!res?.success) {
        // Non-blocking warning — order still saved locally
        Alert.alert(
          "Notice",
          "Your order was saved locally but could not sync to the server. It will appear in your order history."
        );
      }
    } catch (e) {
      // Network error — save locally and warn user
      Alert.alert(
        "Connection Error",
        "Could not reach the server. Your order has been saved locally. Please check your connection."
      );
    } finally {
      setPlacing(false);
    }

    addOrder(newOrder);
    clearCart();
    navigation.replace("OrderSuccess", { order: newOrder });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pickup and payment</Text>
        <Image
          source={require("../../assets/OC-LOGO.png")}
          style={styles.headerLogo}
          resizeMode="contain"
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── PICKUP DAY ── */}
        <Text style={styles.sectionHeading}>Pickup day</Text>
        <View style={styles.daysRow}>
          {PICKUP_DAYS.map((item) => {
            const isSelected = selectedDay.id === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.dayCard, isSelected && styles.dayCardActive]}
                onPress={() => setSelectedDay(item)}
              >
                <Text style={[styles.dayName, isSelected && styles.dayNameActive]}>
                  {item.day}
                </Text>
                <Text style={[styles.dayNum, isSelected && styles.dayNumActive]}>
                  {item.date}
                </Text>
                <Text style={[styles.dayMonth, isSelected && styles.dayMonthActive]}>
                  {item.month}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── STORE HOURS NOTICE ── */}
        <View style={styles.storeHoursBanner}>
          <Ionicons name="time-outline" size={18} color={OC_GREEN} />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.storeHoursTitle}>Store Hours: 8:00 AM – 5:00 PM</Text>
            <Text style={styles.storeHoursSub}>You can claim your items anytime during store hours at Window 2.</Text>
          </View>
        </View>

        {/* ── PAYMENT METHOD ── */}
        <Text style={[styles.sectionHeading, { marginTop: 24 }]}>Payment</Text>
        <View style={styles.paymentSection}>
          {/* Hello Money */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.paymentCard,
              paymentMethod === "Hello Money" && styles.paymentCardActive,
            ]}
            onPress={() => setPaymentMethod("Hello Money")}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.paymentTitle}>Hello Money</Text>
              <Text style={styles.paymentSub}>Pay now in your app</Text>
            </View>
            <View style={styles.radioOuter}>
              {paymentMethod === "Hello Money" && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          {/* Pay at the counter */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.paymentCard,
              paymentMethod === "Pay at the counter" && styles.paymentCardActive,
            ]}
            onPress={() => setPaymentMethod("Pay at the counter")}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.paymentTitle}>Pay at the counter</Text>
              <Text style={styles.paymentSub}>Cash when you claim</Text>
            </View>
            <View style={styles.radioOuter}>
              {paymentMethod === "Pay at the counter" && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── BOTTOM BUTTON ── */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) + 16 }]}>
        <TouchableOpacity
          activeOpacity={0.88}
          style={[styles.placeOrderBtn, placing && styles.placeOrderBtnDisabled]}
          onPress={handlePlaceOrder}
          disabled={placing}
        >
          {placing
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.placeOrderBtnText}>Place order — ₱ {totalPrice.toFixed(2)}</Text>
          }
        </TouchableOpacity>
      </View>
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
    paddingVertical: 10,
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
  headerLogo: {
    width: 34,
    height: 34,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 30,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1c2833",
    marginBottom: 12,
  },
  // Days row
  daysRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  dayCard: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e9ecef",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  dayCardActive: {
    borderColor: OC_GREEN,
    borderWidth: 2,
    backgroundColor: "#f0f7f2",
  },
  dayName: {
    fontSize: 12,
    color: "#6c757d",
    fontWeight: "600",
  },
  dayNameActive: {
    color: OC_GREEN,
    fontWeight: "700",
  },
  dayNum: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1c2833",
    marginVertical: 4,
  },
  dayNumActive: {
    color: OC_GREEN,
  },
  dayMonth: {
    fontSize: 12,
    color: "#6c757d",
  },
  dayMonthActive: {
    color: OC_GREEN,
  },
  // Store Hours Banner
  storeHoursBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f7f2",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#d1e7dd",
  },
  storeHoursTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: OC_GREEN,
  },
  storeHoursSub: {
    fontSize: 11,
    color: "#4b5563",
    marginTop: 2,
  },
  // Payment
  paymentSection: {
    gap: 12,
  },
  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e9ecef",
    backgroundColor: "#ffffff",
  },
  paymentCardActive: {
    borderColor: OC_GREEN,
    borderWidth: 1.5,
    backgroundColor: "#fcfefd",
  },
  paymentTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1c2833",
  },
  paymentSub: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#ced4da",
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: OC_GREEN,
  },
  // Bottom Bar
  bottomBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f3f5",
    backgroundColor: "#ffffff",
  },
  placeOrderBtn: {
    backgroundColor: OC_GREEN,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: OC_GREEN,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
  },
  placeOrderBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  placeOrderBtnDisabled: {
    opacity: 0.7,
  },
});
