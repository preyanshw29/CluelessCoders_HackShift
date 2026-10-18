from typing import Any, Dict, List

TOMATO_CLASSES: List[str] = [
    "Tomato___Bacterial_spot",
    "Tomato___Early_blight",
    "Tomato___Late_blight",
    "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite",
    "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato___Tomato_mosaic_virus",
    "Tomato___healthy",
]

DISEASE_METADATA: Dict[str, Dict[str, Any]] = {
    "Tomato___Bacterial_spot": {
        "crop": "Tomato",
        "disease": "Bacterial spot",
        "healthy": False,
        "pathogen": "Xanthomonas campestris",
        "organic_remedy": "Apply copper hydroxide spray; avoid overhead irrigation and practice crop rotation.",
    },
    "Tomato___Early_blight": {
        "crop": "Tomato",
        "disease": "Early blight",
        "healthy": False,
        "pathogen": "Alternaria solani",
        "organic_remedy": "Prune infected lower foliage; spray organic Bacillus subtilis or copper fungicide.",
    },
    "Tomato___Late_blight": {
        "crop": "Tomato",
        "disease": "Late blight",
        "healthy": False,
        "pathogen": "Phytophthora infestans",
        "organic_remedy": "Urgent removal of severely affected vines; apply prophylactic bio-fungicide and ensure field drainage.",
    },
    "Tomato___Leaf_Mold": {
        "crop": "Tomato",
        "disease": "Leaf mold",
        "healthy": False,
        "pathogen": "Passalora fulva",
        "organic_remedy": "Increase ventilation between rows; reduce humidity; spray neem oil emulsion.",
    },
    "Tomato___Septoria_leaf_spot": {
        "crop": "Tomato",
        "disease": "Septoria leaf spot",
        "healthy": False,
        "pathogen": "Septoria lycopersici",
        "organic_remedy": "Mulch soil surface to prevent soil splash; remove spotted leaves and sterilize tools.",
    },
    "Tomato___Spider_mites Two-spotted_spider_mite": {
        "crop": "Tomato",
        "disease": "Two-spotted spider mite",
        "healthy": False,
        "pathogen": "Tetranychus urticae",
        "organic_remedy": "Spray horticultural soap or neem seed kernel extract (NSKE 5%); introduce predatory mites.",
    },
    "Tomato___Target_Spot": {
        "crop": "Tomato",
        "disease": "Target spot",
        "healthy": False,
        "pathogen": "Corynespora cassiicola",
        "organic_remedy": "Maintain wide spacing for air circulation; avoid excessive nitrogen fertilizer.",
    },
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus": {
        "crop": "Tomato",
        "disease": "Yellow leaf curl virus",
        "healthy": False,
        "pathogen": "TYLCV (Begomovirus)",
        "organic_remedy": "Control whitefly vectors using yellow sticky traps and neem spray; remove symptomatic host plants.",
    },
    "Tomato___Tomato_mosaic_virus": {
        "crop": "Tomato",
        "disease": "Mosaic virus",
        "healthy": False,
        "pathogen": "Tomato mosaic virus (ToMV)",
        "organic_remedy": "Sanitize pruning tools with 20% nonfat milk solution; weed out alternative solanaceous hosts.",
    },
    "Tomato___healthy": {
        "crop": "Tomato",
        "disease": "Healthy",
        "healthy": True,
        "pathogen": "None",
        "organic_remedy": "Maintain regular vermicompost nourishment and routine moisture monitoring.",
    },
}


def get_disease_metadata(label: str) -> Dict[str, Any]:
    """Retrieve structured metadata and remediation for a given model label."""
    if label in DISEASE_METADATA:
        return DISEASE_METADATA[label]

    # Fallback parser for generic labels
    parts = label.split("___")
    crop = parts[0].replace("_", " ").title() if len(parts) > 0 else "Tomato"
    disease = parts[1].replace("_", " ").title() if len(parts) > 1 else "Unknown"
    is_healthy = "healthy" in label.lower()

    return {
        "crop": crop,
        "disease": disease,
        "healthy": is_healthy,
        "pathogen": "Undetermined",
        "organic_remedy": "Consult local Krishi Vigyan Kendra (KVK) agronomist.",
    }
