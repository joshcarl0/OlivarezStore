import React from "react";
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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useCart } from "../context/CartContext";

const OC_GREEN = "#1a5c2e";
const OC_GOLD = "#f5a623";

export default function CartScreen({ navigation }) {
  const { cart, updateQuantity, removeFromCart, totalCount, totalPrice } = useCart();

  const handleCheckout = () => {
    if (cart.length === 0) {
      Alert.alert("Empty Cart", "Your cart is currently empty. Add some uniform items first!");
      return;
    }
    navigation.navigate("Checkout");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Cart • {totalCount} {totalCount === 1 ? "item" : "items"}
        </Text>
        <Image
          source={require("../../assets/OC-LOGO.png")}
          style={styles.headerLogo}
          resizeMode="contain"
        />
      </View>

      {cart.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={70} color="#ccc" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySub}>Looks like you haven't added any school supplies yet.</Text>
          <TouchableOpacity
            style={styles.shopNowBtn}
            onPress={() => navigation.navigate("Shop")}
          >
            <Text style={styles.shopNowBtnText}>Browse Shop</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── ITEMS LIST ── */}
          <View style={styles.itemsList}>
            {cart.map((item) => {
              const itemTotal = item.price * item.quantity;
              return (
                <View key={item.cartKey} style={styles.cartCard}>
                  {/* Thumbnail */}
                  <View style={styles.thumbnailBox}>
                    {item.category?.toLowerCase().includes("skirt") ? (
                      <MaterialCommunityIcons name="hanger" size={32} color={OC_GREEN} />
                    ) : item.name?.toLowerCase().includes("lace") ? (
                      <Ionicons name="ribbon-outline" size={30} color={OC_GREEN} />
                    ) : item.name?.toLowerCase().includes("tie") ? (
                      <MaterialCommunityIcons name="tie" size={30} color={OC_GREEN} />
                    ) : (
                      <MaterialCommunityIcons name="tshirt-v" size={32} color={OC_GREEN} />
                    )}
                  </View>

                  {/* Middle Info */}
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemMeta}>
                      Size {item.size} • ₱{item.price.toFixed(2)}
                    </Text>

                    {/* Stepper */}
                    <View style={styles.stepperWrap}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => updateQuantity(item.cartKey, item.quantity - 1)}
                      >
                        <Text style={styles.stepText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepValue}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => updateQuantity(item.cartKey, item.quantity + 1)}
                      >
                        <Text style={styles.stepText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Right Price & Remove */}
                  <View style={styles.rightPriceCol}>
                    <Text style={styles.itemTotalText}>₱{itemTotal.toFixed(2)}</Text>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => removeFromCart(item.cartKey)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#aaa" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          {/* ── PRICE BREAKDOWN ── */}
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Subtotal</Text>
              <Text style={styles.breakdownValue}>₱ {totalPrice.toFixed(2)}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Pickup at the bookstore</Text>
              <Text style={[styles.breakdownValue, { color: OC_GREEN }]}>Free</Text>
            </View>
            <View style={[styles.breakdownRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₱ {totalPrice.toFixed(2)}</Text>
            </View>
          </View>

          {/* ── NOTICE BANNER ── */}
          <View style={styles.noticeBanner}>
            <Ionicons name="information-circle" size={22} color="#b78103" style={{ marginRight: 10 }} />
            <Text style={styles.noticeText}>
              Items are set aside once you place the order, so sizes won't run out.
            </Text>
          </View>
        </ScrollView>
      )}

      {/* ── BOTTOM BUTTON ── */}
      {cart.length > 0 && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.checkoutBtn}
            onPress={handleCheckout}
          >
            <Text style={styles.checkoutBtnText}>Choose pickup time</Text>
          </TouchableOpacity>
        </View>
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
  itemsList: {
    gap: 12,
    marginBottom: 20,
  },
  cartCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#edf0f2",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  thumbnailBox: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#e8f5e9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1c2833",
  },
  itemMeta: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 2,
  },
  stepperWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f4f6f8",
    alignSelf: "flex-start",
    borderRadius: 8,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    gap: 8,
  },
  stepBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  stepText: {
    fontSize: 16,
    fontWeight: "700",
    color: OC_GREEN,
  },
  stepValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1c2833",
    minWidth: 16,
    textAlign: "center",
  },
  rightPriceCol: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 55,
  },
  itemTotalText: {
    fontSize: 15,
    fontWeight: "700",
    color: OC_GREEN,
  },
  deleteBtn: {
    padding: 4,
  },
  // Breakdown
  breakdownCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#edf0f2",
    marginBottom: 16,
    gap: 10,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakdownLabel: {
    fontSize: 14,
    color: "#6c757d",
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1c2833",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#edf0f2",
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1c2833",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: OC_GREEN,
  },
  // Notice
  noticeBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef8e7",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#fce9b5",
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: "#8a6100",
    lineHeight: 17,
    fontWeight: "500",
  },
  // Bottom Bar
  bottomBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f3f5",
    backgroundColor: "#ffffff",
  },
  checkoutBtn: {
    backgroundColor: OC_GREEN,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: OC_GREEN,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
  },
  checkoutBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1c2833",
    marginTop: 16,
  },
  emptySub: {
    fontSize: 14,
    color: "#6c757d",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  shopNowBtn: {
    backgroundColor: OC_GREEN,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  shopNowBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
  },
});
