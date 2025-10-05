from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from routes import auth, packages, couriers, managers, postal_codes, pickup_points

# Add security scheme
security = HTTPBearer()

app = FastAPI(
    title="PIM Poczta API",
    description="Backend API for postal package management system",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(packages.router, prefix="/api/packages", tags=["Packages"])
app.include_router(couriers.router, prefix="/api/couriers", tags=["Couriers"])
app.include_router(managers.router, prefix="/api/managers", tags=["Managers"])
app.include_router(postal_codes.router, prefix="/api/postal-codes", tags=["Postal Codes"])
app.include_router(pickup_points.router, prefix="/api/pickup-points", tags=["Pickup Points"])

@app.get("/")
async def root():
    return {
        "message": "PIM Poczta API is running",
        "docs": "/docs",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}