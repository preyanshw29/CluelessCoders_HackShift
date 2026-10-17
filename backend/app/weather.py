import json
import pathlib
from typing import Any, Dict
import requests

BASE_DIR = pathlib.Path(__file__).resolve().parent.parent.parent


def find_scenario_profiles() -> pathlib.Path:
    candidates = [
        BASE_DIR / "contracts" / "scenario_profiles.json",
        BASE_DIR / "frontend-simulation" / "contracts" / "scenario_profiles.json",
        pathlib.Path.cwd() / "contracts" / "scenario_profiles.json",
    ]
    for c in candidates:
        if c.is_file():
            return c
    raise FileNotFoundError("contracts/scenario_profiles.json not found")


class WeatherServiceError(Exception):
    """Raised when external weather service fails."""
    pass


def mock_weather(scenario: str) -> Dict[str, Any]:
    """Return mock weather summary from contracts/scenario_profiles.json."""
    profile_path = find_scenario_profiles()
    with open(profile_path, "r", encoding="utf-8") as f:
        profiles = json.load(f)

    weather_data = profiles.get("mock_weather", {}).get(scenario)
    if not weather_data:
        weather_data = {
            "rain_24h_mm": 0,
            "max_gust_kmh": 10,
            "min_temp_c": 20,
            "max_temp_c": 30,
            "weather_code": 0,
        }

    res = dict(weather_data)
    res["source"] = "mock"
    return res


def get_weather_summary(lat: float, lon: float) -> Dict[str, Any]:
    """Fetch 24h weather summary from Open-Meteo API."""
    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}&hourly=precipitation,wind_gusts_10m,temperature_2m,weather_code&past_days=1&forecast_days=1"
    )

    try:
        resp = requests.get(url, timeout=10)
        if resp.status_code != 200:
            raise WeatherServiceError(f"Open-Meteo returned status {resp.status_code}")
        data = resp.json()

        hourly = data.get("hourly", {})
        precip = hourly.get("precipitation", [])[-24:] or [0.0]
        gusts = hourly.get("wind_gusts_10m", [])[-24:] or [0.0]
        temps = hourly.get("temperature_2m", [])[-24:] or [25.0]
        codes = hourly.get("weather_code", [])[-24:] or [0]

        rain_24h_mm = round(sum(precip), 2)
        max_gust_kmh = round(max(gusts), 2)
        min_temp_c = round(min(temps), 2)
        max_temp_c = round(max(temps), 2)
        # pick highest weather code as representative of most severe event
        weather_code = int(max(codes)) if codes else 0

        return {
            "rain_24h_mm": rain_24h_mm,
            "max_gust_kmh": max_gust_kmh,
            "min_temp_c": min_temp_c,
            "max_temp_c": max_temp_c,
            "weather_code": weather_code,
            "source": "open-meteo",
        }
    except requests.RequestException as e:
        raise WeatherServiceError(f"Failed to connect to Open-Meteo: {e}") from e
