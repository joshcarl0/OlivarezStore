<?php
// verify_otp.php — Step 5: Verify the 6-digit OTP
require_once "config.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") sendError("Method not allowed", 405);

$input     = getInput();
$studentId = trim($input["student_id"] ?? "");
$otp       = trim($input["otp"] ?? "");

if (!$studentId || !$otp) sendError("student_id and otp are required");

$db   = getDB();
$stmt = $db->prepare("SELECT id, otp_code, otp_expires_at FROM students WHERE student_id = ?");
$stmt->bind_param("s", $studentId);
$stmt->execute();
$student = $stmt->get_result()->fetch_assoc();

if (!$student) sendError("Student not found", 404);
if ($student["otp_code"] !== $otp) sendError("Invalid OTP code");
if (strtotime($student["otp_expires_at"]) < time()) sendError("OTP has expired. Please request a new one.");

// Mark as verified
$upd = $db->prepare("UPDATE students SET is_verified = 1, otp_code = NULL, otp_expires_at = NULL WHERE student_id = ?");
$upd->bind_param("s", $studentId);
$upd->execute();

sendSuccess(["student_id" => $studentId], "Account verified successfully! You may now log in.");
?>
