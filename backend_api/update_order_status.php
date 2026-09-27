<?php
// update_order_status.php - Update order status (Ready, Completed, Cancelled)
require_once "config.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    sendError("Method not allowed", 405);
}

$input   = getInput();
$orderId = intval($input["order_id"] ?? 0);
$status  = trim($input["status"] ?? "");

$allowed = ["Pending", "Processing", "Ready", "Completed", "Cancelled"];
if (!in_array($status, $allowed, true)) {
    sendError("Invalid status value", 400);
}

if ($orderId <= 0) {
    sendError("Valid order_id is required", 400);
}

$db = getDB();
$stmt = $db->prepare("UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?");
$stmt->bind_param("si", $status, $orderId);

if (!$stmt->execute()) {
    sendError("Failed to update order: " . $db->error, 500);
}

sendSuccess(["order_id" => $orderId, "new_status" => $status], "Order status updated to " . $status);
?>
