import csv
import math
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
import requests

from app.db import DATA_DIR, get_conn

CSV_PATH = DATA_DIR / "mandi_prices.csv"


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points in km."""
    r = 6371.0  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(r * c, 2)


def get_market_prices(commodity: str = "Tomato", state: str = "Chhattisgarh") -> Dict[str, Any]:
    """Fetch market prices from data.gov.in Agmarknet API or fallback to CSV."""
    api_key = os.getenv("DATAGOV_API_KEY", "").strip()
    norm_commodity = commodity.strip().capitalize()
    norm_state = state.strip().capitalize()

    # Try live Agmarknet API if key is set
    if api_key:
        try:
            url = (
                f"https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
                f"?api-key={api_key}&format=json&limit=50&filters[state]={norm_state}&filters[commodity]={norm_commodity}"
            )
            resp = requests.get(url, timeout=3)
            if resp.status_code == 200:
                data = resp.json()
                records = data.get("records", [])
                if records:
                    rows = []
                    for rec in records:
                        rows.append(
                            {
                                "market": rec.get("market", ""),
                                "district": rec.get("district", ""),
                                "state": rec.get("state", norm_state),
                                "commodity": rec.get("commodity", norm_commodity),
                                "min_price": float(rec.get("min_price", 0)),
                                "max_price": float(rec.get("max_price", 0)),
                                "modal_price": float(rec.get("modal_price", 0)),
                                "arrival_date": rec.get("arrival_date", datetime.now(timezone.utc).strftime("%Y-%m-%d")),
                            }
                        )
                    return {
                        "commodity": norm_commodity,
                        "source": "agmarknet",
                        "as_of": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                        "rows": rows,
                    }
        except Exception:
            pass  # Fall back to CSV

    # Read from fallback CSV
    rows: List[Dict[str, Any]] = []
    as_of = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    if CSV_PATH.exists():
        with open(CSV_PATH, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for r in reader:
                if (
                    r.get("commodity", "").strip().lower() == norm_commodity.lower()
                    and r.get("state", "").strip().lower() == norm_state.lower()
                ):
                    as_of = r.get("arrival_date", as_of)
                    rows.append(
                        {
                            "market": r.get("market", ""),
                            "district": r.get("district", ""),
                            "state": r.get("state", ""),
                            "commodity": r.get("commodity", ""),
                            "min_price": float(r.get("min_price", 0)),
                            "max_price": float(r.get("max_price", 0)),
                            "modal_price": float(r.get("modal_price", 0)),
                            "arrival_date": r.get("arrival_date", as_of),
                        }
                    )

    return {
        "commodity": norm_commodity,
        "source": "fallback_csv",
        "as_of": as_of,
        "rows": rows,
    }


def get_best_mandi(field_id: int, quantity_q: float = 10.0) -> Dict[str, Any]:
    """Calculate net price realized across nearby mandis taking into account transport cost."""
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM fields WHERE id = ?;", (field_id,))
    field_row = cur.fetchone()
    conn.close()

    if not field_row:
        raise ValueError(f"Field {field_id} not found")

    crop = field_row["crop"] or "tomato"
    commodity = crop.capitalize()
    field_lat = field_row["lat"] or 21.2514
    field_lon = field_row["lon"] or 81.6296

    road_factor = 1.3
    transport_rs_per_qtl_km = float(os.getenv("TRANSPORT_RS_PER_QTL_KM", "0.25"))

    options = []

    if CSV_PATH.exists():
        with open(CSV_PATH, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for r in reader:
                if r.get("commodity", "").strip().lower() == commodity.lower():
                    mandi_lat = float(r.get("lat", field_lat))
                    mandi_lon = float(r.get("lon", field_lon))
                    straight_dist = haversine_km(field_lat, field_lon, mandi_lat, mandi_lon)
                    distance_km = round(straight_dist * road_factor, 1)

                    modal_price = float(r.get("modal_price", 0))
                    transport_cost_per_qtl = round(distance_km * transport_rs_per_qtl_km, 2)
                    net_price_per_qtl = round(modal_price - transport_cost_per_qtl, 2)
                    net_total = round(net_price_per_qtl * quantity_q, 2)

                    options.append(
                        {
                            "market": r.get("market", ""),
                            "district": r.get("district", ""),
                            "distance_km": distance_km,
                            "modal_price": modal_price,
                            "transport_cost_per_qtl": transport_cost_per_qtl,
                            "net_price_per_qtl": net_price_per_qtl,
                            "net_total": net_total,
                        }
                    )

    # Sort options best first (highest net_price_per_qtl)
    options.sort(key=lambda x: x["net_price_per_qtl"], reverse=True)
    best_market = options[0]["market"] if options else None

    return {
        "commodity": commodity,
        "quantity_q": quantity_q,
        "assumptions": {
            "transport_rs_per_qtl_km": transport_rs_per_qtl_km,
            "road_factor": road_factor,
            "note": f"Road distance calculated using {road_factor}x factor over great-circle; transport assumed at Rs. {transport_rs_per_qtl_km}/quintal/km.",
        },
        "options": options,
        "best": best_market,
        "organic_premium": {
            "low_pct": 10,
            "high_pct": 30,
            "note": "Indicative only, not from mandi data; mandi prices are for conventional produce.",
        },
    }
