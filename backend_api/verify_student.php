<?php
// verify_student.php - Step 1: Check if student ID is not yet registered
require_once "config.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") sendError("Method not allowed", 405);

$input     = getInput();
$studentId = trim($input["student_id"] ?? "");
$lastName  = trim($input["last_name"]  ?? "");
$firstName = trim($input["first_name"] ?? "");

if (!$studentId || !$lastName || !$firstName) sendError("student_id, first_name, and last_name are required");

$db = getDB();

// Check if already registered
$checkStmt = $db->prepare("SELECT id FROM students WHERE student_id = ?");
$checkStmt->bind_param("s", $studentId);
$checkStmt->execute();
if ($checkStmt->get_result()->num_rows > 0) sendError("This student ID is already registered. Please log in instead.");

sendSuccess([
    "student_id" => $studentId,
    "first_name" => $firstName,
    "last_name"  => $lastName,
], "Student ID is available");
?>
