# Prompt: Schmidt et al. (2005) Multi-Modell-Switcher

## Kontext

Das bestehende Dashboard ist eine Vanilla-JS-Anwendung (kein Framework) im Namespace `DRC`, bestehend aus `index.html`, `style.css` und Modulen in `js/`. Es implementiert aktuell nur **Modell 4** (Clinical + Glucose + Lipids) aus Schmidt et al. (2005). Die Architektur folgt dem Pattern: `config.js → risk-model.js → app.js → ui-controller.js`. `CONFIG` ist per `Object.freeze()` immutable. Script-Ladereihenfolge in `index.html` ist kritisch und darf nicht verändert werden.

## Ziel

Erweitere das Dashboard um einen **Modell-Switcher-Button** in der Nav-Bar, über den zwischen allen drei Vorhersagemodellen aus Schmidt et al. (2005) gewechselt werden kann. Das gesamte Interface passt sich dynamisch an das gewählte Modell an. **Keine Landing Page, kein Overlay, keine Rollenauswahl** — nur ein Button/Dropdown in der bestehenden Nav-Bar.

## Die drei Modelle aus Schmidt et al. (2005), Table 1

**Vor Implementierung: Lies die Schmidt et al. (2005) Studie (liegt im Projektordner) und validiere die hier präsentierten Koeffizienten gegen Table 1 der Publikation.**

### Modell 1 — Clinical variables only (Vorhersagegüte: Basis)

- Formel: `Pr(DM) = 1/(1 + e^-x)`, wobei `x = -7.3359 + 0.0271×age + 0.2295×black + 0.5463×parentalHistory + 0.0161×SBP + 0.0412×waist - 0.0115×height`
- Prädiktoren: `age, race, parentHist, sbp, waist, height`
- Keine Laborwerte nötig

### Modell 3 — Clinical + Fasting glucose (Vorhersagegüte: Gut)

- Formel: `x = -12.2555 + 0.0168×age + 0.2631×black + 0.5088×parentalHistory + 1.6445×fastGlu(mmol/L) + 0.0120×SBP + 0.0328×waist - 0.0261×height`
- Prädiktoren: `age, race, parentHist, sbp, waist, height, fastGlu`
- Hinweis: Koeffizient für fastGlu in mg/dL = 0.0913

### Modell 4 — Clinical + Glucose + Lipids (Vorhersagegüte: Beste) ← aktuell implementiert

- Formel: `x = -9.9808 + 0.0173×age + 0.4433×black + 0.4981×parentalHistory + 0.0111×SBP + 0.0273×waist - 0.0326×height + 1.5849×fastGlu(mmol/L) - 0.4718×cholHDL(mmol/L) + 0.2420×cholTri(mmol/L)`
- Prädiktoren: alle 9 Variablen (`age, race, parentHist, sbp, waist, height, fastGlu, cholHDL, cholTri`)
- Hinweis: Koeffizienten für mg/dL: fastGlu=0.0880, cholHDL=0.0122, cholTri=0.00271

---

## Phase 0: Analyse & Datenstruktur

### Schritt 1 — MODELS-Datenstruktur in config.js

Definiere `DRC.CONFIG.MODELS` als neues frozen Object innerhalb des bestehenden `Object.freeze()`. Jedes Modell enthält:

```javascript
MODELS: {
    clinical: {
        id: 'clinical',
        name: 'Clinical Only',
        description: 'Nur Körpermaße & Demografie, kein Bluttest nötig',
        accuracy: 'basis',          // Vorhersagegüte: Basis
        accuracyLabel: 'Basis',     // UI-Anzeigetext
        intercept: -7.3359,
        betas: { age: 0.0271, race: 0.2295, parentHist: 0.5463, sbp: 0.0161, waist: 0.0412, height: -0.0115 },
        fields: ['age', 'sex', 'race', 'parentHist', 'sbp', 'height', 'waist'],
        sliderFields: ['age', 'sbp', 'height', 'waist'],
        treatmentFields: ['sbp', 'waist'],
        radarFields: ['sbp', 'waist', 'age'],  // nur 3 Achsen — Minimum für Radar
    },
    clinicalGlucose: {
        id: 'clinicalGlucose',
        name: 'Clinical + Glucose',
        description: 'Klinische Werte plus Nüchternglukose',
        accuracy: 'gut',            // Vorhersagegüte: Gut
        accuracyLabel: 'Gut',
        intercept: -12.2555,
        betas: { age: 0.0168, race: 0.2631, parentHist: 0.5088, sbp: 0.0120, waist: 0.0328, height: -0.0261, fastGlu: 1.6445 },
        fields: ['age', 'sex', 'race', 'parentHist', 'sbp', 'height', 'waist', 'fastGlu'],
        sliderFields: ['age', 'sbp', 'height', 'waist', 'fastGlu'],
        treatmentFields: ['fastGlu', 'sbp', 'waist'],
        radarFields: ['fastGlu', 'sbp', 'waist', 'age'],
    },
    clinicalGlucoseLipids: {
        id: 'clinicalGlucoseLipids',
        name: 'Clinical + Glucose + Lipids',
        description: 'Vollständiges Modell mit allen Laborwerten',
        accuracy: 'beste',          // Vorhersagegüte: Beste
        accuracyLabel: 'Beste',
        intercept: -9.9808,
        betas: { age: 0.0173, race: 0.4433, parentHist: 0.4981, sbp: 0.0111, waist: 0.0273, height: -0.0326, fastGlu: 1.5849, cholHDL: -0.4718, cholTri: 0.242 },
        fields: ['age', 'sex', 'race', 'parentHist', 'sbp', 'height', 'waist', 'fastGlu', 'cholHDL', 'cholTri'],
        sliderFields: ['age', 'sbp', 'height', 'waist', 'fastGlu', 'cholHDL', 'cholTri'],
        treatmentFields: ['fastGlu', 'sbp', 'cholHDL', 'cholTri', 'waist'],
        radarFields: ['fastGlu', 'sbp', 'cholTri', 'waist', 'cholHDL', 'age'],
    }
}
```

