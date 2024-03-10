<?php
//This code loads the configuration of a station of the Foot Strike Trainer footstriketrainer.com
header('Content-type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Credentials: true');

try {
	require '/home/bitnami/vendor/autoload.php';
} catch (Exception $e) {
    echo "autoload not included"; 
	exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$myObj = new stdClass();
$myObj->email = $data['email'];
$myObj->$pass = $data['pass'];


//Login credentials have been removed for this public example
$servername = "...";		
$username = "...";
$password = "...";
$dbname = "...";
$port = "3306";

//First we will identify if the user has proper username / password to login
$myObj->logged = false;
$myObj->expired = false;

$conn = new mysqli($servername, $username, $password, $dbname);

//test connection
if ($conn->connect_error) {
	$myObj->a = "Connection failed: ";
	$myJSON = json_encode($myObj);
	return;
}else{
	$result = $conn -> query("SET NAMES utf8mb4");
}
//login the user and verify if station is active
$stmt = $conn->prepare("SELECT conf, activeuntil, stationID FROM ftconf WHERE username = ? AND pass = ? ");
if (!$stmt) {
    // Handle prepare error
    error_log("Prepare failed: " . $conn->error);
    // Send a generic error message to the client
    echo json_encode(['error' => $conn->error]);
    exit;
}

$stmt->bind_param("ss", $myObj->email, $myObj->pass);
if (!$stmt->execute()) {
    // Handle execute error
    error_log("Execute failed: " . $stmt->error);
    // Send a generic error message to the client
    echo json_encode(['error' => 'Internal server error2']);
    exit;
}

$reslog = $stmt->get_result();

if ($loged = mysqli_fetch_row($reslog)){
	$myObj->conf = $loged[0];
	$myObj->actuntil = $loged[1];
	$myObj->stationID = $loged[2];
	$date1 = $myObj->actuntil;
	$date2 = date('Y-m-d');
	$myObj->logged = true;
	if ($date1 < $date2){
		$myObj->expired = true;
	}
}


if ($myObj->logged) {
    // Query to get all the configuration settings for the given stationID
    $userQuery = "SELECT userID, settings FROM ftusers WHERE stationID = ?";
    $userStmt = $conn->prepare($userQuery);
    if (!$userStmt) {
        // Handle prepare error
        error_log("User query prepare failed: " . $conn->error);
        echo json_encode(['error' => $conn->error]);
        exit;
    }

    $userStmt->bind_param("i", $myObj->stationID);
    if (!$userStmt->execute()) {
        // Handle execute error
        error_log("User query execute failed: " . $userStmt->error);
        echo json_encode(['error' => 'Internal server error in user query']);
        exit;
    }

    $userResult = $userStmt->get_result();
    $users = [];
    while ($userRow = $userResult->fetch_assoc()) {
        array_push($users, $userRow);
    }

    // Query to get list of users, sessions etc for each user in the station
    $sessionQuery = "SELECT sesID, userID, sesdata FROM ftsessions WHERE stationID = ?";
    $sessionStmt = $conn->prepare($sessionQuery);
    if (!$sessionStmt) {
        // Handle prepare error
        error_log("Session query prepare failed: " . $conn->error);
        echo json_encode(['error' => $conn->error]);
        exit;
    }

    $sessionStmt->bind_param("i", $myObj->stationID);
    if (!$sessionStmt->execute()) {
        // Handle execute error
        error_log("Session query execute failed: " . $sessionStmt->error);
        echo json_encode(['error' => 'Internal server error in session query']);
        exit;
    }

    $sessionResult = $sessionStmt->get_result();
    $sessions = [];
    while ($sessionRow = $sessionResult->fetch_assoc()) {
        array_push($sessions, $sessionRow);
    }

    // Include users and sessions in the response
    $myObj->users = $users;
    $myObj->sessions = $sessions;
}

$conn->close(); //closing connection

$myJSON = json_encode($myObj, JSON_UNESCAPED_UNICODE); 

echo $myJSON;
?>