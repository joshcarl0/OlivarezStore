import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../config/supabaseClient";
import { ENDPOINTS, apiPost, resolveUserProfile } from "../config/api";
import {
  KEY_AUTH_TOKEN,
  KEY_STUDENT_INFO,
  clearFailedAttempts,
  isSessionExpired,
  secureLogout,
  touchSession,
} from "../utils/security";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const idleTimerRef = useRef(null);

  const syncFromStorage = useCallback(async () => {
    try {
      const [storedToken, storedInfoStr, { data: sessionData }] = await Promise.all([
        AsyncStorage.getItem(KEY_AUTH_TOKEN),
        AsyncStorage.getItem(KEY_STUDENT_INFO),
        supabase.auth.getSession(),
      ]);

      const activeSbSession = sessionData?.session || null;
      let parsedUser = null;
      if (storedInfoStr) {
        try {
          parsedUser = JSON.parse(storedInfoStr);
        } catch (_) {}
      }

      if (activeSbSession && !parsedUser) {
        const resolved = await resolveUserProfile(
          activeSbSession.user?.email,
          activeSbSession.user
        );
        if (resolved?.profile) {
          parsedUser = resolved.profile;
          await AsyncStorage.setItem(KEY_STUDENT_INFO, JSON.stringify(parsedUser));
        }
      }

      const effectiveToken = activeSbSession?.access_token || storedToken || null;
      if (activeSbSession?.access_token && storedToken !== activeSbSession.access_token) {
        await AsyncStorage.setItem(KEY_AUTH_TOKEN, activeSbSession.access_token);
      }

      setSession(activeSbSession);
      setToken(effectiveToken);
      setUser(effectiveToken ? parsedUser : null);
      return { session: activeSbSession, token: effectiveToken, user: effectiveToken ? parsedUser : null };
    } catch (err) {
      console.warn("AuthContext sync error:", err);
      return { session: null, token: null, user: null };
    }
  }, []);

  // Initial session hydration & Supabase Auth listener
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const expired = await isSessionExpired();
        if (expired) {
          await secureLogout();
          if (mounted) {
            setSession(null);
            setToken(null);
            setUser(null);
            setLoading(false);
          }
          return;
        }

        await syncFromStorage();
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, nextSession) => {
        if (!mounted) return;

        if (event === "SIGNED_OUT") {
          setSession(null);
          setToken(null);
          setUser(null);
          return;
        }

        if (nextSession) {
          setSession(nextSession);
          setToken(nextSession.access_token);
          await AsyncStorage.setItem(KEY_AUTH_TOKEN, nextSession.access_token);

          const storedStr = await AsyncStorage.getItem(KEY_STUDENT_INFO);
          if (storedStr) {
            try {
              setUser(JSON.parse(storedStr));
              return;
            } catch (_) {}
          }

          const resolved = await resolveUserProfile(
            nextSession.user?.email,
            nextSession.user
          );
          if (resolved?.profile && mounted) {
            setUser(resolved.profile);
            await AsyncStorage.setItem(KEY_STUDENT_INFO, JSON.stringify(resolved.profile));
          }
        }
      }
    );

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe?.();
    };
  }, [syncFromStorage]);

  // Idle session expiration monitor
  const isAuthed = Boolean((session?.access_token || token) && user);

  useEffect(() => {
    clearInterval(idleTimerRef.current);
    if (!isAuthed) return;

    idleTimerRef.current = setInterval(async () => {
      const expired = await isSessionExpired();
      if (expired) {
        clearInterval(idleTimerRef.current);
        await secureLogout();
        setSession(null);
        setToken(null);
        setUser(null);
      }
    }, 60_000);

    return () => clearInterval(idleTimerRef.current);
  }, [isAuthed]);

  const signIn = useCallback(async (identifier, password) => {
    const res = await apiPost(ENDPOINTS.login, {
      identifier,
      email: identifier,
      password,
    });

    if (res.success && res.data) {
      const nextToken = res.data.token;
      const nextUser = res.data.student || res.data.user;
      const nextSession = res.data.session || null;

      await clearFailedAttempts();
      await AsyncStorage.setItem(KEY_AUTH_TOKEN, nextToken);
      await AsyncStorage.setItem(KEY_STUDENT_INFO, JSON.stringify(nextUser));
      await touchSession();

      setSession(nextSession);
      setToken(nextToken);
      setUser(nextUser);
    }

    return res;
  }, []);

  const signUp = useCallback(async (payload) => {
    return apiPost(ENDPOINTS.register, payload);
  }, []);

  const signOut = useCallback(async () => {
    await secureLogout();
    setSession(null);
    setToken(null);
    setUser(null);
  }, []);

  const resetPassword = useCallback(async (emailOrId) => {
    return apiPost(ENDPOINTS.forgotPassword, { email: emailOrId, identifier: emailOrId });
  }, []);

  const role = user?.role || "Student";
  const isStaffOrAdmin =
    role === "Store Staff" || role === "Super Admin" || role === "Cashier";
  const isSuperAdmin = role === "Super Admin";

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        token,
        role,
        loading,
        isAuthenticated: isAuthed,
        isStaffOrAdmin,
        isSuperAdmin,
        signIn,
        signUp,
        signOut,
        resetPassword,
        syncFromStorage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
