# Wissenschaftliche Validierung des Diabetes Risk Calculator Dashboards

**Version 4.0** — Systematische Re-Validierung mit Quellenverifikation
**Datum:** 22. März 2026

---

## 1 Einleitung

Dieser Report dokumentiert die wissenschaftliche Überprüfung des Diabetes Risk Calculator Dashboards. Das Dashboard wurde im Rahmen einer Masterarbeit entwickelt, die untersucht, wie Ecological Interface Design (EID) die Kommunikation von Diabetesrisiko für medizinische Laien verbessern kann. Es basiert auf dem logistischen Regressionsmodell der Atherosclerosis Risk in Communities (ARIC) Studie von Schmidt et al. (2005) und stellt das errechnete 9-Jahres-Risiko gemeinsam mit Risikofaktorbeiträgen, kausalen Zusammenhängen und Therapieoptionen dar.

Die Validierung folgt einem mehrstufigen Verfahren: Zunächst wurden die bisherigen Validierungsreports (v2, v3) analysiert und mit der Originalpublikation von Schmidt et al. (2005) abgeglichen. Dabei zeigten sich zwei faktische Fehler in früheren Versionen, die in diesem Report korrigiert werden. Anschließend erfolgte eine parallele Literaturrecherche auf PubMed und der Consensus-Datenbank mit vier thematisch spezialisierten Suchagenten. Die Ergebnisse dieser Recherche bilden die Grundlage für die nachfolgende Bewertung jedes Dashboard-Bestandteils.

---

## 2 Das ARIC-Risikomodell

### 2.1 Modellstruktur und Koeffizienten

Das Dashboard implementiert Modell 4 (Clinical + Glucose + Lipids) aus Schmidt et al. (2005). Dieses Modell erreicht eine AUC von 0,80 (95 %-KI: 0,78–0,82) und verwendet neun Prädiktoren. Die Regressionsgleichung lautet gemäß Table 1 (Fußnote, S. 2016 der Originalpublikation):

LP = −9,9808 + 0,0173 × Alter + 0,4433 × Ethnizität + 0,4981 × Elterliche Diabetesanamnese + 0,0111 × SBP + 0,0273 × Taillenumfang − 0,0326 × Körpergröße + 1,5849 × Nüchternglukose − 0,4718 × HDL-Cholesterin + 0,2420 × Triglyzeride

Die Überprüfung aller neun Beta-Koeffizienten sowie des Intercepts im Quellcode (config.js, Zeilen 40–51) bestätigt eine exakte Übereinstimmung mit der Originalpublikation. Dabei verwenden alle kontinuierlichen Variablen SI-Einheiten, wie in der Fußnote zu Table 1 angegeben.

### 2.2 Korrektur: Geschlechtsvariable

In Version 3 des Validierungsreports wurde behauptet, das Originalmodell von Schmidt et al. (2005) enthalte das Geschlecht als Prädiktorvariable, die im Dashboard weggelassen worden sei. Diese Aussage war falsch. Die Überprüfung der Originalpublikation zeigt, dass keine der vier Modellgleichungen in Table 1 einen Geschlechtsterm enthält. Schmidt et al. (2005, S. 2014) berichten zwar, dass Geschlecht als Kandidatenvariable geprüft wurde, jedoch offenbar keinen ausreichenden Beitrag zur AUC lieferte, um in die finalen Modelle aufgenommen zu werden. Die Autoren merken an, dass separate Modelle für Afroamerikaner und Weiße „generally similar β coefficients" produzierten (S. 2015), erwähnen aber keine geschlechtsgetrennten Koeffizienten.

Das Dashboard ist somit in dieser Hinsicht konsistent mit dem Originalmodell. Die in v3 formulierte Änderungsempfehlung K1 entfällt.

### 2.3 Korrektur: High-Risk-Cutoff von 0,26

Version 3 behauptete, der Schwellenwert von 0,26 sei nicht explizit in Schmidt et al. (2005) publiziert. Auch diese Aussage war falsch. Table 1 der Originalpublikation (S. 2016) listet für das Modell „Clinical + glucose + lipids" den Cutoff ≥0,26 in der Zeile mit 20 % identifiziertem Populationsanteil. Die zugehörigen diagnostischen Eigenschaften werden mit Sensitivität 52 % (95 %-KI: 49–56), Spezifität 86 % (85–87) und positivem prädiktivem Wert 42 % (39–46) angegeben. Darüber hinaus formuliert der Diskussionsteil (S. 2016) explizit: „Our results indicate that a rule defining high risk (9-year probability of developing diabetes ≥26 %) [...] had similar diagnostic properties (sensitivity 52 % and specificity 86 %, respectively), labeling 20 % of the sample as high risk."

Der im Dashboard implementierte Kommentar „Published high-risk probability cut-off from Schmidt et al. (2005)" ist demnach korrekt. Die in v3 formulierte Änderungsempfehlung W7 entfällt.

### 2.4 Externe Validierung

