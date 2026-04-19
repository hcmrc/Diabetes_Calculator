# Studienaufbau: Nutzertest des Diabetes-Risikorechners — Arzt-Patient-Interaktion mit EID-basiertem Interface

**Projekt:** Masterarbeit — Ökologisches Interface-Design für Diabetes-Risikoberechnung  
**Datum:** 2026-04-18  
**Status:** Entwurf  

---

## 1. Hintergrund und Motivation

### 1.1 Kontext

Der Diabetes Risk Calculator (DRC) ist ein clientseitiges Web-Tool, das auf dem ARIC-Risikomodell (Schmidt et al., 2005) basiert und das 9-Jahres-Diabetesrisiko aus neun Risikofaktoren berechnet. Das Interface wurde nach Prinzipien des Ecological Interface Design (EID) entwickelt und implementiert SRK-Taxonomie-Unterstützung (Skills-Rules-Knowledge), Kausalitätsketten (Causality Chains), einen divergierenden Tornado-Chart zur Beitragsdarstellung und eine animierte Therapiesimulation.

### 1.2 Problemstellung

Obwohl EID-basierte Interfaces in hochkritischen Domänen (Anästhesie, Kernkraft, Prozesskontrolle) extensiv evaluiert wurden, existieren kaum Studien zur Evaluation von EID-Interfaces im Kontext der Arzt-Patient-Kommunikation bei chronischen Erkrankungen. Die vorliegende Studie schließt diese Lücke, indem sie untersucht, ob ein EID-basiertes Diabetes-Risikointerface die Arzt-Patient-Kommunikation über individuelle Risikofaktoren und Therapieoptionen unterstützt.

### 1.3 Forschungsstand

**EID-Evaluation in der Medizin:** Bisherige EID-Evaluations konzentrierten sich auf Anästhesie-Monitore (Jungk et al., 2000; Lau et al., 2008), Intensivmedizin (Wu et al., 2019; Rovati et al., 2024) und kardiovaskuläre Risikodarstellung (Burns et al., 2008). Methodisch dominieren Simulationsstudien, NASA-TLX und Situation-Awareness-Messungen.

**SUS in medizinischen Interfaces:** Maramba et al. (2019) identifizierten in einem Scoping Review von 133 eHealth-Usability-Studien den SUS als häufigstes Fragebogeninstrument (n=44). Kombinationen mit Think-Aloud (n=45), Interviews (n=37) und Aufgabenabschluss-Raten (n=57) sind etablierte Praxis.

**Diabetes-Risikokalkulatoren:** Febriani & Aryu (2024) evaluierten DiaCal mit SUS (Score: 85,25). Olchanski et al. (2025) untersuchten einen EHR-integrierten Risikoprädiktor mit Fokusgruppen und fanden, dass die ärztliche Vertrauen in die individuelle Risikoeinschätzung von 41,6% auf 92,8% stieg. Collis et al. (2025) zeigten, dass nur 4/23 Patienten ihren Risikoscore mit dem Arzt teilten — trotz hoher Motivation.

**Kleine qualitative Studien:** IEC 62366-1 akzeptiert 3–8 Teilnehmer für formative Evaluationen. Hong et al. (2025) evaluierten ein Rehabilitations-Gerät mit 5 Therapeuten und kombinierter Cognitive-Walkthrough/SUS-Methodik. Grove et al. (2023) testeten ein Childhood-Obesity-Risk-Tool mit 5 Health Visitors und 7 Eltern und erzielten einen SUS-Score von 84,4.

---

## 2. Forschungsfragen

| Nr. | Forschungsfrage | Erhebungsmethode |
|-----|----------------|-----------------|
| **F1** | Wie bewerten Ärzte und Patienten die Gebrauchstauglichkeit (Usability) des DRC? | SUS-Fragebogen |
| **F2** | Inwiefern unterstützt das EID-basierte Interface die Arzt-Patient-Kommunikation über Diabetesrisiko? | Semi-strukturierte Interviews |
| **F3** | Welche EID-spezifischen Designelemente (Kausalitätsketten, Beitragsgewichte, Therapiesimulation) werden von Ärzten und Patienten verstanden und genutzt? | Think-Aloud + Aufgabenbeobachtung |
| **F4** | Welche Usability-Probleme treten bei der Nutzung des Rechners im gemeinsamen Arzt-Patient-Szenario auf? | Cognitive Walkthrough + Think-Aloud |
| **F5** | Wie unterscheiden sich die Bewertungsprofile zwischen Ärzten und Patienten hinsichtlich Nützlichkeit, Verständlichkeit und Vertrauen? | SUS-Subskalenanalyse + Interviewvergleich |

