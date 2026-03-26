# Diabetes Calculator — Comprehensive Refactoring Plan

> **Datum:** 2026-03-26
> **Agent:** Claude Code
> **Status:** Review Complete, Plan Approved

---

## Executive Summary

Basierend auf Code-Reviews durch 4 spezialisierte Agenten wurden **41 Issues** identifiziert:

| Severity | Count |
|----------|-------|
| Critical | 2 |
| High | 5 |
| Medium | 14 |
| Low | 20 |

### Top-Level Ziele

1. **Sicherheit:** XSS-Vulnerabilities eliminieren
2. **Performance:** Globale Event-Handler optimieren
3. **Maintainability:** Code-Duplizierung reduzieren
4. **Zuverlässigkeit:** Fehlerbehandlung standardisieren

---

## Phase 1: Sicherheitskritische Fixes

### Task 1.1: XSS-Schutz in ui-controller.js

**Files:**
- Modify: `js/ui-controller.js`

**Issues:**
- `innerHTML` mit interpolierten Werten (Lines 247-265, 268-277, 280-291, 340-368, 468-495, 677-695)
- Benutzerdaten werden nicht escaped

**Implementation:**

```javascript
// BEFORE (vulnerable):
element.innerHTML = `
    <span class="risk">${pFullPct}%</span>
    <span>${comparisonWord}</span>
`;

// AFTER (safe):
const riskSpan = document.createElement('span');
riskSpan.className = 'risk';
riskSpan.textContent = `${pFullPct}%`;
const comparisonSpan = document.createElement('span');
comparisonSpan.textContent = comparisonWord;
element.append(riskSpan, comparisonSpan);
```

**Steps:**
- [ ] Erstelle DOM-Builder-Funktionen für wiederholte Patterns
- [ ] Ersetze alle `innerHTML` mit `createElement`/`textContent`
- [ ] Füge Sanitization-Helper für dynamische Inhalte hinzu
- [ ] Teste mit bösartigen Inputs

---

### Task 1.2: XSS-Schutz in app.js

**Files:**
- Modify: `js/app.js`

**Issues:**
- `innerHTML` für Buttons mit i18n-Strings (Lines 321, 331)

**Implementation:**

```javascript
// BEFORE:
btn.innerHTML = '<i data-lucide="flag"></i> ' + DRC.I18n?.t('buttons.setBaseline', 'Set Baseline');

// AFTER:
const icon = document.createElement('i');
icon.setAttribute('data-lucide', 'flag');
icon.className = 'lucide-icon';
const text = document.createTextNode(' ' + (DRC.I18n?.t('buttons.setBaseline') || 'Set Baseline'));
btn.innerHTML = '';
btn.append(icon, text);
DRC.UIHelpers?.refreshIcons();
```

---

### Task 1.3: Passwort-Speicherung sicher machen

**Files:**
- Modify: `js/patient-manager.js`

**Issues:**
- Passwörter in sessionStorage als Klartext (Lines 29-38)

**Implementation:**

```javascript
// BEFORE:
const ENCRYPTION_STORAGE = {
    getLastPassword: () => sessionStorage.getItem('drc_last_password'),
    setLastPassword: (pwd) => sessionStorage.setItem('drc_last_password', pwd),
};

// AFTER:
const ENCRYPTION_STORAGE = {
    // Use sessionStorage only for session persistence, with explicit warning
    getLastPassword: () => {
        // Returns encrypted password (AES-GCM with ephemeral key)
        const encrypted = sessionStorage.getItem('drc_last_password_enc');
        if (!encrypted) return null;
        return DRC.CryptoService?.decryptWithEphemeral(encrypted);
    },
    setLastPassword: (pwd) => {
        if (!pwd) {
            sessionStorage.removeItem('drc_last_password_enc');
            return;
        }
        // Encrypt before storage
        const encrypted = DRC.CryptoService?.encryptWithEphemeral(pwd);
        sessionStorage.setItem('drc_last_password_enc', encrypted);
    },
};
```

---

## Phase 2: Performance-Optimierung

### Task 2.1: Globalen Mouseover-Handler entfernen

