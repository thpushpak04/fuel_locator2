<?php
// FOR DEBUGGING ONLY: Display all PHP errors. Remove this in a live environment.
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Set the header to return JSON content
header('Content-Type: application/json');

try {
    // Include the database configuration file.
    require_once "config.php";

    $stations = [];

    // Check if latitude and longitude are provided for location-based search
    if (isset($_GET['lat']) && isset($_GET['lon'])) {
        $lat = (float)$_GET['lat'];
        $lon = (float)$_GET['lon'];
        $radius = 25; // Search within 25 KM radius

        // Haversine formula to calculate distance in kilometers
        // 6371 is the approximate radius of the Earth in km
        $sql = "SELECT id, name, address, city, state, 
                    ( 6371 * acos( cos( radians(?) ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians(?) ) + sin( radians(?) ) * sin( radians( latitude ) ) ) ) AS distance 
                FROM stations 
                HAVING distance < ? 
                ORDER BY distance 
                LIMIT 15";
        
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception("Error preparing location-based statement: " . $conn->error);
        }
        $stmt->bind_param("dddi", $lat, $lon, $lat, $radius);

    } else { // Fallback to city-based search
        $city = isset($_GET['city']) ? trim(htmlspecialchars($_GET['city'])) : '';
        
        if (!empty($city)) {
            $sql = "SELECT id, name, address, city, state, NULL as distance FROM stations WHERE city LIKE ?";
            $stmt = $conn->prepare($sql);
            if (!$stmt) {
                throw new Exception("Error preparing city-based statement: " . $conn->error);
            }
            $searchTerm = "%" . $city . "%";
            $stmt->bind_param("s", $searchTerm);
        } else {
            // If no city or location is provided, fetch some default stations
            $sql = "SELECT id, name, address, city, state, NULL as distance FROM stations LIMIT 10";
            $stmt = $conn->prepare($sql);
            if (!$stmt) {
                throw new Exception("Error preparing default statement: " . $conn->error);
            }
        }
    }

    if ($stmt->execute()) {
        $result = $stmt->get_result();
        $stations = $result->fetch_all(MYSQLI_ASSOC);
    } else {
        throw new Exception("Error executing statement: " . $stmt->error);
    }

    $stmt->close();
    $conn->close();

    // Success: encode and output the data
    echo json_encode($stations);

} catch (Exception $e) {
    // If any error occurs, catch it and return a JSON error message.
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'A server error occurred.',
        'error_details' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
?>
