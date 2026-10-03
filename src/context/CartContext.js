import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);

  // Load saved cart and orders on mount
  useEffect(() => {
    (async () => {
      try {
        const savedCart = await AsyncStorage.getItem("user_cart");
        if (savedCart) setCart(JSON.parse(savedCart));

        const savedOrders = await AsyncStorage.getItem("user_orders");
        if (savedOrders) {
          const parsed = JSON.parse(savedOrders);
          if (parsed && parsed.length > 0) setOrders(parsed);
        }
      } catch (_) {
        // silently ignore
      }
    })();
  }, []);

  // Persist cart changes
  const saveCart = async (newCart) => {
    setCart(newCart);
    try {
      await AsyncStorage.setItem("user_cart", JSON.stringify(newCart));
    } catch (_) {
        // silently ignore
      }
  };

  const addToCart = (product, size, quantity = 1) => {
    const itemKey = `${product.id}_${size || "Standard"}`;
    const existingIndex = cart.findIndex((item) => item.cartKey === itemKey);

    let updatedCart;
    if (existingIndex > -1) {
      updatedCart = [...cart];
      updatedCart[existingIndex].quantity += quantity;
    } else {
      updatedCart = [
        ...cart,
        {
          cartKey: itemKey,
          id: product.id,
          name: product.name,
          category: product.category,
          price: parseFloat(product.price),
          size: size || "Standard",
          quantity,
          image_url: product.image_url,
          description: product.description,
        },
      ];
    }
    saveCart(updatedCart);
  };

  const updateQuantity = (cartKey, newQty) => {
    if (newQty <= 0) {
      removeFromCart(cartKey);
      return;
    }
    const updated = cart.map((item) =>
      item.cartKey === cartKey ? { ...item, quantity: newQty } : item
    );
    saveCart(updated);
  };

  const removeFromCart = (cartKey) => {
    const updated = cart.filter((item) => item.cartKey !== cartKey);
    saveCart(updated);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const addOrder = async (orderData) => {
    const newOrders = [orderData, ...orders];
    setOrders(newOrders);
    try {
      await AsyncStorage.setItem("user_orders", JSON.stringify(newOrders));
    } catch (_) {
      // silently ignore
    }
  };

  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalCount,
        totalPrice,
        orders,
        addOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
