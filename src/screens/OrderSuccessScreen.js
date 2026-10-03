import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

const OC_GREEN = "#0F5D33";
const OC_GOLD = "#FBEBB8";
const OC_SECONDARY_GREEN = "#377445";

export default function OrderSuccessScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { order } = route.params || {};
  const ticketRef = useRef(null);
  const [saving, setSaving] = useState(false);

  const orderId = order?.orderId || "OL-1042";
  const pickupDate = order?.date || "Tue, Sep 22 • 9:00 AM";
  const itemsText = order?.details || "2 blouses, 1 skirt, 1 ID lace";
  const paidText = `₱${(order?.total || 2425).toFixed(2)} via ${order?.paymentMethod || "Hello Money"}`;
  const currentStep = order?.step || 1; // 1: Placed, 2: Packing, 3: Ready, 4: Claimed

  const handleSaveTicket = async () => {
    try {
      setSaving(true);

      // Build HTML for the PDF ticket
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <style>
              body {
                font-family: Arial, sans-serif;
                background: #f0f4f0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                padding: 20px;
                box-sizing: border-box;
              }
              .ticket {
                background: #ffffff;
                border-radius: 20px;
                width: 100%;
                max-width: 400px;
                overflow: hidden;
                box-shadow: 0 8px 24px rgba(0,0,0,0.15);
              }
              .ticket-header {
                background: #0F5D33;
                padding: 20px 24px;
                display: flex;
                align-items: center;
                gap: 14px;
              }
              .check-circle {
                width: 44px;
                height: 44px;
                border-radius: 50%;
                background: #FBEBB8;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 22px;
                flex-shrink: 0;
              }
              .header-text h2 {
                color: #ffffff;
                margin: 0;
                font-size: 20px;
              }
              .header-text p {
                color: #b4d8be;
                margin: 4px 0 0;
                font-size: 13px;
              }
              .ticket-top {
                text-align: center;
                padding: 28px 20px 20px;
                border-bottom: 2px dashed #ced4da;
              }
              .qr-box {
                width: 150px;
                height: 150px;
                border: 1px solid #e9ecef;
                border-radius: 12px;
                margin: 0 auto 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 90px;
                line-height: 1;
              }
              .order-id {
                font-size: 28px;
                font-weight: 900;
                color: #1c2833;
                letter-spacing: 1px;
              }
              .pickup-time {
                font-size: 14px;
                font-weight: 700;
                color: #1a5c2e;
                margin-top: 4px;
              }
              .ticket-bottom {
                padding: 20px 24px;
              }
              .detail-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 12px;
                font-size: 13px;
              }
              .detail-label { color: #6c757d; }
              .detail-value { font-weight: 700; color: #1c2833; text-align: right; max-width: 60%; }
              .footer-note {
                background: #f0f7f2;
                padding: 12px 24px;
                text-align: center;
                font-size: 12px;
                color: #0F5D33;
                font-weight: 600;
              }
            </style>
          </head>
          <body>
            <div class="ticket">
              <div class="ticket-header">
                <div class="check-circle">✓</div>
                <div class="header-text">
                  <h2>Order Placed</h2>
                  <p>Show this ticket at Window 2</p>
                </div>
              </div>
              <div class="ticket-top">
                <div class="qr-box">▦</div>
                <div class="order-id">${orderId}</div>
                <div class="pickup-time">${pickupDate}</div>
              </div>
              <div class="ticket-bottom">
                <div class="detail-row">
                  <span class="detail-label">Items</span>
                  <span class="detail-value">${itemsText}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Paid</span>
                  <span class="detail-value">${paidText}</span>
                </div>
              </div>
              <div class="footer-note">🎓 Olivarez College — Official Pickup Ticket</div>
            </div>
          </body>
        </html>
      `;

      // Generate PDF
      const { uri } = await Print.printToFileAsync({ html, base64: false });

      // Share / Save the PDF
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Save your pickup ticket",
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("PDF Ready", `Ticket saved to: ${uri}`);
      }
    } catch (err) {
      console.error("Error generating ticket PDF:", err?.message || err);
      Alert.alert("Error", "Hindi ma-generate ang PDF ticket. Subukan ulit.");
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { title: "Placed", stepNum: 1 },
    { title: "Packing", stepNum: 2 },
    { title: "Ready", stepNum: 3 },
    { title: "Claimed", stepNum: 4 },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={OC_GREEN} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── TOP HEADER ── */}
        <View style={styles.header}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={26} color={OC_GREEN} />
          </View>
          <View style={{ marginLeft: 14 }}>
            <Text style={styles.headerTitle}>Order placed</Text>
            <Text style={styles.headerSub}>Show this ticket at Window 2</Text>
          </View>
        </View>

        {/* ── TICKET CARD ── */}
        <View ref={ticketRef} collapsable={false} renderToHardwareTextureAndroid={true} style={styles.ticketCard}>
          {/* Top section: QR Code & ID */}
          <View style={styles.ticketTop}>
            <View style={styles.qrContainer}>
              <Image
                source={{
                  uri: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(orderId || "OL-DEMO")}`,
                }}
                style={{ width: 170, height: 170 }}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.orderIdText}>{orderId}</Text>
            <Text style={styles.pickupTimeText}>{pickupDate}</Text>
          </View>

          {/* Perforated divider with cutouts */}
          <View style={styles.perforationRow}>
            <View style={styles.cutoutLeft} />
            <View style={styles.dashedLine} />
            <View style={styles.cutoutRight} />
          </View>

          {/* Bottom section: Details & Stepper */}
          <View style={styles.ticketBottom}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Items</Text>
              <Text style={styles.detailValue} numberOfLines={2}>
                {itemsText}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Paid</Text>
              <Text style={styles.detailValue}>{paidText}</Text>
            </View>

            {/* Stepper Timeline */}
            <View style={styles.timelineContainer}>
              <View style={styles.timelineTrack}>
                <View
                  style={[
                    styles.timelineProgress,
                    { width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` },
                  ]}
                />
              </View>

              <View style={styles.stepsRow}>
                {steps.map((s) => {
                  const isActive = s.stepNum <= currentStep;
                  const isCurrent = s.stepNum === currentStep;
                  return (
                    <View key={s.title} style={styles.stepCol}>
                      <View
                        style={[
                          styles.stepDot,
                          isActive && styles.stepDotActive,
                          isCurrent && styles.stepDotCurrent,
                        ]}
                      />
                      <Text
                        style={[
                          styles.stepLabel,
                          isActive && styles.stepLabelActive,
                        ]}
                      >
                        {s.title}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* ── ACTION BUTTONS ── */}
        <TouchableOpacity
          activeOpacity={0.88}
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          onPress={handleSaveTicket}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={OC_GREEN} />
          ) : (
            <Text style={styles.saveBtnText}>Save ticket as PDF</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backHomeBtn}
          onPress={() => navigation.navigate("Home")}
        >
          <Text style={styles.backHomeText}>Back to home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: OC_GREEN,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 6,
  },
  checkCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: OC_GOLD,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
  },
  headerSub: {
    fontSize: 13,
    color: "#b4d8be",
    marginTop: 2,
  },
  ticketCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 24,
  },
  ticketTop: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 18,
    paddingHorizontal: 16,
  },
  qrContainer: {
    width: 180,
    height: 180,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
    marginBottom: 16,
  },
  orderIdText: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1c2833",
    letterSpacing: 0.5,
  },
  pickupTimeText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a5c2e",
    marginTop: 4,
  },
  // Perforation
  perforationRow: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    height: 24,
  },
  cutoutLeft: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: OC_GREEN,
    position: "absolute",
    left: -12,
    zIndex: 2,
  },
  cutoutRight: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: OC_GREEN,
    position: "absolute",
    right: -12,
    zIndex: 2,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: "#ced4da",
    borderStyle: "dashed",
    marginHorizontal: 18,
  },
  // Ticket bottom
  ticketBottom: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 22,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    alignItems: "flex-start",
  },
  detailLabel: {
    fontSize: 13,
    color: "#6c757d",
    width: 60,
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#1c2833",
    textAlign: "right",
  },
  // Timeline
  timelineContainer: {
    marginTop: 20,
    position: "relative",
  },
  timelineTrack: {
    position: "absolute",
    top: 6,
    left: 20,
    right: 20,
    height: 3,
    backgroundColor: "#e9ecef",
    zIndex: 1,
  },
  timelineProgress: {
    height: 3,
    backgroundColor: OC_SECONDARY_GREEN,
  },
  stepsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 2,
  },
  stepCol: {
    alignItems: "center",
    width: 60,
  },
  stepDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#ced4da",
    borderWidth: 2,
    borderColor: "#ffffff",
    marginBottom: 6,
  },
  stepDotActive: {
    backgroundColor: OC_SECONDARY_GREEN,
  },
  stepDotCurrent: {
    backgroundColor: OC_GREEN,
    transform: [{ scale: 1.2 }],
  },
  stepLabel: {
    fontSize: 11,
    color: "#adb5bd",
    fontWeight: "500",
  },
  stepLabelActive: {
    color: "#1c2833",
    fontWeight: "700",
  },
  // Action buttons
  saveBtn: {
    backgroundColor: OC_GOLD,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnText: {
    color: OC_GREEN,
    fontSize: 16,
    fontWeight: "800",
  },
  backHomeBtn: {
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  backHomeText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
});
