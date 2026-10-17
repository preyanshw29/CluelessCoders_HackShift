from typing import List, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(default="ok", description="Service health state")
    disease_model: str = Field(description="Active model identifier")
    version: str = Field(default="1", description="Model contract schema version")


class TopPrediction(BaseModel):
    label: str = Field(description="Full PlantVillage class label, e.g. Tomato___Early_blight")
    confidence: float = Field(ge=0.0, le=1.0, description="Normalized prediction probability")


class DiseasePredictionResponse(BaseModel):
    label: str = Field(description="Winning class label")
    crop: str = Field(default="Tomato", description="Detected crop species")
    disease: str = Field(description="Human readable disease name or 'healthy'")
    healthy: bool = Field(description="True if no pathology detected")
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence of primary prediction")
    top3: List[TopPrediction] = Field(description="Top 3 likely class candidates")


class DamageCompareResponse(BaseModel):
    canopy_loss_pct: float = Field(ge=0.0, le=100.0, description="Estimated canopy loss percentage")
    green_before_pct: float = Field(ge=0.0, le=100.0, description="Green vegetation area before calamity")
    green_after_pct: float = Field(ge=0.0, le=100.0, description="Green vegetation area after calamity")
    ssim: float = Field(ge=-1.0, le=1.0, description="Structural similarity index between frames")
    change_score: float = Field(ge=0.0, le=2.0, description="Normalized visual disparity score")
    diff_png_b64: str = Field(default="", description="Base64 encoded difference heatmap visualization")
