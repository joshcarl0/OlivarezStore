<?php
// save_product.php - Create or update uniform product
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
$name = trim($input["name"] ?? "");
$category = trim($input["category"] ?? "Tops");
$department = trim($input["department"] ?? "College");
$course_strand = trim($input["course_strand"] ?? "All");
$gender = trim($input["gender"] ?? "Unisex");
$price = floatval($input["price"] ?? 0);
$stock = intval($input["stock"] ?? 0);
$description = trim($input["description"] ?? "");
$image_url = trim($input["image_url"] ?? "");
$sizes = $input["sizes"] ?? "XS,S,M,L,XL";
$is_active = isset($input["is_active"]) ? intval($input["is_active"]) : 1;

if (is_array($sizes)) {
    $sizes = implode(",", $sizes);
}

if (empty($name)) {
    sendError("Product name is required.");
}

if ($price <= 0) {
    sendError("Price must be greater than zero.");
}

$db = getDB();

if ($id > 0) {
    // Update existing product
    $stmt = $db->prepare("UPDATE products SET 
        name = ?, category = ?, department = ?, course_strand = ?, gender = ?, 
        price = ?, stock = ?, description = ?, image_url = ?, sizes = ?, is_active = ? 
        WHERE id = ?");
    $stmt->bind_param("sssssdssssii", $name, $category, $department, $course_strand, $gender, $price, $stock, $description, $image_url, $sizes, $is_active, $id);
    
    if ($stmt->execute()) {
        sendSuccess(["id" => $id], "Product updated successfully");
    } else {
        sendError("Failed to update product: " . $stmt->error);
    }
} else {
    // Insert new product
    $stmt = $db->prepare("INSERT INTO products 
        (name, category, department, course_strand, gender, price, stock, description, image_url, sizes, is_active) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("sssssdssssi", $name, $category, $department, $course_strand, $gender, $price, $stock, $description, $image_url, $sizes, $is_active);
    
    if ($stmt->execute()) {
        $newId = $db->insert_id;
        sendSuccess(["id" => $newId], "Product added successfully");
    } else {
        sendError("Failed to add product: " . $stmt->error);
    }
}
?>
