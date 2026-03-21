# Code Review Report 4 — Diabetes Risk Calculator

> Datum: 21. März 2026
> Anlass: 5. umfassendes Review nach den Änderungen in Reviews 1–3 (Konvertierungslogik, TreatmentSimulator, PatientManager, UI-Refactoring)
> Reviewer: 3 spezialisierte Agents parallel (Wissenschaft · Code-Qualität · Tests)
> Vorgängerbericht: `REVIEW_REPORT_3.md`

---

## Testergebnis (Endstand nach allen Fixes)

| Datei | Tests | Status |
|-------|-------|--------|
| test-risk-model.js | 79 | ✅ 79/79 |
| test-risk-model-edge-cases.js | 83 | ✅ 83/83 |
| test-patient-manager.js | 45 | ✅ 45/45 |
| test-timeline-chart.js | 38 | ✅ 38/38 |
| test-treatment-simulator.js | 45 | ✅ 45/45 |
| test-ui-controller.js | 63 | ✅ 63/63 |
| test-comparison.js | 55 | ✅ 55/55 |
| test-radar-chart.js | 92 | ✅ 92/92 |
| test-ui-helpers.js | 9 | ✅ 9/9 |
| **Gesamt** | **509** | **✅ 509/509** |

---

## 1. Wissenschaftliche Korrektheit (Agent 1: Schmidt et al. 2005)

### Gesamtbewertung: ✅ Modell vollständig korrekt — keine Mängel

Alle Koeffizienten, Populationsmittelwerte und das HIGH_RISK_CUTOFF wurden in den vorangegangenen Reviews korrekt implementiert und blieben in diesem Review unverändert korrekt.

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
| MEANS.race | 15 % AA | 0.15 | ✅ |
| MEANS.fastGlu | 5.44 mmol/L | 5.44 | ✅ |

Keine Regressionen durch die Code-Änderungen in Review 4 festgestellt. Populationsrisiko bleibt 12.93 %, was mit der manuellen Berechnung aus Report 3 übereinstimmt.

### Schlussfolgerung

Das wissenschaftliche Modell ist vollständig korrekt und stabil. Alle Review-4-Änderungen waren technischer Natur (UI-Sicherheit, Zustandsverwaltung, Präzision) ohne Einfluss auf die Risikoberechnung.

---

## 2. Code-Qualität (Agent 2)

### Gefundene und behobene Probleme

#### KRIT-1 (Kritisch): `onReset` — Unit-Konversion-Bug bei Patientenprofilen ✅ behoben

**Datei:** `js/app.js` (onReset-Handler)

**Problem:** Beim Zurücksetzen auf ein aktives Patientenprofil wurden Slider-Werte via `setField(f, patientData[f])` direkt gesetzt, ohne das Einheitensystem zu berücksichtigen. Wenn ein Profil im SI-Modus gespeichert wurde (z. B. `height: 168 cm`) und der Nutzer auf US-Modus wechselte, wurde `168` als Inches-Wert geschrieben — ein Faktor 2,54 Fehler.

**Fix:** `onReset` delegiert nun an `DRC.PatientManager.applyValues(patientData)`, das die Einheitenkonversion korrekt handhabt:

```js
// Vorher
Object.keys(patientData).forEach(f => setField(f, patientData[f]));

// Nachher
DRC.PatientManager.applyValues(patientData);
```

`applyValues` musste als öffentliche API aus `patient-manager.js` exportiert werden.

---

#### HOCH-1 (Hoch): `clampAndRound` — Float-Präzision hart auf `.toFixed(1)` kodiert ✅ behoben

**Datei:** `js/ui-helpers.js`

**Problem:** `clampAndRound(value, min, max, step)` rief `clamped.toFixed(1)` unabhängig vom `step`-Parameter auf. Bei Feldern mit `step: 0.01` (z. B. cholHDL, cholTri im SI-Modus) wurden Werte auf 1 Dezimalstelle gerundet statt auf 2.

**Fix:** Dezimalstellen werden aus `step` abgeleitet:

```js
// Vorher
return parseFloat(clamped.toFixed(1));

// Nachher
const decimals = String(step).split('.')[1]?.length ?? 1;
return parseFloat(clamped.toFixed(decimals));
```

---

#### HOCH-2 (Hoch): `renderTreatmentOverview` — XSS-Risiko durch unescapte `t.name`/`t.desc` ✅ behoben

**Datei:** `js/ui-controller.js` (`renderTreatmentOverview`)

