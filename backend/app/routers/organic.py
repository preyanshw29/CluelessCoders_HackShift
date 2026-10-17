from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
import statistics

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.db import get_conn, row_to_dict

router = APIRouter()

# Note: Soil EC and pH are anomaly flags indicating possible chemical fertilizer / salt dumping,
# but they cannot affirmatively prove produce is organic.


class InputLogCreate(BaseModel):
    input_type: str
    description: Optional[str] = ""
    ts: Optional[str] = None


CHEMICAL_INPUT_TYPES = {"urea", "dap", "pesticide", "herbicide"}


@router.post("/api/fields/{id}/inputs", status_code=status.HTTP_201_CREATED)
def add_field_input(id: int, payload: InputLogCreate):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id FROM fields WHERE id = ?;", (id,))
    if not cur.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail=f"Field {id} not found")

    ts = payload.ts
    if not ts:
        ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    is_chemical = 1 if payload.input_type.strip().lower() in CHEMICAL_INPUT_TYPES else 0

    cur.execute(
        """
        INSERT INTO inputs_log (field_id, ts, input_type, description, is_chemical)
        VALUES (?, ?, ?, ?, ?);
        """,
        (id, ts, payload.input_type.strip().lower(), payload.description, is_chemical),
    )
    new_id = cur.lastrowid
    conn.commit()

    cur.execute("SELECT * FROM inputs_log WHERE id = ?;", (new_id,))
    row = cur.fetchone()
    conn.close()

    result = row_to_dict(row)
    result["is_chemical"] = bool(result["is_chemical"])
    return result


@router.get("/api/fields/{id}/inputs")
def list_field_inputs(id: int):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id FROM fields WHERE id = ?;", (id,))
    if not cur.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail=f"Field {id} not found")

    cur.execute(
        "SELECT * FROM inputs_log WHERE field_id = ? ORDER BY ts DESC, id DESC;",
        (id,),
    )
    rows = cur.fetchall()
    conn.close()

    results = []
    for r in rows:
        d = row_to_dict(r)
        d["is_chemical"] = bool(d["is_chemical"])
        results.append(d)
    return results


@router.get("/api/fields/{id}/trust-score")
def get_trust_score(id: int):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id FROM fields WHERE id = ?;", (id,))
    if not cur.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail=f"Field {id} not found")

    now = datetime.now(timezone.utc)
    thirty_days_ago = (now - timedelta(days=30)).strftime("%Y-%m-%dT%H:%M:%SZ")
    fourteen_days_ago = (now - timedelta(days=14)).strftime("%Y-%m-%dT%H:%M:%SZ")
    twenty_one_days_ago = (now - timedelta(days=21)).strftime("%Y-%m-%dT%H:%M:%SZ")

    # 1. Log completeness (0-40)
    cur.execute(
        "SELECT ts, is_chemical, input_type, description FROM inputs_log WHERE field_id = ? AND ts >= ?;",
        (id, thirty_days_ago),
    )
    input_rows = cur.fetchall()

    logged_days = set()
    for r in input_rows:
        day_str = r["ts"][:10]
        logged_days.add(day_str)

    log_completeness = round(min(40.0, (len(logged_days) / 30.0) * 40.0), 1)

    # 2. Photo continuity (0-30)
    cur.execute(
        "SELECT ts FROM images WHERE field_id = ? AND ts >= ?;",
        (id, fourteen_days_ago),
    )
    recent_images = cur.fetchall()

    cur.execute("SELECT COUNT(*) FROM images WHERE field_id = ?;", (id,))
    total_images_count = cur.fetchone()[0]

    photo_days = set(r["ts"][:10] for r in recent_images)
    computed_continuity = (len(photo_days) / 14.0) * 30.0
    if total_images_count >= 2:
        photo_continuity = round(min(30.0, max(15.0, computed_continuity)), 1)
    else:
        photo_continuity = round(min(30.0, computed_continuity), 1)

    # 3. Anomaly free score (0-30) and flags
    anomaly_free = 30.0
    flags: List[Dict[str, str]] = []

    # Check for chemical inputs in the last 21 days
    cur.execute(
        "SELECT ts, input_type, description FROM inputs_log WHERE field_id = ? AND is_chemical = 1 AND ts >= ?;",
        (id, twenty_one_days_ago),
    )
    recent_chemicals = cur.fetchall()
    for chem in recent_chemicals:
        anomaly_free -= 10.0
        flags.append(
            {
                "ts": chem["ts"],
                "type": "chemical_input",
                "detail": f"Chemical input logged: {chem['input_type']} ({chem['description'] or 'no detail'}). Deducted 10 points.",
            }
        )

    # Check for Electrical Conductivity (EC) spikes
    cur.execute(
        "SELECT ts, soil_ec_ds_m FROM readings WHERE field_id = ? AND ts >= ? ORDER BY ts ASC;",
        (id, thirty_days_ago),
    )
    readings = cur.fetchall()

    if len(readings) >= 10:
        ec_values = [r["soil_ec_ds_m"] for r in readings if r["soil_ec_ds_m"] is not None]
        if ec_values:
            med_ec = statistics.median(ec_values)
            spike_threshold = 1.8 * med_ec

            # Detect spike readings
            spike_readings = [r for r in readings if r["soil_ec_ds_m"] is not None and r["soil_ec_ds_m"] >= spike_threshold]
            if spike_readings:
                # Group by day so we don't double penalize every hourly reading of the same event
                spike_days = {}
                for s in spike_readings:
                    day_key = s["ts"][:10]
                    if day_key not in spike_days:
                        spike_days[day_key] = s

                for day_key, spike in spike_days.items():
                    anomaly_free -= 15.0
                    flags.append(
                        {
                            "ts": spike["ts"],
                            "type": "ec_spike",
                            "detail": f"Soil electrical conductivity spike ({spike['soil_ec_ds_m']} dS/m vs baseline median {med_ec:.2f} dS/m). Suggests salt or synthetic fertilizer addition.",
                        }
                    )

    anomaly_free = max(0.0, anomaly_free)
    total_score = round(min(100.0, max(0.0, log_completeness + photo_continuity + anomaly_free)))

    if total_score >= 70:
        label = "Strong"
    elif total_score >= 40:
        label = "Moderate"
    else:
        label = "Weak"

    conn.close()

    return {
        "score": total_score,
        "label": label,
        "components": {
            "log_completeness": log_completeness,
            "photo_continuity": photo_continuity,
            "anomaly_free": anomaly_free,
        },
        "flags": flags,
        "disclaimer": "Evidence strength, not certification. Official organic certification (NPOP / PGS-India) requires documented practices and lab residue tests.",
    }
