# Code Review Report 3 — Diabetes Risk Calculator

> Datum: 21. März 2026
> Anlass: Review nach umfangreichen Änderungen in Reviews 1 & 2 (Konvertierungslogik, TreatmentSimulator-Fix, UI-Refactoring)
> Reviewer: 3 spezialisierte Agents parallel (Wissenschaft · Code-Qualität · Tests)
> Vorgängerbericht: `REVIEW_REPORT_2.md`

---

## Testergebnis (Endstand nach allen Fixes)

| Datei | Tests | Status |
|-------|-------|--------|
| test-risk-model.js | 64 | ✅ 64/64 |
| test-risk-model-edge-cases.js | 83 | ✅ 83/83 |
| test-patient-manager.js | 45 | ✅ 45/45 |
| test-timeline-chart.js | 38 | ✅ 38/38 |
| test-treatment-simulator.js | 37 | ✅ 37/37 |
| test-ui-controller.js | 63 | ✅ 63/63 |
| test-comparison.js | 55 | ✅ 55/55 |
| test-radar-chart.js | 92 | ✅ 92/92 |
| test-ui-helpers.js | 9 | ✅ 9/9 |
| **Gesamt** | **486** | **✅ 486/486** |

---

## 1. Wissenschaftliche Korrektheit (Agent 1: Schmidt et al. 2005)

### Gesamtbewertung: ✅ Modell vollständig korrekt — keine Mängel

Manuelle Überprüfung aller Koeffizienten, Populationsmittelwerte und der logistischen Funktion gegen die Originalpublikation:

| Variable / Element | Publikation | Code | Status |
|---|---|---|---|
| Intercept σ | −9.9808 | −9.9808 | ✅ |
| β Alter | 0.0173 | 0.0173 | ✅ |
| β Ethnizität (AA) | 0.4433 | 0.4433 | ✅ |
| β Familienanamnese | 0.4981 | 0.4981 | ✅ |
| β Nüchternglukose | 1.5849 | 1.5849 | ✅ |
| β SBP | 0.0111 | 0.0111 | ✅ |
| β Taille | 0.0273 | 0.0273 | ✅ |
| β Körpergröße | −0.0326 | −0.0326 | ✅ |
| β HDL | −0.4718 | −0.4718 | ✅ |
| β Triglyzeride | 0.2420 | 0.242 | ✅ |
| Logistische Funktion | 1/(1+e^−x) | `1/(1+Math.exp(-lp))` | ✅ |
| Hochrisiko-Cutoff | Pr(DM) ≥ 0.26 | `HIGH_RISK_CUTOFF: 0.26` | ✅ |
| MEANS.age | 54 Jahre | 54 | ✅ |
| MEANS.race | 15 % AA | 0.15 | ✅ |
| MEANS.sbp | 120 mmHg | 120 | ✅ |
| MEANS.height | 168 cm | 168 | ✅ |
| MEANS.fastGlu | 5.44 mmol/L | 5.44 | ✅ |

**Manuelle Berechnung zur Verifikation** (Populationsmittelwerte):
```
lp = -9.9808
   + 0.0173×54    = +0.9342
   + 0.4433×0.15  = +0.0665
   + 0.4981×0.3   = +0.1494
   + 0.0111×120   = +1.3320
   - 0.0326×168   = -5.4768
   + 0.0273×97    = +2.6481
   + 1.5849×5.44  = +8.6218
   - 0.4718×1.3   = -0.6133
   + 0.242×1.7    = +0.4114
   = -1.9275
Pr(DM) = 1/(1+e^1.9275) = 12.93%
```
Code gibt: 12.93% ✅

### Dokumentierte Unsicherheiten (kein Fehler)

| Wert | Code | Anmerkung |
|------|------|-----------|
| `MEANS.waist = 97` | 97 cm | Publikation berichtet Männer 97 / Frauen 93; da kein Sex-Term, Männerwert verwendet. |
| `MEANS.parentHist = 0.3` | 0.3 | Nicht in Publikation berichtet; als Näherung dokumentiert. |
| `MEANS.cholHDL = 1.3` | 1.3 | Lipidmittelwert nicht berichtet; klinisch plausibel. |
| `MEANS.cholTri = 1.7` | 1.7 | Wie cholHDL. |

### Schlussfolgerung

Alle 10 Koeffizienten exakt korrekt. HIGH_RISK_CUTOFF = 0.26 korrekt implementiert und im UI-Mapping verwendet. Das Modell ist wissenschaftlich einwandfrei.

---

## 2. Code-Qualität — Gefundene und behobene Probleme

### Behobene Probleme

| Priorität | Problem | Datei | Fix |
|-----------|---------|-------|-----|
| Mittel | **`resetSimulated()` setzt `_animating` nicht zurück** — nach einem manuellen Reset konnte bei noch laufender Animation eine zweite Simulation gestartet werden. | `treatment-simulator.js:180` | `resetSimulated` setzt nun `_animating = false` neben `_simulated.clear()`. |
| Mittel | **`DRC.UIController.updateSliderFill(f)` ohne optional chaining** — wenn `UIController` noch nicht initialisiert ist (z. B. beim Laden eines Profils vor vollständiger App-Initialisierung), würde dies eine Exception werfen. | `patient-manager.js:103` | Auf `DRC.UIController?.updateSliderFill?.(f)` geändert. |
| Mittel | **`||` Fallback in `loadPatient()` logisch falsch** — `DRC.App?._calculate?.()` gibt `undefined` zurück, sodass `undefined \|\| dispatchEvent(...)` immer den rechten Zweig ausführt. | `patient-manager.js:148` | Auf explizites `if/else` umgestellt. |
| Klein | **`Math.min/max` ignoriert `step` in `applyValues()`** — beim Laden eines Profils wurden Float-Felder (fastGlu, cholHDL, cholTri im SI-Modus) nicht auf Step-Präzision gerundet. | `patient-manager.js:97` | Nutzt nun `DRC.UIHelpers?.clampAndRound?.(val, min, max, step)` mit Fallback. |
| Klein | **`updateSliderAxisLabels` fehlende Felder** — `fastGlu` und `cholHDL` haben ebenfalls einheitsabhängige Ranges (z. B. mmol/L vs. mg/dL), wurden aber bei Unit-Wechsel nicht aktualisiert. | `ui-controller.js:107` | `fastGlu` und `cholHDL` zur Feldliste hinzugefügt. |

