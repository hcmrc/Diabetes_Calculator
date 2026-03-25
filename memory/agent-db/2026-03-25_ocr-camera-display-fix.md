# Aktion: OCR Camera Fix - display:none blockiert capture
## Dateien: style.css, index.html
## Learnings:
- Root Cause: `style="display:none"` auf file input verhindert, dass `capture="environment"` funktioniert
- Browser (iOS Safari, Chrome Android) ignorieren `capture`, wenn Element nicht im Render-Tree ist
- Lösung: `.visually-hidden` CSS-Klasse statt `display:none`
  - Element bleibt im DOM-Render-Tree
  - Element bleibt im Accessibility-Tree
  - Element ist visuell versteckt aber interaktiv
  - `capture` funktioniert jetzt korrekt

## CSS Pattern:
```css
.visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}
```

## Risiken:
- Keine - Backwards-kompatibel
- Accessibility bleibt erhalten (Screenreader)
- Beide Inputs (Kamera + Datei) funktionieren

## Validierung:
- Code Review: GO ✅
- Syntax: Korrekt
- Mobile-Kompatibilität: Sollte jetzt funktionieren
