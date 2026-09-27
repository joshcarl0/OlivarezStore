<?php
// delete_product.php - Archive or delete a product
require_once "config.php";

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

$input = getInput();

$id = isset($input["id"]) ? intval($input["id"]) : 0;
$permanent = isset($input["permanent"]) && $input["permanent"] == true;

if ($id <= 0) {
    sendError("Invalid product ID.");
}

$db = getDB();

if ($permanent) {
    $stmt = $db->prepare("DELETE FROM products WHERE id = ?");
    $stmt->bind_param("i", $id);
} else {
    // Soft delete
    $stmt = $db->prepare("UPDATE products SET is_active = 0 WHERE id = ?");
    $stmt->bind_param("i", $id);
}

if ($stmt->execute()) {
    sendSuccess(["id" => $id], $permanent ? "Product permanently deleted" : "Product archived");
} else {
    sendError("Failed to delete product: " . $stmt->error);
}
?>
