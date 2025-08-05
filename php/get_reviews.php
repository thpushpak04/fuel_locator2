<?php
// php/get_reviews.php

// Error reporting (development ke liye)
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

try {
    require_once "config.php";

    // Sabse naye 5 reviews fetch karein, station ke naam ke saath join karke
    $sql = "SELECT 
                r.user_name, 
                r.rating, 
                r.review_text, 
                s.name as station_name
            FROM 
                reviews r
            JOIN 
                stations s ON r.station_id = s.id
            ORDER BY 
                r.created_at DESC
            LIMIT 5";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Statement prepare karne mein error: " . $conn->error);
    }

    $stmt->execute();
    $result = $stmt->get_result();
    $reviews = $result->fetch_all(MYSQLI_ASSOC);

    $stmt->close();
    $conn->close();

    echo json_encode($reviews);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Server par ek error aayi.',
        'error_details' => $e->getMessage()
    ]);
}
?>
