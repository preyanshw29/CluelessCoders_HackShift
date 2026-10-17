# FasalSakshi: Pitch Outline & Slide Deck Guide (HackShift)

**One Line Pitch:** An autonomous field unit and intelligence layer that continuously monitors crop health, creates a tamper-proof cryptographic evidence chain, and automates PMFBY insurance claims while unlocking premium market realization for farmers.

---

### Slide 1: Title & The Human Problem
* **Headline:** Protecting the Indian Farmer from Delayed Relief and Market Asymmetry
* **Key Visual:** Farmer standing in a hail-damaged tomato field holding an insurance policy paper vs. the 72-hour ticking clock.
* **Core Talking Points:**
  * In Indian agriculture, a single localized disaster (hail, sudden cloudburst) wipes out a season's investment.
  * Pradhan Mantri Fasal Bima Yojana (PMFBY) mandates localized disaster claims be filed within **72 hours** with evidence.
  * Today, manual surveyor visits take 30 to 90 days; disputes are rampant, and claim settlements are delayed by months.
* **Speaker Notes (~40 words):**
  *"Agriculture remains India's economic backbone, yet localized disasters leave farmers vulnerable. Under PMFBY, farmers must report localized calamity within 72 hours with proof. Manual surveyor visits take months, leading to rejected claims, disputes, and severe debt."*

---

### Slide 2: The Solution: FasalSakshi
* **Headline:** An Immutable Crop Witness & Autonomous Evidence Engine
* **Key Visual:** Daily field snapshots linked to microclimate telemetry $\to$ cryptographic audit chain $\to$ 1-click insurance claim dossier.
* **Core Talking Points:**
  * Low-cost edge sensor unit + optical camera placed in the field.
  * Every daily reading and photo is cryptographically hashed into an unalterable SHA-256 evidence chain.
  * Automated loss calculation, multi-factor confidence scoring, and statutory 72h filing countdown.
* **Speaker Notes (~40 words):**
  *"FasalSakshi acts as an unalterable digital witness for every acre. By combining in-situ sensors and optical imaging with cryptographic hash chaining, we turn ambient farm data into undeniable, audit-ready insurance claim dossiers before the 72-hour deadline expires."*

---

### Slide 3: How It Works: The 3-Tier Architecture
* **Headline:** From Field Sensors to Insurer Admissibility
* **Key Visual:** Architecture flow diagram (Telemetry & Camera $\to$ FastAPI Backend & Evidence Vault $\to$ ML Loss Classifier $\to$ Next.js 14 Farmer App).
* **Core Talking Points:**
  * **IoT Telemetry:** Soil moisture, air temperature, soil temperature, humidity, rainfall, EC, and pH.
  * **Cryptographic Vault:** Image byte hash + geolocation + timestamp linked to the preceding block hash.
  * **Policy Engine:** Evaluates PMFBY peril criteria (individual localized vs. area-based) and calculates deductible-adjusted indemnity bounds.
* **Speaker Notes (~40 words):**
  *"Our architecture links field sensors and camera captures directly into an SHA-256 hash chain. If an anomaly or extreme event occurs, our policy engine calculates the exact PMFBY indemnity range and prepares a legally admissible PDF claim dossier."*

---

### Slide 4: Headline Innovation: Multi-Source Confidence Score
* **Headline:** Eliminating Moral Hazard with 3-Way Corroboration
* **Key Visual:** Radial or 3-bar confidence breakdown: Weather (40%) + Visual Canopy Loss (40%) + Sensor Telemetry (20%).
* **Core Talking Points:**
  * Fraud and camera tampering are major insurer objections to automated claims.
  * We solve this by cross-verifying three independent layers:
    1. **Atmospheric Evidence:** Open-Meteo satellite & weather radar (gusts, rainfall).
    2. **Optical Vegetation Loss:** Before/after computer vision canopy loss % and SSIM.
    3. **Subsurface Ground Truth:** In-situ soil moisture, temperature, and EC changes.
* **Speaker Notes (~40 words):**
  *"Insurers reject remote claims because photos can be forged or backdated. FasalSakshi solves moral hazard with three-way corroboration: Open-Meteo weather validation, computer vision canopy comparison, and ground soil sensors. All three must align to yield a High-confidence settlement."*

---

### Slide 5: Live Demonstration
* **Headline:** 3-Minute Real-Time Scenario Walkthrough
* **Key Visual:** Screen split between Field Dashboard and WhatsApp Mobile Notification.
* **Core Demo Flow:**
  * **0:00 - 0:45:** Normal field monitoring, live telemetry graphs, and verified cryptographic hash chain.
  * **0:45 - 1:30:** Trigger Hailstorm simulation $\to$ instant bilingual Hindi/English WhatsApp alert.
  * **1:30 - 2:15:** Hero Claim Dossier with 72h countdown, estimated ₹27,000–₹51,000 payout range, and downloadable PDF.
  * **2:15 - 3:00:** Market realization routing and organic input log tracking.
