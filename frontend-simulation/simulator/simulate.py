#!/usr/bin/env python3
"""
FasalSakshi - Field Sensor Simulator (Member 3)

Generates live synthetic sensor readings from the shared contracts/scenario_profiles.json
and streams them to the FasalSakshi backend API (/api/readings).
Can also trigger a full scenario simulation via --trigger.
"""

import argparse
import json
import os
import random
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

try:
    import requests
except ImportError:
    print("Error: 'requests' package is required. Install via: pip install requests", file=sys.stderr)
    sys.exit(1)


def find_scenario_profiles() -> Path:
    """Locate contracts/scenario_profiles.json across common relative directories."""
    script_dir = Path(__file__).resolve().parent
    candidates = [
        script_dir.parent / "contracts" / "scenario_profiles.json",
        script_dir / "contracts" / "scenario_profiles.json",
        Path.cwd() / "contracts" / "scenario_profiles.json",
        Path.cwd().parent / "contracts" / "scenario_profiles.json",
    ]
    for c in candidates:
        if c.is_file():
            return c
    raise FileNotFoundError(
        "Could not find contracts/scenario_profiles.json. Looked at: "
        + ", ".join(str(p) for p in candidates)
    )


def load_scenario_profiles(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def generate_reading(profile: dict, scenario: str, field_id: int) -> dict:
    """Generate one synthetic reading according to the scenario ranges."""
    scenario_ranges = profile["readings"].get(scenario)
    if not scenario_ranges:
        available = list(profile["readings"].keys())
        raise ValueError(f"Unknown scenario '{scenario}'. Available scenarios: {available}")

    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    reading = {
        "field_id": field_id,
        "ts": now_iso,
        "soil_moisture_pct": round(random.uniform(*scenario_ranges["soil_moisture_pct"]), 2),
        "soil_temp_c": round(random.uniform(*scenario_ranges["soil_temp_c"]), 2),
        "air_temp_c": round(random.uniform(*scenario_ranges["air_temp_c"]), 2),
        "humidity_pct": round(random.uniform(*scenario_ranges["humidity_pct"]), 2),
        "rainfall_mm": round(random.uniform(*scenario_ranges["rainfall_mm"]), 2),
        "soil_ec_ds_m": round(random.uniform(*scenario_ranges["soil_ec_ds_m"]), 2),
        "soil_ph": round(random.uniform(*scenario_ranges["soil_ph"]), 2),
        "scenario": scenario,
    }
    return reading


def trigger_backend_simulation(api_url: str, scenario: str, field_id: int):
    """Trigger the backend /api/simulate/{scenario} endpoint directly."""
    target_url = f"{api_url.rstrip('/')}/api/simulate/{scenario}?field_id={field_id}"
    print(f"\n[Trigger] Calling POST {target_url}...")
    try:
        resp = requests.post(target_url, timeout=30)
        print(f"[Trigger] Status: {resp.status_code}")
        try:
            data = resp.json()
            print("[Trigger] Response:\n" + json.dumps(data, indent=2))
        except Exception:
            print(f"[Trigger] Raw output: {resp.text}")
    except requests.exceptions.RequestException as e:
        print(f"[Trigger] Error connecting to backend: {e}", file=sys.stderr)


def main():
    parser = argparse.ArgumentParser(
        description="FasalSakshi Field Sensor Telemetry Simulator (M3)"
    )
    parser.add_argument(
        "--scenario",
        default="normal",
        choices=["normal", "hail", "flood", "drought", "frost", "fertilizer_spike"],
        help="Scenario profile to simulate (default: normal)",
    )
    parser.add_argument(
        "--field",
        type=int,
        default=1,
        help="Target field ID (default: 1)",
    )
    parser.add_argument(
        "--interval",
        type=float,
        default=5.0,
        help="Interval between simulated readings in seconds (default: 5.0)",
    )
    parser.add_argument(
        "--count",
        type=int,
        default=20,
        help="Number of readings to post (0 or negative for continuous loop, default: 20)",
    )
    parser.add_argument(
        "--api",
        default="http://localhost:8000",
        help="Backend API base URL (default: http://localhost:8000)",
    )
    parser.add_argument(
        "--trigger",
        action="store_true",
        help="Trigger backend /api/simulate/{scenario} once before or after streaming",
    )

    args = parser.parse_args()

    try:
        profile_path = find_scenario_profiles()
        profiles = load_scenario_profiles(profile_path)
    except Exception as e:
        print(f"Error loading contracts: {e}", file=sys.stderr)
        sys.exit(1)

    print("=============================================================")
    print(" FasalSakshi - Sensor Telemetry Simulator (Member 3)")
    print("=============================================================")
    print(f" Profile:  {profile_path}")
    print(f" Scenario: {args.scenario}")
    print(f" Field ID: {args.field}")
    print(f" Target:   {args.api}/api/readings")
    print(f" Interval: {args.interval}s | Count: {'Infinite' if args.count <= 0 else args.count}")
    print("=============================================================\n")

    if args.trigger:
        trigger_backend_simulation(args.api, args.scenario, args.field)

    endpoint = f"{args.api.rstrip('/')}/api/readings"
    sent = 0

    try:
        while True:
            sent += 1
            reading = generate_reading(profiles, args.scenario, args.field)

            try:
                resp = requests.post(endpoint, json=reading, timeout=5)
                status_str = f"HTTP {resp.status_code}"
                if resp.status_code in (200, 201):
                    status_badge = "OK"
                else:
                    status_badge = "WARN"
            except requests.exceptions.RequestException as req_err:
                status_str = f"FAILED ({req_err})"
                status_badge = "ERR"

            print(
                f"[{sent:03d}] {reading['ts']} [{status_badge}] "
                f"Moisture:{reading['soil_moisture_pct']:5.1f}% | "
                f"AirTemp:{reading['air_temp_c']:4.1f}°C | "
                f"SoilTemp:{reading['soil_temp_c']:4.1f}°C | "
                f"Humidity:{reading['humidity_pct']:4.1f}% | "
                f"Rain:{reading['rainfall_mm']:4.1f}mm | "
                f"EC:{reading['soil_ec_ds_m']:4.2f}dS/m | "
                f"pH:{reading['soil_ph']:3.1f} -> {status_str}"
            )

            if args.count > 0 and sent >= args.count:
                print(f"\nCompleted {sent} readings.")
                break

            time.sleep(args.interval)

    except KeyboardInterrupt:
        print("\nSimulator stopped by user.")


if __name__ == "__main__":
    main()
