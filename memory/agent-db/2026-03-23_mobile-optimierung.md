# Aktion: Mobile-Optimierung und Default-Einstellungen

## Dateien
- `style.css` - Mobile CSS für Contribution Chart Header hinzugefügt
- `js/dark-mode.js` - Default Theme auf Light Mode geändert
- `js/ui-controller.js` - Risiko-Filter standardmäßig deaktiviert

## Learnings
- Der Contribution Chart Header nutzte `transform: translateX(35px)` um "Better than average" und "Worse than average" Texte außerhalb des Containers zu positionieren. Auf mobilen Geräten (< 768px) überlappten diese sich.
- Dark Mode wurde über `systemPreference = mediaQuery.matches ? THEME_DARK : THEME_LIGHT` automatisch an Systemeinstellungen gebunden.
- Der Risiko-Filter war über `container.getAttribute('data-filter-risk') !== 'false'` standardmäßig aktiv (true), da ein neuer Container kein Attribut hat (undefined !== 'false' = true).

## Änderungen im Detail

### style.css (Update 1)
- Mobile Media Query `@media (max-width: 768px)` hinzugefügt
- `transform: translateX(0)` auf mobilen Geräten entfernt
- Schriftgröße auf 10px reduziert für bessere Lesbarkeit

### style.css (Update 4 - CSS Cascade Order Problem behoben)
**Problem:** Die Desktop-Regel `.contrib-label-short { display: none; }` stand nach der Media Query, wodurch sie die Mobile-Regel überschrieb (gleiche Spezifität, später im CSS).

**Lösung:**
- Desktop-Regeln für `.contrib-label-full` und `.contrib-label-short` vor die Media Query verschoben
- Mobile-Regeln innerhalb `@media (max-width: 768px)` überschreiben nun korrekt die Desktop-Regeln
- CSS-Struktur: Desktop-Defaults → Media Query Mobile-Overrides

**Ergebnis:**
- Desktop zeigt "Better than average" / "Worse than average"
- Mobile zeigt "Better" / "Worse"
- Labels sind nun korrekt sichtbar auf allen Geräten

### dark-mode.js
- Zeile 26: `currentTheme = systemPreference;` → `currentTheme = THEME_LIGHT;`
- System Preference Detection nur noch für Event Listener, nicht für Initialisierung

### ui-controller.js
- Zeile 199: `!== 'false'` → `=== 'true'`
- Damit ist der Filter standardmäßig deaktiviert (alle Faktoren werden angezeigt)

## Risiken
- Bestehende Nutzer mit gespeichertem Dark Mode behalten ihre Präferenz (savedPreference Check besteht)
- Bestehende Nutzer mit gespeichertem Filter-State behalten ihre Einstellung (data-filter-risk Attribut wird persistiert)
- Mobile Darstellung könnte auf sehr kleinen Bildschirmen (< 360px) immer noch eng sein - ggf. weitere Anpassung nötig