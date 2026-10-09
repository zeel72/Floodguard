# FloodGuard IoT Edge Telemetry Pipeline

**Hardware Firmware, Circuit Wiring, Signal Processing & Telemetry Ingestion Guide**

This directory contains the production Arduino C++ firmware and hardware documentation for the **FloodGuard Ultrasonic Hydrology Node (ESP8266 NodeMCU + HC-SR04)**.

---

## 1. System Architecture & Edge Signal Pipeline

```
  ┌────────────────────────────────────────────────────────┐
  │                 PHYSICAL PHENOMENON                   │
  │     Rising Stormwater Inundation on Roadbed Surface    │
  └───────────────────────────┬────────────────────────────┘
                              │
                    Acoustic Pings (40 kHz)
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │         HC-SR04 ULTRASONIC TRANSDUCER MODULE           │
  │  10µs Trigger Pulse ──► Speed of Sound (346 m/s)       │
  │  Echo Pulse Width t_us ──► Raw Distance D = (t * v)/2  │
  └───────────────────────────┬────────────────────────────┘
                              │ Echo Voltage Divider (5V -> 3.3V)
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │              ESP8266 NODEMCU MICROCONTROLLER           │
  │  1. 5-Sample Non-Linear Median Filter                  │
  │     (Surface ripple & jitter rejection)               │
  │  2. Inundation Depth: W = H_mount - D_median           │
  │  3. Rise Velocity: dW/dt (cm/min)                     │
  │  4. Battery Health ADC Readout (A0)                    │
  └───────────────────────────┬────────────────────────────┘
                              │
                    WiFi 802.11 b/g/n (HTTP / MQTT)
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │           FASTAPI INGESTION & CLOUD DISPATCH           │
  │  POST /api/v1/sensors/reading ──► DynamoDB Table       │
  │  XGBoost Inference ──► Leaflet WebGIS Command Center   │
  └────────────────────────────────────────────────────────┘
```

---

## 2. Hardware Bill of Materials (BOM)

| Component | Quantity | Specifications | Purpose |
|---|---|---|---|
| **ESP8266 NodeMCU V3 (ESP-12E)** | 1 | 80 MHz Xtensa, 4MB Flash, Integrated 802.11b/g/n WiFi | Edge Compute & Network Gateway |
| **HC-SR04 Ultrasonic Sensor** | 1 | 40 kHz transducer, 2 cm to 400 cm range, 3 mm resolution | Non-contact water surface distance |
| **Resistor 1.0 kΩ (1/4W)** | 1 | 1% metal film | Voltage divider upper leg |
| **Resistor 2.0 kΩ (1/4W)** | 1 | 1% metal film (or 2x 1kΩ in series) | Voltage divider lower leg to GND |
| **Solderless Breadboard** | 1 | 400-point half-size | Prototype circuit assembly |
| **Jumper Wires (M-M / M-F)** | 6 | 20 cm Dupont cables | Interconnections |
| **Micro-USB Cable & 5V PSU** | 1 | 5V / 1.5A power delivery | Power supply to ESP8266 Vin pin |

---

## 3. Circuit Wiring & Pinout Table

> [!CAUTION]
> **5V Logic Level Warning:** The HC-SR04 operates at 5V and outputs a 5V logic signal on its `ECHO` pin. The ESP8266 GPIO pins are strictly 3.3V rated. Connecting `ECHO` directly without a voltage divider can damage the ESP8266 GPIO pin over time. Always wire the 1kΩ / 2kΩ voltage divider as shown below.

### Pinout Mapping

| ESP8266 Pin | GPIO # | HC-SR04 Pin | Note |
|---|---|---|---|
| **Vin (5V)** | - | **VCC** | Provides 5V required by HC-SR04 transducers |
| **GND** | - | **GND** | Common ground plane |
| **D1** | GPIO 5 | **TRIG** | 10µs output trigger pulse |
| **D2** | GPIO 4 | **ECHO** | Input through voltage divider junction |
| **A0** | ADC0 | Battery Divider | 0–1.0V battery voltage measurement |
| **D4 (LED_BUILTIN)** | GPIO 2 | Onboard LED | Active-low status indicator |

### Voltage Divider Schematic for ECHO Pin:

```
  HC-SR04 ECHO (5V Out) 
          │
        [ 1 kΩ ]
          │
          ├───► Connect to ESP8266 Pin D2 (GPIO 4)  [3.3V Safe]
          │
        [ 2 kΩ ]
          │
         GND
```

