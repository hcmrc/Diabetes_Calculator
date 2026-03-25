# Aktion: Sex-Feld manuell eingebbar wenn nicht erkannt

## Dateien
- **Modified:** `js/ocr-ui-controller.js`

## Problem
Das Sex-Feld war immer `readonly`, auch wenn OCR kein Geschlecht erkannt hat. Benutzer konnten in diesem Fall kein Geschlecht manuell eingeben.

## Lösung
3 einfache Änderungen in `showReview()` und `importValues()`:

### 1. Readonly nur wenn Wert erkannt (Line ~408)
```javascript
// Vorher:
const inputReadonly = field === 'sex' || field === 'patientName' ? 'readonly' : '';

// Nachher:
const inputReadonly = (field === 'sex' && value !== undefined) || field === 'patientName' ? 'readonly' : '';
```

### 2. Besserer Placeholder Text (Line ~426)
```javascript
// Vorher:
placeholder="${value === undefined ? 'Not detected' : ''}"

// Nachher:
placeholder="${value === undefined ? 'Type Male or Female' : ''}"
```

### 3. Case-insensitive Parsing in importValues() (Line ~484)
```javascript
// Vorher:
const sexValue = input.value === 'Male' ? 1 : input.value === 'Female' ? 0 : undefined;

// Nachher:
const valueLower = input.value.trim().toLowerCase();
const sexValue = valueLower === 'male' ? 1 : valueLower === 'female' ? 0 : undefined;
```

## Verhalten

| Szenario | Vorher | Nachher |
|----------|--------|---------|
| Sex erkannt | Readonly mit "Male"/"Female" | Readonly mit "Male"/"Female" |
| Sex nicht erkannt | Readonly mit "Not detected" | **Editierbar** mit Placeholder "Type Male or Female" |
| Import mit "male"/"Female"/"MALE" etc. | Nur exakte Schreibweise | **Case-insensitive** akzeptiert |

## Warum diese Lösung?

**Alternative Optionen evaluiert:**
- Select Dropdown: Mehr Code, Styling nötig
- Radio Buttons: Layout-Änderungen, komplexere HTML-Generierung
- Toggle Switch: Konsistent mit Haupt-UI, aber aufwändiger

**Gewählt:** Text-Input mit bedingtem Readonly
- Minimaler Code-Change (3 Zeilen)
- Keine neuen UI-Komponenten
- Funktioniert mit existierendem Import-Logik
- Placeholder text führt den Benutzer
- Case-insensitive Parsing ist fehlertolerant

## Learnings
- Bedingte Readonly-Logik muss den Wert prüfen (`value !== undefined`)
- Case-insensitive Parsing verbessert UX signifikant
- Placeholder-Text kann als Mini-Documentation dienen

## Risiken
- **Keine** - Alle Änderungen sind rein additive
- Backwards compatible
- Bestehende Funktionalität unverändert
