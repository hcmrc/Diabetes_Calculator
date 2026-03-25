# i18n (Internationalization) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement persistent multi-language support (DE, EN, FR, ES) with a language selector button in the top navigation that translates the entire interface.

**Architecture:** JSON-based translation files with a central I18n service under `window.DRC.I18n`. DOM elements marked with `data-i18n` attributes for automatic translation. Language preference stored in localStorage.

**Tech Stack:** Vanilla JavaScript (no bundler), localStorage, fetch API for lazy-loading translations.

---

## File Structure Overview

### New Files (Create)
| File | Purpose |
|------|---------|
| `js/i18n/translations/en.json` | English translations (source of truth) |
| `js/i18n/translations/de.json` | German translations |
| `js/i18n/translations/fr.json` | French translations |
| `js/i18n/translations/es.json` | Spanish translations |
| `js/i18n/i18n-service.js` | Core translation service |
| `js/i18n/i18n-ui.js` | Language selector button and dropdown |

### Modified Files
| File | Changes |
|------|---------|
| `index.html` | Add i18n scripts, data-i18n attributes, language button |
| `style.css` | Language selector and dropdown styles |
| `js/config.js` | Add TRANSLATIONS_CONFIG constant |
| `js/ui-controller.js` | Integrate with translation system |
| `js/app.js` | Initialize I18n on startup |

---

## Prerequisites (READ FIRST)

Before starting, read these files to understand the codebase:
- `memory/CODEBASE_MEMORY.md` — Critical architectural information
- `docs/superpowers/specs/2026-03-25-i18n-design.md` — This implementation's design spec
- `index.html` lines 1-100 — Script loading order (CRITICAL: do not change order)
- `js/config.js` — See how CONFIG is structured
- `js/ui-controller.js` lines 1-50 — See UI module pattern

**IMPORTANT CONSTRAINTS:**
- Script loading order in index.html MUST be maintained
- All modules use `window.DRC = window.DRC || {};` pattern
- No ES modules — use script tags with strict order
- localStorage keys: use `drc-language` for language preference

---

## Task 1: Create Translation Files

### Task 1.1: Create English Translation File

**Files:**
- Create: `js/i18n/translations/en.json`

**Content:**
```json
{
  "_meta": {
    "language": "English",
    "code": "en"
  },
  "nav": {
    "brand": "Diabetes Risk Calculator",
    "reset": "Reset",
    "riskTimeline": "Risk Timeline",
    "selectProfile": "Select Profile",
    "language": "Select Language"
  },
  "hero": {
    "title": "9-Year Diabetes Risk",
    "expandLabel": "What does that mean?",
    "subtitle": "Based on the ARIC Study logistic regression model (Schmidt et al. 2005)"
  },
  "factors": {
    "age": "Age",
    "sex": "Sex",
    "race": "Ethnicity",
    "parentHist": "Parental Diabetes",
    "sbp": "Blood Pressure",
    "waist": "Waist",
    "height": "Height",
    "fastGlu": "Fasting Glucose",
    "cholHDL": "HDL Cholesterol",
    "cholTri": "Blood Fats (Triglycerides)"
  },
  "units": {
    "years": "years",
    "male": "Male",
    "female": "Female",
    "other": "Other",
    "black": "Black",
    "yes": "Yes",
    "no": "No",
    "us": "US",
    "si": "SI"
  },
  "sections": {
    "demographic": "Demographic Data",
    "clinical": "Clinical Data",
    "treatments": "Treatment Recommendations",
    "contributions": "Risk Factor Contributions"
  },
  "treatments": {
    "fastGlu": {
      "title": "Fasting Glucose Management",
      "therapy1_name": "Standard Medication",
      "therapy1_desc": "Metformin is often the first step to help control blood sugar levels.",
      "therapy2_name": "Heart & Kidney Protection",
      "therapy2_desc": "If you have heart or kidney concerns, ask your doctor about newer medications that specifically protect these organs (SGLT2 inhibitors or GLP-1) while also supporting weight loss."
    },
    "sbp": {
      "title": "Blood Pressure Control",
      "therapy1_name": "Combination Medications",
      "therapy1_desc": "It is recommend to start with a combination of different blood pressure medications (e.g. RAS inhibitors and CCBs).",
      "therapy2_name": "Heart-Healthy Diet",
      "therapy2_desc": "Restriction of alcohol and sodium consumption, increased consumption of vegetables, use of low-fat dairy products can lower blood pressure naturally."
    },
    "cholHDL": {
      "title": "HDL Cholesterol Improvement",
      "therapy1_name": "Regular Exercise",
      "therapy1_desc": "Aim for 150 minutes per week of activity like brisk walking, or 75 minutes of intense exercise.",
      "therapy2_name": "Medication",
      "therapy2_desc": "CETP inhibitors and Cholesterol-lowering medication (Statins) can also help to raise HDL."
    },
    "cholTri": {
      "title": "Blood Fats (Triglycerides) Treatment",
      "therapy1_name": "Healthy Lifestyle",
      "therapy1_desc": "Stopping smoking and eating healthy fats (olive oil, nuts, fish) all help and should be done first.",
      "therapy2_name": "Prescription Fish Oil",
      "therapy2_desc": "If blood fats (triglycerides) remain high, special prescription fish oil (icosapent ethyl) might be considered.",
      "therapy3_name": "Medication",
      "therapy3_desc": "Fibrate or Cholesterol lowering medication (Statins) can also help to reduce triglycerides."
    },
    "waist": {
      "title": "Weight Management",
      "therapy1_name": "Diet & Exercise",
      "therapy1_desc": "Reducing daily calories and exercising more leads to steady weight loss.",
      "therapy2_name": "Medications",
      "therapy2_desc": "Glucose-lowering drugs with additional weight-reducing effects (e.g. GLP-1RA) can also help.",
      "surgical": "Surgical Options",
      "surgical_desc": "For significant obesity with health problems, weight-loss surgery may be discussed."
    }
  },
  "buttons": {
    "simulate": "Simulate Treatment",
    "simulateActive": "Simulating...",
    "save": "Save",
    "cancel": "Cancel",
    "continue": "Continue",
    "createProfile": "Create Profile",
    "add": "Add",
    "export": "Export .xlsx / .drc",
    "import": "Import .xlsx / .drc",
    "scan": "Scan Lab Report"
  },
  "patientManager": {
    "title": "My Profiles",
    "activeProfile": "Active Profile",
    "noProfile": "No profile selected",
    "savedProfiles": "Saved Profiles",
    "addNew": "Add New Profile",
    "placeholder": "Profile name...",
    "empty": "No profiles saved yet.",
    "importExport": "Import / Export / OCR"
  },
  "timeline": {
    "title": "Risk Timeline",
    "hint": "Simulate treatments to track risk changes over time",
    "setBaseline": "Set Baseline",
    "snapshot": "Snapshot",
    "empty": "Set a baseline and add snapshots to track your risk over scenarios."
  },
  "modals": {
    "profileWarning": {
      "title": "Save Your Data?",
      "message": "You haven't created a profile yet. If you continue, your current data won't be saved.",
      "create": "Create Profile",
      "continue": "Continue Without Saving"
    },
    "ocr": {
      "title": "Scan Lab Report",
      "instructions": "Take a photo or upload your lab report",
      "camera": "Camera",
      "upload": "Upload File",
      "review": "Review Results",
      "confidence_high": "High confidence",
      "confidence_medium": "Medium confidence",
      "confidence_low": "Low confidence"
    }
  }
}
```

