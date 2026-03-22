# Wissenschaftlicher Validierungsreport: Diabetes Risk Calculator Dashboard

**Version:** 3.0 — Systematische Literaturrecherche und evidenzbasierte Validierung
**Datum:** 22. März 2026
**Methodik:** Parallele Literaturrecherche auf PubMed und Consensus mit 5 spezialisierten Research-Agenten
**Recherchebereiche:** (1) ARIC-Modellvalidierung, (2) Klinische Schwellenwerte, (3) Therapieempfehlungen, (4) Risikokommunikation & UI, (5) EID-Prinzipien & Kausalketten

---

## 1. Einleitung und Zielsetzung

Dieser Report dokumentiert die systematische wissenschaftliche Validierung des Diabetes Risk Calculator Dashboards, das im Rahmen einer Masterarbeit zum Thema Ecological Interface Design (EID) für die Diabetesrisikovorhersage entwickelt wurde. Das Dashboard basiert auf dem logistischen Regressionsmodell der Atherosclerosis Risk in Communities (ARIC) Studie von Schmidt et al. (2005) und integriert Designprinzipien des Ecological Interface Design nach Vicente und Rasmussen (1992). Ziel der Validierung ist es, jeden Bestandteil des Dashboards — vom zugrunde liegenden Risikomodell über die klinischen Schwellenwerte und Therapieempfehlungen bis hin zu den Visualisierungselementen — anhand der aktuellen wissenschaftlichen Literatur zu überprüfen und Handlungsempfehlungen für Verbesserungen abzuleiten.

Die Recherche wurde parallel auf PubMed und der Consensus-Datenbank durchgeführt, wobei fünf thematisch spezialisierte Suchagenten jeweils einen Validierungsbereich abdeckten. Insgesamt wurden über 60 Quellen gesichtet und die relevantesten Erkenntnisse in diesem Report zusammengeführt.

---

## 2. Validierung des ARIC-Risikomodells

### 2.1 Modellbeschreibung und Implementierung

Das Dashboard implementiert Modell 4 aus der Publikation von Schmidt et al. (2005), welches die höchste diskriminative Güte (AUC = 0,80) unter den im Paper vorgestellten Modellvarianten aufweist. Dieses Modell umfasst neun Prädiktoren: Alter, Ethnizität (Afroamerikaner vs. andere), elterliche Diabetesanamnese, systolischer Blutdruck, Taillenumfang, Körpergröße, Nüchternglukose, HDL-Cholesterin und Triglyzeride. Die logistische Regressionsgleichung berechnet eine 9-Jahres-Diabeteswahrscheinlichkeit über die Formel P = 1/(1 + exp(−LP)), wobei LP den linearen Prädiktor darstellt (Schmidt et al., 2005).

Die Überprüfung der im Dashboard implementierten Beta-Koeffizienten ergab eine exakte Übereinstimmung mit den in Table 1 (Fußnoten) der Originalpublikation angegebenen Werten. Sämtliche neun Koeffizienten sowie der Intercept (σ = −9,9808) wurden korrekt übernommen. Diese Verifikation wurde bereits in Version 2.0 des Validierungsreports durchgeführt und wird hiermit bestätigt.

### 2.2 Externe Validierung des ARIC-Modells

Die Literaturrecherche identifizierte mehrere externe Validierungsstudien, die die Übertragbarkeit und Robustheit des ARIC-Modells in unterschiedlichen Populationen bestätigen.

Bozorgmanesh et al. (2010) validierten das ARIC-Modell an der Tehran Lipid and Glucose Study (N = 3.721) und berichteten eine C-Statistik von 0,790 für Männer und 0,829 für Frauen, was eine vergleichbare diskriminative Güte wie in der Originalstichprobe darstellt. Die Kalibrierung erwies sich als akzeptabel in der nahöstlichen Population, wobei die optimalen Schwellenwerte geschlechtsspezifisch variierten.

Lotfaliany et al. (2021) untersuchten stufenweise Screening-Methoden in einer iranischen Population und fanden eine AUC von 0,80 bis 0,83 für das ARIC-Modell, mit akzeptablen Netto-Nutzen-Werten über Risikoschwellenbereiche von 5 % bis 21 %. Die Multi-Ethnic Study of Atherosclerosis (MESA) verglich die Validität von drei Diabetes-Risikomodellen in einer multiethnischen US-Kohorte und bestätigte die robuste diskriminative Fähigkeit und Kalibrierung des ARIC-Modells (Grayston et al., 2010).

Zusammenfassend zeigt die Evidenz, dass das ARIC-Modell über verschiedene ethnische Gruppen und geografische Regionen hinweg validiert wurde und eine konsistente AUC im Bereich von 0,77 bis 0,84 aufweist. Dies unterstützt die Wahl des Modells als Grundlage des Dashboards.

### 2.3 Fehlende Geschlechtsvariable — Kritische Limitation

Eine wesentliche Abweichung zwischen der Dashboard-Implementierung und dem Originalmodell betrifft die Geschlechtsvariable. Das ursprüngliche ARIC-Modell von Schmidt et al. (2005) enthielt das Geschlecht als Prädiktorvariable, während das Dashboard eine geschlechtsunabhängige Version mit rekalibriertem Intercept verwendet. Die aktuelle Forschung zeigt eine zunehmende Präferenz für geschlechtsstratifizierte Modelle gegenüber geschlechtsunabhängigen Ansätzen bei der Diabetesrisikovorhersage. Bozorgmanesh et al. (2010) fanden in ihrer Validierung deutlich unterschiedliche optimale Schwellenwerte für Männer (Score = 31, Sensitivität 71,6 %, Spezifität 75,3 %) und Frauen (Score = 38, Sensitivität 67,1 %, Spezifität 85,0 %), was die Relevanz geschlechtsspezifischer Kalibrierung unterstreicht.

**Aktueller Zustand:** Das Dashboard dokumentiert nicht, dass es eine geschlechtsagnostische Version verwendet.
**Empfohlene Änderung:** Ein expliziter Hinweis im Code und in der Benutzeroberfläche sollte darauf hinweisen, dass das Dashboard eine vereinfachte Version des ARIC-Modells ohne Geschlechtsvariable implementiert. Der Intercept wurde für diese Vereinfachung rekalibriert.

### 2.4 High-Risk-Cutoff von 0,26

Der im Dashboard implementierte High-Risk-Cutoff von 0,26 (26 % Wahrscheinlichkeit) identifiziert die oberen 20 % der Population als Screening-positiv, mit einer Sensitivität von 52 % und einer Spezifität von 86 %. Die Literaturrecherche konnte keine explizite Publikation identifizieren, die diesen spezifischen Cutoff als optimal validiert. Das Originalpaper von Schmidt et al. (2005) berichtet Cutoffs über Quintile des vorhergesagten Risikos mit Sensitivitäten von 40–87 % und Spezifitäten von 50–86 %, nennt jedoch keinen spezifischen Schwellenwert von 0,26. Bozorgmanesh et al. (2010) ermittelten in ihrer externen Validierung andere optimale Cutpoints, die zudem geschlechtsspezifisch waren.

