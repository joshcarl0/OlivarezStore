<?php
// update_stock.php - Adjust uniform inventory stock level
require_once "config.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    sendError("Method not allowed", 405);
}

$input     = getInput();
$productId = intval($input["product_id"] ?? 0);
$action    = trim($input["action"] ?? "set"); // "set", "add", "subtract"
$amount    = intval($input["amount"] ?? 0);

if ($productId <= 0) sendError("Invalid product_id", 400);

$db = getDB();

if ($action === "add") {
    $stmt = $db->prepare("UPDATE products SET stock = stock + ? WHERE id = ?");
    $stmt->bind_param("ii", $amount, $productId);
} elseif ($action === "subtract") {
    $stmt = $db->prepare("UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?");
    $stmt->bind_param("ii", $amount, $productId);
} else {
    $stmt = $db->prepare("UPDATE products SET stock = GREATEST(0, ?) WHERE id = ?");
    $stmt->bind_param("ii", $amount, $productId);
}

if (!$stmt->execute()) {
    sendError("Failed to update stock: " . $db->error, 500);
}

// Return updated product
$get = $db->prepare("SELECT id, name, stock FROM products WHERE id = ?");
$get->bind_param("i", $productId);
$get->execute();
$prod = $get->get_result()->fetch_assoc();

sendSuccess($prod, "Stock updated successfully");
?>