* **Speaker Notes (~40 words):**
  *"In our live demo, we simulate a severe hailstorm. Watch our system instantly detect the spike, send a bilingual Hindi WhatsApp alert, verify the cryptographic hash chain, and generate an insurer-grade PDF dossier with a 72-hour filing countdown."*

---

### Slide 6: Beyond Insurance: Market Realization & Organic Trust
* **Headline:** Boosting Farm Profitability in Good Harvest Seasons
* **Key Visual:** Mandi comparison table factoring in transport logistics vs. Organic Evidence Score gauge.
* **Core Talking Points:**
  * **Optimal Mandi Routing:** Net price = Modal price minus road transport cost (₹0.25/qtl/km) across 8 regional mandis.
  * **Organic Evidence Score (0–100):** Log completeness + photo continuity + EC anomaly-free tracking.
  * Provides verifiable proof of chemical-free cultivation to help farmers negotiate 10–30% buyer price premiums.
* **Speaker Notes (~40 words):**
  *"FasalSakshi creates value during healthy seasons too. Our market module calculates net crop realization across nearby mandis after deducting transport costs, while our chemical-free input log produces an Organic Evidence Score to earn farmers a premium price."*

---

### Slide 7: Honest Scope: What is Built vs. Simulated vs. Roadmap
* **Headline:** Transparent Engineering & Clear Hackathon Boundaries
* **Key Visual:** Comparison matrix showing Built vs. Simulated vs. Roadmap.
* **Core Talking Points:**
  * **Built (Real):** Next.js frontend, FastAPI backend, SHA-256 hash chain, PMFBY policy engine, Open-Meteo weather engine, PDF generator, bilingual alerts, mandi optimizer.
  * **Simulated (Labelled):** Sensor feeds (Python telemetry streamer CLI), mock weather profiles for repeatable demos.
  * **Roadmap (Designed, Not Built):** Physical ruggedized field unit housing.
* **Speaker Notes (~40 words):**
  *"We believe in complete engineering honesty. Our software intelligence, cryptographic verification, claim calculations, and market routing are 100% built. For this hackathon demo, sensor feeds are simulated using realistic agronomic profiles, and hardware is our clear roadmap step."*

---

### Slide 8: Hardware Roadmap: The Field Unit
* **Headline:** Off-the-Shelf Modular Agronomic Hardware
* **Key Visual:** Schematic diagram of solar-powered pole unit with 6 sensors and optical camera module.
* **Hardware BOM (Target Unit Cost < ₹8,500 / $100):**
  * Wide-angle 5MP RGB camera with fixed focal mount.
  * Capacitive soil moisture & temperature probe.
  * Soil Electrical Conductivity (EC) & pH sensor.
  * Tipping bucket digital rain gauge.
  * ESP32-S3 microcontroller with 4G/LTE Cat-M1 cellular fallback.
  * 10W solar panel with LiFePO4 battery pack.
* **Speaker Notes (~40 words):**
  *"Why did we not bring physical hardware today? Because the sensors are off-the-shelf and commoditized. The defensible value lies in our software, evidence logic, and claim engine. Our production field unit is designed to cost under ₹8,500."*

---

### Slide 9: Business Model & Go-To-Market
* **Headline:** B2B2C Partnerships with Insurers, FPOs, and Agrilenders
* **Key Visual:** Tripartite value exchange between Farmer, FPO (Farmer Producer Org), and General Insurance Companies.
* **Revenue Streams:**
  1. **Insurance Company Subscriptions:** Underwriting audit verification fee per processed claim (reduces surveyor overhead by 60%).
  2. **FPO / Cooperative Hardware-as-a-Service:** ₹300/month subscription per unit covering telemetry, alerts, and market linkages.
  3. **Bank / Agri-Lending Risk Score API:** Real-time crop health telemetry for crop loan underwriting.
* **Speaker Notes (~40 words):**
  *"Our business model aligns incentives across the ecosystem. Insurers pay per verified claim to slash survey expenses and moral hazard. FPOs subscribe to our hardware-as-a-service to maximize harvest sales, while agri-lenders utilize our data for lower-risk credit."*

---

### Slide 10: Vision & The Ask
* **Headline:** Restoring Trust and Financial Resilience to Indian Farming
* **Key Visual:** FasalSakshi dashboard overview with tagline: *"Crop Proof. Fair Price. Zero Delay."*
* **The Ask:**
  * Incubator support and agricultural university field test plots in Raipur / Chhattisgarh.
  * Pilot partnership with PMFBY implementing insurers (e.g., AIC, HDFC ERGO Agri).
  * Mentor guidance on NPOP organic verification and PGS-India standard alignment.
* **Speaker Notes (~40 words):**
  *"FasalSakshi replaces subjective paperwork with cryptographic proof. We ensure no farmer misses their 72-hour relief window and every harvest gets its true market worth. We are seeking agricultural pilot partners and university test plots to take FasalSakshi to the field."*
