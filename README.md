# Aqua Sentinel: IoT Water Grid Management

Aqua Sentinel is a hardware and software integrated system designed for real-time monitoring of water quality parameters and forecasting of supply depletion. It leverages edge computing and cloud databases to provide continuous telemetry for water grid infrastructure.

## System Architecture (V1.0 Prototype)

The current prototype demonstrates the core end-to-end data pipeline:

### 1. Edge Node (Hardware)
- **Microcontroller:** ESP32 (configured via PlatformIO)
- **Sensors:** Ultrasonic (Water Level), Analog TDS, Analog Turbidity.
- **Connectivity (Captive Portal):** Implements `WiFiManager`. Upon booting, if no known Wi-Fi is found, the ESP32 broadcasts an "AquaSentinel_Setup" hotspot. Users connect to this hotspot via their phone to securely configure their home Wi-Fi credentials via a local web dashboard, eliminating hardcoded passwords.

### 2. Data Ingestion (Cloud Backend)
- **Database:** Supabase (PostgreSQL)
- **Integration:** The edge node utilizes the Supabase REST API to POST JSON payloads directly to the database.
- **Security:** Row Level Security (RLS) is implemented to restrict unauthenticated access while allowing anonymous telemetry inserts.

### 3. Analytics and Forecasting (Data Science)
- **Anomaly Detection:** Real-time monitoring of TDS and Turbidity spikes to isolate potential contamination events.
- **Time-Series Forecasting:** Predictive modeling based on consumption rates (derived from ultrasonic level drops) to forecast tank depletion and optimize refill logistics.

---

## 🚀 Commercial Roadmap (V2.0): The "Smart Buoy"
While V1.0 serves as a proof-of-concept for the data pipeline, the V2.0 architecture is designed for true "Drop and Forget" zero-maintenance consumer deployment.

- **Form Factor:** A sealed, floating buoy that rests on the water's surface, eliminating the need for complex underwater waterproofing or wire routing.
- **Sensor Upgrades:** Transitioning from Ultrasonic to a top-mounted **Time-of-Flight (ToF) Laser Sensor** (e.g., VL53L1X) pointing at the tank ceiling to calculate depth, avoiding acoustic interference from tank walls.
- **Radio Transmission:** Transitioning from Wi-Fi to **LoRaWAN**. The buoy will transmit telemetry over radio frequencies to a central neighborhood gateway, completely removing the dependency on home Wi-Fi routers.
- **Power Management & Dynamic Polling:** Utilizing ESP32 **Deep Sleep** paradigms to achieve **>1 year** of battery life using standard **AA batteries**. The system uses an edge-computing "Dynamic Polling" algorithm: it sleeps for 60-minute intervals during idle periods, but automatically shifts to high-frequency 5-minute sampling if a sudden water level drop is detected, balancing extreme battery efficiency with high-resolution usage data.

---

## Installation and Setup

### Hardware Node Configuration
1. Open the `esp32_firmware` directory using PlatformIO.
2. Create `secrets.h` in the `src/` directory to store database credentials.
3. Compile and flash the firmware to the ESP32.

### Database Configuration
1. Execute the provided `schema.sql` within the Supabase SQL editor to provision the required tables and security policies.

## Contributors
- **Electronics & Hardware Engineering:** PCB layout, signal calibration, embedded C++ firmware.
- **Software Engineering:** Database provisioning, REST API integration, telemetry dashboards.
- **Data Science:** Predictive algorithms and statistical analysis.
