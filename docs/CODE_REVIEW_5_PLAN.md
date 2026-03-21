# Code Review 5 — Planung & Strategie

> **Datum:** 21. März 2026
> **Anlass:** Umfassende Code-Review nach Reviews 1-4
> **Ziel:** Wissenschaftliche Korrektheit sicherstellen, Unit-Konvertierung validieren, Tests vervollständigen
> **Vorgängerberichte:** `REVIEW_REPORT_2.md`, `REVIEW_REPORT_3.md`, `REVIEW_REPORT_4.md`

---

## Zusammenfassung der bisherigen Reviews

Die vorherigen Reviews (2-4) haben bereits wichtige Probleme behoben:

- ✅ **Wissenschaftliches Modell**: Alle Koeffizienten aus Schmidt et al. (2005) korrekt implementiert
- ✅ **HIGH_RISK_CUTOFF**: 0.26 korrekt implementiert und verwendet
- ✅ **State-Mutation**: `_setCompareScenario()`-Setter eingeführt
- ✅ **Unit-Konversion**: `applyValues()` mit `_isMetric`-Flag implementiert
- ✅ **Rundungsdrift-Prävention**: `preciseSI`-Pattern in `onToggleUnits()`

### Bekannte verbleibende Probleme

| Problem | Datei | Beschreibung |
|---------|-------|--------------|
| `convertField`-Guard | `conversion-service.js:73` | `!multiplier` ist falsch-positiv bei Wert 0 |
| `isBaseline`-Flag | `timeline-chart.js:47` | Totes Attribut, wird nie gelesen |
| Waist-Range-Inkonsistenz | `config.js:78` | 25 Zoll = 63,5 cm vs SI-Minimum 64 cm |
| Legacy-Profile | `patient-manager.js:80` | Profile ohne `_isMetric` nicht behandelt |

### Testlücken

| Lücke | Priorität | Begründung |
|-------|-----------|------------|
| `onCompareScenario()` Toggle-Logik | Niedrig | DOM-entangled, schwer isoliert testbar |
| `computeWhatIfDelta()` exakte Magnitude | Niedrig | Deterministische Funktion |
| Edge Cases bei Unit-Konvertierung | Mittel | Bei Profilwechseln mit verschiedenen Einheiten |

---

## Agent-Struktur

### Agent 1: Wissenschaftliche Korrektheit (Schmidt et al. 2005)

**Aufgaben:**
- Validierung aller 10 Beta-Koeffizienten gegen Publikation
- Validierung des Intercepts (sigma = -9.9808)
- Validierung der logistischen Funktion
- Validierung von HIGH_RISK_CUTOFF = 0.26
- Validierung der Populationsmittelwerte (MEANS)
- Validierung der Schwellenwerte (THRESHOLDS)

**Fokus-Dateien:**
- `js/risk-model.js` - Das Risikomodell
- `js/config.js` - Koeffizienten und Konstanten

**Akzeptanzkriterien:**
- Alle Koeffizienten stimmen mit Schmidt et al. (2005) überein
- Manuell berechnetes Risiko = Code-Ergebnis (±0.1%)
- HIGH_RISK_CUTOFF korrekt verwendet

---

### Agent 2: Code-Qualität A (Architektur & Patterns)

**Aufgaben:**
- Überprüfung der Modulstruktur (DRC-Namespace)
- Überprüfung der DOM-Entkopplung
- Überprüfung von DRY-Compliance
- Überprüfung der State-Management-Patterns
- Überprüfung der Event-Handler-Registrierung

**Fokus-Dateien:**
- `js/app.js` - State Management
- `js/ui-controller.js` - UI-Rendering
- `js/main.js` - Modul-Initialisierung

**Akzeptanzkriterien:**
- Keine globale State-Pollution
- Klare Trennung von Modulen
- Keine zirkulären Abhängigkeiten
- Event-Listener werden korrekt verwaltet

---

### Agent 3: Code-Qualität B (Unit-Konvertierung - Spezialfokus)

**Aufgaben:**
- **Spezieller Fokus: Unit-Wechsel und Größenkonvertierung**
- Überprüfung von `ConversionService.convertField()`
- Überprüfung von `ConversionService.applyConvertedValues()`
- Überprüfung von `onToggleUnits()` in `app.js`
- Überprüfung von `applyValues()` in `patient-manager.js`
- Validierung der Konvertierungsfaktoren:
  - `heightToCm: 2.54` (inches → cm)
  - `waistToCm: 2.54` (inches → cm)
  - `gluToMmol: 1/18` (mg/dL → mmol/L)
  - `hdlToMmol: 1/38.67` (mg/dL → mmol/L)
  - `triToMmol: 1/88.57` (mg/dL → mmol/L)
- Test der Rundtrip-Konvertierung (US → SI → US)
- Überprüfung des `preciseSI`-Patterns
- Überprüfung des `_isMetric`-Flags bei Profilen

**Fokus-Dateien:**
- `js/conversion-service.js` - Konvertierungslogik
- `js/patient-manager.js` - Profilverwaltung mit Einheiten
- `js/app.js` - Unit-Toggle Handler

**Akzeptanzkriterien:**
- US → SI → US Konvertierung ergibt Originalwert (±0.01)
- Größe (height) wird korrekt konvertiert: 66in → 168cm → 66in
- Taille (waist) wird korrekt konvertiert: 36in → 91cm → 36in
- Glucose wird korrekt konvertiert: 100mg/dL → 5.6mmol/L → 100mg/dL
- Profilwechsel zwischen SI und US funktioniert korrekt
- `!multiplier` Guard behandelt 0 korrekt

---

### Agent 4: Code-Qualität C (Performance & Edge Cases)

