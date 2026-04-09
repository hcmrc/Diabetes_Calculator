# Dark Mode Fix - Implementierungsplan v2.0 (Korrigiert)

**Version:** 2.0  
**Datum:** 2026-04-02  
**Status:** Validierung erfolgt, bereit für Implementierung

---

## ZUSAMMENFASSUNG DER VALIDIERUNG

### Kritische Änderungen gegenüber v1.0:
1. **Task 1.1 entfernt**: `::root.dark` existiert nicht (bereits korrekt als `:root.dark`)
2. **Tasks 3.1-3.2 entfernt**: Bereits implementiert, nur `.dark` Selektor ergänzt
3. **Task 2.2 überarbeitet**: Event-Listener Logik korrigiert
4. **Task 3.4 erweitert**: `.btn-compare-scenario-section` hinzugefügt (fehlte im Plan)

---

## PHASE 1: Kritische CSS Fixes (Sofort)

### Task 1.1: Fehlende CSS Variablen ersetzen ✅
**Datei:** `style.css`  
**Zeilen:** 3551-3552  
**Änderung:**
```css
/* VON: */
.timeline-expandable-area {
    background: var(--bg-primary);
    border-bottom: 1px solid var(--border-light);
}

/* ZU: */
.timeline-expandable-area {
    background: var(--bg-page);
    border-bottom: 1px solid var(--border);
}
```

### Task 1.2: Hero Section Gradienten fixen ✅
**Datei:** `style.css`  
**Zeilen:** 494-503  
**Änderung:**
```css
/* VON: */
.hero-section[data-risk-level="safe"] {
    background: linear-gradient(180deg, rgba(48, 161, 78, 0.03) 0%, #ffffff 100%);
}
/* Analog für alert, warning, danger */

/* ZU: */
.hero-section[data-risk-level="safe"] {
    background: linear-gradient(180deg, rgba(48, 161, 78, 0.03) 0%, var(--bg-card) 100%);
}
.hero-section[data-risk-level="alert"] {
    background: linear-gradient(180deg, rgba(212, 148, 44, 0.04) 0%, var(--bg-card) 100%);
}
.hero-section[data-risk-level="warning"] {
    background: linear-gradient(180deg, rgba(212, 101, 58, 0.05) 0%, var(--bg-card) 100%);
}
.hero-section[data-risk-level="danger"] {
    background: linear-gradient(180deg, rgba(196, 61, 53, 0.06) 0%, var(--bg-card) 100%);
}
```

### Task 1.3: SVG Timeline Stroke-Farben fixen ✅
**Datei:** `style.css`  
**Zeilen:** 1888-1891, 1991  
**Änderung:**
```css
/* Light Mode - Zeilen 1888-1891 */
.tl-dot, .tl-dot-baseline, .tl-dot-treatment {
    stroke: var(--bg-card);  /* statt #fff */
}

/* Dark Mode Overrides hinzufügen - nach Zeile 4536 */
.dark .tl-dot,
.dark .tl-dot-baseline,
.dark .tl-dot-treatment,
.dark .timeline-dot {
    stroke: var(--bg-card);
}
```

### Task 1.4: Slider Track fixen ✅
**Datei:** `style.css`  
**Zeile:** 884  
**Änderung:**
```css
/* VON: */
.slider-track-bg {
    background: #e5e5ea;
}

/* ZU: */
.slider-track-bg {
    background: var(--border);
}
```

### Task 1.5: Toggle Switches fixen ✅
**Datei:** `style.css`  
**Zeilen:** 1018, 1030  
**Änderung:**
```css
/* Light Mode */
.toggle-slider {
    background: var(--border-strong);  /* statt #e5e5ea (Zeile 1018) */
}
.toggle-slider::before {
    background: var(--bg-card);  /* statt white (Zeile 1030) */
}

/* Dark Mode Overrides ergänzen */
.dark .toggle-slider {
    background: rgba(255, 255, 255, 0.2);
}
.dark .toggle-slider::before {
    background: var(--bg-card);
}
```

### Task 1.6: Causality Chain Nodes fixen ✅
**Datei:** `style.css`  
**Zeile:** 1200  
**Änderung:**
```css
/* VON: */
.chain-node {
    background: white;
}

/* ZU: */
.chain-node {
    background: var(--bg-card);
}
```

### Task 1.7: OCR Privacy Notice fixen ✅
**Datei:** `style.css`  
**Zeilen:** 5494-5499  
**Hinzufügen:**
```css
/* Nach Zeile 5499 hinzufügen */
.dark .ocr-privacy-notice {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-secondary);
}
```

