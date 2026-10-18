import logging
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.classifier import predict_disease
from app.damage import evaluate_damage
from app.schemas import DamageCompareResponse, DiseasePredictionResponse, HealthResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fasalsakshi-ml")

app = FastAPI(
    title="FasalSakshi ML & Computer Vision Microservice",
    description="Disease diagnostic and field canopy damage estimation service (Contract A8)",
    version="1.0.0",
)

# CORS setup enabling cross-origin calls from Frontend (:3000) and Backend (:8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000", "http://127.0.0.1:3000", "http://127.0.0.1:8000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
def health_check():
    """Health check endpoint conforming to Contract A8."""
    return HealthResponse(
        status="ok",
        disease_model="MobileNetV2-PlantVillage",
        version="1",
    )


@app.post("/predict/disease", response_model=DiseasePredictionResponse)
async def predict_crop_disease(file: UploadFile = File(...)):
    """
    Diagnose tomato disease from leaf photo.
    Accepts multipart file and returns top-3 predicted pathology classes with confidence scores.
    """
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail=f"Invalid file type '{file.content_type}'. Must be an image.")

    try:
        image_bytes = await file.read()
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        response = predict_disease(image_bytes)
        return response
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error in /predict/disease: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Disease prediction failed: {str(e)}")


@app.post("/damage/compare", response_model=DamageCompareResponse)
async def compare_field_damage(
    before: UploadFile = File(...),
    after: UploadFile = File(...),
):
    """
    Compare field before and after calamity images to evaluate canopy loss.
    Computes ExG canopy loss %, SSIM, and base64 differential heatmap.
    """
    if not before.content_type.startswith("image/") or not after.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Both 'before' and 'after' must be image files.")

    try:
        before_bytes = await before.read()
        after_bytes = await after.read()

        if len(before_bytes) == 0 or len(after_bytes) == 0:
            raise HTTPException(status_code=400, detail="'before' or 'after' image payload is empty.")

        result = evaluate_damage(before_bytes, after_bytes)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error in /damage/compare: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Damage comparison failed: {str(e)}")
