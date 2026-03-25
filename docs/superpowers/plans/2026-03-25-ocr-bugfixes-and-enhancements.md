# OCR Bugfixes & Feature Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix OCR progress percentage bug, enable multiple file upload, and hide the main app step indicator when OCR modal is open.

**Architecture:** Minimal changes to existing OCR module structure. Progress calculation fix in UI controller, sequential batch processing for multiple files in service layer, CSS-based visibility toggle for step indicator.

**Tech Stack:** Vanilla JavaScript (no ES modules), DRC namespace pattern, CSS class toggling

**CRITICAL CONTEXT from CODEBASE_MEMORY.md:**
- Script load order must NOT change
- After `innerHTML` changes with icons → call `DRC.UIHelpers.refreshIcons()`
- All modules under `window.DRC` namespace
- Tests must remain passing (481 tests)

---

## File Mapping

| File | Purpose | Changes |
|------|---------|---------|
| `js/ocr-ui-controller.js` | UI handling for OCR modal | Fix progress calculation, add multiple file handling, toggle body class |
| `js/ocr-service.js` | OCR processing service | Add `processFiles()` batch function |
| `index.html` | HTML markup | Add `multiple` attribute to file input |
| `style.css` | Styles | Add rule to hide `.col-step-label` when modal open |

---

## Task 1: Fix Progress Percentage Calculation

**Files:**
- Modify: `js/ocr-ui-controller.js:174`

**Bug:** The progress calculation multiplies by 50 instead of 0.5, causing 40-5040% display instead of 40-90%.

- [ ] **Step 1: Fix the calculation**

```javascript
// Line 174 in processFile callback:
// BEFORE:
updateProgress(40 + Math.round(status.progress * 50));

// AFTER:
updateProgress(40 + Math.round(status.progress * 0.5));
```

- [ ] **Step 2: Commit**

```bash
git add js/ocr-ui-controller.js
git commit -m "fix: correct OCR progress percentage calculation

The progress was incorrectly multiplied by 50 instead of 0.5,
causing percentage values to reach 5000%+ instead of 40-90%.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Add Progress Clamping

**Files:**
- Modify: `js/ocr-ui-controller.js:136-143`

**Purpose:** Ensure progress never exceeds 0-100 range.

- [ ] **Step 1: Update updateProgress function**

```javascript
// Lines 136-143 in updateProgress function:
// BEFORE:
function updateProgress(percent) {
    if (!elements.progressCircle) return;
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (percent / 100) * circumference;
    elements.progressCircle.style.strokeDashoffset = offset;
    elements.progressPercentage.textContent = percent + '%';
    elements.progressCircle.parentElement.setAttribute('aria-valuenow', percent);
}

// AFTER:
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
```

- [ ] **Step 2: Commit**

```bash
git add js/ocr-ui-controller.js
git commit -m "fix: add progress percentage clamping

Prevents display of negative or >100% progress values.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Enable Multiple File Upload (HTML)

**Files:**
- Modify: `index.html:137`

- [ ] **Step 1: Add multiple attribute to file input**

```html
<!-- Line 137 in index.html -->
<!-- BEFORE: -->
<input type="file" id="ocrFileInput" accept="image/*,.pdf" class="visually-hidden" aria-label="Upload laboratory report file" />

<!-- AFTER: -->
<input type="file" id="ocrFileInput" accept="image/*,.pdf" multiple class="visually-hidden" aria-label="Upload laboratory report file(s)" />
```

Note: Camera input (line 135) does NOT get `multiple` attribute since camera captures single images.

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: enable multiple file selection for OCR

Add 'multiple' attribute to file input to allow batch upload
of laboratory reports.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Add Batch Processing to OCR Service

**Files:**
- Modify: `js/ocr-service.js` (after line 265, before public API)

- [ ] **Step 1: Add processFiles function**

Add this function after the `processFile` function (around line 265):

