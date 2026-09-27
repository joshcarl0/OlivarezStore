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
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useCart } from "../context/CartContext";

const OC_GREEN = "#1a5c2e";
const OC_GOLD = "#f5a623";

export default function ProductDetailScreen({ navigation, route }) {
  const { product } = route.params || {};
  const { addToCart } = useCart();

  const availableSizes =
    product?.sizes && product.sizes.length > 0
      ? product.sizes
      : ["XS", "M", "L", "XL", "XXL", "XXXL"];

  const [selectedSize, setSelectedSize] = useState(availableSizes[0] || "M");
  const [quantity, setQuantity] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  if (!product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={{ textAlign: "center", marginTop: 40 }}>Product not found.</Text>
      </SafeAreaView>
    );
  }

  const handleAddToCart = () => {
    if (product.stock <= 0) {
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
        <Text style={styles.headerTitle}>Add to cart</Text>
        <Image
          source={require("../../assets/OC-LOGO.png")}
          style={styles.headerLogo}
          resizeMode="contain"
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
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
                <MaterialCommunityIcons name="skirt" size={130} color="#2b5937" />
              ) : product.imageType === "lace" ? (
                <Ionicons name="ribbon-outline" size={120} color="#2b5937" />
              ) : product.imageType === "tie" ? (
                <MaterialCommunityIcons name="tie" size={120} color="#2b5937" />
              ) : (
                <View style={{ alignItems: "center" }}>
                  <MaterialCommunityIcons name="tshirt-v" size={140} color="#ffffff" />
                  <View style={styles.heroTie} />
                </View>
              )}
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
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <Text style={styles.deptTag}>{product.department || "College"}</Text>
              {product.course_strand && product.course_strand !== "All" && (
                <Text style={styles.courseTag}>{product.course_strand}</Text>
              )}
            </View>
            <Text style={styles.productTitle}>{product.name}</Text>
            <Text style={styles.productSubtitle}>
              {product.description || "Official Olivarez College Merchandise"}
            </Text>
          </View>
          <Text style={styles.productPrice}>₱{product.price.toFixed(2)}</Text>
        </View>

        {/* ── SIZES SECTION ── */}
        <View style={styles.sizesSection}>
          <View style={styles.sizeHeaderRow}>
            <Text style={styles.sectionHeading}>Sizes</Text>
            <TouchableOpacity onPress={() => setShowSizeGuide(true)}>
              <Text style={styles.sizeGuideLink}>📏 Size Guide</Text>
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
                  <Text style={[styles.sizeChipText, isSelected && styles.sizeChipTextActive]}>
                    {size}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── QUANTITY STEPPER ── */}
        <View style={styles.quantitySection}>
          <Text style={styles.sectionHeading}>Quantity</Text>
          <View style={styles.stepperContainer}>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Text style={styles.stepperBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.quantityVal}>{quantity}</Text>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => setQuantity(quantity + 1)}
            >
              <Text style={styles.stepperBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ── BOTTOM ADD TO CART BUTTON ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          activeOpacity={0.88}
          style={[styles.addBtn, product.stock <= 0 && styles.addBtnDisabled]}
          onPress={handleAddToCart}
          disabled={product.stock <= 0}
        >
          <Text style={styles.addBtnText}>
            {product.stock <= 0 ? "Out of Stock" : "Add to cart"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── SIZE GUIDE MODAL ── */}
      <Modal visible={showSizeGuide} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Size Guide (Inches)</Text>
              <TouchableOpacity onPress={() => setShowSizeGuide(false)}>
                <Ionicons name="close" size={24} color="#333" />
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
                { s: "XS", c: '34"', l: '24"', w: '26-28"' },
                { s: "S", c: '36"', l: '25"', w: '28-30"' },
                { s: "M", c: '38"', l: '26"', w: '30-32"' },
                { s: "L", c: '40"', l: '27"', w: '32-34"' },
                { s: "XL", c: '42"', l: '28"', w: '34-36"' },
                { s: "XXL", c: '44"', l: '29"', w: '36-38"' },
              ].map((row, idx) => (
                <View key={row.s} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
                  <Text style={[styles.tableCell, { fontWeight: "700" }]}>{row.s}</Text>
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
              <Text style={styles.closeModalBtnText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
  },
  heroCard: {
    backgroundColor: "#e2ede4",
    borderRadius: 24,
    height: 250,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    overflow: "hidden",
    position: "relative",
  },
  heroRealImage: {
    width: "100%",
    height: "100%",
  },
  courseBadgeFloating: {
    position: "absolute",
    top: 14,
    right: 14,
    backgroundColor: OC_GREEN,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  courseBadgeFloatingText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  deptTag: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6c757d",
    backgroundColor: "#e9ecef",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  courseTag: {
    fontSize: 11,
    fontWeight: "800",
    color: OC_GREEN,
    backgroundColor: "#e8f5ec",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  heroIllustration: {
    alignItems: "center",
    justifyContent: "center",
  },
  heroTie: {
    position: "absolute",
    bottom: 25,
    width: 12,
    height: 32,
    backgroundColor: OC_GOLD,
    borderRadius: 5,
  },
  titlePriceRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  productTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1c2833",
  },
  productSubtitle: {
    fontSize: 13,
    color: "#6c757d",
    marginTop: 4,
    lineHeight: 18,
  },
  productPrice: {
    fontSize: 22,
    fontWeight: "800",
    color: OC_GREEN,
  },
  sizesSection: {
    marginBottom: 24,
  },
  sizeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1c2833",
  },
  sizeGuideLink: {
    fontSize: 13,
    fontWeight: "600",
    color: OC_GREEN,
  },
  sizeChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  sizeChip: {
    width: 52,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dee2e6",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  sizeChipActive: {
    borderColor: OC_GREEN,
    borderWidth: 2,
    backgroundColor: "#f0f7f2",
  },
  sizeChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
  },
  sizeChipTextActive: {
    color: OC_GREEN,
    fontWeight: "800",
  },
  quantitySection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f1f3f5",
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  stepperBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnText: {
    fontSize: 20,
    fontWeight: "600",
    color: OC_GREEN,
  },
  quantityVal: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1c2833",
    minWidth: 20,
    textAlign: "center",
  },
  bottomBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f3f5",
    backgroundColor: "#ffffff",
  },
  addBtn: {
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
  addBtnDisabled: {
    backgroundColor: "#adb5bd",
  },
  addBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1c2833",
  },
  table: {
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 16,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tableRowAlt: {
    backgroundColor: "#f8f9fa",
  },
  tableHeader: {
    backgroundColor: "#e8f5e9",
  },
  tableHeadCell: {
    flex: 1,
    fontWeight: "700",
    color: OC_GREEN,
    fontSize: 13,
    textAlign: "center",
  },
  tableCell: {
    flex: 1,
    fontSize: 13,
    color: "#495057",
    textAlign: "center",
  },
  closeModalBtn: {
    backgroundColor: OC_GREEN,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  closeModalBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
  },
});