Dazu `DEFAULT_MODEL: 'clinicalGlucoseLipids'` als Startmodell (Rückwärtskompatibilität).

**Wichtig:** Die bestehenden `CONFIG.BETAS` und `CONFIG.MEANS` NICHT entfernen — sie bleiben als Referenz und Fallback. `MODELS[x].betas` enthält die modellspezifischen Koeffizienten. `CONFIG.MEANS` wird von allen Modellen geteilt (gleiche ARIC-Kohorte).

### Schritt 2 — State-Management in app.js

Erweitere `state` um `activeModel`:

```javascript
const state = {
    isMetric: false,
    prevRiskPct: null,
    activeField: null,
    baselineRisk: null,
    isComparingScenario: false,
    preciseSI: null,
    activeModel: DRC.CONFIG.DEFAULT_MODEL  // NEU
};
```

Neue Methoden:
- `getActiveModel()` → gibt das aktuelle `MODELS[state.activeModel]` Objekt zurück
- `switchModel(modelId)` → validiert modelId, setzt `state.activeModel`, triggert UI-Update und Neuberechnung, feuert Event `'model:changed'`

### Schritt 3 — Refactoring risk-model.js

`linearPredictor()` muss modellabhängig werden. Statt hardcodierte Felder zu iterieren, nutzt es das aktive Modell:

```javascript
const linearPredictor = (si, model) => {
    let lp = model.intercept;
    for (const [key, beta] of Object.entries(model.betas)) {
        lp += beta * si[key];
    }
    return lp;
};
```

Alle Funktionen, die `B` (BETAS) nutzen, erhalten einen optionalen `model`-Parameter:
- `computeProbability(siVals, model)` — model defaults auf aktives Modell
- `computeContributions(siVals, model)` — iteriert nur über `model.betas`
- `computeMarginalContributions(siVals, model)` — ditto
- `computeMarginalSummary(siVals, model)` — ditto
- `computeBaselineRisk(model)` — nutzt `model.intercept` und `model.betas`
- `getElevatedFactors(siVals, isMale)` — bleibt unverändert (prüft nur Schwellenwerte, nicht Modellzugehörigkeit). Der Aufrufer filtert danach nach `model.treatmentFields`

**Rückwärtskompatibilität:** Wenn `model` nicht übergeben wird, nutze `DRC.CONFIG.MODELS[DRC.App._getState().activeModel]` oder falle auf `clinicalGlucoseLipids` zurück. Damit bleiben bestehende Aufrufe ohne Anpassung funktionsfähig.

---

## Phase 1: Modell-Switcher UI

### Schritt 4 — Modell-Switcher Button in der Nav-Bar

In `index.html`, innerhalb `.nav-actions` (neben `unit-toggle`, `darkModeToggle`, `resetBtn`, `timelineToggleBtn`, `patientMenuBtn`), einen neuen Button einfügen:

```html
<!-- Model Switcher -->
<div class="model-switcher-wrapper">
    <button id="modelSwitcherBtn" type="button" class="btn-model-switcher" aria-label="Switch prediction model" aria-haspopup="true" aria-expanded="false">
        <i data-lucide="layers" class="lucide-icon"></i>
        <span class="model-switcher-label" id="modelSwitcherLabel">Full Model</span>
        <i data-lucide="chevron-down" class="lucide-icon model-switcher-chevron"></i>
    </button>
    <div id="modelSwitcherDropdown" class="model-switcher-dropdown" role="menu" hidden>
        <!-- Dynamisch befüllt durch JS -->
    </div>
</div>
```

