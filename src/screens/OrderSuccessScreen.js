import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const OC_GREEN = "#164e28";
const OC_GOLD = "#e5a823";

export default function OrderSuccessScreen({ navigation, route }) {
  const { order } = route.params || {};

  const orderId = order?.orderId || "OL-1042";
  const pickupDate = order?.date || "Tue, Sep 22 • 9:00 AM";
  const itemsText = order?.details || "2 blouses, 1 skirt, 1 ID lace";
  const paidText = `₱${(order?.total || 2425).toFixed(2)} via ${order?.paymentMethod || "Hello Money"}`;
  const currentStep = order?.step || 1; // 1: Placed, 2: Packing, 3: Ready, 4: Claimed

  const handleSaveTicket = () => {
    Alert.alert("Saved! 📸", "Ticket receipt saved to your photo gallery for easy presentation at Window 2.");
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
        contentContainerStyle={styles.scrollContent}
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
        <View style={styles.ticketCard}>
          {/* Top section: QR Code & ID */}
          <View style={styles.ticketTop}>
            <View style={styles.qrContainer}>
              <MaterialCommunityIcons name="qrcode" size={170} color="#1c2833" />
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
          style={styles.saveBtn}
          onPress={handleSaveTicket}
        >
          <Text style={styles.saveBtnText}>Save ticket to photos</Text>
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
    backgroundColor: OC_GOLD,
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
    backgroundColor: OC_GOLD,
  },
  stepDotCurrent: {
    backgroundColor: OC_GOLD,
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
    color: "#ffffff",
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
