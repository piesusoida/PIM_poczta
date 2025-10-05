from fastapi import Header, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from services.supabase_service import supabase_service

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user from JWT token"""
    try:
        token = credentials.credentials
        
        client = supabase_service.get_client()
        
        # Get auth user from token
        user_response = client.auth.get_user(token)
        auth_id = user_response.user.id
        
        # Get user profile from database
        profile = client.table("uzytkownicy")\
            .select("*")\
            .eq("auth_id", auth_id)\
            .single()\
            .execute()
        
        return profile.data
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid authentication: {str(e)}")

async def get_current_user_permissions(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user with their role permissions"""
    try:
        user = await get_current_user(credentials)
        client = supabase_service.get_client()
        
        # Check if courier
        courier = client.table("kurierzy")\
            .select("id")\
            .eq("id_uzytkownika", user["id"])\
            .execute()
        
        # Check if manager
        manager = client.table("kierownicy")\
            .select("id")\
            .eq("id_uzytkownika", user["id"])\
            .execute()
        
        # Check if pickup point owner
        pickup_point = client.table("punkty_odbioru")\
            .select("id")\
            .eq("id_uzytkownika", user["id"])\
            .execute()
        
        return {
            "user": user,
            "is_courier": len(courier.data) > 0,
            "is_manager": len(manager.data) > 0,
            "is_pickup_point": len(pickup_point.data) > 0,
            "courier_id": courier.data[0]["id"] if courier.data else None,
            "manager_id": manager.data[0]["id"] if manager.data else None,
            "pickup_point_id": pickup_point.data[0]["id"] if pickup_point.data else None
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

async def require_courier(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Require user to be a courier"""
    perms = await get_current_user_permissions(credentials)
    if not perms["is_courier"]:
        raise HTTPException(status_code=403, detail="Courier role required")
    return perms

async def require_manager(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Require user to be a manager"""
    perms = await get_current_user_permissions(credentials)
    if not perms["is_manager"]:
        raise HTTPException(status_code=403, detail="Manager role required")
    return perms