---

## 3. Methodik

### 3.1 Studiendesign

**Mixed-Methods-Ansatz** mit konvergentem parallelem Design (Creswell & Plano Clark, 2018):

- **Quantitativ:** System Usability Scale (SUS) — 10 Items, 5-Punkt-Likert-Skala
- **Qualitativ:** Semi-strukturierte Interviews + Think-Aloud-Protokoll + Beobachtungsprotokoll

Das quantitative und qualitative Datenstrang werden simultan erhoben und triangulativ ausgewertet.

### 3.2 Stichprobe

| Rolle | N | Rekrutierung | Einschlusskriterien |
|-------|---|-------------|-------------------|
| **Ärzte** (Hausärzte/Diabetologen) | 5–8 | Fachärztekammer, Kliniknetzwerke, Ärzteverbünde | Approbation als Arzt, mindestens gelegentliche Diabetikerkonsultationen |
| **Patienten/Laien** | 5–8 | Selbsthilfegruppen, Aushänge, Online-Rekrutierung | Alter 30–75, keine medizinische Ausbildung, keine Diagnose Typ-2-Diabetes (Präventionskontext) |
| **Gesamt** | 10–16 | — | — |

**Begründung:** Die Stichprobengröße von 5–8 pro Gruppe orientiert sich an IEC 62366-1 (3–8 für formative Evaluationen) und der qualitativen Sättigung nach Guest et al. (2006), der bereits bei n≈6–12 in homogenen Gruppen erreicht werden kann. Die Trennung nach Rolle folgt dem Ansatz von Grove et al. (2023) und Collis et al. (2025).

### 3.3 Versuchsaufbau

#### Szenario-Design: Arzt-Patient-Interaktion

Die Studie simuliert eine typische Arzt-Patient-Konsultation, in der der Arzt dem Patienten das individuelle Diabetesrisiko anhand des Rechners erklärt. Dies folgt dem Paradigma der Shared Decision Making (SDM) und dem Befund von Collis et al. (2025), dass ärztliche Vermittlung entscheidend für die Risikokommunikation ist.

**Ablauf pro Dyade (Arzt + Patient) — Gesamtdauer: 20–30 Min:**

```
┌─────────────────────────────────────────────────────────────────┐
│ Phase 1: Einleitung (3 Min)                                    │
│   - Kurze Einführung: "Erklären Sie dem Patienten  │
│     das Diabetesrisiko mithilfe des Rechners"                  │
│   - Denken Sie laut während der Bedienung                      │
│   - Kein Demografie-Fragebogen (vorab online/ausgefüllt)     │
├─────────────────────────────────────────────────────────────────┤
│ Phase 2: Szenario-Durchführung mit Think-Aloud (12–18 Min)     │
│                                                                 │
│   Szenario 1 (6–8 Min): Arzt erklärt Risiko                    │
│   - Vorgegebenes Patientenprofil eingeben                      │
│   - Risiko erklären, Beitragsgewichte zeigen                   │
│   - Kausalitätskette für Hauptrisikofaktor                    │
│                                                                 │
│   Szenario 2 (6–10 Min): Gemeinsame Exploration                │
│   - Therapiesimulation starten                                 │
│   - Patient fragt "Was passiert wenn…?" → Slider anpassen     │
│   - Freie Exploration (Rest der Zeit)                          │
│   - Bildschirm- und Audioaufzeichnung                          │
├─────────────────────────────────────────────────────────────────┤
│ Phase 3: SUS + Kurz-Interview (5–8 Min)                        │
│   - SUS-Fragebogen (2–3 Min, getrennt)                         │
│   - 4–5 fokussierte Interviewfragen (3–5 Min, getrennt)       │
│     Arzt: Kommunikation? Klinische Plausibilität? Verbesserung?│
│     Patient: Verständnis? Vertrauen? Nutzen allein vs. mit Arzt?│
├─────────────────────────────────────────────────────────────────┤
│ Debriefing (1 Min)                                             │
│   - Dank, Vergütungshinweis                                    │
└─────────────────────────────────────────────────────────────────┘

Gesamtdauer pro Dyade: 20–30 Minuten
```

