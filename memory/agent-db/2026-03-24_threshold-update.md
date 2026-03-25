# Aktion: Klinische Schwellenwerte aktualisiert

## Dateien:
- `js/config.js` — THRESHOLDS komplett ueberarbeitet
- `index.html` — Slider-Segmente (flex-Werte) und Labels angepasst
- `tests/test-risk-model.js` — normalSI.sbp von 120 auf 115 (neuer Schwellenwert)
- `tests/test-risk-model-edge-cases.js` — Waist- und SBP-Boundary-Tests aktualisiert
- `memory/CODEBASE_MEMORY.md` — Testanzahl (551), Guideline-Quellen aktualisiert

## Aenderungen im Detail:

### CONFIG.THRESHOLDS (config.js)

| Faktor   | Alt                          | Neu                                   | Quelle          |
|----------|------------------------------|---------------------------------------|-----------------|
| fastGlu  | elevated: 5.6, high: 7.0    | elevated: 5.6, high: 6.9             | ADA 2024 (≥125 mg/dL) |
| sbp      | elevated: 130, high: 160    | elevated: 120, high: 130             | ACC/AHA 2017    |
| cholHDL  | low: 1.03, veryLow: 0.8     | low: 1.03, high: 1.55                | NCEP ATP III (<40 Low, >60 Good) |
| cholTri  | elevated: 1.7, high: 2.3    | elevated: 1.7, high: 2.3, veryHigh: 5.6 | NCEP ATP III |
| waist    | elevated: 94, high: 102     | elevated: 88, high: 102              | NCEP ATP III (♀>88, ♂>102) |

### HTML Slider-Segmente (index.html)

| Slider   | Alt (flex-Werte)             | Neu (flex-Werte)                      |
|----------|------------------------------|---------------------------------------|
| fastGlu  | safe:50, alert:26, danger:174 | safe:50, alert:25, danger:175        |
| waist    | safe:12, alert:3, danger:20  | safe:9, alert:6, danger:19           |
| sbp      | 4 Zonen (50,10,20,60)       | 3 Zonen: safe:40, alert:10, danger:90 |
| cholHDL  | danger:20, alert:19, safe:61 | danger:20, alert:21, safe:40          |
| cholTri  | 4 Segmente (100,53,47,250)  | 3 Segmente: safe:100, alert:50, warning:300 |

### Label-Aenderungen (index.html)
- SBP: "Normal / Elev. / Stg1 / Stage 2" → "Normal / Elevated / Hypertension"
- HDL: "Low / Brdl. / Normal" → "Low / Borderline / Good"
- Triglycerides: "Normal / Borderline / High" (3 statt 4 Labels)

## Learnings:
- sbp: 120 in Test-Baselines loest jetzt elevated aus (neuer Schwellenwert ≥120)
- `veryLow` bei cholHDL wurde durch `high` ersetzt (>60 mg/dL = >1.55 mmol/L)
- Waist: Kein Geschlecht im Modell → elevated nutzt weiblichen NCEP-Wert (88 cm)
- cholTri: `veryHigh` (5.6 mmol/L = 500 mg/dL) hinzugefuegt, aber Slider-Max ist 500 → kaum sichtbar
- Object.freeze() auf CONFIG → Aenderungen muessen VOR dem freeze in config.js erfolgen

## Risiken:
- Jeder Code der `T.cholHDL.veryLow` referenziert wird brechen (aktuell: keiner)
- SBP-Schwellenwert 120 statt 130 → mehr Patienten werden als "elevated" markiert
- Waist elevated 88 statt 94 → ebenfalls mehr Patienten als "elevated" markiert
- Falls neue Tests `T.sbp.high === 160` oder `T.waist.elevated === 94` pruefen, scheitern sie
