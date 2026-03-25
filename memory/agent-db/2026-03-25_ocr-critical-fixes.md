# Aktion: Kritische OCR-Fixes (Icon-Utility + Canvas Cleanup)

## Dateien: `js/ocr-ui-controller.js`, `js/ocr-service.js`

## Learnings:

### 1. Icon-Utility Fix (Zeilen 119, 274 in ocr-ui-controller.js)
**Problem:** `if (window.lucide) lucide.createIcons()` ist die direkte Lucide-API, aber das Projekt hat eine eigene Utility-Funktion `DRC.UIHelpers.refreshIcons()`.

**Loesung:** Geaendert zu `DRC.UIHelpers.refreshIcons()` - dies ist die projekteigene Utility (siehe CODEBASE_MEMORY.md Abschnitt 10, Punkt 3: "Nach `innerHTML` mit Icons → `DRC.UIHelpers.refreshIcons()` aufrufen").

### 2. Canvas Cleanup in pdfToImage (ocr-service.js)
**Problem:** Die `pdfToImage` Funktion erstellt ein Canvas-Element (`document.createElement('canvas')`) aber bereinigt es nicht. Dies kann zu Speicherlecks fuehren, besonders bei wiederholtem PDF-Upload.

**Loesung:** Vor dem `return` wird das Canvas explizit bereinigt:
```javascript
const dataUrl = canvas.toDataURL('image/png');

// Cleanup: Canvas explizit bereinigen um Speicherlecks zu vermeiden
canvas.width = 0;
canvas.height = 0;

return dataUrl;
```

## Risiken:
- Keine Risiken - beide Aenderungen sind interne Verbesserungen ohne API-Aenderungen
- Alle 484+ Tests bleiben gruen
- Keine Auswirkungen auf User-Facing Verhalten

## Checkliste:
- [x] `memory/CODEBASE_MEMORY.md` gelesen
- [x] Alle `.md` Dateien in `memory/agent-db/` gelesen
- [x] Verstanden, was NICHT geaendert werden darf
- [x] Tests laufen lassen vor dem Commit
- [x] Learnings in `memory/agent-db/` dokumentiert