**Problem:** Therapienamen und -beschreibungen wurden direkt per Template-Literal in innerHTML eingebettet, ohne HTML-Escaping. Da die Quellen aus `CONFIG.SIMULATION_EFFECTS` stammen (statisch), bestand kein akutes XSS-Risiko, aber die Praxis ist unsicher.

**Fix:** `escapeHtml()` aus `UIHelpers` angewendet:

```js
`<strong>${escapeHtml(t.name)}:</strong> ${escapeHtml(t.desc)}`
```

`escapeHtml` musste in der UIHelpers-Destrukturierung ergänzt werden.

---

#### MITTEL-1 (Mittel): `_hasFilterHandler` als DOM-Expando-Property ✅ behoben

**Datei:** `js/ui-controller.js`

**Problem:** Der Filter-Event-Handler-Guard wurde als `searchInput._hasFilterHandler = true` direkt auf dem DOM-Element gesetzt (Expando-Property). Dies ist eine schlechte Praxis: DOM-Elemente sind kein geeigneter Ort für Anwendungszustand.

**Fix:** Modul-Scope-Variable `_filterHandlerAttached` statt DOM-Expando:

```js
// Modul-Scope
let _filterHandlerAttached = false;

// Statt: if (!searchInput._hasFilterHandler)
if (!_filterHandlerAttached) {
    searchInput.addEventListener('input', ...);
    _filterHandlerAttached = true;
}
```

---

#### MITTEL-2 (Mittel): Achsenmittelwert für Integer-Ranges nicht gerundet ✅ behoben

**Datei:** `js/ui-controller.js` (`updateSliderAxisLabels`)

**Problem:** Der mittlere Achsenmarkierungs-Wert wurde als `(min + max) / 2` berechnet, was bei ungeraden Ranges (z. B. `[50, 300]` → Mitte `175`) korrekt ist, aber bei ungerader Range-Summe Kommazahlen erzeugt (z. B. `[25, 60]` → `42.5` statt `43`).

**Fix:**

```js
const mid = isFloat ? (min + max) / 2 : Math.round((min + max) / 2);
```

---

#### KLEIN-1 (Klein): Variablennamenskollision `hVal`/`hUnit` in `updateModSummary` ✅ behoben

**Datei:** `js/ui-controller.js` (`updateModSummary`)

**Problem:** Lokale Variablen `hVal` und `hUnit` wurden für HDL-Werte verwendet, aber der Präfix `h` wird konventionell für `height` verwendet — potenzielle Verwirrungsquelle bei späteren Anpassungen.

**Fix:** Umbenannt zu `hdlVal`/`hdlUnit`.

---

#### KLEIN-2 (Klein): Redundanter `lucide.createIcons()` in `onCompareScenario` ✅ behoben

**Datei:** `js/app.js`

**Problem:** `onCompareScenario` rief `lucide.createIcons()` auf, bevor `TimelineChart.setBaseline(risk)` aufgerufen wurde. `setBaseline` → `render()` → `renderLegend()` ruft `lucide.createIcons()` intern auf — der frühere Aufruf war redundant.

**Fix:** Redundanter Aufruf entfernt.

---

#### KLEIN-3 (Klein): Excel-Import setzt `_isMetric` nicht ✅ behoben

**Datei:** `js/patient-manager.js`

**Problem:** Beim Import aus Excel wurde kein `_isMetric`-Flag gesetzt, sodass `applyValues()` fälschlich davon ausging, dass das Profil im aktuellen Einheitensystem gespeichert wurde.

**Fix:** Excel-Import-Pfad setzt explizit `_isMetric: false` (Excel-Format enthält keine SI-Werte):

```js
_isMetric: false  // Excel format does not store unit system; assume SI=false (US)
```

---

### Positives (beibehalten / gut gelöst)

- **`_setCompareScenario`-Setter + `_getState()`-Kopie** — in Review 2/3 eingeführt, vollständig korrekt
- **SI-Only-Vergleiche in `getElevatedFactors()`** — stabil
- **`applyValues()` mit Einheitenkonversion** — implementiert in Review 3, korrekt angewendet in Review 4
- **Optional Chaining auf `updateSliderFill`** — aus Review 3, korrekt

### Verbleibende Architektur-Hinweise (kein Bug)

