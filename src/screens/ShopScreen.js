import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { ENDPOINTS } from "../config/api";
import { useCart } from "../context/CartContext";

const OC_GREEN = "#0F5D33";
const OC_LIGHT_BG = "#f8f9fa";
const OC_GOLD = "#FBEBB8";
const OC_SECONDARY_GREEN = "#377445";

// Default catalog matching the design mockup & database
const INITIAL_PRODUCTS = [
  {
    id: 1,
    name: "Girls' blouse, Junior High",
    category: "Tops",
    gender: "Girls",
    price: 385.0,
    stock: 50,
    description: "Junior High • white with green collar and official school embroidery",
    sizes: ["XS", "M", "L", "XL", "XXL", "XXXL"],
    imageType: "blouse",
  },
  {
    id: 2,
    name: "Girls' skirt, Junior High",
    category: "Bottoms",
    gender: "Girls",
    price: 385.0,
    stock: 40,
    description: "Official pleated school skirt with durable zipper and inner lining",
    sizes: ["24", "26", "28", "30", "32"],
    imageType: "skirt",
  },
  {
    id: 3,
    name: "Men's blouse, Junior High",
    category: "Tops",
    gender: "Boys",
    price: 295.0,
    stock: 45,
    description: "Junior High polo with school crest and official green piping",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    imageType: "polo",
  },
  {
    id: 4,
    name: "PE shirt",
    category: "PE wear",
    gender: "All",
    price: 385.0,
    stock: 0, // Sold out in design!
    description: "Official moisture-wicking Olivarez College PE uniform shirt",
    sizes: ["XS", "M", "L", "XL", "XXL"],
    imageType: "peshirt",
  },
  {
    id: 5,
    name: "PE shorts",
    category: "PE wear",
    gender: "All",
    price: 250.0,
    stock: 35,
    description: "Official green sports shorts with drawstring and side striping",
    sizes: ["XS", "M", "L", "XL", "XXL"],
    imageType: "peshorts",
  },
  {
    id: 6,
    name: "ID Lace",
    category: "Accessories",
    gender: "All",
    price: 50.0,
    stock: 120,
    description: "Official green lanyard with Olivarez College logo and metal clasp",
    sizes: ["Standard"],
    imageType: "lace",
  },
  {
    id: 7,
    name: "School Necktie",
    category: "Accessories",
    gender: "Girls",
    price: 150.0,
    stock: 80,
    description: "Standard pre-tied green school tie with adjustable clip",
    sizes: ["Standard"],
    imageType: "tie",
  },
];

