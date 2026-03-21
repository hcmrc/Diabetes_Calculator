# Änderungsprotokoll — Code Review & Bugfixes

> Datum: 21. März 2026
> Basis: Umfassendes Code Review durch 3 parallele Agents (Wissenschaft, Code-Qualität, Tests)
> Vollständiger Review-Bericht: `REVIEW_REPORT.md`

---

## Neue Dateien

| Datei | Inhalt |
|-------|--------|
| `REVIEW_REPORT.md` | Vollständiger Review-Bericht aller 3 Agents |
| `CHANGES.md` | Dieses Dokument |
| `docs/superpowers/plans/2026-03-21-bugfixes.md` | Implementierungsplan |

---

## js/config.js

### Populationsmittelwerte korrigiert (Schmidt et al. 2005)

**Problem:** `MEANS.race = 0.25` und `MEANS.fastGlu = 5.5` wichen von der Publikation ab.

| Wert | Alt | Neu | Quelle |
|------|-----|-----|--------|
| `MEANS.race` | `0.25` | `0.15` | Schmidt et al.: 85 % weiß → 15 % Afro-Amerikaner |
| `MEANS.fastGlu` | `5.5` | `5.44` | Schmidt et al.: Median-Nüchternglukose 5.44 mmol/L |

**Auswirkung:** `computeContributions()` verwendet MEANS als Populationsbaseline. Falsche Werte führten zu systematisch verzerrter Faktorenbeitragsanzeige im UI.

### HDL-Schwellenwert korrigiert

**Problem:** `THRESHOLDS.cholHDL.low = 1.0` war weder der NCEP-Männerwert (1.03 mmol/L) noch der Frauenwert (1.29 mmol/L).

| Wert | Alt | Neu | Quelle |
|------|-----|-----|--------|
| `cholHDL.low` | `1.0` | `1.03` | NCEP ATP III: < 40 mg/dL (1.03 mmol/L) für Männer |

**Hinweis:** Da `sex` keine Variable im Schmidt-Modell ist, wird der Männer-Schwellenwert universell verwendet. Dies ist im Code kommentiert.

**Auswirkung:** `getElevatedFactors()` klassifizierte HDL-Werte zwischen 1.0 und 1.02 mmol/L fälschlicherweise als normal.

### Hochrisiko-Cut-off als Konstante ergänzt

```js
HIGH_RISK_CUTOFF: 0.26
```

**Quelle:** Schmidt et al. (2005), Table 1: „a rule defining high risk (9-year probability ≥ 26 %)". Sensitivität 52 %, Spezifität 86 %, ~20 % der Population identifiziert.

---

## js/risk-model.js

### `getElevatedFactors()` — Triglyzerid-Einheiteninkonsistenz beseitigt

**Problem:** Die Funktion verwendete für den US-Modus einen Hardcode-Wert (`rawInputs.cholTri >= 150`), der nicht exakt dem SI-Äquivalent entsprach (`1.7 mmol/L × 88.57 = 150.6 mg/dL`). Dies führte zu unterschiedlichen klinischen Entscheidungen je nach aktivem UI-Modus bei identischen Patientendaten.

**Lösung:** Alle Schwellenwertvergleiche laufen jetzt ausschließlich über SI-Werte. Der `rawInputs`- und `isMetric`-Parameter wurde entfernt.

```js
// Vorher
const getElevatedFactors = (siVals, rawInputs, isMetric) => {
    const triElevated = isMetric
        ? siVals.cholTri >= T.cholTri.elevated
        : rawInputs.cholTri >= 150;   // ← Hardcode, falsch
    ...
}

// Nachher
const getElevatedFactors = (siVals) => {
    if (siVals.cholTri >= T.cholTri.elevated) elevated.push('cholTri');
    ...
}
```

**Alle Aufrufer in `js/app.js` entsprechend angepasst** (Zeilen 74 und 184).

---

## js/conversion-service.js

### `applyConvertedValues()` — Crash-Guard gegen unbekannte Felder

**Problem:** `CFG.RANGES[field][mode]` wurde für alle Felder in `savedValues` aufgerufen, auch für Felder ohne Range-Eintrag (`race`, `parentHist`, `_riskPct`). Dies erzeugte einen Laufzeitfehler `Cannot read properties of undefined`.

