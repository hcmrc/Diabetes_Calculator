# Contribution Chart Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify the Factor Contributions bar chart to improve patient comprehension and actionability.

**Architecture:** Replace the current diverging horizontal bar chart with a simplified, patient-focused design featuring: (1) Plain-language labels, (2) Clear visual hierarchy with "Your Priority" indicator, (3) Action-oriented tooltips, (4) Improved accessibility with larger fonts and touch-friendly interactions.

**Tech Stack:** Vanilla JavaScript, CSS (no framework changes), Lucide icons (already in use)

---

## UX Research Summary

### Top 5 Patient Issues Identified

| Issue | Severity | Affected Personas | Solution |
|-------|----------|-------------------|----------|
| Percentage meaning unclear | Critical | All | Replace with plain-language impact statements |
| Medical terminology barrier | High | Margaret, Sofia, James | Add plain-language labels |
| Visual direction confusion | Medium | Margaret, Sofia | Unify bar direction, add icons |
| No clear priority | Critical | All | Add "Your Priority" indicator |
| Accessibility failures | High | James, Margaret | Larger fonts, touch-friendly tooltips |

### Key Design Principles Applied

1. **Fitts's Law for cognition** - Reduce mental processing distance between seeing and understanding
2. **Progressive disclosure** - Show priority first, details on demand
3. **Action orientation** - Every element should guide toward improvement
4. **Accessibility first** - WCAG 2.1 AA compliance minimum

---

## File Structure

```
js/ui-controller.js     - Main rendering logic (modify)
js/config.js            - Add patient-friendly labels (modify)
style.css               - Styles for chart (modify)
index.html              - Container element (minor changes if needed)
```

---

## Task 1: Simplify Terminology

**Files:**
- Modify: `js/ui-controller.js` (lines 205, 231-239, 319-326)
- Modify: `index.html` (card title around line 426)

- [ ] **Step 1: Update summary banner text**

Current: "Your risk: 22.5% (Population average: 19%) - Net deviation: +3.5% vs. average"
Proposed: "Your risk: 22.5% - 3.5% higher than average"

- [ ] **Step 2: Update filter toggle text**

Current: "Show above average risk factors only"
Proposed: "Show only my risk factors"

- [ ] **Step 3: Update legend text**

Current: "Reduces Risk" / "Increases Risk" / "(% of risk change)"
Proposed: "Good for You" / "Could Improve" / "(relative to average)"

- [ ] **Step 4: Update card title in HTML**

Current: "Factor Contributions"
Proposed: "What Affects Your Risk"

- [ ] **Step 5: Commit terminology changes**

---

## Task 2: Add Plain-Language Factor Labels

**Files:**
- Modify: `js/config.js` (add PATIENT_LABELS object)
- Modify: `js/ui-controller.js` (use patient labels in rendering)

- [ ] **Step 1: Add patient-friendly labels to config**

Add new object after LABELS:
```javascript
PATIENT_LABELS: {
    age: 'Age',
    race: 'Ethnicity',
    parentHist: 'Family History',
    height: 'Height',
    waist: 'Waist Size',
    sbp: 'Blood Pressure',
    fastGlu: 'Blood Sugar',
    cholHDL: 'Good Cholesterol',
    cholTri: 'Blood Fats'
}
```

- [ ] **Step 2: Use patient labels in chart**

- [ ] **Step 3: Commit label changes**

---

## Task 3: Add Priority Indicator

**Files:**
- Modify: `js/ui-controller.js` (identify top risk factor, add badge)
- Modify: `style.css` (add priority badge styles)

- [ ] **Step 1: Identify and highlight top risk factor**

Find highest risk-increasing factor and flag with priority badge.

- [ ] **Step 2: Add priority badge HTML**

```html
<span class="priority-badge">Your Priority</span>
```

- [ ] **Step 3: Add CSS for priority badge**

