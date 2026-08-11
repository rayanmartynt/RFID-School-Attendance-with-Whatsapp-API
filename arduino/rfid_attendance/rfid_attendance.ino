/*
 * Smart School Attendance System - Arduino UNO R4 WiFi with RC522 RFID Reader
 * 
 * This firmware reads RFID cards and sends attendance data to the backend server.
 * Features:
 * - RC522 RFID card reading
 * - WiFi connectivity (Arduino UNO R4 WiFi)
 * - HTTPS communication with backend API
 * - LCD display for user feedback
 * - LED indicators (green/red)
 * - Buzzer for audio feedback
 * - Offline queue for connectivity issues
 * - Device authentication
 */

#include <WiFiS3.h>
#include <WiFiSSLClient.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <MFRC522.h>
#include <LiquidCrystal_I2C.h>

// ==================== CONFIGURATION ====================

// WiFi Configuration
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Server Configuration
const char* SERVER_HOST = "your-server.com";  // Change to your server domain or IP
const int SERVER_PORT = 443;  // HTTPS port
const char* API_ENDPOINT = "/api/v1/attendance/tap";

// Device Configuration
const char* DEVICE_ID = "GATE-001";
const char* API_KEY = "gate001_api_key_secret";  // Must match database

// Attendance Rules
const unsigned long DUPLICATE_COOLDOWN_MS = 300000;  // 5 minutes cooldown
const int MAX_OFFLINE_RECORDS = 50;

// ==================== HARDWARE PIN DEFINITIONS ====================

// RC522 RFID Reader
#define SS_PIN 10
#define RST_PIN 9

// LED Pins
#define GREEN_LED_PIN 5
#define RED_LED_PIN 6

// Buzzer Pin
#define BUZZER_PIN 7

// ==================== GLOBAL OBJECTS ====================

MFRC522 rfid(SS_PIN, RST_PIN);
LiquidCrystal_I2C lcd(0x27, 16, 2);  // I2C address 0x27, 16x2 display

WiFiSSLClient client;

// Offline queue structure
struct OfflineRecord {
  String rfidUid;
  unsigned long timestamp;
};

OfflineRecord offlineQueue[MAX_OFFLINE_RECORDS];
int offlineQueueCount = 0;

// Last scanned card tracking
String lastScannedUid = "";
unsigned long lastScanTime = 0;

// ==================== SETUP ====================

void setup() {
  Serial.begin(9600);
  while (!Serial);

  Serial.println("========================================");
  Serial.println("RFID Attendance System - Arduino UNO R4");
  Serial.println("========================================");

  // Initialize hardware
  initializeHardware();
  
  // Connect to WiFi
  connectWiFi();
  
  // Initialize RFID reader
  initializeRFID();
  
  // Display ready message
  displayReady();
  
  Serial.println("System ready. Waiting for RFID cards...");
}

// ==================== MAIN LOOP ====================

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    connectWiFi();
  }
  
  // Process offline queue if WiFi is available
  if (WiFi.status() == WL_CONNECTED && offlineQueueCount > 0) {
    processOfflineQueue();
  }
  
  // Check for RFID card
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    processRFIDCard();
  }
  
  delay(100);  // Small delay to prevent overwhelming the system
}

// ==================== HARDWARE INITIALIZATION ====================

