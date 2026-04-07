#include <WiFi.h>
#include <HTTPClient.h>
#include <Adafruit_Fingerprint.h>

// ----- CONFIGURATION ----- //
const char* ssid = "Hostel_WiFi_5G";        // Must match backend AUTHORIZED_SSIDS
const char* password = "Your_WiFi_Password";
const char* backendURL = "https://hostel-problem-detection-and-resolution-ic6i.onrender.com/api/attendance/mark"; 

// ----- FINGERPRINT SENSOR SECRETS ----- //
// ESP32 Hardware Serial 2 pins
#define mySerial Serial2 

Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);

void setup() {
  Serial.begin(115200);
  delay(100);
  
  // Connect to WiFi
  Serial.print("\nConnecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected.");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  // Initialize Fingerprint Sensor
  Serial.println("\n\nReady to verify fingerprints...");
  finger.begin(57600);
  delay(5);
  
  if (finger.verifyPassword()) {
    Serial.println("Found fingerprint sensor!");
  } else {
    Serial.println("Did not find fingerprint sensor :(");
    while (1) { delay(1); } // Halt
  }
}

void loop() {
  getFingerprintID(); // Continuously scan for fingers
  delay(50);          // Polling rate
}

uint8_t getFingerprintID() {
  uint8_t p = finger.getImage();
  if (p != FINGERPRINT_OK) return p;

  p = finger.image2Tz();
  if (p != FINGERPRINT_OK) return p;

  p = finger.fingerSearch();
  if (p != FINGERPRINT_OK) {
    Serial.println("Fingerprint not found in database.");
    return p;
  }

  // Found a match!
  Serial.print("Found ID #"); Serial.print(finger.fingerID);
  Serial.print(" with confidence of "); Serial.println(finger.confidence);

  // Send Data to Backend
  markAttendance(finger.fingerID);

  // Prevent multiple pings immediately
  delay(3000); 
  
  return finger.fingerID;
}

void markAttendance(int fingerID) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(backendURL); 
    http.addHeader("Content-Type", "application/json");

    // Construct JSON Payload
    // By sending the SSID, the backend verifies we are at the expected location.
    String httpRequestData = "{\"fingerprintId\":" + String(fingerID) + ", \"ssid\":\"" + String(WiFi.SSID()) + "\"}";           

    Serial.print("Sending Payload: ");
    Serial.println(httpRequestData);

    int httpResponseCode = http.POST(httpRequestData);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.print("HTTP Code: "); Serial.println(httpResponseCode);
      Serial.println("Response: " + response);
    } else {
      Serial.print("Error code: "); Serial.println(httpResponseCode);
    }
    http.end();
  } else {
    Serial.println("Error: WiFi Disconnected");
  }
}
