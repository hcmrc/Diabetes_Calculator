/**
 * @fileoverview Internationalization Service
 *
 * Manages language state, loads translations synchronously
 * for file:// protocol compatibility.
 *
 * @module I18nService
 * @memberof DRC
 */

'use strict';

window.DRC = window.DRC || {};

DRC.I18n = (() => {
    // ─── Embedded Translations ─────────────────────────────────────────
    // Loaded synchronously for file:// protocol compatibility
    const TRANSLATIONS = {
        en: {
            "_meta": { "language": "English", "code": "en" },
            "nav": { "brand": "Diabetes Risk Calculator", "reset": "Reset", "riskTimeline": "Risk Timeline", "selectProfile": "Select Profile", "language": "Select Language", "settings": "Settings" },
            "hero": { "title": "9-Year Diabetes Risk", "expandLabel": "What does that mean?", "subtitle": "Based on the ARIC Study logistic regression model (Schmidt et al. 2005)" },
            "factors": { "age": "Age", "sex": "Sex", "race": "Ethnicity", "parentHist": "Parental Diabetes", "sbp": "Blood Pressure", "waist": "Waist", "height": "Height", "fastGlu": "Fasting Glucose", "cholHDL": "HDL Cholesterol", "cholTri": "Blood Fats (Triglycerides)" },
            "units": { "years": "years", "male": "Male", "female": "Female", "other": "Other", "black": "Black", "yes": "Yes", "no": "No", "us": "US", "si": "SI" },
            "sections": { "demographic": "Patient Data", "clinical": "Clinical Data", "treatments": "Treatment Recommendations", "contributions": "Risk Factor Contributions" },
            "summary": { "age": "Age", "glucose": "Glucose", "waist": "Waist", "bp": "Blood Pressure", "hdl": "HDL", "tg": "TG" },
            "treatments": {
                "fastGlu": { "title": "Fasting Glucose Management", "therapy1_name": "Standard Medication", "therapy1_desc": "Metformin is often the first step to help control blood sugar levels.", "therapy2_name": "Heart & Kidney Protection", "therapy2_desc": "If you have heart or kidney concerns, ask your doctor about newer medications that specifically protect these organs (SGLT2 inhibitors or GLP-1) while also supporting weight loss." },
                "sbp": { "title": "Blood Pressure Control", "therapy1_name": "Combination Medications", "therapy1_desc": "It is recommend to start with a combination of different blood pressure medications (e.g. RAS inhibitors and CCBs).", "therapy2_name": "Heart-Healthy Diet", "therapy2_desc": "Restriction of alcohol and sodium consumption, increased consumption of vegetables, use of low-fat dairy products can lower blood pressure naturally." },
                "cholHDL": { "title": "HDL Cholesterol Improvement", "therapy1_name": "Regular Exercise", "therapy1_desc": "Aim for 150 minutes per week of activity like brisk walking, or 75 minutes of intense exercise.", "therapy2_name": "Medication", "therapy2_desc": "CETP inhibitors and Cholesterol-lowering medication (Statins) can also help to raise HDL." },
                "cholTri": { "title": "Blood Fats (Triglycerides) Treatment", "therapy1_name": "Healthy Lifestyle", "therapy1_desc": "Stopping smoking and eating healthy fats (olive oil, nuts, fish) all help and should be done first.", "therapy2_name": "Prescription Fish Oil", "therapy2_desc": "If blood fats (triglycerides) remain high, special prescription fish oil (icosapent ethyl) might be considered.", "therapy3_name": "Medication", "therapy3_desc": "Fibrate or Cholesterol lowering medication (Statins) can also help to reduce triglycerides." },
                "waist": { "title": "Weight Management", "therapy1_name": "Diet & Exercise", "therapy1_desc": "Reducing daily calories and exercising more leads to steady weight loss.", "therapy2_name": "Medications", "therapy2_desc": "Glucose-lowering drugs with additional weight-reducing effects (e.g. GLP-1RA) can also help.", "surgical": "Surgical Options", "surgical_desc": "For significant obesity with health problems, weight-loss surgery may be discussed." },
                "riskContribution": "risk contribution compared to average"
            },
            "buttons": { "simulate": "Simulate Treatment", "simulateActive": "Simulating...", "save": "Save", "cancel": "Cancel", "continue": "Continue", "createProfile": "Create Profile", "add": "Add", "export": "Export .xlsx / .drc", "import": "Import .xlsx / .drc", "scan": "Scan Lab Report", "setBaseline": "Set Baseline", "resetBaseline": "Reset Baseline", "alreadySimulated": "Already Simulated" },
            "patientManager": { "title": "My Profiles", "activeProfile": "Active Profile", "noProfile": "No profile selected", "savedProfiles": "Saved Profiles", "addNew": "Add New Profile", "placeholder": "Profile name...", "empty": "No profiles saved yet.", "importExport": "Import / Export / OCR" },
            "timeline": { "title": "Risk Timeline", "hint": "Simulate treatments to track risk changes over time", "setBaseline": "Set Baseline", "snapshot": "Snapshot", "empty": "Set a baseline and add snapshots to track your risk over scenarios.", "baselineLabel": "Baseline", "treatmentHistory": "Treatment History" },
            "modals": { "profileWarning": { "title": "Save Your Data?", "message": "You haven't created a profile yet. If you continue, your current data won't be saved.", "create": "Create Profile", "continue": "Continue Without Saving" }, "ocr": { "title": "Scan Lab Report", "instructions": "Take a photo or upload your lab report", "camera": "Camera", "upload": "Upload File", "review": "Review Results", "confidence_high": "High confidence", "confidence_medium": "Medium confidence", "confidence_low": "Low confidence", "processing": "Processing...", "reviewTitle": "Review Values", "errorTitle": "Processing Error", "errorMessage": "Could not process image. Please try again." } },
            "causality": {
                "abdominalFat": "Abdominal Fat ↑",
                "insulinResistance": "Insulin Resistance",
                "betaCellDysfunction": "β-Cell Dysfunction",
                "diabetesRisk": "Diabetes Risk ↑",
                "gluconeogenesis": "Gluconeogenesis ↑",
                "fastingGlucose": "Fasting Glucose ↑",
                "betaCellExhaustion": "Beta-Cell Exhaustion",
                "hdlCholesterol": "HDL Cholesterol ↓",
                "pancreaticProtection": "Pancreatic Protection ↓",
                "betaCellDamage": "Beta-Cell Damage",
                "bloodPressure": "Blood Pressure ↑",
                "insulinResistanceInc": "Insulin Resistance ↑",
                "lipolysis": "Lipolysis ↑",
                "freeFattyAcids": "Free Fatty Acids ↑",
                "triglycerides": "Triglycerides ↑"
            },
            "status": { "indicated": "Indicated", "elevated": "Elevated", "normal": "Normal" },
            "chart": { "average": "Average", "avgShort": "Avg", "lower": "lower", "higher": "higher", "yourRisk": "your risk", "thanAverage": "than the average of", "filterLabel": "Show above average risk factors only", "betterThanAvg": "Better than average", "betterShort": "Better", "worseThanAvg": "Worse than average", "worseShort": "Worse", "clickForInfo": "Click for info", "verb": { "increasing": "Increasing", "lowering": "Lowering" }, "info": { "binaryIncrease": "Your {factor} increases your overall diabetes risk by {pct}. Check the treatment section on the right.", "binaryDecrease": "Your {factor} decreases your overall diabetes risk by {pct} compared to an average person.", "aboveIncrease": "Your {factor} is above average and increases your overall diabetes risk by {pct} compared to an average value. {verb} it would help to decrease your overall risk. Check the treatment section on the right.", "belowIncrease": "Your {factor} is below average and increases your overall diabetes risk by {pct} compared to an average value. {verb} it would help to decrease your overall risk. Check the treatment section on the right.", "aboveDecrease": "Your {factor} is above average and decreases your overall diabetes risk by {pct} compared to an average value.", "belowDecrease": "Your {factor} is below average and decreases your overall diabetes risk by {pct} compared to an average value." } },
            "scenario": { "baseline": "Baseline", "current": "Current" },
            "iconArray": { "label": "${affected} out of 100 people with your profile may develop diabetes within 9 years" },
            "panels": { "riskAnalysis": "Risk Analysis", "riskFactors": "Risk Factors", "riskFactorsSubtitle": "Which factors influence risk by how much compared to the average", "contributions": "Contributions", "connections": "Connections", "connectionsTitle": "How Your Risk Factors Connect", "connectionsDesc": "Type 2 diabetes is characterized by insulin resistance and insulin deficiency, among others caused by beta-cell dysfunction. Risk factors can be the cause or caused by this.", "takeAction": "Take Action", "whatCanIDo": "What Can I Do?", "takeActionSubtitle": "Evidence-based steps to reduce your risk" },
            "modals": { "profileWarning": { "title": "Save Your Data?", "message1": "You haven't created a profile yet.", "message2": "Create a profile to save your data and track your progress over time. Without a profile, your data may be lost when you close the browser.", "create": "Create Profile", "continue": "Continue Without Saving", "cancel": "Cancel" }, "ocr": { "title": "Scan Lab Report", "instructions": "Take a photo or upload your lab report", "camera": "Camera", "upload": "Upload File", "review": "Review Results", "confidence_high": "High confidence", "confidence_medium": "Medium confidence", "confidence_low": "Low confidence", "processing": "Processing...", "reviewTitle": "Review Values", "errorTitle": "Processing Error", "errorMessage": "Could not process image. Please try again." } },
            "buttons": { "simulate": "Simulate Treatment", "simulateActive": "Simulating...", "save": "Save", "cancel": "Cancel", "continue": "Continue", "createProfile": "Create Profile", "add": "Add", "addAndSave": "Add & Save Current Values", "export": "Export .xlsx / .drc", "import": "Import .xlsx / .drc", "scan": "Scan Lab Report", "setBaseline": "Set Baseline", "resetBaseline": "Reset Baseline", "alreadySimulated": "Already Simulated" },
            "patientManager": { "title": "My Profiles", "activeProfile": "Active Profile", "noProfile": "No profile selected", "savedProfiles": "Saved Profiles", "addNew": "Add New Profile", "placeholder": "Profile name...", "empty": "No profiles saved yet.", "importExport": "Import / Export / OCR", "selectProfile": "Select Profile", "riskLabel": "Risk", "unknownDate": "Unknown", "exportProfile": "Export this profile to Excel", "renameProfile": "Rename profile", "updateProfile": "Update with current values", "deleteProfile": "Delete profile", "renamePrompt": "Rename \"{name}\" to:", "deleteConfirm": "Delete profile \"{name}\"?" },
            "settings": { "model": "Prediction Model", "language": "Language", "darkMode": "Dark Mode", "units": "Units", "restartSetup": "Setup", "restartSetupBtn": "Start Over" },
            "models": { "clinical": { "name": "Clinical Only", "desc": "Body measurements & demography only, no blood test needed" }, "clinicalGlucose": { "name": "Clinical + Glucose", "desc": "Clinical values plus fasting glucose" }, "clinicalGlucoseLipids": { "name": "Clinical + Glucose + Lipids", "desc": "Complete model with all lab values" }, "accuracy": { "basis": "Basic", "gut": "Good", "beste": "Best" }, "accuracyLabel": "Prediction quality" },
            "tutorial": { "button": "Tutorial", "close": "Close", "next": "Next", "prev": "Back", "finish": "Finish", "stepLabel": "Section {n} of {total}: {title}", "steps": { "nav": { "title": "Navigation", "resetBtn": { "title": "Reset Values", "text": "Resets all values to the ones saved in the Profile. If no Profile is selected it resets to the default." }, "timelineBtn": { "title": "Risk Timeline", "text": "Opens the Risk Timeline panel to track how your risk changes across treatment scenarios over time." }, "patientBtn": { "title": "Patient Profiles", "text": "Manage saved patient profiles — create, rename, update, export, and import profiles." }, "settingsBtn": { "title": "Settings", "text": "Switch language, toggle dark mode, and change between US and SI measurement units." } }, "hero": { "title": "Risk Score", "percentage": { "title": "9-Year Risk", "text": "Risk of getting diabetes in the next 9 years based on the entered values." }, "bar": { "title": "Risk Bar", "text": "The bar shows where your risk sits on a spectrum. The marker moves instantly as you adjust your risk factors." }, "expand": { "title": "What Does That Mean?", "text": "Explains what the probability means." } }, "timeline": { "title": "Risk Timeline", "snapshot": { "title": "Snapshot", "text": "Saves your current risk as a data point on the chart. Take snapshots before and after treatments to compare outcomes." }, "baseline": { "title": "Set Baseline", "text": "Marks the current risk as your reference point. All subsequent snapshots are compared against this baseline." }, "chart": { "title": "Timeline Chart", "text": "A visual history of your snapshots and treatment simulation." } }, "input": { "title": "Patient Data", "demographic": { "title": "Patient Data", "text": "Enter your personal values here. These will be used to calculate your risk." }, "clinical": { "title": "Clinical Values", "text": "Modifiable risk factors: fasting glucose, waist, blood pressure, HDL cholesterol, and triglycerides. Adjust these to see how changes affect your risk." }, "sliders": { "title": "Slider", "text": "You can adjust your values by moving the slider up or down." }, "units": { "title": "Unit Toggle", "text": "Switch between US (mg/dL) and SI (mmol/L) units. All values convert automatically." }, "valuebox": { "title": "Value Box", "text": "Here you can see the exact value that is used for the risk calculation. You can also adjust your values by entering them here." }, "toggle": { "title": "Toggle", "text": "Ethnicity, Parental history and Sex can be changed by clicking on the toggle." } }, "model": { "title": "Risk Analysis", "tabs": { "title": "Analysis Tabs", "text": "Two views: Contributions shows how each factor raises or lowers your risk. Connections shows the biological causal pathways." }, "contributions": { "title": "Contribution Chart", "text": "Bars extending right increase your risk, bars to the left decrease it compared to an average value. Length shows how strong the influence on the overall risk is. Click on the bar to see more." }, "causality": { "title": "Causality Chains", "text": "Visual diagrams of the biological mechanisms behind your elevated risk factors — e.g., how abdominal fat leads to insulin resistance." } }, "treatment": { "title": "Treatment Options", "cards": { "title": "Treatment Cards", "text": "Evidence-based recommendations for your elevated risk factors, sorted by their contribution to your risk." }, "simulate": { "title": "Simulate Treatment", "text": "Click on any card to animate how that intervention would change your values and overall risk." } }, "profiles": { "title": "Profiles & Settings", "profiles": { "title": "Save & Load Profiles", "text": "Create a profile to persistently save all your input values. Manage multiple profiles to track different patients or progress over time." }, "export": { "title": "Export & Import", "text": "Export profiles to encrypted .drc or Excel (.xlsx). Import previously exported files to restore data on any device." }, "settings": { "title": "Settings Panel", "text": "Switch display language (English/German/French), toggle light and dark mode, and change measurement units between US and SI." } } } },
            "landing": { "welcome": { "title": "Diabetes Risk Calculator", "subtitle": "Understand your 9-year diabetes risk based on the ARIC Study", "getStarted": "Get Started" }, "language": { "title": "Choose Your Language", "subtitle": "Select your preferred language for the app interface" }, "model": { "title": "Choose Prediction Model", "subtitle": "Select how many values you want to enter for your risk calculation", "clinical": { "name": "Clinical Only", "desc": "Body measurements & demography only, no blood test needed", "accuracy": "Basic" }, "clinicalGlucose": { "name": "Clinical + Glucose", "desc": "Clinical values plus fasting glucose", "accuracy": "Good" }, "complete": { "name": "Complete Model", "desc": "All lab values for best prediction accuracy", "accuracy": "Best" } }, "import": { "title": "Import Your Data", "subtitle": "Quickly import your values from a file, or skip and enter manually", "image": "Image Upload", "pdf": "PDF Upload", "excel": "Excel Import", "encrypted": "Encrypted File", "skip": "Enter values manually instead" }, "tutorial": { "title": "Would you like a tour?", "subtitle": "Learn how to use all features with a quick interactive tutorial", "yes": "Show me how to use this app", "no": "Skip tutorial" }, "ready": { "title": "You're all set!", "start": "Start Calculator", "restart": "Start over and change settings" }, "stepCounter": "Step {step} of {total}", "back": "Back", "next": "Next", "restart": "Start Over" }
        },
        de: {
            "_meta": { "language": "Deutsch", "code": "de" },
            "nav": { "brand": "Diabetes Risiko Rechner", "reset": "Zurücksetzen", "riskTimeline": "Risiko Zeitlinie", "selectProfile": "Profil wählen", "language": "Sprache wählen", "settings": "Einstellungen" },
            "hero": { "title": "9-Jahres Diabetes Risiko", "expandLabel": "Was bedeutet das?", "subtitle": "Basierend auf dem ARIC-Studie logistischen Regressionsmodell (Schmidt et al. 2005)" },
            "factors": { "age": "Alter", "sex": "Geschlecht", "race": "Ethnizität", "parentHist": "Elterlicher Diabetes", "sbp": "Blutdruck", "waist": "Taillenumfang", "height": "Körpergröße", "fastGlu": "Nüchternglukose", "cholHDL": "HDL Cholesterin", "cholTri": "Blutfette (Triglyceride)" },
            "units": { "years": "Jahre", "male": "Männlich", "female": "Weiblich", "other": "Andere", "black": "Schwarz", "yes": "Ja", "no": "Nein", "us": "US", "si": "SI" },
            "sections": { "demographic": "Patientendaten", "clinical": "Klinische Daten", "treatments": "Behandlungsempfehlungen", "contributions": "Risikofaktor-Beiträge" },
            "summary": { "age": "Alter", "glucose": "Glukose", "waist": "Taille", "bp": "Blutdruck", "hdl": "HDL", "tg": "TG" },
            "treatments": {
                "fastGlu": { "title": "Nüchternglukose Management", "therapy1_name": "Standard Medikation", "therapy1_desc": "Metformin ist oft der erste Schritt, um den Blutzuckerspiegel zu kontrollieren.", "therapy2_name": "Herz- & Nierenschutz", "therapy2_desc": "Wenn Sie Herz- oder Nierenprobleme haben, fragen Sie Ihren Arzt nach neueren Medikamenten, die diese Organe speziell schützen (SGLT2-Inhibitoren oder GLP-1) und gleichzeitig das Gewicht reduzieren." },
                "sbp": { "title": "Blutdruckkontrolle", "therapy1_name": "Kombinationsmedikamente", "therapy1_desc": "Es wird empfohlen, mit einer Kombination verschiedener Blutdruckmedikamente zu beginnen (z.B. RAS-Hemmer und CCBs).", "therapy2_name": "Herzgesunde Ernährung", "therapy2_desc": "Die Reduzierung von Alkohol- und Natriumkonsum, erhöhter Gemüsekonsum und die Verwendung von fettarmen Milchprodukten können den Blutdruck natürlich senken." },
                "cholHDL": { "title": "HDL Cholesterin Verbesserung", "therapy1_name": "Regelmäßige Bewegung", "therapy1_desc": "Zielen Sie auf 150 Minuten pro Woche Aktivität wie zügiges Gehen oder 75 Minuten intensives Training.", "therapy2_name": "Medikation", "therapy2_desc": "CETP-Inhibitoren und cholesterinsenkende Medikamente (Statine) können auch helfen, das HDL zu erhöhen." },
                "cholTri": { "title": "Blutfette (Triglyceride) Behandlung", "therapy1_name": "Gesunder Lebensstil", "therapy1_desc": "Mit dem Rauchen aufhören und gesunde Fette (Olivenöl, Nüsse, Fisch) essen, das hilft alles und sollte zuerst getan werden.", "therapy2_name": "Verschreibungspflichtiges Fischöl", "therapy2_desc": "Wenn die Blutfette (Triglyceride) weiterhin hoch bleiben, kann spezielles verschreibungspflichtiges Fischöl (Icosapent Ethyl) in Betracht gezogen werden.", "therapy3_name": "Medikation", "therapy3_desc": "Fibrate oder cholesterinsenkende Medikamente (Statine) können auch helfen, die Triglyceride zu reduzieren." },
                "waist": { "title": "Gewichtsmanagement", "therapy1_name": "Ernährung & Bewegung", "therapy1_desc": "Die Reduzierung der täglichen Kalorien und mehr Bewegung führt zu stetigem Gewichtsverlust.", "therapy2_name": "Medikamente", "therapy2_desc": "Glukose-senkende Medikamente mit zusätzlichen gewichtsreduzierenden Effekten (z.B. GLP-1RA) können auch helfen.", "surgical": "Chirurgische Optionen", "surgical_desc": "Bei signifikanter Adipositas mit gesundheitlichen Problemen kann eine Gewichtsabnahmechirurgie diskutiert werden." },
                "riskContribution": "Risikobeitrag im Vergleich zum Durchschnitt"
            },
            "buttons": { "simulate": "Behandlung simulieren", "simulateActive": "Simuliere...", "save": "Speichern", "cancel": "Abbrechen", "continue": "Weiter", "createProfile": "Profil erstellen", "add": "Hinzufügen", "export": "Export .xlsx / .drc", "import": "Import .xlsx / .drc", "scan": "Labbericht scannen", "setBaseline": "Basislinie setzen", "resetBaseline": "Basislinie zurücksetzen", "alreadySimulated": "Bereits simuliert" },
            "patientManager": { "title": "Meine Profile", "activeProfile": "Aktives Profil", "noProfile": "Kein Profil ausgewählt", "savedProfiles": "Gespeicherte Profile", "addNew": "Neues Profil hinzufügen", "placeholder": "Profilname...", "empty": "Noch keine Profile gespeichert.", "importExport": "Import / Export / OCR" },
            "timeline": { "title": "Risiko Zeitlinie", "hint": "Simulieren Sie Behandlungen, um Risikoänderungen im Zeitverlauf zu verfolgen", "setBaseline": "Basislinie setzen", "snapshot": "Schnappschuss", "empty": "Setzen Sie eine Basislinie und fügen Sie Schnappschüsse hinzu, um Ihr Risiko über Szenarien zu verfolgen.", "baselineLabel": "Basislinie", "treatmentHistory": "Behandlungsverlauf" },
            "modals": { "profileWarning": { "title": "Daten speichern?", "message": "Sie haben noch kein Profil erstellt. Wenn Sie fortfahren, werden Ihre aktuellen Daten nicht gespeichert.", "create": "Profil erstellen", "continue": "Ohne Speichern fortfahren" }, "ocr": { "title": "Labbericht scannen", "instructions": "Machen Sie ein Foto oder laden Sie Ihren Labbericht hoch", "camera": "Kamera", "upload": "Datei hochladen", "review": "Ergebnisse prüfen", "confidence_high": "Hohe Konfidenz", "confidence_medium": "Mittlere Konfidenz", "confidence_low": "Niedrige Konfidenz", "processing": "Verarbeite...", "reviewTitle": "Werte prüfen", "errorTitle": "Verarbeitungsfehler", "errorMessage": "Bild konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut." } },
            "causality": {
                "abdominalFat": "Bauchfett ↑",
                "insulinResistance": "Insulinresistenz",
                "betaCellDysfunction": "β-Zell-Dysfunktion",
                "diabetesRisk": "Diabetes-Risiko ↑",
                "gluconeogenesis": "Gluconeogenese ↑",
                "fastingGlucose": "Nüchternglukose ↑",
                "betaCellExhaustion": "Beta-Zell-Erschöpfung",
                "hdlCholesterol": "HDL-Cholesterin ↓",
                "pancreaticProtection": "Pankreasschutz ↓",
                "betaCellDamage": "Beta-Zell-Schaden",
                "bloodPressure": "Blutdruck ↑",
                "insulinResistanceInc": "Insulinresistenz ↑",
                "lipolysis": "Lipolyse ↑",
                "freeFattyAcids": "Freie Fettsäuren ↑",
                "triglycerides": "Triglyceride ↑"
            },
            "status": { "indicated": "Indiziert", "elevated": "Erhöht", "normal": "Normal" },
            "chart": { "average": "Durchschnitt", "avgShort": "Ø", "lower": "niedriger", "higher": "höher", "yourRisk": "Ihr Risiko", "thanAverage": "als der Durchschnitt von", "filterLabel": "Nur überdurchschnittliche Risikofaktoren anzeigen", "betterThanAvg": "Besser als Durchschnitt", "betterShort": "Besser", "worseThanAvg": "Schlechter als Durchschnitt", "worseShort": "Schlechter", "clickForInfo": "Für Info klicken", "verb": { "increasing": "Erhöhen", "lowering": "Senken" }, "info": { "binaryIncrease": "Ihr {factor} erhöht Ihr Diabetesrisiko um {pct}. Prüfen Sie die Behandlungsempfehlungen rechts.", "binaryDecrease": "Ihr {factor} verringert Ihr Diabetesrisiko um {pct} im Vergleich zu einer durchschnittlichen Person.", "aboveIncrease": "Ihr {factor} liegt über dem Durchschnitt und erhöht Ihr Diabetesrisiko um {pct} im Vergleich zum Durchschnittswert. {verb} würde helfen, Ihr Gesamtrisiko zu senken. Prüfen Sie die Behandlungsempfehlungen rechts.", "belowIncrease": "Ihr {factor} liegt unter dem Durchschnitt und erhöht Ihr Diabetesrisiko um {pct} im Vergleich zum Durchschnittswert. {verb} würde helfen, Ihr Gesamtrisiko zu senken. Prüfen Sie die Behandlungsempfehlungen rechts.", "aboveDecrease": "Ihr {factor} liegt über dem Durchschnitt und verringert Ihr Diabetesrisiko um {pct} im Vergleich zum Durchschnittswert.", "belowDecrease": "Ihr {factor} liegt unter dem Durchschnitt und verringert Ihr Diabetesrisiko um {pct} im Vergleich zum Durchschnittswert." } },
            "scenario": { "baseline": "Basislinie", "current": "Aktuell" },
            "iconArray": { "label": "${affected} von 100 Personen mit Ihrem Profil können innerhalb von 9 Jahren Diabetes entwickeln" },
            "panels": { "riskAnalysis": "Risikoanalyse", "riskFactors": "Risikofaktoren", "riskFactorsSubtitle": "Welche Faktoren beeinflussen das Risiko im Vergleich zum Durchschnitt", "contributions": "Beiträge", "connections": "Zusammenhänge", "connectionsTitle": "Wie Ihre Risikofaktoren zusammenhängen", "connectionsDesc": "Typ-2-Diabetes ist unter anderem durch Insulinresistenz und Insulinmangel gekennzeichnet, die durch Beta-Zell-Dysfunktion verursacht werden. Risikofaktoren können Ursache oder Folge davon sein.", "takeAction": "Handeln", "whatCanIDo": "Was kann ich tun?", "takeActionSubtitle": "Evidenzbasierte Maßnahmen zur Risikoreduktion" },
            "modals": { "profileWarning": { "title": "Daten speichern?", "message1": "Sie haben noch kein Profil erstellt.", "message2": "Erstellen Sie ein Profil, um Ihre Daten zu speichern und Ihren Fortschritt zu verfolgen. Ohne ein Profil können Ihre Daten beim Schließen des Browsers verloren gehen.", "create": "Profil erstellen", "continue": "Ohne Speichern fortfahren", "cancel": "Abbrechen" }, "ocr": { "title": "Labbericht scannen", "instructions": "Machen Sie ein Foto oder laden Sie Ihren Labbericht hoch", "camera": "Kamera", "upload": "Datei hochladen", "review": "Ergebnisse prüfen", "confidence_high": "Hohe Konfidenz", "confidence_medium": "Mittlere Konfidenz", "confidence_low": "Niedrige Konfidenz", "processing": "Verarbeite...", "reviewTitle": "Werte prüfen", "errorTitle": "Verarbeitungsfehler", "errorMessage": "Bild konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut." } },
            "buttons": { "simulate": "Behandlung simulieren", "simulateActive": "Simuliere...", "save": "Speichern", "cancel": "Abbrechen", "continue": "Weiter", "createProfile": "Profil erstellen", "add": "Hinzufügen", "addAndSave": "Hinzufügen & Aktuelle Werte speichern", "export": "Export .xlsx / .drc", "import": "Import .xlsx / .drc", "scan": "Labbericht scannen", "setBaseline": "Basislinie setzen", "resetBaseline": "Basislinie zurücksetzen", "alreadySimulated": "Bereits simuliert" },
            "patientManager": { "title": "Meine Profile", "activeProfile": "Aktives Profil", "noProfile": "Kein Profil ausgewählt", "savedProfiles": "Gespeicherte Profile", "addNew": "Neues Profil hinzufügen", "placeholder": "Profilname...", "empty": "Noch keine Profile gespeichert.", "importExport": "Import / Export / OCR", "selectProfile": "Profil wählen", "riskLabel": "Risiko", "unknownDate": "Unbekannt", "exportProfile": "Dieses Profil als Excel exportieren", "renameProfile": "Profil umbenennen", "updateProfile": "Mit aktuellen Werten aktualisieren", "deleteProfile": "Profil löschen", "renamePrompt": "\"{name}\" umbenennen in:", "deleteConfirm": "Profil \"{name}\" löschen?" },
            "settings": { "model": "Vorhersagemodell", "language": "Sprache", "darkMode": "Dunkelmodus", "units": "Einheiten", "restartSetup": "Setup", "restartSetupBtn": "Neu starten" },
            "models": { "clinical": { "name": "Clinical Only", "desc": "Nur Körpermaße & Demografie, kein Bluttest nötig" }, "clinicalGlucose": { "name": "Clinical + Glucose", "desc": "Klinische Werte plus Nüchternglukose" }, "clinicalGlucoseLipids": { "name": "Clinical + Glucose + Lipids", "desc": "Vollständiges Modell mit allen Laborwerten" }, "accuracy": { "basis": "Basis", "gut": "Gut", "beste": "Beste" }, "accuracyLabel": "Vorhersagegüte" },
            "tutorial": { "button": "Tutorial", "close": "Schließen", "next": "Weiter", "prev": "Zurück", "finish": "Fertig", "stepLabel": "Abschnitt {n} von {total}: {title}", "steps": { "nav": { "title": "Navigation", "resetBtn": { "title": "Werte zurücksetzen", "text": "Setzt alle Werte auf die im Profil gespeicherten zurück. Ist kein Profil ausgewählt, werden die Standardwerte verwendet." }, "timelineBtn": { "title": "Risiko Zeitlinie", "text": "Öffnet das Zeitlinien-Panel, um Risikoänderungen über verschiedene Behandlungsszenarien zu verfolgen." }, "patientBtn": { "title": "Patientenprofile", "text": "Gespeicherte Profile verwalten — erstellen, umbenennen, aktualisieren, exportieren und importieren." }, "settingsBtn": { "title": "Einstellungen", "text": "Sprache wechseln, Dunkelmodus aktivieren und zwischen US- und SI-Maßeinheiten umschalten." } }, "hero": { "title": "Risikopunktzahl", "percentage": { "title": "9-Jahres-Risiko", "text": "Risiko, in den nächsten 9 Jahren Diabetes zu entwickeln, basierend auf den eingegebenen Werten." }, "bar": { "title": "Risikoleiste", "text": "Die Leiste zeigt, wo Ihr Risiko auf einem Spektrum liegt. Der Marker bewegt sich sofort, wenn Sie Ihre Risikofaktoren anpassen." }, "expand": { "title": "Was bedeutet das?", "text": "Erklärt, was die Wahrscheinlichkeit bedeutet." } }, "timeline": { "title": "Risiko Zeitlinie", "snapshot": { "title": "Schnappschuss", "text": "Speichert Ihr aktuelles Risiko als Datenpunkt im Diagramm. Schnappschüsse vor und nach Behandlungen helfen beim Vergleich." }, "baseline": { "title": "Basislinie setzen", "text": "Markiert das aktuelle Risiko als Referenzpunkt. Alle nachfolgenden Schnappschüsse werden mit dieser Basislinie verglichen." }, "chart": { "title": "Zeitlinien-Diagramm", "text": "Eine visuelle Verlaufsanzeige Ihrer Schnappschüsse und Behandlungssimulationen." } }, "input": { "title": "Patientendaten", "demographic": { "title": "Patientendaten", "text": "Geben Sie hier Ihre persönlichen Werte ein. Diese werden für die Risikoberechnung verwendet." }, "clinical": { "title": "Klinische Werte", "text": "Veränderbare Risikofaktoren: Nüchternglukose, Taillenumfang, Blutdruck, HDL-Cholesterin und Triglyceride." }, "sliders": { "title": "Schieberegler", "text": "Sie können Ihre Werte anpassen, indem Sie den Schieberegler nach oben oder unten bewegen." }, "units": { "title": "Einheiten-Umschalter", "text": "Zwischen US (mg/dL) und SI (mmol/L) wechseln. Alle Werte werden automatisch umgerechnet." }, "valuebox": { "title": "Werteingabe", "text": "Hier sehen Sie den genauen Wert, der für die Risikoberechnung verwendet wird. Sie können Ihre Werte auch direkt hier eingeben." }, "toggle": { "title": "Toggle", "text": "Ethnizität, elterliche Diabetesgeschichte und Geschlecht können durch Klicken auf den Toggle geändert werden." } }, "model": { "title": "Risikoanalyse", "tabs": { "title": "Analyse-Tabs", "text": "Zwei Ansichten: Beiträge zeigt, wie jeder Faktor Ihr Risiko beeinflusst. Zusammenhänge zeigt biologische Kausalwege." }, "contributions": { "title": "Beitragsdiagramm", "text": "Balken nach rechts erhöhen Ihr Risiko, nach links senken sie es im Vergleich zum Durchschnitt. Die Länge zeigt den Einfluss auf das Gesamtrisiko. Klicken Sie auf den Balken für mehr Details." }, "causality": { "title": "Kausalitätsketten", "text": "Visuelle Diagramme der biologischen Mechanismen hinter Ihren erhöhten Risikofaktoren." } }, "treatment": { "title": "Behandlungsoptionen", "cards": { "title": "Behandlungskarten", "text": "Evidenzbasierte Empfehlungen für Ihre erhöhten Risikofaktoren, sortiert nach ihrem Beitrag zu Ihrem Risiko." }, "simulate": { "title": "Behandlung simulieren", "text": "Klicken Sie auf eine Karte, um zu animieren, wie diese Maßnahme Ihre Werte und das Gesamtrisiko verändern würde." } }, "profiles": { "title": "Profile & Einstellungen", "profiles": { "title": "Profile speichern & laden", "text": "Erstellen Sie ein Profil, um alle Ihre Eingabewerte dauerhaft zu speichern. Mehrere Profile ermöglichen die Verfolgung verschiedener Patienten." }, "export": { "title": "Export & Import", "text": "Profile als verschlüsselte .drc- oder Excel-Datei (.xlsx) exportieren. Früher exportierte Dateien auf jedem Gerät wieder importieren." }, "settings": { "title": "Einstellungen-Panel", "text": "Anzeigesprache wechseln, Hell-/Dunkelmodus umschalten und Maßeinheiten zwischen US und SI ändern." } } } },
            "landing": { "welcome": { "title": "Diabetes Risiko Rechner", "subtitle": "Verstehen Sie Ihr 9-Jahres-Diabetesrisiko basierend auf der ARIC-Studie", "getStarted": "Loslegen" }, "language": { "title": "Sprache wählen", "subtitle": "Wählen Sie Ihre bevorzugte Sprache für die App" }, "model": { "title": "Vorhersagemodell wählen", "subtitle": "Wählen Sie, wie viele Werte Sie für die Risikoberechnung eingeben möchten", "clinical": { "name": "Nur Klinisch", "desc": "Nur Körpermaße & Demografie, kein Bluttest nötig", "accuracy": "Basis" }, "clinicalGlucose": { "name": "Klinisch + Glukose", "desc": "Klinische Werte plus Nüchternglukose", "accuracy": "Gut" }, "complete": { "name": "Vollständiges Modell", "desc": "Alle Laborwerte für beste Vorhersagegenauigkeit", "accuracy": "Beste" } }, "import": { "title": "Daten importieren", "subtitle": "Importieren Sie Ihre Werte aus einer Datei oder geben Sie sie manuell ein", "image": "Bild hochladen", "pdf": "PDF hochladen", "excel": "Excel importieren", "encrypted": "Verschlüsselte Datei", "skip": "Werte manuell eingeben" }, "tutorial": { "title": "Möchten Sie eine Tour?", "subtitle": "Lernen Sie alle Funktionen mit einem interaktiven Tutorial kennen", "yes": "Zeigen Sie mir, wie die App funktioniert", "no": "Tutorial überspringen" }, "ready": { "title": "Alles bereit!", "start": "Rechner starten", "restart": "Von vorne beginnen und Einstellungen ändern" }, "stepCounter": "Schritt {step} von {total}", "back": "Zurück", "next": "Weiter", "restart": "Neu starten" }
        },
        fr: {
            "_meta": { "language": "Français", "code": "fr" },
            "nav": { "brand": "Calculateur de Risque Diabète", "reset": "Réinitialiser", "riskTimeline": "Chronologie du Risque", "selectProfile": "Sélectionner Profil", "language": "Choisir la Langue", "settings": "Paramètres" },
            "hero": { "title": "Risque Diabète 9 Ans", "expandLabel": "Qu'est-ce que cela signifie?", "subtitle": "Basé sur le modèle de régression logistique de l'étude ARIC (Schmidt et al. 2005)" },
            "factors": { "age": "Âge", "sex": "Sexe", "race": "Ethnicité", "parentHist": "Diabète Parental", "sbp": "Pression Artérielle", "waist": "Tour de Taille", "height": "Taille", "fastGlu": "Glycémie à Jeun", "cholHDL": "Cholestérol HDL", "cholTri": "Graisses Sanguines (Triglycérides)" },
            "units": { "years": "ans", "male": "Homme", "female": "Femme", "other": "Autre", "black": "Noir", "yes": "Oui", "no": "Non", "us": "US", "si": "SI" },
            "sections": { "demographic": "Données Patient", "clinical": "Données Cliniques", "treatments": "Recommandations de Traitement", "contributions": "Contributions des Facteurs de Risque" },
            "summary": { "age": "Âge", "glucose": "Glucose", "waist": "Taille", "bp": "Pression artérielle", "hdl": "HDL", "tg": "TG" },
            "treatments": {
                "fastGlu": { "title": "Gestion de la Glycémie à Jeun", "therapy1_name": "Médication Standard", "therapy1_desc": "La metformine est souvent la première étape pour aider à contrôler la glycémie.", "therapy2_name": "Protection Cardiaque & Rénale", "therapy2_desc": "Si vous avez des problèmes cardiaques ou rénaux, demandez à votre médecin des médicaments plus récents qui protègent spécifiquement ces organes (inhibiteurs SGLT2 ou GLP-1) tout en favorisant la perte de poids." },
                "sbp": { "title": "Contrôle de la Pression Artérielle", "therapy1_name": "Médicaments Combinés", "therapy1_desc": "Il est recommandé de commencer avec une combinaison de différents médicaments contre l'hypertension (par exemple inhibiteurs RAS et CCB).", "therapy2_name": "Régime Cardioprotecteur", "therapy2_desc": "La restriction de l'alcool et du sodium, la consommation accrue de légumes et l'utilisation de produits laitiers faibles en gras peuvent abaisser la pression artérielle naturellement." },
                "cholHDL": { "title": "Amélioration du Cholestérol HDL", "therapy1_name": "Exercice Régulier", "therapy1_desc": "Visez 150 minutes par semaine d'activité comme la marche rapide, ou 75 minutes d'exercice intense.", "therapy2_name": "Médication", "therapy2_desc": "Les inhibiteurs de CETP et les médicaments hypocholestérolémiants (statines) peuvent également aider à augmenter le HDL." },
                "cholTri": { "title": "Traitement des Graisses Sanguines (Triglycérides)", "therapy1_name": "Mode de Vie Sain", "therapy1_desc": "Arrêter de fumer et manger des graisses saines (huile d'olive, noix, poisson) aident tous et devraient être faits en premier.", "therapy2_name": "Huile de Poisson sur Ordonnance", "therapy2_desc": "Si les graisses sanguines (triglycérides) restent élevées, une huile de poisson spéciale sur ordonnance (éthyle d'icosapent) pourrait être envisagée.", "therapy3_name": "Médication", "therapy3_desc": "Les fibrates ou les médicaments hypocholestérolémiants (statines) peuvent également aider à réduire les triglycérides." },
                "waist": { "title": "Gestion du Poids", "therapy1_name": "Régime & Exercice", "therapy1_desc": "Réduire les calories quotidiennes et faire plus d'exercice conduit à une perte de poids régulière.", "therapy2_name": "Médicaments", "therapy2_desc": "Les médicaments réduisant le glucose avec des effets supplémentaires de réduction du poids (par exemple GLP-1RA) peuvent également aider.", "surgical": "Options Chirurgicales", "surgical_desc": "Pour une obésité significative avec des problèmes de santé, une chirurgie de perte de poids peut être envisagée." },
                "riskContribution": "contribution au risque par rapport à la moyenne"
            },
            "buttons": { "simulate": "Simuler Traitement", "simulateActive": "Simulation...", "save": "Enregistrer", "cancel": "Annuler", "continue": "Continuer", "createProfile": "Créer Profil", "add": "Ajouter", "export": "Exporter .xlsx / .drc", "import": "Importer .xlsx / .drc", "scan": "Scanner Rapport Labo", "setBaseline": "Définir Base", "resetBaseline": "Réinitialiser Base", "alreadySimulated": "Déjà simulé" },
            "patientManager": { "title": "Mes Profils", "activeProfile": "Profil Actif", "noProfile": "Aucun profil sélectionné", "savedProfiles": "Profils Enregistrés", "addNew": "Ajouter Nouveau Profil", "placeholder": "Nom du profil...", "empty": "Aucun profil enregistré pour l'instant.", "importExport": "Import / Export / OCR" },
            "timeline": { "title": "Chronologie du Risque", "hint": "Simulez des traitements pour suivre les changements de risque au fil du temps", "setBaseline": "Définir Base", "snapshot": "Instantané", "empty": "Définissez une base et ajoutez des instantanés pour suivre votre risque à travers les scénarios.", "baselineLabel": "Base", "treatmentHistory": "Historique des Traitements" },
            "modals": { "profileWarning": { "title": "Enregistrer vos Données?", "message": "Vous n'avez pas encore créé de profil. Si vous continuez, vos données actuelles ne seront pas sauvegardées.", "create": "Créer Profil", "continue": "Continuer Sans Sauvegarder" }, "ocr": { "title": "Scanner Rapport Labo", "instructions": "Prenez une photo ou téléchargez votre rapport de laboratoire", "camera": "Caméra", "upload": "Télécharger Fichier", "review": "Vérifier Résultats", "confidence_high": "Confiance élevée", "confidence_medium": "Confiance moyenne", "confidence_low": "Confiance faible", "processing": "Traitement...", "reviewTitle": "Vérifier Valeurs", "errorTitle": "Erreur de Traitement", "errorMessage": "Impossible de traiter l'image. Veuillez réessayer." } },
            "causality": {
                "abdominalFat": "Graisse Abdominale ↑",
                "insulinResistance": "Résistance à l'Insuline",
                "betaCellDysfunction": "Dysfonctionnement des β-Cellules",
                "diabetesRisk": "Risque de Diabète ↑",
                "gluconeogenesis": "Gluconéogenèse ↑",
                "fastingGlucose": "Glycémie à Jeun ↑",
                "betaCellExhaustion": "Épuisement des Beta-Cellules",
                "hdlCholesterol": "Cholestérol HDL ↓",
                "pancreaticProtection": "Protection Pancréatique ↓",
                "betaCellDamage": "Dommage aux Beta-Cellules",
                "bloodPressure": "Pression Artérielle ↑",
                "insulinResistanceInc": "Résistance à l'Insuline ↑",
                "lipolysis": "Lipolyse ↑",
                "freeFattyAcids": "Acides Gras Libres ↑",
                "triglycerides": "Triglycérides ↑"
            },
            "status": { "indicated": "Indiqué", "elevated": "Élevé", "normal": "Normal" },
            "chart": { "average": "Moyenne", "avgShort": "Moy", "lower": "inférieur", "higher": "supérieur", "yourRisk": "votre risque", "thanAverage": "que la moyenne de", "filterLabel": "Afficher uniquement les facteurs de risque supérieurs à la moyenne", "betterThanAvg": "Mieux que la moyenne", "betterShort": "Mieux", "worseThanAvg": "Pire que la moyenne", "worseShort": "Pire", "clickForInfo": "Cliquer pour info", "verb": { "increasing": "Augmenter", "lowering": "Réduire" }, "info": { "binaryIncrease": "Votre {factor} augmente votre risque global de diabète de {pct}. Consultez la section de traitement à droite.", "binaryDecrease": "Votre {factor} réduit votre risque global de diabète de {pct} par rapport à une personne moyenne.", "aboveIncrease": "Votre {factor} est supérieur à la moyenne et augmente votre risque global de diabète de {pct} par rapport à une valeur moyenne. {verb} aiderait à réduire votre risque global. Consultez la section de traitement à droite.", "belowIncrease": "Votre {factor} est inférieur à la moyenne et augmente votre risque global de diabète de {pct} par rapport à une valeur moyenne. {verb} aiderait à réduire votre risque global. Consultez la section de traitement à droite.", "aboveDecrease": "Votre {factor} est supérieur à la moyenne et réduit votre risque global de diabète de {pct} par rapport à une valeur moyenne.", "belowDecrease": "Votre {factor} est inférieur à la moyenne et réduit votre risque global de diabète de {pct} par rapport à une valeur moyenne." } },
            "scenario": { "baseline": "Base", "current": "Actuel" },
            "iconArray": { "label": "${affected} personnes sur 100 avec votre profil peuvent développer du diabète dans les 9 ans" },
            "panels": { "riskAnalysis": "Analyse de Risque", "riskFactors": "Facteurs de Risque", "riskFactorsSubtitle": "Quels facteurs influencent le risque et dans quelle mesure par rapport à la moyenne", "contributions": "Contributions", "connections": "Connexions", "connectionsTitle": "Comment Vos Facteurs de Risque Sont Liés", "connectionsDesc": "Le diabète de type 2 est caractérisé par une résistance à l'insuline et une déficience en insuline, entre autres causées par une dysfonction des cellules bêta. Les facteurs de risque peuvent être la cause ou la conséquence de cela.", "takeAction": "Agir", "whatCanIDo": "Que puis-je faire?", "takeActionSubtitle": "Étapes fondées sur des preuves pour réduire votre risque" },
            "modals": { "profileWarning": { "title": "Enregistrer vos Données?", "message1": "Vous n'avez pas encore créé de profil.", "message2": "Créez un profil pour sauvegarder vos données et suivre vos progrès. Sans profil, vos données peuvent être perdues à la fermeture du navigateur.", "create": "Créer Profil", "continue": "Continuer Sans Sauvegarder", "cancel": "Annuler" }, "ocr": { "title": "Scanner Rapport Labo", "instructions": "Prenez une photo ou téléchargez votre rapport de laboratoire", "camera": "Caméra", "upload": "Télécharger Fichier", "review": "Vérifier Résultats", "confidence_high": "Confiance élevée", "confidence_medium": "Confiance moyenne", "confidence_low": "Confiance faible", "processing": "Traitement...", "reviewTitle": "Vérifier Valeurs", "errorTitle": "Erreur de Traitement", "errorMessage": "Impossible de traiter l'image. Veuillez réessayer." } },
            "buttons": { "simulate": "Simuler Traitement", "simulateActive": "Simulation...", "save": "Enregistrer", "cancel": "Annuler", "continue": "Continuer", "createProfile": "Créer Profil", "add": "Ajouter", "addAndSave": "Ajouter & Enregistrer les Valeurs Actuelles", "export": "Exporter .xlsx / .drc", "import": "Importer .xlsx / .drc", "scan": "Scanner Rapport Labo", "setBaseline": "Définir Base", "resetBaseline": "Réinitialiser Base", "alreadySimulated": "Déjà simulé" },
            "patientManager": { "title": "Mes Profils", "activeProfile": "Profil Actif", "noProfile": "Aucun profil sélectionné", "savedProfiles": "Profils Enregistrés", "addNew": "Ajouter Nouveau Profil", "placeholder": "Nom du profil...", "empty": "Aucun profil enregistré pour l'instant.", "importExport": "Import / Export / OCR", "selectProfile": "Sélectionner Profil", "riskLabel": "Risque", "unknownDate": "Inconnu", "exportProfile": "Exporter ce profil en Excel", "renameProfile": "Renommer le profil", "updateProfile": "Mettre à jour avec les valeurs actuelles", "deleteProfile": "Supprimer le profil", "renamePrompt": "Renommer \"{name}\" en:", "deleteConfirm": "Supprimer le profil \"{name}\"?" },
            "settings": { "model": "Modèle de Prédiction", "language": "Langue", "darkMode": "Mode Sombre", "units": "Unités", "restartSetup": "Configuration", "restartSetupBtn": "Recommencer" },
            "models": { "clinical": { "name": "Clinical Only", "desc": "Mesures corporelles & démographie uniquement, pas de prise de sang requise" }, "clinicalGlucose": { "name": "Clinical + Glucose", "desc": "Valeurs cliniques plus glycémie à jeun" }, "clinicalGlucoseLipids": { "name": "Clinical + Glucose + Lipides", "desc": "Modèle complet avec toutes les valeurs de laboratoire" }, "accuracy": { "basis": "Base", "gut": "Bon", "beste": "Meilleur" }, "accuracyLabel": "Qualité de prédiction" },
            "tutorial": { "button": "Tutoriel", "close": "Fermer", "next": "Suivant", "prev": "Retour", "finish": "Terminer", "stepLabel": "Section {n} sur {total}: {title}", "steps": { "nav": { "title": "Navigation", "resetBtn": { "title": "Réinitialiser", "text": "Réinitialise toutes les valeurs à celles enregistrées dans le profil. Si aucun profil n'est sélectionné, les valeurs par défaut sont utilisées." }, "timelineBtn": { "title": "Chronologie du Risque", "text": "Ouvre le panneau de chronologie pour suivre l'évolution du risque sur différents scénarios de traitement." }, "patientBtn": { "title": "Profils Patients", "text": "Gérer les profils sauvegardés — créer, renommer, mettre à jour, exporter et importer des profils." }, "settingsBtn": { "title": "Paramètres", "text": "Changer la langue, activer le mode sombre et basculer entre les unités US et SI." } }, "hero": { "title": "Score de Risque", "percentage": { "title": "Risque sur 9 Ans", "text": "Risque de développer le diabète dans les 9 prochaines années, basé sur les valeurs saisies." }, "bar": { "title": "Barre de Risque", "text": "La barre montre où se situe votre risque sur un spectre. Le marqueur se déplace instantanément." }, "expand": { "title": "Qu'est-ce que cela signifie?", "text": "Explique ce que signifie la probabilité." } }, "timeline": { "title": "Chronologie du Risque", "snapshot": { "title": "Instantané", "text": "Sauvegarde votre risque actuel comme point de données sur le graphique." }, "baseline": { "title": "Définir la Base", "text": "Marque le risque actuel comme référence. Tous les instantanés suivants sont comparés à cette base." }, "chart": { "title": "Graphique de Chronologie", "text": "Un historique visuel de vos instantanés et simulations de traitement." } }, "input": { "title": "Données Patient", "demographic": { "title": "Données Patient", "text": "Entrez vos valeurs personnelles ici. Elles seront utilisées pour calculer votre risque." }, "clinical": { "title": "Valeurs Cliniques", "text": "Facteurs de risque modifiables: glycémie à jeun, tour de taille, pression artérielle, HDL et triglycérides." }, "sliders": { "title": "Curseur", "text": "Vous pouvez ajuster vos valeurs en déplaçant le curseur vers le haut ou le bas." }, "units": { "title": "Bascule d'Unités", "text": "Basculer entre les unités US (mg/dL) et SI (mmol/L). Toutes les valeurs se convertissent automatiquement." }, "valuebox": { "title": "Saisie de valeur", "text": "Vous voyez ici la valeur exacte utilisée pour le calcul du risque. Vous pouvez également ajuster vos valeurs en les saisissant directement." }, "toggle": { "title": "Interrupteur", "text": "L'ethnicité, les antécédents parentaux et le sexe peuvent être modifiés en cliquant sur l'interrupteur." } }, "model": { "title": "Analyse du Risque", "tabs": { "title": "Onglets d'Analyse", "text": "Deux vues: Contributions montre comment chaque facteur affecte votre risque. Connexions montre les voies causales biologiques." }, "contributions": { "title": "Graphique de Contributions", "text": "Les barres vers la droite augmentent votre risque, les barres vers la gauche le diminuent par rapport à une valeur moyenne. La longueur indique l'influence sur le risque global. Cliquez sur la barre pour en savoir plus." }, "causality": { "title": "Chaînes de Causalité", "text": "Diagrammes visuels des mécanismes biologiques derrière vos facteurs de risque élevés." } }, "treatment": { "title": "Options de Traitement", "cards": { "title": "Cartes de Traitement", "text": "Recommandations basées sur des preuves pour vos facteurs de risque élevés, triées par contribution." }, "simulate": { "title": "Simuler le Traitement", "text": "Cliquez sur une carte pour animer comment cette intervention changerait vos valeurs et votre risque global." } }, "profiles": { "title": "Profils & Paramètres", "profiles": { "title": "Sauvegarder & Charger", "text": "Créez un profil pour sauvegarder toutes vos valeurs. Gérez plusieurs profils pour différents patients." }, "export": { "title": "Export & Import", "text": "Exporter les profils en .drc crypté ou Excel (.xlsx). Importer des fichiers précédemment exportés." }, "settings": { "title": "Panneau de Paramètres", "text": "Changer la langue, basculer entre modes clair/sombre et changer les unités de mesure." } } } },
            "landing": { "welcome": { "title": "Calculateur de Risque Diabète", "subtitle": "Comprenez votre risque de diabète sur 9 ans basé sur l'étude ARIC", "getStarted": "Commencer" }, "language": { "title": "Choisissez Votre Langue", "subtitle": "Sélectionnez votre langue préférée pour l'interface de l'application" }, "model": { "title": "Choisissez le Modèle de Prédiction", "subtitle": "Sélectionnez le nombre de valeurs que vous souhaitez saisir pour votre calcul de risque", "clinical": { "name": "Clinical Seulement", "desc": "Mesures corporelles et démographie uniquement, pas de prise de sang requise", "accuracy": "Base" }, "clinicalGlucose": { "name": "Clinical + Glucose", "desc": "Valeurs cliniques plus glycémie à jeun", "accuracy": "Bon" }, "complete": { "name": "Modèle Complet", "desc": "Toutes les valeurs de laboratoire pour la meilleure précision de prédiction", "accuracy": "Meilleur" } }, "import": { "title": "Importez Vos Données", "subtitle": "Importez rapidement vos valeurs à partir d'un fichier, ou sautez et entrez manuellement", "image": "Télécharger Image", "pdf": "Télécharger PDF", "excel": "Importer Excel", "encrypted": "Fichier Crypté", "skip": "Saisir les valeurs manuellement" }, "tutorial": { "title": "Souhaitez-vous une visite guidée?", "subtitle": "Apprenez à utiliser toutes les fonctionnalités avec un tutoriel interactif rapide", "yes": "Montrez-moi comment utiliser cette application", "no": "Passer le tutoriel" }, "ready": { "title": "Tout est prêt!", "start": "Démarrer la Calculatrice", "restart": "Recommencer et modifier les paramètres", "showAgain": "Afficher cette configuration la prochaine fois" }, "stepCounter": "Étape {step} sur {total}", "back": "Retour", "next": "Suivant", "restart": "Recommencer" }
        },
        es: {
            "_meta": { "language": "Español", "code": "es" },
            "nav": { "brand": "Calculadora de Riesgo Diabetes", "reset": "Restablecer", "riskTimeline": "Línea Temporal de Riesgo", "selectProfile": "Seleccionar Perfil", "language": "Seleccionar Idioma", "settings": "Ajustes" },
            "hero": { "title": "Riesgo Diabetes 9 Años", "expandLabel": "¿Qué significa eso?", "subtitle": "Basado en el modelo de regresión logística del Estudio ARIC (Schmidt et al. 2005)" },
            "factors": { "age": "Edad", "sex": "Sexo", "race": "Etnicidad", "parentHist": "Diabetes Parental", "sbp": "Presión Arterial", "waist": "Cintura", "height": "Altura", "fastGlu": "Glucosa en Ayunas", "cholHDL": "Colesterol HDL", "cholTri": "Grasas Sanguíneas (Triglicéridos)" },
            "units": { "years": "años", "male": "Hombre", "female": "Mujer", "other": "Otro", "black": "Negro", "yes": "Sí", "no": "No", "us": "US", "si": "SI" },
            "sections": { "demographic": "Datos del Paciente", "clinical": "Datos Clínicos", "treatments": "Recomendaciones de Tratamiento", "contributions": "Contribuciones de Factores de Riesgo" },
            "summary": { "age": "Edad", "glucose": "Glucosa", "waist": "Cintura", "bp": "Presión arterial", "hdl": "HDL", "tg": "TG" },
            "treatments": {
                "fastGlu": { "title": "Manejo de Glucosa en Ayunas", "therapy1_name": "Medicación Estándar", "therapy1_desc": "La metformina es a menudo el primer paso para ayudar a controlar los niveles de azúcar en sangre.", "therapy2_name": "Protección Cardíaca y Renal", "therapy2_desc": "Si tiene problemas cardíacos o renales, pregúntele a su médico sobre medicamentos más nuevos que protegen específicamente estos órganos (inhibidores SGLT2 o GLP-1) mientras también apoyan la pérdida de peso." },
                "sbp": { "title": "Control de Presión Arterial", "therapy1_name": "Medicamentos Combinados", "therapy1_desc": "Se recomienda comenzar con una combinación de diferentes medicamentos para la presión arterial (por ejemplo, inhibidores RAS y CCB).", "therapy2_name": "Dieta Cardiosaludable", "therapy2_desc": "La restricción del alcohol y del consumo de sodio, el aumento del consumo de verduras y el uso de productos lácteos bajos en grasa pueden reducir la presión arterial naturalmente." },
                "cholHDL": { "title": "Mejora del Colesterol HDL", "therapy1_name": "Ejercicio Regular", "therapy1_desc": "Apunte a 150 minutos por semana de actividad como caminar rápido, o 75 minutos de ejercicio intenso.", "therapy2_name": "Medicación", "therapy2_desc": "Los inhibidores de CETP y los medicamentos reductores de colesterol (estatinas) también pueden ayudar a aumentar el HDL." },
                "cholTri": { "title": "Tratamiento de Grasas Sanguíneas (Triglicéridos)", "therapy1_name": "Estilo de Vida Saludable", "therapy1_desc": "Dejar de fumar y comer grasas saludables (aceite de oliva, nueces, pescado) ayuda y debería hacerse primero.", "therapy2_name": "Aceite de Pescado Recetado", "therapy2_desc": "Si las grasas sanguíneas (triglicéridos) permanecen altas, podría considerarse un aceite de pescado especial recetado (etilo de icosapent).", "therapy3_name": "Medicación", "therapy3_desc": "Los fibratos o los medicamentos reductores de colesterol (estatinas) también pueden ayudar a reducir los triglicéridos." },
                "waist": { "title": "Manejo del Peso", "therapy1_name": "Dieta y Ejercicio", "therapy1_desc": "Reducir las calorías diarias y hacer más ejercicio lleva a una pérdida de peso constante.", "therapy2_name": "Medicamentos", "therapy2_desc": "Los medicamentos reductores de glucosa con efectos adicionales de reducción de peso (por ejemplo GLP-1RA) también pueden ayudar.", "surgical": "Opciones Quirúrgicas", "surgical_desc": "Para obesidad significativa con problemas de salud, puede discutirse la cirugía de pérdida de peso." },
                "riskContribution": "contribución al riesgo comparado con el promedio"
            },
            "buttons": { "simulate": "Simular Tratamiento", "simulateActive": "Simulando...", "save": "Guardar", "cancel": "Cancelar", "continue": "Continuar", "createProfile": "Crear Perfil", "add": "Agregar", "export": "Exportar .xlsx / .drc", "import": "Importar .xlsx / .drc", "scan": "Escanear Informe Lab", "setBaseline": "Establecer Base", "resetBaseline": "Restablecer Base", "alreadySimulated": "Ya simulado" },
            "patientManager": { "title": "Mis Perfiles", "activeProfile": "Perfil Activo", "noProfile": "Ningún perfil seleccionado", "savedProfiles": "Perfiles Guardados", "addNew": "Agregar Nuevo Perfil", "placeholder": "Nombre del perfil...", "empty": "Aún no hay perfiles guardados.", "importExport": "Importar / Exportar / OCR" },
            "timeline": { "title": "Línea Temporal de Riesgo", "hint": "Simule tratamientos para rastrear cambios de riesgo a lo largo del tiempo", "setBaseline": "Establecer Base", "snapshot": "Instantánea", "empty": "Establezca una base y agregue instantáneas para rastrear su riesgo a través de escenarios.", "baselineLabel": "Base", "treatmentHistory": "Historial de Tratamientos" },
            "modals": { "profileWarning": { "title": "¿Guardar sus Datos?", "message": "Aún no ha creado un perfil. Si continúa, sus datos actuales no se guardarán.", "create": "Crear Perfil", "continue": "Continuar Sin Guardar" }, "ocr": { "title": "Escanear Informe Lab", "instructions": "Tome una foto o suba su informe de laboratorio", "camera": "Cámara", "upload": "Subir Archivo", "review": "Revisar Resultados", "confidence_high": "Alta confianza", "confidence_medium": "Confianza media", "confidence_low": "Baja confianza", "processing": "Procesando...", "reviewTitle": "Revisar Valores", "errorTitle": "Error de Procesamiento", "errorMessage": "No se pudo procesar la imagen. Inténtelo de nuevo." } },
            "causality": {
                "abdominalFat": "Grasa Abdominal ↑",
                "insulinResistance": "Resistencia a la Insulina",
                "betaCellDysfunction": "Disfunción de β-Células",
                "diabetesRisk": "Riesgo de Diabetes ↑",
                "gluconeogenesis": "Gluconeogénesis ↑",
                "fastingGlucose": "Glucosa en Ayunas ↑",
                "betaCellExhaustion": "Agotamiento de Beta-Células",
                "hdlCholesterol": "Colesterol HDL ↓",
                "pancreaticProtection": "Protección Pancreática ↓",
                "betaCellDamage": "Daño a Beta-Células",
                "bloodPressure": "Presión Arterial ↑",
                "insulinResistanceInc": "Resistencia a la Insulina ↑",
                "lipolysis": "Lipólisis ↑",
                "freeFattyAcids": "Ácidos Grasos Libres ↑",
                "triglycerides": "Triglicéridos ↑"
            },
            "status": { "indicated": "Indicado", "elevated": "Elevado", "normal": "Normal" },
            "chart": { "average": "Promedio", "avgShort": "Prom", "lower": "inferior", "higher": "superior", "yourRisk": "su riesgo", "thanAverage": "que el promedio de", "filterLabel": "Mostrar solo factores de riesgo por encima del promedio", "betterThanAvg": "Mejor que el promedio", "betterShort": "Mejor", "worseThanAvg": "Peor que el promedio", "worseShort": "Peor", "clickForInfo": "Hacer clic para info", "verb": { "increasing": "Aumentar", "lowering": "Reducir" }, "info": { "binaryIncrease": "Su {factor} aumenta su riesgo general de diabetes en {pct}. Consulte la sección de tratamiento a la derecha.", "binaryDecrease": "Su {factor} reduce su riesgo general de diabetes en {pct} en comparación con una persona promedio.", "aboveIncrease": "Su {factor} está por encima del promedio y aumenta su riesgo general de diabetes en {pct} en comparación con un valor promedio. {verb} ayudaría a reducir su riesgo general. Consulte la sección de tratamiento a la derecha.", "belowIncrease": "Su {factor} está por debajo del promedio y aumenta su riesgo general de diabetes en {pct} en comparación con un valor promedio. {verb} ayudaría a reducir su riesgo general. Consulte la sección de tratamiento a la derecha.", "aboveDecrease": "Su {factor} está por encima del promedio y reduce su riesgo general de diabetes en {pct} en comparación con un valor promedio.", "belowDecrease": "Su {factor} está por debajo del promedio y reduce su riesgo general de diabetes en {pct} en comparación con un valor promedio." } },
            "scenario": { "baseline": "Base", "current": "Actual" },
            "iconArray": { "label": "${affected} de cada 100 personas con su perfil pueden desarrollar diabetes en 9 años" },
            "panels": { "riskAnalysis": "Análisis de Riesgo", "riskFactors": "Factores de Riesgo", "riskFactorsSubtitle": "Qué factores influyen en el riesgo y en qué medida en comparación con el promedio", "contributions": "Contribuciones", "connections": "Conexiones", "connectionsTitle": "Cómo se Relacionan Sus Factores de Riesgo", "connectionsDesc": "La diabetes tipo 2 se caracteriza por resistencia a la insulina e insuficiencia de insulina, entre otras causadas por disfunción de las células beta. Los factores de riesgo pueden ser la causa o estar causados por esto.", "takeAction": "Actuar", "whatCanIDo": "¿Qué puedo hacer?", "takeActionSubtitle": "Pasos basados en evidencia para reducir su riesgo" },
            "modals": { "profileWarning": { "title": "¿Guardar sus Datos?", "message1": "Aún no ha creado un perfil.", "message2": "Cree un perfil para guardar sus datos y seguir su progreso. Sin un perfil, sus datos pueden perderse al cerrar el navegador.", "create": "Crear Perfil", "continue": "Continuar Sin Guardar", "cancel": "Cancelar" }, "ocr": { "title": "Escanear Informe Lab", "instructions": "Tome una foto o suba su informe de laboratorio", "camera": "Cámara", "upload": "Subir Archivo", "review": "Revisar Resultados", "confidence_high": "Alta confianza", "confidence_medium": "Confianza media", "confidence_low": "Baja confianza", "processing": "Procesando...", "reviewTitle": "Revisar Valores", "errorTitle": "Error de Procesamiento", "errorMessage": "No se pudo procesar la imagen. Inténtelo de nuevo." } },
            "buttons": { "simulate": "Simular Tratamiento", "simulateActive": "Simulando...", "save": "Guardar", "cancel": "Cancelar", "continue": "Continuar", "createProfile": "Crear Perfil", "add": "Agregar", "addAndSave": "Agregar y Guardar Valores Actuales", "export": "Exportar .xlsx / .drc", "import": "Importar .xlsx / .drc", "scan": "Escanear Informe Lab", "setBaseline": "Establecer Base", "resetBaseline": "Restablecer Base", "alreadySimulated": "Ya simulado" },
            "patientManager": { "title": "Mis Perfiles", "activeProfile": "Perfil Activo", "noProfile": "Ningún perfil seleccionado", "savedProfiles": "Perfiles Guardados", "addNew": "Agregar Nuevo Perfil", "placeholder": "Nombre del perfil...", "empty": "Aún no hay perfiles guardados.", "importExport": "Importar / Exportar / OCR", "selectProfile": "Seleccionar Perfil", "riskLabel": "Riesgo", "unknownDate": "Desconocido", "exportProfile": "Exportar este perfil a Excel", "renameProfile": "Renombrar perfil", "updateProfile": "Actualizar con valores actuales", "deleteProfile": "Eliminar perfil", "renamePrompt": "Renombrar \"{name}\" a:", "deleteConfirm": "¿Eliminar perfil \"{name}\"?" },
            "settings": { "model": "Modelo de Predicción", "language": "Idioma", "darkMode": "Modo Oscuro", "units": "Unidades", "restartSetup": "Configuración", "restartSetupBtn": "Reiniciar" },
            "models": { "clinical": { "name": "Clinical Only", "desc": "Solo medidas corporales y demografía, no se requiere análisis de sangre" }, "clinicalGlucose": { "name": "Clinical + Glucose", "desc": "Valores clínicos más glucosa en ayunas" }, "clinicalGlucoseLipids": { "name": "Clinical + Glucose + Lipids", "desc": "Modelo completo con todos los valores de laboratorio" }, "accuracy": { "basis": "Básico", "gut": "Bueno", "beste": "Mejor" }, "accuracyLabel": "Calidad de predicción" },
            "tutorial": { "button": "Tutorial", "close": "Cerrar", "next": "Siguiente", "prev": "Atrás", "finish": "Finalizar", "stepLabel": "Sección {n} de {total}: {title}", "steps": { "nav": { "title": "Navegación", "resetBtn": { "title": "Restablecer Valores", "text": "Restablece todos los valores a los guardados en el perfil. Si no hay perfil seleccionado, se usan los valores predeterminados." }, "timelineBtn": { "title": "Línea Temporal de Riesgo", "text": "Abre el panel de línea temporal para seguir cómo cambia su riesgo a lo largo de diferentes escenarios de tratamiento." }, "patientBtn": { "title": "Perfiles de Paciente", "text": "Administre perfiles guardados: crear, renombrar, actualizar, exportar e importar perfiles." }, "settingsBtn": { "title": "Configuración", "text": "Cambie el idioma, active el modo oscuro y alterne entre unidades de medida US y SI." } }, "hero": { "title": "Puntuación de Riesgo", "percentage": { "title": "Riesgo a 9 Años", "text": "Riesgo de desarrollar diabetes en los próximos 9 años basado en los valores ingresados." }, "bar": { "title": "Barra de Riesgo", "text": "La barra muestra dónde se sitúa su riesgo en un espectro. El marcador se mueve instantáneamente al ajustar sus factores de riesgo." }, "expand": { "title": "¿Qué Significa Eso?", "text": "Explica qué significa la probabilidad calculada." } }, "timeline": { "title": "Línea Temporal de Riesgo", "snapshot": { "title": "Instantánea", "text": "Guarda su riesgo actual como punto de datos en el gráfico. Tome instantáneas antes y después de los tratamientos para comparar resultados." }, "baseline": { "title": "Establecer Línea Base", "text": "Marca el riesgo actual como punto de referencia. Todas las instantáneas siguientes se comparan con esta línea base." }, "chart": { "title": "Gráfico de Línea Temporal", "text": "Un historial visual de sus instantáneas y simulaciones de tratamiento." } }, "input": { "title": "Datos del Paciente", "demographic": { "title": "Datos del Paciente", "text": "Ingrese aquí sus valores personales. Estos se usarán para calcular su riesgo." }, "clinical": { "title": "Valores Clínicos", "text": "Factores de riesgo modificables: glucosa en ayunas, cintura, presión arterial, colesterol HDL y triglicéridos. Ajústelos para ver cómo afectan su riesgo." }, "sliders": { "title": "Control Deslizante", "text": "Puede ajustar sus valores moviendo el control deslizante hacia arriba o hacia abajo." }, "units": { "title": "Cambio de Unidades", "text": "Alterne entre unidades US (mg/dL) y SI (mmol/L). Todos los valores se convierten automáticamente." }, "valuebox": { "title": "Cuadro de Valor", "text": "Aquí puede ver el valor exacto utilizado para el cálculo del riesgo. También puede ajustar sus valores ingresándolos directamente aquí." }, "toggle": { "title": "Interruptor", "text": "La etnia, los antecedentes familiares y el sexo se pueden cambiar haciendo clic en el interruptor." } }, "model": { "title": "Análisis de Riesgo", "tabs": { "title": "Pestañas de Análisis", "text": "Dos vistas: Contribuciones muestra cómo cada factor aumenta o reduce su riesgo. Conexiones muestra las vías causales biológicas." }, "contributions": { "title": "Gráfico de Contribuciones", "text": "Las barras hacia la derecha aumentan su riesgo, las barras hacia la izquierda lo reducen en comparación con un valor promedio. La longitud indica la fuerza de influencia sobre el riesgo total. Haga clic en la barra para más información." }, "causality": { "title": "Cadenas de Causalidad", "text": "Diagramas visuales de los mecanismos biológicos detrás de sus factores de riesgo elevados, por ejemplo, cómo la grasa abdominal lleva a la resistencia a la insulina." } }, "treatment": { "title": "Opciones de Tratamiento", "cards": { "title": "Tarjetas de Tratamiento", "text": "Recomendaciones basadas en evidencia para sus factores de riesgo elevados, ordenadas por su contribución al riesgo." }, "simulate": { "title": "Simular Tratamiento", "text": "Haga clic en cualquier tarjeta para animar cómo esa intervención cambiaría sus valores y el riesgo general." } }, "profiles": { "title": "Perfiles y Configuración", "profiles": { "title": "Guardar y Cargar Perfiles", "text": "Cree un perfil para guardar de forma persistente todos sus valores. Administre varios perfiles para seguir diferentes pacientes o el progreso a lo largo del tiempo." }, "export": { "title": "Exportar e Importar", "text": "Exporte perfiles a .drc cifrado o Excel (.xlsx). Importe archivos exportados anteriormente para restaurar datos en cualquier dispositivo." }, "settings": { "title": "Panel de Configuración", "text": "Cambie el idioma (inglés/alemán/francés/español), alterne entre modo claro y oscuro, y cambie las unidades de medida entre US y SI." } } } },
            "landing": { "welcome": { "title": "Calculadora de Riesgo Diabetes", "subtitle": "Comprenda su riesgo de diabetes a 9 años basado en el Estudio ARIC", "getStarted": "Comenzar" }, "language": { "title": "Elija Su Idioma", "subtitle": "Seleccione su idioma preferido para la interfaz de la aplicación" }, "model": { "title": "Elija el Modelo de Predicción", "subtitle": "Seleccione cuántos valores desea ingresar para su cálculo de riesgo", "clinical": { "name": "Clinical Solo", "desc": "Solo medidas corporales y demografía, no se requiere análisis de sangre", "accuracy": "Básico" }, "clinicalGlucose": { "name": "Clinical + Glucosa", "desc": "Valores clínicos más glucosa en ayunas", "accuracy": "Bueno" }, "complete": { "name": "Modelo Completo", "desc": "Todos los valores de laboratorio para la mejor precisión de predicción", "accuracy": "Mejor" } }, "import": { "title": "Importe Sus Datos", "subtitle": "Importe rápidamente sus valores desde un archivo, o omita e ingrese manualmente", "image": "Subir Imagen", "pdf": "Subir PDF", "excel": "Importar Excel", "encrypted": "Archivo Cifrado", "skip": "Ingresar valores manualmente" }, "tutorial": { "title": "¿Le gustaría un recorrido?", "subtitle": "Aprenda a usar todas las funciones con un tutorial interactivo rápido", "yes": "Muéstreme cómo usar esta aplicación", "no": "Omitir tutorial" }, "ready": { "title": "¡Todo listo!", "start": "Iniciar Calculadora", "restart": "Recomenzar y cambiar configuración", "showAgain": "Mostrar esta configuración la próxima vez" }, "stepCounter": "Paso {step} de {total}", "back": "Atrás", "next": "Siguiente", "restart": "Recomenzar" }
        }
    };

    // ─── Configuration ─────────────────────────────────────────────────
    const STORAGE_KEY = 'drc-language';
    const DEFAULT_LANG = 'en';
    const AVAILABLE_LANGS = ['en', 'de', 'fr', 'es'];

    // ─── State ───────────────────────────────────────────────────────────
    let _currentLang = DEFAULT_LANG;
    let _translations = TRANSLATIONS[DEFAULT_LANG];
    let _listeners = new Set();
    let _isReady = false;

    // ─── Private Methods ─────────────────────────────────────────────────

    /**
     * Get stored language preference from localStorage
     * @returns {string} Language code or default
     */
    const _getStoredLanguage = () => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored && AVAILABLE_LANGS.includes(stored)) {
                return stored;
            }
        } catch (e) {
            console.warn('i18n: localStorage not available');
        }
        return DEFAULT_LANG;
    };

    /**
     * Save language preference to localStorage
     * @param {string} lang - Language code
     */
    const _storeLanguage = (lang) => {
        try {
            localStorage.setItem(STORAGE_KEY, lang);
        } catch (e) {
            console.warn('i18n: Could not save language preference');
        }
    };

    /**
     * Get nested value from translation object using dot notation
     * @param {Object} obj - Translation object
     * @param {string} key - Dot-notation key (e.g., "nav.brand")
     * @returns {string|null} Translated value or null
     */
    const _getNestedValue = (obj, key) => {
        const keys = key.split('.');
        let value = obj;
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return null;
            }
        }
        return typeof value === 'string' ? value : null;
    };

    /**
     * Notify all listeners of language change
     */
    const _notifyListeners = () => {
        _listeners.forEach(callback => {
            try {
                callback(_currentLang);
            } catch (e) {
                console.error('i18n: Error in language change listener:', e);
            }
        });
    };

    // ─── Public API ─────────────────────────────────────────────────────

    /**
     * Initialize the i18n service
     * Loads the stored or default language synchronously
     * @returns {void}
     */
    const init = () => {
        const lang = _getStoredLanguage();
        _currentLang = lang;
        _translations = TRANSLATIONS[lang] || TRANSLATIONS[DEFAULT_LANG];
        _isReady = true;
        document.documentElement.lang = lang;
        console.log(`i18n: Initialized with language '${lang}'`);
    };

    /**
     * Get the current language code
     * @returns {string} Current language code
     */
    const getCurrentLang = () => _currentLang;

    /**
     * Get list of available languages
     * @returns {string[]} Array of language codes
     */
    const getAvailableLangs = () => [...AVAILABLE_LANGS];

    /**
     * Check if a language code is valid
     * @param {string} lang - Language code to check
     * @returns {boolean} True if valid
     */
    const isValidLang = (lang) => AVAILABLE_LANGS.includes(lang);

    /**
     * Set the current language
     * @param {string} lang - Language code
     * @returns {boolean} True if successful
     */
    const setLanguage = (lang) => {
        if (!isValidLang(lang)) {
            console.error(`i18n: Invalid language code '${lang}'`);
            return false;
        }
        if (lang === _currentLang) {
            return true;
        }
        const newTranslations = TRANSLATIONS[lang];
        if (!newTranslations) {
            console.error(`i18n: No translations found for '${lang}'`);
            return false;
        }
        _currentLang = lang;
        _translations = newTranslations;
        _storeLanguage(lang);
        document.documentElement.lang = lang;
        _notifyListeners();
        console.log(`i18n: Language changed to '${lang}'`);
        return true;
    };

    /**
     * Translate a key to the current language
     * @param {string} key - Dot-notation key (e.g., "nav.brand")
     * @param {string} [fallback] - Fallback text if translation not found
     * @returns {string} Translated text or fallback or key
     */
    const t = (key, fallback) => {
        const value = _getNestedValue(_translations, key);
        if (value) return value;
        if (fallback) return fallback;
        return key;
    };

    /**
     * Translate all DOM elements with data-i18n attribute
     * Preserves child elements (icons, etc.) by only updating text nodes
     */
    const translateDOM = () => {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translated = t(key);
            if (translated !== key) {
                if (el.children.length === 0) {
                    el.textContent = translated;
                } else {
                    let textNodeFound = false;
                    for (const node of el.childNodes) {
                        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                            node.textContent = translated;
                            textNodeFound = true;
                            break;
                        }
                    }
                    if (!textNodeFound) {
                        el.insertBefore(document.createTextNode(translated), el.firstChild);
                    }
                }
            }
        });
    };

    /**
     * Subscribe to language change events
     * @param {Function} callback - Called with new language code
     * @returns {Function} Unsubscribe function
     */
    const onLanguageChange = (callback) => {
        _listeners.add(callback);
        return () => _listeners.delete(callback);
    };

    /**
     * Check if i18n service is ready
     * @returns {boolean} True if initialized
     */
    const isReady = () => _isReady;

    /**
     * Get flag emoji for a language
     * @param {string} lang - Language code
     * @returns {string} Flag emoji
     */
    const getFlag = (lang) => {
        const flags = { en: '🇺🇸', de: '🇩🇪', fr: '🇫🇷', es: '🇪🇸' };
        return flags[lang] || '🌐';
    };

    /**
     * Get display name for a language
     * @param {string} lang - Language code
     * @returns {string} Language name in its own language
     */
    const getLanguageName = (lang) => {
        const names = { en: 'English', de: 'Deutsch', fr: 'Français', es: 'Español' };
        return names[lang] || lang;
    };

    // ─── Public API ─────────────────────────────────────────────────────
    return {
        init,
        getCurrentLang,
        getAvailableLangs,
        isValidLang,
        setLanguage,
        t,
        translateDOM,
        onLanguageChange,
        isReady,
        getFlag,
        getLanguageName
    };
})();