**Files:**
- Modify: `js/app.js` (Lines 413-438)

**Issues:**
- `document.addEventListener('mouseover')` feuert bei jedem Mouse-Move
- Verursacht unnötige CPU-Last

**Implementation:**

```javascript
// BEFORE: Global mouseover handler
document.addEventListener('mouseover', (e) => {
    const fieldEl = e.target.closest('[data-field]');
    // ... highlight logic
});

// AFTER: CSS-only solution with :hover
// Add to CSS:
[data-field] {
    transition: background-color 0.2s;
}
[data-field]:hover,
[data-field].factor-highlight {
    background-color: var(--highlight-color);
}

// Or use focused approach with specific containers
const highlightContainers = document.querySelectorAll('.highlight-container');
highlightContainers.forEach(container => {
    container.addEventListener('mouseenter', handleHighlightEnter, { passive: true });
    container.addEventListener('mouseleave', handleHighlightLeave, { passive: true });
});
```

---

### Task 2.2: DOM-Queries cachen

**Files:**
- Modify: `js/ui-controller.js`, `js/app.js`, `js/patient-manager.js`

**Issues:**
- Wiederholte `getElementById`/`querySelector` Aufrufe

**Implementation:**

```javascript
// BEFORE: In renderContributionChart
const container = el('contribution-chart');
// ... later
const filterToggle = document.createElement('div');
// ... later
createFilterToggle(container, filterState);

// AFTER: Cache at module level
const DOM_CACHE = new Map();

const getCachedElement = (id) => {
    if (!DOM_CACHE.has(id)) {
        const el = document.getElementById(id);
        if (el) DOM_CACHE.set(id, el);
    }
    return DOM_CACHE.get(id);
};

// Clear cache on model switch (when fields visibility changes)
const clearElementCache = () => DOM_CACHE.clear();
```

---

### Task 2.3: Icon-Rendering batching

**Files:**
- Modify: `js/ui-controller.js`

**Issues:**
- `lucide.createIcons()` wird mehrfach aufgerufen

**Implementation:**

```javascript
// BEFORE: Multiple calls
if (typeof lucide !== 'undefined') lucide.createIcons();

// AFTER: Debounced batch
const _pendingIconRefresh = { timeout: null };

const scheduleIconRefresh = () => {
    if (_pendingIconRefresh.timeout) {
        clearTimeout(_pendingIconRefresh.timeout);
    }
    _pendingIconRefresh.timeout = setTimeout(() => {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        _pendingIconRefresh.timeout = null;
    }, 50); // Batch rapid updates
};
```

---

## Phase 3: Code-Deduplizierung

### Task 3.1: Duplizierte Beta-Koeffizienten bereinigen

**Files:**
- Modify: `js/config.js`

**Issues:**
- `BETAS` und `MODELS.clinicalGlucoseLipids.betas` identisch

**Implementation:**

```javascript
// BEFORE:
BETAS: { age: 0.0173, race: 0.4433, ... sigma: -9.9808 },
// ...
MODELS: {
    clinicalGlucoseLipids: {
        betas: { age: 0.0173, race: 0.4433, ... },
        intercept: -9.9808,
    }
}

// AFTER:
const BASE_BETAS = { age: 0.0173, race: 0.4433, ... };
const BASE_INTERCEPT = -9.9808;

BETAS: { ...BASE_BETAS, sigma: BASE_INTERCEPT },
MODELS: {
    clinicalGlucoseLipids: {
        betas: BASE_BETAS,
        intercept: BASE_INTERCEPT,
    }
}
```

---

### Task 3.2: Translation-Helper zentralisieren

**Files:**
- Create: `js/utils.js` (shared utilities)
- Modify: `js/app.js`, `js/ui-controller.js`, `js/patient-manager.js`

**Issues:**
- Gleicher Helper wird in 3+ Dateien dupliziert

**Implementation:**

