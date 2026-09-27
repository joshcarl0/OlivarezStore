<?php
// get_orders.php - Fetch orders for a student
require_once "config.php";

$student_id = trim($_GET["student_id"] ?? "");
if (empty($student_id)) {
    sendError("student_id parameter is required", 400);
}

$db = getDB();
$stmt = $db->prepare("SELECT id, order_code, student_id, status, total_amount, pickup_day, time_slot, payment_method, created_at FROM orders WHERE student_id = ? ORDER BY id DESC");
$stmt->bind_param("s", $student_id);
$stmt->execute();
$res = $stmt->get_result();

$orders = [];
while ($row = $res->fetch_assoc()) {
    $order_id = $row["id"];
    // Get items
    $itemStmt = $db->prepare("SELECT oi.id, oi.product_id, p.name as product_name, oi.size, oi.quantity, oi.unit_price FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?");
    $itemStmt->bind_param("i", $order_id);
    $itemStmt->execute();
    $itemRes = $itemStmt->get_result();

    $items = [];
    $itemSummaryArr = [];
    while ($itemRow = $itemRes->fetch_assoc()) {
        $items[] = $itemRow;
        $itemSummaryArr[] = $itemRow["quantity"] . "x " . ($itemRow["product_name"] ?? "Item");
    }

    $row["items"] = $items;
    $row["details"] = !empty($itemSummaryArr) ? implode(", ", $itemSummaryArr) : "Uniform items";
    $orders[] = $row;
}

sendSuccess($orders, "Orders retrieved successfully");
