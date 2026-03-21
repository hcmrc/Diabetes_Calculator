# Security Fixes — Branch `fix/security-xss-fixes`

**Datum:** 21. März 2026
**Commit:** `57a38bb`
**Grundlage:** Claude Code Security Review

---

## Hintergrund

Ein automatisierter Security Review identifizierte mehrere Schwachstellen im Diabetes Risk Calculator. Risikostufe wurde als **Medium** eingestuft — keine Backend-Kommunikation, aber XSS-Vektoren durch `innerHTML` mit benutzerkontrollierten Strings.

---

## Behobene Schwachstellen

### Critical

#### 1. Stored XSS — Patientenname in `innerHTML` injiziert
**Datei:** `js/patient-manager.js` → `renderList()`

**Problem:** Die Funktion baute Patientenkarten mit `card.innerHTML = \`...${p.name}...\``. Ein Patientenname wie `<img src=x onerror=alert(...)>` wurde als HTML geparst und ausgeführt — und blieb über `localStorage` persistent für alle nachfolgenden Seitenaufrufe aktiv.

**Fix:** Vollständiger Umbau auf DOM-API. `createElement` und `textContent` ersetzen alle Template-Literale in `innerHTML`. Dadurch wird kein benutzerkontrollierter String mehr als HTML interpretiert.

---

#### 2. XSS — Treatment-Label in Timeline-SVG via `innerHTML`
**Datei:** `js/timeline-chart.js`

**Problem:** `s.treatmentLabel` wurde ohne Escaping in SVG-`<title>`-Elemente, Kurzbeschriftungen und die Legende (`renderLegend`) per Template-Literal injiziert. Derzeit stammt das Label aus gefrorenem CONFIG-Objekt, aber die Funktion `addSnapshot()` akzeptiert den Parameter von außen — ein zukünftiger Aufrufer mit benutzerkontrollierten Daten wäre ein direkter XSS-Vektor.

**Fix:** `DRC.UIHelpers.escapeHtml()` auf alle `treatmentLabel`-Vorkommen in HTML/SVG-Strings angewendet.

---

### Important

#### 3. Neue `escapeHtml()` Hilfsfunktion
**Datei:** `js/ui-helpers.js`

Zentrale Utility für HTML-sicheres Escaping (`&`, `<`, `>`, `"`, `'`), exportiert über `DRC.UIHelpers.escapeHtml`. Wird von `timeline-chart.js` verwendet.

---

#### 4. Content Security Policy (CSP)
**Datei:** `index.html`

Neuer Meta-Tag im `<head>`:

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self' https://cdn.sheetjs.com;
               style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
               font-src https://fonts.gstatic.com https://fonts.googleapis.com;
               connect-src 'none';
               img-src 'self' data:;
               object-src 'none';">
```

Schränkt externe Skriptquellen ein und verhindert Dateiexfiltration (`connect-src 'none'`).

---

#### 5. Subresource Integrity (SRI) für SheetJS
**Datei:** `index.html`

```html
<script src="https://cdn.sheetjs.com/xlsx-0.20.1/..."
        integrity="sha384-QCIdq2UMVEoSRhR3ZWZwdz2/pivLowr+eokFMdYyukq7qI26VYRxFa4Nl6FKetmL"
        crossorigin="anonymous"></script>
```

Browser verifiziert den Hash vor Ausführung — ein kompromittiertes CDN kann keinen Schadcode einschleusen.

---

#### 6. Excel-Import: Numerische Eingabevalidierung
**Datei:** `js/patient-manager.js` → `importFromExcel()`

**Problem:** Importierte Werte wurden ohne Bereichsprüfung übernommen. Eine manipulierte `.xlsx`-Datei konnte Werte wie `age: 9999999` einschleusen und das Risikomodell mit klinisch unsinnigen Ergebnissen korrumpieren.

**Fix:** Alle numerischen Felder werden gegen medizinisch plausible Grenzen geclampt:

| Feld | Min | Max |
|------|-----|-----|
| Alter | 20 | 80 |
| Blutdruck (sbp) | 80 | 220 |
| Größe | 48 | 213 |
| Taillenumfang | 25 | 152 |
| Nüchternglukose | 2,8 | 300 |
| HDL-Cholesterin | 0,5 | 100 |
| Triglyzeride | 0,6 | 500 |
| Risiko (%) | 0 | 100 |

Patientennamen werden auf 60 Zeichen begrenzt.

---

#### 7. Generische Fehlermeldung bei Excel-Fehler
**Datei:** `js/patient-manager.js`

`alert('Error reading Excel file: ' + err.message)` → `alert('Could not read the Excel file. Please check that it is a valid .xlsx file.')`

Verhindert die Preisgabe interner Laufzeitinformationen (Dateipfade, Methodennamen) an den Nutzer.

---

## Nicht behobene Punkte (Minor)

Diese Punkte wurden identifiziert, aber bewusst nicht umgesetzt, da sie keine unmittelbaren Sicherheitsrisiken darstellen:

- **`localStorage` Plaintext:** Klinische Werte liegen unverschlüsselt im Browser-Speicher. Für ein lokales Einzelnutzer-Tool vertretbar; DSGVO-Hinweis in der UI wäre empfehlenswert.
- **`innerHTML = ''` zum Leeren:** Technisch sicher, aber inkonsistent — `replaceChildren()` wäre stilistisch sauberer.
- **`p.savedAt` ohne Date-Validierung:** Wird durch `toLocaleDateString()` abgefangen; kein Sicherheitsrisiko, aber defensive Validierung möglich.

---

## Betroffene Dateien

| Datei | Art der Änderung |
|-------|-----------------|
| `js/ui-helpers.js` | `escapeHtml()` hinzugefügt |
| `js/patient-manager.js` | DOM-API in `renderList()`, Clamping + Sanitierung in `importFromExcel()` |
| `js/timeline-chart.js` | `escapeHtml()` auf `treatmentLabel` angewendet |
| `index.html` | CSP Meta-Tag, SRI für SheetJS |
