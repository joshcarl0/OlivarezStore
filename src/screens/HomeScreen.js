import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import {
  isAuthenticated,
  secureLogout,
  isSessionExpired,
  touchSession,
} from "../utils/security";
import { useCart } from "../context/CartContext";

const OC_GREEN = "#0F5D33";
const OC_DARK_GREEN = "#0B4626";
const OC_GOLD = "#FBEBB8";
const OC_SECONDARY_GREEN = "#377445";
const OC_LIGHT_BG = "#f8f9fa";
const OC_RED = "#F10930";

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { cart, orders, totalCount } = useCart();
  const [student, setStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("home");
  const sessionTimer = useRef(null);

  // ── Auth guard & load student info ──────────────────────
  useEffect(() => {
    let mounted = true;

    const checkAuthAndLoad = async () => {
      const authenticated = await isAuthenticated();
      if (!mounted) return;
      if (!authenticated) {
        navigation.replace("Login");
        return;
      }

      const expired = await isSessionExpired();
      if (!mounted) return;
      if (expired) {
        await secureLogout();
        Alert.alert("Session Expired", "You were logged out due to inactivity.", [
          { text: "OK", onPress: () => navigation.replace("Login") },
        ]);
        return;
      }
      await touchSession();

      // Load student data from AsyncStorage
      try {
        const infoStr = await AsyncStorage.getItem("student_info");
        if (infoStr && mounted) {
          setStudent(JSON.parse(infoStr));
        }
      } catch (err) {
        console.log("Error reading student info:", err);
      }
    };

    checkAuthAndLoad();

    sessionTimer.current = setInterval(async () => {
      const expired = await isSessionExpired();
      if (expired) {
        clearInterval(sessionTimer.current);
        await secureLogout();
        Alert.alert("Session Expired", "You were logged out due to inactivity.", [
          { text: "OK", onPress: () => navigation.replace("Login") },
        ]);
      }
    }, 60_000);

    return () => {
      mounted = false;
      clearInterval(sessionTimer.current);
    };
  }, []);

  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
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

  const studentName = student?.first_name || "Juan";
  const blouseSize = student?.size_blouse || "M";
  const skirtSize = student?.size_skirt || "M";
  const peSize = student?.size_pe_shirt || "L";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* ── TOP HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => Alert.alert("Olivarez College", "Welcome to the official Bookstore Supply App.")}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>

        {/* Center Seal */}
        <Image
          source={require("../../assets/OC-LOGO.png")}
          style={styles.headerLogo}
          resizeMode="contain"
        />

        {/* Right Notification Icon & Cart Icon */}
        <View style={styles.headerRight}>
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
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => Alert.alert("Notifications", "You have no new notifications.")}
          >
            <Ionicons name="notifications-outline" size={22} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── MAIN SCROLLABLE CONTENT ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── GREETING SECTION ── */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingSub}>Good Day,</Text>
          <Text style={styles.studentName}>{studentName}</Text>
          <View style={styles.storeStatusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.storeStatusText}>Store open today: 8:00 AM – 5:00 PM</Text>
          </View>
        </View>

        {/* ── SEARCH BAR ── */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.searchBar}
          onPress={() => navigation.navigate("Shop", { search: searchQuery })}
        >
          <Ionicons name="search" size={18} color="#999" style={styles.searchIcon} />
          <TextInput
            placeholder="Search blouse, lace, PE shirts..."
            placeholderTextColor="#999"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => navigation.navigate("Shop", { search: searchQuery })}
          />
        </TouchableOpacity>

        {/* ── CATEGORIES (BENTO GRID) ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
        </View>

        <View style={styles.bentoContainer}>
          {/* Large Left Card: Uniforms */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.bentoUniforms}
            onPress={() => navigation.navigate("Shop", { category: "Uniforms" })}
          >
            <View style={styles.bentoUniformsContent}>
              <View style={styles.uniformIllustration}>
                <MaterialCommunityIcons name="tshirt-v" size={68} color="#ffffff" />
                <View style={styles.tieAccent} />
              </View>
              <Text style={styles.bentoUniformsTitle}>Uniforms</Text>
            </View>
          </TouchableOpacity>

          {/* Right Column (ID Laces & PE Wear) */}
          <View style={styles.bentoRightCol}>
            {/* Top Right: ID Laces (Golden Yellow) */}
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.bentoLaces}
              onPress={() => navigation.navigate("Shop", { category: "ID Lace" })}
            >
              <View style={styles.bentoRightInner}>
                <Ionicons name="ribbon-outline" size={40} color={OC_GREEN} />
                <Text style={styles.bentoLacesTitle}>ID Laces</Text>
              </View>
            </TouchableOpacity>

            {/* Bottom Right: PE Wear (Medium Green) */}
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.bentoPE}
              onPress={() => navigation.navigate("Shop", { category: "PE" })}
            >
              <View style={styles.bentoRightInner}>
                <MaterialCommunityIcons name="tshirt-crew" size={40} color="#ffffff" />
                <Text style={styles.bentoPETitle}>PE wear</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── YOUR USUAL SIZES ── */}
        <View style={styles.sectionHeaderWithAction}>
          <Text style={styles.sectionTitle}>Your usual sizes</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
            <Text style={styles.editActionText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sizesRow}>
          <View style={styles.sizePill}>
            <Text style={styles.sizePillText}>Blouse {blouseSize}</Text>
          </View>
          <View style={styles.sizePill}>
            <Text style={styles.sizePillText}>Skirt {skirtSize}</Text>
          </View>
          <View style={styles.sizePill}>
            <Text style={styles.sizePillText}>PE shirt {peSize}</Text>
          </View>
        </View>

        {/* ── RECENT ORDER ACTIVITY ── */}
        <View style={styles.sectionHeaderWithAction}>
          <Text style={styles.sectionTitle}>Recent order activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Orders")}>
            <Text style={styles.seeAllText}>See all &gt;</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityList}>
          {orders.map((order, idx) => {
            const isReady = order.status === "Ready";
            return (
              <TouchableOpacity
                key={order.orderId || idx}
                activeOpacity={0.8}
                style={styles.activityCard}
                onPress={() => navigation.navigate("OrderSuccess", { order })}
              >
                <View style={styles.activityIconBox}>
                  <MaterialCommunityIcons name="tshirt-v-outline" size={24} color="#ffffff" />
                </View>
                <View style={styles.activityDetails}>
                  <Text style={styles.activityOrderCode}>
                    {order.orderId} {order.status === "Claimed" ? "Claimed" : ""}
                  </Text>
                  <Text style={styles.activitySubText}>{order.itemsSummary || order.details}</Text>
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
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* ── BOTTOM NAVIGATION BAR ── */}
      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 20) + 12 }]}>
        {/* Home */}
        <TouchableOpacity
          style={styles.navItem}
          hitSlop={{ top: 12, bottom: 16, left: 16, right: 16 }}
          onPress={() => setActiveTab("home")}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === "home" ? "home" : "home-outline"}
            size={24}
            color={activeTab === "home" ? OC_GREEN : "#888"}
          />
          <Text style={[styles.navItemText, activeTab === "home" && styles.navItemTextActive]}>Home</Text>
        </TouchableOpacity>

        {/* Shop */}
        <TouchableOpacity
          style={styles.navItem}
          hitSlop={{ top: 12, bottom: 16, left: 16, right: 16 }}
          onPress={() => { setActiveTab("shop"); navigation.navigate("Shop"); }}
          activeOpacity={0.7}
        >
          <Feather
            name="shopping-bag"
            size={22}
            color={activeTab === "shop" ? OC_GREEN : "#888"}
          />
          <Text style={[styles.navItemText, activeTab === "shop" && styles.navItemTextActive]}>Shop</Text>
        </TouchableOpacity>

        {/* Orders / Activity */}
        <TouchableOpacity
          style={styles.navItem}
          hitSlop={{ top: 12, bottom: 16, left: 16, right: 16 }}
          onPress={() => { setActiveTab("orders"); navigation.navigate("Orders"); }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === "orders" ? "receipt" : "receipt-outline"}
            size={22}
            color={activeTab === "orders" ? OC_GREEN : "#888"}
          />
          <Text style={[styles.navItemText, activeTab === "orders" && styles.navItemTextActive]}>Orders</Text>
        </TouchableOpacity>

        {/* Profile */}
        <TouchableOpacity
          style={styles.navItem}
          hitSlop={{ top: 12, bottom: 16, left: 16, right: 16 }}
          onPress={() => { setActiveTab("profile"); navigation.navigate("Profile"); }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === "profile" ? "person" : "person-outline"}
            size={22}
            color={activeTab === "profile" ? OC_GREEN : "#888"}
          />
          <Text style={[styles.navItemText, activeTab === "profile" && styles.navItemTextActive]}>Profile</Text>
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
    borderRadius: 20,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  cartHeaderBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginRight: 4,
  },
  cartBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: OC_RED,
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
  headerLogo: {
    width: 38,
    height: 38,
  },
  scroll: {
    flex: 1,
    backgroundColor: OC_LIGHT_BG,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 24,
  },
  greetingSection: {
    marginBottom: 16,
  },
  greetingSub: {
    fontSize: 14,
    color: "#6c757d",
    fontWeight: "500",
  },
  studentName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1c2833",
    marginTop: 2,
    letterSpacing: -0.5,
  },
  storeStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#28a745",
    marginRight: 6,
  },
  storeStatusText: {
    fontSize: 13,
    color: "#495057",
    fontWeight: "500",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#212529",
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionHeaderWithAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 22,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1c2833",
  },
  editActionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6c757d",
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: OC_GREEN,
  },
  // ── BENTO GRID ──
  bentoContainer: {
    flexDirection: "row",
    height: 180,
    gap: 12,
  },
  bentoUniforms: {
    flex: 1,
    backgroundColor: OC_GREEN,
    borderRadius: 20,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: OC_GREEN,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  bentoUniformsContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  uniformIllustration: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    position: "relative",
  },
  tieAccent: {
    position: "absolute",
    bottom: 12,
    width: 6,
    height: 14,
    backgroundColor: OC_GOLD,
    borderRadius: 3,
  },
  bentoUniformsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  bentoRightCol: {
    flex: 1,
    gap: 12,
  },
  bentoLaces: {
    flex: 1,
    backgroundColor: OC_GOLD,
    borderRadius: 18,
    paddingHorizontal: 16,
    justifyContent: "center",
    shadowColor: OC_GOLD,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2,
  },
  bentoPE: {
    flex: 1,
    backgroundColor: OC_SECONDARY_GREEN,
    borderRadius: 18,
    paddingHorizontal: 16,
    justifyContent: "center",
    shadowColor: OC_SECONDARY_GREEN,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2,
  },
  bentoRightInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bentoLacesTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: OC_GREEN,
  },
  bentoPETitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
  // ── SIZES ROW ──
  sizesRow: {
    flexDirection: "row",
    gap: 10,
  },
  sizePill: {
    backgroundColor: OC_GREEN,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  sizePillText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  // ── RECENT ACTIVITY LIST ──
  activityList: {
    gap: 10,
    marginTop: 2,
  },
  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#edf0f2",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  activityIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: OC_GREEN,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityOrderCode: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1c2833",
  },
  activitySubText: {
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
  // ── BOTTOM NAV ──
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderTopWidth: 1.5,
    borderTopColor: "#edf0f2",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 10,
    paddingTop: 8,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 6,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 14,
    minWidth: 64,
  },
  navItemText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#8B8B8A",
    marginTop: 2,
  },
  navItemTextActive: {
    color: OC_GREEN,
    fontWeight: "800",
  },
});
