<?php
// get_analytics.php - Executive KPI dashboard data for Super Admin
require_once "config.php";

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

$db = getDB();

// 1. Total Revenue (Completed & Ready orders)
$revRes = $db->query("SELECT 
    COALESCE(SUM(total_amount), 0) AS total_sales,
    COALESCE(SUM(CASE WHEN status = 'Completed' THEN total_amount ELSE 0 END), 0) AS completed_sales,
    COALESCE(SUM(CASE WHEN status = 'Pending' OR status = 'Ready' THEN total_amount ELSE 0 END), 0) AS pending_sales
    FROM orders");
$revData = $revRes ? $revRes->fetch_assoc() : ["total_sales" => 0, "completed_sales" => 0, "pending_sales" => 0];

// 2. Order Status Counts
$orderCountRes = $db->query("SELECT 
    COUNT(*) AS total_orders,
    SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed_orders,
    SUM(CASE WHEN status = 'Ready' THEN 1 ELSE 0 END) AS ready_orders,
    SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending_orders
    FROM orders");
$orderCounts = $orderCountRes ? $orderCountRes->fetch_assoc() : ["total_orders" => 0, "completed_orders" => 0, "ready_orders" => 0, "pending_orders" => 0];

// 3. Total Students & Staff
$studentCountRes = $db->query("SELECT COUNT(*) AS total_students FROM students");
$totalStudents = $studentCountRes ? $studentCountRes->fetch_assoc()["total_students"] : 0;

$staffCountRes = $db->query("SELECT COUNT(*) AS total_staff FROM staff_users");
$totalStaff = $staffCountRes ? $staffCountRes->fetch_assoc()["total_staff"] : 0;

// 4. Products & Low Stock
$prodCountRes = $db->query("SELECT 
    COUNT(*) AS total_products,
    SUM(CASE WHEN stock <= 15 THEN 1 ELSE 0 END) AS low_stock_count,
    SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) AS out_of_stock_count
    FROM products WHERE is_active = 1");
$prodCounts = $prodCountRes ? $prodCountRes->fetch_assoc() : ["total_products" => 0, "low_stock_count" => 0, "out_of_stock_count" => 0];

// 5. Low Stock Alert List (Products with stock <= 20)
$lowStockRes = $db->query("SELECT id, name, category, department, course_strand, stock, price 
    FROM products WHERE is_active = 1 AND stock <= 20 ORDER BY stock ASC LIMIT 10");
$lowStockItems = [];
if ($lowStockRes) {
    while ($row = $lowStockRes->fetch_assoc()) {
        $lowStockItems[] = $row;
    }
}

// 6. Distribution of Uniforms by Department
$deptRes = $db->query("SELECT department, COUNT(*) AS count, SUM(stock) AS total_inventory 
    FROM products WHERE is_active = 1 GROUP BY department");
$deptStats = [];
if ($deptRes) {
    while ($row = $deptRes->fetch_assoc()) {
        $deptStats[] = $row;
    }
}

// 7. College Uniforms breakdown by Course
$courseRes = $db->query("SELECT course_strand, COUNT(*) AS count, SUM(stock) AS total_inventory 
    FROM products WHERE is_active = 1 AND department = 'College' GROUP BY course_strand");
$courseStats = [];
if ($courseRes) {
    while ($row = $courseRes->fetch_assoc()) {
        $courseStats[] = $row;
    }
}

// 8. Recent 8 Orders
$recentRes = $db->query("SELECT o.id, o.order_code, o.total_amount, o.status, o.pickup_day, o.time_slot, o.created_at,
    o.student_id, CONCAT(COALESCE(s.first_name, ''), ' ', COALESCE(s.last_name, '')) AS student_name, 
    s.department, s.course_strand
    FROM orders o
    LEFT JOIN students s ON o.student_id = s.student_id
    ORDER BY o.id DESC LIMIT 8");
$recentOrders = [];
if ($recentRes) {
    while ($row = $recentRes->fetch_assoc()) {
        $recentOrders[] = $row;
    }
}

sendSuccess([
    "revenue" => [
        "total" => floatval($revData["total_sales"] ?? 0),
        "completed" => floatval($revData["completed_sales"] ?? 0),
        "pending" => floatval($revData["pending_sales"] ?? 0),
    ],
    "orders" => [
        "total" => intval($orderCounts["total_orders"] ?? 0),
        "completed" => intval($orderCounts["completed_orders"] ?? 0),
        "ready" => intval($orderCounts["ready_orders"] ?? 0),
        "pending" => intval($orderCounts["pending_orders"] ?? 0),
    ],
    "users" => [
        "students" => intval($totalStudents),
        "staff" => intval($totalStaff),
    ],
    "inventory" => [
        "total_products" => intval($prodCounts["total_products"] ?? 0),
        "low_stock" => intval($prodCounts["low_stock_count"] ?? 0),
        "out_of_stock" => intval($prodCounts["out_of_stock_count"] ?? 0),
        "low_stock_items" => $lowStockItems,
        "by_department" => $deptStats,
        "by_course" => $courseStats,
    ],
    "recent_orders" => $recentOrders,
], "Analytics summary retrieved");
?>