- [ ] **Step 1: Create directory structure**

Run: `mkdir -p js/i18n/translations`
Expected: Directory created

- [ ] **Step 2: Write English translation file**

Write the JSON content above to `js/i18n/translations/en.json`

- [ ] **Step 3: Commit**

```bash
git add js/i18n/translations/en.json
git commit -m "feat(i18n): add English translation file"
```

---

### Task 1.2: Create German Translation File

**Files:**
- Create: `js/i18n/translations/de.json`

- [ ] **Step 1: Write German translation file**

Create `js/i18n/translations/de.json` with all German translations (mirror the en.json structure exactly):

```json
{
  "_meta": {
    "language": "Deutsch",
    "code": "de"
  },
  "nav": {
    "brand": "Diabetes Risiko Rechner",
    "reset": "Zurücksetzen",
    "riskTimeline": "Risiko Zeitlinie",
    "selectProfile": "Profil wählen",
    "language": "Sprache wählen"
  },
  "hero": {
    "title": "9-Jahres Diabetes Risiko",
    "expandLabel": "Was bedeutet das?",
    "subtitle": "Basierend auf dem ARIC-Studie logistischen Regressionsmodell (Schmidt et al. 2005)"
  },
  "factors": {
    "age": "Alter",
    "sex": "Geschlecht",
    "race": "Ethnizität",
    "parentHist": "Elterlicher Diabetes",
    "sbp": "Blutdruck",
    "waist": "Taillenumfang",
    "height": "Körpergröße",
    "fastGlu": "Nüchternglukose",
    "cholHDL": "HDL Cholesterin",
    "cholTri": "Blutfette (Triglyceride)"
  },
  "units": {
    "years": "Jahre",
    "male": "Männlich",
    "female": "Weiblich",
    "other": "Andere",
    "black": "Schwarz",
    "yes": "Ja",
    "no": "Nein",
    "us": "US",
    "si": "SI"
  },
  "sections": {
    "demographic": "Demografische Daten",
    "clinical": "Klinische Daten",
    "treatments": "Behandlungsempfehlungen",
    "contributions": "Risikofaktor Beiträge"
  },
  "treatments": {
    "fastGlu": {
      "title": "Nüchternglukose Management",
      "therapy1_name": "Standard Medikation",
      "therapy1_desc": "Metformin ist oft der erste Schritt, um den Blutzuckerspiegel zu kontrollieren.",
      "therapy2_name": "Herz- & Nierenschutz",
      "therapy2_desc": "Wenn Sie Herz- oder Nierenprobleme haben, fragen Sie Ihren Arzt nach neueren Medikamenten, die diese Organe speziell schützen (SGLT2-Inhibitoren oder GLP-1) und gleichzeitig das Gewicht reduzieren."
    },
    "sbp": {
      "title": "Blutdruckkontrolle",
      "therapy1_name": "Kombinationsmedikamente",
      "therapy1_desc": "Es wird empfohlen, mit einer Kombination verschiedener Blutdruckmedikamente zu beginnen (z.B. RAS-Hemmer und CCBs).",
      "therapy2_name": "Herzgesunde Ernährung",
      "therapy2_desc": "Die Reduzierung von Alkohol- und Natriumkonsum, erhöhter Gemüsekonsum und die Verwendung von fettarmen Milchprodukten können den Blutdruck natürlich senken."
    },
    "cholHDL": {
      "title": "HDL Cholesterin Verbesserung",
      "therapy1_name": "Regelmäßige Bewegung",
      "therapy1_desc": "Zielen Sie auf 150 Minuten pro Woche Aktivität wie zügiges Gehen oder 75 Minuten intensives Training.",
      "therapy2_name": "Medikation",
      "therapy2_desc": "CETP-Inhibitoren und cholesterinsenkende Medikamente (Statine) können auch helfen, das HDL zu erhöhen."
    },
    "cholTri": {
      "title": "Blutfette (Triglyceride) Behandlung",
      "therapy1_name": "Gesunder Lebensstil",
      "therapy1_desc": "Mit dem Rauchen aufhören und gesunde Fette (Olivenöl, Nüsse, Fisch) essen, das hilft alles und sollte zuerst getan werden.",
      "therapy2_name": "Verschreibungspflichtiges Fischöl",
      "therapy2_desc": "Wenn die Blutfette (Triglyceride) weiterhin hoch bleiben, kann spezielles verschreibungspflichtiges Fischöl (Icosapent Ethyl) in Betracht gezogen werden.",
      "therapy3_name": "Medikation",
      "therapy3_desc": "Fibrate oder cholesterinsenkende Medikamente (Statine) können auch helfen, die Triglyceride zu reduzieren."
    },
    "waist": {
      "title": "Gewichtsmanagement",
      "therapy1_name": "Ernährung & Bewegung",
      "therapy1_desc": "Die Reduzierung der täglichen Kalorien und mehr Bewegung führt zu stetigem Gewichtsverlust.",
      "therapy2_name": "Medikamente",
      "therapy2_desc": "Glukose-senkende Medikamente mit zusätzlichen gewichtsreduzierenden Effekten (z.B. GLP-1RA) können auch helfen.",
      "surgical": "Chirurgische Optionen",
      "surgical_desc": "Bei signifikanter Adipositas mit gesundheitlichen Problemen kann eine Gewichtsabnahmechirurgie diskutiert werden."
    }
  },
  "buttons": {
    "simulate": "Behandlung simulieren",
    "simulateActive": "Simuliere...",
    "save": "Speichern",
    "cancel": "Abbrechen",
    "continue": "Weiter",
    "createProfile": "Profil erstellen",
    "add": "Hinzufügen",
    "export": "Export .xlsx / .drc",
    "import": "Import .xlsx / .drc",
    "scan": "Labbericht scannen"
  },
  "patientManager": {
    "title": "Meine Profile",
    "activeProfile": "Aktives Profil",
    "noProfile": "Kein Profil ausgewählt",
    "savedProfiles": "Gespeicherte Profile",
    "addNew": "Neues Profil hinzufügen",
    "placeholder": "Profilname...",
    "empty": "Noch keine Profile gespeichert.",
    "importExport": "Import / Export / OCR"
  },
  "timeline": {
    "title": "Risiko Zeitlinie",
    "hint": "Simulieren Sie Behandlungen, um Risikoänderungen im Zeitverlauf zu verfolgen",
    "setBaseline": "Basislinie setzen",
    "snapshot": "Schnappschuss",
    "empty": "Setzen Sie eine Basislinie und fügen Sie Schnappschüsse hinzu, um Ihr Risiko über Szenarien zu verfolgen."
  },
  "modals": {
    "profileWarning": {
      "title": "Daten speichern?",
      "message": "Sie haben noch kein Profil erstellt. Wenn Sie fortfahren, werden Ihre aktuellen Daten nicht gespeichert.",
      "create": "Profil erstellen",
      "continue": "Ohne Speichern fortfahren"
    },
    "ocr": {
      "title": "Labbericht scannen",
      "instructions": "Machen Sie ein Foto oder laden Sie Ihren Labbericht hoch",
      "camera": "Kamera",
      "upload": "Datei hochladen",
      "review": "Ergebnisse prüfen",
      "confidence_high": "Hohe Konfidenz",
      "confidence_medium": "Mittlere Konfidenz",
      "confidence_low": "Niedrige Konfidenz"
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add js/i18n/translations/de.json
git commit -m "feat(i18n): add German translation file"
```

