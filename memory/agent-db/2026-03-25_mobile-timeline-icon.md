# Aktion: Mobile Timeline Button Icon-Only

## Dateien
- `style.css` - Mobile CSS für Timeline Button hinzugefügt (Zeilen 3415-3428)
- `style.css` - Mobile CSS für Patient Button angepasst (Zeilen 3214-3219)

## Learnings
- Der Risk Timeline Button sollte auf Mobile (max-width: 768px) wie der Profil-Button nur noch ein Icon zeigen
- Der Profil-Button nutzt 480px, aber 768px ist konsistent mit anderen Mobile-Regeln im Projekt
- Alle Nav-Buttons sollten dieselbe Größe haben (32px x 32px) für konsistentes Design
- Das `aria-label` auf dem Button ist ausreichend für Accessibility

## Änderungen im Detail

### style.css - Timeline Button
Mobile Media Query Block nach Zeile 3414:

```css
/* Mobile: Timeline Button Icon-only */
@media (max-width: 768px) {
    .btn-timeline-toggle {
        width: 32px;
        height: 32px;
        padding: 0;
        justify-content: center;
    }

    .btn-timeline-toggle .btn-timeline-label {
        display: none;
    }
}
```

### style.css - Patient Button (Update)
Zusätzliche Regeln im 480px Media Query (Zeile 3214):

```css
    .btn-patient-menu {
        width: 32px;
        height: 32px;
        padding: 0;
        justify-content: center;
    }
```

## Einheitliche Button-Größen
Alle 4 Nav-Buttons sind jetzt auf Mobile 32px x 32px:

| Button | Desktop | Mobile |
|--------|---------|--------|
| Reset | 32px | 32px |
| Dark Mode | 32px | 32px |
| Timeline | Icon + Text | Nur Icon (32px) |
| Profile | Icon + Text + Chevron | Nur Icon (32px) |

## Risiken
- Keine JavaScript-Abhängigkeiten auf das Label gefunden
- Keine Tests prüfen das Label
- CSS Cascade ist unproblematisch (einfache Klasse, keine !important)
- 228 Tests bestehen (test-timeline-chart.js, test-ui-controller.js, test-risk-model.js)

## Pattern-Konsistenz
Alle Nav-Buttons folgen jetzt dem gleichen Pattern:
- Desktop: Jeweils individuelles Design mit Text
- Mobile: Einheitliche 32px x 32px Icon-Only Buttons
