<?php
// upload_image.php - Upload uniform product image
require_once "config.php";

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

$uploadDir = __DIR__ . DIRECTORY_SEPARATOR . "uploads" . DIRECTORY_SEPARATOR;
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// Determine protocol and host for absolute URL
$protocol = (!empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off") ? "https" : "http";
$host = $_SERVER["HTTP_HOST"] ?? "localhost";
$scriptDir = dirname($_SERVER["SCRIPT_NAME"] ?? "/olivarez-store/backend_api");
$scriptDir = str_replace("\\", "/", $scriptDir);
if (substr($scriptDir, -1) !== "/") {
    $scriptDir .= "/";
}
$baseUrl = "{$protocol}://{$host}{$scriptDir}uploads/";

// Check if standard multipart file upload
if (isset($_FILES["image"]) && $_FILES["image"]["error"] === UPLOAD_ERR_OK) {
    $file = $_FILES["image"];
    $ext = strtolower(pathinfo($file["name"], PATHINFO_EXTENSION));
    $allowed = ["png", "jpg", "jpeg", "webp", "gif"];

    if (!in_array($ext, $allowed)) {
        sendError("Invalid file type. Only PNG, JPG, WEBP, and GIF are allowed.");
    }

    if ($file["size"] > 10 * 1024 * 1024) { // 10MB limit
        sendError("File too large. Maximum size is 10MB.");
    }

    $fileName = "uniform_" . time() . "_" . bin2hex(random_bytes(4)) . "." . $ext;
    $targetPath = $uploadDir . $fileName;

    if (move_uploaded_file($file["tmp_name"], $targetPath)) {
        sendSuccess([
            "filename" => $fileName,
            "url" => $baseUrl . $fileName
        ], "Image uploaded successfully");
    } else {
        sendError("Failed to save uploaded file on server.");
    }
}

// Or check if base64 encoded image sent via JSON
$input = getInput();
if (!empty($input["image_base64"])) {
    $base64 = $input["image_base64"];
    $ext = "png";
    if (preg_match('/^data:image\/(\w+);base64,/', $base64, $type)) {
        $base64 = substr($base64, strpos($base64, ",") + 1);
        $ext = strtolower($type[1]);
        if ($ext === "jpeg") $ext = "jpg";
    }

    $data = base64_decode($base64);
    if ($data === false) {
        sendError("Invalid base64 image data");
    }

    $fileName = "uniform_" . time() . "_" . bin2hex(random_bytes(4)) . "." . $ext;
    $targetPath = $uploadDir . $fileName;

    if (file_put_contents($targetPath, $data)) {
        sendSuccess([
            "filename" => $fileName,
            "url" => $baseUrl . $fileName
        ], "Image uploaded successfully");
    } else {
        sendError("Failed to save base64 image to server.");
    }
}

sendError("No image provided. Send multipart form-data 'image' or JSON 'image_base64'.");
?>
