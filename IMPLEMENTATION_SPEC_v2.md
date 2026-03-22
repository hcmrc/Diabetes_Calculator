# Implementation Spec v2 — Wissenschaftliche Validierung

> Maschinenlesbare Anweisungsdatei für Code-Agenten. Basiert auf `validation_report_v4.md`.
> Prioritäten: **K** = Kritisch, **W** = Wichtig, **E** = Empfohlen.

---

## Entfallene Änderungen aus v1

| v1-ID | Grund |
|-------|-------|
| K1 (Sex-Variable) | Sex ist NICHT im Originalmodell — Table 1 enthält keinen Sex-Term |
| W7 (Cutoff 0.26) | Cutoff IST explizit publiziert (Schmidt et al., 2005, Table 1, S. 2016) |

---

## K1 — BP-Quellenangabe korrigieren

**Datei:** `js/config.js`

```
AKTUELL (Zeile 101): Sources: ADA (2024), ESC (2023), WHO, NCEP ATP III.
NEU:                  Sources: ADA (2025), ACC/AHA (2017), WHO, NCEP ATP III.

AKTUELL (Zeile 16-18):
 *   ADA (2024). Standards of Care in Diabetes. Diabetes Care, 47(Suppl 1).
 *   ESC (2023). Guidelines for the management of cardiovascular disease in
 *     patients with diabetes. European Heart Journal, 44(39), 4043-4140.
NEU:
 *   ADA (2025). Standards of Care in Diabetes—2025. Diabetes Care, 48(Suppl 1).
 *   ACC/AHA (2017). Guideline for Prevention, Detection, Evaluation, and
 *     Management of High Blood Pressure in Adults. Ann Intern Med, 168(5), 351-358.

AKTUELL (Zeile 126): /** Treatment recommendations per modifiable risk factor (ESC 2023). */
NEU:                  /** Treatment recommendations per modifiable risk factor (ADA 2025, ACC/AHA 2017, ESH 2023). */
```

**Quelle:** Carey & Whelton (2018). Die BP-Schwellenwerte (130/160) folgen ACC/AHA, nicht ESC.

---

## K2 — cholHDL.veryLow entfernen

**Datei:** `js/config.js`, Zeile 114

```
AKTUELL: cholHDL: { low: 1.03,      veryLow: 0.8 },
NEU:     cholHDL: { low: 1.03 },
```

**Prüfung vor Änderung:** `grep -r "veryLow" js/` — sicherstellen, dass kein Code darauf zugreift.
**Quelle:** Kein Leitliniennachweis für 0.8 mmol/L Schwellenwert gefunden.

---

## K3 — Waist-Slider HTML min korrigieren

**Datei:** `index.html`

```
AKTUELL (Z.315): <input type="range" id="waist-slider" min="25" max="60" value="36" step="1" class="slider">
NEU:              <input type="range" id="waist-slider" min="26" max="60" value="36" step="1" class="slider">

AKTUELL (Z.322): <span id="waist-min">25</span><span id="waist-mid">42</span>
NEU:              <span id="waist-min">26</span><span id="waist-mid">43</span>

AKTUELL (Z.324): <input type="number" id="waist-value" value="36" min="25" max="60"
NEU:              <input type="number" id="waist-value" value="36" min="26" max="60"
```

**Quelle:** CONFIG.RANGES.waist.us = [26, 60, 1]. HTML min muss konsistent sein.

---

## K4 — Triglyzerid-Kausalkette ergänzen

**Datei:** `js/ui-controller.js`, Zeile 476–481

```
AKTUELL (nach Zeile 481, vor dem ];):
        { factors: ['sbp'],     nodes: ['Blood Pressure ↑', 'Vascular Dysfunction', 'Endothelial Damage', 'Diabetes Risk ↑'] }

NEU (Komma ergänzen + neue Zeile):
        { factors: ['sbp'],     nodes: ['Blood Pressure ↑', 'Vascular Dysfunction', 'Endothelial Damage', 'Diabetes Risk ↑'] },
        { factors: ['cholTri'], nodes: ['Triglycerides ↑', 'Lipotoxicity & HDL ↓', 'Insulin Resistance ↑', 'Diabetes Risk ↑'] }
```

**Quelle:** Pandey &amp; Satyanarayana (2026). Erhöhte Triglyzeride → Lipotoxizität → Insulinresistenz als unabhängiger Diabetes-Pfad.

---

## W1 — Metformin-Text

