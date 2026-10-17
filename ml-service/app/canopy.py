from typing import Tuple
import numpy as np
from app.cv_utils import rgb_to_exg


def get_vegetation_mask(rgb_array: np.ndarray, exg_threshold: float = 0.04) -> np.ndarray:
    """
    Extract green vegetative canopy mask from RGB image.
    Combines Excess Green Index (ExG) with chromaticity conditions to filter out soil and shadows.
    """
    rgb_float = rgb_array.astype(np.float32) / 255.0
    r = rgb_float[:, :, 0]
    g = rgb_float[:, :, 1]
    b = rgb_float[:, :, 2]

    exg = 2.0 * g - r - b

    # Chromatic conditions: Green is significantly higher than Red and Blue, avoiding dark noise
    intensity = (r + g + b) / 3.0
    green_dominant = (g > r * 0.95) & (g > b * 0.95)
    valid_exposure = (intensity > 0.08) & (intensity < 0.95)

    mask = (exg > exg_threshold) & green_dominant & valid_exposure
    return mask


def compute_green_percentage(rgb_array: np.ndarray) -> float:
    """
    Compute percentage of green canopy pixels relative to total image area.
    Returns value bounded between 0.0 and 100.0.
    """
    mask = get_vegetation_mask(rgb_array)
    total_pixels = mask.size
    if total_pixels == 0:
        return 0.0

    green_count = np.count_nonzero(mask)
    return round(float((green_count / total_pixels) * 100.0), 2)


def calculate_canopy_loss(green_before_pct: float, green_after_pct: float) -> float:
    """
    Calculate relative percentage of canopy loss following an agricultural calamity.
    Formula: ((Green_Before - Green_After) / Green_Before) * 100
    Bounded between 0.0% and 100.0%.
    """
    if green_before_pct <= 0.001:
        return 0.0

    loss = ((green_before_pct - green_after_pct) / green_before_pct) * 100.0
    # Bound between 0.0% (no loss or growth) and 100.0% (total destruction)
    return round(float(np.clip(loss, 0.0, 100.0)), 2)