---

### Task 1.3: Create French Translation File

**Files:**
- Create: `js/i18n/translations/fr.json`

- [ ] **Step 1: Write French translation file**

Create `js/i18n/translations/fr.json` with all French translations (mirror structure):

```json
{
  "_meta": {
    "language": "Français",
    "code": "fr"
  },
  "nav": {
    "brand": "Calculateur de Risque Diabète",
    "reset": "Réinitialiser",
    "riskTimeline": "Chronologie du Risque",
    "selectProfile": "Sélectionner Profil",
    "language": "Choisir la Langue"
  },
  "hero": {
    "title": "Risque Diabète 9 Ans",
    "expandLabel": "Qu'est-ce que cela signifie?",
    "subtitle": "Basé sur le modèle de régression logistique de l'étude ARIC (Schmidt et al. 2005)"
  },
  "factors": {
    "age": "Âge",
    "sex": "Sexe",
    "race": "Ethnicité",
    "parentHist": "Diabète Parental",
    "sbp": "Pression Artérielle",
    "waist": "Tour de Taille",
    "height": "Taille",
    "fastGlu": "Glycémie à Jeun",
    "cholHDL": "Cholestérol HDL",
    "cholTri": "Graisses Sanguines (Triglycérides)"
  },
  "units": {
    "years": "ans",
    "male": "Homme",
    "female": "Femme",
    "other": "Autre",
    "black": "Noir",
    "yes": "Oui",
    "no": "Non",
    "us": "US",
    "si": "SI"
  },
  "sections": {
    "demographic": "Données Démographiques",
    "clinical": "Données Cliniques",
    "treatments": "Recommandations de Traitement",
    "contributions": "Contributions des Facteurs de Risque"
  },
  "treatments": {
    "fastGlu": {
      "title": "Gestion de la Glycémie à Jeun",
      "therapy1_name": "Médication Standard",
      "therapy1_desc": "La metformine est souvent la première étape pour aider à contrôler les niveaux de sucre dans le sang.",
      "therapy2_name": "Protection Cardiaque & Rénale",
      "therapy2_desc": "Si vous avez des problèmes cardiaques ou rénaux, demandez à votre médecin des médicaments plus récents qui protègent spécifiquement ces organes (inhibiteurs SGLT2 ou GLP-1) tout en favorisant la perte de poids."
    },
    "sbp": {
      "title": "Contrôle de la Pression Artérielle",
      "therapy1_name": "Médicaments Combinés",
      "therapy1_desc": "Il est recommandé de commencer avec une combinaison de différents médicaments contre l'hypertension (par exemple inhibiteurs RAS et CCB).",
      "therapy2_name": "Régime Cardioprotecteur",
      "therapy2_desc": "La restriction de l'alcool et du sodium, une consommation accrue de légumes et l'utilisation de produits laitiers faibles en gras peuvent abaisser la pression artérielle naturellement."
    },
    "cholHDL": {
      "title": "Amélioration du Cholestérol HDL",
      "therapy1_name": "Exercice Régulier",
      "therapy1_desc": "Visez 150 minutes par semaine d'activité comme la marche rapide, ou 75 minutes d'exercice intense.",
      "therapy2_name": "Médication",
      "therapy2_desc": "Les inhibiteurs de CETP et les médicaments réduisant le cholestérol (statines) peuvent également aider à augmenter le HDL."
    },
    "cholTri": {
      "title": "Traitement des Graisses Sanguines (Triglycérides)",
      "therapy1_name": "Mode de Vie Sain",
      "therapy1_desc": "Arrêter de fumer et manger des graisses saines (huile d'olive, noix, poisson) aident tous et devraient être faits en premier.",
      "therapy2_name": "Huile de Poisson sur Ordonnance",
      "therapy2_desc": "Si les graisses sanguines (triglycérides) restent élevées, une huile de poisson spéciale sur ordonnance (éthyle d'icosapent) pourrait être envisagée.",
      "therapy3_name": "Médication",
      "therapy3_desc": "Les fibrates ou les médicaments réduisant le cholestérol (statines) peuvent également aider à réduire les triglycérides."
    },
    "waist": {
      "title": "Gestion du Poids",
      "therapy1_name": "Régime & Exercice",
      "therapy1_desc": "Réduire les calories quotidiennes et faire plus d'exercice conduit à une perte de poids régulière.",
      "therapy2_name": "Médicaments",
      "therapy2_desc": "Les médicaments réduisant le glucose avec des effets supplémentaires de réduction du poids (par exemple GLP-1RA) peuvent également aider.",
      "surgical": "Options Chirurgicales",
      "surgical_desc": "Pour une obésité significative avec des problèmes de santé, une chirurgie de perte de poids peut être envisagée."
    }
  },
  "buttons": {
    "simulate": "Simuler Traitement",
    "simulateActive": "Simulation...",
    "save": "Enregistrer",
    "cancel": "Annuler",
    "continue": "Continuer",
    "createProfile": "Créer Profil",
    "add": "Ajouter",
    "export": "Exporter .xlsx / .drc",
    "import": "Importer .xlsx / .drc",
    "scan": "Scanner Rapport Labo"
  },
  "patientManager": {
    "title": "Mes Profils",
    "activeProfile": "Profil Actif",
    "noProfile": "Aucun profil sélectionné",
    "savedProfiles": "Profils Enregistrés",
    "addNew": "Ajouter Nouveau Profil",
    "placeholder": "Nom du profil...",
    "empty": "Aucun profil enregistré pour l'instant.",
    "importExport": "Import / Export / OCR"
  },
  "timeline": {
    "title": "Chronologie du Risque",
    "hint": "Simulez des traitements pour suivre les changements de risque au fil du temps",
    "setBaseline": "Définir Base",
    "snapshot": "Instantané",
    "empty": "Définissez une base et ajoutez des instantanés pour suivre votre risque à travers les scénarios."
  },
  "modals": {
    "profileWarning": {
      "title": "Enregistrer vos Données?",
      "message": "Vous n'avez pas encore créé de profil. Si vous continuez, vos données actuelles ne seront pas sauvegardées.",
      "create": "Créer Profil",
      "continue": "Continuer Sans Sauvegarder"
    },
    "ocr": {
      "title": "Scanner Rapport Labo",
      "instructions": "Prenez une photo ou téléchargez votre rapport de laboratoire",
      "camera": "Caméra",
      "upload": "Télécharger Fichier",
      "review": "Vérifier Résultats",
      "confidence_high": "Confiance élevée",
      "confidence_medium": "Confiance moyenne",
      "confidence_low": "Confiance faible"
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add js/i18n/translations/fr.json
git commit -m "feat(i18n): add French translation file"
```