---

## 4. Signal Processing & Physics Formulas

### 1. Acoustic Distance Formula
The speed of sound in air is temperature-dependent:
$$v_{\text{sound}} = 331.3 + 0.606 \times T_{\text{temp}} \approx 346.0\text{ m/s (at }25^\circ\text{C)}$$
$$D_{\text{raw}} = \frac{t_{\text{pulse}} \times 0.0346\text{ cm/\mu s}}{2}$$

### 2. 5-Sample Non-Linear Median Filter
Ultrasonic reflections off turbulent water surfaces suffer from surface ripple noise, floating debris, and thermal air currents. A linear moving average gets distorted by single large outliers (e.g. echo dropouts returning 400 cm).

The firmware executes 5 consecutive ultrasonic pings spaced 30 ms apart, sorts the sample vector $[s_0, s_1, s_2, s_3, s_4]$, and returns the median:
$$D_{\text{filtered}} = \text{median}\left(S\right) = s_2$$

### 3. Road Surface Inundation Depth
With the sensor rigidly mounted on an overhead street gantry or lamppost at height $H_{\text{mount}}$ (e.g., 120 cm above dry roadbed):
$$W_{\text{depth}} = \max\left(0, H_{\text{mount}} - D_{\text{filtered}}\right)$$

### 4. Water Rise Rate
$$\frac{\Delta W}{\Delta t} = \frac{W_t - W_{t-1}}{\Delta t_{\text{minutes}}}\quad (\text{cm/min})$$

---

## 5. Firmware Flashing Guide

### Method A: Arduino IDE
1. Open **Arduino IDE**.
2. Open **Settings / Preferences** and add the following URL to **Additional Boards Manager URLs**:
   ```
   http://arduino.esp8266.com/stable/package_esp8266com_index.json
   ```
3. Go to **Tools -> Board -> Boards Manager**, search for `esp8266` by *ESP8266 Community*, and click **Install**.
4. Select board: **NodeMCU 1.0 (ESP-12E Module)**.
5. Open [`iot/firmware/floodguard_node.ino`](file:///Users/zeel/Floodguard/iot/firmware/floodguard_node.ino).
6. Edit WiFi credentials and backend IP:
   ```cpp
   const char* WIFI_SSID     = "Your-WiFi-Name";
   const char* WIFI_PASSWORD = "Your-WiFi-Password";
   const char* BACKEND_HOST  = "192.168.1.100"; // IP of machine running FastAPI
   ```
7. Connect NodeMCU via USB and select the serial port (e.g. `/dev/cu.usbserial-0001` on macOS or `COM3` on Windows).
8. Click **Upload** and open Serial Monitor at **115200 baud**.

---

## 6. Serial Monitor Diagnostics

Upon boot and successful telemetry acquisition, the serial monitor prints:

```text
======================================================
   FLOODGUARD IOT SENSOR NODE — FIRMWARE v1.0.0      
   Municipal Urban Drainage & Inundation Telemetry   
======================================================
[CONFIG] Sensor ID:     SN-101
[CONFIG] Zone Target:   ZONE_B
[CONFIG] Mount Height:  120.00 cm
[CONFIG] Ingest URL:    http://192.168.1.100:8000/api/v1/sensors/reading

[WIFI] Connecting to SSID: FloodGuard-Hotspot
......
[WIFI] Connected Successfully!
[WIFI] Node IP Address:  192.168.1.52
[WIFI] Signal Strength: -48 dBm
[SENSOR] Running initial calibration cycle...
[SENSOR] Baseline dry street distance: 120.00 cm

--- [CYCLE #1] ---
  Raw Distance:  42.4 cm
  Water Depth:   77.6 cm
  Rise Velocity: +3.82 cm/min
  Battery Level: 98 %
  STATUS: [WARNING: HIGH WATER DEPTH]
  Transmission: SUCCESS (201 Created -> DynamoDB Saved)
```

---

## 7. Zero-Hardware Virtual Test Tool

If physical hardware is not plugged in, you can test the exact hardware ingestion pipeline using our virtual Python node emulator:

```bash
# Run virtual hardware simulator
python iot/virtual_sensor_node.py --sensor SN-101 --zone ZONE_B --interval 3
```

This sends identical HTTP POST packets to FastAPI and verifies that your database and live Leaflet map react in real-time.
