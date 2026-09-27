<?php
// place_order.php - Create a new student uniform reservation order
require_once "config.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    sendError("Method not allowed", 405);
}

$input = getInput();

$student_id     = trim($input["student_id"] ?? "");
$order_code     = trim($input["order_code"] ?? "");
$total_amount   = floatval($input["total_amount"] ?? 0);
$pickup_day     = trim($input["pickup_day"] ?? "");
$time_slot      = trim($input["time_slot"] ?? "");
$payment_method = trim($input["payment_method"] ?? "Hello Money");
$items          = $input["items"] ?? [];

if (empty($student_id)) {
    sendError("student_id is required", 400);
}

if (empty($order_code)) {
    $order_code = "OL-" . rand(1000, 9999);
}

$db = getDB();
$db->begin_transaction();

try {
    $status = "Pending";
    $stmt = $db->prepare("INSERT INTO orders (order_code, student_id, status, total_amount, pickup_day, time_slot, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("sssdsss", $order_code, $student_id, $status, $total_amount, $pickup_day, $time_slot, $payment_method);
    $stmt->execute();
    $order_id = $stmt->insert_id;

    if (!empty($items) && is_array($items)) {
        $itemStmt = $db->prepare("INSERT INTO order_items (order_id, product_id, size, quantity, unit_price) VALUES (?, ?, ?, ?, ?)");
        $stockStmt = $db->prepare("UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?");

        foreach ($items as $item) {
            $p_id  = intval($item["product_id"] ?? 0);
            $size  = $item["size"] ?? "Standard";
            $qty   = max(1, intval($item["quantity"] ?? 1));
            $price = floatval($item["unit_price"] ?? 0);

            if ($p_id > 0) {
                $itemStmt->bind_param("iisid", $order_id, $p_id, $size, $qty, $price);
                $itemStmt->execute();

                // Deduct stock
                $stockStmt->bind_param("ii", $qty, $p_id);
                $stockStmt->execute();
            }
        }
    }

    $db->commit();

    sendSuccess([
        "order_id"       => $order_id,
        "order_code"     => $order_code,
        "total_amount"   => $total_amount,
        "pickup_day"     => $pickup_day,
        "time_slot"      => $time_slot,
        "payment_method" => $payment_method,
        "status"         => $status,
    ], "Order placed successfully");

} catch (Exception $e) {
    $db->rollback();
    sendError("Failed to place order: " . $e->getMessage(), 500);
}