**Zeitersparnis-Strategien:**
- **Demografie vorab:** Online-Fragebogen wird vor dem Termin ausgefüllt (keine Sitzungszeit)
- **Einwilligung vorab:** Digitale Einverständniserklärung vor dem Termin
- **Interview fokussiert:** Nur 4–5 Kernfragen statt 10 pro Rolle (s. gekürzten Leitfaden)
- **Think-Aloud integriert:** Kein separates Interview — Beobachtung + LAUT Denken liefert die qualitativen Daten
- **SUS sofort nach Interaktion:** Vermeidet Erinnerungsverzerrung
```

### 3.4 Aufgaben-Szenarien

Die Aufgaben sind auf **12–18 Minuten Gesamtinteraktion** ausgelegt und decken alle zentralen Interface-Funktionen ab.

#### Szenario 1: Risikovermittlung (6–8 Min, Arzt-geführt)

> *"Sie sind Hausarzt/-ärztin und betreuen Frau M., 52 Jahre. Bitte geben Sie ihre Werte ein und erklären Sie ihr das Diabetesrisiko mit dem Rechner. Denken Sie dabei laut."*
>
> **Vorgaben:** Frau M., 52 J., weiblich, nicht-afroamerikanisch, ein Elternteil mit Diabetes, Taille 95 cm, Größe 168 cm, Nüchternglukose 110 mg/dL, Blutdruck 135 mmHg, HDL 45 mg/dL, Triglyzeride 180 mg/dL

**Abdeckung:** Slider-Eingabe, Risiko-Prozent + Ampelsystem, Tornado-Chart, Kausalitätskette

#### Szenario 2: Gemeinsame Exploration (6–10 Min, interaktiv)

> *"Patient, bitte fragen Sie, was Sie interessiert: 'Was passiert, wenn ich abnehme?' oder 'Wie beeinflusst meine Glukose mein Risiko?' Nutzen Sie den Rechner gemeinsam."*

**Abdeckung:** Therapiesimulation, What-If-Badges, Risiko-Reduktion verstehen, ggf. Modellwechsel

### 3.5 Erhebungsinstrumente

#### 3.5.1 System Usability Scale (SUS)

Die SUS (Brooke, 1996) ist das etablierteste Instrument zur Messung der wahrgenommenen Gebrauchstauglichkeit. In der deutschsprachigen Version wird die Übersetzung von Hornbæk (2006) bzw. der etablierten DIN-ISO 9241-11-kompatiblen Fassung verwendet.

**SUS-Auswertung:**
- Gesamtscore (0–100), interpretiert nach Bangor et al. (2009):
  - ≥80,5: A (Best imaginable)
  - 72,5–80,4: B (Excellent)
  - 63,5–72,4: C (Good)
  - 51,5–63,4: D (OK)
  - 25,0–51,4: E (Poor)
  - <25,0: F (Worst imaginable)
- **Subskalenanalyse** nach Lewis & Sauro (2017):
  - SUS(Usability): 8 Items (1–2, 3–4, 5–6, 7–8, 9–10 ungerade Items)
  - SUS(Learnability): 2 Items (Items 4 und 10)
- **Adjektiv-Rating** nach Bangor et al. (2009) als ergänzende 7-Punkt-Skala

**Begründung der SUS-Wahl:** Die SUS ist das am häufigsten verwendete Usability-Instrument in eHealth-Studien (Maramba et al., 2019) und hat sich in medizinischen Kontexten mit kleinen Stichproben bewährt (Grove et al., 2023; Hong et al., 2025; Nair et al., 2015). Die Subskalenanalyse nach Lewis & Sauro (2017) erlaubt differenziertere Aussagen über Usability vs. Learnability.

#### 3.5.2 Think-Aloud-Protokoll

- **Concurrent Think-Aloud** (Ericsson & Simon, 1993) während der Aufgabenbearbeitung
- Audio- und Bildschirmaufzeichnung (mit Einverständnis)
- Minimal-invasive Moderation: Nur Nachfragen bei Schweigen >15 Sek.
- Fokus auf: Verständnisketten, Unsicherheiten, überraschte Reaktionen, Navigationsschwierigkeiten

#### 3.5.3 Fokussiertes Interview (3–5 Min)

**Arzt (4 Fragen):**
1. Hat der Rechner Ihre Erklärung unterstützt oder behindert? Inwiefern?
2. Wie verständlich waren die Kausalitätsketten und Beitragsgewichte — für Sie? Für den Patienten?
3. Würden Sie den Rechner in der Praxis einsetzen? Unter welchen Bedingungen?
4. Was wäre die wichtigste Verbesserung?

**Patient (4 Fragen):**
1. Was hat Ihnen am meisten geholfen, Ihr Risiko zu verstehen?
2. Gab es etwas, das Sie verwirrt hat?
3. Würden Sie den Rechner eher allein oder mit ärztlicher Begleitung nutzen?
4. Was wäre die wichtigste Verbesserung?

**Begründung der Kürzung:** Think-Aloud während der Interaktion liefert bereits umfangreiche qualitative Daten. Die 4 fokussierten Fragen pro Rolle decken die Kernaspekte (Kommunikation, Verständnis, Nützlichkeit, Verbesserung) ab, ohne die Gesamtdauer zu sprengen. Die längeren Leitfäden (10 Fragen) können für optionale Follow-up-Interviews verwendet werden (s. Anhang E).

#### 3.5.4 Beobachtungsprotokoll

Strukturierte Erfassung während der Aufgabenbearbeitung:

| Kategorie | Operationalisierung |
|-----------|-------------------|
| **Aufgabenerfolg** | 3-Punkt-Skala: vollständig / teilweise / nicht erfüllt |
| **Zeit pro Aufgabe** | Sekunden (automatisch via Screen-Recording) |
| **Fehler** | Anzahl und Art der Bedienfehler pro Aufgabe |
| **Hilfeanfragen** | Anzahl der spontanen Hilfeanfragen |
| **Nutzung EID-Features** | Welche Elemente wurden genutzt? (Tornado, Causality Chains, Therapiesimulation, Icon Array, What-If-Badges) |
| **Kommunikationsmuster** | Arzt-geführt vs. Patient-geführt vs. gemeinsam |
| **Affektive Reaktionen** | Verbale/nonverbale Signale (Überraschung, Verwirrung, Erleichterung, Frustration) |

### 3.6 Technische Ausstattung

| Komponente | Spezifikation |
|-----------|-------------|
| **Rechner** | Laptop oder Desktop (min. 13" Bildschirm) |
| **Bildschirmaufzeichnung** | OBS Studio oder ähnlich (Screen + Audio) |
| **Audioaufzeichnung** | Separate Tonaufzeichnung für Interview |
| **Browser** | Chrome (letzte Version) — wie im Produktivbetrieb |
| **Maus/Touchpad** | Beides verfügbar (Präferenz erfragen) |
| **Einheiten** | Metrisch (Standard) oder US (je nach Präferenz) |
| **Sprache** | Deutsch (primär), Englisch/Französisch/Spanisch verfügbar |

---

## 4. Studiendurchführung

### 4.1 Rekrutierung

- **Ärzte:** Über Fachärztekammer, Kliniknetzwerke, ärztliche Verbünde, LinkedIn/XING
- **Patienten:** Über Selbsthilfegruppen (Deutscher Diabetiker Bund), Aushänge in Hausarztpraxen, Online-Rekrutierung (Kleinanzeigen, soziale Medien)
- **Einschlusskriterien:** Siehe 3.2
- **Ausschlusskriterien:** Berufliche UX/UI-Erfahrung, bekannte Sehbehinderung (korrigierte Sehkraft ausreichend), kognitive Einschränkungen

### 4.2 Ablaufplan

| Woche | Aktivität |
|-------|-----------|
| 1–2 | Finalisierung des Studienprotokolls, Ethikantrag |
| 3–4 | Rekrutierung (fortlaufend), Demografie-Fragebogen online |
| 5–7 | Datenerhebung (2–3 Dyaden pro Woche, je 20–30 Min) |
| 8–9 | Transkription und Datenaufbereitung |
| 10–12 | Qualitative Analyse (Codierung, thematische Analyse) |
| 13–14 | Quantitative Auswertung (SUS-Statistiken), Triangulation |
| 15 | Bericht |

### 4.3 Ethik und Datenschutz

- **Einwilligung:** Digitale Einverständniserklärung **vorab** (keine Sitzungszeit)
- **Demografie:** Online-Fragebogen **vorab** ausgefüllt (keine Sitzungszeit)
- **Datenschutz:** Anonymisierung aller Daten (Pseudonyme), DSGVO-konforme Speicherung
- **Audio-/Videoaufzeichnung:** Separate Einwilligung, Löschung nach Transkription
- **Ethikvotum:** Einreichung bei der Ethikkommission der TU Berlin
- **Vergütung:** Pauschal 25 € (Patienten) bzw. 50 € (Ärzte) für die 20–30 Min Session

---

## 5. Auswertung

### 5.1 Quantitativ: SUS-Auswertung

**Schritt 1: Score-Berechnung**
- SUS-Score nach Brooke (1996): Summe der normierten Items × 2,5
- SUS(Usability)-Subskala und SUS(Learnability)-Subskala nach Lewis & Sauro (2017)
- Adjektiv-Rating nach Bangor et al. (2009)

**Schritt 2: Deskriptivstatistik**
- Mittelwert, Standardabweichung, Median, Min, Max pro Gruppe (Ärzte vs. Patienten)
- Konfidenzintervall (95%) für den SUS-Gesamtscore
- Grading nach Bangor et al. (2009) Buchstaben-Notensystem

**Schritt 3: Gruppenvergleich**
- Mann-Whitney-U-Test (nicht-parametrisch, angemessen für kleine Stichproben)
- Vergleich: Ärzte vs. Patienten für SUS-Gesamtscore, SUS(U), SUS(L)
- Effektstärke: r = Z / √N nach Field (2018)

**Schritt 4: Benchmarking**
- Vergleich mit publizierten SUS-Scores ähnlicher medizinischer Interfaces:
  - SLOPE CORE (Childhood-Obesity-Risk-Tool): SUS 84,4 (Grove et al., 2023)
  - DiaCal (Diabetes-Risk-Kalkulator): SUS 85,25 (Febriani & Aryu, 2024)
  - CDSS Chronic Pain: SUS 81,1 / 70,4 (Nair et al., 2015)
  - Neutropenie-Screening-Gerät: SUS 86,1 (Lamaj et al., 2022)
  - PPR 2.0 Calculator (Pflege): SUS 65,5 (Powering et al., 2025)

### 5.2 Qualitativ: Thematische Analyse

**Schritt 1: Transkription**
- Wortgetreue Transkription aller Interviews und Think-Aloud-Passagen
- Ergänzung durch Beobachtungsprotokolle

**Schritt 2: Codierung**
- Deduktiv-induktive Codierung nach Braun & Clarke (2006):
  - **Deduktive Kategorien** (aus Forschungsfragen abgeleitet):
    - EID-Verständnis (Kausalität, Beitragslogik, Therapiesimulation)
    - Kommunikationsunterstützung (Arzt-Patient-Interaktion)
    - Vertrauen und Transparenz
    - Usability-Probleme (Navigation, Verständnis, Fehler)
  - **Induktive Kategorien** (aus dem Material entwickelt):
    - Emergente Themen, die nicht im Leitfaden vorgesehen waren

**Schritt 3: Thematische Analyse**
- Kategorienbildung und -verfeinerung in iterativen Zyklen
- Axiale Codierung: Zusammenhänge zwischen Kategorien identifizieren
- Selektive Codierung: Kernkategorien und narrative Struktur entwickeln

**Schritt 4: Triangulation**
- Abgleich der qualitativen Befunde mit SUS-Scores:
  - Usability-Probleme in Interviews → Korrespondierende SUS-Items
  - Positive Aussagen → Hohe SUS-Subskalen-Werte
  - Diskordanzen explizit benennen und interpretieren

### 5.3 EID-spezifische Auswertung

Zusätzlich zu den allgemeinen Usability-Metriken werden EID-spezifische Aspekte ausgewertet:

| EID-Prinzip | Operationalisierung | Messung |
|-------------|-------------------|---------|
| **Skill-Based Behavior** | Direkte Interaktion mit Slidern, sofortige Rückmeldung | Beobachtungsprotokoll: Reaktionszeit, Slider-Interaktionen |
| **Rule-Based Behavior** | Ampelsystem, Schwellenwert-Anzeige, klinische Zonen | Interview: Verständnis der Farbgebung, Schwellenwerte |
| **Knowledge-Based Behavior** | Kausalitätsketten, Beitragsgewichte, Therapiesimulation | Think-Aloud: Erklärung der Kausalzusammenhänge |
| **Abstraction Hierarchy** | Nutzung verschiedener Detailebenen (Slider → Chart → Causality Chain → Therapy) | Beobachtung: Welche Ebenen werden aufgesucht, in welcher Reihenfolge |
| **Direct Perception** | Preattentive Farbgebung, Icon-Array, Risiko-Prozent | Interview: Welche Elemente werden sofort verstanden |

### 5.4 Darstellung der Ergebnisse

**Quantitativ:**
- Boxplot: SUS-Gesamtscores (Ärzte vs. Patienten)
- Balkendiagramm: SUS(U) vs. SUS(L) pro Gruppe
- Benchmark-Vergleichstabelle mit publizierten SUS-Scores

**Qualitativ:**
- Thematische Karte: Haupt- und Subthemen mit Beispielen
- Zitat-Collagen: Typische und kontrastierende Aussagen
- Personas: Zusammenfassende Charakterisierung typischer Nutzerprofile

**Triangulation:**
- Joint Display Table: Qualitative Befunde neben quantitativen SUS-Werten
- Convergence-Divergence-Matrix nach Farmer et al. (2006)

---

## 6. Mögliche Ergebnisse und Interpretation

### 6.1 Erwartete Ergebnisbereiche

| Ergebnis | Interpretation | Handlungsempfehlung |
|----------|---------------|-------------------|
| SUS ≥ 72,5 (B oder A) | Gut bis exzellent nutzbar | Feintuning, keine grundlegenden Änderungen |
| SUS 63,5–72,4 (C) | Akzeptabel, aber Verbesserungsbedarf | Gezielte Überarbeitung identifizierter Probleme |
| SUS < 63,5 (D oder schlechter) | Eingeschränkte Nutzbarkeit | Grundlegende Überarbeitung erforderlich |
| Ärzte > Patienten | Fachwissen kompensiert Usability-Probleme | Patienten-spezifische Verbesserungen |
| Patienten > Ärzte | Interface intuitiv, aber klinisch unzureichend | Erweiterung der klinischen Funktionalität |

### 6.2 EID-spezifische Hypothesen

1. **H1:** Die Kausalitätsketten (Causality Chains) werden von Ärzten häufiger und tiefergehend genutzt als von Patienten.
2. **H2:** Die Therapiesimulation wird von beiden Gruppen als wertvollste Funktion bewertet (Handlungsorientierung nach SRK).
3. **H3:** Das Icon-Array (100-Personen-Darstellung) wird von Patienten als verständlichste Risikodarstellung eingeschätzt.
4. **H4:** Die Skill-Level-Unterstützung (Slider → sofortige Rückmeldung) wird von beiden Gruppen als intuitiv bewertet.
5. **H5:** Die gemeinsame Arzt-Patient-Nutzung führt zu einer höheren wahrgenommenen Nützlichkeit als die alleinige Nutzung.

---

## 7. Referenzen

### 7.1 Kerliteratur

1. Brooke, J. (1996). SUS: A "quick and dirty" usability scale. In P. W. Jordan, B. Thomas, B. A. Weerdmeester, & A. L. McClelland (Eds.), *Usability Evaluation in Industry* (pp. 189–194). Taylor & Francis.

2. Maramba, I., Chatterjee, A., & Newman, C. (2019). Methods of usability testing in the development of eHealth applications: A scoping review. *International Journal of Medical Informatics*, 126, 95–104. https://doi.org/10.1016/j.ijmedinf.2019.03.018

3. Grove, G., Ziauddeen, N., Roderick, P., et al. (2023). Mixed methods feasibility and usability testing of a childhood obesity risk estimation tool. *BMC Public Health*, 23, 1719. https://doi.org/10.1186/s12889-023-16500-2

4. Burns, C. M., & Hajdukiewicz, J. R. (2004). *Ecological Interface Design*. CRC Press.

5. Vicente, K. J. (2002). Ecological Interface Design: Progress and Challenges. *Human Factors*, 44(1), 62–78.

6. Schmidt, M. I., et al. (2005). A metabolic score for diabetes risk assessment: The ARIC Study. *Diabetes Care*, 28(7), 1616–1622.

### 7.2 SUS in medizinischen Interfaces

7. Bangor, A., Kortum, P. T., & Miller, J. T. (2009). Determining what individual SUS scores mean: Adding an adjective rating scale. *Journal of Usability Studies*, 4(3), 114–123.

8. Lewis, J. R., & Sauro, J. (2017). Revisiting the factor structure of the System Usability Scale. *Journal of Usability Studies*, 12(4), 183–192.

9. Lamaj, G., et al. (2022). Usability Evaluation of a Noninvasive Neutropenia Screening Device (PointCheck). *JMIR*, 24(8), e37368. https://doi.org/10.2196/37368

10. Nair, K. M., et al. (2015). A Clinical Decision Support System for Chronic Pain Management in Primary Care: Usability testing and its relevance. *Journal of Innovation in Health Informatics*, 22(3), 329–332. https://doi.org/10.14236/jhi.v22i3.149

11. Hong, S., et al. (2025). AI-Based Gait Analysis System for Rehabilitation: Usability Evaluation. *JMIR Rehabil Assist Technol*, 12, e80748. https://doi.org/10.2196/80748

12. Powering, D., et al. (2025). Acceptance and Usability of a Web Application for Patient Care Level Classification. *Applied Clinical Informatics*, 16(5), 1828–1836. https://doi.org/10.1055/a-2753-9439

### 7.3 EID-Evaluation in medizinischen Domänen

13. Wu, D. T. Y., et al. (2019). Usability Testing of an Interactive Dashboard for Surgical Quality Improvement. *Applied Clinical Informatics*, 10(5), 859–869. https://doi.org/10.1055/s-0039-1698466

14. Jungk, A., Thull, B., Hoeft, A., & Rau, G. (2000). Evaluation of Two New Ecological Interface Approaches for the Anesthesia Workplace. *International Journal of Human-Computer Studies*, 52(3), 429–448.

15. Lau, N., et al. (2008). Ecological Interface Design in the Nuclear Domain. *Nuclear Engineering and Design*, 238(5), 1104–1118.

16. Rovati, L., et al. (2024). Development and usability testing of a patient digital twin for critical care education. *Frontiers in Medicine*, 10, 1336897. https://doi.org/10.3389/fmed.2023.1336897

### 7.4 Diabetes-Risikokommunikation

17. Olchanski, N., et al. (2025). Effect of discussing personalized estimates of diabetes risk for people with prediabetes. *medRxiv* preprint. https://doi.org/10.1101/2025.10.02.25337167v1

18. Collis, J., et al. (2025). Starting the Conversation: Patient Perceptions of Self-Assessed Type-2 Diabetes Risk. *PRiMER (STFM)*. https://journals.stfm.org/primer/2025/roper-0050/

19. Tichler, C., et al. (2025). Development of a patient decision aid for type 2 diabetes mellitus. *BMC Primary Care*, 26, 58. https://doi.org/10.1186/s12875-025-02772-7

20. Hsu, C.-C., et al. (2026). Patient decision aid–supported shared decision making and short-term decision-making outcomes in type 2 diabetes. *BMC Med Inform Decis Mak*, 26, 31. https://doi.org/10.1186/s12911-026-03426-z

### 7.5 Methodische Referenzen

21. Creswell, J. W., & Plano Clark, V. L. (2018). *Designing and Conducting Mixed Methods Research* (3rd ed.). SAGE.

22. Braun, V., & Clarke, V. (2006). Using thematic analysis in psychology. *Qualitative Research in Psychology*, 3(2), 77–101.

23. Guest, G., Bunce, A., & Johnson, L. (2006). How many interviews are enough? *Field Methods*, 18(1), 59–82.

24. Ericsson, K. A., & Simon, H. A. (1993). *Protocol Analysis: Verbal Reports as Data* (2nd ed.). MIT Press.

25. IEC 62366-1:2015. *Application of usability engineering to medical devices*.

26. Farmer, T., et al. (2006). Developing and applying a typology to guide mixed methods research. *Journal of Mixed Methods Research*, 1–28.

---

## Anhang A: SUS-Fragebogen (Deutsch)

| Nr. | Aussage | Stimme überhaupt nicht zu | | | | | Stimme voll zu |
|-----|---------|--------------------------|---|---|---|---|---|
| 1 | Ich finde, dass ich dieses System gerne häufig nutzen würde. | 1 | 2 | 3 | 4 | 5 |
| 2 | Ich finde das System unnötig kompliziert. | 1 | 2 | 3 | 4 | 5 |
| 3 | Ich finde das System leicht zu bedienen. | 1 | 2 | 3 | 4 | 5 |
| 4 | Ich denke, ich würde die Unterstützung einer fachkundigen Person benötigen, um dieses System nutzen zu können. | 1 | 2 | 3 | 4 | 5 |
| 5 | Ich finde, die verschiedenen Funktionen in diesem System sind gut integriert. | 1 | 2 | 3 | 4 | 5 |
| 6 | Ich finde, es gibt zu viele Inkonsistenzen in diesem System. | 1 | 2 | 3 | 4 | 5 |
| 7 | Ich stelle mir vor, dass die meisten Menschen sehr schnell lernen würden, dieses System zu nutzen. | 1 | 2 | 3 | 4 | 5 |
| 8 | Ich finde das System sehr umständlich zu nutzen. | 1 | 2 | 3 | 4 | 5 |
| 9 | Ich fühlte mich sehr sicher bei der Nutzung dieses Systems. | 1 | 2 | 3 | 4 | 5 |
| 10 | Ich musste eine Menge Dinge lernen, bevor ich mit diesem System arbeiten konnte. | 1 | 2 | 3 | 4 | 5 |

**Auswertungsvorschrift:**
- Ungerade Items (positiv): Score = Wert − 1
- Gerade Items (negativ): Score = 5 − Wert
- SUS-Gesamtscore = (Summe aller Scores) × 2,5

---

## Anhang B: Adjektiv-Rating (Bangor et al., 2009)

| Adjektiv | Mittlerer SUS-Score |
|----------|-------------------|
| Worst Imaginable | 12,5 |
| Awful | 22,5 |
| Poor | 35,7 |
| OK | 50,9 |
| Good | 71,4 |
| Excellent | 85,5 |
| Best Imaginable | 97,8 |

---

## Anhang C: Demografie-Fragebogen

| Feld | Optionen |
|------|---------|
| Alter | Freitext |
| Geschlecht | M / W / D / Prefer not to say |
| Beruf | Freitext |
| Medizinischer Hintergrund? | Ja / Nein |
| Diabetes-Betroffenheit? | Selbst / Angehörige(r) / Keine |
| Technikaffinität (1–5) | Skala |
| Smartphone-Nutzung | Täglich / Mehrmals pro Woche / Seltener |
| Erfahrung mit Risikokalkulatoren? | Ja / Nein |
| Erfahrung mit Gesundheitsapps? | Ja / Nein |

---

## Anhang D: Beobachtungsbogen

| Zeitpunkt | Beobachtungskategorie | Kodierung |
|-----------|---------------------|-----------|
| S1-T1 | Aufgabe 1 abgeschlossen? | Vollständig / Teilweise / Nicht erfüllt |
| S1-T1 | Zeitaufwand (Sek.) | ___ |
| S1-T1 | Fehleranzahl | ___ |
| S1-T1 | Hilfeanfragen | ___ |
| S1-T1 | EID-Features genutzt | □ Tornado □ Causality □ Therapy □ Icon Array □ What-If |
| S1-T1 | Kommunikationsmuster | Arzt-geführt / Patient-geführt / Gemeinsam |
| S1-T1 | Auffällige Reaktionen | Freitext |
| S2 | Gleiche Kategorien für Szenario 2 | ... |

---

## Anhang E: Optionales Follow-up-Interview (10–15 Min, außerhalb der 20–30 Min Session)

Falls zeitliche Ressourcen es erlauben, kann nach der Hauptsession ein vertiefendes Interview geführt werden:

**Arzt (erweitert):**
1. Wie würden Sie die Bedienung des Rechners insgesamt bewerten?
2. Wie verhält sich der Rechner im Vergleich zu Ihrer üblichen Risikokommunikation?
3. Wie bewerten Sie die klinische Plausibilität der dargestellten Risikobeiträge?
4. Gab es Momente, in denen Sie das Gefühl hatten, der Patient hat etwas nicht verstanden?
5. Welche Informationen haben Sie vermisst?
6. Welche EID-Elemente (Kausalitätsketten, Beitragsgewichte, Therapiesimulation, Icon-Array) waren am nützlichsten?

**Patient (erweitert):**
1. Wie leicht oder schwer war es für Sie, die angezeigten Werte zu verstehen?
2. Haben Sie die Farbgebung (grün/gelb/orange/rot) als hilfreich empfunden?
3. Wie haben Sie die Piktogramme (100-Personen-Array) empfunden?
4. Konnten Sie nachvollziehen, warum bestimmte Faktoren wichtiger sind als andere?
5. Hat der Rechner Ihre Motivation beeinflusst, etwas an Ihrem Lebensstil zu ändern?
6. Welche EID-Elemente waren für Sie am verständlichsten?

---

*Dokument erstellt am 2026-04-18, aktualisiert am 2026-04-18. Basierend auf systematischer Literaturrecherche (PubMed, Consensus, NotebookLM).*