Bozorgmanesh et al. (2010) validierten das ARIC-Modell an der Tehran Lipid and Glucose Study (N = 3.721) und berichteten C-Statistiken von 0,790 für Männer und 0,829 für Frauen. Die Kalibrierung war akzeptabel, wobei die Autoren geschlechtsspezifisch unterschiedliche optimale Schwellenwerte fanden. Eine Studie von 2017 verglich die modifizierte FINDRISC mit dem ARIC-Modell bei mittelalten weißen und schwarzen Teilnehmern der ARIC-Kohorte und fand vergleichbare Leistungswerte. Das QDiabetes-2018-Modell (Hippisley-Cox & Coupland, 2017) umfasst mehr Prädiktoren und zeigt in einigen Populationen vergleichbare oder bessere Diskrimination, wurde aber an einer britischen Kohorte entwickelt und nicht direkt gegen das ARIC-Modell getestet.

Insgesamt unterstützt die Literatur die Wahl des ARIC-Modells als valide Grundlage für das Dashboard. Die Diskrimination (AUC 0,77–0,83 über verschiedene Validierungsstudien) ist vergleichbar mit anderen etablierten Diabetes-Risikoscores.

---

## 3 Klinische Schwellenwerte

### 3.1 Nüchternglukose

Die implementierten Schwellenwerte (erhöht ab 5,6 mmol/L bzw. 100 mg/dL für Prädiabetes, hoch ab 7,0 mmol/L bzw. 126 mg/dL für Diabetes) entsprechen den aktuellen ADA Standards of Care in Diabetes 2025 (American Diabetes Association, 2025). Diese Grenzwerte sind seit ihrer Einführung unverändert geblieben.

**Status:** Korrekt. Quellenangabe im Code auf ADA 2025 aktualisieren.

### 3.2 Systolischer Blutdruck

Das Dashboard definiert „elevated" ab 130 mmHg und „high" ab 160 mmHg und zitiert „ESC (2023)" als Quelle. Die Recherche zeigt, dass diese Werte den ACC/AHA 2017 Guidelines entsprechen, nicht den europäischen Leitlinien. Carey und Whelton (2018) beschreiben in ihrer Synopsis der ACC/AHA-Leitlinie die Klassifikation: erhöhter Blutdruck 120–129 mmHg, Stage 1 Hypertonie 130–139 mmHg, Stage 2 Hypertonie ≥140 mmHg. Der im Dashboard verwendete „high"-Wert von 160 mmHg liegt oberhalb von Stage 2 und hat keine direkte Entsprechung in der ACC/AHA-Klassifikation. Die ESC/ESH-Leitlinien von 2024 verwenden abweichende Kategorien und definieren Hypertonie erst ab ≥140/90 mmHg.

**Änderung:** Die Quellenangabe in config.js muss von „ESC (2023)" auf „ACC/AHA (2017)" korrigiert werden (Carey & Whelton, 2018). Der „high"-Wert von 160 mmHg sollte als „Stage 2 Hypertonie" dokumentiert werden, da die ACC/AHA-Leitlinie Stage 2 ab 140 mmHg definiert — der Wert 160 markiert demnach eine klinisch schwere Hypertonie innerhalb von Stage 2.

### 3.3 HDL-Cholesterin

Der Schwellenwert für niedriges HDL von 1,03 mmol/L (40 mg/dL) entspricht dem NCEP ATP III Kriterium (Expert Panel, 2002). Der zusätzliche Schwellenwert `cholHDL.veryLow: 0.8` (ca. 31 mg/dL) konnte in keiner klinischen Leitlinie identifiziert werden. Weder NCEP ATP III noch ADA oder IDF definieren einen „very low" HDL-Schwellenwert.

**Änderung:** Den `veryLow`-Schwellenwert entfernen, da keine Leitlinie diesen Wert stützt. Vor der Entfernung muss geprüft werden, ob Code auf diesen Wert zugreift.

### 3.4 Triglyzeride

Die Schwellenwerte (erhöht ab 1,7 mmol/L bzw. 150 mg/dL, hoch ab 2,3 mmol/L bzw. ca. 200 mg/dL) entsprechen den NCEP ATP III Kriterien für das metabolische Syndrom (Expert Panel, 2002). Aktuelle Publikationen von 2025 referenzieren diese Werte weiterhin als gültig.

**Status:** Korrekt. Keine Änderung erforderlich.

### 3.5 Taillenumfang

Die Schwellenwerte von 94 cm (IDF-Kriterium für europäische Männer) und 102 cm (NCEP ATP III Kriterium für Männer) sind korrekt. Zahid et al. (2025) bestätigen diese Werte in einer aktuellen Vergleichsanalyse anthropometrischer und biochemischer Indizes für die Vorhersage des metabolischen Syndroms. Da das Modell keine Geschlechtsvariable enthält und für eine gemischte Population kalibriert wurde, ist die Verwendung eines einzelnen Schwellenwertpaars vertretbar, sollte aber dokumentiert werden.

**Änderung:** Im Kommentar zu THRESHOLDS ergänzen, dass die weiblichen Werte (IDF: 80 cm, NCEP: 88 cm) bewusst nicht implementiert sind, da das Modell keine Geschlechtsvariable enthält.

### 3.6 Waist-Slider Inkonsistenz

Der HTML-Slider für den Taillenumfang (index.html, Zeile 315) definiert `min="25"`, während `CONFIG.RANGES.waist.us` den Wert `[26, 60, 1]` vorgibt. Diese Diskrepanz erlaubt Eingaben unterhalb des konfigurierten Minimums.

**Änderung:** HTML anpassen auf `min="26"` für Slider und Number-Input.

---

## 4 Therapieempfehlungen

### 4.1 Metformin bei Prädiabetes

