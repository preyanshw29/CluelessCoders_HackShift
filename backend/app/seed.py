import json
import pathlib
import random
from datetime import datetime, timedelta, timezone
from app.db import get_conn

BASE_DIR = pathlib.Path(__file__).resolve().parent.parent.parent


def find_contract_path(name: str) -> pathlib.Path:
    candidates = [
        BASE_DIR / "contracts" / name,
        BASE_DIR / "frontend-simulation" / "contracts" / name,
        pathlib.Path.cwd() / "contracts" / name,
    ]
    for c in candidates:
        if c.is_file():
            return c
    raise FileNotFoundError(f"Contract {name} not found")


def seed():
    """Seed the database with initial farmer, field, policy, and 30 days of baseline readings."""
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT count(*) as cnt FROM farmers;")
        row = cur.fetchone()
        if row and row["cnt"] > 0:
            # Already seeded
            return

        print("[Seed] Seeding database with initial data...")

        # 1. Farmer id=1
        cur.execute(
            """
            INSERT INTO farmers (id, name, phone, language, village, district, state)
            VALUES (1, ?, ?, ?, ?, ?, ?);
            """,
            ("Ramesh Kumar", "+910000000000", "hi", "Arang", "Raipur", "Chhattisgarh"),
        )

        # 2. Field id=1
        cur.execute(
            """
            INSERT INTO fields (id, farmer_id, name, crop, lat, lon, area_ha)
            VALUES (1, 1, ?, ?, ?, ?, ?);
            """,
            ("North Plot", "Tomato", 21.2514, 81.6296, 1.5),
        )

        # 3. Policy id=1
        policy_file = find_contract_path("sample_policy.json")
        with open(policy_file, "r", encoding="utf-8") as f:
            policy_terms = f.read()

        cur.execute(
            """
            INSERT INTO policies (id, field_id, terms_json)
            VALUES (1, 1, ?);
            """,
            (policy_terms,),
        )

        # 4. 30 days of hourly normal readings
        profiles_file = find_contract_path("scenario_profiles.json")
        with open(profiles_file, "r", encoding="utf-8") as f:
            profiles = json.load(f)

        normal_ranges = profiles["readings"]["normal"]

        now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
        readings_to_insert = []

        total_hours = 30 * 24
        for i in range(total_hours, 0, -1):
            ts_time = now - timedelta(hours=i)
            ts_str = ts_time.strftime("%Y-%m-%dT%H:%M:%SZ")

            sm = round(random.uniform(*normal_ranges["soil_moisture_pct"]), 2)
            st = round(random.uniform(*normal_ranges["soil_temp_c"]), 2)
            at = round(random.uniform(*normal_ranges["air_temp_c"]), 2)
            hum = round(random.uniform(*normal_ranges["humidity_pct"]), 2)
            rain = round(random.uniform(*normal_ranges["rainfall_mm"]), 2)
            ec = round(random.uniform(*normal_ranges["soil_ec_ds_m"]), 2)
            ph = round(random.uniform(*normal_ranges["soil_ph"]), 2)

            readings_to_insert.append((1, ts_str, sm, st, at, hum, rain, ec, ph, "normal"))

        cur.executemany(
            """
            INSERT INTO readings (field_id, ts, soil_moisture_pct, soil_temp_c, air_temp_c, humidity_pct, rainfall_mm, soil_ec_ds_m, soil_ph, scenario)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """,
            readings_to_insert,
        )

        conn.commit()
        print(f"[Seed] Successfully inserted {len(readings_to_insert)} baseline readings.")

        # 5. Call app.seed_organic.seed_demo(conn) inside try/except
        try:
            from app.seed_organic import seed_demo
            seed_demo(conn)
            print("[Seed] Organic seed data successfully populated.")
        except ImportError:
            pass

    finally:
        conn.close()


if __name__ == "__main__":
    from app.db import init_db
    init_db()
    seed()
