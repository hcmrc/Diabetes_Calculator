# Aktion: Profil-Warnung als zentrales Modal

## Dateien
- **Modified:** `index.html` - Banner entfernt, Modal HTML hinzugefuegt
- **Modified:** `style.css` - Banner CSS entfernt, Modal CSS hinzugefuegt
- **Modified:** `js/ui-controller.js` - Event Handler aktualisiert
- **Modified:** `js/profile-warning.js` - Komplette Umschreibung fuer Modal

## Feature
Ein zentrales Modal erscheint, wenn man auf "Simulate Treatment" klickt, aber kein Profil erstellt hat UND Daten eingegeben wurden.

## Design

### Modal-Verhalten
- **Ausloeser:** Klick auf "Simulate Treatment" Button
- **Anzeige:** Zentrales Modal mit verschwommenem Hintergrund (wie Export-Feature)
- **Backdrop:** `blur(4px)` mit halbtransparentem schwarzen Overlay
- **Animation:** Skalierung + Opacity-Transition (wie bestehende Modals)

### Modal-Inhalt
- **Icon:** Orange Warn-Dreieck mit Puls-Animation
- **Titel:** "Save Your Data?"
- **Nachricht:** Erklärung, dass Daten verloren gehen koennen
- **Buttons:**
  1. "Create Profile" (Primary) - Oeffnet Patient Drawer
  2. "Continue Without Saving" (Secondary) - Fuehrt Simulation durch
  3. "Cancel" (Tertiary) - Schliesst Modal, keine Simulation

## Technische Umsetzung

### Modal-Logik (profile-warning.js)
```javascript
// Promise-basiertes Modal
async function checkBeforeSimulation(factor) {
    if (hasActiveProfile()) return true;
    if (!checkForUnsavedData()) return true;

    const choice = await showModal();
    // 'create', 'continue', oder 'cancel'
}
```

### Event Flow
```
Klick auf "Simulate Treatment"
    ↓
checkBeforeSimulation(factor)
    ↓
Profil vorhanden? → JA → Simulation starten
Profil fehlt + Daten? → Modal anzeigen
    ↓
Benutzer waehlt:
    - Create Profile → Drawer oeffnen → Nach Erstellung Simulation
    - Continue → Simulation ohne Speichern
    - Cancel → Keine Simulation
```

## CSS-Animation
```css
@keyframes profile-warn-icon-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}
```

## Aenderungen im Vergleich

| Aspekt | Vorher (Banner) | Nachher (Modal) |
|--------|-----------------|-----------------|
| **Ausloeser** | Automatisch bei Daten-Eingabe | Nur bei Klick auf Simulate Treatment |
| **Anzeige** | Inline im Treatment-Panel | Zentrales Modal mit Backdrop |
| **Hintergrund** | Normal | Verschwommen (blur 4px) |
| **Dismissal** | Session-only | Per Klick auf Cancel/X/Backdrop |
| **Optionen** | Create Profile | Create / Continue / Cancel |

## Accessibility
- `role="dialog"` und `aria-modal="true"`
- ESC-Taste schliesst Modal
- Klick auf Backdrop schliesst Modal
- Focus-Management nach Profil-Erstellung

## Learnings
- Promise-basierte Modals ermoeglichen klare User-Entscheidungen
- Integration mit bestehendem Modal-System (backdrop-filter, animation)
- Event-Listener fuer 'patient:saved' stellt sicher, dass Simulation nach Profil-Erstellung fortgesetzt wird

## Testing Checklist
- [ ] Klick auf Simulate mit Profil → Direkte Simulation
- [ ] Klick auf Simulate ohne Profil + ohne Daten → Direkte Simulation
- [ ] Klick auf Simulate ohne Profil + mit Daten → Modal erscheint
- [ ] "Create Profile" → Drawer oeffnet → Nach Erstellung Simulation startet
- [ ] "Continue Without Saving" → Simulation startet ohne Profil
- [ ] "Cancel" → Modal schliesst, keine Simulation
- [ ] ESC → Modal schliesst, keine Simulation
- [ ] Klick auf Backdrop → Modal schliesst, keine Simulation

## Risiken
- **Keine** - Alle Aenderungen sind rein additive
- Backwards compatible (alte API entfernt)
- Keine Breaking Changes
