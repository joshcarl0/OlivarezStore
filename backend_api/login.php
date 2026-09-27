<?php
// login.php - Student login with Student ID or OC Email + password
require_once "config.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") sendError("Method not allowed", 405);

$input     = getInput();
$idOrEmail = trim($input["identifier"] ?? $input["email"] ?? "");
$password  = $input["password"] ?? "";

if (!$idOrEmail || !$password) sendError("Student ID / Email and password are required");

$cleanInput = strtolower($idOrEmail);
$username   = str_replace("@olivarezcollege.edu.ph", "", $cleanInput);
$withDomain = $username . "@olivarezcollege.edu.ph";

$db = getDB();
$stmt = $db->prepare("SELECT id, student_id, first_name, last_name, email, mobile, gender, year_level, department, course_strand, size_blouse, size_skirt, size_pants, size_pe_shirt, password_hash, is_verified FROM students WHERE email = ? OR student_id = ? OR email = ? OR student_id = ?");
$stmt->bind_param("ssss", $idOrEmail, $idOrEmail, $withDomain, $username);
$stmt->execute();
$student = $stmt->get_result()->fetch_assoc();

if (!$student) sendError("Invalid credentials. Please check your Student ID/Email or Password.", 401);
if (!$student["is_verified"]) sendError("Account not yet verified. Please complete verification using the code sent to your email.", 403);
if (!password_verify($password, $student["password_hash"])) sendError("Invalid credentials. Please check your password.", 401);

// Generate session token
$token = bin2hex(random_bytes(32));

unset($student["password_hash"]);

sendSuccess([
    "token"   => $token,
    "student" => $student,
], "Login successful");
?>
