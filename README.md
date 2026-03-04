# Diabetes_Calculator
## Diabetes Risk Calculator - Ecological Interface Design

An interactive, web-based interface for communicating the logistic regression model by Schmidt et al. (2005) to medical laypersons. The interface was developed as part of a master's thesis based on the Ecological Interface Design (EID) methodology (Vicente & Rasmussen, 1992).

## Scientific Background

The interface implements the validated risk model from the **Atherosclerosis Risk in Communities (ARIC)** study, which estimates the 8-year incidence of type 2 diabetes based on nine predictors:

**Model equation:**

P(Diabetes) = 1 / (1 + e^(−LP))

where LP = σ + Σ βᵢ · xᵢ with the following coefficients:

| Predictor | β Coefficient | Unit (SI) | Role |
|-----------|--------------|-----------|------|
| Age | 0.0173 | years | Non-modifiable |
| Ethnicity | 0.4433 | binary | Non-modifiable |
| Family history | 0.4981 | binary | Non-modifiable |
| Systolic blood pressure | 0.0111 | mmHg | Modifiable |
| Waist circumference | 0.0273 | cm | Modifiable |
| Height | −0.0326 | cm | Non-modifiable |
| Fasting glucose | 1.5849 | mmol/L | Modifiable (strongest predictor) |
| HDL cholesterol | −0.4718 | mmol/L | Modifiable (protective) |
| Triglycerides | 0.242 | mmol/L | Modifiable |

Intercept σ = −9.9808

## Features

- **Real-time risk calculation** with animated gauge display (0–100%)
- **Dual-unit system** — switchable between US customary and SI units
- **Factor contribution analysis** — shows each predictor's individual contribution to overall risk (deviation from the ARIC cohort population mean)
- **Radar chart** — multidimensional visualization of modifiable risk factors relative to clinical thresholds
- **Risk timeline** — temporal progression across scenarios and treatment simulations, with color-coded treatment markers and baseline reference line
- **Treatment simulations** — evidence-based intervention scenarios (blood glucose management, blood pressure control, HDL improvement, triglyceride treatment, weight management) with animated slider adjustment
- **Treatment zone map** — heatmap visualization of treatment zones
- **Patient management** — save and load patient profiles via localStorage
- **Model transparency** — beta vector visualization and causal chains to disclose model structure (EID Abstraction Hierarchy)

## EID Design Principles

The interface follows the core principles of Ecological Interface Design:

- **Abstraction Hierarchy (AH):** Representation of model structure across multiple levels of abstraction — from raw data (sliders) through functional relationships (contribution bars) to system purpose (risk score)
- **Skills, Rules, Knowledge (SRK) Taxonomy:** Support for all three cognitive processing levels according to Rasmussen (1983)
- **Proximity Compatibility Principle:** Spatial grouping of related information (Wickens & Carswell, 1995)
- **Direct Perception / Direct Manipulation:** Slider-based input with immediate visual feedback

## Technology

- Vanilla JavaScript (ES6+, IIFE module pattern, `window.DRC` namespace)
- No framework, no bundler, no build step
- SVG for diagrams (radar chart, timeline)
- CSS Custom Properties for consistent theming
- Google Fonts (Inter) and Material Icons

## Project Structure

```
index.html              Main interface file
style.css               Complete stylesheet
js/
  config.js             Model coefficients, thresholds, treatment data
  risk-model.js         Logistic regression, contribution calculation, unit conversion
  ui-helpers.js         Utility functions (clamping, formatting)
  ui-controller.js      DOM rendering, slider updates, gauge animation
  radar-chart.js        SVG radar chart of risk factors
  timeline-chart.js     SVG timeline chart with snapshot tracking
  treatment-simulator.js  Animated treatment simulations
  patient-manager.js    Patient management (localStorage)
  app.js                Application logic, event binding, state management
  main.js               Bootstrap (DOMContentLoaded)
tests/
  test-risk-model.js    Model validation (62 tests)
  test-comparison.js    Refactoring comparison original vs. modular (55 tests)
  test-ui-helpers.js    UI utility functions (9 tests)
```

## Usage

Open `index.html` directly in the browser — no server required.

```bash
open index.html
```

For GitHub Pages: Upload all files (including the `js/` directory) to the repository's root directory.

## Tests

```bash
node tests/test-risk-model.js
node tests/test-comparison.js
node tests/test-ui-helpers.js
```

All 126 tests validate the correct implementation of the Schmidt et al. model.

## References

- Schmidt, M. I., Duncan, B. B., Bang, H., Pankow, J. S., Ballantyne, C. M., Golden, S. H., Folsom, A. R., & Chambless, L. E. (2005). Identifying individuals at high risk for diabetes: The Atherosclerosis Risk in Communities study. *Diabetes Care, 28*(8), 2013–2018. https://doi.org/10.2337/diacare.28.8.2013
- Vicente, K. J., & Rasmussen, J. (1992). Ecological interface design: Theoretical foundations. *IEEE Transactions on Systems, Man, and Cybernetics, 22*(4), 589–606. https://doi.org/10.1109/21.156574
- Wickens, C. D., & Carswell, C. M. (1995). The proximity compatibility principle: Its psychological foundation and relevance to display design. *Human Factors, 37*(3), 473–494. https://doi.org/10.1518/001872095779049408
- Rasmussen, J. (1983). Skills, rules, and knowledge: Signals, signs, and symbols, and other distinctions in human performance models. *IEEE Transactions on Systems, Man, and Cybernetics, SMC-13*(3), 257–266. https://doi.org/10.1109/TSMC.1983.6313160