**Datei:** `js/config.js`, Zeile 132

```
AKTUELL: { name: 'Standard Medication', desc: 'Metformin is often the first step to help control blood sugar levels.' },
NEU:     { name: 'Standard Medication', desc: 'Metformin may be considered for high-risk prediabetes (BMI ≥35, age <60, or prior gestational diabetes), always combined with lifestyle changes (ADA, 2025; Knowler et al., 2002).' },
```

---

## W2 — SGLT2i/GLP-1 RA

**Datei:** `js/config.js`, Zeile 133

```
AKTUELL: { name: 'Heart & Kidney Protection', desc: 'If you have heart or kidney concerns, ask your doctor about newer medications that specifically protect these organs (SGLT2 inhibitors or GLP-1) while also supporting weight loss.' }
NEU:     { name: 'Heart & Kidney Protection', desc: 'SGLT2 inhibitors may reduce new-onset diabetes risk in patients with prediabetes who also have heart failure or chronic kidney disease (Mori et al., 2022). GLP-1 receptor agonists show promising but not yet significant results for diabetes prevention. Discuss options with your physician.' }
```

---

## W3 — Chirurgie-Kriterien

**Datei:** `js/config.js`, Zeile 167

```
AKTUELL: surgicalOption: { name: 'Surgical Options', desc: 'For significant obesity with health problems, weight-loss surgery may be discussed.' }
NEU:     surgicalOption: { name: 'Surgical Options', desc: 'Metabolic surgery is an option for BMI ≥40, or BMI ≥35 with obesity-related comorbidities such as type 2 diabetes (ASMBS/IFSO guidelines).' }
```

---

## W4 — Icosapent Ethyl

**Datei:** `js/config.js`, Zeile 156

```
AKTUELL: { name: 'Prescription Fish Oil', desc: 'If blood fats (triglycerides) remain high, special prescription fish oil (icosapent ethyl) might be considered.' },
NEU:     { name: 'Prescription Fish Oil', desc: 'For statin-treated patients with elevated triglycerides (135–499 mg/dL) and established cardiovascular disease or diabetes, icosapent ethyl reduced cardiovascular events by 25% (REDUCE-IT: Bhatt et al., 2019).' },
```

---

## W5 — Statine vs. Fibrate

**Datei:** `js/config.js`, Zeile 157

```
AKTUELL: { name: 'Cholesterol Medication', desc: 'Cholesterol-lowering medication (Statins) is usually recommended to protect your blood vessels.' }
NEU:     { name: 'Cholesterol Medication', desc: 'Statins primarily lower LDL cholesterol with modest triglyceride reduction (10–20%). For significantly elevated triglycerides (>200 mg/dL), fibrates may be more effective.' }
```

---

## W6 — Simulations-Quellen

**Datei:** `js/config.js`, Zeilen 171–179

```
AKTUELL:
     * Sources:
     *   fastGlu: DPP/DPPOS (Aroda et al., 2017): -20 mg/dL (-1.1 mmol/L)
     *   sbp:     Wang et al. (2025, Lancet) + Canoy et al. (2022): ~-10 mmHg
     *   cholHDL: van Namen et al. (2019): +5 mg/dL (+0.13 mmol/L)
     *   cholTri: van Namen et al. (2019) + statins: -30 mg/dL (-0.34 mmol/L)
     *   waist:   Wong et al. (2025) + van Namen et al. (2019): -5 cm (-2 in)

NEU:
     * Clinically achievable targets (verified status):
     *   fastGlu: -20 mg/dL (-1.1 mmol/L) — DPP/DPPOS (Aroda et al., 2017) [VERIFIED]
     *   sbp:     ~-10 mmHg — lifestyle intervention meta-analyses [PLAUSIBLE; original citation unverified]
     *   cholHDL: +5 mg/dL (+0.13 mmol/L) — exercise meta-analyses, e.g. Chen et al. (2026): 4-6 mg/dL [PLAUSIBLE]
     *   cholTri: -30 mg/dL (-0.34 mmol/L) — statin therapy 10-20% reduction [PLAUSIBLE]
     *   waist:   -5 cm (-2 in) — GLP-1 RA data (Wu et al., 2026) [PARTIALLY VERIFIED]
     * NOTE: Wang et al. (2025), Canoy et al. (2022), van Namen et al. (2019) not retrievable via PubMed/Consensus.
```

---

