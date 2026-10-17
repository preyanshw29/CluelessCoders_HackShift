import json
from fastapi import APIRouter, HTTPException
from app.db import get_conn, row_to_dict

router = APIRouter()


def format_event(row_dict: dict) -> dict:
    res = dict(row_dict)
    if res.get("weather_json"):
        try:
            res["weather"] = json.loads(res["weather_json"])
        except Exception:
            res["weather"] = None
    else:
        res["weather"] = None
    res.pop("weather_json", None)
    return res


@router.get("/api/fields/{id}/events")
def get_field_events(id: int):
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT * FROM events WHERE field_id = ? ORDER BY id DESC;",
            (id,),
        )
        return [format_event(row_to_dict(r)) for r in cur.fetchall()]
    finally:
        conn.close()


@router.get("/api/events/{id}")
def get_event(id: int):
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM events WHERE id = ?;", (id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Event not found")
        return format_event(row_to_dict(row))
    finally:
        conn.close()
