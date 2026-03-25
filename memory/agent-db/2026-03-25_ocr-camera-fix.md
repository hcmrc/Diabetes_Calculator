# Aktion: OCR Camera-Button Fix (Kamera öffnet statt Dateisystem)
## Dateien: index.html, js/ocr-ui-controller.js
## Learnings:
- Root Cause: `accept="image/*,.pdf"` verhindert, dass `capture="environment"` funktioniert
- Browser ignorieren `capture` Attribut, wenn nicht-reine Bildtypen im `accept` sind
- Lösung: Zwei separate file inputs:
  - `ocrCameraInput`: Nur `image/*` mit `capture="environment"` (öffnet Kamera)
  - `ocrFileInput`: `image/*,.pdf` ohne capture (für Datei-Upload)
- Camera Button verwendet jetzt `cameraInput.click()` statt `fileInput.click()`

## Risiken:
- Keine - Backwards-kompatibel
- PDF-Upload funktioniert weiterhin über Dropzone/File Input

## Validierung:
- Code Review: GO (keine Issues gefunden)
- Syntax: Korrekt
- Mobile-Kompatibilität: Sollte jetzt funktionieren
