#!/usr/bin/env python3
"""
==============================================================================
FLOODGUARD — VIRTUAL HARDWARE SENSOR NODE (ESP8266 + HC-SR04 EMULATOR)
==============================================================================
This script emulates the exact physical behavior, signal processing, and HTTP
telemetry packet transmission of the ESP8266 + HC-SR04 hardware node.

Use this for end-to-end integration testing without requiring physical microcontrollers
or breadboard wiring.

Usage:
    python iot/virtual_sensor_node.py --sensor SN-101 --zone ZONE_B --depth 65.0
    python iot/virtual_sensor_node.py --loop --interval 3 --storm
==============================================================================
"""

import sys
import time
import argparse
import random
import requests
import json
from typing import List

DEFAULT_BACKEND_URL = "http://localhost:8000/api/v1/sensors/reading"
MOUNT_HEIGHT_CM = 120.0  # Sensor mounted 1.2m above dry street level
MEDIAN_SAMPLES = 5


def simulate_raw_ping(true_distance_cm: float, noise_std: float = 0.8) -> float:
    """
    Simulate a single HC-SR04 ultrasonic echo travel time with occasional
    water surface acoustic ripple jitter.
    """
    # 5% chance of an acoustic dropout / multipath spike
    if random.random() < 0.05:
        return min(true_distance_cm + random.uniform(15.0, 45.0), 400.0)
    
    noisy_val = true_distance_cm + random.gauss(0, noise_std)
    return round(max(3.0, min(noisy_val, 400.0)), 2)


def apply_median_filter(samples: List[float]) -> float:
    """Sort samples and select median value (non-linear noise rejection)."""
    sorted_samples = sorted(samples)
    return sorted_samples[len(sorted_samples) // 2]


def transmit_telemetry(
    backend_url: str,
    sensor_id: str,
    zone_id: str,
    water_depth_cm: float,
    raw_distance_cm: float,
    rise_rate_cm_per_min: float,
    battery_pct: float = 98.0
) -> dict:
    """Send HTTP POST payload formatted identically to ESP8266 Arduino HTTPClient."""
    payload = {
        "sensor_id": sensor_id,
        "water_depth_cm": round(water_depth_cm, 1),
        "raw_distance_cm": round(raw_distance_cm, 1),
        "rainfall_1h_mm": 0.0,
        "water_rise_rate_cm_per_min": round(rise_rate_cm_per_min, 2),
        "battery_pct": battery_pct,
        "mode": "real",
        "zone_id": zone_id,
        "latitude": 19.0760,
        "longitude": 72.8777
    }

    resp = requests.post(
        backend_url,
        json=payload,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        timeout=5
    )
    resp.raise_for_status()
    return resp.json()


def main():
    parser = argparse.ArgumentParser(description="FloodGuard Virtual ESP8266 NodeMCU Telemetry Generator")
    parser.add_argument("--url", default=DEFAULT_BACKEND_URL, help="Backend endpoint URL")
    parser.add_argument("--sensor", default="SN-101", help="Sensor node ID")
    parser.add_argument("--zone", default="ZONE_B", help="Zone ID")
    parser.add_argument("--depth", type=float, default=55.0, help="Target water depth (cm)")
    parser.add_argument("--loop", action="store_true", help="Run continuous transmission loop")
    parser.add_argument("--interval", type=int, default=3, help="Transmission interval in seconds")
    parser.add_argument("--storm", action="store_true", help="Simulate a progressive storm surge event")
    args = parser.parse_args()

    print("=" * 65)
    print("  FLOODGUARD VIRTUAL HARDWARE NODE (ESP8266 + HC-SR04 EMULATOR)  ")
    print("=" * 65)
    print(f"Target URL:    {args.url}")
    print(f"Sensor ID:     {args.sensor} ({args.zone})")
    print(f"Mount Height:  {MOUNT_HEIGHT_CM} cm above roadbed")
    print(f"Mode:          {'Continuous Loop' if args.loop else 'Single Shot'}")
    if args.storm:
        print("Dynamic:       Active Storm Surge Progression Model Enabled")
    print("=" * 65)

    current_depth = args.depth
    prev_depth = current_depth
    cycle = 0

    try:
        while True:
            cycle += 1
            if args.storm:
                # Progressive storm rise
                increment = random.uniform(1.2, 3.5)
                current_depth = min(current_depth + increment, 115.0)

            # 1. Physics conversion: Distance = Mount_Height - Depth
            true_distance = max(MOUNT_HEIGHT_CM - current_depth, 5.0)

            # 2. Acquire 5 acoustic pings with simulated noise
            pings = [simulate_raw_ping(true_distance) for _ in range(MEDIAN_SAMPLES)]
            filtered_dist = apply_median_filter(pings)

            # 3. Compute derived depth
            derived_depth = max(0.0, MOUNT_HEIGHT_CM - filtered_dist)

            # 4. Compute rise rate (cm/min)
            rise_rate = ((derived_depth - prev_depth) / args.interval) * 60.0
            prev_depth = derived_depth

            # 5. Transmit packet
            t0 = time.time()
            res = transmit_telemetry(
                backend_url=args.url,
                sensor_id=args.sensor,
                zone_id=args.zone,
                water_depth_cm=derived_depth,
                raw_distance_cm=filtered_dist,
                rise_rate_cm_per_min=rise_rate,
                battery_pct=98.5
            )
            elapsed_ms = (time.time() - t0) * 1000

            # Log formatted output
            risk = res.get("risk_level", "UNKNOWN")
            risk_color = (
                "\033[91m" if risk == "CRITICAL"
                else "\033[93m" if risk == "HIGH"
                else "\033[94m" if risk == "MODERATE"
                else "\033[92m"
            )
            reset_color = "\033[0m"

            print(
                f"[Cycle #{cycle:03d}] Pings={pings} -> Filtered={filtered_dist:.1f}cm | "
                f"Depth={derived_depth:.1f}cm ({rise_rate:+.1f} cm/min) | "
                f"Risk={risk_color}{risk}{reset_color} | "
                f"HTTP {elapsed_ms:.0f}ms OK (ID: {res.get('reading_id', '')[:8]}...)"
            )

            if not args.loop:
                break
            time.sleep(args.interval)

    except KeyboardInterrupt:
        print("\n[VIRTUAL NODE] Telemetry stream stopped by operator.")
    except Exception as e:
        print(f"\n[ERROR] Telemetry dispatch failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
