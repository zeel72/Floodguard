from fastapi import APIRouter

try:
    from app.api.v1.health import router as health_router
    from app.api.v1.sensors import router as sensors_router
    from app.api.v1.predictions import router as predictions_router
    from app.api.v1.zones import router as zones_router
    from app.api.v1.routing import router as routing_router
    from app.api.v1.alerts import router as alerts_router
    from app.api.v1.simulation import router as simulation_router
    from app.api.v1.aws import router as aws_router
except ImportError:
    from backend.app.api.v1.health import router as health_router
    from backend.app.api.v1.sensors import router as sensors_router
    from backend.app.api.v1.predictions import router as predictions_router
    from backend.app.api.v1.zones import router as zones_router
    from backend.app.api.v1.routing import router as routing_router
    from backend.app.api.v1.alerts import router as alerts_router
    from backend.app.api.v1.simulation import router as simulation_router
    from backend.app.api.v1.aws import router as aws_router

api_v1_router = APIRouter(prefix="/api/v1")

# Mount sub-routers
api_v1_router.include_router(sensors_router)
api_v1_router.include_router(predictions_router)
api_v1_router.include_router(zones_router)
api_v1_router.include_router(routing_router)
api_v1_router.include_router(alerts_router)
api_v1_router.include_router(simulation_router)
api_v1_router.include_router(aws_router)

__all__ = ["api_v1_router", "health_router"]
