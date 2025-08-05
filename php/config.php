<?php
// Database configuration
define('DB_SERVER', 'localhost');
define('DB_USERNAME', 'root');
define('DB_PASSWORD', '');
define('DB_NAME', 'fuel_locator');

// Attempt to connect to MySQL database
$conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME);

// Check connection
if($conn === false || $conn->connect_error){
    // Use die() to stop script execution and show an error message.
    // In a production environment, you might want to log this error instead of showing it to the user.
    die("ERROR: Could not connect. " . $conn->connect_error);
}
?>