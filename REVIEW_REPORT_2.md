# Code Review Report 2 — Diabetes Risk Calculator

> Datum: 21. März 2026
> Anlass: Umfangreiche Codeänderungen (14 Dateien, +487/−242 Zeilen)
> Reviewer: 3 spezialisierte Agents parallel (Wissenschaft · Code-Qualität · Tests)
> Vorgängerbericht: `REVIEW_REPORT.md`

---

## Testergebnis (Endstand nach allen Fixes)

| Datei | Tests | Status |
|-------|-------|--------|
| test-risk-model.js | 62 | ✅ 62/62 |
| test-risk-model-edge-cases.js | 83 | ✅ 83/83 |
| test-patient-manager.js | 42 | ✅ 42/42 |
| test-timeline-chart.js | 38 | ✅ 38/38 |
| test-treatment-simulator.js | 37 | ✅ 37/37 |
| test-ui-controller.js | 63 | ✅ 63/63 |
| test-comparison.js | 55 | ✅ 55/55 |
| test-radar-chart.js | 92 | ✅ 92/92 |
| test-ui-helpers.js | 9 | ✅ 9/9 |
| **Gesamt** | **481** | **✅ 481/481** |

---

## 1. Wissenschaftliche Korrektheit (Agent 1: Schmidt et al. 2005)

### Gesamtbewertung: ✅ Modell korrekt implementiert

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
| Schwellenwert SBP | 130 mmHg (NCEP) | 130 | ✅ |
| Schwellenwert Glukose | 5.6 mmol/L (ADA) | 5.6 | ✅ |
| Schwellenwert HDL (♂) | 1.03 mmol/L (NCEP) | 1.03 | ✅ |
| Schwellenwert TG | 1.7 mmol/L (NCEP) | 1.7 | ✅ |
| Schwellenwert Taille (♂) | 102 cm (NCEP) | 102 (`waist.high`) | ✅ |

### Dokumentierte Unsicherheiten (kein Fehler, aber nicht aus Publikation belegbar)

| Wert | Code | Anmerkung |
|------|------|-----------|
| `MEANS.waist = 97` | 97 cm | Publikation gibt Männer 97 / Frauen 93; Gesamtmittel ca. 95. Da kein Sex-Term im Modell, Männerwert verwendet. |
| `MEANS.parentHist = 0.3` | 0.3 | Prävalenz Familienanamnese nicht berichtet. Im Code als Näherung dokumentiert. |
| `MEANS.cholHDL = 1.3` | 1.3 | Lipidmittelwerte nicht berichtet; klinisch plausibel. |
| `MEANS.cholTri = 1.7` | 1.7 | Wie cholHDL. |
| `waist.elevated = 94 cm` | IDF/WHO | Nicht aus Schmidt-Publikation. Bewusste Abweichung, im Code dokumentiert. |

### Schlussfolgerung

Alle 10 Koeffizienten und die logistische Funktion sind exakt korrekt. Der publizierte Hochrisiko-Cutoff (≥ 26 %) ist korrekt implementiert und nun auch im UI-Risikolevel-Mapping verwendet. Die wenigen Unsicherheiten betreffen ausschließlich Populationsmittelwerte, die nur die visuelle Beitragsdarstellung, nie die Risikowahrscheinlichkeit beeinflussen.

---

## 2. Code-Qualität — Gefundene und behobene Probleme

### Kritische Regression behoben ✅

#### K1: TreatmentSimulator — State-Mutation durch shallow copy gebrochen

**Problem:** `_getState()` wurde auf `() => ({ ...state })` geändert, um externe State-Mutation zu verhindern. `TreatmentSimulator` schrieb aber weiterhin `appState.isComparingScenario = true` auf die Kopie — diese Schreiboperation hatte keinen Effekt auf den echten `state`. Folge: Nach einer Simulation wurde `renderScenarioComparison()` beim nächsten Slider-Update nie aufgerufen (Bedingung `state.isComparingScenario` blieb `false`).

**Fix:** Explizite Setter-Methode `_setCompareScenario(baselineRisk)` in `App` ergänzt; `TreatmentSimulator` ruft diese statt `_getState()` auf.

```js
// app.js — neu
const setCompareScenario = (baselineRisk) => {
    state.isComparingScenario = true;
    state.baselineRisk = baselineRisk;
};
return { ..., _setCompareScenario: setCompareScenario };

// treatment-simulator.js — vorher (defekt)
const appState = DRC.App._getState?.();
if (appState) { appState.isComparingScenario = true; appState.baselineRisk = risk; }

// treatment-simulator.js — nachher (korrekt)
DRC.App._setCompareScenario?.(risk);
```

### Weitere behobene Probleme

