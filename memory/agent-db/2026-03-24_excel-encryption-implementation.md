# Aktion: Excel-Verschlüsselung implementiert

## Dateien geändert

### Neue Dateien
- `js/crypto-service.js` - AES-256-GCM Verschlüsselung mit Web Crypto API
- `tests/test-crypto-service.js` - 10 Unit Tests für Crypto Service

### Geänderte Dateien
- `index.html` - Encryption Modal HTML + Script-Tag für crypto-service.js
- `style.css` - 573 Zeilen CSS für Modal UI (inkl. Dark Mode)
- `js/patient-manager.js` - Integration der Verschlüsselung in Export/Import

## Learnings

### Architektur
- Web Crypto API bietet native AES-256-GCM Verschlüsselung im Browser
- PBKDF2 mit 100k Iterationen für Schlüssel-Ableitung aus Passwort
- Eigenes Dateiformat: Magic Header "DRCENC1" + JSON Metadata + verschlüsselter Payload
- SessionStorage für temporäre Passwort-Speicherung (sicherer als localStorage)

### Security
- Passwörter werden NIE in localStorage gespeichert
- Nur sessionStorage für "Passwort merken" Funktion
- AES-GCM bietet authentifizierte Verschlüsselung (Schutz vor Manipulation)
- Zufälliger Salt pro Datei verhindert Rainbow-Table-Angriffe

### UX Flow
1. Benutzer klickt Export → Modal erscheint
2. Optionen: Kein Passwort / Mit Passwort verschlüsseln
3. Bei Verschlüsselung: Passwort eingeben (min. 8 Zeichen)
4. Checkboxen: "Für Session merken" / "Als Standard setzen"
5. Schnellauswahl: Letztes/Standard-Passwort verwenden
6. Import: Automatische Erkennung verschlüsselter Dateien

### Datei-Endungen
- Unverschlüsselt: `.xlsx`
- Verschlüsselt: `.drc` (Diabetes Risk Calculator)

## Risiken

### Niedrig
- Web Crypto API wird in allen modernen Browsern unterstützt
- Keine Breaking Changes für bestehende unverschlüsselte Exports
- Rückwärtskompatibel: Alte .xlsx Dateien können weiterhin importiert werden

### Mittel
- Verschlüsselte Dateien können nicht mit externen Tools geöffnet werden
- Passwort verloren = Daten unwiederbringlich verloren (kein Recovery)

## Tests
- 10 neue Crypto Service Tests (alle grün)
- 45 Patient Manager Tests (alle grün)
- 434 weitere Tests (alle grün)
- Gesamt: 489 Tests bestehen

## Commits
- `3926a2a` feat: add encryption modal UI
- `bcdaaa7` feat: integrate encryption into patient manager