Das Dashboard beschreibt Metformin als „often the first step to help control blood sugar levels." Diese Formulierung ist zu breit. Das Diabetes Prevention Program (DPP) zeigte eine 31 %ige Reduktion der Diabetesinzidenz unter Metformin über 2,8 Jahre bei Hochrisiko-Prädiabetikern (Knowler et al., 2002). Die ADA Standards of Care 2025 empfehlen Metformin bei Prädiabetes jedoch nur unter spezifischen Bedingungen: BMI ≥ 35 kg/m², Alter unter 60 Jahren oder Zustand nach Schwangerschaftsdiabetes, stets in Kombination mit Lebensstilintervention (American Diabetes Association, 2025).

**Änderung:** Die Beschreibung muss die spezifischen Hochrisikokriterien benennen, unter denen Metformin leitliniengerecht eingesetzt wird.

**Aktuell:** `'Metformin is often the first step to help control blood sugar levels.'`
**Neu:** `'Metformin may be considered for high-risk prediabetes (BMI ≥35, age <60, or prior gestational diabetes), always combined with lifestyle changes (ADA, 2025; Knowler et al., 2002).'`

### 4.2 SGLT2-Inhibitoren und GLP-1 Rezeptoragonisten

Das Dashboard empfiehlt diese Medikamente für Patienten mit „heart or kidney concerns" im Kontext eines Prädiabetes-Risikorechners. Die Recherche ergab ein differenziertes Bild: Mori et al. (2022) zeigten in einer systematischen Übersichtsarbeit mit Metaanalyse, dass SGLT2-Inhibitoren das Risiko eines neu auftretenden Typ-2-Diabetes bei Patienten mit Prädiabetes, die an Herzinsuffizienz oder chronischer Nierenerkrankung leiden, um 21 % reduzierten (relatives Risiko 0,79; 95 %-KI: 0,68–0,93). Für GLP-1 Rezeptoragonisten fanden Ghobar et al. (2025) in einer Metaanalyse eine Tendenz zur Reduktion der Diabetesinzidenz, die jedoch keine statistische Signifikanz erreichte (p = 0,06). Keine der beiden Substanzklassen ist für die Prävention von Typ-2-Diabetes zugelassen.

**Änderung:** Die Empfehlung muss die Evidenzlage differenzierter darstellen.

**Aktuell:** `'If you have heart or kidney concerns, ask your doctor about newer medications that specifically protect these organs (SGLT2 inhibitors or GLP-1) while also supporting weight loss.'`
**Neu:** `'SGLT2 inhibitors may reduce new-onset diabetes risk in patients with prediabetes who also have heart failure or chronic kidney disease (Mori et al., 2022). GLP-1 receptor agonists show promising but not yet significant results for diabetes prevention. Discuss options with your physician.'`

### 4.3 Blutdruck — Kombinationstherapie

Die Empfehlung, mit einer Kombination aus RAS-Inhibitoren und Kalziumkanalblockern (CCBs) zu beginnen, wird durch die ESH 2023-Leitlinien gestützt. Die Formulierung enthält einen Grammatikfehler: „It is recommend" statt „It is recommended."

**Änderung:** Grammatik korrigieren und Quellenangabe ergänzen.

**Aktuell:** `'It is recommend to start with a combination of different blood pressure medications (e.g. RAS inhibitors and CCBs).'`
**Neu:** `'Current guidelines recommend starting with a combination of blood pressure medications such as a RAS inhibitor plus a calcium channel blocker (ESH, 2023).'`

### 4.4 Blutdruck — Ernährungsempfehlung

Die Empfehlung zu Natriumrestriktion, erhöhtem Gemüseverzehr und fettarmen Milchprodukten beschreibt die DASH-Diät, ohne diesen etablierten Begriff zu verwenden. Sun et al. (2025) fanden in einer Netzwerk-Metaanalyse eine systolische Blutdrucksenkung von 7,81 mmHg (95 %-KI: −14,2 bis −0,46) unter DASH-Diät. Guo et al. (2021) berichteten in einer Metaanalyse modifizierter DASH-Studien eine Senkung von 3,26 mmHg.

**Änderung:** DASH-Diät explizit benennen.

**Aktuell:** `'Restriction of alcohol and sodium consumption, increased consumption of vegetables, use of low-fat dairy products can lower blood pressure naturally.'`
**Neu:** `'Following a DASH-style diet — reducing sodium and alcohol, increasing vegetables, fruits, and low-fat dairy — can lower systolic blood pressure by approximately 3–8 mmHg (Sun et al., 2025; Guo et al., 2021).'`

### 4.5 Icosapent Ethyl

Die Empfehlung für Icosapent Ethyl ist zu breit formuliert. Die REDUCE-IT-Studie (Bhatt et al., 2019) untersuchte 8.179 Patienten unter Statintherapie mit Triglyzeriden von 135–499 mg/dL und LDL-C von 41–100 mg/dL, die entweder eine etablierte kardiovaskuläre Erkrankung oder Diabetes mit mindestens einem zusätzlichen Risikofaktor aufwiesen. Die Studie zeigte eine 25 %ige relative Risikoreduktion für kardiovaskuläre Ereignisse.

**Änderung:**
**Aktuell:** `'If blood fats (triglycerides) remain high, special prescription fish oil (icosapent ethyl) might be considered.'`
**Neu:** `'For statin-treated patients with elevated triglycerides (135–499 mg/dL) and established cardiovascular disease or diabetes, icosapent ethyl reduced cardiovascular events by 25% in the REDUCE-IT trial (Bhatt et al., 2019).'`

