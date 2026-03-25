# Aktion: Simulate Treatment Funktion repariert

## Dateien:
- `js/config.js` — Animation-Konstanten hinzugefügt
- `js/treatment-simulator.js` — Timeline Auto-Open Logik bereinigt

## Aenderungen im Detail:

### Problem
Nach der Aktualisierung der Therapy-Namen funktionierte "Simulate Treatment" nicht mehr korrekt:
1. `ANIMATION_FLASH_MS` wurde referenziert, existierte aber nicht in config.js
2. Timeline wurde nicht automatisch geöffnet bei Simulation
3. Fehlende `ANIMATION_DURATION`, `ANIMATION_STEPS`, `MAX_SNAPSHOTS`, `MIN_Y_AXIS` Konstanten

### Loesung

#### 1. config.js — Konstanten hinzugefuegt (Zeilen 222-231)
```javascript
/** Animation timing constants. */
ANIMATION_DURATION: 1500,
ANIMATION_STEPS: 30,
ANIMATION_FLASH_MS: 1200,

/** UI timeout constants (milliseconds). */
BADGE_TIMEOUT_MS: 2000,
TOOLTIP_TIMEOUT_MS: 1200,

/** Timeline chart limits. */
MAX_SNAPSHOTS: 20,
MIN_Y_AXIS: 25
```

#### 2. treatment-simulator.js — Bereinigung doppelter Logik
**Entfernt (redundant):** Timeline Auto-Open in `simulate()` bei erster Simulation. Diese Logik existiert bereits in `ui-controller.js:494-500` (siehe 2026-03-24_treatment-panel-auto-expand.md).

**Behalten:** Timeline Auto-Open in `onComplete()` (Zeilen 165-170) als Sicherheitsnetz:
```javascript
// Auto-open timeline if hidden
const area = document.getElementById('timeline-expandable');
if (area && !area.classList.contains('open')) {
    area.classList.add('open');
    document.getElementById('timelineToggleBtn')?.classList.add('active');
}
```

### Architektur-Übersicht

| Funktion | Ort | Zweck |
|----------|-----|-------|
| Timeline Auto-Open beim Klick | `ui-controller.js:494-500` | Sofortiges Öffnen beim Button-Klick |
| Timeline Auto-Open nach Animation | `treatment-simulator.js:165-170` | Sicherheitsnetz falls während Animation geschlossen |

## Learnings:
- Vorheriger Fix (2026-03-24_treatment-panel-auto-expand.md) hatte Timeline-Logik bereits in ui-controller.js
- Mein initialer Fix fügte doppelte Logik in treatment-simulator.js hinzu
- Bereinigung notwendig um Code-Duplikation zu vermeiden
- Konstanten müssen synchron zwischen Dateien gepflegt werden

## Risiken:
- Keine bekannten Risiken — alle 552 Tests bestehen
- Aenderungen sind minimal und zielen nur auf fehlende Funktionalität
