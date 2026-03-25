# Aktion: Treatment-Panel und Timeline Auto-Expand beim Simulate-Button

## Dateien
- `js/ui-controller.js` (Zeilen 474-508)

## Learnings
- Das Treatment-Panel (`panel-treatment`) kann durch das `panel-hidden` class auf dem `.panel-body` element eingeklappt sein
- Der Panel-Collapse-Button hat ein `aria-expanded` attribute, das ebenfalls aktualisiert werden muss
- Die Timeline (`timeline-expandable`) verwendet die `open` class zum Ein-/Ausklappen
- Der Timeline-Toggle-Button (`timelineToggleBtn`) bekommt die `active` class wenn aufgeklappt
- Beim Klick auf "Simulate treatment" sollen sowohl das Treatment-Panel als auch die Timeline automatisch aufgehen
- Die Logik prüft zuerst, ob die Elemente tatsächlich eingeklappt sind, bevor sie expandiert werden

## Risiken
- Keine Änderung an der Simulationslogik selbst - nur UI-Erweiterung
- Falls die Panels nicht gefunden werden, läuft die Simulation trotzdem normal
- Keine Breaking Changes für existierende Funktionalität

## Änderung
Im Event-Handler für `.btn-simulate-treatment` wurde vor dem Aufruf von `DRC.TreatmentSimulator.simulate()` folgende Logik hinzugefügt:

1. **Treatment-Panel Expand:**
   - Panel-Element via `el('panel-treatment')` finden
   - Prüfen ob `.panel-body` die `panel-hidden` class hat
   - Falls ja: Klasse entfernen, subtitle sichtbar machen, collapse-button aktualisieren

2. **Timeline Expand:**
   - Timeline-Element via `el('timeline-expandable')` finden
   - Prüfen ob `open` class fehlt
   - Falls ja: `open` class hinzufügen, toggle-button `active` machen
