import { AppState, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "https://eqsghtvevhxqtcaecbzc.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxc2dodHZldmh4cXRjYWVjYnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3MDI4MjIsImV4cCI6MjEwODI3ODgyMn0.o96xh5RrmP3PUGwV4Dg94nwDvMvZdSC-hFTJ9KIrzqk";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
  },
});

// Automatically refresh the session token when the app is in the foreground on native devices
let appStateSubscription = null;
if (Platform.OS !== "web" && !appStateSubscription) {
  appStateSubscription = AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
