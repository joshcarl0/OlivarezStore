<?php
// get_staff_orders.php - Fetch orders for Store Staff / Cashier Portal
require_once "config.php";

$status = trim($_GET["status"] ?? "");
$search = trim($_GET["search"] ?? "");

$db = getDB();

$query = "
    SELECT 
        o.id, 
        o.order_code, 
        o.student_id, 
        o.status, 
        o.total_amount, 
        o.pickup_day, 
        o.time_slot, 
        o.payment_method, 
        o.created_at,
        s.first_name, 
        s.last_name, 
        s.department, 
        s.course_strand, 
        s.mobile, 
        s.email
    FROM orders o
    LEFT JOIN students s ON o.student_id = s.student_id
    WHERE 1=1
";

$params = [];
$types  = "";

if (!empty($status) && $status !== "All") {
    $query .= " AND o.status = ?";
    $params[] = $status;
    $types   .= "s";
}

if (!empty($search)) {
    $query .= " AND (o.order_code LIKE ? OR o.student_id LIKE ? OR s.first_name LIKE ? OR s.last_name LIKE ?)";
    $like = "%{$search}%";
    $params[] = $like;
    $params[] = $like;
    $params[] = $like;
    $params[] = $like;
    $types   .= "ssss";
}

$query .= " ORDER BY o.id DESC";

$stmt = $db->prepare($query);
if (!empty($params)) {
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$ordersResult = $stmt->get_result();

$orders = [];
while ($row = $ordersResult->fetch_assoc()) {
    $orderId = $row["id"];

    // Fetch items for this order
    $itemStmt = $db->prepare("
        SELECT 
            oi.id, 
            oi.product_id, 
            oi.size, 
            oi.quantity, 
            oi.unit_price, 
            p.name AS product_name, 
            p.category, 
            p.gender, 
            p.department
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
    ");
    $itemStmt->bind_param("i", $orderId);
    $itemStmt->execute();
    $itemsResult = $itemStmt->get_result();

    $items = [];
    while ($item = $itemsResult->fetch_assoc()) {
        $items[] = $item;
    }

    $row["items"] = $items;
    $orders[] = $row;
}

sendSuccess($orders, "Orders retrieved successfully");
?>
