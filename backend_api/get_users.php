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
    $input = getInput();
    $action = $input["action"] ?? "create_staff";

    if ($action === "create_staff" || $action === "create_admin") {
        $username = trim($input["username"] ?? "");
        $full_name = trim($input["full_name"] ?? $input["name"] ?? "");
        $email = trim($input["email"] ?? "");
        $role = trim($input["role"] ?? ($action === "create_admin" ? "Super Admin" : "Store Staff"));
        $station = trim($input["station"] ?? ($role === "Super Admin" ? "Main Office" : "Counter 01"));
        $password = $input["password"] ?? ($role === "Super Admin" ? "Admin2026!" : "Staff2026!");

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
            sendError("Username '{$username}' is already taken. Please choose another username.");
        }

        $hash = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $db->prepare("INSERT INTO staff_users (username, full_name, email, password_hash, role, station, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)");
        $stmt->bind_param("ssssss", $username, $full_name, $email, $hash, $role, $station);

        if ($stmt->execute()) {
            sendSuccess(["id" => $db->insert_id, "username" => $username, "role" => $role], "{$role} account created successfully!");
        } else {
            sendError("Failed to create account: " . $stmt->error);
        }
    } elseif ($action === "toggle_active") {
        $id = intval($input["id"] ?? 0);
        $active = intval($input["is_active"] ?? 1);
        $stmt = $db->prepare("UPDATE staff_users SET is_active = ? WHERE id = ?");
        $stmt->bind_param("ii", $active, $id);
        if ($stmt->execute()) {
            sendSuccess(["id" => $id, "is_active" => $active], "Account status updated.");
        } else {
            sendError("Failed to update status: " . $stmt->error);
        }
    } elseif ($action === "reset_password") {
        $id = intval($input["id"] ?? 0);
        $new_password = trim($input["new_password"] ?? "Staff2026!");

        if ($id <= 0) {
            sendError("Invalid account ID.");
        }
        if (strlen($new_password) < 6) {
            sendError("Password must be at least 6 characters.");
        }

        $hash = password_hash($new_password, PASSWORD_BCRYPT);
        $stmt = $db->prepare("UPDATE staff_users SET password_hash = ? WHERE id = ?");
        $stmt->bind_param("si", $hash, $id);

        if ($stmt->execute()) {
            sendSuccess(["id" => $id, "temp_password" => $new_password], "Password has been successfully reset to: '{$new_password}'");
        } else {
            sendError("Failed to reset password: " . $stmt->error);
        }
    } elseif ($action === "delete_staff") {
        $id = intval($input["id"] ?? 0);
        // Prevent deleting original admin ID 2
        if ($id <= 2) {
            sendError("Default system accounts cannot be deleted.");
        }
        $stmt = $db->prepare("DELETE FROM staff_users WHERE id = ?");
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            sendSuccess(["id" => $id], "Account removed.");
        } else {
            sendError("Failed to delete account: " . $stmt->error);
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