---

### Task 1.4: Create Spanish Translation File

**Files:**
- Create: `js/i18n/translations/es.json`

- [ ] **Step 1: Write Spanish translation file**

Create `js/i18n/translations/es.json` with all Spanish translations:

```json
{
  "_meta": {
    "language": "Español",
    "code": "es"
  },
  "nav": {
    "brand": "Calculadora de Riesgo Diabetes",
    "reset": "Restablecer",
    "riskTimeline": "Línea Temporal de Riesgo",
    "selectProfile": "Seleccionar Perfil",
    "language": "Seleccionar Idioma"
  },
  "hero": {
    "title": "Riesgo Diabetes 9 Años",
    "expandLabel": "¿Qué significa eso?",
    "subtitle": "Basado en el modelo de regresión logística del Estudio ARIC (Schmidt et al. 2005)"
  },
  "factors": {
    "age": "Edad",
    "sex": "Sexo",
    "race": "Etnicidad",
    "parentHist": "Diabetes Parental",
    "sbp": "Presión Arterial",
    "waist": "Cintura",
    "height": "Altura",
    "fastGlu": "Glucosa en Ayunas",
    "cholHDL": "Colesterol HDL",
    "cholTri": "Grasas Sanguíneas (Triglicéridos)"
  },
  "units": {
    "years": "años",
    "male": "Hombre",
    "female": "Mujer",
    "other": "Otro",
    "black": "Negro",
    "yes": "Sí",
    "no": "No",
    "us": "US",
    "si": "SI"
  },
  "sections": {
    "demographic": "Datos Demográficos",
    "clinical": "Datos Clínicos",
    "treatments": "Recomendaciones de Tratamiento",
    "contributions": "Contribuciones de Factores de Riesgo"
  },
  "treatments": {
    "fastGlu": {
      "title": "Manejo de Glucosa en Ayunas",
      "therapy1_name": "Medicación Estándar",
      "therapy1_desc": "La metformina es a menudo el primer paso para ayudar a controlar los niveles de azúcar en sangre.",
      "therapy2_name": "Protección Cardíaca y Renal",
      "therapy2_desc": "Si tiene problemas cardíacos o renales, pregúntele a su médico sobre medicamentos más nuevos que protegen específicamente estos órganos (inhibidores SGLT2 o GLP-1) mientras también apoyan la pérdida de peso."
    },
    "sbp": {
      "title": "Control de Presión Arterial",
      "therapy1_name": "Medicamentos Combinados",
      "therapy1_desc": "Se recomienda comenzar con una combinación de diferentes medicamentos para la presión arterial (por ejemplo, inhibidores RAS y CCB).",
      "therapy2_name": "Dieta Cardiosaludable",
      "therapy2_desc": "La restricción del alcohol y del consumo de sodio, el aumento del consumo de verduras y el uso de productos lácteos bajos en grasa pueden reducir la presión arterial naturalmente."
    },
    "cholHDL": {
      "title": "Mejora del Colesterol HDL",
      "therapy1_name": "Ejercicio Regular",
      "therapy1_desc": "Apunte a 150 minutos por semana de actividad como caminar rápido, o 75 minutos de ejercicio intenso.",
      "therapy2_name": "Medicación",
      "therapy2_desc": "Los inhibidores de CETP y los medicamentos reductores de colesterol (estatinas) también pueden ayudar a aumentar el HDL."
    },
    "cholTri": {
      "title": "Tratamiento de Grasas Sanguíneas (Triglicéridos)",
      "therapy1_name": "Estilo de Vida Saludable",
      "therapy1_desc": "Dejar de fumar y comer grasas saludables (aceite de oliva, nueces, pescado) ayuda y debería hacerse primero.",
      "therapy2_name": "Aceite de Pescado Recetado",
      "therapy2_desc": "Si las grasas sanguíneas (triglicéridos) permanecen altos, podría considerarse un aceite de pescado especial recetado (etilo de icosapent).",
      "therapy3_name": "Medicación",
      "therapy3_desc": "Los fibratos o los medicamentos reductores de colesterol (estatinas) también pueden ayudar a reducir los triglicéridos."
    },
    "waist": {
      "title": "Manejo del Peso",
      "therapy1_name": "Dieta y Ejercicio",
      "therapy1_desc": "Reducir las calorías diarias y hacer más ejercicio lleva a una pérdida de peso constante.",
      "therapy2_name": "Medicamentos",
      "therapy2_desc": "Los medicamentos reductores de glucosa con efectos adicionales de reducción de peso (por ejemplo GLP-1RA) también pueden ayudar.",
      "surgical": "Opciones Quirúrgicas",
      "surgical_desc": "Para obesidad significativa con problemas de salud, puede discutirse la cirugía de pérdida de peso."
    }
  },
  "buttons": {
    "simulate": "Simular Tratamiento",
    "simulateActive": "Simulando...",
    "save": "Guardar",
    "cancel": "Cancelar",
    "continue": "Continuar",
    "createProfile": "Crear Perfil",
    "add": "Agregar",
    "export": "Exportar .xlsx / .drc",
    "import": "Importar .xlsx / .drc",
    "scan": "Escanear Informe Lab"
  },
  "patientManager": {
    "title": "Mis Perfiles",
    "activeProfile": "Perfil Activo",
    "noProfile": "Ningún perfil seleccionado",
    "savedProfiles": "Perfiles Guardados",
    "addNew": "Agregar Nuevo Perfil",
    "placeholder": "Nombre del perfil...",
    "empty": "Aún no hay perfiles guardados.",
    "importExport": "Importar / Exportar / OCR"
  },
  "timeline": {
    "title": "Línea Temporal de Riesgo",
    "hint": "Simule tratamientos para rastrear cambios de riesgo a lo largo del tiempo",
    "setBaseline": "Establecer Base",
    "snapshot": "Instantánea",
    "empty": "Establezca una base y agregue instantáneas para rastrear su riesgo a través de escenarios."
  },
  "modals": {
    "profileWarning": {
      "title": "¿Guardar sus Datos?",
      "message": "Aún no ha creado un perfil. Si continúa, sus datos actuales no se guardarán.",
      "create": "Crear Perfil",
      "continue": "Continuar Sin Guardar"
    },
    "ocr": {
      "title": "Escanear Informe Lab",
      "instructions": "Tome una foto o suba su informe de laboratorio",
      "camera": "Cámara",
      "upload": "Subir Archivo",
      "review": "Revisar Resultados",
      "confidence_high": "Alta confianza",
      "confidence_medium": "Confianza media",
      "confidence_low": "Baja confianza"
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add js/i18n/translations/es.json
git commit -m "feat(i18n): add Spanish translation file"
```

