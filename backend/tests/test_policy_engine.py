import pytest
from app.policy_engine import evaluate
from app.scoring import confidence, confidence_label, visual_score

SAMPLE_POLICY = {
    "scheme": "PMFBY-style sample policy",
    "policy_no": "DEMO-2026-0001",
    "crop": "tomato",
    "area_ha": 1.5,
    "sum_insured_total": 120000,
    "deductible_pct": 10,
    "reporting_window_hours": 72,
    "perils": {
        "individual": ["hail", "flood"],
        "area_based": ["drought", "frost"],
    },
    "report_to": {
        "channel": "Crop Insurance app / insurer helpline / bank branch",
        "helpline": "14447",
        "note": "Sample value; verify current channel and window for the scheme and state.",
    },
}

SAMPLE_FIELD = {
    "id": 1,
    "name": "North Plot",
    "crop": "Tomato",
    "area_ha": 1.5,
}


def test_hail_individual_claim():
    event = {
        "ts": "2026-10-17T12:00:00Z",
        "peril": "hail",
        "canopy_loss_pct": 40.0,
    }
    res = evaluate(event, SAMPLE_POLICY, SAMPLE_FIELD)

    assert res["claimability"] == "individual"
    assert res["covered"] is True
    # SI = 120000, ded = 12000
    # loss = 40%
    # claim_low = 120000 * (30/100) - 12000 = 36000 - 12000 = 24000
    # claim_high = 120000 * (50/100) - 12000 = 60000 - 12000 = 48000
    assert res["claim_low"] == 24000
    assert res["claim_high"] == 48000
    assert res["deadline_ts"] == "2026-10-20T12:00:00Z"
    assert "Individual claim" in res["note"]


def test_flood_individual_claim():
    event = {
        "ts": "2026-10-17T06:00:00Z",
        "peril": "flood",
        "canopy_loss_pct": 50.0,
    }
    res = evaluate(event, SAMPLE_POLICY, SAMPLE_FIELD)

    assert res["claimability"] == "individual"
    assert res["covered"] is True
    # claim_low = 120000 * 0.40 - 12000 = 36000
    # claim_high = 120000 * 0.60 - 12000 = 60000
    assert res["claim_low"] == 36000
    assert res["claim_high"] == 60000
    assert res["deadline_ts"] == "2026-10-20T06:00:00Z"


def test_area_based_drought():
    event = {
        "ts": "2026-10-17T10:00:00Z",
        "peril": "drought",
        "canopy_loss_pct": 35.0,
    }
    res = evaluate(event, SAMPLE_POLICY, SAMPLE_FIELD)

    assert res["claimability"] == "area_based"
    assert res["covered"] is True
    assert res["claim_low"] is None
    assert res["claim_high"] is None
    assert "Widespread loss" in res["note"]


def test_uncovered_fertilizer_spike():
    event = {
        "ts": "2026-10-17T08:00:00Z",
        "peril": "fertilizer_spike",
        "canopy_loss_pct": 0.0,
    }
    res = evaluate(event, SAMPLE_POLICY, SAMPLE_FIELD)

    assert res["claimability"] == "not_covered"
    assert res["covered"] is False
    assert res["claim_low"] is None
    assert res["claim_high"] is None
    assert res["deadline_ts"] is None
    assert "Not an insurable peril" in res["note"]


def test_confidence_labels():
    assert confidence_label(0.78) == "High"
    assert confidence_label(0.70) == "High"
    assert confidence_label(0.55) == "Medium"
    assert confidence_label(0.40) == "Medium"
    assert confidence_label(0.35) == "Low"
    assert confidence_label(0.10) == "Low"


def test_confidence_formula():
    # 0.4*weather_score + 0.4*visual_score + 0.2*sensor_score
    # weather=1.0, canopy_loss=42.5 -> visual_score = min(42.5/50, 1) = 0.85
    # sensor=1.0 -> 0.4*1.0 + 0.4*0.85 + 0.2*1.0 = 0.4 + 0.34 + 0.2 = 0.94
    c = confidence(1.0, 42.5, 1.0)
    assert c == 0.94
