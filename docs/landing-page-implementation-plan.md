# Landing Page Implementation Plan

## Date: 2026-03-26
## Status: Ready for Implementation

---

## Overview

A 6-step onboarding flow that appears as a full-screen overlay when users first open the Diabetes Risk Calculator. Settings are persistently saved to localStorage.

---

## Steps

1. Welcome - App intro with Get Started button
2. Language Selection - 4 languages (EN, DE, FR, ES)
3. Model Selection - Clinical Only / Clinical + Glucose / Complete Model
4. Import Data - Image, PDF, Excel, Encrypted options
5. Tutorial Offer - Yes/No toggle
6. Ready - Summary and Start Calculator

---

## Files to Create/Modify

### New Files
- js/landing-page.js - Main module with step rendering

### Modified Files
- index.html - Add landing overlay HTML structure
- style.css - Add landing page styles (uses existing CSS vars)
- js/main.js - Initialize landing page
- js/i18n/i18n-service.js - Add landing translations

---

## HTML Structure (index.html)

Add after body tag, before nav:

```html
<div id="landingOverlay" class="landing-overlay" role="dialog" aria-modal="true" hidden>
    <div class="landing-container">
        <div class="landing-header">
            <div class="landing-header-top">
                <span class="step-counter" id="landingStepCounter"></span>
                <button type="button" class="restart-btn" id="landingRestartBtn" hidden>
                    <i data-lucide="rotate-ccw"></i> Start Over
                </button>
            </div>
            <div class="progress-dots" id="landingProgressDots"></div>
        </div>
        <div class="landing-content" id="landingContent"></div>
        <div class="landing-footer">
            <button type="button" class="btn btn-secondary" id="landingBackBtn" hidden>Back</button>
            <button type="button" class="btn btn-primary" id="landingNextBtn">Next</button>
            <button type="button" class="btn btn-primary" id="landingFinishBtn" hidden>Start Calculator</button>
        </div>
    </div>
</div>
```

---

## CSS (style.css)

Add to end of file:

```css
/* Landing Page */
.landing-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(8px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-5);
}

.landing-container {
    width: 100%;
    max-width: 720px;
    max-height: 90vh;
    background: var(--bg-card);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-lg);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.landing-header {
    padding: var(--space-6) var(--space-7) var(--space-4);
    border-bottom: 1px solid var(--border);
}

.landing-header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-4);
}

.progress-dots {
    display: flex;
    justify-content: center;
    gap: var(--space-2);
}

.progress-dot {
    width: 8px;
    height: 8px;
    border-radius: var(--radius-full);
    background: var(--border-strong);
    transition: all 0.25s ease;
}

.progress-dot.active { background: var(--primary); width: 24px; }
.progress-dot.completed { background: var(--safe); }

.restart-btn {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-2);
    background: none;
    border: none;
    color: var(--text-tertiary);
    font-family: inherit;
    font-size: var(--text-xs);
    cursor: pointer;
    border-radius: var(--radius-sm);
}

.restart-btn:hover {
    background: var(--primary-light);
    color: var(--text-secondary);
}

.landing-content {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-6) var(--space-7);
}

.landing-footer {
    padding: var(--space-5) var(--space-7);
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.landing-step { display: none; animation: landingFadeIn 0.3s ease; }
.landing-step.active { display: block; }

@keyframes landingFadeIn {
    from { opacity: 0; transform: translateX(10px); }
    to { opacity: 1; transform: translateX(0); }
}

.landing-welcome {
    text-align: center;
    padding: var(--space-8) 0;
}

.landing-welcome-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto var(--space-6);
    background: linear-gradient(135deg, var(--safe), #28a745);
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
}

.landing-welcome-icon i[data-lucide] {
    width: 40px;
    height: 40px;
    color: white;
}

.landing-cards {
    display: grid;
    gap: var(--space-3);
}

.landing-cards.four-col { grid-template-columns: repeat(4, 1fr); }
.landing-cards.two-col { grid-template-columns: repeat(2, 1fr); }

@media (max-width: 640px) {
    .landing-cards.four-col { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 480px) {
    .landing-cards.four-col,
    .landing-cards.two-col { grid-template-columns: 1fr; }
}

.landing-card {
    background: var(--bg-card);
    border: 2px solid var(--border);
    border-radius: var(--radius);
    padding: var(--space-5);
    cursor: pointer;
    transition: all 0.25s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: var(--space-3);
    position: relative;
}

.landing-card:hover {
    border-color: var(--border-strong);
    transform: translateY(-2px);
    box-shadow: var(--shadow);
}

.landing-card.selected {
    border-color: var(--primary);
    background: var(--primary-light);
}

.landing-card .check-indicator {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 24px;
    height: 24px;
    border-radius: var(--radius-full);
    border: 2px solid var(--border-strong);
    display: flex;
    align-items: center;
    justify-content: center;
}

.landing-card.selected .check-indicator {
    background: var(--primary);
    border-color: var(--primary);
}

.landing-card .check-indicator i[data-lucide] {
    width: 14px;
    height: 14px;
    color: white;
    opacity: 0;
}

.landing-card.selected .check-indicator i[data-lucide] { opacity: 1; }

.landing-tutorial-toggle {
    background: var(--bg-page);
    border: 2px solid transparent;
    border-radius: var(--radius);
    padding: var(--space-5);
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    transition: all 0.25s ease;
}

.landing-tutorial-toggle:hover { background: var(--primary-light); }
.landing-tutorial-toggle.active { background: var(--primary-light); border-color: var(--primary); }

.landing-ready {
    text-align: center;
    padding: var(--space-6) 0;
}

.landing-success-icon {
    width: 100px;
    height: 100px;
    margin: 0 auto var(--space-6);
    background: var(--safe);
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: successPop 0.5s ease-out;
}

@keyframes successPop {
    0% { transform: scale(0); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
}
```

