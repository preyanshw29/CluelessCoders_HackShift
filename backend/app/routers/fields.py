import json
from fastapi import APIRouter, HTTPException
from app.db import get_conn, row_to_dict

router = APIRouter()


@router.get("/api/fields")
def get_fields():
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM fields ORDER BY id ASC;")
        field_rows = cur.fetchall()
        result = []
        for f in field_rows:
            f_dict = row_to_dict(f)
            cur.execute("SELECT * FROM farmers WHERE id = ?;", (f_dict["farmer_id"],))
            farmer_row = cur.fetchone()
            f_dict["farmer"] = row_to_dict(farmer_row)
            result.append(f_dict)
        return result
    finally:
        conn.close()


@router.get("/api/fields/{id}")
def get_field(id: int):
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM fields WHERE id = ?;", (id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Field not found")
        f_dict = row_to_dict(row)
        cur.execute("SELECT * FROM farmers WHERE id = ?;", (f_dict["farmer_id"],))
        farmer_row = cur.fetchone()
        f_dict["farmer"] = row_to_dict(farmer_row)
        return f_dict
    finally:
        conn.close()


@router.get("/api/fields/{id}/policy")
def get_policy(id: int):
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM policies WHERE field_id = ? ORDER BY id DESC LIMIT 1;", (id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Policy not found")
        policy = json.loads(row["terms_json"])
        policy["id"] = row["id"]
        return policy
    finally:
        conn.close()
