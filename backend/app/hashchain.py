import hashlib
import json
import sqlite3
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from app.db import IMAGES_DIR, row_to_dict

GENESIS = "0" * 64


def calculate_chain_hash(img_hash: str, meta: Dict[str, Any], prev_hash: str) -> str:
    payload = {
        "img": img_hash,
        "meta": meta,
        "prev": prev_hash,
    }
    encoded = json.dumps(payload, sort_keys=True).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def ingest_image(
    conn: sqlite3.Connection,
    field_id: int,
    image_bytes: bytes,
    role: str,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    ts: Optional[str] = None,
) -> Dict[str, Any]:
    """Ingest image bytes, compute SHA256 and chain hash, persist file and record in database."""
    if ts is None:
        ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    img_hash = hashlib.sha256(image_bytes).hexdigest()

    cur = conn.cursor()
    # Find prev_hash from the latest image for this field
    cur.execute(
        "SELECT chain_hash FROM images WHERE field_id = ? ORDER BY id DESC LIMIT 1;",
        (field_id,),
    )
    last_row = cur.fetchone()
    prev_hash = last_row["chain_hash"] if last_row else GENESIS

    meta = {
        "field_id": field_id,
        "ts": ts,
        "lat": lat,
        "lon": lon,
        "role": role,
    }
    chain_hash = calculate_chain_hash(img_hash, meta, prev_hash)

    # Save image file to IMAGES_DIR: <field_id>_<timestamp>_<role>.jpg
    sanitized_ts = ts.replace(":", "-").replace("Z", "")
    filename = f"{field_id}_{sanitized_ts}_{role}.jpg"
    filepath = IMAGES_DIR / filename
    with open(filepath, "wb") as f:
        f.write(image_bytes)

    cur.execute(
        """
        INSERT INTO images (field_id, ts, role, filename, lat, lon, sha256, prev_hash, chain_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        """,
        (field_id, ts, role, filename, lat, lon, img_hash, prev_hash, chain_hash),
    )
    conn.commit()

    image_id = cur.lastrowid
    cur.execute("SELECT * FROM images WHERE id = ?;", (image_id,))
    row = cur.fetchone()
    res = row_to_dict(row)
    res["url"] = f"/api/images/{res['id']}/file"
    return res


def verify_chain(conn: sqlite3.Connection, field_id: int) -> Dict[str, Any]:
    """Verify cryptographic hash-chain integrity for a field's images."""
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM images WHERE field_id = ? ORDER BY id ASC;",
        (field_id,),
    )
    rows = cur.fetchall()

    if not rows:
        return {
            "valid": True,
            "length": 0,
            "broken_at_image_id": None,
            "head_hash": GENESIS,
        }

    expected_prev = GENESIS
    last_chain_hash = GENESIS

    for row in rows:
        img_id = row["id"]
        filename = row["filename"]
        filepath = IMAGES_DIR / filename

        # 1. Check file exists and re-verify sha256 of file
        if not filepath.exists():
            return {
                "valid": False,
                "length": len(rows),
                "broken_at_image_id": img_id,
                "head_hash": last_chain_hash,
            }

        with open(filepath, "rb") as f:
            file_bytes = f.read()

        computed_file_hash = hashlib.sha256(file_bytes).hexdigest()
        if computed_file_hash != row["sha256"]:
            return {
                "valid": False,
                "length": len(rows),
                "broken_at_image_id": img_id,
                "head_hash": last_chain_hash,
            }

        # 2. Check prev_hash links to expected_prev
        if row["prev_hash"] != expected_prev:
            return {
                "valid": False,
                "length": len(rows),
                "broken_at_image_id": img_id,
                "head_hash": last_chain_hash,
            }

        # 3. Re-calculate chain_hash
        meta = {
            "field_id": row["field_id"],
            "ts": row["ts"],
            "lat": row["lat"],
            "lon": row["lon"],
            "role": row["role"],
        }
        recomputed_chain = calculate_chain_hash(computed_file_hash, meta, row["prev_hash"])
        if recomputed_chain != row["chain_hash"]:
            return {
                "valid": False,
                "length": len(rows),
                "broken_at_image_id": img_id,
                "head_hash": last_chain_hash,
            }

        expected_prev = row["chain_hash"]
        last_chain_hash = row["chain_hash"]

    return {
        "valid": True,
        "length": len(rows),
        "broken_at_image_id": None,
        "head_hash": last_chain_hash,
    }