```javascript
/**
 * Processes multiple files sequentially
 * @param {FileList} files - Files to process
 * @param {Function} onProgress - Callback({ currentFile, totalFiles, fileProgress, overallProgress })
 * @param {Function} onFileComplete - Callback(fileIndex, result)
 * @returns {Promise<Array>} Results for all files
 */
async function processFiles(files, onProgress, onFileComplete) {
    if (!files || files.length === 0) {
        throw new Error('No files provided');
    }

    const results = [];
    const totalFiles = files.length;

    for (let i = 0; i < totalFiles; i++) {
        const file = files[i];

        // Calculate overall progress: previous files + current file progress
        const calculateOverallProgress = (fileProgress) => {
            const previousFilesProgress = (i / totalFiles) * 100;
            const currentFileContribution = (fileProgress / 100) * (100 / totalFiles);
            return Math.round(previousFilesProgress + currentFileContribution);
        };

        const fileProgressCallback = (status) => {
            if (onProgress) {
                onProgress({
                    currentFile: i + 1,
                    totalFiles: totalFiles,
                    fileName: file.name,
                    fileProgress: status.progress,
                    overallProgress: calculateOverallProgress(status.progress),
                    status: status.status
                });
            }
        };

        try {
            const result = await processFile(file, fileProgressCallback);
            results.push({ success: true, file: file.name, result: result });
            if (onFileComplete) {
                onFileComplete(i, result);
            }
        } catch (error) {
            results.push({ success: false, file: file.name, error: error.message });
            if (onFileComplete) {
                onFileComplete(i, null, error);
            }
            // Continue with next file instead of failing completely
        }
    }

    return results;
}
```

- [ ] **Step 2: Expose processFiles in public API**

Update lines 290-298 (public API section):

```javascript
// BEFORE:
DRC.OCRService = {
    processFile: processFile,
    terminate: terminate,
    isSupported: isSupported,
    // Exposed fuer Testing
    _loadTesseract: loadTesseract,
    _pdfToImage: pdfToImage,
    _compressImage: compressImage
};

// AFTER:
DRC.OCRService = {
    processFile: processFile,
    processFiles: processFiles,
    terminate: terminate,
    isSupported: isSupported,
    // Exposed fuer Testing
    _loadTesseract: loadTesseract,
    _pdfToImage: pdfToImage,
    _compressImage: compressImage
};
```

- [ ] **Step 3: Commit**

```bash
git add js/ocr-service.js
git commit -m "feat: add batch file processing to OCR service

Add processFiles() function for sequential processing of multiple
lab reports with progress tracking per file and overall progress.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Update UI Controller for Multiple Files

**Files:**
- Modify: `js/ocr-ui-controller.js`

- [ ] **Step 1: Add state variables for batch processing**

After line 19 (state section):

```javascript
// State
let currentResult = null;
let currentResults = [];  // For multiple files
let isProcessing = false;
let currentFileIndex = 0;
let totalFilesToProcess = 0;
```

- [ ] **Step 2: Create processFiles wrapper function**

Add after the existing `processFile` function (around line 193):

```javascript
/**
 * Verarbeitet eine oder mehrere Dateien
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
    const allFields = ['glucose', 'hba1c', 'sbp', 'waist', 'hdl', 'triglycerides', 'age', 'sex'];

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
```

- [ ] **Step 3: Update file input event handler**

Update lines 409-417 (file input event handler):

```javascript
// BEFORE:
if (elements.fileInput) {
    elements.fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) processFile(file);
        // Reset input so same file can be selected again
        e.target.value = '';
    });
}

// AFTER:
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
```

- [ ] **Step 4: Update drag and drop handler**

Update lines 401-406 (drag and drop handler):

```javascript
// BEFORE (line 404):
const file = e.dataTransfer.files[0];
if (file) processFile(file);

// AFTER:
const files = Array.from(e.dataTransfer.files);
if (files.length > 0) {
    if (files.length === 1) {
        processFile(files[0]);
    } else {
        processFiles(files);
    }
}
```

- [ ] **Step 5: Commit**

```bash
git add js/ocr-ui-controller.js
git commit -m "feat: add multiple file upload support to OCR UI

Add processFiles wrapper, mergeResults for combining multiple
file results, update event handlers to support file arrays.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 6: Hide Step Indicator During OCR Modal

**Files:**
- Modify: `style.css`

- [ ] **Step 1: Add CSS rule for hiding step indicator**

Add after line 510 (near other `.col-step-label` styles):

```css
/* ============================================
   OCR MODAL - Hide step indicator when open
   ============================================ */