**Lösung:** Felder ohne Range-Eintrag werden übersprungen.

```js
// Neu: Guard am Anfang der forEach-Schleife
if (!CFG.RANGES[field]) return;
```

---

## js/app.js

### `_getState()` — gibt Kopie statt Direktreferenz zurück

**Problem:** `_getState: () => state` gab eine direkte Referenz auf das interne State-Objekt zurück. `TreatmentSimulator` mutierte diesen State von außen, ohne die Setter-Logik von `App` zu durchlaufen (zirkuläre Seiteneffekte möglich).

**Lösung:**

```js
// Vorher
return { init, _calculate: calculate, _getState: () => state };

// Nachher
return { init, _calculate: calculate, _getState: () => ({ ...state }) };
```

---

## js/patient-manager.js

### Einheit wird beim Speichern eines Patientenprofils mitgespeichert

**Problem (kritisch):** `captureCurrentValues()` speicherte Slider-Werte ohne Information über das aktive Einheitensystem. Beim Laden eines Profils in einem anderen Modus (z. B. SI gespeichert, US geladen) wurden SI-Werte (z. B. 5.3 mmol/L) direkt als US-Werte in den Slider geschrieben (5.3 mg/dL ≈ 0.29 mmol/L) — vollständig falsche Risikoberechnung.

**Lösung:** `captureCurrentValues()` speichert jetzt `_isMetric`. `applyValues()` erkennt eine Einheitendiskrepanz und konvertiert automatisch.

```js
// captureCurrentValues() — neu
vals._isMetric = DRC.App?._getState?.()?.isMetric ?? false;

// applyValues() — neu
const savedIsMetric   = data._isMetric ?? currentIsMetric;
if (savedIsMetric !== currentIsMetric && CONVERTIBLE_FIELDS.includes(f)) {
    const siVal = savedIsMetric ? val : ConversionService.convertField(f, val, true);
    val = currentIsMetric ? siVal : ConversionService.convertField(f, siVal, false);
}
```

**Rückwärtskompatibilität:** Profile ohne `_isMetric` (Legacy) werden als im aktuellen Modus gespeichert behandelt — kein Breaking Change.

---

## tests/test-ui-controller.js

### 3 Testfehler behoben (falsche Icon-Namen)

**Problem:** Tests prüften auf Lucide-Icon-Namen mit Underscore (`trending_down`, `trending_up`, `trending_flat`), aber `ui-controller.js` schreibt diese mit Bindestrich via `.replace(/_/g, '-')` ins HTML.

| Zeile | Alt | Neu |
|-------|-----|-----|
| 313 | `trending_down` | `trending-down` |
| 320 | `trending_up` | `trending-up` |
| 326 | `trending_flat` | `trending-flat` |

---

## tests/test-risk-model.js

### `popRisk`-Erwartungswert nach MEANS-Korrektur angepasst

| | Alt | Neu |
|-|-----|-----|
| Erwartungswert | `14.58 %` | `12.93 %` |
| Grund | Basierte auf falschem `race = 0.25` | Korrekt mit `race = 0.15`, `fastGlu = 5.44` |

### Schmidt-Referenztest präzisiert

| | Alt | Neu |
|-|-----|-----|
| Assertion | `> 50 && < 90` (40 %-Fenster) | `≈ 86.11 % (±2 %)` |

### `getElevatedFactors()`-Aufrufe an neue Signatur angepasst

Alle Aufrufe mit 3 Parametern auf 1 Parameter (nur `siVals`) umgestellt.

---

## tests/test-risk-model-edge-cases.js

### `getElevatedFactors()`-Aufrufe an neue Signatur angepasst

Alle `getElevatedFactors(siVals, {}, isMetric)`-Aufrufe auf `getElevatedFactors(siVals)` umgestellt.

### HDL-Schwellenwert-Tests auf 1.03 aktualisiert

```js
// Vorher: Grenze bei 1.0 (falsch)
const atHDLThreshold = { ...base, cholHDL: 1.0 };

// Nachher: Grenze bei 1.03 (NCEP ATP III)
const atHDLThreshold = { ...base, cholHDL: 1.03 };
```

