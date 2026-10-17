from typing import Optional
from fastapi import APIRouter, HTTPException, Query

from app.market import get_best_mandi, get_market_prices

router = APIRouter(tags=["Market & Logistics"])


@router.get("/api/market/prices")
def fetch_market_prices(
    commodity: str = Query("Tomato", description="Commodity name"),
    state: str = Query("Chhattisgarh", description="State name"),
):
    try:
        return get_market_prices(commodity=commodity, state=state)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/market/best")
def fetch_best_mandi(
    field_id: int = Query(..., description="Target field ID"),
    quantity_q: float = Query(10.0, description="Quantity in quintals"),
):
    try:
        return get_best_mandi(field_id=field_id, quantity_q=quantity_q)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
