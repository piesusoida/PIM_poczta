from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.supabase_service import supabase_service

router = APIRouter()

class PickupPointCreate(BaseModel):
    nazwa: str
    id_uzytkownika: int
    id_kod_pocztowy: int
    ulica: str
    nr_budynku: int
    nr_lokalu: Optional[int] = None

@router.get("/")
async def get_pickup_points():
    """Get all pickup points"""
    try:
        client = supabase_service.get_client()
        response = client.table("punkty_odbioru")\
            .select("""
                *,
                uzytkownik:id_uzytkownika(id, imie, nazwisko, email, nr_telefonu),
                kod_pocztowy:id_kod_pocztowy(id, numer)
            """)\
            .execute()
        return {"pickup_points": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def create_pickup_point(pickup_point: PickupPointCreate):
    """Create new pickup point"""
    try:
        client = supabase_service.get_client()
        response = client.table("punkty_odbioru").insert(pickup_point.model_dump()).execute()
        return {"message": "Pickup point created", "pickup_point": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))