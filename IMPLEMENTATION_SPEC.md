# Implementation Spec — Wissenschaftliche Validierung

> **Zweck:** Maschinenlesbare Anweisungsdatei für einen Code-Agenten.
> Jede Änderung enthält: ID, Priorität, Datei, exakten aktuellen Code, exakten Zielcode und Begründung mit Quelle.
> **Basiert auf:** `validation_report_v3.md` (22.03.2026)

---

## Legende

| Priorität | Bedeutung |
|-----------|-----------|
| **K** (Kritisch) | Muss umgesetzt werden — wissenschaftliche Korrektheit betroffen |
| **W** (Wichtig) | Sollte umgesetzt werden — Evidenzqualität/Genauigkeit |
| **E** (Empfohlen) | Kann umgesetzt werden — Verbesserung der Klarheit |

---

## K1 — Geschlechtsvariable dokumentieren

**Datei:** `js/config.js`
**Zeilen:** 36–51 (BETAS-Block, Kommentar darüber)

### Aktuell (Zeile 36–39):
```javascript
    /**
     * Logistic-regression beta coefficients from Schmidt et al. (2005).
     * All continuous predictors use SI units internally.
     */
```

### Ziel:
```javascript
    /**
     * Logistic-regression beta coefficients from Schmidt et al. (2005).
     * All continuous predictors use SI units internally.
     *
     * NOTE: This is a sex-agnostic version of the original model.
     * Schmidt et al. (2005) included sex as a predictor variable.
     * This implementation omits sex and uses a recalibrated intercept
     * (sigma = -9.9808) to approximate the population-average prediction.
     * This simplification may reduce accuracy for sex-specific subgroups
     * (Bozorgmanesh et al., 2010, found differing optimal cutpoints by sex).
     */
```

### Begründung:
Bozorgmanesh et al. (2010) fanden in ihrer Validierung des ARIC-Modells deutlich unterschiedliche optimale Schwellenwerte für Männer (Sensitivität 71,6 %) und Frauen (Sensitivität 67,1 %). Die aktuelle Implementierung dokumentiert nicht, dass die Geschlechtsvariable fehlt.

---

## K2 — Blutdruck-Quellenangabe korrigieren

**Datei:** `js/config.js`
**Zeilen:** 99–101 (THRESHOLDS-Kommentar)

### Aktuell (Zeile 99–101):
```javascript
    /**
     * Clinical decision thresholds (SI units).
     * Sources: ADA (2024), ESC (2023), WHO, NCEP ATP III.
```

### Ziel:
```javascript
    /**
     * Clinical decision thresholds (SI units).
     * Sources: ADA (2025), ACC/AHA (2017), WHO, NCEP ATP III.
```

**Zusätzlich Datei:** `js/config.js`
**Zeile:** 126 (TREATMENTS-Kommentar)

### Aktuell (Zeile 126):
```javascript
    /** Treatment recommendations per modifiable risk factor (ESC 2023). */
```

### Ziel:
```javascript
    /** Treatment recommendations per modifiable risk factor (ADA 2025, ACC/AHA 2017, ESH 2023). */
```

**Zusätzlich Datei:** `js/config.js`
**Zeilen:** 15–18 (Datei-Header @references)

### Aktuell (Zeile 16–18):
```javascript
 *   ADA (2024). Standards of Care in Diabetes. Diabetes Care, 47(Suppl 1).
 *   ESC (2023). Guidelines for the management of cardiovascular disease in
 *     patients with diabetes. European Heart Journal, 44(39), 4043-4140.
```

### Ziel:
```javascript
 *   ADA (2025). Standards of Care in Diabetes—2025. Diabetes Care, 48(Suppl 1).
 *   ACC/AHA (2017). Guideline for Prevention, Detection, Evaluation, and
 *     Management of High Blood Pressure in Adults. JACC, 71(19), e127-e248.
 *   ESH (2023). Guidelines for the management of arterial hypertension.
 *     Journal of Hypertension, 41(12), 1874-2071.
```