```css
.priority-badge {
    background: linear-gradient(90deg, #ff9f0a, #ff6723);
    color: white;
    font-size: 9px;
    font-weight: 600;
    border-radius: 4px;
    padding: 2px 8px;
}
```

- [ ] **Step 4: Commit priority indicator**

---

## Task 4: Simplify Tooltip Messages

**Files:**
- Modify: `js/ui-controller.js` (lines 286-290)

- [ ] **Step 1: Replace tooltip with action-oriented message**

Current (risk-increasing): "Your [factor] is not working in your favor. Your [factor] increases your risk compared to the average by X%."
Proposed: "This raises your risk by X%. Talk to your doctor about lowering your [factor]."

Current (risk-reducing): "Your [factor] is working in your favor. Your [factor] decreases your risk compared to the average by X%."
Proposed: "This lowers your risk by X%. You're doing well here."

- [ ] **Step 2: Commit tooltip changes**

---

## Task 5: Improve Accessibility

**Files:**
- Modify: `style.css` (font sizes, touch targets)
- Modify: `js/ui-controller.js` (touch-friendly tooltip trigger)

- [ ] **Step 1: Increase font sizes for readability**

- Labels: 11px -> 14px
- Values: 10px -> 12px
- Summary: 10px -> 12px

- [ ] **Step 2: Add touch-friendly tooltip trigger**

Add click handler for mobile tap-to-show-tooltip.

- [ ] **Step 3: Add touch-friendly CSS**

```css
.contrib-row {
    min-height: 48px; /* iOS HIG minimum */
    padding: 12px 8px;
}
```

- [ ] **Step 4: Commit accessibility improvements**

---

## Task 6: Add Factor Icons

**Files:**
- Modify: `js/config.js` (add FACTOR_ICONS mapping)
- Modify: `js/ui-controller.js` (render icons)
- Modify: `style.css` (icon styling)

- [ ] **Step 1: Define icon mappings**

```javascript
FACTOR_ICONS: {
    fastGlu: 'droplet',
    waist: 'ruler',
    cholHDL: 'heart',
    cholTri: 'activity',
    sbp: 'gauge',
    age: 'calendar',
    race: 'user',
    parentHist: 'users',
    height: 'move-vertical'
}
```

- [ ] **Step 2: Render icons in chart**

- [ ] **Step 3: Add icon CSS**

- [ ] **Step 4: Reinitialize Lucide icons after render**

- [ ] **Step 5: Commit icon additions**

---

## Task 7: Update Header Layout

**Files:**
- Modify: `js/ui-controller.js` (lines 241-256)
- Modify: `style.css` (header styles)

- [ ] **Step 1: Simplify header to two-column**

Current: "Better than average" | "Population Average" | "Worse than average"
Proposed: "Good for You" | "|" | "Could Improve"

- [ ] **Step 2: Update CSS for simplified header**

- [ ] **Step 3: Commit header changes**

---

## Task 8: Test and Validate

**Files:**
- Modify: `tests/test-ui-controller.js` (add tests)

- [ ] **Step 1: Add test for patient labels**

- [ ] **Step 2: Add test for priority indicator**

- [ ] **Step 3: Run tests**

- [ ] **Step 4: Manual browser testing**

- [ ] **Step 5: Commit test additions**

---

## Verification

1. **Visual Verification**: Open in browser, verify all changes
2. **Accessibility Verification**: Zoom to 200%, test on mobile
3. **Functional Verification**: Run tests, check console

---

## Implementation Priority Order

| Priority | Task | Impact | Effort |
|----------|------|--------|--------|
| 1 | Task 1: Simplify Terminology | Critical | Low |
| 2 | Task 2: Plain-Language Labels | Critical | Low |
| 3 | Task 3: Priority Indicator | Critical | Medium |
| 4 | Task 4: Simplify Tooltips | High | Low |
| 5 | Task 5: Accessibility | High | Medium |
| 6 | Task 6: Add Icons | Medium | Medium |
| 7 | Task 7: Header Layout | Low | Low |
| 8 | Task 8: Test & Validate | Required | Medium |