**Aufgaben:**
- Überprüfung von `clampAndRound()` für Float-Präzision
- Überprüfung der Error-Handling-Strategien
- Überprüfung der localStorage-Sicherheit (Prototype Pollution)
- Überprüfung des Event-Listener-Managements
- Überprüfung des Field-Element-Cache
- Überprüfung von `isBaseline`-Flag (toter Code)
- Überprüfung der Waist-Range-Inkonsistenz

**Fokus-Dateien:**
- `js/ui-helpers.js` - `clampAndRound()`
- `js/timeline-chart.js` - `isBaseline`-Flag
- `js/config.js` - Range-Definitionen
- `js/patient-manager.js` - localStorage Handling

**Akzeptanzkriterien:**
- `clampAndRound()` behandelt step korrekt
- Keine Prototype Pollution in localStorage möglich
- Keine Memory Leaks durch Event-Listener
- Toter Code identifiziert und markiert

---

### Agent 5: Test-Abdeckung & -Validierung

**Aufgaben:**
- Durchführung aller bestehenden Tests
- Überprüfung der Test-Qualität
- Hinzufügen fehlender Tests für:
  - `fromSI()` - Inverse Konvertierung
  - `getConversionFactor()` - Konvertierungsfaktoren
  - `applyValues()` mit Unit-Wechsel (SI ↔ US)
  - Edge Cases bei der Konvertierung
- Überprüfung der Test-Toleranzen
- Überprüfung der Mock-Qualität

**Fokus-Dateien:**
- `tests/test-risk-model.js`
- `tests/test-patient-manager.js`
- `tests/test-treatment-simulator.js`
- `tests/test-ui-controller.js`
- `tests/test-timeline-chart.js`
- `tests/test-comparison.js`
- `tests/test-ui-helpers.js`

**Akzeptanzkriterien:**
- Alle Tests bestehen (100% Pass-Rate)
- Konversionstests mit Toleranz 1e-9
- Unit-Wechsel-Tests für alle konvertierbaren Felder
- Edge-Case-Tests für Grenzwerte

---

## Ausführungsplan

### Phase 1: Agenten-Dispatch (Parallel)

Alle 5 Agenten werden gleichzeitig gestartet:

```
Agent 1 ──→ Wissenschaftliche Korrektheit
Agent 2 ──→ Code-Qualität A (Architektur)
Agent 3 ──→ Code-Qualität B (Unit-Konvertierung) [SPEZIALFOKUS]
Agent 4 ──→ Code-Qualität C (Performance/Edge Cases)
Agent 5 ──→ Test-Abdeckung
```

### Phase 2: Ergebnis-Sammlung

- Jeder Agent erstellt einen Bericht seiner Ergebnisse
- Agent 5 validiert alle Code-Änderungen durch Tests

### Phase 3: Code-Änderungen

- Priorisierung der gefundenen Probleme
- Implementierung der Fixes durch Agenten
- Re-Test durch Agent 5

### Phase 4: Finale Dokumentation

- Zusammenführung aller Ergebnisse in `REVIEW_REPORT_5.md`
- Dokumentation aller Fixes
- Test-Ergebnis-Übersicht

---

## Spezifische Anweisungen für Agent 3 (Unit-Konvertierung)

Der Agent 3 hat einen **speziellen Auftrag**: Das Problem mit der Größenkonvertierung beim Unit-Wechsel lösen.

**Bekanntes Problem aus Review 4:**
Beim Unit-Wechsel (z.B. US → SI) wurde die Größe nicht korrekt konvertiert, wenn ein Patientenprofil geladen wurde.

**Lösungsansatz:**
1. Überprüfen, dass `applyValues()` in `patient-manager.js` korrekt konvertiert
2. Überprüfen, dass `_isMetric` korrekt gesetzt und verwendet wird
3. Überprüfen, dass `ConversionService.convertField()` korrekte Faktoren verwendet
4. Überprüfen, dass `onToggleUnits()` in `app.js` korrekt auf `preciseSI` zugreift
5. Test-Case erstellen: US-Profil in SI-Modus laden und validieren

**Zu testende Szenarien:**
- Szenario A: Profil in US gespeichert, laden in SI-Modus
- Szenario B: Profil in SI gespeichert, laden in US-Modus
- Szenario C: Direkter Unit-Toggle mit aktivem Profil
- Szenario D: Excel-Import (US) in SI-Modus laden

---

## Erwartete Ergebnisse

### Dokumente
1. `REVIEW_REPORT_5.md` - Vollständiger Review-Bericht
2. `CHANGES.md` - Zusammenfassung aller Code-Änderungen

### Code-Änderungen
- Fixes für identifizierte Probleme
- Erweiterte Testabdeckung
- Dokumentation von Unsicherheiten

### Test-Ergebnisse
| Datei | Erwartete Tests |
|-------|-----------------|
| test-risk-model.js | 79+ |
| test-patient-manager.js | 45+ |
| test-treatment-simulator.js | 45+ |
| **Gesamt** | **509+** |

---

## Zeitplan

| Phase | Geschätzte Dauer |
|-------|------------------|
| Agent-Dispatch | 0.5h (parallel) |
| Ergebnis-Sammlung | 0.5h |
| Code-Änderungen | 1-2h |
| Finale Dokumentation | 0.5h |
| **Gesamt** | **2.5-3.5h** |

---

## Risiken & Abhängigkeiten

| Risiko | Mitigation |
|--------|------------|
| Agent 3 findet komplexen Bug | Priorisierung, ggf. separates Issue |
| Tests failen nach Fixes | Rollback-Strategie, schrittweise Fixes |
| Mehrere Agenten finden gleiches Problem | Koordination, ein Agent fixiert |

---

## Approval

Dieser Plan wurde erstellt am: 21. März 2026
Genehmigt durch: _________________
Gestartet: _________________
