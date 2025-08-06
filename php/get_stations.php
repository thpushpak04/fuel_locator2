<?php

require_once "config.php";

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

$response = [];

try {
    if (isset($_GET['city']) && !empty(trim($_GET['city']))) {
        // Search by city name
        $city = sanitize_input($_GET['city']);
        
        $sql = "SELECT id, name, address, city, latitude, longitude, 
                operator_name, company_type, establishment_date, phone, email,
                NULL as distance
                FROM stations 
                WHERE city LIKE ? OR address LIKE ? OR name LIKE ?
                ORDER BY name
                LIMIT 50";
                
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }
        
        $searchTerm = "%" . $city . "%";
        $stmt->bind_param("sss", $searchTerm, $searchTerm, $searchTerm);
        
    } elseif (isset($_GET['lat']) && isset($_GET['lon']) && 
              is_numeric($_GET['lat']) && is_numeric($_GET['lon'])) {
        // Search by location (latitude, longitude) with distance calculation
        $lat = floatval($_GET['lat']);
        $lon = floatval($_GET['lon']);
        
        // Validate coordinates
        if ($lat < -90 || $lat > 90 || $lon < -180 || $lon > 180) {
            throw new Exception("Invalid coordinates provided");
        }
        
        // Calculate distance using Haversine formula
        $sql = "SELECT id, name, address, city, latitude, longitude, 
                       operator_name, company_type, establishment_date, phone, email,
                       ROUND((6371 * acos(cos(radians(?)) * cos(radians(latitude)) * 
                       cos(radians(longitude) - radians(?)) + sin(radians(?)) * 
                       sin(radians(latitude)))), 2) AS distance 
                FROM stations 
                WHERE latitude IS NOT NULL AND longitude IS NOT NULL
                HAVING distance < 100 
                ORDER BY distance 
                LIMIT 50";
        
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }
        
        $stmt->bind_param("ddd", $lat, $lon, $lat);
        
    } else {
        // Default: return stations from major cities
        $sql = "SELECT id, name, address, city, latitude, longitude, 
                       operator_name, company_type, establishment_date, phone, email,
                       NULL as distance
                FROM stations 
                WHERE city IN ('New Delhi', 'Gurugram', 'Noida', 'Faridabad')
                ORDER BY city, name 
                LIMIT 20";
                
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }
    }
    
    if ($stmt->execute()) {
        $result = $stmt->get_result();
        $stations = [];
        
        while ($row = $result->fetch_assoc()) {
            // Ensure all required fields are present
            $station = [
                'id' => $row['id'],
                'name' => $row['name'] ?? 'Unknown Station',
                'address' => $row['address'] ?? 'Address not available',
                'city' => $row['city'] ?? 'Unknown City',
                'latitude' => $row['latitude'],
                'longitude' => $row['longitude'],
                'operator_name' => $row['operator_name'] ?? 'Not specified',
                'company_type' => $row['company_type'] ?? 'Private',
                'establishment_date' => $row['establishment_date'],
                'phone' => $row['phone'] ?? 'Not available',
                'email' => $row['email'] ?? 'Not available',
                'distance' => $row['distance']
            ];
            $stations[] = $station;
        }
        
        // Return the stations
        echo json_encode($stations, JSON_PRETTY_PRINT);
        
    } else {
        throw new Exception("Database query execution failed: " . $stmt->error);
    }
    
    $stmt->close();
    
} catch (Exception $e) {
    log_error("get_stations.php error: " . $e->getMessage());
    
    // Return error response
    $error_response = [
        'error' => true,
        'message' => 'Failed to fetch stations: ' . $e->getMessage()
    ];
    
    echo json_encode($error_response);
}

$conn->close();
?>