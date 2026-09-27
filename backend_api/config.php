<?php
error_reporting(0);
ini_set('display_errors', 0);

// Database Configuration
define("DB_HOST",   "localhost");
define("DB_USER",   "root");
define("DB_PASS",   "");
define("DB_NAME",   "olivarez_store");

// CORS Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

// Database Connection
function getDB() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database connection failed: " . $conn->connect_error]);
        exit();
    }
    $conn->set_charset("utf8mb4");
    return $conn;
}

// Response Helpers
function sendSuccess($data = [], $message = "Success") {
    echo json_encode(["success" => true, "message" => $message, "data" => $data]);
    exit();
}

function sendError($message = "Error", $code = 400) {
    http_response_code($code);
    echo json_encode(["success" => false, "message" => $message]);
    exit();
}

function getInput() {
    $raw = file_get_contents("php://input");
    $raw = ltrim($raw, "\xEF\xBB\xBF");
    $data = json_decode($raw, true);
    if (!empty($data)) return $data;
    return $_POST ?? [];
}
?>