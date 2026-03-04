# Diabetes_Calculator
## Diabetes Risk Calculator — Ecological Interface Design

Ein interaktives, webbasiertes Interface zur Kommunikation des logistischen Regressionsmodells von Schmidt et al. (2005) an medizinische Laien. Das Interface wurde im Rahmen einer Masterarbeit auf Basis der Ecological Interface Design (EID) Methodik (Vicente & Rasmussen, 1992) entwickelt.

## Wissenschaftlicher Hintergrund

Das Interface implementiert das validierte Risikomodell aus der **Atherosclerosis Risk in Communities (ARIC)** Studie, welches die 9-Jahres-Inzidenz von Typ-2-Diabetes auf Basis von neun Prädiktoren schätzt:

**Modellgleichung:**

P(Diabetes) = 1 / (1 + e^(−LP))

wobei LP = σ + Σ βᵢ · xᵢ mit den folgenden Koeffizienten:

| Prädiktor | β-Koeffizient | Einheit (SI) | Rolle |
|-----------|--------------|-------------|-------|
| Alter | 0.0173 | Jahre | Nicht modifizierbar |
| Ethnizität | 0.4433 | binär | Nicht modifizierbar |
| Familiäre Vorbelastung | 0.4981 | binär | Nicht modifizierbar |
| Systolischer Blutdruck | 0.0111 | mmHg | Modifizierbar |
| Taillenumfang | 0.0273 | cm | Modifizierbar |
| Körpergröße | −0.0326 | cm | Nicht modifizierbar |
| Nüchternglukose | 1.5849 | mmol/L | Modifizierbar (stärkster Prädiktor) |
| HDL-Cholesterin | −0.4718 | mmol/L | Modifizierbar (protektiv) |
| Triglyzeride | 0.242 | mmol/L | Modifizierbar |

Intercept σ = −9.9808

## Funktionen

- **Echtzeit-Risikoberechnung** mit animiertem Gauge-Display (0–100%)
- **Dual-Unit-System** — umschaltbar zwischen US-amerikanischen und SI-Einheiten
- **Faktor-Beitragsanalyse** — zeigt den individuellen Beitrag jedes Prädiktors zum Gesamtrisiko (Abweichung vom Populationsmittel der ARIC-Kohorte)
- **Radar-Chart** — multidimensionale Visualisierung der modifizierbaren Risikofaktoren relativ zu klinischen Schwellenwerten
- **Risk Timeline** — temporale Verlaufsdarstellung über Szenarien und Treatment-Simulationen hinweg, mit farbkodierten Treatment-Markern und Baseline-Referenzlinie
- **Treatment-Simulationen** — evidenzbasierte Interventionsszenarien (Blutzucker-Management, Blutdruckkontrolle, HDL-Verbesserung, Triglyzerid-Behandlung, Gewichtsmanagement) mit animierter Slider-Anpassung
- **Treatment Zone Map** — Heatmap-Darstellung der Behandlungszonen
- **Patientenverwaltung** — Speichern und Laden von Patientenprofilen via localStorage
- **Modell-Transparenz** — Beta-Vektor-Visualisierung und Kausalitätsketten zur Offenlegung der Modellstruktur (EID Abstraction Hierarchy)

## EID-Designprinzipien

Das Interface folgt den Kernprinzipien des Ecological Interface Design:

- **Abstraction Hierarchy (AH):** Darstellung der Modellstruktur auf verschiedenen Abstraktionsebenen — von Rohdaten (Slider) über funktionale Zusammenhänge (Beitragsbalken) bis zum Systemzweck (Risikowert)
- **Skills, Rules, Knowledge (SRK) Taxonomy:** Unterstützung aller drei kognitiven Verarbeitungsebenen nach Rasmussen (1983)
- **Proximity Compatibility Principle:** Räumliche Gruppierung zusammengehöriger Informationen (Wickens & Carswell, 1995)
- **Direct Perception / Direct Manipulation:** Slider-basierte Eingabe mit sofortigem visuellem Feedback

## Technologie

- Vanilla JavaScript (ES6+, IIFE-Modulpattern, `window.DRC` Namespace)
- Kein Framework, kein Bundler, kein Build-Schritt
- SVG für Diagramme (Radar-Chart, Timeline)
- CSS Custom Properties für konsistentes Theming
- Google Fonts (Inter) und Material Icons

## Projektstruktur

```
index.html              Hauptdatei des Interfaces
style.css               Gesamtes Stylesheet
js/
  config.js             Modellkoeffizienten, Schwellenwerte, Behandlungsdaten
  risk-model.js         Logistische Regression, Beitragsberechnung, Einheitenkonvertierung
  ui-helpers.js         Hilfsfunktionen (Clamping, Formatierung)
  ui-controller.js      DOM-Rendering, Slider-Updates, Gauge-Animation
  radar-chart.js        SVG-Radardiagramm der Risikofaktoren
  timeline-chart.js     SVG-Zeitverlaufsdiagramm mit Snapshot-Tracking
  treatment-simulator.js  Animierte Behandlungssimulationen
  patient-manager.js    Patientenverwaltung (localStorage)
  app.js                Anwendungslogik, Event-Binding, Zustandsverwaltung
  main.js               Bootstrap (DOMContentLoaded)
tests/
  test-risk-model.js    Modellvalidierung (62 Tests)
  test-comparison.js    Refactoring-Vergleich Original vs. Modular (55 Tests)
  test-ui-helpers.js    UI-Hilfsfunktionen (9 Tests)
```

## Verwendung

Die `index.html` direkt im Browser öffnen — es wird kein Server benötigt.

```bash
open index.html
```

Für GitHub Pages: Alle Dateien (inkl. `js/`-Ordner) in das Root-Verzeichnis des Repositories hochladen.

## Tests

```bash
node tests/test-risk-model.js
node tests/test-comparison.js
node tests/test-ui-helpers.js
```

Alle 126 Tests validieren die korrekte Implementierung des Schmidt-et-al.-Modells.

## Literatur

- Schmidt, M. I., Duncan, B. B., Bang, H., Pankow, J. S., Ballantyne, C. M., Golden, S. H., Folsom, A. R., & Chambless, L. E. (2005). Identifying individuals at high risk for diabetes: The Atherosclerosis Risk in Communities study. *Diabetes Care, 28*(8), 2013–2018. https://doi.org/10.2337/diacare.28.8.2013
- Vicente, K. J., & Rasmussen, J. (1992). Ecological interface design: Theoretical foundations. *IEEE Transactions on Systems, Man, and Cybernetics, 22*(4), 589–606. https://doi.org/10.1109/21.156574
- Wickens, C. D., & Carswell, C. M. (1995). The proximity compatibility principle: Its psychological foundation and relevance to display design. *Human Factors, 37*(3), 473–494. https://doi.org/10.1518/001872095779049408
- Rasmussen, J. (1983). Skills, rules, and knowledge: Signals, signs, and symbols, and other distinctions in human performance models. *IEEE Transactions on Systems, Man, and Cybernetics, SMC-13*(3), 257–266. https://doi.org/10.1109/TSMC.1983.6313160

