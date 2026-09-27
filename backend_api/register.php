<?php
// register.php - Complete student registration with email OTP
require_once "config.php";
require_once "mailer.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") sendError("Method not allowed", 405);

$input         = getInput();
$studentId     = trim($input["student_id"] ?? "");
$lastName      = trim($input["last_name"] ?? "");
$firstName     = trim($input["first_name"] ?? "");
$mobile        = trim($input["mobile"] ?? "");
$gender        = trim($input["gender"] ?? "Girls");
$department    = trim($input["department"] ?? "College");
$courseStrand  = trim($input["course_strand"] ?? $input["course"] ?? $input["strand"] ?? "");
$yearLevel     = trim($input["year_level"] ?? "1st Year");
$password      = $input["password"] ?? "";
$blouse        = $input["size_blouse"] ?? null;
$skirt         = $input["size_skirt"] ?? null;
$pants         = $input["size_pants"] ?? ($gender === "Boys" ? $skirt : null);
$peShirt       = $input["size_pe_shirt"] ?? null;

if (!$studentId || !$password || !$mobile) sendError("Missing required fields");
if (strlen($password) < 8) sendError("Password must be at least 8 characters");

$db = getDB();

// Check if student record exists in school records
$stmt = $db->prepare("SELECT first_name, last_name FROM school_records WHERE student_id = ? AND is_active = 1");
$stmt->bind_param("s", $studentId);
$stmt->execute();
$record = $stmt->get_result()->fetch_assoc();

if ($record) {
    $fName = $record["first_name"];
    $lName = $record["last_name"];
} else {
    // If not found in pre-seeded records, use entered name
    $fName = !empty($firstName) ? $firstName : "Student";
    $lName = !empty($lastName) ? $lastName : "User";

    // Auto-add to school_records for audit
    $addRecord = $db->prepare("INSERT INTO school_records (student_id, first_name, last_name, year_level, course, is_active) VALUES (?, ?, ?, ?, ?, 1)");
    $addRecord->bind_param("sssss", $studentId, $fName, $lName, $yearLevel, $courseStrand);
    $addRecord->execute();
}

// Check if already registered in students table
$check = $db->prepare("SELECT id FROM students WHERE student_id = ?");
$check->bind_param("s", $studentId);
$check->execute();
if ($check->get_result()->num_rows > 0) sendError("Student ID already registered. Please sign in instead.", 409);

// Generate OTP
$otp       = str_pad(random_int(0, 999999), 6, "0", STR_PAD_LEFT);
$otpExpiry = date("Y-m-d H:i:s", strtotime("+5 minutes"));
$hash      = password_hash($password, PASSWORD_BCRYPT);

// Resolve institutional email
$customEmail = trim($input["email"] ?? "");
if (!empty($customEmail)) {
    if (strpos($customEmail, "@") === false) {
        $email = strtolower($customEmail) . "@olivarezcollege.edu.ph";
    } else {
        $email = strtolower($customEmail);
    }
} else {
    $cleanFName = strtolower(preg_replace("/[^a-zA-Z0-9]/", "", $fName));
    $cleanLName = strtolower(preg_replace("/[^a-zA-Z0-9]/", "", $lName));
    $email      = "{$cleanFName}.{$cleanLName}@olivarezcollege.edu.ph";
}

$ins = $db->prepare("INSERT INTO students (student_id, last_name, first_name, email, mobile, password_hash, gender, year_level, department, course_strand, size_blouse, size_skirt, size_pants, size_pe_shirt, otp_code, otp_expires_at, is_verified) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0)");
$ins->bind_param("ssssssssssssssss", $studentId, $lName, $fName, $email, $mobile, $hash, $gender, $yearLevel, $department, $courseStrand, $blouse, $skirt, $pants, $peShirt, $otp, $otpExpiry);

if (!$ins->execute()) sendError("Registration failed: " . $db->error, 500);

// Send verification email via SMTP if configured
$mailResult = sendVerificationEmail($email, "{$fName} {$lName}", $otp);

sendSuccess([
    "otp_debug"   => $otp,
    "email"       => $email,
    "email_sent"  => $mailResult["success"] ?? false,
    "mail_status" => $mailResult["message"] ?? "",
], "Verification code sent to " . $email);