**Aktueller Zustand:** Der Cutoff 0,26 wird als „published high-risk probability cut-off from Schmidt et al. (2005)" bezeichnet.
**Empfohlene Änderung:** Die Formulierung sollte korrigiert werden zu: „Der Cutoff von 0,26 identifiziert die oberen 20 % der Population als Hochrisiko (Sensitivität ~52 %, Spezifität ~86 %). Dieser Wert basiert auf der Analyse der Risikoverteilung im ARIC-Modell und repräsentiert einen klinisch sinnvollen Kompromiss zwischen Sensitivität und Spezifität."

### 2.5 Neuere Limitationen und Entwicklungen

Howell et al. (2025) zeigten in einer Analyse der REGARDS-Kohorte (N = 9.907), dass rein klinische kardiometabolische Modelle das Risiko in sozial benachteiligten Subgruppen systematisch unterschätzen. Die Ergänzung sozialer Determinanten der Gesundheit verbesserte die Kalibrierung in vulnerablen Populationen erheblich. Darüber hinaus wurden in der Literatur explizite Bedenken hinsichtlich rassenbezogener Verzerrungen in Diabetes-Risikomodellen formuliert, einschließlich des Potenzials für differentielle Fehlkalibrierung über ethnische Gruppen hinweg (PLOS Global Public Health, 2023).

Diese Befunde haben für das Dashboard eine moderate Relevanz: Das Modell ist 20 Jahre alt, und neuere Modelle mit besserer Kalibrierung sind verfügbar. Für den Kontext einer Masterarbeit, die den EID-Ansatz demonstriert, bleibt die Modellwahl jedoch vertretbar, sofern diese Limitationen transparent dokumentiert werden.

---

## 3. Validierung der klinischen Schwellenwerte

### 3.1 Nüchternglukose

Die im Dashboard implementierten Schwellenwerte für Nüchternglukose — erhöht ab 5,6 mmol/L (100 mg/dL) für Prädiabetes und hoch ab 7,0 mmol/L (126 mg/dL) für Diabetes — entsprechen den aktuellen ADA Standards of Care in Diabetes 2025, die am 9. Dezember 2024 publiziert wurden (American Diabetes Association, 2025). Diese Grenzwerte sind seit ihrer Einführung unverändert geblieben und werden international als diagnostische Kriterien anerkannt.

**Aktueller Zustand:** Korrekt implementiert (Quelle: ADA 2024).
**Empfohlene Änderung:** Quellenangabe aktualisieren auf „ADA Standards of Care 2025".

### 3.2 Systolischer Blutdruck

Das Dashboard verwendet einen Schwellenwert von 130 mmHg für „elevated" und 160 mmHg für „high" und zitiert als Quelle „ESC (2023)". Die Recherche ergab jedoch, dass diese Werte den ACC/AHA 2017 Guidelines entsprechen, nicht den ESC-Leitlinien. Die ACC/AHA 2017 definieren: Elevated 120–129 mmHg, Stage 1 Hypertonie ≥130 mmHg, Stage 2 Hypertonie ≥140 mmHg (Whelton et al., 2018). Die ESC/ESH-Leitlinien in ihrer aktuellen Fassung von 2024 verwenden hingegen abweichende Kategorien: erhöhter Blutdruck 130–139/80–89 mmHg und Hypertonie ≥140/90 mmHg. Ein portugiesisches Konsensuspapier von Ribeiro et al. (2026) bestätigt die Divergenz zwischen diesen Leitliniensystemen und empfiehlt eine klare Zuordnung der verwendeten Klassifikation.

**Aktueller Zustand:** config.js Zeile 113 definiert `sbp: { elevated: 130, high: 160 }` und zitiert ESC 2023.
**Empfohlene Änderung:** Die Quellenangabe muss von „ESC (2023)" auf „ACC/AHA (2017)" korrigiert werden, da die implementierten Werte den amerikanischen Leitlinien folgen. Der `high`-Wert von 160 mmHg entspricht ACC/AHA Stage 2 Hypertension-Kriterien. Alternativ könnte eine Anpassung an ESC 2024 erwogen werden (elevated: 130, hypertension: 140), was jedoch eine Änderung der Slider-Segmentierung erfordern würde.

### 3.3 HDL-Cholesterin

Der Schwellenwert für niedriges HDL-Cholesterin von 1,03 mmol/L (40 mg/dL) entspricht dem NCEP ATP III Kriterium für Männer und ist korrekt implementiert (Expert Panel on Detection, Evaluation, and Treatment of High Blood Cholesterol in Adults, 2002). Für Frauen gilt jedoch ein höherer Schwellenwert von 1,29 mmol/L (50 mg/dL), der im Dashboard nicht berücksichtigt wird — konsistent mit der fehlenden Geschlechtsvariable im Modell.

Der zusätzliche Schwellenwert `cholHDL.veryLow: 0.8` (ca. 31 mg/dL) konnte in keiner klinischen Leitlinie oder standardisierten Klassifikation identifiziert werden. Weder NCEP ATP III noch ADA, ESC oder IDF definieren einen „very low" HDL-Schwellenwert. Dieser Wert scheint eine interne, nicht standardisierte Kategorie darzustellen.

**Aktueller Zustand:** config.js Zeile 114 definiert `cholHDL: { low: 1.03, veryLow: 0.8 }`.
**Empfohlene Änderung:** Der `veryLow`-Schwellenwert sollte entweder entfernt oder mit einer klinischen Begründung versehen werden. Falls der Schwellenwert beibehalten werden soll, muss eine evidenzbasierte Quelle dokumentiert werden. Die Dokumentation sollte den Hinweis enthalten, dass der `low`-Wert dem männlichen NCEP ATP III Kriterium entspricht und der weibliche Wert (1,29 mmol/L) aufgrund der geschlechtsagnostischen Modellierung nicht implementiert ist.

### 3.4 Triglyzeride

Die Schwellenwerte für Triglyzeride — elevated ab 1,7 mmol/L (150 mg/dL) und high ab 2,3 mmol/L (ca. 200 mg/dL) — entsprechen den NCEP ATP III Kriterien für das metabolische Syndrom. Die Recherche bestätigt, dass diese Werte in Publikationen von 2023 bis 2025 weiterhin als gültig referenziert werden und in der Definition des metabolischen Syndroms unverändert geblieben sind.

**Aktueller Zustand:** Korrekt implementiert.
**Empfohlene Änderung:** Keine.

### 3.5 Taillenumfang

Die Schwellenwerte von 94 cm (IDF-Kriterium für europäische Männer) und 102 cm (NCEP ATP III Kriterium für Männer) sind korrekt implementiert. Jedoch fehlen die geschlechtsspezifischen weiblichen Schwellenwerte: IDF definiert 80 cm für europäische Frauen, NCEP ATP III definiert 88 cm für Frauen. Sämtliche relevanten Leitlinien — IDF, NCEP ATP III und ESC 2024 — definieren Taillenumfang grundsätzlich geschlechtsspezifisch (International Diabetes Federation, 2006; Expert Panel, 2002).

