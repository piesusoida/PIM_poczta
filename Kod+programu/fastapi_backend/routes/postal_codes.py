from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.supabase_service import supabase_service

router = APIRouter()

class PostalCodeCreate(BaseModel):
    numer: str

@router.get("/")
async def get_postal_codes():
    """Get all postal codes"""
    try:
        client = supabase_service.get_client()
        response = client.table("kody_pocztowe").select("*").execute()
        return {"postal_codes": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def create_postal_code(postal_code: PostalCodeCreate):
    """Create new postal code"""
    try:
        client = supabase_service.get_client()
        response = client.table("kody_pocztowe").insert(postal_code.model_dump()).execute()
        return {"message": "Postal code created", "postal_code": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))