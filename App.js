import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ActivityIndicator, View } from "react-native";

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
import { isAuthenticated, isSessionExpired, secureLogout } from "./src/utils/security";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null); // null = loading

  // ── Determine initial route based on stored auth token ──
  useEffect(() => {
    (async () => {
      try {
        const authenticated = await isAuthenticated();
        if (authenticated) {
          const expired = await isSessionExpired();
          if (expired) {
            await secureLogout();
            setInitialRoute("Login");
          } else {
            const studentInfoStr = await AsyncStorage.getItem("student_info");
            const studentInfo = studentInfoStr ? JSON.parse(studentInfoStr) : null;
            if (studentInfo?.role === "Store Staff" || studentInfo?.role === "Super Admin") {
              setInitialRoute("StaffDashboard");
            } else {
              setInitialRoute("Home");
            }
          }
        } else {
          setInitialRoute("Login");
        }
      } catch {
        setInitialRoute("Login");
      }
    })();
  }, []);

  // Show a blank loading screen while checking auth state
  if (initialRoute === null) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#1a5c2e" }}>
          <ActivityIndicator size="large" color="#c9a84c" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <CartProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName={initialRoute}
            screenOptions={{ headerShown: false, animation: "slide_from_right" }}
          >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Shop" component={ShopScreen} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
            <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
            <Stack.Screen name="Orders" component={OrdersScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="StaffDashboard" component={StaffDashboardScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </CartProvider>
    </SafeAreaProvider>
  );
}