void initializeHardware() {
  Serial.println("Initializing hardware...");
  
  // Initialize LED pins
  pinMode(GREEN_LED_PIN, OUTPUT);
  pinMode(RED_LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  
  // Turn off LEDs initially
  digitalWrite(GREEN_LED_PIN, LOW);
  digitalWrite(RED_LED_PIN, LOW);
  
  // Initialize LCD
  Wire.begin();
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Initializing...");
  
  Serial.println("Hardware initialized.");
}

void initializeRFID() {
  Serial.println("Initializing RFID reader...");
  
  SPI.begin();
  rfid.PCD_Init();
  
  // Set RFID reader gain
  rfid.PCD_SetAntennaGain(rfid.RxGain_max);
  
  // Show RFID reader version
  byte version = rfid.PCD_ReadRegister(rfid.VersionReg);
  Serial.print("RFID Reader Version: 0x");
  Serial.println(version, HEX);
  
  Serial.println("RFID reader initialized.");
}

// ==================== WIFI CONNECTION ====================

void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Connecting...");
  lcd.setCursor(0, 1);
  lcd.print(WIFI_SSID);
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Connected");
    lcd.setCursor(0, 1);
    lcd.print(WiFi.localIP());
    
    blinkGreenLED(3);
  } else {
    Serial.println("\nWiFi connection failed!");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Failed");
    lcd.setCursor(0, 1);
    lcd.print("Offline Mode");
    
    blinkRedLED(3);
  }
  
  delay(2000);
}

// ==================== RFID CARD PROCESSING ====================

void processRFIDCard() {
  // Get RFID UID
  String uid = getRFIDUid();
  
  Serial.print("Card detected: ");
  Serial.println(uid);
  
  // Check for duplicate scan within cooldown period
  unsigned long currentTime = millis();
  if (uid == lastScannedUid && (currentTime - lastScanTime) < DUPLICATE_COOLDOWN_MS) {
    Serial.println("Duplicate scan ignored (cooldown period)");
    displayDuplicate();
    blinkRedLED(2);
    return;
  }
  
  // Update last scan tracking
  lastScannedUid = uid;
  lastScanTime = currentTime;
  
  // Display processing message
  displayProcessing(uid);
  
  // Send to server or queue offline
  if (WiFi.status() == WL_CONNECTED) {
    sendToServer(uid);
  } else {
    queueOffline(uid);
  }
  
  // Halt PICC
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}

String getRFIDUid() {
  String uidString = "";
  
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) {
      uidString += "0";
    }
    uidString += String(rfid.uid.uidByte[i], HEX);
    
    if (i < rfid.uid.size - 1) {
      uidString += " ";
    }
  }
  
  uidString.toUpperCase();
  return uidString;
}

// ==================== SERVER COMMUNICATION ====================

void sendToServer(String rfidUid) {
  Serial.println("Sending to server...");
  
  // Create JSON payload
  StaticJsonDocument<200> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["rfidUid"] = rfidUid;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.print("Payload: ");
  Serial.println(jsonString);
  
  // Connect to server
  if (client.connect(SERVER_HOST, SERVER_PORT)) {
    Serial.println("Connected to server");
    
    // Send HTTP POST request
    client.print("POST ");
    client.print(API_ENDPOINT);
    client.println(" HTTP/1.1");
    client.print("Host: ");
    client.println(SERVER_HOST);
    client.println("Content-Type: application/json");
    client.print("X-API-Key: ");
    client.println(API_KEY);
    client.print("Content-Length: ");
    client.println(jsonString.length());
    client.println("Connection: close");
    client.println();
    client.println(jsonString);
    
    // Read response
    String response = "";
    bool headersReceived = false;
    
    while (client.connected()) {
      if (client.available()) {
        char c = client.read();
        
        if (!headersReceived) {
          if (c == '\r' || c == '\n') {
            headersReceived = true;
          }
        } else {
          response += c;
        }
      }
    }
    
    client.stop();
    
    Serial.print("Server response: ");
    Serial.println(response);
    
    // Parse response
    parseServerResponse(response, rfidUid);
    
  } else {
    Serial.println("Failed to connect to server");
    displayError("Server Error");
    blinkRedLED(3);
    queueOffline(rfidUid);  // Queue for later retry
  }
}

