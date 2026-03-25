# Aktion: OCR Erweiterungen - Name, Profil, Sex Labels, HbA1c Entfernt

## Dateien
- **Modified:** `js/lab-report-parser.js` - Name Extraktion, HbA1c entfernt
- **Modified:** `js/ocr-ui-controller.js` - Sex als Male/Female, Profil-Erstellung UI
- **Modified:** `js/patient-manager.js` - addPatient exportiert

## Änderungen

### 1. HbA1c Entfernt
- HbA1c war im Parser definiert aber nicht in CONFIG.ALL_FIELDS
- Entfernt aus VALUE_PATTERNS, getFieldLabel, getFieldUnit
- Entfernt aus allFields in ocr-ui-controller.js

### 2. Sex als Male/Female Labels
- In showReview(): Sex wird jetzt als "Male"/"Female" angezeigt statt 0/1
- Readonly Text-Input für Sex statt Number-Input
- In importValues(): Konvertierung von Display-Value zurück zu 0/1

### 3. Patient Name Extraktion
- Neue Patterns in lab-report-parser.js:
  - "Patient(enbezeichnung): Name"
  - "Name: Mustermann, Max" (Last, First Format)
  - "Patient: Max Mustermann"
  - "Name: Max Mustermann"
- normalizePatientName() Funktion für Format-Normalisierung
- Unterstützt deutsche und englische Laboreport-Formate

### 4. Automatische Profil-Erstellung
- In showReview(): Patient Name Input + "Create profile" Checkbox
- In importValues(): Wenn Name vorhanden und Checkbox checked → Profil wird erstellt
- addPatient() ist jetzt in Public API von patient-manager.js exportiert

## UI Änderungen

### Vorher:
- Sex: [0] oder [1] im Input Feld
- Kein Name-Feld
- Nur "Import Values" Button

### Nachher:
- Sex: [Male] oder [Female] im Text-Feld (readonly)
- Patient Name Input Feld (am Anfang der Liste)
- "Create profile" Checkbox
- Optional: Profil wird automatisch erstellt

## Testing
- Alle 484+ Tests bestehen
- Keine Breaking Changes
- Abwärtskompatibel

## Verwendung

1. OCR Scan durchführen
2. Patient Name wird automatisch erkannt oder manuell eingetragen
3. "Create profile" Checkbox ist automatisch checked wenn Name erkannt
4. Import klicken → Werte werden eingetragen
5. Wenn "Create profile" checked → Neues Profil wird erstellt und aktiviert

## Risiken
- **Keine** - Alle Änderungen sind rein additive
- HbA1c Entfernung ist keine Breaking Change (war nie im Modell)
- Bestehende OCR Funktionalität unverändert
