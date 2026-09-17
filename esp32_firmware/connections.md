# Hardware Connections Guide

This document details how to wire the sensors to your ESP32 microcontroller for the Aqua Sentinel project.

> **Important Power Note**: The ESP32 logic level is **3.3V**. For sensors that output an analog signal (TDS, Turbidity), it is highly recommended to power them using the **3.3V** pin rather than the 5V (VIN) pin. If you power them with 5V, their analog output could exceed 3.3V and permanently damage the ESP32's ADC pins.

---

## 1. Ultrasonic Sensor (Water Level)
*Commonly HC-SR04 or similar*

| Sensor Pin | ESP32 Pin | Wire Color (Suggested) | Notes |
| :--- | :--- | :--- | :--- |
| **VCC** | **3.3V** or **VIN(5V)** | Red | *Note: If using standard HC-SR04 (5V only), use VIN. If using HC-SR04+ (3.3V compatible), use 3.3V.* |
| **GND** | **GND** | Black | |
| **TRIG** | **GPIO 5** | Yellow | Sends the sound pulse |
| **ECHO** | **GPIO 18** | Green | Receives the sound pulse. *(If powering the sensor with 5V, a voltage divider here is recommended to protect the 3.3V ESP pin).* |

---

## 2. TDS Sensor (Water Quality)
*Commonly Gravity Analog TDS Sensor*

| Sensor Pin | ESP32 Pin | Wire Color (Suggested) | Notes |
| :--- | :--- | :--- | :--- |
| **VCC / +** | **3.3V** | Red | Power from 3.3V to keep analog output safe. |
| **GND / -** | **GND** | Black | |
| **A / OUT** | **GPIO 32** | Blue | Analog output to ADC1 |

---

## 3. Turbidity Sensor (Water Clarity)
*Commonly analog turbidity module with a small controller board*

| Sensor Pin | ESP32 Pin | Wire Color (Suggested) | Notes |
| :--- | :--- | :--- | :--- |
| **VCC** | **3.3V** | Red | Power from 3.3V to keep analog output safe. |
| **GND** | **GND** | Black | |
| **AOUT / A**| **GPIO 33** | Orange | Analog output to ADC1 |
| **DOUT / D**| *Not Connected* | - | We don't use the digital threshold output |

---

## Shared Pins
Since you have three sensors but only one or two `3.3V` and `GND` pins on the ESP32, you will need to use a breadboard to share the power and ground rails. 

1. Connect the ESP32 **3.3V** pin to the **RED (+)** rail on the breadboard.
2. Connect the ESP32 **GND** pin to the **BLUE/BLACK (-)** rail on the breadboard.
3. Plug the VCC and GND wires from all three sensors into these rails.
