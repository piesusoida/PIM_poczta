from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from pydantic import BaseModel
from services.supabase_service import supabase_service
from middleware.auth import get_current_user, require_courier

router = APIRouter()

class PackageCreate(BaseModel):
    id_adresata: Optional[int] = None
    id_kod_pocztowy: int
    ulica: str
    nr_budynku: int
    nr_lokalu: Optional[int] = None
    waga: float
    wymiary: float
    id_nadawcy: int
    kod_odbioru: int
    id_kuriera: int
    email_adresata: str
    telefon_adresata: str

@router.get("/")
async def get_packages(
    status: Optional[int] = None,
    sender_id: Optional[int] = None,
    receiver_id: Optional[int] = None,
    courier_id: Optional[int] = None
):
    """Get packages with optional filters"""
    try:
        client = supabase_service.get_client()
        query = client.table("paczki")\
            .select("""
                *,
                adresat:id_adresata(id, imie, nazwisko, email, nr_telefonu),
                kod_pocztowy:id_kod_pocztowy(id, numer),
                nadawca:id_nadawcy(id, imie, nazwisko, email, nr_telefonu),
                kurier:id_kuriera(id, uzytkownik:id_uzytkownika(id, imie, nazwisko)),
                punkt_odbioru(id, nazwa)
            """)
        
        if status is not None:
            query = query.eq("status", status)
        if sender_id:
            query = query.eq("id_nadawcy", sender_id)
        if receiver_id:
            query = query.eq("id_adresata", receiver_id)
        if courier_id:
            query = query.eq("id_kuriera", courier_id)
            
        response = query.execute()
        return {"packages": response.data, "count": len(response.data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/my-packages")
async def get_my_packages(user = Depends(get_current_user)):
    """Get packages sent by current user"""
    try:
        client = supabase_service.get_client()
        response = client.table("paczki")\
            .select("""
                *,
                adresat:id_adresata(id, imie, nazwisko, email, nr_telefonu),
                kod_pocztowy:id_kod_pocztowy(id, numer),
                punkt_odbioru(id, nazwa)
            """)\
            .eq("id_nadawcy", user["id"])\
            .execute()
        return {"packages": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{package_id}")
async def get_package(package_id: int):
    """Get single package by ID"""
    try:
        client = supabase_service.get_client()
        response = client.table("paczki")\
            .select("""
                *,
                adresat:id_adresata(id, imie, nazwisko, email, nr_telefonu),
                kod_pocztowy:id_kod_pocztowy(id, numer),
                nadawca:id_nadawcy(id, imie, nazwisko, email, nr_telefonu),
                kurier:id_kuriera(id, uzytkownik:id_uzytkownika(id, imie, nazwisko)),
                punkt_odbioru(id, nazwa, ulica, nr_budynku, nr_lokalu)
            """)\
            .eq("id", package_id)\
            .single()\
            .execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=404, detail="Package not found")

@router.post("/")
async def create_package(package: PackageCreate, user = Depends(get_current_user)):
    """Create a new package"""
    try:
        client = supabase_service.get_client()
        response = client.table("paczki").insert(package.model_dump()).execute()
        return {"message": "Package created", "package": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/{package_id}/status")
async def update_package_status(
    package_id: int, 
    status: int,
    user = Depends(require_courier)
):
    """Update package status - requires courier role"""
    try:
        if status not in [0, 1, 2, 3]:
            raise HTTPException(status_code=400, detail="Invalid status. Must be 0-3")
        
        client = supabase_service.get_client()
        response = client.table("paczki")\
            .update({"status": status})\
            .eq("id", package_id)\
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Package not found")
            
        return {"message": "Status updated", "package": response.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/{package_id}/assign-pickup-point")
async def assign_pickup_point(
    package_id: int,
    pickup_point_id: int,
    user = Depends(require_courier)
):
    """Assign package to pickup point - requires courier role"""
    try:
        client = supabase_service.get_client()
        response = client.table("paczki")\
            .update({
                "punkt_odbioru": pickup_point_id,
                "status": 2  # Status = at pickup point
            })\
            .eq("id", package_id)\
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Package not found")
            
        return {"message": "Package assigned to pickup point", "package": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/courier/{courier_id}")
async def get_courier_packages(courier_id: int):
    """Get all packages assigned to a specific courier"""
    try:
        client = supabase_service.get_client()
        response = client.table("paczki")\
            .select("""
                *,
                adresat:id_adresata(id, imie, nazwisko, email, nr_telefonu),
                kod_pocztowy:id_kod_pocztowy(id, numer),
                nadawca:id_nadawcy(id, imie, nazwisko),
                punkt_odbioru(id, nazwa)
            """)\
            .eq("id_kuriera", courier_id)\
            .execute()
        return {"packages": response.data, "count": len(response.data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))