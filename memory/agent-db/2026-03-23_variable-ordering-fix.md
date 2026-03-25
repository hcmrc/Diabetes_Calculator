# Aktion: Variable Ordering Fix in js/app.js

## Dateien
- `js/app.js` - `_badgeTimeouts` Deklaration vor `onSliderStart` verschoben

## Problem
Die Variable `_badgeTimeouts` wurde in `onSliderStart` (Zeile 135) verwendet, bevor sie deklariert wurde (Zeile 145).

```javascript
// VORHER (falsch):
const onSliderStart = (field) => {
    if (_badgeTimeouts[field]) {  // ← VERWENDUNG hier
        clearTimeout(_badgeTimeouts[field]);
    }
    ...
};
const _badgeTimeouts = {};  // ← DEKLARATION hier (zu spät!)
```

## Lösung
Die Deklaration mit JSDoc-Kommentar wurde vor `onSliderStart` verschoben:

```javascript
// NACHHER (korrekt):
/** @type {Object<string, number>} Active badge-clear timeouts per field. */
const _badgeTimeouts = {};  // ← Jetzt VOR der Verwendung

const onSliderStart = (field) => {
    if (_badgeTimeouts[field]) {  // ← Jetzt definiert
        ...
    }
};
```

## Learnings
- JavaScript hoisting funktioniert anders bei `const`/`let` vs `var`
- Bei `const` muss die Deklaration lexikalisch vor der Verwendung stehen
- Dies war ein klassisches TDZ (Temporal Dead Zone) Problem

## Risiken
- Keine - nur eine einfache Reordering, keine Logik-Änderung
- Alle 481 Tests bleiben grün
