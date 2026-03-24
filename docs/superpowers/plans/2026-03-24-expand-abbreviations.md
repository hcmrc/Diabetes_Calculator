# Abbreviations Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all abbreviations in the UI with full text for better clarity - "Pre-Diab." → "Prediabetes" and expand summary labels like "Gluc:", "BP:", "hist." etc.

**Architecture:** Simple text replacements in HTML and JavaScript. No architectural changes - purely presentational improvements.

**Tech Stack:** Vanilla HTML/JS, no dependencies.

---

## File Structure

| File | Purpose | Changes |
|------|---------|---------|
| `index.html` | Main UI template | Line 320: "Pre-Diab." → "Prediabetes" |
| `js/ui-controller.js` | Summary text generation | Lines 633, 688-692: Expand abbreviations |
| `tests/test-ui-controller.js` | Unit tests | Lines 333, 359-363: Update test assertions |

---

## Task 1: Update Fasting Glucose Label in HTML

**Files:**
- Modify: `index.html:320`

**Current:**
```html
<div class="slider-labels"><span style="flex:50">Normal</span><span style="flex:25">Pre-Diab.</span><span style="flex:175">Diabetes</span></div>
```

- [ ] **Step 1: Change "Pre-Diab." to "Prediabetes"**

```html
<div class="slider-labels"><span style="flex:50">Normal</span><span style="flex:25">Prediabetes</span><span style="flex:175">Diabetes</span></div>
```

- [ ] **Step 2: Verify in browser** (visual check of fasting glucose slider labels)

---

## Task 2: Expand Abbreviations in ui-controller.js

**Files:**
- Modify: `js/ui-controller.js:633, 688-692`
- Test: `tests/test-ui-controller.js:333, 359-363`

### Step 2.1: Update Non-Modifiable Summary

- [ ] **Step 2.1.1: Change "No family hist." to "No history of diabetes in family"**

Location: Line 633
Current:
```javascript
const parent = el('parentHist-toggle')?.checked ? 'Family history' : 'No family hist.';
```

New:
```javascript
const parent = el('parentHist-toggle')?.checked ? 'History of diabetes in family' : 'No history of diabetes in family';
```

### Step 2.2: Update Modifiable Summary Labels

- [ ] **Step 2.2.1: Change "Gluc:" to "Glucose:"**

Location: Line 688
Current:
```javascript
setText('summary-fastGlu', 'Gluc: ' + gVal + ' ' + gUnit);
```

New:
```javascript
setText('summary-fastGlu', 'Glucose: ' + gVal + ' ' + gUnit);
```

- [ ] **Step 2.2.2: Change "BP:" to "Blood Pressure:"**

Location: Line 690
Current:
```javascript
setText('summary-sbp',     'BP: ' + bp + ' mmHg');
```

New:
```javascript
setText('summary-sbp',     'Blood Pressure: ' + bp + ' mmHg');
```

- [ ] **Step 2.2.3: Keep "Waist:", "HDL:", "TG:" as-is** (these are clear enough as medical abbreviations)

### Step 2.3: Update Tests

- [ ] **Step 2.3.1: Update test for family history text**

Location: Line 333
Current:
```javascript
assert(ELEMS['summary-parent'].textContent === 'No family hist.', 'summary-parent = "No family hist." (toggle unchecked)');
```

New:
```javascript
assert(ELEMS['summary-parent'].textContent === 'No history of diabetes in family', 'summary-parent = "No history of diabetes in family" (toggle unchecked)');
```

- [ ] **Step 2.3.2: Update test data for checked parent toggle**

Location: Lines 324, 338-341 (setup/restore)
Need to add a test for the checked case.

Add after line 333:
```javascript
// Test checked case
ELEMS['parentHist-toggle'].checked = true;
UIC.updateNonModSummary();
assert(ELEMS['summary-parent'].textContent === 'History of diabetes in family', 'summary-parent = "History of diabetes in family" (toggle checked)');
ELEMS['parentHist-toggle'].checked = false;  // restore for next test
```

- [ ] **Step 2.3.3: Update test for glucose label**

Location: Line 359
Current:
```javascript
assert(ELEMS['summary-fastGlu'].textContent === 'Gluc: 5.8 mmol/L', 'summary-fastGlu correct');
```

New:
```javascript
assert(ELEMS['summary-fastGlu'].textContent === 'Glucose: 5.8 mmol/L', 'summary-fastGlu correct');
```

- [ ] **Step 2.3.4: Update test for blood pressure label**

Location: Line 361
Current:
```javascript
assert(ELEMS['summary-sbp'].textContent     === 'BP: 135 mmHg',     'summary-sbp correct');
```

New:
```javascript
assert(ELEMS['summary-sbp'].textContent     === 'Blood Pressure: 135 mmHg', 'summary-sbp correct');
```

---

## Task 3: Run Tests

- [ ] **Step 3.1: Run unit tests**

Command:
```bash
node tests/test-ui-controller.js
```

Expected: All tests pass (currently 49 tests in this file)

- [ ] **Step 3.2: Run full test suite**

Command:
```bash
node tests/test-all.js 2>&1 | tail -20
```

Expected: All 552 tests pass

---

## Task 4: Verification

- [ ] **Step 4.1: Manual verification in browser**

1. Open `index.html` in browser
2. Check fasting glucose slider labels show "Normal · Prediabetes · Diabetes"
3. Collapse "Demographics" section - verify shows full text (e.g., "No history of diabetes in family")
4. Collapse "Clinical Values" section - verify shows "Glucose:" and "Blood Pressure:" instead of abbreviations

- [ ] **Step 4.2: Commit changes**

```bash
git add index.html js/ui-controller.js tests/test-ui-controller.js
git commit -m "ui: expand abbreviations for better clarity

- Change 'Pre-Diab.' to 'Prediabetes' in fasting glucose slider
- Expand 'No family hist.' to 'No history of diabetes in family'
- Expand 'Family history' to 'History of diabetes in family'
- Expand 'Gluc:' to 'Glucose:' in clinical values summary
- Expand 'BP:' to 'Blood Pressure:' in clinical values summary
- Update corresponding unit tests"
```

---

## Summary of Changes

| Location | Before | After |
|----------|--------|-------|
| index.html:320 | Pre-Diab. | Prediabetes |
| ui-controller.js:633 | Family history / No family hist. | History of diabetes in family / No history of diabetes in family |
| ui-controller.js:688 | Gluc: | Glucose: |
| ui-controller.js:690 | BP: | Blood Pressure: |

**Risk Assessment:**
- Low risk - purely cosmetic text changes
- No logic changes
- No calculation changes
- Only affects collapsed summary display text
- Tests updated to match new expected values

**Impact:**
- Better readability for users
- Clearer medical terminology
- No functional impact on risk calculations
