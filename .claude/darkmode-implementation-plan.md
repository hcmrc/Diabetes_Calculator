# Dark Mode Fix - Implementierungsplan

**Version:** 1.0  
**Datum:** 2026-04-02  
**Status:** Validierung erforderlich

---

## ZIEL

Alle kritischen Dark Mode Probleme beheben, sodass alle Buttons und das gesamte Interface im Dark Mode korrekt invertiert werden.

---

## PHASE 1: Kritische CSS Fixes (Sofort - Blocker)

### Task 1.1: CSS Syntaxfehler beheben
**Datei:** `style.css`  
**Zeile:** 4404  
**Änderung:**
```css
/* VON: */
::root.dark {

/* ZU: */
:root.dark {
```

### Task 1.2: Fehlende CSS Variablen ersetzen
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

### Task 1.3: Hero Section Gradienten fixen
**Datei:** `style.css`  
**Zeilen:** 494-503  
**Änderung:**
```css
/* VON: */
.hero-section[data-risk-level="safe"] {
    background: linear-gradient(180deg, rgba(48, 161, 78, 0.03) 0%, #ffffff 100%);
}

/* ZU: */
.hero-section[data-risk-level="safe"] {
    background: linear-gradient(180deg, rgba(48, 161, 78, 0.03) 0%, var(--bg-card) 100%);
}
/* (Analog für alert, warning, danger) */
```

### Task 1.4: SVG Timeline Stroke-Farben fixen
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

### Task 1.5: Slider Track fixen
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

### Task 1.6: Toggle Switches fixen
**Datei:** `style.css`  
**Zeilen:** 1018, 1030  
**Änderung:**
```css
/* Light Mode */
.toggle-slider {
    background: var(--border-strong);  /* statt #e5e5ea */
}
.toggle-slider::before {
    background: var(--bg-card);  /* statt white */
}

/* Dark Mode Overrides ergänzen */
.dark .toggle-slider {
    background: rgba(255, 255, 255, 0.2);
}
.dark .toggle-slider::before {
    background: var(--bg-card);
}
```

### Task 1.7: Causality Chain Nodes fixen
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

### Task 1.8: OCR Privacy Notice fixen
**Datei:** `style.css`  
**Zeilen:** 5494-5499  
**Änderung:**
```css
/* Hinzufügen nach Zeile 5499 */
.dark .ocr-privacy-notice {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-secondary);
}
```

---

## PHASE 2: JavaScript Fixes (Hoch)

### Task 2.1: Verwaisten Button-Selektor entfernen
**Datei:** `js/dark-mode.js`  
**Zeilen:** 66, 78  
**Änderung:**
```javascript
// VON:
const toggleBtns = document.querySelectorAll('#darkModeToggle, #settingsDarkModeBtn');

// ZU:
const toggleBtns = document.querySelectorAll('#settingsDarkModeBtn');
```

### Task 2.2: Race Condition beheben
**Datei:** `js/settings-panel.js`  
**Zeilen:** 526-531  
**Änderung:**
```javascript
// In der init() Funktion ergänzen:
if (DRC.DarkMode && DRC.DarkMode.getTheme) {
    _updateDarkModeButtonState();
} else {
    // Warte auf DarkMode Initialisierung
    window.addEventListener('darkmode:change', () => {
        _updateDarkModeButtonState();
    }, { once: true });
}
```

### Task 2.3: Doppelten Icon-Refresh entfernen
**Datei:** `js/settings-panel.js`  
**Zeilen:** 474-476  
**Änderung:**
```javascript
// ENTFERNEN:
// if (window.lucide) { lucide.createIcons(); }
// Der dark-mode.js ruft bereits refreshIcons() auf
```

---

## PHASE 3: Button Fixes (Mittel)

### Task 3.1: Language Button Dark Mode
**Datei:** `style.css`  
**Nach Zeile:** 3828  
**Hinzufügen:**
```css
.dark .btn-language,
[data-theme="dark"] .btn-language {
    background: rgba(255, 255, 255, 0.06);
    color: var(--text-secondary);
}

.dark .btn-language:hover,
[data-theme="dark"] .btn-language:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
}
```

