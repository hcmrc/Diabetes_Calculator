/**
 * @fileoverview Application controller — state management & event wiring.
 *
 * Orchestrates the interaction between the RiskModel, UIController,
 * and TimelineChart modules. Handles slider events, unit
 * toggling, reset, snapshot, and scenario comparison logic.
 *
 * @module App
 * @memberof DRC
 */

'use strict';

DRC.App = (() => {
    const UI    = () => DRC.UIController;
    const Model = () => DRC.RiskModel;
    const Timeline = () => DRC.TimelineChart;
    const CFG   = DRC.CONFIG;

    /** Application state (mutable). */
    const state = {
        isMetric: false,
        prevRiskPct: null,
        activeField: null,
        baselineRisk: null,
        isComparingScenario: false,
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
    const calculate = () => {
        const activeModel   = getActiveModel();
        const rawInputs     = UI().readInputs();
        const siVals        = Model().toSI(rawInputs, state.isMetric);
        state.preciseSI     = { ...siVals };   // Preserve full-precision SI values
        const riskPct       = Model().computeProbability(siVals, activeModel) * 100;
        const logOddsContributions = Model().computeContributions(siVals, activeModel);
        const marginalSummary = Model().computeMarginalSummary(siVals, activeModel);
        const isMale        = rawInputs.sex === 1;
        const treatStatus   = Model().getElevatedFactors(siVals, isMale);

        // Render all views with the calculated data
        _renderAllViews(riskPct, logOddsContributions, marginalSummary, treatStatus, siVals, activeModel);
        return riskPct;
    };

    /**
     * Render all views with calculated data.
     * @param {number} riskPct - Current risk percentage
     * @param {Object} logOddsContributions - Log-odds contributions (for treatment recommendations)
     * @param {Object} marginalSummary - Marginal probability summary (for chart + treatments)
     * @param {Object} treatStatus - Treatment status with elevated factors
     * @param {Object} siVals - SI-unit values
     * @param {Object} [model] - Active model definition from CONFIG.MODELS
     */
    const _renderAllViews = (riskPct, logOddsContributions, marginalSummary, treatStatus, siVals, model) => {
        UI().renderRisk(riskPct);
        UI().updateNonModSummary();
        UI().updateModSummary();
        UI().renderIconArray(riskPct);
        UI().renderContributionChart(marginalSummary);
        UI().renderTreatmentOverview(treatStatus, logOddsContributions, marginalSummary.contributions);
        UI().renderTreatmentRecommendations(treatStatus, logOddsContributions);
        UI().renderCausalityChains(siVals, treatStatus.elevatedFactors, marginalSummary.contributions);

        if (state.isComparingScenario && state.baselineRisk !== null) {
            UI().renderScenarioComparison(state.baselineRisk, riskPct);
        }

        if (state.activeField && state.prevRiskPct !== null) {
            UI().renderWhatIfBadge(state.activeField, riskPct - state.prevRiskPct);
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
        calculate();
    };

    const onSliderStart = (field) => {
        state.activeField = field;
        const raw = UI().readInputs();
        state.prevRiskPct = Model().computeProbability(Model().toSI(raw, state.isMetric)) * 100;
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

        let val = parseFloat(input.value);
        val = Math.min(Math.max(val, parseFloat(slider.min)), parseFloat(slider.max));
        input.value  = val;
        slider.value = val;

        UI().updateSliderFill(field);
        calculate();
    };

    // ─── Unit toggle ────────────────────────────────────────────────────

    const onToggleUnits = () => {
        const prev = state.isMetric;
        state.isMetric = document.getElementById('unit-toggle').checked;
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
        const riskPct       = Model().computeProbability(preciseSI, activeModel) * 100;
        const logOddsContributions = Model().computeContributions(preciseSI, activeModel);
        const marginalSummary = Model().computeMarginalSummary(preciseSI, activeModel);
        const treatStatus   = Model().getElevatedFactors(preciseSI, sexIsMale);

        _renderAllViews(riskPct, logOddsContributions, marginalSummary, treatStatus, preciseSI, activeModel);
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
            document.getElementById('unit-toggle').checked = false;
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
            document.getElementById('race-toggle').checked      = D.race;
            document.getElementById('parentHist-toggle').checked = D.parentHist;
        }

        CFG.SLIDER_FIELDS.forEach(f => {
            const badge = document.getElementById(`what-if-${f}`);
            if (badge) badge.className = 'what-if-badge';
        });

        const isMale = document.getElementById('sex-toggle')?.checked ?? true;
        UI().updateWaistSegments(isMale, state.isMetric);
        UI().updateAllSliderFills();
        Timeline().clear();
        if (DRC.TreatmentSimulator?.resetSimulated) DRC.TreatmentSimulator.resetSimulated();
        calculate();
    };

    // ─── Snapshot & scenario comparison ─────────────────────────────────

    const onSnapshot = () => {
        const raw   = UI().readInputs();
        const si    = Model().toSI(raw, state.isMetric);
        const risk  = Model().computeProbability(si) * 100;
        Timeline().addSnapshot(risk, si);
    };

    const onCompareScenario = () => {
        const raw  = UI().readInputs();
        const si   = Model().toSI(raw, state.isMetric);
        const risk = Model().computeProbability(si) * 100;

        state.isComparingScenario = !state.isComparingScenario;
        const btn   = document.getElementById('compareScenarioBtn');
        const panel = document.getElementById('scenario-comparison');

        if (state.isComparingScenario) {
            state.baselineRisk = risk;
            if (btn) {
                btn.classList.add('active');
                btn.textContent = '';
                const icon = document.createElement('i');
                icon.setAttribute('data-lucide', 'flag');
                icon.className = 'lucide-icon';
                btn.appendChild(icon);
                btn.appendChild(document.createTextNode(' Reset Baseline'));
                DRC.UIHelpers.refreshIcons();
            }
            if (panel) panel.style.display = 'flex';
            UI().renderScenarioComparison(state.baselineRisk, risk);
            Timeline().setBaseline(risk); // render() handles lucide.createIcons() internally
        } else {
            state.baselineRisk = null;
            Timeline().clearBaseline();
            if (btn) {
                btn.classList.remove('active');
                btn.textContent = '';
                const icon = document.createElement('i');
                icon.setAttribute('data-lucide', 'flag');
                icon.className = 'lucide-icon';
                btn.appendChild(icon);
                btn.appendChild(document.createTextNode(' ' + DRC.I18n?.t('buttons.setBaseline', 'Set Baseline')));
                DRC.UIHelpers.refreshIcons();
            }
            if (panel) panel.style.display = 'none';
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
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
            if (el) el.addEventListener('change', calculate);
        });

        // Sex toggle — also updates waist slider segments
        const sexToggle = document.getElementById('sex-toggle');
        if (sexToggle) sexToggle.addEventListener('change', () => {
            const isMale = sexToggle.checked;
            UI().updateWaistSegments(isMale, state.isMetric);
            calculate();
        });

        // Unit toggle
        const unitToggle = document.getElementById('unit-toggle');
        if (unitToggle) unitToggle.addEventListener('change', onToggleUnits);

        // Action buttons
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) resetBtn.addEventListener('click', onReset);
        const snapshotBtn = document.getElementById('snapshotBtn');
        if (snapshotBtn) snapshotBtn.addEventListener('click', onSnapshot);
        const compareScenarioBtn = document.getElementById('compareScenarioBtn');
        if (compareScenarioBtn) compareScenarioBtn.addEventListener('click', onCompareScenario);

        // Timeline expandable toggle
        const timelineToggleBtn = document.getElementById('timelineToggleBtn');
        const timelineExpandable = document.getElementById('timeline-expandable');
        if (timelineToggleBtn && timelineExpandable) {
            timelineToggleBtn.addEventListener('click', () => {
                const isOpen = timelineExpandable.classList.toggle('open');
                timelineToggleBtn.classList.toggle('active', isOpen);
            });
        }

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

        // Tab navigation — scoped per panel so Model and Treatment tabs
        // operate independently and don't interfere with each other.
        document.querySelectorAll('.model-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const panelBody = tab.closest('.panel-body');
                if (!panelBody) return;
                panelBody.querySelectorAll('.model-tab').forEach(t => t.classList.remove('active'));
                panelBody.querySelectorAll('.model-tab-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                const target = document.getElementById('tab-' + tab.getAttribute('data-tab'));
                if (target) target.classList.add('active');
            });
        });

        // Collapsible sections
        document.querySelectorAll('.section-collapse-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-target');
                const target = document.getElementById(targetId);
                if (!target) return;
                const collapsed = target.classList.toggle('collapsed');
                btn.classList.toggle('collapsed', collapsed);
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
            // Update baseline button text based on current state
            const btn = document.getElementById('timelineBaselineBtn');
            if (btn) {
                const baseLabel = DRC.I18n?.t('buttons.setBaseline', 'Set Baseline');
                const resetLabel = DRC.I18n?.t('buttons.resetBaseline', 'Reset Baseline');
                btn.textContent = '';
                const icon = document.createElement('i');
                icon.setAttribute('data-lucide', 'flag');
                icon.className = 'lucide-icon';
                btn.appendChild(icon);
                btn.appendChild(document.createTextNode(' ' + (state.isComparingScenario ? resetLabel : baseLabel)));
                DRC.UIHelpers?.refreshIcons();
            }
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

    /** Activate scenario-comparison mode (called by TreatmentSimulator). */
    const setCompareScenario = (baselineRisk) => {
        state.isComparingScenario = true;
        state.baselineRisk = baselineRisk;
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

    return { init, _calculate: calculate, _getState: () => ({ ...state }), _setCompareScenario: setCompareScenario, on, off, trigger, switchModel, getActiveModel };
})();
