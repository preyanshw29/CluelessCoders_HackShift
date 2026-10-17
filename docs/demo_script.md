# FasalSakshi: 3-Minute Live Demonstration Script (HackShift)

**Demo Objective:** Show a seamless transition from normal agricultural monitoring to real-time calamity detection, automated cryptographic claim preparation, statutory deadline tracking, and post-harvest market optimization.

---

### Timing & Stage Progression

```text
[0:00 - 0:40] Farm Monitoring & Cryptographic Vault
  ↳ Open Dashboard (http://localhost:3000)
  ↳ Show Field Cards (Ramesh Kumar, North Plot, 1.5 ha Tomato)
  ↳ Inspect Live Telemetry Charts & Hash Chain Verification Tick

[0:40 - 1:20] The Disaster & Instant Warning
  ↳ Open Simulation Panel (/simulate)
  ↳ Click "Simulate Hailstorm"
  ↳ Show Immediate Hindi/English Alert Generation & Mock WhatsApp Notice

[1:20 - 2:10] The Claim Dossier & Audit PDF
  ↳ Land on /claims/1 Hero Page
  ↳ 3-Way Confidence Breakdown (Weather, Visual, Sensor)
  ↳ Live 72-Hour PMFBY Countdown & Estimated ₹27,000 - ₹51,000 Range
  ↳ Click "Download Evidence Dossier (PDF)" & View Insurer-Ready PDF

[2:10 - 3:00] Post-Harvest Market Realization & Organic Trust
  ↳ Navigate to /market
  ↳ Best Mandi Logistics Routing (Bilaspur vs Raipur vs Durg)
  ↳ Organic Evidence Score (70-80 Baseline vs Chemical Anomaly Deduction)
  ↳ Conclusion & Value Proposition
```

---

### Step-by-Step Script & Narration

#### Minute 0:00 – 0:40: Normal Field Baseline
1. **Action:** Open `http://localhost:3000` on the laptop or projector.
2. **Narration:**
   > *"Good morning, judges. This is FasalSakshi. Right now we are looking at farmer Ramesh Kumar’s 1.5-hectare tomato plot in Arang, Chhattisgarh. Every hour, in-situ soil probes and canopy cameras transmit moisture, temperature, EC, pH, and imagery. 
   > If we navigate to the Evidence tab, you see that every photo is linked via an SHA-256 hash chain with a green 'Chain Verified' status. It is impossible to alter or backdate any record without breaking the cryptographic head hash."*

#### Minute 0:40 – 1:20: Triggering Calamity & Bilingual Alert
1. **Action:** Navigate to `http://localhost:3000/simulate`.
2. **Narration:**
   > *"Under PMFBY, if a localized disaster like hailstorm strikes, the farmer has exactly 72 hours to report it. Let's trigger a severe Hailstorm event.
   > Immediately, the system ingests the microclimate shock—rainfall surges to 15mm, air temperature drops to 13°C, and gusts hit 78 km/h. 
   > Look at the alert panel: within seconds, Ramesh receives a bilingual SMS and WhatsApp notification in Hindi: 'किसान रमेश जी, आपके खेत में ओलावृष्टि के कारण नुकसान दर्ज हुआ है... 14447 पर सूचित करें।'"*

#### Minute 1:20 – 2:10: The Claim Dossier & PDF Dossier
1. **Action:** The simulation auto-navigates to `/claims/1` (or click on the claim card).
2. **Narration:**
   > *"This is our hero claim page. Notice three key elements:
   > First, the 72-hour statutory deadline with a live countdown so no claim lapses.
   > Second, our headline innovation: the Multi-Factor Confidence Score. Rather than trusting a photo alone, we blend 40% weather radar validation, 40% computer vision canopy loss (evaluated by our MobileNetV2 ML service), and 20% ground sensor corroboration to reach an overall 0.94 High-Confidence score.
   > Third, using the policy terms, we calculate the net claimable indemnity after deductibles: an estimated ₹27,000 to ₹51,000.
   > Now I click 'Download PDF Report'—instantly, our backend compiles an insurer-grade dossier complete with timestamps in UTC/IST, sensor telemetry curves, and the full hash-chain audit table."*

#### Minute 2:10 – 3:00: Post-Harvest Market Realization & Pathology Diagnostics
1. **Action:** Navigate to `http://localhost:3000/market`.
2. **Narration:**
   > *"FasalSakshi is built for prosperity, not just disaster. In normal seasons, farmers face mandi price opacity and exploitative middlemen.
   > Our market module compares regional mandis and factors in real road transport costs at ₹0.25 per quintal per kilometer. Even though Bilaspur is further away, its higher modal price yields the highest net profit after transport.
   > Finally, notice our Organic Evidence Score. By logging chemical-free inputs like neem spray and vermicompost, while monitoring soil EC for synthetic fertilizer dumping, Ramesh proves his crop's organic integrity and commands a 10% to 30% price premium.
   > In parallel, our ML microservice on port 8001 continuously scans leaf photos for early-stage pathology—instantly identifying Early Blight and Bacterial Spot before catastrophic crop loss occurs."*

---


### Fallback Checklist for Live Presentation
* **If internet drops:** All backend data, CSV prices, and fallback mock weather run completely locally on `localhost:8000` and `localhost:3000`. No external connection is strictly required.
* **If browser cache is stale:** Hard refresh `Ctrl + Shift + R` or toggle the Hindi/English language button in the header to demonstrate dynamic internationalization.
* **If judges ask to see code:** Point directly to `backend/app/hashchain.py` for the cryptographic SHA-256 verification and `backend/app/report.py` for the ReportLab PDF compilation engine.