**Position:** Links vom Patient-Management-Button, visuell ähnlich gestaltet wie `patientMenuBtn` (gleiche Button-Klasse, Chevron-Pattern).

### Schritt 5 — Dropdown-Inhalt und Logik

Das Dropdown wird beim Klick auf `modelSwitcherBtn` geöffnet/geschlossen. Inhalt pro Modell:

```
┌──────────────────────────────────────────┐
│ ● Clinical Only              ◌ Basis     │
│   Age, BP, Waist, Height                 │
│──────────────────────────────────────────│
│   Clinical + Glucose         ◑ Gut       │
│   + Fasting Glucose                      │
│──────────────────────────────────────────│
│   Full Model (all labs)      ● Beste     │
│   + HDL, Triglycerides         ← aktiv   │
└──────────────────────────────────────────┘
```

- Aktives Modell wird visuell hervorgehoben (z.B. Hintergrund `var(--accent)` mit Opacity, Check-Icon)
- Vorhersagegüte als farbige Badge rechts (z.B. Basis=grau, Gut=gelb/orange, Beste=grün). Die Kreissymbole (◌ ◑ ●) visualisieren die Genauigkeit intuitiv
- Unter dem Modellnamen die enthaltenen Prädiktoren in Kurzform auflisten
- Klick auf ein Modell → `DRC.App.switchModel(modelId)` → Dropdown schließt sich
- Außenklick schließt Dropdown (Event-Delegation auf `document`)

### Schritt 6 — CSS für Model Switcher

In `style.css` neue Klassen, konsistent mit dem bestehenden Design:
- `.btn-model-switcher` — gleicher Stil wie `.btn-patient-menu`
- `.model-switcher-dropdown` — gleicher Stil wie Patient-Dropdown (absolute positioniert, Box-Shadow, Border-Radius)
- `.model-option` — Hover/Active-States
- `.model-option.active` — Hervorhebung
- `.model-accuracy-badge` — farbige Pill für Vorhersagegüte (Basis=grau `#8e8e93`, Gut=orange `#ff9f0a`, Beste=grün `#34c759`)
- Dark-Mode-Varianten über `[data-theme="dark"]` Selektoren (analog zu bestehendem Pattern in `dark-mode.js`)

---

## Phase 2: Dashboard-Anpassungen beim Modellwechsel

### Schritt 7 — Dynamische Sichtbarkeit der Input-Gruppen

Beim Modellwechsel (`switchModel()`):

1. **Patient Data (col-left, `#panel-input`):** Nur Slider/Toggles für Variablen im aktiven Modell anzeigen.
   - Jede `input-group` hat bereits `data-field="..."` Attribute
   - Felder, die NICHT im aktiven `model.fields` sind → `display: none` via CSS-Klasse `.field-hidden`
   - `readInputs()` in `ui-controller.js` liest weiterhin alle Felder, aber `risk-model.js` nutzt nur die des aktiven Modells
   - Felder die nicht im Modell sind, werden auf `CONFIG.MEANS` gesetzt (für interne Berechnung irrelevant, da `linearPredictor` nur über `model.betas` iteriert)

2. **Risk Factors (col-center, `#panel-model`):**
   - **Contributions-Tab:** `renderContributionChart()` bekommt nur Beiträge für Felder im aktiven Modell. Filtere `marginalSummary.contributions` vor dem Rendern.
   - **Radar-Tab:** `RadarChart` nur mit `model.radarFields`. Bei weniger als 3 Achsen (kommt bei keinem der drei Modelle vor, da Clinical min. 3 hat) → Tab ausblenden. Radar-Chart muss die dynamische Achsenanzahl unterstützen.
   - **Connections-Tab:** `CAUSALITY_CHAINS` filtern — nur Chains anzeigen, deren `factors` im aktiven Modell enthalten sind.

3. **What Can I Do? (col-right, `#panel-treatment`):**
   - `renderTreatmentOverview()` nur mit Treatments, deren Faktor in `model.treatmentFields` enthalten ist.
   - `TreatmentSimulator` nur für aktive modifizierbare Faktoren — `SIMULATION_EFFECTS` nach `model.treatmentFields` filtern.

4. **Hero Section:** Modellname und Vorhersagegüte klein unter "9-Year Diabetes Risk" anzeigen.
   - Beispiel: `<span class="model-info">Clinical + Glucose + Lipids · Beste Vorhersagegüte</span>`
   - Aktualisiert sich bei Modellwechsel

### Schritt 8 — Anpassung von app.js calculate()

`calculate()` muss das aktive Modell an alle Model-Funktionen weiterreichen:

```javascript
const calculate = () => {
    const model         = DRC.CONFIG.MODELS[state.activeModel];
    const rawInputs     = UI().readInputs();
    const siVals        = Model().toSI(rawInputs, state.isMetric);
    state.preciseSI     = { ...siVals };
    const riskPct       = Model().computeProbability(siVals, model) * 100;
    const logOddsContributions = Model().computeContributions(siVals, model);
    const marginalSummary = Model().computeMarginalSummary(siVals, model);
    const isMale        = rawInputs.sex === 1;
    const treatStatus   = Model().getElevatedFactors(siVals, isMale);
    // ... render mit Modell-Filterung
};
```

### Schritt 9 — patient-manager.js Anpassung

- Beim Speichern eines Profils: `activeModel` mitspeichern
- Beim Laden eines Profils: `activeModel` wiederherstellen via `DRC.App.switchModel()`
- Legacy-Daten ohne `activeModel` → Default auf `clinicalGlucoseLipids`

---

## Phase 3: Validierung & Tests

### Schritt 10 — Validierung gegen Schmidt et al. (2005)

Für jedes der 3 Modelle Testfälle prüfen:
- Intercept und alle Betas korrekt implementiert
- Berechne Wahrscheinlichkeit bei Populationsmittelwerten (`CONFIG.MEANS`) — dient als Sanity Check
- Clinical only: Bei Cut-Point Pr(DM) >= 0.23 → Sensitivity ~40% (nur zur Orientierung, nicht exakt prüfbar ohne Kohorte)
- Prüfe dass Modell 4 (`clinicalGlucoseLipids`) identische Ergebnisse liefert wie vor dem Refactoring

### Schritt 11 — Test-Suite erweitern

In `tests/test-risk-model.js` neue Tests hinzufügen:
- Für jedes Modell: `linearPredictor` mit bekannten Inputs gegen erwarteten Output
- Modellwechsel: Prüfe dass `computeProbability` bei gleichem Input unterschiedliche Werte je nach Modell liefert
- Rückwärtskompatibilität: Alle bestehenden Tests müssen weiterhin grün sein (aktuell 476 Tests)
- Edge Cases: Modellwechsel während laufender Treatment-Simulation

---

## Agentenaufteilung (alle auf Sonnet)

| Agent | Aufgabe | Fokus-Dateien |
|-------|---------|---------------|
| **Architect** | MODELS-Datenstruktur in config.js, Refactoring risk-model.js (modellabhängiger linearPredictor), State-Management in app.js (state.activeModel, switchModel) | `js/config.js`, `js/risk-model.js`, `js/app.js` |
| **UI/Integration** | Modell-Switcher Button HTML/CSS, Dropdown-Logik, Sichtbarkeits-Toggling der Input-Groups, Filterung in renderContributionChart/renderTreatmentOverview/renderCausalityChains, patient-manager.js Anpassung, Hero-Section Modellinfo | `index.html`, `style.css`, `js/ui-controller.js`, `js/patient-manager.js`, `js/treatment-simulator.js`, `js/radar-chart.js` |
| **Validation** | Prüft Koeffizienten gegen Publikation, erweitert test-risk-model.js, stellt sicher dass alle 476+ Tests grün bleiben | `js/risk-model.js`, `tests/test-risk-model.js` |

### Arbeitsablauf

1. Architect startet zuerst (MODELS-Struktur + risk-model.js Refactoring)
2. UI/Integration startet sobald MODELS-Struktur definiert ist
3. Validation Agent prüft nach jeder Phase
4. Token-sparend: Agents bekommen nur die relevanten Dateien

---

## Wichtige Randbedingungen

- **Vanilla JS** — kein React/Vue/Angular. Namespace `DRC.*`
- **Object.freeze()** — CONFIG ist immutable. `MODELS` muss innerhalb des freeze() definiert werden oder als separates gefrorenes Objekt (`DRC.CONFIG_MODELS = Object.freeze({...})` falls der bestehende freeze-Block nicht einfach erweiterbar ist)
- **Script-Ladereihenfolge NICHT ändern** — siehe `memory/CODEBASE_MEMORY.md`
- **Bestehende Tests nicht brechen** — 476 Tests müssen grün bleiben
- **CONFIG.BETAS und CONFIG.MEANS NICHT entfernen** — sie bleiben als Referenz (Modell 4 = Default)
- **patient-manager.js** muss das aktive Modell pro Profil mitspeichern
- **Dark Mode** (`dark-mode.js`) muss für neue UI-Elemente (Dropdown, Model-Info Badge) funktionieren
- **Radar-Chart:** Clinical-Only hat nur 3 radarFields — muss als Dreieck statt Hexagon rendern
- **Treatment-Simulator:** Bei Clinical-Only sind nur `sbp` und `waist` simulierbar
- **`file://` Kompatibilität** — kein Server voraussetzen, keine ES-Module
- **CAUSALITY_CHAINS:** `riskNode`-Index und `.risk-node` CSS-Klasse beachten bei Filterung
