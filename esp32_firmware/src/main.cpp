#include <Arduino.h>
#include <WiFiManager.h> // Magic library for the Captive Portal
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <LittleFS.h>    // Added for internal flash memory storage

// ==========================================
// CONFIGURATION
// ==========================================

// Set to 1 to just print sensor data to Serial (No WiFi/Supabase)
// Set to 0 to enable Captive Portal and Supabase uploads
#define TEST_MODE 0

// Supabase Credentials
// These are securely loaded from secrets.h (which is ignored by Git)
#include "secrets.h"

// Sensor Pins
#define TRIG_PIN 5
#define ECHO_PIN 18
#define TDS_PIN 32
#define TURBIDITY_PIN 34
#define BUILTIN_LED 2 // Built-in blue LED on most ESP32 boards

// Measurement Settings
const unsigned long UPLOAD_INTERVAL = 2000; // Firing every 2 seconds for Exhibition Demo
unsigned long lastUploadTime = 0;

// TDS Sensor Calibration
#define VREF 3.3      // Analog reference voltage (Volt) of the ADC

// ==========================================
// HELPER FUNCTIONS
// ==========================================

float readWaterLevel() {
    digitalWrite(BUILTIN_LED, HIGH); // Turn ON blue LED while pinging

    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);
    
    long duration = pulseIn(ECHO_PIN, HIGH, 30000);
    
    digitalWrite(BUILTIN_LED, LOW); // Turn OFF blue LED after reading

    if (duration == 0) return 0.0;
    
    return duration * 0.034 / 2.0; 
}

float readTDS() {
    int analogValue = analogRead(TDS_PIN);
    float voltage = analogValue * (VREF / 4095.0);
    float tdsValue = (133.42 * voltage * voltage * voltage - 255.86 * voltage * voltage + 857.39 * voltage) * 0.5; 
    return (tdsValue < 0) ? 0 : tdsValue;
}

float readTurbidity() {
    int analogValue = analogRead(TURBIDITY_PIN);
    float voltage = analogValue * (VREF / 4095.0);
    float turbidity = -1120.4 * voltage * voltage + 5742.3 * voltage - 4352.9;
    return (turbidity < 0) ? 0 : turbidity;
}

void uploadDataToSupabase(float level, float tds, float turbidity) {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(supabase_url);
        
        http.addHeader("Content-Type", "application/json");
        http.addHeader("apikey", supabase_key);
        http.addHeader("Authorization", String("Bearer ") + supabase_key);
        http.addHeader("Prefer", "return=minimal");
        
        JsonDocument doc;
        doc["p_device_id"] = device_id;
        doc["p_device_secret"] = device_secret;
        doc["p_water_level_cm"] = level;
        doc["p_tds_ppm"] = tds;
        doc["p_turbidity_ntu"] = turbidity;
        
        String requestBody;
        serializeJson(doc, requestBody);
        
        Serial.println("Sending data to Supabase...");
        int httpResponseCode = http.POST(requestBody);
        
        if (httpResponseCode > 0) {
            Serial.printf("Success! HTTP Response code: %d\n", httpResponseCode);
        } else {
            Serial.printf("Error! HTTP code: %d (%s)\n", httpResponseCode, http.errorToString(httpResponseCode).c_str());
        }
        
        http.end();
    } else {
        Serial.println("WiFi Disconnected. Cannot upload data.");
    }
}

// Function to append a new row of data to internal flash memory
void logDataLocally(float level, float tds, float turbidity) {
    // We'll use millis() as a basic timestamp for offline logging.
    // In a real scenario without Wi-Fi, you might want to add an RTC module for real dates.
    String dataRow = String(millis()) + "," + String(level) + "," + String(tds) + "," + String(turbidity);
    
    File file = LittleFS.open("/data.csv", "a");
    if (!file) {
        Serial.println("Failed to open file for appending");
        return;
    }
    
    if (file.println(dataRow)) {
        Serial.println("Data saved locally to ESP32 memory.");
    } else {
        Serial.println("Failed to save data locally.");
    }
    file.close();
}

// ==========================================
// MAIN SETUP & LOOP
// ==========================================

void setup() {
    Serial.begin(115200);
    delay(1000);
    
    Serial.println("\n--- Aqua Sentinel ESP32 Node ---");
    
    pinMode(TRIG_PIN, OUTPUT);
    pinMode(ECHO_PIN, INPUT);
    pinMode(TDS_PIN, INPUT);
    pinMode(TURBIDITY_PIN, INPUT);
    pinMode(BUILTIN_LED, OUTPUT); // Initialize the blue LED pin

    // Initialize LittleFS for local data logging
    if (!LittleFS.begin(true)) {
        Serial.println("LittleFS Mount Failed!");
    } else {
        Serial.println("LittleFS Mounted Successfully!");
        // Create CSV header if the file doesn't exist
        if (!LittleFS.exists("/data.csv")) {
            File file = LittleFS.open("/data.csv", "w");
            file.println("timestamp_ms,water_level_cm,tds_ppm,turbidity_ntu");
            file.close();
            Serial.println("Created new data.csv with headers.");
        }
    }
    
    if (!TEST_MODE) {
        Serial.println("Starting WiFi Manager...");
        
        WiFiManager wm;
        
        // Uncomment the line below to wipe saved WiFi passwords (good for testing the portal)
        // wm.resetSettings();

        // This creates an open WiFi network called "AquaSentinel_Setup"
        // If the ESP32 can't find a saved network, it turns into a router!
        bool connected = wm.autoConnect("AquaSentinel_Setup");
        
        if (!connected) {
            Serial.println("Failed to connect to WiFi. Restarting...");
            delay(3000);
            ESP.restart();
        }
        
        Serial.println("\nWiFi Connected Successfully!");
        Serial.print("IP Address: ");
        Serial.println(WiFi.localIP());
    }
}

void loop() {
    if (millis() - lastUploadTime > UPLOAD_INTERVAL) {
        lastUploadTime = millis();
        
        float waterLevel = readWaterLevel();
        float tds = readTDS();
        float turbidity = readTurbidity();
        
        Serial.println("\n--- New Reading ---");
        
        if (TEST_MODE) {
            Serial.printf("Raw TDS ADC: %d, Voltage: %.2f V\n", analogRead(TDS_PIN), analogRead(TDS_PIN) * (VREF / 4095.0));
            Serial.printf("Raw Turbidity ADC: %d, Voltage: %.2f V\n", analogRead(TURBIDITY_PIN), analogRead(TURBIDITY_PIN) * (VREF / 4095.0));
        }
        
        Serial.printf("Distance: %.2f cm\n", waterLevel);
        Serial.printf("TDS: %.2f ppm\n", tds);
        Serial.printf("Turbidity: %.2f NTU\n", turbidity);
        
        // Log to internal ESP32 memory (acts like an SD card)
        logDataLocally(waterLevel, tds, turbidity);

        if (!TEST_MODE) {
            uploadDataToSupabase(waterLevel, tds, turbidity);
        }
    }
    
    delay(10);
}
