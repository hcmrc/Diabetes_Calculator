# Aktion: Sex-Feld als Dropdown statt Text-Input

## Dateien
- **Modified:** `js/ocr-ui-controller.js`
- **Modified:** `style.css`

## Änderungen

### 1. Select-Dropdown für Sex-Feld (js/ocr-ui-controller.js)

**Vorher:**
- Sex war ein Text-Input
- Benutzer mussten "Male" oder "Female" tippen
- Placeholder war "Type"

**Nachher:**
- Sex ist ein Select-Dropdown wenn nicht erkannt
- Auswahl zwischen "-", "Female", "Male"
- Placeholder für alle Felder ist jetzt "Enter value"

### Code-Änderungen in showReview():

```javascript
// Sex field: use select when not detected, readonly input when detected
if (field === 'sex') {
    if (value === undefined) {
        // Not detected: show dropdown
        inputHtml = `
            <select class="ocr-result-input ${confidenceClass}"
                data-field="${field}"
                aria-label="${fieldLabel} value">
                <option value="">-</option>
                <option value="0">Female</option>
                <option value="1">Male</option>
            </select>
        `;
    } else {
        // Detected: show read-only input
        const displayValue = value === 1 ? 'Male' : value === 0 ? 'Female' : '';
        inputHtml = `<input type="text" ... readonly value="${displayValue}" />`;
    }
}
```

### Code-Änderungen in importValues():

```javascript
if (field === 'sex') {
    let sexValue;
    if (input.tagName === 'SELECT') {
        // Dropdown: value is "0" or "1" or ""
        sexValue = input.value ? parseInt(input.value, 10) : undefined;
    } else {
        // Read-only input: parse display value
        const valueLower = input.value.trim().toLowerCase();
        sexValue = valueLower === 'male' ? 1 : valueLower === 'female' ? 0 : undefined;
    }
    if (sexValue !== undefined) {
        valuesToImport[field] = sexValue;
    }
}
```

### 2. CSS für Select-Dropdown (style.css)

```css
.ocr-result-value-box select.ocr-result-input {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-image: url("data:image/svg+xml,..."); /* Dropdown arrow */
    background-repeat: no-repeat;
    background-position: right 8px center;
    padding-right: 28px;
    text-align: left;
    cursor: pointer;
}
```

## UI-Verhalten

| Zustand | Anzeige | Import |
|---------|---------|--------|
| Sex erkannt (Male) | Readonly Input mit "Male" | Wert wird importiert |
| Sex erkannt (Female) | Readonly Input mit "Female" | Wert wird importiert |
| Sex nicht erkannt | Dropdown mit "-" / "Female" / "Male" | Benutzer muss wählen |

## Learnings
- Select-Elemente brauchen `appearance: none` für konsistentes Styling
- Option values als Strings "0"/"1" → `parseInt()` für numerischen Wert
- Backward compatibility: Read-only Input wird weiterhin unterstützt

## Risiken
- **Keine** - Alle Änderungen sind rein additive
- Dropdown ist intuitiver als Text-Eingabe
- Keine Breaking Changes

## Testing Checklist
- [ ] Sex erkannt (Male) → zeigt readonly "Male"
- [ ] Sex erkannt (Female) → zeigt readonly "Female"
- [ ] Sex nicht erkannt → zeigt Dropdown mit 3 Optionen
- [ ] Import mit Dropdown-Wert → Wert korrekt übernommen
- [ ] Import mit readonly-Wert → Wert korrekt übernommen
- [ ] Placeholder zeigt "Enter value" für andere Felder
