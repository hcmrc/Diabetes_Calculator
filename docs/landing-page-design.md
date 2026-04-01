# Landing Page Design Specification

## Date: 2026-03-26
## Status: Approved for Implementation

---

## 1. Overview

A 5-step onboarding flow that appears as a full-screen overlay when users first open the Diabetes Risk Calculator. Settings are persistently saved to localStorage, and on subsequent visits only a minimal import prompt is shown.

---

## 2. Step Flow

### Step 1: Welcome
- App logo (Activity pulse icon)
- Title: "Diabetes Risk Calculator"
- Subtitle: "Understand your 9-year diabetes risk based on the ARIC Study"
- "Get Started" button

### Step 2: Language Selection
- 4 language cards: English, Deutsch, Francais, Espanol
- Uses existing flag SVGs from settings panel
- Selected state with checkmark
- Radio button behavior

### Step 3: Import Data
- 4 import options: Image Upload, PDF Upload, Excel Import, Encrypted File
- "Enter values manually" text link
- Optional step (can skip)

### Step 4: Tutorial Offer
- Large toggle: "Show me how to use this app"
- Visual preview cards showing key features
- Yes/No toggle

### Step 5: Ready
- Success animation with checkmark
- Summary of selections
- "Start Calculator" button
- "Start over and change settings" link

---

## 3. Navigation

### Progress Indicator
- 5 dots at top
- Current step highlighted (wider)
- Completed steps shown in green

### Navigation Buttons
- "Back" button (hidden on step 1)
- "Next" button (disabled when required selection missing)
- "Start Over" button in header (always visible after step 1)

### Keyboard Navigation
- Enter: Proceed to next step
- Escape: Go back (or close on step 1)
- Arrow keys: Navigate between options

---

## 4. Visual Design

### Colors (CSS Variables)
Must match existing style.css:
- Primary: #3a3a3c (--primary)
- Safe: #30a14e (--safe)
- Alert: #d4942c (--alert)
- Warning: #d4653a (--warning)
- Danger: #c43d35 (--danger)

### Typography
- Plus Jakarta Sans throughout
- Hero: 32px, weight 700
- Title: 24px, weight 700
- Body: 16px, weight 400
- Small: 14px, weight 400

### Layout
- Max container width: 720px
- Card-based selection UI
- Generous whitespace (Apple-inspired)
- Frosted glass overlay background

---

## 5. Integration Requirements

### i18n
All text must use DRC.I18n.t():
- landing.welcome.title
- landing.language.title
- landing.import.title
- landing.tutorial.title
- landing.ready.title

### Icons
- Use Lucide icons via data-lucide attributes
- Call DRC.UIHelpers.refreshIcons() after DOM updates

### Tutorial Integration
On finish, if tutorial enabled:
```javascript
if (state.tutorial && window.DRC?.Tutorial) {
    DRC.Tutorial.start();
}
```

### localStorage
Key: drc_landing_settings
Structure: { language, importType, tutorial, completed, timestamp }

### Dark Mode
Use existing dark mode CSS classes and patterns.

---

## 6. Accessibility

### ARIA Attributes
- role="dialog" on container
- aria-modal="true"
- aria-labelledby pointing to title
- role="radio" for selection cards

### Keyboard Navigation
- Tab: Focus through elements
- Enter: Select/Activate
- Escape: Go back
- All cards focusable with tabindex="0"

### Screen Readers
- Live region for step changes
- Proper labels on all buttons

---

## 7. Files to Create/Modify

### New Files
- js/landing-page.js - Main module
- Add translations to js/i18n/i18n-service.js

### Modified Files
- index.html - Add landing overlay HTML
- style.css - Add landing page styles
- js/main.js - Initialize landing page on load

---

## 8. State Management

```javascript
const state = {
    language: null,      // 'en', 'de', 'fr', 'es'
    importType: null,    // 'image', 'pdf', 'excel', 'encrypted', 'manual'
    tutorial: false,    // boolean
    completed: false     // persisted to localStorage
};
```

---

## 9. Event Handling

Use event delegation pattern:

```javascript
function bindEvents() {
    const overlay = document.getElementById('landingOverlay');
    overlay.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyboard);
}
```

---

## 10. Security Considerations

- No inline event handlers (CSP compatible)
- No innerHTML usage (use textContent)
- localStorage key namespaced with drc_

---

## Approved For Implementation

Design reviewed and approved.