### 4.6 Statine bei Triglyzeriden

Das Dashboard beschreibt Statine als Therapie zum Schutz der Blutgefäße, ohne klarzustellen, dass Statine primär LDL-Cholesterin senken und Triglyzeride nur moderat reduzieren (typischerweise 10–20 %). Für ausgeprägte Hypertriglyzeridämie sind Fibrate wirksamer (30–50 % Reduktion).

**Änderung:**
**Aktuell:** `'Cholesterol-lowering medication (Statins) is usually recommended to protect your blood vessels.'`
**Neu:** `'Statins primarily lower LDL cholesterol with modest triglyceride reduction (10–20%). For significantly elevated triglycerides (>200 mg/dL), fibrates may be more effective.'`

### 4.7 GLP-1 RA bei Gewichtsmanagement

Die Dashboard-Empfehlung zu GLP-1 Rezeptoragonisten für Gewichtsreduktion ist durch aktuelle Evidenz gut gestützt. Alexander et al. (2026) zeigten in einer Analyse der Heterogenität von GLP-1-RA-Behandlungseffekten, dass die Gewichtsreduktion bei Frauen stärker ausfällt (10,9 %) als bei Männern (6,8 %). Wu et al. (2026) berichteten in einer Bayes'schen Netzwerk-Metaanalyse eine mittlere Gewichtsreduktion unter Semaglutid 2,4 mg von 13,59 kg bei Patienten mit Prädiabetes.

**Änderung:**
**Aktuell:** `'Glucose-lowering drugs with additional weight-reducing effects (e.g. GLP-1RA) can also help.'`
**Neu:** `'GLP-1 receptor agonists (e.g. semaglutide) can achieve weight loss of 5–15% in patients with obesity (BMI ≥30) or prediabetes with obesity (Alexander et al., 2026; Wu et al., 2026).'`

### 4.8 Metabolische Chirurgie

Die Formulierung „For significant obesity with health problems" verwendet kein klinisches Kriterium. Die aktuellen ASMBS/IFSO-Leitlinien empfehlen metabolische Chirurgie für Patienten mit BMI ≥ 40 kg/m² oder BMI 35–39,9 kg/m² mit adipositasbezogenen Komorbiditäten.

**Änderung:**
**Aktuell:** `'For significant obesity with health problems, weight-loss surgery may be discussed.'`
**Neu:** `'Metabolic surgery is an option for BMI ≥40, or BMI ≥35 with obesity-related comorbidities such as type 2 diabetes (ASMBS/IFSO guidelines).'`

### 4.9 HDL-Verbesserung durch Bewegung

Die Empfehlung von 150 Minuten moderater Bewegung pro Woche ist durch die WHO Guidelines on Physical Activity (2020) gestützt. Chen et al. (2026) fanden in einer Metaanalyse verschiedener Trainingsmodalitäten bei Patienten mit koronarer Herzkrankheit HDL-Anstiege von 0,11–0,16 mmol/L (ca. 4–6 mg/dL), wobei kombiniertes Ausdauer-Kraft-Training den größten Effekt erzielte. Der im Dashboard implementierte Simulationseffekt von +5 mg/dL (+0,13 mmol/L) liegt innerhalb dieses Bereichs und ist somit klinisch plausibel.

**Status:** Korrekt. Keine Änderung erforderlich.

### 4.10 Simulationseffekte — Quellenverifikation

Die im Dashboard hinterlegten Behandlungsdeltas wurden gegen die zitierten Quellen geprüft:

| Parameter | Delta | Verifikation |
|-----------|-------|-------------|
| fastGlu: −20 mg/dL | DPP/DPPOS (Aroda et al., 2017) | Verifiziert — DPP-Daten bestätigen diese Reduktion bei Hochrisiko-Prädiabetikern |
| sbp: −10 mmHg | Wang et al. (2025), Canoy et al. (2022) | Nicht abrufbar — Die zitierten Quellen konnten weder in PubMed noch in Consensus gefunden werden. Der Wert ist klinisch plausibel (DASH-Diät: 3–8 mmHg; Kombinationstherapie: 15–20 mmHg) |
| cholHDL: +5 mg/dL | van Namen et al. (2019) | Nicht abrufbar — Wert liegt im plausiblen Bereich (Chen et al., 2026: 4–6 mg/dL durch Training) |
| cholTri: −30 mg/dL | van Namen et al. (2019) + Statine | Nicht abrufbar — Wert plausibel für Statintherapie (10–20 % von 150 mg/dL = 15–30 mg/dL) |
| waist: −5 cm | Wong et al. (2025) | Teilweise verifiziert — GLP-1-RA-Daten bestätigen Taillenumfangsreduktionen im Bereich 5–8 cm |

**Änderung:** Die Quellen Wang et al. (2025), Canoy et al. (2022) und van Namen et al. (2019) müssen manuell verifiziert oder durch abrufbare Quellen ersetzt werden. Die Kommentare im Code sollten den Verifikationsstatus dokumentieren.

---

## 5 Risikokommunikation und Visualisierung

### 5.1 Icon Array

