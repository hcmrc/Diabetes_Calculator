# Code Review 7 — Planung & Strategie

**Datum:** 21. März 2026
**Anlass:** Erneute umfassende Code-Review nach Review 6
**Ziel:** Validierung der Fixes aus Review 6 und Identifikation neuer Issues

---

## Zusammenfassung

Review 6 hat folgende Fixes implementiert:
- ✅ DRY-Verstoß in `app.js` behoben (extract `_renderAllViews()`)
- ✅ `clampAndRound()` für wissenschaftliche Notation gefixt
- ✅ Tests für `escapeHtml()` und scientific notation hinzugefügt
- 🚫 XSS-Fixes blockiert (erfordern manuelle Refaktorisierung)

**Ziel dieser Review:**
1. Validiere die Fixes aus Review 6
2. Suche nach neuen Issues
3. Überprüfe die noch offenen XSS-Vulnerabilities

---

## Agent-Struktur (6 Agents)

### Agent 1: Wissenschaftliche Korrektheit

**Aufgaben:**
- Re-Validierung aller 10 Beta-Koeffizienten gegen Publikation
- Validierung des Intercepts (sigma = -9.9808)
- Validierung der logistischen Funktion
- Validierung von HIGH_RISK_CUTOFF = 0.26
- Validierung der Populationsmittelwerte (MEANS)
- **NEU:** Validierung der Fixes aus Review 6

**Fokus-Dateien:**
- `js/risk-model.js`
- `js/config.js`

### Agent 2: Code-Qualität A (Architektur)

**Aufgaben:**
- Überprüfung der DRY-Fixes aus Review 6
- Überprüfung der Modulstruktur (DRC-Namespace)
- Überprüfung der DOM-Entkopplung
- Überprüfung von State-Management-Patterns
- Überprüfung der API-Exposition

**Fokus-Dateien:**
- `js/app.js`
- `js/ui-controller.js`
- `js/main.js`

### Agent 3: Code-Qualität B (Unit-Konvertierung)

**Aufgaben:**
- Überprüfung von `clampAndRound()` Fix
- Überprüfung von `ConversionService.convertField()`
- Überprüfung von `onToggleUnits()` in `app.js`
- Überprüfung von `applyValues()` in `patient-manager.js`
- Validierung der Konvertierungsfaktoren

**Fokus-Dateien:**
- `js/ui-helpers.js`
- `js/conversion-service.js`
- `js/patient-manager.js`
- `js/app.js`

### Agent 4: Code-Qualität C (Performance & Security)

**Aufgaben:**
- Überprüfung des `clampAndRound()` Fixes
- Überprüfung der Error-Handling-Strategien
- Überprüfung der localStorage-Sicherheit
- Überprüfung des Event-Listener-Managements
- Überprüfung des Field-Element-Cache
- **NEU:** Review der offenen XSS-Vulnerabilities

**Fokus-Dateien:**
- `js/ui-helpers.js`
- `js/ui-controller.js`
- `js/patient-manager.js`
- `js/config.js`

### Agent 5: Test-Abdeckung

**Aufgaben:**
- Durchführung ALLER bestehenden Tests
- Überprüfung der neuen Tests aus Review 6
- Identifikation neuer Testlücken
- Empfehlung neuer Tests

**Fokus-Dateien:**
- `tests/test-*.js` (alle Testdateien)

### Agent 6: Security Review

**Aufgaben:**
- **XSS-Prüfung:** Untersuchung aller innerHTML-Verwendungen
- Überprüfung der offenen XSS-Issues aus Review 6
- Input-Validation: Prüfung auf unsanierte Benutzereingaben
- Prototype Pollution: Analyse der JSON-Parsing-Sicherheit
- DOM-Manipulation: Prüfung auf unsichere DOM-Operationen
- Storage-Security: localStorage Analyse
- CSP-Compliance: Content Security Policy Überprüfung

**Fokus-Dateien:**
- `js/ui-controller.js` - HTML-Rendering (XSS)
- `js/patient-manager.js` - localStorage, Excel-Import
- `js/timeline-chart.js` - SVG-Rendering
- `js/radar-chart.js` - Canvas/SVG-Rendering
- `js/app.js` - Event-Handler
- `index.html` - CSP-Header

**Security-Checkliste:**

| Kategorie | Prüfpunkt | Status |
|-----------|-----------|--------|
| XSS | Alle innerHTML-Verwendungen identifizieren | Offen |
| XSS | `escapeHtml()` wird konsistent verwendet | Offen |
| XSS | Keine unsanierten User-Inputs im DOM | Offen |
| Input Validation | Alle Inputs werden auf Typ/Range geprüft | Prüfen |
| Input Validation | Excel-Import validiert alle Felder | Prüfen |
| Prototype Pollution | JSON.parse mit Reviver-Funktion | Prüfen |
| Prototype Pollution | Keine gefährlichen Keys erlaubt | Prüfen |
| DOM Security | Sichere DOM-Operationen verwendet | Prüfen |
| Storage | localStorage-Keys validiert | Prüfen |
| Storage | Keine sensitiven Daten im localStorage | Prüfen |
| CSP | CSP-Header vorhanden und korrekt | Prüfen |
| Dependencies | Externe Scripts mit SRI-Hashes | Prüfen |

---

## Ausführungsplan

### Phase 1: Agenten-Dispatch (Parallel)

Alle 6 Agenten werden gleichzeitig gestartet.

### Phase 2: Ergebnis-Sammlung

- Jeder Agent erstellt einen Bericht
- Security-Agent hat höchste Priorität bei kritischen Findings
- Agent 5 validiert alle Code-Änderungen durch Tests

### Phase 3: Code-Änderungen

- Priorisierung der gefundenen Probleme
- Security-Fixes haben absolute Priorität
- Re-Test durch Agent 5

### Phase 4: Finale Dokumentation

- Zusammenführung in REVIEW_REPORT_7.md

---

## Erwartete Ergebnisse

### Dokumente
- `REVIEW_REPORT_7.md` - Vollständiger Review-Bericht

### Test-Ergebnisse
| Datei | Erwartete Tests |
|-------|-----------------|
| test-risk-model.js | 79+ |
| test-patient-manager.js | 45+ |
| test-treatment-simulator.js | 45+ |
| test-ui-controller.js | 63+ |
| test-timeline-chart.js | 38+ |
| test-ui-helpers.js | 19+ |
| **Gesamt** | **289+** |

---

## Zeitplan

| Phase | Geschätzte Dauer |
|-------|------------------|
| Agent-Dispatch | 0.5h |
| Ergebnis-Sammlung | 0.5h |
| Code-Änderungen | 1-2h |
| Finale Dokumentation | 0.5h |
| **Gesamt** | **2.5-3.5h** |

---

## Status

**Plan ist bereit zur Ausführung.**