### Begründung:
Die implementierten BP-Schwellenwerte (elevated: 130, high: 160) folgen der ACC/AHA 2017-Klassifikation (Whelton et al., 2018), nicht den ESC-Leitlinien. Die ESC/ESH definiert Hypertonie erst ab ≥140/90 mmHg. Das Zitieren von „ESC (2023)" für Werte, die ACC/AHA entsprechen, ist wissenschaftlich inkorrekt.

---

## K3 — cholHDL.veryLow entfernen oder begründen

**Datei:** `js/config.js`
**Zeile:** 114

### Aktuell:
```javascript
        cholHDL: { low: 1.03,      veryLow: 0.8 },
```

### Ziel:
```javascript
        cholHDL: { low: 1.03 },
```

### Begründung:
Der Wert `veryLow: 0.8` (ca. 31 mg/dL) konnte in keiner klinischen Leitlinie identifiziert werden (weder NCEP ATP III, ADA, ESC noch IDF definieren einen „very low" HDL-Schwellenwert). Da dieser Wert nirgends im UI referenziert wird (keine Slider-Segmentierung nutzt ihn), kann er ohne funktionale Auswirkung entfernt werden.

**Prüfung erforderlich:** Vor Entfernung grep nach `veryLow` in allen JS-Dateien, um sicherzustellen, dass kein Code darauf zugreift.

---

## K4 — Waist-Slider HTML min-Wert korrigieren

**Datei:** `index.html`
**Zeile:** 315

### Aktuell:
```html
                    <input type="range" id="waist-slider" min="25" max="60" value="36" step="1" class="slider">
```

### Ziel:
```html
                    <input type="range" id="waist-slider" min="26" max="60" value="36" step="1" class="slider">
```

**Zusätzlich Zeile 322:**

### Aktuell:
```html
                <div class="slider-labels slider-labels-numeric"><span id="waist-min">25</span><span id="waist-mid">42</span><span id="waist-max">60</span></div>
```

### Ziel:
```html
                <div class="slider-labels slider-labels-numeric"><span id="waist-min">26</span><span id="waist-mid">43</span><span id="waist-max">60</span></div>
```

**Zusätzlich Zeile 324:**

### Aktuell:
```html
                    <input type="number" id="waist-value" value="36" min="25" max="60" step="1" class="value-input">
```

### Ziel:
```html
                    <input type="number" id="waist-value" value="36" min="26" max="60" step="1" class="value-input">
```

### Begründung:
`CONFIG.RANGES.waist.us` definiert `[26, 60, 1]` (Zeile 80, config.js). Der HTML-Slider erlaubt min="25", was einen inkonsistenten Wert von 25 Inches (63,5 cm) zulässt — unterhalb des SI-Minimums von 64 cm.

---

## K5 — Triglyzerid-Kausalkette ergänzen

**Datei:** `js/ui-controller.js`
**Zeilen:** 476–481 (CAUSALITY_CHAINS Array)

### Aktuell:
```javascript
    const CAUSALITY_CHAINS = [
        { factors: ['waist'],   nodes: ['Waist', 'Insulin Resistance ↑', 'Blood Sugar ↑', 'Diabetes Risk ↑'] },
        { factors: ['cholHDL'], nodes: ['HDL Cholesterol ↓', 'Lipid Metabolism ↓', 'Vascular Health ↓', 'Diabetes Risk ↑'] },
        { factors: ['fastGlu'], nodes: ['Fasting Glucose ↑', 'Pancreatic Beta Cell Stress', 'Insulin Secretion ↓', 'Diabetes Risk ↑'] },
        { factors: ['sbp'],     nodes: ['Blood Pressure ↑', 'Vascular Dysfunction', 'Endothelial Damage', 'Diabetes Risk ↑'] }
    ];
```

### Ziel:
```javascript
    const CAUSALITY_CHAINS = [
        { factors: ['waist'],   nodes: ['Waist', 'Insulin Resistance ↑', 'Blood Sugar ↑', 'Diabetes Risk ↑'] },
        { factors: ['cholHDL'], nodes: ['HDL Cholesterol ↓', 'Lipid Metabolism ↓', 'Vascular Health ↓', 'Diabetes Risk ↑'] },
        { factors: ['fastGlu'], nodes: ['Fasting Glucose ↑', 'Pancreatic Beta Cell Stress', 'Insulin Secretion ↓', 'Diabetes Risk ↑'] },
        { factors: ['sbp'],     nodes: ['Blood Pressure ↑', 'Vascular Dysfunction', 'Endothelial Damage', 'Diabetes Risk ↑'] },
        { factors: ['cholTri'], nodes: ['Triglycerides ↑', 'Lipotoxicity & HDL ↓', 'Insulin Resistance ↑', 'Diabetes Risk ↑'] }
    ];
```

### Begründung:
Triglyzeride (cholTri) sind ein modifizierbarer Risikofaktor im Modell mit eigenem Behandlungsblock, aber es fehlt die zugehörige Kausalkette. Der Mechanismus ist gut belegt: Erhöhte Triglyzeride → hepatische VLDL-Überproduktion → Lipotoxizität in Muskel und Leber → Insulinresistenz (Consensus 2025: „Triglycerides, Glucose Metabolism, and Type 2 Diabetes").

---

## W1 — Metformin-Beschreibung präzisieren

**Datei:** `js/config.js`
**Zeile:** 132

### Aktuell:
```javascript
                { name: 'Standard Medication', desc: 'Metformin is often the first step to help control blood sugar levels.' },
```

### Ziel:
```javascript
                { name: 'Standard Medication', desc: 'Metformin may be considered for high-risk prediabetes (BMI ≥35, age <60, prior gestational diabetes, or fasting glucose ≥110 mg/dL), always combined with lifestyle changes (ADA, 2025).' },
```

### Begründung:
Die ADA Standards of Care 2025 empfehlen Metformin nur für Hochrisiko-Prädiabetiker mit spezifischen Kriterien. Die aktuelle Formulierung suggeriert eine Routineindikation, die nicht leitlinienkonform ist (Aroda et al., 2017; ADA, 2025).

---

## W2 — SGLT2i/GLP-1 Indikation qualifizieren

**Datei:** `js/config.js`
**Zeile:** 133

### Aktuell:
```javascript
                { name: 'Heart & Kidney Protection', desc: 'If you have heart or kidney concerns, ask your doctor about newer medications that specifically protect these organs (SGLT2 inhibitors or GLP-1) while also supporting weight loss.' }
```

### Ziel:
```javascript
                { name: 'Heart & Kidney Protection', desc: 'For patients with established type 2 diabetes, SGLT2 inhibitors and GLP-1 receptor agonists provide proven heart and kidney protection. In the prediabetes setting, these are primarily under investigation — discuss with your physician (Lincoff et al., 2023).' }
```

### Begründung:
Die Evidenz für SGLT2i und GLP-1 RA ist robust für manifesten T2D (SELECT Trial: Lincoff et al., 2023; EMPA-KIDNEY, 2023), aber es fehlen formale Präventionsstudien im Prädiabetes-Setting. Die aktuelle Formulierung impliziert eine Indikation, die für Prädiabetiker nicht leitliniengestützt ist.

---

## W3 — Metabolische Chirurgie mit Kriterien

**Datei:** `js/config.js`
**Zeile:** 167

### Aktuell:
```javascript
            surgicalOption: { name: 'Surgical Options', desc: 'For significant obesity with health problems, weight-loss surgery may be discussed.' }
```

### Ziel:
```javascript
            surgicalOption: { name: 'Surgical Options', desc: 'Metabolic surgery is recommended for BMI ≥35 (≥27.5 for Asian populations) and should be considered for BMI 30–34.9 with type 2 diabetes or significant obesity-related comorbidities (ASMBS/IFSO, 2022).' }
```

### Begründung:
ASMBS 2022-Leitlinien (Rubino et al., 2022) definieren klare BMI-basierte Indikationen. Die aktuelle Formulierung verwendet kein klinisches Kriterium und ist zu vage für ein evidenzbasiertes Werkzeug.

---

## W4 — Icosapent Ethyl Indikation einschränken

**Datei:** `js/config.js`
**Zeile:** 156

### Aktuell:
```javascript
                { name: 'Prescription Fish Oil', desc: 'If blood fats (triglycerides) remain high, special prescription fish oil (icosapent ethyl) might be considered.' },
```

### Ziel:
```javascript
                { name: 'Prescription Fish Oil', desc: 'For statin-treated patients with persistently elevated triglycerides (≥150 mg/dL) and established cardiovascular risk, icosapent ethyl may reduce cardiovascular events (REDUCE-IT: Bhatt et al., 2019).' },
```

### Begründung:
REDUCE-IT (Bhatt et al., 2019) bezieht sich auf Patienten mit etablierter CVD und hohem CV-Risiko unter Statintherapie. Die aktuelle Formulierung ist zu breit und suggeriert eine generelle Indikation bei erhöhten Triglyzeriden.

---

## W5 — Statine vs. Fibrate differenzieren

**Datei:** `js/config.js`
**Zeile:** 157

### Aktuell:
```javascript
                { name: 'Cholesterol Medication', desc: 'Cholesterol-lowering medication (Statins) is usually recommended to protect your blood vessels.' }
```

### Ziel:
```javascript
                { name: 'Cholesterol Medication', desc: 'Statins primarily lower LDL cholesterol and modestly reduce triglycerides (10–30%). For significantly elevated triglycerides (>200 mg/dL), additional agents such as fibrates may be considered.' }
```

### Begründung:
Statine senken primär LDL-Cholesterin. Für isolierte schwere Hypertriglyzeridämie sind Fibrate wirksamer. Die aktuelle Formulierung differenziert nicht und suggeriert Statine als universelle Therapie für Triglyzeridprobleme.

---

## W6 — Simulations-Quellenkommentar korrigieren

**Datei:** `js/config.js`
**Zeilen:** 171–179 (SIMULATION_EFFECTS-Kommentar)

### Aktuell:
```javascript
    /**
     * Evidence-based treatment simulation deltas (both unit systems).
     *
     * Sources:
     *   fastGlu: DPP/DPPOS (Aroda et al., 2017): -20 mg/dL (-1.1 mmol/L)
     *   sbp:     Wang et al. (2025, Lancet) + Canoy et al. (2022): ~-10 mmHg
     *   cholHDL: van Namen et al. (2019): +5 mg/dL (+0.13 mmol/L)
     *   cholTri: van Namen et al. (2019) + statins: -30 mg/dL (-0.34 mmol/L)
     *   waist:   Wong et al. (2025) + van Namen et al. (2019): -5 cm (-2 in)
     */
```

### Ziel:
```javascript
    /**
     * Treatment simulation deltas — clinically achievable targets (both unit systems).
     *
     * Sources (verified status):
     *   fastGlu: DPP/DPPOS (Aroda et al., 2017): -20 mg/dL (-1.1 mmol/L) [VERIFIED]
     *   sbp:     Lifestyle intervention meta-analyses: ~-10 mmHg [PLAUSIBLE, original citation unverified]
     *   cholHDL: Aerobic exercise meta-analyses: +5 mg/dL (+0.13 mmol/L) [PLAUSIBLE, original citation unverified]
     *   cholTri: Statin therapy (10-30% reduction): -30 mg/dL (-0.34 mmol/L) [PLAUSIBLE, original citation unverified]
     *   waist:   Wong et al. (2025, Diabetes Care) GLP-1 RA data: -5 cm (-2 in) [PARTIALLY VERIFIED]
     *
     * NOTE: Wang et al. (2025), Canoy et al. (2022), and van Namen et al. (2019) could not be
     * retrieved via PubMed/Consensus search. Values are clinically plausible but original sources
     * require manual verification. See validation_report_v3.md §4.10 for details.
     */
```

### Begründung:
Die Quellen Wang et al. (2025), Canoy et al. (2022) und van Namen et al. (2019) konnten über PubMed und Consensus nicht verifiziert werden. Die Werte selbst sind klinisch plausibel, aber die Quellenangaben müssen als unbestätigt markiert werden.

---

## W7 — High-Risk-Cutoff Dokumentation korrigieren

**Datei:** `js/config.js`
**Zeilen:** 119–124

### Aktuell:
```javascript
    /**
     * Published high-risk probability cut-off from Schmidt et al. (2005).
     * Patients with Pr(DM) >= 0.26 are classified as high-risk.
     * At this threshold: ~20% of population identified, sensitivity 52%, specificity 86%.
     */
    HIGH_RISK_CUTOFF: 0.26,
```

### Ziel:
```javascript
    /**
     * High-risk probability cut-off derived from the ARIC risk distribution.
     * Schmidt et al. (2005) report risk quintiles but do not explicitly recommend
     * a single cut-off. The 0.26 threshold identifies the top ~20% of the
     * population as high-risk (sensitivity ~52%, specificity ~86%) and represents
     * a clinically reasonable trade-off between detection and false-positive rate.
     */
    HIGH_RISK_CUTOFF: 0.26,
```

### Begründung:
Die Bezeichnung „Published high-risk probability cut-off" ist irreführend. Das Originalpaper von Schmidt et al. (2005) berichtet Cutoffs über Quintile, nennt jedoch keinen spezifischen empfohlenen Schwellenwert von 0,26. Die Literaturrecherche fand keine explizite Validierung dieses Cutoffs.

---

## W8 — Grammatikfehler „It is recommend"

**Datei:** `js/config.js`
**Zeile:** 140

### Aktuell:
```javascript
                { name: 'Combination Medications', desc: 'It is recommend to start with a combination of different blood pressure medications (e.g. RAS inhibitors and CCBs).' },
```

### Ziel:
```javascript
                { name: 'Combination Medications', desc: 'Current guidelines recommend starting with a combination of blood pressure medications such as a RAS inhibitor plus a calcium channel blocker (ESH, 2023; Coca et al., 2024).' },
```

### Begründung:
Grammatikfehler korrigiert und Quelle ergänzt. Coca et al. (2024) bestätigten die ESH 2023-Empfehlung einer RAS+CCB Zwei-Substanz-Kombinationstherapie als bevorzugte First-Line-Option.

---

## E1 — HDL-Kausalkette präzisieren

**Datei:** `js/ui-controller.js`
**Zeile:** 478

### Aktuell:
```javascript
        { factors: ['cholHDL'], nodes: ['HDL Cholesterol ↓', 'Lipid Metabolism ↓', 'Vascular Health ↓', 'Diabetes Risk ↑'] },
```

### Ziel:
```javascript
        { factors: ['cholHDL'], nodes: ['HDL Cholesterol ↓', 'Anti-inflammatory Capacity ↓', 'Vascular Inflammation ↑', 'Diabetes Risk ↑'] },
```

### Begründung:
Moissl-Blanke et al. (2025) zeigten, dass der primäre Mechanismus bei niedrigem HDL der Verlust der anti-inflammatorischen und antioxidativen Kapazität ist, der zu einem pro-inflammatorischen Phänotyp führt. „Lipid Metabolism ↓" ist unspezifisch; der entzündliche Mechanismus ist präziser und wissenschaftlich korrekt.

---

## E2 — Slider-Labels ausschreiben

**Datei:** `index.html`
**Zeile:** 300

### Aktuell:
```html
                <div class="slider-labels"><span style="flex:50">Normal</span><span style="flex:26">Pre-Diab.</span><span style="flex:174">Diabetes</span></div>
```

### Ziel:
```html
                <div class="slider-labels"><span style="flex:50">Normal</span><span style="flex:26">Prediabetes</span><span style="flex:174">Diabetes</span></div>
```

**Zusätzlich Zeile 367:**

### Aktuell:
```html
                <div class="slider-labels"><span style="flex:20">Low</span><span style="flex:19;text-align:left;padding-left:2px">Brdl.</span><span style="flex:61">Normal</span></div>
```

### Ziel:
```html
                <div class="slider-labels"><span style="flex:20">Low</span><span style="flex:19;text-align:left;padding-left:2px">Borderline</span><span style="flex:61">Normal</span></div>
```

### Begründung:
Abkürzungen „Pre-Diab." und „Brdl." sind potenziell verwirrend für Patienten mit eingeschränkter Health Literacy. Ausgeschriebene Begriffe verbessern die Verständlichkeit.

---

## E3 — DASH-Diät explizit benennen

**Datei:** `js/config.js`
**Zeile:** 141

### Aktuell:
```javascript
                { name: 'Heart-Healthy Diet', desc: 'Restriction of alcohol and sodium consumption, increased consumption of vegetables, use of low-fat dairy products can lower blood pressure naturally.' }
```

### Ziel:
```javascript
                { name: 'Heart-Healthy Diet (DASH)', desc: 'Following a DASH-style diet — reducing sodium and alcohol, increasing vegetables, fruits, and low-fat dairy products — can lower blood pressure by 8–14 mmHg.' }
```

### Begründung:
Die DASH-Diät ist der standardisierte Terminus für diese Ernährungsempfehlung und erhöht die klinische Legitimität. Der Wert von 8–14 mmHg Blutdrucksenkung ist gut durch die originale DASH-Studie belegt.

---

## E4 — GLP-1 RA Indikation bei Gewichtsmanagement spezifizieren

**Datei:** `js/config.js`
**Zeile:** 165

### Aktuell:
```javascript
                { name: 'Medications', desc: 'Glucose-lowering drugs with additional weight-reducing effects (e.g. GLP-1RA) can also help.' }
```

### Ziel:
```javascript
                { name: 'Medications', desc: 'For obesity (BMI ≥30) or prediabetes with obesity, GLP-1 receptor agonists can support weight loss of 5–15% (Wong et al., 2025).' }
```

### Begründung:
Wong et al. (2025) zeigten in einer Metaanalyse von 47 RCTs Gewichtsreduktionen von 5–15 % unter GLP-1 RA. Die Indikation gilt primär für Adipositas (BMI ≥ 30), nicht für alle Patienten mit erhöhtem Taillenumfang.

---

## E5 — Waist-Schwellenwerte als geschlechtsspezifisch dokumentieren

**Datei:** `js/config.js`
**Zeilen:** 107–109 (bestehender THRESHOLDS-Kommentar erweitern)

### Aktuell:
```javascript
     * waist.elevated: IDF/WHO threshold for European men (94 cm). Not from
     *   Schmidt et al. (2005) which uses NCEP values (88 cm women, 102 cm men).
     *   waist.high (102 cm) matches the NCEP male threshold from the publication.
```

### Ziel:
```javascript
     * waist.elevated: IDF/WHO threshold for European men (94 cm; women: 80 cm).
     *   Not from Schmidt et al. (2005) which uses NCEP values (88 cm women, 102 cm men).
     *   waist.high (102 cm) matches the NCEP male threshold from the publication.
     *   Female thresholds (IDF: 80 cm, NCEP: 88 cm) are not implemented because
     *   sex is not a variable in this model version (see BETAS comment above).
```

### Begründung:
Vollständige Dokumentation der geschlechtsspezifischen Schwellenwerte, die bewusst nicht implementiert wurden. Verbessert die Nachvollziehbarkeit der Design-Entscheidung im Kontext der geschlechtsagnostischen Modellierung.

---

## E6 — Slider-Segmente aus Config dynamisch generieren

**Hinweis:** Dies ist ein größeres Refactoring und wird hier nur als Empfehlung dokumentiert.

**Betrifft:** `index.html` Zeilen 294–299 (fastGlu), 316–319 (waist), 338–343 (sbp), 361–364 (cholHDL), 384–388 (cholTri)

### Problem:
Die farbigen Slider-Segmente sind in HTML hardcoded mit `flex`-Werten, die manuell aus den Schwellenwerten berechnet wurden. Bei Änderung eines Schwellenwerts in `CONFIG.THRESHOLDS` müssten die HTML-flex-Werte manuell nachgezogen werden.

### Empfehlung:
Ein `renderSliderSegments(field)` Funktion in `ui-controller.js` erstellen, die die Segmentbreiten dynamisch aus `CONFIG.THRESHOLDS` und `CONFIG.RANGES` berechnet und die HTML-Segmente per JavaScript generiert. Dies stellt sicher, dass Konfigurationsänderungen automatisch in der UI reflektiert werden.

**Priorität:** Niedrig — nur relevant wenn Schwellenwerte häufig geändert werden.

---

## Zusammenfassung: Reihenfolge der Umsetzung

### Phase 1: Kritische Änderungen (K1–K5)
| ID | Datei | Art | Risiko |
|----|-------|-----|--------|
| K1 | config.js | Kommentar ergänzen | Kein |
| K2 | config.js | Kommentare ändern (3 Stellen) | Kein |
| K3 | config.js | Property entfernen | Niedrig — vorher grep nach `veryLow` |
| K4 | index.html | HTML-Attribute ändern (3 Stellen) | Niedrig |
| K5 | ui-controller.js | Array-Element ergänzen | Kein |

### Phase 2: Wichtige Änderungen (W1–W8)
| ID | Datei | Art | Risiko |
|----|-------|-----|--------|
| W1 | config.js | String ersetzen | Kein |
| W2 | config.js | String ersetzen | Kein |
| W3 | config.js | String ersetzen | Kein |
| W4 | config.js | String ersetzen | Kein |
| W5 | config.js | String ersetzen | Kein |
| W6 | config.js | Kommentar ersetzen | Kein |
| W7 | config.js | Kommentar ersetzen | Kein |
| W8 | config.js | String ersetzen | Kein |

### Phase 3: Empfohlene Verbesserungen (E1–E6)
| ID | Datei | Art | Risiko |
|----|-------|-----|--------|
| E1 | ui-controller.js | Array-Werte ändern | Kein |
| E2 | index.html | Labels ändern (2 Stellen) | Kein |
| E3 | config.js | String ersetzen | Kein |
| E4 | config.js | String ersetzen | Kein |
| E5 | config.js | Kommentar erweitern | Kein |
| E6 | ui-controller.js + index.html | Refactoring | Mittel |

### Betroffene Dateien (Gesamtübersicht):
- `js/config.js` — 15 Änderungen (K1, K2×3, K3, W1–W8, E3–E5)
- `js/ui-controller.js` — 2 Änderungen (K5, E1)
- `index.html` — 5 Änderungen (K4×3, E2×2)

### Post-Implementation-Checks:
1. `grep -r "veryLow" js/` — Sicherstellen, dass K3 keine Abhängigkeiten bricht
2. `grep -r "ESC (2023)" js/` — Sicherstellen, dass K2 alle Vorkommen abdeckt
3. Manueller Funktionstest: Dashboard laden, alle Slider bewegen, Treatment-Ansicht prüfen
4. Kausalketten-Tab öffnen: Neue Triglyzerid-Kette muss angezeigt werden
5. Existing Tests ausführen falls vorhanden: `tests/` Verzeichnis prüfen
