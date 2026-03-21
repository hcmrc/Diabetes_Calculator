# Code Review 6 — Planung & Strategie

**Datum:** 21. März 2026
**Anlass:** Umfassende Code-Review nach Review 5 mit zusätzlichem Security-Fokus
**Ziel:** Wissenschaftliche Korrektheit, Code-Qualität, Tests UND Sicherheit validieren

---

## Zusammenfassung

Review 5 hat erfolgreich kritische Bugfixes implementiert:
- Unit-Konvertierungs-Bugs behoben
- Wissenschaftliches Modell validiert
- 260+ Tests bestehen

### Bekannte verbleibende Aspekte

| Aspekt | Status | Bemerkung |
|--------|--------|-----------|
| Wissenschaftliche Korrektheit | Stabil | Schmidt et al. 2005 validiert |
| Unit-Konvertierung | Korrigiert | Kritische Bugs gefixt |
| API-Design | Offen | Interne Methoden noch exposed |
| Security | Unbekannt | Keine dedizierte Security-Review |

---

## Agent-Struktur (6 Agents)

### Agent 1: Wissenschaftliche Korrektheit

**Aufgaben:**
- Re-Validierung aller 10 Beta-Koeffizienten gegen Publikation
- Validierung des Intercepts (sigma = -9.9808)
- Validierung der logistischen Funktion
- Validierung von HIGH_RISK_CUTOFF = 0.26
- Validierung der Populationsmittelwerte (MEANS)

**Fokus-Dateien:**
- `js/risk-model.js`
- `js/config.js`

### Agent 2: Code-Qualität A (Architektur)

**Aufgaben:**
- Überprüfung der Modulstruktur (DRC-Namespace)
- Überprüfung der DOM-Entkopplung
- Überprüfung von DRY-Compliance
- Überprüfung der State-Management-Patterns
- Überprüfung der API-Exposition

**Fokus-Dateien:**
- `js/app.js`
- `js/ui-controller.js`
- `js/main.js`

### Agent 3: Code-Qualität B (Unit-Konvertierung)

**Aufgaben:**
- Überprüfung von `ConversionService.convertField()`
- Überprüfung von `ConversionService.applyConvertedValues()`
- Überprüfung von `onToggleUnits()` in `app.js`
- Überprüfung von `applyValues()` in `patient-manager.js`
- Validierung der Konvertierungsfaktoren

**Fokus-Dateien:**
- `js/conversion-service.js`
- `js/patient-manager.js`
- `js/app.js`

### Agent 4: Code-Qualität C (Performance)

**Aufgaben:**
- Überprüfung von `clampAndRound()`
- Überprüfung der Error-Handling-Strategien
- Überprüfung der localStorage-Sicherheit
- Überprüfung des Event-Listener-Managements
- Überprüfung des Field-Element-Cache

**Fokus-Dateien:**
- `js/ui-helpers.js`
- `js/patient-manager.js`
- `js/config.js`

### Agent 5: Test-Abdeckung

**Aufgaben:**
- Durchführung aller bestehenden Tests
- Überprüfung der Test-Qualität
- Identifikation neuer Testlücken
- Empfehlung neuer Tests

**Fokus-Dateien:**
- `tests/test-*.js` (alle Testdateien)

### Agent 6: Security Review (NEU)

**Aufgaben:**
- **XSS-Prüfung:** Untersuchung aller innerHTML-Verwendungen
- **Input-Validation:** Prüfung auf unsanierte Benutzereingaben
- **Prototype Pollution:** Analyse der JSON-Parsing-Sicherheit
- **DOM-Manipulation:** Prüfung auf unsichere DOM-Operationen
- **Storage-Security:** localStorage Analyse
- **CSP-Compliance:** Content Security Policy Überprüfung
- **Dependency-Check:** Prüfung externer Bibliotheken

**Fokus-Dateien:**
- `js/ui-controller.js` - HTML-Rendering
- `js/patient-manager.js` - localStorage, Excel-Import
- `js/timeline-chart.js` - SVG-Rendering
- `js/radar-chart.js` - Canvas/SVG-Rendering
- `js/app.js` - Event-Handler
- `index.html` - CSP-Header

**Security-Checkliste:**

| Kategorie | Prüfpunkt |
|-----------|-----------|
| XSS | Alle innerHTML-Verwendungen identifizieren |
| XSS | escapeHtml() wird konsistent verwendet |
| XSS | Keine unsanierten User-Inputs im DOM |
| Input Validation | Alle Inputs werden auf Typ/Range geprüft |
| Input Validation | Excel-Import validiert alle Felder |
| Prototype Pollution | JSON.parse mit Reviver-Funktion |
| Prototype Pollution | Keine gefährlichen Keys erlaubt |
| DOM Security | Sichere DOM-Operationen verwendet |
| Storage | localStorage-Keys validiert |
| Storage | Keine sensitiven Daten im localStorage |
| CSP | CSP-Header vorhanden und korrekt |
| Dependencies | Externe Scripts mit SRI-Hashes |

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

- Zusammenführung in REVIEW_REPORT_6.md
- Security-Findings separat dokumentieren

---

## Erwartete Ergebnisse

### Dokumente
- `REVIEW_REPORT_6.md` - Vollständiger Review-Bericht
- `SECURITY_REPORT.md` - Security-Fokus (falls Findings)

### Test-Ergebnisse
| Datei | Erwartete Tests |
|-------|-----------------|
| test-risk-model.js | 60+ |
| test-patient-manager.js | 35+ |
| test-treatment-simulator.js | 25+ |
| **Gesamt** | **260+** |

---

## Zeitplan

| Phase | Geschätzte Dauer |
|-------|------------------|
| Agent-Dispatch | 0.5h |
| Ergebnis-Sammlung | 0.5h |
| Security-Review | 0.5h |
| Code-Änderungen | 1-2h |
| Finale Dokumentation | 0.5h |
| **Gesamt** | **3-4h** |

---

## Hinweis

**Status:** Plan ist erstellt und bereit zur Ausführung.
**Ausführung:** Noch nicht gestartet - wartet auf Genehmigung.

Dieser Plan dient als Vorlage für die nächste Review-Runde mit Security-Fokus.