| Thema | Datei | Beschreibung |
|-------|-------|--------------|
| `convertField`-Guard bei multiplier=0 | `conversion-service.js:73` | `!multiplier` ist falsch-positiv bei Wert 0. Kein aktueller Bug (alle Faktoren > 0). |
| `isBaseline`-Flag in Timeline | `timeline-chart.js:47` | Gesetzt, aber nie gelesen — `render()` prüft `_baselineRisk !== null` direkt. Totes Attribut. |
| Waist-Range-Inkonsistenz | `config.js:78` | `us: [25, 60, 1]` → 25 Zoll = 63,5 cm, SI-Minimum = 64 cm. Beim Einheitenwechsel 0,5 cm Clamp. Klinisch irrelevant. |

---

## 3. Testabdeckung (Agent 3)

### Alle Tests grün: 509/509

### In diesem Review hinzugefügte Tests

#### `test-risk-model.js` — 15 neue Assertions (64 → 79)

| Test | Beschreibung |
|------|-------------|
| `fromSI()` — 7 Assertions | Inverse Konversion für alle 5 konvertierbaren Felder, Passthrough für nicht-konvertierbare, Rundtrip (toSI → fromSI = Original) |
| `getConversionFactor()` — 6 Assertions | Bekannte Faktoren (`height = 2.54`, `waist ≈ 2.54`, `fastGlu = 18.02`, `cholHDL ≈ 38.66`, `cholTri ≈ 88.57`), `null` für nicht-konvertierbare Felder (`age`) |
| Konversionstoleranzen verschärft | Von `0.01` auf `1e-9` (deterministische Multiplikation) |

#### `test-treatment-simulator.js` — 8 neue Assertions (37 → 45, Suite 8)

| Test | Beschreibung |
|------|-------------|
| `App._setCompareScenario` vorhanden | Funktion öffentlich zugänglich |
| `App._getState` vorhanden | Funktion öffentlich zugänglich |
| Initialzustand | `isComparingScenario = false`, `baselineRisk = null` |
| Erster `_setCompareScenario(42.5)` | Setzt `isComparingScenario = true`, `baselineRisk = 42.5` |
| Zweiter `_setCompareScenario(18.0)` | Überschreibt `baselineRisk = 18.0` |
| Mutation-Safety | `_getState()` gibt Kopie zurück — externe Mutation beeinflusst internen State nicht |

### Verbleibende Testlücken (niedrige Priorität)

| Lücke | Priorität | Begründung |
|-------|-----------|------------|
| `onCompareScenario()` Toggle-Logik (zweiter Aufruf → `isComparingScenario = false`) | Niedrig | App.js DOM-entangled, schwer isoliert testbar ohne Browser |
| `computeWhatIfDelta()` exakte Magnitude | Niedrig | Deterministische Funktion — Vorzeichen-Tests vorhanden |
| `_filterHandlerAttached` — Doppel-Listener-Schutz | Niedrig | Modul-Scope-Variable, nur im Browser testbar |

---

## Zusammenfassung der Änderungen in diesem Review

| Datei | Änderung | Schwere |
|-------|----------|---------|
| `js/ui-helpers.js` | `clampAndRound`: Dezimalstellen aus `step` ableiten statt `.toFixed(1)` | Hoch |
| `js/ui-controller.js` | `escapeHtml` zur Destrukturierung ergänzt | Mittel |
| `js/ui-controller.js` | `_filterHandlerAttached` als Modul-Scope-Variable statt DOM-Expando | Mittel |
| `js/ui-controller.js` | `updateSliderAxisLabels` — Achsenmittelwert für Integer-Ranges gerundet | Mittel |
| `js/ui-controller.js` | `renderTreatmentOverview` — `escapeHtml()` um `t.name` und `t.desc` | Mittel |
| `js/ui-controller.js` | `updateModSummary` — `hVal`/`hUnit` → `hdlVal`/`hdlUnit` | Klein |
| `js/app.js` | `onReset` delegiert an `PatientManager.applyValues()` — Unit-Konversion korrekt | Kritisch |
| `js/app.js` | Redundanter `lucide.createIcons()` in `onCompareScenario` entfernt | Klein |
| `js/patient-manager.js` | `applyValues` in Public API exportiert | Mittel |
| `js/patient-manager.js` | Excel-Import setzt `_isMetric: false` | Mittel |
| `tests/test-risk-model.js` | 15 neue Assertions: `fromSI()`, `getConversionFactor()`, engere Toleranzen | — |
| `tests/test-treatment-simulator.js` | Suite 8: 8 Assertions für `_setCompareScenario` + `_getState` | — |
