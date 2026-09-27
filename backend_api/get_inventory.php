<?php
// get_inventory.php - Get all products with stock and department filters
require_once "config.php";

$db = getDB();
$dept = trim($_GET["department"] ?? "");
$search = trim($_GET["search"] ?? "");

$sql = "SELECT id, name, description, category, department, course_strand, gender, price, stock, image_url, sizes, is_active FROM products WHERE is_active = 1";
$params = [];
$types = "";

$course = trim($_GET["course"] ?? "");
if (!empty($dept) && $dept !== "All") {
    $sql .= " AND department = ?";
    $params[] = $dept;
    $types .= "s";
}

if (!empty($course) && $course !== "All") {
    $sql .= " AND (course_strand = ? OR course_strand = 'All')";
    $params[] = $course;
    $types .= "s";
}

if (!empty($search)) {
    $sql .= " AND (name LIKE ? OR category LIKE ?)";
    $like = "%{$search}%";
    $params[] = $like;
    $params[] = $like;
    $types .= "ss";
}

$sql .= " ORDER BY department, category, name";

$stmt = $db->prepare($sql);
if (!empty($params)) {
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$res = $stmt->get_result();

$products = [];
while ($row = $res->fetch_assoc()) {
    $products[] = $row;
}

sendSuccess($products, "Inventory retrieved");
?>
