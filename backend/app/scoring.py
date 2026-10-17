from typing import Any, Dict, List
import numpy as np


def weather_score(peril: str, weather: Dict[str, Any] | None, policy: Dict[str, Any]) -> float:
    """Calculate weather score (fraction of peril's policy thresholds satisfied, 0..1)."""
    if not weather:
        return 0.0

    thresholds = policy.get("thresholds", {}).get(peril, {})
    if not thresholds and peril != "drought":
        return 0.0

    conditions_met = 0
    total_conditions = 0

    if peril == "hail":
        # Check weather_code in codes
        target_codes = thresholds.get("weather_codes", [96, 99])
        total_conditions += 1
        if weather.get("weather_code") in target_codes:
            conditions_met += 1

        # Check max_gust_kmh >= min_gust_kmh
        min_gust = thresholds.get("min_gust_kmh", 50)
        total_conditions += 1
        if weather.get("max_gust_kmh", 0) >= min_gust:
            conditions_met += 1

    elif peril == "flood":
        min_rain = thresholds.get("min_rain_24h_mm", 100)
        total_conditions += 1
        if weather.get("rain_24h_mm", 0) >= min_rain:
            conditions_met += 1

    elif peril == "drought":
        # Checked on readings: soil moisture -> use weather max_temp_c >= 38 as weather check
        total_conditions += 1
        if weather.get("max_temp_c", 0) >= 38:
            conditions_met += 1

    elif peril == "frost":
        max_min_temp = thresholds.get("max_min_temp_c", 2)
        total_conditions += 1
        if weather.get("min_temp_c", 100) <= max_min_temp:
            conditions_met += 1

    elif peril == "fertilizer_spike":
        return 0.0

    return round(conditions_met / total_conditions, 2) if total_conditions > 0 else 0.0


def sensor_score(peril: str, readings: List[Dict[str, Any]], baseline_readings: List[Dict[str, Any]] | None = None) -> float:
    """Calculate sensor corroboration score over the last 24h of readings (0 or 1)."""
    if not readings:
        return 0.0

    # Read last 24 readings
    recent_24 = readings[:24]

    if peril == "flood":
        moistures = [r.get("soil_moisture_pct", 0) for r in recent_24]
        avg_moisture = sum(moistures) / len(moistures) if moistures else 0
        return 1.0 if avg_moisture >= 85 else 0.0

    elif peril == "hail":
        max_rain = max([r.get("rainfall_mm", 0) for r in recent_24]) if recent_24 else 0
        min_air_temp = min([r.get("air_temp_c", 100) for r in recent_24]) if recent_24 else 100
        return 1.0 if (max_rain >= 5 and min_air_temp <= 18) else 0.0

    elif peril == "drought":
        moistures = [r.get("soil_moisture_pct", 100) for r in recent_24]
        avg_moisture = sum(moistures) / len(moistures) if moistures else 100
        return 1.0 if avg_moisture <= 15 else 0.0

    elif peril == "frost":
        min_air_temp = min([r.get("air_temp_c", 100) for r in recent_24]) if recent_24 else 100
        return 1.0 if min_air_temp <= 3 else 0.0

    elif peril == "fertilizer_spike":
        # max soil_ec_ds_m >= 1.8 * median(soil_ec_ds_m over previous 30 days)
        recent_ec = [r.get("soil_ec_ds_m", 0) for r in recent_24]
        max_recent_ec = max(recent_ec) if recent_ec else 0

        historical = baseline_readings if baseline_readings else readings
        past_ec = [r.get("soil_ec_ds_m", 0.95) for r in historical]
        med_ec = float(np.median(past_ec)) if past_ec else 0.95

        return 1.0 if max_recent_ec >= (1.8 * med_ec) else 0.0

    return 0.0


def visual_score(canopy_loss_pct: float) -> float:
    """Visual score = min(canopy_loss_pct / 50, 1)."""
    return round(min(max(0.0, canopy_loss_pct) / 50.0, 1.0), 2)


def confidence(weather_s: float, canopy_loss_pct: float, sensor_s: float) -> float:
    """Overall confidence = round(0.4*weather_score + 0.4*visual_score + 0.2*sensor_score, 2)."""
    v_score = visual_score(canopy_loss_pct)
    raw = 0.4 * weather_s + 0.4 * v_score + 0.2 * sensor_s
    return round(raw, 2)


def confidence_label(c: float) -> str:
    """Map confidence float to label: >=0.7 High, >=0.4 Medium, else Low."""
    if c >= 0.7:
        return "High"
    if c >= 0.4:
        return "Medium"
    return "Low"
