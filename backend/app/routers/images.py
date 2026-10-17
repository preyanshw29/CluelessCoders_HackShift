from typing import Optional
from fastapi import APIRouter, File, Form, HTTPException, Response, UploadFile, status
from app.db import IMAGES_DIR, get_conn, row_to_dict
from app.hashchain import ingest_image, verify_chain

router = APIRouter()


@router.post("/api/fields/{id}/images", status_code=status.HTTP_201_CREATED)
async def upload_image(
    id: int,
    file: UploadFile = File(...),
    role: str = Form("routine"),
    lat: Optional[float] = Form(None),
    lon: Optional[float] = Form(None),
):
    valid_roles = ["baseline", "before", "after", "routine"]
    if role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role '{role}'. Allowed: {valid_roles}")

    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM fields WHERE id = ?;", (id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Field not found")

        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Empty image file")

        rec = ingest_image(conn, id, image_bytes, role=role, lat=lat, lon=lon)
        return rec
    finally:
        conn.close()


@router.get("/api/fields/{id}/images")
def get_images(id: int):
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT * FROM images WHERE field_id = ? ORDER BY id ASC;",
            (id,),
        )
        rows = cur.fetchall()
        result = []
        for r in rows:
            d = row_to_dict(r)
            d["url"] = f"/api/images/{d['id']}/file"
            result.append(d)
        return result
    finally:
        conn.close()


@router.get("/api/images/{id}/file")
def get_image_file(id: int):
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT filename FROM images WHERE id = ?;", (id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Image not found")

        filepath = IMAGES_DIR / row["filename"]
        if not filepath.is_file():
            raise HTTPException(status_code=404, detail="Image file missing on disk")

        with open(filepath, "rb") as f:
            bytes_data = f.read()

        return Response(content=bytes_data, media_type="image/jpeg")
    finally:
        conn.close()


@router.get("/api/fields/{id}/chain/verify")
def verify_field_chain(id: int):
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM fields WHERE id = ?;", (id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Field not found")

        return verify_chain(conn, id)
    finally:
        conn.close()
