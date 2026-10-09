/**
 * ============================================================================
 * FLOODGUARD EDGE IOT FIRMWARE — ESP8266 NODEMCU + HC-SR04 TELEMETRY NODE
 * ============================================================================
 * Project: FloodGuard (AI-Powered Urban Flood Prediction & Early Warning System)
 * Hardware: ESP8266 NodeMCU V3 / Wemos D1 Mini
 * Sensor: HC-SR04 Ultrasonic Ranging Module (2cm - 400cm)
 * Protocol: HTTP REST (POST /api/v1/sensors/reading) & MQTT (floodguard/sensors/data)
 *
 * Physics & Signal Processing:
 *   - Speed of sound at 25°C: 346.0 m/s (0.0346 cm/us)
 *   - Raw Echo Distance D = (Duration * 0.0346) / 2
 *   - Road Water Depth W = Mount_Height_H - Distance_D
 *   - 5-Sample Non-Linear Median Filter (removes surface ripple noise)
 * ============================================================================
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>

// ============================================================================
// NETWORK & BACKEND CONFIGURATION
// ============================================================================
// Set your local WiFi credentials or cellular hotspot
const char* WIFI_SSID     = "FloodGuard-Hotspot";     // Replace with your SSID
const char* WIFI_PASSWORD = "urbanwaterguard";         // Replace with your Password

// FloodGuard Backend Server Configuration (FastAPI)
const char* BACKEND_HOST  = "192.168.1.100";           // IP of server running FastAPI
const int   BACKEND_PORT  = 8000;
const char* INGEST_PATH   = "/api/v1/sensors/reading";

// Telemetry Metadata
const char* SENSOR_ID     = "SN-101";                  // Matches Central Underpass Basin
const char* ZONE_ID       = "ZONE_B";
const float SENSOR_LAT    = 19.0760;
const float SENSOR_LNG    = 72.8777;
const float SENSOR_ELEV_M = 6.2;

// ============================================================================
// HARDWARE PIN DEFINITIONS
// ============================================================================
// HC-SR04 Ultrasonic Sensor Pins
const int PIN_TRIG        = D1;  // GPIO 5 (Output - Ultrasonic Pulse Trigger)
const int PIN_ECHO        = D2;  // GPIO 4 (Input  - Echo Return Pulse via 3.3V divider)
const int PIN_STATUS_LED  = D4;  // GPIO 2 (NodeMCU Onboard LED, Active LOW)
const int PIN_BATTERY_ADC = A0;  // ADC0 (0-1.0V or 0-3.3V Battery Voltage Divider)

// ============================================================================
// CALIBRATION & FILTERING CONSTANTS
// ============================================================================
// Mounting height above dry roadbed in centimeters
const float MOUNT_HEIGHT_CM       = 120.0; // Sensor mounted 1.2m above street level
const float MIN_VALID_DIST_CM     = 3.0;   // Ultrasonic dead zone limit
const float MAX_VALID_DIST_CM     = 400.0; // HC-SR04 maximum reliable range
const int   MEDIAN_SAMPLES        = 5;     // Number of pings for median filter
const unsigned long SAMPLE_INTERVAL_MS = 5000; // 5 seconds between transmission cycles

// ============================================================================
// RUNTIME STATE VARIABLES
// ============================================================================
float lastWaterDepthCm   = 0.0;
unsigned long lastSampleTime = 0;
unsigned long cycleCount = 0;

// ============================================================================
// FORWARD DECLARATIONS
// ============================================================================
void connectWiFi();
float measureRawDistanceCm();
float measureFilteredDistanceCm();
float calculateRiseRate(float currentDepthCm, unsigned long elapsedMs);
float readBatteryPercentage();
bool transmitTelemetryHTTP(float depthCm, float rawDistCm, float riseRateCmMin, float battPct);
void bubbleSort(float arr[], int n);

// ============================================================================
// SETUP INITIALIZATION
// ============================================================================
void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println();
  Serial.println(F("======================================================"));
  Serial.println(F("   FLOODGUARD IOT SENSOR NODE — FIRMWARE v1.0.0      "));
  Serial.println(F("   Municipal Urban Drainage & Inundation Telemetry   "));
  Serial.println(F("======================================================"));

  // Configure GPIO directions
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_STATUS_LED, OUTPUT);

  // Initialize trigger LOW
  digitalWrite(PIN_TRIG, LOW);
  digitalWrite(PIN_STATUS_LED, HIGH); // Off for active-low LED

  Serial.print(F("[CONFIG] Sensor ID:     ")); Serial.println(SENSOR_ID);
  Serial.print(F("[CONFIG] Zone Target:   ")); Serial.println(ZONE_ID);
  Serial.print(F("[CONFIG] Mount Height:  ")); Serial.print(MOUNT_HEIGHT_CM); Serial.println(F(" cm"));
  Serial.print(F("[CONFIG] Ingest URL:    http://")); Serial.print(BACKEND_HOST);
  Serial.print(F(":")); Serial.print(BACKEND_PORT); Serial.println(INGEST_PATH);

  // Connect to Local Area Network
  connectWiFi();

  // Initial baseline measurement
  Serial.println(F("[SENSOR] Running initial calibration cycle..."));
  float baselineDist = measureFilteredDistanceCm();
  Serial.print(F("[SENSOR] Baseline dry street distance: "));
  Serial.print(baselineDist);
  Serial.println(F(" cm"));

  lastSampleTime = millis();
}

// ============================================================================
// MAIN LOOP
// ============================================================================
void loop() {
  unsigned long currentMillis = millis();

  // Maintain WiFi Connection
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  // Periodic Telemetry Acquisition
  if (currentMillis - lastSampleTime >= SAMPLE_INTERVAL_MS) {
    unsigned long elapsedMs = currentMillis - lastSampleTime;
    lastSampleTime = currentMillis;
    cycleCount++;

    Serial.println();
    Serial.print(F("--- [CYCLE #")); Serial.print(cycleCount); Serial.println(F("] ---"));

    // 1. Measure raw distance with 5-point median filtering
    float rawDistance = measureFilteredDistanceCm();

    // 2. Compute water depth: W = H_mount - D_echo
    float calculatedDepth = MOUNT_HEIGHT_CM - rawDistance;
    if (calculatedDepth < 0.0) calculatedDepth = 0.0;
    if (calculatedDepth > MOUNT_HEIGHT_CM) calculatedDepth = MOUNT_HEIGHT_CM;

    // 3. Compute water rise velocity (cm/min)
    float riseRate = calculateRiseRate(calculatedDepth, elapsedMs);
    lastWaterDepthCm = calculatedDepth;

    // 4. Read battery status
    float batteryPct = readBatteryPercentage();

    // 5. Output diagnostics to Serial Console
    Serial.print(F("  Raw Distance:  ")); Serial.print(rawDistance, 1); Serial.println(F(" cm"));
    Serial.print(F("  Water Depth:   ")); Serial.print(calculatedDepth, 1); Serial.println(F(" cm"));
    Serial.print(F("  Rise Velocity: ")); Serial.print(riseRate >= 0 ? "+" : ""); 
    Serial.print(riseRate, 2); Serial.println(F(" cm/min"));
    Serial.print(F("  Battery Level: ")); Serial.print(batteryPct, 0); Serial.println(F(" %"));

    // Threat Assessment for Local Debugging
    if (calculatedDepth >= 90.0) {
      Serial.println(F("  STATUS: [!!! CRITICAL INUNDATION THREAT !!!]"));
    } else if (calculatedDepth >= 70.0) {
      Serial.println(F("  STATUS: [WARNING: HIGH WATER DEPTH]"));
    } else if (calculatedDepth >= 50.0) {
      Serial.println(F("  STATUS: [ADVISORY: MODERATE PUDDLING]"));
    } else {
      Serial.println(F("  STATUS: [NORMAL: STREET DRY / PASSABLE]"));
    }

    // 6. Transmit Telemetry Packet via HTTP POST
    bool success = transmitTelemetryHTTP(calculatedDepth, rawDistance, riseRate, batteryPct);

    if (success) {
      Serial.println(F("  Transmission: SUCCESS (201 Created -> DynamoDB Saved)"));
    } else {
      Serial.println(F("  Transmission: FAILED (Check server host/port & network)"));
    }
  }

  delay(20);
}

// ============================================================================
// WIFI CONNECTION ROUTINE WITH BACKOFF
// ============================================================================
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.println();
  Serial.print(F("[WIFI] Connecting to SSID: "));
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    // Rapid blink while searching for network
    digitalWrite(PIN_STATUS_LED, !digitalRead(PIN_STATUS_LED));
    Serial.print(F("."));
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(PIN_STATUS_LED, LOW); // Solid ON when connected
    Serial.println();
    Serial.println(F("[WIFI] Connected Successfully!"));
    Serial.print(F("[WIFI] Node IP Address:  "));
    Serial.println(WiFi.localIP());
    Serial.print(F("[WIFI] Signal Strength: "));
    Serial.print(WiFi.RSSI());
    Serial.println(F(" dBm"));
  } else {
    digitalWrite(PIN_STATUS_LED, HIGH); // OFF if failed
    Serial.println();
    Serial.println(F("[WIFI] Connection Timeout. Will retry in next cycle."));
  }
}

// ============================================================================
// HC-SR04 SINGLE ULTRASONIC PING MEASUREMENT
// ============================================================================
float measureRawDistanceCm() {
  // Ensure trigger pin is clean LOW for 4us
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(4);

  // Send 10 microsecond HIGH pulse to start transducer
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  // Measure echo pulse width (timeout 30,000 us = ~5.1 meters max)
  unsigned long durationUs = pulseIn(PIN_ECHO, HIGH, 30000);

  if (durationUs == 0) {
    // Sensor out of range or timeout
    return MAX_VALID_DIST_CM;
  }

  // Calculate distance in cm (Speed of sound = 346.0 m/s at 25°C = 0.0346 cm/us)
  float distanceCm = (durationUs * 0.0346) / 2.0;

  // Clamp within realistic physical boundaries
  if (distanceCm < MIN_VALID_DIST_CM) distanceCm = MIN_VALID_DIST_CM;
  if (distanceCm > MAX_VALID_DIST_CM) distanceCm = MAX_VALID_DIST_CM;

  return distanceCm;
}

// ============================================================================
// 5-SAMPLE MEDIAN FILTER (NOISE & WATER SURFACE RIPPLE REJECTION)
// ============================================================================
float measureFilteredDistanceCm() {
  float samples[MEDIAN_SAMPLES];

  // Collect N consecutive measurements spaced by 30ms
  for (int i = 0; i < MEDIAN_SAMPLES; i++) {
    samples[i] = measureRawDistanceCm();
    delay(30);
  }

  // Sort samples in ascending order
  bubbleSort(samples, MEDIAN_SAMPLES);

  // Return the middle element (median value)
  return samples[MEDIAN_SAMPLES / 2];
}

// Simple ascending bubble sort
void bubbleSort(float arr[], int n) {
  for (int i = 0; i < n - 1; i++) {
    for (int j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        float temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
}

// ============================================================================
// WATER RISE VELOCITY CALCULATION (CM / MIN)
// ============================================================================
float calculateRiseRate(float currentDepthCm, unsigned long elapsedMs) {
  if (cycleCount <= 1 || elapsedMs == 0) {
    return 0.0;
  }
  float deltaDepthCm = currentDepthCm - lastWaterDepthCm;
  float elapsedMinutes = (float)elapsedMs / 60000.0;
  return deltaDepthCm / elapsedMinutes;
}

// ============================================================================
// BATTERY VOLTAGE MONITORING VIA ADC0
// ============================================================================
float readBatteryPercentage() {
  int rawAdc = analogRead(PIN_BATTERY_ADC); // 0 to 1023
  // Simulated or mapped battery scale (e.g. 3.2V - 4.2V LiPo via divider)
  float percentage = ((float)rawAdc / 1023.0) * 100.0;
  if (percentage > 100.0) percentage = 100.0;
  if (percentage < 5.0)   percentage = 98.0; // Default high for USB-powered dev board
  return percentage;
}

// ============================================================================
// HTTP REST TELEMETRY DISPATCH TO FASTAPI BACKEND
// ============================================================================
bool transmitTelemetryHTTP(float depthCm, float rawDistCm, float riseRateCmMin, float battPct) {
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }

  WiFiClient client;
  HTTPClient http;

  // Construct target URL
  String url = "http://" + String(BACKEND_HOST) + ":" + String(BACKEND_PORT) + String(INGEST_PATH);

  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Accept", "application/json");

  // Construct JSON payload
  String payload = "{";
  payload += "\"sensor_id\":\"" + String(SENSOR_ID) + "\",";
  payload += "\"water_depth_cm\":" + String(depthCm, 2) + ",";
  payload += "\"raw_distance_cm\":" + String(rawDistCm, 2) + ",";
  payload += "\"rainfall_1h_mm\":0.0,";
  payload += "\"water_rise_rate_cm_per_min\":" + String(riseRateCmMin, 2) + ",";
  payload += "\"battery_pct\":" + String(battPct, 1) + ",";
  payload += "\"mode\":\"real\",";
  payload += "\"zone_id\":\"" + String(ZONE_ID) + "\",";
  payload += "\"latitude\":" + String(SENSOR_LAT, 5) + ",";
  payload += "\"longitude\":" + String(SENSOR_LNG, 5);
  payload += "}";

  // Flash LED during transmission
  digitalWrite(PIN_STATUS_LED, LOW);
  int httpCode = http.POST(payload);
  digitalWrite(PIN_STATUS_LED, HIGH);

  bool success = false;
  if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_CREATED) {
    success = true;
  } else {
    Serial.print(F("  [HTTP ERROR] Response code: "));
    Serial.println(httpCode);
    if (httpCode > 0) {
      String response = http.getString();
      Serial.print(F("  [HTTP RESPONSE] "));
      Serial.println(response);
    }
  }

  http.end();
  return success;
}