---

## PHASE 2: JavaScript Fixes (Hoch)

### Task 2.1: Verwaisten Button-Selektor entfernen ✅
**Datei:** `js/dark-mode.js`  
**Zeilen:** 66, 78  
**Änderung:**
```javascript
// VON:
const toggleBtns = document.querySelectorAll('#darkModeToggle, #settingsDarkModeBtn');

// ZU:
const toggleBtns = document.querySelectorAll('#settingsDarkModeBtn');
```

### Task 2.2: Icon-Refresh redundant entfernen ✅
**Datei:** `js/settings-panel.js`  
**Zeilen:** 474-476  
**Änderung:**
```javascript
// ENTFERNEN:
// if (window.lucide) { lucide.createIcons(); }
// Der dark-mode.js ruft bereits refreshIcons() auf
```

### Task 2.3: Defensiver Check für Dark Mode Button ✅ (NEU)
**Datei:** `js/settings-panel.js`  
**In der init() Funktion ergänzen:**
```javascript
// Nach Zeile ~119 (wo _darkModeBtn definiert wird)
if (_darkModeBtn && DRC.DarkMode && typeof DRC.DarkMode.isDark === 'function') {
    _updateDarkModeButtonState();
}
```

---

## PHASE 3: Button Fixes (Mittel)

### Task 3.1: Language Button - .dark Selektor ergänzen ✅ (KORRIGIERT)
**Datei:** `style.css`  
**Nach Zeile 3837 hinzufügen:**
```css
/* Nur .dark Selektoren hinzufügen (existieren bereits für [data-theme="dark"]) */
.dark .btn-language {
    background: rgba(255, 255, 255, 0.06);
    color: var(--text-secondary);
}
.dark .btn-language:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
}
/* active/expanded states fehlen auch für .dark */
.dark .btn-language:active,
.dark .btn-language[aria-expanded="true"] {
    background: rgba(255, 255, 255, 0.14);
    color: var(--text-primary);
}
```

### Task 3.2: Restart Setup Button - .dark Selektor ergänzen ✅ (KORRIGIERT)
**Datei:** `style.css`  
**Nach Zeile 4052 hinzufügen:**
```css
/* Nur .dark Selektoren hinzufügen */
.dark .btn-restart-setup {
    background: rgba(255, 255, 255, 0.06);
    border-color: var(--border);
    color: var(--text-secondary);
}
.dark .btn-restart-setup:hover {
    border-color: var(--border-strong);
    color: var(--text-primary);
}
/* active state fehlt auch für .dark */
.dark .btn-restart-setup:active {
    background: rgba(255, 255, 255, 0.14);
    transform: translateY(0);
}
```

### Task 3.3: Snapshot Button Dark Mode ✅
**Datei:** `style.css`  
**Nach Zeile 1960 hinzufügen:**
```css
.dark .btn-snapshot,
[data-theme="dark"] .btn-snapshot {
    color: var(--blue);
    background: var(--blue-light);
}
.dark .btn-snapshot:hover,
[data-theme="dark"] .btn-snapshot:hover {
    background: var(--blue-glow);
}
```

### Task 3.4: Compare Scenario Button - Beide Varianten ✅ (KORRIGIERT/ERWEITERT)
**Datei:** `style.css`  
**Hinzufügen:**

```css
/* Inline Version */
.dark .btn-compare-scenario-inline,
[data-theme="dark"] .btn-compare-scenario-inline {
    color: var(--blue);
    background: var(--blue-light);
}
.dark .btn-compare-scenario-inline:hover,
[data-theme="dark"] .btn-compare-scenario-inline:hover {
    background: var(--blue-glow);
}
.dark .btn-compare-scenario-inline.active,
[data-theme="dark"] .btn-compare-scenario-inline.active {
    background: var(--blue);
    color: white;
}
.dark .btn-compare-scenario-inline.active .lucide-icon,
[data-theme="dark"] .btn-compare-scenario-inline.active .lucide-icon {
    color: white !important;
}

/* Section Version - KRITISCH FEHLEND IM ORIGINAL */
.dark .btn-compare-scenario-section,
[data-theme="dark"] .btn-compare-scenario-section {
    color: var(--blue);
    background: var(--blue-light);
    border-color: rgba(255, 255, 255, 0.1);
}
.dark .btn-compare-scenario-section:hover,
[data-theme="dark"] .btn-compare-scenario-section:hover {
    background: var(--blue-glow);
    border-color: rgba(255, 255, 255, 0.15);
}
.dark .btn-compare-scenario-section.active,
[data-theme="dark"] .btn-compare-scenario-section.active {
    background: var(--blue);
    color: white;
    border-color: var(--blue);
}
.dark .btn-compare-scenario-section.active .lucide-icon,
[data-theme="dark"] .btn-compare-scenario-section.active .lucide-icon {
    color: white !important;
}
```