| Priorität | Problem | Fix |
|-----------|---------|-----|
| Mittel | **Tote Variable `rawInputs`** in `onToggleUnits()` (`app.js:183`) — Überbleibsel nach Signaturänderung von `getElevatedFactors`. Unnötiger DOM-Lesezugriff bei jedem Unit-Toggle. | Variable entfernt. |
| Mittel | **`HIGH_RISK_CUTOFF` nirgendwo verwendet** — korrekt deklariert, aber `RISK_COLORS` nutzte `min: 25` statt `26`. | `RISK_COLORS.min` von `25 → 26` gesetzt, Kommentar mit Quellenangabe ergänzt. |
| Mittel | **Kein Clamp in `applyValues()`** — bei korrupten oder konvertierten Werten außerhalb des Slider-Ranges wurde trotzdem direkt geschrieben. | `Math.min/max` gegen `RANGES[f][mode]` ergänzt. |
| Klein | **`trending-flat` existiert nicht in Lucide** — das Icon blieb bei delta=0 unsichtbar. | Auf `minus` geändert. |
| Klein | **Comparison-Test falscher Pfad** — `'Masterarbeit 3.7 (Pre-Refactoring)/calculator.js'` nicht gefunden. | Auf tatsächlichen Pfad `01_Code-Versionen/v3.7_Refactoring/calculator.js` korrigiert. |

### Weiterhin offene Architektur-Hinweise (keine kritischen Bugs)

| Thema | Datei | Beschreibung |
|-------|-------|--------------|
| Legacy-Profile ohne `_isMetric` | `patient-manager.js:80` | Profile die vor dem Fix gespeichert wurden haben kein `_isMetric`. Sie werden als "gleiche Einheit wie aktuell" behandelt — unvermeidlich ohne gespeicherte Einheitsinformation. Dokumentiert. |
| `convertField`-Guard bei multiplier=0 | `conversion-service.js:73` | `!multiplier` ist falsch-positiv bei Wert 0. Aktuell kein Bug (alle Konversionsfaktoren > 0), aber fragile Absicherung. |
| `isBaseline`-Flag in Timeline | `timeline-chart.js:47` | Wird gesetzt, aber nie ausgelesen — `render()` prüft `_baselineRisk !== null` direkt. Totes Attribut. |
| `_calculate` ohne JSDoc | `app.js` | Ungeschützte öffentliche API ohne Dokumentation. |

### Positives (beibehalten / gut gelöst)

- **SI-Only-Refaktorierung von `getElevatedFactors`** vollständig durchgezogen, alle 3 Aufrufstellen korrekt migriert.
- **Timeline-Chart komplett auf DOM-API** umgestellt (238 Insertions) — eliminiert XSS-Risiken im SVG-Bereich vollständig.
- **Prototype-Pollution-Guard** in localStorage bleibt korrekt.
- **`preciseSI`-Pattern** gegen Rounding-Drift korrekt und gut dokumentiert.
- **CSP** korrekt auf lokales Lucide-Bundle umgestellt.

---

## 3. Testabdeckung — Gefundene Lücken und Fixes

### Alle Tests grün: 481/481

### In diesem Review hinzugefügte Tests

| Test | Datei |
|------|-------|
| `_isMetric` in Rückgabeobjekt von `captureCurrentValues()` | `test-patient-manager.js` |
| `typeof vals._isMetric === 'boolean'` | `test-patient-manager.js` |
| `_isMetric` Fallback-Wert `false` | `test-patient-manager.js` |
| Schmidt-Referenz ±0.1 % statt ±2.0 % | `test-risk-model.js` |
| `pct=26 → warning` (Schmidt-Cutoff) | `test-ui-controller.js` |
| `pct=25 → alert` (unterhalb Schmidt-Cutoff) | `test-ui-controller.js` |
| `_setCompareScenario` im TreatmentSimulator-Mock | `test-treatment-simulator.js` |

### Verbleibende Testlücken (nicht kritisch)

| Lücke | Priorität | Begründung |
|-------|-----------|------------|
| `applyValues()` mit echtem Unit-Wechsel (SI→US und US→SI) | Hoch | Die neue Konvertierungslogik ist ungetestet; Bug wäre bei Profilwechsel sichtbar. |
| `HIGH_RISK_CUTOFF` Wert-Test (`CONFIG.HIGH_RISK_CUTOFF === 0.26`) | Mittel | Klinisch signifikante Konstante ohne direkten Test. |
| `ConversionService.fromSI()` und `getConversionFactor()` | Mittel | Öffentliche API ohne Testabdeckung. |
| `ConversionService.applyConvertedValues()` mit race/parentHist-Feldern | Mittel | Crash-Guard-Pfad nicht explizit getestet. |

---

## Zusammenfassung der Änderungen in diesem Review

| Datei | Änderung |
|-------|----------|
| `js/app.js` | `_setCompareScenario()` Setter ergänzt; tote Variable `rawInputs` entfernt |
| `js/treatment-simulator.js` | `_setCompareScenario()` statt direkter State-Mutation |
| `js/ui-controller.js` | `RISK_COLORS.min` 25→26 (Schmidt-Cutoff); `trending-flat` → `minus` |
| `js/patient-manager.js` | Clamp nach Konvertierung in `applyValues()` |
| `tests/test-comparison.js` | Korrrekter Pfad zur pre-refactoring `calculator.js` |
| `tests/test-patient-manager.js` | RANGES/CONVERTIBLE_FIELDS/ConversionService im Mock; `_isMetric`-Tests |
| `tests/test-ui-controller.js` | Schwellenwert-Tests 25→26 aktualisiert; `minus`-Icon-Test |
| `tests/test-treatment-simulator.js` | `_setCompareScenario` im App-Mock |
| `tests/test-risk-model.js` | Schmidt-Toleranz von ±2.0 auf ±0.1 % eingeengt |
