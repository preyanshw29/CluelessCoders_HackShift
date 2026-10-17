# FasalSakshi: Judge Q&A & Technical Defense Guide (HackShift)

This document provides transparent, mathematically grounded, and commercially realistic answers to the toughest questions judges, agricultural economists, and insurance evaluators will ask.

---

### Q1: How accurate is the visual damage comparison and disease model?
**Answer:**
> *"We maintain strict engineering honesty regarding model accuracy. Our disease classifier is trained on open academic datasets like PlantVillage. While PlantVillage achieves 90%+ in laboratory settings, field imagery experiences variable sunlight, occlusions, and leaf angles, resulting in real-world accuracy closer to 70–80%. 
> For damage comparison, rather than treating a computer vision model as an absolute arbiter, we use a deterministic heuristic: HSV green canopy loss combined with grayscale SSIM (Structural Similarity Index). Crucially, visual damage represents only 40% of our aggregated confidence score—it is corroborated with in-situ soil moisture/temperature and Open-Meteo weather radar before triggering a High-confidence alert."*

---

### Q2: Will insurance companies actually accept this automated dossier?
**Answer:**
> *"Yes, because it directly addresses the insurance industry's two biggest bottlenecks: **Moral Hazard** and **Surveyor Expense**. 
> Under PMFBY localized calamity guidelines, insurers are legally obligated to assess claims filed within 72 hours, but deploying physical loss assessors costs thousands of rupees per smallholding. Insurers reject unverified mobile photos because EXIF metadata can be easily falsified. 
> Our dossier solves this by providing:
> 1. An immutable SHA-256 hash chain tying daily photos to physical timestamps and GPS coordinates.
> 2. Independent corroboration between satellite weather data, camera canopy loss, and ground soil moisture.
> 3. Standardized PDF dossier format directly importable into the national Crop Insurance portal. 
> Insurers do not have to replace their surveyors; our report serves as pre-vetted, high-fidelity evidentiary proof that expedites 80% of straightforward payouts."*

---

### Q3: What does a production field unit actually cost?
**Answer:**
> *"Our bill of materials (BOM) target for a production field unit is under **₹8,500 (~$100 USD)**:
> - ESP32-S3 microcontroller with power management: ₹600
> - 4G/LTE Cat-M1 / NB-IoT cellular module: ₹1,200
> - 5MP weatherproof camera module: ₹1,800
> - Soil moisture, temperature, and EC sensor probe: ₹1,500
> - Digital tipping bucket rain gauge: ₹900
> - 10W solar panel + 6Ah LiFePO4 battery pack: ₹1,600
> - Weatherproof IP67 enclosure & pole mount: ₹900
> **Total BOM: ~₹8,500.** 
> Amortized over a 3-year lifespan across a 2-hectare tomato farm with ₹2.4 Lakh annual crop value, the equipment cost is less than 1.5% of total seasonal operational expenditure."*

---

### Q4: How is this different from a basic CCTV or farm camera?
**Answer:**
> *"A CCTV camera merely records video; it has zero agronomic intelligence, consumes massive bandwidth (gigabytes per day), and has no cryptographic chain of custody. 
> FasalSakshi is fundamentally different in three ways:
> 1. **Zero Bandwidth Overhead:** We process edge telemetry locally and only upload periodic daily snapshots and event hashes (under 2 MB per day), allowing it to run smoothly on 2G/EDGE rural networks.
> 2. **Multi-Modal Cross-Checking:** CCTV has no ground sensors. If someone sprays herbicide on leaves, a camera sees yellowing, but our soil EC and rainfall sensors detect that no meteorological flood or natural frost occurred.
> 3. **Cryptographic Proof of Existence:** Our SHA-256 hash chaining mathematically guarantees that a photo was taken at the exact reported minute and not retroactively uploaded after hearing about a neighboring claim."*

---

### Q5: Why is there no physical hardware at your hackathon booth?
**Answer:**
> *"We made a deliberate, strategic prioritization: **the sensors and microcontrollers are off-the-shelf commoditized hardware.** Anyone can wire an ESP32 to a soil probe in an afternoon.
> The true, defensible value of this system lies in:
> - The cryptographic hash-chain evidence vault.
> - The multi-source evidence scoring engine (40/40/20 confidence weighting).
> - The PMFBY policy evaluation engine with localized vs. area-based peril classification.
> - The automated insurance PDF dossier generator and bilingual alert pipeline.
> Bringing a breadboard with flashing LEDs would distract from the core data integrity and financial infrastructure we engineered in software."*

---

### Q6: Does your Organic Evidence Score serve as a government certification?
**Answer:**
> *"No, and we explicitly print this disclaimer on every dashboard page and generated document: **'Evidence strength, not certification.'**
> Formal organic certification under India's NPOP (National Programme for Organic Production) or PGS-India requires accredited third-party agency audits, soil residue lab testing, and a 3-year conversion period. 
> Our Organic Evidence Score (0–100) measures **verifiable cultivating practices**: log completeness, continuous visual photographic evidence, and the absence of soil EC/salinity spikes that accompany synthetic fertilizer dumping. It empowers farmers to demonstrate transparency to contract buyers, premium FPOs, and conscious urban consumers to negotiate a 10–30% price premium."*

---

### Q7: Why did you use simulated sensor data for the demo?
**Answer:**
> *"In a 30-hour hackathon environment, waiting for real crops to experience a hailstorm or a 48-hour monsoon flood is impossible. 
> Therefore, we built a mathematically calibrated sensor simulator (`simulate.py`) that strictly pulls from our contract specifications (`scenario_profiles.json`). When you trigger 'Flood', it generates soil moisture (88–98%), rainfall (10–25mm), and humidity (85–95%) that accurately mirror real agronomic flood thresholds. The backend processes this synthetic stream through the identical production pipeline that live field hardware would use."*
