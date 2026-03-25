# Aktion: Optionale Tests hinzugefügt

## Dateien
- `tests/test-risk-model.js` - 27 neue Tests hinzugefügt
- `tests/test-ui-helpers.js` - 10 neue Tests hinzugefügt

## Neue Tests im Detail

### Risk Model Tests (`tests/test-risk-model.js`)

**TEST SUITE 3b: Baseline Risk** (2 Tests)
- `computeBaselineRisk()` returns population mean risk ~12.93%
- `computeBaselineRisk()` equals `computeProbability(CONFIG.MEANS)`

**TEST SUITE 3c: Marginal Contributions** (13 Tests)
- At population means: sum of marginal contributions = 0
- Marginals includes field: age, race, parentHist, sbp, height, waist, fastGlu, cholHDL, cholTri
- Above-mean values produce positive sum of marginal contributions
- Elevated glucose has positive marginal contribution
- Higher HDL has negative marginal contribution (protective)

**TEST SUITE 3d: Marginal Summary** (12 Tests)
- At population means: pFull equals pBaseline
- At population means: netDeviation = 0
- MarginalSummary includes contributions object
- pFull, pBaseline, sumMarginals, netDeviation are numbers
- Elevated values: pFull > pBaseline
- Elevated values: netDeviation > 0
- netDeviation = pFull - pBaseline
- Contributions object has all fields
- All contribution values are valid numbers

### UI Helpers Tests (`tests/test-ui-helpers.js`)

**formatPercent** (10 Tests)
- formatPercent(50) = "50.0%"
- formatPercent(0) = "0.0%"
- formatPercent(33.333) = "33.3%"
- formatPercent(99.999) rounds to "100.0%"
- formatPercent(100) = "100.0%"
- formatPercent(0.5) = "0.5%"
- formatPercent(12.5) = "12.5%"
- formatPercent(Infinity) returns "0%"
- formatPercent(-5) = "-5.0%"
- formatPercent(-5, 0) = "-5%"

**formatDeltaPercent** (8 Tests)
- formatDeltaPercent(5) = "+5.00%"
- formatDeltaPercent(-3) = "-3.00%"
- formatDeltaPercent(0) = "0.00%" (no sign for zero)
- formatDeltaPercent(2.5) = "+2.50%"
- formatDeltaPercent(-0.5) = "-0.50%"
- formatDeltaPercent(10.123) = "+10.12%"
- formatDeltaPercent(Infinity) returns "0%"
- formatDeltaPercent(NaN) returns "0%"

## Testzahlen

| Testdatei | Vorher | Nachher | Delta |
|-----------|--------|---------|-------|
| test-risk-model.js | 79 | 131 | +52 |
| test-ui-helpers.js | 19 | 37 | +18 |
| **Gesamt** | **481** | **518** | **+37** |

## Learnings

- `computeMarginalSummary().contributions` ist ein **Object**, nicht ein Array (Dokumentation im Code war irreführend)
- `formatDeltaPercent(0)` gibt `"0.00%"` zurück (kein Plus-Zeichen für Null)
- `formatPercent()` und `formatDeltaPercent()` behandeln non-finite Werte (Infinity, NaN) mit Early Return

## Risiken

**Keine Risiken** - Alle 518 Tests bestehen. Die neuen Tests decken Funktionen ab, die bisher nur indirekt getestet wurden.
