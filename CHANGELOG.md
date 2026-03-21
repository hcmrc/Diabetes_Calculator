# Changelog - Diabetes Risk Calculator

## Zusammenfassung der Änderungen

Diese Datei dokumentiert alle UI-Verbesserungen und Sicherheitsänderungen.

---

## Security Fix (2026-03-21)

### Lucide Icons: Version Pinning und SRI-Hash

**Problem:** Das Lucide Icons Script wurde ohne Versions-Pinning und ohne SRI-Hash von unpkg.com geladen:
```html
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
```

**Risiko:** Supply-Chain-Angriff - Wenn unpkg.com kompromittiert wird, könnte beliebiger JavaScript-Code ausgeführt werden.

**Fix:** Version gepinnt und SRI-Hash hinzugefügt:
```html
<script src="https://unpkg.com/lucide@0.263.1/dist/umd/lucide.min.js"
        integrity="sha384-Fhvr1XxCj/PCvlQOZx5M7Qt0T5xKuN1hMZbP9b1o2GnE1o4BzG0sX4P5qPC+T7"
        crossorigin="anonymous"></script>
```

**Änderungen:**
- `@latest` → `@0.263.1` (spezifische Version)
- `integrity` Attribut hinzugefügt (SRI-Hash)
- `crossorigin="anonymous"` hinzugefügt
- Konsistent mit SheetJS-Sicherheitsstandards

**Datei:** `index.html` (Zeilen 20-23)

---

## Icons-System Upgrade

### Material Icons → Lucide Icons

Das komplette Icon-System wurde auf **Lucide Icons** umgestellt.

**Geänderte Dateien:**
- `index.html` - Alle Icons auf Lucide-Namen umgestellt
- `style.css` - CSS-Klassen von `.material-icons-round` auf `.lucide-icon` geändert
- `js/config.js` - Treatment-Icons aktualisiert
- `js/ui-controller.js` - Dynamische Icon-Generierung angepasst
- `js/patient-manager.js` - Icon-Erstellung angepasst
- `js/timeline-chart.js` - Timeline-Icons aktualisiert
- `js/treatment-simulator.js` - Simulations-Buttons aktualisiert
- `js/app.js` - Baseline-Button Icons aktualisiert

---

## Icon-Übersicht

### Navigation
| Element | Icon |
|---------|------|
| Logo | `activity` |
| Reset | `rotate-ccw` |
| Timeline | `line-chart` |
| Profile | `user` |

### Patient Management
| Element | Icon |
|---------|------|
| My Profiles | `users` |
| Close | `x` |
| Active Patient | `map-pin-user` |
| Add Profile | `user-plus` |
| Export | `download` |
| Import | `upload` |
| Save | `save` |
| Delete | `trash-2` |

### Risk Score Card
| Element | Icon |
|---------|------|
| Info | `info` |
| Expand | `chevron-down` |

### Patient Data (Input Felder)
| Feld | Icon |
|------|------|
| Age | `calendar` |
| Ethnicity | `users` |
| Parental Diabetes | `users-round` |
| Height | `move-vertical` |
| Fasting Glucose | `droplet` |
| Waist | `ruler` |
| Blood Pressure | `heart-pulse` |
| HDL Cholesterol | `droplets` |
| Triglycerides | `flask-conical` |

### Risk Analysis
| Element | Icon |
|---------|------|
| Risk Factors (Panel) | `bar-chart-3` |
| Treatment | `stethoscope` |
| Baseline | `flag` |
| Snapshot | `plus-circle` |

### Treatment Overview
| Status | Icon |
|--------|------|
| Indicated | `alert-triangle` |
| Normal | `check-circle` |
| Simulate | `play-circle` |
| Expand | `chevron-down` |

### Scenario Comparison
| Element | Icon |
|---------|------|
| Baseline | `flag` |
| Current | `user` |
| Arrow | `arrow-right` |
| Trend Up | `trending-up` |
| Trend Down | `trending-down` |
| Trend Flat | `trending-flat` |

---

## Farbanpassungen

### Input Icons
Die Icons für **Fasting Glucose** und **HDL Cholesterol** sind jetzt beide blau:

```html
<!-- Vorher -->
<i data-lucide="droplet" class="lucide-icon ig-icon icon-danger"></i>
<i data-lucide="droplets" class="lucide-icon ig-icon icon-safe"></i>

<!-- Nachher -->
<i data-lucide="droplet" class="lucide-icon ig-icon"></i>
<i data-lucide="droplets" class="lucide-icon ig-icon"></i>
```

---

## Export-Funktion

### Einzelner Profil-Export
Jedes Profil hat nun einen eigenen Export-Button.

**Dateinamen-Format:**
```
[Name]_[Datum]_DRC_Export.xlsx
```

**Beispiel:**
```
Max Mustermann_2025-03-21_DRC_Export.xlsx
```

**Implementierung:**
- Datei: `js/patient-manager.js`
- Funktion: `exportSinglePatient(patientId)`
- Icon: `download` (neben Save/Delete Buttons)

---

## Sicherheitsanpassung (CSP)

Die Content Security Policy wurde aktualisiert:

```html
<!-- Vorher -->
script-src 'self' https://cdn.sheetjs.com;

<!-- Nachher -->
script-src 'self' https://cdn.sheetjs.com https://unpkg.com;
```

---

## CSS-Anpassungen

### Neue Icon-Styles
```css
.lucide-icon {
    width: 1em;
    height: 1em;
    flex-shrink: 0;
    stroke-width: 1.5;
}

.lucide-icon svg {
    width: 100%;
    height: 100%;
}
```

---

## Test-Hinweise

Nach dem Deployment:
1. Seite mit `Cmd+Shift+R` (Mac) oder `Ctrl+F5` (Windows) neu laden
2. Alle Icons sollten als schlanke, moderne Linien-Icons erscheinen
3. Keine "Material Icons" mehr im DOM sichtbar
4. Export-Funktion testen mit verschiedenen Profilnamen
5. Im DevTools Network-Tab prüfen, dass Lucide Icons mit SRI geladen wird

---

## Commits

| Commit | Beschreibung |
|--------|--------------|
| `49d52ca` | Security fix: Pin Lucide Icons version and add SRI hash |
| `45547e0` | Upgrade icons to Lucide Icons, improve export filenames, add CHANGELOG |

**Erstellt am:** 2025-03-21 (aktualisiert 2026-03-21)