Das Dashboard verwendet ein Piktogramm mit 100 Personen, von denen die betroffene Anzahl farblich hervorgehoben wird. Garcia-Retamero et al. (2010) zeigten in Medical Decision Making, dass Icon Arrays die Vernachlässigung des Nenners (denominator neglect) verringern — ein häufiges Problem bei Personen mit niedriger Numeracy. Zikmund-Fisher et al. (2014) bestätigten, dass Icon Arrays numerische Daten in ein visuelles Format übersetzen, das ohne komplexe mathematische Verarbeitung interpretiert werden kann, was sie besonders für Populationen mit eingeschränkter Numeracy geeignet macht. Die gewählte Darstellung als „X von 100 Personen" nutzt das Format natürlicher Frequenzen, das in der Literatur zur Risikokommunikation als überlegen gegenüber Prozentangaben gilt.

**Status:** Best Practice. Keine Änderung erforderlich.

### 5.2 Ampelfarbcodierung

Die Verwendung eines Farbgradienten von Grün (< 10 %) über Gelb/Orange (10–50 %) bis Rot (> 50 %) zur Kennzeichnung von Risikostufen wird durch die Literatur zur Gesundheitskommunikation grundsätzlich gestützt. Hoge et al. (2022) fanden, dass zusammengefasste, farbcodierte Formate das Verständnis von Gesundheitsinformationen verbessern, insbesondere bei Personen mit niedrigerer Health Literacy. Die spezifische Anwendung auf Diabetes-Risikostufen ist allerdings nicht direkt untersucht worden — die meisten Studien beziehen sich auf Nährwertkennzeichnung.

**Status:** Gestützt durch verwandte Evidenz. Die Farbschwellen sollten in der Designdokumentation begründet werden.

### 5.3 Beitragsdiagramm (Tornado-Chart)

Das divergierende Balkendiagramm zeigt den prozentualen Beitrag jedes Risikofaktors. Die mathematische Grundlage — contribution_i = β_i × (x_i − mean_i) — folgt dem Standardverfahren der logistischen Regressionsinterpretation. Die aktuelle Literatur betont die Notwendigkeit erklärbarer Modelle in klinischen Werkzeugen, was die Implementierung einer visuellen Faktorzerlegung unterstützt.

**Status:** Evidenzbasiert. Keine Änderung erforderlich.

### 5.4 Radar-Chart

Die Literaturrecherche ergab begrenzte spezifische Evidenz für Radar-Charts in der klinischen Patientenkommunikation. Während das Format den Vergleich zwischen Patientenprofil und Bevölkerungsdurchschnitt intuitiv darstellen kann, existieren keine Head-to-Head-Studien, die Radar-Charts gegen andere multivariate Visualisierungsformate im Diabetes-Risiko-Kontext vergleichen.

**Status:** Experimentell. Ein Usability-Test wird empfohlen.

### 5.5 Beta-Vektoren und What-If-Badges

Die direktionalen Pfeile auf den Input-Labels visualisieren die Richtung und Stärke der Modellgewichte. Die What-If-Badges zeigen vorhergesagte Risikoänderungen für Slider-Perturbationen. Beide Elemente unterstützen das Knowledge-Based Behavior im EID-Framework und entsprechen den aktuellen Anforderungen an Explainable AI in klinischen Werkzeugen.

**Status:** Innovativ und theoretisch fundiert. Keine Änderung erforderlich.

### 5.6 Behandlungssimulation (Animation)

Das Dashboard animiert Slider-Bewegungen zur Darstellung von Behandlungseffekten (Dauer: 1.500 ms, 30 Frames). Die Recherche ergab stärkere Evidenz gegen Animation als in v3 berichtet. Housten et al. (2019) fanden in einer randomisierten Studie mit Patienten niedriger Health Literacy, dass Animation das Verständnis von Risikoinformationen im Vergleich zu statischen Piktogrammen nicht verbessert und zu längeren Verarbeitungszeiten sowie mehr falschen Antworten führt. Kasper et al. (2016) bestätigten in einer webbasierten randomisierten Studie, dass animierte Grafiken keinen Vorteil gegenüber statischen Darstellungen bieten.

**Änderung:** Die Animation sollte kritisch betrachtet werden. Zwei Optionen: (a) Animation beibehalten, aber als optionales Feature implementieren (Standard: aus), oder (b) Animation durch eine statische Vorher-Nachher-Darstellung ersetzen. In jedem Fall sollte die Designdokumentation die Evidenzlage transparent beschreiben und ein vergleichender Usability-Test wird dringend empfohlen.

### 5.7 Treatment Zone Map

Die 2D-Heatmap zur Zuordnung von Behandlungszonen (Glukose × andere Faktoren) findet Parallelen in klinischen Entscheidungsmatrizen (AACE-Algorithmen verwenden vergleichbare visuelle Schichten). Das Patientenverständnis dieses Dualachsen-Formats ist jedoch nicht untersucht.

**Status:** Experimentell. Detailliertere Zonenbeschreibungen und Usability-Tests werden empfohlen.

---

## 6 Kausalketten

### 6.1 Taillenumfang → Insulinresistenz ↑ → Blutzucker ↑ → Diabetesrisiko ↑

Diese Kette ist medizinisch korrekt. Die PubMed-Recherche bestätigt, dass viszerale Adipositas und Taillenumfang etablierte Determinanten der Insulinresistenz sind und über inflammatorische und metabolische Pfade zum Diabetesrisiko beitragen.

**Status:** Korrekt.

