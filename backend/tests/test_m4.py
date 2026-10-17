import json
import os
import sqlite3
import sys
import tempfile
from pathlib import Path
from unittest.mock import patch

# Ensure backend directory is in sys.path regardless of CWD
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import pytest

from app.alerts import build_message, send_alert
from app.market import get_best_mandi, get_market_prices, haversine_km
from app.report import generate_claim_pdf, utc_to_ist_str
from app.routers.organic import get_trust_score, add_field_input, InputLogCreate
from app.seed_organic import seed_demo

SCHEMA_PATH = BACKEND_DIR / "schema.sql"


@pytest.fixture
def test_db():
    """Create a temporary SQLite database populated with schema and fixtures."""
    db_file = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    db_file.close()
    db_path = Path(db_file.name)

    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        conn.executescript(f.read())

    # Insert sample farmer
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO farmers (id, name, phone, language, village, district, state)
        VALUES (1, 'Ramesh Kumar', '+919999999999', 'hi', 'Arang', 'Raipur', 'Chhattisgarh');
        """
    )
    # Insert sample field
    cur.execute(
        """
        INSERT INTO fields (id, farmer_id, name, crop, lat, lon, area_ha)
        VALUES (1, 1, 'North Plot', 'tomato', 21.2514, 81.6296, 1.5);
        """
    )
    # Insert sample policy
    policy_json = json.dumps(
        {
            "scheme": "PMFBY-style sample",
            "policy_no": "FP-2026-TEST",
            "crop": "tomato",
            "sum_insured_total": 120000,
            "deductible_pct": 10,
            "reporting_window_hours": 72,
            "perils": {"individual": ["hail", "flood"], "area_based": ["drought", "frost"]},
            "report_to": {"channel": "PMFBY Helpline", "helpline": "14447"},
        }
    )
    cur.execute("INSERT INTO policies (id, field_id, terms_json) VALUES (1, 1, ?);", (policy_json,))

    # Insert sample event
    weather_json = json.dumps({"rain_24h_mm": 35, "max_gust_kmh": 78, "min_temp_c": 13, "max_temp_c": 20, "weather_code": 96, "source": "mock"})
    cur.execute(
        """
        INSERT INTO events (id, field_id, ts, peril, source, weather_json, canopy_loss_pct, weather_score, visual_score, sensor_score, confidence, confidence_label, status)
        VALUES (1, 1, '2026-10-17T12:00:00Z', 'hail', 'simulated', ?, 42.5, 1.0, 0.85, 1.0, 0.88, 'High', 'claim_prepared');
        """,
        (weather_json,),
    )

    # Insert sample claim
    cur.execute(
        """
        INSERT INTO claims (id, event_id, field_id, created_ts, claimability, peril, covered, claim_low, claim_high, confidence, confidence_label, deadline_ts, report_channel_json)
        VALUES (1, 1, 1, '2026-10-17T12:05:00Z', 'individual', 'hail', 1, 27000.0, 51000.0, 0.88, 'High', '2026-10-20T12:00:00Z', ?);
        """,
        (json.dumps({"channel": "Helpline", "helpline": "14447"}),),
    )

    # Insert sample readings
    for i in range(24):
        cur.execute(
            """
            INSERT INTO readings (field_id, ts, soil_moisture_pct, soil_temp_c, air_temp_c, humidity_pct, rainfall_mm, soil_ec_ds_m, soil_ph, scenario)
            VALUES (1, ?, 65.0, 20.0, 15.0, 90.0, 10.0, 0.95, 6.5, 'hail');
            """,
            (f"2026-10-17T{i:02d}:00:00Z",),
        )

    # Insert sample image
    cur.execute(
        """
        INSERT INTO images (id, field_id, ts, role, filename, lat, lon, sha256, prev_hash, chain_hash)
        VALUES (1, 1, '2026-10-17T12:00:00Z', 'baseline', 'demo.jpg', 21.2514, 81.6296, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', '0'*64, 'a'*64);
        """
    )
    conn.commit()
    conn.close()

    def get_test_conn():
        c = sqlite3.connect(str(db_path))
        c.row_factory = sqlite3.Row
        c.execute("PRAGMA foreign_keys = ON;")
        return c

    with patch("app.db.get_conn", side_effect=get_test_conn), \
         patch("app.alerts.get_conn", side_effect=get_test_conn), \
         patch("app.market.get_conn", side_effect=get_test_conn), \
         patch("app.report.get_conn", side_effect=get_test_conn), \
         patch("app.routers.organic.get_conn", side_effect=get_test_conn):
        yield {"db_path": db_path, "get_conn": get_test_conn}

    try:
        os.unlink(db_path)
    except Exception:
        pass


def test_seed_organic_and_trust_score(test_db):
    conn = test_db["get_conn"]()
    seed_demo(conn)
    conn.close()

    score_result = get_trust_score(1)
    assert "score" in score_result
    assert 0 <= score_result["score"] <= 100
    assert score_result["label"] in ["Strong", "Moderate", "Weak"]
    assert "log_completeness" in score_result["components"]
    assert "photo_continuity" in score_result["components"]
    assert "anomaly_free" in score_result["components"]
    assert "disclaimer" in score_result


def test_market_prices_and_best_mandi(test_db):
    prices = get_market_prices("Tomato", "Chhattisgarh")
    assert prices["commodity"] == "Tomato"
    assert prices["source"] in ["agmarknet", "fallback_csv"]
    assert isinstance(prices["rows"], list)

    best = get_best_mandi(1, 10.0)
    assert best["commodity"] == "Tomato"
    assert "options" in best
    assert len(best["options"]) > 0

    # Ensure options are sorted descending by net_price_per_qtl
    net_prices = [opt["net_price_per_qtl"] for opt in best["options"]]
    assert net_prices == sorted(net_prices, reverse=True)
    assert best["best"] == best["options"][0]["market"]


def test_send_alert_logged_mode(test_db):
    # Ensure twilio env is unset so it uses logged mode
    with patch.dict(os.environ, {"TWILIO_ACCOUNT_SID": "", "TWILIO_AUTH_TOKEN": ""}, clear=False):
        alert = send_alert(field_id=1, kind="damage_detected", claim_id=1, language="hi")
        assert alert["id"] > 0
        assert alert["channel"] == "app"
        assert alert["status"] == "logged"
        assert "खेत" in alert["message"] or "PMFBY" in alert["message"] or "damage" in alert["message"]


def test_generate_claim_pdf_output(test_db):
    rel_path = generate_claim_pdf(1)
    assert rel_path.startswith("reports/claim_1")

    from app.db import DATA_DIR
    full_path = DATA_DIR / rel_path
    assert full_path.exists()
    assert full_path.stat().st_size > 500

    # Verify PDF magic bytes %PDF
    with open(full_path, "rb") as f:
        header = f.read(4)
        assert header == b"%PDF"


def test_bilingual_alert_templates():
    hi_msg = build_message(
        kind="damage_detected",
        language="hi",
        farmer_name="Ramesh",
        field_name="North Plot",
        crop="Tomato",
        peril="hail",
        deadline_str="within 72 hours",
        helpline="14447",
    )
    assert "किसान Ramesh" in hi_msg
    assert "ओलावृष्टि" in hi_msg
    assert "14447" in hi_msg

    en_msg = build_message(
        kind="damage_detected",
        language="en",
        farmer_name="Ramesh",
        field_name="North Plot",
        crop="Tomato",
        peril="hail",
        deadline_str="within 72 hours",
        helpline="14447",
    )
    assert "Farmer Ramesh" in en_msg
    assert "Hailstorm" in en_msg
    assert "14447" in en_msg


def test_haversine_distance_and_transport_math():
    # Raipur (21.2514, 81.6296) to Bilaspur (22.0797, 82.1409) is ~106 km straight line
    dist = haversine_km(21.2514, 81.6296, 22.0797, 82.1409)
    assert 90.0 <= dist <= 120.0


def test_chemical_input_penalty_in_trust_score(test_db):
    # First get initial score
    initial_score = get_trust_score(1)
    initial_anomaly = initial_score["components"]["anomaly_free"]

    # Log chemical input (urea)
    add_field_input(1, InputLogCreate(input_type="urea", description="synthetic booster"))

    # Score should reflect deduction
    updated_score = get_trust_score(1)
    updated_anomaly = updated_score["components"]["anomaly_free"]
    assert updated_anomaly <= initial_anomaly - 10.0
    assert any(f["type"] == "chemical_input" for f in updated_score["flags"])


def test_utc_to_ist_conversion():
    res = utc_to_ist_str("2026-10-18T10:00:00Z")
    assert "UTC" in res
    assert "IST" in res