### Weiterhin offene Architektur-Hinweise (kein kritischer Bug)

| Thema | Datei | Beschreibung |
|-------|-------|--------------|
| Waist-Range-Inkonsistenz | `config.js:78` | `us: [25, 60, 1]` — 25 Zoll = 63,5 cm, SI-Minimum = 64 cm. Beim Einheitenwechsel wird der extreme Wert um 0,5 cm geclampt. Klinisch irrelevant; dokumentiert. |
| Legacy-Profile ohne `_isMetric` | `patient-manager.js:80` | Profile ohne gespeicherte Einheitsinformation werden als „gleiche Einheit" behandelt — unvermeidlich. Dokumentiert. |
| `convertField`-Guard bei multiplier=0 | `conversion-service.js:73` | `!multiplier` ist falsch-positiv bei Wert 0. Aktuell kein Bug (alle Faktoren > 0), aber fragile Absicherung. |
| `isBaseline`-Flag in Timeline | `timeline-chart.js:47` | Wird gesetzt, aber nie gelesen — `render()` prüft `_baselineRisk !== null` direkt. Totes Attribut. |

### Positives (beibehalten / gut gelöst)

- **`_setCompareScenario`-Setter** vollständig korrekt — behebt die Regression aus Review 2 nachhaltig.
- **`_isMetric` in `captureCurrentValues()`** — Profilspeicherung mit Einheitsinformation konsistent implementiert.
- **SI-Only-Vergleiche in `getElevatedFactors()`** — Entfernung des US-Hardcodes war korrekt.
- **Prototype-Pollution-Guard** in localStorage bleibt korrekt.
- **CSP** auf lokales Lucide-Bundle korrekt umgestellt.

---

## 3. Testabdeckung (Agent 3: Test-Qualitätsanalyse)

### Alle Tests grün: 486/486

### Kritischer Fund des Test-Agents: `|| true` Always-Pass-Assertion ✅ behoben

In `test-timeline-chart.js:285` existierte:
```js
assert(hasUnknownTreatmentCircle || true,  // Skip this test with new DOM API
    'Unknown treatment label uses fallback color (#007aff) - verified via DOM');
```
Diese Assertion war **immer wahr** und testete nichts. Fix: `|| true` entfernt. Der Test prüft nun tatsächlich `circle.attributes.fill === '#007aff'` — und besteht korrekt.

### In diesem Review hinzugefügte Tests

| Test | Datei |
|------|-------|
| `CONFIG.HIGH_RISK_CUTOFF === 0.26` (Schmidt-Cutoff als Konstante) | `test-risk-model.js` |
| Populationsmittel-Risiko liegt unter `HIGH_RISK_CUTOFF` | `test-risk-model.js` |
| `applyValues()` US→SI: height 66in → 168cm | `test-patient-manager.js` |
| `applyValues()` US→SI: fastGlu 100mg/dL → 5.6mmol/L | `test-patient-manager.js` |
| `applyValues()` US→SI: cholHDL 50mg/dL → 1.3mmol/L | `test-patient-manager.js` |

### Verbleibende Testlücken (nach Priorisierung durch Test-Agent)

| Lücke | Priorität | Begründung |
|-------|-----------|------------|
| `_setCompareScenario()` setzt State — verifizierbar via `_getState()` | Mittel | Setter existiert, wird gemockt aber nie gegen echten State geprüft. |
| `ConversionService.fromSI()` und `getConversionFactor()` | Mittel | Öffentliche API ohne Testabdeckung. |
| `onCompareScenario()` Toggle-Logik in app.js | Mittel | Zweiter Aufruf setzt `isComparingScenario = false` — ungetestet. |
| `computeWhatIfDelta()` exakte Magnitude (nicht nur Vorzeichen) | Klein | Deterministische Funktion — exakter Erwartungswert berechenbar. |
| Konversionstoleranzen in test-risk-model.js (0.01 → 1e-10) | Klein | Deterministische Multiplikation — engere Toleranz sinnvoll. |

---

## Zusammenfassung der Änderungen in diesem Review

| Datei | Änderung |
|-------|----------|
| `js/treatment-simulator.js` | `resetSimulated()` setzt nun auch `_animating = false` |
| `js/patient-manager.js` | Optional chaining auf `updateSliderFill`; `clampAndRound` mit Step; `if/else` statt `\|\|`-Fallback |
| `js/ui-controller.js` | `fastGlu` und `cholHDL` in `updateSliderAxisLabels` ergänzt |
| `tests/test-timeline-chart.js` | `\|\| true` Always-Pass-Assertion entfernt (Test prüft jetzt tatsächlich fallback-Farbe) |
| `tests/test-risk-model.js` | `HIGH_RISK_CUTOFF === 0.26` und Populationsmittel-Cutoff-Test ergänzt |
| `tests/test-patient-manager.js` | Suite 8: `applyValues()` US→SI Konvertierungstest mit 3 Assertions |