---

## PHASE 4: Komponenten Fixes (Mittel)

### Task 4.1: Info Icon Tooltip fixen ✅
**Datei:** `style.css`  
**Zeile 1112 ändern:**
```css
/* VON: */
.info-icon[data-tooltip]:hover::after {
    color: white;
}

/* ZU: */
.info-icon[data-tooltip]:hover::after {
    color: var(--text-primary);
}
```

### Task 4.2: Model Switcher Dropdown fixen ✅
**Datei:** `style.css`  
**Zeilen 6111-6114:**
```css
/* VON: */
.model-switcher-dropdown {
    background: var(--card-bg, #fff);  /* Fallback entfernen */
    border: 1px solid var(--border, #e5e7eb);  /* Fallback entfernen */
    box-shadow: 0 8px 30px rgba(0,0,0,0.12);  /* hardcoded */
}

/* ZU: */
.model-switcher-dropdown {
    background: var(--bg-card);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-lg);
}

/* Dark Mode hinzufügen */
.dark .model-switcher-dropdown {
    background: var(--bg-card);
    border-color: var(--border-strong);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
}
```

---

## TEST-PLAN

### Vor jedem Commit:
1. **CSS Syntax Check:** Keine Syntaxfehler
2. **Visual Check:** Alle Komponenten im Dark Mode vergleichen

### Nach Phase 1:
- [ ] Timeline Bereich prüfen
- [ ] Hero Section Gradienten prüfen
- [ ] Slider Tracks prüfen
- [ ] Toggle Switches prüfen
- [ ] Causality Chain Nodes prüfen

### Nach Phase 2:
- [ ] Dark Mode Toggle 10x schnell klicken
- [ ] Seite neu laden im Dark Mode
- [ ] System Dark Mode ändern während App geöffnet

### Nach Phase 3:
- [ ] Snapshot Button im Dark Mode
- [ ] Compare Scenario Buttons (beide Varianten)
- [ ] Language Button active/expanded States
- [ ] Restart Setup Button active State

### Nach Phase 4:
- [ ] Info Icon Tooltip
- [ ] Model Switcher Dropdown

### Finale Tests:
- [ ] Alle 556 Tests laufen lassen: `node tests/test-*.js`
- [ ] Keine JavaScript Fehler in Konsole
- [ ] Keine visuellen Regressionen

---

## ROLLBACK-PLAN

### Checkpoint-Commits:
```bash
# Nach Phase 1:
git add style.css
git commit -m "checkpoint: darkmode-phase-1-css-fixes"

# Nach Phase 2:
git add js/dark-mode.js js/settings-panel.js
git commit -m "checkpoint: darkmode-phase-2-js-fixes"

# Nach Phase 3:
git add style.css
git commit -m "checkpoint: darkmode-phase-3-button-fixes"

# Nach Phase 4:
git add style.css
git commit -m "checkpoint: darkmode-phase-4-component-fixes"
```

### Emergency-Rollback:
```bash
# Kompletter Rollback:
git checkout main -- style.css js/dark-mode.js js/settings-panel.js

# Optional: localStorage zurücksetzen
localStorage.removeItem('drc-theme-preference')
```

---

## ABHÄNGIGKEITEN

- Keine externen Dependencies
- Muss mit bestehendem `DRC.DarkMode` Modul funktionieren
- Muss mit `file://` Protokoll funktionieren
- Keine Änderungen an `CONFIG.BETAS`, `CONFIG.MEANS`, etc.

---

## ÄNDERUNGEN GEGENÜBER v1.0

| Task v1.0 | Status v2.0 | Begründung |
|-----------|-------------|------------|
| Task 1.1 | **ENTFERNT** | Bereits korrekt als `:root.dark` |
| Task 2.2 | **ÜBERARBEITET** | Event-Listener Logik korrigiert |
| Task 3.1 | **REDUZIERT** | Nur `.dark` Selektor ergänzt |
| Task 3.2 | **REDUZIERT** | Nur `.dark` Selektor ergänzt |
| Task 3.4 | **ERWEITERT** | Section-Variante hinzugefügt |
| Task 2.3 | **NEU** | Defensiver Check hinzugefügt |
