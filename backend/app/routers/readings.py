from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel
from app.db import get_conn, row_to_dict

router = APIRouter()


class ReadingIn(BaseModel):
    field_id: int
    ts: Optional[str] = None
    soil_moisture_pct: float
    soil_temp_c: float
    air_temp_c: float
    humidity_pct: float
    rainfall_mm: float
    soil_ec_ds_m: float
    soil_ph: float
    scenario: Optional[str] = "normal"


@router.post("/api/readings", status_code=status.HTTP_201_CREATED)
def post_reading(reading: ReadingIn):
    ts = reading.ts or datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM fields WHERE id = ?;", (reading.field_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Field not found")

        cur.execute(
            """
            INSERT INTO readings (field_id, ts, soil_moisture_pct, soil_temp_c, air_temp_c, humidity_pct, rainfall_mm, soil_ec_ds_m, soil_ph, scenario)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """,
            (
                reading.field_id,
                ts,
                reading.soil_moisture_pct,
                reading.soil_temp_c,
                reading.air_temp_c,
                reading.humidity_pct,
                reading.rainfall_mm,
                reading.soil_ec_ds_m,
                reading.soil_ph,
                reading.scenario,
            ),
        )
        conn.commit()
        reading_id = cur.lastrowid
        cur.execute("SELECT * FROM readings WHERE id = ?;", (reading_id,))
        return row_to_dict(cur.fetchone())
    finally:
        conn.close()


@router.get("/api/fields/{id}/readings")
def get_readings(id: int, limit: int = Query(200, ge=1, le=1000)):
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT * FROM readings WHERE field_id = ? ORDER BY id DESC LIMIT ?;",
            (id, limit),
        )
        return [row_to_dict(r) for r in cur.fetchall()]
    finally:
        conn.close()
