# Aktion: Sex-Toggle fuer Waist-Schwellenwerte + Slider-Fixes

## Dateien:
- `index.html` — Sex-Toggle in Demographic Data, Waist-Labels dynamisch, Triglycerides-Farbe gefixt
- `js/config.js` — `sex` in ALL_FIELDS und DEFAULTS
- `js/ui-controller.js` — `sex` in readInputs(), `updateWaistSegments()` neu, `updateNonModSummary()` erweitert
- `js/risk-model.js` — `getElevatedFactors(siVals, isMale)` mit sex-Parameter, null-Guard in computeContributions/MarginalContributions
- `js/app.js` — sex-Toggle Event, isMale an getElevatedFactors, updateWaistSegments bei Unit-Toggle/Reset/Init
- `js/patient-manager.js` — sex in capture/apply/Excel
- `tests/test-risk-model.js` — ALL_FIELDS=10, Contributions/Marginals filtern non-model Felder
- `tests/test-risk-model-edge-cases.js` — Waist-Tests mit isMale-Parameter (male/female getrennt)
- `tests/test-ui-controller.js` — readInputs=10 keys

## Neue Features:
1. **Sex-Toggle** (Female/Male) in Demographic Data, Default: Male (checked)
2. **Dynamische Waist-Slider-Segmente**: Aendern sich je nach Geschlecht
   - Male: Schwelle bei 40 in / 102 cm (Label "♂ 40" / "♂ 102")
   - Female: Schwelle bei 35 in / 88 cm (Label "♀ 35" / "♀ 88")
3. **Triglycerides High-Zone**: `warning` → `danger` (gleiche Farbe wie andere Slider)

## Architektur-Entscheidungen:
- `sex` ist NICHT im ARIC-Modell (keine Beta-Koeffizienten) → nur UI-Feld fuer Waist-Threshold-Auswahl
- `B[key] == null` Guard in computeContributions/MarginalContributions statt sex aus ALL_FIELDS zu entfernen
- `getElevatedFactors(siVals, isMale=true)` → Default male fuer Abwaertskompatibilitaet
- Waist-Slider-Segmente werden dynamisch per innerHTML aktualisiert (kein Template-System vorhanden)

## Learnings:
- ALL_FIELDS wird in computeContributions/MarginalContributions iteriert → braucht null-Guard fuer non-model Felder
- linearPredictor greift nur namentlich zu (B.age, B.race, ...) → `sex` in Input-Objekt stoert nicht
- ConversionService.toSI nutzt Spread-Operator → sex wird harmlos durchgereicht
- Tests muessen explizit `isMale` Parameter uebergeben fuer Female-Tests
- `waistIsHigh` bleibt immer an 102 cm (NCEP male) gebunden, unabhaengig von isMale

## Risiken:
- Legacy-Patientendaten ohne `sex` Feld → `data.sex` ist undefined → `!!undefined = false` → Female. Sollte `?? 1` sein in applyValues (aktuell: `!!data[f]` → 0=Female fuer alte Daten)
- Neue Excel-Spalte `Sex_Male` → alte Imports ohne diese Spalte defaulten auf Male (via `?? 1`)
- Falls jemand `CONFIG.ALL_FIELDS` zaehlt, gibt es jetzt 10 statt 9
