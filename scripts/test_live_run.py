import requests
import json
import sys

# Configure UTF-8 for Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

base = "http://localhost:8000"

print("==================================================")
print(" FASALSAKSHI BACKEND LIVE EXECUTION TEST")
print("==================================================")

# 1. Health check
print("\n[1] Health Check:")
h = requests.get(f"{base}/api/health", timeout=5).json()
print("   Status:", h)

# 2. Field Profile
print("\n[2] Farmer & Field Profile:")
f = requests.get(f"{base}/api/fields/1", timeout=5).json()
farmer = f.get("farmer", {})
print(f"   Field: {f.get('name')} | Crop: {f.get('crop')} ({f.get('area_ha')} ha)")
print(f"   Farmer: {farmer.get('name')} | Phone: {farmer.get('phone')} | Village: {farmer.get('village')}, {farmer.get('district')}")

# 3. Policy
print("\n[3] Insurance Policy:")
pol = requests.get(f"{base}/api/fields/1/policy", timeout=5).json()
print(f"   Scheme: {pol.get('scheme')} | Policy No: {pol.get('policy_no')}")
print(f"   Sum Insured: Rs. {pol.get('sum_insured_total')} | Deductible: {pol.get('deductible_pct')}%")

# 4. Trigger Hail Calamity Simulation
print("\n[4] Simulating Hailstorm Calamity Event:")
sim = requests.post(f"{base}/api/simulate/hail?field_id=1", timeout=15).json()
event = sim.get("event") or {}
claim = sim.get("claim") or {}
alert = sim.get("alert") or {}

print(f"   Peril: {event.get('peril')} | Status: {event.get('status')}")
print(f"   Multi-Signal Triangulation:")
print(f"     - Weather Score: {event.get('weather_score')}")
print(f"     - Visual Canopy Loss: {event.get('visual_score')} ({event.get('canopy_loss_pct')}%)")
print(f"     - Sensor Corroboration: {event.get('sensor_score')}")
print(f"     - Overall Confidence: {event.get('confidence')} ({event.get('confidence_label')})")
print(f"   Claim Dossier Generated:")
print(f"     - Estimated Payout: Rs. {claim.get('claim_low')} to Rs. {claim.get('claim_high')}")
print(f"     - 72-Hour Deadline: {claim.get('deadline_ts')}")
print(f"     - Claim Report URL: {claim.get('report_url')}")
print(f"   Alert Dispatched:")
print(f"     - Channel: {alert.get('channel')} | Language: {alert.get('language')}")
print(f"     - Message: {alert.get('message')}")

# 5. Cryptographic Hash Chain Audit
print("\n[5] Cryptographic Hash Chain Audit:")
chain = requests.get(f"{base}/api/fields/1/chain/verify", timeout=5).json()
print(f"   Chain Valid: {chain.get('valid')}")
print(f"   Total Images Linked: {chain.get('length')}")
print(f"   Head Hash: {chain.get('head_hash')}")

# 6. Stream Live Sensor Telemetry
print("\n[6] Posting Live IoT Sensor Telemetry:")
reading_payload = {
    "field_id": 1,
    "soil_moisture_pct": 64.5,
    "soil_temp_c": 19.2,
    "air_temp_c": 15.8,
    "humidity_pct": 92.0,
    "rainfall_mm": 11.5,
    "soil_ec_ds_m": 0.98,
    "soil_ph": 6.6,
    "scenario": "hail"
}
reading_resp = requests.post(f"{base}/api/readings", json=reading_payload, timeout=5)
print(f"   Status Code: HTTP {reading_resp.status_code}")
created_reading = reading_resp.json()
print(f"   Reading ID: {created_reading.get('id')} | TS: {created_reading.get('ts')}")

print("\n==================================================")
print(" LIVE EXECUTION SUCCESSFUL")
print("==================================================")
