from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from services.supabase_service import supabase_service
from middleware.auth import get_current_user, get_current_user_permissions

router = APIRouter()

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    surname: str
    phone_no: str

@router.post("/login")
async def login(request: LoginRequest):
    try:
        client = supabase_service.get_client()
        response = client.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        return {
            "access_token": response.session.access_token,
            "user": response.user.model_dump()
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.post("/signup")
async def signup(request: SignupRequest):
    try:
        client = supabase_service.get_client()
        
        # 1. Create auth user
        auth_response = client.auth.sign_up({
            "email": request.email,
            "password": request.password
        })
        
        # 2. Create user profile in uzytkownicy table
        user_data = {
            "auth_id": auth_response.user.id,
            "imie": request.name,
            "nazwisko": request.surname,
            "nr_telefonu": request.phone_no,
            "email": request.email
        }
        
        profile_response = client.table("uzytkownicy").insert(user_data).execute()
        
        return {
            "message": "User created successfully",
            "user": auth_response.user.model_dump(),
            "profile": profile_response.data[0]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/me")
async def get_me(user = Depends(get_current_user)):
    """Get current user profile"""
    return {"user": user}

@router.get("/me/permissions")
async def get_my_permissions(perms = Depends(get_current_user_permissions)):
    """Get current user with role permissions"""
    return perms