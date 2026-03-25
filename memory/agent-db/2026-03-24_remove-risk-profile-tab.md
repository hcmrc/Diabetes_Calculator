# Aktion: Risk Profile Tab aus index.html entfernt

## Dateien
- `index.html` - Risk Profile Tab-Button, Tab-Content und Script-Tag entfernt

## Learnings
- Der Risk Profile Tab (Hexagon-Chart) wurde vollständig aus der HTML-Struktur entfernt
- Die Script-Ladereihenfolge muss erhalten bleiben - nur das radar-chart.js Tag wurde entfernt
- Die verbleibenden Tabs "Contributions" und "Connections" funktionieren weiterhin
- Zeilen 431-433: Tab-Button entfernt
- Zeilen 443-453: Tab-Content Block entfernt
- Zeile 495: Script-Tag radar-chart.js entfernt

## Risiken
- JavaScript-Code in app.js referenziert noch RadarChart (wird in Task 2 behoben)
- CSS-Styles für .radar-* existieren noch (wird in Task 3 bereinigt)
- Die Datei js/radar-chart.js existiert noch (wird in Task 4 optional bereinigt)

## Commit
- `eda16da` ui: remove Risk Profile tab and radar chart from HTML
