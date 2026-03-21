# Code Review 8 — Planung & Strategie

**Datum:** 21. März 2026
**Anlass:** Erneute Code-Review nach Review 7
**Ziel:** Validierung der Fixes aus Review 7 und Identifikation neuer Issues

---

## Zusammenfassung

Review 7 hat folgende Fixes implementiert:
- ✅ Scientific Notation Case-Insensitivity (E-7 Unterstützung)
- ✅ Event-basierte Kommunikation (lose Kopplung)
- ✅ Änderungsdokumentation (CHANGES_REPORT.md)

**Ziel dieser Review:**
1. Validiere die Event-basierte Architektur aus Review 7
2. Suche nach neuen Issues
3. Überprüfe verbleibende XSS-Pattern
4. Validierung der wissenschaftlichen Korrektheit

---

## Agent-Struktur (6 Agents)

### Agent 1: Wissenschaftliche Korrektheit

**Aufgaben:**
- Re-Validierung aller 10 Beta-Koeffizienten gegen Schmidt et al. 2005
- Validierung des Intercepts (sigma = -9.9808)
- Validierung der logistischen Funktion
- Validierung der Populationsmittelwerte (MEANS)
- Validierung des Event-Systems (keine Auswirkung auf Berechnungen)

**Fokus-Dateien:**
- `js/risk-model.js`
- `js/config.js`
- `js/app.js` (nur die calculate-Funktion)

### Agent 2: Code-Qualität A (Architektur)

**Aufgaben:**
- Überprüfung des Event-System-Fixes aus Review 7
- Überprüfung der Modulstruktur (DRC-Namespace)
- Überprüfung der DOM-Entkopplung
- Überprüfung von State-Management-Patterns
- Überprüfung der API-Exposition (werden interne Methoden exposed?)
- Validierung der losen Kopplung

**Fokus-Dateien:**
- `js/app.js` (on/trigger Event-Bus)
- `js/ui-controller.js`
- `js/treatment-simulator.js`
- `js/patient-manager.js`

### Agent 3: Code-Qualität B (Unit-Konvertierung)

**Aufgaben:**
- Überprüfung des clampAndRound() Case-Insensitive Fixes
- Überprüfung von ConversionService.convertField()
- Überprüfung von onToggleUnits() in app.js
- Überprüfung von applyValues() in patient-manager.js
- Validierung der Konvertierungsfaktoren
- **NEU:** Überprüfung ob Event-System die Konvertierung beeinflusst

**Fokus-Dateien:**
- `js/ui-helpers.js`
- `js/conversion-service.js`
- `js/patient-manager.js`
- `js/app.js`

### Agent 4: Code-Qualität C (Performance)

**Aufgaben:**
- Überprüfung des Event-Bus Performance (Memory Leaks?)
- Überprüfung des clampAndRound() Case-Insensitive Fixes
- Überprüfung der Error-Handling-Strategien
- Überprüfung der localStorage-Sicherheit
- Überprüfung des Event-Listener-Managements

**Fokus-Dateien:**
- `js/ui-helpers.js`
- `js/app.js` (Event-Bus)
- `js/patient-manager.js`
- `js/config.js`

### Agent 5: Test-Abdeckung

**Aufgaben:**
- Durchführung ALLER bestehenden Tests
- Überprüfung der Event-basierten Kommunikation durch Tests
- Identifikation neuer Testlücken
- Empfehlung neuer Tests für Event-System

**Fokus-Dateien:**
- `tests/test-*.js` (alle Testdateien)

### Agent 6: Security Review

**Aufgaben:**
- **XSS-Prüfung:** Untersuchung aller innerHTML-Verwendungen
- Überprüfung der offenen XSS-Issues aus Review 7
- Input-Validation: Prüfung auf unsanierte Benutzereingaben
- Prototype Pollution: Analyse der JSON-Parsing-Sicherheit
- DOM-Manipulation: Prüfung auf unsichere DOM-Operationen
- Storage-Security: localStorage Analyse
- CSP-Compliance: Content Security Policy Überprüfung

**Fokus-Dateien:**
- `js/ui-controller.js` (HTML-Rendering)
- `js/patient-manager.js` (localStorage, Excel-Import)
- `js/timeline-chart.js` (SVG-Rendering)
- `js/radar-chart.js` (Canvas/SVG-Rendering)
- `index.html` (CSP-Header)

**Security-Checkliste:**

| Kategorie | Prüfpunkt | Status |
|-----------|-----------|--------|
| XSS | Alle innerHTML-Verwendungen identifizieren | Prüfen |
| XSS | Event-System sicher (keine Code Injection) | Prüfen |
| Input Validation | Alle Inputs werden auf Typ/Range geprüft | Prüfen |
| Prototype Pollution | JSON.parse mit Reviver-Funktion | Prüfen |
| Storage | localStorage-Keys validiert | Prüfen |
| CSP | CSP-Header vorhanden und korrekt | Prüfen |

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

- Zusammenführung in REVIEW_REPORT_8.md

---

## Erwartete Ergebnisse

### Dokumente
- `REVIEW_REPORT_8.md` - Vollständiger Review-Bericht

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
