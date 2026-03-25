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
            "nav": { "brand": "Diabetes Risk Calculator", "reset": "Reset", "riskTimeline": "Risk Timeline", "selectProfile": "Select Profile", "language": "Select Language" },
            "hero": { "title": "9-Year Diabetes Risk", "expandLabel": "What does that mean?", "subtitle": "Based on the ARIC Study logistic regression model (Schmidt et al. 2005)" },
            "factors": { "age": "Age", "sex": "Sex", "race": "Ethnicity", "parentHist": "Parental Diabetes", "sbp": "Blood Pressure", "waist": "Waist", "height": "Height", "fastGlu": "Fasting Glucose", "cholHDL": "HDL Cholesterol", "cholTri": "Blood Fats (Triglycerides)" },
            "units": { "years": "years", "male": "Male", "female": "Female", "other": "Other", "black": "Black", "yes": "Yes", "no": "No", "us": "US", "si": "SI" },
            "sections": { "demographic": "Demographic Data", "clinical": "Clinical Data", "treatments": "Treatment Recommendations", "contributions": "Risk Factor Contributions" },
            "summary": { "age": "Age", "glucose": "Glucose", "waist": "Waist", "bp": "Blood Pressure", "hdl": "HDL", "tg": "TG" },
            "treatments": {
                "fastGlu": { "title": "Fasting Glucose Management", "therapy1_name": "Standard Medication", "therapy1_desc": "Metformin is often the first step to help control blood sugar levels.", "therapy2_name": "Heart & Kidney Protection", "therapy2_desc": "If you have heart or kidney concerns, ask your doctor about newer medications that specifically protect these organs (SGLT2 inhibitors or GLP-1) while also supporting weight loss." },
                "sbp": { "title": "Blood Pressure Control", "therapy1_name": "Combination Medications", "therapy1_desc": "It is recommend to start with a combination of different blood pressure medications (e.g. RAS inhibitors and CCBs).", "therapy2_name": "Heart-Healthy Diet", "therapy2_desc": "Restriction of alcohol and sodium consumption, increased consumption of vegetables, use of low-fat dairy products can lower blood pressure naturally." },
                "cholHDL": { "title": "HDL Cholesterol Improvement", "therapy1_name": "Regular Exercise", "therapy1_desc": "Aim for 150 minutes per week of activity like brisk walking, or 75 minutes of intense exercise.", "therapy2_name": "Medication", "therapy2_desc": "CETP inhibitors and Cholesterol-lowering medication (Statins) can also help to raise HDL." },
                "cholTri": { "title": "Blood Fats (Triglycerides) Treatment", "therapy1_name": "Healthy Lifestyle", "therapy1_desc": "Stopping smoking and eating healthy fats (olive oil, nuts, fish) all help and should be done first.", "therapy2_name": "Prescription Fish Oil", "therapy2_desc": "If blood fats (triglycerides) remain high, special prescription fish oil (icosapent ethyl) might be considered.", "therapy3_name": "Medication", "therapy3_desc": "Fibrate or Cholesterol lowering medication (Statins) can also help to reduce triglycerides." },
                "waist": { "title": "Weight Management", "therapy1_name": "Diet & Exercise", "therapy1_desc": "Reducing daily calories and exercising more leads to steady weight loss.", "therapy2_name": "Medications", "therapy2_desc": "Glucose-lowering drugs with additional weight-reducing effects (e.g. GLP-1RA) can also help.", "surgical": "Surgical Options", "surgical_desc": "For significant obesity with health problems, weight-loss surgery may be discussed." }
            },
            "buttons": { "simulate": "Simulate Treatment", "simulateActive": "Simulating...", "save": "Save", "cancel": "Cancel", "continue": "Continue", "createProfile": "Create Profile", "add": "Add", "export": "Export .xlsx / .drc", "import": "Import .xlsx / .drc", "scan": "Scan Lab Report" },
            "patientManager": { "title": "My Profiles", "activeProfile": "Active Profile", "noProfile": "No profile selected", "savedProfiles": "Saved Profiles", "addNew": "Add New Profile", "placeholder": "Profile name...", "empty": "No profiles saved yet.", "importExport": "Import / Export / OCR" },
            "timeline": { "title": "Risk Timeline", "hint": "Simulate treatments to track risk changes over time", "setBaseline": "Set Baseline", "snapshot": "Snapshot", "empty": "Set a baseline and add snapshots to track your risk over scenarios." },
            "modals": { "profileWarning": { "title": "Save Your Data?", "message": "You haven't created a profile yet. If you continue, your current data won't be saved.", "create": "Create Profile", "continue": "Continue Without Saving" }, "ocr": { "title": "Scan Lab Report", "instructions": "Take a photo or upload your lab report", "camera": "Camera", "upload": "Upload File", "review": "Review Results", "confidence_high": "High confidence", "confidence_medium": "Medium confidence", "confidence_low": "Low confidence" } }
        },
        de: {
            "_meta": { "language": "Deutsch", "code": "de" },
            "nav": { "brand": "Diabetes Risiko Rechner", "reset": "Zurücksetzen", "riskTimeline": "Risiko Zeitlinie", "selectProfile": "Profil wählen", "language": "Sprache wählen" },
            "hero": { "title": "9-Jahres Diabetes Risiko", "expandLabel": "Was bedeutet das?", "subtitle": "Basierend auf dem ARIC-Studie logistischen Regressionsmodell (Schmidt et al. 2005)" },
            "factors": { "age": "Alter", "sex": "Geschlecht", "race": "Ethnizität", "parentHist": "Elterlicher Diabetes", "sbp": "Blutdruck", "waist": "Taillenumfang", "height": "Körpergröße", "fastGlu": "Nüchternglukose", "cholHDL": "HDL Cholesterin", "cholTri": "Blutfette (Triglyceride)" },
            "units": { "years": "Jahre", "male": "Männlich", "female": "Weiblich", "other": "Andere", "black": "Schwarz", "yes": "Ja", "no": "Nein", "us": "US", "si": "SI" },
            "sections": { "demographic": "Demografische Daten", "clinical": "Klinische Daten", "treatments": "Behandlungsempfehlungen", "contributions": "Risikofaktor-Beiträge" },
            "summary": { "age": "Alter", "glucose": "Glukose", "waist": "Taille", "bp": "Blutdruck", "hdl": "HDL", "tg": "TG" },
            "treatments": {
                "fastGlu": { "title": "Nüchternglukose Management", "therapy1_name": "Standard Medikation", "therapy1_desc": "Metformin ist oft der erste Schritt, um den Blutzuckerspiegel zu kontrollieren.", "therapy2_name": "Herz- & Nierenschutz", "therapy2_desc": "Wenn Sie Herz- oder Nierenprobleme haben, fragen Sie Ihren Arzt nach neueren Medikamenten, die diese Organe speziell schützen (SGLT2-Inhibitoren oder GLP-1) und gleichzeitig das Gewicht reduzieren." },
                "sbp": { "title": "Blutdruckkontrolle", "therapy1_name": "Kombinationsmedikamente", "therapy1_desc": "Es wird empfohlen, mit einer Kombination verschiedener Blutdruckmedikamente zu beginnen (z.B. RAS-Hemmer und CCBs).", "therapy2_name": "Herzgesunde Ernährung", "therapy2_desc": "Die Reduzierung von Alkohol- und Natriumkonsum, erhöhter Gemüsekonsum und die Verwendung von fettarmen Milchprodukten können den Blutdruck natürlich senken." },
                "cholHDL": { "title": "HDL Cholesterin Verbesserung", "therapy1_name": "Regelmäßige Bewegung", "therapy1_desc": "Zielen Sie auf 150 Minuten pro Woche Aktivität wie zügiges Gehen oder 75 Minuten intensives Training.", "therapy2_name": "Medikation", "therapy2_desc": "CETP-Inhibitoren und cholesterinsenkende Medikamente (Statine) können auch helfen, das HDL zu erhöhen." },
                "cholTri": { "title": "Blutfette (Triglyceride) Behandlung", "therapy1_name": "Gesunder Lebensstil", "therapy1_desc": "Mit dem Rauchen aufhören und gesunde Fette (Olivenöl, Nüsse, Fisch) essen, das hilft alles und sollte zuerst getan werden.", "therapy2_name": "Verschreibungspflichtiges Fischöl", "therapy2_desc": "Wenn die Blutfette (Triglyceride) weiterhin hoch bleiben, kann spezielles verschreibungspflichtiges Fischöl (Icosapent Ethyl) in Betracht gezogen werden.", "therapy3_name": "Medikation", "therapy3_desc": "Fibrate oder cholesterinsenkende Medikamente (Statine) können auch helfen, die Triglyceride zu reduzieren." },
                "waist": { "title": "Gewichtsmanagement", "therapy1_name": "Ernährung & Bewegung", "therapy1_desc": "Die Reduzierung der täglichen Kalorien und mehr Bewegung führt zu stetigem Gewichtsverlust.", "therapy2_name": "Medikamente", "therapy2_desc": "Glukose-senkende Medikamente mit zusätzlichen gewichtsreduzierenden Effekten (z.B. GLP-1RA) können auch helfen.", "surgical": "Chirurgische Optionen", "surgical_desc": "Bei signifikanter Adipositas mit gesundheitlichen Problemen kann eine Gewichtsabnahmechirurgie diskutiert werden." }
            },
            "buttons": { "simulate": "Behandlung simulieren", "simulateActive": "Simuliere...", "save": "Speichern", "cancel": "Abbrechen", "continue": "Weiter", "createProfile": "Profil erstellen", "add": "Hinzufügen", "export": "Export .xlsx / .drc", "import": "Import .xlsx / .drc", "scan": "Labbericht scannen" },
            "patientManager": { "title": "Meine Profile", "activeProfile": "Aktives Profil", "noProfile": "Kein Profil ausgewählt", "savedProfiles": "Gespeicherte Profile", "addNew": "Neues Profil hinzufügen", "placeholder": "Profilname...", "empty": "Noch keine Profile gespeichert.", "importExport": "Import / Export / OCR" },
            "timeline": { "title": "Risiko Zeitlinie", "hint": "Simulieren Sie Behandlungen, um Risikoänderungen im Zeitverlauf zu verfolgen", "setBaseline": "Basislinie setzen", "snapshot": "Schnappschuss", "empty": "Setzen Sie eine Basislinie und fügen Sie Schnappschüsse hinzu, um Ihr Risiko über Szenarien zu verfolgen." },
            "modals": { "profileWarning": { "title": "Daten speichern?", "message": "Sie haben noch kein Profil erstellt. Wenn Sie fortfahren, werden Ihre aktuellen Daten nicht gespeichert.", "create": "Profil erstellen", "continue": "Ohne Speichern fortfahren" }, "ocr": { "title": "Labbericht scannen", "instructions": "Machen Sie ein Foto oder laden Sie Ihren Labbericht hoch", "camera": "Kamera", "upload": "Datei hochladen", "review": "Ergebnisse prüfen", "confidence_high": "Hohe Konfidenz", "confidence_medium": "Mittlere Konfidenz", "confidence_low": "Niedrige Konfidenz" } }
        },
        fr: {
            "_meta": { "language": "Français", "code": "fr" },
            "nav": { "brand": "Calculateur de Risque Diabète", "reset": "Réinitialiser", "riskTimeline": "Chronologie du Risque", "selectProfile": "Sélectionner Profil", "language": "Choisir la Langue" },
            "hero": { "title": "Risque Diabète 9 Ans", "expandLabel": "Qu'est-ce que cela signifie?", "subtitle": "Basé sur le modèle de régression logistique de l'étude ARIC (Schmidt et al. 2005)" },
            "factors": { "age": "Âge", "sex": "Sexe", "race": "Ethnicité", "parentHist": "Diabète Parental", "sbp": "Pression Artérielle", "waist": "Tour de Taille", "height": "Taille", "fastGlu": "Glycémie à Jeun", "cholHDL": "Cholestérol HDL", "cholTri": "Graisses Sanguines (Triglycérides)" },
            "units": { "years": "ans", "male": "Homme", "female": "Femme", "other": "Autre", "black": "Noir", "yes": "Oui", "no": "Non", "us": "US", "si": "SI" },
            "sections": { "demographic": "Données Démographiques", "clinical": "Données Cliniques", "treatments": "Recommandations de Traitement", "contributions": "Contributions des Facteurs de Risque" },
            "summary": { "age": "Âge", "glucose": "Glucose", "waist": "Taille", "bp": "Pression artérielle", "hdl": "HDL", "tg": "TG" },
            "treatments": {
                "fastGlu": { "title": "Gestion de la Glycémie à Jeun", "therapy1_name": "Médication Standard", "therapy1_desc": "La metformine est souvent la première étape pour aider à contrôler la glycémie.", "therapy2_name": "Protection Cardiaque & Rénale", "therapy2_desc": "Si vous avez des problèmes cardiaques ou rénaux, demandez à votre médecin des médicaments plus récents qui protègent spécifiquement ces organes (inhibiteurs SGLT2 ou GLP-1) tout en favorisant la perte de poids." },
                "sbp": { "title": "Contrôle de la Pression Artérielle", "therapy1_name": "Médicaments Combinés", "therapy1_desc": "Il est recommandé de commencer avec une combinaison de différents médicaments contre l'hypertension (par exemple inhibiteurs RAS et CCB).", "therapy2_name": "Régime Cardioprotecteur", "therapy2_desc": "La restriction de l'alcool et du sodium, la consommation accrue de légumes et l'utilisation de produits laitiers faibles en gras peuvent abaisser la pression artérielle naturellement." },
                "cholHDL": { "title": "Amélioration du Cholestérol HDL", "therapy1_name": "Exercice Régulier", "therapy1_desc": "Visez 150 minutes par semaine d'activité comme la marche rapide, ou 75 minutes d'exercice intense.", "therapy2_name": "Médication", "therapy2_desc": "Les inhibiteurs de CETP et les médicaments hypocholestérolémiants (statines) peuvent également aider à augmenter le HDL." },
                "cholTri": { "title": "Traitement des Graisses Sanguines (Triglycérides)", "therapy1_name": "Mode de Vie Sain", "therapy1_desc": "Arrêter de fumer et manger des graisses saines (huile d'olive, noix, poisson) aident tous et devraient être faits en premier.", "therapy2_name": "Huile de Poisson sur Ordonnance", "therapy2_desc": "Si les graisses sanguines (triglycérides) restent élevées, une huile de poisson spéciale sur ordonnance (éthyle d'icosapent) pourrait être envisagée.", "therapy3_name": "Médication", "therapy3_desc": "Les fibrates ou les médicaments hypocholestérolémiants (statines) peuvent également aider à réduire les triglycérides." },
                "waist": { "title": "Gestion du Poids", "therapy1_name": "Régime & Exercice", "therapy1_desc": "Réduire les calories quotidiennes et faire plus d'exercice conduit à une perte de poids régulière.", "therapy2_name": "Médicaments", "therapy2_desc": "Les médicaments réduisant le glucose avec des effets supplémentaires de réduction du poids (par exemple GLP-1RA) peuvent également aider.", "surgical": "Options Chirurgicales", "surgical_desc": "Pour une obésité significative avec des problèmes de santé, une chirurgie de perte de poids peut être envisagée." }
            },
            "buttons": { "simulate": "Simuler Traitement", "simulateActive": "Simulation...", "save": "Enregistrer", "cancel": "Annuler", "continue": "Continuer", "createProfile": "Créer Profil", "add": "Ajouter", "export": "Exporter .xlsx / .drc", "import": "Importer .xlsx / .drc", "scan": "Scanner Rapport Labo" },
            "patientManager": { "title": "Mes Profils", "activeProfile": "Profil Actif", "noProfile": "Aucun profil sélectionné", "savedProfiles": "Profils Enregistrés", "addNew": "Ajouter Nouveau Profil", "placeholder": "Nom du profil...", "empty": "Aucun profil enregistré pour l'instant.", "importExport": "Import / Export / OCR" },
            "timeline": { "title": "Chronologie du Risque", "hint": "Simulez des traitements pour suivre les changements de risque au fil du temps", "setBaseline": "Définir Base", "snapshot": "Instantané", "empty": "Définissez une base et ajoutez des instantanés pour suivre votre risque à travers les scénarios." },
            "modals": { "profileWarning": { "title": "Enregistrer vos Données?", "message": "Vous n'avez pas encore créé de profil. Si vous continuez, vos données actuelles ne seront pas sauvegardées.", "create": "Créer Profil", "continue": "Continuer Sans Sauvegarder" }, "ocr": { "title": "Scanner Rapport Labo", "instructions": "Prenez une photo ou téléchargez votre rapport de laboratoire", "camera": "Caméra", "upload": "Télécharger Fichier", "review": "Vérifier Résultats", "confidence_high": "Confiance élevée", "confidence_medium": "Confiance moyenne", "confidence_low": "Confiance faible" } }
        },
        es: {
            "_meta": { "language": "Español", "code": "es" },
            "nav": { "brand": "Calculadora de Riesgo Diabetes", "reset": "Restablecer", "riskTimeline": "Línea Temporal de Riesgo", "selectProfile": "Seleccionar Perfil", "language": "Seleccionar Idioma" },
            "hero": { "title": "Riesgo Diabetes 9 Años", "expandLabel": "¿Qué significa eso?", "subtitle": "Basado en el modelo de regresión logística del Estudio ARIC (Schmidt et al. 2005)" },
            "factors": { "age": "Edad", "sex": "Sexo", "race": "Etnicidad", "parentHist": "Diabetes Parental", "sbp": "Presión Arterial", "waist": "Cintura", "height": "Altura", "fastGlu": "Glucosa en Ayunas", "cholHDL": "Colesterol HDL", "cholTri": "Grasas Sanguíneas (Triglicéridos)" },
            "units": { "years": "años", "male": "Hombre", "female": "Mujer", "other": "Otro", "black": "Negro", "yes": "Sí", "no": "No", "us": "US", "si": "SI" },
            "sections": { "demographic": "Datos Demográficos", "clinical": "Datos Clínicos", "treatments": "Recomendaciones de Tratamiento", "contributions": "Contribuciones de Factores de Riesgo" },
            "summary": { "age": "Edad", "glucose": "Glucosa", "waist": "Cintura", "bp": "Presión arterial", "hdl": "HDL", "tg": "TG" },
            "treatments": {
                "fastGlu": { "title": "Manejo de Glucosa en Ayunas", "therapy1_name": "Medicación Estándar", "therapy1_desc": "La metformina es a menudo el primer paso para ayudar a controlar los niveles de azúcar en sangre.", "therapy2_name": "Protección Cardíaca y Renal", "therapy2_desc": "Si tiene problemas cardíacos o renales, pregúntele a su médico sobre medicamentos más nuevos que protegen específicamente estos órganos (inhibidores SGLT2 o GLP-1) mientras también apoyan la pérdida de peso." },
                "sbp": { "title": "Control de Presión Arterial", "therapy1_name": "Medicamentos Combinados", "therapy1_desc": "Se recomienda comenzar con una combinación de diferentes medicamentos para la presión arterial (por ejemplo, inhibidores RAS y CCB).", "therapy2_name": "Dieta Cardiosaludable", "therapy2_desc": "La restricción del alcohol y del consumo de sodio, el aumento del consumo de verduras y el uso de productos lácteos bajos en grasa pueden reducir la presión arterial naturalmente." },
                "cholHDL": { "title": "Mejora del Colesterol HDL", "therapy1_name": "Ejercicio Regular", "therapy1_desc": "Apunte a 150 minutos por semana de actividad como caminar rápido, o 75 minutos de ejercicio intenso.", "therapy2_name": "Medicación", "therapy2_desc": "Los inhibidores de CETP y los medicamentos reductores de colesterol (estatinas) también pueden ayudar a aumentar el HDL." },
                "cholTri": { "title": "Tratamiento de Grasas Sanguíneas (Triglicéridos)", "therapy1_name": "Estilo de Vida Saludable", "therapy1_desc": "Dejar de fumar y comer grasas saludables (aceite de oliva, nueces, pescado) ayuda y debería hacerse primero.", "therapy2_name": "Aceite de Pescado Recetado", "therapy2_desc": "Si las grasas sanguíneas (triglicéridos) permanecen altas, podría considerarse un aceite de pescado especial recetado (etilo de icosapent).", "therapy3_name": "Medicación", "therapy3_desc": "Los fibratos o los medicamentos reductores de colesterol (estatinas) también pueden ayudar a reducir los triglicéridos." },
                "waist": { "title": "Manejo del Peso", "therapy1_name": "Dieta y Ejercicio", "therapy1_desc": "Reducir las calorías diarias y hacer más ejercicio lleva a una pérdida de peso constante.", "therapy2_name": "Medicamentos", "therapy2_desc": "Los medicamentos reductores de glucosa con efectos adicionales de reducción de peso (por ejemplo GLP-1RA) también pueden ayudar.", "surgical": "Opciones Quirúrgicas", "surgical_desc": "Para obesidad significativa con problemas de salud, puede discutirse la cirugía de pérdida de peso." }
            },
            "buttons": { "simulate": "Simular Tratamiento", "simulateActive": "Simulando...", "save": "Guardar", "cancel": "Cancelar", "continue": "Continuar", "createProfile": "Crear Perfil", "add": "Agregar", "export": "Exportar .xlsx / .drc", "import": "Importar .xlsx / .drc", "scan": "Escanear Informe Lab" },
            "patientManager": { "title": "Mis Perfiles", "activeProfile": "Perfil Activo", "noProfile": "Ningún perfil seleccionado", "savedProfiles": "Perfiles Guardados", "addNew": "Agregar Nuevo Perfil", "placeholder": "Nombre del perfil...", "empty": "Aún no hay perfiles guardados.", "importExport": "Importar / Exportar / OCR" },
            "timeline": { "title": "Línea Temporal de Riesgo", "hint": "Simule tratamientos para rastrear cambios de riesgo a lo largo del tiempo", "setBaseline": "Establecer Base", "snapshot": "Instantánea", "empty": "Establezca una base y agregue instantáneas para rastrear su riesgo a través de escenarios." },
            "modals": { "profileWarning": { "title": "¿Guardar sus Datos?", "message": "Aún no ha creado un perfil. Si continúa, sus datos actuales no se guardarán.", "create": "Crear Perfil", "continue": "Continuar Sin Guardar" }, "ocr": { "title": "Escanear Informe Lab", "instructions": "Tome una foto o suba su informe de laboratorio", "camera": "Cámara", "upload": "Subir Archivo", "review": "Revisar Resultados", "confidence_high": "Alta confianza", "confidence_medium": "Confianza media", "confidence_low": "Baja confianza" } }
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
