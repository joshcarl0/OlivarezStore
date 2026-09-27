<?php
// products.php — Get all active products (optionally filter by category)
require_once "config.php";

if ($_SERVER["REQUEST_METHOD"] !== "GET") sendError("Method not allowed", 405);

$db       = getDB();
$category = $_GET["category"] ?? "";

if ($category) {
    $stmt = $db->prepare("SELECT id, name, description, category, department, course_strand, gender, price, stock, image_url, sizes FROM products WHERE is_active = 1 AND category = ? ORDER BY department, category, name");
    $stmt->bind_param("s", $category);
} else {
    $stmt = $db->prepare("SELECT id, name, description, category, department, course_strand, gender, price, stock, image_url, sizes FROM products WHERE is_active = 1 ORDER BY department, category, name");
}
$stmt->execute();
$rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

// Decode sizes JSON or comma-separated string
foreach ($rows as &$row) {
    if (empty($row["sizes"])) {
        $row["sizes"] = ["XS", "S", "M", "L", "XL"];
    } else {
        $decoded = json_decode($row["sizes"], true);
        if (is_array($decoded)) {
            $row["sizes"] = $decoded;
        } else {
            $row["sizes"] = array_map("trim", explode(",", $row["sizes"]));
        }
    }
}

sendSuccess($rows, "Products loaded");
?>
