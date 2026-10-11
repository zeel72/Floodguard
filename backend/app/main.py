from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from app.config import settings
    from app.api.v1 import api_v1_router, health_router
except ImportError:
    from backend.app.config import settings
    from backend.app.api.v1 import api_v1_router, health_router

app = FastAPI(
    title="FloodGuard API",
    description="AI-Powered Urban Flood Prediction, Early Warning & Safe Emergency Evacuation Routing",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS Middleware for Frontend Communication
cors_origins = settings.CORS_ORIGINS
allow_creds = True
if "*" in cors_origins:
    cors_origins = ["*"]
    allow_creds = False

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.amplifyapp\.com|https://.*\.vercel\.app|https://.*\.onrender\.com|http://localhost:.*",
    allow_credentials=allow_creds,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Health check at root `/health` and under router
app.include_router(health_router)

# Mount Version 1 API routers
app.include_router(api_v1_router)


@app.get("/", tags=["Root"])
def root_status():
    """System entry point and API metadata."""
    return {
        "service": "FloodGuard Urban Hydrology Engine",
        "status": "online",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "mode": settings.MODE,
        "aws_connected": settings.is_aws_configured,
        "docs": "/docs"
    }