## W7 — Grammatikfehler + Quellenangabe BP-Kombinationstherapie

**Datei:** `js/config.js`, Zeile 140

```
AKTUELL: { name: 'Combination Medications', desc: 'It is recommend to start with a combination of different blood pressure medications (e.g. RAS inhibitors and CCBs).' },
NEU:     { name: 'Combination Medications', desc: 'Current guidelines recommend starting with a combination of blood pressure medications such as a RAS inhibitor plus a calcium channel blocker (ESH, 2023).' },
```

---

## W8 — HDL-Kausalkette präzisieren

**Datei:** `js/ui-controller.js`, Zeile 478

```
AKTUELL: { factors: ['cholHDL'], nodes: ['HDL Cholesterol ↓', 'Lipid Metabolism ↓', 'Vascular Health ↓', 'Diabetes Risk ↑'] },
NEU:     { factors: ['cholHDL'], nodes: ['HDL Cholesterol ↓', 'Anti-inflammatory Capacity ↓', 'Vascular Inflammation ↑', 'Diabetes Risk ↑'] },
```

**Quelle:** Panchakshari et al. (2026). HDL-Verlust → pro-inflammatorischer Phänotyp → vaskuläre Inflammation.

---

## E1 — DASH-Diät benennen

**Datei:** `js/config.js`, Zeile 141

```
AKTUELL: { name: 'Heart-Healthy Diet', desc: 'Restriction of alcohol and sodium consumption, increased consumption of vegetables, use of low-fat dairy products can lower blood pressure naturally.' }
NEU:     { name: 'Heart-Healthy Diet (DASH)', desc: 'Following a DASH-style diet — reducing sodium and alcohol, increasing vegetables, fruits, and low-fat dairy — can lower systolic blood pressure by approximately 3–8 mmHg (Sun et al., 2025; Guo et al., 2021).' }
```

---

## E2 — GLP-1 RA Gewicht spezifizieren

**Datei:** `js/config.js`, Zeile 165

```
AKTUELL: { name: 'Medications', desc: 'Glucose-lowering drugs with additional weight-reducing effects (e.g. GLP-1RA) can also help.' }
NEU:     { name: 'Medications', desc: 'GLP-1 receptor agonists (e.g. semaglutide) can achieve weight loss of 5–15% in patients with obesity (BMI ≥30) or prediabetes with obesity (Alexander et al., 2026; Wu et al., 2026).' }
```

---

## E3 — Slider-Labels ausschreiben

**Datei:** `index.html`

```
AKTUELL (Z.300): <span style="flex:26">Pre-Diab.</span>
NEU:              <span style="flex:26">Prediabetes</span>

AKTUELL (Z.367): <span style="flex:19;...">Brdl.</span>
NEU:              <span style="flex:19;...">Borderline</span>
```

---

## E4 — Waist-Schwellenwerte dokumentieren

**Datei:** `js/config.js`, Zeilen 107–109 (Kommentar erweitern)

```
AKTUELL:
     * waist.elevated: IDF/WHO threshold for European men (94 cm). Not from
     *   Schmidt et al. (2005) which uses NCEP values (88 cm women, 102 cm men).
     *   waist.high (102 cm) matches the NCEP male threshold from the publication.
NEU:
     * waist.elevated: IDF/WHO threshold for European men (94 cm; women: 80 cm).
     *   Not from Schmidt et al. (2005) which uses NCEP values (88 cm women, 102 cm men).
     *   waist.high (102 cm) matches the NCEP male threshold from the publication.
     *   Female thresholds (IDF: 80 cm, NCEP: 88 cm) are not implemented because
     *   the model does not include sex as a variable (see Schmidt et al., 2005, Table 1).
```

---

## Betroffene Dateien

| Datei | Änderungen |
|-------|-----------|
| `js/config.js` | K1 (3 Stellen), K2, W1–W7, E1, E2, E4 |
| `js/ui-controller.js` | K4, W8 |
| `index.html` | K3 (3 Stellen), E3 (2 Stellen) |

## Post-Implementation Checks

1. `grep -r "veryLow" js/` — K2 Abhängigkeiten
2. `grep -r "ESC (2023)" js/` — K1 Vollständigkeit
3. Dashboard laden, alle Slider bewegen, Kausalketten-Tab prüfen (neue TG-Kette)
4. Treatment-Ansicht: alle Texte auf Korrektheit prüfen
5. Tests ausführen falls vorhanden (`tests/` Verzeichnis)