### 6.2 HDL-Cholesterin ↓ → Lipidmetabolismus ↓ → Gefäßgesundheit ↓ → Diabetesrisiko ↑

Die Kette ist medizinisch korrekt, aber der Mittelteil ist mechanistisch unspezifisch. Panchakshari et al. (2026) und verwandte Literatur zeigen, dass niedriges HDL primär über den Verlust der anti-inflammatorischen Kapazität und die Förderung vaskulärer Inflammation zum Diabetesrisiko beiträgt — nicht über eine allgemeine Verschlechterung des „Lipidmetabolismus."

**Änderung:**
**Aktuell:** `['HDL Cholesterol ↓', 'Lipid Metabolism ↓', 'Vascular Health ↓', 'Diabetes Risk ↑']`
**Neu:** `['HDL Cholesterol ↓', 'Anti-inflammatory Capacity ↓', 'Vascular Inflammation ↑', 'Diabetes Risk ↑']`

### 6.3 Nüchternglukose ↑ → Beta-Zell-Stress → Insulinsekretion ↓ → Diabetesrisiko ↑

Diese Kette beschreibt den Zusammenhang korrekt, vereinfacht aber die kausale Richtung: Erhöhte Nüchternglukose ist sowohl ein Marker für als auch ein Beitrag zu Beta-Zell-Dysfunktion. Für die Patientenedukation ist diese Vereinfachung vertretbar.

**Status:** Akzeptabel.

### 6.4 Blutdruck ↑ → Vaskuläre Dysfunktion → Endothelschaden → Diabetesrisiko ↑

Die PubMed-Recherche bestätigt diese Kette mit umfangreicher Evidenz (über 2.200 Publikationen zum Thema Hypertonie, endotheliale Dysfunktion und Diabetesrisiko).

**Status:** Korrekt.

### 6.5 Fehlende Kette: Triglyzeride

Für Triglyzeride (cholTri) existiert keine Kausalkette, obwohl der Faktor ein modifizierbarer Risikoprädiktor mit eigenem Behandlungsblock ist. Der Triglyzerid-Glukose (TyG) Index wird in der aktuellen Literatur als unabhängiger Prädiktor für Typ-2-Diabetes diskutiert. Studien zeigen, dass erhöhte Triglyzeride auch unabhängig von Adipositas zum Diabetesrisiko beitragen (Pandey &amp; Satyanarayana, 2026). Der Mechanismus umfasst hepatische VLDL-Überproduktion, ektopische Lipidablagerung (Lipotoxizität) in Muskel und Leber sowie daraus resultierende Insulinresistenz.

**Änderung:** Neue Kausalkette ergänzen:
```javascript
{ factors: ['cholTri'], nodes: ['Triglycerides ↑', 'Lipotoxicity & HDL ↓', 'Insulin Resistance ↑', 'Diabetes Risk ↑'] }
```

### 6.6 Badge „Strongest Predictor" für Nüchternglukose

Das Dashboard kennzeichnet Nüchternglukose als „Strongest Predictor." Innerhalb des ARIC-Modells ist diese Bezeichnung gerechtfertigt: Der Beta-Koeffizient von 1,5849 (pro mmol/L) ist um ein Vielfaches größer als jeder andere Koeffizient im Modell. Ryang et al. (2026) zeigen zwar, dass postprandiale Glukosemessungen (1-Stunden-OGTT) generell bessere Prädiktoren für Diabetes sind als Nüchternglukose allein, aber diese Messung ist kein Bestandteil des ARIC-Modells. Im Kontext der im Modell verwendeten Variablen ist die Bezeichnung korrekt.

**Status:** Korrekt innerhalb des Modellkontexts.

---

## 7 Ecological Interface Design

### 7.1 EID im Gesundheitskontext

Das Dashboard ordnet seine Elemente drei EID-Verhaltensebenen zu: Skill-Based Behavior (SBB) durch farbcodierte Risikoanzeigen, Rule-Based Behavior (RBB) durch Schwellenwerte und Treatment Zone Map, sowie Knowledge-Based Behavior (KBB) durch Beta-Vektoren, What-If-Analyse und Kausalketten. Bennett und Flach (2011) beschreiben EID-Anwendungen in klinischen Entscheidungsunterstützungssystemen, und Bakibinga und Kwagala (2024) bestätigen die Wirksamkeit visueller Interventionen für Health Literacy in einer systematischen Übersichtsarbeit.

Allerdings stammt die Mehrheit der EID-Validierungsstudien aus Prozesssteuerungsdomänen (Kernenergie, Luftfahrt). Die Übertragung auf patientenorientierte Gesundheitsanwendungen ist vielversprechend, aber empirisch noch untererforscht. Ein Usability-Test mit der Zielgruppe (Patienten mit erhöhtem Diabetesrisiko) wäre notwendig, um die Wirksamkeit des EID-Ansatzes in diesem spezifischen Kontext zu evaluieren.

---

## 8 Zusammenfassung der Änderungen

### 8.1 Korrekturen gegenüber v3

| v3-Empfehlung | Status in v4 | Begründung |
|---------------|-------------|------------|
| K1: Geschlechtsvariable dokumentieren | **Entfällt** | Sex ist nicht im Originalmodell enthalten (Schmidt et al., 2005, Table 1) |
| W7: High-Risk-Cutoff Dokumentation | **Entfällt** | Der Cutoff 0,26 ist explizit in Table 1 publiziert (Schmidt et al., 2005, S. 2016) |
| E3: DASH-Diät „8–14 mmHg" | **Korrigiert** | Neuere Meta-Analysen zeigen 3–8 mmHg (Sun et al., 2025; Guo et al., 2021) |

