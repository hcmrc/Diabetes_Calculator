# Aktion: Barchart und Summary-Card Redesign

## Dateien:
- `js/ui-controller.js` — `renderContributionChart` komplett neu geschrieben
- `style.css` — Neue CSS-Klassen, Dark Mode, Summary Card

## Änderungen im Detail:

### 1. Filter-Default geändert (ui-controller.js)
- **Vor:** `container.getAttribute('data-filter-risk') !== 'false'` → default true (nur Risiko-Faktoren)
- **Nach:** `container.getAttribute('data-filter-risk') === 'true'` → default false (alle Faktoren)

### 2. Summary Card — Inline-Farben durch CSS-Klassen ersetzt
- Neues `data-direction="higher|lower"` Attribut auf der Card
- `::before` Pseudo-Element: farbiger Akzentstreifen links (rot/grün)
- Neues CSS `.contrib-summary-delta.is-higher/.is-lower` — Pill-Badge statt `style="color:"`

### 3. Barrows komplett neu (inline styles → CSS-Klassen)
- `.contrib-row-inner` / `.contrib-row-label-cell` / `.contrib-bar` / `.contrib-bar-half`
- `.contrib-bar-center` → `background: var(--border-strong)` (war `#d1d1d6`)
- `.contrib-row-label` → `color: var(--text-secondary)` (war `#6e6e73`)
- `.bar-positive` / `.bar-negative` → CSS-Klassen statt Inline-Gradienten
- Prozentwerte **nicht mehr inline sichtbar** — nur on hover/expanded

### 4. Hover/Click Interaktion (neu)
- `.contrib-row-value` (60px rechts): opacity 0 → 1 on hover/expanded
- `.contrib-value-pct` (farbig rot/grün) + `.contrib-value-hint` ("Click for info")
- `.contrib-row-detail`: `display:none` → `display:block` when `.expanded`
- Click-Handler: delegiert auf Container, `_rowClickHandlerAttached` Guard
- Nur ein Detail-Panel offen gleichzeitig

### 5. Info-Text Format (neu)
- Positiv: "Your X is above/below average and increases your overall diabetes risk by Y% compared to an average value. Lowering it would help to decrease your overall risk."
- Negativ: "Your X is below/above average and decreases your overall diabetes risk by Y% compared to an average value."
- Binary: "Your X increases/decreases your overall diabetes risk by Y%."

### 6. Dark Mode (style.css)
- `.dark .contrib-row:hover` → `rgba(255,255,255,0.04)`
- `.dark .contrib-row-detail` → border-top via rgba
- Alte `.dark .contrib-row[data-tooltip]::after/before` Regeln entfernt

### 7. Mobile (<480px)
- `.contrib-row-detail` padding reset
- `.contrib-row-label-cell` width: 110px
- `.contrib-row-value` width: 52px

## Learnings:
- Security-Hook feuert auf innerHTML-Änderungen → einmalige Bestätigung durch User nötig
- Test-Mock hat `_filterAttr: 'true'` → kompatibel mit neuer `=== 'true'` Logik
- `_rowClickHandlerAttached` Guard nötig da Container-innerHTML bei jedem Render cleared wird, aber der Container selbst im DOM bleibt
- Alle 235 Tests weiter grün

## Risiken:
- `contrib-row-detail` padding-left 152px funktioniert nur wenn label-cell 140px + 8px gap = 148px konsistent bleibt
- Auf sehr kleinen Screens (<320px) könnte der Detail-Panel Text unter die Bar laufen → Mobile-Override greift ab <480px
