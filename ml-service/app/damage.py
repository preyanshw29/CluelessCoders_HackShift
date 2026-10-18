import numpy as np
from app.canopy import calculate_canopy_loss, compute_green_percentage
from app.change_detection import compute_ssim_numpy, generate_damage_heatmap
from app.cv_utils import decode_image, resize_standard, to_numpy
from app.schemas import DamageCompareResponse


def evaluate_damage(before_bytes: bytes, after_bytes: bytes) -> DamageCompareResponse:
    """
    Complete damage assessment pipeline combining:
    1. Vegetative canopy loss percentage (via ExG)
    2. Structural shift (via SSIM)
    3. Change disparity score (1.0 - SSIM)
    4. Insurer differential damage heatmap (base64)
    """
    # 1. Decode & standardize dimensions
    before_img = resize_standard(decode_image(before_bytes))
    after_img = resize_standard(decode_image(after_bytes))

    before_arr = to_numpy(before_img)
    after_arr = to_numpy(after_img)

    # 2. Vegetation canopy metrics
    green_before = compute_green_percentage(before_arr)
    green_after = compute_green_percentage(after_arr)
    canopy_loss = calculate_canopy_loss(green_before, green_after)

    # 3. Structural similarity & change score
    ssim_val, _ = compute_ssim_numpy(before_arr, after_arr)
    change_score = round(float(np.clip(1.0 - ssim_val, 0.0, 1.0)), 2)

    # Effective damage combines canopy defoliation with structural disruption
    effective_damage = round(float(np.clip(max(canopy_loss, canopy_loss * 0.6 + change_score * 35.0), 0.0, 100.0)), 2)

    # 4. Generate differential visual heatmap
    diff_b64 = generate_damage_heatmap(before_arr, after_arr)

    return DamageCompareResponse(
        canopy_loss_pct=effective_damage,
        green_before_pct=green_before,
        green_after_pct=green_after,
        ssim=ssim_val,
        change_score=change_score,
        diff_png_b64=diff_b64,
    )
