# Aktion: Literaturrecherche zu individuellen Feature-Beitraegen in logistischer Regression

## Dateien: keine Codeaenderungen

## Learnings:
- Die Methode c_i = beta_i * (x_i - mean_i) mit DeltaP_i = P_full - P_without_i entspricht exakt dem
  "Linear SHAP" Ansatz (Lundberg & Lee 2017), aber in Probability Space statt Log-Odds Space
- SHAP LinearExplainer berechnet phi_i = beta_i * (x_i - E[x_i]) -- identische Formel, aber Ausgabe
  in Log-Odds, nicht Wahrscheinlichkeit
- Strumbelj & Kononenko (2010, 2014) sind die Grundlagenpaper fuer Shapley-basierte Erklaerungen
  individueller Vorhersagen (Game-Theory-Ansatz, NICHT identisch mit der hier verwendeten Methode)
- Robnik-Sikonja & Kononenko (2008) beschreiben "probability difference before/after excluding feature"
  -- das ist der naechste Verwandte der verwendeten Methode, aber mit anderem Baseline-Konzept
- Die genaue Methode (mean-centered, one-at-a-time, probability space) findet sich NICHT als
  eigenstaendige benannte Methode in der Literatur -- sie ist eine praxisorientierte Vereinfachung
  von SHAP/Shapley fuer additive Modelle mit Wahrscheinlichkeits-Output
- Relevante Suchbegriffe: "additive feature attribution", "linear SHAP", "marginal probability
  contribution", "one-at-a-time perturbation", "mean-centered log-odds contribution"

## Risiken:
- Keine Codeaenderungen, daher kein Risiko fuer bestehende Funktionalitaet
- Bei Zitierung: Darauf achten, dass die Methode NICHT identisch mit SHAP ist (andere Ausgabe-Skala)
