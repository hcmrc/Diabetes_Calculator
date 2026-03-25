# Aktion: SIMULATION_EFFECTS mit neuen evidenzbasierten Werten aktualisiert
## Dateien: js/config.js, js/treatment-simulator.js, tests/test-risk-model-edge-cases.js, tests/test-treatment-simulator.js, tests/test-risk-model.js
## Learnings:
- SIMULATION_EFFECTS hat jetzt geschlechtsabhaengige Struktur fuer sbp: siMale/siFemale/usMale/usFemale statt si/us
- getEffectDelta() in treatment-simulator.js prueft fx.siMale !== undefined fuer sex-dependent Logik
- Sex wird aus DRC.UIController.readInputs().sex gelesen (1=male, 0=female)
- SBP gleiche Einheit in US und SI (mmHg), daher usMale===siMale und usFemale===siFemale
- Waist-Wert: -7.13 kg Gewichtsverlust wurde zu -7.13 cm Bauchumfang konvertiert (1 cm/kg Ratio, Ross et al.)
- HDL/Triglyceride: Prozentuale Werte (+31%, -30%) zu festen Deltas konvertiert basierend auf Default-Werten
- Alle Tests die fx.si/fx.us direkt lesen mussten fuer sbp angepasst werden (3 Testdateien)
- Tests verwenden fx.siMale als repraesentativen Wert fuer sbp in Risikoberechnungstests
## Risiken:
- CONFIG ist Object.freeze() — neue Struktur muss kompatibel bleiben
- Wenn readInputs() keinen sex-Wert liefert, faellt isMale auf false (female) zurueck
- Groessere Simulationsdeltas koennten dazu fuehren, dass Slider an min/max Grenzen clampen (clampAndRound faengt das ab)
