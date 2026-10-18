import urllib.request
import json
import sys

endpoints = [
    ("ML Health", "http://localhost:8001/health"),
    ("Backend Health", "http://localhost:8000/api/health"),
    ("Field 1 Profile", "http://localhost:8000/api/fields/1"),
    ("Field 1 Readings", "http://localhost:8000/api/fields/1/readings?limit=5"),
    ("Mandi Optimizer", "http://localhost:8000/api/market/best?field_id=1"),
    ("Organic Trust Score", "http://localhost:8000/api/fields/1/trust-score"),
    ("Frontend Dashboard", "http://localhost:3000/"),
    ("Frontend Disease / Doctor AI", "http://localhost:3000/disease"),
    ("Frontend Simulate Console", "http://localhost:3000/simulate"),
    ("Frontend Market & Trust Score", "http://localhost:3000/market"),
    ("Frontend Field Telemetry", "http://localhost:3000/fields/1"),
    ("Frontend Evidence Vault", "http://localhost:3000/fields/1/evidence"),
    ("Frontend Claim Hero", "http://localhost:3000/claims/1"),
]

print(f"{'Service / Route':<32} | {'Status':<8} | Details")
print("-" * 75)

all_ok = True
for name, url in endpoints:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            status = resp.status
            content_type = resp.headers.get("content-type", "")
            print(f"{name:<32} | {status:<8} | OK ({content_type[:30]})")
    except Exception as e:
        print(f"{name:<32} | ERROR    | {e}")
        all_ok = False

if all_ok:
    print("\n>>> ALL SERVICES AND ROUTES ARE RUNNING LIVE WITHOUT BREAKAGE! <<<")
else:
    print("\n>>> Some services failed to respond. <<<")
    sys.exit(1)
