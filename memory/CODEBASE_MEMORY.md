# Diabetes Risk Calculator — Codebase Memory

**Stand:** 2026-03-25 | **JS-Zeilen:** ~3400 (ohne lib/) | **Tests:** 476 (alle gruen)

---

## 1. Was ist das?

Clientseitiger Diabetes-Risikorechner nach Schmidt et al. (2005) ARIC-Studie. 9-Jahres-Diabetesrisiko aus 9 Risikofaktoren + Sex-Toggle fuer geschlechtsspezifische Waist-Schwellenwerte. Kein Server, laeuft via `file://`.
Masterarbeit-Prototyp fuer **Ecological Interface Design (EID)** — SRK-Taxonomie Kommentare im Code sind beabsichtigt.

---

## 2. Architektur

### Namespace
Alles unter `window.DRC`. Kein Bundler, keine ES-Module — Script-Tags mit strikter Reihenfolge.

### Script-Ladereihenfolge (NICHT AENDERN!)

```
1.  lucide.min.js         ← Icons (lokal, kein SRI!)
2.  xlsx.full.min.js      ← SheetJS (CDN mit SRI)
3.  config.js             ← DRC.CONFIG (frozen)
4.  conversion-service.js ← Unit-Konvertierung
5.  risk-model.js         ← Reine Mathematik
6.  ui-helpers.js         ← DOM-Utilities
7.  ui-controller.js      ← DOM lesen/schreiben
8.  radar-chart.js        ← SVG-Hexagon (EID RBB)
9.  timeline-chart.js     ← SVG-Snapshot-Trend
10. app.js                ← State + Events + Orchestration
11. patient-manager.js    ← CRUD + localStorage + Excel
12. treatment-simulator.js← Animierte Simulation
13. dark-mode.js          ← Theme-Toggle (self-init!)
14. main.js               ← Bootstrap
```

### Abhaengigkeitsgraph

```
config.js ←── alle Module
  ↓
conversion-service.js ←── risk-model, ui-controller, patient-manager
  ↓
risk-model.js ←── app, treatment-simulator
  ↓
ui-helpers.js ←── ui-controller, patient-manager, dark-mode, timeline-chart
  ↓
ui-controller.js ←── app, treatment-simulator, patient-manager
  ↓
app.js ←── treatment-simulator, patient-manager
```

---

## 3. NICHT AENDERN

| Was | Warum |
|-----|-------|
| `CONFIG.BETAS` | Publizierte Koeffizienten Schmidt et al. (2005) |
| `CONFIG.MEANS` | ARIC Kohorten-Mittelwerte |
| `CONFIG.THRESHOLDS` | ADA 2024, ACC/AHA 2017, NCEP ATP III |
| `CONFIG.HIGH_RISK_CUTOFF: 0.26` | Publizierter Schwellenwert |
| `CONFIG.CONVERSIONS` | Exakte Einheiten-Umrechnungsfaktoren |
| `CONFIG.SIMULATION_EFFECTS` | Evidenzbasierte Behandlungsdeltas (sbp ist geschlechtsabhaengig: siMale/siFemale) |
| Script-Ladereihenfolge | Module greifen aufeinander zu |
| `Object.freeze()` auf CONFIG | Bewusst immutable |

---

## 4. Externe Abhaengigkeiten

| Bibliothek | Quelle | Zweck |
|---|---|---|
| Lucide Icons | `js/lib/lucide.min.js` (lokal) | SVG-Icons |
| SheetJS | CDN + SRI | Excel Import/Export |
| Plus Jakarta Sans | Google Fonts | Schriftart |

---

## 5. Dinge die wie Bugs aussehen

- `renderTreatmentRecommendations` = Legacy No-Op (API-Kompatibilitaet)
- `off()` in app.js nie direkt aufgerufen (intern via Unsubscribe-Fn)
- `parseFloat(el().value) || 0` — sicher, kein Slider hat 0 im Wertebereich
- `btoa/atob` = Obfuskation, keine Verschluesselung (bewusst)
- `'unsafe-inline'` CSP = noetig wegen `element.style.xxx`
- HDL-Invertierung im Radar Chart ist korrekt
- Dark Mode self-init = FOUC-Vermeidung
- Prototype-Pollution-Schutz in patient-manager = beabsichtigt
- `sex` in ALL_FIELDS aber NICHT in BETAS/MEANS — null-Guard in computeContributions/MarginalContributions
- `getElevatedFactors(siVals, isMale=true)` — Default male fuer Abwaertskompatibilitaet
- Legacy-Patientendaten ohne `sex` → Default Male (via `?? 1` in applyValues)
- `getEffectDelta()` in treatment-simulator prueft `fx.siMale !== undefined` fuer geschlechtsabhaengige Logik — kein Bug
- CAUSALITY_CHAINS in ui-controller.js: Triglycerid-Pfad endet NICHT mit "Diabetes Risk" sondern "Triglycerides ↑" — beabsichtigt (zeigt Folge, nicht Ursache)

