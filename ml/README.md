# FasalSakshi: Machine Learning & Computer Vision Microservice (Member 1)

This service provides real-time crop disease diagnosis and visual field damage estimation for the **FasalSakshi (फसलसाक्षी)** platform, running independently on **Port 8001**.

---

## 🎯 Scope & Endpoints (Contract A8)

1. **`GET /health`**
   - Health status, active model descriptor, and version.
2. **`POST /predict/disease`**
   - Multipart file upload of crop leaf image.
   - Classifies tomato pathologies (PlantVillage taxonomy) with top-3 confidence scores.
3. **`POST /damage/compare`**
   - Multipart `before` and `after` images taken from field camera.
   - Computes Excess Green Index (ExG) canopy loss %, SSIM structural similarity, and differential heatmap base64 image.

---

## 🛠️ Quickstart

```bash
# 1. Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run service
python run.py
```

The service will be live on `http://localhost:8001` with interactive OpenAPI docs at `http://localhost:8001/docs`.
