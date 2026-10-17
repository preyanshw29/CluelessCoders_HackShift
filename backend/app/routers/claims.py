import json
from fastapi import APIRouter, HTTPException
from app.db import get_conn, row_to_dict

router = APIRouter()


def format_claim(row_dict: dict) -> dict:
    res = dict(row_dict)
    res["covered"] = bool(res.get("covered", 0))
    if res.get("report_channel_json"):
        try:
            res["report_channel"] = json.loads(res["report_channel_json"])
        except Exception:
            res["report_channel"] = {
                "channel": "Crop Insurance app / insurer helpline / bank branch",
                "helpline": "14447",
                "note": "Sample value",
            }
    else:
        res["report_channel"] = {
            "channel": "Crop Insurance app / insurer helpline / bank branch",
            "helpline": "14447",
            "note": "Sample value",
        }
    res.pop("report_channel_json", None)
    res.pop("pdf_path", None)
    res["report_url"] = f"/api/claims/{res['id']}/report.pdf"
    return res


@router.get("/api/fields/{id}/claims")
def get_field_claims(id: int):
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT * FROM claims WHERE field_id = ? ORDER BY id DESC;",
            (id,),
        )
        return [format_claim(row_to_dict(r)) for r in cur.fetchall()]
    finally:
        conn.close()


@router.get("/api/claims/{id}")
def get_claim(id: int):
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM claims WHERE id = ?;", (id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Claim not found")
        return format_claim(row_to_dict(row))
    finally:
        conn.close()
