<?php
// products.php — Get all active products (optionally filter by category)
require_once "config.php";

if ($_SERVER["REQUEST_METHOD"] !== "GET") sendError("Method not allowed", 405);

$db       = getDB();
$category = $_GET["category"] ?? "";

if ($category) {
    $stmt = $db->prepare("SELECT id, name, description, category, price, stock, image_url, sizes FROM products WHERE is_active = 1 AND category = ? ORDER BY category, name");
    $stmt->bind_param("s", $category);
} else {
    $stmt = $db->prepare("SELECT id, name, description, category, price, stock, image_url, sizes FROM products WHERE is_active = 1 ORDER BY category, name");
}
$stmt->execute();
$rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

// Decode sizes JSON
foreach ($rows as &$row) {
    $row["sizes"] = $row["sizes"] ? json_decode($row["sizes"], true) : [];
}

sendSuccess($rows, "Products loaded");
?>
