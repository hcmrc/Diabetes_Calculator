# Aktion: Causality Chains mit evidenzbasierten Pfaden neu implementiert
## Dateien: js/ui-controller.js, js/app.js, style.css, index.html
## Learnings:
- CAUSALITY_CHAINS hat jetzt 5 Pfade statt 4 (Triglyceride neu: cholTri)
- Jede Chain hat ein `riskNode` Property (Index), das den Risikofaktor-Knoten markiert
- renderCausalityChains akzeptiert jetzt 3. Parameter `contributions` fuer dynamische Sortierung
- Sortierung nach absolutem Beitrag (groesster zuerst), identisch mit Contribution Chart
- CSS-Klasse `.risk-node` fuer fettgedruckte Risikofaktor-Knoten (inkl. Dark Mode)
- Fasting Glucose Pfad hat 5 Knoten statt 4 (Gluconeogenesis-Schritt)
- Triglyceride-Pfad endet NICHT mit "Diabetes Risk" — zeigt wie Insulinresistenz zu hohen TG fuehrt
- Header-Text aktualisiert: erklaert Insulinresistenz/Insuffizienz als Kernmechanismus
- ui-controller.js nutzt literal \u escape sequences, NICHT echte Unicode-Zeichen
## Risiken:
- app.js Aufruf geaendert: marginalSummary.contributions wird als 3. Arg uebergeben — wenn marginalSummary.contributions undefined, sortiert fallback auf Originalreihenfolge (sicher)
- Neue CSS-Klasse .risk-node koennte mit zukuenftigen Styles kollidieren
