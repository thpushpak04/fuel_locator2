<?php
// File: php/config.php
// Database configuration file with error handling

$servername = "localhost";
$username = "root";        
$password = "";            
$dbname = "fuel_station_db";

try {
    // Create connection with error handling
    $conn = new mysqli($servername, $username, $password, $dbname);
    
    // Check connection
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }
    
    // Set charset to utf8
    $conn->set_charset("utf8");
    
} catch (Exception $e) {
    // Log error and provide user-friendly message
    error_log("Database connection error: " . $e->getMessage());
    
    // For development, show error. For production, hide it.
    if ($_SERVER['SERVER_NAME'] === 'localhost' || $_SERVER['SERVER_NAME'] === '127.0.0.1') {
        die("Database connection failed: " . $e->getMessage());
    } else {
        die("Database connection failed. Please try again later.");
    }
}

// Function to sanitize input
function sanitize_input($data) {
    global $conn;
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $conn->real_escape_string($data);
}

// Function to validate email
function validate_email($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

// Function to log errors
function log_error($message) {
    error_log(date('Y-m-d H:i:s') . " - " . $message . PHP_EOL, 3, "errors.log");
}
?>