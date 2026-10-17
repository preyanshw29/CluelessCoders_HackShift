import argparse
import io
import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, Optional

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    HRFlowable,
    Image as RLImage,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.db import DATA_DIR, IMAGES_DIR, REPORTS_DIR, get_conn, row_to_dict


def utc_to_ist_str(ts_str: Optional[str]) -> str:
    """Convert an ISO UTC timestamp to a formatted UTC and IST string."""
    if not ts_str:
        return "N/A"
    try:
        clean = ts_str.replace("Z", "+00:00")
        dt_utc = datetime.fromisoformat(clean)
        dt_ist = dt_utc + timedelta(hours=5, minutes=30)
        return f"{dt_utc.strftime('%Y-%m-%d %H:%M:%S UTC')} ({dt_ist.strftime('%I:%M %p IST')})"
    except Exception:
        return ts_str


def generate_sensor_chart(readings: list) -> Optional[io.BytesIO]:
    """Generate a 48-hour sensor chart (Moisture, Rainfall, Air Temp) using matplotlib."""
    if not readings:
        return None

    sorted_readings = sorted(readings, key=lambda r: r["ts"])
    # Take up to last 48 readings
    sub = sorted_readings[-48:]

    timestamps = []
    moisture = []
    rainfall = []
    temp = []

    for r in sub:
        ts = r["ts"]
        try:
            dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            timestamps.append(dt.strftime("%d/%m %Hh"))
        except Exception:
            timestamps.append(ts[-8:-3])

        moisture.append(r["soil_moisture_pct"] or 0)
        rainfall.append(r["rainfall_mm"] or 0)
        temp.append(r["air_temp_c"] or 0)

    fig, ax1 = plt.subplots(figsize=(7.2, 2.4), dpi=150)
    fig.patch.set_facecolor("#ffffff")
    ax1.set_facecolor("#f9fafb")

    x = range(len(timestamps))

    # Moisture line
    ax1.plot(x, moisture, color="#16a34a", linewidth=1.8, label="Soil Moisture (%)")
    # Temp line
    ax1.plot(x, temp, color="#ea580c", linewidth=1.4, linestyle="--", label="Air Temp (°C)")
    ax1.set_ylabel("Moisture / Temp", color="#374151", fontsize=8)
    ax1.set_ylim(0, 105)
    ax1.tick_params(axis="both", labelsize=7)

    # Secondary axis for rainfall
    ax2 = ax1.twinx()
    ax2.bar(x, rainfall, color="#2563eb", alpha=0.35, width=0.6, label="Rainfall (mm)")
    ax2.set_ylabel("Rainfall (mm)", color="#1e40af", fontsize=8)
    ax2.set_ylim(0, max(max(rainfall, default=10) * 1.5, 30))
    ax2.tick_params(axis="y", labelsize=7)

    # Subsample x ticks for readability
    step = max(1, len(timestamps) // 8)
    ax1.set_xticks(list(x)[::step])
    ax1.set_xticklabels(timestamps[::step], rotation=25, ha="right", fontsize=7)

    # Combined legend
    lines1, labels1 = ax1.get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    ax1.legend(lines1 + lines2, labels1 + labels2, loc="upper left", fontsize=7, framealpha=0.85)

    ax1.set_title("Field Sensor Telemetry (Last 48 Hours)", fontsize=9, fontweight="bold", color="#111827", pad=6)
    fig.tight_layout()

    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    return buf


def generate_claim_pdf(claim_id: int) -> str:
    """Generate a tamper-proof PMFBY Insurance Claim Dossier PDF."""
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("SELECT * FROM claims WHERE id = ?;", (claim_id,))
    claim_row = cur.fetchone()
    if not claim_row:
        conn.close()
        raise ValueError(f"Claim with ID {claim_id} not found.")

    claim = row_to_dict(claim_row)
    event_id = claim["event_id"]
    field_id = claim["field_id"]

    cur.execute("SELECT * FROM events WHERE id = ?;", (event_id,))
    event_row = cur.fetchone()
    event = row_to_dict(event_row) if event_row else {}

    cur.execute(
        """
        SELECT f.*, fa.name as farmer_name, fa.phone, fa.village, fa.district, fa.state, fa.language
        FROM fields f
        JOIN farmers fa ON f.farmer_id = fa.id
        WHERE f.id = ?;
        """,
        (field_id,),
    )
    field_row = cur.fetchone()
    field = row_to_dict(field_row) if field_row else {}

    cur.execute("SELECT * FROM policies WHERE field_id = ? ORDER BY id DESC LIMIT 1;", (field_id,))
    policy_row = cur.fetchone()
    policy = {}
    if policy_row:
        try:
            policy = json.loads(policy_row["terms_json"])
        except Exception:
            policy = {}

    # Readings
    cur.execute("SELECT * FROM readings WHERE field_id = ? ORDER BY ts DESC LIMIT 100;", (field_id,))
    readings = [row_to_dict(r) for r in cur.fetchall()]

    # Images
    cur.execute("SELECT * FROM images WHERE field_id = ? ORDER BY id ASC;", (field_id,))
    images = [row_to_dict(r) for r in cur.fetchall()]

    # Verify Hashchain
    chain_status_text = "Verification Unavailable"
    chain_valid = False
    try:
        from app.hashchain import verify_chain
        res = verify_chain(conn, field_id)
        chain_valid = res.get("valid", False)
        if chain_valid:
            chain_status_text = f"CHAIN VERIFIED (Length: {res.get('length', 0)}, Head: {res.get('head_hash', '')[:16]}...)"
        else:
            chain_status_text = f"CHAIN BROKEN at Image ID: {res.get('broken_at_image_id')}"
    except Exception as e:
        chain_status_text = f"Verification Unavailable ({e})"

    conn.close()

    # Destination PDF Path
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    pdf_filename = f"claim_{claim_id}.pdf"
    pdf_file_path = REPORTS_DIR / pdf_filename

    # Build PDF with ReportLab
    doc = SimpleDocTemplate(
        str(pdf_file_path),
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=20,
        textColor=colors.HexColor("#1e3a8a"),
    )
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#4b5563"),
    )
    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#1f2937"),
        spaceBefore=8,
        spaceAfter=4,
    )
    normal_style = ParagraphStyle(
        "NormalSmall",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#1f2937"),
    )
    bold_style = ParagraphStyle(
        "BoldSmall",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#111827"),
    )
    disclaimer_style = ParagraphStyle(
        "Disclaimer",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=7,
        leading=9,
        textColor=colors.HexColor("#6b7280"),
    )

    story = []

    # Title & Metadata
    now_utc = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%SZ")
    story.append(Paragraph("FASALSAKSHI CROP LOSS EVIDENCE DOSSIER", title_style))
    story.append(
        Paragraph(
            f"Automated Insurance Evidence Report & Hash-Chain Audit Record | Generated: {utc_to_ist_str(now_utc)}",
            subtitle_style,
        )
    )
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#2563eb"), spaceBefore=4, spaceAfter=8))

    # Farm & Policy Header Table
    policy_no = policy.get("policy_no", "FP-2026-0001")
    farmer_name = field.get("farmer_name", "Ramesh Kumar")
    location = f"{field.get('village', 'Arang')}, {field.get('district', 'Raipur')}, {field.get('state', 'Chhattisgarh')}"
    coords = f"{field.get('lat', 21.2514):.4f}°N, {field.get('lon', 81.6296):.4f}°E"
    crop_info = f"{field.get('crop', 'Tomato').capitalize()} ({field.get('area_ha', 1.5)} ha)"

    header_data = [
        [Paragraph("<b>Policy No:</b>", normal_style), Paragraph(policy_no, bold_style),
         Paragraph("<b>Claim ID:</b>", normal_style), Paragraph(f"#{claim_id}", bold_style)],
        [Paragraph("<b>Farmer:</b>", normal_style), Paragraph(farmer_name, normal_style),
         Paragraph("<b>Location:</b>", normal_style), Paragraph(location, normal_style)],
        [Paragraph("<b>Plot / Crop:</b>", normal_style), Paragraph(f"{field.get('name', 'North Plot')} / {crop_info}", normal_style),
         Paragraph("<b>GPS Coordinates:</b>", normal_style), Paragraph(coords, normal_style)],
        [Paragraph("<b>Sum Insured:</b>", normal_style), Paragraph(f"Rs. {policy.get('sum_insured_total', 120000):,}", normal_style),
         Paragraph("<b>Statutory Window:</b>", normal_style), Paragraph(f"{policy.get('reporting_window_hours', 72)} Hours", normal_style)],
    ]
    t_header = Table(header_data, colWidths=[1.1 * inch, 2.4 * inch, 1.2 * inch, 2.4 * inch])
    t_header.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#cbd5e1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    story.append(t_header)
    story.append(Spacer(1, 6))

    # Event & Loss Assessment
    story.append(Paragraph("1. Incident & Loss Assessment", section_heading))
    peril_str = (claim.get("peril") or "hail").upper()
    claimability = (claim.get("claimability") or "individual").replace("_", " ").upper()
    canopy_loss = event.get("canopy_loss_pct", 0.0)

    weather_data = {}
    if event.get("weather_json"):
        try:
            weather_data = json.loads(event["weather_json"])
        except Exception:
            weather_data = {}

    loss_data = [
        [Paragraph("<b>Peril Type:</b>", normal_style), Paragraph(peril_str, bold_style),
         Paragraph("<b>Incident Time:</b>", normal_style), Paragraph(utc_to_ist_str(event.get("ts", claim.get("created_ts"))), normal_style)],
        [Paragraph("<b>Classification:</b>", normal_style), Paragraph(claimability, bold_style),
         Paragraph("<b>Canopy Loss:</b>", normal_style), Paragraph(f"{canopy_loss:.1f}%", bold_style)],
        [Paragraph("<b>Estimated Range:</b>", normal_style),
         Paragraph(f"<b>Rs. {claim.get('claim_low', 0):,} – Rs. {claim.get('claim_high', 0):,}</b>" if claim.get("claim_low") is not None else "Area-based assessment", bold_style),
         Paragraph("<b>Claim Deadline:</b>", normal_style),
         Paragraph(utc_to_ist_str(claim.get("deadline_ts")), bold_style)],
    ]
    t_loss = Table(loss_data, colWidths=[1.1 * inch, 2.4 * inch, 1.2 * inch, 2.4 * inch])
    t_loss.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f0fdf4")),
        ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#bbf7d0")),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#dcfce7")),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    story.append(t_loss)
    story.append(Spacer(1, 6))

    # Weather Evidence Summary
    story.append(Paragraph("2. Meteorological Verification", section_heading))
    w_src = weather_data.get("source", "mock / telemetry")
    w_rain = weather_data.get("rain_24h_mm", 0)
    w_gust = weather_data.get("max_gust_kmh", 0)
    w_temp = f"{weather_data.get('min_temp_c', 0)}°C – {weather_data.get('max_temp_c', 0)}°C"

    w_table_data = [
        [Paragraph("<b>Weather Source:</b>", normal_style), Paragraph(str(w_src).upper(), normal_style),
         Paragraph("<b>24h Rainfall:</b>", normal_style), Paragraph(f"{w_rain} mm", normal_style)],
        [Paragraph("<b>Max Wind Gust:</b>", normal_style), Paragraph(f"{w_gust} km/h", normal_style),
         Paragraph("<b>Temp Range:</b>", normal_style), Paragraph(w_temp, normal_style)],
    ]
    t_weather = Table(w_table_data, colWidths=[1.1 * inch, 2.4 * inch, 1.2 * inch, 2.4 * inch])
    t_weather.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    story.append(t_weather)
    story.append(Spacer(1, 6))

    # Sensor Telemetry Chart
    story.append(Paragraph("3. Sensor Corroboration & Microclimate Trend", section_heading))
    chart_buf = generate_sensor_chart(readings)
    if chart_buf:
        chart_img = RLImage(chart_buf, width=6.9 * inch, height=2.3 * inch)
        story.append(chart_img)
        story.append(Spacer(1, 4))

    # Multi-Factor Confidence Breakdown
    w_score = event.get("weather_score", 0.0)
    v_score = event.get("visual_score", 0.0)
    s_score = event.get("sensor_score", 0.0)
    conf = event.get("confidence", 0.0)
    conf_label = event.get("confidence_label", "Medium")

    story.append(Paragraph("4. Multi-Factor Evidence Weighting", section_heading))
    conf_data = [
        [Paragraph("<b>Evidence Dimension</b>", bold_style), Paragraph("<b>Normalized Score</b>", bold_style), Paragraph("<b>Weight</b>", bold_style), Paragraph("<b>Status</b>", bold_style)],
        [Paragraph("Weather Threshold Corroboration", normal_style), Paragraph(f"{w_score:.2f} / 1.00", normal_style), Paragraph("40%", normal_style), Paragraph("Validated" if w_score >= 0.5 else "Partial", normal_style)],
        [Paragraph("Computer Vision Canopy Loss", normal_style), Paragraph(f"{v_score:.2f} / 1.00", normal_style), Paragraph("40%", normal_style), Paragraph(f"{canopy_loss:.1f}% loss", normal_style)],
        [Paragraph("In-Situ Sensor Telemetry", normal_style), Paragraph(f"{s_score:.2f} / 1.00", normal_style), Paragraph("20%", normal_style), Paragraph("Corroborated" if s_score > 0 else "Normal", normal_style)],
        [Paragraph("<b>Aggregated Claim Confidence</b>", bold_style), Paragraph(f"<b>{conf:.2f} / 1.00</b>", bold_style), Paragraph("100%", bold_style), Paragraph(f"<b>{conf_label.upper()}</b>", bold_style)],
    ]
    t_conf = Table(conf_data, colWidths=[2.7 * inch, 1.4 * inch, 1.0 * inch, 1.8 * inch])
    t_conf.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#dbeafe")),
        ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#94a3b8")),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#cbd5e1")),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    story.append(t_conf)
    story.append(Spacer(1, 6))

    # Cryptographic Evidence Chain Table
    story.append(Paragraph("5. Cryptographic Evidence Chain (Tamper-Proof Audit Vault)", section_heading))
    chain_color = "#16a34a" if chain_valid else "#dc2626"
    story.append(Paragraph(f"<b>Audit Result:</b> <font color='{chain_color}'>{chain_status_text}</font>", bold_style))
    story.append(Spacer(1, 2))

    chain_data = [
        [Paragraph("<b>Image ID</b>", bold_style), Paragraph("<b>Role</b>", bold_style), Paragraph("<b>Timestamp (UTC)</b>", bold_style), Paragraph("<b>SHA-256 (Image)</b>", bold_style), Paragraph("<b>Linked Chain Hash</b>", bold_style)],
    ]
    for img in images[-5:]:  # show recent images
        chain_data.append([
            Paragraph(f"#{img['id']}", normal_style),
            Paragraph(img["role"].capitalize(), normal_style),
            Paragraph(img["ts"], normal_style),
            Paragraph(img["sha256"][:12] + "...", normal_style),
            Paragraph(img["chain_hash"][:16] + "...", normal_style),
        ])

    if len(chain_data) > 1:
        t_chain = Table(chain_data, colWidths=[0.8 * inch, 1.0 * inch, 1.8 * inch, 1.6 * inch, 1.7 * inch])
        t_chain.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#cbd5e1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#e2e8f0")),
            ("TOPPADDING", (0, 0), (-1, -1), 2),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ]))
        story.append(t_chain)

    story.append(Spacer(1, 8))

    # Reporting Instructions & Disclaimers
    rep_channel = {}
    if claim.get("report_channel_json"):
        try:
            rep_channel = json.loads(claim["report_channel_json"])
        except Exception:
            rep_channel = {}

    helpline_no = rep_channel.get("helpline", "14447")
    channel_name = rep_channel.get("channel", "PMFBY Portal / Insurance Helpline")

    story.append(Paragraph(f"<b>Filing Instructions:</b> Report to {channel_name} (Helpline: <b>{helpline_no}</b>) before the statutory deadline.", bold_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        "<b>LEGAL & COMPLIANCE DISCLAIMER:</b> This dossier is generated automatically by FasalSakshi as an evidentiary aid. "
        "Estimated claim amounts are indicative calculations based on recorded sensor and meteorological data; final claim admissibility "
        "and settlement amounts are subject to PMFBY operational guidelines, loss surveyor assessment, and insurer approval. "
        "Sensor telemetry is simulated for demonstration purposes where physical IoT hardware is offline.",
        disclaimer_style,
    ))

    # Build document
    doc.build(story)

    # Update database claim record
    rel_path = f"reports/{pdf_filename}"
    conn2 = get_conn()
    cur2 = conn2.cursor()
    cur2.execute("UPDATE claims SET pdf_path = ? WHERE id = ?;", (rel_path, claim_id))
    conn2.commit()
    conn2.close()

    return rel_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate Claim PDF Report")
    parser.add_argument("--claim", type=int, default=1, help="Claim ID to generate PDF for")
    args = parser.parse_args()

    out = generate_claim_pdf(args.claim)
    print(f"Generated Claim PDF: {out}")
