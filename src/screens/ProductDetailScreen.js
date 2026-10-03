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
  Modal,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useCart } from "../context/CartContext";

const OC_GREEN = "#0F5D33";
const OC_DARK_GREEN = "#0B4626";
const OC_GOLD = "#FBEBB8";
const OC_SECONDARY_GREEN = "#377445";

export default function ProductDetailScreen({ navigation, route }) {
  const { product } = route.params || {};
  const { addToCart } = useCart();
  const insets = useSafeAreaInsets();

  const availableSizes =
    product?.sizes && product.sizes.length > 0
      ? product.sizes
      : ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

  const [selectedSize, setSelectedSize] = useState(availableSizes[0] || "M");
  const [quantity, setQuantity] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  if (!product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={{ textAlign: "center", marginTop: 40, color: "#6c757d" }}>
          Product not found.
        </Text>
      </SafeAreaView>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const handleAddToCart = () => {
    if (isOutOfStock) {
      Alert.alert("Out of Stock", "Sorry, this item is currently sold out.");
      return;
    }
    addToCart(product, selectedSize, quantity);
    Alert.alert(
      "Added to Cart! 🛒",
      `${quantity}x ${product.name} (Size: ${selectedSize}) has been added to your cart.`,
      [
        { text: "Continue Shopping", onPress: () => navigation.goBack() },
        { text: "View Cart", onPress: () => navigation.navigate("Cart") },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <Image
          source={require("../../assets/OC-LOGO.png")}
          style={styles.headerLogo}
          resizeMode="contain"
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 20) + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO IMAGE CARD ── */}
        <View style={styles.heroCard}>
          {product.image_url ? (
            <Image
              source={{ uri: product.image_url }}
              style={styles.heroRealImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.heroIllustration}>
              {product.imageType === "skirt" ? (
                <MaterialCommunityIcons name="hanger" size={130} color="#2b5937" />
              ) : product.imageType === "lace" ? (
                <Ionicons name="ribbon-outline" size={120} color="#2b5937" />
              ) : product.imageType === "tie" ? (
                <MaterialCommunityIcons name="tie" size={120} color="#2b5937" />
              ) : (
                <View style={{ alignItems: "center" }}>
                  <MaterialCommunityIcons name="tshirt-v" size={140} color="#2b5937" />
                  <View style={styles.heroTie} />
                </View>
              )}
            </View>
          )}

          {isOutOfStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockOverlayText}>Out of Stock</Text>
            </View>
          )}
          {isLowStock && (
            <View style={styles.lowStockBadge}>
              <Ionicons name="alert-circle" size={12} color="#fff" />
              <Text style={styles.lowStockBadgeText}>Only {product.stock} left!</Text>
            </View>
          )}
          {product.course_strand && product.course_strand !== "All" && (
            <View style={styles.courseBadgeFloating}>
              <Text style={styles.courseBadgeFloatingText}>{product.course_strand}</Text>
            </View>
          )}
        </View>

        {/* ── TITLE & PRICE ROW ── */}
        <View style={styles.titlePriceRow}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <View style={styles.deptTagWrap}>
                <Text style={styles.deptTag}>{product.department || "All"}</Text>
              </View>
              {product.course_strand && product.course_strand !== "All" && (
                <View style={styles.courseTagWrap}>
                  <Text style={styles.courseTag}>{product.course_strand}</Text>
                </View>
              )}
            </View>
            <Text style={styles.productTitle}>{product.name}</Text>
            <Text style={styles.productSubtitle}>
              {product.description || "Official Olivarez College Merchandise"}
            </Text>
          </View>
          <View style={styles.priceBox}>
            <Text style={styles.productPrice}>P{product.price.toFixed(2)}</Text>
          </View>
        </View>

        {/* ── DIVIDER ── */}
        <View style={styles.divider} />

        {/* ── SIZES SECTION ── */}
        <View style={styles.sizesSection}>
          <View style={styles.sizeHeaderRow}>
            <Text style={styles.sectionHeading}>Select Size</Text>
            <TouchableOpacity
              style={styles.sizeGuideBtn}
              onPress={() => setShowSizeGuide(true)}
            >
              <Ionicons name="resize-outline" size={14} color={OC_GREEN} />
              <Text style={styles.sizeGuideLink}>  Size Guide</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sizeChipsRow}>
            {availableSizes.map((size) => {
              const isSelected = selectedSize === size;
              return (
                <TouchableOpacity
                  key={size}
                  style={[styles.sizeChip, isSelected && styles.sizeChipActive]}
                  onPress={() => setSelectedSize(size)}
                >
                  {isSelected && <View style={styles.sizeChipDot} />}
                  <Text style={[styles.sizeChipText, isSelected && styles.sizeChipTextActive]}>
                    {size}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── DIVIDER ── */}
        <View style={styles.divider} />

        {/* ── QUANTITY STEPPER ── */}
        <View style={styles.quantitySection}>
          <View>
            <Text style={styles.sectionHeading}>Quantity</Text>
            {!isOutOfStock && (
              <Text style={styles.stockNote}>{product.stock} items available</Text>
            )}
          </View>
          <View style={styles.stepperContainer}>
            <TouchableOpacity
              style={[styles.stepperBtn, quantity <= 1 && styles.stepperBtnDisabled]}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Text style={[styles.stepperBtnText, quantity <= 1 && { color: "#ced4da" }]}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantityVal}>{quantity}</Text>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}
            >
              <Text style={styles.stepperBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── TOTAL PREVIEW ── */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>P{(product.price * quantity).toFixed(2)}</Text>
        </View>
      </ScrollView>

      {/* ── BOTTOM ADD TO CART BUTTON (absolute so it never gets hidden) ── */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) + 16 }]}>
        <TouchableOpacity
          activeOpacity={0.88}
          style={[styles.addBtn, isOutOfStock && styles.addBtnDisabled]}
          onPress={handleAddToCart}
          disabled={isOutOfStock}
        >
          {!isOutOfStock && (
            <Ionicons name="bag-add-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          )}
          <Text style={styles.addBtnText}>
            {isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── SIZE GUIDE MODAL ── */}
      <Modal visible={showSizeGuide} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Size Guide (Inches)</Text>
              <TouchableOpacity
                style={styles.modalCloseIcon}
                onPress={() => setShowSizeGuide(false)}
              >
                <Ionicons name="close" size={22} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={styles.tableHeadCell}>Size</Text>
                <Text style={styles.tableHeadCell}>Chest</Text>
                <Text style={styles.tableHeadCell}>Length</Text>
                <Text style={styles.tableHeadCell}>Waist</Text>
              </View>
              {[
                { s: "XS",  c: "34\"", l: "24\"", w: "26-28\"" },
                { s: "S",   c: "36\"", l: "25\"", w: "28-30\"" },
                { s: "M",   c: "38\"", l: "26\"", w: "30-32\"" },
                { s: "L",   c: "40\"", l: "27\"", w: "32-34\"" },
                { s: "XL",  c: "42\"", l: "28\"", w: "34-36\"" },
                { s: "XXL", c: "44\"", l: "29\"", w: "36-38\"" },
              ].map((row, idx) => (
                <View key={row.s} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
                  <Text style={[styles.tableCell, { fontWeight: "700", color: OC_GREEN }]}>{row.s}</Text>
                  <Text style={styles.tableCell}>{row.c}</Text>
                  <Text style={styles.tableCell}>{row.l}</Text>
                  <Text style={styles.tableCell}>{row.w}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setShowSizeGuide(false)}
            >
              <Text style={styles.closeModalBtnText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#ffffff" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f5",
  },
  iconBtn: {
    width: 40, height: 40,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#f8f9fa", borderRadius: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#1c2833" },
  headerLogo: { width: 34, height: 34 },

  // Scroll content
  content: { paddingHorizontal: 20, paddingTop: 16 },

  // Hero
  heroCard: {
    backgroundColor: "#e8f2ea",
    borderRadius: 24, height: 260,
    alignItems: "center", justifyContent: "center",
    marginBottom: 22, overflow: "hidden", position: "relative",
  },
  heroRealImage: { width: "100%", height: "100%" },
  heroIllustration: { alignItems: "center", justifyContent: "center" },
  heroTie: {
    position: "absolute", bottom: 25,
    width: 12, height: 32, backgroundColor: OC_GOLD, borderRadius: 5,
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center", justifyContent: "center",
  },
  outOfStockOverlayText: { color: "#ffffff", fontSize: 20, fontWeight: "800" },
  lowStockBadge: {
    position: "absolute", bottom: 12, left: 12,
    backgroundColor: "#e74c3c",
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  lowStockBadgeText: { color: "#ffffff", fontSize: 11, fontWeight: "700" },
  courseBadgeFloating: {
    position: "absolute", top: 14, right: 14,
    backgroundColor: OC_GREEN,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, elevation: 3,
  },
  courseBadgeFloatingText: { color: "#ffffff", fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },

  // Title & price
  titlePriceRow: {
    flexDirection: "row", alignItems: "flex-start",
    justifyContent: "space-between", marginBottom: 18,
  },
  deptTagWrap: { backgroundColor: "#e9ecef", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  deptTag: { fontSize: 11, fontWeight: "700", color: "#6c757d" },
  courseTagWrap: { backgroundColor: "#e8f5ec", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  courseTag: { fontSize: 11, fontWeight: "800", color: OC_GREEN },
  productTitle: { fontSize: 22, fontWeight: "800", color: "#1c2833", marginBottom: 4 },
  productSubtitle: { fontSize: 13, color: "#6c757d", lineHeight: 18 },
  priceBox: { backgroundColor: "#f0f7f2", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  productPrice: { fontSize: 20, fontWeight: "800", color: OC_GREEN },

  divider: { height: 1, backgroundColor: "#f1f3f5", marginBottom: 20 },

  // Sizes
  sizesSection: { marginBottom: 20 },
  sizeHeaderRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 14,
  },
  sectionHeading: { fontSize: 16, fontWeight: "700", color: "#1c2833" },
  sizeGuideBtn: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#f0f7f2", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  sizeGuideLink: { fontSize: 12, fontWeight: "700", color: OC_GREEN },
  sizeChipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  sizeChip: {
    minWidth: 52, paddingHorizontal: 14, height: 44, borderRadius: 12,
    borderWidth: 1.5, borderColor: "#dee2e6",
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#ffffff", flexDirection: "row", gap: 5,
  },
  sizeChipActive: { borderColor: OC_GREEN, borderWidth: 2, backgroundColor: "#f0f7f2" },
  sizeChipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: OC_GREEN },
  sizeChipText: { fontSize: 13, fontWeight: "600", color: "#495057" },
  sizeChipTextActive: { color: OC_GREEN, fontWeight: "800" },

  // Quantity
  quantitySection: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 16,
  },
  stockNote: { fontSize: 12, color: "#6c757d", marginTop: 2 },
  stepperContainer: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#f8f9fa", paddingHorizontal: 6, paddingVertical: 4,
    borderRadius: 14, borderWidth: 1, borderColor: "#e9ecef",
  },
  stepperBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 10 },
  stepperBtnDisabled: { opacity: 0.4 },
  stepperBtnText: { fontSize: 22, fontWeight: "600", color: OC_GREEN, lineHeight: 26 },
  quantityVal: { fontSize: 16, fontWeight: "800", color: "#1c2833", minWidth: 28, textAlign: "center" },

  // Total
  totalRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "#f0f7f2", borderRadius: 14, paddingHorizontal: 18, paddingVertical: 14,
  },
  totalLabel: { fontSize: 15, fontWeight: "600", color: "#495057" },
  totalValue: { fontSize: 22, fontWeight: "900", color: OC_GREEN, letterSpacing: -0.5 },

  // Bottom bar — ABSOLUTE so it always stays visible above nav bar
  bottomBar: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingTop: 12,
    backgroundColor: "#ffffff",
    borderTopWidth: 1, borderTopColor: "#f1f3f5",
    shadowColor: "#000", shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: -3 }, shadowRadius: 8, elevation: 8,
  },
  addBtn: {
    backgroundColor: OC_GREEN,
    paddingVertical: 16, borderRadius: 16,
    alignItems: "center", justifyContent: "center", flexDirection: "row",
    shadowColor: OC_GREEN, shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 4,
  },
  addBtnDisabled: { backgroundColor: "#adb5bd", shadowOpacity: 0, elevation: 0 },
  addBtnText: { color: "#ffffff", fontSize: 16, fontWeight: "800", letterSpacing: 0.3 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center", padding: 24,
  },
  modalContent: { backgroundColor: "#ffffff", borderRadius: 24, padding: 22 },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 16,
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: "#1c2833" },
  modalCloseIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#f8f9fa", alignItems: "center", justifyContent: "center",
  },
  table: {
    borderWidth: 1, borderColor: "#e9ecef",
    borderRadius: 12, overflow: "hidden", marginBottom: 16,
  },
  tableRow: { flexDirection: "row", paddingVertical: 10, paddingHorizontal: 8 },
  tableRowAlt: { backgroundColor: "#f8f9fa" },
  tableHeader: { backgroundColor: "#e8f5e9" },
  tableHeadCell: { flex: 1, fontWeight: "700", color: OC_GREEN, fontSize: 13, textAlign: "center" },
  tableCell: { flex: 1, fontSize: 13, color: "#495057", textAlign: "center" },
  closeModalBtn: { backgroundColor: OC_GREEN, paddingVertical: 13, borderRadius: 14, alignItems: "center" },
  closeModalBtnText: { color: "#ffffff", fontWeight: "700", fontSize: 15 },
});