void parseServerResponse(String response, String rfidUid) {
  StaticJsonDocument<300> doc;
  DeserializationError error = deserializeJson(doc, response);
  
  if (error) {
    Serial.print("JSON parsing error: ");
    Serial.println(error.c_str());
    displayError("Invalid Response");
    blinkRedLED(3);
    return;
  }
  
  bool success = doc["success"];
  
  if (success) {
    String personType = doc["personType"];
    String event = doc["event"];
    String name = doc["name"];
    String time = doc["time"];
    
    Serial.print("Success: ");
    Serial.print(personType);
    Serial.print(" - ");
    Serial.print(name);
    Serial.print(" - ");
    Serial.println(event);
    
    // Display success
    displaySuccess(name, event, time);
    blinkGreenLED(2);
    playSuccessSound();
    
  } else {
    String errorMessage = doc["error"];
    Serial.print("Error: ");
    Serial.println(errorMessage);
    
    displayError(errorMessage);
    blinkRedLED(3);
    playErrorSound();
  }
}

// ==================== OFFLINE QUEUE ====================

void queueOffline(String rfidUid) {
  if (offlineQueueCount >= MAX_OFFLINE_RECORDS) {
    Serial.println("Offline queue full!");
    displayError("Queue Full");
    blinkRedLED(3);
    return;
  }
  
  offlineQueue[offlineQueueCount].rfidUid = rfidUid;
  offlineQueue[offlineQueueCount].timestamp = millis();
  offlineQueueCount++;
  
  Serial.print("Queued offline: ");
  Serial.print(rfidUid);
  Serial.print(" (Queue size: ");
  Serial.print(offlineQueueCount);
  Serial.println(")");
  
  displayQueued(offlineQueueCount);
  blinkGreenLED(1);
}

void processOfflineQueue() {
  Serial.println("Processing offline queue...");
  
  for (int i = 0; i < offlineQueueCount; i++) {
    Serial.print("Processing queued record: ");
    Serial.println(offlineQueue[i].rfidUid);
    
    sendToServer(offlineQueue[i].rfidUid);
    delay(1000);  // Delay between requests
  }
  
  // Clear queue after processing
  offlineQueueCount = 0;
  Serial.println("Offline queue processed");
}

// ==================== DISPLAY FUNCTIONS ====================

void displayReady() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Ready");
  lcd.setCursor(0, 1);
  lcd.print("Tap Card");
}

void displayProcessing(String uid) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Processing...");
 .setCursor(0, 1);
  lcd.print(uid.substring(0, 12));
}

void displaySuccess(String name, String event, String time) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(name.substring(0, 16));
  lcd.setCursor(0, 1);
  lcd.print(event + " " + time);
  
  delay(3000);
  displayReady();
}

void displayError(String message) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Error:");
  lcd.setCursor(0, 1);
  lcd.print(message.substring(0, 16));
  
  delay(3000);
  displayReady();
}

void displayDuplicate() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Duplicate");
  lcd.setCursor(0, 1);
  lcd.print("Scan");
  
  delay(2000);
  displayReady();
}

void displayQueued(int count) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Queued");
  lcd.setCursor(0, 1);
  lcd.print("Count: " + String(count));
  
  delay(2000);
  displayReady();
}

// ==================== LED FUNCTIONS ====================

void blinkGreenLED(int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(GREEN_LED_PIN, HIGH);
    delay(100);
    digitalWrite(GREEN_LED_PIN, LOW);
    delay(100);
  }
}

void blinkRedLED(int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(RED_LED_PIN, HIGH);
    delay(100);
    digitalWrite(RED_LED_PIN, LOW);
    delay(100);
  }
}

// ==================== SOUND FUNCTIONS ====================

void playSuccessSound() {
  tone(BUZZER_PIN, 1000, 200);
  delay(250);
  tone(BUZZER_PIN, 1500, 200);
  delay(250);
  noTone(BUZZER_PIN);
}

void playErrorSound() {
  tone(BUZZER_PIN, 500, 300);
  delay(350);
  tone(BUZZER_PIN, 300, 300);
  delay(350);
  noTone(BUZZER_PIN);
}
