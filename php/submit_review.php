<?php

require_once "config.php";

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$response = ['status' => 'error', 'message' => 'Invalid request method.'];

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Get JSON input
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            throw new Exception("Invalid JSON data received");
        }
        
        // Validate required fields
        $required_fields = ['station_id', 'name', 'email', 'rating', 'review_text'];
        foreach ($required_fields as $field) {
            if (!isset($input[$field]) || empty(trim($input[$field]))) {
                throw new Exception("Field '$field' is required and cannot be empty");
            }
        }
        
        // Sanitize and validate input
        $station_id = intval($input['station_id']);
        $name = sanitize_input($input['name']);
        $email = sanitize_input($input['email']);
        $rating = intval($input['rating']);
        $review_text = sanitize_input($input['review_text']);
        
        // Additional validation
        if ($station_id <= 0) {
            throw new Exception("Invalid station ID");
        }
        
        if (strlen($name) < 2 || strlen($name) > 100) {
            throw new Exception("Name must be between 2 and 100 characters");
        }
        
        if (!validate_email($email)) {
            throw new Exception("Invalid email address");
        }
        
        if ($rating < 1 || $rating > 5) {
            throw new Exception("Rating must be between 1 and 5");
        }
        
        if (strlen($review_text) < 10 || strlen($review_text) > 1000) {
            throw new Exception("Review must be between 10 and 1000 characters");
        }
        
        // Check if station exists
        $check_sql = "SELECT id FROM stations WHERE id = ?";
        $check_stmt = $conn->prepare($check_sql);
        if (!$check_stmt) {
            throw new Exception("Database prepare error: " . $conn->error);
        }
        
        $check_stmt->bind_param("i", $station_id);
        $check_stmt->execute();
        $check_result = $check_stmt->get_result();
        
        if ($check_result->num_rows === 0) {
            throw new Exception("Station not found");
        }
        $check_stmt->close();
        
        // Check for duplicate review (same email for same station)
        $duplicate_sql = "SELECT id FROM reviews WHERE station_id = ? AND user_email = ?";
        $duplicate_stmt = $conn->prepare($duplicate_sql);
        if (!$duplicate_stmt) {
            throw new Exception("Database prepare error: " . $conn->error);
        }
        
        $duplicate_stmt->bind_param("is", $station_id, $email);
        $duplicate_stmt->execute();
        $duplicate_result = $duplicate_stmt->get_result();
        
        if ($duplicate_result->num_rows > 0) {
            throw new Exception("You have already reviewed this station");
        }
        $duplicate_stmt->close();
        
        // Insert review
        $insert_sql = "INSERT INTO reviews (station_id, user_name, user_email, rating, review_text, created_at) 
                       VALUES (?, ?, ?, ?, ?, NOW())";
        
        $insert_stmt = $conn->prepare($insert_sql);
        if (!$insert_stmt) {
            throw new Exception("Database prepare error: " . $conn->error);
        }
        
        $insert_stmt->bind_param("issis", $station_id, $name, $email, $rating, $review_text);
        
        if ($insert_stmt->execute()) {
            $response = [
                'status' => 'success', 
                'message' => 'Thank you! Your review has been submitted successfully.',
                'review_id' => $conn->insert_id
            ];
        } else {
            throw new Exception("Failed to insert review: " . $insert_stmt->error);
        }
        
        $insert_stmt->close();
        
    } else {
        $response['message'] = 'Only POST method is allowed.';
    }
    
} catch (Exception $e) {
    log_error("submit_review.php error: " . $e->getMessage());
    $response = [
        'status' => 'error',
        'message' => $e->getMessage()
    ];
}

$conn->close();
echo json_encode($response, JSON_PRETTY_PRINT);
?>