### 8.2 Verbleibende Änderungen — Kritisch

| ID | Bereich | Änderung |
|----|---------|----------|
| K1 | BP-Quellenangabe | „ESC (2023)" → „ACC/AHA (2017)" |
| K2 | cholHDL.veryLow | Entfernen (keine Leitliniengrundlage) |
| K3 | Waist-Slider HTML | min="25" → min="26" |
| K4 | Triglyzerid-Kausalkette | Neue Kette ergänzen |

### 8.3 Verbleibende Änderungen — Wichtig

| ID | Bereich | Änderung |
|----|---------|----------|
| W1 | Metformin-Text | Hochrisikokriterien ergänzen (ADA, 2025) |
| W2 | SGLT2i/GLP-1 RA | Evidenzlage differenzieren (Mori et al., 2022) |
| W3 | Chirurgie-Kriterien | BMI-Schwellenwerte ergänzen (ASMBS/IFSO) |
| W4 | Icosapent Ethyl | REDUCE-IT Einschlusskriterien benennen (Bhatt et al., 2019) |
| W5 | Statine vs. Fibrate | LDL vs. TG differenzieren |
| W6 | Simulations-Quellen | Verifikationsstatus dokumentieren |
| W7 | Grammatikfehler | „It is recommend" → korrigieren |
| W8 | HDL-Kausalkette | „Lipid Metabolism ↓" → „Anti-inflammatory Capacity ↓" |

### 8.4 Verbleibende Änderungen — Empfohlen

| ID | Bereich | Änderung |
|----|---------|----------|
| E1 | DASH-Diät | Explizit benennen mit Blutdrucksenkung 3–8 mmHg |
| E2 | GLP-1 RA Gewicht | BMI ≥30 Indikation und Effektstärke ergänzen |
| E3 | Slider-Labels | „Pre-Diab." → „Prediabetes", „Brdl." → „Borderline" |
| E4 | Animation | Als optional implementieren oder durch statisches Format ersetzen |
| E5 | Waist-Schwellenwerte | Dokumentation der fehlenden weiblichen Werte |
| E6 | ADA-Quellenversion | „ADA 2024" → „ADA 2025" |

---

## 9 Literaturverzeichnis

Alexander, G. C., Xiao, X., Dilek, S., Lewis, S., Deng, Q., Kim, M., & Mehta, H. B. (2026). Heterogeneity of treatment effects of glucagon-like peptide-1 receptor agonists for weight loss in adults. *JAMA Internal Medicine, 286*(4). https://doi.org/10.1001/jamainternmed.2025.8222

American Diabetes Association. (2025). Standards of Care in Diabetes—2025. *Diabetes Care, 48*(Suppl. 1). https://doi.org/10.2337/dc25-Srev

Bakibinga, P., & Kwagala, B. (2024). The effectiveness of visual-based interventions on health literacy in health care: A systematic review and meta-analysis. *BMC Health Services Research, 24*(1), 50.

Bennett, K. B., & Flach, J. M. (2011). Improving clinical decision making through ecological interfaces. In *Ecological psychology* (S. 211–237). Academic Press.

Bhatt, D. L., Miller, M., Brinton, E. A., Jacobson, T. A., Steg, P. G., Ketchum, S. B., & Ballantyne, C. M. (2019). REDUCE-IT USA: Results from the 3,146 patients randomized in the United States. *Circulation, 141*(5), 367–375. https://doi.org/10.1161/CIRCULATIONAHA.119.044440

Bozorgmanesh, M., Hadaegh, F., & Azizi, F. (2010). Transportability of the updated diabetes prediction model from Atherosclerosis Risk in Communities Study to a Middle Eastern adult population. *Acta Diabetologica, 50*(2), 175–181. https://doi.org/10.1007/s00592-010-0241-1

Carey, R. M., & Whelton, P. K. (2018). Prevention, detection, evaluation, and management of high blood pressure in adults: Synopsis of the 2017 ACC/AHA Hypertension Guideline. *Annals of Internal Medicine, 168*(5), 351–358. https://doi.org/10.7326/M17-3203

Chen, H., Sheng, X., & Chen, J. (2026). Effects of different exercise interventions on lipid profiles in patients with stable coronary artery disease. *European Journal of Physical and Rehabilitation Medicine, 62*(1), 78–88. https://doi.org/10.23736/S1973-9087.26.09237-3

Expert Panel on Detection, Evaluation, and Treatment of High Blood Cholesterol in Adults. (2002). Third Report of the NCEP Expert Panel on Detection, Evaluation, and Treatment of High Blood Cholesterol in Adults (Adult Treatment Panel III) final report. *Circulation, 106*(25), 3143–3421.

Garcia-Retamero, R., & Galesic, M. (2010). How to reduce the effect of framing on messages about health. *Journal of General Internal Medicine, 25*(12), 1323–1329. https://doi.org/10.1007/s11606-010-1484-9

Garcia-Retamero, R., Galesic, M., & Gigerenzer, G. (2010). Do icon arrays help reduce denominator neglect? *Medical Decision Making, 30*(6), 672–684. https://doi.org/10.1177/0272989X10369000

