<?php

require_once "config.php";

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

$response = ['status' => 'error', 'message' => 'Invalid request.'];

try {
    if (isset($_GET['id']) && is_numeric($_GET['id'])) {
        $station_id = intval($_GET['id']);
        
        if ($station_id <= 0) {
            throw new Exception("Invalid station ID provided");
        }

        $sql = "SELECT * FROM stations WHERE id = ?";
        
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }
        
        $stmt->bind_param("i", $station_id);

        if ($stmt->execute()) {
            $result = $stmt->get_result();
            
            if ($station = $result->fetch_assoc()) {
                // Format date to Indian format (dd-mm-yyyy)
                if ($station['establishment_date'] && $station['establishment_date'] !== '0000-00-00') {
                    try {
                        $date = new DateTime($station['establishment_date']);
                        $station['establishment_date_formatted'] = $date->format('d-m-Y');
                    } catch (Exception $e) {
                        $station['establishment_date_formatted'] = 'N/A';
                    }
                } else {
                    $station['establishment_date_formatted'] = 'N/A';
                }
                
                // Ensure all fields have default values
                $station['operator_name'] = $station['operator_name'] ?? 'Not specified';
                $station['company_type'] = $station['company_type'] ?? 'Private';
                $station['phone'] = $station['phone'] ?? 'Not available';
                $station['email'] = $station['email'] ?? 'Not available';
                
                $response = ['status' => 'success', 'data' => $station];
                
            } else {
                $response['message'] = 'Station not found with ID: ' . $station_id;
            }
        } else {
            throw new Exception("Query execution failed: " . $stmt->error);
        }
        
        $stmt->close();
        
    } else {
        $response['message'] = 'Station ID is required and must be a valid number.';
    }
    
} catch (Exception $e) {
    log_error("get_station_details.php error: " . $e->getMessage());
    $response['message'] = 'Server error: ' . $e->getMessage();
}

$conn->close();
echo json_encode($response, JSON_PRETTY_PRINT);
?>