<?php
// FOR DEBUGGING ONLY: Display all PHP errors.
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

try {
    require_once "config.php";

    $response = ['status' => 'error', 'message' => 'An unknown error occurred.'];

    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        $input = json_decode(file_get_contents('php://input'), true);

        if (
            !empty($input['station_id']) &&
            !empty($input['name']) &&
            !empty($input['email']) && filter_var($input['email'], FILTER_VALIDATE_EMAIL) &&
            isset($input['rating']) && is_numeric($input['rating']) &&
            !empty($input['review_text'])
        ) {
            $station_id = intval($input['station_id']);
            $name = trim(htmlspecialchars($input['name']));
            $email = trim(htmlspecialchars($input['email']));
            $rating = intval($input['rating']);
            $review_text = trim(htmlspecialchars($input['review_text']));

            $sql = "INSERT INTO reviews (station_id, user_name, user_email, rating, review_text) VALUES (?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($sql);
            if (!$stmt) {
                 throw new Exception('Error preparing statement: ' . $conn->error);
            }
            $stmt->bind_param("isiss", $station_id, $name, $email, $rating, $review_text);

            if ($stmt->execute()) {
                $response['status'] = 'success';
                $response['message'] = 'Review submitted successfully!';
            } else {
                 throw new Exception('Error executing statement: ' . $stmt->error);
            }
            $stmt->close();
        } else {
            $response['message'] = 'Invalid input provided.';
        }
    } else {
        $response['message'] = 'Invalid request method.';
    }

    $conn->close();
    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'A server error occurred.',
        'error_details' => $e->getMessage()
    ]);
}
?>
