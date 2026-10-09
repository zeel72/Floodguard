import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    FloodGuard System Configuration
    Manages environment parameters, CORS, AWS services, and flood thresholds.
    """
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    
    # System Operating Mode: 'simulation' | 'real'
    MODE: str = "simulation"
    
    # CORS Origins (accepts comma-separated string or list)
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
    
    # AWS Cloud Settings (optional for offline fallback)
    AWS_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    DYNAMODB_TABLE_SENSORS: str = "floodguard_sensor_readings"
    DYNAMODB_TABLE_ZONES: str = "floodguard_zones"
    S3_BUCKET_MODELS: str = "floodguard-models-bucket"
    
    # Hydrological & Flood Risk Engine Defaults
    WATER_RISE_THRESHOLD_CM: float = 5.0
    CRITICAL_WATER_DEPTH_CM: float = 90.0
    HIGH_WATER_DEPTH_CM: float = 70.0
    MODERATE_WATER_DEPTH_CM: float = 50.0

    model_config = SettingsConfigDict(
        env_file=[".env", "backend/.env", "../.env"],
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @field_validator("CORS_ORIGINS", mode="after")
    @classmethod
    def parse_cors_origins(cls, value: Union[str, List[str]]) -> List[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @property
    def is_aws_configured(self) -> bool:
        """Returns True if valid AWS access credentials are provided."""
        return bool(self.AWS_ACCESS_KEY_ID and self.AWS_SECRET_ACCESS_KEY)


settings = Settings()
