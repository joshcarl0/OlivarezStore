import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const OC_GREEN = "#1a5c2e";
const OC_GOLD = "#c9a84c";

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (!email.trim()) { Alert.alert("Required", "Please enter your OC email."); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert("Email Sent", `Password reset instructions sent to ${email}@olivarezcollege.edu.ph`, [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    }, 1500);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: OC_GREEN }}>
      <View style={styles.header}>
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.sub}>Enter your OC email to reset your password</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>OC Email Address</Text>
        <View style={styles.emailWrapper}>
          <TextInput
            style={styles.emailInput}
            value={email}
            onChangeText={setEmail}
            placeholder="yourname"
            placeholderTextColor="#aaa"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Text style={styles.domain}>@olivarezcollege.edu.ph</Text>
        </View>
        <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send Reset Link</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  header: { backgroundColor: OC_GREEN, alignItems: "center", paddingTop: 40, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: "800", color: "#fff" },
  sub: { fontSize: 13, color: OC_GOLD, marginTop: 6, textAlign: "center", paddingHorizontal: 24 },
  card: { flex: 1, backgroundColor: "#f7f7f7", borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 28 },
  label: { fontSize: 13, fontWeight: "600", color: "#333", marginBottom: 8 },
  emailWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, borderWidth: 1.5, borderColor: "#e0e0e0" },
  emailInput: { flex: 1, paddingVertical: 14, paddingHorizontal: 16, fontSize: 15, color: "#222" },
  domain: { fontSize: 11, color: "#999", paddingRight: 10 },
  btn: { backgroundColor: OC_GREEN, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 24, elevation: 4 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  backBtn: { alignItems: "center", marginTop: 20 },
  backText: { fontSize: 13, color: OC_GOLD, fontWeight: "600" },
});