### US-Triglyzerid-Tests ersetzt

Die Tests für den US-Hardcode (`cholTri >= 150 mg/dL`) wurden durch SI-basierte Tests ersetzt, da die Funktion jetzt einheitensystemunabhängig arbeitet.

---

## tests/test-comparison.js

### MEANS-Vergleich auf korrigierte Werte umgestellt

Statt gegen `ORIG_CONFIG.MEANS` (alte, falsche Werte) zu testen, wird jetzt gegen die wissenschaftlich korrekten Werte verglichen:

```js
const CORRECT_MEANS = { ...ORIG_CONFIG.MEANS, race: 0.15, fastGlu: 5.44 };
```

### Contributions-Tests auf Selbstkonsistenz umgestellt

Da `computeContributions()` die MEANS als Baseline verwendet und diese intentional geändert wurden, vergleichen die Tests nicht mehr gegen das alte Monolith. Stattdessen:

1. **Null-Test:** Beiträge am NEW MEANS-Punkt müssen alle exakt `0` sein.
2. **Feldspezifischer Test:** Für Felder deren MEANS nicht geändert wurden (`age`, `sbp`, `waist`, `height`, `cholHDL`, `cholTri`, `parentHist`) stimmen Beiträge weiterhin mit dem Original überein.

---

## Testergebnis (Review 1)

| Datei | Tests vorher | Tests nachher | Status |
|-------|-------------|---------------|--------|
| test-risk-model.js | 62 ✓ / 0 ✗ | 62 ✓ / 0 ✗ | |
| test-risk-model-edge-cases.js | 85 ✓ / 0 ✗ | 83 ✓ / 0 ✗ | −2 (US-TG-Tests entfernt) |
| test-patient-manager.js | 39 ✓ / 0 ✗ | 39 ✓ / 0 ✗ | |
| test-timeline-chart.js | 38 ✓ / 0 ✗ | 38 ✓ / 0 ✗ | |
| test-treatment-simulator.js | 37 ✓ / 0 ✗ | 37 ✓ / 0 ✗ | |
| test-ui-controller.js | 59 ✓ / **3 ✗** | 62 ✓ / 0 ✗ | 3 Fehler behoben |
| test-comparison.js | 47 ✓ / **8 ✗** | 55 ✓ / 0 ✗ | 8 Fehler behoben |
| **Gesamt** | **367 ✓ / 11 ✗** | **376 ✓ / 0 ✗** | **Alle grün** |

---

# Review 4 — 21. März 2026

> Basis: 5. umfassendes Code Review (Wissenschaft · Code-Qualität · Tests)
> Vollständiger Review-Bericht: `REVIEW_REPORT_4.md`

---

## js/ui-helpers.js

### `clampAndRound` — Float-Präzision aus `step` ableiten

**Problem:** `.toFixed(1)` war hart kodiert — Float-Felder mit `step: 0.01` (cholHDL, cholTri im SI-Modus) wurden auf nur 1 Dezimalstelle gerundet.

```js
// Vorher
return parseFloat(clamped.toFixed(1));

// Nachher
const decimals = String(step).split('.')[1]?.length ?? 1;
return parseFloat(clamped.toFixed(decimals));
```

---

## js/ui-controller.js

### `escapeHtml` in Destrukturierung ergänzt

`escapeHtml` aus `DRC.UIHelpers` war in der Destrukturierung am Modul-Anfang nicht aufgeführt, wurde aber nun in `renderTreatmentOverview` benötigt.

### `_filterHandlerAttached` — Modul-Scope-Variable statt DOM-Expando

**Problem:** `searchInput._hasFilterHandler = true` schrieb Anwendungszustand auf ein DOM-Element (Expando-Property).

**Fix:** Modul-Scope-Variable `let _filterHandlerAttached = false;` ersetzt die Expando-Property.

### `updateSliderAxisLabels` — Achsenmittelwert für Integer gerundet

**Problem:** `(min + max) / 2` erzeugte bei ungeraden Range-Summen Kommazahlen auf Integer-Achsen.

```js
const mid = isFloat ? (min + max) / 2 : Math.round((min + max) / 2);
```

### `renderTreatmentOverview` — XSS-Schutz via `escapeHtml`

