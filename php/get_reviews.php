<?php

require_once "config.php";

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

try {
    $sql = "SELECT r.id, r.rating, r.review_text, r.user_name, r.created_at,
            s.name as station_name, s.city
            FROM reviews r 
            JOIN stations s ON r.station_id = s.id 
            ORDER BY r.created_at DESC 
            LIMIT 15";
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    if ($stmt->execute()) {
        $result = $stmt->get_result();
        $reviews = [];
        
        while ($row = $result->fetch_assoc()) {
            // Sanitize output
            $review = [
                'id' => $row['id'],
                'rating' => intval($row['rating']),
                'review_text' => htmlspecialchars($row['review_text'], ENT_QUOTES, 'UTF-8'),
                'user_name' => htmlspecialchars($row['user_name'], ENT_QUOTES, 'UTF-8'),
                'station_name' => htmlspecialchars($row['station_name'], ENT_QUOTES, 'UTF-8'),
                'city' => htmlspecialchars($row['city'] ?? '', ENT_QUOTES, 'UTF-8'),
                'created_at' => $row['created_at']
            ];
            $reviews[] = $review;
        }
        
        echo json_encode($reviews, JSON_PRETTY_PRINT);
        
    } else {
        throw new Exception("Query execution failed: " . $stmt->error);
    }
    
    $stmt->close();
    
} catch (Exception $e) {
    log_error("get_reviews.php error: " . $e->getMessage());
    
    // Return error response
    $error_response = [
        'error' => true,
        'message' => 'Failed to fetch reviews: ' . $e->getMessage(),
        'reviews' => []
    ];
    
    echo json_encode($error_response);
}

$conn->close();
?>