```javascript
// js/utils.js
DRC.Utils = {
    // Centralized translation helper with caching
    createTranslator: () => {
        const cache = new Map();
        return (key, fallback) => {
            if (cache.has(key)) return cache.get(key);
            const result = DRC.I18n?.t(key, fallback) || fallback || key;
            cache.set(key, result);
            return result;
        };
    },

    // Debounce utility
    debounce: (fn, ms) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn(...args), ms);
        };
    },

    // Safe DOM element creation
    createElement: (tag, options = {}) => {
        const el = document.createElement(tag);
        if (options.className) el.className = options.className;
        if (options.textContent) el.textContent = options.textContent;
        if (options.attributes) {
            Object.entries(options.attributes).forEach(([k, v]) => el.setAttribute(k, v));
        }
        return el;
    },
};
```

---

### Task 3.3: Duplizierte Modal-Logik extrahieren

**Files:**
- Modify: `js/patient-manager.js`

**Issues:**
- Encryption modal und Password modal haben identische Patterns

**Implementation:**

```javascript
// Create generic modal manager
const ModalManager = {
    create({ id, title, content, onConfirm, onCancel }) {
        // Generic modal creation logic
    },
    show(id) { /* ... */ },
    hide(id) { /* ... */ },
};
```

---

## Phase 4: Code-Struktur Verbesserungen

### Task 4.1: init() Funktion in app.js aufbrechen

**Files:**
- Modify: `js/app.js` (Lines 340-547)

**Issues:**
- 207 Zeilen in einer Funktion
- Verstoesst gegen Single Responsibility Principle

**Implementation:**

```javascript
// AFTER: Split into focused functions
const init = () => {
    initI18n();
    initSliders();
    initToggles();
    initButtons();
    initEventHandlers();
    initPanels();
    initLanguageSubscription();
    initModelHandling();

    // Initial state
    const initMale = document.getElementById('sex-toggle')?.checked ?? true;
    UI().updateWaistSegments(initMale, state.isMetric);
    UI().updateAllSliderFills();
    calculate();
};

const initSliders = () => {
    CFG.SLIDER_FIELDS.forEach(field => {
        const slider = document.getElementById(`${field}-slider`);
        if (!slider) return;
        slider.addEventListener('input', () => onSliderInput(field));
        slider.addEventListener('mousedown', () => onSliderStart(field));
        slider.addEventListener('touchstart', () => onSliderStart(field), { passive: true });
        slider.addEventListener('mouseup', () => onSliderEnd(field));
        slider.addEventListener('touchend', () => onSliderEnd(field));
    });
};
// ... etc
```

---

### Task 4.2: Render-Funktionen in ui-controller.js aufbrechen

**Files:**
- Modify: `js/ui-controller.js`

**Issues:**
- `renderContributionChart` ist 173 Zeilen lang
- `renderTreatmentOverview` ist 185 Zeilen lang

**Implementation:**

```javascript
// Split renderContributionChart into:
const renderContributionChart = (summaryData) => {
    const { contributions, pFull, pBaseline, netDeviation } = summaryData;
    const container = getElement('contribution-chart');
    if (!container) return;

    clearContainer(container);

    const filteredContributions = filterContributionsByModel(contributions);
    const items = sortContributions(filteredContributions);

    renderSummaryBanner(container, { pFull, pBaseline, netDeviation });
    renderFilterToggle(container);
    renderContributionHeader(container);
    renderContributionRows(container, items);
    setupContributionEventListeners(container);
};
```

---

## Phase 5: Validierung und Fehlerbehandlung

### Task 5.1: Eingabevalidierung standardisieren

**Files:**
- Modify: `js/app.js`, `js/ui-controller.js`

**Implementation:**

```javascript
// js/utils.js - Validation utilities
DRC.Validation = {
    isValidNumber(val) {
        const num = parseFloat(val);
        return !isNaN(num) && isFinite(num);
    },

    clamp(val, min, max) {
        return Math.min(Math.max(val, min), max);
    },

    sanitizePatientName(name) {
        return name
            ?.replace(/[<>"']/g, '')
            ?.trim()
            ?.slice(0, 100);
    },

    validatePatientData(data) {
        const errors = [];
        if (!data?.name?.trim()) errors.push('Name is required');
        if (data.name?.length > 100) errors.push('Name too long');
        // ... etc
        return errors;
    }
};
```