---

## JavaScript Module (js/landing-page.js)

Key implementation details:

```javascript
// Module: DRC.LandingPage
// Storage key: drc_landing_settings
// Structure: { language, model, importType, tutorial, completed, timestamp }

const TOTAL_STEPS = 6;

// Event delegation pattern (no inline handlers)
overlay.addEventListener('click', handleClick);
document.addEventListener('keydown', handleKeyboard);

// Step renderers create DOM elements (no innerHTML)
function renderWelcomeStep() {
    const div = document.createElement('div');
    div.className = 'landing-step active landing-welcome';
    // Build DOM using createElement and appendChild
    // Use textContent for text, not innerHTML
    return div;
}

// Save to localStorage
localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

// Apply language
if (state.language && DRC.I18n) {
    DRC.I18n.setLanguage(state.language);
}

// Start tutorial if enabled
if (state.tutorial && DRC.Tutorial) {
    DRC.Tutorial.start();
}
```

---

## i18n Keys to Add

```javascript
landing: {
    welcome: {
        title: 'Diabetes Risk Calculator',
        subtitle: 'Understand your 9-year diabetes risk based on the ARIC Study',
        getStarted: 'Get Started'
    },
    language: {
        title: 'Choose Your Language',
        subtitle: 'Select your preferred language'
    },
    model: {
        title: 'Choose Prediction Model',
        subtitle: 'Select how many values to enter',
        clinical: { name: 'Clinical Only', desc: 'Body measurements only', values: 'Age, Sex, Waist, Height, Blood Pressure' },
        clinicalGlucose: { name: 'Clinical + Glucose', desc: 'Clinical values plus glucose', values: 'Adds Fasting Glucose' },
        complete: { name: 'Complete Model', desc: 'All lab values for best accuracy', values: 'Adds HDL Cholesterol and Triglycerides' }
    },
    import: {
        title: 'Import Your Data',
        subtitle: 'Import from file or enter manually',
        image: 'Image Upload',
        pdf: 'PDF Upload',
        excel: 'Excel Import',
        encrypted: 'Encrypted File',
        skip: 'Enter values manually instead'
    },
    tutorial: {
        title: 'Would you like a tour?',
        subtitle: 'Learn how to use the app',
        yes: 'Show me how to use this app'
    },
    ready: {
        title: 'You\'re all set!',
        start: 'Start Calculator',
        restart: 'Start over and change settings'
    },
    stepCounter: 'Step {step} of {total}',
    back: 'Back',
    next: 'Next',
    restart: 'Start Over'
}
```

---

## Implementation Order

1. Developer 1: HTML + CSS (2-3 hours)
   - Add overlay HTML to index.html
   - Add CSS to style.css
   - Test visual appearance

2. Developer 2: JavaScript Module (4-5 hours)
   - Create js/landing-page.js
   - Implement all 6 step renderers
   - Use DOM methods, not innerHTML
   - Test navigation

3. Senior Dev 1: Integration + i18n (2-3 hours)
   - Add translations to i18n-service.js
   - Connect to Tutorial module
   - Test language switching

4. Senior Dev 2: Testing + Polish (2-3 hours)
   - Run test suite (476 tests)
   - Keyboard navigation
   - Dark mode
   - Mobile responsive
   - Accessibility

---

## Testing Checklist

- [ ] All 6 steps display correctly
- [ ] Navigation (Next, Back, Restart)
- [ ] Language selection (4 options)
- [ ] Model selection (3 options)
- [ ] Import options (4 + skip)
- [ ] Tutorial toggle
- [ ] localStorage persistence
- [ ] Skip on subsequent visits
- [ ] Keyboard navigation
- [ ] Dark mode
- [ ] Mobile responsive
- [ ] 476 tests pass
- [ ] No CSP violations
- [ ] Screen reader compatible

---

## Ready for Implementation

Execute in order. Each phase should be reviewed before proceeding.