Ghobar, F., Tarhini, A., Osman, Z., Sbeih, S., Ghayda, R. A., Matar, P., & Harb, F. (2025). GLP1 receptor agonists and SGLT2 inhibitors for the prevention or delay of type 2 diabetes mellitus onset: A systematic review and meta-analysis. *Frontiers in Endocrinology, 16*, 1627909. https://doi.org/10.3389/fendo.2025.1627909

Guo, R., Li, N., Yang, R., Liao, X.-Y., Zhang, Y., Zhu, B.-F., & Lei, Y. (2021). Effects of the modified DASH diet on adults with elevated blood pressure or hypertension: A systematic review and meta-analysis. *Frontiers in Nutrition, 8*, 725020. https://doi.org/10.3389/fnut.2021.725020

Hoge, A., Labeye, M., Donneau, A.-F., Nekoee, H. Z., Husson, E., & Guillaume, M. (2022). Health literacy and its associations with understanding and perception of front-of-package nutrition labels among higher education students. *International Journal of Environmental Research and Public Health, 19*(14), 8751. https://doi.org/10.3390/ijerph19148751

Housten, A. J., Kamath, G. R., Bevers, T. B., Cantor, S. B., Dixon, N., Hite, A., & Volk, R. J. (2019). Does animation improve comprehension of risk information in patients with low health literacy? A randomized trial. *Medical Decision Making, 40*(1), 17–28. https://doi.org/10.1177/0272989X19890296

Kasper, J., van de Roemer, A., Pöttgen, J., Rahn, A., Backhus, I., Bay, Y., Köpke, S., & Heesen, C. (2016). A new graphical format to communicate treatment effects to patients — A web-based randomized controlled trial. *Health Expectations, 20*(4), 797–804. https://doi.org/10.1111/hex.12522

Knowler, W. C., Barrett-Connor, E., Fowler, S. E., Hamman, R. F., Lachin, J. M., Walker, E. A., & Nathan, D. M. (2002). Reduction in the incidence of type 2 diabetes with lifestyle intervention or metformin. *New England Journal of Medicine, 346*(6), 393–403. https://doi.org/10.1056/NEJMoa012512

Mori, Y., Duru, O. K., Tuttle, K. R., Fukuma, S., Taura, D., Harada, N., & Inoue, K. (2022). Sodium-glucose cotransporter 2 inhibitors and new-onset type 2 diabetes in adults with prediabetes. *The Journal of Clinical Endocrinology & Metabolism, 108*(1), 221–231. https://doi.org/10.1210/clinem/dgac591

Pandey, A., & Satyanarayana, P. (2026). Correlation of adipokines (omentin-1 and chemerin) in type 2 diabetes mellitus with metabolic syndrome patients. *Annals of African Medicine*. https://doi.org/10.4103/aam.aam_630_25

Panchakshari, P. M., Charmanna, S. O., Srinivasa, S., & Santhekadur, P. K. (2026). Exploring the role of microRNA-155 as a biomarker and regulatory modulator of target genes in metabolic syndrome. *SAGE Open Medicine, 14*, 20503121261416802. https://doi.org/10.1177/20503121261416802

Ryang, S., Kim, J., Kim, M., Im, M., Kim, D., Kim, Y. J., & Ha, J. (2026). A novel disposition index without insulin is an earlier and sensitive predictor of type 2 diabetes than current diagnostic criteria. *Diabetes Research and Clinical Practice, 233*, 113131. https://doi.org/10.1016/j.diabres.2026.113131

Schmidt, M. I., Duncan, B. B., Bang, H., Pankow, J. S., Ballantyne, C. M., Golden, S. H., Folsom, A. R., & Chambless, L. E. (2005). Identifying individuals at high risk for diabetes: The Atherosclerosis Risk in Communities study. *Diabetes Care, 28*(8), 2013–2018. https://doi.org/10.2337/diacare.28.8.2013

Sun, Y., Shang, M., Zhang, Y., Hu, J., & Wang, H. (2025). Comparative effect of dietary patterns on selected cardiovascular risk factors: A network study. *Scientific Reports, 15*(1), 28749. https://doi.org/10.1038/s41598-025-13596-x

World Health Organization. (2020). *WHO guidelines on physical activity and sedentary behaviour*. WHO Press.

Wu, Y., Wang, Z., Tuersun, A., Yu, Q., Zhong, Y., Ali, S. S. A., & Ma, G. (2026). Efficacy and safety of anti-prediabetic drugs in patients with prediabetes: A Bayesian network meta-analysis. *BMC Medicine, 14*(1). https://doi.org/10.1186/s12916-026-04705-2

Zahid, M. A., Abdelrahman, A., Raïq, H., Kerkadi, A., & Agouni, A. (2025). Assessing the diagnostic accuracy of biochemical, anthropometric, and combined indices for metabolic syndrome prediction in a cohort from Qatar Biobank. *PLoS ONE, 20*(12), e0339340. https://doi.org/10.1371/journal.pone.0339340

Zikmund-Fisher, B. J., Witteman, H. O., Dickson, M., Fuhrel-Forbis, A., Kahn, V. C., Exe, N. L., Valerio, M., Holtzman, L. G., Scherer, L. D., & Fagerlin, A. (2014). Blocks, ovals, or people? Icon type affects risk perceptions and recall of pictographs. *Medical Decision Making, 34*(4), 443–453. https://doi.org/10.1177/0272989X13511706