---

## 6. Zentrale APIs

### ConversionService
```
toSI(inputs, isMetric) → Object
fromSI(siVals, isMetric) → Object
convertField(field, value, toMetric) → number
applyConvertedValues(siValues, isMetric, {onValue, onComplete})
getConversionFactor(field) → number|null
```

### UIController
```
readInputs() → Object (incl. sex: 0|1)
getSliderElements(factor) → {input, slider}
getUnitToggleState() → boolean
setComparisonMode(active, baselineRisk)
renderRisk(pct), renderContributionChart(summary)
renderTreatmentOverview(treatStatus, contributions, marginals)
renderWhatIfBadge(field, delta)
renderIconArray(riskPct), renderCausalityChains(siVals, elevated, contributions)
renderScenarioComparison(baseline, current)
updateUnitLabels(isMetric), updateSliderRanges(mode)
applyConvertedValues(savedValues, isMetric)
updateAllSliderFills(), updateNonModSummary(), updateModSummary()
updateWaistSegments(isMale, isMetric) → dynamische Slider-Segmente/Labels
```

### App
```
init(), _calculate() → riskPct
_getState() → {isMetric, prevRiskPct, activeField, baselineRisk, isComparingScenario, preciseSI}
_setCompareScenario(baselineRisk)
on(event, cb) → unsubscribeFn, off(event, cb), trigger(event, data)
// Helper: _computeRisk() → {raw, si, risk}
```

### TreatmentSimulator
```
simulate(factor), resetSimulated(), cancel()
```

---

## 7. Event-System

Minimaler Event-Bus in app.js. Haupt-Event: `'risk:recalculate'` → loest `calculate()` aus.

---

## 8. State

```javascript
// app.js
state = { isMetric, prevRiskPct, activeField, baselineRisk, isComparingScenario, preciseSI }

// treatment-simulator.js
_animating: boolean, _simulated: Set, _animationTimeoutId: number|null

// patient-manager.js
patients: Array, activePatientId: string|null
```

---

## 9. localStorage Keys

- `drc_v1_patients` — Patientendaten (Base64-encoded)
- `drc-theme-preference` — Dark Mode

---

## 10. Fehlerquellen bei Aenderungen

1. Neue Modell-Felder → CONFIG.ALL_FIELDS, SLIDER_FIELDS, RANGES, BETAS, MEANS, LABELS, HTML
1b. Neue UI-only Felder (wie sex) → ALL_FIELDS, aber NICHT BETAS/MEANS (null-Guard beachten)
2. Slider min/max/step im HTML muss mit CONFIG.RANGES uebereinstimmen
3. Nach `innerHTML` mit Icons → `DRC.UIHelpers.refreshIcons()` aufrufen
4. Event Delegation Guard-Flags nicht entfernen
5. `computeProbability` gibt NaN bei ungueltigem Input
6. TREATMENT_COLORS leben in CONFIG, nicht lokal duplizieren
7. SIMULATION_EFFECTS.sbp hat KEINE `us`/`si` Keys — stattdessen `usMale`/`usFemale`/`siMale`/`siFemale` (Tests muessen das beruecksichtigen)
8. CAUSALITY_CHAINS hat `riskNode` Index pro Chain — Rendering nutzt `.risk-node` CSS-Klasse
9. renderCausalityChains() erwartet 3. Param `contributions` fuer dynamische Sortierung nach Beitragsgroesse

---

## 11. Was man NICHT tun sollte

- Kein Bundler/Transpiler ohne komplettes Refactoring
- Keine ES-Module (`file://` Support)
- CONFIG nicht mutable machen
- Keinen Server voraussetzen
- Keine npm Runtime-Dependencies
- Beta-Koeffizienten nicht "verbessern"

---

## 12. Test-Infrastruktur

`node tests/test-*.js` — Assert-basiert mit DOM-Mocks. 476 Tests gesamt.
`test-comparison.js` braucht externe Datei (optional, ueberspringt sich).
