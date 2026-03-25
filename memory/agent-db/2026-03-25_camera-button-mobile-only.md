# Aktion: Camera Button Mobile-only + Design-Anpassung
## Dateien: style.css
## Datum: 2026-03-25

## Zusammenfassung
Der "Take Photo" Button im OCR Modal wurde so angepasst, dass er:
1. **Auf Desktop ausgeblendet** wird (keine native Kamera-Unterstützung via `capture` Attribut)
2. **Auf Mobile angezeigt** wird mit einem Design, das an die Dropzone angeglichen ist

## Warum?
Das HTML-Attribut `capture="environment"` funktioniert nur auf mobilen Geräten (iOS Safari, Android Chrome). Auf Desktop-Browsern (Chrome, Safari, Firefox, Edge) wird das Attribut ignoriert und stattdessen ein File-Picker geöffnet. Dies führt zu einer inkonsistenten UX, daher wird der Button auf Desktop ausgeblendet.

## Implementierte Änderungen

### 1. Desktop Hide (ab min-width: 769px)
```css
@media (min-width: 769px) {
    .ocr-camera-btn {
        display: none;
    }
}
```

### 2. Mobile Show + Dropzone-Design (bis max-width: 768px)
```css
@media (max-width: 768px) {
    .ocr-camera-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-3);
        width: 100%;
        padding: var(--space-6);
        margin-top: var(--space-4);
        background: var(--bg-tertiary);
        border: 2px dashed var(--border-primary);
        border-radius: var(--radius-lg);
        color: var(--text-primary);
        font-size: var(--text-md);
        font-weight: 600;
        min-height: 120px;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .ocr-camera-btn:hover,
    .ocr-camera-btn:active {
        background: rgba(0, 113, 227, 0.04);
        border-color: var(--blue);
    }

    .ocr-camera-btn .lucide-icon {
        width: 48px;
        height: 48px;
        color: var(--text-tertiary);
        stroke-width: 1.5;
    }
}
```

## Design-Vergleich: Dropzone vs Camera Button (Mobile)

| Eigenschaft | Dropzone | Camera Button | Status |
|-------------|----------|---------------|--------|
| `display` | `flex` | `flex` | ✅ |
| `flex-direction` | `column` | `column` | ✅ |
| `align-items` | `center` | `center` | ✅ |
| `justify-content` | `center` | `center` | ✅ |
| `gap` | `var(--space-3)` | `var(--space-3)` | ✅ |
| `padding` | `var(--space-6)` | `var(--space-6)` | ✅ |
| `background` | `var(--bg-tertiary)` | `var(--bg-tertiary)` | ✅ |
| `border` | `2px dashed var(--border-primary)` | `2px dashed var(--border-primary)` | ✅ |
| `border-radius` | `var(--radius-lg)` | `var(--radius-lg)` | ✅ |
| `transition` | `all 0.2s ease` | `all 0.2s ease` | ✅ |
| Icon-Größe | `48px` | `48px` | ✅ |

## Ergebnis

| Plattform | Camera Button | Dropzone | Nutzer-Erlebnis |
|-----------|---------------|----------|-----------------|
| **Desktop** | ❌ Ausgeblendet | ✅ Sichtbar | Keine Verwirrung durch nicht-funktionierenden "Take Photo" Button |
| **Mobile** | ✅ Sichtbar (gleiches Design wie Dropzone) | ✅ Sichtbar | Konsistente UI, beide Optionen verfügbar |

## Technische Details

### Media Queries Breakpoints
- **Desktop**: `min-width: 769px` → Button wird ausgeblendet
- **Mobile**: `max-width: 768px` → Button wird mit speziellen Styles angezeigt

### CSS-Variablen verwendet
- `--space-3`: 12px (gap)
- `--space-4`: 16px (margin-top)
- `--space-6`: 24px (padding)
- `--bg-tertiary`: Hintergrundfarbe
- `--border-primary`: Rahmenfarbe
- `--radius-lg`: 16px (Border-Radius)
- `--text-md`: 15px (Schriftgröße)

## Risiken
- **Keine Risiken** - Progressive Enhancement Ansatz
- Desktop-Nutzer verlieren keine Funktionalität (Dropzone bleibt verfügbar)
- Mobile-Nutzer haben beide Optionen (Kamera + Datei-Upload)

## Validierung
- ✅ Code Review: **GO** - Alle Checks bestanden
- ✅ Syntax: Korrekt
- ✅ Design-Konsistenz: Dropzone == Camera Button auf Mobile
- ✅ Funktionalität: Button erscheint nur auf Mobile

## Verwandte Änderungen
- Siehe auch: `2026-03-25_ocr-camera-display-fix.md` (visually-hidden Pattern)
- Siehe auch: `2026-03-25_ocr-camera-fix.md` (separate Inputs für Kamera/Datei)
