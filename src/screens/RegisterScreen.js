import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ENDPOINTS, apiPost } from "../config/api";

const OC_GREEN   = "#1a5c2e";
const TOTAL_STEPS = 5;

// ─── Progress Bar ─────────────────────────────────────────
function ProgressBar({ step }) {
  return (
    <View style={styles.progressRow}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View key={i} style={[
          styles.progressSegment,
          i < step ? styles.progressActive : styles.progressInactive,
          i < TOTAL_STEPS - 1 && { marginRight: 4 },
        ]} />
      ))}
    </View>
  );
}

function Header({ onBack }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={styles.backIcon}>{"<"}</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Create Account</Text>
      <Image source={require("../../assets/OC-LOGO.png")} style={styles.headerLogo} resizeMode="contain" />
    </View>
  );
}

function Footer({ label, onPress, loading }) {
  return (
    <View style={styles.footer}>
      <TouchableOpacity style={styles.continueBtn} onPress={onPress} disabled={loading} activeOpacity={0.85}>
        {loading ? <ActivityIndicator color="#555" /> : <Text style={styles.continueBtnText}>{label || "Continue"}</Text>}
      </TouchableOpacity>
    </View>
  );
}

// ════════════════════════════════════════════════════════════
// STEP 1 — Enter student info
// ════════════════════════════════════════════════════════════
function Step1({ onContinue }) {
  const [studentId, setStudentId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [emailUser, setEmailUser] = useState("");
  const [idError,   setIdError]   = useState("");
  const [loading,   setLoading]   = useState(false);

  const handleContinue = async () => {
    if (!studentId.trim() || !firstName.trim() || !lastName.trim()) {
      Alert.alert("Required", "Please fill in all fields."); return;
    }
    setLoading(true); setIdError("");
    try {
      const res = await apiPost(ENDPOINTS.verifyStudent, {
        student_id: studentId.trim(),
        first_name: firstName.trim(),
        last_name:  lastName.trim(),
      });
      if (res.success) {
        const cleanUser = emailUser.trim() || studentId.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
        onContinue({
          studentId: studentId.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          emailUser: cleanUser,
          foundStudent: res.data,
        });
      } else {
        setIdError(res.message || "This student ID is already registered.");
      }
    } catch (err) {
      Alert.alert("Connection Error", "Cannot reach the server. Make sure XAMPP is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.stepLabel}>Step 1 of 5</Text>
        <Text style={styles.stepTitle}>{"Create your Olivarian account"}</Text>
        <Text style={styles.stepDesc}>Enter your student details to get started.</Text>

        <Text style={styles.fieldLabel}>Student ID number</Text>
        <TextInput
          style={[styles.input, idError && styles.inputError]}
          placeholder="e.g. 232C-0018"
          placeholderTextColor="#bbb"
          value={studentId}
          onChangeText={(v) => {
            setStudentId(v);
            setIdError("");
            if (!emailUser) setEmailUser(v.toLowerCase().replace(/[^a-z0-9]/g, ""));
          }}
          autoCapitalize="characters"
        />
        {!!idError && (
          <View style={styles.errorRow}>
            <Text style={styles.errorIcon}>{"\u24D8"}</Text>
            <Text style={styles.errorText}>{idError}</Text>
          </View>
        )}

        <Text style={[styles.fieldLabel, { marginTop: 14 }]}>First Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your first name"
          placeholderTextColor="#bbb"
          value={firstName}
          onChangeText={(v) => {
            setFirstName(v);
            if (!emailUser && (v || lastName)) {
              setEmailUser(`${v}.${lastName}`.toLowerCase().replace(/[^a-z0-9.]/g, ""));
            }
          }}
          autoCapitalize="words"
        />

        <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Last Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your last name"
          placeholderTextColor="#bbb"
          value={lastName}
          onChangeText={(v) => {
            setLastName(v);
            if (!emailUser && (firstName || v)) {
              setEmailUser(`${firstName}.${v}`.toLowerCase().replace(/[^a-z0-9.]/g, ""));
            }
          }}
          autoCapitalize="words"
        />

        {/* ── OLIVAREZ COLLEGE INSTITUTIONAL EMAIL ── */}
        <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Olivarez Institutional Email</Text>
        <View style={styles.emailInputWrapper}>
          <TextInput
            style={styles.emailInput}
            placeholder="username or id"
            placeholderTextColor="#bbb"
            value={emailUser}
            onChangeText={setEmailUser}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.emailDomainBadge}>
            <Text style={styles.emailDomain}>@olivarezcollege.edu.ph</Text>
          </View>
        </View>
        <Text style={styles.emailHint}>
          Official student email. You can sign in using this institutional email or your Student ID.
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>{"ⓘ"}</Text>
          <Text style={styles.infoText}>Your ID number is printed on your school ID card.</Text>
        </View>
      </ScrollView>
      <Footer label="Continue" onPress={handleContinue} loading={loading} />
    </>
  );
}

// ════════════════════════════════════════════════════════════
// STEP 2 — Department, Program/Strand, Grade, Gender, & Mobile
// ════════════════════════════════════════════════════════════
const DEPARTMENTS = [
  "Kindergarten",
  "Elementary",
  "Junior High",
  "Senior High",
  "College",
];

// Official Olivarez College Undergraduate Programs
const COLLEGE_PROGRAMS = [
  // CHSE - Health Sciences
  { code: "BSN", name: "BS in Nursing (BSN)", type: "nursing" },
  { code: "BSRT", name: "BS in Radiologic Technology (BSRT)", type: "health" },
  // CCASE - Criminology, Arts & Education
  { code: "BSCrim", name: "BS in Criminology (BSCrim)", type: "crim" },
  { code: "ABComm", name: "AB in Communication", type: "general" },
  { code: "ABPsy", name: "AB in Psychology", type: "general" },
  { code: "ABPolSci", name: "AB in Political Science", type: "general" },
  { code: "BEEd", name: "Bachelor of Elementary Education", type: "general" },
  { code: "BSEd", name: "Bachelor of Secondary Education", type: "general" },
  { code: "BPEd", name: "Bachelor of Physical Education", type: "general" },
  // CCBALTCH - Business, IT, Hospitality & Customs
  { code: "BSIT", name: "BS in Information Technology (BSIT)", type: "general" },
  { code: "BSHM", name: "BS in Hospitality Management (BSHM)", type: "hospitality" },
  { code: "BSTM", name: "BS in Tourism Management (BSTM)", type: "general" },
  { code: "BSCA", name: "BS in Customs Administration (BSCA)", type: "customs" },
  { code: "BSA", name: "BS in Accountancy (BSA)", type: "general" },
  { code: "BSBA", name: "BS in Business Administration", type: "general" },
  { code: "BSIA", name: "BS in Internal Auditing", type: "general" },
];

const SHS_STRANDS = [
  "STEM",
  "ABM",
  "HUMSS",
  "GAS",
  "TVL - Culinary",
];

function Step2({ data, onContinue }) {
  const [department, setDepartment] = useState(data.department || "College");
  const [course,     setCourse]     = useState(data.course || "BSIT");
  const [strand,     setStrand]     = useState(data.strand || "STEM");
  const [yearLevel,  setYearLevel]  = useState(data.yearLevel || "1st Year");
  const [gender,     setGender]     = useState(data.gender || null);
  const [mobile,     setMobile]     = useState(data.mobile || "");

  const handleMobileChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, "").slice(0, 11);
    setMobile(cleaned);
  };

  const handleContinue = () => {
    if (!department) { Alert.alert("Required", "Please select your department."); return; }
    if (!yearLevel.trim()) { Alert.alert("Required", "Please select or enter your grade/year level."); return; }
    if (!gender) { Alert.alert("Required", "Please select Girls or Boys."); return; }
    
    const cleanMobile = mobile.replace(/[^0-9]/g, "");
    if (!cleanMobile) {
      Alert.alert("Required", "Please enter your mobile number.");
      return;
    }
    if (cleanMobile.length !== 11) {
      Alert.alert(
        "Invalid Mobile Number",
        `Philippine mobile numbers must be exactly 11 digits.\nYou entered ${cleanMobile.length} digit${cleanMobile.length === 1 ? "" : "s"}.`
      );
      return;
    }
    if (!cleanMobile.startsWith("09")) {
      Alert.alert(
        "Invalid Mobile Number",
        "Philippine mobile numbers must start with '09' (e.g. 09171234567)."
      );
      return;
    }

    onContinue({ department, course, strand, yearLevel, gender, mobile: cleanMobile });
  };

  const displayName = `${data.firstName || ""} ${data.lastName || ""}`.trim() || "Student";
  const isValidPHNumber = mobile.length === 11 && mobile.startsWith("09");

  return (
    <>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.stepLabel}>Step 2 of 5</Text>
        <Text style={styles.stepTitle}>Almost there!</Text>
        <Text style={styles.stepDesc}>Details for your course & tailored uniform orders.</Text>

        <View style={styles.matchCard}>
          <View style={styles.matchIconWrap}><Text style={styles.matchCheck}>{"✓"}</Text></View>
          <View>
            <Text style={styles.matchName}>{displayName}</Text>
            <Text style={styles.matchSub}>Student ID: {data.studentId}</Text>
          </View>
        </View>

        {/* ── DEPARTMENT SELECTION ── */}
        <Text style={[styles.fieldLabel, { marginTop: 18 }]}>Education Department</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {DEPARTMENTS.map((dept) => {
            const isSelected = department === dept;
            return (
              <TouchableOpacity
                key={dept}
                style={[styles.sizeBtn, isSelected && styles.sizeBtnActive, { minWidth: 90, paddingHorizontal: 12 }]}
                onPress={() => {
                  setDepartment(dept);
                  if (dept === "Kindergarten") setYearLevel("Kinder 1");
                  else if (dept === "Elementary") setYearLevel("Grade 1");
                  else if (dept === "Junior High") setYearLevel("Grade 7");
                  else if (dept === "Senior High") setYearLevel("Grade 11");
                  else if (dept === "College") setYearLevel("1st Year");
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.sizeBtnText, isSelected && styles.sizeBtnTextActive]}>
                  {dept}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── IF COLLEGE: PROGRAM SELECTOR ── */}
        {department === "College" && (
          <View style={{ marginBottom: 14 }}>
            <Text style={styles.fieldLabel}>Degree Program (Course)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {COLLEGE_PROGRAMS.map((prog) => {
                const isSelected = course === prog.code;
                return (
                  <TouchableOpacity
                    key={prog.code}
                    style={[styles.sizeBtn, isSelected && styles.sizeBtnActive, { minWidth: 70, paddingHorizontal: 10 }]}
                    onPress={() => setCourse(prog.code)}
                  >
                    <Text style={[styles.sizeBtnText, isSelected && styles.sizeBtnTextActive]}>
                      {prog.code}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Text style={{ fontSize: 12, color: "#666", marginTop: 4, fontStyle: "italic" }}>
              {COLLEGE_PROGRAMS.find((p) => p.code === course)?.name || course}
            </Text>
          </View>
        )}

        {/* ── IF SENIOR HIGH: STRAND SELECTOR ── */}
        {department === "Senior High" && (
          <View style={{ marginBottom: 14 }}>
            <Text style={styles.fieldLabel}>Senior High School Strand</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {SHS_STRANDS.map((st) => {
                const isSelected = strand === st;
                return (
                  <TouchableOpacity
                    key={st}
                    style={[styles.sizeBtn, isSelected && styles.sizeBtnActive, { paddingHorizontal: 12 }]}
                    onPress={() => setStrand(st)}
                  >
                    <Text style={[styles.sizeBtnText, isSelected && styles.sizeBtnTextActive]}>
                      {st}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ── GRADE / YEAR LEVEL SELECTOR ── */}
        <Text style={styles.fieldLabel}>Grade / Year Level</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {department === "Kindergarten" &&
            ["Pre-K", "Kinder 1", "Kinder 2"].map((lvl) => (
              <TouchableOpacity
                key={lvl}
                style={[styles.sizeBtn, yearLevel === lvl && styles.sizeBtnActive, { minWidth: 65 }]}
                onPress={() => setYearLevel(lvl)}
              >
                <Text style={[styles.sizeBtnText, yearLevel === lvl && styles.sizeBtnTextActive]}>{lvl}</Text>
              </TouchableOpacity>
            ))}

          {department === "Elementary" &&
            ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"].map((lvl) => (
              <TouchableOpacity
                key={lvl}
                style={[styles.sizeBtn, yearLevel === lvl && styles.sizeBtnActive, { minWidth: 65 }]}
                onPress={() => setYearLevel(lvl)}
              >
                <Text style={[styles.sizeBtnText, yearLevel === lvl && styles.sizeBtnTextActive]}>{lvl}</Text>
              </TouchableOpacity>
            ))}

          {department === "Junior High" &&
            ["Grade 7", "Grade 8", "Grade 9", "Grade 10"].map((lvl) => (
              <TouchableOpacity
                key={lvl}
                style={[styles.sizeBtn, yearLevel === lvl && styles.sizeBtnActive, { minWidth: 65 }]}
                onPress={() => setYearLevel(lvl)}
              >
                <Text style={[styles.sizeBtnText, yearLevel === lvl && styles.sizeBtnTextActive]}>{lvl}</Text>
              </TouchableOpacity>
            ))}

          {department === "Senior High" &&
            ["Grade 11", "Grade 12"].map((lvl) => (
              <TouchableOpacity
                key={lvl}
                style={[styles.sizeBtn, yearLevel === lvl && styles.sizeBtnActive, { minWidth: 80 }]}
                onPress={() => setYearLevel(lvl)}
              >
                <Text style={[styles.sizeBtnText, yearLevel === lvl && styles.sizeBtnTextActive]}>{lvl}</Text>
              </TouchableOpacity>
            ))}

          {department === "College" &&
            ["1st Year", "2nd Year", "3rd Year", "4th Year"].map((lvl) => (
              <TouchableOpacity
                key={lvl}
                style={[styles.sizeBtn, yearLevel === lvl && styles.sizeBtnActive, { minWidth: 75 }]}
                onPress={() => setYearLevel(lvl)}
              >
                <Text style={[styles.sizeBtnText, yearLevel === lvl && styles.sizeBtnTextActive]}>{lvl}</Text>
              </TouchableOpacity>
            ))}
        </View>

        {/* ── GENDER ── */}
        <Text style={[styles.fieldLabel, { marginTop: 4 }]}>Gender</Text>
        <View style={styles.genderRow}>
          {["Girls", "Boys"].map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
              onPress={() => setGender(g)}
              activeOpacity={0.8}
            >
              <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                {g === "Girls" ? "👧 Girls" : "👦 Boys"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── MOBILE NUMBER ── */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16, marginBottom: 7 }}>
          <Text style={styles.fieldLabel}>Mobile number (Philippine)</Text>
          <Text style={{ fontSize: 12, fontWeight: "600", color: isValidPHNumber ? "#2e7d32" : "#888" }}>
            {mobile.length}/11 digits
          </Text>
        </View>

        <TextInput
          style={[styles.input, isValidPHNumber && { borderColor: "#2e7d32" }]}
          placeholder="e.g. 09171234567"
          placeholderTextColor="#bbb"
          value={mobile}
          onChangeText={handleMobileChange}
          keyboardType="numeric"
          maxLength={11}
        />
        
        {isValidPHNumber ? (
          <Text style={{ fontSize: 12, color: "#2e7d32", marginTop: 4, fontWeight: "600" }}>
            {"✓ Valid Philippine mobile number"}
          </Text>
        ) : (
          <Text style={styles.mobileNote}>
            {"Format: 11 digits starting with 09 (e.g. 09171234567)"}
          </Text>
        )}
      </ScrollView>
      <Footer onPress={handleContinue} />
    </>
  );
}

// ════════════════════════════════════════════════════════════
// STEP 3 — Sizes (Tailored to Department, Course/Strand & Gender)
// ════════════════════════════════════════════════════════════
function Step3({ formData, onContinue, onSkip }) {
  const [blouse,   setBlouse]   = useState(null);
  const [skirt,    setSkirt]    = useState(null);
  const [peShirt,  setPeShirt]  = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  const gender     = formData?.gender || "Girls";
  const department = formData?.department || "College";
  const course     = formData?.course || "BSIT";
  const strand     = formData?.strand || "STEM";
  const isBoys     = gender === "Boys";

  // Tailor labels and size choices based on Department, Course & Gender
  let topLabel = isBoys ? "College Polo-Barong" : "College Blouse";
  let topSizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

  let bottomLabel = isBoys ? "College Slacks (inches)" : "College Skirt (inches)";
  let bottomSizes = isBoys
    ? ["28", "30", "32", "34", "36", "38"]
    : ["24", "26", "28", "30", "32", "34"];

  let peSizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

  if (department === "Kindergarten") {
    topLabel = isBoys ? "Kinder Polo" : "Kinder Blouse";
    topSizes = ["4", "6", "8", "10", "12"];
    bottomLabel = isBoys ? "Kinder Shorts Waist (inches)" : "Kinder Jumper / Skirt (inches)";
    bottomSizes = ["18", "20", "22", "24"];
    peSizes = ["4", "6", "8", "10", "12"];
  } else if (department === "Elementary") {
    topLabel = isBoys ? "Elementary Polo" : "Elementary Blouse";
    topSizes = ["8", "10", "12", "14", "16", "18", "S"];
    bottomLabel = isBoys ? "Shorts/Pants Waist (inches)" : "Elementary Skirt Waist (inches)";
    bottomSizes = ["20", "22", "24", "26", "28", "30"];
    peSizes = ["8", "10", "12", "14", "16", "18", "XS", "S"];
  } else if (department === "Junior High") {
    topLabel = isBoys ? "JHS Men's Polo" : "JHS Blouse (Green Collar)";
    topSizes = ["XS", "S", "M", "L", "XL", "XXL"];
    bottomLabel = isBoys ? "JHS School Pants Waist (inches)" : "JHS Pleated Skirt Waist (inches)";
    bottomSizes = isBoys ? ["26", "28", "30", "32", "34"] : ["24", "26", "28", "30", "32", "34"];
  } else if (department === "Senior High") {
    if (strand === "TVL - Culinary") {
      topLabel = "Culinary / Chef Jacket";
      bottomLabel = "Culinary Houndstooth / Black Pants";
    } else {
      topLabel = isBoys ? "SHS Polo-Barong" : "SHS Blouse";
      bottomLabel = isBoys ? "SHS Slacks Waist (inches)" : "SHS Skirt Waist (inches)";
    }
    topSizes = ["XS", "S", "M", "L", "XL", "XXL"];
    bottomSizes = isBoys ? ["26", "28", "30", "32", "34", "36"] : ["24", "26", "28", "30", "32", "34"];
  } else if (department === "College") {
    if (course === "BSN") {
      topLabel = isBoys ? "BSN Nursing Scrub / White Top" : "BSN Nursing White Duty Top";
      bottomLabel = isBoys ? "BSN White Duty Slacks (inches)" : "BSN Nursing Duty Pants (inches)";
    } else if (course === "BSCrim") {
      topLabel = "Criminology Type A / B Uniform Top";
      bottomLabel = "Criminology Duty Pants (inches)";
    } else if (course === "BSHM") {
      topLabel = "BSHM Chef Jacket / Service Polo";
      bottomLabel = "BSHM Kitchen / Service Slacks";
    } else if (course === "BSCA") {
      topLabel = isBoys ? "BSCA Customs Uniform Polo" : "BSCA Customs Blouse";
      bottomLabel = isBoys ? "BSCA Customs Slacks" : "BSCA Customs Skirt";
    } else {
      topLabel = isBoys ? "College Polo-Barong" : "College Blouse";
      bottomLabel = isBoys ? "College Slacks (inches)" : "College Skirt (inches)";
    }
    topSizes = ["XS", "S", "M", "L", "XL", "XXL"];
    bottomSizes = isBoys ? ["28", "30", "32", "34", "36", "38"] : ["24", "26", "28", "30", "32", "34"];
  }

  // Subtitle badge text
  const badgeDetails =
    department === "College"
      ? `${course} • ${isBoys ? "Boys Uniform" : "Girls Uniform"}`
      : department === "Senior High"
      ? `SHS (${strand}) • ${isBoys ? "Boys Uniform" : "Girls Uniform"}`
      : `${department} • ${isBoys ? "Boys Uniform" : "Girls Uniform"}`;

  const SizeGroup = ({ label, sizes, selected, onSelect, showGuide }) => (
    <View style={{ marginBottom: 22 }}>
      <View style={styles.sizeLabelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {showGuide && (
          <TouchableOpacity onPress={() => setShowGuide(true)}>
            <Text style={styles.sizeGuide}>{"📏 Size Guide"}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.sizeWrap}>
        {sizes.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.sizeBtn, selected === s && styles.sizeBtnActive]}
            onPress={() => onSelect(selected === s ? null : s)}
            activeOpacity={0.8}
          >
            <Text style={[styles.sizeBtnText, selected === s && styles.sizeBtnTextActive]}>
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <>
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: 32 }]} keyboardShouldPersistTaps="handled">
        <Text style={styles.stepLabel}>Step 3 of 5</Text>
        <Text style={styles.stepTitle}>Set your usual sizes</Text>
        <Text style={styles.stepDesc}>{"Optional. We\u2019ll pre-select these when you shop."}</Text>

        {/* ── Active Department & Gender Tag ── */}
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#eaf5ed", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, marginBottom: 20, gap: 6 }}>
          <Text style={{ fontSize: 13, color: OC_GREEN, fontWeight: "700" }}>
            {`🎓 ${badgeDetails}`}
          </Text>
        </View>

        <SizeGroup label={topLabel} sizes={topSizes} selected={blouse} onSelect={setBlouse} showGuide />
        <SizeGroup label={bottomLabel} sizes={bottomSizes} selected={skirt} onSelect={setSkirt} />
        <SizeGroup label="PE shirt" sizes={peSizes} selected={peShirt} onSelect={setPeShirt} showGuide />

        <TouchableOpacity style={styles.saveSizesBtn} onPress={() => onContinue({ blouse, skirt, peShirt })} activeOpacity={0.85}>
          <Text style={styles.saveSizesBtnText}>Save sizes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ alignItems: "center", marginTop: 14 }} onPress={onSkip}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── SIZE GUIDE MODAL ── */}
      <Modal visible={showGuide} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 24 }}>
          <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 20 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#111" }}>{department} Uniform Sizes</Text>
              <TouchableOpacity onPress={() => setShowGuide(false)}>
                <Text style={{ fontSize: 20, fontWeight: "700", color: "#888" }}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
              Measurements in inches. Use a measuring tape for best fit.
            </Text>
            <View style={{ borderWidth: 1, borderColor: "#e9ecef", borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
              <View style={{ flexDirection: "row", backgroundColor: "#eaf5ed", paddingVertical: 10, paddingHorizontal: 8 }}>
                <Text style={{ flex: 1, fontWeight: "700", color: OC_GREEN, textAlign: "center" }}>Size</Text>
                <Text style={{ flex: 1, fontWeight: "700", color: OC_GREEN, textAlign: "center" }}>Chest</Text>
                <Text style={{ flex: 1, fontWeight: "700", color: OC_GREEN, textAlign: "center" }}>Length</Text>
                <Text style={{ flex: 1, fontWeight: "700", color: OC_GREEN, textAlign: "center" }}>Waist</Text>
              </View>
              {[
                { s: "XS", c: '34"', l: '24"', w: '24-26"' },
                { s: "S", c: '36"', l: '25"', w: '26-28"' },
                { s: "M", c: '38"', l: '26"', w: '28-30"' },
                { s: "L", c: '40"', l: '27"', w: '30-32"' },
                { s: "XL", c: '42"', l: '28"', w: '32-34"' },
                { s: "XXL", c: '44"', l: '29"', w: '34-36"' },
              ].map((row, idx) => (
                <View key={row.s} style={{ flexDirection: "row", paddingVertical: 9, paddingHorizontal: 8, backgroundColor: idx % 2 === 1 ? "#f9f9f9" : "#fff" }}>
                  <Text style={{ flex: 1, fontWeight: "700", textAlign: "center", color: "#222" }}>{row.s}</Text>
                  <Text style={{ flex: 1, textAlign: "center", color: "#555" }}>{row.c}</Text>
                  <Text style={{ flex: 1, textAlign: "center", color: "#555" }}>{row.l}</Text>
                  <Text style={{ flex: 1, textAlign: "center", color: "#555" }}>{row.w}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={{ backgroundColor: OC_GREEN, paddingVertical: 12, borderRadius: 12, alignItems: "center" }} onPress={() => setShowGuide(false)}>
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ════════════════════════════════════════════════════════════
// STEP 4 — Password + real register API call
// ════════════════════════════════════════════════════════════
function Step4({ formData, onContinue }) {
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const hasMin = password.length >= 8;
  const hasNum = /\d/.test(password);
  const hasCap = /[A-Z]/.test(password);

  const Rule = ({ passed, text }) => (
    <View style={styles.ruleRow}>
      <View style={[styles.ruleCircle, passed && styles.ruleCirclePass]} />
      <Text style={[styles.ruleText, passed && styles.ruleTextPass]}>{text}</Text>
    </View>
  );

  const handleContinue = async () => {
    if (!hasMin || !hasNum || !hasCap) { Alert.alert("Weak Password", "Please meet all password requirements."); return; }
    if (password !== confirm) { Alert.alert("Mismatch", "Passwords do not match."); return; }

    setLoading(true);
    try {
      const fullEmail = formData.emailUser
        ? (formData.emailUser.includes("@") ? formData.emailUser : `${formData.emailUser}@olivarezcollege.edu.ph`)
        : `${(formData.firstName || "student").toLowerCase()}.${(formData.lastName || "user").toLowerCase()}@olivarezcollege.edu.ph`;

      const payload = {
        student_id   : formData.studentId,
        first_name   : formData.firstName,
        last_name    : formData.lastName,
        email        : fullEmail,
        mobile       : formData.mobile,
        gender       : formData.gender,
        department   : formData.department,
        course_strand: formData.department === "College" ? formData.course : formData.strand,
        year_level   : formData.department ? `${formData.department} - ${formData.yearLevel}` : formData.yearLevel,
        password     : password,
        size_blouse  : formData.blouse  || null,
        size_skirt   : formData.skirt   || null,
        size_pants   : formData.pants   || null,
        size_pe_shirt: formData.peShirt || null,
      };
      const res = await apiPost(ENDPOINTS.register, payload);
      if (res.success) {
        onContinue({
          password,
          registeredEmail: res.data?.email || fullEmail,
          otpDebug: res.data?.otp_debug || null,
        });
      } else {
        Alert.alert("Registration Failed", res.message || "Something went wrong.");
      }
    } catch (err) {
      Alert.alert("Connection Error", "Cannot reach the server. Make sure XAMPP is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.stepLabel}>Step 4 of 5</Text>
        <Text style={styles.stepTitle}>Create a password</Text>
        <Text style={styles.stepDesc}>You will use it with your student ID to sign in.</Text>

        <Text style={styles.fieldLabel}>Password</Text>
        <View style={styles.passWrapper}>
          <TextInput style={styles.passInput} value={password} onChangeText={setPassword} secureTextEntry={!showPass} placeholder={"•".repeat(8)} placeholderTextColor="#bbb" autoCapitalize="none" />
          <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.showBtn}>
            <Text style={styles.showBtnText}>{showPass ? "Hide" : "Show"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.rulesBox}>
          <Rule passed={hasMin} text="At least 8 characters" />
          <Rule passed={hasNum} text="One number" />
          <Rule passed={hasCap} text="One capital letter" />
        </View>

        <Text style={[styles.fieldLabel, { marginTop: 18 }]}>Confirm Password</Text>
        <TextInput style={styles.input} value={confirm} onChangeText={setConfirm} secureTextEntry placeholder={"•".repeat(8)} placeholderTextColor="#bbb" autoCapitalize="none" />
      </ScrollView>
      <Footer label="Continue" onPress={handleContinue} loading={loading} />
    </>
  );
}

// ════════════════════════════════════════════════════════════
// STEP 5 — OTP Verification (real API)
// ════════════════════════════════════════════════════════════
function Step5({ formData, onVerify }) {
  const [code,    setCode]    = useState(["","","","","",""]);
  const [timer,   setTimer]   = useState(42);
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const handleChange = (val, idx) => {
    const nc = [...code]; nc[idx] = val.replace(/[^0-9]/g, "").slice(-1); setCode(nc);
    if (val && idx < 5) inputs.current[idx + 1]?.focus();
  };
  const handleKey = ({ nativeEvent }, idx) => {
    if (nativeEvent.key === "Backspace" && !code[idx] && idx > 0) inputs.current[idx - 1]?.focus();
  };

  const handleVerify = async () => {
    const fullCode = code.join("");
    if (fullCode.length < 6) { Alert.alert("Incomplete", "Please enter the 6-digit code."); return; }
    setLoading(true);
    try {
      const res = await apiPost(ENDPOINTS.verifyOtp, { student_id: formData.studentId, otp: fullCode });
      if (res.success) {
        onVerify();
      } else {
        Alert.alert("Invalid Code", res.message || "Wrong OTP. Please try again.");
      }
    } catch (err) {
      Alert.alert("Connection Error", "Cannot reach the server.");
    } finally {
      setLoading(false);
    }
  };

  const masked = formData.mobile ? formData.mobile.slice(0, 4) + "..." + formData.mobile.slice(-2) : "0919...21";

  return (
    <>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.stepLabel}>Step 5 of 5</Text>
        <Text style={styles.stepTitle}>Enter the 6-digit code</Text>
        <Text style={styles.stepDesc}>
          {"We sent a verification code to your Olivarez school email:\n"}
          <Text style={{ fontWeight: "700", color: OC_GREEN }}>
            {formData.registeredEmail || `${(formData.firstName || "student").toLowerCase()}.${(formData.lastName || "user").toLowerCase()}@olivarezcollege.edu.ph`}
          </Text>
          {"\nPlease check your school inbox or spam folder."}
        </Text>

        <View style={styles.otpRow}>
          {code.map((digit, i) => (
            <TextInput key={i} ref={(r) => (inputs.current[i] = r)}
              style={[styles.otpBox, digit && styles.otpBoxFilled]}
              value={digit} onChangeText={(v) => handleChange(v, i)}
              onKeyPress={(e) => handleKey(e, i)} keyboardType="numeric" maxLength={1} textAlign="center" />
          ))}
        </View>

        {timer > 0
          ? <Text style={styles.resendText}>Resend code in <Text style={{ color: OC_GREEN, fontWeight: "700" }}>0:{timer.toString().padStart(2,"0")}</Text></Text>
          : <TouchableOpacity onPress={() => setTimer(42)}><Text style={[styles.resendText, { color: OC_GREEN, fontWeight: "700" }]}>Resend code</Text></TouchableOpacity>}

        {/* Institutional Account & Dev OTP Helper */}
        <View style={styles.otpHelperCard}>
          <Text style={styles.otpHelperTitle}>Official Olivarez Account</Text>
          <Text style={styles.otpHelperEmail}>
            {formData.registeredEmail || `${(formData.firstName || "student").toLowerCase()}.${(formData.lastName || "user").toLowerCase()}@olivarezcollege.edu.ph`}
          </Text>
          {formData.otpDebug ? (
            <TouchableOpacity
              style={styles.autofillBtn}
              onPress={() => {
                const digits = String(formData.otpDebug).split("");
                setCode(digits);
              }}
            >
              <Text style={styles.autofillText}>⚡ Tap to autofill test code: <Text style={{ fontWeight: "800" }}>{formData.otpDebug}</Text></Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
      <Footer label="Verify" onPress={handleVerify} loading={loading} />
    </>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════
export default function RegisterScreen({ navigation }) {
  const [step,     setStep]     = useState(1);
  const [formData, setFormData] = useState({});

  const handleBack = () => { if (step === 1) navigation.goBack(); else setStep((s) => s - 1); };
  const next = (data = {}) => { setFormData((prev) => ({ ...prev, ...data })); setStep((s) => s + 1); };

  const handleVerify = () => {
    Alert.alert("Account Created! 🎉", "Welcome to Olivarian Store Supply! You can now log in.", [
      { text: "Sign In", onPress: () => navigation.replace("Login") },
    ]);
  };

  const renderStep = () => {
    switch (step) {
      case 1: return <Step1 onContinue={next} />;
      case 2: return <Step2 data={formData} onContinue={next} />;
      case 3: return <Step3 formData={formData} onContinue={next} onSkip={() => next()} />;
      case 4: return <Step4 formData={formData} onContinue={next} />;
      case 5: return <Step5 formData={formData} onVerify={handleVerify} />;
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Header onBack={handleBack} />
        <ProgressBar step={step} />
        <View style={{ flex: 1 }}>{renderStep()}</View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea         : { flex: 1, backgroundColor: "#fff" },
  header           : { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn          : { padding: 4 },
  backIcon         : { fontSize: 20, color: "#333", fontWeight: "700" },
  headerTitle      : { fontSize: 16, fontWeight: "700", color: "#111" },
  headerLogo       : { width: 36, height: 36 },
  progressRow      : { flexDirection: "row", paddingHorizontal: 16, marginBottom: 2 },
  progressSegment  : { flex: 1, height: 5, borderRadius: 3 },
  progressActive   : { backgroundColor: OC_GREEN },
  progressInactive : { backgroundColor: "#d4ead9" },
  body             : { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, flexGrow: 1 },
  stepLabel        : { fontSize: 12, color: "#999", marginBottom: 8, fontWeight: "500" },
  stepTitle        : { fontSize: 24, fontWeight: "800", color: "#111", marginBottom: 10, lineHeight: 32 },
  stepDesc         : { fontSize: 13, color: "#777", marginBottom: 20, lineHeight: 20 },
  fieldLabel       : { fontSize: 13, fontWeight: "600", color: "#333", marginBottom: 7 },
  input            : { backgroundColor: "#fff", borderRadius: 10, borderWidth: 1.5, borderColor: "#e2e2e2", paddingVertical: 13, paddingHorizontal: 14, fontSize: 15, color: "#222", marginBottom: 4 },
  inputError       : { borderColor: "#e53935", backgroundColor: "#fff8f8" },
  errorRow         : { flexDirection: "row", alignItems: "flex-start", marginTop: 4, marginBottom: 8 },
  errorIcon        : { color: "#e53935", fontSize: 13, marginRight: 6, marginTop: 1 },
  errorText        : { color: "#e53935", fontSize: 12, flex: 1, lineHeight: 18 },
  infoBox          : { flexDirection: "row", backgroundColor: "#fef9e7", borderRadius: 10, padding: 12, marginTop: 14, alignItems: "flex-start" },
  infoIcon         : { fontSize: 13, color: "#b8860b", marginRight: 8, marginTop: 1 },
  infoText         : { fontSize: 13, color: "#7a6020", flex: 1, lineHeight: 18 },
  footer           : { paddingHorizontal: 20, paddingBottom: 28, paddingTop: 10, backgroundColor: "#fff" },
  continueBtn      : { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1.5, borderColor: "#ccc", paddingVertical: 15, alignItems: "center" },
  continueBtnText  : { fontSize: 16, fontWeight: "600", color: "#333" },
  matchCard        : { flexDirection: "row", alignItems: "center", backgroundColor: "#f0f9f2", borderRadius: 12, padding: 14, marginBottom: 4 },
  matchIconWrap    : { width: 40, height: 40, borderRadius: 20, backgroundColor: OC_GREEN, alignItems: "center", justifyContent: "center", marginRight: 12 },
  matchCheck       : { color: "#fff", fontSize: 20, fontWeight: "800" },
  matchName        : { fontSize: 15, fontWeight: "700", color: "#111" },
  matchSub         : { fontSize: 12, color: "#5a9a6a", marginTop: 2 },
  genderRow        : { flexDirection: "row", marginTop: 10 },
  genderBtn        : { flex: 1, borderRadius: 10, borderWidth: 1.5, borderColor: "#e0e0e0", paddingVertical: 12, alignItems: "center", marginRight: 8, backgroundColor: "#fff" },
  genderBtnActive  : { backgroundColor: "#eaf5ed", borderColor: OC_GREEN },
  genderText       : { fontSize: 14, fontWeight: "600", color: "#aaa" },
  genderTextActive : { color: OC_GREEN },
  mobileNote       : { fontSize: 12, color: "#aaa", marginTop: 6 },
  sizeLabelRow     : { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sizeGuide        : { fontSize: 12, color: OC_GREEN, fontWeight: "600" },
  sizeWrap         : { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sizeBtn          : { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1.5, borderColor: "#e0e0e0", backgroundColor: "#fff", minWidth: 56, alignItems: "center" },
  sizeBtnActive    : { backgroundColor: "#eaf5ed", borderColor: OC_GREEN },
  sizeBtnText      : { fontSize: 14, fontWeight: "600", color: "#666" },
  sizeBtnTextActive: { color: OC_GREEN },
  saveSizesBtn     : { backgroundColor: OC_GREEN, borderRadius: 12, paddingVertical: 16, alignItems: "center", elevation: 3 },
  saveSizesBtnText : { color: "#fff", fontWeight: "700", fontSize: 16 },
  skipText         : { fontSize: 14, color: "#888", fontWeight: "500" },
  passWrapper      : { flexDirection: "row", alignItems: "center", borderRadius: 10, borderWidth: 1.5, borderColor: "#e2e2e2", backgroundColor: "#fff", marginBottom: 12 },
  passInput        : { flex: 1, paddingVertical: 13, paddingHorizontal: 14, fontSize: 15, color: "#222" },
  showBtn          : { paddingHorizontal: 14 },
  showBtnText      : { fontSize: 13, fontWeight: "700", color: OC_GREEN },
  rulesBox         : { backgroundColor: "#f8f8f8", borderRadius: 10, padding: 14, gap: 8 },
  ruleRow          : { flexDirection: "row", alignItems: "center" },
  ruleCircle       : { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: "#ccc", marginRight: 10 },
  ruleCirclePass   : { backgroundColor: OC_GREEN, borderColor: OC_GREEN },
  ruleText         : { fontSize: 13, color: "#aaa" },
  ruleTextPass     : { color: "#333" },
  otpRow           : { flexDirection: "row", justifyContent: "space-between", marginTop: 24, marginBottom: 20 },
  otpBox           : { width: 46, height: 58, borderRadius: 10, borderWidth: 1.5, borderColor: "#d0d0d0", fontSize: 24, fontWeight: "700", color: "#111", backgroundColor: "#fff" },
  otpBoxFilled     : { borderColor: OC_GREEN },
  resendText       : { textAlign: "center", fontSize: 13, color: "#aaa" },
  emailInputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 10, borderWidth: 1.5, borderColor: "#e2e2e2", marginBottom: 4, overflow: "hidden" },
  emailInput       : { flex: 1, paddingVertical: 13, paddingHorizontal: 14, fontSize: 15, color: "#222" },
  emailDomainBadge : { backgroundColor: "#eaf5ed", paddingVertical: 14, paddingHorizontal: 12, borderLeftWidth: 1, borderLeftColor: "#d4ead9" },
  emailDomain      : { fontSize: 13, fontWeight: "700", color: OC_GREEN },
  emailHint        : { fontSize: 12, color: "#666", marginTop: 4, lineHeight: 17 },
  otpHelperCard    : { backgroundColor: "#f0f9f2", borderWidth: 1.5, borderColor: "#c3e6cb", borderRadius: 12, padding: 14, marginTop: 22, alignItems: "center" },
  otpHelperTitle   : { fontSize: 11, fontWeight: "700", color: "#285e3a", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  otpHelperEmail   : { fontSize: 14, fontWeight: "800", color: OC_GREEN, marginBottom: 8, textAlign: "center" },
  autofillBtn      : { backgroundColor: OC_GREEN, borderRadius: 8, paddingVertical: 9, paddingHorizontal: 14, marginTop: 4 },
  autofillText     : { color: "#fff", fontSize: 13, fontWeight: "600" },
});
