import json
import os
import pathlib
import sqlite3
from typing import Any, Dict

# Directories setup
BASE_DIR = pathlib.Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
IMAGES_DIR = DATA_DIR / "images"
REPORTS_DIR = DATA_DIR / "reports"
SCHEMA_PATH = BASE_DIR / "schema.sql"

# Ensure runtime directories exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
IMAGES_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

DB_PATH = DATA_DIR / "fasalsakshi.db"


def get_conn() -> sqlite3.Connection:
    """Return a new SQLite connection with row_factory and foreign keys enabled."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def row_to_dict(row: sqlite3.Row | None) -> Dict[str, Any] | None:
    """Convert an sqlite3.Row to a standard Python dictionary."""
    if row is None:
        return None
    return dict(row)


def init_db():
    """Apply schema.sql to the database if not already initialized."""
    if SCHEMA_PATH.exists():
        with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
            schema_sql = f.read()
        conn = get_conn()
        try:
            conn.executescript(schema_sql)
            conn.commit()
        finally:
            conn.close()
