#include <WiFi.h>           // For Uno R4 WiFi (ESP32-S3 co-processor)
#include <SPI.h>
#include <MFRC522.h>
#include <LiquidCrystal.h>

// PIN DEFINITIONS
#define SS_PIN    10
#define RST_PIN   9
#define GREEN_LED 5
#define RED_LED   6
#define BUZZER    7
#define LCD_RS    2
#define LCD_EN    3
#define LCD_D4    4
#define LCD_D5    A0
#define LCD_D6    A1
#define LCD_D7    A2

// VARIABLES
const char* ssid       = "R._.t1ny";
const char* password   = "102030401";
const char* serverHost = "172.20.10.3";       // Your computer's local IP
const int serverPort   = 5000;                // or 80 for plain HTTP
const char* apiPath    = "/api/v1/rfid/scan";
const char* apiKey     = "device_xpzw99qvvrl";

MFRC522 rfid(SS_PIN, RST_PIN);
LiquidCrystal lcd(LCD_RS, LCD_EN, LCD_D4, LCD_D5, LCD_D6, LCD_D7);

unsigned long lastScanTime = 0;
const unsigned long scanCooldown = 120000;   // 2 minutes between scans

// Offline queue
struct AttendanceRecord {
  String rfidUid;
  unsigned long timestamp;
};
AttendanceRecord offlineQueue[10];
int queueSize = 0;

WiFiClient client;   // HTTP client (not SSL)

// SETUP
void setup() {
  Serial.begin(115200);

  pinMode(GREEN_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  pinMode(BUZZER, OUTPUT);

  SPI.begin();
  rfid.PCD_Init();

  lcd.begin(16, 2);
  displayMessage("RFID Attendance", "Initializing...");

  // Connect to WiFi
  WiFi.begin(ssid, password);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    displayMessage("WiFi Connected", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\nWiFi connection failed");
    displayMessage("WiFi Failed", "Offline Mode");
  }

  delay(2000);
  displayMessage("Ready to Scan", "Present Card");
}

//MAIN LOOP 
void loop() {
  // Check for new card
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
    delay(50);
    return;
  }

  String rfidUid = getRfidUid();

  if (rfidUid == "") {
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    return;
  }

  unsigned long currentTime = millis();

  // Cooldown check
  if (currentTime - lastScanTime < scanCooldown) {
    displayMessage("Wait...", "Cooldown Active");
    playTone(200, 100);
    delay(1000);
    displayMessage("Ready to Scan", "Present Card");
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    return;
  }

  lastScanTime = currentTime;

  displayMessage("Scanning...", rfidUid.c_str());

  if (WiFi.status() == WL_CONNECTED) {
    if (sendAttendance(rfidUid)) {
      playSuccess();
      displayMessage("Success", "Attendance Recorded");
    } else {
      playError();
      displayMessage("Error", "Server Failed");
      addToQueue(rfidUid);
    }
  } else {
    playError();
    displayMessage("Offline", "Queued");
    addToQueue(rfidUid);
  }

  delay(2000);

  // Try to sync offline queue
  if (queueSize > 0 && WiFi.status() == WL_CONNECTED) {
    processQueue();
  }

  displayMessage("Ready to Scan", "Present Card");
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}

//HELPER FUNCTIONS

// Read UID from RFID card as a hex string
String getRfidUid() {
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) {
      uid += "0";
    }
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  return uid;
}

// Send attendance to server via manual HTTP POST
bool sendAttendance(String rfidUid) {
  if (!client.connect(serverHost, serverPort)) {
    Serial.println("Connection failed");
    return false;
  }

  String jsonData = "{\"rfid_uid\":\"" + rfidUid + "\",\"device_id\":\"GATE-001\"}";

  // Build HTTP request
  client.print("POST ");
  client.print(apiPath);
  client.println(" HTTP/1.1");
  client.print("Host: ");
  client.println(serverHost);
  client.println("Content-Type: application/json");
  client.print("X-API-Key: ");
  client.println(apiKey);
  client.print("Content-Length: ");
  client.println(jsonData.length());
  client.println("Connection: close");
  client.println();
  client.println(jsonData);

  // Wait for response (timeout 5 sec)
  unsigned long timeout = millis();
  while (!client.available()) {
    if (millis() - timeout > 5000) {
      client.stop();
      Serial.println("Server timeout");
      return false;
    }
  }

  // Read first line of response to get status code
  String statusLine = client.readStringUntil('\n');
  client.stop();

  // Check for "200 OK"
  if (statusLine.indexOf("200 OK") >= 0) {
    Serial.println("Attendance sent successfully");
    return true;
  } else {
    Serial.println("Server returned error: " + statusLine);
    return false;
  }
}

// Add a failed scan to the offline queue
void addToQueue(String rfidUid) {
  if (queueSize < 10) {
    offlineQueue[queueSize].rfidUid = rfidUid;
    offlineQueue[queueSize].timestamp = millis();
    queueSize++;
    Serial.println("Added to offline queue");
  } else {
    Serial.println("Queue full – record dropped");
  }
}

// Process all queued records (call when WiFi is back)
void processQueue() {
  displayMessage("Syncing...", "Offline Records");

  for (int i = 0; i < queueSize; i++) {
    if (sendAttendance(offlineQueue[i].rfidUid)) {
      // Shift remaining records to fill the gap
      for (int j = i; j < queueSize - 1; j++) {
        offlineQueue[j] = offlineQueue[j + 1];
      }
      queueSize--;
      i--; // re-check the same index
    }
  }

  displayMessage("Sync Complete", "Ready to Scan");
  delay(1000);
}

// Display two lines on the LCD
void displayMessage(String line1, String line2) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(line1);
  lcd.setCursor(0, 1);
  lcd.print(line2);
}

// Success feedback: green LED + two beeps
void playSuccess() {
  digitalWrite(GREEN_LED, HIGH);
  playTone(1000, 200);
  delay(100);
  playTone(1500, 200);
  digitalWrite(GREEN_LED, LOW);
}

// Error feedback: red LED + two low beeps
void playError() {
  digitalWrite(RED_LED, HIGH);
  playTone(500, 300);
  delay(100);
  playTone(400, 300);
  digitalWrite(RED_LED, LOW);
}

// Generate a tone on the buzzer
void playTone(int frequency, int duration) {
  tone(BUZZER, frequency, duration);
  delay(duration);
  noTone(BUZZER);
}