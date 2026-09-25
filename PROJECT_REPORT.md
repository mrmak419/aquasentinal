# Aqua Sentinel: Edge-to-Cloud Predictive Water Infrastructure

## 1. Executive Summary
In India, urban water infrastructure heavily relies on decentralized Underground Sumps and Overhead Tanks (OHT). The current paradigm is entirely **reactive**—residents only realize a tank is empty when the water stops flowing, leading to panic-booking of private water tankers at premium surge prices. Furthermore, groundwater contamination from sewage runoff during monsoons often goes undetected until health crises occur.

**Aqua Sentinel** is a proactive, enterprise-grade IoT and Machine Learning architecture designed to solve this. By utilizing edge-computing, secure cloud RPCs, real-time WebSockets, and predictive forecasting, Aqua Sentinel transforms standard water tanks into intelligent nodes capable of auto-detecting contamination and predicting exact depletion times.

## 2. Team Composition
This project was developed through cross-disciplinary engineering collaboration:
*   **Computer Science Engineering (CSE - 3 Members):** Cloud architecture, database security (Row Level Security), and the real-time React web dashboard.
*   **Artificial Intelligence & Data Science (AIDS - 2 Members):** Time-series forecasting algorithms (predicting depletion) and anomaly detection (flagging contamination events).
*   **Electronics & Communication / Electrical (ECE/EEE - 3 Members):** ESP32 microcontroller firmware, sensor calibration, and edge-computation logic.
*   **Civil Engineering (1 Member):** Fluid dynamics considerations and physical deployment constraints.

## 3. System Architecture

The architecture was intentionally designed to mirror commercial B2B SaaS applications, avoiding standard "hobbyist" pitfalls.

### 3.1 Edge Node (Hardware)
*   **Microcontroller:** ESP32 (Wi-Fi enabled).
*   **Sensors:** 
    *   **Ultrasonic Sensor:** Measures physical distance to the water surface to calculate volume.
    *   **TDS Probe:** Measures Total Dissolved Solids (Conductivity) to track water hardness and detect "sweet" vs. "borewell" water.
    *   **Turbidity Sensor:** Measures particulate matter/cloudiness to detect immediate sewage or dirt contamination.
*   **Edge Computing:** Instead of transmitting raw analog voltages to the cloud (Thin Client), the ESP32 performs the mathematical conversions to standard scientific units (cm, PPM, NTU) locally. This drastically reduces cloud processing overhead.
*   **Captive Portal:** Wi-Fi credentials are not hardcoded. The ESP32 broadcasts its own temporary Wi-Fi network for users to configure internet access dynamically.

### 3.2 Cloud Infrastructure (Backend)
*   **Provider:** Supabase (PostgreSQL).
*   **Security Protocol:** Standard IoT projects use exposed REST APIs, which are highly vulnerable to key theft. Aqua Sentinel utilizes **Row Level Security (RLS)** and custom **Remote Procedure Calls (RPC)**. The ESP32 transmits a hardcoded UUID and `device_secret`. If these do not match the secure `devices` table, the PostgreSQL database rejects the telemetry packet at the database layer.

### 3.3 The Telemetry Dashboard (Frontend)
*   **Tech Stack:** React, Vite, Tailwind CSS v3, Recharts.
*   **Real-Time Data:** The dashboard does not use traditional HTTP polling (which strains server loads). It implements **WebSockets** via Supabase Realtime. When a sensor pushes data to PostgreSQL, the database instantly pushes the payload to the React app, resulting in sub-second UI animations.
*   **Deployment:** Deployed globally via Cloudflare Pages on a custom domain (`aquasentinal.uninode.in`).

### 3.4 Data Science & Machine Learning
*   **Dynamic Forecasting:** The system calculates real-time derivative drain rates to display immediate "Time to Empty" metrics. 
*   **Anomaly Detection:** Historical data is monitored for unnatural spikes. For example, a sudden surge in Turbidity combined with a drop in TDS can trigger an automated Contamination Alert, protecting end-users from compromised groundwater.

## 4. Exhibition vs. Production Deployment Modes
*   **Exhibition Mode (Current):** The ESP32 transmits data every 2 seconds, and the React UI updates instantaneously to demonstrate system responsiveness to physical manipulation (e.g., adding salt to the water).
*   **Production Mode:** In a real-world deployment, the ESP32 utilizes "Deep Sleep" to power down the Wi-Fi radio, waking only every 15 minutes to log data. This extends battery life to over 12 months while providing sufficient data granularity for the Machine Learning models.

## 5. Conclusion
Aqua Sentinel successfully bridges the gap between hardware electronics and modern cloud software. By moving away from reactive water tracking to a predictive, secure, and real-time infrastructure, this architecture provides a scalable foundation for modern Smart City water management.
