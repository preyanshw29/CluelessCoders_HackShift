from fastapi import APIRouter, Query
from app.pipeline import run_weather_check, simulate_pipeline

router = APIRouter()


@router.post("/api/simulate/{scenario}")
def trigger_simulate(scenario: str, field_id: int = Query(1)):
    """Simulate scenario per A13 (normal, hail, flood, drought, frost, fertilizer_spike)."""
    return simulate_pipeline(scenario, field_id)


@router.post("/api/fields/{id}/check-weather")
def check_weather_endpoint(id: int):
    """Trigger real Open-Meteo check against policy thresholds."""
    return run_weather_check(id)
