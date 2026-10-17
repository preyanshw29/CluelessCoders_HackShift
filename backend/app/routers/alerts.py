from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query

from app.alerts import send_alert
from app.db import get_conn, row_to_dict

router = APIRouter()


@router.get("/api/fields/{id}/alerts")
def get_field_alerts(id: int):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id FROM fields WHERE id = ?;", (id,))
    if not cur.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail=f"Field {id} not found")

    cur.execute(
        "SELECT * FROM alerts WHERE field_id = ? ORDER BY ts DESC, id DESC;",
        (id,),
    )
    rows = cur.fetchall()
    conn.close()
    return [row_to_dict(r) for r in rows]


@router.post("/api/alerts/test")
def create_test_alert(
    field_id: int = Query(1, description="Field ID"),
    language: str = Query("hi", description="Language code: hi or en"),
    kind: str = Query("damage_detected", description="Alert kind"),
):
    try:
        return send_alert(field_id=field_id, kind=kind, language=language)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
