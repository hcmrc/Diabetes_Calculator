# Aktion: Grosse Code-Refaktorisierung

## Dateien
- js/conversion-service.js (Multiplier-Deduplizierung)
- js/app.js (_computeRisk Helper, onCompareScenario vereinfacht)
- js/patient-manager.js (Event Delegation, captureCurrentValues vereinfacht)
- js/timeline-chart.js (Render-Funktionen extrahiert)
- tests/test-patient-manager.js (Mocks erweitert)
- tests/test-timeline-chart.js (CONFIG Mock erweitert)
- tests/test-treatment-simulator.js (API-Tests aktualisiert)

## Learnings
- Test-Mocks muessen ALLE genutzten DRC-Module abdecken (UIHelpers.safeStorage, UIController.readInputs etc.)
- Event Delegation braucht Guard-Flag (`container._delegationAttached`)
- `_computeRisk()` als Helper spart viel Duplikation
- Timeline-Chart SVG-Helper `createSVGEl` reduziert 60%+ der setAttribute-Aufrufe
- Patient-Manager captureCurrentValues kann UIController.readInputs() nutzen statt eigene DOM-Reads

## Risiken
- UIController.readInputs() muss in Tests gemockt werden wenn captureCurrentValues getestet wird
- Event Delegation in renderList: data-patient-id muss auf Card gesetzt sein
- Timeline render-Helpers teilen sich Closures (PAD, VW, VH etc.) — bei weiterer Extraktion beachten