body.ocr-modal-open .col-step-label {
    display: none;
}
```

- [ ] **Step 2: Commit**

```bash
git add style.css
git commit -m "style: hide col-step-label when OCR modal is open

Add CSS rule to hide the main app step indicator ('Your Data',
'Risk Analysis', 'Take Action' labels) when OCR modal is active.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 7: Toggle Body Class in Modal Functions

**Files:**
- Modify: `js/ocr-ui-controller.js:73-99`

- [ ] **Step 1: Update showModal to add body class**

Update lines 73-83:

```javascript
// BEFORE:
function showModal() {
    if (!elements.modal) cacheElements();
    if (elements.modal) {
        elements.modal.style.display = 'flex';
        // Force reflow
        void elements.modal.offsetHeight;
        elements.modal.classList.add('open');
        elements.modal.setAttribute('aria-hidden', 'false');
    }
    showStep('upload');
}

// AFTER:
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
```

- [ ] **Step 2: Update hideModal to remove body class**

Update lines 88-99:

```javascript
// BEFORE:
function hideModal() {
    if (!elements.modal) return;
    elements.modal.classList.remove('open');
    elements.modal.setAttribute('aria-hidden', 'true');
    // Wait for transition to finish before hiding
    setTimeout(() => {
        if (!elements.modal.classList.contains('open')) {
            elements.modal.style.display = 'none';
        }
    }, 300);
    resetState();
}

// AFTER:
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
```

- [ ] **Step 3: Commit**

```bash
git add js/ocr-ui-controller.js
git commit -m "feat: toggle step indicator visibility with OCR modal

Add/remove 'ocr-modal-open' body class in showModal/hideModal
to control visibility of main app step indicator.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 8: Run Tests and Validate

**Files:**
- All modified files

- [ ] **Step 1: Run test suite**

```bash
node tests/test-*.js
```

Expected: All 481 tests pass (or existing test count)

- [ ] **Step 2: Manual verification checklist**

Test in browser:
- [ ] Single file upload still works
- [ ] Progress percentage shows 0-100% (not word count)
- [ ] Multiple files (2-3) can be selected and process sequentially
- [ ] Step indicator hides when OCR modal opens
- [ ] Step indicator reappears when OCR modal closes
- [ ] Error in one file doesn't break entire batch

- [ ] **Step 3: Final commit if all tests pass**

```bash
git add -A
git commit -m "test: verify all OCR fixes and enhancements

All tests passing. Features validated:
- Progress percentage fixed and clamped
- Multiple file upload working
- Step indicator visibility toggle working

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Summary of Changes

| File | Lines Changed | Description |
|------|---------------|-------------|
| `js/ocr-ui-controller.js` | ~80 | Progress fix, multiple file support, body class toggle |
| `js/ocr-service.js` | ~60 | processFiles() batch function |
| `index.html` | 1 | Add `multiple` attribute |
| `style.css` | 4 | Hide `.col-step-label` rule |

---

## Rollback Plan

If issues arise:

```bash
# Revert specific commits in reverse order:
git revert HEAD          # Task 7
git revert HEAD~1        # Task 6
git revert HEAD~2        # Task 5
git revert HEAD~3        # Task 4
git revert HEAD~4        # Task 3
git revert HEAD~5        # Task 2
git revert HEAD~6        # Task 1
```

---

## Post-Implementation Documentation

After completion, update agent database:

**File:** `memory/agent-db/2026-03-25_ocr-bugfixes-multiple-files.md`

```markdown
# Aktion: OCR Bugfixes - Progress %, Multiple Files, Step Indicator

## Dateien
- Modified: js/ocr-ui-controller.js, js/ocr-service.js, index.html, style.css

## Learnings
- Progress calculation: status.progress is already 0-100, multiply by 0.5 not 50
- Multiple files: Sequential processing better than parallel for Tesseract.js (memory)
- Step indicator: CSS class on body simplest approach

## Risiken
- Keine Breaking Changes - backward compatible
- Single file upload continues to work
- All existing tests pass
```
