import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

class SupabaseService:
    _instance = None
    client: Client
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            # Use SERVICE_ROLE key for backend operations (bypasses RLS)
            cls._instance.client = create_client(
                os.getenv("SUPABASE_URL"),
                os.getenv("SUPABASE_SERVICE_KEY")  # Changed from SUPABASE_KEY
            )
        return cls._instance
    
    def get_client(self) -> Client:
        return self.client

# Singleton instance
supabase_service = SupabaseService()