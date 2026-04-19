/**
 * @fileoverview Application controller — state management & event wiring.
 *
 * Orchestrates the interaction between the RiskModel and UIController
 * modules. Handles slider events, unit toggling, and reset logic.
 *
 * @module App
 * @memberof DRC
 */

'use strict';

DRC.App = (() => {
    const UI    = () => DRC.UIController;
    const Model = () => DRC.RiskModel;
    const CFG   = DRC.CONFIG;

    /** Application state (mutable). */
    const state = {
        isMetric: false,
        prevRiskPct: null,
        activeField: null,
        /**
         * Precise SI-unit values, updated on every calculation.
         * Used as the "source of truth" during unit switches to prevent
         * cumulative rounding drift from repeated conversions.
         */
        preciseSI: null,
        /** Active model identifier, references a key in CONFIG.MODELS. */
        activeModel: CFG.DEFAULT_MODEL
    };

    let _highlightedField = null;

    /** requestAnimationFrame ID for throttling slider input events. */
    let _rafId = null;

    // Cache for field elements (performance optimization)
    const fieldElementCache = new Map();

    /** Populate cache with all field elements. */
    const populateFieldCache = () => {
        fieldElementCache.clear();
        document.querySelectorAll('[data-field]').forEach(el => {
            const field = el.getAttribute('data-field');
            if (!fieldElementCache.has(field)) {
                fieldElementCache.set(field, []);
            }
            fieldElementCache.get(field).push(el);
        });
    };

    /** Re-apply cross-panel highlight after DOM re-renders. */
    const reapplyHighlight = () => {
        if (!_highlightedField) return;
        const elements = fieldElementCache.get(_highlightedField);
        if (elements) {
            elements.forEach(n => n.classList.add('factor-highlight'));
        }
    };

    // ─── Model selection ─────────────────────────────────────────────────

    /**
     * Return the currently active model object from CONFIG.MODELS.
     * @returns {Object} Model definition with intercept, betas, and field lists.
     */
    const getActiveModel = () => CFG.MODELS[state.activeModel];

    /**
     * Switch the active model and trigger a recalculation.
     * @param {string} modelId — Key from CONFIG.MODELS (e.g. 'clinical').
     */
    const switchModel = (modelId) => {
        if (!CFG.MODELS[modelId]) {
            console.error(`switchModel: unknown modelId "${modelId}"`);
            return;
        }
        state.activeModel = modelId;
        trigger('model:changed', { modelId, model: CFG.MODELS[modelId] });
        window.dispatchEvent(new CustomEvent('model:changed', { detail: { modelId } }));
        calculate();
    };

    // ─── Core calculation pipeline ──────────────────────────────────────

    /**
     * Full recalculation: reads inputs, runs the model, updates all UI.
     * @returns {number} Current risk percentage.
     */
    /**
     * Compute the "original" raw inputs by overriding any simulated
     * factors with their stored pre-simulation slider values.
     * Used to show the pre-treatment "Your Risk" reference value.
     * @param {Object} rawInputs - Current slider values
     * @returns {Object} Raw inputs with simulated factors reverted
     */
    const _getOriginalRawInputs = (rawInputs) => {
        const originals = DRC.TreatmentSimulator?.getOriginalValues?.() || null;
        if (!originals || Object.keys(originals).length === 0) return rawInputs;
        return { ...rawInputs, ...originals };
    };

    const calculate = () => {
        const activeModel   = getActiveModel();
        const rawInputs     = UI().readInputs();
        const siValsCurrent = Model().toSI(rawInputs, state.isMetric);
        state.preciseSI     = { ...siValsCurrent };   // Preserve full-precision SI values

        // "Your Risk" = risk based on the original (pre-simulation) slider values
        const rawOriginal     = _getOriginalRawInputs(rawInputs);
        const siValsOriginal  = Model().toSI(rawOriginal, state.isMetric);
        const _riskOriginal = Model().computeProbability(siValsOriginal, activeModel);
        const riskPctOriginal = (_riskOriginal != null && isFinite(_riskOriginal)) ? _riskOriginal * 100 : NaN;

        // "Your Risk with Chosen Treatments" = current (possibly simulated) risk
        const _riskCurrent = Model().computeProbability(siValsCurrent, activeModel);
        const riskPctCurrent  = (_riskCurrent != null && isFinite(_riskCurrent)) ? _riskCurrent * 100 : NaN;

        const logOddsContributions = Model().computeContributions(siValsCurrent, activeModel);
        const marginalSummary = Model().computeMarginalSummary(siValsCurrent, activeModel);
        const isMale        = rawInputs.sex === 1;
        const treatStatus   = Model().getElevatedFactors(siValsCurrent, isMale);

        // Render all views with the calculated data
        _renderAllViews(riskPctOriginal, riskPctCurrent, logOddsContributions, marginalSummary, treatStatus, siValsCurrent, activeModel);
        return riskPctCurrent;
    };

    /**
     * Render all views with calculated data.
     * @param {number} riskPctOriginal - Pre-simulation (baseline) risk percentage
     * @param {number} riskPctCurrent - Current (post-simulation) risk percentage
     * @param {Object} logOddsContributions - Log-odds contributions (for treatment recommendations)
     * @param {Object} marginalSummary - Marginal probability summary (for chart + treatments)
     * @param {Object} treatStatus - Treatment status with elevated factors
     * @param {Object} siVals - SI-unit values (current)
     * @param {Object} [model] - Active model definition from CONFIG.MODELS
     */
    const _renderAllViews = (riskPctOriginal, riskPctCurrent, logOddsContributions, marginalSummary, treatStatus, siVals, model) => {
        const isAnimating = DRC.TreatmentSimulator?.isAnimating?.() || false;

        // During treatment animation, skip heavy DOM rebuilds — only update
        // the lightweight risk displays. The full pipeline runs once after
        // the animation completes (via onSimulationComplete → risk:recalculate).
        UI().renderRisk(riskPctOriginal);
        UI().renderChosenRisk(riskPctCurrent, riskPctOriginal);
        UI().renderChosenTreatmentsList(DRC.TreatmentSimulator?.getSimulatedFactors?.() || []);

        if (isAnimating) return;

        UI().updateNonModSummary();
        UI().updateModSummary();
        UI().renderIconArray(riskPctOriginal);
        UI().renderContributionChart(marginalSummary);
        UI().renderTreatmentOverview(treatStatus, logOddsContributions, marginalSummary.contributions);

        if (state.activeField && state.prevRiskPct !== null) {
            UI().renderWhatIfBadge(state.activeField, riskPctCurrent - state.prevRiskPct);
        }

        // Refresh cache after DOM updates (for performance optimization)
        populateFieldCache();
        reapplyHighlight();

        // Refresh patient nav label to show current live risk percentage
        DRC.PatientManager?.updateNavLabel?.();
    };

    // ─── Slider event handlers ──────────────────────────────────────────

    const onSliderInput = (field) => {
        const slider = document.getElementById(`${field}-slider`);
        const input  = document.getElementById(`${field}-value`);
        if (slider && input) input.value = slider.value;
        UI().updateSliderFill(field);
        state.activeField = field;
        // Throttle calculate() to once per animation frame to avoid running
        // the full calculation pipeline on every ~60Hz input event.
        if (_rafId) cancelAnimationFrame(_rafId);
        _rafId = requestAnimationFrame(() => { calculate(); _rafId = null; });
    };

    const onSliderStart = (field) => {
        state.activeField = field;
        const raw = UI().readInputs();
        const _riskSlider = Model().computeProbability(Model().toSI(raw, state.isMetric));
        state.prevRiskPct = (_riskSlider != null && isFinite(_riskSlider)) ? _riskSlider * 100 : NaN;
    };

    /** @type {Object<string, number>} Active badge-clear timeouts per field. */
    const _badgeTimeouts = {};

    const onSliderEnd = (field) => {
        if (_badgeTimeouts[field]) clearTimeout(_badgeTimeouts[field]);
        _badgeTimeouts[field] = setTimeout(() => {
            const badge = document.getElementById(`what-if-${field}`);
            if (badge) badge.className = 'what-if-badge';
            delete _badgeTimeouts[field];
        }, 2000);
        state.prevRiskPct = null;
        state.activeField = null;
    };

    const onValueChange = (field) => {
        const slider = document.getElementById(`${field}-slider`);
        const input  = document.getElementById(`${field}-value`);
        if (!slider || !input) return;

        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        const step = parseFloat(slider.step) || 1;
        let val = parseFloat(input.value);
        if (!isFinite(val)) val = min;
        val = DRC.UIHelpers.clampAndRound(val, min, max, step);
        input.value  = val;
        slider.value = val;

        UI().updateSliderFill(field);
        calculate();
    };

    // ─── Unit toggle ────────────────────────────────────────────────────

    const onToggleUnits = () => {
        const prev = state.isMetric;
        const unitToggle = document.getElementById('unit-toggle');
        state.isMetric = unitToggle.checked;
        unitToggle.setAttribute('aria-checked', String(unitToggle.checked));
        if (prev === state.isMetric) return;

        // ── Rounding-drift prevention ──────────────────────────────────
        // Convert slider values FROM the stored precise SI values rather
        // than from the (rounded) DOM values. This eliminates cumulative
        // rounding errors that occur when converting back and forth:
        //   US 100 mg/dL → SI 5.6 (rounded) → US 100.8 (drift!)
        // By always starting from precise SI, the conversion is:
        //   preciseSI 5.5556 → US: 5.5556 / (1/18) = 100.0 (exact)
        //   preciseSI 5.5556 → SI: 5.5556 → display 5.6 (only display rounds)

        UI().updateUnitLabels(state.isMetric);
        UI().updateSliderRanges(state.isMetric ? 'si' : 'us');

        // Convert each convertible field from precise SI to target unit
        if (state.preciseSI) {
            const mode = state.isMetric ? 'si' : 'us';
            CFG.CONVERTIBLE_FIELDS.forEach(f => {
                const siVal = state.preciseSI[f];
                if (siVal == null) return;
                // Convert from SI to target display unit
                // When in SI mode: use siVal directly (just clamp/round)
                // When in US mode: convert from SI to US
                const converted = state.isMetric
                    ? siVal  // Already in SI, just need rounding
                    : DRC.ConversionService.convertField(f, siVal, false); // SI to US
                const [min, max, step] = CFG.RANGES[f][mode];
                const display = DRC.UIHelpers.clampAndRound(converted, min, max, step);
                const input  = document.getElementById(`${f}-value`);
                const slider = document.getElementById(`${f}-slider`);
                if (input)  input.value  = display;
                if (slider) slider.value = display;
            });
        }

        const sexIsMale = document.getElementById('sex-toggle')?.checked ?? true;
        UI().updateWaistSegments(sexIsMale, state.isMetric);
        UI().updateAllSliderFills();

        // Render with precise SI values (no rounding in the model path)
        const activeModel   = getActiveModel();
        const preciseSI     = state.preciseSI || Model().toSI(UI().readInputs(), state.isMetric);
        const _riskToggle = Model().computeProbability(preciseSI, activeModel);
        const riskPctCurrent = (_riskToggle != null && isFinite(_riskToggle)) ? _riskToggle * 100 : NaN;

        // Recompute "original" (pre-simulation) risk for the top field
        const rawOriginal     = _getOriginalRawInputs(UI().readInputs());
        const siValsOriginal  = Model().toSI(rawOriginal, state.isMetric);
        const _riskOrigToggle = Model().computeProbability(siValsOriginal, activeModel);
        const riskPctOriginal = (_riskOrigToggle != null && isFinite(_riskOrigToggle)) ? _riskOrigToggle * 100 : NaN;

        const logOddsContributions = Model().computeContributions(preciseSI, activeModel);
        const marginalSummary = Model().computeMarginalSummary(preciseSI, activeModel);
        const treatStatus   = Model().getElevatedFactors(preciseSI, sexIsMale);

        _renderAllViews(riskPctOriginal, riskPctCurrent, logOddsContributions, marginalSummary, treatStatus, preciseSI, activeModel);
    };

    // ─── Reset ──────────────────────────────────────────────────────────

    /**
     * Reset all inputs to the active patient's saved values, or to
     * CONFIG.DEFAULTS if no patient is loaded. This allows patients to
     * undo exploratory what-if changes and return to their saved baseline.
     *
     * Design rationale: Resetting to the active patient's values (rather
     * than fixed defaults) supports the EID principle of situation-specific
     * reference points (Vicente, 1999), enabling meaningful before/after
     * comparisons within a patient's clinical context.
     */
    const onReset = () => {
        const patientData = DRC.PatientManager?.getActivePatientData?.();
        const D = CFG.DEFAULTS;

        const setField = (field, val) => {
            const slider = document.getElementById(`${field}-slider`);
            const input  = document.getElementById(`${field}-value`);
            if (slider) slider.value = val;
            if (input)  input.value  = val;
        };

        if (patientData) {
            // Reset to active patient's saved values — applyValues handles unit conversion
            DRC.PatientManager.applyValues(patientData);
        } else {
            // No active patient: fall back to CONFIG defaults (US units)
            const unitToggle = document.getElementById('unit-toggle');
            unitToggle.checked = false;
            unitToggle.setAttribute('aria-checked', 'false');
            state.isMetric = false;
            UI().updateUnitLabels(false);
            UI().updateSliderRanges('us');

            setField('age', D.age);
            setField('sbp', D.sbp);
            setField('height',  D.height.us);
            setField('waist',   D.waist.us);
            setField('fastGlu', D.fastGlu.us);
            setField('cholHDL', D.cholHDL.us);
            setField('cholTri', D.cholTri.us);

            document.getElementById('sex-toggle').checked        = true; // Default: Male
            document.getElementById('sex-toggle').setAttribute('aria-checked', 'true');
            document.getElementById('sex-toggle').setAttribute('aria-label', 'Sex: Male');
            document.getElementById('race-toggle').checked      = D.race;
            document.getElementById('race-toggle').setAttribute('aria-checked', String(D.race));
            document.getElementById('race-toggle').setAttribute('aria-label', D.race ? 'Ethnicity: African American' : 'Ethnicity: Other');
            document.getElementById('parentHist-toggle').checked = D.parentHist;
            document.getElementById('parentHist-toggle').setAttribute('aria-checked', String(D.parentHist));
            document.getElementById('parentHist-toggle').setAttribute('aria-label', D.parentHist ? 'Parental diabetes history: Yes' : 'Parental diabetes history: No');
        }

        CFG.SLIDER_FIELDS.forEach(f => {
            const badge = document.getElementById(`what-if-${f}`);
            if (badge) badge.className = 'what-if-badge';
        });

        const isMale = document.getElementById('sex-toggle')?.checked ?? true;
        UI().updateWaistSegments(isMale, state.isMetric);
        UI().updateAllSliderFills();
        if (DRC.TreatmentSimulator?.resetSimulated) DRC.TreatmentSimulator.resetSimulated();
        calculate();
    };

    // ─── Initialization ─────────────────────────────────────────────────

    const init = () => {
        // Initialize i18n first (synchronous for file:// compatibility)
        DRC.I18n.init();
        DRC.I18n.translateDOM();
        DRC.I18nUI.init();
        // Slider event binding
        CFG.SLIDER_FIELDS.forEach(field => {
            const slider = document.getElementById(`${field}-slider`);
            if (!slider) return;
            slider.addEventListener('input',      () => onSliderInput(field));
            slider.addEventListener('mousedown',  () => onSliderStart(field));
            slider.addEventListener('touchstart', () => onSliderStart(field), { passive: true });
            slider.addEventListener('mouseup',    () => onSliderEnd(field));
            slider.addEventListener('touchend',   () => onSliderEnd(field));
        });

        // Value input change binding
        CFG.SLIDER_FIELDS.forEach(field => {
            const input = document.getElementById(`${field}-value`);
            if (input) input.addEventListener('change', () => onValueChange(field));
        });

        // Toggle inputs
        ['race-toggle', 'parentHist-toggle'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', () => {
                el.setAttribute('aria-checked', String(el.checked));
                // WCAG 4.1.2: aria-label must convey current state meaning
                if (id === 'race-toggle') {
                    el.setAttribute('aria-label', el.checked ? 'Ethnicity: African American' : 'Ethnicity: Other');
                } else if (id === 'parentHist-toggle') {
                    el.setAttribute('aria-label', el.checked ? 'Parental diabetes history: Yes' : 'Parental diabetes history: No');
                }
                calculate();
            });
        });

        // Sex toggle — also updates waist slider segments
        const sexToggle = document.getElementById('sex-toggle');
        if (sexToggle) sexToggle.addEventListener('change', () => {
            const isMale = sexToggle.checked;
            sexToggle.setAttribute('aria-checked', String(isMale));
            // WCAG 4.1.2: aria-label must convey current state meaning
            sexToggle.setAttribute('aria-label', isMale ? 'Sex: Male' : 'Sex: Female');
            UI().updateWaistSegments(isMale, state.isMetric);
            calculate();
        });

        // Unit toggle
        const unitToggle = document.getElementById('unit-toggle');
        if (unitToggle) unitToggle.addEventListener('change', onToggleUnits);

        // Action buttons
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) resetBtn.addEventListener('click', onReset);

        // Hero expandable toggle
        const expandHeroBtn = document.getElementById('expandHeroBtn');
        const heroExpandable = document.getElementById('hero-expandable');
        if (expandHeroBtn && heroExpandable) {
            expandHeroBtn.addEventListener('click', () => {
                const isOpen = heroExpandable.classList.toggle('open');
                expandHeroBtn.classList.toggle('open', isOpen);
                expandHeroBtn.setAttribute('aria-expanded', isOpen);
            });
        }

        // Cross-panel factor highlight on hover (CSS-based with JS synchronization)
        // Initial population
        populateFieldCache();

        // Event delegation on main panels for cross-panel highlighting
        // Uses mouseenter/mouseleave (fire once per element, NOT on every mouse move)
        const panels = ['panel-input', 'panel-model', 'panel-treatment'];
        panels.forEach(panelId => {
            const panel = document.getElementById(panelId);
            if (!panel) return;

            panel.addEventListener('mouseenter', (e) => {
                const fieldEl = e.target.closest('[data-field]');
                if (!fieldEl) return;
                const field = fieldEl.getAttribute('data-field');
                if (field === _highlightedField) return;

                _highlightedField = field;

                // Add highlight class to all matching elements (cross-panel sync)
                const elements = fieldElementCache.get(field);
                if (elements) {
                    elements.forEach(n => n.classList.add('factor-highlight'));
                }
            }, true); // Use capture for reliable detection

            panel.addEventListener('mouseleave', (e) => {
                const fieldEl = e.target.closest('[data-field]');
                if (!fieldEl) return;
                const field = fieldEl.getAttribute('data-field');
                if (field !== _highlightedField) return;

                // Remove highlight from all elements
                const elements = fieldElementCache.get(field);
                if (elements) {
                    elements.forEach(n => n.classList.remove('factor-highlight'));
                }

                _highlightedField = null;
            }, true); // Use capture for reliable detection
        });

        // Collapsible sections
        document.querySelectorAll('.section-collapse-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-target');
                const target = document.getElementById(targetId);
                if (!target) return;
                const collapsed = target.classList.toggle('collapsed');
                btn.classList.toggle('collapsed', collapsed);
                btn.setAttribute('aria-expanded', String(!collapsed));
                if (targetId === 'non-mod-section') {
                    document.getElementById('non-mod-summary')?.classList.toggle('visible', collapsed);
                }
                if (targetId === 'mod-section') {
                    document.getElementById('mod-summary')?.classList.toggle('visible', collapsed);
                }
            });
        });

        // Panel-level collapse buttons
        document.querySelectorAll('.panel-collapse-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const panelId = btn.getAttribute('data-panel');
                const panel = document.getElementById(panelId);
                if (!panel) return;
                const body = panel.querySelector('.panel-body');
                const subtitle = panel.querySelector('.panel-subtitle');
                const isCollapsed = btn.classList.toggle('collapsed');
                btn.setAttribute('aria-expanded', String(!isCollapsed));
                if (body) body.classList.toggle('panel-hidden', isCollapsed);
                if (subtitle) subtitle.classList.toggle('panel-hidden', isCollapsed);
            });
        });

        // ─── Model Change Handler ─────────────────────────────────────────
        // Update UI when model changes (from Settings Panel)
        on('model:changed', ({ modelId, model }) => {
            const t = DRC.Utils.createTranslator();

            // Update hero model info
            const infoName = document.getElementById('model-info-name');
            const infoAccuracy = document.getElementById('model-info-accuracy');
            if (infoName) infoName.textContent = t('models.' + modelId + '.name', model.name);
            if (infoAccuracy) infoAccuracy.textContent = t('models.accuracy.' + model.accuracy, model.accuracyLabel) + ' ' + t('models.accuracyLabel', 'Vorhersagegüte');

            // Toggle input field visibility
            const allFields = CFG.ALL_FIELDS;
            allFields.forEach(field => {
                const groups = document.querySelectorAll('.input-group[data-field="' + field + '"]');
                const isVisible = model.fields.includes(field);
                groups.forEach(g => g.classList.toggle('field-hidden', !isVisible));
            });
        });

        // Set initial hero info from default model
        const initialModel = getActiveModel();
        if (initialModel) {
            const t = DRC.Utils.createTranslator();
            const infoName = document.getElementById('model-info-name');
            const infoAccuracy = document.getElementById('model-info-accuracy');
            if (infoName) infoName.textContent = t('models.' + state.activeModel + '.name', initialModel.name);
            if (infoAccuracy) infoAccuracy.textContent = t('models.accuracy.' + initialModel.accuracy, initialModel.accuracyLabel) + ' ' + t('models.accuracyLabel', 'Vorhersagegüte');
        }

        // Initialize sub-modules and run first calculation
        const initMale = document.getElementById('sex-toggle')?.checked ?? true;
        UI().updateWaistSegments(initMale, state.isMetric);
        UI().updateAllSliderFills();
        calculate();

        // Subscribe to language changes to re-render dynamic content
        DRC.I18n.onLanguageChange(() => {
            DRC.I18n.translateDOM();
            calculate();
            // Update model switcher label and hero info with translated strings
            const currentModel = getActiveModel();
            if (currentModel) {
                const t = DRC.Utils.createTranslator();
                // Update hero model info (Settings Panel updates its own label)
                const infoName = document.getElementById('model-info-name');
                const infoAccuracy = document.getElementById('model-info-accuracy');
                if (infoName) infoName.textContent = t('models.' + state.activeModel + '.name', currentModel.name);
                if (infoAccuracy) infoAccuracy.textContent = t('models.accuracy.' + currentModel.accuracy, currentModel.accuracyLabel) + ' ' + t('models.accuracyLabel', 'Vorhersagegüte');
            }
            // Trigger global language changed event for other modules
            window.dispatchEvent(new CustomEvent('drc:language-changed-complete'));
        });
    };

    /**
     * Simple event bus for decoupled communication between modules.
     * Replaces direct method calls like DRC.App._calculate().
     */
    const eventListeners = Object.create(null); // No prototype chain lookups

    /**
     * Register an event listener.
     * @param {string} event — Event name.
     * @param {Function} callback — Callback function.
     * @returns {Function} Unsubscribe function to remove the listener.
     */
    const on = (event, callback) => {
        if (typeof callback !== 'function') {
            console.error(`Event listener for "${event}" must be a function, got ${typeof callback}`);
            return () => {};
        }
        // Reject prototype pollution keys
        if (event === '__proto__' || event === 'constructor' || event === 'prototype') {
            console.error(`Invalid event name: "${event}"`);
            return () => {};
        }
        if (!eventListeners[event]) eventListeners[event] = [];
        eventListeners[event].push(callback);

        // Return unsubscribe function
        return () => off(event, callback);
    };

    /**
     * Remove an event listener.
     * @param {string} event — Event name.
     * @param {Function} callback — Callback function to remove.
     */
    const off = (event, callback) => {
        if (!eventListeners[event]) return;
        eventListeners[event] = eventListeners[event].filter(cb => cb !== callback);
        // Clean up empty arrays
        if (eventListeners[event].length === 0) {
            delete eventListeners[event];
        }
    };

    /**
     * Trigger an event with optional data.
     * @param {string} event — Event name.
     * @param {*} data — Data to pass to listeners.
     */
    const trigger = (event, data) => {
        if (!eventListeners[event]) return;
        eventListeners[event].forEach(cb => {
            try {
                cb(data);
            } catch (err) {
                console.error(`Error in event listener for "${event}":`, err);
            }
        });
    };

    // Register core events
    on('risk:recalculate', calculate);

    return { init, _calculate: calculate, _getState: () => ({ ...state }), on, off, trigger, switchModel, getActiveModel };
})();
