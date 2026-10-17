import sqlite3
from datetime import datetime, timedelta, timezone


def seed_demo(conn: sqlite3.Connection):
    """Seed ~20 inputs_log rows for field 1 over the last 30 days.

    Mostly organic inputs (compost, vermicompost, neem spray) with no chemical
    inputs in the last 21 days so the initial Organic Evidence Score starts around 70-80.
    Idempotent.
    """
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM inputs_log WHERE field_id = 1;")
    count = cur.fetchone()[0]
    if count > 0:
        return

    now = datetime.now(timezone.utc)

    # 30-day realistic log schedule
    # Day 28 ago: DAP (chemical, applied at initial sowing 4 weeks ago)
    # Day 22 ago: Urea (chemical, final chemical intervention 22 days ago)
    # Remaining 21 days: strictly non-chemical organic inputs and sprays
    entries = [
        (-28, "dap", "Basal dose application at transplanting", 1),
        (-25, "compost", "Well-rotted farmyard manure applied", 0),
        (-22, "urea", "Top dressing broadcast before irrigation", 0),  # labelled 22 days ago
        (-20, "vermicompost", "Soil enrichment around root zone", 0),
        (-18, "neem_spray", "Preventative neem oil spray (5ml/L)", 0),
        (-16, "compost", "Mulching with decomposed crop residues", 0),
        (-15, "vermicompost", "Side dressing of earthworm compost", 0),
        (-13, "neem_spray", "Neem kernel extract spray for leaf miners", 0),
        (-11, "other", "Jeevamrut organic microbial liquid spray", 0),
        (-10, "compost", "Compost tea foliar drench", 0),
        (-8, "vermicompost", "Top dressing with fortified vermicompost", 0),
        (-7, "neem_spray", "Foliar application of pure cold-pressed neem oil", 0),
        (-5, "other", "Panchagavya organic growth promoter", 0),
        (-4, "compost", "Bio-fertilizer enriched compost", 0),
        (-3, "neem_spray", "Weekly preventative neem spray against whiteflies", 0),
        (-2, "vermicompost", "Enriched organic carbon booster", 0),
        (-1, "other", "Trichoderma viride bio-fungicide drench", 0),
    ]

    for days_offset, input_type, desc, is_chem in entries:
        entry_ts = (now + timedelta(days=days_offset)).strftime("%Y-%m-%dT10:00:00Z")
        cur.execute(
            """
            INSERT INTO inputs_log (field_id, ts, input_type, description, is_chemical)
            VALUES (?, ?, ?, ?, ?);
            """,
            (1, entry_ts, input_type, desc, is_chem),
        )

    conn.commit()


if __name__ == "__main__":
    from app.db import get_conn
    conn = get_conn()
    seed_demo(conn)
    conn.close()
    print("Demo inputs_log seeded successfully.")
