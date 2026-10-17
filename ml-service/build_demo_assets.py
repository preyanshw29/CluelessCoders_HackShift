import os
import pathlib
import random
import numpy as np
from PIL import Image, ImageDraw

BASE_DIR = pathlib.Path(__file__).parent
DATA_DIR = BASE_DIR / "data" / "tomato"
DEMO_DIR = BASE_DIR / "demo_assets"

random.seed(101)
np.random.seed(101)


def get_random_healthy_leaves(count: int = 16):
    healthy_dir = DATA_DIR / "Tomato___healthy"
    all_files = list(healthy_dir.glob("*.JPG")) + list(healthy_dir.glob("*.jpg"))
    return [Image.open(f).convert("RGBA") for f in random.sample(all_files, count)]


def create_field_soil_background(size=(512, 512)):
    w, h = size
    base_color = np.array([55, 42, 28], dtype=np.float32)
    noise = np.random.normal(0, 10, (h, w, 3)).astype(np.float32)
    soil = np.clip(base_color + noise, 0, 255).astype(np.uint8)
    return Image.fromarray(soil, "RGB").convert("RGBA")


def build_lush_canopy(size=(512, 512)):
    canvas = create_field_soil_background(size)
    leaves = get_random_healthy_leaves(16)

    positions = [
        (30, 30), (170, 20), (310, 40),
        (10, 160), (150, 150), (290, 170), (190, 230),
        (40, 300), (180, 320), (320, 290),
        (90, 90), (250, 110), (110, 240), (270, 250),
        (200, 80), (70, 370)
    ]

    for pos, leaf in zip(positions, leaves):
        target_size = random.randint(180, 240)
        leaf_resized = leaf.resize((target_size, target_size), Image.Resampling.BILINEAR)
        leaf_rotated = leaf_resized.rotate(random.randint(0, 360), expand=True, resample=Image.Resampling.BILINEAR)

        r, g, b, a = leaf_rotated.split()
        arr_g, arr_r = np.array(g), np.array(r)
        mask_np = (arr_g > arr_r * 0.92) & (arr_g > 35)
        leaf_rotated.putalpha(Image.fromarray((mask_np * 255).astype(np.uint8)))

        canvas.paste(leaf_rotated, pos, leaf_rotated)

    return canvas.convert("RGB")


def generate_all_scenarios():
    print("[Asset Synthesis] Calibrating realistic PMFBY canopy loss curves...")
    before_img = build_lush_canopy()

    # 1. HAIL (Target: ~42.5% loss matching Contract A8)
    hail_dir = DEMO_DIR / "hail"
    hail_dir.mkdir(parents=True, exist_ok=True)
    before_img.save(hail_dir / "before.jpg", "JPEG", quality=92)

    hail_after = before_img.copy().convert("RGBA")
    draw = ImageDraw.Draw(hail_after)
    # Shred ~42.5% with hail punctures and soil exposure
    for _ in range(74):
        cx, cy = random.randint(30, 480), random.randint(30, 480)
        rx, ry = random.randint(18, 38), random.randint(18, 38)
        draw.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=(55, 42, 28, 255))

    hail_after.convert("RGB").save(hail_dir / "after.jpg", "JPEG", quality=92)
    print("  -> Hail calibrated.")

    # 2. FLOOD (Target: ~50% loss from lower field submergence)
    flood_dir = DEMO_DIR / "flood"
    flood_dir.mkdir(parents=True, exist_ok=True)
    before_img.save(flood_dir / "before.jpg", "JPEG", quality=92)

    flood_after = np.array(before_img)
    # Muddy flood water covering from y=90 downwards
    for y in range(90, 512):
        depth = (y - 90) / 422.0
        water = np.array([85, 72, 50], dtype=np.float32)
        flood_after[y, :] = (flood_after[y, :] * (1.0 - depth * 0.98) + water * (depth * 0.98)).astype(np.uint8)
    Image.fromarray(flood_after).save(flood_dir / "after.jpg", "JPEG", quality=92)
    print("  -> Flood calibrated.")

    # 3. DROUGHT (Target: ~48-52% loss from partial leaf desiccation)
    drought_dir = DEMO_DIR / "drought"
    drought_dir.mkdir(parents=True, exist_ok=True)
    before_img.save(drought_dir / "before.jpg", "JPEG", quality=92)

    drought_arr = np.array(before_img, dtype=np.float32)
    # Right half of canopy desiccated to yellow-brown, left half survives
    for x in range(240, 512):
        severity = (x - 240) / 272.0
        drought_arr[:, x, 1] *= (1.0 - severity * 0.75)  # Drop green
        drought_arr[:, x, 0] = np.clip(drought_arr[:, x, 0] * (1.0 + severity * 0.35), 0, 255) # Increase brown
    Image.fromarray(drought_arr.astype(np.uint8)).save(drought_dir / "after.jpg", "JPEG", quality=92)
    print("  -> Drought calibrated.")

    # 4. FROST (Target: ~55% loss from freeze-damage)
    frost_dir = DEMO_DIR / "frost"
    frost_dir.mkdir(parents=True, exist_ok=True)
    before_img.save(frost_dir / "before.jpg", "JPEG", quality=92)

    frost_arr = np.array(before_img, dtype=np.float32)
    for y in range(0, 512):
        # Frost damage concentrated on upper canopy (y < 280) exposed to cold air
        severity = 0.85 if (y < 280) else 0.05
        frost_arr[y, :, 1] *= (1.0 - severity * 0.75)
        frost_arr[y, :, 0] *= (1.0 - severity * 0.5)
        frost_arr[y, :, 2] = np.clip(frost_arr[y, :, 2] * (1.0 + severity * 0.35), 0, 255)
    Image.fromarray(frost_arr.astype(np.uint8)).save(frost_dir / "after.jpg", "JPEG", quality=92)
    print("  -> Frost calibrated.")

    print("[Complete] All calibrated disaster field photos generated.")


if __name__ == "__main__":
    generate_all_scenarios()
