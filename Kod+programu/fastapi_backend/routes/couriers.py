from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.supabase_service import supabase_service

router = APIRouter()

class CourierCreate(BaseModel):
    id_uzytkownika: int

@router.get("/")
async def get_couriers():
    """Get all couriers"""
    try:
        client = supabase_service.get_client()
        response = client.table("kurierzy")\
            .select("*, uzytkownik:id_uzytkownika(id, imie, nazwisko, email, nr_telefonu)")\
            .execute()
        return {"couriers": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def create_courier(courier: CourierCreate):
    """Assign courier role to user"""
    try:
        client = supabase_service.get_client()
        response = client.table("kurierzy").insert(courier.model_dump()).execute()
        return {"message": "Courier created", "courier": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))