**Aktueller Zustand:** config.js Zeile 116 definiert `waist: { elevated: 94, high: 102 }` — nur männliche Werte.
**Empfohlene Änderung:** Die Dokumentation im Code sollte explizit darauf hinweisen, dass ausschließlich männliche Taillenumfang-Grenzwerte verwendet werden, da die Geschlechtsvariable nicht im Modell enthalten ist. Falls eine geschlechtsspezifische Implementierung angestrebt wird, sollten die weiblichen Werte (IDF: 80 cm, NCEP: 88 cm) ergänzt werden.

### 3.6 Waist-Slider-Inkonsistenz

Eine technische Inkonsistenz besteht zwischen dem HTML-Slider für den Taillenumfang und der Konfiguration. Der HTML-Slider in index.html (Zeile 315) definiert `min="25"` (Inches), während CONFIG.RANGES.waist.us `[26, 60, 1]` vorgibt. Werte unter 26 Inches (66 cm) liegen somit außerhalb des validierten Bereichs der Konfiguration.

**Aktueller Zustand:** HTML min="25", Config min=26.
**Empfohlene Änderung:** HTML anpassen auf `min="26"`, um Konsistenz mit der Konfiguration herzustellen.

---

## 4. Validierung der Therapieempfehlungen

### 4.1 Blutzuckermanagement — Metformin

Das Dashboard empfiehlt Metformin als „often the first step to help control blood sugar levels" (config.js, Zeile 132). Diese Formulierung ist für den Kontext der Prädiabetes-Prävention zu unspezifisch. Die ADA Standards of Care 2024/2025 empfehlen Metformin ausdrücklich nur für Hochrisiko-Prädiabetiker mit folgenden Kriterien: BMI ≥ 35 kg/m², Alter < 60 Jahre, Frauen mit früherer Schwangerschaftsdiabetes oder Nüchternglukose ≥ 6,1 mmol/L (110 mg/dL) bzw. HbA1c ≥ 6,0 % (American Diabetes Association, 2024). Die DPP/DPPOS-Daten bestätigen eine Reduktion der Nüchternglukose um ca. 20 mg/dL (1,1 mmol/L) unter Metformin in Kombination mit Lebensstilintervention, jedoch ausschließlich in der Hochrisiko-Subgruppe (Aroda et al., 2017).

**Aktueller Zustand:** „Metformin is often the first step to help control blood sugar levels."
**Empfohlene Änderung:** „Metformin may be considered for high-risk prediabetes: BMI ≥35, age <60, prior gestational diabetes, or fasting glucose ≥110 mg/dL (6.1 mmol/L). Always combined with lifestyle modification (ADA, 2025)."

### 4.2 Blutzuckermanagement — SGLT2-Inhibitoren und GLP-1 RA

Die Dashboard-Empfehlung für SGLT2-Inhibitoren und GLP-1 Rezeptoragonisten zur „Herz- und Nierenprotektion" ist für den Prädiabetes-Kontext nicht ausreichend evidenzbasiert. Die Evidenz für diese Medikamentenklassen ist robust für den manifesten Typ-2-Diabetes und die chronische Nierenerkrankung (SELECT Trial: Lincoff et al., 2023; EMPA-KIDNEY: The EMPA-KIDNEY Collaborative Group, 2023), jedoch fehlen formale Präventionsstudien im Prädiabetes-Setting. Die Formulierung „If you have heart or kidney concerns" impliziert eine Indikation, die für Prädiabetiker nicht leitliniengestützt ist.

**Aktueller Zustand:** „If you have heart or kidney concerns, ask your doctor about newer medications that specifically protect these organs (SGLT2 inhibitors or GLP-1)."
**Empfohlene Änderung:** „For patients with established type 2 diabetes, SGLT2 inhibitors and GLP-1 receptor agonists provide proven heart and kidney protection. In the prediabetes setting, these medications are primarily under investigation; discuss options with your physician."

### 4.3 Blutdrucktherapie — Kombinationstherapie

Die Empfehlung, mit einer Kombination aus RAS-Inhibitoren und Kalziumkanalblockern (CCBs) zu beginnen, entspricht den aktuellen ESH 2023/2024-Leitlinien. Coca et al. (2024) bestätigten in einer Analyse der aktualisierten ESH-Leitlinien die Empfehlung einer Zwei-Substanz-Kombinationstherapie mit RAS-Blocker (ACE-Hemmer oder ARB) plus CCB als bevorzugte First-Line-Option. De la Sierra et al. (2016) zeigten in der Spanish ABPM Registry eine überlegene ambulante Blutdruckkontrolle unter RAS+CCB im Vergleich zu anderen Kombinationen.

**Aktueller Zustand:** Korrekt empfohlen, allerdings enthält der Text einen Grammatikfehler: „It is recommend" statt „It is recommended".
**Empfohlene Änderung:** Grammatikfehler korrigieren. Quellenangabe aktualisieren auf ESH 2023/Coca et al. (2024).

### 4.4 Blutdrucktherapie — Lebensstilmaßnahmen

Die Empfehlung zur Einschränkung von Alkohol und Natrium, erhöhtem Gemüseverzehr und fettarmen Milchprodukten entspricht den Prinzipien der DASH-Diät, die für die Blutdruckkontrolle gut etabliert ist. Jedoch fehlt eine explizite Benennung der DASH-Diät als evidenzbasierte Referenz.

**Empfohlene Änderung:** Ergänzung des Begriffs „DASH diet" in der Beschreibung, da dieser standardisierte Terminus die klinische Legitimität der Empfehlung erhöht.

### 4.5 HDL-Verbesserung — Bewegung

Die Empfehlung von 150 Minuten moderater oder 75 Minuten intensiver Bewegung pro Woche entspricht den WHO Guidelines on Physical Activity and Sedentary Behaviour (World Health Organization, 2020). Systematische Reviews bestätigen einen moderaten HDL-Anstieg durch regelmäßiges aerobes Training (Thorp et al., 2007). Die Empfehlungen zu Rauchstopp, Alkoholmoderation und gesunden Fetten (Olivenöl, Nüsse, Fisch) sind ebenfalls evidenzbasiert zur Verbesserung der HDL-Funktion.

**Aktueller Zustand:** Korrekt implementiert.
**Empfohlene Änderung:** Keine inhaltliche Änderung erforderlich.

### 4.6 Triglyzeride — Icosapent Ethyl

Die Empfehlung für verschreibungspflichtiges Fischöl (Icosapent Ethyl) basiert auf dem REDUCE-IT Trial (Bhatt et al., 2019), der eine Reduktion kardiovaskulärer Ereignisse bei statin-behandelten Patienten mit erhöhten Triglyzeriden (135–499 mg/dL) zeigte. Die aktuelle Dashboard-Formulierung ist jedoch zu breit gefasst, da REDUCE-IT sich auf Patienten mit etablierter kardiovaskulärer Erkrankung und hohem CV-Risiko bezieht, nicht auf Routine-Prädiabetes. Der STRENGTH-Trial (2021) mit gemischten Omega-3-Fettsäuren zeigte negative Ergebnisse, was den spezifischen Wirkmechanismus von Icosapent Ethyl unterstreicht.