export default function ShopScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { totalCount } = useCart();
  const initialCategory = route.params?.category;
  const initialSearch = route.params?.search || "";

  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [genderFilter, setGenderFilter] = useState("Girls"); // Girls | Boys
  const [deptFilter, setDeptFilter] = useState("All");
  const [courseFilter, setCourseFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState(
    initialCategory === "Uniforms" ? "All" : initialCategory || "All"
  );

  // Fetch real products from API if available
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(ENDPOINTS.products, {
          headers: { "ngrok-skip-browser-warning": "true" },
        });
        const data = await res.json();
        if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
          const merged = data.data.map((item) => {
            let imageType = "blouse";
            const n = item.name.toLowerCase();
            if (n.includes("skirt") || n.includes("jumper")) imageType = "skirt";
            else if (n.includes("lace") || n.includes("lanyard") || n.includes("patch")) imageType = "lace";
            else if (n.includes("tie")) imageType = "tie";
            else if (n.includes("shorts") || n.includes("pants") || n.includes("slacks")) imageType = "pants";
            else if (n.includes("polo") || n.includes("barong") || n.includes("scrub") || n.includes("jacket")) imageType = "polo";

            let parsedSizes = ["XS", "S", "M", "L", "XL"];
            if (Array.isArray(item.sizes)) parsedSizes = item.sizes;
            else if (typeof item.sizes === "string" && item.sizes.trim()) {
              try { parsedSizes = JSON.parse(item.sizes); } catch {}
            }

            return {
              ...item,
              price: parseFloat(item.price) || 350.0,
              gender: item.gender || "All",
              department: item.department || "All",
              course_strand: item.course_strand || "All",
              image_url: item.image_url || null,
              imageType,
              sizes: parsedSizes,
            };
          });
          setProducts(merged);
        }
      } catch (err) {
        // Fallback to INITIAL_PRODUCTS
      }
    })();
  }, []);

  // Filter products based on Gender, Department, Course, Category chip, and Search query
  const filteredProducts = products.filter((item) => {
    // Gender check
    if (item.gender !== "All" && item.gender !== "Unisex" && item.gender !== genderFilter) {
      return false;
    }
    // Department check
    if (deptFilter !== "All" && item.department !== "All" && item.department !== deptFilter) {
      return false;
    }
    // Course check
    if (courseFilter !== "All" && item.course_strand !== "All" && item.course_strand !== courseFilter) {
      return false;
    }
    // Category check
    if (categoryFilter !== "All") {
      if (categoryFilter === "Tops" && item.category !== "Tops" && item.category !== "Blouse") return false;
      if (categoryFilter === "Bottoms" && item.category !== "Bottoms" && item.category !== "Skirt") return false;
      if (categoryFilter === "PE wear" && !item.category.toLowerCase().includes("pe")) return false;
      if (categoryFilter === "Accessories" && item.category !== "Accessories" && item.category !== "ID Lace") return false;
    }
    // Search query check
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchCat = (item.category || "").toLowerCase().includes(q);
      const matchDept = (item.department || "").toLowerCase().includes(q);
      const matchCourse = (item.course_strand || "").toLowerCase().includes(q);
      if (!matchName && !matchCat && !matchDept && !matchCourse) return false;
    }
    return true;
  });

  const renderProductIllustration = (item) => {
    const isSoldOut = item.stock <= 0;
    const cardBg = isSoldOut ? "#d0e3d4" : OC_GREEN;

    return (
      <View style={[styles.productImageCard, { backgroundColor: cardBg }]}>
        {isSoldOut && (
          <View style={styles.soldOutBadge}>
            <Text style={styles.soldOutText}>Sold out</Text>
          </View>
        )}
        {item.course_strand && item.course_strand !== "All" && (
          <View style={styles.cardCourseBadge}>
            <Text style={styles.cardCourseBadgeText}>{item.course_strand}</Text>
          </View>
        )}
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={styles.cardRealImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.illustrationWrap}>
            {item.imageType === "skirt" ? (
              <MaterialCommunityIcons name="hanger" size={64} color="#f5f5f5" />
            ) : item.imageType === "lace" ? (
              <Ionicons name="ribbon-outline" size={58} color="#ffffff" />
            ) : item.imageType === "tie" ? (
              <MaterialCommunityIcons name="tie" size={58} color="#ffffff" />
            ) : (
              <View style={{ alignItems: "center" }}>
                <MaterialCommunityIcons name="tshirt-v" size={64} color="#ffffff" />
                {item.imageType === "blouse" && <View style={styles.miniTie} />}
              </View>
            )}
          </View>
        )}
      </View>
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
        <Text style={styles.headerTitle}>Shop</Text>
        <TouchableOpacity
          style={styles.cartHeaderBtn}
          onPress={() => navigation.navigate("Cart")}
        >
          <Ionicons name="bag-outline" size={22} color="#333" />
          {totalCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{totalCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── SEARCH INPUT ── */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#999" style={styles.searchIcon} />
          <TextInput
            placeholder="Search blouse, lace, PE shirts, BSN..."
            placeholderTextColor="#999"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#aaa" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── GENDER SEGMENTED TABS (Girls / Boys) ── */}
      <View style={styles.genderRow}>
        <TouchableOpacity
          style={[styles.genderTab, genderFilter === "Girls" && styles.genderTabActive]}
          onPress={() => setGenderFilter("Girls")}
        >
          <Text style={[styles.genderText, genderFilter === "Girls" && styles.genderTextActive]}>
            Girls
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.genderTab, genderFilter === "Boys" && styles.genderTabActive]}
          onPress={() => setGenderFilter("Boys")}
        >
          <Text style={[styles.genderText, genderFilter === "Boys" && styles.genderTextActive]}>
            Boys
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── DEPARTMENT CHIPS ── */}
      <View style={{ marginBottom: 10 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {["All", "College", "Senior High", "Junior High", "Elementary", "Kindergarten"].map((d) => {
            const isActive = deptFilter === d;
            return (
              <TouchableOpacity
                key={d}
                style={[styles.deptChip, isActive && styles.deptChipActive]}
                onPress={() => {
                  setDeptFilter(d);
                  if (d !== "College") setCourseFilter("All");
                }}
              >
                <Text style={[styles.deptChipText, isActive && styles.deptChipTextActive]}>
                  {d === "All" ? "All Depts" : d}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── COLLEGE COURSE CHIPS (Nursing, Criminology, Tourism, etc.) ── */}
      {deptFilter === "College" && (
        <View style={{ marginBottom: 10 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}>
            {[
              { id: "All", label: "All Courses" },
              { id: "BSN", label: "BSN (Nursing)" },
              { id: "BSCrim", label: "BSCrim (Criminology)" },
              { id: "BSHM", label: "BSHM (Hospitality)" },
              { id: "BSTM", label: "BSTM (Tourism)" },
              { id: "BSCA", label: "BSCA (Customs)" },
              { id: "BSRT", label: "BSRT (RadTech)" },
              { id: "General College", label: "General College" },
            ].map((c) => {
              const isActive = courseFilter === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.courseChip, isActive && styles.courseChipActive]}
                  onPress={() => setCourseFilter(c.id)}
                >
                  <Text style={[styles.courseChipText, isActive && styles.courseChipTextActive]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* ── CATEGORY CHIPS (All, Tops, Bottoms, PE wear, Accessories) ── */}
      <View style={styles.categoryRow}>
        {["All", "Tops", "Bottoms", "PE wear", "Accessories"].map((cat) => {
          const isActive = categoryFilter === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => setCategoryFilter(cat)}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── PRODUCT GRID (2 Columns) ── */}
      <ScrollView
        contentContainerStyle={[
          styles.gridContainer,
          { paddingBottom: Math.max(insets.bottom, 20) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No items found.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredProducts.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.85}
                style={styles.productCard}
                onPress={() => navigation.navigate("ProductDetail", { product: item })}
              >
                {renderProductIllustration(item)}
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.productPrice}>₱{item.price.toFixed(2)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
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
  cartHeaderBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: OC_GOLD,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
  },
  searchSection: {
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f4f6f8",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#212529",
  },
  // Gender row
  genderRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  genderTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#f1f3f5",
    alignItems: "center",
    justifyContent: "center",
  },
  genderTabActive: {
    backgroundColor: "#e8f5e9",
    borderWidth: 1,
    borderColor: "#c8e6c9",
  },
  genderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6c757d",
  },
  genderTextActive: {
    color: OC_GREEN,
    fontWeight: "700",
  },
  // Category chips
  categoryRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#f1f3f5",
  },
  chipActive: {
    backgroundColor: OC_GREEN,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#495057",
  },
  chipTextActive: {
    color: "#ffffff",
  },
  // Grid
  gridContainer: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  productCard: {
    width: "48%",
    marginBottom: 14,
  },
  productImageCard: {
    height: 145,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 2,
  },
  soldOutBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#FFEEF1",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    zIndex: 2,
    borderWidth: 1,
    borderColor: "#F10930",
  },
  soldOutText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#F10930",
  },
  illustrationWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  miniTie: {
    position: "absolute",
    bottom: 12,
    width: 6,
    height: 14,
    backgroundColor: OC_GOLD,
    borderRadius: 3,
  },
  productInfo: {
    marginTop: 8,
    paddingHorizontal: 2,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1c2833",
    lineHeight: 18,
    minHeight: 36,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: OC_GREEN,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
  },
  emptyText: {
    fontSize: 15,
    color: "#888",
    marginTop: 10,
  },
  deptChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e6ea",
  },
  deptChipActive: {
    backgroundColor: "#eaf5ed",
    borderColor: OC_GREEN,
  },
  deptChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6c757d",
  },
  deptChipTextActive: {
    color: OC_GREEN,
    fontWeight: "700",
  },
  cardRealImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  productRealImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  cardCourseBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(10, 35, 18, 0.85)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 2,
  },
  cardCourseBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
  },
  courseChip: {
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 10,
    backgroundColor: "#f4f6f8",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  courseChipActive: {
    backgroundColor: "#0e3d1c",
    borderColor: "#0e3d1c",
  },
  courseChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4b5563",
  },
  courseChipTextActive: {
    color: "#ffffff",
    fontWeight: "800",
  },
});