---

## Task 2: Create I18n Service Module

**Files:**
- Create: `js/i18n/i18n-service.js`

**Purpose:** Core translation service that manages language state, loads translations, and provides translation API.

- [ ] **Step 1: Create i18n-service.js**

```javascript
/**
 * @fileoverview Internationalization Service
 *
 * Manages language state, loads translations from JSON files,
 * and provides translation API for the entire application.
 *
 * @module I18nService
 * @memberof DRC
 */

'use strict';

window.DRC = window.DRC || {};

DRC.I18n = (() => {
    // ─── Configuration ─────────────────────────────────────────────────
    const STORAGE_KEY = 'drc-language';
    const DEFAULT_LANG = 'en';
    const AVAILABLE_LANGS = ['en', 'de', 'fr', 'es'];

    // ─── State ───────────────────────────────────────────────────────────
    let _currentLang = DEFAULT_LANG;
    let _translations = {};
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
            // localStorage not available (private mode, etc.)
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
     * Load translation file for given language
     * Falls back to English if requested language fails to load
     * @param {string} lang - Language code
     * @returns {Promise<Object>} Translation data
     */
    const _loadTranslations = async (lang) => {
        try {
            const response = await fetch(`js/i18n/translations/${lang}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load ${lang}: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`i18n: Error loading translations for ${lang}:`, error);
            // Fallback to English if non-English language fails
            if (lang !== DEFAULT_LANG) {
                console.warn(`i18n: Falling back to ${DEFAULT_LANG}`);
                return _loadTranslations(DEFAULT_LANG);
            }
            // Last resort - return empty object (keys will show as text)
            return {};
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
     * Loads the stored or default language
     * @returns {Promise<void>}
     */
    const init = async () => {
        const lang = _getStoredLanguage();
        _currentLang = lang;
        _translations = await _loadTranslations(lang);
        _isReady = true;

        // Update HTML lang attribute
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
     * @returns {Promise<boolean>} True if successful
     */
    const setLanguage = async (lang) => {
        if (!isValidLang(lang)) {
            console.error(`i18n: Invalid language code '${lang}'`);
            return false;
        }

        if (lang === _currentLang) {
            return true; // No change needed
        }

        // Load new translations
        const newTranslations = await _loadTranslations(lang);

        // Update state
        _currentLang = lang;
        _translations = newTranslations;

        // Persist preference
        _storeLanguage(lang);

        // Update HTML lang attribute
        document.documentElement.lang = lang;

        // Notify listeners
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
        return key; // Return key as last resort
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
                // If element has no children, update directly
                if (el.children.length === 0) {
                    el.textContent = translated;
                } else {
                    // For elements with children (icons, etc.), only update text nodes
                    // Find the first text node that contains non-whitespace content
                    let textNodeFound = false;
                    for (const node of el.childNodes) {
                        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                            node.textContent = translated;
                            textNodeFound = true;
                            break;
                        }
                    }
                    // If no text node found, prepend the translation
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
        const flags = {
            en: '🇺🇸',
            de: '🇩🇪',
            fr: '🇫🇷',
            es: '🇪🇸'
        };
        return flags[lang] || '🌐';
    };

    /**
     * Get display name for a language
     * @param {string} lang - Language code
     * @returns {string} Language name in its own language
     */
    const getLanguageName = (lang) => {
        const names = {
            en: 'English',
            de: 'Deutsch',
            fr: 'Français',
            es: 'Español'
        };
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
```

- [ ] **Step 2: Commit**

```bash
git add js/i18n/i18n-service.js
git commit -m "feat(i18n): add i18n service module"
```

---

## Task 3: Create I18n UI Module (Language Selector)

**Files:**
- Create: `js/i18n/i18n-ui.js`
- Modify: `index.html` (add button)
- Modify: `style.css` (add styles)

- [ ] **Step 1: Create i18n-ui.js**

```javascript
/**
 * @fileoverview I18n UI Component
 *
 * Language selector button and dropdown for the top navigation.
 * Manages the UI interactions for language switching.
 *
 * @module I18nUI
 * @memberof DRC
 */

'use strict';

window.DRC = window.DRC || {};

DRC.I18nUI = (() => {
    // ─── State ───────────────────────────────────────────────────────────
    let _dropdown = null;
    let _button = null;
    let _isOpen = false;

    // ─── Private Methods ─────────────────────────────────────────────────

    /**
     * Create the language dropdown element
     * @returns {HTMLElement} Dropdown element
     */
    const _createDropdown = () => {
        const dropdown = document.createElement('div');
        dropdown.className = 'lang-dropdown';
        dropdown.id = 'langDropdown';
        dropdown.setAttribute('hidden', '');
        dropdown.setAttribute('role', 'menu');
        dropdown.setAttribute('aria-label', 'Language selection');

        const languages = DRC.I18n.getAvailableLangs();
        const currentLang = DRC.I18n.getCurrentLang();

        languages.forEach(lang => {
            const option = document.createElement('button');
            option.className = 'lang-option';
            option.setAttribute('data-lang', lang);
            option.setAttribute('role', 'menuitem');
            if (lang === currentLang) {
                option.classList.add('active');
                option.setAttribute('aria-current', 'true');
            }

            const flag = document.createElement('span');
            flag.className = 'lang-flag';
            flag.textContent = DRC.I18n.getFlag(lang);
            flag.setAttribute('aria-hidden', 'true');

            const name = document.createElement('span');
            name.className = 'lang-name';
            name.textContent = DRC.I18n.getLanguageName(lang);

            option.appendChild(flag);
            option.appendChild(name);

            option.addEventListener('click', () => _selectLanguage(lang));

            dropdown.appendChild(option);
        });

        return dropdown;
    };

    /**
     * Handle language selection
     * @param {string} lang - Language code
     */
    const _selectLanguage = async (lang) => {
        if (lang === DRC.I18n.getCurrentLang()) {
            _closeDropdown();
            return;
        }

        const success = await DRC.I18n.setLanguage(lang);
        if (success) {
            // Update button display
            _updateButtonDisplay();

            // Update dropdown active state
            _updateDropdownActiveState();

            // Close dropdown
            _closeDropdown();

            // Trigger DOM translation
            DRC.I18n.translateDOM();

            // Dispatch custom event for other components
            window.dispatchEvent(new CustomEvent('drc:language-changed', {
                detail: { language: lang }
            }));
        }
    };

    /**
     * Update button display with current language
     */
    const _updateButtonDisplay = () => {
        if (!_button) return;

        const lang = DRC.I18n.getCurrentLang();
        const flag = _button.querySelector('.lang-flag');
        const code = _button.querySelector('.lang-code');

        if (flag) flag.textContent = DRC.I18n.getFlag(lang);
        if (code) code.textContent = lang.toUpperCase();
    };

    /**
     * Update active state in dropdown
     */
    const _updateDropdownActiveState = () => {
        if (!_dropdown) return;

        const currentLang = DRC.I18n.getCurrentLang();
        const options = _dropdown.querySelectorAll('.lang-option');

        options.forEach(option => {
            const lang = option.getAttribute('data-lang');
            if (lang === currentLang) {
                option.classList.add('active');
                option.setAttribute('aria-current', 'true');
            } else {
                option.classList.remove('active');
                option.removeAttribute('aria-current');
            }
        });
    };

    /**
     * Open the dropdown
     */
    const _openDropdown = () => {
        if (!_dropdown || _isOpen) return;

        _dropdown.removeAttribute('hidden');
        _button?.setAttribute('aria-expanded', 'true');
        _isOpen = true;

        // Position dropdown below button
        const rect = _button.getBoundingClientRect();
        _dropdown.style.top = `${rect.bottom + 8}px`;
        _dropdown.style.right = `${window.innerWidth - rect.right}px`;

        // Add document click listener
        document.addEventListener('click', _handleDocumentClick);
        document.addEventListener('keydown', _handleKeydown);
    };

    /**
     * Close the dropdown
     */
    const _closeDropdown = () => {
        if (!_dropdown || !_isOpen) return;

        _dropdown.setAttribute('hidden', '');
        _button?.setAttribute('aria-expanded', 'false');
        _isOpen = false;

        // Remove document listeners
        document.removeEventListener('click', _handleDocumentClick);
        document.removeEventListener('keydown', _handleKeydown);
    };

    /**
     * Toggle dropdown visibility
     */
    const _toggleDropdown = () => {
        if (_isOpen) {
            _closeDropdown();
        } else {
            _openDropdown();
        }
    };

    /**
     * Handle clicks outside dropdown
     * @param {Event} e - Click event
     */
    const _handleDocumentClick = (e) => {
        if (!_dropdown || !_button) return;
        if (!_dropdown.contains(e.target) && !_button.contains(e.target)) {
            _closeDropdown();
        }
    };

    /**
     * Handle keyboard navigation
     * @param {KeyboardEvent} e - Keyboard event
     */
    const _handleKeydown = (e) => {
        if (e.key === 'Escape') {
            _closeDropdown();
            _button?.focus();
        }
    };

    // ─── Public API ─────────────────────────────────────────────────────

    /**
     * Initialize the language selector UI
     * Must be called after DRC.I18n.init()
     */
    const init = () => {
        // Find or create button
        _button = document.getElementById('langBtn');
        if (!_button) {
            console.warn('i18n-ui: Language button not found (#langBtn)');
            return;
        }

        // Create dropdown
        _dropdown = _createDropdown();
        document.body.appendChild(_dropdown);

        // Set initial button state
        _updateButtonDisplay();

        // Add button click handler
        _button.addEventListener('click', (e) => {
            e.stopPropagation();
            _toggleDropdown();
        });

        // Subscribe to language changes
        DRC.I18n.onLanguageChange(() => {
            _updateButtonDisplay();
        });

        console.log('i18n-ui: Language selector initialized');
    };

    // ─── Public API ─────────────────────────────────────────────────────
    return {
        init
    };
})();
```

- [ ] **Step 2: Commit**

```bash
git add js/i18n/i18n-ui.js
git commit -m "feat(i18n): add language selector UI module"
```

---

## Task 4: Add HTML Integration

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add language button to navigation**

In `index.html`, find the nav-actions div (around line 51-78) and add the language button before the closing `</div>`:

```html
<!-- Language Selector Button -->
<button id="langBtn" type="button" class="btn-language" aria-label="Select language" aria-expanded="false">
    <span class="lang-flag" aria-hidden="true">🇺🇸</span>
    <span class="lang-code">EN</span>
    <i data-lucide="chevron-down" class="lucide-icon"></i>
</button>
```

Place it right before the closing `</div>` of `.nav-actions`.

- [ ] **Step 2: Add i18n scripts to head**

In `index.html`, add these script tags after the config.js line (around line 30 area in the script loading order):

```html
<!-- I18n Service -->
<script src="js/i18n/i18n-service.js"></script>
<script src="js/i18n/i18n-ui.js"></script>
```

This should be added AFTER `config.js` and BEFORE `conversion-service.js`.

- [ ] **Step 3: Add data-i18n attributes to key elements**

Update the following elements in index.html:

**Nav brand (line ~48):**
```html
<span data-i18n="nav.brand">Diabetes Risk Calculator</span>
```

**Reset button aria-label (line ~64):**
Add: `aria-label-text="nav.reset"` (we'll handle this via JS)

**Timeline button (line ~68):**
```html
<span class="btn-timeline-label" data-i18n="nav.riskTimeline">Risk Timeline</span>
```

**Patient menu button (line ~73):**
```html
<span class="patient-name-label" id="patientNameLabel" data-i18n="nav.selectProfile">Select Profile</span>
```

**Hero section (line ~144):**
```html
<p class="hero-label" data-i18n="hero.title">9-Year Diabetes Risk</p>
```

**Expand hero button (line ~153):**
```html
<span id="expandHeroLabel" data-i18n="hero.expandLabel">What does that mean?</span>
```

**Hero subtitle (line ~161):**
```html
<p class="hero-subtitle" data-i18n="hero.subtitle">Based on the ARIC Study...</p>
```

**Panel headers - Patient Data (line ~204):**
```html
<h2 data-i18n="sections.demographic">Patient Data</h2>
```

**Continue adding data-i18n attributes for all labels, buttons, and section headers throughout the HTML...**

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(i18n): add language button and data-i18n attributes to HTML"
```

---

## Task 5: Add CSS Styles

**Files:**
- Modify: `style.css`

- [ ] **Step 1: Add language selector styles**

Add these styles to `style.css` (after the dark mode button styles, around line 260):

```css
/* ============================================
   LANGUAGE SELECTOR
   ============================================ */

.btn-language {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    height: 32px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 20px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
    transition: background-color 0.2s, border-color 0.2s;
}

.btn-language:hover {
    background: rgba(0, 0, 0, 0.03);
    border-color: var(--border-strong);
}

.btn-language:active {
    background: rgba(0, 0, 0, 0.06);
}

.btn-language .lang-flag {
    font-size: 16px;
    line-height: 1;
}

.btn-language .lang-code {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.02em;
}

.btn-language .lucide-icon {
    width: 14px;
    height: 14px;
    color: var(--text-tertiary);
}

/* Language Dropdown */
.lang-dropdown {
    position: fixed;
    z-index: 200;
    background: var(--bg-card);
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
    min-width: 160px;
    overflow: hidden;
    animation: dropdown-appear 0.15s var(--ease-out);
}

@keyframes dropdown-appear {
    from {
        opacity: 0;
        transform: translateY(-8px) scale(0.98);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.lang-option {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 14px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 14px;
    text-align: left;
    color: var(--text-primary);
    transition: background-color 0.15s;
}

.lang-option:hover {
    background: var(--blue-light);
}

.lang-option.active {
    background: var(--blue-light);
    font-weight: 500;
}

.lang-option .lang-flag {
    font-size: 18px;
    line-height: 1;
}

.lang-option .lang-name {
    flex: 1;
}

/* Dark mode adjustments */
[data-theme="dark"] .btn-language:hover {
    background: rgba(255, 255, 255, 0.08);
}

[data-theme="dark"] .btn-language:active {
    background: rgba(255, 255, 255, 0.12);
}
```

- [ ] **Step 2: Commit**

```bash
git add style.css
git commit -m "feat(i18n): add language selector CSS styles"
```

---

## Task 6: Initialize I18n in App

**Files:**
- Modify: `js/app.js`

- [ ] **Step 1: Initialize I18n service**

In `js/app.js`, find the `init()` function and add I18n initialization:

Find:
```javascript
const init = () => {
```

Add BEFORE the existing init code:
```javascript
const init = async () => {
    // Initialize i18n first
    await DRC.I18n.init();
    DRC.I18n.translateDOM();
    DRC.I18nUI.init();
```

Note: The init function needs to become async.

- [ ] **Step 2: Subscribe to language changes**

Add after the initialization:

```javascript
// Subscribe to language changes to re-render dynamic content
DRC.I18n.onLanguageChange((lang) => {
    // Re-render risk and other dynamic content
    _calculate();
});
```

- [ ] **Step 3: Commit**

```bash
git add js/app.js
git commit -m "feat(i18n): initialize i18n service in app"
```

---

## Task 6b: Update main.js for Async Init

**Files:**
- Modify: `js/main.js`

Since `app.js` init is now async, update `main.js` to handle it:

- [ ] **Step 1: Make DOMContentLoaded handler async**

**Before:**
```javascript
document.addEventListener('DOMContentLoaded', () => {
    DRC.App.init();
    DRC.PatientManager.init();
});
```

**After:**
```javascript
document.addEventListener('DOMContentLoaded', async () => {
    await DRC.App.init();
    DRC.PatientManager.init();
});
```

- [ ] **Step 2: Commit**

```bash
git add js/main.js
git commit -m "feat(i18n): update main.js for async init"
```

**Files:**
- Modify: `js/ui-controller.js`

- [ ] **Step 1: Add translation-aware rendering**

Update the `renderRisk` function to use translations for labels:

```javascript
// At the top of ui-controller.js, after imports
const t = (key, fallback) => DRC.I18n?.t(key, fallback) || fallback || key;
```

- [ ] **Step 2: Update LABELS to use translation**

Find references to `CFG.LABELS` and wrap them with translation:

Example:
```javascript
// Before
setText('some-label', CFG.LABELS[field]);

// After
setText('some-label', t(`factors.${field}`, CFG.LABELS[field]));
```

- [ ] **Step 3: Commit**

```bash
git add js/ui-controller.js
git commit -m "feat(i18n): integrate translation into UI controller"
```

---

## Task 8: Update Patient Manager for I18n

**Files:**
- Modify: `js/patient-manager.js`

- [ ] **Step 1: Add translation support**

At the top of `js/patient-manager.js`, add the translation helper:

```javascript
// At the top of patient-manager.js, after imports
const t = (key, fallback) => DRC.I18n?.t(key, fallback) || fallback || key;
```

- [ ] **Step 2: Translate UI labels**

Update the following strings to use translation:

**Title:**
```javascript
// Before: "My Profiles"
// After:
t('patientManager.title', 'My Profiles')
```

**Active profile label:**
```javascript
// Before: "Active Profile"
t('patientManager.activeProfile', 'Active Profile')
```

**No profile message:**
```javascript
// Before: "No profile selected"
t('patientManager.noProfile', 'No profile selected')
```

**Empty list message:**
```javascript
// Before: "No profiles saved yet."
t('patientManager.empty', 'No profiles saved yet.')
```

**Add new label:**
```javascript
// Before: "Add New Profile"
t('patientManager.addNew', 'Add New Profile')
```

**Placeholder:**
```javascript
// Before: "Profile name…"
t('patientManager.placeholder', 'Profile name…')
```

**Button labels (Export, Import, Scan):**
```javascript
// Export button
t('buttons.export', 'Export .xlsx / .drc')

// Import button
t('buttons.import', 'Import .xlsx / .drc')

// Scan button
t('buttons.scan', 'Scan Lab Report')
```

- [ ] **Step 3: Subscribe to language changes**

Add in the init function:
```javascript
// Subscribe to language changes to re-render
DRC.I18n.onLanguageChange(() => {
    _renderPatientList();
    _updateActivePatientDisplay();
});
```

- [ ] **Step 4: Commit**

```bash
git add js/patient-manager.js
git commit -m "feat(i18n): add translation support to patient manager"
```

---

## Task 9: Testing

- [ ] **Step 1: Manual test - Page load**

Open `index.html` in browser.
Verify:
- Language button shows with US flag and "EN"
- Page loads without console errors

- [ ] **Step 2: Manual test - Language switch**

Click language button:
- Dropdown appears with all 4 languages
- English is highlighted

Click "Deutsch":
- Dropdown closes
- Button now shows 🇩🇪 and "DE"
- Nav brand changes to "Diabetes Risiko Rechner"
- Hero title changes to "9-Jahres Diabetes Risiko"

- [ ] **Step 3: Manual test - Persistence**

Refresh the page:
- Language should still be German
- Button shows 🇩🇪 and "DE"

- [ ] **Step 4: Manual test - All languages**

Test switching to:
- French (🇫🇷, "FR")
- Spanish (🇪🇸, "ES")
- English (🇺🇸, "EN")

Verify text updates correctly for each.

- [ ] **Step 5: Test edge cases**

- Close dropdown by clicking outside
- Close dropdown with ESC key
- Verify no errors in console

- [ ] **Step 6: Run existing tests**

```bash
node tests/test-*.js
```

All tests should pass.

- [ ] **Step 7: Final commit**

```bash
git add .
git commit -m "feat(i18n): complete multi-language support with DE, EN, FR, ES"
```

---

## Summary

This implementation adds:
1. 4 translation files (en, de, fr, es)
2. I18n service for language management
3. Language selector UI with dropdown
4. Persistent language preference in localStorage
5. Automatic DOM translation via data-i18n attributes
6. Event-based re-rendering on language change
7. CSS styles matching existing design

All changes maintain backward compatibility and follow existing code patterns.