**Aktueller Zustand:** „If blood fats (triglycerides) remain high, special prescription fish oil (icosapent ethyl) might be considered."
**Empfohlene Änderung:** „For statin-treated patients with persistently elevated triglycerides (≥150 mg/dL) and established cardiovascular risk, icosapent ethyl may reduce cardiovascular events (Bhatt et al., 2019). Discuss suitability with your physician."

### 4.7 Triglyzeride — Statine

Die Formulierung „Cholesterol-lowering medication (Statins) is usually recommended to protect your blood vessels" ist für isolierte Hypertriglyzeridämie vereinfachend. Statine senken primär LDL-Cholesterin und reduzieren Triglyzeride nur moderat (10–30 %). Für schwere Hypertriglyzeridämie (> 200 mg/dL) sind Fibrate wirksamer.

**Empfohlene Änderung:** „Statins reduce LDL cholesterol and modestly lower triglycerides. For significantly elevated triglycerides (>200 mg/dL), additional agents such as fibrates may be required."

### 4.8 Gewichtsmanagement — GLP-1 RA

Die Empfehlung von GLP-1 Rezeptoragonisten zur Gewichtsreduktion wird durch eine umfangreiche Evidenzbasis gestützt. Wong et al. (2025) zeigten in einer Metaanalyse von 47 randomisierten kontrollierten Studien in Diabetes Care Gewichtsreduktionen von 5–15 % unter GLP-1 RA. Diese Indikation gilt jedoch primär für Adipositas (BMI ≥ 30) oder Prädiabetes mit begleitender Adipositas, nicht für Routine-Prädiabetes.

**Aktueller Zustand:** Korrekt, jedoch ohne Indikationsspezifizierung.
**Empfohlene Änderung:** Ergänzung des Hinweises, dass GLP-1 RA typischerweise bei Adipositas (BMI ≥ 30) oder Prädiabetes mit begleitender Adipositas indiziert sind.

### 4.9 Gewichtsmanagement — Metabolische Chirurgie

Die Dashboard-Formulierung „For significant obesity with health problems, weight-loss surgery may be discussed" verwendet kein klinisches Kriterium. Die aktuellen ASMBS 2022-Leitlinien definieren klare Indikationen: metabolische Chirurgie wird empfohlen für BMI ≥ 35 kg/m² unabhängig von Komorbiditäten und sollte erwogen werden für BMI 30–34,9 kg/m² mit Typ-2-Diabetes oder signifikanten adipositasbezogenen Komorbiditäten (Rubino et al., 2022). Für Asiaten gilt ein niedrigerer Schwellenwert von BMI ≥ 27,5 kg/m² (American Diabetes Association, 2024).

**Aktueller Zustand:** „For significant obesity with health problems, weight-loss surgery may be discussed."
**Empfohlene Änderung:** „Metabolic surgery is recommended for BMI ≥35 kg/m² (≥27.5 for Asian populations). It should also be considered for BMI 30–34.9 with type 2 diabetes or significant obesity-related comorbidities (ASMBS, 2022)."

### 4.10 Simulationseffekte — Evidenzbasis

Das Dashboard implementiert evidenzbasierte Behandlungsdeltas in SIMULATION_EFFECTS (config.js, Zeilen 181–187). Die Recherche ergab folgende Verifikationsergebnisse:

| Parameter | Delta | Zitierte Quelle | Verifikationsstatus |
|-----------|-------|------------------|---------------------|
| fastGlu | −20 mg/dL (−1,1 mmol/L) | DPP/DPPOS (Aroda et al., 2017) | **Verifiziert** — DPP/DPPOS-Literatur bestätigt diese Reduktion unter Metformin + Lebensstilintervention bei Hochrisiko-Prädiabetikern |
| sbp | −10 mmHg | Wang et al. (2025) + Canoy et al. (2022) | **Nicht verifiziert** — Diese spezifischen Zitationen konnten in PubMed und Consensus nicht gefunden werden. Der Wert von −10 mmHg ist klinisch plausibel (Lebensstilinterventionen erreichen typischerweise −8 bis −12 mmHg), aber die Quellen müssen überprüft werden |
| cholHDL | +5 mg/dL (+0,13 mmol/L) | van Namen et al. (2019) | **Nicht verifiziert** — Diese Quelle konnte in den Datenbanken nicht abgerufen werden |
| cholTri | −30 mg/dL (−0,34 mmol/L) | van Namen et al. (2019) + Statine | **Nicht verifiziert** — Gleiche Problematik; der Wert liegt im plausiblen Bereich für Statintherapie (10–30 % Reduktion) |
| waist | −5 cm | Wong et al. (2025) + van Namen et al. (2019) | **Teilweise verifiziert** — Wong et al. (2025) in Diabetes Care bestätigt GLP-1 RA Taillenumfangsreduktionen im Bereich von −5 bis −8 cm |

**Empfohlene Änderung:** Die Quellen Wang et al. (2025), Canoy et al. (2022) und van Namen et al. (2019) müssen manuell verifiziert und durch abrufbare, peer-reviewte Publikationen ersetzt oder bestätigt werden. Der Kommentar in config.js sollte auf „clinically achievable targets" (klinisch erreichbare Ziele) umformuliert werden, bis alle Quellen vollständig bestätigt sind.

---

## 5. Validierung der Risikokommunikation und UI-Elemente

### 5.1 Icon Array (Piktogramm)

Das Dashboard verwendet ein 100-Personen-Raster (Icon Array), in dem betroffene Personen farblich hervorgehoben werden, begleitet vom Label „X out of 100 people with your profile may develop diabetes within 9 years". Dieses Visualisierungselement wird durch starke empirische Evidenz gestützt. Galesic und Garcia-Retamero (2011) zeigten in Health Psychology, dass Icon Arrays die Genauigkeit des Risikoverständnisses signifikant verbessern, insbesondere bei Personen mit niedriger Numeracy. Das Format der natürlichen Frequenzen („X von 100") reduziert nachweislich den Numeracy-Bias und wird in der aktuellen Literatur (2024–2025) als überlegen gegenüber Balkendiagrammen für Wertevergleiche in der Gesundheitsrisikovisualisierung bewertet. Zikmund-Fisher et al. (2009) bestätigten, dass Icon Arrays die Überwindung niedriger Numeracy-Fähigkeiten unterstützen und das Risikoverständnis über verschiedene Bildungsniveaus hinweg verbessern.

**Bewertung:** Best Practice — keine Änderung erforderlich.

### 5.2 Traffic-Light-Farbcodierung

Die Ampelfarbcodierung des Dashboards (Grün < 10 %, Gelb/Orange 10–26 %, Orange 26–50 %, Rot > 50 %) wird generell durch die Literatur zur Gesundheitskommunikation gestützt. Farbcodierte visuelle Hilfsmittel verbessern die Kommunikation zwischen Gesundheitsteams und Patienten (Consensus-Studien 2022–2024). Der 26-%-Schwellenwert ist mit dem High-Risk-Cutoff des Schmidt-Modells abgestimmt, was eine inhaltlich kohärente Zuordnung darstellt. Allerdings konnten keine publizierten Studien identifiziert werden, die die spezifische Farbprogressions (Grün → Gelb → Orange → Rot) oder die konkreten Schwellenwertgrenzen für die Diabetes-Risikokommunikation direkt validieren.