Therapienamen und -beschreibungen werden jetzt durch `escapeHtml()` geleitet, bevor sie per Template-Literal in innerHTML eingebettet werden.

```js
`<strong>${escapeHtml(t.name)}:</strong> ${escapeHtml(t.desc)}`
```

### `updateModSummary` — `hVal`/`hUnit` → `hdlVal`/`hdlUnit`

Variablennames-Kollision mit der `height`-Konvention behoben. HDL-Variablen heißen jetzt eindeutig `hdlVal` und `hdlUnit`.

---

## js/app.js

### `onReset` — Unit-Konversion-Bug bei Patientenprofilen behoben (kritisch)

**Problem:** Beim Zurücksetzen auf ein Patientenprofil wurden Werte direkt per `setField(f, patientData[f])` gesetzt, ohne Einheiten zu konvertieren. Im Einheitenmismatch (z. B. Profil in SI, UI auf US) wurden SI-Werte als US-Werte interpretiert.

**Fix:** Delegation an `DRC.PatientManager.applyValues(patientData)`:

```js
if (patientData) {
    DRC.PatientManager.applyValues(patientData);
} else { ... }
```

### Redundanter `lucide.createIcons()` in `onCompareScenario` entfernt

`setBaseline()` → `render()` → `renderLegend()` ruft `lucide.createIcons()` intern auf — der vorherige manuelle Aufruf war redundant.

---

## js/patient-manager.js

### `applyValues` in Public API exportiert

`applyValues` war bisher eine interne Funktion. Um `onReset` in `app.js` zu ermöglichen, wurde sie als öffentliche Methode in den Return-Ausdruck aufgenommen:

```js
return { init, loadPatient, applyValues, captureCurrentValues, updateNavLabel, getActivePatientData };
```

### Excel-Import setzt `_isMetric: false`

Beim Excel-Import wurde kein `_isMetric`-Flag gesetzt. Ohne dieses Flag konnte `applyValues()` keine korrekte Einheitenkonversion durchführen. Excel-Daten enthalten keine SI-Werte, daher wird `_isMetric: false` gesetzt.

---

## tests/test-risk-model.js (64 → 79 Tests)

### `fromSI()` — 7 neue Assertions

Inverse Konvertierung für alle 5 konvertierbaren Felder, Passthrough für nicht-konvertierbare Felder, Rundtrip-Test (toSI → fromSI = Original, Toleranz 1e-9).

### `getConversionFactor()` — 6 neue Assertions

Bekannte Faktoren (`height = 2.54`, `fastGlu = 18.02`, `cholHDL ≈ 38.66`), `null` für nicht-konvertierbare Felder (`age`).

### Konversionstoleranzen verschärft

Von `0.01` auf `1e-9` — deterministische Multiplikation erlaubt engere Grenzen ohne Rauschen.

---

## tests/test-treatment-simulator.js (37 → 45 Tests)

### Suite 8: `_setCompareScenario` + `_getState` State-Integration (8 neue Assertions)

Lädt echtes `app.js` mit vollständigen DRC-Stubs und verifiziert das State-Management via öffentliche API:

- Initialzustand: `isComparingScenario = false`, `baselineRisk = null`
- Nach erstem Aufruf: `isComparingScenario = true`, `baselineRisk = 42.5`
- Überschreiben: `baselineRisk = 18.0`
- Mutation-Safety: `_getState()` gibt Kopie zurück — externe Mutation beeinflusst internen State nicht

---

## Testergebnis (Review 4)

| Datei | Tests Review 3 | Tests Review 4 | Δ |
|-------|---------------|----------------|---|
| test-risk-model.js | 64 | 79 | +15 |
| test-risk-model-edge-cases.js | 83 | 83 | — |
| test-patient-manager.js | 45 | 45 | — |
| test-timeline-chart.js | 38 | 38 | — |
| test-treatment-simulator.js | 37 | 45 | +8 |
| test-ui-controller.js | 63 | 63 | — |
| test-comparison.js | 55 | 55 | — |
| test-radar-chart.js | 92 | 92 | — |
| test-ui-helpers.js | 9 | 9 | — |
| **Gesamt** | **486** | **509** | **+23** |