### Task 3.2: Restart Setup Button Dark Mode
**Datei:** `style.css`  
**Nach Zeile:** 4048  
**Hinzufügen:**
```css
.dark .btn-restart-setup,
[data-theme="dark"] .btn-restart-setup {
    background: var(--bg-elevated);
    border-color: var(--border);
    color: var(--text-secondary);
}

.dark .btn-restart-setup:hover,
[data-theme="dark"] .btn-restart-setup:hover {
    border-color: var(--border-strong);
    color: var(--text-primary);
}
```

### Task 3.3: Snapshot Button Dark Mode
**Datei:** `style.css`  
**Nach Zeile:** 1960  
**Hinzufügen:**
```css
.dark .btn-snapshot,
[data-theme="dark"] .btn-snapshot {
    color: var(--primary);
    background: var(--primary-light);
}

.dark .btn-snapshot:hover,
[data-theme="dark"] .btn-snapshot:hover {
    background: var(--primary-glow);
}
```

### Task 3.4: Compare Scenario Button Dark Mode
**Datei:** `style.css`  
**Nach Zeile:** 2760  
**Hinzufügen:**
```css
.dark .btn-compare-scenario-inline,
[data-theme="dark"] .btn-compare-scenario-inline {
    color: var(--primary);
    background: var(--primary-light);
}

.dark .btn-compare-scenario-inline:hover,
[data-theme="dark"] .btn-compare-scenario-inline:hover {
    background: var(--primary-glow);
}

.dark .btn-compare-scenario-inline.active,
[data-theme="dark"] .btn-compare-scenario-inline.active {
    background: var(--primary);
    color: white;
}
```

---

## PHASE 4: Komponenten Fixes (Mittel)

### Task 4.1: Info Icon Tooltip fixen
**Datei:** `style.css`  
**Zeilen:** 1113, 1134  
**Änderung:**
```css
/* Tooltip Content - Zeile 1113 */
.info-icon[data-tooltip]:hover::after {
    color: var(--text-primary);  /* statt white */
}

/* Tooltip Arrow - Zeile 1134 */
.info-icon[data-tooltip]:hover::before {
    border-top-color: var(--bg-card);  /* statt white */
}
```

### Task 4.2: Model Switcher Dropdown fixen
**Datei:** `style.css`  
**Zeilen:** 6111-6136  
**Änderung:**
```css
/* Fallbacks entfernen oder anpassen */
.model-switcher-dropdown {
    background: var(--bg-card);  /* kein Fallback */
    border: 1px solid var(--border);
    box-shadow: var(--shadow-lg);  /* Variable statt hardcoded */
}

/* Dark Mode ergänzen */
.dark .model-switcher-dropdown {
    background: var(--bg-card);
    border-color: var(--border-strong);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
}
```

---

## PHASE 5: Polish (Niedrig)

### Task 5.1: Inkonsistente Selektoren vereinheitlichen
**Empfehlung:** Alle `[data-theme="dark"]` Selektoren auch als `.dark` definieren für konsistentes Verhalten

### Task 5.2: Verbleibende hartkodierte Farben bereinigen
**Datei:** Durchgängig in style.css  
**Empfehlung:** Alle `#fff`, `white`, `#ffffff` durch `var(--bg-card)` ersetzen

---

## TEST-PLAN

### Vor dem Merge
1. **CSS Syntax Check:** `::root.dark` → `:root.dark`
2. **Visual Check:** Alle Screenshots im Dark Mode vergleichen
3. **Button Check:** Jeder Button in Dark Mode klicken
4. **Toggle Test:** Dark Mode 10x schnell toggeln
5. **Refresh Test:** Seite neu laden im Dark Mode

### Automatisierte Tests
1. Alle 556 Tests müssen weiterhin grün sein
2. Dark Mode spezifische Tests hinzufügen (optional)

---

## ROLLBACK-PLAN

Falls Probleme auftreten:
1. CSS Änderungen rückgängig machen
2. JavaScript Änderungen rückgängig machen
3. Auf letzte bekannte funktionierende Version zurücksetzen

---

## ABHÄNGIGKEITEN

- Keine externen Dependencies
- Muss mit bestehendem `DRC.DarkMode` Modul funktionieren
- Muss mit `file://` Protokoll funktionieren
