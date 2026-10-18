import base64
import io
from typing import Tuple
import numpy as np
from PIL import Image


def decode_image(image_bytes: bytes) -> Image.Image:
    """Decode raw bytes into a PIL RGB Image."""
    try:
        img = Image.open(io.BytesIO(image_bytes))
        return img.convert("RGB")
    except Exception as e:
        raise ValueError(f"Failed to decode image from bytes: {e}")


def to_numpy(img: Image.Image) -> np.ndarray:
    """Convert PIL Image to uint8 NumPy array (H, W, 3)."""
    return np.array(img, dtype=np.uint8)


def resize_standard(img: Image.Image, target_size: Tuple[int, int] = (512, 512)) -> Image.Image:
    """Resize image to standardized dimensions for uniform feature comparison."""
    return img.resize(target_size, Image.Resampling.BILINEAR)


def rgb_to_exg(rgb_array: np.ndarray) -> np.ndarray:
    """
    Compute Excess Green Index (ExG):
    ExG = 2 * G - R - B
    Normalized to float in range [-2.0, 2.0].
    """
    rgb_float = rgb_array.astype(np.float32) / 255.0
    r = rgb_float[:, :, 0]
    g = rgb_float[:, :, 1]
    b = rgb_float[:, :, 2]
    return 2.0 * g - r - b


def pil_to_base64_png(img: Image.Image) -> str:
    """Encode PIL image as base64 PNG string."""
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")
