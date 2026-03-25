# Aktion: Automatische Profil-Erstellung beim OCR-Import

## Dateien
- **Modified:** `js/ocr-ui-controller.js` - importValues() Funktion aktualisiert

## Änderungen

### Automatische Profil-Erstellung
Die Profil-Erstellung wurde vereinfacht:

**Vorher:**
- Checkbox "Create profile" musste angehakt sein
- Profil wurde nur erstellt wenn Name vorhanden UND Checkbox gecheckt
- Verwendete veraltete Element-ID `ocrPatientNameInput`

**Nachher:**
- Profil wird IMMER automatisch erstellt beim Import
- Name aus `ocrProfileNameInput` wird verwendet
- Fallback auf "Unknown Profile" wenn kein Name vorhanden
- Keine Checkbox-Prüfung mehr nötig

### Code-Änderung
```javascript
// Vorher:
const nameInput = document.getElementById('ocrPatientNameInput');
const createProfileCheckbox = document.getElementById('ocrCreateProfile');

if (nameInput?.value?.trim() && createProfileCheckbox?.checked) {
    if (DRC.PatientManager && DRC.PatientManager.addPatient) {
        DRC.PatientManager.addPatient(nameInput.value.trim());
    }
}

// Nachher:
const profileNameInput = document.getElementById('ocrProfileNameInput');
const profileName = profileNameInput?.value?.trim() || 'Unknown Profile';

if (DRC.PatientManager && DRC.PatientManager.addPatient) {
    DRC.PatientManager.addPatient(profileName);
}
```

## UI-Anpassungen in showReview()
- Input-Feld mit ID `ocrProfileNameInput` zeigt Patientennamen oder "Unknown Profile"
- Checkbox "Auto-create profile" ist readonly und immer checked (visueller Hinweis)

## Learnings
- UI und Logik müssen synchron gehalten werden (Element-IDs)
- "Unknown Profile" als Fallback ist besser UX als leeres Feld
- Automatische Erstellung reduziert Fehlerquellen (kein vergessenes Anhaken)

## Risiken
- **Keine** - Alle Änderungen sind rein additive
- Bestehende OCR Funktionalität unverändert
- Backwards compatible