---

### Task 5.2: Fehlerbehandlung konsistent machen

**Files:**
- Modify: `js/patient-manager.js`

**Issues:**
- Inkonsistente Error-Handling: `catch (_)` vs `catch (e)` mit Logging

**Implementation:**

```javascript
// Standardized error handling
const handleError = (context, error, userMessage = null) => {
    console.error(`[${context}]:`, error);
    if (userMessage && typeof window !== 'undefined') {
        // Show user-friendly error (non-blocking)
        DRC.UIHelpers?.showToast?.(userMessage, { type: 'error' });
    }
};

// Usage:
try {
    // ... operation
} catch (e) {
    handleError('PatientManager.saveToStorage', e, 'Failed to save data');
}
```

---

## Phase 6: Test-Updates

### Task 6.1: Tests für neue Utilities

**Files:**
- Create: `tests/test-utils.js`
- Create: `tests/test-validation.js`

**Tests needed:**
- `escapeHtml` functionality
- `debounce` timing
- `createElement` DOM creation
- Validation functions

---

### Task 6.2: Bestehende Tests aktualisieren

**Files:**
- Modify: `tests/test-ui-controller.js`
- Modify: `tests/test-app.js`

**Updates:**
- Teste XSS-Schutz
- Teste neue Event-Handler
- Teste DOM-Caching

---

## Phase 7: Dokumentation

### Task 7.1: CODEBASE_MEMORY.md aktualisieren

**Files:**
- Modify: `memory/CODEBASE_MEMORY.md`

**Updates:**
- Neue Utility-Module dokumentieren
- DOM-Caching Pattern dokumentieren
- XSS-Schutz-Strategie dokumentieren

---

### Task 7.2: README.md aktualisieren

**Files:**
- Modify: `README.md`

**Updates:**
- Sicherheits-Best Practices
- Performance-Optimierungen
- Neue Datei-Struktur

---

## Implementations-Reihenfolge

```
Phase 1: Sicherheitskritische Fixes (Kritisch)
├── Task 1.1: XSS-Schutz in ui-controller.js
├── Task 1.2: XSS-Schutz in app.js
└── Task 1.3: Passwort-Speicherung sicher machen

Phase 2: Performance (Hoch)
├── Task 2.1: Globalen Mouseover-Handler entfernen
├── Task 2.2: DOM-Queries cachen
└── Task 2.3: Icon-Rendering batching

Phase 3: Deduplizierung (Mittel)
├── Task 3.1: Beta-Koeffizienten bereinigen
├── Task 3.2: Translation-Helper zentralisieren
└── Task 3.3: Modal-Logik extrahieren

Phase 4: Struktur (Mittel)
├── Task 4.1: init() aufbrechen
└── Task 4.2: Render-Funktionen aufbrechen

Phase 5: Validierung (Mittel)
├── Task 5.1: Eingabevalidierung
└── Task 5.2: Fehlerbehandlung

Phase 6: Tests (Mittel)
├── Task 6.1: Neue Utility-Tests
└── Task 6.2: Bestehende Tests aktualisieren

Phase 7: Dokumentation (Niedrig)
├── Task 7.1: CODEBASE_MEMORY.md
└── Task 7.2: README.md
```

---

## Erfolgskriterien

| Kriterium | Vorher | Nachher |
|-----------|--------|---------|
| Code-Duplizierung | ~15% | < 5% |
| XSS-Vulnerabilities | 6 Stellen | 0 |
| Funktionen >50 Zeilen | 8 | < 3 |
| Tests | 476 | 500+ |
| Performance (mouseover) | ~1000 calls/s | 0 |

---

## Risiken und Mitigationen

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Breaking Changes | Mittel | Hoch | Umfassende Tests vor jeder Aenderung |
| Performance-Regression | Niedrig | Mittel | Benchmarks vor/nach vergleichen |
| i18n Breakage | Niedrig | Mittel | Alle Sprachen testen |
| Browser-Kompatibilitaet | Niedrig | Hoch | Test in Chrome, Safari, Firefox |

---

*Plan erstellt durch Multi-Agent Code Review*
