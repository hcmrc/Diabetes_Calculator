/**
 * OCR UI Controller - UI-Interaktion fuer OCR Laborbericht Feature
 *
 * Verwaltet Modal, Upload-Workflow, Ergebnis-Anzeige und Import
 *
 * @module DRC.OCRUIController
 */

(function() {
    'use strict';

    window.DRC = window.DRC || {};

    // DOM Element References
    let elements = {};

    // State
    let currentResult = null;
    let currentResults = [];  // For multiple files
    let isProcessing = false;
    let currentFileIndex = 0;
    let totalFilesToProcess = 0;

    /**
     * Cache DOM-Elemente
     */
    function cacheElements() {
        // Modal
        elements.modal = document.getElementById('ocrModal');
        elements.modalClose = document.getElementById('ocrModalClose');
        elements.modalTitle = document.getElementById('ocrModalTitle');

        // Steps
        elements.stepUpload = document.getElementById('ocrStepUpload');
        elements.stepProcessing = document.getElementById('ocrStepProcessing');
        elements.stepReview = document.getElementById('ocrStepReview');
        elements.stepError = document.getElementById('ocrStepError');

        // Upload
        elements.dropzone = document.getElementById('ocrDropzone');
        elements.cameraBtn = document.getElementById('ocrCameraBtn');
        elements.fileInput = document.getElementById('ocrFileInput');
        elements.cameraInput = document.getElementById('ocrCameraInput');

        // Progress
        elements.progressCircle = document.getElementById('ocrProgressCircle');
        elements.progressPercentage = document.getElementById('ocrProgressPercentage');
        elements.stepStatusUpload = document.getElementById('ocrStepStatusUpload');
        elements.stepStatusAnalyze = document.getElementById('ocrStepStatusAnalyze');
        elements.stepStatusExtract = document.getElementById('ocrStepStatusExtract');
        elements.stepStatusValidate = document.getElementById('ocrStepStatusValidate');
        elements.cancelBtn = document.getElementById('ocrCancelBtn');

        // Review
        elements.resultsGrid = document.getElementById('ocrResultsGrid');
        elements.summary = document.getElementById('ocrSummary');
        elements.statDetected = document.getElementById('ocrStatDetected');
        elements.statReview = document.getElementById('ocrStatReview');
        elements.statNotFound = document.getElementById('ocrStatNotFound');
        elements.backBtn = document.getElementById('ocrBackBtn');
        elements.importBtn = document.getElementById('ocrImportBtn');

        // Error
        elements.errorMessage = document.getElementById('ocrErrorMessage');
        elements.manualBtn = document.getElementById('ocrManualBtn');
        elements.retryBtn = document.getElementById('ocrRetryBtn');

        // Patient Drawer Button
        elements.pdOCRBtn = document.getElementById('pdOCRBtn');
        elements.pdImportFile = document.getElementById('ocrFileInput');
    }

    /**
     * Zeigt das Modal an
     */
    function showModal() {
        if (!elements.modal) cacheElements();
        if (elements.modal) {
            elements.modal.style.display = 'flex';
            // Force reflow
            void elements.modal.offsetHeight;
            elements.modal.classList.add('open');
            elements.modal.setAttribute('aria-hidden', 'false');

            // Hide step indicator in main app
            document.body.classList.add('ocr-modal-open');
        }
        showStep('upload');
    }

    /**
     * Versteckt das Modal
     */
    function hideModal() {
        if (!elements.modal) return;
        elements.modal.classList.remove('open');
        elements.modal.setAttribute('aria-hidden', 'true');

        // Show step indicator again
        document.body.classList.remove('ocr-modal-open');

        // Wait for transition to finish before hiding
        setTimeout(() => {
            if (!elements.modal.classList.contains('open')) {
                elements.modal.style.display = 'none';
            }
        }, 300);
        resetState();
    }

    /**
     * Zeigt einen bestimmten Schritt an
     */
    function showStep(stepName) {
        ['upload', 'processing', 'review', 'error'].forEach(step => {
            const el = elements['step' + step.charAt(0).toUpperCase() + step.slice(1)];
            if (el) el.style.display = step === stepName ? 'block' : 'none';
        });

        // Update step titles
        const titles = {
            upload: 'Scan Laboratory Report',
            processing: 'Processing...',
            review: 'Review Values',
            error: 'Processing Error'
        };
        if (elements.modalTitle) {
            elements.modalTitle.innerHTML = `<i data-lucide="${stepName === 'error' ? 'alert-circle' : 'scan-line'}" class="lucide-icon"></i> ${titles[stepName]}`;
            DRC.UIHelpers.refreshIcons();
        }
    }

    /**
     * Reset state
     */
    function resetState() {
        currentResult = null;
        isProcessing = false;
        if (elements.resultsGrid) elements.resultsGrid.innerHTML = '';
        updateProgress(0);
    }

    /**
     * Aktualisiert den Fortschrittsbalken
     */
    function updateProgress(percent) {
        if (!elements.progressCircle) return;
        // Clamp percent to 0-100 range
        percent = Math.max(0, Math.min(100, Math.round(percent)));
        const circumference = 2 * Math.PI * 45;
        const offset = circumference - (percent / 100) * circumference;
        elements.progressCircle.style.strokeDashoffset = offset;
        elements.progressPercentage.textContent = percent + '%';
        elements.progressCircle.parentElement.setAttribute('aria-valuenow', percent);
    }

    /**
     * Aktualisiert den Status-Step
     */
    function updateStepStatus(stepId, status) {
        const step = document.getElementById('ocrStepStatus' + stepId);
        if (!step) return;

        step.classList.remove('active', 'complete');
        if (status === 'active') step.classList.add('active');
        if (status === 'complete') step.classList.add('complete');
    }

    /**
     * Verarbeitet eine Datei
     */
    async function processFile(file) {
        if (!file || isProcessing) return;

        isProcessing = true;
        showStep('processing');
        updateProgress(0);
        updateStepStatus('Upload', 'complete');
        updateStepStatus('Analyze', 'active');

        try {
            const result = await DRC.OCRService.processFile(file, (status) => {
                if (status.status === 'loading_ocr') {
                    updateProgress(40);
                } else if (status.status === 'recognizing text') {
                    updateProgress(40 + Math.round(status.progress * 0.5));
                    updateStepStatus('Extract', 'active');
                }
            });

            updateStepStatus('Analyze', 'complete');
            updateStepStatus('Extract', 'complete');
            updateStepStatus('Validate', 'complete');
            updateProgress(100);

            currentResult = result;
            showReview(result);

        } catch (error) {
            console.error('OCR processing error:', error);
            showError(error.message);
        } finally {
            isProcessing = false;
        }
    }

    /**
     * Verarbeitet mehrere Dateien
     */
    async function processFiles(files) {
        if (!files || files.length === 0 || isProcessing) return;

        isProcessing = true;
        currentFileIndex = 0;
        totalFilesToProcess = files.length;
        currentResults = [];
        showStep('processing');
        updateProgress(0);
        updateStepStatus('Upload', 'complete');
        updateStepStatus('Analyze', 'active');

        try {
            await DRC.OCRService.processFiles(files, (progress) => {
                // Update progress based on overall progress
                updateProgress(progress.overallProgress);

                // Update step labels to show current file
                if (totalFilesToProcess > 1) {
                    updateStepLabel('Analyze', `Analyzing file ${progress.currentFile}/${progress.totalFiles}...`);
                }

                if (progress.status === 'recognizing text') {
                    updateStepStatus('Extract', 'active');
                    if (totalFilesToProcess > 1) {
                        updateStepLabel('Extract', `Extracting values from file ${progress.currentFile}/${progress.totalFiles}...`);
                    }
                }
            }, (fileIndex, result, error) => {
                // File complete callback
                if (result) {
                    currentResults.push(result);
                }
            });

            // After all files processed, show combined results
            updateStepStatus('Analyze', 'complete');
            updateStepStatus('Extract', 'complete');
            updateStepStatus('Validate', 'complete');
            updateProgress(100);

            // Merge results from all files
            const mergedResult = mergeResults(currentResults);
            currentResult = mergedResult;
            showReview(mergedResult);

        } catch (error) {
            console.error('OCR processing error:', error);
            showError(error.message);
        } finally {
            isProcessing = false;
            currentFileIndex = 0;
            totalFilesToProcess = 0;
            // Reset step labels
            resetStepLabels();
        }
    }

    // Helper function to update step labels dynamically
    function updateStepLabel(stepId, label) {
        const step = document.getElementById('ocrStepStatus' + stepId);
        if (step) {
            const labelSpan = step.querySelector('.ocr-step-label');
            if (labelSpan) {
                labelSpan.textContent = label;
            }
        }
    }

    // Helper function to reset step labels to defaults
    function resetStepLabels() {
        const defaultLabels = {
            'Upload': 'Upload complete',
            'Analyze': 'Analyzing image...',
            'Extract': 'Extracting values...',
            'Validate': 'Validating...'
        };

        Object.entries(defaultLabels).forEach(([stepId, label]) => {
            updateStepLabel(stepId, label);
        });
    }

    // Merge results from multiple files - prioritize higher confidence values
    function mergeResults(results) {
        if (results.length === 0) return null;
        if (results.length === 1) return results[0];

        const merged = {
            text: results.map(r => r.text).join('\n---\n'),
            ocrConfidence: results.reduce((sum, r) => sum + r.ocrConfidence, 0) / results.length,
            extracted: { values: {}, confidence: {}, units: {} },
            preview: results[0].preview // Use first file's preview
        };

        // For each field, take the value with highest confidence across all files
        const allFields = ['glucose', 'sbp', 'waist', 'hdl', 'triglycerides', 'age', 'sex', 'patientName'];

        allFields.forEach(field => {
            let bestValue = undefined;
            let bestConfidence = 0;
            let bestUnit = undefined;

            results.forEach(r => {
                const fieldConfidence = r.extracted.confidence[field] || 0;
                if (fieldConfidence > bestConfidence && r.extracted.values[field] !== undefined) {
                    bestConfidence = fieldConfidence;
                    bestValue = r.extracted.values[field];
                    bestUnit = r.extracted.units[field];
                }
            });

            if (bestValue !== undefined) {
                merged.extracted.values[field] = bestValue;
                merged.extracted.confidence[field] = bestConfidence;
                merged.extracted.units[field] = bestUnit;
            }
        });

        return merged;
    }

    /**
     * Zeigt die Ergebnisse an
     */
    function showReview(result) {
        if (!elements.resultsGrid) return;

        const extracted = result.extracted;
        const values = extracted.values;
        const confidence = extracted.confidence;
        const units = extracted.units;

        // Definiere alle moeglichen Felder (patientName ist separat)
        const allFields = ['glucose', 'sbp', 'waist', 'hdl', 'triglycerides', 'age', 'sex'];
        const isMetric = DRC.App?.isMetric?.() ?? false;

        let detected = 0;
        let needsReview = 0;
        let notFound = 0;

        let html = '';

        // Patient name section (separate, at the top)
        const patientName = values.patientName;
        let profileName = patientName || 'Unknown Profile';

        html += `
            <div class="ocr-result-item ${patientName ? 'high' : 'none'}" data-field="patientName">
                <div class="ocr-result-header">
                    <span class="ocr-result-field-name">Profile Name</span>
                    <span class="ocr-result-confidence ${patientName ? 'high' : 'none'}">
                        <i data-lucide="user" class="lucide-icon"></i>
                    </span>
                </div>
                <div class="ocr-result-value-row">
                    <div class="ocr-result-value-box">
                        <input type="text" class="ocr-result-input ${patientName ? 'high' : 'none'}"
                            value="${profileName}" data-field="patientName"
                            id="ocrProfileNameInput"
                            aria-label="Profile Name"
                            placeholder="Profile name"
                        />
                    </div>
                    <label class="ocr-result-include">
                        <input type="checkbox" checked disabled
                            aria-label="Profile will be created automatically"
                        />
                        <span>Auto-create profile</span>
                    </label>
                </div>
            </div>
        `;

        allFields.forEach(field => {
            const value = values[field];
            const conf = confidence[field] || 0;
            const unit = units[field];

            if (value !== undefined && value !== null) {
                if (conf >= 70) detected++;
                else needsReview++;
            } else {
                notFound++;
            }

            const confidenceClass = conf >= 90 ? 'high' : conf >= 70 ? 'medium' : conf >= 50 ? 'low' : 'none';
            const confidenceLabel = conf >= 90 ? 'High confidence' : conf >= 70 ? 'Good confidence' : conf >= 50 ? 'Low confidence - please verify' : 'Not detected';
            const confidenceIcon = conf >= 70 ? 'check-circle' : conf >= 50 ? 'alert-triangle' : 'x-circle';

            const displayUnit = field === 'sex' ? '' : (unit || DRC.LabReportParser.getFieldUnit(field, isMetric));
            const fieldLabel = DRC.LabReportParser.getFieldLabel(field);

            // Generate input HTML - special handling for sex field
            let inputHtml = '';
            if (field === 'sex') {
                // Sex field: use select when not detected, readonly input when detected
                if (value === undefined) {
                    // Not detected: show dropdown with placeholder
                    inputHtml = `
                        <select class="ocr-result-input ${confidenceClass}"
                            data-field="${field}"
                            aria-label="${fieldLabel} value">
                            <option value="">-</option>
                            <option value="0">Female</option>
                            <option value="1">Male</option>
                        </select>
                    `;
                } else {
                    // Detected: show read-only input with detected value
                    const displayValue = value === 1 ? 'Male' : value === 0 ? 'Female' : '';
                    inputHtml = `
                        <input type="text" class="ocr-result-input ${confidenceClass}"
                            value="${displayValue}" data-field="${field}"
                            aria-label="${fieldLabel} value"
                            readonly
                        />
                    `;
                }
            } else {
                // Standard input for other fields
                const inputType = field === 'patientName' ? 'text' : 'number';
                const inputReadonly = field === 'patientName' ? 'readonly' : '';
                const inputStep = field === 'patientName' ? '' : 'step="0.1"';
                const displayValue = value !== undefined ? value : '';
                inputHtml = `
                    <input type="${inputType}" class="ocr-result-input ${confidenceClass}"
                        value="${displayValue}" data-field="${field}"
                        aria-label="${fieldLabel} value" ${inputStep}
                        ${inputReadonly}
                        placeholder="${value === undefined ? 'Enter value' : ''}"
                    />
                `;
            }

            html += `
                <div class="ocr-result-item ${confidenceClass}" data-field="${field}">
                    <div class="ocr-result-header">
                        <span class="ocr-result-field-name">${fieldLabel}</span>
                        <span class="ocr-result-confidence ${confidenceClass}" title="${confidenceLabel}">
                            <i data-lucide="${confidenceIcon}" class="lucide-icon"></i>
                            ${conf > 0 ? conf + '%' : 'N/A'}
                        </span>
                    </div>
                    <div class="ocr-result-value-row">
                        <div class="ocr-result-value-box">
                            ${inputHtml}
                            <span class="ocr-result-unit">${displayUnit}</span>
                        </div>
                        <label class="ocr-result-include">
                            <input type="checkbox" ${value !== undefined ? 'checked' : ''}
                                data-field="${field}" aria-label="Include ${fieldLabel}"
                            />
                            <span>Include</span>
                        </label>
                    </div>
                </div>
            `;
        });

        elements.resultsGrid.innerHTML = html;

        // Update stats
        if (elements.statDetected) elements.statDetected.textContent = detected;
        if (elements.statReview) elements.statReview.textContent = needsReview;
        if (elements.statNotFound) elements.statNotFound.textContent = notFound;
        if (elements.summary) elements.summary.style.display = 'flex';

        // Re-init icons
        DRC.UIHelpers.refreshIcons();

        showStep('review');
    }

    /**
     * Zeigt einen Fehler an
     */
    function showError(message) {
        if (elements.errorMessage) {
            elements.errorMessage.textContent = message || 'Could not process image. Please try again.';
        }
        showStep('error');
    }

    /**
     * Importiert die ausgewaehlten Werte in das Formular
     */
    function importValues() {
        if (!elements.resultsGrid) return;

        const inputs = elements.resultsGrid.querySelectorAll('.ocr-result-input');
        const checkboxes = elements.resultsGrid.querySelectorAll('.ocr-result-include input[type="checkbox"]');

        const valuesToImport = {};

        inputs.forEach((input, index) => {
            const checkbox = checkboxes[index];
            if (checkbox && checkbox.checked) {
                const field = input.dataset.field;
                if (field === 'patientName') {
                    // Skip patientName in values import
                    return;
                }
                if (field === 'sex') {
                    // Parse sex from select or input value
                    let sexValue;
                    if (input.tagName === 'SELECT') {
                        // Dropdown: value is already "0" or "1" or ""
                        sexValue = input.value ? parseInt(input.value, 10) : undefined;
                    } else {
                        // Read-only input: parse display value
                        const valueLower = input.value.trim().toLowerCase();
                        sexValue = valueLower === 'male' ? 1 : valueLower === 'female' ? 0 : undefined;
                    }
                    if (sexValue !== undefined) {
                        valuesToImport[field] = sexValue;
                    }
                } else {
                    const value = parseFloat(input.value);
                    if (!isNaN(value)) {
                        valuesToImport[field] = value;
                    }
                }
            }
        });

        // Werte in Formular uebernehmen
        applyValuesToForm(valuesToImport);

        // Create patient profile automatically (always create on import)
        const profileNameInput = document.getElementById('ocrProfileNameInput');
        const profileName = profileNameInput?.value?.trim() || 'Unknown Profile';

        if (DRC.PatientManager && DRC.PatientManager.addPatient) {
            DRC.PatientManager.addPatient(profileName);
        }

        // Modal schliessen
        hideModal();

        // Notify other modules that import is complete
        window.dispatchEvent(new CustomEvent('drc:import:completed'));
    }

    /**
     * Wendet Werte auf das Formular an
     */
    function applyValuesToForm(values) {
        const fieldMapping = {
            age: 'age-value',
            sex: 'sex-toggle',
            glucose: 'fastGlu-value',
            sbp: 'sbp-value',
            waist: 'waist-value',
            hdl: 'cholHDL-value',
            triglycerides: 'cholTri-value'
        };

        Object.entries(values).forEach(([field, value]) => {
            const inputId = fieldMapping[field];
            if (!inputId) return;

            const input = document.getElementById(inputId);
            if (input) {
                if (field === 'sex') {
                    // Sex ist ein Toggle
                    input.checked = value === 1;
                } else {
                    input.value = value;
                }

                // Event ausloesen fuer UI-Update
                input.dispatchEvent(new Event('change', { bubbles: true }));

                // Visuelles Feedback
                input.classList.add('ocr-populated');
                setTimeout(() => input.classList.remove('ocr-populated'), 2000);
            }
        });

        // Risiko neu berechnen (multimodel-adapted)
        if (DRC.App?.calculate) {
            DRC.App.calculate();
        }
    }

    /**
     * Event Handler Setup
     */
    function bindEvents() {
        if (!elements.modal) cacheElements();

        // Modal schliessen
        if (elements.modalClose) {
            elements.modalClose.addEventListener('click', hideModal);
        }

        // Click auf Overlay schliesst Modal
        if (elements.modal) {
            elements.modal.addEventListener('click', (e) => {
                if (e.target === elements.modal) hideModal();
            });
        }

        // Dropzone
        if (elements.dropzone) {
            elements.dropzone.addEventListener('click', () => {
                if (elements.fileInput) elements.fileInput.click();
            });

            elements.dropzone.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (elements.fileInput) elements.fileInput.click();
                }
            });

            // Drag & Drop
            elements.dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                elements.dropzone.classList.add('drag-over');
            });

            elements.dropzone.addEventListener('dragleave', () => {
                elements.dropzone.classList.remove('drag-over');
            });

            elements.dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                elements.dropzone.classList.remove('drag-over');
                const files = Array.from(e.dataTransfer.files);
                if (files.length > 0) {
                    if (files.length === 1) {
                        processFile(files[0]);
                    } else {
                        processFiles(files);
                    }
                }
            });
        }

        // File Input (for file upload)
        if (elements.fileInput) {
            elements.fileInput.addEventListener('change', (e) => {
                const files = Array.from(e.target.files);
                if (files.length > 0) {
                    if (files.length === 1) {
                        processFile(files[0]);
                    } else {
                        processFiles(files);
                    }
                }
                // Reset input so same files can be selected again
                e.target.value = '';
            });
        }

        // Camera Input (for camera capture)
        if (elements.cameraInput) {
            elements.cameraInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) processFile(file);
                // Reset input so same photo can be taken again
                e.target.value = '';
            });
        }

        // Camera Button
        if (elements.cameraBtn) {
            elements.cameraBtn.addEventListener('click', () => {
                // Use dedicated camera input (ocrCameraInput) which has accept="image/*" capture="environment"
                // This ensures the camera opens instead of file picker (PDF in accept breaks capture)
                if (elements.cameraInput) {
                    elements.cameraInput.click();
                }
            });
        }

        // Cancel Button
        if (elements.cancelBtn) {
            elements.cancelBtn.addEventListener('click', () => {
                isProcessing = false;
                hideModal();
            });
        }

        // Back Button
        if (elements.backBtn) {
            elements.backBtn.addEventListener('click', () => {
                showStep('upload');
            });
        }

        // Import Button
        if (elements.importBtn) {
            elements.importBtn.addEventListener('click', importValues);
        }

        // Error Buttons
        if (elements.manualBtn) {
            elements.manualBtn.addEventListener('click', () => {
                hideModal();
            });
        }

        if (elements.retryBtn) {
            elements.retryBtn.addEventListener('click', () => {
                showStep('upload');
            });
        }

        // Patient Drawer OCR Button
        if (elements.pdOCRBtn) {
            elements.pdOCRBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                // Patient Drawer schliessen falls noetig
                const drawer = document.getElementById('patientDrawer');
                const overlay = document.getElementById('patientOverlay');
                if (drawer) {
                    drawer.classList.remove('open');
                    drawer.style.transform = '';
                }
                if (overlay) {
                    overlay.classList.remove('open');
                    overlay.style.opacity = '0';
                    overlay.style.pointerEvents = 'none';
                }

                showModal();
            });
        }

        // ESC-Taste schliesst Modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && elements.modal && elements.modal.classList.contains('open')) {
                hideModal();
            }
        });
    }

    /**
     * Initialisiert den Controller
     */
    function init() {
        cacheElements();

        // Initial modal verstecken
        if (elements.modal) {
            elements.modal.style.display = 'none';
        }

        bindEvents();

        // Pruefe Unterstuetzung
        if (!DRC.OCRService || !DRC.OCRService.isSupported()) {
            if (elements.pdOCRBtn) {
                elements.pdOCRBtn.style.display = 'none';
            }
            // OCR not supported on this device
        }
    }

    // Public API
    DRC.OCRUIController = {
        init: init,
        showModal: showModal,
        hideModal: hideModal,
        processFile: processFile,
        processFiles: processFiles
    };

    // Auto-initialisieren wenn DOM bereit
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
