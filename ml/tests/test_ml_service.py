import io
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.canopy import calculate_canopy_loss, compute_green_percentage
from app.cv_utils import to_numpy
from app.main import app

client = TestClient(app)


def generate_synthetic_image_bytes(color: tuple, size: tuple = (128, 128)) -> bytes:
    """Generate in-memory JPEG bytes for testing without external fixtures."""
    img = Image.new("RGB", size, color=color)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def test_health_endpoint():
    """Verify /health returns contract A8 schema."""
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "MobileNet" in data["disease_model"]
    assert data["version"] == "1"


def test_damage_compare_synthetic():
    """Verify /damage/compare correctly calculates canopy destruction."""
    # Before: vibrant green foliage (34, 139, 34)
    before_bytes = generate_synthetic_image_bytes((34, 139, 34))
    # After: devastated brown field (139, 69, 19)
    after_bytes = generate_synthetic_image_bytes((139, 69, 19))

    files = {
        "before": ("before.jpg", before_bytes, "image/jpeg"),
        "after": ("after.jpg", after_bytes, "image/jpeg"),
    }
    resp = client.post("/damage/compare", files=files)
    assert resp.status_code == 200
    data = resp.json()

    assert data["green_before_pct"] > data["green_after_pct"]
    assert data["canopy_loss_pct"] > 50.0
    assert -1.0 <= data["ssim"] <= 1.0
    assert 0.0 <= data["change_score"] <= 1.0
    assert len(data["diff_png_b64"]) > 0


def test_predict_disease_healthy():
    """Verify /predict/disease returns valid PlantVillage classification."""
    green_bytes = generate_synthetic_image_bytes((40, 160, 40))
    files = {"file": ("leaf.jpg", green_bytes, "image/jpeg")}

    resp = client.post("/predict/disease", files=files)
    assert resp.status_code == 200
    data = resp.json()

    assert data["crop"] == "Tomato"
    assert "label" in data
    assert isinstance(data["healthy"], bool)
    assert 0.0 <= data["confidence"] <= 1.0
    assert len(data["top3"]) == 3
    for pred in data["top3"]:
        assert "label" in pred
        assert 0.0 <= pred["confidence"] <= 1.0


def test_canopy_loss_edge_cases():
    """Test boundary conditions for canopy loss."""
    assert calculate_canopy_loss(0.0, 0.0) == 0.0
    assert calculate_canopy_loss(50.0, 50.0) == 0.0
    assert calculate_canopy_loss(100.0, 0.0) == 100.0
    # Growth scenario shouldn't yield negative loss
    assert calculate_canopy_loss(40.0, 60.0) == 0.0


def test_invalid_file_handling():
    """Verify error responses for invalid payloads."""
    files = {"file": ("test.txt", b"not an image", "text/plain")}
    resp = client.post("/predict/disease", files=files)
    assert resp.status_code == 400
