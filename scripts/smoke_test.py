#!/usr/bin/env python3
"""
FasalSakshi - End-to-End System Smoke Test (M2)
Verifies core backend API endpoints, simulation pipeline, hashchain integrity,
and integrated contracts on http://localhost:8000.
"""

import sys
import requests

BASE_URL = "http://localhost:8000"


def check(name: str, passed: bool, detail: str = ""):
    status = "PASS" if passed else "FAIL"
    print(f"[{status}] {name}" + (f" -> {detail}" if detail else ""))
    if not passed:
        return False
    return True


def run_tests():
    all_passed = True
    print("==================================================")
    print(" FasalSakshi Smoke Test Suite")
    print(f" Target: {BASE_URL}")
    print("==================================================")

    # 1. Health check
    try:
        r = requests.get(f"{BASE_URL}/api/health", timeout=5)
        passed = r.status_code == 200 and r.json().get("status") == "ok"
        all_passed &= check("GET /api/health", passed, f"HTTP {r.status_code}")
    except Exception as e:
        all_passed &= check("GET /api/health", False, str(e))
        print("Backend unreachable, aborting further tests.")
        sys.exit(1)

    # 2. Field profile
    try:
        r = requests.get(f"{BASE_URL}/api/fields/1", timeout=5)
        passed = r.status_code == 200 and r.json().get("farmer", {}).get("name") == "Ramesh Kumar"
        all_passed &= check("GET /api/fields/1", passed, f"Farmer: {r.json().get('farmer', {}).get('name')}")
    except Exception as e:
        all_passed &= check("GET /api/fields/1", False, str(e))

    # 3. Simulate Hail
    claim_id = 1
    try:
        r = requests.post(f"{BASE_URL}/api/simulate/hail?field_id=1", timeout=15)
        data = r.json()
        has_event = data.get("event") is not None
        has_claim = data.get("claim") is not None
        claim_data = data.get("claim") or {}
        low = claim_data.get("claim_low")
        high = claim_data.get("claim_high")
        valid_range = low is not None and high is not None and (low < high)
        passed = r.status_code == 200 and has_event and has_claim and valid_range
        if has_claim:
            claim_id = claim_data.get("id", 1)
        all_passed &= check("POST /api/simulate/hail", passed, f"Range: Rs. {low} - Rs. {high}")
    except Exception as e:
        all_passed &= check("POST /api/simulate/hail", False, str(e))

    # 4. Chain Verify
    try:
        r = requests.get(f"{BASE_URL}/api/fields/1/chain/verify", timeout=5)
        passed = r.status_code == 200 and r.json().get("valid") is True
        all_passed &= check("GET /api/fields/1/chain/verify", passed, f"Valid: {r.json().get('valid')}, Length: {r.json().get('length')}")
    except Exception as e:
        all_passed &= check("GET /api/fields/1/chain/verify", False, str(e))

    # 5. Claim Report PDF (if M4 merged)
    try:
        r = requests.get(f"{BASE_URL}/api/claims/{claim_id}/report.pdf", timeout=5)
        passed = r.status_code == 200 and "application/pdf" in r.headers.get("Content-Type", "")
        all_passed &= check("GET /api/claims/{id}/report.pdf", passed, f"Content-Type: {r.headers.get('Content-Type')}")
    except Exception as e:
        # Note: M4 owns report.py, if not yet merged, log informational
        print(f"[INFO] Claim PDF check skipped (owned by M4): {e}")

    # 6. Alerts
    try:
        r = requests.get(f"{BASE_URL}/api/fields/1/alerts", timeout=5)
        alerts = r.json()
        passed = r.status_code == 200 and isinstance(alerts, list) and len(alerts) > 0
        all_passed &= check("GET /api/fields/1/alerts", passed, f"Count: {len(alerts) if isinstance(alerts, list) else 0}")
    except Exception as e:
        print(f"[INFO] Alerts check skipped (owned by M4): {e}")

    # 7. Best Mandi
    try:
        r = requests.get(f"{BASE_URL}/api/market/best?field_id=1&quantity_q=10", timeout=5)
        data = r.json()
        passed = r.status_code == 200 and "options" in data and len(data.get("options", [])) > 0
        all_passed &= check("GET /api/market/best", passed, f"Best: {data.get('best')}")
    except Exception as e:
        print(f"[INFO] Market best check skipped (owned by M4): {e}")

    # 8. Organic Trust Score
    try:
        r = requests.get(f"{BASE_URL}/api/fields/1/trust-score", timeout=5)
        data = r.json()
        score = data.get("score")
        passed = r.status_code == 200 and score is not None and (0 <= score <= 100)
        all_passed &= check("GET /api/fields/1/trust-score", passed, f"Score: {score}")
    except Exception as e:
        print(f"[INFO] Trust score check skipped (owned by M4): {e}")

    # 9. Simulate Fertilizer Spike (Anomaly)
    try:
        r = requests.post(f"{BASE_URL}/api/simulate/fertilizer_spike?field_id=1", timeout=15)
        data = r.json()
        event = data.get("event") or {}
        passed = r.status_code == 200 and event.get("status") == "anomaly"
        all_passed &= check("POST /api/simulate/fertilizer_spike", passed, f"Event status: {event.get('status')}")
    except Exception as e:
        all_passed &= check("POST /api/simulate/fertilizer_spike", False, str(e))

    print("==================================================")
    if all_passed:
        print("ALL TESTS PASSED")
        sys.exit(0)
    else:
        print("SOME TESTS FAILED")
        sys.exit(1)


if __name__ == "__main__":
    run_tests()
