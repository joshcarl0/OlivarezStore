import React from "react";
import { View, Text, ActivityIndicator, StyleSheet, Image, StatusBar } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";

import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen";
import HomeScreen from "./src/screens/HomeScreen";
import ShopScreen from "./src/screens/ShopScreen";
import ProductDetailScreen from "./src/screens/ProductDetailScreen";
import CartScreen from "./src/screens/CartScreen";
import CheckoutScreen from "./src/screens/CheckoutScreen";
import OrderSuccessScreen from "./src/screens/OrderSuccessScreen";
import OrdersScreen from "./src/screens/OrdersScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import StaffDashboardScreen from "./src/screens/StaffDashboardScreen";

import { CartProvider } from "./src/context/CartContext";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { withProtectedRoute } from "./src/components/ProtectedRoute";

const Stack = createNativeStackNavigator();
const OC_GREEN = "#0F5D33";
const OC_GOLD = "#FBEBB8";

// Protected Student & Shared Screens
const ProtectedHomeScreen = withProtectedRoute(HomeScreen);
const ProtectedShopScreen = withProtectedRoute(ShopScreen);
const ProtectedProductDetailScreen = withProtectedRoute(ProductDetailScreen);
const ProtectedCartScreen = withProtectedRoute(CartScreen);
const ProtectedCheckoutScreen = withProtectedRoute(CheckoutScreen);
const ProtectedOrderSuccessScreen = withProtectedRoute(OrderSuccessScreen);
const ProtectedOrdersScreen = withProtectedRoute(OrdersScreen);
const ProtectedProfileScreen = withProtectedRoute(ProfileScreen);

// Role-Protected Staff & Super Admin Screen
const ProtectedStaffDashboardScreen = withProtectedRoute(StaffDashboardScreen, {
  allowedRoles: ["Store Staff", "Super Admin", "Cashier"],
});

function RootNavigator() {
  const { loading, isAuthenticated, isStaffOrAdmin } = useAuth();

  if (loading) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar barStyle="light-content" backgroundColor={OC_GREEN} />
        <Image
          source={require("./assets/OC-LOGO.png")}
          style={styles.splashLogo}
          resizeMode="contain"
        />
        <Text style={styles.splashTitle}>Olivarian Uniform Store</Text>
        <ActivityIndicator size="large" color={OC_GOLD} style={{ marginTop: 18 }} />
      </View>
    );
  }

  const initialRouteName = !isAuthenticated
    ? "Login"
    : isStaffOrAdmin
    ? "StaffDashboard"
    : "Home";

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{ headerShown: false, animation: "slide_from_right" }}
      >
        {/* Public Auth Routes */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

        {/* Protected Authenticated Routes */}
        <Stack.Screen name="Home" component={ProtectedHomeScreen} />
        <Stack.Screen name="Shop" component={ProtectedShopScreen} />
        <Stack.Screen name="ProductDetail" component={ProtectedProductDetailScreen} />
        <Stack.Screen name="Cart" component={ProtectedCartScreen} />
        <Stack.Screen name="Checkout" component={ProtectedCheckoutScreen} />
        <Stack.Screen name="OrderSuccess" component={ProtectedOrderSuccessScreen} />
        <Stack.Screen name="Orders" component={ProtectedOrdersScreen} />
        <Stack.Screen name="Profile" component={ProtectedProfileScreen} />

        {/* Role-Protected Staff / Admin Route */}
        <Stack.Screen name="StaffDashboard" component={ProtectedStaffDashboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <RootNavigator />
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: OC_GREEN,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  splashLogo: {
    width: 88,
    height: 88,
    marginBottom: 12,
  },
  splashTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
});
