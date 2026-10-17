import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from app.db import get_conn, row_to_dict

logger = logging.getLogger("fasalsakshi.alerts")

HINDI_PERILS = {
    "hail": "ओलावृष्टि (Hailstorm)",
    "flood": "अत्यधिक वर्षा व बाढ़ (Flood)",
    "drought": "सूखा व जल संकट (Drought)",
    "frost": "पाला व शीत लहर (Frost)",
    "fertilizer_spike": "अत्यधिक रासायनिक/उर्वरक विसंगति (Fertilizer Spike)",
}

ENGLISH_PERILS = {
    "hail": "Hailstorm",
    "flood": "Heavy Rain & Flood",
    "drought": "Drought",
    "frost": "Severe Frost",
    "fertilizer_spike": "Chemical / Fertilizer Spike",
}


def format_deadline(ts_str: Optional[str]) -> str:
    """Format an ISO UTC timestamp into a human-readable string."""
    if not ts_str:
        return "72 hours from event"
    try:
        clean = ts_str.replace("Z", "+00:00")
        dt = datetime.fromisoformat(clean)
        return dt.strftime("%I:%M %p, %d %b %Y UTC")
    except Exception:
        return ts_str


def build_message(
    kind: str,
    language: str,
    farmer_name: str,
    field_name: str,
    crop: str,
    peril: str,
    deadline_str: str,
    helpline: str,
) -> str:
    is_hindi = language.lower().startswith("hi")
    peril_label = HINDI_PERILS.get(peril, peril) if is_hindi else ENGLISH_PERILS.get(peril, peril.capitalize())

    if kind == "damage_detected":
        if is_hindi:
            return (
                f"किसान {farmer_name} जी, आपके खेत '{field_name}' ({crop}) में {peril_label} के कारण नुकसान दर्ज हुआ है। "
                f"PMFBY बीमा दावे के लिए कृपया {deadline_str} से पहले हेल्पलाइन {helpline} या फसल बीमा ऐप पर सूचित करें।"
            )
        else:
            return (
                f"Farmer {farmer_name}, heavy crop damage detected in '{field_name}' ({crop}) due to {peril_label}. "
                f"Report to insurance helpline {helpline} before {deadline_str}."
            )

    elif kind == "deadline_reminder":
        if is_hindi:
            return (
                f"चेतावनी: खेत '{field_name}' के बीमा दावे की समय सीमा निकट है! "
                f"अंतिम तिथि {deadline_str} से पहले तुरंत हेल्पलाइन {helpline} पर दावा दर्ज करें।"
            )
        else:
            return (
                f"URGENT: Statutory claim window closing soon for '{field_name}'. "
                f"Complete your report to {helpline} before {deadline_str}."
            )

    elif kind == "anomaly":
        if is_hindi:
            return (
                f"सूचना: खेत '{field_name}' ({crop}) में मिट्टी की गुणवत्ता और EC में अचानक विसंगति दर्ज की गई है। "
                f"यह रासायनिक असंतुलन का संकेत हो सकता है। कृपया ऑर्गेनिक लॉग की जांच करें।"
            )
        else:
            return (
                f"Alert: Soil telemetry anomaly detected in '{field_name}' ({crop}). "
                f"Unusual EC / salinity spike logged. Please inspect field inputs."
            )

    elif kind == "price":
        if is_hindi:
            return (
                f"मंडी भाव अपडेट: निकटवर्ती मंडियों में {crop} के भाव अनुकूल हैं। "
                f"परिवहन लागत घटाने के बाद सर्वोत्तम मंडी की जानकारी के लिए मार्केट पोर्टल देखें।"
            )
        else:
            return (
                f"Market Alert: Favorable mandi realization prices available for {crop}. "
                f"Check the market portal for optimal net realization after transport costs."
            )

    else:
        if is_hindi:
            return f"खेत '{field_name}' ({crop}) के लिए सूचना अपडेट। स्थिति: सामान्य।"
        else:
            return f"Status update for field '{field_name}' ({crop}). Everything normal."


def send_alert(
    field_id: int,
    kind: str,
    event_id: Optional[int] = None,
    claim_id: Optional[int] = None,
    language: Optional[str] = None,
) -> Dict[str, Any]:
    """Dispatch an alert to the farmer via WhatsApp (Twilio) or log to DB. Never raises."""
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    conn = get_conn()
    cur = conn.cursor()

    farmer_name = "Farmer"
    farmer_phone = ""
    lang = language or "hi"
    field_name = "Plot"
    crop = "crop"
    helpline = "14447"
    peril = "hail"
    deadline_str = "within 72 hours"

    try:
        cur.execute(
            """
            SELECT f.name as field_name, f.crop, fa.name as farmer_name, fa.phone, fa.language
            FROM fields f
            JOIN farmers fa ON f.farmer_id = fa.id
            WHERE f.id = ?;
            """,
            (field_id,),
        )
        row = cur.fetchone()
        if row:
            field_name = row["field_name"] or "Field"
            crop = row["crop"] or "Crop"
            farmer_name = row["farmer_name"] or "Farmer"
            farmer_phone = row["phone"] or ""
            if not language and row["language"]:
                lang = row["language"]

        # Fetch claim details if provided
        if claim_id:
            cur.execute("SELECT deadline_ts, peril, report_channel_json FROM claims WHERE id = ?;", (claim_id,))
            c_row = cur.fetchone()
            if c_row:
                deadline_str = format_deadline(c_row["deadline_ts"])
                peril = c_row["peril"] or peril
        elif event_id:
            cur.execute("SELECT peril FROM events WHERE id = ?;", (event_id,))
            e_row = cur.fetchone()
            if e_row and e_row["peril"]:
                peril = e_row["peril"]

        message = build_message(
            kind=kind,
            language=lang,
            farmer_name=farmer_name,
            field_name=field_name,
            crop=crop,
            peril=peril,
            deadline_str=deadline_str,
            helpline=helpline,
        )

        twilio_sid = os.getenv("TWILIO_ACCOUNT_SID", "").strip()
        twilio_token = os.getenv("TWILIO_AUTH_TOKEN", "").strip()
        twilio_from = os.getenv("TWILIO_WHATSAPP_FROM", "").strip()

        channel = "app"
        status = "logged"

        if twilio_sid and twilio_token and twilio_from and farmer_phone:
            try:
                from twilio.rest import Client

                client = Client(twilio_sid, twilio_token)
                target_phone = farmer_phone if farmer_phone.startswith("whatsapp:") else f"whatsapp:{farmer_phone}"
                client.messages.create(body=message, from_=twilio_from, to=target_phone)
                channel = "whatsapp"
                status = "sent"
            except Exception as twilio_err:
                logger.warning(f"[Alerts] Twilio dispatch failed: {twilio_err}")
                channel = "whatsapp"
                status = "failed"

        cur.execute(
            """
            INSERT INTO alerts (field_id, ts, channel, language, kind, message, status)
            VALUES (?, ?, ?, ?, ?, ?, ?);
            """,
            (field_id, now_iso, channel, lang, kind, message, status),
        )
        new_id = cur.lastrowid
        conn.commit()

        cur.execute("SELECT * FROM alerts WHERE id = ?;", (new_id,))
        alert_row = cur.fetchone()
        return row_to_dict(alert_row)

    except Exception as e:
        logger.error(f"[Alerts] Unexpected error in send_alert: {e}")
        return {
            "id": 0,
            "field_id": field_id,
            "ts": now_iso,
            "channel": "app",
            "language": lang,
            "kind": kind,
            "message": f"Alert generated for field {field_id}",
            "status": "logged",
        }
    finally:
        conn.close()
