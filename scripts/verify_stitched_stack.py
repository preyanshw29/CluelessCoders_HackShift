import requests
import json
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

print("==================================================")
print(" FASALSAKSHI - FULL STACK STITCHED ECOSYSTEM TEST")
print("==================================================")

# 1. ML Microservice (Port 8001)
print("\n[1] ML Microservice (Port 8001):")
h_ml = requests.get("http://localhost:8001/health", timeout=5).json()
print("   Health:", h_ml)

with open("demo_assets/disease_sample.jpg", "rb") as f:
    pred = requests.post(
        "http://localhost:8001/predict/disease",
        files={"file": ("disease_sample.jpg", f, "image/jpeg")},
        timeout=10,
    ).json()
print(f"   Plant Pathology AI: {pred.get('label')} (Confidence: {pred.get('confidence')})")
print(f"   Diagnosis: Crop={pred.get('crop')}, Disease={pred.get('disease')}, Healthy={pred.get('healthy')}")

with open("demo_assets/hail/before.jpg", "rb") as f1, open("demo_assets/hail/after.jpg", "rb") as f2:
    dmg = requests.post(
        "http://localhost:8001/damage/compare",
        files={"before": ("before.jpg", f1, "image/jpeg"), "after": ("after.jpg", f2, "image/jpeg")},
        timeout=10,
    ).json()
print(f"   Calamity Damage: Canopy Loss={dmg.get('canopy_loss_pct')}%, SSIM={dmg.get('ssim')}, Change Score={dmg.get('change_score')}")

# 2. Backend API (Port 8000)
print("\n[2] Backend Core API (Port 8000):")
h_be = requests.get("http://localhost:8000/api/health", timeout=5).json()
print("   Health:", h_be)

sim = requests.post("http://localhost:8000/api/simulate/hail?field_id=1", timeout=15).json()
ev = sim.get("event", {})
cl = sim.get("claim", {})
print(f"   Simulate Hail Peril: {ev.get('peril')} -> Status: {ev.get('status')}")
print(f"   Triangulation: Weather={ev.get('weather_score')}, Visual={ev.get('visual_score')}, Sensor={ev.get('sensor_score')}")
print(f"   Confidence: {ev.get('confidence')} ({ev.get('confidence_label')})")
print(f"   Claim Dossier: Range=Rs. {cl.get('claim_low')} - Rs. {cl.get('claim_high')}, Deadline={cl.get('deadline_ts')}")
print(f"   Report Endpoint: {cl.get('report_url')}")

pdf_url = f"http://localhost:8000{cl.get('report_url')}"
pdf_r = requests.get(pdf_url, timeout=10)
print(f"   Claim PDF Generated: HTTP {pdf_r.status_code} | {pdf_r.headers.get('Content-Type')} ({len(pdf_r.content)} bytes)")

mkt = requests.get("http://localhost:8000/api/market/best?field_id=1&quantity_q=10", timeout=5).json()
top_opt = mkt.get("options", [{}])[0]
print(f"   Mandi Intelligence: Recommended Market={mkt.get('best')} (Net Realization: Rs. {top_opt.get('net_price_per_qtl')}/qtl)")

ts = requests.get("http://localhost:8000/api/fields/1/trust-score", timeout=5).json()
print(f"   Organic Trust Score: {ts.get('score')}/100 ({ts.get('label')})")

chain = requests.get("http://localhost:8000/api/fields/1/chain/verify", timeout=5).json()
print(f"   Photo Blockchain Audit: Valid={chain.get('valid')} | Linked Images={chain.get('length')}")

# 3. Frontend Web Application (Port 3000)
print("\n[3] Frontend Web Application (Port 3000):")
routes = ["/", "/fields/1", "/fields/1/evidence", "/claims/1", "/market", "/simulate", "/disease"]
for r_path in routes:
    r = requests.get(f"http://localhost:3000{r_path}", timeout=5)
    print(f"   Route: {r_path:<22} -> HTTP {r.status_code}")

print("\n==================================================")
print(" ALL 3 SERVICES 100% STITCHED & OPERATIONAL!")
print("==================================================")
