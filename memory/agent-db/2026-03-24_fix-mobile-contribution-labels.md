# Aktion: Mobile Contribution Chart Labels gefixt

## Datum
2026-03-24

## Problem
Die Labels "Better than average" und "Worse than average" wurden auf Mobilgeräten (max-width: 768px) gestaucht und skalierten nicht richtig. Die absolute Positionierung führte zu Überlappungen.

## Lösung
Implementierung von responsive Labels mit Flexbox-Layout:

1. **Zwei Label-Versionen:**
   - Desktop: "Better than average" / "Average" / "Worse than average"
   - Mobil: "Better" / "Avg" / "Worse"

2. **CSS-gesteuerte Sichtbarkeit:**
   - `.contrib-label-full` und `.contrib-label-short` Klassen
   - Media Query schaltet bei 768px um

3. **Flexbox statt absoluter Positionierung:**
   - `justify-content: space-between` für gleichmäßige Verteilung
   - `max-width: 30%` um Überlappungen zu verhindern
   - `text-overflow: ellipsis` als Fallback

## Dateien
- `js/ui-controller.js` — HTML um kurze Labels erweitert
- `style.css` — Responsive Styles und Flexbox-Layout

## Commit
`f14dc38` — fix: improve mobile contribution chart labels with short variants

## Technische Details

### HTML-Änderungen
```javascript
// Vorher:
<div class="contrib-header-left-side">Better than average</div>

// Nachher:
<div class="contrib-header-left-side">
    <span class="contrib-label-full">Better than average</span>
    <span class="contrib-label-short">Better</span>
</div>
```

### CSS-Änderungen
```css
/* Mobile Breakpoint */
@media (max-width: 768px) {
    .contrib-header-center {
        display: flex;
        justify-content: space-between; /* Statt absolute positioning */
    }

    .contrib-header-left-side,
    .contrib-header-right-side {
        position: static;
        max-width: 30%;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .contrib-label-full { display: none; }
    .contrib-label-short { display: inline; }
}
```

## Learnings
- Absolute Positionierung auf Mobil ist fragil bei variablen Textlängen
- Flexbox mit `space-between` ist robuster für responsive Layouts
- Zwei Label-Versionen (full/short) sind wartbarer als CSS `content:` Hacks
- `min-width: 0` auf Flex-Containern erlaubt korrektes Schrumpfen

## Verifikation
- Desktop (> 768px): Volle Labels sichtbar
- Mobil (< 768px): Kurze Labels sichtbar, keine Überlappungen
- Contribution Bars skalieren korrekt
