# Arduino RFID Attendance System

## Hardware Requirements

- Arduino UNO R4 WiFi
- RC522 RFID Reader Module
- LCD 16x2 with I2C adapter
- Green LED
- Red LED
- Buzzer
- Resistors (220Ω for LEDs)
- Jumper wires
- Breadboard

## Wiring Diagram

### RC522 RFID Reader
- SDA (SS) → Pin 10
- SCK → Pin 13
- MOSI → Pin 11
- MISO → Pin 12
- RST → Pin 9
- 3.3V → 3.3V
- GND → GND

### LCD 16x2 (I2C)
- SDA → A4 (SDA)
- SCL → A5 (SCL)
- VCC → 5V
- GND → GND

### LEDs
- Green LED → Pin 5 (with 220Ω resistor to GND)
- Red LED → Pin 6 (with 220Ω resistor to GND)

### Buzzer
- Buzzer → Pin 7 (with 220Ω resistor to GND)

## Library Dependencies

Install the following libraries via Arduino Library Manager:

1. **WiFiS3** - For Arduino UNO R4 WiFi connectivity
2. **ArduinoJson** - For JSON serialization/deserialization
3. **MFRC522** - For RFID card reading
4. **LiquidCrystal_I2C** - For LCD display control

## Configuration

Before uploading, update the configuration in `rfid_attendance.ino`:

```cpp
// WiFi Configuration
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Server Configuration
const char* SERVER_HOST = "your-server.com";  // Your server domain or IP
const int SERVER_PORT = 443;  // HTTPS port

// Device Configuration
const char* DEVICE_ID = "GATE-001";  // Must match database
const char* API_KEY = "gate001_api_key_secret";  // Must match database
```

## Features

### RFID Card Reading
- Reads MIFARE Classic cards and tags
- Extracts unique UID from each card
- Formats UID in hexadecimal (e.g., "A3 7B 91 22")

### Server Communication
- Sends attendance data via HTTPS POST
- Includes device authentication via API key
- Parses JSON responses from server
- Handles success and error responses

### Offline Mode
- Queues attendance records when WiFi is unavailable
- Stores up to 50 records in memory
- Automatically syncs when WiFi reconnects
- Prevents duplicate queue entries

### User Feedback
- LCD display shows status messages
- Green LED indicates successful scan
- Red LED indicates errors
- Buzzer provides audio feedback

### Duplicate Prevention
- 5-minute cooldown period for same card
- Prevents multiple attendance records
- Configurable cooldown duration

## Upload Instructions

1. Connect Arduino UNO R4 WiFi to computer via USB
2. Select "Arduino UNO R4 WiFi" from Tools > Board
3. Select the correct COM port
4. Install required libraries
5. Update configuration settings
6. Click Upload button

## Testing

1. Power on the Arduino
2. LCD should display "Ready" and "Tap Card"
3. Connect to WiFi (check Serial Monitor)
4. Tap an RFID card on the reader
5. Check Serial Monitor for output
6. Verify data is sent to server
7. Check LCD for success/error messages

## Troubleshooting

### WiFi Not Connecting
- Verify SSID and password are correct
- Check if WiFi network is available
- Ensure Arduino UNO R4 WiFi is properly connected

### RFID Not Reading
- Check RC522 wiring connections
- Ensure 3.3V power supply is stable
- Verify RFID card is compatible (MIFARE Classic)
- Check if RFID card is damaged

### Server Connection Failed
- Verify server host and port are correct
- Check if server is running and accessible
- Verify API key matches database
- Check firewall settings

### LCD Not Displaying
- Check I2C connections (SDA, SCL)
- Verify I2C address is correct (default: 0x27)
- Check LCD contrast adjustment

## Security Notes

- Never hardcode sensitive credentials in production
- Use environment variables or secure storage
- Keep API keys secret
- Use HTTPS for all communications
- Implement proper authentication on server

## API Endpoint

The Arduino sends POST requests to:

```
POST /api/v1/attendance/tap
Content-Type: application/json
X-API-Key: your_api_key

{
  "deviceId": "GATE-001",
  "rfidUid": "A3 7B 91 22"
}
```

Expected response:

```json
{
  "success": true,
  "personType": "STUDENT",
  "event": "ARRIVAL",
  "name": "John Kamara",
  "time": "07:42:15"
}
```

## Maintenance

- Regularly check WiFi connectivity
- Monitor offline queue size
- Update firmware as needed
- Replace RFID cards if damaged
- Keep device firmware updated
