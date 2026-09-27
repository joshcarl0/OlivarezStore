<?php
// get_users.php - User management endpoint (Students and Staff)
require_once "config.php";

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

$db = getDB();

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $input = json_decode(file_get_contents("php://input"), true) ?? $_POST;
    $action = $input["action"] ?? "create_staff";

    if ($action === "create_staff") {
        $username = trim($input["username"] ?? "");
        $full_name = trim($input["full_name"] ?? $input["name"] ?? "");
        $email = trim($input["email"] ?? "");
        $role = trim($input["role"] ?? "Store Staff");
        $station = trim($input["station"] ?? "Counter 01");
        $password = $input["password"] ?? "Staff2026!";

        if (empty($username) || empty($full_name)) {
            sendError("Username and full name are required.");
        }

        // Validate role enum
        if (!in_array($role, ["Store Staff", "Cashier", "Super Admin"])) {
            $role = "Store Staff";
        }

        // Check if username already exists
        $check = $db->prepare("SELECT id FROM staff_users WHERE username = ?");
        $check->bind_param("s", $username);
        $check->execute();
        if ($check->get_result()->num_rows > 0) {
            sendError("Username '{$username}' is already taken.");
        }

        $hash = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $db->prepare("INSERT INTO staff_users (username, full_name, email, password_hash, role, station, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)");
        $stmt->bind_param("ssssss", $username, $full_name, $email, $hash, $role, $station);

        if ($stmt->execute()) {
            sendSuccess(["id" => $db->insert_id, "username" => $username], "Staff user created successfully");
        } else {
            sendError("Failed to create staff account: " . $stmt->error);
        }
    } else {
        sendError("Unsupported action");
    }
    exit();
}

// GET Request: Retrieve students and staff lists
$studentsRes = $db->query("SELECT id, student_id, first_name, last_name, email, mobile, department, course_strand, year_level, gender, is_verified, created_at FROM students ORDER BY id DESC LIMIT 50");
$students = [];
if ($studentsRes) {
    while ($r = $studentsRes->fetch_assoc()) {
        $students[] = $r;
    }
}

$staffRes = $db->query("SELECT id, username, full_name, email, role, station, is_active, created_at FROM staff_users ORDER BY id ASC");
$staff = [];
if ($staffRes) {
    while ($r = $staffRes->fetch_assoc()) {
        $staff[] = $r;
    }
}

sendSuccess([
    "students" => $students,
    "staff" => $staff
], "Users retrieved");
?>
