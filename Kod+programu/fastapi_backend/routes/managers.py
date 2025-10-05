from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from services.supabase_service import supabase_service
from middleware.auth import get_current_user, require_manager

router = APIRouter()

class ManagerCreate(BaseModel):
    id_uzytkownika: int

@router.get("/")
async def get_managers():
    """Get all managers"""
    try:
        client = supabase_service.get_client()
        response = client.table("kierownicy")\
            .select("*, uzytkownik:id_uzytkownika(id, imie, nazwisko, email, nr_telefonu)")\
            .execute()
        return {"managers": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def create_manager(manager: ManagerCreate):
    """Assign manager role to user (requires manager permission)"""
    try:
        client = supabase_service.get_client()
        response = client.table("kierownicy").insert(manager.model_dump()).execute()
        return {"message": "Manager created", "manager": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{manager_id}")
async def delete_manager(manager_id: int):
    """Remove manager role"""
    try:
        client = supabase_service.get_client()
        response = client.table("kierownicy").delete().eq("id", manager_id).execute()
        return {"message": "Manager deleted"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))