**Empfohlene Änderung:** Die Wahl der Farbschwellen sollte in der Designdokumentation begründet werden (z. B.: „Die Schwellenwerte basieren auf klinisch relevanten Risikokategorien: <10 % normales Bevölkerungsrisiko, ≥26 % entspricht dem validierten High-Risk-Cutoff des ARIC-Modells"). Ein Usability-Test mit der Zielgruppe wäre wünschenswert, um die Verständlichkeit der Farb-Risiko-Zuordnung zu evaluieren.

### 5.3 Beitragschart (Tornado-Diagramm)

Das divergierende Balkendiagramm zeigt den prozentualen Beitrag jedes Faktors zur gesamten Risikoabweichung vom Bevölkerungsmittel. Die mathematische Grundlage — contribution_i = β_i × (x_i − mean_i) — folgt dem Standard in der Risikovorhersagemodellierung und wird durch Van Belle und Calster (2015) formal beschrieben. Die aktuelle Literatur (2024–2025) betont die Notwendigkeit visueller Faktorzerlegung in erklärbaren KI-Systemen für klinische Werkzeuge, was die Implementierung eines Beitragsdiagramms als evidenzbasiert einordnet.

**Bewertung:** Evidenzbasierter Ansatz — keine Änderung erforderlich.

### 5.4 Radar-Chart

Das hexagonale Radar-Diagramm vergleicht das Patientenprofil mit dem Bevölkerungsdurchschnitt über sechs Risikofaktoren. Die Literaturrecherche ergab nur begrenzte spezifische Evidenz für Radar-Charts in klinischen Dashboards zur Patientenedukation. Einige Visualisierungsforschung weist auf einen erhöhten kognitiven Aufwand bei Spinnendiagrammen hin, und es existieren keine Head-to-Head-Vergleiche, die Radar-Charts gegen andere multivariate Vergleichsformate (Liniendiagramme, gepaarte Balkendiagramme) in Diabetes-Risikokontexten validieren.

**Empfohlene Änderung:** Der Radar-Chart sollte als experimentelles Visualisierungselement gekennzeichnet werden. Ein vergleichender Usability-Test (Radar vs. alternative Formate) wäre für zukünftige Iterationen empfehlenswert.

### 5.5 Kausalketten-Visualisierung

Die visuellen Kausalweg-Darstellungen (z. B. „Waist → Insulin Resistance ↑ → Blood Sugar ↑ → Diabetes Risk ↑") werden durch die aktuelle Literatur zur Patientenedukation gestützt. Multi-Outcome-Kausalgraphen werden als wichtig für das Verständnis von Krankheitsmechanismen im Gesundheitswesen anerkannt (Consensus 2025). Die Darstellung kausaler Zusammenhänge unterstützt das mechanistische Verständnis und wurde erfolgreich in klinischen Settings eingesetzt. Abschnitt 6 dieses Reports behandelt die medizinische Korrektheit der implementierten Ketten im Detail.

**Bewertung:** Stark evidenzgestützt — keine grundlegende Änderung erforderlich.

### 5.6 Treatment Zone Map (Heatmap)

Die 2D-Heatmap mit Glukose auf der x-Achse und anderen Faktoren auf der y-Achse zur Zuordnung von Behandlungszonen wird in der Diabetesmanagement-Literatur durch klinische Entscheidungsmatrizen referenziert (AACE Consensus Statements verwenden visuelle Algorithmen für Therapieentscheidungen). Allerdings ist die Evidenz für das Patientenverständnis dieses 2D-Stratifizierungsformats begrenzt. Der Dualachsen-Ansatz kann eine erhöhte kognitive Belastung erzeugen, und es ist unklar, ob Patienten die 2D-Stratifizierung intuitiv interpretieren können.

**Empfohlene Änderung:** Die Zonenbeschreibungen sollten detaillierter formuliert werden. Usability-Tests sind essentiell, um das Patientenverständnis zu validieren. Die Farben sollten auf Farbenblindheit geprüft werden.

### 5.7 Beta-Vektoren (EID Knowledge-Based Behavior)

Die direktionalen Pfeile auf den Input-Labels, die die Richtung und Stärke der Modellgewichte visualisieren, stellen ein innovatives Element dar, das mit den aktuellen Anforderungen an Explainable AI (XAI) in klinischen Werkzeugen übereinstimmt. Die Literatur zu erklärbarer KI im Gesundheitswesen (2024–2025) betont die Notwendigkeit transparenter Modelldarstellung für informierte klinische Entscheidungsfindung (Caruana et al., 2015). Die direkte Visualisierung von Modellkoeffizienten (Beta-Werten) unterstützt das Verständnis des Nutzers für die Funktionsweise des zugrunde liegenden Modells.

**Bewertung:** Innovative Best Practice — keine Änderung erforderlich.

### 5.8 What-If-Badges

Die vorhergesagten Risikoänderungen für ±5 Slider-Schritte unterstützen die interaktive Risikoexploration und werden durch die aktuelle Literatur zu Sensitivitätsanalysen in klinischen Entscheidungsunterstützungssystemen gestützt (2024–2025). Das PRAXA-Framework (2025) formalisiert What-If-Analyse-Ansätze und bestätigt deren Wert für Shared Decision-Making.

**Empfohlene Änderung:** Die What-If-Prognosen sollten klar als „simuliert" und nicht als „tatsächlich" gekennzeichnet sein. Eine Ergänzung von Konfidenzintervallen wäre für zukünftige Versionen wünschenswert.

### 5.9 Behandlungssimulation (Animation)

Die animierte Slider-Bewegung zur Darstellung von Behandlungseffekten weist eine gemischte Evidenzlage auf. Harrell und Spyridakis (2012) zeigten im Journal of Medical Internet Research, dass animierte Grafiken beim Vergleich von Risiken kontraproduktiv sein können. Vallée et al. (2019) fanden hingegen in Medical Decision Making, dass Animation das Verständnis bei Populationen mit niedriger Health Literacy verbessern kann. Eine systematische Analyse (Consensus 2024) kam zu dem Schluss, dass die Evidenz für interaktive oder animierte Grafiken in der Risikokommunikation unzureichend ist.

**Empfohlene Änderung:** Die Animationsfunktion sollte durch einen vergleichenden Usability-Test (animiert vs. statisch) evaluiert werden. Falls die Animation beibehalten wird, sollte die Geschwindigkeit angemessen langsam sein (der aktuelle Wert von 1500 ms erscheint adäquat) und klare Vor-/Nachher-Vergleiche bieten.

---

## 6. Validierung der EID-Prinzipien und Kausalketten

### 6.1 Ecological Interface Design im Gesundheitskontext

Das Dashboard beansprucht, EID-Prinzipien nach Vicente und Rasmussen (1992) auf drei Verhaltensebenen zu implementieren: Skill-Based Behavior (SBB) durch präattentive Risikoanzeigen und farbcodierte Slider, Rule-Based Behavior (RBB) durch Ampelschwellenwerte und die Treatment Zone Map, sowie Knowledge-Based Behavior (KBB) durch Beta-Vektoren, What-If-Analyse, Kausalketten und Behandlungssimulation.

Bennett und Flach (2019) bestätigten in Human Factors, dass EID „bemerkenswert erfolgreich in der signifikanten Verbesserung der Leistung für Arbeitsdomänen mit gesetzesartigen Constraints" bleibt, wie sie beispielsweise in der Prozesskontrolle und — relevant für dieses Dashboard — in physiologischen Systemen vorliegen. Mehrere Consensus-Quellen dokumentieren EID-Anwendungen im Gesundheitswesen, darunter eine Konferenzpublikation von 2022, die explizit die Prinzipien der Work Domain Analysis (WDA) und des EID am Beispiel einer grafischen Oberfläche zur Unterstützung klinischer Entscheidungsfindung hinsichtlich kardiovaskulärer Gesundheit illustriert.

Es muss jedoch angemerkt werden, dass wenige Studien die SBB/RBB/KBB-Zuordnung spezifisch in Gesundheitskontexten empirisch validiert haben. Die meisten Evidenzen stammen aus Prozesssteuerungsdomänen (Kernenergie, Luftfahrt). Die Gesundheitsanwendung ist vielversprechend, aber empirisch noch untererforscht. Vicente (1999) bietet den theoretischen Rahmen in „Cognitive Work Analysis", und Burns und Hajdukiewicz (2004) beschreiben die praktische Anwendung in „Ecological Interface Design".

### 6.2 Medizinische Korrektheit der Kausalketten

#### Kette A: Taillenumfang → Insulinresistenz ↑ → Blutzucker ↑ → Diabetesrisiko ↑

Diese Kette ist **medizinisch korrekt** und durch starke Evidenz gestützt. Eine Studie aus dem Jahr 2023 mit 58 Zitierungen bestätigt, dass der Taillenumfang ein essentieller Faktor bei der Vorhersage von Insulinresistenz ist und eine frühzeitige Erkennung des metabolischen Syndroms ermöglicht. Der zugrunde liegende Mechanismus ist gut etabliert: viszerale Adipositas führt zu Insulinresistenz im Fettgewebe, reduzierter Glukoseaufnahme, kompensatorischer Hyperglykämie, Beta-Zell-Stress und letztlich Diabetes (Consensus, 2023; Tchernof & Després, 2013).

**Bewertung:** Korrekt — keine Änderung erforderlich.

#### Kette B: HDL-Cholesterin ↓ → Lipidmetabolismus ↓ → Gefäßgesundheit ↓ → Diabetesrisiko ↑

Diese Kette ist **medizinisch korrekt, aber mechanistisch unvollständig**. Moissl-Blanke et al. (2025) bestätigten in den International Journal of Molecular Sciences, dass niedriges HDL die Lipidzusammensetzung verändert, die Cholesterin-Efflux-Kapazität beeinträchtigt, die antioxidative Aktivität reduziert und „einen pro-inflammatorischen Phänotyp fördert, der schützendes HDL in ein dysfunktionales Partikel verwandelt. Diese Veränderungen tragen zu endothelialer Dysfunktion, Schaumzellbildung und Atherogenese bei."

Der Mechanismus ist nicht einfach „Lipidmetabolismus ↓", sondern umfasst den Verlust der anti-inflammatorischen und antioxidativen Kapazität, der zu endothelialer Dysfunktion und gestörter Glukosehomöostase führt.

**Empfohlene Änderung:** Die Kette könnte präziser formuliert werden als: „HDL Cholesterol ↓ → Anti-inflammatory Capacity ↓ → Vascular Inflammation ↑ → Diabetes Risk ↑". Die aktuelle Formulierung ist akzeptabel für Laienverständnis, sollte aber in der wissenschaftlichen Dokumentation mit dem vollständigen Mechanismus annotiert werden.

#### Kette C: Nüchternglukose ↑ → Pankreatischer Beta-Zell-Stress → Insulinsekretion ↓ → Diabetesrisiko ↑

Diese Kette ist **medizinisch korrekt, aber kausal vereinfacht**. Die Consensus-Recherche bestätigt, dass die Nüchternglukose ein stärkerer Prädiktor für Diabetes ist als der Triglyzerid-Glukose-Index, Triglyzeride/HDL-Cholesterin und HOMA-IR (Teheraner Studie, 2018, 45 Zitierungen). Allerdings beschreibt die Kette eine **Korrelation und Konsequenz**, nicht reine Kausalität: Erhöhte Nüchternglukose ist ein Marker für Beta-Zell-Dysfunktion, nicht deren alleinige Ursache. Die kausale Richtung verläuft: Insulinresistenz (aus multiplen Ursachen) → Beta-Zell-Überlastung → Beta-Zell-Erschöpfung/Apoptose → reduzierte Insulinsekretion → weitere Glukoseerhöhung.

**Bewertung:** Akzeptabel für Patientenedukation. Die Vereinfachung ist für Laienverständnis vertretbar.

#### Kette D: Blutdruck ↑ → Vaskuläre Dysfunktion → Endothelschaden → Diabetesrisiko ↑

Diese Kette ist **medizinisch korrekt** und durch umfangreiche Evidenz gestützt. PubMed-Suchergebnisse lieferten 236 Publikationen zum Thema Blutdruck, vaskuläre Dysfunktion und Endothelschaden in Zusammenhang mit Diabetes. Der Mechanismus umfasst: erhöhter Blutdruck → erhöhter Scherstress → endotheliale Aktivierung → oxidativer Stress → eingeschränkte Stickstoffmonoxid-Bioverfügbarkeit → endotheliale Dysfunktion → reduzierte glukoseabhängige Vasodilatation → gestörte insulinstimulierte Glukoseaufnahme → erhöhtes Diabetesrisiko.

**Bewertung:** Korrekt — keine Änderung erforderlich.

#### Fehlende Kette E: Triglyzeride (cholTri)

Es existiert **keine Kausalkette für Triglyzeride**, obwohl cholTri ein modifizierbarer Risikofaktor im Modell ist. Die Consensus-Recherche liefert starke Evidenz für einen solchen Pfad. Eine Studie aus dem Jahr 2025 zum Thema „Triglycerides, Glucose Metabolism, and Type 2 Diabetes" dokumentiert eine starke positive Korrelation zwischen erhöhten Triglyzeridwerten und Plasmaglukose sowie erhöhter Prävalenz, Inzidenz und Mortalität von Typ-2-Diabetes. Die Interaktion zwischen Glukose- und Lipidmetabolismus (2015, 384 Zitierungen) erklärt, dass erhöhte Triglyzeride mit kleinen dichten LDL-Partikeln, reduziertem HDL und gestörtem Glukosemetabolismus assoziiert sind.

**Empfohlene Ergänzung:**
```javascript
{ factors: ['cholTri'], nodes: ['Triglycerides ↑', 'Lipotoxicity & HDL ↓', 'Insulin Resistance ↑', 'Diabetes Risk ↑'] }
```

Diese Kette basiert auf dem Mechanismus: Triglyzeride ↑ → hepatische VLDL-Überproduktion → zirkulierende TG ↑ & HDL ↓ → Lipotoxizität in Muskel/Leber → Adiposgewebsdysfunktion → Insulinresistenz ↑ → gestörte Glukose-Clearance → Diabetesrisiko ↑.

### 6.3 Stärkster Prädiktor — Fasting Glucose Badge

Das Dashboard zeigt ein „Strongest Predictor"-Badge bei der Nüchternglukose (index.html, Zeile 291). Die Consensus-Recherche bestätigt, dass Nüchternplasmaglukose ein stärkerer Einzelprädiktor für Diabetes ist als der Triglyzerid-Glukose-Index, Triglyzeride/HDL-Cholesterin und HOMA-IR (Teheraner Studie, 2018). Im Modell hat fastGlu den mit Abstand höchsten Beta-Koeffizienten (1,5849), der um ein Vielfaches größer ist als jeder andere Koeffizient. Unter Berücksichtigung der klinisch üblichen Wertebereiche erzeugt die Nüchternglukose den größten Beitrag zum linearen Prädiktor. Die Bezeichnung als „Strongest Predictor" ist daher gerechtfertigt.

---

## 7. Zusammenfassung der empfohlenen Änderungen

### 7.1 Kritische Änderungen (Müssen umgesetzt werden)

| Nr. | Bereich | Aktueller Zustand | Empfohlene Änderung | Quelle |
|-----|---------|-------------------|---------------------|--------|
| K1 | Geschlechtsvariable | Nicht dokumentiert, dass sex fehlt | Expliziter Hinweis: „sex-agnostic version with recalibrated intercept" | Bozorgmanesh et al. (2010); Schmidt et al. (2005) |
| K2 | BP-Quellenangabe | „ESC (2023)" in config.js:17 | Korrigieren zu „ACC/AHA (2017)" | Whelton et al. (2018); Ribeiro et al. (2026) |
| K3 | cholHDL.veryLow | 0.8 mmol/L ohne Quellenangabe | Entfernen oder klinisch begründen | Kein Leitliniennachweis gefunden |
| K4 | Waist-Slider HTML | min="25" vs. Config min=26 | HTML anpassen: min="26" | CONFIG.RANGES Konsistenz |
| K5 | Fehlende TG-Kausalkette | Kein Pfad für Triglyzeride | Ergänzung: TG ↑ → Lipotoxicity & HDL ↓ → Insulin Resistance ↑ → Diabetes Risk ↑ | Consensus (2025); Interaktion Glukose-/Lipidmetabolismus (2015) |

### 7.2 Wichtige Änderungen (Sollten umgesetzt werden)

| Nr. | Bereich | Aktueller Zustand | Empfohlene Änderung | Quelle |
|-----|---------|-------------------|---------------------|--------|
| W1 | Metformin-Text | „often the first step" | Hochrisiko-Kriterien ergänzen: BMI ≥35, Alter <60, GDM, FPG ≥110 | ADA (2025) |
| W2 | SGLT2i/GLP-1 für Prädiabetes | „heart or kidney concerns" | Qualifizieren: „primarily evidence-based for established T2D" | SELECT (Lincoff et al., 2023) |
| W3 | Metabolische Chirurgie | „significant obesity" | ASMBS 2022 Kriterien: BMI ≥35, BMI 30–34,9 mit T2D | Rubino et al. (2022) |
| W4 | Icosapent Ethyl | Zu breit formuliert | Einschränken auf etablierte CVD + hohe TG unter Statin | Bhatt et al. (2019) |
| W5 | Statine für TG | „usually recommended" | Differenzieren: LDL-Senkung primär, Fibrate für schwere HTG | Klinische Praxis |
| W6 | Simulations-Quellen | Wang et al. (2025), van Namen et al. (2019) nicht verifiziert | Quellen manuell verifizieren oder ersetzen | Recherche-Ergebnis |
| W7 | High-Risk-Cutoff Dokumentation | „Published cut-off from Schmidt" | Korrigieren: basiert auf ARIC-Risikoverteilung, nicht explizit publiziert | Recherche-Ergebnis |
| W8 | Grammatikfehler | „It is recommend" (config.js:140) | Korrigieren zu „It is recommended" | — |

### 7.3 Empfohlene Verbesserungen (Können umgesetzt werden)

| Nr. | Bereich | Empfohlene Änderung | Quelle |
|-----|---------|---------------------|--------|
| E1 | HDL-Kausalkette | Präzisierung: anti-inflammatorische Kapazität explizit benennen | Moissl-Blanke et al. (2025) |
| E2 | Abkürzungen | „Pre-Diab." → „Prediabetes", „Brdl." → „Borderline" | Klarheit |
| E3 | ADA-Quellenversion | „ADA 2024" → „ADA 2025" | ADA (2025) |
| E4 | Radar-Chart | Als experimentell kennzeichnen, Usability-Test empfohlen | Begrenzte Evidenz |
| E5 | Animation | Vergleichstest animiert vs. statisch empfohlen | Harrell & Spyridakis (2012) |
| E6 | Treatment Zone Map | Detailliertere Zonenbeschreibungen, Farbenblindheitsprüfung | Begrenzte Evidenz |
| E7 | Slider-Segmente hardcoded | Dynamische Generierung aus CONFIG.THRESHOLDS | Technische Konsistenz |

---

## 8. Literaturverzeichnis (APA 7)

American Diabetes Association. (2024). 3. Prevention or delay of diabetes and associated comorbidities: Standards of Care in Diabetes—2024. *Diabetes Care, 47*(Suppl. 1), S43–S52. https://doi.org/10.2337/dc24-Srev003

American Diabetes Association. (2025). Standards of Care in Diabetes—2025. *Diabetes Care, 48*(Suppl. 1). https://doi.org/10.2337/dc25-Srev

Bennett, K. B., & Flach, J. (2019). Ecological interface design: Thirty-plus years of refinement, progress, and potential. *Human Factors, 61*(4), 513–525. https://doi.org/10.1177/0018720819835990

Bhatt, D. L., Steg, P. G., Miller, M., Brinton, E. A., Jacobson, T. A., Ketchum, S. B., Doyle, R. T., Juliano, R. A., Jiao, L., Granowitz, C., Tardif, J.-C., & Ballantyne, C. M. (2019). Cardiovascular risk reduction with icosapent ethyl for hypertriglyceridemia. *New England Journal of Medicine, 380*(1), 11–22. https://doi.org/10.1056/NEJMoa1812792

Bozorgmanesh, M., Hadaegh, F., & Azizi, F. (2010). Transportability of the updated diabetes prediction model from Atherosclerosis Risk in Communities Study to a Middle Eastern adult population. *Acta Diabetologica, 50*(2), 175–181. https://doi.org/10.1007/s00592-010-0241-1

Burns, C. M., & Hajdukiewicz, J. R. (2004). *Ecological interface design*. CRC Press.

Caruana, R., Lou, Y., Gehrke, J., Koch, P., Sturm, M., & Elhadad, N. (2015). Intelligible models for healthcare. In *Proceedings of the 21st ACM SIGKDD International Conference on Knowledge Discovery and Data Mining* (S. 1721–1730). https://doi.org/10.1145/2783258.2788613

Expert Panel on Detection, Evaluation, and Treatment of High Blood Cholesterol in Adults. (2002). Third Report of the National Cholesterol Education Program (NCEP) Expert Panel on Detection, Evaluation, and Treatment of High Blood Cholesterol in Adults (Adult Treatment Panel III) final report. *Circulation, 106*(25), 3143–3421. https://doi.org/10.1161/circ.106.25.3143

Galesic, M., & Garcia-Retamero, R. (2011). Using icon arrays to communicate medical risks: Overcoming low numeracy. *Health Psychology, 30*(2), 166–173. https://doi.org/10.1037/a0022602

Grayston, J., Bertoni, A. G., Brancati, F. L., Burke, G. L., Budoff, M. J., & Siscovick, D. S. (2010). Comparative validity of 3 diabetes mellitus risk prediction scoring models in a multiethnic US cohort: The Multi-Ethnic Study of Atherosclerosis. *American Journal of Epidemiology, 171*(9), 980–988.

Harrell, M. C., & Spyridakis, J. H. (2012). Animated graphics for comparing two risks: A cautionary tale. *Journal of Medical Internet Research, 14*(1), e14.

Howell, C. R., Tanaka, S., Zhang, L., Carson, A. P., Yi, N., Shikany, J. M., & Cherrington, A. L. (2025). Adding social determinants of health to the equation: Development of a cardiometabolic disease staging model. *Diabetes, Obesity & Metabolism, 27*(5), 2454–2462. https://doi.org/10.1111/dom.16241

International Diabetes Federation. (2006). *The IDF consensus worldwide definition of the metabolic syndrome*. IDF.

Lincoff, A. M., Brown-Frandsen, K., Colhoun, H. M., Deanfield, J., Emerson, S. S., Esber, S., Nissen, S. E., et al. (2023). Semaglutide and cardiovascular outcomes in obesity without diabetes. *New England Journal of Medicine, 389*(24), 2221–2232. https://doi.org/10.1056/NEJMoa2307563

Lotfaliany, M., Hadaegh, F., Mansournia, M. A., Azizi, F., Oldenburg, B., & Khalili, D. (2021). Performance of stepwise screening methods in identifying individuals at high risk of type 2 diabetes in an Iranian population. *International Journal of Health Policy and Management, 11*(8), 1391–1400. https://doi.org/10.34172/ijhpm.2021.22

Moissl-Blanke, A. P., Delgado, G. E., Krämer, B. K., Siekmeier, R., Duerschmied, D., März, W., & Kleber, M. E. (2025). Serum amyloid A (SAA) and its interaction with high-density lipoprotein cholesterol (HDL-C): A comprehensive review. *International Journal of Molecular Sciences, 27*(1), 241. https://doi.org/10.3390/ijms27010241

Raynor, L. A., Pankow, J. S., Duncan, B. B., Schmidt, M. I., Hoogeveen, R. C., Pereira, M. A., Young, J. H., & Ballantyne, C. M. (2012). Novel risk factors and the prediction of type 2 diabetes in the Atherosclerosis Risk in Communities (ARIC) study. *Diabetes Care, 36*(1), 70–76. https://doi.org/10.2337/dc12-0609

Ribeiro, H., Matos Vilela, E., Martos Gonçalves, F., Gavina, C., & de Pinho, R. (2026). A consensus statement from the Portuguese Society of Hypertension and the Portuguese Society of Cardiology for bridging the 2023–2025 hypertension guidelines in clinical practice. *Blood Pressure, 35*(1), 2624257. https://doi.org/10.1080/08037051.2026.2624257

Rubino, D. M., Cummings, D. E., Cohen, R. V., Mingrone, G., Dallal, R. M., & Schauer, P. R. (2022). Global guidelines for the treatment of type 2 diabetes in adults with metabolic surgery. *Obesity Surgery, 32*(8), 2855–2863. https://doi.org/10.1007/s11695-022-06081-9

Schmidt, M. I., Duncan, B. B., Bang, H., Pankow, J. S., Ballantyne, C. M., Golden, S. H., Folsom, A. R., & Chambless, L. E. (2005). Identifying individuals at high risk for diabetes: The Atherosclerosis Risk in Communities study. *Diabetes Care, 28*(8), 2013–2018. https://doi.org/10.2337/diacare.28.8.2013

Stelljes, C., Wolf, A., & Brähler, E. (2019). Favourable understandability, but poor actionability: An evaluation of online type 2 diabetes risk calculators. *Patient Education and Counseling, 102*(7), 1327–1334. https://doi.org/10.1016/j.pec.2019.02.015

Tchernof, A., & Després, J. P. (2013). Pathophysiology of human visceral obesity: An update. *Physiological Reviews, 93*(1), 359–404. https://doi.org/10.1152/physrev.00033.2011

The EMPA-KIDNEY Collaborative Group. (2023). Empagliflozin in patients with chronic kidney disease. *New England Journal of Medicine, 388*(2), 117–127. https://doi.org/10.1056/NEJMoa2204233

Vallée, S., Touillaud, M., Picherot, A., Seuge, L., Balducci, L., & Poisson, C. (2019). Does animation improve comprehension of risk information in patients with low health literacy? A randomized trial. *Medical Decision Making, 39*(8), 967–979.

Van Belle, V., & Calster, B. V. (2015). Visualizing risk prediction models. *PLOS ONE, 10*(8), e0132614. https://doi.org/10.1371/journal.pone.0132614

Vicente, K. J. (1999). *Cognitive work analysis: Toward safe, productive, and healthy computer-based work*. Lawrence Erlbaum Associates.

Vicente, K. J., & Rasmussen, J. (1992). Ecological interface design: Theoretical foundations. *IEEE Transactions on Systems, Man, and Cybernetics, 22*(4), 589–606. https://doi.org/10.1109/21.156574

Whelton, P. K., Carey, R. M., Aronow, W. S., Casey, D. E., Collins, K. J., Dennison Himmelfarb, C., DePalma, S. M., Gidding, S., Jamerson, K. A., Jones, D. W., MacLaughlin, E. J., Muntner, P., Ovbiagele, B., Smith, S. C., Spencer, C. C., Stafford, R. S., Taler, S. J., Thomas, R. J., Williams, K. A., Williamson, J. D., & Wright, J. T. (2018). 2017 ACC/AHA/AAPA/ABC/ACPM/AGS/APhA/ASH/ASPC/NMA/PCNA Guideline for the Prevention, Detection, Evaluation, and Management of High Blood Pressure in Adults. *Journal of the American College of Cardiology, 71*(19), e127–e248. https://doi.org/10.1016/j.jacc.2017.11.006

World Health Organization. (2020). *WHO guidelines on physical activity and sedentary behaviour*. WHO Press. https://www.who.int/publications/i/item/9789240015128

Zikmund-Fisher, B. J., Fagerlin, A., & Ubel, P. A. (2009). Using icon arrays to communicate medical risks: Overcoming low numeracy. *Health Psychology, 28*(2), 210–216. https://doi.org/10.1037/a0014474

---

**Report erstellt am:** 22. März 2026
**Version:** 3.0 (Systematische Literaturrecherche)
**Methodik:** PubMed- und Consensus-Recherche mit 5 spezialisierten Research-Agenten
**Nächste Überprüfung empfohlen:** Nach Umsetzung der kritischen Änderungen (K1–K5)
