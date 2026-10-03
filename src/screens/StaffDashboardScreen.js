import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Image,
  Linking,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { CameraView, useCameraPermissions } from "expo-camera";
import { ENDPOINTS } from "../config/api";
import { secureLogout } from "../utils/security";

const OC_GREEN = "#0F5D33";
const OC_DARK_GREEN = "#0B4626";
const OC_SECONDARY_GREEN = "#377445";
const OC_GOLD = "#FBEBB8";
const OC_RED = "#F10930";
const OC_LIGHT_BG = "#f4f7f5";

export default function StaffDashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [staffInfo, setStaffInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("scan"); // "overview", "scan", "queue", "inventory"
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [searchCode, setSearchCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});
  const [cashReceived, setCashReceived] = useState("");
  const [inventory, setInventory] = useState([]);
  const [queueFilter, setQueueFilter] = useState("All");
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [scannerBusy, setScannerBusy] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const scanLockRef = useRef(false);

  const isSuperAdmin = staffInfo?.role === "Super Admin";

  // Admin Uniform Catalog State
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [prodName, setProdName] = useState("");
  const [prodCategory, setProdCategory] = useState("Tops");
  const [prodDept, setProdDept] = useState("College");
  const [prodCourse, setProdCourse] = useState("All");
  const [prodGender, setProdGender] = useState("Unisex");
  const [prodPrice, setProdPrice] = useState("");
  const [prodStock, setProdStock] = useState("");
  const [prodSizes, setProdSizes] = useState("XS,S,M,L,XL");
  const [prodImageUrl, setProdImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogDeptFilter, setCatalogDeptFilter] = useState("All");

  // Admin Users State
  const [usersList, setUsersList] = useState({ staff: [], students: [] });
  const [userSubTab, setUserSubTab] = useState("staff"); // "staff" or "students"
  const [staffModalVisible, setStaffModalVisible] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffUsername, setNewStaffUsername] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffRole, setNewStaffRole] = useState("Store Staff");
  const [newStaffStation, setNewStaffStation] = useState("Counter 01");
  const [newStaffPassword, setNewStaffPassword] = useState("Staff2026!");
  const [savingStaff, setSavingStaff] = useState(false);

  useEffect(() => {
    loadStaffInfo();
    loadOrders();
    loadInventory();
  }, []);

  const loadStaffInfo = async () => {
    try {
      const str = await AsyncStorage.getItem("student_info");
      if (str) {
        const parsed = JSON.parse(str);
        setStaffInfo(parsed);
        if (parsed?.role === "Super Admin") {
          setActiveTab("overview");
          loadAnalytics();
          loadUsers();
        }
      }
    } catch (e) {
      console.log(e);
    }
  };

  const loadUsers = async () => {
    try {
      const baseUrl = ENDPOINTS.login.replace("/login.php", "");
      const res = await fetch(`${baseUrl}/get_users.php`, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setUsersList(data.data);
      }
    } catch (err) {
      console.log("Error loading users:", err);
    }
  };

  const loadAnalytics = async () => {
    try {
      const baseUrl = ENDPOINTS.login.replace("/login.php", "");
      const res = await fetch(`${baseUrl}/get_analytics.php`, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setAnalytics(data.data);
      }
    } catch (err) {
      console.log("Error loading analytics:", err);
    }
  };

  const openAddProduct = () => {
    setEditingProduct(null);
    setProdName("");
    setProdCategory("Tops");
    setProdDept("College");
    setProdCourse("All");
    setProdGender("Unisex");
    setProdPrice("");
    setProdStock("");
    setProdSizes("XS,S,M,L,XL");
    setProdImageUrl("");
    setProductModalVisible(true);
  };

  const openEditProduct = (p) => {
    setEditingProduct(p);
    setProdName(p.name || "");
    setProdCategory(p.category || "Tops");
    setProdDept(p.department || "College");
    setProdCourse(p.course_strand || "All");
    setProdGender(p.gender || "Unisex");
    setProdPrice(p.price ? String(p.price) : "");
    setProdStock(p.stock !== undefined ? String(p.stock) : "0");
    setProdSizes(Array.isArray(p.sizes) ? p.sizes.join(",") : (p.sizes || "XS,S,M,L,XL"));
    setProdImageUrl(p.image_url || "");
    setProductModalVisible(true);
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant photo gallery permission to choose uniform photos."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.75,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setUploadingImage(true);

        try {
          const baseUrl = ENDPOINTS.login.replace("/login.php", "");
          const mimeType = asset.mimeType || "image/jpeg";
          const res = await fetch(`${baseUrl}/upload_image.php`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "true",
            },
            body: JSON.stringify({
              image_base64: `data:${mimeType};base64,${asset.base64}`,
            }),
          });
          const uploadRes = await res.json();
          if (uploadRes.success && uploadRes.data?.url) {
            setProdImageUrl(uploadRes.data.url);
            Alert.alert("Photo Ready", "Uniform photo uploaded successfully!");
          } else {
            // If server upload returned error or local preview
            setProdImageUrl(asset.uri);
            Alert.alert("Notice", uploadRes.message || "Photo selected.");
          }
        } catch (uploadErr) {
          console.log("Upload error:", uploadErr);
          setProdImageUrl(asset.uri);
          Alert.alert("Notice", "Photo selected locally.");
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (err) {
      console.log("Image picker error:", err);
      Alert.alert("Error", "Could not open photo gallery.");
    }
  };

  const handleSaveProduct = async () => {
    if (!prodName.trim()) {
      Alert.alert("Required", "Please enter uniform name.");
      return;
    }
    const priceNum = parseFloat(prodPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert("Required", "Please enter a valid price (greater than 0).");
      return;
    }
    const stockNum = parseInt(prodStock, 10);

    setSavingProduct(true);
    try {
      const baseUrl = ENDPOINTS.login.replace("/login.php", "");
      const res = await fetch(`${baseUrl}/save_product.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          id: editingProduct?.id || 0,
          name: prodName.trim(),
          category: prodCategory,
          department: prodDept,
          course_strand: prodCourse.trim() || "All",
          gender: prodGender,
          price: priceNum,
          stock: isNaN(stockNum) ? 0 : stockNum,
          sizes: prodSizes,
          image_url: prodImageUrl.trim(),
        }),
      });
      const result = await res.json();
      if (result.success) {
        Alert.alert("Success", editingProduct ? "Uniform updated!" : "New uniform added to catalog!");
        setProductModalVisible(false);
        setEditingProduct(null);
        await Promise.all([loadInventory(), loadAnalytics()]);
      } else {
        Alert.alert("Save Failed", result.message || "Could not save uniform.");
      }
    } catch {
      Alert.alert("Error", "Network error saving uniform.");
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = (prod) => {
    Alert.alert(
      "Archive Uniform",
      `Are you sure you want to remove "${prod.name}" from active catalog?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          style: "destructive",
          onPress: async () => {
            try {
              const baseUrl = ENDPOINTS.login.replace("/login.php", "");
              const res = await fetch(`${baseUrl}/delete_product.php`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "ngrok-skip-browser-warning": "true",
                },
                body: JSON.stringify({ id: prod.id }),
              });
              const data = await res.json();
              if (data.success) {
                Alert.alert("Removed", `"${prod.name}" has been archived.`);
                await Promise.all([loadInventory(), loadAnalytics()]);
              } else {
                Alert.alert("Failed", data.message || "Failed to archive product.");
              }
            } catch {
              Alert.alert("Error", "Network error removing product.");
            }
          },
        },
      ]
    );
  };

  const handleSaveStaff = async () => {
    if (!newStaffUsername.trim() || !newStaffName.trim()) {
      Alert.alert("Required", "Username and Full Name are required.");
      return;
    }
    setSavingStaff(true);
    try {
      const baseUrl = ENDPOINTS.login.replace("/login.php", "");
      const res = await fetch(`${baseUrl}/get_users.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          action: newStaffRole === "Super Admin" ? "create_admin" : "create_staff",
          username: newStaffUsername.trim().toLowerCase(),
          full_name: newStaffName.trim(),
          email: newStaffEmail.trim() || `${newStaffUsername.trim().toLowerCase()}@olivarezcollege.edu.ph`,
          role: newStaffRole,
          station: newStaffStation.trim(),
          password: newStaffPassword.trim() || "Staff2026!",
        }),
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert("Created", `${newStaffRole} account "${newStaffUsername}" created successfully!`);
        setStaffModalVisible(false);
        setNewStaffName("");
        setNewStaffUsername("");
        setNewStaffEmail("");
        setNewStaffPassword("Staff2026!");
        await loadUsers();
      } else {
        Alert.alert("Failed", data.message || "Could not create account.");
      }
    } catch {
      Alert.alert("Error", "Network error creating staff account.");
    } finally {
      setSavingStaff(false);
    }
  };

  const handleResetStaffPassword = (staffUser) => {
    Alert.alert(
      "Reset Password",
      `Reset password for ${staffUser.full_name} (${staffUser.username}) to "Staff2026!"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset Password",
          onPress: async () => {
            try {
              const baseUrl = ENDPOINTS.login.replace("/login.php", "");
              const res = await fetch(`${baseUrl}/get_users.php`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "ngrok-skip-browser-warning": "true",
                },
                body: JSON.stringify({
                  action: "reset_password",
                  id: staffUser.id,
                  new_password: "Staff2026!",
                }),
              });
              const data = await res.json();
              if (data.success) {
                Alert.alert("Password Reset", `Password is now: Staff2026!`);
              } else {
                Alert.alert("Failed", data.message || "Failed to reset password.");
              }
            } catch {
              Alert.alert("Error", "Network error resetting password.");
            }
          },
        },
      ]
    );
  };

  const handleToggleStaffActive = async (staffUser) => {
    const newStatus = staffUser.is_active == 1 ? 0 : 1;
    try {
      const baseUrl = ENDPOINTS.login.replace("/login.php", "");
      const res = await fetch(`${baseUrl}/get_users.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          action: "toggle_active",
          id: staffUser.id,
          is_active: newStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await loadUsers();
      } else {
        Alert.alert("Failed", data.message || "Failed to update account status.");
      }
    } catch {
      Alert.alert("Error", "Network error updating status.");
    }
  };

  const loadOrders = async () => {
    try {
      const baseUrl = ENDPOINTS.login.replace("/login.php", "");
      const res = await fetch(`${baseUrl}/get_staff_orders.php`, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });
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

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadOrders(), loadInventory(), loadAnalytics(), loadUsers()]);
    setRefreshing(false);
  };

  const loadInventory = async () => {
    try {
      const baseUrl = ENDPOINTS.login.replace("/login.php", "");
      const res = await fetch(`${baseUrl}/get_inventory.php`, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setInventory(data.data);
      }
    } catch (err) {
      console.log("Error loading inventory:", err);
    }
  };

  const handleLookup = async (overrideCode) => {
    const raw = (typeof overrideCode === "string" ? overrideCode : searchCode).trim();
    if (!raw) {
      Alert.alert("Required", "Please enter an Order Code or Student ID.");
      return;
    }

    setSearching(true);
    try {
      const baseUrl = ENDPOINTS.login.replace("/login.php", "");
      const res = await fetch(`${baseUrl}/get_staff_orders.php?search=${encodeURIComponent(raw)}`, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        selectOrder(data.data[0]);
        loadOrders();
      } else {
        // Fallback: local match
        const clean = raw.toLowerCase().replace(/[^a-z0-9-]/g, "");
        const found = orders.find(
          (o) =>
            (o.order_code && o.order_code.toLowerCase().includes(clean)) ||
            (o.student_id && o.student_id.toLowerCase().includes(clean)) ||
            `${o.first_name} ${o.last_name}`.toLowerCase().includes(clean)
        );
        if (found) {
          selectOrder(found);
        } else {
          Alert.alert("Not Found", `No order found matching "${raw}".`);
        }
      }
    } catch {
      // Offline / network fallback
      const clean = raw.toLowerCase().replace(/[^a-z0-9-]/g, "");
      const found = orders.find(
        (o) =>
          (o.order_code && o.order_code.toLowerCase().includes(clean)) ||
          (o.student_id && o.student_id.toLowerCase().includes(clean)) ||
          `${o.first_name} ${o.last_name}`.toLowerCase().includes(clean)
      );
      if (found) {
        selectOrder(found);
      } else {
        Alert.alert("Not Found", `No order found matching "${raw}".`);
      }
    } finally {
      setSearching(false);
    }
  };

  const openCameraScanner = async () => {
    try {
      let perm = cameraPermission;
      if (!perm || !perm.granted) {
        perm = await requestCameraPermission();
      }
      if (!perm?.granted) {
        if (perm && perm.canAskAgain === false) {
          Alert.alert(
            "Camera Permission Required",
            "Camera access is blocked. Open Settings to allow camera access for scanning student QR tickets.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => Linking.openSettings() },
            ]
          );
        } else {
          Alert.alert(
            "Camera Permission Required",
            "Please allow camera access to scan student QR tickets."
          );
        }
        return;
      }
      scanLockRef.current = false;
      setScannerBusy(false);
      setCameraModalVisible(true);
    } catch (err) {
      console.log("Camera error:", err);
      Alert.alert("Camera Error", "Could not initialize camera.");
    }
  };

  const handleBarCodeScanned = ({ data }) => {
    // Ref lock: onBarcodeScanned fires many times per second, faster than state updates
    if (scanLockRef.current || scannerBusy) return;
    scanLockRef.current = true;
    setScannerBusy(true);

    let codeToSearch = (data || "").trim();
    try {
      const parsed = JSON.parse(codeToSearch);
      if (parsed.orderId || parsed.order_code || parsed.id) {
        codeToSearch = parsed.orderId || parsed.order_code || parsed.id;
      }
    } catch {}

    if (codeToSearch.startsWith("http")) {
      try {
        const url = new URL(codeToSearch);
        const q = url.searchParams.get("order") || url.searchParams.get("code") || url.searchParams.get("id");
        if (q) codeToSearch = q;
      } catch {}
    }

    setCameraModalVisible(false);
    setSearchCode(codeToSearch);
    handleLookup(codeToSearch);

    setTimeout(() => {
      scanLockRef.current = false;
      setScannerBusy(false);
    }, 1500);
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
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ order_id: orderId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert("Order Updated! ✅", `Order has been marked as ${newStatus === "Completed" ? "Claimed & Released!" : "Ready for Pickup!"}`);
        setSelectedOrder((prev) => prev ? { ...prev, status: newStatus } : null);
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
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
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

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View>
          <View style={styles.badgeRow}>
            <View style={[styles.liveDot, isSuperAdmin && { backgroundColor: "#fbbf24" }]} />
            <Text style={[styles.headerSubtitle, isSuperAdmin && { color: OC_GOLD }]}>
              {isSuperAdmin
                ? "👑 Super Admin • Executive Mode"
                : `${staffInfo?.course_strand || "Counter Station 01"} • Online`}
            </Text>
          </View>
          <Text style={styles.headerTitle}>
            {isSuperAdmin ? "Admin Executive Portal" : "Staff Releasing Counter"}
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text style={styles.logoutText}>Exit</Text>
        </TouchableOpacity>
      </View>

      {/* ── TOP TABS ── */}
      <View style={styles.tabBarWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarScroll}
        >
          {isSuperAdmin && (
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === "overview" && styles.tabBtnActive]}
              onPress={() => {
                setActiveTab("overview");
                loadAnalytics();
              }}
            >
              <Ionicons
                name="pie-chart-outline"
                size={17}
                color={activeTab === "overview" ? OC_GREEN : "#666"}
              />
              <Text style={[styles.tabText, activeTab === "overview" && styles.tabTextActive]}>
                Executive
              </Text>
            </TouchableOpacity>
          )}

          {isSuperAdmin && (
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === "catalog" && styles.tabBtnActive]}
              onPress={() => {
                setActiveTab("catalog");
                loadInventory();
              }}
            >
              <Ionicons
                name="shirt-outline"
                size={17}
                color={activeTab === "catalog" ? OC_GREEN : "#666"}
              />
              <Text style={[styles.tabText, activeTab === "catalog" && styles.tabTextActive]}>
                Uniforms
              </Text>
            </TouchableOpacity>
          )}

          {isSuperAdmin && (
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === "users" && styles.tabBtnActive]}
              onPress={() => {
                setActiveTab("users");
                loadUsers();
              }}
            >
              <Ionicons
                name="people-outline"
                size={17}
                color={activeTab === "users" ? OC_GREEN : "#666"}
              />
              <Text style={[styles.tabText, activeTab === "users" && styles.tabTextActive]}>
                Users
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "scan" && styles.tabBtnActive]}
            onPress={() => setActiveTab("scan")}
          >
            <Ionicons
              name="scan-outline"
              size={17}
              color={activeTab === "scan" ? OC_GREEN : "#666"}
            />
            <Text style={[styles.tabText, activeTab === "scan" && styles.tabTextActive]}>
              Lookup
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
              size={17}
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
              size={17}
              color={activeTab === "inventory" ? OC_GREEN : "#666"}
            />
            <Text style={[styles.tabText, activeTab === "inventory" && styles.tabTextActive]}>
              Stocks
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB 0: EXECUTIVE OVERVIEW (SUPER ADMIN) */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: Math.max(insets.bottom, 24) + 60 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[OC_GREEN]} />}
        >
          {/* Revenue Card */}
          <View style={styles.execRevenueCard}>
            <View style={styles.execRevHeader}>
              <View>
                <Text style={styles.execRevSub}>STORE GROSS SALES</Text>
                <Text style={styles.execRevAmount}>
                  ₱{parseFloat(analytics?.revenue?.total || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={styles.execBadge}>
                <Ionicons name="trending-up" size={18} color="#059669" />
                <Text style={styles.execBadgeText}>Live</Text>
              </View>
            </View>
            <View style={styles.execRevDivider} />
            <View style={styles.execRevFooter}>
              <View>
                <Text style={styles.execRevFootLabel}>Claimed & Paid</Text>
                <Text style={styles.execRevFootVal}>
                  ₱{parseFloat(analytics?.revenue?.completed || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </Text>
              </View>
              <View>
                <Text style={styles.execRevFootLabel}>Pending Claims</Text>
                <Text style={[styles.execRevFootVal, { color: "#d97706" }]}>
                  ₱{parseFloat(analytics?.revenue?.pending || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
          </View>

          {/* KPI Grid */}
          <Text style={styles.sectionHeaderTitle}>Store Operations Summary</Text>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiBox}>
              <Ionicons name="receipt-outline" size={24} color={OC_GREEN} />
              <Text style={styles.kpiValue}>{analytics?.orders?.total || 0}</Text>
              <Text style={styles.kpiLabel}>Total Orders</Text>
            </View>
            <View style={styles.kpiBox}>
              <Ionicons name="checkmark-done-circle-outline" size={24} color="#059669" />
              <Text style={[styles.kpiValue, { color: "#059669" }]}>{analytics?.orders?.completed || 0}</Text>
              <Text style={styles.kpiLabel}>Completed</Text>
            </View>
            <View style={styles.kpiBox}>
              <Ionicons name="time-outline" size={24} color="#d97706" />
              <Text style={[styles.kpiValue, { color: "#d97706" }]}>{analytics?.orders?.pending || 0}</Text>
              <Text style={styles.kpiLabel}>Pending Pickup</Text>
            </View>
            <View style={styles.kpiBox}>
              <Ionicons name="school-outline" size={24} color="#2563eb" />
              <Text style={[styles.kpiValue, { color: "#2563eb" }]}>{analytics?.users?.students || 0}</Text>
              <Text style={styles.kpiLabel}>Students Enrolled</Text>
            </View>
          </View>

          {/* Low Stock Alert Section */}
          <View style={styles.alertCard}>
            <View style={styles.alertCardHeader}>
              <Ionicons name="warning-outline" size={20} color="#b45309" style={{ marginRight: 6 }} />
              <Text style={styles.alertCardTitle}>Low Stock Watchlist ({analytics?.inventory?.low_stock || 0})</Text>
            </View>
            {analytics?.inventory?.low_stock_items?.length ? (
              analytics.inventory.low_stock_items.map((item) => (
                <View key={item.id} style={styles.alertRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.alertItemName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.alertItemSub}>{item.department || "All"} • ₱{parseFloat(item.price).toFixed(2)}</Text>
                  </View>
                  <View style={[styles.stockBadge, item.stock === 0 ? styles.stockOutBadge : styles.stockLowBadge]}>
                    <Text style={[styles.stockBadgeText, item.stock === 0 ? styles.textStockOut : styles.textStockLow]}>
                      {item.stock} left
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.alertEmpty}>All uniform stocks are in healthy levels.</Text>
            )}
          </View>

          {/* Desktop Web Portal Guidance */}
          <View style={styles.desktopGuidanceCard}>
            <Ionicons name="desktop-outline" size={26} color={OC_GREEN} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.guidanceTitle}>Super Admin Web Portal</Text>
              <Text style={styles.guidanceDesc}>
                For complete catalog management, uploading photos, and user accounts, open in computer browser:
              </Text>
              <Text style={styles.guidanceLink}>http://localhost/olivarez_admin/</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB: UNIFORM CATALOG MANAGEMENT (SUPER ADMIN) */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === "catalog" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: Math.max(insets.bottom, 24) + 60 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[OC_GREEN]} />}
        >
          {/* Header Action */}
          <View style={styles.catalogTopBar}>
            <View>
              <Text style={styles.catalogSectionTitle}>Uniform Catalog</Text>
              <Text style={styles.catalogSectionSub}>{inventory.length} total items in store</Text>
            </View>
            <TouchableOpacity style={styles.addUniformBtn} onPress={openAddProduct} activeOpacity={0.85}>
              <Ionicons name="add-circle" size={18} color="#fff" />
              <Text style={styles.addUniformBtnText}>Add Uniform</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.catalogSearchRow}>
            <Ionicons name="search" size={18} color="#999" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.catalogSearchInput}
              placeholder="Search uniform name..."
              placeholderTextColor="#999"
              value={catalogSearch}
              onChangeText={setCatalogSearch}
            />
            {catalogSearch.length > 0 && (
              <TouchableOpacity onPress={() => setCatalogSearch("")}>
                <Ionicons name="close-circle" size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {/* Department Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {["All", "College", "Senior High", "Junior High", "Elementary", "Kindergarten"].map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.filterPill, catalogDeptFilter === d && styles.filterPillActive]}
                onPress={() => setCatalogDeptFilter(d)}
              >
                <Text style={[styles.filterPillText, catalogDeptFilter === d && styles.filterPillTextActive]}>
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Products List */}
          {inventory
            .filter((p) => {
              const matchDept = catalogDeptFilter === "All" || p.department === catalogDeptFilter;
              const matchSearch = !catalogSearch.trim() || p.name.toLowerCase().includes(catalogSearch.toLowerCase());
              return matchDept && matchSearch;
            })
            .map((item) => (
              <View key={item.id} style={styles.catalogCard}>
                <View style={styles.catalogCardBody}>
                  {item.image_url ? (
                    <Image
                      source={{ uri: item.image_url }}
                      style={styles.catalogThumb}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.catalogThumbPlaceholder}>
                      <Ionicons name="shirt-outline" size={22} color="#9ca3af" />
                    </View>
                  )}
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <View style={{ flexDirection: "row", gap: 6, marginBottom: 4 }}>
                      <Text style={styles.deptBadge}>{item.department || "All"}</Text>
                      <Text style={styles.catBadge}>{item.category || "Tops"}</Text>
                      {item.course_strand && item.course_strand !== "All" && (
                        <Text style={styles.courseBadge}>{item.course_strand}</Text>
                      )}
                    </View>
                    <Text style={styles.catalogItemTitle}>{item.name}</Text>
                    <Text style={styles.catalogItemPrice}>
                      ₱{parseFloat(item.price).toFixed(2)}
                      {item.sizes ? (
                        <Text style={styles.catalogSizesText}> • {Array.isArray(item.sizes) ? item.sizes.join(", ") : item.sizes}</Text>
                      ) : null}
                    </Text>
                  </View>

                  <View style={styles.catalogStockCol}>
                    <Text style={[styles.catalogStockNum, item.stock <= 15 && { color: item.stock === 0 ? "#dc2626" : "#d97706" }]}>
                      {item.stock}
                    </Text>
                    <Text style={styles.catalogStockLabel}>in stock</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.catalogActionsRow}>
                  <TouchableOpacity style={styles.catActionBtn} onPress={() => openEditProduct(item)}>
                    <Ionicons name="create-outline" size={16} color={OC_GREEN} />
                    <Text style={styles.catActionText}>Edit Details / Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.catActionBtn, { borderColor: "#fee2e2" }]} onPress={() => handleDeleteProduct(item)}>
                    <Ionicons name="trash-outline" size={16} color="#dc2626" />
                    <Text style={[styles.catActionText, { color: "#dc2626" }]}>Archive</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
        </ScrollView>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB: USERS & STAFF MANAGEMENT (SUPER ADMIN) */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === "users" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: Math.max(insets.bottom, 24) + 60 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[OC_GREEN]} />}
        >
          {/* Sub Tab Switcher */}
          <View style={styles.userSubTabBar}>
            <TouchableOpacity
              style={[styles.userSubTabBtn, userSubTab === "staff" && styles.userSubTabBtnActive]}
              onPress={() => setUserSubTab("staff")}
            >
              <Ionicons name="shield-checkmark" size={16} color={userSubTab === "staff" ? "#fff" : "#555"} style={{ marginRight: 6 }} />
              <Text style={[styles.userSubTabText, userSubTab === "staff" && styles.userSubTabTextActive]}>
                Staff & Admins ({usersList.staff?.length || 0})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.userSubTabBtn, userSubTab === "students" && styles.userSubTabBtnActive]}
              onPress={() => setUserSubTab("students")}
            >
              <Ionicons name="school" size={16} color={userSubTab === "students" ? "#fff" : "#555"} style={{ marginRight: 6 }} />
              <Text style={[styles.userSubTabText, userSubTab === "students" && styles.userSubTabTextActive]}>
                Students ({usersList.students?.length || 0})
              </Text>
            </TouchableOpacity>
          </View>

          {/* STAFF LIST */}
          {userSubTab === "staff" && (
            <>
              <View style={styles.catalogTopBar}>
                <Text style={styles.catalogSectionTitle}>Authorized Accounts</Text>
                <TouchableOpacity
                  style={styles.addUniformBtn}
                  onPress={() => {
                    setNewStaffName("");
                    setNewStaffUsername("");
                    setNewStaffEmail("");
                    setNewStaffRole("Store Staff");
                    setNewStaffStation("Counter 01");
                    setNewStaffPassword("Staff2026!");
                    setStaffModalVisible(true);
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="person-add" size={16} color="#fff" />
                  <Text style={styles.addUniformBtnText}>Add Account</Text>
                </TouchableOpacity>
              </View>

              {usersList.staff?.map((st) => (
                <View key={st.id} style={styles.userCard}>
                  <View style={styles.userCardHeader}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>
                        {st.full_name ? st.full_name.charAt(0).toUpperCase() : "S"}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={styles.userNameText}>{st.full_name}</Text>
                        <View style={[styles.roleBadge, st.role === "Super Admin" ? styles.roleBadgeAdmin : styles.roleBadgeStaff]}>
                          <Text style={[styles.roleBadgeText, st.role === "Super Admin" ? styles.roleTextAdmin : styles.roleTextStaff]}>
                            {st.role === "Super Admin" ? "👑 Admin" : st.role}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.userSubText}>
                        @{st.username} • {st.station || "Counter"}
                      </Text>
                    </View>

                    <View style={[styles.statusDot, st.is_active == 1 ? styles.statusActive : styles.statusInactive]} />
                  </View>

                  <View style={styles.userCardActions}>
                    <TouchableOpacity style={styles.userActionBtn} onPress={() => handleResetStaffPassword(st)}>
                      <Ionicons name="key-outline" size={15} color={OC_GREEN} />
                      <Text style={styles.userActionText}>Reset PW</Text>
                    </TouchableOpacity>
                    {st.username !== "admin" && (
                      <TouchableOpacity
                        style={[styles.userActionBtn, { borderColor: st.is_active == 1 ? "#fecaca" : "#bbf7d0" }]}
                        onPress={() => handleToggleStaffActive(st)}
                      >
                        <Ionicons
                          name={st.is_active == 1 ? "ban-outline" : "checkmark-circle-outline"}
                          size={15}
                          color={st.is_active == 1 ? "#dc2626" : "#16a34a"}
                        />
                        <Text style={[styles.userActionText, { color: st.is_active == 1 ? "#dc2626" : "#16a34a" }]}>
                          {st.is_active == 1 ? "Deactivate" : "Activate"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </>
          )}

          {/* STUDENTS LIST */}
          {userSubTab === "students" && (
            <>
              <Text style={[styles.catalogSectionTitle, { marginBottom: 12 }]}>Registered Students</Text>
              {usersList.students?.map((s) => (
                <View key={s.id} style={styles.userCard}>
                  <View style={styles.userCardHeader}>
                    <View style={[styles.userAvatar, { backgroundColor: "#377445" }]}>
                      <Text style={styles.userAvatarText}>{s.first_name ? s.first_name.charAt(0) : "S"}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.userNameText}>{s.first_name} {s.last_name}</Text>
                      <Text style={styles.userSubText}>ID: {s.student_id} • {s.department || "College"}</Text>
                      <Text style={[styles.userSubText, { color: "#555" }]}>{s.course_strand} ({s.year_level})</Text>
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB 1: LOOKUP & RELEASING */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === "scan" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: Math.max(insets.bottom, 24) + 60 }]}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[OC_GREEN]} />}
        >
          {/* Camera QR Scanner Banner */}
          <TouchableOpacity
            style={styles.scanBanner}
            onPress={openCameraScanner}
            activeOpacity={0.88}
          >
            <View style={styles.scanBannerIconWrap}>
              <Ionicons name="qr-code-outline" size={26} color="#ffffff" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.scanBannerTitle}>Scan Student QR Ticket</Text>
              <Text style={styles.scanBannerSub}>Open camera to quickly find and release order</Text>
            </View>
            <View style={styles.scanBannerBtnPill}>
              <Ionicons name="camera" size={16} color={OC_GREEN} />
              <Text style={styles.scanBannerBtnText}>Scan</Text>
            </View>
          </TouchableOpacity>

          {/* Search Box */}
          <View style={styles.searchCard}>
            <Text style={styles.cardHeading}>Or Enter Order Code / Student ID</Text>
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="e.g. OL-1042 or 232C-0018"
                placeholderTextColor="#999"
                value={searchCode}
                onChangeText={setSearchCode}
                autoCapitalize="characters"
                onSubmitEditing={() => handleLookup()}
              />
              <TouchableOpacity
                style={styles.inlineScanBtn}
                onPress={openCameraScanner}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="qr-code" size={20} color={OC_GREEN} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.findBtn} onPress={() => handleLookup()} disabled={searching}>
                {searching ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="search" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            {/* Quick Active Orders */}
            {orders.length > 0 && (
              <>
                <Text style={styles.quickPresetTitle}>ACTIVE ORDERS FOR RELEASE:</Text>
                <View style={styles.presetRow}>
                  {orders.slice(0, 5).map((o) => (
                    <TouchableOpacity
                      key={o.id}
                      style={styles.presetChip}
                      onPress={() => selectOrder(o)}
                    >
                      <Text style={styles.presetText}>
                        {o.order_code} • {o.first_name || o.student_id}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
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
                  <Text style={styles.schedVal}>{selectedOrder.time_slot || "08:00 AM - 05:00 PM"}</Text>
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
                Enter an order code or student ID above, or pick an order from the Queue tab to verify and release uniform items.
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[OC_GREEN]} />}
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
          {orders.filter((o) => (queueFilter === "All" ? true : o.status === queueFilter)).length === 0 ? (
            <View style={styles.emptyStateBox}>
              <Ionicons name="receipt-outline" size={54} color="#ccc" />
              <Text style={styles.emptyStateTitle}>No {queueFilter === "All" ? "" : queueFilter} Orders Found</Text>
              <Text style={styles.emptyStateDesc}>
                There are no orders matching this status right now. Pull down to refresh.
              </Text>
            </View>
          ) : (
            orders
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
            ))
          )}
        </ScrollView>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB 3: STOCKS & INVENTORY */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === "inventory" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: Math.max(insets.bottom, 24) + 60 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[OC_GREEN]} />}
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
                    onPress={() => adjustStock(item.id, "subtract", 1)}
                  >
                    <Text style={styles.stockBtnText}>-1</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.stockBtn}
                    onPress={() => adjustStock(item.id, "add", 1)}
                  >
                    <Text style={styles.stockBtnText}>+1</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.stockBtn}
                    onPress={() => adjustStock(item.id, "add", 5)}
                  >
                    <Text style={styles.stockBtnText}>+5</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODAL: ADD / EDIT UNIFORM PRODUCT */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Modal visible={productModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingProduct ? "Edit Uniform" : "Add New Uniform"}</Text>
              <TouchableOpacity onPress={() => setProductModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 520 }} keyboardShouldPersistTaps="handled">
              {/* ── UNIFORM PHOTO SELECTOR ── */}
              <Text style={styles.inputLabel}>Uniform Photo / Image</Text>
              <View style={styles.imagePickerCard}>
                {prodImageUrl ? (
                  <View style={styles.imagePreviewRow}>
                    <Image
                      source={{ uri: prodImageUrl }}
                      style={styles.imagePreviewBox}
                      resizeMode="cover"
                    />
                    <View style={{ flex: 1, marginLeft: 12, justifyContent: "center" }}>
                      <TouchableOpacity
                        style={styles.changeImageBtn}
                        onPress={handlePickImage}
                        disabled={uploadingImage}
                      >
                        <Ionicons name="camera-reverse-outline" size={16} color="#fff" />
                        <Text style={styles.changeImageBtnText}>
                          {uploadingImage ? "Uploading..." : "Change Photo"}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeImageBtn}
                        onPress={() => setProdImageUrl("")}
                        disabled={uploadingImage}
                      >
                        <Ionicons name="trash-outline" size={14} color="#dc2626" />
                        <Text style={styles.removeImageBtnText}>Remove Photo</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.imageUploadPlaceholder}
                    onPress={handlePickImage}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <View style={{ alignItems: "center" }}>
                        <ActivityIndicator size="small" color={OC_GREEN} />
                        <Text style={[styles.uploadPlaceholderSub, { marginTop: 6 }]}>Uploading photo...</Text>
                      </View>
                    ) : (
                      <>
                        <Ionicons name="camera-outline" size={30} color={OC_GREEN} />
                        <Text style={styles.uploadPlaceholderText}>Choose Photo from Gallery</Text>
                        <Text style={styles.uploadPlaceholderSub}>Tap to browse photos</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {/* Direct Image URL input */}
                <Text style={[styles.inputLabel, { marginTop: 8, fontSize: 11, color: "#6b7280" }]}>
                  Or Paste Image URL directly:
                </Text>
                <TextInput
                  style={[styles.modalInput, { marginBottom: 2, fontSize: 12, paddingVertical: 7 }]}
                  placeholder="https://... or choose photo above"
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  value={prodImageUrl}
                  onChangeText={setProdImageUrl}
                />
              </View>

              <Text style={styles.inputLabel}>Uniform / Item Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. BSN Nursing White Duty Top"
                placeholderTextColor="#999"
                value={prodName}
                onChangeText={setProdName}
              />

              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Price (₱) *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="385.00"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    value={prodPrice}
                    onChangeText={setProdPrice}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Stock Quantity *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="50"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    value={prodStock}
                    onChangeText={setProdStock}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Department</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {["College", "Senior High", "Junior High", "Elementary", "Kindergarten", "All"].map((dept) => (
                  <TouchableOpacity
                    key={dept}
                    style={[styles.modalChoicePill, prodDept === dept && styles.modalChoicePillActive]}
                    onPress={() => setProdDept(dept)}
                  >
                    <Text style={[styles.modalChoiceText, prodDept === dept && styles.modalChoiceTextActive]}>
                      {dept}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {["Tops", "Bottoms", "PE wear", "Accessories"].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.modalChoicePill, prodCategory === cat && styles.modalChoicePillActive]}
                    onPress={() => setProdCategory(cat)}
                  >
                    <Text style={[styles.modalChoiceText, prodCategory === cat && styles.modalChoiceTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>Course / Strand (or 'All')</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. BSN, BSIT, STEM, or All"
                placeholderTextColor="#999"
                value={prodCourse}
                onChangeText={setProdCourse}
              />

              <Text style={styles.inputLabel}>Available Sizes (comma-separated)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="XS,S,M,L,XL,XXL or 24,26,28,30"
                placeholderTextColor="#999"
                value={prodSizes}
                onChangeText={setProdSizes}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setProductModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, savingProduct && { opacity: 0.7 }]}
                onPress={handleSaveProduct}
                disabled={savingProduct}
              >
                {savingProduct ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalSubmitText}>{editingProduct ? "Save Changes" : "Create Item"}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODAL: ADD STAFF ACCOUNT */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Modal visible={staffModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Staff / Admin Account</Text>
              <TouchableOpacity onPress={() => setStaffModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440 }} keyboardShouldPersistTaps="handled">
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Maria Santos"
                placeholderTextColor="#999"
                value={newStaffName}
                onChangeText={setNewStaffName}
              />

              <Text style={styles.inputLabel}>Username *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. staff_maria"
                placeholderTextColor="#999"
                autoCapitalize="none"
                value={newStaffUsername}
                onChangeText={setNewStaffUsername}
              />

              <Text style={styles.inputLabel}>Role</Text>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
                {["Store Staff", "Cashier", "Super Admin"].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.modalChoicePill, newStaffRole === r && styles.modalChoicePillActive]}
                    onPress={() => setNewStaffRole(r)}
                  >
                    <Text style={[styles.modalChoiceText, newStaffRole === r && styles.modalChoiceTextActive]}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Counter Station / Location</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Counter 01 or Main Office"
                placeholderTextColor="#999"
                value={newStaffStation}
                onChangeText={setNewStaffStation}
              />

              <Text style={styles.inputLabel}>Temporary Password</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Staff2026!"
                placeholderTextColor="#999"
                value={newStaffPassword}
                onChangeText={setNewStaffPassword}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setStaffModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, savingStaff && { opacity: 0.7 }]}
                onPress={handleSaveStaff}
                disabled={savingStaff}
              >
                {savingStaff ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalSubmitText}>Create Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODAL: CAMERA QR SCANNER */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Modal
        visible={cameraModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setCameraModalVisible(false)}
      >
        <SafeAreaView style={styles.scannerSafeArea}>
          <StatusBar barStyle="light-content" backgroundColor="#000000" />

          {/* Scanner Header */}
          <View style={styles.scannerTopBar}>
            <TouchableOpacity
              style={styles.scannerCloseBtn}
              onPress={() => setCameraModalVisible(false)}
            >
              <Ionicons name="close" size={26} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.scannerTopTitle}>Scan Student QR Ticket</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Camera Viewfinder */}
          <View style={styles.cameraContainer}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
              onBarcodeScanned={handleBarCodeScanned}
            />

            {/* Viewfinder Target Frame Overlay */}
            <View style={styles.scannerOverlay}>
              <View style={styles.targetFrame}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
              </View>
              <Text style={styles.scannerHintText}>
                Point camera at student's QR code
              </Text>
            </View>
          </View>

          {/* Bottom Bar */}
          <View style={styles.scannerBottomBar}>
            <TouchableOpacity
              style={styles.scannerCancelBtn}
              onPress={() => setCameraModalVisible(false)}
            >
              <Text style={styles.scannerCancelBtnText}>Close Scanner</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
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
    flexGrow: 1,
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginHorizontal: 2,
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
  // Executive Overview styles
  execRevenueCard: {
    backgroundColor: OC_GREEN,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  execRevHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  execRevSub: {
    fontSize: 11,
    fontWeight: "800",
    color: OC_GOLD,
    letterSpacing: 1,
    marginBottom: 4,
  },
  execRevAmount: {
    fontSize: 28,
    fontWeight: "900",
    color: "#ffffff",
  },
  execBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  execBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
  },
  execRevDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginVertical: 14,
  },
  execRevFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  execRevFootLabel: {
    fontSize: 11,
    color: "#e5e7eb",
    fontWeight: "600",
    marginBottom: 2,
  },
  execRevFootVal: {
    fontSize: 16,
    fontWeight: "800",
    color: "#ffffff",
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  kpiBox: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111827",
    marginTop: 8,
  },
  kpiLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
    marginTop: 2,
  },
  alertCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#fde68a",
    padding: 16,
    marginBottom: 20,
  },
  alertCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  alertCardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#92400e",
  },
  alertRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#fef3c7",
  },
  alertItemName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1f2937",
  },
  alertItemSub: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockLowBadge: {
    backgroundColor: "#fef3c7",
  },
  stockOutBadge: {
    backgroundColor: "#fee2e2",
  },
  stockBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  textStockLow: {
    color: "#b45309",
  },
  textStockOut: {
    color: "#dc2626",
  },
  alertEmpty: {
    fontSize: 12,
    color: "#6b7280",
    fontStyle: "italic",
    paddingVertical: 8,
  },
  desktopGuidanceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#a7f3d0",
    padding: 16,
    marginBottom: 24,
  },
  guidanceTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: OC_GREEN,
    marginBottom: 2,
  },
  guidanceDesc: {
    fontSize: 11,
    color: "#065f46",
    lineHeight: 16,
    marginBottom: 4,
  },
  guidanceLink: {
    fontSize: 11,
    fontWeight: "800",
    color: "#047857",
  },
  // Tab Bar Scroll Wrapper
  tabBarWrapper: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tabBarScroll: {
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  // Catalog Styles
  catalogTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  catalogSectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  catalogSectionSub: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 1,
  },
  addUniformBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: OC_GREEN,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
    elevation: 2,
  },
  addUniformBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  catalogSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  catalogSearchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111",
  },
  filterPill: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  filterPillActive: {
    backgroundColor: "#ecfdf5",
    borderColor: OC_GREEN,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4b5563",
  },
  filterPillTextActive: {
    color: OC_GREEN,
    fontWeight: "800",
  },
  catalogCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 10,
  },
  catalogCardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  deptBadge: {
    fontSize: 10,
    fontWeight: "800",
    backgroundColor: "#e0f2fe",
    color: "#0369a1",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  catBadge: {
    fontSize: 10,
    fontWeight: "800",
    backgroundColor: "#fef3c7",
    color: "#b45309",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  courseBadge: {
    fontSize: 10,
    fontWeight: "800",
    backgroundColor: "#f3e8ff",
    color: "#7e22ce",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  catalogItemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 3,
  },
  catalogItemPrice: {
    fontSize: 13,
    fontWeight: "800",
    color: OC_GREEN,
  },
  catalogSizesText: {
    fontSize: 11,
    fontWeight: "normal",
    color: "#6b7280",
  },
  catalogStockCol: {
    alignItems: "center",
    minWidth: 50,
  },
  catalogStockNum: {
    fontSize: 18,
    fontWeight: "900",
    color: "#059669",
  },
  catalogStockLabel: {
    fontSize: 10,
    color: "#6b7280",
  },
  catalogActionsRow: {
    flexDirection: "row",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 8,
  },
  catActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 4,
  },
  catActionText: {
    fontSize: 11,
    fontWeight: "700",
    color: OC_GREEN,
  },
  // Users Tab
  userSubTabBar: {
    flexDirection: "row",
    backgroundColor: "#e5e7eb",
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  userSubTabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
  },
  userSubTabBtnActive: {
    backgroundColor: OC_GREEN,
  },
  userSubTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4b5563",
  },
  userSubTabTextActive: {
    color: "#ffffff",
    fontWeight: "800",
  },
  userCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 10,
  },
  userCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: OC_GREEN,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  userAvatarText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
  userNameText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  userSubText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeAdmin: {
    backgroundColor: "#fef3c7",
  },
  roleBadgeStaff: {
    backgroundColor: "#ecfdf5",
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  roleTextAdmin: {
    color: "#b45309",
  },
  roleTextStaff: {
    color: OC_GREEN,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: "#22c55e",
  },
  statusInactive: {
    backgroundColor: "#dc2626",
  },
  userCardActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  userActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 4,
  },
  userActionText: {
    fontSize: 11,
    fontWeight: "700",
    color: OC_GREEN,
  },
  // Modal Sheet Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
    marginTop: 4,
  },
  modalInput: {
    backgroundColor: "#f9fafb",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: "#111",
    marginBottom: 12,
  },
  modalChoicePill: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  modalChoicePillActive: {
    backgroundColor: "#ecfdf5",
    borderColor: OC_GREEN,
  },
  modalChoiceText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4b5563",
  },
  modalChoiceTextActive: {
    color: OC_GREEN,
    fontWeight: "800",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4b5563",
  },
  modalSubmitBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: OC_GREEN,
    alignItems: "center",
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
  },
  // Uniform Thumbnail in Catalog Card
  catalogThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: "#f3f4f6",
  },
  catalogThumbPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  // Modal Image Picker Card
  imagePickerCard: {
    backgroundColor: "#f9fafb",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  imagePreviewRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  imagePreviewBox: {
    width: 76,
    height: 76,
    borderRadius: 10,
    backgroundColor: "#e5e7eb",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  changeImageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: OC_GREEN,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  changeImageBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  removeImageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  removeImageBtnText: {
    color: "#dc2626",
    fontSize: 11,
    fontWeight: "600",
  },
  imageUploadPlaceholder: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: OC_GREEN,
    backgroundColor: "#ecfdf5",
    borderRadius: 10,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadPlaceholderText: {
    fontSize: 13,
    fontWeight: "700",
    color: OC_GREEN,
    marginTop: 6,
  },
  uploadPlaceholderSub: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },
  // ── Camera QR Scanner Styles ──
  scanBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: OC_GREEN,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: OC_GREEN,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  scanBannerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  scanBannerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ffffff",
  },
  scanBannerSub: {
    fontSize: 12,
    color: "#d1fae5",
    marginTop: 2,
  },
  scanBannerBtnPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ffffff",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  scanBannerBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: OC_GREEN,
  },
  inlineScanBtn: {
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  scannerSafeArea: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scannerTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#000000",
  },
  scannerCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  scannerTopTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#ffffff",
  },
  cameraContainer: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  targetFrame: {
    width: 250,
    height: 250,
    position: "relative",
    backgroundColor: "transparent",
  },
  corner: {
    position: "absolute",
    width: 32,
    height: 32,
    borderColor: "#ffffff",
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  scannerHintText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 28,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    textAlign: "center",
  },
  scannerBottomBar: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: "#000000",
    alignItems: "center",
  },
  scannerCancelBtn: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  scannerCancelBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});


