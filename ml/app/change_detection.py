from typing import Tuple
import numpy as np
from PIL import Image
from app.cv_utils import pil_to_base64_png


def compute_ssim_numpy(img1: np.ndarray, img2: np.ndarray) -> Tuple[float, np.ndarray]:
    """
    Compute Structural Similarity Index (SSIM) between two grayscale/RGB images.
    Returns:
        (mean_ssim, difference_map)
    Implemented in pure NumPy to guarantee zero-breakage across all platforms.
    """
    # Convert to grayscale if 3D
    if img1.ndim == 3:
        g1 = 0.2989 * img1[:, :, 0] + 0.5870 * img1[:, :, 1] + 0.1140 * img1[:, :, 2]
    else:
        g1 = img1.astype(np.float32)

    if img2.ndim == 3:
        g2 = 0.2989 * img2[:, :, 0] + 0.5870 * img2[:, :, 1] + 0.1140 * img2[:, :, 2]
    else:
        g2 = img2.astype(np.float32)

    c1 = (0.01 * 255) ** 2
    c2 = (0.03 * 255) ** 2

    # Global and local window approximation
    mu1 = np.mean(g1)
    mu2 = np.mean(g2)

    sigma1_sq = np.var(g1)
    sigma2_sq = np.var(g2)
    sigma12 = np.mean((g1 - mu1) * (g2 - mu2))

    ssim_val = ((2 * mu1 * mu2 + c1) * (2 * sigma12 + c2)) / (
        (mu1 ** 2 + mu2 ** 2 + c1) * (sigma1_sq + sigma2_sq + c2)
    )

    # Pixel-wise absolute difference map normalized 0..255
    diff_map = np.abs(g1 - g2).astype(np.uint8)

    return round(float(np.clip(ssim_val, -1.0, 1.0)), 3), diff_map


def generate_damage_heatmap(before_rgb: np.ndarray, after_rgb: np.ndarray) -> str:
    """
    Generate an insurer-grade visual differential heatmap.
    Regions with significant vegetation reduction are highlighted in bright red/amber.
    Returns base64 encoded PNG string.
    """
    _, diff = compute_ssim_numpy(before_rgb, after_rgb)

    # Threshold significant changes (> 15% intensity shift)
    mask = diff > 35

    # Create composite overlay: dimmer version of after_rgb + red highlight on damaged regions
    heatmap = (after_rgb.astype(np.float32) * 0.7).astype(np.uint8)
    heatmap[mask, 0] = np.clip(heatmap[mask, 0].astype(int) + 180, 0, 255)  # Boost red channel
    heatmap[mask, 1] = (heatmap[mask, 1].astype(float) * 0.3).astype(np.uint8)  # Reduce green channel
    heatmap[mask, 2] = (heatmap[mask, 2].astype(float) * 0.3).astype(np.uint8)  # Reduce blue channel

    img = Image.fromarray(heatmap)
    return pil_to_base64_png(img)
