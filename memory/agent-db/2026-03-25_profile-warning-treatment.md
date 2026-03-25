# Aktion: Profil-Warnung bei Treatment-Simulation

## Dateien
- **Modified:** `index.html` - Warnung-Banner HTML hinzugefügt
- **Modified:** `style.css` - CSS für pulsende Warnung
- **Modified:** `js/ui-controller.js` - Event-Handler aktualisiert
- **Created:** `js/profile-warning.js` - Neues Modul für Profil-Prüfung

## Feature
Eine blinkende Warnung erscheint im Treatment-Bereich, wenn:
1. Der Benutzer Daten eingegeben hat (nicht nur Defaults)
2. Ein Treatment simuliert werden soll
3. Aber kein Patientenprofil existiert

## UI-Design

### Warnung-Banner
- **Position:** Direkt im Treatment-Panel, über der Treatment-Liste
- **Animation:** Pulsierender Border-Glow (2s Zyklus) + Icon-Glow
- **Farben:** Orange/Alert-Farben passend zum Design-System
- **Inhalt:**
  - Icon: Alert-Triangle (animiert)
  - Titel: "No Profile Created"
  - Nachricht: "Save your data before simulating treatments..."
  - Button: "Create Profile" (CTA)
  - Close-Button: X-Icon

## Code-Struktur

### profile-warning.js
```javascript
// Hauptfunktionen:
- hasActiveProfile(): Prüft via PatientManager.getActivePatientData()
- checkForUnsavedData(): Vergleicht aktuelle Werte mit CONFIG.DEFAULTS
- show()/hide(): Zeigt/Versteckt das Banner
- update(): Aktualisiert Zustand und zeigt an wenn nötig
```

### Integration
- **Event Listener:** Auf alle Input-Felder (change/input)
- **App Events:** Hört auf 'patient:saved' und 'patient:loaded'
- **Treatment Simulation:** Wird vor TreatmentSimulator.simulate() aufgerufen

## CSS-Animationen

```css
@keyframes warning-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(255, 103, 35, 0.2); }
    50% { box-shadow: 0 0 0 4px rgba(255, 103, 35, 0.1); }
}

@keyframes warning-icon-glow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(255, 103, 35, 0.4); }
    50% { box-shadow: 0 0 0 6px rgba(255, 103, 35, 0); }
}
```

## Verhalten

| Zustand | Aktion |
|---------|--------|
| Daten + kein Profil | Warnung wird angezeigt, Blink-Animation startet |
| Daten + Profil existiert | Keine Warnung |
| Defaults + kein Profil | Keine Warnung (keine Daten zu verlieren) |
| Benutzer klickt "Create Profile" | Patient-Drawer öffnet sich, Warnung schließt |
| Benutzer klickt X | Warnung wird dismissed (Session-only) |

## Accessibility
- `role="alert"` und `aria-live="polite"` für Screen Reader
- `prefers-reduced-motion` unterstützt (keine Animation)
- Keyboard-navigierbare Buttons

## Learnings
- Pulsierende Animationen mit CSS `@keyframes` sind effektiver als statische Warnungen
- Debounced Event Listener verhindern Performance-Probleme bei Slider-Inputs
- Session-only Dismissal (kein localStorage) stellt sicher, dass Warnung bei neuen Daten wieder erscheint

## Risiken
- **Keine** - Alle Änderungen sind rein additive
- Keine Breaking Changes
- Modular und einfach zu entfernen
