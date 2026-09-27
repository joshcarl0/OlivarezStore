import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCart } from "../context/CartContext";
import { apiPost, ENDPOINTS } from "../config/api";

const OC_GREEN = "#1a5c2e";
const OC_GOLD = "#f5a623";

const PICKUP_DAYS = [
  { id: "1", day: "Tue", date: "22", month: "Sep", full: "Tue, Sep 22" },
  { id: "2", day: "Wed", date: "23", month: "Sep", full: "Wed, Sep 23" },
  { id: "3", day: "Thu", date: "24", month: "Sep", full: "Thu, Sep 24" },
  { id: "4", day: "Fri", date: "25", month: "Sep", full: "Fri, Sep 25" },
];

const TIME_SLOTS = [
  { id: "t1", time: "8:00 AM", slots: "6 slots", disabled: false },
  { id: "t2", time: "9:00 AM", slots: "4 slots", disabled: false },
  { id: "t3", time: "10:00 AM", slots: "Full", disabled: true },
  { id: "t4", time: "11:00 AM", slots: "6 slots", disabled: false },
  { id: "t5", time: "1:00 PM", slots: "4 slots", disabled: false },
  { id: "t6", time: "2:00 PM", slots: "4 slots", disabled: false },
];

export default function CheckoutScreen({ navigation }) {
  const { cart, totalPrice, addOrder, clearCart } = useCart();

  const [selectedDay, setSelectedDay] = useState(PICKUP_DAYS[0]);
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[1]); // 9:00 AM
  const [paymentMethod, setPaymentMethod] = useState("Hello Money"); // "Hello Money" | "Pay at the counter"

  const handlePlaceOrder = async () => {
    if (!selectedSlot) {
      Alert.alert("Time Slot", "Please select a preferred pickup time slot.");
      return;
    }

    // Generate random Order code like OL-1042
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderId = `OL-${randomNum}`;

    // Item summary string
    const itemsSummary = cart
      .map((i) => `${i.quantity}x ${i.name.split(",")[0]}`)
      .join(", ");

    const newOrder = {
      orderId,
      date: `${selectedDay.full} • ${selectedSlot.time}`,
      itemsSummary: `${cart.length} items • Window 2, ${selectedSlot.time}`,
      details: itemsSummary,
      total: totalPrice,
      paymentMethod,
      status: "Placed",
      step: 1, // Placed (1), Packing (2), Ready (3), Claimed (4)
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

      await apiPost(ENDPOINTS.placeOrder, {
        student_id: studentId,
        order_code: orderId,
        total_amount: totalPrice,
        pickup_day: selectedDay.full,
        time_slot: selectedSlot.time,
        payment_method: paymentMethod,
        items: apiItems,
      });
    } catch (e) {
      console.log("Error sending order to DB:", e);
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

        {/* ── TIME SLOT ── */}
        <Text style={[styles.sectionHeading, { marginTop: 22 }]}>Time slot</Text>
        <View style={styles.slotsGrid}>
          {TIME_SLOTS.map((slot) => {
            const isSelected = selectedSlot.id === slot.id;
            const isDisabled = slot.disabled;
            return (
              <TouchableOpacity
                key={slot.id}
                disabled={isDisabled}
                style={[
                  styles.slotCard,
                  isSelected && styles.slotCardActive,
                  isDisabled && styles.slotCardDisabled,
                ]}
                onPress={() => setSelectedSlot(slot)}
              >
                <Text
                  style={[
                    styles.slotTime,
                    isSelected && styles.slotTimeActive,
                    isDisabled && styles.slotTimeDisabled,
                  ]}
                >
                  {slot.time}
                </Text>
                <Text
                  style={[
                    styles.slotCapacity,
                    isSelected && styles.slotCapacityActive,
                    isDisabled && styles.slotCapacityDisabled,
                  ]}
                >
                  {slot.slots}
                </Text>
              </TouchableOpacity>
            );
          })}
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
      <View style={styles.bottomBar}>
        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.placeOrderBtn}
          onPress={handlePlaceOrder}
        >
          <Text style={styles.placeOrderBtnText}>
            Place order - ₱ {totalPrice.toFixed(2)}
          </Text>
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
  // Slots grid
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  slotCard: {
    width: "31%",
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  slotCardActive: {
    backgroundColor: OC_GREEN,
    borderColor: OC_GREEN,
  },
  slotCardDisabled: {
    backgroundColor: "#f8f9fa",
    borderColor: "#e9ecef",
    opacity: 0.6,
  },
  slotTime: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1c2833",
  },
  slotTimeActive: {
    color: "#ffffff",
  },
  slotTimeDisabled: {
    color: "#adb5bd",
  },
  slotCapacity: {
    fontSize: 11,
    color: "#6c757d",
    marginTop: 2,
  },
  slotCapacityActive: {
    color: "#e8f5e9",
  },
  slotCapacityDisabled: {
    color: "#adb5bd",
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
    backgroundColor: OC_GOLD,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: OC_GOLD,
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
});
